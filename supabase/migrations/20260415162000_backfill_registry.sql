-- =========================================================
-- WAVE 2: HISTORICAL INTEGRITY BACKFILL
-- Migrates old raw memberships into the unified registry DB
-- =========================================================

DO $$
DECLARE
  v_membership RECORD;
  v_num_dependents INT;
  v_link RECORD;
  v_counter INT;
BEGIN
  -- Iterate through every registered core membership
  FOR v_membership IN SELECT * FROM public.memberships LOOP
    
    -- 1. Calculate active/past dependent count to seed next suffix correctly
    SELECT COUNT(*) INTO v_num_dependents
    FROM public.membership_members
    WHERE membership_id = v_membership.id AND relationship != 'principal';
    
    INSERT INTO public.membership_number_sequences (base_membership_number, next_dependent_suffix)
    VALUES (v_membership.membership_number, v_num_dependents + 1)
    ON CONFLICT (base_membership_number) DO NOTHING;
    
    -- 2. Backfill Principal Links mapping to the exact base number
    INSERT INTO public.membership_number_registry 
      (membership_number, number_type, person_id, membership_id, membership_member_id, is_current)
    SELECT v_membership.membership_number, 'principal', person_id, membership_id, id, (status = 'active')
    FROM public.membership_members 
    WHERE membership_id = v_membership.id AND relationship = 'principal'
    ON CONFLICT (membership_number) DO NOTHING;
    
    -- 3. Backfill Dependent Links by chronologically ordering their creation date
    v_counter := 1;
    FOR v_link IN 
      SELECT * FROM public.membership_members 
      WHERE membership_id = v_membership.id AND relationship != 'principal' 
      ORDER BY created_at ASC 
    LOOP
      INSERT INTO public.membership_number_registry 
        (membership_number, number_type, person_id, membership_id, membership_member_id, is_current)
      VALUES (
        v_membership.membership_number || '-' || v_counter, 
        'dependent', 
        v_link.person_id, 
        v_link.membership_id, 
        v_link.id, 
        (v_link.status = 'active')
      )
      ON CONFLICT (membership_number) DO NOTHING;
      v_counter := v_counter + 1;
    END LOOP;

  END LOOP;
END $$;
