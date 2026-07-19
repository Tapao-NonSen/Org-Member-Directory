# Design.md — tapao/org-member-directory

Detailed technical design. For the condensed project guide see `CLAUDE.md`; for the execution roadmap see `Plan.md`.

## 1. Goal & Scope

An org-chart-style member directory (ธรรมเนียบสมาชิก) for the NGBC forum (ngbc.kku.ac.th), rendered at `/members`, fully curated by admins, split into current and past members.

Out of scope: any interaction with Flarum groups (except the one-time import tool), user self-service editing, public API for third parties.

## 2. Design Principles

1. **Single source of truth.** The extension's own tables define who appears. No group reads, no sync logic, no derived membership.
2. **Curated, not automatic.** New forum users never appear until an admin adds them.
3. **History-friendly schema.** Multiple records per user (multi-term) supported from day one, even if MVP UI shows only the latest.
4. **Locale-safe dates.** DB stores Gregorian `DATE`; Buddhist-era (พ.ศ.) conversion is a frontend display concern only.
5. **Independent permissions.** Directory visibility is its own permission (`member-directory.view`), independently grantable to guests, never tied to core `viewUserList`.

## 3. Data Model

### 3.1 `member_directory_positions`

| Column | Type | Notes |
|---|---|---|
| id | increments | |
| name | string(100) | e.g. "ประธาน", "รองประธานฝ่ายการตลาด" |
| sort_order | integer, default 0 | lower = higher rank, rendered first |
| color | string(7), nullable | hex badge color |
| is_visible | boolean, default true | hide without deleting |
| created_at / updated_at | timestamps | |

### 3.2 `member_directory_members`

| Column | Type | Notes |
|---|---|---|
| id | increments | |
| user_id | unsignedInteger, FK → users.id, cascade delete | |
| position_id | unsignedInteger, nullable, FK → positions.id, null on delete | positionless members are valid |
| cohort | string(50), nullable | free text: "รุ่น 1", "2568" |
| started_at | date, nullable | store day 1 if only month/year known |
| ended_at | date, nullable | **NULL = current member** |
| sort_order | integer, default 0 | ordering within the same position |
| created_at / updated_at | timestamps | |

Indexes: `user_id`, `position_id`, `ended_at` (section split query), composite `(position_id, sort_order)`.

### 3.3 Derivations

- **Current section:** records where `ended_at IS NULL`, grouped by position (sorted by `positions.sort_order`, then `members.sort_order`), positionless records last as a flat grid.
- **Past section:** records where `ended_at IS NOT NULL`, grouped by `cohort` (descending), position shown as subtitle.
- **Multi-term:** a user may appear in both sections or hold several past records. MVP renders each record as its own card; deduplication/timeline is Phase 3.

## 4. Backend

### 4.1 Models (Eloquent)

- `Position` — hasMany `MemberRecord`.
- `MemberRecord` — belongsTo `User`, belongsTo `Position`. Scope helpers: `current()`, `past()`.

### 4.2 API resources

Flarum 2.x API resource/endpoint conventions.

| Endpoint | Access | Behavior |
|---|---|---|
| `GET /api/member-directory` | `member-directory.view` | Single payload: visible positions (sorted) with current members, positionless current members, past members grouped by cohort. `?cohort=` filter. Includes minimal user data: id, username, displayName, avatarUrl, slug, joinTime. Never email/private attrs. |
| `POST /api/member-directory/positions` | admin | create |
| `PATCH /api/member-directory/positions/:id` | admin | update incl. reorder |
| `DELETE /api/member-directory/positions/:id` | admin | member records keep existing with `position_id = NULL` |
| `POST /api/member-directory/members` | admin | create record (user_id, position_id?, cohort?, started_at?, ended_at?) |
| `PATCH /api/member-directory/members/:id` | admin | update |
| `DELETE /api/member-directory/members/:id` | admin | delete record only, never the user |
| `POST /api/member-directory/import` | admin | body: `group_id`; creates records for that group's users, skipping users who already have any record; returns counts (created/skipped) |

### 4.3 Permissions

- `member-directory.view` registered on the permissions grid (viewing scope), default: members; admin can grant to guests.
- All write endpoints: `assertAdmin()`.

### 4.4 Settings

| Key | Type | Default |
|---|---|---|
| `member-directory.date_granularity` | `year` \| `month` \| `full` | `year` |
| `member-directory.cards_per_row` | int | 4 |

Serialized to forum frontend via `Settings::serializeToFrontend`.

## 5. Frontend — Forum

### 5.1 Components

```
MemberDirectoryPage        # route /members, data fetch + layout
├── CohortFilter           # dropdown, Phase 2
├── PositionSection        # one position → heading + cards
├── MemberCard             # avatar, name, badges, tenure line
└── PastMembersSection     # grouped by cohort
```

### 5.2 Rendering rules

- Position sections in `sort_order`; first position (e.g. ประธาน) may use a larger card variant.
- Tenure line: format per `date_granularity`, converted to พ.ศ. (`year + 543`) client-side. Examples: "2567–2568", "เริ่ม 2567", open-ended past record edge case "–2567".
- Card click navigates to the user's profile (slug-based route).
- Empty states per section; skeleton/LoadingIndicator while fetching.
- Nav: IndexPage sidebar item "ธรรมเนียบสมาชิก" linking to `/members`.

### 5.3 Styling

- LESS in `less/forum.less`, all colors via Flarum CSS custom properties (dark-mode safe, same approach as the NGBC footer).
- NGBC design system: navy/gold/sky palette, Montserrat + Prompt.
- Responsive: cards_per_row applies at desktop; collapse to 2 / 1 columns on tablet / mobile.

## 6. Frontend — Admin (largest work item)

A custom admin page (not a plain settings form):

1. **Positions tab** — table of positions; create/edit modal (name, color, sort_order, visibility); delete with confirm noting member records are kept.
2. **Members tab** — searchable list of records; add modal: core user search → select user, optional position dropdown, cohort text, started_at/ended_at date inputs (empty ended_at = active); edit/delete per row.
3. **Settings tab** — date granularity select, cards per row.
4. **Import from group** — group dropdown + run button + result summary; labeled clearly as a one-time copy.

## 7. i18n

- `locale/th.yml` primary, `locale/en.yml` complete mirror.
- Every user-facing string through the translator; Thai copy finalized by Tapao (scaffold with placeholders).

## 8. Non-functional

- PHP 8.3+, strict types, phpstan clean.
- TypeScript frontend, `flarum/common|forum|admin/...` imports.
- Directory payload is one request; no N+1 (eager-load users + positions).
- No caching layer in MVP; payload is small (club-scale). Revisit only if needed.

## 9. Risks / Open Questions

- Flarum 2.x API layer differs from 1.x (new API resource conventions) — verify against 2.x docs before writing controllers/serializers.
- Date input UX in admin (native date input vs component) — decide during build.
- Deduplication display for users with both current + past records — deferred to Phase 3, acceptable to show multiple cards until then.