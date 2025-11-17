import { Client } from 'pg';

/**
 * Test Database Connection
 * 
 * This script tests if DATABASE_URL is configured correctly.
 * 
 * Usage:
 *   npm run test-connection
 *   OR
 *   npx tsx scripts/test-connection.ts
 */

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL not found!\n');
    console.log('📝 To enable automatic SQL execution:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database');
    console.log('   2. Find "Connection string" section');
    console.log('   3. Select "URI" format');
    console.log('   4. Copy the connection string');
    console.log('   5. Replace [YOUR-PASSWORD] with: Anw@r#2020');
    console.log('   6. Add to .env.local file:');
    console.log('      DATABASE_URL=postgresql://...\n');
    console.log('   Then run this script again to test.\n');
    process.exit(1);
  }

  console.log('🔍 Testing database connection...\n');
  console.log(`📡 Connection string: ${databaseUrl.split('@')[0]}@[HIDDEN]\n`);

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!\n');

    // Test query
    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version.split(',')[0]);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    await client.end();
    
    console.log('\n✅ Everything is configured correctly!');
    console.log('🚀 I can now execute SQL automatically.\n');
    console.log('📝 Try it:');
    console.log('   npm run execute-sql complete-setup.sql\n');
    
    process.exit(0);
  } catch (error: any) {
    await client.end();
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('❌ Authentication failed!\n');
      console.log('📝 Please check:');
      console.log('   1. Password is correct in connection string');
      console.log('   2. Special characters are URL-encoded (@ = %40, # = %23)\n');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('❌ Could not resolve database hostname!\n');
      console.log('📝 Please check:');
      console.log('   1. Connection string format is correct');
      console.log('   2. Hostname is correct');
      console.log('   3. Project is active in Supabase Dashboard\n');
    } else {
      console.error('❌ Connection error:', error.message);
    }
    
    process.exit(1);
  }
}

testConnection();




