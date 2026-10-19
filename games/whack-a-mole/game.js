'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const MODES = {easy: {interval: 1050, life: 1700, label: '慢悠悠'}, normal: {interval: 780, life: 1300, label: '刚刚好'}, hard: {interval: 540, life: 950, label: '手速王'}};
  const DURATION = 60000;
  const STORAGE_KEY = 'little-garden-records-v1';
  let records = {};
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); if (saved && typeof saved === 'object') records = saved; } catch {}
  let mode = 'normal', phase = 'ready', score = 0, combo = 0, maxCombo = 0, hits = 0, attempts = 0;
  let remaining = DURATION, lastFrame = 0, nextSpawn = 0, frame = 0, bannerUntil = 0;
  let soundEnabled = false, audio = null;
  const holes = Array.from({length: 9}, (_, index) => {
    const button = document.createElement('button');
    button.className = 'hole'; button.type = 'button';
    button.setAttribute('aria-label', `第 ${index + 1} 个地洞（按 ${index + 1}）`);
    button.innerHTML = `<span class="mole-window"><img class="mole" src="assets/mole.svg" alt="" draggable="false"></span><span class="key">${index + 1}</span>`;
    button.addEventListener('click', () => strike(index));
    $('board').append(button);
    return {button, kind: null, life: 0, hitTime: 0};
  });
  function best() { return Math.max(0, Number(records[mode]) || 0); }
  function render() {
    $('score').textContent = String(score).padStart(3, '0');
    $('time').textContent = Math.ceil(remaining / 1000);
    $('time-fill').style.width = `${remaining / DURATION * 100}%`;
    $('best').textContent = best();
    $('level').textContent = phase === 'playing' ? `${MODES[mode].label} · ${remaining > 40000 ? '热热身' : remaining > 20000 ? '渐入佳境' : '最后冲刺'}` : phase === 'paused' ? '花园休息中' : '花园已就绪';
  }
  function clearHole(hole) { hole.kind = null; hole.life = 0; hole.hitTime = 0; hole.button.classList.remove('up', 'hit'); hole.button.removeAttribute('data-kind'); }
  function resetBoard() { holes.forEach(clearHole); document.querySelectorAll('.pop').forEach(el => el.remove()); }
  function setDifficultyDisabled(disabled) { document.querySelectorAll('[data-mode]').forEach(b => b.disabled = disabled); }
  function start() {
    if (phase === 'paused') { resume(); return; }
    cancelAnimationFrame(frame); resetBoard();
    score = combo = maxCombo = hits = attempts = 0; remaining = DURATION; nextSpawn = 200; bannerUntil = 0;
    phase = 'playing'; $('overlay').hidden = true; $('welcome').classList.remove('result');
    $('pause').disabled = false; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label','暂停游戏');
    $('combo-banner').classList.remove('visible'); $('status').textContent = '小地鼠出没！点击它们，避开炸弹';
    setDifficultyDisabled(true); render(); lastFrame = performance.now(); frame = requestAnimationFrame(tick);
    $('pause').focus({preventScroll: true});
  }
  function spawn() {
    const available = holes.filter(h => !h.kind && !h.hitTime);
    if (!available.length) return;
    const hole = available[Math.floor(Math.random() * available.length)];
    const roll = Math.random();
    hole.kind = roll < .14 ? 'bomb' : roll < .28 ? 'golden' : 'mole';
    const progress = 1 - remaining / DURATION;
    hole.life = MODES[mode].life * (1 - .3 * progress);
    hole.button.querySelector('img').src = `assets/${hole.kind}.svg`;
    hole.button.dataset.kind = hole.kind;
    hole.button.classList.add('up');
  }
  function tick(now) {
    if (phase !== 'playing') return;
    const delta = now - lastFrame; lastFrame = now; remaining = Math.max(0, remaining - delta);
    if (remaining <= 0) { finish(); return; }
    holes.forEach(h => {
      if (h.hitTime > 0) { h.hitTime -= delta; if (h.hitTime <= 0) clearHole(h); }
      else if (h.kind) { h.life -= delta; if (h.life <= 0) { if (h.kind !== 'bomb') combo = 0; clearHole(h); } }
    });
    nextSpawn -= delta;
    if (nextSpawn <= 0) { spawn(); nextSpawn = MODES[mode].interval * (.85 + Math.random() * .3) * (1 - .3 * (1 - remaining / DURATION)); }
    if (bannerUntil > 0) { bannerUntil -= delta; if (bannerUntil <= 0) $('combo-banner').classList.remove('visible'); }
    render(); frame = requestAnimationFrame(tick);
  }
  function popup(hole, text, negative) {
    const node = document.createElement('span'); node.className = `pop${negative ? ' negative' : ''}`; node.textContent = text;
    hole.button.append(node); node.addEventListener('animationend', () => node.remove(), {once: true});
  }
  function strike(index) {
    if (phase !== 'playing') return;
    const hole = holes[index];
    if (hole.hitTime > 0) return;
    attempts++;
    if (!hole.kind) { combo = 0; popup(hole, '扑空啦', true); $('status').textContent = '没关系，等它探出头再出手'; return; }
    const kind = hole.kind; hole.kind = null; hole.hitTime = 210; hole.button.classList.add('hit');
    if (kind === 'bomb') {
      score = Math.max(0, score - 20); combo = 0; popup(hole, '−20', true); tone('bomb');
      $('status').textContent = '哎呀，是炸弹！下次放它走';
      $('garden').classList.remove('shake'); void $('garden').offsetWidth; $('garden').classList.add('shake');
    } else {
      hits++; combo++; maxCombo = Math.max(maxCombo, combo);
      const bonus = combo % 5 === 0 ? 20 : 0; const gain = (kind === 'golden' ? 30 : 10) + bonus;
      score += gain; popup(hole, `+${gain}`, false); tone(kind);
      $('status').textContent = combo > 1 ? `连续命中 ${combo} 次，保持这个节奏！` : '抓到啦！快乐 +1';
      if (bonus) { $('combo-banner').textContent = `✦ ${combo} 连击！额外 +20`; $('combo-banner').classList.add('visible'); bannerUntil = 1500; }
    }
    render();
  }
  function pause() {
    if (phase !== 'playing') return;
    phase = 'paused'; cancelAnimationFrame(frame); $('overlay').hidden = false; $('welcome').classList.remove('result');
    $('overlay-title').textContent = '花园休息一下'; $('overlay-copy').textContent = '时间停在这里，小地鼠等你回来。';
    $('start').textContent = '继续捉地鼠 ↗'; $('pause').textContent = '▶'; $('pause').setAttribute('aria-label', '继续游戏');
    $('status').textContent = '已暂停，计时与地鼠都会等你'; render();
  }
  function resume() {
    if (phase !== 'paused') return;
    phase = 'playing'; $('overlay').hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label','暂停游戏');
    $('status').textContent = '欢迎回来！继续抓住小快乐'; lastFrame = performance.now(); frame = requestAnimationFrame(tick);
  }
  function finish() {
    phase = 'finished'; cancelAnimationFrame(frame); resetBoard(); remaining = 0;
    const isRecord = score > best();
    if (isRecord) { records[mode] = score; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch {} }
    $('overlay').hidden = false; $('welcome').classList.add('result');
    $('overlay-title').textContent = isRecord ? '新纪录，真有你的！' : '收获了一分钟快乐';
    $('overlay-copy').innerHTML = `<strong class="result-numbers">${score}<small style="font-size:14px"> 分</small></strong><span class="result-details">命中 ${hits} 只 · 最高 ${maxCombo} 连击<br>命中率 ${attempts ? Math.round(hits / attempts * 100) : 0}% · ${MODES[mode].label}</span>`;
    $('start').textContent = '再玩一局 ↗'; $('pause').disabled = true;
    $('combo-banner').classList.remove('visible'); $('status').textContent = '这一分钟的快乐，已收好'; setDifficultyDisabled(false); render();
    $('start').focus({preventScroll: true}); tone('finish');
  }
  // Audio is synthesized locally. No sound is created until the user explicitly enables it.
  function tone(kind) {
    if (!soundEnabled || !audio || audio.state !== 'running') return;
    const notes = kind === 'bomb' ? [130, 90] : kind === 'golden' ? [660, 880, 1100] : kind === 'finish' ? [523, 659, 784, 1047] : [480, 720];
    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      const when = audio.currentTime + index * .065;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, when); gain.gain.linearRampToValueAtTime(.055, when + .008); gain.gain.exponentialRampToValueAtTime(.001, when + .13);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(when); oscillator.stop(when + .15);
    });
  }
  $('sound').addEventListener('click', async () => {
    if (soundEnabled) { soundEnabled = false; if (audio) await audio.suspend(); }
    else {
      try { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) throw new Error('unsupported'); audio ||= new Audio(); await audio.resume(); soundEnabled = true; }
      catch { $('status').textContent = '当前浏览器暂不支持音效，仍可静音游玩'; soundEnabled = false; }
    }
    $('sound').setAttribute('aria-pressed', String(soundEnabled)); $('sound').setAttribute('aria-label', soundEnabled ? '关闭音效' : '开启音效');
    $('sound').innerHTML = `♪ <span>音效${soundEnabled ? '开启' : '关闭'}</span>`;
  });
  $('start').addEventListener('click', start);
  $('pause').addEventListener('click', () => phase === 'playing' ? pause() : resume());
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    if (phase === 'playing' || phase === 'paused') return;
    mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b => { const selected = b === button; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
    $('mode-hint').textContent = mode === 'easy' ? '地鼠多待一会儿，放轻松慢慢玩。' : mode === 'hard' ? '地鼠来去更快，挑战你的反应力。' : '从容开场，随时间逐渐加快。'; render();
  }));
  document.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (/^[1-9]$/.test(event.key) && phase === 'playing') { event.preventDefault(); strike(Number(event.key) - 1); }
    else if (event.code === 'Space' && (phase === 'playing' || phase === 'paused')) { event.preventDefault(); phase === 'playing' ? pause() : resume(); }
    else if (event.key === 'Escape') pause();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => {
    pause(); cancelAnimationFrame(frame);
    if (audio) { audio.close(); audio = null; }
    soundEnabled = false;
    $('sound').setAttribute('aria-pressed', 'false');
    $('sound').setAttribute('aria-label', '开启音效');
    $('sound').innerHTML = '♪ <span>音效关闭</span>';
  });
  render();
})();
