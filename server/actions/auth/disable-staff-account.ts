'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { z } from 'zod';

const personSchema = z.object({
  personId: z.string().uuid(),
});

/**
 * Deactivate a staff account (set system_users.is_active = false).
 * Does NOT delete the GoTrue user to maintain audit trail.
 */
export async function disableStaffAccount(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.AUTH_PROVISION);

    const parsed = personSchema.safeParse({
      personId: formData.get('personId'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { personId } = parsed.data;
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('system_users')
      .update({ is_active: false })
      .eq('person_id', personId);

    if (error) {
      console.error('[disableStaffAccount] DB Error:', error);
      return { success: false, error: 'حدث خطأ أثناء تعطيل الحساب.' };
    }

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

/**
 * Re-activate a previously disabled staff account.
 */
export async function enableStaffAccount(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.AUTH_PROVISION);

    const parsed = personSchema.safeParse({
      personId: formData.get('personId'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { personId } = parsed.data;
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('system_users')
      .update({ is_active: true })
      .eq('person_id', personId);

    if (error) {
      console.error('[enableStaffAccount] DB Error:', error);
      return { success: false, error: 'حدث خطأ أثناء تفعيل الحساب.' };
    }

    await supabase.from('audit_logs').insert({
      action: 'auth.enable_staff',
      entity_type: 'system_users',
      entity_id: personId,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[enableStaffAccount] Unexpected Error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}

/**
 * Reset a staff member's password. Generates a new temporary password
 * and sets must_change_password flag.
 */
export async function resetStaffPassword(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.AUTH_PROVISION);

    const parsed = personSchema.safeParse({
      personId: formData.get('personId'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { personId } = parsed.data;
    const supabase = await createServerClient();

    // Get the auth_user_id from system_users
    const { data: systemUser, error: fetchError } = await supabase
      .from('system_users')
      .select('auth_user_id')
      .eq('person_id', personId)
      .single();

    if (fetchError || !systemUser?.auth_user_id) {
      return { success: false, error: 'لا يوجد حساب دخول لهذا الشخص.' };
    }

    // Generate new temp password
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let tempPassword = "";
    for (let i = 0; i < 16; i++) {
      tempPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Update password + set must_change_password via Admin API
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      systemUser.auth_user_id,
      {
        password: tempPassword,
        user_metadata: { must_change_password: true },
      }
    );

    if (updateError) {
      console.error('[resetStaffPassword] Auth Update Error:', updateError);
      return { success: false, error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور.' };
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'auth.reset_password',
      entity_type: 'system_users',
      entity_id: personId,
    });

    return { success: true, data: { tempPassword } };
  } catch (error: any) {
    console.error('[resetStaffPassword] Unexpected Error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}
