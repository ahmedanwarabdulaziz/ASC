# Phase 3 Execution

## Purpose

This file turns `Phase 3: Staff Foundation` into a practical execution guide.

Phase 3 is the first major reuse test of the shared identity model built in Phase 2.

It should prove that one person can safely participate in more than one operational module without identity duplication.

## Read First

Before starting Phase 3, read:

1. `Plan/00-Project-Roadmap.md`
2. `Plan/Vipe/Master-Instructions.md`
3. `Plan/Vipe/03-Phase-2-Execution.md`
4. `Plan/06-Staff-Module-Antigravity-Plan.md`
5. `Plan/02-People-Memberships-And-Roles.md`
6. `Plan/04-Project-File-Structure.md`
7. `Plan/05-Antigravity-Security-And-Integrity-Updates.md`

## Phase 3 Goal

Build the staff foundation on top of the shared `people` identity base without weakening the membership model, permissions model, or archive/history rules.

Phase 3 should make staff operations possible while keeping identity shared and business relationships separate.

## Desired End Result

At the end of Phase 3, we should have:

- staff data built as a separate relationship that reuses `people`
- no duplicated identity fields inside staff-specific tables
- clear staff organization through categories and subcategories
- permission-oriented staff grouping
- job-driven operational behavior
- optional user-account linking direction implemented safely
- create-staff, edit-staff, and end-employment flows possible
- staff settings screens possible for categories, groups, and jobs
- archive/end direction used instead of delete

## Important Boundary

Phase 3 should expand the internal operational system, but it should stay narrow and controlled.

That means:

- yes to staff structure, staff records, job/group logic, and safe staff flows
- yes to navigation and permissions required for staff operations
- yes to optional account linking if it matches the current safe auth model
- no to creating a second identity model for staff
- no to broad payroll, HR workflow, attendance, or commission systems yet
- no to sports player, coach scheduling, or training operations beyond the flags needed for future readiness

## Recommended Sub-Phases

To keep this manageable, Phase 3 should be executed in smaller parts:

### Phase 3A: Discovery And Fit Check

- inspect current `people`, memberships, permissions, audit logs, RPC style, and admin workspace patterns
- confirm exactly where Staff fits in navigation and routing
- identify naming conflicts, missing dependencies, and release risks before implementation

### Phase 3B: Staff Schema Foundation

- create staff categories, subcategories, groups, jobs, and staff members
- keep staff as a relationship to `people`, not a replacement for `people`
- enforce one active or suspended staff relationship per person

### Phase 3C: Staff Permissions And Mutations

- add `staff.*` permission codes through the existing permission system
- create safe staff RPCs or mutation paths
- enforce permission checks and audit logging

### Phase 3D: Staff List And Detail Flows

- create the staff list view and main filters
- support add staff, edit staff, and archive/end employment flows
- allow existing members to become staff without duplicating person identity

### Phase 3E: Staff Settings And Navigation

- create settings pages for categories, subcategories, groups, and jobs
- add Staff to the admin workspace navigation
- hide unavailable actions in the UI and also enforce them in the database

### Phase 3F: Admin Auth Provisioning (Account Linking)

- support admin-only auth provisioning using `service_role`
- create Supabase auth user strictly on the server
- `system_users` must be the canonical source of truth mapping `auth_user_id` to `person_id`
- treat `staff_members.user_id` strictly as a convenience mirror
- assign appropriate system roles and write audit logs
- create, link, and disable account flows

## Explicitly Out Of Scope

Do not do these in Phase 3 unless a smaller later sub-phase explicitly approves them:

- payroll workflows
- attendance tracking
- leave management
- salary or finance integration
- commission calculation engine
- coach scheduling
- sports player operations
- public website staff directory

Phase 3 must prove identity reuse and safe staff operations before wider HR or sports expansion.

## Phase 3 Deliverables

The work is complete only when these deliverables exist:

1. Staff schema foundation exists.
2. Staff permissions are defined through the existing permission system.
3. Staff mutation paths exist and respect permission checks.
4. Existing people can be reused safely when creating staff records.
5. Staff list and filter support exists.
6. Staff settings management exists for the approved scope.
7. Archive/end behavior is used instead of delete.
8. Staff navigation is integrated into the admin workspace safely.

## Verification Checklist

Before calling Phase 3 done, verify:

- a person can be both a member and a staff member without duplication
- a person cannot receive two active or suspended staff relationships incorrectly
- ending employment does not delete the person
- ending employment does not damage memberships
- staff permissions are enforced in both UI visibility and mutation logic
- staff settings writes follow the existing permission model
- critical staff writes do not leave obvious partial records
- the staff workspace fits the existing system shell cleanly

## Production Release Rule For Phase 3

Phase 3 can move to production only if:

- the first staff flows are complete enough for controlled real use
- no unfinished HR or account-provisioning flow is exposed to live users
- permission mapping is reviewed for the released scope
- staff writes are protected strongly enough against partial failure
- archive/end behavior is in place for the released scope
- the release remains small enough to recover from safely

If not, ship it in smaller sub-phases from development first.

## Best Agent Use For This Phase

- Use `Codex` for repo-aware discovery, migrations, permissions, RPCs, UI integration, and verification.
- Use `Claude` for one targeted review of tricky schema, RLS, or transactional choices.
- Use `Gemini` for labels, summaries, admin wording, and documentation support.
- Use `Antigravity` only after discovery is complete and the exact sub-phase is tightly scoped.

## Suggested Work Order

1. Finish `Phase 3A: Discovery And Fit Check`.
2. Finish `Phase 3B: Staff Schema Foundation`.
3. Finish `Phase 3C: Staff Permissions And Mutations`.
4. Finish `Phase 3D: Staff List And Detail Flows`.
5. Finish `Phase 3E: Staff Settings And Navigation`.
6. Keep `Phase 3F: Account Linking Later` narrow unless safe admin provisioning already exists.
7. Verify each sub-phase before starting the next one.

## Simple Prompt For Agents

```text
Read Plan/00-Project-Roadmap.md, Plan/Vipe/Master-Instructions.md, and Plan/Vipe/04-Phase-3-Execution.md first.

Also read Plan/06-Staff-Module-Antigravity-Plan.md before implementation.

Before editing any Next.js app code, read the relevant guide in node_modules/next/dist/docs/ because this project uses a newer Next.js version with breaking changes.

Environment target:
development-only unless this sub-phase has passed release review

Task:
Complete only the next unfinished Phase 3 staff sub-phase item.

Do not:
- duplicate people identity into staff tables
- expand into payroll, attendance, or sports operations
- invent a second permission system
- use production data
- add delete-first operational behavior

Definition of done:
Finish the selected Phase 3 sub-phase, verify it, and report whether it is safe for production now.
```

## Handoff To Phase 4

Do not begin the sports and facilities foundation phase until the staff module is stable enough to support coach and operational-role reuse without identity duplication or permission confusion.
