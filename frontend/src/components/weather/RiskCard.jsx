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
      <div className="rounded-3xl bg-gray-100 p-6 animate-pulse space-y-4 shadow-sm h-full min-h-[300px]">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mt-6" />
        <div className="h-8 w-24 bg-gray-200 rounded-full mx-auto" />
        <div className="space-y-4 mt-8">
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const level = risk?.riskLevel || 'LOW';
  const theme = RISK_THEME[level] || RISK_THEME.LOW;
  const score = risk?.score ?? 0;

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${theme.gradient} p-8 text-white relative overflow-hidden shadow-xl h-full min-h-[300px] flex flex-col group`}>
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      
      <div className="relative z-10 flex-1">
        <p className="text-white/80 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-6 drop-shadow-sm">
          <ShieldAlert size={14} /> Risk Assessment
        </p>

        <div className="text-center py-2 relative">
          <p className="text-6xl mb-4 drop-shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">{theme.emoji}</p>
          <span className="inline-block text-sm font-extrabold px-6 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20 shadow-sm uppercase tracking-wider">
            {level}
          </span>
          <p className="text-white/80 text-xs mt-4 font-medium tracking-wide">
            Risk Score: <span className="font-black text-white text-base">{score}</span> <span className="text-white/60">/ 10</span>
          </p>
        </div>

        {risk?.reasons?.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/20 space-y-2.5">
            {risk.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-white/90 font-medium">
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
