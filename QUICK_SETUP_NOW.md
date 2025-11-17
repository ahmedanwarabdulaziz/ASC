# Quick Setup - Run This Now!

## Step 1: Run SQL in Supabase SQL Editor

1. **Go to**: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new
2. **Open file**: `scripts/setup-without-exec-sql.sql`
3. **Copy ALL contents** from the file
4. **Paste** into Supabase SQL Editor
5. **Click "Run"** (or press Ctrl+Enter)
6. **Wait** for all statements to execute

You should see "Success" messages for each statement.

## Step 2: Import Excel Data

After tables are created, run:

```bash
npm run import-excel-supabase
```

This will:
- ✅ Import all 3,638 members
- ✅ Automatically generate Arabic search fields
- ✅ Create search tokens and vectors
- ✅ All via database triggers!

## What Gets Created

✅ **Tables:**
- `members` - with advanced Arabic search fields
- `teams`
- `users`

✅ **Functions:**
- `normalize_arabic_text()` - Normalizes Arabic text
- `extract_arabic_tokens()` - Extracts search tokens
- `search_members()` - Advanced search function
- `get_member_by_id()` - Get member by ID
- `exec_sql()` - For future automation

✅ **Indexes:**
- GIN indexes for fast full-text search
- GIN indexes for fast array search
- B-tree indexes for exact matches
- Text pattern indexes for ILIKE queries

✅ **Triggers:**
- Auto-updates search fields on insert/update

## After Import

Your data will have:
- ✅ `name_search` - Normalized Arabic
- ✅ `name_tokens` - Array of words
- ✅ `search_vector` - Full-text search vector
- ✅ `search_tokens` - Combined tokens
- ✅ All automatically generated!

## Test Search

After import, test the search:

```sql
SELECT * FROM search_members('ابراهيم');
```

This will return results ranked by relevance!




