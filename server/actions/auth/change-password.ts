'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
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
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
    }

    // 2. Verify current password by attempting sign-in
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Use a fresh anon client to verify the old password without affecting the session
    const { createClient: createBrowserClient } = await import('@supabase/supabase-js');
    const verifyClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة.' };
    }

    // 3. Update password via Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: {
        ...user.user_metadata,
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
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
    }

    // 2. Verify this is indeed a first-login scenario
    if (!user.user_metadata?.must_change_password) {
      return { success: false, error: 'لا يتطلب تغيير كلمة المرور.' };
    }

    // 3. Update password and remove the flag
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: {
        ...user.user_metadata,
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
