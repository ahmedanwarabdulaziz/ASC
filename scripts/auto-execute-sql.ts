import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Automatic SQL Execution Script
 * 
 * This script can execute any SQL file automatically if DATABASE_URL is set.
 * 
 * Usage:
 *   npm run execute-sql <sql-file-path>
 *   OR
 *   npx tsx scripts/auto-execute-sql.ts <sql-file-path>
 * 
 * Requirements:
 *   - DATABASE_URL environment variable must be set
 *   - Or connection string in .env.local file
 */

async function executeSQL(sqlFilePath: string) {
  // Get connection string from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found!\n');
    console.log('📝 To enable automatic SQL execution:');
    console.log('   1. Get connection string from:');
    console.log('      https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/settings/database');
    console.log('   2. Add to .env.local file:');
    console.log('      DATABASE_URL=postgresql://postgres.xxx:password@host:port/database');
    console.log('   3. Run this script again\n');
    process.exit(1);
  }

  // Check if SQL file exists
  const fullPath = path.isAbsolute(sqlFilePath) 
    ? sqlFilePath 
    : path.join(process.cwd(), sqlFilePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ SQL file not found: ${fullPath}`);
    process.exit(1);
  }

  console.log('🚀 Executing SQL file automatically...\n');
  console.log(`📄 File: ${fullPath}\n`);

  // Read SQL file
  let sql = fs.readFileSync(fullPath, 'utf8');
  
  // Remove comments
  sql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .trim();

  // Connect to database
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Split into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📋 Executing ${statements.length} SQL statements...\n`);

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
      console.log('\n✅ All SQL statements executed successfully!');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Completed with ${errorCount} error(s).`);
      console.log('   Please check the errors above.');
      process.exit(1);
    }
  } catch (error: any) {
    await client.end();
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('❌ Authentication failed. Please check DATABASE_URL.\n');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('❌ Could not connect to database host.\n');
      console.log('📝 Please verify:');
      console.log('   1. Connection string is correct');
      console.log('   2. Database is accessible');
      console.log('   3. Hostname is correct\n');
    } else {
      console.error('❌ Connection error:', error.message);
    }
    
    process.exit(1);
  }
}

// Get SQL file path from command line
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('❌ Please provide SQL file path');
  console.log('\nUsage:');
  console.log('  npm run execute-sql <sql-file-path>');
  console.log('  OR');
  console.log('  npx tsx scripts/auto-execute-sql.ts <sql-file-path>\n');
  console.log('Example:');
  console.log('  npx tsx scripts/auto-execute-sql.ts complete-setup.sql\n');
  process.exit(1);
}

executeSQL(sqlFile);



