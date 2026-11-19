/* Ajedrez Academy · Tomo II (Táctica): partidas nuevas para que las lecciones no repitan siempre
   la Ópera, Lasker–Thomas, Réti–Tartakower o Légal. Jugadas tomadas de Wikipedia y comprobadas con
   chess.js y Stockfish; las notas son propias. Se enganchan en lecciones.js (window.AA_REPLACE). */
(function () {
  'use strict';
  var GAMES = window.AA_GAMES = window.AA_GAMES || [];
  GAMES.push(
    {
      id: 'bauer', white: 'Emanuel Lasker', black: 'Johann Bauer', year: 1889, event: 'Ámsterdam', title: 'El doble sacrificio de alfiles',
      pgn: '1.f4 d5 2.e3 Nf6 3.b3 e6 4.Bb2 Be7 5.Bd3 b6 6.Nc3 Bb7 7.Nf3 Nbd7 8.O-O O-O 9.Ne2 c5 10.Ng3 Qc7 11.Ne5 Nxe5 12.Bxe5 Qc6 13.Qe2 a6 14.Nh5 Nxh5 15.Bxh7+ Kxh7 16.Qxh5+ Kg8 17.Bxg7 Kxg7 18.Qg4+ Kh7 19.Rf3 e5 20.Rh3+ Qh6 21.Rxh6+ Kxh6 22.Qd7 Bf6 23.Qxb7 Kg7 24.Rf1 Rab8 25.Qd7 Rfd8 26.Qg4+ Kf8 27.fxe5 Bg7 28.e6 Rb7 29.Qg6 f6 30.Rxf6+ Bxf6 31.Qxf6+ Ke8 32.Qh8+ Ke7 33.Qg7+ Kxe6 34.Qxb7 Rd6 35.Qxa6 d4 36.exd4 cxd4 37.h4 d3 38.Qxd3 1-0',
      concepts: ['eliminar al defensor', 'sacrificio', 'ataque doble'],
      intro: 'El primer doble sacrificio de alfiles famoso: Lasker entrega los dos alfiles para dejar al rey negro sin peones delante y lo remata con un ataque doble de dama.',
      chronicle: ['Los dos alfiles blancos apuntaban al enroque negro. Tras 14.Ch5 Lasker entregó primero el de d3 en h7 y después el de b2 en g7: los dos peones que protegían al rey desaparecieron.',
        'Con el rey al descubierto, la torre llegó por la tercera fila y la dama terminó con 22.Dd7, que ataca a la vez los dos alfiles negros.'],
      notes: [
        { ply: 27, text: 'El caballo se ofrece para quitar de en medio al caballo de f6, el mejor defensor del rey negro.' },
        { ply: 29, text: '¡Primer alfil! Elimina el peón de h7, uno de los defensores del rey.' },
        { ply: 33, text: '¡Segundo alfil! Ahora cae el peón de g7: el rey negro se queda sin escudo.' },
        { ply: 37, text: 'La torre se suma por la tercera fila: amenaza llegar a h3 con mate.' },
        { ply: 41, text: 'Las negras tuvieron que interponer la dama en h6 para parar el mate, y la pierden.' },
        { ply: 43, text: '¡Ataque doble! La dama ataca a la vez los alfiles de e7 y b7, y uno de los dos cae.', arrows: ['d7e7', 'd7b7'] }
      ]
    },
    {
      id: 'uruguaya', white: 'B. Molinari', black: 'Luis Roux Cabral', year: 1943, event: 'Campeonato de Uruguay', title: 'La Inmortal uruguaya',
      pgn: '1.d4 Nf6 2.Nf3 d5 3.c4 c6 4.Nc3 Nbd7 5.e3 e6 6.Bd3 dxc4 7.Bxc4 b5 8.Bd3 a6 9.O-O c5 10.b3 Bb7 11.Qe2 Qb6 12.Rd1 Be7 13.a4 b4 14.Nb1 Rc8 15.Nbd2 cxd4 16.Nc4 Qa7 17.Nxd4 O-O 18.Bd2 a5 19.Nb5 Qa8 20.Nbd6 Bxg2 21.Nxc8 Rxc8 22.Re1 Bf3 23.Qf1 Qd5 24.e4 Rxc4 25.bxc4 Qh5 26.Bf4 Ng4 27.Be2 Nde5 28.h3 Bc5 29.Bg3 Nxf2 30.Bxf2 Qg5+ 31.Kh2 Qf4+ 32.Bg3 Bg1+ 33.Qxg1 Ng4+ 0-1',
      concepts: ['desviación', 'sacrificio', 'ataque al rey'],
      intro: 'Roux Cabral entrega torre, caballo y alfil para desviar a los defensores del rey blanco. En la posición final su dama y su caballo están atacados, pero el mate es imparable.',
      chronicle: ['Las negras rompieron el enroque blanco con 20...Axg2 y siguieron sumando piezas al ataque aunque costara material.',
        'El remate es una lección de desviación: 32...Ag1+!! obliga a la dama blanca a capturar y abandonar la defensa, y el caballo da el jaque decisivo.'],
      notes: [
        { ply: 40, text: 'Las negras abren el enroque blanco llevándose el peón de g2.' },
        { ply: 48, text: 'Torre por caballo: elimina una pieza que defendía y deja la diagonal libre.' },
        { ply: 58, text: 'El caballo se entrega en f2 para abrir las casillas oscuras alrededor del rey.' },
        { ply: 60, text: 'Jaque con la dama: el rey blanco empieza a quedarse sin casillas.' },
        { ply: 64, text: '¡Desviación! El alfil se ofrece en g1 para que la dama blanca abandone la defensa.' },
        { ply: 66, text: 'El caballo da jaque y la dama blanca, desviada a g1, ya no llega a defender. El mate es inevitable.' }
      ]
    },
    {
      id: 'tablas', white: 'Carl Hamppe', black: 'Philipp Meitner', year: 1872, event: 'Viena', title: 'La Inmortal tablas',
      pgn: '1.e4 e5 2.Nc3 Bc5 3.Na4 Bxf2+ 4.Kxf2 Qh4+ 5.Ke3 Qf4+ 6.Kd3 d5 7.Kc3 Qxe4 8.Kb3 Na6 9.a3 Qxa4+ 10.Kxa4 Nc5+ 11.Kb4 a5+ 12.Kxc5 Ne7 13.Bb5+ Kd8 14.Bc6 b6+ 15.Kb5 Nxc6 16.Kxc6 Bb7+ 17.Kb5 Ba6+ 18.Kc6 Bb7+ 1/2-1/2',
      concepts: ['atracción', 'caza del rey', 'jaque perpetuo'],
      intro: 'Las negras sacrifican alfil y dama para atraer al rey blanco hasta c6, en el campo contrario. Con medio ejército de menos, salvan la partida con un jaque perpetuo.',
      chronicle: ['3...Axf2+ sacó al rey blanco de casa y cada jaque lo empujó un poco más lejos.',
        'El sacrificio de dama 9...Dxa4+ es teóricamente incorrecto, pero en la práctica es muy difícil de refutar: el rey acaba en c5 y luego en c6, rodeado de piezas negras, y la partida termina en tablas por jaque continuo.'],
      notes: [
        { ply: 6, text: '¡Alfil por peón! Atrae al rey blanco fuera de su casa.' },
        { ply: 18, text: '¡La dama! Atrae al rey a a4. Objetivamente las blancas podían ganar, pero el rey queda en medio del tablero.' },
        { ply: 20, text: 'Jaque con ganancia de tiempo: el rey tiene que seguir subiendo.' },
        { ply: 22, text: 'Otra atracción: el peón se ofrece para que el rey vaya a c5.' },
        { ply: 28, text: 'Más jaques: el rey blanco ya está en la quinta fila, rodeado de piezas negras.' },
        { ply: 36, text: 'El rey blanco no puede escapar de los jaques del alfil: tablas por jaque perpetuo.' }
      ]
    },
    {
      id: 'anand', white: 'Levon Aronian', black: 'Viswanathan Anand', year: 2013, event: 'Wijk aan Zee', title: 'La Inmortal de Anand',
      pgn: '1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 e6 5.e3 Nbd7 6.Bd3 dxc4 7.Bxc4 b5 8.Bd3 Bd6 9.O-O O-O 10.Qc2 Bb7 11.a3 Rc8 12.Ng5 c5 13.Nxh7 Ng4 14.f4 cxd4 15.exd4 Bc5 16.Be2 Nde5 17.Bxg4 Bxd4+ 18.Kh1 Nxg4 19.Nxf8 f5 20.Ng6 Qf6 21.h3 Qxg6 22.Qe2 Qh5 23.Qd3 Be3 0-1',
      concepts: ['cálculo', 'sacrificio', 'interferencia'],
      intro: 'Anand calcula una serie de sacrificios en la que cada jugada crea una amenaza nueva. La última, 23...Ae3!!, corta la defensa blanca y Aronian abandona.',
      chronicle: ['Con 12...c5 Anand entregó el peón de h7 y empezó a jugar con amenazas: 15...Ac5 deja un peón y también la torre de f8.',
        'Cada sacrificio estaba calculado hasta una posición clara. El final 23...Ae3!! interrumpe la defensa de la dama blanca y no hay manera de evitar ...Dxh3+.'],
      notes: [
        { ply: 30, text: 'Primer sacrificio: el alfil se coloca en la diagonal del rey blanco aunque deja material colgando.' },
        { ply: 34, text: 'Jaque que gana tiempo: el rey blanco tiene que esconderse en h1.' },
        { ply: 42, text: 'La dama negra se lleva el caballo y se acerca al rey blanco.' },
        { ply: 46, text: '¡Interferencia! El alfil corta la defensa de la dama blanca: ...Dxh3+ ya no se puede parar.' }
      ]
    },
    {
      id: 'perdedora', white: 'Bogdan Śliwa', black: 'David Bronstein', year: 1957, event: 'Gotha', title: 'La Inmortal perdedora',
      pgn: '1.d4 f5 2.g3 g6 3.Bg2 Bg7 4.Nc3 Nf6 5.Bg5 Nc6 6.Qd2 d6 7.h4 e6 8.O-O-O h6 9.Bf4 Bd7 10.e4 fxe4 11.Nxe4 Nd5 12.Ne2 Qe7 13.c4 Nb6 14.c5 dxc5 15.Bxc7 O-O 16.Bd6 Qf7 17.Bxf8 Rxf8 18.dxc5 Nd5 19.f4 Rd8 20.N2c3 Ndb4 21.Nd6 Qf8 22.Nxb7 Nd4 23.Nxd8 Bb5 24.Nxe6 Bd3 25.Bd5 Qf5 26.Nxd4+ Qxd5 27.Nc2 Bxc3 28.bxc3 Qxa2 29.cxb4 1-0',
      concepts: ['pincho', 'defensa activa'],
      intro: 'Bronstein perdió, pero llenó la partida de trampas. Las blancas ganaron la calidad con un pincho y supieron esquivar todas las celadas.',
      chronicle: ['16.Ad6 ataca a la dama negra; cuando se aparta, la torre de f8 queda a tiro. Es un pincho de libro.',
        'Con material de menos, Bronstein buscó complicaciones en cada jugada. Śliwa encontró siempre la defensa correcta.'],
      notes: [
        { ply: 31, text: '¡Pincho! El alfil ataca a la dama de e7; al apartarse, la torre de f8 queda indefensa.', arrows: ['d6e7', 'd6f8'] },
        { ply: 33, text: 'Las blancas cobran: alfil por torre, la calidad.' },
        { ply: 50, text: 'Bronstein no se rinde y sigue creando amenazas contra el rey blanco.' }
      ]
    }
  );

  var R = window.AA_REPLACE = window.AA_REPLACE || {};
  function swap(steps, fn) { var out = []; steps.forEach(function (s, i) { var r = fn(s, i); if (r === undefined) out.push(s); else if (r) out.push.apply(out, [].concat(r)); }); return out; }
  R['ataque-doble'] = function (st) { return swap(st, function (s) {
    if (s.t === 'game' && s.game === 'opera') return [
      { t: 'game', game: 'bauer', from: 36, to: 42, text: 'Lasker–Bauer: tras sacrificar los dos alfiles, Lasker persigue al rey negro y gana la dama.' },
      { t: 'guess', game: 'bauer', ply: 43, text: 'Lasker con blancas: la dama puede atacar dos piezas negras a la vez. ¿Dónde?', why: 'Desde d7 la dama ataca los alfiles de e7 y b7: uno de los dos cae.' }]; }); };
  R.defensor = function (st) { return swap(st, function (s) {
    if (s.t === 'game' && s.game === 'opera') return [
      { t: 'game', game: 'bauer', from: 22, to: 28, text: 'Lasker–Bauer: los dos alfiles blancos apuntan al enroque. Primero se elimina al caballo de f6.' },
      { t: 'guess', game: 'bauer', ply: 29, text: 'Lasker: el peón de h7 protege al rey negro. Elimínalo.', why: 'El alfil se entrega en h7: el rey pierde uno de sus peones defensores.' }];
    if (s.t === 'guess' && s.game === 'opera') return { t: 'guess', game: 'bauer', ply: 33, text: 'Lasker: queda otro peón defendiendo al rey. Elimínalo también.', why: 'El segundo alfil cae en g7: el rey negro se queda sin escudo de peones.' }; }); };
  R.desviacion = function (st) { return swap(st, function (s) {
    if (s.t === 'game' && s.game === 'opera') return { t: 'game', game: 'uruguaya', from: 50, to: 63, text: 'La Inmortal uruguaya: las negras sacrifican pieza tras pieza contra el rey blanco.' };
    if (s.t === 'guess' && s.game === 'botvinnik-capablanca') return { t: 'guess', game: 'uruguaya', ply: 64, text: 'Roux Cabral con negras: aparta a la dama blanca de la defensa de su rey con un sacrificio.', why: 'El alfil se ofrece en g1: si la dama lo captura, deja de vigilar y el caballo entra con jaque.' }; }); };
  R.atraccion = function (st) { return swap(st, function (s) {
    if (s.t === 'show' && /Réti–Tartakower/.test(s.text || '')) return Object.assign({}, s, { text: 'ATRACCIÓN: un sacrificio obliga a una pieza (a menudo el rey) a ir a la casilla donde recibirá el golpe. En la Inmortal tablas, las negras entregan alfil y dama para atraer al rey blanco hasta c6.' });
    if (s.t === 'guess' && s.game === 'reti-tartakower') return [
      { t: 'game', game: 'tablas', from: 4, to: 21, text: 'La Inmortal tablas: las negras entregan alfil y dama para atraer al rey blanco al centro del tablero.' },
      { t: 'guess', game: 'tablas', ply: 22, text: 'Meitner con negras: atrae al rey blanco una casilla más con un peón.', why: 'El peón se ofrece con jaque: si el rey lo captura, se mete aún más en el campo negro.' }]; }); };
  R.calculo = function (st) { var n = 0; return swap(st, function (s) {
    if (s.t === 'show' && /Rubinstein/.test(s.text || '')) return Object.assign({}, s, { text: 'CALCULAR es ver las jugadas forzadas (jaques, capturas, amenazas) hasta una posición que sabes evaluar. Anand entregó peón, torre y alfil contra Aronian porque había visto el final de cada línea.' });
    if (s.t === 'guess' && s.game === 'rotlewi-rubinstein') { n++;
      if (n === 1) return { t: 'guess', game: 'anand', ply: 30, text: 'Anand con negras: lleva el alfil a la diagonal del rey blanco aunque deje material colgando.', why: 'El alfil en c5 apunta a g1. Anand ha calculado que las amenazas valen más que la torre.' };
      if (n === 2) return { t: 'guess', game: 'anand', ply: 34, text: 'Anand: da un jaque que gana tiempo.', why: 'El jaque obliga al rey a ir a h1 y las negras recuperan material con amenazas.' };
      return { t: 'guess', game: 'anand', ply: 46, text: 'El golpe final de Anand: corta la defensa blanca.', why: 'El alfil interfiere entre la dama blanca y h3: ...Dxh3+ ya no se puede parar.' }; } }); };
  R.descubierta = function (st) { return swap(st, function (s) { if (s.t === 'guess' && s.game === 'lasker-thomas') return null; }); };
  R.clavada = function (st) { return swap(st, function (s) { if (s.t === 'game' && s.game === 'legal') return null; }); };
  R.pincho = function (st) { var done = false; return swap(st, function (s) {
    if (!done && s.t === 'task') { done = true; return [s,
      { t: 'game', game: 'perdedora', from: 26, to: 30, text: 'Śliwa–Bronstein: la dama negra y la torre de f8 están en la misma diagonal.' },
      { t: 'guess', game: 'perdedora', ply: 31, text: 'Śliwa con blancas: ataca a la dama de modo que, al apartarse, quede algo detrás.', why: 'El alfil ataca la dama; cuando se mueve, la torre de f8 queda a tiro: pincho.' }]; } }); };
})();
