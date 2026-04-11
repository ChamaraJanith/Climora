import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileDropdown from '../ui/ProfileDropdown';

const Topbar = ({ searchValue, onSearchChange, placeholder = 'Search...' }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-20 bg-gradient-to-br from-[rgba(5,10,25,0.95)] to-[rgba(10,15,35,0.92)] backdrop-blur-[18px] border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Background Depth Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,150,255,0.08),transparent_70%)] pointer-events-none z-0" />

      {/* Left side: Optional Search */}
      <div className="relative z-10 w-full max-w-md">
        {onSearchChange && (
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <Search size={18} className="text-[#38bdf8] drop-shadow-[0_0_6px_rgba(56,189,248,0.8)] transition-all duration-300 group-focus-within:text-[#00c6ff]" />
            </div>
            <input
              type="text"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-[52px] pr-5 py-3 rounded-[16px] border border-white/10 bg-gradient-to-br from-[rgba(10,15,30,0.85)] to-[rgba(15,23,42,0.75)] text-white placeholder-white/40 focus:outline-none focus:border-[#00c6ff] focus:shadow-[0_0_20px_rgba(0,198,255,0.4),inset_0_0_20px_rgba(0,150,255,0.05)] shadow-[inset_0_0_20px_rgba(0,150,255,0.05)] transition-all duration-300 text-[15px]"
            />
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="relative z-10 flex items-center gap-5">
        <button className="relative w-[42px] h-[42px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#00c6ff] hover:bg-white/10 hover:border-[#00c6ff]/50 hover:shadow-[0_0_15px_rgba(0,198,255,0.3)] transition-all duration-300">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ff4d4d] rounded-full border-2 border-[rgba(15,23,42,1)] shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse" />
        </button>
        <div className="hover:drop-shadow-[0_0_12px_rgba(0,150,255,0.4)] transition-all duration-300 rounded-full">
          <ProfileDropdown user={user} onLogout={logout} triggerTheme="light" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
