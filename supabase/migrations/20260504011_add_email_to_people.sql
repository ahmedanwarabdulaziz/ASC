-- =============================================================================
-- Migration: 20260504011_add_email_to_people
-- Description: Adds the email column to the people table.
-- =============================================================================

ALTER TABLE public.people ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_people_email ON public.people(email);
