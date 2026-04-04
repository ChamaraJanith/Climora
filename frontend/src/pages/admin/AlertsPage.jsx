import { useEffect, useState } from 'react';
import { Plus, Filter, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/admin/Topbar';
import AlertCard from '../../components/admin/AlertCard';
import api from '../../services/api';

const SEVERITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const AlertCardSkeleton = () => (
  <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-100 animate-pulse space-y-3">
    <div className="flex justify-between">
      <div className="h-5 w-20 bg-gray-200 rounded-full" />
      <div className="h-4 w-24 bg-gray-200 rounded" />
    </div>
    <div className="h-5 w-3/4 bg-gray-200 rounded" />
    <div className="space-y-1.5">
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
    </div>
    <div className="flex justify-between pt-2 border-t border-gray-100">
      <div className="h-4 w-28 bg-gray-200 rounded" />
      <div className="h-7 w-7 bg-gray-200 rounded-full" />
    </div>
  </div>
);

const AlertsPage = () => {
  console.log("AlertsPage rendered");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        console.log("Fetching alerts...");
        console.log("Calling API...");
        const response = await api.get('/alerts');
        console.log("API Response:", response);
        const data = response.data;
        const fetchedAlerts = data.data || [];
        
        const sortedAlerts = [...fetchedAlerts].sort((a, b) => {
          if (a.isActive === b.isActive) return 0;
          return a.isActive ? -1 : 1;
        });

        setAlerts(sortedAlerts);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    console.log("Component mounted");
    fetchAlerts();
  }, []);

  const filtered = alerts.filter((a) => {
    const matchSearch =
      !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.area?.district?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severity === 'ALL' || a.severity === severity;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? a.isActive : !a.isActive);
    
    return matchSearch && matchSeverity && matchStatus;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search alerts by title or location..."
      />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Emergency Alerts</h1>
            <p className="text-sm text-gray-500 mt-1">Stay updated with the latest climate and environmental warnings.</p>
          </div>
          <button
            onClick={() => navigate('/admin/alerts/create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-medium hover:from-[#0891b2] hover:to-[#2563eb] transition-all duration-150 shadow-sm"
          >
            <Plus size={16} />
            Create Alert
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts by title or location..."
              className="w-full pl-4 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all duration-150"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all duration-150"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Severities' : s}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all duration-150"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <AlertCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell size={40} className="mb-3 opacity-30" />
            <p className="text-base font-medium">No alerts found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((alert) => (
              <AlertCard key={alert._id} alert={alert} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AlertsPage;
