# Antigravity Security and Integrity Updates | تحديثات الامان وسلامة البيانات

## Purpose | الهدف

This file contains mandatory updates for Antigravity before adding more business modules. The system handles National IDs, memberships, family links, staff access, and future NFC gates, so security and history rules must be correct from the first moment.

هذا الملف يحتوي تحديثات اجبارية قبل اضافة موديولات جديدة. السيستم يتعامل مع ارقام قومية وعضويات وروابط عائلية وصلاحيات وبوابات مستقبلية، لذلك الامان وحفظ التاريخ لازم يتعملوا صح من البداية.

## Priority | الاولوية

These updates are higher priority than UI polish or new modules.

هذه التحديثات اهم من تحسينات الواجهة او اضافة موديولات جديدة.

Order:

1. Replace permissive RLS with real RBAC policies | استبدال RLS المفتوح بسياسات صلاحيات حقيقية
2. Stop hard deletes and preserve history | منع الحذف النهائي وحفظ التاريخ
3. Add membership number registry/history | اضافة سجل ارقام العضوية وتاريخها
4. Move critical writes into database transactions/RPCs | نقل العمليات الحساسة الى معاملات قاعدة البيانات
5. Fix build/lint blockers | اصلاح مشاكل البناء واللينت

## Phase 1: RLS From Day One | تفعيل RLS الصحيح من البداية

### Current Problem | المشكلة الحالية

The project currently has broad policies like:

```sql
CREATE POLICY "Allow all authenticated users full access ..."
```

This must not remain, even during early development, because it trains the app around unsafe assumptions.

لا نترك سياسات تسمح لكل مستخدم مسجل بالدخول الكامل، حتى اثناء التطوير، لانها تجعل السيستم مبني على افتراضات غير آمنة.

### Required Update | المطلوب

Antigravity must create a new migration that:

1. Drops all permissive `Allow all authenticated users full access` policies.
2. Adds permission tables if missing.
3. Adds helper functions for permission checks.
4. Adds scoped RLS policies per table.
5. Seeds only the minimum required permissions and admin role.

### Required Tables | الجداول المطلوبة

```sql
system_permissions (
  code text primary key,
  name_ar text not null,
  name_en text,
  description text,
  created_at timestamptz not null default now()
)

system_role_permissions (
  role_id uuid not null references role_definitions(id) on delete cascade,
  permission_code text not null references system_permissions(code) on delete cascade,
  primary key (role_id, permission_code)
)
```

Existing `system_users` links `auth.users` to `people`, and existing `person_roles` links `people` to configured roles.

### Required Permission Helper | دالة فحص الصلاحية

Create a stable database function similar to:

```sql
public.has_permission(permission_code text)
```

Expected behavior:

- Finds the current authenticated user using `auth.uid()`.
- Finds the linked `system_users.person_id`.
- Finds active `person_roles`.
- Checks matching `system_role_permissions`.
- Returns `true` or `false`.

### Initial Permissions | الصلاحيات الاولية

Seed these permission codes:

```text
people.read
people.create
people.update
people.archive
memberships.read
memberships.create
memberships.update
memberships.archive
memberships.add_dependent
memberships.separation.request
memberships.separation.admin_approve
memberships.separation.board_approve
memberships.separation.payment_confirm
roles.read
roles.create
roles.update
roles.delete
settings.read
settings.update
audit.read
```

### Initial System Roles | ادوار السيستم الاولية

Seed these system roles:

- `System Admin | مدير النظام`: all permissions
- `Membership Manager | مدير العضويات`: people and membership permissions except role deletion
- `Membership Clerk | موظف العضويات`: read/create limited membership operations
- `Board Reviewer | مراجع مجلس الادارة`: board approval/read permissions

Important: business roles and system permissions stay separate.

مهم: صفة الشخص داخل النادي مختلفة عن صلاحيات السيستم.

### RLS Policy Direction | اتجاه سياسات RLS

Use table-specific policies:

```sql
people:
  SELECT requires people.read
  INSERT requires people.create
  UPDATE requires people.update
  DELETE disabled

memberships:
  SELECT requires memberships.read
  INSERT requires memberships.create
  UPDATE requires memberships.update
  DELETE disabled

membership_members:
  SELECT requires memberships.read
  INSERT requires memberships.add_dependent
  UPDATE requires memberships.update
  DELETE disabled

role_definitions / role_fields / person_roles:
  SELECT requires roles.read
  INSERT requires roles.create or roles.update depending on table
  UPDATE requires roles.update
  DELETE requires roles.delete, but only if no operational history depends on the role

system_settings:
  SELECT requires settings.read
  UPDATE/UPSERT requires settings.update
```

## Phase 2: No Hard Deletes | ممنوع الحذف النهائي

### Current Problem | المشكلة الحالية

Membership and dependent screens currently perform hard deletes.

الشاشات الحالية فيها حذف نهائي للعضوية او التابع.

This conflicts with the confirmed rule:

- Visitors are permanent.
- Membership numbers are never reused.
- Old dependent numbers stay in history.
- Separation/conversion needs approval and payment.

### Required Update | المطلوب

Antigravity must remove user-facing hard delete actions for operational records.

Replace:

- Delete membership | حذف عضوية
- Delete dependent | حذف تابع

With:

- Archive membership | ارشفة العضوية
- Cancel membership | الغاء العضوية
- Request dependent separation | طلب فصل تابع
- Suspend card/access | ايقاف الكارنيه او الدخول

### Schema Direction | اتجاه قاعدة البيانات

Add status/history fields where missing:

```sql
memberships:
  archived_at timestamptz
  archived_by uuid
  archive_reason text

membership_members:
  status text not null default 'active'
  ended_at timestamptz
  ended_by uuid
  end_reason text
```

Use constraints or enums later, but do not allow actual `DELETE` through the app.

## Phase 3: Membership Number Registry | سجل ارقام العضوية

### Required Rule | القاعدة المطلوبة

All membership numbers are globally unique across all types.

كل ارقام العضوية ممنوع تتكرر بين كل انواع العضويات.

Examples:

- `1123`
- `1123-1`
- `1123-2`
- sports membership numbers
- seasonal membership numbers

No number can be reused after cancellation, correction, separation, or archive.

لا يتم اعادة استخدام اي رقم بعد الالغاء او التصحيح او الفصل او الارشفة.

### Required Tables | الجداول المطلوبة

```sql
membership_number_registry (
  id uuid primary key default gen_random_uuid(),
  membership_number text not null unique,
  number_type text not null,
  person_id uuid references people(id) on delete restrict,
  membership_id uuid references memberships(id) on delete restrict,
  membership_member_id uuid references membership_members(id) on delete restrict,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  reason text
)

membership_number_sequences (
  id uuid primary key default gen_random_uuid(),
  base_membership_number text not null unique,
  next_dependent_suffix integer not null default 1,
  updated_at timestamptz not null default now()
)
```

### Required Behavior | السلوك المطلوب

When creating a working membership:

- User enters membership number manually.
- System checks global uniqueness in `membership_number_registry`.
- System registers the number as current.

When adding a dependent:

- System reads the main membership number.
- System gets the next suffix from `membership_number_sequences`.
- System assigns `1123-1`, `1123-2`, etc.
- System registers the dependent number in `membership_number_registry`.

When correcting a working member number:

- Old number remains in registry/history with `is_current = false`.
- New number is inserted if globally unique.
- Existing dependent numbers are ended in history.
- New dependent numbers are generated from the corrected base number.

## Phase 4: Separation and Conversion Workflow | دورة فصل وتحويل التابع

### Required Tables | الجداول المطلوبة

```sql
membership_separation_requests (
  id uuid primary key default gen_random_uuid(),
  membership_member_id uuid not null references membership_members(id) on delete restrict,
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
  new_working_membership_id uuid references memberships(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### Required Status Flow | حالات الطلب

```text
draft
admin_approved
board_approved
payment_confirmed
completed
rejected
cancelled
```

### Required Business Rule | قاعدة العمل

Dependent separation/conversion is completed only after:

1. Admin approval | موافقة ادارية
2. Board approval | موافقة مجلس الادارة
3. Payment confirmation | تأكيد السداد
4. New working membership number assignment | تعيين رقم عضو عامل جديد

## Phase 5: Transactional Writes | عمليات حفظ آمنة

### Current Problem | المشكلة الحالية

Some actions create person, membership, and membership link in separate steps from the app.

بعض العمليات تنشئ الشخص ثم العضوية ثم الربط في خطوات منفصلة من التطبيق.

If one step fails, partial data may remain.

لو خطوة فشلت ممكن تفضل بيانات ناقصة.

### Required Update | المطلوب

Move critical operations into Postgres functions/RPCs:

```text
create_working_membership(...)
add_dependent_to_membership(...)
correct_membership_number(...)
request_dependent_separation(...)
complete_dependent_conversion(...)
```

Each function must:

- Validate permission using `has_permission(...)`.
- Validate National ID.
- Validate global membership number uniqueness.
- Insert all required records inside one transaction.
- Write audit logs.
- Return a clear result payload.

## Phase 6: Audit Logging | سجل العمليات

### Required Table | الجدول المطلوب

```sql
audit_logs (
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
)
```

### Must Log | يجب تسجيل

- Person created/updated | انشاء او تعديل شخص
- Membership created/updated/archived | انشاء او تعديل او ارشفة عضوية
- Dependent added/ended/separated | اضافة او انهاء او فصل تابع
- Membership number corrected | تصحيح رقم عضوية
- Permissions changed | تغيير صلاحيات
- Settings changed | تغيير اعدادات
- Login/admin sensitive actions where possible | الدخول والعمليات الحساسة قدر الامكان

## Phase 7: Build and Lint Fixes | اصلاح البناء واللينت

Antigravity must fix these before continuing:

- Replace Google Font dependency with local font or CSS fallback so build does not require network | استبدال Google Font حتى لا يعتمد البناء على الانترنت
- Convert `types/database.ts` to UTF-8 | تحويل الملف الى UTF-8
- Remove broad `any` usage or define shared action state types | تقليل any وتعريف انواع للفورم
- Remove `Date.now()` from React render in `CreateFieldForm` | منع Date.now داخل render
- Standardize seasonal settings data shape | توحيد شكل بيانات الفترات الموسمية
- Update relationship enum and UI to include father/mother | اضافة اب وام

## Phase 8: UI Changes Required | تحديثات الواجهة المطلوبة

### Memberships List | قائمة العضويات

- Replace delete icon with archive/cancel action | استبدال الحذف بارشفة او الغاء
- Show status clearly | اظهار الحالة بوضوح
- Show membership number history link later | رابط تاريخ ارقام العضوية لاحقا

### Membership Family Page | صفحة عائلة العضوية

- Show each dependent membership number | اظهار رقم عضوية كل تابع
- Show relationship including father/mother | اظهار الصلة وتشمل اب وام
- Replace delete dependent with separation request | استبدال حذف التابع بطلب فصل
- Show card/access status separately from membership status | فصل حالة الكارنيه عن حالة العضوية

### Add Dependent Form | فورم اضافة تابع

- Include father/mother | اضافة اب وام
- Auto-generate dependent membership number preview before submit | عرض رقم التابع المتوقع قبل الحفظ
- Make phone optional for dependent unless configured otherwise | الموبايل اختياري للتابع الا اذا تم ضبطه غير ذلك
- Keep National ID required | الرقم القومي اجباري

## Antigravity Rules | قواعد Antigravity

- Do not create new modules until this file is handled | لا تضيف موديولات جديدة قبل تنفيذ هذا الملف
- Do not add hard delete for operational records | ممنوع الحذف النهائي للبيانات التشغيلية
- Do not use `Allow all authenticated users full access` policies | ممنوع سياسات فتح كل شيء للمستخدمين المسجلين
- Do not bypass RLS from application code | ممنوع تجاوز RLS من كود التطبيق
- Do not use service role key in browser/client code | ممنوع استخدام service role في المتصفح
- Keep National ID unique and required | الرقم القومي اجباري ولا يتكرر
- Use UUID foreign keys internally | العلاقات الداخلية تستخدم UUID
- Every sensitive write must check permission and write audit log | كل عملية حساسة تفحص الصلاحية وتسجل audit log

