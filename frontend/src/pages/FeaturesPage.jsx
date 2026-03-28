import { useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Alerts', 'Shelter', 'Community', 'Intelligence'];

const FEATURES = [
  {
    id: 1,
    category: 'Alerts',
    tag: 'Live',
    tagColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
    accent: '#eab308',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 19h20L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 9v5M12 16.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Real-Time Weather Alerts',
    subtitle: 'Know before it hits.',
    desc: 'Hyper-local alerts powered by live meteorological feeds, satellite data, and AI pattern recognition. Get push notifications, SMS, and in-app warnings tailored to your exact location — minutes before conditions become dangerous.',
    img: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=900&q=80',
    bullets: ['Sub-kilometer precision targeting', 'Multi-channel delivery (push, SMS, email)', 'Severity scoring from MODERATE to CRITICAL', 'Historical pattern analysis'],
  },
  {
    id: 2,
    category: 'Alerts',
    tag: 'AI',
    tagColor: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
    accent: '#f97316',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Predictive Forecasting',
    subtitle: 'See 72 hours ahead.',
    desc: 'Our ML models ingest data from 200+ weather stations, ocean buoys, and atmospheric sensors to generate 72-hour risk forecasts. Understand not just what is happening — but what is coming.',
    img: 'https://images.unsplash.com/photo-1530908295418-a12e326966ba?w=900&q=80',
    bullets: ['72-hour rolling risk windows', 'Confidence intervals on all predictions', 'Ensemble model averaging', 'Automated escalation triggers'],
  },
  {
    id: 3,
    category: 'Shelter',
    tag: 'Network',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    accent: '#06b6d4',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Shelter Network',
    subtitle: 'Find safety in seconds.',
    desc: 'Live occupancy tracking across 200+ verified emergency shelters. Real-time capacity data, routing from your location, accessibility info, and direct contact with shelter coordinators — all in one view.',
    img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=80',
    bullets: ['Live bed & capacity counts', 'Turn-by-turn routing integration', 'Accessibility & pet-friendly filters', 'Direct coordinator contact'],
  },
  {
    id: 4,
    category: 'Shelter',
    tag: 'Logistics',
    tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    accent: '#3b82f6',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Relief Coordination',
    subtitle: 'Get supplies where they\'re needed.',
    desc: 'End-to-end relief item management — from donation intake to last-mile distribution. Track inventory across all active sites, forecast demand based on shelter occupancy, and coordinate logistics with partner organizations.',
    img: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=900&q=80',
    bullets: ['Multi-site inventory dashboard', 'Demand forecasting engine', 'Partner org integration', 'Audit trail & reporting'],
  },
  {
    id: 5,
    category: 'Community',
    tag: 'Community',
    tagColor: 'text-red-400 bg-red-500/10 border-red-500/25',
    accent: '#ef4444',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    title: 'Incident Reporting',
    subtitle: 'Ground truth, verified fast.',
    desc: 'Community-powered incident reports with photo uploads, GPS tagging, and vote-based verification. Reports are cross-referenced with official data and surfaced on live map overlays within minutes of submission.',
    img: 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=900&q=80',
    bullets: ['GPS-tagged photo reports', 'Community upvote verification', 'Admin moderation layer', 'Live map overlay integration'],
  },
  {
    id: 6,
    category: 'Community',
    tag: 'AI',
    tagColor: 'text-green-400 bg-green-500/10 border-green-500/25',
    accent: '#22c55e',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Smart Checklists',
    subtitle: 'Prepared before the warning.',
    desc: 'AI-generated emergency preparedness checklists tailored to your region, household size, and risk profile. Track completion, get reminders before storm season, and share plans with your household.',
    img: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=900&q=80',
    bullets: ['Region & risk-profile tailoring', 'Household sharing & sync', 'Seasonal reminder system', 'Offline access'],
  },
  {
    id: 7,
    category: 'Intelligence',
    tag: 'Curated',
    tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
    accent: '#a855f7',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2 14h10M2 18h7M2 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Climate News Feed',
    subtitle: 'Signal, not noise.',
    desc: 'Curated climate and disaster intelligence from 500+ verified sources, filtered by geographic relevance and severity. Powered by NLP classification to surface what matters to your region — not just global headlines.',
    img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&q=80',
    bullets: ['500+ verified source network', 'NLP relevance filtering', 'Location-aware curation', 'Bookmark & share'],
  },
  {
    id: 8,
    category: 'Intelligence',
    tag: 'Dashboard',
    tagColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
    accent: '#6366f1',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    title: 'Admin Dashboard',
    subtitle: 'Full situational awareness.',
    desc: 'A unified command view for emergency coordinators — live alert feeds, shelter status, report queues, and relief inventory in one screen. Role-based access for field teams, coordinators, and administrators.',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80',
    bullets: ['Unified command overview', 'Role-based access control', 'Export & audit logs', 'Multi-org support'],
  },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────

function FeaturesHero() {
  return (
    <section className="relative pt-40 pb-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-900/20 blur-[140px] rounded-full" />
      </div>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-6"
        >
          Platform Features
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6"
        >
          Every tool you need
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">when it matters most.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-400 text-lg max-w-2xl mx-auto"
        >
          Climora brings together real-time alerts, shelter management, community reporting, and climate intelligence into one unified platform built for emergency response.
        </motion.p>
      </div>
    </section>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({ active, onChange }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap mb-16">
      {CATEGORIES.map(cat => (
        <motion.button
          key={cat}
          onClick={() => onChange(cat)}
          whileTap={{ scale: 0.96 }}
          className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
            active === cat ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {active === cat && (
            <motion.span
              layoutId="filter-pill"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative">{cat}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [hovered, setHovered] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative rounded-2xl border border-white/8 bg-[#080d1a] overflow-hidden"
      style={{ boxShadow: hovered ? `0 30px 60px -15px ${feature.accent}25` : 'none', transition: 'box-shadow 0.4s ease' }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <motion.img
          src={feature.img}
          alt={feature.title}
          style={{ y: imgY }}
          className="w-full h-[115%] object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080d1a]/40 to-[#080d1a]" />

        {/* Tag */}
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${feature.tagColor}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: feature.accent }} />
            {feature.tag}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 -mt-10 relative z-10"
          style={{ background: `${feature.accent}18`, color: feature.accent, border: `1px solid ${feature.accent}30` }}
        >
          {feature.icon}
        </div>

        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: feature.accent }}>
          {feature.subtitle}
        </p>
        <h3 className="text-white font-black text-xl leading-tight mb-3">{feature.title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">{feature.desc}</p>

        {/* Bullets */}
        <ul className="space-y-2">
          {feature.bullets.map(b => (
            <li key={b} className="flex items-center gap-2.5 text-sm text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: feature.accent }} />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}80, transparent)` }}
      />

      {/* Border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ boxShadow: `inset 0 0 0 1px ${feature.accent}35` }}
      />
    </motion.article>
  );
}

// ─── CTA strip ────────────────────────────────────────────────────────────────

function CTAStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} className="py-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto px-6 text-center"
      >
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
          Ready to put it all to work?
        </h2>
        <p className="text-slate-400 text-lg mb-10">
          Start free — no credit card required. Full access to every feature from day one.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(6,182,212,0.4)' }}
            whileTap={{ scale: 0.97 }}
            className="px-9 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20"
          >
            Get Started Free
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-9 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-semibold backdrop-blur-sm hover:bg-white/10 transition-all"
          >
            Book a Demo
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? FEATURES
    : FEATURES.filter(f => f.category === activeCategory);

  return (
    <div className="bg-[#030712] min-h-screen">
      <Navbar />
      <main>
        <FeaturesHero />

        <section className="max-w-7xl mx-auto px-6 md:px-12 pb-10">
          <FilterBar active={activeCategory} onChange={setActiveCategory} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filtered.map((f, i) => (
                <FeatureCard key={f.id} feature={f} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        </section>

        <CTAStrip />
      </main>
      <Footer />
    </div>
  );
}
