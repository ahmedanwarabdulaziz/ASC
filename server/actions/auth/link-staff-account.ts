'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { z } from 'zod';

const linkSchema = z.object({
  personId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
});

export async function linkExistingStaffAccount(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.AUTH_PROVISION);

    const parsed = linkSchema.safeParse({
      personId: formData.get('personId'),
      staffMemberId: formData.get('staffMemberId'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { personId, staffMemberId } = parsed.data;

    const supabase = await createServerClient();
    
    const { error: rpcError } = await supabase.rpc('link_existing_staff_account_transaction', {
      p_person_id: personId,
      p_staff_member_id: staffMemberId,
    });

    if (rpcError) {
      console.error('[linkExistingStaffAccount] RPC Error:', rpcError);
      return { success: false, error: 'حدث خطأ أثناء ربط الحساب الحالي بالموظف.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[linkExistingStaffAccount] Unexpected Error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}
