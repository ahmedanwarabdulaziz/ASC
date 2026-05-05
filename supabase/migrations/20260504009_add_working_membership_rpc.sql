-- =============================================================================
-- Migration: 20260504009_add_working_membership_rpc
-- Phase 2B: Working Memberships
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- Adds an RPC to attach a working membership to an existing person record.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- add_working_membership_to_person
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_working_membership_to_person(
  p_person_id uuid,
  p_membership_number text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_membership_id uuid;
  v_registry_id uuid;
BEGIN
  -- 1. Check permissions
  IF NOT public.has_permission('memberships.create') THEN
    RAISE EXCEPTION 'Access denied: missing memberships.create permission';
  END IF;

  -- 2. Verify person exists
  IF NOT EXISTS (SELECT 1 FROM public.people WHERE id = p_person_id) THEN
    RAISE EXCEPTION 'Person with ID % not found', p_person_id;
  END IF;

  -- 3. Verify they don't already have a working membership
  IF EXISTS (SELECT 1 FROM public.memberships WHERE main_person_id = p_person_id AND type = 'working' AND status != 'cancelled') THEN
    RAISE EXCEPTION 'Person already has an active working membership';
  END IF;

  -- 4. Uniqueness check for membership number
  IF EXISTS (SELECT 1 FROM public.membership_number_registry WHERE membership_number = p_membership_number) THEN
    RAISE EXCEPTION 'Membership number % is already in use', p_membership_number;
  END IF;

  -- 5. Insert Membership
  INSERT INTO public.memberships (
    type, main_person_id, status
  ) VALUES (
    'working', p_person_id, 'active'
  ) RETURNING id INTO v_membership_id;

  -- 6. Register Number
  INSERT INTO public.membership_number_registry (
    membership_number, number_type, person_id, membership_id
  ) VALUES (
    p_membership_number, 'working', p_person_id, v_membership_id
  ) RETURNING id INTO v_registry_id;

  -- 7. Init Suffix sequence
  INSERT INTO public.membership_number_sequences (
    base_membership_number, next_dependent_suffix
  ) VALUES (
    p_membership_number, 1
  );

  -- 8. Audit
  PERFORM public.internal_audit_log(
    'membership.create', 'memberships', v_membership_id, 
    jsonb_build_object('membership_number', p_membership_number, 'person_id', p_person_id)
  );

  RETURN jsonb_build_object(
    'person_id', p_person_id,
    'membership_id', v_membership_id
  );
END;
$$;
