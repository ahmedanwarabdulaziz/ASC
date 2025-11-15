import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Execute SQL via Supabase RPC (exec_sql function)
 * 
 * This uses the exec_sql function that exists in your database
 * to execute SQL statements automatically.
 */

async function executeSQLViaRPC(sqlFilePath: string) {
  console.log('🚀 Executing SQL via Supabase RPC...\n');

  // Check if SQL file exists
  const fullPath = path.isAbsolute(sqlFilePath) 
    ? sqlFilePath 
    : path.join(process.cwd(), sqlFilePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ SQL file not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`📄 File: ${fullPath}\n`);

  // Read SQL file
  let sql = fs.readFileSync(fullPath, 'utf8');
  
  // Remove comments (but keep multi-line comments and dollar-quoted strings intact)
  sql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .trim();

  // Split into statements more carefully
  // Handle dollar-quoted strings ($$ ... $$) and multi-line statements
  const statements: string[] = [];
  let currentStatement = '';
  let inDollarQuote = false;
  let dollarTag = '';
  
  const lines = sql.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    currentStatement += line + '\n';
    
    // Check for dollar-quoted strings
    const dollarMatches = line.match(/\$([^$]*)\$/g);
    if (dollarMatches) {
      for (const match of dollarMatches) {
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = match;
        } else if (match === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
        }
      }
    }
    
    // If we're not in a dollar quote and we see a semicolon, it's the end of a statement
    if (!inDollarQuote && line.trim().endsWith(';')) {
      const stmt = currentStatement.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }
  
  // Filter out empty statements
  const filteredStatements = statements
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^--/));

  console.log(`📋 Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length < 10) continue;

    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            (error.message.includes('does not exist') && error.message.includes('DROP'))) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message.split('\n')[0]}`);
          successCount++;
        } else {
          console.error(`❌ Statement ${i + 1}: ${error.message.split('\n')[0]}`);
          errorCount++;
        }
      } else {
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        successCount++;
      }
    } catch (error: any) {
      console.error(`❌ Statement ${i + 1} failed: ${error.message.split('\n')[0]}`);
      errorCount++;
    }
  }

  if (errorCount === 0) {
    console.log('\n✅ All SQL statements executed successfully!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  Completed with ${errorCount} error(s).`);
    console.log('   Please check the errors above.');
    process.exit(1);
  }
}

// Get SQL file path from command line
const sqlFile = process.argv[2] || 'complete-setup.sql';

executeSQLViaRPC(sqlFile);

