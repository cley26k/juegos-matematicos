'use strict';
// Mundo: mapas, edificios, recursos, colisiones, rutas (A*), mina e interior de la casa.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const T = VO.T;

  class GameMap {
    constructor(id, w, h, fill) {
      this.id = id; this.w = w; this.h = h;
      this.t = new Uint8Array(w * h).fill(fill);
      this.blocked = new Uint8Array(w * h);
      this.objs = new Map(); // índice → objeto en la casilla
      this.soil = new Map(); // índice → {wet}
      this.buildings = []; this.props = []; this.warps = []; this.lights = [];
      this.dark = 0; this.cache = null; this.dirty = true; this.music = 'farm';
    }
    idx(x, y) { return y * this.w + x; }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    get(x, y) { return this.inb(x, y) ? this.t[y * this.w + x] : (this.edge !== undefined ? this.edge : T.VOID); }
    set(x, y, v) { if (this.inb(x, y)) this.t[y * this.w + x] = v; }
    rect(x, y, w, h, v) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, v); }
    obj(x, y) { return this.inb(x, y) ? this.objs.get(this.idx(x, y)) : undefined; }
    setObj(x, y, o) { if (!this.inb(x, y)) return; const k = this.idx(x, y); if (o) { o.x = x; o.y = y; this.objs.set(k, o); } else this.objs.delete(k); }
    solid(x, y) {
      if (!this.inb(x, y)) return true;
      if (VO.Art.SOLID.has(this.get(x, y))) return true;
      if (this.blocked[this.idx(x, y)]) return true;
      const o = this.objs.get(this.idx(x, y));
      if (o) {
        if (o.kind === 'node') return o.type !== 'shell' && o.type !== 'weed' && o.type !== 'sandpile' && o.type !== 'clay' && o.type !== 'ladder' && o.type !== 'lost';
        if (o.kind === 'place') return !!(VO.ITEMS[o.id] && VO.ITEMS[o.id].solid);
      }
      return false;
    }
    block(x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.inb(i, j)) this.blocked[this.idx(i, j)] = 1; }
    addBuilding(b) { this.buildings.push(b); this.block(b.x, b.y, b.w, b.h); }
    addProp(p) { this.props.push(p); if (p.solid !== false) this.block(p.bx !== undefined ? p.bx : p.x, p.by !== undefined ? p.by : p.y, p.bw || 1, p.bh || 1); }
    buildingAt(x, y) { return this.buildings.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h); }
    propAt(x, y) { return this.props.find((p) => { const bx = p.bx !== undefined ? p.bx : p.x, by = p.by !== undefined ? p.by : p.y; return x >= bx && x < bx + (p.bw || 1) && y >= by && y < by + (p.bh || 1); }); }
  }
  VO.GameMap = GameMap;

  // Definición de edificios del pueblo
  VO.BUILDINGS = [
    { id: 'casa', style: 'casita', name: 'Tu casa', x: 14, y: 27, w: 7, h: 4, wall: '#7fb8c8', roof: '#9aa4ae', roofType: 'zinc', shutter: '#d86a4a', chimney: true, flowers: true, enter: 'casa' },
    { id: 'taller', style: 'casita', porch: false, name: 'Taller familiar', x: 3, y: 27, w: 6, h: 4, wall: '#d8a36a', roof: '#a8362c', roofType: 'tile', shutter: '#5a7a4a', windows: 1, sign: 'workbench' },
    { id: 'mercado', style: 'colmado', name: 'Mercado de Clara', x: 58, y: 29, w: 8, h: 4, wall: '#f2cf3a', roof: '#b5402e', roofType: 'tile', awning: '#e2508a', shutter: '#2f8a7a', sign: 'coin', npc: 'clara' },
    { id: 'semillas', style: 'casita', name: 'Semillas Don Mateo', x: 68, y: 29, w: 6, h: 4, wall: '#8ccf8a', roof: '#a8b0b8', roofType: 'zinc', awning: '#3f8a32', shutter: '#e8892a', windows: 1, sign: 'seed_aji', npc: 'mateo' },
    { id: 'banco', style: 'colonial', name: 'Banco del Valle', x: 76, y: 29, w: 7, h: 4, wall: '#f4efe4', roof: '#2f5f9a', roofType: 'tile', shutter: '#2f5f9a', trim: '#e8d8b8', sign: 'coin', npc: 'elena' },
    { id: 'alcaldia', style: 'colonial', name: 'Centro comunitario', x: 85, y: 28, w: 9, h: 5, wall: '#f0a8a8', roof: '#8a2a20', roofType: 'tile', shutter: '#f4efe4', flowers: true, sign: 'notebook', npc: 'andres', windows: 3, wallH: 40 },
    { id: 'carpinteria', style: 'casita', porch: false, name: 'Carpintería de Tomás', x: 56, y: 38, w: 7, h: 4, wall: '#c9955f', roof: '#8a949e', roofType: 'zinc', shutter: '#5a3a1a', sign: 'plank', npc: 'tomas' },
    { id: 'herreria', style: 'bloque', rolling: true, name: 'Herrería de Bruno', x: 56, y: 48, w: 7, h: 4, wall: '#9a948c', roof: '#5a5a62', roofType: 'zinc', shutter: '#8a3a2a', chimney: true, sign: 'iron_bar', npc: 'bruno' },
    { id: 'biblioteca', style: 'colonial', name: 'Biblioteca', x: 90, y: 38, w: 7, h: 4, wall: '#86a8e0', roof: '#5a3a8a', roofType: 'tile', shutter: '#f4efe4', sign: 'notebook', npc: 'sofia' },
    { id: 'almacen', style: 'bloque', rolling: true, name: 'Almacén', x: 90, y: 48, w: 7, h: 4, wall: '#c06a4a', roof: '#8a949e', roofType: 'zinc', shutter: '#3a3a3a', windows: 1, sign: 'chest', enterUI: 'almacen' },
    { id: 'casa_mateo', style: 'casita', name: 'Casa de Don Mateo', x: 64, y: 55, w: 5, h: 3, wall: '#e8b4d8', roof: '#9aa4ae', roofType: 'zinc', shutter: '#3a8a6a', windows: 1, home: true },
    { id: 'casa_elena', style: 'bloque', name: 'Casa de Elena', x: 72, y: 55, w: 5, h: 3, wall: '#a8e0d0', roof: '#a8362c', roofType: 'tile', shutter: '#2f6fb0', windows: 1, home: true },
    { id: 'casa_clara', style: 'casita', name: 'Casa de Clara', x: 80, y: 55, w: 5, h: 3, wall: '#f8d880', roof: '#9aa4ae', roofType: 'zinc', shutter: '#c0392b', windows: 1, flowers: true, home: true },
    { id: 'casa_andres', style: 'colonial', name: 'Casa del alcalde', x: 99, y: 29, w: 6, h: 4, wall: '#f4efe4', roof: '#a8362c', roofType: 'tile', shutter: '#3a6a3a', home: true },
    { id: 'casa_rafael', style: 'bloque', name: 'Casa de Rafael', x: 99, y: 38, w: 5, h: 3, wall: '#f8a878', roof: '#8a949e', roofType: 'zinc', shutter: '#2f6fb0', windows: 1, home: true },
    { id: 'casa_sofia', style: 'colonial', name: 'Casa de Sofía', x: 99, y: 46, w: 5, h: 3, wall: '#d0b8f0', roof: '#5a3a8a', roofType: 'tile', shutter: '#f4efe4', windows: 1, flowers: true, home: true },
    { id: 'casa_tomas', style: 'casita', porch: false, name: 'Casa de Tomás', x: 88, y: 55, w: 5, h: 3, wall: '#b8d890', roof: '#8a949e', roofType: 'zinc', shutter: '#6a3a1a', windows: 1, home: true },
    { id: 'casa_marina', style: 'casita', name: 'Casa de Marina', x: 58, y: 62, w: 5, h: 3, wall: '#7ad0e0', roof: '#d8c890', roofType: 'thatch', shutter: '#e8452f', windows: 1, home: true },
    { id: 'finca_lucia', style: 'casita', name: 'Finca de Lucía', x: 7, y: 56, w: 6, h: 3, wall: '#f0c080', roof: '#c8b070', roofType: 'thatch', shutter: '#3f8a32', windows: 1, flowers: true, npc: 'lucia' },
  ];

  // ---------------------------------------------------------------- VALLE
  VO.buildValley = function (state) {
    const W = 112, H = 84;
    const m = new GameMap('valle', W, H, T.GRASS);
    m.edge = T.CLIFF;
    const R = VO.rng(1905);
    // Montañas al norte
    for (let x = 0; x < W; x++) { const d = 4 + Math.round(Math.sin(x / 6) * 1.5 + VO.hash(x, 0, 1) * 1.2); m.rect(x, 0, 1, d, T.CLIFF); }
    // Bosque
    for (let y = 6; y < 25; y++) for (let x = 0; x < 43; x++) if (m.get(x, y) === T.GRASS) m.set(x, y, T.DGRASS);
    // Playa y mar
    for (let x = 0; x < W; x++) {
      const s = 64 + Math.round(Math.sin(x / 9) * 1.2);
      const sea = 72 + Math.round(Math.sin(x / 7 + 1) * 1.3);
      m.rect(x, s, 1, sea - s, T.SAND); m.rect(x, sea, 1, 2, T.WATER); m.rect(x, sea + 2, 1, H - sea - 2, T.DEEP);
    }
    // Río serpenteante
    for (let y = 0; y < 74; y++) { const cx = 46 + Math.round(Math.sin(y / 7) * 2); m.rect(cx - 1, y, 3, 1, T.WATER); if (y > 6 && VO.hash(0, y, 4) < 0.3) m.set(cx + 2, y, T.WATER); }
    // Lago
    for (let y = 5; y < 24; y++) for (let x = 78; x < 110; x++) {
      const d = ((x - 94) / 13) ** 2 + ((y - 14) / 7) ** 2;
      if (d < 0.55) m.set(x, y, T.DEEP); else if (d < 1) m.set(x, y, T.WATER); else if (d < 1.25 && m.get(x, y) !== T.CLIFF) m.set(x, y, T.SAND);
    }
    // Finca
    m.rect(8, 36, 26, 16, T.FARM);
    for (let y = 36; y < 52; y++) for (let x = 8; x < 34; x++) m.set(x, y, T.GRASS);
    // Plaza
    m.rect(68, 36, 20, 13, T.PLAZA);
    // Caminos
    const path = (x0, y0, x1, y1, t, w) => { w = w || 2; if (x0 === x1) m.rect(x0, Math.min(y0, y1), w, Math.abs(y1 - y0) + 1, t); else m.rect(Math.min(x0, x1), y0, Math.abs(x1 - x0) + 1, w, t); };
    path(16, 31, 16, 34, T.PATH); path(4, 33, 44, 33, T.PATH);
    path(50, 33, 68, 33, T.COBBLE); path(52, 33, 52, 62, T.COBBLE); path(52, 61, 100, 61, T.COBBLE, 2);
    path(66, 33, 66, 46, T.COBBLE); path(56, 36, 66, 36, T.COBBLE); path(56, 46, 66, 46, T.COBBLE);
    path(84, 33, 97, 33, T.COBBLE); path(88, 33, 88, 61, T.COBBLE); path(97, 33, 97, 53, T.COBBLE); path(88, 53, 98, 53, T.COBBLE);
    path(84, 20, 84, 35, T.PATH); path(70, 61, 70, 66, T.PATH);
    path(12, 7, 12, 33, T.PATH); path(12, 16, 44, 16, T.PATH); path(50, 16, 84, 16, T.PATH);
    path(10, 52, 10, 56, T.PATH); path(10, 52, 16, 52, T.PATH); path(16, 36, 16, 33, T.PATH);
    // Puentes
    // el río pasa por debajo de los caminos: esas casillas son puente de madera
    const riverAt = (x, y) => { const cx = 46 + Math.round(Math.sin(y / 7) * 2); return (x >= cx - 1 && x <= cx + 1) || (x === cx + 2 && y > 6 && VO.hash(0, y, 4) < 0.3); };
    for (const y of [16, 17, 33, 34]) for (let x = 40; x < 53; x++) if (riverAt(x, y)) m.set(x, y, T.BRIDGE);
    for (let x = 42; x < 52; x++) { if (m.get(x, 33) === T.GRASS || m.get(x, 33) === T.DGRASS) m.set(x, 33, T.PATH); if (m.get(x, 34) === T.GRASS) m.set(x, 34, T.PATH); if (m.get(x, 16) === T.DGRASS || m.get(x, 16) === T.GRASS) m.set(x, 16, T.PATH); if (m.get(x, 17) === T.DGRASS || m.get(x, 17) === T.GRASS) m.set(x, 17, T.PATH); }
    // Muelle
    for (let y = 68; y < 79; y++) { m.set(70, y, T.DOCK); m.set(71, y, T.DOCK); }
    // Entrada de la mina
    m.rect(10, 5, 4, 3, T.PATH); m.rect(10, 0, 4, 5, T.CLIFF);
    m.addProp({ kind: 'mine', x: 10, y: 4, bx: 10, by: 4, bw: 2, bh: 2, px: 10 * 16, py: 3 * 16, interact: 'mine' });

    // Edificios
    VO.BUILDINGS.forEach((b) => {
      const bb = Object.assign({}, b);
      if (b.id === 'casa') { bb.broken = !state.house.roof; if (state.house.windows) bb.windows = 3; if (state.house.extension) { bb.w = 9; bb.x = 13; } }
      if (b.id === 'taller') bb.broken = !state.projects.taller;
      if (b.id === 'casa' || b.id === 'taller' || b.id === 'finca_lucia') m.rect(bb.x, bb.y + bb.h, bb.w, 1, T.PATH);
      else m.rect(bb.x - 1, bb.y + bb.h, bb.w + 2, 1, m.get(bb.x, bb.y + bb.h) === T.PLAZA ? T.PLAZA : T.COBBLE);
      m.addBuilding(bb);
    });
    if (state.projects.gallinero) m.addProp({ kind: 'coop', x: 30, y: 27, bx: 30, by: 28, bw: 3, bh: 2, px: 30 * 16, py: 27 * 16 + 8 });
    if (state.projects.gallinero) m.addProp({ kind: state.troughFull ? 'trough_full' : 'trough', x: 34, y: 30, bx: 34, by: 30, bw: 2, bh: 1, px: 34 * 16, py: 30 * 16, interact: 'trough' });

    // Mobiliario urbano
    m.addProp({ kind: 'fountain', x: 77, y: 41, bx: 76, by: 42, bw: 3, bh: 2, px: 76 * 16, py: 41 * 16 + 8, interact: 'fountain' });
    m.addProp({ kind: 'board', x: 71, y: 38, bx: 71, by: 39, bw: 2, bh: 1, px: 71 * 16, py: 38 * 16, interact: 'empleos' });
    m.addProp({ kind: 'stall', x: 61, y: 34, bx: 61, by: 36, bw: 3, bh: 1, px: 61 * 16, py: 34 * 16 + 8 });
    m.addProp({ kind: 'bin', x: 22, y: 31, interact: 'bin' });
    m.addProp({ kind: 'mailbox', x: 12, y: 30, px: 12 * 16, py: 29 * 16 + 8, interact: 'mail' });
    m.addProp({ kind: 'boat', x: 72, y: 74, bx: 72, by: 74, bw: 2, bh: 1, px: 72 * 16, py: 74 * 16 - 2 });
    const roadT = new Set([T.PATH, T.COBBLE, T.BRIDGE]);
    const edge = (x, y) => { if (!roadT.has(m.get(x, y)) && !m.blocked[m.idx(x, y)]) return [x, y]; for (const [dx, dy] of [[0, -1], [0, 1], [0, -2], [0, 2], [-1, 0], [1, 0], [0, -3], [0, 3]]) { const nx = x + dx, ny = y + dy; if (!roadT.has(m.get(nx, ny)) && !VO.Art.SOLID.has(m.get(nx, ny)) && !m.blocked[m.idx(nx, ny)]) return [nx, ny]; } return [x, y]; };
    [[69, 37], [86, 37], [69, 48], [86, 48], [54, 34], [64, 34], [54, 45], [90, 34], [52, 58], [80, 60], [18, 33], [40, 33], [70, 64]].map(([x, y]) => edge(x, y)).forEach(([x, y]) => {
      m.addProp({ kind: 'lamp', x, y, px: x * 16, py: y * 16 - 16 }); m.lights.push({ x: x * 16 + 8, y: y * 16 - 10, r: 46, c: 'rgba(255,214,120,' });
    });
    [[70, 46], [84, 46], [84, 37]].forEach(([x, y]) => m.addProp({ kind: 'flowerbox', x, y, bw: 2 }));
    [[80, 38], [76, 38]].forEach(([x, y]) => m.addProp({ kind: 'umbrella', x, y, bw: 2 }));
    m.addProp({ kind: 'well', x: 26, y: 30, bw: 2, interact: 'well' }); m.addProp({ kind: 'cart', x: 64, y: 43, bw: 2 });
    m.addProp({ kind: 'hay', x: 37, y: 29 }); m.addProp({ kind: 'hay', x: 38, y: 29 });
    m.bunting = [[69, 37, 86, 37], [69, 48, 86, 48], [69, 37, 86, 48], [86, 37, 69, 48]].map(([a, b, c, d]) => [a * 16 + 8, b * 16 - 12, c * 16 + 8, d * 16 - 12]);
    [[73, 44], [80, 44]].forEach(([x, y]) => m.addProp({ kind: 'bench', x, y, bw: 2, px: x * 16, py: y * 16, interact: 'bench' }));
    [[57, 34], [66, 31], [63, 52], [94, 52], [24, 31]].forEach(([x, y], i) => m.addProp({ kind: i % 2 ? 'barrel' : 'crate', x, y }));

    // Recursos
    const free = (x, y) => m.inb(x, y) && !m.blocked[m.idx(x, y)] && !m.obj(x, y) && (m.get(x, y) === T.GRASS || m.get(x, y) === T.DGRASS || m.get(x, y) === T.SAND);
    const put = (x, y, type, extra) => { if (free(x, y)) m.setObj(x, y, Object.assign({ kind: 'node', type, hp: VO.NODES[type] ? VO.NODES[type].hp : 1, v: (VO.hash(x, y, 5) * 3) | 0 }, extra || {})); };
    for (let y = 7; y < 25; y++) for (let x = 1; x < 43; x++) {
      if (Math.abs(x - 12) < 2 || Math.abs(y - 16) < 2) continue;
      const r = VO.hash(x, y, 11);
      if (r < 0.16 && x % 2 === y % 2) put(x, y, 'tree');
      else if (r < 0.2) put(x, y, 'weed');
      else if (r < 0.215) put(x, y, 'bush');
      else if (r < 0.23) put(x, y, 'rock');
    }
    for (let x = 0; x < W; x++) for (let y = 5; y < 9; y++) if (m.get(x, y) === T.GRASS && VO.hash(x, y, 2) < 0.3 && (x < 8 || x > 16)) put(x, y, 'pine');
    // árboles del pueblo
    [[55, 30], [67, 26], [95, 26], [66, 50], [86, 51], [104, 44], [105, 52], [53, 64]].forEach(([x, y]) => put(x, y, 'mangotree'));
    [[68, 35], [87, 35]].forEach(([x, y]) => { put(x, y, 'tree', { flower: true }); });
    // finca: maleza, rocas y tocones para limpiar
    for (let y = 35; y < 53; y++) for (let x = 7; x < 35; x++) { const r = VO.hash(x, y, 21); if (r < 0.05) put2(x, y, 'weed'); else if (r < 0.07) put2(x, y, 'rock'); else if (r < 0.08) put2(x, y, 'stump'); }
    function put2(x, y, t) { if (!m.obj(x, y)) m.setObj(x, y, { kind: 'node', type: t, hp: VO.NODES[t].hp, v: 0 }); }
    // otras zonas de hierba
    for (let y = 25; y < 64; y++) for (let x = 0; x < W; x++) { if (m.get(x, y) !== T.GRASS) continue; const r = VO.hash(x, y, 31); const inFarm = x >= 6 && x <= 35 && y >= 34 && y <= 53; if (r < 0.02) put(x, y, 'weed'); else if (r < 0.026 && (x < 44 || x > 104) && !inFarm) put(x, y, 'tree'); }
    // playa
    for (let x = 0; x < W; x++) for (let y = 62; y < 74; y++) { if (m.get(x, y) !== T.SAND) continue; const r = VO.hash(x, y, 41); if (r < 0.035 && y < 68) put(x, y, 'palm'); else if (r < 0.048) put(x, y, 'shell'); else if (r < 0.062) put(x, y, 'sandpile'); }
    // arcilla en las orillas
    for (let y = 20; y < 62; y += 3) { const cx = 46 + Math.round(Math.sin(y / 7) * 2); put(cx - 2, y, 'clay'); put(cx + 2 + (y % 2), y + 1, 'clay'); }
    // Cultivos de Lucía (decorativos)
    for (let x = 8; x < 18; x++) for (let y = 60; y < 62; y++) { m.set(x, y, T.FARM); m.soil.set(m.idx(x, y), { wet: true, npc: true }); m.setObj(x, y, { kind: 'crop', crop: ['maiz', 'auyama', 'yuca'][x % 3], stage: 99, days: 0, deco: true }); }
    // Zonas
    m.zones = {
      farm: { x: 4, y: 26, w: 38, h: 36 },
      town: { x: 52, y: 26, w: 58, h: 38 },
    };
    m.music = 'farm';
    return m;
  };

  VO.isFarmTile = (m, x, y) => m.id === 'valle' && x >= 4 && x < 42 && y >= 34 && y < 56 && (m.get(x, y) === T.FARM || m.get(x, y) === T.GRASS);

  // ---------------------------------------------------------------- CASA
  VO.buildHouse = function (state) {
    const ext = state.house.extension;
    const W = ext ? 20 : 14, H = 11;
    const m = new GameMap('casa', W, H, T.WOOD);
    m.edge = T.WALLIN;
    m.rect(0, 0, W, 3, T.WALLIN); m.rect(0, 0, 1, H, T.WALLIN); m.rect(W - 1, 0, 1, H, T.WALLIN); m.rect(0, H - 1, W, 1, T.WALLIN);
    const door = Math.floor(W / 2);
    m.set(door, H - 1, T.WOOD);
    m.warps.push({ x: door, y: H - 1, w: 1, h: 1, to: 'valle', tx: 17, ty: 32, dir: 0 });
    m.addProp({ kind: 'bed', x: 2, y: 3, bx: 2, by: 3, bw: 2, bh: 2, px: 32, py: 48, interact: 'bed' });
    m.addProp({ kind: 'workbench', x: W - 4, y: 3, bx: W - 4, by: 3, bw: 2, bh: 1, px: (W - 4) * 16, py: 3 * 16 - 8, interact: 'craft_banco' });
    m.addProp({ kind: 'furnace', x: W - 6, y: 3, px: (W - 6) * 16, py: 3 * 16 - 8, solid: true, deco: true });
    m.lights.push({ x: (W - 6) * 16 + 8, y: 3 * 16 + 4, r: 40, c: 'rgba(255,150,70,' });
    m.lights.push({ x: door * 16 + 8, y: 2 * 16, r: 70, c: 'rgba(255,230,170,' });
    m.dark = 0.0; m.indoor = true; m.music = 'home';
    if (VO.decorateHouse) VO.decorateHouse(m, state);
    (state.placed.casa || []).forEach((p) => m.setObj(p.x, p.y, { kind: 'place', id: p.id, store: p.store }));
    return m;
  };

  // ---------------------------------------------------------------- MINA
  VO.buildMine = function (level, seed) {
    const W = 36, H = 26;
    const m = new GameMap('mina' + level, W, H, T.CAVEWALL);
    m.edge = T.CAVEWALL;
    const r = VO.rng(seed * 97 + level * 13);
    let cells = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) cells[i] = r() < 0.43 ? 1 : 0;
    for (let it = 0; it < 4; it++) {
      const n = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let c = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= W || yy >= H || cells[yy * W + xx]) c++; }
        n[y * W + x] = c >= 5 ? 1 : 0;
      }
      cells = n;
    }
    // túnel garantizado
    let cx = 4, cy = 4;
    for (let s = 0; s < 260; s++) { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) if (cx + i < W - 1 && cy + j < H - 1) cells[(cy + j) * W + cx + i] = 0; const d = (r() * 4) | 0; cx = VO.clamp(cx + [1, -1, 0, 0][d] + (r() < 0.3 ? 1 : 0), 2, W - 4); cy = VO.clamp(cy + [0, 0, 1, -1][d], 2, H - 4); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!cells[y * W + x] && x > 0 && y > 1 && x < W - 1 && y < H - 1) m.set(x, y, T.CAVE);
    m.rect(3, 3, 4, 4, T.CAVE);
    m.setObj(4, 3, { kind: 'node', type: 'ladder', up: true });
    m.start = { x: 5, y: 5 };
    // rocas y vetas
    const floor = [];
    for (let y = 2; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (m.get(x, y) === T.CAVE && (Math.abs(x - 5) > 2 || Math.abs(y - 5) > 2)) floor.push([x, y]);
    const pick = () => floor.splice((r() * floor.length) | 0, 1)[0];
    const n = Math.min(floor.length - 2, 40 + level * 4);
    const ladderAt = n > 3 ? (r() * n) | 0 : -1;
    for (let i = 0; i < n; i++) {
      const p = pick(); if (!p) break;
      const q = r();
      let type = 'rock';
      if (level >= 3 && q < 0.12 + level * 0.02) type = 'iron';
      else if (q < 0.3) type = 'copper';
      else if (q < 0.42) type = 'coal';
      m.setObj(p[0], p[1], { kind: 'node', type, hp: VO.NODES[type].hp, v: 0, ladder: i === ladderAt && level < 6 });
    }
    if (level >= 2) { const sp = pick(); if (sp) { m.addProp({ kind: 'shaft', x: sp[0], y: sp[1], interact: 'gallery' }); m.lights.push({ x: sp[0] * 16 + 8, y: sp[1] * 16, r: 40, c: 'rgba(120,200,255,' }); } }
    // antorchas
    for (let i = 0; i < 9 && floor.length; i++) { const p = pick(); if (!p) break; m.addProp({ kind: 'torch', x: p[0], y: p[1], solid: true }); m.lights.push({ x: p[0] * 16 + 8, y: p[1] * 16 + 2, r: 64, c: 'rgba(255,170,80,' }); }
    m.lights.push({ x: 4 * 16 + 8, y: 3 * 16 + 8, r: 60, c: 'rgba(255,200,120,' });
    m.dark = 0.62 + level * 0.03; m.music = 'mine'; m.mine = level;
    return m;
  };

  // ---------------------------------------------------------------- A*
  VO.findPath = function (m, sx, sy, tx, ty, max) {
    max = max || 4000;
    if (sx === tx && sy === ty) return [];
    const W = m.w; const key = (x, y) => y * W + x;
    const open = [[sx, sy, 0, Math.abs(tx - sx) + Math.abs(ty - sy)]];
    const came = new Map(); const gS = new Map([[key(sx, sy), 0]]);
    let it = 0;
    while (open.length && it++ < max) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][3] < open[bi][3]) bi = i;
      const [x, y, gc] = open.splice(bi, 1)[0];
      if (x === tx && y === ty) {
        const out = []; let k = key(x, y);
        while (came.has(k)) { out.push([k % W, (k / W) | 0]); k = came.get(k); }
        return out.reverse();
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!(nx === tx && ny === ty) && m.solid(nx, ny)) continue;
        if (!m.inb(nx, ny)) continue;
        const t = m.get(nx, ny);
        const cost = gc + (t === T.COBBLE || t === T.PATH || t === T.PLAZA || t === T.BRIDGE ? 1 : 1.6);
        const k = key(nx, ny);
        if (cost < (gS.has(k) ? gS.get(k) : Infinity)) { gS.set(k, cost); came.set(k, key(x, y)); open.push([nx, ny, cost, cost + Math.abs(tx - nx) + Math.abs(ty - ny)]); }
      }
    }
    return null;
  };
})();
