import { supabaseAdmin } from '../lib/supabase';

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to users table...\n');

  const statements = [
    // Add must_change_password column if it doesn't exist
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'must_change_password'
      ) THEN
        ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT true;
      END IF;
    END $$;`,

    // Add display_name column if it doesn't exist
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'display_name'
      ) THEN
        ALTER TABLE users ADD COLUMN display_name TEXT;
      END IF;
    END $$;`,

    // Add created_by column if it doesn't exist
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_by'
      ) THEN
        ALTER TABLE users ADD COLUMN created_by UUID REFERENCES auth.users(id);
      END IF;
    END $$;`,
  ];

  for (let i = 0; i < statements.length; i++) {
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: statements[i],
      });

      if (error) {
        console.error(`❌ Statement ${i + 1}: ${error.message}`);
      } else {
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      }
    } catch (err: any) {
      console.error(`❌ Statement ${i + 1}: ${err.message}`);
    }
  }

  console.log('\n✅ Missing columns added!');
}

addMissingColumns();



