-- =============================================================================
-- Migration: 20260504024_enrollment_lifecycle
-- Phase 4I: Enrollment Lifecycle & Bulk Actions
-- =============================================================================

-- 1. Helper: Check group capacity
CREATE OR REPLACE FUNCTION public.check_group_capacity(p_training_group_id uuid)
RETURNS boolean AS $$
DECLARE
  v_max_players integer;
  v_current_players integer;
BEGIN
  SELECT max_players INTO v_max_players
  FROM public.training_groups
  WHERE id = p_training_group_id;

  -- If no max limit, then it's always true
  IF v_max_players IS NULL THEN
    RETURN true;
  END IF;

  SELECT count(*) INTO v_current_players
  FROM public.training_group_enrollments
  WHERE training_group_id = p_training_group_id AND status = 'active';

  RETURN v_current_players < v_max_players;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RPC: Transfer Enrollment
-- Safely moves a player from one group to another while preserving history
CREATE OR REPLACE FUNCTION public.transfer_enrollment(
  p_enrollment_id uuid,
  p_new_group_id uuid,
  p_effective_date date
) RETURNS jsonb AS $$
DECLARE
  v_old_enrollment record;
  v_person_id uuid;
  v_sector_id uuid;
  v_new_enrollment_id uuid;
  v_caller_id uuid := auth.uid();
BEGIN
  -- 1. Get old enrollment & validate
  SELECT e.*, p.person_id INTO v_old_enrollment
  FROM public.training_group_enrollments e
  JOIN public.sport_players p ON p.id = e.sport_player_id
  WHERE e.id = p_enrollment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enrollment not found');
  END IF;

  IF v_old_enrollment.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer an inactive enrollment');
  END IF;

  -- 2. Check if already in the target group
  IF EXISTS (
    SELECT 1 FROM public.training_group_enrollments
    WHERE sport_player_id = v_old_enrollment.sport_player_id
      AND training_group_id = p_new_group_id
      AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Player is already active in the target group');
  END IF;

  -- 3. Get sector id for the new group
  SELECT sector_id INTO v_sector_id
  FROM public.training_groups
  WHERE id = p_new_group_id;

  -- 4. Validations
  IF NOT public.check_medical_approval(v_old_enrollment.person_id, v_sector_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Medical approval is required and missing or expired');
  END IF;

  IF NOT public.check_enrollment_eligibility(v_old_enrollment.person_id, p_new_group_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Player is not eligible for this group (Competition sector requires active membership)');
  END IF;

  IF NOT public.check_group_capacity(p_new_group_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target training group is at full capacity');
  END IF;

  -- 5. End old enrollment
  UPDATE public.training_group_enrollments
  SET status = 'ended', ended_at = p_effective_date, updated_at = now()
  WHERE id = p_enrollment_id;

  -- 6. Create new enrollment
  INSERT INTO public.training_group_enrollments (
    training_group_id, sport_player_id, status, enrolled_at
  ) VALUES (
    p_new_group_id, v_old_enrollment.sport_player_id, 'active', p_effective_date
  ) RETURNING id INTO v_new_enrollment_id;

  -- 7. Audit Log
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (
    v_caller_id,
    'enrollments.transfer',
    'training_group_enrollments',
    v_new_enrollment_id,
    jsonb_build_object(
      'old_enrollment_id', p_enrollment_id,
      'old_group_id', v_old_enrollment.training_group_id,
      'new_group_id', p_new_group_id,
      'effective_date', p_effective_date
    )
  );

  RETURN jsonb_build_object('success', true, 'new_enrollment_id', v_new_enrollment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC: Bulk Transfer Players
-- Iterates through multiple enrollments and transfers them
CREATE OR REPLACE FUNCTION public.bulk_transfer_players(
  p_enrollment_ids uuid[],
  p_new_group_id uuid,
  p_effective_date date
) RETURNS jsonb[] AS $$
DECLARE
  v_enrollment_id uuid;
  v_result jsonb;
  v_results jsonb[] := ARRAY[]::jsonb[];
BEGIN
  IF NOT public.has_permission('training_groups.enroll') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not have training_groups.enroll permission';
  END IF;

  FOREACH v_enrollment_id IN ARRAY p_enrollment_ids
  LOOP
    -- Execute individual transfer, catching the result
    v_result := public.transfer_enrollment(v_enrollment_id, p_new_group_id, p_effective_date);
    
    -- Inject the old enrollment id into the result for frontend tracking
    v_result := jsonb_set(v_result, '{enrollment_id}', to_jsonb(v_enrollment_id));
    
    v_results := array_append(v_results, v_result);
  END LOOP;

  RETURN v_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
