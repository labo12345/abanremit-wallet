import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'user' | 'agent' | 'admin';

export function useUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<AppRole> => {
      if (!user) return 'user';
      
      // Check user_roles table for the highest privilege role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return 'user';
      }
      
      // Priority: admin > agent > user
      if (data?.some(r => r.role === 'admin')) return 'admin';
      if (data?.some(r => r.role === 'agent')) return 'agent';
      return 'user';
    },
    enabled: !!user,
    staleTime: 1000 * 60, // Cache for 1 minute
  });
}

export function useIsAdmin() {
  const { data: role, isLoading } = useUserRole();
  return { isAdmin: role === 'admin', isLoading };
}

export function useIsAgent() {
  const { data: role, isLoading } = useUserRole();
  return { isAgent: role === 'agent', isLoading };
}
