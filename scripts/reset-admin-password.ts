import { supabaseAdmin } from '../lib/supabase';

async function resetAdminPassword() {
  const adminEmail = 'x@x.com';
  const adminPassword = 'Aa2025';

  try {
    console.log('Resetting admin password...\n');

    // Get admin user from auth
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

    console.log('Found admin user:', adminUser.id);

    // Reset password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      { password: adminPassword }
    );

    if (updateError) {
      console.error('❌ Error resetting password:', updateError);
      return;
    }

    console.log('✅ Admin password reset successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  You can now login with these credentials.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetAdminPassword();


