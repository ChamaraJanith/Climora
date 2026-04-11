import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { getSeverityConfig } from '../../utils/severityConfig';

const AlertCard = ({ alert }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0b1121] border border-slate-800/80 rounded-[20px] p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)] hover:border-slate-700/80 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden group">
      {/* Top row: badge + time */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
            alert.severity === 'CRITICAL' ? 'bg-[#0b1121] text-red-400 border-red-500/30' :
            alert.severity === 'HIGH' ? 'bg-[#0b1121] text-orange-400 border-orange-500/30' :
            'bg-[#0b1121] text-yellow-500 border-yellow-500/30'
          }`}>
            {alert.severity || 'INFO'}
          </span>
          {alert.isActive && (
            <span className="text-[10px] font-bold px-2 py-0.5 text-cyan-400 uppercase tracking-widest">
              ACTIVE
            </span>
          )}
        </div>
        <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">
          {alert.startAt ? new Date(alert.startAt).toLocaleDateString('en-US', { weekday: 'short' }) : 'TODAY'}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[17px] font-bold text-slate-100 leading-snug mb-2.5 antialiased tracking-wide">{alert.title}</h3>

      {/* Description — 2 lines max */}
      <p className="text-[14px] font-medium text-slate-400 line-clamp-2 leading-relaxed flex-1">{alert.description}</p>

      {/* Bottom row: location + arrow + track */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
            {alert.area?.district || '—'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/alerts/${alert.alertId}`);
            }}
            className="w-7 h-7 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all duration-200"
            aria-label="View alert details"
          >
            <ArrowRight size={14} />
          </button>
        </div>
        {/* Emulating the dark track bar from the image */}
        <div className="w-full h-1.5 bg-[#131b31] rounded-full overflow-hidden">
          {alert.isActive && (
            <div className="h-full bg-cyan-400 rounded-full w-1/3 opacity-70"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
