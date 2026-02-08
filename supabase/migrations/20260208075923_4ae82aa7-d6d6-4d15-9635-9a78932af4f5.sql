
-- Allow users to update their own wallet (for send money)
DROP POLICY IF EXISTS "Admin can update wallets" ON public.wallets;
CREATE POLICY "Users and admin can update wallets" ON public.wallets 
FOR UPDATE USING (profile_id = get_profile_id() OR is_admin());

-- Allow agents to update their own agent record (for wallet balance updates)
DROP POLICY IF EXISTS "Admin can manage agents" ON public.agents;
CREATE POLICY "Admin can manage agents" ON public.agents 
FOR ALL USING (is_admin());

CREATE POLICY "Agents can update own record" ON public.agents 
FOR UPDATE USING (profile_id = get_profile_id());

-- Allow authenticated users to insert agents (for agent registration)
CREATE POLICY "Users can register as agents" ON public.agents 
FOR INSERT WITH CHECK (profile_id = get_profile_id());
