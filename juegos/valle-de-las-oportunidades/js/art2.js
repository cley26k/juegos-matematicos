'use strict';
// Arte adicional: mobiliario de interiores, decoración del pueblo y baldosas de interior.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art, P = A.P, disc = A.disc, ell = A.ell, cv = A.cv;
  const E = (A.EXTRA = {});
  const sh = VO.shade;
  const wood = (g, x, y, w, h, c) => { c = c || '#a87444'; P(g, x, y, w, h, c); P(g, x, y, w, 1, sh(c, 0.25)); P(g, x, y + h - 1, w, 1, sh(c, -0.3)); for (let i = 3; i < h - 1; i += 4) P(g, x + 1, y + i, w - 2, 1, sh(c, -0.12)); };

  // ---------- Mostrador (4 casillas) ----------
  E.counter = () => { const [c, g] = cv(64, 28); wood(g, 0, 8, 64, 20, '#8c5a30'); P(g, 0, 4, 64, 6, '#c9955f'); P(g, 0, 4, 64, 1, '#e8b47a'); for (let x = 4; x < 64; x += 12) P(g, x, 12, 8, 12, '#7a4a26'); P(g, 46, 0, 10, 5, '#3a3a3a'); P(g, 47, 1, 8, 2, '#7cc4ea'); P(g, 6, 1, 6, 4, '#e8c55a'); P(g, 7, 0, 4, 1, '#fff0a0'); return c; };
  E.counter_glass = () => { const [c, g] = cv(64, 32); wood(g, 0, 14, 64, 18, '#5a3a6a'); P(g, 0, 10, 64, 4, '#d8c8a0'); for (let x = 2; x < 64; x += 16) { P(g, x, 0, 2, 11, '#c9a050'); } P(g, 0, 0, 64, 2, '#c9a050'); g.fillStyle = 'rgba(190,230,245,0.45)'; g.fillRect(0, 2, 64, 8); P(g, 8, 3, 1, 6, '#ffffff'); P(g, 40, 3, 1, 6, '#ffffff'); return c; };
  // ---------- Estanterías con mercancía ----------
  const shelf = (fill) => () => { const [c, g] = cv(32, 32); wood(g, 0, 0, 32, 32, '#7a4a26'); for (let r = 0; r < 3; r++) { P(g, 2, 2 + r * 10, 28, 8, '#3a2214'); P(g, 1, 9 + r * 10, 30, 2, '#a87444'); fill(g, r); } return c; };
  E.shelf_food = shelf((g, r) => { const cols = [['#e8452f', '#ff8a6a'], ['#f2a33a', '#ffd27a'], ['#b7d65a', '#e3f08a'], ['#e8892a', '#ffbb5a']]; for (let i = 0; i < 5; i++) { const k = cols[(i + r) % 4]; disc(g, 5 + i * 5.5, 6 + r * 10, 2, k[0]); P(g, 4 + i * 5.5, 5 + r * 10, 1, 1, k[1]); } });
  E.shelf_seeds = shelf((g, r) => { const cols = ['#e23b2a', '#e8b42a', '#8a3a9a', '#e8892a', '#6a8a3a', '#2f6fb0']; for (let i = 0; i < 6; i++) { P(g, 3 + i * 4.6, 3 + r * 10, 4, 6, '#f1e3c0'); P(g, 3 + i * 4.6, 3 + r * 10, 4, 2, cols[(i + r * 2) % 6]); } });
  E.shelf_books = shelf((g, r) => { const cols = ['#c2453a', '#2f6fb0', '#e8c55a', '#3f8a32', '#8a3a9a', '#e8892a', '#5a5a5a']; for (let i = 0; i < 12; i++) { const hh = 5 + ((i * 7 + r) % 3); P(g, 3 + i * 2.2, 10 - hh + r * 10, 2, hh, cols[(i + r * 3) % 7]); } });
  E.shelf_tools = shelf((g, r) => { for (let i = 0; i < 4; i++) { P(g, 5 + i * 7, 3 + r * 10, 1, 6, '#a0703a'); P(g, 4 + i * 7, 3 + r * 10, 4, 2, ['#c9d3db', '#d9824a', '#8d8478'][(i + r) % 3]); } });
  E.shelf_jars = shelf((g, r) => { for (let i = 0; i < 5; i++) { P(g, 4 + i * 5.5, 3 + r * 10, 4, 6, '#d8e8f0'); P(g, 4 + i * 5.5, 5 + r * 10, 4, 4, ['#c2453a', '#e8892a', '#b7d65a'][(i + r) % 3]); P(g, 4 + i * 5.5, 2 + r * 10, 4, 1, '#e8c55a'); } });
  E.plank_rack = () => { const [c, g] = cv(32, 32); P(g, 2, 0, 3, 32, '#5e3d24'); P(g, 27, 0, 3, 32, '#5e3d24'); for (let i = 0; i < 6; i++) wood(g, 0, 3 + i * 5, 32, 3, ['#c99159', '#b97f48', '#d8a26a'][i % 3]); return c; };
  // ---------- Mobiliario ----------
  E.sacks = () => { const [c, g] = cv(32, 20); [[7, '#d8c090'], [17, '#c8b080'], [26, '#e0c898']].forEach(([x, col]) => { ell(g, x, 12, 6, 7, col); P(g, x - 2, 4, 4, 2, sh(col, -0.3)); P(g, x - 3, 12, 6, 1, sh(col, -0.15)); }); P(g, 3, 9, 4, 3, '#8a3a9a'); return c; };
  E.plant_big = () => { const [c, g] = cv(16, 28); P(g, 4, 20, 8, 8, '#b5543a'); P(g, 3, 20, 10, 2, '#d4704e'); for (let k = 0; k < 7; k++) { const a = -2.6 + k * 0.45; for (let t = 0; t < 10; t++) P(g, 8 + Math.cos(a) * t, 20 + Math.sin(a) * t * 1.6 + t * t * 0.05, 2, 1, t > 6 ? '#7fca54' : k % 2 ? '#3b8834' : '#55a83e'); } return c; };
  E.rug_big = () => { const [c, g] = cv(48, 32); P(g, 0, 0, 48, 32, '#a8362c'); P(g, 3, 3, 42, 26, '#e8c55a'); P(g, 6, 6, 36, 20, '#c2453a'); for (let x = 8; x < 40; x += 6) { P(g, x, 14, 4, 4, '#2f6fb0'); P(g, x + 1, 15, 2, 2, '#f4efe4'); } for (let x = 0; x < 48; x += 3) { P(g, x, 0, 1, 2, '#f4efe4'); P(g, x, 30, 1, 2, '#f4efe4'); } return c; };
  E.rug_round = () => { const [c, g] = cv(48, 32); ell(g, 24, 16, 22, 14, '#2f8a7a'); ell(g, 24, 16, 17, 10, '#e8d8b0'); ell(g, 24, 16, 11, 6, '#3aa894'); ell(g, 24, 16, 5, 2, '#f4efe4'); return c; };
  E.table_big = () => { const [c, g] = cv(32, 24); wood(g, 0, 4, 32, 10, '#b97f48'); P(g, 2, 14, 3, 10, '#6e4524'); P(g, 27, 14, 3, 10, '#6e4524'); P(g, 6, 1, 6, 4, '#f1e3c0'); P(g, 18, 2, 5, 3, '#d8e8f0'); P(g, 19, 0, 3, 2, '#e8452f'); return c; };
  E.desk = () => { const [c, g] = cv(32, 24); wood(g, 0, 6, 32, 18, '#6e4524'); P(g, 0, 4, 32, 4, '#8c5a30'); P(g, 4, 0, 8, 5, '#f1e3c0'); P(g, 5, 1, 6, 1, '#9a8a70'); P(g, 22, 0, 4, 5, '#2a2a2a'); P(g, 21, 0, 6, 1, '#e8c55a'); P(g, 12, 12, 8, 2, '#c9a050'); return c; };
  E.chair_s = () => { const [c, g] = cv(16, 20); P(g, 3, 0, 10, 10, '#8c5a30'); P(g, 4, 1, 8, 8, '#b97f48'); P(g, 3, 10, 10, 3, '#c99159'); P(g, 3, 13, 2, 7, '#5e3d24'); P(g, 11, 13, 2, 7, '#5e3d24'); return c; };
  E.vault = () => { const [c, g] = cv(32, 32); P(g, 0, 0, 32, 32, '#6a7078'); disc(g, 16, 16, 13, '#8a929c'); disc(g, 16, 16, 10, '#a8b0b8'); disc(g, 16, 16, 3, '#5a6068'); for (let k = 0; k < 6; k++) { const a = k * 1.047; P(g, 16 + Math.cos(a) * 7, 16 + Math.sin(a) * 7, 2, 2, '#3a4048'); } P(g, 26, 12, 4, 8, '#c9a050'); return c; };
  E.clock = () => { const [c, g] = cv(16, 32); wood(g, 2, 0, 12, 32, '#6e4524'); disc(g, 8, 7, 4, '#f4efe4'); P(g, 8, 4, 1, 4, '#2a1b12'); P(g, 8, 7, 3, 1, '#2a1b12'); P(g, 5, 14, 6, 14, '#3a2214'); P(g, 7, 16, 2, 9, '#c9a050'); disc(g, 8, 25, 2, '#e8c55a'); return c; };
  E.flag = () => { const [c, g] = cv(20, 32); P(g, 2, 0, 2, 32, '#8a8a8a'); P(g, 4, 2, 15, 10, '#ffffff'); P(g, 4, 2, 7, 4, '#1a3a8a'); P(g, 12, 8, 7, 4, '#1a3a8a'); P(g, 12, 2, 7, 4, '#c8202a'); P(g, 4, 8, 7, 4, '#c8202a'); P(g, 10, 6, 3, 2, '#3f8a32'); return c; };
  E.painting = () => { const [c, g] = cv(28, 20); P(g, 0, 0, 28, 20, '#c9a050'); P(g, 2, 2, 24, 16, '#8fd0ee'); P(g, 2, 11, 24, 7, '#5fae3c'); for (let x = 2; x < 26; x++) P(g, x, 9 + Math.round(Math.sin(x / 3) * 2), 1, 3, '#4f8a6a'); disc(g, 20, 6, 2, '#fff2a0'); P(g, 7, 12, 4, 3, '#f2cf3a'); P(g, 7, 11, 4, 1, '#b5402e'); return c; };
  E.window_in = () => { const [c, g] = cv(24, 22); P(g, 0, 0, 24, 22, '#f4efe4'); P(g, 2, 2, 20, 16, '#8fd0ee'); P(g, 2, 2, 20, 7, '#bfe6f5'); P(g, 11, 2, 2, 16, '#f4efe4'); P(g, 2, 9, 20, 2, '#f4efe4'); P(g, 0, 18, 24, 4, '#c9955f'); P(g, 3, 3, 3, 2, '#ffffff'); P(g, 0, 0, 3, 22, '#3f8a7a'); P(g, 21, 0, 3, 22, '#3f8a7a'); return c; };
  E.anvil = () => { const [c, g] = cv(24, 18); P(g, 0, 2, 20, 5, '#4a4a52'); P(g, 0, 2, 20, 1, '#7a7a82'); P(g, 18, 3, 6, 3, '#4a4a52'); P(g, 6, 7, 8, 5, '#3a3a42'); P(g, 3, 12, 14, 6, '#5a3a22'); P(g, 3, 12, 14, 1, '#7a5a3a'); return c; };
  E.forge = () => { const [c, g] = cv(32, 40); P(g, 2, 10, 28, 30, '#7a6a5e'); for (let y = 12; y < 40; y += 5) for (let x = 2 + (y % 10 ? 0 : 4); x < 30; x += 8) P(g, x, y, 7, 4, '#8a7a6e'); P(g, 8, 0, 16, 12, '#6a5a4e'); P(g, 6, 24, 20, 12, '#2a1b12'); P(g, 8, 28, 16, 8, '#e86a2c'); P(g, 11, 30, 10, 5, '#ffb04a'); P(g, 14, 32, 4, 2, '#fff2c0'); return c; };
  E.sawhorse = () => { const [c, g] = cv(32, 18); wood(g, 0, 4, 32, 4, '#c99159'); P(g, 3, 8, 2, 10, '#6e4524'); P(g, 27, 8, 2, 10, '#6e4524'); wood(g, 6, 0, 18, 4, '#d8a26a'); P(g, 14, 0, 1, 4, '#8d8478'); return c; };
  E.woodpile = () => { const [c, g] = cv(32, 20); for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - (r ? 1 : 0); i++) { const x = 4 + i * 8 + r * 4, y = 14 - r * 6; disc(g, x, y, 3, '#8a5e37'); disc(g, x, y, 2, '#d4a56a'); P(g, x, y, 1, 1, '#8a5e37'); } return c; };
  E.coalpile = () => { const [c, g] = cv(24, 14); ell(g, 12, 9, 11, 5, '#2a2624'); for (let i = 0; i < 9; i++) P(g, 3 + i * 2.2, 6 + (i % 3), 2, 1, '#5a5452'); return c; };
  E.waterbarrel = () => { const [c, g] = cv(16, 18); ell(g, 8, 10, 7, 7, '#8c5a30'); P(g, 1, 6, 14, 1, '#3a3a3a'); P(g, 1, 13, 14, 1, '#3a3a3a'); ell(g, 8, 4, 6, 2, '#3a97cf'); P(g, 5, 3, 3, 1, '#bfe6f5'); return c; };
  E.basket = () => { const [c, g] = cv(16, 14); P(g, 2, 6, 12, 8, '#b07a40'); for (let x = 2; x < 14; x += 2) P(g, x, 6, 1, 8, '#8a5a2a'); disc(g, 5, 5, 2, '#e8452f'); disc(g, 9, 4, 2, '#f2a33a'); disc(g, 12, 5, 2, '#b7d65a'); return c; };
  E.lamp_wall = () => { const [c, g] = cv(12, 16); P(g, 5, 8, 2, 8, '#2e2e34'); P(g, 2, 2, 8, 7, '#2e2e34'); P(g, 3, 3, 6, 5, '#ffe27a'); P(g, 3, 3, 2, 2, '#fff6c8'); return c; };
  E.globe = () => { const [c, g] = cv(16, 22); disc(g, 8, 7, 6, '#3a97cf'); P(g, 4, 4, 4, 3, '#5fae3c'); P(g, 9, 8, 3, 3, '#5fae3c'); P(g, 7, 13, 2, 5, '#6e4524'); P(g, 3, 18, 10, 3, '#8c5a30'); return c; };
  E.noticeboard = () => { const [c, g] = cv(32, 24); wood(g, 0, 0, 32, 24, '#6e4524'); P(g, 2, 2, 28, 20, '#c9955f'); [[4, 4, '#f1e3c0'], [14, 3, '#ffe7a0'], [22, 6, '#dff0d0'], [7, 13, '#f1e3c0'], [18, 13, '#fbd0c8']].forEach(([x, y, col]) => { P(g, x, y, 8, 7, col); P(g, x + 3, y, 1, 1, '#c2453a'); P(g, x + 1, y + 3, 6, 1, '#9a8a70'); }); return c; };
  E.fireplace = () => { const [c, g] = cv(32, 32); P(g, 0, 4, 32, 28, '#9a7a6a'); for (let y = 6; y < 32; y += 5) for (let x = (y % 10 ? 0 : 4); x < 32; x += 8) P(g, x, y, 7, 4, '#b08a78'); P(g, 0, 0, 32, 5, '#6e4524'); P(g, 6, 14, 20, 18, '#2a1b12'); P(g, 9, 24, 14, 6, '#8a5e37'); P(g, 11, 18, 10, 8, '#e86a2c'); P(g, 13, 20, 6, 5, '#ffb04a'); return c; };
  E.kitchen = () => { const [c, g] = cv(32, 28); wood(g, 0, 6, 32, 22, '#a87444'); P(g, 0, 4, 32, 4, '#d8c8b0'); P(g, 4, 0, 8, 5, '#5a5a62'); disc(g, 8, 2, 3, '#3a3a42'); P(g, 18, 0, 10, 5, '#c9d3db'); P(g, 22, 1, 2, 2, '#7cc4ea'); for (let x = 3; x < 32; x += 10) P(g, x, 12, 7, 12, '#8c5a30'); return c; };
  E.shaft = () => { const [c, g] = cv(32, 32); ell(g, 16, 18, 14, 11, '#3a2e27'); ell(g, 16, 18, 11, 8, '#0c0908'); P(g, 3, 6, 3, 22, '#6e4524'); P(g, 26, 6, 3, 22, '#6e4524'); P(g, 2, 4, 28, 4, '#8c5a30'); P(g, 2, 4, 28, 1, '#c99159'); P(g, 13, 10, 2, 16, '#8c5a30'); P(g, 18, 10, 2, 16, '#8c5a30'); for (let y = 12; y < 26; y += 4) P(g, 13, y, 7, 1, '#c99159'); return c; };
  // ---------- Exterior ----------
  E.flowerbox = () => { const [c, g] = cv(32, 18); wood(g, 0, 8, 32, 10, '#8c5a30'); P(g, 1, 6, 30, 3, '#5a3a22'); for (let i = 0; i < 10; i++) { const x = 2 + i * 3; P(g, x, 2 + (i % 3), 1, 5, '#3f8a32'); const col = ['#e23b2a', '#ffd84a', '#ff8fb5', '#ffffff', '#c78bff'][i % 5]; P(g, x - 1, 1 + (i % 3), 3, 2, col); P(g, x, 1 + (i % 3), 1, 1, '#fff2a0'); } return c; };
  E.umbrella = () => { const [c, g] = cv(32, 32); P(g, 15, 10, 2, 22, '#6e4524'); for (let y = 0; y < 10; y++) { const w = Math.round(4 + y * 1.3); for (let x = -w; x < w; x++) P(g, 16 + x, y, 1, 1, Math.floor((x + 20) / 4) % 2 ? '#e8452f' : '#f4efe4'); } P(g, 3, 10, 26, 1, '#a82a1a'); ell(g, 16, 28, 9, 3, '#a87444'); P(g, 8, 24, 16, 4, '#c9955f'); disc(g, 12, 23, 2, '#f2cf3a'); disc(g, 19, 23, 2, '#e8892a'); return c; };
  E.well = () => { const [c, g] = cv(32, 36); ell(g, 16, 28, 14, 7, '#8f8a84'); ell(g, 16, 27, 11, 5, '#2a3a4a'); for (let x = 3; x < 30; x += 5) P(g, x, 24, 4, 3, '#aaa59e'); P(g, 3, 6, 2, 20, '#6e4524'); P(g, 27, 6, 2, 20, '#6e4524'); for (let y = 0; y < 7; y++) P(g, 1 + y, y, 30 - y * 2, 1, '#a8362c'); P(g, 15, 8, 2, 12, '#c9a066'); P(g, 13, 18, 6, 4, '#8c5a30'); return c; };
  E.cart = () => { const [c, g] = cv(40, 26); wood(g, 2, 4, 30, 12, '#a87444'); disc(g, 9, 19, 6, '#5e3d24'); disc(g, 9, 19, 2, '#c9955f'); disc(g, 27, 19, 6, '#5e3d24'); disc(g, 27, 19, 2, '#c9955f'); P(g, 32, 10, 8, 2, '#6e4524'); disc(g, 10, 3, 3, '#e8892a'); disc(g, 17, 2, 3, '#e8452f'); disc(g, 24, 3, 3, '#f2cf3a'); return c; };
  E.hay = () => { const [c, g] = cv(16, 14); P(g, 1, 3, 14, 11, '#e0c060'); for (let x = 1; x < 15; x += 2) P(g, x, 3, 1, 11, '#c8a040'); P(g, 1, 7, 14, 1, '#a87a30'); return c; };

  // Baldosas de interior adicionales
  const T = VO.T; T.TILEF = 17; T.STONEF = 18; T.CARPET = 19;
  const base = A.drawTile;
  A.drawTile = function (g, map, tx, ty) {
    const t = map.get(tx, ty); const x = tx * 16, y = ty * 16;
    if (t === T.TILEF) { const a = (tx + ty) % 2; P(g, x, y, 16, 16, a ? '#e8dcc4' : '#c8b896'); P(g, x, y, 16, 1, a ? '#f4ecd8' : '#d8c8a8'); P(g, x, y + 15, 16, 1, '#a89878'); return; }
    if (t === T.STONEF) { P(g, x, y, 16, 16, '#6e655c'); [[0, 0, 8, 7], [8, 0, 8, 5], [0, 7, 6, 9], [6, 5, 10, 6], [6, 11, 10, 5]].forEach((s, i) => { P(g, x + s[0], y + s[1], s[2] - 1, s[3] - 1, ['#8a8076', '#7d736a', '#958a80'][(tx * 3 + ty + i) % 3]); P(g, x + s[0], y + s[1], s[2] - 1, 1, '#a89e94'); }); return; }
    if (t === T.CARPET) { P(g, x, y, 16, 16, map.carpetC || '#8a3a4a'); if ((tx + ty) % 2) P(g, x + 6, y + 6, 4, 4, sh(map.carpetC || '#8a3a4a', 0.2)); return; }
    if (t === T.WALLIN) {
      const wc = map.wallC || '#e9d3a8', wn = map.wainC || '#9a6a3c';
      const n = (dx, dy) => map.get(tx + dx, ty + dy);
      if (ty > 2 || tx === 0 || tx === map.w - 1) {
        // remate superior de muro (vista cenital): viga oscura con borde claro hacia el interior
        P(g, x, y, 16, 16, '#3e2614');
        const fl = (v) => v !== T.WALLIN && v !== T.VOID;
        if (fl(n(1, 0))) P(g, x + 13, y, 3, 16, '#6e4524');
        if (fl(n(-1, 0))) P(g, x, y, 3, 16, '#6e4524');
        if (fl(n(0, -1))) { P(g, x, y, 16, 3, '#6e4524'); P(g, x, y, 16, 1, '#8c5a30'); }
        for (let i = 2; i < 16; i += 6) P(g, x + 6, y + i, 4, 1, '#2a1a0e');
        return;
      }
      P(g, x, y, 16, 16, wc);
      if (map.wallPattern === 'stripe') for (let i = 0; i < 16; i += 4) P(g, x + i, y, 2, 16, sh(wc, -0.06));
      else if (map.wallPattern === 'brick') for (let r = 0; r < 16; r += 4) { P(g, x, y + r + 3, 16, 1, sh(wc, -0.2)); P(g, x + ((r / 4) % 2 ? 4 : 12), y + r, 1, 3, sh(wc, -0.2)); }
      else if (map.wallPattern === 'plank') for (let i = 0; i < 16; i += 5) { P(g, x + i, y, 1, 16, sh(wc, -0.18)); P(g, x + i + 1, y, 1, 16, sh(wc, 0.1)); }
      else for (let i = 0; i < 16; i += 4) P(g, x + i, y, 1, 16, sh(wc, -0.05));
      if (n(0, 1) !== T.WALLIN && n(0, 1) !== T.VOID) { P(g, x, y + 9, 16, 7, wn); P(g, x, y + 9, 16, 1, sh(wn, 0.3)); P(g, x, y + 15, 16, 1, sh(wn, -0.35)); for (let i = 2; i < 16; i += 8) P(g, x + i, y + 11, 4, 3, sh(wn, -0.12)); }
      if (n(0, -1) !== T.WALLIN) P(g, x, y, 16, 2, sh(wc, -0.45));
      if (n(-1, 0) !== T.WALLIN && n(-1, 0) !== T.VOID) P(g, x, y, 2, 16, sh(wc, -0.3));
      if (n(1, 0) !== T.WALLIN && n(1, 0) !== T.VOID) P(g, x + 14, y, 2, 16, sh(wc, -0.3));
      return;
    }
    return base(g, map, tx, ty);
  };
})();

// ---------- Texto en pixel art (umbral 1 bit + contorno) ----------
(function () {
  const A = VO.Art; const cache = new Map();
  const meas = VO.makeCanvas(8, 8);
  A.pixelText = function (str, color) {
    const key = str + '|' + color;
    if (cache.has(key)) return cache.get(key);
    if (cache.size > 400) cache.clear();
    const mg = meas.getContext('2d'); const font = '9px Arial, Helvetica, sans-serif'; mg.font = font;
    const w = Math.ceil(mg.measureText(str).width) + 4, h = 13;
    const c = VO.makeCanvas(w, h); const g = c.getContext('2d');
    g.font = font; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; g.fillText(str, 2, 10);
    const id = g.getImageData(0, 0, w, h); const d = id.data;
    const n = parseInt(color.slice(1), 16); const r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 100) { d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; } else d[i + 3] = 0; }
    g.putImageData(id, 0, 0);
    A.outline(c, '#1e120a');
    cache.set(key, c);
    return c;
  };
  // Cabra (2 cuadros)
  A.goat = [0, 1].map((f) => {
    const [c, g] = A.cv(18, 16); const P = A.P;
    A.ell(g, 8, 9, 6, 4, '#f1ebe0'); P(g, 4, 6, 8, 2, '#ffffff'); P(g, 3, 9, 3, 3, '#d8c8b0');
    P(g, 13, 3 + f, 4, 5, '#f1ebe0'); P(g, 13, 1 + f, 1, 3, '#8a7a6a'); P(g, 16, 1 + f, 1, 3, '#8a7a6a'); P(g, 15, 5 + f, 1, 1, '#2a1b12'); P(g, 16, 8 + f, 1, 2, '#d8c8b0'); P(g, 12, 4 + f, 1, 2, '#c8b8a0');
    P(g, 4, 13, 1, 3 - f, '#5a4a3e'); P(g, 7, 13, 1, 2 + f, '#5a4a3e'); P(g, 10, 13, 1, 3 - f, '#5a4a3e'); P(g, 12, 13, 1, 2 + f, '#5a4a3e'); P(g, 2, 6, 2, 2, '#f1ebe0');
    return A.outline(c);
  });
})();
