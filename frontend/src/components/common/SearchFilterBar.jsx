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

  const selectClasses = `px-3 py-2.5 outline-none rounded-xl text-sm cursor-pointer min-w-[140px] appearance-none transition-all ${
    isDark 
      ? 'bg-white/5 border border-white/10 text-white focus:border-cyan-500'
      : 'bg-gray-50 border border-gray-200 text-gray-700 focus:border-blue-500'
  }`;

  return (
    <div className={`p-4 rounded-2xl flex flex-col md:flex-row gap-4 mb-6 transition-all ${
      isDark 
        ? 'bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]' 
        : 'bg-white shadow-sm border border-gray-100'
    }`}>
      <div className="relative flex-1">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
        <input 
          type="text" 
          placeholder="Search incidents by title, description, district, or city..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
            isDark 
              ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:ring-cyan-500/30 focus:border-cyan-500' 
              : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-blue-500/20 focus:border-blue-500'
          }`}
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
          <option value="" className="text-gray-900">All Categories</option>
          <option value="FLOOD" className="text-gray-900">Flood</option>
          <option value="LANDSLIDE" className="text-gray-900">Landslide</option>
          <option value="POLLUTION" className="text-gray-900">Pollution</option>
          <option value="HEATWAVE" className="text-gray-900">Heatwave</option>
          <option value="STORM" className="text-gray-900">Storm</option>
          <option value="AIR_QUALITY" className="text-gray-900">Air Quality</option>
          <option value="OTHER" className="text-gray-900">Other</option>
        </select>

        <select 
          className={selectClasses}
          value={severity} 
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="" className="text-gray-900">All Severities</option>
          <option value="LOW" className="text-gray-900">Low</option>
          <option value="MEDIUM" className="text-gray-900">Medium</option>
          <option value="HIGH" className="text-gray-900">High</option>
          <option value="CRITICAL" className="text-gray-900">Critical</option>
        </select>

        {showStatusFilter && (
          <select 
            className={selectClasses}
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="" className="text-gray-900">All Statuses</option>
            <option value="ADMIN_VERIFIED" className="text-gray-900">Verified</option>
            <option value="PENDING" className="text-gray-900">Pending</option>
            <option value="REJECTED" className="text-gray-900">Rejected</option>
            <option value="COMMUNITY_CONFIRMED" className="text-gray-900">Community Confirmed</option>
          </select>
        )}
      </div>
    </div>
  );
}
