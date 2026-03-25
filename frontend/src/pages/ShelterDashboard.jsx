import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ShelterScene from '../components/ShelterScene';
import { Activity, ShieldCheck, MapPin, Plus, Zap, X, Send, Users, Warehouse, Server, Layers, Map, Thermometer, Info, Edit2 } from 'lucide-react';

const shelterImages = [
  "https://images.unsplash.com/photo-1541888009232-fb9f8d5f3068?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511818966892-d7d671e6728c?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531297172864-459c7ac5eb8e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop"
];

const initialFormState = {
  name: '',
  district: '',
  address: '',
  lat: '',
  lng: '',
  capacityTotal: '',
  type: 'other',
  riskLevel: 'low',
  status: 'planned'
};

const ShelterDashboard = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editShelterId, setEditShelterId] = useState(null);

  const [formData, setFormData] = useState(initialFormState);

  const fetchShelters = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/shelters');
      setShelters(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Backend fetch failed:", err);
      setShelters([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOpenCreateForm = () => {
    setEditShelterId(null);
    setFormData(initialFormState);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (shelter) => {
    setEditShelterId(shelter.shelterId);
    setFormData({
      name: shelter.name || '',
      district: shelter.district || '',
      address: shelter.address || '',
      lat: shelter.lat || '',
      lng: shelter.lng || '',
      capacityTotal: shelter.capacityTotal || '',
      type: shelter.type || 'other',
      riskLevel: shelter.riskLevel || 'low',
      status: shelter.status || 'planned'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: formData.name,
        district: formData.district,
        address: formData.address,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        capacityTotal: parseInt(formData.capacityTotal),
        type: formData.type,
        riskLevel: formData.riskLevel,
        status: formData.status
      };

      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      };

      if (editShelterId) {
        await axios.put(`http://localhost:5000/api/shelters/${editShelterId}`, payload, config);
        alert("Shelter Node Successfully Updated.");
      } else {
        await axios.post('http://localhost:5000/api/shelters', payload, config);
        alert("New Shelter Node Successfully Initialized.");
      }

      setIsFormOpen(false);
      fetchShelters();
      setFormData(initialFormState);
      setEditShelterId(null);
    } catch (err) {
      alert(`Error: Could not ${editShelterId ? 'update' : 'register'} shelter node. Ensure token permissions are valid.`);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02050f] text-slate-200 font-sans overflow-x-hidden selection:bg-blue-500/30 relative py-12">
      
      {/* Background Graphic Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      </div>

      {/* SIDE FORM PANEL (Cinematic Slide-in) */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#050b1c]/95 backdrop-blur-3xl z-50 transform ${isFormOpen ? 'translate-x-0' : 'translate-x-full'} transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) border-l border-blue-500/20 p-10 shadow-[-30px_0_100px_rgba(0,10,40,0.9)] overflow-y-auto custom-scrollbar`}>
        <div className="flex justify-between items-center mb-10 sticky top-0 bg-[#050b1c]/95 pt-2 pb-4 z-10 border-b border-blue-500/10">
          <div>
            <h2 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tighter">
              {editShelterId ? 'UPDATE NODE' : 'NODE SECURE'}
            </h2>
            <p className="text-blue-500/70 text-xs uppercase tracking-[0.3em] mt-1 font-bold">
              {editShelterId ? `Modifying: ${editShelterId}` : 'Register Grid Segment Parameter'}
            </p>
          </div>
          <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-full transition-all border border-transparent hover:border-red-500/30">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          <div className="space-y-2 group">
            <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 font-bold group-focus-within:text-cyan-400 transition-colors flex items-center gap-2">
               <Layers size={12}/> Shelter Designation (Name)
            </label>
            <input type="text" name="name" required value={formData.name} className="w-full bg-[#0a1128]/50 border border-blue-500/20 rounded-xl p-4 text-white focus:border-cyan-400 focus:bg-[#0a1128] focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] outline-none transition-all"
              onChange={handleInputChange} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 font-bold">Sector / District</label>
              <input type="text" name="district" required value={formData.district} placeholder="e.g. GAMPAHA" className="w-full bg-[#0a1128]/50 border border-blue-500/20 rounded-xl p-4 text-white focus:border-cyan-400 outline-none transition-all placeholder:text-slate-600"
                onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 font-bold">Max Entities (Capacity)</label>
              <input type="number" name="capacityTotal" required value={formData.capacityTotal} className="w-full bg-[#0a1128]/50 border border-blue-500/20 rounded-xl p-4 text-white focus:border-cyan-400 outline-none transition-all"
                onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 font-bold flex items-center gap-1"><Map size={12}/> Latitude</label>
              <input type="number" step="any" name="lat" required value={formData.lat} placeholder="40.7128" className="w-full bg-[#0a1128]/50 border border-blue-500/20 rounded-xl p-4 text-white focus:border-cyan-400 outline-none transition-all"
                onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 font-bold">Longitude</label>
              <input type="number" step="any" name="lng" required value={formData.lng} placeholder="-74.0060" className="w-full bg-[#0a1128]/50 border border-blue-500/20 rounded-xl p-4 text-white focus:border-cyan-400 outline-none transition-all"
                onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 font-bold flex items-center gap-1"><Info size={12}/> Facility Type</label>
              <select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-[#0a1128]/50 border border-blue-500/20 rounded-xl p-4 text-white focus:border-cyan-400 outline-none transition-all appearance-none">
                <option value="school">School</option>
                <option value="temple">Temple</option>
                <option value="communityHall">Community Hall</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 font-bold flex items-center gap-1"><Thermometer size={12}/> Risk Level</label>
              <select name="riskLevel" value={formData.riskLevel} onChange={handleInputChange} className="w-full bg-[#0a1128]/50 border border-blue-500/20 rounded-xl p-4 text-white focus:border-cyan-400 outline-none transition-all appearance-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {editShelterId && (
            <div className="space-y-2 group">
              <label className="text-[10px] uppercase tracking-[0.2em] text-orange-500/70 font-bold">Node Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-[#0a1128]/50 border border-orange-500/20 rounded-xl p-4 text-white focus:border-orange-400 outline-none transition-all appearance-none">
                <option value="planned">Planned</option>
                <option value="standby">Standby</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 font-bold">Geographic Address</label>
            <textarea rows="3" name="address" required value={formData.address} className="w-full bg-[#0a1128]/50 border border-blue-500/20 rounded-xl p-4 text-white focus:border-cyan-400 outline-none transition-all resize-none"
              onChange={handleInputChange}></textarea>
          </div>
          
          <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black py-5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] hover:-translate-y-1 active:scale-95 border border-cyan-300/30 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? <Activity size={18} className="animate-spin" /> : <Send size={18} />}
            {submitting ? 'TRANSMITTING...' : (editShelterId ? 'CONFIRM UPDATE' : 'ESTABLISH UPLINK')}
          </button>
        </form>
      </div>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-6 lg:px-12 xl:px-16">
        
        {/* Header Section */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-12 relative">
          <div className="absolute top-0 left-0 w-32 h-1 bg-gradient-to-r from-blue-500 to-transparent" />
          <div className="animate-in fade-in slide-in-from-left duration-1000 pt-6">
            <div className="flex items-center gap-4 mb-3">
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-black tracking-[0.3em] text-blue-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" /> SYSTEM ONLINE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">v4.0.2.88</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase" style={{ textShadow: '0 0 80px rgba(59,130,246,0.5)' }}>
              OVER<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">WATCH</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2 uppercase tracking-[0.5em] font-medium max-w-2xl leading-relaxed">
              Global Shelter Grid & Interactive Visualization Matrix
            </p>
          </div>
          
          <button onClick={handleOpenCreateForm}
            className="group relative overflow-hidden flex items-center gap-4 bg-[#0a1128] border border-blue-500/30 text-cyan-400 px-8 py-5 rounded-2xl font-black transition-all hover:bg-blue-900/40 hover:border-cyan-400/70 shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-500 text-cyan-300" />
            <span className="tracking-[0.2em] relative z-10">INITIALIZE NODE</span>
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column: 3D Visualization */}
          <div className="xl:col-span-12 2xl:col-span-7 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            <div className="relative bg-[#050b1c]/80 backdrop-blur-2xl border border-blue-900/50 rounded-[2rem] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)] group h-[600px] flex flex-col">
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-blue-500/50 rounded-tl-[2rem] opacity-50 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 rounded-br-[2rem] opacity-50 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" />

              <div className="absolute z-20 top-8 left-10 pointer-events-none">
                <h2 className="text-3xl font-black flex items-center gap-4 tracking-tight text-white mb-1 drop-shadow-md">
                   Core Topology <Zap className="text-cyan-400" size={24} />
                </h2>
                <p className="text-cyan-400/60 font-mono text-xs uppercase tracking-widest">Live Spatial Tracking Engine</p>
              </div>

              <div className="absolute z-20 top-8 right-10 pointer-events-none">
                <div className="flex items-center gap-2 bg-[#02050f]/80 backdrop-blur-md px-4 py-2 rounded-lg border border-blue-500/20 shadow-lg">
                  <Activity size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Sync: Realtime</span>
                </div>
              </div>
              
              <div className="absolute inset-0 z-0">
                 <ShelterScene />
                 <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_#050b1c]" />
              </div>

              {/* Stats Bar */}
              <div className="mt-auto relative z-20 bg-gradient-to-t from-[#02050f]/90 via-[#02050f]/60 to-transparent pt-20 pb-8 px-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-20 backdrop-blur-sm">
                  <StatCard icon={<Server size={18} />} label="Active Nodes" val={shelters.length} color="text-white" />
                  <StatCard icon={<Users size={18} />} label="Total Capacity" val={shelters.reduce((a, b) => a + (Number(b.capacityTotal) || 0), 0)} color="text-cyan-300" />
                  <StatCard icon={<Activity size={18} />} label="Current Load" val={shelters.reduce((a, b) => a + (Number(b.currentOccupantsCount) || 0), 0)} color="text-blue-400" />
                  <StatCard icon={<ShieldCheck size={18} />} label="System Health" val={shelters.length > 0 ? "OPTIMAL" : "AWAITING"} color="text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Shelter Grid with Images */}
          <div className="xl:col-span-12 2xl:col-span-5 h-[600px] flex flex-col animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 relative z-20">
            <div className="flex justify-between items-end mb-6 px-2">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-3 tracking-tight text-white uppercase">
                   Operations Feed
                </h3>
                <p className="text-slate-500 text-xs font-mono tracking-widest uppercase mt-1">Real-time Node Status</p>
              </div>
              <div className="h-px flex-1 mx-6 bg-gradient-to-r from-blue-500/20 to-transparent" />
              <Warehouse size={24} className="text-blue-500/50" />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-64 bg-[#0a1128] border border-blue-900/30 animate-pulse rounded-[1.5rem]" />)}
                </div>
              ) : shelters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-[#0a1128]/30 rounded-[2rem] border border-dashed border-blue-900/50">
                  <ShieldCheck size={48} className="text-slate-700 mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest">No Sector Nodes Detected</p>
                  <p className="text-slate-600 text-sm mt-2">Initialize a new deployment via Admin interface to populate.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
                  {shelters.map((s, idx) => (
                    <ImageShelterCard key={s._id || s.shelterId} s={s} image={shelterImages[idx % shelterImages.length]} index={idx} onEdit={() => handleOpenEditForm(s)} />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(10, 17, 40, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.8); }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}} />
    </div>
  );
};

// --- SUB COMPONENTS ---

const StatCard = ({ icon, label, val, color }) => (
  <div className={`bg-[#0a1128]/80 backdrop-blur-md border border-blue-500/20 p-5 rounded-2xl hover:bg-[#0f1738] transition-all duration-300 relative overflow-hidden group`}>
    <div className={`absolute -inset-10 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out`} />
    <div className="flex items-center gap-2 mb-3">
      <div className={`p-1.5 rounded-lg bg-white/5 ${color}`}>{icon}</div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/80 font-bold">{label}</p>
    </div>
    <p className={`text-2xl font-black ${color} tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] truncate`}>{val}</p>
  </div>
);

const ImageShelterCard = ({ s, image, index, onEdit }) => {
  const cap = Number(s.capacityTotal) || 1;
  const occ = Number(s.currentOccupantsCount) || Number(s.capacityCurrent) || 0;
  const percentage = Math.min((occ / cap) * 100, 100);
  const isHighLoad = percentage > 85;

  return (
    <div 
      className="group relative h-64 rounded-[1.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-cyan-500/20 transition-all duration-500 animate-in fade-in zoom-in-95" 
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
    >
      <div className="absolute inset-0">
        <img src={image} alt={s.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-1000 ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02050f] via-[#02050f]/80 to-transparent" />
        <div className={`absolute inset-0 border-2 rounded-[1.5rem] pointer-events-none transition-colors duration-500 ${isHighLoad ? 'border-red-500/40 group-hover:border-red-500/80' : 'border-blue-500/20 group-hover:border-cyan-400/50'}`} />
      </div>

      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        <div className="flex justify-between items-start mb-auto">
          <div className={`text-[9px] font-black px-2.5 py-1 rounded-md backdrop-blur-md border shadow-lg ${isHighLoad ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-black/60 text-cyan-300 border-cyan-500/30'}`}>
            {percentage.toFixed(0)}% LOAD
          </div>
          <div className="flex gap-2 relative z-10">
            <span className={`text-[9px] font-mono px-2 py-1 rounded backdrop-blur-md ${s.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/80 text-slate-400 border border-slate-600'}`}>
               {s.status?.toUpperCase() || 'PLANNED'}
            </span>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="bg-black/50 hover:bg-cyan-500/20 hover:text-cyan-400 backdrop-blur-md p-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-white shadow-xl hover:shadow-cyan-500/50">
              <Edit2 size={14} />
            </button>
            <div className={`bg-black/50 backdrop-blur-md p-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 text-white pointer-events-none`}>
              <Activity size={14} className={isHighLoad ? 'text-red-400' : 'text-cyan-400'} />
            </div>
          </div>
        </div>

        <div>
           <div className="flex items-center gap-1.5 text-cyan-400 text-[9px] mb-1 font-mono tracking-widest uppercase drop-shadow-md truncate">
             <MapPin size={10} className="shrink-0" /> {s.district} | {String(s.type).toUpperCase()}
           </div>
           <h4 className="font-black text-xl text-white group-hover:text-cyan-300 transition-colors tracking-tight uppercase leading-none mb-4 truncate drop-shadow-lg" style={{textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>{s.name}</h4>
           
           <div className="relative w-full bg-[#050b1c]/80 rounded-full h-1.5 overflow-hidden border border-white/10">
             <div 
               className={`h-full relative overflow-hidden transition-all duration-1000 ease-out ${isHighLoad ? 'bg-gradient-to-r from-red-600 to-orange-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
               style={{ width: `${percentage}%` }}
             >
                <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite] -translate-x-full" />
             </div>
           </div>
           
           <div className="flex justify-between mt-2 text-[9px] font-mono text-cyan-100/70 uppercase tracking-widest">
             <span>CAPACITY: {cap}</span>
             <span>OCCUPANTS: {occ}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ShelterDashboard;