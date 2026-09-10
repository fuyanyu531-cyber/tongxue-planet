/* 将原有功能节点移入分步空间，保留节点、事件与数据。 */
(() => {
  const base=new URL('../../',document.currentScript.src);
  function init(){
    const vision=!!document.querySelector('.page-vision');
    const host=vision?document.querySelector('.vs-wrapper'):document.querySelector('.subpage-container');
    if(!host)return;
    const topics=vision?[
      ['近视认知','分清事实与误区','用六个小问题认识近视。','#myopiaZone','03-视界探索站/配图/探索素材/近视认知星球.jpg'],
      ['认识眼镜','看看眼镜有什么不同','认识镜片与眼镜的不同用途。','#glassesPlanet','03-视界探索站/配图/探索素材/眼镜类型星球.jpg'],
      ['配镜之旅','一步一步了解配镜','跟随视频与任务，了解配镜流程。','#missionZone','03-视界探索站/配图/探索素材/配镜流程星球.jpg'],
      ['配镜小助手','整理自己的配镜信息','把配镜信息整理成自己的记录。',null,'03-视界探索站/配图/探索素材/配镜记录星球.jpg']
    ]:[
      ['认识符号','先认识验光单的语言','点一点 R、L、SPH 等符号。','#decoderItemGrid','01-首页/配图/03-天书解码器入口.png'],
      ['试读一张','在模拟单上练习','点击数字，看看每一项在说什么。','#decoderPrescription','01-首页/配图/01-眼球大冒险入口.png'],
      ['解读与记录','带着自己的验光单来','上传或填写，再解读、保存到本机。','.decoder-core','01-首页/配图/03-天书解码器入口.png'],
      ['小侦探挑战','看看自己学会了多少','解开小谜题，巩固符号知识。','#detectiveWrap','01-首页/配图/02-世界探索站入口.png']
    ];
    const nodes=topics.map(t=>{const n=t[3]?document.querySelector(t[3]):null;return n&&!vision&&!n.matches('.decoder-core')?n.closest('.decoder-section'):n;});
    const assistant=document.querySelector('#lensAssistantCard .vs-node-btn');
    const landing=document.createElement('main');landing.className='learn-landing';
    const title=vision?'世界探索站':'天书解码器';
    landing.innerHTML=`<div class="learn-intro"><span class="learn-kicker">${vision?'发现生活中的护眼知识':'从认识符号，到读懂自己的验光单'}</span><h1>${title}</h1><p>${vision?'选择一颗星球，带着好奇心出发。':'第一次来？从「认识符号」开始，已有验光单也可以直接解读。'}</p></div><div class="learn-topics"></div><p class="learn-hint">点击图片进入 · 小光仔一直在右下角陪你</p>`;
    const workspace=document.createElement('section');workspace.className='learn-workspace';workspace.hidden=true;workspace.setAttribute('aria-label',title+'学习面板');
    workspace.innerHTML='<div class="learn-work-head"><button type="button" class="learn-overview">← 返回主题</button><div><small class="learn-step"></small><h2 tabindex="-1"></h2></div><span class="learn-position"></span></div><div class="learn-reading"></div><div class="learn-work-foot"><button type="button" class="learn-prev">上一主题</button><span>按自己的节奏学习</span><button type="button" class="learn-next">下一主题 →</button></div>';
    document.body.append(landing,workspace);
    const reading=workspace.querySelector('.learn-reading');
    nodes.forEach(n=>{if(n){n.hidden=true;n.classList.add('learn-unit');reading.append(n);}});
    if(!vision){const notice=document.querySelector('.decoder-disclaimer');if(notice)nodes[2].append(notice);}
    host.classList.add('learn-legacy');
    // 弹窗仍留在原位置；仅折叠原长页中的主内容。
    [...host.children].forEach(n=>{if(n.matches('#amapScene,.decoder-guide,.decoder-bottom-row'))n.classList.add('learn-legacy-content');});
    document.querySelector('#amapStorySkip')?.click();
    let active=0,trigger=null;
    const cards=[];
    function pause(){document.querySelectorAll('video').forEach(v=>v.pause());}
    function overview(){pause();workspace.hidden=true;landing.hidden=false;history.replaceState(null,'',location.pathname+location.search);trigger?.focus();}
    function open(i){
      if(i<0||i>=topics.length)return;
      if(!nodes[i]){assistant?.click();return;}
      history.replaceState(null,'','#topic-'+(i+1));
      pause();active=i;nodes.forEach((n,j)=>{if(n)n.hidden=i!==j;});landing.hidden=true;workspace.hidden=false;
      workspace.querySelector('h2').textContent=topics[i][0];workspace.querySelector('.learn-step').textContent=topics[i][1];workspace.querySelector('.learn-position').textContent=`${i+1} / ${topics.length}`;
      workspace.querySelector('.learn-prev').disabled=i===0;workspace.querySelector('.learn-next').textContent=i===topics.length-1?'返回主题页':'下一主题 →';reading.scrollTop=0;workspace.querySelector('h2').focus();
    }
    topics.forEach((t,i)=>{const card=document.createElement('button');card.type='button';card.className='learn-topic';card.innerHTML=`<span class="learn-number">0${i+1}</span><img src="${new URL(t[4],base)}" alt=""><h2>${t[0]}</h2><p>${t[2]}</p><span class="learn-enter">${vision?'进入探索':'开始这一步'} →</span>`;card.onclick=()=>{trigger=card;open(i);};landing.querySelector('.learn-topics').append(card);cards.push(card);});
    workspace.querySelector('.learn-overview').onclick=overview;workspace.querySelector('.learn-prev').onclick=()=>open(active-1);workspace.querySelector('.learn-next').onclick=()=>active===topics.length-1?overview():open(active+1);
    // 保留旧模块中前往配镜流程、地图、小助手的入口。
    document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='mzBackBtn')overview();if(b.matches('.vs-explore-gold .vs-explore-btn'))open(2);});
    document.body.classList.add('learn-redesign');
    const initial=/^#topic-([1-4])$/.exec(location.hash);if(initial)open(Number(initial[1])-1);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
