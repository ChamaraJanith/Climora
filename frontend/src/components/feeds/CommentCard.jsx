import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

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
   REPLY ROW  (1-level deep, no sub-replies)
───────────────────────────────────────────── */
function ReplyRow({ reply }) {
  return (
    <div className="flex gap-2 mt-2">
      <Avatar user={reply.user} size="w-6 h-6" />
      <div className="bg-white/5 border border-white/[0.06] rounded-xl rounded-tl-sm px-3 py-2 flex-1">
        <p className="text-[11px] font-bold text-white/80 mb-0.5">
          {reply.user?.username || 'Climora User'}
        </p>
        <p className="text-xs text-gray-300 leading-relaxed">{reply.text}</p>
        <p className="text-[10px] text-gray-600 mt-1">
          {new Date(reply.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN CommentCard
───────────────────────────────────────────── */
export default function CommentCard({ comment: initialComment, reportId, currentUser, onDelete }) {
  const navigate = useNavigate();
  const [comment, setComment] = useState({
    ...initialComment,
    likes: initialComment.likes || [],
    unlikes: initialComment.unlikes || [],
    replies: initialComment.replies || []
  });

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Reply state
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isPosingReply, setIsPostingReply] = useState(false);
  const replyInputRef = useRef(null);

  // Interaction state
  const [isActing, setIsActing] = useState(false);

  const isOwner = currentUser && comment.user?._id?.toString() === currentUser._id?.toString();
  const hasLiked = currentUser && (comment.likes || []).some(id => id?.toString() === currentUser._id?.toString());
  const hasUnliked = currentUser && (comment.unlikes || []).some(id => id?.toString() === currentUser._id?.toString());

  // Auto-focus reply input
  useEffect(() => {
    if (showReplyInput && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyInput]);

  const requireAuth = (action) => {
    if (!currentUser) {
      alert("Please sign in to interact");
      navigate('/login');
      return false;
    }
    return true;
  };

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
    if (!requireAuth()) return;
    if (!replyText.trim() || isPosingReply) return;
    setIsPostingReply(true);
    try {
      const res = await api.post(`/reports/${reportId}/comments/${comment._id}/reply`, { text: replyText.trim() });
      const newReply = {
        ...res.data.reply,
        user: { _id: currentUser._id, username: currentUser.username, profileImage: currentUser.profileImage }
      };
      setComment(prev => ({ ...prev, replies: [...(prev.replies || []), newReply] }));
      setReplyText('');
      setShowReplyInput(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPostingReply(false);
    }
  };

  /* ── COMMENT LIKE ── */
  const handleCommentLike = async () => {
    if (!requireAuth()) return;
    if (isActing) return;
    setIsActing(true);

    // Optimistic
    const prevLikes = comment.likes || [];
    const prevUnlikes = comment.unlikes || [];
    
    setComment(prev => ({
      ...prev,
      likes: (prev.likes || []).some(id => id?.toString() === currentUser._id?.toString())
        ? (prev.likes || []).filter(id => id?.toString() !== currentUser._id?.toString())
        : [...(prev.likes || []), currentUser._id],
      unlikes: (prev.unlikes || []).filter(id => id?.toString() !== currentUser._id?.toString())
    }));

    try {
      await api.post(`/reports/${reportId}/comments/${comment._id}/like`);
    } catch (err) {
      // Rollback
      setComment(prev => ({ ...prev, likes: prevLikes, unlikes: prevUnlikes }));
      console.error(err);
    } finally {
      setIsActing(false);
    }
  };

  /* ── COMMENT UNLIKE ── */
  const handleCommentUnlike = async () => {
    if (!requireAuth()) return;
    if (isActing) return;
    setIsActing(true);

    const prevLikes = comment.likes || [];
    const prevUnlikes = comment.unlikes || [];
    
    setComment(prev => ({
      ...prev,
      unlikes: (prev.unlikes || []).some(id => id?.toString() === currentUser._id?.toString())
        ? (prev.unlikes || []).filter(id => id?.toString() !== currentUser._id?.toString())
        : [...(prev.unlikes || []), currentUser._id],
      likes: (prev.likes || []).filter(id => id?.toString() !== currentUser._id?.toString())
    }));

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
      className="flex gap-3 group relative"
    >
      <Avatar user={comment.user} />

      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className="bg-white/[0.06] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white/90 group-hover:text-cyan-400 transition-colors">
                {comment.user?.username || 'Climora User'}
              </p>
              {comment.updatedAt && (
                <span className="text-[10px] text-gray-600 italic">Edited</span>
              )}
            </div>

            {/* Owner controls */}
            {isOwner && !isEditing && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setIsEditing(true); setEditText(comment.text); }}
                  className="text-[11px] text-gray-400 hover:text-cyan-400 font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-[11px] text-gray-400 hover:text-red-400 font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Body: view or edit mode */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white resize-none focus:outline-none focus:border-cyan-500/50 min-h-[60px]"
              />
              <div className="flex gap-2">
                <button
                  disabled={isSavingEdit}
                  onClick={handleSaveEdit}
                  className="px-3 py-1 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 disabled:opacity-50 transition-all"
                >
                  {isSavingEdit ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-lg bg-white/10 text-gray-300 text-xs font-bold hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {comment.text}
            </p>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-4 mt-1.5 ml-1 select-none">
          <button
            disabled={isActing}
            onClick={handleCommentLike}
            className={`flex items-center gap-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${hasLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
          >
            👍 {comment.likes?.length || 0}
          </button>
          <button
            disabled={isActing}
            onClick={handleCommentUnlike}
            className={`flex items-center gap-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${hasUnliked ? 'text-blue-400' : 'text-gray-500 hover:text-blue-400'}`}
          >
            👎 {comment.unlikes?.length || 0}
          </button>
          <button
            onClick={() => {
              if (!requireAuth()) return;
              setShowReplyInput(v => !v);
            }}
            className="text-[11px] font-semibold text-gray-500 hover:text-cyan-400 transition-colors"
          >
            Reply
          </button>
          <span className="text-[10px] text-gray-600 ml-1">
            {new Date(comment.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>

        {/* Reply input */}
        <AnimatePresence>
          {showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 ml-2 flex gap-2 overflow-hidden"
            >
              <Avatar user={currentUser} size="w-6 h-6" />
              <div className="flex-1 flex gap-2">
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 resize-none focus:outline-none focus:border-cyan-500/50 transition-all"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostReply(); }}}
                />
                <button
                  disabled={isPosingReply || !replyText.trim()}
                  onClick={handlePostReply}
                  className="px-3 py-1 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 disabled:opacity-40 transition-all shrink-0 self-start mt-0.5"
                >
                  {isPosingReply ? '…' : 'Post'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Threaded replies */}
        {comment.replies?.length > 0 && (
          <div className="ml-2 mt-2 space-y-1 border-l-2 border-white/[0.06] pl-3">
            {comment.replies.map((reply, i) => (
              <ReplyRow key={reply._id || i} reply={reply} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}