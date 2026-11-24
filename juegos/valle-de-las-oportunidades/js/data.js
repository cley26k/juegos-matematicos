'use strict';
// Datos del juego: objetos, recursos, cultivos, peces, recetas, empleos, personajes.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  // ---------- Objetos ----------
  // cat: res (recurso), crop (cosecha), seed, fish, mat (procesado), food, place (colocable), tool
  const I = {};
  function item(id, name, cat, buy, sell, desc, extra) { I[id] = Object.assign({ id, name, cat, buy, sell, desc, stack: 99 }, extra || {}); }
  item('wood', 'Madera', 'res', 8, 5, 'Se obtiene talando árboles con el hacha.', { uses: 'Tablas, cercas, construcción' });
  item('stone', 'Piedra', 'res', 6, 3, 'Se obtiene picando rocas.', { uses: 'Caminos, hornos, obra' });
  item('copper_ore', 'Mineral de cobre', 'res', 0, 12, 'Se encuentra en la mina.', { uses: 'Barras de cobre' });
  item('iron_ore', 'Mineral de hierro', 'res', 0, 20, 'Niveles profundos de la mina.', { uses: 'Barras de hierro' });
  item('coal', 'Carbón', 'res', 25, 15, 'Combustible para el horno.', { uses: 'Fundir, ladrillos, vidrio' });
  item('clay', 'Arcilla', 'res', 0, 6, 'Se excava con la pala en la orilla del río.', { uses: 'Ladrillos, macetas' });
  item('sand', 'Arena', 'res', 0, 2, 'Se excava con la pala en la playa.', { uses: 'Vidrio' });
  item('fiber', 'Fibra vegetal', 'res', 0, 2, 'Se arranca de la maleza.', { uses: 'Cuerdas, comida de gallinas' });
  item('mango', 'Mango', 'food', 0, 18, 'Dulce y jugoso.', { energy: 15 });
  item('guayaba', 'Guayaba', 'food', 0, 12, 'Perfecta para mermelada.', { energy: 10 });
  item('coco', 'Coco', 'food', 0, 20, 'Cae de las palmas de la playa.', { energy: 12 });
  item('concha', 'Concha marina', 'res', 0, 15, 'Se recoge en la playa.', { uses: 'Decoración, venta' });
  item('plank', 'Tablas', 'mat', 30, 14, 'Madera procesada.', { uses: 'Muebles, obra' });
  item('brick', 'Ladrillo', 'mat', 30, 18, 'Arcilla cocida.', { uses: 'Obra del taller' });
  item('copper_bar', 'Barra de cobre', 'mat', 90, 50, 'Metal fundido.', { uses: 'Mejoras de herramientas' });
  item('iron_bar', 'Barra de hierro', 'mat', 150, 85, 'Metal resistente.', { uses: 'Mejoras, faroles' });
  item('glass', 'Vidrio', 'mat', 40, 20, 'Arena fundida.', { uses: 'Faroles, frascos' });
  item('rope', 'Cuerda', 'mat', 15, 8, 'Fibras trenzadas.', { uses: 'Construcción' });
  item('jam', 'Mermelada', 'food', 0, 45, 'Mermelada casera de guayaba.', { energy: 25 });
  item('egg', 'Huevo', 'food', 0, 15, 'De tus gallinas.', { energy: 8 });
  item('cuarzo', 'Cuarzo', 'res', 0, 60, 'Cristal raro de la galería profunda.', { uses: 'Venta, decoración' });
  item('leche', 'Leche de cabra', 'food', 0, 35, 'De tus cabras.', { energy: 12 });
  item('queso', 'Queso de hoja', 'food', 0, 95, 'Queso fresco hecho en el taller.', { energy: 30 });
  item('bait', 'Carnada', 'res', 3, 1, 'Hace que piquen más rápido.');
  // Cultivos
  const CROPS = {
    aji: { name: 'Ají', days: 4, seed: 15, sell: 32 },
    tomate: { name: 'Tomate', days: 5, seed: 15, sell: 36 },
    maiz: { name: 'Maíz', days: 3, seed: 10, sell: 22 },
    habichuela: { name: 'Habichuela', days: 4, seed: 18, sell: 24, regrow: 2 },
    auyama: { name: 'Auyama', days: 7, seed: 40, sell: 120 },
    yuca: { name: 'Yuca', days: 6, seed: 30, sell: 90 },
  };
  for (const k in CROPS) {
    const c = CROPS[k];
    item(k, c.name, 'crop', 0, c.sell, 'Cosecha de tu finca.', { energy: 6 });
    item('seed_' + k, 'Semillas de ' + c.name.toLowerCase(), 'seed', c.seed, Math.floor(c.seed / 2), `Crece en ${c.days} días si se riega a diario. Se vende a ${c.sell}.`, { crop: k });
  }
  // Peces
  const FISH = {
    sardina: { name: 'Sardina', sell: 25, where: 'mar', diff: 1 },
    chillo: { name: 'Chillo', sell: 45, where: 'mar', diff: 2 },
    carite: { name: 'Carite', sell: 40, where: 'mar', diff: 2, hours: [6, 12] },
    pez_loro: { name: 'Pez loro', sell: 60, where: 'mar', diff: 3, rare: true },
    tilapia: { name: 'Tilapia', sell: 30, where: 'lago', diff: 1 },
    dorado: { name: 'Dorado', sell: 70, where: 'lago', diff: 3, hours: [18, 26] },
    guabina: { name: 'Guabina', sell: 28, where: 'rio', diff: 1 },
  };
  for (const k in FISH) item(k, FISH[k].name, 'fish', 0, FISH[k].sell, 'Se pesca en: ' + FISH[k].where + '.', { energy: 10 });
  // Colocables
  item('chest', 'Cofre', 'place', 120, 40, 'Guarda 20 tipos de objetos.', { solid: true });
  item('fence', 'Cerca', 'place', 10, 3, 'Delimita corrales y caminos.', { solid: true });
  item('path_stone', 'Camino de piedra', 'place', 8, 2, 'Decora tu finca.', { floor: true });
  item('lamp', 'Farol', 'place', 220, 60, 'Ilumina por la noche.', { solid: true, light: true });
  item('table', 'Mesa', 'place', 150, 50, 'Mueble de madera.', { solid: true });
  item('chair', 'Silla', 'place', 90, 30, 'Mueble de madera.', { solid: true });
  item('rug', 'Alfombra', 'place', 100, 30, 'Da calor al hogar.', { floor: true });
  item('plant_pot', 'Maceta', 'place', 60, 20, 'Una planta para la casa.', { solid: true });
  item('bookshelf', 'Librero', 'place', 200, 60, 'Para tus libros.', { solid: true });
  item('sprinkler', 'Aspersor', 'place', 300, 90, 'Riega las 4 casillas vecinas cada mañana.', { solid: true });
  item('workbench', 'Banco de trabajo', 'place', 0, 0, 'Permite fabricar.', { solid: true });
  // Herramientas
  const TOOLS = {
    axe: { name: 'Hacha', icon: 'axe', energy: 2 },
    pick: { name: 'Pico', icon: 'pick', energy: 2 },
    hoe: { name: 'Azada', icon: 'hoe', energy: 2 },
    can: { name: 'Regadera', icon: 'can', energy: 1 },
    rod: { name: 'Caña de pescar', icon: 'rod', energy: 3 },
    shovel: { name: 'Pala', icon: 'shovel', energy: 2 },
    hammer: { name: 'Martillo', icon: 'hammer', energy: 1 },
  };
  for (const k in TOOLS) item(k, TOOLS[k].name, 'tool', 0, 0, '', { stack: 1, tool: k });
  VO.TIER_NAMES = ['Básica', 'Cobre', 'Hierro'];
  VO.TOOL_UPGRADE = [null, { money: 150, mat: 'copper_bar', qty: 5, days: 1 }, { money: 400, mat: 'iron_bar', qty: 5, days: 1 }];
  VO.TOOL_STATS = (tier) => ({ power: [1, 2, 3][tier], energyMul: [1, 0.8, 0.6][tier], maxDur: [60, 100, 160][tier], canCap: [20, 35, 50][tier] });

  VO.ITEMS = I; VO.CROPS = CROPS; VO.FISH = FISH; VO.TOOLS = TOOLS;
  VO.iconOf = (id) => (I[id] && I[id].tool ? I[id].tool : id);

  // ---------- Recursos del mundo ----------
  // Cada recurso: herramienta requerida, golpes (tiempo), energía, objeto, cantidad, regeneración (días)
  VO.NODES = {
    tree: { name: 'Árbol', tool: 'axe', hp: 5, energy: 4, drop: { wood: [4, 7] }, regen: 4, stump: true },
    palm: { name: 'Palma', tool: 'axe', hp: 5, energy: 4, drop: { wood: [3, 5], coco: [0, 2] }, regen: 4, stump: true },
    pine: { name: 'Pino', tool: 'axe', hp: 6, energy: 4, drop: { wood: [4, 6] }, regen: 5, stump: true },
    stump: { name: 'Tocón', tool: 'axe', hp: 2, energy: 3, drop: { wood: [1, 2] }, regen: 0 },
    rock: { name: 'Roca', tool: 'pick', hp: 3, energy: 4, drop: { stone: [2, 3] }, regen: 2 },
    copper: { name: 'Veta de cobre', tool: 'pick', hp: 4, energy: 5, drop: { copper_ore: [1, 2], stone: [0, 1] }, regen: 3 },
    iron: { name: 'Veta de hierro', tool: 'pick', hp: 6, energy: 6, drop: { iron_ore: [1, 2] }, regen: 4, minTier: 1 },
    coal: { name: 'Veta de carbón', tool: 'pick', hp: 4, energy: 5, drop: { coal: [1, 2] }, regen: 3 },
    clay: { name: 'Depósito de arcilla', tool: 'shovel', hp: 2, energy: 3, drop: { clay: [1, 3] }, regen: 2 },
    sandpile: { name: 'Arena', tool: 'shovel', hp: 1, energy: 2, drop: { sand: [2, 3] }, regen: 1 },
    weed: { name: 'Maleza', tool: null, hp: 1, energy: 1, drop: { fiber: [1, 2] }, regen: 2 },
    bush: { name: 'Guayabo', tool: null, hp: 1, energy: 1, drop: { guayaba: [1, 3] }, regen: 2, keep: true },
    mangotree: { name: 'Mango', tool: 'axe', hp: 8, energy: 4, drop: { wood: [3, 5] }, regen: 6, stump: true, fruit: 'mango' },
    shell: { name: 'Concha', tool: null, hp: 1, energy: 0, drop: { concha: [1, 1] }, regen: 2 },
  };

  // ---------- Recetas ----------
  // station: 'banco' (casa) o 'taller' (taller familiar restaurado)
  VO.RECIPES = [
    { out: 'plank', n: 1, in: { wood: 2 }, station: 'banco', mins: 10 },
    { out: 'rope', n: 1, in: { fiber: 3 }, station: 'banco', mins: 10 },
    { out: 'fence', n: 2, in: { wood: 2 }, station: 'banco', mins: 10 },
    { out: 'path_stone', n: 2, in: { stone: 1 }, station: 'banco', mins: 5 },
    { out: 'chest', n: 1, in: { plank: 6, rope: 1 }, station: 'banco', mins: 30 },
    { out: 'chair', n: 1, in: { plank: 3 }, station: 'banco', mins: 20 },
    { out: 'table', n: 1, in: { plank: 5 }, station: 'banco', mins: 30 },
    { out: 'rug', n: 1, in: { fiber: 8, rope: 1 }, station: 'banco', mins: 30 },
    { out: 'plant_pot', n: 1, in: { clay: 2, fiber: 1 }, station: 'banco', mins: 15 },
    { out: 'jam', n: 1, in: { guayaba: 3 }, station: 'banco', mins: 30 },
    { out: 'queso', n: 1, in: { leche: 2 }, station: 'taller', mins: 60 },
    { out: 'brick', n: 2, in: { clay: 2, coal: 1 }, station: 'taller', mins: 30 },
    { out: 'glass', n: 1, in: { sand: 3, coal: 1 }, station: 'taller', mins: 30 },
    { out: 'copper_bar', n: 1, in: { copper_ore: 3, coal: 1 }, station: 'taller', mins: 40 },
    { out: 'iron_bar', n: 1, in: { iron_ore: 3, coal: 1 }, station: 'taller', mins: 50 },
    { out: 'bookshelf', n: 1, in: { plank: 8 }, station: 'taller', mins: 40 },
    { out: 'lamp', n: 1, in: { iron_bar: 1, glass: 1, plank: 2 }, station: 'taller', mins: 40 },
    { out: 'sprinkler', n: 1, in: { copper_bar: 1, iron_bar: 1 }, station: 'taller', mins: 60 },
  ];

  // ---------- Proyectos de obra (Tomás) ----------
  VO.PROJECTS = [
    { id: 'techo', name: 'Reparar el techo', needs: { wood: 30, stone: 15 }, money: 150, desc: 'Sin goteras al fin. La casa recupera su color.', chapter: 1 },
    { id: 'taller', name: 'Restaurar el taller familiar', needs: { plank: 15, stone: 25, rope: 3 }, money: 300, desc: 'Abre el taller: ladrillos, vidrio, fundición y muebles finos.', chapter: 3 },
    { id: 'gallinero', name: 'Gallinero', needs: { plank: 10, fiber: 15 }, money: 200, desc: 'Permite criar gallinas en la finca.', chapter: 2 },
  ];

  // ---------- Empleos ----------
  VO.JOBS = [
    { id: 'carpinteria', name: 'Ayudante de carpintería', npc: 'tomas', base: 50, rate: 30, min: 2, max: 6, open: 8, close: 17, energy: 6, desc: 'Lijar, cargar y medir tablas.' },
    { id: 'frutas', name: 'Recolector de frutas', npc: 'lucia', base: 0, rate: 35, min: 1, max: 5, open: 6, close: 14, energy: 5, desc: 'Cosechar mangos y guayabas.' },
    { id: 'cultivos', name: 'Cuidador de cultivos', npc: 'lucia', base: 40, rate: 35, min: 2, max: 8, open: 6, close: 18, energy: 6, desc: 'Regar y desyerbar la finca de Lucía.' },
    { id: 'transporte', name: 'Transportista de mercancías', npc: 'clara', base: 20, rate: 40, min: 3, max: 6, open: 7, close: 16, energy: 8, desc: 'Llevar cajas del muelle al mercado.' },
    { id: 'mercado', name: 'Ayudante de mercado', npc: 'clara', base: 60, rate: 30, min: 1, max: 8, open: 8, close: 18, energy: 4, desc: 'Atender clientes y ordenar el puesto.' },
    { id: 'pescador', name: 'Pescador ayudante', npc: 'marina', base: 20, rate: 35, min: 2, max: 5, open: 5, close: 12, energy: 7, desc: 'Ayudar a Marina con las redes.' },
    { id: 'minerales', name: 'Clasificador de minerales', npc: 'bruno', base: 30, rate: 35, min: 2, max: 6, open: 9, close: 17, energy: 6, desc: 'Separar cobre, hierro y carbón.' },
    { id: 'muebles', name: 'Fabricante de muebles', npc: 'tomas', base: 0, rate: 45, min: 3, max: 6, open: 9, close: 17, energy: 7, desc: 'Armar sillas y mesas por encargo.', req: 'taller' },
  ];

  // ---------- Personajes ----------
  VO.NPCS = {
    mateo: { name: 'Don Mateo', role: 'Comerciante de semillas', shop: 'semillas', work: 'semillas', home: 'casa_mateo',
      look: { skin: '#c68c5a', hair: '#e6e2da', style: 'short', beard: true, hat: 'straw', hatC: '#e8c55a', shirt: '#efe6cf', pants: '#6a5a3a' },
      bio: 'Lleva cuarenta años vendiendo semillas. Cuenta chistes malos y conoce cada surco del valle.',
      lines: ['¿Sabías que el ají más picante nace de la tierra más terca? Como yo.', 'Riega todos los días, que la mata no espera.', 'Ese sombrero tuyo pide sol. ¡A sembrar!', 'Cuando llueve no hace falta regar. El cielo trabaja gratis.'] },
    elena: { name: 'Elena', role: 'Administradora del banco', shop: 'banco', work: 'banco', home: 'casa_elena',
      look: { skin: '#8a5a3a', hair: '#24160e', style: 'pony', glasses: true, shirt: '#2f6fb0', pants: '#2a2a3a' },
      bio: 'Ordenada, paciente y fanática de las tablas. Cree que entender un préstamo es más importante que pedirlo.',
      lines: ['Un préstamo es una herramienta, no una obligación.', 'Capital, tasa y tiempo: con esos tres se entiende todo.', 'Ahorrar poco a poco también es avanzar.', 'Siempre leo la letra pequeña. Bueno, la letra de cualquier tamaño.'] },
    tomas: { name: 'Tomás', role: 'Carpintero', shop: 'carpinteria', work: 'carpinteria', home: 'casa_tomas',
      look: { skin: '#d8a070', hair: '#6a3a1a', style: 'short', beard: true, shirt: '#8a4a2a', apron: '#b07a46', pants: '#3a3a4a' },
      bio: 'Hombre de pocas palabras y medidas exactas. Mide dos veces y corta una.',
      lines: ['Mmm.', 'Mide dos veces. Corta una.', 'La madera también tiene paciencia.', 'Si necesitas muebles, ya sabes dónde estoy.'] },
    marina: { name: 'Marina', role: 'Pescadora', shop: 'pesca', work: 'muelle', home: 'casa_marina',
      look: { skin: '#a86a40', hair: '#1a1010', style: 'long', hat: 'band', hatC: '#e8452f', shirt: '#3ac0a8', pants: '#2f4f7a' },
      bio: 'Directa como un anzuelo. Se levanta antes que el sol y conoce todas las corrientes.',
      lines: ['El mar no regala nada, pero tampoco cobra.', 'Los carites pican temprano. Los dorados, de noche en el lago.', 'Si no pica, cambia de sitio.', '¿Hueles eso? Va a llover.'] },
    lucia: { name: 'Lucía', role: 'Agricultora', shop: 'granja', work: 'finca_lucia', home: 'finca_lucia',
      look: { skin: '#e0a878', hair: '#3a2010', style: 'curly', hat: 'straw', hatC: '#d8b45a', shirt: '#e8892a', pants: '#4a6a3a' },
      bio: 'Alegre y trabajadora. Habla con sus gallinas y jura que le contestan.',
      lines: ['¡Buenos días! Mis gallinas te mandan saludos.', 'La tierra agradece al que madruga.', 'Una cerca bien puesta vale más que mil carreras detrás de una gallina.', '¿Ya probaste sembrar auyama? Tarda, pero paga bien.'] },
    bruno: { name: 'Bruno', role: 'Herrero', shop: 'herreria', work: 'herreria', home: 'herreria',
      look: { skin: '#6a4028', hair: '#1a1010', style: 'bald', beard: true, shirt: '#6a6a6a', apron: '#4a3020', pants: '#2a2a2a' },
      bio: 'Ruidoso y bonachón. Se ríe tan fuerte como golpea el yunque.',
      lines: ['¡JA! ¿Vienes por una mejora?', 'El hierro se trabaja en caliente. ¡Como las ideas!', 'La mina tiene más hierro abajo, en el nivel 4.', '¡Cuidado con los dedos!'] },
    clara: { name: 'Clara', role: 'Comerciante', shop: 'mercado', work: 'mercado', home: 'casa_clara',
      look: { skin: '#c88a5a', hair: '#5a2a1a', style: 'long', shirt: '#e2508a', apron: '#f4efe4', pants: '#5a3a4a' },
      bio: 'Negociante nata. Recuerda los precios de todo y el cumpleaños de todos.',
      lines: ['¡Hoy los precios están buenos! Bueno, para mí.', 'Compro de todo: madera, pescado, cosecha…', 'Ingreso es lo que entra. Ganancia es lo que te queda. ¡No los confundas!', 'Un buen trato deja contentas a las dos partes.'] },
    rafael: { name: 'Rafael', role: 'Encargado del tablón de empleos', shop: 'empleos', work: 'tablon', home: 'casa_rafael',
      look: { skin: '#9a6040', hair: '#1a1010', style: 'short', hat: 'cap', hatC: '#e8452f', shirt: '#f2cf3a', pants: '#3a5a8a' },
      bio: 'Habla rápido y conoce todos los trabajos del valle. Ama las comparaciones.',
      lines: ['¡Hay trabajo para todos! Bueno, para los que madrugan.', 'Compara antes de elegir: el pago fijo no lo es todo.', 'Mira la gráfica: donde se cruzan las rectas, ¡ahí está el truco!'] },
    sofia: { name: 'Sofía', role: 'Bibliotecaria', shop: 'biblioteca', work: 'biblioteca', home: 'casa_sofia',
      look: { skin: '#f0c090', hair: '#8a4a1a', style: 'pony', glasses: true, shirt: '#8a3a9a', pants: '#3a2a4a' },
      bio: 'Curiosa y soñadora. Escribe un libro sobre la historia del valle.',
      lines: ['Los libros de la estantería azul explican intervalos y desigualdades.', 'Tu abuela venía a leer aquí todos los jueves.', 'Shh… era broma, aquí puedes hablar.'] },
    andres: { name: 'Andrés', role: 'Alcalde del pueblo', shop: 'alcaldia', work: 'alcaldia', home: 'casa_andres',
      look: { skin: '#b87a4a', hair: '#5a5a5a', style: 'short', beard: true, shirt: '#f4efe4', pants: '#3a3a5a' },
      bio: 'Optimista incansable. Sueña con devolverle la Feria del Valle a su pueblo.',
      lines: ['¡El valle renace, vecino!', 'Cada cosecha cuenta. Cada cuenta también.', 'La Feria del Valle volverá. ¡Lo prometo!'] },
  };

  const INTROS = {
 "mateo": [
  "Yo soy Mateo, pero aquí todos me dicen Don Mateo. Llevo cuarenta años vendiendo semillas en este valle.",
  "Conocí a tu abuela cuando las dos fincas eran puro monte. ¡Qué mujer tan terca! Igualita al ají que sembraba.",
  "Si te va bien con la tierra, a mí me va bien con las semillas. Así funciona esto."
 ],
 "elena": [
  "Mucho gusto, me llamo Elena y administro el Banco del Valle.",
  "Antes trabajaba en la capital, pero volví porque aquí la gente necesitaba a alguien que explicara los números sin enredos.",
  "Mi regla de oro: nunca firmes nada que no puedas explicar con tus propias palabras."
 ],
 "tomas": [
  "Tomás. Carpintero.",
  "…",
  "Mi papá construyó la mitad de las casas del valle. Yo arreglo la otra mitad. Si necesitas madera trabajada, ya sabes dónde estoy."
 ],
 "marina": [
  "Soy Marina. Pesco desde que tenía tu edad, o menos.",
  "El muelle es mi casa; el mar, mi jefe. Me levanto antes que el sol y no me quejo… mucho.",
  "Si quieres aprender a pescar, empieza con paciencia. Lo demás viene solo."
 ],
 "lucia": [
  "¡Hola, hola! Yo soy Lucía, tu vecina de la finca de al lado.",
  "Tengo gallinas, maíz, auyamas y un perro que se cree gallina. Bueno, eso último es mentira, pero casi.",
  "Cualquier cosa que necesites de la tierra, pregúntame. ¡Entre vecinas y vecinos nos ayudamos!"
 ],
 "bruno": [
  "¡JA! Yo soy Bruno, el herrero. ¡El que hace sonar el yunque desde las nueve!",
  "Mi abuelo forjaba herraduras; yo forjo herramientas, rejas y alguna que otra idea.",
  "Tráeme metal y monedas, y te dejo esa herramienta como nueva. ¡O mejor que nueva!"
 ],
 "clara": [
  "Encantada, soy Clara, la del mercado. Compro, vendo y sé el precio de todo… y el cumpleaños de todos.",
  "Mi puesto empezó con una mesa y tres cajas de tomates. Hoy, mírame.",
  "Un consejo de comerciante: lo que entra no es lo mismo que lo que te queda. ¡Haz bien tus cuentas!"
 ],
 "rafael": [
  "¡Ey! Rafael, a la orden. Yo manejo el tablón de empleos de la plaza.",
  "Conozco cada trabajo del valle: quién paga, cuánto y a qué hora. Si alguien necesita manos, me entero primero.",
  "Mi pasatiempo es comparar ofertas. Sí, lo sé, soy raro. ¡Pero te ahorro dinero!"
 ],
 "sofia": [
  "Hola, soy Sofía. Cuido la biblioteca y escribo la historia del valle.",
  "Tu abuela venía todos los jueves a leer sobre plantas. Todavía tengo sus notas guardadas.",
  "Si alguna cuenta se te enreda, aquí hay libros que lo explican despacito."
 ],
 "andres": [
  "¡Bienvenido! Soy Andrés, el alcalde. Bueno, el alcalde y el que barre la plaza los domingos.",
  "Mi sueño es que la Feria del Valle vuelva a llenar esta plaza, como cuando yo era niño.",
  "Cada familia que vuelve al valle es una buena noticia. ¡Y tú eres la mejor de este año!"
 ]
};
  for (const k in INTROS) VO.NPCS[k].intro = INTROS[k];
  // ---------- Biblioteca: libros ----------
  VO.BOOKS = [
    { t: 'Desigualdades para la vida diaria', b: '“Al menos 60” se escribe ≥ 60 (incluye el 60). “Más de 60” se escribe > 60 (no incluye el 60). “Como máximo 18” es ≤ 18. “Menos de 60” es < 60.' },
    { t: 'Intervalos abiertos y cerrados', b: 'El corchete [ ] incluye el extremo; el paréntesis ( ) lo excluye. En la recta numérica: punto relleno = incluido; punto hueco = excluido. El infinito siempre lleva paréntesis: [12, ∞).' },
    { t: 'El giro del signo', b: 'Si multiplicas o divides ambos miembros por un número NEGATIVO, la desigualdad cambia de sentido. Ejemplo: -45x ≥ -360 → x ≤ 8. Comprueba con un valor: x = 0 cumple las dos.' },
    { t: 'Sistemas de inecuaciones', b: 'Cuando hay varias condiciones a la vez, la solución es la intersección: los valores que cumplen TODAS. Si las regiones no se cruzan, el sistema es incompatible: conjunto vacío ∅.' },
    { t: 'Una solución no es todas', b: 'Si 12 sirve, quizá 13 y 18 también. El conjunto solución reúne TODOS los valores que cumplen. Encontrar uno es un buen comienzo, no el final.' },
    { t: 'Enteros o reales', b: 'No se compran 4,5 sacos: si la variable cuenta objetos, solo valen enteros. Si mide tiempo o litros, pueden valer decimales. El dominio decide.' },
    { t: 'Interés simple', b: 'I = C · r · t (capital por tasa por tiempo). Monto: M = C + I. Con C = 1000 y r = 2 % semanal: I = 20t, M = 1000 + 20t. Es una recta: crece lo mismo cada semana.' },
    { t: 'Ingreso, costo y ganancia', b: 'Ingreso: lo que entra al vender. Costo: lo que pagas para producir. Ganancia = ingreso − costo. Vender mucho no garantiza ganar si los costos son altos.' },
    { t: 'Historia del valle', b: 'Hace diez años, la Feria del Valle reunía a todo el pueblo. Cuando cerró el taller de los Peña, muchas familias se mudaron. Dicen que el día que el taller vuelva a abrir, volverá la feria.' },
  ];
})();
