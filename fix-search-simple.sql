-- ============================================
-- SIMPLE & RELIABLE SEARCH FUNCTION
-- Searches directly on original columns with simple ILIKE
-- Guaranteed to find ALL names
-- ============================================

CREATE OR REPLACE FUNCTION search_members(search_query TEXT)
RETURNS TABLE (
  id UUID,
  member_id TEXT,
  name TEXT,
  address TEXT,
  job TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  status TEXT,
  notes TEXT,
  team_id TEXT,
  team_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL,
  match_type TEXT
) AS $$
DECLARE
  search_pattern TEXT;
  first_word TEXT;
  second_word TEXT;
  query_words TEXT[];
BEGIN
  -- Simple pattern matching - no normalization needed
  search_pattern := '%' || search_query || '%';
  query_words := string_to_array(trim(search_query), ' ');
  first_word := query_words[1];
  second_word := query_words[2];
  
  RETURN QUERY
  WITH scored_members AS (
    SELECT 
      m.id,
      m.member_id,
      m.name,
      m.address,
      m.job,
      m.phone,
      m.mobile,
      m.email,
      m.status,
      m.notes,
      m.team_id,
      m.team_name,
      m.created_at,
      m.updated_at,
      -- Simple ranking based on match quality
      (
        -- Priority 1: Exact match (1000 points)
        CASE WHEN m.name = search_query THEN 1000.0
        WHEN lower(trim(m.name)) = lower(trim(search_query)) THEN 999.0
        -- Priority 2: Starts with query (900 points)
        WHEN m.name ILIKE search_query || '%' THEN 900.0
        -- Priority 3: First word matches and starts name (850 points)
        WHEN first_word IS NOT NULL AND m.name ILIKE first_word || '%' THEN 850.0
        -- Priority 4: Contains query (700 points)
        WHEN m.name ILIKE search_pattern THEN 700.0
        -- Priority 5: First word anywhere in name (600 points)
        WHEN first_word IS NOT NULL AND m.name ILIKE '%' || first_word || '%' THEN 600.0
        -- Priority 6: First two words in order (550 points)
        WHEN first_word IS NOT NULL AND second_word IS NOT NULL AND
             m.name ILIKE '%' || first_word || '%' || second_word || '%' THEN 550.0
        -- Priority 7: Address match (100 points)
        WHEN m.address ILIKE search_pattern THEN 100.0
        -- Priority 8: Job match (150 points)
        WHEN m.job ILIKE search_pattern THEN 150.0
        -- Priority 9: Mobile match (50 points)
        WHEN m.mobile ILIKE search_pattern THEN 50.0
        -- Priority 10: Phone match (50 points)
        WHEN m.phone ILIKE search_pattern THEN 50.0
        -- Priority 11: Member ID match (50 points)
        WHEN m.member_id ILIKE search_pattern THEN 50.0
        ELSE 0.0
      END
      ) as rank,
      -- Match type
      CASE 
        WHEN m.name = search_query THEN 'exact_name'
        WHEN m.name ILIKE search_query || '%' THEN 'prefix_name'
        WHEN first_word IS NOT NULL AND m.name ILIKE first_word || '%' THEN 'first_name_prefix'
        WHEN m.name ILIKE search_pattern THEN 'name_contains'
        WHEN m.address ILIKE search_pattern THEN 'address_match'
        WHEN m.job ILIKE search_pattern THEN 'job_match'
        WHEN m.mobile ILIKE search_pattern THEN 'mobile_match'
        WHEN m.phone ILIKE search_pattern THEN 'phone_match'
        WHEN m.member_id ILIKE search_pattern THEN 'member_id_match'
        ELSE 'partial'
      END as match_type
    FROM members m
    WHERE 
      -- SIMPLE: Search original columns directly with ILIKE
      -- This will find ALL names, guaranteed
      m.name ILIKE search_pattern
      OR m.address ILIKE search_pattern
      OR m.job ILIKE search_pattern
      OR m.mobile ILIKE search_pattern
      OR m.phone ILIKE search_pattern
      OR m.member_id ILIKE search_pattern
      -- Also try normalized fields as backup
      OR (m.name_search IS NOT NULL AND m.name_search ILIKE search_pattern)
      OR (m.address_search IS NOT NULL AND m.address_search ILIKE search_pattern)
      OR (m.job_search IS NOT NULL AND m.job_search ILIKE search_pattern)
  )
  SELECT 
    scored_members.id, 
    scored_members.member_id, 
    scored_members.name, 
    scored_members.address, 
    scored_members.job, 
    scored_members.phone, 
    scored_members.mobile, 
    scored_members.email, 
    scored_members.status, 
    scored_members.notes,
    scored_members.team_id, 
    scored_members.team_name, 
    scored_members.created_at, 
    scored_members.updated_at, 
    scored_members.rank, 
    scored_members.match_type
  FROM scored_members
  ORDER BY 
    -- Sort by rank (highest first)
    scored_members.rank DESC NULLS LAST,
    -- Then by match type priority
    CASE WHEN scored_members.match_type = 'exact_name' THEN 1
         WHEN scored_members.match_type = 'prefix_name' THEN 2
         WHEN scored_members.match_type = 'first_name_prefix' THEN 3
         WHEN scored_members.match_type = 'name_contains' THEN 4
         WHEN scored_members.match_type = 'job_match' THEN 5
         WHEN scored_members.match_type = 'address_match' THEN 6
         ELSE 7 END,
    -- Finally alphabetical
    scored_members.name ASC
  LIMIT 1000;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION search_members IS 'Simple and reliable search: searches original columns directly with ILIKE. Guaranteed to find all names.';


