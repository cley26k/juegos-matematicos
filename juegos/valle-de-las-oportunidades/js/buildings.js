'use strict';
// Arquitectura dominicana variada: casita de madera con galería, casa de bloques con techo
// plano y tinaco, casa colonial de dos plantas y colmado. Todas más altas que los personajes.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art, P = A.P, sh = VO.shade;
  const hsh = (x, y, s) => VO.hash(x, y, s);
  const STYLE_H = { casita: 50, bloque: 54, colonial: 84, colmado: 52 };

  // ---------- piezas comunes ----------
  function window1(g, wx, wy, o) {
    const trim = o.trim, shut = o.shutter, broken = o.broken;
    if (o.shutters !== false) [wx - 5, wx + 14].forEach((sx) => { P(g, sx, wy - 1, 5, 17, shut); for (let k = 0; k < 17; k += 2) P(g, sx, wy - 1 + k, 5, 1, sh(shut, -0.28)); P(g, sx, wy - 1, 1, 17, sh(shut, 0.2)); });
    P(g, wx - 1, wy - 2, 16, 19, trim); P(g, wx - 1, wy - 2, 16, 1, sh(trim, 0.12));
    if (broken) { P(g, wx, wy - 1, 14, 16, '#3a2a1e'); P(g, wx - 1, wy + 3, 16, 2, '#8a6a4a'); P(g, wx - 1, wy + 9, 16, 2, '#7a5a3a'); return; }
    P(g, wx, wy - 1, 14, 16, '#4a7aa0'); P(g, wx, wy - 1, 14, 7, '#7fb4d8');
    for (let k = 0; k < 7; k++) P(g, wx + 1 + k, wy + 5 - k, 1, 1, '#d8f0ff');
    const cur = o.curtain || '#f4d8d8';
    P(g, wx, wy - 1, 4, 16, cur); P(g, wx + 10, wy - 1, 4, 16, cur); P(g, wx + 3, wy - 1, 1, 16, sh(cur, -0.15)); P(g, wx + 10, wy - 1, 1, 16, sh(cur, -0.15));
    P(g, wx + 6, wy - 1, 2, 16, trim); P(g, wx, wy + 6, 14, 1, trim);
    if (o.bars) { for (let k = 1; k < 14; k += 3) P(g, wx + k, wy - 1, 1, 16, '#2a2a2e'); P(g, wx, wy + 3, 14, 1, '#2a2a2e'); P(g, wx, wy + 10, 14, 1, '#2a2a2e'); for (let k = 2; k < 13; k += 6) { P(g, wx + k, wy + 6, 2, 2, '#2a2a2e'); } }
    P(g, wx - 2, wy + 15, 18, 2, sh(trim, -0.12)); P(g, wx - 2, wy + 17, 18, 1, 'rgba(0,0,0,0.25)');
    if (o.flowers) { P(g, wx - 1, wy + 17, 16, 4, '#8c5a30'); P(g, wx - 1, wy + 17, 16, 1, '#a87444'); for (let k = 0; k < 15; k += 2) { P(g, wx + k, wy + 14 + (k % 3 ? 1 : 0), 2, 2, ['#e23b2a', '#ffd84a', '#ff8fb5', '#ffffff'][(k / 2) % 4]); P(g, wx + k, wy + 16, 1, 1, '#3f8a32'); } }
  }
  function door1(g, dx, H, o) {
    const dc = o.door || '#8a4a2a', trim = o.trim; const dh = 30, dy = H - 4 - dh;
    if (o.arch) { for (let y = 0; y < 8; y++) { const w = Math.round(Math.sqrt(64 - (8 - y) * (8 - y)) * 1.1); P(g, dx + 9 - w - 2, dy - 8 + y, w * 2 + 4, 1, trim); P(g, dx + 9 - w, dy - 8 + y + 1, w * 2, 1, dc); } }
    P(g, dx - 2, dy - 3, 22, dh + 3, trim); P(g, dx + 18, dy - 3, 2, dh + 3, sh(trim, -0.2));
    P(g, dx, dy, 18, dh, dc); P(g, dx, dy, 18, 1, sh(dc, 0.3)); P(g, dx + 16, dy, 2, dh, sh(dc, -0.25)); P(g, dx + 8, dy, 1, dh, sh(dc, -0.3));
    [[2, 3, 10], [10, 3, 10], [2, 16, 11], [10, 16, 11]].forEach(([x, y, h]) => { P(g, dx + x, dy + y, 5, h, sh(dc, -0.16)); P(g, dx + x, dy + y, 5, 1, sh(dc, 0.15)); });
    P(g, dx + 13, dy + 15, 2, 2, '#e8c55a'); P(g, dx + 5, dy + 15, 2, 2, '#e8c55a');
    if (o.broken) { P(g, dx - 1, dy + 8, 20, 2, '#7a5a3a'); P(g, dx - 1, dy + 19, 20, 2, '#6a4a2a'); }
    P(g, dx - 4, H - 4, 26, 4, '#a19b94'); P(g, dx - 4, H - 4, 26, 1, '#c8c2bb');
    return { x: dx, y: dy, w: 18, h: dh };
  }
  function foundation(g, W, H) {
    for (let x = 1, i = 0; x < W - 1; i++) { const w = 4 + ((hsh(i, 1, 7) * 5) | 0); const col = ['#8f8a84', '#a19b94', '#7d7770'][i % 3]; const ww = Math.min(w - 1, W - 1 - x); P(g, x, H - 5, ww, 5, col); P(g, x, H - 5, ww, 1, sh(col, 0.2)); P(g, x + ww, H - 5, 1, 5, '#5a5550'); x += w; }
  }
  function wallFill(g, x0, y0, x1, y1, wc, kind, broken) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      let col = wc;
      if (kind === 'plank') { const r = (y - y0) % 4; col = r === 0 ? sh(wc, 0.16) : r === 3 ? sh(wc, -0.2) : wc; if (r === 1 && hsh(x >> 3, y, 2) < 0.08) col = sh(wc, -0.1); }
      else if (kind === 'block') { const row = ((y - y0) / 6) | 0, yy = (y - y0) % 6, xx = (x + (row % 2) * 6) % 12; col = yy === 5 || xx === 0 ? sh(wc, -0.14) : yy === 0 ? sh(wc, 0.08) : wc; if (hsh(x >> 2, y >> 2, 4) < 0.05) col = sh(col, -0.08); }
      else { const n = hsh(x >> 1, y >> 1, 3); col = n < 0.14 ? sh(wc, -0.06) : n > 0.9 ? sh(wc, 0.05) : wc; }
      if (broken && hsh(x >> 2, y >> 2, 5) < 0.18) col = sh(col, -0.25);
      if (y > y1 - 7) col = sh(col, -0.07 * (y - (y1 - 7)) / 6);
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
  }
  function roofSlope(g, W, top, bot, rc, rT, broken) {
    const ov = 4;
    for (let y = top; y < bot; y++) {
      const t = (y - top) / (bot - top); const inset = Math.round((1 - t) * 12);
      const x0 = Math.max(0, -ov + inset + 3), x1 = Math.min(W, W + ov - inset - 3); const light = 0.12 - t * 0.22;
      for (let x = x0; x < x1; x++) {
        let col = rc;
        if (rT === 'zinc') { const m = x % 5; col = m === 0 ? sh(rc, 0.3) : m === 1 ? sh(rc, 0.12) : m === 4 ? sh(rc, -0.18) : rc; if (hsh(x >> 1, y >> 2, 9) < 0.035) col = '#a8683a'; }
        else if (rT === 'tile') { const row = ((y - top) / 4) | 0, yy = (y - top) % 4; const xx = (x + (row % 2) * 3) % 6; col = yy === 3 ? sh(rc, -0.35) : xx === 0 ? sh(rc, -0.22) : yy === 0 ? sh(rc, 0.18) : rc; }
        else if (rT === 'thatch') { const yy = (y - top) % 5; col = yy === 4 ? sh(rc, -0.3) : ((x * 7 + y * 3) % 5 === 0) ? sh(rc, -0.18) : ((x * 3 + y) % 7 === 0) ? sh(rc, 0.2) : rc; }
        col = sh(col, light); if (x < x0 + 2) col = sh(col, -0.2); if (x > x1 - 3) col = sh(col, -0.3);
        if (broken && hsh((x / 6) | 0, (y / 5) | 0, 7) < 0.1) col = (y % 4 === 0) ? '#3a2416' : '#6e4a2c';
        g.fillStyle = col; g.fillRect(x, y, 1, 1);
      }
    }
    P(g, 14, top - 1, W - 28, 3, sh(rc, -0.3)); P(g, 14, top - 1, W - 28, 1, sh(rc, 0.2));
    P(g, 0, bot - 2, W, 2, sh(rc, -0.4)); P(g, 2, bot, W - 4, 3, 'rgba(0,0,0,0.28)');
  }
  function sign(g, W, y, icon) { const sx = Math.floor(W / 2) - 11; P(g, sx + 3, y - 3, 1, 4, '#3a3a3a'); P(g, sx + 18, y - 3, 1, 4, '#3a3a3a'); P(g, sx, y, 22, 13, '#c99159'); P(g, sx, y, 22, 1, '#e0b07a'); P(g, sx, y + 12, 22, 1, '#6e4524'); P(g, sx, y, 1, 13, '#6e4524'); P(g, sx + 21, y, 1, 13, '#6e4524'); g.drawImage(A.icon(icon), sx + 3, y - 2); }
  function rocker(g, x, y) { P(g, x, y + 8, 10, 2, '#6e4524'); P(g, x + 1, y, 2, 9, '#8c5a30'); P(g, x + 2, y + 4, 7, 2, '#a87444'); P(g, x + 7, y + 4, 2, 5, '#8c5a30'); for (let k = 0; k < 8; k += 2) P(g, x + 1, y + k, 2, 1, '#c99159'); }

  // ---------- estilos ----------
  function windowSlots(W, doorX, n, gap) { const out = []; for (let i = 0; i < n; i++) { const fx = n === 1 ? (doorX > W / 2 ? 0.25 : 0.75) : (i + 0.5) / n; let wx = Math.round(fx * W) - 7; if (Math.abs(wx - doorX) < (gap || 22)) wx = wx < doorX ? doorX - (gap || 26) : doorX + (gap || 26); if (wx > 7 && wx < W - 21) out.push(wx); } return out; }

  A.building = function (def) {
    const key = 'b4' + JSON.stringify(def);
    if (A.cache[key]) return A.cache[key];
    const style = def.style || (def.roofType === 'zinc' || def.roofType === 'thatch' ? 'casita' : 'colonial');
    const W = def.w * 16; const wallH = def.wallH || STYLE_H[style];
    const roofH = style === 'bloque' ? 12 : style === 'colonial' ? 26 : 32;
    const H = wallH + roofH + (def.chimney ? 4 : 0);
    const [c, g] = A.cv(W, H);
    const wallTop = H - wallH; const trim = def.trim || '#f4efe4'; const broken = !!def.broken;
    const o = { trim, shutter: def.shutter || '#3f8a7a', broken, flowers: def.flowers, door: def.door };
    const wins = []; let doorRect;
    const doorX = Math.floor(W / 2) - 9 + (def.doorOff || 0) * 16;

    if (style === 'casita' || style === 'colmado') {
      wallFill(g, 2, wallTop, W - 2, H - 4, def.wall, 'plank', broken);
      [2, W - 5].forEach((x) => { P(g, x, wallTop, 3, wallH - 4, trim); P(g, x + 2, wallTop, 1, wallH - 4, sh(trim, -0.2)); });
      foundation(g, W, H);
      if (style === 'colmado') {
        // frente abierto con mostrador y estantes visibles
        const ox = 8, ow = W - 16, oy = wallTop + 10, oh = wallH - 20;
        P(g, ox - 2, oy - 2, ow + 4, oh + 4, trim); P(g, ox, oy, ow, oh, '#3a2618');
        for (let r = 0; r < 3; r++) { P(g, ox + 2, oy + 3 + r * 7, ow - 4, 1, '#8c5a30'); for (let i = 0; i < ow - 6; i += 4) P(g, ox + 3 + i, oy + r * 7, 3, 3, ['#e8452f', '#f2cf3a', '#3f8a32', '#e8892a', '#ffffff', '#2f6fb0'][(i / 4 + r) % 6]); }
        P(g, ox - 2, oy + oh - 8, ow + 4, 8, '#a87444'); P(g, ox - 2, oy + oh - 8, ow + 4, 1, '#c99159');
        doorRect = { x: ox, y: oy, w: ow, h: oh };
        const sy = wallTop + 1; P(g, 4, sy, W - 8, 8, '#f4efe4'); for (let x = 6; x < W - 6; x += 3) P(g, x, sy + 3, 2, 2, [def.awning || '#c2453a', '#1a3a8a'][(x / 3) % 2]);
        wins.push({ x: ox + 2, y: oy, w: ow - 4, h: 10 });
      } else {
        windowSlots(W, doorX, def.windows === undefined ? 2 : def.windows).forEach((wx, i) => { window1(g, wx, wallTop + 12, Object.assign({}, o, { curtain: ['#f4d8d8', '#f8f0c8', '#d8ecf8'][(i + def.w) % 3] })); wins.push({ x: wx, y: wallTop + 11, w: 14, h: 16 }); });
        doorRect = door1(g, doorX, H, o);
      }
      // galería con columnas y mecedoras
      if (def.porch !== false && style === 'casita' && !broken) {
        const py = wallTop + 6; P(g, 0, py, W, 4, sh(def.roof, -0.1)); for (let x = 0; x < W; x += 4) P(g, x, py, 2, 4, sh(def.roof, 0.12)); P(g, 0, py + 4, W, 2, 'rgba(0,0,0,0.3)');
        for (let x = 4; x < W - 2; x += Math.max(20, Math.floor((W - 8) / 4))) { if (Math.abs(x - doorX - 9) < 12) continue; P(g, x, py + 4, 3, wallH - 14, '#f4efe4'); P(g, x + 2, py + 4, 1, wallH - 14, '#c8c0b0'); }
        P(g, 2, H - 8, W - 4, 3, '#a87444'); P(g, 2, H - 8, W - 4, 1, '#c99159');
        rocker(g, doorX - 16, H - 18); rocker(g, doorX + 24, H - 18);
      }
      if (def.awning && style !== 'colmado') { const ay = H - 4 - 30 - 11; for (let x = doorX - 9; x < doorX + 27; x += 4) { const on = ((x - doorX + 9) / 4) % 2 === 0; const col = on ? def.awning : '#f4efe4'; P(g, x, ay, 4, 7, col); P(g, x, ay + 7, 4, 2, sh(col, -0.25)); } }
      roofSlope(g, W, 4 + (def.chimney ? 4 : 0), wallTop + 3, def.roof, def.roofType || 'zinc', broken);
    }

    if (style === 'bloque') {
      wallFill(g, 2, wallTop, W - 2, H - 4, def.wall, 'block', broken);
      foundation(g, W, H);
      P(g, 0, wallTop - 4, W, 6, sh(def.wall, -0.05)); P(g, 0, wallTop - 4, W, 1, sh(def.wall, 0.2)); P(g, 0, wallTop + 2, W, 2, 'rgba(0,0,0,0.25)'); // pretil
      for (let x = 6; x < W - 4; x += 11) { P(g, x, wallTop - 10, 1, 6, '#6a6a72'); P(g, x + 3, wallTop - 8, 1, 4, '#6a6a72'); } // varillas
      const tx = W - 22; P(g, tx, 0, 16, 10, '#2a2a30'); P(g, tx, 0, 16, 2, '#4a4a52'); P(g, tx + 2, 3, 2, 6, '#3a3a42'); P(g, tx - 1, 10, 18, 2, '#8a8a92'); // tinaco
      windowSlots(W, doorX, def.windows === undefined ? 2 : def.windows).forEach((wx) => { window1(g, wx, wallTop + 14, Object.assign({}, o, { bars: true, shutters: false, curtain: '#e8e0c8' })); wins.push({ x: wx, y: wallTop + 13, w: 14, h: 16 }); });
      if (def.rolling) { const dx = doorX - 4, dy = H - 4 - 32; P(g, dx - 2, dy - 2, 30, 34, '#5a5a62'); for (let y = 0; y < 32; y += 3) { P(g, dx, dy + y, 26, 2, '#9aa0a8'); P(g, dx, dy + y + 2, 26, 1, '#6a7078'); } doorRect = { x: dx, y: dy, w: 26, h: 32 }; P(g, dx - 4, H - 4, 34, 4, '#a19b94'); }
      else doorRect = door1(g, doorX, H, Object.assign({}, o, { door: def.door || '#5a6a7a' }));
      P(g, doorX - 6, H - 4 - 38, 30, 4, sh(def.wall, -0.2)); // marquesina
    }

    if (style === 'colonial') {
      wallFill(g, 2, wallTop, W - 2, H - 4, def.wall, 'stucco', broken);
      foundation(g, W, H);
      P(g, 0, wallTop, W, 4, sh(def.wall, 0.12)); P(g, 0, wallTop + 3, W, 1, sh(def.wall, -0.2)); // cornisa
      const mid = wallTop + Math.round(wallH * 0.47);
      P(g, 0, mid, W, 3, sh(def.wall, 0.1)); P(g, 0, mid + 3, W, 1, sh(def.wall, -0.25)); // moldura entre plantas
      [2, W - 6].forEach((x) => { P(g, x, wallTop, 4, wallH - 4, sh(def.wall, 0.08)); P(g, x + 3, wallTop, 1, wallH - 4, sh(def.wall, -0.15)); }); // pilastras
      // planta alta: ventanas con balcón de madera
      const up = windowSlots(W, doorX, Math.max(2, def.windows || 2), 4);
      up.forEach((wx) => { window1(g, wx, wallTop + 10, Object.assign({}, o, { flowers: false, curtain: '#f8f0c8' })); wins.push({ x: wx, y: wallTop + 9, w: 14, h: 16 }); });
      const by = wallTop + 29; P(g, 6, by, W - 12, 3, '#6e4524'); P(g, 6, by, W - 12, 1, '#a87444'); for (let x = 7; x < W - 7; x += 3) P(g, x, by - 8, 1, 8, '#8c5a30'); P(g, 6, by - 9, W - 12, 2, '#8c5a30'); P(g, 8, by + 3, W - 16, 2, 'rgba(0,0,0,0.25)');
      // planta baja: arcos
      windowSlots(W, doorX, def.windows === undefined ? 2 : def.windows).forEach((wx) => { window1(g, wx, mid + 10, Object.assign({}, o, { bars: true, flowers: def.flowers })); wins.push({ x: wx, y: mid + 9, w: 14, h: 16 }); for (let y = 0; y < 5; y++) { const w = Math.round(Math.sqrt(36 - (5 - y) * (5 - y)) * 1.3); P(g, wx + 7 - w, mid + 3 + y, w * 2, 1, sh(def.wall, -0.12)); } });
      doorRect = door1(g, doorX, H, Object.assign({}, o, { arch: true }));
      P(g, doorX - 6, mid + 10, 3, 5, '#2e2e34'); P(g, doorX - 7, mid + 8, 5, 3, '#ffe27a'); // farolito
      roofSlope(g, W, 4, wallTop + 2, def.roof, 'tile', broken);
    }
    if (def.chimney) { const cx = W - 26; for (let y = 0; y < 16; y++) for (let x = 0; x < 9; x++) P(g, cx + x, y, 1, 1, (y % 3 === 2) ? '#6a3a2a' : ((x + ((y / 3) | 0) * 2) % 4 === 3 ? '#6a3a2a' : '#9a5a44')); P(g, cx - 1, 0, 11, 2, '#5a3a2a'); }
    if (def.sign) sign(g, W, style === 'colonial' ? H - 4 - 30 - 20 : wallTop - 2, def.sign);
    A.outline(c);
    const out = { canvas: c, windows: wins, door: doorRect, chimney: def.chimney ? { x: W - 22, y: 0 } : null };
    return (A.cache[key] = out);
  };
})();
