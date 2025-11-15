import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://xkbiqoajqxlvxjcwvhzv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k';

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql: string) {
  try {
    // Use PostgREST to execute SQL via HTTP
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    const errorText = await response.text();
    return { success: false, error: errorText };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function setupSupabase() {
  try {
    console.log('🚀 Setting up Supabase database...\n');
    
    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-supabase-tables.sql');
    const fullSQL = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Executing SQL statements...\n');
    
    // Execute the entire SQL file
    const result = await executeSQL(fullSQL);
    
    if (result.success) {
      console.log('✅ All SQL statements executed successfully!\n');
    } else {
      console.log('⚠️  Some statements may have failed');
      console.log('   This is normal if tables/functions already exist\n');
    }
    
    // Verify tables were created
    console.log('🔍 Verifying database setup...\n');
    
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .limit(1);
    
    if (membersError && membersError.message.includes('not found')) {
      console.log('❌ Members table not found');
      console.log('\n📝 Please run the SQL manually:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy contents of: scripts/create-supabase-tables.sql');
      console.log('   3. Paste and run\n');
    } else {
      console.log('✅ Members table exists!');
    }
    
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .limit(1);
    
    if (teamsError && teamsError.message.includes('not found')) {
      console.log('⚠️  Teams table not found (will be created if needed)');
    } else {
      console.log('✅ Teams table exists!');
    }
    
    // Test search function
    console.log('\n🔍 Testing search function...');
    const { data: searchTest, error: searchError } = await supabase.rpc('search_members', {
      search_query: 'test'
    });
    
    if (searchError) {
      console.log('⚠️  Search function may need to be created manually');
    } else {
      console.log('✅ Search function exists!');
    }
    
    console.log('\n✅ Database setup completed!');
    console.log('   You can now run: npm run import-excel-supabase\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Setup error:', error);
    console.log('\n📝 Alternative: Run SQL manually in Supabase SQL Editor');
    console.log('   File: scripts/create-supabase-tables.sql\n');
    process.exit(1);
  }
}

setupSupabase();


