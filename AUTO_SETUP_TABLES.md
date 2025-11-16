# Automatic Table Setup

Since Supabase connection string formats can vary, please follow these steps:

## Option 1: Get Connection String from Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database
2. Scroll to "Connection string" section
3. Select "URI" format (not "JDBC" or "Golang")
4. Copy the connection string (it will look like: `postgresql://postgres:[YOUR-PASSWORD]@...`)
5. Replace `[YOUR-PASSWORD]` with: `Anw@r#2020`
6. Run this command:

```powershell
cd D:\Res\ASC
$env:DATABASE_URL="[PASTE_YOUR_CONNECTION_STRING_HERE]"
npm run setup-supabase
```

## Option 2: Manual SQL Execution (Fastest - 2 minutes)

1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new
2. Open `complete-setup.sql` in your project
3. Copy ALL contents
4. Paste into Supabase SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Wait for "Success" messages

After tables are created, import your data:
```bash
npm run import-excel-supabase
```

## What Gets Created?

- ✅ `members` table with full-text search
- ✅ `teams` table  
- ✅ `users` table
- ✅ `search_members()` function for Arabic search
- ✅ Automatic search vector updates
- ✅ All indexes for performance



