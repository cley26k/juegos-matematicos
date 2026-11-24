'use strict';
// Configuración persistente y entrada: teclado, ratón, rueda y controles táctiles.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const DEF = { music: 0.5, sfx: 0.7, text: 1, contrast: false, reduceMotion: false, zoom: 0, touch: 'auto',
    keys: { up: 'w', down: 's', left: 'a', right: 'd', use: ' ', interact: 'e', inv: 'i', map: 'm', journal: 'j', notebook: 'n' } };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('valle_settings') || '{}'); } catch (e) { saved = {}; }
  VO.Settings = Object.assign({}, DEF, saved, { keys: Object.assign({}, DEF.keys, saved.keys || {}) });
  VO.Settings.save = function () { try { localStorage.setItem('valle_settings', JSON.stringify(VO.Settings)); } catch (e) { /* sin almacenamiento */ } VO.Settings.apply(); };
  VO.Settings.apply = function () {
    const s = VO.Settings; const r = document.documentElement;
    r.style.setProperty('--ts', s.text);
    document.body.classList.toggle('contrast', !!s.contrast);
    document.body.classList.toggle('reduce', !!s.reduceMotion);
    const touch = s.touch === 'on' || (s.touch === 'auto' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    document.body.classList.toggle('touch', touch);
    if (VO.Audio) VO.Audio.setVolumes(s.music, s.sfx);
    if (VO.G && VO.G.canvas) VO.G.resize();
  };
  VO.KEY_NAMES = { up: 'Arriba', down: 'Abajo', left: 'Izquierda', right: 'Derecha', use: 'Usar herramienta', interact: 'Hablar / interactuar', inv: 'Inventario', map: 'Mapa', journal: 'Diario', notebook: 'Libreta' };

  const I = (VO.Input = { joy: { active: false, x: 0, y: 0 }, mouseTile: null, mouseT: 0, rebind: null });
  I.mouseRecent = () => performance.now() - I.mouseT < 2500;
  const norm = (k) => (k.length === 1 ? k.toLowerCase() : k);

  I.init = function (canvas) {
    const G = VO.G;
    window.addEventListener('keydown', (e) => {
      VO.Audio.unlock();
      const k = norm(e.key);
      if (I.rebind) { e.preventDefault(); I.rebind(k); I.rebind = null; return; }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
      if (VO.UI && VO.UI.onKey(k, e)) { e.preventDefault(); return; }
      if (!G.running) return;
      G.keys[k] = true; if (k === 'Shift') G.keys.Shift = true;
      const S = VO.Settings.keys;
      if (G.paused) return;
      if (k === S.use) { e.preventDefault(); I.mouseT = 0; G.useTool(); }
      else if (k === S.interact) { I.mouseT = 0; G.interact(); }
      else if (k === S.inv) VO.UI.openInventory();
      else if (k === S.map) VO.UI.openMap();
      else if (k === S.journal) VO.UI.openJournal();
      else if (k === S.notebook) VO.Notebook.open();
      else if (/^[0-9]$/.test(k)) { G.state.hot = (+k + 9) % 10; VO.bus.emit('inv'); }
      else if (k === 'Escape') VO.UI.openMenu();
      if (k.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { const k = norm(e.key); G.keys[k] = false; if (k === 'Shift') G.keys.Shift = false; });
    window.addEventListener('blur', () => { G.keys = {}; });
    const tileFrom = (e) => { const r = canvas.getBoundingClientRect(); const x = (e.clientX - r.left) / G.scale + G.cam.x, y = (e.clientY - r.top) / G.scale + G.cam.y; return [Math.floor(x / 16), Math.floor(y / 16)]; };
    canvas.addEventListener('mousemove', (e) => { if (!G.running) return; I.mouseTile = tileFrom(e); I.mouseT = performance.now(); });
    canvas.addEventListener('mousedown', (e) => {
      VO.Audio.unlock();
      if (!G.running || G.paused) return;
      I.mouseTile = tileFrom(e); I.mouseT = performance.now();
      if (e.button === 2) G.interact(); else if (e.button === 0) {
        const [tx, ty] = I.mouseTile; const p = G.player;
        // clic sobre personaje = hablar
        const npc = G.map.id === 'valle' && G.npcs.find((n) => !n.hidden && Math.abs(n.x - (tx * 16 + 8)) < 12 && Math.abs(n.y - 8 - (ty * 16 + 8)) < 16);
        if (npc && Math.hypot(npc.x - p.x, npc.y - p.y) < 40) return VO.UI.talk(npc.id);
        G.useTool();
      }
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { if (!G.running || G.paused) return; G.state.hot = (G.state.hot + (e.deltaY > 0 ? 1 : 9)) % 10; VO.bus.emit('inv'); e.preventDefault(); }, { passive: false });
    // Táctil: palanca virtual
    const joy = document.getElementById('joy'), knob = document.getElementById('knob');
    let jid = null, jc = null;
    joy.addEventListener('touchstart', (e) => { VO.Audio.unlock(); const t = e.changedTouches[0]; jid = t.identifier; const r = joy.getBoundingClientRect(); jc = [r.left + r.width / 2, r.top + r.height / 2]; I.joy.active = true; move(t); e.preventDefault(); }, { passive: false });
    const move = (t) => { const dx = t.clientX - jc[0], dy = t.clientY - jc[1]; const d = Math.min(40, Math.hypot(dx, dy)); const a = Math.atan2(dy, dx); I.joy.x = Math.cos(a) * d / 40; I.joy.y = Math.sin(a) * d / 40; knob.style.transform = `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`; };
    window.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (t.identifier === jid) { move(t); e.preventDefault(); } }, { passive: false });
    const end = (e) => { for (const t of e.changedTouches) if (t.identifier === jid) { jid = null; I.joy.active = false; I.joy.x = I.joy.y = 0; knob.style.transform = ''; } };
    window.addEventListener('touchend', end); window.addEventListener('touchcancel', end);
    document.getElementById('btnUse').addEventListener('touchstart', (e) => { e.preventDefault(); VO.Audio.unlock(); I.mouseT = 0; if (G.running && !G.paused) G.useTool(); });
    document.getElementById('btnTalk').addEventListener('touchstart', (e) => { e.preventDefault(); VO.Audio.unlock(); I.mouseT = 0; if (G.running && !G.paused) G.interact(); });
    canvas.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; if (!G.running || G.paused) return; I.mouseTile = tileFrom(t); I.mouseT = performance.now(); });
    window.addEventListener('resize', () => G.resize());
  };
})();
