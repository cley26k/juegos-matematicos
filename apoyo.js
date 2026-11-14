/* Botón discreto de apoyo (Ko-fi) para todos los juegos.
   Se muestra en la esquina inferior izquierda, se puede cerrar con × y no vuelve
   a salir en esa pestaña. Va dentro de un Shadow DOM para no chocar con el CSS del juego. */
(function () {
  if (window.__apoyoKofi || window.top !== window) return;
  window.__apoyoKofi = true;
  var URL_KOFI = 'https://ko-fi.com/cleygonzalez';
  var CLAVE = 'apoyo-kofi-cerrado';
  try { if (sessionStorage.getItem(CLAVE)) return; } catch (e) {}

  function montar() {
    if (!document.body) return;
    var host = document.createElement('div');
    host.setAttribute('data-apoyo', 'kofi');
    host.style.cssText = 'position:fixed;left:12px;bottom:12px;transition:bottom .2s;z-index:2147483000;';
    var raiz = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    raiz.innerHTML =
      '<style>' +
      ':host{all:initial}' +
      '.caja{display:flex;align-items:center;gap:2px;font:700 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;opacity:.72;transition:opacity .2s,transform .2s}' +
      '.caja:hover,.caja:focus-within{opacity:1;transform:translateY(-1px)}' +
      'a{display:flex;align-items:center;gap:0;height:36px;min-width:36px;padding:0 9px;justify-content:center;border-radius:999px;background:#ff5e5b;color:#fff;text-decoration:none;box-shadow:0 3px 10px rgba(0,0,0,.28);white-space:nowrap}' +
      'a:focus-visible,button:focus-visible{outline:3px solid #ffb627;outline-offset:2px}' +
      '.tx{max-width:0;overflow:hidden;transition:max-width .3s ease}' +
      '.caja:hover .tx,.caja:focus-within .tx{max-width:220px;margin-left:6px}' +
      '.taza{font-size:17px}.caja:hover button,.caja:focus-within button{opacity:1}' +
      'button{opacity:0;transition:opacity .2s;width:22px;height:22px;border:0;border-radius:50%;background:rgba(20,18,31,.78);color:#fff;font:700 13px/1 system-ui,sans-serif;cursor:pointer;padding:0}' +
      '@media (hover:none){button{opacity:1}}' +
      '@media (prefers-reduced-motion:reduce){.caja,.tx{transition:none}}' +
      '@media print{.caja{display:none}}' +
      '</style>' +
      '<div class="caja">' +
      '<a href="' + URL_KOFI + '" target="_blank" rel="noopener" title="Apoya estos juegos gratuitos en Ko-fi">' +
      '<span class="taza" aria-hidden="true">☕</span><span class="tx">Apoyar · invítame un café</span></a>' +
      '<button type="button" aria-label="Ocultar el botón de apoyo" title="Ocultar">×</button>' +
      '</div>';
    var b = raiz.querySelector('button');
    var a = raiz.querySelector('a');
    ['pointerdown', 'mousedown', 'touchstart', 'keydown'].forEach(function (ev) {
      host.addEventListener(ev, function (e) { e.stopPropagation(); });
    });
    a.addEventListener('click', function (e) { e.stopPropagation(); });
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      try { sessionStorage.setItem(CLAVE, '1'); } catch (er) {}
      host.remove();
    });
    document.body.appendChild(host);
    // Si el juego tiene una barra fija abajo (menú, controles), el botón se sube por encima.
    function fijo(el) {
      for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        var p = getComputedStyle(el).position; if (p === "fixed" || p === "sticky") return el;
      }
      return null;
    }
    function interactivo(x, y) {
      var el = document.elementFromPoint(x, y);
      var c = el && el.closest && el.closest("button,a,input,select,textarea,label,[role=button],[onclick]");
      return c && c.getBoundingClientRect().height < 70 ? c : null;
    }
    function colocar() {
      if (!host.isConnected) return;
      var alto = window.innerHeight, base = 12;
      host.style.visibility = "hidden";
      [24, 70, 120].forEach(function (x) {
        var els = document.elementsFromPoint ? document.elementsFromPoint(x, alto - 20) : [];
        for (var i = 0; i < els.length; i++) {
          var f = fijo(els[i]); if (!f) continue;
          var r = f.getBoundingClientRect();
          if (r.height < alto * 0.4) base = Math.max(base, alto - r.top + 10);
          break;
        }
      });
      // Si donde va a quedar hay un control pequeño del juego, subirse por encima (hasta 3 veces).
      for (var n = 0; n < 3; n++) {
        var y = alto - base - 18, hit = interactivo(18, y) || interactivo(48, y) || interactivo(33, y - 14) || interactivo(33, y + 14);
        if (!hit) break;
        base = alto - hit.getBoundingClientRect().top + 6;
      }
      host.style.visibility = "";
      host.style.bottom = base + "px";
    }
    colocar(); setTimeout(colocar, 800); setInterval(colocar, 2000);
    window.addEventListener("resize", colocar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
