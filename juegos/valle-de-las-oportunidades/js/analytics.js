'use strict';
// Analíticas educativas locales y panel docente. Nada sale del navegador:
// los registros se guardan en localStorage con identificadores anónimos.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const el = VO.el, M = VO.MathEngine;
  const A = (VO.Analytics = {});
  const G = () => VO.G;
  const KEY = (id) => 'valle_log_' + id;
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* lleno o bloqueado */ } };

  let buf = [];
  A.log = function (e) {
    const s = G().state; if (!s) return;
    const entry = Object.assign({ t: Date.now(), id: s.anonId, day: s.day, mode: s.mode, cat: 'math' }, e);
    if (e.type === 'hint') entry.cat = 'math';
    buf.push(entry);
    if (VO.DB) VO.DB.push(entry);
    flush();
  };
  A.game = function (code, detail) { A.log({ type: 'game_error', cat: 'game', code, detail: detail || null }); };
  function flush() {
    const s = G().state; if (!s || !buf.length) return;
    const list = read(KEY(s.anonId), []); list.push(...buf); buf = [];
    if (list.length > 5000) list.splice(0, list.length - 5000);
    write(KEY(s.anonId), list);
    const ids = read('valle_students', []); if (!ids.includes(s.anonId)) { ids.push(s.anonId); write('valle_students', ids); }
  }
  A.logsFor = (id) => read(KEY(id), []);
  A.allIds = () => read('valle_students', []);

  // ---------- Métricas ----------
  A.metrics = function (logs) {
    const att = logs.filter((l) => l.type === 'attempt');
    const errs = {}; att.forEach((l) => { if (l.error) errs[l.error] = (errs[l.error] || 0) + 1; });
    const gameErr = {}; logs.filter((l) => l.type === 'game_error').forEach((l) => { gameErr[l.code] = (gameErr[l.code] || 0) + 1; });
    const done = [...new Set(logs.filter((l) => l.type === 'mission_done').map((l) => l.mission))];
    const hints = logs.filter((l) => l.type === 'hint').length;
    // tiempo en matemáticas: inicio de misión → fin (máximo 20 min por misión)
    let mathMs = 0; const starts = {};
    logs.forEach((l) => { if (l.type === 'mission_start') starts[l.mission] = l.t; if (l.type === 'mission_done' && starts[l.mission]) { mathMs += Math.min(20 * 60000, l.t - starts[l.mission]); delete starts[l.mission]; } });
    // evidencias por contenido: tareas de libreta resueltas al primer intento sin pista algebraica
    const content = {};
    Object.keys(VO.CONTENTS).forEach((k) => (content[k] = { ok: 0, tries: 0, firstTry: new Set(), missions: new Set() }));
    const byMissionStage = {};
    att.forEach((l) => { const k = l.mission + '|' + l.stage; (byMissionStage[k] = byMissionStage[k] || []).push(l); });
    for (const k in byMissionStage) {
      const [mid, stage] = k.split('|'); const m = VO.MISSION_BY_ID[mid]; if (!m) continue;
      const arr = byMissionStage[k];
      const first = arr[0]; const solved = arr.some((x) => x.correct);
      m.contents.forEach((c) => { const ct = content[c]; ct.tries += arr.length; if (solved) ct.ok++; if (first.correct && (first.hintLevel || 1) < 4 && stage !== 'action') { ct.firstTry.add(mid + stage); ct.missions.add(mid); } });
    }
    const mastery = {};
    for (const c in content) {
      const ct = content[c];
      const ev = ct.firstTry.size, ms = ct.missions.size;
      mastery[c] = ct.tries === 0 ? 'Sin datos' : ms >= 2 && ev >= 4 ? 'Dominio con evidencia' : ev >= 2 ? 'En progreso' : 'Inicial';
      content[c] = { tries: ct.tries, solved: ct.ok, evidence: ev, missions: ms };
    }
    // capacidades específicas
    const stageRate = (stage) => { const a = att.filter((l) => l.stage === stage); return a.length ? Math.round(100 * a.filter((l) => l.correct).length / a.length) : null; };
    return { attempts: att.length, correct: att.filter((l) => l.correct).length, errs, gameErr, done, hints, mathMin: Math.round(mathMs / 60000), content, mastery,
      formulate: stageRate('ineq'), interval: stageRate('interval'), set: stageRate('set'), check: stageRate('check'), action: stageRate('action'),
      systems: (() => { const a = att.filter((l) => VO.MISSION_BY_ID[l.mission] && VO.MISSION_BY_ID[l.mission].inequalities.length > 1 && l.stage === 'interval'); return a.length ? Math.round(100 * a.filter((l) => l.correct).length / a.length) : null; })() };
  };

  // ---------- Registro del estudiante (transparencia) ----------
  A.studentInfo = function () {
    const s = G().state; const m = A.metrics(A.logsFor(s.anonId));
    VO.UI.open('Mi registro de aprendizaje', el('div', {},
      el('p', {}, 'Tu identificador anónimo es ', el('b', {}, s.anonId), '. El juego guarda tus intentos en las misiones, las pistas que pides y los errores más comunes, para que tu docente pueda ayudarte mejor. No guarda tu nombre real.'),
      VO.DB && VO.DB.enabled() ? el('div', { class: 'card' }, el('b', {}, 'Tu partida en la nube · clase ' + VO.DB.cfg().clase), el('p', {}, 'Tus registros se envían a tu docente de forma anónima. Para continuar en otra computadora, anota estos datos:'), el('p', {}, 'Código: ', el('code', {}, s.anonId), ' · Clave personal: ', el('code', {}, s.token || '—'), ' · Ranura: ', el('code', {}, String(s.slot || 1)))) : el('p', { class: 'small muted' }, 'Este equipo no está conectado a internet: todo se queda aquí.'),
      el('div', { class: 'row wrap kpis' }, kpi('Misiones completadas', m.done.length), kpi('Intentos', m.attempts), kpi('Pistas usadas', m.hints), kpi('Minutos en misiones', m.mathMin)),
      el('h4', {}, 'Cómo vas por tema'), masteryTable(m)), { wide: true, paper: true, icon: 'notebook' });
  };
  function kpi(t, v) { return el('div', { class: 'kpi' }, el('div', { class: 'small muted' }, t), el('b', {}, v === null || v === undefined ? '—' : v)); }
  function masteryTable(m) {
    const t = el('table', { class: 'tbl' }, el('tr', {}, el('th', {}, 'Contenido'), el('th', {}, 'Intentos'), el('th', {}, 'Evidencias'), el('th', {}, 'Estado')));
    for (const c in VO.CONTENTS) t.appendChild(el('tr', {}, el('td', {}, VO.CONTENTS[c]), el('td', {}, m.content[c].tries), el('td', {}, m.content[c].evidence), el('td', { class: m.mastery[c] === 'Dominio con evidencia' ? 'win' : '' }, m.mastery[c])));
    return t;
  }
  A.summaryModal = function (end) {
    const s = G().state; const m = A.metrics(A.logsFor(s.anonId));
    VO.UI.open(end ? 'Fin de la sesión de clase' : 'Resumen', el('div', {},
      el('p', {}, end ? '¡Se acabó el tiempo de la clase! Muestra esta pantalla a tu docente si te lo pide.' : ''),
      el('p', {}, 'Identificador: ', el('b', {}, s.anonId)),
      el('div', { class: 'row wrap kpis' }, kpi('Misiones', m.done.length), kpi('Intentos', m.attempts), kpi('Aciertos', m.correct), kpi('Pistas', m.hints)),
      masteryTable(m),
      el('div', { class: 'row end' }, el('button', { class: 'btn', onclick: () => { VO.UI.close(); } }, 'Seguir explorando'))), { wide: true, paper: true, noClose: false, icon: 'notebook' });
  };

  // ---------- Panel docente ----------
  A.teacherConfig = () => {
    const c = read('valle_teacher', { pin: '', pinSet: false, minutes: 40, money: 600, hints: true, contents: Object.keys(VO.CONTENTS), missions: null, items: { wood: 20, sardina: 20, plank: 10, stone: 10, fiber: 10, guayaba: 6 }, difficulty: 'normal' });
    if (c.pin && c.pin !== '1234' && c.pinSet === undefined) c.pinSet = true; // migración de versiones anteriores
    // configuración enviada por el docente a la clase en línea (para los equipos de los estudiantes)
    const remote = read('valle_teacher_remote', null);
    if (remote && VO.DB && VO.DB.enabled()) ['minutes', 'money', 'hints', 'difficulty', 'missions', 'items'].forEach((k) => { if (remote[k] !== undefined) c[k] = remote[k]; });
    return c;
  };
  A.saveTeacher = (c) => write('valle_teacher', c);
  A.openTeacher = function () {
    const cfg = A.teacherConfig();
    const pin = el('input', { type: 'password', class: 'qty wide', placeholder: 'PIN', 'aria-label': 'PIN docente', inputmode: 'numeric' });
    const msg = el('p', { class: 'small muted' }, 'PIN inicial: 1234. Cámbialo en la pestaña Configuración.');
    VO.UI.open('Panel docente', el('div', {}, el('p', {}, 'Introduce el PIN docente.'), pin, msg, el('div', { class: 'row end' }, el('button', { class: 'btn ok', onclick: () => { if (pin.value === cfg.pin) { VO.UI.close(); panel(); } else { msg.textContent = 'PIN incorrecto.'; } } }, 'Entrar'))), { paper: true, icon: 'notebook' });
    pin.focus();
  };
  function panel() {
    const ids = A.allIds();
    const c = el('div', { class: 'teacher' });
    const tabs = el('div', { class: 'tabs' }); const tc = el('div', { class: 'tabc' });
    const T = [['Resumen del grupo', summary], ['Por estudiante', student], ['Errores', errors], ['Configuración del aula', config], ['Exportar', exportTab], ['Privacidad', privacy]];
    T.forEach(([t, fn], i) => tabs.appendChild(el('button', { class: 'tab' + (i ? '' : ' on'), onclick: (e) => { tabs.querySelectorAll('.tab').forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); fn(); } }, t)));
    function summary() {
      tc.innerHTML = '';
      if (!ids.length) { tc.appendChild(el('p', { class: 'muted' }, 'Todavía no hay registros en este navegador.')); return; }
      const t = el('table', { class: 'tbl' }, el('tr', {}, ...['Estudiante', 'Misiones', 'Intentos', '% acierto', 'Pistas', 'Formular', 'Intervalos', 'Conj. solución', 'Sistemas', 'Errores de juego', 'Min. matemáticas'].map((h) => el('th', {}, h))));
      ids.forEach((id) => { const m = A.metrics(A.logsFor(id)); const ge = Object.values(m.gameErr).reduce((a, b) => a + b, 0); const pc = (v) => (v === null ? '—' : v + ' %'); t.appendChild(el('tr', {}, el('td', {}, id), el('td', {}, m.done.length), el('td', {}, m.attempts), el('td', {}, m.attempts ? Math.round(100 * m.correct / m.attempts) + ' %' : '—'), el('td', {}, m.hints), el('td', {}, pc(m.formulate)), el('td', {}, pc(m.interval)), el('td', {}, pc(m.set)), el('td', {}, pc(m.systems)), el('td', {}, ge), el('td', {}, m.mathMin))); });
      tc.append(el('p', { class: 'small muted' }, 'Porcentajes de acierto por tipo de tarea de la libreta. Completar una misión no se considera dominio: el estado de cada contenido requiere evidencias al primer intento en al menos dos misiones.'), t);
    }
    function student() {
      tc.innerHTML = '';
      if (!ids.length) { tc.appendChild(el('p', { class: 'muted' }, 'Sin registros.')); return; }
      const sel = el('select', {}); ids.forEach((id) => sel.appendChild(el('option', { value: id }, id)));
      const out = el('div');
      const show = () => {
        out.innerHTML = '';
        const logs = A.logsFor(sel.value); const m = A.metrics(logs);
        out.append(el('h4', {}, 'Desempeño por contenido'), masteryTable(m));
        // evolución: acierto acumulado por intento
        const att = logs.filter((l) => l.type === 'attempt');
        const cv = el('canvas', { width: 520, height: 160, class: 'chart' }); const ctx = cv.getContext('2d');
        VO.UI.chartAxes(ctx, 520, 160, Math.max(1, att.length), 100, 'intentos', '% acierto acumulado');
        let ok = 0; ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 2; ctx.beginPath();
        att.forEach((l, i) => { if (l.correct) ok++; const X = 30 + ((i + 1) / Math.max(1, att.length)) * 480, Y = 140 - (ok / (i + 1)) * 130; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
        out.append(el('h4', {}, 'Evolución individual'), cv, el('h4', {}, 'Distribución de errores matemáticos'), errBars(m.errs), el('h4', {}, 'Errores de manejo del juego (no algebraicos)'), errBars(m.gameErr, true));
        const hist = el('table', { class: 'tbl small' }, el('tr', {}, ...['Hora', 'Misión', 'Etapa', 'Respuesta', 'Resultado', 'Error', 'Pista'].map((h) => el('th', {}, h))));
        att.slice(-60).reverse().forEach((l) => hist.appendChild(el('tr', {}, el('td', {}, new Date(l.t).toLocaleTimeString('es-DO')), el('td', {}, l.mission), el('td', {}, stageName(l.stage)), el('td', {}, String(l.value === undefined ? '' : l.value)), el('td', { class: l.correct ? 'win' : 'bad' }, l.correct ? '✔' : '✗'), el('td', {}, l.error ? M.ERRORS[l.error] : ''), el('td', {}, l.hintLevel || 1))));
        out.append(el('h4', {}, 'Historial de respuestas (últimas 60)'), hist);
      };
      sel.onchange = show; tc.append(el('label', {}, 'Estudiante: ', sel), out); show();
    }
    function errors() {
      tc.innerHTML = '';
      const all = {}; const game = {};
      ids.forEach((id) => { const m = A.metrics(A.logsFor(id)); for (const k in m.errs) all[k] = (all[k] || 0) + m.errs[k]; for (const k in m.gameErr) game[k] = (game[k] || 0) + m.gameErr[k]; });
      tc.append(el('h4', {}, 'Errores matemáticos del grupo'), errBars(all), el('h4', {}, 'Errores de manejo del videojuego'), errBars(game, true), el('p', { class: 'small muted' }, 'Los errores de manejo (inventario lleno, herramienta incorrecta, falta de recursos) se registran aparte y no cuentan como errores algebraicos.'));
    }
    function config() {
      tc.innerHTML = '';
      const cfg2 = A.teacherConfig();
      const num = (lab, key, min, max) => el('label', { class: 'set' }, lab, el('input', { type: 'number', min, max, value: cfg2[key], class: 'qty', onchange: (e) => { cfg2[key] = +e.target.value; } }));
      const contents = el('div', { class: 'row wrap' }); Object.keys(VO.CONTENTS).forEach((k) => contents.appendChild(el('label', { class: 'small' }, el('input', { type: 'checkbox', checked: cfg2.contents.includes(k) ? 'checked' : null, onchange: (e) => { cfg2.contents = e.target.checked ? [...cfg2.contents, k] : cfg2.contents.filter((x) => x !== k); } }), ' ' + VO.CONTENTS[k])));
      const ms = el('div', { class: 'mlist' });
      VO.MISSIONS.forEach((m) => ms.appendChild(el('label', { class: 'small' }, el('input', { type: 'checkbox', checked: !cfg2.missions || cfg2.missions.includes(m.id) ? 'checked' : null, onchange: (e) => { const cur = cfg2.missions || VO.MISSIONS.map((x) => x.id); cfg2.missions = e.target.checked ? [...new Set([...cur, m.id])] : cur.filter((x) => x !== m.id); } }), ` Cap. ${m.chapter} · ${m.title} (${VO.NPCS[m.npc].name})`)));
      const items = el('div', { class: 'row wrap' }); ['wood', 'sardina', 'plank', 'stone', 'fiber', 'guayaba', 'clay', 'coal'].forEach((k) => items.appendChild(el('label', { class: 'small' }, VO.ITEMS[k].name + ' ', el('input', { type: 'number', min: 0, max: 99, class: 'qty', value: cfg2.items[k] || 0, onchange: (e) => { cfg2.items[k] = +e.target.value; } }))));
      tc.append(el('p', { class: 'small muted' }, 'Esta configuración se aplica al iniciar una partida en Modo aula en este navegador.'),
        num('Duración de la sesión (minutos)', 'minutes', 10, 120), num('Dinero inicial', 'money', 0, 5000),
        el('label', { class: 'set' }, el('input', { type: 'checkbox', checked: cfg2.hints ? 'checked' : null, onchange: (e) => { cfg2.hints = e.target.checked; } }), ' Permitir pistas'),
        el('label', { class: 'set' }, 'Dificultad ', (() => { const s = el('select', { onchange: (e) => { cfg2.difficulty = e.target.value; } }); [['suave', 'Suave (más pistas automáticas)'], ['normal', 'Normal'], ['reto', 'Reto (sin pistas automáticas)']].forEach(([v, t]) => s.appendChild(el('option', { value: v, selected: cfg2.difficulty === v ? 'selected' : null }, t))); return s; })()),
        el('h4', {}, 'Contenidos matemáticos'), contents, el('p', { class: 'small muted' }, 'Al guardar, se seleccionan automáticamente las misiones que trabajan esos contenidos (puedes ajustarlas abajo).'),
        el('h4', {}, 'Misiones disponibles'), ms, el('h4', {}, 'Recursos iniciales'), items,
        el('label', { class: 'set' }, 'Nuevo PIN ', el('input', { type: 'password', class: 'qty', value: cfg2.pin, onchange: (e) => { if (e.target.value.length >= 4) cfg2.pin = e.target.value; } })),
        el('div', { class: 'row end' }, el('button', { class: 'btn', onclick: () => { cfg2.missions = VO.MISSIONS.filter((m) => m.contents.some((c) => cfg2.contents.includes(c))).map((m) => m.id); A.saveTeacher(cfg2); config(); VO.UI.toast('Misiones ajustadas a los contenidos.', 'ok'); } }, 'Ajustar misiones a contenidos'), el('button', { class: 'btn ok', onclick: () => { A.saveTeacher(cfg2); VO.UI.toast('Configuración guardada.', 'ok'); } }, 'Guardar')));
    }
    function exportTab() {
      tc.innerHTML = '';
      tc.append(el('p', {}, 'Descarga los registros de todos los estudiantes de este navegador. Solo contienen identificadores anónimos.'),
        el('div', { class: 'row' }, el('button', { class: 'btn ok', onclick: () => download('valle_registros.csv', toCSV(), 'text/csv') }, 'Descargar CSV'), el('button', { class: 'btn ok', onclick: () => download('valle_registros.json', JSON.stringify(ids.map((id) => ({ id, metrics: summarizeForExport(A.metrics(A.logsFor(id))), logs: A.logsFor(id) })), null, 2), 'application/json') }, 'Descargar JSON')),
        el('h4', {}, 'Borrar datos'), el('button', { class: 'btn', onclick: () => VO.UI.confirm('¿Borrar TODOS los registros de aprendizaje de este navegador? No se puede deshacer.', () => { ids.forEach((id) => localStorage.removeItem(KEY(id))); localStorage.removeItem('valle_students'); VO.UI.toast('Registros borrados.', 'ok'); }) }, 'Borrar registros'));
    }
    function privacy() {
      tc.innerHTML = '';
      tc.append(el('p', {}, 'El juego no envía información a ningún servidor. Todo se guarda en el almacenamiento local de este navegador.'), el('p', {}, 'Cada estudiante recibe un identificador anónimo aleatorio (por ejemplo EST-7F3KQ). El nombre del personaje no se exporta.'), el('p', {}, 'Los estudiantes pueden ver qué se registra desde el menú de pausa → “Mi registro de aprendizaje”.'));
    }
    summary();
    c.append(tabs, tc);
    VO.UI.open('Panel docente', c, { wide: true, paper: true, icon: 'notebook', cls: 'teachermodal' });
  }
  A.download = (...a) => download(...a); A.errBars = (...a) => errBars(...a); A.masteryTable = (...a) => masteryTable(...a); A.stageName = (s) => stageName(s);
  function stageName(s) { return { action: 'Decisión en el mundo', ineq: 'Formular inecuación', interval: 'Intervalo', set: 'Conjunto solución', check: 'Comprobar valores' }[s] || s; }
  function errBars(obj, game) {
    const names = game ? { inventario_lleno: 'Inventario lleno', herramienta_incorrecta: 'Herramienta incorrecta', dinero_insuficiente: 'Dinero insuficiente', sin_energia: 'Sin energía', recursos_insuficientes: 'Faltan recursos para la misión', horario_empleo: 'Fuera de horario', siembra_sin_preparar: 'Sembrar sin preparar', casillas_vacias: 'Casillas vacías en la libreta' } : M.ERRORS;
    const keys = Object.keys(obj); if (!keys.length) return el('p', { class: 'muted small' }, 'Sin registros.');
    const mx = Math.max(...keys.map((k) => obj[k]));
    return el('div', { class: 'bars' }, keys.sort((a, b) => obj[b] - obj[a]).map((k) => el('div', { class: 'bar' }, el('span', { class: 'bl' }, names[k] || k), el('span', { class: 'bv' }, el('i', { style: 'width:' + (obj[k] / mx * 100) + '%' })), el('b', {}, obj[k]))));
  }
  function summarizeForExport(m) { return { misiones: m.done.length, intentos: m.attempts, aciertos: m.correct, pistas: m.hints, minutos_matematicas: m.mathMin, dominio: m.mastery, errores: m.errs, errores_juego: m.gameErr }; }
  function toCSV() {
    const rows = [['id', 'fecha', 'dia_juego', 'modo', 'categoria', 'tipo', 'mision', 'etapa', 'respuesta', 'correcto', 'error', 'nivel_pista', 'ms', 'detalle']];
    A.allIds().forEach((id) => A.logsFor(id).forEach((l) => rows.push([id, new Date(l.t).toISOString(), l.day, l.mode, l.cat, l.type, l.mission || '', l.stage || '', l.value === undefined ? '' : l.value, l.correct === undefined ? '' : l.correct, l.error || l.code || '', l.hintLevel || l.level || '', l.ms || '', l.detail || l.id2 || ''])));
    return rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  }
  function download(name, text, type) {
    const b = new Blob(['﻿' + text], { type: type + ';charset=utf-8' });
    const a = el('a', { href: URL.createObjectURL(b), download: name }); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
})();
