'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getRoleDefinitions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('role_definitions')
    .select('*')
    .order('created_at')
  
  if (error) {
    console.error('Error fetching role definitions:', error)
    return []
  }
  return data
}

export async function createRoleDefinition(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const name_ar = formData.get('name_ar') as string
  
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const code = `role_${Date.now().toString().slice(-4)}_${randomSuffix}`;

  if (!name_ar) {
    return { error: 'برجاء تعبئة الاسم باللغة العربية' }
  }

  const { error } = await supabase.from('role_definitions').insert({
    name_ar,
    code,
    category: 'membership', 
    allows_system_login: false, 
    public_visibility: false,
  })

  if (error) {
    console.error('Insert error:', error)
    return { error: `حدث خطأ أثناء حفظ الدور: ${error.message} (Code: ${error.code})` }
  }

  revalidatePath('/system/roles', 'layout')
  redirect('/system/roles')
}

// --- NEW FIELD BUILDER ACTIONS ---

export async function getRoleById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('role_definitions')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function getRoleFields(role_id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('role_fields')
    .select('*')
    .eq('role_id', role_id)
    .order('created_at')
  return data || []
}

export async function createRoleField(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const role_id = formData.get('role_id') as string
  const name_ar = formData.get('name_ar') as string
  const field_type = formData.get('field_type') as string
  const is_required = formData.get('is_required') === 'on'
  const list_options_raw = formData.get('list_options') as string

  if (!role_id || !name_ar || !field_type) {
    return { error: 'برجاء تعبئة الحقول الأساسية', success: false }
  }

  let list_options = null
  if (field_type === 'select' && list_options_raw) {
    list_options = list_options_raw.split(',').map(o => o.trim()).filter(o => o.length > 0)
    if (list_options.length === 0) {
      return { error: 'برجاء إدخال خيارات القائمة', success: false }
    }
  }

  const { error } = await supabase.from('role_fields').insert({
    role_id,
    name_ar,
    field_type: field_type as any,
    is_required,
    list_options
  })

  if (error) {
    return { error: `خطأ أثناء الحفظ: ${error.message}`, success: false }
  }

  revalidatePath(`/system/roles/${role_id}`, 'page')
  return { error: '', success: true }
}
