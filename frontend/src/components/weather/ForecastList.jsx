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

const ForecastCard = ({ day, index, variant = 'dashboard' }) => {
  const isDashboard = variant === 'dashboard';
  const d = new Date(day.date);
  const dayName = index === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const rain = Math.round(day.rainProbability || 0);

  return (
    <div className={`w-full rounded-2xl p-5 border text-center transition-all duration-300 hover:-translate-y-1 cursor-default ${
      isDashboard
        ? (index === 0 
           ? 'bg-[linear-gradient(135deg,#0f172a,#1e293b)] border-cyan-400/40 shadow-[0_0_20px_rgba(0,150,255,0.25)]'
           : 'bg-[linear-gradient(135deg,#0f172a,#1e293b)] border-white/10 shadow-lg')
        : (index === 0
           ? 'bg-gradient-to-b from-blue-50 to-white border-blue-200 shadow-md ring-1 ring-blue-100 hover:shadow-lg'
           : 'bg-white border-gray-100 shadow-sm hover:border-blue-100 hover:shadow-lg')
    }`}>
      <p className={`text-xs font-bold uppercase tracking-wider ${
        isDashboard 
          ? (index === 0 ? 'text-white' : 'text-white/70') 
          : (index === 0 ? 'text-blue-600' : 'text-gray-500')
      }`}>{dayName}</p>
      <p className={`text-[10px] mt-0.5 ${isDashboard ? 'text-white/50' : 'text-gray-400'}`}>{dateStr}</p>

      <div className="my-4 text-4xl drop-shadow-sm">{conditionIcon(day.condition)}</div>

      <p className={`text-base font-black ${isDashboard ? 'text-white' : 'text-gray-800'}`}>
        {day.maxTemp != null ? `${Math.round(day.maxTemp)}°` : '—'}
        <span className={`font-semibold ml-1.5 text-sm ${isDashboard ? 'text-white/50' : 'text-gray-400'}`}>
          {day.minTemp != null ? `${Math.round(day.minTemp)}°` : ''}
        </span>
      </p>

      <p className={`text-[11px] capitalize mt-1.5 truncate font-medium ${isDashboard ? 'text-white/70' : 'text-gray-500'}`}>{day.condition}</p>

      {/* Rain bar */}
      <div className={`mt-4 rounded-lg p-2 ${isDashboard ? 'bg-transparent' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-1.5">
          <Droplets size={10} className={isDashboard ? 'text-cyan-400' : 'text-blue-500'} />
          <span className={`text-[10px] font-bold ${isDashboard ? 'text-white/70' : 'text-blue-600'}`}>{rain}%</span>
        </div>
        <div className={`h-1.5 rounded-full ${isDashboard ? 'bg-white/10' : 'bg-blue-100 overflow-hidden'}`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              isDashboard 
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(0,150,255,0.4)]' 
                : 'bg-gradient-to-r from-blue-400 to-indigo-500'
            }`}
            style={{ width: `${rain}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const ForecastList = ({ forecast, loading, variant = 'dashboard' }) => {
  const isDashboard = variant === 'dashboard';

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`w-full rounded-2xl p-5 animate-pulse space-y-3 border ${
            isDashboard ? 'bg-[linear-gradient(135deg,#0f172a,#1e293b)] border-white/10' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className={`h-3 w-12 rounded mx-auto ${isDashboard ? 'bg-white/10' : 'bg-gray-200'}`} />
            <div className={`h-12 w-12 rounded-full mx-auto my-4 ${isDashboard ? 'bg-white/10' : 'bg-gray-200'}`} />
            <div className={`h-5 w-16 rounded mx-auto ${isDashboard ? 'bg-white/10' : 'bg-gray-200'}`} />
            <div className={`h-8 w-full rounded mt-4 ${isDashboard ? 'bg-white/10' : 'bg-gray-200'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (!forecast || forecast.length === 0) {
    return (
      <div className={`rounded-2xl p-8 border text-sm text-center font-medium shadow-inner ${
        isDashboard ? 'bg-[linear-gradient(135deg,#0f172a,#1e293b)] border-white/10 text-white/50' : 'bg-gray-50 border-gray-100 text-gray-400'
      }`}>
        No forecast data available for this location.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full pt-1">
      {forecast.map((day, i) => (
        <ForecastCard key={i} day={day} index={i} variant={variant} />
      ))}
    </div>
  );
};

export default ForecastList;
