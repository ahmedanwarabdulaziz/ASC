# Supabase Setup Instructions

## Quick Setup (2 Options)

### Option 1: Manual SQL Execution (Recommended - 2 minutes)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new

2. **Copy SQL**: Open `supabase-migration.sql` and copy ALL contents

3. **Paste and Run**: 
   - Paste into SQL Editor
   - Click **Run** (or Ctrl+Enter)
   - Wait for "Success" messages

4. **Done!** Tables and functions are created

### Option 2: Automated Setup (Requires Database Password)

1. **Get Database Password**:
   - Go to Supabase Dashboard → Settings → Database
   - Find "Connection string" or reset password
   - Copy the connection string

2. **Set Environment Variable**:
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://postgres.xkbiqoajqxlvxjcwvhzv:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   
   # Or create .env.local file
   DATABASE_URL=postgresql://postgres.xkbiqoajqxlvxjcwvhzv:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

3. **Run Setup**:
   ```bash
   npm run setup-supabase
   ```

## After Setup

Once tables are created, import your Excel data:

```bash
npm run import-excel-supabase
```

This will import all 3,640 members from your Excel file.

## What Gets Created?

- ✅ `members` table with full-text search
- ✅ `teams` table
- ✅ `users` table
- ✅ `search_members()` function for fast Arabic search
- ✅ Automatic search vector updates via triggers
- ✅ All necessary indexes

## Verify Setup

After running SQL, verify in Supabase Dashboard:
- Table Editor → Should see `members`, `teams`, `users` tables
- SQL Editor → Run: `SELECT search_members('test');` (should work)

## Troubleshooting

**If tables already exist**: That's OK! The SQL uses `CREATE IF NOT EXISTS` and `CREATE OR REPLACE`.

**If you see errors**: Check Supabase Dashboard → Logs for detailed error messages.


