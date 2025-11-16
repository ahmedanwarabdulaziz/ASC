import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Supabase PostgreSQL connection string
// Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
// We'll use the service role key to construct connection
const supabaseUrl = 'xkbiqoajqxlvxjcwvhzv.supabase.co';
const supabasePassword = 'your-database-password'; // This needs to be set in Supabase dashboard

// For Supabase, we need the direct database password, not the API key
// Let's use environment variable or connection pooling
const connectionString = process.env.DATABASE_URL || 
  `postgresql://postgres.xkbiqoajqxlvxjcwvhzv:${supabasePassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function createTables() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Connecting to Supabase PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'supabase-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Executing SQL statements...\n');
    
    // Execute the entire SQL
    await client.query(sql);
    
    console.log('✅ All SQL statements executed successfully!\n');
    
    // Verify tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('members', 'teams', 'users')
    `);
    
    console.log('📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // Verify functions
    const functionsResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('search_members', 'update_members_search_vector')
    `);
    
    console.log('\n📊 Created functions:');
    functionsResult.rows.forEach(row => {
      console.log(`   ✅ ${row.routine_name}`);
    });
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('   You can now run: npm run import-excel-supabase\n');
    
  } catch (error: any) {
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('❌ Database connection failed');
      console.error('\n📝 To get database password:');
      console.error('   1. Go to Supabase Dashboard → Settings → Database');
      console.error('   2. Find "Connection string" or "Database password"');
      console.error('   3. Set DATABASE_URL environment variable or update script\n');
      console.error('   Alternative: Run SQL manually in Supabase SQL Editor');
      console.error('   File: supabase-migration.sql\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await client.end();
  }
}

// Check if we have connection string
if (!process.env.DATABASE_URL && !connectionString.includes('your-database-password')) {
  console.log('⚠️  Database password not configured');
  console.log('\n📝 Please either:');
  console.log('   1. Set DATABASE_URL environment variable, OR');
  console.log('   2. Run SQL manually in Supabase Dashboard');
  console.log('      File: supabase-migration.sql\n');
  console.log('   To get connection string:');
  console.log('   Supabase Dashboard → Settings → Database → Connection string\n');
  process.exit(1);
}

createTables();



