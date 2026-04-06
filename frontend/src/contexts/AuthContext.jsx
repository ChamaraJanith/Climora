import { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService, register as registerService } from '../services/auth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from local storage on load OR query params (from OAuth redirect)
  useEffect(() => {
    const initializeAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const urlUserParams = urlParams.get('user');

      // ── Google OAuth redirect: token + user arrive as query params ──────────
      if (urlToken) {
        localStorage.setItem('token', urlToken);

        let oauthUser = null;

        if (urlUserParams) {
          try {
            oauthUser = JSON.parse(decodeURIComponent(urlUserParams));
            localStorage.setItem('user', JSON.stringify(oauthUser));
            setUser(oauthUser);
          } catch {
            // If parsing fails, leave oauthUser null — fallback below handles it
          }
        }

        // Clean the OAuth params from the URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);

        // ── Role-based redirect (same logic as handleAuthSuccess) ────────────
        const role = oauthUser?.role || 'USER';
        switch (role) {
          case 'ADMIN':           navigate('/admin/dashboard');    break;
          case 'SHELTER_MANAGER': navigate('/shelter-dashboard');  break;
          case 'CONTENT_MANAGER': navigate('/content-dashboard');  break;
          case 'USER':
          default:                navigate('/dashboard');          break;
        }

        await saveLiveLocation(oauthUser);
        setLoading(false);
        return; // skip the storage check — we just set everything above
      }
      // ────────────────────────────────────────────────────────────────────────

      // Normal page load: restore auth state from localStorage
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginService(email, password);
      await handleAuthSuccess(data);
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to login. Please check your credentials.');
      return false;
    }
  };

  const requestBrowserLocation = () => {
    return new Promise((resolve) => {
      if (!navigator?.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  };

  const saveLiveLocation = async (currentUser) => {
    if (!currentUser || currentUser.location?.lat || !navigator?.geolocation) {
      return;
    }

    const consent = window.confirm(
      'Allow Climora to access your current location so we can show nearby shelters?'
    );
    if (!consent) return;

    const position = await requestBrowserLocation();
    if (!position) return;

    try {
      const response = await api.put('/auth/profile', {
        location: { lat: position.lat, lon: position.lon },
      });
      const updatedUser = response.data.user;
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Live location save failed', error);
    }
  };

  const handleAuthSuccess = async (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome back ${data.user.username || 'User'}!`);

    await saveLiveLocation(data.user);

    // Redirect based on exact matching of the backend roles enum
    const role = data.user.role || 'USER';
    switch (role) {
      case 'ADMIN': return navigate('/admin/dashboard');
      case 'SHELTER_MANAGER': return navigate('/shelter-dashboard');
      case 'CONTENT_MANAGER': return navigate('/content-dashboard');
      case 'USER':
      default: return navigate('/dashboard');
    }
  };

  const register = async (username, email, password) => {
    try {
      await registerService(username, email, password);
      toast.success('Registration successful! Please log in.');
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to register. Please try again.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully.');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};