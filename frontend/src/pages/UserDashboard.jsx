import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

import socket from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ProfileLocationMap from '../components/ui/ProfileLocationMap';
import UserWeatherPanel from '../components/user/UserWeatherPanel';
import UserReportPanel from '../components/user/UserReportPanel';
import ReportDetailsView from '../components/user/ReportDetailsView';
import ProfileDashboard from '../components/user/ProfileDashboard';
import { ChecklistsTab, LearnTab, ClimateNewsTab } from '../components/user/DashboardTabs';

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Overview: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Alerts: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Shelters: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Weather: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  Checklist: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="9 11 12 14 22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Learn: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  News: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M2 14h10M2 18h7M2 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Report: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  AllReports: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  External: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Profile: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Save: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
};

const NAV = [
  { id: 'overview', label: 'Overview', Icon: Icons.Overview },
  { id: 'alerts', label: 'Alerts', Icon: Icons.Alerts },
  { id: 'shelters', label: 'Shelters', Icon: Icons.Shelters },
  { id: 'weather', label: 'Weather', Icon: Icons.Weather },
  { id: 'checklists', label: 'Checklists', Icon: Icons.Checklist },
  { id: 'learn', label: 'Learn', Icon: Icons.Learn },
  { id: 'news', label: 'Climate News', Icon: Icons.News },
  { id: 'report', label: 'Report', Icon: Icons.Report },
  { id: 'all-reports', label: 'Feeds', Icon: Icons.AllReports },
  { id: 'profile', label: 'My Profile', Icon: Icons.Profile },
];

const CAT_COLORS = {
  flood: '#06b6d4', drought: '#eab308', cyclone: '#6366f1', landslide: '#a855f7',
  wildfire: '#f97316', tsunami: '#3b82f6', earthquake: '#ef4444',
  storm: '#22c55e', general: '#64748b',
};
const SEV_COLORS = { critical: '#ef4444', high: '#f97316', moderate: '#eab308', low: '#22c55e' };
const DIS_EMOJI = { flood: '🌊', earthquake: '🏚️', cyclone: '🌀', wildfire: '🔥', tsunami: '🌊', drought: '☀️', landslide: '⛰️', general: '📋' };

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, onNavClick, user, onLogout }) {
  return (
    <motion.aside
      initial={{ x: -72, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 top-0 h-full w-60 z-40 flex flex-col select-none shadow-2xl shadow-black/20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(180deg, #061f3f 0%, #041938 50%, #020f2b 100%)
        `,
        backgroundSize: '40px 40px, 40px 40px, 100% 100%',
        backgroundColor: '#020f2b',
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
        <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" fill="white" fillOpacity="0.95" />
            <circle cx="8" cy="6" r="1.5" fill="white" fillOpacity="0.75" />
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none">
            Climora <span className="text-cyan-400">User</span>
          </div>
          <div className="text-white/40 text-[10px] mt-0.5">Personal Dashboard</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onNavClick(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${active === id
                ? 'bg-white/15 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
          >
            <Icon />
            {label}
            {id === 'news' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
          </button>
        ))}
      </nav>

      {/* Bottom: user info + logout */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 mb-1">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Icons.User />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.username}</div>
            <div className="text-white/40 text-[10px] truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-150"
        >
          <Icons.Logout /> Sign Out
        </button>
      </div>
    </motion.aside>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Skeleton({ count = 4, h = 'h-12' }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${h} rounded-xl bg-gray-100 animate-pulse`} style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

function EmptyState({ emoji, text }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

function Panel({ title, action, actionLabel, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-gray-900 font-bold text-sm">{title}</h3>}
          {action && (
            <button onClick={action} className="text-blue-500 text-xs hover:text-blue-600 transition-colors font-semibold flex items-center gap-1">
              {actionLabel}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon: CardIcon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl border border-gray-100 bg-white p-5 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-default"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Subtle gradient top strip */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-70"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] -translate-y-8 translate-x-8 pointer-events-none"
        style={{ background: accent }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}12`, color: accent, border: `1.5px solid ${accent}20` }}>
          <CardIcon />
        </div>
        <div className="w-1.5 h-1.5 rounded-full mt-1.5 opacity-60" style={{ background: accent }} />
      </div>
      <div className="text-[28px] font-black leading-none mb-1" style={{ color: '#0f172a' }}>{value}</div>
      <div className="text-gray-500 text-xs font-medium">{label}</div>
      {sub && <div className="text-gray-400 text-[10px] mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ─── Alert Card ────────────────────────────────────────────────────────────────
function AlertCard({ alert, index, onClick }) {
  const color = SEV_COLORS[alert.severity?.toLowerCase()] || '#06b6d4';
  return (
    <motion.div
      onClick={() => onClick(alert)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="p-4 rounded-2xl border border-gray-200 bg-white hover:shadow-md cursor-pointer transition-all duration-200"
    >
      {/* Top Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-bold uppercase" style={{ color }}>
            {alert.severity}
          </span>
          <span className={`text-xs font-semibold ${
            alert.isActive ? "text-green-600" : "text-gray-400"
          }`}>
            {alert.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {alert.startAt ? new Date(alert.startAt).toLocaleString() : ''}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-gray-900">{alert.title}</h3>

      {/* Description */}
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.description}</p>

      {/* Location */}
      <div className="text-xs text-gray-400 mt-2">
        📍 {alert.area?.district}
        {alert.area?.cities?.length > 0 && (
          <> - {alert.area.cities.join(', ')}</>
        )}
      </div>
    </motion.div>
  );
}

// ─── Alert Details Modal ───────────────────────────────────────────────────────
function AlertDetails({ alert, onClose }) {
  if (!alert) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl p-6 w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          ← Back
        </button>

        {/* Severity badge */}
        {(() => {
          const color = SEV_COLORS[alert.severity?.toLowerCase()] || '#06b6d4';
          return (
            <span
              className="inline-block text-xs font-bold uppercase px-3 py-1 rounded-full mb-3"
              style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
            >
              {alert.severity}
            </span>
          );
        })()}

        <h2 className="text-lg font-bold text-gray-900 mb-1">{alert.title}</h2>

        <div className="text-xs text-gray-400 mb-4 flex items-center gap-2 flex-wrap">
          <span>📍 {alert.area?.district}</span>
          {alert.startAt && (
            <span>· {new Date(alert.startAt).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}</span>
          )}
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-5">{alert.description}</p>

        {alert.safetyInstructions?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-red-600 mb-2">⚠️ Safety Instructions</h4>
            <ul className="text-xs text-red-600 space-y-1.5">
              {alert.safetyInstructions.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Overview News Card ────────────────────────────────────────────────────────
function NewsCard({ article, index }) {
  const color = CAT_COLORS[article.climateCategory] || '#64748b';
  const age = Math.round((Date.now() - new Date(article.publishedAt)) / 3600000);
  const ageStr = age < 1 ? 'Just now' : age < 24 ? `${age}h ago` : `${Math.round(age / 24)}d ago`;

  // First card is featured (larger), rest are compact rows
  if (index === 0) {
    return (
      <motion.a
        href={article.link} target="_blank" rel="noreferrer"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0 }}
        className="group block rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 mb-3"
      >
        {/* Image */}
        <div className="relative h-36 overflow-hidden">
          {article.imageUrl
            ? <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: `${color}18` }}>
              {DIS_EMOJI[article.climateCategory] || '🌍'}
            </div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-white"
              style={{ background: `${color}dd` }}>
              {article.climateCategory}
            </span>
            {article.isSriLanka && (
              <span className="text-[9px] font-black text-white bg-emerald-500 px-2 py-1 rounded-full">🇱🇰</span>
            )}
          </div>
          {/* Title on image */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            <p className="text-white font-bold text-xs leading-snug line-clamp-2 drop-shadow">{article.title}</p>
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 bg-white">
          <span className="text-gray-400 text-[10px] truncate">{article.sourceName} · {ageStr}</span>
          <span className="text-[10px] font-bold flex items-center gap-0.5 flex-shrink-0 group-hover:gap-1 transition-all"
            style={{ color }}>
            Read <Icons.External />
          </span>
        </div>
      </motion.a>
    );
  }

  return (
    <motion.a
      href={article.link} target="_blank" rel="noreferrer"
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      className="flex gap-3 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group"
    >
      {/* Thumbnail */}
      <div className="w-12 h-10 rounded-lg overflow-hidden flex-shrink-0">
        {article.imageUrl
          ? <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-sm rounded-lg" style={{ background: `${color}15` }}>
            {DIS_EMOJI[article.climateCategory] || '🌍'}
          </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[8px] font-black uppercase tracking-widest" style={{ color }}>{article.climateCategory}</span>
          {article.isSriLanka && <span className="text-[9px]">🇱🇰</span>}
        </div>
        <p className="text-gray-800 text-[11px] font-semibold leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">{article.title}</p>
        <p className="text-gray-400 text-[9px] mt-0.5">{article.sourceName} · {ageStr}</p>
      </div>
      <span className="text-gray-300 self-center flex-shrink-0 group-hover:text-gray-500 transition-colors"><Icons.External /></span>
    </motion.a>
  );
}

// ─── Shelter Card ──────────────────────────────────────────────────────────────
function ShelterCard({ shelter, index }) {
  const pct = shelter.capacity ? Math.round(((shelter.currentOccupancy || 0) / shelter.capacity) * 100) : 0;
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : '#22c55e';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-gray-900 text-sm font-semibold">{shelter.name}</div>
          <div className="text-gray-400 text-xs mt-0.5">{shelter.district}{shelter.province ? `, ${shelter.province}` : ''}</div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize" style={{ color, background: `${color}12`, borderColor: `${color}30` }}>
          {pct >= 90 ? 'Full' : pct >= 70 ? 'Busy' : 'Open'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 mb-2">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{shelter.currentOccupancy || 0} / {shelter.capacity}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
    </motion.div>
  );
}

// ─── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, index }) {
  const color = CAT_COLORS[article.category] || '#64748b';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
      <Link to={`/articles/${article._id}`}
        className="flex gap-3 p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group">
        {article.imageUrl
          ? <img src={article.imageUrl} alt="" className="w-14 h-11 rounded-lg object-cover flex-shrink-0" />
          : <div className="w-14 h-11 rounded-lg flex-shrink-0 flex items-center justify-center text-xl" style={{ background: `${color}12` }}>
            {DIS_EMOJI[article.category] || '📄'}
          </div>
        }
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest capitalize" style={{ color }}>{article.category}</span>
          <div className="text-gray-800 text-xs font-semibold leading-snug line-clamp-2 mt-0.5 group-hover:text-blue-600 transition-colors">{article.title}</div>
          <div className="text-gray-400 text-[10px] mt-1">{article.author}</div>
        </div>
        {article.hasQuiz && <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full self-start flex-shrink-0 mt-0.5">Quiz</span>}
      </Link>
    </motion.div>
  );
}

// ─── ChecklistWidget ───────────────────────────────────────────────────────────
//
// BUG ROOT CAUSE (backend userChecklistController.js):
//   checklist.items.some((i) => i._id === itemId)
//   → Mongoose returns i._id as ObjectId object, itemId is a String from req.params
//   → Strict equality `===` always false → item "not found" → toggle silently fails
//   → Only originally-saved items (which had matching string IDs at creation time) worked
//
// FRONTEND FIX: Always convert item._id to String before sending AND comparing.
// This ensures the URL param /items/:itemId is always a plain string.
// The backend's `.find((m) => m.itemId === itemId)` then works because markedItems
// are stored with string itemId values from when they were first created.
//
function ChecklistWidget({ checklistId, title, disasterType }) {
  const [progress, setProgress] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [loadErr, setLoadErr] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(false);
    try {
      const res = await api.get(`/user-checklists/${checklistId}`);
      setProgress(res.data);
    } catch {
      setLoadErr(true);
    }
  }, [checklistId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (rawId) => {
    // ── KEY FIX ──────────────────────────────────────────────────────
    // Force String conversion of MongoDB ObjectId before using in URL.
    // Without this, newly-added items (whose _id hasn't been stringified
    // by React state yet) fail the backend's strict === comparison.
    const itemId = String(rawId);
    // ─────────────────────────────────────────────────────────────────

    if (toggling) return; // block concurrent toggles
    setToggling(itemId);

    // Optimistic UI — flip locally using string comparison
    setProgress(prev => prev ? {
      ...prev,
      items: prev.items.map(item =>
        String(item._id) === itemId ? { ...item, isChecked: !item.isChecked } : item
      ),
    } : prev);

    try {
      await api.patch(`/user-checklists/${checklistId}/items/${itemId}/toggle`);
      await load(); // sync real server state (progress % etc.)
    } catch {
      await load(); // revert on any error
    }
    setToggling(null);
  };

  const items = progress?.items || [];
  const total = progress?.progress?.total ?? items.length;
  const checked = progress?.progress?.checked ?? items.filter(i => i.isChecked).length;
  const pct = total > 0 ? (progress?.progress?.percentage ?? Math.round((checked / total) * 100)) : 0;
  const done = progress?.progress?.isComplete || false;

  const accentColor = done ? '#22c55e' : '#3b82f6';

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden transition-all duration-300 ${done ? 'border-green-200 shadow-green-100/60' : 'border-gray-200'}`}
      style={{ boxShadow: done ? '0 2px 12px rgba(34,197,94,0.10)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Colored top bar */}
      <div className="h-[3px]" style={{ background: done ? 'linear-gradient(90deg,#22c55e,#86efac)' : 'linear-gradient(90deg,#3b82f6,#06b6d4)' }} />
      {/* Header */}
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: `${accentColor}12`, border: `1.5px solid ${accentColor}20` }}>
              {DIS_EMOJI[disasterType] || '📋'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-gray-900 font-bold text-sm leading-tight truncate">{title}</h4>
                {done && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
                    ✓ Complete
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-[11px] mt-0.5 capitalize">{disasterType} Preparedness</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <span className="text-2xl font-black leading-none" style={{ color: accentColor }}>
              {pct}<span className="text-xs font-semibold text-gray-400">%</span>
            </span>
            <div className="text-gray-400 text-[10px] mt-0.5 whitespace-nowrap">{checked}/{total} done</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-gray-100">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: done ? 'linear-gradient(90deg,#22c55e,#86efac)' : 'linear-gradient(90deg,#3b82f6,#06b6d4)' }}
          />
        </div>
      </div>

      {/* Items list */}
      <div className="px-3 pb-4">
        {/* Loading skeleton */}
        {!progress && !loadErr && (
          <div className="space-y-1.5 px-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        )}

        {/* Error */}
        {loadErr && (
          <div className="text-center py-5">
            <p className="text-gray-400 text-xs mb-2">Failed to load checklist</p>
            <button onClick={load} className="text-blue-500 text-xs hover:text-blue-600 transition-colors font-medium">Retry →</button>
          </div>
        )}

        {/* Empty */}
        {progress && items.length === 0 && (
          <p className="text-gray-400 text-xs text-center py-4">No items in this checklist yet.</p>
        )}

        {/* Item buttons */}
        {progress && items.length > 0 && (
          <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar px-1">
            {items.map((item) => {
              const itemId = String(item._id);
              const isThis = toggling === itemId;
              const isChecked = item.isChecked;
              const isDisabled = !!toggling;

              return (
                <button
                  key={itemId}
                  onClick={() => handleToggle(itemId)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left select-none transition-all duration-150
                    ${isThis ? 'opacity-50 cursor-wait' : ''}
                    ${isDisabled && !isThis ? 'cursor-not-allowed' : ''}
                    ${!isDisabled ? (isChecked ? 'hover:bg-green-50/60' : 'hover:bg-gray-50') : ''}
                    ${isChecked && !isThis ? 'bg-green-50/40' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <span className={`
                    w-[18px] h-[18px] rounded-[5px] flex-shrink-0 border-[1.5px]
                    flex items-center justify-center transition-all duration-200
                    ${isThis ? 'border-blue-400 bg-blue-50 animate-pulse' : ''}
                    ${isChecked && !isThis ? 'bg-blue-500 border-blue-500 shadow-sm' : ''}
                    ${!isChecked && !isThis ? 'border-gray-300 hover:border-blue-400' : ''}
                  `}>
                    {isChecked && !isThis && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5 5 3.8 7.5 8.5 2.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>

                  {/* Name */}
                  <span className={`text-[13px] flex-1 transition-colors font-medium ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.itemName}
                    {item.quantity > 1 && (
                      <span className={`ml-1.5 text-[11px] font-normal ${isChecked ? 'text-gray-300' : 'text-gray-400'}`}>×{item.quantity}</span>
                    )}
                  </span>

                  {/* Category badge */}
                  {item.category && item.category !== 'other' && (
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 font-semibold transition-colors ${isChecked ? 'text-gray-300 bg-gray-100' : 'text-gray-500 bg-gray-100 border border-gray-200'
                      }`}>
                      {item.category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: reportId } = useParams();
  const isReportDetails = location.pathname.startsWith('/reports/');

  const queryParams = new URLSearchParams(location.search);
  const initialActive = queryParams.get('tab') ? 'report' : (location.state?.activeTab || 'overview');
  const [active, setActive] = useState(initialActive);
  const [data, setData] = useState({ news: [], checklistTemplates: [], articles: [], shelters: [], myReportsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [alertPage, setAlertPage]         = useState(1);
  const [alertTotalPages, setAlertTotalPages] = useState(1);
  const [alertTotalRecords, setAlertTotalRecords] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [viewMode, setViewMode] = useState("MY"); // MY | ALL

  const handleAlertClick = (alert) => { setSelectedAlert(alert); };
  const [nearbyShelters, setNearbyShelters] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");
  const [userLocation, setUserLocation] = useState(user?.location?.lat ? user.location : null);
  const [notifications, setNotifications] = useState(Array.isArray(user?.notifications) ? user.notifications : []);

  // Called by ProfilePanel after a successful save — instantly refreshes the topbar name
  const [topbarName, setTopbarName] = useState(user?.username || '');

  const onUserUpdate = useCallback((updated) => {
    if (updated?.username) setTopbarName(updated.username);
    if (updated?.location?.lat && updated.location?.lon) {
      setUserLocation(updated.location);
    }
  }, []);

  useEffect(() => {
    if (user?.location?.lat && user?.location?.lon) {
      setUserLocation(user.location);
    }
  }, [user?.location?.lat, user?.location?.lon]);

  useEffect(() => {
    let cancelled = false;
    const fetchProfileNotifications = async () => {
      if (!user) return;
      setNotifications(Array.isArray(user.notifications) ? user.notifications : []);
      try {
        const res = await api.get('/auth/profile');
        if (!cancelled) {
          setNotifications(Array.isArray(res.data.user?.notifications) ? res.data.user.notifications : []);
        }
      } catch (err) {
        console.warn('Profile notifications fetch failed:', err?.response?.data || err.message);
      }
    };
    fetchProfileNotifications();

    const fetchNearbyShelters = async () => {
      if (!userLocation?.lat || !userLocation?.lon) {
        setNearbyShelters([]);
        setNearbyError("");
        return;
      }

      setNearbyLoading(true);
      setNearbyError("");

      try {
        const res = await api.get(
          `/shelters/nearby?lat=${encodeURIComponent(userLocation.lat)}&lng=${encodeURIComponent(userLocation.lon)}&limit=5`
        );
        if (!cancelled) {
          setNearbyShelters(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setNearbyShelters([]);
          setNearbyError("Unable to load nearby shelters. Please check your location or try again later.");
        }
      } finally {
        if (!cancelled) {
          setNearbyLoading(false);
        }
      }
    };

    fetchNearbyShelters();
    return () => { cancelled = true; };
  }, [userLocation?.lat, userLocation?.lon]);

  // Keep topbarName in sync if user context changes (e.g. first load)
  useEffect(() => { if (user?.username) setTopbarName(user.username); }, [user]);

  // Real-time alert updates via Socket.io
  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 [SOCKET] Connected:", socket.id);
    });

    socket.on("alertCreated", (data) => {
      console.log("📩 [SOCKET] alertCreated received:", data.title);
      setAlerts((prev) => [data, ...prev]);
    });

    socket.on("alertUpdated", (data) => {
      console.log("🔄 [SOCKET] alertUpdated received:", data.title);
      setAlerts((prev) =>
        prev.map((a) => (a._id === data._id ? data : a))
      );
    });

    socket.on("alertDeleted", (id) => {
      console.log("❌ [SOCKET] alertDeleted received:", id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    });

    socket.on("testEvent", (data) => {
      console.log("🧪 [SOCKET] testEvent received:", data);
    });

    return () => {
      socket.off("connect");
      socket.off("alertCreated");
      socket.off("alertUpdated");
      socket.off("alertDeleted");
      socket.off("testEvent");
    };
  }, []);

  const fetchMyAlerts = async (page = 1) => {
    try {
      const res = await api.get('/alerts/my', { params: { page, limit: 12 } });
      return res.data;
    } catch (err) {
      console.error(err);
      return { data: [], pagination: { totalPages: 1 } };
    }
  };

  // Fetch admin-created active alerts for this user's district
  useEffect(() => {
    const loadAlerts = async () => {
      setLoadingAlerts(true);
      setAlerts([]);

      try {
        let result = { data: [], pagination: { totalPages: 1 } };

        if (viewMode === "MY") {
          const params = {
            page: alertPage,
            limit: 12
          };

          if (statusFilter !== "ALL") {
            params.isActive = (statusFilter === "ACTIVE").toString();
          }

          if (severityFilter !== "ALL") params.severity = severityFilter;
          if (searchTerm) params.search = searchTerm;

          console.log("🔥 MY AREA PARAMS:", params);

          const res = await api.get('/alerts/my', { params });
          result = res.data;

        } else {
          const params = {
            page: alertPage,
            limit: 12
          };

          if (statusFilter !== "ALL") {
            params.isActive = (statusFilter === "ACTIVE").toString();
          }

          if (severityFilter !== "ALL") params.severity = severityFilter;
          if (searchTerm) params.search = searchTerm;

          console.log("🔥 ALL ALERTS PARAMS:", params);


          const res = await api.get('/alerts', { params });
          result = res.data;
        }

        console.log("📦 API RESPONSE:", result.data);

        setAlerts(result.data || []);
        setAlertTotalPages(result.pagination?.totalPages || 1);
        setAlertTotalRecords(result.pagination?.totalRecords || 0);

      } catch (err) {
        console.error("Failed to fetch alerts", err);
        setAlerts([]);
        setAlertTotalPages(1);
        setAlertTotalRecords(0);
      } finally {
        setLoadingAlerts(false);
      }
    };
    loadAlerts();
  }, [viewMode, searchTerm, alertPage, statusFilter, severityFilter]);

  // Reset page when filters change
  useEffect(() => {
    setAlertPage(1);
  }, [viewMode, searchTerm, severityFilter, statusFilter]);

  useEffect(() => {
    (async () => {
      const [worldNews, lkNews, checklists, articles, shelters, myReports] = await Promise.allSettled([
        api.get('/climate-news?limit=20&type=all'),
        api.get('/climate-news?limit=10&type=sri-lanka'),
        api.get('/checklists'),
        api.get('/articles?limit=8'),
        api.get('/shelters?limit=8'),
        api.get('/reports/my'),
      ]);

      // Merge world + Sri Lanka news, deduplicate by articleId, sort by date
      const worldList = worldNews.value?.data?.news || [];
      const lkList = lkNews.value?.data?.news || [];
      const seen = new Set();
      const merged = [...lkList, ...worldList].filter(n => {
        const key = n.articleId || n._id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      const reportsArray = Array.isArray(myReports.value?.data) ? myReports.value.data : [];

      console.log("DEBUG: My Reports Data:", reportsArray);
      console.log("DEBUG: Current User:", user);

      // Robust filtering count
      const currentUserId = user?.userId || user?._id;
      const filteredCount = reportsArray.filter(r => {
        const rUser = r.userId || r.createdBy || r.user?._id || r.user;
        if (!rUser || !currentUserId) return false;
        return rUser.toString() === currentUserId.toString();
      }).length;

      setData({
        news: merged,
        checklistTemplates: checklists.value?.data?.checklists || [],
        articles: articles.value?.data?.articles || [],
        shelters: shelters.value?.data?.shelters || [],
        myReportsCount: filteredCount,
      });
      setLoading(false);
    })();
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; };

  /**
   * Sidebar nav handler — if currently viewing a report detail page (/reports/:id),
   * navigate back to /dashboard first so isReportDetails becomes false,
   * then set the active tab. Without this, setActive() updates state but the
   * isReportDetails guard keeps rendering <ReportDetailsView />, making sidebar
   * clicks appear broken.
   */
  const handleNavClick = useCallback((tabId) => {
    setActive(tabId);
    if (isReportDetails) {
      navigate('/dashboard', { replace: true });
    }
  }, [isReportDetails, navigate]);

  const filteredAlerts = alerts;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar active={active} onNavClick={handleNavClick} user={user} onLogout={handleLogout} />

      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-gray-900 font-black text-lg">{greeting()}, {topbarName} 👋</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-50 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 text-xs font-semibold">Live</span>
          </div>
        </div>

        {/* Page content */}
        <div className="px-8 py-7">
          {isReportDetails ? (
            <ReportDetailsView />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >

                {/* OVERVIEW */}
                {active === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                      <StatCard
                        label="Active Alerts"
                        value={
                          loadingAlerts
                            ? '—'
                            : alerts.filter(alert => alert.isActive === true).length
                        }
                        icon={Icons.Alerts}
                        accent="#ef4444"
                      />
                      <StatCard label="Nearby Shelters" value={nearbyLoading ? '—' : nearbyShelters.length} icon={Icons.Shelters} accent="#06b6d4" delay={0.07} />
                      <StatCard label="Checklists" value={loading ? '—' : data.checklistTemplates.length} icon={Icons.Checklist} accent="#22c55e" delay={0.14} sub="preparedness kits" />
                      <StatCard label="Articles" value={loading ? '—' : data.articles.length} icon={Icons.Learn} accent="#a855f7" delay={0.21} sub="learn & prepare" />
                      <StatCard label="My Reports" value={loading ? '—' : data.myReportsCount} icon={Icons.Report} accent="#6366f1" delay={0.28} />
              {active === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard 
                      label="Active Alerts"     
                      value={
                        loadingAlerts 
                          ? '—' 
                          : alertTotalRecords
                      }
                      icon={Icons.Alerts}    
                      accent="#ef4444" 
                    />
                    <StatCard label="Nearby Shelters"   value={nearbyLoading ? '—' : nearbyShelters.length}  icon={Icons.Shelters}  accent="#06b6d4" delay={0.07} />
                    <StatCard label="Checklists"        value={loading ? '—' : data.checklistTemplates.length} icon={Icons.Checklist} accent="#22c55e" delay={0.14} sub="preparedness kits" />
                    <StatCard label="Articles"          value={loading ? '—' : data.articles.length}           icon={Icons.Learn}     accent="#a855f7" delay={0.21} sub="learn & prepare" />
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-5 mt-5"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                        <p className="text-gray-400 text-xs mt-0.5">Recent shelter updates sent to you.</p>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                        {notifications.length} message{notifications.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 mt-5"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                          <p className="text-gray-400 text-xs mt-0.5">Recent shelter updates sent to you.</p>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                          {notifications.length} message{notifications.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4">
                          <span className="text-2xl">🔔</span>
                          <p className="text-sm text-gray-400">No notifications yet. Shelter updates will appear here.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {[...notifications]
                            .sort((a, b) => {
                              if (a.priority !== b.priority) return a.priority ? -1 : 1;
                              return new Date(b.createdAt) - new Date(a.createdAt);
                            })
                            .slice(0, 3)
                            .map((note, idx) => (
                              <div
                                key={`${note.shelterId}-${note.createdAt}-${idx}`}
                                className={`rounded-xl border p-4 ${note.warning ? 'border-red-200 bg-red-50/60' : 'border-gray-100 bg-gray-50/60'}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 leading-snug">{note.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{note.shelterName || note.shelterId}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {note.warning && (
                                      <span className="text-[10px] font-bold uppercase text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">Warning</span>
                                    )}
                                    {!note.warning && note.type === 'assistance' && (
                                      <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Help needed</span>
                                    )}
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${note.read ? 'text-gray-400 bg-gray-100' : 'text-emerald-600 bg-emerald-50 border border-emerald-200'}`}>
                                      {note.read ? 'Read' : 'New'}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{note.message}</p>
                                {note.createdAt && (
                                  <p className="text-[10px] text-gray-400 mt-2">{new Date(note.createdAt).toLocaleString()}</p>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 mt-5"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Nearest Shelters</h3>
                          <p className="text-gray-400 text-xs mt-0.5">Quick view of shelters closest to your location.</p>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                          {nearbyLoading ? 'Loading…' : `${nearbyShelters.length} found`}
                        </span>
                      </div>

                      {nearbyLoading ? (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-blue-100 bg-blue-50/60 px-4 py-4">
                          <span className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
                          <span className="text-sm text-blue-600">Fetching nearby shelters…</span>
                        </div>
                      ) : !userLocation?.lat ? (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4">
                          <span className="text-xl">📍</span>
                          <p className="text-sm text-gray-400">Allow live location on login to see nearby shelters.</p>
                        </div>
                      ) : nearbyShelters.length === 0 ? (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4">
                          <span className="text-xl">🏠</span>
                          <p className="text-sm text-gray-400">No nearby shelters found for your location.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {nearbyShelters.slice(0, 4).map((shelter) => {
                            const occ = shelter.capacityCurrent ?? 0;
                            const cap = shelter.capacityTotal ?? 0;
                            const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
                            const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : '#22c55e';
                            return (
                              <div key={shelter.shelterId} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200">
                                <div className="flex items-start justify-between gap-2 mb-2.5">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{shelter.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{shelter.district}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="text-xs font-bold text-gray-700">{shelter.distanceKm != null ? `${shelter.distanceKm.toFixed(1)} km` : '—'}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">{shelter.travelTimeMin != null ? `~${shelter.travelTimeMin} min` : ''}</div>
                                  </div>
                                </div>
                                {cap > 0 && (
                                  <>
                                    <div className="h-1.5 rounded-full bg-gray-200 mb-1.5">
                                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                      <span>{occ} / {cap} occupied</span>
                                      <span style={{ color: barColor }} className="font-semibold">{pct}%</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
                      <Panel title="Active Alerts" action={() => setActive('alerts')} actionLabel="View all →">
                        {loadingAlerts ? <Skeleton count={4} h="h-14" /> : alerts.length === 0
                          ? <EmptyState emoji="🌤️" text="No active alerts in your area." />
                          : <div className="space-y-2">{alerts.slice(0, 5).map((a, i) => <AlertCard key={a._id || i} alert={a} index={i} />)}</div>
                        }
                      </Panel>
                      <Panel title="Climate News" action={() => navigate('/climate-news')} actionLabel="Full News Page →">
                        {loading ? <Skeleton count={4} h="h-14" /> : data.news.length === 0
                          ? <EmptyState emoji="📡" text="No climate news right now." />
                          : (
                            <div>
                              {/* Featured first article */}
                              {data.news.slice(0, 1).map((n, i) => <NewsCard key={i} article={n} index={0} />)}
                              {/* Compact list for rest */}
                              <div className="space-y-1">
                                {data.news.slice(1, 5).map((n, i) => <NewsCard key={i + 1} article={n} index={i + 1} />)}
                              </div>
                              {/* View all link */}
                              <button
                                onClick={() => navigate('/climate-news')}
                                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-gray-400 text-[10px] font-semibold hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-200"
                              >
                                View all climate news <Icons.External />
                              </button>
                            </div>
                          )
                        }
                      </Panel>
                    </div>

                    {!loading && data.checklistTemplates.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-gray-900 font-bold text-sm">Preparedness Checklists</h3>
                            <p className="text-gray-400 text-xs mt-0.5">Track your emergency kit readiness</p>
                          </div>
                          <button onClick={() => setActive('checklists')} className="text-blue-500 text-xs hover:text-blue-600 transition-colors font-semibold flex items-center gap-1">
                            View all <Icons.External />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {data.checklistTemplates.slice(0, 2).map(cl => (
                            <ChecklistWidget key={cl._id} checklistId={cl._id} title={cl.title} disasterType={cl.disasterType} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ALERTS */}
                {/* ALERTS */}
                {active === 'alerts' && (
                  selectedAlert ? (
                    <div className="space-y-5">
                      {/* Back */}
                      <button
                        onClick={() => setSelectedAlert(null)}
                        className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        ← Back to Alerts
                      </button>

                      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
                        {/* LEFT */}
                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                          <span className="text-xs font-bold text-red-600 px-3 py-1 bg-red-50 rounded-full lowercase tracking-wider">
                            {selectedAlert.severity}
                          </span>

                          <h2 className="text-xl font-bold mt-3">
                            {selectedAlert.title}
                          </h2>

                          <div className="text-sm text-gray-500 mt-2">
                            📍 {selectedAlert.area?.district} · {new Date(selectedAlert.startAt).toLocaleString()}
                          </div>

                          <h3 className="text-sm font-bold mt-5 mb-2 text-gray-800">Description</h3>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {selectedAlert.description}
                          </p>

                          {/* Safety */}
                          {selectedAlert.safetyInstructions?.length > 0 && (
                            <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
                              <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-1.5">
                                ⚠️ Safety Instructions
                              </h4>
                              <ul className="text-sm text-red-600 space-y-1.5">
                                {selectedAlert.safetyInstructions.map((item, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* RIGHT */}
                        <div className="space-y-4">
                          {/* Affected Areas */}
                          <div className="rounded-2xl border bg-white p-5 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">Affected Areas</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedAlert.area?.cities?.length > 0 ? (
                                selectedAlert.area.cities.map((city, i) => (
                                  <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600 font-medium shadow-sm">
                                    {city}
                                  </span>
                                ))
                              ) : (
                                <p className="text-xs text-gray-400">None specified</p>
                              )}
                      {/* Severity */}
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>

                      {/* Status */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ALL">All</option>
                      </select>
                    </div>

                    {loadingAlerts ? (
                      <Skeleton count={6} />
                    ) : filteredAlerts.length === 0 ? (
                      <EmptyState emoji="✅" text="No active alerts match your search." />
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {filteredAlerts.map((alert, index) => (
                            <div
                              key={alert._id}
                              onClick={() => handleAlertClick(alert)}
                              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col"
                            >
                              {/* Top */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                    alert.severity === 'CRITICAL'
                                      ? 'bg-red-100 text-red-600 border border-red-200'
                                      : alert.severity === 'HIGH'
                                      ? 'bg-orange-100 text-orange-600 border border-orange-200'
                                      : 'bg-yellow-100 text-yellow-600 border border-yellow-200'
                                  }`}>
                                    {alert.severity || 'INFO'}
                                  </span>
                                  <span className={`text-xs font-semibold ${
                                    alert.isActive ? "text-green-600" : "text-gray-400"
                                  }`}>
                                    {alert.isActive ? "Active" : "Inactive"} 
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">
                                  {alert.startAt ? new Date(alert.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                                </span>
                              </div>

                              {/* Title */}
                              <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                                {alert.title}
                              </h3>

                              {/* Description */}
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
                                {alert.description}
                              </p>

                              {/* Location */}
                              <div className="text-xs text-gray-400 mt-3 flex items-center gap-1.5 pt-3 border-t border-gray-100">
                                <span className="text-[10px]">📍</span> {alert.area?.district || 'Sri Lanka'}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination Controls */}
                        {alertTotalPages > 1 && (
                          <div className="flex items-center justify-center gap-4 mt-6">
                            <button
                              disabled={alertPage <= 1}
                              onClick={() => setAlertPage(p => Math.max(1, p - 1))}
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition 
                                ${alertPage <= 1 
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700'}
                              `}
                            >
                              Prev
                            </button>

                            <span className="text-sm font-medium text-gray-600">
                              Page {alertPage} of {alertTotalPages}
                            </span>

                            <button
                              disabled={alertPage >= alertTotalPages}
                              onClick={() => setAlertPage(p => Math.min(alertTotalPages, p + 1))}
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition 
                                ${alertPage >= alertTotalPages 
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700'}
                              `}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}

              {/* SHELTERS */}
              {active === 'shelters' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-gray-900 font-black text-xl mb-5">Emergency Shelters</h2>

                          {/* Map */}
                          <div className="rounded-2xl border bg-white p-5 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">Location Map</h4>
                            {selectedAlert.locations?.length > 0 ? (
                              <MapContainer
                                center={[selectedAlert.locations[0].lat, selectedAlert.locations[0].lng]}
                                zoom={10}
                                scrollWheelZoom={false}
                                style={{ height: "220px", borderRadius: "12px", zIndex: 0 }}
                              >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {selectedAlert.locations.map((loc, i) => (
                                  <Marker key={i} position={[loc.lat, loc.lng]} />
                                ))}
                              </MapContainer>
                            ) : (
                              <div className="h-[220px] rounded-xl flex items-center justify-center bg-gray-50 border border-dashed border-gray-200">
                                <p className="text-xs text-gray-400">No map data available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <h2 className="text-gray-900 font-black text-xl">Emergency Alerts</h2>

                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => setViewMode("MY")}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${viewMode === "MY" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                        >
                          My Area
                        </button>
                        <button
                          onClick={() => setViewMode("ALL")}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${viewMode === "ALL" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                        >
                          All Alerts
                        </button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3 mb-4">
                        {/* Search */}
                        <input
                          type="text"
                          placeholder="Search alerts by title or location..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Severity */}
                        <select
                          value={severityFilter}
                          onChange={(e) => setSeverityFilter(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ALL">All Severities</option>
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>

                        {/* Status */}
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ALL">All Status</option>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>

                      {loadingAlerts ? (
                        <Skeleton count={6} />
                      ) : filteredAlerts.length === 0 ? (
                        <EmptyState emoji="✅" text="No active alerts match your search." />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {filteredAlerts.map((alert, index) => (
                            <div
                              key={alert._id}
                              onClick={() => handleAlertClick(alert)}
                              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col"
                            >
                              {/* Top */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${alert.severity === 'CRITICAL'
                                      ? 'bg-red-100 text-red-600 border border-red-200'
                                      : alert.severity === 'HIGH'
                                        ? 'bg-orange-100 text-orange-600 border border-orange-200'
                                        : 'bg-yellow-100 text-yellow-600 border border-yellow-200'
                                    }`}>
                                    {alert.severity || 'INFO'}
                                  </span>
                                  <span className={`text-xs font-semibold ${alert.isActive ? "text-green-600" : "text-gray-400"
                                    }`}>
                                    {alert.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">
                                  {alert.startAt ? new Date(alert.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                                </span>
                              </div>

                              {/* Title */}
                              <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                                {alert.title}
                              </h3>

                              {/* Description */}
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
                                {alert.description}
                              </p>

                              {/* Location */}
                              <div className="text-xs text-gray-400 mt-3 flex items-center gap-1.5 pt-3 border-t border-gray-100">
                                <span className="text-[10px]">📍</span> {alert.area?.district || 'Sri Lanka'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* SHELTERS */}
                {active === 'shelters' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-gray-900 font-black text-xl mb-5">Emergency Shelters</h2>

                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm mb-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Nearest shelters</h3>
                            <p className="text-gray-500 text-xs mt-1">Based on your saved profile location.</p>
                          </div>
                          <span className="text-xs text-gray-500">{nearbyLoading ? 'Loading…' : `${nearbyShelters.length} shown`}</span>
                        </div>

                        {nearbyLoading ? (
                          <div className="rounded-xl border border-dashed border-blue-100 bg-blue-50 px-4 py-5 text-center text-sm text-blue-700">
                            Fetching nearby shelters…
                          </div>
                        ) : nearbyError ? (
                          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
                            {nearbyError}
                          </div>
                        ) : !userLocation?.lat ? (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                            Set your profile location first to see nearby emergency shelters.
                          </div>
                        ) : nearbyShelters.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                            No nearby shelters were found for your profile location.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {nearbyShelters.map((shelter, i) => (
                              <div key={shelter.shelterId} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{shelter.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{shelter.district}</p>
                                  </div>
                                  <div className="text-right text-xs text-gray-500">
                                    <div>{shelter.distanceKm != null ? `${shelter.distanceKm.toFixed(1)} km` : 'Distance unknown'}</div>
                                    <div className="mt-1">{shelter.travelTimeMin != null ? `${shelter.travelTimeMin} min` : 'Travel time unknown'}</div>
                                  </div>
                                </div>
                                <div className="text-[11px] text-gray-600">
                                  Capacity: {shelter.capacityTotal ?? 'N/A'} · Occupied: {shelter.capacityCurrent ?? 'N/A'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {loading ? <Skeleton count={4} h="h-24" /> : data.shelters.length === 0
                        ? <EmptyState emoji="🏠" text="No shelter data available." />
                        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {data.shelters.map((s, i) => <ShelterCard key={i} shelter={s} index={i} />)}
                        </div>
                      }
                    </div>
                  </div>
                )}

                {/* WEATHER */}
                {active === 'weather' && (
                  <UserWeatherPanel />
                )}

                {/* CHECKLISTS */}
                {active === 'checklists' && (
                  <ChecklistsTab loading={loading} checklistTemplates={data.checklistTemplates} />
                )}

                {/* LEARN */}
                {active === 'learn' && (
                  <LearnTab loading={loading} articles={data.articles} navigate={navigate} />
                )}

                {/* NEWS */}
                {active === 'news' && (
                  <ClimateNewsTab loading={loading} news={data.news} navigate={navigate} />
                )}

                {/* REPORT */}
                {active === 'report' && (
                  <UserReportPanel />
                )}

                {/* ALL REPORTS */}
                {active === 'all-reports' && (
                  <UserReportPanel defaultTab="all" hideTabs />
                )}

                {/* PROFILE */}
                {active === 'profile' && (
                  <ProfileDashboard user={user} onUserUpdate={onUserUpdate} />
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

    </div>
  );
}