import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const CATEGORIES = ['all', 'flood', 'drought', 'cyclone', 'landslide', 'wildfire', 'tsunami', 'earthquake', 'photochemical smog', 'general'];

const CAT_COLORS = {
  flood: { color: '#06b6d4', bg: '#06b6d418', border: '#06b6d430' },
  drought: { color: '#eab308', bg: '#eab30818', border: '#eab30830' },
  cyclone: { color: '#6366f1', bg: '#6366f118', border: '#6366f130' },
  landslide: { color: '#a855f7', bg: '#a855f718', border: '#a855f730' },
  wildfire: { color: '#f97316', bg: '#f9731618', border: '#f9731630' },
  tsunami: { color: '#3b82f6', bg: '#3b82f618', border: '#3b82f630' },
  earthquake: { color: '#ef4444', bg: '#ef444418', border: '#ef444430' },
  'photochemical smog': { color: '#84cc16', bg: '#84cc1618', border: '#84cc1630' },
  general: { color: '#22c55e', bg: '#22c55e18', border: '#22c55e30' },
};

function ArticleCard({ article, index }) {
  const cat = CAT_COLORS[article.category] || CAT_COLORS.general;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/articles/${article._id}`}
        className="group block rounded-2xl border border-white/8 bg-[#080d1a] overflow-hidden hover:border-white/15 transition-all duration-300 h-full"
      >
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: cat.bg }}>
              <span className="text-4xl">
                {{ flood: '🌊', drought: '☀️', cyclone: '🌀', landslide: '⛰️', wildfire: '🔥', tsunami: '🌊', earthquake: '🏚️', general: '📄' }[article.category] || '📄'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a]/80 to-transparent" />
          {/* Category tag */}
          <div className="absolute top-3 left-3">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
              style={{ color: cat.color, background: cat.bg, borderColor: cat.border }}
            >
              {article.category}
            </span>
          </div>
          {article.hasQuiz && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Quiz
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-white font-bold text-base leading-tight mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center justify-between mt-3">
            <span className="text-slate-600 text-xs">{article.author}</span>
            <span className="text-slate-600 text-xs">
              {new Date(article.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Bottom accent */}
        <div
          className="h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 mx-5 mb-4"
          style={{ background: `linear-gradient(90deg, ${cat.color}80, transparent)` }}
        />
      </Link>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#080d1a] overflow-hidden animate-pulse">
      <div className="h-44 bg-white/4" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-white/6 rounded-lg w-3/4" />
        <div className="h-4 bg-white/4 rounded-lg w-1/2" />
        <div className="flex justify-between mt-4">
          <div className="h-3 bg-white/4 rounded w-20" />
          <div className="h-3 bg-white/4 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: pagination.page, limit: 12 });
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);

    api.get(`/articles?${params}`)
      .then(res => {
        setArticles(res.data.articles || []);
        setPagination(p => ({ ...p, ...res.data.pagination }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, search, pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPagination(p => ({ ...p, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-[#030712] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <span className="inline-block px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-4">
            Knowledge Base
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            Learn & Prepare
          </h1>
          <p className="text-slate-400 text-base max-w-xl">
            Evidence-based guides on disaster preparedness, response, and recovery — curated for Sri Lanka.
          </p>
        </motion.div>

        {/* Search */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="flex gap-3 mb-8"
        >
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full bg-[#080d1a] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/20"
          >
            Search
          </motion.button>
        </motion.form>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`relative px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 ${
                category === cat ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {category === cat && (
                <motion.span
                  layoutId="art-cat-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{cat}</span>
            </button>
          ))}
        </motion.div>

        {/* Count */}
        {!loading && (
          <p className="text-slate-600 text-xs mb-6">
            {pagination.total} article{pagination.total !== 1 ? 's' : ''} found
            {search && ` for "${search}"`}
            {category !== 'all' && ` in ${category}`}
          </p>
        )}

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${category}-${search}-${pagination.page}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {loading
              ? [...Array(9)].map((_, i) => <SkeletonCard key={i} />)
              : articles.length > 0
                ? articles.map((a, i) => <ArticleCard key={a._id} article={a} index={i} />)
                : (
                  <div className="col-span-3 text-center py-20 text-slate-600">
                    <div className="text-5xl mb-4">📭</div>
                    <p className="text-lg font-semibold text-slate-500">No articles found</p>
                    <p className="text-sm mt-2">Try a different search term or category</p>
                  </div>
                )
            }
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {pagination.pages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-xl border border-white/8 text-slate-400 text-sm disabled:opacity-30 hover:bg-white/4 transition-colors"
            >
              ← Prev
            </button>
            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                    pagination.page === p
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                      : 'border border-white/8 text-slate-500 hover:text-white hover:bg-white/4'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 rounded-xl border border-white/8 text-slate-400 text-sm disabled:opacity-30 hover:bg-white/4 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}