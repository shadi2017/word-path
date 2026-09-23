import {loadCommentary,labels} from './translations.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs=items=>items.map(p=>`<p>${esc(p)}</p>`).join('');
export async function commentaryHTML(book,chapter,verse,overview,lang='ar'){
 const data=await loadCommentary(book),item=data.chapters[chapter-1],t=labels[lang];
 const arabicResource=lang==='ar'?'<aside class="note" lang="ar" dir="rtl" translate="no"><strong>تفسير عربي للدراسة</strong><p>مكتبة بوب أتلي تضم تفاسير ومقدمات تاريخية لعدد من الأسفار، ومسحًا للعهدين. تفتح على موقع المصدر؛ لا تشمل كل الأسفار، وليست ترجمة لتفسير متى هنري المعروض هنا.</p><a href="https://www.freebiblecommentary.org/arabic_bible_study.htm" target="_blank" rel="noopener noreferrer">افتح مكتبة التفسير العربي — بوب أتلي ↗</a></aside>':'';
 const note=`${arabicResource}<div class="note">${t[7]}</div><p class="muted small">${t[8]}</p>`;
 const section=s=>`<article class="word-entry"><h3>${t[5]} ${s.from}–${s.to}</h3>${paragraphs(s.paragraphs)}</article>`;
 let html='';
 if(overview)html=`${data.introduction.length?`<h3>${t[3]}</h3>${paragraphs(data.introduction)}`:''}<h3>${t[4]}</h3><p>${item.outline.map(esc).join(' ')}</p>${paragraphs(item.general)}${item.sections.map(section).join('')}`;
 else {const sections=item.sections.filter(s=>s.from<=verse&&s.to>=verse);html=sections.length?sections.map(section).join(''):item.general.length?`<h3>${t[6]}</h3>${paragraphs(item.general)}`:`<p>${t[9]}</p>`;}
 return `${note}<div class="study-content commentary-text" dir="ltr" lang="en">${html}</div><p class="muted small"><a href="https://www.ccel.org/ccel/henry/mhcc.html" target="_blank" rel="noopener noreferrer">Matthew Henry — Concise Commentary</a> · Public domain</p>`;
}
