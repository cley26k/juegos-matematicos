// Genera index.html (galería para GitHub Pages) y README.md a partir de juegos.json y videos/clips.json.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const games = JSON.parse(fs.readFileSync(path.join(__dirname, 'juegos.json'), 'utf8'));
const clips = JSON.parse(fs.readFileSync(path.join(ROOT, 'videos', 'clips.json'), 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const total = games.reduce((n, g) => n + Object.keys(clips[g.id]?.clips ?? {}).length, 0);

// La historia decide el orden: de primaria a universidad.
const historia = JSON.parse(fs.readFileSync(path.join(__dirname, 'historia.json'), 'utf8'));
const porId = Object.fromEntries(games.map(g => [g.id, g]));
const COLOR = { 'pizza-fraccionaria': '#ff8a3c', 'coco-conjuntos': '#27c9b8', 'laberinto-radian': '#46b8d8', 'puente-de-cristal': '#3b8fe8', mathrally: '#e25cc0', 'sudoku-academy': '#3f6fe0', residuo: '#e2606f', 'portero-algebraico': '#d9379f', 'algebra-engine': '#1fb98a' };
const IDEA = { 'pizza-fraccionaria': 'Una parte también cuenta.', 'coco-conjuntos': 'Cada conjunto cabe dentro del siguiente.', 'laberinto-radian': 'Un radián es un radio doblado sobre el borde.', 'puente-de-cristal': 'Haz la cuenta antes de saltar.', mathrally: 'A cada entrada, una sola salida.', 'sudoku-academy': 'Tacha lo imposible hasta que solo quede uno.', residuo: 'En el Valle de Doce, 9 + 3 = 0.', 'portero-algebraico': 'Sin neutro no hay grupo.', 'algebra-engine': 'El núcleo es todo lo que va a dar a cero.' };
const orden = historia.filter(c => porId[c.id]).map(c => porId[c.id]);
if (orden.length !== games.length) throw new Error('historia.json debe tener un capítulo por juego');

const capitulos = historia.map((cap, i) => {
  const g = porId[cap.id];
  const clip = g && clips[g.id]?.clips?.[cap.clip];
  if (g && !clip) throw new Error(`Falta el clip ${cap.clip} de ${g.id}`);
  const textos = cap.textos.map(t => `<p class="txt ${t.pos} ${t.tipo}${t.a >= 0.9 ? ' lado' : ''}" data-de="${t.de}" data-a="${t.a}"><span>${esc(t.t)}</span></p>`).join('\n        ');
  const portal = g ? `
        <aside class="portal${clip.vp === 'm' ? ' movil' : ''}" style="--color:${COLOR[g.id]}" aria-label="${esc(g.titulo)}">
          <div class="portal-marco"><video src="videos/${g.id}/${cap.clip}.mp4" poster="videos/${g.id}/${cap.clip}.jpg" preload="none" muted loop playsinline aria-label="${esc(clip.titulo)}: ${esc(clip.mecanica)}"></video></div>
          <h3>${esc(g.titulo)}</h3>
          <p>${esc(g.tema)} · ${esc(g.nivel)}${g.hecho ? ` · hecho con ${esc(g.hecho)}` : ''}</p>
          <div class="portal-acciones"><a class="boton fuerte" href="juegos/${g.id}/">Jugar</a><a class="boton ver-ficha" href="#ficha-${g.id}">Ficha y clips</a></div>
        </aside>` : '';
  return `
    <section class="cap" id="cap-${cap.id}" data-id="${cap.id}" style="--largo:${cap.largo || 340}vh">
      <h2>${g ? `Mundo ${i}: ${esc(g.titulo)}` : esc(cap.nombre)}</h2>
      <div class="cap-pegado">
        ${textos}${portal}
      </div>
    </section>`;
}).join('');

const carril = historia.map((c, i) => `<li><a href="#cap-${c.id}" aria-label="${esc(porId[c.id]?.titulo || c.nombre)}">${i === 0 ? '0' : porId[c.id] ? i : 'F'}</a></li>`).join('');

const fichas = orden.map(g => {
  const cs = Object.entries(clips[g.id]?.clips ?? {});
  return `
      <article class="ficha" id="ficha-${g.id}" style="--color:${COLOR[g.id]}">
        <header class="ficha-cab">
          <div>
            <span class="cinta">${esc(g.tema)} · ${esc(g.nivel)}${g.hecho ? ` · hecho con ${esc(g.hecho)}` : ''}</span>
            <h3>${esc(g.titulo)}</h3>
            <p class="idea">${esc(IDEA[g.id])}</p>
            <p class="resumen">${esc(g.resumen)}</p>
          </div>
          <div class="ficha-acciones"><a class="boton fuerte" href="juegos/${g.id}/">Jugar</a>${g.codigo ? `<a class="boton" href="${g.codigo}">Código</a>` : ''}</div>
        </header>
        <div class="hechos">
          <div><h4>Matemáticas</h4><ul>${g.matematicas.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>
          <div><h4>Gamificación</h4><ul class="etiquetas">${g.gamificacion.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>
        </div>
        <div class="clips">
          ${cs.map(([id, c]) => `<figure class="clip">
            <video src="videos/${g.id}/${id}.mp4" poster="videos/${g.id}/${id}.jpg" preload="none" muted loop playsinline controls></video>
            <figcaption><b>${esc(c.titulo)}</b><span>${esc(c.mecanica)}</span><small>${c.segundos} s · <a href="videos/${g.id}/${id}.mp4" download>MP4</a></small></figcaption>
          </figure>`).join('\n          ')}
        </div>
      </article>`;
}).join('\n');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CERO · Nueve juegos para aprender matemáticas</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 fill=%27%2314121f%27/%3E%3Cellipse cx=%2716%27 cy=%2716%27 rx=%277%27 ry=%2710%27 fill=%27none%27 stroke=%27%23ff3d2e%27 stroke-width=%275%27/%3E%3C/svg%3E">
<meta name="description" content="Cero, el número que nadie contaba, cruza nueve mundos. Una historia animada que se cuenta bajando, y nueve juegos de matemáticas creados con IA para jugar en el navegador.">
<meta name="theme-color" content="#14121f">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap">
<link rel="stylesheet" href="sitio/estilo.css">
</head>
<body>
<a class="salto" href="#archivo">Saltar a los juegos ↓</a>
<canvas id="lienzo" aria-hidden="true"></canvas>
<nav class="carril" aria-label="Capítulos"><span class="carril-pista" aria-hidden="true"><span class="carril-barra"></span></span><ol>${carril}</ol></nav>
<div class="desliza" aria-hidden="true">Desliza</div>
<main>
  <h1 class="oculto">CERO: nueve juegos para aprender matemáticas</h1>
  <div class="historia">${capitulos}
  </div>
  <section class="archivo" id="archivo">
    <div class="archivo-dentro">
      <header class="archivo-cab">
        <h2>Ahora te toca jugar</h2>
        <p>Nueve juegos creados con IA (Claude y Google AI Studio) para estudiar el potencial de la gamificación digital en la enseñanza de las matemáticas. Todos se juegan en el navegador y cada mecánica tiene un clip de prueba grabado automáticamente.</p>
        <ul class="datos"><li><b>${games.length}</b><span>juegos</span></li><li><b>${total}</b><span>clips de prueba</span></li><li><b>${new Set(games.flatMap(g => g.gamificacion)).size}</b><span>elementos de gamificación</span></li></ul>
        <ul class="indice">${orden.map(g => `<li><a href="#ficha-${g.id}">${esc(g.titulo)}</a></li>`).join('')}</ul>
      </header>
${fichas}
      <footer class="pie">La historia de Cero es original y se dibuja por código en un canvas, con GSAP y Lenis. Los clips se generan con <code>npm run grabar</code> y esta página con <code>npm run galeria</code>.</footer>
    </div>
  </section>
</main>
<script src="sitio/vendor/gsap.min.js"></script>
<script src="sitio/vendor/ScrollTrigger.min.js"></script>
<script src="sitio/vendor/SplitText.min.js"></script>
<script src="sitio/vendor/lenis.min.js"></script>
<script src="sitio/tinta.js"></script>
<script src="sitio/cero.js"></script>
<script src="sitio/escenas.js"></script>
<script src="sitio/historia.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'index.html'), html);

const readme = `# Juegos para aprender matemáticas

Colección de juegos educativos creados con IA (Claude y Google AI Studio), junto con clips de prueba de cada mecánica, para una presentación sobre los resultados y la capacidad de la gamificación digital en la enseñanza de las matemáticas.

**Galería:** https://cley26k.github.io/juegos-matematicos/

| Juego | Tema | Nivel | Clips |
|---|---|---|---|
${games.map(g => `| [${g.titulo}](juegos/${g.id}/) | ${g.tema} | ${g.nivel} | ${Object.keys(clips[g.id]?.clips ?? {}).length} |`).join('\n')}

${games.map(g => `## ${g.titulo}

${g.resumen}

- **Matemáticas:** ${g.matematicas.join('; ')}.
- **Gamificación:** ${g.gamificacion.join('; ')}.
${g.hecho ? `- **Hecho con:** ${g.hecho}.\n` : ''}${g.codigo ? `- **Código fuente:** ${g.codigo}\n` : ''}
| Clip | Mecánica | Duración |
|---|---|---|
${Object.entries(clips[g.id]?.clips ?? {}).map(([id, c]) => `| [${c.titulo}](videos/${g.id}/${id}.mp4) | ${c.mecanica} | ${c.segundos} s |`).join('\n')}
`).join('\n')}
## Estructura

- \`juegos/<juego>/\`: versión jugable de cada juego (HTML estático).
- \`videos/<juego>/<clip>.mp4\` y \`.jpg\`: clips en MP4 (H.264, sin audio) listos para insertar en diapositivas, con su imagen de portada.
- \`scripts/clips/<juego>.cjs\`: guion de cada clip (qué se pulsa y cuándo).
- \`scripts/grabar.cjs\`: graba los clips con Playwright y los recorta y convierte con ffmpeg.
- \`scripts/galeria.cjs\`: genera esta página y el README.
- \`scripts/historia.json\`: guion de la historia de Cero (textos y clip de cada capítulo).
- \`sitio/\`: la historia animada: personaje (\`cero.js\`), escenas (\`escenas.js\`), dibujo (\`tinta.js\`) y scroll (\`historia.js\`). GSAP y Lenis están en \`sitio/vendor/\`.

## Volver a grabar

\`\`\`bash
npm install
npm run serve          # en otra terminal
npm run grabar         # todos los clips; o: node scripts/grabar.cjs coco-conjuntos trivia
npm run galeria
\`\`\`

Los clips se graban con datos de ejemplo cuando hace falta (por ejemplo, un perfil con progreso en Sudoku Academy) y, en algunos casos, preparan la escena fuera de cámara (colocar al jugador junto a un desafío) para que cada clip muestre solo su mecánica.

## Notas

- Coco Conjuntos tiene un podio en línea que necesita su servidor; en esta galería se juega sin conexión.
- Portero Algebraico usa modelos 3D de Kenney (CC0); sus licencias están en \`juegos/portero-algebraico/\`.
`;
fs.writeFileSync(path.join(ROOT, 'README.md'), readme);
console.log('index.html y README.md generados');
