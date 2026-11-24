'use strict';
// Vida social: eventos diarios, correo, regalos, objetos perdidos, ofertas y amistad.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const el = VO.el;
  const Ev = (VO.Events = {});
  const G = () => VO.G;

  // Objetos perdidos (misiones secundarias)
  const LOST = {
    bruno: { item: 'lost_bruno', name: 'Tenazas del abuelo de Bruno', icon: 'hammer2', zone: 'forest', hint: 'en el bosque, al norte de tu finca' },
    sofia: { item: 'lost_sofia', name: 'Diario de Sofía', icon: 'notebook', zone: 'forest', hint: 'cerca de los árboles del bosque' },
    marina: { item: 'lost_marina', name: 'Brújula de Marina', icon: 'coin', zone: 'beach', hint: 'en la arena de la playa' },
    mateo: { item: 'lost_mateo', name: 'Sobre de semillas antiguas', icon: 'seed_maiz', zone: 'farm', hint: 'por los caminos cerca de tu finca' },
  };
  for (const k in LOST) { VO.ITEMS[LOST[k].item] = { id: LOST[k].item, name: LOST[k].name, cat: 'quest', buy: 0, sell: 0, desc: 'Pertenece a ' + VO.NPCS[k].name + '. Devuélvelo.', stack: 1 }; VO.Art.alias(LOST[k].item, LOST[k].icon); }
  VO.NODES.lost = { name: 'Algo brilla', tool: null, hp: 1, energy: 0, drop: {}, regen: 0 };

  const LOVED = { mateo: ['aji', 'maiz'], clara: ['jam', 'mango'], tomas: ['plank', 'mango'], marina: ['chillo', 'coco'], lucia: ['egg', 'auyama'], bruno: ['iron_bar', 'coal'], elena: ['guayaba', 'jam'], rafael: ['mango', 'tomate'], sofia: ['concha', 'glass'], andres: ['jam', 'tomate'] };
  const GIFTS = { mateo: ['seed_tomate', 3], clara: ['jam', 1], tomas: ['plank', 5], marina: ['bait', 5], lucia: ['egg', 3], bruno: ['coal', 3], andres: ['guayaba', 4] };
  const TIPS = [
    '¿Sabías que “al menos” y “como mínimo” significan lo mismo? Las dos se escriben con ≥.',
    'Un truco: después de resolver una inecuación, prueba un número del intervalo y otro de afuera. Si el primero cumple y el segundo no, vas bien.',
    'Cuando hay dos condiciones, dibuja las dos en la recta. La solución es donde se pisan.',
    'Dividir entre un número negativo es como mirarse en un espejo: todo se invierte, incluido el signo.',
    'El interés simple crece como una escalera: cada semana sube el mismo escalón.',
  ];

  Ev.mail = function (from, t, b, gift) { const s = G().state; s.mail = s.mail || []; s.mail.push(Object.assign({ from, t, b, day: s.day, read: false }, gift || {})); };
  Ev.unread = () => (G().state.mail || []).some((m) => !m.read || (m.item && !m.taken) || (m.money && !m.taken));

  // Se llama al amanecer de cada día
  Ev.morning = function () {
    const s = G().state; const r = VO.rng(s.day * 7919 + s.priceSeed);
    s.promo = null;
    if (s.day % 3 === 0) {
      const opts = ['tomate', 'aji', 'maiz', 'sardina', 'tilapia', 'wood', 'guayaba', 'mango', 'copper_ore'];
      const id = opts[(r() * opts.length) | 0]; s.promo = { id, day: s.day };
      Ev.mail('Clara', 'Día de oferta en el mercado', 'Hoy pago 30 % más por ' + VO.ITEMS[id].name.toLowerCase() + '. Solo por hoy. ¡Corre la voz!');
    }
    // regalo de un vecino con amistad
    const friends = Object.keys(GIFTS).filter((k) => (s.friendship[k] || 0) >= 2);
    if (friends.length && r() < 0.4) { const k = friends[(r() * friends.length) | 0]; const [id, n] = GIFTS[k]; Ev.mail(VO.NPCS[k].name, 'Un detalle para ti', '¡Gracias por tu amistad! Te dejo esto. — ' + VO.NPCS[k].name, { item: id, n }); }
    if (s.day > 2 && s.day % 4 === 1) Ev.mail('Sofía', 'Dato curioso de la biblioteca', TIPS[(s.day / 4 | 0) % TIPS.length]);
    // pronóstico de Marina
    const tomorrow = VO.hash(s.day + 1, 7, s.priceSeed) < 0.22;
    if (tomorrow && r() < 0.7) Ev.mail('Marina', 'Huele a lluvia', 'Mañana va a llover. No hará falta regar. ¡Aprovecha para pescar en el lago, que con lluvia pican más!');
    // objeto perdido
    if (!s.lost && s.day >= 3 && r() < 0.3) {
      const keys = Object.keys(LOST); const k = keys[(r() * keys.length) | 0];
      s.lost = { npc: k, found: false, x: -1, y: -1 };
      Ev.mail(VO.NPCS[k].name, '¿Me ayudas?', 'Perdí algo muy importante: ' + LOST[k].name.toLowerCase() + '. Creo que fue ' + LOST[k].hint + '. Si lo encuentras, tráemelo, por favor. Algo brillará en el suelo.');
    }
    if (s.day % 7 === 0) Ev.mail('Andrés', 'Esta noche: bachata en la plaza', '¡Vecinos! Hoy de 6:00 a 10:00 de la noche hay música y baile en la plaza. Todo el pueblo estará allí. ¡No faltes!');
    if (s.day === 2) Ev.mail('Lucía', 'Consejo de vecina', 'Riega cada día tus cultivos. Si llueve, el cielo lo hace por ti. ¡Y no te olvides de dormir! Tu cama guarda la partida.');
  };

  // Coloca el objeto perdido en el mapa del valle si corresponde
  Ev.placeLost = function (m) {
    const s = G().state; if (!s || !s.lost || s.lost.found || s.lost.returned) return;
    const L = LOST[s.lost.npc];
    if (s.lost.x < 0) {
      const r = VO.rng(s.day * 31 + 7);
      const zone = { forest: [2, 8, 40, 16], beach: [4, 64, 100, 5], farm: [4, 32, 38, 3] }[L.zone];
      for (let i = 0; i < 400; i++) { const x = zone[0] + ((r() * zone[2]) | 0), y = zone[1] + ((r() * zone[3]) | 0); if (!m.solid(x, y) && !m.obj(x, y) && !m.soil.has(m.idx(x, y))) { s.lost.x = x; s.lost.y = y; break; } }
    }
    if (s.lost.x >= 0 && !m.obj(s.lost.x, s.lost.y)) m.setObj(s.lost.x, s.lost.y, { kind: 'node', type: 'lost', item: L.item, hp: 1 });
  };
  Ev.pickLost = function (tx, ty, o) {
    const g = G();
    if (o.mini) { if (!g.canAdd(o.item, 1)) { VO.UI.toast('Inventario lleno.', 'warn'); return; } g.addItem(o.item, 1); g.map.setObj(tx, ty, null); VO.Audio.sfx('good'); g.burst(tx * 16 + 8, ty * 16 + 6, ['#fff6c8', '#ffd84a'], 16, { up: 70 }); VO.UI.toast('¡Encontraste: ' + VO.ITEMS[o.item].name + '!', 'ok'); return; } if (!g.canAdd(o.item, 1)) { VO.UI.toast('Inventario lleno.', 'warn'); return; }
    g.addItem(o.item, 1); g.map.setObj(tx, ty, null); g.state.lost.found = true;
    VO.Audio.sfx('good'); g.burst(tx * 16 + 8, ty * 16 + 6, ['#fff6c8', '#ffd84a'], 16, { up: 70 });
    VO.UI.toast('Encontraste: ' + VO.ITEMS[o.item].name + '. Llévaselo a ' + VO.NPCS[g.state.lost.npc].name + '.', 'ok');
  };

  // Opciones extra al hablar con un vecino
  Ev.talkExtras = function (id) {
    const g = G(); const s = g.state; const out = [];
    if (s.lost && s.lost.npc === id && s.lost.found && !s.lost.returned && g.count(LOST[id].item) > 0) {
      out.push({ t: 'Devolver: ' + LOST[id].name, fn: () => { g.removeItem(LOST[id].item, 1); s.lost.returned = true; s.friendship[id] = (s.friendship[id] || 0) + 2; g.earn(80, 'recompensa'); VO.Audio.sfx('level'); VO.UI.dialog(id, ['¡No lo puedo creer! ¡Lo encontraste! Gracias de corazón.', 'Toma estas 80 monedas. No es mucho, pero es de verdad.'], null, () => { s.lost = null; }, 'happy'); } });
    }
    if (VO.MiniQuests) out.push(...VO.MiniQuests.npcChoices(id));
    const sel = g.selected();
    if (sel && VO.ITEMS[sel.id] && ['crop', 'food', 'fish', 'mat', 'res'].includes(VO.ITEMS[sel.id].cat) && s.seen['gift' + id] !== s.day) {
      out.push({ t: 'Regalar ' + VO.ITEMS[sel.id].name.toLowerCase(), fn: () => Ev.gift(id, sel.id) });
    }
    return out;
  };
  Ev.gift = function (id, item) {
    const g = G(); const s = g.state; if (!g.removeItem(item, 1)) return;
    s.seen['gift' + id] = s.day;
    const loved = (LOVED[id] || []).includes(item);
    s.friendship[id] = (s.friendship[id] || 0) + (loved ? 2 : 1);
    VO.Audio.sfx(loved ? 'level' : 'good');
    const lines = loved ? ['¡¿' + VO.ITEMS[item].name + '?! ¡Es mi favorito! ¿Cómo lo supiste?'] : ['¡Qué amable! Muchas gracias por el detalle.'];
    VO.UI.dialog(id, lines, null, null, 'happy');
    g.float('♥', g.player.x, g.player.y - 30, '#ff8fb5');
  };
  Ev.hearts = (id) => Math.min(10, Math.floor((G().state.friendship[id] || 0)));

  // Correo con estado
  VO.UI.openMail = function () {
    const g = G(); const s = g.state; const c = el('div');
    const list = (s.mail || []).slice().reverse();
    if (!list.length) c.appendChild(el('p', { class: 'muted' }, 'El buzón está vacío.'));
    list.forEach((m) => {
      m.read = true;
      const gift = m.item || m.money;
      c.appendChild(el('div', { class: 'card letter' }, el('div', { class: 'small muted' }, 'Día ' + m.day + ' · de ' + m.from), el('b', {}, m.t), el('p', {}, m.b),
        gift && !m.taken ? el('button', { class: 'btn ok', onclick: (e) => { if (m.item) { if (!g.canAdd(m.item, m.n)) { VO.UI.toast('Inventario lleno.', 'warn'); return; } g.addItem(m.item, m.n); } if (m.money) g.earn(m.money, 'recompensa'); m.taken = true; VO.Audio.sfx('collect'); e.target.replaceWith(el('span', { class: 'ok small' }, '✔ Recogido')); } }, m.item ? VO.UI.itemIcon(m.item) : null, 'Recoger' + (m.item ? ' ' + m.n + ' × ' + VO.ITEMS[m.item].name.toLowerCase() : ' ' + m.money + ' monedas')) : gift ? el('span', { class: 'ok small' }, '✔ Recogido') : null));
    });
    VO.UI.open('Buzón', c, { paper: true, icon: 'notebook', wide: true });
  };

  // Sección de vecinos (corazones)
  Ev.neighborsCard = function () {
    const box = el('div', { class: 'card' }, el('b', {}, 'Vecinos'), el('div', { class: 'small muted' }, 'Habla con ellos cada día y regálales cosas (selecciona el objeto en la barra rápida antes de hablar). Cada vecino tiene favoritos.'));
    const grid = el('div', { class: 'neigh' });
    Object.keys(VO.NPCS).forEach((k) => {
      const cv = el('canvas', { width: 48, height: 48, class: 'portrait xs' }); cv.getContext('2d').drawImage(VO.Art.portrait(VO.NPCS[k].look, 'happy'), 0, 0);
      const h = Ev.hearts(k);
      grid.appendChild(el('div', { class: 'nb-item' }, cv, el('div', {}, el('b', {}, VO.NPCS[k].name), el('div', { class: 'small muted' }, VO.NPCS[k].role), el('div', { class: 'hearts', 'aria-label': h + ' de 10 corazones' }, '♥'.repeat(h), el('span', { class: 'empty' }, '♥'.repeat(10 - h))))));
    });
    box.appendChild(grid);
    return box;
  };
})();
