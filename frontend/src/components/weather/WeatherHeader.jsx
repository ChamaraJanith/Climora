import { MapPin, Search, User, RefreshCw, AlertTriangle } from 'lucide-react';
import LocationSearch from './LocationSearch';

const WeatherHeader = ({
  locMode,
  selectedLocation,
  handleLocationSelect,
  handleModeChange,
  refreshFn,
  refreshing,
  error
}) => {

  const locationDisplay = locMode === 'my'
    ? 'Your Saved Location'
    : selectedLocation?.name || 'No location selected';
    
  const coordsDisplay = locMode === 'my' || !selectedLocation
    ? ''
    : `${selectedLocation.lat.toFixed(4)}°N, ${selectedLocation.lon.toFixed(4)}°E`;

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Weather Monitor</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <MapPin size={13} className="text-blue-500" />
            {locationDisplay}
            {coordsDisplay && <span className="text-gray-400 ml-1">({coordsDisplay})</span>}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search Input */}
          <LocationSearch
            onSelect={handleLocationSelect}
            disabled={locMode === 'my'}
          />

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-0.5 flex-shrink-0 shadow-inner">
            <button
              onClick={() => handleModeChange('search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                locMode === 'search'
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Search size={12} /> Search
            </button>
            <button
              onClick={() => handleModeChange('my')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                locMode === 'my'
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User size={12} /> My Location
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={refreshFn}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 flex-shrink-0"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-600 text-sm flex items-center gap-2 mt-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </>
  );
};

export default WeatherHeader;
