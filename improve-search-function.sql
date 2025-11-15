-- ============================================
-- IMPROVED PROFESSIONAL ARABIC SEARCH FUNCTION
-- Prioritizes first name matches and accurate sorting
-- ============================================

-- Drop and recreate the search function with improved ranking
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
  normalized_query TEXT;
  query_tokens TEXT[];
  first_token TEXT;
  second_token TEXT;
  query_words TEXT[];
  first_word TEXT;
  second_word TEXT;
BEGIN
  -- Normalize search query
  normalized_query := normalize_arabic_text(search_query);
  query_tokens := extract_arabic_tokens(normalized_query);
  query_words := string_to_array(trim(normalized_query), ' ');
  
  first_token := query_tokens[1];
  second_token := query_tokens[2];
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
      -- Calculate comprehensive relevance score
      (
        -- Priority 1: Exact name match (highest score - 1000 points)
        CASE WHEN m.name_search = normalized_query THEN 1000.0
        -- Priority 2: Exact name match (case-insensitive)
        WHEN lower(m.name_search) = lower(normalized_query) THEN 999.0
        -- Priority 3: Name starts with query (first name match - 900 points)
        WHEN m.name_search LIKE normalized_query || '%' THEN 900.0
        WHEN m.name_search ILIKE normalized_query || '%' THEN 899.0
        -- Priority 4: First token matches first name token exactly (800 points)
        WHEN first_token IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(m.name_tokens) AS token 
          WHERE token = first_token
        ) THEN 800.0
        -- Priority 5: First word matches first name word (700 points)
        WHEN first_word IS NOT NULL AND m.name_search LIKE first_word || '%' THEN 700.0
        WHEN first_word IS NOT NULL AND m.name_search ILIKE first_word || '%' THEN 699.0
        -- Priority 6: First token is prefix of first name token (600 points)
        WHEN first_token IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(m.name_tokens) AS token 
          WHERE token LIKE first_token || '%'
        ) THEN 600.0
        -- Priority 7: First two tokens match first two name tokens in order (500 points)
        WHEN first_token IS NOT NULL AND second_token IS NOT NULL AND
             array_length(m.name_tokens, 1) >= 2 AND
             m.name_tokens[1] = first_token AND m.name_tokens[2] = second_token THEN 500.0
        -- Priority 8: First two words match first two name words in order (450 points)
        WHEN first_word IS NOT NULL AND second_word IS NOT NULL AND
             m.name_search LIKE first_word || '%' || second_word || '%' THEN 450.0
        -- Priority 9: All query tokens match name tokens in order (400 points)
        WHEN array_length(query_tokens, 1) > 0 AND
             array_length(m.name_tokens, 1) >= array_length(query_tokens, 1) AND
             m.name_tokens[1:array_length(query_tokens, 1)] = query_tokens THEN 400.0
        -- Priority 10: Full-text search rank (300-350 points based on relevance)
        WHEN m.search_vector @@ plainto_tsquery('simple', normalized_query) THEN
          300.0 + (COALESCE(ts_rank(m.search_vector, plainto_tsquery('simple', normalized_query)), 0) * 50.0)
        ELSE 0.0
      END +
      -- Bonus: Array contains matching tokens (adds 5 points per matching token)
      COALESCE(
        CASE WHEN m.search_tokens && query_tokens THEN 
          array_length(array(
            SELECT unnest(m.search_tokens) 
            INTERSECT 
            SELECT unnest(query_tokens)
          ), 1) * 5.0
        ELSE 0 END,
        0
      ) +
      -- Bonus: Name contains all query tokens (adds 20 points)
      COALESCE(
        CASE WHEN m.name_tokens && query_tokens AND 
                  array_length(array(
                    SELECT unnest(m.name_tokens) 
                    INTERSECT 
                    SELECT unnest(query_tokens)
                  ), 1) = array_length(query_tokens, 1) THEN 20.0
        ELSE 0 END,
        0
      ) +
      -- Bonus: Query tokens appear in order in name (adds 30 points)
      COALESCE(
        CASE WHEN array_length(query_tokens, 1) > 1 AND
                  array_length(m.name_tokens, 1) >= array_length(query_tokens, 1) THEN
          CASE WHEN (
            SELECT COUNT(*) FROM (
              SELECT i FROM generate_series(1, array_length(query_tokens, 1)) AS i
              WHERE m.name_tokens[i] = query_tokens[i]
            ) AS matches
          ) = array_length(query_tokens, 1) THEN 30.0 ELSE 0 END
        ELSE 0 END,
        0
      ) +
      -- Penalty: Match in other fields (address, job) - lower score (100-200 points)
      COALESCE(
        CASE WHEN m.address_search ILIKE '%' || normalized_query || '%' THEN 100.0
        WHEN m.job_search ILIKE '%' || normalized_query || '%' THEN 150.0
        WHEN m.mobile ILIKE '%' || search_query || '%' THEN 50.0
        WHEN m.phone ILIKE '%' || search_query || '%' THEN 50.0
        WHEN m.member_id ILIKE '%' || search_query || '%' THEN 50.0
        ELSE 0 END,
        0
      )
      ) as rank,
      -- Match type for debugging/display
      CASE 
        WHEN m.name_search = normalized_query THEN 'exact_name'
        WHEN m.name_search LIKE normalized_query || '%' THEN 'prefix_name'
        WHEN first_token IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(m.name_tokens) AS token WHERE token = first_token
        ) THEN 'first_name_exact'
        WHEN first_word IS NOT NULL AND m.name_search LIKE first_word || '%' THEN 'first_name_prefix'
        WHEN m.name_tokens && query_tokens THEN 'name_token_match'
        WHEN m.search_vector @@ plainto_tsquery('simple', normalized_query) THEN 'fulltext'
        WHEN m.address_search ILIKE '%' || normalized_query || '%' THEN 'address_match'
        WHEN m.job_search ILIKE '%' || normalized_query || '%' THEN 'job_match'
        ELSE 'partial'
      END as match_type
    FROM members m
    WHERE 
      -- Method 1: Full-text search (uses GIN index - fastest)
      m.search_vector @@ plainto_tsquery('simple', normalized_query)
      -- Method 2: Array contains (fast prefix matching)
      OR m.search_tokens && query_tokens
      -- Method 3: Name tokens match
      OR m.name_tokens && query_tokens
      -- Method 4: ILIKE search on normalized fields (backup)
      OR m.name_search ILIKE '%' || normalized_query || '%'
      OR m.address_search ILIKE '%' || normalized_query || '%'
      OR m.job_search ILIKE '%' || normalized_query || '%'
      OR m.mobile ILIKE '%' || search_query || '%'
      OR m.phone ILIKE '%' || search_query || '%'
      OR m.member_id ILIKE '%' || search_query || '%'
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
    -- Primary sort: Rank (highest first)
    scored_members.rank DESC NULLS LAST,
    -- Secondary sort: Exact name match priority
    CASE WHEN scored_members.match_type = 'exact_name' THEN 1
         WHEN scored_members.match_type = 'prefix_name' THEN 2
         WHEN scored_members.match_type = 'first_name_exact' THEN 3
         WHEN scored_members.match_type = 'first_name_prefix' THEN 4
         WHEN scored_members.match_type = 'name_token_match' THEN 5
         WHEN scored_members.match_type = 'fulltext' THEN 6
         ELSE 7 END,
    -- Tertiary sort: Alphabetical by name
    scored_members.name ASC
  LIMIT 1000; -- Limit results for performance
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION search_members IS 'Professional Arabic search with first name priority and accurate ranking';

