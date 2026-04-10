import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Image as ImageIcon, ChevronLeft, ChevronRight, Camera, X } from 'lucide-react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from '../contexts/AuthContext';
import CommentCard from '../components/feeds/CommentCard';
import toast from 'react-hot-toast';

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
  
  // Auth State
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);

  // Social Interaction State
  const [modalComments, setModalComments] = useState([]);
  const [modalCommentsPage, setModalCommentsPage] = useState(1);
  const [modalCommentsHasMore, setModalCommentsHasMore] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  // Image Upload States
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const commentsListRef = useRef(null);

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

  const fetchComments = async (reportId, page = 1) => {
    try {
      const res = await api.get(`/reports/${reportId}/comments?page=${page}&limit=10`);
      if (page === 1) {
        setModalComments(res.data.comments);
      } else {
        setModalComments(prev => [...prev, ...res.data.comments]);
      }
      setModalCommentsPage(page);
      setModalCommentsHasMore(res.data.hasMore);
    } catch (err) {
      if (err.response?.status === 401) {
        setModalComments([]);
      }
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedReport?._id) {
      fetchComments(selectedReport._id, 1);
    } else {
      setModalComments([]);
      setModalCommentsPage(1);
      setModalCommentsHasMore(false);
    }
    
    // Global listener for cross-component refreshes (e.g. from CommentCard reply)
    const handleRefresh = () => {
      if (selectedReport?._id) fetchComments(selectedReport._id, 1);
    };
    window.addEventListener('refreshComments', handleRefresh);
    return () => window.removeEventListener('refreshComments', handleRefresh);
  }, [selectedReport?._id]);

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

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to like reports");
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    if (isLiking || !selectedReport) return;

    setIsLiking(true);
    const originalReports = [...reports];
    const targetId = selectedReport._id;

    // Optimistic Update
    const hasLiked = selectedReport.likes?.includes(user._id);
    const newLikes = hasLiked ? (selectedReport.likes || []).filter(id => id !== user._id) : [...(selectedReport.likes || []), user._id];
    const newUnlikes = (selectedReport.unlikes || []).filter(id => id !== user._id);

    setReports(reports.map(r => r._id === targetId ? { ...r, likes: newLikes, unlikes: newUnlikes } : r));
    setSelectedReport(prev => prev ? { ...prev, likes: newLikes, unlikes: newUnlikes } : prev);

    try {
      await api.post(`/reports/${targetId}/like`);
    } catch (err) {
      // Rollback on fail
      setReports(originalReports);
      setSelectedReport(originalReports.find(r => r._id === targetId));
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleUnlike = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to interact with reports");
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    if (isLiking || !selectedReport) return;

    setIsLiking(true);
    const originalReports = [...reports];
    const targetId = selectedReport._id;

    // Optimistic Update
    const hasUnliked = selectedReport.unlikes?.includes(user._id);
    const newUnlikes = hasUnliked ? (selectedReport.unlikes || []).filter(id => id !== user._id) : [...(selectedReport.unlikes || []), user._id];
    const newLikes = (selectedReport.likes || []).filter(id => id !== user._id);

    setReports(reports.map(r => r._id === targetId ? { ...r, likes: newLikes, unlikes: newUnlikes } : r));
    setSelectedReport(prev => prev ? { ...prev, likes: newLikes, unlikes: newUnlikes } : prev);

    try {
      await api.post(`/reports/${targetId}/unlike`);
    } catch (err) {
      // Rollback
      setReports(originalReports);
      setSelectedReport(originalReports.find(r => r._id === targetId));
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      toast.error("Please sign in to comment");
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    
    if (!commentText.trim() && !selectedImage) return;
    if (isSubmitting) return;

    const formData = new FormData();
    if (commentText.trim()) formData.append("text", commentText.trim());
    if (selectedImage) formData.append("image", selectedImage);

    setIsSubmitting(true);
    // Note: We skip optimistic update for image-enhanced comments to ensure data integrity
    // although we could technically show a local blob URL if needed.

    try {
      const res = await api.post(`/reports/${selectedReport._id}/comment`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const newComment = res.data.comment;
      setModalComments(prev => [newComment, ...prev]);
      
      // Update counts
      const updateCount = (prev) => ({ ...prev, comments: [...(prev.comments || []), newComment] });
      setSelectedReport(prev => prev ? updateCount(prev) : prev);
      setReports(reports.map(r => r._id === selectedReport._id ? updateCount(r) : r));
      
      // Reset
      setCommentText("");
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <section className="max-w-7xl mx-auto px-6 py-16">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-16 relative">
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

                    {/* INTERACTION COUNTS (FEEDS GRID FOOTER) */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                      <span>❤️ {report.likes?.length || 0}</span>
                      <span>👎 {report.unlikes?.length || 0}</span>
                      <span>💬 {report.comments?.length || 0}</span>
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
              onWheel={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative bg-[#030712] border border-white/10 rounded-2xl max-w-5xl w-full mx-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 shadow-2xl my-auto max-h-[90vh]"
            >
              <button
                className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-white/60 hover:text-white hover:bg-black/80 transition-all text-lg"
                onClick={() => setSelectedReport(null)}
              >
                ✕
              </button>

              <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
                {/* IMAGE GALLERY (LEFT) */}
                <div className="w-full lg:w-1/2 relative bg-black flex items-center justify-center min-h-[300px] lg:min-h-full overflow-hidden">
                  {selectedReport.photos && selectedReport.photos.length > 0 ? (
                    <>
                      <img
                        src={selectedReport.photos[currentImage]}
                        alt={selectedReport.title}
                        loading="lazy"
                        className="max-h-[70vh] w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-black/30" />
                      
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
                <div className="w-full lg:w-1/2 p-6 lg:p-10 flex flex-col bg-[#030712] overflow-y-auto custom-scrollbar">
                  
                  {/* Badges */}
                  <div className="flex gap-2 mb-4">
                    <span className="bg-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-wider">
                      {selectedReport.category}
                    </span>
                    <span className={`text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider
                      ${selectedReport.severity === 'CRITICAL' ? 'bg-red-600' : 
                        selectedReport.severity === 'HIGH' ? 'bg-red-500' :
                        selectedReport.severity === 'MEDIUM' ? 'bg-yellow-500' :
                        'bg-green-500'}
                    `}>
                      {selectedReport.severity} SEVERITY
                    </span>
                  </div>

                  {/* Title & Meta */}
                  <h2 className="text-white text-2xl lg:text-3xl font-bold tracking-tight leading-tight mb-3">
                    {selectedReport.title}
                  </h2>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{selectedReport.location?.city || selectedReport.location?.district}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white/5 rounded-xl border border-white/10 p-5 shadow-inner mb-6 shrink-0">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Description</h3>
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
                      className="rounded-xl overflow-hidden border border-white/10 relative z-0 mb-6 shrink-0"
                    >
                      <MapContainer
                        center={[
                          selectedReport.location?.lat || selectedReport.location?.coordinates?.lat,
                          selectedReport.location?.lon || selectedReport.location?.coordinates?.lng || selectedReport.location?.lng || selectedReport.location?.coordinates?.lon
                        ]}
                        zoom={13}
                        scrollWheelZoom={false}
                        className="h-40 w-full"
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

                  {/* ACTION BAR (MODAL FEEDS) */}
                  <div className="flex gap-4 pt-6 border-t border-white/10 shrink-0">
                    <button 
                      disabled={isLiking}
                      onClick={handleLike} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50
                        ${selectedReport.likes?.includes(user?._id) ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5 hover:text-white"}`}
                    >
                      ❤️ Like <span className="opacity-70 font-normal">({selectedReport.likes?.length || 0})</span>
                    </button>
                    
                    <button 
                      disabled={isLiking}
                      onClick={handleUnlike} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50
                        ${selectedReport.unlikes?.includes(user?._id) ? "bg-gray-500/40 text-white border border-gray-500/50" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5 hover:text-white"}`}
                    >
                      👎 Unlike <span className="opacity-70 font-normal">({selectedReport.unlikes?.length || 0})</span>
                    </button>
                  </div>

                  {/* COMMENTS SECTION */}
                  <div className="mt-8 flex flex-col gap-5">
                    <h3 className="text-white font-bold text-lg">Comments <span className="text-gray-500 font-normal text-sm ml-1">({modalComments.length}{modalCommentsHasMore ? '+' : ''})</span></h3>
                    
                    {/* New comment input */}
                    <div className="flex gap-3 shrink-0">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs overflow-hidden font-bold">
                        {user?.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" alt="avatar"/> : user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <textarea 
                          placeholder={user ? "Write a comment..." : "Sign in to comment..."}
                          value={commentText}
                          onChange={(e) => {
                            if (!user) return;
                            setCommentText(e.target.value);
                          }}
                          onClick={(e) => {
                            if (!user) {
                              e.preventDefault();
                              toast.error("Please sign in to comment");
                              setTimeout(() => navigate("/login"), 1000);
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 resize-none transition-all min-h-[60px]"
                        />

                        {/* Image Preview Area */}
                        {imagePreview && (
                          <div className="relative w-fit mt-2 group">
                            <img src={imagePreview} className="h-24 rounded-xl border border-white/20 shadow-lg object-cover" />
                            <button
                              onClick={() => {
                                setSelectedImage(null);
                                setImagePreview(null);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-4">
                            <label htmlFor="comment-image-input" className="cursor-pointer text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-white/5">
                              <Camera className="w-5 h-5" />
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="comment-image-input"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error("Image must be less than 5MB");
                                  return;
                                }
                                setSelectedImage(file);
                                setImagePreview(URL.createObjectURL(file));
                              }}
                            />
                          </div>

                          <button 
                            disabled={isSubmitting || (!commentText.trim() && !selectedImage) || !user} 
                            onClick={handleComment} 
                            className="px-5 py-2 rounded-lg bg-cyan-600 text-white text-sm font-bold shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shrink-0"
                          >
                            {isSubmitting ? "Posting..." : "Post"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comments List — Flat-Threaded Grouping */}
                    <div className="space-y-6 overflow-y-auto pr-1 pb-6" ref={commentsListRef} style={{ maxHeight: '420px' }}>
                      <AnimatePresence mode="popLayout">
                        {modalComments.length === 0 ? (
                          <div className="text-center py-8 text-gray-600 text-sm">
                            Be the first to comment on this report.
                          </div>
                        ) : (
                          // ROOT COMMENTS: ParentId is null, sorted Newest First
                          modalComments
                            .filter(c => !c.parentId)
                            .map((comment) => {
                              // REPLIES for this root: Match by parentId, sorted Oldest First
                              const replies = modalComments
                                .filter(r => r.parentId === comment._id)
                                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                              return (
                                <div key={comment._id} className="space-y-4">
                                  <CommentCard
                                    comment={comment}
                                    reportId={selectedReport._id}
                                    currentUser={user}
                                    onDelete={(deletedId) => {
                                      // Recursive delete handled by backend, but we clean frontend state
                                      setModalComments(prev => prev.filter(c => c._id !== deletedId && c.parentId !== deletedId));
                                      
                                      const updateCount = (prev) => {
                                        if (!prev) return prev;
                                        const remaining = (prev.comments || []).slice(0, -1);
                                        return { ...prev, comments: remaining };
                                      };
                                      setSelectedReport(prev => updateCount(prev));
                                      setReports(prev => prev.map(r => r._id === selectedReport._id ? updateCount(r) : r));
                                    }}
                                  />
                                  
                                  {/* Indented Replies */}
                                  {replies.length > 0 && (
                                    <div className="ml-10 space-y-3 border-l-2 border-white/5 pl-4">
                                      {replies.map(reply => (
                                        <CommentCard
                                          key={reply._id}
                                          comment={reply}
                                          isReply
                                          reportId={selectedReport._id}
                                          currentUser={user}
                                          onDelete={(deletedId) => {
                                            setModalComments(prev => prev.filter(c => c._id !== deletedId));
                                            const updateCount = (prev) => {
                                              if (!prev) return prev;
                                              return { ...prev, comments: (prev.comments || []).slice(0, -1) };
                                            };
                                            setSelectedReport(prev => updateCount(prev));
                                            setReports(prev => prev.map(r => r._id === selectedReport._id ? updateCount(r) : r));
                                          }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                        )}
                      </AnimatePresence>

                      {modalCommentsHasMore && (
                        <div className="pt-2">
                          <button 
                            onClick={() => fetchComments(selectedReport._id, modalCommentsPage + 1)} 
                            className="text-cyan-400 font-medium text-xs w-full text-center hover:text-cyan-300 hover:underline transition-all"
                          >
                            Load more comments
                          </button>
                        </div>
                      )}
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