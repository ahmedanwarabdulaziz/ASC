# Phase 5 Execution: Public Website and CMS

This document outlines the execution plan for Phase 5, which focuses on building the public-facing website for Assiut Sporting Club and the internal Content Management System (CMS) to manage it.

## Phase 5A: CMS Data Foundation & Storage
- Create Supabase storage bucket for `public_media`.
- Create tables:
  - `cms_categories`: To categorize news and content.
  - `cms_articles`: Stores news, announcements, and pages (title, slug, content, published_at, status).
  - `cms_media`: Tracks uploaded images and files.
- Add `cms.*` permission codes.

## Phase 5B: Internal CMS Dashboard
- Build `/system/cms/articles` for writing and managing news.
- Build `/system/cms/media` for image gallery management.
- Implement publishing workflow (Draft vs Published).

## Phase 5C: Public Website Redesign
- Transform the `app/page.tsx` (which is currently just a login redirect) into a professional, Arabic-first Home Page.
- Add "About Us", "Contact", and "Board of Directors" static/hybrid sections.
- Ensure the layout is mobile-first, SEO optimized, and fully styled with the club's colors (Green/Gold/White).

## Phase 5D: Dynamic Public Pages
- Build `/news` to list published articles from `cms_articles`.
- Build `/news/[slug]` to read a specific article.
- Build `/sports` to publicly showcase the active sports configured in Phase 4.

## Checklist
- [ ] Phase 5A completed (Schema & Storage).
- [ ] Phase 5B completed (Internal Dashboard).
- [ ] Phase 5C completed (Public Layout & Home Page).
- [ ] Phase 5D completed (Dynamic Content Pages).
