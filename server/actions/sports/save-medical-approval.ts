'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type MedicalSectorType = 'practice' | 'competition';

type SaveMedicalApprovalInput = {
  personId: string;
  sectorType: MedicalSectorType;
  issueDate: string;
  validityMonths: number;
  notes?: string | null;
};

function addMonthsToIsoDate(issueDate: string, months: number) {
  const [year, month, day] = issueDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().split('T')[0];
}

export async function saveMedicalApproval(input: SaveMedicalApprovalInput) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'Unable to resolve the current signed-in user.' };
  }

  const expiryDate = addMonthsToIsoDate(input.issueDate, input.validityMonths);

  const { error: invalidateError } = await adminClient
    .from('sport_medical_approvals')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('person_id', input.personId)
    .eq('sector_type', input.sectorType)
    .eq('status', 'valid');

  if (invalidateError) {
    return { success: false, error: invalidateError.message };
  }

  const { data: insertedApproval, error: insertError } = await adminClient
    .from('sport_medical_approvals')
    .insert({
      person_id: input.personId,
      sector_type: input.sectorType,
      issue_date: input.issueDate,
      validity_months: input.validityMonths,
      expiry_date: expiryDate,
      status: 'valid',
      notes: input.notes || null,
    })
    .select('id')
    .single();

  if (insertError || !insertedApproval) {
    return { success: false, error: insertError?.message || 'Unable to save the medical approval.' };
  }

  const { error: auditError } = await adminClient.from('audit_logs').insert({
    actor_user_id: user.id,
    action: 'medical_approvals.add',
    entity_type: 'sport_medical_approvals',
    entity_id: insertedApproval.id,
    new_data: {
      person_id: input.personId,
      sector_type: input.sectorType,
      issue_date: input.issueDate,
      validity_months: input.validityMonths,
      expiry_date: expiryDate,
    },
  });

  if (auditError) {
    return { success: false, error: auditError.message };
  }

  return { success: true, approvalId: insertedApproval.id };
}
