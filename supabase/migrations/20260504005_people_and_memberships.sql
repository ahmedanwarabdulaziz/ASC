-- =============================================================================
-- Migration: 20260504005_people_and_memberships
-- Phase 2: People and Membership Foundation
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- Creates the core registry for people and memberships.
-- Enforces National ID uniqueness and globally unique membership numbers.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. people
-- The single source of truth for human identity in the system.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.people (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code     text        NOT NULL UNIQUE DEFAULT ('P-' || upper(substr(md5(random()::text), 1, 8))),
  national_id       text        NOT NULL UNIQUE,
  first_name        text        NOT NULL,
  second_name       text        NOT NULL,
  third_name        text        NOT NULL,
  last_name         text        NOT NULL,
  phone_number      text,
  emergency_contact text,
  archived_at       timestamptz,
  archived_by       uuid        REFERENCES auth.users(id),
  archive_reason    text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.people IS 'Unified identity for every person (members, staff, dependents, visitors).';

CREATE INDEX IF NOT EXISTS idx_people_national_id ON public.people(national_id);
CREATE INDEX IF NOT EXISTS idx_people_phone_number ON public.people(phone_number);
CREATE INDEX IF NOT EXISTS idx_people_archived_at ON public.people(archived_at) WHERE archived_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. family_links
-- Generic relationships between people, independent of memberships.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_links (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id         uuid        NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
  related_person_id uuid        NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
  relation_type     text        NOT NULL, -- 'wife', 'husband', 'son', 'daughter', 'father', 'mother'
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, related_person_id)
);

COMMENT ON TABLE public.family_links IS 'General family relationships independent of membership structure.';

-- ---------------------------------------------------------------------------
-- 3. memberships
-- Represents the primary membership entity (working or sports).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type           text        NOT NULL, -- 'working', 'sports'
  main_person_id uuid        NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
  status         text        NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  archived_at    timestamptz,
  archived_by    uuid        REFERENCES auth.users(id),
  archive_reason text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.memberships IS 'Primary membership records.';

-- ---------------------------------------------------------------------------
-- 4. membership_members
-- Represents dependents attached to a membership.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_members (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid        NOT NULL REFERENCES public.memberships(id) ON DELETE RESTRICT,
  person_id     uuid        NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
  relation_type text        NOT NULL, -- 'wife', 'husband', 'son', 'daughter', 'father', 'mother'
  status        text        NOT NULL DEFAULT 'active', -- 'active', 'ended', 'separated'
  ended_at      timestamptz,
  ended_by      uuid        REFERENCES auth.users(id),
  end_reason    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (membership_id, person_id)
);

COMMENT ON TABLE public.membership_members IS 'Dependents attached to a main membership.';

-- ---------------------------------------------------------------------------
-- 5. membership_number_registry
-- Enforces globally unique membership numbers across the entire system.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_number_registry (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_number    text        NOT NULL UNIQUE,
  number_type          text        NOT NULL, -- 'working', 'sports', 'dependent'
  person_id            uuid        NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
  membership_id        uuid        NOT NULL REFERENCES public.memberships(id) ON DELETE RESTRICT,
  membership_member_id uuid        REFERENCES public.membership_members(id) ON DELETE RESTRICT,
  is_current           boolean     NOT NULL DEFAULT true,
  reason               text,
  ended_at             timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.membership_number_registry IS 'Globally unique registry for all membership numbers.';

CREATE INDEX IF NOT EXISTS idx_mem_num_reg_person_id ON public.membership_number_registry(person_id);
CREATE INDEX IF NOT EXISTS idx_mem_num_reg_membership_id ON public.membership_number_registry(membership_id);

-- ---------------------------------------------------------------------------
-- 6. membership_number_sequences
-- Tracks the next dependent suffix (e.g., 1123-1, 1123-2).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_number_sequences (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  base_membership_number text        NOT NULL UNIQUE,
  next_dependent_suffix  integer     NOT NULL DEFAULT 1,
  updated_at             timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.membership_number_sequences IS 'Tracks suffix sequences for dependent numbers.';

-- ---------------------------------------------------------------------------
-- 7. dependent_conversion_rules
-- Configurable rules for when a dependent can separate/convert.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dependent_conversion_rules (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  relation_type       text        NOT NULL UNIQUE,
  min_age_years       integer,
  min_membership_days integer,
  requires_admin_approval boolean NOT NULL DEFAULT true,
  requires_board_approval boolean NOT NULL DEFAULT true,
  requires_payment    boolean     NOT NULL DEFAULT true,
  is_separation_allowed boolean   NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.dependent_conversion_rules IS 'Configurable business rules for dependent separation.';

-- ---------------------------------------------------------------------------
-- 8. membership_separation_requests
-- Workflow tracker for dependent separation.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_separation_requests (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_member_id      uuid        NOT NULL REFERENCES public.membership_members(id) ON DELETE RESTRICT,
  requested_by              uuid        REFERENCES auth.users(id),
  status                    text        NOT NULL DEFAULT 'draft', -- 'draft', 'admin_approved', 'board_approved', 'payment_confirmed', 'completed', 'rejected', 'cancelled'
  admin_approved_by         uuid        REFERENCES auth.users(id),
  admin_approved_at         timestamptz,
  board_approved_by         uuid        REFERENCES auth.users(id),
  board_approved_at         timestamptz,
  board_decision_number     text,
  board_meeting_date        date,
  payment_confirmed_by      uuid        REFERENCES auth.users(id),
  payment_confirmed_at      timestamptz,
  new_working_membership_id uuid        REFERENCES public.memberships(id) ON DELETE RESTRICT,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.membership_separation_requests IS 'Workflow state for dependent separation requests.';

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables (policies defined in separate migration)
-- ---------------------------------------------------------------------------
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_number_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependent_conversion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_separation_requests ENABLE ROW LEVEL SECURITY;
