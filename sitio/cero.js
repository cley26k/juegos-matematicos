// Cero, el protagonista: un muñeco articulado dibujado por código, con poses, expresiones y bufanda.
// Las extremidades son una sola curva con grosor variable, sin articulaciones visibles.
(function () {
  const { lerp, TINTA } = K;
  const C = (K.COLORES = {
    piel: '#ffe0c6', pielS: '#f4b79c', pelo: '#2a3180', peloS: '#171b52', peloL: '#6d8cf2',
    chaq: '#f8f4e8', chaqS: '#c9cbe2', pant: '#2f3468', pantS: '#1e2149', bota: '#ffb020', botaS: '#d97b12',
    buf: '#ff3d2e', bufS: '#bd1f26', iris: '#ff9b2e', irisO: '#7a2a12',
  });

  const BASE = { hipY: 0, lean: 0, muF: 0, piF: 0.1, muB: 0, piB: 0.1, brF: 0.1, coF: 0.2, brB: -0.1, coB: 0.2, cab: 0, sq: 1 };
  K.pose = o => Object.assign({}, BASE, o);
  K.mezcla = (a, b, k) => { const r = {}; for (const n in BASE) r[n] = lerp(a[n], b[n], k); return r; };

  K.POSES = {
    parado: t => K.pose({ hipY: Math.sin(t * 2) * 1.5, muF: 0.1, piF: 0.14, muB: -0.1, piB: 0.14, brF: 0.16, coF: 0.3, brB: -0.14, coB: 0.3, cab: 0.02 }),
    triste: t => K.pose({ hipY: 6 + Math.sin(t * 1.4), lean: 0.16, muF: 0.1, piF: 0.2, muB: -0.08, piB: 0.2, brF: 0.14, coF: 0.08, brB: 0.06, coB: 0.08, cab: 0.26 }),
    camina: f => {
      const s = Math.sin(f), o = Math.cos(f);
      return K.pose({ hipY: -Math.abs(o) * 5 + 4, lean: 0.05, muF: s * 0.52, piF: 0.22 + Math.max(0, o) * 0.85, muB: -s * 0.52, piB: 0.22 + Math.max(0, -o) * 0.85, brF: -s * 0.5, coF: 0.42, brB: s * 0.5, coB: 0.42 });
    },
    corre: f => {
      const s = Math.sin(f), o = Math.cos(f);
      return K.pose({ hipY: -Math.abs(o) * 13 + 6, lean: 0.32, muF: s * 0.98, piF: 0.45 + Math.max(0, o) * 1.45, muB: -s * 0.98, piB: 0.45 + Math.max(0, -o) * 1.45, brF: -s * 1.05, coF: 1.5, brB: s * 1.05, coB: 1.5, cab: -0.16 });
    },
    salto: () => K.pose({ hipY: -8, lean: 0.14, muF: 1.1, piF: 1.5, muB: -0.3, piB: 1.1, brF: 2.5, coF: 0.25, brB: -1.1, coB: 0.5, cab: -0.2 }),
    cae: () => K.pose({ lean: -0.2, muF: 0.6, piF: 0.5, muB: -0.5, piB: 0.9, brF: 2.7, coF: 0.4, brB: 2.2, coB: 0.5, cab: -0.3 }),
    aterriza: () => K.pose({ hipY: 46, lean: 0.36, muF: 1.0, piF: 1.9, muB: -0.2, piB: 1.6, brF: 0.6, coF: 0.5, brB: -1.1, coB: 0.4, cab: -0.1 }),
    alto: () => K.pose({ hipY: -3, muF: 0.12, piF: 0.12, muB: -0.12, piB: 0.16, brF: 2.85, coF: 0.2, brB: -0.18, coB: 0.32, cab: -0.2 }),
    victoria: t => K.pose({ hipY: -6 + Math.sin(t * 6) * 3, muF: 0.26, piF: 0.12, muB: -0.26, piB: 0.22, brF: 2.75, coF: 0.25, brB: -2.65, coB: -0.25, cab: -0.18 }),
    sostiene: () => K.pose({ hipY: 3, lean: -0.05, muF: 0.14, piF: 0.2, muB: -0.14, piB: 0.2, brF: 1.5, coF: 0.9, brB: 1.25, coB: 1, cab: 0.06 }),
    empuja: () => K.pose({ hipY: 12, lean: 0.44, muF: 0.7, piF: 1.1, muB: -0.65, piB: 0.22, brF: 1.5, coF: 0.2, brB: 1.3, coB: 0.25, cab: -0.2 }),
    antorcha: t => K.pose({ hipY: Math.sin(t * 2), muF: 0.1, piF: 0.14, muB: -0.1, piB: 0.14, brF: 1.9, coF: 0.8, brB: -0.1, coB: 0.3, cab: -0.04 }),
    señala: () => K.pose({ muF: 0.1, piF: 0.12, muB: -0.1, piB: 0.14, brF: 1.65, coF: 0.08, brB: -0.1, coB: 0.3, cab: -0.05 }),
  };

  // Extremidad continua: curva por la articulación, más gruesa arriba, con sombra plana en un lado.
  function manguera(c, a, j, b, w1, w2, rell, sombra, lw = 5) {
    const cx = 2 * j[0] - (a[0] + b[0]) / 2, cy = 2 * j[1] - (a[1] + b[1]) / 2;
    const n = 6, izq = [], der = [], cen = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, s = 1 - t;
      const x = s * s * a[0] + 2 * s * t * cx + t * t * b[0], y = s * s * a[1] + 2 * s * t * cy + t * t * b[1];
      const dx = 2 * s * (cx - a[0]) + 2 * t * (b[0] - cx), dy = 2 * s * (cy - a[1]) + 2 * t * (b[1] - cy);
      const L = Math.hypot(dx, dy) || 1, w = lerp(w1, w2, t);
      izq.push([x + (dy / L) * w, y - (dx / L) * w]); der.push([x - (dy / L) * w, y + (dx / L) * w]); cen.push([x, y]);
    }
    const contorno = izq.concat(der.slice().reverse());
    K.forma(c, contorno, rell, lw);
    if (sombra) K.forma(c, der.concat(cen.slice(1, -1).reverse().map(p => [p[0] - 1, p[1]])), sombra, 0);
    return izq[n];
  }
  function pierna(c, hip, mu, pi, largo, rell, sombra, bota, botaS) {
    const rod = [hip[0] + Math.sin(mu) * largo, hip[1] + Math.cos(mu) * largo];
    const sh = mu - pi;
    const tob = [rod[0] + Math.sin(sh) * largo, rod[1] + Math.cos(sh) * largo];
    // Bota redondeada, girada con la espinilla
    c.save(); c.translate(tob[0], tob[1]); c.rotate(-sh * 0.9);
    K.forma(c, [[-15, -12], [13, -12], [17, 2], [38, 8], [47, 18], [34, 25], [-12, 25], [-20, 10]], bota, 5);
    K.linea(c, [[-14, 17], [10, 19], [40, 19]], botaS, 4);
    K.linea(c, [[-13, -3], [13, -3]], botaS, 4);
    c.restore();
    manguera(c, hip, rod, tob, 21, 14, rell, sombra);
  }
  function brazo(c, hom, a, b, largo, rell, sombra, piel) {
    const cod = [hom[0] + Math.sin(a) * largo, hom[1] + Math.cos(a) * largo];
    const fo = a + b;
    const mu = [cod[0] + Math.sin(fo) * largo * 0.95, cod[1] + Math.cos(fo) * largo * 0.95];
    // Mano con pulgar
    K.forma(c, [[mu[0] - 11, mu[1] - 6], [mu[0] + 2, mu[1] - 13], [mu[0] + 13, mu[1] - 5], [mu[0] + 13, mu[1] + 8], [mu[0], mu[1] + 14], [mu[0] - 12, mu[1] + 8]], piel, 5);
    manguera(c, hom, cod, mu, 15, 10, rell, sombra);
    return mu;
  }

  // Bufanda: una cinta ondulante que se afina hacia la punta.
  function bufanda(c, x, y, t, viento, largo = 9, fase = 0, ancho = 15) {
    const a = [], b = [];
    const v = Math.min(1.2, viento);
    for (let i = 0; i <= largo; i++) {
      const k = i / largo;
      const ond = Math.sin(t * 7 - i * 0.72 + fase) * (5 + k * 26) * (0.4 + v);
      const px = x - i * (13 + 7 * viento), py = y + i * (9 - 8 * v) + ond;
      const w = ancho * (1 - k * 0.5);
      a.push([px, py - w]); b.push([px, py + w]);
    }
    K.forma(c, a.concat(b.slice().reverse()), C.buf, 5);
    K.forma(c, b.concat(a.map((p, i) => [(p[0] + b[i][0]) / 2, (p[1] + b[i][1]) / 2 + 2]).reverse()), C.bufS, 0);
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

  // Pelo: cada mechón curvo. El tercer valor de un punto indica cuánto se curva el borde que sale de él.
  const MELENA = [[-6, -98, -0.1], [-46, -104], [-40, -84], [-88, -86], [-70, -62], [-114, -48], [-84, -30], [-112, 0], [-80, -4], [-94, 36], [-62, 20], [-62, 54], [-34, 24], [30, 0, 0], [32, -70, -0.1]];
  const FLEQUILLO = [[-66, 8, -0.06], [-78, -40, -0.1], [-56, -80, -0.12], [-14, -102], [10, -136], [24, -103, -0.12], [58, -90, -0.1], [80, -54, -0.05], [84, -10], [68, -36], [64, 4], [48, -32], [36, 0], [20, -36], [4, 2], [-8, -38], [-26, -4], [-34, -40], [-54, 26]];
  const BRILLO = [[-54, -56], [-32, -76], [0, -86], [32, -84], [58, -66], [52, -56], [40, -66], [30, -55], [17, -68], [5, -57], [-9, -70], [-21, -59], [-35, -66], [-47, -48]];
  const CARA = [[-50, -24], [-52, 18], [-30, 46], [4, 66], [22, 75], [44, 58], [60, 26], [66, -14], [52, -54], [-2, -70], [-40, -58]];

  // Cabeza completa: en primer plano se dibuja igual, solo que a mayor escala.
  K.cabeza = (c, x, y, s, o = {}) => {
    const expr = o.expr || 'normal', t = o.t || 0, inc = o.inc || 0, mira = o.mira || [0.2, 0];
    c.save(); c.translate(x, y); c.rotate(inc); c.scale(s * (o.flip ? -1 : 1), s);
    const lw = 5;
    K.mechones(c, MELENA, C.peloS, lw);
    K.forma(c, [[-46, -4], [-64, -12], [-70, 8], [-58, 24], [-46, 22]], C.piel, 4);
    K.linea(c, [[-60, 0], [-54, 6], [-58, 14]], C.pielS, 3);
    K.forma(c, CARA, C.piel, lw);
    // Sombra del flequillo sobre la frente y del pelo en la nuca
    c.save(); c.beginPath(); K.camino(c, CARA, true); c.clip();
    K.mechones(c, [[-70, -40, 0], [80, -40, 0], [78, -14], [60, -22], [52, -6], [38, -24], [22, -6], [8, -24], [-8, -6], [-22, -22], [-36, -8], [-46, -16], [-52, 40]], C.pielS, 0);
    c.restore();

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
    const ceja = { normal: [-29, -28], triste: [-22, -33], sorpresa: [-37, -37], decidido: [-22, -18], feliz: [-34, -32], grito: [-20, -14], foco: [-22, -17] }[expr] || [-29, -28];
    K.linea(c, [[1, ceja[1]], [17, (ceja[0] + ceja[1]) / 2 - 2], [34, ceja[0]]], TINTA, 5);
    K.linea(c, [[49, ceja[0] + 2], [58, (ceja[0] + ceja[1]) / 2 - 2], [66, ceja[1]]], TINTA, 4);
    K.linea(c, [[44, 25], [47, 30]], '#c97f68', 3);
    if (expr !== 'decidido' && expr !== 'foco') {
      c.fillStyle = 'rgba(255,90,90,.34)'; c.beginPath(); c.ellipse(12, 37, 15, 7, 0, 0, 7); c.fill();
      for (let i = 0; i < 3; i++) K.linea(c, [[4 + i * 7, 34], [1 + i * 7, 40]], '#e0726b', 2);
    }
    const my = 50;
    if (expr === 'grito') K.forma(c, [[18, my - 8], [52, my - 10], [50, my + 10], [34, my + 19], [20, my + 8]], '#8f1f2a', 4);
    else if (expr === 'sorpresa') K.forma(c, [[30, my - 5], [42, my - 4], [41, my + 8], [31, my + 8]], '#8f1f2a', 3.5);
    else if (expr === 'feliz') K.forma(c, [[16, my - 8], [36, my - 6], [54, my - 8], [46, my + 10], [28, my + 11]], '#8f1f2a', 4);
    else if (expr === 'triste') K.linea(c, [[26, my + 4], [36, my], [46, my + 4]], TINTA, 4);
    else if (expr === 'decidido' || expr === 'foco') K.linea(c, [[28, my + 1], [37, my], [46, my - 1]], TINTA, 4);
    else K.linea(c, [[26, my - 2], [36, my + 3], [46, my - 2]], TINTA, 4);

    K.mechones(c, FLEQUILLO, C.pelo, lw);
    K.forma(c, BRILLO, C.peloL, 0);
    K.linea(c, [[-40, -12], [-52, -44], [-40, -68]], C.peloS, 3);
    c.restore();
  };

  // Cuerpo completo. x, y son el suelo bajo los pies; s = 1 mide unos 340 de alto.
  K.cero = (c, x, y, s, pose, o = {}) => {
    const t = o.t || 0, flip = o.flip ? -1 : 1, viento = o.viento ?? 0.4;
    c.save(); c.translate(x, y); c.scale(s * flip, s);
    const P = pose, L = 56;
    const hip = [0, -(L * 2) - 24 + P.hipY];
    const dl = Math.sin(P.lean), cl = Math.cos(P.lean);
    const tor = 84;
    const cuello = [hip[0] + dl * tor, hip[1] - cl * tor];
    const homB = [cuello[0] - 17, cuello[1] + 17], homF = [cuello[0] + 15, cuello[1] + 17];
    const cab = [cuello[0] + dl * 62 + 3, cuello[1] - cl * 56];

    if (o.bufanda !== false) { bufanda(c, cuello[0] - 12, cuello[1] + 8, t, viento, 6, 1.6, 11); bufanda(c, cuello[0] - 12, cuello[1] + 2, t, viento); }
    brazo(c, homB, P.brB, P.coB, 37, C.chaqS, null, C.pielS);
    pierna(c, [hip[0] - 9, hip[1] + 6], P.muB, P.piB, L, C.pantS, null, C.botaS, C.botaS);

    // Torso de sudadera: hombros redondos, cintura y bajo acampanado
    c.save(); c.translate(hip[0], hip[1]); c.rotate(P.lean);
    const torso = [[-22, -tor + 4], [-37, -tor + 22], [-34, -tor * 0.5], [-27, -20], [-35, 14], [-14, 24], [14, 24], [35, 14], [29, -20], [36, -tor * 0.5], [39, -tor + 22], [24, -tor + 4], [0, -tor]];
    K.forma(c, torso, C.chaq, 5);
    K.forma(c, [[-22, -tor + 8], [-34, -tor + 22], [-31, -tor * 0.5], [-24, -20], [-31, 12], [-12, 20], [-16, -20], [-10, -tor * 0.5]], C.chaqS, 0);
    K.linea(c, [[-31, 7], [0, 14], [31, 7]], C.chaqS, 4);
    K.linea(c, [[-10, -8], [2, -2], [18, -8]], C.chaqS, 3);
    c.beginPath(); c.ellipse(9, -tor * 0.56, 10, 14, 0, 0, 7); c.lineWidth = 6.5; c.strokeStyle = C.buf; c.stroke();
    c.restore();

    pierna(c, [hip[0] + 9, hip[1] + 8], P.muF, P.piF, L, C.pant, C.pantS, C.bota, C.botaS);
    const mano = brazo(c, homF, P.brF, P.coF, 37, C.chaq, C.chaqS, C.piel);
    if (o.enMano) o.enMano(c, mano);
    // Cuello y vuelta de la bufanda
    K.forma(c, [[cuello[0] - 34, cuello[1] + 1], [cuello[0] - 16, cuello[1] - 15], [cuello[0] + 20, cuello[1] - 17], [cuello[0] + 38, cuello[1] - 1], [cuello[0] + 20, cuello[1] + 21], [cuello[0] - 18, cuello[1] + 21]], C.buf, 5);
    K.linea(c, [[cuello[0] - 22, cuello[1] + 9], [cuello[0], cuello[1] + 12], [cuello[0] + 25, cuello[1] + 7]], C.bufS, 5);
    K.cabeza(c, cab[0], cab[1], 0.98, { expr: o.expr, t, inc: P.cab, mira: o.mira, lagrima: o.lagrima, parpadeo: o.parpadeo });
    c.restore();
  };
})();
