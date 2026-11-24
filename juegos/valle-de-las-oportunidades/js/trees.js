'use strict';
// Árboles grandes (48×72): raíces, tronco con corteza, ramas visibles y copa por capas.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art, P = A.P, sh = VO.shade;
  const TONES = {
    ceiba: ['#2a6328', '#3a8230', '#52a33a', '#80c850'],
    mango: ['#224f26', '#2e6e32', '#43923d', '#6ab84e'],
    flamboyan: ['#8a2a1a', '#c23d22', '#e8622c', '#ffa04a'],
  };
  A.makeTree = function (seed, kind) {
    kind = kind || 'ceiba';
    const W = 48, H = 72; const [c, g] = A.cv(W, H); const r = VO.rng(seed * 13 + 7);
    const bark = ['#5e3e24', '#7a5232', '#45301c', '#94683e'];
    // raíces y tronco
    for (let y = 38; y < 70; y++) {
      const t = (y - 38) / 32; const w = Math.round(8 + Math.max(0, t - 0.75) * 30);
      const x0 = 24 - w / 2;
      for (let x = 0; x < w; x++) { const k = x / w; let col = k < 0.25 ? bark[3] : k > 0.7 ? bark[2] : bark[1]; if ((y * 3 + x * 5 + seed) % 11 === 0) col = bark[0]; P(g, x0 + x, y, 1, 1, col); }
    }
    for (let i = 0; i < 6; i++) { const y = 44 + ((r() * 20) | 0); P(g, 22 + ((r() * 4) | 0), y, 2, 1, bark[0]); }
    // ramas que asoman bajo la copa
    for (const s of [-1, 1]) for (let t = 0; t < 10; t++) P(g, 24 + s * (2 + t), 40 - t * 0.9, 2, 2, bark[t > 6 ? 3 : 1]);
    // copa por capas
    const blobs = [{ x: 24, y: 26, r: 16 }];
    for (let i = 0; i < 8; i++) blobs.push({ x: 9 + ((r() * 30) | 0), y: 10 + ((r() * 28) | 0), r: 7 + ((r() * 5) | 0) });
    blobs.push({ x: 12, y: 34, r: 8 }, { x: 36, y: 34, r: 8 });
    const tones = TONES[kind];
    const fruit = kind === 'mango' ? ['#f2a33a', '#ffd27a'] : kind === 'flamboyan' ? ['#3a8230', '#52a33a'] : null;
    A.canopy(g, W, 50, blobs, tones, r, fruit);
    // segunda pasada de fruta / flores para más densidad
    if (fruit) for (let i = 0; i < 10; i++) { const fx = 8 + ((r() * 32) | 0), fy = 10 + ((r() * 30) | 0); const d = g.getImageData(fx, fy, 1, 1).data; if (d[3] > 0) { P(g, fx, fy, 2, 2, fruit[0]); P(g, fx, fy, 1, 1, fruit[1]); } }
    if (kind === 'flamboyan') for (let i = 0; i < 30; i++) { const fx = 6 + ((r() * 36) | 0), fy = 8 + ((r() * 36) | 0); const d = g.getImageData(fx, fy, 1, 1).data; if (d[3] > 0) P(g, fx, fy, 1, 1, i % 2 ? '#ffd27a' : '#ff7a4a'); }
    return A.outline(c, kind === 'flamboyan' ? '#3d140c' : '#173016');
  };
  A.makePalm = function (seed) {
    const W = 44, H = 72; const [c, g] = A.cv(W, H); const r = VO.rng(seed * 7 + 3);
    const lean = r() < 0.5 ? -1 : 1;
    for (let y = 18; y < 71; y++) { const cx = 20 + Math.round(Math.sin((70 - y) / 30) * 6 * lean); P(g, cx, y, 5, 1, (y % 4 === 0) ? '#7d5a36' : '#a07848'); P(g, cx + 4, y, 1, 1, '#6a4a2c'); P(g, cx, y, 1, 1, '#c09868'); }
    const top = { x: 22 + Math.round(Math.sin(52 / 30) * 6 * lean), y: 17 };
    const leaf = ['#2a6e28', '#3f9636', '#64ba48'];
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + r() * 0.3; const L = 16 + r() * 6;
      for (let t = 0; t <= 1; t += 0.035) {
        const px = top.x + Math.cos(a) * L * t, py = top.y + Math.sin(a) * L * t * 0.5 + t * t * 12;
        P(g, px, py, 2, 1, leaf[1]);
        if (t > 0.12 && ((t * 28) | 0) % 2 === 0) { P(g, px, py + 1, 1, 3, leaf[0]); P(g, px + 1, py - 1, 1, 1, leaf[2]); }
      }
    }
    A.disc(g, top.x - 2, top.y + 3, 3, '#6b4a26'); A.disc(g, top.x + 3, top.y + 4, 3, '#7d5a30'); A.disc(g, top.x, top.y + 6, 2, '#5a3a1a'); P(g, top.x - 3, top.y + 1, 1, 1, '#a07848');
    return A.outline(c, '#1d3a18');
  };
  A.makePine = function (seed) {
    const W = 32, H = 60; const [c, g] = A.cv(W, H);
    P(g, 14, 48, 5, 11, '#6e4a2c'); P(g, 14, 48, 1, 11, '#8a5e37');
    const t = ['#1c4a2a', '#265f36', '#357d44', '#53a058'];
    for (let L = 0; L < 5; L++) {
      const top = 2 + L * 9, w = 5 + L * 3;
      for (let y = 0; y < 13; y++) { const hw = Math.round((y / 13) * w); for (let x = -hw; x <= hw; x++) P(g, 16 + x, top + y, 1, 1, x < -hw / 3 ? t[2] : x > hw / 3 ? t[0] : t[1]); if (y === 12) for (let x = -hw; x <= hw; x += 2) P(g, 16 + x, top + y, 1, 1, t[0]); }
      P(g, 16 - 3, top + 4, 2, 1, t[3]);
    }
    return A.outline(c, '#122a18');
  };
})();
