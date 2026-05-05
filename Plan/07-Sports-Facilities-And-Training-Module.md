# Sports, Facilities, and Training Module Antigravity Build Plan

## Goal

Build a professional Sports Operations module for the club.

This module must support:

- sports catalog
- practice and competition sectors
- sport-specific levels
- sport-specific age groups
- configurable player classification rules
- facilities and facility areas
- training groups and competition teams
- coach assignments
- weekly schedules
- player enrollment
- level progression
- future attendance, payments, and coach commissions

The module must reuse the existing system foundations:

```text
people = shared identity
staff_members = coaches and training staff
staff_jobs = identifies training-sector and commissionable staff behavior
memberships = optional club membership relationship
sports = sports participation relationship
facilities = physical places where training happens
```

A player can be:

- a club member
- a staff member
- both member and staff
- an external sports subscriber
- a child/dependent

Do not duplicate person identity fields. Use `public.people` as the shared identity source.

## Core Concept

Use this mental model across database, RPCs, and UI:

```text
Sport = the game itself, such as Swimming or Football
Sector = Practice or Competition inside a sport
Level = sport-specific progression step
Age Group = sport-specific age classification
Player = a person participating in a sport
Training Group = actual group/class/team players join
Facility = physical place, such as Main Swimming Pool
Facility Area = reservable subdivision, such as Pool Square 1
Session = weekly day/time/place for a training group
Coach = staff member assigned to a group/session
Progression = moving a player between levels over time
```

The system must not hardcode swimming, football, or any single sport.

Each sport must be configurable.

## Main Business Example

Example sport:

```text
Swimming
```

Default sectors:

```text
Practice Sector
Competition Sector
```

Practice Sector may classify players by level only:

```text
Swimming School - Level A
Swimming School - Level B
Swimming School - Level C
```

Competition Sector may classify players by age and level:

```text
Swimming Team - Under 12 - Level D
Swimming Team - Under 14 - Level E
```

Training group example:

```text
Sport: Swimming
Sector: Practice
Group: Swimming School - Level A
Min players: 6
Max players: 12
Training units per month: 12
Days: Sunday, Tuesday, Thursday
Time: 5:00 PM - 6:00 PM
Facility area: Main Swimming Pool - Square 1
Coaches: one or more staff members
```

Facility example:

```text
Facility: Main Swimming Pool
Areas:
- Square 1
- Square 2
- Square 3
- Square 4
- Square 5
- Square 6
- Square 7
- Square 8
```

At the same hour, multiple groups can use different pool squares.

The system must prevent two active sessions from using the same facility area at overlapping times.

## Important Rules

1. `public.people` is the shared identity table.
2. Do not create a separate player identity table with duplicated full name, national ID, phone, gender, or birth date.
3. A person can participate in multiple sports.
4. Levels are defined per sport.
5. Level progression must depend on `sort_order`, not on level names like A, B, C.
6. Age groups are configurable per sport and optionally per sector.
7. Every sport should have Practice and Competition sectors by default.
8. Sector classification must be configurable.
9. A sector may classify by age only, level only, age and level, or manual assignment.
10. Training groups belong to one sport and one sector.
11. Training groups may require an age group, a level, both, or neither depending on sector classification.
12. Coaches must come from `staff_members`.
13. Prefer coaches whose staff job or group belongs to the training sector.
14. Facility scheduling must be structured, not plain text.
15. Facility conflict detection is required before serious scheduling use.
16. Archiving a player sport record must not delete the person.
17. Archiving a training group must not delete historical enrollment or attendance.

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
- staff module tables and RPCs
- staff jobs and training-sector fields
- existing permission model
- auth/user tables
- existing RPC style
- audit_logs structure
- people pages
- memberships pages
- staff pages
- routing structure
- navigation/sidebar
- table, filter, form, dialog, toast, and validation patterns

Do not implement yet.

First summarize:
1. Current database structure related to people, memberships, staff, users, roles, and permissions.
2. Current app routes/pages for people, memberships, and staff.
3. Existing UI/component patterns to reuse.
4. Where Sports, Facilities, and Training should fit in the app navigation.
5. Any risks, blockers, or naming conflicts.
6. Exact files likely to be changed.
```

Only after this summary should implementation start.

## Phase 2: Database Migration

Create a new Supabase migration for the Sports, Facilities, and Training module.

Do not modify old migrations unless the project convention requires it. Prefer a new timestamped migration.

### Required Enums

Create these enum types if they do not already exist:

```text
sport_sector_type:
- practice
- competition

sport_classification_mode:
- age_only
- level_only
- age_and_level
- manual

sport_player_status:
- active
- suspended
- ended

training_group_status:
- draft
- active
- paused
- archived

training_group_coach_role:
- primary_coach
- assistant_coach
- supervisor

training_enrollment_status:
- active
- paused
- ended

facility_type:
- pool
- field
- court
- hall
- gym
- track
- room
- other

facility_area_type:
- lane
- square
- court
- field_zone
- room
- full_facility
- other
```

### Required Tables

Create `sports`:

```text
id uuid primary key
name text not null unique
description text nullable
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Create `sport_sectors`:

```text
id uuid primary key
sport_id uuid not null references sports(id)
sector_type sport_sector_type not null
name text not null
classification_mode sport_classification_mode not null default 'manual'
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(sport_id, sector_type)
unique(sport_id, name)
```

Create `sport_levels`:

```text
id uuid primary key
sport_id uuid not null references sports(id)
code text not null
name text not null
sort_order integer not null
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(sport_id, code)
unique(sport_id, sort_order)
```

Create `sport_age_groups`:

```text
id uuid primary key
sport_id uuid not null references sports(id)
sector_id uuid nullable references sport_sectors(id)
name text not null
min_age integer nullable
max_age integer nullable
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(sport_id, sector_id, name)
```

Age group notes:

```text
min_age nullable allows open lower bound
max_age nullable allows open upper bound
```

Create `sport_players`:

```text
id uuid primary key
person_id uuid not null references people(id)
sport_id uuid not null references sports(id)
current_level_id uuid nullable references sport_levels(id)
status sport_player_status not null default 'active'
joined_at date nullable
ended_at date nullable
notes text nullable
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(person_id, sport_id)
```

Create `player_level_history`:

```text
id uuid primary key
sport_player_id uuid not null references sport_players(id)
sport_id uuid not null references sports(id)
from_level_id uuid nullable references sport_levels(id)
to_level_id uuid not null references sport_levels(id)
changed_at timestamptz not null default now()
changed_by uuid nullable references auth.users(id)
reason text nullable
notes text nullable
```

Create `sports_facilities`:

```text
id uuid primary key
name text not null unique
facility_type facility_type not null default 'other'
sport_id uuid nullable references sports(id)
description text nullable
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Create `facility_areas`:

```text
id uuid primary key
facility_id uuid not null references sports_facilities(id)
name text not null
area_type facility_area_type not null default 'other'
capacity integer nullable
sort_order integer not null default 0
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(facility_id, name)
```

Create `training_groups`:

```text
id uuid primary key
sport_id uuid not null references sports(id)
sector_id uuid not null references sport_sectors(id)
name text not null
age_group_id uuid nullable references sport_age_groups(id)
level_id uuid nullable references sport_levels(id)
min_players integer nullable
max_players integer nullable
training_units_per_month integer nullable
status training_group_status not null default 'draft'
start_date date nullable
end_date date nullable
notes text nullable
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(sport_id, sector_id, name)
```

Create `training_group_coaches`:

```text
id uuid primary key
training_group_id uuid not null references training_groups(id)
staff_member_id uuid not null references staff_members(id)
role training_group_coach_role not null default 'assistant_coach'
commission_share numeric(5,2) nullable
is_primary boolean not null default false
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(training_group_id, staff_member_id)
```

Create `training_group_sessions`:

```text
id uuid primary key
training_group_id uuid not null references training_groups(id)
day_of_week integer not null
start_time time not null
end_time time not null
facility_area_id uuid not null references facility_areas(id)
starts_on date nullable
ends_on date nullable
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

`day_of_week` should use a clear convention:

```text
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

Create `training_group_enrollments`:

```text
id uuid primary key
training_group_id uuid not null references training_groups(id)
sport_player_id uuid not null references sport_players(id)
status training_enrollment_status not null default 'active'
enrolled_at date not null default current_date
ended_at date nullable
notes text nullable
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Add a partial unique index to prevent duplicate active enrollments in the same group:

```text
Only one active enrollment per sport_player_id and training_group_id
```

Consider whether the business allows one player to be active in multiple training groups for the same sport. If not, add a stricter partial unique index:

```text
Only one active enrollment per sport_player_id per sport
```

Do not add the stricter rule until confirmed.

### Required Constraints

Add constraints for:

```text
sport_levels.sort_order > 0
sport_age_groups.min_age >= 0 when not null
sport_age_groups.max_age >= min_age when both are not null
facility_areas.capacity > 0 when not null
training_groups.min_players > 0 when not null
training_groups.max_players >= min_players when both are not null
training_groups.training_units_per_month > 0 when not null
training_group_sessions.day_of_week between 0 and 6
training_group_sessions.end_time > start_time
training_group_coaches.commission_share between 0 and 100 when not null
```

### Required Indexes

Add indexes for:

```text
sport_sectors.sport_id
sport_levels.sport_id
sport_age_groups.sport_id
sport_age_groups.sector_id
sport_players.person_id
sport_players.sport_id
sport_players.current_level_id
player_level_history.sport_player_id
player_level_history.sport_id
sports_facilities.sport_id
facility_areas.facility_id
training_groups.sport_id
training_groups.sector_id
training_groups.age_group_id
training_groups.level_id
training_groups.status
training_group_coaches.training_group_id
training_group_coaches.staff_member_id
training_group_sessions.training_group_id
training_group_sessions.facility_area_id
training_group_sessions.day_of_week
training_group_enrollments.training_group_id
training_group_enrollments.sport_player_id
training_group_enrollments.status
```

### Seed Data

Seed initial sports:

```text
Swimming
Football
Basketball
Handball
Tennis
Gym & Fitness
Karate
Gymnastics
```

For each seeded sport, create two sectors:

```text
Practice Sector
Competition Sector
```

Suggested default classification modes:

```text
Swimming Practice -> level_only
Swimming Competition -> age_and_level
Football Practice -> age_only
Football Competition -> age_only
Basketball Practice -> age_only
Basketball Competition -> age_only
Handball Practice -> age_only
Handball Competition -> age_only
Tennis Practice -> level_only
Tennis Competition -> age_and_level
Gym & Fitness Practice -> manual
Gym & Fitness Competition -> manual
Karate Practice -> level_only
Karate Competition -> age_and_level
Gymnastics Practice -> age_and_level
Gymnastics Competition -> age_and_level
```

Seed swimming levels:

```text
A sort_order 1
B sort_order 2
C sort_order 3
D sort_order 4
E sort_order 5
```

Seed generic age groups where appropriate:

```text
Under 6
Under 8
Under 10
Under 12
Under 14
Under 16
Under 18
Open Age
```

Seed a sample facility:

```text
Main Swimming Pool
facility_type = pool
sport = Swimming
```

Seed pool areas:

```text
Square 1
Square 2
Square 3
Square 4
Square 5
Square 6
Square 7
Square 8
```

## Phase 3: Permissions

Add sports and facilities permissions using the existing permission system.

Do not invent a separate permission mechanism.

Required permission codes:

```text
sports.view
sports.create
sports.update
sports.archive
sports.manage_setup
sports.manage_levels
sports.manage_age_groups

facilities.view
facilities.create
facilities.update
facilities.archive
facilities.manage_areas

training.view
training.create
training.update
training.archive
training.manage_schedule
training.manage_coaches
training.manage_enrollments
training.promote_players
```

If the project stores Arabic and English permission names, add both.

## Phase 4: Database Validation Functions

Add helper functions where they make the implementation safer and easier.

Recommended function:

```text
public.training_group_matches_sector_rules(
  p_sector_id uuid,
  p_age_group_id uuid,
  p_level_id uuid
) returns boolean
```

Expected behavior:

```text
age_only -> age_group_id required, level_id optional/null
level_only -> level_id required, age_group_id optional/null
age_and_level -> both age_group_id and level_id required
manual -> both optional
```

Recommended function:

```text
public.training_session_has_facility_conflict(
  p_facility_area_id uuid,
  p_day_of_week integer,
  p_start_time time,
  p_end_time time,
  p_starts_on date,
  p_ends_on date,
  p_ignore_session_id uuid default null
) returns boolean
```

Expected behavior:

Returns true if another active session uses the same facility area on the same day with overlapping time and overlapping date range.

Recommended function:

```text
public.training_group_current_enrollment_count(
  p_training_group_id uuid
) returns integer
```

Expected behavior:

Returns the count of active enrollments for a training group.

## Phase 5: RPCs

Create Supabase RPCs for sports, facilities, training, and player mutations.

Follow existing project style:

- `jsonb` payloads
- permission checks using `public.has_permission`
- `SECURITY DEFINER` where existing RPCs use it
- `SET search_path = public, auth`
- `audit_logs` inserts
- safe JSON success/error returns

### Sports Setup RPCs

Create RPCs or server actions according to the project convention for:

```text
create/update/archive sport
create/update/archive sport sector
create/update/archive sport level
create/update/archive sport age group
```

Permission requirements:

```text
sports.create -> create sport
sports.update -> update sport
sports.archive -> deactivate/archive sport
sports.manage_setup -> sectors
sports.manage_levels -> levels
sports.manage_age_groups -> age groups
```

### Facilities RPCs

Create RPCs or server actions for:

```text
create/update/archive facility
create/update/archive facility area
```

Permission requirements:

```text
facilities.create
facilities.update
facilities.archive
facilities.manage_areas
```

### `create_training_group_transaction(payload jsonb)`

Required behavior:

1. Requires `training.create`.
2. Validates sport exists and is active.
3. Validates sector exists, is active, and belongs to the sport.
4. Validates age group if provided.
5. Validates level if provided.
6. Enforces sector classification mode.
7. Validates min/max players.
8. Inserts `training_groups`.
9. Optionally inserts coaches.
10. Optionally inserts weekly sessions.
11. Checks facility conflicts for sessions.
12. Adds audit log.
13. Returns `training_group_id`.

### `update_training_group_transaction(payload jsonb)`

Required behavior:

1. Requires `training.update`.
2. Updates group basics.
3. Validates sport/sector/age/level consistency.
4. Enforces sector classification mode.
5. Validates player capacity.
6. Adds audit log.

### `archive_training_group_transaction(payload jsonb)`

Required behavior:

1. Requires `training.archive`.
2. Sets status to `archived`.
3. Deactivates future sessions.
4. Does not delete historical enrollments.
5. Does not delete players or people.
6. Adds audit log.

### Training Schedule RPCs

Create RPCs for:

```text
add training group session
update training group session
deactivate training group session
```

Required behavior:

1. Requires `training.manage_schedule`.
2. Validates day/time.
3. Validates facility area.
4. Prevents facility conflicts.
5. Later, optionally prevent coach conflicts.

### Coach Assignment RPCs

Create RPCs for:

```text
assign coach to training group
update coach assignment
remove/deactivate coach assignment
```

Required behavior:

1. Requires `training.manage_coaches`.
2. Validates `staff_member_id` exists and is active.
3. Prefer/validate training-sector staff if the staff module supports this cleanly.
4. Allows multiple coaches.
5. Supports one primary coach.
6. Adds audit log.

### Player Enrollment RPCs

Create `create_sport_player_transaction(payload jsonb)`.

Required behavior:

1. Requires `training.manage_enrollments`.
2. If `person_id` is provided, reuse person.
3. Else search by `national_id`.
4. If person exists, reuse it.
5. Else create a `people` row.
6. Validates sport exists and is active.
7. Validates initial level if provided.
8. Creates or updates `sport_players`.
9. Does not duplicate people rows.
10. Adds level history if an initial level is assigned.
11. Adds audit log.
12. Returns `sport_player_id` and `person_id`.

Create `enroll_player_in_training_group_transaction(payload jsonb)`.

Required behavior:

1. Requires `training.manage_enrollments`.
2. Validates player exists and is active.
3. Validates training group exists and is active.
4. Validates player sport matches group sport.
5. Validates group capacity is not exceeded.
6. Optionally validates age/level fit.
7. Inserts enrollment.
8. Adds audit log.

Create `end_training_group_enrollment_transaction(payload jsonb)`.

Required behavior:

1. Requires `training.manage_enrollments`.
2. Sets enrollment status to `ended`.
3. Sets ended date.
4. Does not delete history.
5. Adds audit log.

### Player Progression RPC

Create `promote_sport_player_level_transaction(payload jsonb)`.

Required behavior:

1. Requires `training.promote_players`.
2. Validates player exists.
3. Validates target level belongs to the same sport.
4. Uses `sort_order` to understand progression.
5. Allows normal next-level promotion.
6. If skipping levels, require a reason.
7. Updates `sport_players.current_level_id`.
8. Inserts `player_level_history`.
9. Adds audit log.

## Phase 6: Views or Query Helpers

Create SQL views or typed frontend query helpers according to existing project style.

### Sports Setup View

Must provide:

```text
sport_id
sport_name
is_active
practice_sector_id
practice_classification_mode
competition_sector_id
competition_classification_mode
level_count
age_group_count
```

### Training Groups List View

Must provide:

```text
training_group_id
sport_id
sport_name
sector_id
sector_name
sector_type
classification_mode
group_name
age_group_id
age_group_name
level_id
level_name
min_players
max_players
current_player_count
training_units_per_month
status
coach_names
session_summary
start_date
end_date
```

### Facilities Schedule View

Must provide:

```text
facility_id
facility_name
facility_area_id
facility_area_name
day_of_week
start_time
end_time
training_group_id
training_group_name
sport_name
sector_name
coach_names
```

### Sport Players View

Must provide:

```text
sport_player_id
person_id
full_name
national_id
phone_number
email
sport_id
sport_name
current_level_id
current_level_name
status
joined_at
active_group_names
```

## Phase 7: Frontend Pages

Build the UI using existing app patterns.

Before editing, inspect and reuse:

- people page layout
- memberships page layout
- staff page layout
- table patterns
- filter patterns
- dialogs or forms
- validation style
- loading states
- error handling
- toast handling
- route conventions

### Sports Page

Main page for the sports catalog.

Features:

- list sports
- create sport
- edit sport
- activate/deactivate sport
- open sport setup

Visible with:

```text
sports.view
```

Create/update/archive actions must obey:

```text
sports.create
sports.update
sports.archive
```

### Sport Setup Page

Per-sport setup page.

Tabs:

```text
Sectors
Levels
Age Groups
Classification
```

Features:

- configure Practice Sector
- configure Competition Sector
- choose classification mode per sector
- manage sport-specific levels
- manage sport-specific age groups
- show level progression order

Permissions:

```text
sports.manage_setup
sports.manage_levels
sports.manage_age_groups
```

### Facilities Page

Manage sports facilities and facility areas.

Features:

- list facilities
- create/edit/deactivate facility
- assign optional sport
- manage facility areas
- define capacity and sort order

Example:

```text
Main Swimming Pool
- Square 1
- Square 2
- Square 3
- Square 4
- Square 5
- Square 6
- Square 7
- Square 8
```

Permissions:

```text
facilities.view
facilities.create
facilities.update
facilities.archive
facilities.manage_areas
```

### Training Groups Page

Main page for practice groups and competition teams.

Features:

- table of training groups
- filters:
  - sport
  - sector
  - age group
  - level
  - status
  - coach
  - facility
- search by group name
- show capacity:
  - current players
  - min players
  - max players
- show monthly training units
- show session summary
- actions:
  - view
  - edit
  - archive

Permissions:

```text
training.view
training.create
training.update
training.archive
```

### Create / Edit Training Group Flow

Fields:

```text
sport
sector
classification mode display
age group when required
level when required
group name
min players
max players
training units per month
start date
end date
notes
coaches
weekly sessions
```

When selecting a sector:

```text
age_only -> require age group
level_only -> require level
age_and_level -> require both age group and level
manual -> both optional
```

Weekly session fields:

```text
day of week
start time
end time
facility
facility area
active date range
```

The UI must show a clear conflict error if a facility area is already booked.

### Sport Players Page

Manage players per sport.

Features:

- search by full name, national ID, phone, email
- filter by sport
- filter by level
- filter by active group
- create sport player
- enroll player in group
- end enrollment
- promote level
- show whether the person is an existing member

Create player flow:

1. Search existing person by national ID or phone.
2. If found, reuse person.
3. If not found, create person.
4. Select sport.
5. Select current level if applicable.
6. Optionally enroll in a training group.

### Weekly Schedule Page

Create a schedule/calendar page.

Views:

```text
By facility
By sport
By coach
By training group
```

Minimum first version:

```text
weekly grid by facility area
```

This is especially important for swimming pool squares and court bookings.

## Phase 8: Navigation

Add navigation items according to existing app navigation patterns.

Suggested navigation structure:

```text
Sports
- Sports Setup
- Players
- Training Groups
- Schedule
- Facilities
```

Visibility:

```text
Sports -> sports.view
Players -> training.manage_enrollments or training.view
Training Groups -> training.view
Schedule -> training.view or training.manage_schedule
Facilities -> facilities.view
```

Hide inaccessible UI actions, but always enforce permissions in database/RPCs too.

UI hiding is not security by itself.

## Phase 9: Scheduling Conflict Rules

Facility conflicts are required.

The system must block overlapping sessions when:

```text
same facility_area_id
same day_of_week
time ranges overlap
date ranges overlap
both sessions active
```

Time overlap rule:

```text
existing.start_time < new.end_time
existing.end_time > new.start_time
```

Date overlap rule:

Treat null `starts_on` as open beginning.

Treat null `ends_on` as open end.

Two ranges overlap when:

```text
existing_start <= new_end
and
new_start <= existing_end
```

Coach conflicts should be added after facility conflicts.

Coach conflict rule:

```text
same staff_member_id
same day_of_week
overlapping time
overlapping date range
active assignment/session
```

## Phase 10: Future Extensions

Do not build these in the first pass unless explicitly requested, but keep the schema and naming friendly to them:

```text
attendance
monthly subscriptions
training package pricing
coach commissions
private sessions
trial sessions
medical clearance
competition registration
competition results
uniforms/equipment
NFC gate access by training schedule
parent/guardian portal
mobile coach attendance app
```

## Phase 11: Verification

Run project verification commands according to existing scripts.

At minimum, verify:

1. Migration applies cleanly.
2. Seed sports are inserted.
3. Practice and Competition sectors are created.
4. Sport levels are ordered by `sort_order`.
5. Age group constraints work.
6. Creating a facility works.
7. Creating facility areas works.
8. Creating a swimming pool with 8 squares works.
9. Creating a training group with level-only classification works.
10. Creating a training group with age-and-level classification works.
11. Invalid classification combinations are blocked.
12. Adding one or more coaches works.
13. Creating weekly sessions works.
14. Facility area overlap is blocked.
15. Non-overlapping sessions in different pool squares are allowed.
16. Creating a sport player with a new person works.
17. Creating a sport player with an existing person reuses `people.id`.
18. Existing members can become sport players without duplicate people rows.
19. Enrolling a player in a group works.
20. Group max capacity is enforced.
21. Promoting a player level updates current level.
22. Promoting a player level writes history.
23. Archiving a training group preserves history.
24. Archiving a sport player does not delete the person.
25. Permission-gated UI actions appear and disappear correctly.
26. RPC permission checks block unauthorized mutations.
27. Build, lint, and typecheck pass.

## Suggested Antigravity Master Prompt

Use this prompt first:

```text
We need to build a Sports, Facilities, and Training module for this club management system.

Important architecture:
- public.people is the shared identity table.
- Do not duplicate player identity fields in sports tables.
- A person can be a member, staff member, and sport player at the same time.
- Coaches must come from staff_members.
- Sports have two default sectors: Practice and Competition.
- Each sector has configurable classification:
  - age_only
  - level_only
  - age_and_level
  - manual
- Levels are defined per sport and ordered by sort_order.
- Age groups are defined per sport and optionally per sector.
- Training groups belong to sport + sector and may target age group, level, or both.
- Facilities can be divided into facility areas.
- Example: Main Swimming Pool has 8 squares.
- Training sessions must use structured day/time/facility area rows.
- Facility area schedule conflicts must be blocked.

Before coding:
1. Read AGENTS.md.
2. This project uses a newer Next.js version with breaking changes. Before editing Next.js code, read the relevant guide in node_modules/next/dist/docs/.
3. Inspect existing Supabase migrations, permissions, people pages, membership pages, staff module, navigation, forms, tables, RPCs, and audit_logs.
4. Summarize the implementation approach and confirm file targets.
5. Do not implement until the discovery summary is complete.

Then implement in phases:
- database migration
- permissions
- validation helper functions
- RPCs
- typed queries/views
- sports setup pages
- facilities pages
- training groups pages
- player enrollment pages
- weekly schedule page
- navigation and permissions
- verification

Follow existing project patterns.
Keep changes scoped.
Do not invent a separate permission system.
Do not create duplicate people rows.
Do not build payments, attendance, or commissions yet unless explicitly requested; only keep the design ready for them.
```

## Recommended Execution Order

1. Ask Antigravity to do Phase 1 only.
2. Review its discovery summary.
3. Approve the database migration phase.
4. Review schema, constraints, permissions, and seed data.
5. Approve helper functions and RPC implementation.
6. Review mutation behavior, validation, conflict checks, and audit logs.
7. Approve frontend pages.
8. Approve schedule/calendar implementation.
9. Approve verification and cleanup.

Do not ask Antigravity to build the entire module in one unchecked pass.
