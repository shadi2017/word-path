# Arabic commentary and background library

Imported from the owner's local `D:\UniversalCrawler\data\knowledge.db` on 2026-10-04. The source database is read-only and is not committed. The export includes only the app's 66 books and valid chapter identities; deuterocanonical books and extra chapters are excluded.

## Coverage

| Source | Chapter bundles / 1,189 | Book introductions / 66 | Verses with explicit section mappings / 31,104 |
| --- | ---: | ---: | ---: |
| Tadros Yacoub Malaty | 1,183 | 66 | 30,655 |
| Antonious Fekry | 1,188 | 66 | 29,559 |
| Church Encyclopedia | 1,044 | 51 | 28,218 |

These are three Coptic Orthodox sources, explicitly labeled in the reader. Matthew Henry's English Protestant commentary remains a separate selectable source. No Arabic evangelical translation, French translation or German translation of the imported commentary is claimed. New interface controls and notices have Arabic, English, French and German labels; source text remains Arabic.

There are 3,605 source pages and 56,692 preserved sections. Multiple source pages for a chapter remain individually attributed. Introductions contain the historical, explanatory and literary background provided by each author; these are source perspectives, not newly verified historical assertions. The previous general editorial background remains separate below them.

## Mapping and limitations

- Only explicit `verse_numbers` that agree with the source graph and exist in the app's chapter are used. Noncontiguous lists remain noncontiguous. Three unverified sections are retained as chapter context and flagged for review; they are not silently assigned to verses.
- Unmapped chapter sections and full book introductions are available in **الخلفية والسياق**. The complete stored chapter text is in **التفسير العام**. **تفسير الآية** shows only explicitly mapped passages. Missing data is stated honestly without invented commentary.
- The importer completed all 3,969 pages, but completion is not proof of complete verse coverage. Review flags remain attached to 41 Fekry pages, 387 Malaty pages and 13 Encyclopedia pages. Unresolved footnote notices are retained; available footnote definitions are displayed with the relevant passages.
- An orthographic comparison with bundled Van Dyck finds 256 textual differences and two absent source verse identities (Psalms 72:20 and 150:6). Their identities are recorded in the manifest for editorial review. The exporter never overwrites Scripture or rewrites quotations. The UI identifies the Arabic reference edition and warns that source quotations can differ. This does not establish alignment with other Bible editions.
- This is a faithful plain-text presentation of the supplied extractor output, not a fresh editorial review of every section against source HTML. Original images, tables and typography are not reconstructed.

## Rebuild and verify

Stop the crawler before exporting. The exporter refuses a database with a WAL sidecar, then opens SQLite in read-only immutable mode. Python standard library only; no crawler package execution or network requests.

```powershell
python scripts/export-study.py --db D:\UniversalCrawler\data\knowledge.db
node --test tests/*.test.mjs
```

The committed manifest lists availability, exact coverage, review counts and verse-text differences. Data is split into approximately 3,600 lazy-loaded JSON files under `public/data/study`, about 141 MB total; the largest chapter is below 0.5 MB. Only the selected author's chapter and, on the context tab, its introduction are downloaded. No database migrations or API secrets are needed.

Review `ATTRIBUTION.md` for provenance. Browser errors are retryable by selecting the tab again. A missing chapter in one source does not silently substitute a different author.
