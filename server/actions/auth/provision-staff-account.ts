'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { z } from 'zod';

const provisionSchema = z.object({
  personId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
  roleId: z.string().uuid().optional(),
});

function generateSecurePassword(length = 16) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export async function provisionStaffAccount(formData: FormData) {
  try {
    // 1. Verify Caller Permissions
    await requirePermission(PERMISSIONS.AUTH_PROVISION);

    // 2. Parse input
    const parsed = provisionSchema.safeParse({
      personId: formData.get('personId'),
      staffMemberId: formData.get('staffMemberId'),
      roleId: formData.get('roleId') || undefined,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { personId, staffMemberId, roleId } = parsed.data;

    // 3. Fetch person's national ID
    const supabase = await createServerClient();
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('national_id')
      .eq('id', personId)
      .single();

    if (personError || !person?.national_id) {
      return { success: false, error: 'لم يتم العثور على الرقم القومي للشخص. تأكد من تسجيل الرقم القومي أولاً.' };
    }

    const nationalId = person.national_id;
    const email = `${nationalId}@assiutsc.com`;

    // 4. Initialize Service Role Client (Bypasses RLS for Auth Admin API)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 5. Generate temporary password
    const tempPassword = generateSecurePassword();

    // 6. Create Auth User in GoTrue
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        person_id: personId,
        must_change_password: true,
      }
    });

    if (authError) {
      console.error('[provisionStaffAccount] Supabase Auth Error:', authError);
      if (authError.message?.includes('already been registered')) {
        return { success: false, error: 'هذا الشخص يمتلك حساب دخول بالفعل (الرقم القومي مسجل مسبقاً).' };
      }
      return { success: false, error: 'حدث خطأ أثناء إنشاء حساب الدخول.' };
    }

    const authUserId = authData.user.id;

    // 7. Use normal authenticated client for RPC to maintain audit log attribution
    const { error: rpcError } = await supabase.rpc('provision_staff_account_transaction', {
      p_auth_user_id: authUserId,
      p_person_id: personId,
      p_staff_member_id: staffMemberId,
      p_role_id: roleId || null,
    });

    if (rpcError) {
      console.error('[provisionStaffAccount] RPC Error:', rpcError);
      // Cleanup: Delete auth user if database transaction failed to avoid orphans
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return { success: false, error: 'حدث خطأ أثناء ربط الحساب بالموظف.' };
    }

    return { 
      success: true, 
      data: {
        nationalId,
        tempPassword,
      } 
    };
  } catch (error: any) {
    console.error('[provisionStaffAccount] Unexpected Error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}
