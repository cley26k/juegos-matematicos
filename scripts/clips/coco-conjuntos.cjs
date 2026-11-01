// Clips de «Coco Conjuntos». Las variables del juego (current, next, energy, QUESTIONS…) son globales de la página.
const wait = (pg, ms) => pg.waitForTimeout(ms);

// Suelta un amigo en la posición x (0–1 del ancho del tablero).
async function dropAt(pg, fx, type) {
  if (type !== undefined) await pg.evaluate(t => { current = t; update(); }, type);
  const box = await pg.locator('#game').boundingBox();
  const x = box.x + box.width * fx, y = box.y + box.height * .12;
  await pg.mouse.move(x - 60, y); await pg.mouse.move(x, y, { steps: 8 }); await wait(pg, 150);
  await pg.mouse.down(); await pg.mouse.up();
}
// Partida con algunos amigos ya en el tablero (preparación fuera de cámara).
async function warm(pg) {
  await wait(pg, 1200);
  for (const [fx, t] of [[.2, 1], [.75, 1], [.45, 2], [.3, 0], [.65, 0]]) { await dropAt(pg, fx, t); await wait(pg, 700); }
  await wait(pg, 1500);
}
async function correctTrivia(pg) {
  await pg.click('#triviaBtn'); await wait(pg, 1600);
  const ok = await pg.evaluate(() => QUESTIONS[questionIndex].ok);
  await pg.click(`#answers [data-answer="${ok}"]`); await wait(pg, 2200);
}

module.exports = {
  titulo: 'Coco Conjuntos',
  clips: [
    {
      id: 'fusion', titulo: 'Junta y crece', mecanica: 'Juego de fusión: dos números iguales forman el siguiente conjunto (ℕ → ℤ → ℚ → ℝ → ℂ)',
      run: async (pg, mark) => {
        await wait(pg, 1200); mark(); await wait(pg, 600);
        for (const [fx, t] of [[.3, 0], [.32, 0], [.7, 1], [.68, 1], [.5, 0], [.52, 0], [.66, 2]]) { await dropAt(pg, fx, t); await wait(pg, 1150); }
        await wait(pg, 1800);
      },
    },
    {
      id: 'fusion-movil', vp: 'm', titulo: 'Junta y crece (móvil)', mecanica: 'La misma mecánica en el teléfono: apuntar y soltar con el dedo',
      run: async (pg, mark) => {
        await wait(pg, 1200); mark(); await wait(pg, 500);
        for (const [fx, t] of [[.3, 0], [.33, 0], [.7, 1], [.68, 1], [.5, 0], [.48, 0]]) { await dropAt(pg, fx, t); await wait(pg, 1150); }
        await wait(pg, 1600);
      },
    },
    {
      id: 'trivia', titulo: 'Trivia de conjuntos', mecanica: 'Pregunta conceptual: acertar carga energía para los poderes',
      run: async (pg, mark) => {
        await warm(pg); mark();
        await correctTrivia(pg);
        await pg.click('#closeModal'); await wait(pg, 1500);
      },
    },
    {
      id: 'poder', titulo: 'Usar un poder', mecanica: 'Recompensa: la energía ganada pensando se gasta para despejar el tablero',
      run: async (pg, mark) => {
        await warm(pg);
        await pg.evaluate(() => { energy = 3; update(); }); await wait(pg, 600); mark(); await wait(pg, 1000);
        await pg.click('#clearPower'); await wait(pg, 1800);
        await pg.click('#shakePower'); await wait(pg, 2400);
      },
    },
    {
      id: 'aprender', titulo: 'Aprender: la familia de conjuntos', mecanica: 'Contenido: cada personaje es un conjunto numérico con ejemplos',
      run: async (pg, mark) => {
        await wait(pg, 1000); mark();
        await pg.click('#tab-aprender'); await wait(pg, 2200);
        const opts = pg.locator('#examplePicker button');
        const n = Math.min(await opts.count(), 4);
        for (let i = 0; i < n; i++) { await opts.nth(i).click(); await wait(pg, 1600); }
        await pg.mouse.wheel(0, 500); await wait(pg, 1800);
      },
    },
    {
      id: 'tiendita', titulo: 'Tiendita', mecanica: 'Economía: las monedas ganadas compran fondos y accesorios',
      run: async (pg, mark) => {
        await wait(pg, 1000); mark();
        await pg.click('#tab-tienda'); await wait(pg, 2200);
        await pg.mouse.wheel(0, 450); await wait(pg, 1800);
        const filters = pg.locator('#shopFilters button');
        if (await filters.count() > 1) { await filters.nth(1).click(); await wait(pg, 1800); }
      },
    },
  ],
};
