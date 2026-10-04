# Requested multilingual study expansion

Updated 2026-10-04. The full multilingual expansion is not complete.

Arabic study update: imported the owner-supplied St-Takla corpus with three selectable Coptic Orthodox sources, full stored chapter sections, verse-linked passages, book introductions, chapter context and footnotes. Coverage and limitations are documented in `STUDY-DATA.md`; do not advertise universal verse coverage or translated commentary. Matthew Henry remains available separately. New controls/notices support all four UI languages; imported source content stays Arabic. This update is submitted as a PR and is not deployed until merged.

Reading-plan PDF export added: direct browser download from the plan page, A4 cover with member name and progress snapshot, monthly reading tables, page numbers, and four interface languages. PDF pages contain rendered images to preserve Arabic shaping; PDF text is not selectable/searchable. 40 automated tests pass; the generated 25-page annual Arabic PDF was opened and representative pages rendered and visually reviewed.

Email setup: BREVO_API_KEY was added by the owner to GitHub Actions Secrets, and SUPABASE_URL and EMAIL_FROM were also saved. SUPABASE_SERVICE_ROLE_KEY and remaining workflow variables still need setup; Brevo authorized-IP blocking is enabled. No delivery has been enabled or verified.

Implemented and tested:
- Full Arabic, English WEB, French LSG 1910 and German Elberfelder 1905 Bible text, with a persistent browser reading-language selection.
- Original English Matthew Henry Concise commentary for all 1,189 chapters, preserving passage ranges and labeling chapters that have general commentary only.
- Existing Arabic book/section introductions, vocabulary and Arabic cross references remain available.
- 38 automated tests and 16 database integration checks pass.
- Interface translation catalog and independent account-level UI/Bible language preferences; migration applied to production on 2026-09-23.
- 945 daily verses per language and localized email templates.
- Ten short original historical/literary introductions shared by related book groups, covering 66 books in four languages. These are not detailed chapter histories.
- An external link to Bob Utley's Arabic commentary library remains with Matthew Henry, explicitly labeled as partial coverage. The separately supplied St-Takla corpus has its own attribution and rights notice.
- Service-only atomic daily email reservation prevents repeat sends across scheduled runs. Failed/uncertain sends remain reserved for the day; see EMAIL-SETUP.md.
- Browser checks: chapter reader, verse commentary, French language selection.

Still required by the user:
- Complete localization audit of the interface and legacy Arabic study resources.
- Reviewed Arabic, French and German evangelical commentary and historical backgrounds. The current English commentary must not be advertised as translated or as a distinct note for every verse.
- Further editorial review and translation of the newly imported historical/literary introductions and chapter context.
- Explicit verse-number alignment across editions before displaying cross references or commentary as if every edition had the same verse numbering.
- Daily email sender setup; emailEnabled remains false.

Test member shadi_test is approved, email-confirmed and successfully logged in. Browser checks confirmed French UI and German daily verse with the existing four completed chapters preserved. Do not store its password in the repository.

An experimental offline Arabic commentary translation was rejected due to meaning-changing errors. No machine-translated commentary is published. Brevo setup requires the user to sign into the available browser session; sending remains disabled.
