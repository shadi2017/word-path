import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {counts} from '../public/planner.js';
const read=path=>readFile(new URL('../public/'+path,import.meta.url),'utf8').then(JSON.parse);
for(const lang of ['en','fr','de'])test(`${lang}: complete Bible preserves all reading-plan chapter identities`,async()=>{
 const metadata=await read(`data/${lang}/metadata.json`);assert.equal(metadata.license,'public-domain');
 for(let b=1;b<=66;b++){const book=await read(`data/${lang}/${b}.json`);assert.equal(book.bookId,b);assert.equal(book.chapters.length,counts[b-1]);for(const [i,c]of book.chapters.entries()){assert.equal(c.chapter,i+1);assert.ok(c.verses.length);assert.equal(new Set(c.verses.map(v=>v.number)).size,c.verses.length);assert.ok(c.verses.every(v=>v.text.trim()&&v.number>0));}}
});
test('commentary covers every chapter and keeps genuine source ranges',async()=>{
 let total=0,sections=0;
 for(let b=1;b<=66;b++){const book=await read(`data/commentary/${b}.json`);assert.equal(book.bookId,b);assert.equal(book.language,'en');assert.equal(book.chapters.length,counts[b-1]);for(const [i,c]of book.chapters.entries()){assert.equal(c.chapter,i+1);assert.ok(c.sections.length||c.general.length);for(const s of c.sections){assert.ok(s.from>0&&s.to>=s.from);assert.ok(s.paragraphs.length);assert.ok(s.paragraphs.every(p=>p.trim()&&!p.includes('<scripRef')));sections++;}total++;}}
 assert.equal(total,1189);assert.ok(sections>2000);
 const kings=await read('data/commentary/12.json');assert.match(kings.chapters[0].sections[0].paragraphs[0],/Ahaziah/);
 const genesis=await read('data/commentary/1.json');assert.ok(genesis.chapters[35].general.length);assert.equal(genesis.chapters[35].sections.length,0);
});
