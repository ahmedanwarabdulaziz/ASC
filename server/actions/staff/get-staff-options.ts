'use server';

import { createClient } from '@/lib/supabase/server';

export async function getStaffOptions() {
  const supabase = await createClient();
  
  const [jobsRes, groupsRes] = await Promise.all([
    supabase.from('staff_jobs').select('id, name, default_group_id, account_policy, is_training_sector, is_training_commissionable').eq('is_active', true).order('name'),
    supabase.from('staff_groups').select('id, name').eq('is_active', true).order('name'),
  ]);

  return {
    success: true,
    jobs: jobsRes.data || [],
    groups: groupsRes.data || [],
  };
}
