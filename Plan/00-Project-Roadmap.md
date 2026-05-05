# Assiut Sporting Club Master Plan

## Purpose

This file is now the single major planning document for the Assiut Sporting Club platform.

The goal is to keep one clear source of truth that a non-coder can review easily before we create a separate step-by-step execution file together.

## Planning Structure

- `00-Project-Roadmap.md` is the master plan and the main reference.
- The original files in `Plan/` remain for our main discussion, detailed notes, and product decisions.
- `Plan/Vipe/` is for the new execution phases that we will use for vibe coding.
- `Plan/Vipe/Master-Instructions.md` is the standing rulebook that every coding agent must read before starting a task.
- The `Vipe` files should be practical, step-by-step, and implementation-focused.

## Product Vision

Build a professional Arabic-first club platform that starts with a simple public entry page and grows into a secure internal operational system for:

- people and identities
- memberships and dependents
- staff and permissions
- sports and training operations
- facilities and visitor access
- payments and receipts
- website and media content
- future NFC gates and mobile apps

## Product Principles

- Arabic-first user experience
- English helper labels where useful for implementation
- Mobile-ready from the beginning
- Fast operational screens for daily staff work
- Shared person identity across all modules
- Role-based access control from day one
- No unsafe shortcuts in security or data history
- Future-ready structure for NFC, gates, and mobile apps

## Environment and Release Decision

To keep the project simple and still professional, we will use only two environments for now:

### Development

- Used for building, testing, and trying ideas
- Uses fake or test data only
- Can change freely
- Must never connect to live club data

### Production

- The real live system for the club
- Uses real members, real staff, and real operations
- No experimentation or unfinished features

### Live Operating Rule

The system is expected to go live before the full product is finished.

That means:

- production stays active for real club work while development continues separately
- unfinished features must stay in development until approved
- every phase must be safe to release independently
- no phase should require the club to stop using the live system for normal daily work

### Environment Rules

- Development and production must use separate Supabase projects
- Development and production must use separate environment variables
- Development must never use production secrets
- Development must never use production data directly
- Real data belongs only in production
- Production must have backups before structural changes
- Database changes must be written so production upgrades are controlled and reversible where possible
- Every release should be tested in development first, then moved to production

### Simple Branch Rule

- `dev` branch for ongoing work
- `main` branch for production-ready code
- urgent live fixes may use a short-lived `hotfix/...` branch from `main`, then merge back into both `main` and `dev`

### Release Workflow

For a live system, the delivery rhythm should be:

1. Build and test in development
2. Review schema, permissions, and user impact
3. Prepare a small release batch
4. Deploy to production only when that batch is stable
5. Confirm production health before starting the next release batch

Important live-system rule:

- never leave half-finished operational flows visible in production
- if a feature is incomplete, hide it behind permissions, feature flags, or unfinished-route protection
- prefer small releases over large all-at-once launches

## Recommended Technical Direction

- Frontend: Next.js
- Hosting: Vercel
- Database and auth: Supabase
- Storage: Supabase Storage
- Access model: database permissions plus UI checks

## Security Foundation

Security is not a later phase. It is part of the first real implementation.

### Required Security Rules

- Use real RBAC and RLS from the beginning
- Do not use broad "all authenticated users have full access" policies
- Keep sensitive writes inside safe server/database transactions
- Add audit logging for important actions
- Never expose service-role keys in browser code
- Use least privilege for admin and staff roles

### Required Data Integrity Rules

- No hard delete for operational records
- Archive, suspend, end, or cancel instead of delete
- Keep history for membership numbers and important changes
- Keep visitor records permanently
- Keep family and membership history traceable

## Core Identity Model

The system must treat one real human as one shared person record.

One person may be:

- a working member
- a dependent member
- a sports subscriber
- a staff member
- a coach
- a board member
- a visitor
- several of these at the same time

### Identity Rules

- `people` is the single identity source
- National ID is the main operational identifier
- National ID is required and unique for every person
- Database relations should use internal UUIDs
- The system should generate its own internal person code
- The same person must not be duplicated across modules

## Membership Model

Memberships are a relationship with the club, not the person identity itself.

### Main Membership Rules

- Membership numbers are globally unique across all membership types
- Working membership numbers are entered manually by authorized users
- Sports membership numbers are entered manually by authorized users
- Dependent numbers are derived from the main member number with a suffix
- Old numbers must remain in history
- Numbers must never be reused after archive, correction, or separation

### Dependent Rules

- Supported dependent relations are wife, husband, son, daughter, father, and mother
- Dependent conversion rules must be configurable from the system
- Separation or conversion requires admin approval, board approval, and payment confirmation
- A separated dependent keeps the old dependent number in history and receives a new working member number

## Permissions Model

Business role and system permission are not the same thing.

Examples:

- A coach may have no system login
- A staff member may have login access
- A board member may have read-only access
- A media officer may only manage website content

### Permissions Direction

- System permissions should be defined explicitly in the database
- Users should be linked to people through a system user mapping
- RLS should check permissions through helper functions such as `has_permission(...)`
- UI should hide unavailable actions, but database checks remain the real protection

## Main Modules

### 1. People, Memberships, and Roles

This is the system foundation and should be treated as the first core business module.

It includes:

- person registry
- family relationships
- memberships
- dependents
- role assignment
- permission links
- identity readiness for NFC and future access cards

### 2. Public Website and CMS

This starts small, not full-scale.

First version:

- simple public entry page
- club branding
- `Enter System` button
- login route for internal users

Later version:

- full public website
- news and announcements
- media and gallery management
- sports pages
- board pages
- content approval workflow

### 3. Architecture, Performance, and NFC Readiness

The system must stay fast for operational staff work.

Important directions:

- indexed search by national ID, phone, membership number, and name
- lightweight operational screens
- separate operational logic from future public traffic
- prepare APIs and data structures for future NFC gates and mobile apps

### 4. Staff Module

Staff is a separate operational relationship that reuses shared people records.

It includes:

- staff categories and subcategories
- staff groups for permissions
- staff jobs for operational behavior
- staff members linked to people
- optional user account linking

Important staff rule:

- a person can be both a member and a staff member

### 5. Sports, Facilities, and Training Module

This module manages sports operations without duplicating person identity.

It includes:

- sports catalog
- sectors such as practice and competition
- sport-specific levels
- sport-specific age groups
- sport players
- training groups
- facility areas
- weekly schedules
- coach assignments
- player enrollment and level progression

Important sports rule:

- coaches must come from staff records, not separate duplicated profiles

### 6. Future Operational Modules

These are planned after the foundation is stable:

- facility booking
- visitor access
- payments and receipts
- admin operations dashboards
- advanced audit logs and reports
- NFC cards and gate devices
- mobile app and self-service features

## Build Order

The practical build order should be:

### Phase 0: Simple Entry and Project Setup

- create the basic public entry page
- connect the app to development Supabase
- prepare auth routes
- prepare environment variables

### Phase 1: Security and Access Foundation

- set up RBAC and RLS correctly
- remove unsafe open access policies
- add permission tables and helper functions
- add audit logging foundation
- block hard deletes for core operational tables

### Phase 2: People and Membership Foundation

- create person registry
- enforce unique National ID
- create membership and dependent flows
- add membership number registry/history
- add configurable dependent rules
- add separation and conversion workflow

### Phase 3: Staff Foundation

- create staff categories, groups, jobs, and staff members
- connect staff permissions
- support optional linked user accounts

### Phase 4: Sports and Facilities Foundation

- create sports setup
- create sport players
- create facilities and facility areas
- create training groups and schedules
- create coach assignment and enrollment flows

### Phase 5: Public Website and CMS Expansion

- build the public website properly
- add CMS and media workflows
- optionally sync sports to public pages

### Phase 6: Advanced Operations

- payments
- visitor and booking workflows
- NFC access cards
- gate integrations
- mobile app readiness

## Phase Delivery Rule

Each phase should be treated as its own mini-project and finished in this order:

1. Discovery and decision review
2. Schema and security review
3. Backend or database implementation
4. Frontend or workflow implementation
5. Testing in development
6. Production release check
7. Production deployment
8. Post-release verification

Do not start wide parallel feature building across many modules until the current phase is stable in production.

## Production Release Gates

Before any phase moves from development to production, confirm all of the following:

- the phase has a clear scope and no hidden unfinished screens
- security rules and RLS were reviewed
- critical writes are protected against partial failure
- audit logging exists for important operational actions
- rollback or containment thinking is documented
- the live club team can continue working if one new feature is delayed
- any new permission is mapped before release
- any new migration was tested in development first

## High-Priority Non-Negotiables

These items must happen before the project grows wider:

1. Replace permissive RLS with real RBAC policies
2. Stop hard deletes and preserve history
3. Add membership number registry and history
4. Move critical writes into database transactions or RPCs
5. Keep development fully separate from production

## Confirmed Decisions

- Arabic-first platform
- one shared person identity across the system
- National ID is the main operational identifier
- National ID is required for every person
- visitors are stored permanently
- visitor phone number is mandatory
- membership numbers are globally unique
- dependent numbers follow the main membership number with suffixes
- separated dependents keep their old numbers in history
- dependent conversion rules are configurable
- dependent separation requires admin approval, board approval, and payment
- development and production will be separated with a simple two-environment model

## Open Decisions

These still need business discussion before implementation goes too far:

- Who can edit dependent conversion rules?
- Who can approve separation before the board step?
- Should board approval require a meeting decision number or attached document?
- Will payments be cashier-only, online, or both?
- Will NFC gates need offline mode?
- What data should board members see in dashboards?
- Should media content require approval before publishing?
- Should public sports pages show pricing?

## Working Rule for Future AI-Assisted Building

When using vibe coding or AI-assisted implementation:

- always start from this master plan
- always read `Plan/Vipe/Master-Instructions.md` before starting a phase
- work in small approved phases
- do not ask for full system generation in one pass
- review discovery before implementation
- review schema before frontend
- review permissions before release
- test in development before production

## Supporting Plan Files

The current supporting files remain useful as detailed references:

- `01-Public-Website-And-CMS.md`
- `02-People-Memberships-And-Roles.md`
- `03-Architecture-Performance-And-NFC.md`
- `04-Project-File-Structure.md`
- `05-Antigravity-Security-And-Integrity-Updates.md`
- `06-Staff-Module-Antigravity-Plan.md`
- `07-Sports-Facilities-And-Training-Module.md`

These files support this master plan, but this file should now be treated as the main planning document.
