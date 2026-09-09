/* 四个主模块的公共导航与本机体验档案。无远程账号请求。 */
(() => {
  'use strict';
  const base = new URL('../../', document.currentScript.src);
  const pages = [
    ['首页', '01-首页/代码/首页.html', 'home'],
    ['眼球大冒险', '02-眼球大冒险/代码/眼球大冒险.html', 'eye'],
    ['视界探索站', '03-视界探索站/代码/视界探索站.html', 'compass'],
    ['天书解码器', '04-天书解码器/代码/天书解码器.html', 'book']
  ];
  const paths = {home:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',compass:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5 5-3',book:'M12 5v16M12 5C9 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-7-2-10 1',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',back:'M19 12H5m6-6-6 6 6 6'};
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
  const current = pages.findIndex(p => decodeURI(location.pathname).endsWith(p[1]));
  document.body.classList.add('tx-system');
  document.body.dataset.txPage = pages[current]?.[2] || 'home';
  const header = document.createElement('header');
  header.className = 'tx-header';
  header.innerHTML = `<a class="tx-brand" href="${new URL(pages[0][1],base)}"><img src="${new URL('公共资源/配图/瞳学星球标志.jpg',base)}" alt=""><span>瞳学星球<small>发现眼睛里的奇妙世界</small></span></a><nav class="tx-nav" aria-label="主导航">${pages.map((p,i)=>`<a href="${new URL(p[1],base)}" ${i===current?'aria-current="page"':''}>${icon(p[2])}<span>${p[0]}</span></a>`).join('')}</nav><button class="tx-account" type="button">${icon('user')}<span>登录 / 我的</span></button>`;
  document.body.prepend(header);
  header.querySelector('.tx-nav').remove();
  if(current > 0) header.hidden = true;
  if (current > 0) {
    const back = document.createElement('a');
    back.className = 'tx-back'; back.href = new URL(pages[0][1],base);
    back.innerHTML = `${icon('back')}返回首页`;
    header.after(back);
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'tx-profile'; dialog.setAttribute('aria-labelledby','tx-profile-title');
  dialog.innerHTML = '<button type="button" class="tx-close" aria-label="关闭">×</button><h2 id="tx-profile-title">我的探索名片</h2><p>先给自己起一个探险昵称吧。</p><form><label for="tx-nickname">昵称</label><input id="tx-nickname" name="nickname" maxlength="16" required placeholder="例如：小小探索家" autocomplete="off"><p class="tx-note">当前提供本机体验：昵称仅保存在这个浏览器中，暂不支持账号注册或跨设备登录。请勿填写真实姓名或联系方式。</p><p class="tx-feedback" role="status"></p><button class="tx-save" type="submit">保存昵称</button><button class="tx-guest" type="button">以游客继续</button></form>';
  document.body.append(dialog);
  const account = header.querySelector('.tx-account'), input = dialog.querySelector('input');
  const storageKey = 'tongxue.profile.v1';
  let profile = '';
  try { profile = JSON.parse(localStorage.getItem(storageKey) || '{}').nickname || ''; } catch {}
  function paint(){ account.querySelector('span').textContent = profile || '登录 / 我的'; }
  paint();
  account.addEventListener('click',()=>{input.value=profile;dialog.querySelector('.tx-feedback').textContent='';dialog.showModal();input.focus();});
  dialog.querySelector('.tx-close').onclick = ()=>dialog.close();
  dialog.querySelector('.tx-guest').onclick = ()=>dialog.close();
  dialog.addEventListener('close',()=>account.focus());
  dialog.querySelector('form').addEventListener('submit',e=>{
    e.preventDefault(); const name=input.value.trim();
    if(!name){input.setCustomValidity('请输入昵称');input.reportValidity();return;}
    try { localStorage.setItem(storageKey,JSON.stringify({nickname:name}));profile=name;paint();dialog.close(); }
    catch { dialog.querySelector('.tx-feedback').textContent='浏览器未允许保存，仍可选择以游客继续。'; }
  });
  input.addEventListener('input',()=>input.setCustomValidity(''));
  window.addEventListener('pagehide',()=>document.querySelectorAll('video').forEach(v=>v.pause()));
  const extra = document.createElement('script');
  extra.src = new URL('公共资源/代码/小光仔与记录.js',base);
  document.body.append(extra);
})();
