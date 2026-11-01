// Clips de «MathRally · Misión Élara». El rally usa una base de datos en línea del docente: se bloquea para no dejar equipos de prueba.
// Los códigos son los del propio juego (misión ELARA-2025, estación EST-R1); se escriben en la pestaña «Código» del escáner.
const wait = (pg, ms) => pg.waitForTimeout(ms);
const BIEN = ['Si es funcion — cada x tiene un solo y', 'No es funcion — x=1 tiene dos resultados (3 y 7)', 'Si, cada valor de x produce un solo valor de y', 'Si es funcion — cada x tiene exactamente un y'];

async function codigo(pg, boton, cod) {
  await pg.click(`text=${boton}`); await wait(pg, 1000);
  await pg.locator('input[placeholder="EST-R1"]').last().fill(cod); await wait(pg, 400);
  await pg.click('text=Confirmar código'); await wait(pg, 2200);
}
async function unirse(pg) {
  await wait(pg, 1000);
  await pg.click('text=Iniciar Mision'); await wait(pg, 900);
  await pg.click('text=Estudiante / Equipo'); await wait(pg, 900);
  await pg.fill('input', 'Los Cometas'); await pg.click('text=Continuar'); await wait(pg, 1000);
}
async function estacion(pg) {
  await pg.click('text=Ir a la estacion activa'); await wait(pg, 1200);
  await codigo(pg, 'Escanear QR de esta estacion', 'EST-R1');
  await pg.click('text=Entendido, Dr. Leo'); await wait(pg, 900);
}
async function responder(pg, i, bien = true) {
  const t = bien ? BIEN[i] : 'No se puede determinar';
  await pg.getByText(t, { exact: true }).click(); await wait(pg, 700);
  await pg.click('text=Confirmar respuesta'); await wait(pg, 2400);
}

module.exports = {
  titulo: 'MathRally · Misión Élara',
  bloquear: ['**/*firebaseio.com/**'],
  clips: [
    {
      id: 'mision', vp: 'm', titulo: 'Unirse a la misión', mecanica: 'Narrativa y trabajo en equipo: el Dr. Leo encarga la misión y el mapa marca la estación activa',
      run: async (pg, mark) => {
        await unirse(pg); mark(); await wait(pg, 600);
        await codigo(pg, 'Escanear QR del docente', 'ELARA-2025'); await wait(pg, 2500);
        await pg.click('text=Entendido, Dr. Leo'); await wait(pg, 900);
        await pg.click('text=Ver mapa'); await wait(pg, 3000);
      },
    },
    {
      id: 'estacion', vp: 'm', titulo: 'Desafío en una estación', mecanica: 'Estaciones físicas con QR: cada acierto suma puntos al equipo',
      run: async (pg, mark) => {
        await unirse(pg); await codigo(pg, 'Escanear QR del docente', 'ELARA-2025'); await pg.click('text=Entendido, Dr. Leo'); await wait(pg, 800);
        mark(); await estacion(pg); await wait(pg, 1200);
        await responder(pg, 0); await pg.locator('button:visible').last().click().catch(() => {}); await wait(pg, 1500);
        await responder(pg, 1); await wait(pg, 600);
      },
    },
    {
      id: 'pista', vp: 'm', titulo: 'Pista y segundo intento', mecanica: 'Retroalimentación: el error resta un intento y la pista orienta sin dar la respuesta',
      run: async (pg, mark) => {
        await unirse(pg); await codigo(pg, 'Escanear QR del docente', 'ELARA-2025'); await pg.click('text=Entendido, Dr. Leo'); await wait(pg, 800);
        await estacion(pg); mark(); await wait(pg, 1000);
        await responder(pg, 0, false); await wait(pg, 600);
        await pg.click('text=Ver pista'); await wait(pg, 2600);
        await responder(pg, 0); await wait(pg, 600);
      },
    },
  ],
};
