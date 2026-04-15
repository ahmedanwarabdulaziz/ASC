-- =========================================================
-- MILESTONE 2: ENUM EXPANSIONS
-- =========================================================

-- Expand relationship_type to include father and mother 
-- (Postgres strictly allows adding to ENUMs)
ALTER TYPE public.relationship_type ADD VALUE IF NOT EXISTS 'father';
ALTER TYPE public.relationship_type ADD VALUE IF NOT EXISTS 'mother';
