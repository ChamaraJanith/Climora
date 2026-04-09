import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen, Newspaper, CheckSquare, Clock, Tag, ChevronDown,
  Search, Globe, Flag, Flame, Droplets, Wind, Zap, Mountain,
  Sun, TrendingUp, Target, RefreshCw, ArrowUpRight, BookMarked,
  Star, BarChart2, Layers, CheckCircle2, GraduationCap, Rss,
  AlertTriangle, Waves, CloudLightning, Thermometer
} from 'lucide-react';
import api from '../../services/api';

// ─── Hazard palette — semantically accurate real-world colors ─────────────────
const CAT_META = {
  flood:      { color: '#0284c7', light: '#e0f2fe', gradient: 'from-sky-500 to-blue-700',       icon: Droplets,       emoji: '🌊' },
  tsunami:    { color: '#1e40af', light: '#dbeafe', gradient: 'from-blue-600 to-indigo-800',     icon: Waves,          emoji: '🌊' },
  earthquake: { color: '#b91c1c', light: '#fee2e2', gradient: 'from-red-600 to-red-900',         icon: Zap,            emoji: '🏚️' },
  cyclone:    { color: '#374151', light: '#f3f4f6', gradient: 'from-gray-600 to-gray-800',       icon: Wind,           emoji: '🌀' },
  storm:      { color: '#4b5563', light: '#f9fafb', gradient: 'from-slate-500 to-slate-700',     icon: CloudLightning, emoji: '⛈️' },
  wildfire:   { color: '#c2410c', light: '#ffedd5', gradient: 'from-orange-600 to-red-700',      icon: Flame,          emoji: '🔥' },
  drought:    { color: '#b45309', light: '#fef3c7', gradient: 'from-amber-500 to-orange-700',    icon: Thermometer,    emoji: '☀️' },
  landslide:  { color: '#78350f', light: '#fef9c3', gradient: 'from-amber-800 to-stone-900',     icon: Mountain,       emoji: '⛰️' },
  general:    { color: '#475569', light: '#f1f5f9', gradient: 'from-slate-400 to-slate-600',     icon: Globe,          emoji: '📋' },
};

const getMeta = (type) => CAT_META[type] || CAT_META.general;

function timeAgo(date) {
  const h = Math.round((Date.now() - new Date(date)) / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={`rounded-2xl bg-gray-100 animate-pulse ${className}`} />;
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
function TabPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8 pb-8"
    >
      {children}
    </motion.div>
  );
}

// ─── Hero header banner ───────────────────────────────────────────────────────
function TabHero({ icon: Icon, title, subtitle, action, actionLabel, gradient, stats }) {
  return (
    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${gradient} p-6 shadow-lg`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Icon size={26} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-2xl tracking-tight leading-none">{title}</h2>
            <p className="text-white/70 text-sm mt-1.5">{subtitle}</p>
            {stats && (
              <div className="flex items-center gap-4 mt-3">
                {stats.map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="text-white font-black text-lg leading-none">{value}</span>
                    <span className="text-white/60 text-xs">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {action && (
          <button
            onClick={action}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-cyan-500/20 hover:bg-cyan-500/35 backdrop-blur-sm text-cyan-300 hover:text-white
              text-xs font-bold transition-all duration-200 border border-cyan-500/30 hover:border-cyan-400/60"
          >
            {actionLabel} <ArrowUpRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Stat strip ───────────────────────────────────────────────────────────────
function StatStrip({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, icon: Icon, color }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.35 }}
          className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
        >
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-6 translate-x-6 opacity-10"
            style={{ background: color }} />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${color}15`, color }}>
            <Icon size={16} />
          </div>
          <div className="text-2xl font-black text-gray-900 leading-none">{value}</div>
          <div className="text-gray-400 text-xs mt-1 font-medium">{label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Search + filter bar ──────────────────────────────────────────────────────
function FilterBar({ search, onSearch, placeholder, extra }) {
  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-800
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
            transition-all duration-200 shadow-sm"
        />
      </div>
      {extra}
    </div>
  );
}

// ─── Category pills ───────────────────────────────────────────────────────────
function CategoryPills({ categories, active, onChange, counts = {} }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map(cat => {
        const meta = getMeta(cat);
        const CatIcon = meta.icon;
        const isActive = active === cat;
        const count = cat === 'all'
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : (counts[cat] || 0);
        const isEmpty = cat !== 'all' && count === 0;
        return (
          <button
            key={cat}
            onClick={() => !isEmpty && onChange(cat)}
            disabled={isEmpty}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold capitalize
              transition-all duration-200 border select-none
              ${isActive ? 'text-white shadow-md scale-105' : ''}
              ${isEmpty ? 'opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' : ''}
              ${!isActive && !isEmpty ? 'text-gray-600 bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm hover:scale-105' : ''}`}
            style={isActive ? {
              background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
              borderColor: meta.color,
              boxShadow: `0 4px 12px ${meta.color}35`
            } : {}}
          >
            {cat !== 'all' && <CatIcon size={11} />}
            {cat === 'all' ? '✦ All' : cat}
            {!isEmpty && (
              <span className={`text-[9px] font-black px-1 py-0.5 rounded-full ml-0.5
                ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {cat === 'all' ? count : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyResult({ icon: Icon, title, sub }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-5 shadow-inner">
        <Icon size={32} className="text-gray-300" />
      </div>
      <p className="text-gray-700 font-bold text-base">{title}</p>
      <p className="text-gray-400 text-sm mt-1.5 max-w-xs">{sub}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECKLISTS TAB
// ══════════════════════════════════════════════════════════════════════════════
function ChecklistItemRow({ item, toggling, onToggle }) {
  const itemId = String(item._id);
  const isThis = toggling === itemId;
  const isDisabled = !!toggling;
  const isChecked = item.isChecked;

  return (
    <motion.button
      layout
      onClick={() => onToggle(itemId)}
      disabled={isDisabled}
      whileHover={!isDisabled ? { x: 2 } : {}}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 group/item
        ${isThis ? 'opacity-50 cursor-wait' : ''}
        ${!isDisabled ? (isChecked ? 'hover:bg-emerald-50/80' : 'hover:bg-blue-50/60') : 'cursor-not-allowed'}
      `}
    >
      {/* Custom checkbox */}
      <span className={`w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all duration-200
        ${isThis ? 'border-blue-400 bg-blue-50 animate-pulse' : ''}
        ${isChecked && !isThis ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200' : ''}
        ${!isChecked && !isThis ? 'border-gray-300 group-hover/item:border-blue-400 group-hover/item:bg-blue-50/50' : ''}
      `}>
        {isChecked && !isThis && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline points="1.5 5 3.8 7.5 8.5 2.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      {/* Label */}
      <span className={`text-sm flex-1 leading-snug transition-colors font-medium
        ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {item.itemName}
        {item.quantity > 1 && (
          <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-md
            ${isChecked ? 'text-gray-300 bg-gray-100' : 'text-blue-500 bg-blue-50'}`}>
            ×{item.quantity}
          </span>
        )}
      </span>

      {/* Category tag */}
      {item.category && item.category !== 'other' && (
        <span className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded-lg flex-shrink-0 font-black border
          ${isChecked
            ? 'text-gray-300 bg-gray-50 border-gray-100'
            : 'text-indigo-500 bg-indigo-50 border-indigo-100'}`}>
          {item.category}
        </span>
      )}
    </motion.button>
  );
}

function ChecklistCard({ checklistId, title, disasterType, index }) {
  const [progress, setProgress] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [loadErr, setLoadErr] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const meta = getMeta(disasterType);
  const CatIcon = meta.icon;

  const load = useCallback(async () => {
    setLoadErr(false);
    try {
      const res = await api.get(`/user-checklists/${checklistId}`);
      setProgress(res.data);
    } catch { setLoadErr(true); }
  }, [checklistId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (rawId) => {
    const itemId = String(rawId);
    if (toggling) return;
    setToggling(itemId);
    setProgress(prev => prev ? {
      ...prev,
      items: prev.items.map(item =>
        String(item._id) === itemId ? { ...item, isChecked: !item.isChecked } : item
      ),
    } : prev);
    try {
      await api.patch(`/user-checklists/${checklistId}/items/${itemId}/toggle`);
      await load();
    } catch { await load(); }
    setToggling(null);
  };

  const items = progress?.items || [];
  const total = progress?.progress?.total ?? items.length;
  const checked = progress?.progress?.checked ?? items.filter(i => i.isChecked).length;
  const pct = total > 0 ? (progress?.progress?.percentage ?? Math.round((checked / total) * 100)) : 0;
  const done = progress?.progress?.isComplete || false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-3xl border bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300
        ${done ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-gray-200'}`}
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${meta.gradient} px-6 py-5 relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute right-16 top-2 w-8 h-8 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Type badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">
              <CatIcon size={11} className="text-white" />
              <span className="text-white/90 text-[10px] font-black uppercase tracking-widest capitalize">{disasterType}</span>
            </div>
            <h4 className="text-white font-black text-lg leading-tight">{title}</h4>
            {done && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-white/25 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={11} className="text-white" />
                <span className="text-white text-[10px] font-black">All Complete!</span>
              </div>
            )}
          </div>

          {/* Circular progress */}
          <div className="flex-shrink-0 relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
              <motion.circle
                cx="28" cy="28" r="22" fill="none"
                stroke="white" strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - pct / 100) }}
                transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-black text-sm leading-none">{pct}%</span>
              <span className="text-white/60 text-[9px] mt-0.5">{checked}/{total}</span>
            </div>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
            className="h-full rounded-full bg-white/80"
          />
        </div>
      </div>

      {/* Items section */}
      <div className="bg-gray-50/50">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-100/80 transition-colors"
        >
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {expanded ? 'Hide items' : `Show ${total} items`}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={15} className="text-gray-400" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="items"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="px-2 pb-3 border-t border-gray-100">
                {!progress && !loadErr && (
                  <div className="space-y-2 p-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-10" style={{ animationDelay: `${i * 60}ms` }} />
                    ))}
                  </div>
                )}
                {loadErr && (
                  <div className="text-center py-6">
                    <AlertTriangle size={20} className="text-red-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-xs mb-2">Failed to load items</p>
                    <button onClick={load} className="inline-flex items-center gap-1 text-blue-500 text-xs hover:text-blue-600 font-bold">
                      <RefreshCw size={11} /> Retry
                    </button>
                  </div>
                )}
                {progress && items.length === 0 && (
                  <p className="text-gray-400 text-xs text-center py-6">No items in this checklist yet.</p>
                )}
                {progress && items.length > 0 && (
                  <div className="max-h-80 overflow-y-auto space-y-0.5 pt-1" style={{ scrollbarWidth: 'thin' }}>
                    {items.map(item => (
                      <ChecklistItemRow key={String(item._id)} item={item} toggling={toggling} onToggle={handleToggle} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function ChecklistsTab({ loading, checklistTemplates }) {
  const total = checklistTemplates.length;
  const categories = [...new Set(checklistTemplates.map(c => c.disasterType))].length;
  const totalItems = 0;

  return (
    <TabPage>
      <TabHero
        icon={CheckSquare}
        title="Preparedness Checklists"
        subtitle="Stay ready for any disaster — track your emergency kit progress"
        gradient="from-[#061f3f] via-[#0a2d5a] to-[#0e3d7a]"
        action={null}
        stats={!loading && total > 0 ? [
          { label: 'kits', value: total },
          { label: 'hazard types', value: categories },
        ] : []}
      />

      {!loading && total > 0 && (
        <StatStrip stats={[
          { label: 'Total Kits', value: total, icon: Layers, color: '#3b82f6' },
          { label: 'Hazard Types', value: categories, icon: Tag, color: '#8b5cf6' },
          { label: 'Active', value: total, icon: TrendingUp, color: '#f97316' },
        ]} />
      )}

      {loading ? (
        <div className={`grid gap-5 grid-cols-1 lg:grid-cols-2`}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : total === 0 ? (
        <EmptyResult icon={CheckSquare} title="No checklists available yet" sub="Check back soon for preparedness kits" />
      ) : (
        <div className={`grid gap-5 ${total === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {checklistTemplates.map((cl, i) => (
            <ChecklistCard key={cl._id} checklistId={cl._id} title={cl.title} disasterType={cl.disasterType} index={i} />
          ))}
        </div>
      )}
    </TabPage>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEARN TAB
// ══════════════════════════════════════════════════════════════════════════════
const ARTICLE_CATEGORIES = ['all', 'flood', 'tsunami', 'earthquake', 'cyclone', 'storm', 'wildfire', 'drought', 'landslide', 'general'];

function ArticleCard({ article, index }) {
  const meta = getMeta(article.category);
  const CatIcon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link
        to={`/articles/${article._id}`}
        className="group h-full flex flex-col rounded-3xl border border-gray-200 bg-white overflow-hidden
          hover:shadow-2xl hover:-translate-y-1 hover:border-gray-300 transition-all duration-300"
      >
        {/* Fixed-height image */}
        <div className="relative h-48 flex-shrink-0 overflow-hidden">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
              <CatIcon size={52} className="text-white/20" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white shadow-lg backdrop-blur-sm"
              style={{ background: `${meta.color}dd` }}
            >
              <CatIcon size={10} />
              {article.category}
            </span>
          </div>

          {/* Quiz badge */}
          {article.hasQuiz && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-full bg-yellow-400 text-yellow-900 shadow-lg">
                <Star size={9} fill="currentColor" /> Quiz
              </span>
            </div>
          )}

          {/* Title on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-black text-sm leading-snug line-clamp-2 drop-shadow-md
              group-hover:text-blue-200 transition-colors">
              {article.title}
            </h3>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: meta.light }}>
              <BookMarked size={11} style={{ color: meta.color }} />
            </div>
            <span className="text-gray-500 text-xs font-medium truncate">{article.author || 'Climora'}</span>
          </div>
          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-black
            group-hover:gap-2 transition-all duration-200"
            style={{ color: meta.color }}>
            Read <ArrowUpRight size={13} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function LearnTab({ loading, articles, navigate }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = articles.filter(a => {
    const matchCat = activeCategory === 'all' || a.category === activeCategory;
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const categoryCounts = ARTICLE_CATEGORIES.reduce((acc, c) => {
    if (c !== 'all') acc[c] = articles.filter(a => a.category === c).length;
    return acc;
  }, {});

  return (
    <TabPage>
      <TabHero
        icon={GraduationCap}
        title="Learn & Prepare"
        subtitle="Build your knowledge — be ready before disaster strikes"
        gradient="from-[#020f2b] via-[#061f3f] to-[#0c7a8a]"
        action={() => navigate('/articles')}
        actionLabel="All Articles"
        stats={!loading ? [
          { label: 'articles', value: articles.length },
          { label: 'categories', value: Object.values(categoryCounts).filter(v => v > 0).length },
        ] : []}
      />

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search articles by title..."
      />

      <CategoryPills
        categories={ARTICLE_CATEGORIES}
        active={activeCategory}
        onChange={setActiveCategory}
        counts={categoryCounts}
      />

      {!loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <BarChart2 size={13} />
          <span>{filtered.length} article{filtered.length !== 1 ? 's' : ''} found</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {loading ? (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-72" />)
        ) : filtered.length === 0 ? (
          <EmptyResult icon={BookOpen} title="No articles found" sub="Try a different category or search term" />
        ) : (
          filtered.map((a, i) => <ArticleCard key={a._id || i} article={a} index={i} />)
        )}
      </div>
    </TabPage>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIMATE NEWS TAB
// ══════════════════════════════════════════════════════════════════════════════
const NEWS_CATEGORIES = ['all', 'flood', 'tsunami', 'earthquake', 'cyclone', 'storm', 'wildfire', 'drought', 'landslide', 'general'];

// Large featured card
function NewsCardFeatured({ article, index }) {
  const meta = getMeta(article.climateCategory);
  const CatIcon = meta.icon;
  const ageStr = timeAgo(article.publishedAt);

  return (
    <motion.a
      href={article.link}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="group relative rounded-3xl overflow-hidden border border-gray-200 bg-white
        hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative h-52 flex-shrink-0 overflow-hidden">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
            <CatIcon size={56} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full text-white shadow-lg"
            style={{ background: `${meta.color}ee` }}
          >
            <CatIcon size={10} /> {article.climateCategory}
          </span>
          {article.isSriLanka && (
            <span className="text-[10px] font-black text-white bg-emerald-500 px-2.5 py-1.5 rounded-full shadow-lg">
              🇱🇰 Local
            </span>
          )}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-black text-sm leading-snug line-clamp-2 drop-shadow-md">
            {article.title}
          </h3>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 text-gray-400 text-xs min-w-0">
          <span className="flex items-center gap-1.5 truncate">
            <Globe size={11} className="flex-shrink-0" style={{ color: meta.color }} />
            <span className="truncate font-medium">{article.sourceName}</span>
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock size={10} />{ageStr}
          </span>
        </div>
        <span className="flex-shrink-0 flex items-center gap-1 text-xs font-black group-hover:gap-2 transition-all"
          style={{ color: meta.color }}>
          Read <ArrowUpRight size={12} />
        </span>
      </div>
    </motion.a>
  );
}

// Compact list row
function NewsCardRow({ article, index }) {
  const meta = getMeta(article.climateCategory);
  const CatIcon = meta.icon;
  const ageStr = timeAgo(article.publishedAt);

  return (
    <motion.a
      href={article.link}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white
        hover:shadow-lg hover:border-gray-300 hover:-translate-y-px transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
            <CatIcon size={20} className="text-white/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: meta.light, color: meta.color }}
          >
            <CatIcon size={8} /> {article.climateCategory}
          </span>
          {article.isSriLanka && (
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              🇱🇰
            </span>
          )}
        </div>
        <h3 className="text-gray-800 text-xs font-bold leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {article.title}
        </h3>
        <div className="flex items-center gap-3 mt-1.5 text-gray-400 text-[10px]">
          <span className="flex items-center gap-1 truncate">
            <Globe size={9} className="flex-shrink-0" />{article.sourceName}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock size={9} />{ageStr}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
        bg-gray-50 group-hover:bg-blue-50 transition-colors">
        <ArrowUpRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </motion.a>
  );
}

export function ClimateNewsTab({ loading, news, navigate }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showLocal, setShowLocal] = useState(false);

  const filtered = news.filter(n => {
    const matchCat = activeCategory === 'all' || n.climateCategory === activeCategory;
    const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase());
    const matchLocal = !showLocal || n.isSriLanka;
    return matchCat && matchSearch && matchLocal;
  });

  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const newsCategoryCounts = NEWS_CATEGORIES.reduce((acc, c) => {
    if (c !== 'all') acc[c] = news.filter(n => n.climateCategory === c).length;
    return acc;
  }, {});

  const localCount = news.filter(n => n.isSriLanka).length;

  return (
    <TabPage>
      <TabHero
        icon={Rss}
        title="Climate News"
        subtitle="Real-time updates from verified global and local sources"
        gradient="from-[#020f2b] via-[#041938] to-[#0a4a5a]"
        action={() => navigate('/climate-news')}
        actionLabel="Full News Page"
        stats={!loading ? [
          { label: 'articles', value: news.length },
          { label: 'Sri Lanka', value: localCount },
        ] : []}
      />

      {!loading && news.length > 0 && (
        <StatStrip stats={[
          { label: 'Total Articles', value: news.length, icon: Newspaper, color: '#0284c7' },
          { label: 'Sri Lanka', value: localCount, icon: Flag, color: '#059669' },
          { label: 'Categories', value: Object.values(newsCategoryCounts).filter(v => v > 0).length, icon: Tag, color: '#7c3aed' },
        ]} />
      )}

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search news..."
        extra={
          <button
            onClick={() => setShowLocal(v => !v)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-bold transition-all duration-200 shadow-sm
              ${showLocal
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            <Flag size={13} /> 🇱🇰 Local
          </button>
        }
      />

      <CategoryPills
        categories={NEWS_CATEGORIES}
        active={activeCategory}
        onChange={setActiveCategory}
        counts={newsCategoryCounts}
      />

      {loading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72" />)}
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyResult icon={Newspaper} title="No news found" sub="Try adjusting your filters or search term" />
      ) : (
        <div className="space-y-5">
          {/* Featured grid */}
          {featured.length > 0 && (
            <div className={`grid gap-4 items-stretch
              ${featured.length === 1 ? 'grid-cols-1 max-w-sm' : ''}
              ${featured.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : ''}
              ${featured.length >= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
              {featured.map((n, i) => <NewsCardFeatured key={i} article={n} index={i} />)}
            </div>
          )}

          {/* List rows */}
          {rest.length > 0 && (
            <div className="space-y-2.5">
              {rest.map((n, i) => <NewsCardRow key={i} article={n} index={i} />)}
            </div>
          )}

          {/* View all */}
          <Link
            to="/climate-news"
            className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200
              text-gray-400 text-xs font-bold hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/40
              transition-all duration-200"
          >
            View all climate news — all categories, Sri Lanka & world <ArrowUpRight size={13} />
          </Link>
        </div>
      )}
    </TabPage>
  );
}
