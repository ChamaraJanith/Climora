import { CloudSun, Droplets, Wind, Navigation } from 'lucide-react';

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

const WeatherHero = ({ weather, locationName, loading }) => {
  if (loading) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 p-8 animate-pulse shadow-sm h-full min-h-[300px] flex flex-col justify-between">
        <div className="flex items-end justify-between">
          <div className="space-y-4">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-16 w-32 bg-gray-200 rounded-xl" />
            <div className="h-4 w-36 bg-gray-200 rounded" />
          </div>
          <div className="h-20 w-20 bg-gray-200 rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-200/50">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const temp = weather?.temperature;
  const humidity = weather?.humidity;
  const windSpeed = weather?.windSpeed;
  const windGust = weather?.windGust;
  const condition = weather?.condition || '—';

  return (
    <div className="rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-8 text-white relative overflow-hidden shadow-xl h-full flex flex-col justify-between group min-h-[300px]">
      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700 pointer-events-none" />

      <div className="relative z-10">
        <p className="text-white/80 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1 drop-shadow-sm">
          <CloudSun size={14} className="text-yellow-200" /> Current Weather
        </p>
        <p className="text-white/70 text-xs mt-0.5 tracking-wide">{locationName}</p>

        <div className="flex items-end justify-between mt-6">
          <div>
            <p className="text-7xl lg:text-8xl font-black leading-none tracking-tighter drop-shadow-md">
              {temp != null ? Math.round(temp) : '—'}
              <span className="text-3xl lg:text-4xl font-semibold text-white/70 ml-1">°C</span>
            </p>
            <p className="text-lg font-medium capitalize mt-3 text-white/90 drop-shadow-sm">{condition}</p>
          </div>
          <div className="text-7xl lg:text-8xl drop-shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 flex-shrink-0">
            {conditionIcon(condition)}
          </div>
        </div>
      </div>
        
      <div className="relative z-10 mt-8">
        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Droplets size={12} className="text-blue-100" /> Humidity
            </p>
            <p className="text-xl font-extrabold">{humidity != null ? `${humidity}%` : '—'}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Wind size={12} className="text-cyan-100" /> Wind
            </p>
            <p className="text-xl font-extrabold">{windSpeed != null ? `${windSpeed}m/s` : '—'}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Navigation size={12} className="text-indigo-100" /> Gust
            </p>
            <p className="text-xl font-extrabold">{windGust != null ? `${windGust}m/s` : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherHero;
