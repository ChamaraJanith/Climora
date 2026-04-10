import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Camera, X, MessageSquare, ThumbsUp, ThumbsDown, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';

/* ─────────────────────────────────────────────
   AVATAR helper
───────────────────────────────────────────── */
function Avatar({ user, size = "w-8 h-8" }) {
  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={user.username}
        className={`${size} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {user?.username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN CommentCard
───────────────────────────────────────────── */
export default function CommentCard({ 
  comment: initialComment, 
  reportId, 
  currentUser, 
  onDelete,
  isReply = false 
}) {
  const navigate = useNavigate();
  const [comment, setComment] = useState({
    ...initialComment,
    likes: initialComment.likes || [],
    unlikes: initialComment.unlikes || []
  });

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Reply state
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const replyInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Interaction state
  const [isActing, setIsActing] = useState(false);

  const isOwner = currentUser && (comment.user?._id?.toString() === currentUser._id?.toString() || comment.user?.userId === currentUser.userId);
  const hasLiked = currentUser && (comment.likes || []).some(id => id?.toString() === currentUser._id?.toString());
  const hasUnliked = currentUser && (comment.unlikes || []).some(id => id?.toString() === currentUser._id?.toString());

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Image must be less than 5MB");
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const requireAuth = (action) => {
    if (!currentUser) {
      toast.error(`Please sign in to ${action}`);
      setTimeout(() => navigate('/login'), 1200);
      return false;
    }
    return true;
  };

  // Auto-focus reply input
  useEffect(() => {
    if (showReplyInput && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyInput]);

  /* ── EDIT ── */
  const handleSaveEdit = async () => {
    if (!editText.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await api.put(`/reports/${reportId}/comments/${comment._id}`, { text: editText.trim() });
      setComment(prev => ({ ...prev, text: editText.trim(), updatedAt: new Date().toISOString() }));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api.delete(`/reports/${reportId}/comments/${comment._id}`);
      onDelete(comment._id);
    } catch (err) {
      console.error(err);
    }
  };

  /* ── REPLY ── */
  const handlePostReply = async () => {
    if (!requireAuth("reply")) return;
    if ((!replyText.trim() && !selectedImage) || isPostingReply) return;
    
    setIsPostingReply(true);
    const formData = new FormData();
    if (replyText.trim()) formData.append('text', replyText.trim());
    if (selectedImage) formData.append('image', selectedImage);

    try {
      await api.post(`/reports/${reportId}/comments/${comment._id}/reply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setReplyText('');
      removeImage();
      setShowReplyInput(false);
      window.dispatchEvent(new CustomEvent('refreshComments')); 
      toast.success("Reply posted!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to post reply");
    } finally {
      setIsPostingReply(false);
    }
  };

  /* ── COMMENT LIKE ── */
  const handleCommentLike = async () => {
    if (!requireAuth("like comments")) return;
    if (isActing) return;
    setIsActing(true);

    const prevLikes = [...(comment.likes || [])];
    const prevUnlikes = [...(comment.unlikes || [])];
    
    const hasLikedNow = prevLikes.some(id => id?.toString() === currentUser._id?.toString());
    const newLikes = hasLikedNow ? prevLikes.filter(id => id?.toString() !== currentUser._id?.toString()) : [...prevLikes, currentUser._id];
    const newUnlikes = prevUnlikes.filter(id => id?.toString() !== currentUser._id?.toString());

    setComment(prev => ({ ...prev, likes: newLikes, unlikes: newUnlikes }));

    try {
      await api.post(`/reports/${reportId}/comments/${comment._id}/like`);
    } catch (err) {
      setComment(prev => ({ ...prev, likes: prevLikes, unlikes: prevUnlikes }));
      console.error(err);
    } finally {
      setIsActing(false);
    }
  };

  /* ── COMMENT UNLIKE ── */
  const handleCommentUnlike = async () => {
    if (!requireAuth("unlike comments")) return;
    if (isActing) return;
    setIsActing(true);

    const prevLikes = [...(comment.likes || [])];
    const prevUnlikes = [...(comment.unlikes || [])];
    
    const hasUnlikedNow = prevUnlikes.some(id => id?.toString() === currentUser._id?.toString());
    const newUnlikes = hasUnlikedNow ? prevUnlikes.filter(id => id?.toString() !== currentUser._id?.toString()) : [...prevUnlikes, currentUser._id];
    const newLikes = prevLikes.filter(id => id?.toString() !== currentUser._id?.toString());

    setComment(prev => ({ ...prev, likes: newLikes, unlikes: newUnlikes }));

    try {
      await api.post(`/reports/${reportId}/comments/${comment._id}/unlike`);
    } catch (err) {
      setComment(prev => ({ ...prev, likes: prevLikes, unlikes: prevUnlikes }));
      console.error(err);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 group relative w-full ${isReply ? 'animate-in fade-in slide-in-from-left-2 duration-300' : ''}`}
    >
      <Avatar user={comment.user} />

      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className={`
          border rounded-2xl rounded-tl-sm px-4 py-3 shadow-md transition-all duration-300
          ${isOwner ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-white/[0.04] border-white/10'}
          group-hover:border-white/20
        `}>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-bold tracking-tight ${isOwner ? 'text-cyan-400' : 'text-white/90'}`}>
                {comment.user?.username || 'Climora User'}
              </p>
              {isOwner && (
                <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">You</span>
              )}
              {comment.updatedAt && (
                <span className="text-[10px] text-gray-500 italic">edited</span>
              )}
            </div>

            {/* Owner controls */}
            {isOwner && !isEditing && (
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setIsEditing(true); setEditText(comment.text); }}
                  className="text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                autoFocus
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-cyan-500/50 min-h-[80px]"
              />
              <div className="flex gap-2">
                <button
                  disabled={isSavingEdit}
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-600/20"
                >
                  {isSavingEdit ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                {comment.text}
              </p>
              {comment.image && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/40"
                >
                  <img
                    src={comment.image}
                    alt="Comment attachment"
                    className="max-h-60 w-full object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-500"
                    onClick={() => window.open(comment.image, '_blank')}
                  />
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-5 mt-2 ml-1 text-gray-500 select-none">
          <button
            disabled={isActing}
            onClick={handleCommentLike}
            className={`flex items-center gap-1.5 text-[11px] font-bold transition-all hover:scale-110 active:scale-90 ${hasLiked ? 'text-red-500' : 'hover:text-red-400'}`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
            <span>{(comment.likes || []).length}</span>
          </button>
          
          <button
            disabled={isActing}
            onClick={handleCommentUnlike}
            className={`flex items-center gap-1.5 text-[11px] font-bold transition-all hover:scale-110 active:scale-90 ${hasUnliked ? 'text-white' : 'hover:text-white'}`}
          >
            <ThumbsDown className={`w-3.5 h-3.5 ${hasUnliked ? 'fill-current' : ''}`} />
            <span>{(comment.unlikes || []).length}</span>
          </button>

          {!isReply && (
            <button
              onClick={() => {
                if (!requireAuth("reply")) return;
                setShowReplyInput(v => !v);
              }}
              className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors ${showReplyInput ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Reply
            </button>
          )}

          <span className="text-[10px] text-gray-600 font-medium">
            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Reply input */}
        <AnimatePresence>
          {showReplyInput && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3"
            >
              <div className="flex items-center gap-2">
                <Avatar user={currentUser} size="w-6 h-6" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Replying to discussion</span>
              </div>
              
              <div className="flex flex-col gap-2">
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-500/50 transition-all shadow-inner"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostReply(); }}}
                />
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative group w-24 h-24 mt-1">
                    <img src={imagePreview} className="w-full h-full object-cover rounded-lg border border-white/20" alt="preview" />
                    <button 
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-cyan-400 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    {selectedImage ? 'Image attached' : 'Add Image'}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept="image/*" 
                    onChange={handleImageChange} 
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReplyInput(false)}
                      className="px-4 py-1.5 rounded-lg text-gray-500 text-[11px] font-bold hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isPostingReply || !replyText.trim()}
                      onClick={handlePostReply}
                      className="px-6 py-1.5 rounded-lg bg-cyan-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-cyan-500 disabled:opacity-40 transition-all shadow-lg shadow-cyan-600/30"
                    >
                      {isPostingReply ? 'Posting...' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}