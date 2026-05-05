-- =============================================================================
-- Migration: 20260504017_facilities_catalog
-- Phase 4C: Facilities Schema
-- =============================================================================

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'facility_type') THEN
    CREATE TYPE public.facility_type AS ENUM ('pool', 'field', 'court', 'hall', 'gym', 'track', 'room', 'other');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'facility_area_type') THEN
    CREATE TYPE public.facility_area_type AS ENUM ('lane', 'square', 'court', 'field_zone', 'room', 'full_facility', 'other');
  END IF;
END $$;

-- 2. Tables

CREATE TABLE IF NOT EXISTS public.sports_facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  facility_type public.facility_type not null default 'other',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.facility_sports (
  facility_id uuid not null references public.sports_facilities(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  primary key (facility_id, sport_id)
);

CREATE TABLE IF NOT EXISTS public.facility_areas (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.sports_facilities(id) on delete cascade,
  name text not null,
  area_type public.facility_area_type not null default 'other',
  capacity integer check (capacity > 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(facility_id, name)
);

-- 3. RLS
ALTER TABLE public.sports_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read sports_facilities" ON public.sports_facilities;
CREATE POLICY "Allow authenticated read sports_facilities" ON public.sports_facilities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read facility_sports" ON public.facility_sports;
CREATE POLICY "Allow authenticated read facility_sports" ON public.facility_sports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read facility_areas" ON public.facility_areas;
CREATE POLICY "Allow authenticated read facility_areas" ON public.facility_areas FOR SELECT TO authenticated USING (true);

-- 4. Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('facilities.view', 'عرض المنشآت', 'Facilities View', 'View facilities catalog'),
  ('facilities.create', 'إضافة منشأة', 'Facilities Create', 'Create new facility'),
  ('facilities.update', 'تعديل منشأة', 'Facilities Update', 'Update facility'),
  ('facilities.manage_areas', 'إعداد الساحات الفرعية', 'Facilities Manage Areas', 'Manage facility areas')
ON CONFLICT (code) DO NOTHING;

-- Map to system_admin
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('facilities.view'),
    ('facilities.create'),
    ('facilities.update'),
    ('facilities.manage_areas')
) AS perms(permission_code)
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;
