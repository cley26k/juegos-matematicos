'use strict';
// Pantalla de inicio animada, creación de personaje, introducción narrativa y arranque.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const el = VO.el, A = VO.Art;
  const $ = (id) => document.getElementById(id);
  const Ti = (VO.Title = { active: false, t: 0 });

  // ------------------------------------------------------------ PAISAJE DEL TÍTULO
  let layers = null;
  function buildLayers(W, H) {
    const mk = (seed, base, amp, col, top) => { const [c, g] = A.cv(W, H); g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 2) { const y = base + Math.sin(x / (40 + seed * 9) + seed) * amp + Math.sin(x / 13 + seed * 3) * amp * 0.25; g.lineTo(x, Math.round(y)); } g.lineTo(W, H); g.fill(); if (top) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = top; for (let i = 0; i < 300; i++) g.fillRect((VO.hash(i, seed, 1) * W) | 0, (base - amp + VO.hash(i, seed, 2) * amp * 2.4) | 0, 2, 1); } return c; };
    layers = { W, H,
      far: mk(1, H * 0.42, 22, '#7fa8c8', '#9cc0dc'),
      mid: mk(2, H * 0.52, 16, '#4f8a6a', '#64a07a'),
      near: mk(3, H * 0.64, 8, '#3f7a3a', '#55963f'),
      palms: [A.makePalm(1), A.makePalm(2), A.makePalm(3)], trees: [A.makeTree(4, 'flamboyan'), A.makeTree(9, 'mango'), A.makeTree(13, 'ceiba')],
      house: A.building({ w: 6, h: 3, wall: '#7fb8c8', roof: '#9aa4ae', roofType: 'zinc', shutter: '#d86a4a', chimney: true, flowers: true, windows: 2 }),
      house2: A.building({ w: 5, h: 3, wall: '#f2cf3a', roof: '#b5402e', roofType: 'tile', shutter: '#2f8a7a', windows: 1 }) };
  }
  Ti.render = function (dt) {
    const G = VO.G; const g = G.ctx; const W = G.vw, H = G.vh; g.setTransform(VO.Art.RS || 1, 0, 0, VO.Art.RS || 1, 0, 0); g.imageSmoothingEnabled = false;
    Ti.t += dt;
    if (!layers || layers.W !== W || layers.H !== H) buildLayers(W, H);
    const cyc = (Math.sin(Ti.t * 0.05) + 1) / 2; // 0 = día, 1 = atardecer
    const sky = g.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, cyc > 0.6 ? '#3a4a8a' : '#5ab0e8'); sky.addColorStop(0.6, cyc > 0.6 ? '#f08a5a' : '#a8dcf4'); sky.addColorStop(1, cyc > 0.6 ? '#f8c878' : '#e8f4d8');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // sol
    const sy = H * 0.18 + cyc * H * 0.22; g.fillStyle = cyc > 0.6 ? '#ffb060' : '#fff2b0'; g.beginPath(); g.arc(W * 0.78, sy, 14, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,240,180,0.25)'; g.beginPath(); g.arc(W * 0.78, sy, 24, 0, 6.3); g.fill();
    // nubes
    for (let i = 0; i < 5; i++) { const x = ((i * 97 + Ti.t * (4 + i)) % (W + 80)) - 40, y = 20 + i * 13; g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x, y, 34, 6); g.fillRect(x + 6, y - 4, 20, 4); g.fillRect(x + 4, y + 6, 26, 2); }
    g.drawImage(layers.far, 0, 0); g.drawImage(layers.mid, 0, 0);
    // río
    const ry = H * 0.66; g.fillStyle = '#3a97cf'; g.fillRect(0, ry, W, 10); for (let x = 0; x < W; x += 9) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect((x + Ti.t * 12) % W, ry + 3 + (x % 3), 4, 1); }
    g.drawImage(layers.near, 0, 8);
    g.fillStyle = '#5fae3c'; g.fillRect(0, H * 0.72, W, H); for (let i = 0; i < 200; i++) { g.fillStyle = i % 2 ? '#6fbf46' : '#4f9a33'; g.fillRect((VO.hash(i, 1, 9) * W) | 0, (H * 0.72 + VO.hash(i, 2, 9) * H * 0.3) | 0, 1, 2); }
    g.fillStyle = '#c79a5e'; g.fillRect(W * 0.45, H * 0.72, 18, H);
    g.drawImage(layers.house.canvas, W * 0.18, H * 0.72 - layers.house.canvas.height + 6);
    g.drawImage(layers.house2.canvas, W * 0.6, H * 0.72 - layers.house2.canvas.height + 4);
    const sway = Math.sin(Ti.t) * 1;
    g.drawImage(layers.palms[0], W * 0.04 + sway, H * 0.72 - 46); g.drawImage(layers.trees[0], W * 0.82, H * 0.72 - 44); g.drawImage(layers.palms[1], W * 0.9 + sway, H * 0.74 - 46); g.drawImage(layers.trees[1], W * 0.4, H * 0.75 - 40);
    // personajes caminando
    const look = VO.NPCS.lucia.look; const sh = A.charSheet(look); const fx = ((Ti.t * 22) % (W + 40)) - 20; g.drawImage(sh, (Math.floor(Ti.t * 6) % 2 + 1) * 16, 72, 16, 36, fx, H * 0.84 - 12, 16, 36);
    const sh2 = A.charSheet(VO.NPCS.mateo.look); g.drawImage(sh2, 0, 0, 16, 36, W * 0.5, H * 0.8 - 12, 16, 36);
    if (cyc > 0.7) { g.fillStyle = 'rgba(40,20,60,' + (cyc - 0.7) + ')'; g.fillRect(0, 0, W, H); }
  };
  Ti.start = function () { Ti.active = true; $('title').classList.remove('hidden'); VO.Audio.play('title'); };
  Ti.stop = function () { Ti.active = false; $('title').classList.add('hidden'); };

  // ------------------------------------------------------------ MENÚ PRINCIPAL
  function titleMenu() {
    const box = $('titleMenu'); box.innerHTML = '';
    const hasSave = [1, 2, 3].some((i) => localStorage.getItem('valle_slot_' + i));
    box.append(...[
      el('button', { class: 'btn big', onclick: () => { VO.Audio.unlock(); createCharacter('historia'); } }, 'Nueva partida · Modo historia'),
      el('button', { class: 'btn big', onclick: () => { VO.Audio.unlock(); createCharacter('aula'); } }, 'Modo aula (35–45 min)'),
      hasSave ? el('button', { class: 'btn big', onclick: () => { VO.Audio.unlock(); VO.UI.openSaves(); } }, 'Cargar partida') : null,
      el('button', { class: 'btn big', onclick: () => VO.UI.openSettings() }, 'Configuración'),
      el('button', { class: 'btn big', onclick: () => VO.Analytics.openTeacher() }, 'Panel docente'),
      el('button', { class: 'btn big', onclick: () => credits() }, 'Acerca del juego')].filter(Boolean));
  }
  function credits() {
    VO.UI.open('Acerca del juego', el('div', {}, el('p', {}, 'Valle de las Oportunidades es un videojuego educativo para 3.º de secundaria sobre inecuaciones lineales, sistemas de inecuaciones, intervalos e interés simple.'), el('p', {}, 'Todo el arte, la música y los efectos de sonido se generan por código de forma original. La moneda es ficticia: no hay compras reales ni apuestas.'), el('p', { class: 'muted small' }, 'Los registros de aprendizaje se guardan solo en este navegador, con identificadores anónimos.')), { paper: true });
  }

  // ------------------------------------------------------------ CREACIÓN DE PERSONAJE
  const OPTS = {
    skin: ['#f3c9a0', '#e0a878', '#c68c5a', '#9a6040', '#6a4028'],
    hair: ['#1a1010', '#4a2a14', '#8a4a1a', '#d8a050', '#c0392b'],
    style: [['short', 'Corto'], ['long', 'Largo'], ['pony', 'Cola'], ['curly', 'Rizado'], ['bald', 'Rapado']],
    shirt: ['#d8553a', '#2f8ac0', '#3f9a4a', '#e8b42a', '#8a4ab0', '#f4efe4'],
    pants: ['#3a4a7a', '#4a3a2a', '#5a6a3a', '#2a2a2a'],
    hat: [['none', 'Ninguno'], ['straw', 'Sombrero de paja'], ['cap', 'Gorra'], ['band', 'Pañuelo']],
  };
  function createCharacter(mode) {
    const look = { skin: OPTS.skin[2], hair: OPTS.hair[0], style: 'curly', shirt: OPTS.shirt[0], pants: OPTS.pants[0], hat: 'straw', hatC: '#e8c55a' };
    const name = el('input', { type: 'text', maxlength: 14, class: 'qty wide', placeholder: 'Nombre del personaje (opcional)', 'aria-label': 'Nombre del personaje' });
    const claseIn = VO.DB && VO.DB.configured() ? el('input', { type: 'text', maxlength: 12, class: 'qty', placeholder: 'Ej.: MATE3B', value: VO.DB.cfg().clase, 'aria-label': 'Código de clase' }) : null;
    const cv = el('canvas', { width: 96, height: 96, class: 'preview-char' });
    const pt = el('canvas', { width: 48, height: 48, class: 'portrait' });
    let dir = 0, fr = 0;
    const draw = () => { const g = cv.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 48, 48); g.drawImage(A.charSheet(clean(look)), fr * 16, dir * 36, 16, 36, 16, 6, 16, 36); const p = pt.getContext('2d'); p.clearRect(0, 0, 48, 48); p.drawImage(A.portrait(clean(look), 'happy'), 0, 0); };
    const iv = setInterval(() => { fr = (fr + 1) % 3; if (fr === 0) dir = (dir + 1) % 4; draw(); }, 260);
    const clean = (L) => Object.assign({}, L, { hat: L.hat === 'none' ? undefined : L.hat });
    const swatches = (key, list) => el('div', { class: 'row wrap' }, list.map((c) => { const b = el('button', { class: 'swatchbtn' + (look[key] === c ? ' on' : ''), style: 'background:' + c, 'aria-label': key + ' ' + c, onclick: () => { look[key] = c; b.parentNode.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); draw(); } }); return b; }));
    const choices = (key, list) => el('div', { class: 'row wrap' }, list.map(([v, t]) => { const b = el('button', { class: 'btn sm' + (look[key] === v ? ' on' : ''), onclick: () => { look[key] = v; b.parentNode.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); draw(); } }, t); return b; }));
    const body = el('div', { class: 'charcreate' },
      el('div', { class: 'charprev' }, cv, pt),
      el('div', { class: 'charopts' }, name, claseIn ? el('label', { class: 'set' }, 'Código de clase (te lo da tu docente)', claseIn) : null,
        el('h4', {}, 'Piel'), swatches('skin', OPTS.skin), el('h4', {}, 'Cabello'), choices('style', OPTS.style), swatches('hair', OPTS.hair),
        el('h4', {}, 'Camisa'), swatches('shirt', OPTS.shirt), el('h4', {}, 'Pantalón'), swatches('pants', OPTS.pants), el('h4', {}, 'Cabeza'), choices('hat', OPTS.hat),
        el('p', { class: 'small muted' }, 'El nombre solo se usa dentro del juego y no se incluye en los registros del docente.'),
        el('div', { class: 'row end' }, el('button', { class: 'btn ok big', onclick: () => { if (claseIn) VO.DB.setLocal({ clase: claseIn.value.trim().toUpperCase() }); clearInterval(iv); VO.UI.close(); begin(mode, name.value.trim() || 'Peña', clean(look)); } }, mode === 'aula' ? 'Empezar la clase' : 'Comenzar la historia'))));
    VO.UI.open(mode === 'aula' ? 'Modo aula · Tu personaje' : 'Crea tu personaje', body, { wide: true, onClose: () => clearInterval(iv) });
    draw();
  }

  // ------------------------------------------------------------ INTRODUCCIÓN
  const INTRO = [
    { t: 'Una carta llega a tu puerta: “Tu abuela Ana te dejó la finca de la familia en el Valle de las Oportunidades.”', scene: 'letter' },
    { t: 'El valle fue alegre: tenía mercado, feria y el famoso taller de los Peña. Pero con los años muchas familias se fueron y la economía se apagó.', scene: 'valley' },
    { t: 'La casa está deteriorada, la tierra sin cultivar y tienes poco dinero. Los vecinos, eso sí, te reciben con los brazos abiertos.', scene: 'house' },
    { t: 'Trabaja, cultiva, pesca, fabrica y comercia. Haz bien tus cuentas: cada decisión cuenta para devolverle la vida al valle.', scene: 'go' },
  ];
  function begin(mode, name, look) {
    const cfg = mode === 'aula' ? VO.Analytics.teacherConfig() : null;
    const state = VO.G.newState({ mode, name, look, cfg: cfg ? { money: cfg.money, minutes: cfg.minutes, missions: cfg.missions, hints: cfg.hints, items: cfg.items, difficulty: cfg.difficulty } : null });
    if (mode === 'aula') { Ti.stop(); VO.G.start(state); VO.UI.dialog('andres', ['¡Bienvenida, bienvenido al Valle! Hoy tenemos una sesión especial de planificación.', 'Ya tienes materiales y algo de dinero. Busca a los vecinos con el signo ! sobre la cabeza: cada uno tiene un trato que necesita buenas cuentas.', 'Tu libreta (tecla N) te ayudará a anotar las condiciones. ¡Mucho éxito!'], null, () => VO.UI.refreshHUD()); return; }
    let i = 0;
    const cv = el('canvas', { width: 320, height: 150, class: 'introcv' });
    const txt = el('p', { class: 'introtxt' });
    const next = el('button', { class: 'btn ok big' }, 'Siguiente');
    const show = () => { txt.textContent = INTRO[i].t; drawIntro(cv, INTRO[i].scene); next.textContent = i === INTRO.length - 1 ? '¡Al valle!' : 'Siguiente'; };
    next.onclick = () => { i++; if (i >= INTRO.length) { VO.UI.close(); Ti.stop(); VO.G.start(state); setTimeout(() => VO.UI.dialog('andres', ['¡Ah, ya despertaste! Soy Andrés, el alcalde. ¡Bienvenido a tu finca!', 'Tu casa necesita un techo nuevo. Tomás, el carpintero, puede repararlo si le llevas madera y piedra.', 'Para empezar, consigue madera en el bosque con tu hacha y véndesela a Clara en el mercado. Sal de la casa por la puerta de abajo.', 'Controles: WASD o flechas para moverte, Espacio para usar herramientas, E para hablar. Teclas 1–0 para elegir herramienta.'], null), 600); return; } show(); };
    VO.UI.open('Valle de las Oportunidades', el('div', { class: 'intro' }, cv, txt, el('div', { class: 'row end' }, el('button', { class: 'btn', onclick: () => { i = INTRO.length - 1; next.onclick(); } }, 'Saltar'), next)), { paper: true, noClose: true });
    show();
  }
  function drawIntro(cv, scene) {
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; const W = cv.width, H = cv.height;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, scene === 'valley' ? '#f08a5a' : '#5ab0e8'); sky.addColorStop(1, '#f8e0b0'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = '#5a8a6a'; g.beginPath(); g.moveTo(0, H * 0.6); for (let x = 0; x <= W; x += 4) g.lineTo(x, H * 0.5 + Math.sin(x / 30) * 12); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.fillStyle = '#5fae3c'; g.fillRect(0, H * 0.75, W, H);
    if (scene === 'letter') { g.fillStyle = '#f1e3c0'; g.fillRect(W / 2 - 50, 30, 100, 70); g.fillStyle = '#c2453a'; g.fillRect(W / 2 - 6, 60, 12, 12); g.strokeStyle = '#8a6a4a'; g.beginPath(); g.moveTo(W / 2 - 50, 30); g.lineTo(W / 2, 66); g.lineTo(W / 2 + 50, 30); g.stroke(); }
    if (scene === 'valley') { const b = A.building({ w: 6, h: 3, wall: '#d8a36a', roof: '#a8362c', roofType: 'tile', windows: 1, sign: 'workbench', broken: true }); g.drawImage(b.canvas, 40, H * 0.75 - b.canvas.height + 4); g.drawImage(A.makeTree(4, 'flamboyan'), 200, H * 0.75 - 44); g.drawImage(A.prop('fountain'), 140, H * 0.75 - 30); }
    if (scene === 'house') { const b = A.building({ w: 7, h: 4, wall: '#7fb8c8', roof: '#9aa4ae', roofType: 'zinc', broken: true, chimney: true }); g.drawImage(b.canvas, 100, H * 0.78 - b.canvas.height + 2); for (let i = 0; i < 6; i++) g.drawImage(A.makeWeed(i), 20 + i * 45, H * 0.8); }
    if (scene === 'go') { const sh = A.charSheet(VO.G.state ? VO.G.state.look : VO.NPCS.lucia.look); g.drawImage(A.makePalm(2), 20, H * 0.75 - 46); ['andres', 'clara', 'mateo', 'lucia'].forEach((n, i) => g.drawImage(A.charSheet(VO.NPCS[n].look), 0, 0, 16, 36, 150 + i * 28, H * 0.75 - 18, 16, 36)); }
  }

  // ------------------------------------------------------------ ARRANQUE
  window.addEventListener('load', () => {
    const G = VO.G;
    // configuración de la clase en línea (la que envió el docente)
    if (VO.DB && VO.DB.enabled()) VO.DB.classInfo(VO.DB.cfg().clase).then((info) => { if (info && info.config) localStorage.setItem('valle_teacher_remote', JSON.stringify(info.config)); VO.DB.status = { ok: true, msg: 'Conectado', last: Date.now() }; }).catch(() => {});
    G.canvas = $('game');
    VO.Settings.apply();
    G.resize();
    VO.Input.init(G.canvas);
    Ti.createCharacter = createCharacter; Ti.credits = credits;
    (Ti.menu || titleMenu)();
    Ti.start();
    G.last = performance.now(); G.loopOn = true; requestAnimationFrame(G.loop);
    document.addEventListener('visibilitychange', () => { if (document.hidden && G.running && !VO.UI.anyOpen()) VO.UI.openMenu(); });
  });
})();
