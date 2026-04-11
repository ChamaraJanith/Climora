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

/**
 * Returns a dynamic gradient based on weather condition.
 */
const conditionGradient = (cond) => {
  if (!cond) return 'from-cyan-500 via-blue-500 to-indigo-600';
  const c = cond.toLowerCase();
  if (c.includes('thunder'))       return 'from-slate-700 via-zinc-800 to-gray-900';
  if (c.includes('drizzle'))       return 'from-teal-400 via-cyan-500 to-sky-600';
  if (c.includes('rain'))          return 'from-slate-500 via-blue-600 to-indigo-700';
  if (c.includes('snow'))          return 'from-sky-200 via-blue-300 to-indigo-400';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return 'from-gray-400 via-slate-500 to-gray-600';
  if (c.includes('cloud'))         return 'from-slate-400 via-blue-400 to-cyan-500';
  if (c.includes('clear'))         return 'from-amber-400 via-orange-400 to-sky-500';
  return 'from-cyan-500 via-blue-500 to-indigo-600';
};

const WeatherHero = ({ weather, locationName, loading }) => {
  if (loading) {
    return (
      <div className="rounded-3xl bg-[linear-gradient(135deg,#0f172a,#1e3a8a)] backdrop-blur-md border border-white/10 p-8 animate-pulse shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(0,150,255,0.15)] h-full min-h-[300px] flex flex-col justify-between">
        <div className="flex items-end justify-between">
          <div className="space-y-4">
            <div className="h-4 w-28 bg-white/10 rounded" />
            <div className="h-20 w-40 bg-white/10 rounded-xl" />
            <div className="h-4 w-36 bg-white/10 rounded" />
          </div>
          <div className="h-20 w-20 bg-white/10 rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white/10 rounded-xl border border-white/10" />)}
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
    <div
      className="rounded-3xl bg-[linear-gradient(135deg,#0f172a,#1e3a8a)] backdrop-blur-md border border-white/10 p-8 text-white relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(0,150,255,0.15)] h-full flex flex-col justify-between group min-h-[300px] transition-all duration-300 ease-out hover:-translate-y-[6px] hover:scale-[1.01] hover:shadow-[0_30px_70px_rgba(0,0,0,0.7),0_0_50px_rgba(0,150,255,0.25)] animate-[fadeInUp_0.4s_ease-out_forwards]"
    >
      {/* Animated floating clouds / blobs */}
      <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/10 rounded-full blur-3xl group-hover:scale-125 group-hover:-translate-y-2 transition-all duration-1000 ease-in-out pointer-events-none" />
      <div className="absolute -bottom-14 -left-14 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 group-hover:translate-y-2 transition-all duration-1000 ease-in-out pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1 drop-shadow-sm">
          <CloudSun size={14} className="text-white" /> Current Weather
        </p>
        <p className="text-white/60 text-xs mt-0.5 tracking-wide truncate">{locationName}</p>

        <div className="flex items-end justify-between mt-6">
          <div>
            <p className="text-7xl lg:text-8xl font-bold leading-none tracking-tighter text-white drop-shadow-md">
              {temp != null ? Math.round(temp) : '—'}
              <span className="text-3xl lg:text-4xl font-semibold text-white/70 ml-1">°C</span>
            </p>
            <p className="text-lg font-semibold capitalize mt-3 text-white/80 drop-shadow-sm">{condition}</p>
          </div>
          <div className="text-7xl lg:text-8xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700 ease-out flex-shrink-0">
            {conditionIcon(condition)}
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="relative z-10 mt-8">
        <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/10">
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(0,150,255,0.2)] hover:bg-white/20 transition-all duration-300">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Droplets size={12} className="text-white" /> Humidity
            </p>
            <p className="text-white font-bold text-lg leading-none">{humidity != null ? `${humidity}%` : '—'}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(0,150,255,0.2)] hover:bg-white/20 transition-all duration-300">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Wind size={12} className="text-white" /> Wind
            </p>
            <p className="text-white font-bold text-lg leading-none">{windSpeed != null ? `${Math.round(windSpeed)}m/s` : '—'}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(0,150,255,0.2)] hover:bg-white/20 transition-all duration-300">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Navigation size={12} className="text-white" /> Gust
            </p>
            <p className="text-white font-bold text-lg leading-none">{windGust != null ? `${Math.round(windGust)}m/s` : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherHero;
