import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminReportCard = ({ report, onClick, onDelete }) => {
  const { title, description, category, severity, status, location, createdAt, photos } = report;

  const severityColors = {
    LOW: 'bg-green-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    CRITICAL: 'bg-red-500 text-white',
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ADMIN_VERIFIED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    RESOLVED: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const thumbnail = photos && photos.length > 0 ? photos[0] : null;
  const extraPhotos = photos?.length > 1 ? photos.length - 1 : 0;

  return (
    <motion.div
      onClick={() => onClick(report)}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer flex flex-col border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] transition-shadow h-full relative"
    >
      {/* Thumbnail Header */}
      <div className="h-48 w-full bg-gray-100 relative group overflow-hidden shrink-0">
        {thumbnail ? (
          <>
            <img 
              src={thumbnail} 
              alt={title} 
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110" 
            />
            {/* Gradient Overlay for better readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none"></div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-sm font-medium">No Image</span>
          </div>
        )}
        
        {/* CATEGORY BADGE - TOP LEFT */}
        <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-black/70 text-white shadow-sm backdrop-blur-md z-10 w-max">
          {category}
        </span>
        
        {/* SEVERITY BADGE - TOP RIGHT */}
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10 ${severityColors[severity] || 'bg-gray-500 text-white'}`}>
          {severity}
        </span>

        {/* Extra Photos Indicator */}
        {extraPhotos > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <ImageIcon className="w-3 h-3" />
            +{extraPhotos} more
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1 flex-1 leading-tight" title={title}>
            {title}
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shrink-0 ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
          </span>
        </div>

        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-1">
          {description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate max-w-[50%]" title={`${location?.city}, ${location?.district}`}>
            <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-500" />
            <span className="truncate font-medium">{location?.city}, {location?.district}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{new Date(createdAt).toLocaleDateString()}</span>
            </div>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(report); }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 flex-shrink-0 relative z-20 tooltip-trigger"
                title="Delete Report"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminReportCard;