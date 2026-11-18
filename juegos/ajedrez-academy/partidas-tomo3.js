/* Ajedrez Academy · Tomo III (Estrategia): partidas nuevas para que las lecciones no repitan
   siempre las mismas partidas famosas. Jugadas tomadas de Wikipedia y comprobadas con chess.js y
   Stockfish; las notas son propias. Se enganchan en lecciones.js (window.AA_REPLACE). */
(function () {
  'use strict';
  var GAMES = window.AA_GAMES = window.AA_GAMES || [];
  GAMES.push(
    {
      id: 'peruana', white: 'Esteban Canal', black: 'NN', year: 1934, event: 'Budapest, simultáneas', title: 'La Inmortal peruana',
      pgn: '1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.d4 c6 5.Nf3 Bg4 6.Bf4 e6 7.h3 Bxf3 8.Qxf3 Bb4 9.Be2 Nd7 10.a3 O-O-O 11.axb4 Qxa1+ 12.Kd2 Qxh1 13.Qxc6+ bxc6 14.Ba6# 1-0',
      concepts: ['desarrollo', 'dama temprana', 'seguridad del rey'],
      intro: 'Catorce jugadas que resumen los principios de la apertura: la dama que sale pronto pierde tiempos y el rey que se refugia en el lado equivocado no sobrevive.',
      chronicle: ['Las negras sacaron la dama en la segunda jugada y tuvieron que moverla otra vez enseguida: cada tiempo perdido fue una pieza blanca más en juego.',
        'Con el desarrollo terminado, Canal entregó primero una torre y después la dama para abrir las líneas hacia el rey negro, que acababa de enrocar largo hacia la columna c.'],
      notes: [
        { ply: 4, text: 'La dama sale en la segunda jugada. Recupera el peón, pero desde el centro será un blanco para las piezas blancas.' },
        { ply: 5, text: 'Desarrollo con tempo: el caballo sale atacando a la dama, que tiene que moverse otra vez.', arrows: ['c3d5'] },
        { ply: 7, text: 'Las blancas ocupan el centro con un peón. Cada jugada suya suma algo al juego.' },
        { ply: 11, text: 'Otra pieza activa. Las blancas ya tienen tres piezas desarrolladas; las negras, la dama y un alfil.' },
        { ply: 14, text: 'Cambiar el alfil por el caballo ayuda a la dama blanca a salir hacia f3 sin perder tiempo.' },
        { ply: 19, text: 'Las blancas preguntan al alfil. El flanco de rey negro sigue sin desarrollar y el rey sin enrocar.' },
        { ply: 20, text: 'Error decisivo: el rey se va al flanco de dama justo donde la dama blanca de f3 apunta a c6.' },
        { ply: 21, text: '¡Entregan la torre! Capturar el alfil abre la columna a y la dama negra se irá lejos de su rey.' },
        { ply: 24, text: 'La dama negra se lleva otra torre, pero está en la otra punta del tablero, lejos de su rey: ese es el problema.' },
        { ply: 25, text: '¡Sacrificio de dama! Abre la diagonal hacia c8.' },
        { ply: 27, text: 'Mate con dos alfiles: el de f4 cierra b8 y c7, y el de a6 da jaque. Ninguna pieza negra llega a tiempo.' }
      ]
    },
    {
      id: 'monedas', white: 'Stepan Levitsky', black: 'Frank Marshall', year: 1912, event: 'Breslavia', title: 'La partida de las monedas de oro',
      pgn: '1.d4 e6 2.e4 d5 3.Nc3 c5 4.Nf3 Nc6 5.exd5 exd5 6.Be2 Nf6 7.O-O Be7 8.Bg5 O-O 9.dxc5 Be6 10.Nd4 Bxc5 11.Nxe6 fxe6 12.Bg4 Qd6 13.Bh3 Rae8 14.Qd2 Bb4 15.Bxf6 Rxf6 16.Rad1 Qc5 17.Qe2 Bxc3 18.bxc3 Qxc3 19.Rxd5 Nd4 20.Qh5 Ref8 21.Re5 Rh6 22.Qg5 Rxh3 23.Rc5 Qg3 0-1',
      concepts: ['iniciativa', 'columnas abiertas', 'ataque al rey'],
      intro: 'Marshall convierte la columna f abierta y sus piezas activas en un ataque imparable. La leyenda dice que el público lanzó monedas de oro al tablero tras 23...Dg3.',
      chronicle: ['Tras 11...fxe6 las negras quedaron con la columna f abierta y todas sus piezas apuntando al flanco de rey.',
        'Marshall jugó cada jugada con una amenaza: el rival nunca tuvo tiempo de organizar la defensa, y el remate 23...Dg3 deja tres capturas posibles y ninguna salva a las blancas.'],
      notes: [
        { ply: 22, text: 'Recapturar hacia el centro abre la columna f para las torres negras.' },
        { ply: 40, text: 'La última torre entra al ataque por la columna f. Todas las piezas negras participan.' },
        { ply: 44, text: '¡Torre por alfil! Elimina un defensor del rey blanco con amenaza.' },
        { ply: 46, text: '¡La dama se ofrece en g3! Si hxg3, Ce2 es mate; si fxg3, Ce2+ y mate; si Dxg3, Ce2+ gana.' }
      ]
    },
    {
      id: 'polaca', white: 'Glücksberg', black: 'Miguel Najdorf', year: 1929, event: 'Varsovia', title: 'La Inmortal polaca',
      pgn: '1.d4 f5 2.c4 Nf6 3.Nc3 e6 4.Nf3 d5 5.e3 c6 6.Bd3 Bd6 7.O-O O-O 8.Ne2 Nbd7 9.Ng5 Bxh2+ 10.Kh1 Ng4 11.f4 Qe8 12.g3 Qh5 13.Kg2 Bg1 14.Nxg1 Qh2+ 15.Kf3 e5 16.dxe5 Ndxe5+ 17.fxe5 Nxe5+ 18.Kf4 Ng6+ 19.Kf3 f4 20.exf4 Bg4+ 21.Kxg4 Ne5+ 22.fxe5 h5# 0-1',
      concepts: ['seguridad del rey', 'sacrificio', 'caza del rey'],
      intro: 'Najdorf sacrifica las cuatro piezas menores para sacar al rey blanco de su refugio y le da mate con un peón.',
      chronicle: ['9.Cg5 alejó un caballo de la defensa del enroque blanco y Najdorf respondió rompiéndolo con 9...Axh2+.',
        'Una vez que el rey blanco salió de detrás de sus peones, cada jaque negro abrió una línea nueva: alfiles y caballos se entregaron para que la dama y los peones terminaran el trabajo.'],
      notes: [
        { ply: 17, text: 'El caballo salta a g5, lejos de su rey. El enroque blanco queda con menos defensores.' },
        { ply: 18, text: '¡Sacrificio en h2! El alfil rompe el escudo de peones del rey blanco.' },
        { ply: 20, text: 'Caballo y dama se acercan: ya hay más atacantes que defensores cerca del rey.' },
        { ply: 24, text: 'La dama llega a la columna h con amenaza de mate.' },
        { ply: 26, text: '¡Otro alfil entregado! Desvía al caballo para que la dama entre en h2.' },
        { ply: 28, text: 'Jaque: el rey blanco tiene que salir hacia el centro, donde no le protege nadie.' },
        { ply: 30, text: 'Abre líneas: el alfil de c8 y los caballos se suman a la caza.' },
        { ply: 40, text: 'Un alfil más para atraer al rey a g4.' },
        { ply: 44, text: 'Mate con un peón: el rey blanco, rodeado de piezas negras, no tiene casillas.' }
      ]
    },
    {
      id: 'pulpo', white: 'Anatoli Kárpov', black: 'Gari Kaspárov', year: 1985, event: 'Moscú, Campeonato del Mundo (partida 16)', title: 'El caballo pulpo de d3',
      pgn: '1.e4 c5 2.Nf3 e6 3.d4 cxd4 4.Nxd4 Nc6 5.Nb5 d6 6.c4 Nf6 7.N1c3 a6 8.Na3 d5 9.cxd5 exd5 10.exd5 Nb4 11.Be2 Bc5 12.O-O O-O 13.Bf3 Bf5 14.Bg5 Re8 15.Qd2 b5 16.Rad1 Nd3 17.Nab1 h6 18.Bh4 b4 19.Na4 Bd6 20.Bg3 Rc8 21.b3 g5 22.Bxd6 Qxd6 23.g3 Nd7 24.Bg2 Qf6 25.a3 a5 26.axb4 axb4 27.Qa2 Bg6 28.d6 g4 29.Qd2 Kg7 30.f3 Qxd6 31.fxg4 Qd4+ 32.Kh1 Nf6 33.Rf4 Ne4 34.Qxd3 Nf2+ 35.Rxf2 Bxd3 36.Rfd2 Qe3 37.Rxd3 Rc1 38.Nb2 Qf2 39.Nd2 Rxd1+ 40.Nxd1 Re1+ 0-1',
      concepts: ['casilla débil', 'puesto avanzado', 'caballo'],
      intro: 'Kaspárov entrega un peón para plantar un caballo en d3, una casilla que ningún peón blanco puede atacar. Desde allí paraliza las piezas de Kárpov durante casi veinte jugadas.',
      chronicle: ['Con 8...d5 Kaspárov sacrificó un peón para ganar actividad. El caballo de b4 tenía un destino: la casilla d3.',
        'Instalado en d3, el caballo vigilaba b2, c1, e1, f2 y f4. Kárpov tuvo que retirar sus caballos a b1 y a4 para cubrirse, y cuando por fin capturó el caballo, una horquilla del otro caballo decidió la partida.'],
      notes: [
        { ply: 16, text: 'Gambito: Kaspárov entrega el peón de d5 a cambio de desarrollo rápido y casillas.' },
        { ply: 20, text: 'El caballo se dirige a d3. Allí ningún peón blanco podrá echarlo.' },
        { ply: 32, text: '¡El pulpo! Desde d3 el caballo controla b2, c1, e1, f2 y f4, y estorba a todas las piezas blancas.', arrows: ['d3b2', 'd3c1', 'd3e1', 'd3f2', 'd3f4'] },
        { ply: 33, text: 'Kárpov tiene que replegar el caballo a b1 para vigilar d2: sus piezas juegan a la defensiva.' },
        { ply: 37, text: 'Los caballos blancos acaban en la banda, sin tocar el centro.' },
        { ply: 60, text: 'Las negras recuperan el peón: el de d6 ya no tenía apoyo.' },
        { ply: 67, text: 'Kárpov por fin elimina el caballo de d3… y la dama queda en una casilla expuesta.' },
        { ply: 68, text: 'Horquilla: el otro caballo ataca rey y dama a la vez. Las negras ganan material decisivo.' }
      ]
    }
  );

  // Cambios de pasos en el tomo III (solo las partidas: el resto de pasos se conserva)
  function keep(steps, pred) { return steps.filter(function (s) { return !pred(s); }); }
  var R = window.AA_REPLACE = window.AA_REPLACE || {};
  R.principios = function (steps) {
    var out = [];
    steps.forEach(function (s) {
      if (s.game === 'opera' && s.t === 'game') {
        out.push({ t: 'game', game: 'peruana', from: 0, to: 20, text: 'La Inmortal peruana: las negras sacan la dama pronto y retrasan el desarrollo; las blancas suman una pieza en cada jugada.' });
        out.push({ t: 'quiz', q: '¿Qué error de principios cometieron las negras con 2...Dxd5 y 3...Da5?', options: ['Sacar la dama pronto: el rival la ataca ganando tiempos', 'Ninguno: la dama es la pieza más fuerte y debe salir', 'Tenían que enrocar ya en la segunda jugada'], answer: 0,
          why: 'Si la dama sale pronto, cada pieza rival que se desarrolla atacándola gana un tiempo. Por eso primero salen caballos y alfiles.' });
        return; }
      if (s.t === 'quiz' && /3\.\.\.Ag4/.test(s.q || '')) return; // la pregunta era sobre la Ópera
      if (s.game === 'opera' && s.t === 'guess') {
        if (s.ply === 11) out.push({ t: 'guess', game: 'peruana', ply: 5, text: 'Canal con blancas: desarrolla una pieza y ataca a la dama a la vez.', why: 'Desarrollo con tempo. La dama tendrá que moverse otra vez.' });
        if (s.ply === 17) out.push({ t: 'guess', game: 'peruana', ply: 25, text: 'Las negras se llevaron dos torres, pero su rey está solo. Busca el golpe.', why: 'El sacrificio abre la diagonal del rey negro.' });
        if (s.ply === 23) out.push({ t: 'guess', game: 'peruana', ply: 27, text: 'Remata: da jaque mate.', why: 'El alfil de f4 cubre b8 y c7; el de a6 da el mate.' });
        return; }
      out.push(s); });
    return out;
  };
  R.iniciativa = function (steps) {
    var out = []; var done = false;
    steps.forEach(function (s) {
      if (s.t === 'guess' && /^(opera|inmortal|siempreviva)$/.test(s.game)) {
        if (done) return; done = true;
        out.push({ t: 'guess', game: 'monedas', ply: 40, text: 'Marshall con negras: todas sus piezas atacan menos una. ¿Cuál falta?', why: 'La última torre entra por la columna f abierta.' });
        out.push({ t: 'guess', game: 'monedas', ply: 44, text: 'Marshall: elimina un defensor del rey blanco aunque cueste la calidad.', why: 'El alfil de h3 defendía g2 y la torre se lo lleva con amenaza.' });
        out.push({ t: 'guess', game: 'monedas', ply: 46, text: 'La jugada más famosa de Marshall: ofrece la dama.', why: 'Cualquier captura permite Ce2 con mate o pérdida de la dama blanca.' });
        return; }
      out.push(s); });
    return out;
  };
  R.casillas = function (steps) {
    var out = [];
    steps.forEach(function (s) {
      if (s.game === 'short-timman' && s.t === 'game') {
        out.push({ t: 'game', game: 'pulpo', from: 15, to: 31, text: 'Kaspárov entrega un peón con 8...d5 y lleva su caballo hacia una casilla que ningún peón blanco controla.' });
        out.push({ t: 'guess', game: 'pulpo', ply: 32, text: 'Kaspárov con negras: instala el caballo en la casilla débil del campo blanco.', why: 'El «pulpo». Ningún peón blanco puede echarlo y estorba a todas las piezas de Kárpov.' });
        out.push({ t: 'game', game: 'pulpo', from: 32, to: 45, text: 'Mira cómo el caballo de d3 obliga a las piezas blancas a defenderse desde la banda.' });
        return; }
      if (s.game === 'short-timman' && s.t === 'guess') {
        out.push({ t: 'guess', game: 'pulpo', ply: 68, text: 'Kárpov acaba de capturar el caballo de d3 con la dama. Castígalo.', why: 'Horquilla de rey y dama. El trabajo del pulpo lo remata su compañero.' });
        return; }
      out.push(s); });
    return out;
  };
  R['rey-seguro'] = function (steps) {
    var out = [];
    steps.forEach(function (s) {
      if (s.game === 'lasker-thomas' && s.t === 'game') {
        out.push({ t: 'game', game: 'polaca', from: 16, to: 27, text: 'Un caballo blanco se aleja a g5 y Najdorf rompe el enroque con un sacrificio.' });
        out.push({ t: 'guess', game: 'polaca', ply: 28, text: 'Najdorf con negras: el alfil ya se ha entregado. Saca al rey blanco de su refugio.', why: 'El rey tiene que salir hacia el centro.' });
        return; }
      if (s.game === 'siempreviva' && s.t === 'game') { out.push({ t: 'game', game: 'polaca', from: 28, to: 41, text: 'Fuera de su enroque, el rey blanco recibe jaque tras jaque.' }); return; }
      if (s.game === 'lasker-thomas' && s.t === 'guess') { out.push({ t: 'guess', game: 'polaca', ply: 42, text: 'El rey blanco ha llegado a g4. Sigue con jaque y prepara el mate.', why: 'Tras fxe5, el peón da mate en h5.' }); return; }
      out.push(s); });
    return out;
  };
  R.colgantes = function (steps) { return keep(steps, function (s) { return s.game === 'botvinnik-capablanca'; }); };
})();
