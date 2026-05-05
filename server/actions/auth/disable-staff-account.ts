'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { z } from 'zod';

const disableSchema = z.object({
  personId: z.string().uuid(),
});

export async function disableStaffAccount(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.AUTH_PROVISION);

    const parsed = disableSchema.safeParse({
      personId: formData.get('personId'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { personId } = parsed.data;

    const supabase = await createServerClient();
    
    // For disabling, we simply set system_users.is_active = false
    // We do NOT delete the user in GoTrue to maintain audit logs and referential integrity.
    
    const { error } = await supabase
      .from('system_users')
      .update({ is_active: false })
      .eq('person_id', personId);

    if (error) {
      console.error('[disableStaffAccount] DB Error:', error);
      return { success: false, error: 'حدث خطأ أثناء تعطيل الحساب.' };
    }

    // Write manual audit log since we're updating system_users
    await supabase.from('audit_logs').insert({
      action: 'auth.disable_staff',
      entity_type: 'system_users',
      entity_id: personId,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[disableStaffAccount] Unexpected Error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}
