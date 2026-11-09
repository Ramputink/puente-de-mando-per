// ripa-sonidos — Señales acústicas y luminosas del RIPA (Reglas 32–37 y Anexo IV) con Web Audio

const ID = "ripa-sonidos";
const SHORT = 1, LONG = 5, GAP = 1, BELL = 5;

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
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- secuencias ---------- */
// s corta · l larga · r corta rápida · b campana rápida (5 s) · g gong rápido (5 s) · k golpe de campana · f destello (1 s) · q destello rápido · c sonido continuo · o «otra señal eficaz» · w pausa
const P = s => s.split(" ").filter(Boolean).map(t => { const [k, d] = t.split(":"); return { k, d: d ? +d : null }; });
const LIB = [
  { id: "c1", g: "R34 · Maniobra a la vista", name: "Una pitada corta", seq: P("s"), mean: "«Caigo a estribor»", rule: "R34 a i)", who: "Buque de propulsión mecánica a la vista de otro, maniobrando según el reglamento." },
  { id: "c2", g: "R34 · Maniobra a la vista", name: "Dos pitadas cortas", seq: P("s w s"), mean: "«Caigo a babor»", rule: "R34 a ii)", who: "Buque de propulsión mecánica a la vista." },
  { id: "c3", g: "R34 · Maniobra a la vista", name: "Tres pitadas cortas", seq: P("s w s w s"), mean: "«Estoy dando atrás»", rule: "R34 a iii)", who: "Buque de propulsión mecánica a la vista, con máquina atrás (no significa necesariamente que vaya hacia atrás)." },
  { id: "c5", g: "R34 · Maniobra a la vista", name: "Cinco o más cortas y rápidas", seq: P("r w:0.35 r w:0.35 r w:0.35 r w:0.35 r"), mean: "Duda: «no entiendo sus intenciones / dudo de que maniobre a tiempo»", rule: "R34 d)", who: "Cualquier buque a la vista de otro. Puede completarse con al menos cinco destellos cortos y rápidos." },
  { id: "a1", g: "R34 · Canal angosto", name: "Dos largas y una corta", seq: P("l w l w s"), mean: "«Pretendo alcanzarle por su banda de estribor»", rule: "R34 c i)", who: "Buque que pretende alcanzar a otro en un canal o paso angosto, cuando el alcanzado debe maniobrar." },
  { id: "a2", g: "R34 · Canal angosto", name: "Dos largas y dos cortas", seq: P("l w l w s w s"), mean: "«Pretendo alcanzarle por su banda de babor»", rule: "R34 c i)", who: "Buque que alcanza en canal angosto." },
  { id: "a3", g: "R34 · Canal angosto", name: "Larga, corta, larga, corta", seq: P("l w s w l w s"), mean: "Conformidad del buque alcanzado", rule: "R34 c ii)", who: "El buque que va a ser alcanzado, si está de acuerdo (si duda: cinco cortas)." },
  { id: "rc", g: "R34 · Canal angosto", name: "Una pitada larga (recodo)", seq: P("l"), mean: "Me aproximo a un recodo con visión obstruida", rule: "R34 e), R9 f)", who: "Buque que se aproxima a un recodo; cualquier buque al otro lado que la oiga contesta con otra pitada larga." },
  { id: "f1", g: "R34 · Señales luminosas", name: "Un destello", seq: P("f"), light: true, mean: "«Caigo a estribor»", rule: "R34 b i)", who: "Complemento potestativo de la pitada; se repite mientras dura la maniobra." },
  { id: "f2", g: "R34 · Señales luminosas", name: "Dos destellos", seq: P("f w f"), light: true, mean: "«Caigo a babor»", rule: "R34 b i)", who: "Destellos de ~1 s, separados ~1 s; ≥ 10 s entre señales sucesivas." },
  { id: "f3", g: "R34 · Señales luminosas", name: "Tres destellos", seq: P("f w f w f"), light: true, mean: "«Estoy dando atrás»", rule: "R34 b i)", who: "Luz blanca todo horizonte visible ≥ 5 millas (R34 b iii)." },
  { id: "f5", g: "R34 · Señales luminosas", name: "Cinco o más destellos cortos y rápidos", seq: P("q w:0.3 q w:0.3 q w:0.3 q w:0.3 q"), light: true, mean: "Duda", rule: "R34 d)", who: "Complemento de las cinco pitadas cortas y rápidas." },
  { id: "n1", g: "R35 · Visibilidad reducida", name: "Una larga cada ≤ 2 min", seq: P("l"), rep: "cada ≤ 2 min", mean: "Propulsión mecánica en navegación, con arrancada", rule: "R35 a)", who: "También la unidad compuesta (empujador + empujado rígidos) con arrancada (R35 f)." },
  { id: "n2", g: "R35 · Visibilidad reducida", name: "Dos largas cada ≤ 2 min", seq: P("l w:2 l"), rep: "cada ≤ 2 min", mean: "Propulsión mecánica en navegación, parado y sin arrancada", rule: "R35 b)", who: "Las dos largas separadas por un intervalo de unos 2 s." },
  { id: "n3", g: "R35 · Visibilidad reducida", name: "Una larga y dos cortas cada ≤ 2 min", seq: P("l w s w s"), rep: "cada ≤ 2 min", mean: "Sin gobierno, maniobra restringida, restringido por su calado, vela, pesca, remolcando o empujando", rule: "R35 c), d)", who: "También pesca fondeado y maniobra restringida fondeado (R35 d), en lugar de la campana." },
  { id: "n4", g: "R35 · Visibilidad reducida", name: "Una larga y tres cortas cada ≤ 2 min", seq: P("l w s w s w s"), rep: "cada ≤ 2 min", mean: "Buque remolcado (el último del remolque, si va tripulado)", rule: "R35 e)", who: "Se emite, si es posible, inmediatamente después de la señal del remolcador." },
  { id: "n5", g: "R35 · Visibilidad reducida", name: "Cuatro cortas", seq: P("s w s w s w s"), mean: "Señal de identidad del práctico en servicio", rule: "R35 k)", who: "Además de su señal de navegación (1 larga o 2 largas) o de fondeo." },
  { id: "b1", g: "R35 · Fondeados y varados", name: "Campana rápida 5 s cada ≤ 1 min", seq: P("b"), rep: "cada ≤ 1 min", mean: "Buque fondeado (< 100 m)", rule: "R35 g)", who: "Repique rápido de campana de unos 5 s en la parte de proa." },
  { id: "b2", g: "R35 · Fondeados y varados", name: "Campana a proa y gong a popa", seq: P("b g"), rep: "cada ≤ 1 min", mean: "Buque fondeado de eslora ≥ 100 m", rule: "R35 g)", who: "Campana a proa e inmediatamente después gong a popa, ~5 s cada uno." },
  { id: "b3", g: "R35 · Fondeados y varados", name: "Corta, larga, corta", seq: P("s w l w s"), mean: "Fondeado que advierte de su posición y del riesgo de abordaje a un buque que se aproxima", rule: "R35 g)", who: "Es opcional y se añade a la campana." },
  { id: "b4", g: "R35 · Fondeados y varados", name: "3 golpes + campana + 3 golpes", seq: P("k k k b k k k"), rep: "cada ≤ 1 min", mean: "Buque varado", rule: "R35 h)", who: "Tres golpes de campana separados y claros antes y después del repique (≥ 100 m, además gong). Puede añadir una pitada apropiada." },
  { id: "o1", g: "R35 · Esloras pequeñas", name: "Otra señal acústica eficaz", seq: P("o w o"), rep: "cada ≤ 2 min", mean: "Buque < 12 m que no emite las señales de R35", rule: "R35 i), j)", who: "Los < 12 m no están obligados a las señales de R35 si emiten otra señal eficaz; los de 12–20 m no están obligados a la campana de fondeo/varada (R35 i)." },
  { id: "d1", g: "R37 · Peligro", name: "Sonido continuo", seq: P("c"), mean: "Peligro y necesidad de ayuda", rule: "R37, Anexo IV b)", who: "Con cualquier aparato de señales de niebla." },
];
const BYID = Object.fromEntries(LIB.map(x => [x.id, x]));
const glyph = seq => seq.filter(e => e.k !== "w").map(e => ({ s: "●", r: "•", l: "▬▬", b: "campana", g: "gong", k: "†", f: "◉", q: "◦", c: "▬▬▬▬", o: "señal" })[e.k]).join(" ");

/* ---------- audio ---------- */
function makeAudio() {
  let ac = null, bus = null;
  const ensure = () => {
    if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); }
    if (ac.state === "suspended") ac.resume();
    return ac;
  };
  const newBus = () => {
    if (bus) { try { bus.gain.cancelScheduledValues(0); bus.disconnect(); } catch {} }
    const comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
    bus = ac.createGain(); bus.gain.value = 0.8; bus.connect(comp); bus._c = comp; return bus;
  };
  function whistle(t, d, out, hi = false) {
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = hi ? 2600 : 1500; lp.Q.value = 0.7;
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32, t + 0.06); g.gain.setValueAtTime(0.32, t + d - 0.09); g.gain.linearRampToValueAtTime(0, t + d);
    lp.connect(g); g.connect(out);
    for (const [f, a] of hi ? [[440, .5], [554, .35]] : [[165, .55], [247, .4], [330, .18]]) {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.linearRampToValueAtTime(f, t + 0.12);
      const og = ac.createGain(); og.gain.value = a; o.connect(og); og.connect(lp); o.start(t); o.stop(t + d + 0.05);
    }
  }
  function strike(t, out, base, parts, vol) {
    for (const [r, dec, a] of parts) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = base * r;
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0008, t + dec);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dec + 0.05);
    }
  }
  const BELLP = [[1, 1.4, 1], [2.32, 0.9, .55], [2.76, 0.7, .4], [4.07, 0.45, .25], [5.4, 0.3, .15]];
  const GONGP = [[1, 3.2, 1], [1.52, 2.4, .6], [2.0, 1.8, .45], [2.63, 1.3, .3], [3.5, 0.9, .2]];
  function bell(t, d, out) { for (let x = 0; x < d - 0.05; x += 0.13) strike(t + x, out, 820 * (1 + (Math.random() - .5) * .004), BELLP, 0.16 * (0.8 + Math.random() * .4)); }
  function gong(t, d, out) { for (let x = 0; x < d - 0.1; x += 0.3) strike(t + x, out, 118, GONGP, 0.26 * (0.8 + Math.random() * .3)); }
  function play(timeline) {
    if (!ensure()) return null; const out = newBus(); const t0 = ac.currentTime + 0.08;
    for (const ev of timeline) {
      const t = t0 + ev.t;
      if (ev.k === "s" || ev.k === "l" || ev.k === "r" || ev.k === "c") whistle(t, ev.d, out);
      else if (ev.k === "o") whistle(t, ev.d, out, true);
      else if (ev.k === "b") bell(t, ev.d, out);
      else if (ev.k === "g") gong(t, ev.d, out);
      else if (ev.k === "k") strike(t, out, 820, BELLP, 0.3);
    }
    return t0;
  }
  return { ensure, play, now: () => ac ? ac.currentTime : 0, stop: () => { if (bus) { try { bus.gain.setTargetAtTime(0, ac.currentTime, 0.02); const b = bus; setTimeout(() => { try { b.disconnect(); b._c.disconnect(); } catch {} }, 200); } catch {} bus = null; } },
    close: () => { try { ac && ac.close(); } catch {} } };
}
function timeline(seq, fast) {
  const D = { s: SHORT, r: 0.55, l: fast ? 2 : LONG, b: fast ? 2 : BELL, g: fast ? 2 : BELL, k: 0.25, f: 1, q: 0.35, c: fast ? 4 : 8, o: 0.6 };
  const out = []; let t = 0; let prev = null;
  for (const e of seq) {
    if (e.k === "w") { t += e.d ?? GAP; prev = null; continue; }
    if (prev && prev !== "k" && e.k !== "k") t += 0.15; // pequeña separación entre bloques contiguos
    if (prev === "k" && e.k === "k") t += 0.45;
    if (prev === "k" && e.k !== "k" || prev && prev !== "k" && e.k === "k") t += 0.6;
    const d = D[e.k]; out.push({ k: e.k, t, d, fast: fast && ["l", "b", "g", "c"].includes(e.k) }); t += d; prev = e.k;
  }
  return { ev: out, total: t };
}

/* ---------- quiz ---------- */
const SITU = [
  { q: "Navegas a motor a la vista de otro buque y vas a caer a estribor.", a: "c1" },
  { q: "Navegas a motor a la vista de otro buque y vas a caer a babor.", a: "c2" },
  { q: "Navegas a motor a la vista de otro buque y das máquina atrás.", a: "c3" },
  { q: "No entiendes las intenciones del buque que se te acerca, a la vista.", a: "c5" },
  { q: "En un canal angosto quieres alcanzar a otro por su banda de estribor.", a: "a1" },
  { q: "En un canal angosto quieres alcanzar a otro por su banda de babor.", a: "a2" },
  { q: "En un canal angosto te piden paso para alcanzarte y estás de acuerdo.", a: "a3" },
  { q: "Te aproximas a un recodo de un canal con la visión obstruida.", a: "rc" },
  { q: "Niebla. Navegas a motor con arrancada.", a: "n1" },
  { q: "Niebla. Navegas a motor, parado y sin arrancada.", a: "n2" },
  { q: "Niebla. Navegas a vela.", a: "n3" },
  { q: "Niebla. Eres el último buque de un remolque y llevas tripulación.", a: "n4" },
  { q: "Niebla. Estás fondeado con un buque de 40 m.", a: "b1" },
  { q: "Niebla. Estás fondeado con un buque de 120 m.", a: "b2" },
  { q: "Niebla. Estás varado con un buque de 30 m.", a: "b4" },
  { q: "Estás en peligro y necesitas ayuda; solo tienes la bocina de niebla.", a: "d1" },
];
const CSS = `
.m-${ID} [hidden]{display:none!important}
.m-${ID} .lay{display:grid;gap:1rem;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr)}
@media (max-width:820px){.m-${ID} .lay{grid-template-columns:minmax(0,1fr)}}
.m-${ID} .lib{display:flex;flex-direction:column;gap:.25rem;max-height:560px;overflow:auto;padding-right:.2rem}
.m-${ID} .lib .eyebrow{margin-top:.6rem}
.m-${ID} .item{display:flex;gap:.6rem;align-items:center;justify-content:space-between;text-align:left;border:1px solid var(--line);background:var(--sheet);border-radius:var(--r-sm);padding:.4rem .6rem;cursor:pointer;color:var(--ink);font:inherit}
.m-${ID} .item:hover{background:var(--sea)}
.m-${ID} .item[aria-current="true"]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
.m-${ID} .item .gl{font-family:var(--f-mono);color:var(--accent);white-space:nowrap;font-size:.85rem}
.m-${ID} .item .nm{font-weight:600;font-size:.92rem;line-height:1.2}
.m-${ID} .track{position:relative;display:flex;align-items:center;gap:0;height:56px;background:var(--sea);border-radius:var(--r-sm);padding:0 10px;overflow:hidden}
.m-${ID} .blk{position:absolute;top:16px;height:24px;border-radius:4px;background:var(--ink);opacity:.85;transition:opacity .1s,transform .1s}
.m-${ID} .blk.f,.m-${ID} .blk.q{background:var(--buoy-y)}
.m-${ID} .blk.b{background:repeating-linear-gradient(90deg,var(--warn) 0 4px,transparent 4px 7px);opacity:1}
.m-${ID} .blk.g{background:repeating-linear-gradient(90deg,var(--accent) 0 6px,transparent 6px 10px);opacity:1}
.m-${ID} .blk.k{background:var(--warn);width:6px!important;border-radius:3px}
.m-${ID} .blk.o{background:var(--muted)}
.m-${ID} .blk.fast{background-image:repeating-linear-gradient(135deg,transparent 0 5px,color-mix(in srgb,var(--paper) 55%,transparent) 5px 8px)}
.m-${ID} .blk.on{opacity:1;transform:scaleY(1.35);box-shadow:0 0 0 2px var(--accent)}
.m-${ID} .head{position:absolute;top:6px;bottom:6px;width:2px;background:var(--accent);left:10px}
.m-${ID} .axis{display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:.72rem;color:var(--muted)}
.m-${ID} .lamp{width:64px;height:64px;border-radius:50%;background:var(--night);border:2px solid var(--line);flex:none;transition:box-shadow .05s,background .05s}
.m-${ID} .lamp.on{background:#fffbe6;box-shadow:0 0 22px 8px rgba(255,248,214,.85)}
.m-${ID} .horn{font-family:var(--f-display);font-size:1.4rem;font-weight:700;min-width:7ch;color:var(--muted)}
.m-${ID} .horn.on{color:var(--accent)}
.m-${ID} .choices{display:grid;gap:.4rem}
.m-${ID} .choices .btn{justify-content:flex-start;text-align:left;font-weight:500;white-space:normal;line-height:1.25}
.m-${ID} .choices .btn.ok{border-color:var(--ok);color:var(--ok);font-weight:700}
.m-${ID} .choices .btn.bad{border-color:var(--bad);color:var(--bad)}
.m-${ID} .hd{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:space-between;align-items:flex-end}
.m-${ID} .mono-gl{font-family:var(--f-mono);letter-spacing:.06em}
`;

export default {
  id: ID, tema: 6, title: "Pitadas, campana y gong", icon: "♪",
  desc: "Escucha y visualiza las señales de las Reglas 34, 35 y 37 (pitadas cortas y largas, campana, gong, destellos) y reconócelas de oído.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) document.head.append(h("style", { "data-mod": ID }, CSS));
    const store = ctx.store || { get: (k, d) => d, set() {} };
    const au = makeAudio();
    const root = h("div", { class: `m-${ID} stack` }); el.append(root);
    const st = { cur: LIB[0], fast: store.get("fast", true), playing: null, mode: "lib", q: null, score: store.get("score", 0), n: 0, ok: 0 };
    let raf = 0;

    const MODES = [["lib", "Biblioteca"], ["quiz", "¿Qué has oído?"], ["def", "Definiciones"]];
    const seg = h("div", { class: "seg", role: "group", "aria-label": "Modo" });
    for (const [k, l] of MODES) seg.append(h("button", { type: "button", "aria-pressed": String(k === st.mode), onclick: () => setMode(k) }, l));
    root.append(h("div", { class: "hd" }, h("div", null, h("div", { class: "eyebrow" }, "Tema 6 · RIPA Parte D · Reglas 32–37"), h("h3", null, "Señales acústicas y luminosas")), seg));

    /* reproductor común */
    const track = h("div", { class: "track", "aria-hidden": "true" }); const head = h("div", { class: "head" });
    const axis = h("div", { class: "axis" });
    const lamp = h("div", { class: "lamp", "aria-hidden": "true" }); const horn = h("div", { class: "horn", "aria-live": "off" }, "—");
    const fastBtn = h("button", { type: "button", class: "btn sm", "aria-pressed": String(st.fast), onclick: () => { st.fast = !st.fast; store.set("fast", st.fast); fastBtn.setAttribute("aria-pressed", String(st.fast)); fastBtn.classList.toggle("primary", st.fast); fastBtn.textContent = st.fast ? "Largas aceleradas (2 s)" : "Largas reales (5 s)"; if (st.mode === "lib") showSeq(st.cur); } }, st.fast ? "Largas aceleradas (2 s)" : "Largas reales (5 s)");
    fastBtn.classList.toggle("primary", st.fast);
    function renderTrack(seq) {
      const tl = timeline(seq, st.fast); track.textContent = ""; const W = Math.max(tl.total, 4);
      for (const e of tl.ev) track.append(h("div", { class: `blk ${e.k}${e.fast ? " fast" : ""}`, style: `left:calc(10px + (100% - 20px) * ${e.t / W});width:calc((100% - 20px) * ${e.d / W})`, title: e.k }));
      track.append(head); axis.textContent = ""; axis.append(h("span", null, "0 s"), h("span", null, `${tl.total.toFixed(1).replace(".", ",")} s${st.fast && tl.ev.some(e => e.fast) ? " · acelerado" : ""}`));
      return { tl, W };
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; au.stop(); lamp.classList.remove("on"); horn.classList.remove("on"); horn.textContent = "—"; [...track.querySelectorAll(".blk")].forEach(b => b.classList.remove("on")); st.playing = null; }
    function playSeq(seq, onEnd) {
      stop(); const { tl, W } = renderTrack(seq);
      const hasSound = tl.ev.some(e => !["f", "q"].includes(e.k));
      let t0;
      if (hasSound) { t0 = au.play(tl.ev); if (t0 == null) { ctx.toast("Este navegador no permite audio."); return; } }
      const start = performance.now() / 1000 + (hasSound ? 0.08 : 0);
      const now = () => performance.now() / 1000 - start; // reloj de pared: robusto aunque el AudioContext tarde en reanudarse
      const blks = [...track.querySelectorAll(".blk")]; st.playing = seq;
      const NAMES = { s: "corta", r: "corta", l: "larga", b: "campana", g: "gong", k: "golpe", f: "destello", q: "destello", c: "continuo", o: "señal" };
      const tick = () => {
        const t = now(); head.style.left = `calc(10px + (100% - 20px) * ${Math.max(0, Math.min(1, t / W))})`;
        let act = null; tl.ev.forEach((e, i) => { const on = t >= e.t && t < e.t + e.d; blks[i].classList.toggle("on", on); if (on) act = e; });
        lamp.classList.toggle("on", !!act && (act.k === "f" || act.k === "q"));
        horn.classList.toggle("on", !!act && !(act.k === "f" || act.k === "q")); horn.textContent = act ? NAMES[act.k] : "—";
        if (t > tl.total + 0.2) { stop(); renderTrack(seq); onEnd && onEnd(); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    const player = () => h("div", { class: "stack", style: "gap:.5rem" }, h("div", { class: "row", style: "gap:1rem;flex-wrap:nowrap" }, lamp, horn), track, axis);

    /* biblioteca */
    const list = h("div", { class: "lib", role: "list" });
    let lastG = "";
    for (const it of LIB) {
      if (it.g !== lastG) { list.append(h("div", { class: "eyebrow" }, it.g)); lastG = it.g; }
      list.append(h("button", { type: "button", class: "item", "data-id": it.id, role: "listitem", onclick: () => { st.cur = it; showSeq(it); playSeq(it.seq); } },
        h("span", { class: "nm" }, it.name, h("br"), h("span", { class: "small muted", style: "font-weight:400" }, it.mean)), h("span", { class: "gl" }, glyph(it.seq))));
    }
    const detail = h("div", { class: "stack" });
    const playBtn = h("button", { type: "button", class: "btn primary", onclick: () => playSeq(st.cur.seq) }, "Reproducir");
    const stopBtn = h("button", { type: "button", class: "btn", onclick: () => stop() }, "Parar");
    const libPanel = h("div", { class: "panel stack" });
    function showSeq(it) {
      stop(); [...list.querySelectorAll(".item")].forEach(b => b.setAttribute("aria-current", String(b.dataset.id === it.id)));
      renderTrack(it.seq); detail.textContent = "";
      detail.append(h("div", { class: "row", style: "justify-content:space-between" }, h("h4", null, it.name), h("span", { class: "chip acc" }, it.rule)),
        h("p", null, h("b", null, it.mean), it.rep ? h("span", { class: "chip", style: "margin-left:.4rem" }, "↻ " + it.rep) : null),
        h("p", { class: "small" }, it.who),
        h("p", { class: "small muted mono-gl" }, "Secuencia: " + glyph(it.seq)));
    }
    const libRow = h("div", { class: "row" }, playBtn, stopBtn, fastBtn);
    libPanel.append(player(), libRow, detail,
      h("p", { class: "small muted" }, "● corta ≈ 1 s · • corta rápida · ▬▬ larga 4–6 s · ◉ destello ≈ 1 s · † golpe de campana. Con «largas aceleradas» las largas, la campana y el gong duran 2 s (bloques rayados) para practicar más rápido."));
    const libSec = h("section", { class: "lay" }, h("div", { class: "panel" }, list), libPanel);

    /* quiz */
    const qPanel = h("div", { class: "panel stack" }); const qPlayer = h("div", { class: "stack" });
    const scoreEl = h("span", { class: "mono small" });
    const quizSec = h("section", { class: "lay", hidden: true }, h("div", { class: "panel stack" }, h("h4", null, "Reproduce y decide"), qPlayer, h("p", { class: "small muted" }, "El audio solo empieza cuando pulsas. Puedes repetirlo cuantas veces quieras."), h("div", { class: "row" }, h("span", { class: "small muted" }, "Aciertos"), scoreEl)), qPanel);
    function newQ() {
      stop(); qPanel.textContent = ""; st.q = null;
      const reverse = Math.random() < 0.35;
      if (reverse) {
        const s = pick(SITU); const it = BYID[s.a];
        const others = shuffle(LIB.filter(x => x.id !== it.id && !x.light && glyph(x.seq) !== glyph(it.seq))).slice(0, 3);
        st.q = { rev: true, it, s };
        const box = h("div", { class: "choices" });
        for (const o of shuffle([it, ...others])) box.append(h("button", { type: "button", class: "btn", "data-id": o.id, onclick: () => answer(o.id, box) }, h("span", { class: "mono-gl" }, glyph(o.seq)), ` — ${o.name}`));
        qPanel.append(h("div", { class: "eyebrow" }, "¿Qué señal emites?"), h("p", null, s.q), box);
        qPlayer.textContent = ""; qPlayer.append(player()); renderTrack([]);
        return;
      }
      const it = pick(LIB);
      const mean = x => x.mean;
      const others = shuffle(LIB.filter(x => x.id !== it.id && mean(x) !== mean(it) && glyph(x.seq) !== glyph(it.seq) && !!x.light === !!it.light)).slice(0, 3);
      st.q = { rev: false, it };
      const box = h("div", { class: "choices" });
      for (const o of shuffle([it, ...others])) box.append(h("button", { type: "button", class: "btn", "data-id": o.id, onclick: () => answer(o.id, box) }, o.mean + (o.rep ? ` (${o.rep})` : "")));
      qPlayer.textContent = ""; qPlayer.append(player(), h("div", { class: "row" }, h("button", { type: "button", class: "btn primary", onclick: () => playSeq(it.seq) }, it.light ? "Ver destellos" : "Escuchar"), h("button", { type: "button", class: "btn", onclick: stop }, "Parar"), fastBtn));
      renderTrack([]);
      qPanel.append(h("div", { class: "eyebrow" }, it.light ? "¿Qué has visto?" : "¿Qué has oído?"), h("p", { class: "small muted" }, it.light ? "Un buque de propulsión mecánica, a la vista, emite esta señal luminosa." : (it.g.includes("R35") ? "Estás en visibilidad reducida." : it.g.includes("R37") ? "Lo oyes en el mar, sin saber de dónde viene." : it.g.includes("Canal") ? "Navegas por un canal o paso angosto." : "Estás a la vista de otro buque.")), box);
    }
    function answer(id, box) {
      const q = st.q; if (!q || q.done) return; q.done = true;
      const ok = id === q.it.id; st.n++; if (ok) { st.ok++; st.score++; store.set("score", st.score); ctx.award(8, "Señal RIPA reconocida"); }
      for (const b of box.children) { if (b.dataset.id === q.it.id) b.classList.add("ok"); else if (b.dataset.id === id) b.classList.add("bad"); }
      scoreEl.textContent = `${st.ok}/${st.n} · total ${st.score}`;
      const it = q.it;
      qPanel.append(h("p", { class: ok ? "fb-ok" : "fb-bad" }, ok ? "Correcto." : "No."),
        h("p", null, h("b", null, `${it.name}: `), `${it.mean} (${it.rule}). `, it.who),
        h("p", { class: "small muted mono-gl" }, glyph(it.seq) + (it.rep ? ` · ↻ ${it.rep}` : "")),
        h("div", { class: "row" }, h("button", { type: "button", class: "btn sm", onclick: () => playSeq(it.seq) }, "Volver a oír / ver"), h("button", { type: "button", class: "btn primary", onclick: newQ }, "Siguiente")));
      if (st.n % 10 === 0 && st.ok / st.n >= 0.8) ctx.award(30, "10 señales con ≥ 80 % de acierto");
    }

    /* definiciones */
    const defSec = h("section", { class: "panel stack", hidden: true, html: `
<h4>Regla 32 · Definiciones</h4>
<ul><li><b>Pito</b>: todo dispositivo capaz de producir las pitadas reglamentarias y que cumpla el Anexo III.</li>
<li><b>Pitada corta</b>: sonido de una duración aproximada de <b>1 segundo</b>.</li>
<li><b>Pitada larga</b>: sonido de una duración aproximada de <b>4 a 6 segundos</b>.</li></ul>
<h4>Regla 33 · Equipo</h4>
<div class="scroll-x"><table><thead><tr><th>Eslora</th><th>Equipo obligatorio</th></tr></thead><tbody>
<tr><td>&lt; 12 m</td><td>No obligados a pito ni campana, pero sí a llevar <b>otro medio eficaz</b> de hacer señales acústicas</td></tr>
<tr><td>≥ 12 m</td><td>Pito</td></tr>
<tr><td>≥ 20 m</td><td>Pito y campana</td></tr>
<tr><td>≥ 100 m</td><td>Pito, campana y gong (de tono que no se confunda con la campana)</td></tr>
</tbody></table></div>
<p class="small">La campana o el gong pueden sustituirse por otro equipo de iguales características acústicas, siempre que pueda accionarse manualmente.</p>
<h4>Regla 34 b) · Señales luminosas</h4>
<p class="small">Potestativas, complementan las pitadas y se repiten mientras dura la maniobra: <b>1 destello</b> caigo a estribor, <b>2</b> caigo a babor, <b>3</b> doy atrás. Destellos de ~1 s, intervalo entre destellos ~1 s y <b>≥ 10 s</b> entre señales sucesivas. Luz <b>blanca todo horizonte visible a ≥ 5 millas</b>.</p>
<h4>Regla 36 · Llamar la atención</h4>
<p class="small">Cualquier señal luminosa o acústica que no pueda confundirse con las autorizadas, o dirigir el haz de un proyector hacia el peligro sin molestar a otros buques. La luz no debe confundirse con ayudas a la navegación; se evitan las luces intermitentes o giratorias de gran intensidad (estroboscópicas). En el examen de 2023 la respuesta oficial a «la más adecuada para llamar la atención» fue <b>una luz azul continua</b>.</p>
<h4>Anexo III · Pitos</h4>
<div class="scroll-x"><table><thead><tr><th>Eslora</th><th>Frecuencia fundamental</th><th>Alcance audible</th></tr></thead><tbody>
<tr><td>≥ 200 m</td><td>70–200 Hz</td><td>2 millas</td></tr><tr><td>75–200 m</td><td>130–350 Hz</td><td>1,5 millas</td></tr>
<tr><td>20–75 m</td><td>250–700 Hz</td><td>1 milla</td></tr><tr><td>&lt; 20 m</td><td>250–700 Hz</td><td>0,5 millas</td></tr></tbody></table></div>
<p class="small muted">Cuanto mayor el buque, más grave el pito. Las señales del Anexo IV (peligro) se estudian en «Las 41 reglas».</p>` });

    root.append(libSec, quizSec, defSec);
    function setMode(k) {
      stop(); st.mode = k; [...seg.children].forEach((b, i) => b.setAttribute("aria-pressed", String(MODES[i][0] === k)));
      libSec.hidden = k !== "lib"; quizSec.hidden = k !== "quiz"; defSec.hidden = k !== "def";
      if (k === "lib") { libPanel.replaceChild(player(), libPanel.firstChild); libRow.append(fastBtn); showSeq(st.cur); }
      if (k === "quiz") newQ();
    }
    scoreEl.textContent = `0/0 · total ${st.score}`;
    showSeq(st.cur);
    const io = new IntersectionObserver(es => { if (!es.some(e => e.isIntersecting)) stop(); }); io.observe(root);
    const onVis = () => { if (document.hidden) stop(); }; document.addEventListener("visibilitychange", onVis);
    return () => { stop(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); au.close(); root.remove(); };
  },
};
