-- Temporary bypass for RLS during active development (Phase 1/2/3/4)
-- We will replace these with strict RBAC policies in Phase 5.

CREATE POLICY "Allow all authenticated users full access to people" ON public.people FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated users full access to family_links" ON public.family_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated users full access to system_users" ON public.system_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated users full access to role_definitions" ON public.role_definitions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated users full access to role_fields" ON public.role_fields FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated users full access to person_roles" ON public.person_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated users full access to person_role_values" ON public.person_role_values FOR ALL TO authenticated USING (true) WITH CHECK (true);
