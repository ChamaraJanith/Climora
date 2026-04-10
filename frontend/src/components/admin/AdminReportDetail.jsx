import { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CheckCircle2, XCircle, AlertCircle, MapPin, Calendar, Check, X, CloudRain } from 'lucide-react';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminReportDetail = ({ report, onUpdateStatus }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null); // 'APPROVE' | 'REJECT' | null

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <AlertCircle className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-400">Select a report to view details</p>
      </div>
    );
  }

  const {
    _id,
    title,
    description,
    category,
    severity,
    location,
    photos,
    createdAt,
    weatherContext,
    status
  } = report;

  const severityColors = {
    LOW: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };

  const handleActionDialog = (action) => {
    setShowConfirm(action);
  };

  const executeAction = async () => {
    if (!showConfirm) return;
    setIsUpdating(true);
    try {
      const status = showConfirm === 'APPROVE' ? 'ADMIN_VERIFIED' : 'REJECTED';
      await onUpdateStatus(_id, status);
      setShowConfirm(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestInfo = () => {
    // Doesn't change status to a new state in DB per requirement, remains PENDING
    toast.success('Request sent to user for more information');
  };

  const position = [location?.lat || 6.9271, location?.lon || 79.8612];

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      
      {/* Header Info */}
      <div className="p-6 border-b border-gray-100 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                {category}
              </span>
              <span className={`font-bold px-3 py-1 rounded-full uppercase tracking-wider text-xs ${severityColors[severity] || 'bg-gray-100 text-gray-700'}`}>
                {severity} SEVERITY
              </span>
              <span className="flex items-center text-gray-500 gap-1 ml-2">
                <Calendar className="w-4 h-4" />
                {new Date(createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-widest block shrink-0 ${
            status === 'ADMIN_VERIFIED' ? 'bg-green-100 text-green-700' :
            status === 'REJECTED' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        
        {/* Description */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {description}
          </p>
        </div>

        {/* Weather Context (if exists) */}
        {weatherContext && weatherContext.summary && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Weather Context</h4>
              <p className="text-sm text-blue-800">{weatherContext.summary}</p>
            </div>
          </div>
        )}

        {/* Location & Map */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Location</h3>
          <p className="text-gray-700 flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            {location?.city}, {location?.district}
          </p>
          <div className="h-[250px] rounded-xl overflow-hidden shadow-inner border border-gray-200">
             <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {(location?.lat && location?.lon) && <Marker position={position} />}
              </MapContainer>
          </div>
        </div>

        {/* Image Gallery */}
        {photos && photos.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Images Gallery ({photos.length})</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {photos.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noreferrer" className="group block rounded-xl overflow-hidden bg-gray-100 aspect-video relative shadow-sm border border-gray-200">
                  <img src={url} alt={`Evidence ${idx+1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0 flex items-center justify-between gap-4">
        <button
          onClick={handleRequestInfo}
          disabled={isUpdating || status !== 'PENDING'}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <AlertCircle className="w-4 h-4" />
          Request Info
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={() => handleActionDialog('REJECT')}
            disabled={isUpdating || status !== 'PENDING'}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
          >
            <XCircle className="w-5 h-5" />
            Reject
          </button>
          
          <button
            onClick={() => handleActionDialog('APPROVE')}
            disabled={isUpdating || status !== 'PENDING'}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm shadow-green-600/20"
          >
            <CheckCircle2 className="w-5 h-5" />
            Approve
          </button>
        </div>
      </div>

      {/* Confirmation Modal Overlay */}
      {showConfirm && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${
              showConfirm === 'APPROVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {showConfirm === 'APPROVE' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
            </div>
            
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              {showConfirm === 'APPROVE' ? 'Approve Report?' : 'Reject Report?'}
            </h3>
            
            <p className="text-center text-gray-500 mb-6 text-sm">
              {showConfirm === 'APPROVE' 
                ? 'This action will make the report publicly visible on the platform.'
                : 'This action will reject the report and it will not be displayed.'}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className={`flex-1 px-4 py-2 font-medium rounded-xl text-white transition-colors flex items-center justify-center shadow-sm ${
                  showConfirm === 'APPROVE' 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                }`}
              >
                {isUpdating ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReportDetail;
