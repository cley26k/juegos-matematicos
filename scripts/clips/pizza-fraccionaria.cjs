// Clips de «Pizza Fraccionaria». La página es alta: se reduce con zoom para que la pizza y el panel quepan en el vídeo.
const wait = (pg, ms) => pg.waitForTimeout(ms);

async function entrar(pg) {
  await pg.fill('#student-name', 'Ana'); await pg.click('text=EMPEZAR A JUGAR'); await wait(pg, 1200);
}
// La insignia «PEDAZOS n de d» de la pizza del problema da la fracción correcta.
async function fraccion(pg) {
  const t = await pg.evaluate(() => document.body.innerText);
  const m = /PEDAZOS\s+(\d+)\s+de\s+(\d+)/.exec(t);
  return { n: +m[1], d: +m[2], tipo: /NUMERADOR/.test(t.split('SELECCIONA')[1] || '') ? 'n' : /DENOMINADOR/.test(t.split('SELECCIONA')[1] || '') ? 'd' : 'f' };
}
async function responder(pg, bien) {
  const { n, d, tipo } = await fraccion(pg);
  const txt = tipo === 'n' ? String(bien ? n : n + 1) : tipo === 'd' ? String(bien ? d : d + 1) : null;
  const opts = pg.locator('main button, button').filter({ hasNotText: /Nivel|NIVEL|pista|Comprobar|Reiniciar|Práctica|Desafío|Ana|sonido/ });
  if (txt) await opts.filter({ hasText: new RegExp(`^\s*${txt}\s*$`) }).first().click();
  else {
    const all = await opts.allInnerTexts();
    const i = all.findIndex(s => { const m = /(\d+)\s*\D+\s*(\d+)/.exec(s); return m && (+m[1] === n && +m[2] === d) === bien; });
    await opts.nth(i).click();
  }
  await wait(pg, 700);
  await pg.click('text=Comprobar Respuesta'); await wait(pg, 2600);
}

module.exports = {
  titulo: 'Pizza Fraccionaria',
  init: () => { addEventListener('DOMContentLoaded', () => { document.documentElement.style.zoom = '0.62'; }); },
  clips: [
    {
      id: 'laboratorio', titulo: 'Laboratorio de pizza', mecanica: 'Manipulación: cortar la pizza y comerse pedazos construye la fracción',
      run: async (pg, mark) => {
        await entrar(pg); mark(); await wait(pg, 800);
        await pg.click('button:has-text("8")'); await wait(pg, 1500);
        const slices = pg.locator('svg g.cursor-pointer');
        for (const i of [0, 1, 2]) { await slices.nth(i).click(); await wait(pg, 1100); }
        await wait(pg, 1200);
        await pg.click('button:has-text("3")'); await wait(pg, 1400);
        await slices.nth(0).click(); await wait(pg, 1800);
      },
    },
    {
      id: 'desafio', titulo: 'Desafío del Profe Nelson', mecanica: 'Evaluación con personaje: identificar numerador y denominador suma puntos y estrellas',
      run: async (pg, mark) => {
        await entrar(pg); await pg.click('text=Modo Desafío'); await wait(pg, 1200); mark(); await wait(pg, 1000);
        await responder(pg, true);
        await pg.click('text=/Siguiente|Próxima|Continuar/'); await wait(pg, 1400);
        await responder(pg, true); await wait(pg, 600);
      },
    },
    {
      id: 'error', titulo: 'Respuesta incorrecta', mecanica: 'Retroalimentación: el profe muestra la respuesta correcta y anima a seguir',
      run: async (pg, mark) => {
        await entrar(pg); await pg.click('text=Modo Desafío'); await wait(pg, 1200); mark(); await wait(pg, 900);
        await responder(pg, false); await wait(pg, 1200);
      },
    },
  ],
};
