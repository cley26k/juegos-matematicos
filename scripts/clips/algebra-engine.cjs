// Clips de «The Algebra Engine». El juego es un lienzo: se maneja con la API de pruebas que expone (__APP y __L2, __L3…).
const wait = (pg, ms) => pg.waitForTimeout(ms);

// Clic real del ratón sobre un elemento de la escena del nivel (coordenadas de escena → página).
async function clic(pg, api, id) {
  const p = await pg.evaluate(([api, id]) => {
    const L = window[api], o = L.items().find(o => o.id === id);
    let x = o.r ? o.x : o.x + o.w / 2, y = o.r ? o.y : o.y + o.h / 2;
    if (!o.screen) ({ x, y } = L.S.cam.toScreen({ x, y }));
    return __APP.toPage(x, y);
  }, [api, id]);
  await pg.mouse.move(p.x - 40, p.y - 20); await pg.mouse.move(p.x, p.y, { steps: 10 }); await wait(pg, 250);
  await pg.mouse.click(p.x, p.y);
}
async function nivel(pg, n) {
  await wait(pg, 1500);
  await pg.evaluate(n => { __APP.reset(); __APP.testMode(); __APP.goto(n); }, n); await wait(pg, 500);
  await pg.evaluate(n => { const L = window['__L' + n]; L.S.cancel('intro'); L.S.dir.hush(); }, n); await wait(pg, 600);
}

module.exports = {
  titulo: 'The Algebra Engine',
  clips: [
    {
      id: 'comic', titulo: 'Portada y cómic', mecanica: 'Narrativa: el técnico del turno de noche llega a la fábrica de estructuras',
      run: async (pg, mark) => {
        await pg.evaluate(() => __APP.reset()); await pg.reload(); await wait(pg, 1800); mark(); await wait(pg, 1800);
        await pg.keyboard.press('Enter'); await wait(pg, 1800);
        for (let i = 0; i < 6; i++) { await pg.keyboard.press('ArrowRight'); await wait(pg, 1300); }
      },
    },
    {
      id: 'garra', titulo: 'Taller de inspección', mecanica: 'Experimentar: la palanca prueba la máquina ×2 y la lupa muestra por qué no es inyectiva',
      run: async (pg, mark) => {
        await nivel(pg, 2); mark(); await wait(pg, 1200);
        await clic(pg, '__L2', 'lever'); await wait(pg, 4500);
        await pg.evaluate(() => { __L2.S.dir.hush(); __L2.pick(__L2.bench()[0]); }); await wait(pg, 900);
        await pg.evaluate(() => __L2.pick(__L2.bench()[1])); await wait(pg, 4000);
      },
    },
    {
      id: 'clasificacion', titulo: 'Planta de clasificación', mecanica: 'Contraejemplo: el probador encuentra el par que rompe la operación',
      run: async (pg, mark) => {
        await nivel(pg, 3); mark(); await wait(pg, 1000);
        await clic(pg, '__L3', 'produce'); await wait(pg, 3500);
        await clic(pg, '__L3', 'bin1'); await wait(pg, 2200);
        await clic(pg, '__L3', 'tag'); await wait(pg, 600); await pg.keyboard.press('p'); await wait(pg, 4000);
      },
    },
  ],
};
