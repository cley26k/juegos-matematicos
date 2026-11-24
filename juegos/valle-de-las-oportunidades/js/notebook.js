'use strict';
// Libreta de planificación: documentos de misión (niveles 1-2), tareas de la libreta
// (niveles 3-4), laboratorio libre, retroalimentación progresiva y minijuego de pesca.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const el = VO.el, M = VO.MathEngine;
  const N = (VO.Notebook = {});
  const G = () => VO.G;
  const U = () => VO.UI;
  const num = M.num;

  // Mensajes por tipo de error (pregunta orientadora, no examen)
  const ERR_MSG = {
    gasto_ingreso: '¿Esa cantidad suma o resta? Lo que pagas hace bajar tu dinero; lo que vendes lo hace subir.',
    interpretacion: 'Revisa el sentido del signo: ¿la cantidad debe quedar por encima o por debajo del límite?',
    min_max: '¿Esa condición pone un mínimo o un máximo? “Al menos” marca un piso; “como máximo”, un techo.',
    calculo: 'Revisa las cuentas con calma: vuelve a calcular los números del contexto.',
    estricta_inclusiva: '¿El límite está incluido? “Al menos” y “como máximo” lo incluyen; “más de” y “menos de”, no.',
    restriccion: 'Hay una condición que no se cumple. Revisa cada una por separado.',
    signo_negativo: 'Al dividir entre un número negativo, ¿qué le pasa al signo de la desigualdad?',
    interseccion: 'Tiene que cumplir TODAS las condiciones a la vez: busca dónde se superponen.',
    particular_conjunto: 'Ese valor funciona, ¡bien! Pero ¿es el único? Busca todos los que sirven.',
  };
  N.ERR_MSG = ERR_MSG;

  // ------------------------------------------------------------ RECTA NUMÉRICA
  function viewRange(m) {
    const pts = [...M.boundaries(m.inequalities), ...(m.checkValues || [])];
    if (m.domain.min !== undefined) pts.push(m.domain.min);
    if (m.domain.max !== undefined && m.domain.max < 200) pts.push(m.domain.max);
    let lo = Math.min(...pts), hi = Math.max(...pts);
    const pad = Math.max(2, Math.ceil((hi - lo) * 0.2));
    lo = Math.floor(lo - pad); hi = Math.ceil(hi + pad);
    if (m.domain.min !== undefined) lo = Math.max(lo, m.domain.min - 2);
    return [lo, hi];
  }
  N.drawLine = function (cv, o) {
    const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const [a, b] = o.range; const X = (v) => 24 + ((v - a) / (b - a)) * (W - 48);
    const yAxis = H - 26;
    // intervalos (cada restricción en su altura)
    (o.intervals || []).forEach((it, i) => {
      if (!it.I) return;
      const y = it.y !== undefined ? it.y : yAxis - 14 - i * 12;
      const lo = Math.max(a - 1, it.I.lo), hi = Math.min(b + 1, it.I.hi);
      ctx.strokeStyle = it.color; ctx.lineWidth = it.w || 4; ctx.globalAlpha = it.alpha || 1;
      ctx.beginPath(); ctx.moveTo(X(lo), y); ctx.lineTo(X(hi), y); ctx.stroke();
      ctx.fillStyle = it.color;
      if (it.I.hi === Infinity || it.I.hi > b) { ctx.beginPath(); ctx.moveTo(X(b) + 10, y); ctx.lineTo(X(b) + 2, y - 5); ctx.lineTo(X(b) + 2, y + 5); ctx.fill(); }
      if (it.I.lo === -Infinity || it.I.lo < a) { ctx.beginPath(); ctx.moveTo(X(a) - 10, y); ctx.lineTo(X(a) - 2, y - 5); ctx.lineTo(X(a) - 2, y + 5); ctx.fill(); }
      [[it.I.lo, it.I.loC], [it.I.hi, it.I.hiC]].forEach(([v, c]) => { if (!isFinite(v) || v < a || v > b) return; ctx.beginPath(); ctx.arc(X(v), y, 5, 0, 6.3); ctx.fillStyle = c ? it.color : '#fbf3de'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = it.color; ctx.stroke(); });
      if (it.label) { ctx.globalAlpha = 1; ctx.fillStyle = it.color; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(it.label, 4, y - 6); }
      ctx.globalAlpha = 1;
    });
    // eje
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, yAxis); ctx.lineTo(W - 10, yAxis); ctx.stroke();
    const step = Math.max(1, Math.ceil((b - a) / 20));
    ctx.fillStyle = '#4a3020'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    for (let v = Math.ceil(a); v <= b; v++) {
      const sel = o.selected && o.selected.has(v);
      const isDot = o.dots;
      if (isDot) { ctx.beginPath(); ctx.arc(X(v), yAxis, sel ? 6 : 4, 0, 6.3); ctx.fillStyle = sel ? '#2f8a3a' : '#fbf3de'; ctx.fill(); ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1.5; ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(X(v), yAxis - 3); ctx.lineTo(X(v), yAxis + 3); ctx.stroke(); }
      if ((v - Math.ceil(a)) % step === 0 || sel) { ctx.fillStyle = '#4a3020'; ctx.fillText(v, X(v), yAxis + 17); }
    }
    if (o.mark !== undefined && o.mark !== null) { const x = X(o.mark); ctx.fillStyle = o.markOk === false ? '#c2453a' : o.markOk ? '#2f8a3a' : '#2f6fb0'; ctx.beginPath(); ctx.moveTo(x, yAxis - 6); ctx.lineTo(x - 6, yAxis - 16); ctx.lineTo(x + 6, yAxis - 16); ctx.fill(); ctx.font = 'bold 11px sans-serif'; ctx.fillText((o.sym || 'x') + ' = ' + num(o.mark), x, yAxis - 20); }
    cv._X = X; cv._range = [a, b];
  };

  // ------------------------------------------------------------ DIAGNÓSTICO DE UN VALOR
  function diagnoseValue(x, m) {
    const r = M.checkValue(x, m);
    if (r.ok) return null;
    if (!r.inDomain) return { err: 'restriccion', i: -1 };
    const i = r.violated[0]; const q = m.inequalities[i];
    if (q.alt) for (const a of q.alt) if (M.holds(a.q, x)) return { err: a.err, i };
    const A = q.L.a - q.R.a;
    const bnd = Math.abs(A) > 1e-9 ? (q.R.b - q.L.b) / A : null;
    if (bnd !== null && Math.abs(x - bnd) < 1e-9 && (q.op === '<' || q.op === '>')) return { err: 'estricta_inclusiva', i };
    if (A < 0 && M.contains(M.solve(q, { noFlip: true }).I, x)) return { err: 'signo_negativo', i };
    if (Math.abs(q.R.a) > 1e-9) return { err: 'interpretacion', i };
    if (m.inequalities.length > 1 && r.violated.length < m.inequalities.length) return { err: 'restriccion', i };
    return { err: q.op.startsWith('>') ? 'min_max' : 'restriccion', i };
  }

  function portraitCanvas(npc, mood) { const c = el('canvas', { class: 'portrait sm', width: 48, height: 48 }); c.getContext('2d').drawImage(VO.Art.portrait(VO.NPCS[npc].look, mood || 'happy'), 0, 0); return c; }
  function npcSays(m, text, mood) { return el('div', { class: 'npcsay' }, portraitCanvas(m.npc, mood), el('div', { class: 'bubble' }, el('b', {}, VO.NPCS[m.npc].name + ': '), text)); }

  // ------------------------------------------------------------ DOCUMENTO DE ACCIÓN
  N.openAction = function (m) {
    const g = G(); const st = g.state.missions[m.id]; const act = m.action;
    st.actionTries = st.actionTries || 0;
    const v = m.variable.sym;
    let x = st.lastX !== undefined ? st.lastX : act.range[0];
    const body = el('div', { class: 'doc doc-' + act.doc });
    const rows = el('div', { class: 'proj' });
    const feedback = el('div', { class: 'feedback' });
    const cv = el('canvas', { width: 520, height: 90, class: 'nline' });
    const chart = act.chart ? el('canvas', { width: 520, height: 170, class: 'chart' }) : null;
    const t0 = performance.now();
    const val = el('b', { class: 'bigval' });
    const slider = el('input', { type: 'range', min: act.range[0], max: act.range[1], step: act.step, value: x, 'aria-label': 'Cantidad ' + v });
    const numIn = el('input', { type: 'number', min: act.range[0], max: act.range[1], step: act.step, value: x, class: 'qty', 'aria-label': 'Cantidad ' + v });
    const showLine = () => st.hintLvl >= 3;
    const upd = () => {
      val.textContent = v + ' = ' + num(x) + ' ' + (x === 1 ? m.variable.unit.replace(/s$/, '') : m.variable.unit);
      rows.innerHTML = '';
      act.rows.forEach((r) => { const y = r.e.a * x + r.e.b; rows.appendChild(el('div', { class: 'prow' }, el('span', {}, r.label), el('span', { class: 'muted' }, (r.e.b ? num(r.e.b) + (r.e.a >= 0 ? ' + ' : ' − ') : (r.e.a < 0 ? '−' : '')) + num(Math.abs(r.e.a)) + ' · ' + num(x)), el('b', { class: y < 0 ? 'bad' : '' }, num(y) + ' ' + r.unit))); });
      if (showLine()) N.drawLine(cv, { range: viewRange(m), intervals: m.inequalities.map((q, i) => ({ I: M.solve(q).I, color: ['#c2453a', '#2f6fb0', '#8a3a9a'][i], alpha: 0.65, label: q.label })), mark: x, sym: v });
      if (chart) drawChart(chart, m, x);
    };
    const set = (nv) => { x = VO.clamp(Math.round(nv / act.step) * act.step, act.range[0], act.range[1]); slider.value = x; numIn.value = x; st.lastX = x; upd(); };
    slider.addEventListener('input', () => set(+slider.value));
    numIn.addEventListener('change', () => set(+numIn.value || 0));
    const conds = el('ul', { class: 'conds' }); m.inequalities.forEach((q) => conds.appendChild(el('li', {}, q.words)));
    const sign = el('button', { class: 'btn ok big seal', onclick: () => trySign() }, 'Firmar');
    const hintBtn = el('button', { class: 'btn', onclick: () => hint() }, 'Pedir una pista');
    const impossible = m.allowImpossible ? el('button', { class: 'btn', onclick: () => tryImpossible() }, 'No se puede cumplir todo') : null;
    body.append(
      el('div', { class: 'dochead' }, portraitCanvas(m.npc), el('div', {}, el('div', { class: 'doctype' }, { pedido: 'PEDIDO', contrato: 'CONTRATO', plano: 'PLANO DE OBRA', simulador: 'SIMULACIÓN', libreta: 'PLAN DEL DÍA' }[act.doc]), el('h3', {}, act.title), el('p', {}, m.context))),
      el('p', { class: 'var' }, 'Variable: ', el('b', {}, v), ' = ' + m.variable.meaning + '.'),
      el('h4', {}, 'Condiciones del trato'), conds,
      el('div', { class: 'qrow' }, slider, numIn, val),
      el('h4', {}, 'Proyección'), rows, chart, cv, feedback,
      el('div', { class: 'signline' }, el('span', { class: 'small muted' }, 'Firma: ____________________'), el('div', { class: 'row end wrap' }, hintBtn, impossible, sign)));
    cv.style.display = showLine() ? '' : 'none';
    upd();
    U().open(VO.NPCS[m.npc].name + ' · ' + m.title, body, { wide: true, paper: true, icon: 'notebook', cls: 'docmodal' });

    function hint() {
      if (g.state.hintsAllowed === false) { feedback.innerHTML = ''; feedback.append(el('p', { class: 'muted' }, 'Las pistas están desactivadas por tu docente.')); return; }
      st.hintLvl = Math.min(4, (st.hintLvl || 1) + 1); st.hints++;
      VO.Analytics.log({ type: 'hint', mission: m.id, stage: 'action', level: st.hintLvl });
      showHint();
    }
    function showHint(q) {
      q = q || m.inequalities[0];
      feedback.innerHTML = '';
      if (st.hintLvl === 2) feedback.append(npcSays(m, q.question, 'normal'));
      if (st.hintLvl >= 3) { cv.style.display = ''; upd(); feedback.append(el('p', { class: 'small' }, 'Cada franja de color muestra los valores que cumplen una condición. Tu cantidad es la flecha.')); }
      if (st.hintLvl >= 4) feedback.append(stepsBox(q));
    }
    function trySign() {
      const short = g.effectShortage(act.effect, x);
      if (short) { feedback.innerHTML = ''; feedback.append(el('p', { class: 'warn' }, short)); VO.Analytics.game('recursos_insuficientes', m.id); VO.Audio.sfx('error'); return; }
      st.attempts++;
      const d = diagnoseValue(x, m);
      VO.Analytics.log({ type: 'attempt', mission: m.id, stage: 'action', value: x, correct: !d, error: d ? d.err : null, ms: Math.round(performance.now() - t0), hintLevel: st.hintLvl || 1 });
      if (!d) {
        if (m.allowImpossible) return; // inalcanzable: la solución es vacía
        U().close();
        g.applyEffect(act.effect, x);
        st.status = 'notebook'; st.chosen = x; VO.Audio.sfx('good');
        U().dialog(m.npc, ['¡Trato hecho con ' + v + ' = ' + num(x) + '! Ahora anótalo en tu libreta: así sabremos qué otras cantidades también servían.'], null, () => N.openTasks(m));
        U().refreshHUD();
        return;
      }
      st.actionTries++; st.errors.push(d.err);
      VO.Audio.sfx('error');
      const q = d.i >= 0 ? m.inequalities[d.i] : null;
      feedback.innerHTML = '';
      // 1) consecuencia en el mundo
      feedback.append(npcSays(m, (q ? q.consequence : 'Esa cantidad no tiene sentido aquí.') + ' ' + consequenceNumbers(m, x, d.i), 'worried'));
      // progresión de ayuda según intentos
      const dif = g.state.difficulty;
      if (dif !== 'reto') st.hintLvl = Math.max(st.hintLvl || 1, Math.min(4, st.actionTries + (dif === 'suave' ? 1 : 0)));
      if (g.state.hintsAllowed !== false && st.hintLvl >= 2 && q) { if (st.hintLvl === 2) feedback.append(npcSays(m, q.question, 'normal')); else { const box = el('div'); feedback.append(box); cv.style.display = ''; upd(); if (st.hintLvl >= 4) feedback.append(stepsBox(q)); } }
      feedback.append(el('p', { class: 'small muted' }, 'Puedes cambiar la cantidad y volver a intentarlo. No hay castigo.'));
    }
    function tryImpossible() {
      st.attempts++;
      const ok = m.solution.empty;
      VO.Analytics.log({ type: 'attempt', mission: m.id, stage: 'action', value: '∅', correct: ok, error: ok ? null : 'interseccion', hintLevel: st.hintLvl || 1 });
      if (ok) { U().close(); st.status = 'notebook'; st.chosen = '∅'; VO.Audio.sfx('good'); U().dialog(m.npc, ['Así es. No hay ninguna cantidad que cumpla las dos condiciones. Anótalo en la libreta y explica por qué.'], null, () => N.openTasks(m)); U().refreshHUD(); }
      else { feedback.innerHTML = ''; feedback.append(npcSays(m, 'Mmm, yo creo que sí hay cantidades que funcionan. Prueba algunas.', 'worried')); VO.Audio.sfx('error'); }
    }
  };
  function consequenceNumbers(m, x, i) {
    if (i < 0) return '';
    const q = m.inequalities[i]; const L = M.ev(q.L, x), R = M.ev(q.R, x);
    return '(Con ' + m.variable.sym + ' = ' + num(x) + ': ' + num(L) + (M.holds(q, x) ? ' ' : ' no es ') + M.SYM[q.op] + ' ' + num(R) + ')';
  }
  function stepsBox(q) {
    const s = M.solve(q);
    const box = el('div', { class: 'steps' }, el('b', {}, 'Paso a paso:'));
    s.steps.forEach((st) => box.appendChild(el('div', { class: 'step' + (st.flip ? ' flip' : '') }, el('code', {}, st.t), el('span', { class: 'small' }, ' — ' + st.why))));
    box.appendChild(el('div', { class: 'step' }, el('b', {}, 'Intervalo: ' + M.fmtInterval(s.I))));
    return box;
  }
  function drawChart(cv, m, x) {
    const ctx = cv.getContext('2d'); const act = m.action;
    const xm = act.range[1]; const fns = act.rows.map((r) => (t) => r.e.a * t + r.e.b);
    const ym = Math.max(...fns.map((f) => Math.max(f(xm), f(act.range[0])))) * 1.1;
    VO.UI.chartAxes(ctx, cv.width, cv.height, xm, ym, m.variable.unit, 'monedas');
    const cols = ['#e2508a', '#2f6fb0', '#5a9a3a'];
    fns.forEach((f, i) => VO.UI.plotLine(ctx, cv.width, cv.height, xm, ym, f, cols[i]));
    ctx.strokeStyle = '#2a1b12'; ctx.setLineDash([4, 3]); const X = 30 + (x / xm) * (cv.width - 40); ctx.beginPath(); ctx.moveTo(X, 10); ctx.lineTo(X, cv.height - 20); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '11px sans-serif'; ctx.textAlign = 'left'; act.rows.forEach((r, i) => { ctx.fillStyle = cols[i]; ctx.fillText('■ ' + r.label, 40 + i * 140, 22); });
  }

  // ------------------------------------------------------------ TAREAS DE LA LIBRETA
  N.openTasks = function (m) {
    const g = G(); const st = g.state.missions[m.id];
    st.nb = st.nb || { step: 0, ineqOk: [], tries: {} };
    const nb = st.nb; const v = m.variable.sym;
    const t0 = performance.now();
    const body = el('div', { class: 'notebook' });
    const header = el('div', { class: 'nbhead' }, el('h3', {}, m.title), el('p', { class: 'small' }, m.context), el('p', { class: 'small' }, el('b', {}, v), ' = ' + m.variable.meaning + ' · Dominio: ' + domainText(m)));
    const stepsEl = el('div', { class: 'nbsteps' });
    const work = el('div', { class: 'nbwork' });
    body.append(header, stepsEl, work);
    const names = ['1. Escribe las condiciones', '2. Marca el intervalo', '3. ¿Qué cantidades sirven?', '4. Comprueba valores'];
    const render = () => {
      stepsEl.innerHTML = '';
      names.forEach((n, i) => stepsEl.appendChild(el('span', { class: 'nbstep' + (i < nb.step ? ' ok' : i === nb.step ? ' on' : '') }, n)));
      work.innerHTML = '';
      [stepIneq, stepInterval, stepSet, stepCheck][nb.step]();
    };
    const log = (stage, correct, err, extra) => { nb.tries[stage] = (nb.tries[stage] || 0) + (correct ? 0 : 1); VO.Analytics.log(Object.assign({ type: 'attempt', mission: m.id, stage, correct, error: err || null, ms: Math.round(performance.now() - t0), hintLevel: nb.hint || 1 }, extra || {})); if (err) st.errors.push(err); };
    const fb = el('div', { class: 'feedback' });
    const hintBtn = (stage, q) => el('button', { class: 'btn', onclick: () => {
      if (g.state.hintsAllowed === false) { fb.innerHTML = ''; fb.append(el('p', { class: 'muted' }, 'Las pistas están desactivadas por tu docente.')); return; }
      nb.hint = Math.min(4, (nb.hint || 1) + 1); st.hints++; VO.Analytics.log({ type: 'hint', mission: m.id, stage, level: nb.hint });
      fb.innerHTML = '';
      const qq = q || m.inequalities[0];
      if (nb.hint === 2) fb.append(npcSays(m, qq.question, 'normal'));
      if (nb.hint >= 3) { const c = el('canvas', { width: 520, height: 40 + m.inequalities.length * 14 + 30, class: 'nline' }); fb.append(c); N.drawLine(c, { range: viewRange(m), intervals: m.inequalities.map((q2, i) => ({ I: M.solve(q2).I, color: ['#c2453a', '#2f6fb0', '#8a3a9a'][i], alpha: 0.7, label: q2.label })) }); }
      if (nb.hint >= 4) fb.append(stepsBox(qq));
    } }, 'Pista');

    // --- Paso 1: inecuaciones
    function stepIneq() {
      const i = nb.ineqOk.length;
      if (i >= m.inequalities.length) { nb.step = 1; nb.hint = 1; return render(); }
      const q = m.inequalities[i];
      const done = el('div', { class: 'small' }); nb.ineqOk.forEach((k) => done.appendChild(el('div', { class: 'ok' }, '✔ ' + M.fmtIneq(m.inequalities[k], v))));
      const f = { a: el('input', { type: 'number', step: 'any', class: 'qty', 'aria-label': 'coeficiente de ' + v }), b: el('input', { type: 'number', step: 'any', class: 'qty', value: 0, 'aria-label': 'constante izquierda' }), c: el('input', { type: 'number', step: 'any', class: 'qty', value: 0, 'aria-label': 'coeficiente derecho' }), d: el('input', { type: 'number', step: 'any', class: 'qty', 'aria-label': 'constante derecha' }) };
      const op = el('select', { class: 'op', 'aria-label': 'signo' }); M.OPS.forEach((o) => op.appendChild(el('option', { value: o }, M.SYM[o])));
      const preview = el('code', { class: 'preview' });
      const pv = () => { const s = read(); preview.textContent = s ? M.fmtIneq({ L: s.L, R: s.R, op: s.op }, v) : '…'; };
      Object.values(f).forEach((e) => e.addEventListener('input', pv)); op.addEventListener('change', pv);
      function read() { const a = parseFloat(f.a.value), b = parseFloat(f.b.value || 0), c = parseFloat(f.c.value || 0), d = parseFloat(f.d.value); if ([a, b, c, d].some((n) => isNaN(n))) return null; return { L: { a, b }, R: { a: c, b: d }, op: op.value }; }
      const check = () => {
        const s = read(); fb.innerHTML = '';
        if (!s) { fb.append(el('p', { class: 'warn' }, 'Completa todas las casillas con números.')); VO.Analytics.game('casillas_vacias', m.id); return; }
        // ¿coincide con alguna condición aún no escrita?
        let match = -1;
        m.inequalities.forEach((qq, k) => { if (match < 0 && !nb.ineqOk.includes(k) && M.equivalent(s, qq)) match = k; });
        if (match >= 0) { nb.ineqOk.push(match); log('ineq', true, null, { value: M.fmtIneq(s, v) }); VO.Audio.sfx('good'); nb.hint = 1; return render(); }
        const err = M.diagnoseIneq(s, q);
        log('ineq', false, err, { value: M.fmtIneq(s, v) });
        VO.Audio.sfx('error');
        fb.append(el('p', { class: 'warn' }, 'Tu inecuación: ', el('code', {}, M.fmtIneq(s, v)), '. ' + ERR_MSG[err]));
        if (q.expand && nb.tries.ineq >= 2) fb.append(el('p', { class: 'small' }, 'Si la expresión tiene paréntesis, puedes escribirla ya simplificada.'));
      };
      work.append(done, el('p', {}, el('b', {}, 'Condición ' + (i + 1) + ' de ' + m.inequalities.length + ': '), q.words),
        el('div', { class: 'builder' }, f.a, el('span', {}, v + ' +'), f.b, op, f.c, el('span', {}, v + ' +'), f.d),
        el('p', { class: 'small muted' }, 'Escribe la forma ', el('code', {}, 'a' + v + ' + b  ? c' + v + ' + d'), '. Si no hay ' + v + ' en un lado, deja 0. Puedes usar números negativos.'),
        el('div', { class: 'row' }, el('span', {}, 'Vista: '), preview), fb,
        el('div', { class: 'row end' }, hintBtn('ineq', q), el('button', { class: 'btn ok', onclick: check }, 'Comprobar')));
      pv();
    }
    // --- Paso 2: intervalo
    function stepInterval() {
      const range = viewRange(m);
      const S = m.solution;
      const cv = el('canvas', { width: 520, height: 90, class: 'nline' });
      const st2 = { lo: S.sol ? Math.max(range[0], S.sol.lo === -Infinity ? range[0] : range[0]) : range[0], hi: range[1], loInf: false, hiInf: false, loC: true, hiC: true, empty: false };
      st2.lo = range[0] + 1; st2.hi = range[1] - 1;
      const lo = el('input', { type: 'number', step: 'any', class: 'qty', value: st2.lo, 'aria-label': 'extremo izquierdo' });
      const hi = el('input', { type: 'number', step: 'any', class: 'qty', value: st2.hi, 'aria-label': 'extremo derecho' });
      const loB = el('button', { class: 'btn br' }, '['), hiB = el('button', { class: 'btn br' }, ']');
      const loInf = el('label', { class: 'small' }, el('input', { type: 'checkbox' }), ' −∞'), hiInf = el('label', { class: 'small' }, el('input', { type: 'checkbox' }), ' +∞');
      const emp = el('label', {}, el('input', { type: 'checkbox' }), ' No hay solución (∅)');
      const txt = el('code', { class: 'preview' });
      const cur = () => st2.empty ? null : M.normalize(M.iv(st2.loInf ? -Infinity : st2.lo, st2.hiInf ? Infinity : st2.hi, st2.loC, st2.hiC));
      const draw = () => {
        const I = cur(); txt.textContent = st2.empty ? '∅' : M.fmtInterval(I || M.iv(st2.lo, st2.hi, st2.loC, st2.hiC));
        N.drawLine(cv, { range, intervals: [{ I, color: '#2f8a3a', y: 40, w: 6 }] });
        loB.textContent = st2.loC ? '[' : '('; hiB.textContent = st2.hiC ? ']' : ')';
        loB.disabled = st2.loInf; hiB.disabled = st2.hiInf;
      };
      lo.addEventListener('input', () => { st2.lo = parseFloat(lo.value); draw(); }); hi.addEventListener('input', () => { st2.hi = parseFloat(hi.value); draw(); });
      loB.onclick = () => { st2.loC = !st2.loC; draw(); }; hiB.onclick = () => { st2.hiC = !st2.hiC; draw(); };
      loInf.firstChild.onchange = (e) => { st2.loInf = e.target.checked; lo.disabled = st2.loInf; draw(); };
      hiInf.firstChild.onchange = (e) => { st2.hiInf = e.target.checked; hi.disabled = st2.hiInf; draw(); };
      emp.firstChild.onchange = (e) => { st2.empty = e.target.checked; draw(); };
      // clic en la recta: mueve el extremo más cercano
      cv.addEventListener('click', (e) => { const r = cv.getBoundingClientRect(); const px = (e.clientX - r.left) * (cv.width / r.width); const [a, b] = cv._range; const val = Math.round(a + ((px - 24) / (cv.width - 48)) * (b - a)); if (Math.abs(val - st2.lo) <= Math.abs(val - st2.hi)) { st2.lo = val; lo.value = val; } else { st2.hi = val; hi.value = val; } draw(); });
      const check = () => {
        fb.innerHTML = '';
        if (!st2.empty && (isNaN(st2.lo) || isNaN(st2.hi))) { fb.append(el('p', { class: 'warn' }, 'Escribe los dos extremos.')); return; }
        const I = cur();
        const err = M.diagnoseInterval(I, m);
        log('interval', !err, err, { value: st2.empty ? '∅' : M.fmtInterval(I) });
        if (!err) { VO.Audio.sfx('good'); nb.step = 2; nb.hint = 1; nb.interval = st2.empty ? '∅' : M.fmtInterval(I); return render(); }
        VO.Audio.sfx('error');
        fb.append(el('p', { class: 'warn' }, ERR_MSG[err]));
      };
      work.append(el('p', {}, 'Representa en la recta TODOS los valores de ', el('b', {}, v), ' que cumplen ' + (m.inequalities.length > 1 ? 'todas las condiciones a la vez' : 'la condición') + ':'),
        el('div', { class: 'small' }, m.inequalities.map((q) => el('div', {}, el('code', {}, M.fmtIneq(q, v))))),
        cv, el('div', { class: 'builder' }, loB, loInf, lo, el('span', {}, ','), hi, hiInf, hiB, el('span', {}, ' → '), txt),
        el('p', { class: 'small muted' }, 'Corchete [ ] = el extremo está incluido (punto relleno). Paréntesis ( ) = no está incluido (punto hueco). También puedes hacer clic en la recta para mover los extremos.'),
        m.solution.empty || m.allowImpossible ? emp : null, fb,
        el('div', { class: 'row end' }, hintBtn('interval'), el('button', { class: 'btn ok', onclick: check }, 'Comprobar')));
      draw();
    }
    // --- Paso 3: conjunto solución
    function stepSet() {
      const S = m.solution;
      const finite = m.domain.type === 'int' && S.values && S.values.length > 0 && S.values.length <= 30;
      if (finite) {
        const range = [Math.max(m.domain.min !== undefined ? m.domain.min : -100, S.values[0] - 3), S.values[S.values.length - 1] + 3];
        const sel = new Set();
        const cv = el('canvas', { width: 520, height: 60, class: 'nline dots' });
        const draw = () => N.drawLine(cv, { range, dots: true, selected: sel });
        cv.addEventListener('click', (e) => { const r = cv.getBoundingClientRect(); const px = (e.clientX - r.left) * (cv.width / r.width); const [a, b] = cv._range; const val = Math.round(a + ((px - 24) / (cv.width - 48)) * (b - a)); if (val < range[0] || val > range[1]) return; sel.has(val) ? sel.delete(val) : sel.add(val); VO.Audio.sfx('menu'); draw(); });
        const check = () => {
          fb.innerHTML = '';
          const err = M.diagnoseSet([...sel], m);
          log('set', !err, err, { value: [...sel].sort((a, b) => a - b).join(',') });
          if (!err) { VO.Audio.sfx('good'); nb.step = 3; nb.hint = 1; return render(); }
          VO.Audio.sfx('error'); fb.append(el('p', { class: 'warn' }, ERR_MSG[err]));
        };
        work.append(el('p', {}, 'Como ', el('b', {}, v), ' cuenta ' + m.variable.unit + ', solo valen números enteros. Haz clic en TODOS los valores que sirven (y solo en esos).'), cv,
          el('div', { class: 'row' }, el('button', { class: 'btn sm', onclick: () => { sel.clear(); draw(); } }, 'Borrar selección')), fb,
          el('div', { class: 'row end' }, hintBtn('set'), el('button', { class: 'btn ok', onclick: check }, 'Comprobar')));
        draw();
        return;
      }
      // opción múltiple
      const opts = setOptions(m);
      const box = el('div', { class: 'choices' });
      opts.forEach((o) => box.appendChild(el('button', { class: 'btn choice', onclick: () => {
        fb.innerHTML = '';
        log('set', o.ok, o.err, { value: o.t });
        if (o.ok) { VO.Audio.sfx('good'); nb.step = 3; nb.hint = 1; return render(); }
        VO.Audio.sfx('error'); fb.append(el('p', { class: 'warn' }, ERR_MSG[o.err] || 'Revisa otra vez.'));
      } }, o.t)));
      work.append(el('p', {}, '¿Cuál frase describe el conjunto solución completo?'), box, fb, el('div', { class: 'row end' }, hintBtn('set')));
    }
    // --- Paso 4: comprobación
    function stepCheck() {
      const vals = m.checkValues; nb.checked = nb.checked || {};
      const list = el('div', { class: 'checks' });
      vals.forEach((x) => {
        const done = nb.checked[x];
        const row = el('div', { class: 'checkrow' }, el('b', {}, v + ' = ' + num(x)));
        if (done) { row.appendChild(el('span', { class: 'ok small' }, substitution(m, x))); }
        else {
          ['Cumple', 'No cumple'].forEach((lab, k) => row.appendChild(el('button', { class: 'btn sm', onclick: () => {
            const truth = M.checkValue(x, m).ok; const ans = k === 0;
            const err = ans === truth ? null : (Number.isInteger(x) || m.domain.type !== 'int' ? (m._boundaries.some((b) => Math.abs(b - x) < 1e-9) ? 'estricta_inclusiva' : 'restriccion') : 'restriccion');
            log('check', !err, err, { value: x });
            if (!err) { nb.checked[x] = true; VO.Audio.sfx('good'); render(); }
            else { VO.Audio.sfx('error'); fb.innerHTML = ''; fb.append(el('p', { class: 'warn' }, 'Sustituye y verifica: ' + substitution(m, x) + (m.domain.type === 'int' && !Number.isInteger(x) ? ' Además, ' + v + ' debe ser un número entero.' : ''))); }
          } }, lab)));
        }
        list.appendChild(row);
      });
      work.append(el('p', {}, 'Sustituye cada valor en las condiciones. ¿Cumple todas?'), list, fb);
      if (vals.every((x) => nb.checked[x])) finish();
    }
    function finish() {
      st.status = 'done'; st.doneDay = g.state.day; st.doneT = Date.now();
      VO.Analytics.log({ type: 'mission_done', mission: m.id, attempts: st.attempts, hints: st.hints });
      const r = m.reward;
      work.append(el('div', { class: 'reward' }, el('h4', {}, '¡Libreta completa!'), el('p', {}, 'Conjunto solución: ', el('b', {}, solutionText(m))), el('p', { class: 'small' }, m.done),
        el('button', { class: 'btn ok big', onclick: () => {
          U().close();
          if (r.money) g.earn(r.money, 'recompensa');
          if (r.items) for (const k in r.items) g.giveOrDrop(k, r.items[k]);
          if (r.friendship) for (const k in r.friendship) g.state.friendship[k] = (g.state.friendship[k] || 0) + r.friendship[k];
          if (r.unlock) g.state.unlocks[r.unlock] = true;
          VO.Audio.sfx('level');
          const ch = g.refreshMissions();
          U().dialog(m.npc, [m.done, 'Toma: ' + rewardText(r) + '.'], null, () => { if (ch) N.chapterCard(ch); else if (m.id === 'c7_feria') N.ending(); });
          U().refreshHUD();
          g.save('auto');
        } }, 'Recibir recompensa')));
    }
    render();
    U().open('Libreta de planificación', body, { wide: true, paper: true, icon: 'notebook', cls: 'nbmodal' });
  };
  function domainText(m) { const d = m.domain; return (d.type === 'int' ? 'números enteros' : 'números reales') + (d.min !== undefined ? ' desde ' + d.min : '') + (d.max !== undefined ? ' hasta ' + d.max : ''); }
  function substitution(m, x) {
    return m.inequalities.map((q) => { const L = M.ev(q.L, x), R = M.ev(q.R, x); return num(L) + ' ' + M.SYM[q.op] + ' ' + num(R) + (M.holds(q, x) ? ' ✓' : ' ✗'); }).join(' · ') + (M.checkValue(x, m).ok ? ' → cumple.' : ' → no cumple.');
  }
  function solutionText(m) {
    const S = m.solution; if (!S.sol) return '∅ (ninguna cantidad cumple todas las condiciones)';
    if (S.values && S.values.length <= 20) return M.fmtInterval(S.raw ? M.applyDomain(S.raw, m.domain) : S.sol) + ' → {' + S.values.join(', ') + '}';
    return M.fmtInterval(S.raw ? M.applyDomain(S.raw, m.domain) : S.sol) + (m.domain.type === 'int' ? ' (enteros)' : ' (reales)');
  }
  N.solutionText = solutionText;
  function rewardText(r) { const p = []; if (r.money) p.push(r.money + ' monedas'); if (r.items) for (const k in r.items) p.push(r.items[k] + ' × ' + VO.ITEMS[k].name.toLowerCase()); if (r.unlock === 'rod2') p.push('una caña mejorada (zona de pesca más amplia)'); return p.join(', ') || 'mi agradecimiento'; }
  function setOptions(m) {
    const S = m.solution; const v = m.variable.sym; const u = m.variable.unit; const isInt = m.domain.type === 'int';
    const desc = (I) => {
      if (!I) return 'Ninguna cantidad: el conjunto es vacío (∅).';
      const a = I.lo, b = I.hi;
      const kind = isInt ? 'los enteros' : 'todos los números reales';
      if (b === Infinity) return `Todos ${isInt ? 'los enteros' : 'los números'} ${I.loC ? 'desde' : 'mayores que'} ${num(a)} en adelante${isInt && I.loC ? ' (' + num(a) + ', ' + num(a + 1) + ', ' + num(a + 2) + ', …)' : ''}.`;
      return `Todos ${kind} ${I.loC ? 'desde' : 'mayores que'} ${num(a)} ${I.hiC ? 'hasta' : 'y menores que'} ${num(b)}${I.hiC ? ', incluido' : ''}.`;
    };
    const sol = isInt ? S.sol : (S.raw && M.applyDomain(S.raw, m.domain));
    const opts = [{ t: desc(sol), ok: true }];
    if (sol) {
      opts.push({ t: `Solo ${v} = ${num(sol.lo)} ${u}.`, ok: false, err: 'particular_conjunto' });
      opts.push({ t: desc(Object.assign({}, sol, { loC: !sol.loC, lo: isInt ? (sol.loC ? sol.lo - 0 : sol.lo) : sol.lo })).replace('desde', 'mayores que').replace(' (', ' — sin incluir el extremo ('), ok: false, err: 'estricta_inclusiva' });
      if (sol.hi === Infinity) opts.push({ t: `Todos ${isInt ? 'los enteros' : 'los números'} hasta ${num(sol.lo)}, incluido.`, ok: false, err: 'min_max' });
      else opts.push({ t: `Todos ${isInt ? 'los enteros' : 'los números'} desde ${num(sol.hi)} en adelante.`, ok: false, err: 'min_max' });
    } else {
      const bs = M.boundaries(m.inequalities);
      opts[0].t = `Ninguna: una condición pide ${v} ≥ ${num(Math.max(...bs))} y otra ${v} ≤ ${num(Math.min(...bs))}. No se cruzan (∅).`;
      opts.push({ t: `Solo ${v} = ${num(Math.min(...bs))}, el máximo que cabe.`, ok: false, err: 'interseccion' });
      opts.push({ t: `Cualquier cantidad desde ${num(Math.max(...bs))} sirve.`, ok: false, err: 'interseccion' });
      opts.push({ t: 'Todas las cantidades sirven.', ok: false, err: 'interseccion' });
    }
    // barajar de forma estable
    return opts.map((o, i) => [VO.hash(i, m.id.length, 7), o]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  }

  // ------------------------------------------------------------ REPASO
  N.openReview = function (m) {
    const v = m.variable.sym;
    const c = el('div', { class: 'notebook' }, el('h3', {}, m.title), el('p', {}, m.context), el('p', {}, el('b', {}, v), ' = ' + m.variable.meaning));
    m.inequalities.forEach((q) => c.append(el('div', { class: 'card' }, el('code', {}, M.fmtIneq(q, v)), el('div', { class: 'small' }, q.words), stepsBox(q))));
    const cv = el('canvas', { width: 520, height: 50 + m.inequalities.length * 14 + 30, class: 'nline' });
    c.append(el('h4', {}, 'Intersección de las condiciones'), cv, el('p', {}, 'Conjunto solución: ', el('b', {}, solutionText(m))));
    N.drawLine(cv, { range: viewRange(m), intervals: m.inequalities.map((q, i) => ({ I: M.solve(q).I, color: ['#c2453a', '#2f6fb0', '#8a3a9a'][i], alpha: 0.5, label: q.label })).concat([{ I: m.solution.raw, color: '#2f8a3a', y: 24 + 0, w: 6, label: 'Solución' }]) });
    U().open('Repaso: ' + m.title, c, { wide: true, paper: true, icon: 'notebook' });
  };

  // ------------------------------------------------------------ LIBRETA LIBRE / LABORATORIO
  N.open = function () {
    const g = G(); const pend = VO.MISSIONS.find((m) => g.state.missions[m.id].status === 'notebook');
    if (pend) return N.openTasks(pend);
    N.openLab();
  };
  N.openLab = function () {
    const lab = { rows: [{ L: { a: 15, b: 0 }, op: '<=', R: { a: 0, b: 150 } }, { L: { a: 20, b: 0 }, op: '>=', R: { a: 0, b: 100 } }], int: true, x: 6 };
    const c = el('div', { class: 'notebook lab' });
    const rowsEl = el('div'); const cv = el('canvas', { width: 540, height: 130, class: 'nline' }); const out = el('div'); const steps = el('div');
    const render = () => {
      rowsEl.innerHTML = '';
      lab.rows.forEach((q, i) => {
        const inp = (obj, key, lab2) => { const e = el('input', { type: 'number', step: 'any', class: 'qty', value: obj[key], 'aria-label': lab2 }); e.addEventListener('input', () => { const v = parseFloat(e.value); if (!isNaN(v)) { obj[key] = v; draw(); } }); return e; };
        const op = el('select', { class: 'op' }); M.OPS.forEach((o) => op.appendChild(el('option', { value: o, selected: o === q.op ? 'selected' : null }, M.SYM[o]))); op.onchange = () => { q.op = op.value; draw(); };
        rowsEl.appendChild(el('div', { class: 'builder' }, el('span', { class: 'swatch', style: 'background:' + ['#c2453a', '#2f6fb0', '#8a3a9a'][i] }), inp(q.L, 'a', 'a'), el('span', {}, 'x +'), inp(q.L, 'b', 'b'), op, inp(q.R, 'a', 'c'), el('span', {}, 'x +'), inp(q.R, 'b', 'd'),
          el('button', { class: 'btn sm', onclick: () => { lab.rows.splice(i, 1); render(); } }, 'Quitar')));
      });
      draw();
    };
    const xIn = el('input', { type: 'number', step: 'any', class: 'qty', value: lab.x, 'aria-label': 'valor de prueba' }); xIn.addEventListener('input', () => { lab.x = parseFloat(xIn.value) || 0; draw(); });
    const dom = el('label', {}, el('input', { type: 'checkbox', checked: 'checked', onchange: (e) => { lab.int = e.target.checked; draw(); } }), ' Solo enteros');
    function draw() {
      const parts = lab.rows.map((q) => M.solve(q));
      const inter = M.intersectAll(parts.map((p) => p.I));
      const pts = []; lab.rows.forEach((q) => { const A = q.L.a - q.R.a; if (Math.abs(A) > 1e-9) pts.push((q.R.b - q.L.b) / A); }); pts.push(lab.x);
      const lo = Math.floor(Math.min(...pts) - 4), hi = Math.ceil(Math.max(...pts) + 4);
      const ok = lab.rows.every((q) => M.holds(q, lab.x)) && (!lab.int || Number.isInteger(lab.x));
      N.drawLine(cv, { range: [lo, hi], intervals: parts.map((p, i) => ({ I: p.I, color: ['#c2453a', '#2f6fb0', '#8a3a9a'][i], alpha: 0.55, y: 80 - i * 14 })).concat(inter ? [{ I: inter, color: '#2f8a3a', y: 20, w: 6, label: 'Intersección' }] : []), mark: lab.x, markOk: ok });
      out.innerHTML = '';
      out.append(el('p', {}, 'Intersección: ', el('b', {}, M.fmtInterval(inter)), lab.int && inter ? (M.intValues(M.tightInt(inter)) ? ' → enteros: {' + M.intValues(M.tightInt(inter)).join(', ') + '}' : ' (infinitos enteros)') : ''),
        el('p', {}, 'Con x = ' + num(lab.x) + ': ', lab.rows.map((q) => num(M.ev(q.L, lab.x)) + ' ' + M.SYM[q.op] + ' ' + num(M.ev(q.R, lab.x)) + (M.holds(q, lab.x) ? ' ✓' : ' ✗')).join(' · '), ok ? el('b', { class: 'ok' }, ' → cumple todo') : el('b', { class: 'bad' }, ' → no cumple')));
      steps.innerHTML = ''; lab.rows.forEach((q) => steps.appendChild(stepsBox(q)));
    }
    c.append(el('p', { class: 'muted' }, 'Laboratorio libre: escribe hasta tres inecuaciones, mira cada una en la recta y su intersección. Prueba valores y revisa los pasos.'), rowsEl,
      el('div', { class: 'row wrap' }, el('button', { class: 'btn sm', onclick: () => { if (lab.rows.length < 3) { lab.rows.push({ L: { a: 1, b: 0 }, op: '>', R: { a: 0, b: 0 } }); render(); } } }, '+ Condición'), el('span', {}, 'Probar x = '), xIn, dom),
      cv, out, el('details', {}, el('summary', {}, 'Ver los pasos algebraicos'), steps));
    render();
    U().open('Libreta de planificación · Laboratorio', c, { wide: true, paper: true, icon: 'notebook' });
  };

  // ------------------------------------------------------------ TARJETAS DE CAPÍTULO Y FINAL
  N.chapterCard = function (n) {
    const ch = VO.CHAPTERS[n - 1]; if (!ch) return;
    VO.Audio.sfx('level');
    U().open('Capítulo ' + n, el('div', { class: 'chapter' }, el('h2', {}, ch.title), el('p', {}, ch.goal), el('p', { class: 'muted' }, 'Busca a los vecinos con el signo ! para empezar.'), el('button', { class: 'btn ok big', onclick: () => U().close() }, 'Continuar')), { paper: true, icon: 'notebook' });
  };
  N.ending = function () {
    U().open('La Feria del Valle', el('div', { class: 'chapter' }, el('h2', {}, '¡El valle vuelve a la vida!'), el('p', {}, 'La feria llenó la plaza de música, mermelada y risas. Tu finca prospera y el taller de tu familia vuelve a tener luz.'), el('p', {}, 'Puedes seguir explorando, cultivando, pescando y mejorando tu hogar.'), el('button', { class: 'btn ok big', onclick: () => { U().close(); VO.G.state.festival = false; } }, 'Seguir jugando')), { paper: true, icon: 'coin' });
  };

  // ------------------------------------------------------------ PESCA
  const F = (VO.Fishing = {});
  F.start = function (where) {
    const g = G(); const s = g.state; const h = g.hour();
    const pool = Object.keys(VO.FISH).filter((k) => { const f = VO.FISH[k]; return f.where === where && (!f.hours || (h >= f.hours[0] && h < f.hours[1])); });
    const bait = g.count('bait') > 0;
    let fish = pool.filter((k) => !VO.FISH[k].rare || Math.random() < (bait ? 0.35 : 0.15));
    fish = fish.length ? fish : pool;
    const id = fish[(Math.random() * fish.length) | 0] || 'sardina';
    const diff = VO.FISH[id].diff;
    if (bait) g.removeItem('bait', 1);
    const rodBonus = (s.tools.rod.tier * 0.06) + (s.unlocks.rod2 ? 0.06 : 0);
    const st = { phase: 'wait', t: 0, wait: (bait ? 0.8 : 1.4) + Math.random() * 2.2, hits: 0, miss: 0, needle: 0, dir: 1, zone: 0.4, zw: Math.max(0.12, 0.3 - diff * 0.05 + rodBonus), speed: (0.7 + diff * 0.25) * (VO.Settings.reduceMotion ? 0.7 : 1), biteT: 0 };
    const cv = el('canvas', { width: 280, height: 170, class: 'fishcv' });
    const info = el('p', { class: 'center' }, 'Esperando a que piquen…');
    const btn = el('button', { class: 'btn ok big', onclick: () => press() }, '¡Tirar! (Espacio)');
    const body = el('div', { class: 'fishing' }, cv, info, btn, el('p', { class: 'small muted center' }, 'Cuando piquen, pulsa. Luego detén la aguja dentro de la zona verde: 3 aciertos antes de 3 fallos.'));
    U().open('Pescando en ' + { mar: 'el mar', lago: 'el lago', rio: 'el río' }[where], body, { paper: true, icon: 'rod0', onClose: () => { st.phase = 'closed'; window.removeEventListener('keydown', key); } });
    const key = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); press(); } };
    window.addEventListener('keydown', key, true);
    let last = performance.now();
    const loop = (now) => {
      if (st.phase === 'closed') return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; st.t += dt;
      if (st.phase === 'wait' && st.t > st.wait) { st.phase = 'bite'; st.biteT = 0; VO.Audio.sfx('bite'); info.textContent = '¡Pica! ¡Pulsa ya!'; }
      if (st.phase === 'bite') { st.biteT += dt; if (st.biteT > 1.3) { st.phase = 'lost'; info.textContent = 'Se escapó… Inténtalo de nuevo.'; VO.Audio.sfx('miss'); btn.textContent = 'Cerrar'; } }
      if (st.phase === 'reel') { st.needle += st.dir * st.speed * dt; if (st.needle > 1) { st.needle = 1; st.dir = -1; } if (st.needle < 0) { st.needle = 0; st.dir = 1; } }
      draw(); requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    function press() {
      if (st.phase === 'wait') { info.textContent = 'Paciencia… todavía no pican.'; return; }
      if (st.phase === 'bite') { st.phase = 'reel'; info.textContent = 'Detén la aguja en la zona verde.'; btn.textContent = '¡Ahora! (Espacio)'; VO.Audio.sfx('splash'); return; }
      if (st.phase === 'reel') {
        if (st.needle >= st.zone && st.needle <= st.zone + st.zw) { st.hits++; VO.Audio.sfx('hit'); st.zone = 0.05 + Math.random() * (0.9 - st.zw); st.speed *= 1.08; }
        else { st.miss++; VO.Audio.sfx('miss'); }
        info.textContent = 'Aciertos ' + st.hits + '/3 · Fallos ' + st.miss + '/3';
        if (st.hits >= 3) { st.phase = 'won'; const got = g.giveOrDrop(id, 1); VO.Audio.sfx('good'); info.textContent = '¡Atrapaste un ' + VO.ITEMS[id].name.toLowerCase() + '! Se vende a unas ' + g.price(id) + ' monedas.'; btn.textContent = 'Cerrar'; VO.Analytics.log({ type: 'fish', id }); VO.bus.emit('fish', id); }
        else if (st.miss >= 3) { st.phase = 'lost'; info.textContent = 'El pez se soltó. ¡La próxima será!'; btn.textContent = 'Cerrar'; }
        return;
      }
      U().close();
    }
    function draw() {
      const c = cv.getContext('2d'); const W = cv.width, H = cv.height;
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8fd0ee'); gr.addColorStop(0.35, '#3a97cf'); gr.addColorStop(1, '#23649c'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect((i * 47 + st.t * 20) % W, 60 + (i * 13) % 90, 14, 2); }
      const bob = st.phase === 'bite' ? Math.sin(st.t * 30) * 4 : Math.sin(st.t * 3) * 1.5;
      c.strokeStyle = '#eee'; c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, 70 + bob); c.stroke();
      c.fillStyle = '#e8452f'; c.beginPath(); c.arc(W / 2, 72 + bob, 6, 0, 6.3); c.fill(); c.fillStyle = '#fff'; c.fillRect(W / 2 - 6, 72 + bob, 12, 3);
      if (st.phase === 'bite') { c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText('!', W / 2 + 22, 64); }
      if (st.phase === 'reel' || st.phase === 'won' || st.phase === 'lost') {
        const bx = 20, by = 130, bw = W - 40;
        c.fillStyle = '#3a2618'; c.fillRect(bx - 3, by - 3, bw + 6, 22); c.fillStyle = '#f1e3c0'; c.fillRect(bx, by, bw, 16);
        c.fillStyle = '#5ab83a'; c.fillRect(bx + st.zone * bw, by, st.zw * bw, 16);
        c.fillStyle = '#c2453a'; c.fillRect(bx + st.needle * bw - 2, by - 6, 4, 28);
        for (let i = 0; i < 3; i++) { c.fillStyle = i < st.hits ? '#5ab83a' : 'rgba(255,255,255,0.4)'; c.fillRect(20 + i * 16, 100, 12, 12); c.fillStyle = i < st.miss ? '#c2453a' : 'rgba(255,255,255,0.4)'; c.fillRect(W - 68 + i * 16, 100, 12, 12); }
      }
      if (st.phase === 'won') c.drawImage(VO.Art.icon(id), W / 2 - 16, 86, 32, 32);
    }
  };
})();
