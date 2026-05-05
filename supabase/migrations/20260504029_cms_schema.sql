-- =============================================================================
-- Migration: 20260504029_cms_schema
-- Phase 5A: Content Management System (CMS) Schema
-- =============================================================================

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cms_article_status') THEN
    CREATE TYPE public.cms_article_status AS ENUM ('draft', 'published', 'archived');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cms_media_type') THEN
    CREATE TYPE public.cms_media_type AS ENUM ('image', 'video', 'document', 'other');
  END IF;
END $$;


-- 2. Tables

CREATE TABLE IF NOT EXISTS public.cms_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.cms_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.cms_categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image_url text,
  status public.cms_article_status not null default 'draft',
  author_id uuid references auth.users(id) on delete set null,
  is_featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.cms_media (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  media_type public.cms_media_type not null default 'image',
  file_size_bytes integer,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);


-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_cms_articles_slug ON public.cms_articles(slug);
CREATE INDEX IF NOT EXISTS idx_cms_articles_status ON public.cms_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_categories_slug ON public.cms_categories(slug);


-- 4. Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('cms.view', 'عرض المحتوى', 'CMS View', 'View internal CMS data'),
  ('cms.manage', 'إدارة المحتوى', 'CMS Manage', 'Create, edit, and manage articles and media'),
  ('cms.publish', 'نشر المحتوى', 'CMS Publish', 'Publish articles to the public website')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('cms.view'),
    ('cms.manage'),
    ('cms.publish')
) AS perms(permission_code)
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;


-- 5. RLS Policies
ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active categories
DROP POLICY IF EXISTS "Allow public read cms_categories" ON public.cms_categories;
CREATE POLICY "Allow public read cms_categories" 
ON public.cms_categories FOR SELECT USING (true);

-- Allow public read access ONLY to published articles
DROP POLICY IF EXISTS "Allow public read published articles" ON public.cms_articles;
CREATE POLICY "Allow public read published articles" 
ON public.cms_articles FOR SELECT USING (status = 'published');

-- Allow authenticated users to read all articles (for CMS dashboard)
DROP POLICY IF EXISTS "Allow authenticated read all articles" ON public.cms_articles;
CREATE POLICY "Allow authenticated read all articles" 
ON public.cms_articles FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read media
DROP POLICY IF EXISTS "Allow authenticated read cms_media" ON public.cms_media;
CREATE POLICY "Allow authenticated read cms_media" 
ON public.cms_media FOR SELECT TO authenticated USING (true);


-- 6. Storage Bucket & Policies (Requires Storage Extension to be active, typically standard in Supabase)
-- Note: In pure SQL, creating a bucket requires inserting into storage.buckets.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public_media', 'public_media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access to media bucket
DROP POLICY IF EXISTS "Public Access to Media" ON storage.objects;
CREATE POLICY "Public Access to Media" 
ON storage.objects FOR SELECT USING (bucket_id = 'public_media');

-- Authenticated upload access to media bucket
DROP POLICY IF EXISTS "Auth Upload to Media" ON storage.objects;
CREATE POLICY "Auth Upload to Media" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public_media');

DROP POLICY IF EXISTS "Auth Update to Media" ON storage.objects;
CREATE POLICY "Auth Update to Media" 
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'public_media');

DROP POLICY IF EXISTS "Auth Delete to Media" ON storage.objects;
CREATE POLICY "Auth Delete to Media" 
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'public_media');
