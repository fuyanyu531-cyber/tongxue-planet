// 在项目根目录运行：node 工具/检查项目.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve('代码文件');let errors=[],files=0,refs=0;
function checkRef(file,value){if(!value||/^(?:https?:|data:|#|mailto:|javascript:)/.test(value)||value.includes("' +"))return;const clean=value.split(/[?#]/)[0];if(!clean)return;refs++;const target=path.resolve(path.dirname(file),decodeURIComponent(clean));if(!fs.existsSync(target))errors.push(path.relative(root,file)+' → '+value);}
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory()){walk(p);continue;}if(!/\.(html|css|js)$/.test(p))continue;files++;const s=fs.readFileSync(p,'utf8');if(p.endsWith('.js')){try{new vm.Script(s,{filename:p})}catch(e){errors.push(e.message)}}if(p.endsWith('.html'))for(const m of s.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g))checkRef(p,m[1]);if(p.endsWith('.css'))for(const m of s.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/g))checkRef(p,m[1]);}}
walk(root);console.log(JSON.stringify({codeFiles:files,staticReferences:refs,errors},null,2));if(errors.length)process.exitCode=1;
