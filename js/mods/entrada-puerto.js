// Juego «Entrada a puerto, Región A»: vista cenital, decisiones en cada marca, día o noche.
const ID = "entrada-puerto";

/* ---------- colores físicos ---------- */
const P = { R: "#d42a33", G: "#12904a", Y: "#f3c300", K: "#17191c", W: "#f6f5f0" };
const LC = { W: "#fff7d6", R: "#ff3b30", G: "#3dff7d", Y: "#ffd21a" };

/* ---------- ritmos ---------- */
const on = (c, d) => [c, d], off = (d) => [null, d];
function group(c, n, a, b) { const s = []; for (let i = 0; i < n; i++) s.push(on(c, a), off(b)); return s; }
function pad(s, per) { const t = s.reduce((x, y) => x + y[1], 0); if (per > t) s.push(off(+(per - t).toFixed(3))); return s; }
function fl(c, n, per) { const s = group(c, n, .5, .7); s.pop(); return pad(s, per); }
function litAt(segs, t) { const tot = segs.reduce((x, s) => x + s[1], 0); let x = ((t % tot) + tot) % tot; for (const s of segs) { if (x < s[1]) return s[0]; x -= s[1]; } return null; }
const f21 = (c) => pad([on(c, .5), off(.7), on(c, .5), off(1.6), on(c, .5)], 10);
const LT = {
  bab: [["Fl R 5s", fl(LC.R, 1, 5)], ["Fl(2) R 6s", fl(LC.R, 2, 6)], ["Fl(4) R 12s", fl(LC.R, 4, 12)], ["Q R", group(LC.R, 1, .3, .7)]],
  est: [["Fl G 5s", fl(LC.G, 1, 5)], ["Fl(2) G 6s", fl(LC.G, 2, 6)], ["Fl(3) G 9s", fl(LC.G, 3, 9)], ["Q G", group(LC.G, 1, .3, .7)]],
  pe: [["Fl(2+1) R 10s", f21(LC.R)]],
  pb: [["Fl(2+1) G 10s", f21(LC.G)]],
  N: [["Q", group(LC.W, 1, .3, .7)], ["VQ", group(LC.W, 1, .2, .3)]],
  E: [["Q(3) 10s", pad(group(LC.W, 3, .3, .7), 10)], ["VQ(3) 5s", pad(group(LC.W, 3, .2, .3), 5)]],
  S: [["Q(6)+LFl 15s", pad([...group(LC.W, 6, .3, .7), on(LC.W, 2)], 15)], ["VQ(6)+LFl 10s", pad([...group(LC.W, 6, .2, .3), on(LC.W, 2)], 10)]],
  W: [["Q(9) 15s", pad(group(LC.W, 9, .3, .7), 15)], ["VQ(9) 10s", pad(group(LC.W, 9, .2, .3), 10)]],
  pa: [["Fl(2) 5s", fl(LC.W, 2, 5)]],
  an: [["LFl 10s", [on(LC.W, 2), off(8)]], ["Iso 4s", [on(LC.W, 2), off(2)]], ["Mo(A) 6s", [on(LC.W, .5), off(.5), on(LC.W, 1.5), off(3.5)]], ["Oc 4s", [on(LC.W, 3), off(1)]]],
};
const NAME = { bab: "lateral de babor", est: "lateral de estribor", pe: "canal preferido: principal a estribor", pb: "canal preferido: principal a babor", N: "cardinal Norte", E: "cardinal Este", S: "cardinal Sur", W: "cardinal Oeste", pa: "peligro aislado", an: "aguas navegables" };
const CARD = {
  N: { dir: "Norte", v: [0, -1], look: "negra sobre amarilla, conos ▲▲ hacia arriba", mn: "Los conos apuntan al negro; reloj: las 12 → continua." },
  E: { dir: "Este", v: [1, 0], look: "negra con banda amarilla, conos base con base (huevo)", mn: "Reloj: las 3 → 3 destellos; «huevo» = E." },
  S: { dir: "Sur", v: [0, 1], look: "amarilla sobre negra, conos ▼▼ hacia abajo", mn: "Reloj: las 6 → 6 + un destello largo." },
  W: { dir: "Oeste", v: [-1, 0], look: "amarilla con banda negra, conos vértice con vértice (cintura)", mn: "Reloj: las 9 → 9 destellos; «copa/cintura» = W." },
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => a + Math.random() * (b - a);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const PORTS = ["Puerto Deportivo", "Marina del Sol", "Dársena Pesquera", "Club Náutico", "Marina Norte"];

/* ---------- construcción de ruta ---------- */
const COAST = -1500, BF = { x: 0, y: -2200 }, PAIRS = [-1620, -1800, -1980], HALF_W = 80, HALF_S = 115;
function buildWorld(dirMode) {
  const exiting = dirMode === "salida";
  const marks = [], shoals = [], route = [];
  const mk = (t, x, y, num) => { const l = pick(LT[t]); const m = { t, x, y, num, nt: l[0], segs: l[1], ph: Math.random() * 20 }; marks.push(m); return m; };
  const node = (x, y, ev) => route.push(ev ? { x, y, ev } : { x, y });
  const prefType = pick(["pe", "pb"]); // pe: principal a estribor (rama derecha)
  const principalSide = prefType === "pe" ? 1 : -1;
  const branch = (side) => { const d = { x: side * Math.SQRT1_2, y: -Math.SQRT1_2 }; return { d, end: { x: BF.x + d.x * 537, y: BF.y + d.y * 537 }, basin: { x: BF.x + side * 470, y: BF.y - 470 } }; };
  const names = shuffle(PORTS);
  const basins = [-1, 1].map((s, i) => ({ ...branch(s).basin, side: s, name: names[i], principal: s === principalSide }));
  // marcas laterales del canal recto (numeración: pares rojas, impares verdes, en el sentido convencional)
  PAIRS.forEach((y, i) => { mk("bab", -70, y, String(2 * i + 2)); mk("est", 70, y, String(2 * i + 1)); });
  const prefMark = mk(prefType, 0, BF.y - 122);
  shoals.push({ x: 0, y: BF.y - 165, rx: 38, ry: 46, rock: false });
  // laterales de cada rama
  const branchPairs = [-1, 1].map((s) => {
    const b = branch(s), c = { x: BF.x + b.d.x * 330, y: BF.y + b.d.y * 330 }, left = { x: b.d.y, y: -b.d.x };
    const red = mk("bab", c.x + left.x * 70, c.y + left.y * 70, "8"), green = mk("est", c.x - left.x * 70, c.y - left.y * 70, "7");
    return { s, b, c, red, green };
  });
  // aguas navegables en la recalada y bajos costeros
  const MD = { x: 0, y: COAST + 220 };
  const safe = mk("an", MD.x, MD.y);
  shoals.push({ x: -240, y: COAST + 110, rx: 120, ry: 70, rock: true }, { x: 250, y: COAST + 120, rx: 120, ry: 70, rock: true });
  // cardinal E/W en aproximación (rumbo N-S)
  const cEW = pick(["E", "W"]), MC = { x: rnd(-70, 70), y: -820 };
  const cMark = mk(cEW, MC.x, MC.y);
  const shC = { x: MC.x - CARD[cEW].v[0] * 95, y: MC.y, rx: 75, ry: 150, rock: true }; shoals.push(shC);
  const trackC = MC.x + CARD[cEW].v[0] * 60;
  // peligro aislado
  const MB = { x: rnd(-60, 60), y: -330 }, bSide = pick([-1, 1]);
  const pa = mk("pa", MB.x, MB.y);
  shoals.push({ x: MB.x, y: MB.y, rx: 30, ry: 26, rock: true, isolated: true });
  const trackB = MB.x + bSide * 80;
  // cardinal N/S (rumbo E-W)
  const cNS = pick(["N", "S"]), MA = { x: -420, y: 170 };
  const aMark = mk(cNS, MA.x, MA.y);
  const shA = { x: MA.x, y: MA.y - CARD[cNS].v[1] * 95, rx: 160, ry: 70, rock: true }; shoals.push(shA);
  const trackA = MA.y + CARD[cNS].v[1] * 60;

  /* --- eventos --- */
  const latEv = (m, passX, passY, ex) => {
    const red = m.t === "bab", corr = red !== ex ? "babor" : "estribor";
    const out = { x: m.x - passX, y: m.y - passY }, L = Math.hypot(out.x, out.y);
    const bad = { x: m.x + out.x / L * 36, y: m.y + out.y / L * 36, kind: "varada" };
    return { kind: "lat", mark: m, q: `Marca ${red ? "roja" : "verde"} por la proa (resaltada). Vas ${ex ? "saliendo de puerto" : "entrando en puerto"}. ¿Por qué banda la dejas?`,
      opts: [{ k: "babor", l: "Dejarla por babor" }, { k: "estribor", l: "Dejarla por estribor" }], correct: corr, bad: { [corr === "babor" ? "estribor" : "babor"]: bad },
      why: `${red ? `Roja, ${m.num ? "número par, " : ""}tope cilíndrico: lateral de babor` : `Verde, ${m.num ? "número impar, " : ""}tope cónico: lateral de estribor`} (luz ${m.nt}). ${ex ? `Saliendo vas contra el sentido convencional del balizamiento: los colores se invierten y la ${red ? "roja queda por estribor" : "verde queda por babor"}.` : `Entrando desde la mar (sentido convencional): ${red ? "roja a babor" : "verde a estribor"}.`}` };
  };
  const cardEv = (m, shoal) => {
    const C = CARD[m.t], bad = {};
    for (const k of ["N", "E", "S", "W"]) if (k !== m.t) { const v = CARD[k].v; bad[k] = { x: shoal.x + v[0] * shoal.rx * .45, y: shoal.y + v[1] * shoal.ry * .45, kind: "varada" }; }
    return { kind: "card", mark: m, q: "Marca cardinal por la proa. ¿Por qué lado de la marca pasas?",
      opts: ["N", "E", "S", "W"].map((k) => ({ k, l: `Pasar al ${CARD[k].dir}` })), correct: m.t, bad,
      why: `Cardinal ${C.dir}: ${C.look}; luz blanca ${m.nt}. Las aguas seguras están al ${C.dir} de la marca, así que pasas por su ${C.dir}. ${C.mn}` };
  };
  const paEv = (m) => ({ kind: "pa", mark: m, q: "Marca por la proa. ¿Cómo la pasas?",
    opts: shuffle([{ k: "ok", l: "Por cualquier lado, con resguardo, tras consultar la carta" }, { k: "near", l: "Pegado a ella: el peligro está lejos de la marca" }, { k: "card", l: "Rozándola por su Norte: es una cardinal Norte" }]), correct: "ok",
    bad: { near: { x: m.x + 4, y: m.y + 6, kind: "choque" }, card: { x: m.x - 6, y: m.y - 2, kind: "choque" } },
    why: `Peligro aislado: negra con bandas rojas, dos esferas negras, luz blanca ${m.nt}. Está encima o junto a un peligro rodeado de aguas navegables: puedes pasar por cualquier lado, pero lejos; su tamaño y la distancia segura los da la carta.` });
  const anEv = (m, ex) => ({ kind: "an", mark: m, q: `Marca de ${ex ? "la recalada" : "recalada"} por la proa. ¿Qué haces?`,
    opts: shuffle([{ k: "ok", l: "Pasar por cualquier lado: aguas seguras a su alrededor" }, { k: "pel", l: "Señala un peligro: abrirse mucho al Oeste" }, { k: "esp", l: "Es especial: rodear su zona por el Este" }]), correct: "ok",
    bad: { pel: { x: -235, y: COAST + 112, kind: "varada" }, esp: { x: 245, y: COAST + 120, kind: "varada" } },
    why: `Aguas navegables: franjas verticales rojas y blancas, esfera roja de tope, luz blanca ${m.nt}. Indica aguas seguras alrededor (recalada, eje de canal): se pasa por cualquier lado. No señala ningún peligro.` });
  const bifEv = (dest) => {
    const corr = dest.side === 1 ? "er" : "br";
    const m = prefMark;
    return { kind: "bif", mark: m, q: `Bifurcación. Tu destino, ${dest.name}, está en el canal ${dest.principal ? "principal" : "secundario"}. ¿Qué haces?`,
      opts: [{ k: "er", l: "Seguir a estribor: dejar la marca por babor" }, { k: "br", l: "Seguir a babor: dejar la marca por estribor" }], correct: corr,
      bad: { [corr === "er" ? "br" : "er"]: { x: 0, y: BF.y - 170, kind: "varada" } },
      why: `${m.t === "pe" ? "Roja con banda verde, cilíndrica, luz roja Fl(2+1): el canal principal sigue a estribor" : "Verde con banda roja, cónica, luz verde Fl(2+1): el canal principal sigue a babor"}. Manda el color del cuerpo: por el canal principal la dejas como una lateral normal (${m.t === "pe" ? "por babor" : "por estribor"}); por el secundario, al revés. ${dest.name} está en el ${dest.principal ? "principal" : "secundario"} → ${corr === "er" ? "sigue a estribor" : "sigue a babor"}.` };
  };

  const askPairs = shuffle([0, 1, 2]).slice(0, 2).sort();
  if (!exiting) {
    const dest = pick(basins), bp = branchPairs.find((p) => p.s === dest.side);
    node(-860, trackA);
    node(MA.x - 170, trackA, cardEv(aMark, shA));
    node(MA.x, trackA); node(MA.x + 200, trackA);
    node(trackB, MB.y + 170, paEv(pa)); node(trackB, MB.y); node(trackB, MB.y - 120);
    node(trackC, MC.y + 200, cardEv(cMark, shC)); node(trackC, MC.y); node(trackC, MC.y - 120);
    node(35, MD.y + 170, anEv(safe, false)); node(35, MD.y); node(0, COAST + 60);
    PAIRS.forEach((y, i) => {
      if (askPairs.includes(i)) { const m = pick(marks.filter((q) => q.y === y && (q.t === "bab" || q.t === "est"))); node(0, y + 150, latEv(m, 0, y, false)); }
      node(0, y);
    });
    node(0, BF.y + 150, bifEv(dest)); node(BF.x, BF.y);
    const d = bp.b.d;
    node(BF.x + d.x * 200, BF.y + d.y * 200, latEv(pick([bp.red, bp.green]), bp.c.x, bp.c.y, false));
    node(bp.c.x, bp.c.y); node(bp.b.end.x, bp.b.end.y); node(dest.x, dest.y);
    return { marks, shoals, route, basins, exiting, startH: 0, goal: `Entra en ${dest.name}` };
  }
  // salida: de la dársena a mar abierta
  const from = pick(basins), bp = branchPairs.find((p) => p.s === from.side), d = bp.b.d;
  node(from.x, from.y); node(bp.b.end.x, bp.b.end.y);
  node(BF.x + d.x * 460, BF.y + d.y * 460, latEv(pick([bp.red, bp.green]), bp.c.x, bp.c.y, true));
  node(bp.c.x, bp.c.y); node(BF.x, BF.y);
  [...PAIRS].reverse().forEach((y) => {
    const i = PAIRS.indexOf(y);
    if (askPairs.includes(i)) { const m = pick(marks.filter((q) => q.y === y && (q.t === "bab" || q.t === "est"))); node(0, y - 150, latEv(m, 0, y, true)); }
    node(0, y);
  });
  node(0, COAST + 20); node(35, MD.y - 140, anEv(safe, true)); node(35, MD.y); node(35, MD.y + 120);
  node(trackC, MC.y - 170, cardEv(cMark, shC)); node(trackC, MC.y); node(trackC, MC.y + 120);
  node(trackB, MB.y - 170, paEv(pa)); node(trackB, MB.y); node(trackB, MB.y + 200); node(trackB + 150, MB.y + 420);
  return { marks, shoals, route, basins, exiting, startH: Math.PI / 2, goal: `Sal de ${from.name} a mar abierta` };
}

/* ---------- estilos ---------- */
const CSS = `
.m-${ID} { display:flex; flex-direction:column; gap:.8rem; }
.m-${ID} .stage { aspect-ratio: 4/3; max-height: 72vh; touch-action: manipulation; }
@media (min-width: 900px) { .m-${ID} .stage { aspect-ratio: 16/9; } }
@media (max-width: 520px) { .m-${ID} .stage { aspect-ratio: 1/1; } }
.m-${ID} .opts { display:grid; gap:.45rem; grid-template-columns:repeat(auto-fit, minmax(min(100%,220px),1fr)); }
.m-${ID} .opts .btn { justify-content:flex-start; text-align:left; }
.m-${ID} .opts .btn.ok { border-color:var(--ok); color:var(--ok); }
.m-${ID} .opts .btn.bad { border-color:var(--bad); color:var(--bad); }
.m-${ID} .hud { display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; }
`;

/* ---------- utilidades de color ---------- */
function hex(c) { c = c.trim(); if (c.startsWith("#")) { if (c.length === 4) c = "#" + [...c.slice(1)].map((x) => x + x).join(""); return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); } const m = c.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : [128, 128, 128]; }
function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; }

export default {
  id: ID,
  tema: 5,
  title: "Entrada a puerto, Región A",
  icon: "⌂",
  desc: "Gobierna una embarcación desde la mar hasta puerto (o al revés), de día o solo con luces, decidiendo en cada marca por dónde pasar.",
  mount(root, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) { const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = CSS; document.head.appendChild(s); }
    const wrap = document.createElement("div"); wrap.className = `m-${ID}`; root.appendChild(wrap);
    wrap.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <div><div class="eyebrow">Tema 5 · Balizamiento en la práctica</div><h3>Entrada a puerto, Región A</h3></div>
        <div class="seg" role="group" aria-label="Día o noche"><button data-dn="day">Día</button><button data-dn="night">Noche</button></div>
      </div>
      <div class="stage" data-r="stage"><canvas data-r="cv" aria-label="Carta con la embarcación y las marcas"></canvas></div>
      <div class="hud" data-r="hud"></div>
      <div class="panel stack" data-r="panel" aria-live="polite"></div>`;
    const R = (n) => wrap.querySelector(`[data-r="${n}"]`);
    const cv = R("cv"), g = cv.getContext("2d"), panel = R("panel"), hud = R("hud"), stage = R("stage");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SPEED = reduce ? 420 : 110;

    let night = ctx.store.get("night", false);
    let routeMode = ctx.store.get("route", "aleatoria");
    let world = null, boat = null, idx = 0, phase = "intro", curEv = null, wrongT = null, crash = null, fails = 0, okCount = 0, trail = [];
    let tok = {};
    function readTokens() {
      const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim() || "#888";
      tok = { sea: v("--sea"), sea2: v("--sea-2"), sheet: v("--sheet"), ink: v("--ink"), muted: v("--muted"), y: v("--buoy-y"), accent: v("--accent"), bad: v("--bad"), ok: v("--ok"), night: v("--night"), line: v("--line"), mono: v("--f-mono"), body: v("--f-body") };
      tok.land = mix(tok.sheet, tok.y, .28); tok.sand = mix(tok.sea2, tok.y, .45);
    }
    readTokens();
    const unTheme = ctx.onTheme ? ctx.onTheme(() => readTokens()) : null;
    const mq = matchMedia("(prefers-color-scheme: dark)"); const mqf = () => readTokens(); mq.addEventListener?.("change", mqf);

    function segsDN() { wrap.querySelectorAll("[data-dn]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.dn === "night") === night))); stage.classList.toggle("night", night); }
    wrap.querySelectorAll("[data-dn]").forEach((b) => b.onclick = () => { night = b.dataset.dn === "night"; ctx.store.set("night", night); segsDN(); hudRender(); });
    segsDN();

    /* ---------- lienzo ---------- */
    let W = 1, H = 1, dpr = 1;
    function resize() { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(1, r.width); H = Math.max(1, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ro = new ResizeObserver(resize); ro.observe(cv); resize();

    function newGame() {
      const mode = routeMode === "aleatoria" ? (Math.random() < .7 ? "entrada" : "salida") : routeMode;
      world = buildWorld(mode);
      const s = world.route[0];
      boat = { x: s.x, y: s.y, h: world.startH, shake: 0 };
      idx = 1; phase = "move"; curEv = null; wrongT = null; crash = null; fails = 0; okCount = 0; trail = [];
      hudRender(); panelMove();
    }
    const totalDec = () => world.route.filter((n) => n.ev).length;
    function hudRender() {
      if (!world) { hud.innerHTML = ""; return; }
      hud.innerHTML = `<span class="chip acc">${world.exiting ? "Saliendo de puerto" : "Entrando (sentido convencional)"}</span><span class="chip">${night ? "Noche: solo luces" : "Día"}</span><span class="chip">Decisiones ${okCount + fails}/${totalDec()}</span><span class="chip ${fails ? "bad" : "ok"}">Fallos ${fails}</span>`;
    }
    function panelIntro() {
      panel.innerHTML = `
        <p><strong>Sentido convencional del balizamiento:</strong> el de un buque que llega desde la mar a un puerto, río o estuario. En la Región A, entrando: <span style="color:var(--port);font-weight:700">rojo a babor</span>, <span style="color:var(--stbd);font-weight:700">verde a estribor</span>. Saliendo, al revés.</p>
        <p class="small muted">Te encontrarás cardinales, un peligro aislado, la marca de recalada (aguas navegables), laterales y una bifurcación con marca de canal preferido. De noche solo verás las luces.</p>
        <div class="row"><span class="small muted">Ruta:</span><div class="seg" role="group" aria-label="Ruta">${[["aleatoria", "Aleatoria"], ["entrada", "Entrada"], ["salida", "Salida"]].map(([v, t]) => `<button data-rm="${v}" aria-pressed="${v === routeMode}">${t}</button>`).join("")}</div>
        <button class="btn primary" data-a="go">Zarpar</button></div>`;
      panel.querySelectorAll("[data-rm]").forEach((b) => b.onclick = () => { routeMode = b.dataset.rm; ctx.store.set("route", routeMode); panelIntro(); });
      panel.querySelector('[data-a="go"]').onclick = newGame;
    }
    function panelMove() { panel.innerHTML = `<p><strong>${world.goal}.</strong> <span class="muted">Navegando… la embarcación se detendrá ante cada marca.</span></p>`; }
    function panelAsk(ev) {
      panel.innerHTML = `<p><strong>${ev.q}</strong></p><div class="opts">${ev.opts.map((o) => `<button class="btn" data-k="${o.k}">${o.l}</button>`).join("")}</div>`;
      panel.querySelectorAll(".opts .btn").forEach((b) => b.onclick = () => answer(ev, b.dataset.k, b));
    }
    function answer(ev, k, btn) {
      panel.querySelectorAll(".opts .btn").forEach((x) => { x.disabled = true; if (x.dataset.k === ev.correct) x.classList.add("ok"); else if (x === btn) x.classList.add("bad"); });
      if (k === ev.correct) {
        okCount++; ctx.award(10, "Marca bien pasada"); hudRender();
        panel.insertAdjacentHTML("beforeend", `<p class="fb-ok">Correcto.</p><p class="small">${ev.why}</p>`);
        phase = "move";
      } else {
        fails++; hudRender();
        const t = ev.bad[k] || Object.values(ev.bad)[0];
        wrongT = { ...t, ev, from: { x: boat.x, y: boat.y } }; phase = "wrong";
      }
    }
    function panelCrash() {
      const ev = wrongT.ev;
      panel.querySelector(".opts")?.insertAdjacentHTML("afterend", `<p class="fb-bad">${wrongT.kind === "choque" ? "¡Choque contra la piedra!" : "¡Varada!"}</p><p class="small">${ev.why}</p><button class="btn primary sm" data-a="retry">Retomar el rumbo correcto</button>`);
      panel.querySelector('[data-a="retry"]').onclick = () => { if (!wrongT) return; boat.x = wrongT.from.x; boat.y = wrongT.from.y; crash = null; wrongT = null; trail = []; phase = "move"; panelMove(); };
    }
    function finish() {
      phase = "done";
      const perfect = fails === 0;
      if (perfect) { ctx.award(50, "Puerto tomado sin fallos"); ctx.badge("capitan-de-puerto"); ctx.toast("Insignia: Capitán de puerto"); }
      panel.innerHTML = `<h3>${world.exiting ? "En mar abierta" : "Amarrado"}: ${okCount}/${totalDec()} decisiones correctas</h3>
        <p>${perfect ? "Sin un solo fallo. Ruta limpia." : `Fallos: ${fails}. En el examen, más de 2 fallos de balizamiento suspenden: repite hasta hacerla limpia.`}</p>
        <div class="row"><button class="btn primary" data-a="again">Nueva ruta</button><button class="btn" data-a="menu">Cambiar ruta</button></div>`;
      panel.querySelector('[data-a="again"]').onclick = newGame;
      panel.querySelector('[data-a="menu"]').onclick = () => { world = null; phase = "intro"; hudRender(); panelIntro(); };
    }

    /* ---------- simulación ---------- */
    function moveTo(tx, ty, dt) {
      const dx = tx - boat.x, dy = ty - boat.y, d = Math.hypot(dx, dy), stepL = SPEED * dt;
      if (d > 0.01) { const th = Math.atan2(dy, dx); let dh = th - boat.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); boat.h += dh * Math.min(1, dt * (reduce ? 20 : 5)); }
      if (d <= stepL) { boat.x = tx; boat.y = ty; return true; }
      boat.x += dx / d * stepL; boat.y += dy / d * stepL; return false;
    }
    function step(dt) {
      if (!world) return;
      if (phase === "move") {
        const n = world.route[idx];
        if (!n) { finish(); return; }
        if (moveTo(n.x, n.y, dt)) {
          idx++;
          if (n.ev) { curEv = n.ev; phase = "ask"; panelAsk(n.ev); }
          else if (idx >= world.route.length) finish();
        }
      } else if (phase === "wrong") {
        if (moveTo(wrongT.x, wrongT.y, dt * .8)) { phase = "crash"; crash = { t: 0 }; panelCrash(); }
      } else if (phase === "crash") crash.t += dt;
      if (phase === "move" || phase === "wrong") { trail.push([boat.x, boat.y]); if (trail.length > 70) trail.shift(); }
    }

    /* ---------- dibujo ---------- */
    let cam = { x: 0, y: 0 }, k = 1;
    const SX = (x) => (x - cam.x) * k + W / 2, SY = (y) => (y - cam.y) * k + H / 2;
    function tri(cx, y0, up, s) { g.moveTo(cx - 4.5 * s, y0); g.lineTo(cx + 4.5 * s, y0); g.lineTo(cx, y0 + (up ? -7 : 7) * s); g.closePath(); }
    const BANDS = { bab: [P.R], est: [P.G], pe: [P.R, P.G, P.R], pb: [P.G, P.R, P.G], N: [P.K, P.Y], S: [P.Y, P.K], E: [P.K, P.Y, P.K], W: [P.Y, P.K, P.Y], pa: [P.K, P.R, P.K], an: "RW" };
    function drawIcon(m, x, y, s) {
      // icono de perfil (símbolo de carta) anclado en (x,y): punto de posición en la base
      const shape = (m.t === "bab" || m.t === "pe") ? "can" : (m.t === "est" || m.t === "pb") ? "cone" : m.t === "an" ? "sphere" : "pillar";
      g.save();
      g.beginPath();
      if (shape === "can") g.rect(x - 5 * s, y - 13 * s, 10 * s, 13 * s);
      else if (shape === "cone") { g.moveTo(x - 6 * s, y); g.lineTo(x + 6 * s, y); g.lineTo(x + .8 * s, y - 14 * s); g.lineTo(x - .8 * s, y - 14 * s); g.closePath(); }
      else if (shape === "sphere") g.arc(x, y - 7 * s, 7 * s, 0, Math.PI * 2);
      else { g.moveTo(x - 7 * s, y); g.lineTo(x + 7 * s, y); g.lineTo(x + 3 * s, y - 18 * s); g.lineTo(x - 3 * s, y - 18 * s); g.closePath(); }
      const top = shape === "can" ? y - 13 * s : shape === "cone" ? y - 14 * s : shape === "sphere" ? y - 14 * s : y - 18 * s;
      g.save(); g.clip();
      const b = BANDS[m.t];
      if (b === "RW") { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? P.W : P.R; g.fillRect(x - 7 * s + i * 14 * s / 6, top, 14 * s / 6 + .5, y - top); } }
      else { const h = (y - top) / b.length; b.forEach((c, i) => { g.fillStyle = c; g.fillRect(x - 8 * s, top + i * h, 16 * s, h + .5); }); }
      g.restore();
      g.lineWidth = 1; g.strokeStyle = "rgba(0,0,0,.6)"; g.stroke();
      // mástil y tope
      g.beginPath(); g.moveTo(x, top); g.lineTo(x, top - 6 * s); g.stroke();
      const t0 = top - 6 * s;
      g.beginPath();
      switch (m.t) {
        case "bab": case "pe": g.fillStyle = P.R; g.rect(x - 3.5 * s, t0 - 7 * s, 7 * s, 7 * s); g.fill(); g.stroke(); break;
        case "est": case "pb": g.fillStyle = P.G; tri(x, t0, true, s); g.fill(); g.stroke(); break;
        case "N": g.fillStyle = P.K; tri(x, t0, true, s); tri(x, t0 - 8 * s, true, s); g.fill(); break;
        case "S": g.fillStyle = P.K; tri(x, t0 - 7 * s, false, s); tri(x, t0 - 15 * s, false, s); g.fill(); break;
        case "E": g.fillStyle = P.K; tri(x, t0 - 7 * s, false, s); tri(x, t0 - 7.5 * s, true, s); g.fill(); break;
        case "W": g.fillStyle = P.K; tri(x, t0, true, s); tri(x, t0 - 15 * s, false, s); g.fill(); break;
        case "pa": g.fillStyle = P.K; g.arc(x, t0 - 3.5 * s, 3.5 * s, 0, 7); g.moveTo(x + 3.5 * s, t0 - 11 * s); g.arc(x, t0 - 11 * s, 3.5 * s, 0, 7); g.fill(); break;
        case "an": g.fillStyle = P.R; g.arc(x, t0 - 4 * s, 4 * s, 0, 7); g.fill(); g.stroke(); break;
      }
      // punto de posición
      g.beginPath(); g.fillStyle = tok.ink; g.arc(x, y + 2 * s, 1.8 * s, 0, 7); g.fill();
      if (m.num) { g.fillStyle = tok.ink; g.font = `700 ${Math.round(10 * s)}px ${tok.mono}`; g.textAlign = "left"; g.fillText(m.num, x + 8 * s, y - 2 * s); }
      g.restore();
    }
    function drawLight(m, x, y, t) {
      const c = litAt(m.segs, t + m.ph);
      if (!c) { if (!night) return; g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(x, y, 1.5, 0, 7); g.fill(); return; }
      const r = night ? 22 : 10, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "#fff"); gr.addColorStop(.18, c); gr.addColorStop(.5, c + "66"); gr.addColorStop(1, c + "00");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    function draw(now) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = now / 1000;
      if (!world) {
        // portada: carta de fondo simple
        g.fillStyle = night ? tok.night : tok.sea; g.fillRect(0, 0, W, H);
        g.fillStyle = night ? "rgba(255,255,255,.5)" : tok.muted; g.font = `600 15px ${tok.body}`; g.textAlign = "center";
        g.fillText("Elige ruta y pulsa «Zarpar»", W / 2, H / 2);
        return;
      }
      k = Math.min(W, H) / 560;
      const look = 100;
      cam.x = boat.x + Math.cos(boat.h) * look; cam.y = boat.y + Math.sin(boat.h) * look;
      let shx = 0, shy = 0;
      if (crash && crash.t < .8 && !reduce) { shx = Math.sin(crash.t * 60) * 5 * (1 - crash.t / .8); shy = Math.cos(crash.t * 47) * 3 * (1 - crash.t / .8); }
      g.setTransform(dpr, 0, 0, dpr, dpr * shx, dpr * shy);
      if (night) { g.fillStyle = tok.night; g.fillRect(-10, -10, W + 20, H + 20); }
      else {
        g.fillStyle = tok.land; g.fillRect(-10, -10, W + 20, H + 20);
        // mar abierta
        g.fillStyle = tok.sea; const yc = SY(COAST); if (yc < H + 10) g.fillRect(-10, Math.max(-10, yc), W + 20, H + 20 - Math.max(-10, yc));
        // canal y dársenas
        const lines = [[[0, COAST + 60], [BF.x, BF.y]], ...world.basins.map((b) => [[BF.x, BF.y], [BF.x + b.side * 380, BF.y - 380], [b.x, b.y]])];
        g.lineJoin = "round"; g.lineCap = "round";
        for (const [w, col] of [[HALF_S * 2, tok.sea2], [HALF_W * 2, tok.sea]]) {
          g.strokeStyle = col; g.lineWidth = w * k;
          for (const L of lines) { g.beginPath(); L.forEach(([x, y], i) => i ? g.lineTo(SX(x), SY(y)) : g.moveTo(SX(x), SY(y))); g.stroke(); }
          g.fillStyle = col; for (const b of world.basins) { g.beginPath(); g.arc(SX(b.x), SY(b.y), (w === HALF_S * 2 ? 175 : 145) * k, 0, 7); g.fill(); }
        }
        // bajos
        for (const s of world.shoals) {
          g.save(); g.translate(SX(s.x), SY(s.y));
          g.fillStyle = tok.sea2; g.beginPath(); g.ellipse(0, 0, (s.rx + 22) * k, (s.ry + 22) * k, 0, 0, 7); g.fill();
          g.fillStyle = tok.sand; g.beginPath(); g.ellipse(0, 0, s.rx * k, s.ry * k, 0, 0, 7); g.fill();
          g.setLineDash([4, 3]); g.strokeStyle = tok.muted; g.lineWidth = 1; g.stroke(); g.setLineDash([]);
          if (s.rock) { g.strokeStyle = tok.ink; g.lineWidth = 1.4; const n = s.isolated ? 1 : 3; for (let i = 0; i < n; i++) { const a = i * 2.1, r = n === 1 ? 0 : s.rx * .4 * k; const px = Math.cos(a) * r, py = Math.sin(a) * r * .5; g.beginPath(); g.moveTo(px - 5, py); g.lineTo(px + 5, py); g.moveTo(px, py - 5); g.lineTo(px, py + 5); g.stroke(); } }
          g.restore();
        }
        // nombres de dársenas
        g.fillStyle = tok.ink; g.font = `600 ${Math.max(11, 13 * k)}px ${tok.body}`; g.textAlign = "center";
        for (const b of world.basins) g.fillText(b.name, SX(b.x), SY(b.y));
        g.fillStyle = tok.muted; g.font = `600 ${Math.max(10, 12 * k)}px ${tok.body}`;
        if (Math.abs(SY(COAST - 60)) < H * 2) g.fillText("Bocana", SX(170), SY(COAST - 40));
      }
      // trayectoria
      if (trail.length > 1) {
        g.strokeStyle = night ? "rgba(255,255,255,.25)" : mix(tok.sea, tok.sheet, .7); g.lineWidth = 3; g.lineCap = "round";
        g.beginPath(); trail.forEach(([x, y], i) => i ? g.lineTo(SX(x), SY(y)) : g.moveTo(SX(x), SY(y))); g.stroke();
      }
      // marcas
      const s = Math.max(.9, Math.min(1.4, k * 1.6));
      for (const m of world.marks) {
        const x = SX(m.x), y = SY(m.y);
        if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
        if (!night) drawIcon(m, x, y, s);
        const ly = night ? y : y - (m.t === "bab" || m.t === "pe" ? 13 : m.t === "est" || m.t === "pb" ? 14 : m.t === "an" ? 14 : 18) * s - 3;
        drawLight(m, x, ly, t);
      }
      // marca resaltada
      if (phase === "ask" || phase === "wrong" || phase === "crash") {
        const m = (curEv || wrongT?.ev)?.mark; if (m) {
          const x = SX(m.x), y = SY(m.y) - (night ? 0 : 10 * s), pr = 26 + (reduce ? 0 : Math.sin(t * 4) * 3);
          g.strokeStyle = night ? "rgba(255,255,255,.55)" : tok.accent; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.arc(x, y, pr, 0, 7); g.stroke(); g.setLineDash([]);
        }
      }
      // embarcación
      const bx = SX(boat.x), by = SY(boat.y), L = 13;
      g.save(); g.translate(bx, by); g.rotate(boat.h);
      g.beginPath(); g.moveTo(L, 0); g.quadraticCurveTo(L * .2, -L * .55, -L * .8, -L * .42); g.lineTo(-L * .8, L * .42); g.quadraticCurveTo(L * .2, L * .55, L, 0); g.closePath();
      g.fillStyle = night ? "#1d2832" : tok.sheet; g.fill(); g.strokeStyle = night ? "rgba(255,255,255,.3)" : tok.ink; g.lineWidth = 1.5; g.stroke();
      if (night) {
        g.fillStyle = "#ff3b30"; g.beginPath(); g.arc(L * .15, -L * .42, 2.2, 0, 7); g.fill();
        g.fillStyle = "#3dff7d"; g.beginPath(); g.arc(L * .15, L * .42, 2.2, 0, 7); g.fill();
        g.fillStyle = "#fff"; g.beginPath(); g.arc(L * .35, 0, 1.8, 0, 7); g.fill();
      } else { g.fillStyle = tok.accent; g.beginPath(); g.arc(-L * .2, 0, 2.5, 0, 7); g.fill(); }
      g.restore();
      // varada / choque
      if (crash) {
        const a = Math.min(1, crash.t / .6);
        g.strokeStyle = tok.bad; g.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const r = ((crash.t * 30 + i * 14) % 42) + 6; g.globalAlpha = 1 - r / 48; g.beginPath(); g.arc(bx, by, r, 0, 7); g.stroke(); }
        g.globalAlpha = 1; g.fillStyle = tok.bad; g.font = `700 ${Math.max(14, 18 * k)}px ${tok.body}`; g.textAlign = "center";
        g.globalAlpha = a; g.fillText(wrongT?.kind === "choque" ? "¡CHOQUE!" : "¡VARADA!", bx, by - 26); g.globalAlpha = 1;
      }
      // rosa: Norte arriba
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = night ? "rgba(255,255,255,.6)" : tok.ink; g.font = `700 12px ${tok.body}`; g.textAlign = "center";
      g.beginPath(); g.moveTo(W - 20, 10); g.lineTo(W - 25, 24); g.lineTo(W - 15, 24); g.closePath(); g.fill(); g.fillText("N", W - 20, 37);
    }

    /* ---------- bucle ---------- */
    let raf = 0, vis = true, last = performance.now();
    function loop(now) {
      raf = 0; const dt = Math.min(.05, (now - last) / 1000); last = now;
      step(dt); draw(now);
      if (vis) raf = requestAnimationFrame(loop);
    }
    const io = new IntersectionObserver((es) => { vis = es.some((e) => e.isIntersecting); if (vis && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } });
    io.observe(wrap);
    panelIntro(); hudRender();
    raf = requestAnimationFrame(loop);
    return () => { vis = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); unTheme && unTheme(); mq.removeEventListener?.("change", mqf); wrap.remove(); };
  },
};
