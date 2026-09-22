# Verification — 2026-09-21

- 27 passing Node tests: complete 1189-chapter coverage, no duplicate chapters, within-book ordering, durations of 1–3653 days, leap years, mixed streams, progress and streaks, all 66 book outlines, the 945-verse pool, all 133770 cross-reference endpoints, glossary normalization, notification opt-in and missed-reading logic.
- 14 passing PostgreSQL integration checks using local PGlite 0.5.8: schema execution; pending/approved/rejected access; no self-approval; direct table denial; non-admin restrictions; plans and persistent progress; idempotent completion and undo; invalid inputs; organizations/membership isolation; search/profile privacy; encouragement; notification preferences and service-only delivery log; immediate revocation.
- JavaScript syntax checks passed for app, reader, API, and planner modules.
- Browser verified: Arabic RTL dashboard, actual Bible text, section context, source-verse cross references and target chapter navigation. Read-only WebMCP tool returned the visible demo progress. A narrow-screen preview was inspected.
- Supabase production project `fokhgddvypmzxbsbncvy`: confirmed there were no existing public/private tables, applied the schema in one transaction successfully, configured the public website connection. Auth settings report email enabled, confirmation required, signup enabled. Anonymous calls to `dashboard` and `email_recipients` correctly returned HTTP 401 permission denied. Site URL currently points to the local preview, pending final hosting URL.

Not yet verified: real two-user signup/login/email-confirmation workflow; actual cross-device persistence via the deployed site; actual outgoing emails; final GitHub Pages deployment. These need the user-controlled account signup, repository link and sender service configuration. Password entry remains with the user. The local database integration tests do not substitute for these final live checks.

After production migrations are applied, preserve the original schema file and use a new migration for changes.

## Update — 2026-09-22

- Corrected GitHub Pages source from branch/Jekyll to GitHub Actions. The old root page served the README rather than the application.
- Published commit `f2224f6` successfully, verified GitHub Actions run `35704232531` and the live application at https://shadi2017.github.io/word-path/ . The new «اقرأ وافهم» library is visible and lists all books and chapter buttons with contextual introductions and section maps.
- Updated Supabase Site URL from localhost to the HTTPS GitHub Pages URL. The account list was empty at time of inspection; no owner/admin account was fabricated and no password was entered.
- Re-ran all 27 data/planner tests successfully. Outgoing email remains unconfigured and is labeled as inactive in the settings UI.
