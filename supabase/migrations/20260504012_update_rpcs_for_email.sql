-- =============================================================================
-- Migration: 20260504012_update_rpcs_for_email
-- Description: Updates the membership creation RPCs to accept an email parameter.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- create_working_membership
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_working_membership(
  p_membership_number text,
  p_national_id text,
  p_first_name text,
  p_second_name text,
  p_third_name text,
  p_last_name text,
  p_phone_number text DEFAULT NULL,
  p_email text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_person_id uuid;
  v_membership_id uuid;
  v_registry_id uuid;
BEGIN
  -- 1. Check permissions
  IF NOT public.has_permission('memberships.create') THEN
    RAISE EXCEPTION 'Access denied: missing memberships.create permission';
  END IF;

  -- 2. Uniqueness checks
  IF EXISTS (SELECT 1 FROM public.membership_number_registry WHERE membership_number = p_membership_number) THEN
    RAISE EXCEPTION 'Membership number % is already in use', p_membership_number;
  END IF;

  IF EXISTS (SELECT 1 FROM public.people WHERE national_id = p_national_id) THEN
    RAISE EXCEPTION 'National ID % is already registered', p_national_id;
  END IF;

  -- 3. Insert Person
  INSERT INTO public.people (
    national_id, first_name, second_name, third_name, last_name, phone_number, email
  ) VALUES (
    p_national_id, p_first_name, p_second_name, p_third_name, p_last_name, p_phone_number, p_email
  ) RETURNING id INTO v_person_id;

  -- 4. Insert Membership
  INSERT INTO public.memberships (
    type, main_person_id, status
  ) VALUES (
    'working', v_person_id, 'active'
  ) RETURNING id INTO v_membership_id;

  -- 5. Register Number
  INSERT INTO public.membership_number_registry (
    membership_number, number_type, person_id, membership_id
  ) VALUES (
    p_membership_number, 'working', v_person_id, v_membership_id
  ) RETURNING id INTO v_registry_id;

  -- 6. Init Suffix sequence
  INSERT INTO public.membership_number_sequences (
    base_membership_number, next_dependent_suffix
  ) VALUES (
    p_membership_number, 1
  );

  -- 7. Audit
  PERFORM public.internal_audit_log(
    'membership.create', 'memberships', v_membership_id, 
    jsonb_build_object('membership_number', p_membership_number, 'person_id', v_person_id)
  );

  RETURN jsonb_build_object(
    'person_id', v_person_id,
    'membership_id', v_membership_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- add_dependent_to_membership
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_dependent_to_membership(
  p_membership_id uuid,
  p_relation_type text,
  p_national_id text,
  p_first_name text,
  p_second_name text,
  p_third_name text,
  p_last_name text,
  p_phone_number text DEFAULT NULL,
  p_email text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_person_id uuid;
  v_membership_member_id uuid;
  v_base_number text;
  v_suffix integer;
  v_dependent_number text;
BEGIN
  -- 1. Check permissions
  IF NOT public.has_permission('memberships.add_dependent') THEN
    RAISE EXCEPTION 'Access denied: missing memberships.add_dependent permission';
  END IF;

  -- 2. National ID check
  IF EXISTS (SELECT 1 FROM public.people WHERE national_id = p_national_id) THEN
    RAISE EXCEPTION 'National ID % is already registered', p_national_id;
  END IF;

  -- 3. Get Base Number and lock sequence
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

  -- 4. Insert Person
  INSERT INTO public.people (
    national_id, first_name, second_name, third_name, last_name, phone_number, email
  ) VALUES (
    p_national_id, p_first_name, p_second_name, p_third_name, p_last_name, p_phone_number, p_email
  ) RETURNING id INTO v_person_id;

  -- 5. Insert Dependent link
  INSERT INTO public.membership_members (
    membership_id, person_id, relation_type, status
  ) VALUES (
    p_membership_id, v_person_id, p_relation_type, 'active'
  ) RETURNING id INTO v_membership_member_id;

  -- 6. Register Number
  INSERT INTO public.membership_number_registry (
    membership_number, number_type, person_id, membership_id, membership_member_id
  ) VALUES (
    v_dependent_number, 'dependent', v_person_id, p_membership_id, v_membership_member_id
  );

  -- 7. Audit
  PERFORM public.internal_audit_log(
    'dependent.add', 'membership_members', v_membership_member_id, 
    jsonb_build_object('membership_number', v_dependent_number, 'person_id', v_person_id, 'membership_id', p_membership_id)
  );

  RETURN jsonb_build_object(
    'person_id', v_person_id,
    'membership_member_id', v_membership_member_id,
    'membership_number', v_dependent_number
  );
END;
$$;
