# Bible text

Arabic Smith–Van Dyck (1865), public domain, downloaded from:
https://github.com/midvash/bible-data/tree/main/versions/ar/svd

Original machine-readable data: `svd.json` in that repository. The unmodified Bible is included as `public/bible.json`. `public/verses.json` is a deterministic selection from specified passages, built by `scripts/prepare-verses.mjs`; verses include book, chapter, and verse references. The source identifies the translation as public domain. No contemporary copyrighted translation is included.

Fonts: Noto Kufi Arabic and Noto Naskh Arabic, via Google Fonts; fallback system fonts work when unavailable. Noto fonts use the SIL Open Font License.

## Cross references

OpenBible.info, https://openbible.info/labs/cross-references/ , data archive https://a.openbible.info/data/cross-references.zip (downloaded 2026-09-21), CC BY: https://creativecommons.org/licenses/by/4.0/ . Built primarily from the Treasury of Scripture Knowledge. Changes: mapped OSIS references to the bundled Arabic translation, removed unmapped endpoints, kept up to five highest-voted references per source verse, and grouped by chapter. No ESV text is included; all displayed verse text comes from the Arabic public-domain Bible above. Ranges display the first verse and retain both reference endpoints.

## Reading aids

`public/study.js` contains original Arabic editorial book introductions, section outlines, and a limited vocabulary glossary prepared for this project. These are reading aids, not a complete commentary, original-language lexicon, or a denominationally approved teaching resource. Section summaries are explicitly labeled as section context rather than individual chapter exegesis. The text of the Bible is the primary source for the introductions and outline; the aids are stored separately from Scripture and can be edited after pastoral review.
