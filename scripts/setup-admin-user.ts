import { supabaseAdmin } from '../lib/supabase';

async function setupAdminUser() {
  const adminEmail = 'x@x.com';
  const adminPassword = 'Aa2025';

  try {
    console.log('Creating admin user...');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.code === 'email_exists') {
        console.log('Admin user already exists in auth. Checking users table...');
        
        // Get the user from auth
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          console.error('Error listing users:', listError);
          return;
        }
        
        const adminUser = existingUsers?.users.find(u => u.email === adminEmail);
        
        if (adminUser) {
          // Check if user exists in users table
          const { data: userData, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', adminUser.id)
            .single();

          if (fetchError && fetchError.code === 'PGRST116') {
            // User doesn't exist in users table, create the record using SQL
            console.log('Creating user record in users table...');
            const insertSQL = `
              INSERT INTO users (id, email, role, must_change_password, created_at, updated_at)
              VALUES ('${adminUser.id}', '${adminEmail}', 'admin', true, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING;
            `;
            
            const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
              sql: insertSQL,
            });

            if (sqlError) {
              console.error('Error creating user record:', sqlError);
              return;
            }
            console.log('✅ Admin user record created in users table');
          } else if (userData) {
            console.log('✅ Admin user already exists in users table');
            console.log(`   Email: ${userData.email}`);
            console.log(`   Role: ${userData.role}`);
          } else {
            console.error('Error fetching user data:', fetchError);
          }
        } else {
          console.error('Admin user not found in auth users list');
        }
        return;
      }
      console.error('Error creating admin user:', authError);
      return;
    }

    if (!authData.user) {
      console.error('No user data returned');
      return;
    }

    console.log('Admin user created in auth. Creating user record...');

    // Create user record in users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        role: 'admin',
        must_change_password: true,
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  User must change password on first login');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupAdminUser();

