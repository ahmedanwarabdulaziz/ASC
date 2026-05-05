# Phase 4 Execution

## Purpose

This file turns `Phase 4: Sports and Facilities Foundation` into a practical execution guide.

Phase 4 builds the core operational structure for all athletic activities in the club. Crucially, it must **reuse the shared identity model**: Coaches are simply `staff_members`, and Players are simply `people`. 

## Read First

Before starting Phase 4, read:

1. `Plan/00-Project-Roadmap.md`
2. `Plan/Vipe/Master-Instructions.md`
3. `Plan/07-Sports-Facilities-And-Training-Module.md`
4. `Plan/Vipe/04-Phase-3-Execution.md` (To understand Staff reuse)

## Phase 4 Goal

Build the Sports and Facilities foundation so the club can organize its athletic catalog, track facilities, enroll players, and assign coaches, all without duplicating identity.

## Desired End Result

At the end of Phase 4, we should have:

- A configurable Sports Catalog (Sports, Sectors, Age Groups, Levels).
- A Facilities registry (Locations, Areas, Courts/Pools).
- Player registration (linking `people` to specific `sports`).
- Player placement into training groups with support for multiple active programs in the same sport when the business allows it.
- Medical approval rules configured per sport sector where needed.
- Medical approval recorded before payment, final program selection, and group joining when required.
- Medical approval validity tracked in months with real expiry handling.
- Training-program pricing plans with separate member/dependent and non-member prices.
- Competition-sector enrollment rules that require sports membership for non-members, while members and dependents remain exempt from that extra sports-membership requirement.
- Weekly session count stored per training group and used in pricing.
- Monthly billable session count derived from weekly session count using the fixed rule: weekly sessions multiplied by 4.
- Sports subscription payment status recorded in the system without requiring a full cashier platform in the first release.
- Accountant-confirmed payment records with paper receipt number entry and system-generated subscription detail receipt output.
- Renewal, transfer, and promotion handled as separate actions with full history preservation.
- Bulk transfer and bulk promotion tools for all players in a group or selected players only.
- Maximum player count defined and enforced for each training group.
- Attendance and check-out recorded per actual training session with a clear distinction between manual and automatic recording.
- Coach assignment (linking `staff_members` to sports/teams).
- Training Groups and Schedules built on top of facilities and coaches.
- Settings UI for Sports & Facilities.

## Important Boundary

Phase 4 expands the internal operational system heavily, but we must keep it controlled:

- yes to sports configuration, player enrollment, and training schedules.
- yes to coach assignment and facility reservations for internal training.
- yes to configurable medical approval requirements per sport sector.
- yes to blocking unsafe enrollment and activation when medical approval is required but missing or expired.
- yes to pricing plans inside sports operations when they stay tied to the training-program workflow.
- yes to competition-sector eligibility rules for non-members who need sports membership before final enrollment.
- yes to fixed monthly session entitlement based on weekly session count for pricing and subscription logic.
- yes to recording sports-subscription payment status, paper receipt numbers, and printable payment details for the first release.
- yes to keeping the design ready for future full system-led collection in a later phase.
- yes to renewal in the same level or same group for the next month when no promotion is needed.
- yes to controlled bulk movement of players between groups or levels.
- yes to attendance tracking at the session level for follow-up, safety, and audit support.
- no to public-facing booking systems (Phase 6).
- no to a full accounting or cashier subsystem in the first sports release.
- no to complex commission/payroll calculations for coaches (Out of scope).
- no to tournament brackets or match scoring engines (Out of scope).

## Recommended Sub-Phases

### Phase 4A: Discovery And Fit Check
- Inspect current `staff_members`, `people`, and `system_permissions`.
- Confirm how coach jobs are defined in `staff_jobs` (e.g., `is_training_sector`).

### Phase 4B: Sports Catalog Schema
- Create `sports`, `sport_sectors` (Practice vs Competition), `sport_levels`, and `sport_age_groups`.
- Create settings UI to manage the catalog.

### Phase 4C: Facilities Schema
- Create `facilities` (e.g., Main Building) and `facility_areas` (e.g., Football Field A).
- Ensure areas can be marked active/inactive.
- Create settings UI to manage facilities.

### Phase 4D: Player Enrollment & Coach Assignment
- Create `sport_players` linking `people` to `sports`.
- Enforce business rules (e.g., age validations if applicable, or active membership requirements).
- Allow one person to join multiple sports.
- Allow the same sport player to have more than one active training-program enrollment in the same sport when needed, such as academy plus private training.
- Treat multiple active enrollments in the same sport as an operational alert, not a hard error.
- Add medical approval as an early gate before payment, final program assignment, and training-group joining when the selected sector requires it.
- Keep medical approval reusable across sports when the approval scope and sector requirement allow it.
- For competition-sector enrollment, require sports membership for non-members before final enrollment.
- Do not require extra sports membership for existing members or dependents in the competition sector.
- Create coach assignments linking `staff_members` to sports/teams.

### Phase 4E: Training Groups & Scheduling
- Create `training_groups`.
- Create `weekly_schedules` linking training groups to `facility_areas` and `staff_members` (coaches).
- Store how many weekly sessions each training group is expected to deliver.
- Use a fixed monthly session calculation for pricing and subscription logic.
- Define a maximum player count for each training group and enforce it operationally.
- Support attendance and check-out tracking for each actual session occurrence.
- Build the main Sports Workspace UI to view players and schedules.

## Exact In-Scope Work

### 1. Shared Identity & Staff Reuse
- Players must be linked directly to `public.people`. Do not create a separate `players` identity table.
- Coaches must be linked directly to `public.staff_members`. Do not create a separate `coaches` profile table.

### 2. Permissions
- Add `sports.*` and `facilities.*` permission codes.
- Ensure only authorized staff can manage the catalog or enroll players.
- Add the permissions needed for medical approval review, entry, and override if the project decides to separate those actions.

### 3. UI Workspaces
- Build `/system/sports` for managing players and schedules.
- Build `/system/facilities` for facility management.
- Update `/system/settings` or create specific settings tabs for the Sports Catalog.
- Show a clear warning or alert in the sports workspace when a player has multiple active programs in the same sport.
- Show whether the selected sport sector requires medical approval.
- Show whether the player is medically cleared, pending, or expired before staff can continue to payment or group placement.
- Give supervisors a clear session attendance screen for marking player presence and departure.

### 4. Pricing Rules
- Use a separate pricing-plan model tied to the training-program workflow instead of storing one fixed price directly on the sport.
- Each pricing plan should support at least two prices:
  - member/dependent price
  - non-member price
- Pricing should be tied to the training group's weekly session count.
- Monthly billable sessions should follow the fixed operational rule:
  - monthly billable sessions = weekly session count * 4
- Practice-sector programs may allow non-members directly, usually at a higher price than the member/dependent price.
- Competition-sector programs should require sports membership for non-members before final enrollment.
- Existing members and dependents should not need an extra sports membership to complete competition-sector enrollment.
- Pricing history should be preserved when the plan changes later.
- Actual attendance and real calendar occurrence count should be tracked separately from the fixed monthly pricing entitlement.

### 5. Sports Payment Status Rules
- In the first release, record payment status for the sports subscription instead of building full system collection.
- The accountant should confirm payment inside the system after real-world payment is received.
- The accountant should be able to enter the paper receipt number.
- The system should be able to print a receipt or payment summary that shows:
  - payment details
  - subscription details
  - training-program details
- The system design should stay ready for a later phase where full collection happens inside the system.
- Payment confirmation should remain separate from pricing definition, even though it depends on the selected pricing plan.

### 6. Renewal, Transfer, And Promotion Rules
- End of month should not mean automatic promotion.
- A player may continue in the same level and the same group in the next month when appropriate.
- Renewal, transfer, and promotion should be treated as separate operational actions.
- Transfer to another group should preserve the previous enrollment history instead of overwriting it.
- Promotion to a higher level should be an explicit action, not an automatic side effect of month-end processing.
- Normal rule: move or transfer at the start of a new month.
- Exception rule: same-month transfer may be allowed only through a controlled admin-approved path when the business needs it.
- The system should support bulk actions for:
  - moving all players in a group
  - moving only selected players from a group
- Bulk actions should preview the affected players and clearly show blocked cases such as medical, payment, capacity, or eligibility issues.

### 7. Attendance And Session Tracking Rules
- Attendance should be recorded against actual session occurrences, not only against the abstract training-group definition.
- Supervisors should normally record attendance and departure manually in the system.
- The system should support at least:
  - attendance/presence
  - check-in
  - check-out
- If the supervisor starts recording attendance manually, the system may auto-complete only the remaining unprocessed players.
- Automatic attendance must be clearly marked as automatic and must never be indistinguishable from manual attendance.
- Auto-recorded attendance should remain reviewable and correctable later by authorized staff.
- If a player has check-in without check-out, that should remain visible for follow-up and safety review.

### 8. Medical Approval Rules
- Each sport sector should be configurable to require medical approval or not, because business rules may change.
- Practice and Competition sectors may have different medical approval requirements.
- Medical approval should happen before payment, final program selection, and training-group enrollment when the selected sector requires it.
- Medical approval should not be tied too narrowly to one sport if the business wants it reusable across multiple sports under the same valid scope.
- When entering a medical approval for a child, staff should record how many months it remains valid from the issue date.
- The system should store issue date, validity in months, and expiry date so old approvals keep their original rule even if defaults change later.
- Expired medical approval must block the gated workflow steps until renewed.

### 9. Recommended Operational Data Additions
- Add a pricing-plan table for training programs, for example `training_group_pricing_plans`, that stores:
  - sport or group scope
  - sector scope
  - member/dependent price
  - non-member price
  - weekly session count snapshot
  - monthly billable session count snapshot
  - effective date range
  - active status
- Add a monthly sports-subscription table, for example `sport_program_subscriptions`, that stores:
  - player or enrollment reference
  - training group reference
  - billing month start
  - billing month end
  - selected pricing plan
  - expected monthly session count
  - payment status
  - paper receipt number
  - printable receipt reference or generated document metadata
- Add a medical-approval table, for example `sport_medical_approvals`, that stores:
  - person reference
  - sector type or sector scope
  - issue date
  - validity in months
  - expiry date
  - status
  - notes or attachment reference
- Add actual session-occurrence rows, for example `training_session_occurrences`, so attendance is recorded against real sessions rather than only schedule templates.
- Add attendance rows, for example `training_session_attendance`, that store:
  - session occurrence reference
  - player or enrollment reference
  - attendance status
  - check-in time
  - check-out time
  - recording source: manual or automatic
  - recorded by
  - review or correction notes
- Keep renewal, transfer, and promotion history through enrollment history and audit logs.
- If bulk actions become complex, add a batch/action log table later so large group moves remain traceable.

## Verification Checklist

Before calling Phase 4 done, verify:
- [x] A person can be enrolled as a player in multiple sports.
- [x] A player can hold more than one active training-program enrollment in the same sport when the business needs it.
- [ ] Multiple active programs in the same sport appear as an alert to staff instead of being silently ignored.
- [ ] Pricing plans support separate member/dependent and non-member prices.
- [ ] Practice-sector programs can price non-members differently from members/dependents.
- [ ] Competition-sector enrollment requires sports membership for non-members before final enrollment.
- [ ] Competition-sector enrollment does not require extra sports membership for members and dependents.
- [x] Weekly session count is stored for each training group.
- [ ] Monthly billable sessions are calculated from weekly session count using the fixed x4 rule.
- [ ] Sports subscription payment status can be recorded without a full cashier workflow.
- [ ] The accountant can enter the paper receipt number.
- [ ] The system can print payment and program details for the subscription.
- [ ] A player can renew into the same level and same group in the next month without forcing promotion.
- [ ] Renewal, transfer, and promotion are treated as separate actions.
- [ ] Bulk move of all players in a group works safely.
- [ ] Bulk move of selected players in a group works safely.
- [x] Training-group capacity is enforced through the configured maximum player count.
- [ ] Attendance can be recorded per actual session.
- [ ] Manual attendance is distinguishable from automatic attendance.
- [ ] Automatic completion affects only the remaining unprocessed players.
- [ ] Check-in without check-out remains visible for review.
- [ ] A sport sector can be configured to require medical approval or not.
- [ ] Practice and Competition can use different medical approval rules.
- [ ] When medical approval is required, payment and group joining are blocked until valid approval exists.
- [ ] Medical approval validity in months is stored and expiry is enforced correctly.
- [x] A coach is selected from the existing staff list, filtered by training-sector jobs.
- [x] Facilities cannot be deleted if they have active schedules (use archive/suspend).
- [x] Permissions correctly gate access to the sports module.

## Suggested Work Order

## Detailed Remaining Work Order (Phase 4F - 4I)

The structural foundation (Catalogs, Facilities, Basic Enrollments, and Training Groups) is mostly complete. The next phase must introduce operational controls, financial rules, and attendance. Start these one by one:

### Step 1: Medical Approvals & Requirements (Phase 4F)
- Add a `requires_medical_approval` boolean column to `sport_sectors` (default false).
- Create the `sport_medical_approvals` table linking `people` to specific sector scopes (or globally), tracking `issue_date`, `validity_months`, `expiry_date`, and `status`.
- Implement `sport_medical_approvals_rls` and necessary permission codes.
- Create RPCs to check if a player has valid medical approval for a specific sector, returning true/false to block enrollments later.

### Step 2: Pricing Plans & Membership Rules (Phase 4G)
- Create `training_group_pricing_plans` linking to `sports` or `sport_sectors` with `member_price`, `non_member_price`, `weekly_session_count`, `monthly_session_count_snapshot` (x4 rule), `valid_from`, and `is_active`.
- Add an RPC to calculate the exact price for a given `person_id` trying to join a `training_group_id`, factoring in whether the person holds an active membership, and returning the correct price.
- If the sector is `competition`, enforce the rule that non-members cannot join unless they acquire a sports membership first.

### Step 3: Subscriptions & Payment Workflows (Phase 4H)
- Create the `sport_program_subscriptions` table to represent monthly billing cycles for active enrollments.
- Track `billing_month`, `expected_sessions`, `payment_status` (pending/paid), and `receipt_number`.
- Create a secure workflow RPC to confirm payment, allowing the accountant to enter the paper receipt number, logging this action to `audit_logs`.

### Step 4: Enrollment Lifecycle & Bulk Actions (Phase 4I)
- Create RPCs for safe enrollment lifecycle management:
  - `renew_enrollment`: Move to the next month in the same group.
  - `transfer_enrollment`: Move to another group, preserving history.
  - `promote_enrollment`: Move to a higher level.
- Build bulk action capabilities (e.g., `bulk_transfer_players`) that run these individual RPCs iteratively, collecting errors (like missing medical approvals or lack of capacity) without failing the whole batch.

### Step 5: Session Occurrences & Attendance (Phase 4J)
- Create `training_session_occurrences` table representing actual real-world session instances (not just schedule templates).
- Create `training_session_attendance` table tracking `check_in_time`, `check_out_time`, and `recording_source` (manual vs automatic).
- Implement RPC to allow supervisors to mark attendance, with the ability to auto-complete unmarked players as absent or auto-attended at the end of a session.

### Step 6: UI / Frontend Implementation
- Implement the admin interfaces for Pricing Plans and Medical Approvals.
- Build the workflow dialogs for Enrolling a player (incorporating medical check and pricing calculations).
- Build the Payment Confirmation UI for the accountant.
- Build the Session Attendance screen for the supervisors.
