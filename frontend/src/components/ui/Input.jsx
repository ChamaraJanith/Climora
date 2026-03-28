import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Input = forwardRef(({ label, type = 'text', icon: Icon, error, className = '', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-300 transition-colors group-focus-within:text-[#06b6d4]">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-[#06b6d4]">
            <Icon size={20} />
          </div>
        )}
        <motion.input
          ref={ref}
          type={inputType}
          className={`w-full rounded-xl border bg-white/5 px-4 py-3 pb-3 text-white placeholder-gray-500 outline-none backdrop-blur-sm transition-all focus:bg-white/10 ${
            Icon ? 'pl-11' : ''
          } ${isPassword ? 'pr-11' : ''} ${
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-white/10 focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4]'
          }`}
          onFocus={(e) => {
            setIsFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          initial={false}
          animate={{
            borderColor: error ? '#ef4444' : isFocused ? '#06b6d4' : 'rgba(255,255,255,0.1)',
            boxShadow: error
              ? '0 0 0 1px rgba(239,68,68,0.2)'
              : isFocused
              ? '0 0 0 1px rgba(6,182,212,0.2)'
              : '0 0 0 0px transparent',
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;