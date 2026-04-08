import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const SEVERITY_ORDER = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

/**
 * Extract the DISTRICT (not city) from a Nominatim display_name.
 * 
 * Nominatim format: "Ibbagamuwa, Kurunegala District, Sri Lanka"
 *   parts[0] = city       → "Ibbagamuwa"
 *   parts[1] = district   → "Kurunegala District"
 *   parts[2] = country    → "Sri Lanka"
 * 
 * We need parts[1] for DB matching, falling back to parts[0] if only one segment.
 */
const extractDistrict = (name) => {
  if (!name) return "";
  const parts = name.split(",").map(p => p.trim());

  // If there are multiple parts, the district is typically the second segment
  if (parts.length > 1) {
    return parts[1].toLowerCase().replace(/district/gi, "").trim();
  }

  // Fallback: single segment (user typed a district name directly)
  return parts[0].toLowerCase().replace(/district/gi, "").trim();
};



function mapExternalSeverity(eventString) {
  if (!eventString) return 'MEDIUM';
  const lower = eventString.toLowerCase();
  if (lower.includes('warning') || lower.includes('extreme') || lower.includes('severe') || lower.includes('danger')) return 'CRITICAL';
  if (lower.includes('alert') || lower.includes('watch') || lower.includes('high')) return 'HIGH';
  if (lower.includes('advisory')) return 'MEDIUM';
  return 'LOW';
}

export const useWeatherData = (initialLocMode = 'my', initialLocation = null) => {
  const [weather, setWeather] = useState(null);
  const [risk, setRisk] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [locMode, setLocMode] = useState(initialLocMode);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  const fetchAll = useCallback(async (isRefresh = false, overrideLoc = null, overrideMode = null) => {
    const currentMode = overrideMode || locMode;
    const currentLocation = overrideLoc || selectedLocation;

    if (currentMode === 'search' && !currentLocation) {
        setError('Please select a location to view weather data.');
        setWeather(null);
        setRisk(null);
        setForecast([]);
        setAlerts([]);
        return;
    }

    if (isRefresh) {
        setRefreshing(true);
    } else {
        setLoading(true);
        setWeather(null);
        setRisk(null);
        setForecast([]);
        setAlerts([]);
    }
    setError('');

    try {
      let lat, lon, districtName;
      let dbData = [];

      if (currentMode === 'my') {
        // Step 1: Fetch user's weather + extract location info
        const myRes = await api.get('/weather/my');
        setWeather(myRes.data.data || null);

        const loc = myRes.data.location;
        lat = loc?.lat || currentLocation?.lat;
        lon = loc?.lon || currentLocation?.lon;

        // Step 2: Use Reverse Geocoding to find precise district
        let userDistrict = null;
        
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const geoData = await geoRes.json();
          
          const address = geoData.address || {};
          
          userDistrict = 
            address.county || 
            address.state_district || 
            address.state || 
            address.city || 
            null;
            
          if (userDistrict) {
            userDistrict = userDistrict.toLowerCase().replace(/district/gi, "").trim();
          }
        } catch (e) {
          console.warn("[useWeatherData] Reverse geocoding failed", e);
        }

        console.log('[useWeatherData] My Location — City:', loc?.city, '| Resolved District:', userDistrict);

        // Step 3: Fetch DB Alerts using unified district logic
        if (userDistrict) {
          try {
            const res = await api.get('/alerts', {
              params: { district: userDistrict, isActive: true }
            });
            const fetchedData = res.data.data || [];
            dbData = fetchedData;
            console.log('[useWeatherData] My Location — District used:', userDistrict);
            console.log('[useWeatherData] My Location — Alerts from backend:', dbData);
          } catch (dbErr) {
            console.warn('[useWeatherData] Failed to fetch district alerts', dbErr);
            dbData = [];
          }
        } else {
          dbData = [];
        }

      } else {
        // SEARCH MODE
        lat = currentLocation.lat;
        lon = currentLocation.lon;
        
        // Extract district (parts[1]) from display_name, not city (parts[0])
        districtName = extractDistrict(currentLocation.displayName || currentLocation.name);
        const cityName = (currentLocation.displayName || currentLocation.name).split(',')[0]?.trim();
        console.log('[useWeatherData] City:', cityName, '| District:', districtName);

        const wRes = await api.get(`/weather/current?lat=${lat}&lon=${lon}`);
        setWeather(wRes.data.data || null);

        // Always pass district param — never fetch all alerts
        if (districtName) {
          try {
            const dbRes = await api.get('/alerts', {
              params: { district: districtName, isActive: true }
            });
            const fetchedData = dbRes.data.data || [];
            dbData = fetchedData;
            console.log('[useWeatherData] Search — District used:', districtName);
            console.log('[useWeatherData] Search — Alerts from backend:', dbData);
          } catch (dbErr) {
            console.warn('[useWeatherData] Failed to fetch district alerts', dbErr);
            dbData = [];
          }
        } else {
          dbData = [];
        }
      }

      if (lat && lon) {
        // Parallel fetch for risk, forecast, external alerts
        const [rRes, fRes, extAlertsRes] = await Promise.allSettled([
          api.get(`/weather/risk?lat=${lat}&lon=${lon}`),
          api.get(`/weather/forecast?lat=${lat}&lon=${lon}`),
          api.get(`/weather/external-alerts?lat=${lat}&lon=${lon}`)
        ]);

        setRisk(rRes.status === 'fulfilled' ? rRes.value.data.data : null);
        setForecast(fRes.status === 'fulfilled' ? (fRes.value.data.data || []) : []);

        const extData = extAlertsRes.status === 'fulfilled' ? extAlertsRes.value.data.alerts : [];

        // Format OpenWeather alerts
        const formattedExt = (Array.isArray(extData) ? extData : []).map(a => ({
          source: 'external',
          severity: mapExternalSeverity(a.event),
          title: a.event || 'Weather Alert',
          description: a.description || 'No description available.',
          start: a.start,
          end: a.end
        }));

        // Format DB alerts
        const formattedDb = (Array.isArray(dbData) ? dbData : []).map(a => {
           const startTime = new Date(a.startAt || a.createdAt).getTime() / 1000;
           return {
             source: 'system',
             severity: (a.severity && typeof a.severity === 'string') ? a.severity.toUpperCase() : 'MEDIUM',
             title: a.title || 'System Alert',
             description: a.description || 'No description available.',
             start: startTime,
             end: null
           };
        });

        let mergedAlerts = [...formattedExt, ...formattedDb];

        // Deduplication based on title and start time
        const uniqueAlertsMap = new Map();
        mergedAlerts.forEach(alert => {
            const key = `${alert.title.toLowerCase().trim()}-${alert.start}`;
            if (!uniqueAlertsMap.has(key)) {
                uniqueAlertsMap.set(key, alert);
            }
        });
        mergedAlerts = Array.from(uniqueAlertsMap.values());

        // Sorting: Severity Priority then Newest First
        mergedAlerts.sort((a, b) => {
          const sevA = SEVERITY_ORDER[a.severity] || 0;
          const sevB = SEVERITY_ORDER[b.severity] || 0;
          if (sevA !== sevB) return sevB - sevA; // descending severity
          return (b.start || 0) - (a.start || 0); // newest first
        });

        setAlerts(mergedAlerts);
      }

    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to load weather data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locMode, selectedLocation]);

  useEffect(() => {
    // Initial mount action
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationSelect = useCallback((loc) => {
    setSelectedLocation(loc);
    setLocMode('search');
    fetchAll(false, loc, 'search');
  }, [fetchAll]);

  const handleModeChange = useCallback((mode) => {
    if (mode === locMode) return;
    setLocMode(mode);
    fetchAll(false, mode === 'my' ? null : selectedLocation, mode);
  }, [locMode, selectedLocation, fetchAll]);

  const refreshFn = useCallback(() => {
    fetchAll(true);
  }, [fetchAll]);

  return {
    weather,
    risk,
    forecast,
    alerts,
    loading,
    error,
    refreshing,
    locMode,
    selectedLocation,
    handleLocationSelect,
    handleModeChange,
    refreshFn
  };
};
