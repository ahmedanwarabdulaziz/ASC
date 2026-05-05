'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';

export type UpdateStaffInput = {
  id: string;
  staff_code?: string;
  job_id: string;
  group_id: string;
  user_id?: string | null;
  status: 'active' | 'suspended' | 'ended';
  hired_at?: string | null;
  ended_at?: string | null;
  notes?: string | null;
  
  update_person?: boolean;
  national_id?: string;
  first_name?: string;
  second_name?: string;
  third_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
};

export async function updateStaffMember(payload: UpdateStaffInput) {
  await requirePermission(PERMISSIONS.STAFF_UPDATE);
  
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('update_staff_member_transaction', {
    p_payload: payload,
  });

  if (error) {
    console.error('[updateStaffMember] rpc error:', error);
    return { success: false, error: 'تعذر تحديث بيانات الموظف. ' + error.message };
  }

  const result = data as any;
  if (!result.success) {
    return { success: false, error: result.error || 'تعذر تحديث بيانات الموظف.' };
  }

  revalidatePath('/system/staff');
  revalidatePath(`/system/staff/${payload.id}`);
  return { success: true };
}
