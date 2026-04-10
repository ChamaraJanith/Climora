import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, 
  MapPin, Calendar, Check, X, CloudRain, Loader2 
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
          <h2 className="text-xl font-bold text-gray-700">Report Not Found</h2>
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
    LOW: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
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
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
          
          <button 
            onClick={() => navigate('/admin/reports')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Reports
          </button>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Header section */}
            <div className="p-6 md:p-8 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                      {category}
                    </span>
                    <span className={`font-bold px-3 py-1 rounded-full uppercase tracking-wider text-xs border ${severityColors[severity] || 'bg-gray-100 text-gray-700'}`}>
                      {severity} SEVERITY
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-widest border ${
                      status === 'ADMIN_VERIFIED' ? 'bg-green-100 text-green-700 border-green-200' :
                      status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                      status === 'RESOLVED' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-gray-500 gap-2 shrink-0 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{new Date(createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Content section */}
            <div className="p-6 md:p-8 space-y-10">
              
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">
                  {description}
                </p>
              </section>

              {weatherContext?.summary && (
                <section>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <div className="bg-white text-blue-600 p-3 rounded-xl shadow-sm border border-blue-100 shrink-0">
                      <CloudRain className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">Weather Context at Time of Report</h4>
                      <p className="text-blue-800">{weatherContext.summary}</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Location Details</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-4">
                    <div className="flex items-center gap-3 text-gray-800 font-medium">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-blue-600">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <span className="text-lg">{location?.city}, {location?.district} District</span>
                    </div>
                  </div>
                  
                  <div className="h-[300px] rounded-2xl overflow-hidden shadow-inner border border-gray-200 z-0 relative">
                     <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        <TileLayer
                          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                          attribution="&copy; OpenStreetMap"
                        />
                        {(location?.lat && location?.lon) && <Marker position={position} />}
                      </MapContainer>
                  </div>
                </div>

                {photos && photos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Image Evidence ({photos.length})</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {photos.map((url, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedImage(url)}
                          className="group cursor-pointer rounded-2xl overflow-hidden bg-gray-100 aspect-square relative shadow-sm border border-gray-200"
                        >
                          <img src={url} alt={`Evidence ${idx+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm transition-opacity duration-300">View Full</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

            </div>

            {/* Footer actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-4 rounded-b-2xl">
              <button
                onClick={() => handleActionDialog('REJECT')}
                disabled={isUpdating || status !== 'PENDING'}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-red-700 bg-white hover:bg-red-50 transition-colors disabled:opacity-50 border border-red-200 shadow-sm"
              >
                <XCircle className="w-5 h-5" />
                Reject Report
              </button>
              
              <button
                onClick={() => handleActionDialog('APPROVE')}
                disabled={isUpdating || status !== 'PENDING'}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 shadow-md shadow-green-600/20"
              >
                <CheckCircle2 className="w-5 h-5" />
                Approve & Verify
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${
              showConfirm === 'APPROVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {showConfirm === 'APPROVE' ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
            </div>
            
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
              {showConfirm === 'APPROVE' ? 'Verify this Report?' : 'Reject this Report?'}
            </h3>
            
            <p className="text-center text-gray-600 mb-8">
              {showConfirm === 'APPROVE' 
                ? 'This report will become publicly visible and verified.'
                : 'This report will be marked as rejected and hidden from public view.'}
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={isUpdating}
                className={`flex-1 px-4 py-3 font-bold rounded-xl text-white transition-colors flex items-center justify-center shadow-md ${
                  showConfirm === 'APPROVE' 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                }`}
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
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