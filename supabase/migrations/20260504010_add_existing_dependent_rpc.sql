-- =============================================================================
-- Migration: 20260504010_add_existing_dependent_rpc
-- Phase 2C: Dependents and Family Links
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- Adds an RPC to attach an existing person to a membership as a dependent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- add_existing_person_as_dependent
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_existing_person_as_dependent(
  p_membership_id uuid,
  p_person_id uuid,
  p_relation_type text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_membership_member_id uuid;
  v_base_number text;
  v_suffix integer;
  v_dependent_number text;
BEGIN
  -- 1. Check permissions
  IF NOT public.has_permission('memberships.add_dependent') THEN
    RAISE EXCEPTION 'Access denied: missing memberships.add_dependent permission';
  END IF;

  -- 2. Verify person exists
  IF NOT EXISTS (SELECT 1 FROM public.people WHERE id = p_person_id) THEN
    RAISE EXCEPTION 'Person with ID % not found', p_person_id;
  END IF;

  -- 3. Verify they aren't already a dependent on this exact membership
  IF EXISTS (SELECT 1 FROM public.membership_members WHERE membership_id = p_membership_id AND person_id = p_person_id AND status != 'separated') THEN
    RAISE EXCEPTION 'Person is already an active dependent on this membership';
  END IF;

  -- 4. Get Base Number and lock sequence
  SELECT mnr.membership_number INTO v_base_number
  FROM public.membership_number_registry mnr
  WHERE mnr.membership_id = p_membership_id AND mnr.number_type IN ('working', 'sports') AND mnr.is_current = true
  LIMIT 1;

  IF v_base_number IS NULL THEN
    RAISE EXCEPTION 'Base membership number not found for membership %', p_membership_id;
  END IF;

  UPDATE public.membership_number_sequences
  SET next_dependent_suffix = next_dependent_suffix + 1, updated_at = now()
  WHERE base_membership_number = v_base_number
  RETURNING (next_dependent_suffix - 1) INTO v_suffix;

  v_dependent_number := v_base_number || '-' || v_suffix::text;

  -- 5. Insert Dependent link
  INSERT INTO public.membership_members (
    membership_id, person_id, relation_type, status
  ) VALUES (
    p_membership_id, p_person_id, p_relation_type, 'active'
  ) RETURNING id INTO v_membership_member_id;

  -- 6. Register Number
  INSERT INTO public.membership_number_registry (
    membership_number, number_type, person_id, membership_id, membership_member_id
  ) VALUES (
    v_dependent_number, 'dependent', p_person_id, p_membership_id, v_membership_member_id
  );

  -- 7. Audit
  PERFORM public.internal_audit_log(
    'dependent.add_existing', 'membership_members', v_membership_member_id, 
    jsonb_build_object('membership_number', v_dependent_number, 'person_id', p_person_id, 'membership_id', p_membership_id)
  );

  RETURN jsonb_build_object(
    'person_id', p_person_id,
    'membership_member_id', v_membership_member_id,
    'membership_number', v_dependent_number
  );
END;
$$;
