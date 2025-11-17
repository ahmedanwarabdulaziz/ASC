import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://xkbiqoajqxlvxjcwvhzv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use Supabase REST API to execute SQL via pg_net extension or direct connection
    // Since Supabase doesn't expose direct SQL execution, we'll use a workaround
    
    // Try to execute via RPC if exec_sql function exists
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // If exec_sql doesn't exist, we need to use Management API or direct connection
      // For now, return error and suggest manual execution
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createTablesAndFunctions() {
  try {
    console.log('🚀 Creating Supabase tables and functions...\n');
    
    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-supabase-tables.sql');
    const fullSQL = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into statements
    const statements = fullSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements\n`);
    
    // Since Supabase JS client doesn't support direct SQL execution,
    // we'll create tables using the client methods where possible
    // and provide instructions for the rest
    
    console.log('📝 Creating tables using Supabase client...\n');
    
    // Check if members table exists, if not create it
    const { data: membersCheck, error: membersError } = await supabase
      .from('members')
      .select('id')
      .limit(1);
    
    if (membersError && membersError.message.includes('not found')) {
      console.log('⚠️  Members table needs to be created');
      console.log('   Please run the SQL manually in Supabase Dashboard\n');
    } else {
      console.log('✅ Members table exists');
    }
    
    // Try to create search function via RPC
    console.log('\n📝 Creating search function...');
    
    // The search function SQL
    const searchFunctionSQL = `
CREATE OR REPLACE FUNCTION search_members(search_query TEXT)
RETURNS TABLE (
  id UUID,
  member_id TEXT,
  name TEXT,
  address TEXT,
  job TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  status TEXT,
  notes TEXT,
  team_id TEXT,
  team_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
) AS $$
DECLARE
  first_word TEXT;
  query_words TEXT[];
BEGIN
  query_words := string_to_array(trim(search_query), ' ');
  first_word := query_words[1];
  
  RETURN QUERY
  SELECT 
    m.id,
    m.member_id,
    m.name,
    m.address,
    m.job,
    m.phone,
    m.mobile,
    m.email,
    m.status,
    m.notes,
    m.team_id,
    m.team_name,
    m.created_at,
    m.updated_at,
    ts_rank(m.search_vector, plainto_tsquery('simple', search_query)) as rank
  FROM members m
  WHERE m.search_vector @@ plainto_tsquery('simple', search_query)
     OR m.name_search ILIKE '%' || search_query || '%'
     OR m.address_search ILIKE '%' || search_query || '%'
     OR m.job_search ILIKE '%' || search_query || '%'
     OR m.mobile ILIKE '%' || search_query || '%'
     OR m.phone ILIKE '%' || search_query || '%'
     OR m.member_id ILIKE '%' || search_query || '%'
  ORDER BY 
    CASE WHEN m.name_search ILIKE search_query || '%' THEN 1 ELSE 2 END,
    CASE WHEN first_word IS NOT NULL AND m.name_search ILIKE first_word || '%' THEN 1 ELSE 2 END,
    rank DESC NULLS LAST,
    m.name;
END;
$$ LANGUAGE plpgsql;
    `;
    
    // Since we can't execute arbitrary SQL directly, we'll use a helper approach
    // Create a migration file that can be run in Supabase dashboard
    const migrationPath = path.join(process.cwd(), 'supabase-migration.sql');
    fs.writeFileSync(migrationPath, fullSQL);
    
    console.log('✅ Created migration file: supabase-migration.sql');
    console.log('\n📋 IMPORTANT: Please execute this SQL in Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new');
    console.log('   2. Copy contents of: supabase-migration.sql');
    console.log('   3. Paste and click Run');
    console.log('   4. Wait for all statements to complete\n');
    
    // Verify what exists
    console.log('🔍 Current database status:');
    
    const { data: members, error: mErr } = await supabase.from('members').select('id').limit(1);
    console.log(`   Members table: ${mErr ? '❌ Not found' : '✅ Exists'}`);
    
    const { data: teams, error: tErr } = await supabase.from('teams').select('id').limit(1);
    console.log(`   Teams table: ${tErr ? '❌ Not found' : '✅ Exists'}`);
    
    const { data: funcTest, error: fErr } = await supabase.rpc('search_members', { search_query: 'test' });
    console.log(`   Search function: ${fErr ? '❌ Not found' : '✅ Exists'}`);
    
    console.log('\n✅ Setup script completed!');
    console.log('   After running SQL manually, you can import data with:');
    console.log('   npm run import-excel-supabase\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTablesAndFunctions();




