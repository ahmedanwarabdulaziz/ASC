'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';

export async function archiveStaffMember(id: string, notes?: string, endedAt?: string) {
  await requirePermission(PERMISSIONS.STAFF_ARCHIVE);
  
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('archive_staff_member_transaction', {
    p_payload: {
      id,
      notes,
      ended_at: endedAt || new Date().toISOString().split('T')[0],
    },
  });

  if (error) {
    console.error('[archiveStaffMember] rpc error:', error);
    return { success: false, error: 'تعذر إنهاء العمل. ' + error.message };
  }

  const result = data as any;
  if (!result.success) {
    return { success: false, error: result.error || 'تعذر إنهاء العمل.' };
  }

  revalidatePath('/system/staff');
  revalidatePath(`/system/staff/${id}`);
  return { success: true };
}
