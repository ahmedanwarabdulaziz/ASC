import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Automatically create all tables and functions
 * Uses multiple methods to execute SQL
 */

async function createAll() {
  console.log('🚀 Automatically creating tables with advanced Arabic search...\n');

  // Read SQL file
  const sqlPath = path.join(process.cwd(), 'scripts', 'setup-without-exec-sql.sql');
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
    
    if (!inDollarQuote && line.trim().endsWith(';')) {
      const stmt = currentStatement.trim();
      if (stmt.length > 0 && !stmt.match(/^SELECT.*message/)) {
        statements.push(stmt);
      }
      currentStatement = '';
    }
  }
  
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  console.log(`📋 Found ${statements.length} SQL statements\n`);

  // Try Method 1: Use Supabase REST API to execute SQL via HTTP
  console.log('📡 Attempting to execute SQL via Supabase API...\n');

  const supabaseUrl = 'https://xkbiqoajqxlvxjcwvhzv.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k';

  let successCount = 0;
  let errorCount = 0;

  // First, try to create exec_sql function using direct HTTP call
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
  
  // Try to execute via HTTP POST to Supabase Management API
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: createExecSql })
    });

    if (response.ok) {
      console.log('✅ exec_sql function created via HTTP\n');
    } else {
      const errorText = await response.text();
      console.log(`⚠️  HTTP method failed: ${errorText.substring(0, 100)}\n`);
    }
  } catch (error: any) {
    console.log(`⚠️  HTTP method failed: ${error.message}\n`);
  }

  // Now try to execute all statements using exec_sql via RPC
  console.log('📝 Step 2: Executing SQL statements...\n');

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length < 10) continue;

    try {
      // Try using exec_sql via RPC
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        if (error.message.includes('not found')) {
          // exec_sql doesn't exist yet, try next statement
          if (i === 0) {
            console.log(`⚠️  Statement ${i + 1}: exec_sql not found, will create it first`);
            // Try to create exec_sql by executing the first statement differently
            // But we can't execute SQL without exec_sql...
            errorCount++;
          } else {
            console.error(`❌ Statement ${i + 1}: ${error.message.split('\n')[0]}`);
            errorCount++;
          }
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

  if (errorCount > 0 && successCount === 0) {
    console.log('\n❌ Cannot execute SQL automatically without exec_sql function.\n');
    console.log('📝 Please run the SQL manually in Supabase SQL Editor:\n');
    console.log('   1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new');
    console.log('   2. Open: scripts/setup-without-exec-sql.sql');
    console.log('   3. Copy ALL contents');
    console.log('   4. Paste into SQL Editor');
    console.log('   5. Click "Run"\n');
    console.log('   After that, I can execute SQL automatically!\n');
    process.exit(1);
  } else if (successCount > 0) {
    console.log(`\n✅ Successfully executed ${successCount} statements!`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} statements had errors (may be expected)`);
    }
    console.log('\n📝 Next: Import your Excel data');
    console.log('   Run: npm run import-excel-supabase\n');
    process.exit(0);
  }
}

createAll();




