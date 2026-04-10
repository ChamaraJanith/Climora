import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, 
  MapPin, Calendar, Check, X, CloudRain, Loader2, Image as ImageIcon
} from 'lucide-react';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Topbar from '../../components/admin/Topbar';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null); // 'APPROVE' | 'REJECT' | null
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/reports/admin/${id}`);
        setReport(data);
      } catch (err) {
        toast.error('Failed to load report details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 h-[100dvh]">
        <Topbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 h-[100dvh]">
        <Topbar />
        <main className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <AlertCircle className="w-16 h-16 mb-4 text-gray-300" />
          <h2 className="text-xl font-medium text-gray-700">Report Not Found</h2>
          <button 
            onClick={() => navigate('/admin/reports')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Reports
          </button>
        </main>
      </div>
    );
  }

  const {
    _id, title, description, category, severity,
    location, photos, createdAt, weatherContext, status
  } = report;

  const severityColors = {
    LOW: 'bg-green-100 text-green-700 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusColors = {
    ADMIN_VERIFIED: 'bg-green-100 text-green-700 border-green-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    RESOLVED: 'bg-blue-100 text-blue-700 border-blue-200',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };

  const handleActionDialog = (action) => setShowConfirm(action);

  const executeAction = async () => {
    if (!showConfirm) return;
    setIsUpdating(true);
    try {
      const newStatus = showConfirm === 'APPROVE' ? 'ADMIN_VERIFIED' : 'REJECTED';
      await api.patch(`/reports/${_id}/status`, { status: newStatus });
      toast.success(`Report ${newStatus === 'ADMIN_VERIFIED' ? 'Approved' : 'Rejected'} Successfully`);
      setReport({ ...report, status: newStatus });
      setShowConfirm(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update report status");
    } finally {
      setIsUpdating(false);
    }
  };

  const position = [location?.lat || 6.9271, location?.lon || 79.8612];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 h-[100dvh] overflow-hidden">
      <Topbar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-[1400px] w-full mx-auto pb-16">
          
          <button 
            onClick={() => navigate('/admin/reports')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Data (70%) */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="xl:col-span-8 flex flex-col gap-6"
            >
              
              {/* Header Box */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                      {category}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${severityColors[severity] || 'bg-gray-100 text-gray-700'}`}>
                      {severity}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${statusColors[status] || statusColors.PENDING}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400 font-medium shrink-0 ml-auto">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(createdAt).toLocaleString()}</span>
                  </div>
                </div>
                
                <h1 className="text-lg md:text-xl font-medium text-gray-900 leading-snug">
                  {title}
                </h1>
              </div>

              {/* Description Box */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Report Details</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-medium">
                  {description}
                </p>
              </div>

              {/* Gallery Box */}
              {photos && photos.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                   <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Image Evidence ({photos.length})</h3>
                   <div className="grid gap-3 grid-cols-2">
                      {photos.map((url, idx) => (
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                          key={idx} 
                          onClick={() => setSelectedImage(url)}
                          className="group cursor-pointer rounded-xl overflow-hidden bg-gray-50 aspect-[4/3] relative shadow-sm border border-gray-100"
                        >
                          <img src={url} alt={`Evidence ${idx+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 backdrop-blur-md">
                               <ImageIcon className="w-3.5 h-3.5" />
                               View
                            </span>
                          </div>
                        </motion.div>
                      ))}
                   </div>
                </div>
              )}

            </motion.div>


            {/* RIGHT COLUMN: Context & Actions (30%) */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
              className="xl:col-span-4 flex flex-col gap-4 xl:sticky xl:top-8"
            >
              
              {/* Location Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                     <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Location</p>
                     <p className="text-sm font-semibold text-gray-900 truncate">{location?.city}, {location?.district}</p>
                  </div>
                </div>
                
                <div className="h-[200px] w-full bg-gray-100 relative z-0">
                   <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      />
                      {(location?.lat && location?.lon) && <Marker position={position} />}
                    </MapContainer>
                </div>
              </div>

              {/* Weather Context */}
              {weatherContext?.summary && (
                <div className="bg-blue-50/50 rounded-2xl shadow-sm border border-blue-100 p-5 flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl shrink-0">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs text-blue-800/70 font-bold uppercase tracking-wider mb-1">Weather Context</h4>
                    <p className="text-sm font-medium text-blue-900">{weatherContext.summary}</p>
                  </div>
                </div>
              )}

              {/* Admin Actions Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                 <h3 className="text-base font-semibold text-gray-900 leading-tight">Review & Decision</h3>
                 <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed font-medium">
                   Validate and publish this report to the public system.
                 </p>
                 
                 <hr className="border-gray-100 mb-5" />

                 <div className="flex flex-col gap-3">
                   <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => handleActionDialog('APPROVE')}
                     disabled={isUpdating || status !== 'PENDING'}
                     className="w-full h-11 px-4 flex items-center justify-center gap-2 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-green-500/25"
                   >
                     <CheckCircle2 className="w-4 h-4" />
                     Approve & Publish
                   </motion.button>
                   
                   <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => handleActionDialog('REJECT')}
                     disabled={isUpdating || status !== 'PENDING'}
                     className="w-full h-11 px-4 flex items-center justify-center gap-2 rounded-xl font-medium text-sm text-red-600 bg-white hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                   >
                     <XCircle className="w-4 h-4" />
                     Reject Report
                   </motion.button>
                 </div>
              </div>

            </motion.div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full border border-gray-100"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto ${
              showConfirm === 'APPROVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {showConfirm === 'APPROVE' ? <Check className="w-7 h-7" /> : <X className="w-7 h-7" />}
            </div>
            
            <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">
              {showConfirm === 'APPROVE' ? 'Publish Report?' : 'Reject Report?'}
            </h3>
            
            <p className="text-center text-sm text-gray-500 font-medium mb-6 leading-relaxed">
              {showConfirm === 'APPROVE' 
                ? 'This report will become publicly visible on the platform and app.'
                : 'This report will be marked as rejected and hidden from public view.'}
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={executeAction}
                disabled={isUpdating}
                className={`w-full h-11 flex items-center justify-center font-medium text-sm rounded-xl text-white transition-colors shadow-sm ${
                  showConfirm === 'APPROVE' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Action'}
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="w-full h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-sm rounded-xl transition-colors border border-gray-200"
                disabled={isUpdating}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            src={selectedImage} 
            alt="Enlarged evidence" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminReportDetails;