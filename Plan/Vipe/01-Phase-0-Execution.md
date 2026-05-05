# Phase 0 Execution

## Purpose

This file turns `Phase 0: Simple Entry and Project Setup` into a practical execution checklist.

Use it when asking any coding agent to start the first real implementation work.

## Read First

Before starting Phase 0, read:

1. `Plan/00-Project-Roadmap.md`
2. `Plan/Vipe/Master-Instructions.md`
3. `Plan/01-Public-Website-And-CMS.md`
4. `Plan/03-Architecture-Performance-And-NFC.md`
5. `Plan/04-Project-File-Structure.md`
6. `Plan/05-Antigravity-Security-And-Integrity-Updates.md`

## Phase 0 Goal

Finish the minimum safe foundation so the project can start correctly.

Phase 0 is not about building the club system yet.

Phase 0 is about:

- creating or reviewing the app foundation
- connecting the app to the `development` Supabase project only
- preparing the environment structure
- preparing login/auth routes
- building the simple public entry page

## Desired End Result

At the end of Phase 0, we should have:

- one working Next.js app structure
- separate environment handling for `development` and `production`
- a confirmed connection to `development` Supabase
- a simple public landing page
- an `Enter System` path that leads toward login
- no production data usage
- no fake security shortcuts that will hurt us later

## Live Production Position

Because the full system is not ready yet, Phase 0 can be released to production only if it is limited to:

- a clean public entry page
- safe routing
- login entry path
- no unfinished internal operational screens exposed to users

If the internal shell is incomplete, keep it hidden behind auth or placeholder routes.

## Exact In-Scope Work

### 1. Project Audit Or Scaffold

- confirm whether the app already exists or must be scaffolded
- confirm the file structure follows the project plan
- keep the structure simple and ready for future modules

Recommended agent:

- `Codex`

### 2. Environment Separation

- create `.env` structure for local development
- prepare `.env.example`
- define clearly which variables belong to `development`
- define clearly which variables belong to `production`
- make sure `development` and `production` are never mixed

Recommended agent:

- `Codex`
- `Gemini` can help draft the documentation text if needed

### 3. Development Supabase Connection

- connect the app to the `development` Supabase project only
- verify the client/server setup matches the file-structure plan
- make sure no production secret is used

Recommended agent:

- `Codex`

### 4. Auth Route Preparation

- prepare login route structure
- prepare protected/internal route shape
- do not build full permissions yet
- do not bypass future security needs with unsafe temporary shortcuts

Recommended agent:

- `Codex`
- `Claude` only if there is a confusing auth architecture decision

### 5. Public Entry Page

- build a simple Arabic-first landing page
- show club identity
- include a clear `Enter System` button
- keep it mobile-friendly
- keep the scope small and clean

Recommended agent:

- `Codex` for implementation
- `Gemini` for wording, labels, or content drafting

### 6. Safe Internal Placeholder

- if needed, add a minimal authenticated shell or placeholder page
- make it obvious that the operational system is still under construction
- do not expose fake business actions

Recommended agent:

- `Codex`

### 7. Basic Deployment Readiness

- confirm environment variable naming is clear
- confirm the app can be deployed without depending on production data
- confirm the build does not assume future modules already exist

Recommended agent:

- `Codex`

## Explicitly Out Of Scope

Do not do these in Phase 0:

- full people registry
- membership workflows
- staff module
- sports module
- CMS expansion
- public dynamic content system
- production data migration
- broad RLS implementation across all business tables
- full dashboard build
- NFC or gate logic

Phase 0 should stay narrow.

## Phase 0 Deliverables

The work is complete only when these deliverables exist:

1. Project structure is in place and readable.
2. Environment separation is documented.
3. `development` Supabase connection is working.
4. Public entry page exists.
5. Login route exists.
6. Internal routes are not publicly exposed in an unsafe way.
7. Basic setup notes are documented for the next phase.

## Verification Checklist

Before calling Phase 0 done, verify:

- the app runs locally
- the public page loads correctly
- the `Enter System` path works
- auth routing does not expose internal pages by accident
- no production keys were used
- no production data was used
- environment files are understandable by a non-programmer owner later
- the structure still matches the roadmap and file-structure plan

## Production Release Rule For Phase 0

Phase 0 can move to production only if:

- it behaves like a stable public shell
- it does not expose unfinished internal tools
- it does not depend on development-only hacks
- environment variables are correctly separated
- the deployment can be repeated safely

If any of those are missing, keep Phase 0 as `development-only` until fixed.

## Best Agent Use For This Phase

- Use `Codex` for repo inspection, setup, routing, environment handling, and implementation.
- Use `Gemini` for rewriting labels, preparing simple content, or summarizing setup notes without spending expensive tokens.
- Use `Claude` only if we hit a real architecture or auth decision that needs deeper reasoning.
- Use `Antigravity` only after the scope is written clearly and kept very small.

## Suggested Work Order

1. Audit the repo and existing files.
2. Confirm or create the Next.js structure.
3. Set up environment separation.
4. Connect `development` Supabase.
5. Create the login route shape.
6. Build the simple public entry page.
7. Add any minimal protected placeholder route if needed.
8. Verify locally.
9. Decide whether this phase is safe for production release or still development-only.

## Simple Prompt For Agents

```text
Read Plan/00-Project-Roadmap.md, Plan/Vipe/Master-Instructions.md, and Plan/Vipe/01-Phase-0-Execution.md first.

Environment target:
development-only

Task:
Complete only the next unfinished item in Phase 0.

Do not:
- expand into people or membership features
- use production data
- use production secrets
- expose unfinished internal pages publicly
- weaken future security just to move faster

Definition of done:
Finish the selected Phase 0 item, verify it, and report whether it is safe for production yet.
```

## Handoff To Phase 1

Do not begin `Phase 1: Security and Access Foundation` until Phase 0 is stable.

Phase 1 should start only after:

- the project structure is settled
- the app connects cleanly to development
- the public entry and login path are working
- the team agrees the foundation is ready for real security implementation
