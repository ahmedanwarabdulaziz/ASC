-- =========================================================
-- WAVE 3: THE 7 MISSING TRANSACTIONAL RPCs
-- =========================================================

-- 1. Archive Membership (Soft Delete mapping)
CREATE OR REPLACE FUNCTION public.archive_membership_transaction(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_membership_id uuid := (payload->>'membership_id')::uuid;
  v_reason text := payload->>'reason';
  v_user_id uuid := auth.uid();
BEGIN
  IF NOT public.has_permission('memberships.update'::text) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  -- 1. Archive core membership
  UPDATE public.memberships 
  SET status = 'cancelled', archived_at = now(), archived_by = v_user_id, archive_reason = v_reason
  WHERE id = v_membership_id;

  -- 2. Archive all family members recursively
  UPDATE public.membership_members
  SET status = 'archived', ended_at = now(), ended_by = v_user_id, end_reason = 'Membership Archived: ' || v_reason, card_status = 'suspended'
  WHERE membership_id = v_membership_id;

  -- 3. Invalidate historical registry
  UPDATE public.membership_number_registry
  SET is_current = false, ended_at = now(), reason = 'Membership Archived'
  WHERE membership_id = v_membership_id AND is_current = true;

  -- 4. Audit Trail
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (v_user_id, 'ARCHIVE_MEMBERSHIP', 'memberships', v_membership_id, payload);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- 2. Correct Membership Number (Total Registry Swap)
CREATE OR REPLACE FUNCTION public.correct_membership_number_transaction(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_membership_id uuid := (payload->>'membership_id')::uuid;
  v_new_number text := payload->>'new_number';
  v_old_number text;
  v_user_id uuid := auth.uid();
  v_member record;
  v_counter int := 1;
BEGIN
  IF NOT public.has_permission('memberships.update'::text) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  IF EXISTS (SELECT 1 FROM public.membership_number_registry WHERE membership_number = v_new_number) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Number already exists historically.');
  END IF;

  SELECT membership_number INTO v_old_number FROM public.memberships WHERE id = v_membership_id;

  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Membership not found'); END IF;

  -- Retire old registry sequence lines
  UPDATE public.membership_number_registry SET is_current = false, ended_at = now(), reason = 'Number Correction' 
  WHERE membership_id = v_membership_id AND is_current = true;

  -- Seed new base sequence
  INSERT INTO public.membership_number_sequences (base_membership_number, next_dependent_suffix)
  VALUES (v_new_number, 1);

  -- Update Main Membership
  UPDATE public.memberships SET membership_number = v_new_number WHERE id = v_membership_id;

  -- Regenerate Registry for Principal
  FOR v_member IN SELECT * FROM public.membership_members WHERE membership_id = v_membership_id AND status = 'active' ORDER BY relationship = 'principal' DESC, created_at ASC LOOP
     IF v_member.relationship = 'principal' THEN
        INSERT INTO public.membership_number_registry (membership_number, number_type, person_id, membership_id, membership_member_id, is_current)
        VALUES (v_new_number, 'principal', v_member.person_id, v_membership_id, v_member.id, true);
     ELSE
        INSERT INTO public.membership_number_registry (membership_number, number_type, person_id, membership_id, membership_member_id, is_current)
        VALUES (v_new_number || '-' || v_counter, 'dependent', v_member.person_id, v_membership_id, v_member.id, true);
        v_counter := v_counter + 1;
     END IF;
  END LOOP;

  -- Ensure Sequence Tracker catches up
  UPDATE public.membership_number_sequences SET next_dependent_suffix = v_counter WHERE base_membership_number = v_new_number;

  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (v_user_id, 'CORRECT_MEMBERSHIP_NUMBER', 'memberships', v_membership_id, jsonb_build_object('old_number', v_old_number), payload);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- 3. Request Separation
CREATE OR REPLACE FUNCTION public.request_dependent_separation_transaction(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_link_id uuid := (payload->>'link_id')::uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF NOT public.has_permission('memberships.separation.request'::text) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  INSERT INTO public.membership_separation_requests (membership_member_id, requested_by, status, notes)
  VALUES (v_link_id, v_user_id, 'draft', payload->>'notes');

  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (v_user_id, 'REQUEST_SEPARATION', 'membership_members', v_link_id, payload);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- 4. Admin Approve
CREATE OR REPLACE FUNCTION public.admin_approve_separation_transaction(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF NOT public.has_permission('memberships.separation.admin_approve'::text) THEN RETURN jsonb_build_object('success', false, 'error', 'Permission denied'); END IF;
  UPDATE public.membership_separation_requests SET status = 'admin_approved', admin_approved_by = v_user_id, admin_approved_at = now() WHERE id = (payload->>'request_id')::uuid;
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data) VALUES (v_user_id, 'ADMIN_APPROVE_SEPARATION', 'separation_requests', (payload->>'request_id')::uuid, payload);
  RETURN jsonb_build_object('success', true);
END; $$;


-- 5. Board Approve
CREATE OR REPLACE FUNCTION public.board_approve_separation_transaction(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF NOT public.has_permission('memberships.separation.board_approve'::text) THEN RETURN jsonb_build_object('success', false, 'error', 'Permission denied'); END IF;
  UPDATE public.membership_separation_requests 
  SET status = 'board_approved', board_approved_by = v_user_id, board_approved_at = now(), board_decision_number = payload->>'decision_number', board_meeting_date = (payload->>'meeting_date')::date 
  WHERE id = (payload->>'request_id')::uuid;
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data) VALUES (v_user_id, 'BOARD_APPROVE_SEPARATION', 'separation_requests', (payload->>'request_id')::uuid, payload);
  RETURN jsonb_build_object('success', true);
END; $$;


-- 6. Confirm Payment
CREATE OR REPLACE FUNCTION public.confirm_separation_payment_transaction(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF NOT public.has_permission('memberships.separation.payment_confirm'::text) THEN RETURN jsonb_build_object('success', false, 'error', 'Permission denied'); END IF;
  UPDATE public.membership_separation_requests SET status = 'payment_confirmed', payment_confirmed_by = v_user_id, payment_confirmed_at = now() WHERE id = (payload->>'request_id')::uuid;
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data) VALUES (v_user_id, 'PAYMENT_CONFIRM_SEPARATION', 'separation_requests', (payload->>'request_id')::uuid, payload);
  RETURN jsonb_build_object('success', true);
END; $$;


-- 7. Complete Dependent Conversion (Split into physical working membership)
CREATE OR REPLACE FUNCTION public.complete_dependent_conversion_transaction(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_request_id uuid := (payload->>'request_id')::uuid;
  v_new_number text := payload->>'new_membership_number';
  v_user_id uuid := auth.uid();
  v_request record;
  v_person_id uuid;
  v_new_membership_id uuid;
  v_new_link_id uuid;
BEGIN
  IF NOT public.has_permission('memberships.create'::text) THEN RETURN jsonb_build_object('success', false, 'error', 'Permission denied'); END IF;
  IF EXISTS (SELECT 1 FROM public.membership_number_registry WHERE membership_number = v_new_number) THEN RETURN jsonb_build_object('success', false, 'error', 'Membership Number already exists historically.'); END IF;

  SELECT r.*, m.person_id INTO v_request 
  FROM public.membership_separation_requests r
  JOIN public.membership_members m ON m.id = r.membership_member_id
  WHERE r.id = v_request_id AND r.status = 'payment_confirmed';

  IF v_request IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Request not ready for final conversion.'); END IF;
  v_person_id := v_request.person_id;

  -- Destroy old link
  UPDATE public.membership_members SET status = 'archived', ended_at = now(), ended_by = v_user_id, end_reason = 'Separated' WHERE id = v_request.membership_member_id;
  UPDATE public.membership_number_registry SET is_current = false, ended_at = now(), reason = 'Separation' WHERE membership_member_id = v_request.membership_member_id;

  -- Create New
  INSERT INTO public.memberships (membership_number, main_person_id, type, status) VALUES (v_new_number, v_person_id, 'working', 'active') RETURNING id INTO v_new_membership_id;
  INSERT INTO public.membership_members (membership_id, person_id, relationship, card_status) VALUES (v_new_membership_id, v_person_id, 'principal', 'active') RETURNING id INTO v_new_link_id;
  
  -- Seeding Registry
  INSERT INTO public.membership_number_sequences (base_membership_number, next_dependent_suffix) VALUES (v_new_number, 1);
  INSERT INTO public.membership_number_registry (membership_number, number_type, person_id, membership_id, membership_member_id, is_current) VALUES (v_new_number, 'principal', v_person_id, v_new_membership_id, v_new_link_id, true);

  -- Finalize request
  UPDATE public.membership_separation_requests SET status = 'completed', new_working_membership_id = v_new_membership_id WHERE id = v_request_id;
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data) VALUES (v_user_id, 'COMPLETE_SEPARATION', 'separation_requests', v_request_id, payload);

  RETURN jsonb_build_object('success', true, 'new_membership_id', v_new_membership_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;
