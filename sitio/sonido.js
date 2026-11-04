// Música y efectos de la historia. Todo se sintetiza con Web Audio: no hay archivos de sonido.
// Cada mundo tiene su tema, siempre sobre el mismo motivo de Cero, y sus efectos van atados al scroll.
(function () {
  const frec = m => 440 * Math.pow(2, (m - 69) / 12);
  const ESCALA = { mayor: [0, 2, 4, 5, 7, 9, 11], menor: [0, 2, 3, 5, 7, 8, 10], armonica: [0, 2, 3, 5, 7, 8, 11], lidia: [0, 2, 4, 6, 7, 9, 11] };
  const _ = null;
  // El motivo de Cero: dos compases que reaparecen en todos los mundos.
  const MOTIVO = [0, _, _, _, 2, _, 4, _, 3, _, _, 2, 0, _, _, _, 4, _, _, _, 5, _, 4, _, 2, _, _, _, _, _, _, _];
  const ARP = { sube: [0, _, 1, _, 2, _, 3, _, 2, _, 1, _, 2, _, 1, _], corre: [0, 2, 1, 2, 3, 2, 1, 2, 0, 2, 1, 2, 3, 2, 1, 2], salta: [0, _, _, 2, _, _, 1, _, 3, _, _, 2, _, _, 1, _], lento: [0, _, _, _, 2, _, _, _, 3, _, _, _, 1, _, _, _] };
  const BAT = {
    suave: { k: [0, 8], s: [], h: [4, 12] },
    paso: { k: [0, 8], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
    club: { k: [0, 4, 8, 12], s: [4, 12], h: [2, 6, 10, 14] },
    tenso: { k: [0, 3, 6, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
    fabrica: { k: [0, 6, 8, 11], s: [4, 12, 15], h: [1, 3, 5, 7, 9, 11, 13, 15] },
  };
  const TEMAS = {
    prologo: { bpm: 76, raiz: 57, escala: 'menor', acordes: [0, 5, 3, 4], lead: 'piano', arp: 'lento', voz: 'piano', bat: 'suave', amb: { tipo: 'highpass', f: 2600, g: 0.03 } },
    'pizza-fraccionaria': { bpm: 126, raiz: 60, escala: 'mayor', acordes: [0, 3, 4, 0], lead: 'marimba', arp: 'salta', voz: 'marimba', bat: 'paso' },
    'coco-conjuntos': { bpm: 108, raiz: 53, escala: 'mayor', acordes: [0, 4, 5, 3], lead: 'campana', arp: 'sube', voz: 'pulso', bat: 'suave', amb: { tipo: 'lowpass', f: 650, g: 0.07, ola: 0.12 } },
    'laberinto-radian': { bpm: 80, raiz: 50, escala: 'armonica', acordes: [0, 5, 0, 4], lead: 'campana', arp: 'lento', voz: 'campana', amb: { tipo: 'lowpass', f: 240, g: 0.1, ola: 0.08 } },
    'puente-de-cristal': { bpm: 138, raiz: 52, escala: 'menor', acordes: [0, 5, 2, 4], lead: 'cuadrada', arp: 'corre', voz: 'pulso', bat: 'tenso', amb: { tipo: 'bandpass', f: 620, g: 0.09, ola: 0.2 } },
    mathrally: { bpm: 122, raiz: 55, escala: 'lidia', acordes: [0, 1, 5, 4], lead: 'pulso', arp: 'corre', voz: 'cuadrada', bat: 'paso' },
    'sudoku-academy': { bpm: 130, raiz: 48, escala: 'menor', acordes: [0, 0, 5, 4], lead: 'piano', arp: 'salta', voz: 'pulso', bat: 'tenso' },
    residuo: { bpm: 92, raiz: 51, escala: 'mayor', acordes: [0, 5, 3, 4], lead: 'campana', arp: 'sube', voz: 'piano', bat: 'suave', amb: { tipo: 'bandpass', f: 420, g: 0.05, ola: 0.1 } },
    'portero-algebraico': { bpm: 120, raiz: 45, escala: 'menor', acordes: [0, 0, 5, 3], lead: 'pulso', arp: 'salta', voz: 'cuadrada', bat: 'club' },
    'algebra-engine': { bpm: 134, raiz: 50, escala: 'menor', acordes: [0, 3, 5, 4], lead: 'cuadrada', arp: 'corre', voz: 'cuadrada', bat: 'fabrica', amb: { tipo: 'lowpass', f: 130, g: 0.15 } },
    final: { bpm: 104, raiz: 60, escala: 'mayor', acordes: [0, 3, 4, 0], lead: 'piano', arp: 'sube', voz: 'campana', bat: 'paso' },
  };
  // Capas de música según el avance: 0 solo acordes, 1 con arpegio y bajo, 2 con batería, 3 con motivo.
  const TRAMOS = {
    prologo: [[0, 1], [0.24, 2], [0.47, 0], [0.68, 1], [0.86, 3]],
    residuo: [[0, 0], [0.14, 1], [0.42, 3]],
    'laberinto-radian': [[0, 0], [0.33, 1], [0.53, 3]],
    final: [[0, 0], [0.22, 1], [0.4, 3]],
  };
  const TRAMO_BASE = [[0, 1], [0.14, 2], [0.5, 3]];
  const nivelDe = (id, u) => { let n = 0; for (const t of TRAMOS[id] || TRAMO_BASE) if (u >= t[0]) n = t[1]; return n; };

  // Momentos exactos de cada escena: [avance, efecto, parámetro]. Coinciden con escenas.js.
  const entrada = [[0.022, 'barrido'], [0.05, 'golpe', 0.7]];
  const salida = [[0.972, 'barrido']];
  const CUES = {
    prologo: [[0.77, 'campana', 0], [0.782, 'campana', 2], [0.794, 'campana', 4], [0.806, 'campana', 5], [0.818, 'campana', 7], [0.83, 'campana', 9], [0.842, 'campana', 11], [0.854, 'campana', 12], [0.895, 'golpe', 1], [0.895, 'acorde', 0]],
    'pizza-fraccionaria': [[0.255, 'golpe', 0.8], [0.27, 'corte'], [0.292, 'corte'], [0.314, 'corte'], [0.336, 'corte'], [0.38, 'estallido'], [0.53, 'premio'], [0.56, 'sello']],
    'coco-conjuntos': [[0.24, 'pop', 0], [0.33, 'pop', 4], [0.41, 'pop', 7], [0.49, 'pop', 12], [0.51, 'premio']],
    'laberinto-radian': [[0.33, 'brillo'], [0.42, 'estira'], [0.53, 'premio']],
    'puente-de-cristal': [[0.14, 'salto'], [0.203, 'salto'], [0.267, 'salto'], [0.33, 'cristal'], [0.34, 'caida'], [0.46, 'salto'], [0.493, 'salto'], [0.527, 'salto'], [0.56, 'premio']],
    mathrally: [[0.16, 'blip', 12], [0.2, 'blip', 16], [0.39, 'flecha', 0], [0.427, 'flecha', 4], [0.459, 'flecha', 7], [0.491, 'flecha', 1], [0.514, 'error'], [0.56, 'premio']],
    'sudoku-academy': [[0.1, 'golpe', 0.6], [0.367, 'tacha'], [0.381, 'tacha'], [0.402, 'tacha'], [0.416, 'tacha'], [0.43, 'tacha'], [0.444, 'tacha'], [0.465, 'tacha'], [0.486, 'tacha'], [0.5, 'golpe', 1], [0.5, 'acorde', 0]],
    residuo: [[0.1, 'golpe', 0.5], [0.24, 'tic', 0], [0.3, 'tic', 2], [0.36, 'tic', 4], [0.42, 'golpe', 1.2], [0.42, 'acorde', 0], [0.47, 'brillo']],
    'portero-algebraico': [[0.27, 'sello'], [0.42, 'golpe', 0.6], [0.46, 'puerta']],
    'algebra-engine': [[0.13, 'palanca'], [0.255, 'caja'], [0.32, 'caja'], [0.384, 'caja'], [0.44, 'golpe', 1.2], [0.44, 'acorde', 0]],
    final: [[0.4, 'golpe', 1.2], [0.4, 'acorde', 0], [0.5, 'premio'], [0.56, 'premio']],
  };
  const cuesDe = id => (id === 'prologo' ? CUES[id].concat(salida) : id === 'final' ? entrada.concat(CUES[id]) : entrada.concat(CUES[id], salida)).sort((a, b) => a[0] - b[0]);

  // El motor recibe el contexto, para poder probarlo también sin altavoces (OfflineAudioContext).
  K.crearSonido = ctx => {
    const limite = ctx.createDynamicsCompressor();
    limite.threshold.value = -12; limite.ratio.value = 10; limite.attack.value = 0.004; limite.release.value = 0.2;
    const salidaG = ctx.createGain(); salidaG.gain.value = 0.8;
    const seguro = ctx.createWaveShaper();
    const curva = new Float32Array(2049);
    // Lineal hasta 0,7; por encima se curva suave, sin subir el volumen general.
    for (let i = 0; i < 2049; i++) { const x = (i - 1024) / 1024, v = Math.abs(x); curva[i] = Math.sign(x) * (v <= 0.7 ? v : 0.7 + 0.3 * Math.tanh((v - 0.7) / 0.3)); }
    seguro.curve = curva; seguro.oversample = '2x';
    limite.connect(salidaG); salidaG.connect(seguro); seguro.connect(ctx.destination);
    const musica = ctx.createGain(); musica.gain.value = 0.62; musica.connect(limite);
    const efectos = ctx.createGain(); efectos.gain.value = 0.9; efectos.connect(limite);
    // Eco corto para dar aire a la música y a los efectos
    const eco = ctx.createDelay(1); eco.delayTime.value = 0.27;
    const ecoV = ctx.createGain(); ecoV.gain.value = 0.27;
    const ecoS = ctx.createGain(); ecoS.gain.value = 0.2;
    eco.connect(ecoV); ecoV.connect(eco); eco.connect(ecoS); ecoS.connect(limite);
    const envioEco = ctx.createGain(); envioEco.gain.value = 1; envioEco.connect(eco);

    const largo = ctx.sampleRate * 2, ruidoBuf = ctx.createBuffer(1, largo, ctx.sampleRate);
    { const d = ruidoBuf.getChannelData(0); for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1; }

    function env(g, t, ataque, pico, dur) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(pico, t + ataque);
      g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + dur);
    }
    function osc(tipo, f, t, fin, destino) {
      const o = ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f, t);
      o.connect(destino); o.start(t); o.stop(fin + 0.02); return o;
    }
    function ruido(t, dur, tipo, f, pico, fFin, destino = efectos, ataque = 0.002) {
      const s = ctx.createBufferSource(); s.buffer = ruidoBuf; s.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.setValueAtTime(f, t); fl.Q.value = 0.9;
      if (fFin) fl.frequency.exponentialRampToValueAtTime(fFin, t + dur);
      const g = ctx.createGain(); env(g, t, ataque, pico, dur);
      s.connect(fl); fl.connect(g); g.connect(destino);
      s.start(t, Math.random()); s.stop(t + dur + ataque + 0.03);
    }

    // Instrumentos
    function nota(tipo, m, t, dur, vel = 1, destino = musica) {
      const f = frec(m), g = ctx.createGain();
      g.connect(destino);
      if (tipo === 'piano') {
        env(g, t, 0.004, 0.3 * vel, dur + 0.5); osc('triangle', f, t, t + dur + 0.6, g);
        const a = ctx.createGain(); a.gain.value = 0.3; a.connect(g); osc('sine', f * 2, t, t + 0.5, a);
        const b = ctx.createGain(); b.gain.value = 0.1; b.connect(g); osc('sine', f * 4.01, t, t + 0.2, b);
        g.connect(envioEco);
      } else if (tipo === 'marimba') {
        env(g, t, 0.002, 0.36 * vel, 0.26); osc('sine', f, t, t + 0.32, g);
        const a = ctx.createGain(); a.gain.setValueAtTime(0.4, t); a.gain.exponentialRampToValueAtTime(0.001, t + 0.07); a.connect(g); osc('sine', f * 4, t, t + 0.1, a);
      } else if (tipo === 'campana') {
        env(g, t, 0.002, 0.2 * vel, dur + 1.1); osc('sine', f, t, t + dur + 1.2, g);
        const a = ctx.createGain(); a.gain.setValueAtTime(0.45, t); a.gain.exponentialRampToValueAtTime(0.001, t + 0.7); a.connect(g); osc('sine', f * 2.76, t, t + 0.75, a);
        g.connect(envioEco);
      } else if (tipo === 'pulso' || tipo === 'cuadrada') {
        const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 3;
        fl.frequency.setValueAtTime(Math.min(7000, f * 7), t); fl.frequency.exponentialRampToValueAtTime(Math.max(180, f * 1.4), t + 0.2);
        env(g, t, 0.004, (tipo === 'pulso' ? 0.17 : 0.11) * vel, dur + 0.05); fl.connect(g);
        osc(tipo === 'pulso' ? 'sawtooth' : 'square', f, t, t + dur + 0.1, fl);
        const v = osc(tipo === 'pulso' ? 'sawtooth' : 'square', f, t, t + dur + 0.1, fl); v.detune.value = 8;
      } else if (tipo === 'bajo') {
        const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 480; fl.connect(g);
        env(g, t, 0.006, 0.34 * vel, dur + 0.04); osc('triangle', f, t, t + dur + 0.1, fl); osc('square', f, t, t + dur + 0.1, fl).detune.value = 4;
      } else if (tipo === 'colchon') {
        const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 900; fl.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07 * vel, t + dur * 0.3); g.gain.setValueAtTime(0.07 * vel, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.08);
        osc('sawtooth', f, t, t + dur * 1.1, fl).detune.value = -7; osc('sawtooth', f, t, t + dur * 1.1, fl).detune.value = 7;
      }
    }
    function bombo(t, v = 1, destino = musica) {
      const g = ctx.createGain(); env(g, t, 0.002, 0.62 * v, 0.2); g.connect(destino);
      const o = osc('sine', 130, t, t + 0.26, g); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    }
    const caja = (t, v = 1) => { ruido(t, 0.12, 'bandpass', 1900, 0.32 * v, 0, musica); const g = ctx.createGain(); env(g, t, 0.001, 0.16 * v, 0.08); g.connect(musica); osc('triangle', 210, t, t + 0.1, g); };
    const plato = (t, v = 1) => ruido(t, 0.035, 'highpass', 7600, 0.1 * v, 0, musica);

    // Efectos
    const FX = {
      golpe(t, f = 1) {
        bombo(t, 1.1 * f, efectos); ruido(t, 0.3, 'lowpass', 3200, 0.42 * f, 160);
        const g = ctx.createGain(); env(g, t, 0.003, 0.45 * f, 0.5); g.connect(efectos);
        const o = osc('triangle', 92, t, t + 0.55, g); o.frequency.exponentialRampToValueAtTime(34, t + 0.45);
      },
      barrido: t => ruido(t, 0.38, 'bandpass', 500, 0.26, 5200, efectos, 0.14),
      corte: t => { ruido(t, 0.13, 'bandpass', 2400, 0.34, 8200); ruido(t + 0.1, 0.05, 'highpass', 5000, 0.14); },
      estallido: t => { bombo(t, 0.9, efectos); ruido(t, 0.34, 'bandpass', 1300, 0.36, 260); [0, 4, 7].forEach((d, i) => nota('marimba', 72 + d, t + 0.04 + i * 0.05, 0.2, 0.7, efectos)); },
      pop(t, d = 0) {
        const g = ctx.createGain(); env(g, t, 0.002, 0.42, 0.2); g.connect(efectos);
        const o = osc('sine', frec(62 + d), t, t + 0.26, g); o.frequency.exponentialRampToValueAtTime(frec(79 + d), t + 0.1);
        FX.brillo(t + 0.05, 0.5);
      },
      premio: t => [0, 4, 7, 12].forEach((d, i) => nota('campana', 76 + d, t + i * 0.07, 0.2, 0.9, efectos)),
      campana: (t, d = 0) => nota('campana', 72 + d, t, 0.5, 1, efectos),
      brillo(t, v = 1) { for (let i = 0; i < 6; i++) nota('campana', 84 + [0, 3, 7, 10, 12, 15][i], t + i * 0.035, 0.08, 0.5 * v, efectos); },
      estira: t => { const g = ctx.createGain(); env(g, t, 0.05, 0.13, 0.7); g.connect(efectos); const o = osc('sawtooth', 110, t, t + 0.8, g); o.frequency.exponentialRampToValueAtTime(440, t + 0.7); },
      salto: t => { const g = ctx.createGain(); env(g, t, 0.003, 0.2, 0.2); g.connect(efectos); const o = osc('square', 300, t, t + 0.24, g); o.frequency.exponentialRampToValueAtTime(860, t + 0.16); },
      cristal(t) {
        ruido(t, 0.5, 'highpass', 3800, 0.42, 9000);
        for (let i = 0; i < 12; i++) nota('campana', 86 + Math.floor(Math.random() * 20), t + i * 0.022 + Math.random() * 0.03, 0.06, 0.6, efectos);
        bombo(t, 0.7, efectos);
      },
      caida: t => { const g = ctx.createGain(); env(g, t, 0.05, 0.2, 1.2); g.connect(efectos); const o = osc('triangle', 860, t, t + 1.3, g); o.frequency.exponentialRampToValueAtTime(70, t + 1.2); },
      blip: (t, d = 12) => nota('pulso', 69 + d, t, 0.07, 0.9, efectos),
      flecha: (t, d = 0) => { nota('marimba', 72 + d, t, 0.1, 1, efectos); ruido(t, 0.14, 'bandpass', 1200, 0.1, 4000); },
      error: t => { nota('cuadrada', 45, t, 0.2, 1.6, efectos); nota('cuadrada', 44, t + 0.16, 0.3, 1.6, efectos); },
      tacha: t => { ruido(t, 0.07, 'bandpass', 3000, 0.26, 1200); nota('marimba', 84, t, 0.05, 0.3, efectos); },
      tic: (t, d = 0) => { ruido(t, 0.03, 'bandpass', 4200, 0.3); nota('marimba', 72 + d, t, 0.1, 0.8, efectos); },
      sello: t => { bombo(t, 0.6, efectos); ruido(t, 0.09, 'lowpass', 1600, 0.36); },
      puerta: t => { ruido(t, 1.3, 'bandpass', 300, 0.2, 2600, efectos, 0.3); [0, 7, 12, 16].forEach(d => nota('colchon', 60 + d, t, 1.5, 2.1, efectos)); },
      palanca: t => { ruido(t, 0.05, 'bandpass', 2400, 0.34); ruido(t + 0.11, 0.08, 'lowpass', 800, 0.4); bombo(t + 0.11, 0.4, efectos); },
      caja: t => { ruido(t, 0.05, 'lowpass', 900, 0.3); nota('cuadrada', 57, t + 0.02, 0.06, 0.9, efectos); },
      acorde(t) { const r = estado.tema ? TEMAS[estado.tema].raiz + 12 : 60; const e = ESCALA[estado.tema ? TEMAS[estado.tema].escala : 'mayor']; [0, e[2], e[4], 12].forEach(d => { nota('piano', r + d, t, 1.3, 1, efectos); nota('colchon', r + d, t, 1.6, 2, efectos); }); },
    };

    // Secuenciador
    const estado = { tema: null, paso: 0, prox: 0, nivel: 1, pausa: false };
    const grado = (T, g, oct = 0) => {
      const e = ESCALA[T.escala], n = e.length, i = ((g % n) + n) % n;
      return T.raiz + e[i] + 12 * (Math.floor(g / n) + oct);
    };
    function tocarPaso(T, paso, t, seg) {
      const n = estado.nivel, c16 = paso % 16, comp = Math.floor(paso / 16) % T.acordes.length;
      const a = T.acordes[comp];
      const tono = i => grado(T, a + [0, 2, 4, 7][i], 1);
      if (c16 === 0) [0, 2, 4].forEach(i => nota('colchon', grado(T, a + i, 0), t, seg * 16, 1));
      if (n >= 1) {
        if (ARP[T.arp][c16] !== _) nota(T.voz, tono(ARP[T.arp][c16]), t, seg * 1.6, 0.62);
        if (T.bat && (c16 === 0 || c16 === 6 || c16 === 8 || (T.bpm > 115 && c16 === 14))) nota('bajo', grado(T, a, -1), t, seg * 1.8, 0.9);
        else if (!T.bat && c16 === 0) nota('bajo', grado(T, a, -1), t, seg * 8, 0.6);
      }
      if (n >= 2 && T.bat) {
        const B = BAT[T.bat];
        if (B.k.includes(c16)) bombo(t, 0.9);
        if (B.s.includes(c16)) caja(t);
        if (B.h.includes(c16)) plato(t, c16 % 4 === 2 ? 1 : 0.65);
      }
      if (n >= 3 || (n === 0 && T.lead === 'piano')) {
        const m = MOTIVO[paso % 32];
        if (m !== _) nota(T.lead, grado(T, m, 1), t, seg * 3, n >= 3 ? 1 : 0.8);
      }
    }
    function programar(hasta) {
      if (!estado.tema || estado.pausa) return;
      const T = TEMAS[estado.tema], seg = 60 / T.bpm / 4;
      if (estado.prox < ctx.currentTime) estado.prox = ctx.currentTime + 0.03;
      while (estado.prox < hasta) {
        tocarPaso(T, estado.paso, estado.prox, seg);
        const s = estado.paso % 2 ? 0.93 : 1.07; // leve swing, menos mecánico
        estado.prox += seg * s; estado.paso++;
      }
    }

    // Ambiente: ruido filtrado continuo (lluvia, olas, viento, zumbido) y viento ligado a la velocidad del scroll.
    const ambS = ctx.createBufferSource(); ambS.buffer = ruidoBuf; ambS.loop = true;
    const ambF = ctx.createBiquadFilter(); const ambG = ctx.createGain(); ambG.gain.value = 0;
    const ola = ctx.createGain(); ola.gain.value = 0; const lfo = ctx.createOscillator(); lfo.frequency.value = 0.14;
    lfo.connect(ola); ola.connect(ambG.gain); lfo.start();
    ambS.connect(ambF); ambF.connect(ambG); ambG.connect(limite); ambS.start();
    const vieS = ctx.createBufferSource(); vieS.buffer = ruidoBuf; vieS.loop = true;
    const vieF = ctx.createBiquadFilter(); vieF.type = 'bandpass'; vieF.frequency.value = 700; vieF.Q.value = 0.7;
    const vieG = ctx.createGain(); vieG.gain.value = 0;
    vieS.connect(vieF); vieF.connect(vieG); vieG.connect(limite); vieS.start();

    let vientoAct = 0, volAct = 1;
    return {
      estado, FX, salida: salidaG, musica, programar,
      cambiarTema(id) {
        if (estado.tema === id) return;
        const t = ctx.currentTime;
        estado.tema = id; estado.paso = 0; estado.prox = t + 0.28;
        musica.gain.cancelScheduledValues(t);
        musica.gain.setValueAtTime(0.0001, t + 0.02);
        musica.gain.linearRampToValueAtTime(0.62, t + 0.5);
        const a = TEMAS[id].amb;
        ambG.gain.cancelScheduledValues(t);
        ambG.gain.setTargetAtTime(a ? a.g : 0, t, 0.3);
        ola.gain.setTargetAtTime(a && a.ola ? a.g * 0.7 : 0, t, 0.3);
        if (a) { ambF.type = a.tipo; ambF.frequency.setTargetAtTime(a.f, t, 0.2); }
      },
      fijarNivel(id, u) { estado.nivel = nivelDe(id, u); },
      viento(v) {
        if (Math.abs(v - vientoAct) < 0.03) return;
        vientoAct = v;
        vieG.gain.setTargetAtTime(Math.min(0.11, v * 0.11), ctx.currentTime, 0.12); vieF.frequency.setTargetAtTime(500 + v * 1500, ctx.currentTime, 0.2);
      },
      volumen(v, s = 0.25) {
        if (v === volAct) return;
        volAct = v;
        salidaG.gain.cancelScheduledValues(ctx.currentTime); salidaG.gain.setTargetAtTime(v * 0.8, ctx.currentTime, s);
      },
    };
  };
  K.SONIDO_CUES = cuesDe;
  K.SONIDO_TEMAS = Object.keys(TEMAS);

  // Control desde la página: se enciende solo con un gesto de la persona.
  let ctx = null, motor = null, encendido = false, reloj = 0, previo = { id: null, u: 0 };
  const PREF = 'cero-sonido';
  const leer = () => { try { return localStorage.getItem(PREF); } catch { return null; } };
  const guardar = v => { try { localStorage.setItem(PREF, v); } catch { /* sin almacenamiento: no se recuerda */ } };
  const boton = () => document.querySelector('.sonido');
  function pintarBoton() {
    const b = boton(); if (!b) return;
    b.setAttribute('aria-pressed', String(encendido));
    b.querySelector('b').textContent = encendido ? 'Sonido: sí' : 'Activar sonido';
  }
  function encender() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC(); motor = K.crearSonido(ctx);
      reloj = setInterval(() => { if (encendido && ctx.state === 'running') motor.programar(ctx.currentTime + 0.25); }, 60);
    }
    ctx.resume();
    encendido = true; motor.volumen(1); pintarBoton(); guardar('1');
  }
  function apagar() {
    encendido = false; pintarBoton(); guardar('0');
    if (motor) { motor.volumen(0, 0.08); setTimeout(() => { if (!encendido) ctx.suspend(); }, 300); }
  }
  K.Sonido = {
    iniciar() {
      const b = boton(); if (!b) return;
      b.addEventListener('click', () => { b.classList.add('usado'); encendido ? apagar() : encender(); });
      // Si la persona lo dejó activado, vuelve con su primer gesto: el navegador no permite antes.
      if (leer() === '1') {
        b.classList.add('usado');
        const una = e => { if (!b.contains(e.target)) encender(); removeEventListener('pointerdown', una); removeEventListener('keydown', una); };
        addEventListener('pointerdown', una); addEventListener('keydown', una);
      }
      document.addEventListener('visibilitychange', () => { if (!ctx || !encendido) return; document.hidden ? ctx.suspend() : ctx.resume(); });
    },
    // Se llama en cada fotograma con el capítulo, el avance y la velocidad del scroll.
    avance(id, u, vel) {
      if (!encendido || !motor) { previo = { id, u }; return; }
      motor.estado.pausa = false; motor.cambiarTema(id); motor.fijarNivel(id, u); motor.viento(vel); motor.volumen(1);
      if (previo.id === id && u > previo.u && u - previo.u < 0.07) {
        for (const q of cuesDe(id)) if (q[0] > previo.u && q[0] <= u) motor.FX[q[1]](ctx.currentTime + 0.005, q[2]);
      }
      previo = { id, u };
    },
    silenciar() { if (encendido && motor) { motor.estado.pausa = true; motor.volumen(0, 0.5); motor.viento(0); } },
    get motor() { return motor; }, get ctx() { return ctx; },
  };
})();
