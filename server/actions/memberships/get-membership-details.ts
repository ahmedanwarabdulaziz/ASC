'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';

export interface MembershipDetails {
  id: string;
  type: string;
  status: string;
  created_at: string;
  main_person: {
    id: string;
    first_name: string;
    second_name: string;
    third_name: string;
    last_name: string;
    national_id: string;
    phone_number: string | null;
  };
  membership_number: string;
  dependents: {
    id: string;
    relation_type: string;
    status: string;
    person: {
      id: string;
      first_name: string;
      second_name: string;
      third_name: string;
      last_name: string;
      national_id: string;
    };
    dependent_number: string;
  }[];
}

type MembershipNumberRegistryRow = {
  membership_number: string;
  is_current: boolean;
  number_type: string;
};

type MembershipDetailsRow = {
  id: string;
  type: string;
  status: string;
  created_at: string;
  people: MembershipDetails['main_person'];
  membership_number_registry: MembershipNumberRegistryRow[];
};

type DependentRow = {
  id: string;
  relation_type: string;
  status: string;
  people: MembershipDetails['dependents'][number]['person'];
  membership_number_registry: Array<{
    membership_number: string;
    is_current: boolean;
  }>;
};

/**
 * Fetch a specific membership with its main member and all dependents.
 * Enforces the MEMBERSHIPS_READ permission.
 */
export async function getMembershipDetails(membershipId: string): Promise<{ success: boolean; data?: MembershipDetails; error?: string }> {
  try {
    await requirePermission(PERMISSIONS.MEMBERSHIPS_READ);

    const supabase = await createClient();

    // Fetch the membership and main person details
    const { data: membershipData, error: membershipError } = await supabase
      .from('memberships')
      .select(`
        id,
        type,
        status,
        created_at,
        people!memberships_main_person_id_fkey (
          id,
          first_name,
          second_name,
          third_name,
          last_name,
          national_id,
          phone_number
        ),
        membership_number_registry (
          membership_number,
          is_current,
          number_type
        )
      `)
      .eq('id', membershipId)
      .single();

    if (membershipError) throw membershipError;
    if (!membershipData) return { success: false, error: 'Membership not found' };

    const membership = membershipData as unknown as MembershipDetailsRow;

    const currentNumberInfo = membership.membership_number_registry.find(
      (record) => record.is_current && record.number_type === 'working'
    );
    const mainMembershipNumber = currentNumberInfo ? currentNumberInfo.membership_number : 'N/A';

    // Fetch dependents
    const { data: dependentsData, error: dependentsError } = await supabase
      .from('membership_members')
      .select(`
        id,
        relation_type,
        status,
        people (
          id,
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
      `)
      .eq('membership_id', membershipId)
      .is('ended_at', null); // only active/current links

    if (dependentsError) throw dependentsError;

    const dependents = (dependentsData || []) as unknown as DependentRow[];
    const formattedDependents = dependents.map((dep) => {
      const depNumInfo = dep.membership_number_registry.find((record) => record.is_current);
      return {
        id: dep.id,
        relation_type: dep.relation_type,
        status: dep.status,
        person: dep.people,
        dependent_number: depNumInfo ? depNumInfo.membership_number : 'N/A',
      };
    });

    return {
      success: true,
      data: {
        id: membership.id,
        type: membership.type,
        status: membership.status,
        created_at: membership.created_at,
        main_person: membership.people,
        membership_number: mainMembershipNumber,
        dependents: formattedDependents,
      },
    };
  } catch (error) {
    console.error('[getMembershipDetails]', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Failed to fetch membership details'),
    };
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
