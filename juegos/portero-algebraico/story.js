export const stories=[
 ['La frontera de medianoche','23:57 · DISTRITO NEÓN',[
 ['La ciudad no dormía. Solo esperaba.','La fila avanzaba bajo el neón. Uno a uno, los visitantes preparaban sus carnets. «Esta noche, tú decides quién cruza».'],
 ['Una frontera invisible.','En este distrito viven los naturales: 0, 1, 2… Se usan para contar. Aquí no hay negativos ni fracciones.'],
 ['La primera regla.','La voz de la radio fue tajante: «Cada par de naturales debe dar un único natural. Si una regla rompe esa frontera… no pasa».']]],
 ['El jardín de las deudas','00:31 · JARDÍN SECRETO',[
 ['Detrás del neón crecía otro mundo.','Un jardín oculto. Dos senderos idénticos partían de una fuente. Uno hacia la luz. El otro, hacia la sombra.'],
 ['Todo paso tenía su regreso.','Los enteros, ℤ, incluyen negativos, cero y positivos. A cada deuda −a le corresponde su opuesto a.'],
 ['La puerta exigía más.','«Ahora solo entran grupos», susurró la anfitriona. Cerradura, asociatividad, neutro e inversos. Tener números negativos no basta: importa la operación.']]],
 ['El pasajero que no podía volver','01:18 · MUELLE 03',[
 ['La niebla se tragó la calle.','Al otro lado había un muelle. Un barquero partió una moneda y dejó la mitad sobre tu carnet.'],
 ['Un mundo entre los enteros.','Los racionales, ℚ, son fracciones p/q de enteros, con q distinto de 0. También incluyen todos los enteros.'],
 ['Un nombre tachado en la lista.','«Con el producto, cada pasajero necesita su recíproco. El cero no lo tiene». Mira el conjunto: ℚ y ℚ sin 0 no admiten a los mismos invitados.']]],
 ['La noche que volvió al principio','02:06 · AURORA',[
 ['El reloj había dejado de avanzar.','Bajo la aurora, la última campanada devolvió las agujas al comienzo. Nadie parecía sorprenderse.'],
 ['Un reloj de cuatro posiciones.','0 → 1 → 2 → 3 → 0. Eso es «mod 4». Para hacer 3 + 2, avanza dos pasos desde 3: llegas a 1. No necesitas dividir.'],
 ['Dos reglas para tu primer turno.','En esta noche sencilla todos los carnets incluyen 0. La suma pasa: cada paso tiene vuelta. El producto no: 0 por cualquier número sigue siendo 0 y nunca llega al neutro 1.']]],
 ['La estación de los destinos cruzados','03:42 · ESTACIÓN ÓRBITA',[
 ['La puerta se abrió al vacío.','Una estación orbitaba un planeta desconocido. En su vestíbulo, tres viajeros intercambiaban sus destinos.'],
 ['Ya no llegaban números sueltos.','Las matrices organizan números en tablas. Las permutaciones reordenan elementos. Ambas pueden tener operaciones y formar grupos.'],
 ['Ningún destino debía quedar atrapado.','La consola cambió ABC por BCA; la inversa devolvió ABC. «Cada cambio debe poder deshacerse». Un grupo necesita inversos, pero no exige conmutatividad.']]],
 ['La última invitación','05:59 · LA ÚLTIMA TERRAZA',[
 ['La ciudad esperaba el amanecer.','La última fila esperaba junto al salón de la terraza. Dos carnets parecían idénticos. Solo una frontera los separaba.'],
 ['Todas las fronteras, una sola noche.','Llegan naturales, enteros, racionales y reales. ℝ también contiene irracionales, como √2. Otros invitados traen restos modulares.'],
 ['Esta vez, la lista la escribes tú.','El mismo producto falla en ℝ por el cero, pero forma un grupo en ℝ sin 0. La radio crepitó: «Revisa la fórmula… y también la frontera, portero».']]]
];
export function showStory(level,frames){const [title,time,panels]=stories[level];document.getElementById('nightTitle').textContent=title;document.getElementById('nightNumber').textContent=time;const strip=document.getElementById('comicStrip');strip.replaceChildren();panels.forEach(([heading,text],i)=>{const panel=document.createElement('article');panel.className='comic-panel';const art=document.createElement('img');art.src=frames[i];art.alt=['Vista del lugar','Un visitante de esta noche','La puerta del nuevo turno'][i];const caption=document.createElement('div');caption.className='comic-caption';const h=document.createElement('h3');h.textContent=heading;const p=document.createElement('p');p.textContent=text;caption.append(h,p);panel.append(art,caption);strip.append(panel)});document.getElementById('briefing').scrollTop=0;}
