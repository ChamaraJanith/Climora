const StatCard = ({ icon: Icon, label, value, color = 'text-[#00c6ff]', loading = false }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[rgba(5,10,25,0.95)] to-[rgba(10,15,35,0.9)] backdrop-blur-[18px] rounded-[20px] p-6 shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-white/5 animate-pulse">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-3 bg-white/10 rounded w-24" />
            <div className="h-7 bg-white/20 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  // Extract core color for glow mappings
  let shadowGlow = 'rgba(0,150,255,0.4)';
  if (color.includes('#06b6d4')) shadowGlow = 'rgba(6,182,212,0.4)';
  else if (color.includes('orange')) shadowGlow = 'rgba(249,115,22,0.4)';
  else if (color.includes('green')) shadowGlow = 'rgba(34,197,94,0.4)';
  else if (color.includes('purple')) shadowGlow = 'rgba(168,85,247,0.4)';
  else if (color.includes('red')) shadowGlow = 'rgba(239,68,68,0.4)';

  return (
    <div className="relative bg-gradient-to-br from-[rgba(5,10,25,0.95)] to-[rgba(10,15,35,0.9)] backdrop-blur-[18px] rounded-[20px] p-6 shadow-[0_25px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(0,150,255,0.08)] border border-[rgba(255,255,255,0.06)] hover:-translate-y-[6px] hover:shadow-[0_35px_70px_rgba(0,0,0,0.7),0_0_60px_rgba(0,150,255,0.2)] transition-all duration-300 animate-[fadeInUp_0.4s_ease-out_forwards] overflow-hidden group">
      
      {/* Cinematic Depth Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,150,255,0.12),transparent_60%)] pointer-events-none z-0" />

      <div className="relative z-10 flex items-center gap-5">
        <div 
          className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] ${color} transition-all duration-300`}
          style={{ boxShadow: `0 0 15px ${shadowGlow}` }}
        >
          <Icon size={24} className="drop-shadow-md" />
        </div>
        <div>
          <p className="text-[13px] text-white/70 font-semibold uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-bold text-white mt-1 uppercase tracking-wider">{value ?? 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
