// Cero, el protagonista: un muñeco articulado dibujado por código, con poses, expresiones y bufanda.
(function () {
  const { lerp, pasos, clamp, TINTA } = K;
  const C = (K.COLORES = {
    piel: '#ffe0c6', pielS: '#f4b79c', pelo: '#262c66', peloS: '#141842', peloL: '#5a78e6',
    chaq: '#f6f2e6', chaqS: '#c6c7dc', pant: '#2d3160', pantS: '#1d2044', bota: '#ffb020', botaS: '#d97b12',
    buf: '#ff3d2e', bufS: '#bd1f26', iris: '#ff9b2e', irisO: '#7a2a12',
  });

  const BASE = { hipY: 0, lean: 0, muF: 0, piF: 0.1, muB: 0, piB: 0.1, brF: 0.1, coF: 0.2, brB: -0.1, coB: 0.2, cab: 0, sq: 1 };
  K.pose = o => Object.assign({}, BASE, o);
  K.mezcla = (a, b, k) => { const r = {}; for (const n in BASE) r[n] = lerp(a[n], b[n], k); return r; };

  K.POSES = {
    parado: t => K.pose({ hipY: Math.sin(t * 2) * 1.5, brF: 0.08, brB: -0.08, cab: 0.02 }),
    triste: t => K.pose({ hipY: 6 + Math.sin(t * 1.4), lean: 0.14, brF: 0.1, coF: 0.05, brB: 0.04, coB: 0.05, cab: 0.26 }),
    camina: f => {
      const s = Math.sin(f), o = Math.cos(f);
      return K.pose({ hipY: -Math.abs(o) * 5 + 4, lean: 0.04, muF: s * 0.5, piF: 0.2 + Math.max(0, o) * 0.8, muB: -s * 0.5, piB: 0.2 + Math.max(0, -o) * 0.8, brF: -s * 0.45, coF: 0.35, brB: s * 0.45, coB: 0.35 });
    },
    corre: f => {
      const s = Math.sin(f), o = Math.cos(f);
      return K.pose({ hipY: -Math.abs(o) * 13 + 6, lean: 0.3, muF: s * 0.95, piF: 0.45 + Math.max(0, o) * 1.45, muB: -s * 0.95, piB: 0.45 + Math.max(0, -o) * 1.45, brF: -s * 1.05, coF: 1.5, brB: s * 1.05, coB: 1.5, cab: -0.14 });
    },
    salto: () => K.pose({ hipY: -8, lean: 0.12, muF: 1.1, piF: 1.5, muB: -0.3, piB: 1.1, brF: 2.5, coF: 0.2, brB: -1.1, coB: 0.5, cab: -0.2 }),
    cae: () => K.pose({ hipY: 0, lean: -0.2, muF: 0.6, piF: 0.5, muB: -0.5, piB: 0.9, brF: 2.7, coF: 0.4, brB: 2.2, coB: 0.5, cab: -0.3 }),
    aterriza: () => K.pose({ hipY: 46, lean: 0.34, muF: 1.0, piF: 1.9, muB: -0.2, piB: 1.6, brF: 0.6, coF: 0.5, brB: -1.1, coB: 0.4, cab: -0.1 }),
    alto: () => K.pose({ hipY: -3, muF: 0.12, piF: 0.1, muB: -0.1, piB: 0.14, brF: 2.9, coF: 0.15, brB: -0.15, coB: 0.3, cab: -0.2 }),
    victoria: t => K.pose({ hipY: -6 + Math.sin(t * 6) * 3, muF: 0.25, piF: 0.1, muB: -0.25, piB: 0.2, brF: 2.8, coF: 0.2, brB: -2.7, coB: -0.2, cab: -0.18 }),
    sostiene: () => K.pose({ hipY: 3, lean: -0.05, muF: 0.14, piF: 0.2, muB: -0.14, piB: 0.2, brF: 1.5, coF: 0.9, brB: 1.25, coB: 1, cab: 0.06 }),
    empuja: () => K.pose({ hipY: 12, lean: 0.42, muF: 0.7, piF: 1.1, muB: -0.65, piB: 0.2, brF: 1.5, coF: 0.15, brB: 1.3, coB: 0.2, cab: -0.2 }),
    antorcha: t => K.pose({ hipY: Math.sin(t * 2), brF: 1.9, coF: 0.8, brB: -0.1, coB: 0.3, cab: -0.04 }),
    señala: () => K.pose({ brF: 1.65, coF: 0.04, brB: -0.1, coB: 0.3, cab: -0.05 }),
  };

  function pierna(c, hip, mu, pi, largo, rell, sombra, bota, botaS) {
    const rod = [hip[0] + Math.sin(mu) * largo, hip[1] + Math.cos(mu) * largo];
    const sh = mu - pi;
    const tob = [rod[0] + Math.sin(sh) * largo, rod[1] + Math.cos(sh) * largo];
    K.miembro(c, hip, rod, 19, 15, rell, 5, sombra);
    K.miembro(c, rod, tob, 15, 13, rell, 5, sombra);
    const pa = sh + Math.PI / 2 - 0.1;
    const punta = [tob[0] + Math.sin(pa) * 34, tob[1] + Math.cos(pa) * 34 + 3];
    K.miembro(c, [tob[0] - Math.sin(pa) * 3, tob[1] + 5 - Math.cos(pa) * 3], punta, 15, 12, bota, 5, botaS);
  }
  function brazo(c, hom, a, b, largo, rell, sombra, piel, pielS) {
    const cod = [hom[0] + Math.sin(a) * largo, hom[1] + Math.cos(a) * largo];
    const fo = a + b;
    const mu = [cod[0] + Math.sin(fo) * largo * 0.92, cod[1] + Math.cos(fo) * largo * 0.92];
    K.miembro(c, hom, cod, 14, 12, rell, 5, sombra);
    K.miembro(c, cod, mu, 12, 10, rell, 5, sombra);
    K.disco(c, mu[0], mu[1], 12, piel, 5);
    return mu;
  }

  function bufanda(c, x, y, t, viento, largo = 8) {
    const a = [], b = [];
    for (let i = 0; i <= largo; i++) {
      const k = i / largo;
      const ond = Math.sin(t * 7 - i * 0.68) * (6 + k * 26) * (0.4 + Math.min(1.2, viento));
      const px = x - i * (14 + 7 * viento), py = y + i * (9 - 8 * Math.min(1.2, viento)) + ond;
      const w = 15 - k * 4;
      a.push([px, py - w]); b.push([px, py + w]);
    }
    const borde = a.concat(b.reverse());
    K.pico(c, borde, C.bufS, 5);
    K.linea(c, a.map(p => [p[0], p[1] + 8]), C.buf, 11);
    K.pico(c, [[a[largo][0], a[largo][1]], [a[largo][0] - 18, a[largo][1] + 3], [a[largo][0] - 8, a[largo][1] + 14], [a[largo][0] - 20, a[largo][1] + 24], [a[largo][0], a[largo][1] + 26]], C.bufS, 4);
  }

  // Ojo grande de anime. Sirve también para los primerísimos planos.
  K.ojo = (c, x, y, w, h, o = {}) => {
    const { mira = [0, 0], par = 0, sorpresa = 0, lagrima = 0, reflejo } = o;
    const top = -h * (1 - par * 0.8);
    c.save(); c.translate(x, y);
    const blanco = [[-w, -h * 0.05], [-w * 0.75, top * 0.85], [0, top], [w * 0.8, top * 0.8], [w * 1.02, -h * 0.05], [w * 0.8, h * 0.72], [0, h * 0.92], [-w * 0.76, h * 0.7]];
    c.save();
    c.beginPath();
    blanco.forEach((p, i) => { const q = blanco[(i + 1) % 8]; const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (!i) c.moveTo(mx, my); else c.quadraticCurveTo(p[0], p[1], mx, my); });
    c.quadraticCurveTo(blanco[0][0], blanco[0][1], (blanco[0][0] + blanco[1][0]) / 2, (blanco[0][1] + blanco[1][1]) / 2);
    c.closePath();
    c.fillStyle = '#fff'; c.fill(); c.clip();
    c.fillStyle = 'rgba(70,80,170,.28)'; c.fillRect(-w * 1.2, top, w * 2.4, h * 0.42);
    const ix = mira[0] * w * 0.35, iy = mira[1] * h * 0.3 + h * 0.06;
    const ir = 1 - sorpresa * 0.42, irw = w * 0.72 * ir, irh = h * 0.92 * ir;
    const g = c.createLinearGradient(0, iy - irh, 0, iy + irh);
    g.addColorStop(0, o.irisO || C.irisO); g.addColorStop(0.55, o.iris || C.iris); g.addColorStop(1, '#ffe07a');
    c.beginPath(); c.ellipse(ix, iy, irw, irh, 0, 0, 7); c.fillStyle = g; c.fill();
    c.lineWidth = Math.max(2, w * 0.07); c.strokeStyle = TINTA; c.stroke();
    if (reflejo) { c.save(); c.beginPath(); c.ellipse(ix, iy, irw * 0.92, irh * 0.92, 0, 0, 7); c.clip(); reflejo(c, ix, iy, irw, irh); c.restore(); }
    c.beginPath(); c.ellipse(ix, iy - irh * 0.05, irw * 0.45, irh * 0.52, 0, 0, 7); c.fillStyle = TINTA; c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(ix - irw * 0.34, iy - irh * 0.42, irw * 0.34, irh * 0.26, -0.4, 0, 7); c.fill();
    c.beginPath(); c.arc(ix + irw * 0.42, iy + irh * 0.4, irw * 0.15, 0, 7); c.fill();
    c.restore();
    const lw = Math.max(5, h * 0.2);
    K.linea(c, [[-w * 1.05, top * 0.1], [-w * 0.75, top * 0.9], [0, top * 1.05], [w * 0.8, top * 0.85], [w * 1.2, -h * 0.28]], TINTA, lw);
    K.linea(c, [[-w * 0.5, h * 0.78], [0, h * 0.95], [w * 0.5, h * 0.76]], TINTA, Math.max(2, lw * 0.3));
    if (lagrima > 0) {
      const yy = h * 0.9 + lagrima * h * 1.3;
      K.forma(c, [[-w * 0.3, yy - h * 0.34], [-w * 0.08, yy + h * 0.22], [-w * 0.3, yy + h * 0.42], [-w * 0.52, yy + h * 0.22]], '#bfe9ff', Math.max(1.6, w * 0.05));
    }
    c.restore();
  };

  // Cabeza completa: en primer plano se dibuja igual, solo que a mayor escala.
  K.cabeza = (c, x, y, s, o = {}) => {
    const expr = o.expr || 'normal', t = o.t || 0, inc = o.inc || 0, mira = o.mira || [0.2, 0];
    c.save(); c.translate(x, y); c.rotate(inc); c.scale(s * (o.flip ? -1 : 1), s);
    const lw = 5;
    // Melena trasera
    const atras = [[-30, -80], [-70, -92], [-58, -66], [-104, -60], [-76, -38], [-112, -14], [-76, -2], [-96, 34], [-62, 28], [-62, 54], [-30, 22], [20, 0], [10, -60]];
    K.pico(c, atras, C.peloS, lw);
    // Oreja
    K.forma(c, [[-48, 0], [-66, -8], [-68, 16], [-50, 24]], C.piel, 4);
    // Cara
    const cara = [[-54, -22], [-54, 22], [-24, 52], [18, 74], [46, 52], [64, 18], [66, -22], [48, -58], [-6, -70], [-44, -56]];
    K.forma(c, cara, C.piel, lw);
    // Sombra bajo el pelo
    c.save(); c.beginPath();
    cara.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();
    c.fillStyle = C.pielS;
    c.beginPath(); c.moveTo(-70, -30); c.lineTo(70, -30); c.lineTo(70, -12); c.lineTo(46, -8); c.lineTo(36, -18); c.lineTo(20, -8); c.lineTo(4, -18); c.lineTo(-14, -6); c.lineTo(-30, -14); c.lineTo(-70, 40); c.closePath(); c.fill();
    c.fillRect(-60, 26, 24, 40);
    c.restore();

    // Ojos según la expresión
    const parp = o.parpadeo ?? (((t * 0.31) % 1) > 0.965 ? 1 : 0);
    const par = { normal: 0.08, triste: 0.42, sorpresa: 0, decidido: 0.3, feliz: 0, grito: 0.18, foco: 0.34 }[expr] || 0;
    const sor = expr === 'sorpresa' ? 1 : 0;
    if (expr === 'feliz' || parp) {
      const curva = expr === 'feliz' ? -1 : 0.5;
      K.linea(c, [[2, 8], [20, 8 + curva * 15], [38, 8]], TINTA, 6);
      K.linea(c, [[50, 7], [57, 7 + curva * 11], [66, 8]], TINTA, 5);
    } else {
      K.ojo(c, 18, 10, 16, 24, { mira, par, sorpresa: sor, lagrima: o.lagrima || 0, reflejo: o.reflejo });
      c.save(); c.translate(56, 9); c.scale(0.62, 0.94);
      K.ojo(c, 0, 0, 15, 23, { mira, par, sorpresa: sor, reflejo: o.reflejo });
      c.restore();
    }
    // Cejas
    const ceja = { normal: [-29, -28], triste: [-22, -33], sorpresa: [-37, -37], decidido: [-22, -18], feliz: [-34, -32], grito: [-20, -14], foco: [-22, -17] }[expr] || [-29, -28];
    K.linea(c, [[1, ceja[1]], [17, (ceja[0] + ceja[1]) / 2 - 2], [34, ceja[0]]], TINTA, 5);
    K.linea(c, [[49, ceja[0] + 2], [58, (ceja[0] + ceja[1]) / 2 - 2], [66, ceja[1]]], TINTA, 4);
    // Nariz y mejillas
    K.linea(c, [[44, 25], [47, 30]], '#c97f68', 3);
    if (expr !== 'decidido' && expr !== 'foco') {
      c.fillStyle = 'rgba(255,90,90,.34)'; c.beginPath(); c.ellipse(12, 37, 15, 7, 0, 0, 7); c.fill();
      for (let i = 0; i < 3; i++) K.linea(c, [[4 + i * 7, 34], [1 + i * 7, 40]], '#e0726b', 2);
    }
    // Boca
    const my = 49;
    if (expr === 'grito') K.forma(c, [[18, my - 8], [52, my - 10], [50, my + 10], [34, my + 19], [20, my + 8]], '#8f1f2a', 4);
    else if (expr === 'sorpresa') K.forma(c, [[30, my - 5], [42, my - 4], [41, my + 8], [31, my + 8]], '#8f1f2a', 3.5);
    else if (expr === 'feliz') K.forma(c, [[16, my - 8], [54, my - 8], [46, my + 10], [28, my + 11]], '#8f1f2a', 4);
    else if (expr === 'triste') K.linea(c, [[26, my + 4], [36, my], [46, my + 4]], TINTA, 4);
    else if (expr === 'decidido' || expr === 'foco') K.linea(c, [[28, my + 1], [46, my - 1]], TINTA, 4);
    else K.linea(c, [[26, my - 2], [36, my + 3], [46, my - 2]], TINTA, 4);

    // Flequillo y pelo delantero
    const fle = [[-72, -2], [-78, -52], [-48, -84], [-6, -100], [14, -132], [26, -100], [54, -88], [76, -52], [78, -14], [64, -44], [58, -8], [42, -40], [32, -10], [14, -40], [0, -4], [-14, -38], [-32, -10], [-38, -40], [-58, 24]];
    K.pico(c, fle, C.pelo, lw);
    // Anillo de brillo, marca del pelo de anime
    c.fillStyle = C.peloL;
    [[-46, -56, 22, 9, -0.5], [-12, -74, 20, 8, -0.15], [24, -74, 18, 7, 0.2], [52, -58, 12, 6, 0.6]].forEach(e => { c.beginPath(); c.ellipse(e[0], e[1], e[2], e[3], e[4], 0, 7); c.fill(); });
    c.restore();
  };

  // Cuerpo completo. x, y son el suelo bajo los pies; s = 1 mide unos 340 de alto.
  K.cero = (c, x, y, s, pose, o = {}) => {
    const t = o.t || 0, flip = o.flip ? -1 : 1, viento = o.viento ?? 0.4;
    c.save(); c.translate(x, y); c.scale(s * flip, s);
    const P = pose, L = 56;
    const hip = [0, -(L * 2) - 22 + P.hipY];
    const dl = Math.sin(P.lean), cl = Math.cos(P.lean);
    const tor = 86;
    const cuello = [hip[0] + dl * tor, hip[1] - cl * tor];
    const homB = [cuello[0] - 12, cuello[1] + 13], homF = [cuello[0] + 10, cuello[1] + 13];
    const cab = [cuello[0] + dl * 62 + 3, cuello[1] - cl * 56];

    if (o.bufanda !== false) bufanda(c, cuello[0] - 12, cuello[1] + 2, t, viento);
    brazo(c, homB, P.brB, P.coB, 37, C.chaqS, '#9d9ebb', C.pielS);
    pierna(c, [hip[0] - 7, hip[1] + 6], P.muB, P.piB, L, C.pantS, null, C.botaS, null);
    // Torso
    const torso = [
      [cuello[0] - 31, cuello[1] + 8], [cuello[0] + 31, cuello[1] + 8],
      [hip[0] + 32, hip[1] + 18], [hip[0] - 32, hip[1] + 18],
    ];
    K.pico(c, torso, C.chaq, 5);
    c.save(); c.beginPath(); torso.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();
    c.fillStyle = C.chaqS; c.beginPath(); c.moveTo(torso[0][0] - 3, torso[0][1]); c.lineTo(torso[0][0] + 18, torso[0][1]); c.lineTo(hip[0] - 8, hip[1] + 22); c.lineTo(hip[0] - 34, hip[1] + 22); c.closePath(); c.fill();
    c.restore();
    // Emblema: un cero en el pecho
    const ex = lerp(hip[0], cuello[0], 0.55) + 8, ey = lerp(hip[1], cuello[1], 0.55);
    c.beginPath(); c.ellipse(ex, ey, 11, 15, P.lean, 0, 7); c.lineWidth = 7; c.strokeStyle = C.buf; c.stroke();
    pierna(c, [hip[0] + 8, hip[1] + 8], P.muF, P.piF, L, C.pant, C.pantS, C.bota, C.botaS);
    if (o.conMano) o.conMano(c, homF, P);
    const mano = brazo(c, homF, P.brF, P.coF, 37, C.chaq, C.chaqS, C.piel);
    if (o.enMano) o.enMano(c, mano);
    // Vuelta de la bufanda al cuello
    K.forma(c, [[cuello[0] - 32, cuello[1] - 2], [cuello[0] - 12, cuello[1] - 16], [cuello[0] + 24, cuello[1] - 15], [cuello[0] + 36, cuello[1] + 2], [cuello[0] + 12, cuello[1] + 19], [cuello[0] - 22, cuello[1] + 18]], C.buf, 5);
    K.linea(c, [[cuello[0] - 22, cuello[1] + 8], [cuello[0] + 24, cuello[1] + 7]], C.bufS, 5);
    K.cabeza(c, cab[0], cab[1], 0.98, { expr: o.expr, t, inc: P.cab, mira: o.mira, lagrima: o.lagrima, parpadeo: o.parpadeo });
    c.restore();
  };
})();
