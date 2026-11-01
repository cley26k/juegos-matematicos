// Clips de «Portero Algebraico · UMBRAL». El juego usa módulos ES: la respuesta correcta se consulta
// importando el mismo módulo de operaciones que usa la página.
const wait = (pg, ms) => pg.waitForTimeout(ms);
const visible = (pg, sel, timeout = 20000) => pg.locator(sel).waitFor({ state: 'visible', timeout });

async function openWorld(pg) {
  await visible(pg, '#adventure'); await wait(pg, 1500);
  await pg.click('#adventure'); await wait(pg, 1400);
  await pg.locator('#levelButtons button').first().click(); await wait(pg, 1500);
}
async function startShift(pg) { await pg.click('#startShift'); }
// Espera al cliente y coge su carnet.
async function takeCard(pg) { await visible(pg, '#takeCard', 30000); await wait(pg, 700); await pg.click('#takeCard'); await wait(pg, 1300); }
// ¿Hay que dejar pasar a este cliente? (la operación ¿cumple la propiedad del mundo?)
async function shouldAdmit(pg) {
  return pg.evaluate(async () => {
    const { pools } = await import('./encounters.js');
    const txt = document.getElementById('cardAccessible').textContent;
    const op = pools.flat().find(o => txt.endsWith(`Conjunto: ${o.set}. Operación: ${o.formula}.`));
    return op ? op.allowed : null;
  });
}
async function decide(pg, correct) {
  const admit = await shouldAdmit(pg);
  await pg.click((admit === correct) ? '#admit' : '#reject');
  await visible(pg, '#nextCustomer', 30000);
}

module.exports = {
  titulo: 'Portero Algebraico · UMBRAL',
  clips: [
    {
      id: 'historia', titulo: 'Mundos e historia', mecanica: 'Narrativa: cada mundo es una propiedad algebraica contada como un cómic',
      run: async (pg, mark) => {
        await visible(pg, '#adventure'); await wait(pg, 1200); mark(); await wait(pg, 1800);
        await pg.click('#adventure'); await wait(pg, 2600);
        await pg.locator('#levelButtons button').first().click(); await wait(pg, 5500);
      },
    },
    {
      id: 'carnet', titulo: 'Revisar el carnet', mecanica: 'Exploración 3D: cada cliente trae una operación sobre un conjunto',
      run: async (pg, mark) => {
        await openWorld(pg); mark();
        await startShift(pg); await takeCard(pg); await wait(pg, 1600);
        await pg.click('#flipCard'); await wait(pg, 2400);
      },
    },
    {
      id: 'decision-correcta', titulo: 'Decidir bien', mecanica: '¿La operación es cerrada / forma grupo? Acertar muestra el porqué',
      run: async (pg, mark) => {
        await openWorld(pg); await startShift(pg); await takeCard(pg); mark(); await wait(pg, 1500);
        await decide(pg, true); await wait(pg, 3500);
      },
    },
    {
      id: 'decision-incorrecta', titulo: 'Equivocarse', mecanica: 'Retroalimentación: el error se explica con un contraejemplo',
      run: async (pg, mark) => {
        await openWorld(pg); await startShift(pg); await takeCard(pg); mark(); await wait(pg, 1500);
        await decide(pg, false); await wait(pg, 3800);
      },
    },
    {
      id: 'reporte', titulo: 'Cierre del turno', mecanica: 'Evaluación: estrellas y repaso de cada decisión al final del mundo',
      run: async (pg, mark) => {
        await openWorld(pg); await startShift(pg);
        for (let i = 0; i < 5; i++) { await takeCard(pg); await decide(pg, i !== 2); await pg.click('#nextCustomer'); }
        await takeCard(pg); mark(); await wait(pg, 1000);
        await decide(pg, true); await wait(pg, 1500);
        await pg.click('#nextCustomer'); await wait(pg, 3500);
        await pg.mouse.wheel(0, 400); await wait(pg, 1500);
      },
    },
  ],
};
