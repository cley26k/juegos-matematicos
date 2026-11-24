'use strict';
// Pantalla de inicio rediseñada: valle al atardecer animado, logotipo de madera colgante
// y menú de tablones con íconos.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art, P = A.P, el = VO.el, sh = VO.shade;
  const Ti = VO.Title;
  let L = null; // capas estáticas
  const parts = []; const birds = [];

  function ridge(g, W, H, base, amp, freq, seed, col, topCol) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    const pts = [];
    for (let x = 0; x <= W; x += 2) { const y = Math.round(base + Math.sin(x / freq + seed) * amp + Math.sin(x / (freq * 0.37) + seed * 2) * amp * 0.35 + Math.sin(x / (freq * 0.13) + seed) * amp * 0.08); pts.push([x, y]); g.lineTo(x, y); }
    g.lineTo(W, H); g.closePath(); g.fill();
    if (topCol) pts.forEach(([x, y], i) => { if (i % 2) { g.fillStyle = topCol; g.fillRect(x, y, 2, 1); } });
    return pts;
  }
  function build(W, H) {
    const hz = Math.round(H * 0.5); // horizonte
    const mk = () => A.cv(W, H);
    // montañas lejanas con perspectiva atmosférica
    const [far, fg] = mk();
    ridge(fg, W, H, hz - 46, 24, 70, 1.3, '#8a7ab0', '#a898c8');
    // pico principal
    fg.fillStyle = '#7a6aa0'; fg.beginPath(); fg.moveTo(W * 0.58 - 90, hz); fg.lineTo(W * 0.58, hz - 92); fg.lineTo(W * 0.58 + 110, hz); fg.fill();
    fg.fillStyle = '#9888bc'; fg.beginPath(); fg.moveTo(W * 0.58, hz - 92); fg.lineTo(W * 0.58 - 26, hz - 50); fg.lineTo(W * 0.58 - 8, hz - 58); fg.fill();
    const [mid, mg] = mk(); ridge(mg, W, H, hz - 18, 16, 48, 4.1, '#4f7a6a', '#668e78');
    const [near, ng] = mk(); const nearPts = ridge(ng, W, H, hz + 8, 10, 36, 2.2, '#3f7a3a', '#55963f');
    // río
    const [riv, rg] = mk();
    rg.fillStyle = '#4aa8d8';
    for (let y = hz - 8; y < H; y++) { const t = (y - hz + 8) / (H - hz + 8); const cx = W * 0.42 + Math.sin(t * 5.5) * W * 0.12 * t + t * 40; const w = 2 + t * 26; rg.fillRect(Math.round(cx - w / 2), y, Math.round(w), 1); if (y % 3 === 0) { rg.fillStyle = '#9ad8f0'; rg.fillRect(Math.round(cx - w / 3), y, Math.max(1, Math.round(w / 5)), 1); rg.fillStyle = '#4aa8d8'; } }
    // campos sembrados
    const [fld, fl] = mk();
    for (let r = 0; r < 9; r++) { const y = hz + 18 + r * 4; fl.fillStyle = r % 2 ? '#6aa848' : '#88b858'; fl.fillRect(W * 0.04 + r * 2, y, W * 0.26 - r * 4, 3); fl.fillStyle = '#a8784a'; fl.fillRect(W * 0.04 + r * 2, y + 3, W * 0.26 - r * 4, 1); }
    for (let r = 0; r < 7; r++) { const y = hz + 24 + r * 5; fl.fillStyle = r % 2 ? '#9ac24a' : '#c8d86a'; fl.fillRect(W * 0.72 - r * 3, y, W * 0.24 + r * 6, 3); }
    // pueblo
    const village = [
      { w: 6, h: 3, style: 'casita', wall: '#7fb8c8', roof: '#9aa4ae', roofType: 'zinc', shutter: '#d86a4a', chimney: true, flowers: true, x: 0.06 },
      { w: 7, h: 4, style: 'colonial', wall: '#f4efe4', roof: '#2f5f9a', roofType: 'tile', shutter: '#2f5f9a', x: 0.2 },
      { w: 6, h: 3, style: 'colmado', wall: '#f2cf3a', roof: '#b5402e', roofType: 'tile', awning: '#e2508a', x: 0.36 },
      { w: 5, h: 3, style: 'bloque', wall: '#f8a878', roof: '#8a949e', x: 0.6 },
      { w: 6, h: 3, style: 'casita', wall: '#8ccf8a', roof: '#a8b0b8', roofType: 'zinc', shutter: '#e8892a', x: 0.73 },
      { w: 7, h: 4, style: 'colonial', wall: '#f0a8a8', roof: '#8a2a20', roofType: 'tile', shutter: '#f4efe4', flowers: true, x: 0.87 },
    ];
    const [vil, vg] = mk(); const roadY = Math.round(H * 0.8); const chim = [];
    village.forEach((b, i) => {
      const bd = A.building(b); const bw = bd.canvas.width / 2, bh = bd.canvas.height / 2;
      const x = Math.round(W * b.x - bw / 2), y = roadY - 10 - bh;
      vg.fillStyle = 'rgba(20,30,10,0.25)'; vg.fillRect(x + 2, roadY - 10, bw - 4, 3);
      vg.drawImage(bd.canvas, x, y);
      if (bd.chimney) chim.push([x + 26 + 4, y + 2]);
    });
    // camino
    const [road, rd] = mk();
    rd.fillStyle = '#5fae3c'; rd.fillRect(0, Math.round(H * 0.62), W, H);
    for (let i = 0; i < W * 2.5; i++) { rd.fillStyle = ['#6fbf46', '#4f9a33', '#86cf55'][i % 3]; rd.fillRect((VO.hash(i, 1, 4) * W) | 0, Math.round(H * 0.62 + VO.hash(i, 2, 4) * H * 0.38), 1, 2); }
    rd.fillStyle = '#c99a5e'; rd.fillRect(0, roadY - 9, W, 16); rd.fillStyle = '#b8894f'; rd.fillRect(0, roadY - 9, W, 2); rd.fillStyle = '#dcb47a'; for (let x = 0; x < W; x += 7) rd.fillRect(x + (VO.hash(x, 3, 1) * 4 | 0), roadY - 4 + (x % 3), 2, 1);
    // flores del primer plano
    for (let i = 0; i < W / 3; i++) { const x = (VO.hash(i, 5, 2) * W) | 0, y = Math.round(roadY + 10 + VO.hash(i, 6, 2) * (H - roadY - 10)); const c = ['#ff6a4a', '#ffd84a', '#ffffff', '#ff8fb5', '#c78bff'][i % 5]; rd.fillStyle = '#3f8a32'; rd.fillRect(x, y, 1, 3); rd.fillStyle = c; rd.fillRect(x - 1, y - 1, 3, 2); }
    L = { W, H, hz, far, mid, near, riv, fld, vil, road, roadY, chim, nearPts,
      palms: [A.makePalm(3), A.makePalm(8)], flam: A.makeTree(4, 'flamboyan'), mango: A.makeTree(9, 'mango') };
  }
  function cloud(g, x, y, s, col) { g.fillStyle = col; g.fillRect(x, y, 30 * s, 5 * s); g.fillRect(x + 5 * s, y - 4 * s, 16 * s, 4 * s); g.fillRect(x + 10 * s, y - 7 * s, 8 * s, 3 * s); g.fillRect(x + 3 * s, y + 5 * s, 24 * s, 2 * s); }

  Ti.render = function (dt) {
    const G = VO.G; const g = G.ctx; const W = G.vw, H = G.vh;
    g.setTransform(A.RS || 1, 0, 0, A.RS || 1, 0, 0); g.imageSmoothingEnabled = false;
    Ti.t = (Ti.t || 0) + dt; const t = Ti.t;
    if (!L || L.W !== W || L.H !== H) build(W, H);
    // cielo de atardecer
    const sky = g.createLinearGradient(0, 0, 0, L.hz + 10);
    sky.addColorStop(0, '#2a3a7a'); sky.addColorStop(0.45, '#c86a8a'); sky.addColorStop(0.75, '#f8a058'); sky.addColorStop(1, '#ffe0a0');
    g.fillStyle = sky; g.fillRect(0, 0, W, L.hz + 10);
    // estrellas tenues arriba
    for (let i = 0; i < 40; i++) { const a = 0.3 + Math.sin(t * 2 + i) * 0.3; g.fillStyle = 'rgba(255,255,255,' + Math.max(0, a) + ')'; g.fillRect((VO.hash(i, 9, 1) * W) | 0, (VO.hash(i, 8, 1) * L.hz * 0.3) | 0, 1, 1); }
    // sol con rayos
    const sx = W * 0.8, sy = L.hz - 22;
    g.save(); g.translate(sx, sy); g.rotate(t * 0.03);
    for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.fillStyle = 'rgba(255,230,160,0.10)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-10, -W); g.lineTo(10, -W); g.fill(); }
    g.restore();
    const glow = g.createRadialGradient(sx, sy, 4, sx, sy, 70); glow.addColorStop(0, 'rgba(255,240,180,0.9)'); glow.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = glow; g.fillRect(sx - 70, sy - 70, 140, 140);
    A.disc(g, sx, sy, 16, '#fff2b0'); A.disc(g, sx, sy, 13, '#ffe27a');
    // nubes
    for (let i = 0; i < 6; i++) { const x = ((i * 157 + t * (3 + i % 3)) % (W + 140)) - 100, y = 18 + i * 14 + (i % 2) * 6; cloud(g, Math.round(x), y, 1 + (i % 2), i % 2 ? 'rgba(255,210,200,0.85)' : 'rgba(255,236,220,0.9)'); }
    g.drawImage(L.far, 0, 0); g.drawImage(L.mid, 0, 0);
    // bruma
    const mist = g.createLinearGradient(0, L.hz - 20, 0, L.hz + 10); mist.addColorStop(0, 'rgba(255,220,180,0)'); mist.addColorStop(1, 'rgba(255,220,180,0.35)'); g.fillStyle = mist; g.fillRect(0, L.hz - 20, W, 30);
    g.drawImage(L.near, 0, 0); g.drawImage(L.fld, 0, 0); g.drawImage(L.riv, 0, 0);
    // brillos del río
    for (let i = 0; i < 18; i++) { const y = L.hz + ((i * 23 + t * 14) % (H - L.hz)); const tt = (y - L.hz + 8) / (H - L.hz + 8); const cx = W * 0.42 + Math.sin(tt * 5.5) * W * 0.12 * tt + tt * 40; g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(Math.round(cx - 2 + Math.sin(i) * tt * 6), Math.round(y), 3, 1); }
    // pájaros
    if (birds.length < 5 && Math.random() < 0.01) birds.push({ x: -10, y: 30 + Math.random() * 60, v: 18 + Math.random() * 12, p: Math.random() * 6 });
    birds.forEach((b) => { b.x += b.v * dt; const f = Math.sin(t * 8 + b.p) > 0 ? 1 : 0; g.fillStyle = '#2a2040'; g.fillRect(Math.round(b.x) - 2, Math.round(b.y) - f, 2, 1); g.fillRect(Math.round(b.x) + 1, Math.round(b.y) - f, 2, 1); g.fillRect(Math.round(b.x), Math.round(b.y), 1, 1); });
    for (let i = birds.length - 1; i >= 0; i--) if (birds[i].x > W + 10) birds.splice(i, 1);
    g.drawImage(L.road, 0, 0); g.drawImage(L.vil, 0, 0);
    // humo de chimeneas
    if (Math.random() < 0.2) L.chim.forEach(([x, y]) => parts.push({ x: x + Math.random() * 3, y, vx: 3 + Math.random() * 3, vy: -8, life: 2.5 }));
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) { parts.splice(i, 1); continue; } g.fillStyle = 'rgba(230,225,235,' + (p.life / 2.5) * 0.5 + ')'; g.fillRect(Math.round(p.x), Math.round(p.y), 2 + Math.round((2.5 - p.life)), 2 + Math.round((2.5 - p.life))); }
    // gente en el camino
    const walk = (look, speed, off, row, dir) => { const sh2 = A.charSheet(look); const span = W + 60; const x = dir > 0 ? ((t * speed + off) % span) - 30 : W + 30 - ((t * speed + off) % span); const fr = (Math.floor(t * 7 + off) % 2) + 1; g.drawImage(sh2, fr * 16, (dir > 0 ? 2 : 1) * 36, 16, 36, Math.round(x) - 8, L.roadY - 34 + row, 16, 36); return x; };
    walk(VO.NPCS.lucia.look, 16, 0, 2, 1);
    const kx = walk({ kid: true, skin: '#9a6040', hair: '#1a1010', style: 'curly', shirt: '#e8452f', pants: '#2f4f7a' }, 28, 120, 6, 1);
    walk({ kid: true, skin: '#c68c5a', hair: '#3a2010', style: 'pony', shirt: '#f2cf3a', pants: '#8a3a9a' }, 28, 100, 6, 1);
    g.drawImage(A.icon('pelota'), Math.round(kx + 14), L.roadY - 8 - Math.abs(Math.round(Math.sin(t * 9) * 6)), 7, 7);
    walk(VO.NPCS.mateo.look, 11, 300, 0, -1);
    // cerca y arbustos del primer plano
    const fy = L.roadY + 24; g.fillStyle = '#8c5a30'; g.fillRect(0, fy + 2, W, 2); g.fillRect(0, fy + 7, W, 2); for (let x = 4; x < W; x += 14) { g.fillStyle = '#c99159'; g.fillRect(x, fy - 2, 3, 13); g.fillStyle = '#6e4524'; g.fillRect(x + 2, fy - 2, 1, 13); }
    if (!L.bushes) L.bushes = [0, 1, 2, 3, 4].map((i) => A.makeBush(i + 2, i % 2 === 0));
    L.bushes.forEach((b, i) => g.drawImage(b, Math.round(W * (0.12 + i * 0.19)), fy + 8, 22, 22));
    // árboles y palmas de primer plano (enmarcan la escena)
    const sway = Math.sin(t * 1.1) * 1.2;
    g.drawImage(L.palms[0], Math.round(-6 + sway), H - 76); g.drawImage(L.palms[1], Math.round(W - 40 - sway), H - 80);
    g.drawImage(L.flam, Math.round(W * 0.1), L.roadY - 66); g.drawImage(L.mango, Math.round(W * 0.8), L.roadY - 64);
    // luciérnagas
    for (let i = 0; i < 14; i++) { const a = 0.5 + Math.sin(t * 3 + i * 1.7) * 0.5; g.fillStyle = 'rgba(230,255,140,' + a + ')'; g.fillRect(Math.round((VO.hash(i, 2, 7) * W + Math.sin(t * 0.7 + i) * 12)), Math.round(L.roadY + 8 + VO.hash(i, 3, 7) * (H - L.roadY - 10) + Math.cos(t + i) * 4), 1, 1); }
    // viñeta cálida
    const vg = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.45, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(40,20,30,0)'); vg.addColorStop(1, 'rgba(40,20,30,0.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  };

  // ---------- logotipo ----------
  Ti.logo = function () {
    const big = A.pixelText('OPORTUNIDADES', '#ffffff'), small = A.pixelText('Valle de las', '#ffffff');
    const S = 4, s2 = 2;
    const w = big.width * S + 48, h = 96;
    const c = VO.makeCanvas(w, h); const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    // sogas
    g.fillStyle = '#8a6a3a'; g.fillRect(40, 0, 4, 22); g.fillRect(w - 44, 0, 4, 22); g.fillStyle = '#c8a060'; for (let y = 0; y < 22; y += 4) { g.fillRect(40, y, 4, 2); g.fillRect(w - 44, y, 4, 2); }
    // tablón
    const bx = 4, by = 18, bw = w - 8, bh = h - 24;
    g.fillStyle = '#4a2c16'; g.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    for (let y = 0; y < bh; y++) { const plank = Math.floor(y / 15); const cc = ['#a8723f', '#9c6836', '#b07a46'][plank % 3]; g.fillStyle = (y % 15 === 14) ? '#6e4524' : (y % 15 === 0) ? sh(cc, 0.2) : cc; g.fillRect(bx, by + y, bw, 1); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(70,40,20,0.35)'; g.fillRect(bx + ((VO.hash(i, 1, 3) * bw) | 0), by + ((VO.hash(i, 2, 3) * bh) | 0), 6 + ((VO.hash(i, 3, 3) * 10) | 0), 1); }
    [[bx + 8, by + 8], [bx + bw - 12, by + 8], [bx + 8, by + bh - 12], [bx + bw - 12, by + bh - 12]].forEach(([x, y]) => { g.fillStyle = '#3a3a3a'; g.fillRect(x, y, 4, 4); g.fillStyle = '#9a9aa2'; g.fillRect(x, y, 2, 2); });
    const draw = (img, x, y, k, fill, shadow) => {
      const t = VO.makeCanvas(img.width * k, img.height * k); const tg = t.getContext('2d'); tg.imageSmoothingEnabled = false; tg.drawImage(img, 0, 0, t.width, t.height);
      // relleno con degradado, respetando el contorno oscuro
      const id = tg.getImageData(0, 0, t.width, t.height); const d = id.data;
      for (let yy = 0; yy < t.height; yy++) for (let xx = 0; xx < t.width; xx++) { const i = (yy * t.width + xx) * 4; if (d[i + 3] && d[i] > 200) { const f = fill(yy / t.height); d[i] = f[0]; d[i + 1] = f[1]; d[i + 2] = f[2]; } }
      tg.putImageData(id, 0, 0);
      if (shadow) { g.globalAlpha = 0.45; g.drawImage(t, x + k, y + k); g.globalAlpha = 1; }
      g.drawImage(t, x, y);
    };
    draw(small, (w - small.width * s2) / 2, by + 6, s2, () => [255, 246, 221], true);
    draw(big, (w - big.width * S) / 2, by + 30, S, (k) => k < 0.45 ? [255, 228, 106] : k < 0.7 ? [255, 190, 60] : [232, 130, 40], true);
    return c;
  };

  // ---------- menú ----------
  Ti.menu = function () {
    const box = document.getElementById('titleMenu'); box.innerHTML = '';
    const logoBox = document.querySelector('#title .logo'); logoBox.innerHTML = '';
    const lc = Ti.logo(); lc.className = 'logoCanvas'; lc.setAttribute('role', 'img'); lc.setAttribute('aria-label', 'Valle de las Oportunidades'); logoBox.appendChild(lc);
    logoBox.appendChild(el('div', { class: 'ribbon' }, el('span', {}, 'Un juego de granja, comercio y buenas cuentas')));
    let latest = null;
    for (let i = 1; i <= 3; i++) { try { const m = JSON.parse(localStorage.getItem('valle_slot_' + i + '_meta') || 'null'); if (m && (!latest || m.when > latest.when)) latest = Object.assign({ slot: i }, m); } catch (e) { /* ignorar */ } }
    const btn = (label, ic, fn, cls) => el('button', { class: 'plank ' + (cls || ''), onclick: () => { VO.Audio.unlock(); VO.Audio.sfx('menu'); fn(); } }, el('img', { src: A.iconURL(ic), alt: '' }), el('span', {}, label));
    const items = [];
    if (latest) items.push(btn('Continuar · Día ' + latest.day, 'coin', () => { Ti.stop(); VO.G.loadSlot(latest.slot); }, 'main'));
    items.push(btn('Nueva partida', 'seed_aji', () => Ti.createCharacter('historia'), latest ? '' : 'main'));
    items.push(btn('Modo aula (35–45 min)', 'notebook', () => Ti.createCharacter('aula')));
    if (latest) items.push(btn('Cargar partida', 'chest', () => VO.UI.openSaves()));
    items.push(btn('Configuración', 'workbench', () => VO.UI.openSettings()));
    items.push(btn('Panel docente', 'bookshelf', () => VO.Analytics.openTeacher()));
    items.push(btn('Acerca del juego', 'mango', () => Ti.credits()));
    box.append(...items, el('div', { class: 'titlefoot' }, 'Pulsa una opción · Arte y música creados para este juego'));
  };
})();
