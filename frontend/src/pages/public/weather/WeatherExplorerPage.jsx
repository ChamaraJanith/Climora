import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, RefreshCcw, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import LocationSearch from './components/LocationSearch';
import WeatherCard from './components/WeatherCard';
import ForecastCard from './components/ForecastCard';
import RiskBadge from './components/RiskBadge';

const COLOMBO = { name: 'Colombo', lat: 6.9271, lon: 79.8612 };

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function WeatherExplorerPage() {
  const [location, setLocation] = useState(COLOMBO);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState({ current: true, forecast: true, risk: true });
  const [error, setError] = useState({ current: null, forecast: null, risk: null });

  const fetchWeatherData = useCallback(async (loc) => {
    const params = { lat: loc.lat, lon: loc.lon };

    setLoading({ current: true, forecast: true, risk: true });
    setError({ current: null, forecast: null, risk: null });
    setCurrentWeather(null);
    setForecast(null);
    setRisk(null);

    const [currentResult, forecastResult, riskResult] = await Promise.allSettled([
      api.get('/weather/current', { params }),
      api.get('/weather/forecast', { params }),
      api.get('/weather/risk', { params }),
    ]);

    if (currentResult.status === 'fulfilled') {
      setCurrentWeather(currentResult.value.data?.data ?? null);
    } else {
      setError(e => ({ ...e, current: 'Failed to load current weather.' }));
    }
    setLoading(l => ({ ...l, current: false }));

    if (forecastResult.status === 'fulfilled') {
      setForecast(forecastResult.value.data?.data ?? null);
    } else {
      setError(e => ({ ...e, forecast: 'Failed to load forecast.' }));
    }
    setLoading(l => ({ ...l, forecast: false }));

    if (riskResult.status === 'fulfilled') {
      setRisk(riskResult.value.data?.data ?? null);
    } else {
      setError(e => ({ ...e, risk: 'Failed to load risk assessment.' }));
    }
    setLoading(l => ({ ...l, risk: false }));
  }, []);

  useEffect(() => {
    fetchWeatherData(COLOMBO);
  }, [fetchWeatherData]);

  const handleLocationSelect = (loc) => {
    const newLoc = { name: loc.name, lat: parseFloat(loc.lat), lon: parseFloat(loc.lon) };
    setLocation(newLoc);
    fetchWeatherData(newLoc);
  };

  const isLoadingAny = loading.current || loading.forecast || loading.risk;

  return (
    <div className="relative overflow-x-hidden pt-10">

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full bg-blue-900/25 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-900/15 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-20 pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp} className="mb-5">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                Weather Intelligence for Sri Lanka
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
            >
              Explore Weather
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">
                Anywhere
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Real-time temperature, wind, humidity, 5-day forecasts, and risk assessments — completely free, no login required.
            </motion.p>

            <motion.div variants={fadeUp} className="w-full max-w-2xl mx-auto">
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                initialValue=""
                isSearching={isLoadingAny}
              />
            </motion.div>

            {/* Current Location Indicator */}
            <motion.div variants={fadeUp} className="mt-4 flex items-center justify-center gap-2 text-sm text-white/40">
              <MapPin className="w-3.5 h-3.5" />
              <span>Showing weather for <span className="text-cyan-400 font-medium">{location.name}</span></span>
              <button
                onClick={() => fetchWeatherData(location)}
                className="ml-2 p-1 rounded-full hover:bg-white/5 text-white/30 hover:text-cyan-400 transition-colors"
                title="Refresh"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isLoadingAny ? 'animate-spin' : ''}`} />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Weather Data Section */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${location.lat}-${location.lon}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-8"
            >
              {/* Current Weather + Risk Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Weather (2/3 width) */}
                <div className="lg:col-span-2">
                  {error.current ? (
                    <ErrorCard message={error.current} />
                  ) : (
                    <WeatherCard current={currentWeather} locationName={location.name} />
                  )}
                </div>

                {/* Risk Badge (1/3 width) */}
                <div className="lg:col-span-1 flex flex-col justify-center">
                  {error.risk ? (
                    <ErrorCard message={error.risk} />
                  ) : loading.risk ? (
                    <RiskSkeleton />
                  ) : (
                    <RiskBadge risk={risk} />
                  )}
                </div>
              </div>

              {/* 5-Day Forecast */}
              <div>
                {error.forecast ? (
                  <ErrorCard message={error.forecast} />
                ) : loading.forecast ? (
                  <ForecastSkeleton />
                ) : (
                  <ForecastCard forecast={forecast} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

    </div>
  );
}

/* ─── Helper Sub-components ─── */

function ErrorCard({ message }) {
  return (
    <div className="w-full rounded-2xl bg-red-900/10 border border-red-500/20 p-6 flex items-center gap-4 text-red-400">
      <AlertTriangle className="w-6 h-6 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function RiskSkeleton() {
  return (
    <div className="w-full rounded-2xl bg-[#07101f]/60 border border-white/5 p-6 flex items-center gap-4 animate-pulse min-h-[120px]">
      <div className="w-14 h-14 rounded-xl bg-white/5" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-24 bg-white/5 rounded" />
        <div className="h-3 w-16 bg-white/5 rounded" />
      </div>
    </div>
  );
}

function ForecastSkeleton() {
  return (
    <div>
      <div className="h-5 w-32 bg-white/5 rounded mb-4 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#07101f]/60 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-3 animate-pulse">
            <div className="h-3 w-12 bg-white/5 rounded" />
            <div className="w-12 h-12 rounded-full bg-white/5" />
            <div className="h-4 w-16 bg-white/5 rounded" />
            <div className="w-full h-1.5 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
