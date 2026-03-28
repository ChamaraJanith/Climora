import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import './App.css';

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<div className="h-screen flex items-center justify-center text-white bg-[#030712]">User Dashboard</div>} />
      <Route path="/admin-dashboard" element={<div className="h-screen flex items-center justify-center text-white bg-[#030712]">Admin Dashboard</div>} />
      <Route path="/shelter-dashboard" element={<div className="h-screen flex items-center justify-center text-white bg-[#030712]">Shelter Dashboard</div>} />
      <Route path="/content-dashboard" element={<div className="h-screen flex items-center justify-center text-white bg-[#030712]">Content Dashboard</div>} />
    </Routes>
  );
}