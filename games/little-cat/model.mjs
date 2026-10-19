export const SKINS = {
  cream: {name:'奶油橘',price:0,fur:'#e9bd8c',shade:'#d49766',light:'#fff0d4'},
  cloud: {name:'云朵灰',price:20,fur:'#bac7ca',shade:'#889fa9',light:'#f3f4e9'},
  cocoa: {name:'可可棕',price:35,fur:'#ae8876',shade:'#805d52',light:'#ead6bd'}
};
export const clamp = n => Math.max(0,Math.min(100,n));
export const level = pet => Math.floor(Math.sqrt(pet.xp / 30)) + 1;
export function createPet(now=Date.now()) {
  return {name:'米粒',bornAt:now,updatedAt:now,hunger:76,mood:82,energy:78,clean:85,xp:0,stars:12,skin:'cream',owned:['cream'],accessory:'scarf',sleeping:false,counts:{feed:0,pet:0,wash:0,play:0}};
}
export function validatePet(pet) {
  if(!pet || typeof pet!=='object' || Array.isArray(pet)) throw Error('存档中没有有效的猫咪资料。');
  if(typeof pet.name!=='string'||[...pet.name].length<1||[...pet.name].length>12||/[\x00-\x1f\x7f]/.test(pet.name)) throw Error('猫咪名字不符合要求。');
  for(const key of ['hunger','mood','energy','clean']) if(!Number.isFinite(pet[key])||pet[key]<0||pet[key]>100) throw Error('存档中的状态数值无效。');
  for(const key of ['xp','stars']) if(!Number.isSafeInteger(pet[key])||pet[key]<0||pet[key]>100000000) throw Error('存档中的成长数值无效。');
  for(const key of ['bornAt','updatedAt']) if(!Number.isSafeInteger(pet[key])||pet[key]<0||pet[key]>8640000000000000) throw Error('存档中的日期无效。');
  if(pet.bornAt>pet.updatedAt) throw Error('存档日期顺序错误。');
  if(!Object.hasOwn(SKINS,pet.skin)||!Array.isArray(pet.owned)||!pet.owned.length||pet.owned.length>3||pet.owned.some(k=>!Object.hasOwn(SKINS,k))||!pet.owned.includes(pet.skin)) throw Error('存档中的皮肤配置无效。');
  if(!['none','scarf','leaf'].includes(pet.accessory)||typeof pet.sleeping!=='boolean') throw Error('存档中的装扮或休息状态无效。');
  for(const key of ['feed','pet','wash','play']) if(!Number.isSafeInteger(pet.counts?.[key])||pet.counts[key]<0||pet.counts[key]>100000000) throw Error('存档中的互动记录无效。');
  return {name:pet.name,bornAt:pet.bornAt,updatedAt:pet.updatedAt,hunger:pet.hunger,mood:pet.mood,energy:pet.energy,clean:pet.clean,xp:pet.xp,stars:pet.stars,skin:pet.skin,owned:[...new Set(pet.owned)],accessory:pet.accessory,sleeping:pet.sleeping,counts:{feed:pet.counts.feed,pet:pet.counts.pet,wash:pet.counts.wash,play:pet.counts.play}};
}
export function evolve(pet,now=Date.now()) {
  const p=validatePet(pet);
  const minutes=Math.max(0,Math.min(480,(now-p.updatedAt)/60000));
  p.hunger=clamp(p.hunger-minutes*(p.sleeping?.22:.55));
  p.mood=clamp(p.mood-minutes*.18);
  p.clean=clamp(p.clean-minutes*.12);
  p.energy=clamp(p.energy+minutes*(p.sleeping?7:-.32));
  p.updatedAt=Math.max(p.updatedAt,now);
  return p;
}
export function act(pet,action,now=Date.now()) {
  const p=evolve(pet,now);
  if(action==='sleep'){p.sleeping=!p.sleeping;return p;}
  if(p.sleeping) throw Error('它正在做美梦，先叫醒它再玩吧。');
  const effects={feed:{hunger:22,mood:3,xp:8,stars:1},pet:{mood:7,xp:3,stars:0},wash:{clean:30,mood:3,xp:8,stars:1},play:{mood:22,energy:-10,clean:-5,xp:15,stars:4}};
  const effect=effects[action]; if(!effect) throw Error('不认识这个互动。');
  if(action==='play'&&p.energy<10) throw Error('有点困了，先睡一小会儿再玩吧。');
  for(const key of ['hunger','mood','energy','clean']) if(effect[key])p[key]=clamp(p[key]+effect[key]);
  p.xp+=effect.xp;p.stars+=effect.stars;p.counts[action]++;
  return validatePet(p);
}
export function dress(pet,skin,accessory) {
  const p=validatePet(pet);
  if(!Object.hasOwn(SKINS,skin)||!['none','scarf','leaf'].includes(accessory))throw Error('找不到这套装扮。');
  if(!p.owned.includes(skin)){
    if(p.stars<SKINS[skin].price)throw Error(`还需要 ${SKINS[skin].price-p.stars} 颗星星，多陪它玩一会儿吧。`);
    p.stars-=SKINS[skin].price;p.owned.push(skin);
  }
  p.skin=skin;p.accessory=accessory;return p;
}
// 512×512 card; data is stored in opaque RGB pixels in the bottom band.
export const CARD={size:512,x:32,y:416,width:448,height:64};
const MAGIC=new TextEncoder().encode('MEOWPNG1');
const HEADER=20, CAPACITY=CARD.width*CARD.height*3;
export function crc32(bytes) {
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
export function encodePixels(pet,savedAt=Date.now()) {
  const payload=new TextEncoder().encode(JSON.stringify({format:'little-cat',version:1,savedAt,pet:validatePet(pet)}));
  if(payload.length>CAPACITY-HEADER)throw Error('存档超过图片容量。');
  const bytes=new Uint8Array(CAPACITY),view=new DataView(bytes.buffer);
  bytes.set(MAGIC);view.setUint32(8,payload.length);view.setUint32(12,crc32(payload));view.setUint32(16,1);bytes.set(payload,HEADER);
  // Fill unused pixels with a calm cream tint, without encoding in alpha.
  for(let i=HEADER+payload.length;i<CAPACITY;i++)bytes[i]=[239,232,215][i%3];
  const rgba=new Uint8ClampedArray(CARD.width*CARD.height*4);
  for(let i=0,j=0;i<bytes.length;i+=3,j+=4){rgba[j]=bytes[i];rgba[j+1]=bytes[i+1];rgba[j+2]=bytes[i+2];rgba[j+3]=255;}
  return rgba;
}
export function decodePixels(rgba) {
  if(rgba.length!==CARD.width*CARD.height*4)throw Error('图片尺寸不正确，请选择原始 PNG 存档。');
  const bytes=new Uint8Array(CAPACITY);
  for(let i=0,j=0;i<rgba.length;i+=4,j+=3){if(rgba[i+3]!==255)throw Error('存档像素已改变，请使用未编辑的原图。');bytes[j]=rgba[i];bytes[j+1]=rgba[i+1];bytes[j+2]=rgba[i+2];}
  if(!MAGIC.every((b,i)=>bytes[i]===b))throw Error('这不是猫咪存档卡，或图片已被压缩、裁剪。');
  const view=new DataView(bytes.buffer),length=view.getUint32(8);
  if(view.getUint32(16)!==1)throw Error('此存档版本暂不支持。');
  if(length<2||length>CAPACITY-HEADER)throw Error('存档长度无效。');
  const payload=bytes.slice(HEADER,HEADER+length);
  if(crc32(payload)!==view.getUint32(12))throw Error('图片数据校验失败，请选择未压缩、未编辑的原始 PNG。');
  let data;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(payload));}catch{throw Error('无法读取存档数据。');}
  if(data.format!=='little-cat'||data.version!==1||!Number.isSafeInteger(data.savedAt)||data.savedAt<0||data.savedAt>8640000000000000)throw Error('存档格式无效。');
  return {savedAt:data.savedAt,pet:validatePet(data.pet)};
}
