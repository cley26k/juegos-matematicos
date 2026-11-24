// Pruebas del motor matemático y validación de todas las misiones.
// Ejecutar: node tests/math.test.js
const path = require('path');
const fs = require('fs');
const vm = require('vm');
for (const f of ['util.js', 'math.js', 'missions.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), { filename: f });
}
const VO = globalThis.VO;
const M = VO.MathEngine;
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.log('FALLA:', msg); } }
const E = (a, b) => ({ a, b });
const Q = (L, op, R) => ({ L, op, R });

// --- Motor básico ---
ok(M.fmtInterval(M.solve(Q(E(15, 0), '<=', E(0, 150))).I) === '(-∞, 10]', '15x ≤ 150');
ok(M.fmtInterval(M.solve(Q(E(20, 0), '>', E(0, 90))).I) === '(4.5, ∞)', '20x > 90 estricta');
ok(M.fmtInterval(M.solve(Q(E(-45, 600), '>=', E(0, 240))).I) === '(-∞, 8]', 'coef negativo invierte');
ok(M.solve(Q(E(-45, 600), '>=', E(0, 240))).steps.some((s) => s.flip), 'paso con inversión de signo');
ok(M.fmtInterval(M.solve(Q(E(40, 100), '>', E(50, 60))).I) === '(-∞, 4)', 'variables en ambos miembros: x < 4');
ok(M.fmtInterval(M.solve(Q(E(2, 1), '<', E(2, 5))).I) === '(-∞, ∞)', 'identidad: todos los reales');
ok(M.solve(Q(E(2, 5), '<', E(2, 1))).I === null, 'contradicción: vacío');
ok(M.intersect(M.iv(12, Infinity, true), M.iv(-Infinity, 18, false, true)) && M.fmtInterval(M.intersect(M.iv(12, Infinity, true), M.iv(-Infinity, 18, false, true))) === '[12, 18]', 'intersección');
ok(M.intersect(M.iv(14, Infinity, true), M.iv(-Infinity, 12, false, true)) === null, 'intersección vacía');
ok(M.intersect(M.iv(-Infinity, 5, false, false), M.iv(5, Infinity, true)) === null, 'abierto/cerrado en el mismo punto');
ok(JSON.stringify(M.intValues(M.iv(4.5, 8, false, false))) === '[5,6,7]', 'enteros en (4.5, 8)');
ok(M.contains(M.iv(16, 25, false, true), 25) && !M.contains(M.iv(16, 25, false, true), 16), 'contiene límites');

// --- Diagnóstico ---
const target = Q(E(-45, 600), '>=', E(0, 240));
ok(M.diagnoseIneq(Q(E(-45, 600), '<=', E(0, 240)), target) === 'interpretacion', 'dirección invertida');
ok(M.diagnoseIneq(Q(E(-45, 600), '>', E(0, 240)), target) === 'estricta_inclusiva', 'estricta vs inclusiva');
ok(M.diagnoseIneq(Q(E(45, 600), '>=', E(0, 240)), target) === 'gasto_ingreso', 'gasto vs ingreso');
ok(M.diagnoseIneq(Q(E(-45, 600), '>=', E(0, 240)), target) === null, 'inecuación correcta');
const mv = VO.MISSION_BY_ID.c4_ventanas;
ok(M.diagnoseInterval(M.iv(8, Infinity, true), mv) === 'signo_negativo', 'olvidó invertir el signo');
ok(M.diagnoseInterval(M.iv(0, 8, true, true), mv) === null, 'intervalo correcto ventanas');
const mp = VO.MISSION_BY_ID.c2_pesca;
ok(M.diagnoseInterval(M.iv(12, Infinity, true), mp) === 'interseccion', 'solo una restricción');
ok(M.diagnoseInterval(M.iv(12, 18, false, true), mp) === 'estricta_inclusiva', 'extremo abierto erróneo');
ok(M.diagnoseSet([15], mp) === 'particular_conjunto', 'solución particular vs conjunto');
ok(M.diagnoseSet([12, 13, 14, 15, 16, 17, 18], mp) === null, 'conjunto correcto');
const mc = VO.MISSION_BY_ID.c6_corral;
ok(M.diagnoseSet([16, 17, 18, 19, 20, 21, 22, 23, 24, 25], mc) === 'estricta_inclusiva', 'incluyó el 16');
const mi = VO.MISSION_BY_ID.c6_imposible;
ok(M.diagnoseInterval(null, mi) === null, 'vacío correcto en sistema incompatible');
ok(M.diagnoseInterval(M.iv(12, 14, true, true), mi) === 'interseccion', 'incompatible no detectado');

// --- Validación de cada misión ---
for (const m of VO.MISSIONS) {
  const S = M.solveSystem(m.inequalities, m.domain);
  const dom = S.raw ? M.applyDomain(S.raw, m.domain) : null;
  const f1 = M.fmtInterval(dom), f2 = M.fmtInterval(S.sol);
  ok(f1 === m.expect.interval || f2 === m.expect.interval, `${m.id}: intervalo ${f1} / ${f2} ≠ ${m.expect.interval}`);
  if (m.expect.values) ok(JSON.stringify(S.values) === JSON.stringify(m.expect.values), `${m.id}: valores ${JSON.stringify(S.values)}`);
  if (m.expect.empty) ok(S.empty, `${m.id}: debería ser incompatible`);
  // Los valores límite se comportan como dice la solución
  for (const v of m.checkValues) {
    const inSol = S.sol ? M.contains(S.sol, v) && (m.domain.type !== 'int' || Number.isInteger(v)) : false;
    ok(M.checkValue(v, m).ok === inSol, `${m.id}: valor ${v}`);
  }
  // Cada fila de proyección y cada restricción usa números finitos
  for (const q of m.inequalities) ok(Number.isFinite(q.L.a + q.L.b + q.R.a + q.R.b), `${m.id}: coeficientes`);
  ok(m.action && m.action.range[0] <= m.action.range[1], `${m.id}: rango de acción`);
  if (S.sol && !m.allowImpossible) {
    // La solución debe ser alcanzable con el control deslizante.
    const lo = Math.max(S.sol.lo, m.action.range[0]);
    ok(lo <= m.action.range[1], `${m.id}: solución fuera del control`);
  }
}
// Cobertura de los cuatro signos y tipos de situaciones
const ops = new Set(VO.MISSIONS.flatMap((m) => m.inequalities.map((q) => q.op)));
ok(['<', '<=', '>', '>='].every((o) => ops.has(o)), 'se usan los cuatro signos');
ok(VO.MISSIONS.some((m) => m.inequalities.some((q) => q.L.a - q.R.a < 0)), 'hay coeficientes negativos');
ok(VO.MISSIONS.some((m) => m.inequalities.some((q) => q.expand)), 'hay paréntesis');
ok(VO.MISSIONS.some((m) => m.inequalities.some((q) => q.R.a !== 0)), 'variables en ambos miembros');
ok(VO.MISSIONS.some((m) => m.solution.empty), 'sistema incompatible');
ok(VO.MISSIONS.some((m) => m.domain.type === 'real'), 'dominio real');

console.log(`\n${pass} pruebas correctas, ${fail} fallidas.`);
process.exit(fail ? 1 : 0);
