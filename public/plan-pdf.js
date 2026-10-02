import {buildPlan,today} from './planner.js';
import {bookNames} from './book-names.js';

const copy={
 ar:{brand:'كلمة',title:'رحلتي في الكتاب المقدس',sub:'خطة قراءة شخصية',days:'يوم',chapters:'إصحاح',progress:'تقدّم القراءة',month:'قراءات الشهر',date:'اليوم والتاريخ',reading:'القراءة',done:'المكتمل',rest:'يوم للمراجعة والتأمل',continued:'تابع',snapshot:'التقدّم المسجّل وقت تنزيل الملف',encourage:'خطوة صغيرة كل يوم، ورحلة تستحق الاستمرار.',ordered:'قراءة بترتيب الأسفار',varied:'قراءة متنوعة بين العهدين والحكمة'},
 en:{brand:'Kalima',title:'My journey through the Bible',sub:'Personal reading plan',days:'days',chapters:'chapters',progress:'Reading progress',month:'Monthly readings',date:'Day & date',reading:'Reading',done:'Read',rest:'Review and reflection',continued:'continued',snapshot:'Progress recorded when this file was downloaded',encourage:'One small step each day. A journey worth continuing.',ordered:'Canonical book order',varied:'Old Testament, wisdom and New Testament'},
 fr:{brand:'Kalima',title:'Mon parcours dans la Bible',sub:'Plan de lecture personnel',days:'jours',chapters:'chapitres',progress:'Progression',month:'Lectures du mois',date:'Jour et date',reading:'Lecture',done:'Lus',rest:'Révision et méditation',continued:'suite',snapshot:'Progression enregistrée au téléchargement',encourage:'Un petit pas chaque jour. Un chemin à poursuivre.',ordered:'Ordre des livres bibliques',varied:'Ancien Testament, sagesse et Nouveau Testament'},
 de:{brand:'Kalima',title:'Mein Weg durch die Bibel',sub:'Persönlicher Leseplan',days:'Tage',chapters:'Kapitel',progress:'Lesefortschritt',month:'Monatliche Lesungen',date:'Tag und Datum',reading:'Lesung',done:'Gelesen',rest:'Wiederholung und Besinnung',continued:'Fortsetzung',snapshot:'Lesestand zum Zeitpunkt des Downloads',encourage:'Jeden Tag ein kleiner Schritt. Ein Weg, der sich lohnt.',ordered:'Reihenfolge der biblischen Bücher',varied:'Altes Testament, Weisheit und Neues Testament'}
};

// Compress only adjacent chapters, preserving the precise order of the plan.
export function readingRanges(chapters,lang='ar'){
 const ranges=[];
 for(const c of chapters){const last=ranges.at(-1);if(last&&last.book===c.book&&last.to+1===c.chapter)last.to=c.chapter;else ranges.push({book:c.book,from:c.chapter,to:c.chapter});}
 return ranges.map(r=>`${bookNames[lang][r.book]} ${lang==='ar'?'\u2066':''}${r.from}${r.from===r.to?'':'-'+r.to}${lang==='ar'?'\u2069':''}`);
}

// Each image is embedded on its own A4 page. Arabic shaping is rendered by the
// browser canvas, so the downloaded PDF does not depend on installed PDF fonts.
export function jpegPagesPDF(images,width=1240,height=1754){
 const encode=s=>new TextEncoder().encode(s),parts=[],offsets=[0];let position=0;
 const push=b=>{parts.push(b);position+=b.length;};
 const str=s=>push(encode(s));
 const object=(id,body,stream)=>{offsets[id]=position;str(`${id} 0 obj\n${body}`);if(stream){str('\nstream\n');push(stream);str('\nendstream');}str('\nendobj\n');};
 str('%PDF-1.4\n');
 object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,`<< /Type /Pages /Count ${images.length} /Kids [${images.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
 images.forEach((jpg,i)=>{const id=3+i*3;object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);object(id+1,`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`,jpg);const content=encode('q 595.28 0 0 841.89 0 0 cm /Im Do Q');object(id+2,`<< /Length ${content.length} >>`,content);});
 const xref=position;str(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);offsets.slice(1).forEach(x=>str(`${String(x).padStart(10,'0')} 00000 n \n`));str(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 return new Blob(parts,{type:'application/pdf'});
}

export async function createPlanPDF({plan,done=[],displayName='',lang='ar',onPage}){
 lang=copy[lang]?lang:'ar';const t=copy[lang],rtl=lang==='ar',W=1240,H=1754,margin=80;
 const days=buildPlan(plan.start_date,plan.end_date,plan.mode),completed=new Set(done),total=days.reduce((s,d)=>s+d.chapters.filter(c=>completed.has(c.id)).length,0),images=[];
 await document.fonts.ready;
 const family=rtl?'"Noto Kufi Arabic", sans-serif':'Arial, sans-serif';
 const date=(s,options={day:'numeric',month:'long',year:'numeric'})=>new Date(s+'T12:00:00Z').toLocaleDateString(lang,{...options,timeZone:'UTC'});
 let canvas,ctx,y,page=0;
 const text=(s,x,yy,size=24,color='#17323e',align=rtl?'right':'left',weight=400)=>{ctx.font=`${weight} ${size}px ${family}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.direction=rtl&&!/^[\d\s/().%+-]+$/.test(s)?'rtl':'ltr';ctx.fillText(s,x,yy);};
 const rect=(x,yy,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,yy,w,h);};
 const line=(yy)=>rect(margin,yy,W-2*margin,2,'#e0e7e8');
 const edge=rtl?W-margin:margin;
 function start(){canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');rect(0,0,W,H,'#ffffff');rect(0,0,W,14,'#d3a354');page++;text(t.brand,edge,78,32,'#17323e',undefined,700);text('BIBLE READING / 66',rtl?margin:W-margin,75,18,'#637a82',rtl?'left':'right');line(105);}
 async function finish(){line(H-93);text(t.snapshot,edge,H-57,17,'#637a82');text(String(page),rtl?margin:W-margin,H-57,20,'#17323e',rtl?'left':'right');const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));if(!blob)throw Error('PDF image encoding failed');images.push(new Uint8Array(await blob.arrayBuffer()));if(onPage)await onPage(canvas,page);await new Promise(resolve=>setTimeout(resolve,0));}
 function wrapped(s,width,size=24){ctx.font=`400 ${size}px ${family}`;const lines=[];let current='';for(const word of s.split(/\s+/)){const candidate=current?current+' '+word:word;if(current&&ctx.measureText(candidate).width>width){lines.push(current);current=word;}else current=candidate;}if(current)lines.push(current);return lines;}
 start();rect(margin,180,W-2*margin,620,'#17323e');const heroEdge=rtl?W-margin-55:margin+55;
 text(t.sub,heroEdge,265,25,'#edc98d');
 wrapped(t.title,W-2*margin-110,48).forEach((s,i)=>text(s,heroEdge,365+i*76,48,'#ffffff',undefined,700));
 wrapped(displayName.slice(0,80),W-2*margin-110,30).slice(0,2).forEach((s,i)=>text(s,heroEdge,560+i*48,30,'#ffffff'));
 text(`${date(plan.start_date)}  /  ${date(plan.end_date)}`,heroEdge,730,22,'#dae4e5');
 text(`${days.length} ${t.days}   /   1189 ${t.chapters}`,edge,910,34,undefined,undefined,700);
 text(plan.mode==='ordered'?t.ordered:t.varied,edge,977,24,'#637a82');
 text(t.progress,edge,1110,28);text(`${total} / 1189 (${Math.round(total/1189*100)}%)`,edge,1172,38,undefined,undefined,700);
 rect(margin,1220,W-2*margin,18,'#edf1f2');rect(rtl?W-margin-(W-2*margin)*total/1189:margin,1220,(W-2*margin)*total/1189,18,'#d3a354');
 wrapped(t.encourage,W-2*margin,30).forEach((s,i)=>text(s,edge,1370+i*50,30,'#637a82'));
 text(date(today()),edge,1530,21,'#637a82');await finish();
 const months=new Map();for(const d of days){const key=d.date.slice(0,7);if(!months.has(key))months.set(key,[]);months.get(key).push(d);}
 const readingX=rtl?W-margin-240:margin+240,readingWidth=680,dayX=edge,doneX=rtl?margin+45:W-margin-45;
 function monthStart(month,continuation=false){start();text(date(month+'-01',{month:'long',year:'numeric'}),edge,190,42,undefined,undefined,700);text(t.month+(continuation?' / '+t.continued:''),edge,242,22,'#637a82');rect(margin,280,W-2*margin,62,'#17323e');text(t.date,rtl?dayX-15:dayX+15,321,21,'#ffffff');text(t.reading,readingX,321,21,'#ffffff');text(t.done,doneX,321,20,'#ffffff','center');y=356;}
 for(const [month,monthDays]of months){monthStart(month);for(const day of monthDays){const count=day.chapters.filter(c=>completed.has(c.id)).length;const labels=readingRanges(day.chapters,lang);const lines=wrapped(labels.join('  /  ')||t.rest,readingWidth);let offset=0;while(offset<lines.length){if(y+70>H-130){await finish();monthStart(month,true);}const capacity=Math.max(1,Math.floor((H-130-y-30)/37)),chunk=lines.slice(offset,offset+capacity),height=Math.max(72,chunk.length*37+30);rect(margin,y,W-2*margin,height,Number(day.date.slice(-2))%2?'#f1f5f5':'#ffffff');text(date(day.date,{day:'numeric',month:'numeric'}),rtl?dayX-15:dayX+15,y+36,23,undefined,undefined,700);if(offset===0)text(date(day.date,{weekday:'short'}),rtl?dayX-15:dayX+15,y+62,17,'#637a82');chunk.forEach((s,i)=>text(s,readingX,y+36+i*37,24));text(offset===0?`${count}/${day.chapters.length}`:t.continued,doneX,y+38,offset===0?21:15,count===day.chapters.length&&count?'#28776b':'#637a82','center');y+=height+5;offset+=chunk.length;} }await finish();}
 return jpegPagesPDF(images,W,H);
}

export async function downloadPlanPDF(options){const blob=await createPlanPDF(options),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Kalima-plan-${options.plan.start_date}.pdf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
