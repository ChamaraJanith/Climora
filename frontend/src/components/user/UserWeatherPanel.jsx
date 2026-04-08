import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Wind, Droplets, AlertTriangle, MapPin, Search, CloudLightning, X, Info } from 'lucide-react';
import api from '../../services/api';
import socket from '../../services/socket';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Skeleton({ count = 1, h = 'h-12', className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${h} rounded-xl bg-gray-100 animate-pulse w-full`} style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

function EmptyState({ emoji, text }) {
  return (
    <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="text-gray-400 text-sm font-medium">{text}</p>
    </div>
  );
}

// ─── Alert Component ───────────────────────────────────────────────────────────
const SEV_COLORS = { critical: '#ef4444', high: '#f97316', moderate: '#eab308', medium: '#eab308', low: '#22c55e' };

function AlertCard({ alert, index }) {
  const isExternal = alert.source === 'OpenWeatherMap' || alert.isExternal;
  const color = SEV_COLORS[alert.severity?.toLowerCase()] || '#06b6d4';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`p-6 rounded-2xl border-2 ${isExternal ? 'border-orange-100 bg-orange-50/20' : 'border-gray-100 bg-white'} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
            {alert.severity || 'ALERT'}
          </span>
          {isExternal && (
             <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200 flex-shrink-0">
               ⚠️ External
             </span>
          )}
        </div>
        <span className="text-[11px] text-gray-400 font-semibold whitespace-nowrap">
          {alert.startAt ? new Date(alert.startAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
        </span>
      </div>

      <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-2">{alert.title}</h3>
      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed flex-1">{alert.description || alert.desc}</p>
      
      <div className="text-[11px] font-bold text-gray-400 mt-4 flex items-center gap-1.5 pt-3 border-t border-gray-50 uppercase tracking-wide">
        <MapPin size={12} className="text-gray-300" /> {alert.area?.district || alert.location || 'Local Region'}
      </div>
    </motion.div>
  );
}

// ─── Date Helper ───────────────────────────────────────────────────────────────
const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
};

// ─── Main Panel ────────────────────────────────────────────────────────────────
export default function UserWeatherPanel() {
  const [weatherState, setWeatherState] = useState({
    current: null,
    forecast: [],
    risk: null,
    alerts: [],
    externalAlerts: [],
    loading: true
  });
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  
  // Search UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchTimeout = useRef(null);
  const wrapperRef = useRef(null);

  // Close search results on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setSearchResults([]);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Socket triggers
  useEffect(() => {
    const handleAlertsChange = () => fetchAllData();
    socket.on('alertCreated', handleAlertsChange);
    socket.on('alertUpdated', handleAlertsChange);
    socket.on('alertDeleted', handleAlertsChange);
    return () => {
      socket.off('alertCreated', handleAlertsChange);
      socket.off('alertUpdated', handleAlertsChange);
      socket.off('alertDeleted', handleAlertsChange);
    };
    // eslint-disable-next-line
  }, [isCustomLocation, selectedLocation]);

  // Master Fetch
  const fetchAllData = useCallback(async () => {
    setWeatherState(prev => ({ ...prev, loading: true }));
    
    try {
      let lat, lon;
      let currentData = null;
      let userAlerts = [];
      
      const promises = [];
      
      if (!isCustomLocation) {
        // Mode 1: Logged In User's Location (GET /api/weather/my)
        const myRes = await api.get('/weather/my');
        lat = parseFloat(myRes.data?.location?.lat);
        lon = parseFloat(myRes.data?.location?.lon);
        currentData = myRes.data?.data;
        
        if (isNaN(lat) || isNaN(lon)) throw new Error("Invalid User GPS Coords");
        
        // Also fetch personal DB alerts for this territory
        const pAlerts = api.get('/alerts/my').catch(() => ({ data: { data: [] } }));
        promises.push(pAlerts);
        
      } else {
        // Mode 2: Searched Location (GET /api/weather/current?lat=&lon=)
        lat = selectedLocation.lat;
        lon = selectedLocation.lon;
        
        if (isNaN(lat) || isNaN(lon)) throw new Error("Invalid Custom GPS Coords");
        
        const pCurrent = api.get('/weather/current', { params: { lat, lon } }).catch(() => null);
        promises.push(pCurrent);
        
        // No district alerts for manual search, just external
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      // Add common generic payloads
      const pForecast = api.get('/weather/forecast', { params: { lat, lon } }).catch(() => null);
      const pRisk     = api.get('/weather/risk', { params: { lat, lon } }).catch(() => null);
      const pExtAlert = api.get('/weather/external-alerts', { params: { lat, lon } }).catch(() => ({ data: { alerts: [] } }));
      
      promises.push(pForecast, pRisk, pExtAlert);
      
      // Resolve all
      const results = await Promise.all(promises);
      
      // Unpack based on mode offset
      let alertsRes, forecastRes, riskRes, extRes;
      if (!isCustomLocation) {
         alertsRes = results[0];
         forecastRes = results[1];
         riskRes = results[2];
         extRes = results[3];
      } else {
         const crRes = results[0];
         currentData = crRes?.data?.data || null;
         alertsRes = results[1];
         forecastRes = results[2];
         riskRes = results[3];
         extRes = results[4];
      }
      
      userAlerts = alertsRes?.data?.data || [];
      
      setWeatherState({
        current: currentData,
        forecast: forecastRes?.data?.data || [],
        risk: riskRes?.data?.data || null,
        alerts: userAlerts,
        externalAlerts: extRes?.data?.alerts || [],
        loading: false
      });
      
    } catch (error) {
      console.error("Dashboard Fetch Failed", error);
      setWeatherState(prev => ({ 
        ...prev, 
        current: null, forecast: [], risk: null, alerts: [], externalAlerts: [], loading: false 
      }));
    }
  }, [isCustomLocation, selectedLocation]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Search Input Handler
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/alerts/search-location', { params: { q: val } });
        setSearchResults(res.data?.data || res.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelect = (place) => {
    setSelectedLocation({
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
      name: place.display_name || place.name || "Custom Search"
    });
    setIsCustomLocation(true);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  // Safe Accessors
  const curr = weatherState.current;
  const temp = curr?.temperature ?? '--';
  const cond = curr?.condition && curr.condition !== 'N/A' ? curr.condition : 'Scattered Clouds';
  const humi = curr?.humidity ?? '-';
  const wind = curr?.windSpeed ?? '-';
  const gust = curr?.windGust;
  
  const riskData = weatherState.risk;
  const riskLvl = riskData?.riskLevel?.toUpperCase() || 'LOW';
  
  const riskStyles = {
    LOW: "bg-green-50 border-green-400 text-green-600",
    MEDIUM: "bg-yellow-50 border-yellow-400 text-yellow-600",
    HIGH: "bg-orange-50 border-orange-400 text-orange-600",
    CRITICAL: "bg-red-50 border-red-500 text-red-600",
  };
  
  const currentRiskStyle = riskStyles[riskLvl] || riskStyles.LOW;
  const riskColor = SEV_COLORS[riskLvl.toLowerCase()] || SEV_COLORS.low;

  // Normalize Ext Alerts
  const extFormatted = weatherState.externalAlerts.map(ext => ({
     _id: `ext-${ext.start}-${Math.random()}`,
     title: ext.event || 'Weather Alert',
     description: ext.description,
     severity: 'HIGH',
     startAt: ext.start ? new Date(ext.start * 1000) : null,
     source: 'OpenWeatherMap',
     isExternal: true
  }));
  const allAlerts = [...weatherState.alerts, ...extFormatted];

  return (
    <div className="w-full max-w-none px-6 space-y-6 pb-10">
      
      {/* ── HEADER & SEARCH ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
        <div className="space-y-1">
          <h2 className="text-gray-900 font-black text-2xl flex items-center gap-3">
            <CloudLightning size={28} className="text-blue-500" /> Weather & Alerts
          </h2>
          <div className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-2 font-bold">
            <MapPin size={12} className="text-blue-400" /> Live Weather at Your Location
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner border border-gray-200">
            <button
              onClick={() => { setIsCustomLocation(false); setSelectedLocation(null); setIsSearchOpen(false); }}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${!isCustomLocation ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Location
            </button>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`ml-1 px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${isSearchOpen || isCustomLocation ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Search size={14} /> Search
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR COLLAPSIBLE ── */}
      <AnimatePresence>
         {isSearchOpen && (
           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-visible overflow-y-clip" ref={wrapperRef}>
              <div className="relative mb-2">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Enter city or coordinates..."
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-0 transition-all"
                />
                {(searchQuery || searching) && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {searching ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <X size={20} />}
                  </button>
                )}
                
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-20">
                      {searchResults.map((loc, i) => (
                        <button key={i} onClick={() => handleSelect(loc)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-blue-50/50 transition-colors text-left border-b border-gray-50 last:border-0 group">
                          <MapPin size={18} className="text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                          <span className="text-sm font-semibold text-gray-700 truncate">{loc.display_name || loc.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* ── ACTIVE LOCATION BADGE ── */}
      {isCustomLocation && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full w-fit border border-blue-100">
           <MapPin size={10} /> {selectedLocation?.name}
        </div>
      )}

      {weatherState.loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
           <Skeleton count={1} h="h-[280px]" className="lg:col-span-2" />
           <Skeleton count={1} h="h-[280px]" />
        </div>
      ) : (
        <>
          {/* ── MAIN METRICS GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch">
            
            {/* CURRENT WEATHER HERO */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-2xl border-2 border-gray-50 bg-gradient-to-br from-blue-700 to-indigo-500 p-8 text-white shadow-lg relative overflow-hidden group h-full flex flex-col">
                <div className="absolute -top-12 -right-12 opacity-10 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                   <div className="text-[240px] leading-none mix-blend-overlay">🌤️</div>
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white/70 uppercase tracking-widest">Atmospheric Conditions</span>
                      {curr?.updatedAt && <span className="text-[10px] font-bold text-white/50">{new Date(curr.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                   </div>
                   
                   <div className="flex items-end gap-2 mb-2">
                      <div className="text-[80px] font-black leading-none drop-shadow-2xl">{temp}°</div>
                      <div className="text-2xl font-bold mb-3 opacity-80">C</div>
                   </div>
                   
                   <div className="text-2xl font-bold text-white/90 capitalize mb-auto flex items-center gap-3">
                       {cond} 
                       <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                   </div>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-white/10 mt-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10"><Droplets size={20} strokeWidth={2.5} /></div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-0.5">Humidity</div>
                          <div className="text-lg font-black text-white">{humi}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10"><Wind size={20} strokeWidth={2.5} /></div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-0.5">Wind</div>
                          <div className="text-lg font-black text-white">
                            {wind} <span className="text-[10px] font-bold opacity-70">m/s</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10"><Info size={20} strokeWidth={2.5} /></div>
                         <div>
                            <div className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-0.5">Gusts</div>
                            <div className="text-lg font-black text-white">{gust ? Math.round(gust) : '--'} <span className="text-[10px] font-bold opacity-70">m/s</span></div>
                         </div>
                      </div>
                   </div>
                </div>
            </motion.div>

            {/* RISK PANEL */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-2xl border-2 shadow-sm p-8 flex flex-col justify-between h-full bg-white relative overflow-hidden ${currentRiskStyle.split(' ')[1]}`}>
                 <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                     <AlertTriangle size={120} />
                 </div>
                 
                 <div>
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-gray-900 font-black text-xl tracking-tight">Disaster Risk</h3>
                       <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${currentRiskStyle}`}>
                          {riskData?.riskLevel || 'LOW'}
                       </div>
                    </div>

                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${currentRiskStyle.split(' ')[0]}`}>
                       <AlertTriangle size={28} style={{ color: riskColor }} />
                    </div>

                    <p className="text-sm text-gray-700 font-bold leading-relaxed mb-4">
                       {riskData?.reasons?.length > 0 
                         ? riskData.reasons[0]
                         : 'Atmospheric variables indicate a stable regional safety index.'}
                    </p>
                    
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                       {riskData?.reasons?.length > 1 ? riskData.reasons.slice(1).join(" • ") : 'No immediate geophysical threats detected based on current sensors.'}
                    </p>
                 </div>

                 <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Factor Score</div>
                    <div className="text-lg font-black text-gray-900">{riskData?.score || 0}<span className="text-xs text-gray-400">/10</span></div>
                 </div>
            </motion.div>
          </div>

          {/* ── FORECAST ── */}
          <div className="pt-4">
            <h3 className="text-sm font-black text-gray-900 mb-5 flex items-center gap-2 uppercase tracking-widest text-blue-600/80">
               <Thermometer size={16} /> 5-Day Outlook
            </h3>
            {weatherState.forecast?.length > 0 ? (
              <div className="flex overflow-x-auto gap-4 pb-6 custom-scrollbar snap-x snap-mandatory">
                  {weatherState.forecast.map((day, i) => {
                      const todayCheck = isToday(day.date);
                      return (
                        <div key={i} className="snap-center flex-shrink-0 w-[160px] rounded-2xl border-2 border-gray-50 bg-white p-6 text-center hover:shadow-lg transition-all shadow-sm group">
                            <div className={`text-sm font-black mb-0.5 ${todayCheck ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-500 transition-colors'}`}>
                                {todayCheck ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="text-[11px] text-gray-400 font-bold mb-4 uppercase tracking-tighter">
                                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            
                            <div className="bg-gray-50 rounded-2xl p-3 mb-4 group-hover:bg-blue-50 transition-colors">
                               {day.icon ? (
                                  <img src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} alt="icon" className="w-12 h-12 mx-auto drop-shadow-md" />
                               ) : (
                                  <div className="text-3xl mb-1">🌤️</div>
                               )}
                            </div>
                            
                            <div className="flex items-center justify-center gap-2.5 text-lg font-black text-gray-900 mb-3">
                               {Math.round(day.maxTemp ?? 0)}° <span className="text-gray-300 font-bold ml-0.5">/</span> <span className="text-gray-400 font-bold">{Math.round(day.minTemp ?? 0)}°</span>
                            </div>
                            
                            {day.rainProbability > 0 ? (
                               <div className="text-[10px] text-blue-600 font-black bg-blue-100/50 py-1.5 rounded-full flex items-center justify-center gap-1 border border-blue-100">
                                 <Droplets size={12} strokeWidth={3} /> {Math.round(day.rainProbability)}%
                               </div>
                            ) : (
                               <div className="text-[10px] text-emerald-600 font-black bg-emerald-50 py-1.5 rounded-full border border-emerald-100 flex items-center justify-center gap-1">
                                 Clear Sky
                               </div>
                            )}
                        </div>
                      );
                  })}
              </div>
            ) : (
              <EmptyState emoji="☁️" text="Meteorological outlook currently unavailable for these bounds." />
            )}
          </div>

          {/* ── ALERTS ── */}
          <div className="pt-4">
            <h3 className="text-sm font-black text-gray-900 mb-5 flex items-center gap-2 uppercase tracking-widest text-red-600/80">
               <AlertTriangle size={16} /> Regional Safety Broadcasts
            </h3>
            {allAlerts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                    {allAlerts.map((alt, i) => <AlertCard key={alt._id || i} alert={alt} index={i} />)}
                </div>
            ) : (
                <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 px-8 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mb-4 shadow-inner">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                   </div>
                   <h4 className="text-gray-900 font-black text-lg">Region Clear</h4>
                   <p className="text-gray-500 text-sm font-medium mt-1 max-w-sm mx-auto">No meteorological hazards or active disaster alerts are mapped to your current location.</p>
                </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
