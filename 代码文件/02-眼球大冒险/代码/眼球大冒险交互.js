(() => {
  'use strict';
  const config=window.EYE_VIDEO_CONFIG;
  const chapters=config.chapters;
  const $=id=>document.getElementById(id);
  const dialog=$('playerDialog'), video=$('video');
  let current=0, session=0, lastTrigger=null;
  function message(title,body,retry=false){$('messageTitle').textContent=title;$('messageText').textContent=body;$('message').hidden=false;$('retry').hidden=!retry;}
  function sync(){ $('mute').textContent=video.muted?'取消静音':'静音';$('mute').setAttribute('aria-pressed',String(video.muted));$('playPause').textContent=video.paused?'播放':'暂停'; }
  function reset(){session++;video.pause();video.removeAttribute('src');video.removeAttribute('poster');video.replaceChildren();video.load();$('next').hidden=true;}
  async function play(){const token=session;try{await video.play();if(token===session&&dialog.open)$('message').hidden=true;}catch(error){if(token!==session||!dialog.open)return;message('点击播放视频','浏览器需要你点击后才能播放声音。',true);}sync();}
  function open(index,trigger){reset();current=index;lastTrigger=trigger||lastTrigger;const chapter=chapters[index];$('videoTitle').textContent=chapter.id+' · '+chapter.title;if(!dialog.open)dialog.showModal();$('back').focus();video.muted=false;video.volume=1;video.defaultMuted=false;const ready=Boolean(chapter.src);$('playPause').disabled=!ready;$('mute').disabled=!ready;sync();if(!ready){message('这一站的视频准备中','先返回地图，看看其他站点吧。');return;}if(chapter.poster)video.poster=chapter.poster;if(chapter.captions){const track=document.createElement('track');track.kind='subtitles';track.srclang='zh';track.label='中文字幕';track.src=chapter.captions;track.default=true;video.append(track);}message('视频加载中','马上开始……');video.src=chapter.src;play();}
  chapters.forEach((chapter,index)=>{const button=document.createElement('button');button.type='button';button.className='station';button.setAttribute('aria-label',`进入第${chapter.id}站：${chapter.title}`);const island=document.createElement('span');island.className='island-art';island.setAttribute('aria-hidden','true');const label=document.createElement('span');label.className='station-label';const number=document.createElement('b');number.textContent=chapter.id;const text=document.createElement('span');const title=document.createElement('strong');title.textContent=chapter.title;const status=document.createElement('small');status.className='status';status.textContent=chapter.src?'点击进入':'待开放';text.append(title,status);label.append(number,text);button.append(island,label);button.addEventListener('click',()=>open(index,button));$('stations').append(button);});
  if(config.mapImage){$('mapArtwork').src=config.mapImage;$('mapArtwork').hidden=false;$('map').classList.add('has-art');$('mapArtwork').addEventListener('error',()=>{$('mapArtwork').hidden=true;$('map').classList.remove('has-art');});}
  $('start').addEventListener('click',()=>open(0,$('start')));
  $('back').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{reset();lastTrigger?.focus();});
  $('mute').addEventListener('click',()=>{video.muted=!video.muted;sync();});
  $('playPause').addEventListener('click',()=>{if(video.paused)play();else video.pause();});
  $('retry').addEventListener('click',()=>{if(video.error){open(current);}else play();});
  $('next').addEventListener('click',()=>{if(current+1<chapters.length)open(current+1);else dialog.close();});
  video.addEventListener('play',sync);video.addEventListener('pause',sync);video.addEventListener('volumechange',sync);
  video.addEventListener('playing',()=>{if(dialog.open)$('message').hidden=true;});
  video.addEventListener('ended',()=>{if(!dialog.open)return;message('这一站看完啦','可以返回地图，或者继续下一站。');$('next').textContent=current+1<chapters.length?'下一站 →':'返回地图';$('next').hidden=false;sync();});
  video.addEventListener('error',()=>{if(!dialog.open||!video.getAttribute('src'))return;message('暂时无法播放','视频可能还没放好，或格式暂不支持。你可以重试，也可以返回地图。',true);$('retry').textContent='重试播放';});
  window.addEventListener('pagehide',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
})();
