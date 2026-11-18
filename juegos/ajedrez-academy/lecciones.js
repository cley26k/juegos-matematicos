/* Ajedrez Academy · lecciones: correcciones del contenido, desafíos con posiciones reales variadas
   y actividades nuevas que se generan a partir de posiciones (cada visita es distinta).
   Datos: lecciones-datos.js (window.AA_BANK, problemas de Lichess CC0 verificados con Stockfish). */
(function () {
  'use strict';
  var STEPS = window.AA_STEPS = window.AA_STEPS || {};
  var FILES = 'abcdefgh', VAL = { 1: 1, 2: 3, 3: 3, 4: 5, 5: 9, 6: 0 }, NAME = { 1: 'peón', 2: 'caballo', 3: 'alfil', 4: 'torre', 5: 'dama', 6: 'rey' };
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var recent = {}; // evita repetir la misma posición seguida
  function pick(key, list) { if (!list || !list.length) return null; var r = recent[key] = recent[key] || [];
    var pool = list.filter(function (x) { return r.indexOf(list.indexOf(x)) < 0; }); if (!pool.length) { r.length = 0; pool = list; }
    var it = rnd(pool); r.push(list.indexOf(it)); if (r.length > Math.min(12, list.length - 1)) r.shift(); return it; }
  function idx(sq) { return (+sq[1] - 1) * 16 + FILES.indexOf(sq[0]); }
  function sqName(i) { return FILES[i & 7] + ((i >> 4) + 1); }
  function sideName(fen) { return fen.split(' ')[1] === 'w' ? 'blancas' : 'negras'; }

  /* ───────── 1. Correcciones de contenido (auditoría con Stockfish) ───────── */
  var FIX_FEN = { '6k1/6pp/8/3q4/8/1P6/8/4KB2 w - - 0 1': '6k1/6pp/8/3q4/8/1P6/6PP/4KB2 w - - 0 1' }; // clavada: tras Axd5 el final de peones ya no se pierde
  var FIX_ALT = { '4k3/8/q7/8/8/8/4B3/4R1K1 w - - 0 1': ['Bc4+', 'Bf1+'], '4k3/8/8/8/7b/8/8/2KQ4 w - - 0 1': ['Qh5+'] };                       // descubierta: también ganan la dama
  var EV = { // evaluaciones que no coincidían con el motor (cp desde las blancas)
    '2kr4/ppp2p1p/2N1ppr1/8/2P5/6Pq/P1P1BP1P/R2Q1RK1 b - - 0 16': 290,
    'rnb1k2r/pp3pQp/4p3/qP1p4/4n3/P1N5/1BP1PbPP/R2K1BNR b kq - 1 10': -160,
    'r3k2r/pp1b1ppp/1q2pn2/n7/2p5/Q1N3P1/PP2PPBP/R1B2RK1 w kq - 3 13': 180,
    '2r2rk1/pb2qppp/1p2nn2/3p4/1b1Q4/1PN1PN2/PB2BPPP/3R1RK1 w - - 9 16': -200,
    'r3nrk1/pp1nbpp1/2p1p1b1/q7/2BPPPP1/P1N1B3/1P1NQ3/R4RK1 b - - 0 17': 230 };
  function evWhy(cp) { var a = Math.abs(cp), w = cp > 0 ? 'Las blancas' : 'Las negras';
    return a >= 150 ? w + ' están claramente mejor: hay algo concreto (material o un golpe táctico) que pesa más que el equilibrio general.'
      : w + ' están algo mejor, pero el otro bando conserva recursos.'; }
  var DROP_GUESS = { 'grau-2-16413:39': 1, 'grau-4-8556:16': 1, 'ms-johner:80': 1, 'grau-3-1232:35': 1, 'grau-4-8556:22': 1 }; // la jugada de la partida no era buena: confundía

  /* ───────── 2. Actividades nuevas por lección ───────── */
  var X = function (t, extra) { return Object.assign({ t: t }, extra || {}); };
  var EXTRA = {
    tablero: [X('coords', { n: 8 }), X('flash', { pieces: 4 })],
    piezas: [X('knight'), X('coords', { n: 6, flip: true })],
    notacion: [X('coords', { n: 10 }), X('checks')],
    especiales: [X('checks')],
    'jaque-mate': [X('mate1', { n: 3 })],
    'salir-jaque': [X('mate1', { n: 2 }), X('checks')],
    tablas: [X('material')],
    valor: [X('material'), X('free')],
    'mates-basicos': [X('mate1', { n: 4, timed: 45 })],
    trampas: [X('duel', { bank: 'mate2' }), X('free')],
    'ataque-doble': [X('duel', { bank: 'tactica1' }), X('order', { theme: 'fork' })],
    clavada: [X('duel', { bank: 'tactica1' }), X('order', { theme: 'pin' })],
    descubierta: [X('order', { theme: 'discoveredAttack' }), X('duel', { bank: 'tactica1' })],
    pincho: [X('duel', { bank: 'tactica1' }), X('free')],
    defensor: [X('free'), X('order', { theme: 'capturingDefender' })],
    desviacion: [X('order', { theme: 'deflection' }), X('duel', { bank: 'tactica2' })],
    atraccion: [X('order', { theme: 'attraction' }), X('duel', { bank: 'tactica2' })],
    sacrificio: [X('duel', { bank: 'tactica2' }), X('order', { theme: 'sacrifice' })],
    molino: [X('order'), X('checks')],
    calculo: [X('order'), X('flash', { pieces: 8 })],
    'mates-tipicos': [X('mate1', { n: 3, timed: 40 }), X('duel', { bank: 'mate2' })],
    combinaciones: [X('order'), X('duel', { bank: 'ataqueRey' })],
    'g-enroques': [X('duel', { bank: 'ataqueRey' })], 'g-mates-menores': [X('mate1', { n: 3 })], 'g-octava': [X('order', { theme: 'backRankMate' })],
    'g-jaque-doble': [X('order', { theme: 'doubleCheck' })], 'g-ataque-doble': [X('order', { theme: 'fork' })], 'g-salvador': [X('duel', { bank: 'tactica2' })],
    principios: [X('duel', { bank: 'estrategia' }), X('material')], iniciativa: [X('duel', { bank: 'estrategia' })],
    columnas: [X('duel', { bank: 'estrategia' })], peones: [X('duel', { bank: 'final' })], casillas: [X('duel', { bank: 'estrategia' })],
    alfiles: [X('duel', { bank: 'estrategia' })], evaluar: [X('material'), X('duel', { bank: 'estrategia' })], cambios: [X('duel', { bank: 'final' })],
    plan: [X('duel', { bank: 'estrategia' }), X('flash', { pieces: 10 })], 'rey-seguro': [X('duel', { bank: 'ataqueRey' })], 'enroques-opuestos': [X('duel', { bank: 'ataqueRey' })],
    'g-peon-avanza': [X('duel', { bank: 'final' })], 'g-mayoria': [X('duel', { bank: 'final' })], 'g-peon-aislado': [X('duel', { bank: 'estrategia' })],
    cuadrado: [X('duel', { bank: 'final' })], oposicion: [X('duel', { bank: 'final' })], zugzwang: [X('duel', { bank: 'final' })],
    'torre-activa': [X('duel', { bank: 'final' })], 'rey-activo': [X('duel', { bank: 'final' })], tecnica: [X('duel', { bank: 'final' }), X('flash', { pieces: 6 })],
    'g-final-ventaja': [X('duel', { bank: 'final' })], 'g-simplificacion': [X('duel', { bank: 'final' })],
    'm-pensar': [X('duel', { bank: 'estrategia' })], 'm-profilaxis': [X('duel', { bank: 'estrategia' })], 'm-casillas': [X('duel', { bank: 'estrategia' })],
    'm-ataque': [X('duel', { bank: 'ataqueRey' })], 'm-tecnica': [X('duel', { bank: 'final' })], 'm-tranquilas': [X('duel', { bank: 'estrategia' })],
    'ms-bloqueo': [X('duel', { bank: 'estrategia' })], 'ms-pasado': [X('duel', { bank: 'final' })], 'ms-restriccion': [X('duel', { bank: 'estrategia' })]
  };
  var PRACTICE_MIX = [X('duel'), X('order'), X('mate1', { n: 2 }), X('free'), X('flash', { pieces: 6 }), X('material'), X('checks')];

  /* ───────── 3. Desafíos: posición real distinta en cada visita ───────── */
  var BOSS = { 'desafio-1-2': ['mate2', 'kqk'], 'desafio-1-4': ['trampa'], 'desafio-2-2': ['tactica1'], 'desafio-2-4': ['tactica2'], 'desafio-2-6': ['ataqueRey'], 'desafio-2-8': ['tactica3'],
    'desafio-3-2': ['estrategia'], 'desafio-3-4': ['estrategia', 'ataqueRey'], 'desafio-3-6': ['estrategia'], 'desafio-3-8': ['estrategia'], 'desafio-3-9': ['estrategia'],
    'desafio-4-2': ['final'], 'desafio-4-4': ['final'], 'desafio-4-6': ['final'], 'desafio-4-8': ['final'],
    'desafio-5-2': ['estrategia'], 'desafio-5-4': ['estrategia', 'final'], 'desafio-6-2': ['bloqueo'], 'desafio-6-4': ['bloqueo', 'final'], 'desafio-6-5': ['bloqueo'] };
  var TEMA = { fork: 'horquilla', pin: 'clavada', skewer: 'pincho', discoveredAttack: 'ataque a la descubierta', deflection: 'desviación', attraction: 'atracción', sacrifice: 'sacrificio',
    clearance: 'despeje', capturingDefender: 'eliminar al defensor', xRayAttack: 'rayos X', doubleCheck: 'jaque doble', intermezzo: 'jugada intermedia', interference: 'interferencia',
    defensiveMove: 'defensa activa', backRankMate: 'mate del pasillo', smotheredMate: 'mate de la coz', hookMate: 'mate del gancho', arabianMate: 'mate árabe', anastasiaMate: 'mate de Anastasia',
    bodenMate: 'mate de Boden', doubleBishopMate: 'mate de los dos alfiles', kingsideAttack: 'ataque al rey', quietMove: 'jugada tranquila', advancedPawn: 'peón avanzado',
    trappedPiece: 'pieza atrapada', queensideAttack: 'ataque en el flanco de dama', exposedKing: 'rey expuesto', promotion: 'coronación', pawnEndgame: 'final de peones',
    rookEndgame: 'final de torres', zugzwang: 'zugzwang', mateIn2: 'mate en 2', mateIn3: 'mate en 3', mateIn1: 'mate en 1', hangingPiece: 'pieza colgada' };
  var PRIO = ['pawnEndgame', 'rookEndgame', 'promotion', 'zugzwang', 'advancedPawn'];
  function temaDe(th, endgame) { th = th || []; if (endgame) for (var k = 0; k < PRIO.length; k++) if (th.indexOf(PRIO[k]) >= 0) return TEMA[PRIO[k]];
    for (var i = 0; i < th.length; i++) if (TEMA[th[i]]) return TEMA[th[i]]; return null; }
  window.AA_PICKPLAY = function (lessonId, step) {
    var B = window.AA_BANK, ks = BOSS[lessonId]; if (!B || !ks) return null;
    var k = rnd(ks); if (k === 'kqk') return null; // el mate básico de dama se mantiene como opción
    var p = pick('reto-' + k, B.retos[k]); if (!p) return null;
    var side = sideName(p.fen), tema = temaDe(p.themes, p.goal === 'promote');
    var goal = p.goal === 'win' ? 'da jaque mate' : p.goal === 'promote' ? 'corona un peón' : 'gana al menos ' + (p.target / 100) + ' peones de material';
    return Object.assign({}, step, { fen: p.fen, goal: p.goal, target: p.target || undefined, maxPlies: p.maxPlies, level: p.level,
      text: 'Partida real' + (tema ? ' · tema: ' + tema : '') + '. Juegas con ' + side + ': ' + goal + '.' });
  };

  window.AA_LESSONS_FIX = function (lessons) {
    lessons.forEach(function (l) {
      // partidas nuevas por tomo (partidas-tomoN.js): sustituyen a las famosas que se repetían
      if (window.AA_REPLACE && window.AA_REPLACE[l.id]) l.steps = window.AA_REPLACE[l.id](l.steps);
      l.steps = l.steps.filter(function (s) { return !(s.t === 'guess' && DROP_GUESS[s.game + ':' + s.ply]); }).map(function (s) {
        if (s.fen && FIX_FEN[s.fen]) s = Object.assign({}, s, { fen: FIX_FEN[s.fen] });
        if (s.t === 'task' && FIX_ALT[s.fen]) s = Object.assign({}, s, { alt: (s.alt || []).concat(FIX_ALT[s.fen]) });
        if (s.t === 'evalq' && EV[s.fen] != null) s = Object.assign({}, s, { cp: EV[s.fen], why: evWhy(EV[s.fen]) });
        return s; });
      var ex = EXTRA[l.id] || (l.kind === 'practice' ? [rnd(PRACTICE_MIX), rnd(PRACTICE_MIX)] : null);
      if (ex && l.steps.length) { var at = Math.max(1, Math.round(l.steps.length * 0.7)); l.steps.splice.apply(l.steps, [at, 0].concat(ex.map(function (x) { return Object.assign({}, x); }))); }
    });
    return lessons;
  };

  /* ───────── 4. Componentes de las actividades ───────── */
  function useUI() { return window.AA_UI; }
  function TapBoard(props) { return window.AA_UI.React.createElement(window.AA_TAPBOARD, props); }
  function placeOf(fen) { var m = {}, r = 7, f = 0, pl = fen.split(' ')[0];
    for (var i = 0; i < pl.length; i++) { var c = pl[i]; if (c === '/') { r--; f = 0; } else if (/\d/.test(c)) f += +c; else { m[FILES[f] + (r + 1)] = (c === c.toUpperCase() ? 'w' : 'b') + c.toLowerCase(); f++; } }
    return m; }
  function Shell(p) { var UI = useUI(), h = UI.React.createElement;
    return h(UI.React.Fragment, null, h(UI.Stage, { title: p.title, tutor: h(UI.Tutor, { mood: p.mood || 'think' }, p.say), board: p.board, below: p.below }), p.bar); }
  function okBar(UI, title, text, onNext) { var h = UI.React.createElement; return h(UI.Bar, { tone: 'ok', title: title, text: text, right: h(UI.Btn, { kind: 'success', big: true, onClick: onNext }, 'Continuar') }); }
  function badBar(UI, title, text, onRetry) { var h = UI.React.createElement; return h(UI.Bar, { tone: 'bad', title: title, text: text, right: h(UI.Btn, { kind: 'danger', big: true, onClick: onRetry }, 'Reintentar') }); }
  function idleBar(UI, right, text) { var h = UI.React.createElement; return h(UI.Bar, { tone: 'idle', text: text, right: right }); }

  // Coordenadas: toca la casilla que se pide
  STEPS.coords = function (p) {
    var UI = useUI(), R = UI.React, h = R.createElement, n = p.step.n || 8;
    var st = R.useState(function () { return { target: rnd(FILES) + (1 + Math.floor(Math.random() * 8)), hits: 0, miss: 0, last: null }; }), g = st[0], set = st[1];
    var done = g.hits >= n;
    function tap(sq) { if (done) return;
      if (sq === g.target) { UI.sound('move'); var nt; do { nt = rnd(FILES) + (1 + Math.floor(Math.random() * 8)); } while (nt === sq);
        set({ target: nt, hits: g.hits + 1, miss: g.miss, last: { sq: sq, ok: true } }); if (g.hits + 1 >= n) { UI.sound('correct'); UI.xp(5); } }
      else { UI.sound('wrong'); if (g.miss === 2) p.onError(); set(Object.assign({}, g, { miss: g.miss + 1, last: { sq: sq, ok: false } })); } }
    var marks = {}; if (g.last) marks[g.last.sq] = g.last.ok ? 'ok' : 'bad';
    return h(Shell, { title: 'Coordenadas', mood: done ? 'happy' : 'think',
      say: done ? '¡Muy bien! Ya te orientas en el tablero: ' + n + ' casillas encontradas.' : h('span', null, 'Toca la casilla ', h('b', { className: 'ls-big' }, g.target), ' · ' + g.hits + '/' + n),
      board: h(TapBoard, { place: {}, marks: marks, coords: false, onSquare: done ? null : tap, label: 'Tablero vacío' }),
      bar: done ? okBar(UI, '¡Coordenadas dominadas!', g.miss ? 'Fallos: ' + g.miss + '. La letra es la columna y el número, la fila.' : 'Sin fallos.', p.onNext) : null });
  };

  // Ruta del caballo: llega a la casilla en el mínimo de saltos
  function kDist(a, b) { var D = {}, q = [a]; D[a] = 0; while (q.length) { var c = q.shift(); if (c === b) return D[c]; kn(c).forEach(function (x) { if (D[x] == null) { D[x] = D[c] + 1; q.push(x); } }); } return 9; }
  function kn(s) { var f = FILES.indexOf(s[0]), r = +s[1], o = []; [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(function (d) { var F = f + d[0], Rr = r + d[1]; if (F >= 0 && F < 8 && Rr >= 1 && Rr <= 8) o.push(FILES[F] + Rr); }); return o; }
  STEPS.knight = function (p) {
    var UI = useUI(), R = UI.React, h = R.createElement;
    var init = R.useMemo(function () { var a, b, d; do { a = rnd(FILES) + (1 + Math.floor(Math.random() * 8)); b = rnd(FILES) + (1 + Math.floor(Math.random() * 8)); d = kDist(a, b); } while (d < 3 || d > 4); return { a: a, b: b, d: d }; }, []);
    var st = R.useState({ at: init.a, moves: 0, path: [] }), g = st[0], set = st[1];
    var won = g.at === init.b, over = !won && g.moves >= init.d + 2;
    function tap(s) { if (won || over) return; if (kn(g.at).indexOf(s) < 0) { UI.sound('wrong'); return; } UI.sound('move');
      var ng = { at: s, moves: g.moves + 1, path: g.path.concat(g.at) }; set(ng); if (s === init.b) { UI.sound(ng.moves === init.d ? 'correct' : 'move'); if (ng.moves === init.d) UI.xp(5); } }
    var place = {}; place[g.at] = 'wn'; var marks = {}; marks[init.b] = 'miss'; g.path.forEach(function (s) { marks[s] = 'ok'; });
    var perfect = won && g.moves === init.d;
    return h(Shell, { title: 'La ruta del caballo', mood: perfect ? 'happy' : over || (won && !perfect) ? 'oops' : 'think',
      say: won ? (perfect ? '¡Ruta perfecta en ' + g.moves + ' saltos!' : 'Llegaste en ' + g.moves + ' saltos; se podía en ' + init.d + '.') : over ? 'Te has pasado de saltos.' : h('span', null, 'Lleva el caballo de ', h('b', null, init.a), ' a ', h('b', null, init.b), ' en ', h('b', null, init.d), ' saltos. Saltos: ' + g.moves),
      board: h(TapBoard, { place: place, marks: marks, onSquare: won || over ? null : tap, label: 'Ruta del caballo' }),
      bar: perfect ? okBar(UI, '¡Ruta mínima!', 'Contar saltos de caballo es la base de las horquillas.', p.onNext)
        : won || over ? badBar(UI, won ? 'Casi' : 'Demasiados saltos', 'Busca casillas que acerquen al caballo en diagonal larga: avanza 2 y 1 hacia el objetivo.', function () { p.onError(); set({ at: init.a, moves: 0, path: [] }); }) : null });
  };

  // Mate en 1 (varias posiciones reales, opcionalmente contra reloj)
  STEPS.mate1 = function (p) {
    var UI = useUI(), R = UI.React, h = R.createElement, n = p.step.n || 3, B = (window.AA_BANK || {}).mate1 || [];
    var st = R.useState(function () { return { i: 0, fen: pick('mate1', B), solved: 0, state: 'idle', t0: Date.now(), left: p.step.timed || 0 }; }), g = st[0], set = st[1];
    R.useEffect(function () { if (!p.step.timed || g.state !== 'idle') return; var t = setInterval(function () { set(function (c) { var l = c.left - 1; return l <= 0 ? Object.assign({}, c, { left: 0, state: 'time' }) : Object.assign({}, c, { left: l }); }); }, 1000); return function () { clearInterval(t); }; }, [g.state]);
    if (!g.fen) return h('p', null, 'Cargando…');
    function move(u) { var c = new UI.Chess(g.fen), m = c.parse(u); if (m === null) return false; c.make(m);
      if (c.inCheck() && c.legal().length === 0) { UI.sound('correct'); var s2 = g.solved + 1;
        if (s2 >= n) { UI.xp(6); set(Object.assign({}, g, { solved: s2, state: 'done', fen2: c.fen(), last: u })); } else set(Object.assign({}, g, { solved: s2, fen: pick('mate1', B), last: null })); }
      else { UI.sound('wrong'); p.onError(); set(Object.assign({}, g, { state: 'bad', fen2: c.fen(), last: u })); }
      return true; }
    var side = sideName(g.fen);
    return h(Shell, { title: p.step.timed ? 'Mate relámpago' : 'Da mate en 1', mood: g.state === 'done' ? 'happy' : g.state === 'bad' || g.state === 'time' ? 'oops' : 'think',
      say: g.state === 'done' ? '¡' + n + ' mates seguidos!' : g.state === 'time' ? 'Se acabó el tiempo.' : 'Juegan las ' + side + ': encuentra el jaque mate. (' + g.solved + '/' + n + ')' + (p.step.timed ? ' · ⏱ ' + g.left + ' s' : ''),
      board: h(UI.Board, { fen: g.state === 'idle' ? g.fen : g.fen2 || g.fen, interactive: g.state === 'idle', onMove: move, lastMove: g.last, orientation: side === 'blancas' ? 'w' : 'b', flash: g.state === 'done' ? 'ok' : g.state === 'bad' ? 'bad' : null }),
      bar: g.state === 'done' ? okBar(UI, '¡Mate!', 'Buscar primero los jaques es la forma más rápida de encontrar mates.', p.onNext)
        : g.state === 'bad' || g.state === 'time' ? badBar(UI, g.state === 'time' ? '¡Tiempo!' : 'Eso no es mate', 'Mira todas las jugadas que dan jaque y comprueba si el rey tiene escapatoria.', function () { set({ i: 0, fen: pick('mate1', B), solved: 0, state: 'idle', left: p.step.timed || 0 }); }) : null });
  };

  // Piezas que se pueden capturar gratis
  function freeTargets(fen) { var UI = window.AA_UI, c = new UI.Chess(fen), us = c.turn ? 8 : 0, out = {};
    c.legal().forEach(function (m) { var u = c.uci(m), to = idx(u.slice(2, 4)), from = idx(u.slice(0, 2)), cap = c.sq[to], mover = c.sq[from];
      if (!cap) return; var vc = VAL[cap & 7], vm = VAL[mover & 7];
      c.make(m); var re = c.attacked(to, us ^ 8); c.unmake();
      if (!re || vc >= vm + 2) out[u.slice(2, 4)] = true; });
    return Object.keys(out); }
  STEPS.free = function (p) {
    var UI = useUI(), R = UI.React, h = R.createElement, B = (window.AA_BANK || {}).colgada || [];
    var fen = R.useMemo(function () { for (var k = 0; k < 20; k++) { var f = pick('free', B); if (f && freeTargets(f).length) return f; } return B[0]; }, []);
    var ans = R.useMemo(function () { return fen ? freeTargets(fen) : []; }, [fen]);
    var st = R.useState({ sel: {}, state: 'idle' }), g = st[0], set = st[1];
    if (!fen) return h('p', null, 'Cargando…');
    var side = sideName(fen), place = placeOf(fen), mine = side === 'blancas' ? 'b' : 'w';
    function tap(s) { if (g.state !== 'idle' || !place[s] || place[s][0] !== mine) return; var sel = Object.assign({}, g.sel); if (sel[s]) delete sel[s]; else sel[s] = 1; UI.sound('move'); set({ sel: sel, state: 'idle' }); }
    function check() { var picked = Object.keys(g.sel), ok = picked.length === ans.length && picked.every(function (s) { return ans.indexOf(s) >= 0; });
      UI.sound(ok ? 'correct' : 'wrong'); if (ok) UI.xp(5); else p.onError(); set({ sel: g.sel, state: ok ? 'ok' : 'bad' }); }
    var marks = {}; Object.keys(g.sel).forEach(function (s) { marks[s] = g.state === 'idle' ? 'pick' : ans.indexOf(s) >= 0 ? 'ok' : 'bad'; });
    if (g.state !== 'idle') ans.forEach(function (s) { if (!g.sel[s]) marks[s] = 'miss'; });
    return h(Shell, { title: 'Material gratis', mood: g.state === 'ok' ? 'happy' : g.state === 'bad' ? 'oops' : 'think',
      say: g.state === 'idle' ? 'Juegan las ' + side + '. Toca todas las piezas rivales que puedes capturar sin perder material (sin recaptura o ganando en el cambio).' : g.state === 'ok' ? '¡Exacto! Revisar qué piezas están indefensas es lo primero en cada jugada.' : 'En naranja, las que se te escaparon; en rojo, las que no eran gratis.',
      board: h(TapBoard, { place: place, marks: marks, onSquare: g.state === 'idle' ? tap : null, label: 'Toca las piezas' }),
      bar: g.state === 'ok' ? okBar(UI, '¡Todas encontradas!', ans.length + (ans.length === 1 ? ' pieza gratis' : ' piezas gratis') + '.', p.onNext)
        : g.state === 'bad' ? badBar(UI, 'No del todo', 'Para cada pieza rival: ¿la ataco?, ¿la defienden?, ¿vale más que la mía?', function () { set({ sel: {}, state: 'idle' }); })
        : idleBar(UI, h(UI.Btn, { kind: 'primary', big: true, onClick: check }, 'Comprobar'), Object.keys(g.sel).length + ' marcadas') });
  };

  // Recuento de material
  function matOf(fen) { var w = 0, b = 0; fen.split(' ')[0].split('').forEach(function (c) { var v = { p: 1, n: 3, b: 3, r: 5, q: 9 }[c.toLowerCase()]; if (!v) return; if (c === c.toUpperCase()) w += v; else b += v; }); return w - b; }
  STEPS.material = function (p) {
    var UI = useUI(), R = UI.React, h = R.createElement, B = (window.AA_BANK || {}).material || [];
    var fen = R.useMemo(function () { var f; for (var k = 0; k < 15; k++) { f = pick('mat', B); if (f && matOf(f) !== 0) break; } return f; }, []);
    var d = fen ? matOf(fen) : 0;
    var opts = R.useMemo(function () { var c = [d, d + 1, d - 1, d + 2, d - 2, -d].filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 4); return shuffle(c); }, [fen]);
    var st = R.useState(null), sel = st[0], set = st[1];
    if (!fen) return h('p', null, 'Cargando…');
    function lab(x) { return x === 0 ? 'Igualado' : (x > 0 ? 'Blancas +' : 'Negras +') + Math.abs(x); }
    var ok = sel === d;
    return h(Shell, { title: 'Cuenta el material', mood: sel === null ? 'think' : ok ? 'happy' : 'oops',
      say: sel === null ? 'Peón 1, caballo y alfil 3, torre 5, dama 9. ¿Quién tiene más material y por cuánto?' : ok ? '¡Bien contado! ' + lab(d) + '.' : 'Era ' + lab(d) + '. Cuenta pieza a pieza las que sobran a cada bando.',
      board: h(UI.Board, { fen: fen, coords: true }),
      below: h('div', { className: 'quiz-opts ls-opts' }, opts.map(function (x) { return h('button', { key: x, className: 'quiz-opt' + (sel !== null && x === d ? ' right' : sel === x && x !== d ? ' wrong' : ''), disabled: sel !== null,
        onClick: function () { set(x); UI.sound(x === d ? 'correct' : 'wrong'); if (x === d) UI.xp(3); else p.onError(); } }, lab(x)); })),
      bar: sel === null ? null : ok ? okBar(UI, '¡Correcto!', null, p.onNext) : badBar(UI, 'No exactamente', 'Igualad las piezas que se compensan y suma lo que queda.', function () { set(null); }) });
  };

  // ¿Cuántas jugadas dan jaque?
  STEPS.checks = function (p) {
    var UI = useUI(), R = UI.React, h = R.createElement, B = (window.AA_BANK || {}).colgada || [];
    var data = R.useMemo(function () { for (var k = 0; k < 30; k++) { var f = pick('chk', B.concat((window.AA_BANK || {}).mate1 || [])); if (!f) continue; var c = new UI.Chess(f), n = 0, list = [];
      c.legal().forEach(function (m) { c.make(m); if (c.inCheck()) n++; c.unmake(); if (false) list.push(m); }); if (n >= 1 && n <= 6) return { fen: f, n: n }; } return null; }, []);
    var st = R.useState(null), sel = st[0], set = st[1];
    if (!data) return h('p', null, 'Cargando…');
    var opts = R.useMemo(function () { return shuffle([data.n, data.n + 1, Math.max(0, data.n - 1) === data.n ? data.n + 2 : Math.max(0, data.n - 1), data.n + 2].filter(function (x, i, a) { return a.indexOf(x) === i; })); }, [data]);
    var ok = sel === data.n, side = sideName(data.fen);
    return h(Shell, { title: 'Cuenta los jaques', mood: sel === null ? 'think' : ok ? 'happy' : 'oops',
      say: sel === null ? 'Juegan las ' + side + '. ¿Cuántas jugadas distintas dan jaque? Revisa cada pieza: también cuentan los jaques a la descubierta.' : ok ? '¡Exacto! Ver todos los jaques es el primer paso del cálculo.' : 'Eran ' + data.n + '. Repasa pieza por pieza, sin olvidar peones y descubiertas.',
      board: h(UI.Board, { fen: data.fen, orientation: side === 'blancas' ? 'w' : 'b' }),
      below: h('div', { className: 'quiz-opts ls-opts' }, opts.map(function (x) { return h('button', { key: x, className: 'quiz-opt' + (sel !== null && x === data.n ? ' right' : sel === x && x !== data.n ? ' wrong' : ''), disabled: sel !== null,
        onClick: function () { set(x); UI.sound(x === data.n ? 'correct' : 'wrong'); if (x === data.n) UI.xp(4); else p.onError(); } }, x + (x === 1 ? ' jaque' : ' jaques')); })),
      bar: sel === null ? null : ok ? okBar(UI, '¡Correcto!', null, p.onNext) : badBar(UI, 'No exactamente', null, function () { set(null); }) });
  };

  // Mejor de dos: ¿cuál es la jugada buena?
  STEPS.duel = function (p) {
    var UI = useUI(), R = UI.React, h = R.createElement, BK = (window.AA_BANK || {}).duelo || {};
    var d = R.useMemo(function () { var k = p.step.bank && BK[p.step.bank] ? p.step.bank : rnd(Object.keys(BK)); var x = pick('duel-' + k, BK[k]); if (!x) return null;
      var c = new UI.Chess(x.fen), a = c.san(c.parse(x.good)), b = c.san(c.parse(x.bad)), flip = Math.random() < .5;
      return Object.assign({}, x, { opts: flip ? [[x.bad, b, false], [x.good, a, true]] : [[x.good, a, true], [x.bad, b, false]] }); }, []);
    var st = R.useState(null), sel = st[0], set = st[1];
    if (!d) return h('p', null, 'Cargando…');
    var side = sideName(d.fen), tema = temaDe(d.themes), col = ['b', 'y'];
    var right = sel !== null && d.opts[sel][2];
    var fenAfter = sel === null ? d.fen : (function () { var c = new UI.Chess(d.fen); c.make(c.parse(d.opts[sel][0])); return c.fen(); })();
    return h(Shell, { title: 'Mejor de dos', mood: sel === null ? 'think' : right ? 'happy' : 'oops',
      say: sel === null ? 'Juegan las ' + side + '. Solo una de estas dos jugadas funciona. ¿Cuál?' : right ? '¡Bien visto!' + (tema ? ' Tema: ' + tema + '.' : '') + ' La otra pierde unos ' + d.gain.toFixed(1).replace('.', ',') + ' peones.' : 'Esa parece natural, pero cede unos ' + d.gain.toFixed(1).replace('.', ',') + ' peones. La buena era ' + d.opts[1 - sel][1] + (tema ? ' (' + tema + ')' : '') + '.',
      board: h(UI.Board, { fen: fenAfter, orientation: side === 'blancas' ? 'w' : 'b', lastMove: sel === null ? null : d.opts[sel][0],
        arrows: sel === null ? d.opts.map(function (o, i) { return { from: o[0].slice(0, 2), to: o[0].slice(2, 4), color: col[i] }; }) : [], flash: sel === null ? null : right ? 'ok' : 'bad' }),
      below: h('div', { className: 'quiz-opts ls-opts ls-duel' }, d.opts.map(function (o, i) { return h('button', { key: i, className: 'quiz-opt ls-' + col[i] + (sel !== null && o[2] ? ' right' : sel === i && !o[2] ? ' wrong' : ''), disabled: sel !== null,
        onClick: function () { set(i); UI.sound(o[2] ? 'correct' : 'wrong'); if (o[2]) UI.xp(4); else p.onError(); } }, h('i', { className: 'ls-dot' }), o[1]); })),
      bar: sel === null ? null : right ? okBar(UI, '¡Correcto!', null, p.onNext) : badBar(UI, 'Era la otra', 'Antes de elegir, busca la respuesta del rival a cada jugada.', function () { set(null); }) });
  };

  // Ordena la combinación
  STEPS.order = function (p) {
    var UI = useUI(), R = UI.React, h = R.createElement, BO = (window.AA_BANK || {}).ordena || [];
    var d = R.useMemo(function () { var pool = p.step.theme ? BO.filter(function (x) { return x.themes.indexOf(p.step.theme) >= 0; }) : BO; if (pool.length < 3) pool = BO;
      var x = pick('order-' + (p.step.theme || ''), pool); if (!x) return null; var c = new UI.Chess(x.fen), plies = [];
      x.sol.forEach(function (u) { var m = c.parse(u); if (m === null) return; plies.push({ u: u, san: c.san(m), fen: (c.make(m), c.fen()) }); });
      var mine = plies.filter(function (_, i) { return i % 2 === 0; });
      var opts = shuffle(mine.map(function (m, i) { return { i: i, san: m.san }; }));
      return Object.assign({}, x, { plies: plies, mine: mine, opts: opts }); }, []);
    var st = R.useState({ k: 0, state: 'idle', bad: null }), g = st[0], set = st[1];
    if (!d) return h('p', null, 'Cargando…');
    // tras k jugadas propias se ve la respuesta del rival (si la hay)
    var j = g.k === 0 ? -1 : Math.min(d.plies.length - 1, 2 * g.k - 1);
    var side = sideName(d.fen), tema = temaDe(d.themes), shown = j < 0 ? d.fen : d.plies[j].fen, last = j < 0 ? null : d.plies[j].u;
    function tap(o) { if (g.state !== 'idle') return;
      if (o.i === g.k) { UI.sound('move'); var k = g.k + 1; if (k >= d.mine.length) { UI.sound('correct'); UI.xp(6); set({ k: k, state: 'ok' }); } else set({ k: k, state: 'idle' }); }
      else { UI.sound('wrong'); p.onError(); set({ k: g.k, state: 'bad', bad: o.san }); } }
    return h(Shell, { title: 'Ordena la combinación', mood: g.state === 'ok' ? 'happy' : g.state === 'bad' ? 'oops' : 'think',
      say: g.state === 'ok' ? '¡Combinación completa!' + (tema ? ' Tema: ' + tema + '.' : '') : g.state === 'bad' ? g.bad + ' todavía no: piensa qué jugada obliga primero al rival.' : 'Juegan las ' + side + '. Estas son tus jugadas de la combinación, desordenadas. Tócalas en el orden correcto (el rival responde solo).',
      board: h(UI.Board, { fen: shown, lastMove: last, orientation: side === 'blancas' ? 'w' : 'b', flash: g.state === 'ok' ? 'ok' : g.state === 'bad' ? 'bad' : null }),
      below: h('div', { className: 'ls-order' }, d.opts.map(function (o) { var used = o.i < g.k; return h('button', { key: o.i, className: 'ls-move' + (used ? ' used' : ''), disabled: used || g.state !== 'idle', onClick: function () { tap(o); } }, used ? h('b', null, (o.i + 1) + '.') : null, o.san); })),
      bar: g.state === 'ok' ? okBar(UI, '¡Orden perfecto!', d.plies.map(function (x) { return x.san; }).join(' '), p.onNext)
        : g.state === 'bad' ? badBar(UI, 'Orden incorrecto', 'Las combinaciones suelen empezar con la jugada más forzante: jaques, capturas y amenazas.', function () { set({ k: 0, state: 'idle' }); }) : null });
  };

  // Visualización: memoriza la posición y responde dónde estaba una pieza
  STEPS.flash = function (p) {
    var UI = useUI(), R = UI.React, h = R.createElement, n = p.step.pieces || 6, M = window.AA_MEMO || {};
    var d = R.useMemo(function () { var list = M[n] || M[6] || []; var pl = pick('flash' + n, list); if (!pl) return null; var place = placeOf(pl + ' w');
      var counts = {}; Object.keys(place).forEach(function (s) { counts[place[s]] = (counts[place[s]] || 0) + 1; });
      var uniq = Object.keys(place).filter(function (s) { return counts[place[s]] === 1 && place[s][1] !== 'p'; }); var q = rnd(uniq.length ? uniq : Object.keys(place));
      return { place: place, q: q, piece: place[q] }; }, []);
    var st = R.useState({ phase: 'show', left: 5, sel: null }), g = st[0], set = st[1];
    R.useEffect(function () { if (g.phase !== 'show') return; var t = setTimeout(function () { set(function (c) { return c.left <= 1 ? Object.assign({}, c, { phase: 'ask', left: 0 }) : Object.assign({}, c, { left: c.left - 1 }); }); }, 1000); return function () { clearTimeout(t); }; }, [g.phase, g.left]);
    if (!d) return h('p', null, 'Cargando…');
    var fem = d.piece[1] === 'q' || d.piece[1] === 'r';
    var pn = (fem ? 'la ' : 'el ') + { k: 'rey', q: 'dama', r: 'torre', b: 'alfil', n: 'caballo', p: 'peón' }[d.piece[1]] + ' ' + (d.piece[0] === 'w' ? (fem ? 'blanca' : 'blanco') : (fem ? 'negra' : 'negro'));
    var ok = g.sel === d.q, marks = {};
    if (g.phase === 'done') { marks[d.q] = 'ok'; if (!ok) marks[g.sel] = 'bad'; }
    function tap(s) { if (g.phase !== 'ask') return; var good = s === d.q; UI.sound(good ? 'correct' : 'wrong'); if (good) UI.xp(4); else p.onError(); set({ phase: 'done', sel: s }); }
    return h(Shell, { title: 'Visualiza', mood: g.phase === 'done' ? (ok ? 'happy' : 'oops') : 'think',
      say: g.phase === 'show' ? 'Memoriza la posición: ' + g.left + ' s…' : g.phase === 'ask' ? '¿En qué casilla estaba ' + pn + '? Toca la casilla.' : ok ? '¡Exacto! Visualizar es la base de calcular jugadas.' : 'Estaba en ' + d.q + '.',
      board: h(TapBoard, { place: g.phase === 'show' || g.phase === 'done' ? d.place : {}, marks: marks, onSquare: g.phase === 'ask' ? tap : null, cls: g.phase === 'show' ? 'mm-glow' : '', label: 'Visualización' }),
      bar: g.phase !== 'done' ? null : ok ? okBar(UI, '¡Buena memoria!', null, p.onNext) : badBar(UI, 'Casi', 'Fíjate en la pieza y su columna: primero la letra, luego el número.', function () { set({ phase: 'show', left: 5, sel: null }); }) });
  };
})();
