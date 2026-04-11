import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Home, Package, Users, Bell, Activity, BarChart2,
  Globe, LogOut, Layers, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Shelters',       icon: Home,      to: '/shelter-dashboard' },
  { label: 'Relief Items',   icon: Package,   to: '/shelter/relief-items' },
  { label: 'Occupancy',      icon: Users,     to: '/shelter/occupancy' },
  { label: 'Shelter Status', icon: Layers,    to: '/shelter/status' },
  { label: 'Alerts',         icon: Bell,      to: '/shelter/alerts' },
  { label: 'Weather',        icon: Activity,  to: '/shelter/weather' },
  { label: 'Reports',        icon: BarChart2, to: '/shelter/reports' },
];

const sidebarStyle = {
  backgroundImage: `
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(180deg, #061f3f 0%, #041938 50%, #020f2b 100%)
  `,
  backgroundSize: '40px 40px, 40px 40px, 100% 100%',
  backgroundColor: '#020f2b',
};

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-64 h-full flex flex-col select-none" style={sidebarStyle}>
      {/* Logo */}
      <Link
        to="/"
        onClick={() => onClose?.()}
        className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10 hover:bg-white/5 transition-colors duration-200 flex-shrink-0"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#06b6d4] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="white" fillOpacity="0.95" />
            <circle cx="8" cy="6" r="1.5" fill="white" fillOpacity="0.75" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm leading-none">
            Climora <span className="text-cyan-400">Shelter</span>
          </div>
          <div className="text-white/40 text-[10px] mt-0.5">Shelter Manager</div>
        </div>
        {onClose && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="lg:hidden w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/shelter-dashboard'}
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-4 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 mb-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.username}</div>
            <div className="text-white/40 text-[10px] truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={() => { onClose?.(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150"
        >
          <Globe size={18} /> Go to Website
        </button>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-150"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function ShelterSidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden lg:block" style={{ position: 'fixed', left: 0, top: 0, width: 256, height: '100vh', zIndex: 40 }}>
        <SidebarContent />
      </div>

      {/* Mobile: slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden fixed left-0 top-0 h-full z-50"
              style={{ width: 256 }}
            >
              <SidebarContent onClose={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
