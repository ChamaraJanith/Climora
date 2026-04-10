import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, ShieldAlert, AlertCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const RISK_CONFIG = {
  LOW: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    icon: ShieldCheck,
    label: 'Low Risk',
    description: 'Conditions are stable and safe.'
  },
  MEDIUM: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    glow: 'shadow-[0_0_20px_rgba(250,204,21,0.2)]',
    icon: AlertCircle,
    label: 'Medium Risk',
    description: 'Minor weather concerns. Stay aware.'
  },
  HIGH: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
    icon: AlertTriangle,
    label: 'High Risk',
    description: 'Dangerous conditions. Take precautions.'
  },
  CRITICAL: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.4)]',
    icon: ShieldAlert,
    label: 'Critical Risk',
    description: 'Severe weather alert. Seek shelter.'
  }
};

export default function RiskBadge({ risk }) {
  const [expanded, setExpanded] = useState(false);

  if (!risk || !risk.level) return null;

  const config = RISK_CONFIG[risk.level] || RISK_CONFIG.LOW;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full rounded-2xl p-5 border backdrop-blur-xl transition-all duration-300 ${config.bg} ${config.border} ${config.glow}`}
    >
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-[#030712]/40 ${config.color} border border-white/5`}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`text-lg font-bold tracking-wide uppercase ${config.color}`}>
              {config.label}
            </h3>
            <p className="text-sm text-white/50 font-medium">
              Score: {risk.score}/10
            </p>
          </div>
        </div>

        {risk.reasons && risk.reasons.length > 0 && (
          <div className="text-white/40 group-hover:text-white/80 transition-colors p-2 bg-[#030712]/20 rounded-full">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && risk.reasons && risk.reasons.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Risk Factors</p>
              <ul className="flex flex-col gap-2">
                {risk.reasons.map((reason, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 text-sm text-white/80"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')} bg-opacity-80`} />
                    {reason}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
