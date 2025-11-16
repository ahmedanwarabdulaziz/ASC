# 🚀 START HERE - Supabase Setup

## ⚡ Quick Setup (2 Steps, 2 Minutes)

### Step 1: Create Tables (1 minute) ⚠️ REQUIRED FIRST!

**You MUST do this before importing data!**

1. **Click this link**: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new

2. **Copy ALL SQL**: Open `complete-setup.sql` file and copy everything

3. **Paste & Run**: 
   - Paste into SQL Editor
   - Click **Run** button
   - Wait for "Success" messages

### Step 2: Import Data (1 minute)

After tables are created, run:

```bash
npm run import-excel-supabase
```

## ✅ That's It!

Your database is ready with:
- ✅ 3,640 members imported
- ✅ Full-text search enabled
- ✅ Professional Arabic search
- ✅ Word-order priority

## What the SQL Creates

The `complete-setup.sql` file creates:
- `members` table with search_vector
- `teams` table
- `users` table
- `search_members()` function for fast search
- Automatic search updates
- All indexes

## Need Help?

If you see "table not found" errors, it means Step 1 wasn't completed. Go back and run the SQL!



