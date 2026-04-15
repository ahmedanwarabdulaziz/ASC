'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Extract fields
  const nationalId = formData.get('nationalId') as string
  const password = formData.get('password') as string

  if (!nationalId || !password) {
    return { error: 'برجاء إدخال الرقم القومي وكلمة المرور' } // "Please enter National ID and Password"
  }

  // Workaround mapping: Supabase requires email for default password login.
  // We map the National ID to an internal domain.
  const email = `${nationalId}@assiut-sc.local`

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Return friendly error depending on the issue
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'الرقم القومي أو كلمة المرور غير صحيحة' }
    }
    return { error: 'حدث خطأ أثناء الاتصال بالنظام' }
  }

  revalidatePath('/system', 'layout')
  redirect('/system')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
