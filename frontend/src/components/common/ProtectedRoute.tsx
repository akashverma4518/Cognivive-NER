import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-elder-bg flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-[#6C3EDC] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-elder-lg font-bold text-elder-navy">Loading Cognivive...</p>
        <p className="text-slate-500 text-elder-base mt-1">Please wait a moment</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
