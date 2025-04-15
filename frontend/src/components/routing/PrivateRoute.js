// frontend/src/components/routing/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const PrivateRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If route requires admin privileges, check if user is admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  // Render the protected component
  return <Outlet />;
};

export default PrivateRoute;