-- =============================================================================
-- Migration: 20260504028_subscription_generation
-- Phase 4H Update: Subscription amount and generator RPC
-- =============================================================================

ALTER TABLE public.sport_program_subscriptions ADD COLUMN IF NOT EXISTS amount numeric(10,2) not null default 0;

-- RPC: Generate Monthly Subscriptions
-- Generates pending subscriptions for a given month ('YYYY-MM') for all active enrollments
CREATE OR REPLACE FUNCTION public.generate_monthly_subscriptions(p_month text)
RETURNS integer AS $$
DECLARE
  v_start_date date;
  v_end_date date;
  v_enrollment record;
  v_pricing_plan_id uuid;
  v_amount numeric;
  v_inserted_count integer := 0;
  v_caller_id uuid := auth.uid();
BEGIN
  IF NOT public.has_permission('subscriptions.manage') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not have subscriptions.manage permission';
  END IF;

  v_start_date := (p_month || '-01')::date;
  v_end_date := (v_start_date + interval '1 month - 1 day')::date;

  -- Loop through all active enrollments
  FOR v_enrollment IN
    SELECT 
      e.id, 
      e.training_group_id, 
      e.sport_player_id, 
      p.person_id,
      g.sector_id,
      g.sport_id
    FROM public.training_group_enrollments e
    JOIN public.training_groups g ON g.id = e.training_group_id
    JOIN public.sport_players p ON p.id = e.sport_player_id
    WHERE e.status = 'active'
  LOOP
    -- 1. Check if already generated for this month
    IF EXISTS (
      SELECT 1 FROM public.sport_program_subscriptions
      WHERE training_group_enrollment_id = v_enrollment.id
        AND billing_month_start = v_start_date
    ) THEN
      CONTINUE; -- Skip if already generated
    END IF;

    -- 2. Calculate the price
    v_amount := public.calculate_training_price(v_enrollment.person_id, v_enrollment.training_group_id);

    -- 3. Find the pricing plan ID that applied (we'll just fetch the first matching plan for audit logic, though calculate_training_price doesn't return the plan ID).
    -- We can fallback to fetching it similar to how the RPC does:
    SELECT tgpp.id INTO v_pricing_plan_id
    FROM public.pricing_plan_training_groups pptg
    JOIN public.training_group_pricing_plans tgpp ON tgpp.id = pptg.pricing_plan_id
    WHERE pptg.training_group_id = v_enrollment.training_group_id
      AND tgpp.is_active = true
    LIMIT 1;

    IF v_pricing_plan_id IS NULL THEN
      SELECT id INTO v_pricing_plan_id FROM public.training_group_pricing_plans WHERE sector_id = v_enrollment.sector_id AND is_active = true LIMIT 1;
    END IF;
    IF v_pricing_plan_id IS NULL THEN
      SELECT id INTO v_pricing_plan_id FROM public.training_group_pricing_plans WHERE sport_id = v_enrollment.sport_id AND is_active = true LIMIT 1;
    END IF;
    IF v_pricing_plan_id IS NULL THEN
      SELECT id INTO v_pricing_plan_id FROM public.training_group_pricing_plans WHERE is_active = true AND sport_id IS NULL AND sector_id IS NULL LIMIT 1;
    END IF;

    IF v_pricing_plan_id IS NOT NULL THEN
      -- 4. Insert subscription
      INSERT INTO public.sport_program_subscriptions (
        training_group_enrollment_id,
        pricing_plan_id,
        billing_month_start,
        billing_month_end,
        expected_monthly_sessions,
        payment_status,
        amount
      ) VALUES (
        v_enrollment.id,
        v_pricing_plan_id,
        v_start_date,
        v_end_date,
        8, -- fallback default, can be calculated based on sessions
        'pending',
        v_amount
      );
      v_inserted_count := v_inserted_count + 1;
    END IF;
  END LOOP;

  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
