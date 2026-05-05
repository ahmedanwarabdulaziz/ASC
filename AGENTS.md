<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## System UI And Navigation Rules

- Treat `people` and `memberships` as admin workspace pages, not simple forms or isolated screens.
- Prefer a persistent workspace shell with strong page hierarchy, shared surfaces, and consistent spacing over per-page one-off styling.
- Use intercepted routes plus parallel routes for shareable overlay flows that need a real URL and in-app popup behavior.
- Prefer right-side drawers for details pages and contextual child flows. Reserve centered modals for very small confirm or quick-create actions only.
- When an overlay is opened from inside the app, closing it should return the user to the exact parent context. Preserve this with `returnTo` query params instead of relying only on browser history.
- Direct navigation to overlay URLs must still work cleanly and feel intentional, with a proper background page or full route composition when needed.
- Avoid tiny unlabeled `+` action affordances for primary navigation. Use explicit action labels such as `فتح الملف`, `إضافة تابع`, or `إصدار عضوية`.
- Do not build large pages with heavy inline styles. Prefer shared CSS modules and reusable workspace components for tables, headers, forms, drawers, and status pills.
- Drawer content should not look like a second popup inside the drawer. Keep forms visually flat and let the drawer shell provide the container feel.
- Keep list state in the URL (`search`, `page`, filters) so users can resume exactly where they were after closing or saving an overlay.
