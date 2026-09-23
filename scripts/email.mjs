import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {buildPlan,today,addDays} from '../public/planner.js';
import {emailCopy} from '../public/email-copy.js';
import {editions} from '../public/translations.js';
export function emailContent(user,pool,date,siteUrl){
 const done=new Set(user.done);const yesterday=addDays(date,-1);
 const missed=user.plan?buildPlan(user.plan.start_date,user.plan.end_date,user.plan.mode).filter(d=>d.date<=yesterday).reduce((n,d)=>n+d.chapters.filter(c=>!done.has(c.id)).length,0):0;
 if(!user.daily_email&&!(user.reminder_email&&missed))return null;
 const verse=pool[Math.floor(new Date(date+'T00:00:00Z').getTime()/86400000)%pool.length];
 const copy=emailCopy[user.ui_language]||emailCopy.ar;
 const reminder=user.reminder_email&&missed?copy.reminder(missed)+'\n\n':'';
 return {subject:reminder?copy.reminderSubject:copy.subject,text:`${copy.hello(user.display_name)}\n\n${reminder}${verse.text}\n${verse.reference} — ${editions[user.bible_language]||editions.ar}\n\n${copy.journey}: ${siteUrl}\n\n${copy.unsubscribe}\n${copy.footer}`};
}
async function run(){
 const env=process.env;
 const provider=env.EMAIL_PROVIDER||'resend';if(!['resend','brevo'].includes(provider))throw Error('Unsupported email provider');
 for(const key of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY',provider==='brevo'?'BREVO_API_KEY':'RESEND_API_KEY','EMAIL_FROM','SITE_URL'])if(!env[key])throw Error('Missing required server secret: '+key);
 if(new URL(env.SITE_URL).protocol!=='https:')throw Error('SITE_URL must use HTTPS');
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
 if(hour<20||hour>22){console.log('Outside Cairo evening delivery window.');return}
 const date=today(),pools={};for(const lang of ['ar','en','fr','de'])pools[lang]=JSON.parse(fs.readFileSync(new URL(lang==='ar'?'../public/verses.json':`../public/data/${lang}/verses.json`,import.meta.url)));
 const rpc=async(name,body)=>{const r=await fetch(env.SUPABASE_URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error('Database RPC failed: '+name+' '+r.status);return r.json().catch(()=>null)};
 const users=await rpc('email_recipients',{p_date:date});let sent=0,failures=0;
 for(const u of users){const content=emailContent(u,pools[u.bible_language]||pools.ar,date,env.SITE_URL);if(!content)continue;
  try{
   if(!await rpc('claim_email',{p_user:u.id,p_date:date}))continue;
   const r=provider==='brevo'?await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({sender:{name:'Kalima',email:env.EMAIL_FROM},to:[{email:u.email}],subject:content.subject,textContent:content.text,headers:{idempotencyKey:randomUUID()}})}):await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':`kalima-${u.id}-${date}`},body:JSON.stringify({from:env.EMAIL_FROM,to:[u.email],...content})});
   if(!r.ok){if(r.status===429){failures++;break}throw Error('Email provider returned '+r.status)}
   const result=await r.json();await rpc('record_email',{p_user:u.id,p_date:date,p_provider:result.id||result.messageId});sent++;
  }catch(e){failures++;console.error('Delivery failed:',e.message)}
  await new Promise(resolve=>setTimeout(resolve,650));
 }
 console.log(`Sent ${sent}; failures ${failures}.`);if(failures)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)run().catch(e=>{console.error(e.message);process.exitCode=1});
