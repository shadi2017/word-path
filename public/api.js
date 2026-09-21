const cfg=window.APP_CONFIG||{};
export const configured=!!(cfg.supabaseUrl&&cfg.supabaseKey);
let session;try{session=JSON.parse(localStorage.getItem('kalima-session')||'null')}catch{session=null}
let refreshing;
const save=s=>{session=s;if(s)localStorage.setItem('kalima-session',JSON.stringify(s));else localStorage.removeItem('kalima-session')};
async function request(path,{method='GET',body,auth=true}={}){
 if(!configured)throw Error('حفظ البيانات يحتاج ربط الموقع بقاعدة البيانات أولًا.');
 if(auth&&session&&session.expires_at<Date.now()/1000+60){
  refreshing??=request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},auth:false}).then(s=>save({...s,expires_at:Date.now()/1000+s.expires_in})).finally(()=>refreshing=null);
  await refreshing;
 }
 const r=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+path,{method,headers:{apikey:cfg.supabaseKey,...(auth&&session?.access_token?{Authorization:`Bearer ${session.access_token}`} : {}),'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const data=await r.json().catch(()=>null);if(!r.ok){if(r.status===401&&auth)save(null);throw Error(data?.msg||data?.message||data?.error_description||'تعذر الاتصال. جرّب مرة تانية.')}return data;
}
export const api={
 loggedIn:()=>!!session,
 async login(email,password){const s=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},auth:false});save({...s,expires_at:Date.now()/1000+s.expires_in})},
 async signup(email,password,username,display_name){await request('/auth/v1/signup',{method:'POST',body:{email,password,data:{username,display_name}},auth:false})},
 async logout(){try{if(session)await request('/auth/v1/logout',{method:'POST'})}finally{save(null)}},
 rpc:(name,args={})=>request('/rest/v1/rpc/'+name,{method:'POST',body:args}),
 async recover(email){await request('/auth/v1/recover',{method:'POST',body:{email},auth:false})},
 async password(password){await request('/auth/v1/user',{method:'PUT',body:{password}})},
 callback(){const params=new URLSearchParams(location.hash.slice(1));if(params.has('access_token')){save({access_token:params.get('access_token'),refresh_token:params.get('refresh_token'),expires_at:Date.now()/1000+Number(params.get('expires_in')||3600)});history.replaceState(null,'',location.pathname);return params.get('type')==='recovery'}return false}
};
