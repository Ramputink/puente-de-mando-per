// Calculadora y entrenador de mareas: curva, duodécimos, corrección por presión, hora oficial, resguardo.
const ID = "mareas";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = (s) => { const v = parseFloat(String(s).replace(",", ".")); return Number.isFinite(v) ? v : NaN; };
const fx = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toFixed(d).replace(".", ",");
const sg = (v, d = 2) => (v >= 0 ? "+" : "−") + fx(Math.abs(v), d);
const hm = (min) => { min = Math.round(min); const m = ((min % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const parseHM = (s) => { const m = String(s).trim().match(/^(\d{1,2})[:h.,]?(\d{2})$/) || String(s).trim().match(/^(\d{1,2})$/); if (!m) return NaN; const h = +m[1], mi = +(m[2] || 0); return h < 48 && mi < 60 ? h * 60 + mi : NaN; };
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const CUM = [0, 1, 3, 6, 9, 11, 12];

// Corrección por presión (tabla del Anuario, interpolada): +0,05 m cada 5 mb por debajo de 1013
export const presCorr = (mb) => Math.round((1013 - mb)) / 100;
const mmToMb = (mm) => Math.round(mm * 1.33322);

function heightAt(t, a, b, method) { // a,b = {t (min), h}
  const D = b.t - a.t, A = b.h - a.h; if (D <= 0) return a.h; const x = Math.min(Math.max((t - a.t) / D, 0), 1);
  if (method === "cos") return a.h + (A * (1 - Math.cos(Math.PI * x))) / 2;
  const u = x * 6, k = Math.min(Math.floor(u), 5), f = u - k; return a.h + (A * (CUM[k] + (CUM[k + 1] - CUM[k]) * f)) / 12;
}
function pairFor(ext, t) { for (let i = 0; i < ext.length - 1; i++) if (t >= ext[i].t && t <= ext[i + 1].t) return [ext[i], ext[i + 1]]; return null; }
function timesFor(ext, h, method) { // todas las horas a las que la altura vale h
  const out = [];
  for (let i = 0; i < ext.length - 1; i++) {
    const a = ext[i], b = ext[i + 1], lo = Math.min(a.h, b.h), hi = Math.max(a.h, b.h); if (h < lo || h > hi || a.t === b.t) continue;
    let l = a.t, r = b.t; const up = b.h > a.h;
    for (let k = 0; k < 40; k++) { const m = (l + r) / 2; const v = heightAt(m, a, b, method); if ((v < h) === up) l = m; else r = m; }
    out.push((l + r) / 2);
  }
  return out;
}

const CSS = `
.m-mareas [hidden]{display:none!important}
.m-mareas label{display:inline-flex;align-items:center;gap:.35rem;flex-wrap:wrap}
.m-mareas input[type=text],.m-mareas select{min-height:34px;padding:.2em .45em;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);color:var(--ink);max-width:100%}
.m-mareas input.w4{width:4.8em}.m-mareas input.w3{width:3.8em}
.m-mareas .m-mareas-ext{display:grid;grid-template-columns:auto auto auto;gap:.35rem .5rem;align-items:center}
.m-mareas .m-mareas-stage{height:clamp(220px,38vh,360px)}
.m-mareas .m-mareas-out{font-family:var(--f-mono);font-size:.92rem;display:flex;flex-direction:column;gap:.25rem}
.m-mareas .m-mareas-out b{color:var(--accent)}
.m-mareas .m-mareas-big{font-family:var(--f-display);font-size:2rem;font-weight:600;line-height:1}
.m-mareas .m-mareas-opts{display:flex;flex-direction:column;gap:.4rem}
.m-mareas .m-mareas-opts button{justify-content:flex-start;text-align:left;font-weight:500}
.m-mareas .m-mareas-opts button.ok{border-color:var(--ok);color:var(--ok);font-weight:700}
.m-mareas .m-mareas-opts button.bad{border-color:var(--bad);color:var(--bad)}
.m-mareas .m-mareas-viewer{border:1px solid var(--line);border-radius:var(--r);overflow:auto;max-height:65vh;background:var(--sheet)}
.m-mareas .m-mareas-viewer img{display:block;width:100%;max-width:none;height:auto}
.m-mareas .m-mareas-steps{border-left:3px solid var(--accent);background:var(--sea);padding:.5rem .8rem;border-radius:0 var(--r-sm) var(--r-sm) 0;font-size:.93rem}
.m-mareas .m-mareas-steps table{font-size:.88rem}
.m-mareas .m-mareas-chip{white-space:normal}
.m-mareas .m-mareas-ptab td,.m-mareas .m-mareas-ptab th{padding:.15em .5em;font-family:var(--f-mono);font-size:.82rem}
`;

export default {
  id: ID,
  tema: 10,
  title: "Mareas: sonda en el momento",
  icon: "∿",
  desc: "Curva de marea, regla de los duodécimos, corrección por presión, hora oficial y resguardo con datos reales del Anuario.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) { const st = document.createElement("style"); st.dataset.mod = ID; st.textContent = CSS; document.head.appendChild(st); }
    const store = ctx.store || { get: (k, d) => d, set() {} };
    let alive = true; const cleanups = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
    const getJSON = (p) => fetch(ctx.asset(p)).then((r) => { if (!r.ok) throw new Error(p); return r.json(); });
    let anu = null, QS = [];

    el.innerHTML = `
<div class="m-mareas stack">
  <div class="seg" role="group" aria-label="Modo">
    <button type="button" data-mode="calc" aria-pressed="true">Calculadora</button>
    <button type="button" data-mode="real" aria-pressed="false">Exámenes reales</button>
    <button type="button" data-mode="gen" aria-pressed="false">Ejercicios</button>
  </div>
  <section data-sec="calc" class="stack">
    <div class="grid">
      <div class="panel stack">
        <div class="row" style="justify-content:space-between"><h4>Mareas del día (UTC)</h4><button type="button" class="btn sm" data-ex>Ejemplo oficial jun-2026</button></div>
        <label class="small">Cargar del Anuario <select data-load><option value="">— día de examen —</option></select></label>
        <div class="m-mareas-ext" data-ext></div>
        <div class="row"><span class="seg" data-g="meth"><button type="button" data-v="duo" aria-pressed="true">Duodécimos</button><button type="button" data-v="cos" aria-pressed="false">Cosenoidal</button></span></div>
      </div>
      <div class="panel stack">
        <h4>Barco y atmósfera</h4>
        <div class="row"><span>Hora (UTC)</span><input type="text" class="w4" data-f="t" value="06:06"><span class="seg" data-g="ver"><button type="button" data-v="2" aria-pressed="true">Verano +2</button><button type="button" data-v="1" aria-pressed="false">Invierno +1</button></span></div>
        <input type="range" min="0" max="1439" step="1" data-f="tr" aria-label="Hora UTC">
        <div class="row"><span>Sonda en carta</span><input type="text" inputmode="decimal" class="w3" data-f="sc" value="9"><span>m · calado</span><input type="text" inputmode="decimal" class="w3" data-f="cal" value="1,5"><span>m</span></div>
        <div class="row"><span>Presión</span><input type="text" inputmode="decimal" class="w4" data-f="p" value="1003"><span class="seg" data-g="pu"><button type="button" data-v="mb" aria-pressed="true">mb</button><button type="button" data-v="mm" aria-pressed="false">mm</button></span></div>
        <div class="row"><span>¿A qué hora habrá</span><input type="text" inputmode="decimal" class="w3" data-f="obj" value="10"><span>m de sonda?</span></div>
      </div>
    </div>
    <div class="stage m-mareas-stage"><canvas aria-label="Curva de marea"></canvas></div>
    <div class="grid">
      <div class="panel stack"><span class="eyebrow">Resultado</span><div class="m-mareas-big" data-big>–</div><div class="m-mareas-out" data-out></div></div>
      <div class="tint stack small">
        <b>Cómo se calcula</b>
        <p><b>Sonda en el momento</b> = sonda en carta + altura de marea + corrección por presión. <b>Resguardo</b> = sonda en el momento − calado.</p>
        <p><b>Presión</b>: la tabla del Anuario da ±0,05 m cada 5 mb respecto de 1013 mb (≈ 1 cm por mb). Presión baja ⇒ el mar sube (+); alta ⇒ baja (−). Valores intermedios: interpola (996 mb → +0,17 m; 1035 mb → −0,22 m). 760 mm = 1013 mb.</p>
        <p><b>Horas</b>: el Anuario está en UTC. Hora oficial = UTC + 2 en verano, + 1 en invierno.</p>
        <p><b>Duodécimos</b>: en las 6 «horas de marea» (duración ÷ 6) la marea sube o baja 1, 2, 3, 3, 2 y 1 doceavos de la amplitud.</p>
        <table class="m-mareas-ptab"><thead><tr><th>mb</th><th>corr.</th><th>mb</th><th>corr.</th></tr></thead><tbody>
        ${[[963, 1018], [973, 1023], [983, 1028], [993, 1033], [1003, 1038], [1013, null]].map(([a, b]) => `<tr><td>${a}</td><td>${sg(presCorr(a))}</td><td>${b ?? ""}</td><td>${b ? sg(presCorr(b)) : ""}</td></tr>`).join("")}
        </tbody></table>
      </div>
    </div>
  </section>
  <section data-sec="real" class="stack" hidden></section>
  <section data-sec="gen" class="stack" hidden></section>
  <p class="small muted">Aciertos acumulados: <b data-score>0</b> · con 5 consigues la insignia «Marea viva».</p>
</div>`;
    const $ = (s) => el.querySelector(s);
    const segVal = (root, g) => root.querySelector(`[data-g="${g}"] [aria-pressed="true"]`)?.dataset.v;
    on(el, "click", (e) => { const b = e.target.closest(".seg[data-g] button"); if (b) { b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); calc(); } });

    // ----- puntuación -----
    const scoreEl = $("[data-score]"); scoreEl.textContent = store.get("ok", 0);
    function win(reason) { const n = store.get("ok", 0) + 1; store.set("ok", n); scoreEl.textContent = n; ctx.award(10, reason); if (n >= 5) ctx.badge("marea-viva"); }

    // ----- calculadora -----
    const extEl = $("[data-ext]");
    function setExt(list) {
      const rows = [...list, ...Array(Math.max(0, 4 - list.length)).fill({ t: "", h: "" })].slice(0, 4);
      extEl.innerHTML = `<span class="small muted">Hora</span><span class="small muted">Altura (m)</span><span></span>` + rows.map((r, i) => `<input type="text" class="w4" data-et="${i}" value="${r.t}" aria-label="Hora ${i + 1}"><input type="text" inputmode="decimal" class="w3" data-eh="${i}" value="${r.h === "" ? "" : fx(r.h)}" aria-label="Altura ${i + 1}"><span class="small muted" data-ek="${i}"></span>`).join("");
    }
    function readExt() {
      const ext = [];
      for (let i = 0; i < 4; i++) { const t = parseHM($(`[data-et="${i}"]`).value), h = num($(`[data-eh="${i}"]`).value); if (Number.isFinite(t) && Number.isFinite(h)) ext.push({ t, h, i }); }
      ext.sort((a, b) => a.t - b.t);
      let np = 0, nb = 0;
      ext.forEach((e, k) => { const nbs = [ext[k - 1], ext[k + 1]].filter(Boolean); e.tipo = nbs.every((x) => e.h > x.h) ? "P" : "B"; e.ord = e.tipo === "P" ? ++np : ++nb; });
      for (let i = 0; i < 4; i++) { const s = $(`[data-ek="${i}"]`); const e = ext.find((x) => x.i === i); s.textContent = e ? `${e.ord}.ª ${e.tipo === "P" ? "pleamar" : "bajamar"}` : ""; }
      return ext;
    }
    on(extEl, "input", () => calc());
    el.querySelectorAll('[data-sec="calc"] [data-f]').forEach((i) => on(i, "input", () => { if (i.dataset.f === "tr") $('[data-f="t"]').value = hm(+i.value); calc(); }));
    const cv = $("canvas"), stage = $(".m-mareas-stage");
    let last = null;
    function calc() {
      const ext = readExt(), method = segVal(el, "meth") || "duo";
      const t = parseHM($('[data-f="t"]').value); if (Number.isFinite(t)) $('[data-f="tr"]').value = Math.min(t, 1439);
      const sc = num($('[data-f="sc"]').value), cal = num($('[data-f="cal"]').value), ver = +(segVal(el, "ver") || 2);
      let p = num($('[data-f="p"]').value); const pu = segVal(el, "pu"); const pmb = pu === "mm" ? mmToMb(p) : p; const pc = Number.isFinite(pmb) ? presCorr(pmb) : 0;
      const out = [], pair = Number.isFinite(t) ? pairFor(ext, t) : null; let h = NaN;
      if (pair) {
        const [a, b] = pair; h = heightAt(t, a, b, method); const D = b.t - a.t, A = b.h - a.h;
        out.push(`Entre ${hm(a.t)} (${fx(a.h)} m) y ${hm(b.t)} (${fx(b.h)} m): duración ${Math.floor(D / 60)} h ${String(Math.round(D % 60)).padStart(2, "0")} min, amplitud ${fx(Math.abs(A))} m (marea ${A > 0 ? "creciente" : "vaciante"}).`);
        if (method === "duo") { const hl = D / 6, k = Math.min(Math.floor((t - a.t) / hl), 5); out.push(`«Hora de marea» = ${fx(hl, 0)} min; un doceavo = ${fx(Math.abs(A) / 12, 3)} m; a las ${hm(t)} va por la hora ${k + 1}.ª → altura ≈ <b>${fx(h)} m</b>`); }
        else out.push(`Cosenoidal: h = ${fx(a.h)} ${A >= 0 ? "+" : "−"} ${fx(Math.abs(A))}·(1 − cos(180°·${fx((t - a.t) / D, 2)}))/2 = <b>${fx(h)} m</b>`);
      } else if (Number.isFinite(t)) { const e = ext.find((x) => x.t === t); if (e) h = e.h; else out.push("La hora está fuera de las mareas introducidas."); }
      if (pu === "mm" && Number.isFinite(p)) out.push(`${fx(p, 0)} mm × 1,333 = ${pmb} mb`);
      if (Number.isFinite(pmb)) out.push(`Corrección por presión: 1013 − ${pmb} = ${fx(1013 - pmb, 0)} mb → <b>${sg(pc)} m</b>`);
      let son = NaN;
      if (Number.isFinite(h) && Number.isFinite(sc)) { son = sc + h + pc; out.push(`Sonda en el momento = ${fx(sc)} + ${fx(h)} ${pc >= 0 ? "+" : "−"} ${fx(Math.abs(pc))} = <b>${fx(son)} m</b>`); if (Number.isFinite(cal)) out.push(`Resguardo bajo la quilla = ${fx(son)} − ${fx(cal)} = <b>${fx(son - cal)} m</b>${son - cal < 0.5 ? " ⚠ escaso" : ""}`); }
      if (Number.isFinite(t)) out.push(`Hora oficial = ${hm(t)} UTC + ${ver} h = <b>${hm(t + ver * 60)}</b>`);
      const obj = num($('[data-f="obj"]').value);
      if (Number.isFinite(obj) && Number.isFinite(sc) && ext.length > 1) { const hh = obj - sc - pc; const ts = timesFor(ext, hh, method); out.push(ts.length ? `Para ${fx(obj)} m de sonda hace falta altura de marea ${fx(hh)} m → a las <b>${ts.map((x) => hm(x) + " UTC").join(", ")}</b> (${ts.map((x) => hm(x + ver * 60)).join(", ")} h. oficial)` : `Con estas mareas nunca hay ${fx(obj)} m de sonda (altura necesaria ${fx(hh)} m).`); last = { ext, method, t, h, hh, ts }; }
      else last = { ext, method, t, h };
      $("[data-big]").textContent = Number.isFinite(son) ? `${fx(son)} m` : Number.isFinite(h) ? `h = ${fx(h)} m` : "–";
      $("[data-out]").innerHTML = out.map((s) => `<div>${s}</div>`).join("");
      draw();
    }
    // curva
    let cw = 300, ch = 200, dpr = 1, raf = 0;
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    function resize() { const r = stage.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2.5); cw = Math.max(50, r.width); ch = Math.max(50, r.height); cv.width = cw * dpr; cv.height = ch * dpr; draw(); }
    function draw() { if (!raf && alive) raf = requestAnimationFrame(paint); }
    function paint() {
      raf = 0; const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, cw, ch);
      const C = { ink: css("--ink"), mut: css("--muted"), line: css("--line"), acc: css("--accent"), ok: css("--ok"), sea: css("--sea-2"), warn: css("--warn") };
      const ext = last?.ext || []; if (ext.length < 2) { c.fillStyle = C.mut; c.font = `14px ${css("--f-body")}`; c.fillText("Introduce al menos una pleamar y una bajamar.", 16, 30); return; }
      const pad = { l: 44, r: 12, t: 14, b: 26 }, t0 = Math.floor(ext[0].t / 60) * 60, t1 = Math.ceil(ext[ext.length - 1].t / 60) * 60;
      const hs = ext.map((e) => e.h); let h0 = Math.min(...hs, 0), h1 = Math.max(...hs); const sp = Math.max(h1 - h0, 0.2); h0 -= sp * 0.08; h1 += sp * 0.12;
      const X = (t) => pad.l + ((t - t0) / Math.max(t1 - t0, 1)) * (cw - pad.l - pad.r), Y = (h) => ch - pad.b - ((h - h0) / (h1 - h0)) * (ch - pad.t - pad.b);
      c.font = `11px ${css("--f-mono")}`; c.fillStyle = C.mut; c.strokeStyle = C.line; c.lineWidth = 1;
      const hstep = sp > 3 ? 1 : sp > 1.2 ? 0.5 : 0.2;
      for (let v = Math.ceil(h0 / hstep) * hstep; v <= h1; v += hstep) { const y = Y(v); c.beginPath(); c.moveTo(pad.l, y); c.lineTo(cw - pad.r, y); c.stroke(); c.fillText(fx(v, 1), 6, y + 4); }
      const tstep = (t1 - t0) / 60 > 12 ? 180 : 60;
      for (let t = t0; t <= t1; t += tstep) { const x = X(t); c.beginPath(); c.moveTo(x, pad.t); c.lineTo(x, ch - pad.b); c.stroke(); c.fillText(hm(t), x - 16, ch - 8); }
      // cero hidrográfico
      c.strokeStyle = C.mut; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(pad.l, Y(0)); c.lineTo(cw - pad.r, Y(0)); c.stroke(); c.setLineDash([]);
      // duodécimos (escalones)
      if (last.method === "duo") {
        c.fillStyle = C.sea; for (let i = 0; i < ext.length - 1; i++) { const a = ext[i], b = ext[i + 1], hl = (b.t - a.t) / 6; for (let k = 0; k < 6; k++) { const ta = a.t + k * hl, hb = heightAt(ta + hl, a, b, "duo"), ha = heightAt(ta, a, b, "duo"); c.globalAlpha = 0.45; c.fillRect(X(ta), Y(Math.max(ha, hb)), X(ta + hl) - X(ta), Math.abs(Y(ha) - Y(hb))); } } c.globalAlpha = 1;
      }
      c.strokeStyle = C.acc; c.lineWidth = 2.5; c.beginPath();
      for (let x = X(ext[0].t); x <= X(ext[ext.length - 1].t); x += 2) { const t = t0 + ((x - pad.l) / (cw - pad.l - pad.r)) * (t1 - t0); const p = pairFor(ext, t); if (!p) continue; const y = Y(heightAt(t, p[0], p[1], last.method)); x === X(ext[0].t) ? c.moveTo(x, y) : c.lineTo(x, y); }
      c.stroke();
      for (const e of ext) { c.fillStyle = C.ink; c.beginPath(); c.arc(X(e.t), Y(e.h), 3.5, 0, 7); c.fill(); c.fillText(`${e.tipo === "P" ? "PM" : "BM"} ${fx(e.h)}`, X(e.t) - 20, Y(e.h) + (e.tipo === "P" ? -8 : 16)); }
      if (Number.isFinite(last.hh)) { c.strokeStyle = C.warn; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(pad.l, Y(last.hh)); c.lineTo(cw - pad.r, Y(last.hh)); c.stroke(); c.setLineDash([]); for (const t of last.ts || []) { c.fillStyle = C.warn; c.beginPath(); c.arc(X(t), Y(last.hh), 4, 0, 7); c.fill(); } }
      if (Number.isFinite(last.t) && Number.isFinite(last.h) && last.t >= t0 && last.t <= t1) { const x = X(last.t); c.strokeStyle = C.ok; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, pad.t); c.lineTo(x, ch - pad.b); c.stroke(); c.fillStyle = C.ok; c.beginPath(); c.arc(x, Y(last.h), 5, 0, 7); c.fill(); }
    }
    const ro = new ResizeObserver(resize); ro.observe(stage); cleanups.push(() => ro.disconnect());
    if (ctx.onTheme) cleanups.push(ctx.onTheme(() => draw()));
    function loadExample() {
      setExt([{ t: "00:01", h: 0.27 }, { t: "06:06", h: 0.89 }, { t: "11:44", h: 0.24 }, { t: "18:40", h: 0.93 }].slice(1));
      $('[data-f="t"]').value = "06:06"; $('[data-f="sc"]').value = "9"; $('[data-f="p"]').value = "1003"; $('[data-f="obj"]').value = "9,5";
      el.querySelector('[data-g="pu"] [data-v="mb"]').click(); el.querySelector('[data-g="ver"] [data-v="2"]').click(); calc();
      ctx.toast("Algeciras 20-jun-2026, 1.ª pleamar 06:06 UTC 0,89 m · 1003 mb → +0,10 m · 9 + 0,89 + 0,10 = 9,99 m");
    }
    on($("[data-ex]"), "click", loadExample);
    on($("[data-load]"), "change", (e) => { const r = anu?.records?.[+e.target.value]; if (!r) return; setExt(r.mareas.map((m) => ({ t: m.t, h: m.h }))); $('[data-f="t"]').value = r.mareas[0].t; const m = String(r.fecha).slice(5, 7); el.querySelector(`[data-g="ver"] [data-v="${+m >= 4 && +m <= 10 ? 2 : 1}"]`).click(); calc(); });
    setExt([]); loadExample();

    // ----- datos -----
    (async () => {
      anu = await getJSON("data/anuario.json").catch(() => null);
      const d = await getJSON("data/questions.json").catch(() => null); QS = (d?.questions || []).filter((q) => q.b === "car");
      if (!alive) return;
      if (anu?.records) $("[data-load]").innerHTML += anu.records.map((r, i) => `<option value="${i}">${esc(r.puerto)} ${r.fecha.split("-").reverse().join("-")}</option>`).join("");
    })();

    // ----- exámenes reales -----
    const realSec = $('[data-sec="real"]'); let ridx = store.get("ridx", 0);
    function parseStem(s) {
      const sc = num((s.match(/sonda (?:en la carta|igual a)(?: es)?(?: de)? (\d+(?:,\d+)?)/i) || [])[1]);
      const pm = s.match(/(\d{3,4})\s*(mb|milibares|Mb|milímetros|mm)/i); let p = pm ? +pm[1] : NaN; if (pm && /^m(m|il[ií]m)/i.test(pm[2])) p = mmToMb(p);
      return { sc, p };
    }
    function realItems() { return (anu?.records || []).flatMap((r) => r.preguntas.map((id) => ({ r, q: QS.find((q) => q.id === id) })).filter((x) => x.q)); }
    function renderReal() {
      const items = realItems(); if (!items.length) { realSec.innerHTML = `<p class="muted">Cargando datos del Anuario…</p>`; return; }
      ridx = ((ridx % items.length) + items.length) % items.length; store.set("ridx", ridx); const { r, q } = items[ridx];
      const imgs = anu.byConvocatoria?.[r.convocatoria] || [r.image];
      realSec.innerHTML = `<div class="panel stack">
  <div class="row"><span class="eyebrow">Examen ${ridx + 1}/${items.length}</span><span class="chip m-mareas-chip">${esc((q.seen || []).join(", "))}</span></div>
  <p>${esc(q.stem)}</p>
  <div class="row">${imgs.map((f) => { const m = anu.images.find((i) => i.file === f); return `<button type="button" class="btn sm" data-img="${f}">${esc(m?.puerto ? `${m.puerto} ${m.anio} (${m.meses})` : m?.kind === "presion" ? "Tabla de presión" : m?.kind === "instante" ? "Altura en un instante" : "Coeficientes")}</button>`; }).join("")}</div>
  <div class="m-mareas-viewer" hidden></div>
  <div class="m-mareas-opts">${q.opts.map((o, i) => `<button type="button" class="btn" data-opt="${i}"><b>${"abcd"[i]})</b>&nbsp;${esc(o)}</button>`).join("")}</div>
  <div data-fb></div>
  <div class="row"><button type="button" class="btn sm" data-rn="-1">← Anterior</button><button type="button" class="btn sm" data-rn="1">Siguiente →</button></div>
</div>`;
    }
    function realSteps(r, q) {
      const { sc, p } = parseStem(q.stem), pc = Number.isFinite(p) ? presCorr(p) : 0;
      const okNums = (q.ok || []).flatMap((k) => (q.opts[k].match(/\d+,\d+/g) || []).map(num));
      let np = 0, nb = 0;
      const rows = r.mareas.map((m) => { const ord = m.tipo === "P" ? ++np : ++nb; const v = sc + m.h + pc; const hit = okNums.some((x) => Math.abs(x - v) < 0.015); return `<tr${hit ? ' class="hl"' : ""}><td>${ord}.ª ${m.tipo === "P" ? "PM" : "BM"} ${m.t} UTC</td><td>${fx(sc)} + ${fx(m.h)} ${pc >= 0 ? "+" : "−"} ${fx(Math.abs(pc))}</td><td><b>${fx(v)} m</b>${hit ? " ✓" : ""}</td></tr>`; }).join("");
      return `<div class="m-mareas-steps"><p>${esc(r.puerto)}, ${r.fecha.split("-").reverse().join("-")}. Sonda en carta ${fx(sc)} m; presión ${Number.isFinite(p) ? p + " mb" : "—"} → corrección ${sg(pc)} m (1013 − ${p} = ${fx(1013 - p, 0)} mb ≈ ${fx(1013 - p, 0)} cm).</p><div style="overflow-x:auto"><table><thead><tr><th>Marea</th><th>Carta + altura + presión</th><th>Sonda</th></tr></thead><tbody>${rows}</tbody></table></div><p class="small">La fila marcada es la que pide el enunciado. El calado no cambia la sonda (solo el resguardo). Horas del Anuario en UTC.</p></div>`;
    }
    on(realSec, "click", (e) => {
      const n = e.target.closest("[data-rn]"); if (n) { ridx += +n.dataset.rn; renderReal(); return; }
      const im = e.target.closest("[data-img]"); if (im) { const v = realSec.querySelector(".m-mareas-viewer"); const same = !v.hidden && v.dataset.f === im.dataset.img; v.hidden = same; v.dataset.f = im.dataset.img; v.innerHTML = same ? "" : `<div class="row" style="position:sticky;top:0;left:0;background:var(--sheet);padding:.3rem"><button type="button" class="btn sm" data-iz="1.4">+</button><button type="button" class="btn sm" data-iz="0.7">−</button></div><img src="${ctx.asset(im.dataset.img)}" alt="Página del Anuario de Mareas" style="width:100%">`; return; }
      const iz = e.target.closest("[data-iz]"); if (iz) { const i = realSec.querySelector(".m-mareas-viewer img"); const w = parseFloat(i.style.width) || 100; i.style.width = Math.min(Math.max(w * +iz.dataset.iz, 100), 400) + "%"; return; }
      const o = e.target.closest("[data-opt]"); if (!o || o.parentElement.dataset.done) return; o.parentElement.dataset.done = "1";
      const { r, q } = realItems()[ridx], i = +o.dataset.opt, good = (q.ok || []).includes(i);
      realSec.querySelectorAll("[data-opt]").forEach((b) => { const k = +b.dataset.opt; if ((q.ok || []).includes(k)) b.classList.add("ok"); else if (k === i) b.classList.add("bad"); });
      realSec.querySelector("[data-fb]").innerHTML = `<p class="${good ? "fb-ok" : "fb-bad"}">${good ? "Correcto." : "Incorrecto."}</p>` + realSteps(r, q);
      const seenOk = store.get("realOk", {}); if (good && !seenOk[q.id]) { seenOk[q.id] = 1; store.set("realOk", seenOk); win("Marea de examen resuelta"); }
    });

    // ----- ejercicios generados -----
    const genSec = $('[data-sec="gen"]'); let cur = null;
    function makeDay() {
      const port = pick([{ n: "Algeciras", A: [0.5, 0.9], m: 0.15 }, { n: "Gijón", A: [2.4, 3.8], m: 0.6 }, { n: "Bilbao", A: [2.6, 4.0], m: 0.5 }, { n: "Vigo", A: [1.6, 3.0], m: 0.8 }]);
      const ext = []; let t = ri(0, 200), low = Math.random() < 0.5;
      for (let i = 0; i < 4 && t < 1430; i++) { const A = rnd(...port.A); ext.push({ t, h: Math.round((low ? port.m + rnd(0, 0.3) : port.m + A) * 100) / 100 }); low = !low; t += ri(350, 395); }
      return { port: port.n, ext };
    }
    const tablaTxt = (ext) => ext.map((e) => `${hm(e.t)} ${fx(e.h)}`).join(" · ");
    function newEx() {
      const kind = pick(["sonda", "sonda", "duo", "hora", "oficial", "resguardo"]);
      const { port, ext } = makeDay(); ext.forEach((e, k) => { const nbs = [ext[k - 1], ext[k + 1]].filter(Boolean); e.tipo = nbs.every((x) => e.h > x.h) ? "P" : "B"; });
      const p = pick([993, 996, 998, 1003, 1005, 1008, 1010, 1013, 1016, 1018, 1020, 1023, 1028, 1033]), pc = presCorr(p), sc = Math.round(rnd(1.5, 12) * 10) / 10;
      const summer = Math.random() < 0.6;
      if (kind === "sonda" || kind === "resguardo") {
        const tipo = pick(["P", "B"]), list = ext.filter((e) => e.tipo === tipo), ord = ri(1, list.length), e = list[ord - 1], v = sc + e.h + pc, cal = Math.round(rnd(0.8, 2) * 10) / 10;
        const ask = kind === "sonda" ? `¿Sonda en el momento de la ${ord}.ª ${tipo === "P" ? "pleamar" : "bajamar"}?` : `Calado ${fx(cal, 1)} m. ¿Resguardo bajo la quilla en la ${ord}.ª ${tipo === "P" ? "pleamar" : "bajamar"}?`;
        const ans = kind === "sonda" ? v : v - cal;
        return { txt: `${port}. Mareas (UTC): ${tablaTxt(ext)}. Sonda en carta ${fx(sc, 1)} m, presión ${p} mb. ${ask}`, unit: "m", ans, tol: 0.015,
          steps: `${ord}.ª ${tipo === "P" ? "pleamar" : "bajamar"} ${hm(e.t)} → ${fx(e.h)} m. Presión 1013 − ${p} = ${1013 - p} mb → ${sg(pc)} m. Sonda = ${fx(sc, 1)} + ${fx(e.h)} ${pc >= 0 ? "+" : "−"} ${fx(Math.abs(pc))} = ${fx(v)} m${kind === "resguardo" ? `; resguardo = ${fx(v)} − ${fx(cal, 1)} = ${fx(v - cal)} m` : ""}.` };
      }
      if (kind === "duo") {
        const i = ri(0, ext.length - 2), a = ext[i], b = ext[i + 1], k = ri(1, 5), D = b.t - a.t, hl = D / 6, t = a.t + k * hl, h = heightAt(t, a, b, "duo");
        return { txt: `${port}. ${a.tipo === "P" ? "Pleamar" : "Bajamar"} ${hm(a.t)} UTC ${fx(a.h)} m; ${b.tipo === "P" ? "pleamar" : "bajamar"} ${hm(b.t)} UTC ${fx(b.h)} m. Por la regla de los duodécimos, ¿altura de marea a las ${hm(t)} UTC?`, unit: "m", ans: h, tol: 0.03,
          steps: `Duración ${Math.floor(D / 60)} h ${Math.round(D % 60)} min → hora de marea ${fx(hl, 0)} min; ${hm(t)} es el final de la ${k}.ª hora. Amplitud ${fx(Math.abs(b.h - a.h))} m; doceavo ${fx(Math.abs(b.h - a.h) / 12, 3)} m. Acumulado ${CUM[k]}/12 → ${fx(a.h)} ${b.h > a.h ? "+" : "−"} ${CUM[k]} × ${fx(Math.abs(b.h - a.h) / 12, 3)} = ${fx(h)} m.` };
      }
      if (kind === "hora") {
        const i = ri(0, ext.length - 2), a = ext[i], b = ext[i + 1], k = ri(1, 5), D = b.t - a.t, t = a.t + k * (D / 6), h = heightAt(t, a, b, "duo"), son = sc + h;
        return { txt: `${port}. ${a.tipo === "P" ? "Pleamar" : "Bajamar"} ${hm(a.t)} UTC ${fx(a.h)} m; ${b.tipo === "P" ? "pleamar" : "bajamar"} ${hm(b.t)} UTC ${fx(b.h)} m. Sonda en carta ${fx(sc, 1)} m, 1013 mb. Por duodécimos, ¿a qué hora UTC habrá ${fx(son)} m de sonda? (hh:mm)`, unit: "h", ans: t, tol: 6, time: true,
          steps: `Altura necesaria = ${fx(son)} − ${fx(sc, 1)} = ${fx(h)} m = ${CUM[k]}/12 de la amplitud desde ${fx(a.h)} m → al final de la ${k}.ª hora de marea: ${hm(a.t)} + ${k} × ${fx(D / 6, 0)} min = ${hm(t)} UTC.` };
      }
      const e = pick(ext), off = summer ? 2 : 1;
      return { txt: `${port}, ${summer ? "julio (horario de verano)" : "diciembre (horario de invierno)"}. El Anuario da una ${e.tipo === "P" ? "pleamar" : "bajamar"} a las ${hm(e.t)}. ¿Hora oficial? (hh:mm)`, unit: "h", ans: e.t + off * 60, tol: 0.5, time: true,
        steps: `Las horas del Anuario son UTC. Hora oficial = UTC + ${off} h (${summer ? "verano" : "invierno"}) = ${hm(e.t + off * 60)}.` };
    }
    function renderGen() {
      cur = newEx();
      genSec.innerHTML = `<div class="panel stack"><span class="eyebrow">Ejercicio generado</span><p>${esc(cur.txt)}</p>
<div class="row"><input type="text" inputmode="decimal" class="w4" data-ans placeholder="${cur.time ? "hh:mm" : "m"}" aria-label="Respuesta"><span>${cur.time ? "" : "m"}</span><button type="button" class="btn sm primary" data-chk>Comprobar</button><button type="button" class="btn sm" data-new>Otro</button></div><div data-fb></div></div>`;
    }
    on(genSec, "click", (e) => {
      if (e.target.closest("[data-new]")) return renderGen();
      if (!e.target.closest("[data-chk]") || !cur || cur.done) return;
      const raw = genSec.querySelector("[data-ans]").value, v = cur.time ? parseHM(raw) : num(raw); if (!Number.isFinite(v)) return ctx.toast(cur.time ? "Escribe la hora como hh:mm" : "Escribe un número");
      const d = cur.time ? Math.abs(((v - cur.ans + 720) % 1440 + 1440) % 1440 - 720) : Math.abs(v - cur.ans), good = d <= cur.tol; cur.done = true;
      genSec.querySelector("[data-fb]").innerHTML = `<p class="${good ? "fb-ok" : "fb-bad"}">${good ? "Correcto." : `No. Solución: ${cur.time ? hm(cur.ans) : fx(cur.ans) + " m"}.`}</p><div class="m-mareas-steps">${esc(cur.steps)}</div>`;
      if (good) win("Cálculo de marea correcto");
    });
    on(genSec, "keydown", (e) => { if (e.key === "Enter" && e.target.matches("[data-ans]")) genSec.querySelector("[data-chk]").click(); });

    el.querySelectorAll("[data-mode]").forEach((b) => on(b, "click", () => {
      el.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      el.querySelectorAll("[data-sec]").forEach((s) => (s.hidden = s.dataset.sec !== b.dataset.mode));
      if (b.dataset.mode === "real") renderReal(); if (b.dataset.mode === "gen" && !cur) renderGen(); if (b.dataset.mode === "calc") resize();
    }));
    return () => { alive = false; if (raf) cancelAnimationFrame(raf); cleanups.forEach((f) => { try { f(); } catch {} }); el.innerHTML = ""; };
  },
};
