import {mkdir,writeFile} from 'node:fs/promises';
import {counts} from '../public/planner.js';
const base=new URL('../public/data/',import.meta.url);
await mkdir(base,{recursive:true});
for(const [lang,version] of [['en','web'],['fr','lsg'],['de','elb1905']]){
 const url=`https://raw.githubusercontent.com/midvash/bible-data/main/versions/${lang}/${version}/`;
 const response=await fetch(`${url}${version}.json`);if(!response.ok)throw Error(response.status);
 const data=await response.json();
 if(data.books.length!==66||data.books.some((b,i)=>b.bookId!==i+1||b.chapters.length!==counts[i]))throw Error(`Invalid canon: ${lang}`);
 await mkdir(new URL(`${lang}/`,base),{recursive:true});
 for(const book of data.books)await writeFile(new URL(`${lang}/${book.bookId}.json`,base),JSON.stringify(book));
 const metadata=await fetch(`${url}metadata.json`).then(r=>r.json());
 if(metadata.license!=='public-domain')throw Error('Unlicensed translation');
 await writeFile(new URL(`${lang}/metadata.json`,base),JSON.stringify(metadata,null,2));
 console.log(lang,data.books.length,data.books.reduce((s,b)=>s+b.chapters.length,0));
}
const xml=await fetch('https://www.ccel.org/ccel/henry/mhcc.xml').then(r=>{if(!r.ok)throw Error(r.status);return r.text()});
if(!xml.includes('<DC.Rights>Public Domain</DC.Rights>'))throw Error('Commentary rights not verified');
const plain=s=>s.replace(/<[^>]*>/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/\s+/g,' ').trim();
const paragraphs=s=>[...s.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m=>plain(m[1])).filter(Boolean);
const books=[...xml.matchAll(/<div1\b[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/div1>/g)].filter(m=>m[2].includes('<div2 ')&&m[1]!=='Indexes');
if(books.length!==66)throw Error(`Found ${books.length} commentary books`);
await mkdir(new URL('commentary/',base),{recursive:true});
let total=0;
for(const [i,m] of books.entries()){
 // The source places the first chapter of these books directly under the book.
 if(i===11||i===13){const split=m[2].indexOf('<div2 ');m[2]=`<div2 title="Chapter 1">${m[2].slice(0,split)}</div2>${m[2].slice(split)}`;}
 const chapters=[...m[2].matchAll(/<div2\b[^>]*title="(?:Chapter|Psalm) (\d+)"[^>]*>([\s\S]*?)<\/div2>/g)].map(c=>{
  const sections=[...c[2].matchAll(/<div class="Commentary" id="Bible:([^"]+)"[^>]*>([\s\S]*?)<\/div>/g)].map(s=>{
   const match=s[1].match(/^[^.]+\.(\d+)\.(\d+)(?:-[^.]+\.(\d+)\.(\d+))?$/);if(!match)throw Error(`Bad reference ${s[1]}`);
   return {from:+match[2],to:+(match[4]||match[2]),paragraphs:paragraphs(s[2])};
  });
  return {chapter:+c[1],outline:paragraphs(c[2].match(/<table\b[^>]*>([\s\S]*?)<\/table>/)?.[1]||'').filter(t=>t!=='Chapter Outline'),general:sections.length?[]:paragraphs(c[2]),sections};
 });
 if(chapters.length!==counts[i]||chapters.some((c,j)=>c.chapter!==j+1||(!c.sections.length&&!c.general.length)))throw Error(`Incomplete commentary ${i+1}: ${chapters.length}`);
 total+=chapters.length;
 await writeFile(new URL(`commentary/${i+1}.json`,base),JSON.stringify({bookId:i+1,title:m[1],introduction:paragraphs(m[2].split('<div2 ')[0]),chapters,language:'en',source:'Matthew Henry — Concise Commentary',url:'https://www.ccel.org/ccel/henry/mhcc.html',license:'public-domain'}));
}
console.log('Commentary chapters:',total);
