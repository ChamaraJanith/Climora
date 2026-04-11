import { useRef, useState, useEffect, useCallback } from 'react';
import {
  motion, useInView, AnimatePresence, useScroll, useTransform,
  useMotionValue, useSpring, animate,
} from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMAIL = 'climoraclimate@gmail.com';

const CONTACT_CARDS = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    label: 'Email Us', value: EMAIL, sub: 'We reply within 24 hours', accent: '#06b6d4', href: `mailto:${EMAIL}`,
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>,
    label: 'Headquarters', value: 'Sri Lanka', sub: 'UTC+5:30 · Mon–Fri 9am–6pm', accent: '#6366f1', href: null,
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    label: 'Live Support', value: 'Available in-app', sub: 'Avg. response under 5 min', accent: '#22c55e', href: null,
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    label: 'Emergency', value: '24/7 Active Response', sub: 'For active disaster events', accent: '#ef4444', href: null,
  },
];

const TOPICS = ['General Inquiry','Partnership / NGO','Government / Emergency Services','Press & Media','Technical Support','Careers','Other'];

const FAQS = [
  { q: 'Is Climora free to use?', a: 'Yes — the core platform is free for individuals and communities. We offer paid plans for organizations needing advanced features, API access, or dedicated support.' },
  { q: 'How do I integrate with existing emergency systems?', a: 'We provide a REST API and webhook system. Our partnerships team can guide you through integration with CAP-compliant alert systems, GIS platforms, and government databases.' },
  { q: 'Can NGOs and government agencies get special pricing?', a: 'Absolutely. We offer free or heavily discounted access for verified NGOs, humanitarian organizations, and government emergency services.' },
  { q: 'How accurate are the weather forecasts?', a: 'Our 72-hour flood forecasting model has achieved 91% accuracy in Southeast Asia deployments. We publish full model performance reports publicly.' },
  { q: 'Is my data secure?', a: 'Yes. All data is encrypted in transit and at rest. We follow industry-standard security practices and are compliant with international data protection regulations.' },
];

const STATS = [
  { value: 50000, suffix: '+', label: 'Active Users', color: '#06b6d4' },
  { value: 200, suffix: '+', label: 'Shelters Tracked', color: '#6366f1' },
  { value: 99.9, suffix: '%', label: 'Uptime', color: '#22c55e', decimals: 1 },
  { value: 24, suffix: 'h', label: 'Avg. Response', color: '#f97316' },
];

// ─── Typewriter ───────────────────────────────────────────────────────────────

const PHRASES = ['what matters.', 'climate resilience.', 'your community.', 'the future.'];

function Typewriter() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    let timeout;
    if (!deleting && displayed.length < phrase.length) {
      timeout = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === phrase.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % PHRASES.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, phraseIdx]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-[3px] h-[0.85em] bg-cyan-400 ml-1 align-middle rounded-sm"
      />
    </span>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix, decimals = 0, color }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: 'easeOut',
      onUpdate: v => setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.floor(v).toLocaleString()),
    });
    return controls.stop;
  }, [inView, value, decimals]);

  return (
    <span ref={ref} className="font-black text-3xl md:text-4xl" style={{ color }}>
      {display}{suffix}
    </span>
  );
}

// ─── Spotlight cursor ─────────────────────────────────────────────────────────

function SpotlightHero({ children }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className="relative">
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(6,182,212,0.06), transparent 60%)`
          ),
        }}
      />
      {children}
    </div>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i, x: (i * 4.7) % 100, y: (i * 7.3) % 100,
  size: (i % 3) + 1.5, duration: 10 + (i % 8), delay: (i * 0.4) % 6,
  opacity: 0.15 + (i % 4) * 0.07,
}));

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
            background: p.id % 3 === 0 ? '#06b6d4' : p.id % 3 === 1 ? '#6366f1' : '#22c55e',
            opacity: p.opacity,
          }}
          animate={{ y: [0, -50, 0], x: [0, p.id % 2 === 0 ? 15 : -15, 0], opacity: [p.opacity, p.opacity * 2.5, p.opacity] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Orbit ring ───────────────────────────────────────────────────────────────

function OrbitRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[320, 520, 720].map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full border border-cyan-500/10"
          style={{ width: size, height: size }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 20 + i * 8, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-cyan-400/60"
            style={{ top: -4, left: '50%', translateX: '-50%' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function ContactHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } } };
  const fadeUp = { hidden: { opacity: 0, y: 50, filter: 'blur(8px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <SpotlightHero>
      <section ref={ref} className="relative min-h-[88vh] flex items-center overflow-hidden bg-[#030712] pt-24 pb-20">
        {/* Deep ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.45, 0.25] }} transition={{ duration: 9, repeat: Infinity }}
            className="absolute top-[-20%] left-[-8%] w-[800px] h-[800px] rounded-full bg-blue-900/30 blur-[140px]" />
          <motion.div animate={{ scale: [1, 1.22, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 11, repeat: Infinity, delay: 2 }}
            className="absolute bottom-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full bg-cyan-900/25 blur-[120px]" />
          <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 14, repeat: Infinity, delay: 5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-indigo-900/20 blur-[110px]" />
        </div>

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.032]" style={{
          backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <OrbitRing />
        <FloatingParticles />

        <motion.div style={{ y, opacity }} className="relative z-20 w-full max-w-5xl mx-auto px-6 md:px-12 text-center">
          <motion.div variants={stagger} initial="hidden" animate="show">

            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-8 flex justify-center">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-[6px] rounded-full border border-dashed border-cyan-500/30"
                />
                <span className="relative inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-semibold tracking-wide backdrop-blur-sm">
                  <motion.span animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-cyan-400" />
                  Get In Touch
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[88px] font-black text-white tracking-tight leading-[1.0] mb-6">
              Let's talk about
              <br />
              <Typewriter />
            </motion.h1>

            <motion.p variants={fadeUp} className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
              Whether you're an NGO, government agency, journalist, or just curious —
              we'd love to hear from you. Climate resilience is a team effort.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4 mb-16">
              <motion.a href={`mailto:${EMAIL}`}
                whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(6,182,212,0.5)' }} whileTap={{ scale: 0.97 }}
                className="px-9 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base shadow-xl shadow-cyan-500/30 flex items-center gap-2.5 transition-all relative overflow-hidden group"
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2.5">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Email Us Directly
                </span>
              </motion.a>
              <motion.a href="#contact-form"
                whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.25)' }} whileTap={{ scale: 0.97 }}
                className="px-9 py-4 rounded-xl border border-white/12 bg-white/5 text-white font-bold text-base backdrop-blur-sm hover:bg-white/10 transition-all"
              >
                Use the Form →
              </motion.a>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {STATS.map(s => (
                <div key={s.label} className="text-center">
                  <AnimatedCounter value={s.value} suffix={s.suffix} decimals={s.decimals} color={s.color} />
                  <p className="text-slate-500 text-xs mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
          <span className="text-[10px] text-slate-600 tracking-[0.2em] uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-px h-12 bg-gradient-to-b from-cyan-500/70 to-transparent" />
        </motion.div>
      </section>
    </SpotlightHero>
  );
}

// ─── Contact Cards ────────────────────────────────────────────────────────────

function MagneticCard({ children, className, style, onClick }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  return (
    <motion.div ref={ref}
      onMouseMove={e => { const r = ref.current?.getBoundingClientRect(); if (!r) return; x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', ...style }}
      className={className}
    >{children}</motion.div>
  );
}

function ContactCards() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
      {CONTACT_CARDS.map((card, i) => (
        <motion.div key={card.label}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <MagneticCard
            className="relative rounded-2xl border border-white/8 bg-[#080d1a] p-6 group overflow-hidden h-full cursor-default"
            style={{ cursor: card.href ? 'pointer' : 'default' }}
            onClick={() => card.href && window.open(card.href)}
          >
            {/* Hover glow border */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ boxShadow: `inset 0 0 0 1px ${card.accent}50` }} />
            {/* Corner radial */}
            <div className="absolute top-0 right-0 w-36 h-36 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at top right, ${card.accent}20, transparent 70%)` }} />
            {/* Animated bottom bar */}
            <motion.div className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
              style={{ background: `linear-gradient(90deg, ${card.accent}, ${card.accent}44)` }}
              initial={{ width: 0 }} animate={inView ? { width: '100%' } : {}}
              transition={{ duration: 1, delay: i * 0.1 + 0.5 }} />
            {/* Shimmer on hover */}
            <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{ background: `linear-gradient(105deg, transparent 40%, ${card.accent}08 50%, transparent 60%)` }} />

            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 relative z-10 transition-transform duration-300 group-hover:scale-110"
              style={{ background: `${card.accent}15`, color: card.accent, border: `1px solid ${card.accent}35` }}>
              {card.icon}
            </div>
            <p className="text-[10px] font-black tracking-[0.15em] uppercase mb-2 relative z-10" style={{ color: card.accent }}>{card.label}</p>
            <p className="text-white font-bold text-sm mb-1.5 relative z-10 group-hover:text-white transition-colors">{card.value}</p>
            <p className="text-slate-600 text-xs relative z-10 leading-relaxed">{card.sub}</p>
          </MagneticCard>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Multi-step Form ──────────────────────────────────────────────────────────

const STEPS = ['Who are you?', 'Your message', 'Review & send'];

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                background: i < step ? '#06b6d4' : i === step ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
                borderColor: i <= step ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                scale: i === step ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0"
            >
              {i < step ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span className={`text-xs font-black ${i === step ? 'text-cyan-400' : 'text-slate-600'}`}>{i + 1}</span>
              )}
            </motion.div>
            <span className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-white' : i < step ? 'text-cyan-400' : 'text-slate-600'}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <motion.div className="flex-1 h-px mx-2"
              animate={{ background: i < step ? 'linear-gradient(90deg,#06b6d4,#06b6d4)' : 'rgba(255,255,255,0.08)' }}
              transition={{ duration: 0.4 }} />
          )}
        </div>
      ))}
    </div>
  );
}

function ContactForm() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [focused, setFocused] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const maxChars = 500;
  const charPct = (form.message.length / maxChars) * 100;
  const charColor = charPct > 90 ? '#ef4444' : charPct > 70 ? '#eab308' : '#06b6d4';

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1800);
  };

  const base = 'w-full bg-[#0a1020] border rounded-xl px-4 py-3.5 text-white text-sm placeholder-slate-700 outline-none transition-all duration-300';
  const inp = (f) => `${base} ${focused === f ? 'border-cyan-500/50 shadow-[0_0_0_3px_rgba(6,182,212,0.08)]' : 'border-white/8 hover:border-white/18'}`;

  const step1Valid = form.name.trim() && form.email.trim() && /\S+@\S+\.\S+/.test(form.email);
  const step2Valid = form.topic && form.message.trim().length >= 10;

  return (
    <motion.div id="contact-form" ref={ref}
      initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl border border-white/8 bg-[#080d1a] p-8 md:p-10 overflow-hidden"
    >
      {/* Breathing glows */}
      <motion.div animate={{ opacity: [0.04, 0.09, 0.04] }} transition={{ duration: 5, repeat: Infinity }}
        className="absolute top-0 left-0 w-96 h-96 bg-cyan-500 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <motion.div animate={{ opacity: [0.03, 0.07, 0.03] }} transition={{ duration: 7, repeat: Infinity, delay: 2 }}
        className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center py-20 text-center relative z-10"
          >
            {/* Ripple rings */}
            {[1, 2, 3].map(i => (
              <motion.div key={i}
                className="absolute rounded-full border border-cyan-500/20"
                initial={{ width: 80, height: 80, opacity: 0.8 }}
                animate={{ width: 80 + i * 60, height: 80 + i * 60, opacity: 0 }}
                transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
            <motion.div
              initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-6 relative z-10"
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <motion.path d="M20 6L9 17l-5-5" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.3 }} />
              </svg>
            </motion.div>
            <motion.h3 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-white font-black text-3xl mb-3">Message sent.</motion.h3>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="text-slate-400 text-sm max-w-sm leading-relaxed">
              We'll get back to you at <span className="text-cyan-400 font-semibold">{form.email}</span> within 24 hours.
            </motion.p>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              onClick={() => { setSubmitted(false); setStep(0); setForm({ name: '', email: '', topic: '', message: '' }); }}
              className="mt-8 text-cyan-400 text-sm font-semibold hover:text-cyan-300 transition-colors">
              ← Send another message
            </motion.button>
          </motion.div>
        ) : (
          <div key="form" className="relative z-10">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white mb-1">Send us a message</h2>
              <p className="text-slate-500 text-sm">Fill in the form and we'll be in touch shortly.</p>
            </div>

            <StepIndicator step={step} />

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase">Full Name</label>
                      <input type="text" required placeholder="Your name"
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                        className={inp('name')} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase">Email Address</label>
                      <input type="email" required placeholder="you@example.com"
                        value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                        className={inp('email')} />
                    </div>
                  </div>
                  <motion.button type="button" onClick={() => setStep(1)} disabled={!step1Valid}
                    whileHover={step1Valid ? { scale: 1.02, boxShadow: '0 0 30px rgba(6,182,212,0.35)' } : {}}
                    whileTap={step1Valid ? { scale: 0.98 } : {}}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
                  >
                    Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </motion.button>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s1"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase">Topic</label>
                    <select required value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                      onFocus={() => setFocused('topic')} onBlur={() => setFocused(null)}
                      className={`${inp('topic')} appearance-none`}>
                      <option value="" disabled>Select a topic...</option>
                      {TOPICS.map(t => <option key={t} value={t} className="bg-[#080d1a]">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-black text-slate-500 tracking-widest uppercase">Message</label>
                      <span className="text-[10px] font-bold transition-colors" style={{ color: charColor }}>
                        {form.message.length}/{maxChars}
                      </span>
                    </div>
                    <div className="relative">
                      <textarea required rows={5} placeholder="Tell us what's on your mind..."
                        value={form.message} maxLength={maxChars}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        onFocus={() => setFocused('message')} onBlur={() => setFocused(null)}
                        className={`${inp('message')} resize-none`} />
                      {/* Char progress arc */}
                      <div className="absolute bottom-3 right-3 w-6 h-6">
                        <svg viewBox="0 0 24 24" className="w-full h-full -rotate-90">
                          <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5"/>
                          <motion.circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5"
                            stroke={charColor} strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 9}`}
                            animate={{ strokeDashoffset: 2 * Math.PI * 9 * (1 - charPct / 100) }}
                            transition={{ duration: 0.2 }} />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button type="button" onClick={() => setStep(0)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex-1 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all">
                      ← Back
                    </motion.button>
                    <motion.button type="button" onClick={() => setStep(2)} disabled={!step2Valid}
                      whileHover={step2Valid ? { scale: 1.02, boxShadow: '0 0 30px rgba(6,182,212,0.35)' } : {}}
                      whileTap={step2Valid ? { scale: 0.98 } : {}}
                      className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20">
                      Review <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  {/* Review card */}
                  <div className="rounded-2xl border border-white/8 bg-[#0a1020] p-5 space-y-3">
                    {[
                      { label: 'Name', value: form.name },
                      { label: 'Email', value: form.email },
                      { label: 'Topic', value: form.topic },
                    ].map(r => (
                      <div key={r.label} className="flex items-start justify-between gap-4">
                        <span className="text-slate-600 text-xs font-bold uppercase tracking-widest flex-shrink-0">{r.label}</span>
                        <span className="text-white text-sm text-right font-medium">{r.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-slate-600 text-xs font-bold uppercase tracking-widest block mb-1.5">Message</span>
                      <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">{form.message}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button type="button" onClick={() => setStep(1)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex-1 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all">
                      ← Edit
                    </motion.button>
                    <motion.button type="button" onClick={handleSubmit} disabled={loading}
                      whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(6,182,212,0.45)' }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-lg shadow-cyan-500/25 relative overflow-hidden group">
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center gap-2">
                        {loading ? (
                          <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Sending...</>
                        ) : (
                          <>Send Message <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                        )}
                      </span>
                    </motion.button>
                  </div>
                  <p className="text-center text-slate-600 text-xs">
                    Or email directly at{' '}
                    <a href={`mailto:${EMAIL}`} className="text-cyan-500 hover:text-cyan-400 transition-colors font-medium">{EMAIL}</a>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Side Info ────────────────────────────────────────────────────────────────

function SideInfo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const responseTimes = [
    { label: 'General inquiries', time: '< 24h', color: '#06b6d4' },
    { label: 'Partnership requests', time: '< 48h', color: '#6366f1' },
    { label: 'Technical support', time: '< 4h', color: '#22c55e' },
    { label: 'Emergency / critical', time: '< 1h', color: '#ef4444' },
  ];

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: 50 }} animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5"
    >
      {/* Status card */}
      <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-6 overflow-hidden relative">
        <motion.div animate={{ opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-0 right-0 w-48 h-48 bg-green-500 blur-[90px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-5 relative z-10">
          <div className="relative">
            <motion.div animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-green-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 relative z-10" />
          </div>
          <span className="text-green-400 text-sm font-bold">All systems operational</span>
        </div>
        <h3 className="text-white font-black text-base mb-4 relative z-10">Response times</h3>
        <div className="relative z-10">
          {responseTimes.map((r, i) => (
            <motion.div key={r.label}
              initial={{ opacity: 0, x: -15 }} animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.09 + 0.3 }}
              className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 group"
            >
              <span className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">{r.label}</span>
              <motion.span className="text-sm font-black px-2 py-0.5 rounded-lg"
                style={{ color: r.color, background: `${r.color}12` }}>
                {r.time}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Direct email */}
      <motion.a href={`mailto:${EMAIL}`}
        whileHover={{ scale: 1.02, boxShadow: '0 0 35px rgba(6,182,212,0.22)' }} whileTap={{ scale: 0.98 }}
        className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-blue-600/8 p-6 flex items-center gap-4 group cursor-pointer transition-all duration-300 relative overflow-hidden"
      >
        <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.06), transparent)' }} />
        <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 flex-shrink-0 group-hover:bg-cyan-500/25 group-hover:scale-110 transition-all duration-300">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-white font-bold text-sm mb-0.5">Direct Email</p>
          <p className="text-cyan-400 text-xs font-medium truncate">{EMAIL}</p>
        </div>
        <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </motion.div>
      </motion.a>

      {/* Office hours */}
      <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-6 relative overflow-hidden">
        <motion.div animate={{ opacity: [0.02, 0.05, 0.02] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />
        <h3 className="text-white font-black text-base mb-4 relative z-10">Office hours</h3>
        {[
          { day: 'Monday – Friday', hours: '9:00 – 18:00 IST', active: true },
          { day: 'Saturday', hours: '10:00 – 14:00 IST', active: true },
          { day: 'Sunday', hours: 'Closed', active: false },
        ].map((o, i) => (
          <motion.div key={o.day}
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: i * 0.08 + 0.5 }}
            className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 relative z-10"
          >
            <span className="text-slate-400 text-sm">{o.day}</span>
            <span className={`text-sm font-semibold ${o.active ? 'text-white' : 'text-slate-600'}`}>{o.hours}</span>
          </motion.div>
        ))}
        <p className="text-slate-600 text-xs mt-4 leading-relaxed relative z-10">Emergency response support is available 24/7 for active disaster events.</p>
      </div>

      {/* Social */}
      <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-6">
        <h3 className="text-white font-black text-base mb-4">Follow us</h3>
        <div className="flex gap-3">
          {[
            { label: 'X / Twitter', color: '#fff', bg: '#ffffff12', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
            { label: 'LinkedIn', color: '#0a66c2', bg: '#0a66c212', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg> },
            { label: 'GitHub', color: '#a855f7', bg: '#a855f712', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg> },
          ].map(s => (
            <motion.button key={s.label} whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.92 }}
              className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center transition-all"
              style={{ color: s.color, background: s.bg }} title={s.label}>
              {s.icon}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [open, setOpen] = useState(null);

  return (
    <section ref={ref} className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-indigo-900/12 blur-[130px] rounded-full" />
      </div>
      {/* Wave divider top */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1440 40" className="w-full" preserveAspectRatio="none">
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,0 L0,0 Z" fill="rgba(255,255,255,0.02)"/>
        </svg>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}
          className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-5">FAQ</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Frequently asked</h2>
          <p className="text-slate-500 text-base">Quick answers to common questions.</p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="rounded-2xl border border-white/8 bg-[#080d1a] overflow-hidden group"
            >
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left">
                <span className={`font-semibold text-sm pr-4 transition-colors duration-200 ${open === i ? 'text-cyan-300' : 'text-white group-hover:text-cyan-200'}`}>{faq.q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 45 : 0, background: open === i ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)' }}
                  transition={{ duration: 0.25 }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10"
                >
                  <span className={`text-lg leading-none transition-colors ${open === i ? 'text-cyan-400' : 'text-slate-500'}`}>+</span>
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-16 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 via-blue-600/5 to-indigo-600/8 p-10 md:p-16 text-center overflow-hidden"
        >
          <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.45, 0.25] }} transition={{ duration: 9, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
          {/* Animated corner dots */}
          {[['top-4 left-4', '#06b6d4'], ['top-4 right-4', '#6366f1'], ['bottom-4 left-4', '#22c55e'], ['bottom-4 right-4', '#f97316']].map(([pos, color]) => (
            <motion.div key={pos} className={`absolute ${pos} w-1.5 h-1.5 rounded-full`}
              style={{ background: color }} animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }} />
          ))}

          <div className="relative z-10">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/35">
              <svg width="26" height="26" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="white" fillOpacity="0.95"/>
                <circle cx="8" cy="6" r="1.5" fill="white" fillOpacity="0.7"/>
              </svg>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Ready to make an impact?</h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of communities using Climora to stay safe and respond smarter to climate emergencies.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.a href={`mailto:${EMAIL}`}
                whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(6,182,212,0.5)' }} whileTap={{ scale: 0.97 }}
                className="px-9 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-xl shadow-cyan-500/30 flex items-center gap-2.5 transition-all">
                Contact Us
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </motion.a>
              <motion.a href="/register"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className="px-9 py-4 rounded-xl border border-white/12 bg-white/5 text-white font-bold hover:bg-white/10 transition-all">
                Get Started Free
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <div className="bg-[#030712] min-h-screen">
      <main>
        <ContactHero />
        <section className="max-w-7xl mx-auto px-6 md:px-12 pb-10">
          <ContactCards />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <ContactForm />
            <SideInfo />
          </div>
        </section>
        <FAQ />
        <CTABanner />
      </main>
    </div>
  );
}
