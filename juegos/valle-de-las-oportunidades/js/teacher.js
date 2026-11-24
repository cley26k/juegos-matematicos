'use strict';
// Panel docente rediseñado: guiado, visual y fácil de configurar.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const el = VO.el, A = VO.Analytics, M = VO.MathEngine, D = VO.DB;
  const T = (VO.Teacher = {});
  const ic = (id) => el('img', { src: VO.Art.iconURL(id), alt: '', class: 'tico' });
  const ses = { clave: null, cloud: null, view: 'inicio', source: 'local' };

  const TIPS = {
    estricta_inclusiva: ['Confunden “al menos” con “más de”.', 'Repase en la recta: punto relleno = incluido, punto hueco = excluido. Libro en el juego: «Desigualdades para la vida diaria».'],
    signo_negativo: ['Olvidan invertir el signo al dividir entre un negativo.', 'Pida comprobar con un valor (x = 0) antes y después de dividir. Misión ideal: «Ventanas nuevas». Libro: «El giro del signo».'],
    interseccion: ['Les cuesta combinar dos condiciones a la vez.', 'Que dibujen cada condición con un color y marquen solo donde se superponen. Misión: «La nevera de Marina».'],
    particular_conjunto: ['Encuentran un valor que sirve, pero no todos.', 'Pregunte “¿y cuál más sirve?” hasta llegar al extremo. Libro: «Una solución no es todas».'],
    min_max: ['Confunden mínimo y máximo.', 'Relacione “al menos” con piso y “como máximo” con techo usando ejemplos de dinero.'],
    gasto_ingreso: ['Confunden lo que entra con lo que sale.', 'Use la sección Cuentas del juego para separar ingresos, costos y ganancia. Misión: «La Feria del Valle».'],
    interpretacion: ['Invierten el sentido de la desigualdad al escribirla.', 'Lea el enunciado en voz alta y pregunte: ¿debe quedar por encima o por debajo del límite?'],
    calculo: ['Errores de cuenta.', 'Pida sustituir el valor encontrado en la inecuación original para verificar.'],
    restriccion: ['Olvidan alguna condición o el dominio.', 'Recuerde revisar cada condición por separado y si solo valen números enteros.'],
  };
  const PRESETS = [
    { id: 'intro', title: 'Primera clase', desc: 'Inecuaciones sencillas y traducción del lenguaje. Ideal para empezar.', contents: ['inecuacion_simple', 'traduccion', 'intervalos'], icon: 'seed_aji' },
    { id: 'neg', title: 'El giro del signo', desc: 'Coeficientes negativos y presupuestos.', contents: ['negativos', 'restricciones'], icon: 'hammer1' },
    { id: 'sist', title: 'Sistemas e intervalos', desc: 'Varias condiciones a la vez y conjuntos solución.', contents: ['sistemas', 'intervalos'], icon: 'fence' },
    { id: 'eco', title: 'Dinero e interés', desc: 'Comparar empleos e interés simple.', contents: ['comparacion', 'interes'], icon: 'coin' },
    { id: 'todo', title: 'Todo el curso', desc: 'Las 17 misiones disponibles.', contents: Object.keys(VO.CONTENTS), icon: 'notebook' },
  ];

  // ---------- acceso ----------
  T.open = function () {
    const cfg = A.teacherConfig();
    if (!cfg.pinSet) return T.createPin();
    const pin = el('input', { type: 'password', class: 'qty wide pinbox', placeholder: '••••', inputmode: 'numeric', 'aria-label': 'PIN docente' });
    const msg = el('p', { class: 'small muted' }, '¿Olvidaste el PIN? Desde este equipo puedes borrar la configuración docente en Configuración → Restablecer.');
    const go = () => { if (pin.value === cfg.pin) { VO.UI.close(); T.panel(); } else { msg.textContent = 'PIN incorrecto. Inténtalo de nuevo.'; msg.className = 'warn'; pin.select(); } };
    pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    VO.UI.open('Panel docente', el('div', { class: 'tlogin' }, ic('bookshelf'), el('p', {}, 'Escribe tu PIN docente'), pin, el('button', { class: 'btn ok big', onclick: go }, 'Entrar'), msg), { paper: true, icon: 'bookshelf' });
  };
  T.createPin = function () {
    const a = el('input', { type: 'password', class: 'qty wide pinbox', placeholder: 'Nuevo PIN', inputmode: 'numeric' }), b = el('input', { type: 'password', class: 'qty wide pinbox', placeholder: 'Repite el PIN', inputmode: 'numeric' });
    const msg = el('p', { class: 'small muted' }, 'Mínimo 4 números. Lo pedirá cada vez que abras el panel en este equipo.');
    VO.UI.open('Bienvenida, docente', el('div', { class: 'tlogin' }, ic('bookshelf'), el('h3', {}, 'Primero, crea tu PIN'), a, b, el('button', { class: 'btn ok big', onclick: () => {
      if (a.value.length < 4) { msg.textContent = 'El PIN debe tener al menos 4 caracteres.'; msg.className = 'warn'; return; }
      if (a.value !== b.value) { msg.textContent = 'Los dos PIN no coinciden.'; msg.className = 'warn'; return; }
      const cfg = A.teacherConfig(); cfg.pin = a.value; cfg.pinSet = true; A.saveTeacher(cfg); VO.UI.close(); T.panel('preparar');
    } }, 'Crear PIN y continuar'), msg), { paper: true, icon: 'bookshelf' });
  };

  // ---------- estructura ----------
  T.panel = function (view) {
    ses.view = view || 'inicio';
    const nav = el('nav', { class: 'tnav' }); const main = el('div', { class: 'tmain' });
    const NAV = [['inicio', 'Inicio', 'coin'], ['preparar', 'Preparar clase', 'notebook'], ['resultados', 'Resultados', 'bookshelf'], ['errores', 'Dificultades', 'hammer0'], ['conexion', 'Conexión', 'chest'], ['ajustes', 'Ajustes', 'workbench']];
    const go = (v) => { ses.view = v; nav.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)); main.innerHTML = ''; ({ inicio, preparar, resultados, errores, conexion, ajustes })[v](main, go); main.scrollTop = 0; };
    NAV.forEach(([v, t, i]) => nav.appendChild(el('button', { 'data-v': v, onclick: () => go(v) }, ic(i), el('span', {}, t))));
    VO.UI.open('Panel docente', el('div', { class: 'tlayout' }, nav, main), { wide: true, cls: 'teachermodal tnew', icon: 'bookshelf' });
    go(ses.view);
  };
  const card = (title, ...kids) => el('section', { class: 'tcard' }, title ? el('h3', {}, title) : null, ...kids);
  const help = (t) => el('p', { class: 'thelp' }, t);

  // ---------- datos ----------
  function localStudents() { return A.allIds().map((id) => ({ id, logs: A.logsFor(id) })); }
  function cloudStudents() {
    if (!ses.cloud) return [];
    const by = {}; ses.cloud.forEach((r) => { (by[r.alumno] = by[r.alumno] || []).push(r.datos); });
    return Object.keys(by).map((id) => ({ id, logs: by[id] }));
  }
  const students = () => (ses.source === 'cloud' ? cloudStudents() : localStudents());
  function summarize(st) {
    const m = A.metrics(st.logs);
    const acc = m.attempts ? Math.round(100 * m.correct / m.attempts) : null;
    const top = Object.keys(m.errs).sort((a, b) => m.errs[b] - m.errs[a])[0];
    const mastered = Object.values(m.mastery).filter((x) => x === 'Dominio con evidencia').length;
    const last = st.logs.length ? st.logs[st.logs.length - 1].t : null;
    const level = acc === null ? 'gray' : acc >= 80 ? 'green' : acc >= 60 ? 'yellow' : 'red';
    return { id: st.id, m, acc, top, mastered, last, level };
  }
  async function loadCloud(force) {
    const c = D.cfg();
    if (!D.configured() || !c.clase) throw new Error('Primero conecta la base de datos y crea o elige una clase (sección Conexión).');
    if (!ses.clave) { ses.clave = sessionStorage.getItem('valle_clave') || prompt('Clave docente de la clase ' + c.clase + ':'); if (!ses.clave) throw new Error('Se necesita la clave docente.'); }
    if (ses.cloud && !force) return;
    ses.cloud = await D.classData(c.clase, ses.clave); sessionStorage.setItem('valle_clave', ses.clave);
  }

  // ---------- INICIO ----------
  function inicio(main, go) {
    const list = students().map(summarize);
    const cfg = A.teacherConfig(); const c = D.cfg();
    const accAvg = list.filter((s) => s.acc !== null); const avg = accAvg.length ? Math.round(accAvg.reduce((a, s) => a + s.acc, 0) / accAvg.length) : null;
    main.append(el('div', { class: 'thero' }, el('div', {}, el('h2', {}, '¡Hola! ¿Qué quieres hacer hoy?'), el('p', { class: 'muted' }, 'Tres pasos: prepara la clase, deja jugar a tus estudiantes y revisa los resultados.'))),
      el('div', { class: 'tsteps' },
        el('button', { class: 'tstep', onclick: () => go('preparar') }, el('b', {}, '1'), ic('notebook'), el('span', {}, 'Preparar la clase'), el('small', {}, cfg.minutes + ' min · ' + (cfg.missions ? cfg.missions.length : 17) + ' misiones')),
        el('button', { class: 'tstep', onclick: () => go('conexion') }, el('b', {}, '2'), ic('chest'), el('span', {}, 'Conectar la clase'), el('small', {}, D.enabled() ? 'Clase ' + c.clase : D.configured() ? 'Falta elegir clase' : 'Opcional')),
        el('button', { class: 'tstep', onclick: () => go('resultados') }, el('b', {}, '3'), ic('bookshelf'), el('span', {}, 'Ver resultados'), el('small', {}, list.length + ' estudiante(s) en este equipo'))),
      el('div', { class: 'tkpis' }, kpi('Estudiantes', list.length), kpi('Acierto promedio', avg === null ? '—' : avg + ' %'), kpi('Necesitan apoyo', list.filter((s) => s.level === 'red').length), kpi('Conexión', D.enabled() ? (D.pending() ? D.pending() + ' por enviar' : 'Al día') : 'Solo este equipo')));
    const rec = recommendations(list);
    main.append(card('Recomendaciones para tu próxima clase', rec.length ? el('ul', { class: 'trec' }, rec.map((r) => el('li', {}, el('b', {}, r[0]), ' ', r[1]))) : help('Aún no hay suficientes datos. Las recomendaciones aparecerán cuando tus estudiantes resuelvan algunas misiones.')));
  }
  function kpi(t, v) { return el('div', { class: 'kpi' }, el('div', { class: 'small muted' }, t), el('b', {}, String(v))); }
  function recommendations(list) {
    const errs = {}; list.forEach((s) => { for (const k in s.m.errs) errs[k] = (errs[k] || 0) + 1; });
    return Object.keys(errs).filter((k) => TIPS[k]).sort((a, b) => errs[b] - errs[a]).slice(0, 3).map((k) => [errs[k] + ' estudiante(s): ' + TIPS[k][0], TIPS[k][1]]);
  }

  // ---------- PREPARAR CLASE (asistente) ----------
  function preparar(main) {
    const cfg = A.teacherConfig(); let step = 0;
    const draft = Object.assign({}, cfg, { contents: cfg.contents || Object.keys(VO.CONTENTS) });
    const box = el('div');
    const steps = ['Duración', 'Contenidos', 'Nivel de ayuda', 'Recursos', 'Listo'];
    const render = () => {
      box.innerHTML = '';
      box.appendChild(el('div', { class: 'twiz' }, steps.map((s, i) => el('span', { class: i < step ? 'ok' : i === step ? 'on' : '' }, (i + 1) + '. ' + s))));
      const body = el('div', { class: 'twbody' }); box.appendChild(body);
      if (step === 0) {
        body.append(el('h3', {}, '¿Cuánto dura tu clase?'), help('El juego mostrará un reloj y al terminar el tiempo enseñará un resumen al estudiante.'));
        const row = el('div', { class: 'tchoices' }); [30, 40, 45, 60, 90].forEach((n) => row.appendChild(el('button', { class: 'tchoice' + (draft.minutes === n ? ' on' : ''), onclick: () => { draft.minutes = n; render(); } }, el('b', {}, n), el('small', {}, 'minutos'))));
        body.append(row);
      }
      if (step === 1) {
        body.append(el('h3', {}, '¿Qué quieres trabajar?'), help('Elige un plan rápido o marca los temas uno por uno. El juego activará solo las misiones de esos temas.'));
        const pr = el('div', { class: 'tpresets' }); PRESETS.forEach((p) => pr.appendChild(el('button', { class: 'tpreset' + (JSON.stringify(p.contents.slice().sort()) === JSON.stringify(draft.contents.slice().sort()) ? ' on' : ''), onclick: () => { draft.contents = p.contents.slice(); render(); } }, ic(p.icon), el('b', {}, p.title), el('small', {}, p.desc))));
        const chips = el('div', { class: 'tchips' }); Object.keys(VO.CONTENTS).forEach((k) => chips.appendChild(el('label', { class: 'tchip' + (draft.contents.includes(k) ? ' on' : '') }, el('input', { type: 'checkbox', checked: draft.contents.includes(k) ? 'checked' : null, onchange: (e) => { draft.contents = e.target.checked ? [...draft.contents, k] : draft.contents.filter((x) => x !== k); render(); } }), VO.CONTENTS[k])));
        const ms = VO.MISSIONS.filter((m) => m.contents.some((c) => draft.contents.includes(c)));
        body.append(pr, el('h4', {}, 'O elige temas'), chips, el('details', {}, el('summary', {}, 'Ver las ' + ms.length + ' misiones incluidas'), el('ul', { class: 'small' }, ms.map((m) => el('li', {}, 'Cap. ' + m.chapter + ' · ' + m.title + ' (' + VO.NPCS[m.npc].name + ')')))));
      }
      if (step === 2) {
        body.append(el('h3', {}, '¿Cuánta ayuda quieres que reciban?'), help('Siempre verán primero la consecuencia de su decisión en el juego. Esto controla cuánta ayuda extra aparece después.'));
        const opts = [['suave', 'Mucha ayuda', 'Las pistas aparecen solas tras cada intento fallido. Para estudiantes que empiezan.', 'guayaba'], ['normal', 'Equilibrada', 'Las pistas avanzan poco a poco y también se pueden pedir.', 'seed_tomate'], ['reto', 'Reto', 'Solo pistas si las piden. Para quienes ya dominan el tema.', 'iron_bar'], ['sin', 'Sin pistas', 'Ideal para una evaluación: no hay botón de pistas.', 'chest']];
        const row = el('div', { class: 'tchoices big' }); opts.forEach(([v, t, d, i]) => { const on = v === 'sin' ? !draft.hints : draft.hints && draft.difficulty === v; row.appendChild(el('button', { class: 'tchoice' + (on ? ' on' : ''), onclick: () => { if (v === 'sin') { draft.hints = false; draft.difficulty = 'reto'; } else { draft.hints = true; draft.difficulty = v; } render(); } }, ic(i), el('b', {}, t), el('small', {}, d))); });
        body.append(row);
      }
      if (step === 3) {
        body.append(el('h3', {}, '¿Con qué empiezan?'), help('En modo aula conviene que empiecen con lo necesario para no perder tiempo talando o pescando.'));
        const rec = { money: 600, items: { wood: 20, sardina: 20, plank: 10, stone: 10, fiber: 10, guayaba: 6 } };
        const row = el('div', { class: 'tchoices big' });
        row.append(el('button', { class: 'tchoice' + (draft.money === 600 ? ' on' : ''), onclick: () => { draft.money = rec.money; draft.items = Object.assign({}, rec.items); render(); } }, ic('chest'), el('b', {}, 'Recomendado'), el('small', {}, '600 monedas y materiales suficientes para todas las misiones.')),
          el('button', { class: 'tchoice' + (draft.money === 200 ? ' on' : ''), onclick: () => { draft.money = 200; draft.items = { wood: 5, sardina: 5 }; render(); } }, ic('wood'), el('b', {}, 'Poco'), el('small', {}, '200 monedas: tendrán que trabajar y recolectar.')));
        const adv = el('details', {}, el('summary', {}, 'Ajustar a mano'), el('div', { class: 'row wrap' }, el('label', {}, 'Monedas ', el('input', { type: 'number', class: 'qty', value: draft.money, onchange: (e) => { draft.money = +e.target.value; } })), ...['wood', 'sardina', 'plank', 'stone', 'fiber', 'guayaba'].map((k) => el('label', { class: 'small' }, VO.ITEMS[k].name + ' ', el('input', { type: 'number', class: 'qty', min: 0, max: 99, value: (draft.items || {})[k] || 0, onchange: (e) => { draft.items = Object.assign({}, draft.items, { [k]: +e.target.value }); } })))));
        body.append(row, adv);
      }
      if (step === 4) {
        const ms = VO.MISSIONS.filter((m) => m.contents.some((c) => draft.contents.includes(c)));
        body.append(el('h3', {}, 'Todo listo'), el('ul', { class: 'tsum' },
          el('li', {}, el('b', {}, 'Duración: '), draft.minutes + ' minutos'), el('li', {}, el('b', {}, 'Misiones: '), ms.length + ' (' + draft.contents.map((c) => VO.CONTENTS[c]).join(', ') + ')'),
          el('li', {}, el('b', {}, 'Ayuda: '), !draft.hints ? 'sin pistas' : { suave: 'mucha ayuda', normal: 'equilibrada', reto: 'reto' }[draft.difficulty]), el('li', {}, el('b', {}, 'Inicio: '), draft.money + ' monedas')),
          help('Tus estudiantes deben elegir «Modo aula» en la pantalla de inicio.' + (D.enabled() ? ' Como la clase está conectada, la configuración llegará también a sus equipos.' : '')));
      }
      const nav = el('div', { class: 'row end' });
      if (step > 0) nav.appendChild(el('button', { class: 'btn', onclick: () => { step--; render(); } }, 'Atrás'));
      if (step < 4) nav.appendChild(el('button', { class: 'btn ok', disabled: step === 1 && !draft.contents.length, onclick: () => { step++; render(); } }, 'Siguiente'));
      else nav.appendChild(el('button', { class: 'btn ok big', onclick: async () => {
        draft.missions = VO.MISSIONS.filter((m) => m.contents.some((c) => draft.contents.includes(c))).map((m) => m.id);
        A.saveTeacher(draft); VO.UI.toast('Configuración de la clase guardada.', 'ok');
        if (D.enabled()) { try { await loadCloudKey(); await D.saveClassConfig(D.cfg().clase, ses.clave, { minutes: draft.minutes, money: draft.money, hints: draft.hints, difficulty: draft.difficulty, missions: draft.missions, items: draft.items }); VO.UI.toast('También se guardó en la clase ' + D.cfg().clase + '.', 'ok'); } catch (e) { VO.UI.toast('No se pudo enviar a la clase: ' + e.message, 'warn'); } }
        step = 0; render();
      } }, 'Guardar configuración'));
      box.appendChild(nav);
    };
    render(); main.appendChild(box);
  }
  async function loadCloudKey() { if (!ses.clave) { ses.clave = sessionStorage.getItem('valle_clave') || prompt('Clave docente de la clase ' + D.cfg().clase + ':'); if (ses.clave) sessionStorage.setItem('valle_clave', ses.clave); } if (!ses.clave) throw new Error('Se necesita la clave docente'); }

  // ---------- RESULTADOS ----------
  function resultados(main) {
    const top = el('div', { class: 'row wrap' });
    const src = el('div', { class: 'tseg' }, ['local', 'cloud'].map((s) => el('button', { class: ses.source === s ? 'on' : '', onclick: async () => { if (s === 'cloud') { try { await loadCloud(); } catch (e) { VO.UI.toast(e.message, 'warn'); return; } } ses.source = s; main.innerHTML = ''; resultados(main); } }, s === 'local' ? 'Este equipo' : 'Toda la clase (en línea)')));
    const q = el('input', { type: 'search', class: 'qty wide', placeholder: 'Buscar código de estudiante…' });
    top.append(src, q);
    if (ses.source === 'cloud') top.appendChild(el('button', { class: 'btn sm', onclick: async () => { try { await loadCloud(true); main.innerHTML = ''; resultados(main); } catch (e) { VO.UI.toast(e.message, 'warn'); } } }, 'Actualizar'));
    const grid = el('div', { class: 'tgrid' }); const detail = el('div');
    const list = students().map(summarize).sort((a, b) => ({ red: 0, yellow: 1, green: 2, gray: 3 }[a.level] - { red: 0, yellow: 1, green: 2, gray: 3 }[b.level]));
    const draw = () => {
      grid.innerHTML = '';
      const f = q.value.trim().toUpperCase();
      list.filter((s) => !f || s.id.includes(f)).forEach((s) => grid.appendChild(el('button', { class: 'tstu ' + s.level, onclick: () => { detail.innerHTML = ''; detail.appendChild(studentDetail(s, (ses.source === 'cloud' ? cloudStudents() : localStudents()).find((x) => x.id === s.id).logs)); detail.scrollIntoView({ behavior: 'smooth' }); } },
        el('span', { class: 'dot' }), el('b', {}, s.id), el('small', {}, s.m.done.length + ' misiones · ' + (s.acc === null ? 'sin intentos' : s.acc + ' % acierto')), el('small', {}, s.top ? 'Dificultad: ' + M.ERRORS[s.top].toLowerCase() : 'Sin errores frecuentes'))));
      if (!list.length) grid.appendChild(help(ses.source === 'cloud' ? 'La clase aún no tiene registros en línea.' : 'Todavía nadie ha jugado en este equipo. Cuando tus estudiantes jueguen, aparecerán aquí.'));
    };
    q.addEventListener('input', draw); draw();
    main.append(card('Resultados por estudiante', help('Verde: 80 % o más de acierto · Amarillo: 60–79 % · Rojo: necesita apoyo · Gris: aún sin intentos. Toca una tarjeta para ver el detalle.'), top, grid), detail);
    main.append(card('Exportar', help('Los archivos solo contienen códigos anónimos.'), el('div', { class: 'row wrap' }, el('button', { class: 'btn ok', onclick: () => A.download('valle_resultados.csv', toCSV(students()), 'text/csv') }, 'Descargar para Excel (CSV)'), el('button', { class: 'btn', onclick: () => A.download('valle_resultados.json', JSON.stringify(students().map((s) => ({ id: s.id, resumen: A.metrics(s.logs), registros: s.logs })), null, 2), 'application/json') }, 'Descargar datos completos (JSON)'))));
  }
  function toCSV(list) {
    const rows = [['estudiante', 'misiones_completadas', 'intentos', 'aciertos', 'porcentaje', 'pistas', 'minutos', ...Object.keys(VO.CONTENTS).map((k) => 'dominio_' + k), 'error_mas_frecuente']];
    list.forEach((s) => { const m = A.metrics(s.logs); const top = Object.keys(m.errs).sort((a, b) => m.errs[b] - m.errs[a])[0]; rows.push([s.id, m.done.length, m.attempts, m.correct, m.attempts ? Math.round(100 * m.correct / m.attempts) : '', m.hints, m.mathMin, ...Object.keys(VO.CONTENTS).map((k) => m.mastery[k]), top ? M.ERRORS[top] : '']); });
    return rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  }
  function studentDetail(s, logs) {
    const m = s.m;
    const box = card('Detalle de ' + s.id, el('div', { class: 'tkpis' }, kpi('Misiones', m.done.length), kpi('Acierto', s.acc === null ? '—' : s.acc + ' %'), kpi('Pistas', m.hints), kpi('Minutos', m.mathMin)));
    box.append(el('h4', {}, 'Cómo va en cada tema'), A.masteryTable(m), help('“Dominio con evidencia” exige aciertos al primer intento en al menos dos misiones; completar una misión no basta.'));
    const att = logs.filter((l) => l.type === 'attempt');
    const cv = el('canvas', { width: 520, height: 150, class: 'chart' }); const ctx = cv.getContext('2d');
    VO.UI.chartAxes(ctx, 520, 150, Math.max(1, att.length), 100, 'intentos', '% acierto');
    let ok = 0; ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 2; ctx.beginPath(); att.forEach((l, i) => { if (l.correct) ok++; const X = 30 + ((i + 1) / Math.max(1, att.length)) * 480, Y = 130 - (ok / (i + 1)) * 120; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
    box.append(el('h4', {}, 'Evolución'), cv, el('h4', {}, 'Errores matemáticos'), A.errBars(m.errs), el('h4', {}, 'Errores de manejo del juego'), A.errBars(m.gameErr, true));
    const hist = el('table', { class: 'tbl small' }, el('tr', {}, ...['Hora', 'Misión', 'Etapa', 'Respuesta', '', 'Error'].map((h) => el('th', {}, h))));
    att.slice(-40).reverse().forEach((l) => hist.appendChild(el('tr', {}, el('td', {}, new Date(l.t).toLocaleString('es-DO')), el('td', {}, (VO.MISSION_BY_ID[l.mission] || { title: l.mission }).title), el('td', {}, A.stageName(l.stage)), el('td', {}, String(l.value === undefined ? '' : l.value)), el('td', { class: l.correct ? 'win' : 'bad' }, l.correct ? '✔' : '✗'), el('td', {}, l.error ? M.ERRORS[l.error] : ''))));
    box.append(el('details', {}, el('summary', {}, 'Historial de respuestas'), hist));
    return box;
  }

  // ---------- DIFICULTADES ----------
  function errores(main) {
    const list = students().map(summarize); const all = {}; const game = {};
    list.forEach((s) => { for (const k in s.m.errs) all[k] = (all[k] || 0) + s.m.errs[k]; for (const k in s.m.gameErr) game[k] = (game[k] || 0) + s.m.gameErr[k]; });
    const keys = Object.keys(all).sort((a, b) => all[b] - all[a]);
    main.append(card('Errores matemáticos más frecuentes', keys.length ? el('div', { class: 'terr' }, keys.map((k) => el('div', { class: 'terrc' }, el('div', { class: 'row' }, el('b', { class: 'grow' }, M.ERRORS[k]), el('span', { class: 'badge' }, all[k])), TIPS[k] ? el('p', { class: 'small' }, el('b', {}, 'Qué hacer: '), TIPS[k][1]) : null))) : help('Sin errores registrados todavía.')),
      card('Errores de manejo del juego', help('No cuentan como errores de matemáticas: indican dificultades con los controles o la interfaz.'), A.errBars(game, true)));
  }

  // ---------- CONEXIÓN ----------
  function conexion(main) {
    const c = D.cfg(); const status = el('div', { class: 'tstatus ' + (D.status.ok ? 'ok' : D.status.ok === false ? 'bad' : '') }, D.configured() ? (D.status.ok ? 'Conectado' : D.status.msg) : 'Sin conectar: los datos se guardan solo en este equipo.');
    const url = el('input', { type: 'url', class: 'qty wide', placeholder: 'https://tu-proyecto.supabase.co', value: c.url });
    const key = el('input', { type: 'text', class: 'qty wide', placeholder: 'Clave pública (anon public)', value: c.key });
    main.append(card('Conecta tu clase a internet (opcional)', help('Así ves los resultados de todos tus estudiantes en un solo lugar y ellos pueden continuar su partida en cualquier computadora. Si no lo conectas, el juego funciona igual guardando todo en cada equipo.'), status,
      el('ol', { class: 'tguide' },
        el('li', {}, 'Crea una cuenta gratuita en ', el('b', {}, 'supabase.com'), ' y un proyecto nuevo.'),
        el('li', {}, 'En tu proyecto abre ', el('b', {}, 'SQL Editor'), ', pega el contenido del archivo ', el('code', {}, 'supabase/setup.sql'), ' (está en la carpeta del juego) y pulsa ', el('b', {}, 'Run'), '.'),
        el('li', {}, 'En ', el('b', {}, 'Project Settings → API'), ' copia la ', el('b', {}, 'Project URL'), ' y la clave ', el('b', {}, 'anon public'), ' y pégalas aquí:'),
        el('li', { class: 'nolist' }, url, key, el('div', { class: 'row' }, el('button', { class: 'btn ok', onclick: async () => { D.setLocal({ url: url.value.trim(), key: key.value.trim() }); status.textContent = 'Probando…'; const r = await D.test(); status.className = 'tstatus ' + (r.ok ? 'ok' : 'bad'); status.textContent = r.ok ? 'Conectado correctamente' : r.msg; if (r.ok) { main.innerHTML = ''; conexion(main); VO.UI.toast('Conexión lista. Ahora crea tu clase.', 'ok'); } } }, 'Guardar y probar conexión'))),
        el('li', {}, 'Crea tu clase (abajo) y comparte el código con tus estudiantes.'))));
    const code = el('input', { type: 'text', class: 'qty', placeholder: 'MATE3B', value: c.clase, maxlength: 12 });
    const name = el('input', { type: 'text', class: 'qty wide', placeholder: '3.º B · Matemática' });
    const clave = el('input', { type: 'password', class: 'qty', placeholder: 'Clave docente (6+)' });
    const out = el('div');
    main.append(card('Tu clase', help('El código de clase lo escriben tus estudiantes (o viene en el enlace). La clave docente es solo tuya: sirve para ver los resultados.'),
      el('div', { class: 'row wrap' }, el('label', {}, 'Código ', code), el('label', { class: 'grow' }, 'Nombre ', name), el('label', {}, 'Clave ', clave)),
      el('div', { class: 'row wrap' },
        el('button', { class: 'btn ok', disabled: !D.configured(), onclick: async () => { try { const k = await D.createClass(code.value.trim(), name.value.trim(), clave.value); D.setLocal({ clase: k }); ses.clave = clave.value; sessionStorage.setItem('valle_clave', clave.value); VO.UI.toast('Clase ' + k + ' creada.', 'ok'); main.innerHTML = ''; conexion(main); } catch (e) { out.textContent = e.message; out.className = 'warn'; } } }, 'Crear clase nueva'),
        el('button', { class: 'btn', disabled: !D.configured(), onclick: () => { D.setLocal({ clase: code.value.trim().toUpperCase() }); if (clave.value) { ses.clave = clave.value; sessionStorage.setItem('valle_clave', clave.value); } ses.cloud = null; VO.UI.toast('Este equipo usará la clase ' + code.value.trim().toUpperCase() + '.', 'ok'); main.innerHTML = ''; conexion(main); } }, 'Usar una clase que ya existe')), out));
    if (D.enabled()) {
      const link = location.origin + location.pathname + '?clase=' + encodeURIComponent(c.clase);
      main.append(card('Enlace para tus estudiantes', help('Si publicas el juego en GitHub Pages con js/config.js completado, este enlace abre el juego ya conectado a tu clase.'), el('div', { class: 'row' }, el('code', { class: 'grow tlink' }, link), el('button', { class: 'btn', onclick: () => { navigator.clipboard && navigator.clipboard.writeText(link); VO.UI.toast('Enlace copiado.', 'ok'); } }, 'Copiar')),
        el('p', { class: 'small muted' }, 'Registros pendientes de enviar desde este equipo: ' + D.pending())));
    }
  }

  // ---------- AJUSTES ----------
  function ajustes(main) {
    const a = el('input', { type: 'password', class: 'qty', placeholder: 'Nuevo PIN' });
    main.append(card('Cambiar PIN', el('div', { class: 'row' }, a, el('button', { class: 'btn ok', onclick: () => { if (a.value.length < 4) { VO.UI.toast('Mínimo 4 caracteres.', 'warn'); return; } const cfg = A.teacherConfig(); cfg.pin = a.value; cfg.pinSet = true; A.saveTeacher(cfg); VO.UI.toast('PIN actualizado.', 'ok'); a.value = ''; } }, 'Guardar'))),
      card('Privacidad', help('Cada estudiante tiene un código anónimo aleatorio. El nombre del personaje no se guarda en los registros ni se envía. Los estudiantes pueden ver qué se registra en Pausa → Mi registro de aprendizaje.')),
      card('Borrar datos', help('Esto no se puede deshacer.'), el('div', { class: 'row wrap' },
        el('button', { class: 'btn', onclick: () => VO.UI.confirm('¿Borrar todos los registros de ESTE equipo? No se puede deshacer.', () => { A.allIds().forEach((id) => localStorage.removeItem('valle_log_' + id)); localStorage.removeItem('valle_students'); VO.UI.toast('Registros de este equipo borrados.', 'ok'); }) }, 'Borrar registros de este equipo'),
        D.enabled() ? el('button', { class: 'btn', onclick: () => VO.UI.confirm('¿Borrar TODOS los datos en línea de la clase ' + D.cfg().clase + '? No se puede deshacer.', async () => { try { await loadCloudKey(); const n = await D.wipeClass(D.cfg().clase, ses.clave); ses.cloud = null; VO.UI.toast(n + ' registros borrados de la nube.', 'ok'); } catch (e) { VO.UI.toast(e.message, 'warn'); } }) }, 'Borrar datos en línea de la clase') : null,
        el('button', { class: 'btn', onclick: () => VO.UI.confirm('¿Restablecer el panel docente de este equipo (PIN y configuración)?', () => { localStorage.removeItem('valle_teacher'); VO.UI.closeAll(); VO.UI.toast('Panel restablecido.', 'ok'); }) }, 'Restablecer panel'))));
  }

  A.openTeacher = T.open;
})();
