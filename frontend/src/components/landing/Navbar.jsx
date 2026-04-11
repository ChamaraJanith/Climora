import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProfileDropdown from '../ui/ProfileDropdown';

const NAV_LINKS = [
  { label: 'Features',         href: '/features' },
  { label: 'Weather Explorer', href: '/weather' },
  { label: 'Feeds',            href: '/feeds' },
  { label: 'About',            href: '/#about' },
  { label: 'Contact',          href: '/contact' },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [activeLink, setActiveLink] = useState(null);
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const getDashboardRoute = (role) => {
    switch (role) {
      case 'ADMIN': return '/admin/dashboard';
      case 'SHELTER_MANAGER': return '/shelter-dashboard';
      case 'CONTENT_MANAGER': return '/content-dashboard';
      case 'USER':
      default: return '/dashboard';
    }
  };

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

            {/* Desktop CTA or User Dropdown */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              {user ? (
                <ProfileDropdown user={user} onLogout={logout} triggerTheme="dark" />
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-slate-400 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200"
                  >
                    Sign In
                  </Link>
                  <motion.button
                    onClick={() => navigate('/register')}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(6,182,212,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 tracking-wide"
                  >
                    Get Started
                  </motion.button>
                </>
              )}
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
            className="md:hidden relative bg-[#07101f]/95 backdrop-blur-2xl border-b border-white/[0.07]"
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
                {user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-white font-semibold text-sm truncate">{user.username}</span>
                        <span className="text-slate-400 text-xs truncate">{user.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(getDashboardRoute(user.role));
                      }}
                      className="text-slate-300 text-sm font-medium px-4 py-3 rounded-xl hover:bg-white/5 text-left transition-all border border-white/5 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                      Go to Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="text-red-400 text-sm font-medium px-4 py-3 rounded-xl hover:bg-red-500/10 text-left transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="text-slate-300 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all"
                    >
                      Sign In
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/register');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold w-full shadow-lg shadow-cyan-500/20"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}