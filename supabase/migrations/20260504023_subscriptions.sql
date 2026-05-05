-- =============================================================================
-- Migration: 20260504023_subscriptions
-- Phase 4H: Subscriptions & Payment Workflows
-- =============================================================================

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_payment_status') THEN
    CREATE TYPE public.subscription_payment_status AS ENUM ('pending', 'paid', 'cancelled');
  END IF;
END $$;

-- 2. Table: sport_program_subscriptions
CREATE TABLE IF NOT EXISTS public.sport_program_subscriptions (
  id uuid primary key default gen_random_uuid(),
  training_group_enrollment_id uuid not null references public.training_group_enrollments(id) on delete restrict,
  pricing_plan_id uuid not null references public.training_group_pricing_plans(id) on delete restrict,
  billing_month_start date not null,
  billing_month_end date not null,
  expected_monthly_sessions integer not null,
  payment_status public.subscription_payment_status not null default 'pending',
  paper_receipt_number text,
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(billing_month_start < billing_month_end)
);

CREATE INDEX IF NOT EXISTS idx_sport_subscriptions_enrollment ON public.sport_program_subscriptions(training_group_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sport_subscriptions_status ON public.sport_program_subscriptions(payment_status);

-- 3. Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('subscriptions.view', 'عرض الاشتراكات', 'Subscriptions View', 'View sports subscriptions'),
  ('subscriptions.manage', 'إدارة الاشتراكات', 'Subscriptions Manage', 'Create/edit subscriptions'),
  ('subscriptions.confirm_payment', 'تأكيد سداد الاشتراكات', 'Subscriptions Confirm Payment', 'Confirm payment for sports subscriptions')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('subscriptions.view'),
    ('subscriptions.manage'),
    ('subscriptions.confirm_payment')
) AS perms(permission_code)
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;

-- 4. RLS
ALTER TABLE public.sport_program_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read sport_subscriptions" ON public.sport_program_subscriptions;
CREATE POLICY "Allow authenticated read sport_subscriptions" 
ON public.sport_program_subscriptions FOR SELECT TO authenticated USING (true);


-- 5. RPC: Confirm Subscription Payment
CREATE OR REPLACE FUNCTION public.confirm_subscription_payment(
  p_subscription_id uuid,
  p_receipt_number text,
  p_notes text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_current_status public.subscription_payment_status;
BEGIN
  -- 1. Check permissions
  IF NOT public.has_permission('subscriptions.confirm_payment') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not have subscriptions.confirm_payment permission';
  END IF;

  -- 2. Validate current status
  SELECT payment_status INTO v_current_status
  FROM public.sport_program_subscriptions
  WHERE id = p_subscription_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  IF v_current_status = 'paid' THEN
    RAISE EXCEPTION 'Subscription is already marked as paid';
  END IF;
  
  IF v_current_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot confirm payment for a cancelled subscription';
  END IF;

  IF p_receipt_number IS NULL OR trim(p_receipt_number) = '' THEN
    RAISE EXCEPTION 'Paper receipt number is required to confirm payment';
  END IF;

  -- 3. Update subscription
  UPDATE public.sport_program_subscriptions
  SET 
    payment_status = 'paid',
    paper_receipt_number = p_receipt_number,
    confirmed_by = v_caller_id,
    confirmed_at = now(),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_subscription_id;

  -- 4. Audit Log
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (
    v_caller_id,
    'subscriptions.confirm_payment',
    'sport_program_subscriptions',
    p_subscription_id,
    jsonb_build_object(
      'paper_receipt_number', p_receipt_number,
      'notes', p_notes
    )
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
