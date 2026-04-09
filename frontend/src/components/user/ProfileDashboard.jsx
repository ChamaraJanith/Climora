import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, MapPin, Camera, Save, X, Bell, Loader2 } from 'lucide-react';
import api from '../../services/api';
import ProfileLocationMap from '../ui/ProfileLocationMap';

const ProfileDashboard = ({ user, onUserUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState(null);
  const [usernameErr, setUsernameErr] = useState("");
  const [imgPreview, setImgPreview] = useState(null);

  // Fetch fresh profile on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/profile");
        const u = res.data.user;
        setProfile(u);
        setUsername(u.username || "");
        setLocation(u.location?.lat ? u.location : null);
      } catch (e) {
        if (user) {
          setUsername(user.username || "");
          setLocation(user.location?.lat ? user.location : null);
        }
      }
    })();
  }, [user]);

  const displayUser = profile || user;

  const roleColors = {
    ADMIN: "bg-red-100 text-red-700 border-red-200",
    SHELTER_MANAGER: "bg-orange-100 text-orange-700 border-orange-200",
    CONTENT_MANAGER: "bg-purple-100 text-purple-700 border-purple-200",
    USER: "bg-cyan-100 text-cyan-800 border-cyan-200",
  };

  const initials = (displayUser?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarSrc = imgPreview || displayUser?.profileImage || null;
  const notifications = Array.isArray(displayUser?.notifications) ? displayUser.notifications : [];

  // Photo upoad logic
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.put("/users/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = res.data.user;
      setProfile(updated);
      setImgPreview(null);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...updated }));
      onUserUpdate?.(updated);
    } catch (err) {
      setImgPreview(null);
      setUsernameErr(err?.response?.data?.message || "Photo upload failed.");
    }
    setUploading(false);
    if (e.target) e.target.value = "";
  };

  // Profile save logic
  const handleSave = async () => {
    if (!username.trim() || username.trim().length < 3) {
      setUsernameErr("Username must be at least 3 characters.");
      return;
    }
    setUsernameErr("");
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", {
        username: username.trim(),
        location: location || undefined,
      });
      const updated = res.data.user;
      setProfile(updated);
      setLocation(updated.location?.lat ? updated.location : null);
      
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...updated }));
      
      onUserUpdate?.(updated);
      setEditing(false); // Close Modal
    } catch (err) {
      setUsernameErr(err?.response?.data?.message || "Failed to save. Please try again.");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setUsername(displayUser?.username || "");
    setLocation(displayUser?.location?.lat ? displayUser.location : null);
    setUsernameErr("");
    setEditing(false); // Close Modal
  };

  return (
    <div className="max-w-[700px] w-full mx-auto pb-10">
      {/* ── Dashboard Top Controls ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-gray-900 font-bold text-2xl">My Account</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your personal information and preferences.</p>
        </div>
      </div>

      {/* ── Main Profile Header Card ── */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/40 overflow-hidden mb-6 relative">
        {/* Gradient Header */}
        <div className="h-36 w-full bg-gradient-to-r from-blue-500 to-cyan-500 relative">
          {/* Active Badge */}
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 border border-green-200 animate-pulse"></span>
            Online
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="avatar-upload"
          onChange={handlePhotoChange}
        />

        {/* Content Profile Section */}
        <div className="px-6 pb-6 pt-16 relative">
          
          {/* Overlapping Avatar */}
          <div className="absolute -top-12 left-6">
            <div className="relative group w-24 h-24 rounded-full border-4 border-white shadow-xl shadow-blue-500/10 overflow-hidden bg-blue-600 flex items-center justify-center transition-transform duration-300 hover:scale-105">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{initials}</span>
              )}

              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200"
              >
                <Camera className="w-6 h-6 text-white" />
              </label>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            
            {/* User Details */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 leading-tight flex items-center gap-2">
                {displayUser?.username}
              </h3>
              <p className="text-gray-500 text-sm font-medium mt-1">{displayUser?.email}</p>
              
              <div className="mt-3">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border tracking-widest uppercase shadow-sm ${roleColors[displayUser?.role] || roleColors.USER}`}>
                  {displayUser?.role || "USER"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2 md:mt-0">
              <label
                htmlFor="avatar-upload"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-semibold cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4" /> Change Photo
              </label>

              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        
        {/* ── Notifications Box ── */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" /> Notifications
              </h3>
              <p className="text-gray-500 text-xs mt-1">Messages sent by shelter managers near you.</p>
            </div>
            {notifications.length > 0 && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{notifications.length} total</span>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
                <Bell className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-700">No notifications yet.</p>
                <p className="text-xs text-gray-500 mt-1">You’ll see important shelter alerts here.</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((note, idx) => (
                <div key={`${note.shelterId}-${note.createdAt}-${idx}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{note.title}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{note.shelterName || note.shelterId}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${note.read ? 'text-gray-500 bg-gray-200' : 'text-emerald-700 bg-emerald-100'}`}>
                      {note.read ? 'Read' : 'New'}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-600 mt-3 leading-relaxed">{note.message}</p>
                  {note.createdAt && (
                     <p className="text-[11px] font-semibold text-gray-400 mt-3">{new Date(note.createdAt).toLocaleString()}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Location Box ── */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40 self-start">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-red-500" /> Location
          </h3>
          
          {location?.lat ? (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100/50 rounded-bl-full -z-0"></div>
              <div className="relative z-10">
                <h5 className="text-gray-900 text-sm font-bold mb-1">
                  {[location.city, location.district].filter(Boolean).join(", ")}
                </h5>
                <p className="text-gray-500 text-xs font-medium flex flex-col gap-1">
                  <span>LAT: <span className="text-gray-800">{location.lat.toFixed(5)}°</span></span>
                  <span>LON: <span className="text-gray-800">{location.lon.toFixed(5)}°</span></span>
                </p>
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                  <button onClick={() => setEditing(true)} className="text-blue-600 text-[11px] font-bold uppercase tracking-wider hover:text-blue-800 transition-colors">
                    Update Coordinates →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-red-200 bg-red-50/50 rounded-2xl p-5 text-center">
              <MapPin className="w-6 h-6 text-red-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No Location Tracked</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Your current city coordinates are not set.</p>
              <button 
                onClick={() => setEditing(true)} 
                className="w-full bg-white border border-red-200 text-red-600 text-xs font-bold py-2 rounded-xl shadow-sm hover:bg-red-50 transition-colors"
              >
                Set Location
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ── Edit Profile Modal Overlay ── */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={handleCancel}
              className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative flex flex-col max-h-[90vh] border border-gray-100"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
                  <p className="text-xs text-gray-500 mt-1">Update your display name and location coordinates.</p>
                </div>
                <button 
                  onClick={handleCancel}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
                
                {usernameErr && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <X className="w-4 h-4" /> {usernameErr}
                  </div>
                )}

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Display Name</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameErr("");
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Location Map */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Primary Location</label>
                  <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-inner h-[280px]">
                    <ProfileLocationMap initialLocation={location} onChange={setLocation} />
                  </div>
                  <p className="text-gray-400 text-[11px] font-medium mt-2 px-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Click on the map or search to define your home coordinates.
                  </p>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-3xl flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 px-4 rounded-2xl font-bold text-gray-600 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDashboard;
