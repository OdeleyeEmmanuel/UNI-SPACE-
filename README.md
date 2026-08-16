# Coursemate

A cross-university social platform for students — organized by University → Faculty →
Department → Level, with a "Link Up" connection system and department communities that
span every campus.

This is **Phase 1** of the full build: authentication, academic-structure onboarding,
profiles, student discovery, the Link Up connection flow, and real-time notifications —
all running against a live Supabase project, not mock data.

## Design identity

- **Palette:** deep academic navy (`#14213D`) on warm paper cream (`#FAF7F0`), with a
  restrained convocation-gold accent (`#C9A227`) — evokes matriculation, not a generic SaaS blue.
- **Type:** Fraunces (display serif) for headings, Inter for body copy, IBM Plex Mono for
  academic metadata (levels, usernames, timestamps) — the mono treatment nods to student ID
  numbering.
- **Signature element:** the "seal" — a rotated stamp-style badge used for the primary Link Up
  action and the app mark, plus ID-card-styled profile cards with a gold top edge, like a
  physical student card.

## Getting started

```bash
npm install
cp .env.example .env   # already pre-filled with the live project's public anon key
npm run dev
```

The `.env.example` values point at the live Supabase project (`hrrhqsspwoeedsuszaix`).
The anon/publishable key is safe to ship in a frontend build — Row Level Security on every
table is what actually protects data, not key secrecy.

**Never** put the database URL / postgres password or a Supabase *service role* key in this
frontend. Only the URL + anon key belong here.

## What's live in the database right now

- `universities`, `faculties`, `departments`, `academic_levels`, `communities` — seeded with
  5 universities and KolaDaisi University's full faculty/department tree. Departments map to
  shared cross-university `communities` by discipline (e.g. every university's "Computer
  Science" department shares one community row).
- `profiles` — auto-created on signup via a database trigger, RLS-protected (public read,
  self-write only).
- `connections` — the Link Up system: `pending / accepted / declined / blocked`, with
  duplicate-request prevention in both directions.
- `notifications` — auto-fired by database triggers on Link Up request/acceptance, delivered
  to the app in real time via Supabase Realtime.
- `storage.avatars` bucket — public read, upload restricted to the owning user's folder.

Run `supabase db diff` or check the Supabase dashboard's migration history to see the exact
SQL — all schema changes were applied as named migrations, not manual edits.

## What's not built yet (Phases 2–9 of the original spec)

Feed & posts, group chat, PDF resource cards, faculty/community browsing pages, the social
map, admin tooling, and moderation are not implemented yet. The database and auth foundation
here is built to extend cleanly into those — new tables can reference `profiles.id` and reuse
the same RLS patterns.

## Stack

React 18 + TypeScript + Vite + Tailwind, Supabase (Postgres + Auth + Storage + Realtime),
React Router. No mock data layer — every read/write in this codebase hits the real database.
