import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const SEV_COLORS = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-green-500',
  CRITICAL: 'bg-red-600',
};

export default function FeedsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchVerifiedReports = async () => {
      try {
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

  // Esc key close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setSelectedReport(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = selectedReport ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [selectedReport]);

  const openModal = (report) => {
    setSelectedReport(report);
    setCurrentImage(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (selectedReport?.photos && currentImage < selectedReport.photos.length - 1) {
      setCurrentImage(prev => prev + 1);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (currentImage > 0) {
      setCurrentImage(prev => prev - 1);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
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
                  onClick={() => openModal(report)}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden cursor-pointer group hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full shadow-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  {/* IMAGE (TOP HALF) */}
                  <div className="h-48 relative shrink-0 bg-white/5 flex items-center justify-center overflow-hidden">
                    {thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt={report.title} 
                        loading="lazy"
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

      {/* INLINE MODAL */}
      <AnimatePresence>
        {selectedReport && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative bg-[#030712] border border-white/10 rounded-2xl max-w-5xl w-full mx-auto overflow-hidden shadow-2xl my-auto"
            >
              <button
                className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-white/60 hover:text-white hover:bg-black/80 transition-all text-lg"
                onClick={() => setSelectedReport(null)}
              >
                ✕
              </button>

              <div className="flex flex-col lg:flex-row">
                {/* IMAGE GALLERY (LEFT) */}
                <div className="w-full lg:w-1/2 relative bg-white/5 flex items-center justify-center min-h-[300px] lg:min-h-[500px] overflow-hidden">
                  {selectedReport.photos && selectedReport.photos.length > 0 ? (
                    <>
                      <img
                        src={selectedReport.photos[currentImage]}
                        alt={selectedReport.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/90 via-transparent to-black/30" />
                      
                      {selectedReport.photos.length > 1 && (
                        <>
                          <button 
                            onClick={prevImage}
                            disabled={currentImage === 0}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 disabled:opacity-30 transition-all cursor-pointer"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={nextImage}
                            disabled={currentImage === selectedReport.photos.length - 1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 disabled:opacity-30 transition-all cursor-pointer"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          
                          {/* Image indicators */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {selectedReport.photos.map((_, i) => (
                              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentImage ? 'bg-cyan-400 w-4' : 'bg-white/30'}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/20">
                      <ImageIcon className="w-16 h-16 mb-2" />
                      <span className="text-sm">No images attached</span>
                    </div>
                  )}
                </div>

                {/* CONTENT SECTION (RIGHT) */}
                <div className="w-full lg:w-1/2 p-8 lg:p-10 space-y-6 flex flex-col justify-center bg-[#030712]">
                  
                  {/* Badges */}
                  <div className="flex gap-2">
                    <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider">
                      {selectedReport.category}
                    </span>
                    <span className={`text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider
                      ${selectedReport.severity === 'CRITICAL' ? 'bg-red-600' : 
                        selectedReport.severity === 'HIGH' ? 'bg-red-500' :
                        selectedReport.severity === 'MEDIUM' ? 'bg-yellow-500' :
                        'bg-green-500'}
                    `}>
                      {selectedReport.severity} SEVERITY
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-white text-3xl font-bold tracking-tight leading-tight">
                    {selectedReport.title}
                  </h2>

                  {/* Description */}
                  <div className="bg-white/5 rounded-xl border border-white/10 p-5 shadow-inner">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</h3>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* MINI MAP PREVIEW */}
                  {(selectedReport?.location?.lat || selectedReport?.location?.coordinates?.lat) && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.15 }}
                      className="rounded-xl overflow-hidden border border-white/10 relative z-0"
                    >
                      <MapContainer
                        center={[
                          selectedReport.location?.lat || selectedReport.location?.coordinates?.lat,
                          selectedReport.location?.lon || selectedReport.location?.coordinates?.lng || selectedReport.location?.lng || selectedReport.location?.coordinates?.lon
                        ]}
                        zoom={13}
                        scrollWheelZoom={false}
                        className="h-48 w-full"
                      >
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={[
                            selectedReport.location?.lat || selectedReport.location?.coordinates?.lat,
                            selectedReport.location?.lon || selectedReport.location?.coordinates?.lng || selectedReport.location?.lng || selectedReport.location?.coordinates?.lon
                          ]}
                        >
                          <Popup>
                            <span className="font-semibold text-gray-900">{selectedReport.title}</span>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </motion.div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{selectedReport.location?.city || selectedReport.location?.district}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}