# Requested multilingual study expansion

Updated 2026-09-22. This expansion is not complete.

Implemented and tested:
- Full Arabic, English WEB, French LSG 1910 and German Elberfelder 1905 Bible text, with a persistent browser reading-language selection.
- Original English Matthew Henry Concise commentary for all 1,189 chapters, preserving passage ranges and labeling chapters that have general commentary only.
- Existing Arabic book/section introductions, vocabulary and Arabic cross references remain available.
- 31 automated tests pass, including all editions' chapter identities and commentary coverage.
- Browser checks: chapter reader, verse commentary, French language selection.

Still required by the user:
- Complete interface translations in English, French and German, independent of Scripture language.
- Reviewed Arabic, French and German evangelical commentary and historical backgrounds. The current English commentary must not be advertised as translated or as a distinct note for every verse.
- Localized daily verses and email templates, account-level language preferences and their database migration.
- Detailed historical background expansion beyond the current book and section introductions.
- Explicit verse-number alignment across editions before displaying cross references or commentary as if every edition had the same verse numbering.
- Daily email sender setup; emailEnabled remains false.

Test member shadi_test was created and approved. Email confirmation is still required; do not store its password in the repository. The admin account remains unchanged.
