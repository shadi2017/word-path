import http from 'node:http';import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../supabase/migrations/20260923_languages.sql',import.meta.url),'utf8');
http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end('<!doctype html><title>Kalima language migration</title><label for="sql">Language migration</label><textarea id="sql" style="width:95vw;height:90vh">'+sql.replaceAll('&','&amp;').replaceAll('<','&lt;')+'</textarea>')}).listen(4175,'127.0.0.1');
