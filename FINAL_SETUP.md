# Complete Supabase Setup - Do This First!

## ⚡ One-Time Setup (2 minutes)

### Step 1: Create Helper Function (30 seconds)

1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new
2. Copy and paste this SQL:

```sql
-- Helper function to execute SQL (one-time setup)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
```

3. Click **Run**

### Step 2: Create All Tables (1 minute)

1. Still in SQL Editor, click **New Query**
2. Copy **ALL** contents from `supabase-migration.sql`
3. Paste and click **Run**
4. Wait for all "Success" messages

### Step 3: Import Data (30 seconds)

```bash
npm run import-excel-supabase
```

## ✅ Done!

Your database is ready with full-text search!




