import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Showcase', href: '/showcase' },
  { label: 'About',    href: '/about' },
  { label: 'Contact',  href: '/contact' },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [activeLink, setActiveLink] = useState(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 40));

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50"
    >
      {/* ── Main bar ── */}
      <div className={`transition-all duration-500 ${
        scrolled
          ? 'bg-[#030712]/85 backdrop-blur-2xl border-b border-white/[0.07] shadow-2xl shadow-black/30'
          : 'bg-transparent border-b border-white/[0.04]'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="h-20 flex items-center justify-between gap-8">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="white" fillOpacity="0.9"/>
                    <circle cx="8" cy="6" r="1.5" fill="white" fillOpacity="0.6"/>
                  </svg>
                </div>
                <span className="text-white font-bold text-[17px] tracking-tight leading-none">Climora</span>
              </motion.div>
            </Link>

            {/* Desktop nav — centred absolutely */}
            <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  onMouseEnter={() => setActiveLink(label)}
                  onMouseLeave={() => setActiveLink(null)}
                  className="relative px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <motion.span
                    className="absolute inset-0 rounded-lg bg-white/5"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: activeLink === label ? 1 : 0, scale: activeLink === label ? 1 : 0.92 }}
                    transition={{ duration: 0.18 }}
                  />
                  <span className="relative">{label}</span>
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <button className="text-slate-400 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200">
                Sign In
              </button>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(6,182,212,0.35)' }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 tracking-wide"
              >
                Get Started
              </motion.button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <motion.span animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 7 : 0 }} transition={{ duration: 0.25 }} className="block w-5 h-[1.5px] bg-white origin-center" />
              <motion.span animate={{ opacity: menuOpen ? 0 : 1 }} transition={{ duration: 0.2 }} className="block w-5 h-[1.5px] bg-white" />
              <motion.span animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -7 : 0 }} transition={{ duration: 0.25 }} className="block w-5 h-[1.5px] bg-white origin-center" />
            </button>

          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="md:hidden bg-[#07101f]/95 backdrop-blur-2xl border-b border-white/[0.07]"
          >
            <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  onClick={() => setMenuOpen(false)}
                  className="text-slate-300 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white transition-all"
                >
                  {label}
                </Link>
              ))}
              <div className="mt-3 pt-3 border-t border-white/[0.07] flex flex-col gap-2">
                <button className="text-slate-300 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all">
                  Sign In
                </button>
                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold w-full shadow-lg shadow-cyan-500/20">
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
