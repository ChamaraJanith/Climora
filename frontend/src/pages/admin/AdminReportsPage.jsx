import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Topbar from '../../components/admin/Topbar';
import AdminReportCard from '../../components/admin/AdminReportCard';
import { motion } from 'framer-motion';

const CATEGORIES = ["ALL", "FLOOD", "LANDSLIDE", "CYCLONE", "DROUGHT", "POLLUTION", "OTHER"];
const SEVERITIES = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Filters
  const [filters, setFilters] = useState({
    category: "ALL",
    severity: "ALL",
    search: ""
  });
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { status: statusFilter };
      
      if (filters.category !== 'ALL') params.category = filters.category;
      if (filters.severity !== 'ALL') params.severity = filters.severity;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.get('/reports/admin/all', { params });
      setReports(response.data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, filters.category, filters.severity, debouncedSearch]);

  const handleCardClick = (report) => {
    navigate(`/admin/reports/${report._id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 h-[100dvh] overflow-hidden">
      <Topbar placeholder="Search anywhere..." />
      
      <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] w-full mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex-1 max-w-2xl">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Report Management</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Review and manage environmental reports submitted by users. Approve or reject reports based on accuracy and severity to maintain platform integrity.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-center gap-4 sticky top-0 z-10">
            <div className="relative w-full lg:w-1/3">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search titles or descriptions..."
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:font-normal"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <div className="flex w-full lg:w-auto flex-1 gap-3 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar hide-scrollbar-mobile">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-blue-500 cursor-pointer min-w-[130px] shrink-0"
              >
                <option value="PENDING">Pending Approvals</option>
                <option value="ADMIN_VERIFIED">Verified Reports</option>
                <option value="REJECTED">Rejected Reports</option>
              </select>

              <select
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-blue-500 cursor-pointer min-w-[140px] shrink-0"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>)}
              </select>

              <select
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-blue-500 cursor-pointer min-w-[140px] shrink-0"
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              >
                {SEVERITIES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Severities' : s}</option>)}
              </select>
              
              <button
                onClick={fetchReports}
                className="ml-auto shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors font-semibold text-sm"
                title="Refresh List"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Grid Section */}
          <div className="pb-16">
            {loading ? (
              <div className="text-center py-20 flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                className="text-center py-24 flex flex-col items-center bg-white rounded-3xl border border-dashed border-gray-300"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 border border-gray-100 shadow-sm">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  There are no reports matching the current filters. Try adjusting your search criteria or changing the status filter.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {reports.map((report) => (
                  <motion.div key={report._id} variants={itemVariants} className="h-full">
                    <AdminReportCard 
                      report={report} 
                      onClick={handleCardClick}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminReportsPage;