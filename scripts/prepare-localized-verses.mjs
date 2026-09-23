import {readFile,writeFile} from 'node:fs/promises';
import {bookNames} from '../public/book-names.js';
const root=new URL('../public/',import.meta.url),read=p=>readFile(new URL(p,root),'utf8').then(JSON.parse);
const source=await read('verses.json');
for(const lang of ['en','fr','de']){
 const books=await Promise.all(Array.from({length:66},(_,i)=>read(`data/${lang}/${i+1}.json`)));
 const pool=source.flatMap(v=>{const book=books[v.book-1],verse=book?.chapters.find(c=>c.chapter===v.chapter)?.verses.find(x=>x.number===v.verse);return verse?[{...v,text:verse.text,reference:`${bookNames[lang][v.book-1]} ${v.chapter}:${v.verse}`}]:[];});
 if(pool.length<365)throw Error('Insufficient verse pool: '+lang);
 await writeFile(new URL(`data/${lang}/verses.json`,root),JSON.stringify(pool));console.log(lang,pool.length);
}
