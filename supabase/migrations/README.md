# Supabase Migrations — Phase 1: Security and Access Foundation

## Hard-Delete Direction

**Operational records must never be hard-deleted.** This is a non-negotiable project rule.

### What "hard delete" means
Calling `DELETE FROM <table> WHERE id = <id>` — removing the row permanently.

### Why it is blocked

- Membership numbers must never be reused
- Family and dependent history must remain traceable
- Audit trails must remain complete
- Visitor records are permanent
- Role assignments should be ended, not erased

### How to end or deactivate records instead

| Record type | Correct action |
|---|---|
| Person | `archived_at`, `archived_by`, `archive_reason` (Phase 2 fields) |
| Membership | `archived_at`, `archived_by`, `archive_reason` (Phase 2 fields) |
| Dependent | Set `status`, `ended_at`, `ended_by`, `end_reason` (Phase 2 fields) |
| Person role | Set `is_active = false`, `ended_at`, `ended_by` |
| System user | Set `is_active = false` |
| Membership number | Registry entry marked `is_current = false` (Phase 2) |

### RLS enforcement in Phase 1

No DELETE policy is created for:
- `system_users`
- `person_roles`
- `audit_logs`

The absence of a DELETE policy means **RLS blocks all delete attempts** on those tables for authenticated users.
The service-role admin client also never issues DELETE queries on operational data.

### Rule for future agents

> Do not add a `DELETE` SQL statement or a `DELETE` RLS policy for any operational table.
> If you are considering a delete flow, replace it with an archive, end, or cancel action.

---

## Migration Files

| File | Purpose |
|---|---|
| `20260504001_security_schema.sql` | Creates role_definitions, system_permissions, system_role_permissions, system_users, person_roles, audit_logs |
| `20260504002_permission_helper.sql` | Creates has_permission(), current_person_id(), is_system_admin() DB functions |
| `20260504003_rls_foundation.sql` | Drops permissive policies; adds scoped RLS for all Phase 1 tables |
| `20260504004_seed_permissions.sql` | Seeds 19 permission codes and 4 system roles with their assignments |

## How to Apply

Run these migrations against the **development** Supabase project only.

```bash
# From the project root
npx supabase db push --db-url <your-dev-db-url>
```

Or paste each file into the Supabase SQL Editor in order (001 → 002 → 003 → 004).

**Do not apply to production until Phase 1 passes the verification checklist.**
