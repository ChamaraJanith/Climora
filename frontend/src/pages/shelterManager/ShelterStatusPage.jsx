import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Home, Package, Users, Bell, Activity, BarChart2, Globe, LogOut,
  Search, ChevronDown, ChevronUp, MapPin, Phone, Mail, User,
  Layers, AlertTriangle, CheckCircle, Clock, XCircle, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = 'http://localhost:5000/api';

const navItems = [
  { label: 'Shelters',      icon: Home,      to: '/shelter-dashboard' },
  { label: 'Relief Items',  icon: Package,   to: '/shelter/relief-items' },
  { label: 'Occupancy',     icon: Users,     to: '/shelter/occupancy' },
  { label: 'Shelter Status',icon: Layers,    to: '/shelter/status' },
  { label: 'Alerts',        icon: Bell,      to: '/shelter/alerts' },
  { label: 'Weather',       icon: Activity,  to: '/shelter/weather' },
  { label: 'Reports',       icon: BarChart2, to: '/shelter/reports' },
];

const STATUS_CFG = {
  open:    { label: 'Open',    icon: CheckCircle, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  standby: { label: 'Standby', icon: Clock,       cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  planned: { label: 'Planned', icon: Clock,       cls: 'text-blue-600 bg-blue-50 border-blue-200' },
  closed:  { label: 'Closed',  icon: XCircle,     cls: 'text-red-600 bg-red-50 border-red-200' },
};

const RISK_CFG = {
  low:    'text-emerald-600 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  high:   'text-red-600 bg-red-50 border-red-200',
};

const CATEGORY_COLORS = {
  food:     'text-emerald-600 bg-emerald-50 border-emerald-200',
  medicine: 'text-red-600 bg-red-50 border-red-200',
  water:    'text-blue-600 bg-blue-50 border-blue-200',
  clothes:  'text-purple-600 bg-purple-50 border-purple-200',
  hygiene:  'text-pink-600 bg-pink-50 border-pink-200',
  battery:  'text-amber-600 bg-amber-50 border-amber-200',
  other:    'text-gray-600 bg-gray-50 border-gray-200',
};

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

function ShelterCard({ shelter, occupancy }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CFG[shelter.status] || STATUS_CFG.planned;
  const StatusIcon = sc.icon;
  const current = occupancy?.currentOccupancy ?? shelter.capacityCurrent ?? 0;
  const pct = shelter.capacityTotal > 0 ? Math.round((current / shelter.capacityTotal) * 100) : 0;
  const items = shelter.reliefItems || [];
  const urgentItems = items.filter(i => i.priorityLevel === 'urgent');

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header row — always visible */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-base truncate">{shelter.name}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              <MapPin size={11} /> {shelter.district} · {shelter.shelterId}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.cls}`}>
              <StatusIcon size={11} /> {sc.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${RISK_CFG[shelter.riskLevel] || RISK_CFG.low}`}>
              {shelter.riskLevel || 'low'} risk
            </span>
          </div>
        </div>

        {/* Occupancy bar */}
        <OccupancyBar current={current} total={shelter.capacityTotal} />

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-[#F9FAFB] rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-gray-800">{items.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Relief Items</p>
          </div>
          <div className="bg-[#F9FAFB] rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${urgentItems.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>{urgentItems.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Urgent Items</p>
          </div>
          <div className="bg-[#F9FAFB] rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${pct >= 90 ? 'text-red-500' : 'text-gray-800'}`}>{pct}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Capacity</p>
          </div>
        </div>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(e => !e)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition">
          {expanded ? <><ChevronUp size={13} /> Hide details</> : <><ChevronDown size={13} /> View full details</>}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden border-t border-gray-100">
            <div className="p-5 space-y-5">

              {/* Contact info */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</p>
                <div className="space-y-1.5">
                  {shelter.contactPerson && <div className="flex items-center gap-2 text-sm text-gray-600"><User size={13} className="text-gray-400" />{shelter.contactPerson}</div>}
                  {shelter.contactPhone  && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={13} className="text-gray-400" />{shelter.contactPhone}</div>}
                  {shelter.contactEmail  && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={13} className="text-gray-400" />{shelter.contactEmail}</div>}
                  {!shelter.contactPerson && !shelter.contactPhone && !shelter.contactEmail &&
                    <p className="text-sm text-gray-400">No contact info available</p>}
                </div>
              </div>

              {/* Occupancy breakdown */}
              {occupancy && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Occupancy Breakdown</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[['Children', occupancy.childrenCount], ['Elderly', occupancy.elderlyCount], ['Special Needs', occupancy.specialNeedsCount]].map(([l, v]) => (
                      <div key={l} className="bg-[#F9FAFB] rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-gray-700">{v ?? 0}</p>
                        <p className="text-xs text-gray-400">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities */}
              {shelter.facilities?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Facilities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {shelter.facilities.map(f => (
                      <span key={f} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F9FAFB] border border-gray-200 text-gray-600">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relief items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Relief Items ({items.length})</p>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-400">No items recorded</p>
                ) : (
                  <div data-lenis-prevent className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#F9FAFB] rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}>
                            {item.category || 'other'}
                          </span>
                          <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">{item.quantity} <span className="font-normal text-gray-400 text-xs">{item.unit}</span></span>
                          {item.priorityLevel === 'urgent' && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                              <AlertTriangle size={10} /> urgent
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-400 space-y-0.5 pt-1 border-t border-gray-100">
                {shelter.openSince && <p>Opened: {new Date(shelter.openSince).toLocaleString()}</p>}
                {shelter.closedAt  && <p>Closed: {new Date(shelter.closedAt).toLocaleString()}</p>}
                {shelter.address   && <p>Address: {shelter.address}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ShelterStatusPage() {
  const [shelters, setShelters] = useState([]);
  const [occupancies, setOccupancies] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

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

  const districts = [...new Set(shelters.map(s => s.district).filter(Boolean))].sort();

  const filtered = shelters.filter(s => {
    const q = search.toLowerCase();
    return (!q || s.name?.toLowerCase().includes(q) || s.district?.toLowerCase().includes(q) || s.shelterId?.toLowerCase().includes(q))
      && (filterStatus === 'all' || s.status === filterStatus)
      && (filterDistrict === 'all' || s.district === filterDistrict)
      && (filterRisk === 'all' || s.riskLevel === filterRisk);
  });

  const selCls = "px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition";
  const hasFilters = filterStatus !== 'all' || filterDistrict !== 'all' || filterRisk !== 'all';

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar search={search} onSearch={setSearch} />
        <main className="flex-1 p-6 space-y-6 bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Shelter Status</h1>
            <p className="text-sm text-gray-500 mt-1">Full status overview for each shelter independently.</p>
          </div>

          {/* Filters */}
          <div className="bg-[#F9FAFB] rounded-2xl border border-gray-100 p-4 flex flex-wrap items-center gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selCls}>
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CFG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
            <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} className={selCls}>
              <option value="all">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className={selCls}>
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {hasFilters && (
              <button onClick={() => { setFilterStatus('all'); setFilterDistrict('all'); setFilterRisk('all'); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-200 bg-white transition">
                <X size={13} /> Clear
              </button>
            )}
            <span className="ml-auto text-sm text-gray-400">{filtered.length} shelter{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#06b6d4] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Layers size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No shelters match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(s => (
                <ShelterCard key={s.shelterId} shelter={s} occupancy={occupancies[s.shelterId]} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
