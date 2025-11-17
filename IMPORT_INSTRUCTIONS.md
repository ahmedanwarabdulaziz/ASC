# Instructions: Recreate Tables and Import Data

## Step 1: Delete Tables Manually

1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv
2. Click **"Table Editor"** in left sidebar
3. For each table (`members`, `teams`, `users`):
   - Click on the table
   - Click **"Delete table"** (or use SQL Editor to drop them)

**OR use SQL Editor:**
1. Go to **SQL Editor**
2. Run this to drop everything:
```sql
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS search_members(TEXT);
DROP FUNCTION IF EXISTS get_member_by_id(UUID);
DROP FUNCTION IF EXISTS update_members_search_vector();
DROP FUNCTION IF EXISTS extract_arabic_tokens(TEXT);
DROP FUNCTION IF EXISTS normalize_arabic_text(TEXT);
DROP FUNCTION IF EXISTS exec_sql(TEXT);
```

## Step 2: Recreate Tables with Advanced Arabic Search

1. Go to **SQL Editor**
2. Open `complete-setup-advanced-arabic.sql`
3. Copy **ALL contents**
4. Paste into SQL Editor
5. Click **"Run"** (or Ctrl+Enter)
6. Wait for "Success" messages

## Step 3: Import Excel Data

After tables are created, run:

```bash
npm run import-excel-supabase
```

This will:
- ✅ Read Excel file
- ✅ Import all members
- ✅ Automatically generate:
  - `name_search` (normalized Arabic)
  - `name_tokens` (array of words)
  - `address_search`, `address_tokens`
  - `job_search`, `job_tokens`
  - `search_vector` (full-text search)
  - `search_tokens` (combined tokens)
- ✅ All via database triggers!

## Step 4: Verify

1. Go to **Table Editor** → `members` table
2. Check that:
   - All data is imported
   - `name_search` is populated (normalized Arabic)
   - `name_tokens` is populated (array)
   - `search_vector` is populated
   - `search_tokens` is populated

## What's New: Advanced Arabic Search

### Features:
- ✅ **Arabic Text Normalization**: Removes diacritics, normalizes characters
- ✅ **Token Extraction**: Splits text into searchable words
- ✅ **Multiple Search Methods**:
  - Full-text search (fastest)
  - Array contains (prefix matching)
  - ILIKE (partial matching)
- ✅ **Relevance Ranking**: Exact > Prefix > Token > Fulltext > Partial
- ✅ **Word-Order Priority**: First word matches first
- ✅ **Fast GIN Indexes**: Instant search results

### Search Function:
```sql
SELECT * FROM search_members('ابراهيم');
```

This will return results ranked by relevance!




