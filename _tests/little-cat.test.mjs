import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPet,validatePet,evolve,act,dress,level,CARD,crc32,encodePixels,decodePixels} from '../games/little-cat/model.mjs';
const now=1770000000000;
test('one opaque pixel payload preserves the complete pet including Unicode and wardrobe',()=>{
  let p=createPet(now);p.name='小团子🐈';p=act(p,'play',now);p.stars=70;p=dress(p,'cloud','leaf');p=act(p,'sleep',now);
  const rgba=encodePixels(p,now+1),out=decodePixels(rgba);
  assert.equal(rgba.length,CARD.width*CARD.height*4);assert.deepEqual(out,{savedAt:now+1,pet:p});
  for(let i=3;i<rgba.length;i+=4)assert.equal(rgba[i],255);
});
test('mixed values survive RGB conversion and CRC has a known reference',()=>{
  assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
  const p=createPet(now);p.name='测试猫🌿';p.xp=65536;p.stars=255;
  assert.deepEqual(decodePixels(encodePixels(p,now)).pet,p);
});
test('changed data, alpha, header, version and length are rejected',()=>{
  for(const [position,value,pattern]of [[100,77,/校验/],[3,0,/像素/],[0,0,/不是猫咪/],[23,0,/像素/]]){
    const data=encodePixels(createPet(now),now);data[position]=value;assert.throws(()=>decodePixels(data),pattern);
  }
  const version=encodePixels(createPet(now),now);version[25]=2;assert.throws(()=>decodePixels(version),/版本/);
  const length=encodePixels(createPet(now),now);length[10]=255;assert.throws(()=>decodePixels(length),/长度/);
  assert.throws(()=>decodePixels(new Uint8Array(10)),/尺寸/);
});
test('care raises relevant needs and play gives progression without exceeding limits',()=>{
  let p=createPet(now);p=act(p,'feed',now);assert.equal(p.hunger,98);p=act(p,'feed',now);assert.equal(p.hunger,100);
  p=act(p,'wash',now);assert.equal(p.clean,100);p=act(p,'pet',now);assert.equal(p.counts.pet,1);
  const prior=p;p=act(p,'play',now);assert.equal(p.energy,prior.energy-10);assert.equal(p.stars,prior.stars+4);assert.ok(level(p)>=2);
  assert.throws(()=>act({...p,energy:2},'play',now),/困/);
});
test('sleep restores energy, blocks other interactions, and offline decay is bounded',()=>{
  const p=act(createPet(now),'sleep',now);const rested=evolve(p,now+600000);assert.equal(rested.energy,100);assert.throws(()=>act(p,'feed',now),/美梦/);
  assert.equal(act(p,'sleep',now).sleeping,false);
  const day=evolve(createPet(now),now+86400000),week=evolve(createPet(now),now+7*86400000);
  for(const k of ['hunger','mood','energy','clean']){assert.equal(day[k],week[k]);assert.ok(day[k]>=0&&day[k]<=100);}
  assert.deepEqual(evolve(createPet(now),now-1000),createPet(now));
});
test('skin purchase is charged once and unowned skins cannot be imported',()=>{
  const p=createPet(now);assert.throws(()=>dress(p,'cocoa','none'),/星星/);
  const bought=dress({...p,stars:50},'cloud','leaf');assert.equal(bought.stars,30);assert.equal(dress(bought,'cloud','scarf').stars,30);
  assert.throws(()=>validatePet({...p,skin:'cocoa'}),/皮肤/);assert.throws(()=>dress(p,'__proto__','none'),/装扮/);
});
test('invalid data types, prototype names, extreme values and invalid dates are rejected',()=>{
  const p=createPet(now);
  for(const bad of [{name:''},{name:'x'.repeat(13)},{name:'猫\n咪'},{hunger:NaN},{mood:101},{xp:-1},{stars:Infinity},{sleeping:'yes'},{skin:'__proto__'},{owned:['cream','constructor']},{updatedAt:now-1},{counts:{feed:0,play:0,pet:0,wash:-1}}])assert.throws(()=>validatePet({...p,...bad}));
  const clean=validatePet({...p,extra:'ignored'});assert.equal(clean.extra,undefined);
});
