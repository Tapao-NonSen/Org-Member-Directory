# Handoff — tapao/org-member-directory

Last updated: 2026-07-19

## Status: Phase 0 + 1 + 2 complete

### Phase 0 + 1 — Scaffold, DB & Models

- Extension skeleton scaffolded manually (flarum-cli/PHP/composer not available on this machine; only Node 22 + npm).
- `composer.json`, `extend.php` (forum/admin frontends, `/members` route, locales), `phpstan.neon`.
- Migrations: `member_directory_positions`, `member_directory_members` per DESIGN.md §3 (FKs: user cascade, position set-null; indexes incl. composite `(position_id, sort_order)`).
- Models: `src/Model/Position.php`, `src/Model/MemberRecord.php` with relations + `current()`/`past()` scopes.
- JS infra: webpack/flarum-tsconfig; `npm run build` verified green (entry shims `js/forum.js`, `js/admin.js` are required by flarum-webpack-config — it reads them from `js/` cwd, not `src/` directly).
- Locale skeletons `locale/th.yml`, `locale/en.yml` (key: `tapao-org-member-directory`).

### Phase 2 — Backend API

- `src/Api/Controller/`: `ShowMemberDirectoryController` (GET aggregate payload), `Create/Update/DeletePositionController`, `Create/Update/DeleteMemberRecordController`, `ImportFromGroupController` — all plain `RequestHandlerInterface` controllers registered via `Extend\Routes('api')` in `extend.php` (Flarum 2.x's new `AbstractDatabaseResource`/`Endpoint` resource layer was evaluated and skipped for this custom aggregate payload — see the doc comment on `ShowMemberDirectoryController`).
- `src/Api/PositionValidator.php`, `src/Api/MemberRecordValidator.php`: shared validation for the two CRUD pairs (create/update use the same rules).
- `migrations/2026_07_19_000003_add_default_permissions.php`: seeds `member-directory.view` for `Group::MEMBER_ID` via `Migration::addPermissions()`. Flarum 2.x has no `Extend\Permission` extender — permission-grid registration is admin-JS-only (`app.extensionData.registerPermission(...)`, Phase 3 work); the backend side just checks `$actor->hasPermission('member-directory.view')`.
- Settings `member-directory.date_granularity` / `member-directory.cards_per_row` registered with defaults + `serializeToForum` in `extend.php`.
- Hidden-position decision: `ShowMemberDirectoryController` only queries `Position::where('is_visible', true)`, so records under a hidden position are silently omitted from the current section entirely (not moved to positionless). Past section is unaffected by `is_visible` — historical position name/color still shows as subtitle.
- Locale keys added: `admin.permissions.view_member_directory_label` (th/en) for the Phase 3 admin permissions grid.

## Pending verification (needs a machine with PHP 8.3 + composer)

- `composer install` + `composer analyse:phpstan` never run.
- Migrations never executed against a real DB; extension never enabled on the dev forum.
- No live-endpoint testing (guest/member/admin) done yet — do this once PHP is available.

## Next: Phase 3 — Admin Panel (see PLAN.md)

- Admin page shell with tabs: Positions / Members / Settings.
- `app.extensionData.registerPermission({..., permission: 'member-directory.view'}, 'view')` in admin JS to surface the permission on the grid.
- Wire the CRUD/import endpoints from Phase 2 into the admin UI.

## Notes / decisions

- TypeScript pinned ^5.9 (npm "latest" resolves to TS 7 which breaks flarum tooling).
- `js/dist/` is gitignored for now; Flarum extensions normally commit dist on release — revisit at deploy time.
- `build:production` npm script uses unix env syntax; won't run on Windows shell, plain `build` already outputs production mode.
