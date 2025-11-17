-- ============================================
-- PROFESSIONAL ARABIC NORMALIZED SEARCH
-- Handles character variations: أ/ا, ى/ي, etc.
-- ============================================

-- First, ensure we have a comprehensive normalization function
CREATE OR REPLACE FUNCTION normalize_arabic_for_search(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN '';
  END IF;
  
  RETURN lower(
    translate(
      translate(
        translate(
          translate(
            translate(
              translate(
                translate(input_text,
                  -- Normalize all Alef variations to ا
                  'أإآا', 'اااا'),
                -- Normalize Teh Marbuta (ة) to Heh (ه)
                'ة', 'ه'),
              -- Normalize Alef Maksoora (ى) to Yeh (ي)
              'ى', 'ي'),
            -- Normalize Yeh variations (already ي)
            'ي', 'ي'),
          -- Remove all diacritics (tashkeel)
          'ًٌٍَُِّْ', ''),
        -- Remove zero-width characters
        '‌', ''),
      -- Remove extra spaces
      '  ', ' ')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Now create the search function with normalization
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
  search_pattern TEXT;
  first_word TEXT;
  second_word TEXT;
  query_words TEXT[];
BEGIN
  -- Normalize the search query
  normalized_query := normalize_arabic_for_search(search_query);
  search_pattern := '%' || normalized_query || '%';
  query_words := string_to_array(trim(normalized_query), ' ');
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
      -- Calculate rank with normalization
      (
        -- Priority 1: Exact match on normalized name (1000 points)
        CASE WHEN normalize_arabic_for_search(m.name) = normalized_query THEN 1000.0
        -- Priority 2: Normalized name starts with query (900 points)
        WHEN normalize_arabic_for_search(m.name) LIKE normalized_query || '%' THEN 900.0
        -- Priority 3: First word matches normalized name start (850 points)
        WHEN first_word IS NOT NULL AND normalize_arabic_for_search(m.name) LIKE first_word || '%' THEN 850.0
        -- Priority 4: Normalized name contains query (700 points)
        WHEN normalize_arabic_for_search(m.name) LIKE search_pattern THEN 700.0
        -- Priority 5: First word anywhere in normalized name (600 points)
        WHEN first_word IS NOT NULL AND normalize_arabic_for_search(m.name) LIKE '%' || first_word || '%' THEN 600.0
        -- Priority 6: First two words in order (550 points)
        WHEN first_word IS NOT NULL AND second_word IS NOT NULL AND
             normalize_arabic_for_search(m.name) LIKE '%' || first_word || '%' || second_word || '%' THEN 550.0
        -- Priority 7: Also check original name_search field (500 points)
        WHEN m.name_search IS NOT NULL AND normalize_arabic_for_search(m.name_search) LIKE search_pattern THEN 500.0
        -- Priority 8: Address match (100 points)
        WHEN normalize_arabic_for_search(COALESCE(m.address, '')) LIKE search_pattern THEN 100.0
        -- Priority 9: Job match (150 points)
        WHEN normalize_arabic_for_search(COALESCE(m.job, '')) LIKE search_pattern THEN 150.0
        -- Priority 10: Mobile match (50 points)
        WHEN m.mobile ILIKE search_pattern THEN 50.0
        -- Priority 11: Phone match (50 points)
        WHEN m.phone ILIKE search_pattern THEN 50.0
        -- Priority 12: Member ID match (50 points)
        WHEN m.member_id ILIKE search_pattern THEN 50.0
        ELSE 0.0
      END
      ) as rank,
      -- Match type
      CASE 
        WHEN normalize_arabic_for_search(m.name) = normalized_query THEN 'exact_name'
        WHEN normalize_arabic_for_search(m.name) LIKE normalized_query || '%' THEN 'prefix_name'
        WHEN first_word IS NOT NULL AND normalize_arabic_for_search(m.name) LIKE first_word || '%' THEN 'first_name_prefix'
        WHEN normalize_arabic_for_search(m.name) LIKE search_pattern THEN 'name_contains'
        WHEN normalize_arabic_for_search(COALESCE(m.address, '')) LIKE search_pattern THEN 'address_match'
        WHEN normalize_arabic_for_search(COALESCE(m.job, '')) LIKE search_pattern THEN 'job_match'
        WHEN m.mobile ILIKE search_pattern THEN 'mobile_match'
        WHEN m.phone ILIKE search_pattern THEN 'phone_match'
        WHEN m.member_id ILIKE search_pattern THEN 'member_id_match'
        ELSE 'partial'
      END as match_type
    FROM members m
    WHERE 
      -- Search using normalized comparison
      normalize_arabic_for_search(m.name) LIKE search_pattern
      OR normalize_arabic_for_search(COALESCE(m.address, '')) LIKE search_pattern
      OR normalize_arabic_for_search(COALESCE(m.job, '')) LIKE search_pattern
      OR m.mobile ILIKE search_pattern
      OR m.phone ILIKE search_pattern
      OR m.member_id ILIKE search_pattern
      -- Also check normalized fields as backup
      OR (m.name_search IS NOT NULL AND normalize_arabic_for_search(m.name_search) LIKE search_pattern)
      OR (m.address_search IS NOT NULL AND normalize_arabic_for_search(m.address_search) LIKE search_pattern)
      OR (m.job_search IS NOT NULL AND normalize_arabic_for_search(m.job_search) LIKE search_pattern)
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

-- Add comments
COMMENT ON FUNCTION normalize_arabic_for_search IS 'Normalizes Arabic text for search: handles أ/ا, ى/ي, removes diacritics';
COMMENT ON FUNCTION search_members IS 'Professional Arabic search with character normalization: أ=ا, ى=ي, etc.';




