// Servidor de prueba que imita las funciones RPC de supabase/setup.sql (solo para desarrollo).
// Uso: node tools/mock-supabase.js  → http://localhost:8766  (clave: cualquiera)
const http = require('http');
const clases = {}, eventos = [], partidas = {};
const fn = {
  info_clase: ({ p_codigo }) => { const c = clases[String(p_codigo).toUpperCase()]; return c ? { nombre: c.nombre, config: c.config } : null; },
  crear_clase: ({ p_codigo, p_nombre, p_clave }) => { const k = String(p_codigo).toUpperCase(); if (k.length < 4) throw 'El código de clase debe tener al menos 4 caracteres'; if ((p_clave || '').length < 6) throw 'La clave del docente debe tener al menos 6 caracteres'; if (clases[k]) throw 'Ese código de clase ya existe'; clases[k] = { nombre: p_nombre, clave: p_clave, config: {} }; return k; },
  guardar_config_clase: ({ p_codigo, p_clave, p_config }) => { const c = clases[String(p_codigo).toUpperCase()]; if (!c || c.clave !== p_clave) throw 'Clave incorrecta'; c.config = p_config; return true; },
  datos_clase: ({ p_codigo, p_clave }) => { const k = String(p_codigo).toUpperCase(); const c = clases[k]; if (!c || c.clave !== p_clave) throw 'Clave incorrecta'; return eventos.filter((e) => e.clase === k).map(({ alumno, t, datos }) => ({ alumno, t, datos })); },
  borrar_datos_clase: ({ p_codigo, p_clave }) => { const k = String(p_codigo).toUpperCase(); const c = clases[k]; if (!c || c.clave !== p_clave) throw 'Clave incorrecta'; let n = 0; for (let i = eventos.length - 1; i >= 0; i--) if (eventos[i].clase === k) { eventos.splice(i, 1); n++; } return n; },
  registrar_eventos: ({ p_clase, p_alumno, p_eventos }) => { const k = String(p_clase).toUpperCase(); if (!clases[k]) throw 'Clase no encontrada'; if (!/^[A-Z]{3,5}-[A-Z0-9]{4,8}$/.test(p_alumno)) throw 'Código de estudiante inválido'; if (!Array.isArray(p_eventos) || p_eventos.length > 300) throw 'Lote inválido'; p_eventos.forEach((d) => eventos.push({ clase: k, alumno: p_alumno, t: new Date().toISOString(), datos: d })); return p_eventos.length; },
  guardar_partida: ({ p_clase, p_alumno, p_token, p_slot, p_estado }) => { const k = String(p_clase).toUpperCase(); if (!clases[k]) throw 'Clase no encontrada'; const id = k + '|' + p_alumno + '|' + p_slot; const cur = partidas[id]; if (cur && cur.token !== p_token) throw 'Clave personal incorrecta'; partidas[id] = { token: p_token, estado: p_estado }; return true; },
  cargar_partida: ({ p_clase, p_alumno, p_token, p_slot }) => { const id = String(p_clase).toUpperCase() + '|' + String(p_alumno).toUpperCase() + '|' + p_slot; const cur = partidas[id]; if (!cur) return null; if (cur.token !== p_token) throw 'Clave personal incorrecta'; return cur.estado; },
};
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'apikey, authorization, content-type'); res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const m = req.url.match(/^\/rest\/v1\/rpc\/(\w+)/); let body = '';
  req.on('data', (d) => (body += d)); req.on('end', () => {
    if (!m || !fn[m[1]]) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ message: 'Could not find the function ' + (m && m[1]) })); }
    if (!req.headers.apikey) { res.writeHead(401); return res.end('{"message":"No API key"}'); }
    try { const out = fn[m[1]](JSON.parse(body || '{}')); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out)); }
    catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: String(e) })); }
  });
}).listen(8766, () => console.log('Mock Supabase en http://localhost:8766'));
