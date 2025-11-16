# How to Get Supabase Connection String

## Where to Find It

The connection string might be in different locations depending on your Supabase dashboard version:

### Method 1: Project Settings → Database
1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv
2. Click **Settings** (gear icon) in the left sidebar
3. Click **Database** tab
4. Look for:
   - **"Connection string"** section
   - **"Connection Info"** section
   - **"Connection pooling"** → Click to expand
   - **"URI"** or **"Connection URI"** format

### Method 2: Project Overview
1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv
2. Look at the project overview page
3. Check for **"Database"** card or section
4. May show connection info there

### Method 3: API Settings
1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/api
2. Look for **"Database URL"** or **"Postgres URL"**

### Method 4: Connection Pooling Section
1. On the Database Settings page you're on
2. Look for **"Connection pooling configuration"** section
3. Click to expand it
4. May show connection strings there

## Alternative: Construct It Manually

If you can't find it, we can construct it. We need to know:

1. **Your project region** (e.g., us-east-1, eu-west-1)
   - Check your project settings or billing page
   
2. **Connection type** (Pooler or Direct)
   - Pooler is usually recommended

3. **Port number** (usually 6543 for pooler, 5432 for direct)

## What the Connection String Looks Like

**Pooler format:**
```
postgresql://postgres.xkbiqoajqxlvxjcwvhzv:Anw%40r%232020@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Direct format:**
```
postgresql://postgres:Anw%40r%232020@db.xkbiqoajqxlvxjcwvhzv.supabase.co:5432/postgres
```

## Quick Test

Once you have the connection string, test it:
```bash
npm run test-connection
```

Or I can help you find your project's region and construct it automatically!



