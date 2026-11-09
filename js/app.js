import { init, state, onChange, CREW, me, myAlias, claim, claimConflict, modStore, download, saveDuel, savePlan, LS, touchPlayer } from "./store.js";
import { loadAll, DB, TEMAS, MODULES, loadModule, convLabel } from "./data.js";
import { BLOCKS, BLK, TEMA_BLOCKS, rankOf, RANKS, PORTS, BOSS, BADGES, addXP, badge, setNotifier, dueList, seenCount, blockAcc, passProbability, daysToExam, weeklyXP, today, scoreExam, EXAM_DATE, srsGet } from "./game.js";
import { practice, examRunner, randomExam, questionCard, resultPanel } from "./quiz.js";
import { h, esc, go, toast, fmtDate, pct, chatBox, chatAvailable, subtemaContext } from "./ui.js";

const main = document.getElementById("main");
let cleanup = null;
setNotifier((m, k) => toast(m, k));

// ---------- theme
const savedTheme = LS.get("theme", null);
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
const themeFns = new Set();
function curTheme() { return document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
function toggleTheme() { const t = curTheme() === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = t; LS.set("theme", t); themeFns.forEach(f => f(t)); }
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => themeFns.forEach(f => f(curTheme())));

// ---------- helpers
const qOfTema = t => DB.questions.filter(q => TEMA_BLOCKS[t].includes(q.b));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function crewName(alias) { return alias === "__guest" ? "Invitado" : CREW.find(c => c.alias === alias)?.name || alias; }
function temaProgress(t) {
  const qs = qOfTema(t); if (!qs.length) return { seen: 0, total: 0, mastered: 0 };
  let seen = 0, mastered = 0;
  for (const q of qs) { const s = srsGet(q); if (s) { seen++; if (s[0] >= 3) mastered++; } }
  return { seen, total: qs.length, mastered };
}
function canPlay() { return state.mode === "guest" || !!state.me; }

// ---------- shell chrome
function renderChrome() {
  const p = me();
  const who = document.getElementById("who");
  if (state.mode === "guest") who.innerHTML = `<span class="chip warn">Modo invitado</span>`;
  else if (p) { const r = rankOf(p.xp); who.innerHTML = `<span class="who-name">${esc(crewName(state.me))}</span><span class="chip acc">${esc(r.name)}</span><span class="mono small">${p.xp} XP</span>`; }
  else who.innerHTML = `<a class="btn sm" href="#tripulacion">Elegir tripulante</a>`;
  const sync = document.getElementById("sync");
  sync.textContent = state.mode === "crew" ? (state.syncError ? "Error de sincronización" : "Sincronizado") : state.mode === "guest" ? "Solo lectura" : "Sin sincronizar (local)";
  sync.className = "small " + (state.mode === "crew" && !state.syncError ? "muted" : "warn-t");
}

const NAV = [
  ["inicio", "Bitácora"], ["temas", "Temario"], ["banco", "Preguntas"], ["simulacros", "Simulacros"],
  ["travesia", "Travesía"], ["regatas", "Regatas"], ["carga", "Plan"], ["tripulacion", "Tripulación"],
];
function renderNav(active) {
  const nav = document.getElementById("nav");
  nav.innerHTML = NAV.map(([r, t]) => `<a href="#${r}" class="${active === r ? "on" : ""}">${t}</a>`).join("");
}

// ---------- router
async function route() {
  const r = location.hash.slice(1) || "inicio";
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  const base = r.split("-")[0];
  renderNav(base === "tema" ? "temas" : base === "mod" ? "temas" : base);
  main.scrollTo?.(0, 0); window.scrollTo(0, 0);
  if (state.mode !== "guest" && !state.me && !["tripulacion"].includes(base)) { viewChooseCrew(); return; }
  const views = { inicio: viewHome, temas: viewTemas, tema: viewTema, mod: viewModule, banco: viewBanco, simulacros: viewSimulacros, examen: viewExamen, travesia: viewTravesia, regatas: viewRegatas, regata: viewRegata, carga: viewCarga, tripulacion: viewCrew, guardia: viewGuardia, puerto: viewPuerto };
  (views[base] || viewHome)(r);
}

// ---------- crew choice
function viewChooseCrew() {
  main.replaceChildren(h(`<section class="stack narrow">
    <p class="eyebrow">Bienvenida a bordo</p><h1>¿Quién se pone al timón?</h1>
    <p>Elige tu perfil en este dispositivo. Tu progreso se guarda con tu nombre y lo ve también tu compañero.</p>
    <div class="grid crew-pick">${CREW.map(c => `<button class="panel crew-btn" data-a="${c.alias}" ${claimConflict(c.alias) ? "disabled" : ""}><span class="crew-init" style="--c:${c.color}">${c.name[0]}</span><b>${c.name}</b>${claimConflict(c.alias) ? `<span class="small muted">Vinculado a otra cuenta</span>` : ""}</button>`).join("")}</div>
    <p class="muted small">¿Solo quieres mirar? Si te han invitado como lector, entras automáticamente en modo invitado.</p>
  </section>`));
  main.querySelectorAll(".crew-btn").forEach(b => b.onclick = async () => { claim(b.dataset.a); toast(`Hola, ${crewName(b.dataset.a)}.`); go("inicio"); renderChrome(); });
}

// ---------- HOME (Bitácora)
function viewHome() {
  const p = me();
  const due = canPlay() ? dueList(DB.questions) : [];
  const days = daysToExam();
  const planToday = state.plan?.days?.find(d => d.date === today());
  const crewCards = CREW.map(c => {
    const pl = state.players[c.alias]; const r = rankOf(pl?.xp || 0); const pp = pl ? passProbability(pl, 1500) : null;
    const lastEx = (pl?.exams || []).filter(e => !e.lib).slice(-1)[0];
    return `<article class="panel crew-card ${state.me === c.alias ? "is-me" : ""}">
      <div class="row between"><div class="row"><span class="crew-init" style="--c:${c.color}">${c.name[0]}</span><div><h3>${c.name}</h3><p class="small muted">${esc(r.name)}${r.next ? ` · ${r.next.xp - (pl?.xp || 0)} XP para ${esc(r.next.name)}` : ""}</p></div></div><span class="mono">${pl?.xp || 0} XP</span></div>
      <div class="xpbar"><i style="width:${Math.round(r.pct * 100)}%"></i></div>
      <dl class="kv"><div><dt>Racha</dt><dd class="num">${pl?.streak?.count || 0} días</dd></div><div><dt>Esta semana</dt><dd class="num">${weeklyXP(pl)} XP</dd></div><div><dt>Prob. de aprobar</dt><dd class="num">${pp == null ? "–" : pct(pp)}</dd></div><div><dt>Último simulacro</dt><dd class="num">${lastEx ? `${lastEx.correct}/45 ${lastEx.pass ? "✓" : "✗"}` : "–"}</dd></div></dl>
      <div class="blkbars">${BLOCKS.map(b => { const a = blockAcc(pl, b.id); return `<span title="${esc(b.name)}: ${pct(a)}" class="bb ${a == null ? "" : a >= .8 ? "g" : a >= .65 ? "y" : "r"} ${b.maxErr != null ? "elim" : ""}"></span>`; }).join("")}</div>
    </article>`;
  }).join("");
  const pending = state.duels.filter(d => state.me && d.to === state.me && !d.results?.[state.me]).length;
  const v = h(`<section class="stack">
    <header class="hero">
      <div><p class="eyebrow">Examen teórico PER · sábado 21 de noviembre de 2026 · Madrid</p>
      <h1><span class="num">${days}</span> días para el examen</h1>
      <p class="muted">45 preguntas · 1 h 30 min · apto con 32 aciertos y máx. 5 fallos en RIPA, 2 en Balizamiento y 2 en Carta.</p></div>
      <div class="compass" aria-hidden="true"></div>
    </header>
    ${state.mode === "guest" ? `<div class="tint"><b>Modo invitado.</b> Puedes estudiar todo y hacer tests; tu progreso se queda solo en este dispositivo y no cambia el de Rampu ni el de Reyero.</div>` : ""}
    <div class="grid two">
      <article class="panel stack">
        <div class="row between"><h2>Guardia de hoy</h2><span class="chip ${due.length ? "acc" : "ok"}">${due.length} por repasar</span></div>
        <p class="muted">Repaso espaciado: las preguntas que fallas vuelven al día siguiente; las que aciertas, cada vez más tarde (1, 2, 4, 8 y 16 días).</p>
        <div class="row"><button class="btn primary" data-go="guardia">${due.length ? "Empezar guardia" : "Practicar 20 nuevas"}</button><button class="btn" data-go="examen-aleatorio">Simulacro aleatorio</button></div>
        ${planToday ? `<div class="tint small"><b>Hoy en el plan:</b> ${planToday.items.map(i => esc(i.label)).join(" · ")}</div>` : `<p class="small muted">Aún no hay plan de estudio. <a href="#carga">Créalo en Plan</a>.</p>`}
        ${pending ? `<div class="tint small"><b>${pending} regata${pending > 1 ? "s" : ""} pendiente${pending > 1 ? "s" : ""}.</b> <a href="#regatas">Responder al reto</a></div>` : ""}
      </article>
      <article class="panel stack">
        <h2>Tu temario</h2>
        <div class="tema-mini">${TEMAS.map(t => { const pr = canPlay() ? temaProgress(t.id) : { seen: 0, total: 1, mastered: 0 }; const conq = p?.ports?.[t.id]; return `<a href="#tema-${t.id}" class="tm"><span class="mono tm-n">${t.id}</span><span class="tm-t">${esc(t.short)}</span><span class="tm-bar"><i style="width:${Math.round((pr.mastered / Math.max(1, pr.total)) * 100)}%"></i></span>${conq ? `<span class="chip ok">Puerto</span>` : ""}</a>`; }).join("")}</div>
      </article>
    </div>
    <h2>Tripulación</h2>
    <div class="grid two">${crewCards}</div>
    <p class="small muted">Semáforo por bloque (de Nomenclatura a Carta): verde ≥80 % en tus últimas 40 respuestas, amarillo ≥65 %, rojo por debajo. Los bloques eliminatorios llevan borde.</p>
  </section>`);
  v.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
  main.replaceChildren(v);
}

// ---------- GUARDIA (SRS)
function viewGuardia() {
  let qs = dueList(DB.questions).slice(0, 30);
  let title = "Guardia de repaso";
  if (!qs.length) {
    const unseen = DB.questions.filter(q => !srsGet(q) && !q.annulled);
    // prefer elimination blocks and weak blocks
    qs = shuffle(unseen).sort((a, b) => (BLK[b.b].maxErr != null) - (BLK[a.b].maxErr != null)).slice(0, 20);
    qs = shuffle(qs); title = "20 preguntas nuevas";
  }
  practice(main, qs, { title, onDone: (ok, n) => { if (n >= 10) badge("primera-guardia"); } });
}

// ---------- TEMAS
function viewTemas() {
  const p = me();
  main.replaceChildren(h(`<section class="stack">
    <div><p class="eyebrow">Temario oficial PER (RD 875/2014, Anexo II) · actualizado a 2026</p><h1>Temario</h1></div>
    <div class="grid temas">${TEMAS.map(t => {
      const th = DB.theory[t.id]; const pr = canPlay() ? temaProgress(t.id) : { seen: 0, total: qOfTema(t.id).length, mastered: 0 };
      const nq = TEMA_BLOCKS[t.id].reduce((s, b) => s + BLK[b].n, 0);
      return `<a class="panel tema-card" href="#tema-${t.id}">
        <div class="row between"><span class="tema-num mono">${String(t.id).padStart(2, "0")}</span>${p?.ports?.[t.id] ? `<span class="chip ok">Puerto conquistado</span>` : ""}</div>
        <h3>${esc(t.title)}</h3>
        <p class="small muted">${th ? th.subtemas.length + " subtemas" : "Cargando teoría"} · ${MODULES[t.id].length} interactivos · ${pr.total} preguntas oficiales · ${nq} en el examen</p>
        <div class="tm-bar"><i style="width:${Math.round((pr.mastered / Math.max(1, pr.total)) * 100)}%"></i></div>
        <p class="small">${pr.seen} vistas · ${pr.mastered} dominadas</p>
      </a>`;
    }).join("")}</div>
  </section>`));
}

async function viewTema(r) {
  const parts = r.split("-"); const tid = +parts[1]; const sub = parts.slice(2).join("-") || null;
  const t = TEMAS.find(x => x.id === tid); if (!t) return viewTemas();
  const th = DB.theory[tid];
  const qs = qOfTema(tid);
  const subs = th?.subtemas || [];
  const active = subs.find(s => s.id === sub) || null;
  const p = me();
  const v = h(`<section class="stack tema-view">
    <div class="row between"><div><p class="eyebrow"><a href="#temas">Temario</a> · Tema ${tid}</p><h1>${esc(t.title)}</h1></div>
      <div class="row"><button class="btn" data-practice="all">Practicar el tema (${qs.length})</button><button class="btn primary" data-go="puerto-${tid}">Examen de puerto</button></div></div>
    ${th ? `<p class="lede">${esc(th.summary || "")}</p>` : `<p class="muted">La teoría de este tema no se ha cargado.</p>`}
    <div class="tema-layout">
      <nav class="subnav" aria-label="Subtemas">
        <a href="#tema-${tid}" class="${!active ? "on" : ""}">Interactivos</a>
        ${subs.map(s => `<a href="#tema-${tid}-${s.id}" class="${active?.id === s.id ? "on" : ""}"><span class="mono">${s.id}</span> ${esc(s.title)}</a>`).join("")}
      </nav>
      <div class="tema-body"></div>
    </div>
  </section>`);
  main.replaceChildren(v);
  v.querySelector("[data-go]").onclick = () => go(`puerto-${tid}`);
  v.querySelector("[data-practice]").onclick = () => practice(main, shuffle(qs).slice(0, 25), { title: `${t.short}: práctica` });
  const body = v.querySelector(".tema-body");
  if (!active) {
    body.append(h(`<div class="stack"><h2>Interactivos</h2><div class="grid mods"></div></div>`));
    const grid = body.querySelector(".mods");
    for (const id of MODULES[tid]) {
      const card = h(`<a class="panel mod-card" href="#mod-${id}"><span class="mod-ic"></span><h3>${esc(id)}</h3><p class="small muted">Cargando…</p></a>`);
      grid.append(card);
      loadModule(id).then(m => {
        if (!m) { card.querySelector("p").textContent = "No disponible todavía."; card.removeAttribute("href"); card.classList.add("off"); return; }
        card.querySelector("h3").textContent = m.title; card.querySelector("p").textContent = m.desc || ""; card.querySelector(".mod-ic").textContent = m.icon || "◆";
      });
    }
    if (subs.length) body.append(h(`<div class="stack"><h2>Fichas de teoría</h2><div class="grid">${subs.map(s => `<a class="panel sub-card" href="#tema-${tid}-${s.id}"><span class="mono muted">${s.id}</span><h3>${esc(s.title)}</h3>${s.upd2026 ? `<span class="chip acc">Cambia en 2026</span>` : ""}</a>`).join("")}</div></div>`));
    return;
  }
  const sq = qs.filter(q => q.st === active.id);
  const art = h(`<article class="stack ficha">
    <div class="row between"><h2><span class="mono muted">${active.id}</span> ${esc(active.title)}</h2>
      <div class="row">${sq.length ? `<button class="btn sm" data-sp>Practicar ${sq.length} preguntas</button>` : ""}<span class="chip ok">✔ 2026</span></div></div>
    ${active.upd2026 ? `<div class="upd"><p class="eyebrow">Actualizado respecto a los apuntes de 2015</p><p>${esc(active.upd2026)}</p></div>` : ""}
    <div class="prose">${active.html || ""}</div>
    ${active.keyFacts?.length ? `<div class="tint"><h4>Para memorizar</h4><ul>${active.keyFacts.map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>` : ""}
    ${active.traps?.length ? `<div class="panel traps"><h4>Trampas del examen</h4><ul>${active.traps.map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>` : ""}
    ${active.flash?.length ? `<div class="stack"><h4>Tarjetas (${active.flash.length}) <span class="muted small">— toca para girar</span></h4><div class="flashes">${active.flash.map(f => `<button class="flash"><span class="fq">${esc(f.q)}</span><span class="fa">${esc(f.a)}</span></button>`).join("")}</div></div>` : ""}
    <p class="small muted">Fuentes: ${(active.sources || []).map(esc).join(" · ")}</p>
    <div class="row">${(() => { const i = subs.indexOf(active); return `${i > 0 ? `<a class="btn" href="#tema-${tid}-${subs[i - 1].id}">← ${subs[i - 1].id}</a>` : ""}${i < subs.length - 1 ? `<a class="btn" href="#tema-${tid}-${subs[i + 1].id}">${subs[i + 1].id} →</a>` : ""}`; })()}</div>
  </article>`);
  body.append(art);
  art.querySelectorAll(".prose table").forEach(tb => { const w = document.createElement("div"); w.className = "scroll-x"; tb.replaceWith(w); w.append(tb); });
  art.querySelectorAll(".flash").forEach(f => f.onclick = () => { f.classList.toggle("flip"); if (f.classList.contains("flip") && !f.dataset.x) { f.dataset.x = 1; addXP(1, "tarjeta"); } });
  art.querySelector("[data-sp]")?.addEventListener("click", () => practice(main, shuffle(sq), { title: `${active.id} ${active.title}` }));
  if (p && !p.mods?.__read?.[active.id]) { p.mods.__read = p.mods.__read || {}; p.mods.__read[active.id] = 1; addXP(15, "ficha leída"); }
  mountFichaChat(v, active);
}

function mountFichaChat(view, s) {
  const key = `ficha:${s.id}`;
  const fab = h(`<button class="btn primary chat-fab" type="button" hidden>Preguntar una duda</button>`);
  const drawer = h(`<aside class="chat-drawer panel" aria-label="Dudas sobre esta ficha" hidden>
    <div class="row between chat-head"><div><p class="eyebrow">Dudas</p><h3><span class="mono muted">${esc(s.id)}</span> ${esc(s.title)}</h3></div><button class="btn ghost sm" type="button" aria-label="Cerrar">✕</button></div>
  </aside>`);
  const box = chatBox(key, {
    context: () => `Tema: ${DB.theory[+s.id.split(".")[0]]?.title || ""}\n${subtemaContext(s)}`,
    placeholder: "Pregunta lo que no te quede claro…",
    suggestions: ["Explícame esta ficha más fácil", "Ponme un ejemplo real", "Hazme una pregunta de repaso"],
  });
  drawer.append(box);
  const toggle = open => {
    drawer.hidden = !open; fab.hidden = open;
    if (open) box.focusChat(); else fab.focus();
  };
  fab.onclick = () => toggle(true);
  drawer.querySelector(".chat-head button").onclick = () => toggle(false);
  drawer.addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });
  view.append(fab, drawer);
  chatAvailable().then(ok => { if (ok && drawer.hidden) fab.hidden = false; });
}

// ---------- MODULE
async function viewModule(r) {
  const id = r.slice(4);
  const tema = Object.entries(MODULES).find(([, ids]) => ids.includes(id))?.[0];
  const shell = h(`<section class="stack"><p class="eyebrow"><a href="#temas">Temario</a> · <a href="#tema-${tema}">Tema ${tema}</a></p><h1 class="mod-title">Cargando…</h1><p class="lede mod-desc"></p><div class="mod-host"></div></section>`);
  main.replaceChildren(shell);
  const m = await loadModule(id);
  if (!m) { shell.querySelector(".mod-title").textContent = "Interactivo no disponible"; return; }
  shell.querySelector(".mod-title").textContent = m.title; shell.querySelector(".mod-desc").textContent = m.desc || "";
  const ctx = {
    award: (xp, reason) => { if (canPlay()) addXP(Math.min(60, Math.max(0, xp | 0)), reason); },
    badge: b => canPlay() && badge(b), toast,
    theme: curTheme, onTheme: f => (themeFns.add(f), () => themeFns.delete(f)),
    asset: p => p, download: (n, d, mime) => download(n, d, mime).then(ok => { if (!ok) toast("La descarga no está disponible o se canceló."); return ok; }),
    store: modStore(id),
  };
  try { cleanup = m.mount(shell.querySelector(".mod-host"), ctx) || null; }
  catch (e) { console.error(e); shell.querySelector(".mod-host").textContent = "Error al cargar el interactivo."; }
}

// ---------- BANCO
function viewBanco() {
  const st = LS.get("bancoF", { blk: "", conv: "", f: "all", txt: "" });
  const convs = [...new Set(DB.exams.map(e => e.conv))].sort();
  const v = h(`<section class="stack">
    <div><p class="eyebrow">${DB.questions.length} preguntas oficiales distintas · ${DB.exams.length} exámenes 2022–2026</p><h1>Banco de preguntas</h1></div>
    <form class="panel filters row" onsubmit="return false">
      <label>Bloque <select id="f-blk"><option value="">Todos</option>${BLOCKS.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join("")}</select></label>
      <label>Convocatoria <select id="f-conv"><option value="">Todas</option>${convs.map(c => `<option value="${c}">${convLabel(c)}</option>`).join("")}</select></label>
      <label>Estado <select id="f-f"><option value="all">Todas</option><option value="new">Nunca vistas</option><option value="bad">Falladas</option><option value="due">Para repasar hoy</option><option value="mastered">Dominadas</option></select></label>
      <label class="grow">Buscar <input id="f-txt" type="search" placeholder="p. ej. regla 13, cardinal, posidonia"></label>
    </form>
    <div class="row between"><p class="muted fcount"></p><div class="row"><button class="btn primary" id="f-go">Practicar estas</button><button class="btn" id="f-list">Ver listado</button></div></div>
    <div class="flist stack"></div>
  </section>`);
  main.replaceChildren(v);
  const $ = s => v.querySelector(s);
  $("#f-blk").value = st.blk; $("#f-conv").value = st.conv; $("#f-f").value = st.f; $("#f-txt").value = st.txt;
  const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function filtered() {
    const s = { blk: $("#f-blk").value, conv: $("#f-conv").value, f: $("#f-f").value, txt: $("#f-txt").value }; LS.set("bancoF", s);
    const tx = norm(s.txt.trim()); const today0 = Math.floor(Date.now() / 86400000);
    return DB.questions.filter(q => {
      if (s.blk && q.b !== s.blk) return false;
      if (s.conv && !q.seen.some(x => x.startsWith(s.conv))) return false;
      const r = srsGet(q);
      if (s.f === "new" && r) return false;
      if (s.f === "bad" && !(r && r[3] < r[2])) return false;
      if (s.f === "due" && !(r && r[1] <= today0 + 1)) return false;
      if (s.f === "mastered" && !(r && r[0] >= 3)) return false;
      if (tx && !norm(q.stem + " " + q.opts.join(" ")).includes(tx)) return false;
      return true;
    });
  }
  const upd = () => { $(".fcount").textContent = `${filtered().length} preguntas`; $(".flist").replaceChildren(); };
  v.querySelectorAll("select,input").forEach(e => e.addEventListener("input", upd)); upd();
  $("#f-go").onclick = () => { const qs = shuffle(filtered()).slice(0, 40); practice(main, qs, { title: "Práctica filtrada" }); };
  $("#f-list").onclick = () => {
    const list = $(".flist"); list.replaceChildren();
    filtered().slice(0, 60).forEach(q => list.append(questionCard(q, { onAnswer: (_, ok) => canPlay() && import("./game.js").then(g => g.recordAnswer(q, ok)) })));
    if (filtered().length > 60) list.append(h(`<p class="muted">Mostrando 60. Afina el filtro para ver el resto.</p>`));
  };
}

// ---------- SIMULACROS
function viewSimulacros() {
  const p = me();
  const convs = [...new Set(DB.exams.map(e => e.conv))].sort().reverse();
  const hist = (p?.exams || []).slice().reverse().slice(0, 12);
  const v = h(`<section class="stack">
    <div><p class="eyebrow">Corrección con los criterios oficiales del Anexo II del RD 875/2014</p><h1>Simulacros</h1></div>
    <div class="grid two">
      <article class="panel stack"><h2>Simulacro aleatorio</h2><p class="muted">45 preguntas con el reparto real por bloques (4·2·4·2·5·10·2·3·4·5·4) sacadas de todo el banco. 90 minutos.</p><div class="row"><button class="btn primary" data-go="examen-aleatorio">Empezar</button><button class="btn" data-go="examen-liberado">PER con PNB liberado (18 · 45 min)</button></div></article>
      <article class="panel stack"><h2>Historial</h2>${hist.length ? `<div class="scroll-x"><table><thead><tr><th>Fecha</th><th>Examen</th><th>Nota</th><th></th></tr></thead><tbody>${hist.map(e => `<tr><td>${fmtDate(e.date)}</td><td>${esc(e.title)}</td><td class="num">${e.correct}/${e.total}</td><td><span class="chip ${e.pass ? "ok" : "bad"}">${e.pass ? "Apto" : "No apto"}</span></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Aún no has hecho ningún simulacro.</p>`}</article>
    </div>
    <h2>Exámenes oficiales tal cual se pusieron</h2>
    <div class="grid convs">${convs.map(c => {
      const ex = DB.exams.filter(e => e.conv === c);
      return `<article class="panel stack"><h3>${convLabel(c)}</h3><div class="row">${ex.map(e => { const done = p?.exams?.filter(x => x.id === e.id).slice(-1)[0]; return `<a class="btn sm ${done ? (done.pass ? "okb" : "badb") : ""}" href="#examen-${e.id}">${e.lib ? "Liberado " : "Test "}${String(e.code).padStart(2, "0")}${done ? ` · ${done.correct}` : ""}</a>`; }).join("")}</div></article>`;
    }).join("")}</div>
    <p class="small muted">Los tests de una misma convocatoria suelen compartir preguntas en distinto orden; los «Liberado» son la parte P28–45 para quien ya tiene el PNB.</p>
  </section>`);
  v.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
  main.replaceChildren(v);
}
function viewExamen(r) {
  const id = r.slice(7);
  if (id === "aleatorio" || id === "liberado") {
    const lib = id === "liberado";
    cleanup = examRunner(main, { qs: randomExam(lib), lib, title: lib ? "Simulacro aleatorio (liberado)" : "Simulacro aleatorio", examId: "rand" });
    return;
  }
  const e = DB.exams.find(x => x.id === id); if (!e) return viewSimulacros();
  cleanup = examRunner(main, { qs: e.q.map(q => DB.byId[q]), lib: e.lib, title: `${e.label} · ${e.lib ? "Liberado" : "Test"} ${String(e.code).padStart(2, "0")}`, examId: e.id });
}

// ---------- PUERTO (examen de puerto del tema)
function viewPuerto(r) {
  const tid = +r.split("-")[1]; const t = TEMAS.find(x => x.id === tid);
  const port = PORTS.find(x => x.tema === tid);
  const qs = shuffle(qOfTema(tid).filter(q => !q.annulled)).slice(0, 20);
  const wrap = h(`<section class="stack"><div class="tint"><p class="eyebrow">Examen de puerto · ${esc(port.name)}</p><p>20 preguntas de <b>${esc(t.title)}</b>. Con un 80 % (16 aciertos) conquistas el puerto en la travesía.</p></div><div class="ph"></div></section>`);
  main.replaceChildren(wrap);
  practice(wrap.querySelector(".ph"), qs, { title: `Puerto de ${port.name}`, onDone: (ok, n) => {
    const p = me(); if (!p || n < 20) return;
    if (ok >= 16) {
      if (!p.ports[tid]) { p.ports[tid] = Date.now(); addXP(150, "puerto"); toast(`Puerto de ${port.name} conquistado.`, "badge"); }
      if (Object.keys(p.ports).length >= 10) badge("todos-los-puertos");
      touchPlayer();
    }
  } });
}

// ---------- TRAVESÍA (map + badges)
function viewTravesia() {
  const p = me();
  const W = 640, H = 420, lon0 = -6.6, lon1 = 3.6, lat0 = 35.6, lat1 = 42.0;
  const X = lon => ((lon - lon0) / (lon1 - lon0)) * W, Y = lat => H - ((lat - lat0) / (lat1 - lat0)) * H;
  // simplified Spanish Mediterranean coastline (lon, lat)
  const coast = [[3.2, 42.0], [3.2, 41.9], [2.8, 41.6], [2.2, 41.35], [1.6, 41.2], [0.9, 41.05], [0.7, 40.8], [0.5, 40.5], [0.0, 40.0], [-0.3, 39.6], [-0.3, 39.4], [-0.2, 39.0], [0.2, 38.75], [-0.1, 38.5], [-0.5, 38.3], [-0.7, 38.0], [-0.8, 37.65], [-1.0, 37.55], [-1.6, 37.35], [-1.9, 36.95], [-2.2, 36.73], [-2.6, 36.8], [-3.0, 36.75], [-3.5, 36.72], [-4.0, 36.73], [-4.45, 36.7], [-4.9, 36.5], [-5.2, 36.38], [-5.35, 36.15], [-5.45, 36.08], [-5.6, 36.0], [-5.8, 36.08], [-6.0, 36.18], [-6.3, 36.5], [-6.4, 36.8]];
  const africa = [[-6.0, 35.6], [-5.9, 35.78], [-5.7, 35.83], [-5.45, 35.9], [-5.3, 35.9], [-5.2, 35.75], [-4.9, 35.6]];
  const baleares = [[[2.35, 39.6], [2.6, 39.95], [3.2, 39.95], [3.45, 39.7], [3.2, 39.35], [2.75, 39.5], [2.35, 39.6]], [[1.2, 38.9], [1.45, 39.1], [1.6, 38.98], [1.4, 38.85], [1.2, 38.9]]];
  const path = pts => pts.map(([lo, la], i) => `${i ? "L" : "M"}${X(lo).toFixed(1)},${Y(la).toFixed(1)}`).join("");
  const route = PORTS.map(pt => [pt.lon, pt.lat]).concat([[BOSS.lon, BOSS.lat]]);
  const conquered = p ? Object.keys(p.ports || {}).length : 0;
  const passedBoss = !!p?.badges?.["paso-del-estrecho"];
  const v = h(`<section class="stack">
    <div><p class="eyebrow">Gamificación</p><h1>Travesía a Algeciras</h1><p class="lede">Diez puertos, uno por tema. Conquistas cada puerto con su examen de puerto (16/20). El jefe final es el Paso del Estrecho: aprobar un simulacro completo con las reglas oficiales.</p></div>
    <div class="panel map-wrap"><svg viewBox="0 0 ${W} ${H}" class="map" role="img" aria-label="Mapa de la travesía">
      <rect width="${W}" height="${H}" class="m-sea"/>
      ${Array.from({ length: 7 }, (_, i) => lat0 + 0.4 + i).map(la => `<line x1="0" x2="${W}" y1="${Y(la)}" y2="${Y(la)}" class="m-grid"/>`).join("")}
      ${[-6, -4, -2, 0, 2].map(lo => `<line y1="0" y2="${H}" x1="${X(lo)}" x2="${X(lo)}" class="m-grid"/>`).join("")}
      <path d="${path(coast)} L${X(-6.6)},${Y(42)} L${X(3.2)},${Y(42)} Z" class="m-land"/>
      <path d="${path(africa)} L${X(-4.9)},${H} L${X(-6.6)},${H} Z" class="m-land"/>
      ${baleares.map(b => `<path d="${path(b)}Z" class="m-land"/>`).join("")}
      ${[36, 37, 38, 39, 40, 41].map(la => `<text x="${W - 4}" y="${Y(la) - 3}" text-anchor="end" class="m-lbl">${la}°N</text><line x1="${W - 40}" x2="${W}" y1="${Y(la)}" y2="${Y(la)}" class="m-grid"/>`).join("")}
      ${[-6, -4, -2, 0, 2].map(lo => `<text x="${X(lo) + 3}" y="${H - 4}" class="m-lbl">${Math.abs(lo)}°${lo < 0 ? "W" : "E"}</text>`).join("")}
      <path d="${path(route)}" class="m-route"/>
      ${PORTS.map(pt => { const c = p?.ports?.[pt.tema]; return `<a href="#tema-${pt.tema}"><g class="m-port ${c ? "done" : ""}" transform="translate(${X(pt.lon)},${Y(pt.lat)})"><circle r="9"/><text class="m-n" text-anchor="middle" dy="4">${pt.tema}</text><text class="m-name" x="12" dy="4">${pt.name}</text></g></a>`; }).join("")}
      <g class="m-boss ${passedBoss ? "done" : ""}" transform="translate(${X(BOSS.lon)},${Y(BOSS.lat)})"><path d="M0,-12 L11,8 L-11,8 Z"/><text x="16" dy="18" class="m-name">Paso del Estrecho</text></g>
    </svg></div>
    <p><b>${conquered}/10 puertos</b> · Paso del Estrecho: ${passedBoss ? "superado" : "pendiente"}</p>
    <h2>Insignias</h2>
    <div class="grid badges">${Object.entries(BADGES).map(([id, b]) => { const got = p?.badges?.[id]; return `<div class="badge ${got ? "got" : ""}"><span class="bmark" aria-hidden="true"></span><div><b>${esc(b.t)}</b><p class="small muted">${esc(b.d)}</p>${got ? `<p class="small">${fmtDate(got)}</p>` : ""}</div></div>`; }).join("")}</div>
    <h2>Rangos</h2>
    <div class="ranks">${RANKS.map(r => `<div class="${(p?.xp || 0) >= r.xp ? "on" : ""}"><b>${r.name}</b><span class="mono small">${r.xp} XP</span></div>`).join("")}</div>
  </section>`);
  main.replaceChildren(v);
}

// ---------- REGATAS (duels)
function viewRegatas() {
  const meA = state.me;
  const other = CREW.find(c => c.alias !== meA);
  const board = CREW.map(c => ({ c, w: weeklyXP(state.players[c.alias]), wins: state.duels.filter(d => d.winner === c.alias).length })).sort((a, b) => b.w - a.w);
  const v = h(`<section class="stack">
    <div><p class="eyebrow">Rampu contra Reyero</p><h1>Regatas</h1><p class="lede">Lanza un reto con las mismas preguntas para los dos. Cada uno lo responde cuando pueda; gana quien acierte más y, si empatáis, quien tarde menos.</p></div>
    <div class="grid two">
      <article class="panel stack"><h2>Clasificación de la semana</h2>${board.map((x, i) => `<div class="row between lb"><span class="row"><span class="mono">${i + 1}</span><span class="crew-init sm" style="--c:${x.c.color}">${x.c.name[0]}</span><b>${x.c.name}</b></span><span class="mono">${x.w} XP · ${x.wins} regatas ganadas</span></div>`).join("")}</article>
      <article class="panel stack"><h2>Nueva regata</h2>${state.mode === "guest" ? `<p class="muted">Los invitados pueden ver las regatas, pero no lanzarlas.</p>` : `
        <label>Recorrido <select id="d-kind"><option value="full">Simulacro completo (45)</option><option value="elim">Bloques eliminatorios (RIPA 10 · Balizamiento 5 · Carta 4)</option>${TEMAS.map(t => `<option value="t${t.id}">Tema ${t.id}: ${esc(t.short)} (10)</option>`).join("")}</select></label>
        <button class="btn primary" id="d-go">Retar a ${esc(other?.name || "")}</button>`}</article>
    </div>
    <h2>Regatas</h2>
    <div class="stack dlist">${state.duels.length ? state.duels.slice(0, 20).map(d => {
      const rs = d.results || {}; const mine = meA && rs[meA];
      return `<article class="panel row between duel"><div><b>${esc(d.title)}</b><p class="small muted">${crewName(d.by)} retó a ${crewName(d.to)} · ${fmtDate(d.created)}</p>
        <p class="small">${CREW.map(c => rs[c.alias] ? `${c.name}: <b class="num">${rs[c.alias].score}/${d.q.length}</b> en ${Math.round(rs[c.alias].secs / 60)} min` : `${c.name}: pendiente`).join(" · ")}</p></div>
        <div class="row">${d.winner ? `<span class="chip ok">Gana ${crewName(d.winner)}</span>` : ""}${meA && !mine && state.mode !== "guest" ? `<a class="btn primary sm" href="#regata-${d.id}">Navegar</a>` : ""}</div></article>`;
    }).join("") : `<p class="muted">Todavía no hay regatas. Lanza la primera.</p>`}</div>
  </section>`);
  main.replaceChildren(v);
  v.querySelector("#d-go")?.addEventListener("click", async () => {
    const kind = v.querySelector("#d-kind").value;
    let qs, title;
    if (kind === "full") { qs = randomExam(false); title = "Regata: simulacro completo"; }
    else if (kind === "elim") { qs = randomExam(false).filter(q => ["rip", "bal", "car"].includes(q.b)); title = "Regata: bloques eliminatorios"; }
    else { const t = +kind.slice(1); qs = shuffle(qOfTema(t).filter(q => !q.annulled)).slice(0, 10); title = `Regata: ${TEMAS[t - 1].short}`; }
    const d = { id: "d" + Date.now().toString(36), title, by: meA, to: other.alias, created: Date.now(), q: qs.map(q => q.id), results: {} };
    try { await saveDuel(d); toast("Regata creada. Ahora te toca navegarla."); go(`regata-${d.id}`); } catch (e) { toast("No se pudo crear la regata."); }
  });
}
function viewRegata(r) {
  const id = r.slice(7); const d = state.duels.find(x => x.id === id);
  if (!d) { main.replaceChildren(h(`<p class="muted">Cargando regata…</p>`)); setTimeout(() => state.duels.find(x => x.id === id) ? route() : go("regatas"), 1500); return; }
  const qs = d.q.map(x => DB.byId[x]).filter(Boolean);
  cleanup = examRunner(main, { qs, lib: false, title: d.title, examId: "duel", onFinish: async (res, answers, secs) => {
    d.results = { ...(d.results || {}), [state.me]: { score: res.correct, secs, at: Date.now() } };
    const rs = d.results; const [a, b] = CREW.map(c => rs[c.alias]);
    if (a && b) { d.winner = a.score !== b.score ? (a.score > b.score ? CREW[0].alias : CREW[1].alias) : (a.secs <= b.secs ? CREW[0].alias : CREW[1].alias); if (d.winner === state.me) { badge("regatista"); addXP(100, "regata"); } }
    await saveDuel(d).catch(() => toast("No se pudo guardar el resultado."));
  } });
}

// ---------- CARGA DE MATERIAL + PLAN
function hoursFor(t) {
  const pages = t.pages[1] - t.pages[0] + 1; const nq = qOfTema(t.id).length;
  return Math.round((pages * 0.3 + (nq * 1.4) / 60 + MODULES[t.id].length * 0.5) * 2) / 2;
}
function viewCarga() {
  const rows = TEMAS.map(t => {
    const nq = qOfTema(t.id).length; const ex = TEMA_BLOCKS[t.id].reduce((s, b) => s + BLK[b].n, 0);
    const elim = TEMA_BLOCKS[t.id].some(b => BLK[b].maxErr != null);
    const subs = DB.theory[t.id]?.subtemas?.length || 0;
    return { t, nq, ex, elim, subs, pages: t.pages[1] - t.pages[0] + 1, hrs: hoursFor(t) };
  });
  const tot = rows.reduce((s, r) => ({ nq: s.nq + r.nq, pages: s.pages + r.pages, hrs: s.hrs + r.hrs, subs: s.subs + r.subs }), { nq: 0, pages: 0, hrs: 0, subs: 0 });
  const plan = state.plan;
  const v = h(`<section class="stack">
    <div><p class="eyebrow">Antes de planificar, mide la carga</p><h1>Carga de material y plan</h1></div>
    <div class="grid stats4">
      <div class="panel stat"><p class="eyebrow">Temas</p><p class="num big">10</p><p class="small muted">${tot.subs} subtemas</p></div>
      <div class="panel stat"><p class="eyebrow">Apuntes base</p><p class="num big">${tot.pages}</p><p class="small muted">páginas de teoría</p></div>
      <div class="panel stat"><p class="eyebrow">Preguntas oficiales</p><p class="num big">${tot.nq}</p><p class="small muted">distintas, 2022–2026</p></div>
      <div class="panel stat"><p class="eyebrow">Estimación</p><p class="num big">${Math.round(tot.hrs)} h</p><p class="small muted">+ simulacros finales</p></div>
    </div>
    <div class="panel scroll-x"><table class="carga"><thead><tr><th>Tema</th><th>Subtemas</th><th>Páginas</th><th>Preguntas oficiales</th><th>En el examen</th><th>Horas</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td><a href="#tema-${r.t.id}">${r.t.id}. ${esc(r.t.title)}</a> ${r.elim ? `<span class="chip bad">eliminatorio</span>` : ""}</td><td class="num">${r.subs}</td><td class="num">${r.pages}</td><td class="num">${r.nq}</td><td class="num">${r.ex}</td><td class="num">${r.hrs}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="small muted">Horas estimadas = páginas × 0,3 h + preguntas oficiales × 1,4 min + 30 min por interactivo. RIPA, Balizamiento y Carta son eliminatorios: un exceso de fallos en cualquiera suspende aunque llegues a 32 aciertos.</p>
    <article class="panel stack">
      <h2>Generador de plan</h2>
      <p class="muted">El plan es común para Rampu y Reyero. Cualquiera de los dos puede regenerarlo.</p>
      <form class="row plan-form" onsubmit="return false">
        <label>Horas al día <input id="pl-h" type="number" min="0.5" max="8" step="0.5" value="${plan?.hours || 2}"></label>
        <label>Empieza <input id="pl-s" type="date" value="${plan?.start || today()}"></label>
        <fieldset class="days"><legend>Días de estudio</legend>${["L", "M", "X", "J", "V", "S", "D"].map((d, i) => `<label><input type="checkbox" value="${i}" ${!plan || plan.wd.includes(i) ? "checked" : ""}> ${d}</label>`).join("")}</fieldset>
        <button type="button" class="btn primary" id="pl-go" ${state.mode === "guest" ? "disabled" : ""}>Generar plan</button>
      </form>
      <div class="pl-sum"></div>
      <div class="pl-cal"></div>
    </article>
  </section>`);
  main.replaceChildren(v);
  const renderPlan = pl => {
    if (!pl) { v.querySelector(".pl-cal").innerHTML = `<p class="muted">Sin plan todavía.</p>`; return; }
    v.querySelector(".pl-sum").innerHTML = `<div class="tint">${esc(pl.summary)}</div>`;
    const weeks = {};
    pl.days.forEach(d => { const k = d.week; (weeks[k] = weeks[k] || []).push(d); });
    v.querySelector(".pl-cal").innerHTML = Object.entries(weeks).map(([w, ds]) => `<div class="pweek"><p class="eyebrow">Semana ${w}</p><div class="pdays">${ds.map(d => `<div class="pday ${d.date === today() ? "today" : ""} ${d.date < today() ? "past" : ""}"><b class="mono">${new Date(d.date + "T12:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}</b>${d.items.map(i => `<span class="pi ${i.type}">${esc(i.label)}</span>`).join("")}</div>`).join("")}</div></div>`).join("");
  };
  renderPlan(plan);
  v.querySelector("#pl-go").onclick = async () => {
    const hrs = +v.querySelector("#pl-h").value || 2; const start = v.querySelector("#pl-s").value || today();
    const wd = [...v.querySelectorAll(".days input:checked")].map(i => +i.value);
    if (!wd.length) { toast("Elige al menos un día de estudio."); return; }
    const pl = buildPlan(hrs, start, wd, rows);
    await savePlan(pl).catch(() => toast("No se pudo guardar el plan."));
    renderPlan(pl); toast("Plan guardado para los dos.");
  };
}
function buildPlan(hrs, start, wd, rows) {
  const order = [1, 2, 5, 6, 3, 4, 7, 8, 9, 10];
  const end = new Date(EXAM_DATE.getTime() - 86400000);
  const days = [];
  for (let d = new Date(start + "T12:00"); d <= end; d = new Date(d.getTime() + 86400000)) {
    const w = (d.getDay() + 6) % 7; if (wd.includes(w)) days.push(d.toISOString().slice(0, 10));
  }
  const n = days.length;
  const finalN = Math.max(Math.min(10, Math.round(n * 0.25)), Math.min(4, n));
  const studyDays = Math.max(0, n - finalN);
  const review = Math.min(0.5, hrs * 0.2); // SRS block daily
  const avail = studyDays * (hrs - review);
  const need = order.reduce((s, t) => s + rows.find(r => r.t.id === t).hrs, 0);
  const factor = avail > 0 ? Math.min(1.6, avail / need) : 0;
  const queue = order.map(t => ({ t, left: rows.find(r => r.t.id === t).hrs * Math.max(factor, 0.0001) }));
  const out = [];
  const startD = new Date(start + "T12:00");
  const weekOf = ds => 1 + Math.floor((new Date(ds + "T12:00") - startD) / (7 * 86400000));
  let qi = 0;
  days.forEach((ds, i) => {
    const items = [{ type: "rev", label: `Guardia de repaso ${Math.round(review * 60)} min` }];
    if (i < studyDays) {
      let cap = hrs - review;
      while (cap > 0.05 && qi < queue.length) {
        const q = queue[qi]; const take = Math.min(cap, q.left);
        items.push({ type: "tema", tema: q.t, label: `Tema ${q.t} ${TEMAS[q.t - 1].short} · ${fmtH(take)}` });
        q.left -= take; cap -= take; if (q.left <= 0.05) { items.push({ type: "port", tema: q.t, label: `Examen de puerto ${q.t}` }); qi++; }
      }
      if (i > 0 && i % 4 === 0) items.push({ type: "carta", label: "Carta: 2 problemas oficiales" });
    } else {
      const k = i - studyDays;
      items.push({ type: "sim", label: k % 2 === 0 ? "Simulacro oficial completo" : "Simulacro aleatorio + repaso de fallos" });
      if (k % 2 === 1) items.push({ type: "carta", label: "Carta y mareas: 4 problemas" });
    }
    out.push({ date: ds, week: weekOf(ds), items });
  });
  const finishTheory = out[Math.max(0, studyDays - 1)]?.date;
  const summary = n === 0 ? "No hay días de estudio entre la fecha de inicio y el examen." :
    `${n} días de estudio · ${hrs} h/día · el temario se cubre ${factor >= 1 ? "con margen" : `al ${Math.round(factor * 100)} % del tiempo recomendado`}${finishTheory ? ` y termina el ${new Date(finishTheory + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })}` : ""}; los últimos ${finalN} días son de simulacros.${factor < 0.8 ? " Con este ritmo vas justo: sube las horas o añade días." : ""}`;
  return { hours: hrs, start, wd, days: out, summary, by: state.me, at: Date.now() };
}
const fmtH = x => x >= 1 ? `${Math.round(x * 10) / 10} h` : `${Math.round(x * 60)} min`;

// ---------- CREW / SETTINGS / SHARING HELP
function viewCrew() {
  const v = h(`<section class="stack narrow">
    <div><p class="eyebrow">Perfiles y acceso</p><h1>Tripulación</h1></div>
    <article class="panel stack"><h2>En este dispositivo</h2>
      ${state.mode === "guest" ? `<p>Estás en <b>modo invitado</b>: ves todo y puedes practicar, pero tu progreso se guarda solo aquí.</p>` :
      `<p>${state.me ? `Navegas como <b>${esc(crewName(state.me))}</b>.` : "Aún no has elegido perfil."}</p>
      <div class="row">${CREW.map(c => `<button class="btn ${state.me === c.alias ? "primary" : ""}" data-a="${c.alias}" ${claimConflict(c.alias) ? "disabled" : ""}>Soy ${c.name}</button>`).join("")}</div>`}
      <p class="small muted">Estado: ${state.mode === "crew" ? "sincronizado con claude.ai" : state.mode === "guest" ? "invitado (solo lectura)" : "sin conexión con claude.ai: progreso guardado en este navegador"}.</p>
      <div class="row"><button class="btn" id="tt">Cambiar a tema ${curTheme() === "dark" ? "claro" : "oscuro"}</button></div>
    </article>
    <article class="panel stack"><h2>Cómo compartir la app</h2>
      <ol>
        <li>Abre el menú <b>Compartir</b> de este artifact en claude.ai.</li>
        <li>Invita a <b>Reyero</b> por email con el permiso <b>Editor</b>. Si le das otro permiso, no podrá guardar su progreso.</li>
        <li>Invita a otros amigos por email como <b>Lector</b>: verán todo y practicarán en modo invitado, sin tocar vuestro progreso.</li>
        <li><b>No actives el enlace público.</b> Con el enlace público activo, los editores de fuera de tu organización pasan a ser solo lectores.</li>
      </ol>
      <p class="small muted">Funciona en el móvil, la tablet y el ordenador, desde el navegador o la app de Claude, con la sesión de claude.ai iniciada.</p>
    </article>
    <article class="panel stack"><h2>Sobre el contenido</h2>
      <p class="small">Preguntas: exámenes oficiales de la Dirección General de la Marina Mercante (abril 2022 – junio 2026) con sus plantillas de respuestas. Teoría: apuntes PER (2015) revisados y actualizados con la normativa vigente en noviembre de 2026 (RD 875/2014, RD 1188/2025, RD 339/2021, RD 1185/2006, RD 550/2020, RD 876/2014, MARPOL V, RIPA con enmiendas, IALA MBS 2022, ERC 2025). Lo que no se ha podido confirmar está marcado como «por verificar».</p>
    </article>
  </section>`);
  main.replaceChildren(v);
  v.querySelectorAll("[data-a]").forEach(b => b.onclick = async () => { claim(b.dataset.a); renderChrome(); toast(`Navegas como ${crewName(b.dataset.a)}.`); go("inicio"); });
  v.querySelector("#tt").onclick = () => { toggleTheme(); viewCrew(); };
}

// ---------- boot
window.addEventListener("per-error", e => toast(e.detail));
window.addEventListener("error", e => { const m = String(e.message || e.error || ""); if (/ResizeObserver|Script error/i.test(m)) return; console.warn(m); });
window.addEventListener("unhandledrejection", e => console.warn("rejection", e.reason));
async function boot() {
  main.replaceChildren(h(`<p class="muted loading">Cargando cartas y cuaderno de bitácora…</p>`));
  try { await Promise.all([loadAll(), init()]); }
  catch (e) { console.error(e); main.replaceChildren(h(`<p>No se pudieron cargar los datos. Recarga la página.</p>`)); return; }
  renderChrome();
  let t = null;
  onChange(what => { renderChrome(); if (["players", "duels", "plan"].includes(what)) { clearTimeout(t); t = setTimeout(() => { const b = (location.hash.slice(1) || "inicio").split("-")[0]; if (["inicio", "regatas", "travesia"].includes(b)) route(); }, 400); } });
  window.addEventListener("hashchange", route);
  route();
}
boot();
