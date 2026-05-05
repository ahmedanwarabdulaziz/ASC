-- =============================================================================
-- Migration: 20260504031_staff_group_role_links
-- Phase 3: Staff group to system role mapping
-- =============================================================================
-- Links staff_groups to role_definitions so staff settings can choose the
-- access profile that should be associated with each group.
-- =============================================================================

ALTER TABLE public.staff_groups
  ADD COLUMN IF NOT EXISTS role_id uuid
  REFERENCES public.role_definitions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_groups_role_id
  ON public.staff_groups(role_id)
  WHERE role_id IS NOT NULL;

COMMENT ON COLUMN public.staff_groups.role_id IS
  'Optional system role linked to this staff group. Use this as the access profile source.';
