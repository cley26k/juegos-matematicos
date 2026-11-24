'use strict';
// Miniaventuras de los vecinos de ambiente, interacción con objetos del pueblo
// (bancos, fuente, pozo) y la pelota con la que juegan los niños.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art, P = A.P, el = VO.el;
  const Q = (VO.MiniQuests = {});
  const G = () => VO.G;

  // ---------- objetos nuevos ----------
  A.registerIcon('pelota', (g) => { A.disc(g, 8, 8, 5, '#f4efe4'); P(g, 5, 4, 3, 3, '#c2453a'); P(g, 9, 9, 3, 3, '#2f6fb0'); P(g, 6, 5, 1, 1, '#ffffff'); });
  A.registerIcon('libro_felipe', (g) => { P(g, 3, 3, 10, 11, '#2f6fb0'); P(g, 4, 4, 8, 9, '#3f80c8'); P(g, 3, 3, 1, 11, '#1a3a6a'); P(g, 6, 6, 5, 1, '#f2cf3a'); P(g, 6, 8, 4, 1, '#f2cf3a'); P(g, 12, 4, 1, 9, '#f4efe4'); });
  A.registerIcon('frio', (g) => { P(g, 5, 7, 6, 8, '#f4efe4'); P(g, 5, 7, 6, 1, '#d8d0c0'); A.disc(g, 8, 6, 4, '#e8452f'); P(g, 6, 3, 3, 2, '#ff8a6a'); P(g, 9, 2, 1, 6, '#c9a066'); });
  VO.ITEMS.pelota = { id: 'pelota', name: 'Pelota de Nico', cat: 'quest', buy: 0, sell: 0, desc: 'Una pelota vieja de trapo.', stack: 1 };
  VO.ITEMS.libro_felipe = { id: 'libro_felipe', name: 'Libro de Felipe', cat: 'quest', buy: 0, sell: 0, desc: 'Hay que devolverlo a la biblioteca.', stack: 1 };
  VO.ITEMS.frio = { id: 'frio', name: 'Frío-frío', cat: 'food', buy: 0, sell: 10, desc: 'Hielo raspado con sirope de fresa.', stack: 99, energy: 20 };

  const DEFS = {
    nico: { title: 'La pelota perdida', type: 'find', item: 'pelota', zone: [4, 9, 36, 14],
      ask: ['¡Oye! Le di una patada tan fuerte a mi otra pelota que cayó en el bosque, al norte de tu finca.', '¿Me la buscas? Es de trapo, roja y azul. Brilla un poquito en la hierba.'],
      wait: '¿Ya la encontraste? Está en el bosque, entre los árboles.', done: '¡MI PELOTA! ¡Eres lo máximo! Toma, son mis ahorros.', reward: { money: 35 } },
    chepe: { title: 'Carnada para Don Chepe', type: 'give', item: 'bait', n: 3,
      ask: ['Se me acabó la carnada y los peces ya me están mirando feo.', 'Si me traes 3 carnadas, te regalo lo que pesque. Clara las vende en el mercado.'],
      wait: 'Tres carnadas, mijo. Ni dos ni cuatro. Bueno, cuatro también sirve.', done: '¡Ahora sí! Mira lo que saqué ayer. Es tuyo.', reward: { items: { chillo: 2 }, money: 10 } },
    rosa: { title: 'Guayabas para el dulce', type: 'give', item: 'guayaba', n: 5,
      ask: ['Quiero hacer dulce de guayaba para la feria, pero mis rodillas ya no suben al guayabo.', '¿Me traes 5 guayabas? En el bosque hay guayabos.'],
      wait: 'Con 5 guayabas me alcanza para una olla grande.', done: '¡Qué guayabas tan buenas! Toma, de la olla de ayer.', reward: { items: { jam: 2 } } },
    felipe: { title: 'El libro atrasado', type: 'deliver', item: 'libro_felipe', to: 'sofia',
      ask: ['Terminé mi novela de piratas, pero debía devolverla hace una semana…', '¿Se la llevas a Sofía a la biblioteca? Me da vergüenza ir yo.'],
      wait: '¿Ya le llevaste el libro a Sofía?', done: '¡Gracias! Sofía me perdonó la multa. Toma esto por la ayuda.', reward: { money: 30 }, deliverLine: '¡El libro de Felipe! Por fin. Dile que lo perdono, pero que no se repita.' },
    yari: { title: 'Colección de conchas', type: 'give', item: 'concha', n: 3,
      ask: ['Estoy haciendo una colección de conchas para la escuela.', 'Me faltan 3. ¿Me traes algunas de la playa?'],
      wait: 'Las conchas están en la arena, cerca del muelle.', done: '¡Mi colección está completa! La maestra me va a poner 100. ¡Gracias!', reward: { money: 40 } },
    junior: { title: 'Las cuentas del frío-frío', type: 'math',
      ask: ['Necesito ayuda con una cuenta. Hoy llevo 23 frío-fríos vendidos.', 'Para comprarme la bicicleta quiero vender, como mínimo, 40 en total. ¿Cuál es la menor cantidad que todavía me falta vender?'],
      q: 'Junior lleva 23 vendidos y quiere llegar al menos a 40. Si x es lo que le falta vender: 23 + x ≥ 40. ¿Cuál es el menor valor de x?', answer: 17,
      hint: 'Resta 23 en los dos lados de 23 + x ≥ 40.', done: '¡17! Claro: 23 + 17 = 40. Y si vendo 18, 19 o más, también llego. ¡Toma un frío-frío por la ayuda!', reward: { items: { frio: 2 } } },
  };
  Q.DEFS = DEFS;
  const st = () => { const s = G().state; s.miniq = s.miniq || {}; return s.miniq; };

  // ---------- conversación ----------
  Q.talk = function (e) {
    const id = e.d.id; const q = DEFS[id]; const S = st(); const g = G();
    if (!q || S[id] === 'done') { const lines = e.d.lines; return VO.UI.dialog(id, [lines[(g.state.day + (e.talks = (e.talks || 0) + 1)) % lines.length]], null, null, 'happy'); }
    if (!S[id]) return VO.UI.dialog(id, q.ask, [{ t: 'Te ayudo', fn: () => Q.start(id) }, { t: 'Ahora no', fn: null }], null, 'normal');
    if (q.type === 'math') return Q.mathPanel(id);
    const has = q.type === 'give' ? g.count(q.item) >= q.n : q.type === 'find' ? g.count(q.item) > 0 : S[id] === 'delivered';
    if (has) return Q.finish(id);
    VO.UI.dialog(id, [q.wait], null, null, 'normal');
  };
  Q.start = function (id) {
    const q = DEFS[id]; const S = st(); S[id] = 'active'; VO.Audio.sfx('open');
    VO.UI.toast('Nueva miniaventura: ' + q.title + '. Míralo en el diario.', 'info');
    if (q.type === 'find') Q.placeFind(id);
    if (q.type === 'deliver') G().giveOrDrop(q.item, 1);
    if (q.type === 'math') Q.mathPanel(id);
  };
  Q.finish = function (id) {
    const q = DEFS[id]; const g = G(); const S = st();
    if (q.type === 'give') g.removeItem(q.item, q.n);
    if (q.type === 'find') g.removeItem(q.item, 1);
    S[id] = 'done';
    if (q.reward.money) g.earn(q.reward.money, 'recompensa');
    if (q.reward.items) for (const k in q.reward.items) g.giveOrDrop(k, q.reward.items[k]);
    VO.Audio.sfx('level'); VO.UI.dialog(id, [q.done], null, null, 'happy');
    VO.Analytics.log({ type: 'mini_done', mission: 'mini_' + id, cat: 'game' });
  };
  Q.placeFind = function (id) {
    const q = DEFS[id]; const m = G().maps.valle; const r = VO.rng(G().state.day * 17 + 3);
    for (let i = 0; i < 400; i++) { const x = q.zone[0] + ((r() * q.zone[2]) | 0), y = q.zone[1] + ((r() * q.zone[3]) | 0); if (!m.solid(x, y) && !m.obj(x, y)) { m.setObj(x, y, { kind: 'node', type: 'lost', item: q.item, mini: id, hp: 1 }); st()[id + '_pos'] = [x, y]; return; } }
  };
  Q.restore = function (m) { const S = st(); for (const id in DEFS) if (S[id] === 'active' && DEFS[id].type === 'find' && S[id + '_pos'] && G().count(DEFS[id].item) === 0) { const [x, y] = S[id + '_pos']; if (!m.obj(x, y)) m.setObj(x, y, { kind: 'node', type: 'lost', item: DEFS[id].item, mini: id, hp: 1 }); } };
  // entregas a personajes principales
  Q.npcChoices = function (npcId) {
    const out = []; const S = st(); const g = G();
    for (const id in DEFS) { const q = DEFS[id]; if (q.type === 'deliver' && q.to === npcId && S[id] === 'active' && g.count(q.item) > 0) out.push({ t: 'Entregar: ' + VO.ITEMS[q.item].name, fn: () => { g.removeItem(q.item, 1); S[id] = 'delivered'; VO.Audio.sfx('good'); VO.UI.dialog(npcId, [q.deliverLine, 'Avísale a ' + (VO.Extras.def(id) || {}).name + ' que ya está.'], null, null, 'happy'); } }); }
    return out;
  };
  // problema de cálculo de Junior
  Q.mathPanel = function (id) {
    const q = DEFS[id]; const inp = el('input', { type: 'number', class: 'qty', 'aria-label': 'respuesta' }); const fb = el('div', { class: 'feedback' });
    let tries = 0;
    const check = () => {
      const v = parseFloat(inp.value); if (isNaN(v)) return; tries++;
      const ok = v === q.answer;
      VO.Analytics.log({ type: 'attempt', mission: 'mini_' + id, stage: 'mini', value: v, correct: ok, error: ok ? null : v === 40 ? 'particular_conjunto' : v === 63 ? 'gasto_ingreso' : v > q.answer ? 'min_max' : 'calculo' });
      if (ok) { VO.UI.close(); Q.finish(id); return; }
      fb.innerHTML = ''; fb.append(el('p', { class: 'warn' }, v === 63 ? 'Ojo: 23 + 40 no es lo que buscamos. ¿Cuánto le falta a 23 para llegar a 40?' : v > q.answer ? 'Con ' + v + ' llega, sí… pero ¿es la MENOR cantidad posible?' : 'Prueba: 23 + ' + v + ' = ' + (23 + v) + '. ¿Llega a 40?'));
      if (tries >= 2) fb.append(el('p', { class: 'small' }, 'Pista: ' + q.hint));
      VO.Audio.sfx('error');
    };
    VO.UI.open(q.title, el('div', { class: 'doc' }, el('p', {}, q.q), el('div', { class: 'row' }, el('b', {}, 'x = '), inp, el('button', { class: 'btn ok', onclick: check }, 'Responder')), fb), { paper: true, icon: 'frio', cls: 'docmodal' });
  };
  Q.journalCard = function () {
    const S = st(); const box = el('div', { class: 'card' }, el('b', {}, 'Miniaventuras del pueblo'), el('div', { class: 'small muted' }, 'Habla con los vecinos que pasean por el valle: algunos necesitan una mano.'));
    for (const id in DEFS) { const d = VO.Extras.def(id); const s = S[id]; box.appendChild(el('div', { class: 'mrow ' + (s === 'done' ? 'done' : s ? 'action' : '') }, el('span', {}, DEFS[id].title + ' · ' + d.name), el('span', { class: 'small' }, s === 'done' ? 'Completada ✔' : s === 'delivered' ? 'Vuelve con ' + d.name : s ? 'En curso' : '¿?'))); }
    return box;
  };

  // ---------- objetos del pueblo ----------
  Q.useProp = function (what) {
    const g = G(); const s = g.state; s.seen = s.seen || {};
    if (what === 'bench') {
      g.player.sit = true; g.player.dir = 0; VO.Audio.sfx('pop');
      if (s.seen.bench !== Math.floor(g.hour()) + s.day * 24) { s.seen.bench = Math.floor(g.hour()) + s.day * 24; s.energy = Math.min(s.maxEnergy, s.energy + 6); g.float('+6 energía', g.player.x, g.player.y - 30, '#9cf06a'); VO.bus.emit('energy'); }
      g.advanceTime(10); VO.UI.toast('Te sientas un rato a mirar la plaza.', 'info'); return true;
    }
    if (what === 'fountain') {
      if (s.seen.wish === s.day) { VO.UI.toast('Ya pediste un deseo hoy. Vuelve mañana.', 'info'); return true; }
      if (!g.spend(1, 'deseo')) return true;
      s.seen.wish = s.day; s.luck = s.day; VO.Audio.sfx('good');
      g.burst(g.player.x, g.player.y - 30, ['#ffe27a', '#fff6c8', '#7cc4ea'], 14, { up: 60 });
      VO.UI.toast('Lanzas una moneda a la fuente y pides un deseo. ¡Hoy te sientes con suerte! (+5 % en tus ventas)', 'ok'); return true;
    }
    if (what === 'well') {
      const sel = g.selected();
      if (sel && sel.id === 'can') { const t = s.tools.can; t.water = VO.TOOL_STATS(t.tier).canCap; VO.Audio.sfx('water'); VO.UI.toast('Llenaste la regadera en el pozo.', 'ok'); VO.bus.emit('inv'); return true; }
      if (s.seen.well === s.day) { VO.UI.toast('El agua del pozo está fresquita. (Puedes llenar la regadera aquí).', 'info'); return true; }
      s.seen.well = s.day; s.energy = Math.min(s.maxEnergy, s.energy + 8); VO.Audio.sfx('water'); g.float('+8 energía', g.player.x, g.player.y - 30, '#9cf06a'); VO.bus.emit('energy');
      VO.UI.toast('Bebes agua fresca del pozo.', 'ok'); return true;
    }
    return false;
  };

  // ---------- pelota de los niños ----------
  Q.ball = null;
  Q.updateBall = function (dt) {
    const g = G(); if (!g.map || g.map.id !== 'valle') return;
    const h = g.hour(); if (h < 9 || h >= 18) { Q.ball = null; return; }
    if (!Q.ball) Q.ball = { x: 77 * 16, y: 45 * 16, vx: 0, vy: 0, z: 0, vz: 0 };
    const b = Q.ball; const area = [69 * 16, 38 * 16, 86 * 16, 48 * 16];
    b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.pow(0.35, dt); b.vy *= Math.pow(0.35, dt);
    b.vz -= 300 * dt; b.z = Math.max(0, b.z + b.vz * dt); if (b.z === 0 && b.vz < 0) b.vz = Math.abs(b.vz) > 40 ? -b.vz * 0.45 : 0;
    if (b.x < area[0] || b.x > area[2]) { b.vx *= -1; b.x = VO.clamp(b.x, area[0], area[2]); }
    if (b.y < area[1] || b.y > area[3]) { b.vy *= -1; b.y = VO.clamp(b.y, area[1], area[3]); }
    if (g.map.solid(Math.floor(b.x / 16), Math.floor(b.y / 16))) { b.vx *= -1; b.vy *= -1; b.x += b.vx * dt * 2; b.y += b.vy * dt * 2; }
    const kick = (fx, fy, power) => { const d = Math.hypot(fx, fy) || 1; b.vx = (fx / d) * power; b.vy = (fy / d) * power; b.vz = 90; VO.Audio.sfx('hit'); };
    const p = g.player; if (Math.hypot(p.x - b.x, p.y - b.y) < 10 && Math.hypot(b.vx, b.vy) < 60) { const dv = [[0, 1], [-1, 0], [1, 0], [0, -1]][p.dir]; kick(dv[0] + (Math.random() - 0.5) * 0.3, dv[1] + (Math.random() - 0.5) * 0.3, 150); }
    (VO.Extras.entities() || []).forEach((e) => { if ((e.d.id === 'nico' || e.d.id === 'yari' || e.d.id === 'canelo') && Math.hypot(e.x - b.x, e.y - b.y) < 9 && Math.hypot(b.vx, b.vy) < 50) kick(Math.random() - 0.5, Math.random() - 0.5, 120 + Math.random() * 60); });
  };
  Q.drawBall = function (g, cx, cy) { const b = Q.ball; if (!b) return; const x = Math.round(b.x - cx), y = Math.round(b.y - cy); g.fillStyle = 'rgba(20,30,10,0.3)'; g.beginPath(); g.ellipse(x, y, 3, 1.2, 0, 0, 6.3); g.fill(); g.drawImage(A.icon('pelota'), x - 4, y - 8 - Math.round(b.z), 8, 8); };
})();
