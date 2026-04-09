import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';

const SEVERITY_ORDER = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

/**
 * Extract the DISTRICT (not city) from a Nominatim display_name safely.
 *
 * Nominatim format examples:
 *   "Ibbagamuwa, Kurunegala District, North Western Province, Sri Lanka"
 *   → finds "Kurunegala District" → returns "kurunegala"
 *
 * Returns null (not empty string) if extraction fails, so callers
 * can safely guard against fetching alerts without a district.
 */
const extractDistrict = (name) => {
  if (!name) return null;

  const parts = name.split(',').map(p => p.trim().toLowerCase());

  // 1. Prefer an explicit district segment (e.g. "Kurunegala District")
  let district =
    parts.find(p => p.includes('district')) ||
    parts.find(p => p.includes('county'));

  // 2. If not found, use second part ONLY if it is NOT a province
  //    e.g. "Colombo, Western Province, Sri Lanka" → skip parts[1], use parts[0]
  if (!district && parts.length > 1) {
    const second = parts[1];
    if (!second.includes('province')) {
      district = second;
    }
  }

  // 3. Final fallback → first part (city-level mapping)
  if (!district) {
    district = parts[0];
  }

  // Clean and normalise
  return district
    ?.replace(/district|province|county/gi, '')
    .trim() || null;
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

  const abortControllerRef = useRef(null);

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
    }
    
    // Attempt request cancellation for fast typing/overlapping fetches
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setError('');

    try {
      let lat, lon, districtName;

      // 1. Determine lat/lon and precise district depending on mode
      if (currentMode === 'my') {
        const myRes = await api.get('/weather/my', { signal });
        const loc = myRes.data.location;
        lat = loc?.lat || currentLocation?.lat;
        lon = loc?.lon || currentLocation?.lon;

        let userDistrict = null;
        try {
          // Reverse geocode to find district
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { signal }
          );
          const geoData = await geoRes.json();
          const address = geoData.address || {};
          
          // Priority: state_district is the most reliable for Sri Lanka districts
          userDistrict =
            address.state_district ||
            address.county ||
            address.state ||
            address.city ||
            null;

          if (userDistrict) {
            userDistrict = userDistrict.toLowerCase().replace(/district|province/gi, '').trim() || null;
          }
        } catch (e) {
          if (e.name === 'AbortError') throw e;
          console.warn("[useWeatherData] Reverse geocoding failed", e);
        }
        districtName = userDistrict;
      } else {
        // SEARCH MODE
        lat = currentLocation.lat;
        lon = currentLocation.lon;
        districtName = extractDistrict(currentLocation.displayName || currentLocation.name);
      }

      if (!lat || !lon) {
        throw new Error("Invalid location coordinates.");
      }

      // 2. Build alert params — NEVER fetch all alerts without a district
      console.log('[useWeatherData] Detected district:', districtName);

      const alertParams = { isActive: 'true' };
      if (districtName && districtName !== 'unknown') {
        alertParams.district = districtName;
      } else {
        console.warn('[useWeatherData] No district detected — skipping system alerts fetch to prevent fetching all alerts.');
      }

      // 3. Fetch ALL data TOGETHER using Promise.all for maximum speed
      //    System alerts fetch is skipped (resolves to empty) when no district.
      const systemAlertsPromise = alertParams.district
        ? api.get('/alerts', { params: alertParams, signal })
        : Promise.resolve({ data: { data: [] } });

      const [weatherRes, forecastRes, riskRes, externalAlertsRes, systemAlertsRes] = await Promise.all([
        api.get(`/weather/current?lat=${lat}&lon=${lon}`, { signal }),
        api.get(`/weather/forecast?lat=${lat}&lon=${lon}`, { signal }),
        api.get(`/weather/risk?lat=${lat}&lon=${lon}`, { signal }),
        api.get(`/weather/external-alerts?lat=${lat}&lon=${lon}`, { signal }),
        systemAlertsPromise
      ]);

      // 3. Set State Correctly
      const newWeather = weatherRes.data?.data || null;
      const newForecast = forecastRes.data?.data || [];
      const newRisk = riskRes.data?.data || null;

      const extData = externalAlertsRes.data?.alerts || [];
      const dbData = systemAlertsRes.data?.data || [];

      // Format OpenWeather alerts
      const formattedExt = (Array.isArray(extData) ? extData : []).map(a => ({
        _id: `ext-${Math.random()}`,
        source: 'external',
        severity: mapExternalSeverity(a.event),
        title: a.event || 'Weather Alert',
        description: a.description || 'No description available.',
        startAt: a.start ? a.start * 1000 : null,
        endAt: a.end ? a.end * 1000 : null,
        area: { district: districtName || 'Local Region' }
      }));

      // Format DB alerts structure
      const formattedDb = (Array.isArray(dbData) ? dbData : []).map(a => ({
         ...a,
         source: 'system',
      }));

      // 4. Merge Alerts & Sort
      let finalAlerts = [...formattedExt, ...formattedDb];

      // Deduplication based on title and start time
      const uniqueAlertsMap = new Map();
      finalAlerts.forEach(alert => {
          const key = `${alert.title.toLowerCase().trim()}-${alert.startAt}`;
          if (!uniqueAlertsMap.has(key)) {
              uniqueAlertsMap.set(key, alert);
          }
      });
      finalAlerts = Array.from(uniqueAlertsMap.values());

      // Sorting: Severity Priority (HIGH > MEDIUM > LOW)
      finalAlerts.sort((a, b) => {
        const sevA = SEVERITY_ORDER[a.severity] || 0;
        const sevB = SEVERITY_ORDER[b.severity] || 0;
        if (sevA !== sevB) return sevB - sevA; 
        return (b.startAt || 0) - (a.startAt || 0); 
      });

      // Avoid flickering by retaining prev alerts if new is empty and we had data,
      // but if the user genuinely searched a safe location, we must show 0 alerts.
      // We do this by cleanly setting it, relying on loading state for UX.
      setWeather(newWeather);
      setForecast(newForecast);
      setRisk(newRisk);
      setAlerts(finalAlerts);

    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'canceled') {
        console.log('Request aborted during search filtering.');
        return;
      }
      console.error('Weather fetch error:', err);
      setError('Failed to load weather data. Please check your connection.');
      // State stability fallback
      setWeather(prev => prev);
      setForecast(prev => prev);
      setRisk(prev => prev);
      setAlerts(prev => prev);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locMode, selectedLocation]);

  useEffect(() => {
    // Initial mount action
    fetchAll();
    return () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }
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
