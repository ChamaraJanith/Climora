import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GoogleButton from '../../components/auth/GoogleButton';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const minLength = /.{8,}/;
    const hasUpper = /[A-Z]/;
    const hasNumber = /[0-9]/;
    
    if (!minLength.test(password)) return 'Password must be at least 8 characters long.';
    if (!hasUpper.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!hasNumber.test(password)) return 'Password must contain at least one number.';
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error as user types
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent React state batching race conditions from rapid double-clicks
    if (submitLock.current) return;
    submitLock.current = true;
    
    // Basic validation
    const newErrors = {};
    if (!formData.username) {
      newErrors.username = 'Username is required.';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    }
    
    if (!formData.email) newErrors.email = 'Email is required.';
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      submitLock.current = false;
      return;
    }

    setIsSubmitting(true);
    const success = await register(formData.username, formData.email, formData.password);
    setIsSubmitting(false);
    
    if (success) {
      submitLock.current = false;
      navigate('/login');
    } else {
      // Re-enable clicks only if the submission failed
      submitLock.current = false;
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join Climora to start managing climate data">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Username"
          name="username"
          placeholder="JaneDoe123"
          icon={User}
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
        />
        
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
        
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Create a strong password"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Button type="submit" isLoading={isSubmitting} className="mt-8">
          Sign up
        </Button>

        <div className="my-6 flex items-center justify-center space-x-4">
          <div className="h-px w-full bg-white/10 flex-1"></div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Or continue with</span>
          <div className="h-px w-full bg-white/10 flex-1"></div>
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#06b6d4] transition-colors hover:text-[#0891b2] hover:underline">
            Log in here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;