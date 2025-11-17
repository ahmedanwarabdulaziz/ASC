# Supabase Migration Guide

## Step 1: Create Database Tables

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy the entire contents of `scripts/create-supabase-tables.sql`
5. Paste and click **Run**
6. Wait for all statements to execute successfully

## Step 2: Run Migration Script

```bash
npm run migrate-to-supabase
```

This will:
- Export all members from Firebase
- Export all teams from Firebase
- Import everything to Supabase
- Set up full-text search vectors automatically

## Step 3: Verify Migration

1. Go to Supabase Dashboard → Table Editor
2. Check the `members` table - you should see all your data
3. Check the `teams` table - you should see all teams

## What's Different?

### Better Search Performance
- Uses PostgreSQL full-text search (tsvector/tsquery)
- Much faster than Firebase array matching
- Better Arabic text search support

### Database Structure
- `members` table with full-text search vector
- `teams` table
- `users` table for authentication
- Automatic search vector updates via triggers

### API Changes
- All API routes now use Supabase
- Search uses PostgreSQL full-text search
- Better performance and accuracy

## Troubleshooting

### If migration fails:
1. Make sure tables are created (Step 1)
2. Check Supabase connection in `lib/supabase.ts`
3. Verify service role key is correct

### If search doesn't work:
1. Check if `search_members` function exists in Supabase
2. Run the SQL from `scripts/create-supabase-tables.sql` again
3. Check Supabase logs for errors

## Next Steps

After migration:
1. Test the search functionality
2. Update any custom queries to use Supabase
3. Consider removing Firebase dependencies if no longer needed




