import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { forgotPassword } from '../../services/auth';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setIsSuccess(true);
      toast.success('Reset link sent to your email.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Check Your Email" subtitle="We've sent a password reset link to your inbox.">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-6 text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400">
            <CheckCircle2 size={40} />
          </div>
          <p className="mb-8 text-gray-300">
            Didn't receive it? Check your spam folder or try again.
          </p>
          <Button onClick={() => setIsSuccess(false)} variant="outline">
            Try another email
          </Button>
          
          <Link to="/login" className="mt-8 flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="mr-2" size={16} /> Back to Login
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive a secure reset link">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          error={error}
        />

        <Button type="submit" isLoading={isSubmitting}>
          Send Reset Link
        </Button>

        <div className="mt-6 text-center">
          <Link to="/login" className="flex items-center justify-center text-sm font-medium text-gray-400 transition-colors hover:text-white">
            <ArrowLeft className="mr-2" size={16} />
            Back to log in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;