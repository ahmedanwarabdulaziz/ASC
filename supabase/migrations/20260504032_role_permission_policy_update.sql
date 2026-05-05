-- =============================================================================
-- Migration: 20260504032_role_permission_policy_update
-- Phase 1/3: Role permission mapping policy alignment
-- =============================================================================
-- Editing which permissions belong to a role is an update-style admin action.
-- This policy keeps role deletion separate, but lets authorized role managers
-- remove permission mappings without needing roles.delete.
-- =============================================================================

DROP POLICY IF EXISTS "system_role_permissions__delete__roles_delete"
  ON public.system_role_permissions;

CREATE POLICY "system_role_permissions__delete__roles_update"
  ON public.system_role_permissions FOR DELETE
  TO authenticated
  USING (public.has_permission('roles.update'));
