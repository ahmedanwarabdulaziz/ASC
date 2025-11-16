import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function createTablesViaAPI() {
  console.log('🚀 Creating Supabase tables via API...\n');

  // Read SQL file
  const sqlPath = path.join(process.cwd(), 'complete-setup.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found:', sqlPath);
    process.exit(1);
  }

  let sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Remove comments
  sql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .trim();

  // Split into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  // First, try to create exec_sql function if it doesn't exist
  const createExecSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  console.log('📝 Step 1: Creating exec_sql helper function...\n');
  
  // Try to execute via HTTP POST directly to Supabase
  const supabaseUrl = 'https://xkbiqoajqxlvxjcwvhzv.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k';

  // Since Supabase doesn't allow arbitrary SQL via REST API,
  // we need to use the SQL Editor or direct PostgreSQL connection
  console.log('⚠️  Supabase REST API does not support arbitrary SQL execution.\n');
  console.log('📝 Please use one of these methods:\n');
  console.log('   METHOD 1: Direct PostgreSQL Connection');
  console.log('   1. Get your connection string from:');
  console.log('      https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database');
  console.log('   2. Set DATABASE_URL environment variable:');
  console.log('      $env:DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"');
  console.log('   3. Run: npm run setup-supabase\n');
  console.log('   METHOD 2: Manual SQL Execution (Recommended)');
  console.log('   1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new');
  console.log('   2. Copy ALL contents from: complete-setup.sql');
  console.log('   3. Paste into SQL Editor');
  console.log('   4. Click "Run" (or Ctrl+Enter)');
  console.log('   5. Wait for all statements to execute\n');
  
  process.exit(1);
}

createTablesViaAPI();



