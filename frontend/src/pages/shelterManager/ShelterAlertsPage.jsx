import { useEffect, useMemo, useState } from 'react';
import { Bell, Search, Filter, AlertTriangle, ShieldAlert, Info, BellRing, MapPin } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ShelterSidebar from '../../components/shelterManager/ShelterSidebar';

const SEVERITY_THEMES = {
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  HIGH:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  MEDIUM:   { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  LOW:      { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' },
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
];

const SEVERITY_OPTIONS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function Topbar({ search, onSearch }) {
  const { user } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || 'S';
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="relative w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder="Search alerts by title or district..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all duration-150" />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#06b6d4] hover:border-[#06b6d4] transition-colors duration-150"><Bell size={18} /></button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] flex items-center justify-center text-white text-sm font-bold">{initial}</div>
      </div>
    </header>
  );
}


function AlertCard({ alert }) {
  const severity = alert.severity?.toUpperCase() || 'LOW';
  const theme = SEVERITY_THEMES[severity] || SEVERITY_THEMES.LOW;
  const displayDistrict = alert.area?.district || alert.district || 'Unknown District';
  const startAt = alert.startAt || alert.createdAt || alert.start;
  const issueTime = startAt ? new Date(startAt).toLocaleString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className={`rounded-3xl border ${theme.border} ${theme.bg} shadow-sm overflow-hidden`}> 
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-snug">{alert.title || 'Untitled Alert'}</h3>
            <p className="text-xs uppercase tracking-[0.24em] font-semibold mt-2 text-gray-500">{displayDistrict}</p>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.22em] px-3 py-1 rounded-full ${theme.badge}`}>{alert.severity || 'INFO'}</span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{alert.description || 'No description available.'}</p>

        <div className="mt-4 flex flex-wrap gap-2 items-center text-[11px] text-gray-600">
          {issueTime && <span className="px-2 py-1 bg-white border border-black/5 rounded-xl">Issued {issueTime}</span>}
          <span className="px-2 py-1 bg-white/80 border border-black/5 rounded-xl">Status: {alert.isActive ? 'Active' : 'Inactive'}</span>
          {alert.source && <span className="px-2 py-1 bg-white/80 border border-black/5 rounded-xl">Source: {alert.source}</span>}
        </div>
      </div>
    </div>
  );
}

function DistrictSection({ district, alerts }) {
  const count = alerts.length;
  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-5 bg-slate-50 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{district}</h2>
          <p className="text-sm text-gray-500">{count} alert{count === 1 ? '' : 's'} in this district</p>
        </div>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {alerts.map((alert) => <AlertCard key={alert._id || alert.alertId || alert.title} alert={alert} />)}
      </div>
    </section>
  );
}

const ShelterAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        const params = { limit: 200 };
        if (statusFilter === 'active') params.isActive = 'true';
        if (statusFilter === 'inactive') params.isActive = 'false';
        const res = await api.get('/alerts', { params });
        setAlerts(res.data.data || res.data || []);
      } catch (error) {
        console.error('Failed to load shelter alerts', error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [statusFilter]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const titleMatch = alert.title?.toLowerCase().includes(search.toLowerCase());
      const districtMatch = alert.area?.district?.toLowerCase().includes(search.toLowerCase()) || alert.district?.toLowerCase().includes(search.toLowerCase());
      const severityMatch = severityFilter === 'ALL' || alert.severity === severityFilter;
      return (titleMatch || districtMatch || !search) && severityMatch;
    });
  }, [alerts, search, severityFilter]);

  const groupedByDistrict = useMemo(() => {
    return filteredAlerts.reduce((acc, alert) => {
      const district = alert.area?.district?.trim() || alert.district?.trim() || 'Unknown District';
      if (!acc[district]) acc[district] = [];
      acc[district].push(alert);
      return acc;
    }, {});
  }, [filteredAlerts]);

  const districtSections = useMemo(() => {
    return Object.entries(groupedByDistrict)
      .sort(([a, alertsA], [b, alertsB]) => alertsB.length - alertsA.length || a.localeCompare(b));
  }, [groupedByDistrict]);

  return (
    <div className="flex min-h-screen bg-white">
      <ShelterSidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar search={search} onSearch={setSearch} />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="mb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Emergency Alerts</h1>
                <p className="text-sm text-gray-500 mt-1">District-level alert summaries for shelter managers, grouped by district.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1 shadow-sm">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none ${
                        statusFilter === option.value
                          ? 'bg-[#06b6d4] text-white shadow-sm'
                          : 'bg-transparent text-slate-600 hover:bg-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full max-w-xs rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4]"
                >
                  {SEVERITY_OPTIONS.map((severity) => (
                    <option key={severity} value={severity}>{severity === 'ALL' ? 'All Severities' : severity}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Alerts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{filteredAlerts.length}</p>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Districts with Alerts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{districtSections.length}</p>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Showing</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{statusFilter === 'all' ? 'All' : statusFilter}</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm animate-pulse h-40" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
              <AlertTriangle size={36} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">No alerts found.</p>
              <p className="text-sm mt-2">Try changing the status, severity, or search term.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {districtSections.map(([district, districtAlerts]) => (
                <DistrictSection key={district} district={district} alerts={districtAlerts} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ShelterAlertsPage;

