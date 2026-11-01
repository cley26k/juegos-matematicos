// Graba clips cortos de cada juego (uno por mecánica) y los exporta a MP4 + póster.
// Uso: node scripts/grabar.cjs [juego] [clip]   (sirve el repo en http://localhost:5190 con `npm run serve`)
const { chromium } = require('playwright');
const ffmpeg = require('ffmpeg-static');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:5190/juegos/';
const OUT = path.join(__dirname, '..', 'videos');
const TMP = path.join(__dirname, '..', '.tmp', 'rec');
const VIEWPORTS = { d: { width: 1280, height: 720 }, m: { width: 390, height: 844 } };
const [onlyGame, onlyClip] = process.argv.slice(2);

function videoSeconds(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-i', file], { stdio: 'pipe' }); } catch (e) { out = String(e.stderr); }
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(out);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
}

const GAMES = fs.readdirSync(path.join(__dirname, 'clips')).filter(f => f.endsWith('.cjs')).map(f => f.replace('.cjs', ''));

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const index = fs.existsSync(path.join(OUT, 'clips.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'clips.json'), 'utf8')) : {};
  for (const game of GAMES) {
    if (onlyGame && game !== onlyGame) continue;
    const def = require(`./clips/${game}.cjs`);
    for (const clip of def.clips) {
      if (onlyClip && clip.id !== onlyClip) continue;
      const vp = VIEWPORTS[clip.vp || 'd'];
      fs.mkdirSync(TMP, { recursive: true });
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, serviceWorkers: 'block', recordVideo: { dir: TMP, size: vp }, ...(def.context || {}) });
      if (def.init) await ctx.addInitScript(def.init);
      // Los juegos con base de datos en línea no deben escribir datos de prueba durante la grabación.
      for (const pat of def.bloquear || []) await ctx.route(pat, r => r.abort());
      // Algunos juegos guardan su estado en un cierre: se expone solo en la copia que se graba.
      if (def.parche) await ctx.route(def.parche.url, async r => { const res = await r.fetch(); r.fulfill({ response: res, body: def.parche.fn(await res.text()) }); });
      const pg = await ctx.newPage();
      const t0 = Date.now();
      let start = 0, end = 0;
      const mark = () => { start = (Date.now() - t0) / 1000; };
      const stop = () => { end = (Date.now() - t0) / 1000; };
      process.stdout.write(`${game}/${clip.id} … `);
      try {
        await pg.goto(BASE + game + '/' + (def.query || ''), { waitUntil: 'load' });
        await clip.run(pg, mark, stop);
        if (!end) { await pg.waitForTimeout(600); stop(); }
      } catch (e) { console.log('ERROR', e.message); await ctx.close(); continue; }
      const video = await pg.video().path();
      const wall = (Date.now() - t0) / 1000;
      await ctx.close();
      // La grabación empieza algo después de abrir la página (más en las escenas 3D): se compensa ese retraso.
      const lag = Math.max(0, wall - videoSeconds(video));
      const dir = path.join(OUT, game); fs.mkdirSync(dir, { recursive: true });
      const mp4 = path.join(dir, `${clip.id}.mp4`), jpg = path.join(dir, `${clip.id}.jpg`);
      const dur = Math.max(1, end - start);
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(Math.max(0, start - lag)), '-i', video, '-t', String(dur), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(Math.min(dur - .2, clip.poster ?? dur * .6)), '-i', mp4, '-frames:v', '1', '-q:v', '3', jpg]);
      fs.rmSync(video, { force: true });
      index[game] = index[game] || { titulo: def.titulo, clips: {} };
      index[game].titulo = def.titulo;
      index[game].clips[clip.id] = { titulo: clip.titulo, mecanica: clip.mecanica, vp: clip.vp || 'd', segundos: Math.round(dur) };
      console.log(`${dur.toFixed(1)} s (retraso ${lag.toFixed(1)} s)`);
    }
  }
  fs.writeFileSync(path.join(OUT, 'clips.json'), JSON.stringify(index, null, 2));
  await browser.close();
})();
