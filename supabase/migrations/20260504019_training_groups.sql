-- =============================================================================
-- Migration: 20260504019_training_groups
-- Phase 4E: Training Groups & Scheduling
-- =============================================================================

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_group_status') THEN
    CREATE TYPE public.training_group_status AS ENUM ('draft', 'active', 'paused', 'archived');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_group_coach_role') THEN
    CREATE TYPE public.training_group_coach_role AS ENUM ('primary_coach', 'assistant_coach', 'supervisor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_enrollment_status') THEN
    CREATE TYPE public.training_enrollment_status AS ENUM ('active', 'paused', 'ended');
  END IF;
END $$;

-- 2. Tables

CREATE TABLE IF NOT EXISTS public.training_groups (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete restrict,
  sector_id uuid not null references public.sport_sectors(id) on delete restrict,
  name text not null,
  age_group_id uuid references public.sport_age_groups(id) on delete set null,
  level_id uuid references public.sport_levels(id) on delete set null,
  min_players integer,
  max_players integer,
  training_units_per_month integer,
  status public.training_group_status not null default 'draft',
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sport_id, sector_id, name)
);

CREATE TABLE IF NOT EXISTS public.training_group_coaches (
  id uuid primary key default gen_random_uuid(),
  training_group_id uuid not null references public.training_groups(id) on delete cascade,
  staff_member_id uuid not null references public.staff_members(id) on delete restrict,
  role public.training_group_coach_role not null default 'assistant_coach',
  commission_share numeric(5,2),
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(training_group_id, staff_member_id)
);

CREATE TABLE IF NOT EXISTS public.training_group_sessions (
  id uuid primary key default gen_random_uuid(),
  training_group_id uuid not null references public.training_groups(id) on delete cascade,
  day_of_week integer not null check(day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  facility_area_id uuid not null references public.facility_areas(id) on delete restrict,
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(start_time < end_time)
);

CREATE TABLE IF NOT EXISTS public.training_group_enrollments (
  id uuid primary key default gen_random_uuid(),
  training_group_id uuid not null references public.training_groups(id) on delete cascade,
  sport_player_id uuid not null references public.sport_players(id) on delete cascade,
  status public.training_enrollment_status not null default 'active',
  enrolled_at date not null default current_date,
  ended_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(training_group_id, sport_player_id)
);

-- 3. RLS

ALTER TABLE public.training_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_group_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_group_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read training_groups" ON public.training_groups;
CREATE POLICY "Allow authenticated read training_groups" ON public.training_groups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read training_group_coaches" ON public.training_group_coaches;
CREATE POLICY "Allow authenticated read training_group_coaches" ON public.training_group_coaches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read training_group_sessions" ON public.training_group_sessions;
CREATE POLICY "Allow authenticated read training_group_sessions" ON public.training_group_sessions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read training_group_enrollments" ON public.training_group_enrollments;
CREATE POLICY "Allow authenticated read training_group_enrollments" ON public.training_group_enrollments FOR SELECT TO authenticated USING (true);

-- 4. Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('training_groups.view', 'عرض المجموعات التدريبية', 'Training Groups View', 'View training groups and schedules'),
  ('training_groups.manage', 'إدارة المجموعات', 'Training Groups Manage', 'Create/edit training groups and coaches'),
  ('training_groups.enroll', 'تسجيل في المجموعات', 'Training Groups Enroll', 'Enroll players into training groups')
ON CONFLICT (code) DO NOTHING;

-- Map to system_admin
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('training_groups.view'),
    ('training_groups.manage'),
    ('training_groups.enroll')
) AS perms(permission_code)
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;
