import { createClient } from '@/lib/supabase/server';
import type { Person } from '@/types/database';

/**
 * findPersonByNationalId
 *
 * Looks up a person by their national ID. Returns null if not found.
 * Used during membership creation to prevent duplicates or attach roles to an existing person.
 */
export async function findPersonByNationalId(nationalId: string): Promise<Person | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('national_id', nationalId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // PostgREST 116 means zero rows found — this is expected if the person doesn't exist
      return null;
    }
    console.error('[findPersonByNationalId] error:', error.message);
    throw new Error('Failed to search for person by national ID');
  }

  return data;
}
