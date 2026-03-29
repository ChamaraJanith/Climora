import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

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
      className="fixed left-0 top-0 h-full w-60 bg-[#040912] border-r border-white/[0.06] z-40 flex flex-col"
    >
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="white" fillOpacity="0.95"/>
            <circle cx="8" cy="6" r="1.5" fill="white" fillOpacity="0.55"/>
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none">Climora</div>
          <div className="text-slate-600 text-[10px] mt-0.5">User Dashboard</div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group ${
              active === id
                ? 'bg-cyan-500/12 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <span className={active === id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400 transition-colors'}>
              <Icon />
            </span>
            {label}
            {id === 'news' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse flex-shrink-0" />}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.06] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Icons.User />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.username}</div>
            <div className="text-slate-600 text-[10px] truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-slate-600 hover:text-red-400 hover:bg-red-500/8 transition-all"
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
        <div key={i} className={`${h} rounded-xl bg-white/[0.04] animate-pulse`} style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

function EmptyState({ emoji, text }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="text-slate-600 text-sm">{text}</p>
    </div>
  );
}

function Panel({ title, action, actionLabel, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#080d1a] p-5">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-white font-bold text-sm">{title}</h3>}
          {action && <button onClick={action} className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors">{actionLabel}</button>}
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
      className="relative rounded-2xl border border-white/[0.07] bg-[#080d1a] p-5 overflow-hidden group hover:border-white/12 transition-colors"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}28` }}>
        <CardIcon />
      </div>
      <div className="text-2xl font-black text-white mb-0.5">{value}</div>
      <div className="text-slate-500 text-xs">{label}</div>
      {sub && <div className="text-slate-700 text-[10px] mt-0.5">{sub}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />
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
      className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 animate-pulse" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color }}>{alert.severity || 'INFO'}</span>
          <span className="text-white text-xs font-semibold truncate">{alert.title || alert.message}</span>
        </div>
        <div className="text-slate-600 text-[10px] mt-0.5">{alert.location || alert.area || 'Sri Lanka'}</div>
      </div>
      <span className="text-slate-700 text-[10px] flex-shrink-0">
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
      className="flex gap-3 p-3 rounded-xl border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
    >
      <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
        {article.imageUrl
          ? <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-base" style={{ background: `${color}18` }}>
              {DIS_EMOJI[article.climateCategory] || '🌍'}
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{article.climateCategory}</span>
          {article.isSriLanka && <span className="text-[9px]">🇱🇰</span>}
        </div>
        <div className="text-white text-xs font-medium leading-snug line-clamp-2 group-hover:text-cyan-400 transition-colors">{article.title}</div>
        <div className="text-slate-700 text-[10px] mt-0.5">{article.sourceName} · {ageStr}</div>
      </div>
      <span className="text-slate-700 self-center flex-shrink-0"><Icons.External /></span>
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
      className="rounded-xl border border-white/[0.06] bg-[#080d1a] p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-white text-sm font-semibold">{shelter.name}</div>
          <div className="text-slate-600 text-xs mt-0.5">{shelter.district}{shelter.province ? `, ${shelter.province}` : ''}</div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize" style={{ color, background: `${color}15`, borderColor: `${color}30` }}>
          {pct >= 90 ? 'Full' : pct >= 70 ? 'Busy' : 'Open'}
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] mb-2">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-700">
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
        className="flex gap-3 p-3.5 rounded-xl border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/12 transition-all group">
        {article.imageUrl
          ? <img src={article.imageUrl} alt="" className="w-14 h-11 rounded-lg object-cover flex-shrink-0" />
          : <div className="w-14 h-11 rounded-lg flex-shrink-0 flex items-center justify-center text-xl" style={{ background: `${color}15` }}>
              {DIS_EMOJI[article.category] || '📄'}
            </div>
        }
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest capitalize" style={{ color }}>{article.category}</span>
          <div className="text-white text-xs font-semibold leading-snug line-clamp-2 mt-0.5 group-hover:text-cyan-400 transition-colors">{article.title}</div>
          <div className="text-slate-700 text-[10px] mt-1">{article.author}</div>
        </div>
        {article.hasQuiz && <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-full self-start flex-shrink-0 mt-0.5">Quiz</span>}
      </Link>
    </motion.div>
  );
}

// ─── ChecklistWidget — THE FIX ─────────────────────────────────────────────────
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
    <div className={`rounded-2xl border bg-[#080d1a] overflow-hidden transition-colors duration-300 ${done ? 'border-cyan-500/30' : 'border-white/[0.07]'}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{DIS_EMOJI[disasterType] || '📋'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-white font-bold text-sm leading-tight truncate">{title}</h4>
                {done && (
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                    ✓ Complete
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5 capitalize">{disasterType} preparedness</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <span className={`text-xl font-black leading-none ${done ? 'text-cyan-400' : 'text-white'}`}>
              {pct}<span className="text-xs font-semibold text-slate-500">%</span>
            </span>
            <div className="text-slate-700 text-[10px] mt-0.5 whitespace-nowrap">{checked}/{total} done</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/[0.06]">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: done ? '#06b6d4' : 'linear-gradient(90deg,#06b6d4,#3b82f6)' }}
          />
        </div>
      </div>

      {/* Items list */}
      <div className="px-3 pb-4">
        {/* Loading skeleton */}
        {!progress && !loadErr && (
          <div className="space-y-1.5 px-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        )}

        {/* Error */}
        {loadErr && (
          <div className="text-center py-5">
            <p className="text-slate-600 text-xs mb-2">Failed to load checklist</p>
            <button onClick={load} className="text-cyan-500 text-xs hover:text-cyan-400 transition-colors">Retry →</button>
          </div>
        )}

        {/* Empty */}
        {progress && items.length === 0 && (
          <p className="text-slate-700 text-xs text-center py-4">No items in this checklist yet.</p>
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
                    ${!isDisabled  ? (isChecked ? 'hover:opacity-80' : 'hover:bg-white/[0.04]') : ''}
                  `}
                >
                  {/* Checkbox */}
                  <span className={`
                    w-[18px] h-[18px] rounded-[5px] flex-shrink-0 border-[1.5px]
                    flex items-center justify-center transition-all duration-200
                    ${isThis    ? 'border-cyan-500/40 bg-cyan-500/10 animate-pulse'              : ''}
                    ${isChecked && !isThis ? 'bg-cyan-500 border-cyan-500 shadow-sm shadow-cyan-500/25' : ''}
                    ${!isChecked && !isThis ? 'border-white/[0.22] hover:border-cyan-500/50'    : ''}
                  `}>
                    {isChecked && !isThis && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5 5 3.8 7.5 8.5 2.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>

                  {/* Name */}
                  <span className={`text-[13px] flex-1 transition-colors ${isChecked ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                    {item.itemName}
                    {item.quantity > 1 && (
                      <span className={`ml-1.5 text-[11px] ${isChecked ? 'text-slate-700' : 'text-slate-600'}`}>×{item.quantity}</span>
                    )}
                  </span>

                  {/* Category badge */}
                  {item.category && item.category !== 'other' && (
                    <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-md flex-shrink-0 transition-colors ${
                      isChecked ? 'text-slate-800' : 'text-slate-700 bg-white/[0.04]'
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
  const F = 'w-full bg-[#050b18] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 outline-none focus:border-cyan-500/40 transition-colors';

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await api.post('/reports', form); setDone(true); } catch { /* silent */ }
    setSubmitting(false);
  };

  if (done) return (
    <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h4 className="text-white font-bold mb-1">Report submitted!</h4>
      <p className="text-slate-500 text-sm mt-1">Thank you for helping your community stay safe.</p>
      <button onClick={() => { setDone(false); setForm({ title: '', description: '', type: '', location: '' }); }}
        className="mt-5 text-cyan-400 text-sm hover:text-cyan-300 transition-colors">Submit another →</button>
    </div>
  );

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/[0.07] bg-[#080d1a] p-5 space-y-3">
      <h3 className="text-white font-bold text-sm mb-1">Submit Incident Report</h3>
      <input  className={F} placeholder="Incident title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
      <select className={F + ' appearance-none'} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} required>
        <option value="">Select disaster type *</option>
        {['flood','earthquake','cyclone','landslide','wildfire','other'].map(t =>
          <option key={t} value={t} className="bg-[#050b18] capitalize">{t}</option>
        )}
      </select>
      <input  className={F} placeholder="Location / Area" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
      <textarea className={F + ' resize-none'} rows={4} placeholder="Describe what you observed *" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required />
      <motion.button type="submit" disabled={submitting}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/15 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit Report'}
      </motion.button>
    </form>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [active, setActive]   = useState('overview');
  const [data,   setData]     = useState({ alerts: [], news: [], checklistTemplates: [], articles: [], shelters: [] });
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-[#030712] flex">
      <Sidebar active={active} setActive={setActive} user={user} onLogout={handleLogout} />

      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-[#030712]/85 backdrop-blur-xl border-b border-white/[0.05] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-lg">{greeting()}, {user?.username} 👋</h1>
            <p className="text-slate-600 text-xs mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-400 text-xs font-medium">Live</span>
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
                        <h3 className="text-white font-bold text-sm">Preparedness Checklists</h3>
                        <button onClick={() => setActive('checklists')} className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors">View all →</button>
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
                  <h2 className="text-white font-black text-xl mb-5">Active Alerts</h2>
                  {loading ? <Skeleton count={6} h="h-16" /> : data.alerts.length === 0
                    ? <EmptyState emoji="✅" text="No active alerts right now. Stay prepared!" />
                    : <div className="space-y-2">{data.alerts.map((a, i) => <AlertCard key={i} alert={a} index={i} />)}</div>
                  }
                </div>
              )}

              {/* SHELTERS */}
              {active === 'shelters' && (
                <div>
                  <h2 className="text-white font-black text-xl mb-5">Emergency Shelters</h2>
                  {loading ? <Skeleton count={4} h="h-24" /> : data.shelters.length === 0
                    ? <EmptyState emoji="🏠" text="No shelter data available." />
                    : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.shelters.map((s, i) => <ShelterCard key={i} shelter={s} index={i} />)}
                      </div>
                  }
                </div>
              )}

              {/* WEATHER */}
              {active === 'weather' && (
                <div className="max-w-md">
                  <h2 className="text-white font-black text-xl mb-5">Weather</h2>
                  <div className="rounded-2xl border border-white/[0.07] bg-[#080d1a] p-8 text-center">
                    <div className="text-5xl mb-3">🌤️</div>
                    <p className="text-slate-400 text-sm">Connect to <code className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">/api/weather</code></p>
                  </div>
                </div>
              )}

              {/* CHECKLISTS */}
              {active === 'checklists' && (
                <div>
                  <h2 className="text-white font-black text-xl mb-5">Preparedness Checklists</h2>
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
                    <h2 className="text-white font-black text-xl">Learn & Prepare</h2>
                    <Link to="/articles" className="flex items-center gap-1.5 text-cyan-400 text-xs hover:text-cyan-300 transition-colors">Browse all <Icons.External /></Link>
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
                      <h2 className="text-white font-black text-xl">Climate News</h2>
                      <p className="text-slate-600 text-xs mt-1">Latest from verified sources</p>
                    </div>
                    {/* ← NEWS PAGE LINK — this is the fix for "news page ekata yanne komada" */}
                    <Link
                      to="/climate-news"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/25 text-cyan-400 text-xs font-semibold hover:from-cyan-500/25 hover:to-blue-500/25 transition-all flex-shrink-0"
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
                          className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/[0.08] text-slate-500 text-xs hover:text-cyan-400 hover:border-cyan-500/20 transition-all mt-2">
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
                  <h2 className="text-white font-black text-xl mb-2">Report an Incident</h2>
                  <p className="text-slate-500 text-sm mb-5">Help your community by reporting what you observe on the ground.</p>
                  <ReportForm />
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}