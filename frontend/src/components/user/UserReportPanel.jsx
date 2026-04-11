import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import ProfileLocationMap from '../ui/ProfileLocationMap';
import { useAuth } from '../../contexts/AuthContext';
import SearchFilterBar from '../common/SearchFilterBar';

// ─── Constants & Icons ────────────────────────────────────────────────────────
const DISASTER_CATEGORIES = ['FLOOD', 'LANDSLIDE', 'HEATWAVE', 'STORM', 'AIR_QUALITY', 'OTHER'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

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
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  List: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Image: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  MapPin: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Calendar: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
};

// ─── Sub-Components ────────────────────────────────────────────────────────

const SEV_BADGE = {
  LOW:      'bg-green-500 text-white',
  MEDIUM:   'bg-yellow-500 text-white',
  HIGH:     'bg-orange-500 text-white',
  CRITICAL: 'bg-red-500 text-white',
};

const STATUS_BADGE = {
  PENDING:              'bg-yellow-400/20 text-yellow-300 border-yellow-400/20',
  COMMUNITY_CONFIRMED:  'bg-blue-500/20 text-blue-300 border-blue-500/20',
  ADMIN_VERIFIED:       'bg-green-500/20 text-green-300 border-green-500/20',
  REJECTED:             'bg-red-500/20 text-red-300 border-red-500/20',
  RESOLVED:             'bg-gray-500/20 text-gray-300 border-gray-500/20',
};

const ReportCard = ({ report, onEdit, onDelete, onClick, isOwner }) => {
  const thumbnail = report.photos && report.photos.length > 0 ? report.photos[0] : null;
  const extraPhotos = report.photos?.length > 1 ? report.photos.length - 1 : 0;

  return (
    <motion.div
      onClick={() => onClick(report)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.25 }}
      className="bg-[linear-gradient(135deg,#020617,#0f172a)] border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col h-[360px] cursor-pointer group overflow-hidden w-full"
    >
      {/* ── Image Section (top ~50%) ── */}
      <div className="h-48 w-full bg-gray-100 relative overflow-hidden shrink-0">
        {thumbnail ? (
          <>
            <img
              src={thumbnail}
              alt={report.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/25 pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full bg-[#020617] flex flex-col items-center justify-center text-white/20">
            <Icons.Image />
            <span className="text-xs font-medium mt-1.5">No Image</span>
          </div>
        )}

        {/* Category badge — top left */}
        <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-black/65 text-white backdrop-blur-sm shadow-md z-10">
          {report.category}
        </span>

        {/* Severity badge — top right */}
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md z-10 ${SEV_BADGE[report.severity] || 'bg-gray-500 text-white'}`}>
          {report.severity}
        </span>

        {/* Extra photos indicator */}
        {extraPhotos > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Icons.Image />
            +{extraPhotos} more
          </div>
        )}
      </div>

      {/* ── Content Section (bottom ~50%) ── */}
      <div className="p-5 flex flex-col flex-1 min-h-0">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-white text-base line-clamp-1 flex-1 leading-tight group-hover:text-cyan-400 transition-colors">
            {report.title}
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shrink-0 shadow-md ${STATUS_BADGE[report.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}>
            {report.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-white/60 line-clamp-2 leading-relaxed flex-1">
          {report.description}
        </p>

        {/* Footer row */}
        <div className="mt-auto pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-1.5 truncate max-w-[60%]">
              <Icons.MapPin />
              <span className="truncate font-medium text-white/40">
                {report.location?.city || report.location?.district || 'Unknown'}
                {report.distanceKm !== undefined && ` (${report.distanceKm.toFixed(1)}km)`}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Icons.Calendar />
              <span className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Edit / Delete — always visible for owner */}
          {isOwner && (
            <div className="flex gap-2 mt-3">
              <button
                disabled={report.status === 'ADMIN_VERIFIED'}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (report.status !== 'ADMIN_VERIFIED') onEdit(report); 
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  report.status === 'ADMIN_VERIFIED'
                    ? 'bg-white/5 text-white/30 border-white/5 opacity-60 cursor-not-allowed'
                    : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white border-cyan-500/20'
                }`}
              >
                <Icons.Edit /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(report); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-500/20"
              >
                <Icons.Trash /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ReportDetailsModal = ({ initialReport, onClose }) => {
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    const fetchFullReport = async () => {
      try {
        const res = await api.get(`/reports/${initialReport._id}`);
        setReport(res.data);
      } catch (err) {
        // Silently fallback to initialReport. 
        // PENDING reports typically return 404 here due to backend status filtering.
      }
    };
    fetchFullReport();
  }, [initialReport._id]);

  if (!report) return null;

  const catColor = CAT_COLORS[report.category] || CAT_COLORS.OTHER;
  const sevColor = SEV_COLORS[report.severity] || SEV_COLORS.LOW;
  const statusColor = STATUS_COLORS[report.status] || STATUS_COLORS.PENDING;

  // Make sure Leaflet handles Default icons properly when imported dynamically if haven't already.
  // ProfileLocationMap already does this globally if it renders first, but to be sure we just use standard markers.

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0f172a] rounded-2xl w-full max-w-3xl border border-white/10 shadow-2xl my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#0f172a] z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 rounded-t-2xl">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
            >
              <Icons.ArrowLeft /> Back to Reports
            </button>
            <div className="text-[10px] font-bold px-3 py-1.5 rounded border tracking-wider" style={{ backgroundColor: `${statusColor}10`, color: statusColor, borderColor: statusColor }}>
              {report.status.replace('_', ' ')}
            </div>
          </div>

          {/* Scrolling Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md border tracking-wider" style={{ backgroundColor: `${catColor}15`, color: catColor, borderColor: `${catColor}30` }}>
                  {report.category}
                </span>
                <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full text-white tracking-wider" style={{ backgroundColor: sevColor }}>
                  {report.severity} SEVERITY
                </span>
                <span className="text-white/40 text-xs ml-auto font-medium">
                  {new Date(report.createdAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-white font-extrabold text-2xl leading-tight mb-2">
                {report.title}
              </h2>
              <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
                <Icons.MapPin />
                {report.location?.city ? `${report.location.city}, ` : ''}{report.location?.district || 'Unknown Location'}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Full Description</h4>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{report.description}</p>
            </div>

            {/* Images Grid */}
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Incident Photos</h4>
              {report.photos && report.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {report.photos.map((url, i) => (
                    <button 
                      key={i} 
                      onClick={() => setZoomedImage(url)}
                      className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:opacity-90 hover:ring-2 hover:ring-cyan-400 transition-all cursor-zoom-in"
                    >
                      <img src={url} alt={`Incident photo ${i+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="w-full py-10 bg-white/5 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/40">
                  <Icons.Image />
                  <span className="text-xs font-medium mt-2">No photos attached</span>
                </div>
              )}
            </div>

            {/* Map Integration */}
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Exact Location</h4>
              {report.location?.lat && report.location?.lon ? (
                <div className="rounded-xl overflow-hidden border border-white/10 h-64 shadow-inner relative z-0">
                  <MapContainer 
                    center={[report.location.lat, report.location.lon]} 
                    zoom={14} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={[report.location.lat, report.location.lon]} />
                  </MapContainer>
                </div>
              ) : (
                <div className="w-full py-10 bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/40">
                  <span className="text-xs font-medium">Map data unavailable</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
            <motion.img 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              src={zoomedImage} 
              alt="Zoomed preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-zoom-out"
            />
            <button className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors">
              <Icons.X />
            </button>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

export default function UserReportPanel({ defaultTab, hideTabs } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlTab = queryParams.get('tab');
  
  // Tabs: 'create', 'my-submissions', 'my-area', 'all'
  const [activeTab, setActiveTab] = useState(defaultTab || urlTab || 'create');

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`?tab=${newTab}`, { replace: true });
  };
  
  const [allReports, setAllReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [areaReports, setAreaReports] = useState([]);
  const [areaSearchTerm, setAreaSearchTerm] = useState("");
  const [areaCategory, setAreaCategory] = useState("");
  const [areaSeverity, setAreaSeverity] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [form, setForm] = useState({ title: '', description: '', category: '', severity: '', location: null });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit & Delete State
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const fileInputRef = useRef(null);

  // Focus ref to scroll up when editing
  const topRef = useRef(null);

  const [filters, setFilters] = useState({ 
    search: queryParams.get('search') || '', 
    category: queryParams.get('category') || '', 
    severity: queryParams.get('severity') || '', 
    status: queryParams.get('status') || '' 
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.search) query.append('search', filters.search);
      if (filters.category) query.append('category', filters.category);
      if (filters.severity) query.append('severity', filters.severity);
      if (filters.status) query.append('status', filters.status);
      
      const qs = query.toString() ? `?${query.toString()}` : "";

      const allRes = await api.get(`/reports${qs}`);
      setAllReports(allRes.data);
      
      const myRes = await api.get(`/reports/my${qs}`);
      setMyReports(myRes.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'all' || activeTab === 'my-submissions') {
      fetchReports();
    }
    
    if (activeTab === 'my-area' && user?.location?.district) {
      setLoading(true);
      api.get(`/reports/my-area?district=${encodeURIComponent(user.location.district)}`)
        .then(res => setAreaReports(res.data.reports || res.data))
        .catch(err => {
          console.error("Failed to fetch area reports", err);
          toast.error("Failed to load district reports");
        })
        .finally(() => setLoading(false));
    }

    // Automatically leave edit mode if user switches to a different tab
    if (activeTab !== 'create' && editingId) {
      resetForm();
    }
  }, [activeTab, filters, user]);

  const resetForm = () => {
    setForm({ title: '', description: '', category: '', severity: '', location: null });
    setSelectedFiles([]);
    setFilePreviews([]);
    setExistingPhotos([]);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrent = existingPhotos.length + selectedFiles.length;
    
    if (totalCurrent + files.length > 3) {
      toast.error("You can only upload up to 3 photos total.");
      return;
    }

    const newSelected = [...selectedFiles, ...files];
    setSelectedFiles(newSelected);

    const previews = files.map(file => URL.createObjectURL(file));
    setFilePreviews([...filePreviews, ...previews]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    const newPreviews = [...filePreviews];
    newPreviews.splice(index, 1);
    setFilePreviews(newPreviews);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExistingPhoto = (index) => {
    const newExisting = [...existingPhotos];
    newExisting.splice(index, 1);
    setExistingPhotos(newExisting);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location || !form.location.lat) {
      toast.error("Please explicitly select a location on the map.");
      return;
    }
    
    if (!form.category || !form.severity) {
      toast.error("Please select both category and severity.");
      return;
    }

    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('severity', form.severity);
      formData.append('location', JSON.stringify({
        district: form.location.district,
        city: form.location.city,
        lat: form.location.lat,
        lon: form.location.lon
      }));

      // Only append new files
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      if (editingId) {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('category', form.category);
        formData.append('severity', form.severity);
        formData.append('location', JSON.stringify({
          district: form.location.district,
          city: form.location.city,
          lat: form.location.lat,
          lon: form.location.lon
        }));
        formData.append('existingPhotos', JSON.stringify(existingPhotos));

        selectedFiles.forEach(file => {
          formData.append('photos', file);
        });

        await api.put(`/reports/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Report updated successfully!");
      } else {
        await api.post('/reports', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Incident reported successfully!");
      }
      
      resetForm();
      fetchReports();
      handleTabChange('my-submissions');
      
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (report) => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    setEditingId(report._id);
    setForm({
      title: report.title,
      description: report.description,
      category: report.category,
      severity: report.severity,
      location: report.location
    });
    setExistingPhotos(report.photos || []);
    setFilePreviews([]);
    setSelectedFiles([]); 
    handleTabChange('create');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/reports/${deleteTarget._id}`);
      toast.success("Report cancelled");
      setDeleteTarget(null);
      fetchReports();
    } catch (err) {
      toast.error("Failed to cancel report");
    }
  };

  const filteredAreaReports = areaReports.filter(report => {
    let matchesSearch = true;
    if (areaSearchTerm) {
      const term = areaSearchTerm.toLowerCase();
      matchesSearch = (
        (report.title && report.title.toLowerCase().includes(term)) ||
        (report.description && report.description.toLowerCase().includes(term)) ||
        (report.location?.district && report.location.district.toLowerCase().includes(term)) ||
        (report.location?.city && report.location.city.toLowerCase().includes(term))
      );
    }
    
    const matchesCategory = areaCategory ? report.category === areaCategory : true;
    const matchesSeverity = areaSeverity ? report.severity === areaSeverity : true;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  // ─── Render ──────────────────────────────────────────────────────────────

  const F = "w-full bg-[#020617]/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500/40 transition-all duration-200";

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4" ref={topRef}>
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 bg-[linear-gradient(135deg,#020617,#0f172a)] border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] px-6 py-5">
        <div>
          <h2 className="text-white font-bold text-2xl tracking-tight">{hideTabs ? 'Feeds' : 'Report Management'}</h2>
          <p className="text-white/60 text-sm mt-1">{hideTabs ? 'Browse all verified environmental incident reports.' : 'Submit, view, and track environmental incidents in your area.'}</p>
        </div>
        
        {!hideTabs && (
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl shrink-0 self-start backdrop-blur-md">
          <button 
            onClick={() => { handleTabChange('create'); if(editingId) resetForm(); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${activeTab === 'create' ? 'bg-white/10 text-white border-white/10 shadow-sm' : 'bg-transparent text-white/60 border-transparent hover:bg-white/10'}`}
          >
            <Icons.Plus /> {editingId ? 'Edit Incident' : 'New Incident'}
          </button>
          <button 
            onClick={() => handleTabChange('my-submissions')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${activeTab === 'my-submissions' ? 'bg-white/10 text-white border-white/10 shadow-sm' : 'bg-transparent text-white/60 border-transparent hover:bg-white/10'}`}
          >
            <Icons.User /> My Submissions
          </button>
          <button 
            onClick={() => handleTabChange('my-area')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${activeTab === 'my-area' ? 'bg-white/10 text-white border-white/10 shadow-sm' : 'bg-transparent text-white/60 border-transparent hover:bg-white/10'}`}
          >
            <Icons.MapPin /> My Area Reports
          </button>
          <button 
            onClick={() => handleTabChange('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${activeTab === 'all' ? 'bg-white/10 text-white border-white/10 shadow-sm' : 'bg-transparent text-white/60 border-transparent hover:bg-white/10'}`}
          >
            <Icons.List /> All Reports
          </button>
        </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* CREATE / EDIT FORM */}
        {/* ========================================================= */}
        {activeTab === 'create' && (
          <motion.div 
            key="create-form"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {/* Navigation Back Button in Edit Mode */}
            {editingId && (
              <button 
                onClick={() => { resetForm(); handleTabChange('my-submissions'); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-2 transition-colors duration-200 font-medium group self-start"
              >
                <Icons.ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
                <span>Back to My Submissions</span>
              </button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
              {/* Form Card */}
              <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-bold text-lg">
                    {editingId ? 'Update Incident Details' : 'Incident Details'}
                  </h3>
                  {editingId && (
                    <button onClick={resetForm} className="text-xs text-white/40 hover:text-white bg-white/10 px-2 py-1 rounded">
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Incident Title *</label>
                    <input className={F} placeholder="e.g., Severe Flooding at Main St." value={form.title} onChange={e => setForm({...form, title: e.target.value})} required maxLength={100} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Disaster Type *</label>
                      <select className={F + ' appearance-none cursor-pointer'} value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                        <option value="" disabled hidden>Select Category</option>
                        {DISASTER_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#020617]">{c.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Severity *</label>
                      <select className={F + ' appearance-none cursor-pointer'} value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} required>
                        <option value="" disabled hidden>Select Severity</option>
                        {SEVERITIES.map(s => <option key={s} value={s} className="bg-[#020617]">{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Description *</label>
                    <textarea className={F + ' resize-none'} rows={4} placeholder="Describe what you observed, affected areas, and any urgent needs..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required minLength={10} maxLength={1000} />
                  </div>
                </form>
              </div>

              {/* Photos Card */}
              <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6">
                <div className="flex items-center justify-between mb-1 text-sm">
                  <h3 className="text-white font-bold text-lg">Photos</h3>
                  <span className="text-white/40 font-medium">{existingPhotos.length + filePreviews.length} / 3</span>
                </div>
                <p className="text-xs text-white/70 mb-4">Upload up to 3 images to help reviewers verify the situation.</p>
                
                {(existingPhotos.length + selectedFiles.length) < 3 && (
                  <label className="block w-full border-2 border-dashed border-white/10 bg-[#020617]/60 rounded-xl p-8 mb-4 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-[#020617]/80 transition-all group">
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} />
                    <div className="mx-auto w-10 h-10 mb-2 text-white/40 group-hover:text-cyan-400 transition-colors">
                      <Icons.Image />
                    </div>
                    <span className="text-sm font-semibold text-white/70 group-hover:text-cyan-400">Click to upload images</span>
                    <p className="text-xs text-white/40 mt-1">PNG, JPG up to 5MB</p>
                  </label>
                )}

                {(existingPhotos.length > 0 || filePreviews.length > 0) && (
                   <div className="flex flex-wrap gap-3">
                     {/* Existing Photos */}
                     {existingPhotos.map((url, i) => (
                       <div key={`existing-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 shadow-sm group">
                         <img src={url} alt="Existing" className="w-full h-full object-cover" />
                         <button onClick={() => removeExistingPhoto(i)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Icons.X />
                         </button>
                       </div>
                     ))}
                     
                     {/* New Previews */}
                     {filePreviews.map((preview, i) => (
                       <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 shadow-sm group">
                         <img src={preview} alt="New Preview" className="w-full h-full object-cover border-2 border-cyan-500" />
                         <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Icons.X />
                         </button>
                         <div className="absolute bottom-0 left-0 right-0 bg-cyan-600 text-[8px] text-white text-center font-bold py-0.5">NEW</div>
                       </div>
                     ))}
                   </div>
                )}
              </div>
            </div>

            {/* Right Column: Location & Submit */}
            <div className="space-y-6">
              <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6">
                <h3 className="text-white font-bold text-lg mb-1">Incident Location *</h3>
                <p className="text-xs text-white/70 mb-4">Click exactly where the incident occurred, or search for a nearby landmark.</p>
                
                <div className="rounded-xl border border-white/10 overflow-hidden shadow-inner bg-[#020617]/60">
                  <ProfileLocationMap initialLocation={form.location} onChange={loc => setForm({...form, location: loc})} />
                </div>
              </div>

              <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-white font-bold">Ready to submit?</p>
                  <p className="text-white/70 text-xs mt-0.5 w-48 truncate">Ensure all details are accurate.</p>
                </div>
                <button 
                  type="submit" 
                  form="report-form"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold shadow-lg shadow-cyan-900/50 transition-all duration-300 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  {submitting && (
                    <svg className="animate-spin -ml-1 h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  )}
                  {editingId ? 'Save Changes' : 'Submit Official Report'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        )}

        {/* ========================================================= */}
        {/* LISTINGS (MY / ALL / AREA) */}
        {/* ========================================================= */}
        {(activeTab === 'my-submissions' || activeTab === 'all' || activeTab === 'my-area') && (
          <motion.div 
            key={`list-${activeTab}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {activeTab !== 'my-area' && <SearchFilterBar onFilterChange={setFilters} showStatusFilter={activeTab === 'my-submissions'} />}
            
            {activeTab === 'my-area' && (
              <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] mb-6 flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">My Area Reports</h3>
                  <p className="text-white/60 text-sm mt-1">Reports in your district</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full mt-2">
                  <div className="relative flex-1 w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="w-[18px] h-[18px] text-white/40 group-focus-within:text-cyan-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={areaSearchTerm}
                      onChange={(e) => setAreaSearchTerm(e.target.value)}
                      placeholder="Search incidents by title, description, district, or city..."
                      className="w-full pl-10 pr-10 py-2.5 bg-transparent border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all duration-200"
                    />
                    {areaSearchTerm && (
                      <button 
                        onClick={() => setAreaSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                      >
                        <Icons.X />
                      </button>
                    )}
                  </div>

                  <div className="flex w-full md:w-auto gap-4">
                    <select
                      value={areaCategory}
                      onChange={(e) => setAreaCategory(e.target.value)}
                      className="flex-1 md:w-40 py-2.5 px-3 bg-[#020617] hover:bg-white/5 text-white border border-white/10 rounded-xl text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all cursor-pointer"
                    >
                      <option value="">All Categories</option>
                      <option value="FLOOD">Flood</option>
                      <option value="LANDSLIDE">Landslide</option>
                      <option value="HEATWAVE">Heatwave</option>
                      <option value="STORM">Storm</option>
                      <option value="AIR_QUALITY">Air Quality</option>
                      <option value="OTHER">Other</option>
                    </select>

                    <select
                      value={areaSeverity}
                      onChange={(e) => setAreaSeverity(e.target.value)}
                      className="flex-1 md:w-40 py-2.5 px-3 bg-[#020617] hover:bg-white/5 text-white border border-white/10 rounded-xl text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all cursor-pointer"
                    >
                      <option value="">All Severities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-[360px] bg-[linear-gradient(135deg,#020617,#0f172a)] rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col animate-pulse">
                    <div className="h-48 w-full bg-white/5" />
                    <div className="p-5 flex flex-col flex-1 gap-3">
                      <div className="flex justify-between gap-3">
                        <div className="h-4 w-3/4 bg-white/5 rounded-full" />
                        <div className="h-4 w-16 bg-white/5 rounded-full shrink-0" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-full bg-white/5 rounded-full" />
                        <div className="h-3 w-2/3 bg-white/5 rounded-full" />
                      </div>
                      <div className="h-px w-full bg-white/10 mt-auto" />
                      <div className="flex justify-between">
                        <div className="h-3 w-24 bg-white/5 rounded-full" />
                        <div className="h-3 w-16 bg-white/5 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {(activeTab === 'my-submissions' ? myReports : activeTab === 'my-area' ? filteredAreaReports : allReports).length === 0 ? (
                  <div className="text-center py-20 px-4 bg-[#020617]/60 rounded-2xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-white/40">
                      <Icons.List />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">No reports found</h3>
                    <p className="text-white/60 text-sm">
                      {activeTab === 'my-submissions' ? "You haven't submitted any incidents yet." : activeTab === 'my-area' ? (areaSearchTerm ? "No matching reports found" : "No reports found in your district.") : "There are no verified reports to display."}
                    </p>
                    {activeTab === 'my-submissions' && (
                      <button onClick={() => handleTabChange('create')} className="mt-6 text-cyan-400 font-semibold hover:underline text-sm">
                        Submit a new incident →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                     {(activeTab === 'my-submissions' ? myReports : activeTab === 'my-area' ? filteredAreaReports : allReports).map(report => (
                       <ReportCard 
                        key={report._id} 
                        report={report} 
                        isOwner={activeTab === 'my-submissions' || report.userId === user?.userId}
                         onClick={(r) => navigate(`/reports/${r._id}?tab=${activeTab}`, { 
                           state: { 
                             report: r, 
                             from: activeTab 
                           }
                         })}
                        onEdit={startEdit}
                        onDelete={setDeleteTarget}
                       />
                     ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* CANCEL/DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-white/10"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-4 mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 className="text-xl font-bold text-center text-white mb-2">Cancel Report?</h3>
            <p className="text-center text-white/60 text-sm mb-6">
              Are you sure you want to cancel and delete the report "<span className="font-semibold text-white">{deleteTarget.title}</span>"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 font-semibold rounded-xl text-sm transition-colors border border-white/10"
              >
                Go Back
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-red-900/50"
              >
                Yes, Cancel It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}