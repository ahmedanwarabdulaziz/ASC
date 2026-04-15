# Architecture, Performance, and NFC Readiness | المعمارية والسرعة والاستعداد للـ NFC

## Goal | الهدف

Design the system so it is fast enough for daily club operations, secure enough for member data, and ready for future NFC gate integrations and mobile apps.

تصميم سيستم سريع وآمن وجاهز للربط مع كروت NFC وبوابات الدخول وتطبيق الموبايل.

## Proposed Stack | التقنيات المقترحة

- Frontend: Next.js on Vercel | الواجهة على Vercel
- Backend/Data: Supabase Postgres | قاعدة البيانات Supabase Postgres
- Auth: Supabase Auth with role/permission tables | تسجيل الدخول والصلاحيات
- Storage: Supabase Storage for images/documents | تخزين الصور والمستندات
- Realtime where useful, not everywhere | استخدام الريل تايم عند الحاجة فقط

## Performance Principles | مبادئ السرعة

- Keep operational screens data-light and indexed | شاشات التشغيل تكون خفيفة ومفهرسة
- Avoid loading full member histories in list screens | عدم تحميل تاريخ العضو بالكامل في القوائم
- Use search indexes for member number, phone, national ID, and name | فهارس للبحث السريع
- Cache public website pages when content is published | كاش للموقع العام
- Separate public website traffic from internal operational queries | فصل ضغط الموقع العام عن عمليات الادارة قدر الامكان

## Identity Architecture | معمارية الهوية

Use internal UUIDs for database relationships, while treating `National ID | الرقم القومي` as the main operational person identifier used by club staff.

نستخدم UUID داخلي لعلاقات قاعدة البيانات، لكن الرقم القومي هو الرقم الاساسي الذي يتعامل به موظفو النادي مع الشخص.

Rules:

- Every person row has an internal immutable UUID | كل شخص له UUID داخلي لا يتغير
- National ID is required and unique for every person | الرقم القومي اجباري ولا يتكرر لكل شخص
- Foreign keys should use internal UUIDs, not National ID | العلاقات بين الجداول تستخدم UUID وليس الرقم القومي
- Operational search starts with National ID | البحث التشغيلي يبدأ بالرقم القومي
- Membership numbers remain separate identifiers and must be globally unique | ارقام العضوية معرفات منفصلة ولا تتكرر بين كل انواع العضويات

This keeps the database stable while matching the way the club works day to day.

ده يحافظ على ثبات قاعدة البيانات وفي نفس الوقت يخلي التشغيل اليومي مبني على الرقم القومي.

## Security Principles | مبادئ الامان

- Row Level Security policies in Supabase | سياسات RLS
- Permission checks in both UI and database/backend functions | فحص صلاحيات في الواجهة وقاعدة البيانات
- Audit logs for sensitive actions | سجل عمليات للحركات الحساسة
- No direct public access to private documents | منع الوصول العام للمستندات الخاصة
- Least privilege for admin roles | اقل صلاحيات ممكنة لكل دور
- No permissive `Allow all authenticated users full access` policies, even during early implementation | ممنوع سياسات فتح كل شيء للمستخدمين المسجلين حتى في بداية التنفيذ
- No hard deletes for operational records such as people, memberships, dependents, visitors, payments, or NFC events | ممنوع الحذف النهائي للبيانات التشغيلية مثل الاشخاص والعضويات والتابعين والزوار والمدفوعات وحركات الدخول
- Sensitive writes must be transactional and audited | العمليات الحساسة تكون داخل transaction ومعها audit log

## RLS From Day One | RLS من اول لحظة

The system must not rely on temporary open RLS policies. Development should use real permissions from the start, even if the initial permission set is small.

السيستم لا يعتمد على RLS مفتوح مؤقت. التطوير يبدأ بصلاحيات حقيقية حتى لو مجموعة الصلاحيات في البداية صغيرة.

Required direction:

- Define permission codes in the database | تعريف اكواد الصلاحيات في قاعدة البيانات
- Link system roles to permissions | ربط ادوار السيستم بالصلاحيات
- Link auth users to people through `system_users` | ربط مستخدمي الدخول بالاشخاص
- Check permissions in RLS using a database helper like `has_permission(permission_code)` | فحص الصلاحيات في RLS بدالة قاعدة بيانات
- Disable database deletes for operational tables | منع حذف جداول التشغيل
- Use archive/cancel/end status instead of delete | استخدام ارشفة او الغاء او انهاء بدلا من الحذف

## Phase 1: Base Architecture | التأسيس

- Create Next.js app | انشاء التطبيق
- Connect Supabase project | ربط Supabase
- Environment configuration | اعداد متغيرات البيئة
- Basic auth routes | صفحات الدخول
- Database migrations strategy | استراتيجية تحديث قاعدة البيانات

## Phase 2: Role-Based Access Control | الصلاحيات

- Define system permissions | تعريف صلاحيات النظام
- Group permissions into roles | تجميع الصلاحيات في ادوار
- Assign roles to users | اسناد الادوار للمستخدمين
- Add audit log for permission changes | سجل تغيير الصلاحيات

## Phase 3: Fast Search and Operations | البحث والتشغيل السريع

- Member/person quick search | بحث سريع عن الاشخاص
- Indexed identifiers | فهرسة الارقام المهمة
- Pagination and server-side filtering | تقسيم النتائج وفلترة من السيرفر
- Lightweight dashboard queries | استعلامات خفيفة للداشبورد

## Phase 4: NFC and Gates | كروت NFC والبوابات

NFC gates should not depend on slow website pages. Gate access must be handled by a fast, narrow API or edge function.

البوابات لا يجب ان تعتمد على صفحات الموقع. تحتاج API سريع ومحدد.

Suggested gate flow:

1. Gate reads card UID | البوابة تقرأ رقم الكارت
2. Gate sends UID to access API | ترسل الرقم للـ API
3. API checks active card, person, roles, subscriptions, and restrictions | فحص الكارت والشخص والصلاحيات
4. API returns allow/deny plus reason | سماح او رفض مع السبب
5. Entry event is logged | تسجيل حركة الدخول

Important tables:

- `access_cards`
- `access_rules`
- `entry_events`
- `gate_devices`
- `gate_device_keys`

## Phase 5: Mobile App Readiness | جاهزية تطبيق الموبايل

- Keep business logic in reusable APIs/functions | منطق العمل في APIs قابلة للاستخدام
- Avoid web-only assumptions in core data model | عدم ربط الداتا بالموقع فقط
- Prepare member self-service endpoints | تجهيز خدمات العضو
- Push notification strategy later | اشعارات لاحقا

## Operational Risk Areas | نقاط تحتاج اهتمام

- Duplicate people records | تكرار بيانات الاشخاص
- Permission mistakes | اخطاء الصلاحيات
- Slow member search during peak hours | بطء البحث وقت الضغط
- NFC gate downtime | توقف البوابات
- Media uploads becoming too large | تضخم الصور والملفات

## Open Decisions | قرارات مفتوحة

- Will NFC gates need offline mode if internet is down?
- Will payments be online, offline cashier-based, or both?
- Should internal staff use one shared device login or individual accounts only?
- What data must be visible to board members?
