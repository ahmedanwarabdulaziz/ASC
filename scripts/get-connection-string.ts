import { Client } from 'pg';

/**
 * Get Connection String Helper
 * 
 * Since Supabase doesn't show connection string directly,
 * we can construct it from known information.
 * 
 * We know:
 * - Project ref: xkbiqoajqxlvxjcwvhzv
 * - Password: Anw@r#2020
 * 
 * We need to find the correct hostname format.
 */

const password = 'Anw@r#2020';
const projectRef = 'xkbiqoajqxlvxjcwvhzv';
const encodedPassword = encodeURIComponent(password);

// Common Supabase connection string formats
const connectionFormats = [
  // Format 1: Pooler transaction mode (most common for new projects)
  {
    name: 'Pooler Transaction Mode',
    url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  },
  // Format 2: Pooler session mode
  {
    name: 'Pooler Session Mode',
    url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
  },
  // Format 3: Direct connection (older projects)
  {
    name: 'Direct Connection',
    url: `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`
  },
  // Format 4: Alternative pooler format
  {
    name: 'Alternative Pooler',
    url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
  },
];

async function testConnectionFormats() {
  console.log('🔍 Testing different connection string formats...\n');
  console.log(`📋 Project: ${projectRef}`);
  console.log(`🔑 Password: ${password}\n`);

  for (const format of connectionFormats) {
    console.log(`Testing: ${format.name}...`);
    
    const client = new Client({
      connectionString: format.url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      const result = await client.query('SELECT version()');
      await client.end();
      
      console.log(`✅ SUCCESS! Use this connection string:\n`);
      console.log(`DATABASE_URL=${format.url}\n`);
      console.log(`Add this to your .env.local file and I can execute SQL automatically!\n`);
      process.exit(0);
    } catch (error: any) {
      await client.end();
      if (error.message.includes('ENOTFOUND')) {
        console.log(`   ❌ Hostname not found\n`);
      } else if (error.message.includes('password') || error.message.includes('authentication')) {
        console.log(`   ❌ Authentication failed (wrong format)\n`);
      } else {
        console.log(`   ❌ ${error.message.split('\n')[0]}\n`);
      }
    }
  }

  console.log('❌ None of the common formats worked.\n');
  console.log('📝 Alternative: Get connection string from Supabase Dashboard:\n');
  console.log('   1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv');
  console.log('   2. Click on "Project Settings" (gear icon)');
  console.log('   3. Go to "Database" tab');
  console.log('   4. Look for "Connection string" or "Connection info"');
  console.log('   5. OR check "Connection pooling" section');
  console.log('   6. Copy the URI format connection string\n');
  console.log('   If you still can\'t find it, you can also:');
  console.log('   - Check the "API" section in project settings');
  console.log('   - Look for "Database URL" or "Postgres URL"\n');
  
  process.exit(1);
}

testConnectionFormats();


