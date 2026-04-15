-- =========================================================
-- PHASE 2: RLS PERFECTION FIREWALL
-- Eliminate FOR ALL overrides and lock unmapped tables
-- =========================================================

-- 1. Explode FOR ALL policies into explicit grants preventing DELETE inherently.

DROP POLICY IF EXISTS "RBAC_Settings_Update" ON public.system_settings;
CREATE POLICY "RBAC_Settings_Update" ON public.system_settings FOR UPDATE TO authenticated USING (public.has_permission('settings.update'::text));
CREATE POLICY "RBAC_Settings_Insert" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (public.has_permission('settings.update'::text));

DROP POLICY IF EXISTS "RBAC_RoleDefs_Update" ON public.role_definitions;
CREATE POLICY "RBAC_RoleDefs_Update" ON public.role_definitions FOR UPDATE TO authenticated USING (public.has_permission('roles.update'::text));
CREATE POLICY "RBAC_RoleDefs_Insert" ON public.role_definitions FOR INSERT TO authenticated WITH CHECK (public.has_permission('roles.create'::text));

DROP POLICY IF EXISTS "RBAC_PersonRoles_All" ON public.person_roles;
CREATE POLICY "RBAC_PersonRoles_Update" ON public.person_roles FOR UPDATE TO authenticated USING (public.has_permission('roles.update'::text));
CREATE POLICY "RBAC_PersonRoles_Insert" ON public.person_roles FOR INSERT TO authenticated WITH CHECK (public.has_permission('roles.update'::text));

DROP POLICY IF EXISTS "RBAC_SystemUsers_All" ON public.system_users;
CREATE POLICY "RBAC_SystemUsers_Update" ON public.system_users FOR UPDATE TO authenticated USING (public.has_permission('people.update'::text));
CREATE POLICY "RBAC_SystemUsers_Insert" ON public.system_users FOR INSERT TO authenticated WITH CHECK (public.has_permission('people.update'::text));

-- 2. Bind unmapped configuration tables
DROP POLICY IF EXISTS "RBAC_RoleFields_Select" ON public.role_fields;
CREATE POLICY "RBAC_RoleFields_Select" ON public.role_fields FOR SELECT TO authenticated USING (public.has_permission('roles.read'::text));
DROP POLICY IF EXISTS "RBAC_RoleFields_Insert" ON public.role_fields;
CREATE POLICY "RBAC_RoleFields_Insert" ON public.role_fields FOR INSERT TO authenticated WITH CHECK (public.has_permission('roles.update'::text));
DROP POLICY IF EXISTS "RBAC_RoleFields_Update" ON public.role_fields;
CREATE POLICY "RBAC_RoleFields_Update" ON public.role_fields FOR UPDATE TO authenticated USING (public.has_permission('roles.update'::text));

DROP POLICY IF EXISTS "RBAC_PersonRoleValues_Select" ON public.person_role_values;
CREATE POLICY "RBAC_PersonRoleValues_Select" ON public.person_role_values FOR SELECT TO authenticated USING (public.has_permission('roles.read'::text));
DROP POLICY IF EXISTS "RBAC_PersonRoleValues_Insert" ON public.person_role_values;
CREATE POLICY "RBAC_PersonRoleValues_Insert" ON public.person_role_values FOR INSERT TO authenticated WITH CHECK (public.has_permission('roles.update'::text));
DROP POLICY IF EXISTS "RBAC_PersonRoleValues_Update" ON public.person_role_values;
CREATE POLICY "RBAC_PersonRoleValues_Update" ON public.person_role_values FOR UPDATE TO authenticated USING (public.has_permission('roles.update'::text));

DROP POLICY IF EXISTS "RBAC_FamilyLinks_Select" ON public.family_links;
CREATE POLICY "RBAC_FamilyLinks_Select" ON public.family_links FOR SELECT TO authenticated USING (public.has_permission('people.read'::text));
DROP POLICY IF EXISTS "RBAC_FamilyLinks_Insert" ON public.family_links;
CREATE POLICY "RBAC_FamilyLinks_Insert" ON public.family_links FOR INSERT TO authenticated WITH CHECK (public.has_permission('people.update'::text));
DROP POLICY IF EXISTS "RBAC_FamilyLinks_Update" ON public.family_links;
CREATE POLICY "RBAC_FamilyLinks_Update" ON public.family_links FOR UPDATE TO authenticated USING (public.has_permission('people.update'::text));

-- 3. Core Engine Tables. 
-- Since insert/update operations will happen inside SECURITY DEFINER RPC functions
-- we only need SELECT permissions exposed to the App UI client!

DROP POLICY IF EXISTS "RBAC_Registry_Select" ON public.membership_number_registry;
CREATE POLICY "RBAC_Registry_Select" ON public.membership_number_registry FOR SELECT TO authenticated USING (public.has_permission('memberships.read'::text));
DROP POLICY IF EXISTS "RBAC_Sequences_Select" ON public.membership_number_sequences;
CREATE POLICY "RBAC_Sequences_Select" ON public.membership_number_sequences FOR SELECT TO authenticated USING (public.has_permission('memberships.read'::text));
