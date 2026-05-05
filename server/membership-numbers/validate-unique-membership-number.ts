import { createClient } from '@/lib/supabase/server';

/**
 * validateUniqueMembershipNumber
 *
 * Checks if a membership number is already registered across ANY membership type.
 * Returns true if the number is available, false if it is already taken.
 */
export async function validateUniqueMembershipNumber(membershipNumber: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('membership_number_registry')
    .select('id')
    .eq('membership_number', membershipNumber)
    .limit(1);

  if (error) {
    console.error('[validateUniqueMembershipNumber] error:', error.message);
    throw new Error('Failed to validate membership number uniqueness');
  }

  // If the array is empty, the number does not exist and is available
  return data.length === 0;
}
