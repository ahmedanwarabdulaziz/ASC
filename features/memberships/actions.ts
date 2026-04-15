'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { parseEgyptianNationalId } from '@/lib/utils/egyptian-id'

export async function enrollNewMembership(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  // Capture Payload for Form Retention
  const payload = {
    membership_number: formData.get('membership_number') as string || '',
    membership_type: formData.get('membership_type') as string || 'working',
    national_id: formData.get('national_id') as string || '',
    first_name: formData.get('first_name') as string || '',
    second_name: formData.get('second_name') as string || '',
    third_name: formData.get('third_name') as string || '',
    last_name: formData.get('last_name') as string || '',
    phone: formData.get('phone') as string || '',
    gender: formData.get('gender') as string || 'male'
  };

  const { membership_number, membership_type, national_id, first_name, second_name, third_name, last_name, phone, gender } = payload;

  if (!membership_number || !national_id || !first_name || !last_name) {
    return { error: 'برجاء تعبئة جميع الحقول الإلزامية', success: false, data: payload }
  }

  // Validate Egyptian Mobile Number if provided (11 digits starting with 010, 011, 012, or 015)
  if (phone && !/^01[0125][0-9]{8}$/.test(phone)) {
    return { error: 'رقم الهاتف المحمول المسجل غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)', success: false, data: payload }
  }

  // Parse National ID natively
  const parsedId = parseEgyptianNationalId(national_id)
  if (!parsedId.valid) {
    return { error: `الرقم القومي غير صحيح: ${parsedId.error}`, success: false, data: payload }
  }

  // Ensure we push the parsed birth date back into the payload for the RPC
  const finalPayload = {
      membership_number,
      type: membership_type,
      national_id,
      first_name,
      last_name,
      phone,
      gender: parsedId.valid ? parsedId.gender : gender,
      birth_date: parsedId.birthDate
  };

  const { data: result, error: rpcError } = await supabase.rpc('enroll_membership_transaction', {
    payload: finalPayload
  });

  if (rpcError) {
    return { error: `فشل النظام: ${rpcError.message}`, success: false, data: payload }
  }

  if (!result.success) {
    return { error: result.error, success: false, data: payload }
  }

  revalidatePath('/system/memberships', 'layout')
  redirect(`/system/memberships/${result.membership_id}`)
}

export async function addDependentToMembership(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    membership_id: formData.get('membership_id') as string || '',
    national_id: formData.get('national_id') as string || '',
    first_name: formData.get('first_name') as string || '',
    second_name: formData.get('second_name') as string || '',
    third_name: formData.get('third_name') as string || '',
    last_name: formData.get('last_name') as string || '',
    relationship: formData.get('relationship') as string || 'wife',
    phone: formData.get('phone') as string || ''
  };

  const { membership_id, national_id, first_name, second_name, third_name, last_name, relationship, phone } = payload;

  if (!membership_id || !national_id || !first_name || !last_name || !relationship) {
    return { error: 'برجاء تعبئة الحقول الأساسية', success: false, data: payload }
  }

  if (phone && !/^01[0125][0-9]{8}$/.test(phone)) {
    return { error: 'رقم الهاتف المسجل غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)', success: false, data: payload }
  }

  const parsedId = parseEgyptianNationalId(national_id)
  if (!parsedId.valid) {
    return { error: `الرقم القومي غير صحيح: ${parsedId.error}`, success: false, data: payload }
  }

  const finalPayload = {
      membership_id,
      national_id,
      first_name,
      last_name,
      relationship,
      phone,
      gender: parsedId.gender,
      birth_date: parsedId.birthDate
  };

  const { data: result, error: rpcError } = await supabase.rpc('add_dependent_transaction', {
    payload: finalPayload
  });

  if (rpcError) {
    return { error: `فشل النظام: ${rpcError.message}`, success: false, data: payload }
  }

  if (!result.success) {
    return { error: result.error, success: false, data: payload }
  }

  revalidatePath(`/system/memberships/${membership_id}`, 'page')
  return { error: '', success: true }
}
