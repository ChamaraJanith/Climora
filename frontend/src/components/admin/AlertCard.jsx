import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { getSeverityConfig } from '../../utils/severityConfig';

const AlertCard = ({ alert }) => {
  const navigate = useNavigate();
  const cfg = getSeverityConfig(alert.severity);

  return (
    <div className="bg-[#F9FAFB] rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-150 flex flex-col gap-3">
      {/* Top row: badge + time */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
            {alert.severity}
          </span>
          {alert.isActive ? (
            <span className="font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs">
              Active
            </span>
          ) : (
            <span className="font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full text-xs">
              Inactive
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          {formatTimeAgo(alert.startAt || alert.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-800 text-base leading-snug">{alert.title}</h3>

      {/* Description — 2 lines max */}
      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{alert.description}</p>

      {/* Bottom row: location + arrow */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin size={14} className="text-[#06b6d4]" />
          {alert.area?.district || '—'}
        </span>
        <button
          onClick={() => navigate(`/admin/alerts/${alert.alertId}`)}
          className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#06b6d4] hover:border-[#06b6d4] transition-colors duration-150"
          aria-label="View alert details"
        >
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default AlertCard;
