# Database Connection Setup

## Connection String Provided

You provided:
```
postgresql://postgres:[YOUR_PASSWORD]@db.xkbiqoajqxlvxjcwvhzv.supabase.co:5432/postgres
```

Password: `Anw@r#2020`

## What I've Set Up

1. **Test Connection Script**: `scripts/test-connection-direct.ts`
   - Tests multiple connection formats
   - URL-encodes password automatically (@ → %40, # → %23)
   - Tries direct and pooler connections

2. **Direct SQL Execution Script**: `scripts/execute-sql-direct-connection.ts`
   - Executes SQL files directly using the connection string
   - Handles dollar-quoted strings (PostgreSQL functions)
   - Better error handling

## Current Status

❌ **Connection test failed** - None of the connection formats worked:
- Direct connection: Hostname not found
- Pooler connections: Tenant or user not found

## Next Steps

### Option 1: Verify Connection String from Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database
2. Look for "Connection string" section
3. Select "URI" format
4. Copy the **exact** connection string shown
5. Replace `[YOUR-PASSWORD]` with your password: `Anw@r#2020`
6. Make sure special characters are URL-encoded:
   - `@` = `%40`
   - `#` = `%23`

### Option 2: Enable Connection Pooling

If connection pooling is not enabled:
1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database
2. Look for "Connection pooling" section
3. Enable it if available
4. Copy the pooler connection string

### Option 3: Use Environment Variable

Create `.env.local` file in project root:
```env
DATABASE_URL=postgresql://postgres:Anw%40r%232020@[HOSTNAME]:[PORT]/postgres
```

Replace `[HOSTNAME]` and `[PORT]` with the correct values from Supabase dashboard.

## Available Scripts

After connection is working:

```bash
# Test connection
npm run test-connection-direct

# Execute SQL file directly
npm run execute-sql-direct-connection complete-setup.sql

# Import Excel data
npm run import-excel-supabase
```

## Notes

- The password `Anw@r#2020` is automatically URL-encoded in scripts
- Direct connection format: `postgresql://postgres:password@host:port/database`
- Pooler format: `postgresql://postgres.projectref:password@pooler-host:port/database`
- SSL is required for Supabase connections


