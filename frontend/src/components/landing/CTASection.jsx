import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative py-32 bg-[#030712] overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[400px] bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-indigo-900/30 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/2 p-12 md:p-20 backdrop-blur-sm overflow-hidden"
        >
          {/* Corner glows */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2" />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6"
          >
            Ready when
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"> disaster isn't.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-slate-400 text-lg mb-10 max-w-xl mx-auto"
          >
            Join thousands of emergency responders and communities using Climora to stay ahead of climate events.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(6,182,212,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base shadow-xl shadow-cyan-500/20"
            >
              Start for Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-xl border border-white/15 bg-white/5 text-white font-semibold text-base backdrop-blur-sm hover:bg-white/10 transition-all"
            >
              Contact Sales
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
