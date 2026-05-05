'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPermission, requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';
import { saveMedicalApproval } from '@/server/actions/sports/save-medical-approval';

export async function getPlayers() {
  await requirePermission(PERMISSIONS.PLAYERS_VIEW);

  const supabase = await createClient();
  const canManageMedicalApprovals = await checkPermission(PERMISSIONS.MEDICAL_APPROVALS_MANAGE);

  const { data: players, error } = await supabase
    .from('sport_players')
    .select(`
      *,
      people (
        id,
        first_name,
        second_name,
        third_name,
        last_name,
        national_id,
        sport_medical_approvals (
          id,
          sector_type,
          status,
          issue_date,
          validity_months,
          expiry_date
        )
      ),
      sports (
        id,
        name
      ),
      sport_levels (
        id,
        name
      ),
      training_group_enrollments (
        id,
        training_group_id,
        status,
        training_groups (
          id,
          name,
          status
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching players:', error.message, error.details, error.hint, error.code);
    return { success: false, error: `Failed to load players: ${error.message || JSON.stringify(error)}` };
  }

  const { data: sportsData } = await supabase.from('sports').select('id, name').order('name');
  const { data: levelsData } = await supabase.from('sport_levels').select('id, sport_id, name').order('name');
  const { data: trainingGroupsData } = await supabase
    .from('training_groups')
    .select('id, sport_id, level_id, name, status')
    .eq('status', 'active')
    .order('name');

  return {
    success: true,
    data: {
      players: players || [],
      sports: sportsData || [],
      levels: levelsData || [],
      trainingGroups: trainingGroupsData || [],
      canManageMedicalApprovals,
    },
  };
}

export async function searchPeopleForEnrollment(query: string) {
  await requirePermission(PERMISSIONS.PLAYERS_MANAGE);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('people')
    .select('id, first_name, second_name, third_name, last_name, national_id')
    .or(`national_id.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    return { success: false, error: 'Search failed.' };
  }

  return { success: true, data: data || [] };
}

export async function searchSportPlayersForEnrollment(query: string, sportId: string) {
  await requirePermission(PERMISSIONS.PLAYERS_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sport_players')
    .select(`
      id,
      status,
      people!inner (
        id,
        first_name,
        second_name,
        third_name,
        last_name,
        national_id
      )
    `)
    .eq('sport_id', sportId)
    .or(`national_id.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`, {
      foreignTable: 'people',
    })
    .limit(10);

  if (error) {
    console.error('Search players error:', error);
    return { success: false, error: 'Search failed.' };
  }

  return { success: true, data: data || [] };
}

export async function enrollPlayer(formData: FormData) {
  await requirePermission(PERMISSIONS.PLAYERS_MANAGE);
  const adminClient = createAdminClient();

  const personId = formData.get('personId') as string;
  const sportId = formData.get('sportId') as string;
  const levelId = formData.get('levelId') as string;
  const notes = formData.get('notes') as string;

  if (!personId || !sportId) {
    return { success: false, error: 'Person and sport are required.' };
  }

  const { data: existing } = await adminClient
    .from('sport_players')
    .select('id')
    .eq('person_id', personId)
    .eq('sport_id', sportId)
    .single();

  if (existing) {
    return { success: false, error: 'This person is already registered as a player in this sport.' };
  }

  const { data, error } = await adminClient
    .from('sport_players')
    .insert({
      person_id: personId,
      sport_id: sportId,
      current_level_id: levelId || null,
      notes: notes || null,
      status: 'active',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error enrolling player:', error);
    return { success: false, error: 'Unable to register the player.' };
  }

  if (levelId) {
    await adminClient.from('player_level_history').insert({
      sport_player_id: data.id,
      sport_id: sportId,
      to_level_id: levelId,
      reason: 'Initial player registration',
    });
  }

  revalidatePath('/system/sports/players');
  return { success: true };
}

export async function updatePlayerStatus(playerId: string, status: string) {
  await requirePermission(PERMISSIONS.PLAYERS_MANAGE);
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('sport_players')
    .update({
      status,
      ended_at: status === 'ended' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playerId);

  if (error) {
    return { success: false, error: 'Unable to update player status.' };
  }

  revalidatePath('/system/sports/players');
  return { success: true };
}

export async function updatePlayerLevel(playerId: string, sportId: string, newLevelId: string, reason: string) {
  await requirePermission(PERMISSIONS.PLAYERS_MANAGE);
  const adminClient = createAdminClient();

  const { data: player } = await adminClient
    .from('sport_players')
    .select('current_level_id')
    .eq('id', playerId)
    .single();

  if (!player) {
    return { success: false, error: 'Player not found.' };
  }

  if (player.current_level_id === newLevelId) {
    return { success: true };
  }

  const { error: updateError } = await adminClient
    .from('sport_players')
    .update({
      current_level_id: newLevelId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playerId);

  if (updateError) {
    return { success: false, error: 'Unable to update player level.' };
  }

  await adminClient.from('player_level_history').insert({
    sport_player_id: playerId,
    sport_id: sportId,
    from_level_id: player.current_level_id,
    to_level_id: newLevelId,
    reason: reason || 'Level update',
  });

  revalidatePath('/system/sports/players');
  return { success: true };
}

export async function addMedicalApproval(formData: FormData) {
  await requirePermission(PERMISSIONS.MEDICAL_APPROVALS_MANAGE);

  const personId = formData.get('personId') as string;
  const sectorType = formData.get('sectorType') as 'practice' | 'competition';
  const issueDate = formData.get('issueDate') as string;
  const validityMonths = Number.parseInt(formData.get('validityMonths') as string, 10);
  const notes = formData.get('notes') as string;

  if (!personId || !sectorType || !issueDate || Number.isNaN(validityMonths)) {
    return { success: false, error: 'Incomplete medical approval data.' };
  }

  const result = await saveMedicalApproval({
    personId,
    sectorType,
    issueDate,
    validityMonths,
    notes: notes || null,
  });

  if (!result.success) {
    return { success: false, error: `Unable to save the medical approval: ${result.error}` };
  }

  revalidatePath('/system/sports/players');
  revalidatePath('/system/sports/medical-approvals');
  return { success: true };
}
