'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSystemSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('system_settings').select('*')
  
  const config: Record<string, any> = {}
  data?.forEach(setting => {
    config[setting.key] = setting.value
  })
  
  return config
}

export async function updateSystemSettings(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const minor_max_age = parseInt(formData.get('minor_max_age') as string)
  
  const season_1_start = formData.get('season_1_start') as string
  const season_1_end = formData.get('season_1_end') as string
  const season_2_start = formData.get('season_2_start') as string
  const season_2_end = formData.get('season_2_end') as string

  if (isNaN(minor_max_age) || minor_max_age < 16 || minor_max_age > 30) {
    return { error: 'الحد الأقصى لسن القصر يجب أن يكون رقم منطقي بين 16 و 30', success: false }
  }

  if (!season_1_start || !season_1_end || !season_2_start || !season_2_end) {
    return { error: 'يجب تعبئة جميع الفترات الموسمية', success: false }
  }

  // Update operations
  const { error: err1 } = await supabase.from('system_settings').upsert({ 
    key: 'age_limits', 
    value: { minor_max_age }
  })
  
  const { error: err2 } = await supabase.from('system_settings').upsert({ 
    key: 'seasonal_periods', 
    value: { season_1_start, season_1_end, season_2_start, season_2_end }
  })
  
  if (err1 || err2) return { error: `خطأ في حفظ البيانات: ${(err1 || err2)?.message}`, success: false }

  revalidatePath('/system/settings', 'page')
  return { error: '', success: true }
}
