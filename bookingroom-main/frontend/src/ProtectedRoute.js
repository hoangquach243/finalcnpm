import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!token) {
    console.log('ProtectedRoute: No token found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (location.pathname.startsWith('/admin') && user?.role !== 'admin') {
    console.log('ProtectedRoute: User is not admin, redirecting to /user/search');
    return <Navigate to="/user/search" replace />;
  }

  return children;
};

export default ProtectedRoute;