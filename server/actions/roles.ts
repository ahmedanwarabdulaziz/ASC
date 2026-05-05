'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import type { RoleDefinition, SystemPermission, SystemRolePermission } from '@/types/database';
import { PERMISSIONS } from '@/types/permissions';

type ManageableRole = Pick<RoleDefinition, 'id' | 'code' | 'name_ar' | 'name_en' | 'description' | 'is_active' | 'created_at' | 'updated_at'>;
type ManageablePermission = Pick<SystemPermission, 'code' | 'name_ar' | 'name_en' | 'description'>;
type RolePermissionLink = SystemRolePermission;

type RolePayload = {
  code: string;
  name_ar: string;
  name_en?: string | null;
  description?: string | null;
  is_active?: boolean;
  permission_codes: string[];
};

function normalizeRoleCode(code: string) {
  return code.trim().toLowerCase();
}

function validateRoleCode(code: string) {
  return /^[a-z0-9_]+$/.test(code);
}

function uniquePermissionCodes(codes: string[]) {
  return [...new Set(codes.map(code => code.trim()).filter(Boolean))].sort();
}

export async function getRolesWorkspace() {
  await requirePermission(PERMISSIONS.ROLES_READ);
  const supabase = await createClient();

  const [rolesRes, permissionsRes, linksRes] = await Promise.all([
    supabase.from('role_definitions').select('id, code, name_ar, name_en, description, is_active, created_at, updated_at').order('name_ar'),
    supabase.from('system_permissions').select('code, name_ar, name_en, description').order('code'),
    supabase.from('system_role_permissions').select('role_id, permission_code'),
  ]);

  if (rolesRes.error) return { success: false, error: rolesRes.error.message };
  if (permissionsRes.error) return { success: false, error: permissionsRes.error.message };
  if (linksRes.error) return { success: false, error: linksRes.error.message };

  return {
    success: true,
    data: {
      roles: (rolesRes.data ?? []) as ManageableRole[],
      permissions: (permissionsRes.data ?? []) as ManageablePermission[],
      links: (linksRes.data ?? []) as RolePermissionLink[],
    },
  };
}

export async function createRoleDefinitionWithPermissions(payload: RolePayload) {
  await requirePermission(PERMISSIONS.ROLES_CREATE);
  await requirePermission(PERMISSIONS.ROLES_UPDATE);

  const supabase = await createClient();
  const code = normalizeRoleCode(payload.code);
  const permissionCodes = uniquePermissionCodes(payload.permission_codes);

  if (!validateRoleCode(code)) {
    return { success: false, error: 'Role code must use lowercase letters, numbers, and underscores only.' };
  }

  const { data: role, error: roleError } = await supabase
    .from('role_definitions')
    .insert({
      code,
      name_ar: payload.name_ar.trim(),
      name_en: payload.name_en?.trim() || null,
      description: payload.description?.trim() || null,
      is_active: payload.is_active ?? true,
    })
    .select('id')
    .single();

  if (roleError) return { success: false, error: roleError.message };

  if (permissionCodes.length > 0) {
    const { error: permissionError } = await supabase.from('system_role_permissions').insert(
      permissionCodes.map(permissionCode => ({
        role_id: role.id,
        permission_code: permissionCode,
      })),
    );

    if (permissionError) return { success: false, error: permissionError.message };
  }

  revalidatePath('/system/roles');
  revalidatePath('/system/staff/settings');
  return { success: true };
}

export async function updateRoleDefinitionWithPermissions(roleId: string, payload: RolePayload) {
  await requirePermission(PERMISSIONS.ROLES_UPDATE);
  await requirePermission(PERMISSIONS.ROLES_READ);

  const supabase = await createClient();
  const code = normalizeRoleCode(payload.code);
  const permissionCodes = uniquePermissionCodes(payload.permission_codes);

  if (!validateRoleCode(code)) {
    return { success: false, error: 'Role code must use lowercase letters, numbers, and underscores only.' };
  }

  const { error: roleError } = await supabase
    .from('role_definitions')
    .update({
      code,
      name_ar: payload.name_ar.trim(),
      name_en: payload.name_en?.trim() || null,
      description: payload.description?.trim() || null,
      is_active: payload.is_active ?? true,
    })
    .eq('id', roleId);

  if (roleError) return { success: false, error: roleError.message };

  const { data: currentLinks, error: linksError } = await supabase
    .from('system_role_permissions')
    .select('permission_code')
    .eq('role_id', roleId);

  if (linksError) return { success: false, error: linksError.message };

  const currentCodes = new Set((currentLinks ?? []).map(link => link.permission_code));
  const nextCodes = new Set(permissionCodes);

  const toInsert = permissionCodes.filter(codeValue => !currentCodes.has(codeValue));
  const toDelete = [...currentCodes].filter(codeValue => !nextCodes.has(codeValue));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('system_role_permissions').insert(
      toInsert.map(permissionCode => ({
        role_id: roleId,
        permission_code: permissionCode,
      })),
    );

    if (insertError) return { success: false, error: insertError.message };
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('system_role_permissions')
      .delete()
      .eq('role_id', roleId)
      .in('permission_code', toDelete);

    if (deleteError) return { success: false, error: deleteError.message };
  }

  revalidatePath('/system/roles');
  revalidatePath('/system/staff/settings');
  return { success: true };
}

export async function deleteRoleDefinition(roleId: string) {
  await requirePermission(PERMISSIONS.ROLES_DELETE);
  await requirePermission(PERMISSIONS.ROLES_READ);

  const supabase = await createClient();

  const { data: assignedRoles, error: assignedError } = await supabase
    .from('person_roles')
    .select('id', { count: 'exact' })
    .eq('role_id', roleId)
    .limit(1);

  if (assignedError) {
    return { success: false, error: assignedError.message };
  }

  if ((assignedRoles?.length ?? 0) > 0) {
    return {
      success: false,
      error: 'This role cannot be deleted because it is assigned to one or more people.',
    };
  }

  const { error } = await supabase.from('role_definitions').delete().eq('id', roleId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/system/roles');
  revalidatePath('/system/staff/settings');
  return { success: true };
}
