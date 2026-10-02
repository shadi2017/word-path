"""Offline machine translation of public-domain commentary; never translate Scripture.

Requires ctranslate2 and sentencepiece in test-tools/translate, and official
Argos model archives in test-tools/models. Pilot output is NOT published.
"""
import argparse, json, pathlib, re, sys, time, zipfile
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'test-tools' / 'translate'))
import ctranslate2
import sentencepiece

parser = argparse.ArgumentParser()
parser.add_argument('language', choices=['ar','fr','de'])
parser.add_argument('--pilot', action='store_true')
args = parser.parse_args()
target = ROOT / 'test-tools' / 'models' / args.language
if not target.exists():
    target.mkdir(parents=True)
    with zipfile.ZipFile(ROOT / 'test-tools' / 'models' / (args.language+'.zip')) as archive:
        for member in archive.infolist():
            if not (target / member.filename).resolve().is_relative_to(target.resolve()):
                raise ValueError('Unsafe model archive path')
        archive.extractall(target)
model = next(target.rglob('model.bin')).parent
sp_path = next(target.rglob('sentencepiece.model'))
sp = sentencepiece.SentencePieceProcessor(model_file=str(sp_path))
engine = ctranslate2.Translator(str(model), device='cpu', compute_type='int8', inter_threads=1, intra_threads=4)

def translate(text):
    if not re.search('[A-Za-z]', text):
        return text
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z“"(])', text)
    pieces = []
    for sentence in sentences:
        tokens = sp.encode(sentence, out_type=str)
        # Keep each decoding request bounded. Longer source sentences are split
        # at token boundaries; source paragraph grouping is restored afterward.
        pieces.extend(tokens[i:i+220] for i in range(0, len(tokens), 220))
    result = engine.translate_batch(pieces, beam_size=2, max_decoding_length=512, batch_type='tokens', max_batch_size=1024)
    output = ' '.join(sp.decode(item.hypotheses[0]) for item in result).strip()
    if not output:
        raise ValueError('Empty translation')
    return output

started=time.time()
if args.pilot:
    result=[]
    for b,c in [(1,1),(43,1),(45,8)]:
        book=json.loads((ROOT / 'public' / 'data' / 'commentary' / f'{b}.json').read_text(encoding='utf8'))
        source=book['chapters'][c-1]['sections'][0]['paragraphs'][0]
        result.append({'book':b,'chapter':c,'source':source,'translation':translate(source)})
    path=ROOT/'test-tools'/f'commentary-pilot-{args.language}.json'
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'pilot':str(path),'seconds':round(time.time()-started)},ensure_ascii=False),flush=True)
else:
    output_dir=ROOT/'public'/'data'/'commentary'/args.language
    output_dir.mkdir(parents=True,exist_ok=True)
    for b in range(1,67):
        out=output_dir/f'{b}.json'
        if out.exists():
            print(f'{args.language} {b} cached',flush=True);continue
        data=json.loads((ROOT/'public'/'data'/'commentary'/f'{b}.json').read_text(encoding='utf8'))
        data['introduction']=[translate(p) for p in data['introduction']]
        for chapter in data['chapters']:
            for key in ['outline','general']:
                chapter[key]=[translate(p) for p in chapter[key]]
            for section in chapter['sections']:
                section['paragraphs']=[translate(p) for p in section['paragraphs']]
        data['language']=args.language
        data['translation']={'method':'machine','engine':'Argos models / CTranslate2','reviewed':False,'sourceLanguage':'en'}
        temporary=out.with_suffix('.tmp')
        temporary.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf8')
        temporary.replace(out)
        print(f'{args.language} {b}/66 {time.time()-started:.0f}s',flush=True)
