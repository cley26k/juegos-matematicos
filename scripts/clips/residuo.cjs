// Clips de «RESIDUO: El Valle de Doce». El juego guarda su estado dentro de un cierre; en la copia que se graba
// se expone como window.__R para colocar a Imre y preparar el inventario fuera de cámara.
const wait = (pg, ms) => pg.waitForTimeout(ms);

async function comenzar(pg) {
  await pg.waitForSelector('text=COMENZAR', { timeout: 60000 }); await wait(pg, 1500);
  await pg.click('text=COMENZAR'); await wait(pg, 800);
}
// Coloca a la jugadora en (x, z) mirando hacia (tx, tz), con la cámara a su espalda.
const colocar = (pg, x, z, tx, tz) => pg.evaluate(([x, z, tx, tz]) => {
  const P = __R.PL; P.pos.set(x, P.pos.y + 1, z); P.vel.set(0, 0, 0); P.face = Math.atan2(tx - x, tz - z); __R.CAM.yaw = P.face + Math.PI;
}, [x, z, tx, tz]);
async function dialogo(pg, max = 10) {
  for (let i = 0; i < max; i++) {
    if (await pg.evaluate(() => document.querySelector('#dlg').hidden)) break;
    await pg.keyboard.press('e'); await wait(pg, 2300);
  }
}

module.exports = {
  titulo: 'RESIDUO: El Valle de Doce',
  parche: { url: '**/residuo/', fn: html => html.replace('\nboot();', '\nwindow.__R={PL,S,CAM,renderInv};\nboot();') },
  clips: [
    {
      id: 'mira', titulo: 'Llegada al valle', mecanica: 'Narrativa: Mira explica que al norte del arco todo llega como su resto entre 12',
      run: async (pg, mark) => {
        await comenzar(pg); await colocar(pg, 3.3, 155.6, 4, 154); mark(); await wait(pg, 1500);
        await pg.keyboard.press('e'); await wait(pg, 2600); await dialogo(pg, 4); await wait(pg, 800);
      },
    },
    {
      id: 'umbral', titulo: 'Cruzar el umbral', mecanica: 'Descubrir la regla: al cruzar, 25 → 1 y 36 se vuelve limo (múltiplo de 12)',
      run: async (pg, mark) => {
        await comenzar(pg); await colocar(pg, 1, 121, 1, 100); await wait(pg, 800); mark(); await wait(pg, 600);
        await pg.keyboard.down('w'); await wait(pg, 3200); await pg.keyboard.up('w'); await wait(pg, 4200);
      },
    },
    {
      id: 'molino', titulo: 'La rueda del molino', mecanica: 'Suma modular: 9 ⊕ 1 = 10 y 10 ⊕ 2 = 0, la rueda vuelve al reposo',
      run: async (pg, mark) => {
        await comenzar(pg); await colocar(pg, -50, 43, -51, 41); await wait(pg, 1500);
        await pg.keyboard.press('e'); await wait(pg, 600);
        for (let i = 0; i < 10 && !(await pg.evaluate(() => document.querySelector('#dlg').hidden)); i++) { await pg.keyboard.press('e'); await wait(pg, 300); }
        await pg.evaluate(() => { const S = __R.S; S.inv = [{ ground: 'Z12', v: 1 }, { ground: 'Z12', v: 2 }, null, null, null]; S.sel = 0; __R.renderInv(); });
        await colocar(pg, -56.3, 38.6, -58, 40.5);
        // Cámara más lejos y de lado para que se vea la rueda.
        await pg.evaluate(() => { const C = __R.CAM; C.dist = 9; C.pitch = .3; C.yaw = __R.PL.face + Math.PI - 1.6; }); await wait(pg, 1500); mark(); await wait(pg, 1200);
        await pg.keyboard.press('e'); await wait(pg, 3000);
        await pg.keyboard.press('2'); await wait(pg, 900);
        await pg.keyboard.press('e'); await wait(pg, 3500); await dialogo(pg, 2);
      },
    },
  ],
};
