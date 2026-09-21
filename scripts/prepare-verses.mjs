import fs from 'node:fs';
import {names,counts} from '../public/planner.js';
const bible=JSON.parse(fs.readFileSync(new URL('../public/bible.json',import.meta.url)));
if(bible.books.length!==66)throw Error('Expected 66 books');
for(let i=0;i<66;i++)if(bible.books[i].bookId!==i+1||bible.books[i].chapters.length!==counts[i])throw Error('Bible chapter mismatch '+i);
// Whole encouraging passages preserve context; each daily card carries its source reference.
const passages={19:[1,16,19,23,27,34,46,63,91,100,103,111,112,117,118,121,125,126,130,131,133,138,139,145,146,147,148,149,150],23:[40],40:[5,6],43:[14,15],45:[8,12],47:[4],49:[1,3],50:[1,2,3,4],51:[3],52:[5],58:[11,12],59:[1],60:[1,4],62:[4]};
const verses=[];
for(const [book,cs]of Object.entries(passages))for(const c of cs){const chapter=bible.books[Number(book)-1].chapters.find(x=>x.chapter===c);for(const v of chapter.verses)verses.push({book:Number(book),chapter:c,verse:v.number,text:v.text,reference:`${names[Number(book)-1]} ${c} : ${v.number}`})}
// Deterministic interleave of passages, without repeating an entry.
let seed=271828;for(let i=verses.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[verses[i],verses[j]]=[verses[j],verses[i]]}
fs.writeFileSync(new URL('../public/verses.json',import.meta.url),JSON.stringify(verses));
console.log(`Verified 66 books, 1189 chapters; prepared ${verses.length} daily verses.`);
