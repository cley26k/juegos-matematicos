'use strict';
// Interiores recorribles de los negocios y decoración de la casa del jugador.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const T = VO.T;
  const PL = (m, kind, x, y, o) => m.addProp(Object.assign({ kind, x, y, solid: true }, o || {}));
  const wall = (m, kind, x, py, o) => m.addProp(Object.assign({ kind, x, y: 1, px: x * 16, py, solid: false, wall: true }, o || {}));
  const floor = (m, kind, x, y, w, h) => m.addProp({ kind, x, y, bw: w, bh: h, solid: false, floor: true, px: x * 16, py: y * 16 });
  const light = (m, x, y, r, c) => m.lights.push({ x, y, r: r || 60, c: c || 'rgba(255,220,150,' });

  function room(id, W, H, o) {
    const m = new VO.GameMap('int_' + id, W, H, o.floor);
    m.edge = T.WALLIN; m.wallC = o.wall; m.wainC = o.wain; m.wallPattern = o.pattern; m.carpetC = o.carpet;
    m.rect(0, 0, W, 3, T.WALLIN); m.rect(0, 0, 1, H, T.WALLIN); m.rect(W - 1, 0, 1, H, T.WALLIN); m.rect(0, H - 1, W, 1, T.WALLIN);
    const door = Math.floor(W / 2); m.set(door, H - 1, o.floor); m.door = { x: door };
    const b = VO.BUILDINGS.find((bb) => bb.id === id);
    m.warps.push({ x: door, y: H - 1, w: 1, h: 1, to: 'valle', tx: b.x + Math.floor(b.w / 2), ty: b.y + b.h, dir: 0 });
    m.indoor = true; m.dark = 0; m.music = o.music || 'town'; m.title = b.name;
    m.addProp({ kind: 'doormat', x: door, y: H - 2, solid: false, floor: true, px: door * 16, py: (H - 2) * 16 + 8 });
    light(m, door * 16 + 8, 3 * 16, 80, 'rgba(255,235,190,');
    return m;
  }
  function counter(m, x, y, npc, glass) {
    PL(m, glass ? 'counter_glass' : 'counter', x, y, { bw: 4, bh: 1, interact: 'npc' });
    m.npcId = npc; m.npcSpot = { x: x + 1, y: y - 1 };
  }

  const L = {
    mercado(m) {
      counter(m, 5, 5, 'clara');
      PL(m, 'shelf_food', 1, 3, { bw: 2 }); PL(m, 'shelf_food', 3, 3, { bw: 2 }); PL(m, 'shelf_jars', 9, 3, { bw: 2 }); PL(m, 'shelf_jars', 11, 3, { bw: 2 });
      PL(m, 'crate', 1, 6); PL(m, 'crate', 1, 7); PL(m, 'basket', 12, 6); PL(m, 'basket', 12, 7); PL(m, 'barrel', 2, 7); PL(m, 'plant_big', 11, 8);
      floor(m, 'rug_big', 5, 6, 3, 2);
      wall(m, 'window_in', 6, 18); wall(m, 'lamp_wall', 8, 20);
      light(m, 8 * 16 + 6, 26, 50); light(m, 6 * 16 + 12, 28, 60, 'rgba(200,230,255,');
    },
    semillas(m) {
      counter(m, 4, 5, 'mateo');
      PL(m, 'shelf_seeds', 1, 3, { bw: 2 }); PL(m, 'shelf_seeds', 8, 3, { bw: 2 }); PL(m, 'sacks', 1, 6, { bw: 2 }); PL(m, 'plant_big', 10, 3); PL(m, 'plant_big', 10, 6); PL(m, 'basket', 9, 7); PL(m, 'hay', 1, 7);
      floor(m, 'rug_round', 4, 6, 3, 2); wall(m, 'window_in', 4, 18); wall(m, 'painting', 6, 20);
      light(m, 4 * 16 + 12, 28, 60, 'rgba(200,230,255,');
    },
    banco(m) {
      counter(m, 5, 5, 'elena', true);
      wall(m, 'vault', 10, 14); wall(m, 'painting', 3, 20); wall(m, 'lamp_wall', 8, 20);
      PL(m, 'clock', 1, 3); PL(m, 'flag', 12, 3); PL(m, 'plant_big', 1, 7); PL(m, 'plant_big', 12, 7); PL(m, 'desk', 2, 5, { bw: 2 }); PL(m, 'chair_s', 10, 6); PL(m, 'chair_s', 11, 6);
      floor(m, 'rug_big', 5, 6, 3, 2);
      light(m, 8 * 16 + 6, 26, 50); light(m, 11 * 16, 30, 40, 'rgba(255,230,160,');
    },
    alcaldia(m) {
      PL(m, 'desk', 7, 5, { bw: 2, interact: 'npc' }); m.npcId = 'andres'; m.npcSpot = { x: 7, y: 4 };
      PL(m, 'flag', 5, 3); PL(m, 'flag', 10, 3); PL(m, 'shelf_books', 1, 3, { bw: 2, interact: 'library' }); PL(m, 'shelf_books', 13, 3, { bw: 2, interact: 'library' });
      wall(m, 'noticeboard', 2, 18, { interact: 'journal' }); wall(m, 'painting', 7, 18); wall(m, 'window_in', 11, 18);
      PL(m, 'globe', 13, 6); PL(m, 'plant_big', 1, 8); PL(m, 'plant_big', 14, 8); PL(m, 'chair_s', 5, 8); PL(m, 'chair_s', 10, 8);
      floor(m, 'rug_big', 6, 6, 3, 2);
      light(m, 7 * 16 + 14, 30, 70); light(m, 11 * 16 + 12, 28, 60, 'rgba(200,230,255,');
    },
    carpinteria(m) {
      counter(m, 5, 5, 'tomas');
      PL(m, 'plank_rack', 1, 3, { bw: 2 }); PL(m, 'plank_rack', 11, 3, { bw: 2 }); PL(m, 'workbench', 8, 3, { bw: 2 }); PL(m, 'sawhorse', 1, 6, { bw: 2 }); PL(m, 'woodpile', 10, 7, { bw: 2 });
      PL(m, 'chair_s', 11, 5); PL(m, 'chair_s', 12, 5); PL(m, 'table_big', 1, 8, { bw: 2 });
      wall(m, 'window_in', 4, 18); wall(m, 'lamp_wall', 7, 20);
      light(m, 7 * 16 + 6, 26, 50); light(m, 4 * 16 + 12, 28, 60, 'rgba(200,230,255,');
    },
    herreria(m) {
      counter(m, 5, 6, 'bruno'); m.npcSpot = { x: 7, y: 5 };
      PL(m, 'forge', 1, 4, { bw: 2, bh: 1 }); PL(m, 'anvil', 5, 4, { bw: 2 }); PL(m, 'shelf_tools', 9, 3, { bw: 2 }); PL(m, 'shelf_tools', 11, 3, { bw: 2 });
      PL(m, 'waterbarrel', 4, 3); PL(m, 'coalpile', 1, 7, { bw: 2 }); PL(m, 'barrel', 12, 7); PL(m, 'crate', 12, 6);
      wall(m, 'lamp_wall', 7, 20);
      light(m, 2 * 16, 4 * 16, 90, 'rgba(255,140,60,'); light(m, 7 * 16 + 6, 26, 50);
    },
    biblioteca(m) {
      counter(m, 5, 5, 'sofia');
      ['shelf_books'].forEach((k) => { PL(m, k, 1, 3, { bw: 2, interact: 'library' }); PL(m, k, 3, 3, { bw: 2, interact: 'library' }); PL(m, k, 9, 3, { bw: 2, interact: 'library' }); PL(m, k, 11, 3, { bw: 2, interact: 'library' }); });
      PL(m, 'table_big', 1, 7, { bw: 2 }); PL(m, 'table_big', 11, 7, { bw: 2 }); PL(m, 'chair_s', 3, 7); PL(m, 'chair_s', 10, 7); PL(m, 'globe', 12, 5); PL(m, 'plant_big', 1, 5);
      floor(m, 'rug_round', 5, 6, 3, 2); wall(m, 'window_in', 6, 18); wall(m, 'lamp_wall', 5, 20); wall(m, 'lamp_wall', 9, 20);
      light(m, 5 * 16 + 6, 26, 50); light(m, 9 * 16 + 6, 26, 50);
    },
    almacen(m) {
      PL(m, 'counter', 4, 5, { bw: 4, interact: 'storage' });
      for (let x = 1; x < 11; x += 2) if (x < 4 || x > 7) { PL(m, 'crate', x, 3); PL(m, 'crate', x + 1, 3); }
      PL(m, 'barrel', 1, 6); PL(m, 'barrel', 1, 7); PL(m, 'barrel', 10, 6); PL(m, 'sacks', 9, 7, { bw: 2 }); PL(m, 'hay', 2, 7);
      wall(m, 'lamp_wall', 5, 20);
      light(m, 5 * 16 + 6, 26, 60);
    },
    taller(m) {
      PL(m, 'workbench', 2, 3, { bw: 2, interact: 'craft_taller' }); PL(m, 'furnace', 5, 3, { interact: 'craft_taller' }); PL(m, 'anvil', 7, 4, { bw: 2, interact: 'craft_taller' });
      PL(m, 'plank_rack', 9, 3, { bw: 2 }); PL(m, 'woodpile', 1, 7, { bw: 2 }); PL(m, 'waterbarrel', 10, 6); PL(m, 'sawhorse', 8, 7, { bw: 2 });
      floor(m, 'rug_big', 4, 6, 3, 2); wall(m, 'painting', 4, 20); wall(m, 'window_in', 7, 18);
      light(m, 5 * 16 + 8, 3 * 16 + 4, 60, 'rgba(255,150,70,');
    },
  };
  const SPEC = {
    mercado: [14, 10, { floor: T.WOOD, wall: '#f6e2a8', wain: '#8a5a30', pattern: 'stripe' }],
    semillas: [12, 9, { floor: T.WOOD, wall: '#d8ecc0', wain: '#5a7a3a', pattern: 'plank' }],
    banco: [14, 10, { floor: T.TILEF, wall: '#f4efe4', wain: '#2f5f9a', pattern: 'stripe' }],
    alcaldia: [16, 11, { floor: T.TILEF, wall: '#f8d8d0', wain: '#8a2a20' }],
    carpinteria: [14, 10, { floor: T.WOOD, wall: '#e8c89a', wain: '#6e4524', pattern: 'plank' }],
    herreria: [14, 10, { floor: T.STONEF, wall: '#a8a098', wain: '#4a4a52', pattern: 'brick' }],
    biblioteca: [14, 10, { floor: T.WOOD, wall: '#d8d0f0', wain: '#5a3a8a', pattern: 'stripe' }],
    almacen: [12, 9, { floor: T.STONEF, wall: '#c8a888', wain: '#6e4524', pattern: 'plank' }],
    taller: [12, 9, { floor: T.WOOD, wall: '#e0c8a0', wain: '#6e4524', pattern: 'plank', music: 'home' }],
  };
  VO.INTERIOR_IDS = Object.keys(SPEC);
  VO.buildInterior = function (id) {
    const s = SPEC[id]; const m = room(id, s[0], s[1], s[2]); L[id](m); return m;
  };

  // Decoración de la casa del jugador
  VO.decorateHouse = function (m, state) {
    const W = m.w; m.wallC = '#f0dcb0'; m.wainC = '#8a5a30'; m.wallPattern = 'stripe';
    m.addProp({ kind: 'window_in', x: 5, y: 1, px: 5 * 16, py: 18, solid: false, wall: true });
    m.addProp({ kind: 'window_in', x: W - 4, y: 1, px: (W - 4) * 16, py: 18, solid: false, wall: true });
    m.addProp({ kind: 'painting', x: 7, y: 1, px: 7 * 16 + 4, py: 20, solid: false, wall: true });
    m.addProp({ kind: 'rug_round', x: 5, y: 6, bw: 3, bh: 2, solid: false, floor: true, px: 5 * 16, py: 6 * 16 });
    PL(m, 'table_big', 2, 7, { bw: 2 }); PL(m, 'chair_s', 4, 7); PL(m, 'plant_big', 1, 9); PL(m, 'plant_big', W - 2, 9);
    PL(m, 'kitchen', W - 3, 6, { bw: 2 });
    if (!state.house.roof) { m.addProp({ kind: 'bucket_leak', x: 9, y: 5, solid: false, floor: true, px: 9 * 16, py: 5 * 16 }); }
    m.lights.push({ x: 5 * 16 + 12, y: 28, r: 60, c: 'rgba(200,230,255,' });
  };
  VO.Art.EXTRA.doormat = () => { const [c, g] = VO.Art.cv(16, 8); VO.Art.P(g, 1, 1, 14, 6, '#8a5a30'); for (let x = 2; x < 14; x += 2) VO.Art.P(g, x, 2, 1, 4, '#c9955f'); return c; };
  VO.Art.EXTRA.bucket_leak = () => { const [c, g] = VO.Art.cv(16, 16); VO.Art.P(g, 4, 8, 8, 7, '#8d8478'); VO.Art.P(g, 4, 8, 8, 2, '#3a97cf'); VO.Art.P(g, 3, 7, 10, 1, '#aaa59e'); VO.Art.P(g, 7, 1, 1, 2, '#7cc4ea'); return c; };
})();
