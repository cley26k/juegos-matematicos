// Clips de «Puente de Cristal». Se entra por el modo Aventura (preguntas incluidas en el juego, sin IA).
const wait = (pg, ms) => pg.waitForTimeout(ms);

async function perfil(pg) {
  await wait(pg, 1500);
  await pg.fill('input', 'ANA'); await pg.click('text=CONFIRMAR IDENTIDAD'); await wait(pg, 1200);
  await pg.click('text=SALTAR BRIEFING'); await wait(pg, 1200);
  await pg.click('text=NUEVO PERFIL'); await wait(pg, 400); await pg.fill('input', 'Ana'); await pg.keyboard.press('Enter'); await wait(pg, 1200);
}
async function nivel(pg, i) {
  await pg.click('text=AVENTURA'); await wait(pg, 1000);
  await pg.locator('button').nth(i).click(); await wait(pg, 1500);
  await pg.click('text=OMITIR INTRO'); await wait(pg, 2500);
}
// El lado correcto está en la pregunta que recibe el HUD (props de React).
const ladoCorrecto = pg => pg.evaluate(() => {
  const h = [...document.querySelectorAll('h2')].find(e => e.textContent.length > 10);
  let f = h[Object.keys(h).find(k => k.startsWith('__reactFiber'))];
  while (f && !(f.memoizedProps && f.memoizedProps.question)) f = f.return;
  return f.memoizedProps.question.correctSide;
});
async function saltar(pg, bien) {
  const lado = await ladoCorrecto(pg);
  const izq = (lado === 'left') === bien;
  await pg.locator('button').filter({ hasText: izq ? /^A/ : /^B/ }).first().hover(); await wait(pg, 300);
  await pg.mouse.down(); await wait(pg, 450); await pg.mouse.up();
}

module.exports = {
  titulo: 'Puente de Cristal',
  clips: [
    {
      id: 'menu', titulo: 'Menú y modo aventura', mecanica: 'Progresión: 30 niveles en tres semanas de contenido (inecuaciones y porcentajes)',
      run: async (pg, mark) => {
        await perfil(pg); mark(); await wait(pg, 1500);
        await pg.click('text=AVENTURA'); await wait(pg, 1800);
        await pg.mouse.move(640, 400); await pg.mouse.wheel(0, 500); await wait(pg, 1500);
        await pg.mouse.wheel(0, 900); await wait(pg, 1800);
      },
    },
    {
      id: 'cruzar', titulo: 'Cruzar el puente', mecanica: 'Cada respuesta es un salto: el cristal correcto aguanta y la racha multiplica',
      run: async (pg, mark) => {
        await perfil(pg); await nivel(pg, 3); mark(); await wait(pg, 1800);
        for (let i = 0; i < 3; i++) { await saltar(pg, true); await wait(pg, 2900); }
      },
    },
    {
      id: 'caida', titulo: 'Cristal equivocado', mecanica: 'Consecuencia inmediata: la respuesta incorrecta rompe el cristal y cuesta una vida',
      run: async (pg, mark) => {
        await perfil(pg); await nivel(pg, 5); await saltar(pg, true); await wait(pg, 2600); mark(); await wait(pg, 1800);
        await saltar(pg, false); await wait(pg, 4500);
      },
    },
  ],
};
