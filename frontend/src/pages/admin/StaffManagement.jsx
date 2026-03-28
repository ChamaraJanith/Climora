import { useState } from 'react';
import { UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/admin/Topbar';
import api from '../../services/api';

const ROLES = ['SHELTER_MANAGER', 'CONTENT_MANAGER'];
const INITIAL = { username: '', email: '', password: '', role: '' };

const StaffManagement = () => {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) {
      errs.username = 'Username is required';
    } else if (form.username.length < 3) {
      errs.username = 'Username must be at least 3 characters';
    } else if (/\s/.test(form.username)) {
      errs.username = 'Username cannot contain spaces';
    }
    if (!form.email.trim())    errs.email    = 'Email is required';
    if (!form.password)        errs.password = 'Password is required';
    if (!form.role)            errs.role     = 'Role is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      await api.post('/auth/users/staff', form);
      toast.success('Staff account created successfully');
      setForm(INITIAL);
      setErrors({});
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (name) =>
    `w-full px-4 py-2.5 text-sm bg-white border rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all duration-150 ${
      errors[name] ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'
    }`;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar placeholder="Search..." />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create accounts for shelter managers and content managers.</p>
        </div>

        <div className="max-w-lg">
          <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#06b6d4] shadow-sm">
                <UserCog size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">Create Staff Account</h2>
                <p className="text-xs text-gray-500">Assign a role and send credentials</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input name="username" value={form.username} onChange={handleChange} placeholder="Enter username" className={fieldClass('username')} />
                {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="staff@climora.lk" className={fieldClass('email')} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className={fieldClass('password')} />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select name="role" value={form.role} onChange={handleChange} className={fieldClass('role')}>
                  <option value="">Select a role</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
                {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-medium hover:from-[#0891b2] hover:to-[#2563eb] transition-all duration-150 disabled:opacity-60"
              >
                {submitting ? 'Creating...' : 'Create Staff Account'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffManagement;
