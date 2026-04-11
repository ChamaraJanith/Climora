import { motion } from 'framer-motion';
import { CloudRain, Sun, Cloud, CloudLightning, Loader2 } from 'lucide-react';

const getWeatherIcon = (condition) => {
  if (!condition) return Sun;
  const lowerCond = condition.toLowerCase();
  if (lowerCond.includes('rain') || lowerCond.includes('drizzle')) return CloudRain;
  if (lowerCond.includes('storm') || lowerCond.includes('thunder')) return CloudLightning;
  if (lowerCond.includes('cloud')) return Cloud;
  return Sun;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function ForecastCard({ forecast }) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="w-full rounded-3xl bg-[#07101f]/60 backdrop-blur-xl border border-white/5 p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-white/50 font-medium">Loading forecast...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        5-Day Forecast
      </h3>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {forecast.map((day, idx) => {
          const Icon = getWeatherIcon(day.condition || day.weather?.[0]?.description);
          const dateStr = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const pop = Math.round(
            day.pop != null
              ? (day.pop <= 1 ? day.pop * 100 : day.pop)
              : day.rainProbability ??
                day.chance_of_rain ??
                0
          );

          return (
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              key={idx}
              className="bg-[#07101f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all cursor-default"
            >
              <p className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">
                {idx === 0 ? 'Today' : dateStr.split(',')[0]}
              </p>
              
              <div className="p-3 bg-[#030712]/50 rounded-full mb-3 shadow-inner">
                <Icon className="w-6 h-6 text-cyan-400" />
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-bold text-white">{Math.round(day.maxTemp)}°</span>
                <span className="text-sm font-medium text-white/40">{Math.round(day.minTemp)}°</span>
              </div>

              <div className="w-full mt-auto pt-4">
                <div className="flex justify-between items-center text-[10px] text-cyan-200 mb-1 font-medium px-1">
                  <span>Rain</span>
                  <span>{pop}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pop}%` }}
                    transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
