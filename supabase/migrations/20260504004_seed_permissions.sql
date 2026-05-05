-- =============================================================================
-- Migration: 20260504004_seed_permissions
-- Phase 1: Security and Access Foundation
-- Environment: DEVELOPMENT ONLY
-- =============================================================================
-- Seeds the initial permission codes and system role definitions.
-- Uses ON CONFLICT DO NOTHING so re-running is safe (idempotent).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Seed permission codes
-- ---------------------------------------------------------------------------

INSERT INTO public.system_permissions (code, name_ar, name_en, description) VALUES

  -- People
  ('people.read',    'عرض الأشخاص',   'Read People',    'View person records'),
  ('people.create',  'إضافة شخص',     'Create Person',  'Create new person records'),
  ('people.update',  'تعديل شخص',     'Update Person',  'Edit existing person records'),
  ('people.archive', 'أرشفة شخص',     'Archive Person', 'Archive (soft-delete) a person record'),

  -- Memberships
  ('memberships.read',    'عرض العضويات',      'Read Memberships',    'View membership records'),
  ('memberships.create',  'إضافة عضوية',       'Create Membership',   'Create new memberships'),
  ('memberships.update',  'تعديل عضوية',       'Update Membership',   'Edit existing membership records'),
  ('memberships.archive', 'أرشفة عضوية',       'Archive Membership',  'Archive (soft-delete) a membership'),

  -- Dependents
  ('memberships.add_dependent',               'إضافة تابع',            'Add Dependent',              'Add a dependent to a membership'),
  ('memberships.separation.request',          'طلب فصل تابع',          'Request Separation',         'Submit a dependent separation request'),
  ('memberships.separation.admin_approve',    'موافقة إدارية على الفصل', 'Admin Approve Separation',  'Give admin approval on separation requests'),
  ('memberships.separation.board_approve',    'موافقة مجلس على الفصل', 'Board Approve Separation',   'Give board approval on separation requests'),
  ('memberships.separation.payment_confirm',  'تأكيد سداد الفصل',      'Confirm Separation Payment', 'Confirm payment step of a separation'),

  -- Roles
  ('roles.read',   'عرض الأدوار',   'Read Roles',   'View role definitions and assignments'),
  ('roles.create', 'إضافة دور',     'Create Role',  'Create new role definitions'),
  ('roles.update', 'تعديل دور',     'Update Role',  'Edit role definitions and assignments'),
  ('roles.delete', 'حذف دور',       'Delete Role',  'Delete a role definition (only if no history)'),

  -- Settings
  ('settings.read',   'عرض الإعدادات',  'Read Settings',   'View system settings'),
  ('settings.update', 'تعديل الإعدادات','Update Settings',  'Edit system settings'),

  -- Audit
  ('audit.read', 'عرض سجل العمليات', 'Read Audit Log', 'View the audit log')

ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- STEP 2: Seed system role definitions
-- ---------------------------------------------------------------------------

INSERT INTO public.role_definitions (code, name_ar, name_en, description) VALUES
  ('system_admin',        'مدير النظام',          'System Admin',        'Full access to all system functions'),
  ('membership_manager',  'مدير العضويات',        'Membership Manager',  'Manages people and memberships; cannot delete roles'),
  ('membership_clerk',    'موظف العضويات',        'Membership Clerk',    'Limited read and create for membership operations'),
  ('board_reviewer',      'مراجع مجلس الإدارة',  'Board Reviewer',      'Board-level approval and read access')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- STEP 3: Assign permissions to roles
-- ---------------------------------------------------------------------------

-- System Admin — all permissions
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT rd.id, sp.code
FROM   public.role_definitions  rd
CROSS  JOIN public.system_permissions sp
WHERE  rd.code = 'system_admin'
ON CONFLICT DO NOTHING;

-- Membership Manager — people + membership permissions; no role deletion
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT rd.id, sp.code
FROM   public.role_definitions rd
JOIN   public.system_permissions sp ON sp.code IN (
  'people.read', 'people.create', 'people.update', 'people.archive',
  'memberships.read', 'memberships.create', 'memberships.update', 'memberships.archive',
  'memberships.add_dependent',
  'memberships.separation.request', 'memberships.separation.admin_approve',
  'memberships.separation.payment_confirm',
  'roles.read',
  'settings.read',
  'audit.read'
)
WHERE rd.code = 'membership_manager'
ON CONFLICT DO NOTHING;

-- Membership Clerk — read + limited create
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT rd.id, sp.code
FROM   public.role_definitions rd
JOIN   public.system_permissions sp ON sp.code IN (
  'people.read', 'people.create',
  'memberships.read', 'memberships.create',
  'memberships.add_dependent',
  'memberships.separation.request',
  'settings.read'
)
WHERE rd.code = 'membership_clerk'
ON CONFLICT DO NOTHING;

-- Board Reviewer — board approval + read-only
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT rd.id, sp.code
FROM   public.role_definitions rd
JOIN   public.system_permissions sp ON sp.code IN (
  'people.read',
  'memberships.read',
  'memberships.separation.board_approve',
  'roles.read',
  'settings.read',
  'audit.read'
)
WHERE rd.code = 'board_reviewer'
ON CONFLICT DO NOTHING;
