
-- Fix overly permissive INSERT policies
-- These tables need system inserts via triggers, so restrict to service_role or authenticated users

DROP POLICY "System can insert wallets" ON public.wallets;
CREATE POLICY "Authenticated can insert own wallet" ON public.wallets FOR INSERT WITH CHECK (
  profile_id = public.get_profile_id() OR public.is_admin()
);

DROP POLICY "System can insert commissions" ON public.commissions;
CREATE POLICY "Authenticated can insert commissions" ON public.commissions FOR INSERT WITH CHECK (
  public.is_admin() OR agent_id IN (SELECT id FROM public.agents WHERE profile_id = public.get_profile_id())
);

DROP POLICY "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (
  profile_id = public.get_profile_id() OR public.is_admin()
);

DROP POLICY "System can insert roles" ON public.user_roles;
CREATE POLICY "Authenticated can insert own role" ON public.user_roles FOR INSERT WITH CHECK (
  user_id = auth.uid() OR public.is_admin()
);
