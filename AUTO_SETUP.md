# Automatic Supabase Setup

## ⚡ Quick Setup (2 Minutes)

Since Supabase requires manual SQL execution for security, here's the fastest way:

### Step 1: Create Tables (1 minute)

1. **Open SQL Editor**: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new

2. **Copy SQL**: Open `supabase-migration.sql` in this project and copy **ALL** contents

3. **Paste & Run**: 
   - Paste into SQL Editor
   - Click **Run** button (or press Ctrl+Enter)
   - Wait for "Success" messages

### Step 2: Import Data (1 minute)

```bash
npm run import-excel-supabase
```

This imports all 3,640 members from your Excel file.

## ✅ Done!

Your database is now set up with:
- Full-text search support
- Arabic search optimization
- Word-order priority ranking
- All tables and functions

## What the SQL Creates

- **members** table with search_vector for fast search
- **teams** table
- **users** table  
- **search_members()** function for professional Arabic search
- Automatic search vector updates via triggers
- All necessary indexes

## Verify

After setup, check Supabase Dashboard → Table Editor:
- Should see `members` table
- Should see `teams` table
- Test search: Run `SELECT search_members('test');` in SQL Editor




