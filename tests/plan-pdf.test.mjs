import test from 'node:test';
import assert from 'node:assert/strict';
import {readingRanges,jpegPagesPDF} from '../public/plan-pdf.js';
test('PDF ranges retain daily order and gaps rather than inventing assigned chapters',()=>{
 assert.deepEqual(readingRanges([{book:0,chapter:1},{book:0,chapter:2},{book:39,chapter:1},{book:0,chapter:4}],'en'),['Genesis 1-2','Matthew 1','Genesis 4']);
 assert.deepEqual(readingRanges([]),[]);
});
test('PDF cross-reference offsets point to each binary-safe object',async()=>{
 const blob=jpegPagesPDF([new Uint8Array([255,216,0,255,217]),new Uint8Array([255,216,255,217])]);
 assert.equal(blob.type,'application/pdf');const data=new Uint8Array(await blob.arrayBuffer());const s=new TextDecoder('latin1').decode(data);
 assert.match(s,/\/Count 2/);const start=Number(s.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(data.slice(start,start+4)),'xref');
 const entries=s.slice(start).split('\n').slice(3,11);entries.forEach((row,i)=>{const offset=Number(row.slice(0,10));assert.equal(new TextDecoder().decode(data.slice(offset,offset+7)),`${i+1} 0 obj`);});
});
