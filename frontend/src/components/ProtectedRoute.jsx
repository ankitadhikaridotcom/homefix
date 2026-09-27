import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protects routes that require authentication and optional role authorization
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null; // Could render a loader
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }
  return children || <Outlet />;
};

export default ProtectedRoute;

