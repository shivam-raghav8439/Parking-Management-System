import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check token not expired (JWT format only, skipping for mock tokens)
  if (token.includes('.')) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
      }
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
  }

  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallbackUrl = user.role === 'user' ? '/book-slot' : '/dashboard';
    return <Navigate to={fallbackUrl} replace />;
  }

  return children;
};

export default ProtectedRoute;
