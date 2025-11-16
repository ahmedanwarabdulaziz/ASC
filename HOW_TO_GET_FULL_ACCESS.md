# How to Get Full Database Access from Supabase

Based on Supabase documentation and best practices, here's how to get full access:

## Method 1: Get Database Connection String (For Direct PostgreSQL Access)

### Step 1: Access Database Settings
1. Go to: **https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv**
2. Click **"Settings"** (gear icon) in the left sidebar
3. Click **"Database"** tab

### Step 2: Find Connection String
According to Supabase documentation, the connection string is located in:

**Option A: Connection Pooling Section**
- Scroll to **"Connection pooling configuration"** section
- Click to expand it
- You should see connection strings in different formats:
  - **URI** (what we need)
  - JDBC
  - Golang
  - etc.
- **Select "URI" format**
- Copy the connection string

**Option B: Connection Info Section**
- Look for **"Connection Info"** or **"Connection string"** section
- Should show the database connection details

### Step 3: Use the Connection String
The connection string will look like:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Replace `[PASSWORD]` with your password: `Anw@r#2020`

## Method 2: Use Service Role Key (For API Access)

### Step 1: Get Service Role Key
1. Go to: **https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/api**
2. Find **"Service Role Key"** section
3. Click **"Reveal"** to show the key
4. Copy the key

### Step 2: Use Service Role Key
- ✅ Already configured in `lib/supabase.ts`
- ✅ Gives full database access via REST API
- ✅ Bypasses Row Level Security (RLS)
- ❌ **Cannot execute arbitrary SQL** (security restriction)

**Note**: Service Role Key works for data operations but NOT for DDL (CREATE TABLE, etc.) via REST API.

## Method 3: Direct PostgreSQL Connection (Full Access)

### What You Need:
1. **Database Password**: `Anw@r#2020` ✅ (you have this)
2. **Connection String**: Need from dashboard
3. **Hostname**: Depends on your project's region

### Connection String Format:
```
postgresql://postgres:[PASSWORD]@[HOSTNAME]:[PORT]/postgres
```

**Common Formats:**
- **Pooler**: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
- **Direct**: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

## Method 4: Supabase CLI (Alternative)

### Install Supabase CLI:
```bash
npm install -g supabase
```

### Login and Link:
```bash
supabase login
supabase link --project-ref xkbiqoajqxlvxjcwvhzv
```

### Execute SQL:
```bash
supabase db execute --file complete-setup.sql
```

This gives full access to execute SQL files directly.

## What Each Method Provides

| Method | Access Level | Can Execute SQL | Notes |
|--------|-------------|----------------|-------|
| **Connection String** | Full PostgreSQL | ✅ Yes | Direct database access |
| **Service Role Key** | Full via API | ❌ No | Data operations only |
| **Supabase CLI** | Full | ✅ Yes | Requires CLI setup |
| **SQL Editor** | Full | ✅ Yes | Manual copy/paste |

## Recommended Approach

**For Automatic SQL Execution:**
1. Get connection string from **Settings → Database → Connection Pooling**
2. Add to `.env.local` file
3. Use `npm run execute-sql` to run SQL automatically

**For Current Setup:**
- Manual SQL Editor works fine ✅
- Service Role Key already configured ✅
- All features working ✅

## Security Notes

⚠️ **Important:**
- **Connection String**: Never commit to git, keep in `.env.local` (already in `.gitignore`)
- **Service Role Key**: Already secure in `lib/supabase.ts`, never expose to client
- **Database Password**: Keep secure, use environment variables

## Next Steps

1. **Check Connection Pooling Section** in Database Settings
2. **Copy the URI format connection string**
3. **Add to `.env.local`**:
   ```env
   DATABASE_URL=postgresql://postgres.xxx:Anw%40r%232020@...
   ```
4. **Test it**:
   ```bash
   npm run test-connection
   ```
5. **Then automatic SQL execution will work!**

---

## Quick Reference

- **Database Settings**: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database
- **API Settings**: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/api
- **Project Overview**: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv

The connection string is definitely in the **Database Settings → Connection Pooling** section!



