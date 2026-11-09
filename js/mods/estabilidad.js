// Simulador de estabilidad transversal — sección transversal con K, G, C, M, GM y GZ calculados
// por hidrostática real (polígono de carena), curva GZ, barco duro/blando, superficies libres,
// agua embarcada, GM negativo y sincronismo del balance/cabezada con las olas.

const ID = "estabilidad";
const RAD = Math.PI / 180;
const G_ACC = 9.81;

// ---------- Geometría del casco (metros, sistema del barco: x → estribor, y ↑ desde la quilla K) ----------
const HALF = [[0, 0], [0.35, 0.05], [0.75, 0.15], [1.05, 0.32], [1.22, 0.55], [1.32, 0.8], [1.48, 1.2], [1.66, 1.75]];
const DECK = 1.75;
const BEAM = 3.32;
const HULL = [...HALF, ...HALF.slice().reverse().map(([x, y]) => [-x, y]).filter(([x, y]) => !(x === 0 && y === 0))];
const K_GYR = 0.42 * BEAM; // radio de giro transversal
const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const TANK = rect(-0.9, 0.9, 0.5, 0.8);            // tanque ancho (combustible/agua): mucha superficie libre
const COCKPIT = rect(-0.95, 0.95, 1.33, 1.75);      // bañera / cubierta donde se embarca agua

function clip(poly, ux, uy, d) {
  const out = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const da = a[0] * ux + a[1] * uy - d, db = b[0] * ux + b[1] * uy - d;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}
function areaCent(p) {
  let A = 0, cx = 0, cy = 0;
  const n = p.length;
  if (n < 3) return { A: 0, x: 0, y: 0 };
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % n];
    const c = x0 * y1 - x1 * y0;
    A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
  }
  A /= 2;
  if (Math.abs(A) < 1e-12) return { A: 0, x: 0, y: 0 };
  return { A: Math.abs(A), x: cx / (6 * A), y: cy / (6 * A) };
}
// Rellena un polígono (casco o tanque) hasta un área objetivo con superficie perpendicular a "up".
function fillTo(poly, ux, uy, target) {
  let lo = Infinity, hi = -Infinity;
  for (const p of poly) { const v = p[0] * ux + p[1] * uy; if (v < lo) lo = v; if (v > hi) hi = v; }
  const total = areaCent(poly).A;
  if (target >= total - 1e-9) { const c = areaCent(poly); return { d: hi, poly, c, full: true }; }
  let sub = null, c = null;
  for (let i = 0; i < 46; i++) {
    const mid = (lo + hi) / 2;
    sub = clip(poly, ux, uy, mid);
    c = areaCent(sub);
    if (c.A < target) lo = mid; else hi = mid;
  }
  const d = (lo + hi) / 2;
  sub = clip(poly, ux, uy, d);
  return { d, poly: sub, c: areaCent(sub), full: false };
}

const HULL_AREA = areaCent(HULL).A;
const M_LIGHT = areaCent(clip(HULL, 0, 1, 0.8)).A; // barco en rosca: calado 0,80 m
const TANK_AREA = areaCent(TANK).A;
const W_HIGH = { m: 0.10 * M_LIGHT, x: 0, y: 3.05 };   // pesos altos (fly, arboladura, carga en techo)
const W_LOW = { m: 0.12 * M_LIGHT, x: 0, y: 0.16 };    // lastre en la sentina
const W_SIDE = { m: 0.08 * M_LIGHT, x: 1.45, y: 2.35 }; // tripulación de pie en la banda de estribor
const COCK_WATER = 0.2 * M_LIGHT;

const STYLE = `
.m-${ID}{display:flex;flex-direction:column;gap:1rem}
.m-${ID} .m-lay{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:1rem;align-items:start}
@media (max-width:820px){.m-${ID} .m-lay{grid-template-columns:minmax(0,1fr)}}
.m-${ID} .m-cv{touch-action:none;cursor:grab}
.m-${ID} .m-cv.drag{cursor:grabbing}
.m-${ID} .m-ro{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,108px),1fr));gap:.5rem}
.m-${ID} .m-ro div{background:var(--sea);border-radius:var(--r-sm);padding:.4rem .55rem;min-width:0}
.m-${ID} .m-ro b{display:block;font:600 1.15rem/1.15 var(--f-mono);font-variant-numeric:tabular-nums}
.m-${ID} .m-ro span{font-size:.72rem;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.m-${ID} .m-tg{min-height:36px}
.m-${ID} .m-tg[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.m-${ID} label.m-sl{display:flex;flex-direction:column;gap:.15rem;font-size:.86rem;color:var(--muted)}
.m-${ID} label.m-sl output{font-family:var(--f-mono);color:var(--ink)}
.m-${ID} .m-note{font-size:.92rem;line-height:1.45}
.m-${ID} .m-note b{color:var(--ink)}
.m-${ID} .m-bar{height:12px;border-radius:6px;background:var(--sea);overflow:hidden;border:1px solid var(--line)}
.m-${ID} .m-bar i{display:block;height:100%;width:0;background:var(--ok);transition:width .25s}
.m-${ID} .m-bar.hot i{background:var(--bad)}
.m-${ID} .m-opts{display:flex;flex-direction:column;gap:.45rem}
.m-${ID} .m-opts .btn{justify-content:flex-start;text-align:left;white-space:normal;height:auto;padding:.55em .8em;font-weight:500}
.m-${ID} .m-opts .btn[disabled]{opacity:.7;cursor:default}
.m-${ID} .m-opts .btn.ok,.m-${ID} .m-opts .btn.bad{opacity:1}
.m-${ID} .m-opts .btn.ok{border-color:var(--ok);color:var(--ok);font-weight:700}
.m-${ID} .m-opts .btn.bad{border-color:var(--bad);color:var(--bad)}
.m-${ID} .m-mis{display:flex;gap:.6rem;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid var(--line);padding:.55rem 0}
.m-${ID} .m-mis:last-child{border-bottom:0}
.m-${ID} .m-mis p{flex:1 1 220px}
.m-${ID} .m-leg{display:flex;flex-wrap:wrap;gap:.3rem .9rem;font-size:.8rem;color:var(--muted)}
.m-${ID} .m-leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:.3em;vertical-align:-1px}
.m-${ID} [hidden]{display:none!important}
`;

const QUIZ = [
  { q: "En aguas tranquilas, el barco recupera su posición desde una escora. ¿Cuándo podemos asegurar que tiene MAYOR estabilidad transversal?",
    o: ["Cuando la frecuencia del balance es alta (balance rápido).", "Cuando la frecuencia del balance es baja o casi nula.", "Cuando la frecuencia de la cabezada es alta.", "Cuando la frecuencia de la cabezada es baja."],
    a: 0, e: "Más GM → par adrizante mayor → el barco vuelve antes: balance rápido (periodo corto, frecuencia alta). Es el barco «duro». La cabezada es estabilidad longitudinal." },
  { q: "Elevar un peso a bordo (p. ej. subir carga a la cubierta o al fly):",
    o: ["Disminuye la estabilidad transversal.", "Aumenta la estabilidad.", "No influye nunca.", "Solo influye con mala mar."],
    a: 0, e: "Subir pesos sube G, reduce GM y el brazo GZ. Es una de las preguntas más repetidas: elevar pesos afecta NEGATIVAMENTE a la estabilidad transversal." },
  { q: "La elevación significativa del centro de gravedad de la embarcación:",
    o: ["Afecta negativamente a la estabilidad transversal.", "Afecta solo a la estabilidad longitudinal.", "No afecta a la estabilidad, pero disminuye el balance.", "Afecta disminuyendo el periodo de balance."],
    a: 0, e: "G más alto → GM menor → barco más «blando»: el periodo de balance AUMENTA (balance más lento), no disminuye." },
  { q: "¿Qué ocurre si el periodo de la ola coincide con el periodo de balance?",
    o: ["Aumenta el movimiento transversal hasta poder volcar.", "Disminuye el balance y mejora la estabilidad.", "Aumenta la cabezada hasta poder volcar.", "Disminuye la cabezada."],
    a: 0, e: "Es el sincronismo (resonancia): cada ola empuja en el momento justo y el balance crece ola a ola." },
  { q: "Para romper el sincronismo del BALANCE con la mar de través, lo más adecuado es:",
    o: ["Cambiar el rumbo.", "Solo modificar la velocidad.", "Atravesarse a la mar.", "Subir pesos para hacer el barco más blando."],
    a: 0, e: "Clave oficial: es INCORRECTO decir que «la manera más adecuada de reducir el balance es modificar la velocidad». El balance se rompe sobre todo cambiando el rumbo (con mar de través la velocidad apenas cambia el periodo de encuentro). La cabezada se rompe con la velocidad." },
  { q: "Con mar por la proa y cabezadas excesivas, debemos:",
    o: ["Disminuir la velocidad y cambiar ligeramente el rumbo, según las condiciones.", "Aumentar la velocidad para cortar las olas.", "Atravesarnos a la mar.", "Elevar G con pesos en cubierta."],
    a: 0, e: "La cabezada se corrige reduciendo velocidad (hasta la mínima de gobierno si hace falta) y, si conviene, cambiando un poco el rumbo." },
  { q: "¿Cuál de estas acciones NO debemos tomar para evitar balances excesivos?",
    o: ["Sincronizar el periodo de la ola con el de balance.", "Modificar el rumbo.", "Modificar la velocidad.", "Evitar atravesarnos a la mar."],
    a: 0, e: "Sincronizar es justo lo que hay que evitar. Rumbo y velocidad cambian el periodo de encuentro con la ola." },
  { q: "La estabilidad estática transversal depende de la posición relativa de:",
    o: ["El centro de gravedad (G) y el centro de carena (C).", "El centro geométrico y la quilla.", "El centro de flotación y el centro geométrico.", "El c.d.g. de los pesos sobre cubierta y C."],
    a: 0, e: "El par adrizante nace de dos fuerzas: el peso, aplicado en G, y el empuje, aplicado en C. Su separación horizontal es el brazo GZ." },
  { q: "Un tanque parcialmente lleno (superficie libre) produce:",
    o: ["Una subida virtual de G que reduce el GM.", "Una bajada de G que mejora la estabilidad.", "Ningún efecto si el tanque está en el fondo.", "Más estabilidad porque el líquido amortigua el balance."],
    a: 0, e: "Al escorar, el líquido corre hacia la banda baja y su c.d.g. se desplaza: equivale a subir G. Por eso los tanques deben ir llenos o vacíos. Lleno del todo: no hay superficie libre." },
  { q: "Si el GM es negativo (G por encima de M):",
    o: ["El barco no se mantiene adrizado: queda con escora permanente o vuelca.", "El barco es muy duro y balancea rápido.", "Solo afecta a la cabezada.", "Es la condición ideal para navegar a vela."],
    a: 0, e: "Con GM < 0, al escorar aparece un par escorante. Puede encontrar un nuevo equilibrio escorado (escora permanente, «a la banda») si las formas lo permiten, o volcar." },
  { q: "Un barco «duro» (GM grande):",
    o: ["Tiene balances rápidos y violentos, incómodos y duros para la estructura.", "Tiene balances lentos y suaves.", "Tiene GM negativo.", "Tiene el G por encima de M."],
    a: 0, e: "Duro: mucho GM, periodo corto, sacudidas bruscas. Blando: poco GM, periodo largo, balance lento pero con menos reserva de estabilidad." },
  { q: "La estabilidad transversal es la propiedad del buque para:",
    o: ["Mantenerse adrizado o recuperar la posición de adrizado.", "Mantener su asiento.", "Igualar empuje y peso del agua desalojada.", "Mantener el periodo de cabezada."],
    a: 0, e: "Transversal = adrizado (babor-estribor). Longitudinal = asiento o trimado (proa-popa)." },
  { q: "El metacentro transversal M es:",
    o: ["El punto donde la vertical por C corta al plano diametral en escoras pequeñas.", "El centro de gravedad del barco vacío.", "El centro geométrico del volumen sumergido.", "El punto más bajo de la quilla."],
    a: 0, e: "K = quilla, C = centro de carena (centroide de la obra viva), G = c.d.g., M = metacentro. Estable si M está por encima de G (GM > 0)." },
];

export default {
  id: ID,
  tema: 3,
  title: "Simulador de estabilidad",
  icon: "⚖",
  desc: "Mueve pesos y mira cómo cambian G, C, M, el GM y el brazo GZ; barco duro, blando, superficies libres y sincronismo con las olas.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = STYLE; document.head.appendChild(s);
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };

    // ---------- Estado ----------
    const st = {
      gx: 0, gy: 1.0, high: false, low: false, side: false, tank: "vacio", water: false,
      th: 0, om: 0, mode: "din", manual: 0, capsized: false, tab: "sim",
    };
    let table = null, info = null;

    // ---------- DOM ----------
    const root = document.createElement("div");
    root.className = `m-${ID}`;
    root.innerHTML = `
<div class="stack" style="gap:.35rem">
  <span class="eyebrow">Tema 3 · Seguridad · Estabilidad</span>
  <h3>Estabilidad transversal: K, G, C, M y GZ</h3>
  <p class="muted small">Sección transversal vista desde popa (estribor a la derecha). Arrastra <b>G</b> o usa los controles para mover pesos.</p>
</div>
<div class="seg" role="tablist">
  <button data-tab="sim" aria-pressed="true">Simulador</button>
  <button data-tab="sync" aria-pressed="false">Sincronismo con la mar</button>
  <button data-tab="reto" aria-pressed="false">Reto</button>
</div>

<section data-pane="sim" class="stack">
  <div class="m-lay">
    <div class="stack">
      <div class="stage m-wrapA"><canvas class="m-cv" aria-label="Sección transversal del barco con K, G, C, M y el brazo GZ"></canvas></div>
      <div class="m-leg"><span><i style="background:var(--muted)"></i>K quilla</span><span><i style="background:var(--accent)"></i>G c. de gravedad</span><span><i style="background:var(--ok)"></i>C c. de carena</span><span><i style="background:var(--warn)"></i>M metacentro</span></div>
      <div class="panel" style="padding:.75rem">
        <div class="row" style="justify-content:space-between"><span class="eyebrow">Curva de brazos adrizantes GZ</span><span class="small muted m-gzlbl"></span></div>
        <div class="stage" style="background:var(--sheet);border:0;margin-top:.4rem"><canvas class="m-cvgz" aria-label="Curva GZ frente a escora"></canvas></div>
      </div>
    </div>
    <div class="stack">
      <div class="m-ro">
        <div><span>GM</span><b class="r-gm">–</b></div>
        <div><span>GZ actual</span><b class="r-gz">–</b></div>
        <div><span>Escora</span><b class="r-th">–</b></div>
        <div><span>KG</span><b class="r-kg">–</b></div>
        <div><span>KM</span><b class="r-km">–</b></div>
        <div><span>Periodo balance</span><b class="r-t">–</b></div>
      </div>
      <div class="row"><span class="chip r-chip">–</span><span class="chip r-eq">–</span></div>
      <div class="tint m-note r-note"></div>
      <div class="panel stack" style="gap:.6rem">
        <span class="eyebrow">Tipo de barco</span>
        <div class="row">
          <button class="btn sm" data-preset="duro">Barco duro</button>
          <button class="btn sm" data-preset="blando">Barco blando</button>
          <button class="btn sm" data-preset="neg">GM negativo</button>
        </div>
        <span class="eyebrow">Mover pesos (G)</span>
        <label class="m-sl">Arriba / abajo <output class="o-gy"></output><input type="range" class="i-gy" min="0.15" max="2.6" step="0.01"></label>
        <label class="m-sl">Babor / estribor <output class="o-gx"></output><input type="range" class="i-gx" min="-0.6" max="0.6" step="0.01"></label>
        <span class="eyebrow">Cargas</span>
        <div class="row">
          <button class="btn sm m-tg" data-tg="high" aria-pressed="false">Peso alto (fly, techo)</button>
          <button class="btn sm m-tg" data-tg="low" aria-pressed="false">Lastre en sentina</button>
          <button class="btn sm m-tg" data-tg="side" aria-pressed="false">Tripulación a estribor</button>
          <button class="btn sm m-tg" data-tg="water" aria-pressed="false">Agua embarcada</button>
          <button class="btn sm m-tg" data-tg="tank" aria-pressed="false">Tanque: vacío</button>
        </div>
        <span class="eyebrow">Movimiento</span>
        <div class="row">
          <div class="seg"><button data-mode="din" aria-pressed="true">Libre</button><button data-mode="man" aria-pressed="false">Escora manual</button></div>
          <button class="btn sm b-kick">Golpe de mar</button>
          <button class="btn sm b-reset">Adrizar</button>
        </div>
        <label class="m-sl r-manwrap" hidden>Escora forzada <output class="o-man"></output><input type="range" class="i-man" min="-80" max="80" step="1" value="0"></label>
      </div>
    </div>
  </div>
</section>

<section data-pane="sync" class="stack" hidden>
  <div class="m-lay">
    <div class="stack">
      <div class="stage"><canvas class="m-cvs" aria-label="Rumbo respecto a la mar y movimientos de balance y cabezada"></canvas></div>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))">
        <div class="stack" style="gap:.3rem"><div class="row" style="justify-content:space-between"><span class="eyebrow">Balance</span><span class="mono small s-ra">–</span></div><div class="m-bar s-rb"><i></i></div></div>
        <div class="stack" style="gap:.3rem"><div class="row" style="justify-content:space-between"><span class="eyebrow">Cabezada</span><span class="mono small s-pa">–</span></div><div class="m-bar s-pb"><i></i></div></div>
      </div>
      <div class="tint m-note s-note"></div>
    </div>
    <div class="stack">
      <div class="panel stack" style="gap:.6rem">
        <label class="m-sl">Mar respecto al barco <output class="o-rel"></output><input type="range" class="i-rel" min="0" max="180" step="5" value="90"></label>
        <label class="m-sl">Velocidad <output class="o-v"></output><input type="range" class="i-v" min="0" max="25" step="1" value="8"></label>
        <label class="m-sl">Periodo de la ola <output class="o-tw"></output><input type="range" class="i-tw" min="3" max="10" step="0.1" value="5"></label>
        <label class="m-sl">Periodo propio de balance <output class="o-tr"></output><input type="range" class="i-tr" min="2.5" max="9" step="0.1" value="4.5"></label>
        <button class="btn sm b-trgm">Usar el GM del simulador</button>
        <p class="small muted">Periodo propio de cabezada: <span class="mono">2,2 s</span> (lancha pequeña). Periodo de encuentro = periodo con que el barco «se encuentra» las olas; depende del rumbo y la velocidad.</p>
      </div>
      <div class="panel stack" style="gap:.5rem">
        <span class="eyebrow">Mini-reto: rompe el sincronismo</span>
        <p class="small s-scn">Pulsa «Nueva situación» y corrige rumbo o velocidad (manteniendo al menos 3 nudos).</p>
        <div class="row"><button class="btn sm b-scn">Nueva situación</button><button class="btn sm primary b-chk" disabled>Comprobar</button></div>
        <p class="small s-fb" aria-live="polite"></p>
      </div>
    </div>
  </div>
</section>

<section data-pane="reto" class="stack" hidden>
  <div class="panel stack" style="gap:.2rem">
    <span class="eyebrow">Misiones en el simulador</span>
    <p class="small muted">Prepara la situación en la pestaña «Simulador» y vuelve aquí a comprobarla.</p>
    <div class="m-missions"></div>
  </div>
  <div class="panel stack">
    <div class="row" style="justify-content:space-between"><span class="eyebrow">Test de estabilidad (preguntas tipo examen)</span><span class="chip q-score">0 / 10</span></div>
    <p class="q-text" style="font-weight:600"></p>
    <div class="m-opts q-opts"></div>
    <p class="q-fb m-note" aria-live="polite"></p>
    <div class="row"><button class="btn primary q-next" hidden>Siguiente</button><button class="btn q-restart" hidden>Repetir test</button><span class="small muted q-best"></span></div>
  </div>
</section>`;
    el.appendChild(root);
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];

    // ---------- Tokens de tema ----------
    let T = {};
    const readTokens = () => {
      const cs = getComputedStyle(document.documentElement);
      const g = (n) => cs.getPropertyValue(n).trim();
      T = { paper: g("--paper"), sheet: g("--sheet"), sea: g("--sea"), sea2: g("--sea-2"), ink: g("--ink"), muted: g("--muted"),
        line: g("--line"), accent: g("--accent"), ok: g("--ok"), warn: g("--warn"), bad: g("--bad"), port: g("--port"), stbd: g("--stbd"),
        mono: g("--f-mono") || "monospace", body: g("--f-body") || "sans-serif" };
    };
    readTokens();

    // ---------- Física ----------
    function stateAt(th, s = st) {
      const ux = -Math.sin(th), uy = Math.cos(th), hx = Math.cos(th), hy = Math.sin(th);
      let M = M_LIGHT, mx = M_LIGHT * s.gx, my = M_LIGHT * s.gy;
      const add = (w) => { M += w.m; mx += w.m * w.x; my += w.m * w.y; };
      if (s.high) add(W_HIGH);
      if (s.low) add(W_LOW);
      if (s.side) add(W_SIDE);
      const liquids = [];
      const liq = (poly, area) => {
        const f = fillTo(poly, ux, uy, area);
        liquids.push(f.poly);
        M += area; mx += area * f.c.x; my += area * f.c.y;
      };
      if (s.tank === "medio") liq(TANK, TANK_AREA * 0.5);
      if (s.tank === "lleno") liq(TANK, TANK_AREA);
      if (s.water) liq(COCKPIT, COCK_WATER);
      const G = { x: mx / M, y: my / M };
      const sub = fillTo(HULL, ux, uy, Math.min(M, HULL_AREA * 0.999));
      const C = sub.c;
      const GZ = (C.x - G.x) * hx + (C.y - G.y) * hy;
      return { th, G, C, d: sub.d, GZ, sub: sub.poly, liquids, M, sink: M >= HULL_AREA * 0.999 };
    }
    function analyse() {
      table = [];
      for (let deg = -90; deg <= 90; deg++) table.push(stateAt(deg * RAD).GZ);
      const dl = 0.5 * RAD;
      const p = stateAt(dl), m = stateAt(-dl);
      const GM = (p.GZ - m.GZ) / (2 * Math.sin(dl));
      // KM geométrico: corte de la vertical por C (escora pequeña) con el plano diametral
      const KM = p.C.y + p.C.x / Math.tan(dl);
      const up = stateAt(0);
      const KG = up.G.y;
      const KGv = KM - GM; // KG virtual (incluye superficies libres)
      // Equilibrios estables: GZ cruza de − a + al aumentar la escora
      const eqs = [];
      for (let i = 0; i < table.length - 1; i++) {
        const a = table[i], b = table[i + 1];
        if (a <= 0 && b > 0) eqs.push(-90 + i + (a === b ? 0 : (-a) / (b - a)));
      }
      let maxGZ = 0, maxAt = 0;
      for (let i = 90; i <= 180; i++) if (table[i] > maxGZ) { maxGZ = table[i]; maxAt = i - 90; }
      let vanish = null;
      for (let i = 91; i <= 180; i++) if (table[i - 1] > 0 && table[i] <= 0 && i - 90 > 5) { vanish = i - 90; break; }
      const T = GM > 0.005 ? 2 * Math.PI * K_GYR / Math.sqrt(G_ACC * GM) : Infinity;
      info = { GM, KM, KG, KGv, eqs, maxGZ, maxAt, vanish, T, fs: st.tank === "medio" || st.water };
      return info;
    }
    const gzAt = (thDeg) => {
      const x = Math.max(-90, Math.min(90, thDeg)) + 90;
      const i = Math.min(179, Math.floor(x)), f = x - i;
      return table[i] * (1 - f) + table[i + 1] * f;
    };
    const nearestEq = (thDeg) => {
      if (!info.eqs.length) return null;
      return info.eqs.reduce((b, e) => (Math.abs(e - thDeg) < Math.abs(b - thDeg) ? e : b), info.eqs[0]);
    };
    function solveGyFor(targetGM) {
      // GM es casi lineal en gy (ligera no linealidad por calados): dos iteraciones de secante
      let a = 0.4, b = 1.6;
      const gmAt = (gy) => { const s = { ...st, gy }; const dl = 0.5 * RAD; return (stateAt(dl, s).GZ - stateAt(-dl, s).GZ) / (2 * Math.sin(dl)); };
      let fa = gmAt(a) - targetGM, fb = gmAt(b) - targetGM;
      for (let i = 0; i < 6; i++) {
        const c = b - fb * (b - a) / (fb - fa || 1e-9);
        a = b; fa = fb; b = Math.max(0.15, Math.min(2.6, c)); fb = gmAt(b) - targetGM;
      }
      return b;
    }

    // ---------- Canvas helpers ----------
    function fitCanvas(cv, wrap, ratio, minH, maxH) {
      const w = Math.max(200, wrap.clientWidth);
      const h = Math.round(Math.max(minH, Math.min(maxH, w * ratio)));
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.height = h + "px";
      const c2 = cv.getContext("2d"); c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h, c: c2 };
    }
    const cvA = $(".m-cv"), wrapA = $(".m-wrapA"), cvGZ = $(".m-cvgz"), cvS = $(".m-cvs");
    let A = null, GZc = null, S = null;
    let view = { cx: 0, wy: 0, s: 1 };

    function resizeAll() {
      A = fitCanvas(cvA, wrapA, 0.74, 270, 470);
      GZc = fitCanvas(cvGZ, cvGZ.parentElement, 0.36, 150, 220);
      if (!cvS.closest("[hidden]")) S = fitCanvas(cvS, cvS.parentElement, cvS.parentElement.clientWidth < 520 ? 1.05 : 0.55, 230, 380);
      draw(); drawGZ(); if (S) drawSync(0);
    }

    // ---------- Dibujo de la sección ----------
    function arrow(c, x0, y0, x1, y1, col, lw = 2) {
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      const a = Math.atan2(y1 - y0, x1 - x0), L = 8;
      c.beginPath(); c.moveTo(x1, y1);
      c.lineTo(x1 - L * Math.cos(a - 0.4), y1 - L * Math.sin(a - 0.4));
      c.lineTo(x1 - L * Math.cos(a + 0.4), y1 - L * Math.sin(a + 0.4)); c.closePath(); c.fill();
    }
    function label(c, txt, x, y, col, align = "left", size = 12, bold = true) {
      c.font = `${bold ? 600 : 400} ${size}px ${T.mono}`;
      c.textAlign = align; c.textBaseline = "middle";
      c.lineWidth = 3; c.strokeStyle = T.paper; c.strokeText(txt, x, y);
      c.fillStyle = col; c.fillText(txt, x, y);
    }
    let curState = null;
    function draw() {
      if (!A) return;
      const { c, w, h } = A;
      const th = st.th * RAD;
      const s0 = curState = stateAt(th);
      const sc = Math.min(w / 5, h / 4.4);
      const cx = w / 2, wy = h * 0.62;
      view = { cx, wy, s: sc };
      const ux = -Math.sin(th), uy = Math.cos(th), hx = Math.cos(th), hy = Math.sin(th);
      const P = (p) => [cx + sc * (p[0] * hx + p[1] * hy), wy - sc * (p[0] * ux + p[1] * uy - s0.d)];
      const path = (poly) => { c.beginPath(); poly.forEach((p, i) => { const [X, Y] = P(p); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
      // fondo
      c.fillStyle = T.paper; c.fillRect(0, 0, w, h);
      c.fillStyle = T.sea2; c.fillRect(0, wy, w, h - wy);
      c.strokeStyle = T.muted; c.lineWidth = 1; c.setLineDash([]);
      c.beginPath(); c.moveTo(0, wy); c.lineTo(w, wy); c.stroke();
      label(c, "flotación", 8, wy - 9, T.muted, "left", 11, false);
      // casco
      path(HULL); c.fillStyle = T.sheet; c.fill();
      // carena (obra viva)
      path(s0.sub); c.fillStyle = T.sea; c.globalAlpha = 0.85; c.fill(); c.globalAlpha = 1;
      // superestructura y arco
      path(rect(-0.85, 0.85, DECK, 2.4)); c.fillStyle = T.sheet; c.fill(); c.strokeStyle = T.muted; c.lineWidth = 1.2; c.stroke();
      // tanques y bañera
      c.setLineDash([4, 3]); c.strokeStyle = T.muted; c.lineWidth = 1;
      path(TANK); c.stroke(); path(COCKPIT); c.stroke(); c.setLineDash([]);
      for (const lp of s0.liquids) { path(lp); c.fillStyle = T.sea2; c.fill(); c.strokeStyle = T.ink; c.lineWidth = 1; c.stroke(); }
      path(HULL); c.strokeStyle = T.ink; c.lineWidth = 2.2; c.stroke();
      // plano diametral
      c.setLineDash([6, 4]); c.strokeStyle = T.muted; c.lineWidth = 1;
      let [a1, b1] = P([0, -0.25]), [a2, b2] = P([0, 3.45]);
      c.beginPath(); c.moveTo(a1, b1); c.lineTo(a2, b2); c.stroke(); c.setLineDash([]);
      // pesos
      const wbox = (wt, name) => { const [X, Y] = P([wt.x, wt.y]); c.fillStyle = T.ink; c.fillRect(X - 7, Y - 7, 14, 14); label(c, name, X + 11, Y, T.ink, "left", 11, false); };
      if (st.high) { const [X1, Y1] = P([0, DECK + 0.65]), [X2, Y2] = P([0, W_HIGH.y]); c.strokeStyle = T.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(X1, Y1); c.lineTo(X2, Y2); c.stroke(); wbox(W_HIGH, "peso alto"); }
      if (st.low) wbox(W_LOW, "lastre");
      if (st.side) { const [X1, Y1] = P([W_SIDE.x, DECK]), [X2, Y2] = P([W_SIDE.x, W_SIDE.y]); c.strokeStyle = T.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(X1, Y1); c.lineTo(X2, Y2); c.stroke(); wbox(W_SIDE, "tripulación"); }
      // puntos
      const G = P([s0.G.x, s0.G.y]), C = P([s0.C.x, s0.C.y]), K = P([0, 0]);
      const Mp = P([0, info.KM]);
      // vertical por C (dirección del empuje) y línea del peso
      c.setLineDash([3, 3]); c.strokeStyle = T.ok; c.lineWidth = 1;
      c.beginPath(); c.moveTo(C[0], C[1]); c.lineTo(C[0], Math.min(G[1], Mp[1]) - 30); c.stroke(); c.setLineDash([]);
      // fuerzas
      const fl = Math.max(30, Math.min(80, sc * 0.6));
      arrow(c, G[0], G[1], G[0], G[1] + fl, T.accent, 2.2);
      label(c, "Δ", G[0] + 8, G[1] + fl - 6, T.accent);
      arrow(c, C[0], C[1], C[0], C[1] - fl * 0.9, T.ok, 2.2);
      label(c, "E", C[0] + 8, C[1] - fl * 0.9 + 6, T.ok);
      // GZ
      if (Math.abs(st.th) > 0.4 || Math.abs(s0.GZ) > 0.005) {
        const Z = [C[0], G[1]];
        const good = s0.GZ * (st.th || 1) > 0;
        c.strokeStyle = good ? T.ok : T.bad; c.lineWidth = 4;
        c.beginPath(); c.moveTo(G[0], G[1]); c.lineTo(Z[0], Z[1]); c.stroke();
        c.fillStyle = good ? T.ok : T.bad; c.beginPath(); c.arc(Z[0], Z[1], 3.5, 0, 7); c.fill();
        label(c, "Z", Z[0] + (Z[0] >= G[0] ? 8 : -8), Z[1] - 10, good ? T.ok : T.bad, Z[0] >= G[0] ? "left" : "right");
      }
      // M
      c.fillStyle = T.warn; c.beginPath(); c.moveTo(Mp[0], Mp[1] - 7); c.lineTo(Mp[0] + 6, Mp[1] + 5); c.lineTo(Mp[0] - 6, Mp[1] + 5); c.closePath(); c.fill();
      label(c, "M", Mp[0] - 12, Mp[1], T.warn, "right");
      // K
      c.fillStyle = T.muted; c.fillRect(K[0] - 4, K[1] - 4, 8, 8); label(c, "K", K[0] - 10, K[1] + 4, T.muted, "right");
      // C
      c.fillStyle = T.ok; c.beginPath(); c.arc(C[0], C[1], 6, 0, 7); c.fill(); label(c, "C", C[0] - 10, C[1] + 2, T.ok, "right");
      // G virtual (superficies libres)
      if (info.fs && info.KGv - info.KG > 0.02) {
        const Gv = P([s0.G.x, info.KGv]);
        c.strokeStyle = T.accent; c.lineWidth = 1.5; c.setLineDash([2, 2]);
        c.beginPath(); c.arc(Gv[0], Gv[1], 6, 0, 7); c.stroke(); c.setLineDash([]);
        label(c, "G′ virtual", Gv[0] + 10, Gv[1], T.accent, "left", 11, false);
      }
      // G (arrastrable)
      c.fillStyle = T.accent; c.beginPath(); c.arc(G[0], G[1], 8, 0, 7); c.fill();
      c.strokeStyle = T.paper; c.lineWidth = 2; c.stroke();
      c.strokeStyle = T.accent; c.lineWidth = 1; c.beginPath(); c.arc(G[0], G[1], 13, 0, 7); c.stroke();
      label(c, "G", G[0] - 15, G[1] - 2, T.accent, "right");
      // rótulos
      if (Math.abs(st.th) > 0.4 || Math.abs(s0.GZ) > 0.005) label(c, `GZ ${fmt(Math.abs(s0.GZ), 2)} m · ${s0.GZ * (st.th || 1) > 0 ? "adrizante" : "escorante"}`, 10, 16, s0.GZ * (st.th || 1) > 0 ? T.ok : T.bad, "left", 13);
      label(c, "Br", 10, h - 14, T.port, "left", 13);
      label(c, "Er", w - 10, h - 14, T.stbd, "right", 13);
      label(c, `${fmt(Math.abs(st.th), 1)}° ${st.th > 0.05 ? "Er" : st.th < -0.05 ? "Br" : ""}`, w - 10, 16, T.ink, "right", 13);
      if (st.capsized) {
        c.fillStyle = T.paper; c.globalAlpha = 0.6; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
        label(c, "VUELCO", w / 2, h * 0.32, T.bad, "center", 30);
        label(c, "Pulsa «Adrizar» o corrige los pesos", w / 2, h * 0.32 + 30, T.ink, "center", 13, false);
      }
    }
    function fmt(v, d) { return Number(v).toFixed(d).replace(".", ","); }

    function drawGZ() {
      if (!GZc || !table) return;
      const { c, w, h } = GZc;
      c.fillStyle = T.sheet; c.fillRect(0, 0, w, h);
      const padL = 34, padR = 8, padT = 10, padB = 22;
      // Brazo con signo «adrizante»: positivo = tiende a devolver el barco hacia 0° en ambas bandas
      const nv = table.map((v, i) => (i < 90 ? -v : v));
      let ymax = 0.1;
      for (const v of nv) ymax = Math.max(ymax, Math.abs(v));
      ymax *= 1.15;
      const X = (deg) => padL + ((deg + 90) / 180) * (w - padL - padR);
      const Y = (v) => padT + (1 - (v + ymax) / (2 * ymax)) * (h - padT - padB);
      c.strokeStyle = T.line; c.lineWidth = 1; c.font = `11px ${T.mono}`; c.fillStyle = T.muted; c.textAlign = "center"; c.textBaseline = "top";
      for (let d = -90; d <= 90; d += 30) { c.beginPath(); c.moveTo(X(d), padT); c.lineTo(X(d), h - padB); c.stroke(); c.fillText(`${d}°`, X(d), h - padB + 4); }
      c.strokeStyle = T.muted; c.beginPath(); c.moveTo(padL, Y(0)); c.lineTo(w - padR, Y(0)); c.stroke();
      c.textAlign = "right"; c.textBaseline = "middle";
      const step = ymax > 0.6 ? 0.2 : ymax > 0.3 ? 0.1 : 0.05;
      for (let v = step; v < ymax; v += step) { c.fillText(fmt(v, 2), padL - 4, Y(v)); c.fillText(fmt(-v, 2), padL - 4, Y(-v)); }
      // tangente en el origen: GZ ≈ GM·θ, que vale GM a 57,3° (1 rad)
      if (info.GM > 0) {
        c.setLineDash([4, 3]); c.strokeStyle = T.warn; c.lineWidth = 1.2;
        const g = Math.min(info.GM, ymax);
        const dd = 57.3 * g / info.GM;
        c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(dd), Y(g)); c.stroke();
        c.beginPath(); c.moveTo(X(57.3), Y(0)); c.lineTo(X(57.3), Y(Math.min(info.GM, ymax))); c.stroke();
        c.setLineDash([]);
        if (info.GM < ymax) { c.fillStyle = T.warn; c.textAlign = "left"; c.fillText("GM", X(57.3) + 4, Y(info.GM)); }
      }
      // curva
      c.strokeStyle = T.accent; c.lineWidth = 2.2; c.beginPath();
      nv.forEach((v, i) => { const x = X(i - 90), y = Y(v); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.stroke();
      // equilibrios
      for (const e of info.eqs) { c.strokeStyle = T.ok; c.lineWidth = 2; c.beginPath(); c.arc(X(e), Y(0), 5, 0, 7); c.stroke(); }
      // punto actual
      const cur = st.th < 0 ? -gzAt(st.th) : gzAt(st.th);
      c.fillStyle = T.ink; c.beginPath(); c.arc(X(st.th), Y(cur), 4.5, 0, 7); c.fill();
      c.fillStyle = T.muted; c.textAlign = "left"; c.textBaseline = "top"; c.font = `11px ${T.body}`;
      c.fillText("GZ (m): + adrizante · − escorante   ← Br · escora · Er →", padL + 4, padT);
    }

    // ---------- Lecturas ----------
    function classify() {
      const gm = info.GM;
      if (gm <= 0) return { t: "Inestable: GM negativo", k: "bad" };
      if (gm < 0.15) return { t: "Barco blando", k: "warn" };
      if (gm >= 0.6) return { t: "Barco duro", k: "acc" };
      return { t: "Estabilidad normal", k: "ok" };
    }
    function setLive() {
      $(".r-th").textContent = `${fmt(Math.abs(st.th), 1)}° ${st.th > 0.05 ? "Er" : st.th < -0.05 ? "Br" : ""}`;
      $(".r-gz").textContent = `${fmt(st.th < 0 ? -gzAt(st.th) : gzAt(st.th), 2)} m`;
    }
    function updateReadouts() {
      setLive();
      const cls = classify();
      $(".r-gm").textContent = `${fmt(info.GM, 2)} m`;
      $(".r-kg").textContent = `${fmt(info.KG, 2)} m`;
      $(".r-km").textContent = `${fmt(info.KM, 2)} m`;
      $(".r-t").textContent = Number.isFinite(info.T) && info.T < 60 ? `${fmt(info.T, 1)} s` : "—";
      const chip = $(".r-chip"); chip.className = `chip ${cls.k} r-chip`; chip.textContent = cls.t;
      const eq = nearestEq(st.th);
      const eqc = $(".r-eq");
      if (eq === null) { eqc.className = "chip bad r-eq"; eqc.textContent = "Sin equilibrio estable → vuelco"; }
      else if (Math.abs(eq) < 0.5) { eqc.className = "chip ok r-eq"; eqc.textContent = "Equilibrio adrizado"; }
      else { eqc.className = "chip warn r-eq"; eqc.textContent = `Escora permanente ${fmt(Math.abs(eq), 0)}° ${eq > 0 ? "Er" : "Br"}`; }
      $(".o-gy").textContent = `KG ${fmt(info.KG, 2)} m`;
      $(".o-gx").textContent = st.gx === 0 ? "en crujía" : `${fmt(Math.abs(st.gx), 2)} m a ${st.gx > 0 ? "Er" : "Br"}`;
      $(".i-gy").value = st.gy; $(".i-gx").value = st.gx;
      $(".m-gzlbl").textContent = info.vanish ? `GZ máx ${fmt(info.maxGZ, 2)} m a ${info.maxAt}° · se anula a ${info.vanish}°` : `GZ máx ${fmt(info.maxGZ, 2)} m a ${info.maxAt}°`;
      // nota explicativa
      const n = [];
      if (info.GM <= 0) n.push("<b>GM negativo:</b> G está por encima de M. Al escorar, peso y empuje forman un par <b>escorante</b>. El barco cae a una banda hasta un ángulo en el que GZ vuelve a ser cero (<b>escora permanente</b>) o, si no lo encuentra, <b>vuelca</b>. Solución: bajar pesos, llenar o vaciar tanques, achicar.");
      else if (info.GM < 0.15) n.push("<b>Barco blando:</b> poco GM, par adrizante pequeño. Balance <b>lento</b> y suave (periodo largo, frecuencia baja), pero con poca reserva: un golpe de mar o subir pesos puede dejarlo sin estabilidad.");
      else if (info.GM >= 0.6) n.push("<b>Barco duro:</b> mucho GM, par adrizante grande. Balance <b>rápido y violento</b> (periodo corto, frecuencia alta): incómodo y fatiga la estructura y la arboladura, pero se mantiene adrizado con fuerza.");
      else n.push("<b>Estabilidad normal:</b> M bastante por encima de G. El par adrizante (Δ·GZ) devuelve el barco a la posición de adrizado.");
      if (st.high) n.push("<b>Pesos altos:</b> suben G y reducen GM. Elevar pesos afecta negativamente a la estabilidad transversal.");
      if (st.low) n.push("<b>Lastre bajo:</b> baja G y aumenta GM (barco más duro).");
      if (st.side) n.push("<b>Peso a una banda:</b> G sale de crujía y el barco escora hasta que C queda en la vertical de G. Compénsalo moviendo pesos a la otra banda.");
      if (st.tank === "medio") n.push("<b>Superficie libre:</b> el líquido del tanque corre hacia la banda baja; equivale a subir G hasta G′ (subida virtual). Tanques <b>llenos o vacíos</b>, nunca a medias.");
      if (st.tank === "lleno") n.push("<b>Tanque lleno:</b> sin superficie libre, el líquido no se mueve: solo cuenta su peso (y está bajo, así que ayuda).");
      if (st.water) n.push("<b>Agua embarcada:</b> peso alto y gran superficie libre a la vez: el GM cae en picado. Achicar cuanto antes.");
      $(".r-note").innerHTML = n.map((x) => `<p>${x}</p>`).join("");
    }

    // ---------- Recalcular tras cambios de carga ----------
    function recompute() {
      analyse();
      if (st.mode === "man") st.th = st.manual;
      if (reduced && st.mode === "din") {
        const eq = nearestEq(st.th);
        if (eq === null) { st.capsized = true; st.th = Math.sign(st.th || 1) * 90; } else { st.th = eq; st.om = 0; }
      }
      if (st.capsized && st.mode === "din" && nearestEq(0) !== null && reduced) st.capsized = false;
      updateReadouts(); draw(); drawGZ(); kick();
    }

    // ---------- Bucle de animación ----------
    let raf = 0, visible = true, last = 0, syncT = 0;
    function needsLoop() {
      if (!visible || document.hidden) return false;
      if (st.tab === "sync") return !reduced;
      if (st.tab === "sim") return st.mode === "din" && !reduced && !st.capsized;
      return false;
    }
    function kick() { if (!raf && needsLoop()) { last = performance.now(); raf = requestAnimationFrame(loop); } }
    function loop(now) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (st.tab === "sim") {
        const steps = 8, h = dt / steps;
        for (let i = 0; i < steps; i++) {
          const gz = gzAt(st.th);
          const acc = -(G_ACC / (K_GYR * K_GYR)) * gz / RAD - 0.45 * st.om; // en grados/s²
          st.om += acc * h; st.th += st.om * h;
          if (Math.abs(st.th) >= 89) { st.capsized = true; st.th = Math.sign(st.th) * 90; st.om = 0; updateReadouts(); ctx.toast("El barco ha volcado"); break; }
        }
        setLive();
        draw(); drawGZ();
      } else if (st.tab === "sync") {
        syncT += dt; drawSync(syncT);
      }
      if (needsLoop()) raf = requestAnimationFrame(loop);
    }
    function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    // ---------- Controles del simulador ----------
    const setToggles = () => {
      $$("[data-tg]").forEach((b) => {
        const k = b.dataset.tg;
        if (k === "tank") { b.setAttribute("aria-pressed", String(st.tank !== "vacio")); b.textContent = `Tanque: ${st.tank === "vacio" ? "vacío" : st.tank === "medio" ? "a medias" : "lleno"}`; }
        else b.setAttribute("aria-pressed", String(!!st[k]));
      });
    };
    $$("[data-tg]").forEach((b) => on(b, "click", () => {
      const k = b.dataset.tg;
      if (k === "tank") st.tank = st.tank === "vacio" ? "medio" : st.tank === "medio" ? "lleno" : "vacio";
      else st[k] = !st[k];
      setToggles(); recompute();
    }));
    on($(".i-gy"), "input", (e) => { st.gy = +e.target.value; recompute(); });
    on($(".i-gx"), "input", (e) => { st.gx = +e.target.value; recompute(); });
    $$("[data-preset]").forEach((b) => on(b, "click", () => {
      const p = b.dataset.preset;
      Object.assign(st, { high: false, low: false, side: false, tank: "vacio", water: false, gx: 0, capsized: false });
      st.gy = solveGyFor(p === "duro" ? 0.9 : p === "blando" ? 0.12 : -0.06);
      st.th = p === "neg" ? 1.5 : 12; st.om = 0;
      if (st.mode === "man") { st.mode = "din"; setMode(); }
      setToggles(); recompute();
    }));
    const setMode = () => {
      $$("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === st.mode)));
      $(".r-manwrap").hidden = st.mode !== "man";
      $(".b-kick").disabled = st.mode === "man" || reduced;
    };
    $$("[data-mode]").forEach((b) => on(b, "click", () => {
      st.mode = b.dataset.mode; st.om = 0;
      if (st.mode === "man") { st.capsized = false; st.manual = Math.round(st.th); $(".i-man").value = st.manual; $(".o-man").textContent = `${st.manual}°`; }
      setMode(); recompute();
    }));
    on($(".i-man"), "input", (e) => { st.manual = +e.target.value; $(".o-man").textContent = `${Math.abs(st.manual)}° ${st.manual > 0 ? "Er" : st.manual < 0 ? "Br" : ""}`; recompute(); });
    on($(".b-kick"), "click", () => { if (st.capsized) return; st.om += (Math.random() < 0.5 ? -1 : 1) * 38; kick(); });
    on($(".b-reset"), "click", () => {
      st.capsized = false; st.om = 0;
      const eq = nearestEq(0); st.th = st.mode === "man" ? 0 : (eq !== null && Math.abs(eq) < 60 ? eq : 0);
      st.manual = 0; $(".i-man").value = 0; $(".o-man").textContent = "0°";
      recompute();
    });

    // arrastrar G
    let dragging = false;
    const toShip = (X, Y) => {
      const th = st.th * RAD, ux = -Math.sin(th), uy = Math.cos(th), hx = Math.cos(th), hy = Math.sin(th);
      const ex = (X - view.cx) / view.s, eu = (view.wy - Y) / view.s + curState.d;
      return [ex * hx + eu * ux, ex * hy + eu * uy];
    };
    const ptr = (e) => { const r = cvA.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    on(cvA, "pointerdown", (e) => {
      if (!curState) return;
      const [X, Y] = ptr(e);
      const th = st.th * RAD, s0 = curState;
      const gX = view.cx + view.s * (s0.G.x * Math.cos(th) + s0.G.y * Math.sin(th));
      const gY = view.wy - view.s * (-s0.G.x * Math.sin(th) + s0.G.y * Math.cos(th) - s0.d);
      if (Math.hypot(X - gX, Y - gY) > 28) return;
      dragging = true; cvA.classList.add("drag"); cvA.setPointerCapture(e.pointerId); e.preventDefault();
    });
    on(cvA, "pointermove", (e) => {
      if (!dragging) return;
      const [X, Y] = ptr(e);
      const [px, py] = toShip(X, Y);
      const s0 = curState;
      // G total deseado → G del barco en rosca (los demás pesos no se mueven)
      const others = s0.M - M_LIGHT;
      const ox = others > 0 ? (s0.G.x * s0.M - st.gx * M_LIGHT) / others : 0;
      const oy = others > 0 ? (s0.G.y * s0.M - st.gy * M_LIGHT) / others : 0;
      st.gx = Math.max(-0.6, Math.min(0.6, (px * s0.M - ox * others) / M_LIGHT));
      st.gy = Math.max(0.15, Math.min(2.6, (py * s0.M - oy * others) / M_LIGHT));
      if (Math.abs(st.gx) < 0.02) st.gx = 0;
      recompute();
    });
    const endDrag = () => { dragging = false; cvA.classList.remove("drag"); };
    on(cvA, "pointerup", endDrag); on(cvA, "pointercancel", endDrag);

    // ---------- Sincronismo ----------
    const sy = { rel: 90, v: 8, tw: 5, tr: 4.5, tp: 2.2, scn: null };
    function syncCalc() {
      const c = 1.56 * sy.tw; // celeridad (m/s) en aguas profundas
      const V = sy.v * 0.5144;
      const cosR = Math.cos(sy.rel * RAD); // rel 0 = mar por la popa, 180 = por la proa
      const den = Math.abs(1 - (V * cosR) / c);
      const te = den < 0.02 ? Infinity : sy.tw / den;
      const H = (tn, z) => { if (!Number.isFinite(te)) return 0; const r = tn / te; return 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2); };
      const exR = Math.sin(sy.rel * RAD), exP = Math.abs(cosR);
      const roll = Math.min(45, 3.2 * exR * H(sy.tr, 0.08) + 0.5);
      const pitch = Math.min(20, 2.2 * exP * H(sy.tp, 0.22) * (1 + V / 12 * Math.max(0, -cosR)) + 0.3);
      const rr = Number.isFinite(te) ? sy.tr / te : 0, rp = Number.isFinite(te) ? sy.tp / te : 0;
      return { te, roll, pitch, syncR: exR > 0.35 && Math.abs(rr - 1) < 0.15, syncP: exP > 0.35 && Math.abs(rp - 1) < 0.15 };
    }
    const relName = (r) => r <= 15 ? "por la popa" : r < 75 ? "por la aleta" : r <= 105 ? "de través" : r < 165 ? "por la amura" : "por la proa";
    function updateSync() {
      const k = syncCalc();
      $(".o-rel").textContent = `${sy.rel}° · ${relName(sy.rel)}`;
      $(".o-v").textContent = `${sy.v} nudos`;
      $(".o-tw").textContent = `${fmt(sy.tw, 1)} s`;
      $(".o-tr").textContent = `${fmt(sy.tr, 1)} s`;
      $(".s-ra").textContent = `±${fmt(k.roll, 0)}°`;
      $(".s-pa").textContent = `±${fmt(k.pitch, 0)}°`;
      const rb = $(".s-rb"), pb = $(".s-pb");
      rb.querySelector("i").style.width = `${Math.min(100, k.roll / 30 * 100)}%`; rb.classList.toggle("hot", k.roll > 12);
      pb.querySelector("i").style.width = `${Math.min(100, k.pitch / 12 * 100)}%`; pb.classList.toggle("hot", k.pitch > 6);
      const te = Number.isFinite(k.te) ? `${fmt(k.te, 1)} s` : "muy largo (el barco acompaña a la ola)";
      let n = `<p>Periodo de encuentro: <b class="mono">${te}</b> · balance propio <span class="mono">${fmt(sy.tr, 1)} s</span> · cabezada propia <span class="mono">2,2 s</span>.</p>`;
      if (k.syncR) n += `<p class="fb-bad">Sincronismo de BALANCE: el periodo de encuentro coincide con el periodo propio de balance; cada ola aumenta la escora y el barco puede volcar. Rómpelo <b>cambiando el rumbo</b> (la velocidad también altera el periodo de encuentro, salvo con la mar justo de través).</p>`;
      if (k.syncP) n += `<p class="fb-bad">Sincronismo de CABEZADA: la proa entra en resonancia con las olas (pantocazos, embarques por proa). Rómpelo <b>reduciendo la velocidad</b> (y, si hace falta, cambiando ligeramente el rumbo).</p>`;
      if (!k.syncR && !k.syncP) n += `<p class="fb-ok">Sin sincronismo: los periodos no coinciden.</p>`;
      if (sy.rel > 75 && sy.rel < 105) n += `<p class="small muted">Con mar de través el balance es máximo y la velocidad apenas cambia el periodo de encuentro: por eso, para el balance, lo eficaz es el rumbo.</p>`;
      $(".s-note").innerHTML = n;
      if (reduced || !needsLoop()) drawSync(0);
    }
    function drawSync(t) {
      if (!S) return;
      const { c, w, h } = S;
      const k = syncCalc();
      c.fillStyle = T.sea; c.fillRect(0, 0, w, h);
      const stackV = w < 520;
      const L = stackV ? { x: 0, y: 0, w, h: h * 0.5 } : { x: 0, y: 0, w: w * 0.5, h };
      const R = stackV ? { x: 0, y: h * 0.5, w, h: h * 0.5 } : { x: w * 0.5, y: 0, w: w * 0.5, h };
      // vista cenital: olas avanzando hacia abajo
      c.save(); c.beginPath(); c.rect(L.x, L.y, L.w, L.h); c.clip();
      const spacing = 34, cel = 1.56 * sy.tw * 3;
      const off = (t * cel) % spacing;
      c.strokeStyle = T.sea2; c.lineWidth = 3;
      for (let y = L.y - spacing + off; y < L.y + L.h + spacing; y += spacing) { c.beginPath(); for (let x = L.x; x <= L.x + L.w; x += 8) { const yy = y + Math.sin(x / 18) * 3; x === L.x ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
      label(c, "↓ la mar avanza", L.x + 8, L.y + 14, T.muted, "left", 11, false);
      const cxb = L.x + L.w / 2, cyb = L.y + L.h / 2, hd = (180 - sy.rel) * RAD;
      c.translate(cxb, cyb); c.rotate(hd);
      const bl = Math.min(L.w, L.h) * 0.32;
      c.fillStyle = T.sheet; c.strokeStyle = T.ink; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, -bl); c.quadraticCurveTo(bl * 0.32, -bl * 0.2, bl * 0.24, bl * 0.6); c.lineTo(-bl * 0.24, bl * 0.6); c.quadraticCurveTo(-bl * 0.32, -bl * 0.2, 0, -bl); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = T.accent; c.beginPath(); c.moveTo(0, -bl - 14); c.lineTo(6, -bl - 4); c.lineTo(-6, -bl - 4); c.closePath(); c.fill();
      c.restore();
      label(c, `Mar ${relName(sy.rel)} · ${sy.v} kn`, L.x + 8, L.y + L.h - 12, T.ink, "left", 12);
      // movimientos
      const ph = Number.isFinite(k.te) ? (2 * Math.PI * t) / k.te : 0;
      const roll = reduced ? k.roll : k.roll * Math.sin(ph);
      const pitch = reduced ? k.pitch : k.pitch * Math.sin(ph + 1.1);
      const half = R.w >= R.h * 1.3 ? "h" : "v";
      const A1 = half === "h" ? { x: R.x, y: R.y, w: R.w / 2, h: R.h } : { x: R.x, y: R.y, w: R.w, h: R.h / 2 };
      const A2 = half === "h" ? { x: R.x + R.w / 2, y: R.y, w: R.w / 2, h: R.h } : { x: R.x, y: R.y + R.h / 2, w: R.w, h: R.h / 2 };
      const scene = (B, title, ang, drawShape) => {
        c.save(); c.beginPath(); c.rect(B.x, B.y, B.w, B.h); c.clip();
        c.fillStyle = T.paper; c.fillRect(B.x, B.y, B.w, B.h);
        const wy = B.y + B.h * 0.66;
        c.fillStyle = T.sea2; c.fillRect(B.x, wy, B.w, B.h);
        c.translate(B.x + B.w / 2, wy); c.rotate(ang * RAD);
        drawShape(Math.min(B.w * 0.28, B.h * 0.42));
        c.restore();
        c.strokeStyle = T.line; c.lineWidth = 1; c.strokeRect(B.x + 0.5, B.y + 0.5, B.w - 1, B.h - 1);
        label(c, title, B.x + 8, B.y + 14, T.muted, "left", 11, false);
      };
      scene(A1, `Balance (desde popa) ±${fmt(k.roll, 0)}°`, roll, (s) => {
        c.fillStyle = T.sheet; c.strokeStyle = T.ink; c.lineWidth = 2;
        c.beginPath(); c.moveTo(-s, -s * 0.55); c.lineTo(s, -s * 0.55); c.quadraticCurveTo(s * 0.95, s * 0.35, 0, s * 0.45); c.quadraticCurveTo(-s * 0.95, s * 0.35, -s, -s * 0.55); c.closePath(); c.fill(); c.stroke();
        c.strokeRect(-s * 0.45, -s * 0.95, s * 0.9, s * 0.4);
      });
      scene(A2, `Cabezada (costado) ±${fmt(k.pitch, 0)}°`, pitch, (s) => {
        c.fillStyle = T.sheet; c.strokeStyle = T.ink; c.lineWidth = 2;
        c.beginPath(); c.moveTo(-s * 1.3, -s * 0.4); c.lineTo(s * 1.45, -s * 0.5); c.quadraticCurveTo(s * 1.1, s * 0.2, s * 0.6, s * 0.3); c.lineTo(-s * 1.3, s * 0.25); c.closePath(); c.fill(); c.stroke();
        c.strokeRect(-s * 0.6, -s * 0.85, s * 0.9, s * 0.4);
      });
    }
    const bindSync = (cls, key, isFloat) => on($(cls), "input", (e) => { sy[key] = isFloat ? +e.target.value : Math.round(+e.target.value); updateSync(); });
    bindSync(".i-rel", "rel"); bindSync(".i-v", "v"); bindSync(".i-tw", "tw", true); bindSync(".i-tr", "tr", true);
    on($(".b-trgm"), "click", () => {
      if (!(info.GM > 0.02)) { ctx.toast("Con GM ≤ 0 no hay periodo de balance: ajusta el simulador"); return; }
      sy.tr = Math.max(2.5, Math.min(9, Math.round(info.T * 10) / 10)); $(".i-tr").value = sy.tr; updateSync();
    });
    const syncInputs = () => { $(".i-rel").value = sy.rel; $(".i-v").value = sy.v; $(".i-tw").value = sy.tw; $(".i-tr").value = sy.tr; };
    on($(".b-scn"), "click", () => {
      const roll = Math.random() < 0.5;
      if (roll) {
        sy.tr = Math.round((3.5 + Math.random() * 3) * 10) / 10; sy.tw = sy.tr; sy.rel = 90; sy.v = 6 + Math.floor(Math.random() * 6);
        $(".s-scn").innerHTML = "<b>Situación:</b> mar de través y el barco balancea cada vez más. ¿Qué cambias?";
      } else {
        sy.tw = Math.round((5 + Math.random() * 2) * 10) / 10; sy.rel = 180; sy.tr = 4.5;
        // velocidad que hace Te ≈ 2,2 s con mar por la proa
        const c = 1.56 * sy.tw; sy.v = Math.min(25, Math.round(((sy.tw / sy.tp - 1) * c) / 0.5144));
        $(".s-scn").innerHTML = "<b>Situación:</b> mar por la proa, la lancha da pantocazos y embarca agua por proa. ¿Qué cambias?";
      }
      sy.scn = { roll, rel0: sy.rel, v0: sy.v };
      syncInputs(); updateSync(); $(".b-chk").disabled = false; $(".s-fb").textContent = "";
    });
    on($(".b-chk"), "click", () => {
      if (!sy.scn) return;
      const k = syncCalc(), fb = $(".s-fb");
      if (sy.v < 3) { fb.className = "small fb-bad s-fb"; fb.textContent = "Has parado el barco: sin arrancada no gobiernas y quedas atravesado a la mar. Mantén al menos velocidad de gobierno."; return; }
      if (k.roll <= 12 && k.pitch <= 6) {
        let why;
        if (sy.scn.roll) why = Math.abs(sy.rel - sy.scn.rel0) >= 15 ? "Correcto: cambiar el rumbo es la forma más adecuada de romper el sincronismo del balance." : "Lo has roto, pero recuerda: para el balance lo más adecuado es cambiar el RUMBO.";
        else why = sy.v < sy.scn.v0 ? "Correcto: reducir la velocidad rompe el sincronismo de la cabezada (y un ligero cambio de rumbo ayuda)." : "Lo has roto, pero ante cabezadas con mar por la proa lo indicado es REDUCIR la velocidad, no aumentarla.";
        fb.className = "small fb-ok s-fb"; fb.textContent = why;
        ctx.award(15, "Sincronismo roto"); sy.scn = null; $(".b-chk").disabled = true;
      } else {
        fb.className = "small fb-bad s-fb";
        fb.textContent = sy.scn.roll ? "Sigue habiendo demasiado balance. Prueba a cambiar el rumbo para que el periodo de encuentro se aleje del periodo de balance." : "Sigue habiendo demasiada cabezada. Prueba a reducir la velocidad.";
      }
    });

    // ---------- Reto: misiones ----------
    const done = ctx.store.get("missions", {});
    const MISSIONS = [
      { id: "blando", t: "Deja el barco «blando»: GM entre 0,08 y 0,30 m y adrizado (escora de equilibrio < 2°).",
        ok: () => info.GM >= 0.08 && info.GM <= 0.3 && nearestEq(0) !== null && Math.abs(nearestEq(0)) < 2 && !st.capsized,
        hint: () => `GM actual ${fmt(info.GM, 2)} m. Sube G (o pon pesos altos) sin pasarte.` },
      { id: "loll", t: "Provoca una escora permanente por GM negativo SIN pesos a una banda y sin volcar.",
        ok: () => info.GM < 0 && !st.side && Math.abs(st.gx) < 0.02 && info.eqs.some((e) => Math.abs(e) > 3) && !st.capsized,
        hint: () => info.GM >= 0 ? `GM actual ${fmt(info.GM, 2)} m: aún es positivo. Sube G un poco más o añade una superficie libre.` : (!info.eqs.length || st.capsized ? "Te has pasado: el barco no encuentra equilibrio y vuelca. Baja G un poco." : "Quita la tripulación de la banda y deja G en crujía.") },
      { id: "adriza", t: "Con la tripulación a estribor, compensa moviendo pesos hasta dejar el barco adrizado (< 1°) con GM > 0,15 m.",
        ok: () => st.side && info.GM > 0.15 && nearestEq(0) !== null && Math.abs(nearestEq(0)) < 1,
        hint: () => !st.side ? "Activa «Tripulación a estribor» primero." : `Escora de equilibrio ${fmt(Math.abs(nearestEq(0) ?? 90), 1)}°. Mueve G hacia babor.` },
    ];
    function renderMissions() {
      const box = $(".m-missions"); box.innerHTML = "";
      for (const m of MISSIONS) {
        const d = document.createElement("div"); d.className = "m-mis";
        d.innerHTML = `<p class="small">${m.t}<br><span class="m-mfb muted"></span></p><div class="row"><span class="chip ${done[m.id] ? "ok" : ""}">${done[m.id] ? "Superada" : "Pendiente"}</span><button class="btn sm">Comprobar</button></div>`;
        on(d.querySelector("button"), "click", () => {
          const fb = d.querySelector(".m-mfb");
          if (m.ok()) {
            fb.className = "m-mfb fb-ok"; fb.textContent = "Conseguido.";
            if (!done[m.id]) { done[m.id] = true; ctx.store.set("missions", done); ctx.award(15, "Misión de estabilidad"); }
            const ch = d.querySelector(".chip"); ch.className = "chip ok"; ch.textContent = "Superada";
          } else { fb.className = "m-mfb fb-bad"; fb.textContent = m.hint(); }
        });
        box.appendChild(d);
      }
    }
    renderMissions();

    // ---------- Reto: test ----------
    let qs = [], qi = 0, score = 0;
    const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    function startQuiz() {
      qs = shuffle(QUIZ).slice(0, 10).map((q) => { const idx = shuffle([0, 1, 2, 3]); return { ...q, o: idx.map((i) => q.o[i]), a: idx.indexOf(q.a) }; });
      qi = 0; score = 0; $(".q-restart").hidden = true; showQ();
    }
    function showQ() {
      const q = qs[qi];
      $(".q-score").textContent = `${score} / 10 · pregunta ${qi + 1}`;
      $(".q-text").textContent = q.q; $(".q-fb").innerHTML = ""; $(".q-next").hidden = true;
      const box = $(".q-opts"); box.innerHTML = "";
      q.o.forEach((txt, i) => {
        const b = document.createElement("button"); b.className = "btn"; b.textContent = `${"abcd"[i]}) ${txt}`;
        b.onclick = () => {
          [...box.children].forEach((x, j) => { x.disabled = true; if (j === q.a) x.classList.add("ok"); });
          if (i === q.a) { score++; ctx.award(10, "Estabilidad: acierto"); $(".q-fb").innerHTML = `<span class="fb-ok">Correcto.</span> ${q.e}`; }
          else { b.classList.add("bad"); $(".q-fb").innerHTML = `<span class="fb-bad">No.</span> ${q.e}`; }
          $(".q-score").textContent = `${score} / 10 · pregunta ${qi + 1}`;
          if (qi < qs.length - 1) $(".q-next").hidden = false; else finishQuiz();
        };
        box.appendChild(b);
      });
    }
    function finishQuiz() {
      const best = Math.max(score, ctx.store.get("best", 0)); ctx.store.set("best", best);
      $(".q-best").textContent = `Mejor resultado: ${best} / 10`;
      $(".q-restart").hidden = false;
      if (score >= 8) { ctx.award(40, "Test de estabilidad superado"); ctx.toast(`Test superado: ${score}/10`); }
      else ctx.toast(`Resultado: ${score}/10. Necesitas 8 para superarlo.`);
    }
    on($(".q-next"), "click", () => { qi++; showQ(); });
    on($(".q-restart"), "click", startQuiz);
    { const b = ctx.store.get("best", 0); if (b) $(".q-best").textContent = `Mejor resultado: ${b} / 10`; }
    startQuiz();

    // ---------- Pestañas ----------
    $$("[data-tab]").forEach((b) => on(b, "click", () => {
      st.tab = b.dataset.tab;
      $$("[data-tab]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $$("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== st.tab));
      stopLoop();
      if (st.tab === "sync") { S = fitCanvas(cvS, cvS.parentElement, cvS.parentElement.clientWidth < 520 ? 1.05 : 0.55, 230, 380); updateSync(); drawSync(syncT); }
      if (st.tab === "sim") { resizeAll(); }
      kick();
    }));

    // ---------- Observadores ----------
    const ro = new ResizeObserver(() => resizeAll());
    ro.observe(wrapA); ro.observe(cvS.parentElement);
    const io = new IntersectionObserver((ents) => { visible = ents.some((e) => e.isIntersecting); if (visible) kick(); else stopLoop(); });
    io.observe(root);
    on(document, "visibilitychange", () => { if (document.hidden) stopLoop(); else kick(); });
    const offTheme = ctx.onTheme ? ctx.onTheme(() => { readTokens(); draw(); drawGZ(); if (S) drawSync(syncT); }) : null;

    // ---------- Inicio ----------
    st.gy = solveGyFor(0.45);
    st.th = reduced ? 0 : 10;
    setToggles(); setMode(); syncInputs();
    analyse(); resizeAll(); updateReadouts(); updateSync(); recompute();

    return () => {
      stopLoop(); ro.disconnect(); io.disconnect();
      if (offTheme) offTheme();
      cleanups.forEach((f) => f());
      root.remove();
    };
  },
};
