import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = {
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Cloud: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  CheckSquare: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <polyline points="9 11 12 14 22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  BookOpen: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Newspaper: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 14h10M2 18h7M2 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Award: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="17 6 23 6 23 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ── Sidebar ────────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview', label: 'Overview', icon: Icon.TrendingUp },
  { id: 'alerts', label: 'Alerts', icon: Icon.Bell },
  { id: 'shelters', label: 'Shelters', icon: Icon.MapPin },
  { id: 'weather', label: 'Weather', icon: Icon.Cloud },
  { id: 'checklists', label: 'Checklists', icon: Icon.CheckSquare },
  { id: 'articles', label: 'Learn', icon: Icon.BookOpen },
  { id: 'news', label: 'Climate News', icon: Icon.Newspaper },
  { id: 'reports', label: 'Report', icon: Icon.AlertTriangle },
];

function Sidebar({ active, setActive, user, onLogout }) {
  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 top-0 h-full w-64 bg-[#050b18] border-r border-white/6 z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="white" fillOpacity="0.9"/>
              <circle cx="8" cy="6" r="1.5" fill="white" fillOpacity="0.6"/>
            </svg>
          </div>
          <span className="text-white font-bold text-[17px]">Climora</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ id, label, icon: NavIcon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              active === id
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
            }`}
          >
            <NavIcon />
            {label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/6">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Icon.User />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{user?.username}</div>
            <div className="text-slate-600 text-xs truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/8 transition-all"
        >
          <Icon.LogOut />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: CardIcon, accent, sub, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="relative rounded-2xl border border-white/8 bg-[#080d1a] p-5 overflow-hidden group hover:border-white/15 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>
          <CardIcon />
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</div>
      {sub && <div className="text-slate-600 text-xs mt-1">{sub}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />
    </motion.div>
  );
}

// ── Alert Badge ────────────────────────────────────────────────────────────────
const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  moderate: '#eab308',
  low: '#22c55e',
};

function AlertCard({ alert }) {
  const color = SEVERITY_COLORS[alert.severity?.toLowerCase()] || '#06b6d4';
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-4 rounded-xl border border-white/6 bg-white/2 hover:bg-white/4 transition-colors"
    >
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 animate-pulse" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color }}>{alert.severity || 'INFO'}</span>
          <span className="text-white text-sm font-semibold truncate">{alert.title || alert.message}</span>
        </div>
        <div className="text-slate-500 text-xs">{alert.location || alert.area || 'Sri Lanka'}</div>
        {alert.message && alert.title && <div className="text-slate-400 text-xs mt-1 line-clamp-2">{alert.message}</div>}
      </div>
      <span className="text-slate-600 text-[10px] flex-shrink-0">
        {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
      </span>
    </motion.div>
  );
}

// ── News Card ──────────────────────────────────────────────────────────────────
function NewsCard({ article }) {
  const CAT_COLORS = {
    flood: '#06b6d4', earthquake: '#ef4444', cyclone: '#6366f1',
    wildfire: '#f97316', tsunami: '#3b82f6', drought: '#eab308',
    landslide: '#a855f7', storm: '#22c55e',
  };
  const color = CAT_COLORS[article.climateCategory] || '#06b6d4';
  return (
    <a href={article.link} target="_blank" rel="noreferrer"
      className="flex gap-3 p-3 rounded-xl border border-white/6 hover:bg-white/3 transition-colors group">
      {article.imageUrl && (
        <img src={article.imageUrl} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{article.climateCategory}</span>
        <div className="text-white text-xs font-semibold leading-tight line-clamp-2 mt-0.5 group-hover:text-cyan-400 transition-colors">
          {article.title}
        </div>
        <div className="text-slate-600 text-[10px] mt-1">{article.sourceName}</div>
      </div>
    </a>
  );
}

// ── Checklist Item ─────────────────────────────────────────────────────────────
function ChecklistWidget({ checklist, onToggle }) {
  const total = checklist.items?.length || 0;
  const checked = checklist.items?.filter(i => i.isChecked)?.length || 0;
  const pct = total ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-white font-bold text-sm">{checklist.title}</h4>
          <p className="text-slate-500 text-xs mt-0.5 capitalize">{checklist.disasterType} preparedness</p>
        </div>
        <div className="text-right">
          <span className="text-cyan-400 font-black text-lg">{pct}%</span>
          <p className="text-slate-600 text-[10px]">{checked}/{total} done</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/8 mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
        />
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {checklist.items?.slice(0, 8).map(item => (
          <button
            key={item._id}
            onClick={() => onToggle(checklist.checklistId, item._id)}
            className={`w-full flex items-center gap-3 text-left p-2 rounded-lg transition-colors ${
              item.isChecked ? 'opacity-60' : 'hover:bg-white/4'
            }`}
          >
            <span className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${
              item.isChecked ? 'bg-cyan-500 border-cyan-500' : 'border-white/20'
            }`}>
              {item.isChecked && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2 5 4 7 8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
            </span>
            <span className={`text-xs ${item.isChecked ? 'line-through text-slate-600' : 'text-slate-300'}`}>
              {item.itemName}
              {item.quantity > 1 && <span className="text-slate-600 ml-1">×{item.quantity}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Article Card ───────────────────────────────────────────────────────────────
function ArticleCard({ article }) {
  const CAT_COLORS = { flood: '#06b6d4', earthquake: '#ef4444', cyclone: '#6366f1', wildfire: '#f97316', general: '#22c55e' };
  const color = CAT_COLORS[article.category] || '#06b6d4';
  return (
    <Link to={`/learn/${article._id}`}
      className="block rounded-xl border border-white/6 bg-white/2 hover:bg-white/4 transition-colors p-4 group">
      <div className="flex items-start gap-3">
        {article.imageUrl && <img src={article.imageUrl} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0"/>}
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{article.category}</span>
          <h4 className="text-white text-sm font-semibold leading-tight line-clamp-2 mt-0.5 group-hover:text-cyan-400 transition-colors">{article.title}</h4>
          <p className="text-slate-600 text-[10px] mt-1">{article.author}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Report Form ────────────────────────────────────────────────────────────────
function ReportForm() {
  const [form, setForm] = useState({ title: '', description: '', type: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reports', form);
      setDone(true);
      setForm({ title: '', description: '', type: '', location: '' });
    } catch { /* show error */ }
    setSubmitting(false);
  };

  const field = 'w-full bg-[#050b18] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 outline-none focus:border-cyan-500/50 transition-colors';

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-6">
      <h3 className="text-white font-bold text-base mb-4">Submit Incident Report</h3>
      {done ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-white font-semibold">Report submitted!</p>
          <p className="text-slate-500 text-sm mt-1">Thank you for helping your community.</p>
          <button onClick={() => setDone(false)} className="mt-4 text-cyan-400 text-sm hover:text-cyan-300">Submit another</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input className={field} placeholder="Incident title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
          <select className={field + ' appearance-none'} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} required>
            <option value="">Select incident type</option>
            {['flood','earthquake','cyclone','landslide','wildfire','other'].map(t => <option key={t} value={t} className="bg-[#050b18] capitalize">{t}</option>)}
          </select>
          <input className={field} placeholder="Location / Area" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
          <textarea className={field + ' resize-none'} rows={4} placeholder="Describe what you observed..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required />
          <motion.button
            type="submit" disabled={submitting}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </motion.button>
        </form>
      )}
    </div>
  );
}

// ── Shelter Card ───────────────────────────────────────────────────────────────
function ShelterCard({ shelter }) {
  const pct = shelter.capacity ? Math.round(((shelter.currentOccupancy || 0) / shelter.capacity) * 100) : 0;
  const statusColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : '#22c55e';
  return (
    <div className="rounded-xl border border-white/6 bg-white/2 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-white font-semibold text-sm">{shelter.name}</h4>
          <p className="text-slate-500 text-xs mt-0.5">{shelter.district}, {shelter.province}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: `${statusColor}18`, color: statusColor }}>
          {pct >= 90 ? 'FULL' : pct >= 70 ? 'BUSY' : 'OPEN'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 mt-3">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: statusColor }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-slate-600 text-[10px]">{shelter.currentOccupancy || 0} / {shelter.capacity} occupants</span>
        <span className="text-[10px] font-bold" style={{ color: statusColor }}>{pct}%</span>
      </div>
    </div>
  );
}

// ── Weather Widget ─────────────────────────────────────────────────────────────
function WeatherWidget({ data }) {
  if (!data) return (
    <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-6 flex items-center justify-center h-40">
      <div className="animate-spin w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full" />
    </div>
  );
  return (
    <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-base">Current Weather</h3>
        <span className="text-slate-500 text-xs">{data.location?.name || 'Sri Lanka'}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-5xl font-black text-white">{Math.round(data.current?.temp_c || 0)}°</div>
        <div>
          <div className="text-cyan-400 font-semibold">{data.current?.condition?.text || 'Clear'}</div>
          <div className="text-slate-500 text-xs mt-1">Feels like {Math.round(data.current?.feelslike_c || 0)}°C</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/6">
        {[
          { l: 'Humidity', v: `${data.current?.humidity || 0}%` },
          { l: 'Wind', v: `${data.current?.wind_kph || 0} kph` },
          { l: 'UV Index', v: data.current?.uv || 0 },
        ].map(i => (
          <div key={i.l} className="text-center">
            <div className="text-white font-bold text-sm">{i.v}</div>
            <div className="text-slate-600 text-[10px]">{i.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [data, setData] = useState({ alerts: [], news: [], checklists: [], articles: [], shelters: [], weather: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [alerts, news, checklists, articles, shelters] = await Promise.allSettled([
          api.get('/alerts?limit=5'),
          api.get('/climate-news/latest'),
          api.get('/checklists'),
          api.get('/articles?limit=6'),
          api.get('/shelters?limit=6'),
        ]);
        setData({
          alerts: alerts.value?.data?.alerts || [],
          news: news.value?.data?.news || [],
          checklists: checklists.value?.data?.checklists || [],
          articles: articles.value?.data?.articles || [],
          shelters: shelters.value?.data?.shelters || [],
          weather: null,
        });
      } catch(e) { /* silent */ }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const toggleItem = async (checklistId, itemId) => {
    try {
      await api.patch(`/user-checklists/${checklistId}/items/${itemId}/toggle`);
      // Refresh checklists
      const res = await api.get('/checklists');
      setData(d => ({ ...d, checklists: res.data?.checklists || [] }));
    } catch(e) { /* silent */ }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-[#030712] flex">
      <Sidebar active={active} setActive={setActive} user={user} onLogout={handleLogout} />

      {/* Main content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.username} 👋
              </h1>
              <p className="text-slate-500 text-sm mt-1">Here's what's happening in your area today.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/4 border border-white/8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-slate-400 text-sm">All systems live</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

            {/* ── OVERVIEW ── */}
            {active === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Active Alerts" value={data.alerts.length || '0'} icon={Icon.Bell} accent="#ef4444" delay={0} />
                  <StatCard label="Nearby Shelters" value={data.shelters.length || '0'} icon={Icon.MapPin} accent="#06b6d4" delay={0.08} />
                  <StatCard label="Articles Read" value="0" icon={Icon.BookOpen} accent="#22c55e" delay={0.16} />
                  <StatCard label="Quiz Score" value="—" icon={Icon.Award} accent="#a855f7" sub="No attempts yet" delay={0.24} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Alerts */}
                  <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#080d1a] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold">Active Alerts</h3>
                      <button onClick={() => setActive('alerts')} className="text-cyan-400 text-xs hover:text-cyan-300">View all →</button>
                    </div>
                    {loading ? (
                      <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />)}</div>
                    ) : data.alerts.length > 0 ? (
                      <div className="space-y-3">{data.alerts.slice(0, 4).map((a, i) => <AlertCard key={i} alert={a} />)}</div>
                    ) : (
                      <div className="text-center py-8 text-slate-600">
                        <div className="text-3xl mb-2">✅</div>
                        <p className="text-sm">No active alerts in your area</p>
                      </div>
                    )}
                  </div>

                  {/* News */}
                  <div className="rounded-2xl border border-white/8 bg-[#080d1a] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold">Climate News</h3>
                      <button onClick={() => setActive('news')} className="text-cyan-400 text-xs hover:text-cyan-300">More →</button>
                    </div>
                    <div className="space-y-2">
                      {data.news.slice(0, 4).map((n, i) => <NewsCard key={i} article={n} />)}
                    </div>
                  </div>
                </div>

                {/* Quick checklist */}
                {data.checklists.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.checklists.slice(0, 2).map(cl => (
                      <ChecklistWidget key={cl._id} checklist={cl} onToggle={toggleItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ALERTS ── */}
            {active === 'alerts' && (
              <div className="space-y-4">
                <h2 className="text-white font-black text-xl">Active Alerts</h2>
                {data.alerts.length === 0 ? (
                  <div className="text-center py-20 text-slate-600">
                    <div className="text-5xl mb-4">🌤️</div>
                    <p className="text-lg font-semibold">No active alerts</p>
                    <p className="text-sm mt-1">Your area is clear of active warnings</p>
                  </div>
                ) : (
                  <div className="space-y-3">{data.alerts.map((a, i) => <AlertCard key={i} alert={a} />)}</div>
                )}
              </div>
            )}

            {/* ── SHELTERS ── */}
            {active === 'shelters' && (
              <div className="space-y-4">
                <h2 className="text-white font-black text-xl">Emergency Shelters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.shelters.map((s, i) => <ShelterCard key={i} shelter={s} />)}
                </div>
              </div>
            )}

            {/* ── WEATHER ── */}
            {active === 'weather' && (
              <div className="space-y-4 max-w-lg">
                <h2 className="text-white font-black text-xl">Weather</h2>
                <WeatherWidget data={data.weather} />
              </div>
            )}

            {/* ── CHECKLISTS ── */}
            {active === 'checklists' && (
              <div className="space-y-4">
                <h2 className="text-white font-black text-xl">Preparedness Checklists</h2>
                {data.checklists.length === 0 ? (
                  <div className="text-center py-20 text-slate-600"><p>No checklists available yet.</p></div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.checklists.map(cl => <ChecklistWidget key={cl._id} checklist={cl} onToggle={toggleItem} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── ARTICLES ── */}
            {active === 'articles' && (
              <div className="space-y-4">
                <h2 className="text-white font-black text-xl">Learn & Prepare</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.articles.map((a, i) => <ArticleCard key={i} article={a} />)}
                </div>
              </div>
            )}

            {/* ── NEWS ── */}
            {active === 'news' && (
              <div className="space-y-4">
                <h2 className="text-white font-black text-xl">Climate News</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.news.map((n, i) => <NewsCard key={i} article={n} />)}
                </div>
              </div>
            )}

            {/* ── REPORTS ── */}
            {active === 'reports' && (
              <div className="max-w-lg">
                <h2 className="text-white font-black text-xl mb-4">Report an Incident</h2>
                <ReportForm />
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}