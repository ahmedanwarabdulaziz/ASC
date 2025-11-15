import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Complete Auto-Setup Script
 * 
 * This script will:
 * 1. Try to find working connection string
 * 2. If found, execute SQL automatically
 * 3. If not found, provide clear instructions
 */

const projectRef = 'xkbiqoajqxlvxjcwvhzv';
const password = 'Anw@r#2020';
const encodedPassword = encodeURIComponent(password);

// Extended list of possible connection formats
const connectionFormats = [
  // Try environment variable first
  () => process.env.DATABASE_URL,
  
  // Pooler formats (most common for new projects)
  () => `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  () => `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
  () => `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  () => `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  
  // Pooler session mode
  () => `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  
  // Direct connection (older projects)
  () => `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
  
  // Alternative formats
  () => `postgresql://postgres.${projectRef}:${encodedPassword}@pooler.supabase.com:6543/postgres`,
  () => `postgresql://postgres:${encodedPassword}@${projectRef}.supabase.co:5432/postgres`,
];

async function testAndExecuteSQL() {
  console.log('🚀 Auto-Setup: Creating Tables Automatically\n');
  console.log(`📋 Project: ${projectRef}`);
  console.log(`🔑 Password: ${password}\n`);

  // Read SQL file
  const sqlPath = path.join(process.cwd(), 'complete-setup.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found:', sqlPath);
    process.exit(1);
  }

  let sql = fs.readFileSync(sqlPath, 'utf8');
  sql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .trim();

  // Try to find working connection
  let workingConnection: string | null = null;

  console.log('🔍 Testing connection formats...\n');

  for (const getFormat of connectionFormats) {
    const connectionString = getFormat();
    if (!connectionString) continue;

    const client = new Client({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      
      workingConnection = connectionString;
      console.log(`✅ Found working connection!\n`);
      console.log(`Connection: ${connectionString.split('@')[0]}@[HIDDEN]\n`);
      break;
    } catch (error: any) {
      await client.end();
      // Continue to next format
    }
  }

  if (!workingConnection) {
    console.log('❌ Could not find working connection automatically.\n');
    console.log('📝 To enable automatic setup, please:\n');
    console.log('   1. Get connection string from Supabase Dashboard:');
    console.log('      https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/api');
    console.log('      OR');
    console.log('      https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database');
    console.log('   2. Look for "Connection string" or "Database URL"');
    console.log('   3. Select "URI" format');
    console.log('   4. Copy and add to .env.local:');
    console.log('      DATABASE_URL=postgresql://...\n');
    console.log('   Then run: npm run setup-supabase\n');
    console.log('   OR continue using manual SQL method (works fine!)\n');
    process.exit(1);
  }

  // Execute SQL
  console.log('📥 Executing SQL to create tables...\n');

  const client = new Client({
    connectionString: workingConnection,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue;

      try {
        await client.query(statement + ';');
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        successCount++;
      } catch (error: any) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            (error.message.includes('does not exist') && error.message.includes('DROP'))) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message.split('\n')[0]}`);
          successCount++;
        } else {
          console.error(`❌ Statement ${i + 1}: ${error.message.split('\n')[0]}`);
          errorCount++;
        }
      }
    }

    await client.end();

    if (errorCount === 0) {
      console.log('\n✅ All tables created successfully!');
      console.log('\n📝 Next: Import your Excel data');
      console.log('   Run: npm run import-excel-supabase\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Completed with ${errorCount} error(s).`);
      process.exit(1);
    }
  } catch (error: any) {
    await client.end();
    console.error('❌ Error executing SQL:', error.message);
    process.exit(1);
  }
}

testAndExecuteSQL();


