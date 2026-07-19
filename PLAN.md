# Plan.md — tapao/org-member-directory

Execution roadmap. Design details live in `Design.md`; project rules in `CLAUDE.md`. Work in small, reviewable increments — each step should leave the extension installable and non-broken.

## Phase 0 — Scaffold

- [ ] `flarum-cli init` (@flarum/cli v3.x) → Flarum 2.x skeleton with TS frontend infra
- [ ] Fill `composer.json` metadata (name `tapao/org-member-directory`, PHP ^8.3, flarum/core ^2.0)
- [ ] Verify extension installs and enables on the dev forum
- [ ] Set up phpstan + prettier configs; confirm `js` build runs

## Phase 1 — Database & Models

- [ ] Migration: `member_directory_positions` (per Design §3.1)
- [ ] Migration: `member_directory_members` (per Design §3.2, incl. indexes)
- [ ] Eloquent models `Position`, `MemberRecord` with relations + `current()`/`past()` scopes
- [ ] Smoke-test migrations up/down on dev DB

## Phase 2 — Backend API

- [ ] Register `member-directory.view` permission (grid, viewing scope)
- [ ] `GET /api/member-directory` — full payload (positions + current members + positionless + past by cohort), eager-loaded, minimal user fields
- [ ] Position CRUD endpoints (admin-gated)
- [ ] Member record CRUD endpoints (admin-gated)
- [ ] `POST /api/member-directory/import` (group_id → copy users, skip existing, return counts)
- [ ] Settings keys + `serializeToFrontend`
- [ ] phpstan clean; manual endpoint tests (guest / member / admin)

**Checkpoint:** entire data layer usable via API before any UI.

## Phase 3 — Admin Panel (largest block)

- [ ] Admin page shell with tabs: Positions / Members / Settings
- [ ] Positions tab: table + create/edit modal (name, color, sort_order, visibility) + delete confirm
- [ ] Members tab: record list + add modal (core user search → user, optional position, cohort, started_at, ended_at) + edit/delete
- [ ] Settings tab: date granularity, cards per row
- [ ] Import-from-group tool (group select, run, result summary)
- [ ] th/en locale strings for all admin UI (Thai placeholders for Tapao to finalize)

## Phase 4 — Forum Page

- [ ] Route `/members` + `MemberDirectoryPage` with data fetch, loading + empty states
- [ ] `PositionSection` + `MemberCard` (avatar, name, position badge w/ color, cohort badge, tenure line in พ.ศ.)
- [ ] Positionless members grid at end of current section
- [ ] `PastMembersSection` grouped by cohort, position as subtitle, muted card variant
- [ ] Card → user profile navigation
- [ ] IndexPage sidebar nav item
- [ ] LESS styling: NGBC palette via Flarum CSS variables, responsive columns, dark mode check

**Checkpoint = MVP done.** Deploy to ngbc.kku.ac.th, import real members, review with the team.

## Phase 5 — Polish (post-MVP)

- [ ] Cohort filter dropdown on the directory page
- [ ] Drag-and-drop reordering for positions (and members within a position) in admin
- [ ] Featured/large card variant for top position
- [ ] Date display granularity applied everywhere + edge cases (open-ended past records)

## Phase 6 — Future

- [ ] Multi-term timeline per user (dedupe cards, show history)
- [ ] Export (CSV) of directory records
- [ ] fof/user-bio integration on cards
- [ ] SEO: meta/description for `/members` (Thai)

## Working Agreements

- Verify Flarum 2.x API conventions against docs.flarum.org/2.x before Phase 2 (API layer changed from 1.x).
- Never store พ.ศ. in the DB; conversion is frontend-only.
- No Flarum group logic anywhere except the import tool.
- Each phase ends with the extension enabled and error-free on the dev forum.