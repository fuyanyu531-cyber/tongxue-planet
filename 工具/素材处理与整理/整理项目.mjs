// 一次性目录迁移与相对链接机械重写。运行前自动保存旧版。
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), dest=path.join(root,'代码文件');
if(fs.existsSync(path.join(dest,'迁移清单.json'))) throw Error('已经迁移，请勿重复执行');
const write=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)};
const copy=(a,b)=>{fs.mkdirSync(path.dirname(b),{recursive:true});fs.cpSync(a,b,{recursive:true})};
const backup=path.join(root,'旧版备份','整理前完整项目');
fs.mkdirSync(backup,{recursive:true});
for(const n of fs.readdirSync(root)) if(!['.git','旧版备份','代码文件','工具','项目资料'].includes(n)) copy(path.join(root,n),path.join(backup,n));
const modules={'adventure-intro.html':'02-眼球大冒险/代码/眼球大冒险.html','adventure.html':'02-眼球大冒险/代码/小游戏中心.html','selftest.html':'03-视界探索站/代码/视界探索站.html','decoder.html':'04-天书解码器/代码/天书解码器.html','hero.html':'05-拓展功能/代码/护眼打卡.html','qa.html':'05-拓展功能/代码/护眼问答.html','eye-test.html':'05-拓展功能/代码/视力小工具.html'};
const routes={...modules,'index.html':'01-首页/代码/首页.html','eyeball-adventure.html':modules['adventure-intro.html'],'vision-exploration.html':modules['selftest.html']};
const rel=(from,to)=>path.relative(path.dirname(from),to).replaceAll('\\','/');
const names={'character-main':'小光仔站立','character-happy':'小光仔开心','character-magnifier':'小光仔放大镜','character-fly':'小光仔飞行','xiaoguangzi-new':'小光仔全身','planet-scene':'护眼星球场景','logo-tongxue':'瞳学星球标志','spaceship':'飞船','rocket':'火箭','star-big':'大星星','star-small':'小星星','island-eye':'眼球小岛','island-eye-full':'眼球完整小岛','eye-planet':'眼球星球','resin':'树脂镜片','glass':'玻璃镜片','pc':'PC镜片','planet-myopia':'近视认知星球','planet-glasses':'眼镜类型星球','planet-fitting':'配镜流程星球','planet-record':'配镜记录星球','intro':'开场动画','result':'第一关结算','transition-01-to-02':'第一关到第二关转场','pupil-lesson':'瞳孔科普','lens-palace':'进入晶状体水晶宫','lens-far':'晶状体看远处','game-bg':'追光游戏背景','glasses-flow':'配镜流程动画','glasses-poster':'配镜流程封面'};
const assets={};
function collect(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())collect(p);else{const key=path.relative(root,p).replaceAll('\\','/');if(key.includes('/materials/'))continue;let folder='公共资源/配图';if(key.includes('/transitions/'))folder='02-眼球大冒险/'+(/\.(mp4|vtt)$/.test(key)?'视频':'配图');else if(key.includes('/library/'))folder='03-视界探索站/'+(key.endsWith('.mp4')?'视频':'配图');else if(key.includes('/adventure/'))folder='02-眼球大冒险/配图/地图素材';else if(key.includes('/vision/'))folder='03-视界探索站/配图/探索素材';else if(key.includes('/lenses/'))folder='03-视界探索站/配图/镜片';const ext=path.extname(p),stem=path.basename(p,ext);assets[key]=folder+'/'+(names[stem]||stem)+ext;copy(p,path.join(dest,assets[key]));}}}
collect(path.join(root,'assets'));
const dirs={'assets/images/vision/':'03-视界探索站/配图/探索素材/','assets/images/adventure/':'02-眼球大冒险/配图/地图素材/'};
function transform(s,out,isCSS=false){
  s=s.replaceAll('window.location.pathname',"(document.body.dataset.originalPage || window.location.pathname)");
  for(const [old,to] of Object.entries(assets).sort((a,b)=>b[0].length-a[0].length)){
    s=s.replaceAll('../'+old,rel(out,to));s=s.replaceAll(old,rel(out,to));
  }
  for(const [old,to] of Object.entries(dirs))s=s.replaceAll(old,rel(out,to+'placeholder').replace(/placeholder$/,''));
  // 动态拼接的图名也随中文资源名称调整。
  for(const [old,to] of Object.entries(names))for(const ext of ['.png','.jpg'])s=s.replaceAll("'"+old+ext+"'","'"+to+ext+"'");
  s=s.replace(/(href\s*=\s*["'])([\w-]+\.html)([^"']*)(["'])/g,(all,a,file,tail,q)=>routes[file]?a+rel(out,routes[file])+tail+q:all);
  s=s.replace(/((?:window\.)?location\.(?:replace\(|href\s*=\s*)['"])([\w-]+\.html)/g,(all,a,file)=>routes[file]?a+rel(out,routes[file]):all);
  return s;
}
for(const [old,out] of Object.entries(modules)){
  let html=fs.readFileSync(path.join(root,old),'utf8');const title=path.basename(out,'.html');let count=0;
  html=html.replace('<body','<body data-original-page="'+old+'"');
  html=html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi,(_,css)=>{const filename=title+'样式'+(++count>1?count:'')+'.css';write(path.join(dest,path.dirname(out),filename),transform(css,out));return '<link rel="stylesheet" href="'+filename+'">'});
  count=0;html=html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi,(_,js)=>{const filename=title+'交互'+(++count>1?count:'')+'.js';write(path.join(dest,path.dirname(out),filename),transform(js,out));return '<script src="'+filename+'"></script>'});
  html=html.replace(/css\/style\.css(?:\?[^"']*)?/g,rel(out,'公共资源/代码/公共样式.css')).replace(/js\/main\.js(?:\?[^"']*)?/g,rel(out,'公共资源/代码/公共交互.js'));
  write(path.join(dest,out),transform(html,out));
}
write(path.join(dest,'公共资源/代码/公共样式.css'),transform(fs.readFileSync('css/style.css','utf8'),'公共资源/代码/公共样式.css',true));
// 公共脚本中的媒体地址相对于文档，各页面同为三级目录。
write(path.join(dest,'公共资源/代码/公共交互.js'),transform(fs.readFileSync('js/main.js','utf8'),'任意模块/代码/页面.html'));
for(const folder of ['01-首页','02-眼球大冒险','03-视界探索站','04-天书解码器'])for(const sub of ['代码','配图','视频'])fs.mkdirSync(path.join(dest,folder,sub),{recursive:true});
copy(path.join(root,'图片/首页界面.jpg'),path.join(dest,'01-首页/配图/首页场景参考.jpg'));
copy(path.join(root,'图片'),path.join(root,'项目资料/设计参考图'));
copy(path.join(root,'中小学验光科普解读平台 PRD 1.doc'),path.join(root,'项目资料/需求文档/中小学验光科普平台需求.doc'));
for(const [src,mod] of [['眼球大冒险.jpg','02-眼球大冒险'],['世界探索站.jpg','03-视界探索站'],['天书解码器.jpg','04-天书解码器']])copy(path.join(root,'图片',src),path.join(dest,mod,'配图/页面设计参考.jpg'));
copy(path.join(root,'tools'),path.join(root,'工具/素材处理与整理'));
write(path.join(dest,'迁移清单.json'),JSON.stringify({pages:routes,assets},null,2));
console.log('迁移完成：'+Object.keys(modules).length+'个学习页面，'+Object.keys(assets).length+'个运行素材；已保存完整旧版。');
