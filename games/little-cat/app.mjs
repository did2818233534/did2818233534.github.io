import {SKINS,CARD,createPet,validatePet,evolve,act,dress,level,encodePixels,decodePixels} from './model.mjs';
const $=id=>document.getElementById(id);
const STORE='little-cat-home-v1';
let pet=createPet(), storageOK=true, catSource='', saveURL='', saveFile=null, pendingImport=null;
let effectTimer=0,toastTimer=0,tickTimer=0,miniTimer=0,mini=null;
let purrTimer=0,purrNodes=null;
let audio=null,sound=false,stream=null,recorder=null,recordTimer=0,recordGeneration=0,voice=null;
try{const raw=localStorage.getItem(STORE);if(raw)pet=evolve(validatePet(JSON.parse(raw)));}catch{storageOK=false;}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(pet));storageOK=true;}catch{storageOK=false;}$('save-status').textContent=storageOK?'本机自动记住 · 照片需手动保存':'浏览器无法保存进度，请手动保存照片';}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
function say(text){$('bubble').textContent=text;}
function applySkin(){const skin=SKINS[pet.skin];for(const key of ['fur','shade','light'])document.documentElement.style.setProperty(`--${key}`,skin[key]);$('cat').classList.toggle('accessory-none',pet.accessory==='none');$('cat').classList.toggle('accessory-leaf-on',pet.accessory==='leaf');}
const needs=[['hunger','♨','饱食度'],['mood','♡','好心情'],['energy','☾','小精力'],['clean','♧','干净值']];
$('needs').innerHTML=needs.map(([key,icon,label])=>`<div class="need" data-key="${key}"><div><span class="need-icon">${icon}</span>${label}<strong id="${key}-value"></strong></div><div class="need-track" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" id="${key}-bar"><i></i></div></div>`).join('');
function render(){
  $('pet-name').textContent=pet.name;$('level').textContent=`Lv. ${level(pet)}`;$('stars').textContent=pet.stars;
  $('pet-description').textContent=level(pet)>2?'最喜欢的地方，是你身边':level(pet)>1?'每天都比昨天，更喜欢你一点':'刚刚认识，已经喜欢你了';
  $('age').textContent=`相伴第 ${Math.max(1,Math.floor((Date.now()-pet.bornAt)/86400000)+1)} 天`;
  for(const [key] of needs){const value=Math.round(pet[key]);$(`${key}-value`).textContent=`${value} / 100`;$(`${key}-bar`).setAttribute('aria-valuenow',String(value));$(`${key}-bar`).firstElementChild.style.width=`${value}%`;}
  const lv=level(pet),base=30*(lv-1)**2,next=30*lv**2;
  $('xp-label').textContent=`${pet.xp-base} / ${next-base}`;$('xp-fill').style.width=`${(pet.xp-base)/(next-base)*100}%`;
  $('growth-copy').textContent=`距离 Lv. ${lv+1} 还差 ${next-pet.xp} 点陪伴`;
  $('room').classList.toggle('sleeping',pet.sleeping);$('sleep').querySelector('strong').textContent=pet.sleeping?'叫醒':'睡觉';$('sleep').querySelector('small').textContent=pet.sleeping?'早安，小猫咪':'做一个好梦';
  if(!mini)$('room-state').textContent=pet.sleeping?'嘘，小猫正在做美梦':({feeding:'正在吃小鱼 · 啊呜啊呜',happy:'正在摸摸 · 呼噜呼噜',washing:'正在洗澡 · 搓出小泡泡',licking:'认真舔舔小爪 · 舒服啦','tail-happy':'小尾巴摇呀摇 · 好开心'}[$('room').dataset.action]||'午后的小小客厅');
  applySkin();
}
function clearAction(){
  clearTimeout(effectTimer);stopPurr();
  $('cat').classList.remove('happy','washing','feeding','talking','playing','licking','tail-happy');
  delete $('room').dataset.action;
  $('effect').className='room-effect';
  document.querySelectorAll('.action-bar button').forEach(b=>b.classList.remove('action-active'));
}
function revealRoom(){
  const room=$('room').getBoundingClientRect();
  if(room.top < -80 || room.bottom > innerHeight+100)$('room').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function effect(kind,symbol){
  clearAction();
  // Flush the reset so repeated taps replay the same animation from the start.
  void $('cat').offsetWidth;
  $('cat').classList.add(kind);$('room').dataset.action=kind;
  const action={feeding:'feed',happy:'pet',washing:'wash'}[kind];
  if(action)document.querySelector(`.action-bar [data-action="${action}"]`).classList.add('action-active');
  $('effect').textContent=symbol;$('effect').classList.add('show');
  if(kind==='washing')$('effect').classList.add('bubbles');
  if(kind==='happy')startPurr();
  effectTimer=setTimeout(()=>{clearAction();render();},3600);
}
function stopPurr(){
  clearTimeout(purrTimer);
  if(purrNodes){for(const node of purrNodes){try{node.stop?.();node.disconnect();}catch{}}purrNodes=null;}
}
function startPurr(){
  if(!sound||!audio||audio.state!=='running')return;
  stopPurr();
  // Soft local synthesis: a low rumble modulated at a cat-like purring rhythm.
  const rumble=audio.createOscillator(),pulse=audio.createOscillator(),depth=audio.createGain(),volume=audio.createGain(),filter=audio.createBiquadFilter();
  rumble.type='triangle';rumble.frequency.value=84;pulse.frequency.value=25;
  depth.gain.value=.025;volume.gain.value=.04;filter.type='lowpass';filter.frequency.value=220;
  pulse.connect(depth);depth.connect(volume.gain);rumble.connect(filter);filter.connect(volume);volume.connect(audio.destination);
  rumble.start();pulse.start();purrNodes=[rumble,pulse,depth,volume,filter];purrTimer=setTimeout(stopPurr,3400);
}
function chime(){if(!sound||!audio||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(640,audio.currentTime);o.frequency.exponentialRampToValueAtTime(880,audio.currentTime+.12);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.21);}
function interact(action){
  if(mini){if(action==='play'){say('点击房间里的毛线球，我来追！');revealRoom();return;}stopPlay();}
  if(action==='play'){startPlay();revealRoom();return;}
  try{pet=act(pet,action);const text={feed:'啊呜！肚子和心里都暖暖的。',pet:'呼噜呼噜，再摸一下嘛。',wash:'洗香香啦！现在是蓬松小猫。',sleep:pet.sleeping?'晚安，要梦见小鱼干。':'睡醒啦！又可以黏着你了。'};say(text[action]);if(action==='sleep'){clearAction();stopRecording(true);stopVoice();}else{effect({feed:'feeding',pet:'happy',wash:'washing'}[action],{feed:'♨',pet:'♡',wash:'◌'}[action]);if(action!=='pet')chime();}persist();render();revealRoom();}catch(e){toast(e.message);}
}
document.querySelectorAll('.action-bar [data-action]').forEach(b=>b.addEventListener('click',()=>interact(b.dataset.action)));document.querySelectorAll('[data-touch]').forEach(button=>button.addEventListener('click',()=>{
  const part=button.dataset.touch;
  if(part==='head'){interact('pet');return;}
  if(pet.sleeping){toast('小猫正睡着，先轻轻叫醒它吧。');return;}
  if(mini)stopPlay();
  pet=act(pet,'pet');
  if(part==='paw'){effect('licking','♡');say('舔舔小爪，今天也是干净小猫。');}
  else{effect('tail-happy','♡');say('是你呀！尾巴都藏不住开心了。');}
  persist();render();revealRoom();
}));
function stopPlay(){clearInterval(miniTimer);mini=null;$('yarn').hidden=true;$('cat').classList.remove('playing');$('cat').style.removeProperty('--chase-x');document.querySelector('.action-bar [data-action=play]').classList.remove('action-active');render();}
function moveYarn(){const room=$('room');$('yarn').style.left=`${15+Math.random()*Math.max(1,room.clientWidth-80)}px`;$('yarn').style.top=`${room.clientHeight*.47+Math.random()*room.clientHeight*.27}px`;$('cat').style.setProperty('--chase-x',`${(parseFloat($('yarn').style.left)/room.clientWidth-.5)*100}px`);}
function startPlay(){
  if(pet.sleeping){toast('先叫醒小猫，再陪它玩吧。');return;}if(pet.energy<10){toast('有点困了，先睡一小会儿吧。');return;}
  clearAction();stopVoice();stopRecording(true);document.querySelector('.action-bar [data-action=play]').classList.add('action-active');mini={caught:0,end:Date.now()+20000};$('cat').classList.add('playing');$('yarn').hidden=false;moveYarn();say('帮我抓住 5 次毛线球！');
  const update=()=>{if(!mini)return;const remaining=Math.max(0,Math.ceil((mini.end-Date.now())/1000));$('room-state').textContent=`追毛线球 ${mini.caught}/5 · 剩余 ${remaining}s`;if(!remaining){stopPlay();say('差一点点，下次再一起玩！');}};update();miniTimer=setInterval(update,250);
}
$('yarn').addEventListener('click',()=>{if(!mini||Date.now()>mini.end)return;mini.caught++;chime();if(mini.caught===5){stopPlay();pet=act(pet,'play');say('抓到啦！和你玩最开心。+4 星星');effect('happy','✦');persist();render();}else{say(`抓到 ${mini.caught} 次啦！再来！`);moveYarn();}});
$('rename').addEventListener('click',()=>{$('name-input').value=pet.name;$('name-input').setCustomValidity('');$('name-dialog').showModal();});
$('name-input').addEventListener('input',()=>$('name-input').setCustomValidity(''));
$('name-form').addEventListener('submit',event=>{event.preventDefault();const name=$('name-input').value.trim();try{pet=validatePet({...pet,name});persist();render();$('name-dialog').close();say(`我叫${pet.name}，要记住我哦。`);}catch(e){$('name-input').setCustomValidity(e.message);$('name-input').reportValidity();}});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
function standaloneCat(skin=pet.skin,accessory=pet.accessory){let s=catSource;for(const key of ['fur','shade','light'])s=s.replaceAll(new RegExp(`var\\(--${key},[^)]+\\)`,'g'),SKINS[skin][key]);return s.replace('</svg>',`<style>.eyes-closed,.mouth-talk,.cat-tongue{display:none}.accessory-leaf{display:${accessory==='leaf'?'block':'none'}}.accessory-scarf{display:${accessory==='scarf'?'block':'none'}}</style></svg>`);}
function svgURL(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
function wardrobe(){
  $('skins').replaceChildren();for(const [key,skin]of Object.entries(SKINS)){const b=document.createElement('button');b.classList.toggle('selected',key===pet.skin);b.setAttribute('aria-pressed',String(key===pet.skin));const img=new Image();img.src=svgURL(standaloneCat(key));img.alt=skin.name;b.append(img,document.createTextNode(skin.name));const small=document.createElement('small');small.textContent=pet.owned.includes(key)?'已拥有':`✦ ${skin.price}`;b.append(small);b.addEventListener('click',()=>{try{pet=dress(pet,key,pet.accessory);persist();render();wardrobe();$('wardrobe-hint').textContent='换好啦，今天也是可爱的一天。';}catch(e){$('wardrobe-hint').textContent=e.message;}});$('skins').append(b);}
  $('accessories').replaceChildren();for(const [key,label]of [['none','素颜小猫'],['scarf','小围巾'],['leaf','叶子帽']]){const b=document.createElement('button');b.textContent=label;b.classList.toggle('selected',pet.accessory===key);b.setAttribute('aria-pressed',String(pet.accessory===key));b.addEventListener('click',()=>{pet=dress(pet,pet.skin,key);persist();render();wardrobe();$('wardrobe-hint').textContent='配饰换好啦！';});$('accessories').append(b);}
}
$('wardrobe').addEventListener('click',()=>{wardrobe();$('wardrobe-hint').textContent=`你有 ${pet.stars} 颗星星。配饰可以随时更换。`;$('wardrobe-dialog').showModal();});
const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('图片无法打开，请选择完整的 PNG 文件。'));img.src=src;});
function roundRect(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
async function createCard(){
  pet=evolve(pet);persist();render();const snapshot=validatePet(pet),now=Date.now();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=CARD.size;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f6f3e8';ctx.fillRect(0,0,512,512);roundRect(ctx,20,20,472,472,25,'#fffdf4');
  ctx.fillStyle='#8e9c78';ctx.font='12px sans-serif';ctx.fillText('LITTLE CAT · 一张照片，一个小家',40,53);
  roundRect(ctx,159,75,194,200,90,'#edf0df');const cat=await loadImage(svgURL(standaloneCat(snapshot.skin,snapshot.accessory)));ctx.drawImage(cat,166,72,180,198);
  ctx.textAlign='center';ctx.fillStyle='#4c5945';ctx.font=`bold ${[...snapshot.name].length>8?22:29}px sans-serif`;ctx.fillText(snapshot.name,256,309);ctx.fillStyle='#949c82';ctx.font='13px sans-serif';ctx.fillText(`Lv. ${level(snapshot)}  ·  ${SKINS[snapshot.skin].name}  ·  ${snapshot.stars} 颗星星`,256,337);
  ctx.font='11px sans-serif';ctx.fillText(`保存于 ${new Date(now).toLocaleString('zh-CN',{hour12:false})}`,256,365);ctx.fillStyle='#a2a58e';ctx.font='10px sans-serif';ctx.fillText('原始 PNG 像素存档 · 含校验码 · 请勿裁剪或压缩',256,398);
  ctx.putImageData(new ImageData(encodePixels(snapshot,now),CARD.width,CARD.height),CARD.x,CARD.y);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('无法生成存档，请重试。');
  // Decode the finished PNG before offering it for download.
  const decoded=await readCard(blob);if(JSON.stringify(decoded.pet)!==JSON.stringify(snapshot))throw Error('存档自检失败，请重试。');
  if(saveURL)URL.revokeObjectURL(saveURL);saveURL=URL.createObjectURL(blob);
  const stamp=new Date(now).toISOString().replace(/[:.]/g,'-');const filename=`小猫存档-${stamp}.png`;
  saveFile=new File([blob],filename,{type:'image/png'});$('save-image').src=saveURL;$('download').href=saveURL;$('download').download=filename;
  $('share').hidden=!(navigator.canShare&&navigator.canShare({files:[saveFile]}));$('save-dialog').showModal();
}
async function readCard(file){
  if(file.size>4*1024*1024)throw Error('图片过大，请选择本游戏生成的原始 PNG 存档。');
  const head=new Uint8Array(await file.slice(0,24).arrayBuffer());const signature=[137,80,78,71,13,10,26,10];
  if(head.length<24||!signature.every((b,i)=>head[i]===b))throw Error('请选择 PNG 原图，JPG 或截图无法恢复。');
  const view=new DataView(head.buffer);if(view.getUint32(16)!==512||view.getUint32(20)!==512)throw Error('存档应为 512 × 512 像素。图片可能被缩放或裁剪了。');
  const url=URL.createObjectURL(file);try{const img=await loadImage(url);const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);return decodePixels(ctx.getImageData(CARD.x,CARD.y,CARD.width,CARD.height).data);}finally{URL.revokeObjectURL(url);}
}
$('save').addEventListener('click',async()=>{if(mini){toast('先完成这局毛线球，再保存吧。');return;}$('save').disabled=true;try{await createCard();}catch(e){toast(e.message);}finally{$('save').disabled=false;}});
$('download').addEventListener('click',()=>{$('save-status').textContent='已请求下载 PNG · 请确认图片已保存';});
$('share').addEventListener('click',async()=>{try{await navigator.share({files:[saveFile],title:'猫咪的PNG存档'});}catch(e){if(e.name!=='AbortError')toast('无法分享，请使用“下载原始 PNG”。');}});
$('import').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;$('import').disabled=true;pendingImport=null;try{const result=await readCard(file);pendingImport=result;$('import-summary').replaceChildren();const name=document.createElement('strong');name.textContent=result.pet.name;const detail=document.createElement('span');detail.textContent=`Lv. ${level(result.pet)} · ${result.pet.stars} 颗星星 · ${SKINS[result.pet.skin].name}`;const date=document.createElement('span');date.textContent=`保存时间：${new Date(result.savedAt).toLocaleString('zh-CN')}`;$('import-summary').append(name,detail,date);$('import-dialog').showModal();}catch(e){toast(e.message);}finally{$('import').disabled=false;}});
$('confirm-import').addEventListener('click',()=>{if(!pendingImport)return;stopPlay();stopRecording(true);stopVoice();pet=validatePet(pendingImport.pet);pet.updatedAt=Math.max(Date.now(),pet.bornAt);pendingImport=null;persist();render();$('import-dialog').close();say('我回来啦！还记得你的温柔。');toast('已从照片恢复猫咪，之后的进度请记得再保存。');});
$('import-dialog').addEventListener('close',()=>{pendingImport=null;});
function stopVoice(){if(voice){try{voice.stop();}catch{}voice=null;}$('cat').classList.remove('talking');}
function stopRecording(discard=false){if(discard)recordGeneration++;clearTimeout(recordTimer);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(track=>track.stop());stream=null;$('record').textContent='按一下说话';$('record').setAttribute('aria-pressed','false');}
function renderSound(){$('sound').setAttribute('aria-pressed',String(sound));$('sound').querySelector('span').textContent=sound?'声音开启':'声音关闭';}
$('sound').addEventListener('click',async()=>{if(sound){sound=false;stopPurr();stopRecording(true);stopVoice();if(audio)await audio.suspend();}else{try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();audio ||= new Audio();await audio.resume();sound=true;}catch{toast('浏览器暂不支持音频，仍可静音照顾小猫。');}}renderSound();});
$('record').addEventListener('click',async()=>{
  if(recorder?.state==='recording'){stopRecording();return;}
  if(!sound){toast('先主动打开右上角声音，再让小猫学你说话。');return;}
  if(pet.sleeping||mini){toast('等小猫醒着、空闲的时候再说话吧。');return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('录音需要支持麦克风的浏览器和 HTTPS 地址；其它养成功能仍可使用。');return;}
  stopVoice();const generation=++recordGeneration;$('record').disabled=true;
  try{
    const media=await navigator.mediaDevices.getUserMedia({audio:true});
    if(generation!==recordGeneration||!sound||document.hidden){media.getTracks().forEach(t=>t.stop());return;}
    stream=media;const chunks=[];const recording=new MediaRecorder(stream);recorder=recording;
    recording.addEventListener('dataavailable',e=>{if(e.data.size)chunks.push(e.data);});
    recording.addEventListener('error',()=>{stopRecording(true);toast('录音没有成功，请重试。');});
    recording.addEventListener('stop',async()=>{
      media.getTracks().forEach(t=>t.stop());if(stream===media)stream=null;
      if(generation!==recordGeneration||!sound||document.hidden)return;
      try{const bytes=await new Blob(chunks,{type:recording.mimeType}).arrayBuffer();const buffer=await audio.decodeAudioData(bytes);if(generation!==recordGeneration||!sound||document.hidden)return;await audio.resume();const source=audio.createBufferSource();source.buffer=buffer;source.playbackRate.value=1.35;source.connect(audio.destination);voice=source;$('cat').classList.add('talking');say('让我学学你！');source.onended=()=>{if(voice===source){voice=null;$('cat').classList.remove('talking');say('嘻嘻，像不像你？');}};source.start();}catch{toast('这段录音没听清，再试一次吧。');}
    });
    recording.start();$('record').textContent='停止并学我说话';$('record').setAttribute('aria-pressed','true');say('我在认真听哦……');recordTimer=setTimeout(()=>stopRecording(),5000);
  }catch(e){stream?.getTracks().forEach(t=>t.stop());stream=null;toast(e.name==='NotAllowedError'?'没有开启麦克风权限；其它互动不受影响。':'暂时无法使用麦克风，请稍后再试。');}finally{$('record').disabled=false;}
});
function startTicks(){clearInterval(tickTimer);tickTimer=setInterval(()=>{if(document.hidden)return;pet=evolve(pet);render();persist();},5000);}
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);if(document.hidden){stopPurr();clearInterval(tickTimer);stopPlay();stopRecording(true);stopVoice();pet=evolve(pet);persist();}else{pet=evolve(pet);render();startTicks();}});
window.addEventListener('pagehide',()=>{stopPurr();clearInterval(tickTimer);clearTimeout(effectTimer);clearTimeout(toastTimer);stopPlay();stopRecording(true);stopVoice();if(audio){audio.close();audio=null;}sound=false;renderSound();persist();});
window.addEventListener('pageshow',()=>{if(!document.hidden)startTicks();});
window.addEventListener('storage',event=>{
  if(event.key!==STORE||!event.newValue)return;
  try{const incoming=evolve(validatePet(JSON.parse(event.newValue)));if(incoming.bornAt!==pet.bornAt||incoming.name!==pet.name||incoming.sleeping){stopPlay();stopRecording(true);stopVoice();}pet=incoming;render();}catch{}
});
try{const response=await fetch('assets/cat.svg?v=4');if(!response.ok)throw Error();catSource=await response.text();$('cat-art').innerHTML=catSource;}catch{$('cat-art').textContent='🐈';toast('猫咪画面加载失败，请刷新页面。');$('save').disabled=true;}
render();if(pet.sleeping)say('呼……小猫正在做美梦。');persist();startTicks();
