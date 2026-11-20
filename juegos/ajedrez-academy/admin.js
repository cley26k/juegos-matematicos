/* Ajedrez Academy · panel de administración (#admin).
   Los datos salen de la función public.admin_usuarios() de Supabase, que solo responde a cuentas
   administradoras con sesión verificada (Google + código). Sin eso, este archivo no recibe nada. */
(function () {
  'use strict';
  var PAGES = window.AA_PAGES = window.AA_PAGES || {};
  var ONLINE_MS = 2.5 * 60e3, DAY = 864e5;
  window.AA_ES_ADMIN = false;

  function rpc(name) { var c = window.AA_CUENTA; return c && c.sb ? c.sb.rpc(name) : Promise.resolve({ data: null, error: { message: 'sin cuenta' } }); }
  function checkAdmin() {
    var c = window.AA_CUENTA; if (!c || !c.sb || c.demo) return;
    rpc('es_admin').then(function (r) { if (r && r.data === true) { window.AA_ES_ADMIN = true; addNav(); window.dispatchEvent(new Event('aa-admin')); } });
  }
  window.addEventListener('aa-cuenta', checkAdmin);
  if (window.AA_CUENTA) checkAdmin();

  /* Acceso en la barra lateral (y en el menú de cuenta del móvil), solo para administradores */
  var ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>';
  function addNav() {
    if (!window.AA_ES_ADMIN) return;
    var ul = document.querySelector('.rail ul');
    if (ul && !ul.querySelector('.aa-nav-admin')) {
      var li = document.createElement('li'); li.className = 'aa-own-li';
      li.innerHTML = '<button type="button" class="nav aa-nav-own aa-nav-admin" data-hash="admin"><span class="nav-ico">' + ICON + '</span><span class="nav-lbl">Admin</span></button>';
      var sep = ul.querySelector('li.aa-sep'); ul.insertBefore(li, sep || null);
      if (location.hash === '#admin') li.firstChild.classList.add('on');
    }
    var go = document.querySelector('#aa-chip .aa-go');
    if (go && !go.querySelector('[data-admin]')) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-admin', '1'); b.textContent = 'Admin';
      b.addEventListener('click', function () { location.hash = 'admin'; }); go.appendChild(b); }
  }
  new MutationObserver(function () { if (window.AA_ES_ADMIN) addNav(); }).observe(document.documentElement, { childList: true, subtree: true });

  /* ───── utilidades ───── */
  function parse(datos) { try { var v = datos && datos['chess-academy/v1']; return typeof v === 'string' ? JSON.parse(v) : (v || {}); } catch (e) { return {}; } }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function racha(days) { var s = {}; (days || []).forEach(function (d) { s[d] = 1; }); var d = new Date(), n = 0; if (!s[iso(d)]) d.setDate(d.getDate() - 1); while (s[iso(d)]) { n++; d.setDate(d.getDate() - 1); } return n; }
  function ago(t) { if (!t) return '—'; var ms = Date.now() - new Date(t).getTime(); if (ms < 60e3) return 'ahora'; var m = Math.round(ms / 60e3); if (m < 60) return 'hace ' + m + ' min';
    var h = Math.round(m / 60); if (h < 24) return 'hace ' + h + ' h'; var d = Math.round(h / 24); if (d < 30) return 'hace ' + d + (d === 1 ? ' día' : ' días'); var mo = Math.round(d / 30); return 'hace ' + mo + (mo === 1 ? ' mes' : ' meses'); }
  function fecha(t) { return t ? new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
  function fechaHora(t) { return t ? new Date(t).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }
  var SECC = { inicio: 'Inicio', tactica: 'Táctica', jugar: 'Jugar', aperturas: 'Aperturas', finales: 'Finales', partidas: 'Partidas', analisis: 'Análisis', evaluar: 'Evaluar', progreso: 'Progreso', clasificacion: 'Clasificación', memoria: 'Memoria', admin: 'Admin' };
  function seccion(p) { if (!p) return '—'; var h = p.replace(/^#/, ''); if (SECC[h]) return SECC[h]; if (/^leccion-/.test(h)) return 'Lección: ' + h.slice(8); if (/^(curso|aprender|practicar|tarjetas|entrenar-linea)-/.test(h)) return 'Aperturas'; if (/^revision-/.test(h)) return 'Revisando partida'; if (/^final-/.test(h)) return 'Finales'; return h.slice(0, 30); }

  function enrich(r) {
    var s = parse(r.datos), L = (window.AA_UI && window.AA_UI.lessons) || [], done = Object.keys(s.lessons || {}).filter(function (k) { return s.lessons[k] && s.lessons[k].done; });
    var tomos = {}; L.forEach(function (l) { var t = tomos[l.tomo] = tomos[l.tomo] || { total: 0, done: 0 }; t.total++; if (s.lessons && s.lessons[l.id] && s.lessons[l.id].done) t.done++; });
    var op = s.openings || {}, lines = Object.keys(op).filter(function (k) { return (op[k] && op[k].box || 0) >= 2; }).length;
    var seen = r.last_seen ? new Date(r.last_seen).getTime() : 0, last = Math.max(seen, r.ultimo_acceso ? new Date(r.ultimo_acceso).getTime() : 0, r.progreso_at ? new Date(r.progreso_at).getTime() : 0);
    return Object.assign({}, r, { s: s, xp: s.xp || 0, lessons: done.length, lessonsTotal: L.length || 165, tomos: tomos, rating: (s.puzzle && s.puzzle.rating) || 0, solved: (s.puzzle && s.puzzle.solved) || 0,
      failed: (s.puzzle && s.puzzle.failed) || 0, best: (s.puzzle && s.puzzle.best) || 0, racha: racha(s.days), dias: (s.days || []).length, lines: lines, rep: s.repertoire || [], games: s.games || [],
      endgames: Object.keys(s.endgames || {}).length, evals: s.evals || { ok: 0, n: 0 }, online: seen && Date.now() - seen < ONLINE_MS, last: last, level: s.level || '—', settings: s.settings || {} });
  }
  function demoRows() {
    var now = Date.now(), N = ['Lucía Fernández', 'Mateo Rojas', 'Valentina Pérez', 'Thiago Gómez', 'Camila Díaz', 'Benjamín López', 'Sofía Castro'];
    return N.map(function (n, i) { var days = []; for (var k = 0; k < 20 - i * 2; k++) if (Math.random() > .3) days.push(iso(new Date(now - k * DAY)));
      var lessons = {}; for (var j = 0; j < 40 - i * 5; j++) lessons['l' + j] = { done: true };
      return { user_id: 'demo-' + i, email: n.split(' ')[0].toLowerCase() + '.ejemplo@gmail.com', nombre: n, avatar: '', creado: new Date(now - (60 - i * 7) * DAY).toISOString(), ultimo_acceso: new Date(now - i * 3 * 3600e3).toISOString(),
        proveedores: ['google', 'email'], confirmado: new Date(now - 50 * DAY).toISOString(), progreso_at: new Date(now - i * 3600e3).toISOString(),
        last_seen: i < 2 ? new Date(now - 30e3).toISOString() : new Date(now - i * 5 * 3600e3).toISOString(), pagina: ['#tactica', '#leccion-clavada', '#aperturas', '#memoria', '#inicio', '#evaluar', '#jugar'][i], dispositivo: ['Android · Chrome', 'Windows · Edge', 'iOS · Safari', 'Windows · Chrome · app instalada', 'Mac · Safari', 'Android · Samsung', 'Linux · Firefox'][i],
        clasif_nombre: i < 4 ? n.split(' ')[0] : null, es_admin: i === 0,
        datos: { 'chess-academy/v1': JSON.stringify({ xp: 5200 - i * 640, level: ['intermedio', 'principiante', 'avanzado'][i % 3], days: days, lessons: lessons, puzzle: { rating: 1720 - i * 70, solved: 340 - i * 40, failed: 90 - i * 8, best: 14 - i },
          openings: { a: { box: 2 }, b: { box: 3 }, c: { box: 1 } }, repertoire: ['italiana', 'londres', 'caro-kann'].slice(0, 3 - (i % 3)), games: [{ white: 'Tú', black: 'Bot', result: '1-0', t: now - DAY }], evals: { ok: 30 - i, n: 44 }, endgames: { kqk: 1, krk: 1 }, settings: { theme: 'system', board: 'verde', notation: 'es' } }) } }; });
  }

  /* ───── página ───── */
  function Admin() {
    var UI = window.AA_UI, R = UI.React, h = R.createElement;
    var demo = !(window.AA_AUTH && window.AA_AUTH.url) || (window.AA_CUENTA && window.AA_CUENTA.demo);
    var st = R.useState({ loading: true, rows: [], err: null, at: null }), d = st[0], setD = st[1];
    var q = R.useState(''), query = q[0], setQuery = q[1];
    var f = R.useState('todos'), filt = f[0], setFilt = f[1];
    var o = R.useState('actividad'), sort = o[0], setSort = o[1];
    var sel = R.useState(null), open = sel[0], setOpen = sel[1];
    var tk = R.useState(0), tick = tk[0], setTick = tk[1];
    var acc = R.useState(window.AA_ES_ADMIN), isAdmin = acc[0], setAdmin = acc[1];
    R.useEffect(function () { function on() { setAdmin(true); } window.addEventListener('aa-admin', on); return function () { window.removeEventListener('aa-admin', on); }; }, []);
    function load() {
      if (demo) { setD({ loading: false, rows: demoRows().map(enrich), err: null, at: new Date(), demo: true }); return; }
      if (!window.AA_CUENTA || !window.AA_CUENTA.sb) { setD({ loading: false, rows: [], err: 'sesion', at: null }); return; }
      rpc('admin_usuarios').then(function (r) {
        if (r.error) { setD({ loading: false, rows: [], err: /autorizado|42501|permission/i.test(r.error.message + (r.error.code || '')) ? 'acceso' : r.error.message, at: null }); return; }
        setD({ loading: false, rows: (r.data || []).map(enrich), err: null, at: new Date() }); });
    }
    R.useEffect(load, [isAdmin]);
    R.useEffect(function () { var t = setInterval(function () { if (!document.hidden) { load(); setTick(function (x) { return x + 1; }); } }, 30e3); return function () { clearInterval(t); }; }, []);

    if (d.err === 'acceso' || (!demo && d.err === 'sesion')) return h('div', { className: 'page-retos adm' }, h('div', { className: 'adm-denied' }, h(UI.Mascot, { kind: 'torre', mood: 'oops', size: 96 }),
      h('b', null, 'Zona solo para administradores'), h('p', { className: 'muted' }, d.err === 'sesion' ? 'Inicia sesión con una cuenta de administrador.' : 'Tu cuenta no tiene acceso a este panel.')));

    var rows = d.rows, now = Date.now();
    var kpi = { total: rows.length, online: rows.filter(function (r) { return r.online; }).length,
      hoy: rows.filter(function (r) { return r.last && now - r.last < DAY; }).length, semana: rows.filter(function (r) { return r.last && now - r.last < 7 * DAY; }).length,
      nuevos: rows.filter(function (r) { return r.creado && now - new Date(r.creado).getTime() < 7 * DAY; }).length, conProg: rows.filter(function (r) { return r.datos; }).length,
      xp: rows.reduce(function (a, r) { return a + r.xp; }, 0) };
    var list = rows.filter(function (r) {
      var t = (query || '').toLowerCase().trim(); if (t && ((r.nombre || '') + ' ' + (r.email || '') + ' ' + (r.clasif_nombre || '')).toLowerCase().indexOf(t) < 0) return false;
      if (filt === 'online') return r.online; if (filt === 'hoy') return r.last && now - r.last < DAY; if (filt === 'semana') return r.last && now - r.last < 7 * DAY;
      if (filt === 'inactivos') return !r.last || now - r.last >= 7 * DAY; if (filt === 'sinprog') return !r.datos; return true; });
    var K = { actividad: function (r) { return r.online ? 1e15 + r.last : r.last; }, xp: function (r) { return r.xp; }, lecciones: function (r) { return r.lessons; }, racha: function (r) { return r.racha; }, rating: function (r) { return r.rating; }, registro: function (r) { return new Date(r.creado || 0).getTime(); } };
    list = list.slice().sort(function (a, b) { return K[sort](b) - K[sort](a); });
    function av(r, big) { return r.avatar ? h('img', { className: 'adm-av' + (big ? ' big' : ''), src: r.avatar, alt: '', referrerPolicy: 'no-referrer' })
      : h('span', { className: 'adm-av' + (big ? ' big' : '') }, ((r.nombre || r.email || '?').trim().charAt(0) || '?').toUpperCase()); }
    function estado(r) { return r.online ? h('span', { className: 'adm-st on' }, h('i'), 'En línea') : h('span', { className: 'adm-st' + (r.last && now - r.last < DAY ? ' today' : '') }, h('i'), ago(r.last)); }
    var Card = function (p) { return h('div', { className: 'adm-kpi ' + (p.c || '') }, h('small', null, p.t), h('b', null, p.v), p.s ? h('span', null, p.s) : null); };

    var onlineList = rows.filter(function (r) { return r.online; });
    return h('div', { className: 'page-retos adm' },
      h('section', { className: 'adm-hero' },
        h('div', null, h('span', { className: 'adm-kicker' }, 'Panel de administración'), h('h1', null, 'Usuarios'),
          h('p', null, d.at ? 'Actualizado ' + d.at.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · se refresca cada 30 s' : 'Cargando…')),
        h('button', { className: 'adm-refresh', onClick: load, 'aria-label': 'Actualizar' }, h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('path', { d: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7' })), 'Actualizar')),
      d.demo ? h('p', { className: 'lb-demo' }, 'Vista de ejemplo con datos inventados: con tu cuenta de administrador verás los usuarios reales.') : null,
      h('div', { className: 'adm-kpis' },
        h(Card, { t: 'Usuarios', v: kpi.total, s: kpi.conProg + ' con progreso guardado' }),
        h(Card, { t: 'En línea ahora', v: kpi.online, s: 'últimos 2 min', c: 'green' }),
        h(Card, { t: 'Activos hoy', v: kpi.hoy, s: kpi.total ? Math.round(kpi.hoy / kpi.total * 100) + '% del total' : '' }),
        h(Card, { t: 'Activos 7 días', v: kpi.semana }),
        h(Card, { t: 'Nuevos esta semana', v: kpi.nuevos, c: 'blue' }),
        h(Card, { t: 'XP total', v: kpi.xp.toLocaleString('es') })),
      onlineList.length ? h('div', { className: 'adm-online' }, h('b', null, h('i', { className: 'adm-pulse' }), 'Ahora mismo'),
        onlineList.map(function (r) { return h('button', { key: r.user_id, className: 'adm-chip', onClick: function () { setOpen(r.user_id); } }, av(r), h('span', null, r.nombre || r.email, h('small', null, seccion(r.pagina)))); })) : null,
      h('div', { className: 'adm-tools' },
        h('label', { className: 'adm-search' }, h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('circle', { cx: 11, cy: 11, r: 7 }), h('path', { d: 'M20 20l-3.5-3.5' })),
          h('input', { value: query, onChange: function (e) { setQuery(e.target.value); }, placeholder: 'Buscar por nombre o correo', 'aria-label': 'Buscar usuario' })),
        h('div', { className: 'adm-seg' }, [['todos', 'Todos'], ['online', 'En línea'], ['hoy', 'Hoy'], ['semana', '7 días'], ['inactivos', 'Inactivos'], ['sinprog', 'Sin progreso']].map(function (x) {
          return h('button', { key: x[0], className: filt === x[0] ? 'on' : '', onClick: function () { setFilt(x[0]); } }, x[1]); })),
        h('select', { className: 'adm-sort', value: sort, onChange: function (e) { setSort(e.target.value); }, 'aria-label': 'Ordenar' },
          [['actividad', 'Última actividad'], ['xp', 'XP'], ['lecciones', 'Lecciones'], ['racha', 'Racha'], ['rating', 'Rating de táctica'], ['registro', 'Fecha de registro']].map(function (x) { return h('option', { key: x[0], value: x[0] }, 'Ordenar: ' + x[1]); }))),
      d.loading ? h('div', { className: 'lb-skel' }, [0, 1, 2, 3].map(function (i) { return h('i', { key: i }); }))
        : !list.length ? h('div', { className: 'lb-empty' }, h('b', null, 'Ningún usuario con ese filtro.'))
        : h('div', { className: 'adm-table', role: 'table' },
            h('div', { className: 'adm-tr adm-th', role: 'row' }, ['Usuario', 'Estado', 'XP', 'Lecciones', 'Táctica', 'Racha', 'Aperturas', 'Registro', 'Dispositivo'].map(function (t) { return h('span', { key: t, role: 'columnheader' }, t); })),
            list.map(function (r) { return h('button', { key: r.user_id, className: 'adm-tr' + (open === r.user_id ? ' sel' : ''), role: 'row', onClick: function () { setOpen(r.user_id); } },
              h('span', { className: 'adm-user' }, av(r), h('span', null, h('b', null, r.nombre || '(sin nombre)', r.es_admin ? h('em', null, 'admin') : null), h('small', null, r.email))),
              h('span', null, estado(r), r.online ? h('small', { className: 'adm-where' }, seccion(r.pagina)) : null),
              h('span', { className: 'num' }, r.xp.toLocaleString('es')),
              h('span', null, h('span', { className: 'adm-bar' }, h('i', { style: { width: Math.min(100, r.lessons / r.lessonsTotal * 100) + '%' } })), h('small', null, r.lessons + '/' + r.lessonsTotal)),
              h('span', { className: 'num' }, r.rating || '—', r.solved ? h('small', null, r.solved + ' resueltos') : null),
              h('span', { className: 'num' }, r.racha ? r.racha + ' d' : '—'),
              h('span', { className: 'num' }, r.lines, h('small', null, r.rep.length + ' en repertorio')),
              h('span', null, fecha(r.creado)),
              h('span', { className: 'adm-dev' }, r.dispositivo || '—')); })),
      open ? h(Detail, { r: rows.find(function (x) { return x.user_id === open; }), onClose: function () { setOpen(null); }, av: av, estado: estado }) : null);
  }

  function Detail(p) {
    var UI = window.AA_UI, h = UI.React.createElement, r = p.r;
    UI.React.useEffect(function () { function k(e) { if (e.key === 'Escape') p.onClose(); } addEventListener('keydown', k); return function () { removeEventListener('keydown', k); }; }, []);
    if (!r) return null;
    var days = {}; (r.s.days || []).forEach(function (x) { days[x] = 1; });
    var cells = []; for (var i = 83; i >= 0; i--) { var dd = new Date(Date.now() - i * DAY), k = iso(dd); cells.push(h('i', { key: k, className: days[k] ? 'on' : '', title: dd.toLocaleDateString('es') + (days[k] ? ' · practicó' : '') })); }
    var Row = function (q) { return h('div', { className: 'adm-kv' }, h('span', null, q.k), h('b', null, q.v)); };
    var tomos = Object.keys(r.tomos).sort().map(function (t) { var x = r.tomos[t]; return h('div', { key: t, className: 'adm-tomo' }, h('span', null, 'Tomo ' + ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][t]),
      h('span', { className: 'adm-bar' }, h('i', { style: { width: (x.total ? x.done / x.total * 100 : 0) + '%' } })), h('small', null, x.done + '/' + x.total)); });
    var games = (r.games || []).slice(0, 5);
    return h('div', { className: 'adm-drawer-wrap', onClick: function (e) { if (e.target === e.currentTarget) p.onClose(); } },
      h('aside', { className: 'adm-drawer', role: 'dialog', 'aria-label': 'Ficha de ' + (r.nombre || r.email) },
        h('button', { className: 'adm-close', onClick: p.onClose, 'aria-label': 'Cerrar' }, '×'),
        h('div', { className: 'adm-dh' }, p.av(r, true), h('div', null, h('b', null, r.nombre || '(sin nombre)'), h('small', null, r.email), p.estado(r))),
        h('div', { className: 'adm-stats' },
          [['XP', r.xp.toLocaleString('es')], ['Racha', r.racha + ' d'], ['Días', r.dias], ['Lecciones', r.lessons], ['Táctica', r.rating || '—'], ['Líneas', r.lines]].map(function (x) { return h('span', { key: x[0] }, h('b', null, x[1]), h('small', null, x[0])); })),
        h('h3', null, 'Actividad (12 semanas)'), h('div', { className: 'adm-heat' }, cells),
        h('h3', null, 'Lecciones por tomo'), h('div', null, tomos),
        h('h3', null, 'Táctica y práctica'),
        h(Row, { k: 'Problemas resueltos / fallados', v: r.solved + ' / ' + r.failed }), h(Row, { k: 'Mejor racha en táctica', v: r.best }),
        h(Row, { k: 'Evaluar: aciertos', v: r.evals.n ? r.evals.ok + '/' + r.evals.n + ' (' + Math.round(r.evals.ok / r.evals.n * 100) + '%)' : '—' }),
        h(Row, { k: 'Finales superados', v: r.endgames }), h(Row, { k: 'Partidas jugadas', v: r.games.length }),
        games.length ? h('ul', { className: 'adm-games' }, games.map(function (g, i) { return h('li', { key: i }, (g.white || '?') + ' – ' + (g.black || '?') + ' · ' + (g.result || '*') + (g.t ? ' · ' + fecha(g.t) : '')); })) : null,
        h('h3', null, 'Aperturas'), h(Row, { k: 'Repertorio', v: r.rep.length ? r.rep.join(', ') : '—' }), h(Row, { k: 'Líneas aprendidas', v: r.lines }),
        h('h3', null, 'Cuenta'),
        h(Row, { k: 'Registro', v: fechaHora(r.creado) }), h(Row, { k: 'Último inicio de sesión', v: fechaHora(r.ultimo_acceso) }),
        h(Row, { k: 'Visto por última vez', v: fechaHora(r.last_seen) + (r.pagina ? ' · ' + seccion(r.pagina) : '') }), h(Row, { k: 'Dispositivo', v: r.dispositivo || '—' }),
        h(Row, { k: 'Progreso guardado', v: fechaHora(r.progreso_at) }), h(Row, { k: 'Acceso', v: (r.proveedores || []).join(' + ') || '—' }),
        h(Row, { k: 'Nivel elegido', v: r.level }), h(Row, { k: 'Clasificación', v: r.clasif_nombre ? 'Sí, como «' + r.clasif_nombre + '»' : 'No se ha unido' }),
        h(Row, { k: 'Ajustes', v: [r.settings.theme, r.settings.board, r.settings.notation].filter(Boolean).join(' · ') || '—' }),
        h(Row, { k: 'Administrador', v: r.es_admin ? 'Sí' : 'No' }),
        h('p', { className: 'adm-id' }, 'ID: ' + r.user_id)));
  }
  PAGES.admin = Admin;
})();
