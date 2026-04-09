import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react';

const AdminReportCard = ({ report, isSelected, onClick }) => {
  const { title, category, severity, location, createdAt, photos } = report;

  // Severity color mapping
  const severityColors = {
    LOW: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };

  const thumbnail = photos && photos.length > 0 ? photos[0] : null;

  return (
    <div
      onClick={() => onClick(report)}
      className={`p-4 mb-3 border rounded-xl cursor-pointer transition-all duration-200 border-gray-100
        ${isSelected 
          ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-500' 
          : 'bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate" title={title}>
                {title}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${severityColors[severity] || 'bg-gray-100 text-gray-700'}`}>
                {severity}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
              <span className="font-medium text-gray-700">{category}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
            <div className="flex items-center gap-1 truncate max-w-[140px]" title={`${location?.city}, ${location?.district}`}>
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location?.city}, {location?.district}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3" />
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportCard;
