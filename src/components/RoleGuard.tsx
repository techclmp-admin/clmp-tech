import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'moderator' | 'user';
  projectId?: string;
  fallback?: React.ReactNode;
  adminOnly?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  fallback = null,
  adminOnly = false,
}) => {
  const { hasRole, isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return <div className="animate-pulse h-4 bg-muted rounded" />;
  }

  // Check admin access
  if (adminOnly && !isAdmin) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};