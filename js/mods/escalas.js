// Escalas Beaufort (0–12) y Douglas (0–9) con escena animada del mar (Tema 9 · 9.5 / 9.7 / 9.1).
// Fetch, persistencia e intensidad; mar de viento vs mar de fondo; avisos costeros AEMET y fuentes 2026.
// Claves contrastadas con q_met.txt (baa85eea20, 6856f57832, 52a96cae93, 98a75dfe3e, ff1559a6ca, b23b5196df…).

const ID = "escalas";

const CSS = `
.m-escalas .es-top{display:flex;flex-wrap:wrap;gap:.6rem;align-items:flex-end;justify-content:space-between}
.m-escalas .es-cards{display:grid;gap:.8rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))}
.m-escalas .es-big{font:600 2.2rem/1 var(--f-display)}
.m-escalas .es-name{font:600 1.25rem/1.1 var(--f-display)}
.m-escalas tr.is-cur td{background:color-mix(in srgb,var(--accent) 14%,transparent)}
.m-escalas td.num,.m-escalas th.num{white-space:nowrap}
.m-escalas .es-tables{display:grid;gap:1rem;grid-template-columns:minmax(0,1fr)}
@media (min-width:1150px){.m-escalas .es-tables{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}}
.m-escalas td.es-asp{min-width:200px}
.m-escalas .es-aviso{display:inline-block;padding:.15em .6em;border-radius:999px;font-weight:700;font-size:.85rem;border:1px solid var(--line)}
.m-escalas .es-sl{display:grid;gap:.15rem}
.m-escalas .es-sl span{display:flex;justify-content:space-between;gap:.5rem;font-size:.92rem}
.m-escalas .es-pick{display:grid;gap:.35rem;grid-template-columns:repeat(auto-fill,minmax(44px,1fr))}
.m-escalas .es-pick button{min-height:40px;padding:0}
.m-escalas .es-pick button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.m-escalas .es-pick button.is-ok{outline:2px solid var(--ok);outline-offset:-2px}
.m-escalas .es-pick button.is-bad{outline:2px solid var(--bad);outline-offset:-2px}
.m-escalas ul{margin:0;padding-left:1.1rem}
.m-escalas li{margin:.15rem 0}
.m-escalas .es-hud{position:absolute;left:8px;top:8px;display:flex;gap:.35rem;flex-wrap:wrap;pointer-events:none}
.m-escalas .es-hud .chip{background:color-mix(in srgb,var(--sheet) 82%,transparent)}
`;

// f, denominación, nudos, km/h, aspecto de la mar, altura probable, altura máx., Douglas típico, Douglas aceptados
const BEAU = [
  [0, "Calma", "< 1", "< 1", "Mar como un espejo.", 0, 0, 0, [0, 0]],
  [1, "Ventolina", "1–3", "1–5", "Rizos como escamas de pez, sin espuma.", .1, .1, 1, [1, 1]],
  [2, "Flojito", "4–6", "6–11", "Olitas cortas; crestas de aspecto vítreo que no rompen.", .2, .3, 2, [2, 2]],
  [3, "Flojo", "7–10", "12–19", "Olas algo mayores; las crestas empiezan a romper; algún borreguillo disperso.", .6, 1, 2, [2, 3]],
  [4, "Bonancible", "11–16", "20–28", "Olas pequeñas que se alargan; borreguillos frecuentes.", 1, 1.5, 3, [3, 3]],
  [5, "Fresquito", "17–21", "29–38", "Olas moderadas y alargadas; muchos borreguillos; algún roción.", 2, 2.5, 4, [4, 4]],
  [6, "Fresco", "22–27", "39–49", "Se forman olas grandes; crestas de espuma blanca por todas partes; probables rociones.", 3, 4, 5, [5, 5]],
  [7, "Frescachón", "28–33", "50–61", "La mar engruesa; la espuma de las rompientes empieza a ser arrastrada en estrías.", 4, 5.5, 5, [5, 6]],
  [8, "Temporal", "34–40", "62–74", "Olas altas y alargadas; las crestas rompen en rociones; espuma en estrías bien marcadas.", 5.5, 7.5, 6, [6, 6]],
  [9, "Temporal fuerte", "41–47", "75–88", "Olas muy gruesas; densas estrías de espuma; las crestas rompen y ruedan; los rociones reducen la visibilidad.", 7, 10, 6, [6, 7]],
  [10, "Temporal duro", "48–55", "89–102", "Olas muy altas con largas crestas en penacho; la mar se ve blanca; visibilidad reducida.", 9, 12.5, 7, [7, 7]],
  [11, "Temporal muy duro", "56–63", "103–117", "Olas excepcionalmente altas (pueden ocultar barcos medianos); mar cubierta de bancos de espuma.", 11.5, 16, 8, [8, 8]],
  [12, "Temporal huracanado", "≥ 64", "≥ 118", "Aire lleno de espuma y rociones; mar completamente blanca; visibilidad casi nula.", 14, 16, 9, [9, 9]],
].map(([f, n, kn, kmh, mar, h, hmax, d, dg]) => ({ f, n, kn, kmh, mar, h, hmax, d, dg }));
const KN_MID = [0, 2, 5, 8.5, 13.5, 19, 24.5, 30.5, 37, 44, 51.5, 59.5, 68];

const DOUG = [
  [0, "Mar llana (calma)", "0", 0, 0, "Superficie lisa como un espejo."],
  [1, "Mar rizada", "0 – 0,1", 0, .1, "Rizos sin espuma."],
  [2, "Marejadilla", "0,1 – 0,5", .1, .5, "Olas pequeñas; crestas vítreas, rompen poco."],
  [3, "Marejada", "0,5 – 1,25", .5, 1.25, "Olas que rompen con borreguillos frecuentes."],
  [4, "Fuerte marejada", "1,25 – 2,5", 1.25, 2.5, "Olas moderadas, muchos borreguillos."],
  [5, "Mar gruesa", "2,5 – 4", 2.5, 4, "Olas grandes con crestas de espuma por todas partes."],
  [6, "Mar muy gruesa", "4 – 6", 4, 6, "La mar se amontona; estrías de espuma."],
  [7, "Mar arbolada", "6 – 9", 6, 9, "Olas altas; densas estrías; rociones."],
  [8, "Mar montañosa", "9 – 14", 9, 14, "Olas muy altas; mar blanca."],
  [9, "Mar enorme", "> 14", 14, 18, "Olas excepcionales; aire lleno de espuma."],
].map(([d, n, hs, h0, h1, asp]) => ({ d, n, hs, h0, h1, asp }));
const douglasOf = h => h <= 0.001 ? 0 : h <= .1 ? 1 : h <= .5 ? 2 : h <= 1.25 ? 3 : h <= 2.5 ? 4 : h <= 4 ? 5 : h <= 6 ? 6 : h <= 9 ? 7 : h <= 14 ? 8 : 9;

const AVISO = f => f >= 10 ? { t: "Aviso rojo", bg: "#d7261e", fg: "#fff", txt: "Fuerza 10 o más: riesgo extraordinario. No salir." }
  : f >= 8 ? { t: "Aviso naranja", bg: "#f07c1a", fg: "#1a0d00", txt: "Fuerza 8–9 (temporal): riesgo importante." }
  : f === 7 ? { t: "Aviso amarillo", bg: "#f2c200", fg: "#1a1400", txt: "Fuerza 7 (frescachón): riesgo para la navegación de recreo." }
  : { t: "Sin aviso", bg: "transparent", fg: "inherit", txt: "Por debajo de F7 AEMET no emite aviso costero por viento (no significa que sea seguro para tu barco)." };

const fmt = (n, d = 0) => n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const G = 9.81;

// Estimación del oleaje (JONSWAP simplificado): limitada por fetch, por duración o mar totalmente desarrollada.
function seaState(F, fetchNm, hours) {
  const U = Math.max(.5, KN_MID[F] * .5144), Fm = fetchNm * 1852, t = hours * 3600;
  const Hf = x => .0016 * U * Math.sqrt(x / G);
  const Hfd = .2433 * U * U / G;
  const Feff = (U * U / G) * Math.pow(G * t / (68.8 * U), 1.5);
  const h1 = Hf(Fm), h2 = Hf(Feff);
  let hs = Math.min(h1, h2, Hfd), lim = hs === Hfd ? "mar totalmente desarrollada" : h1 <= h2 ? "el fetch" : "la persistencia (horas)";
  if (F === 0) { hs = 0; lim = "no hay viento"; }
  return { hs, lim, hfd: Hfd };
}

export default {
  id: ID,
  tema: 9,
  title: "Escalas Beaufort y Douglas",
  icon: "≋",
  desc: "Mira el mar a cada fuerza, aprende Beaufort y Douglas, el fetch, la mar de fondo y los avisos.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = CSS; document.head.appendChild(s);
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tab = "escalas", by = "b", F = 4, D = 3;
    let scene = { F: 4, hs: 1, swell: 0 };
    let lab = { F: 6, fetch: 100, hrs: 12, fondo: false };
    let game = null, best = ctx.store.get("best", 0);
    let W = 600, H = 340, dpr = 1, pal = {}, raf = 0, visible = true, t = 0, last = 0;
    const spray = [];
    const rowPh = Array.from({ length: 16 }, () => Math.random() * Math.PI * 2);
    const rowPh2 = Array.from({ length: 16 }, () => Math.random() * Math.PI * 2);

    el.innerHTML = `
<div class="m-${ID} stack">
  <div class="es-top">
    <div><p class="eyebrow">Tema 9 · Viento y estado de la mar</p><h3>Escalas Beaufort y Douglas</h3></div>
    <div class="seg" role="group" aria-label="Sección">
      <button data-tab="escalas" aria-pressed="true">Escalas</button>
      <button data-tab="fetch" aria-pressed="false">Fetch y mar de fondo</button>
      <button data-tab="juego" aria-pressed="false">Juego</button>
    </div>
  </div>
  <div class="stage" data-stage><canvas role="img" aria-label="Escena animada del estado de la mar"></canvas><div class="es-hud" data-hud></div></div>
  <div data-body class="stack"></div>
</div>`;
    const root = el.firstElementChild, $ = s => root.querySelector(s);
    const stageEl = $("[data-stage]"), cv = stageEl.querySelector("canvas"), g = cv.getContext("2d"), body = $("[data-body]"), hud = $("[data-hud]");

    // ---------- colores ----------
    const pc = document.createElement("canvas").getContext("2d");
    function rgb(c) { pc.fillStyle = "#000"; pc.fillStyle = c; const s = pc.fillStyle; if (s[0] === "#") return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0]; }
    const lerp = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
    const css = (a, al = 1) => `rgba(${a[0]},${a[1]},${a[2]},${al})`;
    function readPal() {
      const dark = ctx.theme() === "dark";
      const dim = c => dark ? lerp(rgb(c), [7, 16, 25], .38) : rgb(c);
      pal = { dark, skyC: dim("#9fcbe6"), skyC2: dim("#e3f1f8"), skyS: dim("#56616b"), skyS2: dim("#8d979f"),
        seaC: dim("#2c7aa3"), seaC2: dim("#1b5677"), seaS: dim("#3d5560"), seaS2: dim("#25363e"), foam: dark ? [214, 226, 232] : [250, 252, 253],
        mono: tok("--f-mono") || "monospace" };
    }

    // ---------- escena del mar ----------
    const NROW = 15;
    const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    const foamP = f => [0, 0, 0, .1, .3, .5, .7, .85, .95, 1, 1, 1, 1][f];
    function drawSea(dt) {
      const { F: f, hs, swell } = scene;
      const storm = clamp((f - 4) / 7, 0, 1);
      const hz = H * .3;
      // cielo
      const sg = g.createLinearGradient(0, 0, 0, hz);
      sg.addColorStop(0, css(lerp(pal.skyC, pal.skyS, storm))); sg.addColorStop(1, css(lerp(pal.skyC2, pal.skyS2, storm)));
      g.fillStyle = sg; g.fillRect(0, 0, W, hz + 2);
      if (storm > .2) { // nubes bajas
        g.fillStyle = css(lerp(pal.skyS2, pal.skyS, .5), .5 * storm);
        for (let i = 0; i < 6; i++) { const x = ((i * 173 + t * .004 * (2 + f)) % (W + 200)) - 100; g.beginPath(); g.ellipse(x, hz * (.25 + (i % 3) * .2), 90, 18, 0, 0, 7); g.fill(); }
      }
      // fondo del mar
      const seaTop = lerp(pal.seaC, pal.seaS, storm), seaBot = lerp(pal.seaC2, pal.seaS2, storm);
      const bg = g.createLinearGradient(0, hz, 0, H); bg.addColorStop(0, css(lerp(seaTop, pal.skyC2, .35))); bg.addColorStop(1, css(seaBot));
      g.fillStyle = bg; g.fillRect(0, hz, W, H - hz);
      if (f === 0 && !swell) { // espejo
        g.strokeStyle = css(pal.skyC2, .35); g.lineWidth = 1;
        for (let i = 0; i < 12; i++) { const y = hz + (H - hz) * Math.pow((i + 1) / 12, 1.6); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + Math.sin(t * .0007 + i) * .6); g.stroke(); }
      }
      const tt = t / 1000, ppm0 = W * .028;
      const windHs = swell ? Math.min(hs, BEAU[f].h) * (swell ? .35 : 1) : hs;
      const lamW = 3 + 10 * Math.pow(Math.max(windHs, .02), .8);
      const lamS = 110;
      const Q = clamp(.15 + f * .065, 0, .85);
      let boatY = 0, boatX = W * .64, boatPpm = 0, boatSlope = 0;
      const crests = [];
      for (let r = 0; r < NROW; r++) {
        const z = (r + 1) / NROW, y0 = hz + (H - hz) * Math.pow(z, 1.35) + 4, ppm = ppm0 * Math.pow(z, 1.6);
        const comps = [];
        if (swell) comps.push({ A: swell / 2 * ppm, k: 2 * Math.PI / (lamS * ppm), c: 1.25 * Math.sqrt(lamS) * ppm * .5, ph: r * .35, Q: .08 });
        if (windHs > 0) {
          comps.push({ A: windHs / 2 * ppm * (swell ? 1 : .8), k: 2 * Math.PI / (lamW * ppm), c: 1.25 * Math.sqrt(lamW) * ppm, ph: rowPh[r], Q });
          if (!swell) comps.push({ A: windHs / 2 * ppm * .3, k: 2 * Math.PI / (lamW * .57 * ppm), c: 1.25 * Math.sqrt(lamW * .57) * ppm, ph: rowPh2[r], Q: Q * .6 });
        }
        if (!comps.length) continue;
        const Y = x => { let y = y0; for (const c of comps) y -= c.A * Math.cos(c.k * x - c.k * c.c * tt + c.ph); return y; };
        const step = Math.max(3, W / 160);
        g.beginPath(); g.moveTo(-10, H + 5);
        for (let u = -40; u <= W + 40; u += step) {
          let x = u, y = y0;
          for (const c of comps) { const th = c.k * u - c.k * c.c * tt + c.ph; x -= c.Q * Math.sin(th) / c.k * .9; y -= c.A * Math.cos(th); }
          g.lineTo(x, y);
        }
        g.lineTo(W + 10, H + 5); g.closePath();
        const col = lerp(seaTop, seaBot, Math.pow(z, .8));
        const fg = g.createLinearGradient(0, y0 - (comps[0].A + (comps[1]?.A || 0)), 0, y0 + 30);
        fg.addColorStop(0, css(lerp(col, pal.skyC2, .22))); fg.addColorStop(1, css(col));
        g.fillStyle = fg; g.fill();
        g.strokeStyle = css(lerp(col, pal.skyC2, .45), .55); g.lineWidth = Math.max(.6, z * 1.4); g.stroke();
        // crestas del mar de viento: borreguillos
        const wc = comps.find(c => c.Q === Q && windHs > 0);
        if (wc && f >= 3) {
          const lam = 2 * Math.PI / wc.k, off = wc.c * tt - wc.ph / wc.k;
          for (let n = Math.floor((-40 - off) / lam); n * lam + off < W + 40; n++) {
            const xu = n * lam + off + lam * 0.0; // cresta: th = 2πn
            if (hash(n, r) > foamP(f)) continue;
            const xc = xu, yc = Y(xu);
            const life = .55 + .45 * Math.sin(tt * 1.3 + n * 1.7 + r);
            const w = lam * (.12 + .1 * storm) * life, hh = Math.max(1, wc.A * .35);
            g.fillStyle = css(pal.foam, .88 * life);
            g.beginPath(); g.ellipse(xc + w * .2, yc + hh * .2, w, hh * .6, 0, 0, 7); g.fill();
            if (f >= 6) { g.fillStyle = css(pal.foam, .45 * life); g.beginPath(); g.ellipse(xc + w * .9, yc + hh * 1.2, w * 1.1, hh * .7, .25, 0, 7); g.fill(); }
            if (z > .45) crests.push([xc, yc, z]);
          }
        }
        // estrías de espuma (F7+)
        if (f >= 7 && !swell) {
          const nS = Math.round((f - 6) * 3 * z);
          g.strokeStyle = css(pal.foam, .22 + .05 * (f - 7)); g.lineWidth = Math.max(.6, z * 1.6);
          for (let i = 0; i < nS; i++) {
            const sx0 = ((hash(i, r) * W * 1.4 + tt * 40 * z * (1 + f * .1)) % (W + 120)) - 60, len = (20 + hash(r, i) * 60) * z * 1.6;
            const sy0 = Y(sx0) + 4 + hash(i + 3, r) * 10 * z;
            g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(sx0 + len, sy0 + len * .03); g.stroke();
          }
        }
        if (r === Math.round(NROW * .55)) { boatPpm = ppm; boatY = Y(boatX); boatSlope = (Y(boatX + 6) - Y(boatX - 6)) / 12; drawBoat(boatX, boatY, boatPpm, boatSlope); }
      }
      // rociones
      if (f >= 5 && !reduce) {
        const rate = (f - 4) * (f >= 9 ? 9 : 4);
        for (const [x, y, z] of crests) if (Math.random() < rate * dt / 1000 / Math.max(1, crests.length) * 6) spray.push({ x, y, vx: (30 + f * 12) * z * (1 + Math.random()), vy: -(30 + f * 6) * z * Math.random(), life: 1, s: 1 + z * 2 });
      }
      g.fillStyle = css(pal.foam, .8);
      for (let i = spray.length - 1; i >= 0; i--) {
        const p = spray[i]; p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; p.vy += 120 * dt / 1000; p.life -= dt / 1000 * .9;
        if (p.life <= 0 || p.x > W + 10) { spray.splice(i, 1); continue; }
        g.globalAlpha = clamp(p.life, 0, 1) * .8; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
      if (spray.length > 600) spray.splice(0, spray.length - 600);
      // mar blanca y visibilidad reducida
      if (f >= 9 && !swell) {
        g.fillStyle = css(pal.foam, (f - 8) * .07); g.fillRect(0, hz, W, H - hz);
        const vg = g.createLinearGradient(0, 0, 0, H); const a = (f - 8) * .14;
        vg.addColorStop(0, css(pal.skyS2, a)); vg.addColorStop(.45, css(pal.skyS2, a * .9)); vg.addColorStop(1, css(pal.skyS2, a * .25));
        g.fillStyle = vg; g.fillRect(0, 0, W, H);
      }
      if (f >= 12 && !swell) { for (let i = 0; i < 120; i++) { g.fillStyle = css(pal.foam, .35); g.fillRect((hash(i, 1) * W + tt * 400) % W, hash(i, 2) * H, 6, 1.2); } }
    }
    function drawBoat(x, y, ppm, slope) {
      const L = 12 * ppm, ang = Math.atan(slope) * .8;
      g.save(); g.translate(x, y); g.rotate(ang);
      g.fillStyle = pal.dark ? "#d5dbe0" : "#f4f4f2"; g.strokeStyle = "#20313d"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(-L / 2, -L * .07); g.lineTo(L / 2, -L * .09); g.lineTo(L * .38, L * .05); g.lineTo(-L * .42, L * .04); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = "#20313d"; g.lineWidth = Math.max(1, L * .012);
      g.beginPath(); g.moveTo(-L * .05, -L * .08); g.lineTo(-L * .05, -L * 1.25); g.stroke();
      g.restore();
    }

    // ---------- HUD ----------
    function setHud() {
      if (tab === "juego" && game && !game.done) { hud.innerHTML = `<span class="chip">¿Qué fuerza?</span>`; return; }
      const b = BEAU[scene.F], d = douglasOf(scene.hs + scene.swell * 0);
      hud.innerHTML = scene.swell
        ? `<span class="chip">Mar de fondo ≈ ${fmt(scene.swell, 1)} m</span><span class="chip">Viento local F${scene.F}</span>`
        : `<span class="chip">F${b.f} · ${b.n}</span><span class="chip">Douglas ${d} · ${DOUG[d].n}</span>`;
    }

    // ---------- secciones ----------
    function renderTabs() { root.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tab === tab))); }
    function render() {
      renderTabs();
      if (tab === "escalas") renderEscalas();
      else if (tab === "fetch") renderFetch();
      else renderGame();
      setHud();
    }
    function cardsHTML() {
      const b = BEAU[F], d = DOUG[D], av = AVISO(F);
      return `
        <div class="panel stack">
          <p class="eyebrow">Beaufort · viento</p>
          <div class="row"><span class="es-big">F${b.f}</span><span class="es-name">${b.n}</span></div>
          <p class="mono small">${b.kn} nudos · ${b.kmh} km/h</p>
          <p class="small">${b.mar}</p>
        </div>
        <div class="panel stack">
          <p class="eyebrow">Douglas · estado de la mar</p>
          <div class="row"><span class="es-big">${d.d}</span><span class="es-name">${d.n}</span></div>
          <p class="mono small">altura ${d.hs} m</p>
          <p class="small">${d.asp}</p>
        </div>
        <div class="panel stack">
          <p class="eyebrow">Aviso costero AEMET</p>
          <p><span class="es-aviso" style="background:${av.bg};color:${av.fg}">${av.t}</span></p>
          <p class="small">${av.txt}</p>
          <p class="small muted">Amarillo F7 · naranja F8–9 · rojo ≥ F10.</p>
        </div>`;
    }
    function renderEscalas() {
      const isB = by === "b";
      body.innerHTML = `
        <div class="panel stack">
          <div class="row" style="justify-content:space-between">
            <div class="seg" role="group" aria-label="Escala del deslizador"><button data-by="b" aria-pressed="${isB}">Beaufort 0–12</button><button data-by="d" aria-pressed="${!isB}">Douglas 0–9</button></div>
            <span class="muted small">Equivalencia con fetch y persistencia medios</span>
          </div>
          <label class="es-sl"><span><b>${isB ? "Fuerza Beaufort" : "Grado Douglas"}</b><b class="mono" data-sv>${isB ? F : D}</b></span>
            <input type="range" data-slide min="0" max="${isB ? 12 : 9}" step="1" value="${isB ? F : D}" aria-label="${isB ? "Fuerza Beaufort" : "Grado Douglas"}"></label>
        </div>
        <div class="es-cards" data-cards>${cardsHTML()}</div>
        <div class="es-tables">
          <div class="panel stack"><h4>Escala Beaufort (viento, 0–12)</h4>
            <div class="scroll-x"><table data-tb><thead><tr><th class="num">F</th><th>Denominación</th><th class="num">Nudos</th><th class="num">km/h</th><th>Aspecto de la mar</th></tr></thead>
            <tbody>${BEAU.map(b => `<tr data-f="${b.f}" class="${b.f === F ? "is-cur" : ""}"><td class="num mono">${b.f}</td><td>${b.n}</td><td class="num mono">${b.kn}</td><td class="num mono">${b.kmh}</td><td class="small es-asp">${b.mar}</td></tr>`).join("")}</tbody></table></div>
            <p class="small muted">Medida empírica de la intensidad del viento en el medio marino, de 0 a 12, creciente (almirante F. Beaufort, 1806). Se lleva a bordo porque los partes dan el viento en fuerza Beaufort.</p>
          </div>
          <div class="panel stack"><h4>Escala Douglas (mar, 0–9)</h4>
            <div class="scroll-x"><table data-td><thead><tr><th class="num">Grado</th><th>Denominación</th><th class="num">Altura (m)</th><th class="num">≈ F</th></tr></thead>
            <tbody>${DOUG.map(d => `<tr data-d="${d.d}" class="${d.d === D ? "is-cur" : ""}"><td class="num mono">${d.d}</td><td>${d.n}</td><td class="num mono">${d.hs}</td><td class="num mono">${BEAU.filter(b => b.d === d.d).map(b => b.f).join("–") || "—"}</td></tr>`).join("")}</tbody></table></div>
            <p class="small muted">Grados del estado de la mar con su aspecto y la altura de ola: <b>a mayor grado, mayor altura</b>. Tiene equivalencia con Beaufort, pero <b>no</b> da la velocidad del viento ni clasifica borrascas.</p>
          </div>
        </div>
        <div class="grid">
          <div class="tint stack small">
            <h4>Fuentes de información meteorológica (2026)</h4>
            <ul>
              <li><b>AEMET</b>: predicción marítima costera y de alta mar, y avisos (web y app). Su servicio para navegantes es <b>MeteoNav</b>.</li>
              <li><b>Salvamento Marítimo</b>: boletines por <b>VHF</b> a horas fijas, <b>anunciados previamente en el canal 16</b> y emitidos en un canal de trabajo.</li>
              <li><b>Estaciones radiocosteras</b>: VHF y onda media.</li>
              <li><b>NAVTEX</b>: impresos o en pantalla, 518 kHz internacional en <b>inglés</b> y 490 kHz nacional en <b>español</b> (p. ej. Tarifa). Cuatro centros emisores en España.</li>
              <li>Radio y televisión (RTVE) también son fuente válida.</li>
            </ul>
          </div>
          <div class="tint stack small">
            <h4>Trampas del examen</h4>
            <ul>
              <li>«Agencia Mundial de Meteorología (AMMET)»: no existe.</li>
              <li>Capitanía Marítima o Distrito Marítimo <b>no</b> emiten boletines meteorológicos.</li>
              <li>No se pide la previsión por el canal 69 a la Autoridad Portuaria ni por teléfono a ella.</li>
              <li>El <b>canal 70</b> es solo para llamadas selectivas digitales (LSD), no para boletines.</li>
              <li>«METEOYACHT del Servicio Hidrográfico»: no es la fuente oficial; lo es MeteoNav de AEMET.</li>
            </ul>
          </div>
        </div>`;
    }
    function syncFromSlider(v) {
      if (by === "b") { F = v; D = BEAU[F].d; scene = { F, hs: BEAU[F].h, swell: 0 }; }
      else { D = v; const fs = BEAU.filter(b => b.d === D); F = fs.length ? fs[0].f : BEAU.reduce((a, b) => Math.abs(b.d - D) < Math.abs(a.d - D) ? b : a).f; scene = { F, hs: D === 9 ? 15 : (DOUG[D].h0 + DOUG[D].h1) / 2, swell: 0 }; }
      body.querySelector("[data-sv]").textContent = v;
      body.querySelector("[data-cards]").innerHTML = cardsHTML();
      body.querySelectorAll("[data-tb] tr[data-f]").forEach(tr => tr.classList.toggle("is-cur", +tr.dataset.f === F));
      body.querySelectorAll("[data-td] tr[data-d]").forEach(tr => tr.classList.toggle("is-cur", +tr.dataset.d === D));
      setHud(); paintOnce();
    }

    function renderFetch() {
      const st = seaState(lab.F, lab.fetch, lab.hrs), d = douglasOf(st.hs);
      body.innerHTML = `
        <div class="grid">
          <div class="panel stack">
            <h4>Lo que hace crecer la mar</h4>
            <label class="es-sl"><span>Intensidad del viento<b class="mono">F${lab.F} · ${BEAU[lab.F].kn} kn</b></span><input type="range" data-lab="F" min="0" max="12" value="${lab.F}" aria-label="Intensidad en fuerza Beaufort"></label>
            <label class="es-sl"><span>Fetch (millas)<b class="mono">${fmt(lab.fetch)} mn</b></span><input type="range" data-lab="fetch" min="0" max="100" value="${Math.round(Math.log(lab.fetch / 5) / Math.log(120) * 100)}" aria-label="Fetch en millas"></label>
            <label class="es-sl"><span>Persistencia (horas)<b class="mono">${lab.hrs} h</b></span><input type="range" data-lab="hrs" min="1" max="48" value="${lab.hrs}" aria-label="Persistencia en horas"></label>
            <div class="tint stack" data-out>
              <p>Altura significativa estimada: <b class="mono">${fmt(st.hs, 1)} m</b> → <b>Douglas ${d} · ${DOUG[d].n}</b></p>
              <p class="small muted">Limita ${st.lim}. Con este viento y fetch y tiempo ilimitados: ${fmt(st.hfd, 1)} m.</p>
            </div>
            <div class="row"><button class="btn ${lab.fondo ? "" : "primary"}" data-seawind>Mar de viento</button><button class="btn ${lab.fondo ? "primary" : ""}" data-seafondo>Cesa el viento: mar de fondo</button></div>
          </div>
          <div class="tint stack small">
            <h4>Tres parámetros: intensidad, persistencia y fetch</h4>
            <ul>
              <li><b>Intensidad</b>: velocidad con la que sopla el viento (nudos, m/s, fuerza Beaufort).</li>
              <li><b>Persistencia</b>: número de <b>horas</b> que el viento sopla o ha soplado en la misma dirección (y fuerza).</li>
              <li><b>Fetch</b>: extensión o alcance de mar sobre la que el viento sopla con dirección y fuerza constantes. Se expresa en <b>millas</b>. A mayor fetch, mayor oleaje.</li>
            </ul>
            <p>Con viento de tierra (poco fetch) la mar es menor que la de la tabla, aunque sople fuerte: por eso navegar a sotavento de la costa es más cómodo.</p>
            <h4>Mar de viento y mar de fondo</h4>
            <ul>
              <li><b>Mar de viento</b>: la levanta el viento que sopla aquí y ahora; olas cortas, irregulares, que rompen (borreguillos).</li>
              <li><b>Mar de fondo (mar tendida)</b>: olas que llegan de una borrasca lejana o que quedan cuando el viento ha cesado: largas, regulares, de periodo largo, sin espuma. Pueden llegar con calma o venir de otra dirección (mar cruzada) y anuncian a veces un temporal.</li>
            </ul>
          </div>
        </div>`;
    }
    function updLab() {
      const st = seaState(lab.F, lab.fetch, lab.hrs), d = douglasOf(st.hs);
      const out = body.querySelector("[data-out]");
      if (out) out.innerHTML = `<p>Altura significativa estimada: <b class="mono">${fmt(st.hs, 1)} m</b> → <b>Douglas ${d} · ${DOUG[d].n}</b></p><p class="small muted">Limita ${st.lim}. Con este viento y fetch y tiempo ilimitados: ${fmt(st.hfd, 1)} m.</p>`;
      body.querySelectorAll("[data-lab]").forEach(i => { const s = i.closest("label").querySelector("b.mono"); if (i.dataset.lab === "F") s.textContent = `F${lab.F} · ${BEAU[lab.F].kn} kn`; if (i.dataset.lab === "fetch") s.textContent = `${fmt(lab.fetch)} mn`; if (i.dataset.lab === "hrs") s.textContent = `${lab.hrs} h`; });
      scene = lab.fondo ? { F: Math.min(1, lab.F), hs: 0.05, swell: Math.max(.8, st.hs * .7) } : { F: lab.F, hs: st.hs, swell: 0 };
      setHud(); paintOnce();
    }

    // ---------- juego ----------
    function newRound() { game = { n: 0, score: 0, hits: 0, done: false }; nextItem(); }
    function nextItem() {
      game.n++; const f = Math.floor(Math.random() * 13);
      game.cur = { f, hs: BEAU[f].h * (.9 + Math.random() * .2), pb: null, pd: null, checked: false };
      scene = { F: f, hs: game.cur.hs, swell: 0 }; spray.length = 0;
    }
    function renderGame() {
      if (!game) newRound();
      const c = game.cur, ROUND = 5;
      if (game.done) {
        body.innerHTML = `<div class="panel stack"><h4>Ronda terminada</h4><p>Has acertado <b>${game.hits}</b> de ${ROUND} (Beaufort exacto o ±1 y Douglas correcto). Puntos: <b>${game.score}</b>. Mejor ronda: ${best}.</p><div><button class="btn primary" data-again>Otra ronda</button></div></div>`;
        return;
      }
      const b = BEAU[c.f], okB = c.pb === c.f, nearB = c.pb != null && Math.abs(c.pb - c.f) === 1, okD = c.pd != null && c.pd >= b.dg[0] && c.pd <= b.dg[1];
      body.innerHTML = `
        <div class="panel stack">
          <div class="row" style="justify-content:space-between"><h4>Mar ${game.n} de ${ROUND}</h4><span class="chip acc">${game.score} pts</span></div>
          <p class="small muted">Mira las crestas, los borreguillos, las estrías de espuma, los rociones y el velero de 12 m como referencia.</p>
          <p><b>Fuerza Beaufort</b></p>
          <div class="es-pick" role="group" aria-label="Fuerza Beaufort">${BEAU.map(x => `<button class="btn ${c.checked ? (x.f === c.f ? "is-ok" : x.f === c.pb ? "is-bad" : "") : ""}" data-pb="${x.f}" aria-pressed="${c.pb === x.f}" ${c.checked ? "disabled" : ""}>${x.f}</button>`).join("")}</div>
          <p><b>Grado Douglas</b></p>
          <div class="es-pick" role="group" aria-label="Grado Douglas">${DOUG.map(x => `<button class="btn ${c.checked ? (x.d >= b.dg[0] && x.d <= b.dg[1] ? "is-ok" : x.d === c.pd ? "is-bad" : "") : ""}" data-pd="${x.d}" aria-pressed="${c.pd === x.d}" ${c.checked ? "disabled" : ""}>${x.d}</button>`).join("")}</div>
          ${c.checked ? `
            <p><span class="${okB ? "fb-ok" : nearB ? "" : "fb-bad"}">${okB ? "Beaufort exacto." : nearB ? "Beaufort casi (±1)." : "Beaufort: no."}</span> <span class="${okD ? "fb-ok" : "fb-bad"}">${okD ? "Douglas correcto." : "Douglas: no."}</span></p>
            <p>Era <b>F${b.f} · ${b.n}</b> (${b.kn} kn): ${b.mar} Mar típica: <b>Douglas ${b.d} · ${DOUG[b.d].n}</b> (${DOUG[b.d].hs} m)${b.dg[1] !== b.dg[0] ? `; se acepta ${b.dg[0]}–${b.dg[1]}` : ""}.</p>
            <div><button class="btn primary" data-gnext>${game.n >= ROUND ? "Ver resultado" : "Siguiente mar"}</button></div>`
          : `<div><button class="btn primary" data-check ${c.pb == null || c.pd == null ? "disabled" : ""}>Comprobar</button></div>`}
        </div>`;
    }
    function check() {
      const c = game.cur, b = BEAU[c.f]; c.checked = true;
      const okB = c.pb === c.f, nearB = Math.abs(c.pb - c.f) === 1, okD = c.pd >= b.dg[0] && c.pd <= b.dg[1];
      let xp = (okB ? 15 : nearB ? 5 : 0) + (okD ? 10 : 0);
      game.score += xp; if ((okB || nearB) && okD) game.hits++;
      if (xp) ctx.award(xp, "Escalas Beaufort/Douglas");
      render();
    }

    // ---------- eventos ----------
    root.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.tab) {
        tab = b.dataset.tab;
        if (tab === "escalas") scene = { F, hs: BEAU[F].h, swell: 0 };
        if (tab === "fetch") { render(); updLab(); return; }
        if (tab === "juego") { if (!game || game.done) newRound(); else scene = { F: game.cur.f, hs: game.cur.hs, swell: 0 }; }
        render(); paintOnce(); return;
      }
      if (b.dataset.by) { by = b.dataset.by; renderEscalas(); return; }
      if (b.hasAttribute("data-seawind")) { lab.fondo = false; renderFetch(); updLab(); return; }
      if (b.hasAttribute("data-seafondo")) { lab.fondo = true; renderFetch(); updLab(); return; }
      if (b.dataset.pb != null && game) { game.cur.pb = +b.dataset.pb; renderGame(); return; }
      if (b.dataset.pd != null && game) { game.cur.pd = +b.dataset.pd; renderGame(); return; }
      if (b.hasAttribute("data-check")) { check(); return; }
      if (b.hasAttribute("data-gnext")) {
        if (game.n >= 5) { game.done = true; if (game.score > best) { best = game.score; ctx.store.set("best", best); } if (game.hits === 5) { ctx.award(30, "Ronda perfecta de estado de la mar"); ctx.toast("Ronda perfecta: lees el mar como un patrón"); } }
        else nextItem();
        render(); paintOnce(); return;
      }
      if (b.hasAttribute("data-again")) { newRound(); render(); paintOnce(); return; }
    });
    root.addEventListener("input", e => {
      const i = e.target;
      if (i.matches("[data-slide]")) { syncFromSlider(+i.value); return; }
      if (i.matches("[data-lab]")) {
        const k = i.dataset.lab;
        if (k === "F") lab.F = +i.value;
        if (k === "hrs") lab.hrs = +i.value;
        if (k === "fetch") lab.fetch = Math.round(5 * Math.pow(120, +i.value / 100));
        updLab();
      }
    });

    // ---------- bucle ----------
    function frame(now) { const dt = Math.min(50, now - (last || now)); last = now; if (!reduce) t += dt; drawSea(reduce ? 0 : dt); }
    function loop(now) { raf = 0; frame(now); if (visible && !reduce) raf = requestAnimationFrame(loop); }
    function kick() { if (!raf && visible && !reduce) { last = 0; raf = requestAnimationFrame(loop); } }
    function paintOnce() { if (reduce || !raf) frame(performance.now()); }
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } });
    io.observe(stageEl);
    function resize() {
      W = Math.max(280, stageEl.clientWidth || 600); H = Math.round(clamp(W * .56, 220, 420));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      stageEl.style.height = H + "px"; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0); paintOnce();
    }
    const ro = new ResizeObserver(resize); ro.observe(stageEl);
    const offTheme = ctx.onTheme ? ctx.onTheme(() => { readPal(); paintOnce(); }) : null;

    readPal(); render(); resize(); kick();

    return () => {
      if (raf) cancelAnimationFrame(raf); raf = 0; visible = false;
      io.disconnect(); ro.disconnect(); offTheme && offTheme();
      el.innerHTML = "";
    };
  }
};
