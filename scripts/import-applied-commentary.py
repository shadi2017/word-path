"""Import the Applied Bible Commentary (التفسير التطبيقي للكتاب المقدس) from the
OCR text published on archive.org (item 188-pdf_202105)."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

NAMES = [
    "التكوين", "الخروج", "اللاويين", "العدد", "التثنية", "يشوع", "القضاة", "راعوث",
    "صموئيل الأول", "صموئيل الثاني", "الملوك الأول", "الملوك الثاني",
    "أخبار الأيام الأول", "أخبار الأيام الثاني", "عزرا", "نحميا", "أستير", "أيوب",
    "المزامير", "الأمثال", "الجامعة", "نشيد الأنشاد", "إشعياء", "إرميا",
    "مراثي إرميا", "حزقيال", "دانيال", "هوشع", "يوئيل", "عاموس", "عوبديا",
    "يونان", "ميخا", "ناحوم", "حبقوق", "صفنيا", "حجي", "زكريا", "ملاخي",
    "متى", "مرقس", "لوقا", "يوحنا", "أعمال الرسل", "رومية", "كورنثوس الأولى",
    "كورنثوس الثانية", "غلاطية", "أفسس", "فيلبي", "كولوسي", "تسالونيكي الأولى",
    "تسالونيكي الثانية", "تيموثاوس الأولى", "تيموثاوس الثانية", "تيطس",
    "فليمون", "العبرانيين", "يعقوب", "بطرس الأولى", "بطرس الثانية",
    "يوحنا الأولى", "يوحنا الثانية", "يوحنا الثالثة", "يهوذا", "الرؤيا",
]
VARIANT = {
    "مراثي إرميا": ["مراثي", "مراثي إرميا", "المراثي"],
    "أعمال الرسل": ["أعمال الرسل", "الأعمال"],
    "نشيد الأنشاد": ["نشيد الأنشاد", "أغنية الأغاني"],
}
DIGIT_MAP = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

NAME_ENTRIES: list[tuple[str, int]] = []
for i, name in enumerate(NAMES):
    for v in VARIANT.get(name, [name]):
        NAME_ENTRIES.append((v, i + 1))
NAME_ENTRIES.sort(key=lambda x: -len(x[0]))


def normalize(s: str) -> str:
    s = s.replace("\u200e", "").replace("\u200f", "").replace("\u0640", "")
    s = s.translate(DIGIT_MAP)
    s = re.sub(r"(?<![\u0621-\u064a])ه(?![\u0621-\u064a])", "5", s)
    return s.strip()


def match_header(line: str):
    n = normalize(line)
    if len(n) > 25 or "سفر" in n:
        return None
    for v, book in NAME_ENTRIES:
        if v not in n:
            continue
        rest = n.replace(v, " ")
        toks = re.findall(r"[\u0621-\u064a]+", rest)
        if len(toks) > 2:
            continue
        digs = re.findall(r"\d+", n)
        if not digs:
            continue
        return book, digs
    return None


def parse_chapter(digs, book, cur, counts):
    limit = counts[book - 1]
    cands = []
    for d in digs:
        for L in range(len(d), 0, -1):
            try:
                v = int(d[:L])
            except ValueError:
                continue
            if 1 <= v <= limit:
                cands.append(v)
    in_range = [c for c in cands if (cur or 1) <= c <= (cur or 1) + 5]
    if in_range:
        return min(in_range)
    if cands:
        bigger = [c for c in cands if c >= (cur or 1)]
        if bigger:
            return min(bigger)
    return cur if cur else 1


def clean_line(ln: str):
    s = ln.replace("\u200e", "").replace("\u200f", "").strip()
    if not s:
        return None
    ar = len(re.findall(r"[\u0621-\u064a]", s))
    if ar < 10:
        return None
    if re.search(r"[A-Za-z]", s):
        return None
    ha = len(re.findall(r"[\u064b-\u0652\u0670\u0640]", s))
    if ha > ar * 0.15:
        return None
    toks = s.split()
    if len(toks) >= 5:
        short = sum(1 for t in toks if len(t) <= 2)
        if short / len(toks) > 0.45:
            return None
    sym = len(re.findall(r"[^0-9\u0621-\u064a\s٠-٩]", s))
    if sym > ar * 0.5:
        return None
    return s


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--public", type=Path,
                        default=Path(__file__).resolve().parents[1] / "public")
    parser.add_argument("--source", type=Path,
                        default=Path(__file__).resolve().parents[1] / "test-tools" /
                        "applied-commentary" / "applied.txt")
    parser.add_argument("--min-chars", type=int, default=150)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    public = args.public.resolve()
    output = public / "data" / "study"
    manifest_path = output / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    bible = json.loads((public / "bible.json").read_text(encoding="utf-8"))
    counts = [len(b["chapters"]) for b in bible["books"]]

    text = args.source.read_text(encoding="utf-8", errors="replace")
    lines = text.split("\n")

    cur_book = 0
    cur_ch = 0
    buckets: dict[tuple[int, int], list[str]] = {}
    switches = 0
    for i, ln in enumerate(lines):
        m = match_header(ln)
        if m:
            book, digs = m
            if cur_book == 0:
                if book != 1:
                    continue
            else:
                if book < cur_book:
                    continue
                if book - cur_book > 5:
                    continue
            if book != cur_book:
                switches += 1
                cur_book = book
                cur_ch = 0
            new_ch = parse_chapter(digs, book, cur_ch if cur_ch else 1, counts)
            if new_ch >= (cur_ch or 1):
                cur_ch = new_ch
            if args.debug:
                print(f"  hdr line {i}: book={cur_book} ch={cur_ch} :: {ln.strip()[:40]!r}")
            continue
        if cur_book == 0 or cur_ch == 0:
            continue
        c = clean_line(ln)
        if c is None:
            continue
        buckets.setdefault((cur_book, cur_ch), []).append(c)

    print(f"headers switched books {switches} times; buckets={len(buckets)}")

    author = "applied_commentary"
    available: set[str] = set()
    written = 0
    for (book, ch), chunk in buckets.items():
        joined = "\n".join(chunk)
        if len(joined) < args.min_chars:
            continue
        page = {
            "url": "https://archive.org/details/188-pdf_202105",
            "title": f"{NAMES[book - 1]} {ch}",
            "extractor": "applied-commentary-ocr-v1",
            "hash": hashlib.sha256(joined.encode("utf-8")).hexdigest()[:16],
            "issues": ["مستخرج بـ OCR من أرشيف الإنترنت؛ نص نظيف جزئيًا وقد يحتوي على أخطاء أو ترقيم إصحاحات تقريبي."],
            "missingFootnotes": [],
            "sections": [{"title": "الشرح", "text": joined, "verses": [], "index": 0}],
            "footnotes": [],
        }
        target = output / author / str(book) / f"{ch}.json"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(
            json.dumps({"pages": [page]}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8")
        available.add(f"{book}/{ch}")
        written += 1

    available_sorted = sorted(available, key=lambda v: (int(v.split("/")[0]), int(v.split("/")[1])))
    sections_total = 0
    for entry in available_sorted:
        book, ch = entry.split("/")
        p = output / author / book / f"{ch}.json"
        data = json.loads(p.read_text(encoding="utf-8"))
        for pg in data["pages"]:
            sections_total += len(pg["sections"])
    stats = {
        "name": "التفسير التطبيقي للكتاب المقدس (OCR)",
        "pages": len(available_sorted),
        "chapters": len(available_sorted),
        "introductions": 0,
        "sections": sections_total,
        "reviewPages": 0,
        "mappedVerses": 0,
        "available": available_sorted,
    }
    manifest["authors"][author] = stats
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2),
                            encoding="utf-8")
    print(f"applied_commentary: {written} chapters written, {sections_total} sections")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
PYEOF