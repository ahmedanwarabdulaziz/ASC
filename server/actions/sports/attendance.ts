'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';

export async function getAttendanceData(date: string) {
  // @ts-ignore - The permission exists in the DB but might not be in the TS type yet
  await requirePermission('attendance.view' as any);
  const supabase = await createClient();

  // 1. Fetch occurrences for the date
  const { data: occurrences, error: occError } = await supabase
    .from('training_session_occurrences')
    .select(`
      *,
      training_groups (name, sport_id, sports(name)),
      facility_areas (name, sports_facilities(name)),
      staff_members (people (first_name, last_name))
    `)
    .eq('occurrence_date', date)
    .order('start_time', { ascending: true });

  if (occError) {
    console.error('Error fetching occurrences:', occError);
    return { success: false, error: `حدث خطأ أثناء جلب الجلسات: ${occError.message || JSON.stringify(occError)}` };
  }

  // 1.5 Fetch scheduled sessions for this day of the week
  // Postgres extract(dow) maps Sunday=0, Monday=1, ..., Saturday=6
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();

  const { data: scheduledSessions, error: scheduleError } = await supabase
    .from('training_group_sessions')
    .select(`
      *,
      training_groups (name, sport_id, sports(name)),
      facility_areas (name, sports_facilities(name))
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true);

  if (scheduleError) {
    console.error('Error fetching scheduled sessions:', scheduleError);
  }

  // 2. Fetch all active training groups (for creating new occurrences)
  const { data: groups } = await supabase
    .from('training_groups')
    .select('id, name, sports(name)')
    .eq('status', 'active');

  return { 
    success: true, 
    data: {
      occurrences: occurrences || [],
      scheduledSessions: scheduledSessions || [],
      groups: groups || []
    }
  };
}

export async function createSessionOccurrence(formData: FormData) {
  await requirePermission('attendance.manage' as any);
  const supabaseAdmin = createAdminClient();

  const groupId = formData.get('groupId') as string;
  const occurrenceDate = formData.get('occurrenceDate') as string;
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;
  const notes = formData.get('notes') as string;
  const sessionId = formData.get('sessionId') as string;
  const facilityAreaId = formData.get('facilityAreaId') as string;

  if (!groupId || !occurrenceDate || !startTime || !endTime) {
    return { success: false, error: 'جميع الحقول الأساسية مطلوبة.' };
  }

  const cleanSessionId = sessionId && sessionId !== 'null' && sessionId !== 'undefined' ? sessionId : null;
  const cleanFacilityAreaId = facilityAreaId && facilityAreaId !== 'null' && facilityAreaId !== 'undefined' ? facilityAreaId : null;

  const { data, error } = await supabaseAdmin.from('training_session_occurrences').insert({
    training_group_id: groupId,
    training_group_session_id: cleanSessionId,
    facility_area_id: cleanFacilityAreaId,
    occurrence_date: occurrenceDate,
    start_time: startTime,
    end_time: endTime,
    status: 'scheduled',
    notes: notes || null
  }).select('id').single();

  if (error) {
    console.error('Error creating occurrence:', error);
    return { success: false, error: `حدث خطأ أثناء إنشاء الجلسة: ${error.message}` };
  }

  revalidatePath('/system/sports/attendance');
  return { success: true, occurrenceId: data.id };
}

export async function getOccurrenceDetails(occurrenceId: string) {
  await requirePermission('attendance.view' as any);
  const supabaseAdmin = createAdminClient();

  const { data: occurrence, error } = await supabaseAdmin
    .from('training_session_occurrences')
    .select(`
      *,
      training_groups (
        id, name, 
        training_group_enrollments (
          id, status, sport_players (people:person_id(first_name, second_name, last_name, national_id))
        )
      ),
      training_session_attendance (*)
    `)
    .eq('id', occurrenceId)
    .single();

  if (error) {
    return { success: false, error: 'الجلسة غير موجودة.' };
  }

  return { success: true, data: occurrence };
}

export async function recordSingleAttendance(occurrenceId: string, enrollmentId: string, status: string) {
  await requirePermission('attendance.manage' as any);
  const supabase = await createClient();

  const { error } = await supabase.rpc('record_session_attendance', {
    p_occurrence_id: occurrenceId,
    p_enrollment_id: enrollmentId,
    p_status: status
  });

  if (error) {
    console.error('Error recording attendance:', error);
    return { success: false, error: 'حدث خطأ.' };
  }

  revalidatePath('/system/sports/attendance');
  return { success: true };
}

export async function completeSessionAttendance(occurrenceId: string) {
  await requirePermission('attendance.manage' as any);
  const supabase = await createClient();

  const { data: count, error } = await supabase.rpc('autocomplete_session_attendance', {
    p_occurrence_id: occurrenceId
  });

  if (error) {
    console.error('Error completing session:', error);
    return { success: false, error: 'حدث خطأ أثناء إغلاق الجلسة.' };
  }

  revalidatePath('/system/sports/attendance');
  return { success: true, count };
}
