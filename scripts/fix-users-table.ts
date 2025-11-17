import { supabaseAdmin } from '../lib/supabase';

async function fixUsersTable() {
  console.log('🔧 Fixing users table...\n');

  // Check if created_by column exists, if not add it
  const checkColumn = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_by'
      ) THEN
        ALTER TABLE users ADD COLUMN created_by UUID REFERENCES auth.users(id);
      END IF;
    END $$;
  `;

  // Create the missing index
  const createIndex = `CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by)`;

  try {
    console.log('Checking and adding created_by column if needed...');
    const { error: colError } = await supabaseAdmin.rpc('exec_sql', {
      sql: checkColumn,
    });
    if (colError) {
      console.error('❌ Error checking column:', colError.message);
    } else {
      console.log('✅ Column check completed');
    }

    console.log('Creating index on created_by...');
    const { error: idxError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createIndex,
    });
    if (idxError) {
      console.error('❌ Error creating index:', idxError.message);
    } else {
      console.log('✅ Index created successfully');
    }

    console.log('\n✅ Users table fix completed!');
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }
}

fixUsersTable();




