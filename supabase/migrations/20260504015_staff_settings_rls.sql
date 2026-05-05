-- =============================================================================
-- Migration: 20260504015_staff_settings_rls
-- Phase 3: Staff settings write policies
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- Fixes RLS for staff settings tables so authorized users can create/update
-- categories, subcategories, groups, and jobs from the app.
-- No DELETE policies are created. Settings should be deactivated via is_active.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- staff_categories
-- ---------------------------------------------------------------------------
CREATE POLICY "staff_categories__insert__staff_manage_settings"
  ON public.staff_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('staff.manage_settings'));

CREATE POLICY "staff_categories__update__staff_manage_settings"
  ON public.staff_categories FOR UPDATE
  TO authenticated
  USING (public.has_permission('staff.manage_settings'))
  WITH CHECK (public.has_permission('staff.manage_settings'));

-- ---------------------------------------------------------------------------
-- staff_subcategories
-- ---------------------------------------------------------------------------
CREATE POLICY "staff_subcategories__insert__staff_manage_settings"
  ON public.staff_subcategories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('staff.manage_settings'));

CREATE POLICY "staff_subcategories__update__staff_manage_settings"
  ON public.staff_subcategories FOR UPDATE
  TO authenticated
  USING (public.has_permission('staff.manage_settings'))
  WITH CHECK (public.has_permission('staff.manage_settings'));

-- ---------------------------------------------------------------------------
-- staff_groups
-- ---------------------------------------------------------------------------
CREATE POLICY "staff_groups__insert__staff_manage_groups"
  ON public.staff_groups FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('staff.manage_groups'));

CREATE POLICY "staff_groups__update__staff_manage_groups"
  ON public.staff_groups FOR UPDATE
  TO authenticated
  USING (public.has_permission('staff.manage_groups'))
  WITH CHECK (public.has_permission('staff.manage_groups'));

-- ---------------------------------------------------------------------------
-- staff_jobs
-- ---------------------------------------------------------------------------
CREATE POLICY "staff_jobs__insert__staff_manage_jobs"
  ON public.staff_jobs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('staff.manage_jobs'));

CREATE POLICY "staff_jobs__update__staff_manage_jobs"
  ON public.staff_jobs FOR UPDATE
  TO authenticated
  USING (public.has_permission('staff.manage_jobs'))
  WITH CHECK (public.has_permission('staff.manage_jobs'));
