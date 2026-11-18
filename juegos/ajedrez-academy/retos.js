/* Ajedrez Academy · Retos: «Memoria relámpago» y «Clasificación» (semanal y global).
   Se dibujan dentro de la app (#memoria, #clasificacion) con su React, piezas, personajes y estado (window.AA_UI). */
(function () {
  'use strict';
  var PAGES = window.AA_PAGES = window.AA_PAGES || {};
  var LS_MEMO = 'chess-academy/memoria';
  function rd(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function semana(d) { // semana ISO, p. ej. «2026-W47»
    d = d ? new Date(d) : new Date(); d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
    var y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return d.getUTCFullYear() + '-W' + String(Math.ceil(((d - y0) / 864e5 + 1) / 7)).padStart(2, '0');
  }
  function finSemana() { var d = new Date(), day = d.getDay() || 7; var f = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (8 - day)); return Math.max(1, Math.ceil((f - d) / 864e5)); }
  var reduce = function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };
  function fmt(s) { return s.toFixed(1).replace('.', ','); }

  /* Confeti: lluvia de papelitos en un canvas sobre el elemento indicado */
  function confetti(el, n) {
    if (!el || reduce()) return;
    var c = document.createElement('canvas'), r = el.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    c.className = 'aa-confetti'; c.width = r.width * dpr; c.height = r.height * dpr; el.appendChild(c);
    var x = c.getContext('2d'); x.scale(dpr, dpr);
    var cols = ['#ffc83d', '#2fb344', '#1cb0f6', '#ff9600', '#a560e8', '#ff5e7a'], P = [];
    for (var i = 0; i < (n || 140); i++) P.push({ x: r.width / 2 + (Math.random() - .5) * r.width * .3, y: r.height * .35, vx: (Math.random() - .5) * 9, vy: -Math.random() * 9 - 3,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: cols[i % cols.length] });
    var t0 = performance.now();
    (function step(t) { var k = (t - t0) / 1000; x.clearRect(0, 0, r.width, r.height);
      P.forEach(function (p) { p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        x.save(); x.globalAlpha = Math.max(0, 1 - k / 3); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore(); });
      if (k < 3) requestAnimationFrame(step); else c.remove(); })(t0);
  }

  /* ─────────────── Memoria relámpago ─────────────── */
  var FILES = 'abcdefgh';
  function parsePlace(place) { var m = {}, r = 7, f = 0;
    for (var i = 0; i < place.length; i++) { var c = place[i];
      if (c === '/') { r--; f = 0; } else if (/\d/.test(c)) f += +c;
      else { m[FILES[f] + (r + 1)] = (c === c.toUpperCase() ? 'w' : 'b') + c.toLowerCase(); f++; } }
    return m; }
  function pickPos(n, used) {
    var M = window.AA_MEMO || {}; n = Math.max(4, Math.min(26, n));
    var l = (M[n] || []).filter(function (p) { return !used[p]; }); if (!l.length) l = M[n] || [];
    var p = l[Math.floor(Math.random() * l.length)]; used[p] = 1; return p;
  }
  var MODES = [{ s: 10, mult: 1, t: '10 s', d: 'Calentamiento', bolts: 1, c: 'm-green' }, { s: 5, mult: 2, t: '5 s', d: 'Puntos ×2', bolts: 2, c: 'm-orange' }, { s: 3, mult: 3, t: '3 s', d: 'Puntos ×3 · solo para valientes', bolts: 3, c: 'm-red' }];
  var GAME_TIME = 180, LIVES = 3;
  var BOLT = 'M13 2 4 14h7l-1 8 9-12h-7z';

  function Board(props) {
    var UI = window.AA_UI, h = UI.React.createElement, sq = [];
    for (var i = 0; i < 64; i++) {
      var f = i & 7, r = 7 - (i >> 3), name = FILES[f] + (r + 1), x = f * 100, y = (7 - r) * 100;
      var mk = props.marks && props.marks[name];
      sq.push(h('rect', { key: 's' + name, x: x, y: y, width: 100, height: 100, className: ((r + f) % 2 === 1 ? 'sq-l' : 'sq-d') }));
      if (mk) sq.push(h('rect', { key: 'm' + name, x: x + 4, y: y + 4, width: 92, height: 92, rx: 12, className: 'mm-mark mm-' + mk }));
    }
    var pcs = [];
    Object.keys(props.place || {}).forEach(function (s) { var p = props.place[s], f = FILES.indexOf(s[0]), r = +s[1] - 1;
      pcs.push(h(UI.Piece, { key: 'p' + s + p, type: p[1], color: p[0], x: f * 100, y: (7 - r) * 100 })); });
    Object.keys(props.ghost || {}).forEach(function (s) { if (props.place && props.place[s]) return; var p = props.ghost[s], f = FILES.indexOf(s[0]), r = +s[1] - 1;
      pcs.push(h(UI.Piece, { key: 'g' + s + p, type: p[1], color: p[0], x: f * 100, y: (7 - r) * 100, cls: 'mm-ghost' })); });
    function click(e) { if (!props.onSquare) return; var b = e.currentTarget.getBoundingClientRect();
      var f = Math.floor((e.clientX - b.left) / b.width * 8), r = 7 - Math.floor((e.clientY - b.top) / b.height * 8);
      if (f >= 0 && f < 8 && r >= 0 && r < 8) props.onSquare(FILES[f] + (r + 1)); }
    // Coordenadas: letras en la fila 1 y números en la columna a, con el color contrario a la casilla
    var co = [];
    for (var k = 0; k < 8 && props.coords !== false; k++) {
      co.push(h('text', { key: 'f' + k, x: k * 100 + 90, y: 790, textAnchor: 'end', className: 'mm-co ' + (k % 2 ? 'on-l' : 'on-d') }, FILES[k]));
      co.push(h('text', { key: 'r' + k, x: 8, y: k * 100 + 26, className: 'mm-co ' + (k % 2 ? 'on-d' : 'on-l') }, String(8 - k)));
    }
    return h('div', { className: 'cb mm-board' + (props.onSquare ? ' mm-edit' : '') + (props.cls ? ' ' + props.cls : '') },
      h('svg', { viewBox: '0 0 800 800', className: 'cb-svg', onClick: click, role: 'img', 'aria-label': props.label || 'Tablero' }, UI.defs, sq, co, pcs));
  }

  window.AA_TAPBOARD = Board; // tablero de casillas tocables, también para las actividades de las lecciones

  function Hearts(props) {
    var h = window.AA_UI.React.createElement, out = [];
    for (var i = 0; i < LIVES; i++) {
      var st = i < props.lives ? 'on' : i === props.lives && props.breaking ? 'brk' : 'off';
      out.push(h('span', { key: i + st, className: 'mm-heart ' + st }, h('i', { className: 'l' }), h('i', { className: 'r' })));
    }
    return h('span', { className: 'mm-hearts', role: 'img', 'aria-label': props.lives + ' vidas' }, out);
  }

  function Memoria() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var st = R.useState({ phase: 'menu' }), g = st[0], set = st[1];
    var rec = R.useState(rd(LS_MEMO)), memo = rec[0], setMemo = rec[1];
    var tool = R.useState('wq'), sel = tool[0], setSel = tool[1];
    var used = R.useRef({}), root = R.useRef(null);
    var gRef = R.useRef(g); gRef.current = g;

    function start(mode) { used.current = {}; set({ phase: 'ready', mode: mode, lives: LIVES, time: GAME_TIME, score: 0, n: 4, round: 1, perfect: 0, combo: 0, best: null, maxN: 4, go: 3 }); }
    function next(base) { var p = pickPos(base.n, used.current);
      set(Object.assign({}, base, { phase: 'show', target: parsePlace(p), placed: {}, left: base.mode.s, marks: null, ghost: null, breaking: false, el: 0 })); }
    // 3, 2, 1, ¡ya!
    R.useEffect(function () {
      if (g.phase !== 'ready') return;
      var t = setTimeout(function () { var c = gRef.current; if (c.phase !== 'ready') return;
        if (c.go > 0) { UI.sound('move'); set(Object.assign({}, c, { go: c.go - 1 })); } else next(c); }, c0(g.go));
      return function () { clearTimeout(t); };
      function c0(n) { return n > 0 ? 650 : 450; }
    }, [g.phase, g.go]);
    // reloj de la partida, cuenta atrás de la memorización y cronómetro de la colocación
    R.useEffect(function () {
      if (g.phase !== 'show' && g.phase !== 'place') return;
      var last = performance.now();
      var t = setInterval(function () {
        var c = gRef.current; if (c.phase !== 'show' && c.phase !== 'place') return;
        var now = performance.now(), dt = (now - last) / 1000; last = now;
        var time = Math.max(0, c.time - dt), patch = { time: time };
        if (c.phase === 'show') { var left = c.left - dt; patch.left = left; if (left <= 0) { patch.phase = 'place'; patch.el = 0; } }
        else patch.el = c.el + dt;
        if (time <= 0) { finish(Object.assign({}, c, patch), 'tiempo'); return; }
        set(Object.assign({}, c, patch));
      }, 100);
      return function () { clearInterval(t); };
    }, [g.phase]);

    function finish(c, why) {
      var m = Object.assign({ best: {} }, rd(LS_MEMO)), w = semana(), key = String(c.mode.s);
      var isRec = c.score > 0 && c.score > (m.best[key] || 0); if (isRec) m.best[key] = c.score;
      if (m.semana !== w) { m.semana = w; m.semBest = 0; }
      if (c.score > (m.semBest || 0)) m.semBest = c.score;
      m.mejor = Math.max(m.mejor || 0, c.score);
      if (c.best && (!m.rapido || c.best < m.rapido)) m.rapido = +c.best.toFixed(1);
      wr(LS_MEMO, m); setMemo(m);
      if (c.score > 0) UI.update(function (s) { s.xp += Math.min(40, Math.round(c.score / 6)); });
      set(Object.assign({}, c, { phase: 'over', why: why, isRec: isRec }));
      if (window.AA_CLAS) window.AA_CLAS.sync();
      if (isRec) setTimeout(function () { confetti(root.current, 180); UI.sound('correct'); }, 350);
    }
    function onSquare(s) { if (g.phase !== 'place') return; var p = Object.assign({}, g.placed);
      if (sel === 'x' || p[s] === sel) delete p[s]; else { p[s] = sel; UI.sound('move'); } set(Object.assign({}, g, { placed: p })); }
    function check() {
      var t = g.target, p = g.placed, marks = {}, ghost = {}, shown = {}, ok = 0, bad = 0, all = {};
      Object.keys(t).concat(Object.keys(p)).forEach(function (s) { all[s] = 1; });
      Object.keys(all).forEach(function (s) {
        if (t[s] && p[s] === t[s]) { marks[s] = 'ok'; shown[s] = p[s]; ok++; }
        else if (t[s] && !p[s]) { marks[s] = 'miss'; ghost[s] = t[s]; bad++; }
        else if (t[s]) { marks[s] = 'bad'; ghost[s] = t[s]; bad++; }
        else { marks[s] = 'bad'; shown[s] = p[s]; bad++; } });
      var perfect = bad === 0, n = Object.keys(t).length, secs = g.el;
      var combo = perfect ? g.combo + 1 : 0, cm = Math.min(2, 1 + 0.25 * Math.max(0, combo - 1));
      var base = n * 10 * g.mode.mult, bonus = perfect ? Math.max(0, Math.round((n * 2 - secs) * 5 * g.mode.mult)) : 0;
      var pts = perfect ? Math.round((base + bonus) * cm) : 0;
      UI.sound(perfect ? 'correct' : 'wrong');
      set(Object.assign({}, g, { phase: 'result', marks: marks, ghost: ghost, shown: shown, ok: ok, bad: bad, perfectRound: perfect, gained: pts, base: base, bonus: bonus, cm: cm, secs: secs,
        score: g.score + pts, lives: perfect ? g.lives : g.lives - 1, breaking: !perfect, perfect: g.perfect + (perfect ? 1 : 0), combo: combo,
        best: perfect ? (g.best == null ? secs : Math.min(g.best, secs)) : g.best, maxN: Math.max(g.maxN, perfect ? n : g.maxN) }));
    }
    function cont() { if (g.lives <= 0) { finish(g, 'vidas'); return; }
      next(Object.assign({}, g, { n: g.perfectRound ? Math.min(26, g.n + 2) : g.n, round: g.round + 1 })); }
    R.useEffect(function () { // Intro: comprobar; espacio: siguiente
      function k(e) { if (e.target.closest && e.target.closest('input,textarea')) return;
        var c = gRef.current; if (e.key === 'Enter' && c.phase === 'place') { e.preventDefault(); check(); } else if ((e.key === 'Enter' || e.key === ' ') && c.phase === 'result') { e.preventDefault(); cont(); } }
      window.addEventListener('keydown', k); return function () { window.removeEventListener('keydown', k); };
    });

    /* Portada */
    if (g.phase === 'menu') {
      var demoPieces = [['wk', 'e1'], ['bq', 'd8'], ['wn', 'f3'], ['br', 'a8'], ['wb', 'c4'], ['bn', 'c6'], ['wp', 'e4'], ['bp', 'e5']];
      return h('div', { className: 'page-retos memoria', ref: root },
        h('section', { className: 'mm-hero' },
          h('div', { className: 'mm-hero-txt' },
            h('span', { className: 'mm-kicker' }, h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('path', { d: BOLT })), 'Reto'),
            h('h1', null, 'Memoria relámpago'),
            h('p', null, 'Mira la posición, ciérrala en tu cabeza y vuelve a colocar cada pieza. Cada acierto suma piezas, puntos y velocidad.'),
            h('div', { className: 'mm-stats' },
              h('span', null, h('b', null, memo.mejor || 0), h('small', null, 'tu récord')),
              h('span', null, h('b', null, memo.rapido ? fmt(memo.rapido) + ' s' : '—'), h('small', null, 'más rápida')),
              h('span', null, h('b', null, memo.semana === semana() ? (memo.semBest || 0) : 0), h('small', null, 'esta semana')))),
          h('div', { className: 'mm-hero-art', 'aria-hidden': 'true' },
            h('div', { className: 'mm-mini' }, demoPieces.map(function (d, i) { var f = FILES.indexOf(d[1][0]), r = +d[1][1] - 1;
              return h('svg', { key: i, viewBox: '0 0 100 100', className: 'mm-float', style: { left: (f * 12.5) + '%', top: ((7 - r) * 12.5) + '%', animationDelay: (i * 0.35) + 's' } }, UI.defs, h(UI.Piece, { type: d[0][1], color: d[0][0], x: 0, y: 0 })); })),
            h('div', { className: 'mm-hero-mascot' }, h(UI.Mascot, { kind: 'caballo', mood: 'point', size: 110 })))),
        h('h2', { className: 'h-sub' }, 'Elige tu velocidad'),
        h('div', { className: 'mm-modes' }, MODES.map(function (m) {
          return h('button', { key: m.s, className: 'mm-mode ' + m.c, onClick: function () { start(m); } },
            h('span', { className: 'mm-bolts' }, [1, 2, 3].map(function (b) { return h('svg', { key: b, viewBox: '0 0 24 24', className: b <= m.bolts ? 'on' : '' }, h('path', { d: BOLT })); })),
            h('b', null, m.t), h('small', null, m.d),
            h('span', { className: 'mm-best' }, 'Récord ', h('strong', null, (memo.best && memo.best[m.s]) || 0)),
            h('span', { className: 'mm-play' }, 'Jugar')); })),
        h('div', { className: 'mm-rules' },
          [['3:00', 'minutos de partida'], ['♥♥♥', 'vidas: fallar rompe una'], ['+2', 'piezas tras cada acierto'], ['×2', 'combo si encadenas aciertos']].map(function (r, i) {
            return h('div', { key: i, className: 'mm-rule' }, h('b', null, r[0]), h('span', null, r[1])); })),
        h('button', { className: 'btn btn-ghost mm-to-lb', onClick: function () { UI.go('clasificacion'); } }, h('span', null, 'Ver la clasificación')));
    }

    if (g.phase === 'ready') {
      return h('div', { className: 'page-retos memoria playing', ref: root },
        h('div', { className: 'mm-ready' }, h('span', { key: g.go, className: 'mm-go' }, g.go > 0 ? g.go : '¡Ya!'), h('small', null, 'Modo ' + g.mode.t + ' · prepárate')));
    }

    var mins = Math.floor(g.time / 60), secs = Math.floor(g.time % 60);
    var hud = h('div', { className: 'mm-hud' },
      h(Hearts, { lives: g.lives, breaking: g.breaking }),
      h('span', { className: 'mm-clock' + (g.time < 30 ? ' low' : '') }, mins + ':' + String(secs).padStart(2, '0')),
      h('span', { className: 'mm-chip' }, 'Ronda ', h('b', null, g.round)),
      h('span', { className: 'mm-chip' }, h('b', null, Object.keys(g.target || {}).length), ' piezas'),
      g.combo > 1 ? h('span', { key: 'c' + g.combo, className: 'mm-chip mm-combo' }, 'Combo ×' + Math.min(2, 1 + 0.25 * (g.combo - 1)).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')) : null,
      h('span', { key: 's' + g.score, className: 'mm-chip mm-score' }, h('b', null, g.score), ' pts'));

    if (g.phase === 'over') {
      return h('div', { className: 'page-retos memoria', ref: root },
        h('div', { className: 'mm-over' + (g.isRec ? ' rec' : '') },
          h('div', { className: 'mm-over-mascot' }, h(UI.Mascot, { kind: g.isRec ? 'dama' : 'torre', mood: g.isRec ? 'happy' : g.score ? 'wow' : 'oops', size: 120 })),
          h('small', null, g.why === 'tiempo' ? '¡Tiempo!' : 'Sin vidas'),
          g.isRec ? h('span', { className: 'mm-rec' }, 'Nuevo récord') : null,
          h('b', { className: 'mm-big' }, g.score, h('small', null, ' puntos')),
          h('div', { className: 'mm-over-stats' },
            h('span', null, h('b', null, g.perfect), h('small', null, 'perfectas')),
            h('span', null, h('b', null, g.maxN), h('small', null, 'piezas máx.')),
            h('span', null, h('b', null, g.best != null ? fmt(g.best) + ' s' : '—'), h('small', null, 'más rápida')),
            h('span', null, h('b', null, (memo.best && memo.best[g.mode.s]) || 0), h('small', null, 'récord ' + g.mode.t))),
          h('div', { className: 'row-actions' },
            h('button', { className: 'btn btn-primary btn-big', onClick: function () { start(g.mode); } }, h('span', null, 'Otra vez')),
            h('button', { className: 'btn', onClick: function () { set({ phase: 'menu' }); } }, h('span', null, 'Cambiar modo')),
            h('button', { className: 'btn btn-ghost', onClick: function () { UI.go('clasificacion'); } }, h('span', null, 'Clasificación')))));
    }

    var palette = null;
    if (g.phase === 'place') {
      var P = ['k', 'q', 'r', 'b', 'n', 'p'];
      palette = h('div', { className: 'mm-palette', role: 'toolbar', 'aria-label': 'Piezas' },
        ['w', 'b'].map(function (c) { return h('div', { key: c, className: 'mm-row' }, P.map(function (t) {
          var id = c + t; return h('button', { key: id, className: 'mm-pc' + (sel === id ? ' on' : ''), onClick: function () { setSel(id); }, 'aria-label': (c === 'w' ? 'blanco ' : 'negro ') + t },
            h('svg', { viewBox: '0 0 100 100' }, UI.defs, h(UI.Piece, { type: t, color: c, x: 0, y: 0 }))); })); }),
        h('div', { className: 'mm-row mm-tools' },
          h('button', { className: 'mm-pc mm-erase' + (sel === 'x' ? ' on' : ''), onClick: function () { setSel('x'); } }, 'Borrar'),
          h('button', { className: 'btn', onClick: function () { set(Object.assign({}, g, { placed: {} })); } }, h('span', null, 'Vaciar')),
          h('button', { className: 'btn btn-primary', onClick: check }, h('span', null, 'Comprobar'))));
    }
    var side;
    if (g.phase === 'show') side = h('div', { className: 'mm-side mm-memo' },
      h('small', null, 'Memoriza'), h('div', { key: Math.ceil(g.left), className: 'mm-count' }, Math.ceil(g.left)),
      h('div', { className: 'mm-bar' }, h('i', { style: { transform: 'scaleX(' + Math.max(0, g.left / g.mode.s) + ')' } })));
    else if (g.phase === 'result') side = h('div', { className: 'mm-side ' + (g.perfectRound ? 'ok' : 'bad') },
      h('b', null, g.perfectRound ? '¡Perfecta!' : g.lives <= 0 ? 'Sin vidas' : '¡Se rompe un corazón!'),
      g.perfectRound
        ? h('div', { className: 'mm-pts' },
            h('span', null, 'Piezas', h('b', null, '+' + g.base)),
            h('span', null, 'Velocidad (' + fmt(g.secs) + ' s)', h('b', null, '+' + g.bonus)),
            g.cm > 1 ? h('span', null, 'Combo', h('b', null, '×' + String(g.cm).replace('.', ','))) : null,
            h('span', { className: 'tot' }, 'Total', h('b', null, '+' + g.gained)))
        : h('p', { className: 'small' }, g.ok + ' bien · ' + g.bad + ' mal en ' + fmt(g.secs) + ' s. En transparente, la pieza que iba en cada casilla.'),
      h('button', { className: 'btn btn-primary btn-big', onClick: cont }, h('span', null, g.lives <= 0 ? 'Ver resultado' : 'Siguiente')),
      h('small', { className: 'mm-key' }, 'Espacio para seguir'));
    else side = h('div', { className: 'mm-side mm-place' },
      h('small', null, 'Coloca las piezas'),
      h('div', { className: 'mm-watch' }, h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('circle', { cx: 12, cy: 13, r: 8 }), h('path', { d: 'M12 13V9M10 2h4M18.5 6.5l1.5-1.5' })), fmt(g.el), h('small', null, ' s')),
      h('p', { className: 'small muted' }, 'Elige una pieza y toca las casillas. Intro para comprobar.'));
    return h('div', { className: 'page-retos memoria playing' + (g.time < 30 ? ' hurry' : ''), ref: root }, hud,
      h('div', { className: 'mm-stage' },
        h(Board, { place: g.phase === 'show' ? g.target : g.phase === 'result' ? g.shown : g.placed, marks: g.phase === 'result' ? g.marks : null, ghost: g.phase === 'result' ? g.ghost : null,
          onSquare: g.phase === 'place' ? onSquare : null, cls: g.phase === 'show' ? 'mm-glow' : g.phase === 'result' ? (g.perfectRound ? 'mm-flash-ok' : 'mm-shake') : '',
          label: g.phase === 'show' ? 'Posición para memorizar' : 'Tu tablero' }),
        h('div', { className: 'mm-panel' }, side, palette)));
  }
  PAGES.memoria = Memoria;

  /* ─────────────── Clasificación ─────────────── */
  var CATS = {
    semana: [
      { k: 'xp_semana', t: 'XP', u: 'XP', i: 'M12 2l3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1z' },
      { k: 'problemas_semana', t: 'Táctica', u: 'problemas', i: 'M13 2 4 14h7l-1 8 9-12h-7z' },
      { k: 'lecciones_semana', t: 'Lecciones', u: 'lecciones', i: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM8 7h6' },
      { k: 'memoria_semana', t: 'Memoria', u: 'puntos', i: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' }],
    global: [
      { k: 'racha', t: 'Racha', u: 'días', i: 'M12.6 2c.5 3.3 3.1 5.4 4.7 7.6 1.3 1.8 2.2 3.7 2.2 5.9A7.5 7.5 0 0 1 4.5 15.5c0-2.9 1.6-5 3.4-6.6.2 1.9 1 3.2 2.3 3.9-.3-3.9.6-7.4 2.4-10.8z' },
      { k: 'tactica', t: 'Rating de táctica', u: '', i: 'M13 2 4 14h7l-1 8 9-12h-7z' },
      { k: 'xp_total', t: 'XP total', u: 'XP', i: 'M12 2l3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1z' },
      { k: 'memoria_record', t: 'Memoria', u: 'puntos', i: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' }]
  };
  function racha(s) { // días seguidos con práctica hasta hoy (o ayer)
    var set = {}; (s.days || []).forEach(function (d) { set[d] = 1; });
    var d = new Date(), n = 0, iso = function (x) { return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
    if (!set[iso(d)]) d.setDate(d.getDate() - 1);
    while (set[iso(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function totals() { var s = {}; try { s = JSON.parse(localStorage.getItem('chess-academy/v1')) || {}; } catch (e) {}
    var m = rd(LS_MEMO), w = semana();
    return { xp: s.xp || 0, solved: (s.puzzle && s.puzzle.solved) || 0, rating: (s.puzzle && s.puzzle.rating) || 0,
      lessons: Object.values(s.lessons || {}).filter(function (l) { return l && l.done; }).length, racha: racha(s),
      memo: m.mejor || 0, memoSem: m.semana === w ? (m.semBest || 0) : 0 }; }
  var CLAS = window.AA_CLAS = {
    row: null,
    ready: function () { return !!(window.AA_CUENTA && window.AA_CUENTA.sb && window.AA_CUENTA.uid); },
    me: function () { var c = window.AA_CUENTA; if (!this.ready()) return Promise.resolve(null);
      var self = this; return c.sb.from('clasificacion').select('*').eq('user_id', c.uid).maybeSingle().then(function (r) { self.row = r.data || null; return self.row; }); },
    sync: function (nombre) { var c = window.AA_CUENTA, self = this; if (!this.ready()) return Promise.resolve(null);
      return this.me().then(function (row) {
        if (!row && !nombre) return null; // aún no se ha unido
        var t = totals(), w = semana(), nueva = !row || row.semana !== w;
        var base = nueva ? { base_xp: t.xp, base_problemas: t.solved, base_lecciones: t.lessons } : { base_xp: row.base_xp, base_problemas: row.base_problemas, base_lecciones: row.base_lecciones };
        var data = Object.assign({ user_id: c.uid, nombre: nombre || row.nombre, semana: w, racha: t.racha, tactica: t.rating, xp_total: t.xp,
          xp_semana: Math.max(0, t.xp - base.base_xp), problemas_semana: Math.max(0, t.solved - base.base_problemas), lecciones_semana: Math.max(0, t.lessons - base.base_lecciones),
          memoria_record: t.memo, memoria_semana: t.memoSem, updated_at: new Date().toISOString() }, base);
        return c.sb.from('clasificacion').upsert(data).select().maybeSingle().then(function (r) { if (!r.error) self.row = r.data; return r; });
      }); },
    leave: function () { var c = window.AA_CUENTA, self = this; if (!this.ready()) return Promise.resolve();
      return c.sb.from('clasificacion').delete().eq('user_id', c.uid).then(function () { self.row = null; }); }
  };
  var lastSync = 0;
  setInterval(function () { if (CLAS.ready() && CLAS.row && Date.now() - lastSync > 60e3 && !document.hidden) { lastSync = Date.now(); CLAS.sync(); } }, 15e3);
  window.addEventListener('aa-cuenta', function () { CLAS.sync(); });

  var DEMO_ROWS = [['Lucía', 1840, 41, 9, 1260, 23, 1712, 5400, 980], ['Mateo', 1520, 28, 6, 640, 12, 1590, 4100, 720], ['Valentina', 1210, 33, 4, 900, 40, 1488, 3900, 1260],
    ['Thiago', 980, 19, 7, 300, 8, 1655, 3550, 400], ['Camila', 760, 12, 2, 520, 31, 1402, 2900, 860], ['Benjamín', 540, 9, 3, 180, 5, 1310, 2100, 240], ['Sofía', 410, 6, 2, 120, 3, 1250, 1700, 150]];
  function demoRows() { return DEMO_ROWS.map(function (r, i) { return { user_id: 'demo' + i, nombre: r[0], xp_semana: r[1], problemas_semana: r[2], lecciones_semana: r[3], memoria_semana: r[4],
    racha: r[5], tactica: r[6], xp_total: r[7], memoria_record: r[8] }; }); }
  var AV = ['#2fb344', '#1cb0f6', '#ff9600', '#a560e8', '#ff5e7a', '#14b8a6'];
  function avColor(id) { var s = 0; for (var i = 0; i < (id || '').length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0; return AV[s % AV.length]; }

  function Clasificacion() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var a = R.useState('semana'), scope = a[0], setScope = a[1];
    var b = R.useState(0), ci = b[0], setCi = b[1];
    var c = R.useState({ loading: true, rows: [], me: null, rank: null }), d = c[0], setD = c[1];
    var e = R.useState(window.AA_CUENTA ? 'ok' : 'wait'), acc = e[0], setAcc = e[1];
    var f = R.useState((window.AA_CUENTA && window.AA_CUENTA.nombre) || ''), nombre = f[0], setNombre = f[1];
    var gg = R.useState(''), msg = gg[0], setMsg = gg[1];
    var podRef = R.useRef(null);
    var cat = CATS[scope][Math.min(ci, CATS[scope].length - 1)];
    var demo = !!(window.AA_CUENTA && window.AA_CUENTA.demo) || !(window.AA_AUTH && window.AA_AUTH.url);
    R.useEffect(function () { function on() { setAcc('ok'); if (!nombre && window.AA_CUENTA) setNombre(window.AA_CUENTA.nombre || ''); }
      window.addEventListener('aa-cuenta', on); return function () { window.removeEventListener('aa-cuenta', on); }; }, []);
    function load() {
      if (demo) { var rows = demoRows().sort(function (x, y) { return y[cat.k] - x[cat.k]; }); setD({ loading: false, rows: rows, me: null, rank: null, demo: true }); return; }
      if (!CLAS.ready()) { setD({ loading: false, rows: [], me: null }); return; }
      setD(function (o) { return Object.assign({}, o, { loading: true }); });
      var sb = window.AA_CUENTA.sb, w = semana();
      CLAS.sync().then(function () {
        var q = sb.from('clasificacion').select('user_id,nombre,' + cat.k).gt(cat.k, 0).order(cat.k, { ascending: false }).limit(50);
        if (scope === 'semana') q = q.eq('semana', w);
        return q.then(function (r) {
          var me = CLAS.row;
          if (me && me[cat.k] > 0 && !(r.data || []).some(function (x) { return x.user_id === me.user_id; })) {
            var cq = sb.from('clasificacion').select('user_id', { count: 'exact', head: true }).gt(cat.k, me[cat.k]); if (scope === 'semana') cq = cq.eq('semana', w);
            return cq.then(function (cr) { setD({ loading: false, rows: r.data || [], me: me, rank: (cr.count || 0) + 1, err: r.error }); });
          }
          var idx = me ? (r.data || []).findIndex(function (x) { return x.user_id === me.user_id; }) : -1;
          setD({ loading: false, rows: r.data || [], me: me, rank: idx >= 0 ? idx + 1 : null, err: r.error });
        });
      }).catch(function () { setD({ loading: false, rows: [], me: null, err: true }); });
    }
    R.useEffect(load, [scope, ci, acc]);
    R.useEffect(function () { if (!d.loading && d.rows.length) { var t = setTimeout(function () { confetti(podRef.current, 120); }, 450); return function () { clearTimeout(t); }; } }, [d.loading, scope, ci]);
    function join() { var n = nombre.trim().replace(/\s+/g, ' ');
      if (n.length < 2 || n.length > 20) { setMsg('El nombre debe tener entre 2 y 20 letras.'); return; }
      setMsg(''); CLAS.sync(n).then(function (r) { if (r && r.error) setMsg('No se pudo guardar. Inténtalo otra vez.'); load(); }); }
    var joined = !!(d.me || CLAS.row), myId = d.me && d.me.user_id;
    function icon(p, cls) { return h('svg', { viewBox: '0 0 24 24', className: cls || 'lb-i', 'aria-hidden': 'true' }, h('path', { d: p })); }
    function val(r) { return h('span', { className: 'lb-val' }, h('b', null, r[cat.k]), cat.u ? h('small', null, ' ' + cat.u) : null); }
    function av(r, big) { return h('span', { className: 'lb-av' + (big ? ' big' : ''), style: { background: avColor(r.user_id) } }, (r.nombre || '?').charAt(0).toUpperCase()); }

    // Podio: 2.º, 1.º, 3.º con los personajes celebrando
    var KIDS = [['dama', 'happy'], ['caballo', 'wow'], ['torre', 'happy']];
    var top = d.rows.slice(0, 3), order = [1, 0, 2];
    var podium = !d.loading && d.rows.length ? h('div', { className: 'lb-podium', ref: podRef }, order.map(function (i) {
      var r = top[i], place = i + 1;
      return h('div', { key: place, className: 'lb-step s' + place + (r && r.user_id === myId ? ' me' : '') + (r ? '' : ' empty') },
        h('div', { className: 'lb-mascot' }, h(UI.Mascot, { kind: KIDS[i][0], mood: r ? KIDS[i][1] : 'think', size: place === 1 ? 104 : 84 })),
        r ? h('div', { className: 'lb-who' },
          place === 1 ? h('span', { className: 'lb-crown', 'aria-hidden': 'true' }, icon('M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z', 'lb-crown-i')) : null,
          av(r, true), h('b', { className: 'lb-pname' }, r.nombre, r.user_id === myId ? ' (tú)' : ''), val(r))
          : h('div', { className: 'lb-who' }, h('span', { className: 'lb-av big ghost' }, '?'), h('b', { className: 'lb-pname' }, '¿Tú?'), h('small', { className: 'muted' }, 'Hueco libre')),
        h('div', { className: 'lb-block' }, h('span', null, place)));
    })) : null;

    var rest = d.rows.slice(3);
    var list = d.loading ? h('div', { className: 'lb-skel' }, [0, 1, 2].map(function (i) { return h('i', { key: i }); }))
      : !d.rows.length ? h('div', { className: 'lb-empty' }, h(UI.Mascot, { kind: 'peon', mood: 'think', size: 90 }),
          h('div', null, h('b', null, scope === 'semana' ? 'Nadie ha puntuado aún esta semana' : 'Todavía no hay nadie aquí'), h('p', { className: 'muted small' }, '¡El primer puesto está libre! Juega y ocúpalo.')))
      : rest.length ? h('ol', { className: 'lb-list', start: 4 }, rest.map(function (r, i) {
          return h('li', { key: r.user_id, className: 'lb-row' + (r.user_id === myId ? ' me' : ''), style: { animationDelay: (i * 40) + 'ms' } },
            h('span', { className: 'lb-pos' }, i + 4), av(r), h('span', { className: 'lb-name' }, r.nombre, r.user_id === myId ? h('small', null, ' (tú)') : null), val(r)); })) : null;
    var mine = d.me && d.rank && d.me[cat.k] > 0 ? h('div', { className: 'lb-mine' },
      h('div', { className: 'lb-mine-rank' }, h('small', null, 'Tu puesto'), h('b', null, '#' + d.rank)),
      av(d.me), h('span', { className: 'lb-name' }, d.me.nombre), val(d.me)) : null;
    var joinCard = !demo && acc === 'ok' && CLAS.ready() && !joined && !d.loading ? h('div', { className: 'lb-join' },
      h(UI.Mascot, { kind: 'caballo', mood: 'point', size: 84 }),
      h('div', null, h('b', null, 'Súbete al podio'),
        h('p', { className: 'small' }, 'Elige el nombre con el que aparecerás. Solo se muestran ese nombre y tus cifras de juego; puedes salirte cuando quieras.'),
        h('div', { className: 'lb-join-row' },
          h('input', { value: nombre, maxLength: 20, onChange: function (ev) { setNombre(ev.target.value); }, onKeyDown: function (ev) { if (ev.key === 'Enter') join(); }, placeholder: 'Tu nombre en la tabla', 'aria-label': 'Nombre en la clasificación' }),
          h('button', { className: 'btn btn-primary', onClick: join }, h('span', null, 'Unirme'))),
        msg ? h('p', { className: 'lj-err' }, msg) : null)) : null;
    var noAcc = !demo && !CLAS.ready() ? h('div', { className: 'lb-empty' }, h(UI.Mascot, { kind: 'peon', mood: 'think', size: 80 }), h('div', null, h('b', null, 'Inicia sesión para ver la clasificación'), h('p', { className: 'muted small' }, 'La clasificación usa tu cuenta para guardar tus cifras.'))) : null;

    return h('div', { className: 'page-retos clasif' },
      h('section', { className: 'lb-hero' },
        h('div', { className: 'lb-hero-top' },
          h('div', null, h('span', { className: 'lb-kicker' }, icon('M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 20h8', 'lb-ki'), scope === 'semana' ? 'Liga semanal' : 'Salón de la fama'),
            h('h1', null, 'Clasificación'),
            h('p', null, scope === 'semana' ? 'Se reinicia en ' + finSemana() + (finSemana() === 1 ? ' día' : ' días') + '. ¡Todavía puedes subir!' : 'Los mejores de todos los tiempos.')),
          h('div', { className: 'lb-seg', role: 'tablist' },
            [['semana', 'Esta semana'], ['global', 'Global']].map(function (t) { return h('button', { key: t[0], role: 'tab', 'aria-selected': scope === t[0], className: scope === t[0] ? 'on' : '', onClick: function () { setScope(t[0]); setCi(0); } }, t[1]); }))),
        h('div', { className: 'lb-cats' }, CATS[scope].map(function (x, i) {
          return h('button', { key: x.k, className: 'lb-cat' + (i === ci ? ' on' : ''), 'aria-pressed': i === ci, onClick: function () { setCi(i); } }, icon(x.i), x.t); }))),
      d.demo ? h('p', { className: 'lb-demo' }, 'Vista de ejemplo: inicia sesión para ver la clasificación real.') : null,
      noAcc, joinCard, podium, mine, list,
      joined && !demo ? h('button', { className: 'btn btn-ghost lb-leave', onClick: function () { if (confirm('¿Quitar tu nombre de la clasificación?')) CLAS.leave().then(load); } }, h('span', null, 'Salir de la clasificación')) : null);
  }
  PAGES.clasificacion = Clasificacion;
})();
