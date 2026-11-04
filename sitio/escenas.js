// Las escenas de la historia. Cada una recibe u (0 a 1, avance del capítulo según el scroll).
(function () {
  const { seg, ss, lerp, clamp, rnd, pasos, TINTA, PAPEL, POSES: P, outBack, outExpo } = K;
  const E = (K.ESCENAS = {});
  const FUENTE = '"Dela Gothic One", Impact, sans-serif';
  const MATE = '"Cambria Math", "STIX Two Math", "Times New Roman", serif';
  // Centra la acción y la aparta cuando entra el clip del juego.
  const FOCO = (K.FOCO = [0.56, 0.64, 0.92, 0.97]);
  function camara(c, st, u, fn, z = 1) {
    const e = ss(FOCO[0], FOCO[1], u) * (1 - ss(FOCO[2], FOCO[3], u));
    c.save();
    if (st.vertical) { c.translate(0, -190 * e); c.scale(z * (1 - 0.38 * e), z * (1 - 0.38 * e)); }
    else { c.translate(-st.hw * 0.46 * e, 0); c.scale(z * (1 - 0.16 * e), z * (1 - 0.16 * e)); }
    fn();
    c.restore();
  }
  // Un plano recortado en diagonal, como una viñeta de manga dentro de la pantalla.
  function vineta(c, pts, fn, borde = 10) {
    c.save(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();
    fn(); c.restore();
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.lineWidth = borde; c.strokeStyle = TINTA; c.lineJoin = 'miter'; c.stroke();
    c.lineWidth = borde * 0.4; c.strokeStyle = '#fff'; c.stroke();
  }

  function ciudad(c, st, base, color, luces, seed, ancho = 80, alto = 300, despl = 0) {
    let x = -st.hw - 200 + ((despl % (ancho * 3)) || 0), i = 0;
    while (x < st.hw + 200) {
      const w = ancho * (0.7 + rnd(seed + i) * 0.9), h = alto * (0.35 + rnd(seed + i + 40) * 0.8);
      c.fillStyle = color; c.fillRect(x, base - h, w + 1, h + 800);
      if (luces) for (let a = 0; a < 7; a++) for (let b = 0; b < 3; b++) {
        if (rnd(seed + i * 9 + a * 3 + b * 17) > 0.62) {
          c.fillStyle = luces;
          c.fillRect(x + 7 + b * (w / 3.1), base - h + 12 + a * (h / 7.5), w / 6, h / 15);
        }
      }
      x += w + 4; i++;
    }
  }
  function lluvia(c, st, t, color = 'rgba(190,215,255,.5)', n = 70) {
    c.strokeStyle = color; c.lineWidth = 2; c.beginPath();
    const s = pasos(t, 12);
    for (let i = 0; i < n; i++) {
      const x = (rnd(i) - 0.5) * (st.hw * 2 + 200), y = ((rnd(i + 3) * 1200 + s * (1100 + rnd(i) * 500)) % 1200) - 600;
      c.moveTo(x, y); c.lineTo(x - 14, y + 46);
    }
    c.stroke();
  }

  /* ───────────── PRÓLOGO ───────────── */
  E.prologo = (c, u, st) => {
    const { t, p } = st;
    if (u < 0.24) {
      const k = seg(u, 0, 0.24);
      K.vert(c, st, ['#0a0b2a', '#1b1a55', '#46307f', '#c0517f']);
      K.estrellas(c, st, t);
      K.disco(c, st.hw * 0.5, -300 + k * 80, 118, '#fff3c4');
      K.disco(c, st.hw * 0.5 + 34, -320 + k * 80, 100, '#242263');
      K.cifras(c, st, t, 'rgba(255,255,255,.1)');
      ciudad(c, st, 620 - k * 290, '#27225f', 'rgba(255,214,120,.45)', 3, 100, 520);
      ciudad(c, st, 720 - k * 380, '#16143f', 'rgba(255,190,100,.8)', 11, 130, 420);
      const entr = outBack(seg(st.tiempoAbs, 0.2, 1.3));
      const sal = ss(0.5, 1, k);
      const tam = st.vertical ? st.hw * 0.4 : clamp(st.hw * 0.52, 118, 330);
      c.save(); c.translate(st.vertical ? -12 : 0, -100 - sal * 760); c.scale(entr, entr); c.rotate(-0.045);
      c.font = `${tam}px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      c.lineWidth = tam * 0.22; c.strokeStyle = TINTA; c.strokeText('CERO', 8, 12);
      c.fillStyle = '#ff3d2e'; c.fillText('CERO', 8, 12);
      c.lineWidth = tam * 0.05; c.strokeStyle = '#fff6e3'; c.strokeText('CERO', 0, 0);
      c.fillStyle = '#fff6e3'; c.fillText('CERO', 0, 0);
      c.restore();
      K.cero(c, -st.hw * 0.05, 960 - k * 670, 0.82, P.parado(p), { expr: 'normal', t: p, viento: 0.5 });
    } else if (u < 0.47) {
      const k = seg(u, 0.24, 0.47);
      K.vert(c, st, ['#1a1a4a', '#403377', '#a35a8d', '#e88f76']);
      ciudad(c, st, 180, '#312a6c', 'rgba(255,214,120,.5)', 7, 110, 420, -k * 160);
      ciudad(c, st, 250, '#201d52', 'rgba(255,190,110,.75)', 17, 150, 360, -k * 330);
      K.suelo(c, st, 250, '#16143e');
      c.fillStyle = K.trama(c, 'rgba(255,255,255,.08)', 14, 2.6); c.fillRect(-st.hw, 250, st.hw * 2, 400);
      // Farola
      const fx = st.hw * 0.42 - k * 200;
      c.fillStyle = TINTA; c.fillRect(fx, -120, 12, 372);
      K.disco(c, fx + 6, -130, 28, '#ffe9a0', 5);
      c.save(); c.globalAlpha = 0.18; c.fillStyle = '#ffe9a0'; c.beginPath(); c.moveTo(fx + 6, -130); c.lineTo(fx - 200, 252); c.lineTo(fx + 212, 252); c.closePath(); c.fill(); c.restore();
      const ve = [['9', '#ffd35c'], ['7', '#7fe0c3'], ['1', '#ff9cb5'], ['5', '#9cc2ff'], ['3', '#ffb07c'], ['8', '#c9a6ff']];
      ve.forEach((v, i) => {
        const dir = i % 2 ? -1 : 1;
        const lane = 250 + (i % 3) * 16;
        const x = ((((k * 1.15 + i * 0.27) * dir + 4) % 1) * 2 - 1) * (st.hw + 240);
        K.vecino(c, x, lane, 0.72 + (i % 3) * 0.14, v[0], v[1], pasos(k * 22 + i, 2), dir, 1);
      });
      K.cero(c, lerp(-st.hw * 0.16, st.hw * 0.08, k), 300, 0.9, K.mezcla(P.camina(pasos(k * 18, 2)), P.triste(p), 0.5), { expr: 'triste', t: p, viento: 0.25 });
      lluvia(c, st, t);
    } else if (u < 0.68) {
      const k = seg(u, 0.47, 0.68);
      K.vert(c, st, ['#0d1038', '#1c2158', '#2b2e6f', '#40407e']);
      c.fillStyle = K.trama(c, 'rgba(120,150,255,.2)', 18, 4.2); c.fillRect(-st.hw, -540, st.hw * 2, 700);
      K.bandaTrama(c, st, 120, 540, 'rgba(0,0,0,.45)');
      K.velocidad(c, st, 0, -40, 0.28, p, 'rgba(255,255,255,.1)', 40);
      const z = lerp(2.9, 3.9, k) * (st.vertical ? 0.78 : 1);
      K.boil(p, 0.8);
      K.cabeza(c, st.vertical ? -30 : -40, 40 + k * 20, z, { expr: 'triste', t: p, lagrima: seg(k, 0.25, 1), inc: 0.08, mira: [0, 0.7] });
      lluvia(c, st, t, 'rgba(200,225,255,.55)', 60);
    } else if (u < 0.86) {
      const k = seg(u, 0.68, 0.86);
      if (k < 0.5) {
        // Ojo en primerísimo plano con las puertas reflejadas
        K.vert(c, st, ['#ffe1c8', '#ffdcc2', '#f4b79c', '#f4b79c']);
        const q = seg(k, 0, 0.5);
        const w = Math.min(st.hw * 0.84, 620) * lerp(0.9, 1, q);
        K.boil(p, 1.4);
        K.ojo(c, 0, -10, w, w * 1.25 * 0.82, {
          sorpresa: ss(0.1, 0.5, q) * 0.45, par: 0, mira: [0, 0],
          reflejo: (cc, ix, iy, irw, irh) => {
            for (let i = 0; i < 9; i++) {
              const a = i * 0.7 + q * 1.2, r = irw * (0.12 + i * 0.075);
              const dx = ix + Math.cos(a) * r, dy = iy + irh * 0.25 + Math.sin(a) * r * 0.45;
              cc.fillStyle = '#fffbe0'; cc.fillRect(dx - irw * 0.055, dy - irh * 0.075, irw * 0.11, irh * 0.15);
              cc.fillStyle = `hsl(${i * 40},95%,62%)`; cc.fillRect(dx - irw * 0.035, dy - irh * 0.055, irw * 0.07, irh * 0.11);
            }
          },
        });
      } else {
        const q = seg(k, 0.5, 1);
        K.vert(c, st, ['#090a2c', '#231c6a', '#6f2f93', '#f07f77']);
        K.estrellas(c, st, t);
        ciudad(c, st, 310, '#14123a', 'rgba(255,200,110,.6)', 5, 120, 360);
        // Nueve puertas abiertas en el cielo
        for (let i = 0; i < 9; i++) {
          const ap = outBack(seg(q, i * 0.055, 0.32 + i * 0.055));
          const R = st.hw * 0.84, v = i / 8;
          const dx = st.vertical ? (i % 3 - 1) * st.hw * 0.62 : lerp(-R, R, v);
          const dy = st.vertical ? -230 + Math.floor(i / 3) * 150 : 60 - Math.sin(v * Math.PI) * 300;
          c.save(); c.translate(dx, dy); c.scale(ap, ap);
          K.radial(c, 0, 0, 92, 'rgba(255,245,170,.7)', 'rgba(255,245,170,0)');
          c.fillStyle = TINTA; c.fillRect(-27, -42, 54, 84);
          c.fillStyle = `hsl(${i * 40},95%,70%)`; c.fillRect(-20, -35, 40, 70);
          c.fillStyle = TINTA; c.font = `32px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), 0, 0);
          c.restore();
        }
        K.cero(c, 0, 430, 0.82, P.alto(), { expr: 'sorpresa', t: p, viento: 0.9, mira: [0, -1] });
      }
    } else {
      const k = seg(u, 0.86, 1);
      K.vert(c, st, ['#ff7d3c', '#ff3d2e', '#b4153c', '#1b0a2f']);
      K.velocidad(c, st, 0, -40, 1, p, 'rgba(255,255,255,.9)', 110);
      const z = lerp(1, 2.1, k) * (st.vertical ? 0.95 : 1);
      K.cero(c, 0, 460 + k * 170, z, P.corre(pasos(k * 16, 2) * 6.28), { expr: 'grito', t: p * 3, viento: 1.2 });
      K.sfx(c, '¡AHORA!', st.vertical ? 0 : -st.hw * 0.42, -320, st.vertical ? 94 : 158, -0.12, seg(k, 0.25, 0.5), '#fff', TINTA);
      K.impacto(c, st, seg(k, 0.25, 0.38));
    }
  };

  /* ───────────── 1. PIZZA ───────────── */
  function porcion(c, a0, a1, R, seed) {
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a0, a1); c.closePath();
    c.fillStyle = '#ffcd4a'; c.fill();
    c.save(); c.clip();
    c.fillStyle = '#ffb22c';
    for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(Math.cos(a0 + rnd(seed + i) * (a1 - a0)) * R * rnd(seed + i + 8), Math.sin(a0 + rnd(seed + i) * (a1 - a0)) * R * rnd(seed + i + 8), R * 0.06, 0, 7); c.fill(); }
    for (let i = 0; i < 4; i++) {
      const a = a0 + (a1 - a0) * (0.2 + 0.2 * i), r = R * (0.35 + rnd(seed + i * 7) * 0.45);
      K.disco(c, Math.cos(a) * r, Math.sin(a) * r, R * 0.085, '#d6321f', Math.max(2, R * 0.012));
    }
    c.restore();
    c.beginPath(); c.arc(0, 0, R, a0, a1); c.lineWidth = R * 0.08; c.strokeStyle = '#c97a26'; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R + R * 0.04, a0, a1); c.closePath(); c.lineWidth = Math.max(4, R * 0.02); c.strokeStyle = TINTA; c.lineJoin = 'round'; c.stroke();
  }
  E['pizza-fraccionaria'] = (c, u, st) => {
    const { t, p } = st;
    K.vert(c, st, ['#ffb12c', '#ff8a3c', '#ff6647', '#d93b3e']);
    c.save(); c.translate(0, -200); c.rotate(pasos(t * 0.1, 8)); c.fillStyle = 'rgba(255,240,170,.26)';
    for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(1600, -180); c.lineTo(1600, 180); c.closePath(); c.fill(); }
    c.restore();
    c.fillStyle = K.trama(c, 'rgba(120,20,20,.16)', 16, 3.4); c.fillRect(-st.hw, -540, st.hw * 2, 1080);
    // Suelo de baldosas
    for (let i = -12; i < 12; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#fff0cf' : '#ee5a42'; c.fillRect(i * 110, 330 + j * 110, 110, 110); }
    c.fillStyle = TINTA; c.fillRect(-st.hw - 4, 326, st.hw * 2 + 8, 8);
    const baja = outExpo(seg(u, 0.13, 0.26)), corta = seg(u, 0.27, 0.38), expl = ss(0.38, 0.48, u);
    const R = st.vertical ? 215 : 270, py = lerp(-1000, -130, baja), N = 8;
    camara(c, st, u, () => {
      K.temblor(c, 1 - seg(u, 0.26, 0.3), t, u > 0.25 ? 26 : 0);
      for (let i = 0; i < N; i++) {
        const a = (i * 6.283) / N - 1.57 + (1 - baja) * 2 + (u - 0.2) * 0.8, m = a + 3.1416 / N;
        const propia = i === 2;
        const dist = expl * (propia ? 0 : 340 + i * 26);
        c.save();
        const obj = propia ? lerp(0, 1, ss(0.42, 0.53, u)) : 0;
        c.translate(lerp(Math.cos(m) * dist, -10, obj), lerp(py + Math.sin(m) * dist * 0.72 - expl * 60, 170, obj));
        c.rotate(expl * (propia ? 0.3 : i - 3.5) * 0.5 + obj * 0.2);
        K.boil(i + 1, 0.4);
        porcion(c, a, a + 6.283 / N, propia ? lerp(R, R * 0.5, obj) : R, i * 3 + 1);
        c.restore();
      }
      // Cortes
      if (corta > 0 && corta < 1) {
        for (let i = 0; i < 4; i++) {
          const q = seg(corta, i * 0.2, i * 0.2 + 0.3); if (q <= 0 || q >= 1) continue;
          const a = (i * Math.PI) / 4 + 0.4, L = R + 120;
          c.strokeStyle = '#fff'; c.lineWidth = 16 * (1 - q) + 2;
          c.beginPath(); c.moveTo(Math.cos(a) * -L, py + Math.sin(a) * -L); c.lineTo(Math.cos(a) * L * (q * 2 - 1), py + Math.sin(a) * L * (q * 2 - 1)); c.stroke();
        }
      }
      K.sfx(c, '¡ZAS!', st.vertical ? 40 : st.hw * 0.4, -320, st.vertical ? 86 : 138, 0.14, seg(u, 0.285, 0.33) * (1 - ss(0.42, 0.47, u)), '#fff', '#b00f24');
      const entra = ss(0.03, 0.22, u);
      const parado = u > 0.22;
      const pose = u < 0.42 ? (parado ? K.mezcla(P.parado(p), P.alto(), seg(u, 0.24, 0.3)) : P.corre(pasos(u * 40, 2) * 6.28)) : u < 0.53 ? P.sostiene() : P.victoria(p);
      const expr = u < 0.26 ? 'normal' : u < 0.42 ? 'sorpresa' : u < 0.53 ? 'sorpresa' : 'feliz';
      K.cero(c, lerp(-st.hw - 200, -40, entra), 372, 0.9, pose, { expr, t: p, viento: parado ? 0.4 : 1, mira: u > 0.24 && u < 0.45 ? [0, -1] : [0.2, 0] });
      // Fracción gigante
      const fr = outBack(seg(u, 0.53, 0.62));
      if (fr > 0) {
        c.save(); c.translate(st.vertical ? 170 : 300, -130); c.scale(fr, fr); c.rotate(0.06);
        K.sfx(c, '1', 0, -86, 150, 0, 1, '#fff', TINTA);
        c.fillStyle = TINTA; c.fillRect(-84, -12, 168, 24); c.fillStyle = '#fff'; c.fillRect(-76, -5, 152, 10);
        K.sfx(c, '8', 0, 88, 150, 0, 1, '#ffd35c', TINTA);
        c.restore();
      }
    });
    K.rotulo(c, st, seg(u, 0.02, 0.14), 'MUNDO 1', 'LA PIZZA PARTIDA', '#ffd35c');
  };

  /* ───────────── 2. COCO CONJUNTOS ───────────── */
  function bicho(c, x, y, r, sim, col, fase) {
    const sq = 1 + Math.sin(fase) * 0.05;
    K.forma(c, [[x - r, y], [x - r * 0.8, y - r * sq], [x, y - r * 1.22 * sq], [x + r * 0.8, y - r * sq], [x + r, y], [x + r * 0.76, y + r * 0.82], [x, y + r], [x - r * 0.76, y + r * 0.82]], col, Math.max(4, r * 0.07));
    K.disco(c, x - r * 0.42, y - r * 0.28, r * 0.13, TINTA); K.disco(c, x + r * 0.42, y - r * 0.28, r * 0.13, TINTA);
    K.disco(c, x - r * 0.46, y - r * 0.33, r * 0.05, '#fff'); K.disco(c, x + r * 0.38, y - r * 0.33, r * 0.05, '#fff');
    c.fillStyle = TINTA; c.font = `700 ${r * 0.95}px ${MATE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(sim, x, y + r * 0.34);
  }
  E['coco-conjuntos'] = (c, u, st) => {
    const { t, p } = st;
    K.vert(c, st, ['#4fd1e0', '#8de3d8', '#fff0b3', '#ffc98b']);
    K.disco(c, st.hw * 0.52, -320, 86, '#fff7cf');
    K.nube(c, -st.hw * 0.56 + pasos(t * 3, 6), -360, 1.1, '#fff', '#cdeef3');
    K.nube(c, st.hw * 0.25 - pasos(t * 2, 6), -430, 0.72, '#fff', '#cdeef3');
    c.fillStyle = '#27a7c9'; c.fillRect(-st.hw - 4, 40, st.hw * 2 + 8, 300);
    c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 16; i++) c.fillRect((rnd(i) - 0.5) * st.hw * 2, 60 + rnd(i + 3) * 220, 50 + rnd(i + 5) * 90, 5);
    K.forma(c, [[-st.hw - 50, 330], [-st.hw * 0.4, 275], [st.hw * 0.3, 300], [st.hw + 50, 268], [st.hw + 50, 600], [-st.hw - 50, 600]], '#ffe29a', 6);
    // Palmeras
    [[-0.86, 1], [0.84, -1]].forEach(([k, d]) => {
      const x = st.hw * k;
      K.forma(c, [[x, 330], [x + d * 40, 100], [x + d * 10, -130]], null, 26, false, '#6d3d1c');
      for (let i = 0; i < 6; i++) {
        const a = -2.9 + i * 0.55 + Math.sin(p * 2 + i) * 0.05;
        K.pico(c, [[x + d * 10, -130], [x + d * 10 + Math.cos(a) * 110, -130 + Math.sin(a) * 90 - 18], [x + d * 10 + Math.cos(a) * 230, -130 + Math.sin(a) * 180 + 70], [x + d * 10 + Math.cos(a) * 110, -130 + Math.sin(a) * 90 + 26]], '#1cb56b', 5);
      }
      K.disco(c, x + d * 2, -108, 22, '#6d3d1c', 5); K.disco(c, x + d * 30, -102, 22, '#83481f', 5);
    });
    const fases = [[0.13, 0.24, 'ℕ', '#ffd35c', 'ℤ', '#ff9d6c', 72], [0.25, 0.33, 'ℤ', '#ff9d6c', 'ℚ', '#ff7fb0', 96], [0.34, 0.41, 'ℚ', '#ff7fb0', 'ℝ', '#b488ff', 122], [0.42, 0.49, 'ℝ', '#b488ff', 'ℂ', '#6bb6ff', 150]];
    camara(c, st, u, () => {
      const cy = 110;
      const ultimo = fases.filter(f => u >= f[1]).pop();
      fases.forEach(f => {
        if (u >= f[0] && u < f[1]) {
          const q = seg(u, f[0], f[1]), r = f[6] * 0.76;
          const d = lerp(st.hw * 0.5, r * 0.5, q * q);
          const salto = Math.abs(Math.sin(q * 15)) * 34;
          bicho(c, -d, cy - salto, r, f[2], f[3], p * 5);
          bicho(c, d, cy - salto, r, f[2], f[3], p * 5 + 1);
          if (q > 0.86) K.velocidad(c, st, 0, cy, 0.7, p, '#fff', 40);
        }
      });
      if (ultimo && u < 0.5) {
        const q = outBack(seg(u, ultimo[1], ultimo[1] + 0.03));
        const enFusion = fases.some(f => u >= f[0] && u < f[1]);
        if (!enFusion) bicho(c, 0, cy, ultimo[6] * q, ultimo[4], ultimo[5], p * 5);
      }
      fases.forEach(f => { const q = seg(u, f[1], f[1] + 0.02); if (q > 0 && q < 1) K.radial(c, 0, cy, 460, `rgba(255,255,255,${1 - q})`, 'rgba(255,255,255,0)'); });
      const sfx = seg(u, 0.235, 0.27) * (1 - ss(0.3, 0.33, u));
      K.sfx(c, '¡PLOP!', st.vertical ? 60 : 300, -180, st.vertical ? 74 : 108, -0.1, sfx, '#fff', '#c21f6e');
      // Conjuntos anidados
      const nid = seg(u, 0.5, 0.6);
      if (nid > 0) {
        const anill = [['ℂ', '#6bb6ff', 340], ['ℝ', '#b488ff', 272], ['ℚ', '#ff7fb0', 204], ['ℤ', '#ff9d6c', 136], ['ℕ', '#ffd35c', 72]];
        const sc = st.vertical ? 0.74 : 1, ox = 0, oy = -60;
        anill.forEach((a, i) => {
          const q = outBack(seg(nid, i * 0.11, 0.42 + i * 0.11));
          if (q <= 0) return;
          K.disco(c, ox, oy, a[2] * sc * q, a[1], 6);
          c.fillStyle = TINTA; c.font = `700 ${40 * sc}px ${MATE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
          if (i < 4) c.fillText(a[0], ox, oy - (a[2] - 30) * sc * q); else c.fillText(a[0], ox, oy - 34 * sc);
        });
      }
      const pose = u < 0.13 ? P.corre(pasos(u * 44, 2) * 6.28) : u < 0.5 ? P.parado(p) : P.victoria(p);
      const x = nid > 0 ? (st.vertical ? -100 : -st.hw * 0.0 + 390) : lerp(-st.hw - 200, -st.hw * 0.66, ss(0.03, 0.13, u));
      K.cero(c, x, 400, 0.72, pose, { expr: u < 0.5 ? 'sorpresa' : 'feliz', t: p, viento: 0.6, flip: nid > 0 && !st.vertical });
    });
    K.rotulo(c, st, seg(u, 0.02, 0.13), 'MUNDO 2', 'LA ISLA DE LOS CONJUNTOS', '#7fe0c3');
  };

  /* ───────────── 3. LABERINTO ───────────── */
  E['laberinto-radian'] = (c, u, st) => {
    const { t, p } = st;
    K.vert(c, st, ['#10131f', '#1b2433', '#26313e', '#101520']);
    const des = -u * 900;
    for (let f = 0; f < 3; f++) {
      const z = 0.45 + f * 0.28, tono = ['#1c2736', '#25313f', '#303b47'][f];
      for (let i = -3; i < 16; i++) {
        const x = (i * 290 + des * z + 40 * f) % 4000 - 1200;
        const alto = 300 + rnd(i * 3 + f) * 180;
        c.fillStyle = tono; c.fillRect(x, 330 - alto, 150, alto);
        c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2;
        for (let b = 0; b < 8; b++) { c.beginPath(); c.moveTo(x, 330 - (alto / 8) * b); c.lineTo(x + 150, 330 - (alto / 8) * b); c.stroke(); }
      }
    }
    K.suelo(c, st, 330, '#161c28');
    const circ = seg(u, 0.33, 0.42), cuerda = seg(u, 0.42, 0.53), rel = outBack(seg(u, 0.53, 0.58));
    let lx = 0, ly = 0;
    camara(c, st, u, () => {
      const x = lerp(-st.hw - 200, st.vertical ? -110 : -300, ss(0.05, 0.32, u));
      const fl = 0.75 + 0.2 * Math.sin(p * 13) * Math.cos(p * 9);
      K.cero(c, x, 400, 0.84, u < 0.32 ? K.mezcla(P.camina(pasos(u * 58, 2)), P.antorcha(p), 0.45) : P.antorcha(p), {
        expr: u < 0.34 ? 'normal' : u < 0.53 ? 'foco' : 'feliz', t: p, viento: 0.35,
        enMano: (cc, m) => {
          cc.save(); cc.translate(m[0], m[1]);
          K.linea(cc, [[0, 16], [8, -44]], '#6d3d1c', 11);
          K.pico(cc, [[-5, -44], [8, -92 - fl * 24], [24, -44]], '#ff7a1c', 3);
          K.pico(cc, [[3, -46], [9, -74 - fl * 12], [17, -46]], '#ffe07a', 0);
          cc.restore();
        },
      });
      const R = st.vertical ? 150 : 225, cx = st.vertical ? 30 : 150, cy = -20;
      lx = x + 60; ly = 220;
      if (circ > 0) {
        c.save(); c.lineCap = 'round';
        c.shadowColor = '#7fe8ff'; c.shadowBlur = 30;
        c.strokeStyle = '#d3f6ff'; c.lineWidth = 7;
        c.beginPath(); c.arc(cx, cy, R, 0, circ * 6.283); c.stroke();
        K.disco(c, cx, cy, 10, '#fff');
        const dob = ss(0, 1, cuerda);
        // Radio que se dobla sobre el borde: su largo no cambia
        if (dob < 1) {
          c.strokeStyle = '#ffb627'; c.lineWidth = 12;
          c.beginPath();
          const N = 30;
          for (let i = 0; i <= N; i++) {
            const k = i / N, A = k; // ángulo recorrido en radianes
            const ax = cx + Math.cos(A) * R, ay = cy - Math.sin(A) * R;
            const bx = cx + R, by = cy - k * R;
            const xx = lerp(bx, ax, dob), yy = lerp(by, ay, dob);
            i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
          }
          c.stroke();
        } else {
          c.strokeStyle = '#ffb627'; c.lineWidth = 12; c.beginPath(); c.arc(cx, cy, R, -1, 0); c.stroke();
        }
        if (circ >= 1) {
          c.strokeStyle = '#fff'; c.lineWidth = 6;
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R, cy); c.stroke();
          if (dob > 0.8) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(1) * R, cy - Math.sin(1) * R); c.stroke(); }
        }
        c.restore();
        K.sfx(c, '1 rad', cx + R * 1.04, cy - R * 0.72, st.vertical ? 46 : 66, -0.04, rel, '#ffb627', TINTA);
        K.sfx(c, 'r', cx + R * 0.5, cy + 36, 42, 0, circ >= 1 ? 1 : 0, '#fff', TINTA, MATE);
      }
    });
    // La niebla solo deja ver alrededor de la antorcha
    const ap = lerp(760, 1300, ss(0.3, 0.5, u));
    const foco = ss(FOCO[0], FOCO[1], u);
    const gx = lerp(lx, 0, ss(0.33, 0.45, u)) - foco * (st.vertical ? 0 : st.hw * 0.42);
    const g = c.createRadialGradient(gx, ly - 40, ap * 0.25, gx, ly - 40, ap);
    g.addColorStop(0, 'rgba(6,8,16,0)'); g.addColorStop(0.7, 'rgba(6,8,16,.62)'); g.addColorStop(1, 'rgba(6,8,16,.95)');
    c.fillStyle = g; c.fillRect(-st.hw - 4, -544, st.hw * 2 + 8, 1088);
    if (u < 0.4) K.radial(c, gx, ly - 20, 340, 'rgba(255,150,50,.3)', 'rgba(255,150,50,0)');
    K.rotulo(c, st, seg(u, 0.02, 0.14), 'MUNDO 3', 'EL LABERINTO DEL RADIÁN', '#7fe8ff');
  };

  /* ───────────── 4. PUENTE ───────────── */
  function cristal(c, x, y, w, h, roto, rotul, tint) {
    if (roto) return;
    const d = h * 0.7;
    K.pico(c, [[x - w / 2 + d, y], [x + w / 2 + d, y], [x + w / 2, y + h], [x - w / 2, y + h]], tint, 4);
    c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.moveTo(x - w * 0.22 + d, y + 2); c.lineTo(x - w * 0.02 + d, y + 2); c.lineTo(x - w * 0.2, y + h - 2); c.lineTo(x - w * 0.4, y + h - 2); c.closePath(); c.fill();
    c.fillStyle = TINTA; c.font = `${h * 0.42}px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(rotul, x + d / 2, y + h / 2 + 1);
  }
  E['puente-de-cristal'] = (c, u, st) => {
    const { t, p } = st;
    K.vert(c, st, ['#205dcb', '#3b8fe8', '#a7dcf5', '#f8f4e8']);
    for (let i = 0; i < 7; i++) K.nube(c, ((i * 430 - u * 500 + 2000) % 2200) - 1100, 330 + (i % 3) * 70, 1 + (i % 3) * 0.5, '#fff', '#c5dcef');
    K.nube(c, -st.hw * 0.4, -330, 0.9, '#ffffffbb', '#c5dcef66');
    const paso = st.vertical ? 240 : 320, yA = 60, yB = 160, h = 66, w = st.vertical ? 190 : 250;
    const fases = [0.14, 0.2, 0.26, 0.32];
    const cae = u >= 0.33 && u < 0.46, ret = u >= 0.46;
    let idx, fr = 0;
    if (u < 0.14) { idx = 0; fr = 0; }
    else if (u < 0.33) { const k = seg(u, 0.14, 0.33) * 3; idx = Math.floor(k); fr = k - idx; }
    else if (!ret) { idx = 3; fr = 0; }
    else { const k = seg(u, 0.46, 0.56) * 3.999; idx = Math.floor(k) + 0; fr = k - Math.floor(k); }
    const camX = (idx + fr) * paso;
    const carril = i => (ret ? yA : [yB, yA, yB, yB][Math.min(i, 3)]);
    const roto = u >= 0.33;
    camara(c, st, u, () => {
      K.temblor(c, 1 - seg(u, 0.33, 0.38), t, u > 0.33 ? 34 : 0);
      c.save(); c.translate(-camX + (st.vertical ? -60 : -120), 0);
      c.fillStyle = TINTA;
      for (let a of [yA - 8, yB + h + 4]) c.fillRect(-1400, a, 5400, 6);
      for (let i = -3; i < 9; i++) {
        c.fillStyle = TINTA; c.fillRect(i * paso - paso / 2 + 20, yA - 90, 9, 330);
        const x = i * paso;
        cristal(c, x, yA, w, h, false, 'x > 30', 'rgba(170,235,255,.85)');
        cristal(c, x, yB, w, h, roto && i === 3, 'x < 30', 'rgba(210,245,255,.75)');
      }
      // Cristal roto
      if (roto) {
        const q = seg(u, 0.33, 0.56);
        for (let i = 0; i < 26; i++) {
          const a = rnd(i) * 6.28, v = 200 + rnd(i + 2) * 500;
          const x = 3 * paso + Math.cos(a) * v * q * 0.7, y = yB + Math.sin(a) * v * q * 0.45 + 1500 * q * q;
          c.save(); c.translate(x, y); c.rotate(q * 12 + i);
          const s = 12 + rnd(i + 5) * 34;
          K.pico(c, [[-s, -s * 0.4], [s * 0.7, -s * 0.6], [s * 0.4, s * 0.6]], 'rgba(200,240,255,.92)', 3);
          c.restore();
        }
      }
      let cx, cy, pose, expr = 'decidido';
      if (cae) {
        const q = seg(u, 0.33, 0.46);
        cx = 3 * paso + q * 30; cy = yB + 40 + q * q * 900; pose = P.cae(); expr = 'grito';
      } else {
        const a = Math.min(idx, 3), b = Math.min(idx + 1, 3);
        const ya = carril(a), yb = carril(b);
        const arco = Math.sin(fr * Math.PI) * 170;
        cx = lerp(a, b, fr) * paso + 14; cy = lerp(ya, yb, fr) + 22 - arco;
        pose = u < 0.14 ? P.parado(p) : fr > 0.04 && fr < 0.96 ? P.salto() : P.aterriza();
        expr = u < 0.14 ? 'foco' : ret ? 'decidido' : 'decidido';
      }
      K.cero(c, cx, cy, 0.7, pose, { expr, t: p * 2, viento: cae ? 1.2 : 0.8, mira: [0.6, 0.3] });
      c.restore();
      K.sfx(c, '¡CRAC!', st.vertical ? 30 : 180, -240, st.vertical ? 94 : 150, -0.1, seg(u, 0.33, 0.36) * (1 - ss(0.42, 0.46, u)), '#fff', '#104aa8');
      if (u >= 0.46 && u < 0.56) K.sfx(c, 'OTRA VEZ', 0, -320, st.vertical ? 58 : 94, 0.05, seg(u, 0.46, 0.49), '#ffe07a', TINTA);
    });
    if (cae) K.rafagas(c, st, 1.57, 1, p, 'rgba(255,255,255,.8)', 30);
    K.impacto(c, st, seg(u, 0.33, 0.35));
    K.rotulo(c, st, seg(u, 0.02, 0.13), 'MUNDO 4', 'EL PUENTE DE CRISTAL', '#a7ecff');
  };

  /* ───────────── 5. MATHRALLY ───────────── */
  function flecha(c, x0, y0, x1, y1, k, color, lw = 7) {
    if (k <= 0) return;
    const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 44;
    const q = v => { const a = (1 - v) * (1 - v), b = 2 * v * (1 - v), d = v * v; return [a * x0 + b * mx + d * x1, a * y0 + b * my + d * y1]; };
    c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i <= 20; i++) { const P0 = q((i / 20) * k); i ? c.lineTo(P0[0], P0[1]) : c.moveTo(P0[0], P0[1]); }
    c.stroke();
    if (k >= 1) { const a = Math.atan2(y1 - my, x1 - mx); c.fillStyle = color; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - 0.5) * 24, y1 - Math.sin(a - 0.5) * 24); c.lineTo(x1 - Math.cos(a + 0.5) * 24, y1 - Math.sin(a + 0.5) * 24); c.closePath(); c.fill(); }
  }
  E.mathrally = (c, u, st) => {
    const { t, p } = st;
    K.vert(c, st, ['#060518', '#141046', '#2c1b6f', '#54308f']);
    K.estrellas(c, st, t, 170, 540);
    K.radial(c, -st.hw * 0.5, -300, 480, 'rgba(255,90,190,.3)', 'rgba(255,90,190,0)');
    K.radial(c, st.hw * 0.5, -130, 520, 'rgba(70,190,255,.24)', 'rgba(70,190,255,0)');
    K.disco(c, st.hw * 0.6, -360, 58, '#ffd9a0', 4);
    // Planeta Élara
    c.save(); c.beginPath(); c.arc(0, 1420, 1100, 0, 7); c.fillStyle = '#ff9d6c'; c.fill(); c.lineWidth = 8; c.strokeStyle = TINTA; c.stroke(); c.clip();
    c.fillStyle = K.trama(c, 'rgba(120,30,50,.3)', 16, 4); c.fillRect(-1200, 300, 2400, 1200);
    for (let i = 0; i < 9; i++) { const x = (i * 300 - u * 1500) % 1600 + 300; c.fillStyle = '#d96e4f'; c.beginPath(); c.ellipse(x - 400, 360 + (i % 3) * 30, 70, 14, 0, 0, 7); c.fill(); }
    c.restore();
    camara(c, st, u, () => {
      const corre = u < 0.34;
      const x = lerp(-st.hw - 200, st.vertical ? -40 : -110, ss(0.03, 0.2, u));
      const fase = pasos(u * 30, 2) * 6.28;
      ['1', '4', '7'].forEach((d, i) => {
        const xx = x - 170 - i * 130 + (corre ? 0 : 20);
        K.vecino(c, xx, 340, 0.55, d, ['#ff9cb5', '#9cc2ff', '#7fe0c3'][i], corre ? fase * 0.5 + i : p, 1, 1);
      });
      K.cero(c, x, 350, 0.72, corre ? P.corre(fase) : u < 0.53 ? P['señala']() : P.victoria(p), { expr: u < 0.2 ? 'decidido' : u < 0.53 ? 'foco' : 'feliz', t: p, viento: 0.9 });
      // Estación con QR
      const qr = outBack(seg(u, 0.16, 0.22)) * (1 - ss(0.3, 0.34, u));
      if (qr > 0) {
        c.save(); c.translate(st.vertical ? 90 : 170, 80); c.scale(qr, qr);
        c.fillStyle = TINTA; c.fillRect(-14, 80, 28, 200);
        K.pico(c, [[-92, -92], [92, -92], [92, 92], [-92, 92]], '#fff', 8);
        for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) {
          const esq = (a < 3 && b < 3) || (a > 5 && b < 3) || (a < 3 && b > 5);
          if (esq ? !(a % 6 === 1 && b % 6 === 1) : rnd(a * 11 + b * 7) > 0.48) { c.fillStyle = TINTA; c.fillRect(-76 + a * 17, -76 + b * 17, 17, 17); }
        }
        const sc = -86 + (pasos(t, 18) * 170) % 172;
        c.fillStyle = 'rgba(255,61,46,.8)'; c.fillRect(-92, sc, 184, 8);
        c.restore();
      }
      // Diagrama sagital: a cada entrada, una sola salida
      const d = seg(u, 0.33, 0.56);
      if (d > 0) {
        const ap = outBack(seg(d, 0, 0.24));
        const dx = st.vertical ? 138 : 245, cy = -170;
        c.save(); c.translate(st.vertical ? 0 : 60, cy); c.scale(ap, ap);
        [[-dx, '#9cc2ff'], [dx, '#ffd35c']].forEach(([x0, col]) => { c.beginPath(); c.ellipse(x0, 0, st.vertical ? 88 : 118, 215, 0, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 7; c.strokeStyle = TINTA; c.stroke(); });
        const ent = [[0, -130], [1, 0], [2, 130]], sal = [[1, -130], [3, 0], [5, 130]];
        c.font = `62px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        ent.forEach(e => { c.fillStyle = e[0] === 0 ? '#ff3d2e' : TINTA; c.fillText(String(e[0]), -dx, e[1]); });
        sal.forEach(e => { c.fillStyle = TINTA; c.fillText(String(e[0]), dx, e[1]); });
        c.restore();
        c.save(); c.translate(st.vertical ? 0 : 60, cy);
        const a = dx - 48;
        flecha(c, -a, -130, a, -130, seg(d, 0.26, 0.42), '#ff3d2e');
        flecha(c, -a, 0, a, 0, seg(d, 0.42, 0.56), TINTA);
        flecha(c, -a, 130, a, 130, seg(d, 0.56, 0.7), TINTA);
        const mal = seg(d, 0.7, 0.8) * (1 - seg(d, 0.92, 1));
        flecha(c, -a, 130, a, 0, mal, '#d3102f');
        K.sfx(c, '✕', 0, 72, 76, 0, seg(d, 0.8, 0.86) * (1 - seg(d, 0.92, 1)), '#ff3d2e', '#fff', 'Arial, sans-serif');
        c.restore();
      }
    });
    K.rotulo(c, st, seg(u, 0.02, 0.13), 'MUNDO 5', 'MISIÓN ÉLARA', '#ffb0d9');
  };

  /* ───────────── 6. SUDOKU ───────────── */
  const TAB = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
  E['sudoku-academy'] = (c, u, st) => {
    const { t, p } = st;
    K.vert(c, st, ['#0b1544', '#10307a', '#0b4f9f', '#071a4f']);
    c.save(); c.strokeStyle = 'rgba(120,200,255,.13)'; c.lineWidth = 2;
    for (let i = -20; i < 20; i++) { c.beginPath(); c.moveTo(i * 90 + pasos(t * 8, 12) % 90, -560); c.lineTo(i * 90 - 300 + pasos(t * 8, 12) % 90, 560); c.stroke(); }
    c.restore();
    const G = st.vertical ? 46 : 72, foco = [4, 4];
    camara(c, st, u, () => {
      const az = outExpo(seg(u, 0.1, 0.22));
      c.save(); c.translate(st.vertical ? 0 : 40, st.vertical ? -160 : 70); c.scale(az, az); c.transform(1, 0, -0.16, 0.95, 0, 0); c.rotate(-0.03);
      const lado = G * 9;
      K.pico(c, [[-lado / 2, -lado / 2], [lado / 2, -lado / 2], [lado / 2, lado / 2], [-lado / 2, lado / 2]], '#f8f3e3', 10);
      const cuenta = seg(u, 0.14, 0.3);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i < 81; i++) {
        const f = Math.floor(i / 9), k = i % 9, ch = TAB[i];
        const x = -lado / 2 + k * G, y = -lado / 2 + f * G;
        const enFila = f === foco[0] || k === foco[1] || (Math.floor(f / 3) === 1 && Math.floor(k / 3) === 1);
        const barre = seg(u, 0.3, 0.38);
        if (barre > 0 && enFila && (f === 4 || k === 4 || (Math.floor(f / 3) === 1 && Math.floor(k / 3) === 1))) { c.fillStyle = `rgba(255,200,70,${0.42 * barre})`; c.fillRect(x, y, G, G); }
        if (ch !== '.' && cuenta > rnd(i) * 0.9) { c.font = `${G * 0.56}px ${FUENTE}`; c.fillStyle = '#1b2a6a'; c.fillText(ch, x + G / 2, y + G / 2 + 2); }
      }
      c.strokeStyle = TINTA;
      for (let i = 0; i <= 9; i++) { c.lineWidth = i % 3 ? 2 : 7; c.beginPath(); c.moveTo(-lado / 2 + i * G, -lado / 2); c.lineTo(-lado / 2 + i * G, lado / 2); c.moveTo(-lado / 2, -lado / 2 + i * G); c.lineTo(lado / 2, -lado / 2 + i * G); c.stroke(); }
      // La casilla central: se tachan candidatos hasta que queda el 5
      const fx = -lado / 2 + foco[1] * G, fy = -lado / 2 + foco[0] * G;
      c.save(); c.beginPath(); c.rect(fx, fy, G, G); c.clip();
      c.fillStyle = '#fff'; c.fillRect(fx, fy, G, G);
      c.restore();
      const candidatos = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const elim = seg(u, 0.36, 0.5), res = seg(u, 0.5, 0.53);
      if (u > 0.3 && res <= 0) {
        candidatos.forEach((n, i) => {
          const x = fx + ((i % 3) + 0.5) * (G / 3), y = fy + (Math.floor(i / 3) + 0.5) * (G / 3);
          const q = [0.5, 0.15, 0.75, 0.3, 2, 0.6, 0.05, 0.9, 0.4][i];
          const ido = elim > q;
          c.font = `${G * 0.22}px ${FUENTE}`; c.fillStyle = ido ? 'rgba(180,30,60,.3)' : n === 5 ? '#d3102f' : '#1b2a6a'; c.fillText(String(n), x, y + 1);
          if (ido) { c.strokeStyle = '#d3102f'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - G * 0.1, y + G * 0.1); c.lineTo(x + G * 0.1, y - G * 0.1); c.stroke(); }
        });
      }
      c.restore();
      if (res > 0) {
        const pos = st.vertical ? [0, -158] : [38, 72];
        K.sfx(c, '5', pos[0], pos[1], lerp(380, G * 0.72, outExpo(res)), 0, 1, '#ff3d2e', TINTA);
      }
      if (!st.vertical || u < 0.3 || u > 0.5) K.cero(c, st.vertical ? -120 : -st.hw * 0.6, lerp(900, 480, outExpo(seg(u, 0.05, 0.16))), 0.84, u > 0.53 ? P.victoria(p) : P['señala'](), { expr: u > 0.53 ? 'feliz' : 'foco', t: p, viento: 0.4 });
    });
    // Primer plano de detective, en viñeta diagonal
    const vi = seg(u, 0.3, 0.34) * (1 - seg(u, 0.5, 0.53));
    if (vi > 0) {
      const a = st.hw;
      const w = (st.vertical ? 1 : 0.66) * a * 2 * ss(0, 1, vi);
      const y0 = st.vertical ? 170 : 150;
      vineta(c, [[a + 20, y0 + 20], [a - w, y0 + 70], [a - w * 0.86, 560], [a + 20, 560]], () => {
        K.vert(c, st, ['#0d0d2c', '#0d0d2c', '#22175b', '#3c1e7d']);
        K.velocidad(c, st, a - w * 0.42, 350, 0.75, p, 'rgba(255,255,255,.5)', 50);
        K.cabeza(c, a - w * 0.42 - 20, 372, st.vertical ? 1.8 : 2.4, { expr: 'foco', t: p, mira: [-0.1, -0.2], parpadeo: 0 });
      });
    }
    K.sfx(c, 'TACHA', st.vertical ? 110 : -st.hw * 0.16, st.vertical ? 104 : 310, st.vertical ? 56 : 76, -0.08, seg(u, 0.4, 0.43) * (1 - seg(u, 0.5, 0.52)), '#ffe07a', TINTA);
    K.impacto(c, st, seg(u, 0.5, 0.52));
    K.rotulo(c, st, seg(u, 0.02, 0.13), 'MUNDO 6', 'LA CIUDAD DE LAS NUEVE CASILLAS', '#8fc6ff');
  };

  /* ───────────── 7. RESIDUO ───────────── */
  E.residuo = (c, u, st) => {
    const { t, p } = st;
    K.vert(c, st, ['#23164e', '#6a2e7f', '#e2606f', '#ffb66b']);
    K.radial(c, 0, 80, 620, 'rgba(255,230,160,.65)', 'rgba(255,230,160,0)');
    for (let i = 0; i < 5; i++) K.nube(c, (i - 2) * 400 + pasos(t * 2, 6), -380 + (i % 2) * 70, 1, '#ff9d8a', '#a64787');
    K.forma(c, [[-st.hw - 60, 300], [-st.hw * 0.5, 95], [-st.hw * 0.1, 225], [st.hw * 0.42, 70], [st.hw + 60, 240], [st.hw + 60, 620], [-st.hw - 60, 620]], '#3e2763', 0);
    K.forma(c, [[-st.hw - 60, 340], [-st.hw * 0.2, 240], [st.hw * 0.5, 325], [st.hw + 60, 260], [st.hw + 60, 620], [-st.hw - 60, 620]], '#22264c', 6);
    c.fillStyle = K.trama(c, 'rgba(255,190,130,.14)', 14, 2.8); c.fillRect(-st.hw, 260, st.hw * 2, 300);
    const gira = seg(u, 0.18, 0.42);
    const uno = clamp(Math.floor(gira * 3));
    const valor = 9 + K.ss(0, 1, gira) * 3;
    const golpe = seg(u, 0.42, 0.45);
    camara(c, st, u, () => {
      K.temblor(c, golpe > 0 ? 1 - seg(u, 0.45, 0.5) : 0, t, 40);
      const R = st.vertical ? 200 : 250, cy = st.vertical ? -120 : -10;
      const ap = outBack(seg(u, 0.1, 0.18));
      c.save(); c.translate(0, cy); c.scale(ap, ap);
      if (golpe > 0) { c.save(); c.rotate(pasos(t * 0.3, 8)); c.fillStyle = 'rgba(255,240,170,.42)'; for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(1500, -130); c.lineTo(1500, 130); c.closePath(); c.fill(); } c.restore(); }
      K.disco(c, 0, 0, R + 44, '#2b1c4f', 8);
      K.disco(c, 0, 0, R - 58, '#fff0d0', 7);
      for (let n = 0; n < 12; n++) {
        const a = (n / 12) * 6.283 - 1.5708;
        const x = Math.cos(a) * (R - 8), y = Math.sin(a) * (R - 8);
        const brillo = (n === 0 && golpe > 0) || n === Math.round(valor) % 12;
        K.disco(c, x, y, brillo ? 42 : 33, brillo ? '#ffb627' : '#f8f3e3', 5);
        c.fillStyle = n === 0 ? '#d3102f' : TINTA; c.font = `${brillo ? 38 : 30}px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(n), x, y + 1);
      }
      const ang = (valor / 12) * 6.283 - 1.5708;
      K.miembro(c, [0, 0], [Math.cos(ang) * (R - 80), Math.sin(ang) * (R - 80)], 15, 5, '#d3102f', 5);
      K.disco(c, 0, 0, 20, TINTA);
      c.fillStyle = TINTA; c.font = `${st.vertical ? 34 : 50}px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(golpe > 0 ? '9 + 3 = 0' : '9 + ' + Math.round(valor - 9) + ' = ' + Math.round(valor) , 0, R * 0.34);
      c.restore();
      K.sfx(c, '12 = 0', 0, cy - R - 62, st.vertical ? 70 : 120, -0.04, golpe, '#fff', '#d3102f');
      const x = lerp(-st.hw - 200, st.vertical ? -135 : -st.hw * 0.56, ss(0.03, 0.18, u));
      K.cero(c, x, 400, 0.86, u < 0.18 ? P.camina(pasos(u * 44, 2)) : u < 0.47 ? P['señala']() : P.victoria(p), { expr: u < 0.42 ? 'foco' : 'feliz', t: p, viento: 0.5, mira: [0.6, -0.5] });
    });
    // Primer plano del giro de la historia
    const vi = seg(u, 0.46, 0.48) * (1 - seg(u, 0.54, 0.56));
    if (vi > 0) {
      K.vert(c, st, ['#ffb627', '#ff8a3c', '#ff6647', '#ffdf8f']);
      K.velocidad(c, st, 0, 20, 1, p, '#fff', 90);
      K.boil(p, 0.8);
      K.cabeza(c, st.vertical ? -30 : -40, 30, st.vertical ? 3 : 3.8, { expr: 'sorpresa', t: p, lagrima: seg(u, 0.47, 0.54), mira: [0, 0], parpadeo: 0 });
    }
    K.impacto(c, st, seg(u, 0.42, 0.44));
    K.rotulo(c, st, seg(u, 0.02, 0.13), 'MUNDO 7', 'EL VALLE DE DOCE', '#ffb66b');
  };

  /* ───────────── 8. PORTERO ───────────── */
  E['portero-algebraico'] = (c, u, st) => {
    const { t, p } = st;
    K.vert(c, st, ['#0f0822', '#1d0b3a', '#2e1050', '#150828']);
    for (let f = 0; f < 15; f++) for (let k = -14; k < 14; k++) { c.fillStyle = rnd(f * 3 + k) > 0.6 ? '#3a1d5f' : '#311650'; c.fillRect(k * 112 + (f % 2) * 56, -540 + f * 62, 108, 58); }
    K.suelo(c, st, 340, '#0d0d20');
    c.fillStyle = K.trama(c, 'rgba(255,60,170,.17)', 14, 2.8); c.fillRect(-st.hw, 340, st.hw * 2, 240);
    const parp = rnd(Math.floor(t * 9)) > 0.09 ? 1 : 0.35;
    const abre = ss(0.46, 0.56, u);
    const zc = outBack(seg(u, 0.27, 0.32)) * (1 - ss(0.42, 0.46, u));
    camara(c, st, u, () => {
      const dx = st.vertical ? 55 : 190;
      // Rótulo de neón
      c.save(); c.shadowColor = '#ff3db4'; c.shadowBlur = 36 * parp; c.fillStyle = `rgba(255,${parp > 0.5 ? 160 : 90},225,${parp})`;
      c.font = `${st.vertical ? 50 : 86}px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('UMBRAL', dx, -258); c.restore();
      // Puerta
      const pw = 165, py = -180;
      K.pico(c, [[dx - pw, py], [dx + pw, py], [dx + pw, 345], [dx - pw, 345]], '#0a0714', 10);
      if (abre > 0) {
        c.save(); c.beginPath(); c.rect(dx - pw * abre, py, pw * 2 * abre, 525); c.clip();
        const g = c.createLinearGradient(dx, py, dx, 345); g.addColorStop(0, '#fff7c9'); g.addColorStop(1, '#ffcf63'); c.fillStyle = g; c.fillRect(dx - pw, py, pw * 2, 525); c.restore();
        c.save(); c.globalAlpha = 0.34 * abre; c.fillStyle = '#ffe9a0';
        c.beginPath(); c.moveTo(dx - pw * abre, 345); c.lineTo(dx + pw * abre, 345); c.lineTo(dx + pw * 4, 560); c.lineTo(dx - pw * 4, 560); c.closePath(); c.fill(); c.restore();
      }
      c.fillStyle = '#1b1432'; c.fillRect(dx - pw - 2, py, pw - pw * abre + 2, 525); c.fillRect(dx + pw * abre, py, pw - pw * abre + 2, 525);
      c.strokeStyle = TINTA; c.lineWidth = 8; c.strokeRect(dx - pw, py, pw * 2, 525);
      // Portero
      const bx = dx + lerp(0, st.vertical ? 170 : 245, ss(0.42, 0.53, u)), bl = lerp(1, 1.05, seg(u, 0.25, 0.4));
      c.save(); c.translate(bx, 345); c.scale(bl * (st.vertical ? 0.76 : 1), bl * (st.vertical ? 0.76 : 1));
      K.miembro(c, [-48, -140], [-54, -8], 42, 36, '#0e0c1e', 6); K.miembro(c, [48, -140], [54, -8], 42, 36, '#0e0c1e', 6);
      K.pico(c, [[-112, -386], [112, -386], [84, -130], [-84, -130]], '#1a1633', 7);
      c.fillStyle = '#322a5c'; c.fillRect(-86, -374, 38, 230);
      K.miembro(c, [-110, -360], [-122, -160], 36, 28, '#1a1633', 6); K.miembro(c, [110, -360], [122, -160], 36, 28, '#1a1633', 6);
      K.forma(c, [[-60, -464], [-48, -520], [48, -520], [60, -464], [40, -388], [-40, -388]], '#d59a78', 6);
      c.fillStyle = TINTA; c.fillRect(-58, -476, 116, 28);
      c.fillStyle = '#ff3db4'; c.fillRect(-48, -470, 38, 7); c.fillRect(12, -470, 38, 7);
      K.linea(c, abre > 0 ? [[-16, -420], [0, -410], [16, -420]] : [[-14, -414], [14, -414]], TINTA, 5);
      c.restore();
      const x = lerp(-st.hw - 200, st.vertical ? -130 : -st.hw * 0.34, ss(0.03, 0.25, u));
      K.cero(c, x, 384, 0.72, u < 0.25 ? P.camina(pasos(u * 44, 2)) : u < 0.5 ? P['señala']() : P.victoria(p), { expr: u < 0.45 ? 'normal' : 'feliz', t: p, viento: 0.2, mira: [0.7, -0.6] });
    });
    // Carnet con la operación
    if (zc > 0) {
      c.save(); c.scale(zc, zc); c.rotate(-0.05);
      const w = st.vertical ? 215 : 470, h = st.vertical ? 170 : 270;
      K.pico(c, [[-w, -h], [w, -h], [w, h], [-w, h]], '#fff6e3', 10);
      c.fillStyle = '#d3102f'; c.fillRect(-w + 4, -h + 4, w * 2 - 8, h * 0.42);
      c.fillStyle = '#fff'; c.font = `${st.vertical ? 34 : 54}px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CARNET', 0, -h * 0.76);
      c.fillStyle = TINTA; c.font = `${st.vertical ? 62 : 118}px ${FUENTE}`;
      c.fillText('a + 0 = a', 0, h * 0.26);
      c.restore();
    }
    K.rotulo(c, st, seg(u, 0.02, 0.13), 'MUNDO 8', 'LA PUERTA DE LOS GRUPOS', '#ff8fd3');
  };

  /* ───────────── 9. ALGEBRA ENGINE ───────────── */
  function engranaje(c, x, y, R, a, color) {
    c.save(); c.translate(x, y); c.rotate(a);
    const dientes = Math.round(R / 13), pts = [];
    for (let i = 0; i < dientes * 2; i++) { const ang = (i * Math.PI) / dientes; const r = i % 2 ? R : R * 0.82; pts.push([Math.cos(ang - 0.1) * r, Math.sin(ang - 0.1) * r], [Math.cos(ang + 0.1) * r, Math.sin(ang + 0.1) * r]); }
    K.pico(c, pts, color, 5);
    K.disco(c, 0, 0, R * 0.35, '#0d1a24', 5);
    c.restore();
  }
  E['algebra-engine'] = (c, u, st) => {
    const { t, p } = st;
    K.vert(c, st, ['#071019', '#0d2533', '#10394a', '#081722']);
    const vel = 0.8 + u * 8 + (u > 0.45 ? 8 : 0);
    const gx = st.hw;
    engranaje(c, -gx * 0.72, -300, 200, p * vel * 0.2, '#16394a');
    engranaje(c, -gx * 0.26, -420, 130, -p * vel * 0.3, '#1b4659');
    engranaje(c, gx * 0.66, -310, 230, -p * vel * 0.17, '#16394a');
    engranaje(c, gx * 0.92, 40, 130, p * vel * 0.3, '#1b4659');
    c.fillStyle = '#132d3c'; c.fillRect(-st.hw - 4, -140, st.hw * 2 + 8, 22);
    K.suelo(c, st, 340, '#0a141c');
    c.fillStyle = K.trama(c, 'rgba(120,255,220,.11)', 14, 2.6); c.fillRect(-st.hw, 340, st.hw * 2, 240);
    const golpe = seg(u, 0.44, 0.47);
    camara(c, st, u, () => {
      K.temblor(c, golpe > 0 ? 1 - seg(u, 0.47, 0.52) : 0, t, 34);
      const mw = st.vertical ? 155 : 250, mh = 300, my = -50;
      // Cinta transportadora
      const cy = 262;
      K.pico(c, [[-st.hw - 40, cy], [st.hw + 40, cy], [st.hw + 40, cy + 40], [-st.hw - 40, cy + 40]], '#37535f', 5);
      for (let i = -20; i < 20; i++) { K.disco(c, i * 72 + ((u * 1800) % 72), cy + 20, 13, '#16303b', 3); }
      const bel = seg(u, 0.14, 0.46);
      const et = [['2', '#ffd35c'], ['4', '#7fe8c5'], ['6', '#ff9d6c'], ['8', '#ff8cb6']];
      et.forEach((e, i) => {
        const q = seg(bel, i * 0.2, i * 0.2 + 0.32);
        const x0 = -st.hw - 70, x1 = -mw + 20;
        if (q >= 1) {
          const sq = seg(bel, i * 0.2 + 0.36, i * 0.2 + 0.54);
          if (sq > 0 && sq < 1) { c.fillStyle = TINTA; c.font = `48px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const xx = lerp(mw - 10, mw + (st.vertical ? 80 : 180), sq); K.pico(c, [[xx - 37, cy - 70], [xx + 37, cy - 70], [xx + 37, cy], [xx - 37, cy]], '#fff6e3', 5); c.fillStyle = '#d3102f'; c.fillText('0', xx, cy - 34); }
          return;
        }
        const x = lerp(x0, x1, q);
        K.pico(c, [[x - 37, cy - 70], [x + 37, cy - 70], [x + 37, cy], [x - 37, cy]], e[1], 5);
        c.fillStyle = TINTA; c.font = `48px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e[0], x, cy - 34);
      });
      // Máquina
      K.pico(c, [[-mw, my - mh * 0.62], [mw, my - mh * 0.62], [mw + 16, cy + 42], [-mw - 16, cy + 42]], '#2f6e80', 8);
      c.fillStyle = '#245567'; c.fillRect(-mw + 8, my - mh * 0.62 + 6, 62, cy + 30 - my + mh * 0.62);
      for (let i = 0; i < 6; i++) { K.disco(c, -mw + 22, my - mh * 0.5 + i * 70, 7, '#16303b'); K.disco(c, mw - 22, my - mh * 0.5 + i * 70, 7, '#16303b'); }
      c.fillStyle = '#0b1a24'; c.fillRect(-mw - 8, cy - 90, 40, 92); c.fillRect(mw - 32, cy - 90, 40, 92);
      // Pantalla
      const pw = mw - 50, ph = 136, pl = my - 54;
      K.pico(c, [[-pw, pl - ph], [pw, pl - ph], [pw, pl + ph], [-pw, pl + ph]], golpe > 0 ? '#ffb627' : '#062d2a', 8);
      if (golpe > 0) {
        K.sfx(c, '0', 0, pl - 8, st.vertical ? 190 : 230, 0, golpe, '#d3102f', '#fff');
      } else {
        c.fillStyle = '#58ffb8'; c.font = `${st.vertical ? 20 : 34}px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('f(x) = x mod 2', 0, pl - 40);
        c.font = `${st.vertical ? 30 : 46}px ${FUENTE}`; c.fillText(`${['—', '2', '4', '6', '8'][Math.min(4, Math.ceil(bel * 4))]}  →  ${bel > 0 ? '0' : '—'}`, 0, pl + 40);
      }
      // Palanca
      const pal = ss(0.1, 0.16, u);
      const lx = st.vertical ? -105 : -mw - 95;
      const lg = 150, an = lerp(-0.8, 0.82, pal);
      K.miembro(c, [lx, 345], [lx + Math.sin(an) * lg, 345 - Math.cos(an) * lg], 11, 8, '#ccd4d8', 5);
      K.disco(c, lx + Math.sin(an) * lg, 345 - Math.cos(an) * lg, 25, '#ff3d2e', 5);
      const x = lerp(-st.hw - 200, lx - 90, ss(0.03, 0.1, u));
      if (!st.vertical || u > 0.02) K.cero(c, x, 400, 0.72, u < 0.1 ? P.corre(pasos(u * 40, 2) * 6.28) : u < 0.47 ? P.empuja() : P.victoria(p), { expr: u < 0.47 ? 'grito' : 'feliz', t: p, viento: 0.7 });
      K.sfx(c, 'NÚCLEO', st.vertical ? 0 : 0, my - mh * 0.62 - 36, st.vertical ? 56 : 90, -0.03, seg(u, 0.47, 0.5), '#58ffb8', TINTA);
    });
    K.impacto(c, st, seg(u, 0.44, 0.46));
    K.rotulo(c, st, seg(u, 0.02, 0.13), 'MUNDO 9', 'LA FÁBRICA NOCTURNA', '#58ffb8');
  };

  /* ───────────── FINAL ───────────── */
  E.final = (c, u, st) => {
    const { t, p } = st;
    const k = ss(0, 0.62, u);
    K.vert(c, st, [`hsl(${lerp(250, 208, k)},${lerp(60, 86, k)}%,${lerp(17, 62, k)}%)`, `hsl(${lerp(310, 195, k)},${lerp(44, 80, k)}%,${lerp(34, 78, k)}%)`, `hsl(${lerp(350, 42, k)},90%,${lerp(55, 80, k)}%)`, `hsl(${lerp(25, 48, k)},100%,${lerp(62, 86, k)}%)`]);
    K.estrellas(c, st, t * (1 - k));
    const sy = lerp(330, -180, k);
    K.radial(c, 0, sy, 820, 'rgba(255,240,180,.85)', 'rgba(255,240,180,0)');
    K.disco(c, 0, sy, 150, '#fff7cf');
    ciudad(c, st, 150, lerp(0, 1, k) > 0.5 ? '#f09b79' : '#5a3d78', null, 3, 120, 360);
    ciudad(c, st, 250, lerp(0, 1, k) > 0.5 ? '#c96a70' : '#2d2257', null, 13, 150, 340);
    K.suelo(c, st, 280, lerp(0, 1, k) > 0.5 ? '#7c3f60' : '#1b1643');
    const llega = ss(0.03, 0.22, u), diez = seg(u, 0.4, 0.46);
    const sc = st.vertical ? 0.7 : 1;
    const ve = ['2', '5', '9', '3', '7', '8', '4', '6'], cols = ['#ffd35c', '#7fe0c3', '#ff9cb5', '#9cc2ff', '#ffb07c', '#c9a6ff', '#ffd35c', '#7fe0c3'];
    const multitud = ss(0.5, 0.62, u);
    if (multitud > 0) ve.forEach((d, i) => {
      const lado = i % 2 ? 1 : -1, ii = Math.floor(i / 2);
      const xf = lado * (st.vertical ? 95 + ii * 62 : 330 + ii * 150);
      const x = lerp(lado * (st.hw + 200), xf, multitud);
      K.vecino(c, x, 325 + (ii % 2) * 12, (st.vertical ? 0.42 : 0.72), d, cols[i], pasos(t * 3 + i, 4), -lado, 1);
    });
    const x1 = lerp(-st.hw - 260, -125 * sc, ss(0.2, 0.36, u));
    const juntos = st.vertical ? 74 : 110;
    // Número gigante
    if (diez > 0) {
      const e = outBack(diez);
      c.save(); c.translate(0, st.vertical ? -190 : -90); c.scale(e, e);
      const tam = st.vertical ? 280 : 360;
      K.radial(c, 0, 0, tam * 1.5, 'rgba(255,255,255,.65)', 'rgba(255,255,255,0)');
      K.sfx(c, '10', 0, 0, tam, -0.03, 1, '#ff3d2e', TINTA);
      c.restore();
    }
    K.vecino(c, x1, 340, st.vertical ? 0.86 : 1.2, '1', '#ff9cb5', u < 0.36 ? pasos(u * 24, 2) : p, 1, 1);
    const x0 = lerp(st.hw + 200, st.vertical ? 62 : juntos, llega);
    K.cero(c, x0, 396, 0.86 * (st.vertical ? 0.86 : 1), u < 0.22 ? P.camina(pasos(u * 38, 2)) : u < 0.44 ? P.parado(p) : P.victoria(p), { expr: u < 0.36 ? 'normal' : u < 0.44 ? 'sorpresa' : 'feliz', t: p, viento: 0.5, flip: true });
    K.impacto(c, st, seg(u, 0.4, 0.42));
    if (u > 0.62) K.cifras(c, st, t, 'rgba(255,255,255,.6)', 28, -60, 34);
  };
})();
