# Phase 1 Execution

## Purpose

This file turns `Phase 1: Security and Access Foundation` into a practical execution guide.

Phase 1 is the first real backend foundation phase.

It is where we create the access and safety base before wider business growth.

## Read First

Before starting Phase 1, read:

1. `Plan/00-Project-Roadmap.md`
2. `Plan/Vipe/Master-Instructions.md`
3. `Plan/Vipe/01-Phase-0-Execution.md`
4. `Plan/03-Architecture-Performance-And-NFC.md`
5. `Plan/04-Project-File-Structure.md`
6. `Plan/05-Antigravity-Security-And-Integrity-Updates.md`
7. `Plan/02-People-Memberships-And-Roles.md`

## Phase 1 Goal

Build the minimum real security layer so future modules do not grow on unsafe assumptions.

This phase should make the system safer before it becomes larger.

## Desired End Result

At the end of Phase 1, we should have:

- a clear auth-to-person or auth-to-system-user mapping direction
- permission codes defined
- basic system roles defined
- permission assignment structure defined
- helper permission checks prepared
- RLS direction implemented for the first protected areas
- audit logging foundation prepared
- hard-delete direction blocked for operational tables

## Important Boundary

Phase 1 is allowed to create technical and security tables in Supabase.

Phase 1 is not the phase for broad business data creation.

That means:

- yes to permissions, system user mapping, and audit foundations
- yes to helper functions and RLS policies
- no to full people and membership operational rollout yet

## Exact In-Scope Work

### 1. Auth Strategy Confirmation

- confirm the intended login identifier direction
- confirm how app users map to internal records
- keep the auth design simple enough for the first secure release

Recommended agent:

- `Codex`
- `Claude` only if the auth tradeoff becomes complicated

### 2. Security Schema Foundation

- create security-related tables if missing
- define permission codes
- define role-to-permission mapping
- define system user mapping structure

Examples may include:

- `system_permissions`
- `system_role_permissions`
- `system_users`

Recommended agent:

- `Codex`

### 3. Permission Logic Foundation

- create helper functions such as `has_permission(...)`
- decide how active roles are checked
- prepare database-side permission enforcement

Recommended agent:

- `Codex`
- `Claude` for one targeted review if policy logic becomes tricky

### 4. Initial RLS Cleanup

- remove unsafe open-access policies
- replace them with scoped policies
- keep the first permission set small but real

Recommended agent:

- `Codex`

### 5. Audit Logging Foundation

- create the base audit log table or documented structure
- define which actions must be logged first
- make sure future sensitive operations have a logging path

Recommended agent:

- `Codex`

### 6. Hard-Delete Safety Direction

- block or avoid hard deletes for operational records
- document archive/end/cancel behavior direction
- make sure agents do not add delete-first flows later

Recommended agent:

- `Codex`

### 7. Security-Focused Validation

- verify that development still does not use production data
- verify there are no browser-exposed secrets
- verify the app no longer depends on permissive access assumptions

Recommended agent:

- `Codex`
- `Claude` for one high-value security review if needed

## Explicitly Out Of Scope

Do not do these in Phase 1:

- full people registry implementation
- full memberships implementation
- family/dependent flows
- sports operations
- staff operational module
- public CMS expansion
- NFC or gate integration
- board workflow implementation
- payment implementation

Phase 1 is the safety base, not the main business rollout.

## Phase 1 Deliverables

The work is complete only when these deliverables exist:

1. Security-related schema foundation exists.
2. Permission codes and role mapping structure exist.
3. User-to-system mapping direction is implemented or clearly documented.
4. Unsafe permissive RLS is removed from the relevant areas.
5. Audit logging foundation exists.
6. Hard-delete direction is blocked or documented into the implementation base.
7. The project is ready for safe business-table work in Phase 2.

## Verification Checklist

Before calling Phase 1 done, verify:

- no broad "all authenticated users full access" policy remains in the implemented scope
- permission helper logic works as expected
- security tables use clean naming and clear relationships
- service-role secrets are not exposed in client code
- future business writes can rely on this base
- nothing in this phase requires live production data

## Production Release Rule For Phase 1

Phase 1 can move to production only if:

- it improves safety rather than adding unstable complexity
- it does not break the public entry or login path
- the implemented RLS is understood and tested
- audit logging foundation does not create blocking failures
- the release is small enough to recover from if needed

If those are not confirmed, keep Phase 1 in `development-only`.

## Best Agent Use For This Phase

- Use `Codex` for migrations, helper functions, auth mapping, policy work, and validation.
- Use `Claude` for one narrow deep review of RLS, auth direction, or permission logic when needed.
- Use `Gemini` for summarizing permission lists, policy notes, or admin-facing explanations.
- Do not use `Antigravity` for open-ended security architecture work.

## Suggested Work Order

1. Confirm auth and user-mapping direction.
2. Create security schema foundation.
3. Add permission helper logic.
4. Replace unsafe RLS assumptions.
5. Add audit logging foundation.
6. Confirm hard-delete blocking direction.
7. Verify locally in development.
8. Decide whether the phase is safe for production release.

## Simple Prompt For Agents

```text
Read Plan/00-Project-Roadmap.md, Plan/Vipe/Master-Instructions.md, and Plan/Vipe/02-Phase-1-Execution.md first.

Environment target:
development-only unless explicitly approved for production readiness review

Task:
Complete only the next unfinished Phase 1 security item.

Do not:
- expand into full people or membership business flows
- use production data
- add permissive access shortcuts
- expose secrets to client code

Definition of done:
Finish the selected Phase 1 item, verify it, and report whether it is safe for production now.
```

## Handoff To Phase 2

Do not begin Phase 2 business-table expansion until Phase 1 is stable enough that new business data will grow on a secure base.
