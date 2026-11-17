/* Ajedrez Academy · retoques de interfaz: cofre, personajes en el camino, Ajustes como sección
   propia, meta diaria plegada y accesos a Progreso en el móvil. */
(function () {
  'use strict';
  /* Cofre: madera con degradado, flejes y borde dorados, cerradura y destellos (sin contorno grueso).
     Lo dibuja el componente de «Misiones de hoy» (ver patch del bundle). */
  window.AA_CHEST =
    '<defs>' +
      '<linearGradient id="aa-cw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4874a"/><stop offset="1" stop-color="#a5602b"/></linearGradient>' +
      '<linearGradient id="aa-cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e79a57"/><stop offset="1" stop-color="#c47838"/></linearGradient>' +
      '<linearGradient id="aa-cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe17a"/><stop offset="1" stop-color="#f2b31d"/></linearGradient>' +
      '<radialGradient id="aa-cin" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="#fff6c2"/><stop offset="1" stop-color="#ffd24a" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<ellipse class="c-shadow" cx="32" cy="52" rx="24" ry="3.4"/>' +
    '<g class="c-base">' +
      '<rect x="7" y="27" width="50" height="23" rx="6" fill="url(#aa-cw)"/>' +
      '<rect x="7" y="43" width="50" height="7" rx="3.5" fill="#000" opacity=".12"/>' +
      '<rect x="14" y="27" width="6" height="23" fill="url(#aa-cg)"/>' +
      '<rect x="44" y="27" width="6" height="23" fill="url(#aa-cg)"/>' +
    '</g>' +
    '<rect class="c-glow" x="9" y="20" width="46" height="10" rx="5" fill="url(#aa-cin)"/>' +
    '<g class="c-lid">' +
      '<path d="M7 29v-8C7 12 18 6 32 6s25 6 25 15v8z" fill="url(#aa-cl)"/>' +
      '<path d="M14 29V11.6c1.9-1.1 3.9-2 6-2.6V29z" fill="url(#aa-cg)"/>' +
      '<path d="M44 9c2.1.6 4.1 1.5 6 2.6V29h-6z" fill="url(#aa-cg)"/>' +
      '<rect x="5" y="25.5" width="54" height="5" rx="2.5" fill="url(#aa-cg)"/>' +
      '<path d="M23 11.2c2.6-.8 5.6-1.2 9-1.2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>' +
    '</g>' +
    '<g class="c-lock"><rect x="26.5" y="24" width="11" height="13" rx="3.2" fill="url(#aa-cg)" stroke="#c98a00" stroke-width="1.3"/><circle cx="32" cy="29.3" r="1.8" fill="#7a5200"/><path d="M32 30v3.2" stroke="#7a5200" stroke-width="1.8" stroke-linecap="round"/></g>' +
    '<g class="c-spark"><path d="M55 2l1.3 3.2 3.2 1.3-3.2 1.3L55 11l-1.3-3.2-3.2-1.3 3.2-1.3z"/><path d="M7.5 8l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z"/><path d="M60 20l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"/></g>';

  /* Personaje que acompaña cada tramo del camino: el del tomo y, de vez en cuando, sus compañeros. */
  var MAIN = ['peon', 'peon', 'caballo', 'torre', 'dama', 'dama', 'dama'];
  var ALL = ['peon', 'caballo', 'torre', 'dama'];
  window.AA_CH = function (tomo, r) {
    var k = r >> 2;
    return k % 3 === 0 ? (MAIN[tomo] || 'dama') : ALL[(tomo + k) % 4];
  };

  /* Evaluar: cerca de un corte entre dos valoraciones (±0,35) se aceptan las dos */
  var EV = [[150, 1e9], [50, 150], [-50, 50], [-150, -50], [-1e9, -150]];
  window.AA_EVOK = function (n, cp) { var b = EV[n]; return !!b && cp != null && cp >= b[0] - 35 && cp <= b[1] + 35; };

  var OWN = { 'Clasificación': 'clasificacion', 'Memoria': 'memoria' };
  function goTo(label) {
    if (label === 'Ajustes') { openSettings(); return; }
    if (OWN[label]) { location.hash = OWN[label]; window.scrollTo(0, 0); return; }
    var b = Array.prototype.find.call(document.querySelectorAll('.rail .nav'), function (n) {
      return !n.classList.contains('aa-nav-set') && n.textContent.trim() === label;
    });
    if (b) b.click();
  }
  window.AA_GOTO = goTo;

  /* Ajustes: sección propia en la barra (antes estaba escondida al final de Progreso) */
  var settingsOn = false;
  function setSettings(on) {
    settingsOn = on;
    document.documentElement.classList.toggle('aa-settings', on);
    var b = document.querySelector('.aa-nav-set');
    if (b) { b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
    if (on) { var d = document.querySelector('.progress > details.settings'); if (d) d.open = true; }
  }
  function openSettings() {
    goTo('Progreso');
    setSettings(true);
    requestAnimationFrame(function () { setSettings(true); window.scrollTo(0, 0); });
  }
  var ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true"><path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1"/><circle cx="16" cy="6" r="2.4"/><circle cx="10" cy="12" r="2.4"/><circle cx="18" cy="18" r="2.4"/></svg>';
  var ICON_TROPHY = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 20h8"/></svg>';
  var ICON_EYE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  function ownNav(hash, label, icon, cls) { var li = document.createElement('li'); li.className = 'aa-own-li';
    li.innerHTML = '<button type="button" class="nav aa-nav-own ' + cls + '" data-hash="' + hash + '"><span class="nav-ico">' + icon + '</span><span class="nav-lbl">' + label + '</span></button>';
    return li; }
  function markOwn() { var h = location.hash.slice(1); document.querySelectorAll('.aa-nav-own').forEach(function (b) { b.classList.toggle('on', b.dataset.hash === h); });
    document.documentElement.classList.toggle('aa-own-page', h === 'memoria' || h === 'clasificacion'); }
  window.addEventListener('hashchange', markOwn);
  function ensureNav() {
    var ul = document.querySelector('.rail ul');
    if (!ul || ul.querySelector('.aa-nav-set')) return;
    ul.appendChild(ownNav('clasificacion', 'Clasificación', ICON_TROPHY, 'aa-nav-lb'));
    ul.appendChild(ownNav('memoria', 'Memoria', ICON_EYE, 'aa-nav-mm'));
    markOwn();
    var li = document.createElement('li');
    li.className = 'aa-sep';
    li.innerHTML = '<button type="button" class="nav aa-nav-set"><span class="nav-ico">' + ICON + '</span><span class="nav-lbl">Ajustes</span></button>';
    ul.appendChild(li);
    if (settingsOn) li.firstChild.classList.add('on');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    if (t.closest('.aa-nav-set')) { openSettings(); return; }
    var own = t.closest('.aa-nav-own'); if (own) { setSettings(false); location.hash = own.dataset.hash; window.scrollTo(0, 0); return; }
    if (t.closest('.rail .nav, .rail .brand')) setSettings(false);
    var st = t.closest('.mobile-stats');
    if (st) goTo('Progreso');
    /* Meta diaria: el selector Suave/Normal/Intensa se muestra plegado; al tocarlo se despliega */
    var g = t.closest('.dg-goals');
    if (g) {
      if (!g.classList.contains('aa-open')) { g.classList.add('aa-open'); e.stopPropagation(); }
      else if (t.closest('button')) setTimeout(function () { g.classList.remove('aa-open'); }, 0);
    } else {
      document.querySelectorAll('.dg-goals.aa-open').forEach(function (x) { x.classList.remove('aa-open'); });
    }
  }, true);
  window.addEventListener('hashchange', function () { if (location.hash !== '#progreso') setSettings(false); });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('mobile-stats')) { e.preventDefault(); goTo('Progreso'); }
  });
  new MutationObserver(function () {
    var st = document.querySelector('.mobile-stats:not([role])');
    if (st) { st.setAttribute('role', 'button'); st.setAttribute('tabindex', '0'); st.setAttribute('aria-label', 'Ver tu progreso'); st.title = 'Ver tu progreso'; }
    ensureNav();
    if (settingsOn) { var d = document.querySelector('.progress > details.settings:not([open])'); if (d) d.open = true; }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
