'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';

export interface AddDependentData {
  membership_id: string;
  relation_type: string;
  national_id: string;
  first_name?: string;
  second_name?: string;
  third_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  existing_person_id?: string; // If the person already exists
}

export async function addDependent(data: AddDependentData) {
  try {
    await requirePermission(PERMISSIONS.MEMBERSHIPS_ADD_DEPENDENT);

    const supabase = await createClient();

    let rpcData;
    let rpcError;

    if (data.existing_person_id) {
      // Use the new RPC for existing persons
      const result = await supabase.rpc('add_existing_person_as_dependent', {
        p_membership_id: data.membership_id,
        p_person_id: data.existing_person_id,
        p_relation_type: data.relation_type,
      });
      rpcData = result.data;
      rpcError = result.error;
    } else {
      // Use the existing RPC for brand new persons
      if (!data.first_name || !data.last_name) {
        return { success: false, error: 'Full name is required for new people.' };
      }

      const result = await supabase.rpc('add_dependent_to_membership', {
        p_membership_id: data.membership_id,
        p_relation_type: data.relation_type,
        p_national_id: data.national_id,
        p_first_name: data.first_name,
        p_second_name: data.second_name || '',
        p_third_name: data.third_name || '',
        p_last_name: data.last_name,
        p_phone_number: data.phone_number || null,
        p_email: data.email || null,
      });
      rpcData = result.data;
      rpcError = result.error;
    }

    if (rpcError) {
      console.error('[addDependent] RPC Error:', rpcError);
      return { success: false, error: rpcError.message || 'Failed to add dependent.' };
    }

    revalidatePath(`/system/memberships/${data.membership_id}`);
    
    return { success: true, data: rpcData };
  } catch (error) {
    console.error('[addDependent] Unexpected error:', error);
    return { success: false, error: getErrorMessage(error, 'An unexpected error occurred.') };
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
