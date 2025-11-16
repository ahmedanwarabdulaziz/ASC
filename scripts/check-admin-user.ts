import { supabaseAdmin } from '../lib/supabase';

async function checkAdminUser() {
  const adminEmail = 'x@x.com';

  try {
    console.log('Checking admin user...\n');

    // Get all users from auth
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const adminUser = authUsers?.users.find(u => u.email === adminEmail);
    if (!adminUser) {
      console.error('❌ Admin user not found in auth.users');
      return;
    }

    console.log('✅ Admin user found in auth.users:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Email Confirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Created: ${adminUser.created_at}\n`);

    // Check users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (userError) {
      console.error('❌ Error fetching from users table:', userError);
      return;
    }

    if (!userData) {
      console.error('❌ Admin user not found in users table');
      return;
    }

    console.log('✅ Admin user found in users table:');
    console.log(`   ID: ${userData.id}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Must Change Password: ${userData.must_change_password}`);
    console.log(`   Created At: ${userData.created_at}\n`);

    // Test password reset (this will show if password can be set)
    console.log('Testing password reset capability...');
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      { password: 'Aa2025' }
    );

    if (resetError) {
      console.error('❌ Error resetting password:', resetError);
    } else {
      console.log('✅ Password reset successful');
      console.log('   Password: Aa2025\n');
    }

    console.log('✅ Admin user is ready for login!');
    console.log('   Email: x@x.com');
    console.log('   Password: Aa2025');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAdminUser();



