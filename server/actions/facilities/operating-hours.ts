'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';

export async function getFacilityOperatingHours(facilityId: string) {
  await requirePermission(PERMISSIONS.FACILITIES_VIEW);
  const supabase = createAdminClient();

  const [hoursRes, exceptionsRes] = await Promise.all([
    supabase.from('facility_operating_hours').select('*').eq('facility_id', facilityId).order('day_of_week').order('start_time'),
    supabase.from('facility_operating_exceptions').select('*').eq('facility_id', facilityId).order('exception_date', { ascending: false }).order('start_time')
  ]);

  return {
    success: true,
    data: {
      hours: hoursRes.data || [],
      exceptions: exceptionsRes.data || []
    }
  };
}

export async function addOperatingHours(facilityId: string, dayOfWeek: number, startTime: string, endTime: string, status: string) {
  await requirePermission(PERMISSIONS.FACILITIES_UPDATE);
  const supabase = createAdminClient();

  if (status !== 'available') {
    // Check if there are any sessions that conflict with this closure
    const { data: conflicts } = await supabase
      .from('training_group_sessions')
      .select('id, training_groups(name), facility_areas!inner(facility_id)')
      .eq('facility_areas.facility_id', facilityId)
      .eq('day_of_week', dayOfWeek)
      .lt('start_time', endTime)
      .gt('end_time', startTime)
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      const groupName = (conflicts[0].training_groups as any)?.name || 'مجموعة تدريبية';
      return { success: false, error: `لا يمكن إغلاق المنشأة: توجد حصص مجدولة لـ (${groupName}) في هذا الوقت. يرجى تعديلها أولاً.` };
    }
  }

  const { error } = await supabase.from('facility_operating_hours').insert({
    facility_id: facilityId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    status
  });

  if (error) return { success: false, error: 'حدث خطأ أثناء إضافة ساعات التشغيل.' };
  
  revalidatePath('/system/facilities/settings');
  revalidatePath('/system/facilities/schedule');
  return { success: true };
}

export async function removeOperatingHours(id: string) {
  await requirePermission(PERMISSIONS.FACILITIES_UPDATE);
  const supabase = createAdminClient();

  const { error } = await supabase.from('facility_operating_hours').delete().eq('id', id);

  if (error) return { success: false, error: 'حدث خطأ.' };
  
  revalidatePath('/system/facilities/settings');
  revalidatePath('/system/facilities/schedule');
  return { success: true };
}

export async function addOperatingException(formData: FormData) {
  await requirePermission(PERMISSIONS.FACILITIES_UPDATE);
  const supabase = createAdminClient();

  const facilityId = formData.get('facilityId') as string;
  const exceptionDate = formData.get('exceptionDate') as string;
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;
  const status = formData.get('status') as string;
  const notes = formData.get('notes') as string;

  if (status !== 'available') {
    // Extract day of week from exception date (0 = Sunday)
    const dateObj = new Date(exceptionDate);
    const dayOfWeek = dateObj.getDay();

    // Check if there are any weekly sessions that conflict with this specific day
    const { data: conflicts } = await supabase
      .from('training_group_sessions')
      .select('id, training_groups(name), facility_areas!inner(facility_id)')
      .eq('facility_areas.facility_id', facilityId)
      .eq('day_of_week', dayOfWeek)
      .lt('start_time', endTime)
      .gt('end_time', startTime)
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      const groupName = (conflicts[0].training_groups as any)?.name || 'مجموعة تدريبية';
      return { success: false, error: `لا يمكن إضافة استثناء: توجد حصص مجدولة لـ (${groupName}) في هذا اليوم والوقت. يرجى حذف الحصة أو تحذير المدربين أولاً.` };
    }
  }

  const { error } = await supabase.from('facility_operating_exceptions').insert({
    facility_id: facilityId,
    exception_date: exceptionDate,
    start_time: startTime,
    end_time: endTime,
    status,
    notes
  });

  if (error) return { success: false, error: 'حدث خطأ أثناء حفظ الاستثناء.' };
  
  revalidatePath('/system/facilities/settings');
  revalidatePath('/system/facilities/schedule');
  return { success: true };
}

export async function removeOperatingException(id: string) {
  await requirePermission(PERMISSIONS.FACILITIES_UPDATE);
  const supabase = createAdminClient();

  const { error } = await supabase.from('facility_operating_exceptions').delete().eq('id', id);

  if (error) return { success: false, error: 'حدث خطأ.' };
  
  revalidatePath('/system/facilities/settings');
  revalidatePath('/system/facilities/schedule');
  return { success: true };
}
