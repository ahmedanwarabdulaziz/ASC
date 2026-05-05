-- =============================================================================
-- Migration: 20260504015_sports_catalog
-- Phase 4B: Sports Catalog Schema
-- =============================================================================

-- 1. Enums
CREATE TYPE public.sport_sector_type AS ENUM ('practice', 'competition');
CREATE TYPE public.sport_classification_mode AS ENUM ('age_only', 'level_only', 'age_and_level', 'manual');
CREATE TYPE public.sport_age_reference_rule AS ENUM ('january_1_of_evaluation_year');

-- 2. Tables

CREATE TABLE public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE public.sport_sectors (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  sector_type public.sport_sector_type not null,
  name text not null,
  classification_mode public.sport_classification_mode not null default 'manual',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sport_id, sector_type),
  unique(sport_id, name)
);

CREATE TABLE public.sport_levels (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  code text not null,
  name text not null,
  sort_order integer not null check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sport_id, code),
  unique(sport_id, sort_order)
);

CREATE TABLE public.sport_age_groups (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  sector_id uuid references public.sport_sectors(id) on delete cascade,
  name text not null,
  age_reference_rule public.sport_age_reference_rule not null default 'january_1_of_evaluation_year',
  min_age_years integer check (min_age_years >= 0),
  max_age_years integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    max_age_years IS NULL
    OR min_age_years IS NULL
    OR max_age_years >= min_age_years
  ),
  unique(sport_id, sector_id, name)
);

COMMENT ON TABLE public.sport_age_groups IS
  'Age groups are evaluated against a fixed reference date, not the live age on today''s date.';

COMMENT ON COLUMN public.sport_age_groups.age_reference_rule IS
  'Current rule: calculate age on January 1 of the evaluation year. The evaluation year may be the current operational year or a later season year.';

COMMENT ON COLUMN public.sport_age_groups.min_age_years IS
  'Minimum allowed age in full years on the configured reference date.';

COMMENT ON COLUMN public.sport_age_groups.max_age_years IS
  'Maximum allowed age in full years on the configured reference date.';

-- 3. Indexes
CREATE INDEX idx_sport_sectors_sport_id ON public.sport_sectors(sport_id);
CREATE INDEX idx_sport_levels_sport_id ON public.sport_levels(sport_id);
CREATE INDEX idx_sport_age_groups_sport_id ON public.sport_age_groups(sport_id);
CREATE INDEX idx_sport_age_groups_sector_id ON public.sport_age_groups(sector_id);

-- 4. Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('sports.view', 'عرض الألعاب', 'Sports View', 'View sports catalog'),
  ('sports.create', 'إضافة لعبة', 'Sports Create', 'Create new sport'),
  ('sports.update', 'تعديل لعبة', 'Sports Update', 'Update sport'),
  ('sports.archive', 'أرشفة لعبة', 'Sports Archive', 'Archive sport'),
  ('sports.manage_setup', 'إعداد القطاعات', 'Sports Manage Setup', 'Manage sport sectors'),
  ('sports.manage_levels', 'إعداد المستويات', 'Sports Manage Levels', 'Manage sport levels'),
  ('sports.manage_age_groups', 'إعداد المراحل السنية', 'Sports Manage Age Groups', 'Manage sport age groups')
ON CONFLICT (code) DO NOTHING;

-- Map to system_admin
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('sports.view'),
    ('sports.create'),
    ('sports.update'),
    ('sports.archive'),
    ('sports.manage_setup'),
    ('sports.manage_levels'),
    ('sports.manage_age_groups')
) AS perms(permission_code)
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;

-- 5. RLS Policies
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_age_groups ENABLE ROW LEVEL SECURITY;

-- Note: In this project, RLS is often handled by broad select policies and relying on RPCs for mutations.
-- For now, allow authenticated read access to all catalog tables.
CREATE POLICY "Allow authenticated read sports" ON public.sports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read sport_sectors" ON public.sport_sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read sport_levels" ON public.sport_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read sport_age_groups" ON public.sport_age_groups FOR SELECT TO authenticated USING (true);

-- 6. RPC: create_sport_transaction
CREATE OR REPLACE FUNCTION public.create_sport_transaction(
  p_name text,
  p_description text DEFAULT NULL,
  p_practice_mode public.sport_classification_mode DEFAULT 'level_only',
  p_competition_mode public.sport_classification_mode DEFAULT 'age_and_level'
) RETURNS uuid AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_sport_id uuid;
BEGIN
  IF NOT public.has_permission('sports.create') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not have sports.create permission';
  END IF;

  -- Insert sport
  INSERT INTO public.sports (name, description)
  VALUES (p_name, p_description)
  RETURNING id INTO v_sport_id;

  -- Insert Practice Sector
  INSERT INTO public.sport_sectors (sport_id, sector_type, name, classification_mode)
  VALUES (v_sport_id, 'practice', 'قطاع الممارسة', p_practice_mode);

  -- Insert Competition Sector
  INSERT INTO public.sport_sectors (sport_id, sector_type, name, classification_mode)
  VALUES (v_sport_id, 'competition', 'قطاع البطولة', p_competition_mode);

  -- Audit Log
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (
    v_caller_id,
    'sports.create',
    'sports',
    v_sport_id,
    jsonb_build_object(
      'name', p_name,
      'description', p_description,
      'practice_mode', p_practice_mode,
      'competition_mode', p_competition_mode
    )
  );

  RETURN v_sport_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
