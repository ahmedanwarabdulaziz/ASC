import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * First create exec_sql function, then use it to execute the rest
 */

async function createExecSqlThenRun() {
  console.log('🚀 Creating exec_sql function first, then running setup...\n');

  // Step 1: Create exec_sql function using direct SQL execution
  // We'll try to use Supabase's Management API or direct SQL endpoint
  const createExecSqlSQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
  `.trim();

  console.log('📝 Step 1: Creating exec_sql function...\n');

  // Try Method 1: Use Supabase REST API with direct SQL execution
  const supabaseUrl = 'https://xkbiqoajqxlvxjcwvhzv.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k';

  // Try to execute via PostgREST SQL endpoint (if available)
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: createExecSqlSQL })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`⚠️  Cannot create exec_sql via REST API: ${errorText.substring(0, 100)}\n`);
      console.log('📝 Need to create exec_sql function manually first.\n');
      console.log('   Please run this SQL in Supabase SQL Editor:\n');
      console.log(createExecSqlSQL);
      console.log('\n   Then run: npm run execute-sql scripts/setup-without-exec-sql.sql\n');
      process.exit(1);
    } else {
      console.log('✅ exec_sql function created!\n');
    }
  } catch (error: any) {
    console.log(`⚠️  Error: ${error.message}\n`);
    console.log('📝 Need to create exec_sql function manually first.\n');
    console.log('   Please run this SQL in Supabase SQL Editor:\n');
    console.log(createExecSqlSQL);
    console.log('\n   Then run: npm run execute-sql scripts/setup-without-exec-sql.sql\n');
    process.exit(1);
  }

  // Step 2: Now use exec_sql to execute the setup SQL
  console.log('📝 Step 2: Executing setup SQL using exec_sql...\n');

  const sqlPath = path.join(process.cwd(), 'scripts', 'setup-without-exec-sql.sql');
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

  // Split into statements
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

  console.log(`📋 Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length < 10) continue;

    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
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
    console.log('\n✅ All tables and functions created successfully!');
    console.log('\n📝 Next: Import your Excel data');
    console.log('   Run: npm run import-excel-supabase\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  Completed with ${errorCount} error(s).`);
    process.exit(1);
  }
}

createExecSqlThenRun();



