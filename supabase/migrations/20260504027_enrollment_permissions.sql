-- =============================================================================
-- Migration: 20260504027_enrollment_permissions
-- Phase 4I Update: Add training_groups.enroll permission
-- =============================================================================

INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('training_groups.enroll', 'تسجيل اللاعبين في المجموعات', 'Training Groups Enroll', 'Enroll or transfer players between groups')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('training_groups.enroll')
) AS perms(permission_code)
WHERE code IN ('system_admin', 'membership_manager')
ON CONFLICT DO NOTHING;
