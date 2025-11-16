import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Execute SQL using Direct Connection String
 * 
 * This script executes SQL files directly using the PostgreSQL connection string.
 * 
 * Usage:
 *   npm run execute-sql-direct-connection <sql-file>
 *   OR
 *   npx tsx scripts/execute-sql-direct-connection.ts <sql-file>
 */

const password = 'Anw@r#2020';
const encodedPassword = encodeURIComponent(password);

// Connection string format provided by user
const connectionString = `postgresql://postgres:${encodedPassword}@db.xkbiqoajqxlvxjcwvhzv.supabase.co:5432/postgres`;

async function executeSQL(sqlFilePath: string) {
  console.log('🚀 Executing SQL file using direct connection...\n');

  // Read SQL file
  const fullPath = path.isAbsolute(sqlFilePath) 
    ? sqlFilePath 
    : path.join(process.cwd(), sqlFilePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ SQL file not found: ${fullPath}`);
    process.exit(1);
  }

  let sql = fs.readFileSync(fullPath, 'utf8');
  
  console.log(`📄 Reading SQL file: ${fullPath}\n`);

  // Connect to database
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Parse SQL statements (handle dollar-quoted strings and comments)
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarTag = '';
    let inComment = false;

    const lines = sql.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('--')) {
        continue;
      }

      // Handle dollar-quoted strings (used in PostgreSQL functions)
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1] || '';
        
        // Check for dollar quote start: $tag$ or $$
        if (!inDollarQuote && char === '$') {
          const dollarMatch = line.substring(j).match(/^\$([^$]*)\$/);
          if (dollarMatch) {
            dollarTag = dollarMatch[0];
            inDollarQuote = true;
            currentStatement += dollarTag;
            j += dollarTag.length - 1;
            continue;
          }
        }
        
        // Check for dollar quote end
        if (inDollarQuote && char === '$') {
          const remaining = line.substring(j);
          if (remaining.startsWith(dollarTag)) {
            currentStatement += dollarTag;
            j += dollarTag.length - 1;
            inDollarQuote = false;
            dollarTag = '';
            continue;
          }
        }
        
        if (!inDollarQuote && char === ';' && nextChar !== ';') {
          currentStatement += char;
          const trimmedStmt = currentStatement.trim();
          if (trimmedStmt.length > 0) {
            statements.push(trimmedStmt);
          }
          currentStatement = '';
        } else {
          currentStatement += char;
        }
      }
      
      // Add newline if not at end of file
      if (i < lines.length - 1) {
        currentStatement += '\n';
      }
    }
    
    // Add final statement if exists
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    // Execute statements
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      if (statement.length < 5) {
        continue; // Skip very short statements
      }

      try {
        await client.query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        successCount++;
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            (error.message.includes('does not exist') && statement.toUpperCase().includes('DROP'))) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message.split('\n')[0]}`);
          successCount++;
        } else {
          console.error(`❌ Statement ${i + 1} error:`, error.message.split('\n')[0]);
          console.error(`   SQL: ${statement.substring(0, 100)}...`);
          errorCount++;
        }
      }
    }

    await client.end();

    console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed\n`);

    if (errorCount === 0) {
      console.log('✅ All SQL statements executed successfully!\n');
      process.exit(0);
    } else {
      console.log(`⚠️  Completed with ${errorCount} error(s).\n`);
      process.exit(1);
    }
  } catch (error: any) {
    await client.end();
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('❌ Authentication failed!\n');
      console.log('📝 Please check the password in the connection string.\n');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('❌ Could not resolve database hostname!\n');
      console.log('📝 Please check the connection string format.\n');
    } else {
      console.error('❌ Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Get SQL file from command line arguments
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('❌ Please provide a SQL file path');
  console.log('\nUsage:');
  console.log('  npm run execute-sql-direct-connection <sql-file>');
  console.log('  OR');
  console.log('  npx tsx scripts/execute-sql-direct-connection.ts <sql-file>\n');
  console.log('Example:');
  console.log('  npm run execute-sql-direct-connection complete-setup.sql\n');
  process.exit(1);
}

executeSQL(sqlFile);



