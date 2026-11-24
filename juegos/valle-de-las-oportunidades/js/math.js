'use strict';
// Motor matemático: inecuaciones lineales con una variable, intervalos,
// intersecciones, dominios enteros/reales y diagnóstico de errores.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const M = (VO.MathEngine = {});
  const EPS = 1e-9;
  M.OPS = ['<', '<=', '>', '>='];
  M.SYM = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' };
  M.flip = (op) => ({ '<': '>', '<=': '>=', '>': '<', '>=': '<=' }[op]);
  M.strictSwap = (op) => ({ '<': '<=', '<=': '<', '>': '>=', '>=': '>' }[op]);

  M.cmp = function (v, op, w) {
    switch (op) {
      case '<': return v < w - EPS;
      case '<=': return v <= w + EPS;
      case '>': return v > w + EPS;
      case '>=': return v >= w - EPS;
    }
    return false;
  };
  M.ev = (e, x) => e.a * x + e.b;
  M.holds = (q, x) => M.cmp(M.ev(q.L, x), q.op, M.ev(q.R, x));

  M.num = function (n) {
    if (n === Infinity) return '∞';
    if (n === -Infinity) return '-∞';
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return String(Math.round(n * 100) / 100);
  };
  M.fmtExpr = function (e, v) {
    v = v || 'x';
    const parts = [];
    if (Math.abs(e.a) > EPS) {
      const a = e.a === 1 ? '' : e.a === -1 ? '-' : M.num(e.a);
      parts.push(a + v);
    }
    if (Math.abs(e.b) > EPS || parts.length === 0) {
      if (parts.length === 0) parts.push(M.num(e.b));
      else parts.push((e.b < 0 ? ' - ' : ' + ') + M.num(Math.abs(e.b)));
    }
    return parts.join('');
  };
  M.fmtIneq = (q, v) => q.text || M.fmtExpr(q.L, v) + ' ' + M.SYM[q.op] + ' ' + M.fmtExpr(q.R, v);

  // Intervalo: {lo, hi, loC, hiC}; null = vacío.
  M.ALL = { lo: -Infinity, hi: Infinity, loC: false, hiC: false };
  M.iv = (lo, hi, loC, hiC) => ({ lo, hi, loC: lo === -Infinity ? false : !!loC, hiC: hi === Infinity ? false : !!hiC });

  M.normalize = function (I) {
    if (!I) return null;
    if (I.lo > I.hi + EPS) return null;
    if (Math.abs(I.lo - I.hi) < EPS && !(I.loC && I.hiC)) return null;
    return I;
  };

  // Resuelve una inecuación; devuelve intervalo y pasos explicados.
  M.solve = function (q, opts) {
    opts = opts || {};
    const steps = [];
    const v = opts.v || 'x';
    steps.push({ t: M.fmtIneq(q, v), why: 'Inecuación original.' });
    if (q.expand) steps.push({ t: q.expand, why: 'Eliminamos los paréntesis (propiedad distributiva).' });
    const A = q.L.a - q.R.a;
    const C = q.R.b - q.L.b;
    if (Math.abs(q.R.a) > EPS) {
      steps.push({ t: M.fmtExpr({ a: A, b: q.L.b }, v) + ' ' + M.SYM[q.op] + ' ' + M.num(q.R.b),
        why: (q.R.a > 0 ? 'Restamos ' : 'Sumamos ') + M.num(Math.abs(q.R.a)) + v + ' en ambos miembros.' });
    }
    if (Math.abs(q.L.b) > EPS) {
      steps.push({ t: M.fmtExpr({ a: A, b: 0 }, v) + ' ' + M.SYM[q.op] + ' ' + M.num(C),
        why: (q.L.b > 0 ? 'Restamos ' : 'Sumamos ') + M.num(Math.abs(q.L.b)) + ' en ambos miembros.' });
    }
    let op = q.op;
    let I;
    if (Math.abs(A) < EPS) {
      const ok = M.cmp(0, op, C);
      steps.push({ t: '0 ' + M.SYM[op] + ' ' + M.num(C), why: ok ? 'Es verdadero para cualquier valor: todos los números sirven.' : 'Es falso para cualquier valor: no hay solución.' });
      return { I: ok ? M.ALL : null, steps };
    }
    const k = C / A;
    if (A < 0 && !opts.noFlip) {
      op = M.flip(op);
      steps.push({ t: v + ' ' + M.SYM[op] + ' ' + M.num(k), why: 'Dividimos entre ' + M.num(A) + '. Como es negativo, ¡invertimos el signo de la desigualdad!', flip: true });
    } else if (Math.abs(A - 1) > EPS) {
      steps.push({ t: v + ' ' + M.SYM[op] + ' ' + M.num(k), why: 'Dividimos ambos miembros entre ' + M.num(A) + '.' });
    }
    if (op === '<') I = M.iv(-Infinity, k, false, false);
    else if (op === '<=') I = M.iv(-Infinity, k, false, true);
    else if (op === '>') I = M.iv(k, Infinity, false, false);
    else I = M.iv(k, Infinity, true, false);
    return { I, steps };
  };

  M.intersect = function (a, b) {
    if (!a || !b) return null;
    let lo, loC, hi, hiC;
    if (a.lo > b.lo + EPS) { lo = a.lo; loC = a.loC; } else if (b.lo > a.lo + EPS) { lo = b.lo; loC = b.loC; } else { lo = a.lo; loC = a.loC && b.loC; }
    if (a.hi < b.hi - EPS) { hi = a.hi; hiC = a.hiC; } else if (b.hi < a.hi - EPS) { hi = b.hi; hiC = b.hiC; } else { hi = a.hi; hiC = a.hiC && b.hiC; }
    return M.normalize({ lo, hi, loC, hiC });
  };
  M.intersectAll = (list) => list.reduce((acc, I) => M.intersect(acc, I), M.ALL);

  M.contains = (I, x) => !!I && (I.loC ? x >= I.lo - EPS : x > I.lo + EPS) && (I.hiC ? x <= I.hi + EPS : x < I.hi - EPS);

  M.fmtInterval = function (I) {
    if (!I) return '∅';
    if (I.lo === -Infinity && I.hi === Infinity) return '(-∞, ∞)';
    if (Math.abs(I.lo - I.hi) < EPS) return '{' + M.num(I.lo) + '}';
    return (I.loC ? '[' : '(') + M.num(I.lo) + ', ' + M.num(I.hi) + (I.hiC ? ']' : ')');
  };

  // Dominio: {type:'int'|'real', min, max}
  M.domainInterval = (d) => M.iv(d.min === undefined ? -Infinity : d.min, d.max === undefined ? Infinity : d.max, true, true);
  M.applyDomain = (I, d) => M.intersect(I, M.domainInterval(d));

  M.intValues = function (I, cap) {
    cap = cap || 400;
    if (!I) return [];
    let a = Math.ceil(I.lo - EPS), b = Math.floor(I.hi + EPS);
    if (!I.loC && Math.abs(a - I.lo) < EPS) a++;
    if (!I.hiC && Math.abs(b - I.hi) < EPS) b--;
    if (a === -Infinity || b === Infinity || b - a > cap) return null; // infinito
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  };

  // Para dominio entero, intervalo "ajustado" a enteros: (4.5, ∞) -> [5, ∞)
  M.tightInt = function (I) {
    if (!I) return null;
    let lo = I.lo, hi = I.hi;
    if (lo !== -Infinity) { lo = Math.ceil(lo - EPS); if (!I.loC && Math.abs(lo - I.lo) < EPS) lo++; }
    if (hi !== Infinity) { hi = Math.floor(hi + EPS); if (!I.hiC && Math.abs(hi - I.hi) < EPS) hi--; }
    return M.normalize(M.iv(lo, hi, true, true));
  };

  M.solveSystem = function (ineqs, domain) {
    const parts = ineqs.map((q) => M.solve(q));
    const raw = M.intersectAll(parts.map((p) => p.I));
    const inDom = domain ? M.applyDomain(raw, domain) : raw;
    const sol = domain && domain.type === 'int' ? M.tightInt(inDom) : inDom;
    const values = domain && domain.type === 'int' ? M.intValues(sol) : null;
    return { parts, raw, sol, values, empty: !sol };
  };

  M.sameInterval = function (a, b) {
    if (!a || !b) return !a && !b;
    const eq = (x, y) => (x === y) || Math.abs(x - y) < 1e-6;
    return eq(a.lo, b.lo) && eq(a.hi, b.hi) && (a.lo === -Infinity || a.loC === b.loC) && (a.hi === Infinity || a.hiC === b.hiC);
  };

  // ¿Dos intervalos describen el mismo conjunto dentro del dominio?
  M.sameOnDomain = function (a, b, d) {
    const A = M.applyDomain(a, d), B = M.applyDomain(b, d);
    if (d.type === 'int') {
      const va = M.intValues(A), vb = M.intValues(B);
      if (va === null || vb === null) return M.sameInterval(M.tightInt(A), M.tightInt(B));
      return va.length === vb.length && va.every((x, i) => x === vb[i]);
    }
    return M.sameInterval(A, B);
  };

  // ¿Dos inecuaciones son equivalentes (mismo conjunto solución real)?
  M.equivalent = (q1, q2) => M.sameInterval(M.solve(q1).I, M.solve(q2).I);

  // ---------- Diagnóstico de errores ----------
  M.ERRORS = {
    gasto_ingreso: 'Confusión entre gasto e ingreso',
    interpretacion: 'Interpretación incorrecta de la desigualdad',
    min_max: 'Confusión entre cantidad mínima y máxima',
    calculo: 'Error de cálculo',
    estricta_inclusiva: 'Confusión entre desigualdad estricta e inclusiva',
    restriccion: 'Incumplimiento de una restricción',
    signo_negativo: 'Error al invertir el signo (coeficiente negativo)',
    interseccion: 'Interpretación incorrecta de la intersección',
    particular_conjunto: 'Confusión entre una solución particular y el conjunto solución',
  };

  // Diagnostica una inecuación construida por el estudiante frente a una objetivo.
  M.diagnoseIneq = function (stu, target) {
    if (M.equivalent(stu, target)) return null;
    const flipOp = { L: stu.L, R: stu.R, op: M.flip(stu.op) };
    if (M.equivalent(flipOp, target)) return 'interpretacion';
    const strict = { L: stu.L, R: stu.R, op: M.strictSwap(stu.op) };
    if (M.equivalent(strict, target)) return 'estricta_inclusiva';
    // Signo de algún coeficiente cambiado: gasto ↔ ingreso
    const variants = [
      { L: { a: -stu.L.a, b: stu.L.b }, R: stu.R, op: stu.op },
      { L: { a: stu.L.a, b: -stu.L.b }, R: stu.R, op: stu.op },
      { L: stu.L, R: { a: -stu.R.a, b: stu.R.b }, op: stu.op },
      { L: stu.L, R: { a: stu.R.a, b: -stu.R.b }, op: stu.op },
    ];
    for (const v of variants) if (M.equivalent(v, target)) return 'gasto_ingreso';
    return 'calculo';
  };

  // Diagnostica un intervalo propuesto frente a la misión (sistema + dominio).
  M.diagnoseInterval = function (stu, mission) {
    const d = mission.domain;
    const S = M.solveSystem(mission.inequalities, d);
    const stuD = stu ? M.applyDomain(stu, d) : null;
    if (M.sameOnDomain(stu || null, S.raw || null, d) || (!S.sol && !stuD)) return null;
    if (!S.sol && stuD) return 'interseccion';
    if (S.sol && !stuD) return 'interseccion';
    // ¿Olvidó invertir el signo?
    const hasNeg = mission.inequalities.some((q) => q.L.a - q.R.a < 0);
    if (hasNeg) {
      const nf = M.intersectAll(mission.inequalities.map((q) => M.solve(q, { noFlip: true }).I));
      if (nf && M.sameOnDomain(stu, nf, d)) return 'signo_negativo';
    }
    // ¿Sólo una de las restricciones o la unión?
    if (mission.inequalities.length > 1) {
      for (const q of mission.inequalities) if (M.sameOnDomain(stu, M.solve(q).I, d)) return 'interseccion';
    }
    const sol = S.raw;
    const eq = (a, b) => a === b || Math.abs(a - b) < 1e-6;
    // Mismos extremos pero distinta inclusión
    if (sol && eq(stu.lo, sol.lo) && eq(stu.hi, sol.hi)) return 'estricta_inclusiva';
    // Dirección invertida (mínimo ↔ máximo)
    if (sol && ((eq(stu.hi, sol.lo) && stu.lo === -Infinity && sol.hi === Infinity) || (eq(stu.lo, sol.hi) && stu.hi === Infinity && sol.lo === -Infinity))) return 'min_max';
    // Contiene valores que violan alguna restricción
    if (sol && stuD) {
      const inS = M.intersect(stuD, M.applyDomain(sol, d));
      if (inS && M.sameOnDomain(inS, sol, d)) return 'restriccion';
    }
    return 'calculo';
  };

  // Diagnóstico de un valor particular: qué restricciones incumple.
  M.checkValue = function (x, mission) {
    const d = mission.domain;
    const violated = [];
    mission.inequalities.forEach((q, i) => { if (!M.holds(q, x)) violated.push(i); });
    const inDomain = (d.type !== 'int' || Math.abs(x - Math.round(x)) < EPS) && (d.min === undefined || x >= d.min - EPS) && (d.max === undefined || x <= d.max + EPS);
    return { ok: violated.length === 0 && inDomain, violated, inDomain };
  };

  // Diagnóstico de un conjunto de enteros seleccionados.
  M.diagnoseSet = function (selected, mission) {
    const S = M.solveSystem(mission.inequalities, mission.domain);
    const want = S.values || [];
    const sel = [...selected].sort((a, b) => a - b);
    const ok = sel.length === want.length && sel.every((v, i) => v === want[i]);
    if (ok) return null;
    if (want.length > 1 && sel.length === 1 && want.includes(sel[0])) return 'particular_conjunto';
    const extra = sel.filter((v) => !want.includes(v));
    const missing = want.filter((v) => !sel.includes(v));
    if (extra.length && !missing.length) {
      // ¿incluyó un extremo excluido?
      const b = mission._boundaries || [];
      if (extra.every((v) => b.some((x) => Math.abs(x - v) < EPS))) return 'estricta_inclusiva';
      return 'restriccion';
    }
    if (missing.length && !extra.length) return sel.length <= 1 ? 'particular_conjunto' : 'calculo';
    return 'calculo';
  };

  // Valores límite (extremos de cada inecuación) para pruebas y pistas.
  M.boundaries = function (ineqs) {
    const out = [];
    ineqs.forEach((q) => {
      const A = q.L.a - q.R.a;
      if (Math.abs(A) > EPS) out.push((q.R.b - q.L.b) / A);
    });
    return out;
  };
})();
