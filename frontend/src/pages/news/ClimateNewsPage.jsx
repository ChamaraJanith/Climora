import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const CATEGORIES = ['all', 'flood', 'cyclone', 'earthquake', 'tsunami', 'wildfire', 'drought', 'landslide', 'storm'];
const TYPES = [
  { value: 'all', label: 'All Regions' },
  { value: 'sri-lanka', label: '🇱🇰 Sri Lanka' },
  { value: 'world', label: '🌏 World' },
];

const CAT_META = {
  flood:     { color: '#06b6d4', emoji: '🌊', label: 'Flood' },
  cyclone:   { color: '#6366f1', emoji: '🌀', label: 'Cyclone' },
  earthquake:{ color: '#ef4444', emoji: '🏚️', label: 'Earthquake' },
  tsunami:   { color: '#3b82f6', emoji: '🌊', label: 'Tsunami' },
  wildfire:  { color: '#f97316', emoji: '🔥', label: 'Wildfire' },
  drought:   { color: '#eab308', emoji: '☀️', label: 'Drought' },
  landslide: { color: '#a855f7', emoji: '⛰️', label: 'Landslide' },
  storm:     { color: '#22c55e', emoji: '⛈️', label: 'Storm' },
  general:   { color: '#64748b', emoji: '🌍', label: 'General' },
};

function NewsCard({ article, index }) {
  const meta = CAT_META[article.climateCategory] || CAT_META.general;
  const age = Math.round((Date.now() - new Date(article.publishedAt)) / 3600000);
  const ageStr = age < 1 ? 'Just now' : age < 24 ? `${age}h ago` : `${Math.round(age/24)}d ago`;

  return (
    <motion.a
      href={article.link}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group flex gap-4 p-4 rounded-2xl border border-white/8 bg-[#080d1a] hover:bg-[#0c1225] hover:border-white/15 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-24 h-20 rounded-xl overflow-hidden">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: `${meta.color}15` }}>
            {meta.emoji}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border"
            style={{ color: meta.color, background: `${meta.color}15`, borderColor: `${meta.color}30` }}
          >
            {meta.label}
          </span>
          {article.isSriLanka && (
            <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
              🇱🇰 Sri Lanka
            </span>
          )}
        </div>

        <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2 group-hover:text-cyan-400 transition-colors mb-2">
          {article.title}
        </h3>

        {article.description && (
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-2">{article.description}</p>
        )}

        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span>{article.sourceName}</span>
          <span>·</span>
          <span>{ageStr}</span>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </motion.a>
  );
}

function FeaturedNewsCard({ article }) {
  const meta = CAT_META[article.climateCategory] || CAT_META.general;
  return (
    <a href={article.link} target="_blank" rel="noreferrer"
      className="group relative rounded-2xl border border-white/8 overflow-hidden block"
    >
      <div className="relative h-48 md:h-64">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: `${meta.color}15` }}>
            {meta.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
            style={{ color: meta.color, background: `${meta.color}25`, borderColor: `${meta.color}40` }}>
            {meta.emoji} {meta.label}
          </span>
          {article.isSriLanka && (
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              🇱🇰 Sri Lanka
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-cyan-400 transition-colors">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mt-2">{article.description}</p>
        )}
        <p className="text-slate-600 text-[10px] mt-2">{article.sourceName}</p>
      </div>
    </a>
  );
}

function StatsBar({ stats }) {
  if (!stats) return null;
  const total = stats.total || 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {[
        { l: 'Total Stories', v: total, color: '#06b6d4' },
        { l: 'Sri Lanka', v: stats.sriLanka || 0, color: '#f97316' },
        { l: 'World', v: stats.world || 0, color: '#6366f1' },
        { l: 'Categories', v: stats.byCategory?.length || 0, color: '#22c55e' },
      ].map(s => (
        <div key={s.l} className="rounded-xl border border-white/8 bg-[#080d1a] px-4 py-3">
          <div className="text-xl font-black" style={{ color: s.color }}>{s.v}</div>
          <div className="text-slate-600 text-xs mt-0.5">{s.l}</div>
        </div>
      ))}
    </div>
  );
}

export default function ClimateNewsPage() {
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchNews = async (cat, tp, pg, refresh = false) => {
    setLoading(true);
    const params = new URLSearchParams({ category: cat, type: tp, page: pg, limit: 12 });
    if (refresh) params.set('refresh', 'true');
    try {
      const [newsRes, statsRes] = await Promise.all([
        api.get(`/climate-news?${params}`),
        api.get('/climate-news/stats'),
      ]);
      setNews(newsRes.data.news || []);
      setPagination(newsRes.data.pagination || {});
      setStats(statsRes.data);
    } catch(e) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchNews(category, type, pagination.page); }, [category, type, pagination.page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews(category, type, 1, true);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const featured = news.slice(0, 2);
  const rest = news.slice(2);

  return (
    <div className="min-h-screen bg-[#030712] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-medium mb-4">
                Climate Intelligence
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Climate News</h1>
              <p className="text-slate-400 text-base max-w-xl">
                Verified climate and disaster news filtered from 500+ sources — Sri Lanka and global coverage.
              </p>
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-slate-400 text-xs hover:text-white hover:bg-white/4 transition-all disabled:opacity-50"
            >
              <svg className={refreshing ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Type filter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 mb-5">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => { setType(t.value); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                type === t.value
                  ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-400'
                  : 'border-white/8 text-slate-500 hover:text-slate-300 hover:bg-white/4'
              }`}
            >
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* Category filter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => {
            const m = CAT_META[cat] || {};
            return (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPagination(p => ({ ...p, page: 1 })); }}
                className={`relative px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 ${
                  category === cat ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {category === cat && (
                  <motion.span
                    layoutId="news-cat-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{cat === 'all' ? '🌍 All' : `${m.emoji || ''} ${cat}`}</span>
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={`${category}-${type}-${pagination.page}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-white/4 animate-pulse" />
                ))}
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-20 text-slate-600">
                <div className="text-5xl mb-4">📡</div>
                <p className="text-lg font-semibold text-slate-500">No news found</p>
                <p className="text-sm mt-2">Try a different filter or refresh</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Featured 2 */}
                {featured.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {featured.map((a, i) => <FeaturedNewsCard key={a._id || i} article={a} />)}
                  </div>
                )}

                {/* Rest as list */}
                {rest.length > 0 && (
                  <div className="space-y-3">
                    {rest.map((a, i) => <NewsCard key={a._id || i} article={a} index={i} />)}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {pagination.pages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-xl border border-white/8 text-slate-400 text-sm disabled:opacity-30 hover:bg-white/4"
            >
              ← Prev
            </button>
            <span className="text-slate-500 text-sm">Page {pagination.page} of {pagination.pages}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 rounded-xl border border-white/8 text-slate-400 text-sm disabled:opacity-30 hover:bg-white/4"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}