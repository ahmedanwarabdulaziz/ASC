import { Client } from 'pg';

/**
 * Test Connection with Provided Secret
 */

const projectRef = 'xkbiqoajqxlvxjcwvhzv';
const secret = 'sb_secret_TPfJJZW-zq1Q_LZ1PN7vDg_CXZ7gHmO';
const encodedSecret = encodeURIComponent(secret);

// Also try the original password
const originalPassword = 'Anw@r#2020';
const encodedOriginalPassword = encodeURIComponent(originalPassword);

// Test both passwords with different formats
const passwords = [
  { name: 'Provided Secret', encoded: encodedSecret, raw: secret },
  { name: 'Original Password', encoded: encodedOriginalPassword, raw: originalPassword }
];

// Common regions
const regions = [
  'us-east-1',
  'us-west-1',
  'eu-west-1',
  'ap-southeast-1',
  'eu-central-1'
];

async function testConnection(connectionString: string, name: string): Promise<boolean> {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    const result = await client.query('SELECT current_database(), version()');
    await client.end();
    
    console.log(`\n✅ SUCCESS! Found working connection string:\n`);
    console.log(`Format: ${name}`);
    console.log(`\nDATABASE_URL=${connectionString}\n`);
    console.log(`📝 Add this to your .env.local file:\n`);
    console.log(`DATABASE_URL=${connectionString}\n`);
    console.log(`🎉 Once added, I can execute SQL automatically!\n`);
    
    return true;
  } catch (error: any) {
    await client.end();
    return false;
  }
}

async function findWorkingConnection() {
  console.log('🔍 Testing connection with provided secret...\n');
  console.log(`📋 Project ID: ${projectRef}\n`);

  let tested = 0;

  for (const pwd of passwords) {
    console.log(`\nTesting with: ${pwd.name}...\n`);

    // Test direct connection first
    const directFormat = `postgresql://postgres:${pwd.encoded}@db.${projectRef}.supabase.co:5432/postgres`;
    tested++;
    process.stdout.write(`\rTesting ${tested}: Direct connection...`);
    if (await testConnection(directFormat, `Direct (${pwd.name})`)) {
      process.exit(0);
    }

    // Test pooler formats for each region
    for (const region of regions) {
      // Pooler transaction mode (port 6543)
      const poolerTx = `postgresql://postgres.${projectRef}:${pwd.encoded}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
      tested++;
      process.stdout.write(`\rTesting ${tested}: Pooler TX (${region})...`);
      if (await testConnection(poolerTx, `Pooler TX ${region} (${pwd.name})`)) {
        process.exit(0);
      }

      // Pooler session mode (port 5432)
      const poolerSession = `postgresql://postgres.${projectRef}:${pwd.encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
      tested++;
      process.stdout.write(`\rTesting ${tested}: Pooler Session (${region})...`);
      if (await testConnection(poolerSession, `Pooler Session ${region} (${pwd.name})`)) {
        process.exit(0);
      }
    }
  }

  console.log(`\n\n❌ Could not find working connection after testing ${tested} combinations.\n`);
  console.log('📝 The secret might be:');
  console.log('   - A different type of key (not database password)');
  console.log('   - Needs to be used differently');
  console.log('   - Or the connection format is different\n');
  console.log('💡 Please check:');
  console.log('   1. Is this the database password or a different secret?');
  console.log('   2. Can you find the connection string in API Settings?');
  console.log('   3. Or check Connection Pooling section in Database Settings\n');
  
  process.exit(1);
}

findWorkingConnection();



