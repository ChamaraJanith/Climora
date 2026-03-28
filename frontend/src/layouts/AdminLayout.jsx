import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      {/* Main content offset by sidebar width */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
