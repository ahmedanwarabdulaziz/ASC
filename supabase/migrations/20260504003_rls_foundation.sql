-- =============================================================================
-- Migration: 20260504003_rls_foundation
-- Phase 1: Security and Access Foundation
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- 1. Drops ALL permissive "Allow all authenticated users full access" policies.
-- 2. Adds scoped RLS policies using has_permission() for new security tables.
-- 3. Hardens audit_logs so it is append-only (no UPDATE or DELETE via RLS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Drop any existing permissive policies
-- ---------------------------------------------------------------------------
-- We use a safe pattern: DROP POLICY IF EXISTS on each known table.
-- If you have additional permissive policies not listed here, add them below.
-- ---------------------------------------------------------------------------

-- role_definitions (new table — drop any auto-created permissive policies)
DROP POLICY IF EXISTS "Allow all authenticated users full access to role_definitions" ON public.role_definitions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.role_definitions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.role_definitions;

-- system_permissions
DROP POLICY IF EXISTS "Allow all authenticated users full access to system_permissions" ON public.system_permissions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.system_permissions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.system_permissions;

-- system_role_permissions
DROP POLICY IF EXISTS "Allow all authenticated users full access to system_role_permissions" ON public.system_role_permissions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.system_role_permissions;

-- system_users
DROP POLICY IF EXISTS "Allow all authenticated users full access to system_users" ON public.system_users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.system_users;

-- person_roles
DROP POLICY IF EXISTS "Allow all authenticated users full access to person_roles" ON public.person_roles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.person_roles;

-- audit_logs
DROP POLICY IF EXISTS "Allow all authenticated users full access to audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.audit_logs;

-- ---------------------------------------------------------------------------
-- STEP 2: RLS policies — role_definitions
-- ---------------------------------------------------------------------------

-- SELECT: requires roles.read permission
CREATE POLICY "role_definitions__select__roles_read"
  ON public.role_definitions FOR SELECT
  TO authenticated
  USING (public.has_permission('roles.read'));

-- INSERT: requires roles.create permission
CREATE POLICY "role_definitions__insert__roles_create"
  ON public.role_definitions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('roles.create'));

-- UPDATE: requires roles.update permission
CREATE POLICY "role_definitions__update__roles_update"
  ON public.role_definitions FOR UPDATE
  TO authenticated
  USING (public.has_permission('roles.update'))
  WITH CHECK (public.has_permission('roles.update'));

-- DELETE: only system_admin may delete a role, and only if no operational history exists.
-- Note: Phase 1 keeps DELETE very restricted. Phase 2 may add business-rule checks.
CREATE POLICY "role_definitions__delete__roles_delete"
  ON public.role_definitions FOR DELETE
  TO authenticated
  USING (public.has_permission('roles.delete'));

-- ---------------------------------------------------------------------------
-- STEP 3: RLS policies — system_permissions
-- ---------------------------------------------------------------------------

-- SELECT: any authenticated user can read the permission code catalog
CREATE POLICY "system_permissions__select__authenticated"
  ON public.system_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- INSERT / UPDATE / DELETE: settings.update (admin-level only)
CREATE POLICY "system_permissions__insert__settings_update"
  ON public.system_permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('settings.update'));

CREATE POLICY "system_permissions__update__settings_update"
  ON public.system_permissions FOR UPDATE
  TO authenticated
  USING (public.has_permission('settings.update'))
  WITH CHECK (public.has_permission('settings.update'));

CREATE POLICY "system_permissions__delete__settings_update"
  ON public.system_permissions FOR DELETE
  TO authenticated
  USING (public.has_permission('settings.update'));

-- ---------------------------------------------------------------------------
-- STEP 4: RLS policies — system_role_permissions
-- ---------------------------------------------------------------------------

-- SELECT: requires roles.read
CREATE POLICY "system_role_permissions__select__roles_read"
  ON public.system_role_permissions FOR SELECT
  TO authenticated
  USING (public.has_permission('roles.read'));

-- INSERT / UPDATE: requires roles.update
CREATE POLICY "system_role_permissions__insert__roles_update"
  ON public.system_role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('roles.update'));

-- DELETE: requires roles.delete
CREATE POLICY "system_role_permissions__delete__roles_delete"
  ON public.system_role_permissions FOR DELETE
  TO authenticated
  USING (public.has_permission('roles.delete'));

-- ---------------------------------------------------------------------------
-- STEP 5: RLS policies — system_users
-- ---------------------------------------------------------------------------

-- SELECT: a user can always read their own record; admins can read all
CREATE POLICY "system_users__select__own_or_roles_read"
  ON public.system_users FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR public.has_permission('roles.read')
  );

-- INSERT: only system_admin (onboarding new system users is an admin action)
CREATE POLICY "system_users__insert__system_admin"
  ON public.system_users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_system_admin());

-- UPDATE: own record OR admin
CREATE POLICY "system_users__update__own_or_admin"
  ON public.system_users FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR public.is_system_admin()
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    OR public.is_system_admin()
  );

-- DELETE: BLOCKED. Use is_active = false to deactivate instead.
-- No DELETE policy created → RLS blocks all deletes.

-- ---------------------------------------------------------------------------
-- STEP 6: RLS policies — person_roles
-- ---------------------------------------------------------------------------

-- SELECT: requires roles.read
CREATE POLICY "person_roles__select__roles_read"
  ON public.person_roles FOR SELECT
  TO authenticated
  USING (public.has_permission('roles.read'));

-- INSERT: requires roles.create
CREATE POLICY "person_roles__insert__roles_create"
  ON public.person_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('roles.create'));

-- UPDATE: requires roles.update (used to set ended_at, is_active=false)
CREATE POLICY "person_roles__update__roles_update"
  ON public.person_roles FOR UPDATE
  TO authenticated
  USING (public.has_permission('roles.update'))
  WITH CHECK (public.has_permission('roles.update'));

-- DELETE: BLOCKED. End roles by setting ended_at + is_active=false.
-- No DELETE policy created.

-- ---------------------------------------------------------------------------
-- STEP 7: RLS policies — audit_logs (append-only)
-- ---------------------------------------------------------------------------

-- SELECT: requires audit.read permission
CREATE POLICY "audit_logs__select__audit_read"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_permission('audit.read'));

-- INSERT: any authenticated user (server code inserts audit entries)
-- The server-side logAction() function uses the session client so this is safe.
-- Service-role bypasses RLS anyway; this policy allows app server actions too.
CREATE POLICY "audit_logs__insert__authenticated"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: BLOCKED. Audit logs are immutable.
-- No UPDATE policy created.

-- DELETE: BLOCKED. Audit logs are permanent.
-- No DELETE policy created.
