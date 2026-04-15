const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
  const nationalId = '28305252400037';
  const email = `${nationalId}@assiut-sc.local`;
  const password = '5550555';

  console.log('Seeding Master Admin...');

  let personData;
  // 1. Create the base Person
  const { data: pData, error: personError } = await supabase
    .from('people')
    .insert({
      national_id: nationalId,
      first_name: 'مدير',
      last_name: 'النظام',
      phone_number: '01000000000',
    })
    .select()
    .single();

  if (personError) {
    if (personError.code === '23505') {
       console.log('Person already exists. Fetching id...');
       const {data: existingPerson} = await supabase.from('people').select('*').eq('national_id', nationalId).single();
       if(existingPerson) personData = existingPerson;
    } else {
       console.error('Error creating person:', personError);
       return;
    }
  } else {
    personData = pData;
  }

  // 2. Create the Supabase Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('Auth user already registered.');
    } else {
        console.error('Error creating auth user:', authError);
        return;
    }
  }

  let userId = authData?.user?.id;
  if (!userId) {
     const {data: existingUser} = await supabase.auth.admin.listUsers();
     const u = existingUser.users.find(u => u.email === email);
     if(u) {
       userId = u.id;
     } else {
       console.error('Could not find Auth User ID!');
       return;
     }
  }

  // 3. Link via system_users
  const { error: sysUserError } = await supabase
    .from('system_users')
    .insert({
      id: userId,
      person_id: personData.id,
      is_active: true
    });

  if (sysUserError) {
    if(sysUserError.code === '23505') {
        console.log('System user link already exists.');
    } else {
        console.error('Error creating system user link:', sysUserError);
        return;
    }
  }

  // 4. Link person_roles to SYS_ADMIN (00000000-0000-0000-0000-000000000001)
  console.log('Linking System Admin role binding...');
  const { error: seedRoleError } = await supabase.from('person_roles').insert({
     person_id: personData.id,
     role_id: '00000000-0000-0000-0000-000000000001',
     status: 'active'
  });

  if (seedRoleError) {
    if (seedRoleError.code === '23505') {
      console.log('SYS_ADMIN role already bound.');
    } else {
      console.error('Error binding SYS_ADMIN role:', seedRoleError);
      return;
    }
  }

  console.log('Master Admin created successfully! Try logging in now.');
}

seedAdmin();
