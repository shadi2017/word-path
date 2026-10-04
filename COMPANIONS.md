# Persistent companions and group progress

Members can add another approved member by exact username (with or without `@`) in **رفقاء الرحلة**. The private following list is saved in Supabase and survives sign-out, refresh and changing devices. Adding the same person again does not create duplicates. Members can unfollow and refresh progress explicitly; opening the page also fetches fresh progress.

Cards show total Bible completion and the count of chapters recorded **today in Africa/Cairo**. This is activity recorded today, not the percentage of today's assigned plan: reading ahead or catching up is counted when recorded. Undoing completion removes that record. Ordinary companion cards and dialogs emphasize progress and encouragement rather than chapter names. Existing encouragement validation and rate limits are retained.

The existing global admin can open each group, see its approved members, total progress, today's activity, plan dates and each member's full monthly plan via **الخطة والتشجيع**. No new organization-specific admin role is introduced. Non-members still cannot list groups; direct private-table access remains forbidden. The existing approved-member profile API retains its prior access semantics.

## Rollout

Before deploying this frontend, apply `supabase/migrations/20261004_companions.sql` in the project's Supabase SQL editor. It adds a private RLS-protected following table, two authenticated RPCs and an updated group-members RPC, then reloads the API schema. It does not modify existing plans, progress, comments or memberships. Do not rerun `schema.sql` against an existing database.

New installations run `schema.sql`, then the language migration, then this migration. Frontend changes are published by the existing Pages workflow when the PR merges. The migration is included in this PR; it has not been applied to production as part of local testing.

Validation: `node --test tests/*.test.mjs`; optional local database integration with the existing PGlite test runtime: `node scripts/test-database.mjs`. Tests cover owner isolation, duplicate follows, unfollow, rejected accounts, day boundaries, group plan access, comment persistence and escaped rendering. UI controls/notices are provided in all four interface languages.
