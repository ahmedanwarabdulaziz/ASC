'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import type { Person } from '@/types/database';

/**
 * Fetch a list of people for the registry table.
 * Enforces the PEOPLE_READ permission.
 */
interface GetPeopleParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getPeople({
  search = '',
  page = 1,
  limit = 20,
}: GetPeopleParams = {}): Promise<{ data: Person[]; total: number }> {
  await requirePermission(PERMISSIONS.PEOPLE_READ);

  const supabase = await createClient();

  // Calculate pagination
  const offset = (page - 1) * limit;

  // Start query
  let query = supabase
    .from('people')
    .select('*', { count: 'exact' })
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  // Apply search
  if (search) {
    // Search by national ID or name
    query = query.or(
      `national_id.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    );
  }

  // Apply pagination limits
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[getPeople] error:', error.message);
    throw new Error('Failed to fetch people registry.');
  }

  return {
    data: data as Person[],
    total: count || 0,
  };
}
