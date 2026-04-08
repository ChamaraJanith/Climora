import { AlertTriangle, CloudRain } from 'lucide-react';
import Topbar from '../../components/admin/Topbar';
import { useWeatherData } from '../../hooks/useWeatherData';

// Components
import WeatherHeader from '../../components/weather/WeatherHeader';
import WeatherHero from '../../components/weather/WeatherHero';
import RiskCard from '../../components/weather/RiskCard';
import ForecastList from '../../components/weather/ForecastList';
import AlertsPanel from '../../components/weather/AlertsPanel';

const WeatherPage = () => {
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
    refreshFn
  } = useWeatherData('my', null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Topbar placeholder="Weather Monitor" />
      <main className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* HEADER SECTION */}
        <WeatherHeader
          locMode={locMode}
          selectedLocation={selectedLocation}
          handleLocationSelect={handleLocationSelect}
          handleModeChange={handleModeChange}
          refreshFn={refreshFn}
          refreshing={refreshing}
          error={error}
        />

        {/* MAIN GRID: Weather Hero + Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <WeatherHero 
            weather={weather} 
            locationName={locMode === 'my' ? 'Your Saved Location' : selectedLocation?.name} 
            loading={loading} 
          />
          <RiskCard 
            risk={risk} 
            loading={loading} 
          />
        </div>

        {/* FORECAST SECTION */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CloudRain size={20} className="text-blue-500" /> 5-Day Forecast
          </h2>
          <ForecastList forecast={forecast} loading={loading} />
        </div>

        {/* ALERTS SECTION */}
        <div className="pb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" /> Weather & System Alerts
          </h2>
          <AlertsPanel alerts={alerts} loading={loading} />
        </div>

      </main>
    </div>
  );
};

export default WeatherPage;
