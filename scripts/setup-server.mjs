// Local setup helper only. Not published with the website.
import http from 'node:http';import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../supabase/schema.sql',import.meta.url),'utf8');
const html='<!doctype html><html lang="en"><title>Kalima database setup</title><label for="sql">Database schema</label><textarea id="sql" style="width:95vw;height:90vh">'+sql.replaceAll('&','&amp;').replaceAll('<','&lt;')+'</textarea></html>';
http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)}).listen(4174,'127.0.0.1',()=>console.log('http://127.0.0.1:4174'));
