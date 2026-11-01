// Genera index.html (galería para GitHub Pages) y README.md a partir de juegos.json y videos/clips.json.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const games = JSON.parse(fs.readFileSync(path.join(__dirname, 'juegos.json'), 'utf8'));
const clips = JSON.parse(fs.readFileSync(path.join(ROOT, 'videos', 'clips.json'), 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const total = games.reduce((n, g) => n + Object.keys(clips[g.id]?.clips ?? {}).length, 0);

const cards = games.map((g, i) => {
  const cs = Object.entries(clips[g.id]?.clips ?? {});
  return `
  <section class="game" id="${g.id}" style="--hue:${[262, 28, 160, 330][i % 4]}">
    <header class="game-head">
      <div>
        <p class="eyebrow">${esc(g.tema)} · ${esc(g.nivel)}${g.hecho ? ` · hecho con ${esc(g.hecho)}` : ""}</p>
        <h2>${esc(g.titulo)}</h2>
        <p class="lead">${esc(g.resumen)}</p>
      </div>
      <div class="actions">
        <a class="btn primary" href="juegos/${g.id}/">Jugar</a>
        ${g.codigo ? `<a class="btn" href="${g.codigo}">Código</a>` : ''}
      </div>
    </header>
    <div class="facts">
      <div><h3>Matemáticas</h3><ul>${g.matematicas.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>
      <div><h3>Gamificación</h3><ul class="tags">${g.gamificacion.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>
    </div>
    <div class="clips">
      ${cs.map(([id, c]) => `
      <figure class="clip${c.vp === 'm' ? ' phone' : ''}">
        <video src="videos/${g.id}/${id}.mp4" poster="videos/${g.id}/${id}.jpg" preload="none" muted loop playsinline controls></video>
        <figcaption><b>${esc(c.titulo)}</b><span>${esc(c.mecanica)}</span><small>${c.segundos} s · <a href="videos/${g.id}/${id}.mp4" download>MP4</a></small></figcaption>
      </figure>`).join('')}
    </div>
  </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Juegos matemáticos</title>
<meta name="description" content="Juegos para enseñar matemáticas creados con IA, con clips de prueba de cada mecánica.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap">
<style>
:root { --bg: #f6f5fb; --surface: #fff; --ink: #2f3245; --ink-2: #6c7088; --line: #e4e3ee; --accent: #6a4fe6; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root { --bg: #10131b; --surface: #1c2232; --ink: #eef0f7; --ink-2: #a8aec2; --line: #2a3148; --accent: #9a83ff; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 600 16px/1.5 Nunito, system-ui, sans-serif; }
main { max-width: 1120px; margin: 0 auto; padding: 32px 16px 64px; }
.hero { padding: 24px 0 8px; }
.hero h1 { font-size: clamp(2rem, 5vw, 3rem); line-height: 1.1; margin: 0 0 10px; letter-spacing: -.02em; font-weight: 900; }
.hero p { color: var(--ink-2); max-width: 62ch; margin: 0; font-size: 1.1rem; }
.stats { display: flex; gap: 12px; flex-wrap: wrap; margin: 22px 0 8px; }
.stats div { background: var(--surface); border: 2px solid var(--line); border-radius: 16px; padding: 10px 18px; }
.stats b { display: block; font-size: 1.6rem; font-weight: 900; color: var(--accent); }
.stats span { font-size: .85rem; color: var(--ink-2); font-weight: 800; }
nav.toc { display: flex; gap: 8px; flex-wrap: wrap; margin: 18px 0 8px; }
nav.toc a { color: var(--ink); text-decoration: none; background: var(--surface); border: 2px solid var(--line); border-radius: 999px; padding: 6px 14px; font-weight: 800; font-size: .9rem; }
.game { --c: hsl(var(--hue) 70% 55%); background: var(--surface); border: 2px solid var(--line); border-top: 6px solid var(--c); border-radius: 22px; padding: 24px; margin-top: 28px; }
.game-head { display: flex; gap: 20px; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; }
.game-head > div:first-child { flex: 1 1 520px; }
.eyebrow { margin: 0; color: var(--c); font-weight: 900; text-transform: uppercase; letter-spacing: .06em; font-size: .78rem; }
h2 { margin: 4px 0 8px; font-size: 1.8rem; font-weight: 900; letter-spacing: -.01em; }
.lead { margin: 0; color: var(--ink-2); max-width: 70ch; }
.actions { display: flex; gap: 10px; }
.btn { display: inline-flex; align-items: center; min-height: 44px; padding: 0 20px; border-radius: 14px; border: 2px solid var(--line); border-bottom-width: 5px; color: var(--ink); text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; font-size: .85rem; }
.btn.primary { background: var(--c); border-color: hsl(var(--hue) 60% 40%); color: #fff; }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
.facts h3 { margin: 0 0 6px; font-size: .85rem; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-2); }
.facts ul { margin: 0; padding-left: 18px; }
.tags { list-style: none; padding: 0 !important; display: flex; flex-wrap: wrap; gap: 6px; }
.tags li { background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--ink); border-radius: 999px; padding: 3px 12px; font-size: .85rem; font-weight: 800; }
.clips { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.clip { margin: 0; background: var(--bg); border: 2px solid var(--line); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; }
.clip video { width: 100%; aspect-ratio: 16 / 9; object-fit: contain; background: #000; display: block; }
.clip.phone video { aspect-ratio: 16 / 9; }
.clip figcaption { padding: 10px 14px 12px; display: flex; flex-direction: column; gap: 2px; }
.clip figcaption span { color: var(--ink-2); font-size: .9rem; }
.clip small { color: var(--ink-2); font-weight: 800; margin-top: 4px; }
.clip a { color: var(--accent); }
footer { margin-top: 40px; color: var(--ink-2); font-size: .9rem; }
@media (max-width: 700px) { .facts { grid-template-columns: 1fr; } .game { padding: 18px; } .clips { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
  <section class="hero">
    <h1>Juegos para aprender matemáticas</h1>
    <p>Colección de juegos creados con IA (Claude y Google AI Studio) para estudiar el potencial de la gamificación digital en la enseñanza de las matemáticas. Cada juego se puede jugar en el navegador y cada mecánica tiene un clip de prueba grabado automáticamente.</p>
    <div class="stats"><div><b>${games.length}</b><span>juegos</span></div><div><b>${total}</b><span>clips de prueba</span></div><div><b>${new Set(games.flatMap(g => g.gamificacion)).size}</b><span>elementos de gamificación</span></div></div>
    <nav class="toc" aria-label="Juegos">${games.map(g => `<a href="#${g.id}">${esc(g.titulo)}</a>`).join('')}</nav>
  </section>
${cards}
  <footer>Los clips se generan con <code>npm run grabar</code> (Playwright + ffmpeg) y esta página con <code>npm run galeria</code>.</footer>
</main>
<script>
// Los clips se reproducen solos al verse en pantalla (silenciados) y se pausan al salir.
const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { threshold: .6 });
document.querySelectorAll('video').forEach(v => io.observe(v));
</script>
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
