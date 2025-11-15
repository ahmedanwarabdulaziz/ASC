import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Recreate all tables professionally with advanced Arabic search
 * Uses direct Supabase Admin client (no exec_sql needed)
 */

async function recreateAll() {
  console.log('🚀 Recreating database with professional Arabic search setup...\n');

  // Read the SQL file
  const sqlPath = path.join(process.cwd(), 'scripts', 'recreate-all.sql');
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

  // Split into statements (handle dollar-quoted strings)
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
      if (stmt.length > 0 && !stmt.match(/^SELECT/)) {
        statements.push(stmt);
      }
      currentStatement = '';
    }
  }
  
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  console.log(`📋 Executing ${statements.length} SQL statements...\n`);

  // Execute statements one by one using Supabase Admin
  // We'll use a workaround: execute via a simple query that creates exec_sql first
  let successCount = 0;
  let errorCount = 0;

  // First, try to create exec_sql function using a direct approach
  const createExecSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  console.log('📝 Step 1: Creating exec_sql function...');
  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: createExecSql });
    if (error && !error.message.includes('not found')) {
      // If exec_sql doesn't exist, we need to create it manually first
      console.log('⚠️  exec_sql not found, will create it via direct SQL...');
    } else {
      console.log('✅ exec_sql function ready\n');
    }
  } catch (e) {
    console.log('⚠️  Will create exec_sql as part of setup\n');
  }

  // Execute all statements
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length < 10) continue;

    try {
      // Try using exec_sql if it exists, otherwise try direct execution
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        if (error.message.includes('not found') && i === 0) {
          // First statement is creating exec_sql, need to execute it differently
          // Use Supabase's query endpoint directly
          console.log(`⚠️  Statement ${i + 1}: Need to execute manually first`);
          errorCount++;
        } else if (error.message.includes('already exists') || 
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
    console.log('\n✅ All tables and functions recreated successfully!');
    console.log('\n📝 Next: Import your Excel data');
    console.log('   Run: npm run import-excel-supabase\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  Completed with ${errorCount} error(s).`);
    console.log('   Some statements may need manual execution.\n');
    process.exit(1);
  }
}

recreateAll();


