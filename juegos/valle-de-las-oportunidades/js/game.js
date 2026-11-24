'use strict';
// Núcleo del juego: estado, bucle, jugador, herramientas, agricultura, tiempo,
// clima, personajes, animales, partículas, renderizado e iluminación.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const T = VO.T, A = VO.Art;
  const lw = (c) => (c && c._hd ? c.width / 2 : c.width), lh = (c) => (c && c._hd ? c.height / 2 : c.height);
  const G = (VO.G = { running: false, paused: 0, keys: {}, particles: [], floats: [], drops: [], npcs: [], animals: [], swing: 0, t: 0 });
  const MIN_PER_SEC = 1.35;
  const INV_SIZE = 30;

  // ------------------------------------------------------------ ESTADO
  G.newState = function (opts) {
    const aula = opts.mode === 'aula';
    const cfg = opts.cfg || {};
    const s = {
      v: 2, mode: opts.mode || 'historia', anonId: opts.anonId || VO.anonId(), name: opts.name || 'Peña', look: opts.look,
      day: 1, time: aula ? 8 * 60 : 6 * 60 + 30, weather: 'sol', money: aula ? (cfg.money || 600) : 500, energy: 100, maxEnergy: 100,
      inv: new Array(INV_SIZE).fill(null), hot: 0,
      tools: {}, house: { roof: false, windows: false, extension: false }, projects: { taller: false, gallinero: false },
      placed: { casa: [], valle: [] }, soil: [], removed: {}, bushTaken: {},
      missions: {}, chapter: 1, friendship: {}, animals: [], troughFull: false,
      stats: { days: [{ day: 1, income: 0, expense: 0 }], income: 0, expense: 0, byCat: {} },
      loans: [], savings: null, storage: [], unlocks: {}, mineDeep: 0, seen: {},
      mail: [{ from: 'Alcaldía', t: 'Bienvenida al valle', b: 'Querido vecino: la finca de tu familia vuelve a tener vida. El programa de revitalización te apoyará con fondos para cada proyecto. ¡Pasa por la plaza! — Andrés', day: 1, read: false, item: 'seed_aji', n: 2 }],
      priceSeed: (Math.random() * 1e6) | 0, token: VO.DB ? VO.DB.newToken() : '', clase: VO.DB ? VO.DB.cfg().clase : '', played: 0, aulaStart: Date.now(), aulaMinutes: cfg.minutes || 40,
      aulaMissions: cfg.missions || null, hintsAllowed: cfg.hints !== false, difficulty: cfg.difficulty || 'normal',
    };
    ['axe', 'pick', 'hoe', 'can', 'rod', 'shovel', 'hammer'].forEach((k) => (s.tools[k] = { tier: 0, dur: VO.TOOL_STATS(0).maxDur, water: k === 'can' ? 20 : 0 }));
    const start = ['hoe', 'can', 'axe', 'pick', 'rod', 'shovel', 'hammer'];
    start.forEach((k, i) => (s.inv[i] = { id: k, n: 1 }));
    s.inv[7] = { id: 'seed_maiz', n: 5 };
    // cerca de la parcela
    for (let x = 7; x <= 34; x++) { if (x < 15 || x > 17) s.placed.valle.push({ x, y: 35, id: 'fence' }); if (x < 10 || x > 16) s.placed.valle.push({ x, y: 52, id: 'fence' }); }
    for (let y = 36; y < 52; y++) { s.placed.valle.push({ x: 7, y, id: 'fence' }); s.placed.valle.push({ x: 34, y, id: 'fence' }); }
    s.inv[8] = { id: 'mango', n: 2 };
    if (aula) {
      const add = cfg.items || { wood: 20, sardina: 20, plank: 10, stone: 10, fiber: 10, guayaba: 6 };
      let i = 9; for (const k in add) s.inv[i++] = { id: k, n: add[k] };
      s.house.roof = true;
    }
    VO.MISSIONS.forEach((m) => (s.missions[m.id] = { status: 'locked', attempts: 0, hints: 0, errors: [] }));
    Object.keys(VO.NPCS).forEach((k) => (s.friendship[k] = 0));
    G.refreshMissions(s);
    return s;
  };

  G.refreshMissions = function (s) {
    s = s || G.state;
    if (s.mode === 'aula') {
      const allowed = s.aulaMissions || VO.MISSIONS.map((m) => m.id);
      VO.MISSIONS.forEach((m) => { const st = s.missions[m.id]; if (st.status === 'locked' && allowed.includes(m.id)) st.status = 'available'; });
      return;
    }
    // capítulo actual: el primero con misiones sin completar
    let ch = 1;
    for (const c of VO.CHAPTERS) { const ms = VO.MISSIONS.filter((m) => m.chapter === c.n); if (ms.every((m) => s.missions[m.id].status === 'done')) ch = c.n + 1; else break; }
    const prev = s.chapter; s.chapter = Math.min(ch, 7);
    VO.MISSIONS.forEach((m) => { const st = s.missions[m.id]; if (st.status === 'locked' && m.chapter <= s.chapter) st.status = 'available'; });
    return prev !== s.chapter && G.state ? s.chapter : 0;
  };

  // ------------------------------------------------------------ INVENTARIO
  G.count = (id) => G.state.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
  G.countCat = (cat) => G.state.inv.reduce((a, s) => a + (s && VO.ITEMS[s.id] && VO.ITEMS[s.id].cat === cat ? s.n : 0), 0);
  G.addItem = function (id, n) {
    const inv = G.state.inv; const max = VO.ITEMS[id] ? VO.ITEMS[id].stack : 99;
    for (const s of inv) if (s && s.id === id && s.n < max) { const k = Math.min(n, max - s.n); s.n += k; n -= k; if (!n) break; }
    for (let i = 0; i < inv.length && n > 0; i++) if (!inv[i]) { const k = Math.min(n, max); inv[i] = { id, n: k }; n -= k; }
    VO.bus.emit('inv');
    return n; // sobrante
  };
  G.canAdd = function (id, n) {
    const max = VO.ITEMS[id] ? VO.ITEMS[id].stack : 99; let room = 0;
    for (const s of G.state.inv) { if (!s) room += max; else if (s.id === id) room += max - s.n; }
    return room >= n;
  };
  G.removeItem = function (id, n) {
    if (G.count(id) < n) return false;
    const inv = G.state.inv;
    for (let i = inv.length - 1; i >= 0 && n > 0; i--) if (inv[i] && inv[i].id === id) { const k = Math.min(n, inv[i].n); inv[i].n -= k; n -= k; if (!inv[i].n) inv[i] = null; }
    VO.bus.emit('inv');
    return true;
  };
  G.removeCat = function (cat, n) {
    if (G.countCat(cat) < n) return false;
    const inv = G.state.inv;
    for (let i = inv.length - 1; i >= 0 && n > 0; i--) if (inv[i] && VO.ITEMS[inv[i].id].cat === cat) { const k = Math.min(n, inv[i].n); inv[i].n -= k; n -= k; if (!inv[i].n) inv[i] = null; }
    VO.bus.emit('inv'); return true;
  };
  G.hasAll = (req) => Object.keys(req).every((k) => G.count(k) >= req[k]);
  G.takeAll = (req) => { if (!G.hasAll(req)) return false; for (const k in req) G.removeItem(k, req[k]); return true; };
  G.giveOrDrop = function (id, n) {
    const left = G.addItem(id, n);
    if (left > 0) {
      G.drops.push({ id, n: left, x: G.player.x + (Math.random() * 16 - 8), y: G.player.y + 6, map: G.map.id, t: 0 });
      VO.UI.toast('Inventario lleno: ' + left + ' × ' + VO.ITEMS[id].name + ' quedaron en el suelo.', 'warn');
      VO.Analytics.game('inventario_lleno', id);
    }
    return n - left;
  };
  G.selected = () => G.state.inv[G.state.hot];

  // ------------------------------------------------------------ DINERO
  G.price = function (id, mode) {
    const it = VO.ITEMS[id]; if (!it) return 0;
    const f = 0.9 + VO.hash(G.state.day, id.length * 31 + id.charCodeAt(0), G.state.priceSeed % 997) * 0.2; // varía por día, fijo en el día
    if (mode === 'buy') return it.buy;
    const promo = (G.state.promo && G.state.promo.id === id && G.state.promo.day === G.state.day ? 1.3 : 1) * (G.state.luck === G.state.day ? 1.05 : 1);
    return Math.max(1, Math.round(it.sell * (it.cat === 'tool' ? 0 : f) * promo));
  };
  function dayRec() { const s = G.state.stats; let r = s.days[s.days.length - 1]; if (!r || r.day !== G.state.day) { r = { day: G.state.day, income: 0, expense: 0 }; s.days.push(r); } return r; }
  G.earn = function (amt, cat, label) {
    amt = Math.round(amt); if (!amt) return;
    G.state.money += amt; const s = G.state.stats; s.income += amt; dayRec().income += amt;
    s.byCat[cat] = s.byCat[cat] || { inc: 0, exp: 0 }; s.byCat[cat].inc += amt;
    G.float('+' + amt, G.player.x, G.player.y - 26, '#ffe27a'); VO.bus.emit('money');
  };
  G.spend = function (amt, cat) {
    amt = Math.round(amt);
    if (G.state.money < amt) { VO.Audio.sfx('error'); VO.Analytics.game('dinero_insuficiente', cat); return false; }
    G.state.money -= amt; const s = G.state.stats; s.expense += amt; dayRec().expense += amt;
    s.byCat[cat] = s.byCat[cat] || { inc: 0, exp: 0 }; s.byCat[cat].exp += amt;
    VO.bus.emit('money'); return true;
  };

  // ------------------------------------------------------------ ENERGÍA Y TIEMPO
  G.useEnergy = function (n) {
    if (G.state.energy < n) { VO.UI.toast('Estás muy cansado. Come algo o descansa.', 'warn'); VO.Audio.sfx('error'); VO.Analytics.game('sin_energia'); return false; }
    G.state.energy = Math.max(0, G.state.energy - n); VO.bus.emit('energy'); return true;
  };
  G.advanceTime = function (mins) { G.state.time += mins; if (G.state.time >= 26 * 60) G.passOut(); VO.bus.emit('time'); };
  G.hour = () => G.state.time / 60;
  G.clock = function () { const t = G.state.time; let h = Math.floor(t / 60) % 24; const m = Math.floor(t % 60 / 10) * 10; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); };

  G.passOut = function () {
    VO.UI.toast('Te quedaste dormido de cansancio. Lucía te acompañó a casa.', 'info');
    G.endDay(true);
  };
  G.endDay = function (passed) {
    G.side = null;
    const s = G.state;
    const prev = dayRec();
    s.day++;
    s.time = 6 * 60 + 30;
    s.energy = passed ? Math.round(s.maxEnergy * 0.7) : s.maxEnergy;
    // clima
    const r = VO.hash(s.day, 7, s.priceSeed);
    s.weather = r < 0.22 ? 'lluvia' : r < 0.42 ? 'nublado' : 'sol';
    if (VO.Events) VO.Events.morning();
    // cultivos
    const valley = G.maps.valle;
    valley.objs.forEach((o, k) => {
      if (o.kind === 'crop' && !o.deco) {
        const soil = valley.soil.get(k);
        if (soil && soil.wet && o.stage < o.max) { o.days++; const c = VO.CROPS[o.crop]; o.stage = Math.min(o.max, Math.floor((o.days / c.days) * o.max)); }
      }
      if (o.kind === 'place' && o.id === 'sprinkler') [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const sk = valley.idx(o.x + dx, o.y + dy); if (valley.soil.has(sk)) valley.soil.get(sk).sprinkled = true; });
    });
    valley.soil.forEach((v, k) => { if (v.npc) return; v.wet = s.weather === 'lluvia' || !!v.sprinkled; v.sprinkled = false; if (!valley.objs.has(k)) { v.age = (v.age || 0) + 1; if (v.age > 3 && VO.hash(k, s.day, 3) < 0.3) valley.soil.delete(k); } else v.age = 0; });
    // regeneración de recursos
    for (const k in s.removed) {
      const e = s.removed[k]; if (e.day > s.day) continue;
      const x = k % valley.w, y = (k / valley.w) | 0;
      if (!valley.objs.has(+k) && !valley.soil.has(+k) && Math.hypot(G.player.x / 16 - x, G.player.y / 16 - y) > 2) { valley.setObj(x, y, { kind: 'node', type: e.type, hp: VO.NODES[e.type].hp, v: e.v || 0 }); }
      delete s.removed[k];
    }
    s.bushTaken = {};
    // animales
    s.animals.forEach((a) => { if (a.fed) { a.egg = true; a.happy = Math.min(10, (a.happy || 0) + 1); } a.fed = false; });
    if (s.troughFull && s.animals.length) { s.animals.forEach((a) => (a.fed = true)); s.troughFull = false; }
    // ahorro e intereses (simple)
    if (s.savings && (s.day - s.savings.start) % 7 === 0) VO.UI.toast('Tu cuenta de ahorro sumó intereses de la semana.', 'info');
    // préstamos
    s.loans.forEach((l) => { if (!l.paid && s.day > l.start + l.t * 7) l.late = true; });
    dayRec();
    G.rebuildValley();
    G.save('auto');
    VO.Audio.sfx('level');
    VO.UI.daySummary(prev);
    G.placeAt('casa', 4, 6);
    G.updateNPCSchedule(true);
    VO.bus.emit('time');
  };

  // ------------------------------------------------------------ MAPAS
  G.maps = {};
  G.rebuildValley = function () {
    const s = G.state;
    const old = G.maps.valle;
    const m = VO.buildValley(s);
    // eliminar recursos recolectados
    for (const k in s.removed) m.objs.delete(+k);
    if (old) {
      old.soil.forEach((v, k) => { if (!v.npc) m.soil.set(k, v); });
      old.objs.forEach((o, k) => { if ((o.kind === 'crop' && !o.deco) || o.kind === 'place') { m.objs.set(k, o); } else if (o.kind === 'node' && !m.objs.has(k) && !s.removed[k]) m.objs.set(k, o); else if (o.kind === 'node' && m.objs.has(k)) m.objs.set(k, o); });
      // nodos que el jugador rompió en esta sesión ya están en removed
    } else {
      (s.soil || []).forEach((p) => { const k = m.idx(p.x, p.y); m.soil.set(k, { wet: p.wet }); if (p.crop) m.objs.set(k, { kind: 'crop', crop: p.crop, stage: p.stage, days: p.days, max: p.max || 4, x: p.x, y: p.y, regrown: p.regrown }); });
      (s.placed.valle || []).forEach((p) => m.setObj(p.x, p.y, { kind: 'place', id: p.id, store: p.store }));
      (s.nodes || []).forEach((n) => { const k = m.idx(n.x, n.y); const o = m.objs.get(k); if (o && o.kind === 'node') o.hp = n.hp; });
    }
    m.cache = null;
    G.maps.valle = m;
    if (VO.Events && G.state) VO.Events.placeLost(m);
    if (VO.MiniQuests && G.state) VO.MiniQuests.restore(m);
    if (G.map && G.map.id === 'valle') G.map = m;
    G.maps.casa = VO.buildHouse(s);
  };
  G.placeAt = function (mapId, tx, ty) {
    if (mapId.startsWith('mina')) { const lv = +mapId.slice(4); G.maps[mapId] = VO.buildMine(lv, G.state.day); }
    if (mapId.startsWith('int_') && !G.maps[mapId]) G.maps[mapId] = VO.buildInterior(mapId.slice(4));
    G.map = G.maps[mapId];
    G.player.x = tx * 16 + 8; G.player.y = ty * 16 + 12;
    G.drops = G.drops.filter((d) => d.map === mapId || d.map === 'valle');
    G.cam.snap = true; G.amb = [];
    if (G.map.title) VO.UI.banner(G.map.title);
    G.playMusic(); VO.bus.emit('time');
  };
  // Un solo cambio de lugar a la vez: evita entradas repetidas y sonidos duplicados.
  G.warp = function (mapId, tx, ty, dir) {
    if (G.warping) return;
    G.warping = true; G.keys = {};
    VO.Audio.sfx('door');
    VO.UI.fade(() => { G.placeAt(mapId, tx, ty); if (dir !== undefined) G.player.dir = dir; setTimeout(() => { G.warping = false; }, 250); });
  };
  G.ambientKind = function () {
    const m = G.map, h = G.hour(); if (m.indoor) return null; if (m.mine) return 'drips';
    if (G.state.weather === 'lluvia') return null;
    const py = G.player.y / 16; if (m.id === 'valle' && py > 60) return 'waves';
    if (h >= 19.5 || h < 5.5) return 'crickets';
    const z = m.zones && m.zones.town; if (z && G.player.x / 16 >= z.x && py >= z.y) return 'town';
    return 'birds';
  };
  G.playMusic = function () {
    const h = G.hour();
    if (G.state.festival) return VO.Audio.play('fiesta');
    if (G.side) return VO.Audio.play('gallery');
    if (G.map.music === 'mine') return VO.Audio.play('mine');
    if (G.map.music === 'home') return VO.Audio.play('home');
    const pz = G.map.zones && G.map.zones.town; const inTown = pz && G.player.x / 16 >= pz.x && G.player.y / 16 >= pz.y && G.player.y / 16 < pz.y + pz.h;
    if (G.isFiesta() && inTown) return VO.Audio.play('fiesta');
    if (h >= 20 || h < 6) return VO.Audio.play('night');
    if (h >= 14 && !inTown && G.map.id === 'valle') return VO.Audio.play('farm2');
    const p = G.player; const z = G.map.zones && G.map.zones.town;
    if (z && p.x / 16 >= z.x && p.y / 16 >= z.y && p.y / 16 < z.y + z.h) return VO.Audio.play('town');
    VO.Audio.play('farm');
  };

  // ------------------------------------------------------------ INICIO
  G.start = function (state) {
    G.state = state;
    G.player = { x: 0, y: 0, dir: 0, frame: 0, anim: 0, moving: false, look: state.look };
    G.cam = { x: 0, y: 0, snap: true };
    G.maps = {}; G.map = null;
    G.rebuildValley();
    G.initNPCs(); G.initAnimals();
    if (state.mode === 'aula') G.placeAt('valle', 76, 46); else G.placeAt(state.pos && state.pos.map === 'valle' ? 'valle' : 'casa', state.pos && state.pos.map === 'valle' ? state.pos.x : 4, state.pos && state.pos.map === 'valle' ? state.pos.y : 6);
    G.running = true;
    G.updateNPCSchedule(true);
    VO.UI.showHUD(true);
    VO.bus.emit('inv'); VO.bus.emit('money'); VO.bus.emit('time');
    if (!G.loopOn) { G.loopOn = true; G.last = performance.now(); requestAnimationFrame(G.loop); }
  };

  // ------------------------------------------------------------ GUARDADO
  G.serialize = function () {
    const s = G.state; const v = G.maps.valle;
    s.soil = []; v.soil.forEach((val, k) => { if (val.npc) return; const o = v.objs.get(k); const e = { x: k % v.w, y: (k / v.w) | 0, wet: !!val.wet }; if (o && o.kind === 'crop') Object.assign(e, { crop: o.crop, stage: o.stage, days: o.days, max: o.max, regrown: o.regrown }); s.soil.push(e); });
    s.placed.valle = []; v.objs.forEach((o, k) => { if (o.kind === 'place') s.placed.valle.push({ x: k % v.w, y: (k / v.w) | 0, id: o.id, store: o.store }); });
    const c = G.maps.casa; s.placed.casa = []; c.objs.forEach((o, k) => { if (o.kind === 'place') s.placed.casa.push({ x: k % c.w, y: (k / c.w) | 0, id: o.id, store: o.store }); });
    s.nodes = []; v.objs.forEach((o, k) => { if (o.kind === 'node' && VO.NODES[o.type] && o.hp < VO.NODES[o.type].hp) s.nodes.push({ x: k % v.w, y: (k / v.w) | 0, hp: o.hp }); });
    s.pos = { map: G.map.id === 'valle' ? 'valle' : 'casa', x: Math.floor(G.player.x / 16), y: Math.floor(G.player.y / 16) };
    s.animalsPos = G.animals.map((a) => ({ x: a.x, y: a.y }));
    return JSON.stringify(s);
  };
  G.save = function (slot) {
    slot = slot === 'auto' ? (G.state.slot || 1) : slot;
    G.state.slot = slot;
    try { localStorage.setItem('valle_slot_' + slot, G.serialize()); localStorage.setItem('valle_slot_' + slot + '_meta', JSON.stringify({ day: G.state.day, money: G.state.money, chapter: G.state.chapter, mode: G.state.mode, when: Date.now(), id: G.state.anonId })); VO.UI.toast('Partida guardada (ranura ' + slot + ').', 'ok'); if (VO.DB && VO.DB.enabled()) { if (!G.state.token) G.state.token = VO.DB.newToken(); VO.DB.saveGame(G.state).then((ok) => { if (ok) VO.UI.toast('Copia guardada en la nube.', 'ok'); }); VO.DB.flush(); } return true; }
    catch (e) { VO.UI.toast('No se pudo guardar: el navegador no permite almacenamiento local.', 'warn'); return false; }
  };
  G.loadSlot = function (slot) {
    try {
      const raw = localStorage.getItem('valle_slot_' + slot); if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s || !s.v) return false;
      if (s.v < 2) { s.bushTaken = s.bushTaken || {}; s.v = 2; } // migración
      s.slot = slot;
      G.start(s);
      return true;
    } catch (e) { console.error(e); VO.UI.toast('La partida guardada está dañada.', 'warn'); return false; }
  };

  // ------------------------------------------------------------ PERSONAJES
  G.initNPCs = function () {
    G.npcs = Object.keys(VO.NPCS).map((id) => ({ id, def: VO.NPCS[id], x: 0, y: 0, dir: 0, frame: 0, anim: 0, path: null, hidden: false, target: null, talkT: 0 }));
  };
  function spotFor(n, kind) {
    const v = G.maps.valle;
    if (kind === 'work') {
      if (n.id === 'marina') return [70, 67];
      if (n.id === 'rafael') return [73, 40];
      if (n.id === 'lucia') return [14, 59];
    }
    const bid = kind === 'work' ? n.def.work : n.def.home;
    const b = v.buildings.find((bb) => bb.id === bid);
    if (!b) return [76, 46];
    const dx = b.x + Math.floor(b.w / 2) + (kind === 'work' ? 1 : 0);
    return [dx, b.y + b.h];
  }
  function insideWork(n) { return VO.INTERIOR_IDS.includes(n.def.work); }
  G.insideWork = insideWork;
  function plazaSpot(n) { const i = Object.keys(VO.NPCS).indexOf(n.id); return [70 + (i * 3) % 16, 44 + (i % 3)]; }
  G.isFiesta = () => !!G.state && G.state.day % 7 === 0 && G.hour() >= 18 && G.hour() < 22;
  G.npcState = function (n) {
    const h = G.hour();
    if (G.state.festival) return 'plaza';
    if (G.isFiesta()) return 'plaza';
    if (h < 7.5 || h >= 20) return 'home';
    if (h < 18) return 'work';
    return 'plaza';
  };
  G.updateNPCSchedule = function (teleport) {
    const v = G.maps.valle;
    G.npcs.forEach((n) => {
      const st = G.npcState(n);
      let goal = st === 'home' ? spotFor(n, 'home') : st === 'work' ? spotFor(n, 'work') : plazaSpot(n);
      if (n.id === 'marina' && st === 'work' && G.hour() < 5) goal = spotFor(n, 'home');
      if (teleport || n.state === undefined) {
        n.x = goal[0] * 16 + 8; n.y = goal[1] * 16 + 12; n.path = null; n.hidden = st === 'home' || (st === 'work' && insideWork(n));
      } else if (n.state !== st) {
        const p = VO.findPath(v, Math.floor(n.x / 16), Math.floor(n.y / 16), goal[0], goal[1]);
        n.path = p; n.hidden = false; if (!p) { n.x = goal[0] * 16 + 8; n.y = goal[1] * 16 + 12; n.hidden = st === 'home' || (st === 'work' && insideWork(n)); }
      }
      n.state = st; n.goal = goal;
    });
  };
  function updateNPCs(dt) {
    const sp = 40;
    G.npcs.forEach((n) => {
      n.anim += dt;
      if (n.path && n.path.length) {
        const [tx, ty] = n.path[0]; const gx = tx * 16 + 8, gy = ty * 16 + 12;
        const dx = gx - n.x, dy = gy - n.y; const d = Math.hypot(dx, dy);
        if (d < 1.5) { n.path.shift(); if (!n.path.length) { n.path = null; if (n.state === 'home' || (n.state === 'work' && insideWork(n))) n.hidden = true; } }
        else { n.x += (dx / d) * sp * dt; n.y += (dy / d) * sp * dt; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; n.frame = Math.floor(n.anim * 6) % 2 + 1; }
      } else {
        n.frame = 0;
        if (G.isFiesta() && n.state === 'plaza' && !VO.Settings.reduceMotion) { const k = Object.keys(VO.NPCS).indexOf(n.id); n.dir = [0, 2, 3, 1][Math.floor(G.t * 1.6 + k) % 4]; n.frame = Math.floor(G.t * 4 + k) % 2 ? 1 : 2; return; }
        const p = G.player; if (!n.hidden && Math.hypot(p.x - n.x, p.y - n.y) < 40) { const dx = p.x - n.x, dy = p.y - n.y; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; }
      }
    });
  }

  // ------------------------------------------------------------ ANIMALES
  G.initAnimals = function () {
    G.animals = G.state.animals.map((a, i) => ({ ref: a, x: (G.state.animalsPos && G.state.animalsPos[i] ? G.state.animalsPos[i].x : 30 * 16 + i * 12), y: G.state.animalsPos && G.state.animalsPos[i] ? G.state.animalsPos[i].y : 31 * 16, vx: 0, vy: 0, t: Math.random() * 3, f: 0 }));
  };
  G.addAnimal = function (type) {
    const a = { type: type || 'chicken', fed: false, egg: false, happy: 0, name: ['Pinta', 'Coco', 'Plumita', 'Canela', 'Tostón', 'Yuquita'][G.state.animals.length % 6] };
    G.state.animals.push(a); G.animals.push({ ref: a, x: 31 * 16, y: 31 * 16, vx: 0, vy: 0, t: 0, f: 0 });
  };
  function updateAnimals(dt) {
    if (G.map.id !== 'valle') return;
    G.animals.forEach((a) => {
      a.t -= dt;
      if (a.t <= 0) { a.t = 1 + Math.random() * 3; const r = Math.random(); if (r < 0.5) { a.vx = 0; a.vy = 0; } else { const ang = Math.random() * 6.28; a.vx = Math.cos(ang) * 14; a.vy = Math.sin(ang) * 14; } if (Math.random() < 0.15 && Math.hypot(G.player.x - a.x, G.player.y - a.y) < 120) VO.Audio.sfx('cluck'); }
      const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt;
      if (nx > 26 * 16 && nx < 40 * 16 && ny > 29 * 16 && ny < 33 * 16 && !G.map.solid(Math.floor(nx / 16), Math.floor(ny / 16))) { a.x = nx; a.y = ny; } else { a.vx *= -1; a.vy *= -1; }
      if (a.vx || a.vy) a.f += dt * 6;
    });
  }

  // ------------------------------------------------------------ PARTÍCULAS
  G.burst = function (x, y, color, n, opts) {
    if (VO.Settings.reduceMotion) n = Math.ceil(n / 3);
    opts = opts || {};
    for (let i = 0; i < n; i++) G.particles.push({ x, y, vx: (Math.random() - 0.5) * (opts.spread || 60), vy: -Math.random() * (opts.up || 60) - 10, g: opts.g === undefined ? 160 : opts.g, life: 0.4 + Math.random() * 0.4, c: Array.isArray(color) ? color[(Math.random() * color.length) | 0] : color, s: opts.size || 1 });
  };
  G.flyers = [];
  G.float = function (text, x, y, color) { G.floats.push({ text, x, y, c: color || '#fff', life: 1.2 }); };

  // ------------------------------------------------------------ JUGADOR
  function playerBox(x, y) { return [x - 5, y - 4, 10, 6]; }
  function collide(x, y) {
    const [bx, by, bw, bh] = playerBox(x, y);
    for (const [cx, cy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) if (G.map.solid(Math.floor(cx / 16), Math.floor(cy / 16))) return true;
    if (G.map.id === 'valle') for (const n of G.npcs) if (!n.hidden && Math.abs(n.x - x) < 9 && Math.abs(n.y - y) < 6) return true;
    return false;
  }
  function updatePlayer(dt) {
    const p = G.player; const k = G.keys; const s = VO.Settings.keys;
    let ix = 0, iy = 0;
    if (k[s.left] || k.ArrowLeft) ix -= 1; if (k[s.right] || k.ArrowRight) ix += 1; if (k[s.up] || k.ArrowUp) iy -= 1; if (k[s.down] || k.ArrowDown) iy += 1;
    if (VO.Input.joy.active) { ix = VO.Input.joy.x; iy = VO.Input.joy.y; }
    const mag = Math.hypot(ix, iy);
    p.moving = mag > 0.2 && G.swing <= 0;
    if (p.moving) {
      const sp = (k.Shift ? 105 : 78) * (G.state.energy < 10 ? 0.7 : 1);
      const vx = (ix / Math.max(1, mag)) * sp * dt, vy = (iy / Math.max(1, mag)) * sp * dt;
      const offs = G.map.indoor ? [2, 4, 6, 8, 10, 12, 14] : [2, 4, 6];
      const slide = (ax, ay, len) => { for (const off of offs) for (const sgn of [1, -1]) { const ox = ax ? 0 : off * sgn, oy = ax ? off * sgn : 0; if (!collide(p.x + ax + ox, p.y + ay + oy)) { const st = Math.min(len * 0.8, off); p.x += Math.sign(ox) * st; p.y += Math.sign(oy) * st; return; } } };
      if (Math.abs(vx) > 0.01) { if (!collide(p.x + vx, p.y)) p.x += vx; else if (Math.abs(vx) >= Math.abs(vy)) slide(vx, 0, Math.abs(vx)); }
      const magnet = (axis, v) => { if (!G.map.indoor) return false; const sp2 = Math.abs(v); const cxT = Math.floor(p.x / 16), cyT = Math.floor((p.y - 2) / 16); for (const d of [0, 1, -1, 2, -2, 3, -3]) { if (axis === 'y') { const tx2 = cxT + d, ny2 = Math.floor((p.y - 2 + Math.sign(v) * 10) / 16); if (!G.map.solid(tx2, ny2) && !G.map.solid(tx2, cyT)) { const goal = tx2 * 16 + 8; if (Math.abs(goal - p.x) < 0.6) return false; const step2 = Math.sign(goal - p.x) * Math.min(sp2, Math.abs(goal - p.x)); if (!collide(p.x + step2, p.y)) { p.x += step2; return true; } } } else { const ty2 = cyT + d, nx2 = Math.floor((p.x + Math.sign(v) * 10) / 16); if (!G.map.solid(nx2, ty2) && !G.map.solid(cxT, ty2)) { const goal = ty2 * 16 + 12; if (Math.abs(goal - p.y) < 0.6) return false; const step2 = Math.sign(goal - p.y) * Math.min(sp2, Math.abs(goal - p.y)); if (!collide(p.x, p.y + step2)) { p.y += step2; return true; } } } } return false; };
      if (Math.abs(vy) > 0.01) { if (!collide(p.x, p.y + vy)) p.y += vy; else if (Math.abs(vy) >= Math.abs(vx) && !magnet('y', vy)) slide(0, vy, Math.abs(vy)); }
      p.dir = Math.abs(ix) > Math.abs(iy) ? (ix < 0 ? 1 : 2) : iy < 0 ? 3 : 0;
      p.anim += dt; const f = Math.floor(p.anim * 8) % 4; p.frame = f === 1 ? 1 : f === 3 ? 2 : 0;
      if (f !== p.lastF && (f === 1 || f === 3)) { VO.Audio.sfx('step'); const tt = G.map.get(Math.floor(p.x / 16), Math.floor(p.y / 16)); if (tt === T.PATH || tt === T.SAND || tt === T.FARM || tt === T.CAVE) G.particles.push({ x: p.x + (Math.random() * 6 - 3), y: p.y, vx: (Math.random() - 0.5) * 10, vy: -8, g: 10, life: 0.35, c: tt === T.SAND ? '#f4e2b4' : tt === T.CAVE ? '#6a584a' : '#d8b47a', s: 1 }); } p.lastF = f;
    } else { p.frame = 0; }
    // portales
    const tx = Math.floor(p.x / 16), ty = Math.floor(p.y / 16);
    if (!G.warping) for (const w of G.map.warps) if (tx >= w.x && tx < w.x + w.w && ty >= w.y && ty < w.y + w.h) { G.warp(w.to, w.tx, w.ty, w.dir); break; }
    // recoger objetos del suelo
    G.drops = G.drops.filter((d) => {
      if (d.map !== G.map.id) return true;
      d.t += dt;
      if (d.t > 0.5 && Math.hypot(d.x - p.x, d.y - p.y) < 14) { const left = G.addItem(d.id, d.n); if (left < d.n) { VO.Audio.sfx('collect'); G.float('+' + (d.n - left) + ' ' + VO.ITEMS[d.id].name, p.x, p.y - 24); } d.n = left; return left > 0; }
      return true;
    });
  }
  G.facingTile = function () {
    const p = G.player; const d = [[0, 1], [-1, 0], [1, 0], [0, -1]][p.dir];
    const fx = Math.floor((p.x + d[0] * 12) / 16), fy = Math.floor((p.y - 3 + d[1] * 12) / 16);
    return [fx, fy];
  };
  G.targetTile = function () {
    if (VO.Input.mouseTile && VO.Input.mouseRecent()) {
      const [mx, my] = VO.Input.mouseTile; const p = G.player;
      if (Math.abs(mx * 16 + 8 - p.x) <= 26 && Math.abs(my * 16 + 8 - (p.y - 4)) <= 26) return [mx, my];
    }
    return G.facingTile();
  };

  // ------------------------------------------------------------ ACCIONES
  function faceTo(tx, ty) { const p = G.player; const dx = tx * 16 + 8 - p.x, dy = ty * 16 + 8 - (p.y - 4); if (Math.abs(dx) > 4 || Math.abs(dy) > 4) p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; }
  function toolStats(tool) { const t = G.state.tools[tool]; const st = VO.TOOL_STATS(t.tier); return { t, st, power: t.dur > 0 ? st.power : Math.max(1, st.power / 2), cost: Math.max(1, Math.round(VO.TOOLS[tool].energy * st.energyMul)) }; }
  function wear(tool) { const t = G.state.tools[tool]; if (t.dur > 0) { t.dur--; if (t.dur === 0) VO.UI.toast(VO.TOOLS[tool].name + ' está desgastada: rinde la mitad. Bruno puede repararla.', 'warn'); } }

  G.useTool = function () {
    if (G.side) { if (!G.paused) VO.Gallery.use(); return; }
    if (G.paused || G.swing > 0 || G.warping) return;
    const sel = G.selected(); const [tx, ty] = G.targetTile(); faceTo(tx, ty);
    const m = G.map; const o = m.obj(tx, ty);
    // cosechar o recoger sin herramienta
    if (o && o.kind === 'crop' && o.stage >= o.max && !o.deco) return harvest(tx, ty, o);
    if (o && o.kind === 'node' && o.type === 'lost') return VO.Events.pickLost(tx, ty, o);
    if (o && o.kind === 'node' && (o.type === 'weed' || o.type === 'shell' || o.type === 'bush') && !(sel && (sel.id === 'hoe' || sel.id === 'axe' || sel.id === 'shovel'))) return gather(tx, ty, o, 1, 1);
    if (!sel) return G.interact();
    const it = VO.ITEMS[sel.id];
    if (it.cat === 'tool') return toolAction(sel.id, tx, ty, o);
    if (it.cat === 'seed') return plant(tx, ty, sel.id);
    if (it.cat === 'place') return place(tx, ty, sel.id);
    if (it.energy) return eat(sel.id);
    G.interact();
  };
  function eat(id) {
    if (G.state.energy >= G.state.maxEnergy) { VO.UI.toast('Tienes la energía al máximo.', 'info'); return; }
    G.removeItem(id, 1); G.state.energy = Math.min(G.state.maxEnergy, G.state.energy + VO.ITEMS[id].energy); VO.Audio.sfx('pop');
    G.float('+' + VO.ITEMS[id].energy + ' energía', G.player.x, G.player.y - 26, '#9cf06a'); VO.bus.emit('energy');
  }
  function swingAnim(tool) { G.swing = 0.28; G.swingTool = tool; }
  function toolAction(tool, tx, ty, o) {
    const m = G.map; const { t, st, power, cost } = toolStats(tool);
    const px = tx * 16 + 8, py = ty * 16 + 8;
    if (tool === 'rod') {
      const w = m.get(tx, ty);
      if (w !== T.WATER && w !== T.DEEP) { VO.UI.toast('Apunta hacia el agua para pescar.', 'info'); return; }
      if (!G.useEnergy(cost)) return;
      swingAnim(tool); wear(tool); VO.Audio.sfx('cast');
      const where = m.id === 'valle' ? (ty >= 66 ? 'mar' : tx >= 76 && ty < 26 ? 'lago' : 'rio') : 'rio';
      setTimeout(() => VO.Fishing.start(where), 350);
      return;
    }
    if (tool === 'hammer') {
      if (o && o.kind === 'place') {
        if (o.store && o.store.some((s) => s)) { VO.UI.toast('Vacía el cofre antes de moverlo.', 'warn'); return; }
        if (G.addItem(o.id, 1) === 0) { m.setObj(tx, ty, null); VO.Audio.sfx('pop'); G.burst(px, py, '#c99159', 8); swingAnim(tool); }
        return;
      }
      VO.UI.openBuild(); return;
    }
    if (tool === 'can') {
      const w = m.get(tx, ty);
      if (w === T.WATER || w === T.DEEP) { t.water = st.canCap; VO.Audio.sfx('water'); G.burst(px, py, ['#7cc4ea', '#d8f0ff'], 10); VO.UI.toast('Regadera llena (' + t.water + ').', 'ok'); swingAnim(tool); VO.bus.emit('inv'); return; }
      const soil = m.soil.get(m.idx(tx, ty));
      if (!soil) { VO.UI.toast('Riega tierra preparada con la azada.', 'info'); return; }
      if (t.water <= 0) { VO.UI.toast('La regadera está vacía. Llénala en el río o el lago.', 'warn'); VO.Audio.sfx('error'); return; }
      if (!G.useEnergy(cost)) return;
      swingAnim(tool); wear(tool);
      const area = t.tier >= 2 ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : t.tier >= 1 ? [[0, 0], [G.player.dir === 1 ? -1 : G.player.dir === 2 ? 1 : 0, G.player.dir === 0 ? 1 : G.player.dir === 3 ? -1 : 0]] : [[0, 0]];
      area.forEach(([dx, dy]) => { const sk = m.soil.get(m.idx(tx + dx, ty + dy)); if (sk && t.water > 0) { sk.wet = true; t.water--; G.burst((tx + dx) * 16 + 8, (ty + dy) * 16 + 8, ['#7cc4ea', '#bfe6f5'], 6, { up: 30 }); } });
      VO.Audio.sfx('water'); VO.bus.emit('inv'); return;
    }
    if (tool === 'hoe') {
      if (o && o.kind === 'node' && o.type === 'weed') return gather(tx, ty, o, 1, 1);
      if (m.soil.has(m.idx(tx, ty))) { if (o && o.kind === 'crop' && o.stage === 0) { VO.UI.toast('Ya hay semillas aquí. Riégalas.', 'info'); } return; }
      if (!VO.isFarmTile(m, tx, ty) || o) { VO.UI.toast(o ? 'Primero despeja esa casilla.' : 'Solo puedes cultivar dentro de tu finca.', 'info'); return; }
      if (!G.useEnergy(cost)) return;
      swingAnim(tool); wear(tool);
      m.soil.set(m.idx(tx, ty), { wet: G.state.weather === 'lluvia' }); VO.Audio.sfx('till'); G.burst(px, py + 4, ['#7d5232', '#93653d'], 8, { up: 40 });
      VO.bus.emit('till');
      return;
    }
    // hacha, pico, pala sobre nodos
    if (o && o.kind === 'node') {
      const nd = VO.NODES[o.type];
      if (o.type === 'ladder') return G.interact();
      if (!nd) return;
      if (nd.tool && nd.tool !== tool) { VO.UI.toast(nd.name + ': necesitas ' + VO.TOOLS[nd.tool].name.toLowerCase() + '.', 'info'); VO.Analytics.game('herramienta_incorrecta', o.type); return; }
      if (nd.minTier && t.tier < nd.minTier) { VO.UI.toast('Este mineral es duro: mejora tu pico en la herrería.', 'warn'); return; }
      return gather(tx, ty, o, power, cost, tool);
    }
    if (tool === 'shovel') {
      const g = m.get(tx, ty);
      if (g === T.SAND) { if (!G.useEnergy(cost)) return; swingAnim(tool); wear(tool); G.giveOrDrop('sand', 1); VO.Audio.sfx('dig'); G.burst(px, py, ['#ecd59c', '#d4b877'], 8); return; }
    }
    swingAnim(tool);
  }
  function gather(tx, ty, o, power, cost, tool) {
    const m = G.map; const nd = VO.NODES[o.type]; if (!nd) return;
    const px = tx * 16 + 8, py = ty * 16 + 8;
    if (o.type === 'bush') {
      const k = m.idx(tx, ty);
      if (G.state.bushTaken[k]) { VO.UI.toast('Este guayabo ya no tiene frutas hoy.', 'info'); return; }
      G.state.bushTaken[k] = true; const n = 1 + ((Math.random() * 3) | 0); G.giveOrDrop('guayaba', n); VO.Audio.sfx('collect'); G.burst(px, py, ['#b7d65a', '#3f8a32'], 6); G.float('+' + n + ' Guayaba', px, py - 10); return;
    }
    if (!G.useEnergy(nd.energy ? Math.max(1, Math.round(cost || nd.energy)) : 0)) return;
    if (tool) { swingAnim(tool); wear(tool); }
    o.hp -= power; o.shake = 0.25;
    const col = { tree: ['#8a5e37', '#55a83d'], pine: ['#6e4a2c', '#3b8648'], palm: ['#a07848', '#45a03a'], mangotree: ['#8a5e37', '#479a40'], stump: ['#8a5e37'], rock: ['#8f8a84', '#aaa59e'], copper: ['#e07a3a', '#8f8a84'], iron: ['#c9d3db', '#77716b'], coal: ['#2a2624', '#8f8a84'], clay: ['#a8643a'], sandpile: ['#ecd59c'], weed: ['#5fae3c', '#86cf55'], shell: ['#f7b6a5'] }[o.type] || ['#ffffff'];
    G.burst(px, py - 4, col, 6);
    VO.Audio.sfx(tool === 'axe' ? 'chop' : tool === 'pick' ? 'pick' : tool === 'shovel' ? 'dig' : 'pop');
    if (o.hp > 0) return;
    // derribado
    for (const id in nd.drop) { const [a, b] = nd.drop[id]; const n = a + Math.floor(Math.random() * (b - a + 1)); if (n > 0) { const got = G.giveOrDrop(id, n); G.float('+' + n + ' ' + VO.ITEMS[id].name, px, py - 12 - Object.keys(nd.drop).indexOf(id) * 9); } }
    if (o.type === 'mangotree' && Math.random() < 0.7) G.giveOrDrop('mango', 1 + ((Math.random() * 2) | 0));
    VO.Audio.sfx('collect');
    G.burst(px, py - 6, col, 14, { up: 90 }); G.shake = Math.max(G.shake || 0, nd.stump || o.type === 'rock' || m.mine ? 2.5 : 1);
    for (const id in nd.drop) G.flyers.push({ id, x: px, y: py - 6, t: 0, d: 0.45 + Math.random() * 0.2 });
    const k = m.idx(tx, ty);
    if (m.mine) {
      m.setObj(tx, ty, o.ladder ? { kind: 'node', type: 'ladder' } : null);
      if (o.ladder) { VO.UI.toast('¡Encontraste una escalera hacia el nivel ' + (m.mine + 1) + '!', 'ok'); VO.Audio.sfx('good'); }
      return;
    }
    if (nd.stump) { m.setObj(tx, ty, { kind: 'node', type: 'stump', hp: VO.NODES.stump.hp, v: 0, from: o.type }); G.state.removed[k] = { type: o.type, day: G.state.day + nd.regen, v: o.v }; }
    else { m.setObj(tx, ty, null); if (o.type === 'stump') { if (!G.state.removed[k]) G.state.removed[k] = { type: o.from || 'tree', day: G.state.day + 4, v: 0 }; } else if (nd.regen) G.state.removed[k] = { type: o.type, day: G.state.day + nd.regen, v: o.v }; }
    VO.bus.emit('gather', o.type);
  }
  function plant(tx, ty, seedId) {
    const m = G.map; const soil = m.soil.get(m.idx(tx, ty));
    if (!soil) { VO.UI.toast('Prepara la tierra con la azada antes de sembrar.', 'info'); VO.Analytics.game('siembra_sin_preparar'); return; }
    if (m.obj(tx, ty)) { VO.UI.toast('Esa casilla ya está ocupada.', 'info'); return; }
    const crop = VO.ITEMS[seedId].crop;
    m.setObj(tx, ty, { kind: 'crop', crop, stage: 0, days: 0, max: 4 });
    G.removeItem(seedId, 1); VO.Audio.sfx('plant'); G.burst(tx * 16 + 8, ty * 16 + 10, ['#e8d8a0'], 4, { up: 20 });
  }
  function harvest(tx, ty, o) {
    const m = G.map; const c = VO.CROPS[o.crop];
    if (!G.canAdd(o.crop, 1)) { VO.UI.toast('Inventario lleno: vende o guarda algo antes de cosechar.', 'warn'); VO.Analytics.game('inventario_lleno', o.crop); VO.Audio.sfx('error'); return; }
    const n = 1 + (Math.random() < 0.2 ? 1 : 0);
    G.addItem(o.crop, n); VO.Audio.sfx('collect'); G.float('+' + n + ' ' + c.name, tx * 16 + 8, ty * 16 - 8);
    G.burst(tx * 16 + 8, ty * 16, [A.CROP_LOOK[o.crop].fruit, A.CROP_LOOK[o.crop].leaf], 10);
    if (c.regrow) { o.stage = 2; o.days = Math.floor(c.days * 0.5); } else m.setObj(tx, ty, null);
    VO.bus.emit('harvest', o.crop);
  }
  function place(tx, ty, id) {
    const m = G.map; const it = VO.ITEMS[id];
    const okMap = m.id === 'casa' || (m.id === 'valle' && tx >= 2 && tx < 42 && ty >= 26 && ty < 62);
    if (!okMap) { VO.UI.toast('Solo puedes construir en tu finca o dentro de tu casa.', 'info'); return; }
    if (m.solid(tx, ty) || m.obj(tx, ty) || (m.soil.has(m.idx(tx, ty)) && !it.floor) || (Math.floor(G.player.x / 16) === tx && Math.floor(G.player.y / 16) === ty && it.solid)) { VO.UI.toast('No se puede colocar ahí.', 'warn'); VO.Audio.sfx('error'); return; }
    m.setObj(tx, ty, { kind: 'place', id, store: id === 'chest' ? new Array(20).fill(null) : undefined });
    G.removeItem(id, 1); VO.Audio.sfx('craft'); G.burst(tx * 16 + 8, ty * 16 + 8, ['#c99159', '#e0b07a'], 8);
    if (id === 'lamp' && m.id === 'valle') G.maps.valle.cache = G.maps.valle.cache; // las luces se calculan en el render
    VO.bus.emit('place', id);
  }

  // Interacción (hablar, entrar, usar objetos)
  G.interact = function () {
    if (G.paused || G.warping) return;
    if (G.side) return VO.Gallery.interact();
    const p = G.player; const [fx, fy] = G.targetTile(); const m = G.map;
    // dueño detrás del mostrador
    if (m.npcId) { const n = G.npcs.find((nn) => nn.id === m.npcId); const sx = m.npcSpot.x * 16 + 8, sy = m.npcSpot.y * 16 + 12; if (n && n.state === 'work' && Math.hypot(sx - p.x, sy - p.y) < 50) return VO.UI.talk(n.id); }
    // NPC cercano
    if (m.id === 'valle') {
      let best = null, bd = 30;
      for (const n of G.npcs) { if (n.hidden) continue; const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n; } }
      const ex = VO.Extras && VO.Extras.near(p.x, p.y);
      if (ex && (!best || Math.hypot(ex.x - p.x, ex.y - p.y) < bd)) return VO.Extras.talk(ex);
      if (best) return VO.UI.talk(best.id);
      const near = G.animals.filter((q) => Math.hypot(q.x - p.x, q.y - p.y) < 22).sort((q, r) => Math.hypot(q.x - p.x, q.y - p.y) - Math.hypot(r.x - p.x, r.y - p.y));
      for (const a of near.slice(0, 1)) {
        if (a.ref.egg) { const pid = a.ref.type === 'cabra' ? 'leche' : 'egg'; if (G.addItem(pid, 1) === 0) { a.ref.egg = false; VO.Audio.sfx('collect'); G.float('+1 ' + VO.ITEMS[pid].name, a.x, a.y - 12); } else VO.UI.toast('Inventario lleno.', 'warn'); return; }
        a.ref.happy = Math.min(10, (a.ref.happy || 0) + 0.2); VO.Audio.sfx('cluck'); G.float('♥', a.x, a.y - 12, '#ff8fb5'); return;
      }
    }
    const o = m.obj(fx, fy);
    if (o && o.kind === 'node' && o.type === 'ladder') {
      if (o.up || (m.mine && fx === 4 && fy === 3)) { if (m.mine === 1) return G.warp('valle', 11, 7, 0); return G.warp('mina' + (m.mine - 1), 5, 5); }
      G.state.mineDeep = Math.max(G.state.mineDeep, m.mine + 1);
      return G.warp('mina' + (m.mine + 1), 5, 5);
    }
    if (o && o.kind === 'node' && o.type === 'lost') return VO.Events.pickLost(fx, fy, o);
    if (o && o.kind === 'place' && o.id === 'chest') return VO.UI.openStorage(o.store, 'Cofre');
    if (o && o.kind === 'place' && o.id === 'workbench') return VO.UI.openCraft('banco');
    if (o && o.kind === 'crop' && o.stage >= o.max && !o.deco) return harvest(fx, fy, o);
    if (o && o.kind === 'crop') { const c = VO.CROPS[o.crop]; const soil = m.soil.get(m.idx(fx, fy)); VO.UI.toast(c.name + ': ' + (o.stage >= o.max ? 'lista' : 'día ' + o.days + ' de ' + c.days) + (soil && soil.wet ? ' · regada' : ' · necesita agua'), 'info'); return; }
    const pr = m.propAt(fx, fy);
    if (pr && pr.interact) return G.propAction(pr.interact);
    const b = m.buildingAt(fx, fy);
    if (b && fy === b.y + b.h - 1) return G.enterBuilding(b);
    if (o && o.kind === 'node') return G.useTool();
  };
  G.propAction = function (what) {
    if (VO.MiniQuests && VO.MiniQuests.useProp(what)) return;
    if (what === 'bed') return VO.UI.confirm('¿Dormir hasta mañana? Se guardará la partida.', () => VO.UI.fade(() => G.endDay(false)));
    if (what === 'craft_banco') return VO.UI.openCraft('banco');
    if (what === 'empleos') return VO.UI.openJobs();
    if (what === 'bin') return VO.UI.openShop('bin');
    if (what === 'mail') return VO.UI.openMail();
    if (what === 'trough') {
      if (G.state.troughFull) { VO.UI.toast('El comedero ya tiene comida.', 'info'); return; }
      if (G.removeItem('fiber', 4)) { G.state.troughFull = true; G.rebuildValley(); VO.Audio.sfx('plant'); VO.UI.toast('Llenaste el comedero (4 fibras). Tus gallinas comerán mañana.', 'ok'); }
      else VO.UI.toast('Necesitas 4 fibras vegetales para llenar el comedero.', 'info');
      return;
    }
    if (what === 'npc') { const n = G.npcs.find((nn) => nn.id === G.map.npcId); if (n && n.state === 'work') return VO.UI.talk(n.id); return VO.UI.toast('No hay nadie atendiendo ahora.', 'info'); }
    if (what === 'storage') { G.state.storage = G.state.storage.length ? G.state.storage : new Array(40).fill(null); return VO.UI.openStorage(G.state.storage, 'Almacén del pueblo'); }
    if (what === 'library') return VO.UI.openLibrary();
    if (what === 'journal') return VO.UI.openJournal();
    if (what === 'craft_taller') return VO.UI.openCraft('taller');
    if (what === 'gallery') { const sp = G.map.props.find((pp) => pp.kind === 'shaft'); return VO.Gallery.enter(G.map.mine, { map: G.map.id, x: sp.x, y: sp.y + 1 }); }
    if (what === 'mine') { G.state.mineDeep = Math.max(1, G.state.mineDeep); return G.warp('mina1', 5, 5); }
  };
  G.enterBuilding = function (b) {
    if (b.enter === 'casa') return G.warp('casa', Math.floor(G.maps.casa.w / 2), G.maps.casa.h - 2, 3);
    if (b.id === 'taller' && !G.state.projects.taller) return VO.UI.toast('El taller familiar está en ruinas. Tomás puede ayudarte a restaurarlo (proyectos de obra en la carpintería).', 'info');
    if (VO.INTERIOR_IDS.includes(b.id)) {
      const h = G.hour(); const open = b.id === 'banco' ? [9, 17] : b.id === 'almacen' || b.id === 'taller' ? [6, 26] : [8, 18];
      if (h < open[0] || h >= open[1]) return VO.UI.toast(b.name + ' está cerrado. Abre de ' + open[0] + ':00 a ' + (open[1] % 24) + ':00.', 'info');
      if (!G.maps['int_' + b.id]) G.maps['int_' + b.id] = VO.buildInterior(b.id);
      const im = G.maps['int_' + b.id]; return G.warp('int_' + b.id, im.door.x, im.h - 2, 3);
    }
    if (b.enterUI === 'almacen') { G.state.storage = G.state.storage.length ? G.state.storage : new Array(40).fill(null); return VO.UI.openStorage(G.state.storage, 'Almacén del pueblo'); }
    if (b.home) return VO.UI.toast(b.name + '. Mejor no entrar sin invitación.', 'info');
    if (b.npc) {
      const h = G.hour(); const open = b.npc === 'elena' ? [9, 17] : [8, 18];
      if (h < open[0] || h >= open[1]) return VO.UI.toast(b.name + ' está cerrado. Abre de ' + open[0] + ':00 a ' + open[1] + ':00.', 'info');
      return VO.UI.openNPCService(b.npc);
    }
  };

  // Consejos que aparecen una sola vez, cuando hacen falta
  G.tips = function () {
    const s = G.state; const sel = G.selected(); const m = G.map; const h = G.hour();
    const tip = (k, msg) => { if (s.seen['tip_' + k]) return false; s.seen['tip_' + k] = true; VO.UI.toast(msg, 'info'); return true; };
    if (m.id === 'valle' && sel && VO.ITEMS[sel.id].cat === 'seed' && tip('seed', 'Para sembrar: prepara la tierra con la azada (1), elige las semillas y pulsa Usar sobre la casilla. Luego riégala con la regadera (2).')) return;
    if (m.id === 'valle' && sel && sel.id === 'rod' && tip('rod', 'Para pescar: párate junto al agua, mírala y pulsa Usar. En el muelle de la playa hay peces de mar.')) return;
    if (sel && VO.ITEMS[sel.id].cat === 'place' && tip('place', 'Verás una vista previa del objeto. Apunta a una casilla libre y pulsa Usar para colocarlo. El martillo lo recoge.')) return;
    if (h >= 22 && tip('late', 'Ya es tarde. Duerme en tu cama antes de las 2:00 para recuperar toda tu energía.')) return;
    if (s.energy < 20 && tip('tired', 'Te queda poca energía. Come algo (selecciónalo y pulsa Usar) o descansa en tu cama.')) return;
    if (G.countCat('crop') > 0 && tip('sell', 'Puedes vender tu cosecha en el mercado de Clara o dejarla en el cajón de envío junto a tu casa.')) return;
    if (s.inv.every((x) => x) && tip('full', 'Tu inventario está lleno. Vende cosas o guárdalas en el almacén del pueblo.')) return;
    if (m.mine === 2 && tip('shaft', 'En este nivel hay un pozo con escalera: lleva a la galería profunda, con vista lateral.')) return;
  };
  // ------------------------------------------------------------ BUCLE
  G.loop = function (now) {
    const dt = Math.min(0.05, (now - G.last) / 1000); G.last = now;
    if (G.running) { G.update(dt); G.render(); }
    else if (VO.Title && VO.Title.active) VO.Title.render(dt);
    requestAnimationFrame(G.loop);
  };
  let lastHour = -1, musicT = 0;
  G.update = function (dt) {
    G.t += dt;
    if (G.paused) return;
    if (G.side) { G.state.time += dt * MIN_PER_SEC; G.state.played += dt; if (Math.floor(G.state.time) % 10 === 0) VO.bus.emit('time'); if (G.state.time >= 26 * 60) { G.side = null; G.passOut(); return; } VO.Gallery.update(dt); return; }
    const s = G.state;
    s.played += dt;
    const prevH = Math.floor(G.hour());
    s.time += dt * MIN_PER_SEC;
    if (s.time >= 26 * 60) G.passOut();
    const h = Math.floor(G.hour());
    if (h !== lastHour) { lastHour = h; G.updateNPCSchedule(false); VO.bus.emit('time'); if (h === 18) VO.UI.toast('Atardece en el valle. Las tiendas cierran pronto.', 'info'); }
    if (Math.floor(s.time) % 10 === 0 && Math.floor(s.time - dt * MIN_PER_SEC) % 10 !== 0) VO.bus.emit('time');
    musicT -= dt; if (musicT <= 0) { musicT = 2; VO.Audio.ambient(G.ambientKind(), 2); G.playMusic(); VO.Audio.setRain(s.weather === 'lluvia' && !G.map.indoor && !G.map.mine); }
    if (G.swing > 0) G.swing -= dt;
    if (!G.warping) updatePlayer(dt); updateNPCs(dt); updateAnimals(dt); if (VO.Extras) VO.Extras.update(dt); if (VO.MiniQuests) VO.MiniQuests.updateBall(dt); if (G.player.moving) G.player.sit = false;
    // partículas
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 10);
    G.flyers = G.flyers.filter((f) => { f.t += dt; return f.t < f.d; });
    G.particles = G.particles.filter((p) => { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.life > 0; });
    G.floats = G.floats.filter((f) => { f.life -= dt; f.y -= 14 * dt; return f.life > 0; });
    ambient(dt);
    G.map.objs.forEach((o) => { if (o.shake > 0) o.shake -= dt; });
    if (s.mode === 'aula') VO.UI.aulaTick();
    G.tipT = (G.tipT || 0) - dt; if (G.tipT <= 0) { G.tipT = 1.5; G.tips(); }
  };
  // Partículas ambientales (mariposas, luciérnagas, hojas, lluvia)
  G.amb = [];
  function ambient(dt) {
    const h = G.hour(); const m = G.map; const cam = G.cam; const vw = G.vw, vh = G.vh;
    const want = VO.Settings.reduceMotion ? 6 : m.mine ? 10 : m.indoor ? 4 : 22;
    while (G.amb.length < want) {
      const night = h >= 19 || h < 6;
      const type = m.mine ? 'dust' : m.indoor ? 'mote' : night ? 'firefly' : Math.random() < 0.5 ? 'leaf' : 'butterfly';
      G.amb.push({ type, x: cam.x + Math.random() * vw, y: cam.y + Math.random() * vh, t: Math.random() * 10, life: 4 + Math.random() * 6, c: ['#ffd84a', '#ff8fb5', '#ffffff', '#8fd0ee'][(Math.random() * 4) | 0] });
    }
    G.amb = G.amb.filter((a) => {
      a.t += dt; a.life -= dt;
      if (a.type === 'leaf') { a.x += 14 * dt; a.y += 8 * dt + Math.sin(a.t * 3) * 0.3; }
      else if (a.type === 'butterfly') { a.x += Math.sin(a.t * 1.3) * 18 * dt; a.y += Math.cos(a.t * 1.7) * 12 * dt; }
      else if (a.type === 'firefly') { a.x += Math.sin(a.t * 0.9) * 8 * dt; a.y += Math.cos(a.t * 1.1) * 6 * dt; }
      else { a.y -= 3 * dt; a.x += Math.sin(a.t) * 2 * dt; }
      return a.life > 0 && a.x > cam.x - 20 && a.x < cam.x + vw + 20 && a.y > cam.y - 20 && a.y < cam.y + vh + 20;
    });
    if (G.state.weather === 'lluvia' && !m.indoor && !m.mine) {
      G.rain = G.rain || [];
      const n = VO.Settings.reduceMotion ? 40 : 120;
      while (G.rain.length < n) G.rain.push({ x: cam.x + Math.random() * (vw + 60), y: cam.y - Math.random() * vh, v: 220 + Math.random() * 80 });
      G.rain.forEach((r) => { r.y += r.v * dt; r.x -= r.v * 0.25 * dt; if (r.y > cam.y + vh) { if (Math.random() < 0.3) G.particles.push({ x: r.x, y: cam.y + Math.random() * vh, vx: 0, vy: -20, g: 100, life: 0.15, c: '#bfe6f5', s: 1 }); r.y = cam.y - 10; r.x = cam.x + Math.random() * (vw + 60); } });
    } else G.rain = null;
  }

  // ------------------------------------------------------------ RENDER
  const sprites = {};
  function treeSpr(kind, v) { const k = kind + v; if (!sprites[k]) sprites[k] = kind === 'palm' ? A.makePalm(77 + v) : kind === 'pine' ? A.makePine(55 + v) : A.makeTree(11 + v * 7, kind); return sprites[k]; }
  function nodeSpr(o) {
    switch (o.type) {
      case 'tree': return treeSpr(o.flower ? 'flamboyan' : 'ceiba', o.v);
      case 'mangotree': return treeSpr('mango', o.v);
      case 'palm': return treeSpr('palm', o.v);
      case 'pine': return treeSpr('pine', o.v);
      case 'stump': return sprites.stump || (sprites.stump = A.makeStump());
      case 'weed': return sprites['weed' + o.v] || (sprites['weed' + o.v] = A.makeWeed(o.v + 3));
      case 'bush': return sprites.bush || (sprites.bush = A.makeBush(5, true));
      case 'bushE': return sprites.bushE || (sprites.bushE = A.makeBush(5, false));
      case 'ladder': return A.prop('ladder');
      case 'lost': return A.icon(o.item);
      case 'shell': return A.icon('concha');
      case 'sandpile': return sprites.sandp || (sprites.sandp = (function () { const [c, g] = A.cv(16, 16); A.ell(g, 8, 11, 6, 3, '#e2c88a'); A.ell(g, 8, 10, 4, 2, '#f4e2b4'); return A.outline(c, '#b89a5a'); })());
      case 'clay': return sprites.clayR || (sprites.clayR = A.makeRock(3, 'clay'));
      default: { const k = 'rk' + o.type + (o.v || 0); return sprites[k] || (sprites[k] = A.makeRock(19 + (o.v || 0), o.type === 'rock' ? 'stone' : o.type)); }
    }
  }
  function cropSpr(o) { const k = 'cr' + o.crop + Math.min(o.stage, o.max || 4); return sprites[k] || (sprites[k] = A.makeCrop(o.crop, Math.min(o.stage, o.max || 4), (o.max || 4) + 1)); }

  G.resize = function () {
    const c = G.canvas; const W = window.innerWidth, H = window.innerHeight;
    const target = VO.Settings.zoom || 0;
    // Resolución interna ×2 (arte HD): la escala en pantalla es par para que cada píxel sea nítido.
    let sc = target || Math.max(2, 2 * Math.floor(Math.min(W / 400, H / 250) / 2));
    sc = Math.max(2, sc - (sc % 2));
    const RS = VO.Art.RS || 1;
    G.scale = sc; G.vw = Math.ceil(W / sc); G.vh = Math.ceil(H / sc);
    c.width = G.vw * RS; c.height = G.vh * RS; c.style.width = G.vw * sc + 'px'; c.style.height = G.vh * sc + 'px';
    G.ctx = c.getContext('2d'); G.ctx.imageSmoothingEnabled = false; G.ctx.setTransform(RS, 0, 0, RS, 0, 0);
  };
  function groundCache(m) {
    if (m.cache) return m.cache;
    if (VO.Art.groundPeek) { const hit = VO.Art.groundPeek(m); if (hit) return (m.cache = hit); }
    const [c, g] = A.cv(m.w * 16, m.h * 16);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) A.drawTile(g, m, x, y);
    m.cache = VO.Art.groundHD ? VO.Art.groundHD(c, m) : c; return m.cache;
  }
  function darkness() {
    const m = G.map; if (m.mine) return { a: m.dark, c: '8,6,18' };
    if (m.indoor) { const h = G.hour(); return { a: h >= 19 || h < 6 ? 0.35 : 0, c: '20,12,40' }; }
    const h = G.hour(); let a = 0, c = '20,24,70';
    if (h < 6.5) { a = 0.45; } else if (h < 7.5) { a = 0.45 * (7.5 - h); c = '90,50,60'; }
    else if (h < 17) a = 0;
    else if (h < 19) { a = (h - 17) * 0.12; c = '120,50,40'; }
    else if (h < 21) { a = 0.24 + (h - 19) * 0.14; c = '30,24,80'; }
    else a = 0.55;
    if (G.state.weather === 'lluvia') a = Math.max(a, 0.18); else if (G.state.weather === 'nublado') a = Math.max(a, 0.08);
    return { a, c };
  }
  G.render = function () {
    G.ctx.setTransform(VO.Art.RS || 1, 0, 0, VO.Art.RS || 1, 0, 0); G.ctx.imageSmoothingEnabled = false;
    if (G.side) return VO.Gallery.render();
    const g = G.ctx, m = G.map, p = G.player, cam = G.cam;
    const vw = G.vw, vh = G.vh;
    // cámara suave
    const tx = VO.clamp(p.x - vw / 2, 0, Math.max(0, m.w * 16 - vw)), ty = VO.clamp(p.y - 8 - vh / 2, 0, Math.max(0, m.h * 16 - vh));
    if (cam.snap) { cam.x = tx; cam.y = ty; cam.snap = false; } else { cam.x += (tx - cam.x) * 0.15; cam.y += (ty - cam.y) * 0.15; }
    if (m.w * 16 < vw) cam.x = (m.w * 16 - vw) / 2; if (m.h * 16 < vh) cam.y = (m.h * 16 - vh) / 2;
    let cx = Math.round(cam.x), cy = Math.round(cam.y);
    if (G.shake > 0 && !VO.Settings.reduceMotion) { cx += Math.round((Math.random() - 0.5) * G.shake * 2); cy += Math.round((Math.random() - 0.5) * G.shake * 2); }
    g.fillStyle = m.mine ? '#0c0908' : m.indoor ? '#1a120c' : '#2a6fa8'; g.fillRect(0, 0, vw, vh);
    g.drawImage(groundCache(m), -cx, -cy);
    const x0 = Math.max(0, Math.floor(cx / 16)), y0 = Math.max(0, Math.floor(cy / 16)), x1 = Math.min(m.w, Math.ceil((cx + vw) / 16) + 1), y1 = Math.min(m.h, Math.ceil((cy + vh) / 16) + 2);
    // agua animada
    if (!VO.Settings.reduceMotion || true) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const t = m.get(x, y); if (t !== T.WATER && t !== T.DEEP) continue;
      const ph = (G.t * 0.8 + VO.hash(x, y, 9) * 6) % 6;
      if (ph < 1.2) { const sx = x * 16 + ((VO.hash(x, y, 1) * 12) | 0) - cx, sy = y * 16 + ((VO.hash(x, y, 2) * 12) | 0) - cy; g.fillStyle = 'rgba(220,245,255,' + (0.7 - ph * 0.5) + ')'; g.fillRect(sx, sy, 2 + (ph * 2 | 0), 1); }
      const wv = Math.sin(G.t * 1.5 + x * 0.7 + y * 0.4); if (wv > 0.85) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x * 16 - cx + 3, y * 16 - cy + 8, 6, 1); }
    }
    // suelo cultivado
    m.soil.forEach((s, k) => { const x = k % m.w, y = (k / m.w) | 0; if (x < x0 || x >= x1 || y < y0 || y >= y1) return; const hs = (dx, dy) => m.soil.has(m.idx(x + dx, y + dy)); g.drawImage(A.soilFor(s.wet, hs(0, -1), hs(1, 0), hs(0, 1), hs(-1, 0)), x * 16 - cx, y * 16 - cy); });
    // objetos de suelo (caminos y alfombras)
    const list = [];
    for (let y = y0; y < y1; y++) for (let x = x0 - 1; x < x1 + 1; x++) {
      const o = m.obj(x, y); if (!o) continue;
      if (o.kind === 'place' && VO.ITEMS[o.id] && VO.ITEMS[o.id].floor) { g.drawImage(A.placeable(o.id), x * 16 - cx, y * 16 - cy); continue; }
      list.push({ y: y * 16 + 15, o, x });
    }
    m.buildings.forEach((b) => { if ((b.x + b.w) * 16 < cx || b.x * 16 > cx + vw || (b.y + b.h) * 16 < cy || (b.y - 8) * 16 > cy + vh) return; list.push({ y: (b.y + b.h) * 16, b }); });
    m.props.forEach((pr) => { const spr = A.prop(pr.kind); const bx = pr.bx !== undefined ? pr.bx : pr.x, by = pr.by !== undefined ? pr.by : pr.y; const px = pr.px !== undefined ? pr.px : bx * 16 + Math.round(((pr.bw || 1) * 16 - lw(spr)) / 2), py = pr.py !== undefined ? pr.py : (by + (pr.bh || 1)) * 16 - lh(spr); if (pr.floor) { g.drawImage(spr, px - cx, py - cy); return; } if (px + lw(spr) < cx || px > cx + vw || py + lh(spr) < cy || py > cy + vh) return; list.push({ y: py + lh(spr) - (pr.kind === 'mine' ? 0 : 1), pr, spr, px, py }); });
    if (m.npcId) { const n = G.npcs.find((nn) => nn.id === m.npcId); if (n && n.state === 'work') list.push({ y: m.npcSpot.y * 16 + 12, npc: { id: n.id, def: n.def, x: m.npcSpot.x * 16 + 8, y: m.npcSpot.y * 16 + 12, frame: 0, dir: 0 } }); }
    if (m.id === 'valle') {
      G.npcs.forEach((n) => { if (!n.hidden) list.push({ y: n.y, npc: n }); });
      G.animals.forEach((a) => list.push({ y: a.y, an: a }));
      if (VO.Extras) VO.Extras.entities().forEach((ex) => list.push({ y: ex.y, extra: ex }));
      if (VO.MiniQuests && VO.MiniQuests.ball) list.push({ y: VO.MiniQuests.ball.y, ball: true });
    }
    G.drops.forEach((d) => { if (d.map === m.id) list.push({ y: d.y, drop: d }); });
    list.push({ y: p.y, player: true });
    list.sort((a, b) => a.y - b.y);
    for (const e of list) drawEntity(g, e, cx, cy);
    // cursor de casilla objetivo
    if (!G.paused && !VO.UI.anyOpen()) {
      const sel = G.selected(); const [tx2, ty2] = G.targetTile();
      if (sel && VO.ITEMS[sel.id] && (VO.ITEMS[sel.id].cat !== 'food')) {
        const it = VO.ITEMS[sel.id];
        if (it.cat === 'place') { const spr = A.placeable(sel.id); g.globalAlpha = 0.55; g.drawImage(spr, tx2 * 16 - cx, ty2 * 16 + 16 - lh(spr) - cy); g.globalAlpha = 1; }
        const bad = it.cat === 'place' && (m.solid(tx2, ty2) || m.obj(tx2, ty2));
        g.strokeStyle = bad ? 'rgba(255,90,70,0.9)' : 'rgba(255,255,255,0.75)'; g.lineWidth = 1; g.strokeRect(tx2 * 16 - cx + 0.5, ty2 * 16 - cy + 0.5, 15, 15);
      }
    }
    // partículas
    G.particles.forEach((pt) => { g.fillStyle = pt.c; g.fillRect(Math.round(pt.x - cx), Math.round(pt.y - cy), pt.s, pt.s); });
    // ambiente
    G.amb.forEach((a) => {
      const ax = Math.round(a.x - cx), ay = Math.round(a.y - cy);
      if (a.type === 'leaf') { g.fillStyle = '#86c94e'; g.fillRect(ax, ay, 2, 1); }
      else if (a.type === 'butterfly') { const f = Math.sin(a.t * 14) > 0; g.fillStyle = a.c; g.fillRect(ax - (f ? 1 : 0), ay, f ? 1 : 2, 1); g.fillRect(ax + 1, ay, f ? 1 : 2, 1); }
      else if (a.type === 'firefly') { /* se dibujan en la capa de luz */ }
      else { g.fillStyle = 'rgba(255,240,200,0.35)'; g.fillRect(ax, ay, 1, 1); }
    });
    // banderines
    if (m.bunting) m.bunting.forEach(([x1, y1, x2, y2], bi) => { const n = 14; g.strokeStyle = '#5a3a22'; g.lineWidth = 1; g.beginPath(); const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 14 + Math.sin(G.t * 2 + i) * 0.6; pts.push([x, y]); i ? g.lineTo(x - cx, y - cy) : g.moveTo(x - cx, y - cy); } g.stroke(); const cols = ['#c8202a', '#1a3a8a', '#ffffff', '#f2cf3a', '#3f8a32', '#e2508a']; pts.forEach(([x, y], i) => { if (!i || i === n) return; g.fillStyle = cols[(i + bi) % cols.length]; g.beginPath(); g.moveTo(x - cx - 3, y - cy); g.lineTo(x - cx + 3, y - cy); g.lineTo(x - cx, y - cy + 6); g.fill(); }); });
    // objetos que vuelan hacia el jugador
    G.flyers.forEach((f) => { const t = Math.min(1, f.t / f.d); const x = f.x + (p.x - f.x) * t, y = f.y + (p.y - 14 - f.y) * t - Math.sin(t * Math.PI) * 18; g.drawImage(A.icon(f.id), Math.round(x - cx - 5), Math.round(y - cy - 5), 10, 10); });
    // lluvia
    if (G.rain) { g.strokeStyle = 'rgba(190,225,255,0.55)'; g.beginPath(); G.rain.forEach((r) => { g.moveTo(r.x - cx, r.y - cy); g.lineTo(r.x - cx - 2, r.y - cy + 6); }); g.stroke(); }
    // sombras de nubes
    if (!m.indoor && !m.mine && G.state.weather !== 'lluvia') { g.fillStyle = 'rgba(20,40,60,0.07)'; for (let i = 0; i < 4; i++) { const sx = ((G.t * 6 + i * 520) % (m.w * 16 + 400)) - 200 - cx, sy = (i * 377 + 120) % (m.h * 16) - cy; if (sx < -200 || sx > vw + 200 || sy < -120 || sy > vh + 120) continue; g.beginPath(); g.ellipse(sx, sy, 110, 55, 0, 0, 6.29); g.ellipse(sx + 70, sy + 20, 70, 40, 0, 0, 6.29); g.fill(); } }
    // iluminación
    lighting(g, cx, cy, vw, vh);
    // textos flotantes
    G.floats.forEach((f) => { const a = Math.min(1, f.life * 2); const im = A.pixelText(f.text, f.c.length === 7 ? f.c : '#ffffff'); g.globalAlpha = a; g.drawImage(im, Math.round(f.x - cx - im.width / 2), Math.round(f.y - cy - 9)); g.globalAlpha = 1; });
  };

  function shadow(g, x, y, w) { g.fillStyle = 'rgba(20,30,10,0.28)'; g.beginPath(); g.ellipse(x, y, w, w * 0.35, 0, 0, 6.29); g.fill(); }
  function drawEntity(g, e, cx, cy) {
    if (e.extra) return VO.Extras.draw(g, e.extra, cx, cy);
    if (e.ball) return VO.MiniQuests.drawBall(g, cx, cy);
    if (e.player || e.npc) {
      const c = e.player ? G.player : e.npc; const L = e.player ? G.state.look : c.def.look;
      const sh = A.charSheet(L);
      const x = Math.round(c.x - cx), y = Math.round(c.y - cy) + (e.player && c.sit ? 3 : 0);
      shadow(g, x, y, 6);
      const blinkF = c.frame === 0 && ((G.t * 1000 + (c.id ? c.id.length * 977 : 311)) % 3800) < 140; const idle = c.frame === 0 && !VO.Settings.reduceMotion && Math.sin(G.t * 2.4 + (c.id ? c.id.length * 1.7 : 0)) > 0.55 ? 1 : 0;
      const fc = blinkF ? 3 : c.frame; g.drawImage(sh, fc * 16, c.dir * 36, 16, 32, x - 8, y - 34 + idle, 16, 32); g.drawImage(sh, fc * 16, c.dir * 36 + 32, 16, 4, x - 8, y - 2, 16, 4);
      if (e.player && G.swing > 0) drawSwing(g, x, y);
      if (e.npc) {
        const ms = VO.MISSIONS.find((mm) => mm.npc === c.id && ['available', 'action', 'notebook'].includes(G.state.missions[mm.id].status) && (G.state.mode === 'aula' || mm.chapter <= G.state.chapter));
        if (ms) { const b = Math.round(Math.sin(G.t * 4) * 1.5); const st = G.state.missions[ms.id].status; g.fillStyle = '#2a1b12'; g.fillRect(x - 3, y - 45 + b, 7, 9); g.fillStyle = st === 'available' ? '#ffd84a' : '#8fd0ee'; g.fillRect(x - 2, y - 44 + b, 5, 7); g.fillStyle = '#2a1b12'; if (st === 'available') { g.fillRect(x, y - 43 + b, 1, 3); g.fillRect(x, y - 39 + b, 1, 1); } else { g.fillRect(x - 1, y - 41 + b, 1, 1); g.fillRect(x + 1, y - 41 + b, 1, 1); } }
      }
      return;
    }
    if (e.an) { const a = e.an; const x = Math.round(a.x - cx), y = Math.round(a.y - cy); shadow(g, x, y, 5); const goat = a.ref.type === 'cabra'; const f = (goat ? A.goat : A.chicken)[Math.floor(a.f) % 2]; const oy = goat ? 15 : 13; if (a.vx < 0) { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(f, -lw(f) / 2, y - oy); g.restore(); } else g.drawImage(f, x - lw(f) / 2, y - oy); if (a.ref.egg) { g.drawImage(A.icon(goat ? 'leche' : 'egg'), x - 4, y - oy - 13, 8, 8); } return; }
    if (e.drop) { const d = e.drop; const b = Math.sin(G.t * 4 + d.x) * 2; shadow(g, d.x - cx, d.y - cy, 4); g.drawImage(A.icon(d.id), Math.round(d.x - cx - 6), Math.round(d.y - cy - 14 + b), 12, 12); return; }
    if (e.b) {
      const b = e.b; const bd = A.building(b); if (bd.chimney && !b.broken && !VO.Settings.reduceMotion && Math.random() < 0.05) G.particles.push({ x: b.x * 16 + bd.chimney.x + Math.random() * 3, y: (b.y + b.h) * 16 - lh(bd.canvas) + 4, vx: 3 + Math.random() * 3, vy: -10, g: -3, life: 2, c: 'rgba(225,225,225,0.45)', s: 2 }); g.fillStyle = 'rgba(20,30,10,0.22)'; g.fillRect(b.x * 16 - cx + 2, (b.y + b.h) * 16 - cy, b.w * 16 - 4, 3); g.fillStyle = 'rgba(20,30,10,0.12)'; g.fillRect(b.x * 16 - cx + 4, (b.y + b.h) * 16 - cy + 3, b.w * 16 - 8, 2); g.drawImage(bd.canvas, b.x * 16 - cx, (b.y + b.h) * 16 - lh(bd.canvas) - cy);
      return;
    }
    if (e.pr) { g.drawImage(e.spr, Math.round(e.px - cx), Math.round(e.py - cy)); if (e.pr.interact === 'mail' && VO.Events && VO.Events.unread()) { const b = Math.round(Math.sin(G.t * 4) * 1.5); const x = Math.round(e.px - cx) + 4, y = Math.round(e.py - cy) - 10 + b; g.fillStyle = '#2a1b12'; g.fillRect(x - 1, y - 1, 9, 7); g.fillStyle = '#f4efe4'; g.fillRect(x, y, 7, 5); g.fillStyle = '#c2453a'; g.fillRect(x + 3, y + 2, 1, 1); } return; }
    const o = e.o, x = e.x * 16 - cx, y = o.y * 16 - cy;
    if (o.kind === 'node') {
      const spr = nodeSpr(o.type === 'bush' && G.state.bushTaken[G.map.idx(o.x, o.y)] ? { type: 'bushE' } : o);
      const sh = o.shake > 0 ? Math.round(Math.sin(o.shake * 60) * 1.5) : 0;
      if (o.type === 'lost') { const tw = Math.sin(G.t * 6 + o.x) > 0.3; g.drawImage(spr, x + 2, y + 4, 12, 12); if (tw) { g.fillStyle = '#fff6c8'; g.fillRect(x + 12, y + 2, 1, 3); g.fillRect(x + 11, y + 3, 3, 1); } return; }
      const big = lw(spr) > 16;
      if (big) { const pl = G.player; const behind = pl.y < o.y * 16 + 14 && pl.y > o.y * 16 + 16 - lh(spr) + 8 && Math.abs(pl.x - (o.x * 16 + 8)) < lw(spr) / 2 - 2; if (behind) g.globalAlpha = 0.55; shadow(g, x + 8, y + 14, lw(spr) / 3); if (o.type !== 'pine' && !VO.Settings.reduceMotion) { const sway = Math.sin(G.t * 1.2 + o.x) * 0.6; g.drawImage(spr, 0, 0, lw(spr), lh(spr) - 14, x + 8 - lw(spr) / 2 + sh + sway, y + 16 - lh(spr), lw(spr), lh(spr) - 14); g.drawImage(spr, 0, lh(spr) - 14, lw(spr), 14, x + 8 - lw(spr) / 2 + sh, y + 2, lw(spr), 14); } else g.drawImage(spr, x + 8 - lw(spr) / 2 + sh, y + 16 - lh(spr)); g.globalAlpha = 1; }
      else g.drawImage(spr, x + sh, y + 16 - lh(spr));
      return;
    }
    if (o.kind === 'crop') { const spr = cropSpr(o); g.drawImage(spr, x, y + 16 - lh(spr) + 2); if (o.stage >= o.max && !o.deco && Math.sin(G.t * 3 + o.x) > 0.7) { g.fillStyle = '#fff6c8'; g.fillRect(x + 12, y - 4, 1, 1); } return; }
    if (o.kind === 'place') {
      let spr;
      if (o.id === 'fence') { const f = (dx, dy) => { const q = G.map.obj(o.x + dx, o.y + dy); return q && q.id === 'fence'; }; spr = A.placeable('fence', (f(-1, 0) ? 'l' : '') + (f(1, 0) ? 'r' : '') + (f(0, -1) ? 'u' : '') + (f(0, 1) ? 'd' : '')); }
      else spr = A.placeable(o.id);
      g.drawImage(spr, x + 8 - lw(spr) / 2, y + 16 - lh(spr));
    }
  }
  function drawSwing(g, x, y) {
    const p = G.player; const t = 1 - G.swing / 0.28; const icon = A.icon(VO.iconOf(G.swingTool) + G.state.tools[G.swingTool].tier);
    const d = p.dir; const ang = (d === 1 ? -1 : 1) * (-1.2 + t * 2.2);
    g.save();
    const ox = d === 1 ? -6 : d === 2 ? 6 : d === 3 ? 0 : 2, oy = d === 3 ? -18 : -10;
    g.translate(x + ox, y + oy); g.rotate(d === 0 || d === 3 ? ang * 0.8 : ang); g.drawImage(icon, -2, -14, 12, 12); g.restore();
  }
  // capa de luz
  let lc = null;
  function lighting(g, cx, cy, vw, vh) {
    const { a, c } = darkness();
    if (a <= 0.01) return;
    if (!lc || lc.width !== vw || lc.height !== vh) { lc = VO.makeCanvas(vw, vh); }
    const l = lc.getContext('2d');
    l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, vw, vh);
    l.fillStyle = 'rgba(' + c + ',' + a + ')'; l.fillRect(0, 0, vw, vh);
    l.globalCompositeOperation = 'destination-out';
    const night = G.hour() >= 18.5 || G.hour() < 6.5 || G.map.mine || G.map.indoor || a > 0.15;
    const hole = (x, y, r, k) => { const gr = l.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,' + k + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = gr; l.beginPath(); l.arc(x, y, r, 0, 6.29); l.fill(); };
    const lights = [];
    if (night) {
      G.map.lights.forEach((L) => lights.push(L));
      if (G.map.bunting && G.isFiesta()) G.map.bunting.forEach(([x1, y1, x2, y2]) => { for (let i = 1; i < 6; i++) lights.push({ x: x1 + (x2 - x1) * i / 6, y: y1 + (y2 - y1) * i / 6 + Math.sin(i / 6 * Math.PI) * 14, r: 26, c: ['rgba(255,120,120,', 'rgba(255,220,120,', 'rgba(140,200,255,'][i % 3] }); });
      G.map.objs.forEach((o) => { if (o.kind === 'place' && o.id === 'lamp') lights.push({ x: o.x * 16 + 8, y: o.y * 16 - 10, r: 50, c: 'rgba(255,214,120,' }); });
      G.map.buildings.forEach((b) => { if (b.broken) return; const bd = A.building(b); bd.windows.forEach((w) => lights.push({ x: b.x * 16 + w.x + 6, y: (b.y + b.h) * 16 - lh(bd.canvas) + w.y + 6, r: 22, c: 'rgba(255,200,110,', win: w, b, top: (b.y + b.h) * 16 - lh(bd.canvas) })); });
    }
    const pr = G.map.mine ? 78 : G.map.indoor ? 60 : 34;
    hole(G.player.x - cx, G.player.y - 10 - cy, pr, G.map.mine ? 1 : 0.8);
    lights.forEach((L) => hole(L.x - cx, L.y - cy, L.r, 0.95));
    G.amb.forEach((f) => { if (f.type === 'firefly') hole(f.x - cx, f.y - cy, 6, 0.9); });
    g.imageSmoothingEnabled = true; g.drawImage(lc, 0, 0); g.imageSmoothingEnabled = false;
    // resplandor cálido aditivo
    g.globalCompositeOperation = 'lighter';
    lights.forEach((L) => {
      const x = L.x - cx, y = L.y - cy; if (x < -60 || y < -60 || x > vw + 60 || y > vh + 60) return;
      if (L.win) { g.fillStyle = 'rgba(255,190,90,' + 0.35 * a + ')'; g.fillRect(L.b.x * 16 + L.win.x - cx, L.top + L.win.y - cy, L.win.w, L.win.h); }
      const gr = g.createRadialGradient(x, y, 0, x, y, L.r * 0.7); gr.addColorStop(0, L.c + (0.3 * a) + ')'); gr.addColorStop(1, L.c + '0)'); g.fillStyle = gr; g.fillRect(x - L.r, y - L.r, L.r * 2, L.r * 2);
    });
    G.amb.forEach((f) => { if (f.type === 'firefly') { const k = 0.5 + Math.sin(f.t * 5) * 0.5; g.fillStyle = 'rgba(220,255,120,' + k + ')'; g.fillRect(Math.round(f.x - cx), Math.round(f.y - cy), 1, 1); } });
    g.globalCompositeOperation = 'source-over';
  }

  // ------------------------------------------------------------ EFECTOS DE MISIONES
  G.applyEffect = function (ef, x) {
    const ev = (e) => Math.round((e.a * x + e.b) * 100) / 100;
    if (ef.take) for (const k in ef.take) G.removeItem(k, ev(ef.take[k]));
    if (ef.takeCat) for (const k in ef.takeCat) G.removeCat(k, ev(ef.takeCat[k]));
    if (ef.give) for (const k in ef.give) { const n = ev(ef.give[k]); if (n > 0) G.giveOrDrop(k, n); }
    if (ef.money) { const v = ev(ef.money); if (v > 0) G.earn(v, 'mision'); else if (v < 0) G.spend(-v, 'mision'); }
    if (ef.hours) G.advanceTime(ev(ef.hours) * 60);
    if (ef.energy) { G.state.energy = VO.clamp(G.state.energy + ev(ef.energy), 0, G.state.maxEnergy); VO.bus.emit('energy'); }
    if (ef.house === 'windows') { G.state.house.windows = true; G.rebuildValley(); }
    if (ef.house === 'extension') { G.state.house.extension = true; G.rebuildValley(); }
    if (ef.animals) { if (!G.state.projects.gallinero) { G.state.projects.gallinero = true; G.rebuildValley(); } for (let i = 0; i < ef.animals; i++) G.addAnimal(); }
    if (ef.waterAll) G.maps.valle.soil.forEach((s) => (s.wet = true));
    if (ef.festival) { G.state.festival = true; VO.Audio.play('fiesta'); }
  };
  // Requisitos de inventario de una misión (errores de juego, no matemáticos)
  G.effectShortage = function (ef, x) {
    const ev = (e) => Math.round(e.a * x + e.b);
    if (ef.take) for (const k in ef.take) if (G.count(k) < ev(ef.take[k])) return 'No tienes ' + ev(ef.take[k]) + ' de ' + VO.ITEMS[k].name.toLowerCase() + ' (tienes ' + G.count(k) + ').';
    if (ef.takeCat) for (const k in ef.takeCat) if (G.countCat(k) < ev(ef.takeCat[k])) return 'No tienes ' + ev(ef.takeCat[k]) + ' pescados (tienes ' + G.countCat(k) + '). Ve a pescar o elige otra cantidad.';
    if (ef.money) { const v = ev(ef.money); if (v < 0 && G.state.money < -v) return 'No tienes suficiente dinero.'; }
    return null;
  };
})();
