'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import type { Person } from '@/types/database';

export interface PersonMembershipSummary {
  id: string;
  membership_number: string;
  status: string;
  created_at: string;
}

export interface PersonDetails {
  person: Person;
  memberships: PersonMembershipSummary[];
}

type MembershipRegistryRow = {
  membership_number: string;
  is_current: boolean;
  number_type: string;
};

type PersonMembershipRow = {
  id: string;
  status: string;
  created_at: string;
  membership_number_registry: MembershipRegistryRow[];
};

export async function getPersonDetails(
  personId: string
): Promise<{ success: boolean; data?: PersonDetails; error?: string }> {
  try {
    await requirePermission(PERMISSIONS.PEOPLE_READ);

    const supabase = await createClient();

    const { data: person, error: personError } = await supabase
      .from('people')
      .select('*')
      .eq('id', personId)
      .is('archived_at', null)
      .single();

    if (personError) {
      throw personError;
    }

    if (!person) {
      return { success: false, error: 'Person not found' };
    }

    const { data: membershipsData, error: membershipsError } = await supabase
      .from('memberships')
      .select(`
        id,
        status,
        created_at,
        membership_number_registry (
          membership_number,
          is_current,
          number_type
        )
      `)
      .eq('main_person_id', personId)
      .is('archived_at', null)
      .eq('type', 'working')
      .order('created_at', { ascending: false });

    if (membershipsError) {
      throw membershipsError;
    }

    const memberships = ((membershipsData || []) as unknown as PersonMembershipRow[]).map(
      (membership) => {
      const currentNumber = membership.membership_number_registry.find(
        (record) => record.is_current && record.number_type === 'working'
      );

      return {
        id: membership.id,
        membership_number: currentNumber?.membership_number ?? 'N/A',
        status: membership.status,
        created_at: membership.created_at,
      };
      }
    );

    return {
      success: true,
      data: {
        person: person as Person,
        memberships,
      },
    };
  } catch (error) {
    console.error('[getPersonDetails]', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Failed to fetch person details'),
    };
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
