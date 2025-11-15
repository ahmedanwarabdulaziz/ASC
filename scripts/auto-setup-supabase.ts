import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function autoSetup() {
  try {
    console.log('🚀 Auto-setting up Supabase database...\n');
    
    // Read the migration SQL
    const sqlPath = path.join(process.cwd(), 'supabase-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Step 1: Creating helper function (if needed)...\n');
    
    // First, try to create exec_sql helper function
    const helperSQL = `
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
    
    try {
      // Try to use the helper function if it exists
      const { error: helperError } = await supabaseAdmin.rpc('exec_sql', {
        sql: helperSQL
      });
      
      if (helperError && !helperError.message.includes('already exists')) {
        console.log('⚠️  Helper function needs to be created manually first');
        console.log('   Run this in Supabase SQL Editor:');
        console.log(helperSQL);
        console.log('');
      } else {
        console.log('✅ Helper function ready');
      }
    } catch (e) {
      console.log('⚠️  Helper function not found - will create it');
    }
    
    // Split SQL into statements and execute via helper function
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));
    
    console.log(`\n📋 Step 2: Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      if (statement.length < 20) continue;
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate')) {
            console.log(`✅ Statement ${i + 1}: Already exists (OK)`);
            successCount++;
          } else {
            console.log(`⚠️  Statement ${i + 1}: ${error.message.substring(0, 80)}`);
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1}: Executed`);
          successCount++;
        }
      } catch (err: any) {
        console.log(`❌ Statement ${i + 1}: ${err.message.substring(0, 80)}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors\n`);
    
    // Verify setup
    console.log('🔍 Verifying setup...\n');
    
    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('id')
      .limit(1);
    
    console.log(`Members table: ${membersError ? '❌ Not found' : '✅ Exists'}`);
    
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .limit(1);
    
    console.log(`Teams table: ${teamsError ? '❌ Not found' : '✅ Exists'}`);
    
    const { error: searchError } = await supabaseAdmin.rpc('search_members', {
      search_query: 'test'
    });
    
    console.log(`Search function: ${searchError ? '❌ Not found' : '✅ Exists'}`);
    
    if (membersError || teamsError || searchError) {
      console.log('\n📝 Some components are missing.');
      console.log('   Please run supabase-migration.sql manually in Supabase SQL Editor\n');
    } else {
      console.log('\n✅ All components are ready!');
      console.log('   You can now run: npm run import-excel-supabase\n');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please run supabase-migration.sql manually in Supabase SQL Editor\n');
    process.exit(1);
  }
}

autoSetup();

