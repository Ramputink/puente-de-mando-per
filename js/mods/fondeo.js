// Módulo «Simulador de fondeo» — Tema 2 (Amarre y fondeo)
// Vista cenital (círculo de borneo, otros barcos, rolada y garreo) y lateral (catenaria).

const ID = "fondeo";

const FONDOS = {
  arena: { n: "Arena", hold: 1, q: "Buen tenedero: el ancla se entierra y agarra bien." },
  fango: { n: "Fango compacto", hold: 1, q: "De los mejores tenederos (fango compacto, arena fangosa, arena dura)." },
  roca: { n: "Roca", hold: 0.3, q: "Mal tenedero: en roca lisa el ancla no agarra y en arrecife puede enrocarse y perderse." },
  algas: { n: "Algas", hold: 0.4, q: "Mal tenedero: las uñas resbalan sobre las algas y el ancla garrea." },
  posidonia: { n: "Posidonia", hold: 0.4, q: "Mal tenedero y, sobre todo, hábitat protegido: no se fondea sobre praderas de posidonia." }
};
const POSIDONIA_LEGAL = "Posidonia oceanica es hábitat prioritario protegido (Directiva Hábitats 92/43/CEE, Ley 42/2007). El fondeo sobre sus praderas está prohibido o limitado en muchas zonas (p. ej. Baleares, Decreto 25/2018) y se sanciona. Fondea en arena (manchas claras) o usa las boyas de fondeo autorizadas.";

// Multiplicadores de sonda. Cadena: criterio del examen. Mixta/estacha: orientativos (más longitud por pesar menos).
const LINEAS = {
  cadena: { n: "Toda cadena", w: 1, bueno: [3, 4], malo: [5, 6] },
  mixta: { n: "Cadena + estacha", w: 0.35, bueno: [5, 6], malo: [7, 8] },
  estacha: { n: "Solo estacha", w: 0.12, bueno: [7, 8], malo: [10, 12] }
};
const A_WIND = { bueno: 15, malo: 60 }; // parámetro de catenaria para cadena (relativo)

const COAST = 90; // m al N del ancla inicial
const OTHERS = [
  { x: -60, y: -15, r: 28, L: 9 },
  { x: 50, y: -55, r: 24, L: 8 },
  { x: 48, y: 45, r: 26, L: 11 }
];

const QUIZ = [
  { id: "8b890e387f", q: "Para evitar el garreo de un ancla, ¿qué afirmación es CORRECTA?",
    o: ["Se puede filar más cadena, cambiar de tenedero, fondear una segunda ancla o aguantar con máquina avante.", "Se cobra cadena y se busca un tenedero de gravilla o fondo duro.", "Basta con vigilar la sonda con la alarma de fondo mínimo.", "Se reduce la línea para que el barco borne menos."],
    e: "Más línea = tiro más horizontal sobre el ancla. Cobrar cadena empeora el agarre, y los fondos duros son malos tenederos." },
  { id: "16fa0da58d", q: "El círculo de borneo tiene como centro el ancla y como radio…",
    o: ["La longitud de cadena filada más la eslora.", "Solo la longitud de cadena filada.", "La cadena más media eslora, descrito por el centro de gravedad.", "Dos veces la eslora."],
    e: "Clave oficial: cadena filada + eslora (16fa0da58d, 9294ea37c5). «Radio = cadena filada» se da como INCORRECTA (3a0b2ad416), aunque los apuntes de 2015 lo digan así." },
  { id: "a05e2cdb81", q: "Barco de 10 m de eslora, fondeo a la gira con tiempo normal y sonda de 8 m. ¿Qué longitud de línea hay que largar como mínimo?",
    o: ["De 24 a 40 m.", "De 8 a 10 m.", "De 10 a 18 m.", "De 48 a 56 m."],
    e: "Buen tiempo: 3–4 veces la sonda (la clave oficial admite hasta 5×): 3 × 8 = 24 m … 5 × 8 = 40 m. 48–56 m sería mal tiempo (6–7×)." },
  { id: "917b369057", q: "La aproximación al lugar de fondeo se hará…",
    o: ["A la mínima velocidad de gobierno y con el viento por la proa.", "A la máxima velocidad de gobierno, de través al viento.", "Con el ancla a la pendura y la popa al viento.", "Dando avante y aumentando la arrancada mientras se larga cadena."],
    e: "Proa al viento (o a la corriente, la que más afecte) y despacio: así gobiernas y paras con precisión (917b369057, 168aa0ad45, 81c203c757)." },
  { id: "e25771d068", q: "En el momento de dar fondo se recomienda…",
    o: ["Llevar una ligera arrancada atrás para que la cadena se extienda correctamente por el fondo.", "Dar avante para que el ancla se clave antes.", "Parar y dejar caer toda la cadena de golpe sobre el ancla.", "Llevar arrancada avante máxima para tesar la cadena."],
    e: "Con arrancada atrás la cadena se tiende en línea y no se amontona sobre el ancla (e25771d068, 81c203c757)." },
  { id: "05c93d2d41", q: "El orinque es…",
    o: ["Un cabo amarrado por un chicote a la cruz (o arganeo) del ancla y por el otro a un boyarín, para balizarla y poder recuperarla.", "El cabo que une el ancla con la proa de la embarcación.", "Un cabo para medir la sonda y conocer el tipo de fondo.", "Un elemento de amarre del muelle."],
    e: "El orinque va del ancla a un boyarín, NUNCA a la proa (cb78d5790e, faaac0416e). Su longitud: algo mayor que la sonda en pleamar. No es elemento de amarre (9a9029f9a0)." },
  { id: "4cea3178ae", q: "Fondear «a la gira» es…",
    o: ["Fondear con una sola ancla por proa, de modo que el barco gira libremente alrededor de ella.", "Fondear con dos anclas cuyas líneas forman 60–120°.", "Fondear con un ancla por proa y otra por popa.", "Amarrarse a la boya de un muerto."],
    e: "Una sola ancla y borneo libre. Las respuestas con «dos anclas» son el distractor clásico (16fa0da58d, 8b890e387f)." },
  { id: "17f83d0cb0", q: "Detectas que tu embarcación garrea. ¿Qué NO debes hacer?",
    o: ["Reducir inmediatamente la longitud de la línea de fondeo.", "Filar más cadena.", "Levar y volver a fondear en un tenedero mejor.", "Aguantar con máquina avante mientras preparas la maniobra."],
    e: "Acortar la línea levanta el tiro y el ancla zarpa aún más. En 17f83d0cb0 «reducir inmediatamente la línea» es falsa." },
  { id: "d0719e1c52", q: "Para levar el ancla…",
    o: ["Se da avante poco a poco mientras se cobra la cadena hasta que queda a pique.", "Se da siempre atrás mientras se cobra hasta que el ancla esté a pique.", "Se da atrás hasta que el ancla queda a la pendura tocando el fondo.", "Se tira de la cadena con la máquina avante a toda fuerza desde el principio."],
    e: "«Dar atrás mientras se cobra» es la afirmación INCORRECTA en d0719e1c52 y e6f37e32ca. Se cobra dando avante suave para no forzar la cadena ni el molinete." },
  { id: "c68e1717aa", q: "Barco de 10 m con línea de cadena + estacha, fondeo a la gira en sonda de 4 m. ¿Qué escenario es el más seguro?",
    o: ["Fango compacto, protegido de vientos cambiantes y sin obstáculos en 30 m de radio.", "Fango compacto y sin obstáculos en 12 m de radio.", "Arcilla, protegida, sin obstáculos en 22 m de radio.", "Fondo de piedra, sin obstáculos en 12 m de radio."],
    e: "Con línea mixta se fila ≈5× la sonda: 20 m + 10 m de eslora = 30 m de radio. 22 m solo valdría con 3× de cadena; la arcilla es resbaladiza y la piedra, mal tenedero." },
  { id: "bfded0cc5b", q: "Se llama tenedero a…",
    o: ["La calidad del fondo con respecto a la adherencia del ancla.", "El lugar del muelle donde se fijan las amarras.", "El cuerpo flotante sujeto al fondo que señala un peligro.", "El palo con gancho para atracar y desatracar."],
    e: "Tenedero = calidad del fondo para agarrar. El palo con gancho es el bichero; el flotante, una boya." },
  { id: "5b7381b06c", q: "Siempre que sea posible, el tenedero elegido será…",
    o: ["Fango duro, arena fangosa o arena dura.", "Roca o algas, para que el ancla se trabe.", "Una pradera de posidonia, que sujeta muy bien el ancla.", "Una pendiente pronunciada hacia fuera."],
    e: "Fondos blandos y compactos (cb78d5790e). Algas y roca son malos (80f547ae7e); la posidonia está protegida; la pendiente hace que el ancla resbale (17f83d0cb0)." },
  { id: "3a0b2ad416", q: "¿Qué longitud mínima de línea de fondeo debe llevar a bordo una embarcación de 6 m de eslora?",
    o: ["30 m (5 esloras).", "18 m (3 esloras).", "24 m (4 esloras).", "12 m (2 esloras)."],
    e: "RD 339/2021: línea de fondeo no inferior a 5 veces la eslora. 6 × 5 = 30 m (3a0b2ad416, d0719e1c52)." },
  { id: "80f547ae7e", q: "Una vez fondeados, ¿cómo vigilamos el fondeo?",
    o: ["Tomando referencias a tierra (enfilaciones, demoras) y vigilando la sonda con alarma de fondo mínimo.", "Solo con la alarma de sonda.", "Midiendo la sonda con el orinque.", "No hace falta si el ancla está bien clavada."],
    e: "Clave repetida (80f547ae7e, f86d151b56, 301e2918d9): referencias a tierra + sonda con alarma. «Solo la sonda» es falsa (8b890e387f)." }
];

const PROC = {
  fondear: [
    { t: "Elegir fondeadero", d: "Carta y derrotero: abrigo del viento y la mar previstos, sonda, tenedero (fango compacto, arena), sin pendiente, espacio libre para el borneo y sin posidonia.", s: { bx: 250, anchor: "bow", chain: "none" } },
    { t: "Preparar el ancla y el orinque", d: "Ancla desatrincada y lista para largar (puede ir a la pendura cerca del fondeadero), cadena clara y orinque con su boyarín preparado.", s: { bx: 250, anchor: "pendura", chain: "none" } },
    { t: "Aproximación proa al viento", d: "Proa al viento o a la corriente (al elemento que más afecte), a la mínima velocidad de gobierno. Nunca a toda máquina ni de través.", s: { bx: 150, anchor: "pendura", chain: "none", arrow: "avante", wind: true } },
    { t: "Parar y «¡Larga el ancla!»", d: "En el punto elegido, sin arrancada avante, la primera orden al tripulante de proa es «larga el ancla». El orinque baliza su posición.", s: { bx: 120, anchor: "bottom", chain: "vertical", buoy: true } },
    { t: "Filar con arrancada atrás", d: "Con ligera arrancada atrás (poca máquina atrás o dejando que el viento nos abata) se va filando: la cadena se tiende por el fondo y no cae sobre el ancla.", s: { bx: 190, anchor: "bottom", chain: "cat", lie: 30, arrow: "atras", buoy: true } },
    { t: "Filar lo calculado y hacer firme", d: "Buen tiempo 3–4× la sonda; mal tiempo 5–6× (más con estacha). Se hace firme y se da poca atrás suave: la cadena se tesa sin tirones = el ancla ha agarrado.", s: { bx: 250, anchor: "bottom", chain: "cat", lie: 70, buoy: true } },
    { t: "Vigilar el fondeo", d: "Referencias a tierra (enfilaciones, demoras), alarma de fondeo del GPS y alarma de sonda (ojo con mareas grandes). Señal de fondeado: bola negra de día, luz blanca todo horizonte de noche (RIPA regla 30).", s: { bx: 250, anchor: "bottom", chain: "cat", lie: 70, buoy: true, refs: true } }
  ],
  levar: [
    { t: "Preparar la maniobra", d: "Motor arrancado, tripulante en proa y señales acordadas (dirección de la cadena, «a pique», «zarpa»). Revisa que la zona de salida está libre.", s: { bx: 250, anchor: "bottom", chain: "cat", lie: 70, buoy: true } },
    { t: "Avante poco y cobrar", d: "Se da avante muy poco mientras se cobra (o se vira con el molinete) la cadena, sin pasarla por debajo del casco ni forzarla con la máquina. NO se da atrás.", s: { bx: 170, anchor: "bottom", chain: "cat", lie: 25, arrow: "avante", buoy: true } },
    { t: "A pique", d: "La cadena queda vertical con el ancla aún en el fondo: «¡A pique!». Si tira fuerte hacia abajo y no zarpa, puede estar enrocada: usa el orinque tirando de la cruz en sentido contrario y cuida que nada vaya a la hélice.", s: { bx: 100, anchor: "bottom", chain: "vertical", buoy: true } },
    { t: "Zarpa", d: "El ancla se desprende del fondo («¡zarpa!»). Desde ahora no estamos fondeados: hay que gobernar.", s: { bx: 100, anchor: "zarpa", chain: "vertical", buoy: true } },
    { t: "Clara y libre", d: "El ancla aflora sin enredos, algas ni fango: «clara y libre». Si sale sucia, se limpia antes de estibar.", s: { bx: 100, anchor: "clara", chain: "vertical" } },
    { t: "Estibar y recoger el orinque", d: "Ancla a su alojamiento y trincada, cadena estibada, orinque y boyarín a bordo.", s: { bx: 100, anchor: "bow", chain: "none" } }
  ]
};

const CSS = `
.m-fondeo { --mf-gap: 1rem; }
.m-fondeo .mf-lay { display: grid; gap: var(--mf-gap); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 900px) { .m-fondeo .mf-lay { grid-template-columns: minmax(260px, 330px) minmax(0, 1fr); align-items: start; } }
.m-fondeo .mf-field { display: grid; gap: .25rem; }
.m-fondeo .mf-field label { display: flex; justify-content: space-between; gap: .5rem; font-weight: 600; font-size: .92rem; }
.m-fondeo .mf-field output { font-family: var(--f-mono); color: var(--accent); }
.m-fondeo .seg button { padding: .4em .7em; font-size: .9rem; }
.m-fondeo .mf-read { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .2rem .8rem; font-size: .92rem; }
.m-fondeo .mf-read dt { color: var(--muted); }
.m-fondeo .mf-read dd { margin: 0; font-family: var(--f-mono); font-size: .85rem; text-align: right; white-space: nowrap; }
.m-fondeo .mf-warn { margin: 0; padding-left: 1.1rem; font-size: .9rem; display: grid; gap: .3rem; }
.m-fondeo .mf-warn li.bad { color: var(--bad); }
.m-fondeo .mf-warn li.warn { color: var(--warn); }
.m-fondeo .mf-warn li.ok { color: var(--ok); }
.m-fondeo .mf-stage { touch-action: manipulation; }
.m-fondeo .mf-toggles .chip { cursor: pointer; min-height: 32px; font: inherit; font-size: .82rem; font-weight: 600; }
.m-fondeo .mf-toggles .chip[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.m-fondeo .mf-alarm { border: 2px solid var(--bad); border-radius: var(--r); padding: .8rem; background: var(--sheet); }
.m-fondeo .mf-alarm h4 { color: var(--bad); }
.m-fondeo .mf-actions { display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); }
.m-fondeo .mf-actions .btn { justify-content: flex-start; text-align: left; white-space: normal; }
.m-fondeo .mf-fb { min-height: 1.5em; }
.m-fondeo .mf-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: .4rem; counter-reset: st; }
.m-fondeo .mf-steps button { width: 100%; text-align: left; justify-content: flex-start; white-space: normal; }
.m-fondeo .mf-steps button[aria-current="step"] { border-color: var(--accent); background: var(--sea); }
.m-fondeo .mf-steps .n { font-family: var(--f-mono); color: var(--accent); min-width: 1.4em; }
.m-fondeo .mf-svg { width: 100%; height: auto; display: block; border-radius: var(--r); border: 1px solid var(--line); background: var(--sea); }
.m-fondeo .mf-opts { display: grid; gap: .5rem; }
.m-fondeo .mf-opts .btn { justify-content: flex-start; text-align: left; white-space: normal; min-height: 44px; }
.m-fondeo .mf-opts .btn.is-ok { border-color: var(--ok); color: var(--ok); }
.m-fondeo .mf-opts .btn.is-bad { border-color: var(--bad); color: var(--bad); }
.m-fondeo .mf-order { display: flex; flex-wrap: wrap; gap: .5rem; }
.m-fondeo .mf-order .btn.done { border-color: var(--ok); color: var(--ok); }
.m-fondeo .mf-order .btn.shake { border-color: var(--bad); color: var(--bad); }
.m-fondeo .mf-seq { margin: 0; padding-left: 1.3rem; display: grid; gap: .2rem; font-size: .92rem; }
.m-fondeo [hidden] { display: none !important; }
`;

function injectCSS() {
  if (document.querySelector(`style[data-mod="${ID}"]`)) return;
  const s = document.createElement("style");
  s.dataset.mod = ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (n, d = 0) => Number(n).toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d });
const rad = (d) => d * Math.PI / 180;
const angDiff = (a, b) => ((b - a + 540) % 360) - 180;

// Catenaria: devuelve geometría de la línea en vista lateral.
function catenary(L, h, w, weather) {
  const a = A_WIND[weather] / w;
  if (L <= h * 1.02) return { mode: "vertical", a, lie: 0, s: L, xs: 0, hx: 0 };
  const s = Math.sqrt(h * h + 2 * a * h); // longitud suspendida si toca tangente al fondo
  if (s < L) {
    const xs = a * Math.asinh(s / a);
    return { mode: "ok", a, lie: L - s, s, xs, hx: L - s + xs };
  }
  const at = (L * L - h * h) / (2 * h);
  const xs = at * Math.asinh(L / at);
  return { mode: "lifted", a: at, lie: 0, s: L, xs, hx: xs, need: s };
}

export default {
  id: ID,
  tema: 2,
  title: "Simulador de fondeo",
  icon: "↧",
  desc: "Calcula la cadena a filar, mira la catenaria y el círculo de borneo y sobrevive a una rolada sin garrear.",
  mount(el, ctx) {
    injectCSS();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups = [];
    const st = {
      depth: ctx.store.get("depth", 6), eslora: ctx.store.get("eslora", 9), fondo: ctx.store.get("fondo", "arena"),
      tiempo: ctx.store.get("tiempo", "bueno"), linea: ctx.store.get("linea", "cadena"), total: ctx.store.get("total", 50),
      filada: 24, view: "cenital", aids: { enf: true, gps: true, sonda: true }
    };
    const sim = { running: false, t: 0, wind: 0, target: 0, strong: false, brg: 180, anchor: { x: 0, y: 0 }, a0: { x: 0, y: 0 },
      dragging: false, detected: false, grounded: false, engineT: 0, second: false, okT: 0, survived: false, trail: [], how: "" };
    const awarded = new Set();

    el.innerHTML = `
<div class="m-fondeo stack">
  <div class="panel stack">
    <span class="eyebrow">Tema 2 · Amarre y fondeo</span>
    <h2>Simulador de fondeo</h2>
    <p class="muted">Elige sonda, fondo, tiempo y línea; comprueba la catenaria y el círculo de borneo; luego provoca una rolada y decide qué hacer si garreas.</p>
    <div class="seg" role="tablist" aria-label="Secciones">
      <button data-tab="sim" aria-pressed="true">Simulador</button>
      <button data-tab="proc" aria-pressed="false">Fondear y levar</button>
      <button data-tab="quiz" aria-pressed="false">Quiz</button>
    </div>
  </div>

  <section data-sec="sim" class="mf-lay">
    <div class="panel stack">
      <div class="mf-field"><label for="mf-depth">Sonda <output data-o="depth"></output></label><input id="mf-depth" type="range" min="2" max="25" step="0.5" data-i="depth"></div>
      <div class="mf-field"><label for="mf-eslora">Eslora <output data-o="eslora"></output></label><input id="mf-eslora" type="range" min="4" max="15" step="0.5" data-i="eslora"></div>
      <div class="stack" style="gap:.3rem"><span class="eyebrow">Tipo de fondo</span>
        <div class="seg" data-g="fondo">${Object.entries(FONDOS).map(([k, v]) => `<button data-v="${k}">${v.n}</button>`).join("")}</div></div>
      <div class="stack" style="gap:.3rem"><span class="eyebrow">Tiempo</span>
        <div class="seg" data-g="tiempo"><button data-v="bueno">Bueno</button><button data-v="malo">Malo</button></div></div>
      <div class="stack" style="gap:.3rem"><span class="eyebrow">Línea de fondeo</span>
        <div class="seg" data-g="linea">${Object.entries(LINEAS).map(([k, v]) => `<button data-v="${k}">${v.n}</button>`).join("")}</div></div>
      <div class="mf-field"><label for="mf-total">Línea a bordo <output data-o="total"></output></label><input id="mf-total" type="range" min="10" max="160" step="5" data-i="total"></div>
      <div class="mf-field"><label for="mf-filada">Línea filada <output data-o="filada"></output></label><input id="mf-filada" type="range" min="2" max="160" step="1" data-i="filada"></div>
      <button class="btn sm" data-act="rec">Filar lo recomendado</button>
      <div class="tint stack" style="gap:.5rem">
        <dl class="mf-read" data-read></dl>
        <ul class="mf-warn" data-warn aria-live="polite"></ul>
      </div>
    </div>

    <div class="panel stack">
      <div class="row" style="justify-content:space-between">
        <div class="seg" data-g="view"><button data-v="cenital">Cenital</button><button data-v="lateral">Lateral</button></div>
        <div class="row mf-toggles" aria-label="Ayudas de vigilancia">
          <button class="chip" data-aid="enf">Enfilación</button>
          <button class="chip" data-aid="gps">Alarma GPS</button>
          <button class="chip" data-aid="sonda">Alarma sonda</button>
        </div>
      </div>
      <div class="stage mf-stage" data-stage><canvas aria-label="Vista del fondeo" role="img"></canvas></div>
      <div class="row">
        <button class="btn primary" data-act="rolada">Simular rolada y refresco</button>
        <button class="btn" data-act="reset">Reiniciar</button>
        <span class="small muted" data-status aria-live="polite"></span>
      </div>
      <div class="mf-alarm stack" data-alarm hidden>
        <h4>Alarma: el barco se sale de su sitio</h4>
        <p class="small" data-alarm-why></p>
        <p class="small"><b>¿Qué haces?</b></p>
        <div class="mf-actions">
          <button class="btn sm" data-do="filar">Filar más cadena</button>
          <button class="btn sm" data-do="acortar">Cobrar cadena para acortar el borneo</button>
          <button class="btn sm" data-do="maquina">Aguantar con máquina avante</button>
          <button class="btn sm" data-do="segunda">Fondear una segunda ancla</button>
          <button class="btn sm" data-do="levar">Levar y fondear en mejor tenedero</button>
          <button class="btn sm" data-do="ignorar">Apagar la alarma y esperar</button>
        </div>
        <p class="small mf-fb" data-fb aria-live="polite"></p>
      </div>
      <details class="small">
        <summary><b>Cómo leer el simulador</b></summary>
        <p class="muted" style="margin-top:.4rem">Cenital: el círculo discontinuo es el círculo de borneo (centro el ancla, radio = línea filada + eslora, criterio del examen). La rolada gira el viento al SSW y refresca (pasa a mal tiempo): el barco bornea hacia la costa. Si la línea no basta para el nuevo tiempo o el tenedero es malo, el ancla garrea. Lateral: catenaria de la línea; un tramo apoyado en el fondo indica que el tiro llega horizontal al ancla.</p>
      </details>
    </div>
  </section>

  <section data-sec="proc" class="mf-lay" hidden>
    <div class="panel stack">
      <div class="seg" data-g="proc"><button data-v="fondear" aria-pressed="true">Fondear</button><button data-v="levar" aria-pressed="false">Levar</button></div>
      <ol class="mf-steps" data-steps></ol>
    </div>
    <div class="panel stack">
      <svg class="mf-svg" viewBox="0 0 320 160" data-svg role="img" aria-label="Esquema del paso"></svg>
      <h3 data-step-t></h3>
      <p data-step-d></p>
      <div class="row">
        <button class="btn" data-act="prev">Anterior</button>
        <button class="btn primary" data-act="next">Siguiente</button>
        <button class="btn" data-act="play">Reproducir</button>
      </div>
      <div class="tint stack">
        <span class="eyebrow">Practica: ordena la maniobra</span>
        <p class="small muted">Toca los pasos en el orden correcto.</p>
        <div class="mf-order" data-order></div>
        <ol class="mf-seq" data-seq></ol>
        <p class="small mf-fb" data-ofb aria-live="polite"></p>
        <div><button class="btn sm" data-act="order">Barajar de nuevo</button></div>
      </div>
    </div>
  </section>

  <section data-sec="quiz" class="panel stack" hidden>
    <div class="row" style="justify-content:space-between">
      <span class="eyebrow" data-qprog></span>
      <div class="seg" data-g="qmode"><button data-v="teoria" aria-pressed="true">Preguntas tipo examen</button><button data-v="calc" aria-pressed="false">Reto de cálculo</button></div>
    </div>
    <h3 data-qq></h3>
    <div class="mf-opts" data-qo></div>
    <p class="small mf-fb" data-qfb aria-live="polite"></p>
    <div class="row"><button class="btn primary" data-act="qnext" hidden>Siguiente</button><span class="small muted" data-qsrc></span></div>
  </section>
</div>`;

    const $ = (s) => el.querySelector(s);
    const $$ = (s) => [...el.querySelectorAll(s)];
    const on = (node, ev, fn, opt) => { node.addEventListener(ev, fn, opt); cleanups.push(() => node.removeEventListener(ev, fn, opt)); };

    // ---------- Tabs ----------
    on($('[role="tablist"]'), "click", (e) => {
      const b = e.target.closest("button[data-tab]"); if (!b) return;
      $$("[data-tab]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $$("[data-sec]").forEach((s) => (s.hidden = s.dataset.sec !== b.dataset.tab));
      if (b.dataset.tab === "sim") requestAnimationFrame(resize);
      if (b.dataset.tab === "proc") renderStep();
    });

    // ---------- Cálculos ----------
    const effWeather = () => (sim.strong ? "malo" : st.tiempo);
    const rec = (weather = st.tiempo) => { const m = LINEAS[st.linea][weather]; return [Math.ceil(st.depth * m[0]), Math.ceil(st.depth * m[1])]; };
    const radius = () => st.filada + st.eslora;
    const minLine = () => 5 * st.eslora;
    const depthAt = (y) => st.depth * (COAST - y) / COAST;
    const holdFactor = () => {
      const req = st.depth * LINEAS[st.linea][effWeather()][0];
      let h = FONDOS[st.fondo].hold * Math.min(1.3, st.filada / req);
      if (sim.engineT > 0) h *= 1.5;
      if (sim.second) h *= 1.6;
      return h;
    };
    const geom = () => catenary(st.filada, st.depth, LINEAS[st.linea].w, effWeather());

    // ---------- Controles ----------
    const inputs = Object.fromEntries($$("[data-i]").map((i) => [i.dataset.i, i]));
    function syncInputs() {
      inputs.depth.value = st.depth; inputs.eslora.value = st.eslora; inputs.total.value = st.total;
      inputs.filada.min = Math.max(1, Math.ceil(st.depth)); inputs.filada.max = st.total;
      st.filada = Math.min(Math.max(st.filada, +inputs.filada.min), st.total);
      inputs.filada.value = st.filada;
      $('[data-o="depth"]').textContent = fmt(st.depth, 1) + " m";
      $('[data-o="eslora"]').textContent = fmt(st.eslora, 1) + " m";
      $('[data-o="total"]').textContent = st.total + " m";
      $('[data-o="filada"]').textContent = fmt(st.filada) + " m · " + fmt(st.filada / st.depth, 1) + "×";
      for (const g of ["fondo", "tiempo", "linea", "view"]) $$(`[data-g="${g}"] button`).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === st[g])));
      $$("[data-aid]").forEach((b) => b.setAttribute("aria-pressed", String(!!st.aids[b.dataset.aid])));
    }
    function persist() { for (const k of ["depth", "eslora", "fondo", "tiempo", "linea", "total"]) ctx.store.set(k, st[k]); }

    function readout() {
      const [r0, r1] = rec(), R = radius(), g = geom();
      const L = LINEAS[st.linea][st.tiempo];
      $("[data-read]").innerHTML = `
        <dt>Recomendado (${st.tiempo === "bueno" ? "buen" : "mal"} tiempo)</dt><dd>${r0}–${r1} m · ${L[0]}–${L[1]}×</dd>
        <dt>Filada</dt><dd>${fmt(st.filada)} m · ${fmt(st.filada / st.depth, 1)}×</dd>
        <dt>Radio de borneo</dt><dd>${fmt(R)} m</dd>
        <dt>Línea mínima a bordo (5 esloras)</dt><dd>${fmt(minLine())} m</dd>
        <dt>Tramo en el fondo</dt><dd>${g.mode === "ok" ? fmt(g.lie) + " m" : "0 m"}</dd>`;
      const w = [];
      const add = (cls, t) => w.push(`<li class="${cls}">${t}</li>`);
      if (st.total < minLine()) add("bad", `Línea a bordo insuficiente: el RD 339/2021 exige al menos 5 esloras (${fmt(minLine())} m).`);
      if (st.fondo === "posidonia") add("bad", POSIDONIA_LEGAL);
      else if (FONDOS[st.fondo].hold < 1) add("warn", FONDOS[st.fondo].q);
      else add("ok", FONDOS[st.fondo].q);
      if (st.filada < r0) add("bad", `Filada corta: con ${st.tiempo} tiempo y ${LINEAS[st.linea].n.toLowerCase()} fila al menos ${r0} m.`);
      if (st.linea !== "cadena") add("warn", "Con estacha la línea pesa poco y el tiro llega inclinado al ancla: fila más (multiplicadores orientativos) y lleva un tramo de cadena junto al ancla.");
      if (st.tiempo === "bueno") add("warn", `Si se prevé que refresque, cuenta con mal tiempo: ${rec("malo")[0]}–${rec("malo")[1]} m.`);
      if (g.mode === "lifted") add("warn", "No queda cadena apoyada: el tiro levanta la caña del ancla y tiende a hacerla zarpar.");
      const over = OTHERS.filter((o) => Math.hypot(o.x - sim.a0.x, o.y - sim.a0.y) < R + o.r);
      if (over.length) add("warn", `Tu círculo de borneo se solapa con ${over.length === 1 ? "el de otro barco" : over.length + " barcos"}: con una rolada podéis tocaros (cada barco bornea distinto).`);
      if (sim.a0.y + R >= COAST - 2) add("bad", "La costa queda dentro del círculo de borneo: con viento de mar acabarías varado.");
      $("[data-warn]").innerHTML = w.join("");
    }

    function changed() { syncInputs(); readout(); if (!sim.running) placeBoat(); draw(); persist(); }

    for (const [k, i] of Object.entries(inputs)) on(i, "input", () => { st[k] = +i.value; changed(); });
    for (const g of ["fondo", "tiempo", "linea", "view"]) {
      on($(`[data-g="${g}"]`), "click", (e) => {
        const b = e.target.closest("button[data-v]"); if (!b) return;
        st[g] = b.dataset.v; changed();
        if (g === "fondo" && st.fondo === "posidonia") ctx.toast("Posidonia: fondeo prohibido o limitado. Busca arena.");
      });
    }
    on($(".mf-toggles"), "click", (e) => { const b = e.target.closest("[data-aid]"); if (!b) return; st.aids[b.dataset.aid] = !st.aids[b.dataset.aid]; syncInputs(); draw(); });
    on($('[data-act="rec"]'), "click", () => {
      const r = rec()[1];
      if (r > st.total) { st.total = Math.min(160, Math.ceil(r / 5) * 5); }
      st.filada = r; changed();
    });

    // ---------- Simulación ----------
    const status = (t) => ($("[data-status]").textContent = t);
    function placeBoat() {
      sim.brg = (sim.wind + 180) % 360;
      const g = geom();
      sim.boat = boatPos(g);
    }
    function boatPos(g) {
      const d = g.hx + st.eslora / 2;
      return { x: sim.anchor.x + Math.sin(rad(sim.brg)) * d, y: sim.anchor.y + Math.cos(rad(sim.brg)) * d };
    }
    function resetSim(keepMsg) {
      Object.assign(sim, { running: false, t: 0, wind: 0, target: 0, strong: false, anchor: { x: 0, y: 0 }, a0: { x: 0, y: 0 },
        dragging: false, detected: false, grounded: false, engineT: 0, second: false, okT: 0, survived: false, trail: [] });
      $("[data-alarm]").hidden = true; $("[data-fb]").textContent = "";
      if (!keepMsg) status("Viento del N (de tierra), flojo. Barco fondeado al S de su ancla.");
      placeBoat(); readout(); draw(); stopLoop();
    }
    on($('[data-act="reset"]'), "click", () => resetSim());
    on($('[data-act="rolada"]'), "click", () => {
      if (sim.grounded) resetSim(true);
      sim.running = true; sim.strong = true; sim.target = 200; sim.okT = 0; sim.how = "";
      if (reduced) { sim.wind = 200; sim.brg = 20; }
      status("Rolada: el viento gira al SSW y refresca (mal tiempo). Observa el borneo…");
      readout(); startLoop();
    });

    function detectionText() {
      const b = sim.boat, R = radius(), out = [];
      if (st.aids.gps && Math.hypot(b.x - sim.a0.x, b.y - sim.a0.y) > R + 3) out.push("la alarma de fondeo del GPS salta: el barco está fuera del radio fijado alrededor del punto donde largaste el ancla");
      const minA = depthAt(sim.a0.y + R) - 0.5;
      if (st.aids.sonda && minA > 0.5 && depthAt(b.y) < minA) out.push(`la sonda baja de ${fmt(minA, 1)} m (alarma de fondo mínimo)`);
      if (st.aids.enf && Math.abs(b.y - sim.a0.y) > R + 2) out.push("la enfilación del W se abre más de lo que permite el borneo");
      return out;
    }

    function step(dt) {
      if (!sim.running) return;
      sim.t += dt;
      if (sim.engineT > 0) sim.engineT -= dt;
      // giro del viento
      const dw = angDiff(sim.wind, sim.target);
      const rate = 40 * dt;
      sim.wind = Math.abs(dw) <= rate ? sim.target : (sim.wind + Math.sign(dw) * rate + 360) % 360;
      // borneo
      const tb = (sim.wind + 180) % 360, db = angDiff(sim.brg, tb), br = 28 * dt;
      sim.brg = Math.abs(db) <= br ? tb : (sim.brg + Math.sign(db) * br + 360) % 360;
      // garreo
      const h = holdFactor();
      sim.dragging = h < 0.97 && Math.abs(db) < 90 && Math.abs(angDiff(sim.wind, sim.target)) < 100;
      if (sim.dragging && !sim.grounded) {
        const v = Math.min(3, (1 - h) * 6 + 0.6) * dt;
        sim.anchor.x += Math.sin(rad(sim.brg)) * v; sim.anchor.y += Math.cos(rad(sim.brg)) * v;
        if (!sim.trail.length || Math.hypot(sim.trail.at(-1).x - sim.anchor.x, sim.trail.at(-1).y - sim.anchor.y) > 1) sim.trail.push({ ...sim.anchor });
      }
      sim.boat = boatPos(geom());
      // varada
      if (sim.boat.y + st.eslora / 2 >= COAST - 1) {
        sim.grounded = true; sim.running = false;
        status("Varado en la costa. Reinicia y prueba a filar más línea o a elegir mejor tenedero.");
        $("[data-alarm]").hidden = true; return;
      }
      // detección
      const det = detectionText();
      if (!sim.detected && (det.length || Math.hypot(sim.boat.x - sim.a0.x, sim.boat.y - sim.a0.y) > radius() + 12)) {
        sim.detected = true;
        $("[data-alarm]").hidden = false;
        $("[data-alarm-why]").textContent = det.length ? "Te avisa: " + det.join("; ") + "." : "Sin ayudas activadas lo notas tarde, a simple vista: el barco ya está muy lejos de su sitio.";
        status("¡Garreando!");
      }
      if (sim.dragging) { sim.okT = 0; status(`Garreando · agarre ${fmt(Math.min(100, h * 100))} %`); }
      else if (Math.abs(db) < 2 && sim.wind === sim.target) {
        sim.okT += dt;
        status(`El ancla aguanta · agarre ${fmt(Math.min(100, h * 100))} %${sim.engineT > 0 ? " (con máquina)" : ""}`);
        if (sim.okT > 6 && !sim.survived && sim.engineT <= 0) {
          sim.survived = true; sim.running = false;
          status("Fondeo seguro tras la rolada: el ancla aguanta con el nuevo tiempo.");
          if (!awarded.has("surv")) { awarded.add("surv"); ctx.award(30, "Fondeo seguro tras una rolada"); }
          stopLoop(); draw();
        }
      }
    }

    const ACT = {
      filar: () => {
        if (st.filada >= st.total) return ["bad", "No queda más línea a bordo. Toca levar y fondear en otro sitio o dar una segunda ancla. (Por eso la línea mínima es 5 esloras.)"];
        st.filada = Math.min(st.total, st.filada + Math.max(5, Math.round(st.depth * 2))); syncInputs(); readout();
        return ["ok", "Correcto: más línea alarga la catenaria, el tiro llega horizontal al ancla y vuelve a clavarse. Comprueba que el nuevo círculo de borneo sigue libre."];
      },
      acortar: () => {
        st.filada = Math.max(Math.ceil(st.depth * 1.5), st.filada - Math.round(st.depth * 2)); syncInputs(); readout();
        return ["bad", "Error: acortar la línea levanta el tiro y el ancla zarpa aún más. Ante el garreo NUNCA se reduce la línea."];
      },
      maquina: () => { sim.engineT = 25; return ["ok", "Válido: la máquina avante quita tensión a la cadena mientras preparas filar más o levar. Es una medida temporal."]; },
      segunda: () => { sim.second = true; return ["ok", "Válido: una segunda ancla aumenta el agarre (fondo de mal tiempo). Vigila que las líneas no se enreden al bornear."]; },
      levar: () => {
        const bad = FONDOS[st.fondo].hold < 1;
        if (bad) st.fondo = "arena";
        st.filada = Math.min(st.total, rec("malo")[0]);
        if (st.total < st.filada) st.total = Math.ceil(st.filada / 5) * 5;
        sim.anchor = { ...sim.anchor }; sim.a0 = { ...sim.anchor }; sim.trail = []; sim.detected = false; sim.okT = 0;
        syncInputs(); readout();
        $("[data-alarm]").hidden = true;
        return ["ok", `Correcto: levar y volver a fondear${bad ? " en arena (mejor tenedero)" : ""}, filando lo necesario para mal tiempo (${fmt(st.filada)} m).`];
      },
      ignorar: () => ["bad", "Error: una alarma de fondeo se comprueba siempre. Con referencias, GPS y sonda confirmas el garreo y actúas antes de acabar en la costa o sobre otro barco."]
    };
    on($(".mf-actions"), "click", (e) => {
      const b = e.target.closest("[data-do]"); if (!b) return;
      const [k, msg] = ACT[b.dataset.do]();
      const fb = $("[data-fb]");
      fb.className = "small mf-fb " + (k === "ok" ? "fb-ok" : "fb-bad");
      fb.textContent = msg;
      if (k === "ok" && !awarded.has(b.dataset.do)) { awarded.add(b.dataset.do); ctx.award(10, "Respuesta correcta al garreo"); }
      if (b.dataset.do === "levar") { ctx.toast(msg); }
      if (!sim.running && !sim.grounded) { sim.running = true; startLoop(); }
      draw();
    });

    // ---------- Canvas ----------
    const stage = $("[data-stage]"), cv = stage.querySelector("canvas"), g2 = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, col = {};
    const readCols = () => {
      const cs = getComputedStyle(document.documentElement);
      for (const k of ["paper", "sheet", "sea", "sea-2", "ink", "muted", "line", "accent", "warn", "bad", "ok", "stbd", "buoy-y", "port"]) col[k] = cs.getPropertyValue("--" + k).trim();
      col.font = cs.getPropertyValue("--f-body").trim() || "sans-serif";
      col.mono = cs.getPropertyValue("--f-mono").trim() || "monospace";
    };
    function resize() {
      const w = stage.clientWidth; if (!w) return;
      const h = Math.round(Math.max(280, Math.min(w * 0.78, 520)));
      stage.style.height = h + "px";
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); W = w; H = h;
      draw();
    }
    let roRaf = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(roRaf); roRaf = requestAnimationFrame(() => { if (stage.clientWidth !== W) resize(); }); });
    cleanups.push(() => cancelAnimationFrame(roRaf)); ro.observe(stage); cleanups.push(() => ro.disconnect());
    cleanups.push(ctx.onTheme(() => { readCols(); draw(); }));
    readCols();

    function text(t, x, y, o = {}) {
      g2.font = `${o.w || 600} ${o.s || 12}px ${o.mono ? col.mono : col.font}`;
      g2.fillStyle = o.c || col.ink; g2.textAlign = o.a || "left"; g2.textBaseline = o.b || "alphabetic";
      if (o.halo) { g2.lineWidth = 3; g2.strokeStyle = col.sea; g2.strokeText(t, x, y); }
      g2.fillText(t, x, y);
    }
    function arrow(x1, y1, x2, y2, c, w = 2) {
      const a = Math.atan2(y2 - y1, x2 - x1);
      g2.strokeStyle = c; g2.fillStyle = c; g2.lineWidth = w;
      g2.beginPath(); g2.moveTo(x1, y1); g2.lineTo(x2, y2); g2.stroke();
      g2.beginPath(); g2.moveTo(x2, y2); g2.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4)); g2.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4)); g2.closePath(); g2.fill();
    }
    function anchorGlyph(x, y, s, c, rot = 0) {
      g2.save(); g2.translate(x, y); g2.rotate(rot); g2.strokeStyle = c; g2.lineWidth = 2; g2.lineCap = "round";
      g2.beginPath(); g2.arc(0, -s, s * 0.28, 0, 7); g2.moveTo(0, -s * 0.72); g2.lineTo(0, s * 0.8);
      g2.moveTo(-s * 0.5, -s * 0.35); g2.lineTo(s * 0.5, -s * 0.35);
      g2.moveTo(-s * 0.8, s * 0.2); g2.quadraticCurveTo(-s * 0.6, s * 0.95, 0, s * 0.8); g2.quadraticCurveTo(s * 0.6, s * 0.95, s * 0.8, s * 0.2);
      g2.stroke(); g2.restore();
    }
    function hull(x, y, len, beam, headingRad, fill, stroke) {
      g2.save(); g2.translate(x, y); g2.rotate(headingRad);
      const L2 = len / 2, b2 = beam / 2;
      g2.beginPath(); g2.moveTo(0, -L2);
      g2.bezierCurveTo(b2 * 0.7, -L2 * 0.7, b2, -L2 * 0.2, b2, L2 * 0.25);
      g2.lineTo(b2 * 0.85, L2); g2.lineTo(-b2 * 0.85, L2); g2.lineTo(-b2, L2 * 0.25);
      g2.bezierCurveTo(-b2, -L2 * 0.2, -b2 * 0.7, -L2 * 0.7, 0, -L2); g2.closePath();
      g2.fillStyle = fill; g2.fill(); g2.strokeStyle = stroke; g2.lineWidth = 1.5; g2.stroke(); g2.restore();
    }

    function draw() {
      if (!W) return;
      g2.setTransform(dpr, 0, 0, dpr, 0, 0);
      g2.clearRect(0, 0, W, H);
      g2.fillStyle = col.sea; g2.fillRect(0, 0, W, H);
      if (st.view === "cenital") drawTop(); else drawSide();
    }

    function drawTop() {
      const R = radius();
      const xs = Math.max(R + 20, 75), yHi = COAST + 14, yLo = Math.max(R + 15, 70);
      const sc = Math.min(W / (2 * xs), H / (yHi + yLo));
      const top = (H - (yHi + yLo) * sc) / 2, cx = W / 2;
      const P = (x, y) => [cx + x * sc, top + (yHi - y) * sc];
      // isobatas
      g2.strokeStyle = col["sea-2"]; g2.lineWidth = 1;
      for (let d = 2; d < st.depth * 2.5; d += Math.max(2, Math.round(st.depth / 3))) {
        const y = COAST - d * COAST / st.depth; const [, py] = P(0, y);
        if (py < 0 || py > H) continue;
        g2.setLineDash([2, 6]); g2.beginPath(); g2.moveTo(0, py); g2.lineTo(W, py); g2.stroke(); g2.setLineDash([]);
        text(fmt(d) + " m", 6, py - 3, { s: 10, c: col.muted, mono: true });
      }
      // costa
      const [, cy0] = P(0, COAST);
      g2.fillStyle = col.paper; g2.beginPath(); g2.moveTo(0, 0); g2.lineTo(W, 0); g2.lineTo(W, cy0);
      for (let x = W; x >= 0; x -= 12) g2.lineTo(x, cy0 - 4 * Math.sin(x / 23) - 3);
      g2.closePath(); g2.fill(); g2.strokeStyle = col.ink; g2.lineWidth = 1.5; g2.stroke();
      text("Costa", 8, Math.max(14, cy0 - 12), { s: 12, c: col.muted });
      // fondo en el ancla
      if (st.fondo === "posidonia" || st.fondo === "algas" || st.fondo === "roca") {
        const [ax, ay] = P(sim.a0.x, sim.a0.y);
        g2.save(); g2.globalAlpha = 0.5; g2.strokeStyle = st.fondo === "roca" ? col.muted : col.stbd; g2.lineWidth = 1.5;
        for (let i = 0; i < 60; i++) {
          const a = i * 2.4, r = Math.sqrt(i) * sc * 3.2; const x = ax + Math.cos(a) * r, y = ay + Math.sin(a) * r;
          g2.beginPath();
          if (st.fondo === "roca") g2.rect(x - 3, y - 2, 6, 4); else { g2.moveTo(x, y + 4); g2.quadraticCurveTo(x + 3, y, x, y - 5); }
          g2.stroke();
        }
        g2.restore();
      }
      // otros barcos
      const brgO = (sim.wind + 180) % 360;
      OTHERS.forEach((o) => {
        const over = Math.hypot(o.x - sim.a0.x, o.y - sim.a0.y) < R + o.r;
        const [ox, oy] = P(o.x, o.y);
        g2.setLineDash([4, 5]); g2.strokeStyle = over ? col.warn : col.muted; g2.lineWidth = over ? 2 : 1;
        g2.beginPath(); g2.arc(ox, oy, o.r * sc, 0, 7); g2.stroke(); g2.setLineDash([]);
        anchorGlyph(ox, oy, 5, col.muted);
        const d = o.r - o.L * 0.6, bx = o.x + Math.sin(rad(brgO)) * d, by = o.y + Math.cos(rad(brgO)) * d;
        const [px, py] = P(bx, by);
        g2.strokeStyle = col.muted; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(ox, oy); g2.lineTo(px, py); g2.stroke();
        hull(px, py, Math.max(10, o.L * sc), Math.max(4, o.L * 0.35 * sc), rad(brgO + 180), col.sheet, col.muted);
      });
      // enfilación (W, a la altura del ancla)
      const [a0x, a0y] = P(sim.a0.x, sim.a0.y);
      if (st.aids.enf) {
        g2.strokeStyle = col.accent; g2.globalAlpha = 0.55; g2.setLineDash([8, 4]); g2.lineWidth = 1.2;
        g2.beginPath(); g2.moveTo(0, a0y); g2.lineTo(W, a0y); g2.stroke(); g2.setLineDash([]); g2.globalAlpha = 1;
        g2.fillStyle = col.accent; g2.beginPath(); g2.moveTo(4, a0y - 9); g2.lineTo(12, a0y); g2.lineTo(4, a0y + 9); g2.closePath(); g2.fill();
        text("Enfilación faro–torre (al W)", 16, a0y - 6, { s: 10, c: col.accent, halo: true });
      }
      // círculos
      g2.setLineDash([7, 5]); g2.strokeStyle = col.accent; g2.lineWidth = 2;
      g2.beginPath(); g2.arc(a0x, a0y, R * sc, 0, 7); g2.stroke(); g2.setLineDash([]);
      if (st.aids.gps) { g2.setLineDash([2, 4]); g2.strokeStyle = col.warn; g2.lineWidth = 1.5; g2.beginPath(); g2.arc(a0x, a0y, (R + 3) * sc, 0, 7); g2.stroke(); g2.setLineDash([]); }
      // rastro de garreo
      if (sim.trail.length) {
        g2.strokeStyle = col.bad; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(a0x, a0y);
        sim.trail.forEach((p) => { const [x, y] = P(p.x, p.y); g2.lineTo(x, y); }); g2.stroke();
      }
      // cadena y barco
      const [ax, ay] = P(sim.anchor.x, sim.anchor.y);
      const b = sim.boat || boatPos(geom());
      const bowD = geom().hx;
      const [bwx, bwy] = P(sim.anchor.x + Math.sin(rad(sim.brg)) * bowD, sim.anchor.y + Math.cos(rad(sim.brg)) * bowD);
      g2.strokeStyle = col.ink; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(ax, ay); g2.lineTo(bwx, bwy); g2.stroke();
      anchorGlyph(ax, ay, 7, sim.dragging ? col.bad : col.ink);
      const [bx, by] = P(b.x, b.y);
      hull(bx, by, Math.max(14, st.eslora * sc), Math.max(6, st.eslora * 0.36 * sc), rad(sim.brg + 180), col.sheet, sim.dragging ? col.bad : col.ink);
      // viento
      const wx = W - 50, wy = 48;
      g2.strokeStyle = col.line; g2.lineWidth = 1; g2.beginPath(); g2.arc(wx, wy, 30, 0, 7); g2.stroke();
      text("N", wx, wy - 34, { a: "center", s: 10, c: col.muted });
      const to = rad(sim.wind + 180);
      arrow(wx - Math.sin(to) * 26, wy + Math.cos(to) * 26, wx + Math.sin(to) * 22, wy - Math.cos(to) * 22, col.accent, 2.5);
      text(`Viento ${String(Math.round(sim.wind)).padStart(3, "0")}° · ${effWeather() === "malo" ? "fuerte" : "flojo"}`, W - 6, wy + 46, { a: "right", s: 10, c: col.ink, halo: true });
      // escala
      const sm = sc * 10 > 40 ? 10 : sc * 20 > 40 ? 20 : 50, sx = W - 12 - sm * sc;
      g2.strokeStyle = col.ink; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(sx, H - 14); g2.lineTo(W - 12, H - 14); g2.stroke();
      text(sm + " m", (sx + W - 12) / 2, H - 19, { a: "center", s: 10, mono: true });
      // panel de ayudas
      const lines = [];
      const R3 = R + 3, dist = Math.hypot(b.x - sim.a0.x, b.y - sim.a0.y);
      if (st.aids.gps) lines.push([`GPS ancla: ${fmt(dist)} / ${fmt(R3)} m`, dist > R3 ? col.bad : col.ink]);
      const minA = depthAt(sim.a0.y + R) - 0.5;
      if (st.aids.sonda) lines.push([minA > 0.5 ? `Sonda: ${fmt(Math.max(0, depthAt(b.y)), 1)} m (alarma < ${fmt(minA, 1)})` : "Sonda: círculo alcanza la costa", minA > 0.5 && depthAt(b.y) < minA ? col.bad : col.ink]);
      if (st.aids.enf) { const off = b.y - sim.a0.y; lines.push([`Enfilación: ${Math.abs(off) > R + 2 ? "abierta, fuera del borneo" : "dentro de lo esperado"}`, Math.abs(off) > R + 2 ? col.bad : col.ink]); }
      if (lines.length) {
        const bw = 196, bh = 8 + lines.length * 16;
        g2.fillStyle = col.sheet; g2.globalAlpha = 0.9; g2.fillRect(8, H - bh - 30, bw, bh); g2.globalAlpha = 1;
        g2.strokeStyle = col.line; g2.strokeRect(8, H - bh - 30, bw, bh);
        lines.forEach(([t, c], i) => text(t, 14, H - bh - 30 + 17 + i * 16, { s: 11, c, mono: true, w: 400 }));
      }
      if (sim.grounded) text("VARADO", W / 2, H / 2, { a: "center", s: 26, c: col.bad, w: 700, halo: true });
    }

    function drawSide() {
      const g = geom(), h = st.depth, L = st.filada;
      const surf = H * 0.3, bed = H * 0.86, padL = 34, padR = 30;
      const Xtot = g.hx + st.eslora + 2;
      const sx = (W - padL - padR) / Xtot;
      const sy = (bed - surf) / h;
      const ex = sy / sx;
      const X = (x) => padL + x * sx, Y = (d) => surf + d * sy;
      // cielo
      g2.fillStyle = col.paper; g2.fillRect(0, 0, W, surf);
      g2.strokeStyle = col["sea-2"]; g2.lineWidth = 2; g2.beginPath();
      for (let x = 0; x <= W; x += 6) g2.lineTo(x, surf + Math.sin(x / 14) * 1.5); g2.stroke();
      // fondo
      g2.fillStyle = col["sea-2"]; g2.fillRect(0, bed, W, H - bed);
      g2.strokeStyle = col.ink; g2.lineWidth = 1.5; g2.beginPath(); g2.moveTo(0, bed); g2.lineTo(W, bed); g2.stroke();
      g2.save(); g2.globalAlpha = 0.55;
      for (let x = 4; x < W; x += 9) {
        const y = bed + 6 + ((x * 7) % 11);
        if (st.fondo === "arena") { g2.fillStyle = col.muted; g2.fillRect(x, y, 2, 2); }
        else if (st.fondo === "fango") { g2.strokeStyle = col.muted; g2.beginPath(); g2.moveTo(x, y); g2.quadraticCurveTo(x + 3, y - 3, x + 7, y); g2.stroke(); }
        else if (st.fondo === "roca") { g2.strokeStyle = col.ink; g2.strokeRect(x, bed - 4 + ((x * 3) % 5), 8, 6); x += 6; }
        else { g2.strokeStyle = st.fondo === "posidonia" ? col.stbd : col.ok; g2.lineWidth = 1.5; g2.beginPath(); g2.moveTo(x, bed); g2.quadraticCurveTo(x + 4, bed - 8, x + 1, bed - (st.fondo === "posidonia" ? 18 : 11)); g2.stroke(); }
      }
      g2.restore();
      text(FONDOS[st.fondo].n, W - 8, H - 8, { a: "right", s: 11, c: col.ink });
      // línea
      const lineCol = sim.dragging ? col.bad : col.ink;
      g2.strokeStyle = lineCol; g2.lineWidth = st.linea === "cadena" ? 3 : 2;
      g2.beginPath(); g2.moveTo(X(0), Y(h));
      if (g.mode === "vertical") g2.lineTo(X(0), Y(0));
      else {
        g2.lineTo(X(g.lie), Y(h));
        const n = 40;
        for (let i = 1; i <= n; i++) { const u = g.xs * i / n; const up = g.a * (Math.cosh(u / g.a) - 1); g2.lineTo(X(g.lie + u), Y(h - Math.min(h, up))); }
      }
      g2.stroke();
      if (g.mode === "ok" && g.lie > 0) {
        text(`${fmt(g.lie)} m apoyados en el fondo`, X(g.lie / 2), bed - 8, { a: "center", s: 11, c: col.ok, halo: true });
      }
      // ancla
      const tilt = g.mode === "lifted" ? -0.6 : 0;
      anchorGlyph(X(0), Y(h) - 6, 8, lineCol, tilt);
      if (g.mode === "lifted") {
        arrow(X(0) + 10, Y(h) - 4, X(0) + 22, Y(h) - 26, col.bad, 2);
        text("Tiro inclinado: el ancla tiende a zarpar", X(0) + 26, Y(h) - 30, { s: 11, c: col.bad, halo: true });
      }
      // orinque
      g2.strokeStyle = col.warn; g2.lineWidth = 1.2; g2.setLineDash([4, 3]);
      const bx = Math.max(10, X(0) - 18);
      g2.beginPath(); g2.moveTo(X(0), Y(h) - 12); g2.quadraticCurveTo(X(0) - 30, (Y(h) + surf) / 2, bx, surf); g2.stroke(); g2.setLineDash([]);
      g2.fillStyle = col["buoy-y"]; g2.beginPath(); g2.arc(bx, surf - 3, 5, 0, 7); g2.fill(); g2.strokeStyle = col.ink; g2.lineWidth = 1; g2.stroke();
      text("orinque", bx + 6, (Y(h) + surf) / 2, { s: 10, c: col.muted, halo: true });
      // barco (proa a la izquierda, hacia el ancla)
      const bowX = X(g.hx), sternX = X(g.hx + st.eslora), fb = Math.max(10, Math.min(26, 1.2 * sy));
      g2.fillStyle = col.sheet; g2.strokeStyle = col.ink; g2.lineWidth = 1.5;
      g2.beginPath(); g2.moveTo(bowX - 6, surf - fb); g2.lineTo(sternX, surf - fb * 0.8); g2.lineTo(sternX - 4, surf + 5); g2.quadraticCurveTo(bowX + 10, surf + 9, bowX, surf); g2.closePath(); g2.fill(); g2.stroke();
      g2.fillStyle = col.ink; g2.fillRect(bowX + (sternX - bowX) * 0.45, surf - fb - 9, (sternX - bowX) * 0.3, 9);
      // cota de sonda
      const dimX = Math.min(W - 12, sternX + 14);
      g2.strokeStyle = col.muted; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(dimX, surf); g2.lineTo(dimX, bed); g2.stroke();
      text(`${fmt(h, 1)} m`, dimX - 4, (surf + bed) / 2, { a: "right", s: 11, mono: true, halo: true });
      // viento
      arrow(W * 0.35, surf * 0.35, W * 0.35 + 50, surf * 0.35, col.accent, 2.5);
      text(`Viento · ${effWeather() === "malo" ? "mal tiempo" : "buen tiempo"}`, W * 0.35 + 58, surf * 0.35 + 4, { s: 11, c: col.accent });
      // rótulos
      text(`Filada ${fmt(L)} m = ${fmt(L / h, 1)}× sonda · ${LINEAS[st.linea].n}`, 10, 18, { s: 12 });
      const r = rec(effWeather());
      text(`Recomendado ${r[0]}–${r[1]} m`, 10, 34, { s: 11, c: L < r[0] ? col.bad : col.ok });
      if (ex > 1.2) text(`escala vertical ×${fmt(ex, 1)}`, W - 8, 18, { a: "right", s: 10, c: col.muted });
      if (g.mode === "vertical") text("Línea a pique: no hay agarre", X(0) + 12, Y(h / 2), { s: 11, c: col.bad, halo: true });
    }

    // ---------- Bucle ----------
    let raf = 0, last = 0, visible = true;
    function frame(t) {
      raf = 0;
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      step(reduced ? Math.max(dt, 0.05) : dt);
      draw();
      if (sim.running && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function startLoop() { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible && sim.running) startLoop(); else stopLoop(); });
    io.observe(stage); cleanups.push(() => io.disconnect());
    on(document, "visibilitychange", () => { if (document.hidden) stopLoop(); else if (sim.running) startLoop(); });

    // ---------- Procedimiento ----------
    let plist = "fondear", pi = 0, playT = 0;
    const svg = $("[data-svg]");
    function stepSVG(s) {
      const surf = 48, bed = 136, ax = 70;
      const parts = [];
      parts.push(`<rect x="0" y="0" width="320" height="${surf}" style="fill:var(--paper)"/>`);
      parts.push(`<rect x="0" y="${bed}" width="320" height="${160 - bed}" style="fill:var(--sea-2)"/>`);
      parts.push(`<line x1="0" y1="${surf}" x2="320" y2="${surf}" style="stroke:var(--sea-2);stroke-width:2"/>`);
      parts.push(`<line x1="0" y1="${bed}" x2="320" y2="${bed}" style="stroke:var(--ink);stroke-width:1.2"/>`);
      const bx = s.bx;
      const bow = bx - 26;
      // barco (proa a la izquierda)
      parts.push(`<path d="M${bow} ${surf - 12} L${bx + 26} ${surf - 10} L${bx + 23} ${surf + 4} Q${bow + 10} ${surf + 7} ${bow} ${surf} Z" style="fill:var(--sheet);stroke:var(--ink);stroke-width:1.5"/>`);
      parts.push(`<rect x="${bx - 4}" y="${surf - 20}" width="14" height="8" style="fill:var(--ink)"/>`);
      const anc = (x, y, rot = 0, c = "var(--ink)") => `<g transform="translate(${x} ${y}) rotate(${rot})" style="stroke:${c};stroke-width:2;fill:none;stroke-linecap:round"><circle cx="0" cy="-9" r="2.5"/><path d="M0 -6 V7 M-5 -3 H5 M-7 2 Q-5 9 0 7 Q5 9 7 2"/></g>`;
      let ancX = ax, ancY = bed - 7;
      if (s.anchor === "bow") { ancX = bow + 4; ancY = surf - 4; }
      if (s.anchor === "pendura") { ancX = bow - 2; ancY = surf + 26; parts.push(`<line x1="${bow}" y1="${surf - 6}" x2="${ancX}" y2="${ancY - 10}" style="stroke:var(--ink);stroke-width:2.5"/>`); }
      if (s.anchor === "zarpa") { ancX = bx - 28; ancY = bed - 22; }
      if (s.anchor === "clara") { ancX = bow - 4; ancY = surf + 10; }
      if (s.anchor === "bottom" || s.anchor === "zarpa") {
        if (s.anchor === "bottom") ancX = s.chain === "vertical" ? bx - 28 : ax;
      }
      if (s.chain === "vertical") parts.push(`<line x1="${bow - 2}" y1="${surf - 6}" x2="${ancX}" y2="${ancY - 10}" style="stroke:var(--ink);stroke-width:2.5"/>`);
      if (s.chain === "cat") {
        const lie = ancX + s.lie;
        parts.push(`<path d="M${ancX + 6} ${bed - 1} L${lie} ${bed - 1} Q${bow - 8} ${bed - 2} ${bow - 2} ${surf - 6}" style="stroke:var(--ink);stroke-width:2.5;fill:none"/>`);
      }
      parts.push(anc(ancX, ancY, s.anchor === "zarpa" ? -20 : 0));
      if (s.buoy && s.anchor !== "bow") {
        const ox = Math.max(14, ancX - 26);
        parts.push(`<path d="M${ancX} ${ancY - 9} Q${ancX - 24} ${(ancY + surf) / 2} ${ox} ${surf}" style="stroke:var(--warn);stroke-width:1.2;fill:none;stroke-dasharray:4 3"/>`);
        parts.push(`<circle cx="${ox}" cy="${surf - 3}" r="5" style="fill:var(--buoy-y);stroke:var(--ink)"/>`);
      }
      if (s.arrow) {
        const dir = s.arrow === "avante" ? -1 : 1, x0 = bx + (dir < 0 ? 10 : -10);
        parts.push(`<line x1="${x0}" y1="22" x2="${x0 + dir * 44}" y2="22" style="stroke:var(--accent);stroke-width:2.5"/><path d="M${x0 + dir * 50} 22 l${-dir * 9} -5 v10 Z" style="fill:var(--accent)"/>`);
        parts.push(`<text x="${x0 + dir * 22}" y="15" text-anchor="middle" style="fill:var(--accent);font:600 10px var(--f-body)">${s.arrow === "avante" ? "avante poca" : "arrancada atrás"}</text>`);
      }
      if (s.wind) parts.push(`<line x1="20" y1="14" x2="58" y2="14" style="stroke:var(--muted);stroke-width:2"/><path d="M64 14 l-8 -4 v8 Z" style="fill:var(--muted)"/><text x="20" y="32" style="fill:var(--muted);font:600 10px var(--f-body)">viento</text>`);
      if (s.refs) parts.push(`<text x="6" y="16" style="fill:var(--accent);font:600 10px var(--f-body)">enfilaciones · GPS ancla · alarma de sonda</text><circle cx="${bx + 40}" cy="18" r="5" style="fill:var(--ink)"/><text x="${bx + 48}" y="22" style="fill:var(--ink);font:600 9px var(--f-body)">bola</text>`);
      return parts.join("");
    }
    function renderStep() {
      const L = PROC[plist];
      $("[data-steps]").innerHTML = L.map((s, i) => `<li><button class="btn sm" data-si="${i}" ${i === pi ? 'aria-current="step"' : ""}><span class="n">${i + 1}</span>${s.t}</button></li>`).join("");
      const s = L[pi];
      svg.innerHTML = stepSVG(s.s);
      svg.setAttribute("aria-label", s.t);
      $("[data-step-t]").textContent = `${pi + 1}. ${s.t}`;
      $("[data-step-d]").textContent = s.d;
      $('[data-act="prev"]').disabled = pi === 0;
      $('[data-act="next"]').disabled = pi === L.length - 1;
    }
    const stopPlay = () => { if (playT) clearInterval(playT); playT = 0; $('[data-act="play"]').textContent = "Reproducir"; };
    cleanups.push(stopPlay);
    on($('[data-g="proc"]'), "click", (e) => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      plist = b.dataset.v; pi = 0; stopPlay();
      $$('[data-g="proc"] button').forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      renderStep(); newOrder();
    });
    on($("[data-steps]"), "click", (e) => { const b = e.target.closest("[data-si]"); if (!b) return; pi = +b.dataset.si; stopPlay(); renderStep(); });
    on($('[data-act="prev"]'), "click", () => { pi = Math.max(0, pi - 1); stopPlay(); renderStep(); });
    on($('[data-act="next"]'), "click", () => { pi = Math.min(PROC[plist].length - 1, pi + 1); stopPlay(); renderStep(); });
    on($('[data-act="play"]'), "click", () => {
      if (playT) return stopPlay();
      if (pi >= PROC[plist].length - 1) pi = 0;
      renderStep();
      $('[data-act="play"]').textContent = "Pausa";
      playT = setInterval(() => { if (pi >= PROC[plist].length - 1) return stopPlay(); pi++; renderStep(); }, reduced ? 4500 : 3200);
    });

    // ordenar
    let ord = [], ordNext = 0, ordErr = 0;
    function newOrder() {
      ord = shuffle(PROC[plist].map((s, i) => i)); ordNext = 0; ordErr = 0;
      $("[data-order]").innerHTML = ord.map((i) => `<button class="btn sm" data-oi="${i}">${PROC[plist][i].t}</button>`).join("");
      $("[data-seq]").innerHTML = ""; $("[data-ofb]").textContent = ""; $("[data-ofb]").className = "small mf-fb";
    }
    on($('[data-act="order"]'), "click", newOrder);
    on($("[data-order]"), "click", (e) => {
      const b = e.target.closest("[data-oi]"); if (!b || b.disabled) return;
      const i = +b.dataset.oi, fb = $("[data-ofb]");
      if (i === ordNext) {
        b.disabled = true; b.classList.add("done");
        $("[data-seq]").insertAdjacentHTML("beforeend", `<li>${PROC[plist][i].t}</li>`);
        ordNext++;
        if (ordNext === PROC[plist].length) {
          fb.className = "small mf-fb fb-ok";
          fb.textContent = ordErr ? `Completado con ${ordErr} fallo(s). Repite hasta hacerlo sin errores.` : "Perfecto: maniobra ordenada sin fallos.";
          const k = "ord-" + plist;
          if (!ordErr && !awarded.has(k)) { awarded.add(k); ctx.award(20, `Maniobra de ${plist === "fondear" ? "fondeo" : "levar"} ordenada`); }
        } else { fb.className = "small mf-fb fb-ok"; fb.textContent = "Bien."; }
      } else {
        ordErr++; b.classList.add("shake"); setTimeout(() => b.classList.remove("shake"), 600);
        fb.className = "small mf-fb fb-bad"; fb.textContent = `No toca todavía. Pista: «${PROC[plist][ordNext].d.split(".")[0]}».`;
      }
    });

    // ---------- Quiz ----------
    let qmode = "teoria", qset = [], qi = 0, qok = 0, answered = false;
    function genCalc() {
      const items = [];
      for (let n = 0; n < 5; n++) {
        const E = 5 + Math.round(Math.random() * 18) / 2, S = 3 + Math.round(Math.random() * 12), mal = Math.random() < 0.5;
        const m = mal ? 5 : 3, t = Math.floor(Math.random() * 3);
        let q, ans, ds, e;
        if (t === 0) {
          q = `Eslora ${fmt(E, 1)} m, sonda ${S} m, ${mal ? "mal" : "buen"} tiempo, toda cadena. ¿Radio mínimo del círculo de borneo?`;
          ans = S * m + E; ds = [S * m, S * m + E / 2, S * (mal ? 3 : 5) + E]; e = `Cadena mínima ${m}× ${S} = ${S * m} m, más la eslora ${fmt(E, 1)} m = ${fmt(ans, 1)} m.`;
        } else if (t === 1) {
          q = `Eslora ${fmt(E, 1)} m. ¿Longitud mínima de la línea de fondeo a bordo (RD 339/2021)?`;
          ans = 5 * E; ds = [3 * E, 4 * E, 2 * E]; e = `5 esloras: 5 × ${fmt(E, 1)} = ${fmt(ans, 1)} m.`;
        } else {
          q = `Sonda ${S} m, ${mal ? "mal" : "buen"} tiempo, toda cadena. ¿Cadena mínima a filar?`;
          ans = S * m; ds = [S * (mal ? 3 : 5), S * 2, S * m + 10]; e = `${mal ? "Mal tiempo 5–6×" : "Buen tiempo 3–4×"} la sonda: mínimo ${m} × ${S} = ${ans} m.`;
        }
        const opts = [...new Set([ans, ...ds].map((v) => Math.round(v * 10) / 10))];
        while (opts.length < 4) opts.push(Math.round((ans + opts.length * 7) * 10) / 10);
        items.push({ q, o: opts.map((v) => fmt(v, 1) + " m"), e, id: "cálculo", calc: true });
      }
      return items;
    }
    function startQuiz() {
      qset = qmode === "teoria" ? shuffle(QUIZ).slice(0, 10) : genCalc();
      qi = 0; qok = 0; renderQ();
    }
    function renderQ() {
      answered = false;
      const nx = $('[data-act="qnext"]'); nx.hidden = true;
      $("[data-qfb]").textContent = ""; $("[data-qfb]").className = "small mf-fb";
      if (qi >= qset.length) {
        const best = ctx.store.get("best-" + qmode, 0);
        if (qok > best) ctx.store.set("best-" + qmode, qok);
        $("[data-qprog]").textContent = `Resultado ${qok}/${qset.length}`;
        $("[data-qq]").textContent = qok >= Math.ceil(qset.length * 0.8) ? "¡Aprobado con holgura!" : "Repasa las explicaciones y vuelve a intentarlo.";
        $("[data-qo]").innerHTML = `<button class="btn primary" data-restart>Otra ronda</button>`;
        $("[data-qsrc]").textContent = `Mejor marca: ${Math.max(best, qok)}/${qset.length}`;
        const k = "quiz-" + qmode;
        if (qmode === "teoria" && qok >= 8 && !awarded.has(k)) { awarded.add(k); ctx.award(30, "Quiz de fondeo superado"); }
        return;
      }
      const it = qset[qi];
      $("[data-qprog]").textContent = `Pregunta ${qi + 1}/${qset.length} · aciertos ${qok}`;
      $("[data-qq]").textContent = it.q;
      const order = shuffle(it.o.map((_, i) => i));
      $("[data-qo]").innerHTML = order.map((i) => `<button class="btn" data-oi="${i}">${it.o[i]}</button>`).join("");
      $("[data-qsrc]").textContent = it.calc ? "" : `Basada en la pregunta oficial ${it.id}`;
    }
    on($("[data-qo]"), "click", (e) => {
      if (e.target.closest("[data-restart]")) return startQuiz();
      const b = e.target.closest("[data-oi]"); if (!b || answered) return;
      answered = true;
      const it = qset[qi], ok = +b.dataset.oi === 0;
      $$("[data-qo] [data-oi]").forEach((x) => { x.disabled = true; if (+x.dataset.oi === 0) x.classList.add("is-ok"); });
      if (!ok) b.classList.add("is-bad");
      if (ok) { qok++; ctx.award(it.calc ? 10 : 5, it.calc ? "Cálculo de fondeo" : "Pregunta de fondeo"); }
      const fb = $("[data-qfb]");
      fb.className = "small mf-fb " + (ok ? "fb-ok" : "fb-bad");
      fb.textContent = (ok ? "Correcto. " : "Incorrecto. ") + it.e;
      const nx = $('[data-act="qnext"]'); nx.hidden = false; nx.focus();
    });
    on($('[data-act="qnext"]'), "click", () => { qi++; renderQ(); });
    on($('[data-g="qmode"]'), "click", (e) => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      qmode = b.dataset.v;
      $$('[data-g="qmode"] button').forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      startQuiz();
    });

    // ---------- Inicio ----------
    st.filada = rec()[1];
    if (st.total < minLine()) st.total = Math.ceil(minLine() / 5) * 5;
    syncInputs(); resetSim(); renderStep(); newOrder(); startQuiz();
    requestAnimationFrame(resize);

    return () => { stopLoop(); cleanups.forEach((f) => { try { f(); } catch {} }); el.innerHTML = ""; };
  }
};
