import fs from 'node:fs';
const bible=JSON.parse(fs.readFileSync(new URL('../public/bible.json',import.meta.url)));
const byCode=new Map(bible.books.map(b=>[b.book,b]));
const parse=s=>{const [code,c,v]=s.split('.');const book=byCode.get(code),chapter=book?.chapters.find(x=>x.chapter===Number(c));if(!chapter?.verses.some(x=>x.number===Number(v)))return null;return [book.bookId,Number(c),Number(v)]};
const grouped={};let dropped=0;
for(const line of fs.readFileSync(new URL('../sources/cross_references.txt',import.meta.url),'utf8').split(/\r?\n/).slice(1)){
 const [from,to,votes]=line.split('\t');if(!to)continue;
 const src=parse(from),[first,last]=to.split('-'),dest=parse(first),end=last?parse(last):dest;
 if(!src||!dest||!end){dropped++;continue}
 const key=src[0]+':'+src[1];(grouped[key]??=[]).push({verse:src[2],target:dest,end,votes:Number(votes)});
}
// Up to five highest-scored links per source verse, validated against this Arabic text.
let total=0;for(const [key,links]of Object.entries(grouped)){const seen=new Map();grouped[key]=links.sort((a,b)=>b.votes-a.votes).filter(x=>{const n=seen.get(x.verse)||0;if(n>=5)return false;seen.set(x.verse,n+1);return true}).sort((a,b)=>a.verse-b.verse||b.votes-a.votes).map(({votes,...r})=>r);total+=grouped[key].length}
fs.writeFileSync(new URL('../public/crossrefs.json',import.meta.url),JSON.stringify(grouped));
console.log(`Prepared ${total} references across ${Object.keys(grouped).length} chapters; excluded ${dropped} unmapped references.`);
