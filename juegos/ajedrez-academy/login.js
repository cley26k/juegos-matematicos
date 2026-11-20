/* ═══ Ajedrez Academy · acceso con Google + código por correo ═══
   1) Inicia sesión con Google (Supabase Auth).
   2) Se envía un código al MISMO correo de Google y hay que escribirlo.
   La base de datos solo deja leer o guardar el progreso a sesiones que pasaron
   por los dos pasos (ver supabase.sql), así que saltarse esta pantalla no da
   acceso a ninguna cuenta. El progreso se sincroniza entre dispositivos. */
(function () {
  'use strict';
  var CFG = window.AA_AUTH || {};
  var DEMO = new URLSearchParams(location.search).get('demo-login');
  if (!(CFG.url && CFG.anonKey) && !DEMO) return;

  var LEN = Math.min(10, Math.max(6, CFG.codeLength || 6));
  var KEYS = ['chess-academy/v1', 'chess-academy/vet'];
  var SYNC_AT = 'chess-academy/sync-at', OWNER = 'chess-academy/owner';
  var SDK = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js',
             'https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'];
  var html = document.documentElement;
  var origSet = Storage.prototype.setItem;
  var sb = null, email = '', uid = '', unlocked = false, box = null, chip = null;

  /* ── Estilos ─────────────────────────────────────────────────────────── */
  var css = `
html.aa-lock body{overflow:hidden!important}
html.aa-lock body>*:not(#aa-login){visibility:hidden!important}
#aa-login{--a-bg:var(--bg,#f3f5f2);--a-sf:var(--surface,#fff);--a-sf2:var(--surface-2,#f6f8f5);--a-ink:var(--ink,#1d2520);--a-ink2:var(--ink-2,#5b675f);--a-ink3:var(--ink-3,#96a199);
  --a-line:var(--line,#e1e7df);--a-lined:var(--line-d,#cdd6cb);--a-g:var(--green,#2bb45c);--a-gd:var(--green-d,#1d8a44);--a-gs:var(--green-s,#e3f5e8);--a-red:#d64545;
  --a-lift:var(--lift,0 1px 0 rgba(20,40,25,.04),0 10px 24px -18px rgba(20,40,25,.28));
  position:fixed;inset:0;z-index:2147483000;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);background:var(--a-bg);color:var(--a-ink);
  font:16px/1.5 Nunito,system-ui,-apple-system,"Segoe UI",sans-serif;visibility:visible!important;overflow:auto;transition:opacity .35s ease}
#aa-login *{box-sizing:border-box}
#aa-login.aa-out{opacity:0;pointer-events:none}
#aa-login .aa-side{position:relative;overflow:hidden;isolation:isolate;color:#fff;padding:56px clamp(32px,5vw,72px);display:flex;flex-direction:column;justify-content:space-between;
  background:linear-gradient(150deg,#43d477 0%,#2bb45c 38%,#1b8a45 100%)}
#aa-login .aa-side::before{content:"";position:absolute;inset:-20px;z-index:-1;opacity:.13;background:conic-gradient(#fff 25%,transparent 0 50%,#fff 0 75%,transparent 0) 0 0/56px 56px;
  -webkit-mask:linear-gradient(200deg,#000 0%,transparent 55%);mask:linear-gradient(200deg,#000 0%,transparent 55%)}
#aa-login .aa-knight{position:absolute;right:-6%;bottom:-8%;width:min(62%,420px);z-index:-1;opacity:.17}
#aa-login .aa-mark{display:flex;align-items:center;gap:12px;font:700 1.15rem/1 "Bricolage Grotesque",Nunito,sans-serif;letter-spacing:-.01em}
#aa-login .aa-mark b{font-weight:800}
#aa-login .aa-mark svg{border-radius:16px;box-shadow:0 0 0 3px rgba(255,255,255,.9),0 10px 24px -8px rgba(0,40,15,.45)}
#aa-login .aa-side h2{font:800 clamp(2.1rem,3.6vw,3.1rem)/1.04 "Bricolage Grotesque",Nunito,sans-serif;letter-spacing:-.035em;margin:0 0 22px;max-width:12ch;text-wrap:balance}
#aa-login .aa-perks{list-style:none;margin:0;padding:0;display:grid;gap:12px;font-weight:700;font-size:1.02rem}
#aa-login .aa-perks li{display:flex;align-items:center;gap:12px}
#aa-login .aa-perks i{flex:none;width:30px;height:30px;border-radius:10px;background:rgba(255,255,255,.2);display:grid;place-items:center;box-shadow:inset 0 -2px 0 rgba(0,0,0,.08)}
#aa-login .aa-foot{font-size:.85rem;opacity:.8;font-weight:600}
#aa-login .aa-main{display:grid;place-items:center;padding:40px 24px}
#aa-login .aa-card{width:100%;max-width:420px;animation:aa-rise .5s cubic-bezier(.2,.8,.2,1) both}
#aa-login .aa-brand{display:none}
#aa-login .aa-steps{display:flex;gap:8px;list-style:none;margin:0 0 26px;padding:0;counter-reset:s}
#aa-login .aa-steps li{counter-increment:s;display:flex;align-items:center;gap:8px;font-weight:800;font-size:.86rem;color:var(--a-ink3);padding:6px 12px 6px 6px;border-radius:999px;border:1px solid var(--a-line);background:var(--a-sf);transition:color .2s,border-color .2s,background .2s}
#aa-login .aa-steps li::before{content:counter(s);width:22px;height:22px;border-radius:999px;display:grid;place-items:center;background:var(--a-sf2);color:var(--a-ink2);font-size:.78rem;transition:background .2s,color .2s}
#aa-login .aa-steps li.on{color:var(--a-ink);border-color:var(--a-lined)}
#aa-login .aa-steps li.on::before{background:var(--a-g);color:#fff}
#aa-login .aa-steps li.ok::before{content:"✓";background:var(--a-gs);color:var(--a-gd)}
#aa-login h1{font:800 clamp(1.8rem,3vw,2.25rem)/1.1 "Bricolage Grotesque",Nunito,sans-serif;letter-spacing:-.03em;margin:0 0 8px;text-wrap:balance}
#aa-login .aa-sub{color:var(--a-ink2);margin:0 0 26px;font-weight:600}
#aa-login .aa-sub b{color:var(--a-ink);font-weight:800}
#aa-login .aa-mail{display:inline-flex;align-items:center;gap:8px;max-width:100%;margin-top:8px;padding:6px 12px 6px 6px;border-radius:999px;background:var(--a-sf);border:1px solid var(--a-line);color:var(--a-ink);font-weight:800}
#aa-login .aa-mail i{flex:none;width:26px;height:26px;border-radius:999px;display:grid;place-items:center;background:var(--a-gs);color:var(--a-gd)}
#aa-login .aa-mail span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#aa-login .aa-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:12px;min-height:56px;padding:0 20px;border-radius:16px;cursor:pointer;
  font:800 1.02rem/1 Nunito,system-ui,sans-serif;border:1.5px solid var(--a-lined);border-bottom-width:4px;background:var(--a-sf);color:var(--a-ink);
  transition:transform .12s,box-shadow .15s,filter .15s,border-color .15s;box-shadow:var(--a-lift)}
#aa-login .aa-btn:hover:not(:disabled){transform:translateY(-1px);border-color:var(--a-ink3)}
#aa-login .aa-btn:active:not(:disabled){transform:translateY(2px);border-bottom-width:2px;margin-top:2px}
#aa-login .aa-btn:disabled{cursor:default;opacity:.6}
#aa-login .aa-btn:focus-visible,#aa-login .aa-link:focus-visible,#aa-login .aa-code input:focus-visible{outline:3px solid color-mix(in srgb,var(--a-g) 55%,transparent);outline-offset:2px}
#aa-login .aa-btn.pri{background:var(--a-g);border-color:var(--a-gd);color:#fff;box-shadow:none}
#aa-login .aa-btn.pri:hover:not(:disabled){filter:brightness(1.05);border-color:var(--a-gd)}
#aa-login .aa-btn svg{flex:none}
#aa-login .aa-note{display:flex;gap:10px;align-items:flex-start;margin:18px 0 0;padding:12px 14px;border-radius:14px;background:var(--a-sf2);border:1px solid var(--a-line);color:var(--a-ink2);font-size:.9rem;font-weight:600}
#aa-login .aa-note svg{flex:none;margin-top:2px;color:var(--a-gd)}
#aa-login .aa-code{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(6px,1.6vw,10px);margin:0 0 18px}
#aa-login .aa-code input{width:100%;aspect-ratio:4/5;max-height:68px;text-align:center;font:800 1.6rem/1 "Bricolage Grotesque",Nunito,sans-serif;font-variant-numeric:tabular-nums;color:var(--a-ink);
  background:var(--a-sf);border:1.5px solid var(--a-lined);border-bottom-width:4px;border-radius:14px;caret-color:var(--a-g);transition:border-color .15s,background .15s,transform .15s;padding:0}
#aa-login .aa-code input:focus{border-color:var(--a-g);outline:none;background:var(--a-sf)}
#aa-login .aa-code input.f{border-color:var(--a-gd);background:var(--a-gs)}
#aa-login .aa-code.bad input{border-color:var(--a-red);background:color-mix(in srgb,var(--a-red) 9%,var(--a-sf))}
#aa-login .aa-code.bad{animation:aa-shake .38s}
#aa-login .aa-err{min-height:1.4em;margin:0 0 14px;color:var(--a-red);font-weight:800;font-size:.92rem}
#aa-login .aa-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap}
#aa-login .aa-link{background:none;border:0;padding:6px 2px;color:var(--a-gd);font:800 .92rem Nunito,sans-serif;cursor:pointer;border-radius:8px}
#aa-login .aa-link:disabled{color:var(--a-ink3);cursor:default}
#aa-login .aa-link.mut{color:var(--a-ink2)}
#aa-login .aa-legal{margin:28px 0 0;color:var(--a-ink3);font-size:.8rem;font-weight:600}
#aa-login .aa-spin{width:22px;height:22px;border-radius:999px;border:3px solid currentColor;border-right-color:transparent;animation:aa-rot .7s linear infinite}
#aa-login .aa-wait{display:grid;place-items:center;gap:14px;color:var(--a-ink2);font-weight:700;padding:40px 0}
#aa-login .aa-wait .aa-spin{width:34px;height:34px;color:var(--a-g)}
#aa-login .aa-done{display:grid;place-items:center;gap:14px;padding:30px 0;text-align:center}
#aa-login .aa-done i{width:72px;height:72px;border-radius:24px;background:var(--a-g);display:grid;place-items:center;box-shadow:0 5px 0 var(--a-gd);animation:aa-pop .45s cubic-bezier(.3,1.6,.5,1) both}
#aa-login [hidden]{display:none!important}
#aa-login .aa-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@keyframes aa-rise{from{opacity:0;transform:translateY(14px)}}
@keyframes aa-shake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
@keyframes aa-rot{to{transform:rotate(1turn)}}
@keyframes aa-pop{from{transform:scale(.4);opacity:0}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #aa-login .aa-side{background:linear-gradient(150deg,#2c9b55 0%,#1d7a40 45%,#124d29 100%)}}
:root[data-theme="dark"] #aa-login .aa-side{background:linear-gradient(150deg,#2c9b55 0%,#1d7a40 45%,#124d29 100%)}
@media (max-width:899px){
  #aa-login{grid-template-columns:1fr;grid-template-rows:auto 1fr}
  #aa-login .aa-side{padding:22px 22px 26px;min-height:0;gap:18px;justify-content:flex-start}
  #aa-login .aa-side h2{font-size:1.75rem;margin:0;max-width:16ch}
  #aa-login .aa-perks,#aa-login .aa-foot{display:none}
  #aa-login .aa-knight{width:190px;right:-24px;bottom:-40px}
  #aa-login .aa-main{place-items:start center;padding:28px 18px 36px}
}
@media (prefers-reduced-motion:reduce){#aa-login *,#aa-login{animation:none!important;transition:none!important}}
#aa-login .aa-hint{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,#1cb0f6 13%,var(--a-sf));color:var(--a-ink);font:700 .86rem/1.4 Nunito,system-ui,sans-serif}
#aa-chip{position:relative;z-index:30;width:100%;margin-top:auto;font:800 .92rem/1.2 Nunito,system-ui,sans-serif}
.rail #aa-chip + .theme-btn{margin-top:10px}
#aa-chip .aa-go{display:none;gap:8px;margin:0 0 10px}
#aa-chip .aa-go button{flex:1;min-height:40px;border-radius:12px;border:1px solid var(--line,#e1e7df);background:var(--surface-2,#f6f8f5);color:var(--ink,#1d2520);font:800 .86rem Nunito,sans-serif;cursor:pointer}
#aa-chip .aa-who{width:100%;display:flex;align-items:center;gap:10px;padding:7px 12px 7px 7px;border-radius:16px;cursor:pointer;color:var(--ink,#1d2520);background:var(--surface,#fff);
  border:1px solid var(--line,#e1e7df);border-bottom:3px solid var(--line-d,#cdd6cb);box-shadow:var(--lift,0 10px 24px -18px rgba(20,40,25,.28));font:inherit;text-align:left}
#aa-chip .aa-who:hover{border-color:var(--line-d,#cdd6cb)}
#aa-chip .aa-who:focus-visible{outline:3px solid color-mix(in srgb,var(--green,#2bb45c) 55%,transparent);outline-offset:2px}
#aa-chip .aa-av{flex:none;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--green,#2bb45c);color:#fff;font-size:.95rem;overflow:hidden}
#aa-chip .aa-av img{width:100%;height:100%;object-fit:cover}
#aa-chip .aa-lbl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#aa-chip .aa-dot{flex:none;width:8px;height:8px;border-radius:999px;background:var(--green,#2bb45c);box-shadow:0 0 0 3px color-mix(in srgb,var(--green,#2bb45c) 22%,transparent)}
#aa-chip .aa-dot.wait{background:#e0a400;box-shadow:0 0 0 3px rgba(224,164,0,.22)}#aa-chip .aa-dot.err{background:#d64545;box-shadow:0 0 0 3px rgba(214,69,69,.22)}
#aa-chip .aa-menu{position:absolute;left:0;bottom:calc(100% + 8px);width:244px;padding:8px;border-radius:16px;background:var(--surface,#fff);color:var(--ink,#1d2520);border:1px solid var(--line,#e1e7df);box-shadow:0 18px 40px -16px rgba(0,0,0,.35);z-index:60;animation:aa-mnu .14s ease}
@keyframes aa-mnu{from{opacity:0;transform:translateY(4px)}}
#aa-chip .aa-menu[hidden]{display:none}
#aa-chip .aa-mh{display:flex;align-items:center;gap:10px;padding:6px 6px 10px}
#aa-chip .aa-mh .aa-av{width:36px;height:36px;border-radius:50%}
#aa-chip .aa-mt{display:flex;flex-direction:column;min-width:0}
#aa-chip .aa-mt b{font-size:.92rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#aa-chip .aa-em{display:block;font-size:.76rem;font-weight:700;color:var(--ink-3,#96a199);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#aa-chip .aa-state{display:flex;align-items:center;gap:8px;margin:0;padding:8px 8px 10px;border-top:1px solid var(--line,#e1e7df);color:var(--ink-3,#96a199);font-size:.78rem;font-weight:700}
#aa-chip .aa-state .aa-dot{width:7px;height:7px;box-shadow:none}
#aa-chip .aa-exit{width:100%;display:flex;align-items:center;gap:8px;padding:9px 8px;border:0;border-radius:10px;background:none;color:var(--ink-2,#5b675f);font:800 .86rem Nunito,sans-serif;cursor:pointer;text-align:left}
#aa-chip .aa-exit svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
#aa-chip .aa-exit:hover{background:color-mix(in srgb,#d64545 10%,transparent);color:#d64545}
@media (max-width:899px){#aa-chip{width:auto;margin:0 0 0 8px;flex:none}
  #aa-chip .aa-who{padding:3px;border-radius:13px;gap:0}#aa-chip .aa-lbl,#aa-chip .aa-who>.aa-dot{display:none}
  #aa-chip .aa-menu{left:auto;right:0;bottom:auto;top:calc(100% + 10px);width:min(280px,calc(100vw - 24px))}
  #aa-chip .aa-go{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;margin:0;padding:4px 0 6px;border-top:1px solid var(--line,#e1e7df)}#aa-chip .aa-go button{min-height:36px;border:0;background:none;text-align:left;padding:0 8px;font-size:.84rem;color:var(--ink-2,#5b675f)}#aa-chip .aa-go button:hover{background:var(--surface-2,#f6f8f5);color:var(--ink,#1d2520)}
  .rail:has(#aa-chip) .theme-btn{display:none}
  .mobile-stats{cursor:pointer;border-radius:12px}}
`;
  var styleEl = document.createElement('style');
  styleEl.id = 'aa-login-css';
  styleEl.textContent = css;
  (document.head || html).appendChild(styleEl);
  html.classList.add('aa-lock');

  /* ── Dibujos ─────────────────────────────────────────────────────────── */
  var KNIGHT = 'M20 51 C20 45 22.5 39.5 28.5 33.5 C26.5 34.5 24 34.5 22.3 32.6 C21 34.4 19 35.2 16.8 35 L13.6 34.8 C11.2 34.6 9.9 32.6 10.6 30.4 L12.3 25 C13.8 18.8 17.6 14.3 22.6 12.3 L23.6 7.8 C23.8 7 24.8 6.8 25.3 7.5 L28.2 11.2 C35.4 11.6 41 16.6 43.6 24.4 C45.4 30 46.2 38 46 51 Z';
  function logo(n, id) {
    return '<svg width="' + n + '" height="' + n + '" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#43d477"/><stop offset="1" stop-color="#1b8a45"/></linearGradient><clipPath id="' + id + 'c"><rect x="2" y="2" width="60" height="60" rx="16"/></clipPath></defs>' +
      '<rect x="2" y="2" width="60" height="60" rx="16" fill="url(#' + id + 'g)"/><g clip-path="url(#' + id + 'c)" fill="#fff" opacity=".16"><rect x="2" y="44" width="9" height="9"/><rect x="11" y="53" width="9" height="9"/><rect x="53" y="2" width="9" height="9"/></g>' +
      '<path d="' + KNIGHT + '" fill="#fff"/><circle cx="21.6" cy="19.6" r="1.8" fill="#1b8a45"/><path d="M33 16 C37 18 39.5 22 40.6 27" stroke="#1b8a45" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/><rect x="17.5" y="50" width="31" height="5.5" rx="2.75" fill="#fff"/></svg>';
  }
  var G = '<svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>';
  var ICO = {
    book: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M8 7h8"/></svg>',
    dev: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="13" height="10" rx="2"/><rect x="15" y="9" width="6" height="11" rx="1.5"/><path d="M6 18h6"/></svg>',
    lock: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>',
    check: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
  };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  /* ── Pantalla ────────────────────────────────────────────────────────── */
  function build() {
    box = document.createElement('div');
    box.id = 'aa-login';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'aa-t');
    var cells = '';
    for (var i = 0; i < LEN; i++) cells += '<input inputmode="numeric" pattern="[0-9]*" maxlength="' + (i ? 1 : LEN) + '" aria-label="Dígito ' + (i + 1) + ' de ' + LEN + '"' + (i ? '' : ' autocomplete="one-time-code"') + '>';
    box.innerHTML =
      '<aside class="aa-side">' +
        '<div class="aa-mark">' + logo(46, 'aas') + '<span>Ajedrez <b>Academy</b></span></div>' +
        '<div><h2>Tu progreso, en cualquier tablero.</h2>' +
        '<ul class="aa-perks"><li><i>' + ICO.book + '</i>Lecciones, táctica y racha guardadas</li><li><i>' + ICO.dev + '</i>Sigue en el móvil, la tablet o el aula</li><li><i>' + ICO.lock + '</i>Tu cuenta, protegida con un código</li></ul></div>' +
        '<p class="aa-foot">Gratis para aprender ajedrez.</p>' +
        '<svg class="aa-knight" viewBox="8 6 40 51" aria-hidden="true"><path d="' + KNIGHT + '" fill="#fff"/><rect x="17.5" y="50" width="31" height="5.5" rx="2.75" fill="#fff"/></svg>' +
      '</aside>' +
      '<main class="aa-main"><div class="aa-card">' +
        '<ol class="aa-steps" aria-label="Pasos"><li data-s="google">Google</li><li data-s="code">Código</li></ol>' +
        '<section data-v="wait" class="aa-wait"><span class="aa-spin"></span><span>Preparando tu club…</span></section>' +
        '<section data-v="google" hidden>' +
          '<h1 id="aa-t">Entra a tu club</h1>' +
          '<p class="aa-sub">Inicia sesión para guardar tu progreso y seguir donde lo dejaste.</p>' +
          '<button type="button" class="aa-btn" data-a="google">' + G + '<span>Continuar con Google</span></button>' +
          '<p class="aa-err" role="alert" data-e="google"></p><p class="aa-hint" data-e="hint" hidden></p>' +
          '<p class="aa-note">' + ICO.mail + '<span>Después te enviaremos un código de ' + LEN + ' dígitos a tu correo de Google para confirmar que eres tú.</span></p>' +
        '</section>' +
        '<section data-v="code" hidden>' +
          '<h1>Revisa tu correo</h1>' +
          '<p class="aa-sub">Enviamos un código de ' + LEN + ' dígitos a<br><span class="aa-mail"><i>' + ICO.mail + '</i><span data-f="email"></span></span></p>' +
          '<form data-a="verify" novalidate><div class="aa-code" style="--n:' + LEN + '" role="group" aria-label="Código de verificación">' + cells + '</div>' +
          '<p class="aa-err" role="alert" data-e="code"></p>' +
          '<button type="submit" class="aa-btn pri" data-a="verifybtn"><span>Verificar y entrar</span></button></form>' +
          '<div class="aa-row"><button type="button" class="aa-link" data-a="resend">Reenviar código</button><button type="button" class="aa-link mut" data-a="other">Usar otra cuenta</button></div>' +
          '<p class="aa-note">' + ICO.mail + '<span>También puedes pulsar el enlace del correo en este mismo navegador. ¿No llega? Mira en «Spam» o «Promociones». Si tu Gmail está lleno, libera espacio y pulsa «Reenviar código». Caduca en 10 minutos.</span></p>' +
        '</section>' +
        '<section data-v="done" class="aa-done" hidden><i>' + ICO.check + '</i><h1>¡Listo!</h1><p class="aa-sub" style="margin:0">Cargando tu progreso…</p></section>' +
        '<p class="aa-legal">Solo usamos tu nombre y correo para tu cuenta y tu progreso. <a href="privacidad.html" style="color:inherit">Privacidad y condiciones</a></p>' +
      '</div></main>';
    document.body.appendChild(box);
    wire();
  }
  function $(s) { return box.querySelector(s); }
  function view(v) {
    box.querySelectorAll('section[data-v]').forEach(function (s) { s.hidden = s.dataset.v !== v; });
    var st = box.querySelectorAll('.aa-steps li');
    st[0].className = v === 'google' ? 'on' : (v === 'code' || v === 'done') ? 'ok' : '';
    st[1].className = v === 'code' ? 'on' : v === 'done' ? 'ok' : '';
    if (v === 'code') { $('[data-f="email"]').textContent = email; setTimeout(function () { cellsEls()[0].focus(); }, 60); }
      }
  function err(which, msg) { $('[data-e="' + which + '"]').textContent = msg || ''; }
  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.l = btn.innerHTML; btn.innerHTML = '<span class="aa-spin"></span><span>' + label + '</span>'; }
    else if (btn.dataset.l) btn.innerHTML = btn.dataset.l;
  }
  function cellsEls() { return Array.prototype.slice.call(box.querySelectorAll('.aa-code input')); }
  function codeVal() { return cellsEls().map(function (i) { return i.value; }).join(''); }
  function fillFrom(start, digits) {
    var c = cellsEls();
    for (var i = 0; i < digits.length && start + i < c.length; i++) c[start + i].value = digits[i];
    paint();
    var nx = Math.min(start + digits.length, c.length - 1);
    c[nx].focus();
    if (codeVal().length === LEN) submitCode();
  }
  function paint() { cellsEls().forEach(function (i) { i.classList.toggle('f', !!i.value); }); $('.aa-code').classList.remove('bad'); }

  function wire() {
    $('[data-a="google"]').addEventListener('click', startGoogle);
    $('[data-a="verify"]').addEventListener('submit', function (e) { e.preventDefault(); submitCode(); });
    $('[data-a="resend"]').addEventListener('click', function () { sendCode(true); });
    $('[data-a="other"]').addEventListener('click', otherAccount);
    cellsEls().forEach(function (inp, idx, all) {
      inp.addEventListener('input', function () {
        var d = inp.value.replace(/\D/g, '');
        inp.value = '';
        if (d) fillFrom(idx, d.split('')); else paint();
        err('code');
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !inp.value && idx > 0) { all[idx - 1].value = ''; all[idx - 1].focus(); paint(); e.preventDefault(); }
        else if (e.key === 'ArrowLeft' && idx > 0) { all[idx - 1].focus(); e.preventDefault(); }
        else if (e.key === 'ArrowRight' && idx < all.length - 1) { all[idx + 1].focus(); e.preventDefault(); }
      });
      inp.addEventListener('focus', function () { inp.select(); });
      inp.addEventListener('paste', function (e) {
        var t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        if (t) { e.preventDefault(); fillFrom(t.length >= LEN ? 0 : idx, t.slice(0, LEN).split('')); }
      });
    });
  }

  /* ── Bloqueo difícil de quitar a mano ────────────────────────────────── */
  var mo = null;
  function guard() {
    mo = new MutationObserver(function () {
      if (unlocked) return;
      if (!html.classList.contains('aa-lock')) html.classList.add('aa-lock');
      if (box && !box.isConnected) document.body.appendChild(box);
      if (!styleEl.isConnected) (document.head || html).appendChild(styleEl);
    });
    mo.observe(html, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
  }

  /* ── Sesión ──────────────────────────────────────────────────────────── */
  function claims(sess) {
    try {
      var p = sess.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch (e) { return {}; }
  }
  function hasGoogle(sess) {
    var u = sess && sess.user;
    if (!u) return false;
    return (u.identities || []).some(function (i) { return i.provider === 'google'; }) ||
      ((u.app_metadata && u.app_metadata.providers) || []).indexOf('google') >= 0;
  }
  function codeOk(sess) {
    return (claims(sess).amr || []).some(function (a) { return a && (a.method === 'otp' || a.method === 'magiclink'); });
  }
  function loadSdk() {
    return new Promise(function (res, rej) {
      (function next(i) {
        if (window.supabase && window.supabase.createClient) return res(window.supabase);
        if (i >= SDK.length) return rej(new Error('sdk'));
        var s = document.createElement('script');
        s.src = SDK[i]; s.crossOrigin = 'anonymous';
        s.onload = function () { next(window.supabase ? SDK.length : i + 1); };
        s.onerror = function () { next(i + 1); };
        document.head.appendChild(s);
      })(0);
    });
  }

  function googleMsg(e) {
    e = String(e || '').toLowerCase();
    if (/admin_policy|org_internal|disallowed|policy/.test(e)) return 'Esa cuenta de Google no permite entrar en apps externas (suele pasar con cuentas de colegio o trabajo). Prueba con una cuenta personal de Gmail.';
    if (/access_denied|cancel/.test(e)) return 'Cancelaste el acceso con Google. Cuando quieras, pulsa de nuevo «Continuar con Google».';
    if (/state|expired|flow/.test(e)) return 'El acceso con Google caducó. Pulsa otra vez «Continuar con Google» y elige tu cuenta.';
    return 'Google no completó el inicio de sesión. Inténtalo otra vez.';
  }
  function startGoogle() {
    hint('');
    var b = $('[data-a="google"]');
    err('google');
    busy(b, true, 'Abriendo Google…');
    if (DEMO) { setTimeout(function () { busy(b, false); email = 'alumna.ejemplo@gmail.com'; view('code'); }, 700); return; }
    sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } } })
      .then(function (r) { if (r.error) throw r.error; })
      .catch(function () { busy(b, false); err('google', 'No se pudo abrir Google. Revisa tu conexión e inténtalo otra vez.'); });
  }

  var cool = 0, coolT = null;
  function cooldown(sec) {
    var b = $('[data-a="resend"]');
    cool = sec; clearInterval(coolT);
    (function tick() {
      if (cool <= 0) { b.disabled = false; b.textContent = 'Reenviar código'; clearInterval(coolT); return; }
      b.disabled = true; b.textContent = 'Reenviar en 0:' + String(cool).padStart(2, '0'); cool--;
    })();
    coolT = setInterval(function () {
      if (cool <= 0) { b.disabled = false; b.textContent = 'Reenviar código'; clearInterval(coolT); return; }
      b.textContent = 'Reenviar en 0:' + String(cool).padStart(2, '0'); cool--;
    }, 1000);
  }
  function sentKey() { return 'aa-otp-sent:' + email; }
  function sendCode(force) {
    var last = +(sessionStorage.getItem(sentKey()) || 0);
    if (!force && Date.now() - last < 5 * 60e3) { cooldown(Math.max(0, 60 - Math.round((Date.now() - last) / 1000))); return; }
    err('code');
    cooldown(60);
    if (DEMO) { sessionStorage.setItem(sentKey(), String(Date.now())); return; }
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } }).then(function (r) {
      if (r.error) {
        var m = String(r.error.message || '');
        err('code', /rate|seconds|too many/i.test(m) ? 'Has pedido varios códigos seguidos. Espera un minuto y vuelve a intentarlo.' : 'No pudimos enviar el código. Inténtalo de nuevo en un momento.');
        return;
      }
      sessionStorage.setItem(sentKey(), String(Date.now()));
    });
  }
  function fails() { return +(sessionStorage.getItem('aa-otp-fails') || 0); }
  function submitCode() {
    var code = codeVal(), b = $('[data-a="verifybtn"]');
    if (b.disabled) return;
    if (code.length !== LEN) { err('code', 'Escribe los ' + LEN + ' dígitos del código.'); return; }
    var lockUntil = +(sessionStorage.getItem('aa-otp-lock') || 0);
    if (Date.now() < lockUntil) { err('code', 'Demasiados intentos. Espera ' + Math.ceil((lockUntil - Date.now()) / 60e3) + ' min o pide un código nuevo.'); return; }
    busy(b, true, 'Verificando…');
    var p = DEMO
      ? new Promise(function (r) { setTimeout(function () { r(code === '123456' ? { data: {} } : { error: { message: 'invalid' } }); }, 650); })
      : sb.auth.verifyOtp({ email: email, token: code, type: 'email' });
    p.then(function (r) {
      busy(b, false);
      if (r.error) {
        var f = fails() + 1;
        sessionStorage.setItem('aa-otp-fails', String(f));
        if (f >= 5) { sessionStorage.setItem('aa-otp-lock', String(Date.now() + 5 * 60e3)); sessionStorage.setItem('aa-otp-fails', '0'); }
        $('.aa-code').classList.add('bad');
        err('code', f >= 5 ? 'Demasiados intentos. Espera 5 minutos o pide un código nuevo.' : 'Ese código no es correcto o ya caducó.');
        cellsEls().forEach(function (i) { i.value = ''; });
        setTimeout(function () { cellsEls()[0].focus(); }, 380);
        return;
      }
      sessionStorage.removeItem('aa-otp-fails');
      sessionStorage.removeItem(sentKey());
      view('done');
      if (DEMO) { setTimeout(function () { unlock(null); }, 900); return; }
      enter(r.data.session);
    }).catch(function () { busy(b, false); err('code', 'Sin conexión. Inténtalo otra vez.'); });
  }
  function clearAuthLeftovers() {
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('aa-auth') === 0) localStorage.removeItem(k); }); } catch (e) {}
    try { Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf('aa-otp') === 0) sessionStorage.removeItem(k); }); } catch (e) {}
  }
  function hint(t) { var h = $('[data-e="hint"]'); if (!h) return; h.textContent = t || ''; h.hidden = !t; }
  function otherAccount() {
    var done = function () { clearAuthLeftovers(); email = ''; view('google'); hint('Pulsa «Continuar con Google» y elige la otra cuenta en la ventana de Google.'); };
    if (DEMO) { done(); return; }
    sb.auth.signOut({ scope: 'local' }).catch(function () {}).finally(done);
  }

  /* ── Progreso en la nube ─────────────────────────────────────────────── */
  function xpOf(raw) { try { return JSON.parse(raw).xp || 0; } catch (e) { return 0; } }
  function localBlob() { var d = {}; KEYS.forEach(function (k) { var v = localStorage.getItem(k); if (v != null) d[k] = v; }); return d; }
  function pull() {
    return sb.from('progreso').select('datos,updated_at').eq('user_id', uid).maybeSingle().then(function (r) {
      if (r.error) { setChip('err'); return false; }
      var row = r.data, localAt = +(localStorage.getItem(SYNC_AT) || 0), owner = localStorage.getItem(OWNER);
      if (!row) { origSet.call(localStorage, OWNER, uid); return push().then(function () { return false; }); }
      var remoteAt = Date.parse(row.updated_at) || 0, datos = row.datos || {};
      var take = owner && owner !== uid ? true
        : !localAt ? xpOf(datos[KEYS[0]]) >= xpOf(localStorage.getItem(KEYS[0]))
        : remoteAt > localAt;
      origSet.call(localStorage, OWNER, uid);
      if (!take) { if (localAt > remoteAt || !localAt) push(); return false; }
      var changed = KEYS.some(function (k) { return (datos[k] || null) !== localStorage.getItem(k); });
      KEYS.forEach(function (k) { if (datos[k] != null) origSet.call(localStorage, k, datos[k]); else localStorage.removeItem(k); });
      origSet.call(localStorage, SYNC_AT, String(remoteAt));
      return changed;
    }).catch(function () { setChip('err'); return false; });
  }
  var pushT = null, pushing = null;
  function push() {
    var at = +(localStorage.getItem(SYNC_AT) || 0) || Date.now();
    origSet.call(localStorage, SYNC_AT, String(at));
    setChip('wait');
    pushing = sb.from('progreso').upsert({ user_id: uid, datos: localBlob(), updated_at: new Date(at).toISOString() })
      .then(function (r) { setChip(r.error ? 'err' : 'ok'); })
      .catch(function () { setChip('err'); });
    return pushing;
  }
  function watchWrites() {
    Storage.prototype.setItem = function (k, v) {
      origSet.call(this, k, v);
      if (this === localStorage && KEYS.indexOf(k) >= 0 && unlocked && uid) {
        origSet.call(localStorage, SYNC_AT, String(Date.now()));
        setChip('wait');
        clearTimeout(pushT); pushT = setTimeout(push, 1500);
      }
    };
    addEventListener('online', function () { if (uid) push(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && pushT) { clearTimeout(pushT); pushT = null; push(); } });
  }

  /* ── Botón de cuenta ─────────────────────────────────────────────────── */
  var chipState = 'ok';
  function setChip(s) {
    chipState = s;
    if (!chip) return;
    chip.querySelectorAll('.aa-dot').forEach(function (d) { d.className = 'aa-dot' + (s === 'ok' ? '' : ' ' + s); });
    var t = chip.querySelector('.aa-stt');
    if (t) t.textContent = s === 'ok' ? 'Progreso guardado' : s === 'wait' ? 'Guardando…' : 'Sin conexión · se guardará luego';
  }
  function mountChip(user) {
    var m = (user && user.user_metadata) || {};
    var name = m.full_name || m.name || email || 'Tu cuenta';
    var pic = m.avatar_url || m.picture || '';
    chip = document.createElement('div');
    chip.id = 'aa-chip';
    var first = name.indexOf('@') > 0 ? name.split('@')[0] : name.split(' ')[0];
    chip.innerHTML = '<button type="button" class="aa-who" aria-haspopup="true" aria-expanded="false" aria-label="Tu cuenta: ' + esc(email) + '"><span class="aa-av">' +
      (pic ? '<img alt="" referrerpolicy="no-referrer" src="' + esc(pic) + '">' : esc(name.trim().charAt(0).toUpperCase())) +
      '</span><span class="aa-lbl">' + esc(first) + '</span><span class="aa-dot"></span></button>' +
      '<div class="aa-menu" hidden><div class="aa-mh"><span class="aa-av">' + (pic ? '<img alt="" referrerpolicy="no-referrer" src="' + esc(pic) + '">' : esc(name.trim().charAt(0).toUpperCase())) + '</span><span class="aa-mt"><b>' + esc(name.indexOf('@') > 0 ? first : name) + '</b><small class="aa-em" title="' + esc(email) + '">' + esc(email) + '</small></span></div>' +
      '<p class="aa-state"><span class="aa-dot"></span><span class="aa-stt"></span></p>' +
      '<div class="aa-go"><button type="button" data-go="Progreso">Progreso</button><button type="button" data-go="Ajustes">Ajustes</button><button type="button" data-go="Evaluar">Evaluar</button><button type="button" data-go="Clasificación">Clasificación</button><button type="button" data-go="Memoria">Memoria</button><button type="button" data-go="tema">Tema</button></div>' +
      '<button type="button" class="aa-exit" data-a="out"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/></svg>Cerrar sesión</button></div>';
    var btn = chip.firstChild, menu = chip.querySelector('.aa-menu');
    /* El botón vive dentro de la barra de navegación de la app: encima de «Tema» en el ordenador y
       en la cabecera en el móvil. En pantallas sin barra (lecciones, Evaluar…) no se muestra. */
    var queued = false;
    function place() {
      queued = false;
      var rail = document.querySelector('.rail');
      var shown = rail && rail.getClientRects().length > 0 && getComputedStyle(rail).display !== 'none';
      if (!shown) { if (chip.isConnected) { chip.remove(); menu.hidden = true; } return; }
      if (chip.parentNode !== rail) rail.insertBefore(chip, rail.querySelector('.theme-btn'));
    }
    place();
    new MutationObserver(function () { if (!queued) { queued = true; requestAnimationFrame(place); } })
      .observe(document.body, { childList: true, subtree: true });
    chip.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () {
        menu.hidden = true;
        if (b.dataset.go === 'tema') { var t = document.querySelector('.rail .theme-btn'); if (t) t.click(); return; }
        if (window.AA_GOTO) window.AA_GOTO(b.dataset.go);
      });
    });
    function pos() { if (matchMedia('(max-width:899px)').matches) { menu.style.cssText = ''; return; }
      var r = btn.getBoundingClientRect(), rail = document.querySelector('.rail'), rr = rail ? rail.getBoundingClientRect() : r;
      menu.style.cssText = 'position:fixed;left:' + Math.round(rr.right + 10) + 'px;bottom:' + Math.max(10, Math.round(innerHeight - r.bottom)) + 'px;top:auto'; }
    btn.addEventListener('click', function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; if (!menu.hidden) pos(); btn.setAttribute('aria-expanded', String(!menu.hidden)); });
    addEventListener('resize', function () { if (!menu.hidden) pos(); });
    document.addEventListener('click', function (e) { if (!chip.contains(e.target)) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
    chip.querySelector('[data-a="out"]').addEventListener('click', signOut);
    setChip(chipState);
  }
  function signOut() {
    var go = function () {
      KEYS.concat([SYNC_AT, OWNER]).forEach(function (k) { localStorage.removeItem(k); });
      location.reload();
    };
    if (DEMO) return go();
    clearTimeout(pushT);
    (pushT ? push() : Promise.resolve()).then(function () { return sb.auth.signOut(); }).finally(go);
  }

  /* ── Entrada ─────────────────────────────────────────────────────────── */
  function unlock(user) {
    unlocked = true;
    if (mo) mo.disconnect();
    html.classList.remove('aa-lock');
    box.classList.add('aa-out');
    setTimeout(function () { box.remove(); }, 400);
    if (user || DEMO) mountChip(user);
    /* Para la clasificación (retos.js): cliente, usuario y nombre de pila */
    var md = (user && user.user_metadata) || {};
    window.AA_CUENTA = { sb: sb, uid: uid, nombre: (md.given_name || (md.full_name || md.name || '').split(' ')[0] || '').trim(), demo: !!DEMO };
    window.dispatchEvent(new Event('aa-cuenta'));
    if (sb && uid && !DEMO) heartbeat();
  }
  /* Actividad para el panel de administración: hora, sección y tipo de dispositivo (sin IP) */
  function device() {
    var ua = navigator.userAgent || '', os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS X/i.test(ua) ? 'Mac' : /CrOS/i.test(ua) ? 'ChromeOS' : /Linux/i.test(ua) ? 'Linux' : 'Otro';
    var br = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Chrome\//.test(ua) ? (navigator.brave ? 'Brave' : 'Chrome') : /Safari\//.test(ua) ? 'Safari' : 'Otro';
    var app = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ? ' · app instalada' : '';
    return (os + ' · ' + br + app).slice(0, 80);
  }
  var lastBeat = 0;
  function beat(force) {
    if (!sb || !uid || document.hidden) return;
    if (!force && Date.now() - lastBeat < 15e3) return;
    lastBeat = Date.now();
    sb.from('actividad').upsert({ user_id: uid, last_seen: new Date().toISOString(), pagina: (location.hash || '#inicio').slice(0, 80), dispositivo: device() }).then(function () {}, function () {});
  }
  function heartbeat() {
    beat(true);
    setInterval(function () { beat(true); }, 60e3);
    addEventListener('hashchange', function () { beat(false); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) beat(true); });
  }
  function enter(sess) {
    uid = sess.user.id; email = sess.user.email || email;
    pull().then(function (changed) {
      if (changed && sessionStorage.getItem('aa-pulled') !== '1') {
        sessionStorage.setItem('aa-pulled', '1');
        location.reload();
        return;
      }
      sessionStorage.removeItem('aa-pulled');
      watchWrites();
      unlock(sess.user);
    });
  }
  function start() {
    build();
    guard();
    if (DEMO) {
      if (DEMO === 'codigo') { email = 'alumna.ejemplo@gmail.com'; view('code'); cooldown(42); }
      else view('google');
      return;
    }
    loadSdk().then(function (lib) {
      sb = lib.createClient(CFG.url, CFG.anonKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'aa-auth' } });
      return sb.auth.getSession();
    }).then(function (r) {
      var u = new URL(location.href), hadCode = u.searchParams.has('code');
      if (u.searchParams.has('code') || u.searchParams.has('error')) {
        var e = u.searchParams.get('error_description') || u.searchParams.get('error');
        ['code', 'error', 'error_code', 'error_description', 'state'].forEach(function (k) { u.searchParams.delete(k); });
        history.replaceState(null, '', u.pathname + u.search + u.hash);
        if (e) { view('google'); err('google', googleMsg(e)); return; }
      }
      var s = r.data && r.data.session;
      if (!s && hadCode) { clearAuthLeftovers(); view('google'); err('google', 'El acceso con Google caducó o se abrió en otra ventana. Pulsa otra vez «Continuar con Google».'); return; }
      if (s && hasGoogle(s) && codeOk(s)) return enter(s);
      if (s && hasGoogle(s)) { email = s.user.email; view('code'); sendCode(false); return; }
      if (s) sb.auth.signOut();
      view('google');
    }).catch(function () {
      view('google');
      err('google', 'No se pudo conectar con el servidor de cuentas. Revisa tu conexión y recarga la página.');
    });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
