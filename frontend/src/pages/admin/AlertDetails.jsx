import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import Topbar from '../../components/admin/Topbar';
import api from '../../services/api';
import { getSeverityConfig } from '../../utils/severityConfig';
import { formatDateTime } from '../../utils/formatTimeAgo';

const SkeletonDetails = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
    <div className="lg:col-span-2 bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 space-y-4">
      <div className="h-6 w-24 bg-gray-200 rounded-full" />
      <div className="h-8 w-3/4 bg-gray-200 rounded" />
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="space-y-2 mt-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-gray-200 rounded w-full" />)}
      </div>
      <div className="h-24 bg-red-50 rounded-xl mt-4" />
    </div>
    <div className="space-y-4">
      <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 h-40" />
      <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 h-40" />
    </div>
  </div>
);

const AlertDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchAlert = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/alerts/${id}`);
        setAlert(data?.data || null);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAlert();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this alert?")) return;

    try {
      await api.delete(`/alerts/${alert.alertId}`);
      toast.success("Alert deleted successfully");
      navigate('/admin/alerts');
    } catch (err) {
      toast.error("Failed to delete alert");
    }
  };

  const cfg = getSeverityConfig(alert?.severity);

  // Parse safety instructions from description or a dedicated field
  const safetyLines = alert?.safetyInstructions
    ? (Array.isArray(alert.safetyInstructions) ? alert.safetyInstructions : [alert.safetyInstructions])
    : [];

  const affectedAreas = alert?.area?.cities?.length
    ? alert.area.cities
    : alert?.area?.city
    ? [alert.area.city]
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar placeholder="Search..." />
      <main className="flex-1 p-6 space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/alerts')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-[#00c6ff] transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Back to Alerts
        </button>

        {loading ? (
          <SkeletonDetails />
        ) : notFound ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertTriangle size={40} className="mb-3 opacity-30" />
            <p className="text-base font-medium">Alert not found</p>
            <button
              onClick={() => navigate('/admin/alerts')}
              className="mt-4 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors"
            >
              Back to Alerts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN - Premium Detail Card */}
            <div 
              className="lg:col-span-2 relative bg-gradient-to-br from-[#050a19] to-[#0a1328] backdrop-blur-[20px] border border-white/5 rounded-[20px] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.7),0_0_60px_rgba(0,150,255,0.1)] overflow-hidden"
              style={{ animation: 'fadeInUp 0.4s ease-out forwards' }}
            >
              {/* Radial Cinematic Lighting Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,120,255,0.05),transparent_60%)] pointer-events-none z-0" />
              {/* Glowing Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00c6ff] to-[#0072ff] opacity-90 shadow-[0_0_10px_#00c6ff] z-10" />

              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <span className={`inline-block text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/40 shadow-[0_0_15px_rgba(255,0,0,0.4)] animate-pulse' :
                    alert.severity === 'HIGH' ? 'bg-orange-500/10 text-[#ff8c00] border-orange-500/40 shadow-[0_0_15px_rgba(255,140,0,0.5)]' :
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 shadow-[0_0_15px_rgba(255,200,0,0.4)]'
                  }`}>
                    {alert.severity || 'INFO'}
                  </span>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/admin/alerts/edit/${alert.alertId}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-[#38bdf8] border border-white/10 hover:bg-white/10 hover:border-[#38bdf8]/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(255,50,50,0.1)] text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white leading-tight antialiased tracking-wide">{alert.title}</h1>

                {/* Location + date */}
                <div className="flex flex-wrap items-center gap-5 text-sm text-white/60 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-[#38bdf8] drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
                    {alert.area?.district}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={16} className="text-[#38bdf8] drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
                    {formatDateTime(alert.startAt)}
                  </span>
                </div>

                {/* Description */}
                <div className="pt-2">
                  <h2 className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-3">Description</h2>
                  <p className="text-[16px] text-white/75 leading-[1.7] antialiased">{alert.description}</p>
                </div>

                {/* Premium Safety Instructions Panel */}
                {safetyLines.length > 0 && (
                  <div className="bg-[rgba(255,50,50,0.08)] border border-[rgba(255,80,80,0.25)] rounded-2xl p-5 shadow-[0_0_25px_rgba(255,0,0,0.2)]">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={18} className="text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse" />
                      <h3 className="text-sm font-bold text-red-500 tracking-wide uppercase">Safety Instructions</h3>
                    </div>
                    <ul className="space-y-2">
                      {safetyLines.map((line, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[15px] text-[#ffb4b4] font-medium leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 drop-shadow-[0_0_4px_rgba(255,0,0,0.8)]" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Category + Status chips */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-white/10 mt-6">
                  <span className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 text-[#38bdf8] border border-white/10 font-bold">
                    {alert.category}
                  </span>
                  <span className={`text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-lg border font-bold ${
                    alert.isActive 
                      ? 'bg-[#00ff9c]/10 text-[#00ff9c] border-[#00ff9c]/30 shadow-[0_0_12px_rgba(0,255,156,0.25)]' 
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    {alert.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Glass Cards */}
            <div className="space-y-6">
              {/* Affected Areas */}
              <div className="relative bg-gradient-to-br from-[#050a19] to-[#0a1328] backdrop-blur-[18px] border border-white/5 rounded-[20px] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.7),0_0_60px_rgba(0,150,255,0.05)] hover:-translate-y-1 hover:shadow-[0_40px_70px_rgba(0,150,255,0.1)] transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,120,255,0.05),transparent_50%)] pointer-events-none z-0" />
                <h2 className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-4 relative z-10">Affected Areas</h2>
                <div className="flex flex-wrap gap-2 relative z-10">
                  {affectedAreas.length > 0 ? (
                    affectedAreas.map((area, i) => (
                      <span key={i} className="text-[13px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/75 font-medium hover:bg-white/10 transition-colors backdrop-blur-md">
                        {area}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-white/40">No area data available</p>
                  )}
                </div>
              </div>

              {/* Location Map */}
              <div className="relative bg-gradient-to-br from-[#050a19] to-[#0a1328] backdrop-blur-[18px] border border-white/5 rounded-[20px] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.7),0_0_60px_rgba(0,150,255,0.05)] hover:-translate-y-1 hover:shadow-[0_40px_70px_rgba(0,150,255,0.1)] transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,120,255,0.05),transparent_50%)] pointer-events-none z-0" />
                <h2 className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-4 relative z-10">Location Map</h2>
                <div className="relative h-[220px] rounded-xl overflow-hidden border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] z-10">
                  {/* Internal Dimming Overlay */}
                  <div className="absolute inset-0 bg-black/20 pointer-events-none z-[400]" />
                  {alert.locations && alert.locations.length > 0 ? (
                    <MapContainer 
                      center={
                        alert.locations && alert.locations.length > 0
                          ? [alert.locations[0].lat, alert.locations[0].lng]
                          : [7.8731, 80.7718]
                      }
                      zoom={10} 
                      scrollWheelZoom={false} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        className="map-tiles"
                      />
                      {alert.locations?.map((loc, index) => (
                        <Marker
                          key={index}
                          position={[loc.lat, loc.lng]}
                        />
                      ))}
                    </MapContainer>
                  ) : (
                    <div className="h-full bg-white/5 flex flex-col items-center justify-center gap-3 text-white/40">
                      <MapPin size={28} className="text-[#38bdf8] opacity-50 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                      <span className="text-[11px] uppercase tracking-wider font-medium">Location coordinates not provided</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AlertDetails;
