import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderStudyPages,studyHTML,saveSource,selectedSource,sourceSelector} from '../public/study-library.js';
const read=path=>readFile(new URL('../public/'+path,import.meta.url),'utf8').then(JSON.parse);
test('Arabic study export preserves canonical references, coverage totals and source provenance',async()=>{
 const manifest=await read('data/study/manifest.json'),bible=await read('bible.json');
 assert.equal(manifest.canonBooks,66);
 for(const [author,stats] of Object.entries(manifest.authors)){
  const covered=new Set();let sections=0,chapters=0,intros=0,pages=0;
  for(const key of stats.available){
   const [b,c]=key.split('/'),data=await read(`data/study/${author}/${key}.json`);
   assert.ok(Number(b)>=1&&Number(b)<=66);
   const verses=c==='intro'?[]:bible.books[Number(b)-1].chapters[Number(c)-1]?.verses.map(v=>v.number);
   assert.ok(verses,`${author}/${key}`);
   if(c==='intro')intros++;else chapters++;
   pages+=data.pages.length;
   for(const page of data.pages){
    assert.ok(page.url.startsWith('https://st-takla.org/'));
    assert.equal(page.extractor,'st-takla-3');
    for(const s of page.sections){
     sections++;assert.equal(typeof s.text,'string');assert.ok(s.text.length);
     if(s.mappingReview)assert.deepEqual(s.verses,[]);
     for(const v of s.verses){assert.ok(verses.includes(v));covered.add(`${b}:${c}:${v}`)}
    }
   }
  }
  assert.equal(covered.size,stats.mappedVerses);assert.equal(sections,stats.sections);
  assert.equal(chapters,stats.chapters);assert.equal(intros,stats.introductions);assert.equal(pages,stats.pages);
 }
});
test('verse commentary preserves noncontiguous mappings, escapes source text and isolates context',()=>{
 const page={url:'javascript:alert(1)',issues:[],missingFootnotes:[],footnotes:[{number:'1',text:'<script>note</script>'}],sections:[
  {title:'Mapped',text:'<img src=x onerror=alert(1)>',verses:[1,3],footnotes:['1']},
  {title:'Background',text:'Unmapped history',verses:[],footnotes:[]}
 ]};
 const one=renderStudyPages([page],1,'verse','en');
 assert.match(one,/&lt;img/);assert.match(one,/&lt;script/);assert.doesNotMatch(one,/javascript:|<script>|Unmapped history/);
 const two=renderStudyPages([page],2,'verse','en');assert.match(two,/No passage is mapped/);assert.doesNotMatch(two,/&lt;img/);
 const context=renderStudyPages([page],1,'context','en');assert.match(context,/Unmapped history/);assert.doesNotMatch(context,/&lt;img/);
 assert.match(renderStudyPages([page],1,'overview','en'),/Unmapped history/);
});
test('Tadros is the default source without denomination tagline or source link',()=>{
 assert.equal(selectedSource(),'tadros_yacoub_malaty');
 assert.match(sourceSelector('ar'),/<option value="tadros_yacoub_malaty" selected>القمص تادرس يعقوب ملطي<\/option>/);
 const page={url:'https://st-takla.org/example',issues:[],missingFootnotes:[],footnotes:[],sections:[{title:'مقدمة',text:'محتوى محلي',verses:[],footnotes:[]}]};
 const rendered=renderStudyPages([page],1,'overview','ar');
 assert.match(rendered,/محتوى محلي/);
 assert.doesNotMatch(rendered,/افتح المصدر على موقع الأنبا تكلا|تفسير قبطي أرثوذكسي|href=/);
});
test('failed study loads can be retried and unavailable chapters do not fetch guessed URLs',async()=>{
 const previous=globalThis.fetch;let attempts=0;
 globalThis.fetch=async path=>{attempts++;if(attempts===1)throw Error('offline');return {ok:true,json:async()=>({authors:{tadros_yacoub_malaty:{available:[]}}})}};
 try{
  assert.match(await studyHTML(1,1,1,'verse','en'),/Could not load/);
  assert.match(await studyHTML(1,1,1,'verse','en'),/unavailable/);
  assert.equal(attempts,2);
  assert.doesNotThrow(()=>saveSource('henry'));
 }finally{globalThis.fetch=previous}
});
