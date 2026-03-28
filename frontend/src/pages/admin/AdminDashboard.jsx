import { useEffect, useState } from 'react';
import { Users, Bell, Home, ClipboardList, ShieldAlert } from 'lucide-react';
import Topbar from '../../components/admin/Topbar';
import StatCard from '../../components/admin/StatCard';
import api from '../../services/api';
import { getSeverityConfig } from '../../utils/severityConfig';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: null, alerts: null, shelters: null, reports: null, risk: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/auth/users'),
        api.get('/alerts?isActive=true'),
        api.get('/shelters'),
        api.get('/reports/admin/all'),
        api.get('/weather/risk?lat=6.9271&lon=79.8612'),
      ]);

      const getValue = (result, extractor) => {
        if (result.status === 'fulfilled') {
          try { return extractor(result.value.data); } catch { return 'N/A'; }
        }
        return 'N/A';
      };

      setStats({
        users:    getValue(results[0], (d) => Array.isArray(d.users) ? d.users.length : (d.length ?? 'N/A')),
        alerts:   getValue(results[1], (d) => Array.isArray(d.alerts) ? d.alerts.length : (d.length ?? 'N/A')),
        shelters: getValue(results[2], (d) => Array.isArray(d.shelters) ? d.shelters.length : (d.length ?? 'N/A')),
        reports:  getValue(results[3], (d) => Array.isArray(d.reports) ? d.reports.length : (d.length ?? 'N/A')),
        risk:     getValue(results[4], (d) => d.riskLevel || d.risk || 'N/A'),
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const riskCfg = getSeverityConfig(typeof stats.risk === 'string' ? stats.risk : 'LOW');

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar placeholder="Search dashboard..." />
      <main className="flex-1 p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back. Here's what's happening today.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard icon={Users}        label="Total Users"     value={stats.users}    color="text-[#06b6d4]" loading={loading} />
          <StatCard icon={Bell}         label="Active Alerts"   value={stats.alerts}   color="text-orange-500" loading={loading} />
          <StatCard icon={Home}         label="Shelters"        value={stats.shelters} color="text-green-500"  loading={loading} />
          <StatCard icon={ClipboardList} label="Reports"        value={stats.reports}  color="text-purple-500" loading={loading} />
          <StatCard
            icon={ShieldAlert}
            label="Risk Level"
            value={loading ? null : stats.risk}
            color={loading ? 'text-gray-400' : riskCfg.dot.replace('bg-', 'text-')}
            loading={loading}
          />
        </div>

        {/* Recent activity placeholder */}
        <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Backend API: Online
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Weather Service: Active
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Alert System: Running
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
