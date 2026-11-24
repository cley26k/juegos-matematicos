'use strict';
// Personajes 16×32 con más detalle (proporciones más altas, sombreado por partes,
// manos, cuello, ropa con pliegues) y versión infantil. Reemplaza a A.charSheet.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art; const sh = VO.shade;
  A.CH = 36; // cuadro con márgenes: el pie queda en la fila 34
  const OUT = '#2a1b12';

  function drawChar(g, ox, oy, L, dir, fr) {
    const blink = fr === 3; if (blink) fr = 0;
    const step = fr === 1 ? 1 : fr === 2 ? -1 : 0, walk = step !== 0;
    const kid = !!L.kid; const K = kid ? 6 : 0; // los niños son 6 px más bajos
    const bob = walk ? -1 : 0;
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, h); };
    const sk = L.skin, skD = sh(sk, -0.16), skDD = sh(sk, -0.3), skL = sh(sk, 0.12);
    const hr = L.hair, hrL = sh(hr, 0.28), hrD = sh(hr, -0.28);
    const s1 = L.shirt, s2 = sh(s1, -0.2), s3 = sh(s1, -0.36), sL = sh(s1, 0.22);
    const p1 = L.pants, p2 = sh(p1, -0.24), so = L.shoes || '#3a2618', soL = sh(so, 0.35);
    const side = dir === 1 || dir === 2, flip = dir === 1;
    const X = (x, w) => (flip ? 16 - x - (w || 1) : x); // espejo para mirar a la izquierda
    const sp = (x, y, w, h, c) => px(X(x, w), y, w, h, c);

    // ---------- PIERNAS Y ZAPATOS ----------
    const ly = 24 + (kid ? 1 : 0);
    const legH = kid ? 4 : 6;
    if (!side) {
      const lUp = step > 0 ? 2 : 0, rUp = step < 0 ? 2 : 0;
      px(5, ly + bob, 3, legH - lUp, p1); px(5, ly + bob, 1, legH - lUp, sh(p1, 0.12));
      px(8, ly + bob, 3, legH - rUp, p2);
      px(4, ly + legH - lUp + bob, 4, 2, so); px(4, ly + legH - lUp + bob, 2, 1, soL);
      px(8, ly + legH - rUp + bob, 4, 2, so); px(8, ly + legH - rUp + bob, 1, 1, soL);
    } else {
      if (walk) {
        sp(4, ly + bob, 3, legH - 1, p2); sp(3, ly + legH - 1 + bob, 4, 2, so);
        sp(9, ly + bob, 3, legH - 1, p1); sp(9, ly + legH - 1 + bob, 5, 2, so); sp(12, ly + legH - 1 + bob, 1, 1, soL);
      } else {
        sp(6, ly, 4, legH, p1); sp(9, ly, 1, legH, p2); sp(6, ly + legH, 6, 2, so); sp(10, ly + legH, 1, 1, soL);
      }
    }
    // ---------- TORSO ----------
    const ty = 14 + K + bob; const tH = kid ? 8 : 10;
    if (!side) {
      px(4, ty + 1, 8, tH - 1, s1); px(3, ty + 1, 10, 3, s1); // hombros
      px(4, ty + 1, 1, tH - 1, sL); px(10, ty + 1, 2, tH - 1, s2); px(11, ty + 2, 1, tH - 2, s3);
      px(6, ty + 5, 1, 2, s2); px(9, ty + 6, 1, 2, s2); // pliegues
      if (dir === 0) { px(6, ty, 4, 1, sL); px(7, ty, 2, 2, skD); if (!L.apron) { px(8, ty + 3, 1, 1, s3); px(8, ty + 6, 1, 1, s3); } }
      else { px(5, ty, 6, 1, s2); }
      px(4, ty + tH - 1, 8, 1, sh(p1, -0.45)); if (dir === 0) px(7, ty + tH - 1, 2, 1, '#d8b44a');
      if (L.apron && dir === 0) { px(5, ty + 3, 6, tH - 3, L.apron); px(5, ty + 3, 6, 1, sh(L.apron, 0.25)); px(10, ty + 3, 1, tH - 3, sh(L.apron, -0.2)); px(6, ty + 1, 1, 2, sh(L.apron, -0.1)); px(9, ty + 1, 1, 2, sh(L.apron, -0.1)); }
      // brazos
      const la = step > 0 ? 1 : step < 0 ? -1 : 0;
      px(2, ty + 2 + la, 2, kid ? 4 : 6, s1); px(2, ty + 2 + la, 1, kid ? 4 : 6, sL); px(2, ty + (kid ? 6 : 8) + la, 2, 2, sk); px(3, ty + (kid ? 7 : 9) + la, 1, 1, skD);
      px(12, ty + 2 - la, 2, kid ? 4 : 6, s2); px(13, ty + 2 - la, 1, kid ? 4 : 6, s3); px(12, ty + (kid ? 6 : 8) - la, 2, 2, skD);
    } else {
      sp(5, ty + 1, 6, tH - 1, s1); sp(5, ty + 1, 1, tH - 1, s2); sp(10, ty + 1, 1, tH - 1, sL);
      sp(7, ty, 3, 1, skD); sp(5, ty + tH - 1, 6, 1, sh(p1, -0.45));
      if (L.apron) { sp(9, ty + 3, 2, tH - 3, L.apron); }
      const sw = step;
      sp(7 + sw, ty + 2, 2, kid ? 4 : 6, s2); sp(7 + sw, ty + 2, 1, kid ? 4 : 6, s3); sp(7 + sw, ty + (kid ? 6 : 8), 2, 2, sk);
    }
    // ---------- CABEZA ----------
    const hy = 2 + K + bob;
    if (!side) {
      px(4, hy + 1, 8, 10, sk); px(3, hy + 3, 10, 6, sk); // cara redondeada
      px(11, hy + 3, 2, 6, skD); px(4, hy + 10, 8, 1, skD); px(5, hy + 11, 6, 1, skDD);
      px(2, hy + 6, 1, 2, skD); px(13, hy + 6, 1, 2, skD); // orejas
      if (dir === 0) {
        if (blink) { px(5, hy + 7, 2, 1, OUT); px(9, hy + 7, 2, 1, OUT); }
        else { px(5, hy + 6, 2, 2, OUT); px(9, hy + 6, 2, 2, OUT); px(5, hy + 6, 1, 1, '#ffffff'); px(9, hy + 6, 1, 1, '#ffffff'); px(6, hy + 7, 1, 1, L.eye || '#4a3a2a'); px(10, hy + 7, 1, 1, L.eye || '#4a3a2a'); }
        px(5, hy + 5, 2, 1, hrD); px(9, hy + 5, 2, 1, hrD); // cejas
        px(4, hy + 9, 1, 1, '#ee9e8e'); px(11, hy + 9, 1, 1, '#ee9e8e'); // mejillas
        px(7, hy + 8, 2, 1, skD); // nariz
        px(7, hy + 10, 2, 1, '#a8483a'); px(6, hy + 10, 1, 1, skDD);
        px(5, hy + 2, 3, 1, skL);
      }
    } else {
      sp(5, hy + 1, 7, 10, sk); sp(4, hy + 3, 9, 6, sk); sp(12, hy + 5, 1, 3, sk); // nariz de perfil
      sp(4, hy + 10, 7, 1, skD); sp(5, hy + 11, 5, 1, skDD);
      sp(6, hy + 6, 2, 2, skD); // oreja
      if (blink) sp(9, hy + 7, 2, 1, OUT); else { sp(9, hy + 6, 2, 2, OUT); sp(10, hy + 6, 1, 1, '#ffffff'); }
      sp(9, hy + 5, 2, 1, hrD); sp(11, hy + 9, 1, 1, '#ee9e8e'); sp(10, hy + 10, 2, 1, '#a8483a');
    }
    // ---------- PELO ----------
    const st = L.style || 'short';
    if (st !== 'bald') {
      if (!side) {
        if (dir === 3) { px(3, hy, 10, 10, hr); px(4, hy - 1, 8, 1, hr); px(2, hy + 3, 1, 6, hrD); px(13, hy + 3, 1, 6, hrD); px(5, hy + 1, 4, 1, hrL); px(4, hy + 9, 8, 2, hrD); }
        else {
          px(4, hy - 1, 8, 2, hr); px(3, hy, 10, 4, hr); px(2, hy + 2, 2, 4, hr); px(12, hy + 2, 2, 4, hrD);
          px(5, hy - 1, 4, 1, hrL); px(4, hy + 1, 3, 1, hrL); px(10, hy + 1, 2, 1, hrD);
          for (let i = 4; i < 12; i += 2) px(i, hy + 4, 1, 1, hr); // flequillo
        }
      } else {
        sp(4, hy - 1, 8, 2, hr); sp(3, hy, 9, 4, hr); sp(3, hy + 2, 4, 7, hr); sp(3, hy + 2, 1, 7, hrD); sp(6, hy - 1, 4, 1, hrL); sp(8, hy + 1, 3, 1, hrL); sp(10, hy + 3, 2, 2, hr);
      }
      if (st === 'long') { if (dir === 3) px(3, hy + 9, 10, 6, hr); else if (!side) { px(2, hy + 5, 2, 9, hr); px(12, hy + 5, 2, 9, hrD); px(2, hy + 12, 1, 2, hrD); } else sp(3, hy + 8, 4, 7, hr); }
      if (st === 'pony') { if (dir === 3) { px(7, hy + 9, 2, 7, hr); px(7, hy + 9, 1, 7, hrL); } else if (side) { sp(1, hy + 3, 3, 8, hr); sp(1, hy + 3, 1, 8, hrD); } else px(6, hy - 2, 4, 2, hrD); }
      if (st === 'curly') { const cy0 = hy - 2; for (let i = 0; i < 6; i++) { const cx0 = side ? X(3 + i * 2, 3) : 2 + i * 2; px(cx0, cy0 + (i % 2), 3, 3, i % 2 ? hr : hrL); } if (!side) { px(1, hy + 2, 2, 5, hr); px(13, hy + 2, 2, 5, hrD); } else sp(2, hy + 2, 3, 6, hr); }
    }
    if (L.beard && dir !== 3) { if (!side) { px(3, hy + 8, 10, 3, hr); px(4, hy + 11, 8, 1, hr); px(7, hy + 10, 2, 1, '#a8483a'); px(4, hy + 8, 2, 1, hrL); } else { sp(5, hy + 8, 7, 3, hr); sp(10, hy + 10, 2, 1, '#a8483a'); } }
    if (L.glasses && dir !== 3) { if (!side) { px(4, hy + 5, 4, 4, OUT); px(8, hy + 5, 4, 4, OUT); px(5, hy + 6, 2, 2, '#cfeaf5'); px(9, hy + 6, 2, 2, '#cfeaf5'); px(5, hy + 6, 1, 1, '#ffffff'); } else { sp(8, hy + 5, 4, 4, OUT); sp(9, hy + 6, 2, 2, '#cfeaf5'); sp(4, hy + 6, 4, 1, OUT); } }
    // ---------- SOMBREROS ----------
    if (L.hat === 'straw') { const c = L.hatC || '#e8c55a', cD = sh(c, -0.25), cL = sh(c, 0.3); px(0, hy + 2, 16, 2, cD); px(1, hy + 1, 14, 1, c); px(3, hy - 3, 10, 4, c); px(4, hy - 4, 8, 1, cL); px(3, hy, 10, 1, '#c0392b'); px(5, hy - 3, 3, 1, cL); for (let i = 1; i < 15; i += 3) px(i, hy + 2, 1, 1, cL); }
    if (L.hat === 'cap') { const c = L.hatC || '#2f6fb0'; px(3, hy - 2, 10, 4, c); px(5, hy - 2, 4, 1, sh(c, 0.3)); px(7, hy - 3, 2, 1, sh(c, -0.2)); if (dir === 0) px(3, hy + 2, 10, 1, sh(c, -0.35)); if (side) sp(10, hy + 2, 5, 1, sh(c, -0.35)); }
    if (L.hat === 'band') { const c = L.hatC || '#c0392b'; px(2, hy + 1, 12, 2, c); px(3, hy + 1, 4, 1, sh(c, 0.3)); if (dir === 3 || side) sp(2, hy + 3, 2, 4, sh(c, -0.2)); }
  }

  A.drawChar = drawChar;
  A.charSheet = function (L) {
    const key = 'c36' + JSON.stringify(L);
    if (A.cache[key]) return A.cache[key];
    const [c, g] = A.cv(64, 144);
    for (let d = 0; d < 4; d++) for (let f = 0; f < 4; f++) {
      const [fc, fg] = A.cv(16, 36); drawChar(fg, 0, 3, L, d, f); A.outline(fc, OUT); g.drawImage(fc, f * 16, d * 36);
    }
    return (A.cache[key] = c);
  };
})();
