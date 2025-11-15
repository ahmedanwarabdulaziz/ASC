-- Drop and recreate get_user_role function to return role and must_change_password
DROP FUNCTION IF EXISTS get_user_role(UUID);

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TABLE(role TEXT, must_change_password BOOLEAN) AS $$
  SELECT role, must_change_password FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

