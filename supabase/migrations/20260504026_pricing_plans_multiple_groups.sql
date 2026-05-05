-- =============================================================================
-- Migration: 20260504026_pricing_plans_multiple_groups
-- Phase 4G Update: Allow a pricing plan to be linked to multiple training groups
-- =============================================================================

-- 1. Create junction table
CREATE TABLE IF NOT EXISTS public.pricing_plan_training_groups (
  pricing_plan_id uuid not null references public.training_group_pricing_plans(id) on delete cascade,
  training_group_id uuid not null references public.training_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pricing_plan_id, training_group_id)
);

CREATE INDEX IF NOT EXISTS idx_pp_tg_group ON public.pricing_plan_training_groups(training_group_id);

-- 2. Migrate existing data (if any)
INSERT INTO public.pricing_plan_training_groups (pricing_plan_id, training_group_id)
SELECT id, training_group_id
FROM public.training_group_pricing_plans
WHERE training_group_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Drop old column and update constraint
ALTER TABLE public.training_group_pricing_plans DROP CONSTRAINT IF EXISTS training_group_pricing_plans_check;
ALTER TABLE public.training_group_pricing_plans DROP COLUMN IF EXISTS training_group_id;

-- 4. Enable RLS on junction table
ALTER TABLE public.pricing_plan_training_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read pricing_plan_training_groups" ON public.pricing_plan_training_groups;
CREATE POLICY "Allow authenticated read pricing_plan_training_groups" 
ON public.pricing_plan_training_groups FOR SELECT TO authenticated USING (true);


-- 5. Update RPC: Calculate Training Price with fallbacks
CREATE OR REPLACE FUNCTION public.calculate_training_price(p_person_id uuid, p_training_group_id uuid)
RETURNS numeric AS $$
DECLARE
  v_is_member boolean;
  v_group_sector_id uuid;
  v_group_sport_id uuid;
  v_plan record;
BEGIN
  -- 1. Get group details
  SELECT sector_id, sport_id INTO v_group_sector_id, v_group_sport_id
  FROM public.training_groups
  WHERE id = p_training_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Training group not found';
  END IF;

  -- 2. Check membership status
  v_is_member := public.person_has_active_membership(p_person_id);

  -- 3. Find active pricing plan for this group
  -- Priority 1: Plan explicitly linked to this specific group
  SELECT p.* INTO v_plan
  FROM public.training_group_pricing_plans p
  JOIN public.pricing_plan_training_groups ptg ON ptg.pricing_plan_id = p.id
  WHERE ptg.training_group_id = p_training_group_id 
    AND p.is_active = true
  ORDER BY p.created_at DESC LIMIT 1;

  -- Priority 2: Fallback to Plan linked to the sector
  IF NOT FOUND THEN
    SELECT * INTO v_plan
    FROM public.training_group_pricing_plans
    WHERE sector_id = v_group_sector_id 
      AND is_active = true
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  -- Priority 3: Fallback to Plan linked to the sport generally
  IF NOT FOUND THEN
    SELECT * INTO v_plan
    FROM public.training_group_pricing_plans
    WHERE sport_id = v_group_sport_id 
      AND sector_id IS NULL
      AND is_active = true
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  -- Priority 4: Fallback to a global active plan (if any)
  IF NOT FOUND THEN
    SELECT * INTO v_plan
    FROM public.training_group_pricing_plans
    WHERE sport_id IS NULL 
      AND sector_id IS NULL 
      AND is_active = true
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active pricing plan found for this training group';
  END IF;

  -- 4. Return correct price
  IF v_is_member THEN
    RETURN v_plan.member_price;
  ELSE
    RETURN v_plan.non_member_price;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
