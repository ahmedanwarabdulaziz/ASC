import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const password = 'Anw@r#2020';
const projectRef = 'xkbiqoajqxlvxjcwvhzv';

// URL encode password
const encodedPassword = encodeURIComponent(password);

// Try multiple connection formats - Supabase uses pooler for most connections
const connectionStrings = [
  // Format 1: Pooler transaction mode (most common)
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  // Format 2: Pooler session mode
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  // Format 3: Direct connection
  `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
];

let connectionString = connectionStrings[0]; // Start with pooler

async function setupTables() {
  console.log('🚀 Creating Supabase tables...\n');
  console.log('📡 Connecting to database...\n');

  // Try each connection format until one works
  let client: Client | null = null;
  let connected = false;
  
  for (const connStr of connectionStrings) {
    const testClient = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await testClient.connect();
      console.log(`✅ Connected using: ${connStr.split('@')[1]}\n`);
      client = testClient;
      connected = true;
      connectionString = connStr;
      break;
    } catch (error: any) {
      await testClient.end();
      // Try next format
    }
  }
  
  if (!connected) {
    console.error('❌ Could not connect with any connection format.\n');
    console.log('📝 Please get the exact connection string from:');
    console.log('   https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database');
    console.log('   Copy the "Connection string" (URI format)');
    console.log('   Then update scripts/setup-with-password.ts with the correct connection string\n');
    process.exit(1);
  }

  try {

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

    console.log(`Executing ${statements.length} SQL statements...\n`);

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
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            (error.message.includes('does not exist') && error.message.includes('DROP'))) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message.split('\n')[0]}`);
          successCount++;
        } else {
          console.error(`❌ Statement ${i + 1} error:`, error.message.split('\n')[0]);
          errorCount++;
        }
      }
    }

    await client.end();

    if (errorCount === 0) {
      console.log('\n✅ All tables created successfully!');
      console.log('\n📝 Next step: Import your Excel data');
      console.log('   Run: npm run import-excel-supabase\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Completed with ${errorCount} error(s).`);
      console.log('   Please check the errors above.\n');
      process.exit(1);
    }
  } catch (error: any) {
    await client.end();
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('❌ Could not resolve database hostname.\n');
      console.log('📝 This usually means:');
      console.log('   1. The project reference might be incorrect');
      console.log('   2. The connection string format might be different');
      console.log('   3. The project might be in a different region\n');
      console.log('💡 Please get the exact connection string from:');
      console.log('   https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database');
      console.log('   Look for "Connection string" (direct connection, not pooler)');
      console.log('   Then update the connectionString in this script\n');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('❌ Authentication failed. Please check the password.\n');
    } else {
      console.error('❌ Connection error:', error.message);
    }
    
    process.exit(1);
  }
}

setupTables();

