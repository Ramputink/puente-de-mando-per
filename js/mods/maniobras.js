// Tema 7 · Maniobras — simulador cenital (hélice/timón), amarras, verbos y examen.
const ID = "maniobras";

const CSS = `
.m-maniobras{--mm-gap:.8rem}
.m-maniobras [hidden]{display:none!important}
.m-maniobras .m-maniobras__tabs{max-width:100%}
.m-maniobras .m-maniobras__stage{height:420px;touch-action:none;outline:none}
.m-maniobras .m-maniobras__stage:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.m-maniobras .m-maniobras__lab{justify-content:space-between;font-size:.9rem}
.m-maniobras .m-maniobras__lab b{font-family:var(--f-mono);font-weight:600;font-size:.85rem}
.m-maniobras .m-maniobras__ends{display:flex;justify-content:space-between;font-size:.75rem;color:var(--muted);margin-top:-.2rem}
.m-maniobras select{min-height:40px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);padding:.3em .6em;max-width:100%}
.m-maniobras .m-maniobras__fb{min-height:1.5em}
.m-maniobras ol,.m-maniobras ul{margin:.2rem 0;padding-left:1.2rem}
.m-maniobras li{margin:.15rem 0}
.m-maniobras details summary{cursor:pointer;font-weight:700}
.m-maniobras .m-maniobras__svg{background:var(--sea);border:1px solid var(--line);border-radius:var(--r)}
.m-maniobras .m-maniobras__svg text{font-family:var(--f-body);font-size:11px;fill:var(--ink)}
.m-maniobras .mm-land{fill:var(--paper);stroke:var(--muted);stroke-width:1.5}
.m-maniobras .mm-boat{fill:var(--sheet);stroke:var(--ink);stroke-width:1.5}
.m-maniobras .mm-cabin{fill:var(--sea-2);stroke:none}
.m-maniobras .mm-bol{fill:var(--ink)}
.m-maniobras .mm-buoy{fill:var(--buoy-y);stroke:var(--ink);stroke-width:1}
.m-maniobras .mm-line{stroke:var(--warn);stroke-width:3;fill:none;stroke-linecap:round;pointer-events:none}
.m-maniobras .mm-hit{stroke:transparent;stroke-width:22;fill:none;cursor:pointer;pointer-events:stroke}
.m-maniobras .mm-l.on .mm-line{stroke:var(--accent);stroke-width:5}
.m-maniobras .mm-l.ok .mm-line{stroke:var(--ok);stroke-width:5}
.m-maniobras .mm-l.bad .mm-line{stroke:var(--bad);stroke-width:5}
.m-maniobras .mm-l:focus-visible .mm-line{stroke:var(--accent)}
.m-maniobras .mm-l{outline:none}
.m-maniobras .m-maniobras__opts{display:grid;gap:.5rem}
.m-maniobras .m-maniobras__opts .btn{justify-content:flex-start;text-align:left;white-space:normal;height:auto;padding:.55em .8em;font-weight:500}
.m-maniobras .m-maniobras__opts .btn.is-ok{border-color:var(--ok);color:var(--ok);font-weight:700}
.m-maniobras .m-maniobras__opts .btn.is-bad{border-color:var(--bad);color:var(--bad)}
.m-maniobras .m-maniobras__gl{display:grid;gap:.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}
.m-maniobras .m-maniobras__gl div{background:var(--sheet);border:1px solid var(--line);border-radius:var(--r-sm);padding:.5rem .7rem;font-size:.9rem}
.m-maniobras .m-maniobras__gl b{font-family:var(--f-display);font-size:1.1rem;font-weight:600;display:block}
.m-maniobras .m-maniobras__ref{font-family:var(--f-mono);font-size:.72rem;color:var(--muted)}
`;

/* ------------------------------------------------------------------ utilidades */
const deg = (x) => (x * Math.PI) / 180;
const rad2deg = (x) => (x * 180) / Math.PI;
const norm360 = (d) => ((d % 360) + 360) % 360;
const angDiff = (a, b) => { let d = norm360(a - b); if (d > 180) d -= 360; return d; };
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const area = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const ccw = (p) => (area(p) < 0 ? [...p].reverse() : p);
// Penetración de un punto en un polígono convexo CCW → {d, n} (n = normal exterior del lado más cercano)
function penetrate(P, poly) {
  let best = Infinity, n = null;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey) || 1;
    const c = (ex * (P[1] - a[1]) - ey * (P[0] - a[0])) / L;
    if (c < 0) return null;
    if (c < best) { best = c; n = [ey / L, -ex / L]; }
  }
  return { d: best, n };
}

// Casco (coordenadas cuerpo: x hacia proa, y hacia estribor), eslora 10 m, manga 3,4 m
const LOA = 10;
const HULL = [[5, 0], [4.3, 0.95], [3.6, 1.55], [2.5, 1.68], [1.5, 1.7], [-1.5, 1.68], [-3.5, 1.64], [-5, 1.6], [-5, 0], [-5, -1.6], [-3.5, -1.64], [-1.5, -1.68], [1.5, -1.7], [2.5, -1.68], [3.6, -1.55], [4.3, -0.95]];
const toW = (b, p) => { const s = Math.sin(b.h), c = Math.cos(b.h); return [b.x + p[0] * s + p[1] * c, b.y + p[0] * c - p[1] * s]; };
const hullW = (b) => ccw(HULL.map((p) => toW(b, p)));

/* ------------------------------------------------------------------ escenarios */
const PIER_W = (x0, x1, y0, y1) => ({ kind: "land", poly: rect(x0, y0, x1, y1) });
const BOAT = (x, y, hd) => ({ kind: "boat", pose: { x, y, h: deg(hd) } });
function mirrorSc(sc) {
  const mx = ([x, y]) => [-x, y];
  const c = JSON.parse(JSON.stringify(sc));
  c.view = [-sc.view[1], -sc.view[0], sc.view[2], sc.view[3]];
  c.start.x = -sc.start.x; c.start.h = -sc.start.h;
  c.obs = sc.obs.map((o) => o.kind === "land" ? { kind: "land", poly: o.poly.map(mx) } : { kind: "boat", pose: { x: -o.pose.x, y: o.pose.y, h: -o.pose.h } });
  c.bollards = (sc.bollards || []).map(mx);
  if (c.goal.rect) c.goal.rect = [-sc.goal.rect[1], -sc.goal.rect[0], sc.goal.rect[2], sc.goal.rect[3]];
  if (c.goal.hdg != null) c.goal.hdg = norm360(-sc.goal.hdg);
  return c;
}

const SC_COSTADO_BR = {
  id: "costado-br", name: "Atraque de costado por babor", dock: true,
  view: [-6, 30, -36, 24],
  start: { x: 15, y: -28, h: deg(-22), u: 1.1 },
  obs: [PIER_W(-30, 0, -60, 60), BOAT(1.8, 14, 0), BOAT(1.8, -12, 0)],
  bollards: [[-0.6, -4], [-0.6, 6]],
  goal: { type: "berth", rect: [1.7, 2.9, -2.2, 4.2], hdg: 0, tol: 12, after: "amarras" },
  obj: "Atraca con el costado de babor en el hueco libre, paralelo al muelle y parado (< 0,6 kn), sin tocar a los vecinos.",
  steps: ["Defensas por babor; largo de proa y esprín listos.", "Aproxímate a velocidad de gobierno con unos 20–30° respecto al muelle.", "A una o dos esloras, punto muerto: la arrancada te lleva.", "Timón a estribor para abrir la proa y quedar paralelo.", "Da atrás poca para parar: con dextrógira la popa cae a babor y se pega al muelle.", "Primer cabo: largo de proa (viento de tierra) o codera de popa (viento de la mar)."],
  rec: (p) => p === "dextro" ? "Dextrógira: es el costado favorable. Al dar atrás para parar, la popa cae a babor, hacia el muelle." : p === "levo" ? "Levógira: costado desfavorable. Al dar atrás la popa caerá a estribor y se abrirá del muelle: entra más paralelo y para antes." : "Dos hélices: para parar da atrás con las dos; si la popa se abre, corrige con la de la banda contraria.",
};
const SC_COSTADO_ER = Object.assign(mirrorSc(SC_COSTADO_BR), {
  id: "costado-er", name: "Atraque de costado por estribor", dock: true,
  obj: "Atraca con el costado de estribor en el hueco libre, paralelo al muelle y parado (< 0,6 kn), sin tocar a los vecinos.",
  steps: ["Defensas por estribor; largo de proa y esprín listos.", "Aproxímate más paralelo (15–20°) y más despacio.", "Punto muerto con tiempo: necesitarás poca arrancada al final.", "Timón a babor para abrir la proa y quedar paralelo.", "Para con atrás poca y corto: con dextrógira la popa cae a babor, es decir, se SEPARA del muelle.", "Si se abre la popa, da el largo de popa / esprín de popa y cóbralo."],
  rec: (p) => p === "dextro" ? "Dextrógira: costado desfavorable. Al dar atrás la popa cae a babor, alejándose del muelle." : p === "levo" ? "Levógira: costado favorable. Al dar atrás la popa cae a estribor, hacia el muelle." : "Dos hélices: el efecto de las palas se compensa; gobierna con los motores.",
});
const QUAY_N = PIER_W(-60, 60, 0, 30);
const SC_PUNTA_POPA = {
  id: "punta-popa", name: "Atraque de punta, de popa (con muerto)", dock: true,
  view: [-22, 22, -36, 4],
  start: { x: -16, y: -19, h: deg(90), u: 0.9 },
  obs: [QUAY_N, BOAT(4.75, -5.3, 180), BOAT(-4.75, -5.3, 180), BOAT(9.5, -5.3, 180), BOAT(-9.5, -5.3, 180)],
  bollards: [[-1.2, 0.6], [1.2, 0.6]], muertos: [[0, -28], [4.75, -28], [-4.75, -28], [9.5, -28], [-9.5, -28]],
  goal: { type: "berth", rect: [-0.9, 0.9, -6.3, -4.9], hdg: 180, tol: 10, after: "muerto" },
  obj: "Entra marcha atrás en el hueco entre dos barcos, perpendicular al muelle, y coge la guía del muerto.",
  steps: ["Defensas a ambos costados y en popa; cabos de popa listos; bichero a mano.", "Pasa por delante del hueco a poca velocidad y para un poco más allá.", "Atrás poca: la popa cae a la banda de tu hélice (dextrógira → babor) y empieza a meterse.", "Con arrancada atrás el timón gobierna, pero menos: corrige con timón y golpes cortos de máquina.", "A un metro del muelle, avante poca para parar; da los cabos de popa.", "Coge la guía del muerto con el bichero, llévala a proa y tésala: hace de codera."],
  rec: (p) => p === "dextro" ? "Dextrógira: pasa con el hueco por tu babor (vas hacia el E). Al dar atrás la popa cae a babor, hacia el hueco." : p === "levo" ? "Levógira: la popa cae a estribor al dar atrás. Lo ideal sería pasar con el hueco por estribor: da la vuelta primero." : "Dos hélices: con una avante y otra atrás orientas la popa al hueco sin moverte.",
};
const SC_PUNTA_PROA = Object.assign({}, SC_PUNTA_POPA, {
  id: "punta-proa", name: "Atraque de punta, de proa (con muerto)",
  goal: { type: "berth", rect: [-0.9, 0.9, -6.3, -4.9], hdg: 0, tol: 10, after: "muerto" },
  obs: [QUAY_N, BOAT(4.75, -5.3, 0), BOAT(-4.75, -5.3, 0), BOAT(9.5, -5.3, 0), BOAT(-9.5, -5.3, 0)],
  obj: "Entra de proa en el hueco, perpendicular al muelle, para sin tocarlo y haz firme la guía del muerto por popa.",
  steps: ["Defensas a ambas bandas y en proa.", "Aproxímate a velocidad de gobierno, perpendicular al hueco.", "Punto muerto antes de entrar; corrige con timón mientras haya arrancada.", "Para con atrás poca: ¡ojo! la popa cae (dextrógira → a babor).", "Da los cabos de proa al muelle y la guía del muerto por popa.", "Para salir (clave 0472981919): largar amarras de proa, después la del muerto, y atrás poca controlando el efecto de la hélice."],
  rec: (p) => p === "levo" ? "Levógira: al dar atrás para parar, la popa cae a estribor; mete algo de timón a babor antes de parar." : p === "dextro" ? "Dextrógira: al dar atrás para parar, la popa cae a babor; entra un poco abierto hacia estribor." : "Dos hélices: para con las dos atrás a la vez, sin caída de popa.",
});
const BERTH_OUT = { start: { x: 1.8, y: 0, h: 0, u: 0 }, view: [-6, 30, -36, 36] };
const SC_SAL_TIERRA = {
  id: "salida-tierra", name: "Salida de costado con viento de tierra",
  ...BERTH_OUT, wind: { from: 270, kn: 15 },
  obs: [PIER_W(-30, 0, -60, 60), BOAT(1.8, 15.5, 0), BOAT(1.8, -14, 0)],
  bollards: [[-0.6, 8], [-0.6, -9]],
  lines: [{ id: "lproa", name: "largo de proa", pt: [4.6, -0.7], anchor: [-0.6, 8] }, { id: "lpopa", name: "largo de popa", pt: [-4.8, -1.4], anchor: [-0.6, -9] }],
  goal: { type: "exit", rect: [10, 30, 4, 36] },
  obj: "Babor al muelle, viento de tierra entrando por la amura de babor. Sal hacia proa (zona marcada) sin tocar a nadie.",
  steps: ["El viento de tierra te separa del muelle: es la salida fácil.", "Largar todo (largo de proa y largo de popa) y deja que el viento te separe un poco del muelle.", "Timón a estribor (contrario al muelle) y avante poca.", "Una vez abiertos del muelle, gobierna hacia la salida, libre del barco de proa."],
  rec: () => "Clave c1a682be35: «Largar todo, timón a estribor y poca avante. Una vez abiertos del muelle, gobernar hacia la salida».",
};
const SC_SAL_FUERA = {
  id: "salida-fuera", name: "Salida con viento de fuera (esprín de proa)",
  ...BERTH_OUT, wind: { from: 90, kn: 14 },
  obs: [PIER_W(-30, 0, -60, 60), BOAT(1.8, 14, 0), BOAT(1.8, -14, 0)],
  bollards: [[-0.6, 8], [-0.6, -2], [-0.6, -9]],
  lines: [{ id: "lproa", name: "largo de proa", pt: [4.6, -0.7], anchor: [-0.6, 8] }, { id: "esproa", name: "esprín de proa", pt: [3.4, -1.55], anchor: [-0.6, -2] }, { id: "lpopa", name: "largo de popa", pt: [-4.8, -1.4], anchor: [-0.6, -9] }],
  goal: { type: "exit", rect: [8, 30, -34, -20] },
  obj: "Babor al muelle, el viento de la mar te aprieta contra él. Abre la popa con el esprín de proa y sal marcha atrás a la zona marcada.",
  steps: ["Si largas todo y das avante, el viento te pega al muelle y la popa roza.", "Largar el largo de proa y el de popa; deja el esprín de proa firme.", "Rueda a babor (hacia el muelle) y avante poca: la proa se apoya en la defensa y la popa se abre.", "Con la popa bien abierta (40–50°): largar el esprín de proa y atrás poca.", "Ojo dextrógira: al dar atrás la popa cae a babor, hacia el muelle. En cuanto tengas arrancada atrás, timón a estribor para seguir abriendo la popa.", "Sal marcha atrás hasta estar libre a sotavento; después avante."],
  rec: () => "Clave b144a7a6ed (estribor al muelle): «avante poca, rueda a estribor y el esprín de proa firme» abre la popa. Aquí, babor al muelle: rueda a babor.",
};
const SC_CIABOGA = {
  id: "ciaboga", name: "Ciaboga en canal estrecho",
  view: [-14, 14, -32, 22], start: { x: 0, y: -16, h: 0, u: 0.9 },
  obs: [PIER_W(-40, -9, -80, 80), PIER_W(9, 40, -80, 80)],
  goal: { type: "turn", hdg: 180, tol: 15 },
  obj: "Da la vuelta (rumbo opuesto) en un canal de menos de dos esloras de ancho, sin tocar las orillas.",
  steps: ["Dextrógira: timón todo a estribor y avante poca/media; la proa cae a estribor.", "Antes de coger arrancada, máquina atrás (sin tocar el timón): la presión lateral lleva la popa a babor → la proa sigue cayendo a estribor.", "Cuando el barco se pare, otra vez avante. Alterna hasta completar el giro.", "Con dos hélices: una avante y otra atrás (atrás la de la banda a la que quieres caer): gira sobre sí mismo."],
  rec: (p) => p === "dextro" ? "Dextrógira: ciaboga por estribor (clave c9283be8c3)." : p === "levo" ? "Levógira: ciaboga por babor (timón a babor), es la banda que favorece la hélice." : "Dos hélices: Br avante + Er atrás → caes a estribor girando casi sobre ti mismo.",
};
const SC_BOYA = {
  id: "boya", name: "Amarre a una boya",
  view: [-24, 24, -30, 24], start: { x: -8, y: -24, h: deg(35), u: 1.1 }, wind: { from: 0, kn: 10 },
  obs: [BOAT(-15, 11, 0), BOAT(15, 13, 0)],
  buoys: [[0, 8], [-15, 17.5], [15, 19.5]], buoyObs: [0, 8],
  goal: { type: "buoy", at: [0, 8], hdg: 0, tol: 35 },
  obj: "Llega a la boya proa al viento, con la boya en la proa y casi parado, para cogerla con el bichero.",
  steps: ["Mira de dónde viene el viento (banderas, barcos ya aproados).", "Gira para quedar proa (o casi proa) a la boya y al viento.", "Acércate a la mínima velocidad de gobierno.", "Con la boya en la proa, atrás para parar la arrancada.", "Cógela con el bichero y amarra (mejor por seno, para largar desde a bordo)."],
  rec: () => "Claves c92b889c4d, b2e7996cd8 y 71f69d5738: proa (o casi proa) a la boya y al viento, mínima velocidad, parar con atrás y bichero.",
};
const SC_LIBRE = {
  id: "libre", name: "Agua libre (experimentos)",
  view: [-30, 30, -36, 30], start: { x: 0, y: -18, h: 0, u: 0 },
  obs: [PIER_W(12, 22, -6, 26)],
  goal: { type: "none" },
  obj: "Prueba los efectos de la hélice y del timón. Las estelas muestran por dónde pasan proa (fina) y popa (discontinua).",
  steps: ["Parado y timón a la vía, da atrás: ¿a qué banda cae la popa? (presión lateral de las palas).", "Avante con timón a una banda: la popa barre hacia la banda contraria (rabeo) y el punto giratorio queda a 1/3 de la proa.", "Con arrancada avante, máquina atrás: el timón pierde eficacia y manda la hélice.", "Cambia a caña: la proa cae al lado contrario de la caña.", "Dos hélices: una avante y otra atrás → giro casi sobre sí mismo."],
  rec: (p) => p === "dextro" ? "Dextrógira (gira a derechas vista desde popa, avante): avante popa a Er (leve); atrás popa a Br (marcado)." : p === "levo" ? "Levógira: justo al revés: avante popa a Br; atrás popa a Er." : "Dos hélices de giro exterior: sus efectos laterales se anulan cuando trabajan igual.",
};
const SCENARIOS = [SC_LIBRE, SC_COSTADO_BR, SC_COSTADO_ER, SC_PUNTA_POPA, SC_PUNTA_PROA, SC_SAL_TIERRA, SC_SAL_FUERA, SC_CIABOGA, SC_BOYA];

/* ------------------------------------------------------------------ amarras */
const LINES = {
  "largo-proa": { n: "Largo de proa", d: "Sale de la proa (amura) y llama hacia proa, a un noray por delante del barco.", f: "Sujeta la proa e impide que el barco caiga hacia atrás.", v: "Virado: atraca la proa e imprime movimiento avante.", u: "Primer cabo con viento o corriente de tierra (apuntes 7.1.5)." },
  "traves-proa": { n: "Través de proa", d: "Sale de la proa perpendicular a la crujía, directo al muelle.", f: "Mantiene la proa pegada al muelle, sin efecto avante/atrás.", v: "Virado: atraca la proa de través.", u: "Barcos pequeños o atraques cortos; no sujeta avante ni atrás." },
  "esprin-proa": { n: "Esprín de proa", d: "Sale de la proa y llama en diagonal hacia popa, a un noray más a popa.", f: "Impide que el barco vaya hacia avante.", v: "Virado: atraca la proa y desplaza el barco hacia atrás (desatraca la popa).", u: "Para que la roda no toque al de delante (7ba9fe0da0). Para abrir la popa al salir: avante poca, rueda hacia el muelle y esprín de proa firme (b144a7a6ed)." },
  "esprin-popa": { n: "Esprín de popa", d: "Sale de la popa y llama en diagonal hacia proa, a un noray más a proa.", f: "Impide que el barco vaya hacia atrás.", v: "Virado: atraca la popa y desplaza el barco hacia avante.", u: "Para que la popa (o el fueraborda) no toque al de detrás (b0e49f2204). Para abrir la proa al salir: atrás poca con el esprín de popa firme (0fb38e3aa0)." },
  "traves-popa": { n: "Través de popa", d: "Sale de la popa perpendicular a la crujía, directo al muelle.", f: "Mantiene la popa pegada al muelle.", v: "Virado: atraca la popa de través.", u: "Complementa a los largos; no sujeta avante ni atrás." },
  "largo-popa": { n: "Largo de popa", d: "Sale de la popa (aleta) y llama hacia popa, a un noray por detrás del barco.", f: "Sujeta la popa e impide que el barco vaya hacia avante.", v: "Virado: atraca la popa e imprime movimiento hacia atrás.", u: "Junto al largo de proa, son las amarras principales (suelen ser las más gruesas)." },
  "codera": { n: "Codera", d: "Cabo dado desde el costado contrario al muelle a una boya, muerto u otro muelle, a cierta distancia.", f: "Aguanta el barco separado del muelle cuando el viento o la corriente vienen de la mar.", v: "Virada: separa el barco del muelle.", u: "Con viento o corriente de la mar, el primer cabo es la codera de popa (apuntes). En el atraque de punta, la guía del muerto hace de codera (ea4962574d)." },
};
const LINE_GEO = {
  "largo-proa": "M70 92 L18 58", "traves-proa": "M95 78 L95 58", "esprin-proa": "M88 79 L178 58",
  "esprin-popa": "M268 79 L200 58", "traves-popa": "M262 78 L262 58", "largo-popa": "M290 92 L384 58",
  "codera": "M285 114 Q 330 170 360 222",
};
const LINE_TASKS = [
  { q: "Estribor al muelle. ¿De qué cabo cobras para que la roda no toque al barco de delante?", a: ["esprin-proa"], why: "El esprín de proa, al cobrarlo, atraca la proa y desplaza el barco hacia atrás.", k: "7ba9fe0da0" },
  { q: "¿De qué cabo cobras para que la popa no toque al barco que está a popa del tuyo?", a: ["esprin-popa"], why: "El esprín de popa atraca la popa y mueve el barco hacia avante.", k: "b0e49f2204" },
  { q: "El viento viene de la mar y el costado golpea contra el muelle. ¿Qué cabo lo evita?", a: ["codera"], why: "La codera, dada por el costado de fuera, aguanta el barco separado del muelle.", k: "ea4962574d" },
  { q: "Atracando, quieres acolchar la proa al muelle y mover el barco hacia popa.", a: ["esprin-proa"], why: "Esprín de proa: atraca la proa e imprime movimiento atrás.", k: "78bf74ced6" },
  { q: "Viento atracante: para abrir la proa al salir das atrás poca con un cabo firme. ¿Cuál?", a: ["esprin-popa"], why: "Con el esprín de popa firme y atrás poca, la popa pivota sobre la defensa y la proa se abre.", k: "0fb38e3aa0" },
  { q: "Viento de la mar: para abrir la popa al salir das avante poca y rueda hacia el muelle con un cabo firme. ¿Cuál?", a: ["esprin-proa"], why: "Con el esprín de proa firme, la proa se apoya y la popa se abre.", k: "b144a7a6ed" },
  { q: "Llegas al muelle con viento de tierra. ¿Qué cabo das primero?", a: ["largo-proa"], why: "Con viento o corriente de tierra el primer cabo es el largo de proa; luego se cobra para acercar el barco.", k: "apuntes 7.1.5" },
  { q: "¿Qué cabo, virado, atraca la popa y mueve el barco hacia atrás?", a: ["largo-popa"], why: "El largo de popa llama hacia popa: al virarlo atraca la popa y el barco va hacia atrás.", k: "apuntes 7.1.4" },
  { q: "¿Qué cabo mantiene el costado pegado al muelle sin desplazar el barco avante ni atrás?", a: ["traves-proa", "traves-popa"], why: "Los traveses llaman perpendiculares a la crujía: atracan de través.", k: "apuntes 7.1.4" },
];

/* ------------------------------------------------------------------ verbos */
const VERBS = [
  ["Cobrar", "Tirar de un cabo, cable o cadena para recogerlo a mano."],
  ["Virar", "Cobrar un cabo o cadena por medios mecánicos (molinete, chigre, cabrestante)."],
  ["Tesar", "Poner tirantes cabos, cadenas, velas, toldos y cosas semejantes."],
  ["Templar", "Tensar un cabo hasta que quede sin seno; equilibrar la tensión entre varios cabos."],
  ["Amollar", "Aflojar gradualmente un cabo que trabaja, soltándolo poco a poco (lo contrario de cazar)."],
  ["Lascar", "Aflojar un poco un cabo cuando está tenso."],
  ["Arriar", "Aflojar y dejar correr un cabo; bajar una vela o la bandera."],
  ["Largar", "Soltar del todo un cabo, p. ej. las amarras al salir."],
  ["Encapillar", "Meter la gaza de un cabo en una bita, noray o cornamusa."],
  ["Tomar vueltas", "Dar vueltas en forma de ocho a un cabo en una bita o cornamusa."],
  ["Hacer firme", "Asegurar un cabo para que no se mueva ni corra (con vueltas, gaza o nudo)."],
  ["Adujar", "Recoger un cabo en vueltas circulares u oblongas (adujas) para que no se enrede ni estorbe."],
  ["Aclarar", "Deshacer cocas y enredos de un cabo o cadena para que corra libre."],
  ["Amarrar por seno", "Pasar el cabo por la argolla o noray de tierra y devolver el chicote a bordo, para poder largar desde cubierta."],
];
const VERB_REF = { "Virar": "9ac045d9e2", "Tesar": "b5b0372d5a", "Templar": "693785d39b · d9892c4e42", "Amollar": "59960ee2ad · f063d81b7e", "Lascar": "4138e20535", "Tomar vueltas": "95fd9b275c", "Adujar": "af04a1cc68 · d4f48819b6 · 372db7ae22", "Amarrar por seno": "60097a3219 · 02330918c1 · 9904e3918f" };
const CONFUSABLE = [["Amollar", "Lascar"]];

/* ------------------------------------------------------------------ examen (q_man.txt) */
const EXAM = [
  ["a27c6568bc", "Hélice dextrógira, sin arrancada, timón a la vía, sin viento. Damos máquina atrás:", ["La popa caerá a babor.", "La proa caerá a babor.", "La popa caerá a estribor.", "La popa no tendrá caída perceptible."], 0, "Con dextrógira, atrás → la presión lateral de las palas (y la corriente de expulsión sobre la bovedilla de Er) llevan la popa a babor."],
  ["f3a8f9efb3", "Hélice dextrógira con máquina avante, ¿qué efecto produce la presión lateral de las palas?", ["Tiende a llevar la popa a estribor.", "Tiende a llevar la popa a babor.", "Tiende a llevar la proa a estribor.", "No produce ningún efecto."], 0, "Avante, la dextrógira tiende a llevar la popa a estribor (y la proa a babor); es leve con arrancada."],
  ["fd2811cc5a", "Dextrógira, timón a la vía, arrancada avante y máquina atrás:", ["Popa a babor y proa a estribor.", "Popa a estribor y proa a babor.", "Indiferente.", "No habrá movimiento transversal."], 0, "Máquina atrás con dextrógira: la popa cae a babor aunque aún haya arrancada avante."],
  ["77500eaf0b", "Una hélice, arrancada y máquina avante, metemos el timón a babor. Inicialmente:", ["La proa va a babor y la popa a estribor.", "La proa va a estribor y la popa a babor.", "Todo el barco se desplaza a estribor.", "Todo el barco se desplaza a babor."], 0, "Timón a babor → proa a babor. El barco gira alrededor del punto giratorio: la popa barre hacia estribor."],
  ["454876adab", "Con arrancada avante, meter el timón a una banda causa, en general:", ["Pérdida de velocidad, desplazamiento lateral a la banda contraria y escora a la banda de metida.", "Aumento de velocidad y desplazamiento a la banda de metida.", "Aumento de velocidad, desplazamiento a la contraria y escora a la de metida.", "Pérdida de velocidad, desplazamiento y escora a la banda contraria."], 0, "La pala frena; la fuerza del timón empuja la popa (y al principio el barco) a la banda contraria; la escora inicial va a la banda de metida."],
  ["b40dee920d", "Las tres fases de la curva de evolución en marcha avante son:", ["Fase de maniobra, fase variable y fase uniforme.", "Fase de deriva, fase variable y fase alterna.", "Fase de maniobra, de abatimiento y alterna.", "Fase de deriva, de abatimiento y uniforme."], 0, "Maniobra (se mete el timón hasta el ángulo), variable (radio decreciente) y uniforme (radio constante)."],
  ["6ee9657d52", "En la curva de evolución, la fase de maniobra:", ["Se inicia al meter el timón a la banda y termina al alcanzar el ángulo deseado.", "Consiste en hacer girar la embarcación sobre sí misma.", "Es el periodo final, con caída de velocidad superior al 50 %.", "Es el movimiento uniforme de caída una vez equilibradas las fuerzas."], 0, "La fase de maniobra dura lo que tarda la pala en llegar al ángulo pedido."],
  ["ae47219b38", "¿Qué implica «rabear»?", ["Al girar, el radio de la trayectoria de la popa es algo mayor que el del punto giratorio.", "Al girar, el radio de la popa es algo menor que el del punto giratorio.", "Sin girar, la proa hace movimientos excesivos a ambas bandas.", "Sin girar, la proa hace movimientos mínimos."], 0, "La popa barre hacia fuera: describe un círculo mayor que el punto giratorio (a 1/3 de la proa avante). ¡Cuidado al salir de un muelle!"],
  ["c9283be8c3", "Ciaboga en un canal angosto con hélice dextrógira:", ["Avante con timón a estribor; la proa cae a estribor; luego atrás para parar; alternar hasta completar el giro.", "Avante con timón a babor, caer a babor y alternar con atrás.", "Dejar caer la proa a estribor con muy poca máquina avante hasta la vuelta completa.", "No se hace: solo en espacios amplios."], 0, "Atrás con dextrógira la popa cae a babor → la proa sigue cayendo a estribor. Ambas fases suman."],
  ["bc4472b74f", "Ciaboga por babor con viento de estribor, ¿cómo afecta?", ["Facilita la maniobra.", "Dificulta la maniobra.", "Es indiferente.", "Solo afecta a veleros y mercantes."], 0, "El viento de estribor empuja la proa hacia babor: ayuda a caer a babor."],
  ["9e0bcae97f", "Amarrados solo con el esprín de proa, si viramos el cabo:", ["Atraca la proa, desplaza el barco hacia atrás y desatraca la popa.", "Atraca la proa sin movimiento avante ni atrás.", "Atraca la popa, desplaza avante y desatraca la proa.", "Atraca la proa, desplaza avante y desatraca la popa."], 0, "El esprín de proa llama hacia popa: al virarlo la proa se pega y el barco va atrás."],
  ["b144a7a6ed", "Estribor al muelle, viento por babor; para salir hay que abrir la popa:", ["Avante poca, rueda a estribor y esprín de proa firme.", "Atrás poca, rueda a babor y esprín de popa firme.", "Sin máquina, lascando el largo de popa.", "Avante poca, rueda a estribor y largo de popa firme."], 0, "La rueda hacia el muelle lanza la corriente de expulsión contra la pala y empuja la popa hacia fuera; el esprín de proa impide ir avante."],
  ["0fb38e3aa0", "Estribor al muelle, viento atracante; para salir hay que abrir la proa:", ["Atrás poca con el esprín de popa firme.", "Avante poca, rueda a estribor y esprín de proa firme.", "Lascando poco a poco el largo de popa.", "Avante poca, rueda a estribor y largo de popa firme."], 0, "El esprín de popa impide ir atrás: la popa se apoya y la proa se abre."],
  ["c1a682be35", "Babor al muelle, viento de tierra por la amura de babor. Para salir:", ["Largar todo, timón a estribor y poca avante; abiertos, gobernar a la salida.", "Largar todo menos el largo de proa, timón a babor y poca atrás.", "Largar todo menos el esprín de proa, timón a estribor y poca avante.", "Largar todo, timón a babor y poca avante."], 0, "El viento de tierra ya separa el barco; timón al lado contrario del muelle."],
  ["0472981919", "Atracados de punta por proa, para salir:", ["Largar amarras de proa, después la del muerto, y atrás poca controlando el efecto de la hélice.", "Largar amarras de proa y atrás toda mientras largamos la del muerto.", "Atrás poca largando todo menos el esprín de proa.", "Largar amarras de popa y avante poca."], 0, "Primero proa, luego muerto (para no liarlo en la hélice) y atrás poca, contando con la caída de la popa."],
  ["ea4962574d", "Atracados, el viento o la corriente vienen del costado de la mar y golpeamos el muelle. ¿Qué cabos?", ["Coderas.", "Esprines.", "Traveses.", "Largos."], 0, "Las coderas trabajan desde el costado de fuera y aguantan el barco separado."],
  ["9904e3918f", "Dejamos solo los largos de proa y popa amarrados a la bita por seno. Conseguimos:", ["Poder largar cómodamente desde el barco.", "Que el barco quede más seguro.", "Necesitar codera de popa para salir.", "Dificultar el desamarre."], 0, "Por seno, el cabo va y vuelve a bordo: se larga desde cubierta soltando un chicote."],
  ["23f5bfd03b", "¿En qué momento podemos perder la capacidad de gobierno?", ["Al perder arrancada.", "Al dar atrás con arrancada avante.", "Al meter todo el timón a una banda.", "Al poner el piloto automático."], 0, "Sin flujo de agua por la pala, el timón no gobierna."],
  ["e649f79999", "Velocidad de gobierno es:", ["La velocidad mínima para que el timón sea eficaz y el barco mantenga el rumbo.", "La velocidad sin considerar viento ni corriente.", "La mínima que marca la corredera.", "La del motor al ralentí."], 0, "Por debajo de ella el barco no obedece al timón."],
  ["72171c68e6", "Un barco con una estructura muy alta solo a popa tenderá a:", ["Aproarse al viento.", "Alejar la proa del viento.", "Quedarse estático.", "Cruzarse al viento."], 0, "El viento empuja más la popa, que cae a sotavento: la proa queda al viento (como una veleta)."],
  ["cba536a08d", "Entrando en puerto con fuerte corriente de marea:", ["Maniobrar proa a la corriente para mantener el gobierno.", "Corriente por el través.", "Corriente por el través si la velocidad de gobierno es mayor.", "Popa a la corriente."], 0, "Proa al elemento más fuerte: así hay flujo por la pala a poca velocidad sobre el fondo."],
  ["c92b889c4d", "Amarre a una boya en ausencia de corriente:", ["Gobernar proa o casi proa a la boya y al viento.", "Aproximarse con el viento por popa.", "Mantener la máxima velocidad.", "Aproximarse por su sotavento para que el viento nos abata sobre ella."], 0, "Proa al viento: se controla la velocidad y se para con facilidad."],
  ["4559b42dc6", "«Libre a sotavento» significa:", ["Tener resguardo suficiente con la costa o escollos cuando viento, mar o corriente nos echan sobre el peligro.", "Girar en el menor espacio posible.", "Navegar a barlovento al socaire.", "No tener resguardo navegando a sotavento de otro."], 0, "Hacia donde te lleva el viento debe haber espacio libre."],
  ["ef4ff0f416", "«Timón a la vía» significa:", ["Que el plano del timón coincide con el plano de crujía.", "Todo a estribor.", "Todo a babor.", "Trincar el timón."], 0, "Pala alineada con la crujía: sin efecto de giro."],
  ["56131660b2", "La presión lateral de las palas, con el barco parado, se debe principalmente a:", ["La diferencia de presión entre las palas.", "La diferencia de presión entre las caras de una pala.", "Al tipo de hélice.", "Al sentido del movimiento."], 0, "Las palas de abajo trabajan en agua más densa/a más presión que las de arriba: resulta una fuerza lateral."],
];

/* ================================================================== módulo */
export default {
  id: ID,
  tema: 7,
  title: "Simulador de maniobras",
  icon: "⟲",
  desc: "Hélice, timón y amarras: atraca, desatraca y ciaboga en un puerto cenital, y practica el vocabulario de maniobra.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = CSS; document.head.appendChild(s);
    }
    const cleanups = [];
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const done = ctx.store.get("done", {});

    el.innerHTML = `
<div class="m-maniobras stack">
  <div class="seg m-maniobras__tabs" role="tablist" data-tabs>
    <button aria-pressed="true" data-t="sim">Simulador</button><button aria-pressed="false" data-t="amarras">Amarras</button><button aria-pressed="false" data-t="verbos">Verbos</button><button aria-pressed="false" data-t="examen">Examen</button>
  </div>

  <section data-p="sim" class="stack">
    <label class="row small"><span class="eyebrow">Escenario</span>
      <select data-sc>${SCENARIOS.map((s, i) => `<option value="${i}">${s.name}</option>`).join("")}</select>
      <select data-wind hidden aria-label="Viento"><option value="">Sin viento</option><option value="0">Viento N 12 kn</option><option value="90">Viento E 12 kn</option><option value="180">Viento S 12 kn</option><option value="270">Viento W 12 kn</option></select>
    </label>
    <div class="stage m-maniobras__stage" data-stage tabindex="0" aria-label="Simulador cenital. Con el foco: flechas arriba/abajo máquina, izquierda/derecha timón, espacio para parar."><canvas></canvas></div>
    <div class="panel stack">
      <div class="row"><span class="eyebrow">Propulsión</span>
        <div class="seg" data-prop><button data-v="dextro" aria-pressed="true">Dextrógira</button><button data-v="levo" aria-pressed="false">Levógira</button><button data-v="twin" aria-pressed="false">Dos hélices</button></div>
        <span class="eyebrow">Gobierno</span>
        <div class="seg" data-gov><button data-v="rueda" aria-pressed="true">Rueda</button><button data-v="cana" aria-pressed="false">Caña</button></div>
      </div>
      <div data-single class="stack" style="gap:.3rem">
        <div class="row m-maniobras__lab"><span>Máquina</span><b data-thr-t></b></div>
        <input type="range" min="-1" max="1" step="0.05" value="0" data-thr aria-label="Máquina">
        <div class="m-maniobras__ends"><span>Atrás toda</span><span>Parada</span><span>Avante toda</span></div>
        <div class="row"><button class="btn sm" data-q="-0.5">Atrás media</button><button class="btn sm" data-q="-0.25">Atrás poca</button><button class="btn sm" data-q="0">Stop</button><button class="btn sm" data-q="0.25">Avante poca</button><button class="btn sm" data-q="0.5">Avante media</button></div>
      </div>
      <div data-twin class="stack" style="gap:.3rem" hidden>
        <div class="row m-maniobras__lab"><span>Motor de babor</span><b data-tp-t></b></div>
        <input type="range" min="-1" max="1" step="0.05" value="0" data-tp aria-label="Motor de babor">
        <div class="row m-maniobras__lab"><span>Motor de estribor</span><b data-ts-t></b></div>
        <input type="range" min="-1" max="1" step="0.05" value="0" data-ts aria-label="Motor de estribor">
        <div class="row"><button class="btn sm" data-tw="br">Br atrás · Er avante</button><button class="btn sm" data-tw="0">Stop</button><button class="btn sm" data-tw="er">Br avante · Er atrás</button><button class="btn sm" data-tw="av">Ambos avante poca</button><button class="btn sm" data-tw="at">Ambos atrás poca</button></div>
      </div>
      <div class="stack" style="gap:.3rem">
        <div class="row m-maniobras__lab"><span data-rud-l>Rueda</span><b data-rud-t></b></div>
        <input type="range" min="-35" max="35" step="1" value="0" data-rud aria-label="Rueda o caña">
        <div class="m-maniobras__ends"><span>◄ a babor</span><span>a estribor ►</span></div>
        <div class="row"><button class="btn sm" data-r="-35">Todo a Br</button><button class="btn sm" data-r="0">A la vía</button><button class="btn sm" data-r="35">Todo a Er</button></div>
        <p class="small muted" data-rud-x></p>
      </div>
      <div class="row" data-lines></div>
      <div class="row"><button class="btn sm" data-reset>Reiniciar</button><button class="btn sm" data-pause>Pausa</button><button class="btn sm" data-speed aria-pressed="false">Tiempo ×2</button><span class="chip" data-golpes>Golpes: 0</span></div>
    </div>
    <div class="grid">
      <div class="tint stack" data-info></div>
      <details class="panel">
        <summary>Teoría rápida: hélice y timón</summary>
        <div class="stack small" style="margin-top:.6rem">
          <div class="scroll-x"><table>
            <thead><tr><th>Máquina</th><th>Dextrógira</th><th>Levógira</th></tr></thead>
            <tbody>
              <tr><td>Avante (parado o poca arrancada)</td><td>popa a Er, proa a Br (leve)</td><td>popa a Br, proa a Er</td></tr>
              <tr><td>Atrás (parado, o con arrancada avante)</td><td><b>popa a Br</b>, proa a Er (marcado)</td><td><b>popa a Er</b>, proa a Br</td></tr>
            </tbody></table></div>
          <ul>
            <li><b>Presión lateral de las palas</b>: diferencia de presión entre las palas de abajo y las de arriba. Se nota con el barco parado o dando atrás; con buena arrancada avante es casi inapreciable.</li>
            <li><b>Corriente de expulsión</b>: avante, el chorro de la hélice incide sobre la pala del timón y la hace muy eficaz incluso sin arrancada (golpe de máquina con timón metido). Atrás (dextrógira) incide sobre la bovedilla de Er: popa a Br.</li>
            <li><b>Timón / rueda</b>: la proa cae a la banda a la que se mete el timón o se gira la rueda. <b>Caña</b>: la proa cae al lado contrario de la caña.</li>
            <li>Al meter timón: pérdida de velocidad, desplazamiento lateral a la banda contraria, escora inicial a la banda de metida.</li>
            <li><b>Punto giratorio</b>: a ~1/3 de la eslora desde proa avante, ~1/3 desde popa atrás. La popa barre hacia fuera: <b>rabeo</b>.</li>
            <li><b>Curva de evolución</b>: fase de maniobra → variable → uniforme.</li>
            <li><b>Eficacia del timón</b>: arrancada y máquina en el mismo sentido → aumenta; en sentido contrario → disminuye. Sin arrancada no hay gobierno (salvo con el chorro avante).</li>
            <li><b>Dos hélices</b> (giro exterior): una avante y otra atrás → giro sobre sí mismo; atrás la de la banda a la que se quiere caer.</li>
          </ul>
        </div>
      </details>
    </div>
  </section>

  <section data-p="amarras" class="stack" hidden>
    <p class="small muted">Barco atracado por estribor (proa a la izquierda). Toca un cabo para ver qué hace.</p>
    <svg class="m-maniobras__svg" viewBox="0 0 400 260" role="img" aria-label="Diagrama de amarras" data-svg></svg>
    <div class="grid">
      <div class="tint stack" data-linfo><p class="muted">Toca un cabo del dibujo.</p></div>
      <div class="panel stack">
        <div class="row" style="justify-content:space-between"><h4>Reto: toca el cabo correcto</h4><span class="chip" data-lscore></span></div>
        <p data-lq></p><p class="small m-maniobras__fb" data-lfb aria-live="polite"></p>
        <div class="row"><button class="btn sm" data-lnext>Siguiente</button></div>
      </div>
    </div>
    <p class="small muted"><b>Amarrar por seno</b>: el cabo sale de a bordo, pasa por la argolla o noray y vuelve a bordo; para salir basta soltar un chicote y cobrar desde cubierta (60097a3219, 02330918c1). <b>Tomar vueltas</b>: vueltas en ocho sobre bita o cornamusa (95fd9b275c).</p>
  </section>

  <section data-p="verbos" class="stack" hidden>
    <div class="m-maniobras__gl" data-gl></div>
    <div class="panel stack" data-vq></div>
  </section>

  <section data-p="examen" class="stack" hidden>
    <p class="small muted">Preguntas oficiales del bloque Maniobras (q_man), con la clave oficial. Las opciones se barajan.</p>
    <div class="panel stack" data-eq></div>
  </section>
</div>`;
    const root = el.firstElementChild;
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
    const setSeg = (seg, v) => seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v || b.dataset.t === v)));

    /* ---------------- tabs */
    let tab = "sim";
    on($("[data-tabs]"), "click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      tab = b.dataset.t; setSeg($("[data-tabs]"), tab);
      $$("section[data-p]").forEach((s) => (s.hidden = s.dataset.p !== tab));
      if (tab === "sim") { resize(); kick(); }
    });

    /* ================= SIMULADOR ================= */
    const stage = $("[data-stage]"), cv = stage.querySelector("canvas"), g = cv.getContext("2d");
    let W = 300, H = 300, dpr = 1;
    let col = {};
    const readCols = () => { const cs = getComputedStyle(document.documentElement); for (const k of ["sea", "sea-2", "sheet", "ink", "muted", "line", "accent", "warn", "ok", "bad", "port", "stbd", "paper", "buoy-y"]) col[k] = cs.getPropertyValue("--" + k).trim() || "#888"; };
    readCols();
    cleanups.push(ctx.onTheme(() => { readCols(); draw(); }));

    const st = {
      sci: 0, sc: null, prop: "dextro", gov: "rueda", t: 0, tP: 0, tS: 0, delta: 0, rudS: 0,
      b: null, obs: [], lines: [], trails: [], golpes: 0, status: "run", hold: 0, paused: false, mult: 1,
      contacts: new Set(), lastGolpe: -9, time: 0, trailT: 0, windSel: "", warned: false,
    };

    function loadScenario(i) {
      st.sci = i; const sc = SCENARIOS[i]; st.sc = sc;
      st.b = { x: sc.start.x, y: sc.start.y, h: sc.start.h, u: sc.start.u || 0, v: 0, r: 0 };
      st.obs = sc.obs.map((o) => o.kind === "land" ? { kind: "land", poly: ccw(o.poly) } : { kind: "boat", pose: o.pose, poly: hullW(o.pose) });
      if (sc.buoyObs) { const [bx, by] = sc.buoyObs; const p = []; for (let k = 0; k < 8; k++) p.push([bx + 0.6 * Math.cos((k * Math.PI) / 4), by + 0.6 * Math.sin((k * Math.PI) / 4)]); st.obs.push({ kind: "buoy", poly: ccw(p) }); }
      st.lines = (sc.lines || []).map((l) => { const P = toW(st.b, l.pt); return { ...l, len: Math.hypot(P[0] - l.anchor[0], P[1] - l.anchor[1]) + 0.05, on: true, tension: 0 }; });
      st.t = st.tP = st.tS = 0; st.delta = 0; st.rudS = 0;
      st.trails = []; st.golpes = 0; st.status = "run"; st.hold = 0; st.contacts = new Set(); st.lastGolpe = -9; st.time = 0; st.warned = false;
      $("[data-wind]").hidden = sc.id !== "libre";
      syncControls(); renderInfo(); renderLines(); updGolpes(); resize(); kick();
    }
    const windOf = () => st.sc.id === "libre" ? (st.windSel === "" ? null : { from: +st.windSel, kn: 12 }) : st.sc.wind || null;

    /* ---------- controles */
    const thrTxt = (t) => { const a = Math.abs(t); if (a < 0.02) return "Parada"; const w = a <= 0.3 ? "poca" : a <= 0.6 ? "media" : a < 0.95 ? "avante" : "toda"; return (t > 0 ? "Avante " : "Atrás ") + (w === "avante" ? "" : w + " ") + `(${Math.round(a * 100)} %)`; };
    function syncControls() {
      $("[data-thr]").value = st.t; $("[data-tp]").value = st.tP; $("[data-ts]").value = st.tS; $("[data-rud]").value = st.rudS;
      $("[data-thr-t]").textContent = thrTxt(st.t); $("[data-tp-t]").textContent = thrTxt(st.tP); $("[data-ts-t]").textContent = thrTxt(st.tS);
      $("[data-single]").hidden = st.prop === "twin"; $("[data-twin]").hidden = st.prop !== "twin";
      setSeg($("[data-prop]"), st.prop); setSeg($("[data-gov]"), st.gov);
      const s = st.rudS, a = Math.abs(s), side = s > 0 ? "estribor" : "babor";
      const pala = st.gov === "rueda" ? s : -s; const pside = pala > 0 ? "estribor" : "babor";
      $("[data-rud-l]").textContent = st.gov === "rueda" ? "Rueda" : "Caña";
      $("[data-rud-t]").textContent = a < 1 ? "A la vía" : `${a}° a ${side}`;
      $("[data-rud-x]").textContent = a < 1 ? "Timón a la vía: la pala coincide con el plano de crujía." :
        st.gov === "rueda" ? `Rueda a ${side} → pala a ${pside} → la proa cae a ${pside} (como un coche).` :
        `Caña a ${side} → pala a ${pside} → la proa cae a ${pside} (al lado contrario de la caña).`;
      st.delta = deg(pala);
    }
    on($("[data-thr]"), "input", (e) => { st.t = +e.target.value; syncControls(); kick(); });
    on($("[data-tp]"), "input", (e) => { st.tP = +e.target.value; syncControls(); kick(); });
    on($("[data-ts]"), "input", (e) => { st.tS = +e.target.value; syncControls(); kick(); });
    on($("[data-rud]"), "input", (e) => { st.rudS = +e.target.value; syncControls(); kick(); });
    on(root, "click", (e) => {
      const q = e.target.closest("[data-q]"); if (q) { st.t = +q.dataset.q; syncControls(); kick(); }
      const r = e.target.closest("[data-r]"); if (r) { st.rudS = st.gov === "rueda" ? +r.dataset.r : -r.dataset.r; syncControls(); kick(); }
      const tw = e.target.closest("[data-tw]"); if (tw) { const v = tw.dataset.tw; [st.tP, st.tS] = v === "br" ? [-0.5, 0.5] : v === "er" ? [0.5, -0.5] : v === "av" ? [0.25, 0.25] : v === "at" ? [-0.25, -0.25] : [0, 0]; syncControls(); kick(); }
    });
    on($("[data-prop]"), "click", (e) => { const b = e.target.closest("button"); if (!b) return; st.prop = b.dataset.v; st.t = st.tP = st.tS = 0; syncControls(); renderInfo(); kick(); });
    on($("[data-gov]"), "click", (e) => { const b = e.target.closest("button"); if (!b || b.dataset.v === st.gov) return; st.gov = b.dataset.v; st.rudS = -st.rudS; syncControls(); });
    on($("[data-sc]"), "change", (e) => loadScenario(+e.target.value));
    on($("[data-wind]"), "change", (e) => { st.windSel = e.target.value; kick(); });
    on($("[data-reset]"), "click", () => loadScenario(st.sci));
    on($("[data-pause]"), "click", (e) => { st.paused = !st.paused; e.target.textContent = st.paused ? "Seguir" : "Pausa"; kick(); });
    on($("[data-speed]"), "click", (e) => { st.mult = st.mult === 1 ? 2 : 1; e.target.setAttribute("aria-pressed", String(st.mult === 2)); });
    on(stage, "pointerdown", () => stage.focus({ preventScroll: true }));
    on(stage, "keydown", (e) => {
      const k = e.key; let used = true;
      if (k === "ArrowUp" || k === "ArrowDown") { const d = k === "ArrowUp" ? 0.05 : -0.05; if (st.prop === "twin") { st.tP = Math.max(-1, Math.min(1, st.tP + d)); st.tS = Math.max(-1, Math.min(1, st.tS + d)); } else st.t = Math.max(-1, Math.min(1, +(st.t + d).toFixed(2))); }
      else if (k === "ArrowLeft" || k === "ArrowRight") st.rudS = Math.max(-35, Math.min(35, st.rudS + (k === "ArrowRight" ? 5 : -5)));
      else if (k === " ") { st.t = st.tP = st.tS = 0; }
      else if (k === "v" || k === "V") st.rudS = 0;
      else used = false;
      if (used) { e.preventDefault(); syncControls(); kick(); }
    });

    function renderLines() {
      const box = $("[data-lines]"); box.innerHTML = "";
      const act = st.lines.filter((l) => l.on);
      if (act.length) { const s = document.createElement("span"); s.className = "eyebrow"; s.textContent = "Amarras"; box.appendChild(s); }
      for (const l of act) {
        const b = document.createElement("button"); b.className = "btn sm"; b.textContent = "Largar " + l.name;
        b.onclick = () => { l.on = false; renderLines(); kick(); }; box.appendChild(b);
      }
      if (st.status === "ready") {
        const b = document.createElement("button"); b.className = "btn sm primary";
        b.textContent = st.sc.goal.after === "muerto" ? "Coger la guía del muerto y hacer firme" : "Dar amarras (largo de proa y esprines)";
        b.onclick = () => finish(); box.appendChild(b);
      }
    }
    function updGolpes() { const c = $("[data-golpes]"); c.textContent = "Golpes: " + st.golpes; c.className = "chip " + (st.golpes ? "bad" : "ok"); }
    function renderInfo(fb) {
      const sc = st.sc, isDone = done[sc.id];
      $("[data-info]").innerHTML = `<div class="row" style="justify-content:space-between"><h4>${sc.name}</h4>${isDone ? `<span class="chip ok">Superado</span>` : ""}</div>
        <p>${sc.obj}</p><ol class="small">${sc.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
        <p class="small"><b>Tu hélice:</b> ${sc.rec(st.prop)}</p>
        ${windOf() ? `<p class="small muted">Viento ${windOf().kn} kn del ${["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(windOf().from / 45) % 8]}.</p>` : ""}
        <p class="small m-maniobras__fb" data-fb aria-live="polite">${fb || ""}</p>`;
    }
    const setFb = (html) => { const f = root.querySelector("[data-fb]"); if (f) f.innerHTML = html; };

    function finish() {
      const sc = st.sc; st.status = "done"; renderLines();
      const clean = st.golpes === 0;
      const extra = sc.goal.after === "muerto" ? " La guía del muerto, tesada desde la proa (o la popa), hace de codera y mantiene el barco perpendicular." : sc.goal.after === "amarras" ? " Primer cabo: largo de proa con viento de tierra, codera de popa con viento de la mar; después esprines y traveses." : "";
      setFb(`<span class="fb-ok">Maniobra completada${clean ? " sin un solo golpe" : ` con ${st.golpes} golpe(s)`}.</span>${extra}`);
      if (!done[sc.id]) { done[sc.id] = true; ctx.store.set("done", done); ctx.award(clean ? 40 : 30, "Maniobra: " + sc.name); }
      else if (clean) ctx.award(10, "Maniobra repetida sin golpes");
      if (sc.dock && clean) { ctx.badge("capitan-de-puerto"); ctx.toast("Atraque limpio: insignia Capitán de puerto"); }
      const h = root.querySelector("[data-info] h4"); if (h && !h.nextElementSibling) h.insertAdjacentHTML("afterend", `<span class="chip ok">Superado</span>`);
    }

    /* ---------- física */
    const M = 6000, I = (M * LOA * LOA) / 12 * 1.3, TMAX = 6000;
    function physics(dt) {
      const b = st.b, sh = Math.sin(b.h), ch = Math.cos(b.h);
      const fwd = [sh, ch], stb = [ch, -sh];
      let X = 0, Y = 0, N = 0;
      const ext = (P, F) => { // fuerza en mundo aplicada en P (mundo)
        X += F[0] * fwd[0] + F[1] * fwd[1]; Y += F[0] * stb[0] + F[1] * stb[1];
        const dx = P[0] - b.x, dy = P[1] - b.y; N += -(dx * F[1] - dy * F[0]);
      };
      const vel = [b.u * fwd[0] + b.v * stb[0], b.u * fwd[1] + b.v * stb[1]];
      const pv = (P) => { const dx = P[0] - b.x, dy = P[1] - b.y; return [vel[0] + b.r * dy, vel[1] - b.r * dx]; };
      // Propulsión
      const props = st.prop === "twin" ? [{ y: -1.1, T: st.tP, hand: -1, k: 0.5 }, { y: 1.1, T: st.tS, hand: 1, k: 0.5 }] : [{ y: 0, T: st.t, hand: st.prop === "dextro" ? 1 : -1, k: 1 }];
      let wash = 0, pwSum = 0;
      for (const p of props) {
        const F = (p.T >= 0 ? p.T : p.T * 0.65) * TMAX * p.k;
        X += F; N += -p.y * F;
        const pw = p.T >= 0 ? p.hand * 0.07 * p.T * TMAX * p.k / (1 + 2 * Math.max(b.u, 0)) : p.hand * 0.3 * p.T * TMAX * p.k / (1 + 1.5 * Math.max(-b.u, 0));
        Y += pw; N += -5 * pw; pwSum += pw;
        if (p.T > 0) wash += 2.0 * Math.sqrt(p.T) * p.k;
      }
      st.fx = { pw: pwSum, wash };
      // Timón
      const Vr = b.u + wash, eff = Vr >= 0 ? 1 : 0.5, sd = Math.sin(st.delta);
      const Fr = -600 * eff * Vr * Math.abs(Vr) * sd;
      Y += Fr; N += -5 * Fr; X -= 350 * Vr * Math.abs(Vr) * sd * sd;
      st.fx.rud = Fr;
      // Casco
      const u = b.u, v = b.v, r = b.r;
      X -= u >= 0 ? 250 * u + 700 * u * u : 400 * u - 1100 * u * u;
      Y -= 3500 * v + 7000 * v * Math.abs(v);
      N -= 30000 * r + 220000 * r * Math.abs(r);
      // Viento
      const w = windOf();
      if (w) {
        const Vw = w.kn * 0.5144, q = 0.6 * Vw * Vw, d = [-Math.sin(deg(w.from)), -Math.cos(deg(w.from))];
        const dfx = d[0] * fwd[0] + d[1] * fwd[1], dfy = d[0] * stb[0] + d[1] * stb[1];
        X += q * 7 * dfx; Y += q * 24 * dfy; N += 1.3 * q * 24 * dfy;
      }
      // Amarras
      for (const l of st.lines) {
        l.tension = 0; if (!l.on) continue;
        const P = toW(b, l.pt), dx = P[0] - l.anchor[0], dy = P[1] - l.anchor[1], d = Math.hypot(dx, dy) || 1;
        if (d > l.len) {
          const vp = pv(P), rate = (vp[0] * dx + vp[1] * dy) / d;
          const T = Math.min(40000, 40000 * (d - l.len) + 9000 * Math.max(0, rate));
          l.tension = T; ext(P, [-dx / d * T, -dy / d * T]);
        }
      }
      // Contactos (defensas = penalización suave; golpe si se llega rápido)
      const hw = hullW(b), now = new Set();
      const contact = (key, P, n, pen, approach, sign) => {
        const mag = 200000 * pen + 25000 * approach;
        if (mag > 0) ext(P, [sign * n[0] * mag, sign * n[1] * mag]);
        now.add(key);
        if (!st.contacts.has(key) && approach > 0.45 && st.time - st.lastGolpe > 1) { st.lastGolpe = st.time; golpe(approach); }
      };
      st.obs.forEach((o, oi) => {
        hw.forEach((P, i) => { const pe = penetrate(P, o.poly); if (pe) { const vp = pv(P); contact(oi + ":" + i, P, pe.n, pe.d, -(vp[0] * pe.n[0] + vp[1] * pe.n[1]), 1); } });
        o.poly.forEach((Q, i) => { const pe = penetrate(Q, hw); if (pe) { const vp = pv(Q); contact(oi + "v" + i, Q, pe.n, pe.d, vp[0] * pe.n[0] + vp[1] * pe.n[1], -1); } });
      });
      st.contacts = now;
      // Integración (ejes buque: x proa, y estribor; r>0 = proa a estribor)
      const mx = M, my = 1.5 * M;
      b.u += ((X + my * b.v * b.r) / mx) * dt;
      b.v += ((Y - mx * b.u * b.r) / my) * dt;
      b.r += (N / I) * dt;
      b.x += (b.u * fwd[0] + b.v * stb[0]) * dt;
      b.y += (b.u * fwd[1] + b.v * stb[1]) * dt;
      b.h += b.r * dt;
      st.time += dt;
    }
    function golpe(vn) {
      const kn = (vn * 1.944).toFixed(1);
      st.golpes++; updGolpes();
      if (vn > 1.1 && st.status === "run") {
        st.status = "fail";
        setFb(`<span class="fb-bad">Choque a ${kn} kn.</span> Demasiada arrancada: en puerto, a la mínima velocidad de gobierno, punto muerto con tiempo y para con atrás poca. Pulsa «Reiniciar».`);
      } else setFb(`<span class="fb-bad">Golpe a ${kn} kn.</span> Las defensas aguantan, pero llegaste rápido. Contacto aceptable: < 0,9 kn.`);
    }
    function checkGoal(dt) {
      const sc = st.sc, b = st.b, g0 = sc.goal; if (st.status !== "run") return;
      const spd = Math.hypot(b.u, b.v), hdg = norm360(rad2deg(b.h));
      if (g0.type === "berth") {
        const [x0, x1, y0, y1] = g0.rect;
        const inside = b.x >= x0 && b.x <= x1 && b.y >= y0 && b.y <= y1 && Math.abs(angDiff(hdg, g0.hdg)) <= g0.tol && spd < 0.3;
        st.hold = inside ? st.hold + dt : 0;
        if (st.hold > 1.2) { st.status = "ready"; st.t = st.tP = st.tS = 0; syncControls(); renderLines(); setFb(`<span class="fb-ok">¡En posición y parado!</span> ${g0.after === "muerto" ? "Ahora coge la guía del muerto." : "Da las amarras."}`); }
      } else if (g0.type === "exit") {
        const [x0, x1, y0, y1] = g0.rect;
        if (b.x >= x0 && b.x <= x1 && b.y >= y0 && b.y <= y1) {
          if (st.lines.some((l) => l.on)) { if (!st.warned) { st.warned = true; setFb("Aún tienes amarras dadas."); } }
          else finish();
        }
      } else if (g0.type === "turn") {
        if (Math.abs(angDiff(hdg, g0.hdg)) <= g0.tol && spd < 1.2) finish();
      } else if (g0.type === "buoy") {
        const bow = toW(b, [5, 0]), d = Math.hypot(bow[0] - g0.at[0], bow[1] - g0.at[1]);
        if (d < 1.8 && spd < 0.4) {
          if (Math.abs(angDiff(hdg, g0.hdg)) <= g0.tol) finish();
          else if (!st.warned) { st.warned = true; setFb(`<span class="fb-bad">Llegas a la boya, pero no proa al viento.</span> El viento te atravesará y te sacará la proa: acércate aproado.`); }
        } else if (d > 4) st.warned = false;
      }
    }

    /* ---------- dibujo */
    let view = { s: 1, ox: 0, oy: 0 };
    function fit() {
      const [x0, x1, y0, y1] = st.sc.view; const s = Math.min(W / (x1 - x0), H / (y1 - y0));
      view = { s, ox: (W - (x1 - x0) * s) / 2 - x0 * s, oy: (H - (y1 - y0) * s) / 2 + y1 * s };
    }
    const X_ = (x) => view.ox + x * view.s, Y_ = (y) => view.oy - y * view.s;
    const path = (pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X_(p[0]), Y_(p[1])) : g.moveTo(X_(p[0]), Y_(p[1])))); g.closePath(); };
    function arrow(x0, y0, x1, y1, c, w = 2) {
      const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0); if (L < 3) return;
      g.strokeStyle = c; g.fillStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 8 * Math.cos(a - 0.45), y1 - 8 * Math.sin(a - 0.45)); g.lineTo(x1 - 8 * Math.cos(a + 0.45), y1 - 8 * Math.sin(a + 0.45)); g.closePath(); g.fill();
    }
    function drawBoat(pose, own) {
      const hw = HULL.map((p) => toW(pose, p));
      path(hw); g.fillStyle = col.sheet; g.fill(); g.lineWidth = own ? 2.2 : 1.2; g.strokeStyle = own ? col.accent : col.muted; g.stroke();
      path([[1.8, 1], [1.8, -1], [-2.5, -1.1], [-2.5, 1.1]].map((p) => toW(pose, p))); g.fillStyle = col["sea-2"]; g.fill();
      if (own) {
        const lp = toW(pose, [3, -1.25]), ls = toW(pose, [3, 1.25]);
        g.fillStyle = col.port; g.beginPath(); g.arc(X_(lp[0]), Y_(lp[1]), Math.max(2, 0.35 * view.s), 0, 7); g.fill();
        g.fillStyle = col.stbd; g.beginPath(); g.arc(X_(ls[0]), Y_(ls[1]), Math.max(2, 0.35 * view.s), 0, 7); g.fill();
      }
    }
    function draw() {
      if (!st.sc) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); fit();
      g.fillStyle = col.sea; g.fillRect(0, 0, W, H);
      const sc = st.sc, b = st.b;
      // zona objetivo
      g.setLineDash([6, 5]); g.lineWidth = 2; g.strokeStyle = col.ok;
      if (sc.goal.rect) {
        const [x0, x1, y0, y1] = sc.goal.rect;
        if (sc.goal.type === "berth") { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; path(HULL.map((p) => toW({ x: cx, y: cy, h: deg(sc.goal.hdg) }, p))); g.stroke(); }
        else { path(rect(x0, y0, x1, y1)); g.stroke(); g.fillStyle = col.ok; g.font = `600 12px ${getComputedStyle(root).getPropertyValue("--f-body") || "sans-serif"}`; g.fillText("Salida", X_(x0) + 4, Y_(y1) + 14); }
      }
      g.setLineDash([]);
      // tierra
      for (const o of st.obs) if (o.kind === "land") {
        path(o.poly); g.fillStyle = col.paper; g.fill();
        g.save(); g.clip(); g.strokeStyle = col.muted; g.globalAlpha = 0.35; g.lineWidth = 1; g.beginPath();
        for (let k = -H; k < W + H; k += 10) { g.moveTo(k, 0); g.lineTo(k + H, H); } g.stroke(); g.restore();
        path(o.poly); g.strokeStyle = col.muted; g.lineWidth = 2; g.stroke();
      }
      for (const p of sc.bollards || []) { g.fillStyle = col.ink; g.beginPath(); g.arc(X_(p[0]), Y_(p[1]), Math.max(2.5, 0.3 * view.s), 0, 7); g.fill(); }
      // muertos y guías
      if (sc.muertos) {
        g.setLineDash([3, 4]); g.strokeStyle = col.muted; g.lineWidth = 1;
        for (const m of sc.muertos) { g.beginPath(); g.moveTo(X_(m[0]), Y_(-0.2)); g.lineTo(X_(m[0]), Y_(m[1])); g.stroke(); g.fillStyle = col.muted; g.fillRect(X_(m[0]) - 4, Y_(m[1]) - 4, 8, 8); }
        g.setLineDash([]);
      }
      for (const by of sc.buoys || []) { g.fillStyle = col["buoy-y"]; g.strokeStyle = col.ink; g.lineWidth = 1; g.beginPath(); g.arc(X_(by[0]), Y_(by[1]), Math.max(4, 0.6 * view.s), 0, 7); g.fill(); g.stroke(); }
      for (const o of st.obs) if (o.kind === "boat") drawBoat(o.pose, false);
      // estelas
      if (st.trails.length > 1) {
        g.lineWidth = 1.5; g.strokeStyle = col.accent; g.globalAlpha = 0.55; g.beginPath(); st.trails.forEach((t, i) => (i ? g.lineTo(X_(t[0]), Y_(t[1])) : g.moveTo(X_(t[0]), Y_(t[1])))); g.stroke();
        g.setLineDash([4, 4]); g.strokeStyle = col.ink; g.beginPath(); st.trails.forEach((t, i) => (i ? g.lineTo(X_(t[2]), Y_(t[3])) : g.moveTo(X_(t[2]), Y_(t[3])))); g.stroke();
        g.setLineDash([]); g.globalAlpha = 1;
      }
      // amarras
      for (const l of st.lines) if (l.on) {
        const P = toW(b, l.pt); g.strokeStyle = l.tension > 50 ? col.warn : col.muted; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(X_(P[0]), Y_(P[1])); g.lineTo(X_(l.anchor[0]), Y_(l.anchor[1])); g.stroke();
      }
      drawBoat(b, true);
      // timón
      const sternP = toW(b, [-5, 0]), rt = toW(b, [-5 - 1.4 * Math.cos(st.delta), 1.4 * Math.sin(st.delta)]);
      g.strokeStyle = col.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(X_(sternP[0]), Y_(sternP[1])); g.lineTo(X_(rt[0]), Y_(rt[1])); g.stroke();
      // flechas de efectos
      const fx = st.fx || { pw: 0, wash: 0 };
      const sh = Math.sin(b.h), ch = Math.cos(b.h), stb = [ch, -sh];
      if (Math.abs(fx.pw) > 60) {
        const L = Math.min(40, Math.abs(fx.pw) / 25) * Math.sign(fx.pw), A = toW(b, [-4.2, 0]);
        arrow(X_(A[0]), Y_(A[1]), X_(A[0]) + stb[0] * L, Y_(A[1]) - stb[1] * L, col.warn, 2.5);
      }
      const thrusts = st.prop === "twin" ? [[-1.1, st.tP], [1.1, st.tS]] : [[0, st.t]];
      for (const [py, T] of thrusts) if (Math.abs(T) > 0.02) {
        const A = toW(b, [-5.4, py]), Bp = toW(b, [-5.4 - 6 * T, py]);
        g.globalAlpha = 0.6; arrow(X_(A[0]), Y_(A[1]), X_(Bp[0]), Y_(Bp[1]), col.muted, 3); g.globalAlpha = 1;
      }
      // punto giratorio
      if (Math.abs(b.r) > 0.03 && Math.abs(b.u) > 0.1) { const P = toW(b, [b.u > 0 ? LOA / 6 : -LOA / 6, 0]); g.strokeStyle = col.ink; g.lineWidth = 1.5; g.beginPath(); g.arc(X_(P[0]), Y_(P[1]), 4, 0, 7); g.stroke(); }
      // viento
      const w = windOf();
      if (w) {
        const cx = W - 34, cy = 34, a = deg(w.from), dx = -Math.sin(a), dy = Math.cos(a);
        g.fillStyle = col.sheet; g.globalAlpha = 0.85; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.fill(); g.globalAlpha = 1;
        arrow(cx - dx * 18, cy - dy * 18, cx + dx * 16, cy + dy * 16, col.ink, 2.5);
        g.fillStyle = col.ink; g.font = `600 11px sans-serif`; g.textAlign = "center"; g.fillText(`${w.kn} kn`, cx, cy + 40); g.textAlign = "left";
      }
      // HUD
      const spd = Math.hypot(b.u, b.v) * 1.944 * Math.sign(b.u || 1);
      const txt = [`${Math.abs(spd).toFixed(1)} kn ${b.u < -0.05 ? "atrás" : b.u > 0.05 ? "avante" : ""}`, `Rumbo ${String(Math.round(norm360(rad2deg(b.h)))).padStart(3, "0")}°`];
      if (Math.abs(fx.pw) > 60) txt.push(`Presión lateral: popa a ${fx.pw > 0 ? "Er" : "Br"}`);
      g.font = `600 12px ${"ui-monospace, monospace"}`;
      const bw = Math.max(...txt.map((t) => g.measureText(t).width)) + 16;
      g.fillStyle = col.sheet; g.globalAlpha = 0.88; g.fillRect(8, H - 10 - txt.length * 16, bw, txt.length * 16 + 4); g.globalAlpha = 1;
      g.fillStyle = col.ink; txt.forEach((t, i) => g.fillText(t, 16, H - 10 - (txt.length - 1 - i) * 16 - 2));
      if (st.paused) { g.fillStyle = col.ink; g.font = "700 14px sans-serif"; g.fillText("PAUSA", 12, 22); }
    }

    /* ---------- bucle */
    let raf = 0, last = 0, visible = true;
    const active = () => visible && tab === "sim" && !st.paused && st.status !== "fail" && st.status !== "done";
    function frame(ts) {
      raf = 0;
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000) * st.mult; last = ts;
      if (active()) {
        const n = Math.max(1, Math.ceil(dt / (1 / 240)));
        for (let i = 0; i < n; i++) physics(dt / n);
        st.trailT += dt;
        if (st.trailT > 0.25) { st.trailT = 0; const bw = toW(st.b, [5, 0]), sw = toW(st.b, [-5, 0]); st.trails.push([bw[0], bw[1], sw[0], sw[1]]); if (st.trails.length > 240) st.trails.shift(); }
        checkGoal(dt);
      }
      draw();
      if (active()) raf = requestAnimationFrame(frame); else last = 0;
    }
    function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    function resize() {
      const w = stage.clientWidth || 320; W = w; H = Math.round(Math.max(300, Math.min(560, w * 0.95)));
      stage.style.height = H + "px"; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); draw();
    }
    const ro = new ResizeObserver(() => resize()); ro.observe(stage); cleanups.push(() => ro.disconnect());
    const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) kick(); });
    io.observe(stage); cleanups.push(() => io.disconnect());
    cleanups.push(() => { if (raf) cancelAnimationFrame(raf); raf = 0; });

    /* ================= AMARRAS ================= */
    const svg = $("[data-svg]");
    svg.innerHTML = `
      <rect class="mm-land" x="0" y="0" width="400" height="56"/>
      <text x="200" y="26" text-anchor="middle">MUELLE</text>
      ${[18, 95, 178, 200, 262, 384].map((x) => `<circle class="mm-bol" cx="${x}" cy="50" r="4"/>`).join("")}
      <path class="mm-boat" d="M60 96 Q72 62 120 60 L292 60 L292 132 L120 132 Q72 130 60 96 Z"/>
      <rect class="mm-cabin" x="140" y="76" width="90" height="40" rx="6"/>
      <text x="70" y="100">Proa</text><text x="256" y="100">Popa</text><text x="150" y="150">Estribor al muelle · babor a la mar</text>
      <circle class="mm-buoy" cx="360" cy="228" r="9"/><text x="300" y="250">boya / muerto</text>
      ${Object.keys(LINES).map((k) => `<g class="mm-l" data-l="${k}" tabindex="0" role="button" aria-label="${LINES[k].n}"><path class="mm-line" d="${LINE_GEO[k]}"/><path class="mm-hit" d="${LINE_GEO[k]}"/></g>`).join("")}`;
    let lt = null, lscore = { ok: 0, n: 0 }, lOrder = shuffle(LINE_TASKS), li = 0, lAnswered = false;
    const lineInfo = (k) => { const L = LINES[k]; $("[data-linfo]").innerHTML = `<h4>${L.n}</h4><p class="small"><b>Dónde:</b> ${L.d}</p><p class="small"><b>Función:</b> ${L.f}</p><p class="small"><b>Al virarlo/cobrarlo:</b> ${L.v}</p><p class="small"><b>Uso:</b> ${L.u}</p>`; };
    function showLTask() {
      lt = lOrder[li % lOrder.length]; lAnswered = false;
      $("[data-lq]").textContent = lt.q; $("[data-lfb]").textContent = ""; $("[data-lscore]").textContent = `${lscore.ok}/${lscore.n}`;
      $$(".mm-l").forEach((g2) => g2.classList.remove("on", "ok", "bad"));
    }
    function pickLine(k) {
      $$(".mm-l").forEach((g2) => g2.classList.toggle("on", g2.dataset.l === k && !g2.classList.contains("ok")));
      lineInfo(k);
      if (!lt || lAnswered) return;
      lAnswered = true; lscore.n++;
      const ok = lt.a.includes(k);
      const gEl = root.querySelector(`.mm-l[data-l="${k}"]`); gEl.classList.remove("on"); gEl.classList.add(ok ? "ok" : "bad");
      if (!ok) lt.a.forEach((a) => root.querySelector(`.mm-l[data-l="${a}"]`).classList.add("ok"));
      if (ok) { lscore.ok++; ctx.award(5, "Amarras: " + LINES[k].n); }
      $("[data-lfb]").innerHTML = `<span class="${ok ? "fb-ok" : "fb-bad"}">${ok ? "Correcto." : "No: era " + lt.a.map((a) => LINES[a].n).join(" o ") + "."}</span> ${lt.why} <span class="m-maniobras__ref">[${lt.k}]</span>`;
      $("[data-lscore]").textContent = `${lscore.ok}/${lscore.n}`;
      if (lscore.n === LINE_TASKS.length && lscore.ok === LINE_TASKS.length) { ctx.award(30, "Reto de amarras completo"); ctx.toast("Reto de amarras: todas correctas"); }
    }
    on(svg, "click", (e) => { const g2 = e.target.closest(".mm-l"); if (g2) pickLine(g2.dataset.l); });
    on(svg, "keydown", (e) => { const g2 = e.target.closest(".mm-l"); if (g2 && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pickLine(g2.dataset.l); } });
    on($("[data-lnext]"), "click", () => { li++; if (li % lOrder.length === 0) { lOrder = shuffle(LINE_TASKS); lscore = { ok: 0, n: 0 }; } showLTask(); });
    showLTask();

    /* ================= QUIZ genérico ================= */
    function quiz(box, items, { title, onRound }) {
      let order = shuffle(items), i = 0, ok = 0;
      const show = () => {
        if (i >= order.length) {
          box.innerHTML = `<h4>${title}: ${ok}/${order.length}</h4><p class="small">${ok / order.length >= 0.8 ? '<span class="fb-ok">¡Aprobado!</span>' : "Repasa las explicaciones y vuelve a intentarlo."}</p><div class="row"><button class="btn primary" data-again>Otra ronda</button></div>`;
          box.querySelector("[data-again]").onclick = () => { order = shuffle(items); i = 0; ok = 0; show(); };
          onRound(ok, order.length); return;
        }
        const it = order[i], opts = shuffle(it.opts.map((t, k) => ({ t, ok: k === it.c })));
        box.innerHTML = `<div class="row" style="justify-content:space-between"><span class="eyebrow">${title} · ${i + 1}/${order.length}</span><span class="chip">${ok} aciertos</span></div>
          <p><b>${it.q}</b></p><div class="m-maniobras__opts">${opts.map((o, k) => `<button class="btn" data-k="${k}">${o.t}</button>`).join("")}</div>
          <p class="small m-maniobras__fb" data-qfb aria-live="polite"></p><div class="row"><button class="btn sm" data-nx hidden>Siguiente</button></div>`;
        const btns = [...box.querySelectorAll("[data-k]")];
        btns.forEach((bt) => (bt.onclick = () => {
          const o = opts[+bt.dataset.k]; btns.forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add("is-ok"); }); if (!o.ok) bt.classList.add("is-bad");
          if (o.ok) { ok++; ctx.award(5, title); }
          box.querySelector("[data-qfb]").innerHTML = `<span class="${o.ok ? "fb-ok" : "fb-bad"}">${o.ok ? "Correcto." : "Incorrecto."}</span> ${it.why}${it.ref ? ` <span class="m-maniobras__ref">[${it.ref}]</span>` : ""}`;
          const nx = box.querySelector("[data-nx]"); nx.hidden = false; nx.focus(); nx.onclick = () => { i++; show(); };
        }));
      };
      show();
    }

    /* ================= VERBOS ================= */
    $("[data-gl]").innerHTML = VERBS.map(([v, d]) => `<div><b>${v}</b>${d}${VERB_REF[v] ? `<div class="m-maniobras__ref">${VERB_REF[v]}</div>` : ""}</div>`).join("");
    const verbItems = VERBS.map(([v, d]) => {
      const banned = new Set(CONFUSABLE.filter((g2) => g2.includes(v)).flat());
      const pool = shuffle(VERBS.map((x) => x[0]).filter((x) => x !== v && !banned.has(x))).slice(0, 3);
      return { q: `«${d}»`, opts: [v, ...pool], c: 0, why: `${v}: ${d.charAt(0).toLowerCase() + d.slice(1)}`, ref: VERB_REF[v] };
    });
    quiz($("[data-vq]"), verbItems, { title: "Verbos de maniobra", onRound: (ok, n) => { if (ok >= n - 2) { ctx.award(30, "Verbos de maniobra"); ctx.toast("Vocabulario de maniobra dominado"); } } });

    /* ================= EXAMEN ================= */
    const examItems = EXAM.map(([ref, q, opts, c, why]) => ({ ref, q, opts, c, why }));
    quiz($("[data-eq]"), examItems, { title: "Examen Maniobras", onRound: (ok, n) => { if (ok / n >= 0.8) ctx.award(40, "Examen de Maniobras aprobado"); } });

    /* ---------- arranque */
    loadScenario(0);

    return () => { cleanups.forEach((f) => { try { f(); } catch {} }); el.innerHTML = ""; };
  },
};
