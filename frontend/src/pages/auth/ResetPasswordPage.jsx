import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { resetPassword } from '../../services/auth';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    const minLength = /.{8,}/;
    const hasUpper = /[A-Z]/;
    const hasNumber = /[0-9]/;
    
    if (!minLength.test(pwd)) return 'At least 8 characters long.';
    if (!hasUpper.test(pwd)) return 'At least one uppercase letter.';
    if (!hasNumber.test(pwd)) return 'At least one number.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    const passError = validatePassword(password);
    
    if (passError) newErrors.password = passError;
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsSuccess(true);
      toast.success('Password successfully reset!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Password Reset Complete" subtitle="You can now log in with your new password.">
        <div className="mt-8 flex flex-col items-center justify-center space-y-4">
          <Button onClick={() => navigate('/login')} className="w-full">
            Go to Login <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create New Password" subtitle="Choose a strong password to secure your account.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="New Password"
          type="password"
          placeholder="Enter new password"
          icon={Lock}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
          }}
          error={errors.password}
        />
        
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
          }}
          error={errors.confirmPassword}
        />

        <Button type="submit" isLoading={isSubmitting} className="mt-8">
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;