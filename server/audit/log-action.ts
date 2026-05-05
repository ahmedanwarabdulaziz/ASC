import { createAdminClient } from '@/lib/supabase/admin';
import type { InsertAuditLog } from '@/types/database';

/**
 * logAction
 *
 * Server-only helper to write an entry to the audit_logs table.
 *
 * Design rules:
 * - Uses the service-role client so audit writes are NEVER blocked by RLS.
 * - Silent on failure — logs to stderr but never throws.
 *   Audit failures must not prevent the main operation from completing.
 * - Call AFTER the main operation succeeds.
 *
 * @example
 *   await logAction({
 *     actorUserId: user.id,
 *     action: 'people.create',
 *     entityType: 'people',
 *     entityId: newPerson.id,
 *     newData: newPerson,
 *   });
 */
export async function logAction(entry: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    const adminClient = createAdminClient();

    const row: InsertAuditLog = {
      actor_user_id: entry.actorUserId ?? null,
      action:        entry.action,
      entity_type:   entry.entityType,
      entity_id:     entry.entityId ?? null,
      old_data:      entry.oldData ?? null,
      new_data:      entry.newData ?? null,
      ip_address:    entry.ipAddress ?? null,
      user_agent:    entry.userAgent ?? null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminClient as any)
      .from('audit_logs')
      .insert(row);

    if (error) {
      console.error('[logAction] Failed to write audit log:', error.message, {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
      });
    }
  } catch (err) {
    // Never throw from audit logging — it must not break the main operation.
    console.error('[logAction] Unexpected error:', err);
  }
}

/**
 * Predefined action constants for consistency across the codebase.
 * Expand this list as new auditable operations are added.
 */
export const AUDIT_ACTIONS = {
  // People
  PEOPLE_CREATE:  'people.create',
  PEOPLE_UPDATE:  'people.update',
  PEOPLE_ARCHIVE: 'people.archive',

  // Memberships
  MEMBERSHIP_CREATE:  'membership.create',
  MEMBERSHIP_UPDATE:  'membership.update',
  MEMBERSHIP_ARCHIVE: 'membership.archive',

  // Dependents
  DEPENDENT_ADD:     'dependent.add',
  DEPENDENT_END:     'dependent.end',
  DEPENDENT_SEPARATE:'dependent.separate',

  // Membership numbers
  MEMBERSHIP_NUMBER_CORRECT: 'membership_number.correct',

  // Roles / Permissions
  ROLE_GRANT: 'role.grant',
  ROLE_END:   'role.end',

  // Settings
  SETTINGS_UPDATE: 'settings.update',

  // Auth
  USER_LOGIN:  'auth.login',
  USER_LOGOUT: 'auth.logout',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
