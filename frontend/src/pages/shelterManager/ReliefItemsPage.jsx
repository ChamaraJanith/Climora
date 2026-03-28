import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Home, Package, Users, Bell, Activity, BarChart2,
  Globe, LogOut, Search, Plus, Edit2, AlertTriangle,
  ChevronDown, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = 'http://localhost:5000/api';

const CATEGORIES = ['food', 'medicine', 'water', 'clothes', 'hygiene', 'battery', 'other'];
const UNITS = ['kg', 'liters', 'pieces', 'units'];
const PRIORITIES = ['normal', 'urgent'];

const CATEGORY_COLORS = {
  food:     'text-emerald-600 bg-emerald-50 border-emerald-200',
  medicine: 'text-red-600 bg-red-50 border-red-200',
  water:    'text-blue-600 bg-blue-50 border-blue-200',
  clothes:  'text-purple-600 bg-purple-50 border-purple-200',
  hygiene:  'text-pink-600 bg-pink-50 border-pink-200',
  battery:  'text-amber-600 bg-amber-50 border-amber-200',
  other:    'text-gray-600 bg-gray-50 border-gray-200',
};

const PRIORITY_CONFIG = {
  urgent: 'text-red-600 bg-red-50 border-red-200',
  normal: 'text-gray-500 bg-gray-50 border-gray-200',
};

const navItems = [
  { label: 'Shelters',     icon: Home,      to: '/shelter-dashboard' },
  { label: 'Relief Items', icon: Package,   to: '/shelter/relief-items' },
  { label: 'Occupancy',    icon: Users,     to: '/shelter/occupancy' },
  { label: 'Alerts',       icon: Bell,      to: '/shelter/alerts' },
  { label: 'Weather',      icon: Activity,  to: '/shelter/weather' },
  { label: 'Reports',      icon: BarChart2, to: '/shelter/reports' },
];

const selCls = "px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition";
const inpCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition";

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B3C5D] flex flex-col z-40 select-none">
      <div className="px-6 py-6 border-b border-white/10">
        <span className="text-white font-bold text-xl tracking-tight">Climora <span className="text-[#06b6d4]">Shelter</span></span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink key={to} to={to} end={to === '/shelter-dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
            }>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-6 space-y-0.5 border-t border-white/10 pt-4">
        <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150"><Globe size={18} /> Go to Website</button>
        <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-150"><LogOut size={18} /> Logout</button>
      </div>
    </aside>
  );
}

function Topbar({ search, onSearch }) {
  const { user } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || 'S';
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="relative w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder="Search items or shelters..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all" />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#06b6d4] hover:border-[#06b6d4] transition-colors"><Bell size={18} /></button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] flex items-center justify-center text-white text-sm font-bold">{initial}</div>
      </div>
    </header>
  );
}

// ── Add Item Modal ─────────────────────────────────────────────────────────
function AddItemModal({ shelters, onClose, onDone }) {
  const [form, setForm] = useState({
    shelterId: '',
    name: '',
    category: 'food',
    quantity: '',
    unit: 'units',
    priorityLevel: 'normal',
    expiryDate: '',
    providedBy: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault();
    if (!form.shelterId) { setError('Please select a shelter'); return; }
    if (!form.name.trim()) { setError('Item name is required'); return; }
    if (!form.quantity || Number(form.quantity) < 0) { setError('Enter a valid quantity'); return; }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${API}/shelters/${form.shelterId}/items/${encodeURIComponent(form.name.trim())}`,
        {
          name: form.name.trim(),
          category: form.category,
          quantity: Number(form.quantity),
          unit: form.unit,
          priorityLevel: form.priorityLevel,
          expiryDate: form.expiryDate || undefined,
          providedBy: form.providedBy || undefined,
        },
        cfg
      );
      onDone(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-800">Add Relief Item</h3>
            <p className="text-xs text-gray-400 mt-0.5">Add a new item to a shelter's inventory</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"><X size={15} className="text-gray-500" /></button>
        </div>

        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2 mb-4"><AlertTriangle size={13} />{error}</div>}

        <form onSubmit={handle} className="space-y-4">
          {/* Shelter dropdown */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Shelter *</label>
            <select value={form.shelterId} onChange={e => set('shelterId', e.target.value)} className={`${inpCls} appearance-none`} required>
              <option value="">Select a shelter...</option>
              {shelters.map(s => (
                <option key={s.shelterId} value={s.shelterId}>{s.name} — {s.district}</option>
              ))}
            </select>
          </div>

          {/* Item name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Item Name *</label>
            <input type="text" className={inpCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rice, Paracetamol..." required />
          </div>

          {/* Category + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={`${inpCls} appearance-none`}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Priority</label>
              <select value={form.priorityLevel} onChange={e => set('priorityLevel', e.target.value)} className={`${inpCls} appearance-none`}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity + Unit row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quantity *</label>
              <input type="number" min="0" className={inpCls} value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className={`${inpCls} appearance-none`}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Expiry Date</label>
            <input type="date" className={inpCls} value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
          </div>

          {/* Provided by */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Provided By</label>
            <input type="text" className={inpCls} value={form.providedBy} onChange={e => set('providedBy', e.target.value)} placeholder="Organisation or donor name" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Adjust Qty Modal ───────────────────────────────────────────────────────
function AdjustModal({ item, shelterId, onClose, onDone }) {
  const [amount, setAmount] = useState(1);
  const [mode, setMode] = useState('increase');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API}/shelters/${shelterId}/items/${encodeURIComponent(item.name)}/${mode}`, { amount }, cfg);
      onDone(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update quantity');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Adjust Quantity</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"><X size={15} className="text-gray-500" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Item: <span className="font-semibold text-gray-700">{item.name}</span> — Current: <span className="font-semibold">{item.quantity} {item.unit}</span></p>
        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2 mb-3"><AlertTriangle size={13} />{error}</div>}
        <div className="flex gap-2 mb-4">
          {['increase', 'decrease'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${mode === m ? 'bg-[#06b6d4] text-white border-[#06b6d4]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
              {m === 'increase' ? '+ Increase' : '− Decrease'}
            </button>
          ))}
        </div>
        <input type="number" min="1" value={amount} onChange={e => setAmount(Number(e.target.value))}
          className={`${inpCls} mb-4`} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handle} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
            {saving ? 'Saving...' : 'Apply'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ReliefItemsPage() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterShelter, setFilterShelter] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/shelters`);
      setShelters(Array.isArray(data) ? data : data.shelters || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const allItems = shelters.flatMap(s =>
    (s.reliefItems || []).map(item => ({ ...item, shelterName: s.name, shelterId: s.shelterId }))
  );

  const filtered = allItems.filter(item => {
    const q = search.toLowerCase();
    return (!q || item.name?.toLowerCase().includes(q) || item.shelterName?.toLowerCase().includes(q))
      && (filterCategory === 'all' || item.category === filterCategory)
      && (filterShelter === 'all' || item.shelterId === filterShelter)
      && (filterPriority === 'all' || item.priorityLevel === filterPriority);
  });

  const stats = {
    total: allItems.length,
    urgent: allItems.filter(i => i.priorityLevel === 'urgent').length,
    categories: [...new Set(allItems.map(i => i.category).filter(Boolean))].length,
  };

  const hasFilters = filterCategory !== 'all' || filterShelter !== 'all' || filterPriority !== 'all';

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar search={search} onSearch={setSearch} />
        <main className="flex-1 p-6 space-y-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Relief Items</h1>
              <p className="text-sm text-gray-500 mt-1">Track and manage relief supplies across all shelters.</p>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-semibold hover:opacity-90 transition shadow-sm">
              <Plus size={16} /> Add Item
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Package, label: 'Total Items', value: stats.total, color: 'text-[#06b6d4]' },
              { icon: AlertTriangle, label: 'Urgent Items', value: stats.urgent, color: 'text-red-500' },
              { icon: ChevronDown, label: 'Categories', value: stats.categories, color: 'text-purple-500' },
            ].map(({ icon: Icon, label, value, color }) => (
              loading
                ? <div key={label} className="bg-[#F9FAFB] rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gray-200" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-24" /><div className="h-6 bg-gray-200 rounded w-16" /></div></div></div>
                : <div key={label} className="bg-[#F9FAFB] rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm ${color}`}><Icon size={22} /></div>
                      <div><p className="text-sm text-gray-500 font-medium">{label}</p><p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p></div>
                    </div>
                  </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-[#F9FAFB] rounded-2xl border border-gray-100 p-4 flex flex-wrap items-center gap-3">
            <select value={filterShelter} onChange={e => setFilterShelter(e.target.value)} className={selCls}>
              <option value="all">All Shelters</option>
              {shelters.map(s => <option key={s.shelterId} value={s.shelterId}>{s.name}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selCls}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={selCls}>
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            {hasFilters && (
              <button onClick={() => { setFilterCategory('all'); setFilterShelter('all'); setFilterPriority('all'); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-200 bg-white transition">
                <X size={13} /> Clear filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-[#F9FAFB] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#06b6d4] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No relief items found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white border-b border-gray-100">
                    <tr>
                      {['Item', 'Shelter', 'Category', 'Quantity', 'Priority', 'Expiry', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, i) => (
                      <motion.tr key={`${item.shelterId}-${item.name}-${i}`}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="border-b border-gray-50 hover:bg-white transition group">
                        <td className="px-4 py-3.5 font-semibold text-gray-800 text-sm">{item.name}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-500">{item.shelterName}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}>
                            {item.category || 'other'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">{item.quantity} <span className="font-normal text-gray-400">{item.unit}</span></td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_CONFIG[item.priorityLevel] || PRIORITY_CONFIG.normal}`}>
                            {item.priorityLevel || 'normal'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-500">
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => setAdjustTarget({ item, shelterId: item.shelterId })}
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-gray-100 hover:bg-[#06b6d4]/10 hover:text-[#06b6d4] flex items-center justify-center transition text-gray-500">
                            <Edit2 size={13} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddItemModal shelters={shelters} onClose={() => setShowAddModal(false)} onDone={fetchAll} />
        )}
        {adjustTarget && (
          <AdjustModal item={adjustTarget.item} shelterId={adjustTarget.shelterId}
            onClose={() => setAdjustTarget(null)} onDone={fetchAll} />
        )}
      </AnimatePresence>
    </div>
  );
}
