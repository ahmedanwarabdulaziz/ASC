-- Complete Supabase Migration SQL
-- Run this entire file in Supabase Dashboard → SQL Editor

-- Create members table with full-text search support
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id TEXT UNIQUE,
  name TEXT NOT NULL,
  name_search TEXT,
  address TEXT,
  address_search TEXT,
  job TEXT,
  job_search TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT,
  team_id TEXT,
  team_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector tsvector
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_search TEXT,
  candidate_id TEXT,
  candidate_name TEXT,
  members TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'team_leader' CHECK (role IN ('admin', 'supervisor', 'team_leader')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS members_search_vector_idx ON members USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS members_name_idx ON members (name);
CREATE INDEX IF NOT EXISTS members_member_id_idx ON members (member_id);
CREATE INDEX IF NOT EXISTS members_status_idx ON members (status);
CREATE INDEX IF NOT EXISTS members_team_id_idx ON members (team_id);
CREATE INDEX IF NOT EXISTS members_created_at_idx ON members (created_at DESC);

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION update_members_search_vector()
RETURNS TRIGGER AS $$
BEGIN
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

-- Create trigger
DROP TRIGGER IF EXISTS update_members_search_vector_trigger ON members;
CREATE TRIGGER update_members_search_vector_trigger
  BEFORE INSERT OR UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_members_search_vector();

-- Create search function with word order priority
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
  rank REAL
) AS $$
DECLARE
  first_word TEXT;
  query_words TEXT[];
BEGIN
  query_words := string_to_array(trim(search_query), ' ');
  first_word := query_words[1];
  
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
    ts_rank(m.search_vector, plainto_tsquery('simple', search_query)) as rank
  FROM members m
  WHERE m.search_vector @@ plainto_tsquery('simple', search_query)
     OR m.name_search ILIKE '%' || search_query || '%'
     OR m.address_search ILIKE '%' || search_query || '%'
     OR m.job_search ILIKE '%' || search_query || '%'
     OR m.mobile ILIKE '%' || search_query || '%'
     OR m.phone ILIKE '%' || search_query || '%'
     OR m.member_id ILIKE '%' || search_query || '%'
  ORDER BY 
    CASE WHEN m.name_search ILIKE search_query || '%' THEN 1 ELSE 2 END,
    CASE WHEN first_word IS NOT NULL AND m.name_search ILIKE first_word || '%' THEN 1 ELSE 2 END,
    rank DESC NULLS LAST,
    m.name;
END;
$$ LANGUAGE plpgsql;




