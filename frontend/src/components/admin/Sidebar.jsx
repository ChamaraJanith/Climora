import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bell, FileText, Newspaper, Home as ShelterIcon,
  ClipboardList, Users, UserCog, CloudSun, Settings, Globe, LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard',        icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Alerts',           icon: Bell,            to: '/admin/alerts' },
  { label: 'Articles',         icon: FileText,        to: '/admin/articles' },
  { label: 'Climate News',     icon: Newspaper,       to: '/admin/climate-news' },
  { label: 'Shelters',         icon: ShelterIcon,     to: '/admin/shelters' },
  { label: 'Reports',          icon: ClipboardList,   to: '/admin/reports' },
  { label: 'Users',            icon: Users,           to: '/admin/users' },
  { label: 'Staff Management', icon: UserCog,         to: '/admin/staff' },
  { label: 'Weather Monitor',  icon: CloudSun,        to: '/admin/weather' },
  { label: 'Settings',         icon: Settings,        to: '/admin/settings' },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B3C5D] flex flex-col z-40 select-none">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <span className="text-white font-bold text-xl tracking-tight">
          Climora <span className="text-[#06b6d4]">Admin</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
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

      {/* Bottom actions */}
      <div className="px-3 pb-6 space-y-0.5 border-t border-white/10 pt-4">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150"
        >
          <Globe size={18} />
          Go to Website
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-150"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
