# Master Instructions

## Purpose

This file is the standing instruction sheet for any coding agent working on the Assiut Sporting Club app.

It exists to keep all AI-assisted work aligned with the roadmap, the live production reality, and the step-by-step build order.

## Mandatory Reading Order

Before starting any task, the agent must read these files in order:

1. `Plan/00-Project-Roadmap.md`
2. This file: `Plan/Vipe/Master-Instructions.md`
3. The module-specific plan file related to the current task
4. `Plan/05-Antigravity-Security-And-Integrity-Updates.md` for any schema, permissions, or operational workflow change
5. `Plan/04-Project-File-Structure.md` before structural code decisions

## Operating Reality

The app is expected to go live while development continues.

That means:

- there are only two environments: `development` and `production`
- development is for building, testing, and reviewing changes
- production is the live club system and must stay stable
- no unfinished feature should appear in production
- every change must be safe to release in small batches

## Non-Negotiable Rules

- Never connect development work to live production data.
- Never use production secrets inside development.
- Never build directly against production as a shortcut.
- Never expose unfinished operational flows to live users.
- Never use permissive RLS like "all authenticated users have full access".
- Never hard-delete operational records.
- Never duplicate person identity across modules.
- Always keep National ID required and unique.
- Always review permissions before release.
- Always test in development before production.
- Always force numbers to display in standard English (Latin) format (0-9) instead of Arabic-Indic numerals, both in UI and input fields.

## Standard Delivery Sequence

Every task or phase should follow this order:

1. Confirm the exact scope from the roadmap and module plan.
2. Check whether the work affects live production behavior.
3. Review schema and permission impact before UI work.
4. Build the smallest complete version in development.
5. Test the operational flow in development.
6. Review migrations, RLS, and audit implications.
7. Prepare a small production-safe release batch.
8. Release to production only after the batch is stable.
9. Verify the live result after deployment.
10. Update planning notes if decisions changed.

## Required Output For Every AI Task

Each coding agent should report back using this structure:

1. Goal of this step
2. What files or modules were reviewed
3. What was changed
4. What still remains unfinished
5. What should be tested next
6. Whether the change is safe for production now or still development-only

## Production Safety Checklist

Before approving a production release, confirm:

- the scope is small and clear
- the feature is complete enough for real staff use
- any unfinished pieces are hidden or blocked
- permissions are mapped correctly
- RLS was reviewed
- critical writes are transactional where needed
- audit logging exists for sensitive operations
- rollback or containment thinking was considered
- the club can continue working normally after release

## Phase-By-Phase Working Method

Use this pattern for every roadmap phase:

### Step A: Discovery

- review the roadmap
- review the matching module plan
- list confirmed decisions
- list open questions only if they block safe implementation

Recommended agent:

- `Gemini` for broad reading, summarizing, and organizing long notes cheaply
- `Codex` for repo-aware discovery when the answer depends on actual files
- `Claude` only if a deep reasoning pass is truly needed

### Step B: Technical Design

- define tables, flows, permissions, and release boundaries
- keep the design small enough for one safe batch
- identify what stays development-only until later

Recommended agent:

- `Codex` for technical design tied to the real codebase
- `Claude` for tricky architecture or schema tradeoffs
- `Gemini` for drafting decision summaries after the technical direction is known

### Step C: Implementation

- build only the approved scope
- start with backend, schema, permissions, and audit-sensitive logic
- add UI only after the data and access model are clear

Recommended agent:

- `Codex` for code edits, refactors, migrations, and reviewable implementation
- `Antigravity` for larger scoped build passes after the rules are already clear
- `Gemini` for repetitive content, labels, documentation drafts, and low-risk expansion work

### Step D: Verification

- test the full flow in development
- check edge cases
- confirm no production-only data or secrets were used
- confirm the release can be shipped without exposing unfinished pieces

Recommended agent:

- `Codex` for code review, test review, and release-readiness checks
- `Claude` for one focused high-risk review if the change affects security, permissions, or irreversible business rules

### Step E: Release Note

- write a short explanation of what changed
- state whether it is safe for production
- list follow-up work for the next step

Recommended agent:

- `Gemini` for concise release-note drafting
- `Codex` if the note must reference exact files and technical details

## Token-Saving Agent Guidance

Because `Claude` tokens run quickly, use agents intentionally:

- Prefer `Gemini` for long brainstorming, plan cleanup, first-draft writing, and repeated summaries.
- Prefer `Codex` for file-based implementation, code review, plan-to-code translation, and production-safety checks.
- Use `Claude` only for high-value deep reasoning: difficult schema decisions, RLS policy review, architecture tradeoffs, or prompt design for another agent.
- Use `Antigravity` only with tightly scoped instructions, not open-ended "build the whole system" requests.

## How To Prompt Any Coding Agent

When giving a task to any agent, include:

- the current roadmap phase
- whether the task is `development-only` or `production-release-ready`
- the exact files to read first
- the exact scope that is allowed
- what must not be changed
- the definition of done

## Safe Prompt Template

Use a prompt like this:

```text
Read Plan/00-Project-Roadmap.md and Plan/Vipe/Master-Instructions.md first.

Current phase:
[write the roadmap phase here]

Environment target:
[development-only or production-release-ready]

Task:
[write the exact small task here]

Read also:
[list the module plan files here]

Do not:
- expand scope
- weaken security
- use production data
- expose unfinished UI in production

Definition of done:
[write the expected result here]
```

## File Growth Rule

This file is expected to grow over time.

When a new rule keeps repeating across tasks, add it here instead of trusting memory.

## Current Standing Priorities

At this stage, agents should keep these priorities at the top:

1. Keep development and production fully separate.
2. Build in small release-safe phases.
3. Secure permissions and RLS before broad feature growth.
4. Protect membership history and identity integrity.
5. Avoid wasting expensive-token agents on tasks that cheaper agents can handle.
