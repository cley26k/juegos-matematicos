'use strict';
// Conexión con Supabase (opcional). Sin dependencias: usa fetch contra las funciones
// RPC definidas en supabase/setup.sql. Si no hay conexión, todo sigue funcionando en local
// y los registros esperan en una cola hasta que vuelva internet.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const D = (VO.DB = {});
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin espacio */ } };

  // Configuración: primero la del dispositivo; si no, la de js/config.js (para GitHub Pages).
  D.cfg = function () {
    const base = VO.CONFIG || {}; const local = read('valle_db', {});
    const url = (local.url || base.supabaseUrl || '').trim().replace(/\/+$/, '');
    const key = (local.key || base.supabaseAnonKey || '').trim();
    const params = new URLSearchParams(location.search);
    const clase = (params.get('clase') || local.clase || base.claseCodigo || '').trim().toUpperCase();
    return { url, key, clase };
  };
  D.setLocal = (patch) => { const cur = read('valle_db', {}); write('valle_db', Object.assign(cur, patch)); };
  D.configured = () => { const c = D.cfg(); return !!(c.url && c.key); };
  D.enabled = () => { const c = D.cfg(); return !!(c.url && c.key && c.clase); };
  D.status = { ok: null, msg: 'Sin conexión configurada', last: 0 };

  D.rpc = async function (fn, args, cfg) {
    const c = cfg || D.cfg();
    if (!c.url || !c.key) throw new Error('Base de datos no configurada');
    const r = await fetch(c.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) });
    const text = await r.text(); let body = null; try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
    if (!r.ok) { const m = (body && (body.message || body.hint)) || ('Error ' + r.status); throw new Error(m); }
    return body;
  };
  D.test = async function (cfg) {
    try { await D.rpc('info_clase', { p_codigo: 'PRUEBA-CONEXION' }, cfg); D.status = { ok: true, msg: 'Conectado', last: Date.now() }; return { ok: true }; }
    catch (e) { const m = /Failed to fetch|NetworkError/i.test(e.message) ? 'No se pudo contactar la dirección. ¿Está bien escrita y hay internet?' : /function|not find|schema/i.test(e.message) ? 'Conectado, pero falta ejecutar supabase/setup.sql en tu proyecto.' : e.message; D.status = { ok: false, msg: m, last: Date.now() }; return { ok: false, msg: m }; }
  };

  // ---------- cola de registros ----------
  const QK = 'valle_db_queue';
  D.push = function (entry) {
    if (!D.enabled()) return;
    const q = read(QK, []); q.push(entry); if (q.length > 3000) q.splice(0, q.length - 3000); write(QK, q);
  };
  D.pending = () => read(QK, []).length;
  let busy = false;
  D.flush = async function () {
    if (busy || !D.enabled() || !navigator.onLine) return;
    const q = read(QK, []); if (!q.length) return;
    busy = true;
    try {
      const c = D.cfg();
      // agrupar por estudiante
      const by = {}; q.forEach((e) => { (by[e.id] = by[e.id] || []).push(e); });
      for (const alumno in by) {
        const list = by[alumno];
        for (let i = 0; i < list.length; i += 200) await D.rpc('registrar_eventos', { p_clase: c.clase, p_alumno: alumno, p_eventos: list.slice(i, i + 200) });
      }
      const rest = read(QK, []).slice(q.length); write(QK, rest);
      D.status = { ok: true, msg: 'Sincronizado', last: Date.now() };
    } catch (e) { D.status = { ok: false, msg: 'Pendiente de sincronizar: ' + e.message, last: Date.now() }; }
    busy = false;
  };
  setInterval(() => D.flush(), 20000);
  window.addEventListener('online', () => D.flush());
  document.addEventListener('visibilitychange', () => { if (document.hidden) D.flush(); });

  // ---------- partidas en la nube ----------
  D.saveGame = async function (state) {
    if (!D.enabled() || !state || !state.token) return false;
    try { await D.rpc('guardar_partida', { p_clase: D.cfg().clase, p_alumno: state.anonId, p_token: state.token, p_slot: state.slot || 1, p_estado: JSON.parse(VO.G.serialize()) }); return true; }
    catch (e) { D.status = { ok: false, msg: 'No se pudo guardar en la nube: ' + e.message, last: Date.now() }; return false; }
  };
  D.loadGame = (alumno, token, slot) => D.rpc('cargar_partida', { p_clase: D.cfg().clase, p_alumno: alumno.toUpperCase(), p_token: token, p_slot: slot || 1 });

  // ---------- docente ----------
  D.createClass = (codigo, nombre, clave) => D.rpc('crear_clase', { p_codigo: codigo, p_nombre: nombre, p_clave: clave });
  D.classData = (codigo, clave) => D.rpc('datos_clase', { p_codigo: codigo, p_clave: clave });
  D.saveClassConfig = (codigo, clave, config) => D.rpc('guardar_config_clase', { p_codigo: codigo, p_clave: clave, p_config: config });
  D.classInfo = (codigo) => D.rpc('info_clase', { p_codigo: codigo });
  D.wipeClass = (codigo, clave) => D.rpc('borrar_datos_clase', { p_codigo: codigo, p_clave: clave });
  D.newToken = () => { const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 6; i++) s += ch[Math.floor(Math.random() * ch.length)]; return s; };
})();
