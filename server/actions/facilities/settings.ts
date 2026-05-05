'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { z } from 'zod';

// ==========================================
// 1. Fetch Facilities
// ==========================================

export async function getFacilitiesCatalog() {
  await requirePermission(PERMISSIONS.FACILITIES_VIEW);
  const supabase = await createClient();

  const [facilitiesRes, areasRes, sportsRes] = await Promise.all([
    supabase.from('sports_facilities').select('*, facility_sports(sport_id)').order('created_at', { ascending: true }),
    supabase.from('facility_areas').select('*').order('sort_order', { ascending: true }),
    supabase.from('sports').select('id, name').order('name', { ascending: true }),
  ]);

  if (facilitiesRes.error || areasRes.error || sportsRes.error) {
    return { success: false, error: 'Failed to fetch facilities catalog.' };
  }

  return {
    success: true,
    data: {
      facilities: facilitiesRes.data,
      areas: areasRes.data,
      sports: sportsRes.data,
    },
  };
}

// ==========================================
// 2. Manage Facilities
// ==========================================

const createFacilitySchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  facilityType: z.enum(['pool', 'field', 'court', 'hall', 'gym', 'track', 'room', 'other']),
  sportIds: z.array(z.string().uuid()).optional().default([]),
  description: z.string().optional(),
});

export async function createFacility(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.FACILITIES_CREATE);
    
    const parsed = createFacilitySchema.safeParse({
      name: formData.get('name'),
      facilityType: formData.get('facilityType'),
      sportIds: formData.getAll('sportIds'),
      description: formData.get('description'),
    });

    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const supabaseAdmin = createAdminClient();
    const { data: facility, error } = await supabaseAdmin.from('sports_facilities').insert({
      name: parsed.data.name,
      facility_type: parsed.data.facilityType,
      description: parsed.data.description || null,
    }).select('id').single();

    if (error) {
      if (error.code === '23505') return { success: false, error: 'يوجد منشأة بهذا الاسم بالفعل.' };
      return { success: false, error: 'حدث خطأ أثناء الإضافة.' };
    }

    if (parsed.data.sportIds.length > 0) {
      await supabaseAdmin.from('facility_sports').insert(
        parsed.data.sportIds.map(sid => ({ facility_id: facility.id, sport_id: sid }))
      );
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}

export async function updateFacility(id: string, formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.FACILITIES_UPDATE);
    const parsed = createFacilitySchema.safeParse({
      name: formData.get('name'),
      facilityType: formData.get('facilityType'),
      sportIds: formData.getAll('sportIds'),
      description: formData.get('description'),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };
    const isActive = formData.get('isActive') === 'true';

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('sports_facilities').update({ 
      name: parsed.data.name,
      facility_type: parsed.data.facilityType,
      description: parsed.data.description || null,
      is_active: isActive,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
      if (error.code === '23505') return { success: false, error: 'يوجد منشأة بهذا الاسم بالفعل.' };
      return { success: false, error: 'حدث خطأ أثناء التعديل.' };
    }

    // Replace sports
    await supabaseAdmin.from('facility_sports').delete().eq('facility_id', id);
    if (parsed.data.sportIds.length > 0) {
      await supabaseAdmin.from('facility_sports').insert(
        parsed.data.sportIds.map(sid => ({ facility_id: id, sport_id: sid }))
      );
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'حدث خطأ أثناء التعديل.' };
  }
}

// ==========================================
// 3. Manage Facility Areas
// ==========================================

const facilityAreaSchema = z.object({
  facilityId: z.string().uuid(),
  name: z.string().min(1, 'يجب إدخال اسم الساحة'),
  areaType: z.enum(['lane', 'square', 'court', 'field_zone', 'room', 'full_facility', 'other']),
  capacity: z.coerce.number().optional().nullable(),
  sortOrder: z.coerce.number().min(0),
});

export async function createFacilityArea(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.FACILITIES_MANAGE_AREAS);
    const parsed = facilityAreaSchema.safeParse({
      facilityId: formData.get('facilityId'),
      name: formData.get('name'),
      areaType: formData.get('areaType'),
      capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
      sortOrder: formData.get('sortOrder'),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('facility_areas').insert({
      facility_id: parsed.data.facilityId,
      name: parsed.data.name,
      area_type: parsed.data.areaType,
      capacity: parsed.data.capacity,
      sort_order: parsed.data.sortOrder,
    });

    if (error) {
      if (error.code === '23505') return { success: false, error: 'الاسم مستخدم بالفعل في هذه المنشأة.' };
      throw error;
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'حدث خطأ أثناء الإضافة.' };
  }
}

export async function updateFacilityArea(id: string, formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.FACILITIES_MANAGE_AREAS);
    const parsed = facilityAreaSchema.safeParse({
      facilityId: formData.get('facilityId'),
      name: formData.get('name'),
      areaType: formData.get('areaType'),
      capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
      sortOrder: formData.get('sortOrder'),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };
    const isActive = formData.get('isActive') === 'true';

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('facility_areas').update({
      facility_id: parsed.data.facilityId,
      name: parsed.data.name,
      area_type: parsed.data.areaType,
      capacity: parsed.data.capacity,
      sort_order: parsed.data.sortOrder,
      is_active: isActive,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
      if (error.code === '23505') return { success: false, error: 'الاسم مستخدم بالفعل في هذه المنشأة.' };
      throw error;
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'حدث خطأ أثناء التعديل.' };
  }
}
