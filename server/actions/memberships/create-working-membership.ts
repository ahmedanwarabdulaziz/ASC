'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';
import { validateUniqueMembershipNumber } from '@/server/membership-numbers/validate-unique-membership-number';

export interface CreateWorkingMembershipData {
  person_id: string;
  membership_number: string;
}

export async function createWorkingMembership(data: CreateWorkingMembershipData) {
  try {
    // 1. Enforce permissions
    await requirePermission(PERMISSIONS.MEMBERSHIPS_CREATE);

    // 2. Validate membership number format (English digits)
    if (!/^\d+$/.test(data.membership_number)) {
      return { success: false, error: 'Membership number must contain only numbers.' };
    }

    // 3. Validate global uniqueness
    const isUnique = await validateUniqueMembershipNumber(data.membership_number);
    if (!isUnique) {
      return { success: false, error: 'This membership number is already registered in the system.' };
    }

    const supabase = await createClient();

    // 4. Call the RPC to attach the membership to the existing person safely
    const { data: rpcData, error: rpcError } = await supabase.rpc('add_working_membership_to_person', {
      p_person_id: data.person_id,
      p_membership_number: data.membership_number,
    });

    if (rpcError) {
      console.error('[createWorkingMembership] RPC Error:', rpcError);
      
      // Handle known errors cleanly
      if (rpcError.message.includes('already has an active working membership')) {
         return { success: false, error: 'This person already has an active working membership.' };
      }
      return { success: false, error: 'Failed to create membership. Please try again.' };
    }

    // 5. Revalidate cache
    revalidatePath('/system/memberships');

    return { success: true, data: rpcData };
  } catch (error) {
    console.error('[createWorkingMembership] Unexpected error:', error);
    return { success: false, error: getErrorMessage(error, 'An unexpected error occurred.') };
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
