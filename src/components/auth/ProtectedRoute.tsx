import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const { error, info } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      error('Authentication Required', 'Please sign in to access your portal.');
    } else if (!loading && user && allowedRole && profile && profile.role !== allowedRole) {
      error('Access Restricted', `This page requires ${allowedRole === 'admin' ? 'Recruiter' : 'Candidate'} permissions.`);
    }
  }, [loading, user, profile, allowedRole, error]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is specified and does not match
  if (allowedRole && profile && profile.role !== allowedRole) {
    if (profile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
