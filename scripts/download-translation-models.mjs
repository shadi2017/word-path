import {mkdir,writeFile,stat} from 'node:fs/promises';
const dir=new URL('../test-tools/models/',import.meta.url);await mkdir(dir,{recursive:true});
const index=await fetch('https://raw.githubusercontent.com/argosopentech/argospm-index/main/index.json').then(r=>r.json());
for(const lang of ['ar','fr','de']){const file=new URL(`${lang}.zip`,dir);try{if((await stat(file)).size>1000000){console.log(lang,'cached');continue}}catch{}
 const model=index.find(p=>p.from_code==='en'&&p.to_code===lang);const url=model.links.find(x=>x.startsWith('https:'));
 const response=await fetch(url);if(!response.ok)throw Error(`${lang}: ${response.status}`);
 await writeFile(file,new Uint8Array(await response.arrayBuffer()));await writeFile(new URL(`${lang}-source.json`,dir),JSON.stringify(model,null,2));console.log(lang,'downloaded');
}
