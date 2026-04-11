import { useEffect, useState } from 'react';
import { Users, Bell, Home, ClipboardList, ShieldAlert } from 'lucide-react';
import Topbar from '../../components/admin/Topbar';
import StatCard from '../../components/admin/StatCard';
import api from '../../services/api';
import { getSeverityConfig } from '../../utils/severityConfig';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: null, alerts: null, shelters: null, reports: null, risk: null,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [totalReports, setTotalReports] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/auth/users'),
        api.get('/alerts', {
          params: { isActive: 'true' } // MUST be string
        }),
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
        alerts: getValue(results[1], (d) => d.pagination?.totalRecords ?? (d.data?.length ?? 'N/A')),
        shelters: getValue(results[2], (d) => Array.isArray(d.shelters) ? d.shelters.length : (d.length ?? 'N/A')),
        reports:  getValue(results[3], (d) => Array.isArray(d.reports) ? d.reports.length : (d.length ?? 'N/A')),
        risk:     getValue(results[4], (d) => d.riskLevel || d.risk || 'N/A'),
      });
      setLoading(false);
    };
    fetchStats();

    api.get('/reports/stats/last-7-days')
      .then(res => {
        setChartData(res.data);
        const total = res.data.reduce((acc, curr) => acc + curr.count, 0);
        setTotalReports(total);
      })
      .catch(console.error);
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

        {/* Dynamic Chart */}
        <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-700">Incident Reports (Last 7 Days)</h2>
              <p className="text-sm text-gray-500">Verified reports submitted in the past week</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-blue-500" />
              <span className="text-xl font-bold">{totalReports}</span>
              <span className="text-sm font-medium">Verified Reports</span>
            </div>
          </div>
          
          <div className="w-full h-80">
            {chartData.length === 0 || totalReports === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No verified incidents in the last 7 days</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} animationDuration={1000} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} Reports`, 'Count']}
                    labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* System Status placeholder */}
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
