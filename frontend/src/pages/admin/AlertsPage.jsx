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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('active');
  const navigate = useNavigate();

  const fetchAlerts = async (page = 1) => {
    const params = {
      page,
      limit: 12
    };

    if (status === 'active') params.isActive = 'true';
    if (status === 'inactive') params.isActive = 'false';
    // if 'all' → no isActive param

    const res = await api.get('/alerts', { params });
    return res.data;
  };

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        const data = await fetchAlerts(page);
        setAlerts(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [page, status]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const filtered = alerts.filter((a) => {
    const matchSearch =
      !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.area?.district?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severity === 'ALL' || a.severity === severity;
    // Backend purely handles active/inactive, no need for frontend filter here
    
    return matchSearch && matchSeverity;
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
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setStatus('active')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${status === 'active' ? 'bg-white text-[#06b6d4] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Active
              </button>
              <button
                onClick={() => setStatus('inactive')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${status === 'inactive' ? 'bg-white text-[#06b6d4] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Inactive
              </button>
              <button
                onClick={() => setStatus('all')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${status === 'all' ? 'bg-white text-[#06b6d4] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                All
              </button>
            </div>
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((alert) => (
                <AlertCard key={alert._id} alert={alert} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition 
                    ${page <= 1 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'}
                  `}
                >
                  Prev
                </button>

                <span className="text-sm font-medium text-gray-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition 
                    ${page >= totalPages 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'}
                  `}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AlertsPage;
