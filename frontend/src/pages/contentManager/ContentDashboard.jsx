import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ── Icons ──────────────────────────────────────────────────────────────────────
const BookIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;
const QuizIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="9 11 12 14 22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const NewsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 14h10M2 18h7M2 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const TrashIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const EditIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;

const CATEGORIES = ['flood', 'drought', 'cyclone', 'landslide', 'wildfire', 'tsunami', 'earthquake', 'photochemical smog', 'general'];
const ITEM_CATS = ['food', 'water', 'medicine', 'clothing', 'tools', 'documents', 'other'];
const DISASTER_TYPES = ['flood', 'drought', 'cyclone', 'landslide', 'wildfire', 'tsunami', 'earthquake', 'general'];

const NAV = [
  { id: 'articles', label: 'Articles', icon: BookIcon, accent: '#3b82f6' },
  { id: 'quizzes', label: 'Quizzes', icon: QuizIcon, accent: '#eab308' },
  { id: 'checklists', label: 'Checklists', icon: CheckIcon, accent: '#22c55e' },
  { id: 'news', label: 'Climate News', icon: NewsIcon, accent: '#a855f7' },
];

// ── Shared ─────────────────────────────────────────────────────────────────────
const INPUT = 'w-full bg-[#050b18] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 outline-none focus:border-cyan-500/50 transition-colors';
const SELECT = INPUT + ' appearance-none';

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-[#080d1a] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold text-base">{title}</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl leading-none">×</button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-slate-400 text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 text-sm hover:bg-white/4 transition-colors">
          Cancel
        </button>
        <motion.button
          onClick={onConfirm} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-colors"
        >
          Delete
        </motion.button>
      </div>
    </Modal>
  );
}

function Badge({ children, color }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border capitalize"
      style={{ color, background: `${color}18`, borderColor: `${color}30` }}>
      {children}
    </span>
  );
}

// ── ARTICLES TAB ───────────────────────────────────────────────────────────────
function ArticlesTab() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', author: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/articles?limit=10&page=${page}`);
      setArticles(res.data.articles || []);
      setPagination(res.data.pagination || {});
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const openCreate = () => {
    setForm({ title: '', content: '', category: 'general', author: '', imageUrl: '' });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (a) => {
    setSelected(a);
    setForm({ title: a.title, content: a.content, category: a.category, author: a.author, imageUrl: a.imageUrl || '' });
    setModal('edit');
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'create') await api.post('/articles', form);
      else await api.put(`/articles/${selected._id}`, form);
      setModal(null);
      load();
    } catch(e) {}
    setSaving(false);
  };

  const deleteArticle = async () => {
    try {
      await api.delete(`/articles/${selected._id}`);
      setModal(null);
      load();
    } catch(e) {}
  };

  const CAT_COLORS_MAP = { flood:'#06b6d4', drought:'#eab308', cyclone:'#6366f1', landslide:'#a855f7', wildfire:'#f97316', tsunami:'#3b82f6', earthquake:'#ef4444', general:'#22c55e' };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-bold text-lg">Articles</h2>
          <p className="text-slate-500 text-xs mt-0.5">{pagination.total || 0} total articles</p>
        </div>
        <motion.button onClick={openCreate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20">
          <PlusIcon /> New Article
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {articles.map(a => (
            <div key={a._id} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/6 bg-[#080d1a] hover:border-white/12 transition-colors group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color={CAT_COLORS_MAP[a.category] || '#22c55e'}>{a.category}</Badge>
                  {a.quizId && <Badge color="#eab308">Quiz</Badge>}
                </div>
                <p className="text-white text-sm font-semibold truncate">{a.title}</p>
                <p className="text-slate-600 text-xs">{a.author} · {new Date(a.publishedDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(a)} className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><EditIcon /></button>
                <button onClick={() => { setSelected(a); setModal('delete'); }} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex gap-2 justify-center mt-5">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-white/8 text-slate-400 text-xs disabled:opacity-30 hover:bg-white/4">←</button>
          <span className="text-slate-500 text-xs self-center">Page {page} / {pagination.pages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages} className="px-3 py-1.5 rounded-lg border border-white/8 text-slate-400 text-xs disabled:opacity-30 hover:bg-white/4">→</button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Create Article' : 'Edit Article'}>
        <div className="space-y-3">
          <input className={INPUT} placeholder="Title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
          <input className={INPUT} placeholder="Author" value={form.author} onChange={e => setForm(f => ({...f, author: e.target.value}))} />
          <select className={SELECT} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
            {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#050b18] capitalize">{c}</option>)}
          </select>
          <input className={INPUT} placeholder="Image URL (optional)" value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))} />
          <textarea className={INPUT + ' resize-none'} rows={8} placeholder="Article content..." value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} />
          <motion.button onClick={save} disabled={saving || !form.title || !form.content || !form.author}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold disabled:opacity-50">
            {saving ? 'Saving...' : modal === 'create' ? 'Create Article' : 'Save Changes'}
          </motion.button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal open={modal === 'delete'} onClose={() => setModal(null)} onConfirm={deleteArticle}
        title="Delete Article"
        message={`Are you sure you want to delete "${selected?.title}"? This will also delete its linked quiz.`} />
    </div>
  );
}

// ── QUIZZES TAB ────────────────────────────────────────────────────────────────
function QuizzesTab() {
  const [quizzes, setQuizzes] = useState([]);
  const [articles, setArticles] = useState([]); // articles without quiz
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', articleId: '', passingScore: 60, questions: [] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        api.get('/quizzes?limit=20'),
        api.get('/articles?limit=50'),
      ]);
      setQuizzes(qRes.data.quizzes || []);
      // Filter articles without a quiz
      setArticles((aRes.data.articles || []).filter(a => !a.quizId));
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ title: '', articleId: '', passingScore: 60, questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }] });
    setModal('create');
  };

  const addQuestion = () => {
    setForm(f => ({ ...f, questions: [...f.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }] }));
  };

  const updateQuestion = (qi, field, value) => {
    const updated = [...form.questions];
    updated[qi] = { ...updated[qi], [field]: value };
    setForm(f => ({ ...f, questions: updated }));
  };

  const updateOption = (qi, oi, value) => {
    const updated = [...form.questions];
    updated[qi].options[oi] = value;
    setForm(f => ({ ...f, questions: updated }));
  };

  const removeQuestion = (qi) => {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== qi) }));
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'create') await api.post('/quizzes', form);
      else await api.put(`/quizzes/${selected._id}`, { title: form.title, passingScore: form.passingScore, questions: form.questions });
      setModal(null);
      load();
    } catch(e) {}
    setSaving(false);
  };

  const deleteQuiz = async () => {
    try {
      await api.delete(`/quizzes/${selected._id}`);
      setModal(null);
      load();
    } catch(e) {}
  };

  const openEdit = (q) => {
    setSelected(q);
    setForm({ title: q.title, articleId: q.articleId, passingScore: q.passingScore, questions: q.questions });
    setModal('edit');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-bold text-lg">Quizzes</h2>
          <p className="text-slate-500 text-xs mt-0.5">{quizzes.length} total quizzes</p>
        </div>
        <motion.button onClick={openCreate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-yellow-500/20">
          <PlusIcon /> New Quiz
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />)}</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <div className="text-4xl mb-3">🎯</div>
          <p>No quizzes yet. Create one linked to an article.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quizzes.map(q => (
            <div key={q._id} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/6 bg-[#080d1a] hover:border-white/12 transition-colors group">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{q.title}</p>
                <p className="text-slate-600 text-xs">
                  {q.questions?.length || 0} questions · Pass: {q.passingScore}%
                  {q.articleId && <span className="ml-2 text-blue-400">→ Article</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(q)} className="p-2 rounded-lg text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"><EditIcon /></button>
                <button onClick={() => { setSelected(q); setModal('delete'); }} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Create Quiz' : 'Edit Quiz'}>
        <div className="space-y-4">
          <input className={INPUT} placeholder="Quiz title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />

          {modal === 'create' && (
            <select className={SELECT} value={form.articleId} onChange={e => setForm(f => ({...f, articleId: e.target.value}))}>
              <option value="">Select article to link...</option>
              {articles.map(a => <option key={a._id} value={a._id} className="bg-[#050b18]">{a.title}</option>)}
            </select>
          )}

          <div className="flex items-center gap-3">
            <label className="text-slate-400 text-xs whitespace-nowrap">Pass Score %</label>
            <input type="number" min="0" max="100" className={INPUT} value={form.passingScore}
              onChange={e => setForm(f => ({...f, passingScore: Number(e.target.value)}))} />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{form.questions.length} Questions</span>
              <button onClick={addQuestion} className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1"><PlusIcon /> Add Q</button>
            </div>

            {form.questions.map((q, qi) => (
              <div key={qi} className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs font-bold">Q{qi + 1}</span>
                  {form.questions.length > 1 && (
                    <button onClick={() => removeQuestion(qi)} className="text-red-400/60 hover:text-red-400 text-xs transition-colors">Remove</button>
                  )}
                </div>
                <input className={INPUT} placeholder="Question text" value={q.question}
                  onChange={e => updateQuestion(qi, 'question', e.target.value)} />
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuestion(qi, 'correctAnswer', oi)}
                        className={`w-5 h-5 rounded-full border flex-shrink-0 transition-colors ${
                          q.correctAnswer === oi ? 'border-green-400 bg-green-400' : 'border-white/20 hover:border-white/40'
                        }`}
                      />
                      <input className={INPUT} placeholder={`Option ${String.fromCharCode(65+oi)}`} value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)} />
                    </div>
                  ))}
                </div>
                <p className="text-green-400/60 text-[10px]">● = correct answer</p>
              </div>
            ))}
          </div>

          <motion.button onClick={save} disabled={saving || !form.title || (modal === 'create' && !form.articleId)}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold disabled:opacity-50">
            {saving ? 'Saving...' : modal === 'create' ? 'Create Quiz' : 'Save Changes'}
          </motion.button>
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
  const [form, setForm] = useState({ title: '', disasterType: 'general' });
  const [itemForm, setItemForm] = useState({ itemName: '', category: 'other', quantity: 1, note: '' });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/checklists');
      setChecklists(res.data.checklists || []);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createChecklist = async () => {
    setSaving(true);
    try {
      await api.post('/checklists', form);
      setModal(null);
      load();
    } catch(e) {}
    setSaving(false);
  };

  const deleteChecklist = async () => {
    try {
      await api.delete(`/checklists/${selected._id}`);
      setModal(null);
      load();
    } catch(e) {}
  };

  const addItem = async (checklistId) => {
    setSaving(true);
    try {
      await api.post(`/checklists/${checklistId}/items`, itemForm);
      setItemForm({ itemName: '', category: 'other', quantity: 1, note: '' });
      load();
    } catch(e) {}
    setSaving(false);
  };

  const deleteItem = async (checklistId, itemId) => {
    try {
      await api.delete(`/checklists/${checklistId}/items/${itemId}`);
      load();
    } catch(e) {}
  };

  const CAT_COLORS_MAP = { flood:'#06b6d4',drought:'#eab308',cyclone:'#6366f1',landslide:'#a855f7',wildfire:'#f97316',tsunami:'#3b82f6',earthquake:'#ef4444',general:'#22c55e' };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-bold text-lg">Checklists</h2>
          <p className="text-slate-500 text-xs mt-0.5">{checklists.length} active checklists</p>
        </div>
        <motion.button onClick={() => { setForm({ title: '', disasterType: 'general' }); setModal('create'); }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow-lg shadow-green-500/20">
          <PlusIcon /> New Checklist
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/4 animate-pulse" />)}</div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-12 text-slate-600"><div className="text-4xl mb-3">📋</div><p>No checklists yet.</p></div>
      ) : (
        <div className="space-y-3">
          {checklists.map(cl => (
            <div key={cl._id} className="rounded-xl border border-white/6 bg-[#080d1a] overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/3 transition-colors"
                onClick={() => setExpanded(expanded === cl._id ? null : cl._id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge color={CAT_COLORS_MAP[cl.disasterType] || '#22c55e'}>{cl.disasterType}</Badge>
                    <span className="text-slate-600 text-[10px]">{cl.items?.length || 0} items</span>
                  </div>
                  <p className="text-white text-sm font-semibold">{cl.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); setSelected(cl); setModal('delete'); }}
                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><TrashIcon /></button>
                  <span className="text-slate-600 text-xs">{expanded === cl._id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Items */}
              <AnimatePresence>
                {expanded === cl._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-white/6"
                  >
                    <div className="p-4 space-y-2">
                      {cl.items?.map(item => (
                        <div key={item._id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-white/3">
                          <span className="text-slate-300 text-xs flex-1">{item.itemName} <span className="text-slate-600">×{item.quantity}</span></span>
                          <Badge color="#64748b">{item.category}</Badge>
                          <button onClick={() => deleteItem(cl._id, item._id)} className="text-slate-600 hover:text-red-400 transition-colors"><TrashIcon /></button>
                        </div>
                      ))}

                      {/* Add Item form */}
                      <div className="mt-3 pt-3 border-t border-white/6">
                        <p className="text-slate-500 text-xs font-semibold mb-2">Add Item</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input className={INPUT} placeholder="Item name" value={itemForm.itemName}
                            onChange={e => setItemForm(f => ({...f, itemName: e.target.value}))} />
                          <select className={SELECT} value={itemForm.category}
                            onChange={e => setItemForm(f => ({...f, category: e.target.value}))}>
                            {ITEM_CATS.map(c => <option key={c} value={c} className="bg-[#050b18] capitalize">{c}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input type="number" min="1" className={INPUT} placeholder="Qty" value={itemForm.quantity}
                            onChange={e => setItemForm(f => ({...f, quantity: Number(e.target.value)}))} />
                          <input className={INPUT} placeholder="Note (optional)" value={itemForm.note}
                            onChange={e => setItemForm(f => ({...f, note: e.target.value}))} />
                        </div>
                        <motion.button
                          onClick={() => addItem(cl._id)} disabled={!itemForm.itemName || saving}
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          className="w-full py-2 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold disabled:opacity-40">
                          + Add Item
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create Checklist">
        <div className="space-y-3">
          <input className={INPUT} placeholder="Checklist title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
          <select className={SELECT} value={form.disasterType} onChange={e => setForm(f => ({...f, disasterType: e.target.value}))}>
            {DISASTER_TYPES.map(d => <option key={d} value={d} className="bg-[#050b18] capitalize">{d}</option>)}
          </select>
          <motion.button onClick={createChecklist} disabled={saving || !form.title}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Checklist'}
          </motion.button>
        </div>
      </Modal>

      <ConfirmModal open={modal === 'delete'} onClose={() => setModal(null)} onConfirm={deleteChecklist}
        title="Delete Checklist" message={`Delete "${selected?.title}"? This action cannot be undone.`} />
    </div>
  );
}

// ── NEWS TAB ───────────────────────────────────────────────────────────────────
function NewsTab() {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get('/climate-news/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setResult(null);
    try {
      const res = await api.post('/climate-news/refresh');
      setResult({ type: 'success', msg: `✅ ${res.data.newArticlesSaved} new articles saved` });
      const statsRes = await api.get('/climate-news/stats');
      setStats(statsRes.data);
    } catch(e) {
      setResult({ type: 'error', msg: '❌ Refresh failed. Check API key.' });
    }
    setRefreshing(false);
  };

  const cleanup = async () => {
    setCleaning(true);
    setResult(null);
    try {
      const res = await api.delete('/climate-news/cleanup');
      setResult({ type: 'success', msg: `✅ Cleanup done: ${res.data.deletedIrrelevant} deleted, ${res.data.fixed} fixed, ${res.data.remaining} remaining` });
    } catch(e) {
      setResult({ type: 'error', msg: '❌ Cleanup failed.' });
    }
    setCleaning(false);
  };

  const CAT_COLORS_MAP = { flood:'#06b6d4',cyclone:'#6366f1',earthquake:'#ef4444',tsunami:'#3b82f6',wildfire:'#f97316',drought:'#eab308',landslide:'#a855f7',storm:'#22c55e' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-lg mb-1">Climate News</h2>
        <p className="text-slate-500 text-xs">Manage the news cache from NewsData.io API</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'Total Stories', v: stats.total, color: '#06b6d4' },
            { l: 'Sri Lanka', v: stats.sriLanka, color: '#f97316' },
            { l: 'World', v: stats.world, color: '#6366f1' },
          ].map(s => (
            <div key={s.l} className="rounded-xl border border-white/8 bg-[#080d1a] px-4 py-3">
              <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.v}</div>
              <div className="text-slate-600 text-xs">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Category breakdown */}
      {stats?.byCategory?.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-[#080d1a] p-4">
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">By Category</h4>
          <div className="space-y-2">
            {stats.byCategory.map(cat => {
              const max = Math.max(...stats.byCategory.map(c => c.count));
              const pct = Math.round((cat.count / max) * 100);
              const color = CAT_COLORS_MAP[cat.category] || '#64748b';
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-20 capitalize flex-shrink-0">{cat.category}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/6">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-slate-500 text-xs w-8 text-right">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Actions</h4>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <h4 className="text-cyan-400 font-semibold text-sm mb-1">Manual Refresh</h4>
          <p className="text-slate-500 text-xs mb-3">Fetch latest climate news from NewsData.io API. Auto-runs every 6 hours.</p>
          <motion.button onClick={refresh} disabled={refreshing}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold disabled:opacity-50">
            <span className={refreshing ? 'animate-spin' : ''}><RefreshIcon /></span>
            {refreshing ? 'Fetching news...' : 'Fetch Latest News'}
          </motion.button>
        </div>

        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <h4 className="text-orange-400 font-semibold text-sm mb-1">Database Cleanup</h4>
          <p className="text-slate-500 text-xs mb-3">Re-evaluate all cached articles with strict filters. Removes non-climate content and fixes incorrect flags.</p>
          <motion.button onClick={cleanup} disabled={cleaning}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold disabled:opacity-50">
            {cleaning ? 'Cleaning...' : '🧹 Run Cleanup'}
          </motion.button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl border text-sm font-medium ${
            result.type === 'success'
              ? 'border-green-500/30 bg-green-500/8 text-green-400'
              : 'border-red-500/30 bg-red-500/8 text-red-400'
          }`}
        >
          {result.msg}
        </motion.div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ContentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('articles');

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 top-0 h-full w-60 bg-[#050b18] border-r border-white/6 z-40 flex flex-col"
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-sm">Climora</div>
              <div className="text-slate-600 text-[10px]">Content Manager</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ id, label, icon: NavIcon, accent }) => (
            <button key={id} onClick={() => setActive(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                active === id ? 'bg-white/8 text-white border border-white/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
              }`}
              style={active === id ? { color: accent } : {}}
            >
              <NavIcon />
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/6">
          <div className="px-3 py-2 mb-1">
            <div className="text-white text-xs font-semibold">{user?.username}</div>
            <div className="text-slate-600 text-[10px]">Content Manager</div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/8 transition-all">
            <LogoutIcon /> Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-8 min-h-screen overflow-y-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-black text-white">Content Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage articles, quizzes, checklists and news</p>
        </motion.div>

        <div className="max-w-4xl">
          {/* Tab pills */}
          <div className="flex gap-2 mb-7 border-b border-white/6 pb-5">
            {NAV.map(({ id, label, icon: NavIcon, accent }) => (
              <button key={id} onClick={() => setActive(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active === id ? 'text-white border' : 'text-slate-500 hover:text-slate-300 hover:bg-white/4 border border-transparent'
                }`}
                style={active === id ? { background: `${accent}15`, borderColor: `${accent}30`, color: accent } : {}}
              >
                <NavIcon /> {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {active === 'articles' && <ArticlesTab />}
              {active === 'quizzes' && <QuizzesTab />}
              {active === 'checklists' && <ChecklistsTab />}
              {active === 'news' && <NewsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}