import { Client } from 'pg';

/**
 * Find Connection String by Testing All Formats
 * 
 * Since we know:
 * - Project ID: xkbiqoajqxlvxjcwvhzv
 * - Password: Anw@r#2020
 * 
 * We'll test all possible connection string formats
 */

const projectRef = 'xkbiqoajqxlvxjcwvhzv';
const password = 'Anw@r#2020';
const encodedPassword = encodeURIComponent(password);

// All possible regions Supabase uses
const regions = [
  'us-east-1',
  'us-west-1', 
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-south-1',
  'ca-central-1',
  'sa-east-1'
];

// Connection string formats to test
function generateFormats(region: string) {
  return [
    // Format 1: Pooler transaction mode (port 6543) - MOST COMMON
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    // Format 2: Pooler session mode (port 5432)
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    // Format 3: Direct connection (older format)
    `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
  ];
}

async function testConnection(connectionString: string, name: string): Promise<boolean> {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
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

async function findConnectionString() {
  console.log('🔍 Searching for correct connection string format...\n');
  console.log(`📋 Project ID: ${projectRef}`);
  console.log(`🔑 Password: ${password}\n`);
  console.log('Testing all possible formats (this may take a minute)...\n');

  let tested = 0;
  const total = regions.length * 3;

  // Test direct connection first (doesn't depend on region)
  console.log('Testing direct connection format...');
  const directFormat = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
  if (await testConnection(directFormat, 'Direct Connection')) {
    process.exit(0);
  }
  tested++;

  // Test pooler formats for each region
  for (const region of regions) {
    const formats = generateFormats(region);
    
    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      const formatName = i === 0 ? `Pooler Transaction (${region})` : 
                        i === 1 ? `Pooler Session (${region})` : 
                        'Direct';
      
      tested++;
      process.stdout.write(`\rTesting ${tested}/${total}: ${formatName}...`);
      
      if (await testConnection(format, formatName)) {
        process.exit(0);
      }
    }
  }

  console.log(`\n\n❌ Could not find working connection string after testing ${tested} formats.\n`);
  console.log('📝 Please get the connection string manually:\n');
  console.log('   1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv');
  console.log('   2. Click "Settings" (gear icon) → "API"');
  console.log('   3. Look for "Database URL" or "Connection string"');
  console.log('   4. OR go to "Settings" → "Database" → "Connection pooling"');
  console.log('   5. Copy the URI format connection string');
  console.log('   6. Replace [YOUR-PASSWORD] with: Anw@r#2020');
  console.log('   7. Add to .env.local file\n');
  console.log('   Alternative: Check your project\'s region in billing/settings\n');
  
  process.exit(1);
}

findConnectionString();


