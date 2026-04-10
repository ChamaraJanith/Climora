import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const getDashboardRoute = (role) => {
  switch (role) {
    case 'ADMIN': return '/admin/dashboard';
    case 'SHELTER_MANAGER': return '/shelter-dashboard';
    case 'CONTENT_MANAGER': return '/content-dashboard';
    case 'USER':
    default: return '/dashboard';
  }
};

const ProfileDropdown = ({ user, onLogout, triggerTheme = 'dark' }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'SHELTER_MANAGER') return 'Shelter';
    if (role === 'CONTENT_MANAGER') return 'Content';
    return 'User';
  };

  const isLight = triggerTheme === 'light';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-colors border ${
          isLight 
            ? 'bg-white border-gray-200 hover:bg-gray-50' 
            : 'bg-white/5 border-white/10 hover:bg-white/10'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex flex-col items-start px-0.5">
           <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-200'}`}>
             {user.username}
           </span>
        </div>
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-3 w-56 bg-[#071324] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden z-[100]`}
          >
            <div className="px-4 py-3 border-b border-white/[0.06] mb-1">
              <div className="flex justify-between items-start gap-2">
                 <p className="text-sm text-white font-semibold truncate">{user.username}</p>
                 <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/20 font-bold uppercase tracking-widest shrink-0">
                   {getRoleBadge(user.role)}
                 </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
            </div>
            <div className="px-2 py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate(getDashboardRoute(user.role));
                }}
                className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                Dashboard
              </button>
            </div>
            <div className="px-2 pb-1 border-t border-white/[0.06] pt-1 mt-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  if (onLogout) {
                     onLogout();
                     navigate('/');
                  }
                }}
                className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
