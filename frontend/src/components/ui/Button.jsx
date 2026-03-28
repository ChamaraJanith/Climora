import { motion } from 'framer-motion';

const Button = ({ children, isLoading, className = '', variant = 'primary', type = 'button', ...props }) => {
  const baseStyles =
    'relative flex w-full items-center justify-center overflow-hidden rounded-xl px-4 py-3 font-medium transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-70';

  const variants = {
    primary:
      'bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white hover:from-[#0891b2] hover:to-[#2563eb]',
    secondary: 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/10',
    outline: 'border border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4]/10',
  };

  return (
    <motion.button
      {...props}
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      whileHover={{ scale: props.disabled || isLoading ? 1 : 1.01 }}
      whileTap={{ scale: props.disabled || isLoading ? 1 : 0.98 }}
      disabled={isLoading || props.disabled}
    >
      {/* Glossy overlay effect - pointer-events-none ensures it does not capture clicks */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 transition-opacity hover:opacity-100" />

      {isLoading ? (
        <div className="pointer-events-none flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-r-2 border-white"></div>
          <span>Loading...</span>
        </div>
      ) : (
        <span className="pointer-events-none relative z-10">{children}</span>
      )}
    </motion.button>
  );
};

export default Button;