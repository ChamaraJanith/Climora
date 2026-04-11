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

    if (search) params.search = search;
    if (severity !== 'ALL') params.severity = severity;

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
  }, [page, status, search, severity]);

  useEffect(() => {
    setPage(1);
  }, [status, search, severity]);

  const filtered = alerts.filter((a) => {
    const matchSeverity = severity === 'ALL' || a.severity === severity;
    return matchSeverity;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar placeholder="Search alerts..." />
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
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <svg className="w-5 h-5 text-[#38bdf8] drop-shadow-[0_0_6px_rgba(56,189,248,0.8)] transition-all duration-300 group-focus-within:text-[#00c6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts by title or location..."
              className="w-full pl-[52px] pr-5 py-3.5 rounded-[16px] border border-white/10 bg-gradient-to-br from-[rgba(10,15,30,0.85)] to-[rgba(15,23,42,0.75)] text-white placeholder-white/40 focus:outline-none focus:border-[#00c6ff] focus:shadow-[0_0_20px_rgba(0,198,255,0.4),inset_0_0_20px_rgba(0,150,255,0.05)] shadow-[inset_0_0_20px_rgba(0,150,255,0.05)] transition-all duration-300 text-[15px]"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Severity Filter */}
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="px-5 py-3.5 rounded-[16px] border border-white/10 bg-gradient-to-br from-[rgba(10,15,30,0.85)] to-[rgba(15,23,42,0.75)] text-white/90 text-[15px] font-medium focus:outline-none focus:border-[#00c6ff] focus:shadow-[0_0_20px_rgba(0,198,255,0.4)] shadow-[inset_0_0_20px_rgba(0,150,255,0.05)] hover:border-[#00c6ff]/50 hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(0,0,0,0.3)] transition-all duration-300 cursor-pointer appearance-none min-w-[170px]"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s} className="bg-[#0a0f1e] text-white">
                  {s === 'ALL' ? 'All Severities' : s}
                </option>
              ))}
            </select>

            {/* Status Toggle Box */}
            <div className="flex items-center gap-2.5 p-1.5 rounded-[16px]">
              <button
                onClick={() => setStatus('active')}
                className={`px-5 py-2.5 text-sm font-semibold rounded-[12px] transition-all duration-250 ${
                  status === 'active' 
                    ? 'bg-gradient-to-r from-[#00c6ff] to-[#0072ff] text-white shadow-[0_0_20px_rgba(0,150,255,0.4)] hover:-translate-y-[2px]' 
                    : 'bg-[rgba(10,15,30,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] text-white/70 hover:text-white hover:border-[#00c6ff]/40 hover:shadow-[0_0_20px_rgba(0,150,255,0.4)] hover:-translate-y-[2px]'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatus('inactive')}
                className={`px-5 py-2.5 text-sm font-semibold rounded-[12px] transition-all duration-250 ${
                  status === 'inactive' 
                    ? 'bg-gradient-to-r from-[#00c6ff] to-[#0072ff] text-white shadow-[0_0_20px_rgba(0,150,255,0.4)] hover:-translate-y-[2px]' 
                    : 'bg-[rgba(10,15,30,0.6)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] text-white/70 hover:text-white hover:border-[#00c6ff]/40 hover:shadow-[0_0_20px_rgba(0,150,255,0.4)] hover:-translate-y-[2px]'
                }`}
              >
                Inactive
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
