// ripa-luces — Simulador nocturno de luces y marcas (RIPA / COLREG 72, Parte C)
// Canvas 2D con proyección pseudo-3D: cada luz se enciende o apaga según su sector exacto
// visto desde la marcación del observador (θ = marcación del observador respecto a la proa del buque observado).

const ID = "ripa-luces";
const DEG = Math.PI / 180;
const ELEV = 7 * DEG, CE = Math.cos(ELEV), SE = Math.sin(ELEV);
const LC = { w: "#fff4d6", r: "#ff2e2e", g: "#22ff88", y: "#ffc21a" };
const LCN = { w: "blanca", r: "roja", g: "verde", y: "amarilla" };

// Sectores reglamentarios (R21). a = marcación del observador desde la proa del buque, 0–360, sentido horario.
// Costados: Anexo I §9 permite que el corte hacia proa se produzca entre 1° y 3° fuera del sector: modelamos 2°.
const SECT = {
  tope: { n: "Luz de tope", arc: "225° (de proa a 22,5° a popa del través por cada banda)", vis: a => a <= 112.5 || a >= 247.5 },
  er: { n: "Costado de estribor", arc: "112,5° (de proa a 22,5° a popa del través por estribor)", vis: a => a <= 112.5 || a >= 358 },
  br: { n: "Costado de babor", arc: "112,5° (de proa a 22,5° a popa del través por babor)", vis: a => a >= 247.5 || a <= 2 },
  alc: { n: "Luz de alcance", arc: "135° (67,5° desde la popa hacia cada banda)", vis: a => a >= 112.5 && a <= 247.5 },
  rem: { n: "Luz de remolque", arc: "135° (como la de alcance)", vis: a => a >= 112.5 && a <= 247.5 },
  th: { n: "Todo horizonte", arc: "360°", vis: () => true },
};

/* ---------- utilidades ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = a => ((a % 360) + 360) % 360;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}

/* ---------- geometría de cascos (metros; x a proa, y a estribor, z arriba; z=0 flotación) ---------- */
function hull(ox, L, B, f, rise = 1.25) {
  const o = [[-0.5, 0.42], [-0.3, 0.5], [0.18, 0.5], [0.4, 0.3], [0.5, 0]];
  const pts = [];
  for (const [fx, fy] of o) for (const sg of [1, -1]) {
    const x = ox + fx * L, y = sg * fy * B;
    const zd = f * (fx > 0.2 ? 1 + (rise - 1) * ((fx - 0.2) / 0.3) : 1);
    pts.push([x, y, zd]); pts.push([ox + fx * L * 0.96, y * 0.9, 0]);
  }
  return { t: "solid", tone: "hull", pts };
}
function box(x0, x1, hw, z0, z1, tone = "sup") {
  const pts = [];
  for (const x of [x0, x1]) for (const y of [-hw, hw]) for (const z of [z0, z1]) pts.push([x, y, z]);
  return { t: "solid", tone, pts };
}
const mast = (x, y, z0, z1, w = 1) => ({ t: "line", a: [x, y, z0], b: [x, y, z1], w });
const line = (a, b, dash) => ({ t: "line", a, b, w: 1, dash });
const sail = (pts2d, y = 0) => ({ t: "sail", pts: pts2d.map(([x, z]) => [x, y, z]) });

function tMotor(L, ox = 0, opt = {}) {
  const B = L * 0.32, f = Math.max(0.7, L * 0.075), cz = f + 1 + L * 0.04, mt = cz + 1.1 + L * 0.14;
  const gap = Math.max(0.9, L * 0.045);
  const parts = [hull(ox, L, B, f), box(ox - L * 0.22, ox + L * 0.12, B * 0.38, f, cz), mast(ox + L * 0.04, 0, cz, mt)];
  const P = {
    L, B, f, gap, mt,
    mh1: [ox + L * 0.04, 0, mt], mh2: [ox - L * 0.28, 0, mt + Math.max(1.2, L * 0.1)],
    sideS: [ox + L * 0.12, B * 0.42, cz - 0.25], sideP: [ox + L * 0.12, -B * 0.42, cz - 0.25],
    stern: [ox - L * 0.5, 0, f + 0.25], sig: [ox - L * 0.12, 0, mt - 0.4],
    anchF: [ox + L * 0.44, 0, f + 0.9 + L * 0.03], anchA: [ox - L * 0.47, 0, f + 0.5],
  };
  if (opt.mast2) parts.push(mast(ox - L * 0.28, 0, cz, P.mh2[2]));
  if (opt.sigMast) parts.push(mast(ox - L * 0.12, 0, cz, mt - 0.4));
  return { parts, P };
}
function tShip(L, ox = 0) {
  const k = L / 100, B = 16 * k, f = 7 * k;
  const parts = [hull(ox, L, B, f, 1.3), box(ox - 46 * k, ox - 30 * k, 7 * k, f, 20 * k), box(ox - 33 * k, ox - 30 * k, 8.6 * k, 17 * k, 18 * k),
    box(ox + 38 * k, ox + 47 * k, 5 * k, f, 9.5 * k, "hull"), mast(ox + 30 * k, 0, f, 24 * k, 1.4), mast(ox - 22 * k, 0, 20 * k, 34 * k, 1.4), mast(ox - 12 * k, 0, f, 29 * k, 1.2),
    box(ox - 26 * k, ox + 26 * k, 6.5 * k, f, f + 4 * k, "cargo")];
  const P = {
    L, B, f, gap: 3 * k, mt: 24 * k,
    mh1: [ox + 30 * k, 0, 24 * k], mh2: [ox - 22 * k, 0, 34 * k],
    sideS: [ox - 31.5 * k, 8.4 * k, 18.6 * k], sideP: [ox - 31.5 * k, -8.4 * k, 18.6 * k],
    stern: [ox - 49.5 * k, 0, 9 * k], sig: [ox - 12 * k, 0, 28.5 * k],
    anchF: [ox + 47 * k, 0, 12 * k], anchA: [ox - 49 * k, 0, 8.5 * k],
    yard: [ox + 30 * k, 0, 21 * k],
  };
  return { parts, P };
}
function tSail(L, ox = 0) {
  const B = L * 0.32, f = L * 0.07, mx = ox + L * 0.08, top = L * 1.25 + 1, bz = f + 1.4;
  const fsTop = [mx, top * 0.88], tack = [ox + L * 0.47, f + 0.3];
  const parts = [hull(ox, L, B, f, 1.15), box(ox - L * 0.18, ox + L * 0.12, B * 0.3, f, f + 0.8), mast(mx, 0, f, top, 1.2),
    sail([[mx - 0.15, bz], [mx - 0.15, top - 0.6], [mx - L * 0.42, bz]]), sail([[fsTop[0] + 0.1, fsTop[1]], tack, [mx + L * 0.02, bz - 0.3]]),
    line([fsTop[0], 0, fsTop[1]], [tack[0], 0, tack[1]])];
  const P = {
    L, B, f, gap: 1.0, mt: top,
    sideS: [ox + L * 0.43, B * 0.2, f + 0.55], sideP: [ox + L * 0.43, -B * 0.2, f + 0.55],
    stern: [ox - L * 0.5, 0, f + 0.4], tri: [mx, 0, top + 0.25], rg: [mx, 0, top + 0.25],
    steam: [mx + 0.25, 0, top * 0.55], cone: [(fsTop[0] + tack[0]) / 2, 0, (fsTop[1] + tack[1]) / 2 + 1.2],
    anchF: [ox + L * 0.44, 0, f + 2.5], anchA: [ox - L * 0.47, 0, f + 0.6],
  };
  return { parts, P };
}
function tFish(L, ox = 0, trawl = true) {
  const B = L * 0.3, f = L * 0.08, wt = f + 2 + L * 0.05, gap = Math.max(1, L * 0.04), mt = wt + 2.2 + L * 0.1;
  const parts = [hull(ox, L, B, f, 1.35), box(ox + L * 0.05, ox + L * 0.26, B * 0.36, f, wt), mast(ox + L * 0.15, 0, wt, mt),
    mast(ox - L * 0.4, B * 0.36, f, wt + 1), mast(ox - L * 0.4, -B * 0.36, f, wt + 1), line([ox - L * 0.4, B * 0.36, wt + 1], [ox - L * 0.4, -B * 0.36, wt + 1])];
  const mhA = [ox - L * 0.1, 0, mt + gap * 1.8];
  if (trawl) parts.push(mast(ox - L * 0.1, 0, f, mhA[2]));
  const P = {
    L, B, f, gap, mt,
    fish: [ox + L * 0.15, 0, mt], mhAft: mhA, mh1: [ox + L * 0.15, 0, mt],
    sideS: [ox + L * 0.25, B * 0.38, wt - 0.4], sideP: [ox + L * 0.25, -B * 0.38, wt - 0.4],
    stern: [ox - L * 0.5, 0, f + 0.4], gear: [ox + L * 0.15, Math.min(6, Math.max(2.5, B * 0.55)), mt - gap - 0.7],
    anchF: [ox + L * 0.45, 0, f + 1.6], anchA: [ox - L * 0.47, 0, f + 0.5],
  };
  return { parts, P };
}
function tRow(ox = 0) {
  const L = 4, f = 0.35;
  return { parts: [hull(ox, L, 1.3, f, 1.1), box(ox - 0.25, ox + 0.25, 0.22, f, f + 0.85, "sup"), line([ox, -1.6, f + 0.3], [ox, 1.6, f + 0.3])],
    P: { L, f, torch: [ox + 0.35, 0.25, f + 1.1], sideS: [ox + 1.7, 0.4, f + 0.3], sideP: [ox + 1.7, -0.4, f + 0.3], stern: [ox - 2, 0, f + 0.3] } };
}
function tTug(L, ox = 0, aft = false) {
  const B = L * 0.34, f = L * 0.08, wt = f + 2.6 + L * 0.05, gap = Math.max(1, L * 0.045), mt = wt + 2.8 + L * 0.1;
  const parts = [hull(ox, L, B, f, 1.3), box(ox, ox + L * 0.26, B * 0.36, f, wt), box(ox - L * 0.15, ox + L * 0.02, B * 0.3, f, f + 1.6), mast(ox + L * 0.12, 0, wt, mt)];
  const P = {
    L, B, f, gap, mt,
    mh1: [ox + L * 0.12, 0, mt], mh2: [ox - L * 0.15, 0, mt + 2.5],
    sideS: [ox + L * 0.25, B * 0.38, wt - 0.4], sideP: [ox + L * 0.25, -B * 0.38, wt - 0.4],
    stern: [ox - L * 0.5, 0, f + 0.7 + gap], sig: [ox + L * 0.05, 0, mt - 0.6],
    anchF: [ox + L * 0.45, 0, f + 1.6], anchA: [ox - L * 0.47, 0, f + 0.5],
  };
  if (aft) parts.push(mast(ox - L * 0.15, 0, f + 1.6, P.mh2[2]));
  return { parts, P };
}
function tBarge(L, ox = 0) {
  const B = L * 0.25, f = 1.8;
  return { parts: [hull(ox, L, B, f, 1.05), box(ox - L * 0.48, ox - L * 0.38, B * 0.3, f, f + 2.4)],
    P: { L, B, f, gap: 1.5, sideS: [ox + L * 0.46, B * 0.4, f + 0.9], sideP: [ox + L * 0.46, -B * 0.4, f + 0.9], stern: [ox - L * 0.5, 0, f + 2.6], top: [ox, 0, f + 3.8] } };
}
function tWig(L, ox = 0) {
  const f = 1.4;
  return { parts: [hull(ox, L, L * 0.16, f, 1.2), box(ox - L * 0.05, ox + L * 0.18, L * 0.6, f, f + 0.45, "sup"), box(ox - L * 0.5, ox - L * 0.36, 0.15, f, f + 5.2, "sup"),
    box(ox + L * 0.12, ox + L * 0.32, L * 0.07, f, f + 1.6, "sup")],
    P: { L, f, gap: 1, mh1: [ox + L * 0.24, 0, f + 2.2], sideS: [ox + L * 0.05, L * 0.6, f + 0.6], sideP: [ox + L * 0.05, -L * 0.6, f + 0.6],
      stern: [ox - L * 0.5, 0, f + 1.2], flash: [ox - L * 0.44, 0, f + 5.6] } };
}
function tHover(L, ox = 0) {
  const f = 2.2;
  return { parts: [hull(ox, L, L * 0.45, f, 1.0), box(ox - L * 0.3, ox + L * 0.25, L * 0.18, f, f + 2.4), mast(ox + L * 0.05, 0, f + 2.4, f + 5.4), box(ox - L * 0.48, ox - L * 0.36, L * 0.2, f, f + 3.6, "sup")],
    P: { L, f, gap: 1, mh1: [ox + L * 0.05, 0, f + 5.4], sideS: [ox + L * 0.2, L * 0.2, f + 1.8], sideP: [ox + L * 0.2, -L * 0.2, f + 1.8],
      stern: [ox - L * 0.5, 0, f + 1], flash: [ox + L * 0.05, 0, f + 6.6] } };
}

/* ---------- luces y marcas ---------- */
const NAMES = { tope: "Luz de tope", er: "Costado de estribor (verde)", br: "Costado de babor (roja)", alc: "Luz de alcance", rem: "Luz de remolque (amarilla)" };
function Lt(c, s, p, o = {}) {
  const n = o.n || (s === "th" ? `Todo horizonte ${LCN[c]}` : NAMES[s]);
  return { c, s, p, n, k: o.k || 0, gap: o.gap || 1, st: o.st || null, fl: o.fl || null };
}
function stack(cols, p, gap, st, names) {
  return cols.map((c, k) => Lt(c, "th", p, { k, gap, st, n: names && names[k] }));
}
function pmL(P, o = {}) {
  const r = [];
  if (!o.noTope) r.push(Lt("w", "tope", P.mh1, { n: o.tope2 ? "Tope de proa" : "Luz de tope" }));
  if (o.tope2) r.push(Lt("w", "tope", P.mh2, { n: "Tope de popa (más alta)" }));
  r.push(...sideL(P), Lt("w", "alc", P.stern));
  return r;
}
const sideL = P => [Lt("g", "er", P.sideS), Lt("r", "br", P.sideP)];
const anchorL = (P, big) => big ? [Lt("w", "th", P.anchF, { n: "Fondeo proa (todo horizonte)" }), Lt("w", "th", P.anchA, { n: "Fondeo popa (más baja)" })]
  : [Lt("w", "th", P.anchF, { n: "Fondeo (todo horizonte)" })];
const shp = (list, p, st) => ({ list, p, st });

/* ---------- catálogo ---------- */
const WAY = { k: "way", l: "Arrancada", ch: [["si", "Con arrancada"], ["no", "Sin arrancada"]] };
const FOG = {
  pm: "Con arrancada: 1 pitada larga cada ≤ 2 min. Parado sin arrancada: 2 largas (separadas ~2 s) cada ≤ 2 min (R35 a, b).",
  esp: "1 larga + 2 cortas cada ≤ 2 min (R35 c).",
  anc: "Campana rápida ~5 s cada ≤ 1 min; ≥ 100 m además gong a popa; opcional corta-larga-corta (R35 g).",
};
const CAT = [
  { id: "pm12", cat: "pm", g: "Propulsión mecánica", name: "Propulsión mecánica < 12 m", rule: "R23 a) y d) i)",
    opts: [{ k: "cfg", l: "Luces", ch: [["tope", "Tope + costados + alcance"], ["th", "Todo horizonte + costados"]] }],
    build(o) { const t = tMotor(10); const P = t.P;
      return { parts: t.parts, lights: o.cfg === "th" ? [Lt("w", "th", P.mh1, { n: "Blanca todo horizonte" }), ...sideL(P)] : pmL(P) }; },
    txt: o => `<p>Como alternativa a tope + costados + alcance, los buques de propulsión mecánica <b>&lt; 12 m</b> pueden exhibir <b>una luz blanca todo horizonte y las luces de costado</b> (R23 d i). La luz de tope o todo horizonte puede ir fuera del eje si no es posible colocarla en él, siempre que los costados vayan en un farol combinado en crujía o lo más cerca posible de ella (R23 d iii).</p>`,
    day: "Sin marca.", fog: FOG.pm + " Los < 12 m pueden emitir otra señal acústica eficaz cada ≤ 2 min (R35 j).",
    traps: ["< 12 m: todo horizonte + costados (no «solo todo horizonte»)", "Alcances < 12 m: tope 2 M, costados 1 M, alcance 2 M (R22 c)"] },
  { id: "pm50", cat: "pm", g: "Propulsión mecánica", name: "Propulsión mecánica 12–50 m", rule: "R23 a)",
    opts: [{ k: "t2", l: "Segundo tope", ch: [["no", "Solo tope de proa"], ["si", "Con tope de popa (opcional)"]] }],
    build(o) { const t = tMotor(30, 0, { mast2: o.t2 === "si" }); return { parts: t.parts, lights: pmL(t.P, { tope2: o.t2 === "si" }) }; },
    txt: () => `<p><b>Tope a proa, luces de costado y luz de alcance.</b> El segundo tope (a popa y más alto que el de proa) es <b>obligatorio solo si eslora ≥ 50 m</b>; por debajo es opcional (R23 a ii).</p>`,
    day: "Sin marca.", fog: FOG.pm, traps: ["15 m: estrictamente obligatorias tope a proa + costados + alcance", "30 m: tope a proa, opcionalmente un 2.º tope a popa más alto, costados y alcance"] },
  { id: "pm50p", cat: "pm", g: "Propulsión mecánica", name: "Propulsión mecánica ≥ 50 m", rule: "R23 a)",
    opts: [], build() { const t = tShip(100); return { parts: t.parts, lights: pmL(t.P, { tope2: true }) }; },
    txt: () => `<p><b>Dos luces de tope</b> (la de popa más alta que la de proa: al menos 4,5 m más, Anexo I), <b>costados</b> y <b>alcance</b>. Visto por la proa con los topes «enfilados» y ambos costados = <b>vuelta encontrada</b> (R14 b). La separación de topes permite apreciar el rumbo del otro.</p>`,
    day: "Sin marca.", fog: FOG.pm + " Equipo: pito y campana (≥ 20 m); gong además si ≥ 100 m (R33).",
    traps: ["Alcances ≥ 50 m: tope 6 M; costados, alcance, remolque y todo horizonte 3 M (R22 a)"] },
  { id: "vela", cat: "vela", g: "Vela y remo", name: "Vela en navegación", rule: "R25 a), b), c)",
    opts: [{ k: "len", l: "Eslora", ch: [["p", "< 20 m"], ["g", "≥ 20 m"]] }, { k: "cfg", l: "Luces", ch: [["sep", "Costados + alcance"], ["comb", "Farol combinado en tope (< 20 m)"], ["rv", "+ roja sobre verde en tope"]] }],
    fix(o) { if (o.len === "g" && o.cfg === "comb") o.cfg = "sep"; },
    build(o) { const t = tSail(o.len === "g" ? 22 : 12); const P = t.P;
      if (o.cfg === "comb") return { parts: t.parts, lights: [Lt("g", "er", P.tri, { n: "Tricolor: sector verde" }), Lt("r", "br", P.tri, { n: "Tricolor: sector rojo" }), Lt("w", "alc", P.tri, { n: "Tricolor: sector blanco (alcance)" })] };
      const l = [...sideL(P), Lt("w", "alc", P.stern)];
      if (o.cfg === "rv") l.push(...stack(["r", "g"], P.rg, 1.0, "rv", ["Roja todo horizonte (tope, opcional)", "Verde todo horizonte (opcional)"]));
      return { parts: t.parts, lights: l }; },
    txt: () => `<p><b>Costados + alcance</b> y nunca luz de tope (si lleva tope, va a motor). Si eslora <b>&lt; 20 m</b> pueden ir en un <b>farol combinado</b> en el tope del palo (R25 b). Opcionalmente, en el tope, <b>dos luces todo horizonte en línea vertical, roja la superior y verde la inferior</b>, pero <b>no junto con el farol combinado</b> (R25 c).</p>`,
    day: "Sin marca navegando solo a vela. Si además va a motor: cono vértice abajo a proa (R25 e).", fog: FOG.esp,
    traps: ["Roja sobre verde = vela («rojo sobre verde, vela se ve»)", "Vela 7–20 m: NO vale «costados + blanca todo horizonte» (eso es motor < 12 m)", "Un velero a motor es buque de propulsión mecánica (R3 c)"] },
  { id: "velamotor", cat: "pm", dcat: "velamotor", g: "Vela y remo", name: "Vela + motor (de día cono)", rule: "R25 e), R3 c)",
    opts: [], build() { const t = tSail(12); const P = t.P;
      return { parts: t.parts, lights: [Lt("w", "tope", P.steam, { n: "Luz de tope (va a motor)" }), ...sideL(P), Lt("w", "alc", P.stern)], shapes: [shp(["coneDn"], P.cone)] }; },
    txt: () => `<p>Un buque navegando a vela que <b>también usa el motor</b> es, a todos los efectos, <b>buque de propulsión mecánica</b> (R3 c): de noche, luces de R23 (tope + costados + alcance); de día, <b>una marca cónica con el vértice hacia abajo</b> a proa, en el lugar más visible (R25 e).</p>`,
    day: "Cono vértice hacia abajo, a proa.", fog: FOG.pm, traps: ["Cono vértice abajo = velero que va también a motor (pierde los privilegios de vela)"] },
  { id: "remo", cat: "remo", g: "Vela y remo", name: "Remo / vela < 7 m", rule: "R25 d)",
    opts: [{ k: "cfg", l: "Luces", ch: [["lint", "Linterna blanca"], ["vela", "Luces de vela"]] }],
    build(o) { const t = tRow(); const P = t.P;
      return { parts: t.parts, lights: o.cfg === "vela" ? [...sideL(P), Lt("w", "alc", P.stern)] : [Lt("w", "th", P.torch, { n: "Linterna o farol de luz blanca" })] }; },
    txt: () => `<p>Vela <b>&lt; 7 m</b>: si es posible, luces de vela (costados + alcance o farol combinado); si no, <b>linterna eléctrica o farol encendido de luz blanca</b> a mano, para mostrarla con tiempo suficiente para evitar el abordaje (R25 d i). <b>Remo</b>: puede exhibir las luces de vela; si no, la misma linterna blanca (R25 d ii).</p>`,
    day: "Sin marca.", fog: "< 12 m: no obligados a las señales de R35, pero sí a otra señal acústica eficaz cada ≤ 2 min (R35 j).",
    traps: ["Remo: NO roja sobre verde ni verde sobre roja", "Linterna = luz blanca, no intermitente de color"] },
  { id: "pm7", cat: "pm", g: "Propulsión mecánica", name: "Propulsión mecánica < 7 m (≤ 7 nudos)", rule: "R23 d) ii)",
    opts: [{ k: "cfg", l: "Luces", ch: [["th", "Solo todo horizonte"], ["thc", "Todo horizonte + costados"]] }],
    build(o) { const t = tMotor(6); const P = t.P; const l = [Lt("w", "th", P.mh1, { n: "Blanca todo horizonte" })]; if (o.cfg === "thc") l.push(...sideL(P)); return { parts: t.parts, lights: l }; },
    txt: () => `<p>Propulsión mecánica de <b>&lt; 7 m</b> cuya <b>velocidad máxima no supere 7 nudos</b>: puede exhibir <b>una luz blanca todo horizonte</b> y, si es posible, también las luces de costado (R23 d ii). Si supera 7 nudos aplica la regla de &lt; 12 m (todo horizonte + costados).</p>`,
    day: "Sin marca.", fog: "Otra señal acústica eficaz cada ≤ 2 min (R35 j).", traps: ["5 m y 10 nudos máx.: todo horizonte + costados (no basta la blanca sola)"] },
  { id: "arrastre", cat: "arrastre", dcat: "pesca", g: "Pesca", name: "Pesca de arrastre", rule: "R26 b)",
    opts: [{ k: "len", l: "Eslora", ch: [["p", "< 50 m"], ["g", "≥ 50 m"]] }, WAY],
    build(o) { const big = o.len === "g"; const t = tFish(big ? 60 : 25, 0, big); const P = t.P;
      const l = stack(["g", "w"], P.fish, P.gap, "pesca", ["Verde todo horizonte", "Blanca todo horizonte"]);
      if (big) l.push(Lt("w", "tope", P.mhAft, { n: "Tope a popa, más alto que la verde" }));
      if (o.way === "si") l.push(...sideL(P), Lt("w", "alc", P.stern));
      return { parts: t.parts, lights: l, shapes: [shp(["diab"], P.fish)] }; },
    txt: () => `<p><b>Verde sobre blanca</b> todo horizonte («verde sobre blanco, pesca de arrastre»). Una <b>luz de tope a popa y más alta</b> que la verde: <b>obligatoria si ≥ 50 m</b>, opcional por debajo. <b>Con arrancada</b>: además costados y alcance (R26 b). Señales adicionales para pesca en las proximidades: Anexo II (largando: 2 blancas; cobrando: blanca sobre roja; red enganchada: 2 rojas).</p>`,
    day: "Dos conos unidos por los vértices, en línea vertical.", fog: FOG.esp + " Fondeado pescando: la misma (R35 d).",
    traps: ["Arrastre > 50 m con arrancada: verde/blanca + tope a popa más alto + costados + alcance", "Curricán NO es «buque dedicado a la pesca» (R3 d)"] },
  { id: "pesca", cat: "pesca", dcat: "pesca", g: "Pesca", name: "Pesca (no arrastre)", rule: "R26 c)",
    opts: [WAY, { k: "gear", l: "Aparejo", ch: [["no", "≤ 150 m"], ["si", "> 150 m (hacia estribor)"]] }],
    build(o) { const t = tFish(22, 0, false); const P = t.P;
      const l = stack(["r", "w"], P.fish, P.gap, "pesca", ["Roja todo horizonte", "Blanca todo horizonte"]); const s = [shp(["diab"], P.fish)];
      if (o.gear === "si") { l.push(Lt("w", "th", P.gear, { n: "Blanca todo horizonte hacia el aparejo" })); s.push(shp(["coneUp"], [P.gear[0], P.gear[1], P.gear[2] - 0.4])); }
      if (o.way === "si") l.push(...sideL(P), Lt("w", "alc", P.stern));
      const lines = o.gear === "si" ? [line([P.gear[0], P.B * 0.5, 0.2], [P.gear[0] - 4, 26, 0], true)] : [];
      return { parts: t.parts.concat(lines), lights: l, shapes: s }; },
    txt: () => `<p><b>Roja sobre blanca</b> todo horizonte. Si el aparejo largado se extiende <b>más de 150 m</b> en horizontal: <b>una blanca todo horizonte</b> (de día un <b>cono vértice arriba</b>) <b>en la dirección del aparejo</b>. <b>Con arrancada</b>: además costados y alcance. Nunca luz de tope (R26 c).</p>`,
    day: "Dos conos unidos por los vértices; aparejo > 150 m: además cono vértice arriba hacia el aparejo.", fog: FOG.esp,
    traps: ["Aparejo de 140 m con arrancada: solo añade costados + alcance (la blanca hacia el aparejo es > 150 m)", "Cerquero recogiendo la red = buque dedicado a la pesca"] },
  { id: "sg", cat: "sg", g: "Sin gobierno / maniobra", name: "Sin gobierno", rule: "R27 a)",
    opts: [WAY], build(o) { const t = tShip(100); const P = t.P;
      const l = stack(["r", "r"], P.sig, P.gap * 1.2, "sg", ["Roja todo horizonte", "Roja todo horizonte"]); if (o.way === "si") l.push(...sideL(P), Lt("w", "alc", P.stern));
      return { parts: t.parts, lights: l, shapes: [shp(["ball", "ball"], P.sig)] }; },
    txt: () => `<p><b>Dos rojas todo horizonte</b> en línea vertical donde mejor se vean; <b>con arrancada</b>, además <b>costados y alcance</b> — y <b>sin luces de tope</b> (R27 a). Es buque sin gobierno el que por <b>circunstancia excepcional</b> (avería) no puede maniobrar (R3 f).</p>`,
    day: "Dos bolas en línea vertical.", fog: FOG.esp, traps: ["Sin gobierno con arrancada: NO lleva luces de tope", "Estas señales no son de peligro (R27 h)"] },
  { id: "mr", cat: "mr", g: "Sin gobierno / maniobra", name: "Maniobra restringida", rule: "R27 b)",
    opts: [{ k: "st", l: "Situación", ch: [["way", "Con arrancada"], ["no", "Sin arrancada"], ["anc", "Fondeado"]] }],
    build(o) { const t = tShip(60); const P = t.P;
      const l = stack(["r", "w", "r"], P.sig, P.gap * 1.3, "mr", ["Roja todo horizonte", "Blanca todo horizonte", "Roja todo horizonte"]); const s = [shp(["ball", "dia", "ball"], P.sig)];
      if (o.st === "way") l.push(...pmL(P, { tope2: true }));
      if (o.st === "anc") { l.push(...anchorL(P, true)); s.push(shp(["ball"], P.anchF)); }
      return { parts: t.parts, lights: l, shapes: s }; },
    txt: () => `<p><b>Roja–blanca–roja</b> todo horizonte en línea vertical (de día <b>bola–marca bicónica–bola</b>). Con arrancada, además <b>tope(s), costados y alcance</b>; fondeado, además las luces/marca de fondeo (R27 b). Son de maniobra restringida (R3 g): balizas, cables y tuberías; dragado, hidrografía y trabajos submarinos; <b>aprovisionamiento o trasbordo navegando</b>; <b>lanzamiento o recuperación de aeronaves</b>; limpieza de minas; remolque que restrinja mucho el rumbo.</p>`,
    day: "Bola – marca bicónica (rombo) – bola.", fog: FOG.esp + " Fondeado: la misma, en lugar de la campana (R35 d).",
    traps: ["60 m con arrancada: 2 topes + costados + alcance + roja-blanca-roja", "Un velero nunca es «maniobra restringida»", "Haciendo combustible navegando = maniobra restringida"] },
  { id: "draga", cat: "draga", dcat: "draga", g: "Sin gobierno / maniobra", name: "Dragando / obras submarinas", rule: "R27 d)",
    opts: [WAY, { k: "obs", l: "Obstrucción", ch: [["br", "A babor"], ["er", "A estribor"]] }],
    build(o) { const t = tShip(60); const P = t.P; const sg = o.obs === "er" ? 1 : -1; const k = 0.6;
      const yard = 6 * k; const top = [P.sig[0], 0, P.sig[2] - P.gap * 0.5];
      const pObs = [P.sig[0], sg * yard, top[2] - 0.5], pFree = [P.sig[0], -sg * yard, top[2] - 0.5];
      const l = [...stack(["r", "w", "r"], P.sig, P.gap * 1.3, "mr", ["Roja", "Blanca", "Roja"]),
        ...stack(["r", "r"], pObs, P.gap * 1.2, "obs", ["Roja (lado obstruido)", "Roja (lado obstruido)"]),
        ...stack(["g", "g"], pFree, P.gap * 1.2, "free", ["Verde (lado libre)", "Verde (lado libre)"])];
      if (o.way === "si") l.push(...pmL(P, { tope2: true }));
      return { parts: t.parts.concat([line([P.sig[0], -yard, top[2] - 0.2], [P.sig[0], yard, top[2] - 0.2])]), lights: l,
        shapes: [shp(["ball", "dia", "ball"], P.sig), shp(["ball", "ball"], pObs), shp(["dia", "dia"], pFree)] }; },
    txt: () => `<p>Dragando o en operaciones submarinas con obstrucción: luces de maniobra restringida (roja–blanca–roja) y además <b>dos rojas</b> (o dos bolas) en la banda de la <b>obstrucción</b> y <b>dos verdes</b> (o dos marcas bicónicas) en la banda <b>por la que puede pasar</b> otro buque (R27 d). Fondeado, estas luces sustituyen a las de fondeo.</p>`,
    day: "Bola–bicónica–bola + 2 bolas (lado obstruido) + 2 bicónicas (lado libre).", fog: FOG.esp,
    traps: ["Se pasa por la banda de las dos verdes / dos marcas bicónicas"] },
  { id: "buceo", cat: "mr", dcat: "buceo", g: "Sin gobierno / maniobra", name: "Operaciones de buceo (embarcación pequeña)", rule: "R27 e)",
    opts: [], build() { const t = tMotor(8, 0, { sigMast: true }); const P = t.P;
      return { parts: t.parts, lights: stack(["r", "w", "r"], P.sig, P.gap, "mr", ["Roja", "Blanca", "Roja"]), shapes: [shp(["flagA"], [P.sig[0], 0, P.sig[2] + 0.4])] }; },
    txt: () => `<p>Si por su tamaño no puede mostrar las marcas de R27 d): <b>roja–blanca–roja</b> todo horizonte y, de día, una <b>reproducción rígida de la bandera «A»</b> del Código Internacional de Señales, de <b>al menos 1 m de altura</b>, visible en todo el horizonte (R27 e). La normativa española de buceo exige, además, mantenerse a ≥ 50 m de la bandera «Alfa».</p>`,
    day: "Bandera «A» rígida (≥ 1 m).", fog: FOG.esp, traps: ["Bandera Alfa: blanca y azul con cola de golondrina; resto de barcos a ≥ 50 m (RD 550/2020)"] },
  { id: "calado", cat: "calado", g: "Sin gobierno / maniobra", name: "Restringido por su calado", rule: "R28",
    opts: [], build() { const t = tShip(100); const P = t.P;
      return { parts: t.parts, lights: [...pmL(P, { tope2: true }), ...stack(["r", "r", "r"], P.sig, P.gap * 1.2, "cbd", ["Roja", "Roja", "Roja"])], shapes: [shp(["cyl"], P.sig)] }; },
    txt: () => `<p>Buque de propulsión mecánica que, por su calado en relación con la profundidad y anchura de agua navegable, tiene muy restringida su capacidad de apartarse (R3 h). Además de las luces de R23 <b>podrá</b> exhibir <b>tres rojas todo horizonte</b> en línea vertical o <b>un cilindro</b> (R28). Los demás (salvo sin gobierno y maniobra restringida) <b>evitarán estorbar</b> su tránsito (R18 d).</p>`,
    day: "Un cilindro.", fog: FOG.esp, traps: ["Tres rojas o cilindro = restringido por su calado (no «sin gobierno»)", "Es «podrá»: la marca es potestativa"] },
  { id: "practico", cat: "practico", g: "Práctico / fondeo / varada", name: "Práctico", rule: "R29",
    opts: [{ k: "st", l: "Situación", ch: [["way", "En servicio, navegando"], ["anc", "En servicio, fondeado"], ["off", "Fuera de servicio"]] }],
    build(o) { const t = tMotor(16, 0, { sigMast: true }); const P = t.P;
      if (o.st === "off") return { parts: t.parts, lights: pmL(P) };
      const l = stack(["w", "r"], [P.mh1[0], 0, P.mh1[2]], P.gap, "pil", ["Blanca todo horizonte (superior)", "Roja todo horizonte"]);
      if (o.st === "way") l.push(...sideL(P), Lt("w", "alc", P.stern)); else l.push(...anchorL(P, false));
      return { parts: t.parts, lights: l, shapes: o.st === "anc" ? [shp(["ball"], P.anchF)] : [] }; },
    txt: () => `<p>En servicio de practicaje: en el tope o cerca, <b>blanca sobre roja</b> todo horizonte («blanco sobre rojo, práctico a bordo»). Navegando: además <b>costados y alcance</b> (sin tope). Fondeada: además luces/marca de fondeo. <b>Fuera de servicio</b>: las luces de un buque de su eslora (R29).</p>`,
    day: "El RIPA no prescribe marca (en la práctica, bandera «H» del CIS).", fog: FOG.pm + " En servicio puede añadir la señal de identidad: 4 pitadas cortas (R35 k).",
    traps: ["Práctico de 21 m sin hacer practicaje, navegando: tope + costados + alcance", "4 cortas en niebla = práctico en servicio"] },
  { id: "fondeado", cat: "fondeado", g: "Práctico / fondeo / varada", name: "Fondeado", rule: "R30 a), b), c), e)",
    opts: [{ k: "len", l: "Eslora", ch: [["p", "< 50 m"], ["g", "≥ 50 m"], ["c", "≥ 100 m"]] }],
    build(o) { const big = o.len !== "p"; const t = big ? tShip(o.len === "c" ? 120 : 70) : tMotor(25); const P = t.P;
      return { parts: t.parts, lights: anchorL(P, big), shapes: [shp(["ball"], P.anchF)], deck: o.len === "c" }; },
    txt: () => `<p>A proa <b>una blanca todo horizonte</b> (de día <b>una bola</b>) y a popa, <b>más baja</b>, otra blanca todo horizonte. Si <b>&lt; 50 m</b> puede exhibir solo una blanca todo horizonte donde mejor se vea (R30 b). Si <b>≥ 100 m</b> iluminará además sus cubiertas con las luces de trabajo (R30 c). Si <b>&lt; 7 m</b> y fuera de canales, fondeaderos y zonas de navegación frecuente, no necesita luces ni marca (R30 e).</p>`,
    day: "Una bola a proa.", fog: FOG.anc, traps: ["40 m con blanca a proa y otra más baja a popa: fondeado y correcto", "Una sola blanca todo horizonte NO puede ser un fondeado de 75 m"] },
  { id: "varado", cat: "varado", g: "Práctico / fondeo / varada", name: "Varado", rule: "R30 d), f)",
    opts: [{ k: "len", l: "Eslora", ch: [["p", "< 50 m"], ["g", "≥ 50 m"]] }],
    build(o) { const big = o.len === "g"; const t = big ? tShip(80) : tMotor(20, 0, { sigMast: true }); const P = t.P;
      return { parts: t.parts, lights: [...anchorL(P, big), ...stack(["r", "r"], P.sig, P.gap * 1.2, "var", ["Roja todo horizonte", "Roja todo horizonte"])], shapes: [shp(["ball", "ball", "ball"], P.sig)] }; },
    txt: () => `<p>Luces de fondeo (R30 a o b) y además, donde mejor se vean, <b>dos rojas todo horizonte</b> en línea vertical; de día <b>tres bolas</b> en línea vertical (R30 d). Los <b>&lt; 12 m</b> varados no están obligados (R30 f).</p>`,
    day: "Tres bolas en línea vertical.", fog: "Campana como fondeado precedida y seguida de 3 golpes de campana separados y claros (+ gong ≥ 100 m); puede añadir pitada apropiada (R35 h).",
    traps: ["Dos rojas sobre una blanca (sin más) = varado < 50 m", "Tres bolas = varado (no confundir con dragaminas: bolas en triángulo)"] },
  { id: "remolque", cat: "remolque", g: "Remolque y empuje", name: "Remolcando", rule: "R24 a), d), e)",
    opts: [{ k: "len", l: "Remolcador", ch: [["p", "< 50 m"], ["g", "≥ 50 m"]] }, { k: "tow", l: "Remolque", ch: [["c", "≤ 200 m"], ["l", "> 200 m"]] }],
    build(o) { const big = o.len === "g", long = o.tow === "l"; const Lt_ = big ? 55 : 28; const t = tTug(Lt_, 0, big); const P = t.P;
      const dist = long ? 120 : 55; const real = long ? 260 : 150; // distancia dibujada comprimida
      const bx = -(Lt_ / 2 + dist + 30); const b = tBarge(60, bx); const Q = b.P;
      const l = stack(long ? ["w", "w", "w"] : ["w", "w"], P.mh1, P.gap, "tug", null).map(x => ({ ...x, s: "tope", n: "Luz de tope (remolque)" }));
      if (big) l.push(Lt("w", "tope", P.mh2, { n: "Tope de popa (≥ 50 m)" }));
      l.push(...sideL(P), Lt("y", "rem", P.stern, { n: "Luz de remolque (amarilla, sobre la de alcance)", k: 0, gap: P.gap, st: "tl" }), Lt("w", "alc", P.stern, { k: 1, gap: P.gap, st: "tl" }));
      l.push(...sideL(Q), Lt("w", "alc", Q.stern, { n: "Alcance del remolcado" }));
      const sh = long ? [shp(["dia"], P.sig), shp(["dia"], Q.top)] : [];
      return { parts: t.parts.concat(b.parts, [line([-Lt_ / 2, 0, P.f + 0.5], [bx + 30, 0, 1.2])]), lights: l, shapes: sh, label: `remolque ≈ ${real} m (distancia comprimida en el dibujo)` }; },
    txt: () => `<p>Remolcador: en lugar del tope de proa, <b>dos topes en línea vertical</b> (<b>tres</b> si la longitud del remolque, desde la popa del remolcador al extremo del remolque, <b>supera 200 m</b>); costados; alcance y, <b>encima de ella, la luz de remolque amarilla</b>. Si ≥ 50 m, además el tope de popa. Si remolque &gt; 200 m, de día <b>marca bicónica</b> en ambos. Remolcado: <b>costados y alcance</b> (R24 a, e).</p>`,
    day: "Remolque > 200 m: una marca bicónica en el remolcador y otra en el remolcado.", fog: "Remolcador: " + FOG.esp + " Remolcado (el último, si va tripulado): 1 larga + 3 cortas, a continuación de la del remolcador (R35 e).",
    traps: ["Marca bicónica aislada = remolque > 200 m", "Luz amarilla de remolque = mismas características que la de alcance (135°)", "Nunca pases entre remolcador y remolcado"] },
  { id: "empuje", cat: "empuje", g: "Remolque y empuje", name: "Empujando / abarloado", rule: "R24 b), c), f)",
    opts: [{ k: "m", l: "Modo", ch: [["emp", "Empujando (no rígido)"], ["comp", "Unidad compuesta"], ["abar", "Remolcando abarloado"]] }],
    build(o) { const t = tTug(26, 0); const P = t.P;
      if (o.m === "abar") { const b = tBarge(40, -2); const Q = b.P; const sh = q => q.map(p => [p[0], p[1] + 14, p[2]]);
        const bs = { sideS: sh([Q.sideS])[0], sideP: sh([Q.sideP])[0], stern: sh([Q.stern])[0] };
        const bparts = b.parts.map(pt => pt.t === "solid" ? { ...pt, pts: sh(pt.pts) } : pt);
        return { parts: t.parts.concat(bparts), lights: [...stack(["w", "w"], P.mh1, P.gap, "tug").map(x => ({ ...x, s: "tope", n: "Luz de tope (remolque)" })), ...sideL(P), Lt("w", "alc", [P.stern[0], 0, P.f + 0.7]),
          Lt("g", "er", bs.sideS, { n: "Costado Er. del abarloado (a proa)" }), Lt("r", "br", bs.sideP, { n: "Costado Br. del abarloado (a proa)" }), Lt("w", "alc", bs.stern, { n: "Alcance del abarloado" })] }; }
      const b = tBarge(50, 13 + 25 + 0.2); const Q = b.P;
      if (o.m === "comp") return { parts: t.parts.concat(b.parts), lights: [Lt("w", "tope", P.mh1), ...sideL(Q), Lt("w", "alc", [P.stern[0], 0, P.f + 0.7])] };
      return { parts: t.parts.concat(b.parts), lights: [...stack(["w", "w"], P.mh1, P.gap, "tug").map(x => ({ ...x, s: "tope", n: "Luz de tope (empuje)" })), ...sideL(P), Lt("w", "alc", [P.stern[0], 0, P.f + 0.7]),
        Lt("g", "er", Q.sideS, { n: "Costado Er. del empujado (extremo de proa)" }), Lt("r", "br", Q.sideP, { n: "Costado Br. del empujado (extremo de proa)" })] }; },
    txt: () => `<p><b>Unidad compuesta</b> (conexión rígida): se considera un solo buque de propulsión mecánica y lleva las luces de R23 (R24 b). <b>Empujando o remolcando abarloado</b> sin unidad compuesta: <b>dos topes en línea vertical</b>, costados y alcance — <b>sin luz amarilla de remolque</b> (R24 c). El <b>empujado</b> lleva costados en su extremo de proa; el <b>remolcado abarloado</b>, alcance y costados en su extremo de proa (R24 f).</p>`,
    day: "Sin marca.", fog: "Unidad compuesta: como propulsión mecánica (R35 f). Empujando no rígido: 1 larga + 2 cortas.",
    traps: ["Unidad compuesta: un solo tope (< 50 m); remolcando por el costado: dos topes en vertical", "Remolcado por el costado: alcance + costados en el extremo de proa"] },
  { id: "dragaminas", cat: "dragaminas", g: "Sin gobierno / maniobra", name: "Dragaminas", rule: "R27 f)",
    opts: [WAY], build(o) { const t = tShip(60); const P = t.P; const k = 0.6, yard = 7 * k;
      const top = [P.mh1[0], 0, P.mh1[2] + 2.2], yz = P.mh1[2] - 1.2;
      const l = [Lt("g", "th", top, { n: "Verde en el tope del trinquete" }), Lt("g", "th", [P.mh1[0], yard, yz], { n: "Verde en el penol de estribor" }), Lt("g", "th", [P.mh1[0], -yard, yz], { n: "Verde en el penol de babor" })];
      if (o.way === "si") l.push(...pmL(P, { tope2: true })); else l.push(...anchorL(P, true));
      return { parts: t.parts.concat([mast(P.mh1[0], 0, P.mh1[2], top[2]), line([P.mh1[0], -yard, yz], [P.mh1[0], yard, yz])]), lights: l,
        shapes: [shp(["ball"], top), shp(["ball"], [P.mh1[0], yard, yz]), shp(["ball"], [P.mh1[0], -yard, yz])].concat(o.way === "si" ? [] : [shp(["ball"], P.anchF)]) }; },
    txt: () => `<p>Limpieza de minas: además de las luces de propulsión mecánica (o de fondeo), <b>tres verdes todo horizonte</b> (de día <b>tres bolas</b>): una cerca del tope del trinquete y una en cada penol de la verga. Indican que es <b>peligroso aproximarse a menos de 1000 m</b> (R27 f).</p>`,
    day: "Tres bolas: una en el tope y una en cada penol (en triángulo).", fog: FOG.esp, traps: ["No acercarse a menos de 1000 m", "Es maniobra restringida (R3 g v), pero NO lleva roja-blanca-roja"] },
  { id: "wig", cat: "wig", g: "Naves especiales", name: "Nave WIG / aerodeslizador", rule: "R23 b), c), R31",
    opts: [{ k: "m", l: "Tipo", ch: [["wig", "Nave WIG (vuelo rasante)"], ["aero", "Aerodeslizador sin desplazamiento"]] }],
    build(o) { if (o.m === "aero") { const t = tHover(20); const P = t.P; return { parts: t.parts, lights: [...pmL(P), Lt("y", "th", P.flash, { n: "Amarilla centelleante todo horizonte", fl: "cent" })] }; }
      const t = tWig(26); const P = t.P; return { parts: t.parts, lights: [...pmL(P), Lt("r", "th", P.flash, { n: "Roja centelleante todo horizonte de gran intensidad", fl: "cent" })] }; },
    txt: o => o.m === "aero" ? `<p><b>Aerodeslizador</b> operando <b>sin desplazamiento</b>: luces de propulsión mecánica <b>más una amarilla centelleante todo horizonte</b> (R23 b). Centelleante = 120 o más centelleos por minuto (R21 f).</p>`
      : `<p><b>Nave de vuelo rasante (WIG)</b> solo al <b>despegar, aterrizar o volar cerca de la superficie</b>: luces de propulsión mecánica <b>más una roja centelleante todo horizonte de gran intensidad</b> (R23 c). En vuelo debe mantenerse bien apartada de todos los buques; en la superficie del agua cumple como propulsión mecánica (R18 f). Hidroaviones y WIG que no puedan mostrar exactamente estas luces exhibirán las más parecidas posible (R31).</p>`,
    day: "Sin marca.", fog: FOG.pm, traps: ["Amarilla centelleante = aerodeslizador; roja centelleante de gran intensidad = WIG", "Lo de < 12 m y < 7 m está en R23 d), no en c)"] },
];
const BYID = Object.fromEntries(CAT.map(c => [c.id, c]));
const defOpts = e => { const o = {}; for (const op of e.opts) o[op.k] = op.ch[0][0]; e.fix && e.fix(o); return o; };

/* ---------- categorías para el modo Identifica ---------- */
const NCAT = {
  pm: "Propulsión mecánica en navegación", vela: "Buque de vela en navegación", arrastre: "Pesca de arrastre", pesca: "Pesca (no de arrastre)",
  sg: "Buque sin gobierno", mr: "Maniobra restringida", draga: "Dragando (obstrucción a una banda)", calado: "Restringido por su calado",
  practico: "Embarcación de práctico en servicio", fondeado: "Buque fondeado", varado: "Buque varado", remolque: "Remolcando (por la popa)",
  empuje: "Empujando / remolcando abarloado", dragaminas: "Dragaminas (limpieza de minas)", wig: "Nave WIG / aerodeslizador",
};
const DCAT = {
  velamotor: "Velero navegando también a motor", pesca: "Buque dedicado a la pesca", pescaap: "Pesca con aparejo > 150 m", sg: "Buque sin gobierno", mr: "Maniobra restringida",
  draga: "Dragando (obstrucción a una banda)", buceo: "Operaciones de buceo", calado: "Restringido por su calado", fondeado: "Buque fondeado", varado: "Buque varado",
  remolque: "Remolque de más de 200 m", dragaminas: "Dragaminas (limpieza de minas)",
};
const POOL_N = [
  ["pm12", { cfg: "tope" }], ["pm12", { cfg: "th" }], ["pm50", { t2: "no" }], ["pm50", { t2: "si" }], ["pm50p", {}],
  ["vela", { len: "p", cfg: "sep" }], ["vela", { len: "p", cfg: "comb" }], ["vela", { len: "g", cfg: "rv" }],
  ["arrastre", { len: "p", way: "si" }], ["arrastre", { len: "g", way: "si" }], ["arrastre", { len: "p", way: "no" }],
  ["pesca", { way: "si", gear: "no" }], ["pesca", { way: "no", gear: "no" }], ["pesca", { way: "si", gear: "si" }],
  ["sg", { way: "si" }], ["sg", { way: "no" }], ["mr", { st: "way" }], ["mr", { st: "no" }], ["mr", { st: "anc" }], ["draga", { way: "no", obs: "br" }],
  ["calado", {}], ["practico", { st: "way" }], ["practico", { st: "anc" }], ["fondeado", { len: "p" }], ["fondeado", { len: "g" }],
  ["varado", { len: "p" }], ["varado", { len: "g" }], ["remolque", { len: "p", tow: "c" }], ["remolque", { len: "p", tow: "l" }], ["remolque", { len: "g", tow: "c" }],
  ["empuje", { m: "emp" }], ["dragaminas", { way: "si" }], ["wig", { m: "wig" }], ["wig", { m: "aero" }],
];
const POOL_D = [
  ["velamotor", {}, "velamotor"], ["arrastre", { len: "p", way: "si" }, "pesca"], ["pesca", { way: "si", gear: "si" }, "pescaap"], ["sg", { way: "si" }, "sg"],
  ["mr", { st: "way" }, "mr"], ["draga", { way: "no", obs: "er" }, "draga"], ["buceo", {}, "buceo"], ["calado", {}, "calado"], ["fondeado", { len: "g" }, "fondeado"],
  ["varado", { len: "g" }, "varado"], ["remolque", { len: "p", tow: "l" }, "remolque"], ["dragaminas", { way: "si" }, "dragaminas"],
];
const ASP = {
  proa: "Nos muestra su proa: viene de vuelta encontrada", er: "Vemos su costado de estribor", br: "Vemos su costado de babor",
  popa: "Vemos su popa: lo estamos alcanzando", nd: "No se puede saber: solo muestra luces todo horizonte",
};
const ACT = {
  apartarse: "Me mantengo apartado de su derrota (cedo el paso)", mantener: "Mantengo rumbo y velocidad (sigo a rumbo), vigilando",
  estribor: "Ambos caemos a estribor y pasamos babor con babor", librar: "No hay regla de preferencia: lo libro con amplio resguardo",
};
function visLights(sc, a) { return sc.lights.filter(l => SECT[l.s].vis(a)); }
function signature(sc, a) {
  const v = visLights(sc, a); const st = {}, single = [];
  for (const l of v) { const c = l.c + (l.fl ? "*" : ""); if (l.st) (st[l.st] = st[l.st] || []).push([l.k, c]); else single.push(c); }
  const stacks = Object.values(st).map(s => s.sort((x, y) => x[0] - y[0]).map(x => x[1]).join("/")).map(s => s.includes("/") ? s : (single.push(s), null)).filter(Boolean);
  return stacks.sort().join("|") + "#" + single.sort().join("");
}
function daySig(sc) { return (sc.shapes || []).map(s => s.list.join("/")).sort().join("|"); }
function aspectOf(sc, a) {
  const dir = sc.lights.some(l => l.s !== "th");
  if (!dir) return "nd";
  const v = visLights(sc, a).map(l => l.s);
  if (v.includes("er") && v.includes("br")) return "proa";
  if (v.includes("er")) return "er"; if (v.includes("br")) return "br";
  if (v.includes("alc")) return "popa";
  return "nd";
}
function actionOf(cat, asp) {
  if (["fondeado", "varado"].includes(cat) || (cat === "practico" && asp === "nd")) return ["librar", cat === "varado" ? "Un buque varado no tiene derrota: señala un bajo. Pasa lejos (R8, buenas prácticas, R2)." : "Está fondeado: no es situación de cruce ni de alcance. Pasa a distancia segura (R8)."];
  if (asp === "popa") return ["apartarse", "Lo ves por su sector de alcance (más de 22,5° a popa de su través): eres el buque que alcanza y te mantienes apartado (R13), sea cual sea su tipo."];
  if (["vela", "arrastre", "pesca", "sg", "mr", "draga", "dragaminas"].includes(cat)) return ["apartarse", `Un buque de propulsión mecánica se mantiene apartado de ${{ vela: "un velero", arrastre: "un pesquero", pesca: "un pesquero", sg: "un buque sin gobierno", mr: "un buque con capacidad de maniobra restringida", draga: "un buque de maniobra restringida (pasa por la banda de las verdes)", dragaminas: "un dragaminas (y no te acerques a menos de 1000 m, R27 f)" }[cat]} (R18 a).`];
  if (cat === "calado") return ["apartarse", "Salvo sin gobierno y maniobra restringida, todos evitan estorbar el tránsito de un buque restringido por su calado (R18 d)."];
  if (cat === "wig") return ["mantener", "Una nave WIG al despegar, aterrizar o volar cerca de la superficie se mantiene bien apartada de todos los buques (R18 f i). Un aerodeslizador es propulsión mecánica: depende del aspecto."];
  if (asp === "proa") return ["estribor", "Dos buques de propulsión mecánica de vuelta encontrada: ambos caen a estribor y pasan por babor uno del otro (R14). Señal: 1 pitada corta."];
  if (asp === "br") return ["apartarse", "Ves su luz roja: lo tienes por tu estribor y él te tiene por su babor. Cedes el paso, evitando cortarle la proa: cae a estribor y pásale por la popa (R15, R16)."];
  if (asp === "er") return ["mantener", "Ves su luz verde: él te tiene por su estribor y debe apartarse. Mantienes rumbo y velocidad, listo para actuar si no maniobra (R17)."];
  return ["librar", "Sin aspecto definido: extrema la vigilancia y maniobra con antelación (R7, R8)."];
}

/* ---------- render ---------- */
function convexHull(P) {
  const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const STARS = Array.from({ length: 70 }, (_, i) => [((i * 7919) % 1000) / 1000, ((i * 104729) % 613) / 613 * 0.55, 0.3 + ((i * 31) % 10) / 14]);

function makeView(canvas, opts) {
  const ctx2 = canvas.getContext("2d");
  const st = { sc: null, a: 0, day: false, hull: true, labels: false, hidden: true, W: 0, H: 0, dpr: 1, ...opts };
  function resize() {
    const r = canvas.getBoundingClientRect(); st.dpr = Math.min(2, window.devicePixelRatio || 1);
    st.W = Math.max(10, r.width); st.H = Math.max(10, r.height);
    canvas.width = Math.round(st.W * st.dpr); canvas.height = Math.round(st.H * st.dpr);
  }
  function fit(sc) {
    let mnx = Infinity, mxx = -Infinity, zmax = 0;
    const all = [];
    for (const p of sc.parts) { if (p.dash) continue; const pts = p.pts || [p.a, p.b]; for (const q of pts) all.push(q); }
    for (const l of sc.lights) all.push(l.p);
    for (const q of all) { mnx = Math.min(mnx, q[0]); mxx = Math.max(mxx, q[0]); zmax = Math.max(zmax, q[2]); }
    const cx = (mnx + mxx) / 2; let R = 0;
    for (const q of all) R = Math.max(R, Math.hypot(q[0] - cx, q[1]));
    sc._fit = { cx, R, zmax };
  }
  function draw(t) {
    const { W, H, dpr, sc } = st; const c = ctx2; if (!sc || !W) return;
    if (!sc._fit) fit(sc);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const day = st.day, hz = H * 0.6;
    // cielo y mar
    let g = c.createLinearGradient(0, 0, 0, hz);
    if (day) { g.addColorStop(0, "#7fb3d6"); g.addColorStop(1, "#d6e8f1"); } else { g.addColorStop(0, "#02060c"); g.addColorStop(1, "#0b1826"); }
    c.fillStyle = g; c.fillRect(0, 0, W, hz);
    g = c.createLinearGradient(0, hz, 0, H);
    if (day) { g.addColorStop(0, "#3d6d88"); g.addColorStop(1, "#24485e"); } else { g.addColorStop(0, "#06111b"); g.addColorStop(1, "#030810"); }
    c.fillStyle = g; c.fillRect(0, hz, W, H - hz);
    if (!day) { c.fillStyle = "#ffffff"; for (const [sx, sy, sa] of STARS) { c.globalAlpha = sa * 0.5; c.fillRect(sx * W, sy * hz, 1.2, 1.2); } c.globalAlpha = 1; }
    c.strokeStyle = day ? "rgba(255,255,255,.35)" : "rgba(120,160,190,.18)"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, hz + .5); c.lineTo(W, hz + .5); c.stroke();
    const { cx, R, zmax } = sc._fit;
    const s = Math.min((W * 0.86) / (2 * R + 1), (H * 0.5) / (zmax + 1));
    const ox = W / 2, oy = H * 0.8;
    const a = st.a * DEG, dx = Math.cos(a), dy = Math.sin(a), rx = Math.sin(a), ry = -Math.cos(a);
    const P = q => { const x = q[0] - cx, y = q[1]; const dp = x * dx + y * dy; return [ox + s * (x * rx + y * ry), oy - s * q[2] * CE + s * dp * SE, dp]; };
    // casco
    if (st.hull) {
      const order = sc.parts.map(p => { const pts = p.pts || [p.a, p.b]; let d = 0; for (const q of pts) d += (q[0] - cx) * dx + q[1] * dy; return [d / pts.length, p]; }).sort((x, y) => x[0] - y[0]);
      for (const [, p] of order) {
        const tone = day ? { hull: "#26313a", sup: "#c9d2d8", cargo: "#7b4a3a" }[p.tone] || "#26313a" : { hull: "rgba(120,150,175,.20)", sup: "rgba(140,170,195,.22)", cargo: "rgba(120,150,175,.16)" }[p.tone] || "rgba(120,150,175,.2)";
        if (p.t === "solid") { const hp = convexHull(p.pts.map(P)); c.fillStyle = tone; c.beginPath(); hp.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill();
          if (day && p.tone === "hull") { c.strokeStyle = "rgba(0,0,0,.25)"; c.stroke(); } }
        else if (p.t === "sail") { const q = p.pts.map(P); c.fillStyle = day ? "rgba(250,250,245,.92)" : "rgba(150,175,200,.10)"; c.strokeStyle = day ? "rgba(0,0,0,.25)" : "rgba(150,175,200,.18)";
          c.beginPath(); q.forEach((v, i) => i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); c.closePath(); c.fill(); c.stroke(); }
        else if (p.t === "line") { const A = P(p.a), B = P(p.b); c.strokeStyle = day ? "#2a2f33" : "rgba(140,170,195,.28)"; c.lineWidth = Math.max(1, (p.w || 1) * Math.min(2, s * 0.08));
          c.setLineDash(p.dash ? [4, 4] : []); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.setLineDash([]); }
      }
      if (sc.deck && !day) { // iluminación de cubiertas ≥ 100 m
        const A = P([cx - sc._fit.R * 0.45, 0, 9]), B = P([cx + sc._fit.R * 0.45, 0, 9]);
        c.globalCompositeOperation = "lighter"; const gg = c.createLinearGradient(A[0], 0, B[0], 0); gg.addColorStop(0, "rgba(255,210,140,0)"); gg.addColorStop(.5, "rgba(255,210,140,.22)"); gg.addColorStop(1, "rgba(255,210,140,0)");
        c.fillStyle = gg; c.fillRect(Math.min(A[0], B[0]), Math.min(A[1], B[1]) - 14, Math.abs(B[0] - A[0]) + 1, 22); c.globalCompositeOperation = "source-over";
      }
    }
    if (sc.label && st.hull) { c.fillStyle = day ? "rgba(0,0,0,.6)" : "rgba(170,200,220,.55)"; c.font = "12px " + getComputedStyle(document.documentElement).getPropertyValue("--f-mono"); c.textAlign = "center"; c.fillText(sc.label, ox, H - 10); }
    // marcas (día)
    if (day) for (const sh of sc.shapes || []) {
      const b = P(sh.p); const sz = clamp(s * 1.1, 10, 22); const sp = Math.max(s * 1.5, sz * 1.4);
      sh.list.forEach((k, i) => drawShape(c, k, b[0], b[1] + i * sp + sz * 0.1, sz));
    }
    // luces
    if (!day) {
      const rg = clamp(s * 0.55, 7, 16), core = clamp(s * 0.12, 2, 3.6), mg = Math.max(11, rg * 1.2);
      const pts = [];
      for (const l of sc.lights) {
        const b = P(l.p); const y = b[1] + l.k * Math.max(l.gap * s, mg);
        const on = SECT[l.s].vis(st.a);
        let lit = on;
        if (on && l.fl === "cent" && !st.reduce) lit = ((t / 250) | 0) % 2 === 0;
        pts.push({ l, x: b[0], y, on, lit });
      }
      c.globalCompositeOperation = "lighter";
      for (const q of pts) if (q.on && q.lit) {
        const col = LC[q.l.c]; const big = q.l.fl ? 1.35 : 1;
        const gg = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, rg * big);
        gg.addColorStop(0, col); gg.addColorStop(0.18, col + "cc"); gg.addColorStop(0.45, col + "33"); gg.addColorStop(1, col + "00");
        c.fillStyle = gg; c.beginPath(); c.arc(q.x, q.y, rg * big, 0, 7); c.fill();
        // reflejo
        const ry0 = Math.max(q.y + rg, oy + 6); const rg2 = c.createLinearGradient(0, ry0, 0, ry0 + 50);
        rg2.addColorStop(0, col + "30"); rg2.addColorStop(1, col + "00"); c.fillStyle = rg2; c.fillRect(q.x - 1.5, ry0, 3, 50);
      }
      c.globalCompositeOperation = "source-over";
      for (const q of pts) {
        if (q.on && q.lit) { c.fillStyle = "#fff"; c.globalAlpha = 0.85; c.beginPath(); c.arc(q.x, q.y, core * 0.7, 0, 7); c.fill(); c.globalAlpha = 1; c.fillStyle = LC[q.l.c]; c.beginPath(); c.arc(q.x, q.y, core * 0.45, 0, 7); c.fill(); }
        else if (q.on && q.l.fl && st.reduce) { c.strokeStyle = LC[q.l.c]; c.setLineDash([2, 2]); c.beginPath(); c.arc(q.x, q.y, core * 2.4, 0, 7); c.stroke(); c.setLineDash([]); }
        else if (!q.on && st.hidden) { c.strokeStyle = "rgba(150,175,200,.45)"; c.lineWidth = 1; c.beginPath(); c.arc(q.x, q.y, core * 1.2, 0, 7); c.stroke(); }
        if (q.l.fl && q.on && st.reduce) { c.strokeStyle = LC[q.l.c]; c.beginPath(); c.arc(q.x, q.y, core * 2.4, 0, 7); c.stroke(); }
      }
      if (st.labels) {
        c.font = "11px " + getComputedStyle(document.documentElement).getPropertyValue("--f-body"); c.textBaseline = "middle";
        const used = [];
        for (const q of pts) { if (!q.on) continue; let ly = q.y; while (used.some(u => Math.abs(u[0] - q.x) < 120 && Math.abs(u[1] - ly) < 13)) ly += 13; used.push([q.x, ly]);
          const right = q.x < W * 0.7; c.textAlign = right ? "left" : "right"; c.fillStyle = "rgba(220,235,245,.85)"; c.fillText(q.l.n, q.x + (right ? 1 : -1) * (core * 3 + 4), ly); }
      }
    }
  }
  return { st, resize, draw, fit };
}
function drawShape(c, k, x, y, sz) {
  const r = sz / 2; c.fillStyle = "#111"; c.beginPath();
  if (k === "ball") c.arc(x, y + r, r, 0, 7);
  else if (k === "coneUp") { c.moveTo(x, y); c.lineTo(x + r, y + sz); c.lineTo(x - r, y + sz); }
  else if (k === "coneDn") { c.moveTo(x - r, y); c.lineTo(x + r, y); c.lineTo(x, y + sz); }
  else if (k === "cyl") c.rect(x - r * 0.75, y - sz * 0.25, r * 1.5, sz * 1.5);
  else if (k === "dia") { c.moveTo(x, y - r * 0.2); c.lineTo(x + r, y + r * 0.8); c.lineTo(x, y + sz * 1.3); c.lineTo(x - r, y + r * 0.8); }
  else if (k === "diab") { c.moveTo(x - r, y - r * 0.2); c.lineTo(x + r, y - r * 0.2); c.lineTo(x, y + r * 0.8); c.lineTo(x + r, y + sz * 1.3); c.lineTo(x - r, y + sz * 1.3); c.lineTo(x, y + r * 0.8); }
  else if (k === "flagA") { const w = sz * 1.5, hh = sz * 1.1; c.fillStyle = "#fff"; c.fillRect(x - w / 2, y, w / 2, hh); c.fillStyle = "#1d3fa8"; c.moveTo(x, y); c.lineTo(x + w / 2, y); c.lineTo(x + w * 0.25, y + hh / 2); c.lineTo(x + w / 2, y + hh); c.lineTo(x, y + hh); c.closePath(); c.fill(); c.strokeStyle = "#111"; c.strokeRect(x - w / 2, y, w / 2, hh); c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y + hh * 2.2); c.stroke(); return; }
  c.closePath(); c.fill();
}
const SHN = { ball: "bola", coneUp: "cono vértice arriba", coneDn: "cono vértice abajo", cyl: "cilindro", dia: "marca bicónica", diab: "dos conos unidos por los vértices", flagA: "bandera «A» rígida" };

/* ---------- diagrama de sectores ---------- */
function drawSectors(cv, sc, a, dpr) {
  const c = cv.getContext("2d"); const W = cv.width / dpr, H = cv.height / dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = "#071019"; c.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 14; if (R < 20) return;
  const ang = d => (d - 90) * DEG; // 0° = arriba (proa)
  const has = s => sc && sc.lights.some(l => l.s === s);
  const arc = (from, to, r, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(cx, cy, r, ang(from), ang(to)); c.stroke(); };
  c.strokeStyle = "rgba(150,180,200,.18)"; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  for (let d = 0; d < 360; d += 22.5) { const r1 = R - (d % 90 ? 3 : 7); c.beginPath(); c.moveTo(cx + Math.cos(ang(d)) * r1, cy + Math.sin(ang(d)) * r1); c.lineTo(cx + Math.cos(ang(d)) * R, cy + Math.sin(ang(d)) * R); c.stroke(); }
  if (has("tope")) arc(-112.5, 112.5, R * 0.92, "rgba(255,244,214,.9)", 3);
  if (has("er")) arc(0, 112.5, R * 0.78, LC.g, 4);
  if (has("br")) arc(-112.5, 0, R * 0.78, LC.r, 4);
  if (has("alc")) arc(112.5, 247.5, R * 0.78, "rgba(255,244,214,.9)", 4);
  if (has("rem")) arc(112.5, 247.5, R * 0.66, LC.y, 4);
  const thc = sc ? [...new Set(sc.lights.filter(l => l.s === "th").map(l => l.c))] : [];
  thc.forEach((col, i) => { c.setLineDash([3, 3]); c.strokeStyle = LC[col]; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, R * (0.52 - i * 0.07), 0, 7); c.stroke(); c.setLineDash([]); });
  // buque
  c.fillStyle = "rgba(200,220,235,.85)"; c.beginPath(); c.moveTo(cx, cy - 16); c.quadraticCurveTo(cx + 7, cy - 4, cx + 6, cy + 13); c.lineTo(cx - 6, cy + 13); c.quadraticCurveTo(cx - 7, cy - 4, cx, cy - 16); c.fill();
  // observador
  const ox = cx + Math.cos(ang(a)) * R, oy = cy + Math.sin(ang(a)) * R;
  c.strokeStyle = "rgba(226,102,171,.6)"; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(cx, cy); c.lineTo(ox, oy); c.stroke(); c.setLineDash([]);
  c.fillStyle = "#e266ab"; c.beginPath(); c.arc(ox, oy, 6, 0, 7); c.fill(); c.fillStyle = "#071019"; c.beginPath(); c.arc(ox, oy, 2.2, 0, 7); c.fill();
  c.fillStyle = "rgba(200,220,235,.7)"; c.font = "10px sans-serif"; c.textAlign = "center"; c.fillText("PROA", cx, 10); c.fillText("POPA", cx, H - 3);
  c.textAlign = "left"; c.fillText("Er", W - 14, cy + 3); c.textAlign = "right"; c.fillText("Br", 14, cy + 3);
}

/* ---------- tabla R22 ---------- */
const R22 = `<div class="scroll-x"><table>
<thead><tr><th>Luz</th><th>Eslora ≥ 50 m</th><th>12 ≤ eslora &lt; 50 m</th><th>Eslora &lt; 12 m</th></tr></thead>
<tbody>
<tr><td>Tope</td><td><b>6 M</b></td><td><b>5 M</b> (3 M si &lt; 20 m)</td><td><b>2 M</b></td></tr>
<tr><td>Costado</td><td>3 M</td><td>2 M</td><td><b>1 M</b></td></tr>
<tr><td>Alcance</td><td>3 M</td><td>2 M</td><td>2 M</td></tr>
<tr><td>Remolque</td><td>3 M</td><td>2 M</td><td>2 M</td></tr>
<tr><td>Todo horizonte blanca, roja, verde o amarilla</td><td>3 M</td><td>2 M</td><td>2 M</td></tr>
</tbody></table></div>
<p class="small muted">R22 d): buques u objetos remolcados poco visibles y parcialmente sumergidos — luz blanca todo horizonte 3 M. Alcances <b>mínimos</b> de visibilidad en noche oscura y atmósfera diáfana. Otras distancias del reglamento: luz de señales de maniobra (R34 b) visible ≥ <b>5 M</b>; dragaminas: peligroso a &lt; <b>1000 m</b>; señales adicionales del Anexo II visibles ≥ <b>1 M</b>.</p>
<h4>Sectores (R21)</h4>
<div class="scroll-x"><table><thead><tr><th>Luz</th><th>Color</th><th>Arco</th><th>Visible</th></tr></thead><tbody>
<tr><td>Tope</td><td>blanca</td><td><b>225°</b></td><td>de proa a 22,5° a popa del través por cada banda; sobre el eje longitudinal</td></tr>
<tr><td>Costado</td><td>verde Er. / roja Br.</td><td><b>112,5°</b></td><td>de proa a 22,5° a popa del través de su banda; &lt; 20 m pueden ir en un farol combinado en crujía</td></tr>
<tr><td>Alcance</td><td>blanca</td><td><b>135°</b></td><td>67,5° desde la popa hacia cada banda; lo más cerca posible de la popa</td></tr>
<tr><td>Remolque</td><td>amarilla</td><td><b>135°</b></td><td>mismas características que la de alcance</td></tr>
<tr><td>Todo horizonte</td><td>cualquiera</td><td><b>360°</b></td><td>sin interrupción en todo el horizonte</td></tr>
<tr><td>Centelleante</td><td>—</td><td>—</td><td><b>120 o más</b> centelleos por minuto, a intervalos regulares</td></tr>
</tbody></table></div>
<h4>Marcas (Anexo I)</h4>
<p class="small">Bola: diámetro ≥ 0,6 m. Cono: base ≥ 0,6 m y altura igual a la base. Cilindro: diámetro ≥ 0,6 m y altura doble. Marca bicónica: dos conos unidos por su base. Separación vertical entre marcas ≥ 1,5 m. Los buques &lt; 20 m pueden usar marcas menores, proporcionadas a su tamaño. Las marcas son negras y obligatorias <b>de día en todas las condiciones meteorológicas</b> (R20).</p>`;

/* ---------- módulo ---------- */
const CSS = `
.m-${ID} [hidden]{display:none!important}
.m-${ID} .lay{display:grid;gap:1rem;grid-template-columns:minmax(0,1.65fr) minmax(0,1fr)}
@media (max-width:820px){.m-${ID} .lay{grid-template-columns:minmax(0,1fr)}}
.m-${ID} .view{aspect-ratio:16/10;min-height:220px}
.m-${ID} .sect{aspect-ratio:1/1;max-width:230px;margin:0 auto;width:100%;touch-action:none;cursor:grab}
.m-${ID} select{width:100%;min-height:40px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);padding:.3em .5em}
.m-${ID} .opt-l{font-size:.8rem;color:var(--muted);font-weight:600;margin-bottom:.2rem}
.m-${ID} .seg button{min-height:34px}
.m-${ID} .seg.sm button{padding:.3em .6em;font-size:.85rem}
.m-${ID} .lt{display:inline-block;width:.8em;height:.8em;border-radius:50%;vertical-align:-.05em;margin-right:.35em;box-shadow:0 0 0 1px var(--line)}
.m-${ID} ul.lights{margin:.3rem 0 0;padding-left:1.1rem}
.m-${ID} ul.lights li{margin:.1rem 0}
.m-${ID} .off{color:var(--muted);text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--muted) 60%,transparent)}
.m-${ID} .choices{display:grid;gap:.45rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))}
.m-${ID} .choices .btn{justify-content:flex-start;text-align:left;font-weight:500;white-space:normal;line-height:1.25}
.m-${ID} .choices .btn.sel{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
.m-${ID} .choices .btn.ok{border-color:var(--ok);color:var(--ok);font-weight:700}
.m-${ID} .choices .btn.bad{border-color:var(--bad);color:var(--bad)}
.m-${ID} .meter{height:8px;background:var(--sea);border-radius:99px;overflow:hidden}
.m-${ID} .meter>i{display:block;height:100%;background:var(--accent);border-radius:99px;transition:width .3s}
.m-${ID} .hd{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:space-between;align-items:flex-end}
.m-${ID} .q h4{margin-bottom:.35rem}
.m-${ID} .trap{border-left:3px solid var(--warn);padding-left:.6rem}
`;

export default {
  id: ID, tema: 6, title: "Simulador nocturno de luces", icon: "✦",
  desc: "Gira un buque de noche y de día, mira qué luces y marcas ves desde cada marcación e identifica buques solo por sus luces.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) document.head.append(h("style", { "data-mod": ID }, CSS));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = h("div", { class: `m-${ID} stack` }); el.append(root);
    const cleanups = [];
    const store = ctx.store || { get: (k, d) => d, set() {} };
    let mode = "exp";

    const segMode = h("div", { class: "seg", role: "group", "aria-label": "Modo" });
    const MODES = [["exp", "Explorar"], ["id", "Identifica"], ["r22", "Alcances R22"]];
    for (const [k, l] of MODES) segMode.append(h("button", { type: "button", "aria-pressed": String(k === mode), onclick: () => setMode(k) }, l));
    root.append(h("div", { class: "hd" }, h("div", null, h("div", { class: "eyebrow" }, "Tema 6 · RIPA Parte C · Reglas 20–31"), h("h3", null, "Luces y marcas desde cualquier marcación")), segMode));

    /* ===== EXPLORAR ===== */
    const ex = { e: CAT[0], o: defOpts(CAT[0]), a: 30, spin: !reduce, day: false };
    const cv = h("canvas", { "aria-label": "Escena del buque" });
    const stage = h("div", { class: "stage night view" }, cv);
    const view = makeView(cv, { reduce });
    const sel = h("select", { "aria-label": "Tipo de buque", onchange: () => { ex.e = BYID[sel.value]; ex.o = defOpts(ex.e); rebuild(); } });
    const groups = {};
    for (const e of CAT) { if (!groups[e.g]) { groups[e.g] = h("optgroup", { label: e.g }); sel.append(groups[e.g]); } groups[e.g].append(h("option", { value: e.id }, e.name)); }
    const optsBox = h("div", { class: "stack", style: "gap:.5rem" });
    const aspR = h("input", { type: "range", min: 0, max: 359, step: 1, value: ex.a, "aria-label": "Marcación del observador", oninput: () => { ex.a = +aspR.value; ex.spin = false; spinBtn.setAttribute("aria-pressed", "false"); paintInfo(); } });
    const aspOut = h("span", { class: "mono small" });
    const spinBtn = h("button", { type: "button", class: "btn sm", "aria-pressed": String(ex.spin), onclick: () => { ex.spin = !ex.spin; spinBtn.setAttribute("aria-pressed", String(ex.spin)); spinBtn.textContent = ex.spin ? "Pausar giro" : "Girar"; } }, ex.spin ? "Pausar giro" : "Girar");
    const quick = h("div", { class: "row", style: "gap:.35rem" });
    for (const [l, v] of [["Proa", 0], ["Amura Er.", 45], ["Estribor", 90], ["Aleta Er.", 135], ["Popa", 180], ["Aleta Br.", 225], ["Babor", 270], ["Amura Br.", 315]])
      quick.append(h("button", { type: "button", class: "btn sm", onclick: () => { ex.a = v; ex.spin = false; spinBtn.setAttribute("aria-pressed", "false"); spinBtn.textContent = "Girar"; aspR.value = v; paintInfo(); } }, l));
    const dn = h("div", { class: "seg sm", role: "group", "aria-label": "Día o noche" });
    const dnB = [["n", "Noche"], ["d", "Día (marcas)"]].map(([k, l]) => h("button", { type: "button", "aria-pressed": String(k === "n"), onclick: () => { ex.day = k === "d"; dnB.forEach((b, i) => b.setAttribute("aria-pressed", String((i === 1) === ex.day))); stage.classList.toggle("night", !ex.day); paintInfo(); } }, l));
    dn.append(...dnB);
    const tog = (label, key, def) => { view.st[key] = def; const b = h("button", { type: "button", class: "btn sm", "aria-pressed": String(def), onclick: () => { view.st[key] = !view.st[key]; b.setAttribute("aria-pressed", String(view.st[key])); b.classList.toggle("primary", view.st[key]); } }, label); b.classList.toggle("primary", def); return b; };
    const sectCv = h("canvas", { class: "sect", "aria-label": "Sectores de luz vistos desde arriba; arrastra para cambiar la marcación" });
    const sectStage = h("div", { style: "display:flex;justify-content:center" }, sectCv);
    const info = h("div", { class: "panel stack" });

    const exSec = h("section", { class: "stack" },
      h("div", { class: "lay" },
        h("div", { class: "stack" }, stage,
          h("div", { class: "row", style: "justify-content:space-between" }, h("label", { class: "small", style: "font-weight:600" }, "Marcación del observador desde su proa ", aspOut), spinBtn),
          aspR, quick),
        h("div", { class: "panel stack" },
          h("div", null, h("div", { class: "opt-l" }, "Buque"), sel), optsBox,
          h("div", { class: "row" }, dn),
          h("div", { class: "row", style: "gap:.35rem" }, tog("Silueta", "hull", true), tog("Nombres", "labels", false), tog("Luces ocultas", "hidden", true)),
          sectStage,
          h("p", { class: "small muted" }, "Vista cenital: el punto magenta eres tú. Arrástralo para rodear el buque."))),
      info);

    function rebuild() {
      sel.value = ex.e.id; optsBox.textContent = "";
      for (const op of ex.e.opts) {
        const sg = h("div", { class: "seg sm", role: "group", "aria-label": op.l });
        for (const [v, l] of op.ch) {
          const dis = ex.e.id === "vela" && op.k === "cfg" && v === "comb" && ex.o.len === "g";
          sg.append(h("button", { type: "button", "aria-pressed": String(ex.o[op.k] === v), disabled: dis, onclick: () => { ex.o[op.k] = v; ex.e.fix && ex.e.fix(ex.o); rebuild(); } }, l));
        }
        optsBox.append(h("div", null, h("div", { class: "opt-l" }, op.l), sg));
      }
      view.st.sc = ex.e.build(ex.o); view.st.sc._fit = null;
      paintInfo();
    }
    const dot = c => h("span", { class: "lt", style: `background:${LC[c]}` });
    let lastInfoKey = "";
    function paintInfo(force) {
      const sc = view.st.sc; if (!sc) return;
      const a = Math.round(norm(ex.a)); aspOut.textContent = `${String(a).padStart(3, "0")}°`;
      if (+aspR.value !== a) aspR.value = a;
      const vis = visLights(sc, a); const key = ex.e.id + JSON.stringify(ex.o) + vis.map(l => l.n).join() + ex.day;
      drawSectors(sectCv, sc, a, view.st.dpr);
      if (key === lastInfoKey && !force) return; lastInfoKey = key;
      const e = ex.e; const asp = aspectOf(sc, a);
      const aspTxt = { proa: "por su proa (ves ambos costados)", er: "por su costado de estribor", br: "por su costado de babor", popa: "por su sector de alcance (popa)", nd: "sin luces direccionales: no se aprecia su aspecto" }[asp];
      info.textContent = "";
      info.append(h("div", { class: "row", style: "justify-content:space-between" }, h("h4", null, e.name), h("span", { class: "chip acc" }, e.rule)));
      info.append(h("div", { html: e.txt(ex.o) }));
      const g = h("div", { class: "grid" });
      const ul = h("ul", { class: "lights" });
      for (const l of sc.lights) { const on = vis.includes(l); ul.append(h("li", { class: on ? "" : "off" }, dot(l.c), `${l.n}`, h("span", { class: "muted small" }, ` · ${SECT[l.s].arc.split(" ")[0]}${l.fl ? " · centelleante" : ""}`))); }
      g.append(h("div", { class: "tint" }, h("div", { class: "eyebrow" }, ex.day ? "De noche llevaría" : `Desde aquí lo ves ${aspTxt}`), ul));
      const shapes = (sc.shapes || []).map(s => s.list.map(k => SHN[k]).join(" + "));
      g.append(h("div", { class: "tint stack", style: "gap:.4rem" },
        h("div", null, h("div", { class: "eyebrow" }, "De día"), h("p", null, e.day + (shapes.length && ex.day ? "" : ""))),
        h("div", null, h("div", { class: "eyebrow" }, "En niebla (R35)"), h("p", { class: "small" }, e.fog))));
      info.append(g);
      if (e.traps && e.traps.length) info.append(h("div", { class: "trap stack", style: "gap:.2rem" }, h("div", { class: "eyebrow" }, "Ojo en el examen"), ...e.traps.map(t => h("p", { class: "small" }, t))));
    }
    // arrastre en el diagrama de sectores
    let dragging = false;
    const setFromPtr = ev => { const r = sectCv.getBoundingClientRect(); const x = ev.clientX - r.left - r.width / 2, y = ev.clientY - r.top - r.height / 2; ex.a = norm(Math.atan2(y, x) / DEG + 90); ex.spin = false; spinBtn.setAttribute("aria-pressed", "false"); spinBtn.textContent = "Girar"; paintInfo(); };
    sectCv.addEventListener("pointerdown", ev => { dragging = true; sectCv.setPointerCapture(ev.pointerId); setFromPtr(ev); });
    sectCv.addEventListener("pointermove", ev => dragging && setFromPtr(ev));
    sectCv.addEventListener("pointerup", () => dragging = false);
    sectCv.addEventListener("pointercancel", () => dragging = false);

    /* ===== IDENTIFICA ===== */
    const cv2 = h("canvas", { "aria-label": "Luces de un buque desconocido" });
    const stage2 = h("div", { class: "stage night view" }, cv2);
    const view2 = makeView(cv2, { reduce, hull: false, hidden: false, labels: false });
    const idState = { q: null, dayMode: false, total: store.get("ident", 0), streak: 0, done: false, ans: {} };
    const counter = h("span", { class: "mono" });
    const meter = h("div", { class: "meter", "aria-hidden": "true" }, h("i"));
    const qBox = h("div", { class: "stack" });
    const fb = h("div", { class: "stack", "aria-live": "polite" });
    const nextBtn = h("button", { type: "button", class: "btn primary", onclick: () => newQ() }, "Siguiente buque");
    const checkBtn = h("button", { type: "button", class: "btn primary", onclick: () => check() }, "Comprobar");
    const peekBtn = h("button", { type: "button", class: "btn sm", onclick: () => { view2.st.hull = !view2.st.hull; peekBtn.textContent = view2.st.hull ? "Ocultar casco" : "Ver casco"; } }, "Ver casco");
    const idDn = h("div", { class: "seg sm", role: "group", "aria-label": "Noche o día" });
    const idDnB = [["n", "Noche: luces"], ["d", "Día: marcas"]].map(([k, l]) => h("button", { type: "button", "aria-pressed": String(k === "n"), onclick: () => { idState.dayMode = k === "d"; idDnB.forEach((b, i) => b.setAttribute("aria-pressed", String((i === 1) === idState.dayMode))); newQ(); } }, l));
    idDn.append(...idDnB);
    const idSec = h("section", { class: "stack", hidden: true },
      h("div", { class: "row", style: "justify-content:space-between" }, idDn, h("div", { class: "row", style: "gap:.5rem" }, h("span", { class: "small muted" }, "Identificadas"), counter)), meter,
      h("div", { class: "lay" }, h("div", { class: "stack" }, stage2, h("div", { class: "row" }, peekBtn, h("span", { class: "small muted" }, "Supón que tú navegas en un buque de propulsión mecánica y hay riesgo de abordaje."))),
        h("div", { class: "panel stack" }, qBox, h("div", { class: "row" }, checkBtn, nextBtn), fb)));

    function updCounter() { counter.textContent = `${idState.total} / 50`; meter.firstChild.style.width = Math.min(100, idState.total * 2) + "%"; }
    function choiceGroup(title, opts, key) {
      const box = h("div", { class: "choices", role: "radiogroup", "aria-label": title });
      for (const [v, l] of opts) box.append(h("button", { type: "button", class: "btn sm", "data-v": v, role: "radio", "aria-checked": "false", onclick: ev => {
        if (idState.done) return; idState.ans[key] = v; for (const b of box.children) { const on = b.dataset.v === v; b.classList.toggle("sel", on); b.setAttribute("aria-checked", String(on)); } } }, l));
      return h("div", { class: "q" }, h("h4", null, title), box);
    }
    function newQ() {
      idState.done = false; idState.ans = {}; fb.textContent = ""; qBox.textContent = ""; checkBtn.hidden = false; nextBtn.hidden = true;
      view2.st.hull = idState.dayMode; peekBtn.hidden = idState.dayMode; peekBtn.textContent = "Ver casco";
      view2.st.day = idState.dayMode; stage2.classList.toggle("night", !idState.dayMode);
      if (idState.dayMode) {
        const [eid, o, dc] = pick(POOL_D); const e = BYID[eid]; const sc = e.build({ ...defOpts(e), ...o }); const a = rnd(20, 340);
        const sig = daySig(sc); const others = shuffle(POOL_D.filter(p => p[2] !== dc && daySig(BYID[p[0]].build({ ...defOpts(BYID[p[0]]), ...p[1] })) !== sig).map(p => p[2]));
        const opts = shuffle([dc, ...[...new Set(others)].slice(0, 5)]).map(k => [k, DCAT[k]]);
        idState.q = { day: true, e, sc, a, cat: dc };
        view2.st.sc = sc; view2.st.a = a; sc._fit = null;
        qBox.append(h("p", { class: "small muted" }, "De día, con buena visibilidad, ves estas marcas:"), choiceGroup("¿Qué buque es?", opts, "cat"));
        return;
      }
      let eid, o, e, sc, a, asp, tries = 0;
      do {
        [eid, o] = pick(POOL_N); e = BYID[eid]; sc = e.build({ ...defOpts(e), ...o });
        const dirs = sc.lights.some(l => l.s !== "th");
        const kind = dirs ? pick(["proa", "er", "br", "popa", "er", "br"]) : "nd";
        a = kind === "proa" ? norm(rnd(-1.4, 1.4)) : kind === "er" ? rnd(25, 100) : kind === "br" ? rnd(260, 335) : kind === "popa" ? rnd(125, 235) : rnd(0, 360);
        asp = aspectOf(sc, a); tries++;
      } while (asp === "nd" && sc.lights.some(l => l.s !== "th") && tries < 20);
      const cat = BYID[eid].cat; const sig = signature(sc, a);
      const conflict = k => POOL_N.some(([pid, po]) => BYID[pid].cat === k && signature(BYID[pid].build({ ...defOpts(BYID[pid]), ...po }), a) === sig);
      const others = shuffle(Object.keys(NCAT).filter(k => k !== cat && !conflict(k)));
      const opts = shuffle([cat, ...others.slice(0, 5)]).map(k => [k, NCAT[k]]);
      idState.q = { day: false, e, o, sc, a, cat, asp };
      view2.st.sc = sc; view2.st.a = a; sc._fit = null;
      qBox.append(choiceGroup("1 · ¿Qué buque es?", opts, "cat"),
        choiceGroup("2 · ¿Qué aspecto te presenta?", Object.entries(ASP), "asp"),
        choiceGroup("3 · ¿Qué debes hacer?", Object.entries(ACT), "act"));
    }
    function mark(key, ok, right) {
      const box = qBox.querySelector(`[aria-label="${key}"]`); if (!box) return;
      for (const b of box.children) { if (b.dataset.v === right) b.classList.add("ok"); else if (b.classList.contains("sel") && !ok) b.classList.add("bad"); }
    }
    function check() {
      const q = idState.q; if (!q || idState.done) return;
      const titles = [...qBox.querySelectorAll(".q h4")].map(x => x.textContent);
      if (q.day) {
        if (!idState.ans.cat) { ctx.toast("Elige un tipo de buque."); return; }
        idState.done = true; const ok = idState.ans.cat === q.cat; mark(titles[0], ok, q.cat);
        const shapes = (q.sc.shapes || []).map(s => s.list.map(k => SHN[k]).join(" sobre ")).join("; ");
        fb.append(h("p", { class: ok ? "fb-ok" : "fb-bad" }, ok ? "Correcto." : "No."), h("p", null, `${DCAT[q.cat]} (${q.e.rule}). Marcas: ${shapes}.`), h("p", { class: "small", html: q.e.txt({ ...defOpts(q.e) }) }));
        finish(ok, ok); return;
      }
      if (!idState.ans.cat || !idState.ans.asp || !idState.ans.act) { ctx.toast("Responde las tres preguntas."); return; }
      idState.done = true;
      const [act, why] = actionOf(q.cat === "wig" && q.o.m === "aero" ? "pm" : q.cat, q.asp);
      const okC = idState.ans.cat === q.cat, okA = idState.ans.asp === q.asp, okX = idState.ans.act === act;
      mark(titles[0], okC, q.cat); mark(titles[1], okA, q.asp); mark(titles[2], okX, act);
      const vis = visLights(q.sc, q.a);
      fb.append(h("p", { class: okC && okA && okX ? "fb-ok" : "fb-bad" }, okC && okA && okX ? "Todo correcto." : `${[okC, okA, okX].filter(Boolean).length} de 3 correctas.`),
        h("p", null, h("b", null, NCAT[q.cat]), ` — ${q.e.name} (${q.e.rule}). Lo miras desde ${String(Math.round(q.a)).padStart(3, "0")}° de su proa.`),
        h("ul", { class: "lights" }, ...vis.map(l => h("li", null, dot(l.c), l.n))),
        h("p", null, h("b", null, "Aspecto: "), ASP[q.asp] + "."),
        h("p", null, h("b", null, "Maniobra: "), why));
      view2.st.hull = true; peekBtn.textContent = "Ocultar casco";
      finish(okC, okC && okA && okX);
    }
    function finish(okType, all) {
      checkBtn.hidden = true; nextBtn.hidden = false;
      if (okType) {
        idState.total++; store.set("ident", idState.total); updCounter();
        ctx.award(all ? 12 : 6, all ? "Buque identificado (RIPA)" : "Tipo de buque identificado");
        if (idState.total >= 50 && !store.get("badge", false)) { store.set("badge", true); ctx.badge("noctambulo"); ctx.toast("Insignia «Noctámbulo»: 50 buques identificados por sus luces."); }
      }
      nextBtn.focus({ preventScroll: true });
    }

    /* ===== R22 ===== */
    const r22Sec = h("section", { class: "panel stack", hidden: true }, h("h4", null, "Regla 22 · Visibilidad de las luces (alcances mínimos)"), h("div", { html: R22 }));

    root.append(exSec, idSec, r22Sec);
    function setMode(k) {
      mode = k; [...segMode.children].forEach((b, i) => b.setAttribute("aria-pressed", String(MODES[i][0] === k)));
      exSec.hidden = k !== "exp"; idSec.hidden = k !== "id"; r22Sec.hidden = k !== "r22";
      if (k === "id" && !idState.q) newQ();
      requestAnimationFrame(sizeAll);
    }

    /* ===== bucle ===== */
    function sizeAll() {
      view.resize(); view2.resize();
      const r = sectCv.getBoundingClientRect(); const d = view.st.dpr; sectCv.width = Math.max(10, Math.round(r.width * d)); sectCv.height = Math.max(10, Math.round(r.height * d));
      if (view.st.sc) view.st.sc._fit = null; if (view2.st.sc) view2.st.sc._fit = null;
      paintInfo(true);
    }
    const ro = new ResizeObserver(() => sizeAll()); ro.observe(stage); ro.observe(stage2); ro.observe(sectStage);
    let visible = true, raf = 0, last = performance.now();
    const io = new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible && !raf) raf = requestAnimationFrame(loop); });
    io.observe(root);
    function loop(t) {
      raf = 0; if (!visible || document.hidden) return;
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (mode === "exp") {
        if (ex.spin) { ex.a = norm(ex.a + dt * 14); paintInfo(); }
        view.st.a = ex.a; view.st.day = ex.day; view.draw(t);
      } else if (mode === "id") view2.draw(t);
      raf = requestAnimationFrame(loop);
    }
    const onVis = () => { if (!document.hidden && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    document.addEventListener("visibilitychange", onVis);
    cleanups.push(() => { cancelAnimationFrame(raf); raf = 0; visible = false; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); });

    updCounter(); rebuild(); sizeAll(); raf = requestAnimationFrame(loop);
    return () => { cleanups.forEach(f => f()); root.remove(); };
  },
};
