'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { saveMedicalApproval } from '@/server/actions/sports/save-medical-approval';

type SectorType = 'practice' | 'competition';
type ApprovalState = 'not_required' | 'missing' | 'valid' | 'expiring_soon' | 'expired' | 'revoked';

type ApprovalRecord = {
  id: string;
  sector_type: SectorType;
  status: 'valid' | 'expired' | 'revoked';
  issue_date: string;
  validity_months: number;
  expiry_date: string;
  notes: string | null;
  created_at: string;
};

type SectorSetting = {
  id: string;
  sector_type: SectorType;
  name: string;
  requires_medical_approval: boolean;
};

type DashboardSourceRow = {
  id: string;
  person_id: string;
  sport_id: string;
  status: string;
  created_at: string;
  current_level_id: string | null;
  people: {
    id: string;
    first_name: string;
    second_name: string | null;
    third_name: string | null;
    last_name: string;
    national_id: string | null;
    sport_medical_approvals: ApprovalRecord[];
  } | null;
  sports: {
    id: string;
    name: string;
    sport_sectors: SectorSetting[];
  } | null;
  sport_levels: {
    id: string;
    name: string;
  } | null;
};

function plusDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function getLatestApproval(approvals: ApprovalRecord[], sectorType: SectorType) {
  const matches = approvals.filter(item => item.sector_type === sectorType);
  if (matches.length === 0) {
    return null;
  }

  return matches.sort((a, b) => {
    const aTime = new Date(a.issue_date || a.created_at).getTime();
    const bTime = new Date(b.issue_date || b.created_at).getTime();
    return bTime - aTime;
  })[0];
}

function getSectorStatus(
  sector: SectorSetting | undefined,
  approval: ApprovalRecord | null,
  soonThreshold: Date,
): ApprovalState {
  if (!sector?.requires_medical_approval) {
    return 'not_required';
  }

  if (!approval) {
    return 'missing';
  }

  if (approval.status === 'revoked') {
    return 'revoked';
  }

  const expiry = new Date(approval.expiry_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (approval.status !== 'valid' || expiry < today) {
    return 'expired';
  }

  if (expiry <= soonThreshold) {
    return 'expiring_soon';
  }

  return 'valid';
}

export async function getMedicalApprovalsDashboard() {
  await requirePermission(PERMISSIONS.MEDICAL_APPROVALS_VIEW);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sport_players')
    .select(`
      id,
      person_id,
      sport_id,
      status,
      created_at,
      current_level_id,
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
          expiry_date,
          notes,
          created_at
        )
      ),
      sports (
        id,
        name,
        sport_sectors (
          id,
          sector_type,
          name,
          requires_medical_approval
        )
      ),
      sport_levels (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  const threshold = plusDays(new Date(), 60);
  threshold.setHours(23, 59, 59, 999);

  const rows = ((data ?? []) as DashboardSourceRow[]).map((player) => {
    const approvals = (player.people?.sport_medical_approvals ?? []) as ApprovalRecord[];
    const sectors = (player.sports?.sport_sectors ?? []) as SectorSetting[];

    const practiceSector = sectors.find(sector => sector.sector_type === 'practice');
    const competitionSector = sectors.find(sector => sector.sector_type === 'competition');

    const practiceApproval = getLatestApproval(approvals, 'practice');
    const competitionApproval = getLatestApproval(approvals, 'competition');

    const practiceStatus = getSectorStatus(practiceSector, practiceApproval, threshold);
    const competitionStatus = getSectorStatus(competitionSector, competitionApproval, threshold);

    const statusSet = [practiceStatus, competitionStatus];
    const hasExpiringSoon = statusSet.includes('expiring_soon');
    const hasBlockingIssue = statusSet.some(status => status === 'missing' || status === 'expired' || status === 'revoked');
    const hasValidCoverage = statusSet.some(status => status === 'valid');

    const fullName = [
      player.people?.first_name,
      player.people?.second_name,
      player.people?.third_name,
      player.people?.last_name,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: player.id as string,
      person_id: player.person_id as string,
      sport_id: player.sport_id as string,
      sport_name: player.sports?.name ?? '-',
      player_status: player.status as string,
      level_name: player.sport_levels?.name ?? null,
      full_name: fullName,
      national_id: player.people?.national_id ?? null,
      practice_sector: practiceSector ?? null,
      competition_sector: competitionSector ?? null,
      practice_approval: practiceApproval,
      competition_approval: competitionApproval,
      practice_status: practiceStatus,
      competition_status: competitionStatus,
      needs_attention: hasBlockingIssue || hasExpiringSoon,
      has_blocking_issue: hasBlockingIssue,
      has_expiring_soon: hasExpiringSoon,
      has_valid_coverage: hasValidCoverage,
    };
  });

  const summary = {
    total_players: rows.length,
    missing_or_blocked: rows.filter(row => row.has_blocking_issue).length,
    expiring_soon: rows.filter(row => row.has_expiring_soon).length,
    covered_now: rows.filter(row => row.has_valid_coverage && !row.has_blocking_issue && !row.has_expiring_soon).length,
  };

  return { success: true, data: { rows, summary } };
}

export async function addMedicalApprovalFromDashboard(formData: FormData) {
  await requirePermission(PERMISSIONS.MEDICAL_APPROVALS_MANAGE);

  const personId = formData.get('personId') as string;
  const sectorType = formData.get('sectorType') as SectorType;
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
    return { success: false, error: result.error };
  }

  revalidatePath('/system/sports/medical-approvals');
  revalidatePath('/system/sports/players');
  return { success: true };
}
