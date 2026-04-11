import { motion } from 'framer-motion';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Home, Package, Users, Bell, Activity, BarChart2,
  Globe, LogOut, Layers,
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

export default function ShelterSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.aside
      initial={{ x: -72, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col select-none shadow-2xl shadow-black/20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(180deg, #061f3f 0%, #041938 50%, #020f2b 100%)
        `,
        backgroundSize: '40px 40px, 40px 40px, 100% 100%',
        backgroundColor: '#020f2b',
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#06b6d4] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="white" fillOpacity="0.95" />
            <circle cx="8" cy="6" r="1.5" fill="white" fillOpacity="0.75" />
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none">
            Climora <span className="text-cyan-400">Shelter</span>
          </div>
          <div className="text-white/40 text-[10px] mt-0.5">Shelter Manager</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/shelter-dashboard'}
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

      {/* Bottom: user info + actions */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-4">
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
          onClick={() => navigate('/')}
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
    </motion.aside>
  );
}
