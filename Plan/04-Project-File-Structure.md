# Project File Structure | تنظيم ملفات المشروع

## Goal | الهدف

Define a clear codebase structure for Antigravity and future developers so the project grows in an organized way.

تحديد شكل منظم لملفات البرنامج عشان Antigravity واي مطور بعد كده يشتغلوا بنفس النظام.

## Main Direction | الاتجاه العام

Start with one Next.js web application, deployed on Vercel, connected to Supabase. Keep the structure ready for a future mobile app without making the first phase too complex.

نبدأ بتطبيق Next.js واحد على Vercel مربوط بـ Supabase، مع تنظيم يسمح باضافة تطبيق موبايل مستقبلا بدون تعقيد البداية.

## Recommended Root Structure | هيكل الملفات الرئيسي

```text
AssiutSC/
  Plan/
  app/
  components/
  features/
  lib/
  server/
  supabase/
  types/
  config/
  public/
  docs/
  package.json
  next.config.ts
  middleware.ts
  .env.example
  README.md
```

## Folder Responsibilities | مسؤولية كل فولدر

### `Plan/`

Planning files and product decisions.

ملفات الخطة وقرارات المنتج.

Rules:

- Each file should describe one main task | كل ملف يشرح مهمة رئيسية واحدة
- Keep confirmed decisions separate from open questions | فصل القرارات المؤكدة عن الاسئلة المفتوحة
- Update plan before major structural changes | تحديث الخطة قبل التغييرات الكبيرة

### `app/`

Next.js App Router pages and route layouts.

صفحات ومسارات Next.js.

Suggested structure:

```text
app/
  layout.tsx
  page.tsx
  globals.css
  auth/
    login/
      page.tsx
  system/
    layout.tsx
    page.tsx
    people/
      page.tsx
      new/
        page.tsx
      [personId]/
        page.tsx
    memberships/
      page.tsx
    roles/
      page.tsx
    settings/
      page.tsx
```

Rules:

- `app/page.tsx` starts as the simple public entry page | الصفحة الرئيسية تبدأ كصفحة بسيطة لدخول السيستم
- Internal system pages live under `app/system/` | صفحات السيستم الداخلية تحت system
- Page files should stay thin and call feature components/actions | ملفات الصفحات تكون خفيفة وتستدعي components/actions

### `components/`

Reusable UI components that are not tied to one business module.

مكونات واجهة عامة قابلة لاعادة الاستخدام.

Suggested structure:

```text
components/
  ui/
  layout/
  forms/
  tables/
  feedback/
```

Examples:

- Button | زر
- Input | خانة ادخال
- Modal | نافذة
- Data table | جدول بيانات
- App sidebar | القائمة الجانبية

Rules:

- No business rules inside generic UI components | ممنوع وضع قواعد العمل داخل مكونات UI العامة
- Arabic labels should be passed from the feature/page | النصوص العربية تأتي من الصفحة او الموديول

### `features/`

Business modules. Each module owns its screens, forms, validation, actions, and queries.

موديولات العمل الاساسية. كل موديول يحتوي مكوناته وفورمه وقواعده واستعلاماته.

Suggested structure:

```text
features/
  people/
    components/
    forms/
    actions/
    queries/
    validation/
    types.ts
  memberships/
    components/
    forms/
    actions/
    queries/
    validation/
    types.ts
  roles/
    components/
    forms/
    actions/
    queries/
    validation/
    types.ts
  access-control/
    components/
    actions/
    queries/
    types.ts
```

Initial modules:

- `people` | الاشخاص
- `memberships` | العضويات
- `roles` | الادوار
- `access-control` | صلاحيات الدخول والكروت
- `website-content` later | محتوى الموقع لاحقا

Rules:

- Put business-specific UI inside its feature folder | واجهة الموديول تبقى داخل فولدر الموديول
- Put database reads in `queries/` | استعلامات القراءة داخل queries
- Put writes/mutations in `actions/` | عمليات الحفظ والتعديل داخل actions
- Put form validation in `validation/` | التحقق من الفورم داخل validation

### `lib/`

Shared helpers and clients.

ادوات مشتركة ومساعدات عامة.

Suggested structure:

```text
lib/
  supabase/
    client.ts
    server.ts
    admin.ts
  auth/
    permissions.ts
    session.ts
  utils/
    dates.ts
    strings.ts
    ids.ts
  constants/
    routes.ts
    permissions.ts
```

Rules:

- `lib/supabase/client.ts` for browser-safe Supabase client | عميل Supabase للمتصفح
- `lib/supabase/server.ts` for server-side session-aware client | عميل Supabase للسيرفر مع السيشن
- `lib/supabase/admin.ts` only for privileged server code | عميل اداري للسيرفر فقط
- Never import admin Supabase client into client components | ممنوع استخدام admin client داخل مكونات المتصفح

### `server/`

Server-only business services that should not run in the browser.

خدمات السيرفر فقط.

Suggested structure:

```text
server/
  permissions/
    require-permission.ts
  audit/
    log-action.ts
  membership-numbers/
    generate-dependent-number.ts
    validate-unique-membership-number.ts
  identity/
    find-person-by-national-id.ts
```

Rules:

- Sensitive logic goes here | المنطق الحساس يوضع هنا
- Permission checks should happen before database writes | فحص الصلاحيات قبل الحفظ
- Audit important actions | تسجيل العمليات المهمة

### `supabase/`

Database schema, migrations, seed data, and Supabase configuration.

ملفات قاعدة البيانات و Supabase.

Suggested structure:

```text
supabase/
  migrations/
  seed/
  policies/
  functions/
```

Rules:

- Every database change should be a migration | كل تعديل قاعدة بيانات يكون migration
- RLS policies should be documented and versioned | سياسات RLS تكون موثقة وموجودة في الملفات
- Seed only safe test/default data | seed يكون لبيانات آمنة وتجريبية فقط

### `types/`

Shared TypeScript types.

انواع TypeScript المشتركة.

Suggested structure:

```text
types/
  database.ts
  permissions.ts
  navigation.ts
```

Rules:

- Generated Supabase database types go in `types/database.ts` | انواع Supabase المولدة توضع هنا
- Feature-specific types stay inside feature folders | الانواع الخاصة بموديول معين تبقى داخل فولدره

### `config/`

Configuration that describes app behavior.

اعدادات تصف سلوك التطبيق.

Suggested structure:

```text
config/
  app.ts
  navigation.ts
  modules.ts
  default-roles.ts
```

Rules:

- Static app configuration goes here | الاعدادات الثابتة هنا
- Editable business rules should live in the database, not config files | قواعد العمل القابلة للتعديل تكون في قاعدة البيانات وليس ملفات config

### `public/`

Static assets served publicly.

ملفات عامة مثل الصور والايقونات.

Suggested structure:

```text
public/
  images/
  icons/
  brand/
```

Rules:

- Public assets only | ملفات عامة فقط
- Private documents must use Supabase Storage with access rules | المستندات الخاصة في Supabase Storage بصلاحيات

### `docs/`

Technical documentation after implementation starts.

توثيق تقني بعد بداية التنفيذ.

Suggested structure:

```text
docs/
  database.md
  deployment.md
  permissions.md
  nfc-gates.md
```

## Naming Rules | قواعد التسمية

- Folders and files use English kebab-case | اسماء الملفات والفولدرات بالانجليزي kebab-case
- Database tables use English snake_case | جداول قاعدة البيانات بالانجليزي snake_case
- UI labels are Arabic-first with English helper labels where useful | واجهة المستخدم عربي اولا ومعها انجليزي عند الحاجة
- Avoid mixing Arabic in code identifiers | لا نستخدم العربي في اسماء المتغيرات والكود

Examples:

- `people` not `اشخاص`
- `membership_number_history` not `membershipNumberHistory`
- `dependent-conversion-rules.ts` not `DependentConversionRules.ts`

## First Implementation Structure | هيكل اول تنفيذ

For the first build, Antigravity should create only what is needed:

في البداية يتم انشاء المطلوب فقط:

```text
app/
  layout.tsx
  page.tsx
  auth/
    login/
      page.tsx
  system/
    layout.tsx
    page.tsx
    people/
      page.tsx

features/
  people/
    components/
    forms/
    actions/
    queries/
    validation/
    types.ts

lib/
  supabase/
    client.ts
    server.ts
  auth/
    permissions.ts

server/
  audit/
  identity/

supabase/
  migrations/

types/
  database.ts
```

## Antigravity Working Rules | قواعد عمل Antigravity

- Read `Plan/00-Project-Roadmap.md` first | قراءة الخريطة العامة اولا
- For people/memberships work, read `Plan/02-People-Memberships-And-Roles.md` | عند العمل على الاشخاص والعضويات اقرأ ملفهم
- For architecture decisions, read `Plan/03-Architecture-Performance-And-NFC.md` | عند قرارات المعمارية اقرأ ملفها
- Before adding new modules, read `Plan/05-Antigravity-Security-And-Integrity-Updates.md` | قبل اضافة موديولات جديدة اقرأ ملف تحديثات الامان وسلامة البيانات
- Follow this file structure unless a plan file is updated first | الالتزام بهذا التنظيم الا اذا تم تحديث الخطة
- Do not put database writes directly inside UI components | لا تضع عمليات الحفظ داخل مكونات الواجهة مباشرة
- Do not duplicate person records for different roles | لا تكرر الشخص بسبب اختلاف الادوار
- Use National ID as the operational identity and UUID for relations | الرقم القومي للتشغيل و UUID للعلاقات
- Keep sensitive operations server-side | العمليات الحساسة على السيرفر
- Add audit logging for important changes | اضافة سجل عمليات للتغييرات المهمة
- Do not use permissive RLS policies for all authenticated users | لا تستخدم سياسات RLS مفتوحة لكل المستخدمين المسجلين
- Do not hard-delete operational records | لا تحذف البيانات التشغيلية حذف نهائي

## Future Mobile App Structure | هيكل تطبيق الموبايل لاحقا

When the mobile app starts, consider moving to a workspace structure:

عند بدء تطبيق الموبايل، يمكن التحول لهيكل workspace:

```text
apps/
  web/
  mobile/
packages/
  shared/
  database/
  ui/
```

Do not start with this structure unless the mobile app phase begins or the project becomes too large.

لا نبدأ بهذا التعقيد الان الا عند بداية مرحلة تطبيق الموبايل او كبر حجم المشروع.
