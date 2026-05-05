'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { z } from 'zod';

// ==========================================
// 1. Fetch Catalog
// ==========================================

export async function getSportsCatalog() {
  await requirePermission(PERMISSIONS.SPORTS_VIEW);
  const supabase = await createClient();

  const [sportsRes, sectorsRes, levelsRes, ageGroupsRes] = await Promise.all([
    supabase.from('sports').select('*').order('created_at', { ascending: true }),
    supabase.from('sport_sectors').select('*').order('created_at', { ascending: true }),
    supabase.from('sport_levels').select('*').order('sort_order', { ascending: true }),
    supabase.from('sport_age_groups').select('*').order('min_age', { ascending: true, nullsFirst: true }),
  ]);

  if (sportsRes.error || sectorsRes.error || levelsRes.error || ageGroupsRes.error) {
    console.error('Error fetching sports catalog', {
      sports: sportsRes.error,
      sectors: sectorsRes.error,
      levels: levelsRes.error,
      ageGroups: ageGroupsRes.error,
    });
    return { success: false, error: 'Failed to fetch sports catalog.' };
  }

  return {
    success: true,
    data: {
      sports: sportsRes.data,
      sectors: sectorsRes.data,
      levels: levelsRes.data,
      ageGroups: ageGroupsRes.data,
    },
  };
}

// ==========================================
// 2. Manage Sports
// ==========================================

const createSportSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  description: z.string().optional(),
  practiceMode: z.enum(['age_only', 'level_only', 'age_and_level', 'manual']),
  competitionMode: z.enum(['age_only', 'level_only', 'age_and_level', 'manual']),
});

export async function createSport(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.SPORTS_CREATE);
    
    const parsed = createSportSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      practiceMode: formData.get('practiceMode'),
      competitionMode: formData.get('competitionMode'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { name, description, practiceMode, competitionMode } = parsed.data;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('create_sport_transaction', {
      p_name: name,
      p_description: description || null,
      p_practice_mode: practiceMode,
      p_competition_mode: competitionMode,
    });

    if (error) {
      console.error('[createSport] RPC Error:', error);
      if (error.code === '23505') return { success: false, error: 'يوجد لعبة بهذا الاسم بالفعل.' };
      return { success: false, error: 'حدث خطأ أثناء إضافة اللعبة.' };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}

export async function updateSport(id: string, formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.SPORTS_UPDATE);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!name || name.length < 2) return { success: false, error: 'الاسم غير صالح' };

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('sports').update({ 
      name, 
      description: description || null, 
      is_active: isActive,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'حدث خطأ أثناء تعديل اللعبة.' };
  }
}

// ==========================================
// 3. Manage Sectors (Classification Mode & Medical)
// ==========================================

export async function updateSectorSettings(sectorId: string, classificationMode: string, requiresMedicalApproval: boolean) {
  try {
    await requirePermission(PERMISSIONS.SPORTS_MANAGE_SETUP);
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from('sport_sectors')
      .update({ 
        classification_mode: classificationMode, 
        requires_medical_approval: requiresMedicalApproval,
        updated_at: new Date().toISOString() 
      })
      .eq('id', sectorId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'حدث خطأ أثناء تعديل القطاع.' };
  }
}

// ==========================================
// 4. Manage Levels
// ==========================================

const levelSchema = z.object({
  sportId: z.string().uuid(),
  code: z.string().min(1, 'يجب إدخال الرمز (مثل A, B)'),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  sortOrder: z.coerce.number().min(1),
});

export async function createSportLevel(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.SPORTS_MANAGE_LEVELS);
    const parsed = levelSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('sport_levels').insert({
      sport_id: parsed.data.sportId,
      code: parsed.data.code,
      name: parsed.data.name,
      sort_order: parsed.data.sortOrder,
    });

    if (error) {
      if (error.code === '23505') return { success: false, error: 'الرمز أو الترتيب مستخدم بالفعل.' };
      throw error;
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'حدث خطأ أثناء الإضافة.' };
  }
}

export async function updateSportLevel(id: string, formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.SPORTS_MANAGE_LEVELS);
    const parsed = levelSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };
    const isActive = formData.get('isActive') === 'true';

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('sport_levels').update({
      sport_id: parsed.data.sportId,
      code: parsed.data.code,
      name: parsed.data.name,
      sort_order: parsed.data.sortOrder,
      is_active: isActive,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
      if (error.code === '23505') return { success: false, error: 'الرمز أو الترتيب مستخدم بالفعل.' };
      throw error;
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'حدث خطأ أثناء التعديل.' };
  }
}

// ==========================================
// 5. Manage Age Groups
// ==========================================

const ageGroupSchema = z.object({
  sportId: z.string().uuid(),
  sectorId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  minAgeYears: z.coerce.number().optional().nullable(),
  maxAgeYears: z.coerce.number().optional().nullable(),
});

export async function createAgeGroup(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.SPORTS_MANAGE_AGE_GROUPS);
    const parsed = ageGroupSchema.safeParse({
      sportId: formData.get('sportId'),
      sectorId: formData.get('sectorId') || null,
      name: formData.get('name'),
      minAgeYears: formData.get('minAgeYears') ? Number(formData.get('minAgeYears')) : null,
      maxAgeYears: formData.get('maxAgeYears') ? Number(formData.get('maxAgeYears')) : null,
    });

    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('sport_age_groups').insert({
      sport_id: parsed.data.sportId,
      sector_id: parsed.data.sectorId,
      name: parsed.data.name,
      min_age_years: parsed.data.minAgeYears,
      max_age_years: parsed.data.maxAgeYears,
    });

    if (error) {
      if (error.code === '23514') return { success: false, error: 'الحد الأقصى للعمر يجب أن يكون أكبر من أو يساوي الحد الأدنى.' };
      if (error.code === '23505') return { success: false, error: 'هذا الاسم مستخدم مسبقاً.' };
      throw error;
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'حدث خطأ أثناء الإضافة.' };
  }
}

export async function updateAgeGroup(id: string, formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.SPORTS_MANAGE_AGE_GROUPS);
    const parsed = ageGroupSchema.safeParse({
      sportId: formData.get('sportId'),
      sectorId: formData.get('sectorId') || null,
      name: formData.get('name'),
      minAgeYears: formData.get('minAgeYears') ? Number(formData.get('minAgeYears')) : null,
      maxAgeYears: formData.get('maxAgeYears') ? Number(formData.get('maxAgeYears')) : null,
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };
    const isActive = formData.get('isActive') === 'true';

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('sport_age_groups').update({
      sport_id: parsed.data.sportId,
      sector_id: parsed.data.sectorId,
      name: parsed.data.name,
      min_age_years: parsed.data.minAgeYears,
      max_age_years: parsed.data.maxAgeYears,
      is_active: isActive,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
      if (error.code === '23514') return { success: false, error: 'الحد الأقصى للعمر يجب أن يكون أكبر من أو يساوي الحد الأدنى.' };
      if (error.code === '23505') return { success: false, error: 'هذا الاسم مستخدم مسبقاً.' };
      throw error;
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'حدث خطأ أثناء التعديل.' };
  }
}
