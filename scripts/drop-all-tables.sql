-- Drop all existing tables, functions, and triggers
-- This will clean up the database for a fresh start

-- Drop triggers first
DROP TRIGGER IF EXISTS update_members_search_vector_trigger ON members;

-- Drop functions
DROP FUNCTION IF EXISTS search_members(TEXT);
DROP FUNCTION IF EXISTS update_members_search_vector();
DROP FUNCTION IF EXISTS exec_sql(TEXT);

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop indexes if they exist separately
DROP INDEX IF EXISTS members_search_vector_idx;
DROP INDEX IF EXISTS members_name_idx;
DROP INDEX IF EXISTS members_member_id_idx;
DROP INDEX IF EXISTS members_status_idx;
DROP INDEX IF EXISTS members_team_id_idx;
DROP INDEX IF EXISTS members_created_at_idx;

-- Success message
SELECT 'All tables, functions, and triggers dropped successfully' AS message;


