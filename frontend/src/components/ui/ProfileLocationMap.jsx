// ProfileLocationMap.jsx
// Leaflet map with click-to-select + Nominatim search + reverse geocode
// No API key required — uses free OpenStreetMap / Nominatim

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Fix Leaflet default icon broken by Vite/webpack bundling ──────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});
// ───────────────────────────────────────────────────────────────────────────────

const NOMINATIM = 'https://nominatim.openstreetmap.org';

// Reverse geocode lat/lon → { city, district }
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const city     = addr.city     || addr.town     || addr.village || addr.hamlet || '';
    const district = addr.county   || addr.state_district || addr.district || addr.state || '';
    return { city, district };
  } catch {
    return { city: '', district: '' };
  }
}

// Search query → array of { displayName, lat, lon }
async function searchPlaces(query) {
  try {
    const res = await fetch(
      `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.map(p => ({
      displayName: p.display_name,
      lat: parseFloat(p.lat),
      lon: parseFloat(p.lon),
    }));
  } catch {
    return [];
  }
}

// Inner component: listens to map clicks
function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Inner component: programmatically pan the map
function MapPanner({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView([target.lat, target.lon], 13, { animate: true });
  }, [target, map]);
  return null;
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function ProfileLocationMap({ initialLocation, onChange }) {
  const DEFAULT_CENTER = [7.8731, 80.7718]; // Sri Lanka center
  const DEFAULT_ZOOM   = 7;

  const [marker,      setMarker]      = useState(
    initialLocation?.lat ? [initialLocation.lat, initialLocation.lon] : null
  );
  const [locationInfo, setLocationInfo] = useState(
    initialLocation?.city ? initialLocation : null
  );
  const [panTarget,   setPanTarget]   = useState(null);

  // Search state
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  // Handle map click
  const handleMapClick = useCallback(async (lat, lon) => {
    setMarker([lat, lon]);
    const geo = await reverseGeocode(lat, lon);
    const info = { lat, lon, ...geo };
    setLocationInfo(info);
    onChange?.(info);
  }, [onChange]);

  // Handle search input — debounced 500ms
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setShowResults(true);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const found = await searchPlaces(q);
      setResults(found);
      setSearching(false);
    }, 500);
  };

  // Handle search result click
  const handleResultClick = async (result) => {
    const { lat, lon } = result;
    setMarker([lat, lon]);
    setPanTarget({ lat, lon });
    setQuery(result.displayName.split(',')[0]);
    setShowResults(false);
    setResults([]);
    const geo = await reverseGeocode(lat, lon);
    const info = { lat, lon, ...geo };
    setLocationInfo(info);
    onChange?.(info);
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Search city, district, or address…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all duration-200 text-gray-800 placeholder-gray-400"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin text-blue-500" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          )}
        </div>

        {/* Results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleResultClick(r)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 last:border-none truncate"
              >
                <span className="font-medium">{r.displayName.split(',')[0]}</span>
                <span className="text-gray-400 text-xs ml-1">
                  {r.displayName.split(',').slice(1, 3).join(',')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 320 }}>
        <MapContainer
          center={marker ? marker : DEFAULT_CENTER}
          zoom={marker ? 13 : DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {panTarget && <MapPanner target={panTarget} />}
          {marker && <Marker position={marker} />}
        </MapContainer>
      </div>

      {/* Location info pill or hint */}
      {locationInfo ? (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <svg className="text-blue-500 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <div className="min-w-0">
            <div className="text-gray-900 text-sm font-semibold truncate">
              {[locationInfo.city, locationInfo.district].filter(Boolean).join(', ') || 'Location selected'}
            </div>
            <div className="text-gray-400 text-[11px]">
              {locationInfo.lat.toFixed(5)}°, {locationInfo.lon.toFixed(5)}°
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-xs text-center">
          Click anywhere on the map or use the search bar to set your location
        </p>
      )}
    </div>
  );
}
