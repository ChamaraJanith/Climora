import { Droplets } from 'lucide-react';

const conditionIcon = (cond) => {
  if (!cond) return '🌤️';
  const c = cond.toLowerCase();
  if (c.includes('thunder'))       return '⛈️';
  if (c.includes('drizzle'))       return '🌦️';
  if (c.includes('rain'))          return '🌧️';
  if (c.includes('snow'))          return '❄️';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return '🌫️';
  if (c.includes('cloud'))         return '☁️';
  if (c.includes('clear'))         return '☀️';
  return '🌤️';
};

const ForecastCard = ({ day, index }) => {
  const d = new Date(day.date);
  const dayName = index === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const rain = Math.round(day.rainProbability || 0);

  return (
    <div className={`min-w-[140px] rounded-2xl p-5 border text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default ${
      index === 0
        ? 'bg-gradient-to-b from-blue-50 to-white border-blue-200 shadow-md ring-1 ring-blue-100'
        : 'bg-white border-gray-100 shadow-sm hover:border-blue-100'
    }`}>
      <p className={`text-xs font-bold uppercase tracking-wider ${index === 0 ? 'text-blue-600' : 'text-gray-500'}`}>{dayName}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{dateStr}</p>

      <div className="my-4 text-4xl drop-shadow-sm">{conditionIcon(day.condition)}</div>

      <p className="text-base font-black text-gray-800">
        {day.maxTemp != null ? `${Math.round(day.maxTemp)}°` : '—'}
        <span className="text-gray-400 font-semibold ml-1.5 text-sm">
          {day.minTemp != null ? `${Math.round(day.minTemp)}°` : ''}
        </span>
      </p>

      <p className="text-[11px] text-gray-500 capitalize mt-1.5 truncate font-medium">{day.condition}</p>

      {/* Rain bar */}
      <div className="mt-4 bg-gray-50 rounded-lg p-2">
        <div className="flex items-center justify-between mb-1.5">
          <Droplets size={10} className="text-blue-500" />
          <span className="text-[10px] font-bold text-blue-600">{rain}%</span>
        </div>
        <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${rain}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const ForecastList = ({ forecast, loading }) => {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="min-w-[140px] bg-gray-50 rounded-2xl p-5 animate-pulse space-y-3 border border-gray-100">
            <div className="h-3 w-12 bg-gray-200 rounded mx-auto" />
            <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto my-4" />
            <div className="h-5 w-16 bg-gray-200 rounded mx-auto" />
            <div className="h-8 w-full bg-gray-200 rounded mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (!forecast || forecast.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 text-sm text-gray-400 text-center font-medium shadow-inner">
        No forecast data available for this location.
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x pt-1 px-1">
      {forecast.map((day, i) => (
        <div key={i} className="snap-start">
          <ForecastCard day={day} index={i} />
        </div>
      ))}
    </div>
  );
};

export default ForecastList;
