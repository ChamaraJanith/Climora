import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CAT_COLORS = {
  FLOOD: '#06b6d4', LANDSLIDE: '#a855f7', HEATWAVE: '#f97316',
  STORM: '#22c55e', AIR_QUALITY: '#eab308', OTHER: '#64748b',
};
const SEV_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' };
const STATUS_COLORS = {
  PENDING: '#f59e0b', COMMUNITY_CONFIRMED: '#3b82f6',
  ADMIN_VERIFIED: '#10b981', REJECTED: '#ef4444', RESOLVED: '#64748b'
};

const Icons = {
  ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Image: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
};

export default function ReportDetailsView() {
  const { id } = useParams();
  const locationState = useLocation().state;
  const navigate = useNavigate();

  // Try extracting initial report from router state (avoids unverified 404 block for authors)
  const initialReport = locationState?.report || null;
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(!initialReport);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    // Scroll to top automatically on navigating in
    window.scrollTo(0, 0);

    const fetchReport = async () => {
      try {
        // Use /user/:id endpoint — allows owner to see own reports (any status)
        // and falls back to showing verified reports for others
        const res = await api.get(`/reports/user/${id}`);
        setReport(res.data);
      } catch (err) {
        if (!initialReport) {
          toast.error('Failed to load report details, or you do not have permission.');
          navigate(-1); // Back out securely
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Always fetch latest if possible, but silently fail if we have initialReport
    if (!initialReport) fetchReport();
    else {
      // Async background fetch to grab latest stats if available
      fetchReport();
    }
  }, [id, initialReport, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (!report) return null;

  const catColor = CAT_COLORS[report.category] || CAT_COLORS.OTHER;
  const sevColor = SEV_COLORS[report.severity] || SEV_COLORS.LOW;
  const statusColor = STATUS_COLORS[report.status] || STATUS_COLORS.PENDING;

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Navigation Header */}
      <div className="mb-4">
        <button 
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam) {
              navigate(`/dashboard?tab=${tabParam}`);
            } else {
              const from = locationState?.from;
              if (from === 'my-submissions') navigate('/dashboard?tab=my-submissions');
              else if (from === 'all-reports' || from === 'all') navigate('/dashboard?tab=all');
              else navigate('/dashboard');
            }
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-semibold"
        >
          <Icons.ArrowLeft /> Back to Reports
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ==================================================== */}
        {/* LEFT COMPONENT (Content & Photos) */}
        {/* ==================================================== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Info Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border tracking-wider" style={{ backgroundColor: `${catColor}15`, color: catColor, borderColor: `${catColor}30` }}>
                {report.category}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg text-white tracking-wider" style={{ backgroundColor: sevColor }}>
                {report.severity}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider ml-auto" style={{ backgroundColor: `${statusColor}10`, color: statusColor, borderColor: statusColor }}>
                {report.status.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 leading-tight mb-3">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 font-medium pb-4 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Icons.MapPin />
                {report.location?.city ? `${report.location.city}, ` : ''}{report.location?.district || 'Unknown Location'}
              </div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
              <div>{new Date(report.createdAt).toLocaleString()}</div>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-gray-900 mb-2 tracking-tight">Incident Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                {report.description}
              </p>
            </div>
          </div>

          {/* Photos Box */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-3 tracking-tight">Attached Imagery</h3>
            {report.photos && report.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {report.photos.map((url, i) => (
                  <button 
                    key={i} 
                    onClick={() => setZoomedImage(url)}
                    className="aspect-video lg:aspect-square w-full rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 hover:ring-2 hover:ring-blue-400 transition-all cursor-zoom-in"
                  >
                    <img src={url} alt={`Incident photo ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-full py-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <Icons.Image />
                <span className="text-sm font-medium mt-2">No visual evidence provided</span>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COMPONENT (Sidebar Elements / Map) */}
        {/* ==================================================== */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-3 tracking-tight">Geographic Location</h3>
            
            {report.location?.lat && report.location?.lon ? (
              <div className="rounded-xl overflow-hidden border border-gray-200 h-64 shadow-inner relative z-0">
                <MapContainer 
                  center={[report.location.lat, report.location.lon]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[report.location.lat, report.location.lon]} />
                </MapContainer>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                <span className="text-sm font-medium">Map data unavailable</span>
              </div>
            )}
            
            <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium">
              Georeferenced to: <span className="font-bold text-gray-700">{report.location?.district}</span>
              <br /><span className="text-gray-400 font-normal">LAT: {report.location?.lat?.toFixed(5)} / LON: {report.location?.lon?.toFixed(5)}</span>
            </div>
          </div>

          {/* Weather Context Card */}
          {report.weatherContext && report.weatherContext.summary && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl shrink-0 shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/>
                    <line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/>
                    <line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/>
                    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-blue-900 mb-1 tracking-tight">Weather Context</h4>
                  <p className="text-sm text-blue-700 font-medium">{report.weatherContext.summary}</p>
                  {report.weatherContext.rain24hMm != null && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        24h: {report.weatherContext.rain24hMm}mm
                      </span>
                      {report.weatherContext.rain1hMm > 0 && (
                        <span className="text-[10px] font-bold bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                          1h: {report.weatherContext.rain1hMm}mm
                        </span>
                      )}
                    </div>
                  )}
                  {report.weatherContext.fetchedAt && (
                    <p className="text-[10px] text-blue-400 mt-2 font-medium">
                      Recorded at {new Date(report.weatherContext.fetchedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Image Zoom Modal (kept isolated) */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
            <motion.img 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              src={zoomedImage} 
              alt="Zoomed preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-zoom-out"
            />
            <button className="absolute top-6 right-6 text-white hover:text-gray-300 bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors">
              <Icons.X />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}