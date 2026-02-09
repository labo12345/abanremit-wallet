import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { Navigate, useLocation } from 'react-router-dom';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export function RoleBasedRoute({ children, allowedRoles, redirectTo }: RoleBasedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const location = useLocation();

  // Show loading while auth or role is being determined
  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user's role is allowed
  const userRole = role || 'user';
  
  if (!allowedRoles.includes(userRole)) {
    // Redirect based on role
    const destination = redirectTo || getDefaultRedirect(userRole);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

function getDefaultRedirect(role: AppRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'agent':
      return '/agent';
    default:
      return '/';
  }
}

// Convenience components for common use cases
export function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedRoute allowedRoles={['user', 'agent']} redirectTo="/admin">
      {children}
    </RoleBasedRoute>
  );
}

export function AgentRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedRoute allowedRoles={['agent']} redirectTo="/">
      {children}
    </RoleBasedRoute>
  );
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedRoute allowedRoles={['admin']} redirectTo="/">
      {children}
    </RoleBasedRoute>
  );
}
