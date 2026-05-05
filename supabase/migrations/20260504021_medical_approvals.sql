-- =============================================================================
-- Migration: 20260504021_medical_approvals
-- Phase 4F: Medical Approvals & Requirements
-- =============================================================================

-- 1. Add requires_medical_approval to sport_sectors
ALTER TABLE public.sport_sectors 
ADD COLUMN IF NOT EXISTS requires_medical_approval boolean NOT NULL DEFAULT false;

-- 2. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medical_approval_status') THEN
    CREATE TYPE public.medical_approval_status AS ENUM ('valid', 'expired', 'revoked');
  END IF;
END $$;

-- 3. Table: sport_medical_approvals
CREATE TABLE IF NOT EXISTS public.sport_medical_approvals (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  sector_type public.sport_sector_type not null,
  issue_date date not null,
  validity_months integer not null check(validity_months > 0),
  expiry_date date not null,
  status public.medical_approval_status not null default 'valid',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for querying active approvals
CREATE INDEX IF NOT EXISTS idx_sport_medical_approvals_person_sector 
ON public.sport_medical_approvals(person_id, sector_type) 
WHERE status = 'valid';

-- 4. Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('medical_approvals.view', 'عرض الموافقات الطبية', 'Medical Approvals View', 'View medical approvals'),
  ('medical_approvals.manage', 'إدارة الموافقات الطبية', 'Medical Approvals Manage', 'Create/edit medical approvals')
ON CONFLICT (code) DO NOTHING;

-- Map to system_admin
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('medical_approvals.view'),
    ('medical_approvals.manage')
) AS perms(permission_code)
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;

-- 5. RLS
ALTER TABLE public.sport_medical_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read sport_medical_approvals" ON public.sport_medical_approvals;
CREATE POLICY "Allow authenticated read sport_medical_approvals" 
ON public.sport_medical_approvals FOR SELECT TO authenticated USING (true);

-- 6. RPC: check_medical_approval
-- Returns true if medical approval is valid OR if the sector does not require it.
CREATE OR REPLACE FUNCTION public.check_medical_approval(p_person_id uuid, p_sector_id uuid)
RETURNS boolean AS $$
DECLARE
  v_requires_approval boolean;
  v_sector_type public.sport_sector_type;
  v_has_valid_approval boolean;
BEGIN
  -- 1. Check if sector requires approval
  SELECT requires_medical_approval, sector_type 
  INTO v_requires_approval, v_sector_type
  FROM public.sport_sectors
  WHERE id = p_sector_id;

  IF NOT FOUND THEN
    RETURN FALSE; -- Invalid sector
  END IF;

  IF NOT v_requires_approval THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if player has valid approval
  SELECT EXISTS (
    SELECT 1 FROM public.sport_medical_approvals
    WHERE person_id = p_person_id
      AND sector_type = v_sector_type
      AND status = 'valid'
      AND expiry_date >= current_date
  ) INTO v_has_valid_approval;

  RETURN v_has_valid_approval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: add_medical_approval
CREATE OR REPLACE FUNCTION public.add_medical_approval(
  p_person_id uuid,
  p_sector_type public.sport_sector_type,
  p_issue_date date,
  p_validity_months integer,
  p_notes text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_approval_id uuid;
  v_expiry_date date;
  v_caller_id uuid := auth.uid();
BEGIN
  IF NOT public.has_permission('medical_approvals.manage') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not have medical_approvals.manage permission';
  END IF;

  -- Calculate expiry
  v_expiry_date := p_issue_date + (p_validity_months || ' months')::interval;

  -- Invalidate any existing valid approvals for the same person and sector type
  UPDATE public.sport_medical_approvals
  SET status = 'expired', updated_at = now()
  WHERE person_id = p_person_id 
    AND sector_type = p_sector_type 
    AND status = 'valid';

  -- Insert new approval
  INSERT INTO public.sport_medical_approvals (
    person_id, sector_type, issue_date, validity_months, expiry_date, notes
  ) VALUES (
    p_person_id, p_sector_type, p_issue_date, p_validity_months, v_expiry_date, p_notes
  ) RETURNING id INTO v_approval_id;

  -- Audit Log
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (
    v_caller_id,
    'medical_approvals.add',
    'sport_medical_approvals',
    v_approval_id,
    jsonb_build_object(
      'person_id', p_person_id,
      'sector_type', p_sector_type,
      'issue_date', p_issue_date,
      'validity_months', p_validity_months,
      'expiry_date', v_expiry_date
    )
  );

  RETURN v_approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
