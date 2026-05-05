'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import type { InsertStaffGroup, RoleDefinition } from '@/types/database';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getStaffCategories() {
  await requirePermission(PERMISSIONS.STAFF_VIEW);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_categories')
    .select('*')
    .order('name');
    
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function createStaffCategory(payload: { name: string; description?: string }) {
  await requirePermission(PERMISSIONS.STAFF_MANAGE_SETTINGS);
  const supabase = await createClient();
  const { error } = await supabase.from('staff_categories').insert({
    name: payload.name,
    description: payload.description || null,
  });
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/system/staff/settings');
  return { success: true };
}

export async function updateStaffCategory(id: string, payload: { name: string; description?: string; is_active: boolean }) {
  await requirePermission(PERMISSIONS.STAFF_MANAGE_SETTINGS);
  const supabase = await createClient();
  const { error } = await supabase.from('staff_categories').update({
    name: payload.name,
    description: payload.description || null,
    is_active: payload.is_active,
  }).eq('id', id);
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/system/staff/settings');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Subcategories
// ---------------------------------------------------------------------------

export async function getStaffSubcategories() {
  await requirePermission(PERMISSIONS.STAFF_VIEW);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_subcategories')
    .select('*, category:staff_categories(name)')
    .order('name');
    
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function createStaffSubcategory(payload: { category_id: string; name: string; description?: string }) {
  await requirePermission(PERMISSIONS.STAFF_MANAGE_SETTINGS);
  const supabase = await createClient();
  const { error } = await supabase.from('staff_subcategories').insert({
    category_id: payload.category_id,
    name: payload.name,
    description: payload.description || null,
  });
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/system/staff/settings');
  return { success: true };
}

export async function updateStaffSubcategory(id: string, payload: { category_id: string; name: string; description?: string; is_active: boolean }) {
  await requirePermission(PERMISSIONS.STAFF_MANAGE_SETTINGS);
  const supabase = await createClient();
  const { error } = await supabase.from('staff_subcategories').update({
    category_id: payload.category_id,
    name: payload.name,
    description: payload.description || null,
    is_active: payload.is_active,
  }).eq('id', id);
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/system/staff/settings');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export async function getStaffGroups() {
  await requirePermission(PERMISSIONS.STAFF_VIEW);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_groups')
    .select('*, role:role_definitions(id, code, name_ar, name_en, is_active)')
    .order('name');
     
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getAssignableRoles() {
  await requirePermission(PERMISSIONS.STAFF_MANAGE_GROUPS);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('role_definitions')
    .select('id, code, name_ar, name_en, is_active')
    .eq('is_active', true)
    .order('name_ar');

  if (error) return { success: false, error: error.message, data: [] as Pick<RoleDefinition, 'id' | 'code' | 'name_ar' | 'name_en' | 'is_active'>[] };
  return {
    success: true,
    data: (data ?? []) as Pick<RoleDefinition, 'id' | 'code' | 'name_ar' | 'name_en' | 'is_active'>[],
  };
}

export async function createStaffGroup(payload: Pick<InsertStaffGroup, 'name' | 'description' | 'role_id'>) {
  await requirePermission(PERMISSIONS.STAFF_MANAGE_GROUPS);
  const supabase = await createClient();
  const { error } = await supabase.from('staff_groups').insert({
    name: payload.name,
    description: payload.description || null,
    role_id: payload.role_id || null,
  });
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/system/staff/settings');
  return { success: true };
}

export async function updateStaffGroup(
  id: string,
  payload: Pick<InsertStaffGroup, 'name' | 'description' | 'role_id'> & { is_active: boolean },
) {
  await requirePermission(PERMISSIONS.STAFF_MANAGE_GROUPS);
  const supabase = await createClient();
  const { error } = await supabase.from('staff_groups').update({
    name: payload.name,
    description: payload.description || null,
    role_id: payload.role_id || null,
    is_active: payload.is_active,
  }).eq('id', id);
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/system/staff/settings');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export async function getStaffJobs() {
  await requirePermission(PERMISSIONS.STAFF_VIEW);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff_jobs')
    .select('*, category:staff_categories(name), subcategory:staff_subcategories(name), default_group:staff_groups(name)')
    .order('name');
    
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function createStaffJob(payload: { 
  category_id: string; 
  subcategory_id?: string | null; 
  default_group_id?: string | null; 
  name: string; 
  description?: string | null;
  is_training_sector: boolean;
  is_training_commissionable: boolean;
  account_policy: 'none' | 'optional' | 'required';
}) {
  await requirePermission(PERMISSIONS.STAFF_MANAGE_JOBS);
  const supabase = await createClient();
  const { error } = await supabase.from('staff_jobs').insert(payload);
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/system/staff/settings');
  return { success: true };
}

export async function updateStaffJob(id: string, payload: { 
  category_id: string; 
  subcategory_id?: string | null; 
  default_group_id?: string | null; 
  name: string; 
  description?: string | null;
  is_training_sector: boolean;
  is_training_commissionable: boolean;
  account_policy: 'none' | 'optional' | 'required';
  is_active: boolean;
}) {
  await requirePermission(PERMISSIONS.STAFF_MANAGE_JOBS);
  const supabase = await createClient();
  const { error } = await supabase.from('staff_jobs').update(payload).eq('id', id);
  
  if (error) return { success: false, error: error.message };
  revalidatePath('/system/staff/settings');
  return { success: true };
}
