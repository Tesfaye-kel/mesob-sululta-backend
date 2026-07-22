# Tasks for News System & Gallery Fix - COMPLETED

## Task 1: Fix Gallery Image Upload Issue
- [x] Diagnose gallery upload flow
- [x] Verified: Gallery upload stores to `/uploads/gallery/` and serves via `/uploads` static middleware. The `getImageUrl()` function in GallerySection correctly maps URLs. Upload directory is auto-created. No fix needed.

## Task 2: Replace Announcement with News System
- [x] Backend News model, controller, routes all exist (already done)
- [x] Admin News management page (AdminNews.tsx) exists (already done)
- [x] AnnouncementsSection already used News API
- [x] AnnouncementsPage already used News API (renamed to NewsPage)
- [x] Updated translations: `announcements` → `news` in nav for all 3 languages
- [x] Updated Admin sidebar routing: `/Admin/announcements` → `/Admin/news`
- [x] Updated Footer link
- [x] Added new `news` translation block in all languages

## Task 3: Built Functional News Management
- [x] News detail page (NewsDetailPage.tsx) with full content, media, tags
- [x] News listing page (NewsPage.tsx) with cover images, search, filter
- [x] Added news routes to App.tsx (`/news` and `/news/:id`)
- [x] Replaced homepage announcements section with NewsSection
- [x] Featured news, image previews, video support

## Task 4: Frontend News Section
- [x] Created modern NewsSection.tsx for homepage
- [x] NewsCard style component with image/video preview
- [x] Responsive grid layout
- [x] Featured news hero banner
- [x] Date display, category badges
- [x] Media gallery in detail page

## Task 5: Backend & Cleanup
- [x] Admin dashboard now counts News in stats
- [x] Updated frontend API types for news count
- [x] Updated SearchModal to point to /news
- [x] Old Announcement admin page left intact (not imported)
- [x] No broken links - verified all routes