'use server';

import { findPersonByNationalId } from '@/server/identity/find-person-by-national-id';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';

export async function searchPersonAction(nationalId: string) {
  // Wait, if they are searching for a person to add a membership, they need PEOPLE_READ or MEMBERSHIPS_CREATE
  await requirePermission(PERMISSIONS.MEMBERSHIPS_CREATE);
  
  try {
    const person = await findPersonByNationalId(nationalId);
    return { success: true, data: person };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search for person',
    };
  }
}
