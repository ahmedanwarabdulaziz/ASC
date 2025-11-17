-- ============================================
-- BLOG SYSTEM SETUP FOR SUPABASE
-- ============================================
-- Copy this ENTIRE file and run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/sql/new

-- Step 1: Create site_bio table (for personal introduction)
CREATE TABLE IF NOT EXISTS site_bio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bio_text TEXT NOT NULL,
  vision_text TEXT,
  mission_text TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default bio (will be updated by admin)
INSERT INTO site_bio (id, bio_text, vision_text, mission_text)
VALUES (
  gen_random_uuid(),
  'مرحباً بكم في صفحة ناجح البارودي',
  'تطوير نادي أسيوط الرياضي ليصبح من أفضل الأندية الرياضية في المنطقة، مع التركيز على تطوير المواهب الشبابية وبناء مجتمع رياضي قوي.',
  'العمل على تحسين البنية التحتية للنادي، وتطوير البرامج الرياضية، وخلق بيئة إيجابية تشجع على المشاركة والتميز الرياضي.'
)
ON CONFLICT DO NOTHING;

-- Step 2: Create categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for categories
CREATE INDEX IF NOT EXISTS blog_categories_slug_idx ON blog_categories(slug);

-- Step 3: Create posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML content from TipTap
  excerpt TEXT, -- Short summary for cards
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  featured_image_url TEXT, -- Main featured image
  thumbnail_image_url TEXT, -- Thumbnail for grid cards
  meta_description TEXT,
  og_image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector tsvector -- For full-text search
);

-- Create indexes for posts
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts(status);
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON blog_posts(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS blog_posts_category_id_idx ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS blog_posts_is_featured_idx ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS blog_posts_author_id_idx ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS blog_posts_search_vector_idx ON blog_posts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx ON blog_posts(created_at DESC);

-- Step 4: Create post_images table (for multiple images per post)
CREATE TABLE IF NOT EXISTS blog_post_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for post_images
CREATE INDEX IF NOT EXISTS blog_post_images_post_id_idx ON blog_post_images(post_id);
CREATE INDEX IF NOT EXISTS blog_post_images_order_idx ON blog_post_images(post_id, order_index);

-- Step 5: Create function to update post search_vector
CREATE OR REPLACE FUNCTION update_blog_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(REGEXP_REPLACE(NEW.content, '<[^>]+>', '', 'g'), '')), 'C');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS update_blog_posts_search_vector_trigger ON blog_posts;
CREATE TRIGGER update_blog_posts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_search_vector();

-- Step 7: Create search function for blog posts
CREATE OR REPLACE FUNCTION search_blog_posts(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  excerpt TEXT,
  author_id UUID,
  category_id UUID,
  featured_image_url TEXT,
  thumbnail_image_url TEXT,
  is_featured BOOLEAN,
  status TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.excerpt,
    p.author_id,
    p.category_id,
    p.featured_image_url,
    p.thumbnail_image_url,
    p.is_featured,
    p.status,
    p.published_at,
    p.created_at,
    ts_rank(p.search_vector, plainto_tsquery('simple', search_query)) as rank
  FROM blog_posts p
  WHERE p.status = 'published'
    AND (p.search_vector @@ plainto_tsquery('simple', search_query)
         OR p.title ILIKE '%' || search_query || '%'
         OR p.excerpt ILIKE '%' || search_query || '%')
  ORDER BY 
    rank DESC NULLS LAST,
    p.published_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Enable Row Level Security (RLS)
ALTER TABLE site_bio ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_images ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS Policies

-- site_bio policies
-- Public can read bio
CREATE POLICY "Public can read bio" ON site_bio
  FOR SELECT
  USING (true);

-- Only admins can update bio
CREATE POLICY "Admins can update bio" ON site_bio
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert bio
CREATE POLICY "Admins can insert bio" ON site_bio
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- blog_categories policies
-- Public can read categories
CREATE POLICY "Public can read categories" ON blog_categories
  FOR SELECT
  USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories" ON blog_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- blog_posts policies
-- Public can read published posts
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT
  USING (status = 'published');

-- Admins can do everything with posts
CREATE POLICY "Admins can manage posts" ON blog_posts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- blog_post_images policies
-- Public can read images for published posts
CREATE POLICY "Public can read images for published posts" ON blog_post_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE id = blog_post_images.post_id AND status = 'published'
    )
  );

-- Allow public to read all images (for better compatibility)
CREATE POLICY "Public can read all images" ON blog_post_images
  FOR SELECT
  USING (true);

-- Admins can manage all images
CREATE POLICY "Admins can manage post images" ON blog_post_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- BLOG SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Create Supabase Storage bucket: blog-images (public)
-- 2. Set up TipTap editor in admin pages
-- 3. Create blog pages and admin management

