import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Trophy, ClipboardList, Newspaper,
  Plus, Trash2, Edit2, RefreshCw, Globe, LogOut, Bell,
  ChevronLeft, ChevronRight, AlertTriangle, X, CheckCircle2,
  XCircle, BarChart2, TrendingUp, FileText, Award,
  Package, ArrowUpRight, ArrowRight, Zap, Search,
  ChevronDown, ChevronUp, Users, Layers, ShieldAlert,
  Activity, Sparkles, Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES     = ['flood','drought','cyclone','landslide','wildfire','tsunami','earthquake','photochemical smog','general'];
const ITEM_CATS      = ['food','water','medicine','clothing','tools','documents','other'];
const DISASTER_TYPES = ['flood','drought','cyclone','landslide','wildfire','tsunami','earthquake','general'];

const CAT_COLORS = {
  flood:'#06b6d4', drought:'#eab308', cyclone:'#6366f1', landslide:'#a855f7',
  wildfire:'#f97316', tsunami:'#3b82f6', earthquake:'#ef4444',
  general:'#22c55e', storm:'#22c55e', 'photochemical smog':'#84cc16',
};

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',     icon: LayoutDashboard },
  { id: 'articles',   label: 'Articles',     icon: BookOpen        },
  { id: 'quizzes',    label: 'Quizzes',      icon: Trophy          },
  { id: 'checklists', label: 'Checklists',   icon: ClipboardList   },
  { id: 'news',       label: 'Climate News', icon: Newspaper       },
];

// ── Shared styles ──────────────────────────────────────────────────────────────
const INP     = 'w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/25 focus:border-[#06b6d4] transition-all placeholder-gray-400 shadow-sm';
const INP_OK  = INP + ' border-gray-200 hover:border-gray-300';
const INP_ERR = INP + ' border-red-400 focus:ring-red-400/25 focus:border-red-400 bg-red-50/30';
const SEL     = INP_OK + ' cursor-pointer appearance-none';
const LBL     = 'block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5';

// ── Validation helpers ─────────────────────────────────────────────────────────
const URL_RE = /^https?:\/\/.+/;

function validateArticle(f) {
  const e = {};
  if (!f.title.trim())                          e.title   = 'Title is required';
  else if (f.title.trim().length < 5)           e.title   = 'Title must be at least 5 characters';
  else if (f.title.trim().length > 200)         e.title   = 'Title cannot exceed 200 characters';
  if (!f.author.trim())                         e.author  = 'Author is required';
  if (!f.content.trim())                        e.content = 'Content is required';
  else if (f.content.trim().length < 50)        e.content = 'Content must be at least 50 characters';
  if (f.imageUrl && !URL_RE.test(f.imageUrl))   e.imageUrl = 'Must be a valid URL (http/https)';
  return e;
}

function validateQuiz(f, isCreate) {
  const e = {};
  if (!f.title.trim())                          e.title = 'Title is required';
  else if (f.title.trim().length < 5)           e.title = 'Title must be at least 5 characters';
  if (isCreate && !f.articleId)                 e.articleId = 'Please select an article to link';
  if (f.passingScore < 0 || f.passingScore > 100) e.passingScore = 'Must be between 0 and 100';
  const qErrs = f.questions.map(q => {
    const qe = {};
    if (!q.question.trim())                     qe.question = 'Question text is required';
    else if (q.question.trim().length < 10)     qe.question = 'Question must be at least 10 characters';
    const emptyOpts = q.options.filter(o => !o.trim());
    if (emptyOpts.length > 0)                   qe.options = 'All 4 options are required';
    return qe;
  });
  if (qErrs.some(qe => Object.keys(qe).length > 0)) e.questions = qErrs;
  return e;
}

function validateChecklist(f) {
  const e = {};
  if (!f.title.trim()) e.title = 'Title is required';
  return e;
}

function validateItem(f) {
  const e = {};
  if (!f.itemName.trim())    e.itemName = 'Item name is required';
  if (f.quantity < 1)        e.quantity = 'Quantity must be at least 1';
  return e;
}

// ── FieldError ─────────────────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 text-red-500 text-[11px] mt-1 font-medium">
      <ShieldAlert size={11} /> {msg}
    </motion.p>
  );
}

// ── SVG Pie Chart ──────────────────────────────────────────────────────────────
function PieChart({ data, size = 160 }) {
  const [hovered, setHovered] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;

  const r  = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;

  let cum = -Math.PI / 2;
  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cum);
    const y1 = cy + r * Math.sin(cum);
    cum += angle;
    const x2 = cx + r * Math.cos(cum);
    const y2 = cy + r * Math.sin(cum);
    return { ...d, x1, y1, x2, y2, large: angle > Math.PI ? 1 : 0 };
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {slices.map((s, i) => {
            const isHov = hovered === i;
            return (
              <path key={i}
                d={`M ${cx} ${cy} L ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2} Z`}
                fill={s.color} stroke="white" strokeWidth="2.5"
                style={{
                  transform: isHov ? `scale(1.07)` : 'scale(1)',
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: 'transform 0.18s ease, opacity 0.18s',
                  cursor: 'pointer',
                  opacity: hovered !== null && !isHov ? 0.55 : 1,
                  filter: isHov ? `drop-shadow(0 4px 8px ${s.color}60)` : 'none',
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r * 0.5} fill="white" />
          {hovered !== null ? (
            <>
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1e293b">
                {Math.round((slices[hovered].value / total) * 100)}%
              </text>
              <text x={cx} y={cy + 9} textAnchor="middle" fontSize="8.5" fill="#64748b" fontWeight="700">
                {slices[hovered].label.toUpperCase().slice(0, 10)}
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 5} textAnchor="middle" fontSize="19" fontWeight="800" fill="#1e293b">{total}</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="700">TOTAL</text>
            </>
          )}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex-1 space-y-1 min-w-0 cd-scroll" style={{ overflowY: 'auto', maxHeight: size }}>
        {slices.map((s, i) => (
          <div key={i}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all ${hovered === i ? 'bg-gray-100 scale-[1.02]' : 'hover:bg-gray-50'}`}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 text-xs capitalize flex-1 truncate font-medium">{s.label}</span>
            <span className="text-gray-800 text-xs font-bold">{s.value}</span>
            <span className="text-gray-400 text-[10px] w-7 text-right">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────────
function BarChart({ data, height = 120 }) {
  const [hovered, setHovered] = useState(null);
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barAreaHeight = height - 20; // reserve 20px for labels
  return (
    <div style={{ height }}>
      {/* Bar area */}
      <div className="flex items-end gap-2" style={{ height: barAreaHeight }}>
        {data.map((d, i) => {
          const barH = Math.max(Math.round((d.value / max) * barAreaHeight), 4);
          const isHov = hovered === i;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end"
              style={{ height: barAreaHeight }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {isHov && (
                <div className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 shadow-sm whitespace-nowrap mb-1">
                  {d.value}
                </div>
              )}
              <motion.div
                initial={{ height: 0 }} animate={{ height: barH }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                className="w-full rounded-t-lg transition-all duration-150"
                style={{
                  background: isHov ? d.color : `${d.color}bb`,
                  boxShadow: isHov ? `0 4px 12px ${d.color}50` : 'none',
                  cursor: 'pointer',
                }} />
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex gap-2 mt-1">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-[9px] text-gray-400 font-medium capitalize truncate text-center">
            {d.label.slice(0, 6)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="w-64 h-full flex flex-col select-none"
      style={{
        background: 'linear-gradient(180deg, #080f1e 0%, #0b1a30 50%, #060d1c 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.4)',
      }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 4px 16px rgba(6,182,212,0.45)' }}>
            <Sparkles size={16} className="text-white" />
            <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
          </div>
          <div>
            <div className="text-white font-black text-sm tracking-tight leading-none">Climora</div>
            <div className="text-[9px] font-bold tracking-[0.2em] mt-0.5" style={{ color: '#06b6d4' }}>CONTENT HUB</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mb-4" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 cd-scroll" style={{ overflowY: 'auto' }}>
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] px-3 mb-3" style={{ color: 'rgba(255,255,255,0.18)' }}>Navigation</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <motion.button key={id} onClick={() => setActive(id)} whileHover={{ x: 2 }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative overflow-hidden"
              style={{
                background: isActive ? 'rgba(6,182,212,0.13)' : 'transparent',
                color: isActive ? '#e0f7fa' : 'rgba(255,255,255,0.4)',
                border: isActive ? '1px solid rgba(6,182,212,0.22)' : '1px solid transparent',
              }}>
              {isActive && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.08), transparent)' }} />
              )}
              <Icon size={15} style={{ color: isActive ? '#06b6d4' : 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <span className="flex-1 text-left relative">{label}</span>
              {isActive && (
                <motion.div layoutId="nav-indicator"
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 relative"
                  style={{ background: '#06b6d4', boxShadow: '0 0 8px #06b6d4, 0 0 16px rgba(6,182,212,0.4)' }} />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-5 flex-shrink-0">
        <div className="mb-3" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 2px 8px rgba(6,182,212,0.35)' }}>
            {user?.username?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold truncate">{user?.username || 'Content Manager'}</p>
            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.28)' }}>Content Manager</p>
          </div>
        </div>
        <button onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}>
          <Globe size={13} /> Go to Website
        </button>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fca5a5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}>
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ── Topbar ─────────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <header className="h-16 flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.05)',
      }}>
      <div>
        <h1 className="text-[15px] font-black text-gray-900 leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
          style={{ background: 'rgba(248,250,252,0.8)', borderColor: 'rgba(0,0,0,0.08)' }}>
          <Calendar size={11} className="text-gray-400" />
          <span className="text-[11px] text-gray-500 font-semibold">{today}</span>
        </div>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#06b6d4] transition-colors relative"
          style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 2px 10px rgba(6,182,212,0.35)' }}>
          {user?.username?.[0]?.toUpperCase() || 'C'}
        </div>
      </div>
    </header>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50" style={{ overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y', background: 'rgba(8,15,30,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px', minHeight: '100%' }}
          onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className={`w-full ${maxWidth} rounded-2xl overflow-hidden`}
            style={{
              background: 'rgba(255,255,255,0.98)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
            }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(180deg, #fafbfc, #ffffff)' }}>
              <h3 className="text-gray-900 font-black text-[15px] tracking-tight">{title}</h3>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
                style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.09)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}>
                <X size={13} className="text-gray-500" />
              </button>
            </div>
            {/* Body */}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center mb-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fecaca' }}>
          <Trash2 size={22} className="text-red-500" />
        </motion.div>
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all"
          style={{ border: '1px solid rgba(0,0,0,0.1)' }}>Cancel</button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Delete</button>
      </div>
    </Modal>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────
function Badge({ children, color }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider capitalize"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'text-[#06b6d4]', bg = 'bg-blue-50', loading, trend, onClick, accent }) {
  if (loading) return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl bg-gray-100" />
        <div className="w-12 h-5 bg-gray-100 rounded-full" />
      </div>
      <div className="h-8 bg-gray-100 rounded-lg w-16 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-24" />
    </div>
  );
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-200 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}>
      {/* Top accent bar */}
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      )}
      {/* Subtle bg glow on hover */}
      {accent && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at top left, ${accent}08, transparent 60%)` }} />
      )}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${bg} ${color} shadow-sm`}>
          <Icon size={19} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-red-500 bg-red-50 border border-red-100'}`}>
            <TrendingUp size={10} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[28px] font-black text-gray-800 mb-0.5 tabular-nums leading-none">{value ?? 0}</p>
      <p className="text-xs text-gray-400 font-semibold mt-1.5">{label}</p>
      {onClick && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
          <ArrowUpRight size={14} className={color} />
        </div>
      )}
    </motion.div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
        <Icon size={24} className="text-gray-300" />
      </div>
      <p className="text-gray-700 font-bold text-sm mb-1.5">{title}</p>
      <p className="text-gray-400 text-xs mb-6 max-w-xs leading-relaxed">{description}</p>
      {action}
    </motion.div>
  );
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function OverviewTab({ setActive }) {
  const [data, setData] = useState({ articles:0, quizzes:0, checklists:0, news:0, checklistItems:0, newsCategories:[], articlesWithQuiz:0, articlesByCategory:[] });
  const [loading, setLoading] = useState(true);
  const [recentArticles, setRecentArticles] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, qRes, clRes, nRes] = await Promise.allSettled([
        api.get('/articles?limit=5&page=1'),
        api.get('/quizzes?limit=50'),
        api.get('/checklists'),
        api.get('/climate-news/stats'),
      ]);
      const a  = aRes.status  === 'fulfilled' ? aRes.value.data  : {};
      const q  = qRes.status  === 'fulfilled' ? qRes.value.data  : {};
      const cl = clRes.status === 'fulfilled' ? clRes.value.data : {};
      const n  = nRes.status  === 'fulfilled' ? nRes.value.data  : {};
      const clLists = cl.checklists || [];
      const arts    = a.articles    || [];

      // Build article category breakdown
      const catMap = {};
      arts.forEach(art => { catMap[art.category] = (catMap[art.category] || 0) + 1; });
      const articlesByCategory = Object.entries(catMap).map(([label, value]) => ({
        label, value, color: CAT_COLORS[label] || '#94a3b8',
      }));

      setData({
        articles:        a.pagination?.total ?? 0,
        quizzes:         (q.quizzes || []).length,
        checklists:      clLists.length,
        news:            n.total ?? 0,
        checklistItems:  clLists.reduce((s, c) => s + (c.items?.length || 0), 0),
        newsCategories:  n.byCategory || [],
        articlesWithQuiz: arts.filter(x => x.quizId).length,
        articlesByCategory,
      });
      setRecentArticles(arts);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const quickActions = [
    { label: 'New Article',   icon: BookOpen,      color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',   tab: 'articles'   },
    { label: 'New Quiz',      icon: Trophy,        color: '#eab308', bg: 'rgba(234,179,8,0.08)',    tab: 'quizzes'    },
    { label: 'New Checklist', icon: ClipboardList, color: '#22c55e', bg: 'rgba(34,197,94,0.08)',    tab: 'checklists' },
    { label: 'Manage News',   icon: Newspaper,     color: '#a855f7', bg: 'rgba(168,85,247,0.08)',   tab: 'news'       },
  ];

  const pieData = data.newsCategories
    .filter(c => c.count > 0)
    .map(c => ({ label: c.category, value: c.count, color: CAT_COLORS[c.category] || '#94a3b8' }));

  const statCards = [
    { icon: BookOpen,      label: 'Total Articles',  value: data.articles,   color: 'text-blue-500',   bg: 'bg-blue-50',   accent: '#3b82f6', tab: 'articles'   },
    { icon: Trophy,        label: 'Total Quizzes',   value: data.quizzes,    color: 'text-yellow-500', bg: 'bg-yellow-50', accent: '#eab308', tab: 'quizzes'    },
    { icon: ClipboardList, label: 'Checklists',      value: data.checklists, color: 'text-green-500',  bg: 'bg-green-50',  accent: '#22c55e', tab: 'checklists' },
    { icon: Newspaper,     label: 'News Stories',    value: data.news,       color: 'text-purple-500', bg: 'bg-purple-50', accent: '#a855f7', tab: 'news'       },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-7 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #060f22 0%, #0c2a52 50%, #1050a0 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent 65%)' }} />
          <div className="absolute right-40 -bottom-10 w-48 h-48 rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent 65%)' }} />
          <div className="absolute left-1/2 top-0 w-px h-full opacity-[0.04]"
            style={{ background: 'linear-gradient(180deg, transparent, #06b6d4, transparent)' }} />
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.035] pointer-events-none">
          <Activity size={180} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.22)', border: '1px solid rgba(6,182,212,0.3)' }}>
              <Zap size={11} className="text-cyan-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">Content Manager</span>
          </div>
          <h2 className="text-2xl font-black mb-2 tracking-tight">Welcome back</h2>
          <p className="text-sm max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Manage educational articles, quizzes, checklists and climate news from one place.
          </p>
          <div className="flex items-center gap-8 mt-6">
            {[
              { label: 'Articles', value: data.articles, color: '#38bdf8' },
              { label: 'Quizzes',  value: data.quizzes,  color: '#fbbf24' },
              { label: 'News',     value: data.news,     color: '#c084fc' },
            ].map((s, i) => (
              <div key={s.label} className="relative">
                {i > 0 && <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />}
                <p className="text-3xl font-black tabular-nums leading-none" style={{ color: loading ? 'rgba(255,255,255,0.15)' : s.color }}>
                  {loading ? '—' : s.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ tab, ...props }) => (
          <StatCard key={props.label} {...props} loading={loading} onClick={() => setActive(tab)} />
        ))}
      </div>

      {/* Middle row: Quick actions + Recent articles */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Quick Actions</h3>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Shortcuts</span>
          </div>
          <div className="space-y-2">
            {quickActions.map(({ label, icon: Icon, color, bg, tab }, i) => (
              <motion.button key={label} onClick={() => setActive(tab)}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                whileHover={{ x: 3 }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all group"
                style={{ background: bg, border: `1px solid ${color}20` }}>
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0"
                  style={{ color }}>
                  <Icon size={14} />
                </div>
                <span className="text-sm font-semibold flex-1 text-left" style={{ color }}>{label}</span>
                <ArrowRight size={13} style={{ color, opacity: 0 }} className="group-hover:opacity-100 transition" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent articles */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Recent Articles</h3>
            <button onClick={() => setActive('articles')}
              className="flex items-center gap-1 text-xs text-[#06b6d4] font-semibold hover:text-blue-600 transition">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}</div>
          ) : recentArticles.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen size={22} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No articles yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentArticles.map((a, i) => (
                <motion.div key={a._id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition group">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={12} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-xs font-semibold truncate">{a.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge color={CAT_COLORS[a.category] || '#22c55e'}>{a.category}</Badge>
                      {a.quizId && <Badge color="#eab308">Quiz</Badge>}
                    </div>
                  </div>
                  <span className="text-gray-400 text-[10px] flex-shrink-0">{new Date(a.publishedDate).toLocaleDateString()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Content health + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Content health */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Content Health</h3>
          <div className="space-y-3">
            {[
              { icon: Award,     color: '#3b82f6', bg: 'bg-blue-50',   label: 'Articles with quizzes',       value: `${data.articlesWithQuiz} / ${data.articles}`, pct: data.articles ? Math.round((data.articlesWithQuiz/data.articles)*100) : 0 },
              { icon: Package,   color: '#22c55e', bg: 'bg-green-50',  label: `Items across ${data.checklists} checklists`, value: `${data.checklistItems} items`, pct: null },
              { icon: BarChart2, color: '#a855f7', bg: 'bg-purple-50', label: 'News categories tracked',      value: `${data.newsCategories.length} categories`, pct: null },
            ].map(({ icon: Icon, color, bg, label, value, pct }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`p-3 rounded-xl ${bg} border border-gray-100`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0"
                    style={{ color }}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-[11px]">{label}</p>
                    <p className="text-gray-800 font-bold text-sm">{loading ? '—' : value}</p>
                  </div>
                </div>
                {pct !== null && !loading && (
                  <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full" style={{ background: color }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Article categories bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-1">Articles by Category</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution of recent articles</p>
          {loading ? (
            <div className="flex items-end gap-2 h-28">{[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gray-100 animate-pulse" style={{ height: `${30 + i * 15}%` }} />
            ))}</div>
          ) : data.articlesByCategory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BarChart2 size={22} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No data yet</p>
            </div>
          ) : (
            <BarChart data={data.articlesByCategory} height={120} />
          )}
        </div>

        {/* News pie chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-1">News by Category</h3>
          <p className="text-xs text-gray-400 mb-4">Climate news distribution</p>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-28 h-28 rounded-full bg-gray-100 animate-pulse" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Newspaper size={22} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No news data yet</p>
            </div>
          ) : (
            <PieChart data={pieData} size={140} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── ARTICLES TAB ───────────────────────────────────────────────────────────────
function ArticlesTab() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title:'', content:'', category:'general', author:'', imageUrl:'' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/articles?limit=12&page=${page}`);
      setArticles(res.data.articles || []);
      setPagination(res.data.pagination || {});
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const openCreate = () => { setForm({ title:'', content:'', category:'general', author:'', imageUrl:'' }); setErrors({}); setApiError(''); setSelected(null); setModal('create'); };
  const openEdit   = (a)  => { setSelected(a); setForm({ title:a.title, content:a.content, category:a.category, author:a.author, imageUrl:a.imageUrl||'' }); setErrors({}); setApiError(''); setModal('edit'); };

  const save = async () => {
    const e = validateArticle(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiError('');
    try {
      if (modal === 'create') await api.post('/articles', form);
      else await api.put(`/articles/${selected._id}`, form);
      setModal(null); load();
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const deleteArticle = async () => {
    try { await api.delete(`/articles/${selected._id}`); setModal(null); load(); } catch {}
  };

  const filtered = articles.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.author?.toLowerCase().includes(search.toLowerCase())
  );

  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: '' })); };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Total Articles" value={pagination.total} loading={loading} color="text-blue-500"   bg="bg-blue-50"   accent="#3b82f6" />
        <StatCard icon={Award}    label="With Quiz"      value={articles.filter(a => a.quizId).length} loading={loading} color="text-yellow-500" bg="bg-yellow-50" accent="#eab308" />
        <StatCard icon={Layers}   label="Total Pages"    value={pagination.pages || 1} loading={loading} color="text-cyan-500" bg="bg-cyan-50" accent="#06b6d4" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-black text-gray-900">All Articles</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{pagination.total || 0} articles total</p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* View toggle */}
            <div className="flex items-center rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              {[['grid', Layers], ['list', FileText]].map(([mode, Icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="w-8 h-8 flex items-center justify-center transition-all"
                  style={{ background: viewMode === mode ? 'white' : 'transparent', color: viewMode === mode ? '#3b82f6' : '#9ca3af', boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
                className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition w-48" />
            </div>
            <motion.button onClick={openCreate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', boxShadow: '0 3px 12px rgba(59,130,246,0.35)' }}>
              <Plus size={13} /> New Article
            </motion.button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: 220 }} />)}
            </div>
          ) : (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
          )
        ) : filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No articles found" description="Create your first article to get started."
            action={<motion.button onClick={openCreate} whileHover={{ scale: 1.03 }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition"><Plus size={13} /> Create Article</motion.button>} />
        ) : viewMode === 'grid' ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((a, i) => (
              <motion.div key={a._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-200 bg-white flex flex-col">
                {/* Thumbnail */}
                <div className="relative h-36 flex-shrink-0 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${CAT_COLORS[a.category] || '#06b6d4'}18, ${CAT_COLORS[a.category] || '#06b6d4'}06)` }}>
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText size={32} style={{ color: `${CAT_COLORS[a.category] || '#06b6d4'}50` }} />
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <Badge color={CAT_COLORS[a.category] || '#22c55e'}>{a.category}</Badge>
                    {a.quizId && <Badge color="#eab308">Quiz</Badge>}
                  </div>
                  <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(a)} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-lg hover:bg-blue-50 transition">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => { setSelected(a); setModal('delete'); }} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-lg hover:bg-red-50 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-3.5 flex-1 flex flex-col">
                  <p className="text-gray-900 text-sm font-bold leading-snug line-clamp-2 mb-2">{a.title}</p>
                  <div className="flex items-center gap-1.5 mt-auto pt-2.5 border-t border-gray-50">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                      {a.author?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-gray-500 text-[11px] font-medium truncate flex-1">{a.author}</span>
                    <span className="text-gray-400 text-[10px] flex-shrink-0">{new Date(a.publishedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((a, i) => (
              <motion.div key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition group">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100"
                  style={{ background: `linear-gradient(135deg, ${CAT_COLORS[a.category] || '#06b6d4'}18, ${CAT_COLORS[a.category] || '#06b6d4'}06)` }}>
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText size={16} style={{ color: CAT_COLORS[a.category] || '#06b6d4' }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-bold truncate">{a.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={CAT_COLORS[a.category] || '#22c55e'}>{a.category}</Badge>
                    {a.quizId && <Badge color="#eab308">Quiz</Badge>}
                    <span className="text-gray-400 text-[10px]">{a.author} · {new Date(a.publishedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(a)} className="w-8 h-8 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center text-gray-400 transition">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => { setSelected(a); setModal('delete'); }} className="w-8 h-8 rounded-xl bg-white border border-gray-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-gray-400 transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/40">
            <span className="text-xs text-gray-400 font-medium">Page {page} of {pagination.pages}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 transition">
                <ChevronLeft size={13} />
              </button>
              {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-8 h-8 rounded-xl border text-xs font-bold transition"
                    style={{ background: page === p ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'white', color: page === p ? 'white' : '#6b7280', borderColor: page === p ? 'transparent' : '#e5e7eb', boxShadow: page === p ? '0 2px 8px rgba(59,130,246,0.3)' : 'none' }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 transition">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Create New Article' : 'Edit Article'}>
        <div className="space-y-4">
          {apiError && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              <AlertTriangle size={14} className="flex-shrink-0" /> {apiError}
            </motion.div>
          )}
          {form.imageUrl && URL_RE.test(form.imageUrl) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl overflow-hidden border border-gray-200">
              <img src={form.imageUrl} alt="Preview" className="w-full h-36 object-cover" onError={e => e.target.style.display='none'} />
            </motion.div>
          )}
          <div>
            <label className={LBL}>Title <span className="text-red-400">*</span></label>
            <input className={errors.title ? INP_ERR : INP_OK} placeholder="Article title (min 5 chars)" value={form.title} onChange={e => setF('title', e.target.value)} />
            <FieldError msg={errors.title} />
            <p className="text-gray-400 text-[10px] mt-1 text-right">{form.title.length}/200</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Author <span className="text-red-400">*</span></label>
              <input className={errors.author ? INP_ERR : INP_OK} placeholder="Author name" value={form.author} onChange={e => setF('author', e.target.value)} />
              <FieldError msg={errors.author} />
            </div>
            <div>
              <label className={LBL}>Category</label>
              <select className={SEL} value={form.category} onChange={e => setF('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LBL}>Image URL <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
            <input className={errors.imageUrl ? INP_ERR : INP_OK} placeholder="https://..." value={form.imageUrl} onChange={e => setF('imageUrl', e.target.value)} />
            <FieldError msg={errors.imageUrl} />
          </div>
          <div>
            <label className={LBL}>Content <span className="text-red-400">*</span></label>
            <textarea className={(errors.content ? INP_ERR : INP_OK) + ' resize-none'} rows={7}
              placeholder="Write article content (min 50 characters)..." value={form.content} onChange={e => setF('content', e.target.value)} />
            <div className="flex items-center justify-between mt-1">
              <FieldError msg={errors.content} />
              <p className={`text-[10px] ml-auto ${form.content.length < 50 ? 'text-red-400' : 'text-gray-400'}`}>
                {form.content.length} chars {form.content.length < 50 ? `(need ${50 - form.content.length} more)` : '✓'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition">Cancel</button>
            <motion.button onClick={save} disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', boxShadow: '0 3px 12px rgba(59,130,246,0.3)' }}>
              {saving ? 'Saving...' : modal === 'create' ? 'Create Article' : 'Save Changes'}
            </motion.button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={modal === 'delete'} onClose={() => setModal(null)} onConfirm={deleteArticle}
        title="Delete Article" message={`Delete "${selected?.title}"? This will also remove its linked quiz.`} />
    </div>
  );
}

// ── QUIZZES TAB ────────────────────────────────────────────────────────────────
function QuizzesTab() {
  const [quizzes, setQuizzes] = useState([]);
  const [articles, setArticles] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title:'', articleId:'', passingScore:60, questions:[] });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([api.get('/quizzes?limit=20'), api.get('/articles?limit=50')]);
      setQuizzes(qRes.data.quizzes || []);
      setAllArticles(aRes.data.articles || []);
      setArticles((aRes.data.articles || []).filter(a => !a.quizId));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ title:'', articleId:'', passingScore:60, questions:[{ question:'', options:['','','',''], correctAnswer:0 }] }); setErrors({}); setApiError(''); setModal('create'); };
  const openEdit   = (q) => { setSelected(q); setForm({ title:q.title, articleId:q.articleId, passingScore:q.passingScore, questions:q.questions }); setErrors({}); setApiError(''); setModal('edit'); };

  const addQuestion    = () => setForm(f => ({ ...f, questions:[...f.questions, { question:'', options:['','','',''], correctAnswer:0 }] }));
  const removeQuestion = (qi) => setForm(f => ({ ...f, questions:f.questions.filter((_,i) => i !== qi) }));
  const updateQ        = (qi, field, val) => { const u=[...form.questions]; u[qi]={...u[qi],[field]:val}; setForm(f=>({...f,questions:u})); };
  const updateOpt      = (qi, oi, val)    => { const u=[...form.questions]; u[qi].options[oi]=val; setForm(f=>({...f,questions:u})); };

  const save = async () => {
    const e = validateQuiz(form, modal === 'create');
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiError('');
    try {
      if (modal === 'create') await api.post('/quizzes', form);
      else await api.put(`/quizzes/${selected._id}`, { title:form.title, passingScore:form.passingScore, questions:form.questions });
      setModal(null); load();
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const deleteQuiz = async () => {
    try { await api.delete(`/quizzes/${selected._id}`); setModal(null); load(); } catch {}
  };

  const avgQ = quizzes.length ? Math.round(quizzes.reduce((s,q) => s+(q.questions?.length||0),0)/quizzes.length) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Trophy}   label="Total Quizzes"     value={quizzes.length}  loading={loading} color="text-yellow-500" bg="bg-yellow-50" accent="#eab308" />
        <StatCard icon={BookOpen} label="Unlinked Articles" value={articles.length} loading={loading} color="text-blue-500"   bg="bg-blue-50"   accent="#3b82f6" />
        <StatCard icon={Users}    label="Avg. Questions"    value={avgQ}            loading={loading} color="text-green-500"  bg="bg-green-50"  accent="#22c55e" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-800">All Quizzes</h2>
            <p className="text-xs text-gray-400 mt-0.5">{quizzes.length} quizzes total</p>
          </div>
          <motion.button onClick={openCreate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition"
            style={{ background: 'linear-gradient(135deg, #eab308, #f97316)', boxShadow: '0 2px 10px rgba(234,179,8,0.3)' }}>
            <Plus size={13} /> New Quiz
          </motion.button>
        </div>

        {loading ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_,i) => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : quizzes.length === 0 ? (
          <EmptyState icon={Trophy} title="No quizzes yet" description="Create a quiz linked to an article."
            action={<motion.button onClick={openCreate} whileHover={{ scale: 1.03 }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500 text-white text-xs font-bold hover:bg-yellow-600 transition"><Plus size={13} /> Create Quiz</motion.button>} />
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((q, i) => {
              const qCount = q.questions?.length || 0;
              const passScore = q.passingScore || 0;
              const linkedArticle = q.articleId ? allArticles.find(a => a._id === q.articleId) : null;
              return (
                <motion.div key={q._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                  className="group relative rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-md hover:border-yellow-200 transition-all duration-200 overflow-hidden">
                  {/* Left accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: 'linear-gradient(180deg, #eab308, #f97316)' }} />
                  <div className="pl-3">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #fef9c3, #fef3c7)', border: '1px solid #fde68a' }}>
                          <Trophy size={15} className="text-yellow-500" />
                        </div>
                        <p className="text-gray-900 text-sm font-bold leading-snug line-clamp-2">{q.title}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openEdit(q)} className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 hover:border-yellow-300 hover:text-yellow-600 hover:bg-yellow-50 flex items-center justify-center text-gray-400 transition">
                          <Edit2 size={11} />
                        </button>
                        <button onClick={() => { setSelected(q); setModal('delete'); }} className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-gray-400 transition">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    {/* Stats row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100">
                        <Users size={11} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{qCount} Q</span>
                      </div>
                      {linkedArticle ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 min-w-0 max-w-[200px]">
                          <BookOpen size={11} className="text-blue-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-blue-600 truncate">{linkedArticle.title}</span>
                        </div>
                      ) : q.articleId ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100">
                          <BookOpen size={11} className="text-blue-400" />
                          <span className="text-xs font-bold text-blue-600">Linked</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
                          <BookOpen size={11} className="text-gray-300" />
                          <span className="text-xs font-medium text-gray-400">No article</span>
                        </div>
                      )}
                    </div>
                    {/* Pass score bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pass threshold</span>
                        <span className="text-[11px] font-black text-gray-700">{passScore}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${passScore}%` }} transition={{ duration: 0.7, delay: i * 0.05 }}
                          className="h-full rounded-full"
                          style={{ background: passScore >= 70 ? 'linear-gradient(90deg, #22c55e, #10b981)' : passScore >= 50 ? 'linear-gradient(90deg, #eab308, #f97316)' : 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Create New Quiz' : 'Edit Quiz'} maxWidth="max-w-xl">
        <div className="space-y-4">
          {apiError && (
            <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              <AlertTriangle size={14} className="flex-shrink-0" /> {apiError}
            </motion.div>
          )}
          <div>
            <label className={LBL}>Quiz Title <span className="text-red-400">*</span></label>
            <input className={errors.title ? INP_ERR : INP_OK} placeholder="Quiz title (min 5 chars)" value={form.title} onChange={e => { setForm(f=>({...f,title:e.target.value})); if(errors.title) setErrors(e=>({...e,title:''})); }} />
            <FieldError msg={errors.title} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {modal === 'create' && (
              <div>
                <label className={LBL}>Link to Article <span className="text-red-400">*</span></label>
                <select className={errors.articleId ? INP_ERR + ' cursor-pointer appearance-none' : SEL}
                  value={form.articleId} onChange={e => { setForm(f=>({...f,articleId:e.target.value})); if(errors.articleId) setErrors(e=>({...e,articleId:''})); }}>
                  <option value="">Select article...</option>
                  {articles.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}
                </select>
                <FieldError msg={errors.articleId} />
              </div>
            )}
            <div>
              <label className={LBL}>Passing Score (%)</label>
              <input type="number" min="0" max="100" className={errors.passingScore ? INP_ERR : INP_OK} value={form.passingScore}
                onChange={e => { setForm(f=>({...f,passingScore:Number(e.target.value)})); if(errors.passingScore) setErrors(e=>({...e,passingScore:''})); }} />
              <FieldError msg={errors.passingScore} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className={LBL + ' mb-0'}>{form.questions.length} Questions <span className="text-gray-400 normal-case font-normal">(max 20)</span></label>
              <button onClick={addQuestion} disabled={form.questions.length >= 20}
                className="flex items-center gap-1 text-xs text-[#06b6d4] hover:text-blue-600 font-semibold transition disabled:opacity-40">
                <Plus size={12} /> Add Question
              </button>
            </div>
            <div className="space-y-3">
              {form.questions.map((q, qi) => {
                const qErr = errors.questions?.[qi] || {};
                return (
                  <motion.div key={qi} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                    className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Question {qi+1}</span>
                      {form.questions.length > 1 && (
                        <button onClick={() => removeQuestion(qi)} className="text-xs text-red-400 hover:text-red-600 font-semibold transition">Remove</button>
                      )}
                    </div>
                    <div>
                      <input className={qErr.question ? INP_ERR : INP_OK} placeholder="Question text (min 10 chars)" value={q.question} onChange={e => updateQ(qi,'question',e.target.value)} />
                      <FieldError msg={qErr.question} />
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2.5">
                          <button onClick={() => updateQ(qi,'correctAnswer',oi)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${q.correctAnswer===oi ? 'border-green-500 bg-green-500 shadow-sm shadow-green-500/30' : 'border-gray-300 hover:border-green-400'}`} />
                          <input className={INP_OK} placeholder={`Option ${String.fromCharCode(65+oi)}`} value={opt} onChange={e => updateOpt(qi,oi,e.target.value)} />
                        </div>
                      ))}
                      <FieldError msg={qErr.options} />
                    </div>
                    <p className="text-green-600 text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> = correct answer
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
            <motion.button onClick={save} disabled={saving} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
              {saving ? 'Saving...' : modal === 'create' ? 'Create Quiz' : 'Save Changes'}
            </motion.button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={modal === 'delete'} onClose={() => setModal(null)} onConfirm={deleteQuiz}
        title="Delete Quiz" message={`Delete "${selected?.title}"? This will unlink it from its article.`} />
    </div>
  );
}

// ── CHECKLISTS TAB ─────────────────────────────────────────────────────────────
function ChecklistsTab() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title:'', disasterType:'general' });
  const [formErrors, setFormErrors] = useState({});
  const [itemForm, setItemForm] = useState({ itemName:'', category:'other', quantity:1, note:'' });
  const [itemErrors, setItemErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/checklists'); setChecklists(res.data.checklists || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createChecklist = async () => {
    const e = validateChecklist(form);
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setSaving(true);
    try { await api.post('/checklists', form); setModal(null); load(); } catch {}
    setSaving(false);
  };

  const deleteChecklist = async () => {
    try { await api.delete(`/checklists/${selected._id}`); setModal(null); load(); } catch {}
  };

  const addItem = async (checklistId) => {
    const e = validateItem(itemForm);
    if (Object.keys(e).length) { setItemErrors(e); return; }
    setSaving(true);
    try {
      await api.post(`/checklists/${checklistId}/items`, itemForm);
      setItemForm({ itemName:'', category:'other', quantity:1, note:'' });
      setItemErrors({});
      load();
    } catch {}
    setSaving(false);
  };

  const deleteItem = async (checklistId, itemId) => {
    try { await api.delete(`/checklists/${checklistId}/items/${itemId}`); load(); } catch {}
  };

  const totalItems = checklists.reduce((s,c) => s+(c.items?.length||0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="Total Checklists" value={checklists.length} loading={loading} color="text-green-500"  bg="bg-green-50"  accent="#22c55e" />
        <StatCard icon={Package}       label="Total Items"      value={totalItems}        loading={loading} color="text-cyan-500"   bg="bg-cyan-50"   accent="#06b6d4" />
        <StatCard icon={Layers}        label="Disaster Types"   value={new Set(checklists.map(c=>c.disasterType)).size} loading={loading} color="text-purple-500" bg="bg-purple-50" accent="#a855f7" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-800">All Checklists</h2>
            <p className="text-xs text-gray-400 mt-0.5">{checklists.length} checklists · {totalItems} items</p>
          </div>
          <motion.button onClick={() => { setForm({ title:'', disasterType:'general' }); setFormErrors({}); setModal('create'); }}
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition"
            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', boxShadow: '0 2px 10px rgba(34,197,94,0.3)' }}>
            <Plus size={13} /> New Checklist
          </motion.button>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : checklists.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No checklists yet" description="Create disaster preparedness checklists for users."
            action={<motion.button onClick={() => { setForm({ title:'', disasterType:'general' }); setModal('create'); }} whileHover={{ scale:1.03 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition"><Plus size={13} /> Create Checklist</motion.button>} />
        ) : (
          <div className="divide-y divide-gray-50">
            {checklists.map((cl, i) => (
              <motion.div key={cl._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}>
                <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50/70 transition group"
                  onClick={() => setExpanded(expanded === cl._id ? null : cl._id)}>
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={14} className="text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm font-semibold">{cl.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color={CAT_COLORS[cl.disasterType]||'#22c55e'}>{cl.disasterType}</Badge>
                      <span className="text-gray-400 text-[10px]">{cl.items?.length||0} items</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); setSelected(cl); setModal('delete'); }}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-gray-400 transition opacity-0 group-hover:opacity-100">
                      <Trash2 size={12} />
                    </button>
                    {expanded === cl._id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === cl._id && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                      transition={{ duration:0.2 }} className="overflow-hidden border-t border-gray-100">
                      <div className="px-5 py-4 bg-gray-50/50 space-y-2">
                        {cl.items?.length === 0 && <p className="text-gray-400 text-xs text-center py-2">No items yet.</p>}
                        {cl.items?.map(item => (
                          <div key={item._id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white border border-gray-100 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                            <span className="text-gray-700 text-xs font-medium flex-1">{item.itemName}</span>
                            <span className="text-gray-400 text-xs">×{item.quantity}</span>
                            <Badge color="#64748b">{item.category}</Badge>
                            {item.note && <span className="text-gray-400 text-[10px] italic truncate max-w-[70px]">{item.note}</span>}
                            <button onClick={() => deleteItem(cl._id, item._id)} className="text-gray-300 hover:text-red-500 transition ml-1 flex-shrink-0">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="mt-2 pt-3 border-t border-gray-200">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Add Item</p>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <input className={itemErrors.itemName ? INP_ERR : INP_OK} placeholder="Item name *" value={itemForm.itemName}
                                onChange={e => { setItemForm(f=>({...f,itemName:e.target.value})); if(itemErrors.itemName) setItemErrors(e=>({...e,itemName:''})); }} />
                              <FieldError msg={itemErrors.itemName} />
                            </div>
                            <select className={SEL} value={itemForm.category} onChange={e => setItemForm(f=>({...f,category:e.target.value}))}>
                              {ITEM_CATS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <input type="number" min="1" className={itemErrors.quantity ? INP_ERR : INP_OK} placeholder="Qty" value={itemForm.quantity}
                                onChange={e => { setItemForm(f=>({...f,quantity:Number(e.target.value)})); if(itemErrors.quantity) setItemErrors(e=>({...e,quantity:''})); }} />
                              <FieldError msg={itemErrors.quantity} />
                            </div>
                            <input className={INP_OK} placeholder="Note (optional)" value={itemForm.note} onChange={e => setItemForm(f=>({...f,note:e.target.value}))} />
                          </div>
                          <motion.button onClick={() => addItem(cl._id)} disabled={saving} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                            className="w-full py-2 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                            <Plus size={11} className="inline mr-1" /> Add Item
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create Checklist" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <label className={LBL}>Title <span className="text-red-400">*</span></label>
            <input className={formErrors.title ? INP_ERR : INP_OK} placeholder="e.g. Flood Emergency Kit" value={form.title}
              onChange={e => { setForm(f=>({...f,title:e.target.value})); if(formErrors.title) setFormErrors(e=>({...e,title:''})); }} />
            <FieldError msg={formErrors.title} />
          </div>
          <div>
            <label className={LBL}>Disaster Type</label>
            <select className={SEL} value={form.disasterType} onChange={e => setForm(f=>({...f,disasterType:e.target.value}))}>
              {DISASTER_TYPES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1 border-t border-gray-100">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
            <motion.button onClick={createChecklist} disabled={saving} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
              {saving ? 'Creating...' : 'Create'}
            </motion.button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={modal === 'delete'} onClose={() => setModal(null)} onConfirm={deleteChecklist}
        title="Delete Checklist" message={`Delete "${selected?.title}"? All items will be permanently removed.`} />
    </div>
  );
}

// ── NEWS TAB ───────────────────────────────────────────────────────────────────
function NewsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    try { const res = await api.get('/climate-news/stats'); setStats(res.data); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  const refresh = async () => {
    setRefreshing(true); setResult(null);
    try {
      const res = await api.post('/climate-news/refresh');
      setResult({ type:'success', msg:`${res.data.newArticlesSaved} new articles saved successfully.` });
      loadStats();
    } catch { setResult({ type:'error', msg:'Refresh failed. Please check the API key.' }); }
    setRefreshing(false);
  };

  const cleanup = async () => {
    setCleaning(true); setResult(null);
    try {
      const res = await api.delete('/climate-news/cleanup');
      setResult({ type:'success', msg:`Cleanup done: ${res.data.deletedIrrelevant} deleted, ${res.data.fixed} fixed, ${res.data.remaining} remaining.` });
    } catch { setResult({ type:'error', msg:'Cleanup failed.' }); }
    setCleaning(false);
  };

  const pieData = (stats?.byCategory||[]).filter(c=>c.count>0).map(c=>({ label:c.category, value:c.count, color:CAT_COLORS[c.category]||'#94a3b8' }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Newspaper}  label="Total Stories" value={stats?.total}    color="text-cyan-500"   bg="bg-cyan-50"   accent="#06b6d4" loading={loading} />
        <StatCard icon={Globe}      label="Sri Lanka"     value={stats?.sriLanka} color="text-orange-500" bg="bg-orange-50" accent="#f97316" loading={loading} />
        <StatCard icon={BarChart2}  label="World"         value={stats?.world}    color="text-purple-500" bg="bg-purple-50" accent="#a855f7" loading={loading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-1">Distribution by Category</h3>
          <p className="text-xs text-gray-400 mb-4">Breakdown of climate news topics</p>
          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="w-32 h-32 rounded-full bg-gray-100 animate-pulse" /></div>
          ) : pieData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Newspaper size={22} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No news data yet. Fetch news first.</p>
            </div>
          ) : (
            <PieChart data={pieData} size={160} />
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <RefreshCw size={16} className="text-cyan-500" />
              </div>
              <div>
                <h4 className="text-gray-800 font-bold text-sm">Manual Refresh</h4>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">Fetch latest climate news from NewsData.io. Auto-runs every 6 hours.</p>
              </div>
            </div>
            <motion.button onClick={refresh} disabled={refreshing} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-50 transition shadow-sm"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 2px 10px rgba(6,182,212,0.25)' }}>
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Fetching news...' : 'Fetch Latest News'}
            </motion.button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} className="text-orange-500" />
              </div>
              <div>
                <h4 className="text-gray-800 font-bold text-sm">Database Cleanup</h4>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">Re-evaluate cached articles with strict filters. Removes non-climate content.</p>
              </div>
            </div>
            <motion.button onClick={cleanup} disabled={cleaning} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-50 transition shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', boxShadow: '0 2px 10px rgba(249,115,22,0.25)' }}>
              <Zap size={13} />
              {cleaning ? 'Cleaning...' : 'Run Cleanup'}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${result.type==='success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {result.type==='success' ? <CheckCircle2 size={16} className="flex-shrink-0" /> : <XCircle size={16} className="flex-shrink-0" />}
            <span className="flex-1">{result.msg}</span>
            <button onClick={() => setResult(null)} className="opacity-50 hover:opacity-100 transition"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
const TAB_META = {
  overview:   { title: 'Overview',     subtitle: 'Content management at a glance' },
  articles:   { title: 'Articles',     subtitle: 'Create and manage educational articles' },
  quizzes:    { title: 'Quizzes',      subtitle: 'Build quizzes linked to articles' },
  checklists: { title: 'Checklists',   subtitle: 'Manage disaster preparedness checklists' },
  news:       { title: 'Climate News', subtitle: 'Monitor and manage the news cache' },
};

export default function ContentDashboard() {
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const body = document.body;
    const prevBg    = body.style.background;
    const prevColor = body.style.color;
    body.style.background = '#f1f5f9';
    body.style.color = '#1e293b';
    return () => {
      body.style.background = prevBg;
      body.style.color = prevColor;
    };
  }, []);

  const meta = TAB_META[active];

  return (
    <div className="dashboard-root" style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Fixed sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, width: 256, height: '100vh', zIndex: 40 }}>
        <Sidebar active={active} setActive={setActive} />
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Sticky topbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30 }}>
          <Topbar title={meta.title} subtitle={meta.subtitle} />
        </div>

        {/* Page body */}
        <main style={{ flex: 1, padding: '28px 28px 56px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ maxWidth: 1100 }}>
              {active === 'overview'   && <OverviewTab setActive={setActive} />}
              {active === 'articles'   && <ArticlesTab />}
              {active === 'quizzes'    && <QuizzesTab />}
              {active === 'checklists' && <ChecklistsTab />}
              {active === 'news'       && <NewsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
