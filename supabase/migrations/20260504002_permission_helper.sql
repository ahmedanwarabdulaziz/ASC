-- =============================================================================
-- Migration: 20260504002_permission_helper
-- Phase 1: Security and Access Foundation
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- Creates database-level helper functions used inside RLS policies.
-- These functions are SECURITY DEFINER so RLS policies can call them safely.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: current_person_id()
-- Returns the internal person_id for the currently authenticated user.
-- Returns NULL if the user has no system_users record or is not authenticated.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_person_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT su.person_id
  FROM   public.system_users su
  WHERE  su.auth_user_id = auth.uid()
    AND  su.is_active = true
  LIMIT  1;
$$;

COMMENT ON FUNCTION public.current_person_id() IS
  'Returns the internal person_id linked to the currently authenticated Supabase user.
   Returns NULL when unauthenticated or no system_users record exists.';

-- ---------------------------------------------------------------------------
-- Helper: has_permission(permission_code text)
-- Returns true if the current user holds an active role that includes this code.
--
-- Chain traversed:
--   auth.uid()
--   → system_users.person_id      (active system user)
--   → person_roles.role_id        (active role assignments)
--   → system_role_permissions     (role-to-permission mapping)
--   → system_permissions          (permission code must exist)
--
-- Returns false (never throws) when:
--   - user is unauthenticated
--   - user has no system_users record
--   - user has no active person_roles
--   - no role grants the requested permission
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.system_users       su
    JOIN   public.person_roles       pr  ON pr.person_id = su.person_id
                                        AND pr.is_active  = true
                                        AND (pr.ended_at IS NULL OR pr.ended_at > now())
    JOIN   public.system_role_permissions srp ON srp.role_id = pr.role_id
    WHERE  su.auth_user_id = auth.uid()
      AND  su.is_active    = true
      AND  srp.permission_code = has_permission.permission_code
  );
$$;

COMMENT ON FUNCTION public.has_permission(text) IS
  'Returns true if the current authenticated user holds an active role that grants
   the specified permission code. Safe to use inside RLS policies — never throws.';

-- ---------------------------------------------------------------------------
-- Helper: is_system_admin()
-- Convenience shortcut: true if the user has the system_admin role.
-- Used in administrative RLS overrides.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.system_users su
    JOIN   public.person_roles pr ON pr.person_id = su.person_id
                                 AND pr.is_active  = true
                                 AND (pr.ended_at IS NULL OR pr.ended_at > now())
    JOIN   public.role_definitions rd ON rd.id = pr.role_id
    WHERE  su.auth_user_id = auth.uid()
      AND  su.is_active    = true
      AND  rd.code         = 'system_admin'
  );
$$;

COMMENT ON FUNCTION public.is_system_admin() IS
  'Returns true if the current user holds the system_admin role. Never throws.';
