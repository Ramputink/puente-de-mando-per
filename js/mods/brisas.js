// Brisas costeras (Tema 9 · 9.6): sección vertical tierra/mar con reloj de 24 h.
// Virazón (día, del mar a tierra, máximo por la tarde) y terral (noche, de tierra a mar).
// Claves contrastadas con q_met.txt (2feb360829, da66c5f170, 4d0cef7718, 3d3b8611ad, 7b6c8ec588…).

const ID = "brisas";

const CSS = `
.m-brisas .br-top{display:flex;flex-wrap:wrap;gap:.6rem;align-items:flex-end;justify-content:space-between}
.m-brisas .br-main{display:grid;gap:1rem;grid-template-columns:minmax(0,1fr)}
@media (min-width:760px){.m-brisas .br-main{grid-template-columns:minmax(0,1fr) 220px}}
.m-brisas .br-dial{display:grid;justify-items:center;gap:.5rem;align-content:start}
.m-brisas .br-dial svg{width:200px;max-width:100%;height:auto;touch-action:none;cursor:grab;user-select:none}
.m-brisas .br-dial svg text{font:600 11px var(--f-mono);fill:var(--muted)}
.m-brisas .br-read dl{display:grid;grid-template-columns:auto 1fr;gap:.25rem .8rem;margin:0}
.m-brisas .br-read dt{font-weight:700;color:var(--muted);font-size:.85rem}
.m-brisas .br-read dd{margin:0}
.m-brisas .br-big{font:600 1.6rem/1 var(--f-display)}
.m-brisas .br-opts{display:grid;gap:.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))}
.m-brisas .br-opts .btn{justify-content:flex-start;text-align:left;height:auto}
.m-brisas .btn.is-ok{border-color:var(--ok);color:var(--ok)}
.m-brisas .btn.is-bad{border-color:var(--bad);color:var(--bad)}
.m-brisas .br-q{display:grid;gap:1rem;grid-template-columns:minmax(0,1fr)}
@media (min-width:560px){.m-brisas .br-q.has-fig{grid-template-columns:150px minmax(0,1fr)}}
.m-brisas .br-q svg{width:150px;height:auto;justify-self:center}
.m-brisas ul{margin:0;padding-left:1.1rem}
.m-brisas li{margin:.15rem 0}
`;

const BF = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64];
const bft = kn => BF.filter(t => kn >= t).length;
const fmt = (n, d = 0) => n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
const hhmm = h => { const t = ((h % 24) + 24) % 24, H = Math.floor(t), M = Math.round((t - H) * 60) % 60; return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`; };
const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SUNRISE = 7, SUNSET = 21; // verano peninsular, hora oficial aproximada

// Modelo térmico: la tierra se calienta y enfría mucho más que el mar.
function landF(h) {
  h = ((h % 24) + 24) % 24;
  if (h >= 6 && h <= 15) return -Math.cos(Math.PI * (h - 6) / 9);           // calentamiento 06→15 h
  const t = ((h - 15 + 24) % 24) / 15;                                         // enfriamiento 15→06 h (rápido al anochecer)
  return Math.cos(Math.PI * Math.sqrt(t));
}
function model(h) {
  const f = landF(h);
  const Tl = 21 + 9 * f, Ts = 20 + .6 * f, d = Tl - Ts;
  let type = "calma", kn = 0;
  if (d > 1.5) { type = "virazon"; kn = 1.35 * (d - 1.5); }
  else if (d < -1.5) { type = "terral"; kn = .85 * (-d - 1.5); }
  return { Tl, Ts, d, type, kn, Pl: 1013 - .11 * d, Ps: 1013 + .02 * d };
}
function daylight(h) { // 0 noche … 1 pleno día
  h = ((h % 24) + 24) % 24;
  const up = clamp((h - (SUNRISE - .7)) / 1.4, 0, 1), down = clamp(((SUNSET + .7) - h) / 1.4, 0, 1);
  return Math.min(up, down);
}

const QUIZ = [
  () => {
    const night = Math.random() < .5, coastPort = Math.random() < .5;
    const wind = night ? "terral" : "virazón";
    const ans = night ? (coastPort ? "Babor" : "Estribor") : (coastPort ? "Estribor" : "Babor");
    return { fig: { coastPort, night }, hour: night ? 3 : 15,
      text: `Navegación <b>${night ? "nocturna" : "diurna"}</b> dejando la costa por <b>${coastPort ? "babor" : "estribor"}</b>. Percibes un <b>${wind}</b>. ¿Por dónde te entra principalmente?`,
      opts: ["Babor", "Estribor", "Proa", "Popa"].map(t => ({ t, ok: t === ans })),
      expl: night
        ? `El terral sopla <b>de tierra a mar</b>: llega desde la costa, que está por ${coastPort ? "babor" : "estribor"} → entra por <b>${ans.toLowerCase()}</b>.`
        : `El virazón sopla <b>del mar a tierra</b>: viene del lado contrario a la costa (costa por ${coastPort ? "babor" : "estribor"}) → entra por <b>${ans.toLowerCase()}</b>.` };
  },
  () => {
    const day = Math.random() < .5, h = day ? 13 + Math.floor(Math.random() * 5) : 1 + Math.floor(Math.random() * 5);
    return { hour: null,
      text: `Costa sin viento general (situación anticiclónica, verano). Son las <b>${String(h).padStart(2, "0")}:00</b>. ¿Qué brisa esperas?`,
      opts: [{ t: "Virazón, del mar a tierra", ok: day }, { t: "Terral, de tierra a mar", ok: !day }, { t: "Virazón, de tierra a mar", ok: false }, { t: "Terral, del mar a tierra", ok: false }],
      expl: day ? "De día la tierra se calienta más deprisa que el mar: baja relativa sobre tierra y el aire entra desde el mar → <b>virazón</b>, máximo a primeras horas de la tarde."
        : "De noche la tierra se enfría más deprisa que el mar: alta relativa sobre tierra y el aire sale hacia el mar → <b>terral</b>." };
  },
  () => {
    const day = Math.random() < .5;
    return { hour: day ? 15 : 3,
      text: `${day ? "De día" : "De noche"}, en superficie, ¿dónde se forma la <b>baja presión relativa</b>?`,
      opts: [{ t: "Sobre tierra", ok: day }, { t: "Sobre el mar", ok: !day }, { t: "No hay diferencia de presión", ok: false }],
      expl: day ? "El suelo caliente calienta el aire, que se dilata y asciende: <b>baja relativa sobre tierra</b>, alta relativa sobre el mar. El viento va de la alta a la baja: del mar a tierra."
        : "La tierra irradia y se enfría: aire frío y denso encima (<b>alta relativa sobre tierra</b>). La baja relativa queda sobre el mar, más templado." };
  },
  () => ({ hour: 15,
    text: "¿Cuándo suele ser <b>más intenso</b> el virazón?",
    opts: [{ t: "A primeras horas de la tarde", ok: true }, { t: "Al amanecer", ok: false }, { t: "A medianoche", ok: false }, { t: "Justo al ponerse el sol", ok: false }],
    expl: "Es máximo cuando la diferencia de temperatura tierra–mar es mayor: hacia las 14–16 h. Al amanecer y al anochecer hay una <b>calma</b> de transición entre brisas." }),
  () => ({ hour: null,
    text: "El viento de las regiones costeras que sopla durante el día desde el mar hacia tierra, por el mayor calentamiento diurno del suelo, se denomina:",
    opts: shuffle([{ t: "Virazón", ok: true }, { t: "Terral", ok: false }, { t: "Viento aparente", ok: false }, { t: "Viento real", ok: false }]),
    expl: "Pregunta oficial: <b>virazón</b>. Truco: «<b>V</b>irazón = <b>V</b>iene del mar, de día»; «<b>T</b>erral = de <b>T</b>ierra, de noche»." }),
  () => ({ hour: 3,
    text: "El terral es un viento o brisa:",
    opts: shuffle([{ t: "Nocturna, de tierra a mar", ok: true }, { t: "Diurna, de tierra a mar", ok: false }, { t: "Diurna, de mar a tierra", ok: false }, { t: "Nocturna, de mar a tierra", ok: false }]),
    expl: "El terral es <b>nocturno</b> y sopla <b>de tierra a mar</b>, porque de noche la tierra se enfría más rápido que el mar. Suele ser más flojo que el virazón." }),
];

export default {
  id: ID,
  tema: 9,
  title: "Brisas costeras: virazón y terral",
  icon: "◑",
  desc: "Mueve el reloj de 24 h y mira cómo se invierte la brisa entre tierra y mar.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = CSS; document.head.appendChild(s);
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hour = 15, playing = false, visible = true, raf = 0, last = 0;
    let quiz = null, streak = 0, qn = 0;
    let W = 600, H = 330, dpr = 1, pal = {};
    const parts = Array.from({ length: 70 }, () => ({ th: Math.random() * Math.PI * 2, k: .62 + Math.random() * .38, s: .8 + Math.random() * .4 }));

    el.innerHTML = `
<div class="m-${ID} stack">
  <div class="br-top">
    <div><p class="eyebrow">Tema 9 · Brisas costeras</p><h3>Virazón y terral</h3></div>
    <div class="seg" role="group" aria-label="Modo"><button data-tab="ver" aria-pressed="true">Explorar</button><button data-tab="quiz" aria-pressed="false">Practicar</button></div>
  </div>
  <div class="br-main">
    <div class="stage" data-stage><canvas role="img" aria-label="Sección vertical de la costa con la circulación de la brisa"></canvas></div>
    <div class="br-dial">
      <svg viewBox="-110 -110 220 220" data-dial role="slider" aria-label="Hora del día" aria-valuemin="0" aria-valuemax="24" tabindex="0"></svg>
      <div class="row"><button class="btn sm" data-play>▶ Reproducir</button></div>
      <input type="range" min="0" max="23.75" step="0.25" value="15" data-hr aria-label="Hora">
    </div>
  </div>
  <div class="grid">
    <div class="panel br-read" data-read aria-live="polite"></div>
    <div class="tint stack small" data-side></div>
  </div>
</div>`;
    const root = el.firstElementChild, $ = s => root.querySelector(s);
    const stageEl = $("[data-stage]"), cv = stageEl.querySelector("canvas"), g = cv.getContext("2d");
    const dial = $("[data-dial]"), hr = $("[data-hr]"), read = $("[data-read]"), side = $("[data-side]"), playBtn = $("[data-play]");
    let tab = "ver";

    // ---------- colores ----------
    const pc = document.createElement("canvas").getContext("2d");
    function rgb(c) { pc.fillStyle = "#000"; pc.fillStyle = c; const s = pc.fillStyle; if (s[0] === "#") return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0]; }
    const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
    function readPal() {
      const dark = ctx.theme() === "dark";
      pal = {
        dark, ink: tok("--ink"), muted: tok("--muted"), paper: tok("--paper"), acc: tok("--accent"), port: tok("--port"), warn: tok("--warn"), sheet: tok("--sheet"),
        night: rgb(tok("--night") || "#071019"),
        skyDay: rgb(dark ? "#4f7f9c" : "#a9d6ee"), skyDusk: rgb(dark ? "#8a5a3c" : "#f0b27a"),
        landDay: rgb("#8c7b52"), landNight: rgb("#2b2a22"), seaDay: rgb(dark ? "#1f5d7a" : "#2f7ea6"), seaNight: rgb("#0c2233"),
        hi: dark ? "#6ea2ff" : "#1f5fd1", mono: tok("--f-mono") || "monospace", disp: tok("--f-display") || "sans-serif",
      };
    }

    // ---------- escena ----------
    function geom() {
      const xc = W * .46, yG = H * .74, ySea = H * .77, top = H * .16;
      return { xc, yG, ySea, top, cx: xc, cy: (top + yG - 10) / 2, rx: W * .36, ry: (yG - 10 - top) / 2 };
    }
    function landY(x, G) { return G.yG - (x < G.xc * .45 ? Math.sin(x / (G.xc * .45) * Math.PI) * H * .09 : 0) - Math.max(0, (G.xc - x) / G.xc) * H * .02; }
    function draw(t) {
      const m = model(hour), day = daylight(hour), G = geom();
      const dusk = Math.max(0, 1 - Math.abs(day - .5) * 2) * (day > 0 && day < 1 ? 1 : 0);
      // cielo
      const skyTop = mix(pal.night, pal.skyDay, day), skyBot = mix(rgb(skyTop), pal.skyDusk, dusk * .6);
      const gr = g.createLinearGradient(0, 0, 0, G.ySea); gr.addColorStop(0, skyTop); gr.addColorStop(1, skyBot);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const lightInk = day < .45;
      const fg = lightInk ? "rgba(235,242,250," : "rgba(15,34,48,";
      // estrellas
      if (day < .6) { g.fillStyle = `rgba(255,255,255,${.7 * (1 - day / .6)})`; for (let i = 0; i < 40; i++) { const x = (i * 97.3 % 1) * W, y = (i * 41.7 % 1) * G.yG * .6; g.fillRect((x + i * 37) % W, y, 1.3, 1.3); } }
      // sol / luna
      const hh = ((hour % 24) + 24) % 24;
      if (hh >= SUNRISE - .5 && hh <= SUNSET + .5) {
        const u = (hh - SUNRISE + .5) / (SUNSET - SUNRISE + 1), sxp = W * (.08 + .84 * u), syp = G.ySea - Math.sin(u * Math.PI) * (G.ySea - H * .08);
        g.fillStyle = "#ffd24a"; g.beginPath(); g.arc(sxp, syp, Math.max(9, W * .022), 0, 7); g.fill();
      } else {
        const hn = (hh - SUNSET - .5 + 24) % 24, u = hn / (24 - (SUNSET - SUNRISE) - 1);
        const mxp = W * (.08 + .84 * clamp(u, 0, 1)), myp = G.ySea - Math.sin(clamp(u, 0, 1) * Math.PI) * (G.ySea - H * .1);
        g.fillStyle = "#e8eef5"; g.beginPath(); g.arc(mxp, myp, Math.max(7, W * .017), 0, 7); g.fill();
        g.fillStyle = skyTop; g.beginPath(); g.arc(mxp + 5, myp - 3, Math.max(7, W * .017), 0, 7); g.fill();
      }
      // nubes de evolución (cúmulos) sobre tierra con virazón fuerte
      if (m.type === "virazon" && m.d > 4) {
        const a = clamp((m.d - 4) / 4, 0, 1) * .85;
        g.fillStyle = `rgba(255,255,255,${a})`;
        const cxp = G.xc - G.rx * .95, cyp = G.top + 6;
        for (const [dx, dy, r] of [[0, 0, 16], [16, -8, 18], [34, 0, 15], [18, 6, 15], [-14, 4, 11]]) { g.beginPath(); g.arc(cxp + dx * W / 600, cyp + dy, r * W / 600 + 4, 0, 7); g.fill(); }
      }
      // mar
      const seaC = mix(pal.seaNight, pal.seaDay, day);
      g.fillStyle = seaC; g.beginPath(); g.moveTo(G.xc - 6, H);
      const amp = 1 + m.kn * .18;
      for (let x = G.xc - 6; x <= W; x += 6) g.lineTo(x, G.ySea + Math.sin(x * .07 - t * .003 * (m.type === "terral" ? -1 : 1)) * amp);
      g.lineTo(W, H); g.closePath(); g.fill();
      // tierra
      g.fillStyle = mix(pal.landNight, pal.landDay, day); g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= G.xc; x += 4) g.lineTo(x, landY(x, G));
      g.lineTo(G.xc + 14, G.ySea + 2); g.lineTo(G.xc + 24, H); g.closePath(); g.fill();
      // casas
      for (let i = 0; i < 4; i++) {
        const x = G.xc * (.55 + i * .09), y = landY(x, G), w = W * .03, h = W * .028;
        g.fillStyle = day > .4 ? "#e9e4d6" : "#3a3a33"; g.fillRect(x, y - h, w, h);
        if (day < .4) { g.fillStyle = "#ffd24a"; g.fillRect(x + w * .35, y - h * .6, w * .3, h * .3); }
      }
      // termómetros
      g.font = `600 ${W < 450 ? 11 : 13}px ${pal.mono}`; g.textAlign = "center"; g.textBaseline = "middle";
      const tag = (txt, x, y) => { const w = g.measureText(txt).width + 10; g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(x - w / 2, y - 10, w, 20); g.fillStyle = "#fff"; g.fillText(txt, x, y + .5); };
      tag(`Tierra ${fmt(m.Tl)} °C`, G.xc * .5, G.yG + (H - G.yG) * .5);
      tag(`Mar ${fmt(m.Ts)} °C`, G.xc + (W - G.xc) * .55, G.ySea + (H - G.ySea) * .5);
      // presiones relativas
      const lblP = (txt, x, y, col) => { g.font = `700 ${W < 450 ? 15 : 19}px ${pal.disp}`; g.fillStyle = col; g.fillText(txt, x, y); };
      if (m.type !== "calma") {
        const landLow = m.type === "virazon";
        const yS = G.ySea - H * .2, yA = G.top - H * .06 + 4;
        const lowC = lightInk ? "#ff8a8a" : "#c0392b", hiC = lightInk ? "#8fb8ff" : "#1f5fd1";
        lblP(landLow ? "B rel." : "A rel.", G.xc * .55, yS, landLow ? lowC : hiC);
        lblP(landLow ? "A rel." : "B rel.", G.xc + (W - G.xc) * .5, yS, landLow ? hiC : lowC);
        g.globalAlpha = .6;
        lblP(landLow ? "A" : "B", G.xc * .55, yA + 14, landLow ? hiC : lowC);
        lblP(landLow ? "B" : "A", G.xc + (W - G.xc) * .5, yA + 14, landLow ? lowC : hiC);
        g.globalAlpha = 1;
      }
      // celda de circulación
      const dir = m.type === "virazon" ? 1 : m.type === "terral" ? -1 : 0;
      const sp = Math.min(1, m.kn / 12);
      if (dir) {
        g.strokeStyle = fg + ".22)"; g.lineWidth = 1; g.setLineDash([4, 5]);
        g.beginPath(); g.ellipse(G.cx, G.cy, G.rx, G.ry, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
        // flechas de la celda
        for (const th0 of [Math.PI / 2, Math.PI, 3 * Math.PI / 2, 0]) {
          const th = th0, x = G.cx + G.rx * Math.cos(th), y = G.cy + G.ry * Math.sin(th);
          const tx = -G.rx * Math.sin(th) * dir, ty = G.ry * Math.cos(th) * dir, L = Math.hypot(tx, ty), ux = tx / L, uy = ty / L, s = 9;
          g.fillStyle = fg + ".75)"; g.beginPath(); g.moveTo(x + ux * s, y + uy * s); g.lineTo(x - ux * s * .6 - uy * s * .6, y - uy * s * .6 + ux * s * .6); g.lineTo(x - ux * s * .6 + uy * s * .6, y - uy * s * .6 - ux * s * .6); g.closePath(); g.fill();
        }
        // partículas
        g.lineCap = "round";
        for (const p of parts) {
          const rx = G.rx * p.k, ry = G.ry * p.k;
          const x = G.cx + rx * Math.cos(p.th), y = G.cy + ry * Math.sin(p.th);
          const th2 = p.th - dir * .09, x2 = G.cx + rx * Math.cos(th2), y2 = G.cy + ry * Math.sin(th2);
          g.strokeStyle = fg + (.25 + .5 * sp) + ")"; g.lineWidth = 2;
          g.beginPath(); g.moveTo(x2, y2); g.lineTo(x, y); g.stroke();
        }
        // flecha de superficie: la brisa
        const yb = G.ySea - H * .1, x0 = dir > 0 ? W * .86 : W * .14, x1 = dir > 0 ? W * .56 : W * .82;
        const xa = dir > 0 ? x0 : G.xc * .3, xb = dir > 0 ? G.xc * .3 : x1;
        g.strokeStyle = pal.acc; g.fillStyle = pal.acc; g.lineWidth = 3 + 3 * sp;
        g.beginPath(); g.moveTo(xa, yb); g.lineTo(xb, yb); g.stroke();
        const hd = 10 + 6 * sp, sgn = Math.sign(xb - xa);
        g.beginPath(); g.moveTo(xb + sgn * hd, yb); g.lineTo(xb - sgn * 2, yb - hd * .7); g.lineTo(xb - sgn * 2, yb + hd * .7); g.closePath(); g.fill();
        g.font = `700 ${W < 450 ? 14 : 17}px ${pal.disp}`; g.textAlign = "center";
        const lab = (dir > 0 ? "VIRAZÓN" : "TERRAL") + ` · ${fmt(m.kn)} kn`;
        const lw = g.measureText(lab).width + 12, lx = (xa + xb) / 2;
        g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(lx - lw / 2, yb - 26, lw, 18); g.fillStyle = "#fff"; g.fillText(lab, lx, yb - 17);
      } else {
        g.font = `700 ${W < 450 ? 15 : 18}px ${pal.disp}`; g.textAlign = "center";
        g.fillStyle = fg + ".85)"; g.fillText("CALMA DE TRANSICIÓN", W / 2, G.top + H * .12);
      }
      // velero con grímpola
      const bx = G.xc + (W - G.xc) * .58, by = G.ySea + Math.sin(bx * .07 - t * .003) * amp;
      g.fillStyle = lightInk ? "#d8dee6" : "#1d2b36";
      g.beginPath(); g.moveTo(bx - 22, by - 2); g.lineTo(bx + 22, by - 2); g.lineTo(bx + 15, by + 6); g.lineTo(bx - 15, by + 6); g.closePath(); g.fill();
      g.strokeStyle = g.fillStyle; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, by - 2); g.lineTo(bx, by - 50); g.stroke();
      const fdir = dir > 0 ? -1 : dir < 0 ? 1 : 0, wv = Math.sin(t * .012) * 2;
      g.fillStyle = "#e23b3b"; g.beginPath(); g.moveTo(bx, by - 50); g.lineTo(bx + (fdir || .2) * 16, by - 47 + (fdir ? wv : 6)); g.lineTo(bx, by - 44); g.closePath(); g.fill();
      // reloj en la escena
      g.font = `600 ${W < 450 ? 12 : 14}px ${pal.mono}`; g.textAlign = "left"; g.textBaseline = "top";
      g.fillStyle = fg + ".9)"; g.fillText(hhmm(hour), 8, 8);
    }

    // ---------- reloj de 24 h ----------
    function buildDial() {
      const R = 92, a = h => (h - 12) / 24 * Math.PI * 2; // 12 h arriba
      const pt = (h, r) => [Math.sin(a(h)) * r, -Math.cos(a(h)) * r];
      const arc = (h0, h1, r) => { const [x0, y0] = pt(h0, r), [x1, y1] = pt(h1, r), large = ((h1 - h0 + 24) % 24) > 12 ? 1 : 0; return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
      let s = `<circle r="${R + 8}" fill="var(--sheet)" stroke="var(--line)"/>`;
      s += `<path d="${arc(SUNSET, SUNRISE, R)}" stroke="var(--ink)" stroke-width="10" fill="none" opacity=".75"/>`;
      s += `<path d="${arc(SUNRISE, SUNSET, R)}" stroke="var(--buoy-y)" stroke-width="10" fill="none" opacity=".8"/>`;
      for (let h = 0; h < 24; h++) { const [x0, y0] = pt(h, R - 9), [x1, y1] = pt(h, R - (h % 3 ? 13 : 17)); s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--muted)" stroke-width="${h % 3 ? 1 : 2}"/>`; }
      for (let h = 0; h < 24; h += 3) { const [x, y] = pt(h, R - 28); s += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${h}</text>`; }
      s += `<g data-hand><line x1="0" y1="0" x2="0" y2="${-(R - 4)}" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/><circle cy="${-(R - 4)}" r="9" fill="var(--accent)"/></g><circle r="5" fill="var(--accent)"/>`;
      s += `<text y="24" text-anchor="middle" data-dt style="font-size:15px;fill:var(--ink)"></text><text y="40" text-anchor="middle" data-dl></text>`;
      dial.innerHTML = s;
    }
    function updDial() {
      dial.querySelector("[data-hand]").setAttribute("transform", `rotate(${(hour - 12) * 15})`);
      dial.querySelector("[data-dt]").textContent = hhmm(hour);
      const m = model(hour);
      dial.querySelector("[data-dl]").textContent = m.type === "virazon" ? "virazón" : m.type === "terral" ? "terral" : "calma";
      dial.setAttribute("aria-valuenow", hour.toFixed(2)); dial.setAttribute("aria-valuetext", hhmm(hour));
      hr.value = hour;
    }
    function dialHour(e) {
      const r = dial.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      let ang = Math.atan2(x, -y) * 180 / Math.PI; // 0 arriba, horario
      return (((12 + ang / 15) % 24) + 24) % 24;
    }
    let dDrag = false;
    const dDown = e => { dDrag = true; dial.setPointerCapture(e.pointerId); setHour(Math.round(dialHour(e) * 4) / 4); stop(); };
    const dMove = e => { if (dDrag) setHour(Math.round(dialHour(e) * 4) / 4); };
    const dUp = () => { dDrag = false; };
    dial.addEventListener("pointerdown", dDown); dial.addEventListener("pointermove", dMove);
    dial.addEventListener("pointerup", dUp); dial.addEventListener("pointercancel", dUp);
    dial.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { setHour((hour + .5) % 24); e.preventDefault(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setHour((hour - .5 + 24) % 24); e.preventDefault(); }
    });

    // ---------- lectura ----------
    function renderRead() {
      const m = model(hour), f = bft(m.kn);
      const name = m.type === "virazon" ? "Virazón (brisa de mar)" : m.type === "terral" ? "Terral (brisa de tierra)" : "Calma de transición";
      const dirTxt = m.type === "virazon" ? "del mar hacia tierra" : m.type === "terral" ? "de tierra hacia el mar" : "sin brisa apreciable";
      read.innerHTML = `
        <p class="eyebrow">${hhmm(hour)} · ${daylight(hour) > .5 ? "día" : "noche"}</p>
        <p class="br-big">${name}</p>
        <dl>
          <dt>Viento</dt><dd>${dirTxt}${m.kn >= 1 ? `, ${fmt(m.kn)} kn (F${f})` : ""}</dd>
          <dt>Temperaturas</dt><dd>tierra ${fmt(m.Tl, 1)} °C · mar ${fmt(m.Ts, 1)} °C (Δ ${m.d > 0 ? "+" : ""}${fmt(m.d, 1)} °C)</dd>
          <dt>Presión relativa</dt><dd>tierra ${fmt(m.Pl, 1)} hPa · mar ${fmt(m.Ps, 1)} hPa → ${Math.abs(m.d) <= 1.5 ? "sin diferencia útil" : m.d > 0 ? "<b>baja sobre tierra</b>, alta sobre el mar" : "<b>alta sobre tierra</b>, baja sobre el mar"}</dd>
          <dt>Por qué</dt><dd>${m.type === "virazon" ? "La tierra se calienta antes que el mar: el aire sobre ella se dilata y asciende; el aire del mar entra a ocupar su sitio y vuelve en altura hacia el mar, donde desciende." : m.type === "terral" ? "La tierra se enfría por irradiación más deprisa que el mar: aire frío y denso sobre tierra que sale hacia el mar, donde el aire más templado asciende." : "Tierra y mar están a temperatura parecida: la brisa se está invirtiendo."}</dd>
        </dl>`;
    }
    function renderSide() {
      root.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tab === tab)));
      if (tab === "ver") {
        side.innerHTML = `
          <h4>Lo que cae en el examen</h4>
          <ul>
            <li><b>Virazón</b>: brisa <b>diurna</b>, <b>del mar a tierra</b>, en épocas de calor durante las horas centrales del día; máxima por la tarde.</li>
            <li><b>Terral</b>: brisa <b>nocturna</b>, <b>de tierra a mar</b>, al enfriarse la tierra más rápido que el mar. Más floja.</li>
            <li>Solo se notan si <b>no hay viento general</b> (poco gradiente: verano, anticiclón). Entre una y otra, calma al amanecer y al anochecer.</li>
            <li>Costa por babor de noche → el terral entra por <b>babor</b>. Costa por estribor de día → el virazón entra por <b>babor</b>.</li>
            <li>El terral se nota hasta unas 20 millas mar adentro; el virazón penetra decenas de km tierra adentro.</li>
          </ul>`;
      } else {
        if (!quiz) nextQ();
        const q = quiz;
        side.innerHTML = `
          <div class="row" style="justify-content:space-between"><h4>Pregunta ${qn}</h4><span class="chip acc">Racha ${streak}</span></div>
          <div class="br-q ${q.fig ? "has-fig" : ""}">
            ${q.fig ? figSVG(q.fig, q.done) : ""}
            <div class="stack">
              <p>${q.text}</p>
              <div class="br-opts">${q.opts.map((o, i) => `<button class="btn ${q.done ? (o.ok ? "is-ok" : q.pick === i ? "is-bad" : "") : ""}" data-opt="${i}" ${q.done ? "disabled" : ""}>${o.t}</button>`).join("")}</div>
              ${q.done ? `<p class="${q.right ? "fb-ok" : "fb-bad"}">${q.right ? "Correcto." : "No."}</p><p>${q.expl}</p><div><button class="btn primary" data-next>Siguiente</button></div>` : ""}
            </div>
          </div>`;
      }
    }
    function figSVG({ coastPort, night }, done) {
      const cx = coastPort ? -48 : 48;
      const toLand = !night; // virazón: hacia tierra
      const ax0 = toLand ? -cx * .9 : cx * .9, ax1 = toLand ? cx * .35 : -cx * .35;
      return `<svg viewBox="-75 -80 150 160" aria-hidden="true">
        <rect x="-75" y="-80" width="150" height="160" fill="${night ? "var(--night)" : "var(--sea)"}" rx="8"/>
        <rect x="${coastPort ? -75 : 45}" y="-80" width="30" height="160" fill="#8c7b52"/>
        <text x="${coastPort ? -60 : 60}" y="0" text-anchor="middle" transform="rotate(-90 ${coastPort ? -60 : 60} 0)" style="font:600 10px var(--f-mono);fill:#fff">COSTA</text>
        <path d="M0 -38 C12 -20 12 20 9 34 L-9 34 C-12 20 -12 -20 0 -38Z" fill="var(--sheet)" stroke="var(--ink)" stroke-width="1.5"/>
        <text x="-26" y="52" text-anchor="middle" style="font:600 9px var(--f-mono);fill:${night ? "#fff" : "var(--ink)"}">Br</text>
        <text x="26" y="52" text-anchor="middle" style="font:600 9px var(--f-mono);fill:${night ? "#fff" : "var(--ink)"}">Er</text>
        <text x="0" y="-48" text-anchor="middle" style="font:600 9px var(--f-mono);fill:${night ? "#fff" : "var(--ink)"}">proa</text>
        ${done ? `<line x1="${ax0}" y1="-6" x2="${ax1}" y2="-6" stroke="var(--accent)" stroke-width="4"/><path d="M${ax1 + Math.sign(ax1 - ax0) * 9} -6 L${ax1} -12 L${ax1} 0Z" fill="var(--accent)"/>` : ""}
      </svg>`;
    }
    function nextQ() {
      qn++;
      const q = QUIZ[Math.floor(Math.random() * QUIZ.length)]();
      quiz = { ...q, done: false };
      if (q.fig) setHour(q.hour, true);
    }
    function answer(i) {
      const q = quiz; if (!q || q.done) return;
      q.done = true; q.pick = i; q.right = !!q.opts[i].ok;
      if (q.right) { streak++; ctx.award(10, "Brisas costeras"); if (streak % 5 === 0) { ctx.award(15, "Racha de brisas"); ctx.toast(`${streak} seguidas: dominas virazón y terral`); } }
      else streak = 0;
      if (q.hour != null) setHour(q.hour);
      renderSide();
    }

    // ---------- control ----------
    function setHour(h, silent) {
      hour = ((h % 24) + 24) % 24; updDial(); renderRead();
      if (!loopOn()) frame(performance.now());
      void silent;
    }
    function stop() { playing = false; playBtn.textContent = "▶ Reproducir"; }
    hr.addEventListener("input", () => { stop(); setHour(+hr.value); });
    root.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-play")) { playing = !playing; playBtn.textContent = playing ? "❚❚ Pausa" : "▶ Reproducir"; kick(); return; }
      if (b.dataset.tab) { tab = b.dataset.tab; if (tab === "quiz") quiz = null; renderSide(); return; }
      if (b.dataset.opt) { answer(+b.dataset.opt); return; }
      if (b.hasAttribute("data-next")) { nextQ(); renderSide(); return; }
    });

    // ---------- bucle ----------
    let tAcc = 0;
    const loopOn = () => visible && (!reduce || playing);
    function frame(now) {
      const dt = Math.min(50, now - (last || now)); last = now;
      if (playing) {
        const prev = model(hour).type;
        hour = (hour + dt / 1000 * (reduce ? 2 : 1)) % 24; updDial();
        if (model(hour).type !== prev || Math.floor(now / 250) !== Math.floor((now - dt) / 250)) renderRead();
      }
      const m = model(hour), dir = m.type === "virazon" ? 1 : m.type === "terral" ? -1 : 0, sp = .15 + Math.min(1, m.kn / 12) * .85;
      if (!reduce) for (const p of parts) p.th += dir * dt / 1000 * .45 * sp * p.s;
      tAcc += reduce ? 0 : dt;
      draw(tAcc);
    }
    function loop(now) { raf = 0; frame(now); if (loopOn()) raf = requestAnimationFrame(loop); }
    function kick() { if (!raf && loopOn()) { last = 0; raf = requestAnimationFrame(loop); } }
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } });
    io.observe(stageEl);

    function resize() {
      W = Math.max(280, stageEl.clientWidth || 600); H = Math.round(clamp(W * .58, 240, 420));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      stageEl.style.height = H + "px"; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0); frame(performance.now());
    }
    const ro = new ResizeObserver(resize); ro.observe(stageEl);
    const offTheme = ctx.onTheme ? ctx.onTheme(() => { readPal(); frame(performance.now()); }) : null;

    readPal(); buildDial(); updDial(); renderRead(); renderSide(); resize(); kick();

    return () => {
      if (raf) cancelAnimationFrame(raf); raf = 0; visible = false;
      io.disconnect(); ro.disconnect(); offTheme && offTheme();
      el.innerHTML = "";
    };
  }
};
