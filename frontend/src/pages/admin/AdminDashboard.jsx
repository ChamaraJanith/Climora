import { useEffect, useState } from 'react';
import { Users, Bell, Home, ClipboardList, ShieldAlert } from 'lucide-react';
import Topbar from '../../components/admin/Topbar';
import StatCard from '../../components/admin/StatCard';
import api from '../../services/api';
import { getSeverityConfig } from '../../utils/severityConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

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
        const total = res.data.reduce((acc, curr) => acc + curr.Flood + curr.Landslide + curr.Pollution + curr.Other, 0);
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
        <div className="relative bg-gradient-to-br from-[rgba(5,10,25,0.95)] to-[rgba(10,15,35,0.9)] backdrop-blur-[18px] rounded-[20px] p-8 border border-[rgba(255,255,255,0.06)] shadow-[0_25px_50px_rgba(0,0,0,0.6)] overflow-hidden animate-[fadeInUp_0.4s_ease-out_forwards]">
          {/* Depth Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,150,255,0.08),transparent_50%)] pointer-events-none z-0" />
          
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00c6ff] to-[#0072ff] opacity-90 shadow-[0_0_15px_#00c6ff] z-10" />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Incident Reports (Last 7 Days)</h2>
              <p className="text-[13px] text-white/60 mt-1 uppercase tracking-widest font-semibold">Verified reports categorized by type</p>
            </div>
            
            {/* Verified Report Button Glass Badge */}
            <div className="mt-4 sm:mt-0 flex items-center gap-3 bg-[rgba(0,150,255,0.1)] border border-[rgba(0,150,255,0.3)] text-[#00c6ff] px-5 py-2.5 rounded-[14px] shadow-[0_0_15px_rgba(0,150,255,0.4)] backdrop-blur-md hover:shadow-[0_0_25px_rgba(0,150,255,0.6)] hover:-translate-y-0.5 transition-all duration-300">
              <ShieldAlert className="w-5 h-5 text-[#00c6ff] drop-shadow-[0_0_8px_rgba(0,198,255,0.8)]" />
              <span className="text-2xl font-black">{totalReports}</span>
              <span className="text-xs uppercase tracking-widest font-bold text-white/80">Verified</span>
            </div>
          </div>
          
          <div className="relative z-10 w-full h-[350px]">
            {chartData.length === 0 || totalReports === 0 ? (
              <div className="h-full flex items-center justify-center text-white/40 tracking-widest uppercase text-sm font-bold">No verified incidents in the last 7 days</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00c6ff" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorLandslide" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffb347" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#ff7b00" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorPollution" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff9c" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#00b873" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d1d5db" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#6b7280" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="5 5" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={15} stroke="rgba(255,255,255,0.5)" fontSize={12} fontWeight={600} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} stroke="rgba(255,255,255,0.5)" fontSize={12} fontWeight={600} />
                  
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(5,10,25,0.95)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 15px 30px rgba(0,0,0,0.5), 0 0 15px rgba(0,150,255,0.2)',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600'
                    }}
                    itemStyle={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', paddingTop: '4px' }}
                    labelStyle={{ color: '#00c6ff', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <Legend verticalAlign="top" height={40} wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }} />
                  
                  <Bar dataKey="Flood" stackId="a" fill="url(#colorFlood)" radius={[2, 2, 0, 0]} animationDuration={1200} animationEasing="ease-out" style={{ filter: 'drop-shadow(0 0 6px rgba(0,198,255,0.3))' }} />
                  <Bar dataKey="Landslide" stackId="a" fill="url(#colorLandslide)" radius={[2, 2, 0, 0]} animationDuration={1200} animationEasing="ease-out" style={{ filter: 'drop-shadow(0 0 6px rgba(255,123,0,0.3))' }} />
                  <Bar dataKey="Pollution" stackId="a" fill="url(#colorPollution)" radius={[2, 2, 0, 0]} animationDuration={1200} animationEasing="ease-out" style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,156,0.3))' }} />
                  <Bar dataKey="Other" stackId="a" fill="url(#colorOther)" radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* System Status placeholder */}
        <div className="relative bg-gradient-to-br from-[rgba(5,10,25,0.95)] to-[rgba(10,15,35,0.9)] backdrop-blur-[18px] rounded-[20px] p-6 border border-[rgba(255,255,255,0.06)] shadow-[0_25px_50px_rgba(0,0,0,0.6)] overflow-hidden">
          <h2 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium text-white/80">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#00ff9c] animate-pulse shadow-[0_0_8px_rgba(0,255,156,0.8)] inline-block" />
              Backend API: Online
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#00ff9c] animate-pulse shadow-[0_0_8px_rgba(0,255,156,0.8)] inline-block" />
              Weather Service: Active
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#00ff9c] animate-pulse shadow-[0_0_8px_rgba(0,255,156,0.8)] inline-block" />
              Alert System: Running
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
