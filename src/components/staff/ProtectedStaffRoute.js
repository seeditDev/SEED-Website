import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedStaffRoute — Enforces Staff Authorization (Part 1 & 14 requirement).
 * Every Staff route MUST verify auth_data + role === "staff" before rendering.
 * Unauthenticated users -> /login
 * Student users -> /student/dashboard
 */
const ProtectedStaffRoute = ({ children }) => {
  const location = useLocation();

  try {
    const rawAuth = localStorage.getItem("auth_data");
    const storedRole = localStorage.getItem("role");

    if (!rawAuth) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const authData = JSON.parse(rawAuth);
    const role = (storedRole || authData.role || authData.Role || '').trim().toLowerCase();

    if (!role) {
      return <Navigate to="/login" replace />;
    }

    // Allow staff, admin, and trainer roles
    if (role === 'staff' || role === 'admin' || role === 'trainer') {
      return children;
    }

    // Students trying to access /staff/* are redirected to student dashboard
    return <Navigate to="/student/dashboard" replace />;
  } catch (err) {
    console.error('[ProtectedStaffRoute] Auth verification error:', err);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedStaffRoute;
