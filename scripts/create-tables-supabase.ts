import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function createTables() {
  try {
    console.log('🚀 Creating Supabase tables and functions...\n');
    
    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-supabase-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements (semicolon-separated)
    // Remove comments and empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/)
    );
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement using Supabase REST API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip very short or comment-only statements
      if (statement.length < 20) continue;
      
      try {
        // Use Supabase REST API to execute SQL
        const response = await fetch(
          `https://xkbiqoajqxlvxjcwvhzv.supabase.co/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k`
            },
            body: JSON.stringify({ sql: statement })
          }
        );
        
        if (!response.ok) {
          // Try direct SQL execution via PostgREST
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate') ||
                error.message.includes('does not exist')) {
              console.log(`⚠️  Statement ${i + 1}: ${error.message.split('\n')[0]}`);
            } else {
              console.error(`❌ Statement ${i + 1} error:`, error.message);
              errorCount++;
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed`);
            successCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed`);
          successCount++;
        }
      } catch (err: any) {
        // Try alternative method - execute via Supabase client
        try {
          // For CREATE statements, we'll use a different approach
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            console.log(`📋 Statement ${i + 1}: Table creation (may need manual execution)`);
          } else if (statement.toUpperCase().includes('CREATE FUNCTION')) {
            console.log(`📋 Statement ${i + 1}: Function creation (may need manual execution)`);
          } else {
            console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
          }
        } catch (e) {
          console.error(`❌ Statement ${i + 1} failed:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors`);
    console.log('\n📝 IMPORTANT: Some statements may need manual execution.');
    console.log('   Please check Supabase Dashboard → SQL Editor');
    console.log('   and run any remaining statements from: scripts/create-supabase-tables.sql\n');
    
    // Try to verify tables exist
    console.log('🔍 Verifying tables...');
    const { data: membersCheck, error: membersError } = await supabaseAdmin
      .from('members')
      .select('id')
      .limit(1);
    
    if (membersError) {
      console.log('⚠️  Members table not found - please run SQL manually');
    } else {
      console.log('✅ Members table exists!');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Setup error:', error);
    console.log('\n📝 Please run the SQL manually in Supabase SQL Editor');
    process.exit(1);
  }
}

createTables();



