import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const supabaseProjectRef = 'xkbiqoajqxlvxjcwvhzv';

// Get database password from user input
function getPassword(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('🔑 Enter your Supabase database password (or press Enter to skip): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// URL encode password for connection string
function encodePassword(password: string): string {
  return encodeURIComponent(password);
}

// Construct connection string - try multiple formats
function getConnectionString(password?: string): string | null {
  // Try environment variable first
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Try to construct from password with different formats
  if (password) {
    const encodedPassword = encodePassword(password);
    
    // Try different connection string formats
    const formats = [
      // Format 1: Pooler connection (transaction mode)
      `postgresql://postgres.${supabaseProjectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      // Format 2: Pooler connection (session mode)
      `postgresql://postgres.${supabaseProjectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
      // Format 3: Direct connection
      `postgresql://postgres:${encodedPassword}@db.${supabaseProjectRef}.supabase.co:5432/postgres`,
    ];
    
    // Return first format (will try others if this fails)
    return formats[0];
  }

  return null;
}

// Try multiple connection formats
async function tryConnect(password: string): Promise<Client | null> {
  const encodedPassword = encodePassword(password);
  
  // Try different regions and connection formats
  const regions = ['us-east-1', 'us-west-1', 'eu-west-1', 'ap-southeast-1'];
  const formats = [
    // Format 1: Pooler transaction mode (port 6543)
    (region: string) => `postgresql://postgres.${supabaseProjectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    // Format 2: Pooler session mode (port 5432)
    (region: string) => `postgresql://postgres.${supabaseProjectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    // Format 3: Direct connection
    (region: string) => `postgresql://postgres:${encodedPassword}@db.${supabaseProjectRef}.supabase.co:5432/postgres`,
  ];
  
  for (const region of regions) {
    for (const formatFn of formats) {
      const connectionString = formatFn(region);
      const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
      });
      
      try {
        await client.connect();
        console.log(`✅ Connected using: ${connectionString.split('@')[1]}\n`);
        return client;
      } catch (error: any) {
        await client.end();
        // Try next format
      }
    }
  }
  
  return null;
}

async function createTables() {
  console.log('🚀 Creating Supabase tables automatically...\n');

  // Read SQL file
  const sqlPath = path.join(process.cwd(), 'complete-setup.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found:', sqlPath);
    process.exit(1);
  }

  let sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Remove comments and clean up
  sql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .trim();

  // Get connection string
  let connectionString = getConnectionString();
  let password: string | undefined = undefined;
  
  // Check for password in command line arguments or environment
  const args = process.argv.slice(2);
  if (args.length > 0 && args[0]) {
    password = args[0];
    connectionString = getConnectionString(password);
  }
  
  if (!connectionString) {
    console.log('📝 Database connection string not found in environment.\n');
    console.log('💡 To get your database password:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database');
    console.log('   2. Find "Connection string" or "Database password"');
    console.log('   3. Copy the password from the connection string\n');
    
    if (!password) {
      password = await getPassword();
    }
    
    if (!password) {
      console.log('\n⚠️  No password provided. Cannot connect to database.\n');
      console.log('📝 Alternative: Run SQL manually in Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new');
      console.log('   Copy contents of: complete-setup.sql\n');
      process.exit(1);
    }

    connectionString = getConnectionString(password);
  }

  if (!connectionString) {
    console.error('❌ Failed to construct connection string');
    process.exit(1);
  }

  // Try to connect and execute SQL
  console.log('📡 Connecting to Supabase PostgreSQL...\n');
  
  let client: Client | null = null;
  
  // If we have a password, try multiple connection formats
  if (password && !process.env.DATABASE_URL) {
    client = await tryConnect(password);
    if (!client) {
      console.error('❌ Failed to connect with all connection formats.\n');
      console.log('📝 Please verify:');
      console.log('   1. Database password is correct');
      console.log('   2. Project is active in Supabase Dashboard');
      console.log('   3. Connection string format in Supabase Settings → Database\n');
      process.exit(1);
    }
  } else {
    // Use provided connection string
    client = new Client({
      connectionString: connectionString!,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await client.connect();
      console.log('✅ Connected to database\n');
    } catch (error: any) {
      await client.end();
      throw error;
    }
  }

  try {

    // Split SQL into statements
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
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist') && error.message.includes('DROP')) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message.split('\n')[0]}`);
          successCount++; // Count as success since it's expected
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
      console.log(`\n⚠️  Completed with ${errorCount} error(s). Some statements may have failed.`);
      console.log('   Please check the errors above and verify in Supabase Dashboard.\n');
      process.exit(1);
    }
  } catch (error: any) {
    await client.end();
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('❌ Authentication failed. Please check your database password.\n');
      console.log('📝 To get your database password:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database');
      console.log('   2. Find "Connection string" section');
      console.log('   3. Copy the password from the connection string');
      console.log('   4. Or reset the password if needed\n');
    } else {
      console.error('❌ Connection error:', error.message);
    }
    
    console.log('📝 Alternative: Run SQL manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new');
    console.log('   Copy contents of: complete-setup.sql\n');
    
    process.exit(1);
  }
}

createTables();

