'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { findPersonByNationalId } from '@/server/identity/find-person-by-national-id';
import { revalidatePath } from 'next/cache';

export type CreatePersonInput = {
  national_id: string;
  first_name: string;
  second_name: string;
  third_name: string;
  last_name: string;
  phone_number?: string;
  email?: string;
  emergency_contact?: string;
};

export type CreatePersonResult = {
  success: boolean;
  error?: string;
  personId?: string;
};

/**
 * Creates a new standalone Person record.
 * Enforces the PEOPLE_CREATE permission and checks National ID uniqueness.
 */
export async function createPerson(data: CreatePersonInput): Promise<CreatePersonResult> {
  // 1. Permission Check
  await requirePermission(PERMISSIONS.PEOPLE_CREATE);

  // 2. Validate input
  if (!data.national_id || !data.first_name || !data.last_name) {
    return { success: false, error: 'Missing required fields: National ID, First Name, Last Name' };
  }

  // 3. Uniqueness Check
  const existingPerson = await findPersonByNationalId(data.national_id);
  if (existingPerson) {
    return { success: false, error: 'A person with this National ID already exists.' };
  }

  // 4. Insert
  const supabase = await createClient();
  const { data: insertedData, error } = await supabase
    .from('people')
    .insert({
      national_id: data.national_id,
      first_name: data.first_name,
      second_name: data.second_name,
      third_name: data.third_name,
      last_name: data.last_name,
      phone_number: data.phone_number || null,
      email: data.email || null,
      emergency_contact: data.emergency_contact || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createPerson] error:', error.message);
    return { success: false, error: 'Failed to create person. ' + error.message };
  }

  // 5. Revalidate cache for the people table
  revalidatePath('/system/people');

  return { success: true, personId: insertedData.id };
}
