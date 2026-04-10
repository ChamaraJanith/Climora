import { motion } from 'framer-motion';
import { Thermometer, Wind, Droplets, CloudRain, Sun, Cloud, CloudLightning, Loader2 } from 'lucide-react';

const getWeatherIcon = (condition) => {
  if (!condition) return Sun;
  const lowerCond = condition.toLowerCase();
  
  if (lowerCond.includes('rain') || lowerCond.includes('drizzle')) return CloudRain;
  if (lowerCond.includes('storm') || lowerCond.includes('thunder')) return CloudLightning;
  if (lowerCond.includes('cloud')) return Cloud;
  return Sun;
};

export default function WeatherCard({ current, locationName }) {
  if (!current) {
    return (
      <div className="w-full rounded-3xl bg-[#07101f]/60 backdrop-blur-xl border border-white/5 p-8 flex flex-col items-center justify-center min-h-[250px]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-white/50 font-medium">Fetching real-time weather...</p>
      </div>
    );
  }

  const { temperature, humidity, windSpeed, condition } = current;
  const WeatherIcon = getWeatherIcon(condition);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-3xl bg-[#07101f]/80 backdrop-blur-2xl border border-white/10 p-8 overflow-hidden shadow-2xl"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        
        {/* Left Col: Temp & Condition */}
        <div className="flex items-center gap-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/5 border border-cyan-500/20 shadow-inner">
            <WeatherIcon className="w-12 h-12 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-start">
              <span className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tighter">
                {temperature ? Math.round(temperature) : '--'}
              </span>
              <span className="text-3xl text-white/50 font-bold mt-2">°C</span>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-wide capitalize mt-1">
              {condition || 'Unknown Condition'}
            </h2>
            <p className="text-cyan-400 font-medium text-sm mt-1">{locationName}</p>
          </div>
        </div>

        {/* Right Col: Metrics */}
        <div className="flex flex-row md:flex-col gap-4">
          <div className="flex-1 bg-[#030712]/50 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Wind Speed</p>
              <p className="text-lg font-bold text-white">{windSpeed ? `${windSpeed} m/s` : '--'}</p>
            </div>
          </div>

          <div className="flex-1 bg-[#030712]/50 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Humidity</p>
              <p className="text-lg font-bold text-white">{humidity ? `${humidity}%` : '--'}</p>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
