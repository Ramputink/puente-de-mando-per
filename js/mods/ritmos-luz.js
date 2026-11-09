// Simulador de ritmos de luz (IALA MBS 2022 / notación de cartas) + reto nocturno.
const ID = "ritmos-luz";

const LC = { W: "#fff7d6", R: "#ff3b30", G: "#3dff7d", Y: "#ffd21a", Bu: "#4f8cff" };
const CN = { [LC.W]: "blanca", [LC.R]: "roja", [LC.G]: "verde", [LC.Y]: "amarilla", [LC.Bu]: "azul" };

const on = (c, d) => [c, d];
const off = (d) => [null, d];
function group(c, n, a, b) { const s = []; for (let i = 0; i < n; i++) s.push(on(c, a), off(b)); return s; }
function pad(segs, period) { const tot = segs.reduce((x, s) => x + s[1], 0); if (period > tot + 1e-6) segs.push(off(+(period - tot).toFixed(3))); return segs; }
function fl(c, n, period, a = 0.5, gap = 0.7) { const s = group(c, n, a, gap); s.pop(); return pad(s, period); }
const total = (segs) => segs.reduce((x, s) => x + s[1], 0);
function litAt(segs, t) { const tot = total(segs); let x = ((t % tot) + tot) % tot; for (const s of segs) { if (x < s[1]) return s[0]; x -= s[1]; } return null; }

/* Ritmos del simulador: notación de carta, color(es), segmentos, explicación y dónde se usa */
const RH = [
  { id: "Fl", nt: "Fl G 5s", segs: fl(LC.G, 1, 5), name: "Destello (Fl)", ex: "Un destello cada periodo; la luz dura bastante menos que la oscuridad.", use: "Lateral de estribor (verde). Una roja Fl R sería de babor." },
  { id: "LFl", nt: "LFl 10s", segs: [on(LC.W, 2), off(8)], name: "Destello largo (LFl)", ex: "Destello de al menos 2 s. Blanco cada 10 s = marca de aguas navegables.", use: "Aguas navegables (recalada, eje de canal)." },
  { id: "Fl2", nt: "Fl(2) 5s", segs: fl(LC.W, 2, 5), name: "Grupos de 2 destellos", ex: "Dos destellos seguidos y oscuridad. Blanca = peligro aislado (dos esferas, dos destellos).", use: "Peligro aislado." },
  { id: "Fl3", nt: "Fl(3) G 10s", segs: fl(LC.G, 3, 10), name: "Grupos de 3 destellos", ex: "Tres destellos y oscuridad. En verde, lateral de estribor (cualquier ritmo salvo 2+1).", use: "Lateral de estribor." },
  { id: "Fl21", nt: "Fl(2+1) R 10s", segs: pad([on(LC.R, .5), off(.7), on(LC.R, .5), off(1.6), on(LC.R, .5)], 10), name: "Grupos compuestos (2+1)", ex: "Dos destellos, pausa, un destello. Reservado a las marcas de canal preferido en bifurcaciones.", use: "Roja: canal principal a estribor (marca roja con banda verde). Verde: canal principal a babor." },
  { id: "Q", nt: "Q", segs: [on(LC.W, .3), off(.7)], name: "Centelleante (Q)", ex: "50–60 centelleos por minuto, continuos. Blanca y continua = cardinal Norte.", use: "Cardinal Norte." },
  { id: "VQ", nt: "VQ", segs: [on(LC.W, .2), off(.3)], name: "Centelleante rápida (VQ)", ex: "100–120 centelleos por minuto, continuos.", use: "Cardinal Norte." },
  { id: "Q3", nt: "Q(3) 10s", segs: pad(group(LC.W, 3, .3, .7), 10), name: "Q en grupos de 3", ex: "3 centelleos cada 10 s: las 3 del reloj.", use: "Cardinal Este." },
  { id: "VQ3", nt: "VQ(3) 5s", segs: pad(group(LC.W, 3, .2, .3), 5), name: "VQ en grupos de 3", ex: "3 centelleos rápidos cada 5 s.", use: "Cardinal Este." },
  { id: "Q6", nt: "Q(6)+LFl 15s", segs: pad([...group(LC.W, 6, .3, .7), on(LC.W, 2)], 15), name: "Q(6) + destello largo", ex: "6 centelleos y un destello largo (≥ 2 s) cada 15 s: las 6 del reloj. El largo evita confundir 6 con 3 o 9.", use: "Cardinal Sur." },
  { id: "VQ6", nt: "VQ(6)+LFl 10s", segs: pad([...group(LC.W, 6, .2, .3), on(LC.W, 2)], 10), name: "VQ(6) + destello largo", ex: "6 centelleos rápidos y un destello largo cada 10 s.", use: "Cardinal Sur." },
  { id: "Q9", nt: "Q(9) 15s", segs: pad(group(LC.W, 9, .3, .7), 15), name: "Q en grupos de 9", ex: "9 centelleos cada 15 s: las 9 del reloj.", use: "Cardinal Oeste." },
  { id: "VQ9", nt: "VQ(9) 10s", segs: pad(group(LC.W, 9, .2, .3), 10), name: "VQ en grupos de 9", ex: "9 centelleos rápidos cada 10 s.", use: "Cardinal Oeste." },
  { id: "Iso", nt: "Iso 4s", segs: [on(LC.W, 2), off(2)], name: "Isofase (Iso)", ex: "Luz y oscuridad de igual duración.", use: "Aguas navegables (blanca)." },
  { id: "Oc", nt: "Oc 4s", segs: [on(LC.W, 3), off(1)], name: "Ocultaciones (Oc)", ex: "La luz dura más que la oscuridad: se «apaga» brevemente.", use: "Aguas navegables (blanca); también faros." },
  { id: "Oc2", nt: "Oc(2) 8s", segs: [on(LC.W, 5), off(1), on(LC.W, 1), off(1)], name: "Grupos de 2 ocultaciones", ex: "Dos ocultaciones seguidas en cada periodo. Característica típica de faros y luces de costa.", use: "Faros (no es característica de boyas IALA)." },
  { id: "MoA", nt: "Mo(A) 6s", segs: [on(LC.W, .5), off(.5), on(LC.W, 1.5), off(3.5)], name: "Morse «A» (· –)", ex: "Punto y raya. En blanco es exclusivo de aguas navegables.", use: "Aguas navegables." },
  { id: "MoD", nt: "Racon Mo(D)", segs: [on(LC.Bu, 1.5), off(.5), on(LC.Bu, .5), off(.5), on(LC.Bu, .5), off(3)], radar: true, name: "Morse «D» (– · ·)", ex: "No es una luz: es la señal del racon que aparece en la pantalla del radar junto a la marca de naufragio de emergencia.", use: "Marca de naufragio de emergencia (racon)." },
  { id: "AlWR", nt: "Al.WR 4s", segs: [on(LC.W, 2), on(LC.R, 2)], name: "Alternativa blanca-roja", ex: "La luz cambia de color sin apagarse. Propia de faros y luces de sector, no de boyas IALA.", use: "Faros, luces de sector." },
  { id: "AlBuY", nt: "Al.Bu.Y 3s", segs: [on(LC.Bu, 1), off(.5), on(LC.Y, 1), off(.5)], name: "Alternada azul-amarilla", ex: "1 s azul, 0,5 s oscuridad, 1 s amarilla, 0,5 s oscuridad.", use: "Naufragio de emergencia (nuevo peligro)." },
  { id: "F", nt: "F R", segs: [on(LC.R, 1)], name: "Fija (F)", ex: "Luz continua sin cambios. Nunca la usan las cardinales ni el peligro aislado.", use: "Luces de puerto, enfilaciones, obstáculos." },
  { id: "Fl4", nt: "Fl(4) R 12s", segs: fl(LC.R, 4, 12), name: "Grupos de 4 destellos", ex: "Cuatro destellos y oscuridad. Roja = lateral de babor.", use: "Lateral de babor." },
  { id: "Fl5Y", nt: "Fl(5) Y 20s", segs: fl(LC.Y, 5, 20), name: "Grupos de 5 destellos amarillos", ex: "Amarilla con ritmo no reservado = marca especial.", use: "Marca especial." },
];
const byId = Object.fromEntries(RH.map((r) => [r.id, r]));

/* Reto: luz -> marca y qué hacer */
const MK = {
  bab: { n: "Lateral de babor", p: "Entrando, dejarla por babor" },
  est: { n: "Lateral de estribor", p: "Entrando, dejarla por estribor" },
  pe: { n: "Canal preferido: principal a estribor", p: "Por el canal principal, dejarla por babor (seguir a estribor)" },
  pb: { n: "Canal preferido: principal a babor", p: "Por el canal principal, dejarla por estribor (seguir a babor)" },
  N: { n: "Cardinal Norte", p: "Pasar por el Norte de la marca" },
  E: { n: "Cardinal Este", p: "Pasar por el Este de la marca" },
  S: { n: "Cardinal Sur", p: "Pasar por el Sur de la marca" },
  W: { n: "Cardinal Oeste", p: "Pasar por el Oeste de la marca" },
  pa: { n: "Peligro aislado", p: "Pasar por cualquier lado, lejos, tras consultar la carta" },
  an: { n: "Aguas navegables", p: "Pasar por cualquier lado: aguas seguras alrededor" },
  es: { n: "Marca especial", p: "No indica paso: consultar la carta (zona especial)" },
  nf: { n: "Naufragio de emergencia", p: "Peligro nuevo no cartografiado: darle amplio resguardo" },
};
const CH = [
  { segs: fl(LC.G, 1, 5), k: "est", why: "Verde con cualquier ritmo salvo (2+1) = lateral de estribor." },
  { segs: fl(LC.G, 3, 9), k: "est", why: "Verde Fl(3): lateral de estribor." },
  { segs: fl(LC.R, 4, 12), k: "bab", why: "Roja Fl(4): lateral de babor." },
  { segs: fl(LC.R, 2, 6), k: "bab", why: "Roja Fl(2): lateral de babor (las rojas de grupos de 2 no son de peligro aislado: ese es blanco)." },
  { segs: byId.Fl21.segs, k: "pe", why: "Roja Fl(2+1): marca roja con banda verde; el canal principal sigue a estribor." },
  { segs: pad([on(LC.G, .5), off(.7), on(LC.G, .5), off(1.6), on(LC.G, .5)], 10), k: "pb", why: "Verde Fl(2+1): marca verde con banda roja; el canal principal sigue a babor." },
  { segs: byId.Q.segs, k: "N", why: "Blanca continua Q: Norte (las 12, sin grupos)." },
  { segs: byId.VQ.segs, k: "N", why: "Blanca continua VQ: Norte." },
  { segs: byId.Q3.segs, k: "E", why: "3 centelleos: las 3 del reloj, Este." },
  { segs: byId.VQ3.segs, k: "E", why: "3 centelleos rápidos cada 5 s: Este." },
  { segs: byId.Q6.segs, k: "S", why: "6 centelleos + destello largo: Sur." },
  { segs: byId.VQ6.segs, k: "S", why: "6 centelleos rápidos + destello largo: Sur." },
  { segs: byId.Q9.segs, k: "W", why: "9 centelleos: las 9, Oeste." },
  { segs: byId.VQ9.segs, k: "W", why: "9 centelleos rápidos: Oeste." },
  { segs: byId.Fl2.segs, k: "pa", why: "Blanca Fl(2): peligro aislado (dos esferas, dos destellos)." },
  { segs: byId.LFl.segs, k: "an", why: "Blanca, un destello largo cada 10 s: aguas navegables." },
  { segs: byId.MoA.segs, k: "an", why: "Blanca Mo(A): exclusiva de aguas navegables." },
  { segs: byId.Iso.segs, k: "an", why: "Blanca isofase: aguas navegables." },
  { segs: byId.Fl5Y.segs, k: "es", why: "Amarilla Fl(5) 20 s: marca especial." },
  { segs: byId.AlBuY.segs, k: "nf", why: "Azul y amarilla alternadas: naufragio de emergencia." },
];
const ROUND = 8;

const CSS = `
.m-${ID} { display:flex; flex-direction:column; gap:1rem; }
.m-${ID} .lay { display:grid; gap:1rem; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); }
@media (max-width:720px){ .m-${ID} .lay { grid-template-columns:1fr; } }
.m-${ID} .stage { aspect-ratio: 16/10; }
.m-${ID} .list { display:flex; flex-wrap:wrap; gap:.35rem; }
.m-${ID} .list button { font:600 .8rem var(--f-mono); padding:.3em .6em; border-radius:999px; border:1px solid var(--line); background:var(--sheet); color:var(--ink); cursor:pointer; }
.m-${ID} .list button[aria-pressed="true"] { background:var(--ink); color:var(--paper); border-color:var(--ink); }
.m-${ID} .nt { font:700 clamp(1.4rem,4vw,2rem)/1 var(--f-mono); letter-spacing:.02em; }
.m-${ID} .tl { display:block; width:100%; height:26px; border-radius:var(--r-sm); }
.m-${ID} .opts { display:grid; gap:.45rem; grid-template-columns:repeat(auto-fit, minmax(min(100%,210px),1fr)); }
.m-${ID} .opts .btn { justify-content:flex-start; text-align:left; font-weight:600; }
.m-${ID} .opts .btn.ok { border-color:var(--ok); color:var(--ok); }
.m-${ID} .opts .btn.bad { border-color:var(--bad); color:var(--bad); }
.m-${ID} .dots { display:flex; gap:4px; }
.m-${ID} .dots i { width:10px; height:10px; border-radius:50%; background:var(--line); display:block; }
.m-${ID} .dots i.ok { background:var(--ok); } .m-${ID} .dots i.bad { background:var(--bad); } .m-${ID} .dots i.cur { outline:2px solid var(--accent); }
`;

const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (n) => String(+n.toFixed(1)).replace(".", ",");

export default {
  id: ID,
  tema: 5,
  title: "Simulador de ritmos de luz",
  icon: "◐",
  desc: "Ve en tiempo real cada ritmo (Fl, Q, VQ, Iso, Oc, Mo, Al…) con su notación de carta, y reconoce de noche qué marca es y por dónde pasar.",
  mount(root, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) { const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = CSS; document.head.appendChild(s); }
    const wrap = document.createElement("div"); wrap.className = `m-${ID}`; root.appendChild(wrap);
    wrap.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <div><div class="eyebrow">Tema 5 · Ritmos y características de las luces</div><h3 data-r="h">Simulador</h3></div>
        <div class="seg" role="group" aria-label="Modo"><button data-mode="sim">Simulador</button><button data-mode="reto">Reto nocturno</button></div>
      </div>
      <div class="lay">
        <div class="stack">
          <div class="stage night"><canvas data-r="cv" aria-label="Luz en la noche"></canvas></div>
          <svg class="tl" data-r="tl" viewBox="0 0 1000 26" preserveAspectRatio="none" aria-hidden="true"></svg>
        </div>
        <div class="stack" data-r="side"></div>
      </div>`;
    const R = (n) => wrap.querySelector(`[data-r="${n}"]`);
    const cv = R("cv"), g = cv.getContext("2d"), tlSvg = R("tl"), side = R("side");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mode = "sim", cur = byId[ctx.store.get("sel", "Q6")] || byId.Q6, segs = cur.segs, tStart = performance.now() / 1000;
    let showTl = true, radar = false;
    const stars = Array.from({ length: 60 }, () => [Math.random(), Math.random() * 0.55, Math.random() * 1.2 + .3]);

    /* ---------- lienzo ---------- */
    let W = 0, H = 0, dpr = 1;
    function resize() { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(1, r.width); H = Math.max(1, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ro = new ResizeObserver(() => { resize(); draw(); }); ro.observe(cv);
    function draw() {
      if (!W) return;
      const t = performance.now() / 1000 - tStart;
      const c = litAt(segs, t);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = "#050c13"; g.fillRect(0, 0, W, H);
      const hz = H * 0.62;
      if (radar) { drawRadar(t, c); return; }
      // estrellas y mar
      g.fillStyle = "rgba(255,255,255,.55)"; for (const [x, y, r] of stars) { g.beginPath(); g.arc(x * W, y * H, r * .7, 0, 7); g.fill(); }
      const sea = g.createLinearGradient(0, hz, 0, H); sea.addColorStop(0, "#0b1d2a"); sea.addColorStop(1, "#04090e"); g.fillStyle = sea; g.fillRect(0, hz, W, H - hz);
      // silueta de la estructura (mini-faro de boya)
      const cx = W / 2, s = Math.min(W, H) / 260, top = hz - 70 * s;
      g.fillStyle = "#0e161d"; g.beginPath(); g.moveTo(cx - 30 * s, hz + 8 * s); g.lineTo(cx + 30 * s, hz + 8 * s); g.lineTo(cx + 22 * s, hz - 10 * s); g.lineTo(cx + 9 * s, hz - 10 * s); g.lineTo(cx + 6 * s, top); g.lineTo(cx - 6 * s, top); g.lineTo(cx - 9 * s, hz - 10 * s); g.lineTo(cx - 22 * s, hz - 10 * s); g.closePath(); g.fill();
      const ly = top - 8 * s;
      if (c) {
        const R1 = 70 * s; const gr = g.createRadialGradient(cx, ly, 0, cx, ly, R1);
        gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.12, c); gr.addColorStop(0.4, c + "55"); gr.addColorStop(1, c + "00");
        g.fillStyle = gr; g.beginPath(); g.arc(cx, ly, R1, 0, 7); g.fill();
        // reflejo en el agua
        const rf = g.createLinearGradient(0, hz, 0, H); rf.addColorStop(0, c + "66"); rf.addColorStop(1, c + "00");
        g.fillStyle = rf; g.fillRect(cx - 6 * s, hz + 9 * s, 12 * s, H - hz);
      } else { g.fillStyle = "#1a242d"; g.beginPath(); g.arc(cx, ly, 4 * s, 0, 7); g.fill(); }
      // segundero (ayuda a contar, sin desvelar el ritmo)
      g.fillStyle = "rgba(255,255,255,.55)"; g.font = `600 ${Math.max(11, 12 * s)}px ${getComputedStyle(document.documentElement).getPropertyValue("--f-mono") || "monospace"}`;
      g.fillText(`t = ${Math.floor(t)} s`, 10, H - 10);
      if (mode === "sim" && showTl) { const tot = total(segs); headX = ((t % tot) / tot) * 1000; }
    }
    function drawRadar(t, c) {
      const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.44;
      g.strokeStyle = "rgba(80,255,140,.25)"; g.lineWidth = 1;
      for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(cx, cy, r * i / 3, 0, 7); g.stroke(); }
      g.beginPath(); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.moveTo(cx, cy - r); g.lineTo(cx, cy + r); g.stroke();
      const ang = (t * 1.2) % (Math.PI * 2);
      g.strokeStyle = "rgba(80,255,140,.7)"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); g.stroke();
      // eco de la marca y código Morse D radial (raya, punto, punto)
      const bx = cx + r * .2, by = cy - r * .35;
      g.fillStyle = "#6dff9e"; g.beginPath(); g.arc(bx, by, 4, 0, 7); g.fill();
      const ux = (bx - cx) / Math.hypot(bx - cx, by - cy), uy = (by - cy) / Math.hypot(bx - cx, by - cy);
      g.lineWidth = 5; g.lineCap = "round"; g.strokeStyle = "#6dff9e";
      const segsD = [[10, 34], [44, 50], [60, 66]];
      if (c) for (const [a, b] of segsD) { g.beginPath(); g.moveTo(bx + ux * a, by + uy * a); g.lineTo(bx + ux * b, by + uy * b); g.stroke(); }
      g.lineWidth = 1; g.fillStyle = "rgba(255,255,255,.6)"; g.font = "600 12px monospace"; g.fillText("Radar · racon «D»", 10, 18);
      const tot = total(segs); headX = ((t % tot) / tot) * 1000;
    }
    let headX = 0;
    function timeline() {
      const tot = total(segs); let x = 0, out = `<rect width="1000" height="26" fill="#0d1a24"/>`;
      for (const [c, d] of segs) { if (c) out += `<rect x="${(x / tot * 1000).toFixed(1)}" y="4" width="${Math.max(2, d / tot * 1000).toFixed(1)}" height="18" fill="${c}"/>`; x += d; }
      // marcas de segundo
      for (let s = 1; s < tot; s++) out += `<rect x="${(s / tot * 1000).toFixed(1)}" y="0" width="1" height="4" fill="#ffffff55"/>`;
      tlSvg.innerHTML = out + `<rect data-h x="0" y="0" width="3" height="26" fill="#ff5ad1"/>`;
    }

    /* ---------- modo simulador ---------- */
    function simRender() {
      radar = !!cur.radar; segs = cur.segs; tStart = performance.now() / 1000; showTl = true;
      tlSvg.style.visibility = "visible"; timeline();
      R("h").textContent = "Simulador";
      const cols = [...new Set(cur.segs.filter((s) => s[0]).map((s) => CN[s[0]]))].join(" y ");
      side.innerHTML = `
        <div class="panel stack">
          <div class="eyebrow">Notación de carta</div>
          <div class="nt">${cur.nt}</div>
          <div class="row"><span class="chip">${cur.name}</span><span class="chip">${cur.radar ? "señal radar" : "luz " + cols}</span><span class="chip">periodo ${fmt(total(cur.segs))} s</span></div>
          <p>${cur.ex}</p>
          <p class="small"><strong>Dónde la verás:</strong> ${cur.use}</p>
        </div>
        <div class="list" role="group" aria-label="Ritmos">${RH.map((r) => `<button data-id="${r.id}" aria-pressed="${r.id === cur.id}">${r.nt}</button>`).join("")}</div>
        <p class="small muted">Q = 50–60 centelleos/min · VQ = 100–120/min · LFl ≥ 2 s. Cardinales: reloj 12-3-6-9 (N continua, E 3, S 6 + largo, W 9).</p>`;
      side.querySelectorAll(".list button").forEach((b) => b.onclick = () => { cur = byId[b.dataset.id]; ctx.store.set("sel", cur.id); simRender(); });
    }

    /* ---------- modo reto ---------- */
    let round = null;
    function newRound() {
      const items = shuffle(CH).slice(0, ROUND).map((c) => ({ ...c, step: 0, ok: null }));
      round = { i: 0, items, fails: 0 };
    }
    function retoRender() {
      radar = false; showTl = false; tlSvg.style.visibility = "hidden";
      R("h").textContent = "Reto nocturno";
      const dots = `<div class="dots" aria-hidden="true">${round.items.map((x, i) => `<i class="${x.ok === true ? "ok" : x.ok === false ? "bad" : i === round.i ? "cur" : ""}"></i>`).join("")}</div>`;
      if (round.i >= ROUND) {
        const ok = round.items.filter((x) => x.ok).length;
        segs = [off(1)];
        side.innerHTML = `<div class="panel stack">${dots}<h3>${ok} de ${ROUND}</h3><p>${ok === ROUND ? "Ronda perfecta: tienes ojo de faro." : "Repasa en el simulador los ritmos fallados."}</p><button class="btn primary" data-a="again">Otra ronda</button></div>`;
        side.querySelector('[data-a="again"]').onclick = () => { newRound(); retoRender(); };
        return;
      }
      const it = round.items[round.i];
      segs = it.segs; if (it.step === 0) tStart = performance.now() / 1000;
      const keys = Object.keys(MK);
      if (!it.opts) {
        // opciones de marca: la correcta + 3 distractores plausibles
        it.opts = shuffle([it.k, ...shuffle(keys.filter((k) => k !== it.k)).slice(0, 3)]);
        it.popts = shuffle([it.k, ...shuffle(keys.filter((k) => k !== it.k && MK[k].p !== MK[it.k].p)).slice(0, 2)]);
      }
      const step = it.step;
      side.innerHTML = `<div class="panel stack">
        <div class="row" style="justify-content:space-between"><span class="eyebrow">Luz ${round.i + 1} de ${ROUND}</span>${dots}</div>
        <p><strong>${step === 0 ? "¿Qué marca es?" : "¿Qué haces con ella?"}</strong> <span class="small muted">${step === 0 ? "Observa al menos un ciclo completo." : MK[it.k].n}</span></p>
        <div class="opts">${(step === 0 ? it.opts : it.popts).map((k) => `<button class="btn" data-k="${k}">${step === 0 ? MK[k].n : MK[k].p}</button>`).join("")}</div>
        <div data-r="fb" aria-live="polite"></div></div>`;
      side.querySelectorAll(".opts .btn").forEach((b) => b.onclick = () => answer(it, b.dataset.k, b));
    }
    function answer(it, k, btn) {
      const good = k === it.k;
      side.querySelectorAll(".opts .btn").forEach((x) => { x.disabled = true; if (x.dataset.k === it.k) x.classList.add("ok"); else if (x === btn) x.classList.add("bad"); });
      const fb = side.querySelector('[data-r="fb"]');
      if (!good) it.ok = false;
      if (it.step === 0 && good) { it.step = 1; ctx.award(5, "Luz identificada"); setTimeout(retoRender, reduce ? 200 : 650); return; }
      if (it.step === 1 && good && it.ok !== false) { it.ok = true; ctx.award(5, "Paso correcto"); }
      const nt = RH.find((r) => r.segs === it.segs)?.nt;
      fb.innerHTML = `<p class="${good ? "fb-ok" : "fb-bad"}" style="margin-top:.5rem">${good ? "Correcto." : "No."} ${MK[it.k].n}: ${MK[it.k].p.toLowerCase()}.</p><p class="small">${it.why}${nt ? ` Notación: <span class="mono">${nt}</span>.` : ""}</p><button class="btn primary sm" style="margin-top:.5rem" data-a="next">${round.i + 1 < ROUND ? "Siguiente luz" : "Ver resultado"}</button>`;
      fb.querySelector('[data-a="next"]').onclick = () => {
        round.i++;
        if (round.i >= ROUND && round.items.every((x) => x.ok)) { ctx.award(40, "Ronda de luces perfecta"); ctx.badge("ojo-de-faro"); ctx.toast("Insignia: Ojo de faro"); }
        retoRender();
      };
    }

    function setMode(m) {
      mode = m; wrap.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
      if (m === "sim") simRender(); else { if (!round || round.i >= ROUND) newRound(); retoRender(); }
    }
    wrap.querySelectorAll("[data-mode]").forEach((b) => b.onclick = () => setMode(b.dataset.mode));

    /* ---------- bucle ---------- */
    let raf = 0, vis = true;
    function loop() {
      raf = 0; draw();
      const h = tlSvg.querySelector("[data-h]"); if (h && showTl) h.setAttribute("x", (headX - 1.5).toFixed(1));
      if (vis) raf = requestAnimationFrame(loop);
    }
    const io = new IntersectionObserver((es) => { vis = es.some((e) => e.isIntersecting); if (vis && !raf) raf = requestAnimationFrame(loop); });
    io.observe(wrap);
    resize(); setMode("sim"); raf = requestAnimationFrame(loop);
    return () => { vis = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); wrap.remove(); };
  },
};
