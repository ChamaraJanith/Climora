import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function SearchFilterBar({ onFilterChange, showStatusFilter = false, theme = 'light' }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");

  const isDark = theme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, category, severity, status });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, severity, status, onFilterChange]);

  const selectClasses = `px-3 py-2.5 outline-none rounded-xl text-sm cursor-pointer min-w-[140px] appearance-none transition-all bg-[#020617] hover:bg-white/5 text-white border border-white/10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40`;

  return (
    <div className={`px-4 py-3 flex flex-col md:flex-row gap-4 mb-6 transition-all bg-[linear-gradient(135deg,#020617,#0f172a)] border border-white/10 rounded-2xl backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)]`}>
      <div className="relative flex-1">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40`} />
        <input 
          type="text" 
          placeholder="Search incidents by title, description, district, or city..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-transparent text-white placeholder:text-white/40 focus:ring-cyan-500/40 focus:border-cyan-500 border border-white/10`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="flex flex-wrap md:flex-nowrap gap-3 shrink-0">
        <select 
          className={selectClasses}
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="" className="bg-[#020617] text-white">All Categories</option>
          <option value="FLOOD" className="bg-[#020617] text-white">Flood</option>
          <option value="LANDSLIDE" className="bg-[#020617] text-white">Landslide</option>
          <option value="POLLUTION" className="bg-[#020617] text-white">Pollution</option>
          <option value="HEATWAVE" className="bg-[#020617] text-white">Heatwave</option>
          <option value="STORM" className="bg-[#020617] text-white">Storm</option>
          <option value="AIR_QUALITY" className="bg-[#020617] text-white">Air Quality</option>
          <option value="OTHER" className="bg-[#020617] text-white">Other</option>
        </select>

        <select 
          className={selectClasses}
          value={severity} 
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="" className="bg-[#020617] text-white">All Severities</option>
          <option value="LOW" className="bg-[#020617] text-white">Low</option>
          <option value="MEDIUM" className="bg-[#020617] text-white">Medium</option>
          <option value="HIGH" className="bg-[#020617] text-white">High</option>
          <option value="CRITICAL" className="bg-[#020617] text-white">Critical</option>
        </select>

        {showStatusFilter && (
          <select 
            className={selectClasses}
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="" className="bg-[#020617] text-white">All Statuses</option>
            <option value="ADMIN_VERIFIED" className="bg-[#020617] text-white">Verified</option>
            <option value="PENDING" className="bg-[#020617] text-white">Pending</option>
            <option value="REJECTED" className="bg-[#020617] text-white">Rejected</option>
            <option value="COMMUNITY_CONFIRMED" className="bg-[#020617] text-white">Community Confirmed</option>
          </select>
        )}
      </div>
    </div>
  );
}