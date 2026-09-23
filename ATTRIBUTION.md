# Bible text

## Additional reading translations and commentary (2026-09-22)

`public/data/en/`, `fr/`, and `de/` contain World English Bible, Louis Segond 1910, and Elberfelder 1905 respectively. Each source metadata file identifies the text as public domain. Downloaded from https://github.com/midvash/bible-data/tree/main/versions . Changes: split the original JSON into individual books for loading on demand. Scripture itself is not machine-translated. Verse numbering can differ across editions; cross references therefore explicitly display the Arabic reference text.

`public/data/commentary/` contains Matthew Henry's Concise Commentary from https://www.ccel.org/ccel/henry/mhcc.xml . The source DC.Rights is Public Domain. Only the historical work is included, not the modern CCEL staff description. Changes: extracted book introductions, chapter outlines and commentary paragraphs as plain text; retained original verse ranges. The source places 2 Kings 1 and 2 Chronicles 1 directly under the book, so the importer restores their chapter wrappers. Chapters with only a general commentary are explicitly labeled as such. This Protestant commentary is provided in its original English; no Arabic, French or German translation of it is claimed. Rebuild using `node scripts/prepare-study-library.mjs`.

Arabic Smith–Van Dyck (1865), public domain, downloaded from:
https://github.com/midvash/bible-data/tree/main/versions/ar/svd

Original machine-readable data: `svd.json` in that repository. The unmodified Bible is included as `public/bible.json`. `public/verses.json` is a deterministic selection from specified passages, built by `scripts/prepare-verses.mjs`; verses include book, chapter, and verse references. The source identifies the translation as public domain. No contemporary copyrighted translation is included.

Fonts: Noto Kufi Arabic and Noto Naskh Arabic, via Google Fonts; fallback system fonts work when unavailable. Noto fonts use the SIL Open Font License.

## Cross references

OpenBible.info, https://openbible.info/labs/cross-references/ , data archive https://a.openbible.info/data/cross-references.zip (downloaded 2026-09-21), CC BY: https://creativecommons.org/licenses/by/4.0/ . Built primarily from the Treasury of Scripture Knowledge. Changes: mapped OSIS references to the bundled Arabic translation, removed unmapped endpoints, kept up to five highest-voted references per source verse, and grouped by chapter. No ESV text is included; all displayed verse text comes from the Arabic public-domain Bible above. Ranges display the first verse and retain both reference endpoints.

## Reading aids

`public/historical-context.js` adds original historical/literary introductions in Arabic, English, French and German. The notes describe broad biblical settings and literary genres and cite passages in the bundled Bible. They are not translations of Matthew Henry or a claim of individual verse commentary, nor a comprehensive historical-critical account. Books sharing a literary/historical grouping intentionally share a clearly introductory context note.

`public/study.js` contains original Arabic editorial book introductions, section outlines, and a limited vocabulary glossary prepared for this project. These are reading aids, not a complete commentary, original-language lexicon, or a denominationally approved teaching resource. Section summaries are explicitly labeled as section context rather than individual chapter exegesis. The text of the Bible is the primary source for the introductions and outline; the aids are stored separately from Scripture and can be edited after pastoral review.
