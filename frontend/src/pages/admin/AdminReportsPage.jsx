import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, RefreshCcw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Topbar from '../../components/admin/Topbar';
import AdminReportCard from '../../components/admin/AdminReportCard';
import AdminReportDetail from '../../components/admin/AdminReportDetail';

const CATEGORIES = ["ALL", "FLOOD", "LANDSLIDE", "CYCLONE", "DROUGHT", "POLLUTION", "OTHER"];
const SEVERITIES = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    category: "ALL",
    severity: "ALL",
    search: ""
  });

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
      const params = {
        status: 'PENDING'
      };
      
      if (filters.category !== 'ALL') params.category = filters.category;
      if (filters.severity !== 'ALL') params.severity = filters.severity;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.get('/reports/admin/all', { params });
      setReports(response.data);
      
      // Select the first report if nothing is selected or if current selection is not in the list
      if (response.data.length > 0) {
        if (!selectedReportId || !response.data.find(r => r._id === selectedReportId)) {
          setSelectedReportId(response.data[0]._id);
        }
      } else {
        setSelectedReportId(null);
      }
    } catch (error) {
      console.error("Failed to fetch pending reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.severity, debouncedSearch]);

  const handleUpdateStatus = async (reportId, status) => {
    try {
      await api.patch(`/reports/${reportId}/status`, { status });
      toast.success(`Report ${status === 'ADMIN_VERIFIED' ? 'Approved' : 'Rejected'} Successfully`);
      // Re-fetch to update the list, keeping filters intact
      await fetchReports();
      // Remove selection
      setSelectedReportId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update report status");
    }
  };

  const selectedReport = reports.find(r => r._id === selectedReportId);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 h-screen overflow-hidden">
      <Topbar placeholder="Search pending reports..." />
      
      <main className="flex-1 p-6 flex gap-6 h-[calc(100vh-64px)] overflow-hidden max-w-[1600px] w-full mx-auto">
        
        {/* Left Panel: List View */}
        <section className="w-full lg:w-1/3 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full shrink-0">
          
          <div className="p-4 border-b border-gray-100 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
                {reports.length} Total
              </span>
            </div>

            {/* Filters Row */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search titles or descriptions..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-500"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>)}
                </select>

                <select
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-500"
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                >
                  {SEVERITIES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Severities' : s}</option>)}
                </select>
                
                <button
                  onClick={fetchReports}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                  title="Refresh List"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="text-center py-10 flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Loading pending reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Filter className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-1">No Pending Reports</h3>
                <p className="text-gray-500 text-sm">You've caught up! No reports matching this criteria.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {reports.map((report) => (
                  <AdminReportCard 
                    key={report._id} 
                    report={report} 
                    isSelected={selectedReportId === report._id}
                    onClick={() => setSelectedReportId(report._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Detail View */}
        <section className="hidden lg:block lg:w-2/3 h-full">
          <AdminReportDetail 
            report={selectedReport} 
            onUpdateStatus={handleUpdateStatus} 
          />
        </section>

      </main>
    </div>
  );
};

export default AdminReportsPage;
