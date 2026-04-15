# People, Memberships, and Roles | الاشخاص والعضويات والادوار

## Goal | الهدف

Build the people foundation correctly because every future module depends on it: memberships, employees, coaches, board members, visitors, players, bookings, payments, NFC cards, and gate access.

تأسيس الاشخاص بشكل صحيح لان كل السيستم مبني عليه.

## Core Concept | الفكرة الاساسية

One real person can have many roles at the same time.

الشخص الواحد ممكن يكون له اكثر من صفة في نفس الوقت.

Example:

- Working member | عضو عامل
- Employee | موظف
- Coach | مدرب
- Board member | عضو مجلس ادارة

Therefore, we should not create separate person records for each role. We create one `Person` profile, then attach roles, memberships, employment records, sports profiles, and access permissions.

The main operational identifier for a real person is `National ID | الرقم القومي`, because every person, including children, has one. The database can still keep an internal technical ID/code, but daily search, duplicate prevention, and identity matching should depend primarily on the National ID.

الرقم الاساسي في التعامل مع الشخص هو الرقم القومي، لان حتى الاطفال لهم رقم قومي. السيستم ممكن يحتفظ بكود داخلي تقني، لكن البحث ومنع التكرار وربط الهوية يعتمد اساسا على الرقم القومي.

## Main Person Types | انواع الاشخاص

### Working Member | عضو عامل

A general assembly member with voting rights.

عضو جمعية عمومية له حق التصويت.

Key fields:

- Membership number | رقم العضوية
- Voting eligibility | اهلية التصويت
- Membership status | حالة العضوية
- Family links | روابط العائلة

### Dependent Member | عضو تابع

Spouse or child connected to a working member. A child may later become a working member if conditions are met.

زوج/زوجة او ابن تابع للعضو العامل، وقد يتحول مستقبلا لعضو عامل.

Key fields:

- Main member relation | العلاقة بالعضو الرئيسي
- Supported relations: wife, husband, son, daughter, father, mother | صلات القرابة المدعومة: زوجة، زوج، ابن، ابنة، اب، ام
- Legal age check | شرط السن القانوني
- Membership duration check | شرط مدة العضوية
- Relation-based separation rules | قواعد الفصل حسب صلة القرابة
- Conversion eligibility | اهلية التحويل لعضو عامل

### Sports Membership | عضوية رياضية

For non-club members who join sports activities.

عضوية للاعبين غير الاعضاء لممارسة النشاط الرياضي داخل النادي.

Key fields:

- Sport/activity | اللعبة او النشاط
- Subscription status | حالة الاشتراك
- Medical/guardian data where needed | بيانات طبية او ولي الامر عند الحاجة

### Employee | موظف

Club staff member.

موظف داخل النادي.

Key fields:

- Department | الادارة
- Job title | المسمى الوظيفي
- Employment status | حالة العمل
- Internal permissions | صلاحيات داخلية

### Coach | مدرب

Sports coach, possibly also an employee or member.

مدرب وقد يكون في نفس الوقت موظف او عضو.

Key fields:

- Sports coached | الالعاب التي يدربها
- Teams/groups | الفرق او المجموعات
- Schedule | المواعيد

### Board Member | عضو مجلس ادارة

Club board member.

عضو مجلس ادارة النادي.

Key fields:

- Board position | المنصب
- Term dates | مدة المجلس
- Public website visibility | الظهور في الموقع

### Visitor | زائر

Temporary access person: garden ticket, court booking, pool open period, event, or guest pass.

شخص له دخول مؤقت بتذكرة او حجز او فترة حرة او ضيافة.

Key fields:

- Visit type | نوع الزيارة
- National ID | الرقم القومي
- Phone number | رقم الموبايل
- Validity window | فترة السماح
- Entry permissions | صلاحيات الدخول
- Permanent visitor record | تسجيل دائم للزائر

## Phase 1: Person Registry | سجل الاشخاص

- Create unified person profile | ملف شخص واحد موحد
- Mandatory National ID for every person type | الرقم القومي اجباري لكل انواع الاشخاص
- Phone and contact data | بيانات التواصل
- Emergency contact | تواصل طوارئ
- Family relationships | العلاقات العائلية
- Document attachments | مرفقات ومستندات
- Generated internal person code | كود داخلي خاص بالسيستم

### Identity Rules | قواعد الهوية

- National ID is the main operational person number | الرقم القومي هو الرقم الاساسي للتعامل مع الشخص
- Every person must have a National ID | كل شخص لازم يكون له رقم قومي
- National ID should be unique to prevent duplicate people | الرقم القومي لا يتكرر لمنع تكرار الاشخاص
- Phone number is mandatory for visitors | رقم الموبايل اجباري للزوار
- The system generates its own internal code for each person | السيستم ينشئ كود داخلي لكل شخص
- Internal code never changes even if roles or memberships change | الكود الداخلي لا يتغير حتى لو الادوار او العضويات اتغيرت
- Database records should still use an internal ID for relationships | علاقات قاعدة البيانات تستخدم ID داخلي للحماية والمرونة

Recommended behavior:

- Search person by National ID first | البحث عن الشخص بالرقم القومي اولا
- Block creating another person with the same National ID | منع انشاء شخص اخر بنفس الرقم القومي
- Use National ID for children as well as adults | استخدام الرقم القومي للاطفال والكبار
- Keep internal ID/code hidden from normal users unless needed | اخفاء الكود الداخلي عن المستخدم العادي الا عند الحاجة

## Phase 2: Role Assignment | اسناد الادوار

- Multiple roles per person | اكثر من دور للشخص
- Role start/end dates | تاريخ بداية ونهاية الدور
- Active/inactive status | نشط او غير نشط
- Role-specific fields | بيانات خاصة بكل دور

Each role must be configurable from the system. When an admin creates or edits a role, they should be able to define what data is required before that role can be assigned to a person.

كل دور لازم نقدر نجهزه من السيستم ونحدد البيانات المطلوبة قبل اسناده لشخص.

Example:

To assign `Coach | مدرب`, the system may require:

- Sport | اللعبة
- Coach level/category | درجة او تصنيف المدرب
- Assigned teams/groups | الفرق او المجموعات
- Contract/employment relation if needed | علاقة التعاقد او العمل عند الحاجة
- Public website visibility | الظهور في الموقع العام

Then the sports module can use that data later to build schedules, groups, subscriptions, attendance, and public sport pages.

بعد كده موديول الالعاب يقدر يستخدم بيانات المدرب لتحديد المواعيد والمجموعات والاشتراكات والحضور والظهور في الموقع.

### Role Definition | تعريف الدور

The system should have a `Role Definition | تعريف الدور` screen where authorized admins can configure:

- Role Arabic name | اسم الدور بالعربي
- Role English name | اسم الدور بالانجليزي
- Role code | كود الدور
- Role category | تصنيف الدور
- Required fields | الحقول المطلوبة
- Optional fields | الحقول الاختيارية
- Validation rules | قواعد التحقق
- Related modules | الموديولات المرتبطة
- Whether the role grants system login by default | هل الدور يسمح بدخول السيستم افتراضيا
- Whether the role can appear on the public website | هل يمكن ظهوره في الموقع العام

### Role Field Types | انواع حقول الدور

Role fields should support common types:

- Text | نص
- Number | رقم
- Date | تاريخ
- Boolean yes/no | نعم او لا
- Select list | قائمة اختيارات
- Multi-select list | قائمة متعددة
- Link to sport/activity | ربط بلعبة او نشاط
- Link to department | ربط بادارة
- Link to person | ربط بشخص
- File/document upload | رفع مستند

### Assignment Flow | خطوات اسناد الدور

1. Search or create the person | البحث عن الشخص او انشاؤه
2. Choose role | اختيار الدور
3. System loads required fields for that role | السيستم يعرض الحقول المطلوبة للدور
4. User fills role-specific data | ادخال بيانات الدور
5. System validates required data | التحقق من البيانات المطلوبة
6. Role becomes active after save or approval | تفعيل الدور بعد الحفظ او الاعتماد

### Suggested Tables | جداول مقترحة

- `role_definitions` for configurable role types | تعريفات الادوار
- `role_fields` for required and optional fields | حقول كل دور
- `person_roles` for assigned roles | الادوار المسندة للاشخاص
- `person_role_values` for custom field values | قيم حقول الدور

For high-importance roles such as working member, employee, coach, and visitor, we may still create dedicated profile tables when the data becomes operationally heavy.

للادوار المهمة مثل عضو عامل او موظف او مدرب او زائر، ممكن نعمل جداول متخصصة بجانب الحقول العامة عندما تزيد تفاصيل التشغيل.

## Phase 3: Permission Model | نموذج الصلاحيات

Separate business identity from system permissions.

نفصل بين صفة الشخص في النادي وبين صلاحياته داخل السيستم.

Example:

- A coach can have no admin login.
- A media officer can be an employee with website content permissions.
- A board member may have read-only dashboards.

## Phase 4: Membership Lifecycle | دورة حياة العضوية

- New member registration | تسجيل عضو جديد
- Dependent conversion to working member | تحويل تابع الى عضو عامل
- Suspension/freezing | ايقاف او تجميد
- Renewal and dues | التجديد والاشتراكات
- Historical archive | الارشيف التاريخي

### Configurable Dependent Conversion Rules | قواعد تحويل التابع القابلة للتعديل

Dependent conversion must not be hard-coded. Admins should be able to define rules from the system.

تحويل العضو التابع لا يكون ثابت في الكود. لازم الادارة تقدر تحدد القواعد من السيستم.

Rule conditions may include:

- Relation type | صلة القرابة
- Supported relation types: wife, husband, son, daughter, father, mother | صلات القرابة المدعومة: زوجة، زوج، ابن، ابنة، اب، ام
- Age threshold | الوصول لسن معين
- Membership duration | مدة معينة منذ بداية العضوية كتابع
- Main member status | حالة العضو الرئيسي
- Required fees or approvals | الرسوم او الموافقات المطلوبة
- Separation allowed or not allowed | هل الفصل مسموح او غير مسموح

Examples:

- Child dependent can become working member after reaching a configured age | الابن ممكن يتحول لعضو عامل عند الوصول لسن محدد
- Dependent can become working member after 2 years as dependent | التابع ممكن يتحول بعد سنتين من كونه تابع
- Spouse, child, mother, and father can each have different rules | الزوجة والابن والام والاب ممكن يكون لكل واحد قواعد مختلفة
- Some relation types may never have separation rights | بعض صلات القرابة ممكن لا يكون لها حق الفصل نهائي

### Dependent Separation Workflow | دورة فصل التابع

When a dependent requests separation or conversion to working member, the process requires all of the following:

عند طلب فصل التابع او تحويله لعضو عامل، العملية تحتاج كل ما يلي:

- Admin approval | موافقة ادارية
- Board approval | موافقة مجلس الادارة
- Required payment | سداد الرسوم المطلوبة
- Final activation after approvals and payment | التفعيل النهائي بعد الموافقات والسداد

### Membership Numbers | ارقام العضوية

The system should generate its own internal codes, but club membership numbers are entered by authorized users and must be globally unique across all membership types.

السيستم ينشئ اكواد داخلية خاصة به، لكن رقم العضوية ورقم العضوية الرياضية يتم ادخالهم من المستخدمين المصرح لهم وممنوع تكرارهم في اي نوع عضوية.

Rules:

- Internal person code is generated by the system | كود الشخص الداخلي ينشئه السيستم
- Membership numbers are globally unique across all types | ارقام العضوية لا تتكرر بين كل انواع العضويات
- Working membership number is manually entered and globally unique | رقم العضو العامل يتم ادخاله ولا يتكرر نهائيا
- Sports membership number is manually entered and globally unique | رقم العضوية الرياضية يتم ادخاله ولا يتكرر نهائيا
- Dependent membership number is based on the working member number | رقم العضو التابع مبني على رقم العضو العامل
- Dependent suffix increments automatically | رقم التابع يزيد تلقائيا

Example:

- Working member number: `1123` | رقم العضو العامل
- First dependent: `1123-1` | اول تابع
- Second dependent: `1123-2` | ثاني تابع

If a dependent separates and becomes a working member:

- Keep old dependent number in history | نحتفظ برقم التابع القديم في التاريخ
- Assign a new working membership number | يتم اعطاؤه رقم عضوية عامل جديد
- Keep the link to the original family membership | نحتفظ بالربط مع عضوية العائلة الاصلية
- Do not reuse the old dependent number | لا يتم اعادة استخدام رقم التابع القديم

If a working member number was entered incorrectly and later corrected:

- Keep the old number in history | نحتفظ بالرقم القديم في التاريخ
- Generate new dependent numbers from the corrected working member number | يتم توليد ارقام تابعين جديدة من رقم العضو العامل بعد التصحيح
- Keep old dependent numbers in history | نحتفظ بارقام التابعين القديمة في التاريخ
- Do not overwrite historical membership numbers | لا يتم تعديل التاريخ او مسح الارقام القديمة

### Suggested Membership Rule Tables | جداول مقترحة لقواعد العضوية

- `membership_number_sequences` for dependent suffix tracking | تتبع تسلسل ارقام التابعين
- `dependent_conversion_rules` for configurable conversion conditions | قواعد تحويل التابعين
- `membership_number_history` for old numbers and changes | تاريخ ارقام العضوية
- `membership_separation_requests` for conversion/separation workflow | طلبات الفصل والتحويل

## Phase 5: NFC Identity Readiness | جاهزية كروت NFC

- One person can have multiple cards over time | الشخص قد يكون له اكثر من كارت عبر الزمن
- Lost/replaced card handling | كارت مفقود او مستبدل
- Card status | حالة الكارت
- Gate access rules derived from active roles/subscriptions | صلاحيات الدخول من الادوار والاشتراكات النشطة

## Initial Data Model Direction | اتجاه تصميم البيانات

- `people` for real human identity | الاشخاص
- `person_roles` for role assignments | ادوار الشخص
- `memberships` for club memberships | العضويات
- `membership_number_history` for membership number changes | تاريخ ارقام العضوية
- `dependent_conversion_rules` for configurable dependent conversion | قواعد تحويل التابعين
- `family_links` for relationships | العلاقات العائلية
- `staff_profiles` for employee details | بيانات الموظفين
- `coach_profiles` for coach details | بيانات المدربين
- `visitor_passes` for temporary access | تصاريح الزوار
- `access_cards` for NFC cards | كروت الدخول
- `system_users` or Supabase auth mapping for logins | ربط مستخدمي الدخول

## Confirmed Decisions | قرارات تم تأكيدها

- Dependent conversion rules are configurable from the system | قواعد تحويل التابع تتحدد من السيستم
- National ID is the main operational identifier for every person | الرقم القومي هو الرقم الاساسي للتعامل مع كل شخص
- National ID is mandatory for every person type | الرقم القومي اجباري لكل انواع الاشخاص
- Visitors are stored permanently | يتم تسجيل الزوار بشكل دائم
- Visitor phone number is mandatory | رقم موبايل الزائر اجباري
- The system generates an internal person code | السيستم ينشئ كود داخلي للشخص
- Membership numbers are globally unique across all membership types | ارقام العضوية ممنوع تتكرر بين كل انواع العضويات
- Working membership numbers are manually entered and globally unique | رقم العضو العامل يتم ادخاله ولا يتكرر نهائيا
- Sports membership numbers are manually entered and globally unique | رقم العضوية الرياضية يتم ادخاله ولا يتكرر نهائيا
- Dependent membership numbers follow the main member number with a suffix | ارقام التابعين تتبع رقم العضو الرئيسي مع رقم فرعي
- Separated dependents keep their old number in history and receive a new working member number | التابع المنفصل يحتفظ برقمه القديم في التاريخ ويأخذ رقم عضو عامل جديد
- Supported dependent relations are wife, husband, son, daughter, father, and mother | صلات قرابة التابعين المدعومة: زوجة، زوج، ابن، ابنة، اب، ام
- Dependent separation/conversion requires admin approval, board approval, and payment | فصل او تحويل التابع يحتاج موافقة ادارية وموافقة مجلس الادارة وسداد الرسوم
- If a working member number is corrected, old numbers stay in history and new dependent numbers are generated | عند تصحيح رقم العضو العامل تبقى الارقام القديمة في التاريخ ويتم توليد ارقام تابعين جديدة

## Open Questions | اسئلة مفتوحة

- Who is allowed to edit dependent conversion rules?
- Who is allowed to approve separation before the board step?
- Should board approval be recorded as a meeting decision number/document?
