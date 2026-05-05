import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import type { PermissionCode } from '@/types/permissions';

/**
 * requirePermission
 *
 * Server-side guard that verifies the current user holds a specific permission.
 * Call this at the top of Server Actions and Server Components that require access control.
 *
 * Behavior:
 * - If the user is not authenticated → redirects to login
 * - If the user lacks the permission → throws a 403 error (or redirects to login)
 * - If the permission is granted → returns void and execution continues
 *
 * Uses the session-aware server Supabase client to call the `has_permission` RPC.
 * The RPC is SECURITY DEFINER and handles all role chain resolution internally.
 *
 * @param code - The permission code to check (use PERMISSIONS constants from types/permissions.ts)
 * @param options.redirectOnFail - If true (default), redirect to login on failure instead of throwing
 *
 * @example
 *   import { requirePermission } from '@/server/permissions/require-permission';
 *   import { PERMISSIONS } from '@/types/permissions';
 *
 *   export async function getPeopleList() {
 *     await requirePermission(PERMISSIONS.PEOPLE_READ);
 *     // ... safe to query people now
 *   }
 */
export async function requirePermission(
  code: PermissionCode,
  options: { redirectOnFail?: boolean } = {}
): Promise<void> {
  const { redirectOnFail = true } = options;

  const supabase = await createClient();

  // Check authentication first
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(ROUTES.auth.login);
  }

  // Call the database-side permission helper
  const { data: granted, error } = await supabase.rpc('has_permission', {
    permission_code: code,
  });

  if (error) {
    console.error('[requirePermission] RPC error:', error.message);
    // Fail closed — deny access if the RPC itself errors
    if (redirectOnFail) {
      redirect(ROUTES.auth.login);
    }
    throw new Error(`Permission check failed: ${error.message}`);
  }

  if (!granted) {
    if (redirectOnFail) {
      // TODO Phase 2: redirect to a proper "access denied" page instead
      redirect(ROUTES.auth.login);
    }
    throw new Error(`Access denied: missing permission '${code}'`);
  }
}

/**
 * checkPermission
 *
 * Non-throwing variant. Returns a boolean.
 * Use when you want to conditionally show/hide UI rather than hard-block.
 *
 * @example
 *   const canArchive = await checkPermission(PERMISSIONS.PEOPLE_ARCHIVE);
 */
export async function checkPermission(code: PermissionCode): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('has_permission', {
      permission_code: code,
    });

    if (error) {
      console.error('[checkPermission] RPC error:', error.message);
      return false;
    }

    return data === true;
  } catch {
    return false;
  }
}
