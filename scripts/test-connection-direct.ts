import { Client } from 'pg';

/**
 * Test Database Connection with Direct Connection String
 * 
 * This script tests the connection using the provided connection string.
 */

const password = 'Anw@r#2020';
const encodedPassword = encodeURIComponent(password); // URL encode: @ -> %40, # -> %23

// Try multiple connection string formats
const connectionStrings = [
  // Format 1: Direct connection (provided by user)
  `postgresql://postgres:${encodedPassword}@db.xkbiqoajqxlvxjcwvhzv.supabase.co:5432/postgres`,
  // Format 2: Pooler transaction mode (most common)
  `postgresql://postgres.xkbiqoajqxlvxjcwvhzv:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  // Format 3: Pooler session mode
  `postgresql://postgres.xkbiqoajqxlvxjcwvhzv:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  // Format 4: Alternative regions
  `postgresql://postgres.xkbiqoajqxlvxjcwvhzv:${encodedPassword}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.xkbiqoajqxlvxjcwvhzv:${encodedPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
];

async function testConnection() {
  console.log('🔍 Testing database connection with multiple formats...\n');

  let connected = false;
  let workingConnection = '';

  for (let i = 0; i < connectionStrings.length; i++) {
    const connStr = connectionStrings[i];
    const displayStr = connStr.split('@')[0] + '@[HIDDEN]';
    
    console.log(`📡 Trying format ${i + 1}/${connectionStrings.length}: ${displayStr}`);
    
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('✅ Connection successful!\n');
      workingConnection = connStr;
      connected = true;
      
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

      // Check if members table exists and count rows
      if (tablesResult.rows.some(row => row.table_name === 'members')) {
        const countResult = await client.query('SELECT COUNT(*) as count FROM members');
        console.log(`\n👥 Members in database: ${countResult.rows[0].count}`);
      }

      await client.end();
      
      console.log('\n✅ Everything is configured correctly!');
      console.log('🚀 Working connection string:');
      console.log(`   ${displayStr}\n`);
      console.log('📝 To use this connection string:');
      console.log('   Create .env.local file with:');
      console.log(`   DATABASE_URL=${connStr}\n`);
      
      process.exit(0);
    } catch (error: any) {
      await client.end();
      
      if (error.message.includes('password') || error.message.includes('authentication')) {
        console.log(`   ⚠️  Authentication failed (wrong password or user)\n`);
      } else if (error.message.includes('ENOTFOUND')) {
        console.log(`   ⚠️  Hostname not found\n`);
      } else {
        console.log(`   ⚠️  ${error.message.split('\n')[0]}\n`);
      }
    }
  }

  // If we get here, none of the connections worked
  if (!connected) {
    console.error('❌ All connection attempts failed!\n');
    console.log('📝 Please check:');
    console.log('   1. Password is correct: Anw@r#2020');
    console.log('   2. Project is active in Supabase Dashboard');
    console.log('   3. Get the exact connection string from:');
    console.log('      https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database');
    console.log('   4. Look for "Connection string" or "Connection pooling" section\n');
    
    process.exit(1);
  }
}

testConnection();
