// Clips de «Sudoku Academy». Para saber la respuesta de un ejercicio se lee la prop `ex` del componente React.
const wait = (pg, ms) => pg.waitForTimeout(ms);
const D = 864e5, now = Date.now();
const day = d => { const x = new Date(now - d * D); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

// Perfil con progreso realista (6 lecciones, racha de 5 días) para que la app no aparezca vacía.
function profile(extra = {}) {
  const lessons = {}; for (const id of ['rules', 'candidates', 'naked_single', 'hidden_single', 'pointing', 'claiming']) lessons[id] = { done: true, test: true, t: now - 3 * D };
  const attempts = []; for (let i = 0; i < 30; i++) attempts.push({ t: now - (i % 5) * D - i * 1000, tech: ['naked_single', 'hidden_single', 'pointing'][i % 3], kind: 'deduce', ok: true, hints: 0, errors: 0, ms: 15000, variant: '', exId: '' });
  return { v: 1, welcomed: true, lessons, attempts, mistakes: [], sessions: [], daily: {}, settings: { streaks: true, theme: 'light', sound: false, music: false }, fullSolved: 3, chests: [1], gems: 140, owned: ['gorra'], equipped: { hat: 'gorra' }, quests: {}, achievements: { lecciones: 1, racha: 1, sinpistas: 2, resolutor: 1, perfecto: 1, veloz: 1, combo: 1, rush: 1 }, levelSeen: 99, rushBest: 6, rushDays: [], freezes: 1, freezeDays: [], bonusXp: {}, combo: { day: '', best: 0 }, bestStreak: 5, dailyChests: [day(0)], streakSeen: day(0), perfect: 2, ...extra };
}
// Los avisos de logros del perfil de ejemplo taparían el principio de cada clip: se ocultan.
const seed = p => `if(!sessionStorage.getItem('seeded')){localStorage.setItem('sudoku-academy/v1',${JSON.stringify(JSON.stringify(p))});sessionStorage.setItem('seeded','1')}
addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='.toasts{display:none!important}';document.head.appendChild(s)})`;

// Ejercicio activo: sube por el árbol de React desde el tablero hasta encontrar la prop `ex`.
async function exercise(pg) {
  return pg.evaluate(() => {
    const el = document.querySelector('.board-wrap'); const k = Object.keys(el).find(x => x.startsWith('__reactFiber'));
    for (let f = el[k]; f; f = f.return) { const ex = f.memoizedProps?.ex; if (ex?.steps) return { place: ex.steps[0].placements, elims: ex.steps[0].elims }; }
    return null;
  });
}
// Coordenadas en pantalla de una casilla (y opcionalmente de uno de sus candidatos).
async function cellPoint(pg, cell, digit) {
  const box = await pg.locator('svg.board').first().boundingBox();
  const O = 46, VB = 904 + O, r = Math.floor(cell / 9), c = cell % 9;
  const x = digit ? c * 100 + 20 + ((digit - 1) % 3) * 30 : c * 100 + 50, y = digit ? r * 100 + 21 + Math.floor((digit - 1) / 3) * 29 : r * 100 + 50;
  return { x: box.x + (x + O) / VB * box.width, y: box.y + (y + O) / VB * box.height };
}
async function tapCell(pg, cell, digit) { const p = await cellPoint(pg, cell, digit); await pg.mouse.move(p.x, p.y, { steps: 10 }); await pg.mouse.down(); await pg.mouse.up(); }
async function padDigit(pg, d) { await pg.locator('.pad-digits button', { hasText: String(d) }).first().click(); }
async function btn(pg, text) { await pg.getByRole('button', { name: text }).first().click(); }

module.exports = {
  titulo: 'Sudoku Academy',
  init: seed(profile()),
  clips: [
    {
      id: 'ruta', vp: 'm', titulo: 'Ruta de aprendizaje', mecanica: 'Progresión: unidades, lecciones desbloqueables, racha y misiones diarias',
      run: async (pg, mark) => {
        await pg.goto(pg.url().split('#')[0] + '#inicio'); await wait(pg, 2500); mark(); await wait(pg, 1500);
        for (let i = 0; i < 6; i++) { await pg.mouse.wheel(0, 260); await wait(pg, 650); }
        await wait(pg, 800);
        await pg.locator('.pnode.is-next').first().click(); await wait(pg, 2200);
      },
    },
    {
      id: 'leccion-concepto', titulo: 'Lección animada', mecanica: 'Explicación visual paso a paso de una técnica (X-Wing)',
      run: async (pg, mark) => {
        await pg.goto(pg.url().split('#')[0] + '#leccion-x-wing'); await wait(pg, 2500); mark(); await wait(pg, 1500);
        for (let i = 0; i < 4; i++) { await pg.locator('.hint-btn').click(); await wait(pg, 1900); }
        await pg.locator('.hint-btn').click(); await wait(pg, 6000);
      },
    },
    {
      id: 'acierto', titulo: 'Deducir y acertar', mecanica: 'Práctica: colocar el número correcto da XP y una celebración',
      run: async (pg, mark) => {
        await pg.goto(pg.url().split('#')[0] + '#entrenar-hidden-single'); await wait(pg, 2500);
        const ex = await exercise(pg); mark(); await wait(pg, 1500);
        const q = ex.place[0]; await tapCell(pg, q.cell); await wait(pg, 700); await padDigit(pg, q.digit); await wait(pg, 3000);
      },
    },
    {
      id: 'error-pista', titulo: 'Error y pista', mecanica: 'Retroalimentación: el tutor explica el error y ofrece pistas graduadas',
      run: async (pg, mark) => {
        await pg.goto(pg.url().split('#')[0] + '#entrenar-naked-single'); await wait(pg, 2500);
        const ex = await exercise(pg); mark(); await wait(pg, 1200);
        const q = ex.place[0]; const wrong = q.digit === 9 ? 1 : q.digit + 1;
        await tapCell(pg, q.cell); await wait(pg, 600); await padDigit(pg, wrong); await wait(pg, 2600);
        await pg.locator('.hint-btn').click(); await wait(pg, 2400);
        await pg.locator('.hint-btn').click(); await wait(pg, 2400);
      },
    },
    {
      id: 'eliminar', titulo: 'Tachar candidatos', mecanica: 'Técnicas avanzadas: eliminar candidatos con un patrón (bloqueo caja-línea)',
      run: async (pg, mark) => {
        await pg.goto(pg.url().split('#')[0] + '#entrenar-pointing'); await wait(pg, 2500);
        const ex = await exercise(pg); mark(); await wait(pg, 1500);
        for (const e of ex.elims.slice(0, 4)) { await tapCell(pg, e.cell, e.digit); await wait(pg, 700); }
        await btn(pg, /Comprobar/i); await wait(pg, 3000);
      },
    },
    {
      id: 'sudoku', titulo: 'Sudoku completo', mecanica: 'Juego libre: notas, pistas que se aplican y cronómetro',
      run: async (pg, mark) => {
        await pg.goto(pg.url().split('#')[0] + '#sudoku'); await wait(pg, 2000);
        await pg.locator('.level-card', { hasText: 'Fácil' }).click(); await wait(pg, 2500); mark(); await wait(pg, 1000);
        await pg.locator('.tool', { hasText: 'Pista' }).click(); await wait(pg, 1600);
        for (let i = 0; i < 2; i++) { await btn(pg, /Más pista/i); await wait(pg, 1500); }
        await btn(pg, /Aplicar/i); await wait(pg, 1500);
        await pg.locator('.tool', { hasText: 'Pista' }).click(); await wait(pg, 1400);
        for (let i = 0; i < 2; i++) { await btn(pg, /Más pista/i); await wait(pg, 1200); }
        await btn(pg, /Aplicar/i); await wait(pg, 1800);
      },
    },
    {
      id: 'contrarreloj', titulo: 'Contrarreloj', mecanica: 'Reto con tiempo y vidas: 3 minutos para resolver todo lo posible',
      run: async (pg, mark) => {
        await pg.goto(pg.url().split('#')[0] + '#contrarreloj'); await wait(pg, 2000); mark(); await wait(pg, 1500);
        await btn(pg, /Empezar/i); await wait(pg, 1800);
        for (let i = 0; i < 3; i++) {
          const ex = await exercise(pg); if (!ex) break;
          if (ex.place.length) { await tapCell(pg, ex.place[0].cell); await wait(pg, 400); await padDigit(pg, ex.place[0].digit); }
          else { for (const e of ex.elims) { await tapCell(pg, e.cell, e.digit); await wait(pg, 300); } await btn(pg, /Comprobar/i); }
          await wait(pg, 1600);
        }
        await wait(pg, 800);
      },
    },
    {
      id: 'subida-nivel', vp: 'm', titulo: 'Subir de nivel', mecanica: 'Recompensa: celebración al subir de nivel, con gemas',
      run: async (pg, mark) => {
        await pg.evaluate(() => { const p = JSON.parse(localStorage.getItem('sudoku-academy/v1')); p.levelSeen = 1; localStorage.setItem('sudoku-academy/v1', JSON.stringify(p)); });
        mark(); await pg.goto(pg.url().split('#')[0] + '#inicio'); await pg.reload(); await wait(pg, 5200);
      },
    },
  ],
};
