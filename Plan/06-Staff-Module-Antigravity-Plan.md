# Staff Module Antigravity Build Plan

## Goal

Build a Staff module for the club management system.

The module must support employees, coaches, administrators, and other club workers while preserving the existing people and membership architecture.

The key rule:

```text
people = shared identity
memberships = member relationship
staff_members = employee relationship
staff_categories / staff_subcategories = organization
staff_groups = permissions
staff_jobs = operational behavior
auth user account = optional login access
```

A person can be both a club member and a staff member at the same time.

Do not duplicate identity fields such as full name, national ID, phone number, gender, or birth date in staff-specific tables. Use `public.people` as the single identity source.

## Core Model

Use this mental model across database, RPCs, and UI:

```text
Person = who they are
Membership = their club membership relationship
Staff member = their employment relationship
Category = department or business area
Subcategory = team or section inside a department
Group = permission profile
Job = what they do operationally
User account = whether they can log in
```

Permissions must come from groups.

Jobs must control operational behavior:

- whether the job belongs to the training sector
- whether the job is eligible for training commission
- whether the job requires, optionally allows, or does not need a system account

## Important Rules

1. `public.people` is the shared identity table.
2. A person can be both a member and a staff member.
3. A person should not have two active staff records.
4. Archiving a staff member must not delete the person.
5. Archiving a staff member must not affect memberships.
6. Categories and subcategories are for organization, filtering, and reporting.
7. Groups are for permissions.
8. Jobs are for operational staff behavior.
9. `staff_members.user_id` is the real source of system account status.
10. `user_id is null` means no system account.
11. `user_id is not null` means the staff member has a linked system account.
12. Do not create auth users unless the project already has a safe admin-user creation flow. Support linking an existing user first.

## Phase 1: Discovery First

Antigravity must not implement immediately.

First, it must inspect the project and summarize the current system.

Required discovery instructions:

```text
Read AGENTS.md first.

This project uses a newer Next.js version with breaking changes. Before editing Next.js code, read the relevant guide in node_modules/next/dist/docs/.

Inspect:
- current Supabase migrations
- people table
- memberships tables
- existing permission model
- auth/user tables
- role and permission helper functions
- existing RPC style
- audit_logs structure
- people pages
- memberships pages
- routing structure
- navigation/sidebar
- table, filter, form, dialog, toast, and validation patterns

Do not implement yet.

First summarize:
1. Current database structure related to people, memberships, users, roles, and permissions.
2. Current app routes/pages for people and memberships.
3. Existing UI/component patterns to reuse.
4. Where the Staff module should fit in the app navigation.
5. Any risks, blockers, or naming conflicts.
6. Exact files likely to be changed.
```

Only after this summary should implementation start.

## Phase 2: Database Migration

Create a new Supabase migration for the Staff module.

Do not modify old migrations unless the project convention requires it. Prefer a new timestamped migration.

### Required Enums

Create these enum types if they do not already exist:

```sql
staff_account_policy:
- none
- optional
- required

staff_member_status:
- active
- suspended
- ended
```

### Required Tables

Create `staff_categories`:

```text
id uuid primary key
name text not null unique
description text nullable
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Create `staff_subcategories`:

```text
id uuid primary key
category_id uuid not null references staff_categories(id)
name text not null
description text nullable
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(category_id, name)
```

Create `staff_groups`:

```text
id uuid primary key
name text not null unique
description text nullable
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Create `staff_jobs`:

```text
id uuid primary key
category_id uuid not null references staff_categories(id)
subcategory_id uuid nullable references staff_subcategories(id)
default_group_id uuid nullable references staff_groups(id)
name text not null
description text nullable
is_training_sector boolean not null default false
is_training_commissionable boolean not null default false
account_policy staff_account_policy not null default 'none'
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(category_id, subcategory_id, name)
```

Create `staff_members`:

```text
id uuid primary key
person_id uuid not null references people(id)
staff_code text unique nullable
job_id uuid not null references staff_jobs(id)
group_id uuid not null references staff_groups(id)
user_id uuid nullable references auth.users(id)
status staff_member_status not null default 'active'
hired_at date nullable
ended_at date nullable
notes text nullable
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Add a constraint or partial unique index to prevent duplicate active/suspended staff records for the same person:

```text
Only one staff_members row per person where status in ('active', 'suspended')
```

### Required Indexes

Add indexes for:

```text
staff_members.person_id
staff_members.group_id
staff_members.job_id
staff_members.user_id
staff_members.status
staff_jobs.category_id
staff_jobs.subcategory_id
staff_jobs.default_group_id
staff_subcategories.category_id
```

### Seed Data

Seed initial categories:

```text
Administration
Memberships & Reception
Finance
Training Sector
Operations
Medical
Security
Maintenance
IT & Systems
```

Seed suggested subcategories:

```text
Administration:
- General Management
- HR
- Legal Affairs
- Secretariat
- Procurement

Memberships & Reception:
- Membership Office
- Front Desk
- Card Printing
- Member Services
- Complaints

Finance:
- Cashier
- Accounting
- Collections
- Payroll
- Safe / Treasury

Training Sector:
- Football
- Swimming
- Gym & Fitness
- Martial Arts
- Tennis
- Basketball
- Handball
- Individual Sports
- Academy Administration

Operations:
- Facilities
- Housekeeping Supervision
- Event Operations
- Stores / Inventory

Medical:
- Clinic
- Physiotherapy
- First Aid
- Sports Medicine

Security:
- Main Gates
- Internal Patrol
- Parking
- Night Shift

Maintenance:
- Electrical
- Plumbing
- Carpentry
- Landscaping
- Pool Maintenance
- General Maintenance

IT & Systems:
- System Administration
- Technical Support
- Access Control
- Hardware / Network
```

Seed initial staff groups:

```text
Management
Reception
Membership Office
Finance
Training Supervisors
Coaches
Medical
Security
Maintenance
IT Administration
```

Seed common jobs with suitable defaults:

```text
General Manager
HR Officer
Receptionist
Membership Officer
Cashier
Accountant
Training Manager
Swimming Coach
Football Coach
Gym Coach
Doctor
Physiotherapist
Security Guard
Maintenance Worker
IT Administrator
Technical Support
```

For coach jobs:

```text
is_training_sector = true
is_training_commissionable = true
account_policy = optional
default_group = Coaches
```

For training management:

```text
is_training_sector = true
is_training_commissionable = false
account_policy = required
default_group = Training Supervisors
```

For reception, finance, IT, and management roles:

```text
account_policy = required
```

For maintenance and security roles:

```text
account_policy = none or optional depending on existing business needs
```

### Permissions

Add staff permissions using the existing permission system.

Do not invent a separate permission mechanism.

Required permission codes:

```text
staff.view
staff.create
staff.update
staff.archive
staff.manage_settings
staff.manage_groups
staff.manage_jobs
```

If the project has Arabic and English permission names, add both.

## Phase 3: Staff RPCs

Create Supabase RPCs for staff mutations.

Follow existing project style:

- `jsonb` payloads
- permission checks using `public.has_permission`
- `SECURITY DEFINER` where existing RPCs use it
- `SET search_path = public, auth`
- `audit_logs` inserts
- safe JSON success/error returns

### `create_staff_member_transaction(payload jsonb)`

Required behavior:

1. Requires `staff.create`.
2. If `payload.person_id` exists, reuse that person.
3. Else search `public.people` by `national_id`.
4. If a matching person exists, reuse it.
5. Else create a new `people` row using:
   - `full_name`
   - `national_id`
   - `phone`
   - `gender`
   - `birth_date`
6. Validate selected job exists and is active.
7. Validate selected group exists and is active.
8. If `group_id` is missing, use `staff_jobs.default_group_id`.
9. Insert `staff_members`.
10. Do not duplicate people rows.
11. Return:
   - `success`
   - `staff_member_id`
   - `person_id`

Important:

If the person already exists as a member, still allow creating a staff record for the same `person_id`.

### `update_staff_member_transaction(payload jsonb)`

Required behavior:

1. Requires `staff.update`.
2. Updates staff fields:
   - `staff_code`
   - `job_id`
   - `group_id`
   - `user_id`
   - `status`
   - `hired_at`
   - `ended_at`
   - `notes`
3. Optionally updates linked person fields:
   - `full_name`
   - `national_id`
   - `phone_number`
   - `gender`
   - `birth_date`
4. Validates job/group.
5. Prevents invalid status/date combinations:
   - `status = ended` should have `ended_at`
   - active staff should not have an ended date unless the current project already allows this pattern
6. Must not break any linked membership data.

### `archive_staff_member_transaction(payload jsonb)`

Required behavior:

1. Requires `staff.archive`.
2. Sets `status = ended`.
3. Sets `ended_at`.
4. Does not delete the staff row.
5. Does not delete the linked person.
6. Does not delete or modify any membership.
7. Adds an audit log entry.

### Settings Mutations

Implement settings mutations using either RPCs or direct table writes, depending on the current app convention.

Needed settings operations:

```text
create/update staff category
create/update staff subcategory
create/update staff group
create/update staff job
```

Permission requirements:

```text
staff.manage_settings -> categories and subcategories
staff.manage_groups -> groups
staff.manage_jobs -> jobs
```

## Phase 4: Staff List View or Query Helper

Create either a SQL view or typed frontend query helper according to the existing project style.

The Staff list must provide:

```text
staff_member_id
person_id
full_name
national_id
phone_number
staff_code
category_id
category_name
subcategory_id
subcategory_name
group_id
group_name
job_id
job_name
is_training_sector
is_training_commissionable
account_policy
has_system_account derived from user_id is not null
status
hired_at
ended_at
```

The frontend must support filters for:

```text
category
subcategory
group
job
status
training sector
commissionable
has system account
```

It must support search by:

```text
full name
national ID
phone
staff code
```

## Phase 5: Frontend Staff Pages

Build the UI using existing app patterns.

Before editing, inspect and reuse:

- people page layout
- memberships page layout
- table patterns
- filter patterns
- dialogs or forms
- validation style
- loading states
- error handling
- toast handling
- route conventions

### Staff List Page

Create the main Staff page.

Features:

- staff table
- search by name, national ID, phone, and staff code
- filters:
  - category
  - subcategory
  - group
  - job
  - status
  - training sector
  - commissionable
  - account status
- actions:
  - view
  - edit
  - archive/end employment
- Add Staff Member button

### Add Staff Member Flow

Required flow:

1. Search existing person by national ID or phone.
2. If found, show the existing person.
3. If the person is already a member, show that clearly.
4. Allow adding the same person as staff.
5. If not found, show person creation fields.
6. Assign category.
7. Assign subcategory.
8. Assign job.
9. Auto-fill default group from selected job.
10. Allow overriding group only when the current user has the correct permission.
11. Show selected job flags:
    - training sector
    - commissionable
    - account policy
12. Save using `create_staff_member_transaction`.

The UI should use language similar to:

```text
This person already exists as a member. Add them as staff too?
```

### Edit Staff Member Flow

Features:

- edit person basics
- edit staff code
- edit category/subcategory through job selection
- edit job
- edit group
- edit linked user account if supported
- edit status
- edit hired date
- edit ended date
- edit notes
- save through `update_staff_member_transaction`

Important:

Editing a staff member must not remove or damage their membership data.

### Archive Staff Member Flow

Features:

- confirmation dialog
- ended date
- optional notes
- save through `archive_staff_member_transaction`

Important:

The action is ending employment, not deleting the person.

### Staff Settings Page

Create a Staff Settings page with tabs:

```text
Categories
Subcategories
Groups
Jobs
```

Each tab should support create/edit/deactivate according to permissions.

Permissions:

```text
staff.manage_settings -> Categories and Subcategories
staff.manage_groups -> Groups
staff.manage_jobs -> Jobs
```

## Phase 6: Navigation and Permissions

Add Staff to the app navigation/sidebar using the existing navigation pattern.

Visibility:

```text
Staff page -> visible only with staff.view
Add Staff action -> visible only with staff.create
Edit Staff action -> visible only with staff.update
Archive Staff action -> visible only with staff.archive
Staff Settings -> visible only with staff.manage_settings, staff.manage_groups, or staff.manage_jobs
```

Do not show inaccessible actions and also enforce permissions at the database/RPC level.

UI hiding is not security by itself.

## Phase 7: Account Handling

For the first implementation, do not create new auth users unless the repository already has a safe admin provisioning flow.

Support this first:

```text
staff_members.user_id nullable
```

Meaning:

```text
user_id is null -> no system account
user_id is not null -> has linked system account
```

Job account policy behavior:

```text
none -> account normally not needed
optional -> account may be linked
required -> account should be linked when account provisioning is available
```

If account provisioning is not implemented yet, the UI may warn for `required` jobs but should not block staff creation unless the business explicitly wants that.

Account creation can be a separate future phase.

## Phase 8: Verification

Run the project verification commands according to existing scripts.

At minimum, check:

1. Migration applies cleanly.
2. Seed data inserts correctly.
3. Staff tables respect constraints.
4. Creating staff with a new person works.
5. Creating staff with an existing person reuses `people.id`.
6. Creating staff for an existing member reuses the same `people.id`.
7. Duplicate active/suspended staff records for the same person are blocked.
8. Updating staff does not affect membership relationships.
9. Archiving staff does not delete people.
10. Archiving staff does not modify memberships.
11. Staff list search works.
12. Staff list filters work.
13. Permission-gated UI actions appear and disappear correctly.
14. RPC permission checks block unauthorized mutations.
15. Build, lint, and typecheck pass.

## Suggested Antigravity Master Prompt

Use this prompt first:

```text
We need to build a Staff module for this club management system.

Important architecture:
- public.people is the shared identity table.
- A person can be a member and a staff member at the same time.
- Do not duplicate people fields in staff tables.
- Staff organization uses categories and subcategories.
- Staff permissions come from groups.
- Staff operational behavior comes from jobs.
- Jobs define:
  - is_training_sector
  - is_training_commissionable
  - account_policy: none / optional / required
- Staff members link person + job + group + optional auth user.
- user_id nullable means no system account.
- user_id not null means has system account.

Before coding:
1. Read AGENTS.md.
2. This project uses a newer Next.js version with breaking changes. Before editing Next.js code, read the relevant guide in node_modules/next/dist/docs/.
3. Inspect existing Supabase migrations, permissions, people pages, membership pages, navigation, forms, tables, RPCs, and audit_logs.
4. Summarize the implementation approach and confirm file targets.
5. Do not implement until the discovery summary is complete.

Then implement in phases:
- database migration
- RPCs
- typed queries/actions
- staff list page
- add/edit staff flows
- archive staff flow
- staff settings pages
- navigation and permissions
- verification

Follow existing project patterns.
Keep changes scoped.
Do not invent a separate permission system.
Do not create auth users unless the project already has a safe admin-user creation flow; support linking user_id first.
```

## Recommended Execution Order

1. Ask Antigravity to do Phase 1 only.
2. Review its discovery summary.
3. Approve the database migration phase.
4. Review the schema and permissions.
5. Approve RPC implementation.
6. Review mutation behavior and audit logs.
7. Approve frontend pages.
8. Approve verification and cleanup.

Do not ask Antigravity to build the entire module in one unchecked pass.
