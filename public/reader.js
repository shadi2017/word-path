import {names,counts} from './planner.js';
import {contextFor,chapterWords} from './study.js';
import {languages,editions,savedLanguage,saveLanguage,loadBook,labels} from './translations.js';
import {commentaryHTML} from './commentary.js';
let textLanguage=savedLanguage('kalima-bible-language');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(x).toLocaleString('ar-EG');
let biblePromise,crossPromise,current,origin,active='text',verseNumber=1,allowComplete=false,renderVersion=0;
const bible=()=>biblePromise??=fetch('bible.json').then(r=>{if(!r.ok)throw Error('تعذر تحميل نص الكتاب');return r.json()}).catch(e=>{biblePromise=null;throw e});
const cross=()=>crossPromise??=fetch('crossrefs.json').then(r=>{if(!r.ok)throw Error('تعذر تحميل الآيات المقابلة');return r.json()}).catch(e=>{crossPromise=null;throw e});
const label=([b,c,v])=>`${names[b-1]} ${n(c)} : ${n(v)}`;
export async function openReader(id,{keepOrigin=false,focusVerse=0,canMarkComplete=false}={}){
 const [b,c]=id.split(':').map(Number);if(!(b>=1&&b<=66&&c>=1&&c<=counts[b-1]))throw Error('الإصحاح غير موجود');
 current={b,c,id};if(!keepOrigin){origin=id;allowComplete=canMarkComplete}active='text';verseNumber=focusVerse||1;
 const modal=document.querySelector('#modal');modal.innerHTML='<p class="loading">جارٍ تحميل الإصحاح…</p>';if(!modal.open)modal.showModal();
 try{await renderReader();if(focusVerse)document.querySelector(`[data-verse="${focusVerse}"]`)?.scrollIntoView({block:'center',behavior:'instant'})}catch(e){modal.innerHTML=`<p class="error">${esc(e.message)}. جرّب تفتح الإصحاح تاني.</p><button class="button" data-action="close-modal">إغلاق</button>`}
}
async function renderReader(){
 const captured=current,version=++renderVersion;const text=await bible();if(captured!==current||version!==renderVersion)return;
 const {b,c,id}=current;
 const translated=await loadBook(textLanguage,b);if(captured!==current||version!==renderVersion)return;
 const verses=translated.chapters.find(x=>x.chapter===c).verses;
 if(!verses.some(v=>v.number===verseNumber))verseNumber=verses[0]?.number||1;
 const ctx=contextFor(b,c),terms=chapterWords(text.books[b-1].chapters[c-1].verses,b);
 let content='';
 if(active==='overview'||active==='commentary'){
  // Commentary references follow the source's English numbering. Arabic is
  // shown as the reference text; do not silently equate translated numbering.
  const verses=text.books[b-1].chapters[c-1].verses;
  content=await commentaryHTML(b,c,verseNumber,active==='overview',textLanguage);if(captured!==current||version!==renderVersion)return;
  if(textLanguage!=='ar')content='<p class="note">ترقيم التفسير يتبع المصدر الإنجليزي، والنص المرجعي هنا بالعربية. قد يختلف موضع الآية في الترجمة المختارة. / Commentary uses the source verse numbering. The reference text below is Arabic; verse numbering can differ between translations.</p>'+content;
  if(active==='commentary')content='<label>الآية / Verse<select id="source-verse">'+verses.map(v=>'<option value="'+v.number+'" '+(v.number===verseNumber?'selected':'')+'>'+v.number+'</option>').join('')+'</select></label><blockquote class="source-verse" lang="ar" dir="rtl">'+esc(verses.find(v=>v.number===verseNumber)?.text||'')+'</blockquote>'+content;
 }

 if(active==='text')content=`<div class="scripture" lang="${textLanguage}" dir="${textLanguage==='ar'?'rtl':'ltr'}">${verses.map(v=>`<p data-verse="${v.number}" class="${v.number===verseNumber?'verse-focus':''}"><button class="verse-number" data-study-verse="${v.number}" title="تفسير الآية ${v.number}">${n(v.number)}</button>${esc(v.text)}</p>`).join('')}</div><div class="reader-bottom">${allowComplete?`<button class="button" data-finish-read="${id}">قرأت الإصحاح</button>`:'<span class="note">لتسجيل تقدّمك، أنشئ خطة من صفحة رحلتي.</span>'}<span class="muted small">اضغط رقم الآية لعرض تفسيرها.</span></div>`;
 if(active==='context')content=`<div class="study-content"><span class="tag">خلفية السفر</span><h3 style="margin:15px 0">${names[b-1]}</h3><p>${esc(ctx.background)}</p><h3 style="margin-top:24px">الإصحاح في سياقه</h3><p>${esc(ctx.summary)}</p><div class="note" style="margin:16px 0">القسم ده بيشمل ${ctx.from===ctx.to?'الإصحاح '+n(ctx.from):'الإصحاحات '+n(ctx.from)+'–'+n(ctx.to)}. ده مدخل للقسم، مش تفسير تفصيلي لكل آية.</div><div class="row">${ctx.from!==c?`<button class="text-link" data-reader-id="${b}:${ctx.from}">اقرأ بداية القسم</button>`:''}${c>1?`<button class="text-link" data-reader-id="${b}:${c-1}">الإصحاح السابق</button>`:''}${c<counts[b-1]?`<button class="text-link" data-reader-id="${b}:${c+1}">الإصحاح التالي</button>`:''}</div><h3 style="margin-top:24px">وأنت بتقرأ</h3><p>مين بيتكلم ولمين؟ إيه اللي سبق المقطع؟ وهل الكلام سرد لحدث، ولا شعر، ولا وصية، ولا رؤية؟ اقرأ الآية مع اللي قبلها وبعدها.</p><p class="muted small" style="margin-top:24px">مداخل تحريرية موجزة مستندة إلى محتوى السفر. مصدر القراءة: ترجمة فان دايك. لا تُنسب إلى مفسّر أو طائفة بعينها.</p></div>`;
 if(active==='words')content=`<div class="study-content"><p class="muted small" style="margin-bottom:18px">شرح مبسّط لألفاظ ظهرت في النص العربي للإصحاح. المعنى النهائي بيتحدد من السياق.</p>${terms.length?terms.map(([term,meaning])=>`<article class="word-entry"><h3>${esc(term)}</h3><p>${esc(meaning)}</p></article>`).join(''):'<div class="empty">مفيش ألفاظ من القاموس الحالي مطابقة للإصحاح ده. القاموس مبدئي، مش شرح شامل لكل الكلمات.</div>'}</div>`;
 if(active==='cross'){
  // Reference identities follow the Arabic corpus, so source and targets remain Arabic.
  const referenceVerses=text.books[b-1].chapters[c-1].verses;
  const verses=referenceVerses;

  const refs=await cross();if(captured!==current||version!==renderVersion)return;
  const links=(refs[id]||[]).filter(r=>r.verse===verseNumber);
  content=`<div class="study-content"><div class="field"><label for="source-verse">الآيات المقابلة لأي آية؟ (ترقيم فان دايك، النص العربي)</label><select id="source-verse">${verses.map(v=>`<option value="${v.number}" ${v.number===verseNumber?'selected':''}>آية ${n(v.number)}</option>`).join('')}</select></div><blockquote class="source-verse">${esc(verses.find(v=>v.number===verseNumber)?.text||'')}</blockquote>${links.length?links.map(r=>{const [tb,tc,tv]=r.target;const target=text.books.find(x=>x.bookId===tb)?.chapters.find(x=>x.chapter===tc)?.verses.find(x=>x.number===tv);return `<article class="cross-entry"><button class="text-link" data-reader-id="${tb}:${tc}" data-focus-verse="${tv}">${label(r.target)}${r.end.join(':')!==r.target.join(':')?' — '+label(r.end):''}</button><p class="scripture">${esc(target?.text||'')}</p><small class="muted">${r.end.join(':')!==r.target.join(':')?'معروض أول آية؛ افتح الإصحاح لقراءة المقطع.':'افتح الإصحاح لقراءة السياق.'}</small></article>`}).join(''):'<div class="empty">مفيش إحالات متاحة للآية دي في البيانات الحالية.</div>'}<p class="muted small" style="line-height:2;margin-top:22px">المصدر: <a href="https://openbible.info/labs/cross-references/" target="_blank" rel="noopener noreferrer">OpenBible.info</a>، بترخيص CC BY. بنعرض حتى ٥ إحالات لكل آية بعد التحقق من وجودها في النص العربي. التشابه قد يكون في الموضوع أو اللفظ أو الحدث، ولا يعني تطابق السياق أو المعنى.</p></div>`;
 }
 document.querySelector('#modal').innerHTML=`<header><div><span class="eyebrow">اقرأ وافهم</span><h2>${names[b-1]} ${n(c)}</h2></div><button data-action="close-modal" aria-label="إغلاق">✕</button></header><div class="reader-languages"><label>${labels[textLanguage][0]}<select id="reader-language">${Object.entries(languages).map(([key,name])=>`<option value="${key}" ${key===textLanguage?'selected':''}>${name} · ${editions[key]}</option>`).join('')}</select></label></div><div class="reader-controls"><select id="reader-book" aria-label="السفر">${names.map((name,i)=>`<option value="${i+1}" ${b===i+1?'selected':''}>${name}</option>`).join('')}</select><select id="reader-chapter" aria-label="الإصحاح">${Array.from({length:counts[b-1]},(_,i)=>`<option value="${i+1}" ${c===i+1?'selected':''}>إصحاح ${n(i+1)}</option>`).join('')}</select></div>${origin!==id?`<button class="text-link" data-reader-id="${origin}" style="margin-bottom:16px">العودة لإصحاح القراءة الأساسي</button>`:''}<div class="reader-tabs" role="tablist" aria-label="أدوات فهم الإصحاح">${[['text','النص'],['overview',labels[textLanguage][1]],['commentary',labels[textLanguage][2]],['context','الخلفية والسياق'],['words','كلمات صعبة'],['cross','آيات مقابلة']].map(([key,title])=>`<button role="tab" aria-selected="${active===key}" data-reader-tab="${key}" class="${active===key?'active':''}">${title}${key==='words'&&terms.length?' · '+n(terms.length):''}</button>`).join('')}</div><section role="tabpanel">${content}</section>`;
}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;try{if(b.dataset.readerTab){active=b.dataset.readerTab;await renderReader()}if(b.dataset.studyVerse){verseNumber=Number(b.dataset.studyVerse);active='commentary';await renderReader()}if(b.dataset.readerId)await openReader(b.dataset.readerId,{keepOrigin:true,focusVerse:Number(b.dataset.focusVerse||0)})}catch(e){const panel=document.querySelector('#modal [role=tabpanel]');if(panel)panel.innerHTML=`<p class="error">${esc(e.message)}</p>`}});
document.addEventListener('change',async e=>{try{if(e.target.id==='reader-language'){textLanguage=e.target.value;saveLanguage('kalima-bible-language',textLanguage);await renderReader()}if(e.target.id==='reader-book')await openReader(`${e.target.value}:1`,{keepOrigin:true});if(e.target.id==='reader-chapter')await openReader(`${current.b}:${e.target.value}`,{keepOrigin:true});if(e.target.id==='source-verse'){verseNumber=Number(e.target.value);await renderReader()}}catch(e){const panel=document.querySelector('#modal [role=tabpanel]');if(panel)panel.innerHTML=`<p class="error">${esc(e.message)}</p>`}});
