# Requested multilingual study expansion

Updated 2026-09-23. This expansion is not complete.

Implemented and tested:
- Full Arabic, English WEB, French LSG 1910 and German Elberfelder 1905 Bible text, with a persistent browser reading-language selection.
- Original English Matthew Henry Concise commentary for all 1,189 chapters, preserving passage ranges and labeling chapters that have general commentary only.
- Existing Arabic book/section introductions, vocabulary and Arabic cross references remain available.
- 38 automated tests and 16 database integration checks pass.
- Interface translation catalog and independent account-level UI/Bible language preferences; migration applied to production on 2026-09-23.
- 945 daily verses per language and localized email templates.
- Ten short original historical/literary introductions shared by related book groups, covering 66 books in four languages. These are not detailed chapter histories.
- An external link to Bob Utley's Arabic commentary library, explicitly labeled as partial coverage; no copyrighted commentary copied.
- Service-only atomic daily email reservation prevents repeat sends across scheduled runs. Failed/uncertain sends remain reserved for the day; see EMAIL-SETUP.md.
- Browser checks: chapter reader, verse commentary, French language selection.

Still required by the user:
- Complete localization audit of the interface and legacy Arabic study resources.
- Reviewed Arabic, French and German evangelical commentary and historical backgrounds. The current English commentary must not be advertised as translated or as a distinct note for every verse.
- Detailed historical background expansion beyond the current book and section introductions.
- Explicit verse-number alignment across editions before displaying cross references or commentary as if every edition had the same verse numbering.
- Daily email sender setup; emailEnabled remains false.

Test member shadi_test is approved, email-confirmed and successfully logged in. Browser checks confirmed French UI and German daily verse with the existing four completed chapters preserved. Do not store its password in the repository.

An experimental offline Arabic commentary translation was rejected due to meaning-changing errors. No machine-translated commentary is published. Brevo setup requires the user to sign into the available browser session; sending remains disabled.
