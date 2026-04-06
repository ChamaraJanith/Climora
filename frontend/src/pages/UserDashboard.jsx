import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ProfileLocationMap from '../components/ui/ProfileLocationMap';

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Overview:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Alerts:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Shelters:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Weather:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  Checklist: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="9 11 12 14 22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Learn:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  News:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 14h10M2 18h7M2 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Report:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Logout:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  User:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  External:  () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Profile:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  MapPin:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Edit:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Save:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
};

const NAV = [
  { id: 'overview',   label: 'Overview',     Icon: Icons.Overview  },
  { id: 'alerts',     label: 'Alerts',       Icon: Icons.Alerts    },
  { id: 'shelters',   label: 'Shelters',     Icon: Icons.Shelters  },
  { id: 'weather',    label: 'Weather',      Icon: Icons.Weather   },
  { id: 'checklists', label: 'Checklists',   Icon: Icons.Checklist },
  { id: 'learn',      label: 'Learn',        Icon: Icons.Learn     },
  { id: 'news',       label: 'Climate News', Icon: Icons.News      },
  { id: 'report',     label: 'Report',       Icon: Icons.Report    },
  { id: 'profile',    label: 'My Profile',   Icon: Icons.Profile   },
];

const CAT_COLORS = {
  flood:'#06b6d4', drought:'#eab308', cyclone:'#6366f1', landslide:'#a855f7',
  wildfire:'#f97316', tsunami:'#3b82f6', earthquake:'#ef4444',
  storm:'#22c55e', general:'#64748b',
};
const SEV_COLORS = { critical:'#ef4444', high:'#f97316', moderate:'#eab308', low:'#22c55e' };
const DIS_EMOJI  = { flood:'🌊', earthquake:'🏚️', cyclone:'🌀', wildfire:'🔥', tsunami:'🌊', drought:'☀️', landslide:'⛰️', general:'📋' };

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, user, onLogout }) {
  return (
    <motion.aside
      initial={{ x: -72, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 top-0 h-full w-60 z-40 flex flex-col select-none shadow-2xl shadow-black/20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(180deg, #061f3f 0%, #041938 50%, #020f2b 100%)
        `,
        backgroundSize: '40px 40px, 40px 40px, 100% 100%',
        backgroundColor: '#020f2b',
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
        <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="white" fillOpacity="0.95"/>
            <circle cx="8" cy="6" r="1.5" fill="white" fillOpacity="0.75"/>
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none">
            Climora <span className="text-cyan-400">User</span>
          </div>
          <div className="text-white/40 text-[10px] mt-0.5">Personal Dashboard</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
              active === id
                ? 'bg-white/15 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon />
            {label}
            {id === 'news' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
          </button>
        ))}
      </nav>

      {/* Bottom: user info + logout */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 mb-1">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Icons.User />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.username}</div>
            <div className="text-white/40 text-[10px] truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-150"
        >
          <Icons.Logout /> Sign Out
        </button>
      </div>
    </motion.aside>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Skeleton({ count = 4, h = 'h-12' }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${h} rounded-xl bg-gray-100 animate-pulse`} style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

function EmptyState({ emoji, text }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

function Panel({ title, action, actionLabel, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-gray-900 font-bold text-sm">{title}</h3>}
          {action && <button onClick={action} className="text-blue-500 text-xs hover:text-blue-600 transition-colors font-medium">{actionLabel}</button>}
        </div>
      )}
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon: CardIcon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl border border-gray-200 bg-white p-5 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}>
        <CardIcon />
      </div>
      <div className="text-2xl font-black text-gray-900 mb-0.5">{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
      {sub && <div className="text-gray-400 text-[10px] mt-0.5">{sub}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: accent }} />
    </motion.div>
  );
}

// ─── Alert Card ────────────────────────────────────────────────────────────────
function AlertCard({ alert, index }) {
  const color = SEV_COLORS[alert.severity?.toLowerCase()] || '#06b6d4';
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-sm transition-all duration-200"
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color }}>{alert.severity || 'INFO'}</span>
          <span className="text-gray-900 text-xs font-semibold truncate">{alert.title || alert.message}</span>
        </div>
        <div className="text-gray-400 text-[10px] mt-0.5">{alert.location || alert.area || 'Sri Lanka'}</div>
      </div>
      <span className="text-gray-400 text-[10px] flex-shrink-0">
        {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
      </span>
    </motion.div>
  );
}

// ─── News Card ─────────────────────────────────────────────────────────────────
function NewsCard({ article, index }) {
  const color = CAT_COLORS[article.climateCategory] || '#64748b';
  const age = Math.round((Date.now() - new Date(article.publishedAt)) / 3600000);
  const ageStr = age < 1 ? 'Just now' : age < 24 ? `${age}h ago` : `${Math.round(age / 24)}d ago`;
  return (
    <motion.a
      href={article.link} target="_blank" rel="noreferrer"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="flex gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:shadow-sm hover:border-gray-300 transition-all duration-200 group"
    >
      <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
        {article.imageUrl
          ? <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-base rounded-lg" style={{ background: `${color}15` }}>
              {DIS_EMOJI[article.climateCategory] || '🌍'}
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{article.climateCategory}</span>
          {article.isSriLanka && <span className="text-[9px]">🇱🇰</span>}
        </div>
        <div className="text-gray-800 text-xs font-medium leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">{article.title}</div>
        <div className="text-gray-400 text-[10px] mt-0.5">{article.sourceName} · {ageStr}</div>
      </div>
      <span className="text-gray-400 self-center flex-shrink-0"><Icons.External /></span>
    </motion.a>
  );
}

// ─── Shelter Card ──────────────────────────────────────────────────────────────
function ShelterCard({ shelter, index }) {
  const pct = shelter.capacity ? Math.round(((shelter.currentOccupancy || 0) / shelter.capacity) * 100) : 0;
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : '#22c55e';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-gray-900 text-sm font-semibold">{shelter.name}</div>
          <div className="text-gray-400 text-xs mt-0.5">{shelter.district}{shelter.province ? `, ${shelter.province}` : ''}</div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize" style={{ color, background: `${color}12`, borderColor: `${color}30` }}>
          {pct >= 90 ? 'Full' : pct >= 70 ? 'Busy' : 'Open'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 mb-2">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{shelter.currentOccupancy || 0} / {shelter.capacity}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
    </motion.div>
  );
}

// ─── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, index }) {
  const color = CAT_COLORS[article.category] || '#64748b';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
      <Link to={`/articles/${article._id}`}
        className="flex gap-3 p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group">
        {article.imageUrl
          ? <img src={article.imageUrl} alt="" className="w-14 h-11 rounded-lg object-cover flex-shrink-0" />
          : <div className="w-14 h-11 rounded-lg flex-shrink-0 flex items-center justify-center text-xl" style={{ background: `${color}12` }}>
              {DIS_EMOJI[article.category] || '📄'}
            </div>
        }
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest capitalize" style={{ color }}>{article.category}</span>
          <div className="text-gray-800 text-xs font-semibold leading-snug line-clamp-2 mt-0.5 group-hover:text-blue-600 transition-colors">{article.title}</div>
          <div className="text-gray-400 text-[10px] mt-1">{article.author}</div>
        </div>
        {article.hasQuiz && <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full self-start flex-shrink-0 mt-0.5">Quiz</span>}
      </Link>
    </motion.div>
  );
}

// ─── ChecklistWidget ───────────────────────────────────────────────────────────
//
// BUG ROOT CAUSE (backend userChecklistController.js):
//   checklist.items.some((i) => i._id === itemId)
//   → Mongoose returns i._id as ObjectId object, itemId is a String from req.params
//   → Strict equality `===` always false → item "not found" → toggle silently fails
//   → Only originally-saved items (which had matching string IDs at creation time) worked
//
// FRONTEND FIX: Always convert item._id to String before sending AND comparing.
// This ensures the URL param /items/:itemId is always a plain string.
// The backend's `.find((m) => m.itemId === itemId)` then works because markedItems
// are stored with string itemId values from when they were first created.
//
function ChecklistWidget({ checklistId, title, disasterType }) {
  const [progress, setProgress] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [loadErr, setLoadErr]   = useState(false);

  const load = useCallback(async () => {
    setLoadErr(false);
    try {
      const res = await api.get(`/user-checklists/${checklistId}`);
      setProgress(res.data);
    } catch {
      setLoadErr(true);
    }
  }, [checklistId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (rawId) => {
    // ── KEY FIX ──────────────────────────────────────────────────────
    // Force String conversion of MongoDB ObjectId before using in URL.
    // Without this, newly-added items (whose _id hasn't been stringified
    // by React state yet) fail the backend's strict === comparison.
    const itemId = String(rawId);
    // ─────────────────────────────────────────────────────────────────

    if (toggling) return; // block concurrent toggles
    setToggling(itemId);

    // Optimistic UI — flip locally using string comparison
    setProgress(prev => prev ? {
      ...prev,
      items: prev.items.map(item =>
        String(item._id) === itemId ? { ...item, isChecked: !item.isChecked } : item
      ),
    } : prev);

    try {
      await api.patch(`/user-checklists/${checklistId}/items/${itemId}/toggle`);
      await load(); // sync real server state (progress % etc.)
    } catch {
      await load(); // revert on any error
    }
    setToggling(null);
  };

  const items   = progress?.items   || [];
  const total   = progress?.progress?.total   ?? items.length;
  const checked = progress?.progress?.checked ?? items.filter(i => i.isChecked).length;
  const pct     = total > 0 ? (progress?.progress?.percentage ?? Math.round((checked / total) * 100)) : 0;
  const done    = progress?.progress?.isComplete || false;

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden transition-all duration-300 shadow-sm ${done ? 'border-blue-200' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{DIS_EMOJI[disasterType] || '📋'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-gray-900 font-bold text-sm leading-tight truncate">{title}</h4>
                {done && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
                    ✓ Complete
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-[11px] mt-0.5 capitalize">{disasterType} preparedness</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <span className={`text-xl font-black leading-none ${done ? 'text-blue-600' : 'text-gray-900'}`}>
              {pct}<span className="text-xs font-semibold text-gray-400">%</span>
            </span>
            <div className="text-gray-400 text-[10px] mt-0.5 whitespace-nowrap">{checked}/{total} done</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-gray-100">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: done ? '#22c55e' : 'linear-gradient(90deg,#3b82f6,#06b6d4)' }}
          />
        </div>
      </div>

      {/* Items list */}
      <div className="px-3 pb-4">
        {/* Loading skeleton */}
        {!progress && !loadErr && (
          <div className="space-y-1.5 px-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        )}

        {/* Error */}
        {loadErr && (
          <div className="text-center py-5">
            <p className="text-gray-400 text-xs mb-2">Failed to load checklist</p>
            <button onClick={load} className="text-blue-500 text-xs hover:text-blue-600 transition-colors font-medium">Retry →</button>
          </div>
        )}

        {/* Empty */}
        {progress && items.length === 0 && (
          <p className="text-gray-400 text-xs text-center py-4">No items in this checklist yet.</p>
        )}

        {/* Item buttons */}
        {progress && items.length > 0 && (
          <div className="space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
            {items.map((item) => {
              const itemId     = String(item._id); // ← FIX: always string
              const isThis     = toggling === itemId;
              const isChecked  = item.isChecked;
              const isDisabled = !!toggling;

              return (
                <button
                  key={itemId}
                  onClick={() => handleToggle(itemId)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left select-none
                    transition-all duration-150
                    ${isThis      ? 'opacity-50 cursor-wait'                       : ''}
                    ${isDisabled && !isThis ? 'cursor-not-allowed'                 : ''}
                    ${!isDisabled  ? (isChecked ? 'hover:opacity-80' : 'hover:bg-gray-50') : ''}
                  `}
                >
                  {/* Checkbox */}
                  <span className={`
                    w-[18px] h-[18px] rounded-[5px] flex-shrink-0 border-[1.5px]
                    flex items-center justify-center transition-all duration-200
                    ${isThis    ? 'border-blue-400 bg-blue-50 animate-pulse'                 : ''}
                    ${isChecked && !isThis ? 'bg-blue-500 border-blue-500 shadow-sm'         : ''}
                    ${!isChecked && !isThis ? 'border-gray-300 hover:border-blue-400'        : ''}
                  `}>
                    {isChecked && !isThis && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5 5 3.8 7.5 8.5 2.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>

                  {/* Name */}
                  <span className={`text-[13px] flex-1 transition-colors ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.itemName}
                    {item.quantity > 1 && (
                      <span className={`ml-1.5 text-[11px] ${isChecked ? 'text-gray-300' : 'text-gray-400'}`}>×{item.quantity}</span>
                    )}
                  </span>

                  {/* Category badge */}
                  {item.category && item.category !== 'other' && (
                    <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-md flex-shrink-0 transition-colors ${
                      isChecked ? 'text-gray-300 bg-gray-100' : 'text-gray-500 bg-gray-100'
                    }`}>
                      {item.category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Report Form ───────────────────────────────────────────────────────────────
function ReportForm() {
  const [form, setForm]         = useState({ title: '', description: '', type: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const F = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all duration-200';

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await api.post('/reports', form); setDone(true); } catch { /* silent */ }
    setSubmitting(false);
  };

  if (done) return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mx-auto mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h4 className="text-gray-900 font-bold mb-1">Report submitted!</h4>
      <p className="text-gray-500 text-sm mt-1">Thank you for helping your community stay safe.</p>
      <button onClick={() => { setDone(false); setForm({ title: '', description: '', type: '', location: '' }); }}
        className="mt-5 text-blue-500 text-sm hover:text-blue-600 transition-colors font-medium">Submit another →</button>
    </div>
  );

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
      <h3 className="text-gray-900 font-bold text-sm mb-1">Submit Incident Report</h3>
      <input  className={F} placeholder="Incident title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
      <select className={F + ' appearance-none'} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} required>
        <option value="">Select disaster type *</option>
        {['flood','earthquake','cyclone','landslide','wildfire','other'].map(t =>
          <option key={t} value={t} className="bg-white capitalize">{t}</option>
        )}
      </select>
      <input  className={F} placeholder="Location / Area" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
      <textarea className={F + ' resize-none'} rows={4} placeholder="Describe what you observed *" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required />
      <motion.button type="submit" disabled={submitting}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold shadow-sm transition-colors duration-200 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit Report'}
      </motion.button>
    </form>
  );
}

// ─── Profile Panel ────────────────────────────────────────────────────────────
function ProfilePanel({ user, onUserUpdate }) {
  const [editing, setEditing]       = useState(false);
  const [saving,  setSaving]        = useState(false);
  const [uploading, setUploading]  = useState(false);
  const [profile,  setProfile]     = useState(null);
  const [username, setUsername]    = useState("");
  const [location, setLocation]    = useState(null);
  const [usernameErr, setUsernameErr] = useState("");
  const [imgPreview, setImgPreview]   = useState(null);

  // Fetch fresh profile on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/profile");
        const u = res.data.user;
        setProfile(u);
        setUsername(u.username || "");
        setLocation(u.location?.lat ? u.location : null);
      } catch {
        /* fallback to context user */
      }
    })();
  }, []);

  const displayUser = profile || user;

  const roleColors = {
    ADMIN: "bg-red-100 text-red-700 border-red-200",
    SHELTER_MANAGER: "bg-orange-100 text-orange-700 border-orange-200",
    CONTENT_MANAGER: "bg-purple-100 text-purple-700 border-purple-200",
    USER: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const initials = (displayUser?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarSrc = imgPreview || displayUser?.profileImage || null;

  // ── Photo upload ────────────────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.put("/users/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = res.data.user;
      setProfile(updated);
      setImgPreview(null);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...updated }));
      onUserUpdate?.(updated);
    } catch (err) {
      setImgPreview(null);
      setUsernameErr(err?.response?.data?.message || "Photo upload failed.");
    }
    setUploading(false);
    if (e.target) e.target.value = "";
  };

  // ── Profile save ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!username.trim() || username.trim().length < 3) {
      setUsernameErr("Username must be at least 3 characters.");
      return;
    }
    setUsernameErr("");
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", {
        username: username.trim(),
        location: location || undefined,
      });
      const updated = res.data.user;
      setProfile(updated);
      setLocation(updated.location?.lat ? updated.location : null);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...updated }));
      onUserUpdate?.(updated);
      setEditing(false);
    } catch (err) {
      setUsernameErr(err?.response?.data?.message || "Failed to save. Please try again.");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setUsername(displayUser?.username || "");
    setLocation(displayUser?.location?.lat ? displayUser.location : null);
    setUsernameErr("");
    setEditing(false);
  };

  return (
    <div className="max-w-2xl space-y-5">
      {/* ── Page heading ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 font-bold text-xl">My Profile</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition-all duration-200"
          >
            <Icons.Edit /> Edit Profile
          </button>
        )}
      </div>

      {/* ── Main profile card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-cyan-500 relative">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="avatar-upload"
            onChange={handlePhotoChange}
          />

          {/* Avatar — overlaps bottom of banner */}
          <div className="absolute -bottom-8 left-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-blue-600 flex items-center justify-center">
                {uploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <svg className="animate-spin text-white" width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                ) : avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xl font-bold">{initials}</span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200"
              >
                <svg className="text-white" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </label>
            </div>
          </div>
        </div>

        {/* Content below banner */}
        <div className="pt-12 pb-6 px-6 space-y-5">
          {/* Name row */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-0.5">
              <h3 className="text-gray-900 font-bold text-xl leading-tight">{displayUser?.username}</h3>
              <p className="text-gray-500 text-sm font-medium flex items-center gap-2">
                <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {displayUser?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${roleColors[displayUser?.role] || roleColors.USER}`}>
                {displayUser?.role || "USER"}
              </span>
              <label
                htmlFor="avatar-upload"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-semibold hover:bg-gray-50 cursor-pointer transition-all duration-200"
              >
                <Icons.Edit /> Change Photo
              </label>
            </div>
          </div>

          {usernameErr && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {usernameErr}
            </motion.div>
          )}

          {/* ── View mode: location ── */}
          {!editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Location</h4>
                {location?.lat ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3 transition-all duration-200">
                    <div className="text-blue-500">
                      <Icons.MapPin />
                    </div>
                    <div>
                      <h5 className="text-gray-800 text-sm font-semibold">
                        {[location.city, location.district].filter(Boolean).join(", ")}
                      </h5>
                      <p className="text-gray-400 text-[11px] font-medium mt-0.5">
                        <span className="opacity-60 mr-1.5">COORDINATES:</span>
                        {location.lat.toFixed(5)}°, {location.lon.toFixed(5)}°
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-gray-200 rounded-xl flex items-center gap-2.5 bg-gray-50/30">
                    <span className="text-gray-300"><Icons.MapPin /></span>
                    <p className="text-gray-400 text-sm italic font-medium">No location set yet</p>
                    <button onClick={() => setEditing(true)} className="text-blue-500 text-xs font-bold hover:underline ml-auto">SET LOCATION →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Edit mode ── */}
          {editing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 px-0.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameErr("");
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest px-0.5">Location</label>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <ProfileLocationMap initialLocation={location} onChange={setLocation} />
                  </div>
                  <p className="text-gray-400 text-[10px] italic px-1">Click on the map or search to update your location coordinates.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-base font-black shadow-lg shadow-blue-200 transition-all duration-300 disabled:opacity-50"
                >
                  <Icons.Save />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [active, setActive]   = useState('overview');
  const [data,   setData]     = useState({ alerts: [], news: [], checklistTemplates: [], articles: [], shelters: [] });
  const [loading, setLoading] = useState(true);
  const [nearbyShelters, setNearbyShelters] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");
  const [userLocation, setUserLocation] = useState(user?.location?.lat ? user.location : null);

  // Called by ProfilePanel after a successful save — instantly refreshes the topbar name
  const [topbarName, setTopbarName] = useState(user?.username || '');

  const onUserUpdate = useCallback((updated) => {
    if (updated?.username) setTopbarName(updated.username);
    if (updated?.location?.lat && updated.location?.lon) {
      setUserLocation(updated.location);
    }
  }, []);

  useEffect(() => {
    if (user?.location?.lat && user?.location?.lon) {
      setUserLocation(user.location);
    }
  }, [user?.location?.lat, user?.location?.lon]);

  useEffect(() => {
    let cancelled = false;
    const fetchNearbyShelters = async () => {
      if (!userLocation?.lat || !userLocation?.lon) {
        setNearbyShelters([]);
        setNearbyError("");
        return;
      }

      setNearbyLoading(true);
      setNearbyError("");

      try {
        const res = await api.get(
          `/shelters/nearby?lat=${encodeURIComponent(userLocation.lat)}&lng=${encodeURIComponent(userLocation.lon)}&limit=5`
        );
        if (!cancelled) {
          setNearbyShelters(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setNearbyShelters([]);
          setNearbyError("Unable to load nearby shelters. Please check your location or try again later.");
        }
      } finally {
        if (!cancelled) {
          setNearbyLoading(false);
        }
      }
    };

    fetchNearbyShelters();
    return () => { cancelled = true; };
  }, [userLocation?.lat, userLocation?.lon]);

  // Keep topbarName in sync if user context changes (e.g. first load)
  useEffect(() => { if (user?.username) setTopbarName(user.username); }, [user]);

  useEffect(() => {
    (async () => {
      const [alerts, news, checklists, articles, shelters] = await Promise.allSettled([
        api.get('/alerts?limit=10'),
        api.get('/climate-news/latest'),
        api.get('/checklists'),
        api.get('/articles?limit=8'),
        api.get('/shelters?limit=8'),
      ]);
      setData({
        alerts:             alerts.value?.data?.alerts      || [],
        news:               news.value?.data?.news          || [],
        checklistTemplates: checklists.value?.data?.checklists || [],
        articles:           articles.value?.data?.articles  || [],
        shelters:           shelters.value?.data?.shelters  || [],
      });
      setLoading(false);
    })();
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar active={active} setActive={setActive} user={user} onLogout={handleLogout} />

      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-gray-900 font-black text-lg">{greeting()}, {topbarName} 👋</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-50 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 text-xs font-semibold">Live</span>
          </div>
        </div>

        {/* Page content */}
        <div className="px-8 py-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >

              {/* OVERVIEW */}
              {active === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard label="Active Alerts"     value={loading ? '—' : data.alerts.length}             icon={Icons.Alerts}    accent="#ef4444" delay={0}    />
                    <StatCard label="Nearby Shelters"   value={loading ? '—' : data.shelters.length}           icon={Icons.Shelters}  accent="#06b6d4" delay={0.07} />
                    <StatCard label="Checklists"        value={loading ? '—' : data.checklistTemplates.length} icon={Icons.Checklist} accent="#22c55e" delay={0.14} sub="preparedness kits" />
                    <StatCard label="Articles"          value={loading ? '—' : data.articles.length}           icon={Icons.Learn}     accent="#a855f7" delay={0.21} sub="learn & prepare" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
                    <Panel title="Active Alerts" action={() => setActive('alerts')} actionLabel="View all →">
                      {loading ? <Skeleton count={4} h="h-14" /> : data.alerts.length === 0
                        ? <EmptyState emoji="🌤️" text="No active alerts in your area." />
                        : <div className="space-y-2">{data.alerts.slice(0, 5).map((a, i) => <AlertCard key={i} alert={a} index={i} />)}</div>
                      }
                    </Panel>
                    <Panel title="Climate News" action={() => setActive('news')} actionLabel="More →">
                      {loading ? <Skeleton count={4} h="h-14" /> : (
                        <div className="space-y-1.5">
                          {data.news.slice(0, 5).map((n, i) => <NewsCard key={i} article={n} index={i} />)}
                        </div>
                      )}
                    </Panel>
                  </div>

                  {!loading && data.checklistTemplates.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-900 font-bold text-sm">Preparedness Checklists</h3>
                        <button onClick={() => setActive('checklists')} className="text-blue-500 text-xs hover:text-blue-600 transition-colors font-medium">View all →</button>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {data.checklistTemplates.slice(0, 2).map(cl => (
                          <ChecklistWidget key={cl._id} checklistId={cl._id} title={cl.title} disasterType={cl.disasterType} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ALERTS */}
              {active === 'alerts' && (
                <div className="max-w-3xl">
                  <h2 className="text-gray-900 font-black text-xl mb-5">Active Alerts</h2>
                  {loading ? <Skeleton count={6} h="h-16" /> : data.alerts.length === 0
                    ? <EmptyState emoji="✅" text="No active alerts right now. Stay prepared!" />
                    : <div className="space-y-2">{data.alerts.map((a, i) => <AlertCard key={i} alert={a} index={i} />)}</div>
                  }
                </div>
              )}

              {/* SHELTERS */}
              {active === 'shelters' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-gray-900 font-black text-xl mb-5">Emergency Shelters</h2>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm mb-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Nearest shelters</h3>
                          <p className="text-gray-500 text-xs mt-1">Based on your saved profile location.</p>
                        </div>
                        <span className="text-xs text-gray-500">{nearbyLoading ? 'Loading…' : `${nearbyShelters.length} shown`}</span>
                      </div>

                      {nearbyLoading ? (
                        <div className="rounded-xl border border-dashed border-blue-100 bg-blue-50 px-4 py-5 text-center text-sm text-blue-700">
                          Fetching nearby shelters…
                        </div>
                      ) : nearbyError ? (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
                          {nearbyError}
                        </div>
                      ) : !userLocation?.lat ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                          Set your profile location first to see nearby emergency shelters.
                        </div>
                      ) : nearbyShelters.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                          No nearby shelters were found for your profile location.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {nearbyShelters.map((shelter, i) => (
                            <div key={shelter.shelterId} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{shelter.name}</p>
                                  <p className="text-xs text-gray-500 mt-1">{shelter.district}</p>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                  <div>{shelter.distanceKm != null ? `${shelter.distanceKm.toFixed(1)} km` : 'Distance unknown'}</div>
                                  <div className="mt-1">{shelter.travelTimeMin != null ? `${shelter.travelTimeMin} min` : 'Travel time unknown'}</div>
                                </div>
                              </div>
                              <div className="text-[11px] text-gray-600">
                                Capacity: {shelter.capacityTotal ?? 'N/A'} · Occupied: {shelter.capacityCurrent ?? 'N/A'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {loading ? <Skeleton count={4} h="h-24" /> : data.shelters.length === 0
                      ? <EmptyState emoji="🏠" text="No shelter data available." />
                      : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {data.shelters.map((s, i) => <ShelterCard key={i} shelter={s} index={i} />)}
                        </div>
                    }
                  </div>
                </div>
              )}

              {/* WEATHER */}
              {active === 'weather' && (
                <div className="max-w-md">
                  <h2 className="text-gray-900 font-black text-xl mb-5">Weather</h2>
                  <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="text-5xl mb-3">🌤️</div>
                    <p className="text-gray-500 text-sm">Connect to <code className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">/api/weather</code></p>
                  </div>
                </div>
              )}

              {/* CHECKLISTS */}
              {active === 'checklists' && (
                <div>
                  <h2 className="text-gray-900 font-black text-xl mb-5">Preparedness Checklists</h2>
                  {loading ? <Skeleton count={2} h="h-48" /> : data.checklistTemplates.length === 0
                    ? <EmptyState emoji="📋" text="No checklists available yet." />
                    : <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {data.checklistTemplates.map(cl => (
                          <ChecklistWidget key={cl._id} checklistId={cl._id} title={cl.title} disasterType={cl.disasterType} />
                        ))}
                      </div>
                  }
                </div>
              )}

              {/* LEARN */}
              {active === 'learn' && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-gray-900 font-black text-xl">Learn & Prepare</h2>
                    <Link to="/articles" className="flex items-center gap-1.5 text-blue-500 text-xs hover:text-blue-600 transition-colors font-medium">Browse all <Icons.External /></Link>
                  </div>
                  {loading ? <Skeleton count={6} h="h-16" /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.articles.map((a, i) => <ArticleCard key={i} article={a} index={i} />)}
                    </div>
                  )}
                </div>
              )}

              {/* NEWS */}
              {active === 'news' && (
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-gray-900 font-black text-xl">Climate News</h2>
                      <p className="text-gray-400 text-xs mt-1">Latest from verified sources</p>
                    </div>
                    {/* ← NEWS PAGE LINK — fix for navigating to full news page */}
                    <Link
                      to="/climate-news"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-all duration-200 flex-shrink-0"
                    >
                      Full News Page <Icons.External />
                    </Link>
                  </div>
                  {loading ? <Skeleton count={6} h="h-20" /> : data.news.length === 0
                    ? <EmptyState emoji="📡" text="No climate news available right now." />
                    : (
                      <div className="space-y-2 max-w-3xl">
                        {data.news.map((n, i) => <NewsCard key={i} article={n} index={i} />)}
                        <Link to="/climate-news"
                          className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-gray-300 text-gray-400 text-xs hover:text-blue-500 hover:border-blue-300 transition-all duration-200 mt-2">
                          View all climate news — all categories, Sri Lanka & world →
                        </Link>
                      </div>
                    )
                  }
                </div>
              )}

              {/* REPORT */}
              {active === 'report' && (
                <div className="max-w-lg">
                  <h2 className="text-gray-900 font-black text-xl mb-2">Report an Incident</h2>
                  <p className="text-gray-500 text-sm mb-5">Help your community by reporting what you observe on the ground.</p>
                  <ReportForm />
                </div>
              )}

              {/* PROFILE */}
              {active === 'profile' && (
                <ProfilePanel user={user} onUserUpdate={onUserUpdate} />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}