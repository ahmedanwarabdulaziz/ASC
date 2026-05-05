'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';

export async function getFacilitySchedule() {
  await requirePermission(PERMISSIONS.FACILITIES_VIEW);
  const supabase = await createClient();

  const [facilitiesRes, areasRes, sessionsRes, opHoursRes, exceptionsRes] = await Promise.all([
    supabase.from('sports_facilities').select('id, name, is_active').order('name'),
    supabase.from('facility_areas').select('id, facility_id, name, is_active').order('name'),
    supabase.from('training_group_sessions').select('id, training_group_id, day_of_week, start_time, end_time, facility_area_id, starts_on, ends_on, training_groups(name, sport_id, sports(name))'),
    supabase.from('facility_operating_hours').select('*'),
    supabase.from('facility_operating_exceptions').select('*')
  ]);

  if (facilitiesRes.error) {
    return { success: false, error: 'حدث خطأ أثناء جلب المنشآت.' };
  }

  return {
    success: true,
    data: {
      facilities: facilitiesRes.data || [],
      areas: areasRes.data || [],
      sessions: sessionsRes.data || [],
      operatingHours: opHoursRes.data || [],
      exceptions: exceptionsRes.data || []
    }
  };
}
