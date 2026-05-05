'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';

export async function getStaffList() {
  await requirePermission(PERMISSIONS.STAFF_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('staff_members')
    .select(`
      *,
      person:people(*),
      job:staff_jobs(
        *,
        category:staff_categories(name),
        subcategory:staff_subcategories(name)
      ),
      group:staff_groups(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getStaffList] error:', error);
    return { success: false, error: 'Failed to fetch staff list.' };
  }

  return { success: true, data };
}

export async function getStaffById(id: string) {
  await requirePermission(PERMISSIONS.STAFF_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('staff_members')
    .select(`
      *,
      person:people(
        *,
        system_users(id, auth_user_id, is_active)
      ),
      job:staff_jobs(*),
      group:staff_groups(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('[getStaffById] error:', error);
    return { success: false, error: 'Failed to fetch staff member.' };
  }

  return { success: true, data };
}
