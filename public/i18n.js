import {messages} from './ui-messages.js';
import {bookNames} from './book-names.js';
import {languages,savedLanguage,saveLanguage} from './translations.js';
let locale=savedLanguage('kalima-ui-language');
export const getLocale=()=>locale;
const rows=[...messages,...bookNames.ar.map((name,i)=>[name,bookNames.en[i],bookNames.fr[i],bookNames.de[i]])];
const dictionary=new Map(rows.map(row=>[row[0],row]));
const ordered=[...dictionary.keys()].sort((a,b)=>b.length-a.length);
const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phrases=new RegExp('(?<![\\p{L}])('+ordered.map(escapeRegex).join('|')+')(?![\\p{L}])','gu');
export function translateText(value,language=locale){
 if(language==='ar'||!languages[language])return value;
 const index={en:1,fr:2,de:3}[language],trimmed=value.trim();
 const overdue=trimmed.match(/^عندك (.+) إصحاح لحد النهارده لسه متقروش\. ارجع لهم من الخطة؛ كل خطوة ليها قيمة\.$/);
 if(overdue)return {en:`${overdue[1]} chapters remain unread through today. Return to them in your plan; every step matters.`,fr:`${overdue[1]} chapitres restent à lire jusqu’à aujourd’hui. Retrouvez-les dans votre plan ; chaque pas compte.`,de:`Bis heute sind noch ${overdue[1]} Kapitel ungelesen. Kehren Sie im Plan zu ihnen zurück; jeder Schritt zählt.`}[language];
 const preview=trimmed.match(/^(.+) يوم · حوالي (.+) إصحاح يوميًا\. (.*)$/);
 if(preview)return {en:`${preview[1]} days · about ${preview[2]} chapters daily. ${translateText(preview[3],language)}`,fr:`${preview[1]} jours · environ ${preview[2]} chapitres par jour. ${translateText(preview[3],language)}`,de:`${preview[1]} Tage · etwa ${preview[2]} Kapitel täglich. ${translateText(preview[3],language)}`}[language];
 if(dictionary.has(trimmed))return value.replace(trimmed,dictionary.get(trimmed)[index]);
 return value.replace(phrases,key=>dictionary.get(key)[index]).replace(/١٬١٨٩/g,new Intl.NumberFormat(language).format(1189));
}
export function setLocale(value){if(!languages[value])return;locale=value;saveLanguage('kalima-ui-language',value);if(typeof document!=='undefined'){document.documentElement.lang=value;document.documentElement.dir=value==='ar'?'rtl':'ltr';applyLocale();}}
const originals=new WeakMap(),attributes=new WeakMap();
const excluded='[translate="no"],script,style,textarea,.scripture,.source-verse,.study-content,.commentary-text,.verse blockquote,.verse cite,.comment,.account-name,.avatar,.member-main h3,#org-select option[value]:not([value=""]),#member-select option[value]:not([value=""])';
export function applyLocale(){
 if(typeof document==='undefined')return;
 document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';
 document.title={ar:'كلمة · رحلة كل يوم',en:'Kalima · A journey every day',fr:'Kalima · Un chemin chaque jour',de:'Kalima · Jeden Tag unterwegs'}[locale];
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(!node.parentElement||node.parentElement.closest(excluded))continue;
  const prior=originals.get(node),original=prior&&node.nodeValue===prior.result?prior.original:node.nodeValue;
  const result=translateText(original);originals.set(node,{original,result});if(node.nodeValue!==result)node.nodeValue=result;
 }
 for(const element of document.querySelectorAll('[title],[aria-label],[placeholder]')){
  if(element.closest('[translate="no"]'))continue;
  const prior=attributes.get(element)||{};
  for(const key of ['title','aria-label','placeholder']){if(!element.hasAttribute(key))continue;const current=element.getAttribute(key),record=prior[key],original=record&&record.result===current?record.original:current,result=translateText(original);prior[key]={original,result};if(current!==result)element.setAttribute(key,result);}
  attributes.set(element,prior);
 }
 const select=document.querySelector('#interface-language');if(select&&select.value!==locale)select.value=locale;
}
export function languageControl(){return `<label class="language-control" translate="no"><span>🌐</span><select id="interface-language" aria-label="Interface language / لغة الموقع">${Object.entries(languages).map(([key,title])=>`<option value="${key}" ${key===locale?'selected':''}>${title}</option>`).join('')}</select></label>`}
export function watchLocale(){
 const observer=new MutationObserver(()=>{observer.disconnect();applyLocale();observer.observe(document.body,{childList:true,subtree:true,characterData:true});});
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});applyLocale();
}
