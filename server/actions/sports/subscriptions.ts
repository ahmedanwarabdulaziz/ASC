'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';

export async function getSubscriptionsData(month: string) {
  // We use view permission (which usually overlaps with finance/accounting views, but we'll use a generic one or the specific one created in 023)
  // Wait, let's use a generic authenticated check for now, or assume system_admin
  const supabase = await createClient();

  const { data: subscriptions, error } = await supabase
    .from('sport_program_subscriptions')
    .select(`
      *,
      training_group_enrollments (
        sport_players (
          people (first_name, second_name, last_name, national_id)
        ),
        training_groups (name, sport_id, sports(name))
      )
    `)
    .eq('billing_month_start', month + '-01')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب الاشتراكات' };
  }

  return { success: true, data: subscriptions || [] };
}

export async function generateSubscriptionsForMonth(month: string) {
  // Call the RPC using the authenticated client so auth.uid() is populated for permission checks
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('generate_monthly_subscriptions', {
    p_month: month
  });

  if (error) {
    console.error('Error generating subscriptions:', error);
    return { success: false, error: `حدث خطأ أثناء إصدار المطالبات المالية: ${error.message || JSON.stringify(error)}` };
  }

  revalidatePath('/system/sports/subscriptions');
  return { success: true, count: data };
}

export async function confirmSubscriptionPayment(subscriptionId: string, receiptNumber: string) {
  // Call the RPC using the authenticated client
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('confirm_subscription_payment', {
    p_subscription_id: subscriptionId,
    p_receipt_number: receiptNumber
  });

  if (error) {
    console.error('Error confirming payment:', error);
    return { success: false, error: 'حدث خطأ أثناء تأكيد الدفع.' };
  }

  revalidatePath('/system/sports/subscriptions');
  return { success: true };
}
