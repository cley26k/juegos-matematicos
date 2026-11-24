'use strict';
// Utilidades compartidas. Espacio de nombres global VO (Valle de las Oportunidades).
var VO = globalThis.VO = globalThis.VO || {};

VO.TILE = 16;
VO.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
VO.lerp = (a, b, t) => a + (b - a) * t;
VO.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// Hash determinista 0..1 para variaciones visuales estables.
VO.hash = function (x, y, s) {
  let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
};

// Generador pseudoaleatorio con semilla (mulberry32).
VO.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

VO.money = (n) => Math.round(n).toLocaleString('es-DO') + ' m';

VO.el = function (tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) {
    if (c === null || c === undefined || c === false) continue;
    e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return e;
};

// append/prepend ignoran null, undefined y false (permite hijos opcionales).
if (typeof Element !== 'undefined' && !Element.prototype._voPatched) {
  for (const fn of ['append', 'prepend']) {
    const orig = Element.prototype[fn];
    Element.prototype[fn] = function (...k) { return orig.apply(this, k.filter((x) => x !== null && x !== undefined && x !== false)); };
  }
  Element.prototype._voPatched = true;
}

// Emisor de eventos mínimo.
VO.bus = {
  h: {},
  on(n, f) { (this.h[n] = this.h[n] || []).push(f); },
  emit(n, d) { (this.h[n] || []).forEach((f) => f(d)); },
};

// Colores: aclarar / oscurecer un hex.
VO.shade = function (hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt > 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
};

VO.makeCanvas = function (w, h) {
  const c = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (c) { c.width = w; c.height = h; }
  return c;
};

VO.anonId = function () {
  const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'EST-';
  for (let i = 0; i < 5; i++) s += ch[Math.floor(Math.random() * ch.length)];
  return s;
};
