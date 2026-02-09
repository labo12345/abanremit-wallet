import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';

/**
 * Component that redirects users to their appropriate dashboard based on role.
 * Admins go to /admin, agents go to /agent (if they prefer), users go to /.
 */
export function RoleRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admins MUST go to admin dashboard - no user features
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Others go to user dashboard
  return <Navigate to="/home" replace />;
}
