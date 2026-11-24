'use strict';
// Vecinos de ambiente: no dan misiones, solo viven su vida (niños, pescador, perro, etc.).
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const A = VO.Art, P = A.P;
  const X = (VO.Extras = { list: [] });
  const G = () => VO.G;
  const DEFS = [
    { id: 'nico', name: 'Nico', kind: 'wander', speed: 62, area: [69, 38, 17, 9], hours: [9, 18], look: { kid: true, skin: '#9a6040', hair: '#1a1010', style: 'curly', shirt: '#e8452f', pants: '#2f4f7a' },
      lines: ['¡No me puedes atrapar! ¡Soy el más rápido del valle!', '¿Tú eres la persona nueva de la finca? Mi mamá dice que eres muy trabajadora.', 'Cuando sea grande voy a tener una finca con cien gallinas. ¡Cien!'] },
    { id: 'yari', name: 'Yari', kind: 'chase', target: 'nico', speed: 58, area: [69, 38, 17, 9], hours: [9, 18], look: { kid: true, skin: '#c68c5a', hair: '#3a2010', style: 'pony', shirt: '#f2cf3a', pants: '#8a3a9a' },
      lines: ['¡Nico, espérame! Uf…', 'Ayer conté las tejas de la iglesia: ¡ciento veinte! Bueno, creo.', '¿Sabías que una gallina pone un huevo casi cada día? Lo leí en la biblioteca.'] },
    { id: 'canelo', name: 'Canelo', kind: 'chase', target: 'nico', dog: true, speed: 66, area: [66, 36, 22, 13], hours: [7, 19],
      lines: ['¡Guau! (Canelo mueve la cola tan fuerte que casi se cae).', '(Canelo te trae una ramita y te mira fijamente).'] },
    { id: 'chepe', name: 'Don Chepe', kind: 'static', tool: 'rod', pos: [45, 34], dir: 0, onBridge: true, hours: [6, 17], look: { skin: '#8a5a3a', hair: '#e6e2da', style: 'short', beard: true, hat: 'straw', hatC: '#d8b45a', shirt: '#7aa0c8', pants: '#4a4a3a' },
      lines: ['Shhh… que me espantas los peces.', 'Llevo cincuenta años pescando en este puente. Los peces ya me conocen; por eso no pican.', 'La paciencia es como el río: no tiene prisa, pero siempre llega.'] },
    { id: 'rosa', name: 'Doña Rosa', kind: 'sweep', tool: 'broom', area: [70, 40, 14, 6], speed: 18, hours: [6, 11], look: { skin: '#c68c5a', hair: '#8a8a8a', style: 'pony', shirt: '#3aa894', pants: '#6a4a3a', apron: '#f4efe4' },
      lines: ['¡Buenos días! Esta plaza no se barre sola, ¿eh?', 'Cuando yo era joven, la feria duraba tres días. ¡Tres!', 'Saluda a Lucía de mi parte. Me debe una receta de dulce de leche.'] },
    { id: 'felipe', name: 'Felipe', kind: 'static', pos: [81, 44], dir: 0, sit: true, hours: [13, 19], look: { skin: '#e0a878', hair: '#4a2a14', style: 'short', glasses: true, shirt: '#c8c8b8', pants: '#3a3a5a' },
      lines: ['Estoy leyendo una novela de piratas. Va por la parte buena.', 'Sofía me recomendó este libro. Esa muchacha tiene buen ojo.', 'Dicen que con buenas cuentas se llega lejos. Con buenos libros, también.'] },
    { id: 'junior', name: 'Junior', kind: 'static', pos: [84, 41], dir: 0, cart: true, hours: [10, 17], look: { skin: '#6a4028', hair: '#1a1010', style: 'short', hat: 'cap', hatC: '#e2508a', shirt: '#ffffff', pants: '#2f6fb0' },
      lines: ['¡Frío-frío, frío-frío! De tamarindo, de limón y de fresa.', 'Con este calor vendo como pan caliente. Bueno, como hielo frío.', 'Si vendo 40 hoy, junto para una bicicleta. ¡Ya llevo 23!'] },
    { id: 'gallina1', name: 'Gallina de Lucía', kind: 'wander', hen: true, speed: 14, area: [7, 59, 12, 4], hours: [6, 19], lines: ['¡Cocorocó! (La gallina te mira de lado, muy seria).', '(La gallina picotea el suelo buscando maíz).'] },
    { id: 'gallina2', name: 'Gallina de Lucía', kind: 'wander', hen: true, speed: 12, area: [7, 59, 12, 4], hours: [6, 19], lines: ['(La gallina se esponja y sigue picoteando).', '¡Coc, coc, coc!'] },
    { id: 'gallina3', name: 'Gallina de Lucía', kind: 'wander', hen: true, speed: 16, area: [5, 55, 6, 8], hours: [6, 19], lines: ['(Esta gallina parece muy curiosa: te sigue con la mirada).'] },
    { id: 'gallo', name: 'Gallo Pancho', kind: 'wander', hen: true, rooster: true, speed: 18, area: [7, 58, 12, 5], hours: [5, 19], lines: ['¡QUIQUIRIQUÍ! (El gallo Pancho se siente el dueño de la finca).', '(Pancho te ignora con mucha dignidad).'] },
  ];
  X.def = (id) => DEFS.find((d) => d.id === id);

  const freeSpot = (d) => { for (let i = 0; i < 80; i++) { const x = d.area[0] + Math.floor(Math.random() * d.area[2]), y = d.area[1] + Math.floor(Math.random() * d.area[3]); if (!G().maps.valle.solid(x, y)) return [x * 16 + 8, y * 16 + 12]; } return [d.area[0] * 16, d.area[1] * 16]; };
  X.init = function () {
    X.list = DEFS.map((d) => { const p = d.pos ? [d.pos[0] * 16 + 8, d.pos[1] * 16 + 12] : freeSpot(d); return { d, x: p[0], y: p[1], tx: p[0], ty: p[1], t: 0, dir: d.dir || 0, frame: 0, anim: Math.random() * 5 }; });
  };
  const active = (e) => { const h = G().hour(); return h >= e.d.hours[0] && h < e.d.hours[1] && !(G().isFiesta && G().isFiesta() && e.d.id === 'chepe'); };
  const free = (x, y) => !G().maps.valle.solid(Math.floor(x / 16), Math.floor(y / 16));

  X.update = function (dt) {
    const g = G(); if (!g.map || g.map.id !== 'valle') return;
    if (!X.list.length) X.init();
    X.list.forEach((e) => {
      e.anim += dt; e.on = active(e); if (!e.on) return;
      const d = e.d; let moving = false;
      const ball = VO.MiniQuests && VO.MiniQuests.ball;
      if (d.id === 'nico' && ball) { e.tx = ball.x; e.ty = ball.y + 2; moving = Math.hypot(e.tx - e.x, e.ty - e.y) > 6; }
      else if (d.kind === 'wander' || d.kind === 'sweep') {
        e.t -= dt;
        if (e.t <= 0 || Math.hypot(e.tx - e.x, e.ty - e.y) < 3) { e.t = d.kind === 'sweep' ? 3 : d.hen ? 1 + Math.random() * 3 : 1.2 + Math.random() * 2; const [nx0, ny0] = freeSpot(d); e.tx = nx0; e.ty = ny0; if (d.hen && Math.random() < 0.4) { e.tx = e.x; e.ty = e.y; } }
        moving = true;
      } else if (d.kind === 'chase') {
        const tgt = X.list.find((q) => q.d.id === d.target);
        if (tgt && tgt.on) { e.tx = tgt.x - 10; e.ty = tgt.y + 4; moving = Math.hypot(e.tx - e.x, e.ty - e.y) > 12; }
      }
      if (moving) {
        const dx = e.tx - e.x, dy = e.ty - e.y, dd = Math.hypot(dx, dy) || 1; const sp = d.speed * dt;
        const nx = e.x + dx / dd * sp, ny = e.y + dy / dd * sp;
        if (free(nx, ny) || !free(e.x, e.y)) { e.x = nx; e.y = ny; } else { e.t = 0; e.stuck = (e.stuck || 0) + 1; if (e.stuck > 30 && !d.pos) { const [fx, fy] = freeSpot(d); e.x = fx; e.y = fy; e.stuck = 0; } }
        e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
        e.frame = Math.floor(e.anim * (d.speed > 40 ? 10 : 5)) % 2 + 1;
        if (d.kind === 'sweep' && Math.random() < 0.1) g.particles.push({ x: e.x + (e.dir === 1 ? -8 : 8), y: e.y, vx: (Math.random() - 0.5) * 20, vy: -6, g: 10, life: 0.4, c: '#d8c8a8', s: 1 });
      } else e.frame = 0;
      if (d.id === 'chepe' && Math.random() < dt * 0.05) { e.catchT = 1.2; }
      if (e.catchT > 0) e.catchT -= dt;
    });
  };
  X.entities = () => X.list.filter((e) => e.on);

  // perro (2 cuadros)
  const dog = [0, 1].map((f) => { const [c, g] = A.cv(18, 14); A.ell(g, 8, 8, 6, 3, '#b07a40'); P(g, 3, 6, 10, 2, '#c99159'); P(g, 12, 3, 5, 5, '#b07a40'); P(g, 12, 2, 2, 3, '#6e4524'); P(g, 15, 5, 2, 1, '#2a1b12'); P(g, 14, 4, 1, 1, '#1a1010'); P(g, 1, 4 + f, 2, 3, '#b07a40'); [[4, 11], [6, 11], [10, 11], [12, 11]].forEach(([x, y], i) => P(g, x, y, 1, 3 - ((i + f) % 2), '#7a5030')); return A.outline(c); });
  X.dogImg = dog[0];
  const cart = (() => { const [c, g] = A.cv(28, 26); P(g, 2, 8, 22, 12, '#2f8ac0'); P(g, 2, 8, 22, 2, '#5ab0e0'); P(g, 4, 2, 18, 6, '#f4efe4'); for (let x = 4; x < 22; x += 4) P(g, x, 2, 2, 6, '#e2508a'); A.disc(g, 7, 21, 3, '#3a3a3a'); A.disc(g, 19, 21, 3, '#3a3a3a'); P(g, 6, 11, 3, 5, '#e8452f'); P(g, 11, 11, 3, 5, '#f2cf3a'); P(g, 16, 11, 3, 5, '#3f8a32'); return A.outline(c); })();

  X.draw = function (g, e, cx, cy) {
    const x = Math.round(e.x - cx), y = Math.round(e.y - cy); const d = e.d;
    g.fillStyle = 'rgba(20,30,10,0.28)'; g.beginPath(); g.ellipse(x, y, d.dog ? 6 : 5, 2, 0, 0, 6.3); g.fill();
    if (d.hen) { const fr = A.chicken[e.frame ? Math.floor(e.anim * 6) % 2 : 0]; const lw = fr._hd ? fr.width / 2 : fr.width; if (e.dir === 1) { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(fr, -lw / 2, y - 13); g.restore(); } else g.drawImage(fr, x - lw / 2, y - 13); if (d.rooster) { g.fillStyle = '#c2453a'; g.fillRect(x + (e.dir === 1 ? -5 : 3), y - 16, 3, 3); g.fillStyle = '#2a6a5a'; g.fillRect(x + (e.dir === 1 ? 4 : -7), y - 11, 3, 4); } return; }
    if (d.dog) { const f = dog[e.frame ? Math.floor(e.anim * 8) % 2 : 0]; if (e.dir === 1) { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(f, -9, y - 13); g.restore(); } else g.drawImage(f, x - 9, y - 13); return; }
    if (d.cart) g.drawImage(cart, x + 6, y - 24);
    const sh = A.charSheet(d.look); const fr = d.sit ? 0 : e.frame;
    const sitOff = d.sit ? 4 : 0;
    g.drawImage(sh, fr * 16, e.dir * 36, 16, d.sit ? 30 : 36, x - 8, y - 34 + sitOff, 16, d.sit ? 30 : 36);
    if (d.sit) { g.drawImage(A.icon('notebook'), x - 5, y - 18, 10, 10); }
    if (d.tool === 'rod') {
      // caña hacia el agua, por delante del puente
      const bob = e.catchT > 0 ? Math.sin(e.anim * 30) * 2 : Math.sin(e.anim * 2) * 0.8;
      g.strokeStyle = '#8a5e37'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 5, y - 13); g.lineTo(x + 12, y + 2); g.stroke();
      g.strokeStyle = 'rgba(240,240,240,0.8)'; g.beginPath(); g.moveTo(x + 12, y + 2); g.lineTo(x + 13, y + 20 + bob); g.stroke();
      g.fillStyle = '#e8452f'; g.fillRect(x + 12, y + 19 + bob, 3, 2); g.fillStyle = '#fff'; g.fillRect(x + 12, y + 21 + bob, 3, 1);
      if (e.catchT > 0) { g.fillStyle = 'rgba(220,245,255,0.8)'; g.fillRect(x + 9, y + 22, 9, 1); }
    }
    if (d.tool === 'broom') { const sw = Math.sin(e.anim * 8) * 3; g.strokeStyle = '#a07848'; g.beginPath(); g.moveTo(x + 4, y - 16); g.lineTo(x + 6 + sw, y - 1); g.stroke(); g.fillStyle = '#d8b45a'; g.fillRect(x + 3 + sw, y - 2, 6, 3); }
  };
  X.near = function (px, py) { let best = null, bd = 26; X.entities().forEach((e) => { const dd = Math.hypot(e.x - px, e.y - py); if (dd < bd) { bd = dd; best = e; } }); return best; };
  X.talk = function (e) { if (VO.MiniQuests) return VO.MiniQuests.talk(e); return X.talkPlain(e); };
  X.talkPlain = function (e) { const lines = e.d.lines; VO.UI.dialog(e.d.id, [lines[(G().state.day + (e.talks = (e.talks || 0) + 1)) % lines.length]], null, null, 'happy'); };
})();
