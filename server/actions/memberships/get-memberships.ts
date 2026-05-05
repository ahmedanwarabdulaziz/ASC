'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';

export interface MembershipRecord {
  id: string;
  type: string;
  status: string;
  created_at: string;
  people: {
    first_name: string;
    second_name: string;
    third_name: string;
    last_name: string;
    national_id: string;
  } | null;
  membership_number_registry: {
    membership_number: string;
    is_current: boolean;
  }[] | null;
}

interface GetMembershipsParams {
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch a list of active memberships with pagination and search.
 * Enforces the MEMBERSHIPS_READ permission.
 */
export async function getMemberships({
  search = '',
  page = 1,
  limit = 20,
}: GetMembershipsParams = {}): Promise<{ data: MembershipRecord[]; total: number }> {
  await requirePermission(PERMISSIONS.MEMBERSHIPS_READ);

  const supabase = await createClient();

  const offset = (page - 1) * limit;

  // We query the memberships table and join with people and membership_number_registry
  // We use !inner on people to allow filtering by person fields
  let query = supabase
    .from('memberships')
    .select(
      `
      id,
      type,
      status,
      created_at,
      people!memberships_main_person_id_fkey!inner (
        first_name,
        second_name,
        third_name,
        last_name,
        national_id
      ),
      membership_number_registry (
        membership_number,
        is_current
      )
    `,
      { count: 'exact' }
    )
    .is('archived_at', null)
    .eq('type', 'working')
    .eq('membership_number_registry.is_current', true)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `national_id.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
      { foreignTable: 'people' }
    );
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[getMemberships] error:', error.message);
    throw new Error('Failed to fetch memberships.');
  }

  // Next.js serializes JSON perfectly, but PostgREST returns arrays for 1-to-many.
  return {
    data: data as unknown as MembershipRecord[],
    total: count || 0,
  };
}
