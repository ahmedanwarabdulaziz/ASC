-- =============================================================================
-- Migration: 20260504020_facility_operating_hours
-- Phase 4: Facility Operating Hours and Exceptions
-- =============================================================================

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'facility_operating_status') THEN
    CREATE TYPE public.facility_operating_status AS ENUM ('available', 'maintenance', 'closed');
  END IF;
END $$;

-- 2. Tables

-- Regular Weekly Schedule
CREATE TABLE IF NOT EXISTS public.facility_operating_hours (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.sports_facilities(id) on delete cascade,
  day_of_week integer not null check(day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  status public.facility_operating_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(start_time < end_time)
);

-- Specific Date Exceptions
CREATE TABLE IF NOT EXISTS public.facility_operating_exceptions (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.sports_facilities(id) on delete cascade,
  exception_date date not null,
  start_time time not null,
  end_time time not null,
  status public.facility_operating_status not null default 'maintenance',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(start_time < end_time)
);

-- 3. RLS
ALTER TABLE public.facility_operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_operating_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read facility_operating_hours" ON public.facility_operating_hours;
CREATE POLICY "Allow authenticated read facility_operating_hours" ON public.facility_operating_hours FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read facility_operating_exceptions" ON public.facility_operating_exceptions;
CREATE POLICY "Allow authenticated read facility_operating_exceptions" ON public.facility_operating_exceptions FOR SELECT TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_facility_operating_hours_facility_day ON public.facility_operating_hours(facility_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_facility_operating_exceptions_facility_date ON public.facility_operating_exceptions(facility_id, exception_date);
