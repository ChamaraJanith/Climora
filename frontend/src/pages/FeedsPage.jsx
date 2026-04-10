import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

const SEV_COLORS = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-green-500',
  CRITICAL: 'bg-red-600',
};

export default function FeedsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);

    const fetchVerifiedReports = async () => {
      try {
        // Gets verified reports only (based on backend logic)
        const res = await api.get('/reports');
        setReports(res.data);
      } catch (err) {
        console.error("Failed to fetch verified reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVerifiedReports();
  }, []);

  return (
    <div className="pt-24 pb-20">
      <section className="max-w-7xl mx-auto px-6 py-16">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-red-400 font-bold uppercase tracking-wider text-sm mb-3 block"
          >
            Community Feed
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
          >
            Verified Incident Reports
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Stay informed with real-time, community-sourced environmental alerts that have been verified by administrators.
          </motion.p>
        </div>

        {/* REPORT GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl h-80 animate-pulse"></div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
            <span className="text-gray-400 text-lg font-medium">No verified reports yet</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reports.map((report, idx) => {
              const severityColor = SEV_COLORS[report.severity] || "bg-gray-500";
              const thumbnail = report.photos && report.photos.length > 0 ? report.photos[0] : null;

              return (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/reports/${report._id}`)}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-300 flex flex-col h-full shadow-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  {/* IMAGE (TOP HALF) */}
                  <div className="h-48 relative shrink-0 bg-white/5 flex items-center justify-center overflow-hidden">
                    {thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt={report.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-white/20" />
                    )}
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
                    
                    {/* BADGES */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-white/10">
                        {report.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full text-white uppercase tracking-wider shadow-md ${severityColor}`}>
                        {report.severity}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT (BOTTOM) */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-white font-semibold text-lg line-clamp-1 mb-2 group-hover:text-cyan-400 transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed flex-1">
                      {report.description}
                    </p>

                    {/* FOOTER */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1.5 truncate max-w-[60%]">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{report.location?.city || report.location?.district || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </section>
    </div>
  );
}