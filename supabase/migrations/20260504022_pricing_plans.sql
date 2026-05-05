-- =============================================================================
-- Migration: 20260504022_pricing_plans
-- Phase 4G: Pricing Plans & Membership Rules
-- =============================================================================

-- 1. Table: training_group_pricing_plans
CREATE TABLE IF NOT EXISTS public.training_group_pricing_plans (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references public.sports(id) on delete cascade,
  sector_id uuid references public.sport_sectors(id) on delete cascade,
  training_group_id uuid references public.training_groups(id) on delete cascade,
  name text not null,
  member_price numeric(10, 2) not null check(member_price >= 0),
  non_member_price numeric(10, 2) not null check(non_member_price >= 0),
  weekly_session_count integer not null check(weekly_session_count > 0),
  monthly_billable_sessions integer not null,
  valid_from date not null default current_date,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(monthly_billable_sessions = weekly_session_count * 4),
  check(sport_id IS NOT NULL OR training_group_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_pricing_plans_group_id ON public.training_group_pricing_plans(training_group_id);

-- 2. Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('pricing_plans.view', 'عرض خطط الأسعار', 'Pricing Plans View', 'View pricing plans'),
  ('pricing_plans.manage', 'إدارة خطط الأسعار', 'Pricing Plans Manage', 'Create/edit pricing plans')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('pricing_plans.view'),
    ('pricing_plans.manage')
) AS perms(permission_code)
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;

-- 3. RLS
ALTER TABLE public.training_group_pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read pricing_plans" ON public.training_group_pricing_plans;
CREATE POLICY "Allow authenticated read pricing_plans" 
ON public.training_group_pricing_plans FOR SELECT TO authenticated USING (true);


-- 4. Helper RPC: Check if person has active membership
CREATE OR REPLACE FUNCTION public.person_has_active_membership(p_person_id uuid) 
RETURNS boolean AS $$
DECLARE
  v_has_membership boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE main_person_id = p_person_id AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.membership_members mm
    JOIN public.memberships m ON m.id = mm.membership_id
    WHERE mm.person_id = p_person_id AND mm.status = 'active' AND m.status = 'active'
  ) INTO v_has_membership;
  
  RETURN v_has_membership;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: Check Enrollment Eligibility (Competition vs Practice)
CREATE OR REPLACE FUNCTION public.check_enrollment_eligibility(p_person_id uuid, p_training_group_id uuid)
RETURNS boolean AS $$
DECLARE
  v_sector_type public.sport_sector_type;
  v_is_member boolean;
BEGIN
  SELECT ss.sector_type INTO v_sector_type
  FROM public.training_groups tg
  JOIN public.sport_sectors ss ON ss.id = tg.sector_id
  WHERE tg.id = p_training_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Training group not found';
  END IF;

  -- Practice sector is open to everyone
  IF v_sector_type = 'practice' THEN
    RETURN true;
  END IF;

  -- Competition sector requires an active membership
  IF v_sector_type = 'competition' THEN
    v_is_member := public.person_has_active_membership(p_person_id);
    RETURN v_is_member;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. RPC: Calculate Training Price
CREATE OR REPLACE FUNCTION public.calculate_training_price(p_person_id uuid, p_training_group_id uuid)
RETURNS numeric AS $$
DECLARE
  v_is_member boolean;
  v_plan record;
BEGIN
  -- 1. Check membership status
  v_is_member := public.person_has_active_membership(p_person_id);

  -- 2. Find active pricing plan for this group
  -- Prioritize group-specific plan, then fallback to sector/sport if necessary (simplified to group logic here)
  SELECT * INTO v_plan
  FROM public.training_group_pricing_plans
  WHERE training_group_id = p_training_group_id AND is_active = true
  ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active pricing plan found for this training group';
  END IF;

  -- 3. Return correct price
  IF v_is_member THEN
    RETURN v_plan.member_price;
  ELSE
    RETURN v_plan.non_member_price;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
