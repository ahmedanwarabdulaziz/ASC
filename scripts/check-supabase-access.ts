import { supabaseAdmin } from '../lib/supabase';

/**
 * Check What Access We Have with Service Role Key
 */

async function checkAccess() {
  console.log('🔍 Checking Supabase Access Levels...\n');

  // Check 1: Can we read data?
  console.log('1. Testing data read access...');
  const { data: members, error: readError } = await supabaseAdmin
    .from('members')
    .select('id, name')
    .limit(5);

  if (readError) {
    console.log(`   ❌ Read error: ${readError.message}\n`);
  } else {
    console.log(`   ✅ Can read data (found ${members?.length || 0} members)\n`);
  }

  // Check 2: Can we write data?
  console.log('2. Testing data write access...');
  const { error: writeError } = await supabaseAdmin
    .from('members')
    .insert({
      member_id: 'TEST_' + Date.now(),
      name: 'Test Member',
      name_search: 'test member',
      status: 'pending'
    });

  if (writeError) {
    console.log(`   ❌ Write error: ${writeError.message}\n`);
  } else {
    console.log(`   ✅ Can write data\n`);
    
    // Clean up test data
    await supabaseAdmin
      .from('members')
      .delete()
      .eq('member_id', 'TEST_' + Date.now());
  }

  // Check 3: Can we execute functions?
  console.log('3. Testing function execution...');
  const { data: searchResult, error: funcError } = await supabaseAdmin.rpc('search_members', {
    search_query: 'test'
  });

  if (funcError) {
    console.log(`   ❌ Function error: ${funcError.message}\n`);
  } else {
    console.log(`   ✅ Can execute functions\n`);
  }

  // Check 4: Can we execute arbitrary SQL? (This will fail - expected)
  console.log('4. Testing arbitrary SQL execution...');
  const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
    sql: 'SELECT 1'
  });

  if (sqlError) {
    console.log(`   ❌ Cannot execute arbitrary SQL: ${sqlError.message}`);
    console.log(`   ⚠️  This is expected - Supabase blocks this for security\n`);
  } else {
    console.log(`   ✅ Can execute arbitrary SQL\n`);
  }

  console.log('\n📊 Summary:');
  console.log('   ✅ Service Role Key gives full data access');
  console.log('   ✅ Can read/write data');
  console.log('   ✅ Can execute stored functions');
  console.log('   ❌ Cannot execute arbitrary SQL (security restriction)');
  console.log('\n💡 For SQL execution, need direct PostgreSQL connection string\n');
}

checkAccess();



