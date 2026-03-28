import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

// Cinematic image showcase with parallax
const SHOWCASES = [
  {
    tag: 'Live Monitoring',
    title: 'Track every alert, in real time.',
    desc: 'Our alert engine processes thousands of data points per second — giving you a live pulse on weather events, shelter capacity, and community reports.',
    img: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=900&q=80',
    accent: 'cyan',
    hasAlertOverlay: true,
  },
  {
    tag: 'Shelter Network',
    title: 'Find safety before the storm hits.',
    desc: 'Interactive shelter maps with live occupancy, routing, and capacity data. Integrated with emergency services for verified, up-to-date information.',
    img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=80',
    accent: 'blue',
  },
  {
    tag: 'Community Power',
    title: 'Reports from the ground, verified fast.',
    desc: 'Crowdsourced incident reports with community voting and admin verification. Real information from real people, filtered for accuracy.',
    img: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=900&q=80',
    accent: 'indigo',
  },
];

const ALERTS = [
  { level: 'CRITICAL', label: 'Flash Flood Warning', region: 'Downtown District', time: 'Just now', color: '#ef4444' },
  { level: 'HIGH', label: 'Severe Thunderstorm', region: 'North Suburbs', time: '2 min ago', color: '#f97316' },
  { level: 'MODERATE', label: 'High Wind Advisory', region: 'Coastal Zone', time: '8 min ago', color: '#eab308' },
];

function AlertOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Top bar — radar label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Live Radar</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-slate-400 text-xs font-mono">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
        </div>
      </div>

      {/* Bottom — stacked alert cards */}
      <div className="flex flex-col gap-2">
        {ALERTS.map((alert, i) => (
          <motion.div
            key={alert.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10"
          >
            {/* Severity dot */}
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: alert.color, boxShadow: `0 0 8px ${alert.color}` }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest" style={{ color: alert.color }}>{alert.level}</span>
                <span className="text-white text-xs font-semibold truncate">{alert.label}</span>
              </div>
              <div className="text-slate-500 text-[10px] mt-0.5">{alert.region}</div>
            </div>
            <span className="text-slate-600 text-[10px] flex-shrink-0">{alert.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const accentMap = {
  cyan: { tag: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', glow: 'rgba(6,182,212,0.2)', line: 'from-cyan-500' },
  blue: { tag: 'text-blue-400 bg-blue-500/10 border-blue-500/30', glow: 'rgba(59,130,246,0.2)', line: 'from-blue-500' },
  indigo: { tag: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', glow: 'rgba(99,102,241,0.2)', line: 'from-indigo-500' },
};

function ShowcaseRow({ item, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const a = accentMap[item.accent];
  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-20 items-center py-20 border-t border-white/5`}>
      {/* Image */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? -60 : 60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="w-full md:w-1/2 relative rounded-2xl overflow-hidden aspect-video"
        style={{ boxShadow: `0 40px 80px -20px ${a.glow}` }}
      >
        <motion.img
          src={item.img}
          alt={item.title}
          style={{ y: imgY }}
          className="w-full h-[120%] object-cover scale-110"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#030712]/60 via-transparent to-transparent" />
        {/* Frame border */}
        <div className={`absolute inset-0 rounded-2xl border border-white/10`} />
        {/* Alert UI overlay */}
        {item.hasAlertOverlay && <AlertOverlay />}
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? 60 : -60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full md:w-1/2"
      >
        <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold tracking-widest uppercase mb-5 ${a.tag}`}>
          {item.tag}
        </span>
        <h3 className="text-3xl md:text-4xl font-black text-white leading-tight mb-5">
          {item.title}
        </h3>
        <p className="text-slate-400 text-base leading-relaxed mb-8">{item.desc}</p>
        <div className={`h-px w-16 bg-gradient-to-r ${a.line} to-transparent`} />
      </motion.div>
    </div>
  );
}

export default function ShowcaseSection() {
  return (
    <section className="relative py-10 bg-[#030712]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {SHOWCASES.map((item, i) => (
          <ShowcaseRow key={item.tag} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
