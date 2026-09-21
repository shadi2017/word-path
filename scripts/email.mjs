import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {buildPlan,today,addDays} from '../public/planner.js';
export function emailContent(user,pool,date,siteUrl){
 const done=new Set(user.done);const yesterday=addDays(date,-1);
 const missed=user.plan?buildPlan(user.plan.start_date,user.plan.end_date,user.plan.mode).filter(d=>d.date<=yesterday).reduce((n,d)=>n+d.chapters.filter(c=>!done.has(c.id)).length,0):0;
 if(!user.daily_email&&!(user.reminder_email&&missed))return null;
 const verse=pool[Math.floor(new Date(date+'T00:00:00Z').getTime()/86400000)%pool.length];
 const reminder=user.reminder_email&&missed?`فاتك ${missed} إصحاح لحد امبارح. مش لازم تعوّض كل حاجة مرة واحدة؛ افتح خطتك وخد خطوة صغيرة النهارده.\n\n`:'';
 return {subject:reminder?'خطوة صغيرة في الكلمة تكفي لنهارده 🌿':'آية ليومك من كلمة 🌿',text:`أهلًا ${user.display_name}،\n\n${reminder}${verse.text}\n${verse.reference} — ترجمة فان دايك\n\nرحلتك: ${siteUrl}\n\nإيقاف الرسائل: افتح الموقع ← الإعدادات ← اقفل رسائل البريد الإلكتروني.\nكلمة · رحلة كل يوم`};
}
async function run(){
 const env=process.env;
 for(const key of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','EMAIL_FROM','SITE_URL'])if(!env[key])throw Error('Missing required server secret: '+key);
 if(new URL(env.SITE_URL).protocol!=='https:')throw Error('SITE_URL must use HTTPS');
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
 if(hour<20||hour>22){console.log('Outside Cairo evening delivery window.');return}
 const date=today(),pool=JSON.parse(fs.readFileSync(new URL('../public/verses.json',import.meta.url)));
 const rpc=async(name,body)=>{const r=await fetch(env.SUPABASE_URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error('Database RPC failed: '+name+' '+r.status);return r.json().catch(()=>null)};
 const users=await rpc('email_recipients',{p_date:date});let sent=0,failures=0;
 for(const u of users){const content=emailContent(u,pool,date,env.SITE_URL);if(!content)continue;
  try{
   const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':`kalima-${u.id}-${date}`},body:JSON.stringify({from:env.EMAIL_FROM,to:[u.email],...content})});
   if(!r.ok){if(r.status===429){failures++;break}throw Error('Email provider returned '+r.status)}
   const result=await r.json();await rpc('record_email',{p_user:u.id,p_date:date,p_provider:result.id});sent++;
  }catch(e){failures++;console.error('Delivery failed:',e.message)}
  await new Promise(resolve=>setTimeout(resolve,650));
 }
 console.log(`Sent ${sent}; failures ${failures}.`);if(failures)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)run().catch(e=>{console.error(e.message);process.exitCode=1});
