-- =============================================================================
-- Migration: 20260504008_update_phase1_fks
-- Phase 2: People and Membership Foundation
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- Adds foreign key constraints from Phase 1 security tables
-- to the Phase 2 people table.
-- =============================================================================

-- Add person_id FK to system_users
ALTER TABLE public.system_users
  ADD CONSTRAINT fk_system_users_person_id
  FOREIGN KEY (person_id)
  REFERENCES public.people(id)
  ON DELETE RESTRICT;

-- Add person_id FK to person_roles
ALTER TABLE public.person_roles
  ADD CONSTRAINT fk_person_roles_person_id
  FOREIGN KEY (person_id)
  REFERENCES public.people(id)
  ON DELETE RESTRICT;
