/**
 * Permission Codes
 *
 * Strongly-typed permission codes that match the values seeded
 * in the system_permissions table (migration 20260504004).
 *
 * Use these constants everywhere in server-side code instead of
 * raw strings to keep permission names refactor-safe.
 */

export const PERMISSIONS = {
  // People
  PEOPLE_READ:    'people.read',
  PEOPLE_CREATE:  'people.create',
  PEOPLE_UPDATE:  'people.update',
  PEOPLE_ARCHIVE: 'people.archive',

  // Memberships
  MEMBERSHIPS_READ:    'memberships.read',
  MEMBERSHIPS_CREATE:  'memberships.create',
  MEMBERSHIPS_UPDATE:  'memberships.update',
  MEMBERSHIPS_ARCHIVE: 'memberships.archive',

  // Dependents
  MEMBERSHIPS_ADD_DEPENDENT:              'memberships.add_dependent',
  MEMBERSHIPS_SEPARATION_REQUEST:         'memberships.separation.request',
  MEMBERSHIPS_SEPARATION_ADMIN_APPROVE:   'memberships.separation.admin_approve',
  MEMBERSHIPS_SEPARATION_BOARD_APPROVE:   'memberships.separation.board_approve',
  MEMBERSHIPS_SEPARATION_PAYMENT_CONFIRM: 'memberships.separation.payment_confirm',

  // Roles
  ROLES_READ:   'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  // Settings
  SETTINGS_READ:   'settings.read',
  SETTINGS_UPDATE: 'settings.update',

  // Staff
  STAFF_VIEW:            'staff.view',
  STAFF_CREATE:          'staff.create',
  STAFF_UPDATE:          'staff.update',
  STAFF_ARCHIVE:         'staff.archive',
  STAFF_MANAGE_SETTINGS: 'staff.manage_settings',
  STAFF_MANAGE_GROUPS:   'staff.manage_groups',
  STAFF_MANAGE_JOBS:     'staff.manage_jobs',

  // Audit
  AUDIT_READ: 'audit.read',

  // Auth
  AUTH_PROVISION: 'auth.provision',

  // Sports Catalog
  SPORTS_VIEW: 'sports.view',
  SPORTS_CREATE: 'sports.create',
  SPORTS_UPDATE: 'sports.update',
  SPORTS_ARCHIVE: 'sports.archive',
  SPORTS_MANAGE_SETUP: 'sports.manage_setup',
  SPORTS_MANAGE_LEVELS: 'sports.manage_levels',
  SPORTS_MANAGE_AGE_GROUPS: 'sports.manage_age_groups',

  // Facilities
  FACILITIES_VIEW: 'facilities.view',
  FACILITIES_CREATE: 'facilities.create',
  FACILITIES_UPDATE: 'facilities.update',
  FACILITIES_MANAGE_AREAS: 'facilities.manage_areas',

  // Players
  PLAYERS_VIEW: 'players.view',
  PLAYERS_MANAGE: 'players.manage',

  // Medical Approvals
  MEDICAL_APPROVALS_VIEW: 'medical_approvals.view',
  MEDICAL_APPROVALS_MANAGE: 'medical_approvals.manage',

  // Training Groups
  TRAINING_GROUPS_VIEW: 'training_groups.view',
  TRAINING_GROUPS_MANAGE: 'training_groups.manage',
  TRAINING_GROUPS_ENROLL: 'training_groups.enroll',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * System Role Codes
 *
 * Matches the role codes seeded in role_definitions.
 */
export const SYSTEM_ROLES = {
  SYSTEM_ADMIN:       'system_admin',
  MEMBERSHIP_MANAGER: 'membership_manager',
  MEMBERSHIP_CLERK:   'membership_clerk',
  BOARD_REVIEWER:     'board_reviewer',
} as const;

export type SystemRoleCode = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
