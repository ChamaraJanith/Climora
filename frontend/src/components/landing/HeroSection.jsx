import { useState, useEffect, useRef, Component } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ShelterScene from '../ShelterScene';

class SceneErrorBoundary extends Component {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}

const CYCLING_WORDS = ['Disasters', 'Floods', 'Wildfires', 'Storms', 'Crises'];

function CyclingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % CYCLING_WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block h-[1.1em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ y: 70, opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -70, opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500"
        >
          {CYCLING_WORDS[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

export default function HeroSection() {
  const ref = useRef(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden bg-[#030712] pt-20">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-900/20 blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 3D Globe — right side */}
      <motion.div
        style={{ y, opacity }}
        className="absolute right-0 top-16 w-full md:w-[55%] h-full pointer-events-none"
      >
        <SceneErrorBoundary>
          <ShelterScene />
        </SceneErrorBoundary>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-2xl"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium tracking-wide">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Climate Emergency Response Platform
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
          >
            Respond to
            <br />
            <CyclingWord />
            <br />
            <span className="text-white/80">Smarter.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg"
          >
            Climora unifies real-time weather alerts, shelter management, and community reporting
            into one intelligent platform — built for when it matters most.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
            <motion.button
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(6,182,212,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base tracking-wide shadow-lg shadow-cyan-500/20 transition-all"
            >
              Get Started Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-base backdrop-blur-sm hover:bg-white/10 transition-all"
            >
              Watch Demo →
            </motion.button>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={fadeUp} className="mt-16 flex flex-wrap gap-8">
            {[
              { value: '50K+', label: 'Active Users' },
              { value: '200+', label: 'Shelters Tracked' },
              { value: '99.9%', label: 'Uptime' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-slate-600 tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-px h-10 bg-gradient-to-b from-cyan-500/60 to-transparent"
        />
      </motion.div>
    </section>
  );
}