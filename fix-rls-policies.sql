-- Fix infinite recursion in RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own record" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Supervisors can read supervisors and leaders" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Supervisors can insert team leaders" ON users;
DROP POLICY IF EXISTS "Users can update own password change" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Create a function to check user role without recursion
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policy: Users can read their own record
CREATE POLICY "Users can read own record" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can read all users (using function to avoid recursion)
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'admin'
  );

-- Policy: Supervisors can read supervisors and team leaders
CREATE POLICY "Supervisors can read supervisors and leaders" ON users
  FOR SELECT
  USING (
    (get_user_role(auth.uid()) IN ('admin', 'supervisor') AND role IN ('supervisor', 'team_leader'))
    OR auth.uid() = id
  );

-- Policy: Admins can insert users
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'admin'
  );

-- Policy: Supervisors can insert team leaders
CREATE POLICY "Supervisors can insert team leaders" ON users
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'supervisor')
    AND role = 'team_leader'
  );

-- Policy: Users can update their own password change status
CREATE POLICY "Users can update own password change" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can update any user
CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'admin'
  );


