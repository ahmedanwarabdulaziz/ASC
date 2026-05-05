-- Phase 3: Staff Foundation Migration
-- Creates the schema, permissions, and RPCs for the Staff Module

-- 1. Enums
CREATE TYPE public.staff_account_policy AS ENUM ('none', 'optional', 'required');
CREATE TYPE public.staff_member_status AS ENUM ('active', 'suspended', 'ended');

-- 2. Tables
CREATE TABLE public.staff_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE public.staff_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.staff_categories(id) on delete restrict,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(category_id, name)
);

CREATE TABLE public.staff_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE public.staff_jobs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.staff_categories(id) on delete restrict,
  subcategory_id uuid references public.staff_subcategories(id) on delete restrict,
  default_group_id uuid references public.staff_groups(id) on delete restrict,
  name text not null,
  description text,
  is_training_sector boolean not null default false,
  is_training_commissionable boolean not null default false,
  account_policy public.staff_account_policy not null default 'none',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(category_id, subcategory_id, name)
);

CREATE TABLE public.staff_members (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete restrict,
  staff_code text unique,
  job_id uuid not null references public.staff_jobs(id) on delete restrict,
  group_id uuid not null references public.staff_groups(id) on delete restrict,
  user_id uuid references auth.users(id) on delete restrict,
  status public.staff_member_status not null default 'active',
  hired_at date,
  ended_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraint: Only one active/suspended staff record per person
CREATE UNIQUE INDEX idx_staff_members_active_suspended 
ON public.staff_members(person_id) 
WHERE status IN ('active', 'suspended');

-- Indexes
CREATE INDEX idx_staff_members_person_id ON public.staff_members(person_id);
CREATE INDEX idx_staff_members_group_id ON public.staff_members(group_id);
CREATE INDEX idx_staff_members_job_id ON public.staff_members(job_id);
CREATE INDEX idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX idx_staff_members_status ON public.staff_members(status);
CREATE INDEX idx_staff_jobs_category_id ON public.staff_jobs(category_id);
CREATE INDEX idx_staff_jobs_subcategory_id ON public.staff_jobs(subcategory_id);
CREATE INDEX idx_staff_jobs_default_group_id ON public.staff_jobs(default_group_id);
CREATE INDEX idx_staff_subcategories_category_id ON public.staff_subcategories(category_id);

-- 3. RLS
ALTER TABLE public.staff_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read staff structure for dropdowns
CREATE POLICY "staff_read_access" ON public.staff_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "staff_read_access" ON public.staff_subcategories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "staff_read_access" ON public.staff_groups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "staff_read_access" ON public.staff_jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "staff_read_access" ON public.staff_members FOR SELECT USING (public.has_permission('staff.view'));

-- 4. Triggers for updated_at (Not used in this project pattern, handled in RPCs)

-- 5. Seed Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en) VALUES
('staff.view', 'عرض الموظفين', 'View Staff'),
('staff.create', 'إضافة موظف', 'Create Staff'),
('staff.update', 'تعديل موظف', 'Update Staff'),
('staff.archive', 'أرشفة موظف', 'Archive Staff'),
('staff.manage_settings', 'إدارة إعدادات الموظفين', 'Manage Staff Settings'),
('staff.manage_groups', 'إدارة مجموعات الموظفين', 'Manage Staff Groups'),
('staff.manage_jobs', 'إدارة وظائف الموظفين', 'Manage Staff Jobs')
ON CONFLICT (code) DO NOTHING;

-- Grant to system_admin role
DO $$
DECLARE
  v_admin_role_id uuid;
BEGIN
  SELECT id INTO v_admin_role_id FROM public.role_definitions WHERE code = 'system_admin';
  IF v_admin_role_id IS NOT NULL THEN
    INSERT INTO public.system_role_permissions (role_id, permission_code)
    SELECT v_admin_role_id, code FROM public.system_permissions WHERE code LIKE 'staff.%'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 6. RPCs
-- Create Staff Member Transaction
CREATE OR REPLACE FUNCTION public.create_staff_member_transaction(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_person_id uuid;
  v_staff_id uuid;
  v_job_id uuid;
  v_group_id uuid;
  v_default_group_id uuid;
  v_existing_staff boolean;
  v_job_policy public.staff_account_policy;
BEGIN
  IF NOT public.has_permission('staff.create') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  v_job_id := (p_payload->>'job_id')::uuid;
  v_group_id := (p_payload->>'group_id')::uuid;

  SELECT default_group_id, account_policy INTO v_default_group_id, v_job_policy
  FROM public.staff_jobs WHERE id = v_job_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive job');
  END IF;

  IF v_group_id IS NULL THEN
    v_group_id := v_default_group_id;
  END IF;

  IF v_group_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group ID is required and job has no default group');
  END IF;

  -- Identity resolution
  IF p_payload->>'person_id' IS NOT NULL THEN
    v_person_id := (p_payload->>'person_id')::uuid;
  ELSE
    SELECT id INTO v_person_id FROM public.people WHERE national_id = p_payload->>'national_id';
    IF v_person_id IS NULL THEN
      INSERT INTO public.people (
        national_id, first_name, second_name, third_name, last_name, phone_number, email
      ) VALUES (
        p_payload->>'national_id',
        p_payload->>'first_name',
        p_payload->>'second_name',
        p_payload->>'third_name',
        p_payload->>'last_name',
        p_payload->>'phone_number',
        p_payload->>'email'
      ) RETURNING id INTO v_person_id;
    END IF;
  END IF;

  -- Check duplicate staff
  SELECT EXISTS (
    SELECT 1 FROM public.staff_members WHERE person_id = v_person_id AND status IN ('active', 'suspended')
  ) INTO v_existing_staff;

  IF v_existing_staff THEN
    RETURN jsonb_build_object('success', false, 'error', 'Person already has an active or suspended staff record');
  END IF;

  INSERT INTO public.staff_members (
    person_id, staff_code, job_id, group_id, status, hired_at, notes
  ) VALUES (
    v_person_id,
    p_payload->>'staff_code',
    v_job_id,
    v_group_id,
    COALESCE((p_payload->>'status')::public.staff_member_status, 'active'::public.staff_member_status),
    (p_payload->>'hired_at')::date,
    p_payload->>'notes'
  ) RETURNING id INTO v_staff_id;

  PERFORM public.internal_audit_log('staff.create', 'staff_members', v_staff_id, p_payload);

  RETURN jsonb_build_object('success', true, 'staff_member_id', v_staff_id, 'person_id', v_person_id);
END;
$$;

-- Update Staff Member Transaction
CREATE OR REPLACE FUNCTION public.update_staff_member_transaction(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_staff_id uuid;
  v_person_id uuid;
  v_job_id uuid;
  v_status public.staff_member_status;
BEGIN
  IF NOT public.has_permission('staff.update') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  v_staff_id := (p_payload->>'id')::uuid;
  
  SELECT person_id INTO v_person_id FROM public.staff_members WHERE id = v_staff_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Staff member not found');
  END IF;

  v_job_id := (p_payload->>'job_id')::uuid;
  v_status := (p_payload->>'status')::public.staff_member_status;

  IF v_status = 'ended' AND (p_payload->>'ended_at') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ended date is required when status is ended');
  END IF;

  UPDATE public.staff_members SET
    staff_code = p_payload->>'staff_code',
    job_id = v_job_id,
    group_id = (p_payload->>'group_id')::uuid,
    user_id = (p_payload->>'user_id')::uuid,
    status = v_status,
    hired_at = (p_payload->>'hired_at')::date,
    ended_at = (p_payload->>'ended_at')::date,
    notes = p_payload->>'notes',
    updated_at = now()
  WHERE id = v_staff_id;

  -- Optional person update
  IF p_payload->>'update_person' = 'true' THEN
    UPDATE public.people SET
      national_id = p_payload->>'national_id',
      first_name = p_payload->>'first_name',
      second_name = p_payload->>'second_name',
      third_name = p_payload->>'third_name',
      last_name = p_payload->>'last_name',
      phone_number = p_payload->>'phone_number',
      email = p_payload->>'email'
    WHERE id = v_person_id;
  END IF;

  PERFORM public.internal_audit_log('staff.update', 'staff_members', v_staff_id, p_payload);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Archive Staff Member Transaction
CREATE OR REPLACE FUNCTION public.archive_staff_member_transaction(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_staff_id uuid;
  v_notes text;
BEGIN
  IF NOT public.has_permission('staff.archive') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  v_staff_id := (p_payload->>'id')::uuid;
  v_notes := p_payload->>'notes';

  UPDATE public.staff_members SET
    status = 'ended',
    ended_at = COALESCE((p_payload->>'ended_at')::date, CURRENT_DATE),
    notes = CASE WHEN v_notes IS NOT NULL THEN COALESCE(notes, '') || E'\n' || v_notes ELSE notes END,
    updated_at = now()
  WHERE id = v_staff_id;

  PERFORM public.internal_audit_log('staff.archive', 'staff_members', v_staff_id, p_payload);

  RETURN jsonb_build_object('success', true);
END;
$$;
