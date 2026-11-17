/* Ajedrez Academy · retoques de interfaz (cofre nuevo y accesos a Progreso en el móvil). */
(function () {
  'use strict';
  /* Cofre: madera con tablón, flejes metálicos, cerradura con bocallave y destellos.
     Lo dibuja el componente de «Misiones de hoy» (ver patch del bundle). */
  window.AA_CHEST =
    '<ellipse class="c-shadow" cx="32" cy="51.5" rx="23" ry="3.2"/>' +
    '<g class="c-base">' +
      '<rect class="c-wood" x="8" y="25" width="48" height="24" rx="5"/>' +
      '<path class="c-plank" d="M8 37h48"/>' +
      '<rect class="c-band" x="15" y="25" width="6" height="24"/>' +
      '<rect class="c-band" x="43" y="25" width="6" height="24"/>' +
      '<rect class="c-edge" x="8" y="25" width="48" height="24" rx="5"/>' +
    '</g>' +
    '<g class="c-lid">' +
      '<path class="c-wood-l" d="M8 27v-7C8 11.5 18 6 32 6s24 5.5 24 14v7z"/>' +
      '<path class="c-band" d="M15 27V10.3c1.8-1 3.8-1.9 6-2.5V27z"/>' +
      '<path class="c-band" d="M43 7.8c2.2.6 4.2 1.5 6 2.5V27h-6z"/>' +
      '<path class="c-edge" d="M8 27v-7C8 11.5 18 6 32 6s24 5.5 24 14v7z"/>' +
      '<path class="c-shine" d="M25 10.5c2-.4 4.4-.6 7-.6"/>' +
    '</g>' +
    '<g class="c-lock"><rect x="27" y="21.5" width="10" height="12.5" rx="2.6"/><circle class="c-key" cx="32" cy="26.5" r="1.7"/><path class="c-key" d="M32 27.5v3"/></g>' +
    '<g class="c-spark"><path d="M55 3l1.3 3.2 3.2 1.3-3.2 1.3L55 12l-1.3-3.2-3.2-1.3 3.2-1.3z"/><path d="M7.5 9l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z"/><path d="M59 21l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"/></g>';

  /* En el móvil, «Progreso» no cabe en la barra inferior: las cifras de la cabecera llevan a él. */
  function goTo(label) {
    var b = Array.prototype.find.call(document.querySelectorAll('.rail .nav'), function (n) {
      return n.textContent.trim() === label;
    });
    if (b) b.click();
  }
  window.AA_GOTO = goTo;
  document.addEventListener('click', function (e) {
    var st = e.target.closest && e.target.closest('.mobile-stats');
    if (st) goTo('Progreso');
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('mobile-stats')) { e.preventDefault(); goTo('Progreso'); }
  });
  new MutationObserver(function () {
    var st = document.querySelector('.mobile-stats:not([role])');
    if (st) { st.setAttribute('role', 'button'); st.setAttribute('tabindex', '0'); st.setAttribute('aria-label', 'Ver tu progreso'); st.title = 'Ver tu progreso'; }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
