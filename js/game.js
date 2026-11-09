import { me, state, touchPlayer, touchSrs } from "./store.js";

export const EXAM_DATE = new Date("2026-11-21T09:00:00+01:00");
export const BLOCKS = [
  { id: "nom", name: "Nomenclatura náutica", n: 4, tema: 1 },
  { id: "ama", name: "Amarre y fondeo", n: 2, tema: 2 },
  { id: "seg", name: "Seguridad", n: 4, tema: 3 },
  { id: "leg", name: "Legislación", n: 2, tema: 4 },
  { id: "bal", name: "Balizamiento", n: 5, tema: 5, maxErr: 2 },
  { id: "rip", name: "RIPA", n: 10, tema: 6, maxErr: 5 },
  { id: "man", name: "Maniobra y navegación", n: 2, tema: 7 },
  { id: "eme", name: "Emergencias", n: 3, tema: 8 },
  { id: "met", name: "Meteorología", n: 4, tema: 9 },
  { id: "teo", name: "Teoría de la navegación", n: 5, tema: 10 },
  { id: "car", name: "Carta de navegación", n: 4, tema: 10, maxErr: 2 },
];
export const BLK = Object.fromEntries(BLOCKS.map(b => [b.id, b]));
export const TEMA_BLOCKS = { 1: ["nom"], 2: ["ama"], 3: ["seg"], 4: ["leg"], 5: ["bal"], 6: ["rip"], 7: ["man"], 8: ["eme"], 9: ["met"], 10: ["teo", "car"] };

export const RANKS = [
  { name: "Grumete", xp: 0 }, { name: "Marinero", xp: 600 }, { name: "Timonel", xp: 1800 },
  { name: "Contramaestre", xp: 4000 }, { name: "Patrón", xp: 7500 }, { name: "Capitán", xp: 12000 },
];
export function rankOf(xp) {
  let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const cur = RANKS[i], next = RANKS[i + 1];
  return { ...cur, idx: i, next, pct: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 };
}

// Travesía: 10 puertos del Mediterráneo español hasta el Estrecho (lat, lon reales)
export const PORTS = [
  { tema: 1, name: "Barcelona", lat: 41.37, lon: 2.18 },
  { tema: 2, name: "Tarragona", lat: 41.10, lon: 1.24 },
  { tema: 3, name: "Valencia", lat: 39.44, lon: -0.31 },
  { tema: 4, name: "Alicante", lat: 38.34, lon: -0.48 },
  { tema: 5, name: "Cartagena", lat: 37.59, lon: -0.98 },
  { tema: 6, name: "Almería", lat: 36.83, lon: -2.46 },
  { tema: 7, name: "Motril", lat: 36.72, lon: -3.52 },
  { tema: 8, name: "Málaga", lat: 36.71, lon: -4.42 },
  { tema: 9, name: "Estepona", lat: 36.41, lon: -5.15 },
  { tema: 10, name: "Algeciras", lat: 36.13, lon: -5.44 },
];
export const BOSS = { name: "Paso del Estrecho", lat: 36.0, lon: -5.6 };

export const BADGES = {
  "primera-guardia": { t: "Primera guardia", d: "Completa tu primer repaso diario." },
  "racha-7": { t: "Semana a bordo", d: "7 días seguidos estudiando." },
  "racha-21": { t: "Tres semanas de travesía", d: "21 días seguidos estudiando." },
  "centenario": { t: "Centenario", d: "100 respuestas correctas." },
  "mil-millas": { t: "Mil millas", d: "1.000 preguntas respondidas." },
  "todo-el-banco": { t: "Todo el banco", d: "Has visto todas las preguntas oficiales." },
  "paso-del-estrecho": { t: "Paso del Estrecho", d: "Aprueba tu primer simulacro." },
  "lobo-de-mar": { t: "Lobo de mar", d: "3 simulacros aprobados seguidos." },
  "ripa-perfecto": { t: "RIPA sin mácula", d: "Simulacro con 0 fallos en RIPA." },
  "carta-perfecta": { t: "Carta perfecta", d: "Simulacro con 0 fallos en carta." },
  "todos-los-puertos": { t: "Vuelta completa", d: "Conquista los 10 puertos." },
  "regatista": { t: "Regatista", d: "Gana una regata." },
  "ojo-de-faro": { t: "Ojo de faro", d: "Todos los ritmos de luz acertados en una ronda." },
  "noctambulo": { t: "Noctámbulo", d: "50 luces del RIPA identificadas." },
  "mano-de-nudos": { t: "Mano de nudos", d: "Todas las situaciones de nudos resueltas." },
  "astillero": { t: "Carpintero de ribera", d: "Todas las piezas de un modelo 3D localizadas." },
  "capitan-de-puerto": { t: "Capitán de puerto", d: "Entrada a puerto sin un fallo." },
  "meteorologo": { t: "Meteorólogo", d: "Reto de meteorología completado." },
  "navegante": { t: "Navegante", d: "5 problemas de carta correctos." },
  "marea-viva": { t: "Marea viva", d: "5 cálculos de marea correctos." },
  "quien-maniobra": { t: "Ojo de vigía", d: "10 situaciones RIPA seguidas sin fallo." },
  "primeros-auxilios": { t: "Botiquín", d: "Reto de emergencias completado." },
  "estibador": { t: "Inspector de equipo", d: "Revista de inspección superada." },
  "legislador": { t: "Legislador", d: "Reto de legislación completado." },
};

export function today() { const d = new Date(); return d.toISOString().slice(0, 10); }
export function dayNum(d = new Date()) { return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }

let notify = () => {};
export function setNotifier(fn) { notify = fn; }

export function addXP(xp, reason) {
  const p = me(); if (!p || !xp) return;
  p.xp += xp;
  const d = (p.days[today()] = p.days[today()] || { n: 0, c: 0, xp: 0 });
  d.xp += xp;
  bumpStreak(p);
  const before = rankOf(p.xp - xp).idx, after = rankOf(p.xp).idx;
  if (after > before) notify(`¡Ascenso! Ahora eres ${RANKS[after].name}.`, "rank");
  touchPlayer();
}
function bumpStreak(p) {
  const t = today();
  if (p.streak.last === t) return;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  p.streak.count = p.streak.last === y ? p.streak.count + 1 : 1;
  p.streak.last = t;
  if (p.streak.count >= 7) badge("racha-7");
  if (p.streak.count >= 21) badge("racha-21");
}
export function badge(id) {
  const p = me(); if (!p || p.badges[id] || !BADGES[id]) return;
  p.badges[id] = Date.now();
  notify(`Insignia: ${BADGES[id].t}`, "badge");
  touchPlayer();
}

// --- answers, SRS (Leitner 1..5) and stats
const INTERVAL = [0, 1, 2, 4, 8, 16];
export function srsGet(q) { return state.srs[q.b]?.[q.id] || null; }
export function recordAnswer(q, correct, { xp = true } = {}) {
  const p = me(); if (!p) return;
  const blk = q.b; state.srs[blk] = state.srs[blk] || {};
  const cur = state.srs[blk][q.id] || [0, 0, 0, 0];
  let [box, , seen, ok] = cur;
  const wasDue = box > 0 && cur[1] <= dayNum();
  box = correct ? Math.min(5, box + 1) : 1;
  seen++; if (correct) ok++;
  state.srs[blk][q.id] = [box, dayNum() + INTERVAL[box], seen, ok];
  touchSrs(blk);
  const st = (p.stats[blk] = p.stats[blk] || { a: 0, c: 0, r: [] });
  st.a++; if (correct) st.c++;
  st.r = (st.r || []).concat(correct ? 1 : 0).slice(-40);
  const d = (p.days[today()] = p.days[today()] || { n: 0, c: 0, xp: 0 });
  d.n++; if (correct) d.c++;
  if (xp) addXP(correct ? (wasDue ? 12 : 10) : 2, "pregunta"); else touchPlayer();
  const totalC = Object.values(p.stats).reduce((s, x) => s + x.c, 0);
  const totalA = Object.values(p.stats).reduce((s, x) => s + x.a, 0);
  if (totalC >= 100) badge("centenario");
  if (totalA >= 1000) badge("mil-millas");
}
export function dueList(questions) {
  const t = dayNum();
  return questions.filter(q => { const s = state.srs[q.b]?.[q.id]; return s && s[1] <= t; })
    .sort((a, b) => (state.srs[a.b][a.id][0] - state.srs[b.b][b.id][0]));
}
export function seenCount() { return Object.values(state.srs).reduce((s, m) => s + Object.keys(m).length, 0); }

// --- readiness: per-block accuracy from last 40 answers (Laplace-smoothed) + Monte Carlo pass probability
export function blockAcc(p, blk) {
  const r = p?.stats?.[blk]?.r || [];
  if (!r.length) return null;
  const c = r.reduce((s, x) => s + x, 0);
  return (c + 1) / (r.length + 2);
}
export function passProbability(p, runs = 3000) {
  const acc = BLOCKS.map(b => blockAcc(p, b.id));
  if (acc.every(a => a == null)) return null;
  let pass = 0;
  for (let k = 0; k < runs; k++) {
    let correct = 0, ok = true;
    BLOCKS.forEach((b, i) => {
      const a = acc[i] ?? 0.5; let err = 0;
      for (let j = 0; j < b.n; j++) { if (Math.random() < a) correct++; else err++; }
      if (b.maxErr != null && err > b.maxErr) ok = false;
    });
    if (ok && correct >= 32) pass++;
  }
  return pass / runs;
}

// --- exam scoring (official rules)
export function scoreExam(qs, answers, lib) {
  const by = {}; let correct = 0;
  qs.forEach((q, i) => {
    const a = answers[i];
    const ok = q.annulled || (a != null && q.ok.includes(a));
    by[q.b] = by[q.b] || { n: 0, c: 0, e: 0 }; by[q.b].n++;
    if (ok) { correct++; by[q.b].c++; } else by[q.b].e++;
  });
  const reasons = [];
  if (lib) {
    if (correct < 15) reasons.push(`Necesitas 15 aciertos (tienes ${correct}).`);
    if ((by.car?.e || 0) > 2) reasons.push(`Carta: ${by.car.e} fallos (máx. 2).`);
  } else {
    if (correct < 32) reasons.push(`Necesitas 32 aciertos (tienes ${correct}).`);
    for (const b of BLOCKS) if (b.maxErr != null && (by[b.id]?.e || 0) > b.maxErr) reasons.push(`${b.name}: ${by[b.id].e} fallos (máx. ${b.maxErr}).`);
  }
  return { correct, total: qs.length, by, pass: reasons.length === 0, reasons };
}

export function daysToExam() { return Math.max(0, Math.ceil((EXAM_DATE - new Date()) / 86400000)); }
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - day); return t.toISOString().slice(0, 10);
}
export function weeklyXP(p) {
  const wk = weekKey(); let s = 0;
  for (const [d, v] of Object.entries(p?.days || {})) if (d >= wk) s += v.xp || 0;
  return s;
}
