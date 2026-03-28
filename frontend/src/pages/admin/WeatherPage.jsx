import { useEffect, useState } from 'react';
import { Thermometer, Wind, CloudSun, ShieldAlert } from 'lucide-react';
import Topbar from '../../components/admin/Topbar';
import api from '../../services/api';
import { getSeverityConfig } from '../../utils/severityConfig';

const DEFAULT_LAT = 6.9271;
const DEFAULT_LON = 79.8612;

const WeatherSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 space-y-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-6 w-28 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

const WeatherPage = () => {
  const [weather, setWeather] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(false);
      try {
        const [wRes, rRes] = await Promise.all([
          api.get(`/weather/current?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}`),
          api.get(`/weather/risk?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}`),
        ]);
        setWeather(wRes.data);
        setRisk(rRes.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const riskLevel = risk?.riskLevel || risk?.risk || 'N/A';
  const riskCfg = getSeverityConfig(riskLevel);

  const temp = weather?.main?.temp ?? weather?.temperature ?? '—';
  const windSpeed = weather?.wind?.speed ?? weather?.windSpeed ?? '—';
  const condition = weather?.weather?.[0]?.description ?? weather?.condition ?? '—';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar placeholder="Search..." />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Weather Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Current conditions for Colombo, Sri Lanka (6.9271°N, 79.8612°E)</p>
        </div>

        {loading ? (
          <WeatherSkeleton />
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-600 text-sm">
            Failed to load weather data. Please check your connection or API configuration.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Temperature */}
            <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-150">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-3">
                <Thermometer size={20} />
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Temperature</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{temp !== '—' ? `${Math.round(temp)}°C` : '—'}</p>
            </div>

            {/* Wind */}
            <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-150">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-3">
                <Wind size={20} />
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Wind Speed</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{windSpeed !== '—' ? `${windSpeed} m/s` : '—'}</p>
            </div>

            {/* Condition */}
            <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-150">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-[#06b6d4] mb-3">
                <CloudSun size={20} />
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Condition</p>
              <p className="text-base font-semibold text-gray-800 mt-1 capitalize">{condition}</p>
            </div>

            {/* Risk Level */}
            <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-150">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mb-3">
                <ShieldAlert size={20} />
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Risk Level</p>
              <div className="mt-2">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${riskCfg.badge}`}>
                  {riskLevel}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Additional weather details */}
        {!loading && !error && weather && (
          <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Additional Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {weather?.main?.humidity !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Humidity</p>
                  <p className="font-semibold text-gray-700 mt-1">{weather.main.humidity}%</p>
                </div>
              )}
              {weather?.main?.feels_like !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Feels Like</p>
                  <p className="font-semibold text-gray-700 mt-1">{Math.round(weather.main.feels_like)}°C</p>
                </div>
              )}
              {weather?.main?.pressure !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Pressure</p>
                  <p className="font-semibold text-gray-700 mt-1">{weather.main.pressure} hPa</p>
                </div>
              )}
              {weather?.visibility !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Visibility</p>
                  <p className="font-semibold text-gray-700 mt-1">{(weather.visibility / 1000).toFixed(1)} km</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WeatherPage;
