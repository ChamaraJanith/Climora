import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import ProfileLocationMap from '../ui/ProfileLocationMap';
import { useAuth } from '../../contexts/AuthContext';

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
  ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
};

// ─── Sub-Components ────────────────────────────────────────────────────────

const ReportCard = ({ report, onEdit, onDelete, onClick, isOwner }) => {
  const catColor = CAT_COLORS[report.category] || CAT_COLORS.OTHER;
  const sevColor = SEV_COLORS[report.severity] || SEV_COLORS.LOW;
  const statusColor = STATUS_COLORS[report.status] || STATUS_COLORS.PENDING;
  
  return (
    <motion.div 
      onClick={() => onClick(report)}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full cursor-pointer hover:border-blue-200"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider" style={{ backgroundColor: `${catColor}15`, color: catColor, borderColor: `${catColor}30` }}>
            {report.category}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase text-white tracking-wider" style={{ backgroundColor: sevColor }}>
            {report.severity}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded border tracking-wider" style={{ backgroundColor: `${statusColor}10`, color: statusColor, borderColor: statusColor }}>
          {report.status.replace('_', ' ')}
        </span>
      </div>

      <h3 className="text-gray-900 font-bold text-lg leading-tight mb-2 flex-grow line-clamp-1">{report.title}</h3>
      <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow">{report.description}</p>

      {report.photos && report.photos.length > 0 && (
        <div className="flex gap-2 mb-4">
          {report.photos.slice(0, 3).map((url, i) => (
            <div key={i} className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
              <img src={url} alt="Incident" className="w-full h-full object-cover" />
            </div>
          ))}
          {report.photos.length > 3 && (
            <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500 font-medium">
              +{report.photos.length - 3}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Icons.MapPin />
          <span className="truncate max-w-[150px]">
            {report.location?.city ? `${report.location.city}, ` : ''}{report.location?.district || 'Unknown Location'}
          </span>
        </div>
        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
      </div>

      {isOwner && report.status === 'PENDING' && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(report); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
          >
            <Icons.Edit /> Edit
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(report); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
          >
            <Icons.Trash /> Cancel
          </button>
        </div>
      )}
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-3xl border border-gray-200 shadow-2xl my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 rounded-t-2xl">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg"
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
                <span className="text-gray-400 text-xs ml-auto font-medium">
                  {new Date(report.createdAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-gray-900 font-extrabold text-2xl leading-tight mb-2">
                {report.title}
              </h2>
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <Icons.MapPin />
                {report.location?.city ? `${report.location.city}, ` : ''}{report.location?.district || 'Unknown Location'}
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Description</h4>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{report.description}</p>
            </div>

            {/* Images Grid */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Incident Photos</h4>
              {report.photos && report.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {report.photos.map((url, i) => (
                    <button 
                      key={i} 
                      onClick={() => setZoomedImage(url)}
                      className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 hover:ring-2 hover:ring-blue-400 transition-all cursor-zoom-in"
                    >
                      <img src={url} alt={`Incident photo ${i+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="w-full py-10 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                  <Icons.Image />
                  <span className="text-xs font-medium mt-2">No photos attached</span>
                </div>
              )}
            </div>

            {/* Map Integration */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Exact Location</h4>
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
                <div className="w-full py-10 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
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

export default function UserReportPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Tabs: 'create', 'my', 'all'
  const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'create');
  
  const [allReports, setAllReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [form, setForm] = useState({ title: '', description: '', category: '', severity: '', location: null });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit & Delete State
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const fileInputRef = useRef(null);

  // Focus ref to scroll up when editing
  const topRef = useRef(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // All verified reports
      const allRes = await api.get('/reports');
      setAllReports(allRes.data);
      
      // My submissions
      const myRes = await api.get('/reports/my');
      setMyReports(myRes.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'all' || activeTab === 'my') {
      fetchReports();
    }
  }, [activeTab]);

  const resetForm = () => {
    setForm({ title: '', description: '', category: '', severity: '', location: null });
    setSelectedFiles([]);
    setFilePreviews([]);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 3) {
      toast.error("You can only upload up to 3 photos.");
      return;
    }

    const newSelected = [...selectedFiles, ...files].slice(0, 3);
    setSelectedFiles(newSelected);

    const previews = newSelected.map(file => URL.createObjectURL(file));
    setFilePreviews(previews);
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
        // IMPORTANT: The backend API uses JSON for PUT update body in the current implementation.
        // It does not accept FormData for updates if we respect standard controller logic, 
        // BUT wait, does PUT accept photos? The backend controller for updateReport does not handle files.
        // It simply does Object.assign(report, req.body). So photos won't update on PUT.
        // That's fine, we will just send standard JSON for Edit (disabling photo update).
        await api.put(`/reports/${editingId}`, {
          title: form.title,
          description: form.description,
          category: form.category,
          severity: form.severity,
          location: {
            district: form.location.district,
            city: form.location.city,
            lat: form.location.lat,
            lon: form.location.lon
          }
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
      setActiveTab('my');
      
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
    // Can't edit existing photos easily since it's just URLs and backend PUT doesn't handle multer.
    setFilePreviews(report.photos || []);
    setSelectedFiles([]); 
    setActiveTab('create');
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

  // ─── Render ──────────────────────────────────────────────────────────────

  const F = "w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all duration-200 hover:border-gray-300";

  return (
    <div className="max-w-5xl" ref={topRef}>
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-gray-900 font-black text-2xl tracking-tight">Report Management</h2>
          <p className="text-gray-500 text-sm mt-1">Submit, view, and track environmental incidents in your area.</p>
        </div>
        
        <div className="flex p-1 bg-gray-100 rounded-xl shrink-0 self-start">
          <button 
            onClick={() => { setActiveTab('create'); if(editingId) resetForm(); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Icons.Plus /> {editingId ? 'Edit Incident' : 'New Incident'}
          </button>
          <button 
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'my' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Icons.User /> My Submissions
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Icons.List /> All Reports
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* CREATE / EDIT FORM */}
        {/* ========================================================= */}
        {activeTab === 'create' && (
          <motion.div 
            key="create-form"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="space-y-6">
              {/* Form Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-gray-900 font-bold text-lg">
                    {editingId ? 'Update Incident Details' : 'Incident Details'}
                  </h3>
                  {editingId && (
                    <button onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-800 bg-gray-100 px-2 py-1 rounded">
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Incident Title *</label>
                    <input className={F} placeholder="e.g., Severe Flooding at Main St." value={form.title} onChange={e => setForm({...form, title: e.target.value})} required maxLength={100} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Disaster Type *</label>
                      <select className={F + ' appearance-none cursor-pointer'} value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                        <option value="" disabled hidden>Select Category</option>
                        {DISASTER_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Severity *</label>
                      <select className={F + ' appearance-none cursor-pointer'} value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} required>
                        <option value="" disabled hidden>Select Severity</option>
                        {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Description *</label>
                    <textarea className={F + ' resize-none'} rows={4} placeholder="Describe what you observed, affected areas, and any urgent needs..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required minLength={10} maxLength={1000} />
                  </div>
                </form>
              </div>

              {/* Photos Card - Hidden on edit mode since API might not support updating files */}
              <div className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${editingId ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <h3 className="text-gray-900 font-bold text-lg">Photos</h3>
                  <span className="text-gray-400 font-medium">{filePreviews.length} / 3</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">{editingId ? 'Changing photos during edit is not currently supported.' : 'Upload up to 3 images to help reviewers verify the situation.'}</p>
                
                {!editingId && selectedFiles.length < 3 && (
                  <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 mb-4 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-500 transition-all group">
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} />
                    <div className="mx-auto w-10 h-10 mb-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <Icons.Image />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 group-hover:text-blue-600">Click to upload images</span>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                  </label>
                )}

                {filePreviews.length > 0 && (
                   <div className="flex flex-wrap gap-3">
                     {filePreviews.map((preview, i) => (
                       <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
                         <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                         {!editingId && (
                           <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Icons.X />
                           </button>
                         )}
                       </div>
                     ))}
                   </div>
                )}
              </div>
            </div>

            {/* Right Column: Location & Submit */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-gray-900 font-bold text-lg mb-1">Incident Location *</h3>
                <p className="text-xs text-gray-500 mb-4">Click exactly where the incident occurred, or search for a nearby landmark.</p>
                
                <div className="rounded-xl border border-gray-200 overflow-hidden shadow-inner bg-gray-50">
                  <ProfileLocationMap initialLocation={form.location} onChange={loc => setForm({...form, location: loc})} />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 flex items-center justify-between shadow-sm">
                <div className="text-sm">
                  <p className="text-gray-900 font-bold">Ready to submit?</p>
                  <p className="text-gray-500 text-xs mt-0.5 w-48 truncate">Ensure all details are accurate.</p>
                </div>
                <button 
                  type="submit" 
                  form="report-form"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-200 transition-all duration-300 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
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
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* LISTINGS (MY / ALL) */}
        {/* ========================================================= */}
        {(activeTab === 'my' || activeTab === 'all') && (
          <motion.div 
            key={`list-${activeTab}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-56 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="h-4 w-1/3 bg-gray-100 rounded mb-4 animate-pulse"></div>
                    <div className="h-6 w-3/4 bg-gray-100 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-100 rounded mb-1 animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-gray-100 rounded mb-6 animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-50 rounded mt-auto animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {(activeTab === 'my' ? myReports : allReports).length === 0 ? (
                  <div className="text-center py-20 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Icons.List />
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg mb-1">No reports found</h3>
                    <p className="text-gray-500 text-sm">
                      {activeTab === 'my' ? "You haven't submitted any incidents yet." : "There are no verified reports to display."}
                    </p>
                    {activeTab === 'my' && (
                      <button onClick={() => setActiveTab('create')} className="mt-6 text-blue-600 font-semibold hover:underline text-sm">
                        Submit a new incident →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                     {(activeTab === 'my' ? myReports : allReports).map(report => (
                       <ReportCard 
                        key={report._id} 
                        report={report} 
                        isOwner={activeTab === 'my' || report.userId === user?.userId}
                         onClick={(r) => navigate(`/reports/${r._id}`, { 
                           state: { 
                             report: r, 
                             from: activeTab === 'my' ? 'my-reports' : 'all-reports' 
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-gray-100"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Cancel Report?</h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              Are you sure you want to cancel and delete the report "<span className="font-semibold text-gray-700">{deleteTarget.title}</span>"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm transition-colors border border-gray-200"
              >
                Go Back
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-red-200"
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
