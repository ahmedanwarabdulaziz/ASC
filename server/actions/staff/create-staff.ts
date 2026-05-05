'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';

export type CreateStaffInput = {
  national_id?: string;
  first_name?: string;
  second_name?: string;
  third_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  person_id?: string;
  
  staff_code?: string;
  job_id: string;
  group_id: string;
  status?: 'active' | 'suspended' | 'ended';
  hired_at?: string;
  notes?: string;
};

export async function createStaffMember(payload: CreateStaffInput) {
  await requirePermission(PERMISSIONS.STAFF_CREATE);
  
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_staff_member_transaction', {
    p_payload: payload,
  });

  if (error) {
    console.error('[createStaffMember] rpc error:', error);
    return { success: false, error: 'تعذر إضافة الموظف. ' + error.message };
  }

  // RPC returns { success: boolean, error?: string, staff_member_id?: string, person_id?: string }
  const result = data as any;
  if (!result.success) {
    return { success: false, error: result.error || 'تعذر إضافة الموظف.' };
  }

  revalidatePath('/system/staff');
  return { success: true, staffMemberId: result.staff_member_id };
}
