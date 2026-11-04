// Conecta el scroll con el canvas: decide qué escena se dibuja, los textos y los clips de cada capítulo.
(function () {
  const raiz = document.documentElement;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caps = [...document.querySelectorAll('.cap')];
  const carril = [...document.querySelectorAll('.carril a')];
  const barra = document.querySelector('.carril-barra');
  const COLORES_CORTINA = { 'pizza-fraccionaria': '#ff3d2e', 'coco-conjuntos': '#14121f', 'laberinto-radian': '#7fe8ff', 'puente-de-cristal': '#14121f', mathrally: '#ff8fd3', 'sudoku-academy': '#fff6e3', residuo: '#14121f', 'portero-algebraico': '#ff3db4', 'algebra-engine': '#58ffb8', final: '#fff6e3' };

  // Reloj y dibujo de un fotograma. u es el avance del capítulo; tiempo, los segundos transcurridos.
  function pintar(c, W, H, id, u, tiempo, tiempoAbs) {
    const esc = H / 1080;
    const st = { hw: W / esc / 2, vertical: W / H < 0.85, t: tiempo, p: K.pasos(tiempo, 12), tiempoAbs };
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(esc, esc); c.translate(st.hw, 540);
    K.boil(Math.floor(tiempo * 7), 1.1);
    c.save();
    K.ESCENAS[id](c, u, st);
    c.restore();
    if (id !== 'prologo') K.cortina(c, st, 1 - K.seg(u, 0, 0.022) * 1, COLORES_CORTINA[id]);
    if (id !== 'final') K.cortina(c, st, K.seg(u, 0.975, 1), COLORES_CORTINA[caps[caps.findIndex(s => s.dataset.id === id) + 1]?.dataset.id] || K.TINTA);
    // Grano de papel y viñeteado, comunes a toda la historia
    const g = c.createRadialGradient(0, 0, 340, 0, 0, Math.max(st.hw, 540) * 1.4);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.34)');
    c.fillStyle = g; c.fillRect(-st.hw - 4, -544, st.hw * 2 + 8, 1088);
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

  // Scroll suave en rueda; en táctil se respeta el gesto nativo.
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  let esc = Math.min(devicePixelRatio || 1, innerWidth < 800 ? 1.5 : 1.75);
  let W = 0, H = 0;
  function medir() {
    W = innerWidth; H = innerHeight;
    lienzo.width = Math.round(W * esc); lienzo.height = Math.round(H * esc);
    caps.forEach(s => { const r = s.getBoundingClientRect(); s._top = r.top + scrollY; s._h = r.height - H; });
    ScrollTrigger.refresh();
  }

  // Cada texto entra letra a letra, con pasos, y se va al cambiar de tramo.
  const textos = [];
  caps.forEach(s => {
    s._textos = [...s.querySelectorAll('.txt')].map(el => {
      const split = new SplitText(el.querySelector('span'), { type: 'words,chars', aria: 'auto' });
      const tl = gsap.timeline({ paused: true })
        .fromTo(el, { autoAlpha: 0, scale: 0.9, rotate: -1.5 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.22, ease: 'back.out(2.4)' })
        .from(split.chars, { yPercent: 70, opacity: 0, duration: 0.1, stagger: 0.005, ease: 'steps(3)' }, 0.05);
      const o = { el, de: +el.dataset.de, a: +el.dataset.a, tl, on: false };
      textos.push(o);
      return o;
    });
    s._portal = s.querySelector('.portal');
    s._video = s.querySelector('.portal video');
  });

  const FOCO = K.FOCO;
  let activo = null, vistoAct = -1, medias = [], ultimoT = performance.now(), yPrevio = window.scrollY;
  K.Sonido.iniciar();
  const t0 = performance.now();

  function capituloEn(y) {
    let a = caps[0];
    for (const s of caps) if (y >= s._top - 1) a = s;
    return a;
  }
  function fotograma() {
    const ahora = performance.now();
    const dt = ahora - ultimoT; ultimoT = ahora;
    const y = window.scrollY;
    raiz.classList.toggle('ya-bajo', y > 40);
    const s = capituloEn(y);
    const u = K.clamp((y - s._top) / s._h);
    K.Sonido.avance(s.dataset.id, u, K.clamp(Math.abs(y - yPrevio) / Math.max(1, dt) / 6));
    yPrevio = y;
    const fin = caps[caps.length - 1];
    const tapado = y > fin._top + fin._h + H * 0.98;
    raiz.classList.toggle('sin-lienzo', tapado);
    if (tapado) { if (activo) parar(activo); K.Sonido.silenciar(); return; }

    pintar(c, lienzo.width, lienzo.height, s.dataset.id, u, (ahora - t0) / 1000, (ahora - t0) / 1000);

    // Ajuste de resolución si el equipo no llega a mantener el ritmo
    if (dt < 200) medias.push(dt); // una pestaña en segundo plano no cuenta como lentitud
    if (medias.length > 45) {
      const m = medias.reduce((a, b) => a + b) / medias.length; medias = [];
      if (m > 30 && esc > 0.85) { esc = Math.max(0.85, esc - 0.25); medir(); }
    }

    if (activo !== s) {
      if (activo) { activo._textos.forEach(o => { if (o.on) { o.on = false; o.tl.reverse(); } }); parar(activo); activo.classList.remove('activo'); }
      activo = s; s.classList.add('activo');
    }
    s._textos.forEach(o => {
      const v = u >= o.de && u < o.a;
      if (v !== o.on) { o.on = v; v ? o.tl.timeScale(1).play() : o.tl.timeScale(2.6).reverse(); }
    });
    if (s._portal) {
      const v = u > FOCO[0] + 0.035 && u < FOCO[3] - 0.012;
      if (v !== s._vis) {
        s._vis = v; s._portal.classList.toggle('visible', v);
        if (s._video) { if (v) { s._video.preload = 'auto'; s._video.play().catch(() => {}); } else s._video.pause(); }
      }
    }
    const idx = caps.indexOf(s);
    if (idx !== vistoAct) {
      vistoAct = idx;
      carril.forEach((a, i) => { a.classList.toggle('actual', i === idx); if (i === idx) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    }
    barra.style.transform = `scaleY(${K.clamp((idx + u) / caps.length)})`;
  }
  function parar(s) { if (s._vis) { s._vis = false; s._portal?.classList.remove('visible'); s._video?.pause(); } }

  addEventListener('resize', () => { medir(); }, { passive: true });
  document.fonts.load('60px "Dela Gothic One"').finally(() => {
    medir();
    gsap.ticker.add(fotograma);
    raiz.classList.add('listo');
  });

  // Navegación por capítulos
  carril.forEach((a, i) => a.addEventListener('click', e => {
    e.preventDefault();
    const s = caps[i];
    const destino = s._top + s._h * (i === 0 ? 0 : 0.03);
    if (Math.abs(scrollY - destino) > innerHeight * 6) lenis.scrollTo(destino, { immediate: true, force: true }); else lenis.scrollTo(destino, { duration: 1.4 });
  }));
  document.querySelectorAll('a[href="#archivo"], .ver-ficha, .indice a').forEach(a => a.addEventListener('click', e => {
    const d = document.querySelector(a.getAttribute('href'));
    if (!d) return;
    e.preventDefault(); let arriba = 0; for (let n = d; n; n = n.offsetParent) arriba += n.offsetTop; // offsetTop ignora el desplazamiento de la animación de entrada
    lenis.scrollTo(arriba - (d.id === 'archivo' ? 0 : 24), { immediate: true, force: true });
    history.pushState(null, '', a.getAttribute('href'));
  }));

  // Entrada de las fichas del archivo
  gsap.utils.toArray('.ficha').forEach(el => {
    gsap.from(el, { y: 70, rotate: el.dataset.giro || 0, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.5)', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // Los clips del archivo se reproducen solos al verse y se pausan al salir.
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { threshold: 0.6 });
  document.querySelectorAll('.archivo video').forEach(v => io.observe(v));

  // Depuración de las grabaciones y pruebas.
  window.__historia = { lenis, caps, irA(id, u) { const s = caps.find(x => x.dataset.id === id); lenis.scrollTo(s._top + s._h * u, { immediate: true, force: true }); } };
})();
