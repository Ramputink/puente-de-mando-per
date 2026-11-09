export function h(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
export function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
export function go(route) { if (location.hash.slice(1) === route) window.dispatchEvent(new HashChangeEvent("hashchange")); else location.hash = route; }

let toastHost;
export function toast(msg, kind = "") {
  if (!toastHost) { toastHost = h(`<div class="toasts" aria-live="polite"></div>`); document.body.append(toastHost); }
  const t = h(`<div class="toast ${kind}">${esc(msg)}</div>`);
  toastHost.append(t);
  setTimeout(() => t.classList.add("out"), 3200);
  setTimeout(() => t.remove(), 3800);
}

let sampleP = null;
async function sampler() {
  if (!sampleP) sampleP = window.claude?.use ? window.claude.use("sample").catch(() => null) : Promise.resolve(null);
  return sampleP;
}
export async function explain(q, context, out) {
  const s = await sampler();
  const L = "abcd";
  if (!s) { out.innerHTML = `<p class="muted small">La explicación con Claude no está disponible en esta vista. Repasa la ficha del subtema enlazada.</p>`; return; }
  out.innerHTML = `<p class="muted small">Pensando…</p>`;
  const prompt = `Eres profesor de náutica en España y preparas el examen teórico del PER (convocatoria noviembre 2026, normativa vigente: RD 875/2014, RD 339/2021 de equipos de seguridad, RIPA con enmiendas, IALA MBS 2022, MARPOL V revisado).
Explica en español, en 4–7 frases claras, por qué la respuesta oficial es la correcta y por qué cada una de las otras opciones es incorrecta. Si hay una regla o artículo aplicable, cítalo. Termina con un truco breve para recordarlo. No uses Markdown con encabezados; puedes usar **negritas**.

Pregunta oficial: ${q.stem}
${q.opts.map((o, i) => `${L[i]}) ${o}`).join("\n")}
Respuesta oficial: ${q.annulled ? "pregunta anulada (todas válidas)" : q.ok.map(i => L[i]).join(" y ")}
Contexto del temario: ${context || "-"}`;
  try {
    const r = await s(prompt, { modelTier: "quick", onText: ({ text }) => { out.innerHTML = md(text); } });
    out.innerHTML = md(r.text);
    return r.text;
  } catch (e) {
    out.innerHTML = `<p class="muted small">${e?.code === "rate_limited" ? "Demasiadas peticiones seguidas. Prueba en un minuto." : e?.code === "not_granted" ? "Has denegado el permiso para preguntar a Claude en esta página." : "No se pudo obtener la explicación."}</p>`;
    return null;
  }
}
function md(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join(""); }

// ---------- chat de dudas (temario y corrección de preguntas)
const CHAT_RULES = `Eres profesor de náutica en España y resuelves las dudas de un alumno que prepara el examen teórico del PER (convocatoria noviembre 2026, normativa vigente: RD 875/2014, RD 339/2021 de equipos de seguridad, RIPA con enmiendas, IALA MBS 2022, MARPOL V revisado).
Responde en español, de tú, yendo directo a la duda y en pocas frases (hasta 6, salvo que te pida más). Si ayuda, usa un ejemplo concreto de a bordo.
Básate ante todo en el material de abajo. Si la duda va más allá de ese material, contesta con lo que sepas pero dilo claramente, y no te inventes cifras, artículos ni reglas: si no estás seguro, dilo. Si crees que el material o la respuesta oficial tienen un error, dilo sin rodeos, recordando que en el examen puntúa la respuesta oficial.
Formato: texto corrido; puedes usar **negritas**; sin encabezados ni tablas.

MATERIAL
`;
const CHAT_MAX_TURNS = 16;
const CHAT_OFF = ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"];
const chats = new Map(); // viven en memoria: sobreviven a cambiar de pantalla, no a recargar

export async function chatAvailable() { return !!(await sampler()); }
export function chatHasHistory(key) { return !!chats.get(key)?.turns.length; }

export function subtemaContext(s) {
  const tpl = document.createElement("template");
  tpl.innerHTML = (s.html || "").replace(/</g, " <");
  const ficha = tpl.content.textContent.replace(/\s+/g, " ").trim().slice(0, 20000);
  return [
    `Subtema ${s.id} ${s.title}`,
    s.upd2026 ? `Actualización 2026: ${s.upd2026}` : "",
    `Ficha: ${ficha}`,
    s.keyFacts?.length ? `Para memorizar: ${s.keyFacts.join(" · ")}` : "",
    s.traps?.length ? `Trampas del examen: ${s.traps.join(" · ")}` : "",
  ].filter(Boolean).join("\n");
}

export function chatBox(key, { context, suggestions = [], placeholder = "Escribe tu duda…" }) {
  const th = chats.get(key) || { turns: [], busy: false, ctl: null, live: "", note: "", draft: "", off: false, view: null };
  chats.set(key, th);
  const el = h(`<div class="chat">
    <div class="chat-log" role="log"></div>
    <div class="chat-sugg"></div>
    <p class="chat-note small muted" hidden></p>
    <form class="chat-form">
      <textarea rows="1" aria-label="Tu pregunta" placeholder="${esc(placeholder)}"></textarea>
      <button class="btn primary chat-send" type="submit">Enviar</button>
    </form>
  </div>`);
  const log = el.querySelector(".chat-log"), sugg = el.querySelector(".chat-sugg"), note = el.querySelector(".chat-note");
  const form = el.querySelector(".chat-form"), ta = el.querySelector("textarea"), btn = el.querySelector(".chat-send");
  const msg = (cls, html) => `<div class="chat-msg ${cls}">${html}</div>`;
  const nearEnd = () => log.scrollHeight - log.scrollTop - log.clientHeight < 60;
  const grow = () => { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight + 2}px`; };

  function paint(forceEnd = true) {
    log.innerHTML = th.turns.map(t => t.role === "user" ? msg("user", esc(t.content)) : msg("assistant", md(t.content))).join("")
      + (th.busy ? msg("assistant", th.live ? md(th.live) : `<p class="muted small">Pensando…</p>`) : "");
    log.setAttribute("aria-busy", th.busy ? "true" : "false");
    if (forceEnd) log.scrollTop = log.scrollHeight;
    sugg.hidden = !!th.turns.length || th.busy || th.off;
    note.hidden = !th.note; note.textContent = th.note;
    btn.textContent = th.busy ? "Parar" : "Enviar";
    ta.disabled = btn.disabled = th.off;
    if (th.draft) { ta.value = th.draft; th.draft = ""; grow(); }
  }
  function live() {
    const end = nearEnd();
    if (log.lastElementChild) log.lastElementChild.innerHTML = md(th.live);
    if (end) log.scrollTop = log.scrollHeight;
  }
  function failText(code) {
    if (code === "not_granted") return "Has denegado el permiso para preguntar a Claude en esta página. Recárgala si cambias de idea.";
    if (CHAT_OFF.includes(code)) return "El chat con Claude no está disponible en esta vista.";
    if (code === "rate_limited") return "Demasiadas preguntas seguidas o límite de uso alcanzado. Prueba en un rato.";
    if (code === "session_expired") return "Tu sesión de Claude ha caducado. Vuelve a entrar y recarga.";
    if (code === "refused") return "Claude no ha contestado a eso. Prueba a plantearlo de otra forma.";
    return "No se ha podido contestar. Inténtalo otra vez.";
  }
  async function send(raw) {
    const text = raw.trim();
    if (!text || th.busy || th.off) return;
    th.turns.push({ role: "user", content: text });
    th.busy = true; th.live = ""; th.note = ""; th.ctl = new AbortController();
    ta.value = ""; grow(); th.view.paint();
    try {
      const s = await sampler();
      if (!s) throw { code: "capability_disabled" };
      const r = await s([{ role: "user", content: CHAT_RULES + context() }, ...th.turns.slice(-CHAT_MAX_TURNS)], {
        cache: false, signal: th.ctl.signal,
        onText: ({ text: t }) => { th.live = t; th.view.live(); },
      });
      th.turns.push({ role: "assistant", content: r.text });
      if (r.truncated) th.note = "La respuesta se ha cortado por larga. Pide que siga o pregunta algo más concreto.";
    } catch (e) {
      if (e?.text) th.turns.push({ role: "assistant", content: e.text });
      else { th.turns.pop(); th.draft = text; }
      th.note = e?.code === "cancelled" ? "" : failText(e?.code);
      if (CHAT_OFF.includes(e?.code)) th.off = true;
    } finally {
      th.busy = false; th.live = ""; th.ctl = null; th.view.paint();
    }
  }
  th.view = { paint, live };
  suggestions.forEach(t => {
    const b = h(`<button class="btn sm" type="button">${esc(t)}</button>`);
    b.onclick = () => send(t);
    sugg.append(b);
  });
  form.onsubmit = e => { e.preventDefault(); if (th.busy) th.ctl?.abort(); else send(ta.value); };
  ta.oninput = grow;
  ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } };
  el.focusChat = () => ta.focus({ preventScroll: true });
  paint();
  return el;
}

export function fmtDate(ts) { return new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" }); }
export function pct(x) { return x == null ? "–" : Math.round(x * 100) + "%"; }
