// Terminología náutica (Tema 1 · 1.7) — tarjetas «¿Qué significa…?» con modo estudio y reto cronometrado.
// Definiciones contrastadas con las claves oficiales (q_nom, q_man, q_seg, q_ama).

const ID = "terminologia";
const TIME = 12; // segundos por tarjeta

const CATS = {
  mov: "Movimientos",
  vm: "Viento y mar",
  man: "Maniobra",
  fon: "Fondeo",
};

// grp: términos casi sinónimos que no deben aparecer juntos como opciones.
const TERMS = [
  // Movimientos
  { id: "escorar", t: "Escorar", c: "mov", fig: "heel", grp: "escora",
    d: "Inclinarse la embarcación sobre uno de sus costados (a babor o a estribor).",
    w: "El giro se produce alrededor de un eje longitudinal. Las causas principales son la distribución de pesos y la acción del viento o del oleaje." },
  { id: "adrizar", t: "Adrizar", c: "mov", fig: "upright",
    d: "Enderezarse o poner vertical una embarcación que estaba inclinada; es la acción contraria a escorar.",
    w: "En el examen: «la acción contraria a escorar se denomina adrizar»." },
  { id: "escora", t: "Escora", c: "mov", fig: "heel", grp: "escora",
    d: "Inclinación del buque hacia un costado por la acción del viento u otra fuerza; se mide en grados.",
    w: "Si el centro de gravedad no está en el plano de crujía (sin fuerzas externas), la embarcación queda escorada." },
  { id: "balance", t: "Balance (balancear)", c: "mov", fig: "roll",
    d: "Movimiento oscilante en el sentido de la manga, inclinándose alternativamente a babor y a estribor.",
    w: "Es transversal. Si el periodo de balance coincide con el de la ola (sincronismo) puede llegar a volcar: se rompe variando rumbo o velocidad." },
  { id: "cabezada", t: "Cabezada (cabecear)", c: "mov", fig: "pitch",
    d: "Movimiento oscilante en el sentido de la eslora: la proa sube y baja alternativamente y la popa al contrario.",
    w: "Es longitudinal. Con mar de proa y cabezadas excesivas: reducir velocidad y variar ligeramente el rumbo." },
  { id: "arfada", t: "Arfada", c: "mov", fig: "heave",
    d: "Movimiento vertical de subida y bajada de todo el casco al paso de las olas.",
    w: "No confundir con el balance (transversal) ni con la cabezada (longitudinal). En lenguaje tradicional «arfar» también se usa como levantar la proa con la marejada." },
  { id: "guinada", t: "Guiñada", c: "mov", fig: "yaw",
    d: "Desvío brusco de la proa hacia una u otra banda respecto del rumbo que se lleva.",
    w: "La produce la mar (sobre todo de popa o aleta), el viento o un mal gobierno; el giro es alrededor de un eje vertical." },
  { id: "abatimiento", t: "Abatimiento (abatir)", c: "mov", fig: "leeway",
    d: "Desplazamiento lateral de la embarcación hacia sotavento causado por el viento; su ángulo es el que forman el rumbo y la derrota por efecto del viento.",
    w: "El viento actúa sobre la obra muerta. «Ángulo entre la orientación verdadera y la derrota causado por el viento» = ángulo de abatimiento." },
  { id: "deriva", t: "Deriva (derivar)", c: "mov", fig: "drift",
    d: "Desplazamiento de la embarcación respecto de su rumbo causado por la corriente.",
    w: "La deriva está relacionada con las corrientes (actúan sobre la obra viva). Es falso que el viento actúe sobre la obra viva produciendo deriva." },

  // Viento y mar
  { id: "barlovento", t: "Barlovento", c: "vm", fig: "windward",
    d: "Lugar desde donde sopla el viento con respecto al observador.",
    w: "Barlovento = de donde VIENE el viento. Las aproximaciones a una boya o a un náufrago se suelen hacer considerando el barlovento." },
  { id: "sotavento", t: "Sotavento", c: "vm", fig: "leeward",
    d: "Parte hacia donde va el viento; la contraria a barlovento.",
    w: "Los manguerotes con mal tiempo se orientan a sotavento para que no entre agua." },
  { id: "socaire", t: "Socaire", c: "vm", fig: "lee",
    d: "Abrigo o resguardo que ofrece algo (la costa, un barco) por su lado de sotavento.",
    w: "Recogiendo a un náufrago o a otro barco se le «da socaire» situándose a su barlovento para protegerlo del viento y la mar." },
  { id: "libre-sota", t: "Libre a sotavento", c: "vm", fig: "leeshore",
    d: "Tener suficiente resguardo de seguridad entre la embarcación y la costa u otros escollos cuando el viento, el oleaje o la corriente tienden a echarnos sobre el peligro.",
    w: "Una costa a sotavento es peligrosa con mal tiempo: hay que ir corrigiendo el rumbo a barlovento para mantenerse libre de ella." },
  { id: "capear", t: "Capear el temporal", c: "vm", fig: "headsea",
    d: "Llevar la mar por la proa o las amuras con poca arrancada, pero la suficiente para gobernar.",
    w: "Trampa: capear NO es parar la arrancada; sin arrancada se pierde el gobierno." },
  { id: "correr", t: "Correr el temporal", c: "vm", fig: "followsea",
    d: "Llevar la mar por la popa o las aletas, a una velocidad que evite sincronizarse con las olas.",
    w: "Trampa: es falso que «correr el temporal» sea recibir el oleaje por la proa (eso es capear)." },
  { id: "banda", t: "Banda", c: "vm", fig: "sides",
    d: "Cada uno de los dos lados de la embarcación, babor (izquierda) y estribor (derecha) mirando a proa, separados por el plano de crujía.",
    w: "El plano de crujía divide la embarcación longitudinalmente en dos mitades: la de babor y la de estribor." },

  // Maniobra
  { id: "arrancada", t: "Arrancada", c: "man", fig: "way",
    d: "Velocidad o inercia que lleva la embarcación, avante o atrás, aunque se haya parado la máquina.",
    w: "El timón solo gobierna si el agua corre por la pala: al perder arrancada se puede perder la capacidad de gobierno." },
  { id: "avante", t: "Ir avante", c: "man", fig: "ahead",
    d: "Moverse la embarcación hacia proa, con la máquina dando empuje hacia delante.",
    w: "Hélice dextrógira avante: gira en el sentido de las agujas del reloj (vista desde popa) y la presión lateral lleva la popa a estribor." },
  { id: "atras", t: "Dar atrás", c: "man", fig: "astern", grp: "atras",
    d: "Invertir el empuje de la máquina para mover la embarcación hacia popa o quitarle la arrancada avante.",
    w: "Con hélice dextrógira, sin arrancada y timón a la vía, al dar atrás la popa cae a babor." },
  { id: "ciar", t: "Ciar", c: "man", fig: "astern", grp: "atras",
    d: "Remar o hacer andar la embarcación hacia atrás, hacia popa.",
    w: "Es el término clásico de la boga (remo); por extensión, retroceder." },
  { id: "via", t: "A la vía", c: "man", fig: "rudder",
    d: "Timón al centro, con la pala alineada con la crujía.",
    w: "En las preguntas de efecto de la hélice: «timón a la vía» = sin metida de timón, solo actúa la hélice." },
  { id: "caer", t: "Caer a una banda", c: "man", fig: "turn",
    d: "Girar la proa de la embarcación hacia esa banda (babor o estribor).",
    w: "Con caña: caña a babor → la proa cae a estribor. Con rueda: rueda a babor → la proa cae a babor." },
  { id: "virar-av", t: "Virar por avante", c: "man", fig: "tack",
    d: "En vela, cambiar de amura pasando la proa por la dirección del viento.",
    w: "Su opuesta es trasluchar (pasar la popa por el viento)." },
  { id: "trasluchar", t: "Trasluchar", c: "man", fig: "gybe",
    d: "En vela, cambiar de amura pasando la popa por la dirección del viento.",
    w: "Maniobra delicada: la botavara cruza bruscamente de banda; hay que cobrar la escota mayor." },
  { id: "ciaboga", t: "Ciaboga (ciabogar)", c: "man", fig: "spin",
    d: "Giro de la embarcación en el menor espacio posible, alternando máquina avante y atrás (o con hélices gemelas, un motor avante y otro atrás).",
    w: "Con hélices gemelas de giro al exterior: avante un motor y atrás el de la banda hacia la que queremos caer." },
  { id: "abarloar", t: "Abarloarse", c: "man", fig: "alongside",
    d: "Situar una embarcación costado con costado junto a otra o junto a un muelle.",
    w: "Se usan defensas entre los costados para amortiguar roces y golpes." },
  { id: "aproado", t: "Aproado", c: "man", fig: "bowdown", grp: "trim",
    d: "Con el calado de proa mayor que el de popa (asiento negativo).",
    w: "Ojo: «aproado al viento» significa además con la proa hacia el viento." },
  { id: "apopado", t: "Apopado", c: "man", fig: "sterndown", grp: "trim",
    d: "Con el calado de popa mayor que el de proa (asiento positivo).",
    w: "Asiento = calado de popa − calado de proa; positivo cuando la popa cala más." },
  { id: "asiento", t: "Asiento", c: "man", fig: "trim", grp: "trim",
    d: "Diferencia entre el calado de popa y el calado de proa; es positivo cuando el calado a popa es mayor.",
    w: "El calado medio, en cambio, es la media aritmética (semisuma) de los calados de proa y popa." },

  // Fondeo
  { id: "virar", t: "Virar (cadena o cabo)", c: "fon", fig: "heave-in",
    d: "Cobrar un cabo o la cadena del ancla con el molinete o cabrestante.",
    w: "El barbotén es la corona del molinete con muescas donde engranan los eslabones." },
  { id: "filar", t: "Filar", c: "fon", fig: "veer",
    d: "Arriar progresivamente un cabo, cable o cadena que está trabajando.",
    w: "Arriar la línea de fondeo = filar cadena. Filar más cadena es una de las soluciones al garreo." },
  { id: "levar", t: "Levar", c: "fon", fig: "anchorup",
    d: "Recoger totalmente el ancla que se tenía trabajando en el fondo.",
    w: "Secuencia: virar → a pique → zarpar → clara y libre → ancla a bordo (levada)." },
  { id: "zarpar", t: "Zarpar (el ancla)", c: "fon", fig: "breakout",
    d: "Momento en que el ancla se desprende del fondo.",
    w: "Trampas oficiales: NO es «el momento en que el ancla toca el fondo» ni, en fondeo, «salir del lugar en que estaba atracado»." },
  { id: "pendura", t: "A la pendura", c: "fon", fig: "pendura",
    d: "Ancla colgando fuera del escobén, sin tocar el fondo, lista para fondear.",
    w: "Se pone el ancla a la pendura para que cuelgue y esté lista para dar fondo en el momento oportuno." },
  { id: "pique", t: "A pique", c: "fon", fig: "pique",
    d: "Cadena en posición vertical, perpendicular a la superficie del mar, con el ancla tocando el fondo.",
    w: "Al levar se vira hasta tener la cadena a pique; un poco más y el ancla zarpa." },
  { id: "clara", t: "Clara y libre", c: "fon", fig: "clear",
    d: "Voz que indica que el ancla ha aflorado a la superficie limpia, sin enredos.",
    w: "Se canta desde proa al ver el ancla fuera del agua sin cabos ni algas enredados." },
  { id: "bornear", t: "Bornear", c: "fon", fig: "swing",
    d: "Girar la embarcación fondeada alrededor de su ancla por efecto del viento o la corriente.",
    w: "Al elegir fondeadero hay que dejar espacio libre para el círculo de borneo." },
  { id: "garrear", t: "Garrear", c: "fon", fig: "drag",
    d: "Arrastrar el ancla por el fondo porque no ha agarrado o se ha soltado, desplazándose la embarcación.",
    w: "Se detecta con referencias a tierra (enfilaciones, demoras) y la alarma de sonda. Soluciones: filar más cadena, cambiar de tenedero, fondear un segundo ancla o aguantar con máquina avante." },
  { id: "tenedero", t: "Tenedero", c: "fon", fig: "bottom",
    d: "Fondo marino considerado según su calidad para que agarre el ancla.",
    w: "Buenos tenederos: fango duro, arena fangosa o arena dura. Malos: roca, arcilla resbaladiza, fondos con mucha pendiente." },
];

/* ---------- Ilustraciones SVG (sin colores literales: clases con tokens) ---------- */
const W = (inner, cls = "") => `<svg viewBox="0 0 160 100" class="fig ${cls}" aria-hidden="true">${inner}</svg>`;
const sea = (y = 66) => `<rect x="0" y="${y}" width="160" height="${100 - y}" class="s-sea"/><path d="M0 ${y} q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" class="s-wave"/>`;
const arrow = (x1, y1, x2, y2, cls = "s-acc") => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 7;
  const p1 = [x2 - h * Math.cos(a - .45), y2 - h * Math.sin(a - .45)], p2 = [x2 - h * Math.cos(a + .45), y2 - h * Math.sin(a + .45)];
  return `<g class="${cls}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><path d="M${x2} ${y2} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z" class="fillc"/></g>`;
};
const txt = (x, y, s, cls = "s-lbl", anchor = "middle") => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
// sección transversal (vista desde popa) con mástil
const sect = (rot = 0, cls = "") => `<g transform="translate(80 64) rotate(${rot})" class="${cls}"><path d="M-28 -12 L28 -12 L22 6 Q0 16 -22 6Z" class="s-hull"/><line x1="0" y1="-12" x2="0" y2="-52" class="s-ink"/><line x1="0" y1="10" x2="0" y2="22" class="s-ink w3"/></g>`;
// perfil (proa a la derecha)
const prof = (x = 80, y = 64, rot = 0, cls = "") => `<g transform="translate(${x} ${y}) rotate(${rot})" class="${cls}"><path d="M-44 -12 L40 -12 L50 -16 L38 6 L-40 6Z" class="s-hull"/><rect x="-18" y="-22" width="26" height="10" rx="2" class="s-cab"/></g>`;
// planta (proa arriba)
const plan = (x, y, rot = 0, cls = "", s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" class="${cls}"><path d="M0 -26 Q12 -10 10 20 L-10 20 Q-12 -10 0 -26Z" class="s-hull"/><line x1="0" y1="-18" x2="0" y2="16" class="s-thin"/></g>`;
const windArrows = (y1 = 18, y2 = 54, x1 = 8, x2 = 36) => [y1, (y1 + y2) / 2, y2].map(y => arrow(x1, y, x2, y, "s-wind")).join("") + txt(22, y1 - 6, "viento");
const anchor = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" class="s-ink"><circle cx="0" cy="-12" r="2.4" class="nofill"/><line x1="0" y1="-10" x2="0" y2="8"/><path d="M-9 2 Q0 12 9 2" class="nofill"/><line x1="-5" y1="-5" x2="5" y2="-5"/></g>`;

const FIGS = {
  heel: () => W(sea() + sect(-20) + arrow(120, 30, 104, 22, "s-acc") + txt(80, 96, "inclinación a una banda")),
  upright: () => W(sea() + sect(-18, "ghost") + sect(0) + arrow(46, 36, 60, 24, "s-acc") + txt(80, 96, "vuelve a la vertical")),
  roll: () => W(sea() + sect(0, "anim-roll") + `<path d="M58 22 Q80 10 102 22" class="s-acc nofill"/>` + txt(80, 96, "babor ⇄ estribor")),
  pitch: () => W(sea() + prof(80, 64, 0, "anim-pitch") + `<path d="M126 30 Q132 44 126 58" class="s-acc nofill"/>` + txt(80, 96, "proa ⇅ popa")),
  heave: () => W(sea() + prof(80, 64, 0, "anim-heave") + arrow(136, 50, 136, 30) + arrow(136, 50, 136, 70) + txt(80, 96, "sube y baja entero")),
  yaw: () => W(`<rect width="160" height="100" class="s-sea"/>` + `<line x1="80" y1="8" x2="80" y2="92" class="s-dash"/>` + plan(80, 56, 0, "anim-yaw") + txt(80, 96, "la proa da bandazos")),
  leeway: () => W(`<rect width="160" height="100" class="s-sea"/>` + windArrows(18, 58, 6, 30) + plan(84, 56, 0) + `<line x1="84" y1="30" x2="84" y2="6" class="s-dash"/>` + arrow(84, 56, 104, 8, "s-acc") + txt(118, 22, "derrota", "s-lbl-acc", "start") + txt(84, 96, "el viento la abate a sotavento")),
  drift: () => W(`<rect width="160" height="100" class="s-sea"/>` + [30, 50, 70].map(y => arrow(8, y + 8, 34, y, "s-cur")).join("") + txt(22, 16, "corriente") + plan(86, 56, 0) + arrow(86, 56, 112, 10, "s-acc") + txt(86, 96, "la corriente la desplaza")),
  windward: () => W(sea() + windArrows() + `<rect x="44" y="20" width="36" height="60" class="s-hi" rx="4"/>` + sect(0) + txt(62, 16, "BARLOVENTO", "s-lbl-acc") + txt(118, 16, "sotavento")),
  leeward: () => W(sea() + windArrows() + `<rect x="80" y="20" width="44" height="60" class="s-hi" rx="4"/>` + sect(0) + txt(62, 16, "barlovento") + txt(118, 16, "SOTAVENTO", "s-lbl-acc")),
  lee: () => W(sea() + windArrows() + prof(70, 64, 0) + `<path d="M120 60 q4 -4 8 0 q4 4 0 8 q-4 4 -8 0z" class="s-acc fillc"/>` + `<rect x="100" y="34" width="50" height="40" class="s-hi" rx="4"/>` + txt(126, 30, "socaire", "s-lbl-acc")),
  leeshore: () => W(`<rect width="160" height="100" class="s-sea"/>` + windArrows(16, 56, 6, 30) + plan(70, 54, 90) + `<path d="M138 0 L160 0 L160 100 L134 100 Q126 70 140 50 Q130 24 138 0Z" class="s-land"/>` + arrow(96, 54, 128, 54, "s-dash2") + txt(84, 92, "resguardo con la costa")),
  headsea: () => W(sea() + prof(76, 64, -6) + [126, 140, 154].map(x => `<path d="M${x} 66 q-6 -10 -12 0" class="s-acc nofill"/>`).join("") + arrow(150, 50, 130, 50) + txt(80, 96, "mar por proa o amuras")),
  followsea: () => W(sea() + prof(84, 64, 4) + [6, 20, 34].map(x => `<path d="M${x} 66 q6 -10 12 0" class="s-acc nofill"/>`).join("") + arrow(10, 50, 30, 50) + txt(80, 96, "mar por popa o aletas")),
  sides: () => W(`<rect width="160" height="100" class="s-sea"/>` + plan(80, 52, 0, "", 1.4) + `<line x1="80" y1="8" x2="80" y2="90" class="s-dash"/>` + txt(40, 54, "babor", "s-lbl-port") + txt(120, 54, "estribor", "s-lbl-stbd") + txt(80, 98, "plano de crujía")),
  way: () => W(sea() + prof(70) + [0, 1, 2].map(i => `<line x1="${8 + i * 6}" y1="${52 + i * 6}" x2="${22 + i * 6}" y2="${52 + i * 6}" class="s-thin"/>`).join("") + arrow(120, 44, 150, 44) + txt(80, 96, "inercia: sigue avanzando")),
  ahead: () => W(sea() + prof(70) + arrow(118, 40, 152, 40) + txt(80, 96, "hacia proa")),
  astern: () => W(sea() + prof(90) + arrow(42, 40, 8, 40) + txt(80, 96, "hacia popa")),
  rudder: () => W(`<rect width="160" height="100" class="s-sea"/>` + plan(80, 42, 0, "", 1.3) + `<line x1="80" y1="70" x2="80" y2="88" class="s-acc w3"/>` + `<line x1="80" y1="70" x2="96" y2="84" class="s-ghostl"/>` + `<line x1="80" y1="70" x2="64" y2="84" class="s-ghostl"/>` + txt(122, 88, "pala al centro", "s-lbl-acc")),
  turn: () => W(`<rect width="160" height="100" class="s-sea"/>` + plan(70, 60, 30) + `<path d="M74 30 Q92 8 120 14" class="s-acc nofill"/>` + arrow(114, 12, 124, 15) + txt(80, 96, "la proa cae a estribor")),
  tack: () => W(`<rect width="160" height="100" class="s-sea"/>` + arrow(80, 4, 80, 22, "s-wind") + txt(98, 12, "viento", "s-lbl", "start") + plan(56, 64, -40) + plan(104, 64, 40, "ghost") + `<path d="M64 40 Q80 26 96 40" class="s-acc nofill"/>` + txt(80, 98, "la proa cruza el viento")),
  gybe: () => W(`<rect width="160" height="100" class="s-sea"/>` + arrow(80, 4, 80, 22, "s-wind") + txt(98, 12, "viento", "s-lbl", "start") + plan(56, 52, -140) + plan(104, 52, 140, "ghost") + `<path d="M64 76 Q80 90 96 76" class="s-acc nofill"/>` + txt(80, 98, "la popa cruza el viento")),
  spin: () => W(`<rect width="160" height="100" class="s-sea"/>` + plan(80, 50, 0, "anim-spin") + `<circle cx="80" cy="50" r="38" class="s-dash nofill"/>` + txt(80, 98, "giro en poco espacio")),
  alongside: () => W(`<rect width="160" height="100" class="s-sea"/>` + plan(64, 50, 0, "", 1.3) + plan(96, 50, 0, "", 1.3) + `<circle cx="80" cy="44" r="3" class="s-acc fillc"/><circle cx="80" cy="60" r="3" class="s-acc fillc"/>` + txt(80, 98, "costado con costado")),
  bowdown: () => W(sea() + prof(80, 64, 6) + txt(80, 96, "proa más hundida")),
  sterndown: () => W(sea() + prof(80, 64, -6) + txt(80, 96, "popa más hundida")),
  trim: () => W(sea() + prof(80, 62, -5) + `<line x1="38" y1="66" x2="38" y2="84" class="s-acc w2"/><line x1="124" y1="66" x2="124" y2="76" class="s-acc w2"/>` + txt(38, 96, "Cpp", "s-lbl-acc") + txt(124, 90, "Cpr", "s-lbl-acc") + txt(82, 96, "Cpp − Cpr")),
  "heave-in": () => W(sea(40) + prof(60, 38) + `<path d="M98 30 L118 96" class="s-chain"/>` + anchor(118, 92, .8) + arrow(124, 80, 112, 46) + txt(80, 14, "cobrar con el molinete")),
  veer: () => W(sea(40) + prof(60, 38) + `<path d="M98 30 Q120 80 150 96" class="s-chain nofill"/>` + arrow(108, 48, 122, 76) + txt(80, 14, "arriar poco a poco")),
  anchorup: () => W(sea(40) + prof(60, 38) + anchor(100, 26, .7) + arrow(116, 70, 116, 34) + txt(80, 14, "ancla recogida a bordo")),
  breakout: () => W(sea(40) + prof(60, 38) + `<line x1="98" y1="30" x2="98" y2="82" class="s-chain"/>` + anchor(98, 86, .8) + `<line x1="70" y1="98" x2="130" y2="98" class="s-ink w3"/>` + arrow(112, 92, 112, 76) + txt(80, 14, "se desprende del fondo")),
  pendura: () => W(sea(40) + prof(60, 38) + `<line x1="98" y1="30" x2="98" y2="50" class="s-chain"/>` + anchor(98, 54, .7) + `<line x1="70" y1="98" x2="140" y2="98" class="s-ink w3"/>` + txt(124, 72, "sin tocar fondo", "s-lbl-acc")),
  pique: () => W(sea(40) + prof(60, 38) + `<line x1="98" y1="30" x2="98" y2="88" class="s-chain"/>` + anchor(98, 94, .6) + `<line x1="70" y1="98" x2="140" y2="98" class="s-ink w3"/>` + txt(128, 70, "vertical", "s-lbl-acc")),
  clear: () => W(sea(40) + prof(60, 38) + `<line x1="98" y1="30" x2="98" y2="38" class="s-chain"/>` + anchor(98, 44, .7) + `<path d="M108 36 l4 4 l8 -10" class="s-ok nofill w2"/>` + txt(80, 90, "aflora limpia")),
  swing: () => W(`<rect width="160" height="100" class="s-sea"/>` + `<circle cx="80" cy="50" r="40" class="s-dash nofill"/>` + anchor(80, 54, .6) + `<line x1="80" y1="50" x2="80" y2="22" class="s-chain"/>` + plan(80, 14, 0, "", .5) + plan(116, 46, 70, "ghost", .5) + plan(48, 72, -120, "ghost", .5)),
  drag: () => W(sea(30) + prof(70, 28) + `<path d="M106 22 Q130 60 134 86" class="s-chain nofill"/>` + anchor(136, 92, .6) + `<path d="M140 98 L104 98" class="s-dash"/>` + arrow(110, 86, 84, 86) + `<line x1="40" y1="98" x2="160" y2="98" class="s-ink w3"/>` + txt(54, 84, "ancla arrastrada", "s-lbl-acc")),
  bottom: () => W(sea(20) + `<path d="M0 82 Q40 76 80 84 T160 80 L160 100 L0 100Z" class="s-land"/>` + anchor(80, 82, .8) + txt(80, 14, "fango duro · arena")),
};
const fig = (k) => (FIGS[k] ? FIGS[k]() : "");

/* ---------- Estilos ---------- */
const CSS = `
.m-terminologia { display: flex; flex-direction: column; gap: 1rem; }
.m-terminologia .head { display: flex; flex-wrap: wrap; gap: .6rem 1rem; align-items: end; justify-content: space-between; }
.m-terminologia .cats { display: flex; flex-wrap: wrap; gap: .4rem; }
.m-terminologia .cats button { cursor: pointer; }
.m-terminologia .cats button[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.m-terminologia .card { perspective: 1200px; cursor: pointer; border: 0; background: none; padding: 0; width: 100%; text-align: left; }
.m-terminologia .card-in { position: relative; min-height: 300px; transition: transform .45s ease; transform-style: preserve-3d; }
.m-terminologia .card.flip .card-in { transform: rotateY(180deg); }
.m-terminologia .face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; flex-direction: column; gap: .6rem; padding: 1.1rem; border-radius: var(--r); border: 1px solid var(--line); background: var(--sheet); box-shadow: var(--shadow); overflow: auto; }
.m-terminologia .face.back { transform: rotateY(180deg); background: var(--sea); }
.m-terminologia .face .term { font: 600 clamp(1.8rem, 6vw, 2.5rem)/1.05 var(--f-display); }
.m-terminologia .face .def { font-size: 1.08rem; }
.m-terminologia .face .why { font-size: .92rem; color: var(--muted); border-left: 3px solid var(--accent); padding-left: .6rem; }
.m-terminologia .hint { margin-top: auto; font-size: .8rem; color: var(--muted); }
.m-terminologia .fig { width: 100%; max-width: 260px; height: auto; align-self: center; color: var(--ink); overflow: visible; }
.m-terminologia .fig * { vector-effect: non-scaling-stroke; }
.m-terminologia .s-sea { fill: color-mix(in srgb, var(--sea-2) 55%, transparent); }
.m-terminologia .s-wave { fill: none; stroke: var(--sea-2); stroke-width: 1.5; }
.m-terminologia .s-hull { fill: var(--sheet); stroke: var(--ink); stroke-width: 1.6; stroke-linejoin: round; }
.m-terminologia .s-cab { fill: var(--sea); stroke: var(--ink); stroke-width: 1.2; }
.m-terminologia .s-ink { stroke: var(--ink); stroke-width: 1.6; fill: none; stroke-linecap: round; }
.m-terminologia .s-thin { stroke: var(--muted); stroke-width: 1; }
.m-terminologia .s-acc { stroke: var(--accent); stroke-width: 2; color: var(--accent); stroke-linecap: round; }
.m-terminologia .s-wind { stroke: var(--muted); stroke-width: 1.6; color: var(--muted); }
.m-terminologia .s-cur { stroke: var(--stbd); stroke-width: 1.6; color: var(--stbd); }
.m-terminologia .s-ok { stroke: var(--ok); }
.m-terminologia .s-dash { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 4 4; fill: none; }
.m-terminologia .s-dash2 { stroke: var(--accent); stroke-width: 1.4; stroke-dasharray: 4 3; color: var(--accent); }
.m-terminologia .s-ghostl { stroke: var(--muted); stroke-width: 1.4; stroke-dasharray: 3 3; }
.m-terminologia .s-chain { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 3 2; fill: none; }
.m-terminologia .s-land { fill: color-mix(in srgb, var(--buoy-y) 30%, var(--sheet)); stroke: var(--muted); stroke-width: 1; }
.m-terminologia .s-hi { fill: color-mix(in srgb, var(--accent) 14%, transparent); stroke: var(--accent); stroke-width: 1; stroke-dasharray: 3 3; }
.m-terminologia .s-lbl, .m-terminologia .s-lbl-acc, .m-terminologia .s-lbl-port, .m-terminologia .s-lbl-stbd { font: 600 9px var(--f-body); fill: var(--muted); }
.m-terminologia .s-lbl-acc { fill: var(--accent); }
.m-terminologia .s-lbl-port { fill: var(--port); font-size: 11px; }
.m-terminologia .s-lbl-stbd { fill: var(--stbd); font-size: 11px; }
.m-terminologia .fillc { fill: currentColor; stroke: none; }
.m-terminologia .nofill { fill: none; }
.m-terminologia .w2 { stroke-width: 2.4; } .m-terminologia .w3 { stroke-width: 3; }
.m-terminologia .ghost { opacity: .3; }
.m-terminologia .anim-roll { animation: mt-roll 3s ease-in-out infinite; transform-box: view-box; transform-origin: 80px 64px; }
.m-terminologia .anim-pitch { animation: mt-pitch 3s ease-in-out infinite; transform-box: view-box; transform-origin: 80px 64px; }
.m-terminologia .anim-heave { animation: mt-heave 2.6s ease-in-out infinite; }
.m-terminologia .anim-yaw { animation: mt-yaw 2.4s ease-in-out infinite; transform-box: view-box; transform-origin: 80px 56px; }
.m-terminologia .anim-spin { animation: mt-spin 6s linear infinite; transform-box: view-box; transform-origin: 80px 50px; }
@keyframes mt-roll { 0%,100% { rotate: -16deg } 50% { rotate: 16deg } }
@keyframes mt-pitch { 0%,100% { rotate: -7deg } 50% { rotate: 7deg } }
@keyframes mt-heave { 0%,100% { translate: 0 -7px } 50% { translate: 0 7px } }
@keyframes mt-yaw { 0%,100% { rotate: -18deg } 50% { rotate: 18deg } }
@keyframes mt-spin { to { rotate: 360deg } }
.m-terminologia .nav { display: flex; gap: .5rem; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.m-terminologia .stats { display: flex; flex-wrap: wrap; gap: .4rem; }
.m-terminologia .timer { height: 8px; border-radius: 99px; background: var(--sea); overflow: hidden; border: 1px solid var(--line); }
.m-terminologia .timer i { display: block; height: 100%; background: var(--accent); width: 100%; }
.m-terminologia .timer.low i { background: var(--bad); }
.m-terminologia .q { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .8rem; align-items: center; }
.m-terminologia .q .fig { max-width: 150px; }
.m-terminologia .q .prompt-term { font: 600 clamp(1.7rem, 6vw, 2.3rem)/1.05 var(--f-display); }
.m-terminologia .q .prompt-def { font-size: 1.08rem; font-weight: 600; }
.m-terminologia .opts { display: grid; gap: .5rem; }
.m-terminologia .opt { justify-content: flex-start; text-align: left; width: 100%; font-weight: 500; min-height: 46px; line-height: 1.3; padding: .55em .8em; }
.m-terminologia .opt .k { font-family: var(--f-mono); font-size: .78rem; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 0 .35em; flex: none; }
.m-terminologia .opt.right { border-color: var(--ok); background: color-mix(in srgb, var(--ok) 14%, var(--sheet)); }
.m-terminologia .opt.wrong { border-color: var(--bad); background: color-mix(in srgb, var(--bad) 12%, var(--sheet)); }
.m-terminologia .opt[disabled] { opacity: 1; cursor: default; }
.m-terminologia .fb { display: flex; flex-direction: column; gap: .4rem; }
.m-terminologia .fb .why { font-size: .92rem; color: var(--muted); border-left: 3px solid var(--accent); padding-left: .6rem; }
.m-terminologia .over { text-align: center; }
@media (max-width: 480px) {
  .m-terminologia .q { grid-template-columns: 1fr; }
  .m-terminologia .q .fig { max-width: 160px; }
  .m-terminologia .card-in { min-height: 340px; }
}
@media (prefers-reduced-motion: reduce) {
  .m-terminologia .card-in { transition: none; }
  .m-terminologia [class*="anim-"] { animation: none !important; }
}
`;

const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

export default {
  id: ID,
  tema: 1,
  title: "¿Qué significa…? Terminología",
  icon: "≈",
  desc: "Tarjetas rápidas de terminología náutica: escorar, barlovento, filar, a pique… con racha y reloj.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const st = document.createElement("style"); st.dataset.mod = ID; st.textContent = CSS; document.head.appendChild(st);
    }
    const store = ctx.store || { get: (k, d) => d, set() {} };
    let mode = store.get("mode", "estudiar");
    let cat = "all";
    let visible = true;
    const cleanups = [];

    const root = document.createElement("div");
    root.className = "m-terminologia";
    el.appendChild(root);
    root.innerHTML = `
      <div class="head">
        <div class="stack" style="gap:.2rem">
          <span class="eyebrow">Tema 1 · 1.7 Terminología</span>
          <h3>¿Qué significa…?</h3>
        </div>
        <div class="seg" role="group" aria-label="Modo">
          <button type="button" data-mode="estudiar">Estudiar</button>
          <button type="button" data-mode="reto">Reto</button>
        </div>
      </div>
      <div class="cats" role="group" aria-label="Categoría"></div>
      <div class="body"></div>`;
    const body = root.querySelector(".body");
    const catsEl = root.querySelector(".cats");
    const catBtns = [["all", "Todos"], ...Object.entries(CATS)];
    catsEl.innerHTML = catBtns.map(([k, n]) => `<button type="button" class="chip" data-cat="${k}">${n} <span class="muted">${k === "all" ? TERMS.length : TERMS.filter(t => t.c === k).length}</span></button>`).join("");

    const pool = () => (cat === "all" ? TERMS : TERMS.filter(t => t.c === cat));

    /* ---------- Estudiar ---------- */
    let deck = [], idx = 0, flipped = false;
    function startStudy(reshuffle = true) {
      deck = reshuffle ? shuffle(pool()) : pool().slice();
      idx = 0; flipped = false; renderStudy();
    }
    function renderStudy() {
      const t = deck[idx];
      body.innerHTML = `
        <div class="stack">
          <button type="button" class="card${flipped ? " flip" : ""}" aria-label="Tarjeta: ${t.t}. Pulsa para girar">
            <div class="card-in">
              <div class="face front">
                <span class="eyebrow">${CATS[t.c]} · ${idx + 1}/${deck.length}</span>
                <div class="term">${t.t}</div>
                ${fig(t.fig)}
                <div class="hint">Toca la tarjeta (o pulsa Espacio) para ver la definición</div>
              </div>
              <div class="face back" aria-live="polite">
                <span class="eyebrow">${t.t}</span>
                <p class="def">${t.d}</p>
                <p class="why">${t.w}</p>
                <div class="hint">← → para cambiar de tarjeta</div>
              </div>
            </div>
          </button>
          <div class="nav">
            <button type="button" class="btn" data-act="prev">← Anterior</button>
            <button type="button" class="btn ghost sm" data-act="shuffle">Barajar</button>
            <button type="button" class="btn primary" data-act="next">Siguiente →</button>
          </div>
        </div>`;
    }
    const studyMove = (d) => { idx = (idx + d + deck.length) % deck.length; flipped = false; renderStudy(); };
    const studyFlip = () => { flipped = !flipped; body.querySelector(".card")?.classList.toggle("flip", flipped); };

    /* ---------- Reto ---------- */
    let queue = [], cur = null, answered = false, streak = 0, hits = 0, total = 0;
    let best = store.get("best", 0);
    let left = TIME, lastTick = 0, tickId = 0;

    function startChallenge() {
      queue = shuffle(pool()); streak = 0; hits = 0; total = 0; nextQ();
    }
    function makeQ() {
      if (!queue.length) queue = shuffle(pool());
      const t = queue.pop();
      const dir = Math.random() < .5 ? "t2d" : "d2t";
      const ok = (o) => o.id !== t.id && (!t.grp || o.grp !== t.grp);
      let cands = shuffle(TERMS.filter(o => o.c === t.c && ok(o)));
      if (cands.length < 3) cands = cands.concat(shuffle(TERMS.filter(o => o.c !== t.c && ok(o))));
      const picks = [];
      for (const o of cands) { if (picks.length === 3) break; if (!o.grp || !picks.some(p => p.grp === o.grp)) picks.push(o); }
      return { t, dir, opts: shuffle([t, ...picks]) };
    }
    function nextQ() {
      cur = makeQ(); answered = false; left = TIME; renderQ(); startTimer();
    }
    function statsHtml() {
      return `<div class="stats">
        <span class="chip acc">Racha <b class="num">${streak}</b></span>
        <span class="chip">Mejor <b class="num">${best}</b></span>
        <span class="chip">Aciertos <b class="num">${hits}/${total}</b></span>
      </div>`;
    }
    function renderQ() {
      const { t, dir, opts } = cur;
      const prompt = dir === "t2d"
        ? `<div><span class="eyebrow">¿Qué significa…?</span><div class="prompt-term">${t.t}</div></div>`
        : `<div><span class="eyebrow">¿Qué término es?</span><p class="prompt-def">${t.d}</p></div>`;
      body.innerHTML = `
        <div class="panel stack">
          <div class="nav">${statsHtml()}<span class="mono small muted" data-sec>${Math.ceil(left)} s</span></div>
          <div class="timer" role="progressbar" aria-label="Tiempo restante" aria-valuemin="0" aria-valuemax="${TIME}"><i></i></div>
          <div class="q">${prompt}${dir === "t2d" ? fig(t.fig) : ""}</div>
          <div class="opts">${opts.map((o, i) => `<button type="button" class="btn opt" data-i="${i}"><span class="k">${i + 1}</span><span>${dir === "t2d" ? o.d : o.t}</span></button>`).join("")}</div>
          <div class="fb" aria-live="polite"></div>
        </div>`;
      drawTimer();
    }
    function drawTimer() {
      const bar = body.querySelector(".timer"); if (!bar) return;
      bar.querySelector("i").style.width = `${Math.max(0, left / TIME) * 100}%`;
      bar.classList.toggle("low", left <= 4);
      bar.setAttribute("aria-valuenow", Math.ceil(left));
      const s = body.querySelector("[data-sec]"); if (s) s.textContent = `${Math.max(0, Math.ceil(left))} s`;
    }
    function startTimer() {
      stopTimer(); lastTick = performance.now();
      tickId = setInterval(() => {
        const now = performance.now(), dt = (now - lastTick) / 1000; lastTick = now;
        if (!visible || document.hidden || answered) return;
        left -= dt; drawTimer();
        if (left <= 0) answer(-1);
      }, 100);
    }
    function stopTimer() { if (tickId) clearInterval(tickId); tickId = 0; }
    function answer(i) {
      if (answered || !cur) return;
      answered = true; stopTimer(); total++;
      const { t, opts, dir } = cur;
      const right = i >= 0 && opts[i].id === t.id;
      body.querySelectorAll(".opt").forEach((b, k) => {
        b.disabled = true;
        if (opts[k].id === t.id) b.classList.add("right");
        else if (k === i) b.classList.add("wrong");
      });
      let head;
      if (right) {
        hits++; streak++;
        const fast = TIME - left < 5;
        ctx.award?.(fast ? 8 : 5, `Terminología: ${t.t}`);
        if (streak % 10 === 0) { ctx.award?.(30, `Racha de ${streak} en terminología`); ctx.toast?.(`Racha de ${streak}. +30 XP`); }
        if (streak > best) { best = streak; store.set("best", best); }
        head = `<span class="fb-ok">Correcto${fast ? " · rápido" : ""}</span>`;
      } else {
        streak = 0;
        const wrongTxt = i >= 0 ? ` Has marcado «${opts[i].t}»: ${opts[i].d.charAt(0).toLowerCase() + opts[i].d.slice(1)}` : "";
        head = `<span class="fb-bad">${i < 0 ? "Tiempo agotado" : "No"}</span><span class="small muted">${wrongTxt}</span>`;
      }
      store.set("hits", (store.get("hits", 0) || 0) + (right ? 1 : 0));
      const fb = body.querySelector(".fb");
      fb.innerHTML = `${head}
        <p><b>${t.t}:</b> ${t.d}</p>
        <p class="why">${t.w}</p>
        <div class="row"><button type="button" class="btn primary" data-act="nextq">Siguiente (Intro)</button></div>`;
      const st = body.querySelector(".stats"); if (st) st.outerHTML = statsHtml();
      fb.querySelector("[data-act=nextq]")?.focus({ preventScroll: true });
    }

    /* ---------- Modo ---------- */
    function setMode(m) {
      mode = m; store.set("mode", m);
      root.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
      stopTimer();
      if (m === "estudiar") startStudy(); else startChallenge();
    }
    function setCat(c) {
      cat = c;
      catsEl.querySelectorAll("[data-cat]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.cat === c)));
      setMode(mode);
    }

    const onClick = (e) => {
      const b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      if (b.dataset.mode) return setMode(b.dataset.mode);
      if (b.dataset.cat) return setCat(b.dataset.cat);
      if (b.classList.contains("card")) return studyFlip();
      const a = b.dataset.act;
      if (a === "prev") studyMove(-1);
      else if (a === "next") studyMove(1);
      else if (a === "shuffle") startStudy(true);
      else if (a === "nextq") nextQ();
      else if (b.classList.contains("opt")) answer(+b.dataset.i);
    };
    root.addEventListener("click", onClick);

    const onKey = (e) => {
      if (!visible || !root.isConnected || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
      if (mode === "reto") {
        if (!answered && /^[1-4]$/.test(e.key)) { e.preventDefault(); answer(+e.key - 1); }
        else if (answered && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); nextQ(); }
      } else {
        if (e.key === "ArrowRight") { e.preventDefault(); studyMove(1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); studyMove(-1); }
        else if ((e.key === " " || e.key === "Enter") && !(e.target.closest && e.target.closest("button:not(.card)"))) { e.preventDefault(); studyFlip(); }
      }
    };
    window.addEventListener("keydown", onKey);

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; lastTick = performance.now(); }, { threshold: 0.05 });
      io.observe(root); cleanups.push(() => io.disconnect());
    }
    const onVis = () => { lastTick = performance.now(); };
    document.addEventListener("visibilitychange", onVis);

    catsEl.querySelector('[data-cat="all"]').setAttribute("aria-pressed", "true");
    setMode(mode === "reto" ? "reto" : "estudiar");

    return () => {
      stopTimer();
      root.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      cleanups.forEach(f => f());
      root.remove();
    };
  },
};
