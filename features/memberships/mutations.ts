'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteMembershipAction(id: string) {
  const supabase = await createClient()

  // memberships table has ON DELETE RESTRICT for main_person_id (so the person stays).
  // But membership_members has ON DELETE CASCADE for membership_id.
  // We can safely delete the membership and it will purge the family links!
  
  const { error } = await supabase.from('memberships').update({ 
    status: 'cancelled',
    archived_at: new Date().toISOString(), 
    archive_reason: 'تم الإلغاء/الأرشفة من قبل الإدارة' 
  }).eq('id', id)
  
  if (error) {
    console.error("Archive Membership Error:", error)
    return { success: false, error: 'حدث خطأ أثناء أرشفة العضوية.' }
  }

  revalidatePath('/system/memberships', 'layout')
  return { success: true, error: null }
}

export async function requestSeparationAction(link_id: string, membership_id: string) {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) return { success: false, error: 'غير مصرح بتنفيذ العملية' }

  // Check if a draft or approved request already exists
  const { data: existingReq } = await supabase.from('membership_separation_requests')
    .select('id')
    .eq('membership_member_id', link_id)
    .in('status', ['draft', 'admin_approved', 'board_approved'])
    .single()
    
  if (existingReq) {
     return { success: false, error: 'يوجد طلب فصل قيد المراجعة لهذا التابع بالفعل.' }
  }

  const { error } = await supabase.from('membership_separation_requests').insert({ 
    membership_member_id: link_id,
    requested_by: userData.user.id,
    status: 'draft',
    notes: 'تم تقديم طلب الفصل من قبل الإستقبال.'
  });
  
  if (error) {
    console.error("Separation Request Error:", error)
    return { success: false, error: 'حدث خطأ أثناء محاولة تسجيل طلب الفصل.' }
  }

  revalidatePath(`/system/memberships/${membership_id}`, 'page')
  return { success: true, error: null }
}

export async function updateMembershipAction(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const person_id = formData.get('person_id') as string

  const membership_type = formData.get('membership_type') as string
  const status = formData.get('status') as string

  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const phone = formData.get('phone') as string
  const national_id = formData.get('national_id') as string

  if (!first_name || !last_name || !national_id) {
    return { error: 'جميع الحقول المطلوبة يجب تعبئتها', success: false }
  }

  // Update Person
  const { error: pErr } = await supabase.from('people').update({
    first_name,
    last_name,
    phone_number: phone,
    national_id
  }).eq('id', person_id)

  if (pErr) return { error: `خطأ في تحديث البيانات الشخصية: ${pErr.message}`, success: false }

  // Update Membership (excluding membership_number securely)
  const { error: mErr } = await supabase.from('memberships').update({
    type: membership_type as any,
    status: status as any
  }).eq('id', id)

  if (mErr) {
    if (mErr.code === '23505') return { error: 'رقم العضوية مستخدم بالفعل!', success: false }
    return { error: `خطأ في تحديث الاشتراك: ${mErr.message}`, success: false }
  }

  revalidatePath('/system/memberships', 'layout')
  return { error: '', success: true }
}

export async function updateDependentAction(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const link_id = formData.get('link_id') as string
  const membership_id = formData.get('membership_id') as string
  const person_id = formData.get('person_id') as string

  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const national_id = formData.get('national_id') as string
  const relationship = formData.get('relationship') as string
  const card_status = formData.get('card_status') as string

  // Update Person
  const { error: pErr } = await supabase.from('people').update({
    first_name,
    last_name,
    national_id
  }).eq('id', person_id)

  if (pErr) return { error: `خطأ في السجل المدني: ${pErr.message}`, success: false }

  // Update Link
  const { error: lErr } = await supabase.from('membership_members').update({
    relationship: relationship as any,
    card_status: card_status as any
  }).eq('id', link_id)

  if (lErr) return { error: `خطأ في بيانات التابع: ${lErr.message}`, success: false }

  revalidatePath(`/system/memberships/${membership_id}`, 'page')
  return { error: '', success: true }
}

export async function adminApproveSeparationAction(request_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_approve_separation_transaction', { payload: { request_id } })
  if (error) return { success: false, error: error.message }
  if (!data?.success) return { success: false, error: data?.error }
  revalidatePath('/system/separations', 'page')
  return { success: true }
}

export async function boardApproveSeparationAction(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const request_id = formData.get('request_id') as string;
  const decision_number = formData.get('decision_number') as string;
  const meeting_date = formData.get('meeting_date') as string;
  if (!request_id || !decision_number || !meeting_date) return { success: false, error: 'الرجاء استكمال بيانات موافقة المجلس' }
  const { data, error } = await supabase.rpc('board_approve_separation_transaction', { payload: { request_id, decision_number, meeting_date } })
  if (error) return { success: false, error: error.message }
  if (!data?.success) return { success: false, error: data?.error }
  revalidatePath('/system/separations', 'page')
  return { success: true, error: null }
}

export async function confirmSeparationPaymentAction(request_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('confirm_separation_payment_transaction', { payload: { request_id } })
  if (error) return { success: false, error: error.message }
  if (!data?.success) return { success: false, error: data?.error }
  revalidatePath('/system/separations', 'page')
  return { success: true }
}

export async function completeSeparationAction(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const request_id = formData.get('request_id') as string;
  const new_membership_number = formData.get('new_membership_number') as string;
  if (!request_id || !new_membership_number) return { success: false, error: 'الرجاء إدخال رقم العضوية الجديد' }
  const { data, error } = await supabase.rpc('complete_dependent_conversion_transaction', { payload: { request_id, new_membership_number } })
  if (error) return { success: false, error: error.message }
  if (!data?.success) return { success: false, error: data?.error }
  revalidatePath('/system/separations', 'page')
  return { success: true, error: null }
}
