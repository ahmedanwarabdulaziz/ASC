'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'يجب إدخال كلمة المرور الحالية'),
  newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
});

/**
 * Change password for the currently authenticated user.
 * Requires current password verification for security.
 */
export async function changePassword(formData: FormData) {
  try {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { currentPassword, newPassword } = parsed.data;

    // 1. Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
    }

    // 2. Verify current password via admin client
    const supabaseAdmin = createAdminClient();
    const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة.' };
    }

    // 3. Update password + clear must_change_password flag via session-aware client
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        must_change_password: false,
      },
    });

    if (updateError) {
      console.error('[changePassword] Update Error:', updateError);
      return { success: false, error: 'حدث خطأ أثناء تغيير كلمة المرور.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[changePassword] Unexpected Error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}

/**
 * Set new password on first login (no current password required).
 * Only works if user_metadata.must_change_password is true.
 */
export async function setInitialPassword(formData: FormData) {
  try {
    const newPassword = formData.get('newPassword') as string;

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' };
    }

    // 1. Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
    }

    // 2. Verify this is indeed a first-login scenario
    if (!user.user_metadata?.must_change_password) {
      return { success: false, error: 'لا يتطلب تغيير كلمة المرور.' };
    }

    // 3. Update password + remove flag via session-aware client
    //    This updates the session so the proxy won't redirect back
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        must_change_password: false,
      },
    });

    if (updateError) {
      console.error('[setInitialPassword] Update Error:', updateError);
      return { success: false, error: 'حدث خطأ أثناء تعيين كلمة المرور.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[setInitialPassword] Unexpected Error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}
