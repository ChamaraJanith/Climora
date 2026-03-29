import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import {
  Home, Plus, Search, Filter, RefreshCw, X, Edit2, Trash2,
  Users, MapPin, AlertTriangle, Package, Bell,
  ChevronDown, ChevronUp, Eye, Shield, Globe, LogOut,
  Activity, BarChart2, Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = 'http://localhost:5000/api';

const STATUS_CONFIG = {
  open:    { label: 'Open',    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  standby: { label: 'Standby',color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  planned: { label: 'Planned',color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  closed:  { label: 'Closed', color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200',    dot: 'bg-gray-400'    },
};

const RISK_CONFIG = {
  low:    { label: 'Low',    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  medium: { label: 'Medium', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  high:   { label: 'High',   color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200'     },
};

const TYPE_LABELS = { school: 'School', temple: 'Temple', communityHall: 'Community Hall', other: 'Other' };

const DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
  'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala',
  'Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
  'Horowpathana','Horowpotana',
];

const EMPTY_FORM = {
  name: '', description: '', address: '', district: '', lat: '', lng: '',
  capacityTotal: '', type: 'other', riskLevel: 'low', status: 'planned',
  facilities: '', contactPerson: '', contactPhone: '', contactEmail: '',
};

// ── Sidebar ────────────────────────────────────────────────────────────────
const navItems = [
  { label: 'Shelters',      icon: Home,      to: '/shelter-dashboard' },
  { label: 'Relief Items',  icon: Package,   to: '/shelter/relief-items' },
  { label: 'Occupancy',     icon: Users,     to: '/shelter/occupancy' },
  { label: 'Shelter Status',icon: Layers,    to: '/shelter/status' },
  { label: 'Alerts',        icon: Bell,      to: '/shelter/alerts' },
  { label: 'Weather',       icon: Activity,  to: '/shelter/weather' },
  { label: 'Reports',       icon: BarChart2, to: '/shelter/reports' },
];

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B3C5D] flex flex-col z-40 select-none">
      <div className="px-6 py-6 border-b border-white/10">
        <span className="text-white font-bold text-xl tracking-tight">
          Climora <span className="text-[#06b6d4]">Shelter</span>
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink key={to} to={to} end={to === '/shelter-dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-6 space-y-0.5 border-t border-white/10 pt-4">
        <button onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150">
          <Globe size={18} /> Go to Website
        </button>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-150">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

// ── Topbar ─────────────────────────────────────────────────────────────────
function Topbar({ search, onSearch }) {
  const { user } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || 'S';
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="relative w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search shelters..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all duration-150"
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#06b6d4] hover:border-[#06b6d4] transition-colors duration-150">
          <Bell size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] flex items-center justify-center text-white text-sm font-bold">
          {initial}
        </div>
      </div>
    </header>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'text-[#06b6d4]', loading }) {
  if (loading) return (
    <div className="bg-[#F9FAFB] rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
  return (
    <div className="bg-[#F9FAFB] rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-150">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm ${color}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{value ?? 0}</p>
        </div>
      </div>
    </div>
  );
}

// ── Occupancy Bar ──────────────────────────────────────────────────────────
function OccupancyBar({ current, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-[#06b6d4]';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current} / {total}</span>
        <span className={pct >= 90 ? 'text-red-500 font-semibold' : ''}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

// ── Shelter Form Modal ─────────────────────────────────────────────────────
function ShelterModal({ shelter, onClose, onSave }) {
  const normaliseDistrict = (raw) => {
    if (!raw) return '';
    const match = DISTRICTS.find(d => d.toLowerCase() === raw.toLowerCase());
    return match || raw;
  };
  const [form, setForm] = useState(shelter ? {
    ...shelter,
    district: normaliseDistrict(shelter.district),
    facilities: (shelter.facilities || []).join(', '),
    lat: shelter.lat ?? '', lng: shelter.lng ?? '',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        lat: parseFloat(form.lat), lng: parseFloat(form.lng),
        capacityTotal: parseInt(form.capacityTotal, 10),
        facilities: form.facilities ? form.facilities.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      const token = localStorage.getItem('token');
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      if (shelter) {
        const { data } = await axios.put(`${API}/shelters/${shelter.shelterId}`, payload, cfg);
        onSave(data);
      } else {
        const { data } = await axios.post(`${API}/shelters`, payload, cfg);
        onSave(data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save shelter');
    } finally { setSaving(false); }
  };

  const F = ({ label, children, span2 }) => (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition";
  const sel = inp + " cursor-pointer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ height: 'min(90vh, 720px)' }}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{shelter ? 'Edit Shelter' : 'Add New Shelter'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{shelter ? `ID: ${shelter.shelterId}` : 'Fill in the shelter details below'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X size={15} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              <AlertTriangle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}
          <form id="shelter-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <F label="Shelter Name" span2>
                <input required className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Colombo Community Hall" />
              </F>
              <F label="District">
                <select required className={sel} value={form.district} onChange={e => set('district', e.target.value)}>
                  <option value="">Select district</option>
                  {form.district && !DISTRICTS.includes(form.district) && <option value={form.district}>{form.district}</option>}
                  {[...DISTRICTS].sort().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </F>
              <F label="Type">
                <select className={sel} value={form.type} onChange={e => set('type', e.target.value)}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </F>
              <F label="Address" span2>
                <input required className={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
              </F>
              <F label="Latitude">
                <input required type="number" step="any" className={inp} value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="6.9271" />
              </F>
              <F label="Longitude">
                <input required type="number" step="any" className={inp} value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="79.8612" />
              </F>
              <F label="Total Capacity">
                <input required type="number" min="1" className={inp} value={form.capacityTotal} onChange={e => set('capacityTotal', e.target.value)} placeholder="500" />
              </F>
              <F label="Risk Level">
                <select className={sel} value={form.riskLevel} onChange={e => set('riskLevel', e.target.value)}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </F>
              <F label="Status">
                <select className={sel} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="planned">Planned</option><option value="standby">Standby</option>
                  <option value="open">Open</option><option value="closed">Closed</option>
                </select>
              </F>
              <F label="Contact Person">
                <input className={inp} value={form.contactPerson || ''} onChange={e => set('contactPerson', e.target.value)} placeholder="Name" />
              </F>
              <F label="Contact Phone">
                <input className={inp} value={form.contactPhone || ''} onChange={e => set('contactPhone', e.target.value)} placeholder="+94 77 000 0000" />
              </F>
              <F label="Contact Email">
                <input type="email" className={inp} value={form.contactEmail || ''} onChange={e => set('contactEmail', e.target.value)} placeholder="contact@shelter.lk" />
              </F>
              <F label="Facilities (comma-separated)" span2>
                <input className={inp} value={form.facilities} onChange={e => set('facilities', e.target.value)} placeholder="Water, Electricity, Medical, Food" />
              </F>
              <F label="Description" span2>
                <textarea rows={3} className={inp} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Brief description..." />
              </F>
            </div>
          </form>
        </div>
        <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" form="shelter-form" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
            {saving
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Saving...</span>
              : shelter ? 'Update Shelter' : 'Create Shelter'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Shelter Detail Panel ───────────────────────────────────────────────────
function ShelterDetail({ shelter, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(shelter.status);
  const [updating, setUpdating] = useState(false);
  const [occupancy, setOccupancy] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get(`${API}/shelters/${shelter.shelterId}/occupancy`).then(r => setOccupancy(r.data)).catch(() => {});
    axios.get(`${API}/shelters/${shelter.shelterId}/items`).then(r => setItems(r.data.reliefItems || [])).catch(() => {});
  }, [shelter.shelterId]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/shelters/${shelter.shelterId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      onStatusChange(shelter.shelterId, newStatus);
    } catch {}
    setUpdating(false);
  };

  const sc = STATUS_CONFIG[shelter.status] || STATUS_CONFIG.planned;
  const rc = RISK_CONFIG[shelter.riskLevel] || RISK_CONFIG.low;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md h-full max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-800 text-base">{shelter.name}</h2>
            <p className="text-xs text-gray-400">{shelter.shelterId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X size={15} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color} ${sc.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${rc.bg} ${rc.color} ${rc.border}`}>
              <Shield size={11} /> {rc.label} Risk
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-600 border-gray-200">
              {TYPE_LABELS[shelter.type] || shelter.type}
            </span>
          </div>
          <div className="bg-[#F9FAFB] rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Occupancy</p>
            <OccupancyBar current={occupancy?.currentOccupancy ?? shelter.capacityCurrent ?? 0} total={shelter.capacityTotal} />
            {occupancy && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[['Children', occupancy.childrenCount], ['Elderly', occupancy.elderlyCount], ['Special Needs', occupancy.specialNeedsCount]].map(([l, v]) => (
                  <div key={l} className="text-center">
                    <p className="text-base font-bold text-gray-700">{v ?? 0}</p>
                    <p className="text-xs text-gray-400">{l}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</p>
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex items-start gap-2"><MapPin size={14} className="text-[#06b6d4] mt-0.5 flex-shrink-0" /><span>{shelter.address}</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Lat: {shelter.lat}</span><span>·</span><span>Lng: {shelter.lng}</span>
              </div>
            </div>
          </div>
          {(shelter.contactPerson || shelter.contactPhone) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</p>
              <div className="text-sm text-gray-600 space-y-1">
                {shelter.contactPerson && <p>{shelter.contactPerson}</p>}
                {shelter.contactPhone && <p className="text-[#06b6d4]">{shelter.contactPhone}</p>}
                {shelter.contactEmail && <p className="text-gray-400 text-xs">{shelter.contactEmail}</p>}
              </div>
            </div>
          )}
          {shelter.facilities?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Facilities</p>
              <div className="flex flex-wrap gap-1.5">
                {shelter.facilities.map(f => (
                  <span key={f} className="px-2.5 py-1 bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20 rounded-lg text-xs font-medium">{f}</span>
                ))}
              </div>
            </div>
          )}
          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Relief Items ({items.length})</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {items.map(item => (
                  <div key={item.name} className="flex items-center justify-between bg-[#F9FAFB] rounded-lg px-3 py-2 border border-gray-100">
                    <div className="flex items-center gap-2"><Package size={13} className="text-gray-400" /><span className="text-sm text-gray-700">{item.name}</span></div>
                    <span className="text-sm font-semibold text-gray-600">{item.quantity} {item.unit || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
            <div className="flex gap-2">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition">
                {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
              <button onClick={handleStatusUpdate} disabled={updating || newStatus === shelter.status}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
                {updating ? '...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Shelter Row ────────────────────────────────────────────────────────────
function ShelterRow({ shelter, onEdit, onDelete, onView }) {
  const sc = STATUS_CONFIG[shelter.status] || STATUS_CONFIG.planned;
  const rc = RISK_CONFIG[shelter.riskLevel] || RISK_CONFIG.low;
  return (
    <motion.tr initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="border-b border-gray-50 hover:bg-[#F9FAFB] transition group">
      <td className="px-4 py-3.5">
        <p className="font-semibold text-gray-800 text-sm">{shelter.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{shelter.shelterId}</p>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin size={13} className="text-gray-400" />{shelter.district}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color} ${sc.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${rc.bg} ${rc.color} ${rc.border}`}>
          {rc.label}
        </span>
      </td>
      <td className="px-4 py-3.5 min-w-[140px]">
        <OccupancyBar current={shelter.capacityCurrent || 0} total={shelter.capacityTotal} />
      </td>
      <td className="px-4 py-3.5 text-sm text-gray-500">{TYPE_LABELS[shelter.type] || shelter.type}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onView(shelter)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-[#06b6d4]/10 hover:text-[#06b6d4] flex items-center justify-center transition text-gray-500"><Eye size={13} /></button>
          <button onClick={() => onEdit(shelter)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition text-gray-500"><Edit2 size={13} /></button>
          <button onClick={() => onDelete(shelter)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition text-gray-500"><Trash2 size={13} /></button>
        </div>
      </td>
    </motion.tr>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────
function DeleteConfirm({ shelter, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => { setDeleting(true); await onConfirm(shelter.shelterId); setDeleting(false); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-center font-bold text-gray-800 text-lg mb-1">Delete Shelter</h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-gray-700">{shelter.name}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handle} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function ShelterDashboard() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState(null);
  const [detailShelter, setDetailShelter] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const fetchShelters = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.get(`${API}/shelters`);
      const list = Array.isArray(data) ? data : data.shelters || [];
      // Fetch latest occupancy for each shelter and merge into capacityCurrent
      const settled = await Promise.allSettled(
        list.map(s => axios.get(`${API}/shelters/${s.shelterId}/occupancy`))
      );
      const merged = list.map((s, i) => {
        const result = settled[i];
        if (result.status === 'fulfilled') {
          return { ...s, capacityCurrent: result.value.data.currentOccupancy ?? s.capacityCurrent };
        }
        return s;
      });
      setShelters(merged);
    } catch { setError('Failed to load shelters. Make sure the backend is running.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchShelters(); }, [fetchShelters]);

  const handleSave = (saved) => {
    setShelters(prev => {
      const idx = prev.findIndex(s => s.shelterId === saved.shelterId);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API}/shelters/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setShelters(prev => prev.filter(s => s.shelterId !== id));
  };

  const handleStatusChange = (id, status) => {
    setShelters(prev => prev.map(s => s.shelterId === id ? { ...s, status } : s));
    if (detailShelter?.shelterId === id) setDetailShelter(s => ({ ...s, status }));
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const stats = {
    total: shelters.length,
    open: shelters.filter(s => s.status === 'open').length,
    highRisk: shelters.filter(s => s.riskLevel === 'high').length,
    totalCapacity: shelters.reduce((a, s) => a + (s.capacityTotal || 0), 0),
    totalOccupied: shelters.reduce((a, s) => a + (s.capacityCurrent || 0), 0),
  };

  const filtered = shelters
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.district?.toLowerCase().includes(q) || s.shelterId?.toLowerCase().includes(q);
      return matchSearch
        && (filterStatus === 'all' || s.status === filterStatus)
        && (filterDistrict === 'all' || s.district === filterDistrict)
        && (filterRisk === 'all' || s.riskLevel === filterRisk);
    })
    .sort((a, b) => {
      let va = a[sortField] ?? ''; let vb = b[sortField] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const SortIcon = ({ field }) => sortField === field
    ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
    : <ChevronDown size={13} className="opacity-30" />;

  const thCls = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none";
  const selCls = "px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition";

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar search={search} onSearch={setSearch} />

        <main className="flex-1 p-6 space-y-6 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Shelter Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and monitor all shelters.</p>
            </div>
            <button onClick={() => setModal('add')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-semibold hover:opacity-90 transition shadow-sm">
              <Plus size={16} /> Add Shelter
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Home}  label="Total Shelters"   value={stats.total}         color="text-[#06b6d4]"   loading={loading} />
            <StatCard icon={Users} label="Open Shelters"    value={stats.open}          color="text-emerald-500" loading={loading} />
            <StatCard icon={Shield} label="High Risk"       value={stats.highRisk}      color="text-red-500"     loading={loading} />
            <StatCard icon={Users} label="Total Capacity"   value={stats.totalCapacity} color="text-purple-500"  loading={loading} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              <AlertTriangle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-[#F9FAFB] rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Filter size={15} /> Filters</span>
              <div className="flex items-center gap-2">
                <button onClick={fetchShelters}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:text-[#06b6d4] hover:bg-white border border-gray-200 transition">
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selCls}>
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
              <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} className={selCls}>
                <option value="all">All Districts</option>
                {[...new Set(shelters.map(s => s.district).filter(Boolean))].sort().map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className={selCls}>
                <option value="all">All Risk Levels</option>
                {Object.entries(RISK_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
              {(filterStatus !== 'all' || filterDistrict !== 'all' || filterRisk !== 'all') && (
                <button onClick={() => { setFilterStatus('all'); setFilterDistrict('all'); setFilterRisk('all'); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-200 bg-white transition">
                  <X size={13} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#F9FAFB] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                {filtered.length} shelter{filtered.length !== 1 ? 's' : ''}
                {filtered.length !== shelters.length && <span className="text-gray-400 font-normal"> (filtered from {shelters.length})</span>}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#06b6d4] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Home size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No shelters found</p>
                <p className="text-xs mt-1">Try adjusting your filters or add a new shelter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white border-b border-gray-100">
                    <tr>
                      <th className={thCls} onClick={() => toggleSort('name')}>
                        <span className="flex items-center gap-1">Name <SortIcon field="name" /></span>
                      </th>
                      <th className={thCls} onClick={() => toggleSort('district')}>
                        <span className="flex items-center gap-1">District <SortIcon field="district" /></span>
                      </th>
                      <th className={thCls}>Status</th>
                      <th className={thCls}>Risk</th>
                      <th className={thCls}>Occupancy</th>
                      <th className={thCls}>Type</th>
                      <th className={thCls}>Actions</th>
                    </tr>
                  </thead>
                  <AnimatePresence>
                    <tbody>
                      {filtered.map(s => (
                        <ShelterRow key={s.shelterId} shelter={s}
                          onEdit={s => setModal(s)}
                          onDelete={s => setDeleteTarget(s)}
                          onView={s => setDetailShelter(s)}
                        />
                      ))}
                    </tbody>
                  </AnimatePresence>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <ShelterModal
            shelter={modal === 'add' ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
        {detailShelter && (
          <ShelterDetail
            shelter={detailShelter}
            onClose={() => setDetailShelter(null)}
            onStatusChange={handleStatusChange}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            shelter={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
