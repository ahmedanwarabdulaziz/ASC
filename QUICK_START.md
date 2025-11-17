# Quick Start: Supabase Setup

## ⚠️ IMPORTANT: Create Tables First!

Before importing data, you **MUST** create the database tables in Supabase.

### Step 1: Create Tables (5 minutes)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. **Copy ALL the SQL** from `scripts/create-supabase-tables.sql`
5. **Paste** into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for success messages

**You should see**: "Success. No rows returned" for each statement

### Step 2: Import Data from Excel

After tables are created, run:

```bash
npm run import-excel-supabase
```

This will import all 3,640 members from your Excel file directly to Supabase.

### Step 3: Verify

1. Go to Supabase Dashboard → **Table Editor**
2. Click `members` table
3. You should see all your data!

## What Gets Created?

- ✅ `members` table with full-text search
- ✅ `teams` table  
- ✅ `users` table
- ✅ Search function `search_members()`
- ✅ Automatic search vector updates

## Need Help?

If you see "table not found" errors, it means Step 1 wasn't completed. Go back and create the tables first!




