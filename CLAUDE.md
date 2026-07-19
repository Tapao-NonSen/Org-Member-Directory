# CLAUDE.md — tapao/org-member-directory

Flarum 2.x extension: หน้าธรรมเนียบสมาชิก (member directory) สำหรับ NGBC forum (ngbc.kku.ac.th) — org-chart-style page listing members by position, split into current / past members.

## Core Design Decisions (locked — do not change without asking)

1. **No Flarum groups involved.** The extension's own tables are the sole source of truth. Groups continue to serve forum permissions elsewhere, but the directory never reads or writes group membership.
2. **Positions are custom entities** created by admin in the extension's settings page — NOT Flarum groups. Keeps the group list clean.
3. **Current vs past is derived from dates:** `ended_at IS NULL` = current member (main section), `ended_at NOT NULL` = past member (secondary section).
4. **Directory is curated.** Users never appear automatically. Admin adds each member explicitly. A one-time "Import from group" button exists only as a setup convenience (copies users from a chosen group into member records once; no ongoing link).
5. **Multiple records per user allowed** (multi-term support baked into schema from day one, e.g. "รองประธาน 2566–2567" then "ประธาน 2567–2568"). MVP UI may show only the latest record per user.
6. **Dates stored as Gregorian (ค.ศ.) `DATE` in DB.** Convert to พ.ศ. on the frontend only. Never store Buddhist-era years.
7. Display granularity (year only / month+year / full date) is a forum setting; default: year only (ปีการศึกษา).

## Database Schema (migrations)

```
member_directory_positions
├── id
├── name          # e.g. "ประธาน", "รองประธานฝ่ายการตลาด"
├── sort_order    # ordering in directory; lower = higher rank, shown first
├── color         # nullable, badge color
└── is_visible    # boolean

member_directory_members
├── id
├── user_id       # FK users.id, cascade on user delete
├── position_id   # FK positions.id, NULLABLE — members without a position are valid
├── cohort        # string, e.g. "รุ่น 1" or "2568" (flexible free text)
├── started_at    # DATE, nullable
├── ended_at      # DATE, nullable — NULL = currently active
└── sort_order    # ordering within the same position
```

## Backend (PHP 8.3+, Flarum 2.x)

- `extend.php`: Frontend('forum') + Frontend('admin'), forum route `/members`, locales, settings serialization.
- Custom API endpoints (do NOT reuse core `/api/users` — it requires `viewUserList` and we need guest access to be independently controllable):
  - `GET /api/member-directory` — public-facing (gated by `member-directory.view` permission). Returns positions (sorted) with their current members, positionless current members, and past members grouped by cohort. Supports cohort filter param.
  - `POST/PATCH/DELETE /api/member-directory/positions[/:id]` — admin only.
  - `POST/PATCH/DELETE /api/member-directory/members[/:id]` — admin only.
  - `POST /api/member-directory/import` — admin only; body specifies a group id; creates member records for that group's users (skip users who already have a record).
- Permission: `member-directory.view` (assignable to guests via admin permissions grid).
- Run phpstan (Flarum's static-analysis package) on backend code.

## Frontend (TypeScript + Mithril)

### Forum: `MemberDirectoryPage` at `/members`
- Section 1 — สมาชิกปัจจุบัน: grouped by position, sorted by `positions.sort_order`; higher positions get larger cards / top rows. Positionless members render as a plain grid at the end of the section.
- Section 2 — สมาชิกในอดีต: grouped primarily by cohort (not position); last-held position shown as subtitle.
- Card contents: avatar, display name, position badge (with color), cohort badge, date range (e.g. "2567–2568" or "เริ่ม 2567"). Card links to the user's profile.
- Cohort filter dropdown.
- Loading state + empty state ("ยังไม่มีสมาชิกใน section นี้").
- Register nav entry (IndexPage sidebar item).

### Admin: custom CRUD panel (this is the largest work item)
1. Positions manager — list, create/edit/delete via modal, reorder (`sort_order`).
2. Members manager — search users via core user search, assign position (optional), cohort, started_at / ended_at date pickers (empty ended_at = still active).
3. General settings — guest view toggle, date display granularity, cards per row.
4. Import-from-group button (one-time tool).

## Styling

- Follow NGBC design system: navy/gold/sky palette, Montserrat + Prompt fonts.
- Use Flarum CSS custom properties so dark mode works (same approach as existing NGBC footer).
- LESS in `less/forum.less` and `less/admin.less`.

## Project Structure

```
org-member-directory/
├── extend.php
├── composer.json
├── migrations/
├── src/
│   ├── Api/           # controllers + serializers
│   ├── Access/        # permission policy
│   └── Model/         # Position, MemberRecord
├── js/src/forum/      # MemberDirectoryPage + components
├── js/src/admin/      # CRUD panels
├── less/
└── locale/th.yml, en.yml
```

- Scaffold with `flarum-cli init` (@flarum/cli v3.x for 2.x infrastructure); use `flarum-cli make` for boilerplate.
- Locale: Thai is the primary locale; English secondary.

## Phasing

1. **MVP:** migrations, position CRUD (admin), member assign (admin), `/members` page with two sections, import-from-group.
2. **Phase 2:** cohort filter UI polish, drag-and-drop reordering in admin, badge colors.
3. **Phase 3:** multi-term display per user, export, fof/user-bio integration.

## Conventions

- PHP 8.3 minimum, strict types.
- Frontend imports use `flarum/common/...`, `flarum/forum/...`, `flarum/admin/...` namespaces.
- Follow Flarum 2.x extender APIs (check docs.flarum.org/2.x — some 1.x patterns are deprecated).