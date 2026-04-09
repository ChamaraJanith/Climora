import { CloudRain, AlertTriangle } from 'lucide-react';
import { useWeatherData } from '../../hooks/useWeatherData';

// Shared Admin components — reused for consistency
import WeatherHeader from '../weather/WeatherHeader';
import WeatherHero from '../weather/WeatherHero';
import RiskCard from '../weather/RiskCard';
import ForecastList from '../weather/ForecastList';
import AlertsPanel from '../weather/AlertsPanel';

/**
 * UserWeatherPanel
 *
 * Full-featured weather panel for the User Dashboard.
 * Uses the same `useWeatherData` hook as the Admin WeatherPage to ensure
 * identical logic: parallel fetches, correct district extraction,
 * alert merging & sorting, AbortController for race-condition safety.
 */
export default function UserWeatherPanel() {
  const {
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
    refreshFn,
  } = useWeatherData('my', null);

  return (
    <div className="space-y-8 w-full pb-10">

      {/* ── HEADER: Search bar + Mode toggle + Refresh ── */}
      <WeatherHeader
        locMode={locMode}
        selectedLocation={selectedLocation}
        handleLocationSelect={handleLocationSelect}
        handleModeChange={handleModeChange}
        refreshFn={refreshFn}
        refreshing={refreshing}
        error={error}
      />

      {/* ── MAIN GRID: Weather Hero + Risk Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-stretch">
        <WeatherHero
          weather={weather}
          locationName={
            locMode === 'my'
              ? 'Your Saved Location'
              : selectedLocation?.name || 'Searched Location'
          }
          loading={loading}
        />
        <RiskCard risk={risk} loading={loading} />
      </div>

      {/* ── FORECAST ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
          <CloudRain size={18} className="text-blue-500" />
          5-Day Forecast
        </h2>
        <ForecastList forecast={forecast} loading={loading} />
      </div>

      {/* ── ALERTS ── */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-500" />
          Weather &amp; System Alerts
          {!loading && alerts.length > 0 && (
            <span className="ml-2 text-xs font-black bg-red-100 text-red-600 border border-red-200 px-2.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </h2>
        <AlertsPanel alerts={alerts} loading={loading} />
      </div>

    </div>
  );
}
