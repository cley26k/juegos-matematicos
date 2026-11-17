/* Ajedrez Academy · Retos: «Memoria» (recuerda la posición) y «Clasificación» (semanal y global).
   Se dibujan dentro de la app (#memoria, #clasificacion) con su propio React, piezas y estado (window.AA_UI). */
(function () {
  'use strict';
  var PAGES = window.AA_PAGES = window.AA_PAGES || {};
  var LS_MEMO = 'chess-academy/memoria', LS_CLAS = 'chess-academy/clasif';
  function rd(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function semana(d) { // semana ISO, p. ej. «2026-W47»
    d = d ? new Date(d) : new Date(); d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
    var y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return d.getUTCFullYear() + '-W' + String(Math.ceil(((d - y0) / 864e5 + 1) / 7)).padStart(2, '0');
  }
  function finSemana() { var d = new Date(), day = d.getDay() || 7; var f = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (8 - day)); return Math.max(0, Math.ceil((f - d) / 864e5)); }

  /* ─────────────── Memoria ─────────────── */
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
  var MODES = [{ s: 10, mult: 1, t: '10 s', d: 'Para empezar' }, { s: 5, mult: 2, t: '5 s', d: 'Puntos ×2' }, { s: 3, mult: 3, t: '3 s', d: 'Puntos ×3' }];
  var GAME_TIME = 180, LIVES = 3;

  function Board(props) {
    var UI = window.AA_UI, h = UI.React.createElement, sq = [];
    for (var i = 0; i < 64; i++) {
      var f = i & 7, r = 7 - (i >> 3), name = FILES[f] + (r + 1), x = f * 100, y = (7 - r) * 100;
      var mk = props.marks && props.marks[name];
      sq.push(h('rect', { key: 's' + name, x: x, y: y, width: 100, height: 100, className: ((r + f) % 2 === 1 ? 'sq-l' : 'sq-d') }));
      if (mk) sq.push(h('rect', { key: 'm' + name, x: x + 3, y: y + 3, width: 94, height: 94, rx: 10, className: 'mm-mark mm-' + mk }));
    }
    var pcs = [];
    Object.keys(props.place || {}).forEach(function (s) { var p = props.place[s], f = FILES.indexOf(s[0]), r = +s[1] - 1;
      pcs.push(h(UI.Piece, { key: 'p' + s + p, type: p[1], color: p[0], x: f * 100, y: (7 - r) * 100, cls: props.ghost && props.ghost[s] ? 'mm-ghost' : '' })); });
    Object.keys(props.ghost || {}).forEach(function (s) { if (props.place && props.place[s]) return; var p = props.ghost[s], f = FILES.indexOf(s[0]), r = +s[1] - 1;
      pcs.push(h(UI.Piece, { key: 'g' + s + p, type: p[1], color: p[0], x: f * 100, y: (7 - r) * 100, cls: 'mm-ghost' })); });
    function click(e) { if (!props.onSquare) return; var b = e.currentTarget.getBoundingClientRect();
      var f = Math.floor((e.clientX - b.left) / b.width * 8), r = 7 - Math.floor((e.clientY - b.top) / b.height * 8);
      if (f >= 0 && f < 8 && r >= 0 && r < 8) props.onSquare(FILES[f] + (r + 1)); }
    var coords = [];
    for (var k = 0; k < 8; k++) { coords.push(h('text', { key: 'f' + k, x: k * 100 + 92, y: 793, className: 'mm-co ' + (k % 2 ? 'on-d' : 'on-l') }, FILES[k]));
      coords.push(h('text', { key: 'r' + k, x: 6, y: k * 100 + 22, className: 'mm-co ' + (k % 2 ? 'on-l' : 'on-d') }, String(8 - k))); }
    return h('div', { className: 'cb mm-board' + (props.onSquare ? ' mm-edit' : '') },
      h('svg', { viewBox: '0 0 800 800', className: 'cb-svg', onClick: click, role: 'img', 'aria-label': props.label || 'Tablero' }, UI.defs, sq, coords, pcs));
  }

  function Memoria() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var st = R.useState({ phase: 'menu' }), g = st[0], set = st[1];
    var rec = R.useState(rd(LS_MEMO)), memo = rec[0], setMemo = rec[1];
    var tool = R.useState('wq'), sel = tool[0], setSel = tool[1];
    var used = R.useRef({});
    var gRef = R.useRef(g); gRef.current = g;

    function start(mode) { used.current = {}; next({ phase: 'show', mode: mode, lives: LIVES, time: GAME_TIME, score: 0, n: 4, round: 1, perfect: 0 }); }
    function next(base) { var p = pickPos(base.n, used.current);
      set(Object.assign({}, base, { phase: 'show', target: parsePlace(p), placed: {}, left: base.mode.s, marks: null, ghost: null })); }
    // reloj de la partida y cuenta atrás de la memorización
    R.useEffect(function () {
      if (g.phase !== 'show' && g.phase !== 'place') return;
      var t = setInterval(function () {
        var c = gRef.current; if (c.phase !== 'show' && c.phase !== 'place') return;
        var time = Math.max(0, c.time - 0.25), patch = { time: time };
        if (c.phase === 'show') { var left = c.left - 0.25; patch.left = left; if (left <= 0) patch.phase = 'place'; }
        if (time <= 0) { finish(Object.assign({}, c, patch), 'tiempo'); return; }
        set(Object.assign({}, c, patch));
      }, 250);
      return function () { clearInterval(t); };
    }, [g.phase]);

    function finish(c, why) {
      var m = Object.assign({ best: {} }, rd(LS_MEMO)), w = semana(), key = String(c.mode.s);
      var isRec = c.score > (m.best[key] || 0); if (isRec) m.best[key] = c.score;
      if (m.semana !== w) { m.semana = w; m.semBest = 0; }
      if (c.score > (m.semBest || 0)) m.semBest = c.score;
      m.mejor = Math.max(m.mejor || 0, c.score);
      wr(LS_MEMO, m); setMemo(m);
      if (c.score > 0) UI.update(function (s) { s.xp += Math.min(40, Math.round(c.score / 4)); });
      set(Object.assign({}, c, { phase: 'over', why: why, isRec: isRec }));
      if (window.AA_CLAS) window.AA_CLAS.sync();
    }
    function onSquare(s) { if (g.phase !== 'place') return; var p = Object.assign({}, g.placed);
      if (sel === 'x' || p[s] === sel) delete p[s]; else p[s] = sel; set(Object.assign({}, g, { placed: p })); }
    function check() {
      var t = g.target, p = g.placed, marks = {}, ghost = {}, shown = {}, ok = 0, bad = 0, all = {};
      Object.keys(t).concat(Object.keys(p)).forEach(function (s) { all[s] = 1; });
      Object.keys(all).forEach(function (s) {
        if (t[s] && p[s] === t[s]) { marks[s] = 'ok'; shown[s] = p[s]; ok++; }
        else if (t[s] && !p[s]) { marks[s] = 'miss'; ghost[s] = t[s]; bad++; }
        else if (t[s] && p[s] !== t[s]) { marks[s] = 'bad'; ghost[s] = t[s]; bad++; }
        else { marks[s] = 'bad'; shown[s] = p[s]; bad++; } }); // pieza de más: se ve en rojo
      var perfect = bad === 0, pts = perfect ? Object.keys(t).length * 10 * g.mode.mult : 0;
      UI.sound(perfect ? 'correct' : 'wrong');
      set(Object.assign({}, g, { phase: 'result', marks: marks, ghost: ghost, shown: shown, ok: ok, bad: bad, perfectRound: perfect, gained: pts,
        score: g.score + pts, lives: perfect ? g.lives : g.lives - 1, perfect: g.perfect + (perfect ? 1 : 0) }));
    }
    function cont() { if (g.lives <= 0) { finish(g, 'vidas'); return; }
      next(Object.assign({}, g, { n: g.perfectRound ? Math.min(26, g.n + 2) : g.n, round: g.round + 1 })); }

    var head = h('div', { className: 'mm-head' },
      h('h1', null, 'Memoria'),
      h('p', { className: 'muted' }, 'Mira la posición unos segundos y vuelve a colocar las piezas de memoria. Cada acierto completo suma puntos y la siguiente posición tiene más piezas.'));

    if (g.phase === 'menu') {
      return h('div', { className: 'page-retos memoria' }, head,
        h('div', { className: 'mm-modes' }, MODES.map(function (m) {
          return h('button', { key: m.s, className: 'card mm-mode', onClick: function () { start(m); } },
            h('b', null, m.t), h('small', null, m.d),
            h('span', { className: 'mm-best' }, 'Récord: ', h('strong', null, (memo.best && memo.best[m.s]) || 0))); })),
        h('div', { className: 'card mm-rules' },
          h('b', null, 'Cómo se juega'),
          h('ul', null,
            h('li', null, 'Tienes 3 minutos y 3 vidas.'),
            h('li', null, 'Empieza con 4 piezas; cada posición perfecta añade 2 más (hasta 26).'),
            h('li', null, 'Si fallas una casilla pierdes una vida y repites con el mismo número de piezas.'),
            h('li', null, 'Puntos: 10 por pieza, multiplicados por el modo (×2 con 5 s, ×3 con 3 s).'))),
        h('button', { className: 'btn btn-ghost mm-to-lb', onClick: function () { UI.go('clasificacion'); } }, h('span', null, 'Ver la clasificación')));
    }
    var mins = Math.floor(g.time / 60), secs = Math.floor(g.time % 60);
    var hud = h('div', { className: 'mm-hud' },
      h('span', { className: 'mm-chip' }, 'Ronda ', h('b', null, g.round)),
      h('span', { className: 'mm-chip' }, h('b', null, Object.keys(g.target || {}).length), ' piezas'),
      h('span', { className: 'mm-chip mm-lives', 'aria-label': g.lives + ' vidas' }, [0, 1, 2].map(function (i) { return h('i', { key: i, className: i < g.lives ? 'on' : '' }); })),
      h('span', { className: 'mm-chip mm-time' + (g.time < 30 ? ' low' : '') }, mins + ':' + String(secs).padStart(2, '0')),
      h('span', { className: 'mm-chip mm-score' }, h('b', null, g.score), ' pts'));

    if (g.phase === 'over') {
      return h('div', { className: 'page-retos memoria' }, head,
        h('div', { className: 'card mm-over' },
          h(UI.Mascot, { kind: 'torre', mood: g.isRec ? 'happy' : 'think', size: 96 }),
          h('div', null,
            h('small', null, g.why === 'tiempo' ? 'Se acabó el tiempo' : 'Sin vidas'),
            h('b', { className: 'mm-big' }, g.score, ' puntos'),
            h('p', null, g.isRec ? '¡Nuevo récord personal en ' + g.mode.t + '!' : 'Tu récord en ' + g.mode.t + ': ' + ((memo.best && memo.best[g.mode.s]) || 0) + ' puntos.'),
            h('p', { className: 'muted small' }, g.perfect + ' posiciones perfectas · llegaste a ' + g.n + ' piezas.'),
            h('div', { className: 'row-actions' },
              h('button', { className: 'btn btn-primary', onClick: function () { start(g.mode); } }, h('span', null, 'Otra vez')),
              h('button', { className: 'btn', onClick: function () { set({ phase: 'menu' }); } }, h('span', null, 'Cambiar modo')),
              h('button', { className: 'btn btn-ghost', onClick: function () { UI.go('clasificacion'); } }, h('span', null, 'Clasificación'))))));
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
    var side = g.phase === 'show'
      ? h('div', { className: 'card mm-side' }, h('b', null, 'Memoriza'), h('div', { className: 'mm-count' }, Math.ceil(g.left)),
          h('div', { className: 'mm-bar' }, h('i', { style: { width: (g.left / g.mode.s * 100) + '%' } })))
      : g.phase === 'result'
        ? h('div', { className: 'card mm-side ' + (g.perfectRound ? 'ok' : 'bad') },
            h('b', null, g.perfectRound ? '¡Perfecta! +' + g.gained : g.lives <= 0 ? 'Sin vidas' : 'Pierdes una vida'),
            h('p', { className: 'small' }, g.perfectRound ? 'La siguiente tendrá más piezas.' : g.ok + ' bien · ' + g.bad + ' mal. En transparente, la pieza que iba en cada casilla.'),
            h('button', { className: 'btn btn-primary', onClick: cont }, h('span', null, g.lives <= 0 ? 'Ver resultado' : 'Siguiente')))
        : h('div', { className: 'card mm-side' }, h('b', null, 'Coloca las piezas'), h('p', { className: 'small muted' }, 'Elige una pieza y toca las casillas. Tocar otra vez la misma pieza la quita.'));
    return h('div', { className: 'page-retos memoria playing' }, hud,
      h('div', { className: 'mm-stage' },
        h(Board, { place: g.phase === 'show' ? g.target : g.phase === 'result' ? g.shown : g.placed, marks: g.phase === 'result' ? g.marks : null, ghost: g.phase === 'result' ? g.ghost : null,
          onSquare: g.phase === 'place' ? onSquare : null, label: g.phase === 'show' ? 'Posición para memorizar' : 'Tu tablero' }),
        h('div', { className: 'mm-panel' }, side, palette)));
  }
  PAGES.memoria = Memoria;

  /* ─────────────── Clasificación ─────────────── */
  var CATS = {
    semana: [
      { k: 'xp_semana', t: 'XP', u: 'XP' },
      { k: 'problemas_semana', t: 'Táctica', u: 'problemas' },
      { k: 'lecciones_semana', t: 'Lecciones', u: 'lecciones' },
      { k: 'memoria_semana', t: 'Memoria', u: 'puntos' }],
    global: [
      { k: 'racha', t: 'Racha', u: 'días' },
      { k: 'tactica', t: 'Rating de táctica', u: '' },
      { k: 'xp_total', t: 'XP total', u: 'XP' },
      { k: 'memoria_record', t: 'Memoria', u: 'puntos' }]
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
  // Mantener las cifras al día mientras la app está abierta
  var lastSync = 0;
  setInterval(function () { if (CLAS.ready() && CLAS.row && Date.now() - lastSync > 60e3 && !document.hidden) { lastSync = Date.now(); CLAS.sync(); } }, 15e3);
  window.addEventListener('aa-cuenta', function () { CLAS.sync(); });

  var DEMO_ROWS = [['Lucía', 1840, 41, 9, 1260, 23, 1712, 5400, 980], ['Mateo', 1520, 28, 6, 640, 12, 1590, 4100, 720], ['Valentina', 1210, 33, 4, 900, 40, 1488, 3900, 1260],
    ['Thiago', 980, 19, 7, 300, 8, 1655, 3550, 400], ['Camila', 760, 12, 2, 520, 31, 1402, 2900, 860], ['Benjamín', 540, 9, 3, 180, 5, 1310, 2100, 240]];
  function demoRows() { return DEMO_ROWS.map(function (r, i) { return { user_id: 'demo' + i, nombre: r[0], xp_semana: r[1], problemas_semana: r[2], lecciones_semana: r[3], memoria_semana: r[4],
    racha: r[5], tactica: r[6], xp_total: r[7], memoria_record: r[8] }; }); }

  function Clasificacion() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var a = R.useState('semana'), scope = a[0], setScope = a[1];
    var b = R.useState(0), ci = b[0], setCi = b[1];
    var c = R.useState({ loading: true, rows: [], me: null, rank: null }), d = c[0], setD = c[1];
    var e = R.useState(window.AA_CUENTA ? 'ok' : 'wait'), acc = e[0], setAcc = e[1];
    var f = R.useState((window.AA_CUENTA && window.AA_CUENTA.nombre) || ''), nombre = f[0], setNombre = f[1];
    var gg = R.useState(''), msg = gg[0], setMsg = gg[1];
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
          var me = CLAS.row, rank = null;
          if (me && me[cat.k] > 0 && !(r.data || []).some(function (x) { return x.user_id === me.user_id; })) {
            var cq = sb.from('clasificacion').select('user_id', { count: 'exact', head: true }).gt(cat.k, me[cat.k]); if (scope === 'semana') cq = cq.eq('semana', w);
            return cq.then(function (cr) { setD({ loading: false, rows: r.data || [], me: me, rank: (cr.count || 0) + 1, err: r.error }); });
          }
          setD({ loading: false, rows: r.data || [], me: me, rank: rank, err: r.error });
        });
      }).catch(function () { setD({ loading: false, rows: [], me: null, err: true }); });
    }
    R.useEffect(load, [scope, ci, acc]);
    function join() { var n = nombre.trim().replace(/\s+/g, ' ');
      if (n.length < 2 || n.length > 20) { setMsg('El nombre debe tener entre 2 y 20 letras.'); return; }
      setMsg(''); CLAS.sync(n).then(function (r) { if (r && r.error) setMsg('No se pudo guardar. Inténtalo otra vez.'); load(); }); }
    var joined = !!(d.me || CLAS.row);
    var tabs = h('div', { className: 'seg lb-seg', role: 'tablist' },
      [['semana', 'Esta semana'], ['global', 'Global']].map(function (t) { return h('button', { key: t[0], role: 'tab', 'aria-selected': scope === t[0], className: scope === t[0] ? 'on' : '', onClick: function () { setScope(t[0]); } }, t[1]); }));
    var chips = h('div', { className: 'lb-cats' }, CATS[scope].map(function (x, i) {
      return h('button', { key: x.k, className: 'tchip' + (i === ci ? ' on' : ''), 'aria-pressed': i === ci, onClick: function () { setCi(i); } }, x.t); }));
    var myId = d.me && d.me.user_id;
    var list = d.loading ? h('p', { className: 'muted' }, 'Cargando…')
      : !d.rows.length ? h('div', { className: 'card lb-empty' }, h('b', null, scope === 'semana' ? 'Nadie ha puntuado aún esta semana' : 'Todavía no hay nadie aquí'), h('p', { className: 'muted small' }, '¡Sé la primera persona de la lista!'))
      : h('ol', { className: 'lb-list' }, d.rows.map(function (r, i) {
          return h('li', { key: r.user_id, className: 'lb-row' + (r.user_id === myId ? ' me' : '') + (i < 3 ? ' top top' + (i + 1) : '') },
            h('span', { className: 'lb-pos' }, i + 1),
            h('span', { className: 'lb-av' }, (r.nombre || '?').charAt(0).toUpperCase()),
            h('span', { className: 'lb-name' }, r.nombre, r.user_id === myId ? h('small', null, ' (tú)') : null),
            h('span', { className: 'lb-val' }, h('b', null, r[cat.k]), cat.u ? h('small', null, ' ' + cat.u) : null)); }));
    var mine = d.rank && d.me ? h('div', { className: 'lb-row me lb-mine' }, h('span', { className: 'lb-pos' }, d.rank), h('span', { className: 'lb-av' }, (d.me.nombre || '?').charAt(0).toUpperCase()),
      h('span', { className: 'lb-name' }, d.me.nombre, h('small', null, ' (tú)')), h('span', { className: 'lb-val' }, h('b', null, d.me[cat.k]), cat.u ? h('small', null, ' ' + cat.u) : null)) : null;
    var joinCard = !demo && acc === 'ok' && CLAS.ready() && !joined && !d.loading ? h('div', { className: 'card lb-join' },
      h(UI.Mascot, { kind: 'caballo', mood: 'point', size: 72 }),
      h('div', null, h('b', null, 'Únete a la clasificación'),
        h('p', { className: 'small muted' }, 'Solo se muestra el nombre que elijas y tus cifras de juego (XP, racha, táctica, lecciones y memoria). Puedes salirte cuando quieras.'),
        h('div', { className: 'lb-join-row' },
          h('input', { value: nombre, maxLength: 20, onChange: function (ev) { setNombre(ev.target.value); }, placeholder: 'Tu nombre en la tabla', 'aria-label': 'Nombre en la clasificación' }),
          h('button', { className: 'btn btn-primary', onClick: join }, h('span', null, 'Unirme'))),
        msg ? h('p', { className: 'lj-err' }, msg) : null)) : null;
    var noAcc = !demo && !CLAS.ready() ? h('div', { className: 'card lb-empty' }, h('b', null, 'Inicia sesión para ver la clasificación'), h('p', { className: 'muted small' }, 'La clasificación usa tu cuenta para guardar tus cifras.')) : null;
    return h('div', { className: 'page-retos clasif' },
      h('div', { className: 'lb-head' }, h('h1', null, 'Clasificación'),
        scope === 'semana' ? h('span', { className: 'lb-reset' }, 'Se reinicia en ' + finSemana() + (finSemana() === 1 ? ' día' : ' días')) : null),
      d.demo ? h('p', { className: 'lb-demo' }, 'Vista de ejemplo: inicia sesión para ver la clasificación real.') : null,
      noAcc, joinCard, tabs, chips, list, mine,
      joined && !demo ? h('button', { className: 'btn btn-ghost lb-leave', onClick: function () { if (confirm('¿Quitar tu nombre de la clasificación?')) CLAS.leave().then(load); } }, h('span', null, 'Salir de la clasificación')) : null);
  }
  PAGES.clasificacion = Clasificacion;
})();
