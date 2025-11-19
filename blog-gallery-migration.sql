-- ============================================
-- BLOG TO GALLERY MIGRATION
-- ============================================
-- This migration updates the blog system to a gallery system
-- Run this in Supabase SQL Editor

-- Step 1: Add primary_image_title column to blog_posts
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS primary_image_title TEXT;

-- Step 2: Update existing posts to use featured_image_url as primary
-- (No data migration needed, just add the column)

-- Step 3: Make featured_image_url more prominent (it's now the primary image)
-- The column already exists, we just need to ensure it's used properly

-- Step 4: The blog_post_images table already exists for secondary images
-- No changes needed there

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- The system now supports:
-- - Primary image with optional title (featured_image_url + primary_image_title)
-- - Multiple secondary images (blog_post_images table)
-- - Categories, dates, and featured status (already exist)

