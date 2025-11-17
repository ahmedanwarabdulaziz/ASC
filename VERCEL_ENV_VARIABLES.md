# Vercel Environment Variables Setup

## Required Environment Variables for Vercel Deployment

Add these environment variables in your Vercel project settings:

### 1. Supabase Configuration (Required)

These are used throughout the application for database operations:

```
NEXT_PUBLIC_SUPABASE_URL=https://xkbiqoajqxlvxjcwvhzv.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTUxMzksImV4cCI6MjA3ODc3MTEzOX0.-3yBJSlAv_iFkq1tAdHhp7linLuIajS_e95UZzdcheA
```

```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k
```

**Note:** The `NEXT_PUBLIC_` prefix means these will be exposed to the browser. This is safe for the anon key, but keep the service key secure (it's only used server-side).

### 2. Optional: Database Connection String

If you want to use database scripts or direct SQL execution:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xkbiqoajqxlvxjcwvhzv.supabase.co:5432/postgres
```

**Note:** Replace `[PASSWORD]` with your actual database password and URL-encode special characters:
- `@` → `%40`
- `#` → `%23`

Example: `Anw@r#2020` becomes `Anw%40r%232020`

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The variable value
   - **Environment**: Select which environments (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application for changes to take effect

## Important Notes

- ✅ **Current Status**: Your code has fallback values, so the app will work even without these variables
- ✅ **Best Practice**: Set them as environment variables for better security and flexibility
- ⚠️ **Security**: Never commit `.env.local` files to Git (already in `.gitignore`)
- ⚠️ **Service Key**: The `SUPABASE_SERVICE_KEY` bypasses Row Level Security - keep it secure

## Firebase Configuration

Firebase configuration is currently hardcoded in the code. If you want to make it configurable via environment variables, you would need to:

1. Update `lib/firebase.ts` to use `process.env.NEXT_PUBLIC_FIREBASE_*` variables
2. Add Firebase environment variables to Vercel

However, since Firebase config is public-facing (used in client-side code), hardcoding is acceptable for now.

## Verification

After adding the variables and redeploying, verify:
1. Check Vercel deployment logs for any environment variable errors
2. Test the application functionality (login, database operations)
3. Check browser console for any Supabase connection errors



