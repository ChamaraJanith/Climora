import { useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

// ─── Data ─────────────────────────────────────────────────────────────────────

const CASES = [
  {
    id: 1,
    category: 'Flood Response',
    location: 'Manila, Philippines',
    date: 'Aug 2024',
    title: 'Typhoon Gaemi — 48-Hour Early Response',
    summary: 'Climora\'s alert engine detected anomalous rainfall patterns 48 hours before Typhoon Gaemi made landfall. Over 12,000 residents were pre-evacuated to 34 verified shelters, with zero shelter overflow reported.',
    img: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200&q=80',
    stats: [{ v: '12,400', l: 'Pre-evacuated' }, { v: '34', l: 'Shelters Activated' }, { v: '48h', l: 'Early Warning' }],
    accent: '#06b6d4',
    tag: 'Flood',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
  },
  {
    id: 2,
    category: 'Wildfire',
    location: 'California, USA',
    date: 'Oct 2024',
    title: 'Dixie Fire — Community Reporting Network',
    summary: 'During the Dixie Fire, 2,300+ community incident reports were submitted through Climora. Cross-referenced with satellite data, the reports helped emergency services identify 6 new fire fronts before aerial detection.',
    img: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=1200&q=80',
    stats: [{ v: '2,300+', l: 'Reports Filed' }, { v: '6', l: 'Fronts Identified' }, { v: '94%', l: 'Report Accuracy' }],
    accent: '#f97316',
    tag: 'Wildfire',
    tagColor: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
  },
  {
    id: 3,
    category: 'Hurricane',
    location: 'Florida, USA',
    date: 'Sep 2024',
    title: 'Hurricane Helene — Shelter Coordination',
    summary: 'Climora\'s shelter network managed real-time occupancy across 89 facilities during Hurricane Helene. Dynamic rerouting prevented 3 shelters from exceeding capacity, and relief inventory was redistributed in under 2 hours.',
    img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80',
    stats: [{ v: '89', l: 'Shelters Managed' }, { v: '31K', l: 'People Sheltered' }, { v: '2h', l: 'Relief Redistribution' }],
    accent: '#6366f1',
    tag: 'Hurricane',
    tagColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
  },
  {
    id: 4,
    category: 'Earthquake',
    location: 'Türkiye',
    date: 'Feb 2024',
    title: 'Kahramanmaraş — Relief Coordination at Scale',
    summary: 'Following the 7.8 magnitude earthquake, Climora coordinated relief item distribution across 140+ sites. Demand forecasting reduced supply shortfalls by 67%, and the checklist system guided 80,000 households through recovery steps.',
    img: 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=1200&q=80',
    stats: [{ v: '140+', l: 'Relief Sites' }, { v: '67%', l: 'Fewer Shortfalls' }, { v: '80K', l: 'Households Guided' }],
    accent: '#ef4444',
    tag: 'Earthquake',
    tagColor: 'text-red-400 bg-red-500/10 border-red-500/25',
  },
  {
    id: 5,
    category: 'Flood Response',
    location: 'Bangladesh',
    date: 'Jun 2024',
    title: 'Monsoon Season — Predictive Evacuation',
    summary: 'Climora\'s 72-hour forecast model predicted severe flooding across 8 districts with 91% accuracy. Coordinated pre-evacuation of 45,000 residents and activated 120 shelters before peak water levels hit.',
    img: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1200&q=80',
    stats: [{ v: '91%', l: 'Forecast Accuracy' }, { v: '45K', l: 'Pre-evacuated' }, { v: '8', l: 'Districts Covered' }],
    accent: '#22c55e',
    tag: 'Flood',
    tagColor: 'text-green-400 bg-green-500/10 border-green-500/25',
  },
  {
    id: 6,
    category: 'Heatwave',
    location: 'Southern Europe',
    date: 'Jul 2024',
    title: 'European Heatwave — Vulnerable Population Alerts',
    summary: 'During the record 2024 European heatwave, Climora issued 1.2M targeted alerts to vulnerable populations. Cooling center occupancy was tracked live, and climate news curation kept 200K users informed with verified guidance.',
    img: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=1200&q=80',
    stats: [{ v: '1.2M', l: 'Alerts Sent' }, { v: '200K', l: 'Users Informed' }, { v: '340', l: 'Cooling Centers' }],
    accent: '#eab308',
    tag: 'Heatwave',
    tagColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
  },
];

const CATEGORIES = ['All', 'Flood Response', 'Wildfire', 'Hurricane', 'Earthquake', 'Heatwave'];

// ─── Hero ─────────────────────────────────────────────────────────────────────

function ShowcaseHero() {
  return (
    <section className="relative pt-40 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-900/15 blur-[160px] rounded-full" />
      </div>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
        <motion.span
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6"
        >
          Real-World Impact
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6"
        >
          Climora in the
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">field.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-400 text-lg max-w-2xl mx-auto"
        >
          From typhoons to wildfires — real deployments, real outcomes. See how Climora has helped communities prepare, respond, and recover.
        </motion.p>

        {/* Live counter strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-12 inline-flex items-center gap-8 px-8 py-4 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm"
        >
          {[['6', 'Case Studies'], ['4', 'Continents'], ['180K+', 'People Helped']].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-black text-white">{v}</div>
              <div className="text-xs text-slate-500 mt-0.5">{l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Filter ───────────────────────────────────────────────────────────────────

function FilterBar({ active, onChange }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap mb-14">
      {CATEGORIES.map(cat => (
        <motion.button
          key={cat} onClick={() => onChange(cat)} whileTap={{ scale: 0.96 }}
          className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${active === cat ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {active === cat && (
            <motion.span layoutId="showcase-pill"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative">{cat}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Featured card (large) ────────────────────────────────────────────────────

function FeaturedCard({ item }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-3xl border border-white/8 overflow-hidden mb-5 group"
      style={{ boxShadow: hovered ? `0 40px 80px -20px ${item.accent}30` : 'none', transition: 'box-shadow 0.5s ease' }}
    >
      {/* Image */}
      <div className="relative h-[480px] md:h-[560px] overflow-hidden">
        <motion.img src={item.img} alt={item.title} style={{ y: imgY }}
          className="w-full h-[115%] object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-transparent" />

        {/* Top meta */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide ${item.tagColor}`}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: item.accent }} />
            {item.tag}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-slate-400 text-xs font-medium">
            {item.location} · {item.date}
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: item.accent }}>{item.category}</p>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{item.title}</h2>
            <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-2xl">{item.summary}</p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              {item.stats.map(s => (
                <div key={s.l} className="text-center">
                  <div className="text-3xl font-black text-white">{s.v}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover border */}
      <motion.div className="absolute inset-0 rounded-3xl pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.4 }}
        style={{ boxShadow: `inset 0 0 0 1px ${item.accent}40` }} />
    </motion.div>
  );
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function GridCard({ item, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl border border-white/8 bg-[#080d1a] overflow-hidden group cursor-default"
      style={{ boxShadow: hovered ? `0 30px 60px -15px ${item.accent}25` : 'none', transition: 'box-shadow 0.4s ease' }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <motion.img src={item.img} alt={item.title} style={{ y: imgY }}
          className="w-full h-[115%] object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080d1a]/30 to-[#080d1a]" />

        {/* Hover tint */}
        <motion.div className="absolute inset-0" animate={{ opacity: hovered ? 0.1 : 0 }} transition={{ duration: 0.4 }}
          style={{ background: `radial-gradient(ellipse at 50% 100%, ${item.accent}, transparent 70%)` }} />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${item.tagColor}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.accent }} />
            {item.tag}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-slate-500 text-[10px] font-medium">
            {item.date}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: item.accent }}>{item.location}</p>
        <h3 className="text-white font-black text-lg leading-tight mb-3">{item.title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-5 line-clamp-3">{item.summary}</p>

        {/* Mini stats */}
        <div className="flex gap-5 pt-4 border-t border-white/5">
          {item.stats.map(s => (
            <div key={s.l}>
              <div className="text-lg font-black text-white">{s.v}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom line */}
      <motion.div className="absolute bottom-0 left-0 right-0 h-px"
        animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.3 }}
        style={{ background: `linear-gradient(90deg, transparent, ${item.accent}80, transparent)` }} />

      {/* Border glow */}
      <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.4 }}
        style={{ boxShadow: `inset 0 0 0 1px ${item.accent}35` }} />
    </motion.article>
  );
}

// ─── Timeline strip ───────────────────────────────────────────────────────────

function Timeline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
          className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Response timeline</h2>
          <p className="text-slate-500 text-base">How Climora activates during a disaster event.</p>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-blue-500/20 to-transparent hidden md:block" />

          <div className="space-y-10">
            {[
              { time: 'T-72h', title: 'Predictive Alert Issued', desc: 'ML models detect anomalous patterns. Targeted alerts sent to at-risk zones.', side: 'left', color: '#eab308' },
              { time: 'T-48h', title: 'Shelter Network Activated', desc: 'Shelters pre-positioned and capacity confirmed. Routing published to users.', side: 'right', color: '#06b6d4' },
              { time: 'T-24h', title: 'Evacuation Coordination', desc: 'Dynamic rerouting as conditions evolve. Relief inventory pre-staged.', side: 'left', color: '#f97316' },
              { time: 'T-0',   title: 'Event Landfall', desc: 'Live incident reports stream in. Community verification active.', side: 'right', color: '#ef4444' },
              { time: 'T+6h',  title: 'Recovery Phase Begins', desc: 'Checklist system guides households. Relief redistribution optimized.', side: 'left', color: '#22c55e' },
            ].map((step, i) => (
              <motion.div
                key={step.time}
                initial={{ opacity: 0, x: step.side === 'left' ? -30 : 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`flex items-center gap-6 md:gap-0 ${step.side === 'right' ? 'md:flex-row-reverse' : ''}`}
              >
                <div className={`w-full md:w-[calc(50%-2rem)] ${step.side === 'right' ? 'md:pl-16' : 'md:pr-16 md:text-right'}`}>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-black tracking-widest mb-2" style={{ background: `${step.color}18`, color: step.color }}>
                    {step.time}
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">{step.title}</h4>
                  <p className="text-slate-500 text-sm">{step.desc}</p>
                </div>

                {/* Dot */}
                <div className="hidden md:flex w-16 justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full border-2 border-current" style={{ color: step.color, background: step.color }} />
                </div>

                <div className="hidden md:block w-[calc(50%-2rem)]" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTAStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} className="py-28">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
          Be part of the next response.
        </h2>
        <p className="text-slate-400 text-lg mb-10">
          Join the network of responders, coordinators, and communities using Climora to stay ahead of climate events.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(6,182,212,0.4)' }} whileTap={{ scale: 0.97 }}
            className="px-9 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20">
            Get Started Free
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="px-9 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-semibold backdrop-blur-sm hover:bg-white/10 transition-all">
            View All Case Studies
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? CASES : CASES.filter(c => c.category === activeCategory);
  const [featured, ...rest] = filtered;

  return (
    <div className="bg-[#030712] min-h-screen">
      <Navbar />
      <main>
        <ShowcaseHero />

        <section className="max-w-7xl mx-auto px-6 md:px-12 pb-10">
          <FilterBar active={activeCategory} onChange={setActiveCategory} />

          <AnimatePresence mode="wait">
            <motion.div key={activeCategory} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              {/* Featured large card */}
              {featured && <FeaturedCard item={featured} />}

              {/* Grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                  {rest.map((item, i) => <GridCard key={item.id} item={item} index={i} />)}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <Timeline />
        <CTAStrip />
      </main>
      <Footer />
    </div>
  );
}
