import { DB, TEMAS } from "./data.js";
import { BLK, recordAnswer, scoreExam, BLOCKS, addXP, badge, srsGet } from "./game.js";
import { me, touchPlayer, state } from "./store.js";
import { h, esc, explain, go, chatBox, chatAvailable, chatHasHistory, subtemaContext } from "./ui.js";

const L = "abcd";

function subtemaOf(q) {
  if (!q.st) return null;
  const tema = BLK[q.b].tema; const t = DB.theory[tema];
  const s = t?.subtemas?.find(x => x.id === q.st);
  return s ? { tema, s } : null;
}

export function questionCard(q, { onAnswer, reveal = true, picked = null, number = null, showMeta = true } = {}) {
  const card = h(`<article class="qcard panel">
    <div class="qhead row">
      ${number != null ? `<span class="qnum mono">${number}</span>` : ""}
      <span class="chip">${esc(BLK[q.b].name)}</span>
      ${q.annulled ? `<span class="chip warn">Anulada en su convocatoria</span>` : ""}
      ${q.ok.length > 1 && !q.annulled ? `<span class="chip warn">${q.ok.length} respuestas válidas</span>` : ""}
      ${showMeta ? `<span class="muted small qseen">${q.seen.length > 1 ? `Salió ${new Set(q.seen.map(s => s.slice(0, 7))).size > 1 ? "en varias convocatorias" : "en " + q.seen.length + " tests"}` : ""}</span>` : ""}
    </div>
    <p class="qstem">${esc(q.stem)}</p>
    <div class="qopts" role="group" aria-label="Opciones"></div>
    <div class="qfb" hidden></div>
  </article>`);
  const box = card.querySelector(".qopts");
  const fb = card.querySelector(".qfb");
  let answered = false;
  let chosen = picked;
  q.opts.forEach((o, i) => {
    const b = h(`<button class="qopt" type="button"><span class="ql mono">${L[i]}</span><span class="qt">${esc(o)}</span></button>`);
    b.onclick = () => choose(i);
    box.append(b);
  });
  function paint(i) {
    [...box.children].forEach((b, j) => {
      b.classList.toggle("picked", j === i);
      if (reveal) {
        b.classList.toggle("right", q.ok.includes(j) || !!q.annulled);
        b.classList.toggle("wrong", j === i && !q.ok.includes(j) && !q.annulled);
      }
    });
  }
  function choose(i) {
    if (answered && reveal) return;
    answered = true;
    chosen = i;
    paint(i);
    const ok = !!q.annulled || q.ok.includes(i);
    if (reveal) {
      box.querySelectorAll("button").forEach(b => (b.disabled = true));
      showFeedback(ok);
    }
    onAnswer?.(i, ok);
  }
  function showFeedback(ok) {
    const st = subtemaOf(q);
    fb.hidden = false;
    fb.innerHTML = `<p class="${ok ? "fb-ok" : "fb-bad"}">${ok ? "Correcto." : `Incorrecto. La respuesta oficial es la ${q.ok.map(i => L[i]).join(" y ")}.`}</p>
      <p class="muted small">Fuente: ${q.seen.slice(0, 3).map(s => esc(s.replace("#", " · P"))).join(", ")}${q.seen.length > 3 ? "…" : ""}</p>
      <div class="row">${st ? `<button class="btn sm" data-go="tema-${st.tema}-${st.s.id}">Repasar ${esc(st.s.id)} ${esc(st.s.title)}</button>` : ""}
      <button class="btn sm" data-explain>Explícamelo</button>
      <button class="btn sm" data-ask hidden>Tengo una duda</button></div>
      <div class="qexp" hidden></div>
      <div class="qchat" hidden></div>`;
    fb.querySelector("[data-go]")?.addEventListener("click", e => go(e.currentTarget.dataset.go));
    const exBtn = fb.querySelector("[data-explain]");
    exBtn.onclick = async () => {
      const out = fb.querySelector(".qexp"); out.hidden = false; exBtn.disabled = true;
      const ctx = st ? (st.s.keyFacts || []).join(" · ") : "";
      explanation = (await explain(q, ctx, out)) || "";
      if (explanation) openChat(false);
    };
    let explanation = "";
    const chatKey = `q:${q.id}`;
    const chatHost = fb.querySelector(".qchat"), askBtn = fb.querySelector("[data-ask]");
    const chatContext = () => [
      `Pregunta oficial: ${q.stem}`,
      ...q.opts.map((o, i) => `${L[i]}) ${o}`),
      `Respuesta oficial: ${q.annulled ? "pregunta anulada (todas válidas)" : q.ok.map(i => L[i]).join(" y ")}`,
      chosen != null ? `El alumno marcó: ${L[chosen]}` : "",
      explanation ? `Explicación que el alumno ya ha leído: ${explanation}` : "",
      st ? subtemaContext(st.s) : "",
    ].filter(Boolean).join("\n");
    function openChat(focus) {
      if (!chatHost.firstChild) chatHost.append(chatBox(chatKey, {
        context: chatContext,
        placeholder: "¿Qué no te ha quedado claro?",
        suggestions: ["No lo termino de entender, explícamelo más fácil", "Ponme un ejemplo real", "¿Cómo lo recuerdo para el examen?"],
      }));
      chatHost.hidden = false; askBtn.hidden = true;
      if (focus) chatHost.firstChild.focusChat();
    }
    askBtn.onclick = () => openChat(true);
    chatAvailable().then(ok => {
      if (!ok || chatHost.firstChild) return;
      if (chatHasHistory(chatKey)) openChat(false); else askBtn.hidden = false;
    });
  }
  if (picked != null) { answered = true; paint(picked); if (reveal) { box.querySelectorAll("button").forEach(b => (b.disabled = true)); showFeedback(!!q.annulled || q.ok.includes(picked)); } }
  card.paint = paint;
  return card;
}

// Practice session: one question at a time, SRS-recorded
export function practice(el, qs, { title = "Práctica", onDone } = {}) {
  let i = 0, ok = 0;
  const wrap = h(`<section class="stack practice">
    <div class="row between"><h2>${esc(title)}</h2><span class="mono muted pcount"></span></div>
    <div class="pbar"><i></i></div>
    <div class="pslot"></div>
    <div class="row"><button class="btn primary pnext" hidden>Siguiente</button><button class="btn ghost pend">Terminar</button></div>
  </section>`);
  el.replaceChildren(wrap);
  const slot = wrap.querySelector(".pslot"), next = wrap.querySelector(".pnext");
  wrap.querySelector(".pend").onclick = finish;
  next.onclick = () => { i++; i < qs.length ? show() : finish(); };
  function show() {
    wrap.querySelector(".pcount").textContent = `${i + 1} / ${qs.length} · ${ok} ✓`;
    wrap.querySelector(".pbar i").style.width = `${(i / qs.length) * 100}%`;
    next.hidden = true;
    slot.replaceChildren(questionCard(qs[i], { onAnswer: (_, good) => { if (good) ok++; try { recordAnswer(qs[i], good); } catch (e) { console.warn("record", e); } next.hidden = false; next.focus(); wrap.querySelector(".pcount").textContent = `${i + 1} / ${qs.length} · ${ok} ✓`; } }));
  }
  function finish() {
    const n = Math.min(qs.length, i + (next.hidden ? 0 : 1));
    slot.replaceChildren(h(`<div class="panel stack"><h3>Sesión terminada</h3><p class="num big">${ok} / ${n}</p><p class="muted">Las falladas vuelven mañana a tu guardia de repaso.</p></div>`));
    next.hidden = true; wrap.querySelector(".pend").hidden = true;
    onDone?.(ok, n);
  }
  if (!qs.length) { slot.replaceChildren(h(`<p class="muted">No hay preguntas con este filtro.</p>`)); return; }
  show();
}

// Full exam simulator with official rules
export function examRunner(el, { qs, lib = false, title, examId = null, onFinish }) {
  const minutes = lib ? 45 : 90;
  const answers = new Array(qs.length).fill(null);
  let cur = 0, done = false; const t0 = Date.now(); let timer;
  const wrap = h(`<section class="exam stack">
    <div class="exam-top panel row between">
      <div><p class="eyebrow">${lib ? "PER con PNB liberado" : "Examen PER"}</p><h2>${esc(title)}</h2></div>
      <div class="row"><span class="mono clock" aria-live="off"></span><button class="btn primary ex-submit">Entregar</button></div>
    </div>
    <nav class="exgrid" aria-label="Preguntas"></nav>
    <div class="exslot"></div>
    <div class="row"><button class="btn ex-prev">Anterior</button><button class="btn ex-next">Siguiente</button></div>
    <div class="exconfirm panel" hidden><p>Te quedan <b class="ex-left"></b> preguntas sin responder. ¿Entregar igualmente?</p><div class="row"><button class="btn primary ex-yes">Entregar</button><button class="btn ex-no">Seguir</button></div></div>
  </section>`);
  el.replaceChildren(wrap);
  const grid = wrap.querySelector(".exgrid");
  let lastB = null;
  qs.forEach((q, i) => {
    if (q.b !== lastB) { grid.append(h(`<span class="exsec" title="${esc(BLK[q.b].name)}">${esc(BLK[q.b].name.split(" ")[0])}</span>`)); lastB = q.b; }
    const b = h(`<button class="exdot mono" type="button">${(lib ? 28 : 1) + i}</button>`); b.onclick = () => show(i); grid.append(b);
  });
  const dots = [...grid.querySelectorAll(".exdot")];
  function show(i) {
    cur = i; dots.forEach((d, j) => d.classList.toggle("on", j === i));
    const c = questionCard(qs[i], { reveal: done, picked: answers[i], number: (lib ? 28 : 1) + i, showMeta: done, onAnswer: a => { if (!done) { answers[i] = a; dots[i].classList.add("ans"); c.paint(a); } } });
    if (!done) c.querySelectorAll(".qopt").forEach(b => (b.disabled = false));
    wrap.querySelector(".exslot").replaceChildren(c);
  }
  // allow changing answers before submit
  wrap.querySelector(".exslot").addEventListener("click", e => {
    if (done) return; const b = e.target.closest(".qopt"); if (!b) return;
    const i = [...b.parentNode.children].indexOf(b); answers[cur] = i; dots[cur].classList.add("ans");
    b.closest(".qcard").paint(i);
  }, true);
  wrap.querySelector(".ex-prev").onclick = () => cur > 0 && show(cur - 1);
  wrap.querySelector(".ex-next").onclick = () => cur < qs.length - 1 && show(cur + 1);
  const conf = wrap.querySelector(".exconfirm");
  wrap.querySelector(".ex-submit").onclick = () => {
    if (done) return;
    const left = answers.filter(a => a == null).length;
    if (left) { conf.hidden = false; wrap.querySelector(".ex-left").textContent = left; conf.scrollIntoView({ block: "center" }); } else submit();
  };
  wrap.querySelector(".ex-yes").onclick = submit;
  wrap.querySelector(".ex-no").onclick = () => (conf.hidden = true);
  function tick() {
    const left = minutes * 60 - Math.floor((Date.now() - t0) / 1000);
    const c = wrap.querySelector(".clock");
    c.textContent = `${String(Math.max(0, Math.floor(left / 60))).padStart(2, "0")}:${String(Math.max(0, left % 60)).padStart(2, "0")}`;
    c.classList.toggle("late", left < 300);
    if (left <= 0) submit();
  }
  timer = setInterval(tick, 1000); tick();
  function submit() {
    if (done) return; done = true; clearInterval(timer); conf.hidden = true;
    const secs = Math.round((Date.now() - t0) / 1000);
    qs.forEach((q, i) => { if (answers[i] != null) { try { recordAnswer(q, !!q.annulled || q.ok.includes(answers[i]), { xp: false }); } catch (e) { console.warn(e); } } });
    const r = scoreExam(qs, answers, lib);
    const p = me();
    if (p) {
      p.exams = (p.exams || []).concat({ id: examId, title, date: Date.now(), lib, correct: r.correct, total: r.total, pass: r.pass, secs, by: Object.fromEntries(Object.entries(r.by).map(([k, v]) => [k, v.e])) }).slice(-60);
      addXP(r.pass ? 200 : 60, "simulacro");
      if (r.pass) badge("paso-del-estrecho");
      const last3 = p.exams.filter(e => !e.lib).slice(-3);
      if (last3.length === 3 && last3.every(e => e.pass)) badge("lobo-de-mar");
      if (!lib && (r.by.rip?.e || 0) === 0) badge("ripa-perfecto");
      if ((r.by.car?.e || 0) === 0 && r.by.car) badge("carta-perfecta");
      touchPlayer();
    }
    dots.forEach((d, i) => { d.classList.remove("ans"); d.classList.add(answers[i] == null ? "skip" : (qs[i].annulled || qs[i].ok.includes(answers[i])) ? "good" : "bad"); });
    wrap.querySelector(".ex-submit").hidden = true;
    const res = resultPanel(r, secs, lib);
    wrap.insertBefore(res, grid);
    show(0);
    res.scrollIntoView({ block: "start" });
    onFinish?.(r, answers, secs);
  }
  show(0);
  return () => clearInterval(timer);
}

export function resultPanel(r, secs, lib) {
  const rows = BLOCKS.filter(b => r.by[b.id]).map(b => {
    const x = r.by[b.id]; const over = b.maxErr != null && x.e > b.maxErr;
    return `<tr><td>${esc(b.name)}${b.maxErr != null ? ` <span class="chip ${over ? "bad" : "acc"}">máx. ${b.maxErr} fallos</span>` : ""}</td><td class="num">${x.c}/${x.n}</td><td class="num ${over ? "fb-bad" : ""}">${x.e}</td></tr>`;
  }).join("");
  return h(`<div class="panel stack result ${r.pass ? "pass" : "fail"}">
    <div class="row between"><div><p class="eyebrow">Resultado</p><h2>${r.pass ? "APTO" : "NO APTO"}</h2></div>
    <p class="num big">${r.correct}<span class="muted">/${r.total}</span></p></div>
    ${r.reasons.length ? `<ul>${r.reasons.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>Cumples todos los criterios oficiales${lib ? "" : ": 32 aciertos o más y los límites de RIPA, Balizamiento y Carta"}.</p>`}
    <p class="muted small">Tiempo: ${Math.floor(secs / 60)} min ${secs % 60} s. Toca cada número de arriba para revisar la pregunta.</p>
    <div class="scroll-x"><table><thead><tr><th>Bloque</th><th>Aciertos</th><th>Fallos</th></tr></thead><tbody>${rows}</tbody></table></div>
  </div>`);
}

export function randomExam(lib = false) {
  const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  const out = [];
  for (const b of BLOCKS) {
    if (lib && ["nom", "ama", "seg", "leg", "bal", "rip"].includes(b.id)) continue;
    out.push(...pick(DB.questions.filter(q => q.b === b.id && !q.annulled), b.n));
  }
  return out;
}
