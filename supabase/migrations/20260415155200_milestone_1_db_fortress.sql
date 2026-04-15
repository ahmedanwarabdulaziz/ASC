-- =========================================================
-- MILESTONE 1: SECURITY, INTEGRITY, & AUDIT OVERHAUL
-- =========================================================

-- 1. DROP PERMISSIVE SECURITY
DROP POLICY IF EXISTS "Allow all authenticated users full access to people" ON public.people;
DROP POLICY IF EXISTS "Allow all authenticated users full access to family_links" ON public.family_links;
DROP POLICY IF EXISTS "Allow all authenticated users full access to system_users" ON public.system_users;
DROP POLICY IF EXISTS "Allow all authenticated users full access to role_definitions" ON public.role_definitions;
DROP POLICY IF EXISTS "Allow all authenticated users full access to role_fields" ON public.role_fields;
DROP POLICY IF EXISTS "Allow all authenticated users full access to person_roles" ON public.person_roles;
DROP POLICY IF EXISTS "Allow all authenticated users full access to person_role_values" ON public.person_role_values;
DROP POLICY IF EXISTS "Allow all authenticated users full access to system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow all authenticated users full access to memberships" ON public.memberships;
DROP POLICY IF EXISTS "Allow all authenticated users full access to membership_members" ON public.membership_members;

-- 2. CREATE SECURITY TABLES
CREATE TABLE IF NOT EXISTS public.system_permissions (
  code text primary key,
  name_ar text not null,
  name_en text,
  description text,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.system_role_permissions (
  role_id uuid not null references public.role_definitions(id) on delete cascade,
  permission_code text not null references public.system_permissions(code) on delete cascade,
  primary key (role_id, permission_code)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- 3. MEMBERSHIP NUMBER REGISTRY & SEQUENCES
CREATE TABLE IF NOT EXISTS public.membership_number_sequences (
  id uuid primary key default gen_random_uuid(),
  base_membership_number text not null unique,
  next_dependent_suffix integer not null default 1,
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.membership_number_registry (
  id uuid primary key default gen_random_uuid(),
  membership_number text not null unique,
  number_type text not null,
  person_id uuid references public.people(id) on delete restrict,
  membership_id uuid references public.memberships(id) on delete restrict,
  membership_member_id uuid references public.membership_members(id) on delete restrict,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  reason text
);

-- 4. APPLY HISTORY/ARCHIVE COLUMNS TO PREVENT HARD DELETES
ALTER TABLE public.memberships 
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_by uuid,
ADD COLUMN IF NOT EXISTS archive_reason text;

ALTER TABLE public.membership_members
ADD COLUMN IF NOT EXISTS status text not null default 'active',
ADD COLUMN IF NOT EXISTS ended_at timestamptz,
ADD COLUMN IF NOT EXISTS ended_by uuid,
ADD COLUMN IF NOT EXISTS end_reason text;

-- 5. CREATE RBAC HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.has_permission(required_permission text)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_has boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 
    FROM public.system_role_permissions srp
    JOIN public.person_roles pr ON pr.role_id = srp.role_id
    JOIN public.system_users su ON su.person_id = pr.person_id
    WHERE su.id = v_user_id
      AND pr.status = 'active'
      AND srp.permission_code = required_permission
  ) INTO v_has;

  RETURN v_has;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. STRICT TABLE RLS WRAPPERS
ALTER TABLE public.system_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_number_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members with settings.read" ON public.system_permissions FOR SELECT TO authenticated USING (public.has_permission('settings.read'::text));
CREATE POLICY "Allow members with roles.read" ON public.system_role_permissions FOR SELECT TO authenticated USING (public.has_permission('roles.read'::text));
CREATE POLICY "Allow members with audit.read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_permission('audit.read'::text));

CREATE POLICY "RBAC_People_Select" ON public.people FOR SELECT TO authenticated USING (public.has_permission('people.read'::text));
CREATE POLICY "RBAC_People_Insert" ON public.people FOR INSERT TO authenticated WITH CHECK (public.has_permission('people.create'::text));
CREATE POLICY "RBAC_People_Update" ON public.people FOR UPDATE TO authenticated USING (public.has_permission('people.update'::text));

CREATE POLICY "RBAC_Memberships_Select" ON public.memberships FOR SELECT TO authenticated USING (public.has_permission('memberships.read'::text));
CREATE POLICY "RBAC_Memberships_Insert" ON public.memberships FOR INSERT TO authenticated WITH CHECK (public.has_permission('memberships.create'::text));
CREATE POLICY "RBAC_Memberships_Update" ON public.memberships FOR UPDATE TO authenticated USING (public.has_permission('memberships.update'::text));

CREATE POLICY "RBAC_MembershipMembers_Select" ON public.membership_members FOR SELECT TO authenticated USING (public.has_permission('memberships.read'::text));
CREATE POLICY "RBAC_MembershipMembers_Insert" ON public.membership_members FOR INSERT TO authenticated WITH CHECK (public.has_permission('memberships.add_dependent'::text));
CREATE POLICY "RBAC_MembershipMembers_Update" ON public.membership_members FOR UPDATE TO authenticated USING (public.has_permission('memberships.update'::text));

CREATE POLICY "RBAC_Settings_Select" ON public.system_settings FOR SELECT TO authenticated USING (public.has_permission('settings.read'::text));
CREATE POLICY "RBAC_Settings_Update" ON public.system_settings FOR ALL TO authenticated USING (public.has_permission('settings.update'::text));

CREATE POLICY "RBAC_RoleDefs_Select" ON public.role_definitions FOR SELECT TO authenticated USING (public.has_permission('roles.read'::text));
CREATE POLICY "RBAC_RoleDefs_Update" ON public.role_definitions FOR ALL TO authenticated USING (public.has_permission('roles.update'::text));

CREATE POLICY "RBAC_PersonRoles_Select" ON public.person_roles FOR SELECT TO authenticated USING (public.has_permission('roles.read'::text));
CREATE POLICY "RBAC_PersonRoles_All" ON public.person_roles FOR ALL TO authenticated USING (public.has_permission('roles.update'::text));

CREATE POLICY "RBAC_SystemUsers_Select" ON public.system_users FOR SELECT TO authenticated USING (public.has_permission('people.read'::text));
CREATE POLICY "RBAC_SystemUsers_All" ON public.system_users FOR ALL TO authenticated USING (public.has_permission('people.update'::text));

-- Note: In a production environment with super-admins, ensure there is an emergency override or the first Super Admin is manually seeded!

-- 7. SEED PERMISSIONS
INSERT INTO public.system_permissions (code, name_ar, name_en) VALUES
('people.read', 'عرض الأشخاص', 'Read People'),
('people.create', 'إضافة أشخاص', 'Create People'),
('people.update', 'تعديل الأشخاص', 'Update People'),
('memberships.read', 'عرض العضويات', 'Read Memberships'),
('memberships.create', 'إنشاء عضويات', 'Create Memberships'),
('memberships.update', 'تعديل العضويات', 'Update Memberships'),
('memberships.add_dependent', 'إضافة تابع لعضوية', 'Add Dependent'),
('roles.read', 'عرض الأدوار', 'Read Roles'),
('roles.create', 'تكوين مسار دور العمل', 'Create Role Definitions'),
('roles.update', 'إدارة صلاحيات وتعيينات الأدوار', 'Update Role Definitions'),
('settings.read', 'استعراض الإعدادات', 'Read Settings'),
('settings.update', 'تعديل إعدادات النظام', 'Update Settings'),
('audit.read', 'سجل مراجعة النظام', 'Read Audit Logs')
ON CONFLICT (code) DO NOTHING;

-- WARNING: The user must link their auth user to this `System Admin` role manually via SQL to gain UI access.

-- 8. SEED SYSTEM ADMIN ROLE
INSERT INTO public.role_definitions (id, code, name_ar, category, allows_system_login, public_visibility) 
VALUES ('00000000-0000-0000-0000-000000000001', 'SYS_ADMIN', 'مدير النظام', 'access', true, false)
ON CONFLICT (code) DO NOTHING;

-- BIND ALL PERMISSIONS TO SYSTEM ADMIN
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000001', code FROM public.system_permissions
ON CONFLICT DO NOTHING;
