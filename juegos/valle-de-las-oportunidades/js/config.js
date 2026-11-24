// Configuración opcional de la base de datos para todos los equipos.
// Si publicas el juego en GitHub Pages, pega aquí la dirección y la clave PÚBLICA
// (anon) de tu proyecto de Supabase. Esa clave está pensada para estar en páginas
// públicas: los datos quedan protegidos por las funciones de supabase/setup.sql.
// También puedes dejarlo vacío y configurarlo desde el Panel docente en cada equipo.
var VO = globalThis.VO = globalThis.VO || {};
VO.CONFIG = {
  supabaseUrl: '',      // ejemplo: 'https://abcdxyz.supabase.co'
  supabaseAnonKey: '',  // clave "anon public" de Project Settings → API
  claseCodigo: '',      // opcional: código de clase por defecto, por ejemplo 'MATE3B'
};
