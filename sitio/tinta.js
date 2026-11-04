// Tinta: utilidades de dibujo para la historia. Todo se dibuja por código en un canvas 2D.
// Coordenadas virtuales: el origen es el centro de la pantalla y la altura visible siempre mide 1080.
(function () {
  const K = (window.K = {});
  const TINTA = (K.TINTA = '#14121f');
  K.PAPEL = '#fff6e3';

  K.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  K.lerp = (a, b, k) => a + (b - a) * k;
  K.seg = (u, a, b) => K.clamp((u - a) / (b - a));
  K.ss = (a, b, x) => { const k = K.seg(x, a, b); return k * k * (3 - 2 * k); };
  K.outBack = k => { const c = 1.9; const m = k - 1; return 1 + (c + 1) * m * m * m + c * m * m; };
  K.outExpo = k => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
  K.rnd = i => { const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return s - Math.floor(s); };
  // Pasos: como en la animación limitada, cada dibujo se mantiene varios fotogramas.
  K.pasos = (x, n) => Math.floor(x * n) / n;

  // Temblor de línea: cada punto se desplaza un poco y cambia solo unas veces por segundo.
  let semilla = 0, n = 0, amp = 1;
  K.boil = (s, a = 1) => { semilla = s * 7.13; n = 0; amp = a; };
  const J = () => (K.rnd(semilla + ++n) - 0.5) * amp;

  function trazo(c, pts, cerrado) {
    const P = pts.map(p => [p[0] + J(), p[1] + J()]);
    const m = P.length;
    if (cerrado) {
      c.moveTo((P[m - 1][0] + P[0][0]) / 2, (P[m - 1][1] + P[0][1]) / 2);
      for (let i = 0; i < m; i++) { const a = P[i], b = P[(i + 1) % m]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
      c.closePath();
    } else {
      c.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i < m - 1; i++) { const a = P[i], b = P[i + 1]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
      c.lineTo(P[m - 1][0], P[m - 1][1]);
    }
  }

  K.camino = trazo;
  // Mechones de pelo: bordes curvos entre puntas. El tercer valor del punto es la curvatura del borde siguiente.
  K.mechones = (c, pts, relleno, lw = 5, tinta = TINTA) => {
    let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
    const P = pts.map(p => [p[0] + J(), p[1] + J(), p[2] === undefined ? 0.15 : p[2]]);
    c.beginPath(); c.moveTo(P[0][0], P[0][1]);
    P.forEach((p, i) => {
      const q = P[(i + 1) % P.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      c.quadraticCurveTo(mx + (cx - mx) * p[2], my + (cy - my) * p[2], q[0], q[1]);
    });
    c.closePath();
    if (relleno) { c.fillStyle = relleno; c.fill(); }
    if (lw) { c.lineWidth = lw; c.strokeStyle = tinta; c.lineJoin = c.lineCap = 'round'; c.stroke(); }
  };

  // Capas ya dibujadas: lo que no cambia se pinta una vez y luego solo se copia.
  // Es lo que más alivia el rendimiento: un fondo completo cuesta decenas de veces más que copiarlo.
  const capas = new Map();
  K.escPx = 1;
  K.limpiarCapas = () => capas.clear();
  K.capa = (c, clave, r, fn, dx = 0, dy = 0) => {
    const e = K.escPx, k = clave + '|' + e;
    let o = capas.get(k);
    if (!o) {
      o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(r[2] * e)); o.height = Math.max(1, Math.ceil(r[3] * e));
      const x = o.getContext('2d');
      x.scale(e, e); x.translate(-r[0], -r[1]);
      const n0 = n, s0 = semilla, a0 = amp; K.boil(3, 0.8);
      fn(x);
      n = n0; semilla = s0; amp = a0;
      capas.set(k, o);
    }
    c.drawImage(o, r[0] + dx, r[1] + dy, r[2], r[3]);
  };
  // Capa que ocupa toda la pantalla, en las mismas coordenadas que la escena.
  K.plano = (c, st, clave, fn) => K.capa(c, clave + st.hw.toFixed(0), [-st.hw - 4, -544, st.hw * 2 + 8, 1088], fn);
  // Texto ya dibujado, para no repetir fuentes y contornos en cada fotograma.
  K.txt = (c, ch, x, y, tam, color, fuente = '"Dela Gothic One", Impact, sans-serif') => {
    const a = tam * 1.5;
    K.capa(c, 't' + ch + tam.toFixed(1) + color, [-a, -a, a * 2, a * 2], z => {
      z.font = `${tam}px ${fuente}`; z.textAlign = 'center'; z.textBaseline = 'middle'; z.fillStyle = color; z.fillText(ch, 0, 0);
    }, x, y);
  };

  // Forma suave con relleno y contorno de tinta.
  K.forma = (c, pts, relleno, lw = 5, cerrado = true, tinta = TINTA) => {
    c.beginPath(); trazo(c, pts, cerrado);
    if (relleno) { c.fillStyle = relleno; c.fill(); }
    if (lw) { c.lineWidth = lw; c.strokeStyle = tinta; c.lineJoin = c.lineCap = 'round'; c.stroke(); }
  };
  // Forma con esquinas vivas: pelo, cristales, picos.
  K.pico = (c, pts, relleno, lw = 5, tinta = TINTA) => {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0] + J(), p[1] + J()) : c.moveTo(p[0] + J(), p[1] + J())));
    c.closePath();
    if (relleno) { c.fillStyle = relleno; c.fill(); }
    if (lw) { c.lineWidth = lw; c.strokeStyle = tinta; c.lineJoin = c.lineCap = 'round'; c.stroke(); }
  };
  K.linea = (c, pts, color = TINTA, lw = 4) => {
    c.beginPath(); trazo(c, pts, false);
    c.strokeStyle = color; c.lineWidth = lw; c.lineJoin = c.lineCap = 'round'; c.stroke();
  };
  K.disco = (c, x, y, r, relleno, lw = 0, tinta = TINTA) => {
    c.beginPath(); c.arc(x + J(), y + J(), Math.max(0.01, r), 0, 7);
    if (relleno) { c.fillStyle = relleno; c.fill(); }
    if (lw) { c.lineWidth = lw; c.strokeStyle = tinta; c.stroke(); }
  };
  // Extremidad cónica con puntas redondas.
  K.miembro = (c, a, b, w1, w2, relleno, lw = 5, sombra) => {
    const d = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = Math.sin(d), ny = -Math.cos(d);
    const camino = () => {
      c.beginPath();
      c.moveTo(a[0] + nx * w1 + J(), a[1] + ny * w1 + J());
      c.lineTo(b[0] + nx * w2 + J(), b[1] + ny * w2 + J());
      c.arc(b[0], b[1], w2, d - Math.PI / 2, d + Math.PI / 2);
      c.lineTo(a[0] - nx * w1 + J(), a[1] - ny * w1 + J());
      c.arc(a[0], a[1], w1, d + Math.PI / 2, d + (3 * Math.PI) / 2);
      c.closePath();
    };
    camino(); c.fillStyle = relleno; c.fill();
    if (sombra) {
      c.save(); camino(); c.clip();
      c.beginPath();
      c.moveTo(a[0] - nx * w1 * 2, a[1] - ny * w1 * 2); c.lineTo(b[0] - nx * w2 * 2, b[1] - ny * w2 * 2);
      c.lineTo(b[0] - nx * w2 * 0.15, b[1] - ny * w2 * 0.15); c.lineTo(a[0] - nx * w1 * 0.15, a[1] - ny * w1 * 0.15);
      c.closePath(); c.fillStyle = sombra; c.fill(); c.restore();
    }
    camino(); c.lineWidth = lw; c.strokeStyle = TINTA; c.lineJoin = 'round'; c.stroke();
  };

  const degradado = (c, st, stops) => {
    const g = c.createLinearGradient(0, -540, 0, 540);
    stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
    c.fillStyle = g; c.fillRect(-st.hw - 4, -544, st.hw * 2 + 8, 1088);
  };
  K.vert = (c, st, stops, vivo) => (vivo ? degradado(c, st, stops) : K.plano(c, st, 'cielo' + stops.join(), z => degradado(z, st, stops)));
  // Resplandor: un degradado pequeño que se copia a escala.
  const brillos = {};
  K.radial = (c, x, y, r, a, b) => {
    const k = a + b;
    if (!brillos[k]) {
      const o = document.createElement('canvas'); o.width = o.height = 128;
      const z = o.getContext('2d'), g = z.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, a); g.addColorStop(1, b); z.fillStyle = g; z.fillRect(0, 0, 128, 128);
      brillos[k] = o;
    }
    c.drawImage(brillos[k], x - r, y - r, r * 2, r * 2);
  };
  // Trama de puntos en una zona fija, ya dibujada.
  K.rellenoTrama = (c, color, paso, radio, x, y, w, h) => K.capa(c, ['tr', color, paso, radio, x.toFixed(0), y.toFixed(0), w.toFixed(0), h.toFixed(0)].join(), [x, y, w, h], z => {
    z.fillStyle = K.trama(z, color, paso, radio); z.fillRect(x, y, w, h);
  });

  // Trama de puntos de manga, en un patrón reutilizable.
  const tramas = {};
  K.trama = (c, color, paso = 14, r = 3.4) => {
    const k = color + paso + r;
    if (!tramas[k]) {
      const o = document.createElement('canvas'); o.width = o.height = paso;
      const x = o.getContext('2d'); x.fillStyle = color;
      x.beginPath(); x.arc(paso / 2, paso / 2, r, 0, 7); x.fill();
      tramas[k] = c.createPattern(o, 'repeat');
    }
    return tramas[k];
  };
  // Banda de trama que se desvanece con puntos cada vez más pequeños.
  K.bandaTrama = (c, st, y0, y1, color, seed = 1) => {
    K.capa(c, ['ba', color, y0, y1, st.hw.toFixed(0)].join(), [-st.hw - 4, y0, st.hw * 2 + 8, y1 - y0 + 1], z => {
      const filas = 7, h = (y1 - y0) / filas;
      for (let i = 0; i < filas; i++) {
        z.fillStyle = K.trama(z, color, 16, 1 + (i / filas) * 5.5);
        z.fillRect(-st.hw - 4, y0 + h * i, st.hw * 2 + 8, h + 1);
      }
    });
  };

  // Líneas de velocidad hacia un punto, típicas de los planos de tensión.
  K.velocidad = (c, st, x, y, fuerza, tiempo, color = TINTA, cuantas = 70) => {
    if (fuerza <= 0) return;
    const R = Math.hypot(st.hw + Math.abs(x), 560 + Math.abs(y)) + 40;
    c.fillStyle = color;
    c.beginPath();
    for (let i = 0; i < cuantas; i++) {
      const s = i + Math.floor(tiempo * 10) * 31;
      const a = K.rnd(s) * 6.283, w = 0.004 + K.rnd(s + 2) * 0.016;
      const ini = K.lerp(R * 0.95, R * (0.3 + K.rnd(s + 1) * 0.35), fuerza);
      c.moveTo(x + Math.cos(a) * ini, y + Math.sin(a) * ini);
      c.lineTo(x + Math.cos(a - w) * R, y + Math.sin(a - w) * R);
      c.lineTo(x + Math.cos(a + w) * R, y + Math.sin(a + w) * R);
      c.closePath();
    }
    c.fill();
  };
  // Líneas paralelas de movimiento.
  K.rafagas = (c, st, angulo, fuerza, tiempo, color = 'rgba(255,255,255,.75)', cuantas = 26) => {
    if (fuerza <= 0) return;
    c.save(); c.rotate(angulo); c.fillStyle = color;
    const R = st.hw + 600;
    for (let i = 0; i < cuantas; i++) {
      const s = i + Math.floor(tiempo * 12) * 17;
      const y = (K.rnd(s) - 0.5) * 1500, l = (120 + K.rnd(s + 1) * 700) * fuerza;
      const x = (K.rnd(s + 2) - 0.5) * R * 2;
      c.fillRect(x, y, l, 1.5 + K.rnd(s + 3) * 5);
    }
    c.restore();
  };

  // Onomatopeya con golpe de entrada.
  K.sfx = (c, txt, x, y, tam, rot, k, relleno = '#fff', borde = TINTA, fuente) => {
    if (k <= 0) return;
    const e = K.outBack(K.clamp(k * 1.5));
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(e, e);
    const a = tam * (txt.length * 0.62 + 0.8), al = tam * 1.1;
    K.capa(c, ['sfx', txt, tam, relleno, borde, fuente].join(), [-a, -al, a * 2, al * 2], z => {
      z.font = `${tam}px ${fuente || '"Dela Gothic One", Impact, sans-serif'}`;
      z.textAlign = 'center'; z.textBaseline = 'middle'; z.lineJoin = 'round';
      z.strokeStyle = borde; z.lineWidth = tam * 0.17; z.strokeText(txt, 0, 0);
      z.fillStyle = relleno; z.fillText(txt, 0, 0);
    });
    c.restore();
  };

  // Fotograma de impacto: la imagen se invierte un instante, como en los golpes del anime.
  K.impacto = (c, st, k) => {
    if (k <= 0 || k >= 1) return;
    const fase = Math.floor(k * 4);
    c.save();
    c.globalCompositeOperation = fase % 2 === 0 ? 'difference' : 'source-over';
    c.fillStyle = fase % 2 === 0 ? '#fff' : `rgba(255,255,255,${0.75 * (1 - k)})`;
    c.fillRect(-st.hw - 4, -544, st.hw * 2 + 8, 1088);
    c.restore();
  };
  K.temblor = (c, k, t, f = 16) => {
    if (k <= 0) return;
    const s = Math.floor(t * 24);
    c.translate((K.rnd(s) - 0.5) * f * k, (K.rnd(s + 3) - 0.5) * f * k);
  };

  // Cortinillas: barras diagonales de tinta que cierran y abren cada capítulo.
  K.cortina = (c, st, k, color = TINTA) => {
    if (k <= 0) return;
    const barras = 8, H = 1200;
    c.save(); c.rotate(-0.16); c.fillStyle = color;
    const ancho = st.hw * 2.4 + 300;
    for (let i = 0; i < barras; i++) {
      const v = K.ss(i * 0.06, 0.52 + i * 0.06, k);
      const y = -H / 2 + (H / barras) * i;
      const lado = i % 2 ? 1 : -1;
      const w = ancho * v;
      c.fillRect(lado > 0 ? ancho / 2 - w : -ancho / 2, y, w, H / barras + 2);
    }
    c.restore();
  };

  // Rótulo de capítulo a dos bandas, con golpe de entrada.
  K.rotulo = (c, st, k, num, nombre, color) => {
    if (k <= 0 || k >= 1) return;
    const ent = K.outExpo(K.seg(k, 0, 0.2)), sal = K.ss(0.82, 1, k);
    const anch = st.hw * 2 + 300, vert = st.vertical;
    const yb = vert ? -40 : -30;
    c.save(); c.rotate(-0.06);
    c.fillStyle = TINTA;
    c.fillRect(-anch / 2 + (1 - ent) * -anch - sal * anch, yb - 150, anch, 150);
    c.fillStyle = color;
    c.fillRect(-anch / 2 + (1 - ent) * anch + sal * anch, yb, anch, vert ? 120 : 150);
    const tam = K.clamp(st.hw * 1.5 / Math.max(6, nombre.length) * 1.45, 34, 120);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `${vert ? 36 : 54}px "Dela Gothic One", Impact, sans-serif`;
    c.fillStyle = K.PAPEL;
    c.fillText(num, (1 - ent) * -700 - sal * 800, yb - 75);
    c.font = `${tam}px "Dela Gothic One", Impact, sans-serif`;
    c.fillStyle = TINTA;
    c.fillText(nombre, (1 - ent) * 700 + sal * 800, yb + (vert ? 62 : 77));
    c.restore();
  };

  // Lluvia de cifras al fondo.
  K.cifras = (c, st, t, color, cuantas = 24, vel = 70, tam = 26) => {
    const s = K.pasos(t, 12);
    for (let i = 0; i < cuantas; i++) {
      const z = 0.5 + (i % 3) * 0.4;
      const x = (K.rnd(i) - 0.5) * (st.hw * 2 + 100);
      const y = ((K.rnd(i + 5) * 1200 + s * vel * z + 120000) % 1200) - 600;
      K.txt(c, String(Math.floor(K.rnd(i + 2) * 10)), x, y, tam * z, color);
    }
  };
  K.estrellas = (c, st, t, cuantas = 110, ymax = 200) => {
    const s = K.pasos(t, 6);
    for (let g = 0; g < 3; g++) {
      c.fillStyle = ['rgba(255,250,225,.3)', 'rgba(255,250,225,.6)', 'rgba(255,250,225,.95)'][g];
      c.beginPath();
      for (let i = 0; i < cuantas; i++) {
        const p = 0.5 + 0.5 * Math.sin(s * (1 + K.rnd(i) * 3) + i);
        if (Math.min(2, Math.floor(p * 3)) !== g) continue;
        const x = (K.rnd(i * 3) - 0.5) * (st.hw * 2 + 20), y = -540 + K.rnd(i * 3 + 1) * (ymax + 540), r = 0.8 + K.rnd(i + 8) * 2.4;
        c.rect(x - r / 2, y - r / 2, r, r);
      }
      c.fill();
    }
  };
  // Nube de anime: masa de arcos con sombra plana.
  K.nube = (c, x, y, s, luz, sombra) => {
    const bultos = [[-90, 8, 44], [-44, -16, 60], [18, -26, 72], [76, -6, 52], [122, 12, 34]];
    c.save(); c.translate(x, y); c.scale(s, s);
    K.capa(c, 'nube' + luz + sombra, [-150, -110, 330, 160], z => {
      z.fillStyle = sombra;
      bultos.forEach(b => { z.beginPath(); z.arc(b[0], b[1], b[2], 0, 7); z.fill(); });
      z.fillRect(-124, 8, 268, 28);
      z.fillStyle = luz;
      bultos.forEach(b => { z.beginPath(); z.arc(b[0] - 6, b[1] - 9, b[2] * 0.9, 0, 7); z.fill(); });
    });
    c.restore();
  };
  K.suelo = (c, st, y, color, linea = TINTA, lw = 6) => {
    c.fillStyle = color; c.fillRect(-st.hw - 4, y, st.hw * 2 + 8, 560);
    if (lw) { c.fillStyle = linea; c.fillRect(-st.hw - 4, y - lw / 2, st.hw * 2 + 8, lw); }
  };

  // Cifra con piernas y ojos: los vecinos de Villa Recta.
  K.vecino = (c, x, y, s, ch, color, fase = 0, mira = 1, boca = 0) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    const pa = Math.sin(fase), al = Math.abs(Math.cos(fase)) * 6;
    K.linea(c, [[-22, -56], [-22 - pa * 14, -24], [-24 - pa * 22, 0]], TINTA, 9);
    K.linea(c, [[22, -56], [22 + pa * 14, -24], [24 + pa * 22, 0]], TINTA, 9);
    c.translate(0, -al);
    K.capa(c, 'veci' + ch + color, [-130, -240, 260, 240], z => {
      z.font = '190px "Dela Gothic One", Impact, sans-serif';
      z.textAlign = 'center'; z.textBaseline = 'alphabetic'; z.lineJoin = 'round';
      z.strokeStyle = TINTA; z.lineWidth = 16; z.strokeText(ch, 0, -32);
      z.fillStyle = color; z.fillText(ch, 0, -32);
    });
    // La cifra no se refleja: solo la mirada cambia de lado.
    const m = mira;
    K.disco(c, m * -14, -112, 13, '#fff', 4); K.disco(c, m * 16, -112, 13, '#fff', 4);
    K.disco(c, m * -10, -111, 6, TINTA); K.disco(c, m * 20, -111, 6, TINTA);
    K.linea(c, boca ? [[m * -8, -90], [m * 2, -81], [m * 14, -90]] : [[m * -6, -88], [m * 10, -88]], TINTA, 4);
    c.restore();
  };
})();
