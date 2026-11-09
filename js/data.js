// Loads question bank, theory and the interactive module registry.
export const TEMAS = [
  { id: 1, title: "Nomenclatura náutica", short: "Nomenclatura", pages: [3, 13] },
  { id: 2, title: "Amarre y fondeo", short: "Amarre y fondeo", pages: [14, 18] },
  { id: 3, title: "Seguridad en la mar", short: "Seguridad", pages: [19, 31] },
  { id: 4, title: "Legislación", short: "Legislación", pages: [32, 41] },
  { id: 5, title: "Balizamiento", short: "Balizamiento", pages: [42, 46] },
  { id: 6, title: "Reglamento de Abordajes (RIPA)", short: "RIPA", pages: [47, 79] },
  { id: 7, title: "Maniobras", short: "Maniobras", pages: [80, 88] },
  { id: 8, title: "Emergencias en la mar", short: "Emergencias", pages: [89, 98] },
  { id: 9, title: "Meteorología", short: "Meteorología", pages: [99, 106] },
  { id: 10, title: "Teoría y carta de navegación", short: "Navegación y carta", pages: [107, 146] },
];

export const MODULES = {
  1: ["astillero", "ancla-helice", "terminologia"],
  2: ["nudos", "fondeo"],
  3: ["estabilidad", "equipo-zona", "hombre-agua"],
  4: ["legislacion"],
  5: ["balizas-catalogo", "ritmos-luz", "entrada-puerto"],
  6: ["ripa-luces", "ripa-maniobra", "ripa-sonidos", "ripa-reglas"],
  7: ["maniobras"],
  8: ["emergencias"],
  9: ["isobaras", "brisas", "escalas", "barometro"],
  10: ["carta", "mareas", "navcalc"],
};

export const DB = { questions: [], byId: {}, exams: [], theory: {}, meta: {} };

export async function loadAll() {
  const qres = await fetch("data/questions.json");
  const q = await qres.json();
  DB.questions = q.questions; DB.exams = q.exams;
  for (const x of DB.questions) DB.byId[x.id] = x;
  const th = await Promise.all(TEMAS.map(t => fetch(`data/theory/tema-${String(t.id).padStart(2, "0")}.json`).then(r => r.ok ? r.json() : null).catch(() => null)));
  th.forEach((t, i) => { if (t) DB.theory[TEMAS[i].id] = t; });
  return DB;
}

const modCache = {};
export async function loadModule(id) {
  if (!modCache[id]) modCache[id] = import(`./mods/${id}.js`).then(m => m.default).catch(e => { console.warn("mod", id, e); delete modCache[id]; return null; });
  return modCache[id];
}

export function convLabel(conv) {
  const [y, m] = conv.split("-");
  const M = { "04": "Abril", "06": "Junio", "10": "Octubre", "11": "Noviembre", "12": "Diciembre" };
  return `${M[m] || m} ${y}`;
}
