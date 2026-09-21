export const names=['التكوين','الخروج','اللاويين','العدد','التثنية','يشوع','القضاة','راعوث','صموئيل الأول','صموئيل الثاني','الملوك الأول','الملوك الثاني','أخبار الأيام الأول','أخبار الأيام الثاني','عزرا','نحميا','أستير','أيوب','المزامير','الأمثال','الجامعة','نشيد الأنشاد','إشعياء','إرميا','مراثي إرميا','حزقيال','دانيال','هوشع','يوئيل','عاموس','عوبديا','يونان','ميخا','ناحوم','حبقوق','صفنيا','حجي','زكريا','ملاخي','متى','مرقس','لوقا','يوحنا','أعمال الرسل','رومية','كورنثوس الأولى','كورنثوس الثانية','غلاطية','أفسس','فيلبي','كولوسي','تسالونيكي الأولى','تسالونيكي الثانية','تيموثاوس الأولى','تيموثاوس الثانية','تيطس','فليمون','العبرانيين','يعقوب','بطرس الأولى','بطرس الثانية','يوحنا الأولى','يوحنا الثانية','يوحنا الثالثة','يهوذا','الرؤيا'];
export const counts=[50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
export const categories=['العهد القديم','شعر وحكمة','العهد الجديد'];
export const category=b=>b>=39?2:(b>=17&&b<=21?1:0);
export const chapters=counts.flatMap((n,b)=>Array.from({length:n},(_,i)=>({id:`${b+1}:${i+1}`,book:b,chapter:i+1,group:category(b)})));
export const iso=d=>d.toISOString().slice(0,10);
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function addDays(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return iso(d)}
export function endForMonths(start,months){const d=new Date(start+'T12:00:00Z');const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+Number(months));const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return addDays(iso(d),-1)}
export function buildPlan(start,end,mode='varied'){
 const days=Math.round((new Date(end+'T12:00:00Z')-new Date(start+'T12:00:00Z'))/86400000)+1;
 if(!Number.isInteger(days)||days<1||days>3653)throw Error('اختار مدة من يوم إلى ١٠ سنين.');
 if(!['varied','ordered'].includes(mode))throw Error('طريقة القراءة غير صحيحة.');
 let sequence=chapters;
 if(mode==='varied'){
  const streams=[0,1,2].map(g=>chapters.filter(c=>c.group===g));const cursor=[0,0,0];sequence=[];
  for(let i=0;i<chapters.length;i++){
   const g=[0,1,2].filter(g=>cursor[g]<streams[g].length).sort((a,b)=>(cursor[a]+.5)/streams[a].length-(cursor[b]+.5)/streams[b].length)[0];
   sequence.push(streams[g][cursor[g]++]);
  }
 }
 return Array.from({length:days},(_,i)=>({date:addDays(start,i),chapters:sequence.slice(Math.floor(i*1189/days),Math.floor((i+1)*1189/days))}));
}
export function stats(plan,done,date=today()){
 const complete=new Set(done);let due=0,readDue=0;const days=plan.map(day=>{const read=day.chapters.filter(c=>complete.has(c.id)).length;if(day.date<=date){due+=day.chapters.length;readDue+=read}return {...day,read,complete:day.chapters.length>0&&read===day.chapters.length}});
 let streak=0;let cursor=days.findIndex(d=>d.date===date);if(cursor<0&&date>days.at(-1)?.date)cursor=days.length-1;if(cursor>=0&&!days[cursor].complete)cursor--;
 while(cursor>=0&&days[cursor].complete){streak++;cursor--}
 return {days,total:chapters.filter(c=>complete.has(c.id)).length,overdue:due-readDue,streak};
}
