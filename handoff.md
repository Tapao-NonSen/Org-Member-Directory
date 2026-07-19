# Handoff — tapao/org-member-directory

Last updated: 2026-07-19

## Status: Phase 0 + 1 complete

- Extension skeleton scaffolded manually (flarum-cli/PHP/composer not available on this machine; only Node 22 + npm).
- `composer.json`, `extend.php` (forum/admin frontends, `/members` route, locales), `phpstan.neon`.
- Migrations: `member_directory_positions`, `member_directory_members` per DESIGN.md §3 (FKs: user cascade, position set-null; indexes incl. composite `(position_id, sort_order)`).
- Models: `src/Model/Position.php`, `src/Model/MemberRecord.php` with relations + `current()`/`past()` scopes.
- JS infra: webpack/flarum-tsconfig; `npm run build` verified green (entry shims `js/forum.js`, `js/admin.js` are required by flarum-webpack-config — it reads them from `js/` cwd, not `src/` directly).
- Locale skeletons `locale/th.yml`, `locale/en.yml` (key: `tapao-org-member-directory`).

## Pending verification (needs a machine with PHP 8.3 + composer)

- `composer install` + `composer analyse:phpstan` never run.
- Migrations never executed against a real DB; extension never enabled on the dev forum.
- Run these before/at the Phase 2 checkpoint.

## Next: Phase 2 — Backend API (see PLAN.md)

- `member-directory.view` permission, `GET /api/member-directory` payload, position/member CRUD (admin), import-from-group, settings keys + serializeToFrontend.
- Per Working Agreements: verify Flarum 2.x API resource conventions (docs.flarum.org/2.x) before writing controllers — 2.x changed from 1.x serializers.

## Notes / decisions

- TypeScript pinned ^5.9 (npm "latest" resolves to TS 7 which breaks flarum tooling).
- `js/dist/` is gitignored for now; Flarum extensions normally commit dist on release — revisit at deploy time.
- `build:production` npm script uses unix env syntax; won't run on Windows shell, plain `build` already outputs production mode.
