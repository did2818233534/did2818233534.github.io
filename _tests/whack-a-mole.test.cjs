// Deterministic logic tests: DOM/clock/audio adapters avoid opening a desktop window or emitting sound.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../games/whack-a-mole/game.js'), 'utf8');
function setup({storageBlocked = false} = {}) {
  const elements = new Map(), listeners = {}, frames = new Map(), saved = {};
  let now = 0, serial = 0, random = .5, audioCreated = 0, tones = 0;
  class Element {
    constructor() { this.events = {}; this.dataset = {}; this.attrs = {}; this.children = []; this.style = {}; this.textContent = ''; this.disabled = false; this.hidden = false; this.tagName = 'BUTTON'; const values = new Set(); this.classList = {add: (...v) => v.forEach(x=>values.add(x)), remove: (...v) => v.forEach(x=>values.delete(x)), contains: v=>values.has(v), toggle: (v,on) => on ? values.add(v) : values.delete(v)}; }
    addEventListener(type, fn) { this.events[type] = fn; }
    setAttribute(k,v) { this.attrs[k] = v; }
    removeAttribute(k) { delete this.attrs[k]; if(k === 'data-kind') delete this.dataset.kind; }
    append(child) { this.children.push(child); child.parent = this; }
    remove() { if(this.parent) this.parent.children = this.parent.children.filter(c=>c!==this); }
    querySelector() { return this.img ||= {}; }
    focus() {}
    click() { if(!this.disabled) return this.events.click?.(); }
  }
  const $ = id => { if(!elements.has(id)) elements.set(id,new Element()); return elements.get(id); };
  const modes = ['easy','normal','hard'].map(mode=> {const e = new Element(); e.dataset.mode = mode; return e;});
  const document = {hidden:false, getElementById:$, createElement:()=>new Element(), addEventListener:(type,fn)=>listeners[type]=fn, querySelectorAll:selector=>selector==='[data-mode]'?modes:[]};
  const AudioContext = class {
    constructor(){audioCreated++;this.state='suspended';this.currentTime=0;this.destination={};}
    async resume(){this.state='running';} async suspend(){this.state='suspended';} close(){this.state='closed';}
    createOscillator(){return {frequency:{},connect(){},start(){tones++;},stop(){}};}
    createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
  };
  vm.runInNewContext(source, {document, window:{AudioContext,addEventListener:(type,fn)=>listeners[type]=fn}, performance:{now:()=>now}, requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;}, cancelAnimationFrame:id=>frames.delete(id), localStorage:{getItem:k=>{if(storageBlocked)throw Error('blocked');return saved[k]||null;},setItem:(k,v)=>{if(storageBlocked)throw Error('blocked');saved[k]=v;}}, Math:Object.assign(Object.create(Math),{random:()=>random})});
  const advance = ms => {for(let elapsed=0;elapsed<ms;elapsed+=10){now+=10;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
  const hitNext = (kind='mole') => {random = kind==='bomb'?.05:kind==='golden'?.2:.5;for(let i=0;i<250;i++){const hole=$('board').children.find(h=>h.dataset.kind===kind&&h.classList.contains('up')&&!h.classList.contains('hit'));if(hole){hole.click();return hole;}advance(10);}throw Error(`No ${kind} spawned`);};
  return {$,modes,document,listeners,advance,hitNext,saved,frames,get audioCreated(){return audioCreated;},get tones(){return tones;}};
}
test('normal/golden/bomb scoring, five-hit bonus, repeated hit guard and score floor',()=>{
  const g=setup(); g.$('start').click();
  const first=g.hitNext(); assert.equal(g.$('score').textContent,'010'); first.click(); assert.equal(g.$('score').textContent,'010');
  for(let n=0;n<4;n++)g.hitNext(); assert.equal(g.$('score').textContent,'070');
  assert.match(g.$('combo-banner').textContent,/5 连击/);
  g.hitNext('golden'); assert.equal(g.$('score').textContent,'100');
  g.hitNext('bomb'); assert.equal(g.$('score').textContent,'080');
  for(let n=0;n<5;n++)g.hitNext('bomb'); assert.equal(g.$('score').textContent,'000');
  assert.equal(g.audioCreated,0); assert.equal(g.tones,0);
});
test('pause freezes time, resume continues, background visibility pauses',()=>{
  const g=setup();g.$('start').click();g.advance(4000);g.$('pause').click();const time=g.$('time').textContent;
  g.advance(8000);assert.equal(g.$('time').textContent,time);assert.equal(g.frames.size,0);
  g.$('start').click();g.advance(2000);assert.equal(Number(g.$('time').textContent),Number(time)-2);
  g.document.hidden=true;g.listeners.visibilitychange();assert.equal(g.$('overlay').hidden,false);assert.equal(g.frames.size,0);
});
test('round finishes, persists per-mode record and restarts cleanly',()=>{
  const g=setup();g.$('start').click();g.hitNext();g.advance(61000);
  assert.equal(g.$('time').textContent,0);assert.equal(g.$('best').textContent,10);assert.equal(g.$('overlay').hidden,false);assert.equal(g.frames.size,0);
  assert.equal(JSON.parse(Object.values(g.saved)[0]).normal,10);
  g.modes[0].click();assert.equal(g.$('best').textContent,0);g.$('start').click();assert.equal(g.$('score').textContent,'000');assert.equal(g.$('time').textContent,60);
});
test('storage errors do not break a round and audio requires explicit opt-in',async()=>{
  const g=setup({storageBlocked:true});g.$('start').click();g.hitNext();assert.equal(g.audioCreated,0);
  await g.$('sound').click();assert.equal(g.audioCreated,1);g.hitNext();assert.ok(g.tones>0);
  await g.$('sound').click();const tones=g.tones;g.hitNext();assert.equal(g.tones,tones);assert.equal(g.$('sound').attrs['aria-pressed'],'false');
  g.advance(61000);assert.equal(g.$('best').textContent,30);
});
test('keyboard input scores, repeat keys ignored, space toggles pause',()=>{
  const g=setup();g.$('start').click();g.advance(210);
  const key={key:'5',code:'Digit5',target:{tagName:'BODY'},preventDefault(){}};g.listeners.keydown({...key,repeat:true});assert.equal(g.$('score').textContent,'000');
  g.listeners.keydown(key);assert.equal(g.$('score').textContent,'010');g.listeners.keydown({...key,key:' ',code:'Space'});assert.equal(g.$('overlay').hidden,false);
  g.listeners.keydown({...key,key:' ',code:'Space'});assert.equal(g.$('overlay').hidden,true);
});
