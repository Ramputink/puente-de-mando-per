// Equipo obligatorio por zona — RD 339/2021 (texto consolidado BOE-A-2021-8268, últ. act. RD 587/2022)
// y radio: RD 1185/2006 arts. 56–60 (modificados por RD 587/2022).
const ID = "equipo-zona";

const CSS = `
.m-equipo-zona { display:flex; flex-direction:column; gap:1rem; }
.m-equipo-zona .ez-map { aspect-ratio: 620/250; }
.m-equipo-zona .ez-map svg { touch-action: manipulation; }
.m-equipo-zona .ez-map .z { cursor:pointer; transition: fill-opacity .15s; }
.m-equipo-zona .ez-map .z:hover { fill-opacity:.85; }
.m-equipo-zona .ez-map text { font-family: var(--f-display); pointer-events:none; }
.m-equipo-zona .ez-ctrl { display:grid; gap:.8rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); }
.m-equipo-zona label.f { display:flex; flex-direction:column; gap:.25rem; font-size:.9rem; font-weight:600; }
.m-equipo-zona label.f .v { font-family: var(--f-mono); color: var(--accent); }
.m-equipo-zona select, .m-equipo-zona input[type=number] { min-height:38px; padding:.3em .5em; border:1px solid var(--line); border-radius: var(--r-sm); background: var(--sheet); width:100%; }
.m-equipo-zona .tg { display:flex; gap:.45rem; align-items:center; font-size:.92rem; cursor:pointer; }
.m-equipo-zona .tg input { width:18px; height:18px; accent-color: var(--accent); }
.m-equipo-zona details > summary { cursor:pointer; font-weight:600; color: var(--muted); margin-bottom:.5rem; }
.m-equipo-zona .ez-zones button { min-width: 44px; }
.m-equipo-zona .grp h4 { display:flex; justify-content:space-between; gap:.5rem; align-items:baseline; margin-bottom:.4rem; }
.m-equipo-zona .it { display:grid; grid-template-columns: 26px 1fr; gap:.15rem .5rem; padding:.5rem 0; border-top:1px solid var(--line); }
.m-equipo-zona .it:first-of-type { border-top:0; }
.m-equipo-zona .it input { width:20px; height:20px; margin-top:2px; accent-color: var(--ok); }
.m-equipo-zona .it .nm { font-weight:700; }
.m-equipo-zona .it .rq { grid-column:2; font-size:.9rem; }
.m-equipo-zona .it .ct { grid-column:2; font-size:.76rem; color: var(--muted); font-family: var(--f-mono); }
.m-equipo-zona .it.done .nm { text-decoration: line-through; color: var(--muted); }
.m-equipo-zona .warn { border-left:4px solid var(--warn); }
.m-equipo-zona .inv { display:flex; flex-direction:column; gap:.4rem; }
.m-equipo-zona .inv-row { display:grid; grid-template-columns: 1fr auto; gap:.3rem .6rem; align-items:center; padding:.55rem .7rem; border:1px solid var(--line); border-radius: var(--r-sm); background: var(--sheet); }
.m-equipo-zona .inv-row .lab { font-weight:700; font-size:.92rem; }
.m-equipo-zona .inv-row .have { font-size:.9rem; color: var(--muted); }
.m-equipo-zona .inv-row .flag { min-height:36px; white-space:nowrap; }
.m-equipo-zona .inv-row[data-f="1"] { border-color: var(--bad); background: color-mix(in srgb, var(--bad) 8%, var(--sheet)); }
.m-equipo-zona .inv-row[data-f="1"] .flag { background: var(--bad); border-color: var(--bad); color: var(--sheet); }
.m-equipo-zona .inv-row .exp { grid-column: 1 / -1; font-size:.86rem; }
.m-equipo-zona .inv-row.r-ok { border-color: var(--ok); }
.m-equipo-zona .inv-row.r-bad { border-color: var(--bad); border-width:2px; }
.m-equipo-zona .scen { display:flex; flex-wrap:wrap; gap:.4rem; }
`;

// ---------- utilidades ----------
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
};
const fmt = (x, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toString().replace(".", ",");
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const ZONAS = {
  1: { d: "Navegación ilimitada", cat: "A" },
  2: { d: "Hasta 60 millas de la costa", cat: "B" },
  3: { d: "Hasta 25 millas de la costa", cat: "B" },
  4: { d: "Hasta 12 millas de la costa", cat: "C" },
  5: { d: "Hasta 5 millas de un abrigo o playa accesible", cat: "C" },
  6: { d: "Hasta 2 millas de un abrigo o playa accesible", cat: "C" },
  7: { d: "Aguas costeras protegidas: puertos, radas, rías, bahías abrigadas", cat: "D" },
};
const CAT_ZONAS = { A: [1, 2, 3, 4, 5, 6, 7], B: [2, 3, 4, 5, 6, 7], C: [4, 5, 6, 7], D: [7] };

// Art. 11.4: tabla de fondeo (interpolar)
const FONDEO = { L: [3, 5, 7, 9, 12, 15, 18, 21, 24], w: [3.5, 6, 10, 14, 20, 33, 46, 58, 75], dc: [6, 6, 6, 8, 8, 10, 10, 12, 12], de: [10, 10, 10, 12, 12, 14, 14, 16, 16] };
function interp(key, L) {
  const xs = FONDEO.L, ys = FONDEO[key];
  if (L <= xs[0]) return ys[0];
  if (L >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 1; i < xs.length; i++) if (L <= xs[i]) { const t = (L - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[i - 1] + t * (ys[i] - ys[i - 1]); }
}

// Art. 15: extintores
function extintores(c) {
  const L = c.L, P = c.prop === "vela-sin" ? 0 : c.kw;
  let esl = 0;
  if (L < 10) esl = c.cabina ? 1 : 0;
  else if (L < 15) esl = 1;
  else if (L < 20) esl = 2;
  else esl = 3;
  if (c.comercial && L >= 10) esl += 1;
  const fijoObl = !c.ce && c.motor === "intraborda" && c.comb === "gasolina";
  const fijo = c.fijo || fijoObl;
  let mot = 0, motTxt = "";
  if (P <= 0) { mot = 0; motTxt = "sin motor"; }
  else if (fijo) { mot = 1; motTxt = "instalación fija → 1 extintor 34B junto al compartimento del motor"; }
  else if (P <= 25) { mot = c.motor === "fueraborda" ? 0 : 1; motTxt = `P ≤ 25 kW → ${mot ? "1 × 34B" : "no requerido (fueraborda)"}`; }
  else if (P <= 220) { mot = 1; motTxt = "25 < P ≤ 220 kW → 1 × 34B"; }
  else { const B = P * 0.3; mot = Math.ceil(B / 34); motTxt = `P > 220 kW → capacidad B = P × 0,3 = ${fmt(B, 0)} B → ${mot} × 34B`; }
  const total = L < 10 ? Math.max(esl, mot) : esl + mot;
  const eslTxt = L < 10 ? (c.cabina ? "L < 10 m con espacio habitable cerrado → 1 × 34B" : "L < 10 m sin espacio habitable cerrado → 0 por eslora")
    : `${L < 15 ? "10 ≤ L < 15" : L < 20 ? "15 ≤ L < 20" : "20 ≤ L ≤ 24"} m → ${esl - (c.comercial ? 1 : 0)} × 34B${c.comercial ? " + 1 por uso comercial" : ""}`;
  const combTxt = L < 10 ? "Con L < 10 m los extintores exigidos por el motor sirven también para cumplir los de eslora (se toma el mayor)." : "Con L ≥ 10 m se suman los de eslora y los de motor.";
  return { total, esl, mot, eslTxt, motTxt, combTxt, fijo, fijoObl };
}

function luces(c) {
  const vela = c.prop !== "motor";
  const L = c.L;
  const parts = [];
  if (!vela) {
    if (L < 7) parts.push("Motor L < 7 m y ≤ 7 nudos: basta luz blanca todo horizonte (y costados si es posible) — RIPA R.23(d)(ii)");
    if (L < 12) parts.push("Motor L < 12 m: tope + costados + alcance, o blanca todo horizonte + costados — RIPA R.23(d)(i)");
    else parts.push(`Motor L ${L < 20 ? "< 20 m: tope + costados (pueden ir en farol combinado)" : "≥ 20 m: tope + costados separados"} + alcance — RIPA R.23(a), R.21`);
  } else {
    if (L < 7) parts.push("Vela L < 7 m: si no puede llevar costados y alcance, linterna eléctrica blanca lista para mostrarla — RIPA R.25(d)(i)");
    parts.push(L < 20 ? "Vela L < 20 m: costados + alcance, o farol tricolor en el tope — RIPA R.25(a)(b)" : "Vela L ≥ 20 m: costados + alcance (no se admite tricolor) — RIPA R.25(a)");
    parts.push("Navegando a motor (aunque lleve velas izadas) se muestran las luces de buque de propulsión mecánica");
  }
  parts.push("Fondeado: luz blanca todo horizonte; de día, bola negra — RIPA R.30");
  return parts;
}

// ---------- requisitos ----------
// cada ítem: {key, g, name, ok (lo que hay a bordo si cumple), req (texto de la exigencia), cite, bads[]}
function requisitos(c) {
  const z = c.zona, L = c.L, P = Math.max(1, c.pers), kids = Math.min(c.ninos, P);
  const vela = c.prop !== "motor";
  c = { ...c, neum: c.neum || c.casco === "neum" };
  const items = [];
  const add = (o) => items.push({ bads: [], ...o });

  // --- Salvamento ---
  const nCh = P + (z === 1 ? 1 : 0);
  const N = z === 1 ? 275 : z <= 4 ? 150 : 100;
  const conLuz = !(z >= 4 && c.diurna);
  const lowN = N === 275 ? 150 : N === 150 ? 100 : 50;
  add({
    key: "chalecos", g: "salv", name: "Chalecos salvavidas",
    ok: `${nCh} chalecos de ${N} N${conLuz ? " con luz" : ""}${kids ? ` (${kids} infantiles a medida)` : ""}`,
    req: `Uno por persona${z === 1 ? " + 1 adicional (zona 1)" : ""} = ${nCh}. Flotabilidad mínima ${N} N (zona 1: 275 N · zonas 2–4: 150 N · zonas 5–7: 100 N). ${conLuz ? "Con luz de chaleco." : "Sin luz admitido: zona 4–7 y solo navegación diurna."} Niños y bebés: chaleco adecuado a su peso y talla. Inflables: revisión según fabricante en estación de servicio autorizada.`,
    cite: "RD 339/2021 art. 7",
    bads: [
      `${nCh - 1} chalecos de ${N} N${conLuz ? " con luz" : ""}`,
      `${nCh} chalecos de ${lowN} N${conLuz ? " con luz" : ""}`,
      conLuz ? `${nCh} chalecos de ${N} N sin luz` : null,
      kids ? `${nCh} chalecos de ${N} N, todos de talla adulto` : null,
    ].filter(Boolean),
  });
  if (z <= 4) add({
    key: "aro", g: "salv", name: "Aro salvavidas",
    ok: z === 1 ? "2 aros: uno con luz y rabiza + otro" : "1 aro con luz y rabiza",
    req: `Zonas 1–4: un aro con luz y rabiza.${z === 1 ? " Zona 1: un segundo aro (sin luz ni rabiza)." : ""} Zonas 5–7: no obligatorio.`,
    cite: "RD 339/2021 art. 8",
    bads: z === 1 ? ["1 aro con luz y rabiza", "2 aros sin luz ni rabiza"] : ["1 aro sin luz ni rabiza", "No lleva"],
  });
  if (z <= 3) {
    const sizes = [4, 6, 8, 10, 12, 16];
    const cap = sizes.find((s) => s >= P) || P;
    const small = [...sizes].reverse().find((s) => s < P);
    add({
      key: "balsa", g: "salv", name: "Balsa salvavidas",
      ok: `Balsa para ${cap} personas, revisada en estación autorizada`,
      req: "Zonas 1, 2 y 3: una o varias balsas con capacidad para TODAS las personas a bordo; revisión según fabricante en estación de servicio autorizada.",
      cite: "RD 339/2021 art. 6",
      bads: [small ? `Balsa para ${small} personas` : null, "Balsa con la revisión caducada", "No lleva"].filter(Boolean),
    });
  }
  const piro = z === 1 ? [6, 6, 2] : z <= 3 ? [6, 6, 1] : z === 4 ? [3, 3, 0] : z <= 6 ? [3, 0, 0] : [0, 0, 0];
  const pTxt = "Bengalas / cohetes con paracaídas / fumígenas flotantes: zona 1 → 6/6/2 · zonas 2–3 → 6/6/1 · zona 4 → 3/3/0 · zonas 5–6 → 3/0/0 · zona 7 → ninguna.";
  if (piro[0]) add({ key: "bengalas", g: "salv", name: "Bengalas de mano", ok: `${piro[0]} bengalas de mano en vigor`, req: pTxt, cite: "RD 339/2021 art. 9", bads: [`${piro[0] === 6 ? 3 : 2} bengalas de mano`, `${piro[0]} bengalas caducadas`] });
  if (piro[1]) add({ key: "cohetes", g: "salv", name: "Cohetes con luz roja y paracaídas", ok: `${piro[1]} cohetes con paracaídas`, req: pTxt, cite: "RD 339/2021 art. 9", bads: [`${piro[1] === 6 ? 3 : 1} cohetes con paracaídas`, "No lleva"] });
  if (piro[2]) add({ key: "fumigenas", g: "salv", name: "Señales fumígenas flotantes", ok: `${piro[2]} señal${piro[2] > 1 ? "es" : ""} fumígena${piro[2] > 1 ? "s" : ""} flotante${piro[2] > 1 ? "s" : ""}`, req: pTxt, cite: "RD 339/2021 art. 9", bads: [piro[2] === 2 ? "1 señal fumígena flotante" : "No lleva"] });

  // --- Navegación: luces, sonido, fondeo, material náutico ---
  const sinLuces = z >= 4 && c.diurna && L < 7;
  if (!sinLuces) add({
    key: "luces", g: "nav", name: "Luces de navegación",
    ok: `Luces de ${vela ? "vela" : "motor"} del RIPA, ${z >= 4 && c.diurna && L < 12 ? "no certificadas, visibles a ≥ 1 milla" : "certificadas"}`,
    req: `Las del RIPA (partes C y D), certificadas (RD 701/2016) o aprobadas por un Estado de la UE. ${z >= 4 && c.diurna && L < 12 ? "Zonas 4–7, solo de día y L < 12 m: pueden ser no certificadas con visibilidad mínima de 1 milla. " : ""}Zonas 4–7, solo de día y L < 7 m: pueden sustituirse por una linterna eléctrica de luz blanca. · ${luces(c).join(" · ")}.`,
    cite: "RD 339/2021 art. 10.1–10.3",
    bads: [vela ? "Sin luz de alcance" : "Sin luz de alcance ni de tope", "Luces de costado fundidas"],
  });
  add({
    key: "bocina", g: "nav", name: "Bocina de niebla",
    ok: "Bocina de niebla manual (o de gas con membrana y recipiente de respeto)",
    req: "Todas las embarcaciones: bocina de niebla de presión manual o accionada por gas; si es de gas, con una membrana y un recipiente de gas de respeto.",
    cite: "RD 339/2021 art. 10.4",
    bads: ["Bocina de gas sin recipiente de respeto", "No lleva"],
  });
  if (L >= 20) add({ key: "campana", g: "nav", name: "Campana", ok: "Campana de 200 mm de diámetro", req: "Eslora total ≥ 20 m: además, campana de al menos 200 mm de diámetro.", cite: "RD 339/2021 art. 10.4", bads: ["No lleva", "Campana de 120 mm"] });
  {
    const w = interp("w", L), dc = interp("dc", L), de = interp("de", L);
    const total = 5 * L, cad = L <= 6 ? 0 : L;
    add({
      key: "fondeo", g: "nav", name: "Línea de fondeo",
      ok: `Ancla de ${fmt(w)} kg (alto poder de agarre) + ${cad ? `${fmt(cad)} m de cadena Ø ${fmt(dc)} mm + ` : ""}estacha Ø ${fmt(de)} mm; total ${fmt(total)} m`,
      req: `Longitud ≥ 5 esloras (${fmt(total)} m). Tramo de cadena ≥ 1 eslora (${L <= 6 ? "no exigido: L ≤ 6 m puede ser toda de estacha" : fmt(L) + " m"}). Sin empalmes sin grillete. Ancla AHP ≈ ${fmt(w)} kg (otros tipos: +1/3), cadena Ø ${fmt(dc)} mm, estacha nylon Ø ${fmt(de)} mm (tabla interpolada).`,
      cite: "RD 339/2021 art. 11",
      bads: [`Línea de fondeo de ${fmt(3 * L, 0)} m`, `Ancla de ${fmt(w * 0.5)} kg`, L > 6 ? "Línea de fondeo toda de estacha, sin cadena" : null].filter(Boolean),
    });
  }
  const camaraAB = c.ce && c.cabina && (c.cat === "A" || c.cat === "B");
  const nav14 = z <= 4 || camaraAB;
  const navNote = camaraAB && z >= 5 ? " (zonas 5–7: obligatorio por tener puesto de gobierno cerrado y categoría A/B)" : "";
  if (nav14) {
    add({ key: "compas", g: "nav", name: "Compás", ok: z <= 2 ? "Compás certificado iluminado + compás de marcaciones + tablilla de desvíos (< 5 años)" : "Compás certificado", req: "Zonas 1–4. En zonas 1 y 2: con iluminación, compás de marcaciones y tablilla de desvíos revisada cada 5 años." + navNote, cite: "RD 339/2021 art. 12.2.a", bads: z <= 2 ? ["Compás sin tablilla de desvíos", "No lleva"] : ["No lleva"] });
    add({ key: "cartas", g: "nav", name: "Cartas náuticas", ok: "Cartas actualizadas de la zona + portulanos + útiles", req: "Zonas 1–4: cartas actualizadas de los mares por los que se navegue, portulanos de los puertos usados y útiles para su uso." + navNote, cite: "RD 339/2021 art. 12.2.c", bads: ["Cartas sin actualizar de otra zona", "No lleva"] });
    add({ key: "publicaciones", g: "nav", name: "Publicaciones náuticas", ok: `Derrotero + Libro de faros${c.medi ? "" : " + Anuario de mareas"}${z <= 3 && z >= 2 ? " + Libro de radioseñales" : ""}${z === 1 ? " + Manual móvil marítimo, Nomenclátor (Lista IV) y Código Internacional de Señales" : ""}`, req: `Zonas 1–4: Derrotero, Libro de faros y señales de niebla y Anuario de mareas del año (excepto en el Mediterráneo). Zonas 2–3: + Libro de radioseñales. Zona 1: + Manual del servicio móvil marítimo, Nomenclátor de estaciones costeras (Lista IV) y Código Internacional de Señales.` + navNote, cite: "RD 339/2021 art. 12.2.d", bads: ["Solo el Libro de faros", "No lleva"] });
    add({ key: "prismaticos", g: "nav", name: "Prismáticos", ok: "Prismáticos", req: "Zonas 1–4." + navNote, cite: "RD 339/2021 art. 12.1", bads: ["No lleva"] });
  }
  if (z <= 2) {
    add({ key: "barometro", g: "nav", name: "Barómetro", ok: "Barómetro", req: "Zonas 1 y 2.", cite: "RD 339/2021 art. 12.1", bads: ["No lleva"] });
    add({ key: "banderas", g: "nav", name: "Juego de banderas", ok: `Banderas C y N del CIS${z === 1 ? " de 60 × 50 cm" : ""}`, req: "Zonas 1 y 2: como mínimo las banderas C y N del Código Internacional de Señales (zona 1: mínimo 60 × 50 cm).", cite: "RD 339/2021 art. 12.2.e", bads: ["Solo bandera N", "No lleva"] });
  }
  if (z === 1) {
    add({ key: "sextante", g: "nav", name: "Sextante y cronómetro", ok: "Sextante con tablas + cronómetro", req: "Zona 1: sextante (con tablas de navegación astronómica) y cronómetro.", cite: "RD 339/2021 art. 12.1, 12.2.b", bads: ["Sextante sin cronómetro", "No lleva"] });
    add({ key: "diario", g: "nav", name: "Diario de navegación", ok: "Diario de navegación", req: "Zona 1.", cite: "RD 339/2021 art. 12.1", bads: ["No lleva"] });
  }
  add({ key: "pabellon", g: "nav", name: "Pabellón nacional", ok: "Pabellón nacional", req: "Todas las zonas (se iza de orto a ocaso: RD 2335/1980).", cite: "RD 339/2021 art. 12.1", bads: ["No lleva"] });
  add({ key: "linterna", g: "nav", name: "Linterna estanca", ok: "Linterna estanca + baterías de respeto", req: `Todas las zonas, con un juego de baterías de respeto.${sinLuces ? " Si es de luz blanca, sirve como sustituto de las luces de navegación (art. 10.3)." : ""}`, cite: "RD 339/2021 art. 12.2.f", bads: ["Linterna sin baterías de respeto", "No lleva"] });
  if (c.casco !== "metal") add({ key: "reflector", g: "nav", name: "Reflector de radar", ok: "Reflector de radar", req: "Todas las zonas, en embarcaciones de casco NO metálico (fibra, madera, neumáticas…). Los cascos metálicos ya dan eco.", cite: "RD 339/2021 art. 12.2.g", bads: ["No lleva"] });
  if (z <= 5) add({ key: "tablas", g: "nav", name: "Tablas de señales de salvamento y de banderas", ok: "Tabla de señales de salvamento + tabla de banderas (CIS)", req: "Todas las zonas, si se montan equipos radioeléctricos (obligatorios en zonas 1–5).", cite: "RD 339/2021 art. 12.2.h–i", bads: ["No lleva"] });

  // --- Material diverso y botiquín ---
  add({ key: "estachas", g: "div", name: "Estachas de amarre", ok: "2 estachas de amarre adecuadas", req: "Mínimo dos estachas de amarre de longitud y resistencia adecuadas a la eslora.", cite: "RD 339/2021 art. 13.1.b", bads: ["1 estacha de amarre"] });
  add({ key: "bichero", g: "div", name: "Bichero", ok: "Bichero", req: "Todas.", cite: "RD 339/2021 art. 13.1.c", bads: ["No lleva"] });
  if (vela || c.motor === "intraborda") add({ key: "gobemerg", g: "div", name: "Gobierno de emergencia", ok: "Caña de emergencia", req: "Embarcaciones de vela, o de un solo motor con gobierno a distancia (salvo fueraborda o transmisión en Z).", cite: "RD 339/2021 art. 13.1.a", bads: ["No lleva"] });
  if (c.neum) add({ key: "neum", g: "div", name: "Inflador y kit de pinchazos", ok: "Inflador + juego de reparación de pinchazos", req: "Neumáticas y semirrígidas.", cite: "RD 339/2021 art. 13.1.d", bads: ["Inflador sin kit de reparación", "No lleva"] });
  if (z <= 4) add({ key: "botiquin", g: "div", name: "Botiquín y Guía sanitaria", ok: "Botiquín tipo «balsas de salvamento» + Guía sanitaria a bordo", req: "Sin tripulación profesional, zonas 1–4: botiquín con contenido idéntico al tipo «Balsas de salvamento» del anexo II del RD 258/1999. Todo barco con botiquín lleva la Guía sanitaria a bordo.", cite: "RD 339/2021 art. 13.2.b–c", bads: ["Botiquín sin Guía sanitaria a bordo", "Botiquín doméstico", "No lleva"] });

  // --- Contraincendios ---
  const ex = extintores(c);
  if (ex.total > 0) add({
    key: "extintores", g: "fuego", name: "Extintores portátiles",
    ok: `${ex.total} extintor${ex.total > 1 ? "es" : ""} 34B (≥ 2 kg), uno al alcance del puesto de gobierno`,
    req: `${c.ce ? "Con marcado CE: los del manual del fabricante; en su defecto, esta tabla. " : ""}Por eslora: ${ex.eslTxt}. Por motor: ${ex.motTxt}. ${ex.combTxt} Total ${ex.total} × 34B, ≥ 2 kg de agente, en lugar accesible y uno alcanzable desde el puesto principal de gobierno. Instalación > 50 V o propulsión eléctrica: uno apto para fuegos con electricidad.`,
    cite: "RD 339/2021 art. 15",
    bads: [ex.total > 1 ? `${ex.total - 1} extintor 34B` : "No lleva", `${ex.total} extintor${ex.total > 1 ? "es" : ""} tipo 21B`, `${ex.total} extintor${ex.total > 1 ? "es" : ""} 34B, todos en el pañol de proa`],
  });
  if (ex.fijoObl) add({ key: "fijo", g: "fuego", name: "Sistema fijo de extinción (motor)", ok: "Sistema fijo de extinción en el compartimento del motor", req: "Sin marcado CE y motor intraborda de gasolina (grupo 1.º, inflamación < 55 °C) o GLP: sistema fijo que evite abrir el compartimento en caso de incendio.", cite: "RD 339/2021 art. 16.2", bads: ["No lleva"] });
  if (!c.ce && c.motor === "intraborda" && c.comb === "gasolina" && c.prop !== "vela-sin") add({ key: "ventil", g: "fuego", name: "Ventilación del motor", ok: "Ventilación forzada + placa «ventilar 4 min antes de arrancar»", req: "Sin marcado CE, compartimentos con motor o depósitos de gasolina: ventilación (forzada si el arranque es eléctrico) y placa junto al arranque recordando ventilar 4 minutos.", cite: "RD 339/2021 art. 18", bads: ["Ventilación sin placa de aviso de 4 min"] });
  if (c.gas) add({ key: "gas", g: "fuego", name: "Detector de gases", ok: "Detector de gas con alarma luminosa y sonora", req: "Instalación de gas combustible (p. ej. cocina) total o parcialmente dentro del casco: detección con alarma automática luminosa y sonora.", cite: "RD 339/2021 art. 17", bads: ["No lleva"] });

  // --- Achique ---
  {
    const cap = L <= 6 ? 10 : L < 12 ? 15 : 30;
    let ok, req, bads;
    if (z <= 3) { ok = "Bomba accionada por el motor + bomba manual + 2 baldes de 5 l"; req = "Zonas 1–3: bomba accionada por el motor principal u otra fuente de energía + bomba manual + 2 baldes ≥ 5 l."; bads = ["Bomba eléctrica + 2 baldes de 5 l", "Bomba motor + bomba manual + 1 balde de 5 l"]; }
    else if (z <= 6) { ok = "Bomba manual + 1 balde de 5 l"; req = "Zonas 4–6: bomba manual o eléctrica + 1 balde ≥ 5 l."; bads = ["Bomba manual, sin balde", "Bomba eléctrica + balde de 2 l"]; }
    else { ok = L <= 6 && c.neum ? "Achicador de 2 l" : "Bomba manual"; req = "Zona 7: bomba manual o eléctrica (si L ≤ 6 m con cámaras de flotabilidad: achicador ≥ 2 l)."; bads = ["No lleva"]; }
    if (vela && z <= 6) { ok = ok.replace("Bomba manual", "Bomba manual fija (desde la bañera)").replace("+ bomba manual", "+ bomba manual fija (desde la bañera)"); req += " Veleros en zonas 1–6: al menos una bomba manual y fija, operable desde la bañera con escotillas cerradas."; bads = [...bads, z <= 3 ? "Bomba motor + bomba manual portátil + 2 baldes" : "Bomba eléctrica + 1 balde de 5 l"]; }
    req += ` Capacidad mínima de cada bomba a 10 kPa: ${cap} l/min (L ≤ 6 m: 10 · 6–12 m: 15 · ≥ 12 m: 30); manuales con 45 emboladas/min.`;
    add({ key: "achique", g: "ach", name: "Medios de achique", ok, req, cite: "RD 339/2021 art. 20", bads });
  }

  // --- Radio (RD 1185/2006) ---
  if (z === 1) {
    add({ key: "vhf", g: "radio", name: "VHF fija con LSD", ok: "VHF fija con LSD (canales 16, 6, 13 y 70)", req: "Zona 1: VHF (canales 16, 6, 13 + generales) apta para LSD.", cite: "RD 1185/2006 art. 56.1.b, 56.2", bads: ["VHF fija sin LSD", "Solo VHF portátil"] });
    add({ key: "mfhf", g: "radio", name: "MF/HF con LSD o estación satelitaria", ok: "MF/HF con LSD (2.182 kHz)", req: "Zona 1: estación terrena de barco (ETB) o, en su lugar, MF/HF con 2.182 kHz y comunicaciones generales, apta para LSD.", cite: "RD 1185/2006 art. 56.1.a", bads: ["No lleva"] });
    add({ key: "vhfport", g: "radio", name: "VHF portátil", ok: "VHF portátil bidireccional", req: "Zona 1: además, VHF portátil bidireccional.", cite: "RD 1185/2006 art. 56.3.b", bads: ["No lleva"] });
    add({ key: "sart", g: "radio", name: "Respondedor de radar 9 GHz", ok: "Respondedor de radar (SART) 9 GHz", req: "Zona 1: además, respondedor de radar de 9 GHz.", cite: "RD 1185/2006 art. 56.3.c", bads: ["No lleva"] });
  } else if (z <= 3) {
    add({ key: "vhf", g: "radio", name: "VHF fija con LSD", ok: "VHF fija con LSD", req: `Zona ${z}: instalación de VHF apta para llamada selectiva digital (LSD/DSC, canal 70).`, cite: `RD 1185/2006 art. ${z === 2 ? 57 : 58}`, bads: ["VHF fija sin LSD", "Solo VHF portátil"] });
    if (z === 2) add({ key: "vhfport", g: "radio", name: "VHF portátil o respondedor de radar", ok: "VHF portátil bidireccional", req: "Zona 2: además, VHF portátil bidireccional o respondedor de radar de 9 GHz.", cite: "RD 1185/2006 art. 57.3", bads: ["No lleva"] });
  } else if (z === 4) {
    add({ key: "vhf", g: "radio", name: "VHF fija", ok: "VHF fija", req: "Zona 4: como mínimo, instalación radiotelefónica de VHF de tipo FIJO (no basta la portátil).", cite: "RD 1185/2006 art. 59", bads: ["Solo VHF portátil"] });
  } else if (z === 5) {
    add({ key: "vhf", g: "radio", name: "VHF", ok: "VHF portátil estanca IPX7", req: "Zona 5: VHF fija, o como alternativa VHF portátil estanca IEC 60529 IPX7.", cite: "RD 1185/2006 art. 60", bads: ["VHF portátil no estanca", "No lleva"] });
  }
  if (z <= 3) add({ key: "epirb", g: "radio", name: "Radiobaliza 406 MHz", ok: `Radiobaliza 406 MHz de activación automática y manual`, req: z <= 2 ? `Zona ${z}: radiobaliza de 406 MHz de activación automática Y manual.` : "Zona 3: radiobaliza de 406 MHz, de activación automática y manual o únicamente manual.", cite: `RD 1185/2006 art. ${z === 1 ? "56.1.c" : z === 2 ? "57.1.b" : "58.1.b"}`, bads: z <= 2 ? ["Radiobaliza 406 MHz solo manual", "Radiobaliza de 121,5 MHz", "No lleva"] : ["Radiobaliza de 121,5 MHz", "No lleva"] });
  if (z <= 3) add({ key: "leb", g: "radio", name: "Licencia de estación de barco (MMSI)", ok: "LEB visible junto a la estación", req: "Obligatoria para todo barco con transmisores; exentas las de recreo en zonas 4–7 salvo que lleven voluntariamente VHF fija con LSD o radiobaliza (entonces necesitan MMSI).", cite: "RD 1185/2006 art. 8.1", bads: ["No lleva"] });

  // --- Contaminación ---
  if (c.aseo && !c.ce) add({ key: "aseo", g: "cont", name: "Aguas sucias (inodoro)", ok: "Depósito de retención con conexión universal a tierra + válvula de fondo precintada", req: "Sin marcado CE con inodoro: sistema de retención, instalación de tratamiento homologada o sistema de desmenuzar y desinfectar. Depósitos fijos: conexión universal a tierra; válvulas de descarga al mar precintables. Descarga: > 3 mn desmenuzadas y desinfectadas, > 12 mn sin tratar, a ≥ 4 nudos y ritmo moderado.", cite: "RD 339/2021 arts. 22–23", bads: ["Inodoro con descarga directa al mar, sin depósito", "Depósito sin conexión universal a tierra"] });
  if (L >= 12) add({ key: "rotulos", g: "cont", name: "Rótulos de basuras", ok: "Rótulos MARPOL V a la vista", req: "Eslora ≥ 12 m: rótulos que informen de las prescripciones de descarga de basuras.", cite: "MARPOL Anexo V regla 10.1 (RD 339/2021 art. 21)", bads: ["No lleva"] });

  return items;
}

const GRUPOS = {
  salv: "Salvamento", nav: "Navegación, señales y fondeo", div: "Material diverso y botiquín",
  fuego: "Contraincendios", ach: "Achique", radio: "Radiocomunicaciones", cont: "Contaminación",
};

const DEF = { zona: 4, L: 8, pers: 4, ninos: 0, prop: "motor", motor: "fueraborda", kw: 110, comb: "gasolina", casco: "fibra", ce: false, cat: "B", cabina: false, diurna: false, neum: false, aseo: false, gas: false, comercial: false, fijo: false, medi: true };

// ---------- mapa ----------
function mapaSVG(sel, onPick) {
  const NS = "http://www.w3.org/2000/svg";
  const s = (tag, a = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); return e; };
  const svg = s("svg", { viewBox: "0 0 620 250", role: "img", "aria-label": "Mapa esquemático de zonas de navegación (escala no lineal)" });
  const coastX = 70;
  // escala no lineal: x(d) para d en millas
  const X = (d) => coastX + 520 * Math.sqrt(d / 60) * 0.92;
  const bands = [[1, 60, 999], [2, 25, 60], [3, 12, 25], [4, 0, 12]];
  for (const [z, d0, d1] of bands) {
    const x0 = X(d0), x1 = d1 > 100 ? 620 : X(d1);
    const r = s("rect", { x: x0, y: 0, width: x1 - x0, height: 250, class: "z", "data-z": z });
    r.style.fill = z === sel ? "var(--accent)" : z % 2 ? "var(--sea)" : "var(--sea-2)";
    r.style.fillOpacity = z === sel ? ".35" : "1";
    svg.append(r);
  }
  // zonas 5 y 6: semicírculos alrededor del abrigo (puerto)
  const py = 170;
  for (const [z, d] of [[5, 5], [6, 2]]) {
    const R = X(d) - coastX;
    const p = s("path", { d: `M ${coastX} ${py - R} A ${R} ${R} 0 0 1 ${coastX} ${py + R} Z`, class: "z", "data-z": z });
    p.style.fill = z === sel ? "var(--accent)" : z === 5 ? "var(--sea-2)" : "var(--sea)";
    p.style.fillOpacity = z === sel ? ".45" : ".9";
    p.style.stroke = "var(--ink)"; p.style.strokeOpacity = ".35"; p.style.strokeDasharray = "4 3";
    svg.append(p);
  }
  // tierra con bahía (zona 7)
  const land = s("path", { d: `M0 0 H${coastX} V60 C ${coastX + 4} 70, ${coastX - 30} 70, ${coastX - 34} 92 C ${coastX - 38} 112, ${coastX + 2} 118, ${coastX} 128 V250 H0 Z` });
  land.style.fill = "var(--paper)"; land.style.stroke = "var(--ink)"; land.style.strokeWidth = "1.5";
  svg.append(land);
  const bay = s("path", { d: `M${coastX} 60 C ${coastX + 4} 70, ${coastX - 30} 70, ${coastX - 34} 92 C ${coastX - 38} 112, ${coastX + 2} 118, ${coastX} 128 Z`, class: "z", "data-z": 7 });
  bay.style.fill = sel === 7 ? "var(--accent)" : "var(--sea)"; bay.style.fillOpacity = sel === 7 ? ".5" : "1";
  bay.style.stroke = "var(--ink)"; bay.style.strokeWidth = "1.5";
  svg.append(bay);
  // puerto (abrigo)
  const port = s("rect", { x: coastX - 8, y: py - 5, width: 10, height: 10 });
  port.style.fill = "var(--ink)"; svg.append(port);
  const t = (x, y, txt, size = 15, anchor = "middle", w = 600, color = "var(--ink)") => { const e = s("text", { x, y, "text-anchor": anchor, "font-size": size, "font-weight": w }); e.style.fill = color; e.textContent = txt; svg.append(e); };
  t((X(60) + 620) / 2, 30, "Zona 1", 16); t((X(25) + X(60)) / 2, 30, "Zona 2", 16); t((X(12) + X(25)) / 2, 30, "Zona 3", 16); t((X(5) + X(12)) / 2 + 6, 30, "Zona 4", 15);
  t(coastX + (X(5) - coastX) * 0.72, py + 4, "5", 15); t(coastX + (X(2) - coastX) * 0.55, py + 4, "6", 14);
  t(coastX - 16, 96, "7", 14);
  t(coastX - 34, py + 22, "abrigo", 12, "middle", 500, "var(--muted)");
  for (const d of [12, 25, 60]) { const ln = s("line", { x1: X(d), y1: 40, x2: X(d), y2: 250 }); ln.style.stroke = "var(--ink)"; ln.style.strokeOpacity = ".3"; svg.append(ln); t(X(d), 240, `${d} mn`, 13, "middle", 600, "var(--muted)"); }
  t(coastX + 6, 240, "costa", 12, "start", 500, "var(--muted)");
  t(612, 246, "escala no lineal", 11, "end", 500, "var(--muted)");
  svg.addEventListener("click", (e) => { const z = e.target.closest?.("[data-z]"); if (z) onPick(+z.dataset.z); });
  return svg;
}

// ---------- módulo ----------
export default {
  id: ID,
  tema: 3,
  title: "Equipo obligatorio por zona",
  icon: "⊞",
  desc: "Calcula el equipo exacto del RD 339/2021 y la radio del RD 1185/2006 para tu barco y zona, y pasa la revista de inspección.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) document.head.append(h("style", { "data-mod": ID }, CSS));
    const root = h("div", { class: `m-${ID}` });
    el.append(root);
    let cfg = { ...DEF, ...(ctx.store.get("cfg", {}) || {}) };
    let mode = "calc";
    const checked = new Set();

    const tabs = h("div", { class: "seg", role: "group", "aria-label": "Modo" });
    const tabBtn = (m, label) => h("button", { type: "button", "aria-pressed": String(mode === m), onclick: () => { mode = m; render(); } }, label);
    const body = h("div", { class: "stack" });
    root.append(h("div", { class: "row" }, tabs), body);

    function save() { ctx.store.set("cfg", cfg); }

    function render() {
      tabs.replaceChildren(tabBtn("calc", "Calculadora"), tabBtn("rev", "Revista de inspección"));
      body.replaceChildren(mode === "calc" ? renderCalc() : renderRev());
    }

    // ----- Calculadora -----
    function field(label, input, val) { return h("label", { class: "f" }, h("span", {}, label, val != null ? h("span", { class: "v" }, " ", val) : null), input); }
    function toggle(key, label) {
      return h("label", { class: "tg" }, h("input", { type: "checkbox", checked: cfg[key] || null, onchange: (e) => { cfg[key] = e.target.checked; save(); render(); } }), label);
    }
    function select(key, opts) {
      const s = h("select", { onchange: (e) => { cfg[key] = e.target.value; save(); render(); } }, opts.map(([v, l]) => h("option", { value: v, selected: cfg[key] === v || null }, l)));
      return s;
    }

    function renderCalc() {
      const wrap = h("div", { class: "stack" });
      const mapPanel = h("div", { class: "panel stack" },
        h("div", { class: "eyebrow" }, "Zonas de navegación · RD 339/2021 art. 3"),
        h("div", { class: "stage ez-map" }, mapaSVG(cfg.zona, (z) => { cfg.zona = z; save(); render(); })),
        h("div", { class: "seg ez-zones", role: "group", "aria-label": "Zona" }, [1, 2, 3, 4, 5, 6, 7].map((z) => h("button", { type: "button", "aria-pressed": String(cfg.zona === z), onclick: () => { cfg.zona = z; save(); render(); } }, String(z)))),
        h("p", {}, h("b", {}, `Zona ${cfg.zona}: `), ZONAS[cfg.zona].d, ". ", h("span", { class: "muted small" }, `Categoría de diseño CE mínima: ${ZONAS[cfg.zona].cat} (A → 1–7 · B → 2–7 · C → 4–7 · D → 7). Las zonas 5 y 6 se miden desde un abrigo o playa accesible, no desde la costa.`)),
      );
      wrap.append(mapPanel);

      const Lr = h("input", { type: "range", min: 2.5, max: 24, step: 0.5, value: cfg.L, oninput: (e) => { cfg.L = +e.target.value; Lv.textContent = " " + fmt(cfg.L) + " m"; }, onchange: () => { save(); render(); } });
      const Lv = h("span", { class: "v" }, " " + fmt(cfg.L) + " m");
      const num = (key, min, max) => h("input", { type: "number", min, max, value: cfg[key], inputmode: "numeric", onchange: (e) => { let v = Math.round(+e.target.value || 0); v = Math.max(min, Math.min(max, v)); cfg[key] = v; if (key === "pers" && cfg.ninos > v) cfg.ninos = v; save(); render(); } });
      const ctrl = h("div", { class: "panel stack" },
        h("div", { class: "eyebrow" }, "Tu embarcación"),
        h("div", { class: "ez-ctrl" },
          h("label", { class: "f" }, h("span", {}, "Eslora", Lv), Lr),
          field("Personas a bordo", num("pers", 1, 24)),
          field("De ellas, niños", num("ninos", 0, 24)),
          field("Propulsión", select("prop", [["motor", "Motor"], ["vela", "Vela con motor auxiliar"], ["vela-sin", "Vela sin motor"]])),
          cfg.prop !== "vela-sin" ? field("Motor", select("motor", [["fueraborda", "Fueraborda"], ["intraborda", "Intraborda (eje)"], ["colaz", "Intraborda con cola Z"]])) : null,
          cfg.prop !== "vela-sin" ? field("Potencia (kW)", num("kw", 1, 1500), `≈ ${Math.round(cfg.kw / 0.7355)} CV`) : null,
          cfg.prop !== "vela-sin" ? field("Combustible", select("comb", [["gasolina", "Gasolina (grupo 1.º)"], ["diesel", "Gasóleo (grupo 2.º)"]])) : null,
          field("Casco", select("casco", [["fibra", "Fibra (PRFV)"], ["madera", "Madera"], ["neum", "Neumático"], ["metal", "Metálico (acero/aluminio)"]])),
        ),
        h("div", { class: "row" }, toggle("diurna", "Solo navegación diurna"), toggle("cabina", "Espacio habitable cerrado"), toggle("ce", "Marcado CE")),
        cfg.ce ? field("Categoría de diseño CE", select("cat", [["A", "A — Oceánica"], ["B", "B — Alta mar"], ["C", "C — Aguas costeras"], ["D", "D — Aguas protegidas"]])) : null,
        h("details", {}, h("summary", {}, "Más detalles"),
          h("div", { class: "row" }, toggle("neum", "Neumática / semirrígida"), toggle("aseo", "Inodoro"), toggle("gas", "Cocina de gas"), toggle("fijo", "Extinción fija en motor"), toggle("comercial", "Fines comerciales (alquiler)"), toggle("medi", "Navega solo en el Mediterráneo"))),
      );
      wrap.append(ctrl);

      if (cfg.ce && !CAT_ZONAS[cfg.cat].includes(cfg.zona)) {
        wrap.append(h("div", { class: "panel warn" }, h("b", {}, "No puede navegar en esta zona. "), `Una embarcación de categoría ${cfg.cat} solo está facultada para las zonas ${CAT_ZONAS[cfg.cat].join(", ")} (RD 339/2021 art. 3.3), aunque lleve el equipo.`));
      }

      const items = requisitos(cfg);
      const total = items.length;
      const cnt = h("span", { class: "chip acc" }, `${[...checked].filter((k) => items.some((i) => i.key === k)).length}/${total} revisado`);
      wrap.append(h("div", { class: "row" }, h("h3", {}, `Equipo obligatorio · zona ${cfg.zona} · ${fmt(cfg.L)} m · ${cfg.pers} pers.`), cnt,
        h("button", { class: "btn sm ghost", type: "button", onclick: () => { checked.clear(); render(); } }, "Desmarcar todo")));
      const grid = h("div", { class: "grid" });
      for (const [g, gname] of Object.entries(GRUPOS)) {
        const gi = items.filter((i) => i.g === g);
        if (!gi.length) continue;
        const p = h("div", { class: "panel grp" }, h("h4", {}, gname, h("span", { class: "chip" }, gi.length)));
        for (const it of gi) {
          const row = h("div", { class: "it" + (checked.has(it.key) ? " done" : "") },
            h("input", { type: "checkbox", "aria-label": `Revisado: ${it.name}`, checked: checked.has(it.key) || null, onchange: (e) => { e.target.checked ? checked.add(it.key) : checked.delete(it.key); row.classList.toggle("done", e.target.checked); cnt.textContent = `${[...checked].filter((k) => items.some((i) => i.key === k)).length}/${total} revisado`; } }),
            h("div", {}, h("span", { class: "nm" }, it.name), " — ", h("span", {}, it.ok)),
            h("div", { class: "rq muted" }, it.req),
            h("div", { class: "ct" }, it.cite));
          p.append(row);
        }
        grid.append(p);
      }
      wrap.append(grid);
      const ex = extintores(cfg);
      wrap.append(h("p", { class: "small muted" },
        "Fuentes: RD 339/2021 (BOE-A-2021-8268, texto consolidado; última modificación RD 587/2022) y RD 1185/2006 arts. 56–60. ",
        cfg.ce ? "Con marcado CE, extintores y sistema fijo son los del manual del propietario (arts. 15.1 y 16.1); los arts. 18, 19 y 22 no se aplican a barcos CE. " : "",
        ex.fijoObl ? "Motor intraborda de gasolina sin CE: sistema fijo obligatorio (art. 16.2). " : "",
        "No incluye equipo exigido a embarcaciones con tripulación profesional ni a las de alquiler con fines lucrativos más allá de lo indicado."));
      return wrap;
    }

    // ----- Revista de inspección -----
    let rev = null;
    function nuevaRevista() {
      const zona = 1 + Math.floor(Math.random() * 7);
      const prop = pick(["motor", "motor", "vela"]);
      const L = pick(zona <= 3 ? [9, 11, 12, 14, 16, 21] : [4.5, 6, 7.5, 9, 11, 12, 14]);
      const c = {
        ...DEF, zona, L, prop,
        pers: 2 + Math.floor(Math.random() * 6), ninos: Math.random() < 0.35 ? 1 : 0,
        motor: prop === "motor" ? pick(["fueraborda", "intraborda", "colaz"]) : "intraborda",
        kw: prop === "motor" ? pick([30, 75, 150, 250]) : 20,
        comb: "diesel", casco: pick(["fibra", "fibra", "madera", "metal"]), ce: false,
        cabina: L >= 7, diurna: zona >= 4 && Math.random() < 0.4, neum: false, aseo: false, gas: false, comercial: false, fijo: false, medi: true,
      };
      if (c.motor === "fueraborda" && c.L > 12) c.motor = "intraborda";
      const req = requisitos(c);
      const sup = requisitos({ ...c, zona: 1, diurna: false });
      const reqMap = new Map(req.map((i) => [i.key, i]));
      const keys = [...sup.map((i) => i.key)];
      for (const i of req) if (!keys.includes(i.key)) keys.push(i.key);
      const nBad = 2 + Math.floor(Math.random() * 3);
      const breakable = shuffle(req.filter((i) => i.bads.length).map((i) => i.key)).slice(0, nBad);
      const rows = keys.map((k) => {
        const r = reqMap.get(k);
        const s = sup.find((i) => i.key === k) || r;
        if (r) {
          if (breakable.includes(k)) return { key: k, name: r.name, have: pick(r.bads), bad: true, item: r, required: true };
          return { key: k, name: r.name, have: r.ok, bad: false, item: r, required: true };
        }
        const extra = Math.random() < 0.3;
        return { key: k, name: s.name, have: extra ? s.ok : "No lleva", bad: false, item: s, required: false };
      });
      rev = { c, rows, flags: new Set(), done: false };
    }

    function renderRev() {
      if (!rev) nuevaRevista();
      const c = rev.c;
      const streak = ctx.store.get("perfectas", 0);
      const w = h("div", { class: "stack" });
      w.append(h("div", { class: "tint stack" },
        h("div", { class: "eyebrow" }, "Revista de inspección · Capitanía"),
        h("p", {}, "Revisa el inventario y marca como ", h("b", {}, "Deficiente"), " todo lo que falta o no cumple para esta embarcación y esta zona. Ojo: lo que no es obligatorio en la zona no es deficiente aunque no lo lleve."),
        h("div", { class: "scen" },
          h("span", { class: "chip acc" }, `Zona ${c.zona} · ${ZONAS[c.zona].d}`),
          h("span", { class: "chip" }, `${fmt(c.L)} m`),
          h("span", { class: "chip" }, c.prop === "motor" ? `Motor ${c.motor === "fueraborda" ? "fueraborda" : c.motor === "colaz" ? "intraborda cola Z" : "intraborda"} ${c.kw} kW diésel` : `Velero, motor auxiliar ${c.kw} kW`),
          h("span", { class: "chip" }, `${c.pers} personas${c.ninos ? ` (1 niño)` : ""}`),
          h("span", { class: "chip" }, `Casco ${c.casco === "metal" ? "metálico" : c.casco}`),
          h("span", { class: "chip" }, c.cabina ? "Con espacio habitable cerrado" : "Sin cabina"),
          h("span", { class: "chip" }, "Sin marcado CE"),
          c.zona >= 4 ? h("span", { class: "chip" }, c.diurna ? "Solo de día" : "Navega también de noche") : null),
        h("p", { class: "small muted" }, `Inspecciones perfectas: ${Math.min(streak, 3)}/3 para la insignia «Estibador».`)));

      const list = h("div", { class: "inv" });
      for (const r of rev.rows) {
        const row = h("div", { class: "inv-row", "data-f": rev.flags.has(r.key) ? "1" : "0" },
          h("div", {}, h("div", { class: "lab" }, r.name), h("div", { class: "have" }, "A bordo: ", r.have)),
          h("button", { type: "button", class: "btn sm flag", "aria-pressed": String(rev.flags.has(r.key)), disabled: rev.done || null, onclick: () => {
            rev.flags.has(r.key) ? rev.flags.delete(r.key) : rev.flags.add(r.key);
            row.dataset.f = rev.flags.has(r.key) ? "1" : "0";
            row.querySelector(".flag").setAttribute("aria-pressed", String(rev.flags.has(r.key)));
            row.querySelector(".flag").textContent = rev.flags.has(r.key) ? "Deficiente" : "Conforme";
          } }, rev.flags.has(r.key) ? "Deficiente" : "Conforme"));
        if (rev.done) {
          const flagged = rev.flags.has(r.key);
          const right = flagged === r.bad;
          row.classList.add(right ? "r-ok" : "r-bad");
          let msg;
          if (r.bad && flagged) msg = [h("span", { class: "fb-ok" }, "Bien detectado. "), "Exigido: ", r.item.req];
          else if (r.bad) msg = [h("span", { class: "fb-bad" }, "Se te pasó. "), "Exigido: ", r.item.req];
          else if (flagged && !r.required) msg = [h("span", { class: "fb-bad" }, "No es obligatorio en esta zona/eslora. "), r.item.req];
          else if (flagged) msg = [h("span", { class: "fb-bad" }, "Esto sí cumple. "), r.item.req];
          else if (r.required) msg = null;
          else msg = [h("span", { class: "muted" }, "No obligatorio aquí.")];
          if (msg) row.append(h("div", { class: "exp" }, ...msg, " ", h("span", { class: "mono muted" }, `(${r.item.cite})`)));
        }
        list.append(row);
      }
      w.append(list);

      const res = h("div", { class: "row" });
      if (!rev.done) {
        res.append(h("button", { class: "btn primary", type: "button", onclick: comprobar }, "Comprobar inspección"));
      } else {
        const bad = rev.rows.filter((r) => r.bad);
        const hit = bad.filter((r) => rev.flags.has(r.key)).length;
        const fp = rev.rows.filter((r) => !r.bad && rev.flags.has(r.key)).length;
        res.append(h("p", {}, h("b", { class: hit === bad.length && !fp ? "fb-ok" : "fb-bad" }, `${hit}/${bad.length} deficiencias detectadas`), fp ? `, ${fp} falsa${fp > 1 ? "s" : ""} alarma${fp > 1 ? "s" : ""}.` : "."),
          h("button", { class: "btn primary", type: "button", onclick: () => { nuevaRevista(); render(); } }, "Otra embarcación"));
      }
      w.append(res);
      return w;
    }

    function comprobar() {
      rev.done = true;
      const bad = rev.rows.filter((r) => r.bad);
      const hit = bad.filter((r) => rev.flags.has(r.key)).length;
      const fp = rev.rows.filter((r) => !r.bad && rev.flags.has(r.key)).length;
      if (hit === bad.length && fp === 0) {
        const n = ctx.store.get("perfectas", 0) + 1;
        ctx.store.set("perfectas", n);
        ctx.award(40, "Revista de inspección sin errores");
        if (n >= 3 && !ctx.store.get("badge", false)) { ctx.store.set("badge", true); ctx.badge("estibador"); ctx.toast("Insignia «Estibador» desbloqueada"); }
        else if (n < 3) ctx.toast(`Inspección perfecta (${n}/3)`);
      } else if (hit) {
        ctx.award(Math.min(15, hit * 5), "Deficiencias detectadas en la revista");
      }
      render();
    }

    render();
    return () => { root.remove(); };
  },
};
