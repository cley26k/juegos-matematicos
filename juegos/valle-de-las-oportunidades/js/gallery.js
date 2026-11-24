'use strict';
// Galería profunda: zona subterránea con vista lateral (gravedad, saltos, escaleras y minado por bloques).
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art, P = A.P;
  const Gal = (VO.Gallery = {});
  const G = () => VO.G;
  const AIR = 0, STONE = 1, COPPER = 2, IRON = 3, COAL = 4, BEDROCK = 5, LADDER = 6, QUARTZ = 7, DIRT = 8;
  const HP = { 1: 2, 2: 3, 3: 4, 4: 3, 7: 4, 8: 1 };
  const DROP = { 1: ['stone', 1], 2: ['copper_ore', 1], 3: ['iron_ore', 1], 4: ['coal', 1], 7: ['cuarzo', 1], 8: ['clay', 1] };
  const solid = (t) => t !== AIR && t !== LADDER;

  // ---------- Generación ----------
  function build(level, seed) {
    const W = 72, H = 28; const r = VO.rng(seed * 131 + level * 17);
    const t = new Uint8Array(W * H).fill(STONE);
    const set = (x, y, v) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) t[y * W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? BEDROCK : t[y * W + x]);
    let x = 3, y = 5; const ladders = [];
    set(2, 3, AIR); for (let yy = 1; yy <= 5; yy++) set(3, yy, LADDER);
    let dir = 1, row = 0;
    while (row < 3) {
      for (let s = 0; s < 60; s++) {
        for (let k = 0; k < 3; k++) if (get(x, y - k) !== LADDER) set(x, y - k, AIR);
        if (r() < 0.25) { const ny = VO.clamp(y + (r() < 0.5 ? -1 : 1), 4 + row * 7, 9 + row * 7); y = ny; }
        x += dir; if (x < 3 || x > W - 4) { x -= dir; break; }
      }
      // pozo con escalera hacia el siguiente nivel
      const drop = 7; for (let k = 0; k <= drop; k++) { set(x, y + k, LADDER); set(x, y - 1 + k, get(x, y - 1 + k) === LADDER ? LADDER : get(x, y - 1 + k)); }
      for (let k = -2; k <= 0; k++) set(x, y + k, LADDER);
      ladders.push([x, y]); y += drop; dir = -dir; row++;
    }
    const endX = x, endY = y;
    for (let k = 0; k < 3; k++) for (let i = -2; i <= 2; i++) if (get(endX + i, endY - k) !== LADDER) set(endX + i, endY - k, AIR);
    // cavernas
    for (let c = 0; c < 10; c++) { const cx = 4 + ((r() * (W - 8)) | 0), cy = 4 + ((r() * (H - 8)) | 0), rr = 2 + ((r() * 3) | 0); for (let j = -rr; j <= rr; j++) for (let i = -rr - 1; i <= rr + 1; i++) if (i * i / 1.4 + j * j <= rr * rr && get(cx + i, cy + j) === STONE) set(cx + i, cy + j, AIR); }
    // vetas
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      if (t[j * W + i] !== STONE) continue;
      const nearAir = get(i + 1, j) === AIR || get(i - 1, j) === AIR || get(i, j + 1) === AIR || get(i, j - 1) === AIR;
      const q = r(); const deep = j / H;
      if (j < 3 && q < 0.25) t[j * W + i] = DIRT;
      else if (q < (nearAir ? 0.07 : 0.025)) t[j * W + i] = COPPER;
      else if (q < (nearAir ? 0.11 : 0.04)) t[j * W + i] = COAL;
      else if (q < (nearAir ? 0.11 : 0.04) + deep * 0.06 * (level >= 3 ? 1 : 0.4)) t[j * W + i] = IRON;
      else if (q > 0.993 - deep * 0.006) t[j * W + i] = QUARTZ;
    }
    for (let i = 0; i < W; i++) { t[i] = BEDROCK; t[(H - 1) * W + i] = BEDROCK; } for (let j = 0; j < H; j++) { t[j * W] = BEDROCK; t[j * W + W - 1] = BEDROCK; }
    // antorchas
    const torches = []; for (let i = 6; i < W - 4; i += 7) for (let j = 2; j < H - 2; j++) if (t[j * W + i] === AIR && solid(get(i, j + 1)) === false && get(i, j - 1) !== AIR) { torches.push([i, j]); break; }
    return { W, H, t, get, set, start: [4, 5], exit: [3, 1], chest: [endX, endY], torches, hp: new Map(), level };
  }

  // ---------- Arte ----------
  const tileCache = {};
  function tileImg(type, top) {
    const k = type + (top ? 't' : ''); if (tileCache[k]) return tileCache[k];
    const [c, g] = A.cv(16, 16);
    const base = type === BEDROCK ? ['#2a221e', '#221a16', '#352a24'] : type === DIRT ? ['#7a5232', '#6a4426', '#8a6040'] : ['#6a584a', '#5a4a3e', '#7a6656'];
    P(g, 0, 0, 16, 16, base[0]);
    for (let i = 0; i < 9; i++) P(g, (VO.hash(i, type, 3) * 14) | 0, (VO.hash(type, i, 4) * 14) | 0, 3, 2, base[1 + (i % 2)]);
    P(g, 0, 15, 16, 1, base[1]);
    if (top) { P(g, 0, 0, 16, 2, type === DIRT ? '#5fae3c' : '#9a8676'); P(g, 0, 2, 16, 1, base[1]); }
    const sp = { 2: ['#e07a3a', '#ffb070'], 3: ['#c9d3db', '#ffffff'], 4: ['#1e1b1a', '#4a4441'], 7: ['#4ad0c8', '#d6fffb'] }[type];
    if (sp) for (let i = 0; i < 5; i++) { const x = 2 + ((VO.hash(i, type, 9) * 11) | 0), y = 3 + ((VO.hash(type, i, 8) * 10) | 0); P(g, x, y, 3, 2, sp[0]); P(g, x, y, 1, 1, sp[1]); }
    if (type === LADDER) { g.clearRect(0, 0, 16, 16); P(g, 3, 0, 2, 16, '#8c5a30'); P(g, 11, 0, 2, 16, '#8c5a30'); for (let y = 2; y < 16; y += 5) P(g, 3, y, 10, 2, '#c99159'); }
    return (tileCache[k] = c);
  }
  let bg = null;
  function background() {
    if (bg) return bg; const [c, g] = A.cv(128, 128); P(g, 0, 0, 128, 128, '#1e1814');
    for (let i = 0; i < 90; i++) P(g, (VO.hash(i, 1, 2) * 124) | 0, (VO.hash(i, 2, 2) * 124) | 0, 4 + ((VO.hash(i, 3, 2) * 8) | 0), 2, i % 2 ? '#261e19' : '#17120f');
    return (bg = c);
  }

  // ---------- Entrar / salir ----------
  Gal.enter = function (level, back) {
    const g = G(); if (g.warping) return; g.warping = true; g.keys = {};
    VO.UI.fade(() => { setTimeout(() => { g.warping = false; }, 250);
      const m = build(level, g.state.day);
      g.side = { m, back, p: { x: m.start[0] * 16 + 8, y: m.start[1] * 16 + 15, vx: 0, vy: 0, dir: 2, frame: 0, anim: 0, ground: false, climb: false }, cam: { x: 0, y: 0 } };
      VO.Audio.sfx('door'); VO.Audio.play('gallery'); VO.UI.banner('Galería profunda · nivel ' + level); VO.bus.emit('time');
      if (!g.state.seen.gallery) { g.state.seen.gallery = true; VO.UI.toast('Vista lateral: A/D para moverte, W para saltar o trepar escaleras, Espacio para picar (hacia arriba o abajo manteniendo W/S).', 'info'); }
    });
  };
  Gal.exit = function () {
    const g = G(); const b = g.side.back; if (g.warping) return; g.warping = true; g.keys = {};
    VO.UI.fade(() => { setTimeout(() => { g.warping = false; }, 250); g.side = null; g.placeAt(b.map, b.x, b.y); VO.Audio.sfx('door'); });
  };

  // ---------- Actualización ----------
  const box = (p) => [p.x - 5, p.y - 22, 10, 22];
  function hits(m, x, y) { const [bx, by, bw, bh] = box({ x, y }); for (let yy = Math.floor(by / 16); yy <= Math.floor((by + bh - 0.01) / 16); yy++) for (let xx = Math.floor(bx / 16); xx <= Math.floor((bx + bw - 0.01) / 16); xx++) if (solid(m.get(xx, yy))) return true; return false; }
  Gal.update = function (dt) {
    const g = G(); const S = g.side; const m = S.m; const p = S.p; const k = g.keys; const K = VO.Settings.keys;
    let ix = (k[K.right] || k.ArrowRight ? 1 : 0) - (k[K.left] || k.ArrowLeft ? 1 : 0);
    let up = k[K.up] || k.ArrowUp, down = k[K.down] || k.ArrowDown;
    if (VO.Input.joy.active) { ix = Math.abs(VO.Input.joy.x) > 0.3 ? Math.sign(VO.Input.joy.x) : 0; up = VO.Input.joy.y < -0.5; down = VO.Input.joy.y > 0.5; }
    const onLadder = m.get(Math.floor(p.x / 16), Math.floor((p.y - 8) / 16)) === LADDER || m.get(Math.floor(p.x / 16), Math.floor((p.y - 1) / 16)) === LADDER;
    const belowLadder = m.get(Math.floor(p.x / 16), Math.floor((p.y + 2) / 16)) === LADDER;
    if ((up && onLadder) || (down && (onLadder || belowLadder))) p.climb = true;
    if (!onLadder && !belowLadder) p.climb = false;
    if (p.climb) { p.vy = up ? -70 : down ? 70 : 0; p.vx = ix * 50; if (ix && !up && !down && !onLadder) p.climb = false; if (onLadder || belowLadder) p.x += (Math.floor(p.x / 16) * 16 + 8 - p.x) * Math.min(1, dt * 8); }
    else { p.vx = ix * (k.Shift ? 105 : 80); p.vy = Math.min(320, p.vy + 640 * dt); if (up && p.ground) { p.vy = -215; p.ground = false; VO.Audio.sfx('hit'); } }
    if (ix) p.dir = ix < 0 ? 1 : 2;
    // movimiento con colisiones
    const nx = p.x + p.vx * dt; if (!hits(m, nx, p.y)) p.x = nx; else if (p.ground && !hits(m, nx, p.y - 16) && Math.abs(p.vx) > 0) { /* escalón bajo: subir solo con salto */ }
    const ny = p.y + p.vy * dt;
    if (!hits(m, p.x, ny) && !(p.climb === false && p.vy > 0 && belowLadder && !down && m.get(Math.floor(p.x / 16), Math.floor(p.y / 16)) !== LADDER && Math.floor(ny / 16) !== Math.floor(p.y / 16) && false)) { p.y = ny; p.ground = false; }
    else { if (p.vy > 0) { p.ground = true; p.y = Math.floor(ny / 16) * 16 - 0.01; } p.vy = 0; }
    // aterrizar sobre la parte superior de una escalera
    if (!p.climb && p.vy >= 0 && belowLadder && m.get(Math.floor(p.x / 16), Math.floor((p.y - 1) / 16)) !== LADDER && !down) { p.y = Math.floor((p.y + 2) / 16) * 16 - 0.01; p.vy = 0; p.ground = true; }
    p.anim += dt; p.frame = (ix || (p.climb && (up || down))) ? (Math.floor(p.anim * 8) % 2) + 1 : 0;
    if (p.frame && Math.floor(p.anim * 8) % 4 === 0 && p.lastStep !== Math.floor(p.anim * 8)) { p.lastStep = Math.floor(p.anim * 8); if (p.ground) VO.Audio.sfx('step'); }
    // cofre al final
    const [cx, cy] = m.chest; S.nearChest = Math.abs(p.x - (cx * 16 + 8)) < 20 && Math.abs(p.y - (cy * 16 + 15)) < 24;
    S.nearExit = Math.abs(p.x - (m.exit[0] * 16 + 8)) < 18 && p.y < 4 * 16;
    g.particles = g.particles.filter((q) => { q.life -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; return q.life > 0; });
    g.floats = g.floats.filter((f) => { f.life -= dt; f.y -= 14 * dt; return f.life > 0; });
    g.flyers = g.flyers.filter((f) => { f.t += dt; return f.t < f.d; });
    if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 10);
    if (g.swing > 0) g.swing -= dt;
    S.amb = (S.amb || 0) - dt; if (S.amb <= 0) { S.amb = 2; VO.Audio.ambient('drips', 2); }
    // el jugador real sigue al personaje lateral para textos y efectos
    g.player.x = p.x; g.player.y = p.y;
  };

  // ---------- Acciones ----------
  Gal.use = function () {
    const g = G(); const S = g.side; const m = S.m; const p = S.p; const k = g.keys; const K = VO.Settings.keys;
    if (g.swing > 0) return;
    const sel = g.selected();
    if (!sel || sel.id !== 'pick') { VO.UI.toast('Selecciona el pico para picar los bloques.', 'info'); return; }
    let tx, ty;
    if (VO.Input.mouseTile && performance.now() - VO.Input.mouseT < 2500) { [tx, ty] = VO.Input.mouseTile; if (Math.abs(tx * 16 + 8 - p.x) > 28 || Math.abs(ty * 16 + 8 - (p.y - 11)) > 32) { tx = undefined; } }
    if (tx === undefined) {
      const cx = Math.floor(p.x / 16);
      if (k[K.up] || k.ArrowUp) { tx = cx; ty = Math.floor((p.y - 30) / 16); }
      else if (k[K.down] || k.ArrowDown) { tx = cx; ty = Math.floor((p.y + 4) / 16); }
      else { tx = Math.floor((p.x + (p.dir === 1 ? -12 : 12)) / 16); ty = Math.floor((p.y - 8) / 16); if (!solid(m.get(tx, ty))) ty = Math.floor((p.y - 20) / 16); }
    }
    const t = m.get(tx, ty);
    g.swing = 0.25; g.swingTool = 'pick';
    if (!solid(t)) return;
    if (t === BEDROCK) { VO.UI.toast('Roca madre: no se puede picar.', 'info'); VO.Audio.sfx('error'); return; }
    const tool = g.state.tools.pick; const st = VO.TOOL_STATS(tool.tier);
    if (t === IRON && tool.tier < 1) { VO.UI.toast('El hierro es duro: mejora tu pico en la herrería.', 'warn'); return; }
    const cost = Math.max(1, Math.round(VO.TOOLS.pick.energy * st.energyMul));
    if (!g.useEnergy(cost)) return;
    if (tool.dur > 0) tool.dur--;
    const key = ty * m.W + tx; const hp = (m.hp.has(key) ? m.hp.get(key) : HP[t]) - (tool.dur > 0 ? st.power : Math.max(1, st.power / 2));
    const px = tx * 16 + 8, py = ty * 16 + 8;
    g.burst(px, py, t === COPPER ? ['#e07a3a', '#8a7a6a'] : t === QUARTZ ? ['#4ad0c8', '#d6fffb'] : ['#8a7a6a', '#6a584a'], 6);
    VO.Audio.sfx('pick'); g.shake = Math.max(g.shake || 0, 1);
    if (hp > 0) { m.hp.set(key, hp); return; }
    m.hp.delete(key); m.set(tx, ty, AIR);
    const [id, n] = DROP[t]; g.giveOrDrop(id, n); g.flyers.push({ id, x: px, y: py, t: 0, d: 0.45 });
    g.float('+' + n + ' ' + VO.ITEMS[id].name, px, py - 8); g.burst(px, py, ['#8a7a6a', '#6a584a'], 12, { up: 70 }); g.shake = 2; VO.Audio.sfx('collect');
    VO.bus.emit('inv');
  };
  Gal.interact = function () {
    const g = G(); const S = g.side; const s = g.state;
    if (S.nearExit) return Gal.exit();
    if (S.nearChest) {
      if (s.galleryChest === s.day) { VO.UI.toast('El cofre antiguo está vacío por hoy. Vuelve mañana.', 'info'); return; }
      s.galleryChest = s.day;
      const loot = [['copper_bar', 1], ['iron_ore', 3], ['cuarzo', 2], ['coal', 4]][(VO.hash(s.day, 3, 1) * 4) | 0];
      g.giveOrDrop(loot[0], loot[1]); g.earn(40 + S.m.level * 10, 'recompensa'); VO.Audio.sfx('level');
      VO.UI.toast('¡Cofre antiguo! ' + loot[1] + ' × ' + VO.ITEMS[loot[0]].name + ' y ' + (40 + S.m.level * 10) + ' monedas.', 'ok');
      return;
    }
    VO.UI.toast('Sube por la escalera del inicio para salir (E junto a ella).', 'info');
  };

  // ---------- Dibujo ----------
  Gal.render = function () {
    const g = G(); const S = g.side; const m = S.m; const p = S.p; const ctx = g.ctx; const vw = g.vw, vh = g.vh;
    const tx = VO.clamp(p.x - vw / 2, 0, m.W * 16 - vw), ty = VO.clamp(p.y - 12 - vh / 2, 0, m.H * 16 - vh);
    S.cam.x += (tx - S.cam.x) * 0.2; S.cam.y += (ty - S.cam.y) * 0.2;
    let cx = Math.round(S.cam.x), cy = Math.round(S.cam.y);
    if (g.shake > 0 && !VO.Settings.reduceMotion) { cx += Math.round((Math.random() - 0.5) * g.shake * 2); cy += Math.round((Math.random() - 0.5) * g.shake * 2); }
    g.cam.x = cx; g.cam.y = cy;
    const pat = ctx.createPattern(background(), 'repeat'); ctx.save(); ctx.translate(-Math.round(cx * 0.5), -Math.round(cy * 0.5)); ctx.fillStyle = pat; ctx.fillRect(Math.round(cx * 0.5), Math.round(cy * 0.5), vw, vh); ctx.restore();
    const x0 = Math.max(0, Math.floor(cx / 16)), y0 = Math.max(0, Math.floor(cy / 16)), x1 = Math.min(m.W, Math.ceil((cx + vw) / 16) + 1), y1 = Math.min(m.H, Math.ceil((cy + vh) / 16) + 1);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const t = m.get(x, y); if (t === AIR) continue;
      ctx.drawImage(tileImg(t, solid(t) && !solid(m.get(x, y - 1))), x * 16 - cx, y * 16 - cy);
      const k = y * m.W + x; if (m.hp.has(k)) { const f = 1 - m.hp.get(k) / HP[t]; ctx.strokeStyle = 'rgba(20,10,5,0.8)'; ctx.beginPath(); ctx.moveTo(x * 16 - cx + 8, y * 16 - cy + 2); ctx.lineTo(x * 16 - cx + 5, y * 16 - cy + 6 + f * 4); ctx.lineTo(x * 16 - cx + 10, y * 16 - cy + 10); if (f > 0.5) ctx.lineTo(x * 16 - cx + 6, y * 16 - cy + 14); ctx.stroke(); }
      if (solid(t) && !solid(m.get(x, y + 1)) && m.get(x, y + 1) !== LADDER) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x * 16 - cx, (y + 1) * 16 - cy, 16, 3); }
    }
    m.torches.forEach(([x, y]) => ctx.drawImage(A.prop('torch'), x * 16 - cx, y * 16 - cy));
    const [chx, chy] = m.chest; ctx.drawImage(A.icon('chest'), chx * 16 - cx, chy * 16 - cy, 16, 16);
    if (G().state.galleryChest !== G().state.day && Math.sin(G().t * 5) > 0.3) { ctx.fillStyle = '#fff6c8'; ctx.fillRect(chx * 16 - cx + 13, chy * 16 - cy - 2, 1, 3); }
    // jugador
    const sh = A.charSheet(g.state.look); const px = Math.round(p.x - cx), py = Math.round(p.y - cy);
    const dir = p.climb ? 3 : p.dir; const fr = p.climb ? p.frame : !p.ground ? 1 : p.frame;
    ctx.drawImage(sh, fr * 16, dir * 36, 16, 36, px - 8, py - 34, 16, 36);
    if (g.swing > 0) { const t = 1 - g.swing / 0.25; ctx.save(); ctx.translate(px + (p.dir === 1 ? -6 : 6), py - 12); ctx.rotate((p.dir === 1 ? -1 : 1) * (-1.2 + t * 2.2)); ctx.drawImage(A.icon('pick' + g.state.tools.pick.tier), -2, -14, 12, 12); ctx.restore(); }
    g.particles.forEach((q) => { ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), q.s, q.s); });
    g.flyers.forEach((f) => { const t = Math.min(1, f.t / f.d); const x = f.x + (p.x - f.x) * t, y = f.y + (p.y - 14 - f.y) * t - Math.sin(t * Math.PI) * 18; ctx.drawImage(A.icon(f.id), Math.round(x - cx - 5), Math.round(y - cy - 5), 10, 10); });
    // luz
    const L = Gal.lc || (Gal.lc = VO.makeCanvas(vw, vh)); if (L.width !== vw || L.height !== vh) { L.width = vw; L.height = vh; }
    const l = L.getContext('2d'); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, vw, vh); l.fillStyle = 'rgba(6,4,10,0.86)'; l.fillRect(0, 0, vw, vh); l.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => { const gr = l.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,' + a + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = gr; l.beginPath(); l.arc(x, y, r, 0, 6.3); l.fill(); };
    hole(px, py - 12, 84, 1);
    const fl = 1 + Math.sin(g.t * 9) * 0.04;
    m.torches.forEach(([x, y]) => hole(x * 16 + 8 - cx, y * 16 + 4 - cy, 60 * fl, 0.95));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (m.get(x, y) === QUARTZ) hole(x * 16 + 8 - cx, y * 16 + 8 - cy, 18, 0.6);
    ctx.drawImage(L, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    m.torches.forEach(([x, y]) => { const X = x * 16 + 8 - cx, Y = y * 16 + 4 - cy; const gr = ctx.createRadialGradient(X, Y, 0, X, Y, 40); gr.addColorStop(0, 'rgba(255,150,60,0.25)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = gr; ctx.fillRect(X - 40, Y - 40, 80, 80); });
    ctx.globalCompositeOperation = 'source-over';
    // textos
    g.floats.forEach((f) => { const im = A.pixelText(f.text, f.c.length === 7 ? f.c : '#ffffff'); ctx.drawImage(im, Math.round(f.x - cx - im.width / 2), Math.round(f.y - cy - 9)); });
    if (S.nearExit || S.nearChest) { const im = A.pixelText(S.nearExit ? 'E: salir' : 'E: abrir cofre', '#fff6dd'); ctx.drawImage(im, px - im.width / 2, py - 44); }
  };
})();
