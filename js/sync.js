// Sincronización de la versión web. Ofrece la misma interfaz que el `db` de claude.ai,
// guarda una copia local y una cola de cambios para funcionar sin conexión.
const ENDPOINT = "https://per-sync.ramputink.workers.dev";
const POLL_MS = 20000;
const KEY = "per:sync", CODE_KEY = "per:syncCode";

const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const isObj = x => x && typeof x === "object" && !Array.isArray(x);

export const isWeb = () => !window.claude;
export const syncLinked = () => !!read(CODE_KEY, null);
export function syncUnlink() { try { localStorage.removeItem(CODE_KEY); localStorage.removeItem(KEY); } catch {} }

function deep(a, b) {
  if (isObj(a) && isObj(b)) { const o = { ...a }; for (const k of Object.keys(b)) o[k] = k in a ? deep(a[k], b[k]) : b[k]; return o; }
  return b === undefined ? a : b;
}
function mergeSrs(a, b) {
  const o = { ...a };
  for (const [id, v] of Object.entries(b)) {
    const cur = o[id];
    if (!cur || v[2] > cur[2] || (v[2] === cur[2] && v[1] >= cur[1])) o[id] = v;
  }
  return o;
}
function maxNums(a = {}, b = {}) {
  const o = { ...a };
  for (const [k, v] of Object.entries(b)) o[k] = typeof v === "number" && typeof o[k] === "number" ? Math.max(o[k], v) : v;
  return o;
}
function mergePlayer(a, b) {
  const [older, newer] = (a.updatedAt || 0) <= (b.updatedAt || 0) ? [a, b] : [b, a];
  const out = deep(older, newer);
  out.xp = Math.max(a.xp || 0, b.xp || 0);
  out.updatedAt = newer.updatedAt || 0;
  const sa = a.streak || {}, sb = b.streak || {};
  out.streak = (sa.last || "") > (sb.last || "") ? sa : (sb.last || "") > (sa.last || "") ? sb : (sa.count || 0) >= (sb.count || 0) ? sa : sb;
  out.days = { ...a.days };
  for (const [d, v] of Object.entries(b.days || {})) out.days[d] = maxNums(out.days[d], v);
  const exams = new Map([...(a.exams || []), ...(b.exams || [])].map(e => [e.date, e]));
  out.exams = [...exams.values()].sort((x, y) => x.date - y.date).slice(-60);
  out.stats = { ...a.stats };
  for (const [k, v] of Object.entries(b.stats || {})) {
    const cur = out.stats[k];
    out.stats[k] = !cur || (v.a || 0) >= (cur.a || 0) ? { ...v, c: Math.max(v.c || 0, cur?.c || 0) } : { ...cur, c: Math.max(v.c || 0, cur.c || 0) };
  }
  return out;
}
export function mergeDoc(path, base, next) {
  if (base == null) return next;
  if (/^players\/[^/]+\/srs\//.test(path)) return mergeSrs(base, next);
  if (/^players\/[^/]+$/.test(path)) return mergePlayer(base, next);
  if (path.startsWith("duels/")) return deep(base, next);
  return next;
}

async function api(code, path, init = {}) {
  const r = await fetch(ENDPOINT + path, { ...init, cache: "no-store", headers: { Authorization: `Bearer ${code}`, ...(init.headers || {}) } });
  if (!r.ok) throw Object.assign(new Error(`sync ${r.status}`), { status: r.status });
  return r.json();
}

// Comprueba el código y sube a la nube lo estudiado antes de vincular este dispositivo.
export async function syncLink(rawCode, aliases) {
  const code = rawCode.trim().toLowerCase();
  try { await api(code, "/ping"); }
  catch (e) { return e.status === 401 ? "bad" : "net"; }
  const outbox = {};
  for (const a of aliases) {
    const p = read(`per:p:${a}`, null), srs = read(`per:srs:${a}`, null);
    if (p?.updatedAt) outbox[`players/${a}`] = p;
    for (const [b, m] of Object.entries(srs || {})) outbox[`players/${a}/srs/${b}`] = m;
  }
  write(KEY, { since: 0, docs: {}, outbox });
  write(CODE_KEY, code);
  return "ok";
}

export function webDb() {
  const code = read(CODE_KEY, null);
  if (!code) return null;
  const st = read(KEY, { since: 0, docs: {}, outbox: {} });
  const subs = new Set();
  let busy = null, offline = false;
  const db = { isWeb: true, onStatus: null };

  const save = () => write(KEY, st);
  const value = p => p in st.outbox ? mergeDoc(p, st.docs[p], st.outbox[p]) : st.docs[p];
  const paths = () => new Set([...Object.keys(st.docs), ...Object.keys(st.outbox)]);
  const collSnap = col => {
    const depth = col.split("/").length + 1;
    const docs = [...paths()].filter(p => p.startsWith(col + "/") && p.split("/").length === depth)
      .map(p => ({ id: p.split("/").pop(), data: () => value(p) }));
    return { docs };
  };
  const docSnap = p => ({ exists: value(p) != null, data: () => value(p) });
  const status = () => db.onStatus?.({ pending: Object.keys(st.outbox).length > 0, offline });
  const notify = changed => subs.forEach(s => { if (changed.some(s.match)) s.fire(); });

  function pull() {
    return api(code, `/changes?since=${st.since}`).then(r => {
      const changed = [];
      for (const d of r.docs) {
        if (JSON.stringify(st.docs[d.path]) !== JSON.stringify(d.data)) changed.push(d.path);
        st.docs[d.path] = d.data;
      }
      st.since = r.now - 5000; // margen por escrituras simultáneas; lo repetido se ignora arriba
      save();
      if (changed.length) notify(changed);
    });
  }
  async function pushAll() {
    for (const p of Object.keys(st.outbox)) {
      const sent = st.outbox[p];
      const body = mergeDoc(p, st.docs[p], sent);
      await api(code, `/doc?path=${encodeURIComponent(p)}`, { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
      st.docs[p] = body;
      if (st.outbox[p] === sent) delete st.outbox[p];
      save();
    }
  }
  function sync() {
    if (busy) return busy;
    busy = pull().then(pushAll).then(() => { offline = false; }).catch(e => {
      offline = true;
      if (e.status === 401) window.dispatchEvent(new CustomEvent("per-error", { detail: "El código de tripulación ya no es válido. Vuelve a vincular este dispositivo." }));
      else console.warn("sync", e);
    }).finally(() => { busy = null; status(); });
    return busy;
  }
  const settled = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);

  db.collection = col => ({
    onSnapshot(cb) {
      const s = { match: p => p.startsWith(col + "/") && p.split("/").length === col.split("/").length + 1, fire: () => cb(collSnap(col)) };
      subs.add(s); queueMicrotask(s.fire);
      return () => subs.delete(s);
    },
    async get() { await settled(sync(), 4000); return collSnap(col); },
  });
  db.doc = p => ({
    onSnapshot(cb) {
      const s = { match: x => x === p, fire: () => cb(docSnap(p)) };
      subs.add(s); queueMicrotask(s.fire);
      return () => subs.delete(s);
    },
    async get() { await settled(sync(), 4000); return docSnap(p); },
    async set(data) { st.outbox[p] = data; save(); status(); sync(); },
  });

  setInterval(() => { if (!document.hidden) sync(); }, POLL_MS);
  window.addEventListener("online", sync);
  document.addEventListener("visibilitychange", () => { sync(); });
  return db;
}
