// Catálogo visual del balizamiento IALA Región A (MBS, Recomendación R1001 ed. 2.0, 2022).
// Cada marca se dibuja en SVG (boya, castillete o espeque) con su luz animada según su ritmo real.

const ID = "balizas-catalogo";

/* ---------- Colores físicos de marcas y luces (literales permitidos por la especificación) ---------- */
const P = { R: "#d42a33", G: "#12904a", Y: "#f3c300", K: "#17191c", W: "#f6f5f0", Bu: "#1d5fd0" };
const LC = { W: "#fff7d6", R: "#ff3b30", G: "#3dff7d", Y: "#ffd21a", Bu: "#4f8cff" };

/* ---------- Motor de ritmos: lista de [color|null, segundos] ---------- */
const on = (c, d) => [c, d];
const off = (d) => [null, d];
function group(c, n, onT, offT) { const s = []; for (let i = 0; i < n; i++) s.push(on(c, onT), off(offT)); return s; }
function pad(segs, period) { const tot = segs.reduce((a, s) => a + s[1], 0); if (period > tot) segs.push(off(+(period - tot).toFixed(3))); return segs; }
function fl(c, n, period, onT = 0.5, gap = 0.7) { const s = group(c, n, onT, gap); s.pop(); return pad(s, period); }
const Q = (c) => [on(c, 0.3), off(0.7)];            // 60 por minuto
const VQ = (c) => [on(c, 0.2), off(0.3)];           // 120 por minuto
const LIGHTS = {
  "Fl(4) R 12s": fl(LC.R, 4, 12),
  "Fl(2) R 6s": fl(LC.R, 2, 6),
  "Fl R 5s": fl(LC.R, 1, 5),
  "Q R": Q(LC.R),
  "Fl G 5s": fl(LC.G, 1, 5),
  "Fl(3) G 9s": fl(LC.G, 3, 9),
  "Fl(2) G 6s": fl(LC.G, 2, 6),
  "Q G": Q(LC.G),
  "Fl(2+1) R 10s": pad([on(LC.R, .5), off(.7), on(LC.R, .5), off(1.6), on(LC.R, .5)], 10),
  "Fl(2+1) G 10s": pad([on(LC.G, .5), off(.7), on(LC.G, .5), off(1.6), on(LC.G, .5)], 10),
  "Q": Q(LC.W),
  "VQ": VQ(LC.W),
  "Q(3) 10s": pad(group(LC.W, 3, .3, .7), 10),
  "VQ(3) 5s": pad(group(LC.W, 3, .2, .3), 5),
  "Q(6)+LFl 15s": pad([...group(LC.W, 6, .3, .7), on(LC.W, 2)], 15),
  "VQ(6)+LFl 10s": pad([...group(LC.W, 6, .2, .3), on(LC.W, 2)], 10),
  "Q(9) 15s": pad(group(LC.W, 9, .3, .7), 15),
  "VQ(9) 10s": pad(group(LC.W, 9, .2, .3), 10),
  "Fl(2) 5s": fl(LC.W, 2, 5),
  "Iso 4s": [on(LC.W, 2), off(2)],
  "Oc 4s": [on(LC.W, 3), off(1)],
  "LFl 10s": [on(LC.W, 2), off(8)],
  "Mo(A) 6s": [on(LC.W, .5), off(.5), on(LC.W, 1.5), off(3.5)],
  "Fl(5) Y 20s": fl(LC.Y, 5, 20),
  "Fl(4) Y 12s": fl(LC.Y, 4, 12),
  "Fl Y 5s": fl(LC.Y, 1, 5),
  "Oc Y 4s": [on(LC.Y, 3), off(1)],
  "Al.Bu.Y 3s": [on(LC.Bu, 1), off(.5), on(LC.Y, 1), off(.5)],
  "MAtoN Y": (() => { const fk = () => group(LC.Y, 5, .1, .1); return [...fk(), off(.7), ...fk(), off(.7), ...fk(), off(.5), on(LC.Y, 1), off(.5), on(LC.Y, 1), off(3)]; })(),
};
function litAt(segs, t) {
  const tot = segs.reduce((a, s) => a + s[1], 0);
  let x = ((t % tot) + tot) % tot;
  for (const s of segs) { if (x < s[1]) return s[0]; x -= s[1]; }
  return null;
}

/* ---------- Catálogo ---------- */
const MARKS = [
  { id: "babor", grp: "lat", name: "Lateral de babor", bands: [[P.R, 1]], shapes: ["can", "pillar", "spar"], top: "can",
    lights: ["Fl(4) R 12s", "Fl(2) R 6s", "Fl R 5s", "Q R"],
    color: "Roja.", forma: "Cilíndrica (lata), castillete o espeque.", tope: "Un cilindro rojo.",
    luz: "Roja, cualquier ritmo salvo el compuesto Fl(2+1) (reservado al canal preferido).",
    uso: "Lado de babor del canal siguiendo el sentido convencional del balizamiento. Si se numeran: números pares.",
    pasar: "Entrando desde la mar: déjala por tu babor (a la izquierda). Saliendo de puerto la verás por estribor.",
    mnemo: ["«Babor» y «rojo» son las palabras cortas; «estribor» y «verde», las largas.", "Lata roja = babor: el cilindro no tiene punta, como la «B» de babor tiene barriga.", "Boya roja por estribor ⇒ estás saliendo de puerto."] },
  { id: "estribor", grp: "lat", name: "Lateral de estribor", bands: [[P.G, 1]], shapes: ["cone", "pillar", "spar"], top: "cone",
    lights: ["Fl G 5s", "Fl(3) G 9s", "Fl(2) G 6s", "Q G"],
    color: "Verde.", forma: "Cónica, castillete o espeque.", tope: "Un cono verde con el vértice hacia arriba.",
    luz: "Verde, cualquier ritmo salvo Fl(2+1).",
    uso: "Lado de estribor del canal en el sentido convencional. Si se numeran: números impares.",
    pasar: "Entrando: déjala por tu estribor (a la derecha). Cono verde por estribor inmediato ⇒ entrando por dentro del canal.",
    mnemo: ["Verde y estribor: las palabras largas van juntas.", "El cono apunta al cielo: «sube» a puerto con el verde a la derecha.", "Cualquier verde con 1, 2, 3… destellos (no 2+1) es de estribor."] },
  { id: "pref-estribor", grp: "pref", name: "Canal principal a estribor", bands: [[P.R, 1], [P.G, 1], [P.R, 1]], shapes: ["can", "pillar", "spar"], top: "can",
    lights: ["Fl(2+1) R 10s"],
    color: "Roja con una ancha banda horizontal verde.", forma: "Cilíndrica, castillete o espeque (forma de la de babor).", tope: "Un cilindro rojo.",
    luz: "Roja, grupos compuestos Fl(2+1).",
    uso: "Lateral de babor modificada en una bifurcación: el canal principal (preferido) sigue a estribor.",
    pasar: "Por el canal principal: déjala por babor, como una roja. Por el canal secundario: déjala por estribor.",
    mnemo: ["Manda el color del cuerpo: es «roja», así que en el principal la tratas como una de babor.", "La banda es el canal secundario «colado» en medio.", "Fl(2+1) siempre = bifurcación (canal preferido)."] },
  { id: "pref-babor", grp: "pref", name: "Canal principal a babor", bands: [[P.G, 1], [P.R, 1], [P.G, 1]], shapes: ["cone", "pillar", "spar"], top: "cone",
    lights: ["Fl(2+1) G 10s"],
    color: "Verde con una ancha banda horizontal roja.", forma: "Cónica, castillete o espeque (forma de la de estribor).", tope: "Un cono verde, vértice arriba.",
    luz: "Verde, grupos compuestos Fl(2+1).",
    uso: "Lateral de estribor modificada en una bifurcación: el canal principal sigue a babor.",
    pasar: "Por el canal principal: déjala por estribor, como una verde. Por el secundario: déjala por babor.",
    mnemo: ["Cuerpo verde ⇒ en el principal se trata como de estribor ⇒ el principal queda a babor.", "Cónica verde con banda roja entrando = canal principal a babor."] },
  { id: "card-n", grp: "card", name: "Cardinal Norte", bands: [[P.K, 1], [P.Y, 1]], shapes: ["pillar", "spar"], top: "N",
    lights: ["Q", "VQ"],
    color: "Negro sobre amarillo (negro arriba).", forma: "Castillete o espeque.", tope: "Dos conos negros superpuestos con los vértices hacia arriba.",
    luz: "Blanca, centelleante continua: Q (50–60/min) o VQ (100–120/min).",
    uso: "Las aguas más seguras (navegables) están al Norte de la marca. Cuadrante N: entre NW y NE verdaderos, tomados desde el punto que interesa balizar.",
    pasar: "Pasa por el Norte de la marca.",
    mnemo: ["Los conos apuntan hacia donde está el negro: ▲▲ arriba ⇒ negro arriba.", "Reloj: a las 12 no se cuentan destellos ⇒ continua.", "Ambos conos «miran al Norte»."] },
  { id: "card-e", grp: "card", name: "Cardinal Este", bands: [[P.K, 1], [P.Y, 1], [P.K, 1]], shapes: ["pillar", "spar"], top: "E",
    lights: ["Q(3) 10s", "VQ(3) 5s"],
    color: "Negra con una ancha banda horizontal amarilla.", forma: "Castillete o espeque.", tope: "Dos conos negros opuestos por sus bases (rombo).",
    luz: "Blanca: Q(3) cada 10 s o VQ(3) cada 5 s.",
    uso: "Las aguas más seguras están al Este de la marca.",
    pasar: "Pasa por el Este de la marca.",
    mnemo: ["Conos base con base = «huevo» ⇒ E de «Egg».", "Conos hacia fuera ⇒ negro arriba y abajo.", "Reloj: las 3 ⇒ 3 destellos."] },
  { id: "card-s", grp: "card", name: "Cardinal Sur", bands: [[P.Y, 1], [P.K, 1]], shapes: ["pillar", "spar"], top: "S",
    lights: ["Q(6)+LFl 15s", "VQ(6)+LFl 10s"],
    color: "Amarillo sobre negro (negro abajo).", forma: "Castillete o espeque.", tope: "Dos conos negros superpuestos con los vértices hacia abajo.",
    luz: "Blanca: Q(6)+LFl cada 15 s o VQ(6)+LFl cada 10 s. El destello largo (≥ 2 s) evita confundir 6 con 3 o 9.",
    uso: "Las aguas más seguras están al Sur de la marca.",
    pasar: "Pasa por el Sur de la marca.",
    mnemo: ["▼▼ apuntan abajo ⇒ negro abajo.", "Reloj: las 6 ⇒ 6 destellos + uno largo.", "Ambos conos «miran al Sur»."] },
  { id: "card-w", grp: "card", name: "Cardinal Oeste", bands: [[P.Y, 1], [P.K, 1], [P.Y, 1]], shapes: ["pillar", "spar"], top: "W",
    lights: ["Q(9) 15s", "VQ(9) 10s"],
    color: "Amarilla con una ancha banda horizontal negra.", forma: "Castillete o espeque.", tope: "Dos conos negros opuestos por sus vértices (reloj de arena).",
    luz: "Blanca: Q(9) cada 15 s o VQ(9) cada 10 s.",
    uso: "Las aguas más seguras están al Oeste de la marca.",
    pasar: "Pasa por el Oeste de la marca.",
    mnemo: ["Vértice con vértice = «cintura» o copa de vino ⇒ W de «Wine glass».", "Conos hacia dentro ⇒ negro en el centro.", "Reloj: las 9 ⇒ 9 destellos."] },
  { id: "peligro", grp: "aisl", name: "Peligro aislado", bands: [[P.K, 1], [P.R, 1], [P.K, 1]], shapes: ["pillar", "spar"], top: "2S",
    lights: ["Fl(2) 5s"],
    color: "Negra con una o varias anchas bandas horizontales rojas.", forma: "Normalmente castillete o espeque.", tope: "Dos esferas negras superpuestas (su rasgo diurno principal).",
    luz: "Blanca, grupos de 2 destellos Fl(2).",
    uso: "Sobre, amarrada o junto a un peligro de dimensiones limitadas rodeado por todas partes de aguas navegables. Duplicada: riesgo especialmente elevado.",
    pasar: "Puedes pasar por cualquier lado, pero lejos: consulta la carta para saber el tamaño del peligro y la distancia segura.",
    mnemo: ["Dos esferas ⇒ dos destellos.", "Negro y rojo: color de peligro.", "No confundir con cardinal: la luz no es Q ni VQ."] },
  { id: "navegables", grp: "nav", name: "Aguas navegables", bands: "RW", shapes: ["sphere", "pillar", "spar"], top: "SR",
    lights: ["LFl 10s", "Iso 4s", "Oc 4s", "Mo(A) 6s"],
    color: "Franjas verticales rojas y blancas.", forma: "Esférica, castillete o espeque.", tope: "Una única esfera roja (si tiene).",
    luz: "Blanca: isofase, de ocultaciones, un destello largo cada 10 s o Morse «A» (·–), exclusivo de esta marca.",
    uso: "Aguas seguras alrededor: eje o centro de canal, recalada, aproximación a puerto, mejor paso bajo un puente. No señala ningún peligro.",
    pasar: "Puedes pasar por cualquier lado; lo habitual es dejarla por babor o pasar por su eje.",
    mnemo: ["Única marca con franjas VERTICALES (rojo y blanco).", "Esfera roja = todo redondo, todo seguro.", "Mo(A) = «A» de Aguas navegables."] },
  { id: "especial", grp: "esp", name: "Marca especial", bands: [[P.Y, 1]], shapes: ["can", "cone", "sphere", "pillar", "spar"], top: "X",
    lights: ["Fl(5) Y 20s", "Fl(4) Y 12s", "Fl Y 5s", "Oc Y 4s"],
    color: "Amarilla.", forma: "Libre, sin prestarse a confusión con las de ayuda a la navegación (no contradecir a las laterales).", tope: "Un aspa amarilla en forma de «X» (si tiene).",
    luz: "Amarilla, cualquier ritmo salvo los reservados a cardinales, peligro aislado, aguas navegables y MAtoN. Ej.: Fl(4) Y, Fl(5) Y 20 s.",
    uso: "Zona o configuración especial cuya naturaleza está en la carta: límites de fondeo, zonas de baño o ejercicios militares, cables o tuberías submarinas, ODAS, vertidos, canales para buques de gran calado. Nunca para recalada o aproximación a puerto.",
    pasar: "No indica por dónde pasar: consulta la carta y las publicaciones náuticas.",
    mnemo: ["Amarillo = «aquí pasa algo especial»; la X tacha la zona en la carta.", "Luz amarilla nunca con ritmos de luces blancas (con mala visibilidad se confunden)."] },
  { id: "pictograma", grp: "esp", name: "Especial con pictograma", bands: [[P.Y, 1]], shapes: ["pillar", "can"], top: "X", picto: true,
    lights: ["Fl(4) Y 12s"],
    color: "Amarilla, con pictograma.", forma: "Libre (sin confundir con otras).", tope: "Aspa amarilla «X».",
    luz: "Amarilla (ritmo no reservado).",
    uso: "Las marcas especiales pueden llevar letras o números y un pictograma que indique su finalidad, con la simbología de la OHI o de la autoridad competente.",
    pasar: "Respeta la zona indicada (fondeo, cable submarino, buceo/baño…): mira la carta.",
    mnemo: ["El dibujo dice el porqué; la carta dice dónde.", "Pictograma = siempre marca especial (amarilla)."] },
  { id: "naufragio", grp: "nuevo", name: "Naufragio de emergencia (nuevo peligro)", bands: "BuY", shapes: ["pillar", "spar"], top: "+",
    lights: ["Al.Bu.Y 3s"],
    color: "Franjas verticales azules y amarillas en igual número (mín. 4, máx. 8).", forma: "Castillete o espeque.", tope: "Cruz amarilla vertical/perpendicular (+).",
    luz: "Alternada azul y amarilla: 1 s azul, 0,5 s ocultación, 1 s amarilla, 0,5 s ocultación. Racon Morse «D» (– · ·) y AIS.",
    uso: "Marca provisional de nuevos peligros aún no cartografiados (naufragio reciente) hasta su balizamiento definitivo.",
    pasar: "Aléjate con amplio resguardo: el peligro aún no figura en la carta ni en los avisos.",
    mnemo: ["Azul + amarillo = luces de emergencia.", "Racon «D» de «Danger»/derrelicto.", "La cruz «+» es una X puesta de pie."] },
  { id: "movil", grp: "nuevo", name: "Marca especial móvil (MAtoN)", bands: [[P.Y, 1]], shapes: ["can", "sphere", "pillar"], top: "X",
    lights: ["MAtoN Y"],
    color: "Amarilla.", forma: "Libre, sin confundir con las laterales.", tope: "Aspa amarilla «X» (recomendada para destacarla).",
    luz: "Amarilla, ritmo reservado: 3 centelleos (parpadeo a 5 Hz de 1 s) seguidos de 2 destellos de 1 s. Puede llevar AIS y reflector radar.",
    uso: "Fijada a objetos flotantes que se desplazan y pueden ser peligro de abordaje (p. ej., contenedores o estructuras a la deriva, equipos remolcados).",
    pasar: "Trátala como un obstáculo que se mueve: no supongas su posición fija; dale resguardo.",
    mnemo: ["Parpadeo nervioso + 2 destellos = «me muevo».", "Es especial (amarilla) pero móvil."] },
];
const GROUPS = [["all", "Todas"], ["lat", "Laterales"], ["pref", "Canal preferido"], ["card", "Cardinales"], ["aisl", "Peligro aislado"], ["nav", "Aguas navegables"], ["esp", "Especiales"], ["nuevo", "Naufragio y móvil"]];
const SHAPE_N = { can: "Boya cilíndrica", cone: "Boya cónica", sphere: "Boya esférica", pillar: "Castillete", spar: "Espeque" };

/* ---------- Dibujo SVG ---------- */
let uid = 0;
function bodyGeom(shape) {
  // viewBox 0 0 120 210, línea de flotación y=182. Devuelve {path, top}
  switch (shape) {
    case "can": return { d: "M36 118 h48 v66 h-48 z", top: 118 };
    case "cone": return { d: "M32 184 L88 184 L63 112 L57 112 Z", top: 112 };
    case "sphere": return { d: "M60 116 a33 33 0 1 1 -0.01 0 Z", top: 116 };
    case "pillar": return { d: "M26 186 L94 186 L87 164 L77 164 L71 98 L49 98 L43 164 L33 164 Z", top: 98 };
    default: return { d: "M54 96 Q54 92 60 92 Q66 92 66 96 L66 188 L54 188 Z", top: 92 };
  }
}
function topmarkSVG(type, cx, b) {
  const st = 'stroke="#000" stroke-opacity=".55" stroke-width="1"';
  const K = P.K, tri = (y0, up) => up ? `M${cx - 9} ${y0} L${cx + 9} ${y0} L${cx} ${y0 - 15} Z` : `M${cx - 9} ${y0 - 15} L${cx + 9} ${y0 - 15} L${cx} ${y0} Z`;
  switch (type) {
    case "can": return `<rect x="${cx - 8}" y="${b - 16}" width="16" height="16" fill="${P.R}" ${st}/>`;
    case "cone": return `<path d="${tri(b, true)}" fill="${P.G}" ${st}/>`;
    case "N": return `<path d="${tri(b, true)} ${tri(b - 19, true)}" fill="${K}"/>`;
    case "S": return `<path d="${tri(b, false)} ${tri(b - 19, false)}" fill="${K}"/>`;
    case "E": return `<path d="${tri(b, false)} ${tri(b - 16, true)}" fill="${K}"/>`;
    case "W": return `<path d="${tri(b, true)} ${tri(b - 16, false)}" fill="${K}"/>`;
    case "2S": return `<circle cx="${cx}" cy="${b - 7}" r="7" fill="${K}"/><circle cx="${cx}" cy="${b - 23}" r="7" fill="${K}"/>`;
    case "SR": return `<circle cx="${cx}" cy="${b - 8}" r="8" fill="${P.R}" ${st}/>`;
    case "X": return `<path d="M${cx - 9} ${b - 18} L${cx + 9} ${b} M${cx + 9} ${b - 18} L${cx - 9} ${b}" stroke="#7a6200" stroke-width="6" stroke-linecap="round"/><path d="M${cx - 9} ${b - 18} L${cx + 9} ${b} M${cx + 9} ${b - 18} L${cx - 9} ${b}" stroke="${P.Y}" stroke-width="4" stroke-linecap="round"/>`;
    case "+": return `<path d="M${cx} ${b - 20} V${b} M${cx - 10} ${b - 10} H${cx + 10}" stroke="#7a6200" stroke-width="6" stroke-linecap="round"/><path d="M${cx} ${b - 20} V${b} M${cx - 10} ${b - 10} H${cx + 10}" stroke="${P.Y}" stroke-width="4" stroke-linecap="round"/>`;
  }
  return "";
}
function pictoSVG(kind, cx, cy) {
  const s = `fill="none" stroke="${P.K}" stroke-width="1.6" stroke-linecap="round"`;
  const box = `<rect x="${cx - 10}" y="${cy - 10}" width="20" height="20" rx="2" fill="${P.W}" stroke="${P.K}" stroke-width=".8"/>`;
  if (kind === 1) return box + `<path d="M${cx - 8} ${cy + 4} l3 -6 l3 6 l3 -6 l3 6 l3 -6" ${s}/>`; // cable
  if (kind === 2) return box + `<circle cx="${cx - 4}" cy="${cy - 4}" r="2" fill="${P.K}"/><path d="M${cx - 7} ${cy + 1} l5 -2 l6 3 M${cx - 8} ${cy + 6} q2 -2 4 0 t4 0 t4 0 t4 0" ${s}/>`; // baño
  return box + `<path d="M${cx} ${cy - 7} v13 M${cx - 4} ${cy - 4} h8 M${cx - 7} ${cy + 1} q1 6 7 6 q6 0 7 -6" ${s}/><circle cx="${cx}" cy="${cy - 8}" r="1.6" ${s}/>`; // ancla
}
function markSVG(m, shape, opts = {}) {
  const k = ++uid, night = !!opts.night, g = bodyGeom(shape);
  const clip = `cl${k}`;
  let fill = "";
  if (Array.isArray(m.bands)) {
    // bandas horizontales desde la parte alta del cuerpo hasta la flotación
    const y0 = g.top, y1 = 190, tw = m.bands.reduce((a, b) => a + b[1], 0);
    let y = y0;
    // en la W la banda negra ocupa ~1/3 de la altura; en E/peligro idem
    m.bands.forEach(([c, w]) => { const h = (y1 - y0) * w / tw; fill += `<rect x="0" y="${y.toFixed(1)}" width="120" height="${(h + .6).toFixed(1)}" fill="${c}"/>`; y += h; });
  } else {
    const cols = m.bands === "RW" ? [P.R, P.W] : [P.Bu, P.Y];
    const n = 6, x0 = shape === "spar" ? 54 : shape === "sphere" ? 27 : 26, w = (shape === "spar" ? 12 : shape === "sphere" ? 66 : 68) / n;
    for (let i = 0; i < n; i++) fill += `<rect x="${(x0 + i * w).toFixed(1)}" y="0" width="${(w + .4).toFixed(1)}" height="210" fill="${cols[i % 2]}"/>`;
  }
  const lattice = shape === "pillar" ? `<path d="M49 106 L71 124 M71 106 L49 124 M48 128 L72 146 M72 128 L48 146 M46 150 L74 164 M74 150 L46 164" stroke="#000" stroke-opacity=".28" stroke-width="1"/>` : "";
  const shade = `<rect x="0" y="0" width="120" height="210" fill="url(#sh${k})"/>`;
  const mastTop = g.top - 40;
  const lampY = g.top - 9;
  const picto = m.picto ? pictoSVG(opts.picto || 0, 60, shape === "pillar" ? 140 : 150) : "";
  const num = opts.num ? `<text x="60" y="${shape === "pillar" ? 176 : 172}" text-anchor="middle" font-family="var(--f-mono)" font-size="11" font-weight="700" fill="${m.bands === "RW" || m.grp === "lat" || m.grp === "pref" ? "#fff" : "#000"}">${opts.num}</text>` : "";
  const dim = night ? ` opacity=".16"` : "";
  return `<svg viewBox="0 0 120 210" role="img" aria-label="${m.name} (${SHAPE_N[shape]})" class="m-${ID}-svg">
  <defs><clipPath id="${clip}"><path d="${g.d}"/></clipPath>
  <linearGradient id="sh${k}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".35" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
  </defs>
  <rect width="120" height="210" style="fill:${night ? "var(--night)" : "var(--sea)"}"/>
  ${night ? "" : `<path d="M0 182 Q15 178 30 182 T60 182 T90 182 T120 182 V210 H0Z" style="fill:var(--sea-2)"/>`}
  <g${dim}>
   <line x1="60" y1="${g.top}" x2="60" y2="${mastTop}" stroke="#333" stroke-width="2"/>
   <rect x="55" y="${lampY - 6}" width="10" height="11" rx="2" fill="#2a2f35"/>
   <g clip-path="url(#${clip})">${fill}${shade}</g>${lattice}${picto}${num}
   <path d="${g.d}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1"/>
   ${topmarkSVG(m.top, 60, mastTop + 2)}
  </g>
  ${night ? `<path d="M0 183 H120" stroke="#fff" stroke-opacity=".06"/>` : `<path d="M0 182 Q15 178 30 182 T60 182 T90 182 T120 182 V188 H0Z" style="fill:var(--sea-2)" opacity=".85"/>`}
  <g data-lamp="${m.light}">
   <g class="glow" opacity="0"><circle cx="60" cy="${lampY}" r="${night ? 30 : 18}" opacity=".16"/><circle cx="60" cy="${lampY}" r="${night ? 16 : 10}" opacity=".35"/><circle cx="60" cy="${lampY}" r="6" opacity=".8"/></g>
   <circle class="bulb" cx="60" cy="${lampY}" r="3.2" fill="#555"/>
  </g></svg>`;
}

/* ---------- Estilos ---------- */
const CSS = `
.m-${ID} { display:flex; flex-direction:column; gap:1rem; }
.m-${ID} [hidden] { display:none !important; }
.m-${ID} .cards { display:grid; gap:.6rem; grid-template-columns:repeat(auto-fill, minmax(118px,1fr)); }
.m-${ID} .card { display:flex; flex-direction:column; gap:.25rem; padding:.4rem; border:1px solid var(--line); border-radius:var(--r); background:var(--sheet); cursor:pointer; text-align:left; color:inherit; min-width:0; }
.m-${ID} .card:hover { border-color:var(--sea-2); }
.m-${ID} .card[aria-pressed="true"] { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); }
.m-${ID} .card .nm { font:600 .95rem/1.1 var(--f-display); }
.m-${ID} .card .lt { font:.72rem/1.2 var(--f-mono); color:var(--muted); }
.m-${ID} .card svg { border-radius:var(--r-sm); width:100%; height:auto; aspect-ratio:120/186; }
.m-${ID}-svg { display:block; }
.m-${ID} .fx { display:grid; gap:1rem; grid-template-columns:minmax(0,220px) minmax(0,1fr); }
@media (max-width:640px){ .m-${ID} .fx { grid-template-columns:1fr; } .m-${ID} .fx .fig { max-width:220px; margin:0 auto; width:100%; } }
.m-${ID} .fig svg { width:100%; height:auto; border-radius:var(--r); border:1px solid var(--line); }
.m-${ID} dl { display:grid; grid-template-columns:max-content minmax(0,1fr); gap:.35rem .8rem; margin:0; font-size:.93rem; }
.m-${ID} dt { font-weight:700; color:var(--muted); }
.m-${ID} dd { margin:0; }
.m-${ID} .faro { background:var(--night); border-radius:var(--r); padding:.6rem .8rem; color:#e9eef2; display:flex; align-items:center; gap:.8rem; }
.m-${ID} .faro .dot { width:34px; height:34px; border-radius:50%; flex:none; background:#222; transition:none; }
.m-${ID} .faro .meta { flex:1; min-width:0; }
.m-${ID} .faro .nt { font:600 1.05rem var(--f-mono); }
.m-${ID} .tl { width:100%; height:16px; display:block; margin-top:.3rem; }
.m-${ID} .mn { margin:0; padding-left:1.1rem; }
.m-${ID} .mn li { margin:.15rem 0; }
.m-${ID} .opts { display:grid; gap:.5rem; grid-template-columns:repeat(auto-fit, minmax(min(100%,200px),1fr)); }
.m-${ID} .opts .btn { justify-content:flex-start; text-align:left; }
.m-${ID} .opts .btn.ok { border-color:var(--ok); color:var(--ok); }
.m-${ID} .opts .btn.bad { border-color:var(--bad); color:var(--bad); }
.m-${ID} .quizfig { max-width:200px; width:100%; margin:0 auto; }
.m-${ID} .quizfig svg { width:100%; height:auto; border-radius:var(--r); }
`;

function el(tag, attrs = {}, html = "") { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; return e; }
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export default {
  id: ID,
  tema: 5,
  title: "Catálogo de balizas IALA A",
  icon: "▲",
  desc: "Todas las marcas del sistema IALA Región A (MBS 2022) dibujadas de día y de noche, con su luz real y mnemotecnias.",
  mount(root, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) { const s = el("style", { "data-mod": ID }); s.textContent = CSS; document.head.appendChild(s); }
    const st = { grp: ctx.store.get("grp", "all"), night: ctx.store.get("night", false), sel: "babor", shape: {}, light: {}, picto: 0 };
    const wrap = el("div", { class: `m-${ID}` });
    root.appendChild(wrap);
    wrap.innerHTML = `
      <div class="stack">
        <div class="eyebrow">Tema 5 · Balizamiento IALA Región A · MBS 2022</div>
        <div class="row" style="justify-content:space-between">
          <div class="seg" data-r="night" role="group" aria-label="Día o noche"><button data-v="0">Día</button><button data-v="1">Noche</button></div>
          <button class="btn sm" data-r="quizbtn">Reto: identifica la marca</button>
        </div>
        <div class="seg" data-r="grp" role="group" aria-label="Filtrar por tipo"></div>
      </div>
      <div class="panel" data-r="ficha"></div>
      <div class="panel stack" data-r="quiz" hidden></div>
      <div class="cards" data-r="cards"></div>
      <p class="small muted">Sentido convencional del balizamiento: el de un buque que se aproxima desde la mar a un puerto, río o estuario, o el fijado por la autoridad (en principio, en sentido horario alrededor de las masas de tierra).</p>`;
    const R = (n) => wrap.querySelector(`[data-r="${n}"]`);
    const grpSeg = R("grp");
    GROUPS.forEach(([v, t]) => { const b = el("button", { "data-v": v }); b.textContent = t; grpSeg.appendChild(b); });

    let lamps = [];   // {glow, bulb, segs, off}
    let faro = null;  // {dot, head, segs, tot}
    const t0 = performance.now() / 1000;

    function collectLamps() {
      lamps = [...wrap.querySelectorAll("[data-lamp]")].map((g, i) => ({ glow: g.querySelector(".glow"), bulb: g.querySelector(".bulb"), g, segs: LIGHTS[g.getAttribute("data-lamp")], off: (i * 1.37) % 7, last: undefined }));
    }
    function shapeOf(m) { return st.shape[m.id] || m.shapes[0]; }
    function lightOf(m) { return st.light[m.id] || m.lights[0]; }
    function cardsRender() {
      const c = R("cards"); c.innerHTML = "";
      MARKS.filter((m) => st.grp === "all" || m.grp === st.grp).forEach((m) => {
        const b = el("button", { class: "card", "aria-pressed": String(m.id === st.sel) });
        const mm = { ...m, light: lightOf(m) };
        b.innerHTML = markSVG(mm, shapeOf(m), { night: st.night, picto: st.picto }).replace('viewBox="0 0 120 210"', 'viewBox="0 12 120 186"') + `<span class="nm">${m.name}</span><span class="lt">${lightOf(m).replace("MAtoN Y", "MAtoN amarilla")}</span>`;
        b.onclick = () => { st.sel = m.id; renderAll(); R("ficha").scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
        c.appendChild(b);
      });
    }
    function timelineSVG(segs) {
      const tot = segs.reduce((a, s) => a + s[1], 0); let x = 0, out = "";
      segs.forEach(([c, d]) => { if (c) out += `<rect x="${(x / tot * 1000).toFixed(1)}" y="2" width="${Math.max(1.5, d / tot * 1000).toFixed(1)}" height="12" fill="${c}"/>`; x += d; });
      return { tot, svg: `<svg class="tl" viewBox="0 0 1000 16" preserveAspectRatio="none" aria-hidden="true"><rect width="1000" height="16" fill="#0d1a24"/>${out}<rect class="hd" x="0" y="0" width="3" height="16" fill="#ff5ad1"/></svg>` };
    }
    function fichaRender() {
      const m = MARKS.find((x) => x.id === st.sel), shape = shapeOf(m), light = lightOf(m), mm = { ...m, light };
      const tl = timelineSVG(LIGHTS[light]);
      const notation = light === "MAtoN Y" ? "Q-parpadeo(3)+Fl(2) Y ≈10,4 s (MAtoN)" : light;
      const f = R("ficha");
      f.innerHTML = `
        <div class="fx">
          <div class="fig stack">
            ${markSVG(mm, shape, { night: st.night, picto: st.picto, num: m.id === "babor" ? "2" : m.id === "estribor" ? "1" : "" })}
            ${m.shapes.length > 1 ? `<div class="seg" data-r="shape" role="group" aria-label="Forma">${m.shapes.map((s) => `<button data-v="${s}" aria-pressed="${s === shape}">${SHAPE_N[s].replace("Boya ", "")}</button>`).join("")}</div>` : `<span class="chip">${SHAPE_N[shape]}</span>`}
            ${m.picto ? `<div class="seg" data-r="picto" role="group" aria-label="Pictograma">${["Fondeo", "Cable", "Baño"].map((t, i) => `<button data-v="${i}" aria-pressed="${i === st.picto}">${t}</button>`).join("")}</div>` : ""}
          </div>
          <div class="stack">
            <div><div class="eyebrow">Ficha</div><h3>${m.name}</h3></div>
            <div class="faro" aria-live="off">
              <div class="dot" data-r="dot"></div>
              <div class="meta"><div class="nt">${notation}</div><div class="small" style="opacity:.75">Ciclo de ${(+tl.tot.toFixed(1)).toString().replace(".", ",")} s · luz real en tiempo real</div>${tl.svg}</div>
            </div>
            ${m.lights.length > 1 ? `<div class="row"><span class="small muted">Ritmos:</span><div class="seg" data-r="light" role="group" aria-label="Ritmo de la luz">${m.lights.map((l) => `<button data-v="${l}" aria-pressed="${l === light}">${l}</button>`).join("")}</div></div>` : ""}
            <dl>
              <dt>Color</dt><dd>${m.color}</dd>
              <dt>Forma</dt><dd>${m.forma}</dd>
              <dt>Tope</dt><dd>${m.tope}</dd>
              <dt>Luz</dt><dd>${m.luz}</dd>
              <dt>Uso</dt><dd>${m.uso}</dd>
              <dt>Cómo pasar</dt><dd><strong>${m.pasar}</strong></dd>
            </dl>
            <div class="tint"><div class="eyebrow" style="margin-bottom:.3rem">Mnemotecnia</div><ul class="mn">${m.mnemo.map((x) => `<li>${x}</li>`).join("")}</ul></div>
          </div>
        </div>`;
      f.querySelectorAll('[data-r="shape"] button').forEach((b) => b.onclick = () => { st.shape[m.id] = b.dataset.v; renderAll(); });
      f.querySelectorAll('[data-r="light"] button').forEach((b) => b.onclick = () => { st.light[m.id] = b.dataset.v; renderAll(); });
      f.querySelectorAll('[data-r="picto"] button').forEach((b) => b.onclick = () => { st.picto = +b.dataset.v; renderAll(); });
      faro = { dot: f.querySelector('[data-r="dot"]'), head: f.querySelector(".tl .hd"), segs: LIGHTS[light], tot: tl.tot, t0: performance.now() / 1000 };
    }
    function segsRender() {
      wrap.querySelectorAll('[data-r="night"] button').forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === +st.night)));
      grpSeg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === st.grp)));
    }
    function renderAll() { segsRender(); fichaRender(); cardsRender(); if (!R("quiz").hidden) quizRender(); collectLamps(); }
    wrap.querySelectorAll('[data-r="night"] button').forEach((b) => b.onclick = () => { st.night = b.dataset.v === "1"; ctx.store.set("night", st.night); renderAll(); });
    grpSeg.querySelectorAll("button").forEach((b) => b.onclick = () => {
      st.grp = b.dataset.v; ctx.store.set("grp", st.grp);
      const first = MARKS.find((m) => st.grp === "all" || m.grp === st.grp); if (first && st.grp !== "all") st.sel = first.id;
      renderAll();
    });

    /* ---------- Reto ---------- */
    const Qn = 8;
    let quiz = null;
    function newQuiz() {
      const pool = shuffle(MARKS).slice(0, Qn);
      quiz = { i: 0, ok: 0, items: pool.map((m) => {
        const night = m.id === "movil" || (Math.random() < 0.35 && m.id !== "pictograma");
        const look = (x) => JSON.stringify(x.bands) + x.top;
        const others = shuffle(MARKS.filter((x) => x.id !== m.id && (night ? !x.lights.some((l) => m.lights.includes(l)) : look(x) !== look(m)))).slice(0, 3);
        return { m, night, shape: pick(m.shapes), light: pick(m.lights), opts: shuffle([m, ...others]), answered: null };
      }) };
    }
    function quizRender() {
      const q = R("quiz");
      if (!quiz) return;
      if (quiz.i >= Qn) {
        q.innerHTML = `<div class="eyebrow">Reto terminado</div><h3>${quiz.ok} / ${Qn} aciertos</h3><p class="muted">${quiz.ok === Qn ? "Perfecto: reconoces todas las marcas." : "Repasa en el catálogo las que fallaste."}</p><div class="row"><button class="btn primary" data-a="again">Otra ronda</button><button class="btn" data-a="close">Cerrar</button></div>`;
        q.querySelector('[data-a="again"]').onclick = () => { newQuiz(); renderAll(); };
        q.querySelector('[data-a="close"]').onclick = () => { q.hidden = true; quiz = null; renderAll(); };
        return;
      }
      const it = quiz.items[quiz.i];
      const mm = { ...it.m, light: it.light };
      q.innerHTML = `<div class="row" style="justify-content:space-between"><span class="eyebrow">Reto · ${quiz.i + 1} de ${Qn}</span><span class="chip">${it.night ? "De noche: solo la luz" : "De día"}</span></div>
        <div class="quizfig">${markSVG(mm, it.shape, { night: it.night, picto: st.picto })}</div>
        <p><strong>¿Qué marca es?</strong></p>
        <div class="opts">${it.opts.map((o) => `<button class="btn" data-id="${o.id}">${o.name}</button>`).join("")}</div>
        <div data-r="qfb" aria-live="polite"></div>`;
      q.querySelectorAll(".opts .btn").forEach((b) => b.onclick = () => {
        if (it.answered) return;
        it.answered = b.dataset.id; const good = it.answered === it.m.id;
        q.querySelectorAll(".opts .btn").forEach((x) => { x.disabled = true; if (x.dataset.id === it.m.id) x.classList.add("ok"); else if (x === b) x.classList.add("bad"); });
        if (good) { quiz.ok++; ctx.award(5, "Marca identificada"); }
        q.querySelector('[data-r="qfb"]').innerHTML = `<p class="${good ? "fb-ok" : "fb-bad"}">${good ? "Correcto." : "No. Es: " + it.m.name + "."}</p>
          <p class="small">${it.night ? "Luz " + it.light.replace("MAtoN Y", "MAtoN amarilla") + ". " : it.m.tope + " " + it.m.color + " "}${it.m.pasar}</p>
          <p class="small muted">${it.m.mnemo[0]}</p><button class="btn primary sm" data-a="next" style="margin-top:.5rem">${quiz.i + 1 < Qn ? "Siguiente" : "Ver resultado"}</button>`;
        q.querySelector('[data-a="next"]').onclick = () => {
          quiz.i++;
          if (quiz.i >= Qn && quiz.ok === Qn) { ctx.award(30, "Reto del catálogo sin fallos"); ctx.toast("Catálogo dominado: 8 de 8"); }
          renderAll();
        };
        collectLamps();
      });
    }
    R("quizbtn").onclick = () => { newQuiz(); R("quiz").hidden = false; renderAll(); R("quiz").scrollIntoView({ block: "nearest" }); };

    /* ---------- Bucle de animación ---------- */
    let raf = 0, visible = true;
    function frame() {
      raf = 0;
      const t = performance.now() / 1000 - t0;
      for (const L of lamps) {
        if (!L.segs) continue;
        const c = litAt(L.segs, t + L.off);
        if (c !== L.last) {
          L.last = c;
          if (c) L.glow.setAttribute("fill", c);
          L.glow.setAttribute("opacity", c ? "1" : "0");
          L.bulb.setAttribute("fill", c || "#555");
        }
      }
      if (faro && faro.dot.isConnected) {
        const tt = performance.now() / 1000 - faro.t0, c = litAt(faro.segs, tt);
        faro.dot.style.background = c ? `radial-gradient(circle, #fff 0 18%, ${c} 40%, transparent 72%)` : "#1c252c";
        faro.dot.style.boxShadow = c ? `0 0 18px 6px ${c}` : "none";
        faro.head.setAttribute("x", ((tt % faro.tot) / faro.tot * 1000 - 1.5).toFixed(1));
      }
      if (visible) raf = requestAnimationFrame(frame);
    }
    const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible && !raf) raf = requestAnimationFrame(frame); });
    io.observe(wrap);
    renderAll();
    raf = requestAnimationFrame(frame);

    return () => { cancelAnimationFrame(raf); raf = 0; visible = false; io.disconnect(); wrap.remove(); };
  },
};
