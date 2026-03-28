import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const TESTIMONIALS = [
  {
    quote: "Climora gave our emergency team a 20-minute head start before the flood hit. That time saved lives.",
    name: "Sarah M.",
    role: "Emergency Coordinator, Red Cross",
    avatar: "https://i.pravatar.cc/80?img=47",
  },
  {
    quote: "The shelter tracking feature is incredible. We went from spreadsheets to real-time dashboards overnight.",
    name: "James K.",
    role: "Disaster Relief Manager",
    avatar: "https://i.pravatar.cc/80?img=12",
  },
  {
    quote: "Community reports on Climora were more accurate than official channels during the wildfire season.",
    name: "Priya L.",
    role: "Climate Journalist",
    avatar: "https://i.pravatar.cc/80?img=32",
  },
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative py-32 bg-[#030712] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-indigo-900/15 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6">
            Trusted by Responders
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            From the people who use it
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-white/8 bg-white/3 p-7 backdrop-blur-sm group"
            >
              {/* Quote mark */}
              <div className="text-6xl text-white/5 font-serif leading-none mb-4 select-none">"</div>
              <p className="text-slate-300 text-base leading-relaxed mb-6 -mt-4">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 30px rgba(99,102,241,0.08)' }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
