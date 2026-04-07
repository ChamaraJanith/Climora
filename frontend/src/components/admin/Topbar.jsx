import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Topbar = ({ searchValue, onSearchChange, placeholder = 'Search...' }) => {
  const { user } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || 'A';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end px-6 sticky top-0 z-30">

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#06b6d4] hover:border-[#06b6d4] transition-colors duration-150">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] flex items-center justify-center text-white text-sm font-bold">
          {initial}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
