'use strict';
// Arte pixel procedural original: baldosas, árboles, rocas, cultivos, personajes,
// retratos, iconos y edificios. Todo se genera en lienzos fuera de pantalla.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = (VO.Art = { cache: {} });
  const T = (VO.T = { GRASS: 0, DGRASS: 1, PATH: 2, COBBLE: 3, SAND: 4, WATER: 5, DEEP: 6, FARM: 7, BRIDGE: 8, CLIFF: 9,
    WOOD: 10, CAVE: 11, CAVEWALL: 12, PLAZA: 13, WALLIN: 14, DOCK: 15, VOID: 16 });
  A.SOLID = new Set([T.WATER, T.DEEP, T.CLIFF, T.CAVEWALL, T.WALLIN, T.VOID]);
  const OL = '#2a1b12';

  function cv(w, h) { const c = VO.makeCanvas(w, h); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
  A.cv = cv;
  function P(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w || 1, h || 1); }
  A.P = P;
  function disc(g, cx, cy, r, c) {
    g.fillStyle = c;
    for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.6)); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
  }
  function ell(g, cx, cy, rx, ry, c) {
    g.fillStyle = c;
    for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01)))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
  }
  A.disc = disc; A.ell = ell;
  // Contorno oscuro de 1 píxel alrededor de lo dibujado.
  function outline(c, col) {
    const g = c.getContext('2d'); const W = c.width, H = c.height;
    const d = g.getImageData(0, 0, W, H).data; const mark = [];
    const al = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[(y * W + x) * 4 + 3]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (al(x, y) === 0 && (al(x - 1, y) > 100 || al(x + 1, y) > 100 || al(x, y - 1) > 100 || al(x, y + 1) > 100)) mark.push(x, y);
    }
    g.fillStyle = col || OL;
    for (let i = 0; i < mark.length; i += 2) g.fillRect(mark[i], mark[i + 1], 1, 1);
    return c;
  }
  A.outline = outline;

  // ------------------------------------------------------------------ BALDOSAS
  const PAL = {
    grass: ['#4f9a33', '#5fae3c', '#6fbf46', '#3f8329', '#86cf55'],
    dgrass: ['#3d7f2c', '#478f31', '#356f26', '#56a03a'],
    dirt: ['#c79a5e', '#b98a50', '#d8ae70', '#a67a45'],
    cob: ['#b8a68a', '#a8957a', '#cbbb9f', '#8d7c64', '#d9cbb0'],
    sand: ['#ecd59c', '#e2c88a', '#f4e2b4', '#d4b877'],
    water: ['#3a97cf', '#3189c2', '#56addc', '#8fd0ee'],
    deep: ['#2a72ad', '#23649c', '#3a84bd'],
    farm: ['#a9784a', '#9a6b40', '#b9885a'],
    cliff: ['#8b735a', '#7a6450', '#9c8468', '#5f4d3d', '#b09a7c'],
    wood: ['#b97f48', '#a86f3c', '#c99159', '#8c5a30'],
    cave: ['#5d4c40', '#544438', '#6a584a'],
    cwall: ['#3a2e27', '#463830', '#2c231e', '#5a4a3e'],
    plaza: ['#d39a66', '#c58b58', '#e0ab78', '#a9764a'],
  };
  A.PAL = PAL;

  A.drawTile = function (g, map, tx, ty) {
    const t = map.get(tx, ty); const x = tx * 16, y = ty * 16; const h = (i) => VO.hash(tx, ty, i);
    const n = (dx, dy) => map.get(tx + dx, ty + dy);
    let p;
    switch (t) {
      case T.GRASS: case T.DGRASS: {
        p = t === T.GRASS ? PAL.grass : PAL.dgrass;
        P(g, x, y, 16, 16, p[0]);
        for (let i = 0; i < 10; i++) P(g, x + ((h(i) * 16) | 0), y + ((h(i + 20) * 16) | 0), 1, 1, p[(i % 3) + 1] || p[1]);
        if (h(50) < 0.35) { const ax = x + 2 + ((h(51) * 11) | 0), ay = y + 3 + ((h(52) * 10) | 0); P(g, ax, ay + 1, 1, 2, p[3]); P(g, ax + 2, ay + 1, 1, 2, p[3]); P(g, ax + 1, ay, 1, 3, p[2]); }
        if (t === T.GRASS && h(60) < 0.07) {
          const fc = ['#ffffff', '#ffd84a', '#ff8fb5', '#c78bff', '#ff6a4a'][(h(61) * 5) | 0];
          const fx = x + 3 + ((h(62) * 9) | 0), fy = y + 3 + ((h(63) * 9) | 0);
          P(g, fx, fy, 1, 1, fc); P(g, fx + 2, fy, 1, 1, fc); P(g, fx + 1, fy - 1, 1, 1, fc); P(g, fx + 1, fy + 1, 1, 1, fc); P(g, fx + 1, fy, 1, 1, '#ffe27a');
        }
        if (t === T.DGRASS && h(70) < 0.25) { P(g, x + ((h(71) * 13) | 0), y + ((h(72) * 13) | 0), 2, 1, '#a0703a'); }
        break;
      }
      case T.PATH: case T.FARM: {
        p = t === T.PATH ? PAL.dirt : PAL.farm;
        P(g, x, y, 16, 16, p[0]);
        for (let i = 0; i < 12; i++) P(g, x + ((h(i) * 16) | 0), y + ((h(i + 30) * 16) | 0), 1, 1, p[1 + (i % 3)]);
        if (h(80) < 0.4) { const sx = x + ((h(81) * 13) | 0), sy = y + ((h(82) * 13) | 0); P(g, sx, sy, 2, 2, '#9a8b78'); P(g, sx, sy, 1, 1, '#c9bba6'); }
        grassFringe(g, map, tx, ty, t);
        break;
      }
      case T.COBBLE: case T.PLAZA: {
        p = t === T.COBBLE ? PAL.cob : PAL.plaza;
        P(g, x, y, 16, 16, p[3]);
        if (t === T.COBBLE) {
          const stones = [[0, 0, 7, 5], [8, 0, 8, 6], [0, 6, 5, 5], [6, 7, 6, 4], [12, 7, 4, 4], [0, 12, 8, 4], [9, 12, 7, 4]];
          stones.forEach((s, i) => {
            const c = p[(VO.hash(tx * 7 + i, ty, 3) * 3) | 0];
            P(g, x + s[0], y + s[1], s[2] - 1, s[3] - 1, c);
            P(g, x + s[0], y + s[1], s[2] - 1, 1, p[4]);
            P(g, x + s[0] + s[2] - 2, y + s[1] + 1, 1, s[3] - 2, VO.shade(c, -0.12));
          });
        } else {
          P(g, x, y, 15, 15, p[(tx + ty) % 2 ? 0 : 1]); P(g, x, y, 15, 1, p[2]);
          if ((tx + ty) % 4 === 0) { P(g, x + 6, y + 6, 3, 3, p[2]); }
        }
        grassFringe(g, map, tx, ty, t);
        break;
      }
      case T.SAND: {
        p = PAL.sand; P(g, x, y, 16, 16, p[0]);
        for (let i = 0; i < 9; i++) P(g, x + ((h(i) * 16) | 0), y + ((h(i + 9) * 16) | 0), 1, 1, p[1 + (i % 3)]);
        if (h(90) < 0.05) { P(g, x + 6, y + 7, 3, 2, '#f7b6a5'); P(g, x + 7, y + 6, 1, 1, '#ffd2c4'); }
        const wet = [n(0, 1), n(0, -1), n(1, 0), n(-1, 0)].some((v) => v === T.WATER || v === T.DEEP);
        if (wet) for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) if ((i + j) % 3 === 0 && h(i * 16 + j) < 0.3) P(g, x + i, y + j, 1, 1, p[3]);
        break;
      }
      case T.WATER: case T.DEEP: {
        p = t === T.WATER ? PAL.water : PAL.deep;
        P(g, x, y, 16, 16, p[0]);
        for (let i = 0; i < 3; i++) { const wy = y + ((h(i) * 14) | 0) + 1, wx = x + ((h(i + 5) * 10) | 0); P(g, wx, wy, 4, 1, p[1]); }
        const land = (v) => v !== T.WATER && v !== T.DEEP && v !== T.BRIDGE && v !== T.DOCK;
        const foam = '#c9ecf7';
        if (land(n(0, -1))) { P(g, x, y, 16, 3, PAL.water[3]); P(g, x, y, 16, 1, foam); for (let i = 0; i < 16; i += 3) P(g, x + i, y + 3, 1, 1, PAL.water[2]); }
        if (land(n(0, 1))) { P(g, x, y + 14, 16, 2, PAL.water[2]); P(g, x, y + 15, 16, 1, foam); }
        if (land(n(-1, 0))) { P(g, x, y, 2, 16, PAL.water[2]); P(g, x, y, 1, 16, foam); }
        if (land(n(1, 0))) { P(g, x + 14, y, 2, 16, PAL.water[2]); P(g, x + 15, y, 1, 16, foam); }
        if (t === T.DEEP && n(0, -1) === T.WATER) P(g, x, y, 16, 1, PAL.water[1]);
        break;
      }
      case T.BRIDGE: case T.DOCK: {
        p = PAL.wood;
        P(g, x, y, 16, 16, PAL.water[0]);
        const vertical = t === T.BRIDGE ? (map.get(tx - 1, ty) === T.WATER || map.get(tx + 1, ty) === T.WATER || map.get(tx - 1, ty) === T.DEEP) : false;
        if (!vertical) {
          for (let i = 0; i < 16; i += 4) { P(g, x + i, y, 3, 16, p[(tx * 4 + i) % 3]); P(g, x + i + 3, y, 1, 16, p[3]); P(g, x + i + 1, y + 3, 1, 1, '#6e4524'); P(g, x + i + 1, y + 12, 1, 1, '#6e4524'); }
        } else {
          for (let i = 0; i < 16; i += 4) { P(g, x, y + i, 16, 3, p[(ty * 4 + i) % 3]); P(g, x, y + i + 3, 16, 1, p[3]); }
        }
        if (t === T.BRIDGE) {
          if (!vertical) { if (map.get(tx, ty - 1) !== T.BRIDGE) { P(g, x, y, 16, 2, '#7a4a26'); } if (map.get(tx, ty + 1) !== T.BRIDGE) { P(g, x, y + 14, 16, 2, '#6a3f20'); } }
          else { if (map.get(tx - 1, ty) !== T.BRIDGE) P(g, x, y, 2, 16, '#7a4a26'); if (map.get(tx + 1, ty) !== T.BRIDGE) P(g, x + 14, y, 2, 16, '#6a3f20'); }
        }
        break;
      }
      case T.CLIFF: {
        p = PAL.cliff;
        P(g, x, y, 16, 16, p[0]);
        for (let r = 0; r < 16; r += 4) { P(g, x, y + r + 3, 16, 1, p[3]); for (let i = 0; i < 16; i += 5) P(g, x + ((i + r * 3 + tx * 2) % 16), y + r, 3, 2, p[(i + r) % 2 ? 2 : 1]); }
        P(g, x + ((h(1) * 12) | 0), y + ((h(2) * 12) | 0), 2, 1, p[4]);
        if (n(0, -1) !== T.CLIFF) { P(g, x, y, 16, 4, PAL.grass[1]); P(g, x, y + 4, 16, 1, PAL.grass[3]); for (let i = 0; i < 16; i += 2) P(g, x + i, y + 4 + ((h(i) * 2) | 0), 1, 1, PAL.grass[3]); }
        if (n(0, 1) !== T.CLIFF) P(g, x, y + 14, 16, 2, p[3]);
        break;
      }
      case T.WOOD: {
        p = PAL.wood; P(g, x, y, 16, 16, p[0]);
        for (let r = 0; r < 16; r += 4) { P(g, x, y + r + 3, 16, 1, p[3]); const off = ((ty * 4 + r) * 7) % 16; P(g, x + off, y + r, 1, 3, p[3]); P(g, x + ((off + 5) % 16), y + r + 1, 3, 1, p[2]); }
        break;
      }
      case T.CAVE: {
        p = PAL.cave; P(g, x, y, 16, 16, p[0]);
        for (let i = 0; i < 8; i++) P(g, x + ((h(i) * 15) | 0), y + ((h(i + 8) * 15) | 0), 2, 1, p[1 + (i % 2)]);
        break;
      }
      case T.CAVEWALL: {
        p = PAL.cwall; P(g, x, y, 16, 16, p[0]);
        for (let i = 0; i < 6; i++) P(g, x + ((h(i) * 13) | 0), y + ((h(i + 6) * 13) | 0), 3, 2, p[1]);
        if (n(0, 1) !== T.CAVEWALL) { P(g, x, y + 10, 16, 6, p[3]); P(g, x, y + 10, 16, 1, '#7a6656'); for (let i = 0; i < 16; i += 4) P(g, x + i, y + 12, 2, 3, p[1]); }
        break;
      }
      case T.WALLIN: {
        P(g, x, y, 16, 16, '#e9d3a8');
        for (let i = 0; i < 16; i += 4) P(g, x + i, y, 1, 16, '#dcc293');
        if (n(0, 1) !== T.WALLIN) { P(g, x, y + 9, 16, 7, '#9a6a3c'); P(g, x, y + 9, 16, 1, '#c9955f'); P(g, x, y + 15, 16, 1, '#6e4524'); }
        if (n(0, -1) !== T.WALLIN) P(g, x, y, 16, 2, '#7b5a3a');
        break;
      }
      default: P(g, x, y, 16, 16, '#120d0a');
    }
  };
  function grassFringe(g, map, tx, ty, t) {
    const x = tx * 16, y = ty * 16;
    const isG = (v) => v === T.GRASS || v === T.DGRASS;
    const gc = PAL.grass;
    if (isG(map.get(tx, ty - 1))) for (let i = 0; i < 16; i++) { const d = (VO.hash(tx * 16 + i, ty, 9) * 3) | 0; P(g, x + i, y, 1, d, gc[0]); if (d) P(g, x + i, y + d, 1, 1, gc[3]); }
    if (isG(map.get(tx, ty + 1))) for (let i = 0; i < 16; i++) { const d = (VO.hash(tx * 16 + i, ty, 8) * 3) | 0; P(g, x + i, y + 16 - d, 1, d, gc[0]); }
    if (isG(map.get(tx - 1, ty))) for (let i = 0; i < 16; i++) { const d = (VO.hash(tx, ty * 16 + i, 7) * 3) | 0; P(g, x, y + i, d, 1, gc[0]); }
    if (isG(map.get(tx + 1, ty))) for (let i = 0; i < 16; i++) { const d = (VO.hash(tx, ty * 16 + i, 6) * 3) | 0; P(g, x + 16 - d, y + i, d, 1, gc[0]); }
  }

  // Suelo de cultivo (dinámico)
  A.soil = (function () {
    const out = {};
    for (const wet of [0, 1]) {
      const [c, g] = cv(16, 16);
      const base = wet ? '#5a3b23' : '#7d5232', dk = wet ? '#432b19' : '#654126', lt = wet ? '#6b4a2e' : '#93653d';
      P(g, 1, 1, 14, 14, base);
      for (let r = 2; r < 15; r += 4) { P(g, 2, r, 12, 1, dk); P(g, 2, r + 1, 12, 1, lt); }
      P(g, 1, 1, 14, 1, lt);
      out[wet] = c;
    }
    return out;
  })();

  // ------------------------------------------------------------------ VEGETACIÓN
  function canopy(g, W, H, blobs, tones, r, fruit) {
    const m = new Int16Array(W * H).fill(-1);
    blobs.forEach((b, bi) => {
      for (let y = -b.r; y <= b.r; y++) for (let x = -b.r; x <= b.r; x++) {
        if (x * x + y * y <= b.r * b.r + b.r * 0.5) { const px = b.x + x, py = b.y + y; if (px >= 0 && py >= 0 && px < W && py < H) m[py * W + px] = bi; }
      }
    });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const bi = m[y * W + x]; if (bi < 0) continue;
      const b = blobs[bi];
      const l = (-(x - b.x) * 0.6 - (y - b.y)) / b.r; // luz desde arriba-izquierda
      let k = l > 0.55 ? 3 : l > 0.05 ? 2 : l > -0.55 ? 1 : 0;
      if (Math.abs(l - 0.3) < 0.12 && (x + y) % 2) k = 3;
      if (Math.abs(l + 0.25) < 0.12 && (x + y) % 2) k = 0;
      if (y > H * 0.62 && k > 1) k--;
      P(g, x, y, 1, 1, tones[k]);
    }
    // grupos de hojas
    for (let i = 0; i < 14; i++) { const b = blobs[(r() * blobs.length) | 0]; const lx = b.x - 2 + ((r() * b.r) | 0) - b.r / 2, ly = b.y - 2 + ((r() * b.r) | 0) - b.r / 2; if (m[(ly | 0) * W + (lx | 0)] >= 0) { P(g, lx, ly, 2, 1, tones[3]); P(g, lx + 1, ly + 1, 1, 1, tones[2]); } }
    if (fruit) for (let i = 0; i < 9; i++) { const fx = 6 + ((r() * (W - 12)) | 0), fy = 8 + ((r() * (H * 0.45)) | 0); if (m[fy * W + fx] >= 0) { P(g, fx, fy, 2, 2, fruit[0]); P(g, fx, fy, 1, 1, fruit[1]); } }
  }
  A.canopy = (...args) => canopy(...args);
  A.makeTree = function (seed, kind) {
    const [c, g] = cv(32, 48); const r = VO.rng(seed);
    const bark = ['#6e4a2c', '#8a5e37', '#523620', '#a3744a'];
    for (let y = 26; y < 46; y++) {
      const w = y > 42 ? 8 : 6; const x0 = 16 - w / 2;
      P(g, x0, y, w, 1, bark[0]); P(g, x0, y, 2, 1, bark[1]); P(g, x0 + w - 2, y, 2, 1, bark[2]);
      if ((y * 7 + seed) % 5 === 0) P(g, x0 + 2, y, 2, 1, bark[2]);
    }
    P(g, 10, 45, 3, 1, bark[2]); P(g, 19, 45, 3, 1, bark[2]);
    const blobs = [{ x: 16, y: 17, r: 11 }];
    for (let i = 0; i < 5; i++) blobs.push({ x: 7 + ((r() * 18) | 0), y: 8 + ((r() * 18) | 0), r: 5 + ((r() * 4) | 0) });
    const tones = {
      ceiba: ['#2d6a2a', '#3c8732', '#55a83d', '#84cc52'],
      mango: ['#255a2a', '#317834', '#479a40', '#6dbd52'],
      flamboyan: ['#8a2a1a', '#c23d22', '#e8622c', '#ffa04a'],
    }[kind || 'ceiba'];
    const fruit = kind === 'mango' ? ['#f2a33a', '#ffd27a'] : kind === 'flamboyan' ? ['#3c8732', '#55a83d'] : null;
    canopy(g, 32, 40, blobs, tones, r, fruit);
    return outline(c, kind === 'flamboyan' ? '#3d140c' : '#1b3416');
  };
  A.makePalm = function (seed) {
    const [c, g] = cv(32, 48); const r = VO.rng(seed);
    const lean = r() < 0.5 ? -1 : 1;
    for (let y = 14; y < 47; y++) {
      const cx = 15 + Math.round(Math.sin((46 - y) / 22) * 4 * lean);
      P(g, cx, y, 4, 1, (y % 3 === 0) ? '#7d5a36' : '#a07848'); P(g, cx + 3, y, 1, 1, '#6a4a2c');
    }
    const top = { x: 16 + Math.round(Math.sin(32 / 22) * 4 * lean), y: 13 };
    const leaf = ['#2f7a2c', '#45a03a', '#6cc24c'];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + r() * 0.3; const L = 12 + r() * 4;
      for (let t = 0; t <= 1; t += 0.05) {
        const px = top.x + Math.cos(a) * L * t, py = top.y + Math.sin(a) * L * t * 0.55 + t * t * 9;
        P(g, px, py, 2, 1, leaf[1]);
        if (t > 0.15 && ((t * 20) | 0) % 2 === 0) { P(g, px, py + 1, 1, 2, leaf[0]); P(g, px + 1, py - 1, 1, 1, leaf[2]); }
      }
    }
    disc(g, top.x - 1, top.y + 2, 2, '#6b4a26'); disc(g, top.x + 2, top.y + 3, 2, '#7d5a30'); P(g, top.x - 2, top.y + 1, 1, 1, '#a07848');
    return outline(c, '#1d3a18');
  };
  A.makePine = function (seed) {
    const [c, g] = cv(24, 40);
    P(g, 10, 32, 4, 7, '#6e4a2c'); P(g, 10, 32, 1, 7, '#8a5e37');
    const t = ['#1f4f2e', '#2a6a3a', '#3b8648', '#5aa85c'];
    for (let L = 0; L < 4; L++) {
      const top = 2 + L * 7, w = 5 + L * 3;
      for (let y = 0; y < 11; y++) {
        const hw = Math.round((y / 11) * w);
        for (let x = -hw; x <= hw; x++) P(g, 12 + x, top + y, 1, 1, x < -hw / 3 ? t[2] : x > hw / 3 ? t[0] : t[1]);
        if (y === 10) for (let x = -hw; x <= hw; x += 2) P(g, 12 + x, top + y, 1, 1, t[0]);
      }
      P(g, 12 - 2, top + 3, 1, 1, t[3]);
    }
    return outline(c, '#122a18');
  };
  A.makeBush = function (seed, berries) {
    const [c, g] = cv(16, 16); const r = VO.rng(seed);
    canopy(g, 16, 16, [{ x: 8, y: 9, r: 6 }, { x: 5, y: 10, r: 4 }, { x: 11, y: 10, r: 4 }], ['#2b6a2c', '#3b8834', '#55a83e', '#7fca54'], r, berries ? ['#e8d24a', '#fff2a0'] : null);
    return outline(c, '#173316');
  };
  A.makeRock = function (seed, kind) {
    const [c, g] = cv(16, 16); const r = VO.rng(seed);
    const base = kind === 'clay' ? ['#a8643a', '#8a4f2c', '#c47e50', '#6d3c20'] : ['#8f8a84', '#77716b', '#aaa59e', '#5d5853'];
    ell(g, 8, 10, 6, 5, base[0]);
    ell(g, 7, 9, 4, 3, base[2]);
    for (let i = 0; i < 6; i++) P(g, 3 + ((r() * 10) | 0), 7 + ((r() * 7) | 0), 1, 1, base[1]);
    P(g, 3, 13, 10, 1, base[3]); P(g, 5, 6, 2, 1, '#d8d4ce');
    const sp = { copper: ['#e07a3a', '#ffb070'], iron: ['#b8c6d2', '#eef4f8'], coal: ['#1e1b1a', '#4a4441'], stone: null, clay: null, gem: ['#4ad0c8', '#b6fff8'] }[kind || 'stone'];
    if (sp) for (let i = 0; i < 5; i++) { const sx = 4 + ((r() * 8) | 0), sy = 7 + ((r() * 5) | 0); P(g, sx, sy, 2, 2, sp[0]); P(g, sx, sy, 1, 1, sp[1]); }
    return outline(c, '#2a2522');
  };
  A.makeWeed = function (seed) {
    const [c, g] = cv(16, 16); const r = VO.rng(seed);
    for (let i = 0; i < 7; i++) { const bx = 3 + ((r() * 10) | 0), hgt = 5 + ((r() * 6) | 0); for (let y = 0; y < hgt; y++) P(g, bx + (y > hgt / 2 ? (i % 2 ? 1 : -1) : 0), 14 - y, 1, 1, y > hgt - 2 ? '#8fd45a' : i % 2 ? '#4f9a33' : '#3d7f2c'); }
    return outline(c, '#1d3a15');
  };
  A.makeStump = function () {
    const [c, g] = cv(16, 16);
    ell(g, 8, 11, 6, 3, '#6e4a2c'); P(g, 2, 11, 13, 3, '#5a3b22'); ell(g, 8, 9, 6, 3, '#c9955f'); ell(g, 8, 9, 3, 1, '#a87444'); P(g, 8, 9, 1, 1, '#7a5232');
    return outline(c);
  };

  // ------------------------------------------------------------------ CULTIVOS
  A.CROP_LOOK = {
    aji: { leaf: '#3f8f34', fruit: '#e23b2a', fruit2: '#ffb12a', shape: 'bush' },
    tomate: { leaf: '#3a8a3a', fruit: '#e8452f', fruit2: '#ff8a6a', shape: 'bush' },
    maiz: { leaf: '#5aa83a', fruit: '#f2cf3a', fruit2: '#fff08a', shape: 'tall' },
    habichuela: { leaf: '#4a9a3a', fruit: '#c0392b', fruit2: '#e06a50', shape: 'vine' },
    auyama: { leaf: '#3c8c34', fruit: '#e8892a', fruit2: '#ffbb5a', shape: 'ground' },
    yuca: { leaf: '#2f7a30', fruit: '#8a5a32', fruit2: '#c79a5e', shape: 'leafy' },
  };
  A.makeCrop = function (id, stage, stages) {
    const L = A.CROP_LOOK[id]; const [c, g] = cv(16, 24);
    const leaf = L.leaf, lt = VO.shade(leaf, 0.3), dk = VO.shade(leaf, -0.3);
    const by = 21;
    if (stage === 0) { P(g, 5, by - 1, 2, 2, '#e8d8a0'); P(g, 9, by, 2, 2, '#e8d8a0'); P(g, 7, by - 3, 1, 1, '#d2c080'); return c; }
    const f = stage / (stages - 1); // 0..1
    if (stage === 1) { P(g, 7, by - 4, 1, 4, dk); P(g, 5, by - 5, 2, 1, lt); P(g, 8, by - 5, 2, 1, leaf); P(g, 4, by - 6, 2, 1, leaf); P(g, 9, by - 6, 2, 1, lt); return outline(c, '#1b3a16'); }
    const hgt = L.shape === 'tall' ? 8 + f * 12 : L.shape === 'ground' ? 5 + f * 3 : 6 + f * 8;
    // tallo
    P(g, 7, by - hgt, 2, hgt, dk);
    if (L.shape === 'tall') {
      for (let y = 0; y < hgt; y += 3) { const s = (y / 3) % 2 ? 1 : -1; for (let k = 0; k < 4; k++) P(g, 8 + s * (k + 1), by - y - 2 - (k >> 1), 1, 1, k > 2 ? lt : leaf); }
      if (f >= 1) { P(g, 9, by - hgt + 6, 2, 5, L.fruit); P(g, 9, by - hgt + 6, 1, 2, L.fruit2); P(g, 4, by - hgt + 9, 2, 4, L.fruit); P(g, 7, by - hgt - 2, 2, 3, '#d8b45a'); }
    } else if (L.shape === 'ground') {
      ell(g, 8, by - 3, 5 + f * 2, 3, leaf); ell(g, 6, by - 4, 3, 2, lt); P(g, 3, by - 2, 2, 2, dk);
      if (f >= 1) { ell(g, 9, by - 2, 4, 3, L.fruit); P(g, 7, by - 4, 2, 1, L.fruit2); P(g, 9, by - 5, 1, 2, '#5a3a1a'); }
      else if (f > 0.5) { ell(g, 9, by - 2, 2, 1, '#9ac24a'); }
    } else {
      const w = 3 + f * 3;
      ell(g, 8, by - hgt * 0.6, w, hgt * 0.45, leaf);
      ell(g, 7, by - hgt * 0.7, w * 0.6, hgt * 0.25, lt);
      for (let k = 0; k < 5; k++) P(g, 8 + ((k * 5) % 7) - 3, by - hgt * 0.4 - k, 1, 1, dk);
      if (L.shape === 'leafy') { for (let k = -1; k <= 1; k++) { P(g, 8 + k * 4, by - hgt, 1, 3, lt); P(g, 7 + k * 4, by - hgt - 1, 3, 1, leaf); } }
      if (L.shape === 'vine') { P(g, 3, by - hgt, 1, hgt, '#a07848'); P(g, 12, by - hgt, 1, hgt, '#a07848'); }
      if (f >= 1) {
        const pts = [[5, -0.7], [10, -0.6], [7, -0.35], [11, -0.3], [4, -0.4]];
        pts.forEach(([px, py], i) => {
          const yy = by + hgt * py;
          if (id === 'aji') { P(g, px, yy, 1, 3, i % 2 ? L.fruit : L.fruit2); }
          else if (id === 'habichuela') { P(g, px, yy, 1, 4, '#7aa83a'); P(g, px, yy + 1, 1, 1, L.fruit); }
          else if (id === 'yuca') { if (i < 2) P(g, px, by - 1, 3, 1, L.fruit); }
          else { P(g, px, yy, 2, 2, L.fruit); P(g, px, yy, 1, 1, L.fruit2); }
        });
      }
    }
    return outline(c, '#1b3a16');
  };

  // ------------------------------------------------------------------ PERSONAJES
  // look: {skin, hair, style, shirt, pants, shoes, hat, hatC, beard, apron}
  function drawChar(g, ox, oy, L, dir, fr) {
    const sk = L.skin, skD = VO.shade(sk, -0.18), hr = L.hair, hrL = VO.shade(hr, 0.22), hrD = VO.shade(hr, -0.25);
    const sh = L.shirt, shD = VO.shade(sh, -0.22), shL = VO.shade(sh, 0.2), pa = L.pants, paD = VO.shade(pa, -0.25), so = L.shoes || '#3a2618';
    const px = (x, y, w, h, c) => P(g, ox + x, oy + y, w, h, c);
    const blink = fr === 3; if (blink) fr = 0;
    const walk = fr > 0; const step = fr === 1 ? 1 : fr === 2 ? -1 : 0;
    const bob = walk ? -1 : 0;
    // piernas
    if (dir === 0 || dir === 3) {
      const l = step > 0 ? 1 : 0, r = step < 0 ? 1 : 0;
      px(5, 18 + bob, 3, 4 - l, pa); px(5, 22 - l + bob, 3, 2, so); px(5, 22 - l + bob, 1, 1, VO.shade(so, 0.35));
      px(8, 18 + bob, 3, 4 - r, paD); px(8, 22 - r + bob, 3, 2, so); px(8, 22 - r + bob, 1, 1, VO.shade(so, 0.35));
    } else {
      if (step) { px(5, 18 + bob, 3, 4, paD); px(4, 22 + bob, 3, 2, so); px(8, 18 + bob, 3, 4, pa); px(9, 22 + bob, 3, 2, so); }
      else { px(6, 18, 4, 4, pa); px(6, 22, 4, 2, so); px(9, 18, 1, 4, paD); }
    }
    // torso
    px(4, 12 + bob, 8, 7, sh); px(10, 12 + bob, 2, 7, shD); px(4, 12 + bob, 8, 1, shL); px(4, 18 + bob, 8, 1, paD);
    if (L.apron) { px(5, 14 + bob, 6, 5, L.apron); px(5, 14 + bob, 6, 1, VO.shade(L.apron, 0.2)); }
    if (dir === 0) { px(7, 12 + bob, 2, 2, skD); px(6, 12 + bob, 1, 1, shL); px(9, 12 + bob, 1, 1, shL); if (!L.apron) { px(8, 15 + bob, 1, 1, shD); px(8, 17 + bob, 1, 1, shD); } }
    if (dir !== 3) { px(4, 18 + bob, 8, 1, VO.shade(pa, -0.45)); if (dir === 0) px(7, 18 + bob, 2, 1, '#d8b44a'); }
    if (dir === 3) { px(5, 13 + bob, 6, 1, shD); }
    // brazos
    if (dir === 0 || dir === 3) {
      const la = step > 0 ? 1 : 0, ra = step < 0 ? 1 : 0;
      px(3, 13 + bob + la, 1, 4, sh); px(3, 17 + bob + la, 1, 1, sk);
      px(12, 13 + bob + ra, 1, 4, shD); px(12, 17 + bob + ra, 1, 1, sk);
    } else {
      const sx = dir === 1 ? 7 + step : 8 - step;
      px(sx, 13 + bob, 2, 4, shD); px(sx, 17 + bob, 2, 1, sk);
    }
    // cabeza
    const hy = 3 + bob;
    px(4, hy + 1, 8, 8, sk); px(11, hy + 2, 1, 6, skD); px(4, hy + 8, 8, 1, skD);
    if (dir === 0) {
      if (blink) { px(6, hy + 6, 1, 1, '#2a1b12'); px(9, hy + 6, 1, 1, '#2a1b12'); }
      else { px(6, hy + 5, 1, 2, '#2a1b12'); px(9, hy + 5, 1, 2, '#2a1b12'); px(6, hy + 5, 1, 1, '#ffffff'); px(9, hy + 5, 1, 1, '#ffffff'); }
      px(5, hy + 4, 2, 1, VO.shade(L.hair, -0.1)); px(9, hy + 4, 2, 1, VO.shade(L.hair, -0.1));
      px(5, hy + 7, 1, 1, '#e89a8a'); px(10, hy + 7, 1, 1, '#e89a8a'); px(7, hy + 7, 2, 1, skD);
    } else if (dir === 1) { px(5, hy + 5, 1, blink ? 1 : 2, '#2a1b12'); px(4, hy + 7, 1, 1, '#e89a8a'); px(3, hy + 5, 1, 2, sk); }
    else if (dir === 2) { px(10, hy + 5, 1, blink ? 1 : 2, '#2a1b12'); px(11, hy + 7, 1, 1, '#e89a8a'); px(12, hy + 5, 1, 2, sk); }
    // pelo
    const st = L.style || 'short';
    if (st !== 'bald') {
      if (st === 'curly') { for (let i = 0; i < 10; i++) px(3 + i, hy - 1 + (i % 2), 1, 3, i % 3 ? hr : hrL); px(2, hy + 1, 12, 3, hr); px(3, hy, 10, 1, hrL); }
      else { px(4, hy, 8, 3, hr); px(3, hy + 1, 10, 2, hr); px(5, hy, 4, 1, hrL); }
      if (dir === 0) { for (let i = 4; i < 12; i += 2) px(i, hy + 3, 1, 1, hr); px(3, hy + 3, 1, 3, hrD); px(12, hy + 3, 1, 3, hrD); }
      if (dir === 1) { px(7, hy + 2, 6, 5, hr); px(12, hy + 3, 1, 4, hrD); }
      if (dir === 2) { px(3, hy + 2, 6, 5, hr); px(3, hy + 3, 1, 4, hrD); }
      if (dir === 3) { px(3, hy + 2, 10, 7, hr); px(4, hy + 8, 8, 1, hrD); }
      if (st === 'long') { if (dir !== 3) { px(3, hy + 3, 1, 8, hr); px(12, hy + 3, 1, 8, hrD); } else px(4, hy + 9, 8, 4, hr); }
      if (st === 'pony') { if (dir === 1) px(12, hy + 4, 2, 6, hr); else if (dir === 2) px(2, hy + 4, 2, 6, hr); else if (dir === 3) px(7, hy + 8, 2, 5, hrD); else px(7, hy - 1, 2, 1, hrD); }
      if (st === 'curly' && dir !== 0) px(3, hy + 2, 10, 5, hr);
      if (st !== 'curly') { px(dir === 2 ? 5 : 7, hy + 1, 3, 1, hrL); px(dir === 2 ? 4 : 9, hy + 2, 1, 1, hrL); } else { px(5, hy, 2, 1, VO.shade(hr, 0.4)); px(9, hy + 1, 1, 1, VO.shade(hr, 0.4)); }
    }
    if (L.beard && dir !== 3) { if (dir === 0) { px(4, hy + 7, 8, 2, hr); px(7, hy + 7, 2, 1, skD); } else px(dir === 1 ? 4 : 7, hy + 7, 5, 2, hr); }
    // sombrero
    if (L.hat === 'straw') { const c = L.hatC || '#e8c55a'; px(1, hy + 1, 14, 1, VO.shade(c, -0.25)); px(2, hy, 12, 1, c); px(4, hy - 3, 8, 3, c); px(4, hy - 1, 8, 1, '#c0392b'); px(5, hy - 3, 3, 1, VO.shade(c, 0.3)); }
    if (L.hat === 'cap') { const c = L.hatC || '#2f6fb0'; px(4, hy - 1, 8, 3, c); px(5, hy - 1, 3, 1, VO.shade(c, 0.3)); if (dir === 0) px(4, hy + 2, 8, 1, VO.shade(c, -0.3)); if (dir === 1) px(1, hy + 2, 4, 1, VO.shade(c, -0.3)); if (dir === 2) px(11, hy + 2, 4, 1, VO.shade(c, -0.3)); }
    if (L.hat === 'band') { const c = L.hatC || '#c0392b'; px(3, hy + 1, 10, 2, c); px(4, hy + 1, 3, 1, VO.shade(c, 0.3)); }
    if (L.glasses && dir !== 3) { if (dir === 0) { px(5, hy + 4, 3, 3, '#2a1b12'); px(8, hy + 4, 3, 3, '#2a1b12'); px(6, hy + 5, 1, 1, '#bfe6f5'); px(9, hy + 5, 1, 1, '#bfe6f5'); } else px(dir === 1 ? 4 : 9, hy + 4, 3, 3, '#2a1b12'); }
  }
  A.charSheet = function (L) {
    const key = 'ch' + JSON.stringify(L);
    if (A.cache[key]) return A.cache[key];
    const [c, g] = cv(64, 96);
    for (let d = 0; d < 4; d++) for (let f = 0; f < 4; f++) drawChar(g, f * 16, d * 24, L, d, f);
    outline(c);
    return (A.cache[key] = c);
  };

  // Retratos 48×48
  A.portrait = function (L, mood) {
    const key = 'pt' + JSON.stringify(L) + mood;
    if (A.cache[key]) return A.cache[key];
    const [c, g] = cv(48, 48);
    const sk = L.skin, skD = VO.shade(sk, -0.18), skL = VO.shade(sk, 0.12), hr = L.hair, hrL = VO.shade(hr, 0.25), hrD = VO.shade(hr, -0.25);
    // hombros
    ell(g, 24, 47, 18, 9, L.shirt); ell(g, 30, 47, 10, 7, VO.shade(L.shirt, -0.2)); P(g, 20, 36, 8, 6, skD);
    if (L.apron) { P(g, 16, 41, 16, 7, L.apron); }
    // pelo trasero largo
    if (L.style === 'long' || L.style === 'pony') { P(g, 11, 14, 26, 22, hrD); }
    if (L.style === 'curly') { disc(g, 24, 17, 16, hr); }
    // cara
    ell(g, 24, 23, 11, 13, sk); ell(g, 21, 20, 7, 8, skL); P(g, 33, 20, 2, 10, skD);
    ell(g, 12, 24, 2, 3, skD); ell(g, 36, 24, 2, 3, skD);
    // ojos
    const ey = 22;
    const happy = mood === 'happy';
    for (const ex of [18, 28]) {
      if (happy) { P(g, ex, ey, 4, 1, '#2a1b12'); P(g, ex - 1, ey + 1, 1, 1, '#2a1b12'); P(g, ex + 4, ey + 1, 1, 1, '#2a1b12'); }
      else { P(g, ex, ey - 1, 4, 4, '#ffffff'); P(g, ex + 1, ey - 1, 3, 4, '#3a2a4a'); P(g, ex + 2, ey, 1, 1, '#ffffff'); P(g, ex, ey - 2, 4, 1, '#2a1b12'); }
      P(g, ex - 1, ey - 5 + (mood === 'worried' ? 1 : 0), 6, 1, hrD);
    }
    P(g, 23, 25, 2, 3, skD);
    if (happy) { P(g, 20, 30, 8, 1, '#7a3020'); P(g, 21, 31, 6, 1, '#c0503a'); }
    else { P(g, 21, 30, 6, 1, '#9a4a3a'); }
    P(g, 15, 27, 3, 2, '#f0a090'); P(g, 30, 27, 3, 2, '#f0a090');
    if (L.beard) { P(g, 14, 28, 20, 8, hr); P(g, 16, 36, 16, 2, hr); P(g, 20, 30, 8, 2, sk); P(g, 21, 30, 6, 1, '#7a3020'); }
    if (L.glasses) { for (const ex of [17, 27]) { P(g, ex, ey - 2, 6, 1, '#2a1b12'); P(g, ex, ey + 3, 6, 1, '#2a1b12'); P(g, ex, ey - 2, 1, 6, '#2a1b12'); P(g, ex + 5, ey - 2, 1, 6, '#2a1b12'); } P(g, 23, ey, 4, 1, '#2a1b12'); }
    // pelo
    if (L.style !== 'bald') {
      if (L.style === 'curly') { for (let i = 0; i < 9; i++) disc(g, 12 + i * 3, 9 + (i % 2) * 2, 4, i % 2 ? hr : hrL); }
      else { ell(g, 24, 12, 13, 6, hr); P(g, 11, 12, 4, 10, hr); P(g, 33, 12, 4, 10, hrD); for (let i = 13; i < 35; i += 3) P(g, i, 16, 2, 2, hr); ell(g, 20, 9, 6, 2, hrL); }
      if (L.style === 'long') { P(g, 10, 16, 4, 20, hr); P(g, 34, 16, 4, 20, hrD); }
      if (L.style === 'pony') { disc(g, 37, 13, 4, hr); }
    }
    if (L.hat === 'straw') { const hc = L.hatC || '#e8c55a'; P(g, 4, 10, 40, 3, VO.shade(hc, -0.2)); ell(g, 24, 6, 12, 5, hc); P(g, 12, 8, 24, 2, '#c0392b'); ell(g, 20, 4, 5, 1, VO.shade(hc, 0.3)); }
    if (L.hat === 'cap') { const hc = L.hatC || '#2f6fb0'; ell(g, 24, 8, 13, 6, hc); P(g, 11, 12, 26, 3, VO.shade(hc, -0.3)); ell(g, 20, 6, 5, 2, VO.shade(hc, 0.3)); }
    if (L.hat === 'band') { const hc = L.hatC || '#c0392b'; P(g, 11, 10, 26, 4, hc); P(g, 12, 10, 8, 1, VO.shade(hc, 0.3)); }
    return (A.cache[key] = outline(c));
  };

  // ------------------------------------------------------------------ ANIMALES
  A.chicken = (function () {
    const fr = [];
    for (let f = 0; f < 2; f++) {
      const [c, g] = cv(14, 14);
      ell(g, 7, 8, 5, 4, '#f7f3ea'); ell(g, 6, 7, 3, 2, '#ffffff'); P(g, 10, 3 + f, 3, 4, '#f7f3ea'); P(g, 11, 2 + f, 2, 1, '#e03a2a'); P(g, 13, 5 + f, 1, 1, '#f2a33a');
      P(g, 11, 4 + f, 1, 1, '#2a1b12'); P(g, 2, 6, 2, 3, '#e8e0d0'); P(g, 5, 12, 1, 2, '#f2a33a'); P(g, 8, 12, 1, 2, '#f2a33a');
      fr.push(outline(c));
    }
    return fr;
  })();

  // ------------------------------------------------------------------ ICONOS 16×16
  const IC = {};
  function icon(id, fn) { IC[id] = fn; }
  const tierC = ['#8d8478', '#d9824a', '#c9d3db'];
  function toolHead(g, kind, tier) {
    const m = tierC[tier || 0], mL = VO.shade(m, 0.3), mD = VO.shade(m, -0.3);
    const handle = (x0, y0, x1, y1) => { for (let t = 0; t <= 1; t += 0.08) P(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 2, 2, '#a0703a'); };
    if (kind === 'axe') { handle(4, 14, 11, 3); P(g, 8, 2, 6, 6, m); P(g, 12, 2, 2, 6, mL); P(g, 8, 7, 6, 1, mD); }
    if (kind === 'pick') { handle(4, 14, 10, 4); for (let i = 0; i < 12; i++) P(g, 2 + i, 4 - Math.round(Math.sin((i / 11) * Math.PI) * 3), 2, 2, i > 8 ? mL : m); }
    if (kind === 'hoe') { handle(4, 14, 11, 3); P(g, 9, 1, 6, 3, m); P(g, 13, 1, 2, 6, m); P(g, 13, 6, 2, 1, mD); }
    if (kind === 'can') { ell(g, 7, 10, 5, 4, m); P(g, 3, 6, 9, 1, mL); P(g, 11, 7, 4, 2, m); P(g, 14, 6, 2, 1, mD); P(g, 4, 4, 1, 3, mD); P(g, 4, 4, 6, 1, mD); P(g, 4, 11, 6, 1, mD); P(g, 4, 9, 2, 1, '#7cc4ea'); }
    if (kind === 'rod') { for (let i = 0; i < 13; i++) P(g, 2 + i, 14 - i, 1, 1, i < 4 ? '#5e3d24' : '#c79a5e'); P(g, 14, 2, 1, 10, '#e8e8e8'); P(g, 13, 11, 3, 2, '#e23b2a'); P(g, 4, 11, 2, 2, m); }
    if (kind === 'shovel') { handle(3, 3, 9, 10); P(g, 2, 2, 4, 1, '#a0703a'); P(g, 9, 9, 5, 5, m); P(g, 10, 13, 3, 2, m); P(g, 12, 9, 2, 4, mL); }
    if (kind === 'hammer') { handle(4, 14, 9, 5); P(g, 5, 2, 9, 4, m); P(g, 5, 2, 9, 1, mL); P(g, 5, 5, 9, 1, mD); }
  }
  ['axe', 'pick', 'hoe', 'can', 'rod', 'shovel', 'hammer'].forEach((k) => [0, 1, 2].forEach((t) => icon(k + t, (g) => toolHead(g, k, t))));
  function fruitIcon(c1, c2, leaf) { return (g) => { disc(g, 8, 9, 5, c1); disc(g, 6, 7, 2, c2); if (leaf) { P(g, 8, 2, 1, 3, '#5e3d24'); P(g, 9, 2, 3, 2, leaf); } }; }
  function seedIcon(col, crop) { return (g) => { P(g, 3, 2, 10, 13, '#f1e3c0'); P(g, 3, 2, 10, 4, col); P(g, 3, 14, 10, 1, '#c9b48a'); P(g, 4, 3, 8, 1, VO.shade(col, 0.3)); const L = A.CROP_LOOK[crop]; disc(g, 8, 10, 2, L.fruit); P(g, 8, 7, 1, 1, L.leaf); }; }
  function fishIcon(b, belly, fin) { return (g) => { ell(g, 7, 8, 5, 3, b); ell(g, 7, 9, 4, 1, belly); P(g, 12, 5, 2, 7, fin); P(g, 13, 4, 2, 2, fin); P(g, 13, 11, 2, 2, fin); P(g, 4, 7, 1, 1, '#1a1a1a'); P(g, 6, 5, 3, 1, VO.shade(b, 0.35)); P(g, 7, 4, 2, 1, fin); }; }
  function oreIcon(rock, sp) { return (g) => { ell(g, 8, 9, 6, 5, rock); ell(g, 7, 8, 4, 3, VO.shade(rock, 0.15)); if (sp) for (const [x, y] of [[5, 7], [9, 9], [7, 11], [10, 6]]) { P(g, x, y, 2, 2, sp); P(g, x, y, 1, 1, VO.shade(sp, 0.4)); } }; }
  function barIcon(c) { return (g) => { for (let i = 0; i < 5; i++) P(g, 3 + i, 6 + i, 10 - i * 0 , 1, i === 0 ? VO.shade(c, 0.4) : c); P(g, 2, 11, 12, 3, VO.shade(c, -0.25)); P(g, 4, 6, 8, 5, c); P(g, 4, 6, 8, 1, VO.shade(c, 0.4)); }; }
  icon('cuarzo', (g) => { for (let i = 0; i < 3; i++) { const x = 3 + i * 4, h = 8 + (i % 2) * 3; P(g, x, 14 - h, 3, h, i === 1 ? '#6ae8e0' : '#4ad0c8'); P(g, x, 14 - h, 1, h, '#d6fffb'); P(g, x + 1, 13 - h, 1, 1, '#d6fffb'); } P(g, 2, 13, 12, 2, '#5a5a6a'); });
  icon('leche', (g) => { P(g, 5, 3, 6, 3, '#e8e0d0'); P(g, 4, 6, 8, 9, '#ffffff'); P(g, 4, 6, 1, 9, '#e8e0d0'); P(g, 5, 9, 6, 3, '#7cc4ea'); P(g, 6, 1, 4, 2, '#c2453a'); });
  icon('queso', (g) => { for (let y = 0; y < 8; y++) P(g, 2 + Math.max(0, 6 - y), 5 + y, 12 - Math.max(0, 6 - y), 1, y === 0 ? '#fff2a0' : '#f2cf3a'); P(g, 6, 9, 2, 2, '#d8a82a'); P(g, 10, 11, 2, 1, '#d8a82a'); P(g, 1, 13, 14, 2, '#5a8a3a'); });
  icon('wood', (g) => { P(g, 2, 7, 12, 6, '#8a5e37'); P(g, 2, 7, 12, 1, '#a3744a'); ell(g, 13, 10, 2, 3, '#d4a56a'); P(g, 13, 10, 1, 1, '#8a5e37'); P(g, 5, 9, 4, 1, '#6e4a2c'); });
  icon('stone', oreIcon('#8f8a84', null));
  icon('copper_ore', oreIcon('#77716b', '#e07a3a'));
  icon('iron_ore', oreIcon('#6d6862', '#c9d3db'));
  icon('coal', oreIcon('#2a2624', '#555'));
  icon('clay', (g) => { ell(g, 8, 10, 6, 4, '#a8643a'); ell(g, 7, 9, 3, 2, '#c47e50'); P(g, 5, 12, 6, 1, '#6d3c20'); });
  icon('sand', (g) => { ell(g, 8, 11, 6, 3, '#e2c88a'); ell(g, 8, 9, 4, 3, '#ecd59c'); P(g, 6, 8, 2, 1, '#f4e2b4'); });
  icon('fiber', (g) => { for (let i = 0; i < 5; i++) for (let y = 0; y < 10; y++) P(g, 4 + i * 2 + (y > 6 ? 1 : 0), 3 + y, 1, 1, i % 2 ? '#5fae3c' : '#86cf55'); P(g, 3, 10, 10, 2, '#c9a066'); });
  icon('mango', fruitIcon('#f2a33a', '#ffd27a', '#3f8a32'));
  icon('guayaba', fruitIcon('#b7d65a', '#e3f08a', '#3f8a32'));
  icon('coco', fruitIcon('#6b4a26', '#8a6a3a'));
  icon('concha', (g) => { for (let y = 0; y < 7; y++) { const w = Math.round(Math.sqrt(49 - (6 - y) * (6 - y))); P(g, 8 - w, 5 + y, w * 2, 1, y % 2 ? '#f2e6cc' : '#fbf3e0'); } for (let k = -2; k <= 2; k++) for (let t = 0; t < 7; t++) P(g, 8 + Math.round(k * t * 0.55), 11 - t, 1, 1, '#c8a878'); P(g, 6, 12, 4, 2, '#d8bc90'); P(g, 5, 6, 2, 1, '#ffffff'); P(g, 9, 7, 1, 1, '#e8a890'); });
  icon('plank', (g) => { for (let i = 0; i < 3; i++) { P(g, 2, 4 + i * 4, 12, 3, ['#c99159', '#b97f48', '#d8a26a'][i]); P(g, 2, 6 + i * 4, 12, 1, '#8c5a30'); } });
  icon('brick', (g) => { P(g, 2, 5, 12, 8, '#b5543a'); P(g, 2, 5, 12, 1, '#d4704e'); P(g, 2, 9, 12, 1, '#8a3a24'); P(g, 7, 5, 1, 4, '#8a3a24'); P(g, 4, 9, 1, 4, '#8a3a24'); P(g, 11, 9, 1, 4, '#8a3a24'); });
  icon('copper_bar', barIcon('#d9824a'));
  icon('iron_bar', barIcon('#c9d3db'));
  icon('glass', (g) => { P(g, 4, 3, 8, 11, '#bfe6f5'); P(g, 4, 3, 8, 1, '#ffffff'); P(g, 5, 4, 1, 8, '#ffffff'); P(g, 11, 3, 1, 11, '#7cc4ea'); });
  icon('rope', (g) => { for (let a = 0; a < 6.28; a += 0.3) { P(g, 8 + Math.cos(a) * 5, 8 + Math.sin(a) * 4, 2, 2, '#c9a066'); P(g, 8 + Math.cos(a) * 3, 8 + Math.sin(a) * 2, 1, 1, '#a07848'); } });
  icon('jam', (g) => { P(g, 4, 5, 8, 9, '#d8e8f0'); P(g, 5, 7, 6, 6, '#c2453a'); P(g, 5, 7, 2, 2, '#e8705a'); P(g, 4, 3, 8, 2, '#e8c55a'); P(g, 4, 3, 8, 1, '#fff0a0'); });
  icon('egg', (g) => { ell(g, 8, 9, 4, 5, '#f7efe0'); ell(g, 7, 7, 2, 2, '#ffffff'); });
  icon('bait', (g) => { for (let i = 0; i < 4; i++) disc(g, 4 + i * 3, 8 + (i % 2) * 2, 2, i % 2 ? '#c8786a' : '#e0968a'); });
  icon('aji', (g) => { P(g, 7, 2, 2, 3, '#3f8a32'); for (let y = 0; y < 9; y++) P(g, 6 + (y > 5 ? 1 : 0), 5 + y, 4 - (y > 6 ? 2 : 0), 1, y < 2 ? '#ff6a4a' : '#e23b2a'); });
  icon('tomate', fruitIcon('#e8452f', '#ff8a6a', '#3f8a32'));
  icon('maiz', (g) => { ell(g, 8, 8, 3, 6, '#f2cf3a'); for (let y = 3; y < 14; y += 2) P(g, 6, y, 5, 1, '#d8b42a'); P(g, 3, 6, 3, 9, '#7ab84a'); P(g, 11, 6, 3, 9, '#5aa83a'); });
  icon('habichuela', (g) => { for (let i = 0; i < 3; i++) { ell(g, 5 + i * 3, 6 + i * 3, 2, 2, '#c0392b'); P(g, 4 + i * 3, 5 + i * 3, 1, 1, '#e06a50'); } });
  icon('auyama', (g) => { ell(g, 8, 10, 6, 4, '#e8892a'); for (let x = 4; x < 13; x += 3) P(g, x, 7, 1, 7, '#c06a1a'); ell(g, 6, 8, 2, 1, '#ffbb5a'); P(g, 8, 4, 2, 3, '#5a3a1a'); });
  icon('yuca', (g) => { for (let i = 0; i < 10; i++) P(g, 3 + i, 5 + i * 0.7, 3, 3, '#8a5a32'); P(g, 3, 5, 2, 2, '#e8d8b0'); P(g, 5, 6, 6, 1, '#a87444'); });
  Object.keys(A.CROP_LOOK).forEach((k) => icon('seed_' + k, seedIcon({ aji: '#e23b2a', tomate: '#e8452f', maiz: '#e8b42a', habichuela: '#8a3a9a', auyama: '#e8892a', yuca: '#6a8a3a' }[k], k)));
  icon('sardina', fishIcon('#8fa8b8', '#dfe8ee', '#6a8a9a'));
  icon('tilapia', fishIcon('#7a8a6a', '#c8d0b0', '#5a6a4a'));
  icon('guabina', fishIcon('#6a5a3a', '#b8a888', '#4a3a2a'));
  icon('chillo', fishIcon('#e2584a', '#ffb0a0', '#c03a2a'));
  icon('carite', fishIcon('#5a7aa8', '#d0dcec', '#3a5a88'));
  icon('pez_loro', fishIcon('#3ac0a8', '#a8f0e0', '#e86a9a'));
  icon('dorado', fishIcon('#e8c83a', '#7ad0a0', '#3a9a6a'));
  icon('chest', (g) => { P(g, 2, 5, 12, 9, '#a87444'); P(g, 2, 5, 12, 3, '#c9955f'); P(g, 2, 8, 12, 1, '#6e4524'); P(g, 7, 7, 2, 3, '#e8c55a'); P(g, 2, 5, 1, 9, '#6e4524'); P(g, 13, 5, 1, 9, '#6e4524'); });
  icon('fence', (g) => { P(g, 3, 3, 2, 11, '#c99159'); P(g, 11, 3, 2, 11, '#c99159'); P(g, 1, 6, 14, 2, '#b97f48'); P(g, 1, 10, 14, 2, '#b97f48'); P(g, 3, 3, 2, 1, '#e0b07a'); P(g, 11, 3, 2, 1, '#e0b07a'); });
  icon('path_stone', (g) => { ell(g, 8, 9, 6, 4, '#b8a68a'); ell(g, 7, 8, 3, 2, '#cbbb9f'); });
  icon('lamp', (g) => { P(g, 7, 6, 2, 9, '#3a3a3a'); P(g, 5, 2, 6, 5, '#3a3a3a'); P(g, 6, 3, 4, 3, '#ffe27a'); P(g, 5, 14, 6, 1, '#3a3a3a'); });
  icon('table', (g) => { P(g, 1, 5, 14, 3, '#b97f48'); P(g, 1, 5, 14, 1, '#d8a26a'); P(g, 2, 8, 2, 6, '#8c5a30'); P(g, 12, 8, 2, 6, '#8c5a30'); });
  icon('chair', (g) => { P(g, 4, 2, 2, 12, '#8c5a30'); P(g, 4, 8, 8, 2, '#b97f48'); P(g, 10, 8, 2, 6, '#8c5a30'); P(g, 4, 2, 2, 6, '#b97f48'); });
  icon('rug', (g) => { P(g, 1, 4, 14, 9, '#c2453a'); P(g, 3, 6, 10, 5, '#e8c55a'); P(g, 5, 8, 6, 1, '#2f6fb0'); });
  icon('plant_pot', (g) => { P(g, 5, 10, 6, 5, '#b5543a'); P(g, 4, 10, 8, 1, '#d4704e'); disc(g, 8, 6, 4, '#3f8a32'); P(g, 6, 4, 2, 2, '#86cf55'); });
  icon('bookshelf', (g) => { P(g, 2, 1, 12, 14, '#8c5a30'); for (let r = 0; r < 3; r++) { P(g, 3, 2 + r * 4, 10, 3, '#3a2618'); for (let b = 0; b < 5; b++) P(g, 3 + b * 2, 2 + r * 4, 1, 3, ['#c2453a', '#2f6fb0', '#e8c55a', '#3f8a32', '#8a3a9a'][(b + r) % 5]); } });
  icon('bed', (g) => { P(g, 1, 5, 14, 9, '#8c5a30'); P(g, 2, 6, 12, 6, '#e8e0d0'); P(g, 2, 6, 4, 6, '#ffffff'); P(g, 6, 7, 8, 5, '#2f6fb0'); });
  icon('workbench', (g) => { P(g, 1, 6, 14, 3, '#a87444'); P(g, 2, 9, 2, 5, '#6e4524'); P(g, 12, 9, 2, 5, '#6e4524'); P(g, 4, 3, 5, 3, '#8d8478'); P(g, 10, 4, 1, 2, '#c79a5e'); });
  icon('sprinkler', (g) => { P(g, 6, 8, 4, 6, '#8d8478'); P(g, 5, 7, 6, 2, '#c9d3db'); P(g, 3, 4, 1, 2, '#7cc4ea'); P(g, 12, 4, 1, 2, '#7cc4ea'); P(g, 8, 2, 1, 2, '#7cc4ea'); });
  icon('coin', (g) => { disc(g, 8, 8, 6, '#e8b42a'); disc(g, 8, 8, 4, '#f7d44a'); P(g, 7, 5, 2, 6, '#c08a1a'); P(g, 5, 5, 2, 2, '#fff2a0'); });
  icon('energy', (g) => { const pts = [[9, 1], [8, 2], [7, 3], [6, 4], [5, 5], [4, 6], [5, 7], [6, 7], [7, 7], [8, 7], [7, 8], [6, 9], [5, 10], [4, 11], [3, 12], [4, 12], [5, 11], [6, 10], [7, 9], [8, 8], [9, 7], [10, 6], [11, 6], [10, 5], [9, 4], [10, 3], [10, 2]]; pts.forEach(([x, y]) => P(g, x + 1, y + 1, 2, 2, '#f7d44a')); });
  icon('notebook', (g) => { P(g, 3, 2, 10, 12, '#5a8a3a'); P(g, 4, 3, 8, 10, '#f1e3c0'); for (let y = 5; y < 13; y += 2) P(g, 5, y, 6, 1, '#b8a88a'); P(g, 3, 2, 1, 12, '#3a5a2a'); P(g, 9, 6, 3, 1, '#c2453a'); });
  icon('ladder', (g) => { P(g, 4, 1, 2, 14, '#8c5a30'); P(g, 10, 1, 2, 14, '#8c5a30'); for (let y = 3; y < 15; y += 3) P(g, 4, y, 8, 1, '#c99159'); });

  A.icon = function (id) {
    const key = 'ic' + id;
    if (A.cache[key]) return A.cache[key];
    const [c, g] = cv(16, 16);
    const fn = IC[id] || IC.stone;
    fn(g);
    return (A.cache[key] = outline(c));
  };
  A.hasIcon = (id) => !!IC[id];
  A.registerIcon = (id, fn) => { IC[id] = fn; delete A.cache["ic" + id]; };
  A.alias = (id, src) => { IC[id] = IC[src]; };
  A.iconURL = function (id) { const k = 'url' + id; if (!A.cache[k]) A.cache[k] = A.icon(id).toDataURL(); return A.cache[k]; };

  // ------------------------------------------------------------------ EDIFICIOS
  // def: {w,h, wall, trim, roof, roofType, sign, awning, door, windows, broken, label}
  A.building = function (def) {
    const key = 'bd' + JSON.stringify(def);
    if (A.cache[key]) return A.cache[key];
    const W = def.w * 16, H = (def.h + 2) * 16;
    const [c, g] = cv(W, H);
    const wallH = def.wallH || 34;
    const wallTop = H - wallH;
    const wall = def.wall, wD = VO.shade(wall, -0.18), wL = VO.shade(wall, 0.15), trim = def.trim || '#f4efe4';
    const broken = !!def.broken;
    // pared de tablas horizontales
    P(g, 2, wallTop, W - 4, wallH, wall);
    for (let y = wallTop + 3; y < H - 4; y += 4) { P(g, 2, y, W - 4, 1, wD); P(g, 2, y + 1, W - 4, 1, wL); }
    if (broken) for (let i = 0; i < 18; i++) P(g, 4 + ((VO.hash(i, 1, 3) * (W - 10)) | 0), wallTop + ((VO.hash(i, 2, 3) * (wallH - 6)) | 0), 3, 1, '#7a6a5a');
    P(g, 2, wallTop, 2, wallH, trim); P(g, W - 4, wallTop, 2, wallH, trim);
    // base de piedra
    P(g, 1, H - 5, W - 2, 5, '#8f8a84'); for (let x = 1; x < W - 2; x += 5) P(g, x, H - 5, 1, 5, '#6a655f'); P(g, 1, H - 5, W - 2, 1, '#b0aba4');
    // ventanas
    const wins = [];
    const doorX = Math.floor(W / 2) - 6 + (def.doorOff || 0) * 16;
    const nW = def.windows === undefined ? 2 : def.windows;
    const slots = [];
    for (let i = 0; i < nW; i++) { const fx = nW === 1 ? (doorX > W / 2 ? 0.25 : 0.75) : (i + 0.5) / nW; let wx = Math.round(fx * W) - 6; if (Math.abs(wx - doorX) < 16) wx = wx < doorX ? doorX - 20 : doorX + 20; if (wx > 5 && wx < W - 17) slots.push(wx); }
    slots.forEach((wx) => {
      const wy = wallTop + 8;
      P(g, wx - 3, wy - 1, 3, 13, def.shutter || '#3f8a7a'); P(g, wx + 12, wy - 1, 3, 13, def.shutter || '#3f8a7a');
      for (let k = 0; k < 13; k += 2) { P(g, wx - 3, wy - 1 + k, 3, 1, VO.shade(def.shutter || '#3f8a7a', -0.25)); P(g, wx + 12, wy - 1 + k, 3, 1, VO.shade(def.shutter || '#3f8a7a', -0.25)); }
      P(g, wx - 1, wy - 1, 14, 13, trim);
      if (broken) { P(g, wx, wy, 12, 11, '#4a3a2a'); P(g, wx - 1, wy + 3, 14, 2, '#8a6a4a'); P(g, wx - 1, wy + 7, 14, 2, '#7a5a3a'); }
      else { P(g, wx, wy, 12, 11, '#5a8ab0'); P(g, wx, wy, 12, 5, '#8fc0e0'); P(g, wx + 5, wy, 2, 11, trim); P(g, wx, wy + 5, 12, 1, trim); P(g, wx + 1, wy + 1, 2, 2, '#d8f0ff'); }
      P(g, wx - 2, wy + 11, 16, 2, VO.shade(trim, -0.15));
      if (def.flowers) { for (let k = 0; k < 12; k += 2) P(g, wx + k, wy + 9, 2, 2, ['#e23b2a', '#ffd84a', '#ff8fb5'][k % 3]); P(g, wx, wy + 11, 12, 1, '#3f8a32'); }
      wins.push({ x: wx, y: wy, w: 12, h: 11 });
    });
    // puerta
    const dy = H - 25;
    P(g, doorX - 2, dy - 2, 16, 25, trim);
    P(g, doorX, dy, 12, 22, def.door || '#8a4a2a');
    P(g, doorX, dy, 12, 1, VO.shade(def.door || '#8a4a2a', 0.3));
    P(g, doorX + 2, dy + 3, 8, 7, VO.shade(def.door || '#8a4a2a', -0.2)); P(g, doorX + 2, dy + 12, 8, 7, VO.shade(def.door || '#8a4a2a', -0.2));
    P(g, doorX + 9, dy + 11, 2, 2, '#e8c55a');
    if (broken) { P(g, doorX - 1, dy + 6, 14, 2, '#7a5a3a'); }
    // toldo
    if (def.awning) {
      const ay = dy - 9;
      for (let x = doorX - 8; x < doorX + 20; x += 4) { P(g, x, ay, 4, 6, (x / 4) % 2 ? def.awning : '#f4efe4'); P(g, x, ay + 6, 4, 2, (x / 4) % 2 ? VO.shade(def.awning, -0.2) : '#d8d0c0'); }
    }
    // techo
    const ov = 3;
    const rT = def.roofType || 'zinc', rc = def.roof, rD = VO.shade(rc, -0.25), rL = VO.shade(rc, 0.2);
    const roofTop = 6, roofBot = wallTop + 2;
    for (let y = roofTop; y < roofBot; y++) {
      const t = (y - roofTop) / (roofBot - roofTop);
      const inset = Math.round((1 - t) * 10);
      const x0 = -ov + inset + 3, x1 = W + ov - inset - 3;
      for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) {
        let col = rc;
        if (rT === 'zinc') col = (x % 4 < 2) ? rL : rc;
        else if (rT === 'tile') col = ((y - roofTop) % 5 === 4) ? rD : ((x + ((y / 5) | 0) * 3) % 6 === 0 ? rD : rc);
        else if (rT === 'thatch') col = ((x * 3 + y * 7) % 5 === 0) ? rD : (y % 3 === 0 ? rL : rc);
        if (x > W * 0.55 && rT !== 'zinc') col = VO.shade(col, -0.08);
        if (broken) { const hb = VO.hash((x / 6) | 0, (y / 5) | 0, 7); if (hb < 0.1) col = ((y % 4) === 0) ? '#3a2416' : '#6e4a2c'; else if (hb < 0.22) col = VO.shade(col, (x % 4 < 2) ? -0.28 : -0.18); else if (hb > 0.9) col = '#8a6a3a'; }
        P(g, x, y, 1, 1, col);
      }
    }
    P(g, 0, roofBot - 1, W, 2, rD);
    P(g, 13, roofTop - 1, W - 26, 2, rD);
    // chimenea
    if (def.chimney) { P(g, W - 22, 0, 8, 12, '#8a5a4a'); P(g, W - 23, 0, 10, 2, '#6a3a2a'); }
    // letrero
    if (def.sign) {
      const sx = Math.floor(W / 2) - 10, sy = wallTop - 8;
      P(g, sx, sy, 20, 12, '#c99159'); P(g, sx, sy, 20, 1, '#e0b07a'); P(g, sx, sy + 11, 20, 1, '#6e4524'); P(g, sx, sy, 1, 12, '#6e4524'); P(g, sx + 19, sy, 1, 12, '#6e4524');
      g.drawImage(A.icon(def.sign), sx + 2, sy - 2);
    }
    outline(c);
    const out = { canvas: c, windows: wins, door: { x: doorX, y: dy, w: 12, h: 22 } };
    return (A.cache[key] = out);
  };

  // ------------------------------------------------------------------ PROPS
  A.prop = function (kind) {
    const key = 'pr' + kind;
    if (A.cache[key]) return A.cache[key];
    let c, g;
    switch (kind) {
      case 'fountain': {
        [c, g] = cv(48, 40);
        ell(g, 24, 28, 22, 10, '#a8a29a'); ell(g, 24, 27, 19, 8, '#3a97cf'); ell(g, 24, 25, 14, 4, '#56addc');
        P(g, 21, 6, 6, 20, '#b8b2aa'); P(g, 21, 6, 2, 20, '#d0cac2'); ell(g, 24, 8, 8, 3, '#a8a29a'); ell(g, 24, 7, 6, 2, '#56addc');
        P(g, 23, 0, 2, 7, '#bfe6f5'); P(g, 20, 3, 1, 4, '#bfe6f5'); P(g, 27, 3, 1, 4, '#bfe6f5');
        break;
      }
      case 'board': {
        [c, g] = cv(32, 32);
        P(g, 4, 10, 3, 22, '#6e4524'); P(g, 25, 10, 3, 22, '#6e4524');
        P(g, 1, 4, 30, 20, '#8c5a30'); P(g, 3, 6, 26, 16, '#c99159'); P(g, 1, 2, 30, 3, '#5e3d24');
        [[5, 8, '#f1e3c0'], [14, 7, '#ffe7a0'], [22, 9, '#f1e3c0'], [8, 15, '#dff0d0'], [17, 15, '#f1e3c0']].forEach(([x, y, col]) => { P(g, x, y, 7, 6, col); P(g, x + 3, y, 1, 1, '#c2453a'); P(g, x + 1, y + 2, 5, 1, '#9a8a70'); P(g, x + 1, y + 4, 4, 1, '#9a8a70'); });
        break;
      }
      case 'lamp': {
        [c, g] = cv(16, 32);
        P(g, 7, 8, 2, 22, '#2e2e34'); P(g, 5, 29, 6, 3, '#2e2e34'); P(g, 4, 2, 8, 7, '#2e2e34'); P(g, 5, 3, 6, 5, '#ffe27a'); P(g, 5, 3, 2, 2, '#fff6c8'); P(g, 3, 1, 10, 2, '#1e1e24');
        break;
      }
      case 'bench': {
        [c, g] = cv(32, 16);
        P(g, 2, 2, 28, 3, '#a87444'); P(g, 2, 7, 28, 4, '#c9955f'); P(g, 2, 7, 28, 1, '#e0b07a'); P(g, 4, 11, 2, 5, '#5e3d24'); P(g, 26, 11, 2, 5, '#5e3d24'); P(g, 4, 2, 2, 6, '#5e3d24'); P(g, 26, 2, 2, 6, '#5e3d24');
        break;
      }
      case 'bin': {
        [c, g] = cv(16, 16);
        P(g, 1, 4, 14, 11, '#8c5a30'); P(g, 1, 4, 14, 2, '#c99159'); P(g, 1, 9, 14, 1, '#6e4524'); P(g, 1, 2, 14, 3, '#a87444'); P(g, 6, 6, 4, 2, '#e8c55a');
        break;
      }
      case 'mailbox': {
        [c, g] = cv(16, 24);
        P(g, 7, 10, 2, 14, '#6e4524'); P(g, 3, 4, 10, 7, '#2f6fb0'); P(g, 3, 4, 10, 2, '#5a9ad8'); P(g, 12, 2, 2, 5, '#e23b2a');
        break;
      }
      case 'barrel': {
        [c, g] = cv(16, 16);
        ell(g, 8, 9, 6, 6, '#8c5a30'); P(g, 2, 5, 12, 1, '#3a3a3a'); P(g, 2, 12, 12, 1, '#3a3a3a'); ell(g, 8, 3, 5, 2, '#a87444'); P(g, 4, 6, 2, 6, '#a87444');
        break;
      }
      case 'crate': {
        [c, g] = cv(16, 16);
        P(g, 2, 3, 12, 12, '#b97f48'); P(g, 2, 3, 12, 1, '#d8a26a'); P(g, 2, 8, 12, 1, '#8c5a30'); P(g, 2, 3, 1, 12, '#8c5a30'); P(g, 13, 3, 1, 12, '#8c5a30');
        P(g, 4, 5, 3, 2, '#e8452f'); P(g, 8, 4, 3, 3, '#f2cf3a'); P(g, 10, 5, 2, 2, '#3f8a32');
        break;
      }
      case 'stall': {
        [c, g] = cv(48, 40);
        P(g, 3, 12, 2, 28, '#6e4524'); P(g, 43, 12, 2, 28, '#6e4524');
        for (let x = 0; x < 48; x += 6) { P(g, x, 6, 6, 8, (x / 6) % 2 ? '#e8452f' : '#f4efe4'); P(g, x, 14, 6, 2, (x / 6) % 2 ? '#a82a1a' : '#c8c0b0'); }
        P(g, 2, 26, 44, 10, '#a87444'); P(g, 2, 26, 44, 2, '#c9955f');
        [['#e8452f', 6], ['#f2cf3a', 14], ['#3f8a32', 22], ['#e8892a', 30], ['#b7d65a', 38]].forEach(([col, x]) => { disc(g, x + 2, 24, 3, col); P(g, x + 1, 22, 1, 1, '#ffffff'); });
        break;
      }
      case 'boat': {
        [c, g] = cv(40, 18);
        for (let y = 0; y < 8; y++) P(g, 2 + y, 6 + y, 36 - y * 2, 1, y < 2 ? '#f4efe4' : y < 4 ? '#2f6fb0' : '#a87444');
        P(g, 6, 4, 28, 2, '#c99159'); P(g, 18, 0, 2, 6, '#6e4524');
        break;
      }
      case 'mine': {
        [c, g] = cv(32, 32);
        P(g, 2, 6, 28, 26, '#6e5b49'); ell(g, 16, 22, 10, 12, '#120d0a'); P(g, 6, 22, 20, 10, '#120d0a');
        P(g, 4, 6, 4, 26, '#8c5a30'); P(g, 24, 6, 4, 26, '#8c5a30'); P(g, 2, 4, 28, 4, '#a87444'); P(g, 2, 4, 28, 1, '#c9955f');
        P(g, 12, 26, 8, 1, '#5a4a3e'); P(g, 12, 29, 8, 1, '#5a4a3e');
        break;
      }
      case 'ladder': {
        [c, g] = cv(16, 16);
        P(g, 2, 2, 12, 12, '#120d0a'); P(g, 4, 1, 2, 14, '#8c5a30'); P(g, 10, 1, 2, 14, '#8c5a30'); for (let y = 3; y < 15; y += 3) P(g, 4, y, 8, 1, '#c99159');
        break;
      }
      case 'coop': {
        [c, g] = cv(48, 40);
        P(g, 4, 18, 40, 20, '#c9955f'); for (let y = 20; y < 38; y += 4) P(g, 4, y, 40, 1, '#a87444');
        for (let y = 4; y < 20; y++) { const ins = Math.round((20 - y) * 1.2); P(g, 2 + ins, y, 44 - ins * 2, 1, y % 3 ? '#c2453a' : '#a8362c'); }
        P(g, 20, 26, 10, 12, '#5e3d24'); P(g, 8, 24, 8, 6, '#f1e3c0'); P(g, 9, 25, 6, 4, '#3a2618');
        break;
      }
      case 'trough': {
        [c, g] = cv(32, 16);
        P(g, 2, 6, 28, 8, '#8c5a30'); P(g, 4, 6, 24, 3, '#3a2618'); P(g, 2, 6, 28, 1, '#c9955f'); P(g, 4, 14, 2, 2, '#5e3d24'); P(g, 26, 14, 2, 2, '#5e3d24');
        break;
      }
      case 'trough_full': {
        [c, g] = cv(32, 16);
        P(g, 2, 6, 28, 8, '#8c5a30'); P(g, 4, 5, 24, 4, '#9ac24a'); for (let x = 4; x < 28; x += 2) P(g, x, 4 + (x % 3), 1, 2, '#c8e07a'); P(g, 4, 14, 2, 2, '#5e3d24'); P(g, 26, 14, 2, 2, '#5e3d24');
        break;
      }
      case 'bed': {
        [c, g] = cv(32, 32);
        P(g, 2, 2, 28, 28, '#8c5a30'); P(g, 4, 4, 24, 24, '#f1e9da'); P(g, 6, 5, 20, 7, '#ffffff'); P(g, 4, 13, 24, 15, '#2f8a7a'); for (let y = 15; y < 28; y += 3) P(g, 4, y, 24, 1, '#3aa894');
        break;
      }
      case 'workbench': {
        [c, g] = cv(32, 24);
        P(g, 1, 6, 30, 6, '#a87444'); P(g, 1, 6, 30, 2, '#c9955f'); P(g, 3, 12, 3, 12, '#6e4524'); P(g, 26, 12, 3, 12, '#6e4524'); P(g, 6, 2, 8, 4, '#8d8478'); P(g, 18, 3, 6, 3, '#c79a5e'); P(g, 25, 1, 2, 5, '#5e3d24');
        break;
      }
      case 'torch': {
        [c, g] = cv(16, 16);
        P(g, 7, 7, 2, 8, '#6e4524'); P(g, 6, 13, 4, 2, '#5a4a3e'); disc(g, 8, 5, 2, '#f08a2a'); P(g, 7, 2, 2, 4, '#ffd27a'); P(g, 8, 1, 1, 2, '#fff2c0');
        break;
      }
      case 'furnace': {
        [c, g] = cv(16, 24);
        P(g, 1, 4, 14, 20, '#7a6a5e'); P(g, 1, 4, 14, 2, '#9a8a7e'); for (let y = 8; y < 24; y += 4) P(g, 1, y, 14, 1, '#5a4a3e'); P(g, 4, 14, 8, 7, '#2a1b12'); P(g, 5, 17, 6, 4, '#e86a2c'); P(g, 6, 18, 4, 2, '#ffd27a');
        break;
      }
      default: { if (A.EXTRA && A.EXTRA[kind]) { c = A.EXTRA[kind](); break; } [c, g] = cv(16, 16); A.P(g, 0, 0, 16, 16, '#f0f'); }
    }
    return (A.cache[key] = outline(c));
  };

  // Objetos colocables (construcción) — sprite según id
  A.placeable = function (id, neighbors) {
    if (id === 'fence') {
      const key = 'fe' + (neighbors || '');
      if (A.cache[key]) return A.cache[key];
      const [c, g] = cv(16, 24); const n = neighbors || '';
      P(g, 6, 6, 4, 16, '#c99159'); P(g, 6, 6, 4, 2, '#e0b07a'); P(g, 9, 8, 1, 14, '#8c5a30');
      if (n.includes('l')) { P(g, 0, 10, 6, 2, '#b97f48'); P(g, 0, 16, 6, 2, '#b97f48'); }
      if (n.includes('r')) { P(g, 10, 10, 6, 2, '#b97f48'); P(g, 10, 16, 6, 2, '#b97f48'); }
      if (n.includes('u')) { P(g, 7, 0, 2, 6, '#b97f48'); }
      if (n.includes('d')) { P(g, 7, 22, 2, 2, '#b97f48'); }
      return (A.cache[key] = outline(c));
    }
    const map = { chest: 'chest', lamp: 'lamp', table: 'table', chair: 'chair', rug: 'rug', plant_pot: 'plant_pot', bookshelf: 'bookshelf', bed: 'bed', workbench: 'workbench', sprinkler: 'sprinkler', path_stone: 'path_stone' };
    if (id === 'lamp') return A.prop('lamp');
    if (id === 'workbench') return A.prop('workbench');
    if (id === 'bed') return A.prop('bed');
    const key = 'pl' + id;
    if (A.cache[key]) return A.cache[key];
    const [c, g] = cv(16, 16); g.drawImage(A.icon(map[id] || id), 0, 0);
    return (A.cache[key] = c);
  };
})();
