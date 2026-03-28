import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-white gap-4">
      <ShieldOff size={48} className="text-red-400 opacity-70" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-gray-400 text-sm">You don't have permission to view this page.</p>
      <button
        onClick={() => navigate('/')}
        className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-medium hover:from-[#0891b2] hover:to-[#2563eb] transition-all"
      >
        Go Home
      </button>
    </div>
  );
};

export default UnauthorizedPage;
