-- =============================================================================
-- Migration: 20260504030_cms_permissions_rls
-- Phase 5A: CMS permissions and RLS activation
-- =============================================================================
-- Fixes CMS permission enforcement so cms.view / cms.manage / cms.publish
-- actually control internal CMS access and editing behavior.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CMS table policies
-- ---------------------------------------------------------------------------

-- cms_categories
DROP POLICY IF EXISTS "Allow public read cms_categories" ON public.cms_categories;
DROP POLICY IF EXISTS "cms_categories__insert__cms_manage" ON public.cms_categories;
DROP POLICY IF EXISTS "cms_categories__update__cms_manage" ON public.cms_categories;

-- Public categories remain readable for the public site.
CREATE POLICY "cms_categories__select__public"
  ON public.cms_categories FOR SELECT
  USING (true);

CREATE POLICY "cms_categories__insert__cms_manage"
  ON public.cms_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('cms.manage'));

CREATE POLICY "cms_categories__update__cms_manage"
  ON public.cms_categories FOR UPDATE
  TO authenticated
  USING (public.has_permission('cms.manage'))
  WITH CHECK (public.has_permission('cms.manage'));

-- cms_articles
DROP POLICY IF EXISTS "Allow public read published articles" ON public.cms_articles;
DROP POLICY IF EXISTS "Allow authenticated read all articles" ON public.cms_articles;
DROP POLICY IF EXISTS "cms_articles__insert__cms_manage" ON public.cms_articles;
DROP POLICY IF EXISTS "cms_articles__update__cms_manage_or_publish" ON public.cms_articles;

-- Public site: only published articles.
CREATE POLICY "cms_articles__select__published_public"
  ON public.cms_articles FOR SELECT
  USING (status = 'published');

-- Internal CMS: read all articles only with cms.view.
CREATE POLICY "cms_articles__select__cms_view"
  ON public.cms_articles FOR SELECT
  TO authenticated
  USING (public.has_permission('cms.view'));

CREATE POLICY "cms_articles__insert__cms_manage"
  ON public.cms_articles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('cms.manage'));

-- Note: RLS cannot safely enforce per-column publishing behavior by itself.
-- For now, cms.manage or cms.publish may update articles. If stricter
-- publish-only workflow is needed later, move publishing into an RPC.
CREATE POLICY "cms_articles__update__cms_manage_or_publish"
  ON public.cms_articles FOR UPDATE
  TO authenticated
  USING (
    public.has_permission('cms.manage')
    OR public.has_permission('cms.publish')
  )
  WITH CHECK (
    public.has_permission('cms.manage')
    OR public.has_permission('cms.publish')
  );

-- cms_media
DROP POLICY IF EXISTS "Allow authenticated read cms_media" ON public.cms_media;
DROP POLICY IF EXISTS "cms_media__insert__cms_manage" ON public.cms_media;
DROP POLICY IF EXISTS "cms_media__update__cms_manage" ON public.cms_media;

CREATE POLICY "cms_media__select__cms_view"
  ON public.cms_media FOR SELECT
  TO authenticated
  USING (public.has_permission('cms.view'));

CREATE POLICY "cms_media__insert__cms_manage"
  ON public.cms_media FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission('cms.manage'));

CREATE POLICY "cms_media__update__cms_manage"
  ON public.cms_media FOR UPDATE
  TO authenticated
  USING (public.has_permission('cms.manage'))
  WITH CHECK (public.has_permission('cms.manage'));

-- ---------------------------------------------------------------------------
-- Storage policies for public_media bucket
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public Access to Media" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload to Media" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update to Media" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete to Media" ON storage.objects;
DROP POLICY IF EXISTS "storage_objects__select__public_media_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_objects__insert__public_media_cms_manage" ON storage.objects;
DROP POLICY IF EXISTS "storage_objects__update__public_media_cms_manage" ON storage.objects;
DROP POLICY IF EXISTS "storage_objects__delete__public_media_cms_manage" ON storage.objects;

CREATE POLICY "storage_objects__select__public_media_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public_media');

CREATE POLICY "storage_objects__insert__public_media_cms_manage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'public_media'
    AND public.has_permission('cms.manage')
  );

CREATE POLICY "storage_objects__update__public_media_cms_manage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'public_media'
    AND public.has_permission('cms.manage')
  )
  WITH CHECK (
    bucket_id = 'public_media'
    AND public.has_permission('cms.manage')
  );

CREATE POLICY "storage_objects__delete__public_media_cms_manage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'public_media'
    AND public.has_permission('cms.manage')
  );
