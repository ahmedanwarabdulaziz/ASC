-- =============================================================================
-- Migration: 20260504006_people_rls
-- Phase 2: People and Membership Foundation
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- Adds Row Level Security (RLS) policies for Phase 2 tables.
-- Uses the has_permission() helper from Phase 1.
-- NO DELETE policies are created, enforcing the "No Hard Delete" rule.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. people
-- ---------------------------------------------------------------------------
CREATE POLICY "people__select__people_read"
  ON public.people FOR SELECT
  TO authenticated
  USING (public.has_permission('people.read'));

CREATE POLICY "people__insert__people_create"
  ON public.people FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('people.create'));

CREATE POLICY "people__update__people_update"
  ON public.people FOR UPDATE
  TO authenticated
  USING (public.has_permission('people.update'))
  WITH CHECK (public.has_permission('people.update'));

-- DELETE: BLOCKED

-- ---------------------------------------------------------------------------
-- 2. family_links
-- ---------------------------------------------------------------------------
CREATE POLICY "family_links__select__people_read"
  ON public.family_links FOR SELECT
  TO authenticated
  USING (public.has_permission('people.read'));

CREATE POLICY "family_links__insert__people_create"
  ON public.family_links FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('people.create'));

CREATE POLICY "family_links__update__people_update"
  ON public.family_links FOR UPDATE
  TO authenticated
  USING (public.has_permission('people.update'))
  WITH CHECK (public.has_permission('people.update'));

-- DELETE: BLOCKED (Set is_active = false instead)

-- ---------------------------------------------------------------------------
-- 3. memberships
-- ---------------------------------------------------------------------------
CREATE POLICY "memberships__select__memberships_read"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (public.has_permission('memberships.read'));

CREATE POLICY "memberships__insert__memberships_create"
  ON public.memberships FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('memberships.create'));

CREATE POLICY "memberships__update__memberships_update"
  ON public.memberships FOR UPDATE
  TO authenticated
  USING (public.has_permission('memberships.update'))
  WITH CHECK (public.has_permission('memberships.update'));

-- DELETE: BLOCKED

-- ---------------------------------------------------------------------------
-- 4. membership_members (Dependents)
-- ---------------------------------------------------------------------------
CREATE POLICY "membership_members__select__memberships_read"
  ON public.membership_members FOR SELECT
  TO authenticated
  USING (public.has_permission('memberships.read'));

CREATE POLICY "membership_members__insert__add_dependent"
  ON public.membership_members FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('memberships.add_dependent'));

CREATE POLICY "membership_members__update__memberships_update"
  ON public.membership_members FOR UPDATE
  TO authenticated
  USING (public.has_permission('memberships.update'))
  WITH CHECK (public.has_permission('memberships.update'));

-- DELETE: BLOCKED

-- ---------------------------------------------------------------------------
-- 5. membership_number_registry
-- ---------------------------------------------------------------------------
CREATE POLICY "mem_num_registry__select__memberships_read"
  ON public.membership_number_registry FOR SELECT
  TO authenticated
  USING (public.has_permission('memberships.read'));

-- Managed purely via RPCs/Triggers using security definer, but we can allow insert/update for admins if needed.
-- For now, read-only via app.

-- ---------------------------------------------------------------------------
-- 6. membership_number_sequences
-- ---------------------------------------------------------------------------
CREATE POLICY "mem_num_sequences__select__memberships_read"
  ON public.membership_number_sequences FOR SELECT
  TO authenticated
  USING (public.has_permission('memberships.read'));

-- Read-only via app.

-- ---------------------------------------------------------------------------
-- 7. dependent_conversion_rules
-- ---------------------------------------------------------------------------
CREATE POLICY "dep_conv_rules__select__memberships_read"
  ON public.dependent_conversion_rules FOR SELECT
  TO authenticated
  USING (public.has_permission('memberships.read'));

CREATE POLICY "dep_conv_rules__insert__system_admin"
  ON public.dependent_conversion_rules FOR INSERT
  TO authenticated
  WITH CHECK (public.is_system_admin());

CREATE POLICY "dep_conv_rules__update__system_admin"
  ON public.dependent_conversion_rules FOR UPDATE
  TO authenticated
  USING (public.is_system_admin())
  WITH CHECK (public.is_system_admin());

-- ---------------------------------------------------------------------------
-- 8. membership_separation_requests
-- ---------------------------------------------------------------------------
CREATE POLICY "separation_req__select__memberships_read"
  ON public.membership_separation_requests FOR SELECT
  TO authenticated
  USING (public.has_permission('memberships.read'));

CREATE POLICY "separation_req__insert__request"
  ON public.membership_separation_requests FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('memberships.separation.request'));

CREATE POLICY "separation_req__update__various"
  ON public.membership_separation_requests FOR UPDATE
  TO authenticated
  USING (
    public.has_permission('memberships.separation.request') OR
    public.has_permission('memberships.separation.admin_approve') OR
    public.has_permission('memberships.separation.board_approve') OR
    public.has_permission('memberships.separation.payment_confirm')
  )
  WITH CHECK (
    public.has_permission('memberships.separation.request') OR
    public.has_permission('memberships.separation.admin_approve') OR
    public.has_permission('memberships.separation.board_approve') OR
    public.has_permission('memberships.separation.payment_confirm')
  );
