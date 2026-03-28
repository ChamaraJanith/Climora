import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Lenis from 'lenis';

// Public pages
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AlertsPage from './pages/admin/AlertsPage';
import AlertDetails from './pages/admin/AlertDetails';
import CreateAlert from './pages/admin/CreateAlert';
import UsersPage from './pages/admin/UsersPage';
import StaffManagement from './pages/admin/StaffManagement';
import WeatherPage from './pages/admin/WeatherPage';
import AdminPlaceholder from './pages/admin/AdminPlaceholder';

// Routing
import ProtectedRoute from './components/routing/ProtectedRoute';

import ContentDashboard from './pages/ContentDashboard';
import UserDashboard from './pages/UserDashboard';
//import ArticlesPage from './pages/articles/ArticlesPage';
//import ArticleDetailPage from './pages/articles/ArticleDetailPage';
import './App.css';

export default function App() {
  const { pathname } = useLocation();

  // Disable Lenis smooth scroll inside admin (white bg, standard scroll)
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, [pathname, isAdmin]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/admin-dashboard" element={<div className="h-screen flex items-center justify-center text-white bg-[#030712]">Admin Dashboard</div>} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Legacy redirect */}
      <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />

      {/* User / staff dashboards (placeholder) */}
      <Route path="/dashboard" element={<div className="h-screen flex items-center justify-center text-white bg-[#030712]">User Dashboard</div>} />
      <Route path="/shelter-dashboard" element={<div className="h-screen flex items-center justify-center text-white bg-[#030712]">Shelter Dashboard</div>} />
      <Route path="/content-dashboard" element={<div className="h-screen flex items-center justify-center text-white bg-[#030712]">Content Dashboard</div>} />

      {/* Admin — protected */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard"   element={<AdminDashboard />} />
          <Route path="/admin/alerts"      element={<AlertsPage />} />
          <Route path="/admin/alerts/create" element={<CreateAlert />} />
          <Route path="/admin/alerts/:id"  element={<AlertDetails />} />
          <Route path="/admin/users"       element={<UsersPage />} />
          <Route path="/admin/staff"       element={<StaffManagement />} />
          <Route path="/admin/weather"     element={<WeatherPage />} />
          <Route path="/admin/articles"    element={<AdminPlaceholder title="Articles" />} />
          <Route path="/admin/climate-news" element={<AdminPlaceholder title="Climate News" />} />
          <Route path="/admin/shelters"    element={<AdminPlaceholder title="Shelters" />} />
          <Route path="/admin/reports"     element={<AdminPlaceholder title="Reports" />} />
          <Route path="/admin/settings"    element={<AdminPlaceholder title="Settings" />} />
          {/* Default /admin → dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="/content-dashboard" element={<ContentDashboard />} />
      <Route path="/articles" element={<ArticlesPage />} />
      <Route path="/articles/:id" element={<ArticleDetailPage />} />
      <Route path="/learn" element={<ArticlesPage />} />
      <Route path="/learn/:id" element={<ArticleDetailPage />} />
    </Routes>
  );
}
