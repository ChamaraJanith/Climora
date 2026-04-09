import { ShieldAlert, AlertTriangle, Info, BellRing, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALERT_THEMES = {
  CRITICAL: {
    bg: 'bg-gradient-to-r from-red-50 to-rose-50',
    border: 'border-red-200',
    leftBar: 'bg-red-500',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    titleText: 'text-red-900',
    severityBadge: 'bg-red-100 text-red-700 border border-red-200',
    icon: AlertTriangle,
  },
  HIGH: {
    bg: 'bg-gradient-to-r from-red-50/70 to-orange-50',
    border: 'border-orange-300',
    leftBar: 'bg-red-500',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    titleText: 'text-red-900',
    severityBadge: 'bg-red-100 text-red-700 border border-red-200',
    icon: BellRing,
  },
  MEDIUM: {
    bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    leftBar: 'bg-yellow-500',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    titleText: 'text-amber-900',
    severityBadge: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    icon: ShieldAlert,
  },
  LOW: {
    bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    leftBar: 'bg-blue-500',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    titleText: 'text-blue-900',
    severityBadge: 'bg-blue-100 text-blue-700 border border-blue-200',
    icon: Info,
  }
};

const DEFAULT_THEME = ALERT_THEMES.MEDIUM;

const formatAlertTime = (ts) => {
  if (!ts) return null;

  let date;

  // Already a Date object
  if (ts instanceof Date) {
    date = ts;
  }
  // ISO string (DB alerts: "2026-04-09T10:30:00Z")
  else if (typeof ts === 'string') {
    date = new Date(ts);
  }
  // Epoch number — seconds (< 1e10) or milliseconds (>= 1e10)
  else if (typeof ts === 'number') {
    const ms = ts > 1e10 ? ts : ts * 1000;
    date = new Date(ms);
  }

  // Guard against invalid dates
  if (!date || isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-LK', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const AlertsPanel = ({ alerts, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 animate-pulse shadow-sm" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border border-emerald-100 shadow-sm flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-500 flex-shrink-0 shadow-inner">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">No active alerts for this location</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">There are no severe weather warnings or system alerts currently active. The region appears clear.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert, i) => {
          const severityKey = alert.severity?.toUpperCase();
          const theme = ALERT_THEMES[severityKey] || DEFAULT_THEME;
          const Icon = theme.icon;
          const isExternal = alert.source === 'external';
          const startTime = formatAlertTime(alert.startAt || alert.start);
          const endTime = formatAlertTime(alert.endAt || alert.end);

          return (
            <motion.div
              key={alert._id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, delay: i * 0.04 }}
              className={`${theme.bg} rounded-2xl border ${theme.border} shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group`}
            >
              {/* Left severity color bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.leftBar}`} />

              <div className="flex items-start gap-4 pl-5 pr-5 py-5">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl ${theme.iconBg} flex items-center justify-center ${theme.iconText} flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  <Icon size={19} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Top Row: title + badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2.5">
                    <p className={`text-[15px] font-bold ${theme.titleText} leading-snug`}>{alert.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {/* Severity badge */}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${theme.severityBadge}`}>
                        {alert.severity || 'INFO'}
                      </span>
                      {/* Source badge */}
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg flex-shrink-0 ${
                        isExternal
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}>
                        {isExternal ? '🌐 Gov Alert' : '🛡 System Alert'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 leading-relaxed opacity-90 line-clamp-3">{alert.description}</p>

                  {/* Footer row: location + times */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-black/5">
                    {(alert.area?.district || alert.location) && (
                      <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold">
                        <MapPin size={11} className="text-gray-400" />
                        {alert.area?.district || alert.location}
                      </span>
                    )}
                    {startTime && (
                      <span className="bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-black/5 text-[10px] font-semibold text-gray-600 shadow-sm">
                        <span className="text-gray-400 text-[9px] uppercase font-bold mr-1">Issued:</span>
                        {startTime}
                      </span>
                    )}
                    {endTime && (
                      <span className="bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-black/5 text-[10px] font-semibold text-gray-600 shadow-sm">
                        <span className="text-gray-400 text-[9px] uppercase font-bold mr-1">Expires:</span>
                        {endTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AlertsPanel;
