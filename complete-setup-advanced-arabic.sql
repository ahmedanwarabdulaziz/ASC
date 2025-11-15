-- ============================================
-- PROFESSIONAL ARABIC SEARCH SETUP
-- Optimized for Fast Arabic Text Search
-- ============================================

-- Step 1: Create exec_sql helper function (for future automation)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Step 2: Create members table with advanced Arabic search support
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_search TEXT NOT NULL, -- Normalized Arabic for search
  name_tokens TEXT[], -- Array of individual words for prefix matching
  address TEXT,
  address_search TEXT,
  address_tokens TEXT[],
  job TEXT,
  job_search TEXT,
  job_tokens TEXT[],
  phone TEXT, -- Landline
  mobile TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT,
  team_id TEXT,
  team_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector tsvector, -- Full-text search vector
  search_tokens TEXT[] -- Combined tokens for fast array search
);

-- Step 3: Create teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_search TEXT,
  candidate_id TEXT,
  candidate_name TEXT,
  description TEXT,
  members TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create users table for authentication
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'team_leader' CHECK (role IN ('admin', 'supervisor', 'team_leader')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create indexes for ultra-fast search
-- GIN indexes for full-text and array search (fastest for Arabic)
CREATE INDEX members_search_vector_idx ON members USING GIN (search_vector);
CREATE INDEX members_search_tokens_idx ON members USING GIN (search_tokens);
CREATE INDEX members_name_tokens_idx ON members USING GIN (name_tokens);
CREATE INDEX members_address_tokens_idx ON members USING GIN (address_tokens);
CREATE INDEX members_job_tokens_idx ON members USING GIN (job_tokens);

-- B-tree indexes for exact matches and sorting
CREATE INDEX members_member_id_idx ON members (member_id);
CREATE INDEX members_name_idx ON members (name);
CREATE INDEX members_status_idx ON members (status);
CREATE INDEX members_team_id_idx ON members (team_id);
CREATE INDEX members_created_at_idx ON members (created_at DESC);

-- Text pattern indexes for ILIKE queries (backup search method)
CREATE INDEX members_name_search_idx ON members (name_search text_pattern_ops);
CREATE INDEX members_address_search_idx ON members (address_search text_pattern_ops);
CREATE INDEX members_job_search_idx ON members (job_search text_pattern_ops);

-- Step 6: Function to normalize Arabic text for search
CREATE OR REPLACE FUNCTION normalize_arabic_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN '';
  END IF;
  
  -- Remove diacritics (tashkeel) and normalize Arabic characters
  RETURN lower(
    translate(
      translate(
        translate(
          translate(
            translate(input_text, 
              'أإآا', 'ا'), -- Normalize Alef variations
            'ة', 'ه'), -- Normalize Teh Marbuta to Heh
          'ي', 'ي'), -- Normalize Yeh
        'ى', 'ي'), -- Normalize Alef Maksoora to Yeh
      'ًٌٍَُِّْ', '' -- Remove all diacritics
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 7: Function to extract search tokens from Arabic text
CREATE OR REPLACE FUNCTION extract_arabic_tokens(input_text TEXT)
RETURNS TEXT[] AS $$
DECLARE
  normalized TEXT;
  tokens TEXT[];
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  normalized := normalize_arabic_text(input_text);
  
  -- Split by spaces and filter empty strings
  tokens := ARRAY(
    SELECT trim(word)
    FROM unnest(string_to_array(normalized, ' ')) AS word
    WHERE trim(word) != '' AND length(trim(word)) > 0
  );
  
  RETURN tokens;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 8: Function to automatically update search vectors and tokens
CREATE OR REPLACE FUNCTION update_members_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  all_tokens TEXT[];
BEGIN
  -- Normalize search fields
  NEW.name_search := normalize_arabic_text(NEW.name);
  NEW.address_search := COALESCE(normalize_arabic_text(NEW.address), '');
  NEW.job_search := COALESCE(normalize_arabic_text(NEW.job), '');
  
  -- Extract tokens for fast prefix matching
  NEW.name_tokens := extract_arabic_tokens(NEW.name);
  NEW.address_tokens := COALESCE(extract_arabic_tokens(NEW.address), ARRAY[]::TEXT[]);
  NEW.job_tokens := COALESCE(extract_arabic_tokens(NEW.job), ARRAY[]::TEXT[]);
  
  -- Combine all tokens for fast array search
  all_tokens := NEW.name_tokens || NEW.address_tokens || NEW.job_tokens;
  
  -- Add phone/mobile/member_id to tokens if they exist
  IF NEW.mobile IS NOT NULL AND NEW.mobile != '' THEN
    all_tokens := all_tokens || ARRAY[NEW.mobile];
  END IF;
  
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    all_tokens := all_tokens || ARRAY[NEW.phone];
  END IF;
  
  IF NEW.member_id IS NOT NULL AND NEW.member_id != '' THEN
    all_tokens := all_tokens || ARRAY[NEW.member_id];
  END IF;
  
  NEW.search_tokens := all_tokens;
  
  -- Create full-text search vector with weights
  -- 'A' = highest weight (name), 'B' = medium (address, job), 'C' = low (phone, mobile, id)
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name_search, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.address_search, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.job_search, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.mobile, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.phone, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.member_id, '')), 'C');
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to auto-update search vectors
CREATE TRIGGER update_members_search_vector_trigger
  BEFORE INSERT OR UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_members_search_vector();

-- Step 10: Advanced Arabic search function with multiple search methods
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
BEGIN
  -- Normalize search query
  normalized_query := normalize_arabic_text(search_query);
  query_tokens := extract_arabic_tokens(normalized_query);
  first_token := query_tokens[1];
  
  RETURN QUERY
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
    -- Calculate relevance rank (higher = more relevant)
    COALESCE(
      -- Full-text search rank (highest weight - 10x)
      ts_rank(m.search_vector, plainto_tsquery('simple', normalized_query)) * 10,
      0
    ) +
    COALESCE(
      -- Array contains rank (medium weight - 5x per matching token)
      CASE WHEN m.search_tokens && query_tokens THEN 
        array_length(array(
          SELECT unnest(m.search_tokens) 
          INTERSECT 
          SELECT unnest(query_tokens)
        ), 1) * 5.0
      ELSE 0 END,
      0
    ) +
    COALESCE(
      -- Prefix match rank (lower weight - 3x)
      CASE WHEN EXISTS (
        SELECT 1 FROM unnest(m.name_tokens) AS token 
        WHERE token LIKE first_token || '%'
      ) THEN 3.0 ELSE 0 END,
      0
    ) as rank,
    -- Match type for debugging/analytics
    CASE 
      WHEN m.name_search = normalized_query THEN 'exact_name'
      WHEN m.name_search LIKE normalized_query || '%' THEN 'prefix_name'
      WHEN m.search_tokens && query_tokens THEN 'token_match'
      WHEN m.search_vector @@ plainto_tsquery('simple', normalized_query) THEN 'fulltext'
      ELSE 'partial'
    END as match_type
  FROM members m
  WHERE 
    -- Method 1: Full-text search (fastest for Arabic, uses GIN index)
    m.search_vector @@ plainto_tsquery('simple', normalized_query)
    -- Method 2: Array contains (fast prefix matching, uses GIN index)
    OR m.search_tokens && query_tokens
    -- Method 3: ILIKE search (backup for partial matches, uses text_pattern_ops index)
    OR m.name_search ILIKE '%' || normalized_query || '%'
    OR m.address_search ILIKE '%' || normalized_query || '%'
    OR m.job_search ILIKE '%' || normalized_query || '%'
    OR m.mobile ILIKE '%' || search_query || '%'
    OR m.phone ILIKE '%' || search_query || '%'
    OR m.member_id ILIKE '%' || search_query || '%'
  ORDER BY 
    -- Priority 1: Exact name match (highest priority)
    CASE WHEN m.name_search = normalized_query THEN 1 ELSE 2 END,
    -- Priority 2: Name starts with query
    CASE WHEN m.name_search LIKE normalized_query || '%' THEN 1 ELSE 2 END,
    -- Priority 3: First token matches name start
    CASE WHEN first_token IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(m.name_tokens) AS token 
      WHERE token LIKE first_token || '%'
    ) THEN 1 ELSE 2 END,
    -- Priority 4: Relevance rank (highest first)
    rank DESC NULLS LAST,
    -- Priority 5: Alphabetical order
    m.name;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create function to get member by ID
CREATE OR REPLACE FUNCTION get_member_by_id(member_uuid UUID)
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
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
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
    m.updated_at
  FROM members m
  WHERE m.id = member_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Features:
-- ✅ Advanced Arabic text normalization (removes diacritics, normalizes characters)
-- ✅ Multiple search methods (full-text, array, prefix, ILIKE)
-- ✅ Fast GIN indexes for instant search
-- ✅ Automatic token extraction for prefix matching
-- ✅ Relevance ranking (exact > prefix > token > fulltext > partial)
-- ✅ Word-order priority (first word matches first)
-- ✅ Optimized for Arabic text search performance

SELECT 'Professional Arabic search setup completed successfully!' AS message;


