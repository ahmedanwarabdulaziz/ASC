# Phase 2 Execution

## Purpose

This file turns `Phase 2: People and Membership Foundation` into a practical execution guide.

Phase 2 is the first real business-data phase.

This is where the first important operational tables should begin.

## Read First

Before starting Phase 2, read:

1. `Plan/00-Project-Roadmap.md`
2. `Plan/Vipe/Master-Instructions.md`
3. `Plan/Vipe/02-Phase-1-Execution.md`
4. `Plan/02-People-Memberships-And-Roles.md`
5. `Plan/03-Architecture-Performance-And-NFC.md`
6. `Plan/04-Project-File-Structure.md`
7. `Plan/05-Antigravity-Security-And-Integrity-Updates.md`

## Phase 2 Goal

Build the core people and membership foundation correctly before adding staff, sports, payments, or advanced workflows.

Phase 2 should create the shared identity base the rest of the system depends on.

## Desired End Result

At the end of Phase 2, we should have:

- one shared `people` identity foundation
- National ID uniqueness enforced
- internal person code generation direction implemented
- first membership foundation tables created
- dependent and family-link direction prepared
- membership number uniqueness and history foundation prepared
- create-person and create-working-member flows possible
- add-dependent flow possible in a safe first version
- archive/end direction used instead of delete

## Important Boundary

Phase 2 is where real business tables should begin.

But Phase 2 should still stay focused on the minimum core.

That means:

- yes to people, memberships, family/dependent links, and number-history foundations
- yes to safe create/update/archive behavior
- no to large advanced workflows unless they are required for the core to stay correct

## Recommended Sub-Phases

To keep this manageable, Phase 2 should be executed in smaller parts:

### Phase 2A: People Registry

- create `people`
- enforce unique National ID
- generate internal person code
- support the first operational search assumptions

### Phase 2B: Working Membership Core

- create working membership foundation
- support manually entered membership numbers
- enforce global uniqueness for working membership numbers

### Phase 2C: Dependents And Family Links

- create family/dependent link structures
- support wife, husband, son, daughter, father, and mother
- support add-dependent flow
- prevent duplicate identity creation

### Phase 2D: Number History And Safe Lifecycle

- create membership number history or registry foundation
- prevent number reuse
- use archive/end instead of delete
- prepare status-aware lifecycle handling

### Phase 2E: Separation And Conversion Later

- keep advanced separation/conversion logic narrow
- do not force the full board/payment workflow into early core delivery unless it is already well-defined and stable

## Exact In-Scope Work

### 1. Shared Identity Foundation

- create the `people` base table and related types if missing
- keep one human as one shared identity
- enforce National ID as required and unique
- prepare search by National ID first

Recommended agent:

- `Codex`

### 2. Internal Identity Support

- generate internal person codes
- keep UUIDs for technical relations
- keep National ID as the operational identifier

Recommended agent:

- `Codex`

### 3. Membership Core Tables

- create the minimum membership tables needed for working memberships
- support manually entered membership numbers
- keep business meaning clear in the schema

Recommended agent:

- `Codex`
- `Claude` only for a narrow schema review if needed

### 4. Membership Number Protection

- enforce global uniqueness
- create history or registry foundation
- prevent number reuse after archive, correction, or separation

Recommended agent:

- `Codex`

### 5. Family And Dependent Structure

- define how dependents attach to the main member
- support the confirmed relation set
- create a safe first dependent flow

Recommended agent:

- `Codex`

### 6. Safe Operational Writes

- keep critical create flows transactional where possible
- avoid partial person/membership creation
- prepare audit-friendly write paths

Recommended agent:

- `Codex`
- `Claude` if one focused transactional design review is needed

### 7. Archive And History Direction

- use archive/end/cancel instead of delete
- preserve number history
- preserve relationship history where needed

Recommended agent:

- `Codex`

## Explicitly Out Of Scope

Do not do these in Phase 2 unless a smaller later sub-phase explicitly approves them:

- staff module rollout
- coach and sports operations
- public CMS expansion
- payments implementation
- visitor access operations
- NFC/gate implementation
- advanced dashboards
- full board workflow system
- large reporting features

Phase 2 must protect the core from scope explosion.

## Phase 2 Deliverables

The work is complete only when these deliverables exist:

1. `people` identity foundation exists.
2. National ID uniqueness is enforced.
3. Internal person code direction exists.
4. Membership core schema exists.
5. Dependent/family foundation exists.
6. Membership number uniqueness and history foundation exists.
7. Safe create flows exist for the first business operations.
8. Archive/end direction is used instead of delete.

## Verification Checklist

Before calling Phase 2 done, verify:

- the same person cannot be created twice with the same National ID
- membership numbers cannot conflict across supported types in the implemented scope
- dependents do not create duplicated people incorrectly
- archive/end behavior is available where delete would be dangerous
- critical writes do not leave obvious partial records
- future staff and sports modules can reuse the same person record cleanly

## Production Release Rule For Phase 2

Phase 2 can move to production only if:

- the first people and membership flows are complete enough for real controlled use
- the data rules are stronger than manual workarounds
- identity duplication risk is meaningfully reduced
- number history and non-delete behavior are in place for the released scope
- the release is small enough to support real operations safely

If not, ship it in smaller sub-phases from development first.

## Best Agent Use For This Phase

- Use `Codex` for schema design, migrations, transactional flows, and implementation tied to the real repo.
- Use `Claude` for one targeted review of tricky schema choices, history rules, or conversion logic.
- Use `Gemini` for plan summaries, admin wording, and documentation support.
- Use `Antigravity` only when the exact sub-phase is already tightly defined.

## Suggested Work Order

1. Finish `Phase 2A: People Registry`.
2. Finish `Phase 2B: Working Membership Core`.
3. Finish `Phase 2C: Dependents And Family Links`.
4. Finish `Phase 2D: Number History And Safe Lifecycle`.
5. Keep `Phase 2E: Separation And Conversion` for later unless needed sooner.
6. Verify each sub-phase before starting the next one.

## Simple Prompt For Agents

```text
Read Plan/00-Project-Roadmap.md, Plan/Vipe/Master-Instructions.md, and Plan/Vipe/03-Phase-2-Execution.md first.

Environment target:
development-only unless this sub-phase has passed release review

Task:
Complete only the next unfinished Phase 2 sub-phase item.

Do not:
- expand into staff, sports, payments, or NFC
- weaken identity or history rules
- use production data
- add delete-first operational behavior

Definition of done:
Finish the selected Phase 2 sub-phase, verify it, and report whether it is safe for production now.
```

## Handoff To Phase 3

Do not begin the staff foundation phase until the shared people and membership core is stable enough to be reused confidently across modules.
