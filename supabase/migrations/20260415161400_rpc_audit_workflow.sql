-- =========================================================
-- PHASE 3: TRANSACTIONAL SQL ENGINE & AUDIT HOOKS
-- =========================================================

-- 1. Enroll New Working Membership (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.enroll_membership_transaction(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_person_id uuid;
  v_membership_id uuid;
  v_member_link_id uuid;
  v_user_id uuid := auth.uid();
  v_national_id text := payload->>'national_id';
  v_membership_number text := payload->>'membership_number';
BEGIN
  -- Strict Permission Check natively in DB
  IF NOT public.has_permission('memberships.create'::text) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied: memberships.create');
  END IF;

  -- Protect against Duplicate National ID
  IF EXISTS (SELECT 1 FROM public.people WHERE national_id = v_national_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'National ID is already registered in the system.');
  END IF;

  -- Protect against Duplicate Membership ID (using Registry as strict truth)
  IF EXISTS (SELECT 1 FROM public.membership_number_registry WHERE membership_number = v_membership_number) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Membership number is already used historically.');
  END IF;

  -- 1. Create Person
  INSERT INTO public.people (national_id, first_name, last_name, phone_number, gender, birth_date)
  VALUES (
    v_national_id,
    payload->>'first_name',
    payload->>'last_name',
    payload->>'phone',
    payload->>'gender',
    (payload->>'birth_date')::date
  ) RETURNING id INTO v_person_id;

  -- 2. Create Membership Envelope
  INSERT INTO public.memberships (membership_number, main_person_id, type, status)
  VALUES (
    v_membership_number,
    v_person_id,
    (payload->>'type')::membership_type,
    'active'
  ) RETURNING id INTO v_membership_id;

  -- 3. Create Membership Member Link
  INSERT INTO public.membership_members (membership_id, person_id, relationship, card_status)
  VALUES (
    v_membership_id,
    v_person_id,
    'principal',
    'active'
  ) RETURNING id INTO v_member_link_id;

  -- 4. Registry Sequence Setup (Initialize at 1 for future dependents)
  INSERT INTO public.membership_number_sequences (base_membership_number, next_dependent_suffix)
  VALUES (v_membership_number, 1);

  -- 5. Main Member Registry Number
  INSERT INTO public.membership_number_registry 
  (membership_number, number_type, person_id, membership_id, membership_member_id, is_current)
  VALUES (v_membership_number, 'principal', v_person_id, v_membership_id, v_member_link_id, true);

  -- 6. Central Audit Trail (Guaranteed Atomic write)
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (
    v_user_id,
    'ENROLL_MEMBERSHIP',
    'membership',
    v_membership_id,
    payload
  );

  RETURN jsonb_build_object('success', true, 'membership_id', v_membership_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- 2. Add Dependent Membership (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.add_dependent_transaction(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_person_id uuid;
  v_member_link_id uuid;
  v_base_membership_number text;
  v_suffix integer;
  v_dependent_number text;
  v_user_id uuid := auth.uid();
  v_membership_id uuid := (payload->>'membership_id')::uuid;
  v_national_id text := payload->>'national_id';
BEGIN
  -- Strict Permission Check 
  IF NOT public.has_permission('memberships.add_dependent'::text) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied: memberships.add_dependent');
  END IF;

  -- Retrieve base membership number securely
  SELECT membership_number INTO v_base_membership_number 
  FROM public.memberships WHERE id = v_membership_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Base membership not found.');
  END IF;

  -- Protect against Duplicate National ID across global scope
  IF EXISTS (SELECT 1 FROM public.people WHERE national_id = v_national_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'National ID is already registered in the system.');
  END IF;

  -- 1. Create Person
  INSERT INTO public.people (national_id, first_name, last_name, phone_number, gender, birth_date)
  VALUES (
    v_national_id,
    payload->>'first_name',
    payload->>'last_name',
    payload->>'phone',
    payload->>'gender',
    (payload->>'birth_date')::date
  ) RETURNING id INTO v_person_id;

  -- 2. Create Membership Member Link
  INSERT INTO public.membership_members (membership_id, person_id, relationship, card_status)
  VALUES (
    v_membership_id,
    v_person_id,
    (payload->>'relationship')::relationship_type,
    'active'
  ) RETURNING id INTO v_member_link_id;

  -- 3. Calculate and Increment Suffix mapping
  UPDATE public.membership_number_sequences 
  SET next_dependent_suffix = next_dependent_suffix + 1, updated_at = now()
  WHERE base_membership_number = v_base_membership_number
  RETURNING (next_dependent_suffix - 1) INTO v_suffix;

  -- Fallback if sequence row was mysteriously deleted or absent
  IF v_suffix IS NULL THEN
    INSERT INTO public.membership_number_sequences (base_membership_number, next_dependent_suffix)
    VALUES (v_base_membership_number, 2)
    RETURNING 1 INTO v_suffix;
  END IF;

  v_dependent_number := v_base_membership_number || '-' || v_suffix;

  -- 4. Store the physical dependent number in the global registry
  INSERT INTO public.membership_number_registry 
  (membership_number, number_type, person_id, membership_id, membership_member_id, is_current)
  VALUES (v_dependent_number, 'dependent', v_person_id, v_membership_id, v_member_link_id, true);

  -- 5. Central Audit Trail
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (
    v_user_id,
    'ADD_DEPENDENT',
    'membership_members',
    v_member_link_id,
    payload
  );

  RETURN jsonb_build_object('success', true, 'link_id', v_member_link_id, 'dependent_number', v_dependent_number);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
