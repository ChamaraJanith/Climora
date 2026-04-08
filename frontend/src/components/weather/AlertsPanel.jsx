import { ShieldAlert, AlertTriangle, Info, BellRing } from 'lucide-react';

const ALERT_THEMES = {
  CRITICAL: {
    bg: 'bg-gradient-to-r from-red-50 to-rose-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    title: 'text-red-900',
    badge: 'bg-red-500',
    icon: AlertTriangle
  },
  HIGH: {
    bg: 'bg-gradient-to-r from-orange-50 to-amber-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
    title: 'text-orange-900',
    badge: 'bg-orange-500',
    icon: BellRing
  },
  MEDIUM: {
    bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    title: 'text-amber-900',
    badge: 'bg-amber-500',
    icon: ShieldAlert
  },
  LOW: {
    bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    title: 'text-blue-900',
    badge: 'bg-blue-500',
    icon: Info
  }
};

const AlertsPanel = ({ alerts, loading }) => {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 animate-pulse space-y-4 shadow-sm">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 flex-shrink-0 shadow-inner">
          <ShieldAlert size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">No active weather alerts</p>
          <p className="text-xs text-gray-500 mt-1">There are no severe weather warnings or system alerts currently active for this location.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert, i) => {
        const theme = ALERT_THEMES[alert.severity] || ALERT_THEMES.MEDIUM;
        const Icon = theme.icon;
        
        const isExternal = alert.source === 'external';
        const badgeLabel = isExternal ? 'Government Alert' : 'System Alert';

        return (
          <div
            key={i}
            className={`${theme.bg} rounded-2xl p-5 border ${theme.border} shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group`}
          >
            {/* Active animation border left */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.badge} opacity-80 shadow-md`} />

            <div className="flex items-start gap-4 pl-2">
              <div className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center ${theme.iconText} flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <p className={`text-base font-bold ${theme.title} leading-tight`}>{alert.title}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${isExternal ? 'bg-black/10 text-gray-700' : 'bg-white/60 text-blue-800 border border-blue-200 shadow-sm'} flex-shrink-0 self-start`}>
                    {badgeLabel}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mt-2.5 leading-relaxed opacity-90">{alert.description}</p>
                
                <div className="flex flex-wrap gap-2 mt-4 text-[10px] text-gray-500 font-medium tracking-wide">
                  {alert.start && (
                    <span className="bg-white/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-black/5 shadow-sm flex items-center gap-1.5">
                      <span className="uppercase text-[9px] font-bold text-gray-500">Issued:</span>
                      <span className="text-gray-800 font-semibold">
                        {new Date(alert.start * 1000).toLocaleString('en-LK', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </span>
                  )}
                  {alert.end && (
                    <span className="bg-white/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-black/5 shadow-sm flex items-center gap-1.5">
                      <span className="uppercase text-[9px] font-bold text-gray-500">Expires:</span>
                      <span className="text-gray-800 font-semibold">
                        {new Date(alert.end * 1000).toLocaleString('en-LK', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertsPanel;
