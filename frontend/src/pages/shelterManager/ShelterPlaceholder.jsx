import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ShelterSidebar from '../../components/shelterManager/ShelterSidebar';

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
      <ShelterSidebar />
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

