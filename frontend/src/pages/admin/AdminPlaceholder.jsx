import { Construction } from 'lucide-react';
import Topbar from '../../components/admin/Topbar';

const AdminPlaceholder = ({ title }) => (
  <div className="flex flex-col min-h-screen bg-white">
    <Topbar placeholder="Search..." />
    <main className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
      <Construction size={40} className="opacity-30" />
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm">This section is coming soon.</p>
    </main>
  </div>
);

export default AdminPlaceholder;
