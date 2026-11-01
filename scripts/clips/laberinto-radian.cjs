// Clips de «El Laberinto del Radián». El estado del juego vive en variables globales del script de la página.
const wait = (pg, ms) => pg.waitForTimeout(ms);
const KEY = { '-1,0': 'ArrowUp', '1,0': 'ArrowDown', '0,-1': 'ArrowLeft', '0,1': 'ArrowRight' };

// Camina por el laberinto con el teclado, siguiendo el camino más corto hasta (r, c), sin entrar en la última casilla.
async function walkTo(pg, r, c, { max = 999, delay = 95, passExtra = '[KEY_CELL, TORCH]' } = {}) {
  const p = await pg.evaluate(([r, c, pe]) => bfsPath(world, player.row, player.col, r, c, eval(pe)), [r, c, passExtra]);
  if (!p) throw new Error('sin camino');
  // No pisa los desafíos por el camino (abrirían una pregunta a mitad del clip).
  const cps = await pg.evaluate(() => checkpoints.filter(c => !c.answered).map(c => `${c.row},${c.col}`));
  for (let i = 1; i < Math.min(p.length - 1, max + 1); i++) {
    if (cps.includes(`${p[i][0]},${p[i][1]}`)) break;
    await pg.keyboard.press(KEY[`${p[i][0] - p[i - 1][0]},${p[i][1] - p[i - 1][1]}`]);
    await wait(pg, delay);
  }
  return p;
}
async function step(pg, from, to) { await pg.keyboard.press(KEY[`${to[0] - from[0]},${to[1] - from[1]}`]); }
// Empieza la partida sin las escenas de introducción.
async function play(pg) { await pg.evaluate(() => launchGame()); await wait(pg, 900); }

module.exports = {
  titulo: 'El Laberinto del Radián',
  clips: [
    {
      id: 'inicio', titulo: 'Portada e historia', mecanica: 'Narrativa: el reto se presenta como una aventura',
      run: async (pg, mark) => {
        mark(); await wait(pg, 1800);
        await pg.click('#btnStart'); await wait(pg, 2600);
        await pg.click('#csBtnNext'); await wait(pg, 2600);
        await pg.click('#csBtnNext'); await wait(pg, 2200);
      },
    },
    {
      id: 'exploracion', titulo: 'Explorar con niebla', mecanica: 'Exploración: solo se ve lo cercano; hay que orientarse',
      run: async (pg, mark) => {
        await play(pg);
        // Destino: la casilla más lejana a la que se llega sin pasar por desafíos ni por la llave.
        const target = await pg.evaluate(() => {
          const block = new Set([...checkpoints.map(c => `${c.row},${c.col}`), `${keyCell.row},${keyCell.col}`]);
          const seen = new Map([[`${player.row},${player.col}`, 0]]), q = [[player.row, player.col]]; let far = q[0];
          while (q.length) {
            const [r, c] = q.shift();
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const k = `${r + dr},${c + dc}`;
              if (seen.has(k) || block.has(k) || world[r + dr]?.[c + dc] !== FLOOR) continue;
              seen.set(k, seen.get(`${r},${c}`) + 1); q.push([r + dr, c + dc]); if (seen.get(k) > seen.get(`${far[0]},${far[1]}`)) far = [r + dr, c + dc];
            }
          }
          return far;
        });
        mark();
        await walkTo(pg, target[0], target[1], { max: 90, delay: 110 });
        await wait(pg, 500);
      },
    },
    {
      id: 'parejas', titulo: 'Minijuego de parejas', mecanica: 'Memoria: emparejar conceptos para conseguir la llave',
      run: async (pg, mark) => {
        await play(pg);
        // Preparación fuera de cámara: junto a la casilla de la llave.
        const [prev, key] = await pg.evaluate(() => {
          const p = bfsPath(world, player.row, player.col, keyCell.row, keyCell.col, [KEY_CELL, TORCH]);
          const prev = p[p.length - 2]; doMove(prev[0], prev[1]); return [prev, [keyCell.row, keyCell.col]];
        });
        await wait(pg, 900); mark(); await wait(pg, 500);
        await step(pg, prev, key); await wait(pg, 1400);
        const ids = await pg.evaluate(() => CG.cards.map(c => c.pairId));
        const cards = pg.locator('#cardGrid .card-wrap');
        // Un intento fallido primero, para que se vea la mecánica de memoria.
        const a = 0, b = ids.findIndex((x, i) => i > 0 && x !== ids[0]);
        await cards.nth(a).click(); await wait(pg, 500); await cards.nth(b).click(); await wait(pg, 1700);
        const done = new Set();
        for (let i = 0; i < ids.length; i++) {
          if (done.has(i)) continue;
          const j = ids.findIndex((x, k) => k !== i && x === ids[i]);
          done.add(i); done.add(j);
          await cards.nth(i).click(); await wait(pg, 450); await cards.nth(j).click(); await wait(pg, 900);
        }
        await wait(pg, 2600);
      },
    },
    {
      id: 'pregunta', titulo: 'Desafío correcto', mecanica: 'Evaluación: cada pregunta acertada abre el camino',
      run: async (pg, mark) => {
        await play(pg);
        // Preparación fuera de cámara: con la llave, junto al primer desafío.
        const [cp, prev] = await pg.evaluate(() => {
          hasKey = true; world[DOOR_ROW][DOOR_COL] = FLOOR; switchToPhase2(); updateHUD();
          const cp = checkpoints.find(c => !c.answered);
          const p = bfsPath(world, player.row, player.col, cp.row, cp.col);
          const prev = p[p.length - 2]; doMove(prev[0], prev[1]); return [[cp.row, cp.col], prev];
        });
        await wait(pg, 900); mark(); await wait(pg, 600);
        await step(pg, prev, cp); await wait(pg, 2200);
        const ok = await pg.evaluate(() => { const q = questions[activeCP.qIdx % questions.length]; return q.o[q.a]; });
        const all = await pg.locator('.ans-btn').allTextContents();
        await pg.locator('.ans-btn').nth(all.findIndex(t => t.slice(3) === ok)).click(); await wait(pg, 2600);
      },
    },
    {
      id: 'error', titulo: 'Respuesta incorrecta', mecanica: 'Retroalimentación: el error cuesta una vida y muestra la respuesta correcta',
      run: async (pg, mark) => {
        await play(pg);
        const [cp, prev] = await pg.evaluate(() => {
          hasKey = true; world[DOOR_ROW][DOOR_COL] = FLOOR; switchToPhase2(); updateHUD();
          const cp = checkpoints.find(c => !c.answered);
          const p = bfsPath(world, player.row, player.col, cp.row, cp.col);
          const prev = p[p.length - 2]; doMove(prev[0], prev[1]); return [[cp.row, cp.col], prev];
        });
        await wait(pg, 900); mark(); await wait(pg, 400);
        await step(pg, prev, cp); await wait(pg, 2200);
        const ok = await pg.evaluate(() => { const q = questions[activeCP.qIdx % questions.length]; return q.o[q.a]; });
        const texts = await pg.locator('.ans-btn').allTextContents();
        await pg.locator('.ans-btn').nth(texts.findIndex(t => t.slice(3) !== ok)).click(); await wait(pg, 2800);
      },
    },
  ],
};
