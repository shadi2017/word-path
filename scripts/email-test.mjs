import fs from 'node:fs';
import {emailContent} from './email.mjs';
import {today} from '../public/planner.js';

// Owner-only smoke test: never changes member preferences or daily delivery claims.
const env=process.env;
for(const key of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','BREVO_API_KEY','EMAIL_FROM','SITE_URL']) {
 if(!env[key])throw Error('Missing required server setting: '+key);
}
if(new URL(env.SITE_URL).protocol!=='https:')throw Error('SITE_URL must use HTTPS');
const database=await fetch(env.SUPABASE_URL+'/rest/v1/rpc/email_recipients',{
 method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},
 body:JSON.stringify({p_date:today()})
});
if(!database.ok)throw Error('Database verification failed: HTTP '+database.status);
await database.json();
console.log('Database email RPC verified.');
const pool=JSON.parse(fs.readFileSync(new URL('../public/verses.json',import.meta.url)));
const content=emailContent({display_name:'Shadi',done:[],daily_email:true,reminder_email:false,ui_language:'ar',bible_language:'ar'},pool,today(),env.SITE_URL);
const response=await fetch('https://api.brevo.com/v3/smtp/email',{
 method:'POST',headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json'},
 body:JSON.stringify({sender:{name:'Kalima',email:env.EMAIL_FROM},to:[{email:'shadiayman18@gmail.com'}],subject:'[اختبار] '+content.subject,textContent:content.text,
 headers:{idempotencyKey:'kalima-test-'+env.GITHUB_RUN_ID}})
});
const result=await response.json().catch(()=>({}));
if(!response.ok){
 // Log only a short provider error code; never credentials or response bodies.
 const code=typeof result.code==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(result.code)?result.code:'unknown';
 throw Error('Brevo test failed: HTTP '+response.status+' ('+code+')');
}
console.log('Brevo accepted the owner-only test email. Check delivery in Brevo logs and the owner inbox.');
