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
import EditAlert from './pages/admin/EditAlert';
import UsersPage from './pages/admin/UsersPage';
import StaffManagement from './pages/admin/StaffManagement';
import WeatherPage from './pages/admin/WeatherPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminPlaceholder from './pages/admin/AdminPlaceholder';

// Routing
import ProtectedRoute from './components/routing/ProtectedRoute';

import ContentDashboard from './pages/contentManager/ContentDashboard';
import UserDashboard from './pages/UserDashboard';
import ArticlesPage from './pages/contentManager/ArticlesPage';
import ShelterDashboard from './pages/shelterManager/ShelterDashboard';
import ReliefItemsPage from './pages/shelterManager/ReliefItemsPage';
import OccupancyPage from './pages/shelterManager/OccupancyPage';
import ShelterStatusPage from './pages/shelterManager/ShelterStatusPage';
import ShelterAlertsPage from './pages/shelterManager/ShelterAlertsPage';
import ShelterPlaceholder from './pages/shelterManager/ShelterPlaceholder';
import ReportsPage from './pages/shelterManager/ReportsPage';
import { Activity } from 'lucide-react';
import ArticleDetailPage from './pages/contentManager/ArticleDetailPage';
import ClimateNewsPage from './pages/contentManager/ClimateNewsPage';
import './App.css';

export default function App() {
  const { pathname } = useLocation();

  // Disable Lenis smooth scroll inside admin and content-dashboard
  const isAdmin =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/content-dashboard');

  // ✅ GOOGLE LOGIN TOKEN HANDLER (NEW - SAFE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const user = params.get("user");

    if (token) {
      console.log("✅ Google login token detected");

      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", decodeURIComponent(user));
      }

      // Clean URL (remove token from URL)
      window.history.replaceState({}, document.title, "/dashboard");

      // Redirect to dashboard
      window.location.href = "/dashboard";
    }
  }, []);

  // Existing Lenis scroll (UNCHANGED)
  useEffect(() => {
    if (isAdmin) return;

    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

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
      <Route path="/reports/:id" element={<UserDashboard />} />
      <Route
        path="/admin-dashboard"
        element={
          <div className="h-screen flex items-center justify-center text-white bg-[#030712]">
            Admin Dashboard
          </div>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/articles/:id" element={<ArticleDetailPage />} />
      <Route path="/learn/:id" element={<ArticleDetailPage />} />
      <Route path="/articles" element={<ArticlesPage />} />
      <Route path="/learn" element={<ArticlesPage />} />
      <Route path="/climate-news" element={<ClimateNewsPage />} />
      <Route path="/news" element={<ClimateNewsPage />} />

      {/* Legacy redirect */}
      <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Shelter Manager — protected */}
      <Route element={<ProtectedRoute allowedRoles={['SHELTER_MANAGER']} />}>
        <Route path="/shelter-dashboard" element={<ShelterDashboard />} />
        <Route path="/shelter/relief-items" element={<ReliefItemsPage />} />
        <Route path="/shelter/occupancy" element={<OccupancyPage />} />
        <Route path="/shelter/status" element={<ShelterStatusPage />} />
        <Route path="/shelter/alerts" element={<ShelterAlertsPage />} />
        <Route
          path="/shelter/weather"
          element={
            <ShelterPlaceholder
              title="Weather"
              icon={Activity}
              description="Monitor real-time weather conditions."
            />
          }
        />
        <Route path="/shelter/reports" element={<ReportsPage />} />
      </Route>

      {/* Admin — protected */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/alerts" element={<AlertsPage />} />
          <Route path="/admin/alerts/create" element={<CreateAlert />} />
          <Route path="/admin/alerts/edit/:id" element={<EditAlert />} />
          <Route path="/admin/alerts/:id" element={<AlertDetails />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/staff" element={<StaffManagement />} />
          <Route path="/admin/weather" element={<WeatherPage />} />
          <Route path="/admin/articles" element={<AdminPlaceholder title="Articles" />} />
          <Route path="/admin/climate-news" element={<AdminPlaceholder title="Climate News" />} />
          <Route path="/admin/shelters" element={<AdminPlaceholder title="Shelters" />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/settings" element={<AdminPlaceholder title="Settings" />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="/content-dashboard" element={<ContentDashboard />} />
    </Routes>
  );
}