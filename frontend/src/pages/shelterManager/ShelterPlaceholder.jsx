import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, Users, Bell, Activity, BarChart2, Globe, LogOut, Search, Layers } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Shelters',      icon: Home,      to: '/shelter-dashboard' },
  { label: 'Relief Items',  icon: Package,   to: '/shelter/relief-items' },
  { label: 'Occupancy',     icon: Users,     to: '/shelter/occupancy' },
  { label: 'Shelter Status',icon: Layers,    to: '/shelter/status' },
  { label: 'Alerts',        icon: Bell,      to: '/shelter/alerts' },
  { label: 'Weather',       icon: Activity,  to: '/shelter/weather' },
  { label: 'Reports',       icon: BarChart2, to: '/shelter/reports' },
];

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B3C5D] flex flex-col z-40 select-none">
      <div className="px-6 py-6 border-b border-white/10">
        <span className="text-white font-bold text-xl tracking-tight">Climora <span className="text-[#06b6d4]">Shelter</span></span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink key={to} to={to} end={to === '/shelter-dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
            }>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-6 space-y-0.5 border-t border-white/10 pt-4">
        <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150"><Globe size={18} /> Go to Website</button>
        <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-150"><LogOut size={18} /> Logout</button>
      </div>
    </aside>
  );
}

function Topbar() {
  const { user } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || 'S';
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="relative w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all" />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#06b6d4] hover:border-[#06b6d4] transition-colors"><Bell size={18} /></button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] flex items-center justify-center text-white text-sm font-bold">{initial}</div>
      </div>
    </header>
  );
}

export default function ShelterPlaceholder({ title, icon: Icon, description }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 bg-white">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className="bg-[#F9FAFB] rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-24 text-gray-400">
            {Icon && <Icon size={48} className="mb-4 opacity-20" />}
            <p className="text-base font-semibold">{title} — Coming Soon</p>
            <p className="text-sm mt-1">This section is under development.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
