import { ShieldAlert } from 'lucide-react';

const RISK_THEME = {
  LOW:      { gradient: 'from-emerald-400 to-green-500',  emoji: '✅' },
  MEDIUM:   { gradient: 'from-amber-400 to-yellow-500',   emoji: '⚠️' },
  HIGH:     { gradient: 'from-orange-500 to-amber-600',   emoji: '🔶' },
  CRITICAL: { gradient: 'from-red-600 to-rose-600',       emoji: '🔴' },
};

const RiskCard = ({ risk, loading }) => {
  if (loading) {
    return (
      <div className="rounded-3xl bg-[linear-gradient(135deg,#064e3b,#10b981)] backdrop-blur-md border border-white/10 p-6 animate-pulse space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.25)] h-full min-h-[300px]">
        <div className="h-4 w-24 bg-white/10 rounded" />
        <div className="h-16 w-16 bg-white/10 rounded-full mx-auto mt-6" />
        <div className="h-8 w-24 bg-white/10 rounded-full mx-auto" />
        <div className="space-y-4 mt-8">
          <div className="h-3 w-full bg-white/10 rounded" />
          <div className="h-3 w-3/4 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  const level = risk?.riskLevel || 'LOW';
  const theme = RISK_THEME[level] || RISK_THEME.LOW;
  const score = risk?.score ?? 0;

  return (
    <div className="rounded-3xl bg-[linear-gradient(135deg,#064e3b,#10b981)] backdrop-blur-md border border-white/10 p-8 text-white relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.25)] h-full min-h-[300px] flex flex-col group transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(16,255,180,0.3)] animate-[fadeInUp_0.4s_ease-out_forwards]">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      
      <div className="relative z-10 flex-1">
        <p className="text-white/90 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-6 drop-shadow-sm">
          <ShieldAlert size={14} className="text-white" /> Risk Assessment
        </p>

        <div className="text-center py-2 relative">
          <div className="mx-auto flex justify-center items-center w-20 h-20 mb-4 bg-white/10 rounded-xl shadow-[0_0_25px_rgba(16,255,180,0.5)] transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
            <p className="text-5xl drop-shadow-lg">{theme.emoji}</p>
          </div>
          <span className="inline-block text-sm font-extrabold px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 uppercase tracking-wider text-green-200">
            {level}
          </span>
          <p className="text-white/70 text-xs mt-4 font-medium tracking-wide">
            Risk Score: <span className="font-semibold text-white text-base">{score}</span> <span className="text-white/70">/ 10</span>
          </p>
        </div>

        {risk?.reasons?.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
            {risk.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-white/70 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 mt-1 shadow-sm" />
                <span className="leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskCard;
