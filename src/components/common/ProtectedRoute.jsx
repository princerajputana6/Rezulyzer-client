import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectIsAuthenticated, selectCurrentUser } from '../../redux/slices/authSlice';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  if (requiredRole) {
    // Support both string and array inputs for requiredRole
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Normalize roles and include 'company' in the hierarchy
    const roleHierarchy = {
      candidate: 0,
      user: 1,
      company: 2, // company accounts
      admin: 2,   // treat admin equivalent to company for access checks here
      super_admin: 3,
      superadmin: 3, // in case older naming is used anywhere
    };

    const userRole = (currentUser?.role || '').toLowerCase();
    const userRoleLevel = roleHierarchy[userRole] ?? 0;

    // If any specific role is required, allow if user's level >= any required level OR direct match
    const allowed = requiredRoles.some(r => {
      const rr = (r || '').toLowerCase();
      return userRole === rr || userRoleLevel >= (roleHierarchy[rr] ?? 99);
    });

    if (!allowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
