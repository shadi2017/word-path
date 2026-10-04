const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const sources={tadros_yacoub_malaty:'القمص تادرس يعقوب ملطي',antonious_fekry:'القمص أنطونيوس فكري',church_encyclopedia:'الموسوعة الكنسية',henry:'Matthew Henry · English'};
const copy={
 ar:['مصدر التفسير','','لا يوجد مقطع مرتبط بهذه الآية في المصدر المختار. راجع تفسير الإصحاح والخلفية والسياق.','مقدمة السفر والخلفية','سياق الإصحاح','الحواشي','','بعض الروابط أو الحواشي تحتاج مراجعة؛ المقاطع غير المحددة معروضة كسياق فقط.','هذا المحتوى غير متاح في المصدر المختار.','تعذر تحميل التفسير. أعد اختيار التبويب للمحاولة مجددًا.'],
 en:['Commentary source','','No passage is mapped to this verse in this source. See the chapter commentary and context.','Book introduction and background','Chapter context','Footnotes','','Some mappings or footnotes need review; unmapped passages are context only.','This content is unavailable in the selected source.','Could not load commentary. Select the tab again to retry.'],
 fr:['Source du commentaire','Commentaire copte orthodoxe · Texte original arabe','Aucun passage associé à ce verset dans cette source. Consultez le commentaire du chapitre et le contexte.','Introduction et contexte du livre','Contexte du chapitre','Notes','Lire la source sur St-Takla','Certains liens ou notes nécessitent une vérification ; les passages non associés restent contextuels.','Ce contenu est indisponible dans cette source.','Impossible de charger le commentaire. Sélectionnez à nouveau l’onglet.'],
 de:['Kommentarquelle','Koptisch-orthodoxer Kommentar · Arabischer Originaltext','Dieser Vers ist keinem Abschnitt dieser Quelle zugeordnet. Siehe Kapitelkommentar und Kontext.','Einleitung und Hintergrund des Buches','Kapitelkontext','Fußnoten','Quelle auf St-Takla lesen','Einige Zuordnungen oder Fußnoten müssen geprüft werden; nicht zugeordnete Abschnitte dienen nur als Kontext.','Dieser Inhalt ist in der gewählten Quelle nicht verfügbar.','Kommentar konnte nicht geladen werden. Wählen Sie den Reiter erneut.']
 en:['Commentary source','','No passage is mapped to this verse in this source. See the chapter commentary and context.','Book introduction and background','Chapter context','Footnotes','','Some mappings or footnotes need review; unmapped passages are context only.','This content is unavailable in the selected source.','Could not load commentary. Select the tab again to retry.'],
 fr:['Source du commentaire','','Aucun passage associé à ce verset dans cette source. Consultez le commentaire du chapitre et le contexte.','Introduction et contexte du livre','Contexte du chapitre','Notes','','Certains liens ou notes nécessitent une vérification ; les passages non associés restent contextuels.','Ce contenu est indisponible dans cette source.','Impossible de charger le commentaire. Sélectionnez à nouveau l’onglet.'],
 de:['Kommentarquelle','','Dieser Vers ist keinem Abschnitt dieser Quelle zugeordnet. Siehe Kapitelkommentar und Kontext.','Einleitung und Hintergrund des Buches','Kapitelkontext','Fußnoten','','Einige Zuordnungen oder Fußnoten müssen geprüft werden; nicht zugeordnete Abschnitte dienen nur als Kontext.','Dieser Inhalt ist in der gewählten Quelle nicht verfügbar.','Kommentar konnte nicht geladen werden. Wählen Sie den Reiter erneut.']
};
const referenceNote={ar:'مرجع الآية المعروض هو فان دايك. نحتفظ بنص المفسّر وترقيم مصدره؛ قد تختلف صياغة الاقتباس عن نص القراءة.',en:'The reference verse is Van Dyck. Commentary retains its source wording and numbering; quotations may differ from the reading text.',fr:'Le verset de référence est celui de Van Dyck. Le commentaire conserve le texte et la numérotation de sa source ; les citations peuvent différer du texte de lecture.',de:'Der Referenzvers folgt Van Dyck. Der Kommentar behält Wortlaut und Nummerierung seiner Quelle; Zitate können vom Lesetext abweichen.'};
export function selectedSource(){try{const s=localStorage.getItem('kalima-commentary-source');return sources[s]?s:'tadros_yacoub_malaty'}catch{return 'tadros_yacoub_malaty'}}
export function saveSource(s){if(sources[s])try{localStorage.setItem('kalima-commentary-source',s)}catch{}}
export function sourceSelector(lang='ar'){const t=copy[lang]||copy.ar;return `<label translate="no">${t[0]}<select id="commentary-source">${Object.entries(sources).map(([key,name])=>`<option value="${key}" ${selectedSource()===key?'selected':''}>${name}</option>`).join('')}</select></label>`}
const cache=new Map();
async function json(path){if(!cache.has(path))cache.set(path,fetch(path).then(r=>{if(!r.ok)throw Error('Study request failed');return r.json()}).catch(e=>{cache.delete(path);throw e}));return cache.get(path)}
async function load(author,book,chapter){const manifest=await json('data/study/manifest.json');if(!manifest.authors[author]?.available.includes(`${book}/${chapter}`))return {pages:[]};return json(`data/study/${author}/${book}/${chapter}.json`)}
export function renderStudyPages(pages,verse,mode,lang='ar'){
 const t=copy[lang]||copy.ar;
 return pages.map(page=>{
  const sections=page.sections.filter(s=>mode==='overview'||mode==='intro'||(mode==='context'?!s.verses.length:s.verses.includes(verse)));
  const used=new Set(sections.flatMap(s=>s.footnotes||[]).map(String));
  const notes=page.footnotes.filter(f=>used.has(String(f.number))||mode==='overview'||mode==='intro');
    return `<article class="study-source" translate="no">${page.issues.length||page.missingFootnotes.length||page.sections.some(s=>s.mappingReview)?`<p class="note">${t[7]}</p>`:''}<div class="study-content commentary-text" lang="ar" dir="rtl">${sections.length?sections.map(s=>`<section class="word-entry"><h3>${esc(s.title)}</h3><p style="white-space:pre-line">${esc(s.text)}</p></section>`).join(''):`<p>${mode==='verse'?t[2]:t[8]}</p>`}</div>${notes.length?`<details><summary>${t[5]} (${notes.length})</summary><div lang="ar" dir="rtl">${notes.map(f=>`<p><strong>${esc(f.number)}</strong> ${esc(f.text)}</p>`).join('')}</div></details>`:''}</article>`;
 }).join('')||`<p translate="no">${t[8]}</p>`;
}
export async function studyHTML(book,chapter,verse,mode,lang='ar'){
 const author=selectedSource(),t=copy[lang]||copy.ar;
 if(author==='henry')return '';
 try{
  const data=await load(author,book,chapter);
  let content=renderStudyPages(data.pages,verse,mode,lang);
  if(mode==='context'){
   const intro=await load(author,book,'intro');
   content=`<details class="study-intro"><summary>${t[3]}</summary>${renderStudyPages(intro.pages,verse,'intro',lang)}</details><h3>${t[4]}</h3>${content}`;
  }
    return `<div translate="no"><p class="note"><strong>${esc(sources[author])}</strong></p><p class="muted small">${referenceNote[lang]||referenceNote.ar}</p>${content}</div>`;
 }catch{return `<p class="error" translate="no">${t[9]}</p>`}
}
