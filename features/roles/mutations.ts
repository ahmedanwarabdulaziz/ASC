'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteRoleDefinition(id: string) {
  const supabase = await createClient()
  
  // If people are assigned to this role, person_roles restricts deletion
  const { error } = await supabase.from('role_definitions').delete().eq('id', id)
  
  if (error) {
     if (error.code === '23503') {
        return { error: 'لا يمكن حذف هذا الدور بسبب وجود أشخاص مسجلين به.' }
     }
     return { error: 'حدث خطأ أثناء الحذف.' }
  }
  
  revalidatePath('/system/roles', 'layout')
  return { success: true }
}

export async function updateRoleDefinition(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  
  const id = formData.get('id') as string
  const name_ar = formData.get('name_ar') as string

  if (!id || !name_ar) {
    return { error: 'برجاء تعبئة الاسم', success: false }
  }

  // Generate a new code just in case, or leave the original alone. 
  // It's much safer to leave the system code alone since it's already assigned!
  const { error } = await supabase.from('role_definitions').update({ name_ar }).eq('id', id)
  
  if (error) {
    return { error: `خطأ أثناء الحفظ: ${error.message}`, success: false }
  }

  revalidatePath('/system/roles', 'layout')
  return { error: '', success: true }
}
