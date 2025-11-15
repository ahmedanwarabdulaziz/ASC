-- Test search directly in database
-- This will show if the name exists and if search finds it

-- First, check if the name exists
SELECT 
  id,
  member_id,
  name,
  name_search,
  address,
  job
FROM members
WHERE name ILIKE '%مصطفى%'
   OR name_search ILIKE '%مصطفى%'
LIMIT 10;

-- Test the search function
SELECT * FROM search_members('مصطفى') LIMIT 10;


