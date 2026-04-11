import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Bell, Search, AlertTriangle, X, Users, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ShelterSidebar from '../../components/shelterManager/ShelterSidebar';

const API = 'http://localhost:5000/api';

function Topbar({ search, onSearch }) {
  const { user } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || 'S';
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="relative w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder="Search shelters..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all" />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#06b6d4] hover:border-[#06b6d4] transition-colors"><Bell size={18} /></button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] flex items-center justify-center text-white text-sm font-bold">{initial}</div>
      </div>
    </header>
  );
}


function OccupancyBar({ current, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-[#06b6d4]';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current} / {total}</span>
        <span className={pct >= 90 ? 'text-red-500 font-semibold' : ''}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
}

// ── Update Occupancy Modal ─────────────────────────────────────────────────
function UpdateModal({ shelter, onClose, onDone }) {
  const [form, setForm] = useState({ currentOccupancy: '', childrenCount: '', elderlyCount: '', specialNeedsCount: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API}/shelters/${shelter.shelterId}/occupancy`, {
        capacityTotal: shelter.capacityTotal || 0,
        currentOccupancy: Number(form.currentOccupancy),
        childrenCount: Number(form.childrenCount) || 0,
        elderlyCount: Number(form.elderlyCount) || 0,
        specialNeedsCount: Number(form.specialNeedsCount) || 0,
        recordedBy: 'shelter_manager',
      }, cfg);
      onDone(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update occupancy');
    } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800">Update Occupancy</h3>
            <p className="text-xs text-gray-400 mt-0.5">{shelter.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"><X size={15} className="text-gray-500" /></button>
        </div>
        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2 mb-3"><AlertTriangle size={13} />{error}</div>}
        <form onSubmit={handle} className="space-y-3">
          {[['currentOccupancy', 'Current Occupancy *'], ['childrenCount', 'Children'], ['elderlyCount', 'Elderly'], ['specialNeedsCount', 'Special Needs']].map(([k, l]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{l}</label>
              <input type="number" min="0" required={k === 'currentOccupancy'} className={inp} value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function OccupancyPage() {
  const [shelters, setShelters] = useState([]);
  const [occupancies, setOccupancies] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updateTarget, setUpdateTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/shelters`);
      const list = Array.isArray(data) ? data : data.shelters || [];
      setShelters(list);
      const occ = {};
      await Promise.allSettled(list.map(async s => {
        try {
          const r = await axios.get(`${API}/shelters/${s.shelterId}/occupancy`);
          occ[s.shelterId] = r.data;
        } catch {}
      }));
      setOccupancies(occ);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = shelters.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name?.toLowerCase().includes(q) || s.district?.toLowerCase().includes(q);
  });

  const totalOccupied = shelters.reduce((a, s) => a + (occupancies[s.shelterId]?.currentOccupancy ?? s.capacityCurrent ?? 0), 0);
  const totalCapacity = shelters.reduce((a, s) => a + (s.capacityTotal || 0), 0);
  const overCapacity = shelters.filter(s => {
    const occ = occupancies[s.shelterId]?.currentOccupancy ?? s.capacityCurrent ?? 0;
    return s.capacityTotal > 0 && occ / s.capacityTotal >= 0.9;
  }).length;

  return (
    <div className="flex min-h-screen bg-white">
      <ShelterSidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar search={search} onSearch={setSearch} />
        <main className="flex-1 p-6 space-y-6 bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Occupancy Tracking</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor real-time occupancy across all shelters.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Users, label: 'Total Occupied', value: totalOccupied, color: 'text-[#06b6d4]' },
              { icon: Home, label: 'Total Capacity', value: totalCapacity, color: 'text-emerald-500' },
              { icon: AlertTriangle, label: 'Near Capacity (≥90%)', value: overCapacity, color: 'text-red-500' },
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

          {/* Cards grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#06b6d4] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(s => {
                const occ = occupancies[s.shelterId];
                const current = occ?.currentOccupancy ?? s.capacityCurrent ?? 0;
                const pct = s.capacityTotal > 0 ? Math.round((current / s.capacityTotal) * 100) : 0;
                const isOver = pct >= 90;
                return (
                  <motion.div key={s.shelterId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`bg-[#F9FAFB] rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${isOver ? 'border-red-200' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.district} · {s.shelterId}</p>
                      </div>
                      {isOver && <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><AlertTriangle size={11} /> Full</span>}
                    </div>
                    <OccupancyBar current={current} total={s.capacityTotal} />
                    {occ && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                        {[['Children', occ.childrenCount], ['Elderly', occ.elderlyCount], ['Special', occ.specialNeedsCount]].map(([l, v]) => (
                          <div key={l} className="text-center">
                            <p className="text-sm font-bold text-gray-700">{v ?? 0}</p>
                            <p className="text-xs text-gray-400">{l}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setUpdateTarget(s)}
                      className="mt-3 w-full py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-white hover:border-[#06b6d4] hover:text-[#06b6d4] transition">
                      Update Occupancy
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {updateTarget && (
        <UpdateModal shelter={updateTarget} onClose={() => setUpdateTarget(null)} onDone={fetchData} />
      )}
    </div>
  );
}

