-- =============================================================================
-- Migration: 20260504025_session_attendance
-- Phase 4J: Session Occurrences & Attendance
-- =============================================================================

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_occurrence_status') THEN
    CREATE TYPE public.session_occurrence_status AS ENUM ('scheduled', 'completed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'excused');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_recording_source') THEN
    CREATE TYPE public.attendance_recording_source AS ENUM ('manual', 'automatic');
  END IF;
END $$;


-- 2. Table: training_session_occurrences
CREATE TABLE IF NOT EXISTS public.training_session_occurrences (
  id uuid primary key default gen_random_uuid(),
  training_group_id uuid not null references public.training_groups(id) on delete cascade,
  training_group_session_id uuid references public.training_group_sessions(id) on delete set null,
  facility_area_id uuid references public.facility_areas(id) on delete set null,
  staff_member_id uuid references public.staff_members(id) on delete set null, -- Main supervisor for this occurrence
  occurrence_date date not null,
  start_time time not null,
  end_time time not null,
  status public.session_occurrence_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_session_occurrences_group ON public.training_session_occurrences(training_group_id, occurrence_date);


-- 3. Table: training_session_attendance
CREATE TABLE IF NOT EXISTS public.training_session_attendance (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.training_session_occurrences(id) on delete cascade,
  training_group_enrollment_id uuid not null references public.training_group_enrollments(id) on delete cascade,
  attendance_status public.attendance_status not null,
  check_in_time timestamptz,
  check_out_time timestamptz,
  recording_source public.attendance_recording_source not null default 'manual',
  recorded_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(occurrence_id, training_group_enrollment_id)
);


-- 4. Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('attendance.view', 'عرض الحضور والانصراف', 'Attendance View', 'View training session attendance'),
  ('attendance.manage', 'تسجيل الحضور والانصراف', 'Attendance Manage', 'Record or correct session attendance')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('attendance.view'),
    ('attendance.manage')
) AS perms(permission_code)
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;


-- 5. RLS
ALTER TABLE public.training_session_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read occurrences" ON public.training_session_occurrences;
CREATE POLICY "Allow authenticated read occurrences" 
ON public.training_session_occurrences FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read attendance" ON public.training_session_attendance;
CREATE POLICY "Allow authenticated read attendance" 
ON public.training_session_attendance FOR SELECT TO authenticated USING (true);


-- 6. RPC: Record Single Attendance
CREATE OR REPLACE FUNCTION public.record_session_attendance(
  p_occurrence_id uuid,
  p_enrollment_id uuid,
  p_status public.attendance_status,
  p_check_in_time timestamptz DEFAULT NULL,
  p_check_out_time timestamptz DEFAULT NULL,
  p_is_automatic boolean DEFAULT false,
  p_notes text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_attendance_id uuid;
  v_caller_id uuid := auth.uid();
  v_source public.attendance_recording_source := 'manual';
BEGIN
  IF NOT public.has_permission('attendance.manage') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not have attendance.manage permission';
  END IF;

  IF p_is_automatic THEN
    v_source := 'automatic';
  END IF;

  INSERT INTO public.training_session_attendance (
    occurrence_id,
    training_group_enrollment_id,
    attendance_status,
    check_in_time,
    check_out_time,
    recording_source,
    recorded_by,
    notes
  ) VALUES (
    p_occurrence_id,
    p_enrollment_id,
    p_status,
    p_check_in_time,
    p_check_out_time,
    v_source,
    v_caller_id,
    p_notes
  )
  ON CONFLICT (occurrence_id, training_group_enrollment_id)
  DO UPDATE SET
    attendance_status = EXCLUDED.attendance_status,
    check_in_time = COALESCE(EXCLUDED.check_in_time, public.training_session_attendance.check_in_time),
    check_out_time = COALESCE(EXCLUDED.check_out_time, public.training_session_attendance.check_out_time),
    recording_source = EXCLUDED.recording_source,
    recorded_by = EXCLUDED.recorded_by,
    notes = COALESCE(EXCLUDED.notes, public.training_session_attendance.notes),
    updated_at = now()
  RETURNING id INTO v_attendance_id;

  RETURN v_attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. RPC: Auto-Complete Unmarked Attendance
-- Marks all remaining active players in the group who haven't been recorded yet as 'absent' automatically.
CREATE OR REPLACE FUNCTION public.autocomplete_session_attendance(p_occurrence_id uuid)
RETURNS integer AS $$
DECLARE
  v_group_id uuid;
  v_caller_id uuid := auth.uid();
  v_inserted_count integer := 0;
BEGIN
  IF NOT public.has_permission('attendance.manage') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User does not have attendance.manage permission';
  END IF;

  -- Get the group for this occurrence
  SELECT training_group_id INTO v_group_id
  FROM public.training_session_occurrences
  WHERE id = p_occurrence_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session occurrence not found';
  END IF;

  -- Insert absent records for active enrollments not yet in attendance table
  WITH inserted AS (
    INSERT INTO public.training_session_attendance (
      occurrence_id,
      training_group_enrollment_id,
      attendance_status,
      recording_source,
      recorded_by,
      notes
    )
    SELECT 
      p_occurrence_id,
      e.id,
      'absent'::public.attendance_status,
      'automatic'::public.attendance_recording_source,
      v_caller_id,
      'Auto-completed at session close'
    FROM public.training_group_enrollments e
    WHERE e.training_group_id = v_group_id
      AND e.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM public.training_session_attendance a
        WHERE a.occurrence_id = p_occurrence_id
          AND a.training_group_enrollment_id = e.id
      )
    RETURNING id
  )
  SELECT count(*) INTO v_inserted_count FROM inserted;

  -- Mark occurrence as completed
  UPDATE public.training_session_occurrences
  SET status = 'completed', updated_at = now()
  WHERE id = p_occurrence_id;

  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
