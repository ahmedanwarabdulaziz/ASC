-- =============================================================================
-- Migration: 20260504001_security_schema
-- Phase 1: Security and Access Foundation
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- Creates the core security tables needed before any business module grows.
-- Order matters: role_definitions must exist before system_role_permissions.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. role_definitions
-- A minimal table to hold named system roles.
-- Expanded further in Phase 2 when roles gain fields and UI.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_definitions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text        NOT NULL UNIQUE,
  name_ar     text        NOT NULL,
  name_en     text,
  description text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.role_definitions IS
  'System role definitions. Business roles and system permissions are separate concepts.';

-- ---------------------------------------------------------------------------
-- 2. system_permissions
-- Authoritative list of all permission codes in the system.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_permissions (
  code        text        PRIMARY KEY,
  name_ar     text        NOT NULL,
  name_en     text,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.system_permissions IS
  'Permission codes used in RLS policies and server-side checks.';

-- ---------------------------------------------------------------------------
-- 3. system_role_permissions
-- Many-to-many: which permissions each role has.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_role_permissions (
  role_id         uuid NOT NULL REFERENCES public.role_definitions(id) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES public.system_permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_code)
);

COMMENT ON TABLE public.system_role_permissions IS
  'Maps system roles to their allowed permission codes.';

-- ---------------------------------------------------------------------------
-- 4. system_users
-- Links Supabase auth.users to internal people records.
-- person_id will be a FK to public.people once that table exists in Phase 2.
-- For Phase 1 the column is present but the FK constraint is deferred.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_users (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id    uuid,       -- FK to public.people added in Phase 2 migration
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.system_users IS
  'Maps Supabase auth users to internal person records. person_id FK enforced in Phase 2.';

CREATE INDEX IF NOT EXISTS idx_system_users_auth_user_id
  ON public.system_users(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_system_users_person_id
  ON public.system_users(person_id)
  WHERE person_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. person_roles
-- Assigns a system role to a person (via system_users).
-- A person may hold multiple active roles.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.person_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id  uuid        NOT NULL,  -- FK to public.people added in Phase 2
  role_id    uuid        NOT NULL REFERENCES public.role_definitions(id) ON DELETE RESTRICT,
  is_active  boolean     NOT NULL DEFAULT true,
  granted_at timestamptz NOT NULL DEFAULT now(),
  ended_at   timestamptz,
  granted_by uuid        REFERENCES auth.users(id),
  ended_by   uuid        REFERENCES auth.users(id),
  UNIQUE (person_id, role_id)
);

COMMENT ON TABLE public.person_roles IS
  'Active role assignments for people. Multiple concurrent roles are supported.';

CREATE INDEX IF NOT EXISTS idx_person_roles_person_id
  ON public.person_roles(person_id);

CREATE INDEX IF NOT EXISTS idx_person_roles_role_id
  ON public.person_roles(role_id);

-- ---------------------------------------------------------------------------
-- 6. audit_logs
-- Append-only record of important system actions.
-- Never hard-delete from this table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid       REFERENCES auth.users(id),
  action       text        NOT NULL,       -- e.g. 'people.create', 'membership.archive'
  entity_type  text        NOT NULL,       -- e.g. 'people', 'memberships'
  entity_id    uuid,
  old_data     jsonb,
  new_data     jsonb,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS
  'Append-only audit trail. No UPDATE or DELETE allowed on this table.';

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id
  ON public.audit_logs(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- Enable RLS on all new tables
-- Policies are defined in the rls_foundation migration.
-- ---------------------------------------------------------------------------
ALTER TABLE public.role_definitions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs              ENABLE ROW LEVEL SECURITY;
