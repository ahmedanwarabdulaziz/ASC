import { supabaseAdmin } from '../lib/supabase';

async function createUsersTable() {
  console.log('🚀 Creating users table and authentication setup...\n');

  const statements = [
    // Step 1: Create table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'team_leader')),
      must_change_password BOOLEAN DEFAULT true,
      created_by UUID REFERENCES auth.users(id),
      display_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Step 2: Create indexes
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
    `CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by)`,

    // Step 3: Enable RLS
    `ALTER TABLE users ENABLE ROW LEVEL SECURITY`,

    // Step 4: Drop existing policies
    `DROP POLICY IF EXISTS "Users can read own record" ON users`,
    `DROP POLICY IF EXISTS "Admins can read all users" ON users`,
    `DROP POLICY IF EXISTS "Supervisors can read supervisors and leaders" ON users`,
    `DROP POLICY IF EXISTS "Admins can insert users" ON users`,
    `DROP POLICY IF EXISTS "Supervisors can insert team leaders" ON users`,
    `DROP POLICY IF EXISTS "Users can update own password change" ON users`,
    `DROP POLICY IF EXISTS "Admins can update any user" ON users`,

    // Step 5: Create policies
    `CREATE POLICY "Users can read own record" ON users
      FOR SELECT
      USING (auth.uid() = id)`,

    `CREATE POLICY "Admins can read all users" ON users
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'admin'
        )
      )`,

    `CREATE POLICY "Supervisors can read supervisors and leaders" ON users
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
        AND role IN ('supervisor', 'team_leader')
      )`,

    `CREATE POLICY "Admins can insert users" ON users
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'admin'
        )
      )`,

    `CREATE POLICY "Supervisors can insert team leaders" ON users
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
        AND role = 'team_leader'
      )`,

    `CREATE POLICY "Users can update own password change" ON users
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id)`,

    `CREATE POLICY "Admins can update any user" ON users
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'admin'
        )
      )`,

    // Step 6: Create function
    `CREATE OR REPLACE FUNCTION update_users_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`,

    // Step 7: Drop and create trigger
    `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
    `CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_users_updated_at()`,
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

  console.log('\n✅ Users table setup completed!');
}

createUsersTable();




