/* Matrix Arena · conexión con Supabase para la versión de GitHub Pages.
   En claude.ai el juego usa la nube y el multijugador de Claude (window.claude.use).
   Aquí se ofrece la MISMA interfaz (db, user, room, downloads) sobre Supabase:
   - db: tablas citizens y event_chunks con permisos por fila (ver supabase/esquema.sql)
   - user: estudiante anónimo con código de aula, o docente con correo y contraseña
   - room: Supabase Realtime (presencia + mensajes) por aula; duelos en canales propios
   - downloads: descarga directa de archivos en el navegador */
(function () {
  'use strict';
  if (window.claude && typeof window.claude.use === 'function') return; // dentro de claude.ai
  const CFG = window.MATRIX_SUPABASE || {};
  const LS = { get(k) { try { return localStorage.getItem(k) } catch (e) { return null } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch (e) { } } };
  const configured = !!(CFG.url && CFG.key && window.supabase && window.supabase.createClient);
  const MYPEER = 'p' + Math.random().toString(36).slice(2, 12);
  const S = { sb: null, user: null, role: null, classCode: null, className: null, nickCache: {} };
  let resolveReady0, readyDone = false; const READY = new Promise(r => (resolveReady0 = r));
  const resolveReady = v => { readyDone = true; resolveReady0(v) };

  // ---------- descargas ----------
  const downloads = {
    async save({ filename, data }) {
      if (!filename || data == null) throw { code: 'bad_request', message: 'Faltan datos' };
      const blob = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1500);
      return { status: 'saved' };
    }
  };

  window.claude = {
    async use(name) {
      if (name === 'downloads') return downloads;
      const ok = await READY;
      if (!ok) return null;
      return { db, user, room: lobby() }[name] || null;
    }
  };
  window.MATRIX_NET = { state: S, open: () => showLogin(true), logout };
  if (!configured) { resolveReady(false); return; }
  S.sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true } });
  const sb = S.sb;
  const fail = (e) => { const err = new Error((e && e.message) || 'error'); err.code = (e && (e.code || e.status)) || 'unavailable'; return err };

  // ---------- db (mismo contrato que usa el juego) ----------
  const snap = (id, body) => ({ id, exists: true, data: () => body, metadata: { fromCache: false, hasPendingWrites: false } });
  const db = {
    doc(path) {
      const p = String(path).split('/');
      return {
        async set(data) {
          if (p[0] !== 'citizens') throw fail({ message: 'ruta no soportada' });
          if (p.length === 2) {
            if (!S.classCode || p[1] !== S.user.id) return; // el docente no tiene ficha de ciudadano
            const nick = (data.nick && data.nick !== 'Aprendiz') ? data.nick : (LS.get('mxarena-sb-nick') || 'Aprendiz');
            const { error } = await sb.from('citizens').update({ nick: String(nick).slice(0, 20), summary: data, updated_at: new Date().toISOString() }).eq('user_id', p[1]);
            if (error) throw fail(error);
          } else if (p.length === 4 && p[2] === 'log') {
            const { error } = await sb.from('event_chunks').upsert({ user_id: p[1], chunk_key: p[3].slice(0, 40), events: data.ev || [], updated_at: new Date().toISOString() });
            if (error) throw fail(error);
          } else throw fail({ message: 'ruta no soportada' });
        },
        async delete() {
          if (p.length === 2) { const { error } = await sb.from('citizens').delete().eq('user_id', p[1]); if (error) throw fail(error); if (p[1] === S.user.id) { S.classCode = null; LS.set('mxarena-sb-class', null) } }
          else if (p.length === 4) { const { error } = await sb.from('event_chunks').delete().eq('user_id', p[1]).eq('chunk_key', p[3]); if (error) throw fail(error) }
        },
        async get() { return { id: p[p.length - 1], exists: false, data: () => undefined } }
      };
    },
    collection(path) {
      const p = String(path).split('/');
      return {
        async get() {
          if (p.length === 1 && p[0] === 'citizens') {
            const { data, error } = await sb.from('citizens').select('user_id,nick,summary,class_code,updated_at');
            if (error) throw fail(error);
            data.forEach(r => (S.nickCache[r.user_id] = r.nick));
            return { docs: data.map(r => snap(r.user_id, Object.assign({}, r.summary, { nick: r.nick, aula: r.class_code, lastSeen: r.updated_at }))) };
          }
          if (p.length === 3 && p[2] === 'log') {
            const { data, error } = await sb.from('event_chunks').select('chunk_key,events').eq('user_id', p[1]);
            if (error) throw fail(error);
            return { docs: data.map(r => snap(r.chunk_key, { ev: r.events })) };
          }
          throw fail({ message: 'ruta no soportada' });
        },
        doc(id) { return db.doc(path + '/' + id) }
      };
    }
  };

  // ---------- user ----------
  const user = {
    async id() { return S.user ? S.user.id : null },
    async isOwner() { return S.role === 'teacher' },
    async canEdit() { return S.role === 'teacher' },
    async can() { return null },
    async me() { return { id: S.user ? S.user.id : null, name: '', avatarUrl: '', color: '#1d8a7b', email: null, isOwner: S.role === 'teacher', canEdit: S.role === 'teacher' } },
    async profiles(ids) { const out = {}; [].concat(ids).forEach(id => (out[id] = { id, name: S.nickCache[id] || '', avatarUrl: '', color: '#1d8a7b', email: null, isMe: S.user && id === S.user.id, guest: false })); return out },
    async name() { return '' }, async search() { return [] }
  };

  // ---------- room sobre Supabase Realtime ----------
  function makeRoom(chName) {
    const ch = sb.channel(chName, { config: { presence: { key: MYPEER }, broadcast: { self: false } } });
    const R = { conn: false, peersList: Object.freeze([]), prev: new Map(), peerH: [], connH: [], pres: {}, lastTrack: 0, trackTimer: null, closed: false };
    const toPeers = () => {
      const st = ch.presenceState(); const now = Date.now(); const list = []; const seen = new Map();
      Object.entries(st).forEach(([key, metas]) => {
        const m = metas && metas[metas.length - 1]; if (!m) return;
        const pres = Object.assign({}, m); delete pres.presence_ref;
        const json = JSON.stringify(pres); const old = R.prev.get(key);
        const peer = Object.freeze({ peer: key, by: null, isMe: key === MYPEER, sameTab: key === MYPEER, kind: 'viewer', guest: false, presence: Object.freeze(pres), updatedAt: old && old.json === json ? old.updatedAt : now });
        seen.set(key, { json, updatedAt: peer.updatedAt, peer }); list.push(peer);
      });
      const joined = [], left = [], updated = [];
      seen.forEach((v, k) => { const o = R.prev.get(k); if (!o) joined.push(v.peer); else if (o.json !== v.json) updated.push(v.peer) });
      R.prev.forEach((v, k) => { if (!seen.has(k)) left.push(v.peer) });
      R.prev = seen; R.peersList = Object.freeze(list);
      const change = { peers: R.peersList, joined, left, updated };
      R.peerH.forEach(h => { try { h(change) } catch (e) { console.warn(e) } });
    };
    ch.on('presence', { event: 'sync' }, toPeers);
    const ready = new Promise(res => ch.subscribe(status => {
      const c = status === 'SUBSCRIBED'; if (c !== R.conn) { R.conn = c; R.connH.forEach(h => h(c)) }
      if (c) { res(); if (Object.keys(R.pres).length) ch.track(R.pres) }
    }));
    const doTrack = () => { R.trackTimer = null; R.lastTrack = Date.now(); if (R.conn && !R.closed) ch.track(R.pres).catch(() => { }) };
    const api = {
      name: chName,
      emit(topic, data) { return ready.then(() => ch.send({ type: 'broadcast', event: topic, payload: { data, from: MYPEER } })).then(() => { }) },
      on(topic, handler) {
        let live = true;
        ch.on('broadcast', { event: topic }, ({ payload }) => { if (!live || !payload) return; handler({ topic, data: payload.data, peer: String(payload.from || ''), by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false }) });
        return () => { live = false };
      },
      presence(patch) {
        Object.entries(patch || {}).forEach(([k, v]) => { if (v === null) delete R.pres[k]; else R.pres[k] = v });
        const wait = 200 - (Date.now() - R.lastTrack);
        if (wait <= 0) doTrack(); else if (!R.trackTimer) R.trackTimer = setTimeout(doTrack, wait);
        return Promise.resolve();
      },
      peers() { return R.peersList },
      onPeers(h) { R.peerH.push(h); Promise.resolve().then(() => h({ peers: R.peersList, joined: R.peersList, left: [], updated: [] })); return () => { R.peerH = R.peerH.filter(x => x !== h) } },
      connected() { return R.conn },
      onConnection(h) { R.connH.push(h); Promise.resolve().then(() => h(R.conn)); return () => { R.connH = R.connH.filter(x => x !== h) } },
      async join(name) { const n = String(name).toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 48); if (!n) throw { code: 'invalid_argument' }; const r = makeRoom(chName + '.' + n); return r },
      async leave() { R.closed = true; try { await sb.removeChannel(ch) } catch (e) { } }
    };
    return api;
  }
  let LOBBY = null;
  function lobby() { if (!S.classCode) return null; if (!LOBBY) LOBBY = makeRoom('matrix-arena.' + S.classCode.toLowerCase()); return LOBBY }

  // ---------- pantalla de acceso ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let box = null;
  function overlay() {
    if (box) return box;
    box = document.createElement('div'); box.id = 'netLogin';
    box.style.cssText = 'position:fixed;inset:0;z-index:60;background:rgba(20,14,8,.72);overflow:auto;padding:16px';
    const st = document.createElement('style'); st.textContent = '#netLogin input[type=text],#netLogin input[type=email],#netLogin input[type=password]{width:100%;box-sizing:border-box;font-size:16px}#netLogin label{margin-top:4px}#netLogin .row{margin-top:4px}'; if (!document.getElementById('nlStyle')) { st.id = 'nlStyle'; document.head.appendChild(st) }
    document.body.appendChild(box); return box;
  }
  function closeOverlay() { if (box) { box.remove(); box = null } }
  function finish(ok) { closeOverlay(); if (readyDone) { location.reload(); return } resolveReady(ok) }
  function frame(title, sub, body) {
    overlay().innerHTML = `<div class="panel dlg" style="max-width:560px;margin:6vh auto"><div class="ph"><div><h2>${title}</h2><div class="sub">${sub}</div></div></div><div class="pb">${body}</div></div>`;
  }
  function showLogin(fromGame) {
    const saved = LS.get('mxarena-sb-code') || '';
    frame('Entrar a Valle Matricia', 'Matrix Arena · juego de matrices',
      `<div class="tabs" role="tablist"><button class="tab" data-t="est" aria-selected="true">Soy estudiante</button><button class="tab" data-t="doc" aria-selected="false">Soy docente</button></div>
       <div id="nlBody" style="display:grid;gap:6px"></div><div id="nlMsg" aria-live="polite"></div>
       <div class="row"><button class="btn alt sm" id="nlOff">${fromGame ? 'Seguir sin cambiar' : 'Jugar sin conexión'}</button></div>
       <p class="muted" style="margin:0">Sin conexión tu progreso se guarda solo en este navegador y no hay multijugador.</p>`);
    const est = () => { document.getElementById('nlBody').innerHTML = `
        <label for="nlCode">Código de aula</label><input id="nlCode" type="text" maxlength="10" autocomplete="off" placeholder="p. ej. K7Q2PM" value="${esc(saved)}" style="text-transform:uppercase">
        <label for="nlNick">Tu apodo en el juego</label><input id="nlNick" type="text" maxlength="20" autocomplete="off" placeholder="Sin tu nombre completo" value="${esc(LS.get('mxarena-sb-nick') || '')}">
        <div class="row"><button class="btn" id="nlJoin">Entrar al aula</button></div>
        <p class="muted" style="margin:0">No necesitas correo. Tu docente te da el código. Usa un apodo, no tu nombre completo.</p>`;
      document.getElementById('nlJoin').onclick = joinAsStudent; };
    const doc = () => { document.getElementById('nlBody').innerHTML = `
        <label for="nlMail">Correo</label><input id="nlMail" type="email" autocomplete="email">
        <label for="nlPass">Contraseña</label><input id="nlPass" type="password" autocomplete="current-password">
        <div class="row"><button class="btn" id="nlIn">Entrar como Alcalde</button><button class="btn alt" id="nlUp">Crear cuenta docente</button></div>`;
      document.getElementById('nlIn').onclick = () => teacherAuth(false); document.getElementById('nlUp').onclick = () => teacherAuth(true); };
    box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { box.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-selected', x === b)); (b.dataset.t === 'est' ? est : doc)() });
    document.getElementById('nlOff').onclick = () => fromGame ? closeOverlay() : finish(false);
    est();
  }
  const msg = (t, kind = 'warn') => { const m = document.getElementById('nlMsg'); if (m) m.innerHTML = t ? `<div class="fb ${kind}"><p style="margin:0">${esc(t)}</p></div>` : '' };
  async function ensureAnon() {
    const { data } = await sb.auth.getSession();
    if (data.session && data.session.user && data.session.user.is_anonymous) return data.session.user;
    if (data.session) await sb.auth.signOut();
    const r = await sb.auth.signInAnonymously(); if (r.error) throw r.error; return r.data.user;
  }
  async function joinAsStudent() {
    const code = document.getElementById('nlCode').value.trim().toUpperCase(), nick = document.getElementById('nlNick').value.trim();
    if (!/^[A-Z0-9]{4,10}$/.test(code)) return msg('El código de aula tiene entre 4 y 10 letras o números.');
    if (!nick) return msg('Escribe un apodo.');
    msg('Entrando…', 'ok');
    try {
      const u = await ensureAnon();
      const { data, error } = await sb.rpc('join_class', { p_code: code, p_nick: nick });
      if (error) throw error;
      Object.assign(S, { user: u, role: 'student', classCode: code, className: data });
      LS.set('mxarena-sb-code', code); LS.set('mxarena-sb-nick', nick); LS.set('mxarena-sb-class', code);
      try { const pk = 'mxarena-profile-v1'; const p = JSON.parse(localStorage.getItem(pk) || 'null'); if (p && (!p.name || p.name === 'Aprendiz')) { p.name = nick.slice(0, 14); localStorage.setItem(pk, JSON.stringify(p)) } } catch (e) { }
      finish(true);
    } catch (e) {
      const m = String((e && e.message) || '');
      msg(m.includes('codigo_invalido') ? 'Ese código de aula no existe. Revísalo con tu docente.' : m.toLowerCase().includes('anonymous') ? 'El acceso de estudiantes no está activado en la base de datos (falta habilitar el inicio de sesión anónimo).' : 'No se pudo entrar: ' + m);
    }
  }
  async function teacherAuth(signup) {
    const email = document.getElementById('nlMail').value.trim(), password = document.getElementById('nlPass').value;
    if (!email || password.length < 8) return msg('Escribe tu correo y una contraseña de al menos 8 caracteres.');
    msg(signup ? 'Creando cuenta…' : 'Entrando…', 'ok');
    const { data: cur } = await sb.auth.getSession(); if (cur.session && cur.session.user.is_anonymous) await sb.auth.signOut();
    const r = signup ? await sb.auth.signUp({ email, password }) : await sb.auth.signInWithPassword({ email, password });
    if (r.error) return msg(r.error.message.includes('Invalid login') ? 'Correo o contraseña incorrectos.' : r.error.message);
    if (!r.data.session) return msg('Revisa tu correo para confirmar la cuenta y luego entra.', 'ok');
    S.user = r.data.user; S.role = 'teacher'; teacherHome();
  }
  async function teacherHome() {
    const { data, error } = await sb.from('classes').select('code,name,created_at').order('created_at');
    if (error) return msg('No se pudieron leer tus aulas: ' + error.message);
    frame('Oficina del Alcalde', 'Cuenta docente',
      `<h3>Tus aulas</h3>${data.length ? `<table><thead><tr><th>Aula</th><th>Código para tus estudiantes</th><th></th></tr></thead><tbody>${data.map(c => `<tr><td>${esc(c.name)}</td><td class="mono" style="font-size:18px"><b>${esc(c.code)}</b></td><td><button class="btn sm" data-enter="${esc(c.code)}">Entrar al valle</button></td></tr>`).join('')}</tbody></table>` : '<p class="muted">Aún no tienes aulas.</p>'}
       <div class="row"><label for="nlCls">Nueva aula</label><input id="nlCls" type="text" maxlength="60" placeholder="p. ej. 3.º B · Álgebra"><button class="btn alt" id="nlNew">Crear aula</button></div>
       <div id="nlMsg"></div><p class="muted" style="margin:0">Comparte el código con tus estudiantes. En el valle, el Ayuntamiento y el Observatorio te reconocerán como Alcalde y mostrarán los datos de todas tus aulas.</p>
       <div class="row"><button class="btn alt sm" id="nlOut">Cerrar sesión</button></div>`);
    box.querySelectorAll('[data-enter]').forEach(b => b.onclick = () => { S.classCode = b.dataset.enter; S.className = (data.find(c => c.code === S.classCode) || {}).name; LS.set('mxarena-sb-class', S.classCode); finish(true) });
    document.getElementById('nlNew').onclick = async () => {
      const name = document.getElementById('nlCls').value.trim() || 'Mi aula'; const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 5; i++) { let code = ''; for (let k = 0; k < 6; k++) code += abc[Math.floor(Math.random() * abc.length)];
        const { error: e } = await sb.from('classes').insert({ code, name }); if (!e) return teacherHome(); if (!String(e.message).includes('duplicate')) return msg('No se pudo crear el aula: ' + e.message) }
    };
    document.getElementById('nlOut').onclick = logout;
  }
  async function logout() { try { await sb.auth.signOut() } catch (e) { } LS.set('mxarena-sb-class', null); location.reload() }

  // ---------- arranque: reanudar sesión si existe ----------
  (async () => {
    try {
      const { data } = await sb.auth.getSession(); const u = data.session && data.session.user; const code = LS.get('mxarena-sb-class');
      if (u && code) {
        if (u.is_anonymous) {
          const { data: row } = await sb.from('citizens').select('class_code').eq('user_id', u.id).maybeSingle();
          if (row && row.class_code === code) { Object.assign(S, { user: u, role: 'student', classCode: code }); return resolveReady(true) }
        } else { Object.assign(S, { user: u, role: 'teacher', classCode: code }); return resolveReady(true) }
      }
      if (u && !u.is_anonymous) { S.user = u; S.role = 'teacher'; overlay(); return teacherHome() }
    } catch (e) { }
    overlay(); showLogin(false);
  })();
  document.addEventListener('click', e => { if (e.target && e.target.id === 'netBadge' && S.classCode !== undefined) showLogin(true) });
})();
