# How to Find Your Supabase Connection String

Since the connection string isn't in the Database Settings page, try these locations:

## Method 1: API Settings Page

1. Go to: **https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/api**
2. Look for:
   - **"Database URL"** section
   - **"Connection string"** 
   - **"Postgres URL"**
   - **"Database connection"**

## Method 2: Connection Pooling Section

1. On the Database Settings page: **https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database**
2. Look for **"Connection pooling configuration"** section
3. Click to expand it
4. You should see connection strings there (URI, JDBC, etc.)
5. Select **"URI"** format

## Method 3: Project Overview

1. Go to: **https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv**
2. Look at the project overview/cards
3. Check for a **"Database"** card that shows connection info

## Method 4: Check Project Region

The connection string format depends on your project's region. To find it:

1. Go to: **https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/general**
2. Look for **"Region"** or **"Location"**
3. Common regions: `us-east-1`, `eu-west-1`, `ap-southeast-1`

Then the format would be:
```
postgresql://postgres.xkbiqoajqxlvxjcwvhzv:Anw%40r%232020@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres
```

## What to Look For

The connection string should look like one of these:

**Pooler format:**
```
postgresql://postgres.xkbiqoajqxlvxjcwvhzv:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Direct format:**
```
postgresql://postgres:[PASSWORD]@db.xkbiqoajqxlvxjcwvhzv.supabase.co:5432/postgres
```

## Once You Find It

1. Copy the connection string
2. Replace `[PASSWORD]` or `[YOUR-PASSWORD]` with: `Anw@r#2020`
3. Make sure special characters are URL-encoded:
   - `@` becomes `%40`
   - `#` becomes `%23`
4. Add to `.env.local` file:
   ```env
   DATABASE_URL=postgresql://postgres.xxx:Anw%40r%232020@...
   ```
5. Test it:
   ```bash
   npm run test-connection
   ```

## Alternative: Manual SQL (Current Method)

If you can't find the connection string, you can continue using the manual SQL method:
- Go to SQL Editor
- Copy/paste SQL
- Run it

This works fine, just requires manual steps.




