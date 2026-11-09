// «Mesa de cartas» — carta IHM L105 (Estrecho) georreferenciada, con herramientas de trazado y problemas oficiales.
const ID = "carta";
const D2R = Math.PI / 180;
const MP = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * D2R) / 2)) * 10800 / Math.PI;
const iMP = (m) => (2 * Math.atan(Math.exp((m * Math.PI) / 10800)) - Math.PI / 2) / D2R;
const norm = (a) => ((a % 360) + 360) % 360;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fx = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toFixed(d).replace(".", ",");
const deg3 = (v, d = 1) => { const t = fx(norm(v), d); const [i, f] = t.split(","); return i.padStart(3, "0") + (f ? "," + f : "") + "°"; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = (s) => { const v = parseFloat(String(s).replace(",", ".")); return Number.isFinite(v) ? v : NaN; };

function fmtDM(v, isLat) {
  const h = isLat ? (v >= 0 ? "N" : "S") : (v >= 0 ? "E" : "W");
  const a = Math.abs(v); let d = Math.floor(a); let m = Math.round((a - d) * 600) / 10;
  if (m >= 60) { d += 1; m = 0; }
  return `${String(d).padStart(isLat ? 2 : 3, "0")}° ${m.toFixed(1).padStart(4, "0").replace(".", ",")}′ ${h}`;
}
const fmtPos = (g) => `l = ${fmtDM(g.lat, true)}; L = ${fmtDM(g.lon, false)}`;
const hhmm = (min) => { min = ((Math.round(min) % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"); };
const parseHM = (s) => { const m = String(s).trim().match(/^(\d{1,2})[:h.,]?(\d{2})?$/); if (!m) return NaN; return +m[1] * 60 + (+m[2] || 0); };

// --- Navegación loxodrómica en el plano Mercator (X = minutos de longitud, Y = partes meridionales) ---
const toM = (g) => ({ X: g.lon * 60, Y: MP(g.lat) });
const fromM = (X, Y) => ({ lat: iMP(Y), lon: X / 60 });
function brg(a, b) { const A = toM(a), B = toM(b); return norm(Math.atan2(B.X - A.X, B.Y - A.Y) / D2R); }
function dist(a, b) {
  const c = brg(a, b) * D2R, dl = (b.lat - a.lat) * 60;
  if (Math.abs(Math.cos(c)) > 0.03) return Math.abs(dl / Math.cos(c));
  return Math.abs((b.lon - a.lon) * 60 * Math.cos(((a.lat + b.lat) / 2) * D2R));
}
function move(p, c, d) {
  const r = c * D2R, lat2 = p.lat + (d * Math.cos(r)) / 60, A = toM(p);
  if (Math.abs(Math.cos(r)) > 1e-6) { const dY = MP(lat2) - A.Y; return fromM(A.X + dY * Math.tan(r), A.Y + dY); }
  return fromM(A.X + (d * Math.sin(r)) / Math.cos(p.lat * D2R), A.Y);
}
function lineLine(p1, c1, p2, c2) {
  const a = toM(p1), b = toM(p2), d1 = [Math.sin(c1 * D2R), Math.cos(c1 * D2R)], d2 = [Math.sin(c2 * D2R), Math.cos(c2 * D2R)];
  const den = d1[0] * -d2[1] + d1[1] * d2[0];
  if (Math.abs(den) < 1e-4) return null;
  const t = ((b.X - a.X) * -d2[1] + (b.Y - a.Y) * d2[0]) / den;
  return fromM(a.X + t * d1[0], a.Y + t * d1[1]);
}
function lineCircle(p, c, ctr, r) {
  const a = toM(p), o = toM(ctr), R = r / Math.cos(ctr.lat * D2R), d = [Math.sin(c * D2R), Math.cos(c * D2R)];
  const fx0 = a.X - o.X, fy0 = a.Y - o.Y, B = 2 * (fx0 * d[0] + fy0 * d[1]), C = fx0 * fx0 + fy0 * fy0 - R * R, disc = B * B - 4 * C;
  if (disc < 0) return [];
  const s = Math.sqrt(disc);
  return [(-B - s) / 2, (-B + s) / 2].map((t) => fromM(a.X + t * d[0], a.Y + t * d[1]));
}
function circleCircle(c1, r1, c2, r2) {
  const a = toM(c1), b = toM(c2), k = 1 / Math.cos(((c1.lat + c2.lat) / 2) * D2R), R1 = r1 * k, R2 = r2 * k;
  const dx = b.X - a.X, dy = b.Y - a.Y, d = Math.hypot(dx, dy);
  if (d > R1 + R2 || d < Math.abs(R1 - R2) || d === 0) return [];
  const l = (R1 * R1 - R2 * R2 + d * d) / (2 * d), h = Math.sqrt(Math.max(R1 * R1 - l * l, 0));
  const mx = a.X + (l * dx) / d, my = a.Y + (l * dy) / d;
  return [fromM(mx + (h * dy) / d, my - (h * dx) / d), fromM(mx - (h * dy) / d, my + (h * dx) / d)];
}
function foot(p, c, q) { // pie de la perpendicular desde q a la derrota (p, c)
  const a = toM(p), b = toM(q), d = [Math.sin(c * D2R), Math.cos(c * D2R)];
  const t = (b.X - a.X) * d[0] + (b.Y - a.Y) * d[1];
  return { g: fromM(a.X + t * d[0], a.Y + t * d[1]), ahead: t > 0 };
}
function crossMeridian(p, c, lon) { const a = toM(p), s = Math.sin(c * D2R); if (Math.abs(s) < 1e-6) return null; const t = (lon * 60 - a.X) / s; return t > 0 ? fromM(lon * 60, a.Y + t * Math.cos(c * D2R)) : null; }
function crossParallel(p, c, lat) { const a = toM(p), co = Math.cos(c * D2R); if (Math.abs(co) < 1e-6) return null; const t = (MP(lat) - a.Y) / co; return t > 0 ? fromM(a.X + t * Math.sin(c * D2R), MP(lat)) : null; }

// Palabras clave para «faros citados» en los enunciados
const CITE = [
  ["trafalgar", /trafa?l?gar/i], ["roche", /roche/i], ["ecm_barbate", /cardinal este[^.]*barbate|barbate[^.]*cardinal este|granja acu/i], ["barbate", /barbate/i],
  ["gracia", /gracia|camarinal/i], ["sierra_plata", /sierra de la plata/i], ["paloma", /paloma/i], ["tarifa", /tarifa/i], ["carnero", /carnero/i],
  ["ecm_algeciras", /cardinal este de la bah[ií]a de algeciras/i], ["algeciras", /algeciras/i], ["cepsa", /cepsa|refiner/i], ["europa", /europa/i],
  ["carbonera", /carbonera/i], ["sotogrande", /sotogrande|guadiaro/i], ["espartel", /espartel/i], ["frailecillo", /frailecillo/i], ["pecio_espartel", /pecio/i],
  ["tanger", /t[aá]nger/i], ["ncm_malabata", /cardinal norte/i], ["malabata", /malabata/i], ["alcazar", /alc[aá]zar/i], ["cires", /cires/i],
  ["leona", /leona/i], ["ceuta", /ceuta/i], ["almina", /almina/i], ["cabonegro", /cabo negro|ras el aswad/i],
];

const CSS = `
.m-carta{--mc-gap:.6rem}
.m-carta [hidden]{display:none!important}
.m-carta .m-carta-head{justify-content:space-between}
.m-carta .m-carta-ct{display:flex;flex-wrap:wrap;gap:.5rem .9rem;align-items:center;padding:.6rem .8rem}
.m-carta .m-carta-ct label{display:inline-flex;flex-direction:row;flex-wrap:nowrap;white-space:nowrap;gap:.35rem;align-items:center;font-size:.9rem}
.m-carta input[type=text],.m-carta input[type=number],.m-carta select{min-height:34px;padding:.2em .45em;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);color:var(--ink);max-width:100%}
.m-carta input.w4{width:4.6em}.m-carta input.w3{width:3.6em}.m-carta input.w6{width:6.2em}
.m-carta .m-carta-tools{gap:.35rem}
.m-carta .m-carta-tools .btn[aria-pressed=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.m-carta .m-carta-stage{height:clamp(330px,64vh,760px);touch-action:none;cursor:crosshair;user-select:none;-webkit-user-select:none}
.m-carta .m-carta-stage canvas{width:100%;height:100%}
.m-carta .m-carta-read{position:absolute;left:46px;right:8px;bottom:6px;pointer-events:none;font-size:.8rem;background:color-mix(in srgb,var(--sheet) 88%,transparent);color:var(--ink);border:1px solid var(--line);border-radius:var(--r-sm);padding:.15em .5em;width:max-content;max-width:calc(100% - 54px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-carta .m-carta-zoom{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:4px}
.m-carta .m-carta-zoom .btn{min-height:34px;width:38px;padding:0;font-size:1.1rem}
.m-carta .m-carta-form{display:flex;flex-direction:column;gap:.55rem}
.m-carta .m-carta-form .row{gap:.45rem}
.m-carta .m-carta-res{display:flex;flex-direction:column;gap:.35rem;margin-top:.5rem}
.m-carta .m-carta-res .r{border-left:3px solid var(--accent);padding:.25rem .6rem;background:var(--sea);border-radius:0 var(--r-sm) var(--r-sm) 0;font-size:.92rem}
.m-carta .m-carta-res .r b{font-family:var(--f-mono);font-weight:600}
.m-carta .m-carta-fix{border-left-color:var(--ok)!important}
.m-carta .m-carta-opts{display:flex;flex-direction:column;gap:.4rem}
.m-carta .m-carta-opts button{justify-content:flex-start;text-align:left;font-weight:500;min-height:42px}
.m-carta .m-carta-opts button.ok{border-color:var(--ok);color:var(--ok);font-weight:700}
.m-carta .m-carta-opts button.bad{border-color:var(--bad);color:var(--bad)}
.m-carta .m-carta-sol{border-top:1px solid var(--line);padding-top:.7rem;overflow-x:auto}
.m-carta .m-carta-sol table{font-size:.86rem}
.m-carta .m-carta-sol h4{margin:.4rem 0}
.m-carta .m-carta-sol p{margin:.3rem 0}
.m-carta .m-carta-thumbs{display:flex;flex-wrap:wrap;gap:.5rem}
.m-carta .m-carta-thumbs button{padding:0;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);cursor:pointer;width:96px;overflow:hidden}
.m-carta .m-carta-thumbs img{display:block;width:100%;height:auto}
.m-carta .m-carta-thumbs span{display:block;font-size:.7rem;padding:.15em .3em;color:var(--muted);line-height:1.2}
.m-carta .m-carta-viewer{position:relative;border:1px solid var(--line);border-radius:var(--r);overflow:auto;max-height:70vh;background:var(--sheet)}
.m-carta .m-carta-viewer img{display:block;width:100%;height:auto;max-width:none}
.m-carta .m-carta-seen{white-space:normal;max-width:100%}
.m-carta .m-carta-stem{font-size:1.02rem}
.m-carta .m-carta-hint{font-size:.88rem;color:var(--muted)}
.m-carta .m-carta-kpi{font-family:var(--f-display);font-size:1.25rem;font-weight:600}
`;

export default {
  id: ID,
  tema: 10,
  title: "Mesa de cartas: Estrecho de Gibraltar",
  icon: "⌖",
  desc: "Carta L105 con transportador, compás, demoras, enfilaciones, estima y los problemas oficiales de carta.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) { const st = document.createElement("style"); st.dataset.mod = ID; st.textContent = CSS; document.head.appendChild(st); }
    const store = ctx.store || { get: (k, d) => d, set() {} };
    let alive = true;
    const cleanups = [];
    const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); cleanups.push(() => t.removeEventListener(ev, fn, opt)); };
    const getJSON = (p) => fetch(ctx.asset(p)).then((r) => { if (!r.ok) throw new Error(p); return r.json(); });

    el.innerHTML = `
<div class="m-carta stack">
  <div class="row m-carta-head">
    <div class="seg" role="group" aria-label="Modo">
      <button type="button" data-mode="mesa" aria-pressed="true">Mesa de cartas</button>
      <button type="button" data-mode="prob" aria-pressed="false">Problemas oficiales</button>
    </div>
    <div class="row">
      <button type="button" class="btn sm" data-dl="pdf" title="Carta IHM L105 Enseñanza, A3, para imprimir">⇩ Carta A3 (PDF)</button>
      <button type="button" class="btn sm" data-dl="hoja" title="Enunciados oficiales de carta y clave de respuestas">⇩ Hoja de problemas</button>
    </div>
  </div>
  <div class="m-carta-probtop stack" hidden></div>
  <div class="tint m-carta-ct" aria-label="Corrección total">
    <span class="eyebrow">Corrección total</span>
    <label>dm <input type="text" inputmode="decimal" class="w3" data-ct="dm" value="0"><span class="seg"><button type="button" data-dmside="E" aria-pressed="false">E (+)</button><button type="button" data-dmside="W" aria-pressed="true">W (−)</button></span></label>
    <label>Δ <input type="text" inputmode="decimal" class="w3" data-ct="dv" value="0"><span class="seg"><button type="button" data-dvsign="+" aria-pressed="false">+</button><button type="button" data-dvsign="-" aria-pressed="true">−</button></span></label>
    <span class="mono" data-ctout>Ct = dm + Δ = 0,0°</span>
  </div>
  <div class="row m-carta-tools" role="toolbar" aria-label="Herramientas"></div>
  <div class="stage m-carta-stage">
    <canvas aria-label="Carta náutica del Estrecho de Gibraltar. Arrastra para mover, pellizca o usa la rueda para ampliar."></canvas>
    <div class="m-carta-read mono">Cargando carta…</div>
    <div class="m-carta-zoom"><button type="button" class="btn" data-z="in" aria-label="Ampliar">+</button><button type="button" class="btn" data-z="out" aria-label="Reducir">−</button><button type="button" class="btn" data-z="fit" aria-label="Ver carta completa">⤢</button></div>
  </div>
  <div class="panel m-carta-out"><div class="m-carta-form"></div><div class="m-carta-res" aria-live="polite"></div></div>
  <div class="panel m-carta-probbot stack" hidden></div>
  <p class="small muted">Carta IHM L105 «Enseñanza» (Instituto Hidrográfico de la Marina), escala 1:200.000 en 36°. Uso educativo, no válida para la navegación. Georreferenciada con 18 cruces de la retícula (error medio 0,04′).</p>
</div>`;

    const $ = (s) => el.querySelector(s);
    const cv = $("canvas"), stage = $(".m-carta-stage"), readEl = $(".m-carta-read");
    const formEl = $(".m-carta-form"), resEl = $(".m-carta-res"), toolsEl = $(".m-carta-tools");
    const probTop = $(".m-carta-probtop"), probBot = $(".m-carta-probbot");

    // ---------- Estado ----------
    let chart = null, A = null, Ainv = null, W = 4961, H = 3508;
    let LM = []; // landmarks {id,name,lat,lon,light,px:[x,y]}
    let img = null;
    let view = { s: 0.1, ox: 0, oy: 0 }, cw = 300, ch = 300, dpr = 1;
    let objs = [], gid = 0, results = [];
    let tool = "punto", pending = [], origin = null, highlight = null, showLM = store.get("showLM", true);
    let compasBracket = null, hoverG = null;
    const ct = Object.assign({ dm: 0, dmSide: "W", dv: 0, dvSign: "-" }, store.get("ct", {}));
    const Ct = () => (ct.dmSide === "E" ? 1 : -1) * (num(ct.dm) || 0) + (ct.dvSign === "+" ? 1 : -1) * (num(ct.dv) || 0);

    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888";
    let C = {};
    const readColors = () => { C = { ink: css("--ink"), sheet: css("--sheet"), sea: css("--sea"), acc: css("--accent"), ok: css("--ok"), bad: css("--bad"), warn: css("--warn"), muted: css("--muted"), line: css("--line"), mono: css("--f-mono") || "monospace" }; };
    readColors();

    // ---------- Transformaciones ----------
    const geo2px = (g) => { const X = g.lon * 60, Y = MP(g.lat); return [A.cx[0] + A.cx[1] * X + A.cx[2] * Y, A.cy[0] + A.cy[1] * X + A.cy[2] * Y]; };
    const px2geo = (x, y) => { const dx = x - A.cx[0], dy = y - A.cy[0]; const X = Ainv[0] * dx + Ainv[1] * dy, Y = Ainv[2] * dx + Ainv[3] * dy; return fromM(X, Y); };
    const toS = (p) => [(p[0] - view.ox) * view.s, (p[1] - view.oy) * view.s];
    const fromS = (x, y) => [x / view.s + view.ox, y / view.s + view.oy];
    const g2s = (g) => toS(geo2px(g));

    // ---------- Dibujo ----------
    let raf = 0, visible = true, inited = false;
    const redraw = () => { if (!raf && alive) raf = requestAnimationFrame(draw); };
    function resize() {
      const r = stage.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      cw = Math.max(50, r.width); ch = Math.max(50, r.height);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      if (!inited && A) { inited = true; if (cw / ch < 1) { view.s = (ch / H) * 1.05; clampView(); centerOn({ lat: 35.97, lon: -5.6 }); } else fit(); } else clampView();
      redraw();
    }
    function fit() { view.s = Math.min(cw / W, ch / H); view.ox = (W - cw / view.s) / 2; view.oy = (H - ch / view.s) / 2; }
    function clampView() {
      const minS = Math.min(cw / W, ch / H) * 0.8; view.s = clamp(view.s, minS, 3);
      const vw = cw / view.s, vh = ch / view.s;
      view.ox = clamp(view.ox, Math.min(-vw * 0.4, (W - vw) / 2), Math.max(W - vw * 0.6, (W - vw) / 2));
      view.oy = clamp(view.oy, Math.min(-vh * 0.4, (H - vh) / 2), Math.max(H - vh * 0.6, (H - vh) / 2));
    }
    function zoomAt(f, sx, sy) { const [ix, iy] = fromS(sx, sy); view.s *= f; clampView(); view.ox = ix - sx / view.s; view.oy = iy - sy / view.s; clampView(); redraw(); }
    function centerOn(g, s) { if (!A) return; const p = geo2px(g); if (s) view.s = s; clampView(); view.ox = p[0] - cw / 2 / view.s; view.oy = p[1] - ch / 2 / view.s; clampView(); redraw(); }

    function label(c, text, x, y, col, align = "left") {
      c.font = `600 12px ${C.mono}`; const w = c.measureText(text).width + 8;
      const lx = align === "left" ? x : align === "right" ? x - w : x - w / 2;
      c.fillStyle = C.sheet; c.globalAlpha = 0.9; c.fillRect(lx, y - 9, w, 17); c.globalAlpha = 1;
      c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(lx + 0.5, y - 8.5, w - 1, 16);
      c.fillStyle = col; c.textBaseline = "middle"; c.fillText(text, lx + 4, y);
    }
    function dot(c, g, col, r = 4) { const [x, y] = g2s(g); c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = C.sheet; c.stroke(); return [x, y]; }
    function lineG(c, a, b, col, w = 2, dash) { const [x1, y1] = g2s(a), [x2, y2] = g2s(b); c.beginPath(); c.setLineDash(dash || []); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.setLineDash([]); }
    function arrowHead(c, a, b, col) {
      const [x1, y1] = g2s(a), [x2, y2] = g2s(b), ang = Math.atan2(y2 - y1, x2 - x1), L = 11;
      c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - L * Math.cos(ang - 0.4), y2 - L * Math.sin(ang - 0.4)); c.lineTo(x2 - L * Math.cos(ang + 0.4), y2 - L * Math.sin(ang + 0.4)); c.closePath(); c.fillStyle = col; c.fill();
    }
    function draw() {
      raf = 0; if (!alive) return;
      const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = C.sea; c.fillRect(0, 0, cw, ch);
      if (img && A) {
        c.save(); c.translate(-view.ox * view.s, -view.oy * view.s); c.scale(view.s, view.s);
        c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high"; c.drawImage(img, 0, 0, W, H); c.restore();
        if (ctx.theme && ctx.theme() === "dark") { c.fillStyle = "rgba(7,16,25,.2)"; c.fillRect(0, 0, cw, ch); }
      }
      if (!A) return;
      // faros
      if (showLM) {
        for (const l of LM) {
          const [x, y] = toS(l.px); if (x < -20 || y < -20 || x > cw + 20 || y > ch + 20) continue;
          c.beginPath(); c.arc(x, y, 5, 0, 7); c.lineWidth = 2; c.strokeStyle = C.acc; c.stroke();
          if (view.s > 0.13) { c.font = `600 11px ${C.mono}`; c.fillStyle = C.acc; c.textBaseline = "middle"; c.fillText(l.short, x + 8, y - 8); }
        }
      }
      if (highlight) { const [x, y] = g2s(highlight); c.beginPath(); c.arc(x, y, 16, 0, 7); c.lineWidth = 3; c.strokeStyle = C.warn; c.stroke(); }
      // objetos
      for (const o of objs) {
        const col = C[o.col || "acc"] || C.acc;
        if (o.k === "pt") { const [x, y] = dot(c, o.g, col, 5); if (o.label) label(c, o.label, x + 9, y - 12, col); }
        else if (o.k === "seg") { lineG(c, o.a, o.b, col, 2.2, o.dash); if (o.arrow) arrowHead(c, o.a, o.b, col); dot(c, o.a, col, 3.5); if (o.label) { const m = { lat: (o.a.lat + o.b.lat) / 2, lon: (o.a.lon + o.b.lon) / 2 }; const [x, y] = g2s(m); label(c, o.label, x + 6, y - 12, col); } }
        else if (o.k === "line") {
          const a = o.both ? move(o.g, o.c + 180, o.len) : o.g, b = move(o.g, o.c, o.len);
          lineG(c, a, b, col, 2, o.dash); if (!o.both) arrowHead(c, move(o.g, o.c, o.len * 0.98), b, col);
          if (o.label) { const m = move(o.g, o.c, Math.min(o.len * 0.3, 4)); const [x, y] = g2s(m); label(c, o.label, x + 6, y + 14, col); }
        } else if (o.k === "circ") {
          const [x, y] = g2s(o.g), k = 1 / Math.cos(o.g.lat * D2R);
          const rx = o.r * A.cx[1] * k * view.s, ry = o.r * Math.abs(A.cy[2]) * k * view.s;
          c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.strokeStyle = col; c.lineWidth = 2; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
          if (o.label) label(c, o.label, x + rx * 0.72, y - ry * 0.72, col);
        } else if (o.k === "comp") {
          lineG(c, o.a, o.b, col, 1.5, [3, 3]); const [x1, y1] = dot(c, o.a, col, 3); const [x2, y2] = dot(c, o.b, col, 3);
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; label(c, o.label, mx + 6, my - 12, col);
        }
      }
      for (const p of pending) dot(c, p, C.warn, 5);
      if (origin) { const [x, y] = g2s(origin); c.beginPath(); c.arc(x, y, 9, 0, 7); c.strokeStyle = C.ok; c.lineWidth = 2; c.stroke(); }
      drawLatScale(c);
    }
    function drawLatScale(c) {
      const sw = 40; c.fillStyle = C.sheet; c.globalAlpha = 0.92; c.fillRect(0, 0, sw, ch); c.globalAlpha = 1;
      c.strokeStyle = C.line; c.beginPath(); c.moveTo(sw + 0.5, 0); c.lineTo(sw + 0.5, ch); c.stroke();
      const [ix, iy] = fromS(sw, ch / 2); const lon = px2geo(ix, iy).lon;
      const ytop = px2geo(...fromS(sw, 0)).lat, ybot = px2geo(...fromS(sw, ch)).lat;
      const ppm = Math.abs(g2s({ lat: 36 + 1 / 60, lon })[1] - g2s({ lat: 36, lon })[1]);
      let tick = 5, lab = 10, sub = 1; // minutos
      if (ppm > 70) { tick = 0.1; lab = 1; sub = 0.5; } else if (ppm > 22) { tick = 1; lab = 1; sub = 5; } else if (ppm > 9) { tick = 1; lab = 5; sub = 5; }
      const m0 = Math.floor(Math.min(ytop, ybot) * 60 / tick) * tick, m1 = Math.max(ytop, ybot) * 60;
      c.font = `600 10px ${C.mono}`; c.fillStyle = C.ink; c.strokeStyle = C.ink; c.textBaseline = "middle";
      for (let m = m0; m <= m1 + 1e-9; m += tick) {
        const mm = Math.round(m * 10) / 10; if (mm < 35 * 60 + 40 - 1e-6 || mm > 36 * 60 + 20 + 1e-6) continue; const y = g2s({ lat: mm / 60, lon })[1]; if (y < -5 || y > ch + 5) continue;
        const isLab = Math.abs(mm / lab - Math.round(mm / lab)) < 1e-6, isSub = Math.abs(mm / sub - Math.round(mm / sub)) < 1e-6;
        const len = isLab ? 12 : isSub ? 8 : 4; c.lineWidth = 1; c.beginPath(); c.moveTo(sw - len, y + 0.5); c.lineTo(sw, y + 0.5); c.stroke();
        if (isLab) { const d = Math.floor(mm / 60), mi = mm - d * 60; const t = lab < 1.01 && Math.round(mi) !== mi ? fx(mi, 1) : String(Math.round(mi)).padStart(2, "0"); c.fillText(mi === 0 ? `${d}°` : `${t}′`, 2, y); }
      }
      if (compasBracket) {
        const { lat, d } = compasBracket, y1 = g2s({ lat: lat - d / 120, lon })[1], y2 = g2s({ lat: lat + d / 120, lon })[1];
        c.strokeStyle = C.acc; c.lineWidth = 3; c.beginPath(); c.moveTo(sw - 3, y1); c.lineTo(sw - 3, y2); c.stroke();
      }
    }

    // ---------- Entrada (pan / zoom / toque) ----------
    const ptrs = new Map(); let gest = null;
    const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    on(cv, "pointerdown", (e) => {
      cv.setPointerCapture?.(e.pointerId); const p = local(e); ptrs.set(e.pointerId, p);
      if (ptrs.size === 1) gest = { kind: "pan", x: p[0], y: p[1], ox: view.ox, oy: view.oy, t: performance.now(), moved: false };
      else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; gest = { kind: "pinch", d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, s: view.s, img: fromS(mx, my), moved: true }; }
    });
    on(cv, "pointermove", (e) => {
      const p = local(e);
      if (A && e.pointerType === "mouse") { hoverG = px2geo(...fromS(p[0], p[1])); setRead(hoverG); }
      if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, p);
      if (gest?.kind === "pan" && ptrs.size === 1) {
        const dx = p[0] - gest.x, dy = p[1] - gest.y; if (Math.hypot(dx, dy) > 6) gest.moved = true;
        if (gest.moved) { view.ox = gest.ox - dx / view.s; view.oy = gest.oy - dy / view.s; clampView(); redraw(); }
      } else if (gest?.kind === "pinch" && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        view.s = gest.s * (d / gest.d); clampView(); view.ox = gest.img[0] - mx / view.s; view.oy = gest.img[1] - my / view.s; clampView(); redraw();
      }
    });
    const endPtr = (e) => {
      if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
      if (gest && gest.kind === "pan" && !gest.moved && e.type === "pointerup" && performance.now() - gest.t < 800 && A) { const p = local(e); tap(p[0], p[1]); }
      if (ptrs.size === 0) gest = null;
      else if (ptrs.size === 1) { const p = [...ptrs.values()][0]; gest = { kind: "pan", x: p[0], y: p[1], ox: view.ox, oy: view.oy, t: 0, moved: true }; }
    };
    on(cv, "pointerup", endPtr); on(cv, "pointercancel", endPtr);
    on(cv, "pointerleave", () => { if (hoverG) { hoverG = null; setRead(null); } });
    on(cv, "wheel", (e) => { e.preventDefault(); const p = local(e); zoomAt(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018)), p[0], p[1]); }, { passive: false });
    on(cv, "contextmenu", (e) => e.preventDefault());
    el.querySelectorAll("[data-z]").forEach((b) => on(b, "click", () => { const z = b.dataset.z; if (z === "fit") { fit(); redraw(); } else zoomAt(z === "in" ? 1.6 : 1 / 1.6, cw / 2, ch / 2); }));

    let lastTapG = null;
    function setRead(g) { readEl.textContent = g ? fmtPos(g) : lastTapG ? fmtPos(lastTapG) : "Toca la carta para leer coordenadas"; }
    function snap(sx, sy) {
      let best = null, bd = 18;
      for (const l of LM) { const [x, y] = toS(l.px); const d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = l; } }
      for (const o of objs) if (o.k === "pt") { const [x, y] = g2s(o.g); const d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = { name: o.label || "punto", lat: o.g.lat, lon: o.g.lon }; } }
      return best;
    }
    function tap(sx, sy) {
      const s = snap(sx, sy); const g = s ? { lat: s.lat, lon: s.lon } : px2geo(...fromS(sx, sy));
      lastTapG = g; setRead(null); TOOLS[tool].tap?.(g, s ? s.name : null); redraw();
    }

    // ---------- Objetos y resultados ----------
    function add(...os) { gid++; for (const o of os) { o.gid = gid; objs.push(o); } redraw(); return gid; }
    function say(html, cls = "") { results.unshift({ html, cls, gid }); results = results.slice(0, 8); renderRes(); }
    function renderRes() { resEl.innerHTML = results.map((r, i) => `<div class="r ${r.cls}">${r.html}${r.fixBtn ? ` <button type="button" class="btn sm" data-fix="${i}">Marcar situación</button>` : ""}</div>`).join(""); }
    on(resEl, "click", (e) => {
      const b = e.target.closest("[data-fix]"); if (!b) return; const r = results[+b.dataset.fix]; if (!r?.fix) return;
      add({ k: "pt", g: r.fix, label: "Sit.", col: "ok" }); origin = r.fix; r.fixBtn = false; renderRes(); say(`Situación marcada: <b>${fmtPos(r.fix)}</b>. Es el origen para «Trazar rumbo» y «Estima».`, "m-carta-fix");
    });
    function autoIntersect() {
      const geo = objs.filter((o) => o.k === "line" || o.k === "circ"); if (geo.length < 2) return;
      const a = geo[geo.length - 2], b = geo[geo.length - 1]; let pts = [];
      if (a.k === "line" && b.k === "line") { const p = lineLine(a.g, a.c, b.g, b.c); if (p) pts = [p]; }
      else if (a.k === "line" && b.k === "circ") pts = lineCircle(a.g, a.c, b.g, b.r);
      else if (a.k === "circ" && b.k === "line") pts = lineCircle(b.g, b.c, a.g, a.r);
      else pts = circleCircle(a.g, a.r, b.g, b.r);
      pts = pts.filter((p) => p.lat > 35.5 && p.lat < 36.5 && p.lon > -6.5 && p.lon < -5);
      pts.forEach((p, i) => { results.unshift({ html: `Corte de las dos últimas líneas${pts.length > 1 ? ` (${i + 1}/${pts.length})` : ""}: <b>${fmtPos(p)}</b>`, cls: "m-carta-fix", fix: p, fixBtn: true }); });
      results = results.slice(0, 8); renderRes();
    }
    function undo() {
      if (pending.length) { pending = []; redraw(); return; }
      const g = objs.length ? objs[objs.length - 1].gid : 0; if (!g) return;
      objs = objs.filter((o) => o.gid !== g); if (origin && !objs.some((o) => o.k === "pt" && o.g === origin)) origin = objs.filter((o) => o.k === "pt").pop()?.g || null;
      compasBracket = null; redraw();
    }
    function clearAll() { objs = []; pending = []; origin = null; results = []; compasBracket = null; highlight = null; renderRes(); redraw(); }

    // ---------- Herramientas ----------
    const lmOptions = (sel) => LM.map((l) => `<option value="${l.id}" ${l.id === sel ? "selected" : ""}>${esc(l.name)}</option>`).join("");
    const lmById = (id) => LM.find((l) => l.id === id);
    const rumboInput = (k, def = "") => `<input type="text" inputmode="decimal" class="w4" data-f="${k}" value="${def}" aria-label="Rumbo"><span class="seg" data-g="${k}T"><button type="button" data-v="Rv" aria-pressed="true">Rv</button><button type="button" data-v="Ra" aria-pressed="false">Ra</button></span>`;
    const segVal = (k) => formEl.querySelector(`[data-g="${k}"] [aria-pressed="true"]`)?.dataset.v;
    const fv = (k) => formEl.querySelector(`[data-f="${k}"]`)?.value ?? "";
    function trueOf(k) { // devuelve {v, txt}
      const raw = num(fv(k)); if (!Number.isFinite(raw)) return null; const t = segVal(k + "T") || "Rv"; const ctv = Ct();
      if (t === "Ra") return { v: norm(raw + ctv), txt: `Rv = Ra + Ct = ${deg3(raw)} ${ctv >= 0 ? "+" : "−"} ${fx(Math.abs(ctv))}° = <b>${deg3(raw + ctv)}</b>` };
      return { v: norm(raw), txt: `Rv = <b>${deg3(raw)}</b>` };
    }
    const originTxt = () => origin ? `Origen: <b>${fmtPos(origin)}</b>` : `Origen: <i>toca la carta (o marca una situación)</i>`;

    const TOOLS = {
      punto: {
        name: "Situación", tip: "Marca un punto tocando la carta o introduciendo coordenadas.",
        form: () => `<p class="m-carta-hint">Toca la carta para marcar un punto (se ajusta a los faros cercanos). O sitúa unas coordenadas:</p>
<div class="row"><span class="mono">l</span><input type="text" inputmode="numeric" class="w3" data-f="la" placeholder="36">°<input type="text" inputmode="decimal" class="w4" data-f="lam" placeholder="05,5">′<span class="seg" data-g="ns"><button type="button" data-v="N" aria-pressed="true">N</button><button type="button" data-v="S" aria-pressed="false">S</button></span></div>
<div class="row"><span class="mono">L</span><input type="text" inputmode="numeric" class="w3" data-f="lo" placeholder="005">°<input type="text" inputmode="decimal" class="w4" data-f="lom" placeholder="44,4">′<span class="seg" data-g="we"><button type="button" data-v="W" aria-pressed="true">W</button><button type="button" data-v="E" aria-pressed="false">E</button></span>
<button type="button" class="btn sm primary" data-act="situar">Situar</button></div>`,
        act: { situar() { const la = num(fv("la")) + (num(fv("lam")) || 0) / 60, lo = num(fv("lo")) + (num(fv("lom")) || 0) / 60; if (!Number.isFinite(la) || !Number.isFinite(lo)) return ctx.toast("Introduce latitud y longitud"); const g = { lat: segVal("ns") === "S" ? -la : la, lon: segVal("we") === "E" ? lo : -lo }; place(g, null); centerOn(g, Math.max(view.s, 0.35)); } },
        tap(g, name) { place(g, name); },
      },
      medir: {
        name: "Regla", tip: "Rumbo verdadero y distancia entre dos puntos.",
        form: () => `<p class="m-carta-hint">Toca el punto de salida y después el de llegada: la regla da el <b>rumbo verdadero</b> (transportador) y la <b>distancia</b> (millas = minutos de la escala de latitudes).</p>`,
        tap(g, name) {
          pending.push(g); if (pending.length < 2) return;
          const [a, b] = pending; pending = []; const r = brg(a, b), d = dist(a, b), ctv = Ct();
          add({ k: "seg", a, b, arrow: true, label: `${deg3(r, 0)} · ${fx(d)} M` });
          compasBracket = { lat: (a.lat + b.lat) / 2, d };
          say(`Rv = <b>${deg3(r)}</b> (inverso ${deg3(r + 180)}) · distancia <b>${fx(d)} M</b> · Ra = Rv − Ct = ${deg3(r - ctv)}${name ? ` · hasta ${esc(name)}` : ""}`);
        },
      },
      compas: {
        name: "Compás", tip: "Distancia en millas entre dos puntas.",
        form: () => `<p class="m-carta-hint">Toca las dos puntas del compás. La abertura se marca en la escala de latitudes (izquierda): 1 minuto de latitud = 1 milla. Mide siempre en la escala de <b>latitudes</b>, a la altura de la zona, nunca en la de longitudes.</p>`,
        tap(g) {
          pending.push(g); if (pending.length < 2) return;
          const [a, b] = pending; pending = []; const d = dist(a, b);
          add({ k: "comp", a, b, label: `${fx(d)} M`, col: "acc" }); compasBracket = { lat: (a.lat + b.lat) / 2, d };
          say(`Abertura del compás: <b>${fx(d)} millas</b> (${fx(d)}′ de latitud)`);
        },
      },
      rumbo: {
        name: "Trazar rumbo", tip: "Traza un rumbo desde un punto, o el rumbo para pasar a d millas de un faro.",
        form: () => `<p class="m-carta-hint" data-orig>${originTxt()}</p>
<div class="row"><span>Rumbo</span>${rumboInput("r")}<button type="button" class="btn sm primary" data-act="trazar">Trazar</button></div>
<div class="row"><span>Pasar a</span><input type="text" inputmode="decimal" class="w3" data-f="pd" value="3"><span>M de</span><select data-f="pf">${lmOptions("cires")}</select><button type="button" class="btn sm" data-act="tang">Calcular rumbos</button></div>
<div class="row"><span>Rumbo directo a</span><select data-f="df">${lmOptions("tarifa")}</select><button type="button" class="btn sm" data-act="directo">Trazar</button></div>`,
        tap(g) { origin = g; add({ k: "pt", g, label: "Origen", col: "ok" }); refreshOrig(); },
        act: {
          trazar() { if (!origin) return ctx.toast("Primero toca el origen en la carta"); const t = trueOf("r"); if (!t) return ctx.toast("Introduce el rumbo"); add({ k: "line", g: origin, c: t.v, len: 25, both: false, label: deg3(t.v, 0) }); say(`${t.txt} trazado desde ${fmtPos(origin)}`); autoIntersect(); },
          tang() {
            if (!origin) return ctx.toast("Primero toca el origen en la carta"); const l = lmById(fv("pf")), d = num(fv("pd")); if (!l || !(d > 0)) return;
            const T = { lat: l.lat, lon: l.lon }, D = dist(origin, T), b = brg(origin, T); if (D <= d) return ctx.toast("Ya estás dentro de esa distancia");
            const a = Math.asin(d / D) / D2R, ctv = Ct(); const r1 = norm(b - a), r2 = norm(b + a);
            add({ k: "line", g: origin, c: r1, len: D * 1.6, both: false, label: deg3(r1, 0), col: "acc" }, { k: "line", g: origin, c: r2, len: D * 1.6, both: false, label: deg3(r2, 0), col: "warn", dash: [8, 5] }, { k: "circ", g: T, r: d, col: "muted" });
            say(`Para pasar a ${fx(d)} M de ${esc(l.name)} (dist. ${fx(D)} M, Dv ${deg3(b)}): <b>Rv ${deg3(r1)}</b> (lo dejas por estribor) · Ra ${deg3(r1 - ctv)} — o <b>Rv ${deg3(r2)}</b> (por babor) · Ra ${deg3(r2 - ctv)}. Elige según la costa y lo que pida el enunciado.`);
          },
          directo() { if (!origin) return ctx.toast("Primero toca el origen en la carta"); const l = lmById(fv("df")); const T = { lat: l.lat, lon: l.lon }, r = brg(origin, T), D = dist(origin, T), ctv = Ct(); add({ k: "seg", a: origin, b: T, arrow: true, label: `${deg3(r, 0)} · ${fx(D)} M` }); say(`Rumbo directo a ${esc(l.name)}: <b>Rv ${deg3(r)}</b> · Ra = Rv − Ct = ${deg3(r - ctv)} · distancia ${fx(D)} M`); },
        },
      },
      demora: {
        name: "Demora", tip: "Línea de posición por demora (Da o Dv) o marcación a un faro.",
        form: () => `<div class="row"><span>Faro</span><select data-f="f">${lmOptions("trafalgar")}</select><span class="m-carta-hint">(o tócalo en la carta)</span></div>
<div class="row"><span class="seg" data-g="dt"><button type="button" data-v="Da" aria-pressed="true">Demora de aguja</button><button type="button" data-v="Dv" aria-pressed="false">Demora verdadera</button><button type="button" data-v="M" aria-pressed="false">Marcación</button></span></div>
<div class="row" data-show="D"><span data-lab>Da</span><input type="text" inputmode="decimal" class="w4" data-f="d" placeholder="315"><span>°</span></div>
<div class="row" data-show="M" hidden><span>M</span><input type="text" inputmode="decimal" class="w4" data-f="m" placeholder="70"><span class="seg" data-g="side"><button type="button" data-v="Er" aria-pressed="true">Estribor (+)</button><button type="button" data-v="Br" aria-pressed="false">Babor (−)</button></span><span>con</span>${rumboInput("rr")}</div>
<div class="row"><button type="button" class="btn sm primary" data-act="trazar">Trazar demora</button></div>
<p class="m-carta-hint">Desde el faro se traza la opuesta (Dv ± 180°): el barco está sobre esa línea. Con dos líneas, la app calcula el corte (situación).</p>`,
        bind() { const upd = () => { const t = segVal("dt"); formEl.querySelector('[data-show="D"]').hidden = t === "M"; formEl.querySelector('[data-show="M"]').hidden = t !== "M"; formEl.querySelector("[data-lab]").textContent = t; }; formEl.querySelector('[data-g="dt"]').addEventListener("click", () => setTimeout(upd)); upd(); },
        tap(g, name) { const l = name && LM.find((x) => x.name === name); if (l) formEl.querySelector('[data-f="f"]').value = l.id; else { ctx.toast("Elige un faro de la lista o toca uno de los marcados"); } highlight = l ? { lat: l.lat, lon: l.lon } : null; },
        act: {
          trazar() {
            const l = lmById(fv("f")); if (!l) return; const F = { lat: l.lat, lon: l.lon }, t = segVal("dt"), ctv = Ct(); let dv, txt;
            if (t === "M") {
              const m = num(fv("m")), rr = trueOf("rr"); if (!Number.isFinite(m) || !rr) return ctx.toast("Introduce marcación y rumbo");
              const sg = segVal("side") === "Br" ? -1 : 1; dv = norm(rr.v + sg * m); txt = `${rr.txt}; Dv = Rv + M = ${deg3(rr.v)} ${sg > 0 ? "+" : "−"} ${fx(m)}° = <b>${deg3(dv)}</b>`;
            } else {
              const d = num(fv("d")); if (!Number.isFinite(d)) return ctx.toast("Introduce la demora");
              if (t === "Da") { dv = norm(d + ctv); txt = `Dv = Da + Ct = ${deg3(d)} ${ctv >= 0 ? "+" : "−"} ${fx(Math.abs(ctv))}° = <b>${deg3(dv)}</b>`; } else { dv = norm(d); txt = `Dv = <b>${deg3(dv)}</b>`; }
            }
            add({ k: "line", g: F, c: norm(dv + 180), len: 14, both: true, label: `${l.short} ${deg3(dv, 0)}` });
            say(`${esc(l.name)}: ${txt}; desde el faro, opuesta ${deg3(dv + 180)}.`); autoIntersect();
          },
        },
      },
      enfil: {
        name: "Enfilación", tip: "Enfilación u oposición entre dos puntos; Ct = Dv − Da.",
        form: () => `<div class="row"><span>De</span><select data-f="a">${lmOptions("carnero")}</select><span>a</span><select data-f="b">${lmOptions("europa")}</select><button type="button" class="btn sm primary" data-act="trazar">Trazar línea</button></div>
<div class="row"><span>Da observada a</span><select data-f="o">${lmOptions("europa")}</select><input type="text" inputmode="decimal" class="w4" data-f="da" placeholder="047"><span>°</span><button type="button" class="btn sm" data-act="ct">Calcular Ct</button></div>
<p class="m-carta-hint"><b>Enfilación</b>: los dos puntos se ven en la misma dirección (estás fuera del segmento). <b>Oposición</b>: uno por la proa y otro por la popa (estás entre ellos). La línea es la misma; la demora medida en la carta comparada con la de aguja da la Ct. Toca dos puntos en la carta para trazar entre puntos cualesquiera.</p>`,
        tap(g) { pending.push(g); if (pending.length < 2) return; const [a, b] = pending; pending = []; const r = brg(a, b); add({ k: "line", g: a, c: r, len: dist(a, b) + 12, both: true, label: deg3(r, 0) }); say(`Línea entre los dos puntos: Dv ${deg3(r)} / ${deg3(r + 180)}`); autoIntersect(); },
        act: {
          trazar() { const a = lmById(fv("a")), b = lmById(fv("b")); if (!a || !b || a === b) return; const A1 = { lat: a.lat, lon: a.lon }, B1 = { lat: b.lat, lon: b.lon }, r = brg(A1, B1); add({ k: "line", g: A1, c: r, len: dist(A1, B1) + 14, both: true, label: `${a.short}–${b.short}` }); say(`${esc(a.name)} → ${esc(b.name)}: Dv <b>${deg3(r)}</b>; ${esc(b.name)} → ${esc(a.name)}: Dv <b>${deg3(r + 180)}</b>`); autoIntersect(); },
          ct() {
            const a = lmById(fv("a")), b = lmById(fv("b")), o = lmById(fv("o")), da = num(fv("da")); if (!a || !b || !Number.isFinite(da)) return ctx.toast("Introduce la Da observada");
            const other = o.id === a.id ? b : a; const dv = brg({ lat: other.lat, lon: other.lon }, { lat: o.lat, lon: o.lon });
            let c = norm(dv - da); if (c > 180) c -= 360;
            say(`Dv a ${esc(o.name)} (desde la línea) ≈ ${deg3(dv)} (en oposición sería ${deg3(dv + 180)}). Ct = Dv − Da = ${deg3(dv)} − ${deg3(da)} = <b>${c >= 0 ? "+" : "−"}${fx(Math.abs(c))}°</b>. Si estás en oposición respecto de ${esc(o.name)}, usa la otra dirección.`);
          },
        },
      },
      circulo: {
        name: "Distancia", tip: "Círculo de distancia (radar o compás) alrededor de un punto.",
        form: () => `<div class="row"><span>Centro</span><select data-f="f">${lmOptions("tarifa")}</select><span>radio</span><input type="text" inputmode="decimal" class="w3" data-f="r" value="3"><span>M</span><button type="button" class="btn sm primary" data-act="trazar">Trazar círculo</button></div>
<p class="m-carta-hint">Una distancia radar a un faro es un círculo de posición. Con una demora o con otro círculo, la app calcula el corte. También puedes tocar la carta para usar el punto tocado como centro.</p>`,
        tap(g, name) { const r = num(fv("r")); if (!(r > 0)) return; add({ k: "circ", g, r, label: `${fx(r)} M` }); say(`Círculo de ${fx(r)} M con centro en ${name ? esc(name) : fmtPos(g)}`); autoIntersect(); },
        act: { trazar() { const l = lmById(fv("f")), r = num(fv("r")); if (!l || !(r > 0)) return; add({ k: "circ", g: { lat: l.lat, lon: l.lon }, r, label: `${fx(r)} M` }); say(`Círculo de ${fx(r)} M alrededor de ${esc(l.name)}`); autoIntersect(); } },
      },
      estima: {
        name: "Estima", tip: "Situación de estima desde un punto con rumbo, velocidad y tiempo.",
        form: () => `<p class="m-carta-hint" data-orig>${originTxt()}</p>
<div class="row"><span>Rumbo</span>${rumboInput("r")}</div>
<div class="row"><span>Vm</span><input type="text" inputmode="decimal" class="w3" data-f="v" value="10"><span>nudos · HRB salida</span><input type="text" class="w4" data-f="h0" value="10:00" aria-label="Hora de salida"></div>
<div class="row"><span>Tiempo</span><input type="text" class="w4" data-f="t" placeholder="1:30" aria-label="Tiempo h:mm"><span>o distancia</span><input type="text" inputmode="decimal" class="w3" data-f="d" placeholder="15"><span>M</span><button type="button" class="btn sm primary" data-act="estima">Situación de estima</button></div>
<div class="row"><span>Hora al través de</span><select data-f="tf">${lmOptions("tarifa")}</select><button type="button" class="btn sm" data-act="traves">Través</button><button type="button" class="btn sm" data-act="mer" title="Al norte o sur verdadero del punto">Su meridiano (N/S)</button><button type="button" class="btn sm" data-act="par" title="Al este u oeste verdadero del punto">Su paralelo (E/W)</button></div>
<p class="m-carta-hint">d = v × t (millas = nudos × horas). t = d / v → minutos = d × 60 / v. Sin corriente ni abatimiento (no entran en el examen PER).</p>`,
        tap(g) { origin = g; add({ k: "pt", g, label: "Origen", col: "ok" }); refreshOrig(); },
        act: {
          estima() {
            if (!origin) return ctx.toast("Toca el origen en la carta"); const t = trueOf("r"), v = num(fv("v")); if (!t) return ctx.toast("Introduce el rumbo");
            let d = num(fv("d")), tm = parseHM(fv("t"));
            if (!(d > 0)) { if (!(tm > 0) || !(v > 0)) return ctx.toast("Introduce tiempo (h:mm) y velocidad, o distancia"); d = (v * tm) / 60; } else if (v > 0) tm = (d * 60) / v;
            const e = move(origin, t.v, d), h0 = parseHM(fv("h0"));
            add({ k: "seg", a: origin, b: e, arrow: true, label: `${deg3(t.v, 0)} · ${fx(d)} M` }, { k: "pt", g: e, label: "Se", col: "ok" });
            say(`${t.txt}; d = ${Number.isFinite(tm) && v > 0 ? `${fx(v)} kn × ${fx(tm / 60, 2)} h = ` : ""}<b>${fx(d)} M</b> → situación de estima <b>${fmtPos(e)}</b>${Number.isFinite(h0) && Number.isFinite(tm) ? ` a HRB ${hhmm(h0 + tm)}` : ""}`, "m-carta-fix");
            origin = e; refreshOrig();
          },
          traves() { travesLike("traves"); }, mer() { travesLike("mer"); }, par() { travesLike("par"); },
        },
      },
    };
    function travesLike(kind) {
      if (!origin) return ctx.toast("Toca el origen en la carta"); const t = trueOf("r"), v = num(fv("v")), h0 = parseHM(fv("h0")); if (!t) return ctx.toast("Introduce el rumbo");
      const l = lmById(fv("tf")), F = { lat: l.lat, lon: l.lon }; let P = null, what = "";
      if (kind === "traves") { const f = foot(origin, t.v, F); if (!f.ahead) return ctx.toast("Ese punto ya quedó por la popa"); P = f.g; what = `al través de ${esc(l.name)} (a ${fx(dist(P, F))} M)`; }
      else if (kind === "mer") { P = crossMeridian(origin, t.v, l.lon); what = `en el meridiano de ${esc(l.name)} (al ${P && P.lat > l.lat ? "N" : "S"} verdadero, a ${P ? fx(dist(P, F)) : "–"} M)`; }
      else { P = crossParallel(origin, t.v, l.lat); what = `en el paralelo de ${esc(l.name)} (al ${P && P.lon > l.lon ? "E" : "W"} verdadero, a ${P ? fx(dist(P, F)) : "–"} M)`; }
      if (!P) return ctx.toast("Con ese rumbo no se corta");
      const d = dist(origin, P); add({ k: "seg", a: origin, b: P, arrow: true, label: `${fx(d)} M` }, { k: "pt", g: P, col: "warn" }, { k: "seg", a: P, b: F, dash: [4, 4], col: "warn" });
      const tm = v > 0 ? (d * 60) / v : NaN;
      say(`${t.txt}; ${what}: distancia navegada <b>${fx(d)} M</b>${v > 0 ? ` → t = ${fx(d)} × 60 / ${fx(v)} = ${fx(tm, 0)} min` : ""}${Number.isFinite(h0) && v > 0 ? ` → <b>HRB ${hhmm(h0 + tm)}</b>` : ""} · punto ${fmtPos(P)}`);
    }
    function place(g, name) { add({ k: "pt", g, label: name ? LM.find((l) => l.name === name)?.short || "P" : "P" }); origin = g; say(`${name ? esc(name) + ": " : "Punto: "}<b>${fmtPos(g)}</b>`); }
    function refreshOrig() { const o = formEl.querySelector("[data-orig]"); if (o) o.innerHTML = originTxt(); }

    const TOOL_ORDER = ["punto", "medir", "compas", "rumbo", "demora", "enfil", "circulo", "estima"];
    toolsEl.innerHTML = TOOL_ORDER.map((k) => `<button type="button" class="btn sm" data-tool="${k}" title="${esc(TOOLS[k].tip)}" aria-pressed="${k === tool}">${TOOLS[k].name}</button>`).join("") +
      `<span style="flex:1"></span><button type="button" class="btn sm ghost" data-act-g="undo">↶ Deshacer</button><button type="button" class="btn sm ghost" data-act-g="clear">Borrar</button><button type="button" class="btn sm ghost" data-act-g="lm" aria-pressed="${showLM}">Faros</button>`;
    function setTool(k) {
      tool = k; pending = []; toolsEl.querySelectorAll("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === k)));
      formEl.innerHTML = `<div class="row"><h4>${TOOLS[k].name}</h4><span class="small muted">${esc(TOOLS[k].tip)}</span></div>` + TOOLS[k].form();
      TOOLS[k].bind?.(); redraw();
    }
    on(toolsEl, "click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.tool) setTool(b.dataset.tool);
      else if (b.dataset.actG === "undo") undo();
      else if (b.dataset.actG === "clear") clearAll();
      else if (b.dataset.actG === "lm") { showLM = !showLM; store.set("showLM", showLM); b.setAttribute("aria-pressed", String(showLM)); redraw(); }
    });
    on(formEl, "click", (e) => {
      const sb = e.target.closest(".seg[data-g] button"); if (sb) { sb.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === sb))); return; }
      const a = e.target.closest("[data-act]"); if (a && A) TOOLS[tool].act?.[a.dataset.act]?.();
    });

    // Barra Ct
    const ctOut = $("[data-ctout]");
    function renderCt() {
      el.querySelectorAll("[data-dmside]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dmside === ct.dmSide)));
      el.querySelectorAll("[data-dvsign]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dvsign === ct.dvSign)));
      $('[data-ct="dm"]').value = ct.dm; $('[data-ct="dv"]').value = ct.dv;
      const dmv = (ct.dmSide === "E" ? 1 : -1) * (num(ct.dm) || 0), dvv = (ct.dvSign === "+" ? 1 : -1) * (num(ct.dv) || 0), t = dmv + dvv;
      ctOut.textContent = `Ct = dm + Δ = (${dmv >= 0 ? "+" : "−"}${fx(Math.abs(dmv))}) + (${dvv >= 0 ? "+" : "−"}${fx(Math.abs(dvv))}) = ${t >= 0 ? "+" : "−"}${fx(Math.abs(t))}°`;
      store.set("ct", ct);
    }
    el.querySelectorAll("[data-ct]").forEach((i) => on(i, "input", () => { ct[i.dataset.ct] = i.value; renderCt(); }));
    el.querySelectorAll("[data-dmside]").forEach((b) => on(b, "click", () => { ct.dmSide = b.dataset.dmside; renderCt(); }));
    el.querySelectorAll("[data-dvsign]").forEach((b) => on(b, "click", () => { ct.dvSign = b.dataset.dvsign; renderCt(); }));
    renderCt();

    // ---------- Carga ----------
    const ro = new ResizeObserver(() => resize()); ro.observe(stage); cleanups.push(() => ro.disconnect());
    const io = new IntersectionObserver((es) => { visible = es[0]?.isIntersecting ?? true; if (visible) redraw(); }); io.observe(stage); cleanups.push(() => io.disconnect());
    if (ctx.onTheme) cleanups.push(ctx.onTheme(() => { readColors(); redraw(); }));
    (async () => {
      try {
        chart = await getJSON("data/chart.json");
        W = chart.width; H = chart.height; A = chart.transform;
        const det = A.cx[1] * A.cy[2] - A.cx[2] * A.cy[1]; Ainv = [A.cy[2] / det, -A.cx[2] / det, -A.cy[1] / det, A.cx[1] / det];
        let pts = [];
        try { const lmc = await getJSON("data/landmarks-chart.json"); pts = lmc.points || []; }
        catch { try { const l2 = await getJSON("data/landmarks.json"); pts = (Array.isArray(l2) ? l2 : l2.points || []).map((p, i) => ({ id: "l" + i, name: p.name, lat: p.lat, lon: p.lon, light: p.light })); } catch {} }
        LM = pts.map((p) => ({ ...p, short: shortName(p.name) })).sort((a, b) => a.name.localeCompare(b.name, "es"));
        LM.forEach((l) => (l.px = geo2px(l)));
        if (!alive) return;
        setTool(tool); setRead(null); resize();
        const coarse = matchMedia("(pointer: coarse)").matches || (window.innerWidth || 1000) < 700;
        const variants = chart.variants || [{ file: chart.image }];
        const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im); im.onerror = rej; im.src = ctx.asset(src); });
        const lo = variants[0]; img = await loadImg(lo.file).catch(() => null); redraw();
        const hi = coarse ? variants[Math.min(1, variants.length - 1)] : variants[variants.length - 1];
        if (hi && hi.file !== lo.file) { const h = await loadImg(hi.file).catch(() => null); if (h && alive) { img = h; redraw(); } }
      } catch (err) { readEl.textContent = "No se pudo cargar la carta."; }
    })();
    function shortName(n) { return n.replace(/^(Faro de |Puerto de |Marca cardinal )/i, "").replace(/\s*\(.*\)\s*/g, "").replace(/^(Punta|Cabo|Isla de) /, (m) => ({ "Punta ": "Pta. ", "Cabo ": "C. ", "Isla de ": "I. " }[m])).slice(0, 18); }

    // ---------- Descargas ----------
    on($('[data-dl="pdf"]'), "click", async () => {
      try { const r = await fetch(ctx.asset("img/carta-estrecho-A3.pdf")); const b = new Uint8Array(await r.arrayBuffer()); const ok = await ctx.download("carta-estrecho-L105-A3.pdf", b, "application/pdf"); if (ok === false) ctx.toast("Descarga cancelada"); }
      catch { ctx.toast("No se pudo preparar la carta"); }
    });
    on($('[data-dl="hoja"]'), "click", async () => {
      try { const qs = await loadQs(); const html = sheetHTML(qs); const ok = await ctx.download("problemas-carta-PER.html", html, "text/html"); if (ok === false) ctx.toast("Descarga cancelada"); }
      catch { ctx.toast("No se pudo generar la hoja"); }
    });

    // ---------- Problemas oficiales ----------
    let QS = null, theory = null, anu = null, pidx = store.get("pidx", 0), pfilter = store.get("pfilter", "todos"), answered = null;
    const isTide = (q) => /marea|pleamar|bajamar|sonda en el momento|presi[oó]n atmosf/i.test(q.stem);
    const isDraw = (q) => !isTide(q) && CITE.some(([, re]) => re.test(q.stem));
    async function loadQs() {
      if (QS) return QS;
      const d = await getJSON("data/questions.json"); QS = (d.questions || []).filter((q) => q.b === "car");
      theory = await getJSON("data/theory/tema-10.json").catch(() => null);
      anu = await getJSON("data/anuario.json").catch(() => null);
      return QS;
    }
    const conv = (s) => String(s).slice(0, 7);
    const filtered = () => (QS || []).filter((q) => pfilter === "todos" || (pfilter === "mareas" ? isTide(q) : pfilter === "trazado" ? isDraw(q) : !isTide(q) && !isDraw(q)));
    function solutionFor(q) {
      const sub = theory?.subtemas?.find((s) => s.id === "10.9"); if (!sub?.html) return "";
      const parts = sub.html.split(/(?=<h4>)/i).filter((p) => p.includes(`[${q.id}]`));
      return parts.join("");
    }
    function renderProb() {
      const list = filtered(); if (!list.length) { probTop.innerHTML = `<p>No hay problemas con este filtro.</p>`; probBot.innerHTML = ""; return; }
      pidx = clamp(pidx, 0, list.length - 1); store.set("pidx", pidx); const q = list[pidx]; answered = null;
      const ok = store.get("ok", 0), done = store.get("done", {});
      const cites = CITE.filter(([, re]) => re.test(q.stem)).map(([id]) => lmById(id)).filter(Boolean);
      const seen = (q.seen || []).map((s) => s.replace("#", " · P")).join(", ");
      const imgs = isTide(q) && anu ? [...new Set((q.seen || []).flatMap((s) => anu.byConvocatoria?.[conv(s)] || []))] : [];
      probTop.innerHTML = `
<div class="panel stack">
  <div class="row" style="justify-content:space-between">
    <div class="seg" role="group" aria-label="Filtro">${["todos", "trazado", "mareas", "calculo"].map((f) => `<button type="button" data-pf="${f}" aria-pressed="${f === pfilter}">${{ todos: "Todos", trazado: "Trazado", mareas: "Mareas", calculo: "Cálculo/teoría" }[f]}</button>`).join("")}</div>
    <span class="chip ok" title="Aciertos acumulados">${ok} aciertos</span>
  </div>
  <div class="row"><span class="eyebrow">Problema ${pidx + 1}/${list.length}</span><span class="chip m-carta-seen">${esc(seen)}</span>${done[q.id] === true ? '<span class="chip ok">resuelto</span>' : done[q.id] === false ? '<span class="chip bad">fallado</span>' : ""}</div>
  <p class="m-carta-stem">${esc(q.stem)}</p>
  ${cites.length ? `<div class="row"><span class="small muted">Puntos citados:</span>${cites.map((l) => `<button type="button" class="btn sm" data-cite="${l.id}">${esc(l.short)}</button>`).join("")}</div>` : ""}
  ${imgs.length ? `<div class="stack"><span class="small muted">Extracto del Anuario de Mareas entregado en esa convocatoria (horas UTC):</span><div class="m-carta-thumbs">${imgs.map((f) => { const m = anu.images.find((i) => i.file === f); return `<button type="button" data-img="${f}"><img src="${ctx.asset(f)}" alt="" loading="lazy"><span>${esc(m?.puerto ? m.puerto + " " + m.anio : m?.kind === "presion" ? "Corrección presión" : m?.kind === "instante" ? "Altura en un instante" : m?.kind === "coeficientes" ? "Coeficientes " + m.anio : "Anuario")}</span></button>`; }).join("")}</div><div class="m-carta-viewer" hidden></div></div>` : isTide(q) ? `<p class="small muted">Esta convocatoria no incluye páginas escaneadas del Anuario en el PDF oficial.</p>` : ""}
</div>`;
      probBot.innerHTML = `
<div class="m-carta-opts">${q.opts.map((o, i) => `<button type="button" class="btn" data-opt="${i}"><b>${"abcd"[i]})</b>&nbsp;${esc(o)}</button>`).join("")}</div>
<div class="row"><button type="button" class="btn sm" data-nav="-1">← Anterior</button><button type="button" class="btn sm" data-nav="rnd">Al azar</button><button type="button" class="btn sm" data-nav="1">Siguiente →</button></div>
<div class="m-carta-sol" hidden></div>`;
    }
    on(probTop, "click", (e) => {
      const f = e.target.closest("[data-pf]"); if (f) { pfilter = f.dataset.pf; store.set("pfilter", pfilter); pidx = 0; renderProb(); return; }
      const c = e.target.closest("[data-cite]"); if (c) { const l = lmById(c.dataset.cite); highlight = { lat: l.lat, lon: l.lon }; centerOn(highlight, Math.max(view.s, 0.3)); stage.scrollIntoView({ block: "nearest", behavior: "smooth" }); return; }
      const im = e.target.closest("[data-img]"); if (im) { const v = probTop.querySelector(".m-carta-viewer"); const same = !v.hidden && v.dataset.f === im.dataset.img; v.hidden = same; v.dataset.f = im.dataset.img; v.innerHTML = same ? "" : `<div class="row" style="position:sticky;top:0;left:0;padding:.3rem;background:var(--sheet)"><button type="button" class="btn sm" data-iz="1.4">+</button><button type="button" class="btn sm" data-iz="0.7">−</button><span class="small muted">Desplaza para leer</span></div><img src="${ctx.asset(im.dataset.img)}" alt="Página del Anuario de Mareas" style="width:100%">`; return; }
      const iz = e.target.closest("[data-iz]"); if (iz) { const i = probTop.querySelector(".m-carta-viewer img"); const w = parseFloat(i.style.width) || 100; i.style.width = clamp(w * +iz.dataset.iz, 100, 400) + "%"; }
    });
    on(probBot, "click", (e) => {
      const n = e.target.closest("[data-nav]"); const list = filtered();
      if (n) { pidx = n.dataset.nav === "rnd" ? Math.floor(Math.random() * list.length) : (pidx + +n.dataset.nav + list.length) % list.length; renderProb(); probTop.scrollIntoView({ block: "start", behavior: "smooth" }); return; }
      const o = e.target.closest("[data-opt]"); if (!o || answered !== null) return;
      const q = list[pidx], i = +o.dataset.opt, good = (q.ok || []).includes(i); answered = i;
      probBot.querySelectorAll("[data-opt]").forEach((b) => { const k = +b.dataset.opt; if ((q.ok || []).includes(k)) b.classList.add("ok"); else if (k === i) b.classList.add("bad"); });
      const done = store.get("done", {}); const first = !(q.id in done), prevOk = done[q.id] === true; done[q.id] = good || prevOk; store.set("done", done);
      if (good) { const ok = store.get("ok", 0) + (prevOk ? 0 : 1); store.set("ok", ok); if (!prevOk) ctx.award(first ? 15 : 8, "Problema de carta correcto"); if (ok >= 5) ctx.badge("navegante"); }
      const sol = probBot.querySelector(".m-carta-sol"); sol.hidden = false;
      const th = solutionFor(q);
      const recs = (anu?.records || []).filter((r) => r.preguntas.includes(q.id));
      const recHTML = recs.map((r) => `<p><b>Anuario, ${esc(r.puerto)} ${r.fecha.split("-").reverse().join("-")}</b> (UTC): ${r.mareas.map((m) => `${m.t} ${fx(m.h, 2)} m (${m.tipo === "P" ? "PM" : "BM"})`).join(" · ")}. Sonda en el momento = sonda en carta + altura de marea + corrección por presión (≈ 1 cm por mb por debajo de 1013; se resta por encima).</p>`).join("");
      const multi = (q.ok || []).length > 1 ? `<p class="small muted">Pregunta anulada o con varias respuestas válidas en la plantilla oficial.</p>` : "";
      sol.innerHTML = `<p class="${good ? "fb-ok" : "fb-bad"}">${good ? "Correcto." : `Incorrecto. La respuesta oficial es ${(q.ok || []).map((k) => "abcd"[k] + ")").join(" / ")}.`}</p>${multi}${recHTML}${th ? `<div class="stack"><span class="eyebrow">Solución paso a paso (Tema 10.9)</span>${th}</div>` : `<p class="small muted">Resuélvelo con las herramientas: pasa todo a verdadero con la Ct (Dv = Da + Ct; Rv = Ra + Ct; Dv = Rv ± M), traza las líneas de posición desde los faros, mide rumbos con la regla y distancias con el compás (escala de latitudes) y comprueba qué opción coincide.</p>`}`;
      renderProbHeaderCount();
    });
    function renderProbHeaderCount() { const c = probTop.querySelector(".chip.ok"); if (c) c.textContent = `${store.get("ok", 0)} aciertos`; }
    el.querySelectorAll("[data-mode]").forEach((b) => on(b, "click", async () => {
      el.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const pm = b.dataset.mode === "prob"; probTop.hidden = !pm; probBot.hidden = !pm;
      if (pm) { probTop.innerHTML = `<p class="muted">Cargando problemas…</p>`; try { await loadQs(); if (alive) renderProb(); } catch { probTop.innerHTML = `<p class="fb-bad">No se pudieron cargar los problemas.</p>`; } }
    }));

    function sheetHTML(qs) {
      const rows = qs.map((q, n) => `<section><h3>${n + 1}. <small>[${esc((q.seen || []).join(", "))}]</small></h3><p>${esc(q.stem)}</p><ol type="a">${q.opts.map((o) => `<li>${esc(o)}</li>`).join("")}</ol></section>`).join("");
      const key = qs.map((q, n) => `<tr><td>${n + 1}</td><td>${(q.ok || []).map((k) => "abcd"[k]).join(", ")}</td><td>${esc((q.seen || [])[0] || "")}</td></tr>`).join("");
      return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Problemas oficiales de carta – PER</title>
<style>body{font:15px/1.45 Georgia,serif;max-width:780px;margin:24px auto;padding:0 16px;color:#111}h1{font:700 24px system-ui,sans-serif}h2{font:700 19px system-ui,sans-serif;margin-top:32px}h3{font:600 15px system-ui,sans-serif;margin:18px 0 4px}h3 small{font-weight:400;color:#666}section{break-inside:avoid;border-bottom:1px solid #ddd;padding-bottom:8px}ol{margin:4px 0}li{margin:2px 0}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:3px 8px;font:13px system-ui}.key{break-before:page}@media print{body{margin:0}}</style></head><body>
<h1>Problemas oficiales de carta de navegación – PER (2022–2026)</h1>
<p>Carta IHM L105 (Estrecho de Gibraltar) y extracto del Anuario de Mareas. Sin calculadora: transportador, compás, regla y lápiz. ${qs.length} enunciados del bloque «Carta de navegación» de las convocatorias oficiales; la clave está al final.</p>
${rows}<h2 class="key">Clave de respuestas</h2><table><thead><tr><th>N.º</th><th>Respuesta</th><th>Convocatoria</th></tr></thead><tbody>${key}</tbody></table></body></html>`;
    }

    return () => { alive = false; if (raf) cancelAnimationFrame(raf); cleanups.forEach((f) => { try { f(); } catch {} }); el.innerHTML = ""; };
  },
};
