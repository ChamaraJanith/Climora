import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GoogleButton from '../../components/auth/GoogleButton';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Auth Flow] Form submission triggered!');
    console.log('[Auth Flow] Form Data:', formData);
    
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required.';
    if (!formData.password) newErrors.password = 'Password is required.';

    if (Object.keys(newErrors).length > 0) {
      console.log('[Auth Flow] Validation failed:', newErrors);
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('[Auth Flow] Calling context login function...');
      
      const success = await login(formData.email, formData.password);
      
      if (!success) {
        console.log('[Auth Flow] Login failed.');
      }
    } catch (error) {
      console.error('[Auth Flow] Unexpected error during form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to access your Climora dashboard">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        
        <div>
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />
          <div className="mt-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-[#06b6d4] transition-colors hover:text-[#0891b2] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="mt-6">
          Log in
        </Button>

        <div className="my-6 flex items-center justify-center space-x-4">
          <div className="h-px w-full bg-white/10 flex-1"></div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Or continue with</span>
          <div className="h-px w-full bg-white/10 flex-1"></div>
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-[#06b6d4] transition-colors hover:text-[#0891b2] hover:underline">
            Sign up now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;