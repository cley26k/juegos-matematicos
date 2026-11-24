'use strict';
// Arte en alta densidad (×2). El mundo se dibuja a doble resolución interna: cada sprite se
// reconstruye con Scale2x (suaviza curvas y diagonales sin perder el estilo pixel), se le añade
// textura fina y contornos de 1 píxel, y los personajes reciben detalle propio (ojos con iris,
// pestañas, labios, mechones, pliegues de ropa).
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art;
  A.RS = 2;

  // ---------- drawImage consciente de imágenes HD ----------
  // Las coordenadas de origen y destino se siguen dando en unidades lógicas (16 px por casilla).
  const proto = CanvasRenderingContext2D.prototype; const orig = proto.drawImage;
  proto.drawImage = function (img, ...a) {
    if (img && img._hd) {
      if (a.length === 2) return orig.call(this, img, a[0], a[1], img.width / 2, img.height / 2);
      if (a.length === 8) return orig.call(this, img, a[0] * 2, a[1] * 2, a[2] * 2, a[3] * 2, a[4], a[5], a[6], a[7]);
    }
    return orig.call(this, img, ...a);
  };

  // ---------- Scale2x (EPX) ----------
  A.scale2x = function (src) {
    const w = src.width, h = src.height;
    const sd = new Uint32Array(src.getContext('2d').getImageData(0, 0, w, h).data.buffer);
    const out = VO.makeCanvas(w * 2, h * 2); const og = out.getContext('2d');
    const id = og.createImageData(w * 2, h * 2); const od = new Uint32Array(id.data.buffer); const W2 = w * 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const P = sd[y * w + x];
      const Au = y > 0 ? sd[(y - 1) * w + x] : P, Bu = x < w - 1 ? sd[y * w + x + 1] : P, Cu = x > 0 ? sd[y * w + x - 1] : P, Du = y < h - 1 ? sd[(y + 1) * w + x] : P;
      const o = (y * 2) * W2 + x * 2;
      od[o] = (Cu === Au && Cu !== Du && Au !== Bu) ? Au : P;
      od[o + 1] = (Au === Bu && Au !== Cu && Bu !== Du) ? Bu : P;
      od[o + W2] = (Du === Cu && Du !== Bu && Cu !== Au) ? Cu : P;
      od[o + W2 + 1] = (Bu === Du && Bu !== Au && Du !== Cu) ? Du : P;
    }
    og.putImageData(id, 0, 0);
    return out;
  };
  // Textura fina en zonas planas + contornos exteriores a 1 píxel
  A.refine = function (c, opts) {
    opts = opts || {};
    const g = c.getContext('2d'); const w = c.width, h = c.height;
    const im = g.getImageData(0, 0, w, h); const d = im.data; const u = new Uint32Array(d.buffer);
    const lum = (i) => d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : u[y * w + x]);
    const al = (v) => v >>> 24;
    // contorno: quita la capa exterior de los contornos oscuros de 2 px
    if (opts.thin !== false) {
      const kill = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; const v = u[i]; if (al(v) < 250 || lum(i) > 70) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (al(at(x + dx, y + dy)) === 0 && at(x - dx, y - dy) === v) { kill.push(i); break; } }
      }
      kill.forEach((i) => { u[i] = 0; });
    }
    // grano: variación sutil en superficies planas
    if (opts.grain !== false) {
      const amt = opts.grain || 0.05;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x; const v = u[i]; if (al(v) < 250) continue;
        if (u[i - 1] !== v || u[i + 1] !== v || u[i - w] !== v || u[i + w] !== v) continue;
        let hh = (x * 374761393 + y * 668265263) | 0; hh = Math.imul(hh ^ (hh >>> 13), 1274126177); const r = ((hh ^ (hh >>> 16)) >>> 0) / 4294967296; if (r > 0.16) continue;
        const k = r < 0.08 ? 1 - amt : 1 + amt; const j = i * 4;
        d[j] = Math.min(255, d[j] * k); d[j + 1] = Math.min(255, d[j + 1] * k); d[j + 2] = Math.min(255, d[j + 2] * k);
      }
    }
    g.putImageData(im, 0, 0);
    return c;
  };
  const memo = new WeakMap();
  A.toHD = function (c, opts) {
    if (!c || c._hd) return c;
    if (memo.has(c)) return memo.get(c);
    const out = A.refine(A.scale2x(c), opts); out._hd = true; memo.set(c, out); return out;
  };

  // ---------- envolver los generadores de sprites del mundo ----------
  const wrap = (name, opts) => { const f = A[name]; A[name] = function (...a) { return A.toHD(f.apply(this, a), opts); }; };
  ['makeTree', 'makePalm', 'makePine', 'makeBush', 'makeRock', 'makeWeed', 'makeStump', 'makeCrop'].forEach((n) => wrap(n));
  wrap('placeable'); wrap('soilFor', { thin: false, grain: 0.04 });
  const propF = A.prop; A.prop = function (k) { return A.toHD(propF.call(this, k)); };
  const bF = A.building; A.building = function (def) { const r = bF.call(this, def); if (!r._hdDone) { r.canvas = A.toHD(r.canvas, { grain: 0.035 }); r._hdDone = true; } return r; };
  A.chicken = A.chicken.map((c) => A.toHD(c)); if (A.goat) A.goat = A.goat.map((c) => A.toHD(c));

  // Suelo: la caché del mapa completo pasa a HD
  // la versión HD del suelo se reutiliza mientras el terreno no cambie
  const groundStore = new Map();
  const gkey = (m) => { let sum = 0; for (let i = 0; i < m.t.length; i++) sum = (Math.imul(sum, 31) + m.t[i] + 1) | 0; return m.id + ":" + m.w + "x" + m.h + ":" + sum; };
  A.groundPeek = (m) => groundStore.get(gkey(m));
  A.groundHD = function (c, m) {
    if (!m) return A.toHD(c, { thin: false, grain: 0.045 });
    let k = m.id + ':' + m.w + 'x' + m.h + ':'; let sum = 0; for (let i = 0; i < m.t.length; i++) sum = (Math.imul(sum, 31) + m.t[i] + 1) | 0; k += sum;
    if (groundStore.has(k)) return groundStore.get(k);
    const out = A.toHD(c, { thin: false, grain: 0.045 }); if (groundStore.size > 12) groundStore.clear(); groundStore.set(k, out); return out;
  };

  // ---------- Personajes HD ----------
  const OUT = '#2a1b12';
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  function detail(g, L, dir, fr) {
    // g: lienzo HD 32×72 de un cuadro sin contorno
    const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const blink = fr === 3; const f0 = blink ? 0 : fr; const walk = f0 === 1 || f0 === 2;
    const K = L.kid ? 6 : 0; const bob = walk ? -1 : 0; const hy = (2 + K + bob + 3) * 2; // fila de la cabeza en HD
    const sh = VO.shade; const sk = L.skin, skD = sh(sk, -0.18);
    // mechones y pliegues: escanea colores del pelo y la camisa
    const im = g.getImageData(0, 0, 32, 72); const d = im.data;
    const hr = hex(L.hair), s1 = hex(L.shirt), p1 = hex(L.pants);
    const near = (i, c) => Math.abs(d[i] - c[0]) < 26 && Math.abs(d[i + 1] - c[1]) < 26 && Math.abs(d[i + 2] - c[2]) < 26;
    for (let y = 0; y < 72; y++) for (let x = 0; x < 32; x++) {
      const i = (y * 32 + x) * 4; if (d[i + 3] < 200) continue;
      if (L.style !== 'bald' && near(i, hr) && (x * 2 + y + (dir === 1 ? 1 : 0)) % 7 === 0) { d[i] *= 0.78; d[i + 1] *= 0.78; d[i + 2] *= 0.78; }
      else if (near(i, s1) && ((x + y * 3) % 13 === 0 || (x - y) % 17 === 0)) { d[i] *= 0.86; d[i + 1] *= 0.86; d[i + 2] *= 0.86; }
      else if (near(i, p1) && y > 52 && (x === 15 || x === 16) && dir !== 1 && dir !== 2) { d[i] *= 0.8; d[i + 1] *= 0.8; d[i + 2] *= 0.8; }
    }
    g.putImageData(im, 0, 0);
    // rostro
    if (dir === 0) {
      const ey = hy + 12;
      if (blink) { P(10, ey + 2, 4, 1, OUT); P(18, ey + 2, 4, 1, OUT); }
      else {
        [[10, 1], [18, 0]].forEach(([ex, inner]) => {
          P(ex, ey, 4, 4, '#fbf8f2'); P(ex + (inner ? 2 : 0), ey + 1, 2, 3, L.eye || '#4a3222'); P(ex + (inner ? 2 : 0), ey + 2, 2, 1, '#1a120a');
          P(ex + (inner ? 2 : 0), ey + 1, 1, 1, '#ffffff'); P(ex, ey - 1, 4, 1, OUT);
        });
      }
      P(10, ey - 3, 4, 1, sh(L.hair, -0.15)); P(18, ey - 3, 4, 1, sh(L.hair, -0.15));
      P(15, ey + 4, 2, 2, skD); P(16, ey + 5, 1, 1, sh(sk, -0.3));
      P(14, ey + 8, 4, 1, '#9a3a30'); P(14, ey + 9, 4, 1, '#c86a5a'); if (!L.beard) { P(13, ey + 8, 1, 1, skD); P(18, ey + 8, 1, 1, skD); }
      P(8, ey + 5, 2, 2, 'rgba(240,140,130,0.55)'); P(22, ey + 5, 2, 2, 'rgba(240,140,130,0.55)');
    } else if (dir === 1 || dir === 2) {
      const ey = hy + 12; const ex = dir === 2 ? 18 : 10;
      if (blink) P(ex, ey + 2, 4, 1, OUT);
      else { P(ex, ey, 4, 4, '#fbf8f2'); P(dir === 2 ? ex + 2 : ex, ey + 1, 2, 3, L.eye || '#4a3222'); P(dir === 2 ? ex + 2 : ex, ey + 1, 1, 1, '#ffffff'); P(ex, ey - 1, 4, 1, OUT); }
      P(ex, ey - 3, 4, 1, sh(L.hair, -0.15));
      P(dir === 2 ? 20 : 10, ey + 9, 3, 1, '#9a3a30');
    }
    // manos con dedos y suelas de zapato
    const im2 = g.getImageData(0, 0, 32, 72); const e = im2.data; const skc = hex(sk);
    for (let y = 30; y < 60; y++) for (let x = 0; x < 32; x++) { const i = (y * 32 + x) * 4; if (e[i + 3] > 200 && Math.abs(e[i] - skc[0]) < 20 && Math.abs(e[i + 1] - skc[1]) < 20 && y % 2 === 0 && (x % 2 === 0)) { e[i] *= 0.88; e[i + 1] *= 0.88; e[i + 2] *= 0.88; } }
    g.putImageData(im2, 0, 0);
    for (let x = 0; x < 32; x++) { for (let y = 71; y > 50; y--) { const i = (y * 32 + x) * 4; if (e[i + 3] > 200) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, y, 1, 1); break; } } }
  }
  A.charSheet = function (L) {
    const key = 'hdc' + JSON.stringify(L);
    if (A.cache[key]) return A.cache[key];
    const sheet = VO.makeCanvas(128, 288); const sg = sheet.getContext('2d');
    for (let d = 0; d < 4; d++) for (let f = 0; f < 4; f++) {
      const lo = VO.makeCanvas(16, 36); A.drawChar(lo.getContext('2d'), 0, 3, L, d, f);
      const hi = A.scale2x(lo); detail(hi.getContext('2d'), L, d, f); A.outline(hi, OUT);
      orig.call(sg, hi, f * 32, d * 72);
    }
    sheet._hd = true;
    return (A.cache[key] = sheet);
  };
})();
