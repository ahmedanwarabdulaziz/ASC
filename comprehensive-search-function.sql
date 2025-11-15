-- ============================================
-- COMPREHENSIVE PROFESSIONAL SEARCH FUNCTION
-- Searches directly on original columns + normalized fields
-- Ensures NO names are missed
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
  normalized_query TEXT;
  query_tokens TEXT[];
  first_token TEXT;
  second_token TEXT;
  query_words TEXT[];
  first_word TEXT;
  second_word TEXT;
  search_pattern TEXT;
BEGIN
  -- Normalize search query for token-based search
  normalized_query := COALESCE(normalize_arabic_text(search_query), search_query);
  query_tokens := COALESCE(extract_arabic_tokens(normalized_query), ARRAY[]::TEXT[]);
  query_words := string_to_array(trim(search_query), ' ');
  
  first_token := query_tokens[1];
  second_token := query_tokens[2];
  first_word := query_words[1];
  second_word := query_words[2];
  search_pattern := '%' || search_query || '%';
  
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
        -- Priority 1: Exact name match on ORIGINAL column (highest - 1000 points)
        CASE WHEN m.name = search_query THEN 1000.0
        WHEN lower(m.name) = lower(search_query) THEN 999.0
        -- Priority 2: Exact match on normalized name (998 points)
        WHEN m.name_search = normalized_query THEN 998.0
        WHEN lower(m.name_search) = lower(normalized_query) THEN 997.0
        -- Priority 3: Name starts with query (ORIGINAL column - 950 points)
        WHEN m.name LIKE search_query || '%' THEN 950.0
        WHEN m.name ILIKE search_query || '%' THEN 949.0
        -- Priority 4: Name starts with query (normalized - 900 points)
        WHEN m.name_search LIKE normalized_query || '%' THEN 900.0
        WHEN m.name_search ILIKE normalized_query || '%' THEN 899.0
        -- Priority 5: First word matches first name word (ORIGINAL - 850 points)
        WHEN first_word IS NOT NULL AND m.name LIKE first_word || '%' THEN 850.0
        WHEN first_word IS NOT NULL AND m.name ILIKE first_word || '%' THEN 849.0
        -- Priority 6: First word matches first name word (normalized - 800 points)
        WHEN first_word IS NOT NULL AND m.name_search LIKE first_word || '%' THEN 800.0
        WHEN first_word IS NOT NULL AND m.name_search ILIKE first_word || '%' THEN 799.0
        -- Priority 7: First token matches first name token exactly (750 points)
        WHEN first_token IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(m.name_tokens) AS token 
          WHERE token = first_token
        ) THEN 750.0
        -- Priority 8: Name contains query (ORIGINAL column - 700 points)
        WHEN m.name LIKE search_pattern THEN 700.0
        WHEN m.name ILIKE search_pattern THEN 699.0
        -- Priority 9: Name contains query (normalized - 650 points)
        WHEN m.name_search LIKE '%' || normalized_query || '%' THEN 650.0
        WHEN m.name_search ILIKE '%' || normalized_query || '%' THEN 649.0
        -- Priority 10: First token is prefix of first name token (600 points)
        WHEN first_token IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(m.name_tokens) AS token 
          WHERE token LIKE first_token || '%'
        ) THEN 600.0
        -- Priority 11: First two words match (ORIGINAL - 550 points)
        WHEN first_word IS NOT NULL AND second_word IS NOT NULL AND
             m.name LIKE '%' || first_word || '%' || second_word || '%' THEN 550.0
        WHEN first_word IS NOT NULL AND second_word IS NOT NULL AND
             m.name ILIKE '%' || first_word || '%' || second_word || '%' THEN 549.0
        -- Priority 12: First two tokens match in order (500 points)
        WHEN first_token IS NOT NULL AND second_token IS NOT NULL AND
             array_length(m.name_tokens, 1) >= 2 AND
             m.name_tokens[1] = first_token AND m.name_tokens[2] = second_token THEN 500.0
        -- Priority 13: Full-text search rank (400-450 points)
        WHEN m.search_vector @@ plainto_tsquery('simple', normalized_query) THEN
          400.0 + (COALESCE(ts_rank(m.search_vector, plainto_tsquery('simple', normalized_query)), 0) * 50.0)
        -- Priority 14: Array contains matching tokens (350 points)
        WHEN m.search_tokens && query_tokens THEN 350.0
        -- Priority 15: Name tokens match (300 points)
        WHEN m.name_tokens && query_tokens THEN 300.0
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
      -- Other fields matches (lower scores)
      COALESCE(
        CASE 
        -- Address match (ORIGINAL column)
        WHEN m.address ILIKE search_pattern THEN 100.0
        WHEN m.address_search ILIKE '%' || normalized_query || '%' THEN 95.0
        -- Job match (ORIGINAL column)
        WHEN m.job ILIKE search_pattern THEN 150.0
        WHEN m.job_search ILIKE '%' || normalized_query || '%' THEN 145.0
        -- Phone/Mobile/Member ID
        WHEN m.mobile ILIKE search_pattern THEN 50.0
        WHEN m.phone ILIKE search_pattern THEN 50.0
        WHEN m.member_id ILIKE search_pattern THEN 50.0
        ELSE 0 END,
        0
      )
      ) as rank,
      -- Match type for debugging/display
      CASE 
        WHEN m.name = search_query THEN 'exact_name'
        WHEN m.name LIKE search_query || '%' THEN 'prefix_name'
        WHEN m.name_search = normalized_query THEN 'exact_name_normalized'
        WHEN m.name_search LIKE normalized_query || '%' THEN 'prefix_name_normalized'
        WHEN first_word IS NOT NULL AND m.name LIKE first_word || '%' THEN 'first_name_prefix'
        WHEN first_token IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(m.name_tokens) AS token WHERE token = first_token
        ) THEN 'first_name_exact'
        WHEN m.name ILIKE search_pattern THEN 'name_contains'
        WHEN m.name_tokens && query_tokens THEN 'name_token_match'
        WHEN m.search_vector @@ plainto_tsquery('simple', normalized_query) THEN 'fulltext'
        WHEN m.address ILIKE search_pattern THEN 'address_match'
        WHEN m.job ILIKE search_pattern THEN 'job_match'
        ELSE 'partial'
      END as match_type
    FROM members m
    WHERE 
      -- PRIMARY: Search ORIGINAL columns directly (ensures no names missed)
      m.name ILIKE search_pattern
      OR m.name LIKE search_pattern
      OR m.address ILIKE search_pattern
      OR m.job ILIKE search_pattern
      -- SECONDARY: Search normalized fields
      OR m.name_search ILIKE '%' || normalized_query || '%'
      OR m.address_search ILIKE '%' || normalized_query || '%'
      OR m.job_search ILIKE '%' || normalized_query || '%'
      -- TERTIARY: Token-based search
      OR m.search_tokens && query_tokens
      OR m.name_tokens && query_tokens
      -- QUATERNARY: Full-text search
      OR m.search_vector @@ plainto_tsquery('simple', normalized_query)
      -- QUINARY: Phone/Mobile/Member ID
      OR m.mobile ILIKE search_pattern
      OR m.phone ILIKE search_pattern
      OR m.member_id ILIKE search_pattern
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
    -- Secondary sort: Match type priority
    CASE WHEN scored_members.match_type = 'exact_name' THEN 1
         WHEN scored_members.match_type = 'exact_name_normalized' THEN 2
         WHEN scored_members.match_type = 'prefix_name' THEN 3
         WHEN scored_members.match_type = 'prefix_name_normalized' THEN 4
         WHEN scored_members.match_type = 'first_name_prefix' THEN 5
         WHEN scored_members.match_type = 'first_name_exact' THEN 6
         WHEN scored_members.match_type = 'name_contains' THEN 7
         WHEN scored_members.match_type = 'name_token_match' THEN 8
         WHEN scored_members.match_type = 'fulltext' THEN 9
         WHEN scored_members.match_type = 'job_match' THEN 10
         WHEN scored_members.match_type = 'address_match' THEN 11
         ELSE 12 END,
    -- Tertiary sort: Alphabetical by name
    scored_members.name ASC
  LIMIT 1000; -- Limit results for performance
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION search_members IS 'Comprehensive search: searches original columns directly + normalized fields + tokens. Ensures no names are missed.';


