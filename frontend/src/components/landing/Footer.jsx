export default function Footer() {
  return (
    <footer className="relative bg-[#030712] border-t border-white/8 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">C</span>
          </div>
          <span className="text-white font-bold">Climora</span>
        </div>
        <p className="text-slate-600 text-sm">© 2026 Climora. Built for resilience.</p>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <a key={l} href="#" className="text-slate-600 text-sm hover:text-slate-400 transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
