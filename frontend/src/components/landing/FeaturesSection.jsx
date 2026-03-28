import { useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

const FEATURES = [
  {
    title: 'Real-Time Alerts',
    desc: 'Hyper-local weather alerts powered by live meteorological data. Get notified before disaster strikes.',
    img: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&q=80',
    tag: 'Live',
    tagColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
    accent: '#eab308',
    span: 'lg:col-span-2 lg:row-span-2',
    size: 'large',
  },
  {
    title: 'Shelter Network',
    desc: 'Live occupancy across hundreds of emergency shelters.',
    img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80',
    tag: 'Network',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    accent: '#06b6d4',
    span: 'lg:col-span-1',
    size: 'small',
  },
  {
    title: 'Smart Checklists',
    desc: 'AI-curated preparedness checklists for your region.',
    img: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80',
    tag: 'AI',
    tagColor: 'text-green-400 bg-green-500/10 border-green-500/25',
    accent: '#22c55e',
    span: 'lg:col-span-1',
    size: 'small',
  },
  {
    title: 'Incident Reports',
    desc: 'Community-powered incident reporting with real-time map overlays and vote-based verification.',
    img: 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800&q=80',
    tag: 'Community',
    tagColor: 'text-red-400 bg-red-500/10 border-red-500/25',
    accent: '#ef4444',
    span: 'lg:col-span-2',
    size: 'wide',
  },
  {
    title: 'Climate News',
    desc: 'Verified climate intelligence filtered by your location.',
    img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
    tag: 'Curated',
    tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
    accent: '#a855f7',
    span: 'lg:col-span-1',
    size: 'small',
  },
  {
    title: 'Relief Coordination',
    desc: 'Manage and distribute relief items efficiently with inventory tracking and demand forecasting across all active disaster zones.',
    img: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&q=80',
    tag: 'Logistics',
    tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    accent: '#3b82f6',
    span: 'lg:col-span-3',
    size: 'wide',
  },
];

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [hovered, setHovered] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.0]);

  const isLarge = feature.size === 'large';
  const isWide  = feature.size === 'wide';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.75, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-white/8 bg-[#0a0f1e] cursor-default group ${feature.span} ${isLarge ? 'min-h-[420px]' : isWide ? 'min-h-[260px]' : 'min-h-[220px]'}`}
      style={{ boxShadow: hovered ? `0 30px 70px -15px ${feature.accent}33` : '0 0 0 0 transparent', transition: 'box-shadow 0.4s ease' }}
    >
      {/* Image with parallax */}
      <motion.div className="absolute inset-0 w-full h-full" style={{ scale: imgScale }}>
        <img
          src={feature.img}
          alt={feature.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </motion.div>

      {/* Dark gradient overlay — stronger at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/70 to-[#030712]/20" />

      {/* Hover color tint */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: hovered ? 0.12 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ background: `radial-gradient(ellipse at 50% 100%, ${feature.accent}, transparent 70%)` }}
      />

      {/* Scan line on hover */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}, transparent)` }}
        initial={{ top: '100%', opacity: 0 }}
        animate={hovered ? { top: ['100%', '0%'], opacity: [0, 1, 0] } : { top: '100%', opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Content — horizontal layout for full-width cards, vertical for others */}
      <div className={`absolute inset-0 flex p-6 ${feature.span === 'lg:col-span-3' ? 'flex-row items-end justify-between gap-8' : 'flex-col justify-end'}`}>
        <div>
          <motion.span
            animate={{ y: hovered ? -2 : 0 }}
            transition={{ duration: 0.3 }}
            className={`self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold tracking-wide mb-3 ${feature.tagColor}`}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: feature.accent }} />
            {feature.tag}
          </motion.span>

          <motion.h3
            animate={{ y: hovered ? -2 : 0 }}
            transition={{ duration: 0.3, delay: 0.03 }}
            className={`text-white font-black tracking-tight leading-tight mb-2 ${isLarge ? 'text-3xl md:text-4xl' : 'text-xl'}`}
          >
            {feature.title}
          </motion.h3>

          {feature.span !== 'lg:col-span-3' && (
            <motion.p
              animate={{ opacity: hovered ? 1 : isLarge ? 0.7 : 0.6, y: hovered ? 0 : 4 }}
              transition={{ duration: 0.35 }}
              className={`text-slate-300 leading-relaxed ${isLarge ? 'text-base max-w-sm' : 'text-sm'}`}
            >
              {feature.desc}
            </motion.p>
          )}
        </div>

        {/* Right side for wide card — desc + arrow */}
        {feature.span === 'lg:col-span-3' ? (
          <div className="max-w-md flex-shrink-0">
            <motion.p
              animate={{ opacity: hovered ? 1 : 0.6, y: hovered ? 0 : 4 }}
              transition={{ duration: 0.35 }}
              className="text-slate-300 text-sm leading-relaxed mb-4"
            >
              {feature.desc}
            </motion.p>
            <motion.div
              animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: feature.accent }}
            >
              Learn more
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </div>
        ) : (
          <motion.div
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -8 }}
            transition={{ duration: 0.3 }}
            className="mt-4 flex items-center gap-2 text-sm font-semibold"
            style={{ color: feature.accent }}
          >
            Learn more
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        )}
      </div>

      {/* Border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ boxShadow: `inset 0 0 0 1px ${feature.accent}40` }}
      />
    </motion.div>
  );
}

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative py-32 bg-[#030712] overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-blue-900/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-cyan-900/8 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-6">
            Everything You Need
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-5">
            Built for the
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"> frontlines</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Every feature is designed around one goal — keeping people safe when climate events unfold.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
