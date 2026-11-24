'use strict';
// Cultivos con silueta propia por especie y 5 etapas (semilla, brote, planta joven, flor, fruto).
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art, P = A.P, sh = VO.shade;
  const leaf = (g, x, y, ang, len, col, w) => {
    w = w || 2;
    for (let t = 0; t <= len; t++) { const k = t / len; const ww = Math.max(1, Math.round(w * Math.sin(Math.PI * Math.min(0.98, k * 0.9 + 0.1)))); const px = x + Math.cos(ang) * t, py = y + Math.sin(ang) * t + k * k * 1.5; P(g, Math.round(px - ww / 2), Math.round(py), ww, 1, k < 0.35 ? sh(col, -0.15) : k > 0.75 ? sh(col, 0.18) : col); }
  };
  const bush = (g, pts, col) => { pts.forEach(([x, y, rx, ry]) => A.ell(g, x, y, rx, ry, sh(col, -0.22))); pts.forEach(([x, y, rx, ry]) => A.ell(g, x - 0.5, y - 0.5, rx - 1, ry - 1, col)); pts.forEach(([x, y, rx]) => { P(g, x - 1, y - 1, Math.max(1, rx - 2), 1, sh(col, 0.25)); }); };
  const stem = (g, x, y0, y1, col) => { for (let y = y1; y <= y0; y++) P(g, x, y, 1, 1, col); };
  const mound = (g) => { A.ell(g, 8, 29, 5, 2, '#6a4426'); A.ell(g, 8, 28, 4, 1, '#8a5e38'); };

  const DRAW = {
    aji(g, st) {
      const L = '#3f8f34', D = '#2c6a26';
      if (st === 2) { stem(g, 8, 29, 22, D); bush(g, [[6, 25, 3, 2], [10, 25, 3, 2], [8, 22, 3, 2]], L); return; }
      stem(g, 8, 29, 16, D); stem(g, 6, 26, 20, D); stem(g, 10, 26, 19, D);
      bush(g, [[8, 18, 4, 3], [5, 22, 4, 3], [11, 22, 4, 3], [8, 24, 5, 3]], L);
      [[8, 16, -1.6], [4, 20, -2.6], [12, 20, -0.5]].forEach(([x, y, a]) => leaf(g, x, y, a, 4, sh(L, 0.1), 3));
      if (st === 3) [[5, 21], [11, 20], [8, 18]].forEach(([x, y]) => { P(g, x, y, 2, 2, '#ffffff'); P(g, x, y, 1, 1, '#fff2a0'); });
      if (st === 4) [[5, 21, '#e23b2a'], [11, 20, '#f2a33a'], [8, 23, '#e23b2a'], [3, 24, '#f2c02a'], [12, 24, '#e23b2a']].forEach(([x, y, c]) => { P(g, x, y - 1, 1, 1, '#3f8f34'); P(g, x, y, 2, 4, c); P(g, x + 1, y + 3, 1, 1, sh(c, -0.2)); P(g, x, y, 1, 2, sh(c, 0.35)); });
    },
    tomate(g, st) {
      const L = '#3a8a3a';
      if (st >= 3) { P(g, 12, 9, 2, 21, '#a07848'); P(g, 12, 9, 1, 21, '#c99a68'); }
      if (st === 2) { stem(g, 8, 29, 21, '#2f6a2a'); bush(g, [[6, 24, 3, 2], [10, 23, 3, 2], [8, 21, 3, 2]], L); return; }
      for (let y = 29; y > 10; y--) P(g, 8 + Math.round(Math.sin(y / 3) * 1.5), y, 1, 1, '#2f6a2a');
      bush(g, [[8, 12, 3, 3], [5, 16, 4, 3], [10, 18, 4, 3], [6, 22, 4, 3], [9, 25, 4, 2]], L);
      [[8, 11, -1.9], [3, 18, -2.8], [13, 21, -0.3]].forEach(([x, y, a]) => leaf(g, x, y, a, 4, sh(L, 0.12), 3));
      if (st === 3) [[5, 16], [10, 21]].forEach(([x, y]) => { P(g, x, y, 2, 1, '#ffd84a'); P(g, x, y + 1, 1, 1, '#ffd84a'); });
      if (st === 4) [[4, 15], [9, 18], [5, 22], [10, 24], [3, 26]].forEach(([x, y], i) => { const c = i === 4 ? '#e8a030' : '#e8452f'; A.disc(g, x + 1, y + 1, 1, c); P(g, x, y, 3, 3, c); P(g, x, y, 1, 1, sh(c, 0.45)); P(g, x + 1, y - 1, 1, 1, '#2f6a2a'); P(g, x + 2, y + 2, 1, 1, sh(c, -0.25)); });
    },
    maiz(g, st) {
      const L = '#5aa83a', D = '#3e8a2a';
      const top = st === 2 ? 18 : st === 3 ? 8 : 4;
      P(g, 7, top, 2, 30 - top, D); P(g, 7, top, 1, 30 - top, sh(D, 0.2));
      for (let y = top + 3, i = 0; y < 28; y += 4, i++) { const s = i % 2 ? 1 : -1; leaf(g, 8, y, s > 0 ? -0.35 : -2.8, 8, i % 2 ? L : sh(L, -0.08), 3); }
      if (st >= 3) { for (let k = 0; k < 4; k++) P(g, 6 + k, top - 3 + (k % 2), 1, 4, '#d8b45a'); P(g, 7, top - 4, 2, 2, '#f0d080'); }
      if (st === 4) [[10, 15], [4, 19]].forEach(([x, y]) => { P(g, x, y, 3, 7, '#8ac24a'); P(g, x + 1, y + 1, 2, 5, '#f2cf3a'); P(g, x + 1, y + 1, 1, 4, '#fff08a'); P(g, x, y - 1, 1, 2, '#c8a050'); P(g, x + 2, y + 6, 1, 1, '#6a9a3a'); });
    },
    habichuela(g, st) {
      const L = '#4a9a3a';
      if (st >= 2) { P(g, 3, 8, 1, 22, '#a07848'); P(g, 12, 8, 1, 22, '#a07848'); P(g, 2, 9, 12, 1, '#c99a68'); P(g, 2, 18, 12, 1, '#b08858'); }
      if (st === 2) { for (let y = 29; y > 18; y--) P(g, 8 + Math.round(Math.sin(y / 2)), y, 1, 1, '#2f7a2a'); [[8, 21], [8, 25]].forEach(([x, y]) => { A.ell(g, x - 2, y, 2, 1, L); A.ell(g, x + 2, y + 1, 2, 1, sh(L, 0.1)); }); return; }
      for (let y = 29; y > 9; y--) { P(g, 4 + Math.round(Math.sin(y / 2.2) * 1.2), y, 1, 1, '#2f7a2a'); P(g, 11 + Math.round(Math.cos(y / 2.2) * 1.2), y, 1, 1, '#2f7a2a'); }
      [[4, 11], [11, 13], [5, 16], [10, 19], [4, 22], [11, 24], [6, 26], [9, 12]].forEach(([x, y], i) => { A.ell(g, x, y, 3, 2, sh(L, -0.2)); A.ell(g, x, y - 0.5, 2, 1, i % 2 ? L : sh(L, 0.12)); P(g, x - 1, y - 1, 1, 1, sh(L, 0.3)); });
      if (st === 3) [[6, 14], [9, 21]].forEach(([x, y]) => { P(g, x, y, 2, 2, '#f4f0ff'); P(g, x, y, 1, 1, '#c8a8e8'); });
      if (st === 4) [[6, 13], [9, 17], [5, 20], [10, 23]].forEach(([x, y]) => { P(g, x, y, 1, 6, '#8a3a5a'); P(g, x + 1, y + 1, 1, 4, '#a84a6a'); P(g, x, y + 1, 1, 1, '#c86a8a'); });
    },
    auyama(g, st) {
      const L = '#3c8c34';
      if (st === 2) { leaf(g, 8, 27, -2.6, 4, L, 3); leaf(g, 8, 27, -0.5, 4, L, 3); A.ell(g, 8, 26, 2, 2, sh(L, 0.1)); return; }
      for (let x = 1; x < 15; x++) P(g, x, 27 + Math.round(Math.sin(x / 2)), 1, 1, '#2f6a2a');
      [[3, 23], [12, 22], [7, 20], [1, 26], [14, 26]].forEach(([x, y], i) => { A.ell(g, x, y, 3, 3, i % 2 ? L : sh(L, 0.1)); P(g, x, y - 1, 1, 3, sh(L, -0.25)); P(g, x - 1, y - 2, 1, 1, sh(L, 0.3)); });
      if (st === 3) { P(g, 6, 24, 3, 2, '#ffbb2a'); P(g, 7, 23, 1, 1, '#ffe27a'); }
      if (st === 4) { A.ell(g, 8, 26, 6, 4, '#e8892a'); for (let x = 3; x < 14; x += 3) P(g, x, 23, 1, 7, '#c06a1a'); A.ell(g, 6, 24, 2, 1, '#ffbb5a'); P(g, 8, 21, 2, 2, '#5a3a1a'); P(g, 9, 20, 2, 1, '#3f8a32'); }
    },
    yuca(g, st) {
      const L = '#2f7a30';
      if (st === 2) { stem(g, 8, 29, 20, '#8a6a4a'); [[-2.2], [-1.6], [-1.0]].forEach(([a]) => leaf(g, 8, 20, a, 5, L, 2)); return; }
      const top = st === 3 ? 10 : 7;
      P(g, 7, top, 2, 30 - top, '#8a6a4a'); for (let y = top + 2; y < 29; y += 3) P(g, 7, y, 2, 1, '#6a4a2a');
      [top, top + 6].forEach((y, i) => [-2.9, -2.3, -1.6, -0.9, -0.3].forEach((a, k) => leaf(g, 8, y, a, i ? 6 : 7, k % 2 ? L : sh(L, 0.15), 3)));
      if (st === 4) { P(g, 3, 29, 5, 2, '#8a5a32'); P(g, 3, 29, 2, 1, '#e8d8b0'); P(g, 9, 30, 5, 2, '#8a5a32'); P(g, 12, 30, 2, 1, '#e8d8b0'); }
    },
  };

  A.makeCrop = function (id, stage) {
    const [c, g] = A.cv(16, 32);
    const draw = DRAW[id];
    if (stage === 0) { mound(g); P(g, 5, 27, 1, 1, '#e8d8a0'); P(g, 9, 28, 1, 1, '#e8d8a0'); P(g, 7, 26, 1, 1, '#d2c080'); return A.outline(c, '#4a2e18'); }
    if (stage === 1) { mound(g); const L = A.CROP_LOOK[id].leaf; P(g, 8, 24, 1, 4, sh(L, -0.25)); leaf(g, 8, 24, -2.6, 3, L, 2); leaf(g, 8, 24, -0.5, 3, sh(L, 0.15), 2); return A.outline(c, '#1b3a16'); }
    draw(g, Math.min(4, stage));
    return A.outline(c, '#1b3a16');
  };
})();

// Tierra cultivada que se une con las casillas vecinas
(function () {
  const A = VO.Art, P = A.P;
  const cache = {};
  A.soilFor = function (wet, n, e, s, w) {
    const k = '' + (wet ? 1 : 0) + (n ? 1 : 0) + (e ? 1 : 0) + (s ? 1 : 0) + (w ? 1 : 0);
    if (cache[k]) return cache[k];
    const [c, g] = A.cv(16, 16);
    const base = wet ? '#5e3e25' : '#86593a', dk = wet ? '#47301c' : '#6c4628', lt = wet ? '#73502f' : '#a0703f', rim = wet ? '#3a2615' : '#5a3a22';
    const x0 = w ? 0 : 1, y0 = n ? 0 : 1, x1 = e ? 16 : 15, y1 = s ? 16 : 15;
    P(g, x0, y0, x1 - x0, y1 - y0, base);
    for (let i = 0; i < 22; i++) { const x = (VO.hash(i, 3, wet) * 15) | 0, y = (VO.hash(3, i, wet) * 15) | 0; if (x >= x0 && x < x1 && y >= y0 && y < y1) P(g, x, y, 2, 1, i % 3 ? dk : lt); }
    for (let y = 3; y < 16; y += 5) if (y >= y0 && y < y1) { P(g, x0, y, x1 - x0, 1, dk); P(g, x0, y - 1, x1 - x0, 1, lt); }
    if (!n) P(g, x0, y0, x1 - x0, 1, lt); if (!s) P(g, x0, y1 - 1, x1 - x0, 1, rim); if (!w) P(g, x0, y0, 1, y1 - y0, rim); if (!e) P(g, x1 - 1, y0, 1, y1 - y0, rim);
    if (!n && !w) g.clearRect(x0, y0, 1, 1); if (!n && !e) g.clearRect(x1 - 1, y0, 1, 1); if (!s && !w) g.clearRect(x0, y1 - 1, 1, 1); if (!s && !e) g.clearRect(x1 - 1, y1 - 1, 1, 1);
    if (wet) for (let i = 0; i < 4; i++) P(g, 3 + i * 3, 4 + (i % 2) * 6, 1, 1, '#8aa8c0');
    return (cache[k] = c);
  };
})();
