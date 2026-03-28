import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, AlertTriangle } from 'lucide-react';
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
        setAlert(data.alert || data);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAlert();
  }, [id]);

  const cfg = getSeverityConfig(alert?.severity);

  // Parse safety instructions from description or a dedicated field
  const safetyLines = alert?.safetyInstructions
    ? (Array.isArray(alert.safetyInstructions) ? alert.safetyInstructions : [alert.safetyInstructions])
    : [];

  const affectedAreas = alert?.area?.city
    ? [alert.area.city, alert.area.district].filter(Boolean)
    : [alert?.area?.district].filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar placeholder="Search..." />
      <main className="flex-1 p-6 space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/alerts')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#06b6d4] transition-colors duration-150"
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
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
              {/* Severity badge */}
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
                {alert.severity}
              </span>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-800 leading-tight">{alert.title}</h1>

              {/* Location + date */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#06b6d4]" />
                  {alert.area?.district}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#06b6d4]" />
                  {formatDateTime(alert.startAt)}
                </span>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{alert.description}</p>
              </div>

              {/* Safety Instructions */}
              {safetyLines.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-red-500" />
                    <h3 className="text-sm font-semibold text-red-600">Safety Instructions</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {safetyLines.map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Category + Status chips */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">
                  {alert.category}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${alert.isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {alert.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* Affected Areas */}
              <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Affected Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {affectedAreas.length > 0 ? (
                    affectedAreas.map((area, i) => (
                      <span key={i} className="text-sm px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 shadow-sm">
                        {area}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No area data available</p>
                  )}
                </div>
              </div>

              {/* Location Map placeholder */}
              <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Location Map</h2>
                <div className="h-40 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <MapPin size={24} className="text-[#06b6d4] opacity-60" />
                  <span className="text-xs">Map integration coming soon</span>
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
