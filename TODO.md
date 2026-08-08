# Fix Black Screen – Remove stale "Announcements" references

## Steps

- [x] Investigate root cause (stale `t.announcements.*` after migration to News)
- [x] Fix `frontend/src/components/home/Hero.tsx` — replace `t.announcements.*` with `t.news.*`
- [x] Fix `frontend/src/components/home/LatestAnnouncements.tsx` — replace `t.announcements.*` with `t.news.*`
- [x] Fix `frontend/src/pages/SinglePageHome.tsx` — remove deleted `AnnouncementsSection` import, use `NewsSection`
- [x] Verify no remaining `t.announcements` references in `frontend/src`
- [x] Build/typecheck the frontend (`npm run build`) and confirm success

## Why today's changes were not applied

1. **Changes were never committed** — All 30+ modified files, deleted Announcements files, and the new Social Media feature are still uncommitted working-tree changes. The latest commit (`d53c659`) only contains asset/image additions.
2. **TypeScript build error blocked deployment** — `frontend/src/pages/admin/AdminNews.tsx` used `.then(setItems)` but the refactored `getNewsList` API now returns `{ news: NewsItem[] }` instead of a plain array. This caused `tsc -b` to fail, blocking the Vercel build. **FIXED** by changing to `.then(res => setItems(res.news))`.
3. **Deployment was aborted** — `frontend/deploy-log.txt` shows the `vercel` install/deploy was terminated ("Terminate batch job (Y/N)?").

## How to apply the changes

1. Build succeeded locally — the fix is verified.
2. Commit all changes: `git add -A && git commit -m "fix: remove Announcements, complete News migration, add Social Media admin"`
3. Push to remote: `git push origin master`
4. Redeploy the frontend and backend.