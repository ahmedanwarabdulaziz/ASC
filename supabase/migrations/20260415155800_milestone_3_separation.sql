-- =========================================================
-- MILESTONE 3: DEPENDENT SEPARATION & CONVERSION WORKFLOW
-- =========================================================

CREATE TABLE IF NOT EXISTS public.membership_separation_requests (
  id uuid primary key default gen_random_uuid(),
  membership_member_id uuid not null references public.membership_members(id) on delete restrict,
  requested_by uuid references auth.users(id),
  status text not null default 'draft',
  admin_approved_by uuid references auth.users(id),
  admin_approved_at timestamptz,
  board_approved_by uuid references auth.users(id),
  board_approved_at timestamptz,
  board_decision_number text,
  board_meeting_date date,
  payment_confirmed_by uuid references auth.users(id),
  payment_confirmed_at timestamptz,
  new_working_membership_id uuid references public.memberships(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.membership_separation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RBAC_Separation_Select" ON public.membership_separation_requests FOR SELECT TO authenticated USING (public.has_permission('memberships.read'::text));
CREATE POLICY "RBAC_Separation_Insert" ON public.membership_separation_requests FOR INSERT TO authenticated WITH CHECK (public.has_permission('memberships.separation.request'::text));
CREATE POLICY "RBAC_Separation_Update" ON public.membership_separation_requests FOR UPDATE TO authenticated USING (public.has_permission('memberships.separation.admin_approve'::text));

-- Create an index to quickly find separation requests for a specific member
CREATE INDEX idx_separation_requests_member ON public.membership_separation_requests(membership_member_id);

-- Seed permissions for the separation workflow if not exists
INSERT INTO public.system_permissions (code, name_ar, name_en) VALUES
('memberships.separation.request', 'طلب فصل تابع', 'Request Separation'),
('memberships.separation.admin_approve', 'موافقة إدارية على الفصل', 'Admin Separation Approval'),
('memberships.separation.board_approve', 'اعتماد مجلس الإدارة للفصل', 'Board Separation Approval'),
('memberships.separation.payment_confirm', 'تأكيد سداد الفصل', 'Payment Separation Confirmation')
ON CONFLICT (code) DO NOTHING;

-- BIND NEW PERMISSIONS TO SYSTEM ADMIN
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT '00000000-0000-0000-0000-000000000001', code FROM public.system_permissions
ON CONFLICT DO NOTHING;
