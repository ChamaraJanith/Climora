import { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService, register as registerService } from '../services/auth';
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

      // If we got redirected securely from backend Google OAuth process with a token in the URL:
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        if (urlUserParams) {
           try {
              // Assuming backend encoded user json payload as query param, or just an ID we can fetch later.
              const parsedUser = JSON.parse(decodeURIComponent(urlUserParams));
              localStorage.setItem('user', JSON.stringify(parsedUser));
              setUser(parsedUser);
           } catch {
              // If it failed parsing, drop it
           }
        }
        
        // Clean the URL without causing a page refresh 
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check standard storage if no URL hit (or to finalize the URL hit that just dumped into localstorage)
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
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
      return handleAuthSuccess(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to login. Please check your credentials.');
      return false;
    }
  };

  const handleAuthSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome back ${data.user.username || 'User'}!`);
    
    // Redirect based on exact matching of the backend roles enum
    const role = data.user.role || 'USER';
    switch (role) {
      case 'ADMIN': return navigate('/admin/dashboard');
      case 'SHELTER_MANAGER': return navigate('/shelter-dashboard');
      case 'CONTENT_MANAGER': return navigate('/content-dashboard');
      case 'USER':
      default: return navigate('/dashboard');
    }
    return true;
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