-- =============================================================================
-- Migration: 20260504014_auth_provisioning
-- Phase 3F: Admin Auth Provisioning
-- =============================================================================

-- 1. Add auth.provision permission
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('auth.provision', 'إدارة الحسابات', 'Auth Provision', 'Can provision and manage system user accounts')
ON CONFLICT (code) DO NOTHING;

-- Map to system_admin
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, 'auth.provision'
FROM public.role_definitions
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;

-- 2. RPC for provisioning staff account
CREATE OR REPLACE FUNCTION public.provision_staff_account_transaction(
  p_auth_user_id uuid,
  p_person_id uuid,
  p_staff_member_id uuid,
  p_role_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_existing_system_user uuid;
BEGIN
  -- 1. Verify Caller Permissions
  IF NOT public.has_permission('auth.provision') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not have auth.provision permission';
  END IF;

  -- 2. Verify person exists
  IF NOT EXISTS (SELECT 1 FROM public.people WHERE id = p_person_id) THEN
    RAISE EXCEPTION 'Person % does not exist', p_person_id;
  END IF;

  -- 3. Verify staff member exists
  IF NOT EXISTS (SELECT 1 FROM public.staff_members WHERE id = p_staff_member_id AND person_id = p_person_id) THEN
    RAISE EXCEPTION 'Staff member % does not exist for person', p_staff_member_id;
  END IF;

  -- 4. Check if system_user already exists for this person
  SELECT id INTO v_existing_system_user FROM public.system_users WHERE person_id = p_person_id;
  
  IF v_existing_system_user IS NOT NULL THEN
    -- If it exists, we just update auth_user_id if it somehow changed (though it shouldn't)
    -- Actually, if it exists, they already have an account!
    RAISE EXCEPTION 'Person % already has a system user account', p_person_id;
  END IF;

  -- 5. Insert system_user
  INSERT INTO public.system_users (auth_user_id, person_id, is_active)
  VALUES (p_auth_user_id, p_person_id, true);

  -- 6. Mirror user_id to staff_members convenience link
  UPDATE public.staff_members
  SET user_id = p_auth_user_id
  WHERE id = p_staff_member_id;

  -- 7. Assign initial role if provided
  IF p_role_id IS NOT NULL THEN
    INSERT INTO public.person_roles (person_id, role_id, granted_by)
    VALUES (p_person_id, p_role_id, v_caller_id)
    ON CONFLICT (person_id, role_id) DO UPDATE SET is_active = true, ended_at = NULL, ended_by = NULL;
  END IF;

  -- 8. Audit Log
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (
    v_caller_id,
    'auth.provision_staff',
    'system_users',
    p_person_id,
    jsonb_build_object(
      'auth_user_id', p_auth_user_id,
      'staff_member_id', p_staff_member_id,
      'role_id', p_role_id
    )
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC to link existing account
CREATE OR REPLACE FUNCTION public.link_existing_staff_account_transaction(
  p_person_id uuid,
  p_staff_member_id uuid
) RETURNS void AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_auth_user_id uuid;
BEGIN
  IF NOT public.has_permission('auth.provision') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not have auth.provision permission';
  END IF;

  -- Get existing system_user
  SELECT auth_user_id INTO v_auth_user_id FROM public.system_users WHERE person_id = p_person_id;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Person % does not have an existing system user account', p_person_id;
  END IF;

  -- Mirror user_id to staff_members convenience link
  UPDATE public.staff_members
  SET user_id = v_auth_user_id
  WHERE id = p_staff_member_id;

  -- Audit Log
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (
    v_caller_id,
    'auth.link_existing_staff',
    'staff_members',
    p_staff_member_id,
    jsonb_build_object(
      'auth_user_id', v_auth_user_id,
      'person_id', p_person_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
