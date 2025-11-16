-- Setup without exec_sql dependency
-- This creates everything directly

-- Step 1: Create members table
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_search TEXT NOT NULL,
  name_tokens TEXT[],
  address TEXT,
  address_search TEXT,
  address_tokens TEXT[],
  job TEXT,
  job_search TEXT,
  job_tokens TEXT[],
  phone TEXT,
  mobile TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT,
  team_id TEXT,
  team_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector tsvector,
  search_tokens TEXT[]
);

-- Step 2: Create teams table
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

-- Step 3: Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'team_leader' CHECK (role IN ('admin', 'supervisor', 'team_leader')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX members_search_vector_idx ON members USING GIN (search_vector);
CREATE INDEX members_search_tokens_idx ON members USING GIN (search_tokens);
CREATE INDEX members_name_tokens_idx ON members USING GIN (name_tokens);
CREATE INDEX members_address_tokens_idx ON members USING GIN (address_tokens);
CREATE INDEX members_job_tokens_idx ON members USING GIN (job_tokens);
CREATE INDEX members_member_id_idx ON members (member_id);
CREATE INDEX members_name_idx ON members (name);
CREATE INDEX members_status_idx ON members (status);
CREATE INDEX members_team_id_idx ON members (team_id);
CREATE INDEX members_created_at_idx ON members (created_at DESC);
CREATE INDEX members_name_search_idx ON members (name_search text_pattern_ops);
CREATE INDEX members_address_search_idx ON members (address_search text_pattern_ops);
CREATE INDEX members_job_search_idx ON members (job_search text_pattern_ops);

-- Step 5: Create normalize_arabic_text function
CREATE OR REPLACE FUNCTION normalize_arabic_text(input_text TEXT)
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
            translate(input_text, 
              'أإآا', 'ا'),
            'ة', 'ه'),
          'ي', 'ي'),
        'ى', 'ي'),
      'ًٌٍَُِّْ', ''
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 6: Create extract_arabic_tokens function
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
  tokens := ARRAY(
    SELECT trim(word)
    FROM unnest(string_to_array(normalized, ' ')) AS word
    WHERE trim(word) != '' AND length(trim(word)) > 0
  );
  RETURN tokens;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 7: Create update_members_search_vector function
CREATE OR REPLACE FUNCTION update_members_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  all_tokens TEXT[];
BEGIN
  NEW.name_search := normalize_arabic_text(NEW.name);
  NEW.address_search := COALESCE(normalize_arabic_text(NEW.address), '');
  NEW.job_search := COALESCE(normalize_arabic_text(NEW.job), '');
  NEW.name_tokens := extract_arabic_tokens(NEW.name);
  NEW.address_tokens := COALESCE(extract_arabic_tokens(NEW.address), ARRAY[]::TEXT[]);
  NEW.job_tokens := COALESCE(extract_arabic_tokens(NEW.job), ARRAY[]::TEXT[]);
  all_tokens := NEW.name_tokens || NEW.address_tokens || NEW.job_tokens;
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

-- Step 8: Create trigger
CREATE TRIGGER update_members_search_vector_trigger
  BEFORE INSERT OR UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_members_search_vector();

-- Step 9: Create search_members function
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
  normalized_query := normalize_arabic_text(search_query);
  query_tokens := extract_arabic_tokens(normalized_query);
  first_token := query_tokens[1];
  RETURN QUERY
  SELECT 
    m.id, m.member_id, m.name, m.address, m.job, m.phone, m.mobile,
    m.email, m.status, m.notes, m.team_id, m.team_name,
    m.created_at, m.updated_at,
    COALESCE(ts_rank(m.search_vector, plainto_tsquery('simple', normalized_query)) * 10, 0) +
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
    COALESCE(
      CASE WHEN EXISTS (
        SELECT 1 FROM unnest(m.name_tokens) AS token 
        WHERE token LIKE first_token || '%'
      ) THEN 3.0 ELSE 0 END,
      0
    ) as rank,
    CASE 
      WHEN m.name_search = normalized_query THEN 'exact_name'
      WHEN m.name_search LIKE normalized_query || '%' THEN 'prefix_name'
      WHEN m.search_tokens && query_tokens THEN 'token_match'
      WHEN m.search_vector @@ plainto_tsquery('simple', normalized_query) THEN 'fulltext'
      ELSE 'partial'
    END as match_type
  FROM members m
  WHERE 
    m.search_vector @@ plainto_tsquery('simple', normalized_query)
    OR m.search_tokens && query_tokens
    OR m.name_search ILIKE '%' || normalized_query || '%'
    OR m.address_search ILIKE '%' || normalized_query || '%'
    OR m.job_search ILIKE '%' || normalized_query || '%'
    OR m.mobile ILIKE '%' || search_query || '%'
    OR m.phone ILIKE '%' || search_query || '%'
    OR m.member_id ILIKE '%' || search_query || '%'
  ORDER BY 
    CASE WHEN m.name_search = normalized_query THEN 1 ELSE 2 END,
    CASE WHEN m.name_search LIKE normalized_query || '%' THEN 1 ELSE 2 END,
    CASE WHEN first_token IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(m.name_tokens) AS token 
      WHERE token LIKE first_token || '%'
    ) THEN 1 ELSE 2 END,
    rank DESC NULLS LAST,
    m.name;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create get_member_by_id function
CREATE OR REPLACE FUNCTION get_member_by_id(member_uuid UUID)
RETURNS TABLE (
  id UUID, member_id TEXT, name TEXT, address TEXT, job TEXT,
  phone TEXT, mobile TEXT, email TEXT, status TEXT, notes TEXT,
  team_id TEXT, team_name TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.member_id, m.name, m.address, m.job, m.phone, m.mobile,
    m.email, m.status, m.notes, m.team_id, m.team_name, m.created_at, m.updated_at
  FROM members m
  WHERE m.id = member_uuid;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create exec_sql function (for future automation)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

SELECT 'Professional Arabic search setup completed!' AS message;



