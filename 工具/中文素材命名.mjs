// 批量机械命名：同时改文件名及代码、迁移清单中的引用。
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('代码文件');
const names={'avatar-frame':'头像边框','card-blue':'蓝色知识卡','card-cyan':'青色知识卡','card-green':'绿色知识卡','card-orange':'橙色知识卡','card-purple':'紫色知识卡','dialog':'角色对话框','energy-bar':'探索进度条','flask':'实验烧瓶','gamepad':'游戏手柄','grass':'草地','ice':'冰块','island-care':'护眼小岛','island-life':'生活习惯小岛','island-rumor':'误区辨别小岛','island-vision-full':'视界完整小岛','island-vision':'视界小岛','moss':'苔藓','play-btn':'播放按钮','pond':'池塘','rock':'石头','treasure':'奖励宝箱','tree-big':'大树','tree-small':'小树','waterfall':'瀑布'};
for(let i=1;i<=5;i++)names['num-0'+i]='章节编号0'+i;
function walk(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory()){walk(p);continue;}if(/\.(js|html|css|json|md)$/.test(p)){let s=fs.readFileSync(p,'utf8');for(const [a,b] of Object.entries(names))s=s.replaceAll(a+'.png',b+'.png');fs.writeFileSync(p,s);}else if(d.name.endsWith('.png')){const base=path.basename(p,'.png');if(names[base]){const target=path.join(dir,names[base]+'.png');if(fs.existsSync(target))throw Error('目标已存在');fs.renameSync(p,target);}}}}
walk(root);console.log('配图名称及代码引用已同步。');
