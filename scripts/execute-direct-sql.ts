import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Execute SQL directly using Supabase Admin
 * This works by executing SQL statements one by one
 */

async function executeDirectSQL(sqlFilePath: string) {
  console.log('🚀 Executing SQL directly...\n');

  const fullPath = path.isAbsolute(sqlFilePath) 
    ? sqlFilePath 
    : path.join(process.cwd(), sqlFilePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ SQL file not found: ${fullPath}`);
    process.exit(1);
  }

  let sql = fs.readFileSync(fullPath, 'utf8');
  
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

  console.log(`📋 Executing ${statements.length} SQL statements...\n`);

  // Since we can't use exec_sql, we need to use Supabase's REST API
  // But Supabase doesn't allow arbitrary SQL via REST API
  // So we'll need to use the SQL Editor or provide instructions
  
  console.log('⚠️  Cannot execute SQL automatically without exec_sql function.\n');
  console.log('📝 Please run this SQL file manually in Supabase SQL Editor:\n');
  console.log(`   File: ${fullPath}\n`);
  console.log('   1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new');
  console.log('   2. Copy ALL contents from the SQL file');
  console.log('   3. Paste into SQL Editor');
  console.log('   4. Click "Run"\n');
  console.log('   OR use the setup file: scripts/setup-without-exec-sql.sql\n');
  
  process.exit(1);
}

const sqlFile = process.argv[2] || 'scripts/setup-without-exec-sql.sql';
executeDirectSQL(sqlFile);




