'use strict';
// Audio sintetizado con WebAudio: música chiptune original con influencias de
// merengue (güira y tambora) y bachata (arpegios de guitarra), y efectos de sonido.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const S = (VO.Audio = { ctx: null, music: null, musicVol: 0.5, sfxVol: 0.7, track: null, step: 0, timer: null, rain: null });
  function ctx() {
    if (!S.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      S.ctx = new AC();
      S.mGain = S.ctx.createGain(); S.mGain.gain.value = S.musicVol * 0.35; S.mGain.connect(S.ctx.destination);
      S.sGain = S.ctx.createGain(); S.sGain.gain.value = S.sfxVol * 0.5; S.sGain.connect(S.ctx.destination);
      const len = S.ctx.sampleRate * 0.5; S.noise = S.ctx.createBuffer(1, len, S.ctx.sampleRate);
      const d = S.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (S.ctx.state === 'suspended') S.ctx.resume();
    return S.ctx;
  }
  S.unlock = () => ctx();
  S.setVolumes = function (m, s) { S.musicVol = m; S.sfxVol = s; if (S.ctx) { S.mGain.gain.value = m * 0.35; S.sGain.gain.value = s * 0.5; } };
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function tone(dest, f, t, dur, type, vol, slide) {
    const c = S.ctx; const o = c.createOscillator(); const g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dest, t, dur, vol, hp) {
    const c = S.ctx; const s = c.createBufferSource(); s.buffer = S.noise;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 4000;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
  }

  // ---------- Pistas ----------
  // Cada pista: tempo, acordes (raíz midi + tipo), patrón por estilo
  const TRACKS = {
    farm: { bpm: 118, style: 'bachata', chords: [[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']], lead: [0, 3, 5, 7, 5, 3, 0, -2] },
    town: { bpm: 138, style: 'merengue', chords: [[48, 'M'], [53, 'M'], [55, 'M'], [48, 'M']], lead: [0, 4, 7, 9, 7, 4, 2, 0] },
    mine: { bpm: 80, style: 'ambient', chords: [[45, 'm'], [41, 'M'], [43, 'M'], [40, 'm']], lead: [0, 3, 7, 10] },
    night: { bpm: 72, style: 'ambient', chords: [[50, 'm'], [46, 'M'], [43, 'M'], [45, 'm']], lead: [0, 7, 3, 10] },
    home: { bpm: 96, style: 'bachata', chords: [[53, 'M'], [50, 'm'], [46, 'M'], [48, 'M']], lead: [4, 2, 0, 2, 4, 7, 4, 2] },
    fiesta: { bpm: 150, style: 'merengue', chords: [[50, 'M'], [55, 'M'], [57, 'M'], [50, 'M']], lead: [0, 2, 4, 7, 9, 7, 4, 2] },
    farm2: { bpm: 104, style: 'bachata', chords: [[50, 'm'], [55, 'M'], [48, 'M'], [53, 'M']], lead: [7, 5, 3, 2, 0, 2, 3, 5] },
    gallery: { bpm: 66, style: 'drips', chords: [[40, 'm'], [43, 'M'], [38, 'M'], [45, 'm']], lead: [0, 7, 12, 3] },
    title: { bpm: 104, style: 'bachata', chords: [[48, 'M'], [57, 'm'], [53, 'M'], [55, 'M']], lead: [7, 4, 0, 4, 7, 9, 7, 4] },
  };
  const triad = (root, q) => [root, root + (q === 'm' ? 3 : 4), root + 7];

  function scheduleStep(tr, st, t, spb) {
    const bar = Math.floor(st / 16) % tr.chords.length; const s = st % 16;
    const [root, q] = tr.chords[bar]; const ch = triad(root, q); const d = S.mGain;
    const sx = spb / 4; // semicorchea
    if (tr.style === 'merengue') {
      // güira: semicorcheas con acento
      noise(d, t, 0.04, s % 2 === 0 ? 0.12 : 0.06, 6000);
      // tambora: golpes en 1, 3 y "ta-ca" al final
      if (s === 0 || s === 8) tone(d, 70, t, 0.18, 'sine', 0.5, 0.6);
      if (s === 13 || s === 14) tone(d, 110, t, 0.08, 'triangle', 0.25, 0.7);
      // bajo
      if (s % 4 === 0) tone(d, midi(root - 12 + (s === 8 ? 7 : 0)), t, sx * 3, 'triangle', 0.32);
      // acordes de acordeón (piano chiptune)
      if (s % 4 === 2) ch.forEach((n) => tone(d, midi(n + 12), t, sx * 1.5, 'square', 0.04));
      if (tr === TRACKS.fiesta) { if (s === 4 || s === 12) noise(d, t, 0.08, 0.1, 1800); if (s % 8 === 6) tone(d, midi(root + 31), t, sx * 2, 'sawtooth', 0.025); }
      // melodía
      if (s % 2 === 0) { const n = tr.lead[(st / 2 + bar * 3) % tr.lead.length]; if ((st * 7) % 5 !== 0) tone(d, midi(root + 24 + n), t, sx * 1.8, 'square', 0.05); }
    } else if (tr.style === 'bachata') {
      // güira suave y bongó
      if (s % 2 === 0) noise(d, t, 0.03, 0.05, 7000);
      if (s === 6 || s === 14) tone(d, 220, t, 0.07, 'sine', 0.18, 0.8);
      if (s === 4 || s === 12) tone(d, 160, t, 0.08, 'sine', 0.15, 0.8);
      if (s === 0 || s === 8) tone(d, midi(root - 12), t, spb * 0.9, 'triangle', 0.3);
      // requinto: arpegio de guitarra punteada
      const arp = [0, 1, 2, 1, 2, 0, 1, 2];
      if (s % 2 === 0) tone(d, midi(ch[arp[(s / 2) % 8]] + 12), t, sx * 2.5, 'triangle', 0.12);
      if (s === 15) tone(d, midi(ch[2] + 24), t, sx, 'square', 0.03);
      if (s % 8 === 3) { const n = tr.lead[(st / 8 + bar) % tr.lead.length | 0]; tone(d, midi(root + 24 + n), t, sx * 3, 'square', 0.035); }
    } else if (tr.style === 'drips') {
      if (s === 0) ch.forEach((n) => tone(d, midi(n - 12), t, spb * 3.9, 'sine', 0.06));
      if (VO.hash(st, 7, 2) < 0.12) tone(d, midi(root + 36 + [0, 3, 7, 10][st % 4]), t, 0.25, 'sine', 0.05, 0.6);
      if (s % 8 === 4 && VO.hash(st, 3, 1) < 0.5) tone(d, midi(root + 12 + tr.lead[(st / 8 | 0) % 4]), t, spb * 2, 'triangle', 0.04);
    } else {
      if (s === 0) ch.forEach((n) => tone(d, midi(n), t, spb * 3.8, 'sine', 0.07));
      if (s % 4 === 0) { const n = tr.lead[((st / 4) | 0) % tr.lead.length]; if (VO.hash(st, bar, 3) < 0.6) tone(d, midi(root + 12 + n), t, spb * 1.5, 'triangle', 0.06); }
      if (s === 10 && VO.hash(st, 1, 1) < 0.3) tone(d, midi(root + 31), t, 0.6, 'sine', 0.03);
    }
  }
  S.play = function (name) {
    if (S.track === name) return;
    S.track = name;
    if (S.timer) clearInterval(S.timer), (S.timer = null);
    if (!name || !ctx()) return;
    const tr = TRACKS[name]; if (!tr) return;
    const spb = 60 / tr.bpm; const sx = spb / 4;
    let next = S.ctx.currentTime + 0.1; S.step = 0;
    S.timer = setInterval(() => {
      if (!S.ctx || S.musicVol <= 0.001) { next = S.ctx ? S.ctx.currentTime + 0.1 : 0; return; }
      while (next < S.ctx.currentTime + 0.25) { scheduleStep(tr, S.step, next, spb); next += sx; S.step++; }
    }, 60);
  };

  // ---------- Efectos ----------
  const SFX = {
    step: (t, d) => noise(d, t, 0.03, 0.05, 1500),
    chop: (t, d) => { tone(d, 180, t, 0.1, 'square', 0.18, 0.5); noise(d, t, 0.08, 0.15, 1200); },
    pick: (t, d) => { tone(d, 900, t, 0.06, 'square', 0.12, 0.6); noise(d, t, 0.05, 0.15, 3000); },
    dig: (t, d) => noise(d, t, 0.12, 0.2, 600),
    water: (t, d) => { for (let i = 0; i < 4; i++) tone(d, 900 + i * 180, t + i * 0.03, 0.06, 'sine', 0.06, 1.4); },
    pop: (t, d) => tone(d, 520, t, 0.08, 'square', 0.1, 1.8),
    collect: (t, d) => { tone(d, 660, t, 0.07, 'square', 0.08); tone(d, 990, t + 0.06, 0.09, 'square', 0.08); },
    buy: (t, d) => { tone(d, 1320, t, 0.06, 'square', 0.08); tone(d, 1760, t + 0.07, 0.12, 'square', 0.08); },
    sell: (t, d) => { [880, 1100, 1320].forEach((f, i) => tone(d, f, t + i * 0.05, 0.08, 'triangle', 0.12)); },
    craft: (t, d) => { tone(d, 300, t, 0.05, 'square', 0.1); tone(d, 300, t + 0.1, 0.05, 'square', 0.1); tone(d, 600, t + 0.2, 0.12, 'triangle', 0.12); },
    menu: (t, d) => tone(d, 740, t, 0.04, 'square', 0.05),
    open: (t, d) => { tone(d, 400, t, 0.06, 'triangle', 0.1); tone(d, 600, t + 0.05, 0.08, 'triangle', 0.1); },
    close: (t, d) => { tone(d, 600, t, 0.06, 'triangle', 0.08); tone(d, 400, t + 0.05, 0.08, 'triangle', 0.08); },
    error: (t, d) => tone(d, 160, t, 0.18, 'square', 0.1, 0.8),
    good: (t, d) => { [523, 659, 784, 1046].forEach((f, i) => tone(d, f, t + i * 0.08, 0.15, 'triangle', 0.13)); },
    cast: (t, d) => { noise(d, t, 0.25, 0.1, 2500); tone(d, 1200, t, 0.25, 'sine', 0.04, 0.3); },
    splash: (t, d) => noise(d, t, 0.3, 0.2, 800),
    bite: (t, d) => { tone(d, 1400, t, 0.05, 'square', 0.1); tone(d, 1400, t + 0.09, 0.05, 'square', 0.1); },
    hit: (t, d) => tone(d, 1000, t, 0.05, 'triangle', 0.12, 1.3),
    miss: (t, d) => tone(d, 220, t, 0.12, 'sawtooth', 0.06, 0.7),
    talk: (t, d) => tone(d, 400 + Math.random() * 200, t, 0.03, 'square', 0.025),
    door: (t, d) => { noise(d, t, 0.1, 0.12, 400); tone(d, 120, t + 0.05, 0.1, 'sine', 0.2); },
    till: (t, d) => { noise(d, t, 0.1, 0.18, 900); tone(d, 140, t, 0.06, 'sine', 0.15); },
    plant: (t, d) => tone(d, 500, t, 0.06, 'sine', 0.1, 1.5),
    level: (t, d) => { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(d, f, t + i * 0.07, 0.2, 'square', 0.07)); },
    cluck: (t, d) => { tone(d, 700, t, 0.05, 'square', 0.05, 1.5); tone(d, 600, t + 0.07, 0.06, 'square', 0.05, 1.3); },
  };
  S.sfx = function (name) {
    if (!ctx() || S.sfxVol <= 0.001) return;
    const f = SFX[name]; if (f) f(S.ctx.currentTime + 0.005, S.sGain);
  };
  // Ambiente: pájaros, olas, grillos y goteo, programados en ráfagas cortas
  S.ambient = function (kind, secs) {
    if (!ctx() || S.sfxVol <= 0.001 || !kind) return;
    const t0 = S.ctx.currentTime, d = S.sGain;
    if (kind === 'birds') { const n = 1 + ((Math.random() * 3) | 0); for (let i = 0; i < n; i++) { const t = t0 + Math.random() * secs; const f = 2200 + Math.random() * 1400; for (let k = 0; k < 2 + ((Math.random() * 3) | 0); k++) tone(d, f * (1 + k * 0.08), t + k * 0.09, 0.07, 'sine', 0.025, 1.25); } }
    if (kind === 'waves') { const s = S.ctx.createBufferSource(); s.buffer = S.noise; s.loop = true; const f = S.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; const g = S.ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.09, t0 + secs * 0.5); g.gain.linearRampToValueAtTime(0.0001, t0 + secs); s.connect(f); f.connect(g); g.connect(d); s.start(t0); s.stop(t0 + secs + 0.05); }
    if (kind === 'crickets') { for (let i = 0; i < 4; i++) { const t = t0 + Math.random() * secs; for (let k = 0; k < 3; k++) tone(d, 4200 + Math.random() * 300, t + k * 0.05, 0.03, 'square', 0.008); } }
    if (kind === 'drips') { if (Math.random() < 0.7) { const t = t0 + Math.random() * secs; tone(d, 1400 + Math.random() * 900, t, 0.12, 'sine', 0.04, 0.5); } }
    if (kind === 'town') { if (Math.random() < 0.35) { const t = t0 + Math.random() * secs; noise(d, t, 0.25, 0.02, 2500); } S.ambient('birds', secs * 0.6); }
  };
  // Lluvia ambiental
  S.setRain = function (on) {
    if (!ctx()) return;
    if (on && !S.rain) {
      const s = S.ctx.createBufferSource(); s.buffer = S.noise; s.loop = true;
      const f = S.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      const g = S.ctx.createGain(); g.gain.value = 0.08;
      s.connect(f); f.connect(g); g.connect(S.sGain); s.start(); S.rain = s;
    } else if (!on && S.rain) { S.rain.stop(); S.rain = null; }
  };
})();
