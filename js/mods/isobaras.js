// Mapa sinóptico interactivo (Tema 9 · 9.2 / 9.4): borrascas y anticiclones arrastrables,
// isobaras cada 4 mb (marching squares sobre suma de gaussianas), viento en el Hemisferio Norte,
// ley de Buys-Ballot, frentes y quiz. Claves contrastadas con q_met.txt.

const ID = "isobaras";

const CSS = `
.m-isobaras .ib-top{display:flex;flex-wrap:wrap;gap:.6rem;align-items:flex-end;justify-content:space-between}
.m-isobaras .stage{touch-action:none;cursor:crosshair}
.m-isobaras .ib-opts{display:grid;gap:.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))}
.m-isobaras .ib-opts .btn{justify-content:flex-start;text-align:left;height:auto}
.m-isobaras .btn.is-ok{border-color:var(--ok);color:var(--ok)}
.m-isobaras .btn.is-bad{border-color:var(--bad);color:var(--bad)}
.m-isobaras dl.ib-dl{display:grid;grid-template-columns:auto 1fr;gap:.3rem .8rem;margin:0}
.m-isobaras dl.ib-dl dt{font-weight:700;color:var(--muted);font-size:.85rem}
.m-isobaras dl.ib-dl dd{margin:0}
.m-isobaras .ib-centers button{min-height:32px}
.m-isobaras .ib-centers button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.m-isobaras label.ib-sl{display:grid;gap:.15rem;font-size:.9rem}
.m-isobaras label.ib-sl span{display:flex;justify-content:space-between;gap:.5rem}
.m-isobaras .ib-legend{display:flex;flex-wrap:wrap;gap:.4rem 1rem;font-size:.8rem;color:var(--muted)}
.m-isobaras .ib-sw{display:inline-block;width:18px;height:3px;border-radius:2px;vertical-align:middle;margin-right:.3em}
.m-isobaras ul{margin:0;padding-left:1.1rem}
.m-isobaras li{margin:.15rem 0}
`;

// ---------- geografía ----------
const LON0 = -34, LON1 = 12, LAT0 = 31, LAT1 = 60;
const KX = Math.cos(45 * Math.PI / 180);
const WKM = (LON1 - LON0) * 111 * KX, HKM = (LAT1 - LAT0) * 111;
const gx = lon => (lon - LON0) * 111 * KX, gy = lat => (LAT1 - lat) * 111;

const LAND = [
  // Europa occidental (Península, Francia, Benelux, Jutlandia, Italia NW)
  [[-9.3,43.0],[-8.2,43.7],[-7.0,43.6],[-5.8,43.6],[-4.0,43.45],[-1.8,43.4],[-1.25,44.6],[-1.2,45.8],[-2.2,47.1],[-3.4,47.7],[-4.7,48.0],[-4.6,48.6],[-3.0,48.85],[-1.6,48.7],[-1.9,49.7],[-1.2,49.4],[0.2,49.5],[1.5,50.2],[1.6,50.9],[2.5,51.1],[3.6,51.5],[4.2,52.3],[4.8,53.0],[6.0,53.45],[7.2,53.6],[8.6,53.9],[8.9,54.9],[8.2,55.6],[8.1,56.6],[8.6,57.1],[10.0,57.6],[12,57.7],[12,41.6],[11.0,42.4],[10.5,43.0],[10.2,43.9],[8.8,44.4],[7.5,43.8],[6.0,43.1],[4.6,43.4],[3.1,43.1],[3.2,42.3],[3.2,41.9],[2.2,41.3],[0.9,41.0],[0.0,39.9],[-0.3,39.4],[0.2,38.8],[-0.5,38.3],[-0.8,37.6],[-1.6,37.3],[-2.1,36.7],[-3.5,36.7],[-4.4,36.7],[-5.3,36.1],[-5.6,36.0],[-6.3,36.5],[-6.4,36.8],[-6.9,37.2],[-7.4,37.2],[-8.0,37.0],[-8.9,37.0],[-8.8,38.1],[-9.4,38.7],[-9.5,39.4],[-8.9,40.2],[-8.7,41.5],[-8.9,42.2],[-9.3,42.9]],
  // Norte de África
  [[-9.8,31],[-9.3,32.5],[-8.5,33.3],[-7.0,33.8],[-6.4,34.6],[-5.9,35.8],[-5.4,35.9],[-4.4,35.2],[-2.9,35.3],[-1.2,35.3],[0.5,36.0],[3.0,36.8],[6.5,37.1],[9.8,37.3],[10.3,37.0],[11.0,37.1],[12,36.9],[12,31]],
  // Gran Bretaña
  [[-5.7,50.0],[-3.0,50.6],[1.4,51.2],[1.7,52.6],[0.2,53.5],[-0.2,54.2],[-1.6,55.6],[-2.1,57.0],[-1.8,57.6],[-3.6,58.6],[-5.0,58.6],[-6.2,57.5],[-5.6,56.3],[-4.9,55.0],[-3.4,54.8],[-3.5,54.0],[-2.9,53.4],[-4.6,53.3],[-4.2,52.4],[-5.3,51.8],[-3.0,51.5],[-4.2,51.2]],
  // Irlanda
  [[-6.0,52.2],[-6.2,53.5],[-5.9,54.6],[-7.3,55.3],[-8.5,54.9],[-10.0,54.2],[-9.9,53.4],[-9.0,53.2],[-10.3,52.1],[-9.6,51.5],[-8.2,51.8],[-6.4,52.2]],
  // Córcega, Cerdeña, Mallorca, Ibiza, Menorca
  [[8.6,42.0],[9.4,43.0],[9.6,42.2],[9.2,41.4],[8.7,41.6]],
  [[8.4,41.0],[9.6,41.1],[9.8,40.0],[9.6,39.0],[8.5,38.9],[8.4,40.0]],
  [[2.35,39.6],[3.1,39.95],[3.45,39.7],[3.0,39.3],[2.6,39.5]],
  [[1.2,38.9],[1.6,39.1],[1.6,38.85]],
  [[3.8,40.0],[4.3,39.95],[4.25,39.8],[3.85,39.9]],
];
const AZORES = [[-31.1,39.4],[-28.6,38.5],[-28.1,38.7],[-27.2,38.7],[-25.5,37.8]];

const SCEN = {
  invierno: { label: "Invierno", c: [
    { t: "B", lon: -18, lat: 51, p: 976, r: 620 },
    { t: "A", lon: -27, lat: 37, p: 1030, r: 950 },
    { t: "A", lon: 9, lat: 48, p: 1024, r: 650 } ] },
  verano: { label: "Verano", c: [
    { t: "A", lon: -28, lat: 40, p: 1030, r: 1150 },
    { t: "B", lon: -4, lat: 39.5, p: 1008, r: 380 },
    { t: "B", lon: -20, lat: 58, p: 1000, r: 600 } ] },
  temporal: { label: "Temporal", c: [
    { t: "B", lon: -13, lat: 46.5, p: 962, r: 520 },
    { t: "A", lon: -30, lat: 35, p: 1028, r: 850 } ] },
};

// ---------- utilidades ----------
const P8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const P16 = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
const norm = a => ((a % 360) + 360) % 360;
const p8 = b => P8[Math.round(norm(b) / 45) % 8];
const p16 = b => P16[Math.round(norm(b) / 22.5) % 16];
const BF = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64];
const bft = kn => BF.filter(t => kn >= t).length;
const BFN = ["calma","ventolina","flojito","flojo","bonancible","fresquito","fresco","frescachón","temporal","temporal fuerte","temporal duro","temporal muy duro","temporal huracanado"];
const fmt = (n, d = 0) => n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
const deg3 = b => String(Math.round(norm(b)) % 360).padStart(3, "0") + "°";
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const INFLOW = 20; // grados de convergencia/divergencia por rozamiento en superficie

const FRONT_STAGES = [
  { k: "Se acerca el frente cálido", nubes: "Cirros que van espesando: cirroestratos (halo), luego altoestratos.", lluvia: "Aún no; al final, lluvia débil.", pres: "Baja de forma lenta y continua.", viento: "Del S–SE, refresca poco a poco.", temp: "Fresca.", vis: "Buena, empeorando." },
  { k: "Paso del frente cálido", nubes: "Nimboestratos bajos y espesos.", lluvia: "Lluvia continua y persistente.", pres: "Deja de bajar.", viento: "Rola dextrógiro: de S a SW.", temp: "Sube.", vis: "Mala: neblinas y nieblas." },
  { k: "Sector cálido", nubes: "Estratos y estratocúmulos.", lluvia: "Llovizna intermitente.", pres: "Estable o baja ligeramente.", viento: "SW constante.", temp: "Suave, húmeda.", vis: "Regular o mala (niebla de advección en la mar)." },
  { k: "Paso del frente frío", nubes: "Cumulonimbos (desarrollo vertical).", lluvia: "Chubascos fuertes, tormenta, a veces granizo.", pres: "Mínima y empieza a subir con rapidez.", viento: "Rola dextrógiro de golpe: de SW a W–NW, con rachas fuertes.", temp: "Baja bruscamente.", vis: "Mala dentro de los chubascos." },
  { k: "Tras el frente frío", nubes: "Cúmulos dispersos, claros.", lluvia: "Chubascos aislados.", pres: "Sube.", viento: "NW frío y racheado que va cayendo.", temp: "Fría.", vis: "Muy buena." },
  { k: "Frente ocluido", nubes: "Mezcla: estratiformes y cumuliformes.", lluvia: "Lluvia continua seguida de chubascos.", pres: "Baja y luego sube.", viento: "Rola dextrógiro.", temp: "Cambios pequeños.", vis: "Mala con lluvia." },
];
const FRONT_EXPL = [
  "El aire cálido sube despacio sobre el frío: nubes altas que anuncian el frente con horas de antelación (hasta un día).",
  "Llega la superficie frontal al suelo. Precipitación extensa y continua; la presión deja de bajar.",
  "Entre los dos frentes: aire cálido y húmedo del SW. Tiempo gris, nieblas y lloviznas.",
  "El aire frío, más denso, levanta bruscamente al cálido: nubes de desarrollo vertical, chubascos y rachas. Es el momento más duro.",
  "Entra aire frío y seco: el cielo se abre, mejora la visibilidad, la presión sube y el viento del NW va cayendo.",
  "El frente frío, más rápido, alcanza al cálido y levanta del suelo el aire cálido: borrasca madura o en decadencia.",
];

function solve(M, b) {
  const n = b.length, A = M.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let mx = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[mx][i])) mx = k;
    [A[i], A[mx]] = [A[mx], A[i]];
    if (Math.abs(A[i][i]) < 1e-6) return null;
    for (let k = i + 1; k < n; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j <= n; j++) A[k][j] -= f * A[i][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
  return x;
}

export default {
  id: ID,
  tema: 9,
  title: "Mapa de isobaras y vientos",
  icon: "◎",
  desc: "Mueve borrascas y anticiclones, mira las isobaras y el viento, aplica Buys-Ballot y los frentes.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = CSS; document.head.appendChild(s);
    }
    const saved = ctx.store.get("centers", null);
    let C = (Array.isArray(saved) && saved.length ? saved : SCEN.invierno.c.map(c => ({ t: c.t, x: gx(c.lon), y: gy(c.lat), p: c.p, r: c.r })))
      .map((c, i) => ({ ...c, id: i + 1 }));
    let nextId = C.length + 1;
    let sel = C[0]?.id ?? null;
    let mode = "mover";
    let probe = null;              // {x,y} km
    let bbPt = { x: gx(-12), y: gy(44) };
    let stage = 0;
    let quiz = null, streak = 0, qn = 0;
    let drag = null;
    let W = 600, H = 540, S = W / WKM, dpr = 1;
    let pal = {};

    el.innerHTML = `
<div class="m-${ID} stack">
  <div class="ib-top">
    <div><p class="eyebrow">Tema 9 · Borrascas y anticiclones</p><h3>Mapa de isobaras y vientos</h3></div>
    <div class="seg" role="group" aria-label="Modo">
      <button data-mode="mover" aria-pressed="true">Mapa</button>
      <button data-mode="bb" aria-pressed="false">Buys-Ballot</button>
      <button data-mode="frentes" aria-pressed="false">Frentes</button>
      <button data-mode="quiz" aria-pressed="false">Quiz</button>
    </div>
  </div>
  <p class="small muted" data-help></p>
  <div class="stage" data-stage><canvas aria-label="Mapa sinóptico del Atlántico y la Península Ibérica" role="img"></canvas></div>
  <div class="ib-legend">
    <span><i class="ib-sw" style="background:var(--ink)"></i>Isobara (cada 4 mb)</span>
    <span><i class="ib-sw" style="background:var(--muted)"></i>Viento F0–5</span>
    <span><i class="ib-sw" style="background:var(--warn)"></i>F6–7</span>
    <span><i class="ib-sw" style="background:var(--bad)"></i>≥ F8</span>
  </div>
  <div class="grid">
    <div class="panel stack" data-side aria-live="polite"></div>
    <div class="tint stack small" data-info>
      <h4>Claves del examen</h4>
      <ul>
        <li><b>Isobara</b>: línea que une puntos de <b>igual presión</b> en una superficie dada (nivel del mar) en un momento determinado. Se trazan cada 4 mb.</li>
        <li><b>Borrasca (B)</b>: presión que <b>disminuye</b> de la periferia al centro (&lt; 1013 mb). En el HN el viento gira <b>antihorario</b>, converge hacia el centro y el aire <b>asciende</b> → nubes y lluvia. Su formación es la <b>ciclogénesis</b>.</li>
        <li><b>Anticiclón (A)</b>: presión que <b>aumenta</b> hacia el centro (&gt; 1013 mb). En el HN gira <b>horario</b>, diverge y el aire <b>desciende</b> (subsidencia) → buen tiempo.</li>
        <li><b>Isobaras juntas</b> = gradiente grande = <b>más viento</b> y más mar.</li>
        <li>El viento se nombra por donde <b>viene</b>: «viento del NW» procede del NW.</li>
      </ul>
    </div>
  </div>
</div>`;
    const root = el.firstElementChild;
    const $ = s => root.querySelector(s);
    const stageEl = $("[data-stage]"), cv = stageEl.querySelector("canvas"), g = cv.getContext("2d");
    const side = $("[data-side]"), help = $("[data-help]");

    // ---------- campo de presiones ----------
    function amps() {
      const n = C.length; if (!n) return;
      const M = C.map(ci => C.map(cj => Math.exp(-((ci.x - cj.x) ** 2 + (ci.y - cj.y) ** 2) / (2 * cj.r * cj.r))));
      const b = C.map(c => c.p - 1013);
      const a = solve(M, b);
      const ok = a && a.every((v, i) => Math.abs(v) < Math.max(80, 3 * Math.abs(b[i]) + 10));
      C.forEach((c, i) => c.a = ok ? a[i] : b[i]);
    }
    function field(x, y, list = C) {
      let p = 1013, dx = 0, dy = 0;
      for (const c of list) {
        const ex = x - c.x, ey = y - c.y, r2 = c.r * c.r, e = c.a * Math.exp(-(ex * ex + ey * ey) / (2 * r2));
        p += e; dx += -e * ex / r2; dy += -e * ey / r2;
      }
      return { p, dx, dy };
    }
    // viento en superficie, HN: geostrófico (bajas a la izquierda) girado INFLOW° hacia las bajas
    function wind(x, y, list = C) {
      const f = field(x, y, list);
      const Pe = f.dx, Pn = -f.dy;
      let ve = -Pn, vn = Pe;
      const a = INFLOW * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      const e2 = ve * ca - vn * sa, n2 = ve * sa + vn * ca;
      const G = Math.hypot(Pe, Pn) * 100; // mb / 100 km
      const kn = Math.min(75, 11 * G);
      const to = norm(Math.atan2(e2, n2) * 180 / Math.PI);
      return { p: f.p, kn, to, from: norm(to + 180), G };
    }

    // ---------- isobaras ----------
    let grid = null;
    function computeGrid() {
      const nx = Math.max(60, Math.min(140, Math.round(W / 6))), ny = Math.round(nx * HKM / WKM);
      const v = new Float32Array((nx + 1) * (ny + 1));
      let mn = 1e9, mx = -1e9;
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const p = field(i / nx * WKM, j / ny * HKM).p; v[j * (nx + 1) + i] = p; if (p < mn) mn = p; if (p > mx) mx = p;
      }
      grid = { nx, ny, v, mn, mx };
    }
    function contours() {
      const { nx, ny, v, mn, mx } = grid, out = [];
      const cw = W / nx, ch = H / ny;
      for (let L = Math.ceil(mn / 4) * 4; L <= mx; L += 4) {
        const segs = [];
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const a = v[j * (nx + 1) + i], b = v[j * (nx + 1) + i + 1], c = v[(j + 1) * (nx + 1) + i + 1], d = v[(j + 1) * (nx + 1) + i];
          const k = (a >= L ? 8 : 0) | (b >= L ? 4 : 0) | (c >= L ? 2 : 0) | (d >= L ? 1 : 0);
          if (k === 0 || k === 15) continue;
          const x0 = i * cw, y0 = j * ch;
          const T = () => [x0 + cw * (L - a) / (b - a), y0], R = () => [x0 + cw, y0 + ch * (L - b) / (c - b)];
          const Bo = () => [x0 + cw * (L - d) / (c - d), y0 + ch], Le = () => [x0, y0 + ch * (L - a) / (d - a)];
          const add = (p, q) => segs.push([p[0], p[1], q[0], q[1]]);
          const cen = (a + b + c + d) / 4 >= L;
          switch (k) {
            case 1: case 14: add(Le(), Bo()); break;
            case 2: case 13: add(Bo(), R()); break;
            case 3: case 12: add(Le(), R()); break;
            case 4: case 11: add(T(), R()); break;
            case 6: case 9: add(T(), Bo()); break;
            case 7: case 8: add(Le(), T()); break;
            case 5: if (cen) { add(Le(), T()); add(Bo(), R()); } else { add(Le(), Bo()); add(T(), R()); } break;
            case 10: if (cen) { add(T(), R()); add(Le(), Bo()); } else { add(Le(), T()); add(Bo(), R()); } break;
          }
        }
        out.push({ L, segs });
      }
      return out;
    }

    // ---------- dibujo ----------
    const sx = x => x * S, sy = y => y * S;
    const bVec = b => [Math.sin(b * Math.PI / 180), -Math.cos(b * Math.PI / 180)]; // rumbo → vector pantalla
    function readPal() {
      const dark = ctx.theme() === "dark";
      pal = {
        sea: tok("--sea") || "#d7e9ef", land: tok("--sheet") || "#fff", line: tok("--line"), ink: tok("--ink"), muted: tok("--muted"),
        paper: tok("--paper"), warn: tok("--warn"), bad: tok("--bad"), port: tok("--port"), acc: tok("--accent"), ok: tok("--ok"), y: tok("--buoy-y"),
        hi: dark ? "#6ea2ff" : "#1f5fd1", cold: dark ? "#6ea2ff" : "#1f5fd1", warm: dark ? "#ff6b6b" : "#d02a2a", occl: dark ? "#c08cff" : "#7b3fc4",
        mono: tok("--f-mono") || "monospace", disp: tok("--f-display") || "sans-serif",
      };
    }
    function arrow(x, y, ang, len, col, lw = 1.4, head = 5) {
      const [ux, uy] = bVec(ang);
      const x0 = x - ux * len / 2, y0 = y - uy * len / 2, x1 = x + ux * len / 2, y1 = y + uy * len / 2;
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.beginPath(); g.moveTo(x1, y1);
      g.lineTo(x1 - ux * head - uy * head * .6, y1 - uy * head + ux * head * .6);
      g.lineTo(x1 - ux * head + uy * head * .6, y1 - uy * head - ux * head * .6); g.closePath(); g.fill();
    }
    function pill(text, x, y, col, size = 11) {
      g.font = `600 ${size}px ${pal.mono}`;
      const w = g.measureText(text).width + 6;
      g.fillStyle = pal.sea; g.globalAlpha = .9; g.fillRect(x - w / 2, y - size / 2 - 2, w, size + 4); g.globalAlpha = 1;
      g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, x, y + .5);
    }
    function frontGeom(c) {
      const r = c.r, P = (e, s) => [c.x + e * r, c.y + s * r];
      const bez = (p0, p1, p2, p3, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n, u = 1 - t;
        return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
      });
      const O = P(.45, .3);
      return {
        O,
        occl: bez(P(.03, .03), P(.2, -.05), P(.35, .1), O, 16),
        warm: bez(O, P(1.0, .25), P(1.4, .55), P(1.8, .95)),
        cold: bez(O, P(.75, .9), P(.45, 1.5), P(-.1, 2.1)),
      };
    }
    function crossX(pts, y) { let best = pts[0], bd = 1e9; for (const p of pts) { const d = Math.abs(p[1] - y); if (d < bd) { bd = d; best = p; } } return best[0]; }
    function drawFront(pts, kind) {
      const col = kind === "cold" ? pal.cold : kind === "warm" ? pal.warm : pal.occl;
      const sp = pts.map(p => [sx(p[0]), sy(p[1])]);
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.6; g.lineJoin = "round";
      g.beginPath(); sp.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      let acc = 0, n = 0; const step = 22, sz = 7;
      for (let i = 1; i < sp.length; i++) {
        const [x0, y0] = sp[i - 1], [x1, y1] = sp[i], L = Math.hypot(x1 - x0, y1 - y0); if (!L) continue;
        acc += L;
        if (acc < step) continue; acc = 0;
        const ux = (x1 - x0) / L, uy = (y1 - y0) / L;
        let nx = -uy, ny = ux;
        // símbolos hacia donde avanza el frente: frío hacia el E/SE, cálido y ocluido hacia el N/NE
        if (kind === "cold" ? nx < 0 : ny > 0) { nx = -nx; ny = -ny; }
        const sym = kind === "occl" ? (n % 2 ? "warm" : "cold") : kind; n++;
        g.beginPath();
        if (sym === "cold") { g.moveTo(x1 - ux * sz * .7, y1 - uy * sz * .7); g.lineTo(x1 + nx * sz, y1 + ny * sz); g.lineTo(x1 + ux * sz * .7, y1 + uy * sz * .7); }
        else { const a0 = Math.atan2(uy, ux); g.arc(x1, y1, sz * .7, a0, a0 + Math.PI, nx * -uy + ny * ux < 0); }
        g.closePath(); g.fill();
      }
    }
    function deepestB() { return C.filter(c => c.t === "B").sort((a, b) => a.p - b.p)[0] || null; }

    function draw() {
      if (!grid) return;
      g.clearRect(0, 0, W, H);
      g.fillStyle = pal.sea; g.fillRect(0, 0, W, H);
      // graticula
      g.strokeStyle = pal.line; g.lineWidth = 1; g.setLineDash([2, 4]);
      g.font = `10px ${pal.mono}`; g.fillStyle = pal.muted; g.textBaseline = "top"; g.textAlign = "left";
      for (let lon = -30; lon <= 10; lon += 10) { const x = sx(gx(lon)); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); g.fillText(`${Math.abs(lon)}°${lon < 0 ? "W" : lon > 0 ? "E" : ""}`, x + 3, H - 13); }
      for (let lat = 40; lat <= 50; lat += 10) { const y = sy(gy(lat)); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.fillText(`${lat}°N`, 3, y + 2); }
      g.setLineDash([]);
      // tierra
      g.fillStyle = pal.land; g.strokeStyle = pal.muted; g.lineWidth = 1;
      for (const poly of LAND) { g.beginPath(); poly.forEach(([lo, la], i) => { const x = sx(gx(lo)), y = sy(gy(la)); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill(); g.globalAlpha = .6; g.stroke(); g.globalAlpha = 1; }
      for (const [lo, la] of AZORES) { g.beginPath(); g.arc(sx(gx(lo)), sy(gy(la)), 2, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = pal.muted; g.font = `italic 11px ${pal.mono}`; g.textAlign = "center";
      g.fillText("Azores", sx(gx(-28)), sy(gy(37.6)));
      // isobaras
      const cs = contours(), labels = [];
      g.strokeStyle = pal.ink; g.lineCap = "round";
      for (const { L, segs } of cs) {
        g.lineWidth = L % 20 === 0 ? 1.8 : 1.15; g.globalAlpha = .85;
        g.beginPath(); for (const s of segs) { g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); } g.stroke(); g.globalAlpha = 1;
        let n = 0;
        const stride = Math.max(1, Math.floor(segs.length / 14));
        for (let i = Math.floor(stride / 2); i < segs.length && n < 2; i += stride) {
          const s = segs[i], mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2;
          if (mx < 22 || mx > W - 22 || my < 12 || my > H - 22) continue;
          if (labels.some(l => Math.hypot(l[0] - mx, l[1] - my) < 85)) continue;
          if (C.some(c => Math.hypot(sx(c.x) - mx, sy(c.y) - my) < 30)) continue;
          labels.push([mx, my, L]); n++;
        }
      }
      for (const [x, y, L] of labels) pill(String(L), x, y, pal.ink, 10);
      // frentes
      if (mode === "frentes") {
        const b = deepestB();
        if (b) {
          const F = frontGeom(b);
          // sector cálido
          g.fillStyle = pal.y; g.globalAlpha = .16; g.beginPath();
          F.warm.forEach((p, i) => i ? g.lineTo(sx(p[0]), sy(p[1])) : g.moveTo(sx(p[0]), sy(p[1])));
          g.lineTo(sx(b.x + 1.9 * b.r), sy(b.y + 2.1 * b.r));
          [...F.cold].reverse().forEach(p => g.lineTo(sx(p[0]), sy(p[1]))); g.closePath(); g.fill(); g.globalAlpha = 1;
          drawFront(F.warm, "warm"); drawFront(F.cold, "cold"); drawFront(F.occl, "occl");
          const ws = F.warm[Math.floor(F.warm.length * .7)];
          pill("aire cálido", sx(b.x + 1.15 * b.r), sy(b.y + 1.15 * b.r), pal.muted, 10);
          pill("aire frío", sx(b.x - .7 * b.r), sy(b.y + 1.2 * b.r), pal.muted, 10);
          void ws;
          // barco observador
          const yb = b.y + 1.1 * b.r, xw = crossX(F.warm, yb), xc = crossX(F.cold, yb);
          let bx, by = yb;
          if (stage === 5) { const o = F.occl[8]; bx = o[0]; by = o[1]; }
          else bx = [xw + .5 * b.r, xw, (xw + xc) / 2, xc, xc - .5 * b.r][stage];
          arrow(sx(b.x + 1.5 * b.r), sy(b.y - .55 * b.r), 70, 34, pal.muted, 2, 7);
          pill("avance", sx(b.x + 1.5 * b.r), sy(b.y - .55 * b.r) - 16, pal.muted, 10);
          g.fillStyle = pal.acc; g.strokeStyle = pal.paper; g.lineWidth = 2;
          g.beginPath(); g.arc(sx(bx), sy(by), 7, 0, 7); g.fill(); g.stroke();
          pill("tu barco", sx(bx), sy(by) + 16, pal.acc, 10);
        }
      }
      // vientos
      const sp = W < 500 ? 34 : 42;
      for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) {
        const w = wind(x / S, y / S); if (w.kn < 1.5) continue;
        const f = bft(w.kn);
        const col = f >= 8 ? pal.bad : f >= 6 ? pal.warn : pal.muted;
        arrow(x, y, w.to, 9 + Math.min(1, w.kn / 40) * 17, col, f >= 6 ? 1.8 : 1.3, 4.5);
      }
      // centros
      for (const c of C) {
        const x = sx(c.x), y = sy(c.y), col = c.t === "B" ? pal.port : pal.hi;
        if (c.id === sel && (mode === "mover" || mode === "frentes")) { g.strokeStyle = pal.acc; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.arc(x, y, 22, 0, 7); g.stroke(); g.setLineDash([]); }
        g.font = `700 26px ${pal.disp}`; g.textAlign = "center"; g.textBaseline = "middle";
        g.lineWidth = 4; g.strokeStyle = pal.sea; g.strokeText(c.t, x, y); g.fillStyle = col; g.fillText(c.t, x, y);
        pill(String(Math.round(c.p)), x, y + 20, col, 11);
      }
      // sonda
      if (mode === "mover" && probe) {
        const x = sx(probe.x), y = sy(probe.y), w = wind(probe.x, probe.y);
        g.strokeStyle = pal.acc; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 6, 0, 7); g.stroke();
        if (w.kn >= 1.5) arrow(x, y, w.to, 46, pal.acc, 2.5, 8);
      }
      if (mode === "bb") drawBB();
      if (mode === "quiz" && quiz) drawQuiz();
    }

    function drawBB() {
      const P = bbPt, x = sx(P.x), y = sy(P.y), w = wind(P.x, P.y);
      const R = Math.min(70, W * .14);
      if (w.kn >= 1.5) {
        const face = w.to, a0 = (face - 90 - 90) * Math.PI / 180, a1 = (face - 45 - 90) * Math.PI / 180;
        g.fillStyle = pal.port; g.globalAlpha = .18; g.beginPath(); g.moveTo(x, y); g.arc(x, y, R * 1.6, a0, a1); g.closePath(); g.fill(); g.globalAlpha = 1;
        const [lx, ly] = bVec(face - 70);
        g.strokeStyle = pal.port; g.lineWidth = 2; g.setLineDash([6, 4]);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + lx * R * 1.6, y + ly * R * 1.6); g.stroke(); g.setLineDash([]);
        pill("bajas", x + lx * R * 1.75, y + ly * R * 1.75, pal.port, 11);
        const [ux, uy] = bVec(w.to);
        arrow(x - ux * R * .75, y - uy * R * .75, w.to, R * .9, pal.acc, 3, 9);
        pill("viento", x - ux * R * 1.05, y - uy * R * 1.05, pal.acc, 10);
        // mirada (de espaldas al viento)
        g.strokeStyle = pal.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + ux * 22, y + uy * 22); g.stroke();
      }
      g.fillStyle = pal.ink; g.strokeStyle = pal.paper; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); g.stroke();
      const b = nearestB(P);
      if (b) { g.strokeStyle = pal.muted; g.lineWidth = 1; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(x, y); g.lineTo(sx(b.x), sy(b.y)); g.stroke(); g.setLineDash([]); }
    }
    function nearestB(P) {
      let best = null, bd = 1e9;
      for (const c of C) if (c.t === "B") { const d = Math.hypot(c.x - P.x, c.y - P.y) / c.r; if (d < bd) { bd = d; best = c; } }
      return best;
    }
    const bearing = (P, Q) => norm(Math.atan2(Q.x - P.x, -(Q.y - P.y)) * 180 / Math.PI);

    function drawQuiz() {
      const q = quiz;
      q.pts.forEach((p, i) => {
        const x = sx(p.x), y = sy(p.y);
        g.fillStyle = pal.acc; g.strokeStyle = pal.paper; g.lineWidth = 2;
        g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.stroke();
        g.fillStyle = pal.paper; g.font = `700 13px ${pal.mono}`; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(q.type === "max" ? String(i + 1) : "X", x, y + .5);
        if (q.done) { const w = wind(p.x, p.y, q.list || C); if (w.kn >= 1.5) arrow(x, y, w.to, 44, pal.acc, 2.5, 8); }
      });
      if (q.type === "rola" && q.done) {
        const m = q.moved;
        g.globalAlpha = .55; g.font = `700 24px ${pal.disp}`; g.fillStyle = pal.port; g.textAlign = "center"; g.fillText("B", sx(m.x), sy(m.y)); g.globalAlpha = 1;
        const p = q.pts[0], w2 = wind(p.x, p.y, q.after);
        arrow(sx(p.x), sy(p.y), w2.to, 44, pal.port, 2.5, 8);
        g.strokeStyle = pal.port; g.setLineDash([5, 4]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(sx(q.b.x), sy(q.b.y)); g.lineTo(sx(m.x), sy(m.y)); g.stroke(); g.setLineDash([]);
      }
    }

    // ---------- tamaño ----------
    function resize() {
      W = Math.max(280, stageEl.clientWidth || 600);
      H = Math.round(W * HKM / WKM);
      S = W / WKM;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      stageEl.style.height = H + "px";
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      computeGrid(); draw();
    }
    let raf = 0;
    function refresh(full = true) {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; if (full) { amps(); computeGrid(); } draw(); });
    }
    function save() { ctx.store.set("centers", C.map(({ t, x, y, p, r }) => ({ t, x: Math.round(x), y: Math.round(y), p, r }))); }

    // ---------- panel lateral ----------
    function windTxt(w) {
      if (w.kn < 1.5) return `Presión ${fmt(w.p)} mb · calma o viento muy flojo.`;
      const f = bft(w.kn);
      return `Presión <b class="mono">${fmt(w.p)} mb</b> · viento <b>del ${p16(w.from)}</b> (${deg3(w.from)}), ${fmt(w.kn)} nudos, <b>fuerza ${f}</b> (${BFN[f]}).`;
    }
    function renderSide() {
      root.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
      if (mode === "mover") {
        help.textContent = "Arrastra B y A para moverlas; toca el mar para medir presión y viento en un punto.";
        const c = C.find(c => c.id === sel);
        side.innerHTML = `
          <h4>Centros de presión</h4>
          <div class="row ib-centers">${C.map(c => `<button class="btn sm" data-sel="${c.id}" aria-pressed="${c.id === sel}">${c.t} ${Math.round(c.p)}</button>`).join("")}</div>
          <div class="row"><button class="btn sm" data-add="B">+ Borrasca</button><button class="btn sm" data-add="A">+ Anticiclón</button>
            ${Object.entries(SCEN).map(([k, s]) => `<button class="btn sm ghost" data-scen="${k}">${s.label}</button>`).join("")}</div>
          ${c ? `
          <label class="ib-sl"><span><b>${c.t === "B" ? "Borrasca" : "Anticiclón"} · presión central</b><b class="mono" data-pv>${Math.round(c.p)} mb</b></span>
            <input type="range" data-p min="${c.t === "B" ? 940 : 1015}" max="${c.t === "B" ? 1011 : 1050}" step="1" value="${Math.round(c.p)}" aria-label="Presión central en milibares"></label>
          <label class="ib-sl"><span>Extensión<b class="mono" data-rv>${Math.round(c.r)} km</b></span>
            <input type="range" data-r min="280" max="1300" step="10" value="${Math.round(c.r)}" aria-label="Extensión en kilómetros"></label>
          <div class="row"><button class="btn sm" data-del>Quitar ${c.t}</button></div>` : `<p class="muted small">Añade una borrasca o un anticiclón.</p>`}
          <p class="small" data-probe>${probe ? windTxt(wind(probe.x, probe.y)) : "Toca un punto del mar para leer presión y viento."}</p>
          <p class="small muted">Profundiza la borrasca y mira cómo se juntan las isobaras y crecen las flechas: más gradiente, más viento.</p>`;
      } else if (mode === "bb") {
        help.textContent = "Toca cualquier punto: te pones de espaldas al viento y Buys-Ballot te dice dónde quedan las bajas.";
        const w = wind(bbPt.x, bbPt.y), b = nearestB(bbPt);
        const face = w.to, pred = norm(face - 70);
        side.innerHTML = `
          <h4>Ley de Buys-Ballot (Hemisferio Norte)</h4>
          <p><b>De espaldas al viento, las bajas presiones quedan a tu izquierda</b>, algo adelantadas (≈ 45–90° a la izquierda de hacia donde miras). Cara al viento: la borrasca queda a la derecha, entre 90° y 135°, hacia la aleta de estribor.</p>
          ${w.kn < 1.5 ? `<p class="muted">Aquí casi no hay viento: toca otro punto.</p>` : `
          <dl class="ib-dl">
            <dt>Viento</dt><dd>del ${p16(w.from)} (${deg3(w.from)}), F${bft(w.kn)}</dd>
            <dt>Miras al</dt><dd>${p16(face)} (${deg3(face)})</dd>
            <dt>Bajas hacia</dt><dd><b>${p16(pred)}</b> (≈ ${deg3(pred)})</dd>
            ${b ? `<dt>Centro B real</dt><dd>demora ${deg3(bearing(bbPt, b))} · B ${Math.round(b.p)}</dd>` : `<dt>Centro B</dt><dd class="muted">no hay borrascas en el mapa</dd>`}
          </dl>`}
          <p class="small muted">En el Hemisferio Sur es al revés: de espaldas al viento, las bajas a la derecha.</p>`;
      } else if (mode === "frentes") {
        const b = deepestB();
        help.textContent = "Frentes de la borrasca más profunda. Avanza el sistema y mira qué tiempo vive tu barco.";
        if (!b) { side.innerHTML = `<p>No hay borrasca en el mapa.</p><button class="btn primary" data-add="B">Añadir borrasca</button>`; return; }
        const st = FRONT_STAGES[stage];
        side.innerHTML = `
          <h4>Frentes y tiempo asociado</h4>
          <div class="seg" role="group" aria-label="Fase">${FRONT_STAGES.map((s, i) => `<button data-stage="${i}" aria-pressed="${i === stage}">${i < 5 ? i + 1 : "Ocl."}</button>`).join("")}</div>
          <p><b>${st.k}.</b> ${FRONT_EXPL[stage]}</p>
          <dl class="ib-dl">
            <dt>Nubes</dt><dd>${st.nubes}</dd><dt>Precipitación</dt><dd>${st.lluvia}</dd><dt>Presión</dt><dd>${st.pres}</dd>
            <dt>Viento</dt><dd>${st.viento}</dd><dt>Temperatura</dt><dd>${st.temp}</dd><dt>Visibilidad</dt><dd>${st.vis}</dd>
          </dl>
          <div class="row"><button class="btn sm" data-st="-1" ${stage === 0 ? "disabled" : ""}>◂ Antes</button><button class="btn sm primary" data-st="1" ${stage === 5 ? "disabled" : ""}>Después ▸</button></div>
          <p class="small muted">Símbolos: <span style="color:${pal.cold}">▲ frente frío</span> · <span style="color:${pal.warm}">◖ frente cálido</span> · <span style="color:${pal.occl}">▲◖ ocluido</span>. Las borrascas atlánticas avanzan de W a E; si pasan al norte de ti (lo habitual en la Península), el viento rola <b>dextrógiro</b>: S → SW → W → NW.</p>`;
      } else if (mode === "quiz") {
        help.textContent = "Lee el mapa: isobaras, sentido de giro y gradiente.";
        if (!quiz) newQuiz();
        const q = quiz;
        side.innerHTML = `
          <div class="row" style="justify-content:space-between"><h4>Pregunta ${qn}</h4><span class="chip acc">Racha ${streak}</span></div>
          <p>${q.text}</p>
          <div class="ib-opts">${q.opts.map((o, i) => `<button class="btn ${q.done ? (o.ok ? "is-ok" : q.pick === i ? "is-bad" : "") : ""}" data-opt="${i}" ${q.done ? "disabled" : ""}>${o.t}</button>`).join("")}</div>
          ${q.done ? `<p class="${q.right ? "fb-ok" : "fb-bad"}">${q.right ? "Correcto." : "No."}</p><p class="small">${q.expl}</p>
          <div class="row"><button class="btn primary" data-next>Siguiente</button><button class="btn sm ghost" data-newmap>Otro mapa</button></div>` : ""}`;
      }
    }

    // ---------- quiz ----------
    function randPt(margin = .08) { return { x: WKM * (margin + Math.random() * (1 - 2 * margin)), y: HKM * (margin + Math.random() * (1 - 2 * margin)) }; }
    function farFromCenters(p, k = .35) { return C.every(c => Math.hypot(c.x - p.x, c.y - p.y) > k * c.r); }
    function newQuiz() {
      qn++;
      if (!C.some(c => c.t === "B")) { C.push({ t: "B", x: gx(-16), y: gy(50), p: 978, r: 600, id: nextId++ }); amps(); computeGrid(); }
      const kinds = shuffle(["from", "rola", "max"]);
      for (const k of kinds) { const q = makeQ(k); if (q) { quiz = q; return; } }
      quiz = makeQ("from") || { type: "from", pts: [], text: "Añade sistemas al mapa.", opts: [], done: true, expl: "" };
    }
    function makeQ(type) {
      if (type === "from") {
        for (let t = 0; t < 80; t++) {
          const p = randPt(); const w = wind(p.x, p.y);
          if (w.kn < 8 || !farFromCenters(p)) continue;
          const i = Math.round(norm(w.from) / 45) % 8;
          const opts = shuffle([{ t: `Del ${P8[i]}`, ok: true }, { t: `Del ${P8[(i + 4) % 8]}`, ok: false }, { t: `Del ${P8[(i + 2) % 8]}`, ok: false }, { t: `Del ${P8[(i + 6) % 8]}`, ok: false }]);
          const b = nearestB(p);
          return { type, pts: [p], opts, text: "¿De dónde sopla el viento en el punto <b>X</b>?",
            expl: `Sopla del ${P8[i]} (${deg3(w.from)}), unos ${fmt(w.kn)} nudos (F${bft(w.kn)}). En el HN el aire gira <b>antihorario</b> alrededor de la B y <b>horario</b> alrededor de la A, casi paralelo a las isobaras pero cruzándolas ≈ ${INFLOW}° hacia las bajas. Comprueba con Buys-Ballot: de espaldas al viento, la baja ${b ? `(B ${Math.round(b.p)})` : ""} queda a tu izquierda. Recuerda: el viento se nombra por donde <b>viene</b>, no hacia donde va.` };
        }
        return null;
      }
      if (type === "rola") {
        const b = deepestB(); if (!b) return null;
        for (let t = 0; t < 30; t++) {
          const south = Math.random() < .7;
          const p = { x: b.x + b.r * (1.0 + Math.random() * .4), y: b.y + (south ? 1 : -1) * b.r * (.6 + Math.random() * .3) };
          if (p.x < 0.04 * WKM || p.x > .96 * WKM || p.y < .04 * HKM || p.y > .96 * HKM) continue;
          const moved = { ...b, x: b.x + 1.4 * b.r };
          const after = C.map(c => c.id === b.id ? moved : c);
          const w1 = wind(p.x, p.y), w2 = wind(p.x, p.y, after);
          if (w1.kn < 5 || w2.kn < 3) continue;
          let d = norm(w2.from - w1.from); if (d > 180) d -= 360;
          if (Math.abs(d) < 30) continue;
          const dex = d > 0;
          const opts = shuffle([
            { t: `Dextrógiro (sentido horario): del ${p8(w1.from)} hacia el ${p8(w2.from)}`, ok: dex },
            { t: `Levógiro (sentido antihorario): del ${p8(w1.from)} hacia el ${p8(w1.from - Math.abs(d))}`, ok: !dex && p8(w1.from - Math.abs(d)) === p8(w2.from) },
            { t: "No rola: solo refresca", ok: false },
          ]);
          if (!opts.some(o => o.ok)) opts.find(o => o.t.startsWith("Levógiro")).ok = true;
          return { type, pts: [p], opts, b, moved, after, list: C,
            text: `La borrasca B ${Math.round(b.p)} se desplaza hacia el <b>E</b> y pasa al ${south ? "norte" : "sur"} del barco <b>X</b>. Ahora sopla del ${p8(w1.from)}. ¿Cómo rolará el viento?`,
            expl: `Al moverse la B, en X el viento pasa del ${p16(w1.from)} al ${p16(w2.from)}: rola <b>${dex ? "dextrógiro" : "levógiro"}</b>. Regla HN: si la borrasca pasa <b>al norte</b> de ti (estás en su lado sur, el habitual en la Península) el viento rola <b>dextrógiro</b> (S → SW → W → NW); si pasa <b>al sur</b>, rola <b>levógiro</b> (E → NE → N). La flecha roja es el viento después.` };
        }
        return null;
      }
      if (type === "max") {
        for (let t = 0; t < 120; t++) {
          const pts = [randPt(.1), randPt(.1), randPt(.1)];
          if (pts.some((a, i) => pts.some((c, j) => i !== j && Math.hypot(a.x - c.x, a.y - c.y) < WKM * .18))) continue;
          if (!pts.every(p => farFromCenters(p, .25))) continue;
          const ws = pts.map(p => wind(p.x, p.y).kn), s = [...ws].sort((a, b) => b - a);
          if (s[0] < 12 || s[0] < s[1] * 1.4) continue;
          const k = ws.indexOf(s[0]);
          return { type, pts, opts: pts.map((_, i) => ({ t: `Punto ${i + 1}`, ok: i === k })),
            text: "¿En qué punto sopla <b>más viento</b>?",
            expl: `Punto ${k + 1}: ${ws.map((v, i) => `${i + 1} → ${fmt(v)} kn (F${bft(v)})`).join(" · ")}. Donde las <b>isobaras están más juntas</b> el gradiente de presión es mayor y el viento más fuerte; isobaras separadas = viento flojo. Ojo: no es «cerca del centro»: justo en el centro de la B el viento puede ser flojo.` };
        }
        return null;
      }
    }
    function answer(i) {
      const q = quiz; if (!q || q.done) return;
      q.done = true; q.pick = i; q.right = !!q.opts[i].ok;
      if (q.right) {
        streak++; ctx.award(10, "Mapa de isobaras");
        if (streak > 0 && streak % 5 === 0) { ctx.award(20, "5 seguidas en el mapa"); ctx.toast(`${streak} aciertos seguidos leyendo el mapa`); }
      } else streak = 0;
      renderSide(); draw();
    }

    // ---------- eventos ----------
    function loc(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function hit(px, py) { let best = null, bd = 26; for (const c of C) { const d = Math.hypot(sx(c.x) - px, sy(c.y) - py); if (d < bd) { bd = d; best = c; } } return best; }
    function onDown(e) {
      const [px, py] = loc(e);
      if (mode === "quiz") return;
      if (mode === "mover" || mode === "frentes") {
        const c = hit(px, py);
        if (c) { drag = { c, dx: sx(c.x) - px, dy: sy(c.y) - py }; sel = c.id; cv.setPointerCapture(e.pointerId); renderSide(); refresh(false); return; }
      }
      if (mode === "mover") { probe = { x: px / S, y: py / S }; drag = { probe: true }; cv.setPointerCapture(e.pointerId); }
      if (mode === "bb") { bbPt = { x: px / S, y: py / S }; drag = { bb: true }; cv.setPointerCapture(e.pointerId); }
      renderSide(); draw();
    }
    function onMove(e) {
      if (!drag) return;
      const [px, py] = loc(e);
      const x = Math.max(0, Math.min(W, px)) / S, y = Math.max(0, Math.min(H, py)) / S;
      if (drag.c) { drag.c.x = Math.max(0, Math.min(WKM, (px + drag.dx) / S)); drag.c.y = Math.max(0, Math.min(HKM, (py + drag.dy) / S)); refresh(); throttledSide(); }
      else if (drag.probe) { probe = { x, y }; draw(); const pe = side.querySelector("[data-probe]"); if (pe) pe.innerHTML = windTxt(wind(x, y)); }
      else if (drag.bb) { bbPt = { x, y }; draw(); throttledSide(); }
    }
    let sideT = 0;
    function throttledSide() { if (sideT) return; sideT = setTimeout(() => { sideT = 0; if (mode !== "mover") renderSide(); else { const pe = side.querySelector("[data-probe]"); if (pe && probe) pe.innerHTML = windTxt(wind(probe.x, probe.y)); } }, 120); }
    function onUp() { if (drag?.c) { save(); renderSide(); } drag = null; }
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);

    root.addEventListener("click", e => {
      const t = e.target.closest("button"); if (!t || !root.contains(t)) return;
      if (t.dataset.mode) { mode = t.dataset.mode; if (mode === "quiz") { quiz = null; } renderSide(); draw(); return; }
      if (t.dataset.sel) { sel = +t.dataset.sel; renderSide(); draw(); return; }
      if (t.dataset.add) {
        const B = t.dataset.add === "B";
        const c = { t: t.dataset.add, x: WKM * (.3 + Math.random() * .3), y: HKM * (.25 + Math.random() * .3), p: B ? 990 : 1026, r: B ? 550 : 850, id: nextId++ };
        C.push(c); sel = c.id; save(); amps(); computeGrid(); renderSide(); draw(); return;
      }
      if (t.dataset.scen) { C = SCEN[t.dataset.scen].c.map(c => ({ t: c.t, x: gx(c.lon), y: gy(c.lat), p: c.p, r: c.r, id: nextId++ })); sel = C[0].id; probe = null; save(); amps(); computeGrid(); renderSide(); draw(); return; }
      if (t.hasAttribute("data-del")) { C = C.filter(c => c.id !== sel); sel = C[0]?.id ?? null; save(); amps(); computeGrid(); renderSide(); draw(); return; }
      if (t.dataset.stage) { stage = +t.dataset.stage; renderSide(); draw(); return; }
      if (t.dataset.st) { stage = Math.max(0, Math.min(5, stage + +t.dataset.st)); renderSide(); draw(); return; }
      if (t.dataset.opt) { answer(+t.dataset.opt); return; }
      if (t.hasAttribute("data-next")) { newQuiz(); renderSide(); draw(); return; }
      if (t.hasAttribute("data-newmap")) {
        const keys = Object.keys(SCEN), k = keys[Math.floor(Math.random() * keys.length)];
        C = SCEN[k].c.map(c => ({ t: c.t, x: gx(c.lon + (Math.random() - .5) * 8), y: gy(c.lat + (Math.random() - .5) * 5), p: c.p + Math.round((Math.random() - .5) * 10), r: c.r, id: nextId++ }));
        sel = C[0].id; amps(); computeGrid(); newQuiz(); renderSide(); draw(); return;
      }
    });
    root.addEventListener("input", e => {
      const c = C.find(c => c.id === sel); if (!c) return;
      if (e.target.matches("[data-p]")) { c.p = +e.target.value; side.querySelector("[data-pv]").textContent = c.p + " mb"; const b = side.querySelector(`[data-sel="${c.id}"]`); if (b) b.textContent = `${c.t} ${c.p}`; refresh(); }
      if (e.target.matches("[data-r]")) { c.r = +e.target.value; side.querySelector("[data-rv]").textContent = c.r + " km"; refresh(); }
    });
    root.addEventListener("change", e => { if (e.target.matches("[data-p],[data-r]")) save(); });

    const offTheme = ctx.onTheme ? ctx.onTheme(() => { readPal(); draw(); renderSide(); }) : null;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => { readPal(); draw(); };
    mq.addEventListener?.("change", onMq);
    const ro = new ResizeObserver(() => resize());
    ro.observe(stageEl);

    readPal(); amps(); resize(); renderSide();

    return () => {
      ro.disconnect(); offTheme && offTheme(); mq.removeEventListener?.("change", onMq);
      if (raf) cancelAnimationFrame(raf); clearTimeout(sideT);
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp); cv.removeEventListener("pointercancel", onUp);
      el.innerHTML = "";
    };
  }
};
