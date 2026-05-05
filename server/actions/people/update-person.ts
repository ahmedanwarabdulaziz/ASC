'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { findPersonByNationalId } from '@/server/identity/find-person-by-national-id';
import { revalidatePath } from 'next/cache';

export type UpdatePersonInput = {
  id: string;
  national_id: string;
  first_name: string;
  second_name: string;
  third_name: string;
  last_name: string;
  phone_number?: string;
  email?: string;
  emergency_contact?: string;
};

export type UpdatePersonResult = {
  success: boolean;
  error?: string;
};

/**
 * Updates an existing Person record.
 * Enforces the PEOPLE_UPDATE permission and checks National ID uniqueness if changed.
 */
export async function updatePerson(data: UpdatePersonInput): Promise<UpdatePersonResult> {
  // 1. Permission Check
  await requirePermission(PERMISSIONS.PEOPLE_UPDATE);

  // 2. Validate input
  if (!data.id || !data.national_id || !data.first_name || !data.last_name) {
    return { success: false, error: 'Missing required fields: ID, National ID, First Name, Last Name' };
  }

  // 3. Uniqueness Check
  const existingPerson = await findPersonByNationalId(data.national_id);
  if (existingPerson && existingPerson.id !== data.id) {
    return { success: false, error: 'A different person with this National ID already exists.' };
  }

  // 4. Update
  const supabase = await createClient();
  const { error } = await supabase
    .from('people')
    .update({
      national_id: data.national_id,
      first_name: data.first_name,
      second_name: data.second_name,
      third_name: data.third_name,
      last_name: data.last_name,
      phone_number: data.phone_number || null,
      email: data.email || null,
      emergency_contact: data.emergency_contact || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id);

  if (error) {
    console.error('[updatePerson] error:', error.message);
    return { success: false, error: 'Failed to update person. ' + error.message };
  }

  // 5. Revalidate cache
  revalidatePath('/system/people');
  revalidatePath(`/system/people/${data.id}`);

  return { success: true };
}
