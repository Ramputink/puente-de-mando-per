// Entrenador de cálculo náutico «sin calculadora»: Ct, rumbos, demoras, marcaciones, cuadrantales, v·t, coordenadas.
const ID = "navcalc";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = (a) => ((a % 360) + 360) % 360;
const fx = (v, d = 1) => { const r = Math.round(v * 10 ** d) / 10 ** d; return (Number.isInteger(r) ? String(r) : r.toFixed(d)).replace(".", ","); };
const d3 = (v) => String(Math.round(norm(v)) % 360).padStart(3, "0") + "°";
const sgn = (v, u = "°") => (v > 0 ? "+" : v < 0 ? "−" : "") + fx(Math.abs(v)) + u;
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const hm = (m) => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const ROSA16 = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

export function cuad(c) { // circular → cuadrantal
  c = norm(Math.round(c));
  if (c === 0) return "N"; if (c === 90) return "E"; if (c === 180) return "S"; if (c === 270) return "W";
  if (c < 90) return `N${c}E`; if (c < 180) return `S${180 - c}E`; if (c < 270) return `S${c - 180}W`; return `N${360 - c}W`;
}
export function circ(s) { // cuadrantal → circular
  const m = String(s).toUpperCase().replace(/[º°\s]/g, "").replace("O", "W").match(/^([NS])(\d+(?:[.,]\d+)?)([EW])$/); if (!m) return NaN;
  const a = parseFloat(m[2].replace(",", ".")); if (a > 90) return NaN;
  if (m[1] === "N") return m[3] === "E" ? a : norm(360 - a); return m[3] === "E" ? 180 - a : 180 + a;
}
function parseSigned(s) { // "−3", "3W", "3 E", "+2", "2 er", "5 br"
  let t = String(s).trim().toUpperCase().replace("−", "-").replace(",", ".").replace(/[º°′']/g, "");
  let sign = 1; if (/(W|BR|BABOR|S)$/.test(t)) sign = -1; t = t.replace(/(ER|BR|ESTRIBOR|BABOR|E|W|N|S)$/, "").trim();
  const v = parseFloat(t); return Number.isFinite(v) ? v * sign : NaN;
}
const parseHM = (s) => { const m = String(s).trim().match(/^(\d{1,2})[:h.,](\d{2})$/); return m ? +m[1] * 60 + +m[2] : NaN; };
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

const CSS = `
.m-navcalc [hidden]{display:none!important}
.m-navcalc input[type=text]{min-height:34px;padding:.2em .45em;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);color:var(--ink);width:5em}
.m-navcalc .m-navcalc-rosa{max-width:340px;width:100%;margin:0 auto;aspect-ratio:1;touch-action:none;cursor:grab}
.m-navcalc .m-navcalc-rosa svg{width:100%;height:100%;display:block}
.m-navcalc .m-navcalc-read{font-family:var(--f-mono);font-size:.92rem;display:flex;flex-direction:column;gap:.2rem}
.m-navcalc .m-navcalc-read b{color:var(--accent)}
.m-navcalc .m-navcalc-big{font-family:var(--f-display);font-size:1.9rem;font-weight:600;line-height:1}
.m-navcalc .m-navcalc-steps{border-left:3px solid var(--accent);background:var(--sea);padding:.5rem .8rem;border-radius:0 var(--r-sm) var(--r-sm) 0;font-size:.93rem}
.m-navcalc .m-navcalc-steps div{margin:.15rem 0}
.m-navcalc .m-navcalc-types{gap:.35rem}
.m-navcalc .m-navcalc-types .btn[aria-pressed=true]{background:var(--ink);color:var(--paper)}
.m-navcalc .m-navcalc-rules td{font-family:var(--f-mono);font-size:.82rem}
.m-navcalc .m-navcalc-rules td:first-child{white-space:nowrap}
.m-navcalc label{display:inline-flex;align-items:center;gap:.35rem;white-space:nowrap}
`;

const TYPES = {
  ct: "Ct = dm + Δ", rv: "Rv = Ra + Ct", ra: "Ra = Rv − Ct", dv: "Dv = Da + Ct", dvm: "Dv = Rv + M", marc: "Marcación", ctenf: "Ct por enfilación",
  q2c: "Cuadrantal → circular", c2q: "Circular → cuadrantal", dist: "d = v × t", tiempo: "t = d / v", llegada: "Hora de llegada", dlat: "Δ latitud", dlon: "Δ longitud", dmy: "Declinación del año",
};

export default {
  id: ID,
  tema: 10,
  title: "Cálculo náutico sin calculadora",
  icon: "✣",
  desc: "Rosa de los vientos, corrección total, rumbos y demoras, marcaciones, cuadrantales, velocidad-tiempo y coordenadas con corrección paso a paso.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) { const st = document.createElement("style"); st.dataset.mod = ID; st.textContent = CSS; document.head.appendChild(st); }
    const store = ctx.store || { get: (k, d) => d, set() {} };
    const cleanups = []; const on = (t, e, f, o) => { t.addEventListener(e, f, o); cleanups.push(() => t.removeEventListener(e, f, o)); };
    let rv = store.get("rv", 145), dm = store.get("dm", -2), dv = store.get("dvi", 1);

    el.innerHTML = `
<div class="m-navcalc stack">
  <div class="grid">
    <div class="panel stack">
      <div class="row" style="justify-content:space-between"><h4>Rosa y agujas</h4><span class="small muted">Arrastra la proa</span></div>
      <div class="m-navcalc-rosa" role="slider" tabindex="0" aria-label="Rumbo verdadero" aria-valuemin="0" aria-valuemax="359"></div>
      <div class="row"><label>dm <input type="text" data-i="dm" value="${fx(Math.abs(dm))}"></label><span class="seg" data-g="dms"><button type="button" data-v="E" aria-pressed="${dm > 0}">E (+)</button><button type="button" data-v="W" aria-pressed="${dm <= 0}">W (−)</button></span></div>
      <div class="row"><label>Δ <input type="text" data-i="dv" value="${fx(Math.abs(dv))}"></label><span class="seg" data-g="dvs"><button type="button" data-v="+" aria-pressed="${dv >= 0}">+</button><button type="button" data-v="-" aria-pressed="${dv < 0}">−</button></span><label>Rv <input type="text" data-i="rv" value="${Math.round(rv)}"></label></div>
    </div>
    <div class="panel stack">
      <span class="eyebrow">Lectura</span>
      <div class="m-navcalc-big" data-big></div>
      <div class="m-navcalc-read" data-read></div>
      <table class="m-navcalc-rules"><tbody>
        <tr><td>Ct = dm + Δ</td><td>E y + suman; W y − restan</td></tr>
        <tr><td>Rv = Ra + Ct</td><td>Ra = Rv − Ct</td></tr>
        <tr><td>Dv = Da + Ct</td><td>Da = Dv − Ct</td></tr>
        <tr><td>Dv = Rv + M</td><td>M estribor +, babor −</td></tr>
        <tr><td>Rm = Ra + Δ</td><td>Rv = Rm + dm</td></tr>
        <tr><td>d = v · t</td><td>t (min) = d · 60 / v</td></tr>
      </tbody></table>
    </div>
  </div>
  <div class="panel stack">
    <div class="row" style="justify-content:space-between"><h4>Práctica</h4><span class="chip ok" data-streak>racha 0</span></div>
    <div class="row m-navcalc-types">${Object.entries(TYPES).map(([k, v]) => `<button type="button" class="btn sm" data-t="${k}" aria-pressed="false">${v}</button>`).join("")}</div>
    <p class="small muted">Sin seleccionar ninguno, salen todos mezclados. Signos: escribe −3 o 3W para negativos; marcaciones +Er / −Br.</p>
    <div data-ex></div>
  </div>
</div>`;
    const $ = (s) => el.querySelector(s);
    const rosaEl = $(".m-navcalc-rosa");

    // ----- Rosa -----
    function svgRosa() {
      const ct = dm + dv, ra = norm(rv - ct), rm = norm(rv - dm);
      const P = (a, r) => [Math.sin((a * Math.PI) / 180) * r, -Math.cos((a * Math.PI) / 180) * r];
      let ticks = "";
      for (let a = 0; a < 360; a += 5) { const L = a % 30 === 0 ? 12 : a % 10 === 0 ? 8 : 4; const [x1, y1] = P(a, 140), [x2, y2] = P(a, 140 - L); ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink)" stroke-width="${a % 30 ? 1 : 1.6}"/>`; if (a % 30 === 0 && a % 90) { const [x, y] = P(a, 116); ticks += `<text x="${x}" y="${y}" font-size="11" text-anchor="middle" dominant-baseline="middle" fill="var(--muted)" font-family="var(--f-mono)">${String(a).padStart(3, "0")}</text>`; } }
      ROSA16.forEach((n, i) => { const a = i * 22.5, [x, y] = P(a, i % 4 === 0 ? 100 : 96); ticks += `<text x="${x}" y="${y}" font-size="${i % 4 === 0 ? 17 : i % 2 === 0 ? 11 : 8.5}" font-weight="${i % 4 === 0 ? 700 : 600}" text-anchor="middle" dominant-baseline="middle" fill="${i % 4 === 0 ? "var(--ink)" : "var(--muted)"}" font-family="var(--f-display)">${n}</text>`; });
      const arrow = (a, r, col, lab, w = 2, dash = "") => { const [x, y] = P(a, r), [lx, ly] = P(a, r + 9); return `<line x1="0" y1="0" x2="${x}" y2="${y}" stroke="${col}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ""}/><text x="${lx}" y="${ly}" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="${col}" font-family="var(--f-mono)" font-weight="700">${lab}</text>`; };
      const [hx, hy] = P(rv, 128);
      return `<svg viewBox="-150 -150 300 300" aria-hidden="true">
<circle r="140" fill="var(--sheet)" stroke="var(--line)"/><circle r="128" fill="none" stroke="var(--line)"/>${ticks}
${arrow(0, 70, "var(--ink)", "Nv")}${arrow(dm, 64, "var(--stbd)", "Nm", 2, "5 3")}${arrow(dm + dv, 58, "var(--warn)", "Na", 2, "2 3")}
<line x1="0" y1="0" x2="${hx}" y2="${hy}" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="8" fill="var(--accent)"/>
<circle r="4" fill="var(--ink)"/></svg>`;
    }
    function render() {
      const ct = dm + dv, ra = norm(rv - ct), rm = norm(rv - dm), i16 = Math.round(norm(rv) / 22.5) % 16;
      rosaEl.innerHTML = svgRosa(); rosaEl.setAttribute("aria-valuenow", Math.round(rv));
      $("[data-big]").textContent = `Rv ${d3(rv)} = ${cuad(rv)}`;
      $("[data-read]").innerHTML = [
        `Rumbo de la rosa más próximo: <b>${ROSA16[i16]}</b> (${fx(i16 * 22.5)}°)`,
        `Ct = dm + Δ = (${sgn(dm)}) + (${sgn(dv)}) = <b>${sgn(ct)}</b>`,
        `Ra = Rv − Ct = ${d3(rv)} − (${sgn(ct)}) = <b>${d3(ra)}</b> (${cuad(ra)})`,
        `Rm = Rv − dm = <b>${d3(rm)}</b> · Rm = Ra + Δ = ${d3(ra)} ${dv >= 0 ? "+" : "−"} ${fx(Math.abs(dv))}°`,
        `Dv a un objeto por el través de estribor: ${d3(rv + 90)}; de babor: ${d3(rv - 90)}`,
      ].map((s) => `<div>${s}</div>`).join("");
      store.set("rv", rv); store.set("dm", dm); store.set("dvi", dv);
    }
    let drag = false;
    const angFrom = (e) => { const r = rosaEl.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; return norm((Math.atan2(x, -y) * 180) / Math.PI); };
    on(rosaEl, "pointerdown", (e) => { drag = true; rosaEl.setPointerCapture?.(e.pointerId); rv = Math.round(angFrom(e)); $('[data-i="rv"]').value = rv; render(); });
    on(rosaEl, "pointermove", (e) => { if (!drag) return; rv = Math.round(angFrom(e)); $('[data-i="rv"]').value = rv; render(); });
    on(rosaEl, "pointerup", () => (drag = false)); on(rosaEl, "pointercancel", () => (drag = false));
    on(rosaEl, "keydown", (e) => { const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]; if (k) { e.preventDefault(); rv = norm(rv + k * (e.shiftKey ? 10 : 1)); $('[data-i="rv"]').value = rv; render(); } });
    const readInputs = () => {
      const a = parseFloat($('[data-i="dm"]').value.replace(",", ".")) || 0, b = parseFloat($('[data-i="dv"]').value.replace(",", ".")) || 0;
      dm = (el.querySelector('[data-g="dms"] [aria-pressed="true"]').dataset.v === "E" ? 1 : -1) * Math.abs(a);
      dv = (el.querySelector('[data-g="dvs"] [aria-pressed="true"]').dataset.v === "+" ? 1 : -1) * Math.abs(b);
      const r = parseFloat($('[data-i="rv"]').value.replace(",", ".")); if (Number.isFinite(r)) rv = norm(r);
      render();
    };
    el.querySelectorAll("[data-i]").forEach((i) => on(i, "input", readInputs));
    on(el, "click", (e) => { const b = e.target.closest(".seg[data-g] button"); if (b) { b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); readInputs(); } });
    render();

    // ----- Práctica -----
    const exEl = $("[data-ex]"); let sel = new Set(store.get("types", [])), cur = null, streak = 0;
    el.querySelectorAll("[data-t]").forEach((b) => { b.setAttribute("aria-pressed", String(sel.has(b.dataset.t))); on(b, "click", () => { sel.has(b.dataset.t) ? sel.delete(b.dataset.t) : sel.add(b.dataset.t); b.setAttribute("aria-pressed", String(sel.has(b.dataset.t))); store.set("types", [...sel]); next(); }); });
    const dmTxt = (v) => `${fx(Math.abs(v))}°${v >= 0 ? "E" : "W"}`, dvTxt = (v) => `${fx(Math.abs(v))}° (${v >= 0 ? "+" : "−"})`;
    function gen(t) {
      const dmv = pick([-1, 1]) * pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]), dvv = pick([-1, 1]) * pick([0, 0.5, 1, 1.5, 2, 3, 4, 6]), ct = dmv + dvv;
      const ctLine = `Ct = dm + Δ = (${sgn(dmv)}) + (${sgn(dvv)}) = ${sgn(ct)}`;
      switch (t) {
        case "ct": return { q: `Declinación magnética ${dmTxt(dmv)} y desvío ${dvTxt(dvv)}. ¿Corrección total?`, a: ct, kind: "num", steps: [`dm ${dmTxt(dmv)} → ${sgn(dmv)} (E positiva, W negativa)`, `Δ ${dvTxt(dvv)} → ${sgn(dvv)}`, ctLine] };
        case "rv": { const ra = ri(0, 359); return { q: `Ra = ${d3(ra)}, dm ${dmTxt(dmv)}, Δ ${dvTxt(dvv)}. ¿Rumbo verdadero?`, a: norm(ra + ct), kind: "deg", steps: [ctLine, `Rv = Ra + Ct = ${d3(ra)} ${ct >= 0 ? "+" : "−"} ${fx(Math.abs(ct))}° = ${fx(norm(ra + ct))}°`] }; }
        case "ra": { const r = ri(0, 359); return { q: `Queremos hacer Rv = ${d3(r)}. dm ${dmTxt(dmv)}, Δ ${dvTxt(dvv)}. ¿Qué rumbo de aguja damos?`, a: norm(r - ct), kind: "deg", steps: [ctLine, `Ra = Rv − Ct = ${d3(r)} − (${sgn(ct)}) = ${fx(norm(r - ct))}°`] }; }
        case "dv": { const da = ri(0, 359); return { q: `Demora de aguja a un faro ${d3(da)}; Ct = ${sgn(ct)}. ¿Demora verdadera?`, a: norm(da + ct), kind: "deg", steps: [`Dv = Da + Ct = ${d3(da)} ${ct >= 0 ? "+" : "−"} ${fx(Math.abs(ct))}° = ${fx(norm(da + ct))}°`, `Se traza desde el faro la opuesta: ${fx(norm(da + ct + 180))}°`] }; }
        case "dvm": { const r = ri(0, 359), m = ri(5, 175), side = pick([1, -1]); return { q: `Navegamos a Rv = ${d3(r)} y marcamos un faro ${m}° por ${side > 0 ? "estribor" : "babor"}. ¿Demora verdadera?`, a: norm(r + side * m), kind: "deg", steps: [`Marcación por ${side > 0 ? "estribor: +" : "babor: −"}${m}°`, `Dv = Rv + M = ${d3(r)} ${side > 0 ? "+" : "−"} ${m}° = ${fx(norm(r + side * m))}°`] }; }
        case "marc": { const r = ri(0, 359), m = ri(5, 175) * pick([1, -1]), d = norm(r + m); return { q: `Rv = ${d3(r)}, Dv al faro = ${d3(d)}. ¿Marcación? (+ estribor, − babor)`, a: m, kind: "num", steps: [`M = Dv − Rv = ${d3(d)} − ${d3(r)} = ${sgn(m)} (si sale > 180°, réstale 360°)`, `${m > 0 ? "Positiva: por estribor" : "Negativa: por babor"}`] }; }
        case "ctenf": { const dvE = ri(0, 359), da = norm(dvE - ct); return { q: `En la enfilación de dos faros la carta da Dv = ${d3(dvE)}; la aguja marca Da = ${d3(da)}. ¿Corrección total?`, a: ct, kind: "num", steps: [`Ct = Dv − Da = ${d3(dvE)} − ${d3(da)} = ${sgn(ct)}`, `Si conoces dm, el desvío es Δ = Ct − dm.`] }; }
        case "q2c": { const c = ri(1, 359); return { q: `Expresa en circular el rumbo ${cuad(c)}.`, a: c, kind: "deg", steps: [`N…E: el número tal cual · S…E: 180 − n · S…W: 180 + n · N…W: 360 − n`, `${cuad(c)} = ${c}°`] }; }
        case "c2q": { const c = ri(1, 359); return { q: `Expresa en cuadrantal el rumbo ${d3(c)} (p. ej. S35E).`, a: c, kind: "cuad", steps: [`0–90 → N n E · 90–180 → S (180−n) E · 180–270 → S (n−180) W · 270–360 → N (360−n) W`, `${d3(c)} = ${cuad(c)}`] }; }
        case "dist": { const v = pick([4, 5, 6, 7, 8, 9, 10, 12, 15]), m = pick([12, 15, 18, 20, 24, 30, 36, 40, 45, 48, 54, 72, 84, 90, 96, 105, 120, 150]); return { q: `A ${v} nudos durante ${Math.floor(m / 60)} h ${m % 60} min, ¿cuántas millas recorremos?`, a: (v * m) / 60, kind: "num", tol: 0.1, steps: [`t = ${m} min = ${fx(m / 60, 2)} h`, `d = v × t = ${v} × ${fx(m / 60, 2)} = ${fx((v * m) / 60, 2)} millas`, `Truco: a ${v} nudos se hace 1 milla cada ${fx(60 / v, 1)} min`] }; }
        case "tiempo": { const v = pick([5, 6, 8, 10, 12, 15]), d = pick([3, 4.5, 5, 6, 7.5, 9, 10, 12, 13.5, 15, 18, 20]); const m = (d * 60) / v; return { q: `Distancia ${fx(d)} millas a ${v} nudos. ¿Cuánto tardamos? (h:mm)`, a: m, kind: "time", tol: 1, steps: [`t = d / v = ${fx(d)} / ${v} h = ${fx(d)} × 60 / ${v} min = ${fx(m)} min = ${hm(m)}`] }; }
        case "llegada": { const v = pick([5, 6, 8, 10, 12]), d = pick([4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18]), h0 = ri(0, 23) * 60 + pick([0, 10, 15, 20, 30, 45]), m = (d * 60) / v; return { q: `Salimos a HRB ${hm(h0)} a ${v} nudos. ¿A qué hora llegamos al través de un faro situado a ${d} millas sobre la derrota? (hh:mm)`, a: h0 + m, kind: "clock", tol: 1, steps: [`t = ${d} × 60 / ${v} = ${fx(m)} min`, `HRB = ${hm(h0)} + ${fx(m)} min = ${hm(h0 + m)}`] }; }
        case "dlat": { const l1 = 35 * 60 + ri(40, 80) + ri(0, 9) / 10, l2 = 35 * 60 + ri(40, 80) + ri(0, 9) / 10, dl = l2 - l1; const f = (v) => `${Math.floor(v / 60)}° ${fx(v % 60).padStart(2, "0")}′ N`; return { q: `Salida l = ${f(l1)}; llegada l = ${f(l2)}. ¿Diferencia de latitud en minutos? (+ hacia el N, − hacia el S)`, a: dl, kind: "num", tol: 0.05, steps: [`Pasa todo a minutos: ${fx(l1)}′ y ${fx(l2)}′`, `Δl = ${fx(l2)} − ${fx(l1)} = ${sgn(dl, "′")} → ${fx(Math.abs(dl))}′ ${dl >= 0 ? "N" : "S"} = ${fx(Math.abs(dl))} millas en meridiano`] }; }
        case "dlon": { const L1 = 5 * 60 + ri(15, 75) + ri(0, 9) / 10, L2 = 5 * 60 + ri(15, 75) + ri(0, 9) / 10, dL = -(L2 - L1); const f = (v) => `${String(Math.floor(v / 60)).padStart(3, "0")}° ${fx(v % 60)}′ W`; return { q: `Salida L = ${f(L1)}; llegada L = ${f(L2)}. ¿Diferencia de longitud en minutos? (+ hacia el E, − hacia el W)`, a: dL, kind: "num", tol: 0.05, steps: [`Longitudes W: al aumentar el valor vamos hacia el W`, `ΔL = ${fx(L1)}′ − ${fx(L2)}′ = ${sgn(dL, "′")} → ${fx(Math.abs(dL))}′ ${dL >= 0 ? "E" : "W"}`, `Ojo: un minuto de longitud NO es una milla (en 36° vale ≈ 0,81 millas). Las distancias se miden en la escala de latitudes.`] }; }
        case "dmy": { const y0 = pick([2005, 2007, 2010]), base = ri(100, 200), ch = pick([6, 7, 8]), y = pick([2022, 2024, 2025, 2026]), now = base - (y - y0) * ch; return { q: `La rosa de la carta indica dm ${Math.floor(base / 60)}°${String(base % 60).padStart(2, "0")}′W (${y0}), decremento anual ${ch}′. ¿dm en ${y}, en minutos? (W negativo, E positivo)`, a: -now, kind: "num", tol: 0.5, steps: [`Años transcurridos: ${y} − ${y0} = ${y - y0}`, `Variación: ${y - y0} × ${ch}′ = ${(y - y0) * ch}′ (decrece la declinación W)`, `dm = ${base}′ − ${(y - y0) * ch}′ = ${now}′ ${now >= 0 ? "W" : "E"} = ${Math.floor(Math.abs(now) / 60)}°${String(Math.abs(now) % 60).padStart(2, "0")}′${now >= 0 ? "W" : "E"} → ${sgn(-now, "′")}`] }; }
      }
    }
    function next() {
      const pool = sel.size ? [...sel] : Object.keys(TYPES); const t = pick(pool); cur = { t, ...gen(t), done: false };
      const ph = { num: "número con signo", deg: "grados", cuad: "p. ej. S35E", time: "h:mm", clock: "hh:mm" }[cur.kind];
      exEl.innerHTML = `<div class="tint stack"><span class="eyebrow">${esc(TYPES[t])}</span><p>${esc(cur.q)}</p>
<div class="row"><input type="text" data-ans placeholder="${ph}" aria-label="Respuesta"><button type="button" class="btn sm primary" data-chk>Comprobar</button><button type="button" class="btn sm" data-next>Otro</button></div><div data-fb></div></div>`;
    }
    function check() {
      if (!cur || cur.done) return; const raw = exEl.querySelector("[data-ans]").value; let good, shown;
      if (cur.kind === "deg") { const v = parseFloat(raw.replace(",", ".")); if (!Number.isFinite(v)) return ctx.toast("Escribe los grados"); good = angDiff(v, cur.a) <= 0.6; shown = fx(norm(cur.a)) + "°"; }
      else if (cur.kind === "cuad") { const v = circ(raw); if (!Number.isFinite(v)) return ctx.toast("Formato: N35E, S20W…"); good = angDiff(v, cur.a) < 0.5; shown = cuad(cur.a); }
      else if (cur.kind === "time" || cur.kind === "clock") { const v = parseHM(raw); if (!Number.isFinite(v)) return ctx.toast("Formato h:mm"); good = cur.kind === "time" ? Math.abs(v - cur.a) <= (cur.tol || 1) : angDiff(v / 4, cur.a / 4) * 4 <= (cur.tol || 1); shown = hm(cur.a); }
      else { const v = parseSigned(raw); if (!Number.isFinite(v)) return ctx.toast("Escribe un número"); good = Math.abs(v - cur.a) <= (cur.tol ?? 0.05); shown = sgn(cur.a, cur.t === "dist" ? " M" : cur.t.startsWith("dl") || cur.t === "dmy" ? "′" : "°"); }
      cur.done = true; streak = good ? streak + 1 : 0; $("[data-streak]").textContent = `racha ${streak}`;
      if (good) { ctx.award(5, "Cálculo náutico correcto"); if (streak && streak % 10 === 0) ctx.award(30, "Racha de 10 cálculos"); }
      exEl.querySelector("[data-fb]").innerHTML = `<p class="${good ? "fb-ok" : "fb-bad"}">${good ? "Correcto." : `No. Resultado: ${esc(shown)}`}</p><div class="m-navcalc-steps">${cur.steps.map((s) => `<div>${esc(s)}</div>`).join("")}</div>`;
    }
    on(exEl, "click", (e) => { if (e.target.closest("[data-chk]")) check(); else if (e.target.closest("[data-next]")) next(); });
    on(exEl, "keydown", (e) => { if (e.key === "Enter" && e.target.matches("[data-ans]")) { cur?.done ? next() : check(); } });
    next();
    return () => { cleanups.forEach((f) => { try { f(); } catch {} }); el.innerHTML = ""; };
  },
};
