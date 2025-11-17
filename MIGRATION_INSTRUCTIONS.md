# Supabase Migration Instructions

## Step 1: Create Database Tables in Supabase

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `xkbiqoajqxlvxjcwvhzv`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the **entire contents** of `scripts/create-supabase-tables.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for all statements to execute successfully
9. You should see "Success. No rows returned" for each statement

**Important**: Make sure all statements execute without errors!

## Step 2: Import Data from Excel

Run the import script:

```bash
npm run import-excel-supabase
```

This will:
- Read the Excel file (`ASC .xlsx`)
- Map columns correctly (A→member_id, B→name, C→address, D→job, E→phone, F→mobile)
- Import all members to Supabase
- Automatically create search vectors for full-text search

## Step 3: Verify Data

1. Go to Supabase Dashboard → **Table Editor**
2. Click on `members` table
3. You should see all your members with:
   - member_id
   - name
   - address
   - job
   - phone
   - mobile
   - search_vector (automatically populated)

## Step 4: Test Search

The search should now work much faster with PostgreSQL full-text search!

## What's Different?

### Database Structure
- **members** table with UUID primary key
- **teams** table
- **users** table for authentication
- Full-text search vector (`search_vector`) automatically updated via triggers

### Search Performance
- Uses PostgreSQL `tsvector`/`tsquery` for native full-text search
- Much faster than Firebase array matching
- Better Arabic text search support
- Automatic relevance ranking

### API Changes
- All API routes now use Supabase
- Search uses PostgreSQL full-text search function
- Better performance and accuracy

## Troubleshooting

### If tables creation fails:
- Make sure you're running the SQL in Supabase SQL Editor
- Check for any syntax errors
- Some "already exists" errors are OK if running multiple times

### If import fails:
- Check that Excel file exists at `D:\Res\ASC\ASC .xlsx`
- Verify Supabase connection in `lib/supabase.ts`
- Check Supabase logs for detailed errors

### If search doesn't work:
- Verify `search_members` function exists (check in SQL Editor)
- Make sure `search_vector` column is populated (check table)
- Check API logs for errors

## Next Steps

After successful migration:
1. Test search functionality at `/members`
2. Update any remaining Firebase references
3. Consider removing Firebase dependencies if no longer needed




