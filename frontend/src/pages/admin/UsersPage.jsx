import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import Topbar from '../../components/admin/Topbar';
import api from '../../services/api';

const ROLE_COLORS = {
  ADMIN:           'bg-purple-100 text-purple-600 border-purple-200',
  SHELTER_MANAGER: 'bg-blue-100 text-blue-600 border-blue-200',
  CONTENT_MANAGER: 'bg-cyan-100 text-cyan-600 border-cyan-200',
  USER:            'bg-gray-100 text-gray-600 border-gray-200',
};

const TableSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex gap-4 px-4 py-3 bg-[#F9FAFB] rounded-xl border border-gray-100">
        {[...Array(6)].map((__, j) => (
          <div key={j} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/auth/users');
        setUsers(Array.isArray(data) ? data : (data.users || []));
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar searchValue={search} onSearchChange={setSearch} placeholder="Search users by name or email..." />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all registered users on the platform.</p>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-base font-medium">No users found</p>
          </div>
        ) : (
          <div className="bg-[#F9FAFB] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  {['User ID', 'Username', 'Email', 'Role', 'Status', 'Created'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-white transition-colors duration-100">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.userId || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.role] || ROLE_COLORS.USER}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default UsersPage;
