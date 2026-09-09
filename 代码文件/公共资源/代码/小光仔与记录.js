(() => {
  'use strict';
  const base = new URL('../../',document.currentScript.src);
  const launcher=document.createElement('button');
  launcher.className='tx-mascot';launcher.type='button';launcher.setAttribute('aria-label','和小光仔聊一聊');
  const portrait=document.createElement('img');portrait.src=new URL('公共资源/配图/小光仔全身.png',base);portrait.alt='小光仔';
  launcher.append(portrait);document.body.append(launcher);
  const panel=document.createElement('dialog');panel.className='tx-profile tx-assistant';panel.setAttribute('aria-labelledby','tx-assistant-title');
  panel.innerHTML='<button type="button" class="tx-close" aria-label="关闭助手">×</button><h2 id="tx-assistant-title">小光仔陪你探索</h2><p class="tx-note">本地助手 · 当前不连接在线AI</p><div class="tx-conversation" role="log" aria-live="polite"></div><div class="tx-suggestions"></div><form><label for="tx-question">你想问什么？</label><input id="tx-question" maxlength="200" required placeholder="例如：怎么保存验光记录？"><button class="tx-save" type="submit">发送</button></form>';
  document.body.append(panel);
  const log=panel.querySelector('.tx-conversation');
  function say(text,who){const p=document.createElement('p');p.className=who==='你'?'tx-speech-user':'tx-speech';p.textContent=who+'：'+text;log.append(p);log.scrollTop=log.scrollHeight;}
  say('点小房子就能开始探索。也可以问我怎么观看视频、返回地图，或保存验光记录。','小光仔');
  const destinations=[['认识眼球','02-眼球大冒险/代码/眼球大冒险.html'],['探索眼镜知识','03-视界探索站/代码/视界探索站.html'],['读懂验光单','04-天书解码器/代码/天书解码器.html']];
  destinations.forEach(([label,path])=>{const a=document.createElement('a');a.textContent=label;a.href=new URL(path,base);panel.querySelector('.tx-suggestions').append(a);});
  launcher.onclick=()=>{panel.showModal();panel.querySelector('input').focus();};panel.querySelector('.tx-close').onclick=()=>panel.close();panel.addEventListener('close',()=>launcher.focus());
  panel.querySelector('form').onsubmit=e=>{e.preventDefault();const field=panel.querySelector('input'),q=field.value.trim();if(!q)return;say(q,'你');field.value='';let answer='这个问题我还不能准确回答。你可以先选择上面的学习入口。联网问答将在后续接入，身体不舒服时请告诉家长。';
    if(/保存|记录|存储/.test(q))answer='在天书解码器填写数值，点击“保存本次记录”。在“我的记录”里可以载入或删除。记录只保存在当前浏览器，清理浏览器数据会丢失；共用设备时记得删除自己的记录。';
    else if(/返回|首页|退出/.test(q))answer='页面左上角的小箭头可以返回首页。看视频时点“返回地图”，就回到建筑地图啦。';
    else if(/视频|播放|声音|静音/.test(q))answer='点击地图上的建筑播放对应视频。“开始探索”从角膜基地出发。播放器里可以暂停、静音，也可以返回地图。';
    else if(/登录|昵称|注册/.test(q))answer='首页右上角可以设置昵称。现在是本机体验，不需要真实姓名、手机或密码，也不会自动上传你的记录。';
    say(answer,'小光仔');};
  if(document.body.dataset.txPage!=='book')return;
  const core=document.querySelector('.decoder-core');if(!core)return;
  const ids=['rx-r-sph','rx-r-cyl','rx-r-axis','rx-l-sph','rx-l-cyl','rx-l-axis'];
  const key='tongxue.decoder.records.v1';
  const bar=document.createElement('div');bar.className='tx-record-bar';bar.innerHTML='<button type="button" class="tx-save">保存本次记录</button><button type="button" class="tx-record-open">我的记录</button><small>仅保存输入的数值，不保存照片。共用设备请注意删除个人记录。</small><p role="status"></p>';core.prepend(bar);
  const recordsDialog=document.createElement('dialog');recordsDialog.className='tx-profile';recordsDialog.setAttribute('aria-label','本机验光记录');recordsDialog.innerHTML='<button type="button" class="tx-close" aria-label="关闭记录">×</button><h2>我的记录</h2><p class="tx-note">本浏览器共享的记录，不是云端账号档案。</p><div class="tx-record-list"></div>';document.body.append(recordsDialog);
  const status=bar.querySelector('[role=status]');
  function read(){const value=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(value))throw Error('records');return value;}
  function show(){const list=recordsDialog.querySelector('.tx-record-list');list.replaceChildren();try{const records=read();if(!records.length)list.textContent='还没有保存的记录。';records.forEach(record=>{const row=document.createElement('div');row.className='tx-record-row';const label=document.createElement('p');label.textContent=record.date+' · 右眼 SPH '+(record.values?.[0]||'未填')+' / 左眼 SPH '+(record.values?.[3]||'未填');const restore=document.createElement('button');restore.textContent='载入';restore.onclick=()=>{ids.forEach((id,i)=>{const el=document.getElementById(id);el.value=record.values[i]||'';el.dispatchEvent(new Event('input',{bubbles:true}));});recordsDialog.close();status.textContent='已载入记录，请点击原有解读按钮查看。';};const remove=document.createElement('button');remove.textContent='删除';remove.onclick=()=>{try{localStorage.setItem(key,JSON.stringify(read().filter(r=>r.id!==record.id)));show();}catch{list.textContent='无法删除，请检查浏览器存储权限。';}};row.append(label,restore,remove);list.append(row);});}catch{list.textContent='无法读取本机记录，请检查浏览器存储权限。';}}
  bar.querySelector('.tx-save').onclick=()=>{const fields=ids.map(id=>document.getElementById(id));if(fields.some(f=>!f.reportValidity()))return;const values=fields.map(f=>f.value.trim());if(!values.some(Boolean)){status.textContent='请先填写至少一项数值。';return;}try{const records=read();if(records.length>=50){status.textContent='已保存50条，请先删除不需要的记录。';return;}records.unshift({id:Date.now()+'-'+Math.random().toString(36).slice(2),date:new Date().toLocaleString('zh-CN'),values});localStorage.setItem(key,JSON.stringify(records));status.textContent='已保存到当前浏览器。';}catch{status.textContent='保存失败，请检查浏览器存储权限。';}};
  bar.querySelector('.tx-record-open').onclick=()=>{show();recordsDialog.showModal();};recordsDialog.querySelector('.tx-close').onclick=()=>recordsDialog.close();recordsDialog.addEventListener('close',()=>bar.querySelector('.tx-record-open').focus());
})();
