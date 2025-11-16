-- Create a new function to get user data (role and must_change_password) without recursion
CREATE OR REPLACE FUNCTION get_user_data(user_id UUID)
RETURNS TABLE(role TEXT, must_change_password BOOLEAN) AS $$
  SELECT role, must_change_password FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;



