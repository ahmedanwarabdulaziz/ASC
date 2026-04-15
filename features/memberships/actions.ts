'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { parseEgyptianNationalId } from '@/lib/utils/egyptian-id'

export async function enrollNewMembership(prevState: any, formData: FormData) {
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

  let person_id = ''
  
  // Strict lock checks
  const { data: existingPerson } = await supabase.from('people').select('id').eq('national_id', national_id).single()
  
  if (existingPerson) {
    person_id = existingPerson.id
    
    // Prevent double principal enrollments
    const { data: existingPrincipal } = await supabase.from('memberships').select('id').eq('main_person_id', person_id).single()
    if (existingPrincipal) {
       return { error: 'تحذير: هذا الشخص مسجل بالفعل كعضو رئيسي في اشتراك آخر!', success: false, data: payload }
    }
  } else {
    // Generate new person safely mapping parsed DOB & Gender automatically
    const { data: newPerson, error: personError } = await supabase.from('people').insert({
      national_id,
      first_name: `${first_name} ${second_name} ${third_name}`.trim(),
      last_name,
      gender: parsedId.valid ? parsedId.gender : gender,
      phone_number: phone,
      birth_date: parsedId.birthDate
    }).select('id').single()

    if (personError) {
      if (personError.code === '23505') return { error: 'الرقم القومي مسجل لأحد الأفراد بالسيستم', success: false, data: payload }
      return { error: `فشل في إنشاء السجل المدني: ${personError.message}`, success: false, data: payload }
    }
    person_id = newPerson.id
  }

  // Create Membership Envelope
  const { data: newMembership, error: membershipError } = await supabase.from('memberships').insert({
    membership_number,
    main_person_id: person_id,
    type: membership_type as any,
    status: 'active'
  }).select('id').single()

  if (membershipError) {
    // Ultimate Database duplicate protection
    if (membershipError.code === '23505') {
       return { error: 'رقم العضوية مكرر! يرجى إدخال رقم عضوية مختلف.', success: false, data: payload }
    }
    return { error: `فشل إنشاء ملف الاشتراك: ${membershipError.message}`, success: false, data: payload }
  }

  // Solidify the Link
  const { error: linkError } = await supabase.from('membership_members').insert({
    membership_id: newMembership.id,
    person_id: person_id,
    relationship: 'principal',
    card_status: 'active'
  })

  if (linkError) {
     return { error: `حدث خطأ أثناء ربط العضوية: ${linkError.message}`, success: false, data: payload }
  }

  revalidatePath('/system/memberships', 'layout')
  // We will redirect to the Family management screen next
  redirect(`/system/memberships/${newMembership.id}`)
}

export async function addDependentToMembership(prevState: any, formData: FormData) {
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

  let person_id = ''
  
  // Strict lock checks
  const { data: existingPerson } = await supabase.from('people').select('id').eq('national_id', national_id).single()
  
  if (existingPerson) {
    person_id = existingPerson.id
    const { data: existingLink } = await supabase.from('membership_members').select('id').eq('person_id', person_id).single()
    if (existingLink) {
       return { error: 'تحذير: هذا الشخص مسجل بالفعل داخل اشتراك في النظام!', success: false, data: payload }
    }
  } else {
    // Generate new child/wife safely
    const { data: newPerson, error: personError } = await supabase.from('people').insert({
      national_id,
      first_name: `${first_name} ${second_name} ${third_name}`.trim(),
      last_name,
      gender: parsedId.gender,
      phone_number: phone,
      birth_date: parsedId.birthDate
    }).select('id').single()

    if (personError) {
      if (personError.code === '23505') return { error: 'الرقم القومي مسجل لأحد الأفراد بالسيستم', success: false, data: payload }
      return { error: `فشل في إنشاء السجل: ${personError.message}`, success: false, data: payload }
    }
    person_id = newPerson.id
  }

  // Solidify the Link
  const { error: linkError } = await supabase.from('membership_members').insert({
    membership_id: membership_id,
    person_id: person_id,
    relationship: relationship as any,
    card_status: 'active'
  })

  if (linkError) {
     return { error: `حدث خطأ أثناء الربط: ${linkError.message}`, success: false, data: payload }
  }

  revalidatePath(`/system/memberships/${membership_id}`, 'page')
  return { error: '', success: true }
}
