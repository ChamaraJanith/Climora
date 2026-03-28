import api from './api';

export const login = async (email, password) => {
  console.log(`[API Service] Calling login API: POST /auth/login for email: ${email}`);
  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('[API Service] Response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API Service] Error during form submission API call:', error);
    throw error;
  }
};

export const register = async (username, email, password) => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post(`/auth/reset-password/${token}`, { password: newPassword });
  return response.data;
};