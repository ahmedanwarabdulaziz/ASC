'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export async function getPricingPlansData() {
  await requirePermission('pricing_plans.view');
  const supabase = await createClient();

  const [plansRes, sportsRes, sectorsRes, groupsRes] = await Promise.all([
    supabase.from('training_group_pricing_plans').select('*, sports(name), sport_sectors(name), pricing_plan_training_groups(training_group_id, training_groups(name))').order('created_at', { ascending: false }),
    supabase.from('sports').select('id, name').order('name'),
    supabase.from('sport_sectors').select('id, sport_id, name'),
    supabase.from('training_groups').select('id, sport_id, sector_id, name').order('name'),
  ]);

  if (plansRes.error) {
    return { success: false, error: 'حدث خطأ أثناء جلب خطط الأسعار' };
  }

  return {
    success: true,
    data: {
      plans: plansRes.data || [],
      sports: sportsRes.data || [],
      sectors: sectorsRes.data || [],
      groups: groupsRes.data || [],
    }
  };
}

const pricingPlanSchema = z.object({
  sportId: z.string().uuid().optional().nullable(),
  sectorId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, 'الاسم مطلوب'),
  memberPrice: z.coerce.number().min(0, 'يجب أن يكون السعر 0 أو أكثر'),
  nonMemberPrice: z.coerce.number().min(0, 'يجب أن يكون السعر 0 أو أكثر'),
  weeklySessionCount: z.coerce.number().min(1, 'عدد الحصص الأسبوعية مطلوب'),
});

export async function createPricingPlan(formData: FormData) {
  try {
    await requirePermission('pricing_plans.manage');
    
    const parsed = pricingPlanSchema.safeParse({
      sportId: formData.get('sportId') || null,
      sectorId: formData.get('sectorId') || null,
      name: formData.get('name'),
      memberPrice: formData.get('memberPrice'),
      nonMemberPrice: formData.get('nonMemberPrice'),
      weeklySessionCount: formData.get('weeklySessionCount'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' };
    }

    const trainingGroupIds = formData.getAll('trainingGroupIds') as string[];
    const { sportId, sectorId, name, memberPrice, nonMemberPrice, weeklySessionCount } = parsed.data;

    if (!sportId && trainingGroupIds.length === 0) {
      return { success: false, error: 'يجب اختيار اللعبة أو مجموعة تدريبية واحدة على الأقل' };
    }

    const supabaseAdmin = createAdminClient();
    const { data: planData, error } = await supabaseAdmin.from('training_group_pricing_plans').insert({
      sport_id: sportId,
      sector_id: sectorId,
      name,
      member_price: memberPrice,
      non_member_price: nonMemberPrice,
      weekly_session_count: weeklySessionCount,
      monthly_billable_sessions: weeklySessionCount * 4,
    }).select('id').single();

    if (error) {
      console.error(error);
      return { success: false, error: 'حدث خطأ أثناء حفظ الخطة' };
    }

    if (trainingGroupIds.length > 0) {
      const mappings = trainingGroupIds.map(gid => ({
        pricing_plan_id: planData.id,
        training_group_id: gid
      }));
      await supabaseAdmin.from('pricing_plan_training_groups').insert(mappings);
    }

    revalidatePath('/system/sports/pricing-plans');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: 'حدث خطأ غير متوقع' };
  }
}

export async function updatePricingPlan(id: string, formData: FormData) {
  try {
    await requirePermission('pricing_plans.manage');
    
    const parsed = pricingPlanSchema.safeParse({
      sportId: formData.get('sportId') || null,
      sectorId: formData.get('sectorId') || null,
      name: formData.get('name'),
      memberPrice: formData.get('memberPrice'),
      nonMemberPrice: formData.get('nonMemberPrice'),
      weeklySessionCount: formData.get('weeklySessionCount'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' };
    }

    const trainingGroupIds = formData.getAll('trainingGroupIds') as string[];
    const isActive = formData.get('isActive') === 'true';

    const { sportId, sectorId, name, memberPrice, nonMemberPrice, weeklySessionCount } = parsed.data;

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('training_group_pricing_plans').update({
      sport_id: sportId,
      sector_id: sectorId,
      name,
      member_price: memberPrice,
      non_member_price: nonMemberPrice,
      weekly_session_count: weeklySessionCount,
      monthly_billable_sessions: weeklySessionCount * 4,
      is_active: isActive,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
      return { success: false, error: 'حدث خطأ أثناء حفظ الخطة' };
    }

    // Update junction table
    await supabaseAdmin.from('pricing_plan_training_groups').delete().eq('pricing_plan_id', id);
    if (trainingGroupIds.length > 0) {
      const mappings = trainingGroupIds.map(gid => ({
        pricing_plan_id: id,
        training_group_id: gid
      }));
      await supabaseAdmin.from('pricing_plan_training_groups').insert(mappings);
    }

    revalidatePath('/system/sports/pricing-plans');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: 'حدث خطأ غير متوقع' };
  }
}
