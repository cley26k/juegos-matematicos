'use strict';
// Interfaz: HUD, diálogos, paneles (inventario, tiendas, banco, empleos, fabricación,
// construcción, mapa, diario, estadísticas, ajustes, guardado), avisos y transiciones.
var VO = globalThis.VO = globalThis.VO || {};
(function () {
  const el = VO.el;
  const U = (VO.UI = { stack: [] });
  const G = () => VO.G;
  const $ = (id) => document.getElementById(id);
  const icon = (id, cls) => el('img', { src: VO.Art.iconURL(id), class: 'ico ' + (cls || ''), alt: '' });
  const itemIcon = (id) => { const it = VO.ITEMS[id]; if (it && it.tool) return icon(it.tool + G().state.tools[it.tool].tier); return icon(id); };
  U.itemIcon = itemIcon; U.icon = icon;

  // ------------------------------------------------------------ PANEL GENÉRICO
  U.anyOpen = () => U.stack.length > 0 || !!U.dlg;
  U.open = function (title, body, opts) {
    const prevFocus = document.activeElement;
    opts = opts || {};
    const wrap = el('div', { class: 'modal' + (opts.wide ? ' wide' : '') + (opts.cls ? ' ' + opts.cls : '') });
    const close = el('button', { class: 'x', 'aria-label': 'Cerrar', onclick: () => U.close() }, '✕');
    const panel = el('div', { class: 'panel ' + (opts.paper ? 'paper' : 'wood'), role: 'dialog', 'aria-label': title },
      el('div', { class: 'ptitle' }, opts.icon ? icon(opts.icon) : null, U.pixelTitle(title), opts.noClose ? null : close),
      el('div', { class: 'pbody' }, body));
    wrap.appendChild(panel);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap && !opts.noClose) U.close(); });
    $('ui').appendChild(wrap);
    U.stack.push({ wrap, onClose: opts.onClose, prevFocus });
    panel.setAttribute('aria-modal', 'true');
    setTimeout(() => { const f = panel.querySelector('.pbody button:not([disabled]), .pbody input, .pbody select') || panel.querySelector('.x'); if (f) f.focus({ preventScroll: true }); }, 30);
    wrap.addEventListener('keydown', (e) => { if (e.key !== 'Tab') return; const fs = [...panel.querySelectorAll('button:not([disabled]), input, select, [tabindex]')]; if (!fs.length) return; const i = fs.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { fs[fs.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === fs.length - 1) { fs[0].focus(); e.preventDefault(); } });
    if (VO.G.running) VO.G.paused++;
    VO.Audio.sfx('open');
    return panel;
  };
  U.close = function () {
    const top = U.stack.pop(); if (!top) return;
    top.wrap.remove(); if (top.prevFocus && top.prevFocus.focus && document.contains(top.prevFocus)) top.prevFocus.focus({ preventScroll: true }); if (VO.G.running) VO.G.paused = Math.max(0, VO.G.paused - 1);
    VO.Audio.sfx('close');
    if (top.onClose) top.onClose();
  };
  U.closeAll = () => { while (U.stack.length) U.close(); };
  U.onKey = function (k) {
    if (U.dlg) { if (k === ' ' || k === 'Enter' || k === VO.Settings.keys.interact) { U.dlgNext(); return true; } if (k === 'Escape') { U.dlgEnd(); return true; } return false; }
    if (U.stack.length) { if (k === 'Escape') { U.close(); return true; } if (k === VO.Settings.keys.inv && U.stack[U.stack.length - 1].wrap.querySelector('.invgrid.main')) { U.close(); return true; } return false; }
    return false;
  };
  U.toast = function (msg, kind) {
    const t = el('div', { class: 'toast ' + (kind || 'info'), role: 'status' }, msg);
    $('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200); setTimeout(() => t.remove(), 3700);
    while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
  };
  U.pixelTitle = function (t, color) { const c = VO.Art.pixelText(t, color || '#fff6dd'); const im = el('img', { src: c.toDataURL(), class: 'pxt', alt: t, style: 'width:' + c.width * 2 + 'px;height:' + c.height * 2 + 'px' }); return el('span', { class: 'pxtitle', 'aria-label': t }, im); };
  U.banner = function (t) { const b = el('div', { class: 'banner' }, U.pixelTitle(t)); document.body.appendChild(b); setTimeout(() => b.classList.add('out'), 1600); setTimeout(() => b.remove(), 2200); };
  U.fade = function (fn) { const f = $('fade'); f.classList.add('on'); setTimeout(() => { fn(); f.classList.remove('on'); }, VO.Settings.reduceMotion ? 50 : 320); };
  U.confirm = function (msg, yes, no) {
    const body = el('div', { class: 'confirm' }, el('p', {}, msg), el('div', { class: 'row end' },
      el('button', { class: 'btn', onclick: () => { U.close(); no && no(); } }, 'No'),
      el('button', { class: 'btn ok', onclick: () => { U.close(); yes(); } }, 'Sí')));
    U.open('¿Seguro?', body, { paper: true });
  };
  function qty(min, max, val, step, onChange) {
    step = step || 1;
    const inp = el('input', { type: 'number', min, max, step, value: val, class: 'qty', 'aria-label': 'Cantidad' });
    const set = (v) => { v = VO.clamp(Math.round(v / step) * step, min, max); inp.value = v; onChange(v); };
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); if (!isNaN(v)) onChange(VO.clamp(v, min, max)); });
    inp.addEventListener('change', () => set(parseFloat(inp.value) || min));
    return el('span', { class: 'qtybox' }, el('button', { class: 'btn sm', onclick: () => set(parseFloat(inp.value) - step) }, '−'), inp, el('button', { class: 'btn sm', onclick: () => set(parseFloat(inp.value) + step) }, '+'));
  }
  U.qty = qty;

  // ------------------------------------------------------------ HUD
  U.showHUD = function (on) { $('hud').classList.toggle('hidden', !on); if (on) U.buildHUD(); };
  U.buildHUD = function () {
    const hb = $('hotbar'); hb.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const slot = el('button', { class: 'slot', 'data-i': i, 'aria-label': 'Ranura ' + ((i + 1) % 10), onclick: () => { G().state.hot = i; U.refreshHUD(); } });
      hb.appendChild(slot);
    }
    if (!U.hudBound) {
      U.hudBound = true;
      ['inv', 'money', 'energy', 'time', 'gather', 'harvest', 'place', 'till'].forEach((e) => VO.bus.on(e, () => U.refreshHUD()));
      $('bInv').onclick = () => U.openInventory(); $('bMap').onclick = () => U.openMap(); $('bJournal').onclick = () => U.openJournal();
      $('bNote').onclick = () => VO.Notebook.open(); $('bMenu').onclick = () => U.openMenu(); $('bStats').onclick = () => U.openStats();
      [['bInv', 'chest'], ['bMap', 'path_stone'], ['bJournal', 'bookshelf'], ['bNote', 'notebook'], ['bStats', 'coin'], ['bMenu', 'workbench']].forEach(([b, ic]) => $(b).prepend(icon(ic)));
    }
    U.refreshHUD();
  };
  U.refreshHUD = function () {
    const g = G(); const s = g.state; if (!s) return;
    { const e = $('hMoney'); const t = s.money.toLocaleString('es-DO'); if (e.dataset.t !== t) { e.dataset.t = t; e.innerHTML = ''; const c = VO.Art.pixelText(t, '#fff6dd'); e.appendChild(el('img', { src: c.toDataURL(), class: 'pxt', alt: t + ' monedas', style: 'width:' + c.width * 2 + 'px;height:' + c.height * 2 + 'px' })); } }
    const pxs = (id, t, col) => { const e = $(id); if (e.dataset.t === t) return; e.dataset.t = t; e.innerHTML = ''; const c = VO.Art.pixelText(t, col || '#fff6dd'); e.appendChild(el('img', { src: c.toDataURL(), class: 'pxt', alt: t, style: 'width:' + c.width * 2 + 'px;height:' + c.height * 2 + 'px' })); e.setAttribute('aria-label', t); };
    pxs('hDay', 'Día ' + s.day); pxs('hTime', g.clock(), '#ffe27a');
    $('hWeather').textContent = ({ sol: 'Soleado', nublado: 'Nublado', lluvia: 'Lluvia' }[s.weather] || '') + (g.map && g.map.mine ? ' · Mina, nivel ' + g.map.mine : '') + ' · Capítulo ' + s.chapter;
    $('hWIcon').className = 'wicon ' + s.weather;
    const e = s.energy / s.maxEnergy; $('hEnergyFill').style.height = (e * 100) + '%'; $('hEnergyFill').style.background = e > 0.5 ? '#7ccf4a' : e > 0.2 ? '#f2cf3a' : '#e8452f';
    $('hEnergy').title = 'Energía: ' + Math.round(s.energy) + ' / ' + s.maxEnergy;
    const slots = $('hotbar').children;
    for (let i = 0; i < 10; i++) {
      const sl = slots[i]; const it = s.inv[i]; sl.innerHTML = '';
      sl.classList.toggle('sel', i === s.hot);
      if (it) {
        sl.appendChild(itemIcon(it.id));
        if (it.n > 1) sl.appendChild(el('span', { class: 'n' }, it.n));
        const tool = VO.ITEMS[it.id].tool;
        if (tool) { const t = s.tools[tool]; const mx = VO.TOOL_STATS(t.tier).maxDur; sl.appendChild(el('span', { class: 'dur' }, el('i', { style: 'width:' + (t.dur / mx * 100) + '%;background:' + (t.dur / mx > 0.3 ? '#7ccf4a' : '#e8452f') }))); if (tool === 'can') sl.appendChild(el('span', { class: 'water' }, t.water)); }
        sl.title = VO.ITEMS[it.id].name;
      }
      sl.appendChild(el('span', { class: 'k' }, (i + 1) % 10));
    }
    const sel = s.inv[s.hot]; $('hSel').textContent = sel ? VO.ITEMS[sel.id].name + (VO.ITEMS[sel.id].tool ? ' (' + VO.TIER_NAMES[s.tools[VO.ITEMS[sel.id].tool].tier] + ')' : '') : '';
    // objetivo inmediato
    $('hGoal').innerHTML = ''; $('hGoal').appendChild(U.goalText());
  };
  U.goalText = function () {
    const s = G().state;
    const act = VO.MISSIONS.find((m) => ['action', 'notebook'].includes(s.missions[m.id].status));
    if (act) { const st = s.missions[act.id].status; return el('span', {}, el('b', {}, act.title), ': ' + (st === 'notebook' ? 'completa tu libreta (N).' : 'habla con ' + VO.NPCS[act.npc].name + '.')); }
    const av = VO.MISSIONS.find((m) => s.missions[m.id].status === 'available' && (s.mode === 'aula' || m.chapter <= s.chapter));
    if (av) {
      if (av.id === 'c1_madera' && G().count('wood') < 12) return el('span', {}, el('b', {}, 'Capítulo 1'), ': tala árboles con el hacha (tienes ' + G().count('wood') + ' maderas) y visita a Clara en el mercado.');
      const nn = G().npcs.find((q) => q.id === av.npc); const where = nn && nn.state === 'work' && G().insideWork(nn) ? ' en ' + (VO.BUILDINGS.find((bb) => bb.id === nn.def.work) || {}).name : nn && nn.state === 'home' ? ' mañana (ya descansa en casa)' : '';
      return el('span', {}, el('b', {}, av.title), ': busca a ' + VO.NPCS[av.npc].name + where + ' (', el('span', { class: 'mark' }, '!'), ').');
    }
    if (s.mode !== 'aula' && !s.house.roof) return el('span', {}, el('b', {}, 'Hogar'), ': reúne materiales para reparar el techo (Tomás).');
    return el('span', {}, 'Explora el valle, cultiva y comercia libremente.');
  };
  U.aulaTick = function () {
    const s = G().state; const left = s.aulaMinutes * 60 - (Date.now() - s.aulaStart) / 1000;
    const t = $('hAula'); t.classList.remove('hidden');
    t.textContent = 'Modo aula · ' + Math.max(0, Math.floor(left / 60)) + ':' + String(Math.max(0, Math.floor(left % 60))).padStart(2, '0');
    if (left <= 0 && !s.aulaEnded) { s.aulaEnded = true; U.closeAll(); VO.Analytics.summaryModal(true); }
  };

  // ------------------------------------------------------------ DIÁLOGO
  U.dialog = function (npcId, lines, choices, onEnd, mood) {
    const d = VO.NPCS[npcId] || (VO.Extras && VO.Extras.def(npcId)) || null;
    U.dlg = { npcId, lines: lines.slice(), i: 0, choices, onEnd, typing: null };
    G().paused++;
    const box = $('dialog'); box.classList.remove('hidden'); box.innerHTML = '';
    const port = el('canvas', { class: 'portrait', width: 48, height: 48 }); if (d && d.dog) { const pc = port.getContext('2d'); pc.imageSmoothingEnabled = false; pc.drawImage(VO.Extras.dogImg, 3, 10, 36, 28); } else port.getContext('2d').drawImage(VO.Art.portrait(d ? d.look : G().state.look, mood || 'happy'), 0, 0);
    U.dlg.text = el('div', { class: 'dtext', 'aria-live': 'polite' });
    U.dlg.choicesEl = el('div', { class: 'dchoices' });
    box.append(el('div', { class: 'dport' }, port, el('div', { class: 'dname' }, d ? d.name : 'Tú')), el('div', { class: 'dmain' }, U.dlg.text, U.dlg.choicesEl, el('div', { class: 'dhint' }, '▼ Espacio / clic')));
    box.onclick = (e) => { if (e.target.tagName !== 'BUTTON') U.dlgNext(); };
    showLine();
  };
  function showLine() {
    const D = U.dlg; const line = D.lines[D.i]; D.text.textContent = ''; D.choicesEl.innerHTML = '';
    let k = 0; clearInterval(D.typing);
    const speed = VO.Settings.reduceMotion ? 1 : 2;
    D.full = false;
    D.typing = setInterval(() => { k += speed; D.text.textContent = line.slice(0, k); if (k % 6 === 0) VO.Audio.sfx('talk'); if (k >= line.length) { clearInterval(D.typing); D.full = true; if (D.i === D.lines.length - 1) showChoices(); } }, 18);
  }
  function showChoices() {
    const D = U.dlg; if (!D.choices) return;
    D.choices.forEach((c) => D.choicesEl.appendChild(el('button', { class: 'btn choice', onclick: (e) => { e.stopPropagation(); U.dlgEnd(); c.fn && c.fn(); } }, c.t)));
    const f = D.choicesEl.querySelector('button'); if (f) f.focus();
  }
  U.dlgNext = function () {
    const D = U.dlg; if (!D) return;
    if (!D.full) { clearInterval(D.typing); D.text.textContent = D.lines[D.i]; D.full = true; if (D.i === D.lines.length - 1) showChoices(); return; }
    if (D.i < D.lines.length - 1) { D.i++; showLine(); return; }
    if (D.choices) return; // esperar elección
    const cb = D.onEnd; U.dlgEnd(); cb && cb();
  };
  U.dlgEnd = function () { const D = U.dlg; if (!D) return; clearInterval(D.typing); U.dlg = null; $('dialog').classList.add('hidden'); G().paused = Math.max(0, G().paused - 1); };

  // ------------------------------------------------------------ CONVERSACIÓN CON NPC
  U.talk = function (id) {
    const g = G(); const s = g.state; const n = VO.NPCS[id];
    const ms = VO.MISSIONS.filter((m) => m.npc === id && (s.mode === 'aula' || m.chapter <= s.chapter));
    const active = ms.find((m) => ['action', 'notebook'].includes(s.missions[m.id].status));
    if (active) {
      const st = s.missions[active.id].status;
      if (st === 'action') return U.dialog(id, ['¿Ya pensaste cuántos? Revisa el documento con calma.'], [{ t: 'Ver el documento', fn: () => VO.Notebook.openAction(active) }, { t: 'Luego', fn: null }]);
      return U.dialog(id, ['Ya firmamos. Ahora anota el plan en tu libreta para cerrar el trato.'], [{ t: 'Abrir la libreta', fn: () => VO.Notebook.openTasks(active) }, { t: 'Luego', fn: null }]);
    }
    const av = ms.find((m) => s.missions[m.id].status === 'available');
    if (av) {
      if (av.id === 'c1_madera' && g.count('wood') < 12 && s.mode !== 'aula') return U.dialog(id, [av.intro[0], 'Cuando tengas unas 12 maderas o más, vuelve. Los árboles del bosque, al norte de tu finca, sirven. Usa el hacha.'], null, null);
      return U.dialog(id, av.intro, [{ t: 'Ver el documento', fn: () => { s.missions[av.id].status = 'action'; VO.Analytics.log({ type: 'mission_start', mission: av.id }); VO.Notebook.openAction(av); U.refreshHUD(); } }, { t: 'Ahora no', fn: null }]);
    }
    // charla
    const f = s.friendship[id] || 0;
    let line = n.lines[(s.day + f + id.length) % n.lines.length];
    if (s.weather === 'lluvia' && Math.random() < 0.5) line = '¡Qué aguacero! Al menos los cultivos se riegan solos hoy.';
    if (g.hour() >= 18 && Math.random() < 0.3) line = 'Ya se va el sol. ¿Qué tal tu día?';
    if (g.isFiesta && g.isFiesta()) { line = ['¡Esta bachata está buenísima! ¿Bailamos?', '¡Qué alegría ver la plaza llena otra vez!', 'Dicen que la próxima canción la tocó tu abuela hace años.', '¡Mira cómo baila Bruno! Ja, ja.'][(s.day + id.length) % 4]; if (s.seen['fiesta' + id] !== s.day) { s.seen['fiesta' + id] = s.day; s.friendship[id] = (s.friendship[id] || 0) + 0.5; } }
    const chats = (s.seen['chat' + id] === s.day);
    if (!chats) { s.seen['chat' + id] = s.day; s.friendship[id] = f + 0.25; }
    const choices = VO.Events ? VO.Events.talkExtras(id) : [];
    if (n.shop) choices.push({ t: { semillas: 'Comprar semillas', mercado: 'Comprar / vender', carpinteria: 'Carpintería', herreria: 'Herrería', pesca: 'Pesca', granja: 'Granja', banco: 'Banco', empleos: 'Tablón de empleos', biblioteca: 'Leer libros', alcaldia: 'Progreso del valle' }[n.shop], fn: () => U.openNPCService(id) });
    choices.push({ t: '¿Quién eres?', fn: () => U.dialog(id, n.intro || [n.bio], null) });
    choices.push({ t: 'Adiós', fn: null });
    U.dialog(id, [line], choices);
  };
  U.openNPCService = function (id) {
    const shop = VO.NPCS[id].shop;
    if (shop === 'banco') return U.openBank();
    if (shop === 'empleos') return U.openJobs();
    if (shop === 'biblioteca') return U.openLibrary();
    if (shop === 'alcaldia') return U.openJournal();
    if (shop === 'carpinteria') return U.openShop('carpinteria', true);
    if (shop === 'herreria') return U.openShop('herreria', true);
    return U.openShop(shop);
  };

  // ------------------------------------------------------------ INVENTARIO
  function invGrid(inv, onClick, cls) {
    const grid = el('div', { class: 'invgrid ' + (cls || '') });
    inv.forEach((it, i) => {
      const s = el('button', { class: 'slot' + (cls === 'main' && i === G().state.hot ? ' sel' : ''), title: it ? VO.ITEMS[it.id].name : 'Vacío', onclick: () => onClick(i) });
      if (it) { s.appendChild(itemIcon(it.id)); if (it.n > 1) s.appendChild(el('span', { class: 'n' }, it.n)); }
      if (cls === 'main' && i < 10) s.appendChild(el('span', { class: 'k' }, (i + 1) % 10));
      grid.appendChild(s);
    });
    return grid;
  }
  U.openInventory = function () {
    const g = G(); let pick = null;
    const info = el('div', { class: 'iteminfo' }, 'Haz clic en un objeto para ver su información. Haz clic en dos casillas para intercambiarlas.');
    const holder = el('div');
    const render = () => {
      holder.innerHTML = '';
      holder.appendChild(invGrid(g.state.inv, (i) => {
        const it = g.state.inv[i];
        if (pick !== null && pick !== i) { const a = g.state.inv[pick]; g.state.inv[pick] = g.state.inv[i]; g.state.inv[i] = a; pick = null; VO.Audio.sfx('menu'); VO.bus.emit('inv'); render(); return; }
        pick = it ? i : null; if (i < 10) g.state.hot = i;
        showInfo(it); render();
        if (pick !== null) holder.querySelectorAll('.slot')[i].classList.add('pick');
      }, 'main'));
    };
    const showInfo = (it) => {
      info.innerHTML = '';
      if (!it) return;
      const d = VO.ITEMS[it.id];
      info.append(el('div', { class: 'row' }, itemIcon(it.id), el('b', {}, d.name + (it.n > 1 ? ' × ' + it.n : ''))));
      if (d.tool) { const t = g.state.tools[d.tool]; const st = VO.TOOL_STATS(t.tier); info.append(el('p', {}, `Nivel: ${VO.TIER_NAMES[t.tier]} · Potencia ${st.power} · Energía por uso ${Math.max(1, Math.round(VO.TOOLS[d.tool].energy * st.energyMul))} · Durabilidad ${t.dur}/${st.maxDur}` + (d.tool === 'can' ? ' · Agua ' + t.water + '/' + st.canCap : ''))); }
      else info.append(el('p', {}, d.desc), el('p', { class: 'muted' }, 'Venta hoy: ' + g.price(it.id) + ' m' + (d.buy ? ' · Compra: ' + d.buy + ' m' : '') + (d.uses ? ' · Usos: ' + d.uses : '') + (d.energy ? ' · +' + d.energy + ' energía al comer' : '')));
      if (d.energy) info.append(el('button', { class: 'btn', onclick: () => { g.state.hot = g.state.inv.indexOf(it); U.close(); g.useTool(); } }, 'Comer'));
      if (d.cat !== 'tool') info.append(el('button', { class: 'btn', onclick: () => { U.confirm('¿Tirar ' + it.n + ' × ' + d.name + '?', () => { const i = g.state.inv.indexOf(it); g.state.inv[i] = null; VO.bus.emit('inv'); }); } }, 'Tirar'));
    };
    render();
    const toolsInfo = el('div', { class: 'muted small' }, 'Herramientas: ' + Object.keys(VO.TOOLS).map((k) => VO.TOOLS[k].name + ' ' + VO.TIER_NAMES[g.state.tools[k].tier]).join(' · '));
    U.open('Inventario', el('div', { class: 'invwrap' }, holder, info, toolsInfo), { icon: 'chest' });
  };
  U.openStorage = function (store, title) {
    const g = G();
    const box = el('div');
    const render = () => {
      box.innerHTML = '';
      box.append(el('h4', {}, title + ' (clic para mover)'), invGrid(store, (i) => { const it = store[i]; if (!it) return; const left = g.addItem(it.id, it.n); if (left) { it.n = left; U.toast('Inventario lleno.', 'warn'); } else store[i] = null; VO.Audio.sfx('menu'); render(); }),
        el('h4', {}, 'Tu inventario'), invGrid(g.state.inv, (i) => { const it = g.state.inv[i]; if (!it || VO.ITEMS[it.id].cat === 'tool') return; let n = it.n; for (const s of store) if (s && s.id === it.id) { const k = Math.min(n, 99 - s.n); s.n += k; n -= k; } for (let j = 0; j < store.length && n; j++) if (!store[j]) { store[j] = { id: it.id, n }; n = 0; } if (n) { it.n = n; U.toast('No cabe más.', 'warn'); } else g.state.inv[i] = null; VO.bus.emit('inv'); VO.Audio.sfx('menu'); render(); }));
    };
    render();
    U.open(title, box, { icon: 'chest' });
  };

  // ------------------------------------------------------------ TIENDAS
  const SHOPS = {
    semillas: { npc: 'mateo', title: 'Semillas Don Mateo', sells: Object.keys(VO.CROPS).filter((k) => k !== 'yuca' && k !== 'auyama').map((k) => 'seed_' + k), buys: ['seed'] },
    mercado: { npc: 'clara', title: 'Mercado de Clara', sells: ['coal', 'glass', 'rope', 'bait', 'wood', 'stone'], buys: ['res', 'crop', 'fish', 'food', 'mat', 'place'] },
    carpinteria: { npc: 'tomas', title: 'Carpintería de Tomás', sells: ['plank', 'fence', 'chest', 'chair', 'table', 'bookshelf', 'rug'], buys: ['res', 'mat'] },
    herreria: { npc: 'bruno', title: 'Herrería de Bruno', sells: ['coal', 'copper_bar', 'iron_bar'], buys: ['res', 'mat'] },
    pesca: { npc: 'marina', title: 'Muelle de Marina', sells: ['bait'], buys: ['fish'], bonus: 1.15 },
    granja: { npc: 'lucia', title: 'Finca de Lucía', sells: ['seed_yuca', 'seed_auyama', 'seed_habichuela', 'fiber'], buys: ['crop', 'food'] },
    bin: { npc: null, title: 'Cajón de envío (venta al 90 %)', sells: [], buys: ['res', 'crop', 'fish', 'food', 'mat', 'place', 'seed'], bonus: 0.9 },
  };
  U.openShop = function (key, extraTabs) {
    const g = G(); const sh = SHOPS[key];
    const body = el('div', { class: 'shop' });
    const tabs = el('div', { class: 'tabs' });
    const content = el('div', { class: 'tabc' });
    const tabList = [];
    if (sh.sells.length) tabList.push(['Comprar', () => buyTab(sh, content)]);
    tabList.push(['Vender', () => sellTab(sh, content)]);
    if (key === 'carpinteria') tabList.push(['Proyectos de obra', () => projectsTab(content)]);
    if (key === 'herreria') tabList.push(['Mejorar herramientas', () => upgradeTab(content)]);
    if (key === 'granja') tabList.push(['Animales', () => animalsTab(content)]);
    tabList.forEach(([t, fn], i) => tabs.appendChild(el('button', { class: 'tab' + (i === 0 ? ' on' : ''), onclick: (e) => { tabs.querySelectorAll('.tab').forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); fn(); } }, t)));
    const head = el('div', { class: 'shophead' });
    if (sh.npc) { const c = el('canvas', { class: 'portrait', width: 48, height: 48 }); c.getContext('2d').drawImage(VO.Art.portrait(VO.NPCS[sh.npc].look, 'happy'), 0, 0); head.append(c, el('div', {}, el('b', {}, VO.NPCS[sh.npc].name), el('div', { class: 'muted' }, 'Los precios cambian cada día, pero se mantienen todo el día.'))); }
    head.append(el('div', { class: 'wallet' }, icon('coin'), el('span', { id: 'shopMoney' }, g.state.money)));
    body.append(head, tabs, content);
    tabList[0][1]();
    U.open(sh.title, body, { wide: true, icon: 'coin' });
  };
  function refreshWallet() { const w = $('shopMoney'); if (w) w.textContent = G().state.money; }
  function buyTab(sh, c) {
    const g = G(); c.innerHTML = '';
    sh.sells.forEach((id) => {
      const it = VO.ITEMS[id]; const price = it.buy; let n = 1;
      const tot = el('span', { class: 'tot' }); const after = el('span', { class: 'muted small' });
      const upd = () => { tot.textContent = (price * n) + ' m'; const rest = g.state.money - price * n; after.textContent = rest >= 0 ? 'Te quedarían ' + rest + ' m' : 'Te faltan ' + (-rest) + ' m'; after.classList.toggle('bad', rest < 0); };
      const row = el('div', { class: 'shoprow' }, itemIcon(id), el('div', { class: 'grow' }, el('b', {}, it.name), el('div', { class: 'muted small' }, it.desc)), el('span', { class: 'price' }, price + ' m c/u'), qty(1, 99, 1, 1, (v) => { n = v; upd(); }), el('div', { class: 'col' }, tot, after),
        el('button', { class: 'btn ok', onclick: () => {
          if (!g.canAdd(id, n)) { U.toast('No cabe en tu inventario.', 'warn'); VO.Analytics.game('inventario_lleno', id); return; }
          if (!g.spend(price * n, 'compras')) { U.toast('No te alcanza: cuesta ' + price * n + ' y tienes ' + g.state.money + '.', 'warn'); return; }
          g.addItem(id, n); VO.Audio.sfx('buy'); U.toast('Compraste ' + n + ' × ' + it.name + '.', 'ok'); refreshWallet(); upd();
        } }, 'Comprar'));
      upd(); c.appendChild(row);
    });
  }
  function sellTab(sh, c) {
    const g = G(); c.innerHTML = '';
    const ids = [...new Set(g.state.inv.filter((s) => s && sh.buys.includes(VO.ITEMS[s.id].cat)).map((s) => s.id))];
    if (!ids.length) { c.appendChild(el('p', { class: 'muted' }, 'No tienes nada que este comercio compre.')); return; }
    ids.forEach((id) => {
      const it = VO.ITEMS[id]; const price = Math.max(1, Math.round(g.price(id) * (sh.bonus || 1))); const have = g.count(id); let n = have;
      const tot = el('span', { class: 'tot' });
      const upd = () => { tot.textContent = '+' + price * n + ' m'; };
      c.appendChild(el('div', { class: 'shoprow' }, itemIcon(id), el('div', { class: 'grow' }, el('b', {}, it.name), el('div', { class: 'muted small' }, 'Tienes ' + have)), el('span', { class: 'price' }, price + ' m c/u'), qty(1, have, have, 1, (v) => { n = v; upd(); }), tot,
        el('button', { class: 'btn ok', onclick: () => { if (g.removeItem(id, n)) { g.earn(price * n, 'ventas'); VO.Audio.sfx('sell'); VO.bus.emit('sold', { id, n }); refreshWallet(); sellTab(sh, c); } } }, 'Vender')));
      upd();
    });
  }
  function needList(needs, money) {
    const g = G(); const ul = el('ul', { class: 'needs' });
    for (const k in needs) { const ok = g.count(k) >= needs[k]; ul.appendChild(el('li', { class: ok ? 'ok' : 'bad' }, itemIcon(k), `${VO.ITEMS[k].name}: ${g.count(k)} / ${needs[k]}`)); }
    if (money) ul.appendChild(el('li', { class: g.state.money >= money ? 'ok' : 'bad' }, icon('coin'), `Monedas: ${g.state.money} / ${money}`));
    return ul;
  }
  function projectsTab(c) {
    const g = G(); c.innerHTML = '';
    VO.PROJECTS.forEach((p) => {
      const done = g.state.projects[p.id] || (p.id === 'techo' && g.state.house.roof);
      const can = !done && g.hasAll(p.needs) && g.state.money >= p.money;
      c.appendChild(el('div', { class: 'card' + (done ? ' done' : '') }, el('b', {}, p.name), el('p', { class: 'muted' }, p.desc), done ? el('p', { class: 'ok' }, '✔ Terminado') : needList(p.needs, p.money),
        done ? null : el('button', { class: 'btn ok', disabled: !can, onclick: () => {
          if (!g.spend(p.money, 'obra')) return; g.takeAll(p.needs);
          if (p.id === 'techo') g.state.house.roof = true; else g.state.projects[p.id] = true;
          if (p.id === 'gallinero') { g.addAnimal(); }
          g.rebuildValley(); VO.Audio.sfx('level'); U.toast('¡' + p.name + ' completado!', 'ok'); projectsTab(c); refreshWallet();
          VO.Analytics.log({ type: 'project', id: p.id });
        } }, can ? 'Construir' : 'Faltan materiales')));
    });
  }
  function upgradeTab(c) {
    const g = G(); c.innerHTML = '';
    c.appendChild(el('p', { class: 'muted' }, 'Mejorar aumenta la potencia y reduce la energía por uso. Reparar devuelve la durabilidad por 20 monedas.'));
    Object.keys(VO.TOOLS).forEach((k) => {
      const t = g.state.tools[k]; const next = VO.TOOL_UPGRADE[t.tier + 1]; const st = VO.TOOL_STATS(t.tier);
      const row = el('div', { class: 'shoprow' }, icon(k + t.tier), el('div', { class: 'grow' }, el('b', {}, VO.TOOLS[k].name + ' · ' + VO.TIER_NAMES[t.tier]), el('div', { class: 'muted small' }, 'Durabilidad ' + t.dur + '/' + st.maxDur)));
      row.appendChild(el('button', { class: 'btn', disabled: t.dur >= st.maxDur, onclick: () => { if (g.spend(20, 'herramientas')) { t.dur = st.maxDur; VO.Audio.sfx('craft'); refreshWallet(); upgradeTab(c); VO.bus.emit('inv'); } } }, 'Reparar (20 m)'));
      if (next) {
        const can = g.state.money >= next.money && g.count(next.mat) >= next.qty;
        row.appendChild(el('div', { class: 'col small' }, `→ ${VO.TIER_NAMES[t.tier + 1]}: ${next.money} m + ${next.qty} ${VO.ITEMS[next.mat].name.toLowerCase()} (tienes ${g.count(next.mat)})`));
        row.appendChild(el('button', { class: 'btn ok', disabled: !can, onclick: () => { if (!g.spend(next.money, 'herramientas')) return; g.removeItem(next.mat, next.qty); t.tier++; t.dur = VO.TOOL_STATS(t.tier).maxDur; VO.Audio.sfx('level'); U.toast(VO.TOOLS[k].name + ' mejorada a ' + VO.TIER_NAMES[t.tier] + '.', 'ok'); refreshWallet(); upgradeTab(c); VO.bus.emit('inv'); } }, 'Mejorar'));
      } else row.appendChild(el('span', { class: 'ok small' }, 'Nivel máximo'));
      c.appendChild(row);
    });
  }
  function animalsTab(c) {
    const g = G(); c.innerHTML = '';
    if (!g.state.projects.gallinero) { c.appendChild(el('p', {}, 'Primero necesitas un gallinero. Tomás puede construirlo (Proyectos de obra en la carpintería).')); return; }
    c.appendChild(el('p', {}, 'Tienes ' + g.state.animals.length + ' gallina(s). Llena el comedero con 4 fibras por la noche y al día siguiente pondrán huevos.'));
    c.appendChild(el('div', { class: 'shoprow' }, icon('egg'), el('div', { class: 'grow' }, el('b', {}, 'Gallina'), el('div', { class: 'muted small' }, 'Máximo 8 en el gallinero.')), el('span', { class: 'price' }, '250 m'),
      el('button', { class: 'btn ok', disabled: g.state.animals.length >= 8, onclick: () => { if (g.spend(250, 'animales')) { g.addAnimal('chicken'); VO.Audio.sfx('cluck'); refreshWallet(); animalsTab(c); } } }, 'Comprar')));
    c.appendChild(el('div', { class: 'shoprow' }, U.itemIcon('leche'), el('div', { class: 'grow' }, el('b', {}, 'Cabra'), el('div', { class: 'muted small' }, 'Da leche cada día si come. Con 2 leches haces queso en el taller.')), el('span', { class: 'price' }, '450 m'),
      el('button', { class: 'btn ok', disabled: g.state.animals.length >= 8, onclick: () => { if (g.spend(450, 'animales')) { g.addAnimal('cabra'); VO.Audio.sfx('pop'); refreshWallet(); animalsTab(c); } } }, 'Comprar')));
  }

  // ------------------------------------------------------------ FABRICACIÓN
  U.openCraft = function (station) {
    const g = G(); const c = el('div', { class: 'craft' });
    const render = () => {
      c.innerHTML = '';
      c.appendChild(el('p', { class: 'muted' }, station === 'taller' ? 'Taller familiar: fundición, ladrillos, vidrio y muebles finos.' : 'Banco de trabajo: recetas básicas.' + (g.state.projects.taller ? '' : ' Restaura el taller familiar para más recetas.')));
      VO.RECIPES.filter((r) => r.station === 'banco' || station === 'taller').forEach((r) => {
        const maxN = Math.min(...Object.keys(r.in).map((k) => Math.floor(g.count(k) / r.in[k])));
        let n = Math.max(1, Math.min(1, maxN));
        const need = el('span', { class: 'muted small' });
        const upd = () => { need.textContent = 'Usará: ' + Object.keys(r.in).map((k) => r.in[k] * n + ' ' + VO.ITEMS[k].name.toLowerCase()).join(', ') + ' · ' + r.mins * n + ' min'; };
        c.appendChild(el('div', { class: 'shoprow' }, itemIcon(r.out), el('div', { class: 'grow' }, el('b', {}, VO.ITEMS[r.out].name + (r.n > 1 ? ' × ' + r.n : '')), el('div', { class: 'small' }, Object.keys(r.in).map((k) => el('span', { class: g.count(k) >= r.in[k] ? 'ok' : 'bad' }, itemIcon(k), r.in[k] + ' (' + g.count(k) + ') '))), need),
          el('span', { class: 'small muted' }, 'Máx: ' + maxN), qty(1, Math.max(1, maxN), 1, 1, (v) => { n = v; upd(); }),
          el('button', { class: 'btn ok', disabled: maxN < 1, onclick: () => {
            if (Object.keys(r.in).some((k) => g.count(k) < r.in[k] * n)) { U.toast('Faltan materiales.', 'warn'); return; }
            if (!g.canAdd(r.out, r.n * n)) { U.toast('No cabe en el inventario.', 'warn'); return; }
            for (const k in r.in) g.removeItem(k, r.in[k] * n);
            g.addItem(r.out, r.n * n); g.advanceTime(r.mins * n); VO.Audio.sfx('craft'); U.toast('Fabricaste ' + r.n * n + ' × ' + VO.ITEMS[r.out].name + '.', 'ok'); render();
            VO.Analytics.log({ type: 'craft', id: r.out, n });
          } }, 'Fabricar')));
        upd();
      });
    };
    render();
    U.open(station === 'taller' ? 'Taller familiar' : 'Banco de trabajo', c, { wide: true, icon: 'workbench' });
  };

  // ------------------------------------------------------------ CONSTRUCCIÓN
  U.openBuild = function () {
    const g = G(); const c = el('div');
    c.appendChild(el('p', {}, 'Planos de construcción. Para colocar un objeto: selecciónalo en la barra rápida, apunta a una casilla (verás una vista previa) y pulsa Usar. Con el martillo recoges lo que colocaste.'));
    const placeables = [...new Set(g.state.inv.filter((s) => s && VO.ITEMS[s.id].cat === 'place').map((s) => s.id))];
    c.appendChild(el('h4', {}, 'Objetos colocables en tu inventario'));
    if (!placeables.length) c.appendChild(el('p', { class: 'muted' }, 'No tienes ninguno. Fabrícalos en el banco de trabajo o cómpralos en la carpintería.'));
    const row = el('div', { class: 'row wrap' });
    placeables.forEach((id) => row.appendChild(el('button', { class: 'btn', onclick: () => { const i = g.state.inv.findIndex((s) => s && s.id === id); if (i >= 10) { const hot = g.state.hot; const t = g.state.inv[hot]; g.state.inv[hot] = g.state.inv[i]; g.state.inv[i] = t; } else g.state.hot = i; VO.bus.emit('inv'); U.close(); U.toast('Apunta y pulsa Usar para colocar.', 'info'); } }, itemIcon(id), VO.ITEMS[id].name + ' × ' + g.count(id))));
    c.appendChild(row);
    c.appendChild(el('h4', {}, 'Proyectos de la finca'));
    VO.PROJECTS.forEach((p) => { const done = g.state.projects[p.id] || (p.id === 'techo' && g.state.house.roof); c.appendChild(el('div', { class: 'card' + (done ? ' done' : '') }, el('b', {}, p.name + (done ? ' ✔' : '')), el('p', { class: 'muted small' }, p.desc + (done ? '' : ' Tomás lo construye en la carpintería.')), done ? null : needList(p.needs, p.money))); });
    c.appendChild(el('div', { class: 'card' }, el('b', {}, 'Casa: ' + (g.state.house.extension ? 'ampliada' : g.state.house.roof ? 'reparada' : 'deteriorada')), el('p', { class: 'muted small' }, 'Ventanas nuevas: ' + (g.state.house.windows ? 'sí' : 'no') + ' · Extensión: ' + (g.state.house.extension ? 'sí' : 'no (misión de Tomás)'))));
    U.open('Planos y construcción', c, { wide: true, icon: 'hammer0', paper: true });
  };

  // ------------------------------------------------------------ EMPLEOS
  U.openJobs = function () {
    const g = G(); const c = el('div', { class: 'jobs' });
    let a = VO.JOBS[4], b = VO.JOBS[2];
    const cmp = el('div', { class: 'cmp' });
    const list = el('div', { class: 'joblist' });
    const pay = (j, h) => j.base + j.rate * h;
    const drawCmp = () => {
      cmp.innerHTML = '';
      const tbl = el('table', { class: 'tbl' }, el('tr', {}, el('th', {}, 'Horas'), el('th', {}, a.name), el('th', {}, b.name), el('th', {}, 'Conviene')));
      for (let h = 1; h <= 8; h++) { const pa = pay(a, h), pb = pay(b, h); tbl.appendChild(el('tr', {}, el('td', {}, h), el('td', { class: pa > pb ? 'win' : '' }, pa), el('td', { class: pb > pa ? 'win' : '' }, pb), el('td', {}, pa > pb ? 'A' : pb > pa ? 'B' : 'igual'))); }
      const cv = el('canvas', { width: 300, height: 170, class: 'chart' });
      const ctx = cv.getContext('2d'); const mx = Math.max(pay(a, 8), pay(b, 8)) * 1.1;
      chartAxes(ctx, 300, 170, 8, mx, 'horas', 'monedas');
      plotLine(ctx, 300, 170, 8, mx, (h) => pay(a, h), '#e2508a'); plotLine(ctx, 300, 170, 8, mx, (h) => pay(b, h), '#2f6fb0');
      const dr = a.rate - b.rate; let note = '';
      if (dr !== 0) { const hx = (b.base - a.base) / dr; if (hx > 0 && hx < 8) { const X = 30 + (hx / 8) * 260, Y = 150 - (pay(a, hx) / mx) * 140; ctx.fillStyle = '#2a1b12'; ctx.beginPath(); ctx.arc(X, Y, 4, 0, 6.3); ctx.fill(); note = 'Se cruzan en ' + VO.MathEngine.num(hx) + ' horas: ' + a.base + ' + ' + a.rate + 'x = ' + b.base + ' + ' + b.rate + 'x.'; } else note = 'En este rango, las rectas no se cruzan.'; }
      else note = a.base === b.base ? 'Pagan igual siempre.' : 'Las rectas son paralelas: nunca se cruzan.';
      cmp.append(el('div', { class: 'row wrap' }, el('div', {}, el('div', { class: 'legend' }, el('i', { style: 'background:#e2508a' }), 'A: ' + a.name + ' = ' + a.base + ' + ' + a.rate + 'x'), el('div', { class: 'legend' }, el('i', { style: 'background:#2f6fb0' }), 'B: ' + b.name + ' = ' + b.base + ' + ' + b.rate + 'x'), cv, el('p', { class: 'small' }, note)), tbl));
    };
    const renderList = () => {
      list.innerHTML = '';
      VO.JOBS.forEach((j) => {
        const locked = j.req && !g.state.projects[j.req];
        let h = j.min;
        const payEl = el('b', {});
        const upd = () => { payEl.textContent = 'Pago: ' + j.base + ' + ' + j.rate + ' · ' + h + ' = ' + pay(j, h) + ' m'; };
        const card = el('div', { class: 'note' + (locked ? ' locked' : '') },
          el('div', { class: 'pin' }), el('b', {}, j.name), el('div', { class: 'small' }, j.desc), el('div', { class: 'small' }, `${j.base} fijas + ${j.rate} por hora · ${j.min}–${j.max} h · ${j.open}:00 a ${j.close}:00 · energía ${j.energy}/h`),
          locked ? el('div', { class: 'bad small' }, 'Requiere el taller familiar restaurado.') : el('div', { class: 'row wrap' }, qty(j.min, j.max, j.min, 1, (v) => { h = v; upd(); }), payEl,
            el('button', { class: 'btn ok', onclick: () => work(j, h) }, 'Trabajar')),
          el('div', { class: 'row' }, el('button', { class: 'btn sm', onclick: () => { a = j; drawCmp(); } }, 'Comparar como A'), el('button', { class: 'btn sm', onclick: () => { b = j; drawCmp(); } }, 'como B')));
        upd(); list.appendChild(card);
      });
    };
    const work = (j, h) => {
      const now = g.hour();
      if (now < j.open) { U.toast('Este trabajo empieza a las ' + j.open + ':00.', 'warn'); VO.Analytics.game('horario_empleo'); return; }
      if (now + h > j.close) { U.toast('No te da tiempo: termina a las ' + j.close + ':00 y son las ' + g.clock() + '. Elige menos horas.', 'warn'); VO.Analytics.game('horario_empleo'); return; }
      if (g.state.energy < j.energy * h) { U.toast('Necesitas ' + j.energy * h + ' de energía y tienes ' + Math.round(g.state.energy) + '.', 'warn'); VO.Analytics.game('sin_energia'); return; }
      U.close();
      U.fade(() => { g.state.energy -= j.energy * h; g.advanceTime(h * 60); g.earn(pay(j, h), 'salarios'); g.state.friendship[j.npc] = (g.state.friendship[j.npc] || 0) + 0.5; VO.Audio.sfx('sell'); U.toast('Trabajaste ' + h + ' h como ' + j.name.toLowerCase() + ': +' + pay(j, h) + ' monedas.', 'ok'); VO.Analytics.log({ type: 'job', id: j.id, h }); });
    };
    renderList(); drawCmp();
    c.append(el('p', { class: 'muted' }, 'Elige un empleo y las horas. Usa “Comparar” para ver qué oferta conviene según las horas.'), list, el('h4', {}, 'Comparador de ofertas'), cmp);
    U.open('Tablón de empleos de Rafael', c, { wide: true, icon: 'notebook', paper: true });
  };
  function chartAxes(ctx, W, H, xm, ym, xl, yl) {
    ctx.fillStyle = '#fbf3de'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 1;
    for (let i = 0; i <= xm; i++) { const x = 30 + (i / xm) * (W - 40); ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, H - 20); ctx.stroke(); }
    ctx.strokeStyle = '#5a4030'; ctx.beginPath(); ctx.moveTo(30, 10); ctx.lineTo(30, H - 20); ctx.lineTo(W - 10, H - 20); ctx.stroke();
    ctx.fillStyle = '#5a4030'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= xm; i += Math.max(1, Math.round(xm / 8))) ctx.fillText(i, 30 + (i / xm) * (W - 40), H - 8);
    ctx.textAlign = 'left'; ctx.fillText(yl, 2, 9); ctx.textAlign = 'right'; ctx.fillText(xl, W - 4, H - 22);
    ctx.textAlign = 'right'; ctx.fillText(Math.round(ym), 28, 16);
  }
  function plotLine(ctx, W, H, xm, ym, f, col, x0) {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const x = (x0 || 0) + (i / 40) * (xm - (x0 || 0)); const X = 30 + (x / xm) * (W - 40), Y = H - 20 - (f(x) / ym) * (H - 30); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke();
  }
  U.chartAxes = chartAxes; U.plotLine = plotLine;

  // ------------------------------------------------------------ BANCO
  U.openBank = function () {
    const g = G(); const s = g.state; const c = el('div', { class: 'bank' });
    const tabs = el('div', { class: 'tabs' }); const tc = el('div', { class: 'tabc' });
    const T = [['Simulador de préstamo', loanTab], ['Ahorro', saveTab], ['Mis préstamos', myLoans], ['¿Cómo funciona?', explain]];
    T.forEach(([t, fn], i) => tabs.appendChild(el('button', { class: 'tab' + (i ? '' : ' on'), onclick: (e) => { tabs.querySelectorAll('.tab').forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); fn(); } }, t)));
    function explain() {
      tc.innerHTML = '';
      tc.append(el('p', {}, el('b', {}, 'Capital (C): '), 'el dinero que pides o depositas.'), el('p', {}, el('b', {}, 'Tasa (r): '), 'el porcentaje que se cobra o paga cada semana.'), el('p', {}, el('b', {}, 'Tiempo (t): '), 'cuántas semanas dura.'),
        el('p', {}, el('b', {}, 'Interés simple: '), 'I = C · r · t. Cada semana se suma la misma cantidad.'), el('p', {}, el('b', {}, 'Monto: '), 'M = C + I. Es lo que se devuelve (o lo que recibes al final).'),
        el('p', { class: 'muted' }, 'Elena: “Un préstamo nunca es obligatorio. Trabajar, vender y ahorrar también te hacen avanzar.”'));
    }
    function loanTab() {
      tc.innerHTML = '';
      let C = 1000, r = 2, t = 5;
      const out = el('div'); const cv = el('canvas', { width: 320, height: 170, class: 'chart' });
      const draw = () => {
        const I = C * r / 100 * t, M = C + I;
        out.innerHTML = '';
        out.append(el('p', {}, `I = ${C} · ${r / 100} · ${t} = `, el('b', {}, VO.MathEngine.num(I)), ` monedas · M = ${C} + ${VO.MathEngine.num(I)} = `, el('b', {}, VO.MathEngine.num(M))),
          el('p', { class: 'muted small' }, `Recta del monto: M = ${C} + ${VO.MathEngine.num(C * r / 100)}t. Cada semana se agregan ${VO.MathEngine.num(C * r / 100)} monedas.`));
        const ctx = cv.getContext('2d'); const ym = C * (1 + r / 100 * 10) * 1.05;
        chartAxes(ctx, 320, 170, 10, ym, 'semanas', 'monto');
        plotLine(ctx, 320, 170, 10, ym, (x) => C + C * r / 100 * x, '#c2453a');
        plotLine(ctx, 320, 170, 10, ym, () => C, '#5a8a3a');
        const X = 30 + (t / 10) * 280, Y = 150 - (M / ym) * 140; ctx.fillStyle = '#2a1b12'; ctx.beginPath(); ctx.arc(X, Y, 4, 0, 6.3); ctx.fill();
      };
      tc.append(el('div', { class: 'row wrap' }, el('label', {}, 'Capital ', qty(100, 3000, C, 100, (v) => { C = v; draw(); })), el('label', {}, 'Tasa semanal % ', qty(1, 5, r, 1, (v) => { r = v; draw(); })), el('label', {}, 'Semanas ', qty(1, 10, t, 1, (v) => { t = v; draw(); }))), cv, out,
        el('div', { class: 'row' }, el('button', { class: 'btn ok', onclick: () => U.confirm(`¿Pedir ${C} monedas y devolver ${VO.MathEngine.num(C + C * r / 100 * t)} en ${t} semanas?`, () => { s.loans.push({ C, r, t, start: s.day, paid: false, M: C + C * r / 100 * t }); g.earn(C, 'prestamo'); U.toast('Préstamo aprobado. Puedes pagarlo cuando quieras en “Mis préstamos”.', 'ok'); VO.Analytics.log({ type: 'loan', C, r, t }); }) }, 'Solicitar este préstamo (opcional)')));
      draw();
    }
    function myLoans() {
      tc.innerHTML = '';
      const open = s.loans.filter((l) => !l.paid);
      if (!open.length) tc.appendChild(el('p', { class: 'muted' }, 'No tienes préstamos activos.'));
      open.forEach((l) => {
        const weeks = Math.max(1, Math.ceil((s.day - l.start) / 7)); const due = l.C + l.C * l.r / 100 * Math.min(weeks, l.t);
        tc.appendChild(el('div', { class: 'card' }, el('b', {}, 'Préstamo de ' + l.C + ' al ' + l.r + ' % semanal por ' + l.t + ' semanas'), el('p', {}, 'Si pagas hoy (semana ' + weeks + '): ' + VO.MathEngine.num(due) + ' monedas. ' + (l.late ? 'El plazo ya pasó: el interés no sigue creciendo, pero conviene pagar pronto.' : 'Pagar antes cuesta menos.')),
          el('button', { class: 'btn ok', onclick: () => { if (g.spend(due, 'prestamo')) { l.paid = true; VO.Audio.sfx('good'); U.toast('Préstamo pagado.', 'ok'); myLoans(); } else U.toast('No tienes suficiente dinero todavía.', 'warn'); } }, 'Pagar ' + VO.MathEngine.num(due))));
      });
    }
    function saveTab() {
      tc.innerHTML = '';
      const sv = s.savings;
      if (sv) {
        const weeks = Math.floor((s.day - sv.start) / 7); const M = sv.C + sv.C * 0.01 * weeks;
        tc.append(el('p', {}, `Depositaste ${sv.C} el día ${sv.start}. Han pasado ${weeks} semana(s) completas al 1 %.`), el('p', {}, `M = ${sv.C} + ${sv.C} · 0,01 · ${weeks} = `, el('b', {}, VO.MathEngine.num(M))),
          el('button', { class: 'btn ok', onclick: () => { s.savings = null; g.earn(Math.round(M), 'ahorro'); U.toast('Retiraste ' + Math.round(M) + ' monedas.', 'ok'); saveTab(); } }, 'Retirar todo'));
      } else {
        let C = Math.min(500, s.money);
        tc.append(el('p', {}, 'La cuenta de ahorro paga 1 % semanal de interés simple sobre lo depositado.'), el('label', {}, 'Depositar ', qty(50, Math.max(50, s.money), Math.max(50, C), 50, (v) => (C = v))),
          el('button', { class: 'btn ok', onclick: () => { if (g.spend(C, 'ahorro')) { s.savings = { C, start: s.day }; U.toast('Depósito realizado.', 'ok'); saveTab(); } } }, 'Depositar'));
      }
    }
    loanTab();
    c.append(tabs, tc);
    U.open('Banco del Valle · Elena', c, { wide: true, icon: 'coin' });
  };

  // ------------------------------------------------------------ CORREO, BIBLIOTECA
  U.openMail = function () {
    const s = G().state; const c = el('div');
    const msgs = [{ from: 'Alcaldía', t: 'Bienvenida', b: 'Querido vecino: la finca de tu familia vuelve a tener vida. El programa de revitalización te apoyará con fondos para cada proyecto. ¡Pasa por la plaza! — Andrés' }];
    if (s.day > 1) msgs.push({ from: 'Lucía', t: 'Consejo', b: 'Riega cada día tus cultivos. Si llueve, el cielo lo hace por ti. ¡Y no te olvides de dormir!' });
    if (s.chapter >= 3) msgs.push({ from: 'Rafael', t: 'Nuevos empleos', b: 'Hay ofertas nuevas en el tablón de la plaza. ¡Compara antes de elegir!' });
    if (s.chapter >= 5) msgs.push({ from: 'Elena', t: 'Banco del Valle', b: 'El banco ya abrió. Puedes simular préstamos sin compromiso.' });
    msgs.reverse().forEach((m) => c.appendChild(el('div', { class: 'card' }, el('b', {}, m.t + ' — ' + m.from), el('p', {}, m.b))));
    U.open('Buzón', c, { paper: true, icon: 'notebook' });
  };
  U.openLibrary = function () {
    const c = el('div', { class: 'library' });
    const view = el('div', { class: 'book' }, el('p', { class: 'muted' }, 'Elige un libro de la estantería.'));
    const shelf = el('div', { class: 'shelf' });
    VO.BOOKS.forEach((b, i) => shelf.appendChild(el('button', { class: 'bookbtn c' + (i % 5), onclick: () => { view.innerHTML = ''; view.append(el('h4', {}, b.t), el('p', {}, b.b)); VO.Analytics.log({ type: 'read', book: i }); VO.Audio.sfx('menu'); } }, b.t)));
    c.append(shelf, view);
    U.open('Biblioteca de Sofía', c, { wide: true, icon: 'notebook', paper: true });
  };

  // ------------------------------------------------------------ MAPA
  U.openMap = function () {
    const g = G(); const m = g.maps.valle;
    const sc = 4; const cv = el('canvas', { width: m.w * sc, height: m.h * sc, class: 'mapcv' });
    const ctx = cv.getContext('2d');
    const col = { 0: '#5fae3c', 1: '#3d7f2c', 2: '#c79a5e', 3: '#b8a68a', 4: '#ecd59c', 5: '#3a97cf', 6: '#2a72ad', 7: '#a9784a', 8: '#a86f3c', 9: '#7a6450', 13: '#d39a66', 15: '#a86f3c' };
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { ctx.fillStyle = col[m.get(x, y)] || '#000'; ctx.fillRect(x * sc, y * sc, sc, sc); }
    m.objs.forEach((o, k) => { if (o.kind === 'node' && ['tree', 'pine', 'palm', 'mangotree'].includes(o.type)) { ctx.fillStyle = '#2a5a22'; ctx.fillRect((k % m.w) * sc + 1, ((k / m.w) | 0) * sc + 1, 2, 2); } });
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    m.buildings.forEach((b) => { ctx.fillStyle = b.roof; ctx.fillRect(b.x * sc, b.y * sc, b.w * sc, b.h * sc); });
    const label = (t, x, y) => { ctx.fillStyle = 'rgba(40,25,15,0.75)'; const w = ctx.measureText(t).width + 6; ctx.fillRect(x - w / 2, y - 9, w, 12); ctx.fillStyle = '#fff6dd'; ctx.fillText(t, x, y); };
    m.buildings.filter((b) => !b.home).forEach((b) => label(b.name.replace('Semillas Don Mateo', 'Semillas').replace(' de Clara', '').replace(' de Tomás', '').replace(' de Bruno', ''), (b.x + b.w / 2) * sc, b.y * sc - 2));
    label('Mina', 12 * sc, 9 * sc); label('Bosque', 22 * sc, 12 * sc); label('Lago', 94 * sc, 15 * sc); label('Playa', 30 * sc, 68 * sc); label('Muelle', 71 * sc, 78 * sc); label('Plaza', 78 * sc, 47 * sc); label('Tablón', 72 * sc, 37 * sc);
    g.npcs.forEach((n) => { if (n.hidden) return; ctx.fillStyle = '#fff'; ctx.fillRect(n.x / 16 * sc - 2, n.y / 16 * sc - 2, 4, 4); });
    const px = (g.map.id === 'valle' ? g.player.x / 16 : 17) * sc, py = (g.map.id === 'valle' ? g.player.y / 16 : 31) * sc;
    ctx.fillStyle = '#e8452f'; ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.3); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    U.open('Mapa del Valle de las Oportunidades', el('div', { class: 'mapwrap' }, cv, el('p', { class: 'muted small' }, 'Punto rojo: tú. Puntos blancos: vecinos. Las tiendas abren de 8:00 a 18:00; el banco de 9:00 a 17:00.')), { wide: true, icon: 'notebook', paper: true });
  };

  // ------------------------------------------------------------ DIARIO
  U.openJournal = function () {
    const s = G().state; const c = el('div', { class: 'journal' });
    VO.CHAPTERS.forEach((ch) => {
      const ms = VO.MISSIONS.filter((m) => m.chapter === ch.n);
      const locked = s.mode !== 'aula' && ch.n > s.chapter;
      const sec = el('div', { class: 'card' + (locked ? ' locked' : '') }, el('b', {}, 'Capítulo ' + ch.n + ': ' + ch.title), el('div', { class: 'muted small' }, ch.goal));
      if (!locked) ms.forEach((m) => {
        const st = s.missions[m.id];
        const lab = { locked: 'Bloqueada', available: 'Disponible', action: 'En curso: documento', notebook: 'En curso: libreta', done: 'Completada ✔' }[st.status];
        if (s.mode === 'aula' && st.status === 'locked') return;
        sec.appendChild(el('div', { class: 'mrow ' + st.status }, el('span', {}, m.title + ' · ' + VO.NPCS[m.npc].name), el('span', { class: 'small' }, lab),
          st.status === 'done' ? el('button', { class: 'btn sm', onclick: () => VO.Notebook.openReview(m) }, 'Repasar') : null));
      });
      c.appendChild(sec);
    });
    if (VO.Events) c.appendChild(VO.Events.neighborsCard());
    if (VO.MiniQuests) c.appendChild(VO.MiniQuests.journalCard());
    c.appendChild(el('div', { class: 'card' }, el('b', {}, 'Proyectos del hogar'), el('div', {}, 'Techo: ' + (s.house.roof ? '✔' : 'pendiente') + ' · Ventanas: ' + (s.house.windows ? '✔' : 'pendiente') + ' · Extensión: ' + (s.house.extension ? '✔' : 'pendiente') + ' · Taller: ' + (s.projects.taller ? '✔' : 'pendiente') + ' · Gallinero: ' + (s.projects.gallinero ? '✔' : 'pendiente'))));
    U.open('Diario de misiones', c, { wide: true, icon: 'notebook', paper: true });
  };

  // ------------------------------------------------------------ ESTADÍSTICAS
  U.openStats = function () {
    const s = G().state; const c = el('div', { class: 'stats' });
    const net = s.stats.income - s.stats.expense;
    c.append(el('div', { class: 'row wrap kpis' }, kpi('Ingresos totales', s.stats.income, 'ok'), kpi('Costos totales', s.stats.expense, 'bad'), kpi('Beneficio neto', net, net >= 0 ? 'ok' : 'bad'), kpi('Dinero actual', s.money)));
    const days = s.stats.days.slice(-10);
    const cv = el('canvas', { width: 420, height: 180, class: 'chart' }); const ctx = cv.getContext('2d');
    const mx = Math.max(50, ...days.map((d) => Math.max(d.income, d.expense)));
    ctx.fillStyle = '#fbf3de'; ctx.fillRect(0, 0, 420, 180); ctx.fillStyle = '#5a4030'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    days.forEach((d, i) => { const x = 20 + i * 40; const hi = (d.income / mx) * 140, he = (d.expense / mx) * 140; ctx.fillStyle = '#5a9a3a'; ctx.fillRect(x, 160 - hi, 14, hi); ctx.fillStyle = '#c2453a'; ctx.fillRect(x + 15, 160 - he, 14, he); ctx.fillStyle = '#5a4030'; ctx.fillText('D' + d.day, x + 15, 174); });
    c.append(el('h4', {}, 'Ingresos (verde) y costos (rojo) por día'), cv);
    const tbl = el('table', { class: 'tbl' }, el('tr', {}, el('th', {}, 'Categoría'), el('th', {}, 'Ingresos'), el('th', {}, 'Costos'), el('th', {}, 'Neto')));
    const names = { ventas: 'Ventas', compras: 'Compras', salarios: 'Salarios', mision: 'Misiones', obra: 'Obra', herramientas: 'Herramientas', prestamo: 'Préstamos', ahorro: 'Ahorro', animales: 'Animales', recompensa: 'Recompensas' };
    for (const k in s.stats.byCat) { const v = s.stats.byCat[k]; tbl.appendChild(el('tr', {}, el('td', {}, names[k] || k), el('td', {}, v.inc), el('td', {}, v.exp), el('td', { class: v.inc - v.exp >= 0 ? 'win' : 'bad' }, v.inc - v.exp))); }
    c.append(el('h4', {}, 'Por categoría'), tbl, el('p', { class: 'muted small' }, 'Ingreso: dinero que entra. Costo: dinero que sale. Beneficio neto = ingresos − costos. Los préstamos son ingresos ahora, pero se devuelven con interés.'));
    U.open('Estadísticas económicas', c, { wide: true, icon: 'coin', paper: true });
  };
  function kpi(t, v, cls) { return el('div', { class: 'kpi ' + (cls || '') }, el('div', { class: 'small muted' }, t), el('b', {}, (v < 0 ? '−' : '') + Math.abs(v).toLocaleString('es-DO') + ' m')); }

  // ------------------------------------------------------------ RESUMEN DEL DÍA
  U.daySummary = function (rec) {
    const s = G().state;
    const c = el('div', { class: 'summary' }, el('p', {}, 'Termina el día ' + rec.day + '. Amanece el día ' + s.day + ' (' + { sol: 'soleado', nublado: 'nublado', lluvia: 'lluvioso: tus cultivos se regarán solos' }[s.weather] + ').'),
      el('div', { class: 'row wrap kpis' }, kpi('Ingresos', rec.income, 'ok'), kpi('Costos', rec.expense, 'bad'), kpi('Beneficio neto', rec.income - rec.expense, rec.income - rec.expense >= 0 ? 'ok' : 'bad')),
      el('p', { class: 'muted small' }, 'Partida guardada automáticamente.'),
      el('div', { class: 'row end' }, el('button', { class: 'btn ok', onclick: () => U.close() }, '¡A trabajar!')));
    U.open('Buenos días', c, { paper: true, icon: 'coin' });
  };

  // ------------------------------------------------------------ MENÚ / AJUSTES / GUARDADO
  U.openMenu = function () {
    const top = U.stack[U.stack.length - 1];
    if (top && top.isMenu) { U.close(); return; }
    if (U.stack.length || U.dlg) return;
    const c = el('div', { class: 'menu' });
    c.append(
      el('button', { class: 'btn big', onclick: () => { U.close(); } }, 'Continuar'),
      el('button', { class: 'btn big', onclick: () => { U.close(); U.openSaves(); } }, 'Guardar / cargar'),
      el('button', { class: 'btn big', onclick: () => { U.close(); U.openSettings(); } }, 'Configuración'),
      el('button', { class: 'btn big', onclick: () => { U.close(); U.openStats(); } }, 'Estadísticas'),
      el('button', { class: 'btn big', onclick: () => { U.close(); VO.Analytics.studentInfo(); } }, 'Mi registro de aprendizaje'),
      el('button', { class: 'btn big', onclick: () => { U.close(); U.openHelp(); } }, 'Controles y ayuda'),
      el('button', { class: 'btn big', onclick: () => U.confirm('¿Volver al menú principal? Lo no guardado se perderá.', () => location.reload()) }, 'Menú principal'));
    U.open('Pausa', c, { icon: 'notebook' }); U.stack[U.stack.length - 1].isMenu = true;
  };
  U.openHelp = function () {
    const k = VO.Settings.keys; const n = (x) => (x === ' ' ? 'Espacio' : x.toUpperCase());
    U.open('Controles', el('div', {},
      el('p', {}, `Moverse: ${n(k.up)} ${n(k.left)} ${n(k.down)} ${n(k.right)} o flechas · Correr: Mayús`),
      el('p', {}, `Usar herramienta u objeto: ${n(k.use)} o clic izquierdo · Hablar / interactuar: ${n(k.interact)} o clic derecho`),
      el('p', {}, `Barra rápida: 1–0 o rueda del ratón · Inventario ${n(k.inv)} · Mapa ${n(k.map)} · Diario ${n(k.journal)} · Libreta ${n(k.notebook)} · Pausa Esc`),
      el('p', {}, 'En pantallas táctiles: palanca a la izquierda, botones Usar y Hablar a la derecha.'),
      el('p', { class: 'muted' }, 'Consejo: los signos ! sobre los vecinos indican que tienen algo para ti.')), { paper: true });
  };
  U.openSettings = function () {
    const S = VO.Settings; const c = el('div', { class: 'settings' });
    const range = (lab, key) => el('label', { class: 'set' }, lab, el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: S[key], oninput: (e) => { S[key] = +e.target.value; S.save(); } }));
    const check = (lab, key) => el('label', { class: 'set' }, el('input', { type: 'checkbox', checked: S[key] ? 'checked' : null, onchange: (e) => { S[key] = e.target.checked; S.save(); } }), lab);
    const select = (lab, key, opts) => { const sel = el('select', { onchange: (e) => { S[key] = isNaN(+e.target.value) ? e.target.value : +e.target.value; S.save(); } }); opts.forEach(([v, t]) => sel.appendChild(el('option', { value: v, selected: String(S[key]) === String(v) ? 'selected' : null }, t))); return el('label', { class: 'set' }, lab, sel); };
    c.append(range('Volumen de la música', 'music'), range('Volumen de los efectos', 'sfx'),
      select('Tamaño del texto', 'text', [[0.9, 'Pequeño'], [1, 'Normal'], [1.2, 'Grande'], [1.4, 'Muy grande']]),
      select('Zoom del mundo', 'zoom', [[0, 'Automático'], [2, 'Lejos (2×)'], [4, 'Cerca (4×)'], [6, 'Muy cerca (6×)']]),
      select('Controles táctiles', 'touch', [['auto', 'Automático'], ['on', 'Siempre'], ['off', 'Nunca']]),
      check('Alto contraste', 'contrast'), check('Reducir animaciones', 'reduceMotion'));
    const keys = el('div', { class: 'keys' }, el('h4', {}, 'Controles (clic para cambiar)'));
    Object.keys(S.keys).forEach((k) => { const b = el('button', { class: 'btn sm' }, S.keys[k] === ' ' ? 'Espacio' : S.keys[k]); b.onclick = () => { b.textContent = 'Pulsa una tecla…'; VO.Input.rebind = (key) => { const clash = Object.keys(S.keys).find((o) => o !== k && S.keys[o] === key); if (clash) { U.toast('Esa tecla ya se usa para “' + VO.KEY_NAMES[clash] + '”.', 'warn'); b.textContent = S.keys[k] === ' ' ? 'Espacio' : S.keys[k]; return; } S.keys[k] = key; S.save(); b.textContent = key === ' ' ? 'Espacio' : key; }; }; keys.appendChild(el('div', { class: 'row' }, el('span', { class: 'grow' }, VO.KEY_NAMES[k]), b)); });
    c.append(keys);
    U.open('Configuración', c, { wide: true, icon: 'notebook' });
  };
  U.openSaves = function () {
    const c = el('div');
    const render = () => {
      c.innerHTML = '';
      for (let i = 1; i <= 3; i++) {
        let meta = null; try { meta = JSON.parse(localStorage.getItem('valle_slot_' + i + '_meta') || 'null'); } catch (e) { meta = null; }
        c.appendChild(el('div', { class: 'card row' }, el('div', { class: 'grow' }, el('b', {}, 'Ranura ' + i), el('div', { class: 'small muted' }, meta ? `Día ${meta.day} · ${meta.money} m · Capítulo ${meta.chapter} · ${meta.mode === 'aula' ? 'Modo aula' : 'Modo historia'} · ${new Date(meta.when).toLocaleString('es-DO')}` : 'Vacía')),
          VO.G.running ? el('button', { class: 'btn ok', onclick: () => { VO.G.save(i); render(); } }, 'Guardar aquí') : null,
          meta ? el('button', { class: 'btn', onclick: () => { U.closeAll(); if (VO.Title) VO.Title.stop(); VO.G.loadSlot(i); } }, 'Cargar') : null,
          meta ? el('button', { class: 'btn sm', onclick: () => U.confirm('¿Borrar la ranura ' + i + '?', () => { localStorage.removeItem('valle_slot_' + i); localStorage.removeItem('valle_slot_' + i + '_meta'); render(); }) }, 'Borrar') : null));
      }
    };
    render();
    if (VO.DB && VO.DB.enabled()) {
      const code = el('input', { type: 'text', class: 'qty', placeholder: 'EST-XXXXX' }), key = el('input', { type: 'text', class: 'qty', placeholder: 'Clave personal' }), sl = el('input', { type: 'number', class: 'qty', min: 1, max: 3, value: 1 });
      const msg = el('div', { class: 'small' });
      c.appendChild(el('div', { class: 'card' }, el('b', {}, 'Continuar desde otra computadora (clase ' + VO.DB.cfg().clase + ')'), el('p', { class: 'small muted' }, 'Escribe tu código y tu clave personal (los ves en Pausa → Mi registro de aprendizaje).'),
        el('div', { class: 'row wrap' }, code, key, el('label', { class: 'small' }, 'Ranura ', sl), el('button', { class: 'btn ok', onclick: async () => {
          msg.textContent = 'Buscando…';
          try { const st = await VO.DB.loadGame(code.value.trim(), key.value.trim(), +sl.value || 1); if (!st) { msg.textContent = 'No hay partida guardada con esos datos.'; return; } st.slot = +sl.value || 1; st.token = key.value.trim(); U.closeAll(); if (VO.Title) VO.Title.stop(); VO.G.start(st); U.toast('Partida cargada desde la nube.', 'ok'); }
          catch (e) { msg.textContent = e.message; msg.className = 'warn small'; }
        } }, 'Cargar')), msg));
    }
    U.open('Guardar y cargar', c, { wide: true, icon: 'chest' });
  };
})();
