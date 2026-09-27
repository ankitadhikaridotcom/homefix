import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch current authenticated user on mount
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/auth/me`, { withCredentials: true });
        if (res.data.success) {
          setUser(res.data.user);
          setIsAuthenticated(true);
        }
      } catch (e) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, credentials, { withCredentials: true });
      if (res.data.success) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      }
      return res.data;
    } catch (err) {
      // Re-throw with the backend's message so the UI can display it
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential, role) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/google`, { credential, role }, { withCredentials: true });
      if (res.data.success && !res.data.needsRole) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      }
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Google login failed. Please try again.';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleSignup = async (payload) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/google/complete-signup`, payload, { withCredentials: true });
      if (res.data.success) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      }
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Google signup failed. Please try again.';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, userData, { withCredentials: true });
      if (res.data.success) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      }
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // New: OTP-verified registration (used by new signup flow)
  const registerVerified = async (userData) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register-verified`, userData, { withCredentials: true });
      if (res.data.success) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      }
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Account creation failed. Please try again.';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Send WhatsApp OTP via Twilio Verify
  const sendOtp = async (phone) => {
    try {
      const res = await axios.post(`${API_BASE}/api/otp/send`, { phone });
      return res.data; // { success, message, phone }
    } catch (err) {
      const message = err.response?.data?.message || 'OTP could not be sent. Please try again.';
      throw new Error(message);
    }
  };

  // Verify WhatsApp OTP
  const verifyOtp = async (phone, code) => {
    try {
      const res = await axios.post(`${API_BASE}/api/otp/verify`, { phone, code });
      return res.data; // { success, message, phone }
    } catch (err) {
      const message = err.response?.data?.message || 'OTP verification failed. Please try again.';
      throw new Error(message);
    }
  };

  const logout = async () => {
    setLoading(true);
    await axios.post(`${API_BASE}/api/auth/logout`, {}, { withCredentials: true });
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  const updateUser = async (updatedData) => {
    try {
      const res = await axios.put(`${API_BASE}/api/profile`, updatedData, { withCredentials: true });
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        return res.data;
      } else {
        // Fallback local update if user payload not in response
        setUser((prev) => ({ ...prev, ...updatedData }));
        return res.data;
      }
    } catch (err) {
      console.error('Failed to update profile on backend', err);
      // Fallback local update
      setUser((prev) => ({ ...prev, ...updatedData }));
      throw err;
    }
  };

  const updateProviderSettings = async (settings) => {
    try {
      const res = await axios.patch(`${API_BASE}/api/provider/settings`, settings, { withCredentials: true });
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        return res.data;
      }
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update settings';
      throw new Error(msg);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    googleLogin,
    completeGoogleSignup,
    register,
    registerVerified,
    sendOtp,
    verifyOtp,
    logout,
    updateUser,
    updateProviderSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
