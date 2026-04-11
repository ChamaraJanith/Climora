import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEAM = [
  { name: 'Aisha Rahman', role: 'CEO & Co-founder', bio: 'Former UNDP disaster risk advisor. 12 years in humanitarian response across Southeast Asia.', img: 'https://i.pravatar.cc/300?img=47', accent: '#06b6d4' },
  { name: 'Marcus Chen', role: 'CTO & Co-founder', bio: 'Ex-Google infrastructure engineer. Built real-time systems serving 100M+ users.', img: 'https://i.pravatar.cc/300?img=12', accent: '#3b82f6' },
  { name: 'Priya Nair', role: 'Head of Data Science', bio: 'PhD in atmospheric science. Pioneered ML-based flood prediction models used by 3 governments.', img: 'https://i.pravatar.cc/300?img=32', accent: '#a855f7' },
  { name: 'James Okafor', role: 'Head of Operations', bio: 'Led field operations for Red Cross across 8 countries. Expert in last-mile logistics.', img: 'https://i.pravatar.cc/300?img=15', accent: '#22c55e' },
  { name: 'Sofia Mendez', role: 'Lead Designer', bio: 'Previously at IDEO. Specialises in crisis UX — designing for high-stress, low-bandwidth environments.', img: 'https://i.pravatar.cc/300?img=25', accent: '#f97316' },
  { name: 'Yuki Tanaka', role: 'Head of Partnerships', bio: 'Built NGO and government partnerships across 40+ countries for climate resilience programs.', img: 'https://i.pravatar.cc/300?img=53', accent: '#eab308' },
];

const VALUES = [
  { icon: '⚡', title: 'Speed over perfection', desc: 'In a disaster, a good alert now beats a perfect alert too late. We build for real-time, always.', color: '#eab308', glow: 'rgba(234,179,8,0.15)' },
  { icon: '🌍', title: 'Equity by design', desc: 'Climate disasters hit the most vulnerable hardest. Every feature is built with that reality in mind.', color: '#22c55e', glow: 'rgba(34,197,94,0.15)' },
  { icon: '🔍', title: 'Radical transparency', desc: 'We publish our model accuracy, our data sources, and our failure reports. Trust is earned, not assumed.', color: '#06b6d4', glow: 'rgba(6,182,212,0.15)' },
  { icon: '🤝', title: 'Community first', desc: 'The best data comes from the ground. We build tools that empower communities, not replace them.', color: '#a855f7', glow: 'rgba(168,85,247,0.15)' },
];

const MILESTONES = [
  { year: '2021', title: 'Founded', desc: 'Climora started as a research project after the 2021 European floods exposed critical gaps in early warning systems.', color: '#06b6d4' },
  { year: '2022', title: 'First Deployment', desc: 'Piloted in Bangladesh during monsoon season. 8,000 residents received early warnings. Zero flood fatalities in covered zones.', color: '#3b82f6' },
  { year: '2023', title: 'Series A', desc: 'Raised $12M to expand the shelter network and build the community reporting layer. Reached 10 countries.', color: '#a855f7' },
  { year: '2024', title: 'Scale', desc: '50,000+ active users. 200+ shelters. Deployed across 4 continents. Partnered with UNDP and Red Cross.', color: '#22c55e' },
  { year: '2025', title: 'AI Forecasting', desc: 'Launched 72-hour predictive engine. Achieved 91% accuracy on flood forecasting in Southeast Asia.', color: '#f97316' },
  { year: '2026', title: 'Today', desc: 'Operating in 28 countries. Building toward a world where no one is caught off guard by a climate event.', color: '#eab308' },
];

const STATS = [
  { value: '28', suffix: '+', label: 'Countries', color: '#06b6d4' },
  { value: '50K', suffix: '+', label: 'Active Users', color: '#3b82f6' },
  { value: '200', suffix: '+', label: 'Shelters', color: '#a855f7' },
  { value: '91', suffix: '%', label: 'Forecast Accuracy', color: '#22c55e' },
];

// ─── Floating Particles ───────────────────────────────────────────────────────

function Particles({ count = 30 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.4 + 0.1,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan-400"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: p.opacity }}
          animate={{ y: [0, -40, 0], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Magnetic Button ──────────────────────────────────────────────────────────

function MagneticButton({ children, className, style, onClick }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.3);
    y.set((e.clientY - cy) * 0.3);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy, ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileTap={{ scale: 0.96 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const isK = value.includes('K');
    const num = parseFloat(value.replace('K', ''));
    const end = isK ? num * 1000 : num;
    let start = 0;
    const duration = 1800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * end);
      setDisplay(isK && current >= 1000 ? `${(current / 1000).toFixed(0)}K` : `${current}`);
      if (progress < 1) requestAnimationFrame(step);
      else setDisplay(value);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function AboutHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Parallax bg */}
      <motion.div style={{ y: imgY, scale }} className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1800&q=80"
          alt="landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/60 via-[#030712]/55 to-[#030712]" />
      </motion.div>

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-900/30 blur-[160px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-900/20 blur-[120px] rounded-full"
        />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <Particles count={25} />

      <motion.div style={{ y: textY, opacity }} className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-44 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-8"
        >
          <motion.span
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
          />
          Our Story
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.02] mb-8"
        >
          Built by people who've
          <br />
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">
              seen the gaps.
            </span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-indigo-500 origin-left rounded-full"
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12"
        >
          Climora was born from frustration — watching communities suffer not from lack of data, but from lack of the right tools to act on it. We're here to close that gap.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-slate-500 text-xs tracking-widest uppercase">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-cyan-400" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="relative py-16 border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 via-blue-900/10 to-indigo-900/5" />
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-black mb-1" style={{ color: s.color }}>
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </div>
              <div className="text-slate-500 text-sm font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mission ──────────────────────────────────────────────────────────────────

function MissionSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.0]);

  return (
    <section ref={ref} className="py-32 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-6"
            >
              Our Mission
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6">
              No one should be caught off guard by a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                climate event.
              </span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-5">
              Climate disasters are becoming more frequent, more intense, and more unpredictable. The technology to respond better already exists — it's just not reaching the people who need it most.
            </p>
            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Climora exists to change that. We build tools that give communities, emergency responders, and governments the intelligence and coordination they need — before, during, and after a disaster.
            </p>
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-cyan-500 to-transparent" />
              <span className="text-slate-600 text-xs tracking-widest uppercase">Since 2021</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Decorative ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-4 rounded-3xl border border-dashed border-cyan-500/10"
            />
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]"
              style={{ boxShadow: '0 40px 100px -20px rgba(6,182,212,0.2)' }}>
              <motion.div style={{ scale: imgScale }} className="w-full h-full">
                <img
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=80"
                  alt="Mission"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#030712]/50 via-transparent to-transparent" />
              <div className="absolute inset-0 rounded-2xl border border-white/10" />

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute bottom-5 left-5 bg-[#030712]/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white text-sm font-semibold">Live in 28 countries</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Values ───────────────────────────────────────────────────────────────────

function ValuesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [hovered, setHovered] = useState(null);

  return (
    <section ref={ref} className="py-28 border-t border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-sm font-medium mb-5">
            What We Stand For
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Our values</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              whileHover={{ y: -6, scale: 1.01 }}
              className="relative rounded-2xl border border-white/8 bg-[#080d1a] p-8 group overflow-hidden cursor-default"
              style={{
                boxShadow: hovered === i ? `0 20px 60px -10px ${v.glow}` : 'none',
                transition: 'box-shadow 0.4s ease',
              }}
            >
              {/* Animated bg glow on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{ opacity: hovered === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ background: `radial-gradient(ellipse at 30% 30%, ${v.glow}, transparent 70%)` }}
              />

              <motion.div
                animate={{ scale: hovered === i ? 1.15 : 1, rotate: hovered === i ? 5 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-4xl mb-5 inline-block"
              >
                {v.icon}
              </motion.div>
              <h3 className="text-white font-black text-xl mb-3" style={{ color: hovered === i ? v.color : 'white', transition: 'color 0.3s' }}>
                {v.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed relative z-10">{v.desc}</p>

              {/* Corner accent */}
              <motion.div
                animate={{ opacity: hovered === i ? 1 : 0, scale: hovered === i ? 1 : 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full border"
                style={{ borderColor: v.color + '40', background: v.color + '15' }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function MilestoneSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ['0%', '100%']);

  return (
    <section ref={ref} className="py-28 border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[600px] bg-cyan-900/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium mb-5">
            Our Journey
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">From idea to impact</h2>
        </motion.div>

        <div className="relative">
          {/* Animated line */}
          <div className="absolute left-[72px] top-0 bottom-0 w-px bg-white/5">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-gradient-to-b from-cyan-500 via-blue-500 to-purple-500 origin-top"
            />
          </div>

          <div className="space-y-12">
            {MILESTONES.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, x: -40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: i * 0.12 }}
                className="flex gap-8 items-start group"
              >
                {/* Year */}
                <div className="w-16 flex-shrink-0 text-right pt-0.5">
                  <span className="text-sm font-black" style={{ color: m.color }}>{m.year}</span>
                </div>

                {/* Dot */}
                <div className="flex-shrink-0 mt-1">
                  <motion.div
                    whileInView={{ scale: [0, 1.3, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.12 + 0.2 }}
                    className="w-3.5 h-3.5 rounded-full ring-4 ring-opacity-20"
                    style={{ background: m.color, ringColor: m.color }}
                  />
                </div>

                {/* Content */}
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                  className="pb-2 flex-1"
                >
                  <h4 className="text-white font-bold text-base mb-1.5 group-hover:text-cyan-300 transition-colors">{m.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{m.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Team ─────────────────────────────────────────────────────────────────────

function TeamCard({ member, index, inView }) {
  const [hovered, setHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-60, 60], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-60, 60], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); setHovered(false); }}
      onMouseEnter={() => setHovered(true)}
      className="relative rounded-2xl border border-white/8 bg-[#080d1a] p-6 group overflow-hidden cursor-default"
      whileHover={{ scale: 1.02 }}
    >
      {/* Glow bg */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 20% 20%, ${member.accent}18, transparent 65%)` }}
      />

      {/* Top accent line */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-0 left-0 right-0 h-[2px] origin-left rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${member.accent}, transparent)` }}
      />

      {/* Avatar row */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative flex-shrink-0">
          <motion.div
            animate={{ boxShadow: hovered ? `0 0 0 3px ${member.accent}50` : '0 0 0 2px rgba(255,255,255,0.08)' }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 rounded-xl overflow-hidden"
          >
            <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
          </motion.div>
          <motion.div
            animate={{ scale: hovered ? 1.2 : 1 }}
            transition={{ duration: 0.3 }}
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#080d1a]"
            style={{ background: member.accent }}
          />
        </div>
        <div>
          <div className="text-white font-bold text-base">{member.name}</div>
          <motion.div
            animate={{ color: hovered ? member.accent : '#64748b' }}
            transition={{ duration: 0.3 }}
            className="text-xs font-semibold mt-0.5"
          >
            {member.role}
          </motion.div>
        </div>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed relative z-10">{member.bio}</p>

      {/* Border glow */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${member.accent}30` }}
      />
    </motion.div>
  );
}

function TeamSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-28 border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/8 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-5">
            The Team
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            People behind the platform
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            A team of engineers, scientists, and humanitarian workers united by one goal.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEAM.map((member, i) => (
            <TeamCard key={member.name} member={member} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Partners ─────────────────────────────────────────────────────────────────

function PartnersSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const logos = ['UNDP', 'Red Cross', 'FEMA', 'WHO', 'World Bank', 'UNICEF'];

  return (
    <section ref={ref} className="py-20 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center text-slate-600 text-xs font-semibold tracking-widest uppercase mb-12"
        >
          Trusted by global organizations
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {logos.map((logo, i) => (
            <motion.div
              key={logo}
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ scale: 1.1, color: '#94a3b8' }}
              className="text-slate-700 font-black text-lg tracking-tight cursor-default transition-colors"
            >
              {logo}
            </motion.div>
          ))}
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
    <section ref={ref} className="py-32 border-t border-white/5 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-cyan-900/20 via-blue-900/25 to-indigo-900/20 blur-[120px] rounded-full"
        />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <Particles count={15} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto px-6 text-center relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-8"
        >
          <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          We're hiring
        </motion.div>

        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
          Want to work{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            with us?
          </span>
        </h2>
        <p className="text-slate-400 text-lg mb-12 leading-relaxed">
          We're always looking for engineers, scientists, and humanitarian experts who want to build technology that matters.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <MagneticButton
            className="px-9 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
          >
            View Open Roles
          </MagneticButton>
          <MagneticButton
            className="px-9 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-semibold backdrop-blur-sm hover:bg-white/10 transition-all"
          >
            Partner With Us
          </MagneticButton>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="bg-[#030712] min-h-screen">
      <Navbar />
      <main>
        <AboutHero />
        <StatsBar />
        <MissionSection />
        <ValuesSection />
        <MilestoneSection />
        <TeamSection />
        <PartnersSection />
        <CTAStrip />
      </main>
    </div>
  );
}
