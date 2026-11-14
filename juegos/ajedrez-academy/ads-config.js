// ───── CONFIGURACIÓN DE ANUNCIOS (Google AdSense) ─────
// 1) Cuando AdSense apruebe tu sitio, pega aquí tu ID de editor (empieza por "ca-pub-").
// 2) Crea un bloque de anuncios «Display» en AdSense y pega su número en "default".
//    (Opcional: un bloque distinto por pantalla en las otras claves.)
// 3) Guarda. Mientras client esté vacío, la web no muestra ningún anuncio.
window.__ADS__ = {
  client: "",
  slots: {
    "default": "",
    "inicio": "",
    "aperturas": "",
    "partidas": "",
    "fin-leccion": "",
    "tactica": ""
  }
};
// ─── No hace falta tocar nada debajo de esta línea ───
if (window.__ADS__.client) {
  var s = document.createElement('script');
  s.async = true; s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + window.__ADS__.client;
  document.head.appendChild(s);
}
