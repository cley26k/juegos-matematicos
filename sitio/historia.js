// Conecta el scroll con el canvas: decide qué escena se dibuja, los textos y los clips de cada capítulo.
// La historia sigue al scroll con un límite de velocidad y espera a que dé tiempo a leer cada texto.
(function () {
  const raiz = document.documentElement;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caps = [...document.querySelectorAll('.cap')];
  const carril = [...document.querySelectorAll('.carril a')];
  const barra = document.querySelector('.carril-barra');
  const COLORES_CORTINA = { 'pizza-fraccionaria': '#ff3d2e', 'coco-conjuntos': '#14121f', 'laberinto-radian': '#7fe8ff', 'puente-de-cristal': '#14121f', mathrally: '#ff8fd3', 'sudoku-academy': '#fff6e3', residuo: '#14121f', 'portero-algebraico': '#ff3db4', 'algebra-engine': '#58ffb8', final: '#fff6e3' };

  // Dibuja un fotograma. u es el avance del capítulo; tiempo, los segundos transcurridos.
  let ultimoId = null;
  function pintar(c, W, H, id, u, tiempo, tiempoAbs) {
    const esc = H / 1080;
    if (id !== ultimoId) { K.limpiarCapas(); ultimoId = id; }
    K.escPx = esc;
    const st = { hw: W / esc / 2, vertical: W / H < 0.85, t: tiempo, p: K.pasos(tiempo, 12), tiempoAbs };
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(esc, esc); c.translate(st.hw, 540);
    K.boil(Math.floor(tiempo * 7), 1.1);
    c.save();
    K.ESCENAS[id](c, u, st);
    c.restore();
    if (id !== 'prologo') K.cortina(c, st, 1 - K.seg(u, 0, 0.022), COLORES_CORTINA[id]);
    if (id !== 'final') K.cortina(c, st, K.seg(u, 0.975, 1), COLORES_CORTINA[caps[caps.findIndex(s => s.dataset.id === id) + 1]?.dataset.id] || K.TINTA);
    // Viñeteado común a toda la historia
    K.plano(c, st, 'vineteado', z => {
      const g = z.createRadialGradient(0, 0, 340, 0, 0, Math.max(st.hw, 540) * 1.4);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.34)');
      z.fillStyle = g; z.fillRect(-st.hw - 4, -544, st.hw * 2 + 8, 1088);
    });
  }
  K.pintar = pintar;

  // Con movimiento reducido o en modo estático: una viñeta fija por capítulo.
  function modoQuieto() {
    caps.forEach(s => {
      const cv = document.createElement('canvas');
      cv.className = 'vineta-fija'; cv.setAttribute('aria-hidden', 'true');
      const w = Math.min(960, s.clientWidth), h = Math.round(w * 0.5625);
      cv.width = w; cv.height = h;
      s.querySelector('.cap-pegado').prepend(cv);
      const v = s.querySelector('video'); if (v) v.controls = true;
      document.fonts.ready.then(() => pintar(cv.getContext('2d'), w, h, s.dataset.id, +s.dataset.fija || 0.5, 2, 9));
    });
  }

  if (quieto) { document.fonts.load('40px "Dela Gothic One"').finally(modoQuieto); return; }
  raiz.classList.add('cine');

  const lienzo = document.getElementById('lienzo');
  const c = lienzo.getContext('2d', { alpha: false });
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Scroll suave en rueda, un poco más lento; en táctil se respeta el gesto nativo.
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.8 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Resolución: se limita el total de píxeles, que es lo que más pesa, y baja sola si el equipo no llega.
  const PIXELES = innerWidth < 800 ? 1e6 : 1.7e6;
  const DPR = Math.min(devicePixelRatio || 1, 1.5);
  let reduccion = 1, W = 0, H = 0;
  function medirLienzo() {
    W = lienzo.clientWidth || innerWidth; H = lienzo.clientHeight || innerHeight;
    const esc = Math.min(DPR, Math.sqrt(PIXELES / (W * H))) * reduccion;
    lienzo.width = Math.round(W * esc); lienzo.height = Math.round(H * esc);
    K.limpiarCapas();
  }
  let finHistoria = Infinity, anchoPrevio = 0, altoPrevio = 0;
  function medirSecciones() {
    caps.forEach(s => { const r = s.getBoundingClientRect(); s._top = r.top + scrollY; s._h = r.height - innerHeight; });
    finHistoria = document.getElementById('archivo').getBoundingClientRect().top + scrollY;
  }
  function medir() {
    // En móvil la barra del navegador cambia la altura al bajar: eso no debe rehacer el lienzo.
    if (innerWidth !== anchoPrevio || Math.abs(innerHeight - altoPrevio) > 140) { medirLienzo(); anchoPrevio = innerWidth; altoPrevio = innerHeight; }
    medirSecciones();
    ScrollTrigger.refresh();
  }

  // Cada texto entra palabra a palabra y se queda el tiempo que cuesta leerlo.
  caps.forEach(s => {
    s._textos = [...s.querySelectorAll('.txt')].map(el => {
      const span = el.querySelector('span');
      const palabras = span.textContent.trim().split(/\s+/).length;
      const split = new SplitText(span, { type: 'words', aria: 'auto' });
      const tl = gsap.timeline({ paused: true })
        .fromTo(el, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2.2)' })
        .from(split.words, { yPercent: 45, opacity: 0, duration: 0.16, stagger: 0.035, ease: 'power2.out' }, 0.04);
      return { el, de: +el.dataset.de, a: +el.dataset.a, tl, on: false, desde: 0, minimo: 900 + palabras * 270 };
    });
    s._portal = s.querySelector('.portal');
    s._video = s.querySelector('.portal video');
  });

  const FOCO = K.FOCO;
  let activo = null, vistoAct = -1, tiemposDt = [], ultimoT = performance.now(), ultimoDibujo = 0, yVista = window.scrollY;
  const t0 = performance.now();
  K.Sonido.iniciar();

  const capituloEn = y => { let a = caps[0]; for (const s of caps) if (y >= s._top - 1) a = s; return a; };
  function ponerClase(n, v) { if (raiz.classList.contains(n) !== v) raiz.classList.toggle(n, v); }
  function parar(s) { if (s._vis) { s._vis = false; s._portal?.classList.remove('visible'); s._video?.pause(); } }

  function fotograma() {
    const ahora = performance.now();
    const dt = Math.min(100, ahora - ultimoT); ultimoT = ahora;
    const yReal = window.scrollY;
    ponerClase('ya-bajo', yReal > 40);

    const tapado = yReal >= finHistoria - innerHeight * 0.02;
    ponerClase('sin-lienzo', tapado);
    if (tapado) {
      // El archivo cubre la pantalla: nada que dibujar ni que sonar.
      const fin = caps[caps.length - 1];
      yVista = Math.min(yReal, fin._top + fin._h);
      if (activo) parar(activo);
      K.Sonido.silenciar();
      return;
    }

    // La historia persigue al scroll sin pasarse de velocidad, y más deprisa cuanto más lejos queda.
    const hueco = yReal - yVista, dist = Math.abs(hueco);
    let mov = 0;
    if (dist > innerHeight * 7) { yVista = yReal; mov = dist; }
    else if (dist > 0.5) {
      mov = Math.min(dist, ((innerHeight * 0.26 + dist * 0.55) * dt) / 1000);
      let destino = yVista + Math.sign(hueco) * mov;
      // Al avanzar a ritmo normal, un texto no se va hasta que dé tiempo a leerlo.
      if (hueco > 0 && dist < innerHeight * 3 && activo) {
        for (const o of activo._textos) {
          if (o.on && ahora - o.desde < o.minimo) destino = Math.min(destino, activo._top + activo._h * o.a - 1);
        }
        destino = Math.max(yVista, destino);
      }
      mov = Math.abs(destino - yVista);
      yVista = destino;
    }

    const s = capituloEn(yVista);
    const u = K.clamp((yVista - s._top) / s._h);
    K.Sonido.avance(s.dataset.id, u, K.clamp((mov / Math.max(1, dt)) / (innerHeight / 1000) / 1.2));

    if (activo !== s) {
      if (activo) { activo._textos.forEach(o => { if (o.on) { o.on = false; o.tl.reverse(); } }); parar(activo); activo.classList.remove('activo'); }
      activo = s; s.classList.add('activo');
    }
    s._textos.forEach(o => {
      const v = u >= o.de && u < o.a;
      if (v !== o.on) {
        o.on = v;
        if (v) { o.desde = ahora; o.tl.timeScale(1).play(); } else o.tl.timeScale(2.6).reverse();
      }
    });
    if (s._portal) {
      const v = u > FOCO[0] + 0.035 && u < FOCO[3] - 0.012;
      if (v !== !!s._vis) {
        s._vis = v; s._portal.classList.toggle('visible', v);
        if (s._video) { if (v) { s._video.preload = 'auto'; s._video.play().catch(() => {}); } else s._video.pause(); }
      }
    }
    const idx = caps.indexOf(s);
    if (idx !== vistoAct) {
      vistoAct = idx;
      carril.forEach((a, i) => { a.classList.toggle('actual', i === idx); if (i === idx) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    }

    // Como en la animación limitada: 30 dibujos por segundo en movimiento y 12 en reposo.
    const intervalo = mov > 0.05 ? 32 : 82;
    if (ahora - ultimoDibujo < intervalo) return;
    const real = ahora - ultimoDibujo; ultimoDibujo = ahora;
    pintar(c, lienzo.width, lienzo.height, s.dataset.id, u, (ahora - t0) / 1000, (ahora - t0) / 1000);
    barra.style.transform = `scaleY(${K.clamp((idx + u) / caps.length)})`;

    // Si ni así llega, baja la resolución poco a poco.
    if (mov > 0.05 && real < 400) {
      tiemposDt.push(real);
      if (tiemposDt.length >= 30) {
        const m = tiemposDt.reduce((a, b) => a + b) / tiemposDt.length; tiemposDt = [];
        if (m > 55 && reduccion > 0.55) { reduccion *= 0.8; medirLienzo(); }
      }
    }
  }

  addEventListener('resize', medir, { passive: true });
  document.fonts.load('60px "Dela Gothic One"').finally(() => {
    medir();
    yVista = window.scrollY;
    gsap.ticker.add(fotograma);
    raiz.classList.add('listo');
  });

  // Navegación por capítulos: salta al instante, sin recorrer todo lo de en medio.
  function irA(y) { lenis.scrollTo(y, { immediate: true, force: true }); yVista = y; }
  carril.forEach((a, i) => a.addEventListener('click', e => {
    e.preventDefault();
    const s = caps[i];
    irA(s._top + s._h * (i === 0 ? 0 : 0.03));
  }));
  document.querySelectorAll('a[href="#archivo"], .ver-ficha, .indice a').forEach(a => a.addEventListener('click', e => {
    const d = document.querySelector(a.getAttribute('href'));
    if (!d) return;
    e.preventDefault();
    let arriba = 0; for (let n = d; n; n = n.offsetParent) arriba += n.offsetTop; // offsetTop ignora el desplazamiento de la animación de entrada
    lenis.scrollTo(arriba - (d.id === 'archivo' ? 0 : 24), { immediate: true, force: true });
    history.pushState(null, '', a.getAttribute('href'));
  }));

  // Entrada de las fichas del archivo
  gsap.utils.toArray('.ficha').forEach(el => {
    gsap.from(el, { y: 70, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.5)', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // Los clips del archivo se reproducen solos al verse y se pausan al salir.
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { threshold: 0.6 });
  document.querySelectorAll('.archivo video').forEach(v => io.observe(v));

  // Para las pruebas automáticas.
  window.__historia = { lenis, caps, irA(id, u) { const s = caps.find(x => x.dataset.id === id); irA(s._top + s._h * u); }, get yVista() { return yVista; }, get reduccion() { return reduccion; } };
})();
