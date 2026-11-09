// Shared state: claude.ai `db` capability when available, localStorage fallback.
// Layout:
//   players/<alias>            summary doc (xp, streak, badges, days, exams, ports, stats, mods)
//   players/<alias>/srs/<blk>  { qid: [box, dueDayNumber, seen, correct] }
//   duels/<id>                 regatas between crew
//   plan/main                  shared study plan
export const CREW = [
  { alias: "rampu", name: "Rampu", color: "var(--accent)" },
  { alias: "reyero", name: "Reyero", color: "var(--stbd)" },
];

import { webDb, isWeb } from "./sync.js";

const LS = {
  get(k, d) { try { const v = localStorage.getItem("per:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("per:" + k, JSON.stringify(v)); } catch {} },
};
export { LS };

const listeners = new Set();
// Platform snapshots can be frozen: always work on deep copies.
const clone = o => (o == null ? o : JSON.parse(JSON.stringify(o)));
export const state = {
  db: null, user: null, downloads: null,
  canWrite: false,         // can write shared db
  mode: "loading",         // "crew" | "guest" | "local"
  me: null,                // alias of this device's crew member (null for guests)
  myId: null,              // claude user id if any
  players: {},             // alias -> summary doc
  srs: {},                 // my srs: blk -> map
  duels: [],
  plan: null,
};
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(what) { listeners.forEach(f => { try { f(what); } catch (e) { console.error(e); } }); }

export function emptyPlayer(alias) {
  return { alias, xp: 0, streak: { count: 0, last: null }, badges: {}, days: {}, exams: [], ports: {}, stats: {}, mods: {}, claimedBy: null, updatedAt: 0 };
}

function withTimeout(p, ms) { return Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]); }

export async function init() {
  const c = window.claude;
  let db = null, user = null, downloads = null;
  if (c?.use) {
    [db, user, downloads] = await Promise.all([
      withTimeout(c.use("db"), 9000).catch(() => null),
      withTimeout(c.use("user"), 9000).catch(() => null),
      withTimeout(c.use("downloads"), 9000).catch(() => null),
    ]);
  }
  if (isWeb()) {
    db = webDb();
    state.web = true;
    state.canWrite = !!db;
    if (db) db.onStatus = s => { state.syncStatus = s; emit("sync"); };
  }
  state.db = db; state.user = user; state.downloads = downloads;
  if (user) {
    try { state.myId = await user.id(); } catch { state.myId = null; }
    let can = null;
    try { can = await user.can("data.write"); } catch { can = null; }
    if (can === null) { try { can = (await user.canEdit()) || (await user.isOwner()); } catch { can = false; } }
    state.canWrite = !!can && !!db;
  }
  state.me = LS.get("me", null);
  if (!db) state.mode = "local";
  else state.mode = state.canWrite ? "crew" : "guest";
  if (state.mode === "guest") state.me = null;
  if (state.mode === "local" && !state.me) state.me = null;

  if (db) {
    db.collection("players").onSnapshot(snap => {
      for (const d of snap.docs) { if (d.id === state.me && state.players[d.id] && pTimer) continue; state.players[d.id] = { ...emptyPlayer(d.id), ...clone(d.data()) }; }
      emit("players");
    }, e => console.warn("players", e));
    db.collection("duels").onSnapshot(snap => {
      state.duels = snap.docs.map(d => ({ id: d.id, ...clone(d.data()) })).sort((a, b) => (b.created || 0) - (a.created || 0));
      emit("duels");
    }, e => console.warn("duels", e));
    db.doc("plan/main").onSnapshot(s => { state.plan = s.exists ? clone(s.data()) : null; emit("plan"); }, () => {});
  } else {
    for (const c of CREW) state.players[c.alias] = { ...emptyPlayer(c.alias), ...LS.get("p:" + c.alias, {}) };
    state.duels = LS.get("duels", []);
    state.plan = LS.get("plan", null);
  }
  if (state.mode === "guest") {
    state.players.__guest = { ...emptyPlayer("__guest"), ...LS.get("p:__guest", {}) };
    state.srs = LS.get("srs:__guest", {});
  }
  if (state.me) await loadMySrs();
  if (state.web && db && state.me) {
    db.collection(`players/${state.me}/srs`).onSnapshot(snap => {
      for (const d of snap.docs) if (!dirtySrs.has(d.id)) state.srs[d.id] = clone(d.data()) || {};
      emit("srs");
    });
  }
  emit("init");
}

export function myAlias() { return state.mode === "guest" ? "__guest" : state.me; }
export function me() { const a = myAlias(); return a ? (state.players[a] || (state.players[a] = emptyPlayer(a))) : null; }

export async function claim(alias) {
  state.me = alias; LS.set("me", alias);
  const p = me();
  if (state.db && state.canWrite) {
    if (!p.claimedBy && state.myId) p.claimedBy = state.myId;
    savePlayer(true);
  }
  loadMySrs().then(() => emit("me"));
  emit("me");
}
export function claimConflict(alias) {
  const p = state.players[alias];
  return !!(p && p.claimedBy && state.myId && p.claimedBy !== state.myId);
}

async function loadMySrs() {
  const a = myAlias(); if (!a) return;
  if (state.db && state.mode === "crew") {
    try {
      const snap = await state.db.collection(`players/${a}/srs`).get();
      state.srs = {}; for (const d of snap.docs) state.srs[d.id] = clone(d.data()) || {};
    } catch (e) { console.warn("srs", e); state.srs = LS.get("srs:" + a, {}); }
  } else state.srs = LS.get("srs:" + a, {});
}

// --- debounced writes
let pTimer = null; const dirtySrs = new Set(); let sTimer = null;
export function touchPlayer() { me().updatedAt = Date.now(); emit("players"); clearTimeout(pTimer); pTimer = setTimeout(() => { pTimer = null; savePlayer(); }, 1500); }
export async function savePlayer(now) {
  const a = myAlias(); if (!a) return; const p = state.players[a];
  if (state.db && state.mode === "crew") {
    try { await state.db.doc(`players/${a}`).set(JSON.parse(JSON.stringify(p))); state.syncError = null; }
    catch (e) { state.syncError = e?.code || String(e); console.warn("save", e); window.dispatchEvent(new CustomEvent("per-error", { detail: "Guardar progreso: " + (e?.code || e?.message || e) })); if (e?.code === "invalid_argument" || e?.code === "not_granted") { state.mode = "guest"; } emit("sync"); }
  } else LS.set("p:" + a, p);
}
export function touchSrs(blk) { dirtySrs.add(blk); clearTimeout(sTimer); sTimer = setTimeout(flushSrs, 2000); }
async function flushSrs() {
  const a = myAlias(); if (!a) return;
  const blks = [...dirtySrs]; dirtySrs.clear();
  if (state.db && state.mode === "crew") {
    for (const b of blks) { try { await state.db.doc(`players/${a}/srs/${b}`).set(state.srs[b] || {}); } catch (e) { console.warn("srs save", e); } }
  } else LS.set("srs:" + a, state.srs);
}
const flushPending = () => { if (pTimer) savePlayer(); if (sTimer) flushSrs(); };
window.addEventListener("pagehide", flushPending);
document.addEventListener("visibilitychange", () => { if (document.hidden) flushPending(); });

// --- duels & plan
export async function saveDuel(d) {
  if (state.db && state.mode === "crew") { const { id, ...rest } = d; await state.db.doc(`duels/${id}`).set(JSON.parse(JSON.stringify(rest))); }
  else { const i = state.duels.findIndex(x => x.id === d.id); if (i >= 0) state.duels[i] = d; else state.duels.unshift(d); LS.set("duels", state.duels); emit("duels"); }
}
export async function savePlan(plan) {
  state.plan = plan;
  if (state.db && state.mode === "crew") await state.db.doc("plan/main").set(JSON.parse(JSON.stringify(plan)));
  else LS.set("plan", plan);
  emit("plan");
}

// --- module store (per player, small JSON)
export function modStore(id) {
  return {
    get(k, d) { const p = me(); const v = p?.mods?.[id]?.[k]; return v === undefined ? d : v; },
    set(k, v) { const p = me(); if (!p) return; p.mods[id] = p.mods[id] || {}; p.mods[id][k] = v; touchPlayer(); },
  };
}

export async function download(filename, data, mime) {
  const dl = state.downloads;
  if (!dl) return false;
  try {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || "application/octet-stream" });
    await dl.save({ filename, data: blob });
    return true;
  } catch (e) { console.warn("download", e); return false; }
}
