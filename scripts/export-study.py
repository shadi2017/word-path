"""Export the user-supplied St-Takla SQLite knowledge base, without modifying it."""
import argparse
import json
import sqlite3
import re
import unicodedata
from pathlib import Path
from collections import defaultdict

BOOKS = 'genesis exodus leviticus numbers deuteronomy joshua judges ruth 1_samuel 2_samuel 1_kings 2_kings 1_chronicles 2_chronicles ezra nehemiah esther job psalms proverbs ecclesiastes song_of_songs isaiah jeremiah lamentations ezekiel daniel hosea joel amos obadiah jonah micah nahum habakkuk zephaniah haggai zechariah malachi matthew mark luke john acts romans 1_corinthians 2_corinthians galatians ephesians philippians colossians 1_thessalonians 2_thessalonians 1_timothy 2_timothy titus philemon hebrews james 1_peter 2_peter 1_john 2_john 3_john jude revelation'.split()
AUTHORS = ['tadros_yacoub_malaty', 'antonious_fekry', 'church_encyclopedia']

def decode(value):
    try: return json.loads(value)
    except (ValueError, TypeError): return value

def export(db, public):
    if Path(str(db)+'-wal').exists():
        raise ValueError('Close the crawler and checkpoint its WAL before exporting.')
    connection = sqlite3.connect(db.resolve().as_uri()+'?mode=ro&immutable=1', uri=True)
    entities = {i: {'type': t, 'id': name} for i,t,name in connection.execute('SELECT id,entity_type,canonical_name FROM entities')}
    for i,k,v in connection.execute('SELECT entity_id,key,value FROM entity_data'):
        entities[i][k] = decode(v)
    children = defaultdict(list)
    linked = defaultdict(set)
    for source, relation, target in connection.execute("SELECT source_entity_id,relationship_type,target_entity_id FROM relationships WHERE relationship_type IN ('CONTAINS','COMMENTARY_ON')"):
        if relation == 'CONTAINS': children[source].append(target)
        else: linked[source].add(target)
    completed = {i for (i,) in connection.execute("SELECT page_entity_id FROM commentary_import_state WHERE status='completed'")}
    bible = json.loads((public/'bible.json').read_text(encoding='utf-8'))
    valid = {(b['bookId'], c['chapter']): {v['number'] for v in c['verses']} for b in bible['books'] for c in b['chapters']}
    def normalized(text):
        text = unicodedata.normalize('NFKD', text.replace('ٱ','ا').replace('ى','ي'))
        return re.sub(r'[^\u0621-\u064a]', '', text).replace('ـ','')
    source_verses = {(v.get('book'),v.get('chapter'),v.get('verse')):v.get('text','') for v in entities.values() if v['type']=='bible_verse'}
    alignment = {'missingSourceReferences': [], 'textDifferences': []}
    for b in bible['books']:
        for ch in b['chapters']:
            for v in ch['verses']:
                key = (BOOKS[b['bookId']-1],ch['chapter'],v['number'])
                source_text = source_verses.get(key)
                if source_text is None: alignment['missingSourceReferences'].append(list(key))
                elif normalized(source_text)!=normalized(v['text']): alignment['textDifferences'].append(list(key))
    output = public/'data'/'study'
    manifest = {'schema': 1, 'source': 'User-supplied St-Takla knowledge base', 'canonBooks': 66, 'authors': {}, 'excludedPages': 0, 'unverifiedSections': 0, 'alignment':alignment}
    bundles = defaultdict(list)
    coverage = defaultdict(set)
    for i,p in entities.items():
        if p['type'] != 'commentary_page': continue
        slug = p.get('book')
        if slug not in BOOKS or i not in completed:
            manifest['excludedPages'] += 1
            continue
        book = BOOKS.index(slug)+1
        chapter = p.get('chapter')
        author = p['commentator_id']
        if author not in AUTHORS: raise ValueError(author)
        if chapter is not None and (book,chapter) not in valid:
            manifest['excludedPages'] += 1
            continue
        url = p['source_url']
        if not url.startswith('https://st-takla.org/'): raise ValueError('Unexpected source URL')
        sections, footnotes = [], []
        for child in dict.fromkeys(children[i]):
            s = entities[child]
            if s['type'] == 'commentary_footnote':
                footnotes.append({k:s.get(k) for k in ['number','text']})
            if s['type'] != 'commentary_section': continue
            verses = s.get('verse_numbers', [])
            graph = {entities[v].get('verse') for v in linked[child] if entities[v].get('book') == slug and entities[v].get('chapter') == chapter}
            verified = chapter is not None and set(verses) <= valid[(book,chapter)] and set(verses) <= graph
            if verses and not verified: manifest['unverifiedSections'] += 1
            mapped = verses if verified else []
            coverage[author].update((book,chapter,v) for v in mapped)
            sections.append({'id':s['id'], 'title':s.get('title'), 'text':s.get('text',''), 'verses':mapped, 'mappingReview':bool(verses and not verified), 'index':s.get('section_index',0), 'evidence':s.get('mapping_evidence'), 'footnotes':s.get('footnote_numbers',[])})
        page = {'url':url, 'title':p['page_title'], 'extractor':p.get('extractor_version'), 'hash':p.get('content_hash'), 'issues':p.get('review_issues',[]), 'missingFootnotes':p.get('unresolved_footnote_numbers',[]), 'sections':sorted(sections,key=lambda s:s['index']), 'footnotes':footnotes}
        bundles[(author,book,chapter or 'intro')].append(page)
        stats = manifest['authors'].setdefault(author, {'name':p['commentator_name_ar'], 'pages':0, 'chapters':0, 'introductions':0, 'sections':0, 'reviewPages':0})
        stats['pages'] += 1
        stats['sections'] += len(sections)
        stats['reviewPages'] += bool(page['issues'] or page['missingFootnotes'])
    for (author,book,chapter), pages in sorted(bundles.items(),key=lambda x:str(x[0])):
        path = output/author/str(book)/f'{chapter}.json'
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps({'pages':pages},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        manifest['authors'][author]['introductions' if chapter=='intro' else 'chapters'] += 1
    for author,stats in manifest['authors'].items():
        stats['mappedVerses'] = len(coverage[author])
        stats['available'] = [f'{b}/{c}' for a,b,c in bundles if a==author]
    manifest['totalBibleVerses'] = sum(map(len,valid.values()))
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({a:{k:v for k,v in s.items() if k!='available'} for a,s in manifest['authors'].items()},ensure_ascii=True))
    print('Unverified sections:',manifest['unverifiedSections'])

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db',type=Path,required=True)
    parser.add_argument('--public',type=Path,default=Path(__file__).resolve().parents[1]/'public')
    args = parser.parse_args()
    export(args.db,args.public)
