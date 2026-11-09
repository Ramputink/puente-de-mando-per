// Taller de nudos — Tema 2 (Amarre y fondeo)
// Animación SVG paso a paso con cruces por encima/debajo, fichas de uso y juego «¿Qué nudo usarías?».

const ID = "nudos";
const VB_W = 400, VB_H = 260, SUB = 12;

/* ------------------------------------------------------------------ */
/* Geometría de los nudos                                              */
/* Cada cabo: lista de puntos de control [x, y, z]. z (por defecto 0)   */
/* es la capa del tramo que EMPIEZA en ese punto: menor = por debajo.   */
/* A igual z, el tramo posterior en el recorrido queda encima.          */
/* ------------------------------------------------------------------ */

const rot180 = (pts) => {
  // Devuelve el recorrido girado 180° alrededor del centro y en sentido inverso,
  // reasignando z al tramo correcto.
  const n = pts.length, out = [];
  for (let j = 0; j < n; j++) {
    const p = pts[n - 1 - j];
    const zSeg = j < n - 1 ? (pts[n - 2 - j][2] || 0) : 0;
    out.push([VB_W - p[0], VB_H - p[1], zSeg]);
  }
  return out;
};

const MARG_HALF = [
  [8, 104, 0], [45, 106, 0], [85, 116, 1], [112, 146, 1], [94, 182, 1], [55, 178, 1], [40, 142, 1], [60, 106, 1],
  [100, 92, 0], [200, 92, 0], [292, 94, 0], [324, 112, 0], [292, 130, 0]
];
const MARG = [...MARG_HALF, [200, 130, 0], ...rot180(MARG_HALF)];

// As de guía diseñado en vertical (árbol arriba) y girado 90° (giro puro: conserva los cruces)
const BOW = [
  [120, 0], [120, 30], [120, 62], [120, 100, -1], [124, 142], [138, 178], [165, 195], [198, 178], [206, 142], [186, 112],
  [152, 103], [121, 125], [100, 145], [84, 190], [82, 250], [96, 320], [135, 372], [185, 360], [214, 305], [214, 255],
  [196, 222, -1], [172, 150], [164, 80], [150, 52, -1], [92, 48], [96, 74], [138, 112], [146, 150, -1], [142, 198], [140, 232]
].map(([x, y, z]) => [y + 8, 292 - 1.3 * x, z || 0]);

const KNOTS = [
  {
    id: "simple", name: "Nudo simple", alias: "medio nudo · nudo de tope básico",
    ropes: [{ c: 0, w: 15, pts: [
      [8, 190], [90, 190], [165, 186], [235, 165], [268, 118], [245, 68], [195, 52], [152, 76], [145, 128], [168, 188],
      [200, 226], [240, 224, -1], [222, 172, -1], [206, 128], [176, 64], [152, 24]
    ] }],
    labels: [{ t: "firme", r: 0, at: 1, dy: -20 }],
    steps: [
      { t: "Parte del firme y deja suficiente chicote para trabajar.", r: [3] },
      { t: "Forma un seno y cruza el chicote POR ENCIMA del firme: ya tienes una gaza (bucle).", r: [9.4] },
      { t: "Pasa el chicote por detrás del firme…", r: [12.6] },
      { t: "…y sácalo por dentro de la gaza, por delante. Azoca tirando de los dos lados.", r: [15] }
    ],
    parts: ["Chicote", "Firme", "Seno (la gaza que se forma)"],
    uso: "Tope básico en el chicote y base de muchos otros nudos.",
    si: ["Tope provisional en un cordino fino.", "Evitar que un chicote se deshilache mientras se falcacea."],
    no: ["Cuando haya que deshacerlo después de trabajar: se agarrota, sobre todo mojado.", "Como tope de una escota en un motón: abulta poco y puede colarse; usa el ocho."],
    pros: ["El más rápido y sencillo."],
    contras: ["Muy difícil de deshacer tras la carga.", "Debilita bastante el cabo."]
  },
  {
    id: "ocho", name: "Nudo de ocho (lasca)", alias: "nudo de tope",
    ropes: [{ c: 0, w: 15, pts: [
      [8, 160], [60, 160], [110, 160], [175, 160], [240, 160], [290, 150], [320, 110], [300, 60], [250, 40], [200, 55],
      [180, 100], [175, 160], [170, 205], [130, 230], [90, 215, -1], [85, 160, -1], [95, 110], [130, 85], [215, 100, -1],
      [240, 160, -1], [255, 212], [292, 240]
    ] }],
    labels: [{ t: "firme", r: 0, at: 0.6, dy: -18 }],
    steps: [
      { t: "Parte del firme: el ocho se hace cerca del chicote.", r: [5] },
      { t: "Forma un seno y cruza el chicote por encima del firme (como en el nudo simple).", r: [11.4] },
      { t: "Rodea el firme por DETRÁS…", r: [16.5] },
      { t: "…y mete el chicote por la gaza desde delante. Se ve un «8».", r: [19.5] },
      { t: "Azoca. Queda un tope gordo que no pasa por la polea y se deshace fácil.", r: [21] }
    ],
    parts: ["Chicote", "Firme", "Seno"],
    uso: "Tope en el chicote de escotas y drizas para que el cabo no se escape (se descabe) por una polea, motón, guía o mordaza.",
    si: ["Rematar el chicote de las escotas del foque/génova.", "Impedir que una driza se pierda dentro del palo."],
    no: ["Para amarrar el barco o unir dos cabos: no es su función."],
    pros: ["Abulta más que el simple.", "Se deshace con facilidad incluso después de trabajar."],
    contras: ["Si no se azoca bien, puede aflojarse con el flameo."]
  },
  {
    id: "llano", name: "Nudo llano (rizo)", alias: "nudo de envergue / de rizos",
    ropes: [
      { c: 0, w: 14, cap0: true, pts: [[8, 95], [100, 95], [180, 95], [250, 98], [286, 130], [250, 162], [180, 165], [100, 165], [8, 165]] },
      { c: 1, w: 14, cap0: true, pts: [
        [392, 115], [320, 115], [255, 116], [205, 110, -1], [165, 88, -1], [128, 72], [106, 130], [128, 188, -1],
        [165, 172, -1], [205, 150], [255, 144], [320, 145], [392, 145]
      ] }
    ],
    labels: [{ t: "cabo A", r: 0, at: 0.4, dy: -16 }, { t: "cabo B", r: 1, at: 0.4, dy: -16 }],
    steps: [
      { t: "Cabo A: dobla su chicote formando un seno (U).", r: [8, 0] },
      { t: "El chicote de B entra POR ENCIMA del seno de A…", r: [8, 2.6] },
      { t: "…pasa por DEBAJO del ramal de A…", r: [8, 5] },
      { t: "…rodea por encima los dos ramales de A…", r: [8, 7] },
      { t: "…y vuelve por debajo y por encima, saliendo por el mismo lado que su firme.", r: [8, 12] }
    ],
    parts: ["Chicotes de los dos cabos", "Firme de cada cabo"],
    uso: "Unir por sus chicotes dos cabos de la MISMA mena (mismo grosor). También para tomar rizos y atar paquetes.",
    si: ["Unir dos cabos iguales sin grandes cargas.", "Atar los rizos de la vela (por eso se llama «de rizo»).", "Unir los dos chicotes de un mismo cabo alrededor de algo."],
    no: ["Cabos de distinta mena o materiales resbaladizos: se escurre → vuelta de escota.", "Uniones que van a sufrir tirones o mucha carga: puede volcarse y soltarse."],
    pros: ["Plano y simétrico; al trabajar se azoca y al dejar de trabajar es fácil de deshacer."],
    contras: ["Mal hecho sale el «nudo de vieja», que se escurre.", "No sirve con menas distintas."],
    rule: "Regla: izquierda sobre derecha, derecha sobre izquierda. Chicote y firme de cada cabo salen juntos."
  },
  {
    id: "escota", name: "Vuelta de escota", alias: "simple",
    ropes: [
      { c: 0, w: 19, cap0: true, pts: [[8, 90], [90, 90], [180, 90], [250, 92], [286, 128], [250, 165], [180, 168], [90, 168], [8, 168]] },
      { c: 1, w: 11, pts: [
        [228, 258], [229, 205, -1], [230, 145], [228, 62], [195, 35], [158, 48, -1], [150, 128, -1], [158, 205],
        [190, 215], [203, 172], [212, 145, -1], [255, 118]
      ] }
    ],
    labels: [{ t: "seno grueso", fx: 342, fy: 133, small: true }, { t: "firme fino", r: 1, at: 0.3, dx: 14, anchor: "start" }],
    steps: [
      { t: "El cabo GRUESO forma el seno.", r: [8, 0] },
      { t: "El fino entra por dentro del seno desde abajo (por detrás).", r: [8, 3] },
      { t: "Rodea por detrás los dos ramales del seno…", r: [8, 7] },
      { t: "…y pasa el chicote por DEBAJO de su propio firme: queda mordido.", r: [8, 11] }
    ],
    parts: ["Seno del cabo grueso", "Chicote y firme del cabo fino"],
    uso: "Unir dos cabos de DISTINTA mena (grosor). El grueso hace el seno; el fino lo rodea y muerde bajo su firme.",
    si: ["Unir un cabo fino a uno grueso.", "Unir un cabo a una gaza ya hecha o al puño de una vela."],
    no: ["Si va a quedar sin tensión con sacudidas: puede soltarse (usa la doble)."],
    pros: ["Rápida, segura con cabos de distinto grosor y fácil de deshacer."],
    contras: ["La simple puede aflojarse si el cabo flamea sin carga."]
  },
  {
    id: "escota2", name: "Vuelta de escota doble", alias: "doble",
    ropes: [
      { c: 0, w: 19, cap0: true, pts: [[8, 90], [90, 90], [180, 90], [250, 92], [286, 128], [250, 165], [180, 168], [90, 168], [8, 168]] },
      { c: 1, w: 11, pts: [
        [232, 258], [232, 205, -1], [233, 145], [232, 70], [205, 50], [172, 58, -1], [162, 128, -1], [166, 200],
        [192, 212], [196, 128], [190, 52], [150, 26], [118, 44, -1], [114, 128, -1], [120, 200], [150, 214],
        [168, 178], [180, 150, -1], [210, 132, -1], [262, 118]
      ] }
    ],
    labels: [{ t: "seno grueso", fx: 342, fy: 133, small: true }],
    steps: [
      { t: "Igual que la simple: el grueso forma el seno y el fino entra por dentro.", r: [8, 3] },
      { t: "Primera vuelta por detrás de los dos ramales del seno.", r: [8, 7.5] },
      { t: "Segunda vuelta alrededor del seno, junto a la primera.", r: [8, 15] },
      { t: "El chicote pasa por debajo de sus vueltas y de su firme.", r: [8, 19] }
    ],
    parts: ["Seno del cabo grueso", "Chicote y firme del cabo fino"],
    uso: "Como la simple, pero con una vuelta más: para menas muy diferentes, cabos resbaladizos o mojados, o tensión variable.",
    si: ["Mucha diferencia de grosor entre los cabos.", "Cabos sintéticos resbaladizos o mojados."],
    no: ["Cuando una simple basta: tarda más y abulta."],
    pros: ["Más segura que la simple; sigue siendo fácil de deshacer."],
    contras: ["Algo más lenta de hacer."]
  },
  {
    id: "ballestrinque", name: "Ballestrinque", alias: "dos vueltas mordidas",
    objs: [{ z: -1, k: "post", x: 170, y: 6, w: 60, h: 248 }],
    ropes: [{ c: 0, w: 14, pts: [
      [8, 118], [110, 120], [200, 120], [238, 112, -2], [200, 80, -2], [162, 62, 1], [200, 128, 1], [238, 194, -2],
      [200, 178, -2], [162, 165], [200, 165], [300, 168], [390, 172]
    ] }],
    labels: [{ t: "firme", r: 0, at: 0.6, dy: -18 }, { t: "poste / candelero", fx: 200, fy: 250, small: true }],
    steps: [
      { t: "Pasa el cabo por delante del poste…", r: [2.4] },
      { t: "…y da una vuelta completa por detrás.", r: [5] },
      { t: "Cruza en diagonal POR ENCIMA de la primera vuelta.", r: [7] },
      { t: "Da una segunda vuelta por detrás…", r: [9] },
      { t: "…y saca el chicote por DEBAJO de la diagonal. Los dos ramales salen en sentidos opuestos.", r: [12] }
    ],
    parts: ["Firme", "Chicote", "Dos vueltas (senos) mordidas"],
    uso: "Afirmar rápidamente un cabo a un poste, candelero, bita o barra. Es el nudo típico para colgar las defensas.",
    si: ["Colgar defensas de un candelero o guardamancebo (y regular su altura).", "Amarre provisional a un poste con tensión constante."],
    no: ["Si la tensión no es constante (tirones, oleaje) o el objeto gira: se afloja y se corre. Remátalo con un medio cote.", "No forma gaza ni sirve para unir dos cabos."],
    pros: ["Muy rápido, regulable y fácil de deshacer; se aprieta a sí mismo al trabajar."],
    contras: ["Se afloja con tensión intermitente.", "Puede deslizar a lo largo de un tubo liso."]
  },
  {
    id: "asdeguia", name: "As de guía", alias: "el rey de los nudos",
    ropes: [{ c: 0, w: 14, pts: BOW }],
    labels: [
      { t: "árbol (firme)", r: 0, at: 1.2, dy: 22 },
      { t: "lago", fx: 112, fy: 24, from: 11, small: true },
      { t: "gaza", fx: 300, fy: 100, from: 17, small: true }
    ],
    snake: true,
    steps: [
      { t: "El ÁRBOL es el firme: la parte que va a trabajar.", r: [3] },
      { t: "Haz el LAGO: una gaza pequeña con el chicote cruzando por ENCIMA del firme.", r: [12] },
      { t: "Deja la gaza del tamaño que quieras. El chicote es la SERPIENTE.", r: [19.5] },
      { t: "La serpiente SALE DEL LAGO: entra en la gaza pequeña por detrás (por debajo del cabo) y sale por delante.", r: [22.6] },
      { t: "RODEA EL ÁRBOL por detrás…", r: [25] },
      { t: "…y VUELVE AL LAGO por el mismo camino por el que salió.", r: [29] },
      { t: "Azoca sujetando serpiente y gaza y tirando del árbol. Deja un chicote largo.", r: [29] }
    ],
    parts: ["Firme (árbol)", "Seno pequeño (lago)", "Chicote (serpiente)", "Gaza"],
    uso: "Hacer una gaza FIJA, que no se corre, para encapillar un cabo en un noray, bita o bolardo.",
    si: ["Gaza para encapillar en un noray al atracar.", "Rescate: lazo alrededor del pecho que no estrangula.", "Atar la escota al puño de la vela."],
    no: ["No sirve para unir dos cabos de la misma mena (eso es el llano).", "No se puede hacer ni deshacer con el cabo en carga."],
    pros: ["No se corre ni se aprieta.", "Se deshace fácilmente incluso tras soportar gran tensión (doblando el «collar»)."],
    contras: ["Sin carga y con sacudidas puede aflojarse: deja chicote largo o remata con un cote."]
  },
  {
    id: "rezon", name: "Vuelta de rezón", alias: "vuelta de ancla",
    objs: [{ z: 0, k: "ring", cx: 85, cy: 124, r: 75 }],
    ropes: [{ c: 0, w: 13, pts: [
      [395, 82, 1], [300, 82, 1], [200, 82, 1], [150, 82, 1], [118, 82, 1], [105, 95, 1], [118, 108, -1], [175, 108, -1],
      [191, 108, 1], [204, 121, 1], [191, 134, 1], [150, 134, 1], [118, 134, 1], [105, 147, 1], [118, 160, -1], [175, 160, -1],
      [205, 162, 1], [245, 165, 1], [268, 135, 1], [262, 90, 1], [248, 58, 1], [226, 62, 0], [216, 82, 0], [196, 96, -2],
      [182, 121, -2], [180, 147, -2], [182, 175, 1], [190, 210, 1], [184, 245, 1]
    ] }],
    labels: [{ t: "firme", r: 0, at: 0.6, dy: -18 }, { t: "arganeo / argolla", fx: 70, fy: 222, small: true }],
    steps: [
      { t: "Pasa el chicote por la argolla (arganeo del ancla)…", r: [8] },
      { t: "…y da una segunda vuelta: dos vueltas redondas.", r: [16] },
      { t: "Lleva el chicote alrededor del firme…", r: [22.5] },
      { t: "…y mételo por DENTRO de las dos vueltas. Remátalo con un medio cote.", r: [28] }
    ],
    parts: ["Firme", "Chicote", "Dos vueltas al arganeo"],
    uso: "Unir un cabo al arganeo del ancla o del rezón. También afirmar rápidamente un cabo a un palo, cáncamo o argolla.",
    si: ["Amarrar el cabo o la estacha al arganeo del ancla.", "Afirmar un cabo a una argolla del muelle."],
    no: ["Para unir cabos o hacer gazas.", "Sin rematar si va a estar mucho tiempo con movimiento."],
    pros: ["No se agarrota y es fácil de deshacer incluso mojado.", "Las vueltas reparten el roce."],
    contras: ["Conviene rematarla (medio cote o ligada) para uso prolongado."]
  },
  {
    id: "cotes", name: "Dos medios cotes", alias: "vuelta redonda y dos medios cotes",
    objs: [{ z: 0, k: "post", x: 38, y: 6, w: 54, h: 248 }],
    ropes: [{ c: 0, w: 13, pts: [
      [395, 100, 1], [300, 100, 1], [200, 102, 1], [110, 104, 1], [65, 105, 1], [30, 112, -1], [65, 128, -1], [100, 136, 1],
      [140, 140, 1], [185, 138, 1], [200, 95, 1], [190, 64, 1], [165, 72, 0], [160, 103, 0], [168, 128, 1], [175, 165, 1],
      [220, 172, 1], [255, 150, 1], [262, 95, 1], [250, 62, 1], [228, 70, 0], [224, 102, 0], [230, 128, 1], [236, 175, 1],
      [256, 210, 1], [292, 232, 1]
    ] }],
    labels: [{ t: "firme", r: 0, at: 0.6, dy: -18 }, { t: "1.er cote", fx: 172, fy: 40, from: 14, small: true }, { t: "2.º cote", fx: 245, fy: 40, from: 21, small: true }],
    steps: [
      { t: "Da una vuelta redonda al poste o argolla: aguanta la carga.", r: [8] },
      { t: "Primer medio cote: el chicote rodea el firme…", r: [13] },
      { t: "…y pasa por dentro de su propio seno.", r: [16] },
      { t: "Segundo medio cote, igual y en el mismo sentido. Azoca y desliza hacia el poste.", r: [25] }
    ],
    parts: ["Firme", "Chicote", "Vuelta redonda"],
    uso: "Un cote (medio cote) es una vuelta del chicote alrededor del firme mordiendo sobre sí mismo. Dos medios cotes iguales forman un ballestrinque sobre el propio firme. Con una vuelta redonda previa es un amarre seguro a postes, argollas y pilotes.",
    si: ["Amarrar a un pilote o argolla con tirones (la vuelta redonda absorbe la carga).", "Rematar otros nudos (as de guía, ballestrinque)."],
    no: ["Un solo medio cote no es un amarre seguro."],
    pros: ["Seguro y fácil de deshacer, incluso tras cargar."],
    contras: ["Los cotes pueden correrse a lo largo del firme si no se azocan."]
  },
  {
    id: "mordida", name: "Vuelta mordida", alias: "vista de perfil de una percha",
    objs: [{ z: -5, k: "spar", cx: 200, cy: 112, r: 38 }],
    ropes: [{ c: 0, w: 14, pts: [
      [168, 256, 0], [164, 200, 0], [161, 140, 0], [164, 96, 0], [184, 70, 0], [222, 68, 0], [246, 98, 0], [244, 136, 0],
      [214, 156, 0], [178, 156, -1], [140, 158, 0], [96, 168, 0], [60, 186, 0]
    ] }],
    labels: [{ t: "firme (en tensión)", r: 0, at: 0.6, dx: -14, anchor: "end" }, { t: "pisado por el firme", fx: 92, fy: 150, from: 10, small: true }],
    steps: [
      { t: "El firme sube y da una vuelta a la percha (vista de perfil).", r: [8] },
      { t: "El chicote pasa entre la percha y el firme: el propio firme lo «muerde».", r: [12] }
    ],
    parts: ["Firme (en tensión)", "Chicote", "Una vuelta al objeto"],
    uso: "Sujeción momentánea: el chicote queda pisado entre el firme y el objeto y solo aguanta mientras hay tensión. El ballestrinque son dos vueltas mordidas.",
    si: ["Aguantar un cabo un momento mientras preparas el nudo definitivo.", "Colgar algo ligero de un gancho o del bichero con tensión constante."],
    no: ["Como amarre definitivo: sin tensión se suelta."],
    pros: ["Instantánea y se suelta sola."],
    contras: ["Nada fiable si la tensión desaparece."]
  },
  {
    id: "margarita", name: "Margarita", alias: "acortar sin cortar",
    ropes: [{ c: 0, w: 12, cap0: true, pts: MARG }],
    labels: [{ t: "tramo dañado (no trabaja)", fx: 200, fy: 116, small: true }],
    steps: [
      { t: "Pliega el cabo en Z: tres ramales paralelos. El central (por ejemplo, el tramo dañado) no trabajará.", r: [[8, 18]] },
      { t: "Con el ramal izquierdo haz una gaza y pásala sobre el seno de ese lado…", r: [[0, 18]] },
      { t: "…y lo mismo en el otro extremo. Solo aguanta mientras el cabo esté en tensión.", r: [[0, 26]] }
    ],
    parts: ["Dos senos", "Firme de cada lado", "Ramal central"],
    uso: "Acortar un cabo sin cortarlo o aislar un tramo dañado, que queda en el ramal central sin trabajar.",
    si: ["Acortar provisionalmente una amarra o un cabo largo.", "Salvar un tramo rozado o con cocas."],
    no: ["Si el cabo va a quedar sin tensión o con sacudidas: se deshace (asegúralo con ligadas)."],
    pros: ["No hay que cortar el cabo; se deshace fácilmente."],
    contras: ["Solo aguanta en tensión."]
  },
  {
    id: "seno", name: "As de guía por seno", alias: "gaza doble sin chicotes", info: true,
    steps: [
      { t: "Dobla el cabo y trabaja con el SENO como si fuera el chicote." },
      { t: "Haz el lago con el seno doble, igual que en el as de guía." },
      { t: "Pasa el seno por dentro del lago (sale la serpiente doble)." },
      { t: "Abre el seno y pásalo por encima de las dos gazas, hasta abrazar el firme por detrás." },
      { t: "Azoca: quedan dos gazas fijas que no se corren." }
    ],
    parts: ["Seno (se trabaja doble)", "Firme", "Dos gazas"],
    uso: "Hacer una gaza doble en mitad de un cabo, sin usar los chicotes: silla para izar o rescatar a una persona, o repartir una carga en dos puntos.",
    si: ["Izar a una persona (una gaza en cada pierna o bajo axilas y muslos).", "Gaza en el centro de un cabo largo."],
    no: ["Cuando basta un as de guía normal en el chicote."],
    pros: ["Gazas fijas, no estrangula, se deshace bien."],
    contras: ["Consume mucho cabo y es más difícil de recordar."]
  }
];

/* ------------------------------------------------------------------ */
/* Motor de dibujo                                                     */
/* ------------------------------------------------------------------ */

function crPoint(p0, p1, p2, p3, t) {
  const d = (a, b) => Math.max(Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5), 1e-4);
  const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
  const tt = t1 + (t2 - t1) * t;
  const L = (a, b, ta, tb) => [((tb - tt) * a[0] + (tt - ta) * b[0]) / (tb - ta), ((tb - tt) * a[1] + (tt - ta) * b[1]) / (tb - ta)];
  const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
  const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
  return L(B1, B2, t1, t2);
}

function sampleRope(pts) {
  const n = pts.length, out = [];
  const P = (i) => {
    if (i < 0) return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]];
    if (i >= n) return [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]];
    return pts[i];
  };
  for (let i = 0; i < n - 1; i++) {
    const z = pts[i][2] || 0;
    for (let k = 0; k < SUB; k++) {
      const [x, y] = crPoint(P(i - 1), P(i), P(i + 1), P(i + 2), k / SUB);
      out.push({ x, y, z, idx: out.length });
    }
  }
  out.push({ x: pts[n - 1][0], y: pts[n - 1][1], z: pts[n - 2][2] || 0, idx: out.length });
  return out;
}

function pointAt(samples, u) {
  const f = Math.max(0, Math.min(samples.length - 1, u * SUB));
  const i = Math.floor(f), fr = f - i, a = samples[i], b = samples[Math.min(i + 1, samples.length - 1)];
  return { x: a.x + (b.x - a.x) * fr, y: a.y + (b.y - a.y) * fr, z: a.z, i };
}

const f1 = (v) => v.toFixed(1);
const dPath = (ps) => "M" + ps.map((p) => f1(p.x) + " " + f1(p.y)).join("L");

function ropeRuns(samples, a, b) {
  if (b - a < 0.02) return [];
  const s0 = Math.max(0, Math.ceil(a * SUB)), last = pointAt(samples, b);
  const pts = [];
  const first = pointAt(samples, a);
  pts.push(first);
  for (let i = s0; i <= last.i; i++) if (i * 1 > a * SUB + 1e-6) pts.push(samples[i]);
  pts.push({ x: last.x, y: last.y, z: last.z });
  const runs = [];
  let cur = { z: pts[0].z, pts: [pts[0]] };
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if ((p.z !== cur.z || (p.idx != null && p.idx % SUB === 0 && i > 1)) && i < pts.length - 1) {
      cur.pts.push(p);
      runs.push(cur);
      cur = { z: p.z, pts: [pts[i - 1], p], ov: true };
    } else cur.pts.push(p);
  }
  runs.push(cur);
  return runs;
}

function capSVG(p, prev, w, whip) {
  let s = `<circle class="edge" cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(w / 2 + 1.5)}"/><circle class="body" cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(w / 2)}"/>`;
  if (whip && prev) {
    const dx = p.x - prev.x, dy = p.y - prev.y, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, bx = p.x - ux * (w * 0.55), by = p.y - uy * (w * 0.55);
    s += `<line class="whip" x1="${f1(bx + nx * w / 2)}" y1="${f1(by + ny * w / 2)}" x2="${f1(bx - nx * w / 2)}" y2="${f1(by - ny * w / 2)}" stroke-width="${f1(w * 0.42)}"/>`;
  }
  return s;
}

function objSVG(o) {
  if (o.k === "post") return `<rect class="obj" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="5"/><rect class="obj-hl" x="${o.x + 8}" y="${o.y + 4}" width="${Math.max(4, o.w * 0.14)}" height="${o.h - 8}" rx="3"/>`;
  if (o.k === "ring") return `<circle class="ring" cx="${o.cx}" cy="${o.cy}" r="${o.r}"/><circle class="ring-hl" cx="${o.cx}" cy="${o.cy}" r="${o.r}"/>`;
  if (o.k === "spar") return `<circle class="obj" cx="${o.cx}" cy="${o.cy}" r="${o.r}"/><circle class="obj-hl2" cx="${o.cx - o.r * 0.3}" cy="${o.cy - o.r * 0.3}" r="${o.r * 0.35}"/>`;
  return "";
}

function prepKnot(k) {
  if (k._prep || k.info) return k;
  k._samples = k.ropes.map((r) => sampleRope(r.pts));
  k._prep = true;
  return k;
}

function renderKnot(k, rev, opts = {}) {
  prepKnot(k);
  const items = [];
  (k.objs || []).forEach((o, i) => items.push({ z: o.z, o: -1000 + i, html: objSVG(o) }));
  k.ropes.forEach((r, ri) => {
    const s = k._samples[ri];
    const max = r.pts.length - 1;
    let [a, b] = Array.isArray(rev[ri]) ? rev[ri] : [0, rev[ri] ?? max];
    a = Math.max(0, a); b = Math.min(max, b);
    const runs = ropeRuns(s, a, b);
    const w = r.w || 14;
    runs.forEach((run, j) => {
      const d = dPath(run.pts);
      const ds = run.ov && run.pts.length > 2 ? dPath(run.pts.slice(1)) : d;
      let html = `<g class="rope c${r.c}">` +
        `<path class="shadow" d="${ds}" stroke-width="${w + 7}"/>` +
        `<path class="edge" d="${d}" stroke-width="${w + 3}"/>` +
        `<path class="body" d="${d}" stroke-width="${w}"/>` +
        `<path class="lay" d="${d}" stroke-width="${w - 2}" stroke-dasharray="1.6 ${f1(w * 0.42)}"/>` +
        `<path class="hl" d="${d}" stroke-width="${f1(w * 0.26)}" transform="translate(-${f1(w * 0.12)} -${f1(w * 0.16)})"/>`;
      if (j === 0 && a < 0.02 && r.cap0) html += capSVG(run.pts[0], run.pts[1], w, true);
      if (j === runs.length - 1 && b > 0.05) {
        const pe = run.pts[run.pts.length - 1], pp = run.pts[Math.max(0, run.pts.length - 3)];
        html += capSVG(pe, pp, w, true);
      }
      html += "</g>";
      items.push({ z: run.z, o: ri * 100000 + j, html });
    });
  });
  items.sort((p, q) => p.z - q.z || p.o - q.o);
  let svg = items.map((i) => i.html).join("");
  if (!opts.noLabels) svg += labelsSVG(k, rev);
  return svg;
}

function txt(x, y, t, cls = "lbl", anchor = "middle") {
  return `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}">${t}</text>`;
}

function labelsSVG(k, rev) {
  let s = "";
  (k.labels || []).forEach((L) => {
    if (L.fx != null) {
      if (L.from != null) {
        const rr = rev[0]; const b = Array.isArray(rr) ? rr[1] : rr;
        if (b != null && b < L.from) return;
      }
      if (L.lead) s += `<line class="lead" x1="${L.fx + 14}" y1="${L.fy + 2}" x2="${L.lead[0]}" y2="${L.lead[1]}"/>`;
      s += txt(L.fx, L.fy, L.t, L.small ? "lbl sm" : "lbl");
      return;
    }
    const r = k.ropes[L.r]; const rr = rev[L.r]; const [a, b] = Array.isArray(rr) ? rr : [0, rr ?? r.pts.length - 1];
    if (L.at < a || L.at > b) return;
    const p = pointAt(k._samples[L.r], L.at);
    s += txt(p.x + (L.dx || 0), p.y + (L.dy || 0) + 4, L.t, "lbl", L.anchor || "middle");
  });
  // chicote / serpiente en el extremo que avanza
  k.ropes.forEach((r, ri) => {
    const rr = rev[ri]; const [a, b] = Array.isArray(rr) ? rr : [0, rr ?? r.pts.length - 1];
    if (b - a < 0.6 || (ri === 0 && k.ropes.length > 1 && b >= r.pts.length - 1 && k.id !== "llano")) return;
    if (k.id === "margarita") return;
    const p = pointAt(k._samples[ri], b), q = pointAt(k._samples[ri], Math.max(0, b - 0.35));
    const dx = p.x - q.x, dy = p.y - q.y, L = Math.hypot(dx, dy) || 1;
    let x = p.x + (dx / L) * 22, y = p.y + (dy / L) * 22 + 4;
    x = Math.max(34, Math.min(VB_W - 34, x)); y = Math.max(12, Math.min(VB_H - 6, y));
    s += txt(x, y, k.snake && ri === 0 ? "serpiente" : "chicote", "lbl acc");
  });
  return s;
}

/* ------------------------------------------------------------------ */
/* Partes del cabo y elementos de amarre                              */
/* ------------------------------------------------------------------ */

const PARTES = [
  { id: "chicote", n: "Chicote", d: "Cualquiera de los dos extremos de un cabo. El que se maneja para hacer el nudo es el chicote «de trabajo».", trap: "No es el bucle que queda al anudar ni un palo con gancho (eso es el bichero)." },
  { id: "firme", n: "Firme", d: "La parte larga y principal del cabo, la que queda bajo tensión y trabaja.", trap: "No es el extremo (eso es el chicote)." },
  { id: "seno", n: "Seno", d: "El arco o curvatura que forma el cabo entre sus extremos cuando no trabaja o cuando se hace un nudo.", trap: "El seno no es la gaza: la gaza está cerrada con costura, ligada o nudo." },
  { id: "gaza", n: "Gaza", d: "Lazo u ojo que se forma en el extremo de un cabo doblándolo y uniéndolo con costura o ligada (o con un as de guía). Sirve para encapillar en un noray, bita o cornamusa.", trap: "Partes del cabo según el examen: chicote, seno y firme. La gaza se hace con ellas." },
  { id: "coca", n: "Coca", d: "Retorcimiento o vuelta que toma un cabo cuando se tuerce. Debilita el cabo y lo atasca en guías y poleas: evítalas adujando bien.", trap: "Adujar es recoger el cabo en vueltas circulares u oblongas para que no se enrede." }
];

const ELEMENTOS = [
  { id: "noray", n: "Noray", d: "Pieza de hierro de forma cilíndrica, ensanchada en su parte superior, fijada en los MUELLES para hacer firmes las amarras.", trap: "Está en el muelle, no en la cubierta (eso son bitas y cornamusas)." },
  { id: "bolardo", n: "Bolardo", d: "Noray asimétrico, con la cabeza curvada hacia un lado para que el cabo no se salga.", trap: "Muelle, igual que el noray." },
  { id: "bita", n: "Bita", d: "Pieza sólida de metal o madera muy unida a la cubierta, por lo regular dos columnas sobre una misma base, para tomar vueltas a cadenas y amarras o hacer firme un cabo.", trap: "Dos columnas = bita." },
  { id: "cornamusa", n: "Cornamusa", d: "Pieza de metal o madera encorvada en sus extremos y fija por su punto medio, que sirve para amarrar los cabos (se toman vueltas en forma de ocho).", trap: "Pieza en T fija por su centro = cornamusa." },
  { id: "argolla", n: "Argolla y cáncamo", d: "Aro metálico firme en el muelle (argolla) o perno con ojo (cáncamo) donde se afirma un cabo, por ejemplo con vuelta de rezón o por seno.", trap: "Amarrar por seno: pasar el cabo por la argolla y devolver el chicote a bordo para largar desde cubierta." },
  { id: "muerto", n: "Muerto", d: "Bloque de cemento o ancla de gran peso depositado en el fondo que, unido a la superficie por un orinque, cabo o cadena con boya, permite amarrar una embarcación.", trap: "El muerto está en el fondo; lo que flota es la boya." },
  { id: "boya", n: "Boya", d: "Cuerpo flotante sujeto al fondo mediante un lastre (muerto), que se coloca para amarrar una embarcación o como señalización.", trap: "No confundir con las defensas del costado." },
  { id: "defensas", n: "Defensas", d: "Piezas que se colocan en el costado (o en el muelle) para amortiguar golpes y roces al atracar. Se cuelgan con ballestrinque.", trap: "Las boyas no protegen el costado: eso son las defensas." },
  { id: "bichero", n: "Bichero", d: "Palo largo con un gancho y una punta en un extremo para coger la guía o las amarras, aguantar o separar la embarcación al atracar y desatracar.", trap: "No es el extremo de un cabo (chicote)." },
  { id: "guiacabos", n: "Guiacabos y gatera", d: "Guiacabos: pieza por la que se pasan y guían los cabos de amarre desde la embarcación hasta el muelle, evitando el roce. Gatera: abertura en la borda o cubierta por la que pasan cabos o cadenas.", trap: "No es la roldana (rueda acanalada de un motón)." },
  { id: "roldana", n: "Roldana", d: "Rueda acanalada por donde corre el cabo en un motón (polea).", trap: "La pieza con ranura que evita el roce es el guiacabos." }
];

function elemIcon(id) {
  const S = (inner) => `<svg viewBox="0 0 80 64" aria-hidden="true">${inner}</svg>`;
  const ground = `<line class="ic-g" x1="6" y1="56" x2="74" y2="56"/>`;
  switch (id) {
    case "noray": return S(`${ground}<path class="ic" d="M30 56V30h20v26M24 30c0-8 32-8 32 0z"/>`);
    case "bolardo": return S(`${ground}<path class="ic" d="M32 56V32h16v24M28 32c0-10 14-16 30-12-2 6-10 10-30 12z"/>`);
    case "bita": return S(`${ground}<path class="ic" d="M14 56h52v-6H14zM22 50V22h10v28M48 50V22h10v28M20 22h14M46 22h14"/>`);
    case "cornamusa": return S(`${ground}<path class="ic" d="M34 56V40h12v16M10 40c6-8 54-8 60 0-6 3-54 3-60 0z"/>`);
    case "argolla": return S(`<path class="ic-g" d="M40 6v52"/><rect class="ic" x="32" y="14" width="16" height="12" rx="2"/><circle class="ic" cx="40" cy="40" r="13"/>`);
    case "muerto": return S(`<path class="ic-w" d="M4 14q9-5 18 0t18 0 18 0 18 0"/><circle class="ic" cx="40" cy="12" r="6"/><path class="ic-g" d="M40 18v28" stroke-dasharray="3 3"/><rect class="ic" x="27" y="46" width="26" height="12" rx="2"/><line class="ic-g" x1="4" y1="58" x2="76" y2="58"/>`);
    case "boya": return S(`<path class="ic-w" d="M4 30q9-5 18 0t18 0 18 0 18 0"/><path class="ic" d="M28 30a12 12 0 0 1 24 0v4H28z"/><path class="ic-g" d="M40 34v24"/>`);
    case "defensas": return S(`<path class="ic-g" d="M10 6h60"/><path class="ic-g" d="M40 6v12"/><rect class="ic" x="30" y="18" width="20" height="40" rx="10"/>`);
    case "bichero": return S(`<path class="ic" d="M8 58L58 12"/><path class="ic" d="M58 12l8-6M58 12c8 0 10 8 4 12"/>`);
    case "guiacabos": return S(`<rect class="ic-g" x="6" y="44" width="68" height="12"/><path class="ic" d="M20 44c0-14 40-14 40 0M28 44c0-8 24-8 24 0"/><path class="ic-r" d="M4 38c20 0 40 0 72-10"/>`);
    case "roldana": return S(`<rect class="ic" x="22" y="10" width="36" height="46" rx="16"/><circle class="ic" cx="40" cy="33" r="12"/><circle class="ic" cx="40" cy="33" r="3"/>`);
  }
  return "";
}

/* ------------------------------------------------------------------ */
/* Juego: ¿Qué nudo usarías?                                           */
/* ------------------------------------------------------------------ */

const KN = { simple: "Nudo simple", ocho: "Nudo de ocho (lasca)", llano: "Nudo llano", escota: "Vuelta de escota", escota2: "Vuelta de escota doble", ballestrinque: "Ballestrinque", asdeguia: "As de guía", rezon: "Vuelta de rezón", cotes: "Vuelta redonda y dos medios cotes", mordida: "Vuelta mordida", margarita: "Margarita", seno: "As de guía por seno" };

const SITUACIONES = [
  { q: "Tienes que unir dos cabos de distinta mena para alargar una amarra.", a: "escota", x: "La vuelta de escota une cabos de distinto grosor: el grueso forma el seno y el fino lo rodea. El llano solo vale para cabos de la misma mena." },
  { q: "Unir por sus chicotes dos cabos de la misma mena, sin grandes cargas.", a: "llano", x: "El nudo llano une dos cabos de igual mena; al dejar de trabajar es fácil de deshacer." },
  { q: "Rematar el chicote de la escota del génova para que no se escape por el motón del carro.", a: "ocho", x: "El ocho (lasca) es el tope clásico: abulta, no pasa por la polea y se deshace fácil." },
  { q: "Colgar las defensas de un candelero antes de atracar.", a: "ballestrinque", x: "El ballestrinque (dos vueltas mordidas) es rápido, regulable y fácil de deshacer. El examen lo da como nudo para fijar defensas." },
  { q: "Hacer una gaza fija en el chicote de la amarra para lanzarla y encapillarla en un noray.", a: "asdeguia", x: "El as de guía forma una gaza no corrediza para encapillar en noray, bita o bolardo." },
  { q: "Amarrar el cabo del fondeo al arganeo del ancla.", a: "rezon", x: "La vuelta de rezón sirve para unir el cabo al arganeo del ancla o rezón; no se agarrota y se deshace aunque esté mojada." },
  { q: "Acortar una amarra demasiado larga sin cortarla.", a: "margarita", x: "La margarita acorta un cabo sin cortarlo; aguanta mientras está en tensión." },
  { q: "Un tramo de la amarra está rozado y no quieres que trabaje, pero no puedes cortarla.", a: "margarita", x: "En la margarita el ramal central no trabaja: ahí se deja el tramo dañado." },
  { q: "Afirmar rápidamente un cabo a una argolla del muelle con un nudo que no se agarrote.", a: "rezon", x: "La vuelta de rezón se usa para afirmar rápidamente un cabo a un palo, cáncamo o argolla (respuesta oficial del examen)." },
  { q: "Pasar un lazo alrededor del pecho de un tripulante caído al agua para izarlo sin que le apriete.", a: "asdeguia", x: "El as de guía forma una gaza que no se corre: no estrangula al que está dentro." },
  { q: "Atar un cabo fino a la gaza de una estacha gruesa.", a: "escota", x: "La vuelta de escota une un cabo a una gaza o a un cabo más grueso." },
  { q: "Unir dos cabos sintéticos muy resbaladizos y de grosor muy distinto que van a sufrir tirones.", a: "escota2", x: "La vuelta de escota doble da una vuelta más alrededor del seno y es más segura con cabos resbaladizos o menas muy distintas." },
  { q: "Atar los rizos de la vela por debajo de la botavara.", a: "llano", x: "El nudo llano también se llama de rizo: une los dos chicotes de un mismo cabo y es plano." },
  { q: "Poner un tope en el chicote de la driza para que no se pierda dentro del palo.", a: "ocho", x: "El ocho es el nudo de tope por excelencia." },
  { q: "Tope provisional en un cordino fino que no tendrás que deshacer.", a: "simple", x: "El nudo simple es el más rápido, pero se agarrota: solo si no importa tener que deshacerlo." },
  { q: "Ajustar la altura de una defensa colgada del guardamancebo.", a: "ballestrinque", x: "El ballestrinque se regula aflojando las vueltas y desplazándolo." },
  { q: "Amarrar el chinchorro a un pilote del pantalán donde el oleaje dará tirones toda la noche.", a: "cotes", x: "Con tirones, el ballestrinque puede aflojarse. Una vuelta redonda absorbe la carga y dos medios cotes la aseguran." },
  { q: "Asegurar el as de guía o el ballestrinque para que no se afloje.", a: "cotes", x: "Un medio cote (o dos) sobre el firme remata otros nudos." },
  { q: "Sujetar un cabo un instante a un gancho mientras preparas el nudo definitivo; aguantará en tensión.", a: "mordida", x: "La vuelta mordida aguanta solo mientras hay tensión: sujeción momentánea." },
  { q: "Hacer una gaza doble en mitad de un cabo, sin acceso a los chicotes, para izar a una persona.", a: "seno", x: "El as de guía por seno forma dos gazas fijas en mitad del cabo." },
  { q: "Atar la escota al puño de escota del foque.", a: "asdeguia", x: "El as de guía es el nudo habitual para afirmar la escota al puño: gaza fija que no se corre y se deshace bien." },
  { q: "Unir los dos chicotes de un cabo alrededor de una vela aferrada.", a: "llano", x: "Llano: une los chicotes de un mismo cabo (misma mena)." },
  { q: "Necesitas una gaza fija que tendrás que deshacer después de soportar una gran tensión.", a: "asdeguia", x: "El as de guía no se agarrota: se deshace fácilmente aunque haya trabajado mucho." },
  { q: "Que la escota no se salga de la mordaza o el winche si se te escapa.", a: "ocho", x: "Ocho en el chicote: tope que no pasa por guías ni poleas." },
  { q: "Afirmar provisionalmente un cabo a un candelero con tensión constante.", a: "ballestrinque", x: "Ballestrinque: rápido y fácil de deshacer; ideal mientras la tensión sea constante." },
  { q: "Amarrar el cabo de un rezón (ancla pequeña de cuatro uñas) para fondear el chinchorro.", a: "rezon", x: "Por eso se llama vuelta de rezón: une el cabo al arganeo del rezón o del ancla." },
  { q: "Dejar una gaza en el chicote de la amarra para dejarla en la bita del barco.", a: "asdeguia", x: "As de guía: gaza no corrediza para encapillar en bita, noray o cornamusa." },
  { q: "Unir un cabo de 8 mm a otro de 14 mm para remolcar el chinchorro.", a: "escota", x: "Menas distintas → vuelta de escota (el de 14 mm hace el seno)." },
  { q: "Hacer firme un cabo a una barra o percha de forma regulable, por ejemplo una boza al pasamanos.", a: "ballestrinque", x: "Ballestrinque: se hace en segundos sobre una barra y se regula con facilidad." },
  { q: "Amarrar a una argolla un cabo que debe quedar muy seguro, con tensión variable, y deshacerse sin esfuerzo.", a: "cotes", x: "La vuelta redonda reparte el roce y los dos medios cotes no se sueltan con tirones." },
  { q: "Unir dos cabos idénticos para hacer un estrobo sencillo alrededor de un objeto.", a: "llano", x: "Dos chicotes de la misma mena → nudo llano." },
  { q: "Necesitas un nudo de tope que, aunque se moje y cargue, puedas deshacer luego sin pelearte.", a: "ocho", x: "El ocho se deshace con facilidad; el simple, en cambio, se agarrota." },
  { q: "Dar una gaza al chicote del cabo que lanzarás al marinero del muelle para que lo pase por el bolardo.", a: "asdeguia", x: "Lanzar la gaza hecha con as de guía permite encapillarla directamente en el bolardo." }
];

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */

const CSS = `
.m-nudos{display:flex;flex-direction:column;gap:1rem;min-width:0}
.m-nudos [hidden]{display:none!important}
.m-nudos .m-head{display:flex;flex-direction:column;gap:.25rem}
.m-nudos .m-tabs{align-self:flex-start;max-width:100%}
.m-nudos .m-knots{display:flex;flex-wrap:wrap;gap:.4rem}
.m-nudos .m-knots button{cursor:pointer}
.m-nudos .m-knots button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.m-nudos .m-stage{aspect-ratio:400/260;max-width:min(100%,92vh,760px);margin-inline:auto}
.m-nudos .m-stage svg{width:100%;height:100%}
.m-nudos .rope{--rc:var(--accent)}
.m-nudos .rope.c1{--rc:var(--buoy-y)}
.m-nudos .rope.c2{--rc:var(--stbd)}
.m-nudos .rope path{fill:none;stroke-linecap:butt;stroke-linejoin:round}
.m-nudos .rope .shadow{stroke:#000;opacity:.13}
.m-nudos .rope .edge{stroke:color-mix(in srgb,var(--rc) 50%,#000)}
.m-nudos .rope .body{stroke:var(--rc)}
.m-nudos .rope .lay{stroke:color-mix(in srgb,var(--rc) 62%,#000);opacity:.38}
.m-nudos .rope .hl{stroke:color-mix(in srgb,var(--rc) 45%,#fff);opacity:.75}
.m-nudos .rope circle.edge{fill:color-mix(in srgb,var(--rc) 50%,#000);stroke:none}
.m-nudos .rope circle.body{fill:var(--rc);stroke:none}
.m-nudos .rope .whip{stroke:color-mix(in srgb,var(--rc) 30%,#000);stroke-linecap:butt}
.m-nudos .obj{fill:color-mix(in srgb,var(--muted) 45%,var(--sheet));stroke:var(--muted);stroke-width:1.5}
.m-nudos .obj-hl{fill:var(--sheet);opacity:.45}
.m-nudos .obj-hl2{fill:var(--sheet);opacity:.35}
.m-nudos .ring{fill:none;stroke:var(--muted);stroke-width:12}
.m-nudos .ring-hl{fill:none;stroke:var(--sheet);stroke-width:3;opacity:.45;transform:translate(-2px,-2px)}
.m-nudos .lbl{font:600 12px var(--f-body);fill:var(--ink);paint-order:stroke;stroke:var(--sheet);stroke-width:3.5px;stroke-linejoin:round}
.m-nudos .lbl.sm{font-size:11px;fill:var(--muted)}
.m-nudos .lbl.acc{fill:var(--accent)}
.m-nudos .lead{stroke:var(--muted);stroke-width:1;stroke-dasharray:2 3}
.m-nudos .m-step{min-height:3.2em;font-size:1.02rem}
.m-nudos .m-step b{font-family:var(--f-mono);font-size:.85rem;color:var(--muted);margin-right:.4em}
.m-nudos .m-dots{display:flex;gap:4px;flex-wrap:wrap}
.m-nudos .m-dots span{width:22px;height:5px;border-radius:3px;background:var(--line)}
.m-nudos .m-dots span.on{background:var(--accent)}
.m-nudos .m-info h4{margin-bottom:.3rem}
.m-nudos .m-info ul{margin:0;padding-left:1.1em}
.m-nudos .m-info li{margin:.15em 0}
.m-nudos .m-pros li::marker{color:var(--ok)}
.m-nudos .m-cons li::marker{color:var(--bad)}
.m-nudos .m-no li::marker{color:var(--bad)}
.m-nudos .m-rule{border-left:3px solid var(--accent);padding-left:.7rem}
.m-nudos .m-infoonly ol{margin:0;padding-left:1.2em}
.m-nudos .m-infoonly li{margin:.35em 0}
.m-nudos .m-parts svg{width:100%;height:auto;display:block}
.m-nudos .hot{cursor:pointer}
.m-nudos .hot .halo{fill:var(--accent);opacity:0;transition:opacity .15s}
.m-nudos .hot:hover .halo,.m-nudos .hot.on .halo{opacity:.18}
.m-nudos .hot .tag{font:700 12px var(--f-body);fill:var(--ink);paint-order:stroke;stroke:var(--sheet);stroke-width:3.5px}
.m-nudos .hot.on .tag{fill:var(--accent)}
.m-nudos .m-cards{display:grid;gap:.6rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))}
.m-nudos .m-card{display:flex;flex-direction:column;align-items:center;gap:.2rem;padding:.6rem .4rem;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);cursor:pointer;color:var(--ink);font-weight:600}
.m-nudos .m-card:hover{background:var(--sea)}
.m-nudos .m-card[aria-pressed="true"]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
.m-nudos .m-card svg{width:72px;height:58px}
.m-nudos .ic{fill:none;stroke:var(--ink);stroke-width:3;stroke-linejoin:round;stroke-linecap:round}
.m-nudos .ic-g{fill:none;stroke:var(--muted);stroke-width:2.5}
.m-nudos .ic-w{fill:none;stroke:var(--sea-2);stroke-width:3}
.m-nudos .ic-r{fill:none;stroke:var(--accent);stroke-width:3.5;stroke-linecap:round}
.m-nudos .m-opts{display:grid;gap:.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))}
.m-nudos .m-opts .btn{justify-content:flex-start;text-align:left;white-space:normal}
.m-nudos .m-opts .btn.ok{border-color:var(--ok);color:var(--ok)}
.m-nudos .m-opts .btn.bad{border-color:var(--bad);color:var(--bad)}
.m-nudos .m-bar{height:8px;border-radius:4px;background:var(--line);overflow:hidden}
.m-nudos .m-bar i{display:block;height:100%;background:var(--ok);transition:width .3s}
.m-nudos .m-q{font-size:1.08rem;font-weight:600}
.m-nudos .m-why{border-left:3px solid var(--line);padding-left:.7rem}
`;

/* ------------------------------------------------------------------ */
/* Módulo                                                              */
/* ------------------------------------------------------------------ */

export const _debug = { KNOTS, renderKnot };

export default {
  id: ID,
  tema: 2,
  title: "Taller de nudos",
  icon: "∞",
  desc: "Anima paso a paso los nudos del examen, aprende para qué sirve cada uno y elige el nudo correcto en 33 situaciones a bordo.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const st = document.createElement("style"); st.dataset.mod = ID; st.textContent = CSS; document.head.appendChild(st);
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.createElement("div");
    root.className = "m-nudos";
    el.appendChild(root);
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const lis = (a) => a.map((x) => `<li>${esc(x)}</li>`).join("");

    root.innerHTML = `
      <div class="m-head"><span class="eyebrow">Tema 2 · Amarre y fondeo</span><h2>Taller de nudos</h2>
      <p class="muted small">Cada nudo se construye paso a paso. Fíjate en qué tramo pasa por encima y cuál por debajo.</p></div>
      <div class="seg m-tabs" role="group" aria-label="Secciones">
        <button data-tab="taller" aria-pressed="true">Nudos</button>
        <button data-tab="partes" aria-pressed="false">Partes del cabo</button>
        <button data-tab="amarre" aria-pressed="false">Elementos de amarre</button>
        <button data-tab="juego" aria-pressed="false">¿Qué nudo usarías?</button>
      </div>
      <section data-pane="taller" class="stack"></section>
      <section data-pane="partes" class="stack" hidden></section>
      <section data-pane="amarre" class="stack" hidden></section>
      <section data-pane="juego" class="stack" hidden></section>`;

    const panes = {};
    root.querySelectorAll("[data-pane]").forEach((p) => (panes[p.dataset.pane] = p));
    const tabs = root.querySelectorAll(".m-tabs button");
    const showTab = (t) => {
      tabs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === t)));
      Object.entries(panes).forEach(([k, p]) => (p.hidden = k !== t));
      ctx.store.set("tab", t);
      if (t !== "taller") stopPlay();
    };
    tabs.forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

    /* ---------------- Taller ---------------- */
    const P = panes.taller;
    P.innerHTML = `
      <div class="m-knots" role="group" aria-label="Nudos">${KNOTS.map((k) => `<button class="chip" data-k="${k.id}" aria-pressed="false">${esc(k.name)}</button>`).join("")}</div>
      <div class="panel stack">
        <div class="row" style="justify-content:space-between"><div><h3 class="m-kname"></h3><span class="muted small m-kalias"></span></div><div class="m-dots"></div></div>
        <div class="stage m-stage"><svg viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="Animación del nudo"></svg></div>
        <div class="m-infoonly tint" hidden></div>
        <p class="m-step" aria-live="polite"></p>
        <div class="row">
          <button class="btn sm m-prev" aria-label="Paso anterior">‹ Anterior</button>
          <button class="btn sm primary m-play">Reproducir</button>
          <button class="btn sm m-next" aria-label="Paso siguiente">Siguiente ›</button>
          <button class="btn sm ghost m-reset">Reiniciar</button>
          <span class="muted small" style="margin-left:auto">Velocidad</span>
          <div class="seg m-speed" role="group" aria-label="Velocidad">
            <button data-v="0.5" aria-pressed="false">0,5×</button><button data-v="1" aria-pressed="true">1×</button><button data-v="2" aria-pressed="false">2×</button>
          </div>
        </div>
      </div>
      <div class="grid m-info"></div>`;
    const svg = P.querySelector("svg");
    const elName = P.querySelector(".m-kname"), elAlias = P.querySelector(".m-kalias"), elStep = P.querySelector(".m-step");
    const elDots = P.querySelector(".m-dots"), elInfo = P.querySelector(".m-info"), elOnly = P.querySelector(".m-infoonly");
    const stageEl = P.querySelector(".m-stage"), btnPlay = P.querySelector(".m-play");
    let knot = null, step = 0, cur = [], target = [], playing = false, speed = 1, raf = 0, lastT = 0, holdUntil = 0, visible = true;
    const seen = new Set(ctx.store.get("seen", []));

    const toPair = (k, ri, v) => {
      const max = k.ropes[ri].pts.length - 1;
      if (v == null) return [0, max];
      return Array.isArray(v) ? [v[0], v[1]] : [0, v];
    };
    const stepRev = (k, i) => k.ropes.map((r, ri) => toPair(k, ri, k.steps[i].r[ri]));

    function draw() {
      if (!knot || knot.info) return;
      svg.innerHTML = renderKnot(knot, cur);
    }
    function setStepUI() {
      elStep.innerHTML = `<b>${step + 1}/${knot.steps.length}</b>${esc(knot.steps[step].t)}`;
      elDots.innerHTML = knot.steps.map((_, i) => `<span class="${i <= step ? "on" : ""}"></span>`).join("");
      P.querySelector(".m-prev").disabled = step === 0;
      P.querySelector(".m-next").disabled = step >= knot.steps.length - 1;
    }
    function goStep(i, instant) {
      step = Math.max(0, Math.min(knot.steps.length - 1, i));
      setStepUI();
      if (knot.info) return;
      target = stepRev(knot, step);
      if (instant || reduce) { cur = target.map((p) => p.slice()); draw(); }
      else kick();
      if (step === knot.steps.length - 1 && !seen.has(knot.id)) {
        seen.add(knot.id); ctx.store.set("seen", [...seen]);
        ctx.award(5, `Nudo visto: ${knot.name}`);
      }
    }
    function selectKnot(id) {
      stopPlay();
      knot = KNOTS.find((k) => k.id === id) || KNOTS[0];
      ctx.store.set("knot", knot.id);
      P.querySelectorAll(".m-knots button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === knot.id)));
      elName.textContent = knot.name; elAlias.textContent = knot.alias || "";
      stageEl.hidden = !!knot.info; elOnly.hidden = !knot.info;
      P.querySelectorAll(".m-play,.m-reset").forEach((b) => (b.hidden = !!knot.info));
      if (knot.info) {
        elOnly.innerHTML = `<p class="small muted">Sin animación: sigue los pasos (se hace igual que el as de guía, pero con el cabo doblado).</p><ol>${knot.steps.map((s) => `<li>${esc(s.t)}</li>`).join("")}</ol>`;
      } else {
        prepKnot(knot);
        cur = knot.ropes.map((r, ri) => { const p = toPair(knot, ri, knot.steps[0].r[ri]); return [p[0], p[0]]; });
      }
      elInfo.innerHTML = `
        <div class="panel"><h4>Partes del cabo implicadas</h4><ul>${lis(knot.parts)}</ul>${knot.rule ? `<p class="m-rule small" style="margin-top:.6rem">${esc(knot.rule)}</p>` : ""}</div>
        <div class="panel"><h4>Para qué sirve</h4><p>${esc(knot.uso)}</p></div>
        <div class="panel"><h4>Cuándo usarlo</h4><ul>${lis(knot.si)}</ul></div>
        <div class="panel m-no"><h4>Cuándo NO</h4><ul>${lis(knot.no)}</ul></div>
        <div class="panel m-pros"><h4>Ventajas</h4><ul>${lis(knot.pros)}</ul></div>
        <div class="panel m-cons"><h4>Inconvenientes</h4><ul>${lis(knot.contras)}</ul></div>`;
      goStep(0, false);
      if (knot.info && !seen.has(knot.id)) { seen.add(knot.id); ctx.store.set("seen", [...seen]); }
    }

    function tick(t) {
      raf = 0;
      if (!visible || panes.taller.hidden || !knot || knot.info) { lastT = 0; return; }
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016;
      lastT = t;
      let moving = false;
      const v = 4 * speed * dt; // puntos de control por segundo
      cur = cur.map((c, ri) => {
        const tg = target[ri];
        return c.map((val, j) => {
          const d = tg[j] - val;
          if (Math.abs(d) <= v) return tg[j];
          moving = true;
          return val + Math.sign(d) * v;
        });
      });
      draw();
      if (!moving && playing) {
        if (!holdUntil) holdUntil = t + 1100 / speed;
        if (t >= holdUntil) {
          holdUntil = 0;
          if (step < knot.steps.length - 1) goStep(step + 1);
          else stopPlay();
        }
      }
      if (moving || playing) raf = requestAnimationFrame(tick);
      else lastT = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    function stopPlay() { playing = false; holdUntil = 0; btnPlay.textContent = "Reproducir"; }

    P.querySelectorAll(".m-knots button").forEach((b) => b.addEventListener("click", () => selectKnot(b.dataset.k)));
    P.querySelector(".m-prev").addEventListener("click", () => { stopPlay(); goStep(step - 1); });
    P.querySelector(".m-next").addEventListener("click", () => { stopPlay(); goStep(step + 1); });
    P.querySelector(".m-reset").addEventListener("click", () => { stopPlay(); selectKnot(knot.id); });
    btnPlay.addEventListener("click", () => {
      if (playing) { stopPlay(); return; }
      if (reduce) { goStep(knot.steps.length - 1, true); return; }
      if (step >= knot.steps.length - 1) { selectKnot(knot.id); }
      playing = true; btnPlay.textContent = "Pausa"; holdUntil = 0; kick();
    });
    P.querySelectorAll(".m-speed button").forEach((b) => b.addEventListener("click", () => {
      speed = +b.dataset.v;
      P.querySelectorAll(".m-speed button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));

    /* ---------------- Partes del cabo ---------------- */
    const PP = panes.partes;
    const partRope = {
      id: "partes", ropes: [{ c: 0, w: 14, cap0: true, pts: [
        [12, 70], [70, 62], [120, 66], [160, 92], [180, 140], [215, 180], [260, 182], [300, 150], [306, 112], [292, 96],
        [276, 104, -1], [282, 124], [306, 128], [340, 110], [366, 78], [372, 46], [356, 22], [330, 22], [318, 44], [332, 66], [352, 74]
      ] }]
    };
    const ropeSvg = renderKnot(prepKnot(partRope), [20], { noLabels: true });
    const HOT = {
      firme: { x: 120, y: 68, r: 30, tx: 120, ty: 34 },
      seno: { x: 228, y: 172, r: 32, tx: 228, ty: 226 },
      coca: { x: 290, y: 112, r: 22, tx: 268, ty: 160 },
      gaza: { x: 346, y: 46, r: 30, tx: 346, ty: 104 },
      chicote: { x: 18, y: 70, r: 16, tx: 24, ty: 104 }
    };
    // gaza: ligada (costura) dibujada sobre el cabo
    const ligada = `<rect x="333" y="61" width="24" height="16" rx="3" transform="rotate(20 345 69)" style="fill:var(--muted);opacity:.85"/>`;
    PP.innerHTML = `
      <div class="panel stack m-parts">
        <h3>Partes de un cabo</h3>
        <p class="muted small">Toca cada parte. Para el examen, las partes de un cabo son <b>chicote, seno y firme</b>.</p>
        <div class="stage"><svg viewBox="0 0 400 240" role="img" aria-label="Partes de un cabo">${ropeSvg}${ligada}
          ${Object.entries(HOT).map(([k, h]) => `<g class="hot" data-p="${k}" tabindex="0" role="button" aria-label="${k}"><circle class="halo" cx="${h.x}" cy="${h.y}" r="${h.r}"/><text class="tag" x="${h.tx}" y="${h.ty}" text-anchor="middle">${k}</text></g>`).join("")}
        </svg></div>
        <div class="tint m-pdef" aria-live="polite"><p class="muted">Toca una parte del cabo.</p></div>
        <p class="small muted"><b>Mena</b>: grosor del cabo (se mide por su circunferencia o diámetro). Cabos de igual mena → llano; de distinta mena → vuelta de escota.</p>
      </div>`;
    const pdef = PP.querySelector(".m-pdef");
    const showPart = (id) => {
      const p = PARTES.find((x) => x.id === id);
      PP.querySelectorAll(".hot").forEach((g) => g.classList.toggle("on", g.dataset.p === id));
      pdef.innerHTML = `<h4>${esc(p.n)}</h4><p>${esc(p.d)}</p><p class="small" style="margin-top:.4rem"><span class="chip warn">Trampa</span> ${esc(p.trap)}</p>`;
    };
    PP.querySelectorAll(".hot").forEach((g) => {
      g.addEventListener("click", () => showPart(g.dataset.p));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showPart(g.dataset.p); } });
    });

    /* ---------------- Elementos de amarre ---------------- */
    const PA = panes.amarre;
    PA.innerHTML = `
      <div class="panel stack">
        <h3>Elementos de amarre</h3>
        <p class="muted small">Toca cada elemento para ver su definición de examen.</p>
        <div class="m-cards">${ELEMENTOS.map((e) => `<button class="m-card" data-e="${e.id}" aria-pressed="false">${elemIcon(e.id)}<span>${esc(e.n)}</span></button>`).join("")}</div>
        <div class="tint m-edef" aria-live="polite"><p class="muted">Selecciona un elemento.</p></div>
      </div>
      <div class="panel stack">
        <div class="row" style="justify-content:space-between"><h3>¿Qué es?</h3><span class="chip m-escore">0/0</span></div>
        <p class="m-eq"></p>
        <div class="m-opts m-eopts"></div>
        <p class="m-efb small" aria-live="polite"></p>
        <div class="row"><button class="btn sm m-enext">Otra</button></div>
        <p class="small muted">El <b>orinque</b> NO es un elemento de amarre: es el cabo que une la cruz del ancla con un boyarín para balizarla y recuperarla.</p>
      </div>`;
    const edef = PA.querySelector(".m-edef");
    PA.querySelectorAll(".m-card").forEach((b) => b.addEventListener("click", () => {
      const e = ELEMENTOS.find((x) => x.id === b.dataset.e);
      PA.querySelectorAll(".m-card").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      edef.innerHTML = `<h4>${esc(e.n)}</h4><p>${esc(e.d)}</p><p class="small" style="margin-top:.4rem"><span class="chip warn">Trampa</span> ${esc(e.trap)}</p>`;
    }));
    let eq = null, eAns = false, eOk = 0, eTot = 0;
    const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    function newEQ() {
      eq = ELEMENTOS[Math.floor(Math.random() * ELEMENTOS.length)];
      eAns = false;
      const opts = shuffle([eq, ...shuffle(ELEMENTOS.filter((x) => x !== eq)).slice(0, 3)]);
      PA.querySelector(".m-eq").textContent = "«" + eq.d.replace(eq.n.split(" ")[0], "…").split(". ")[0].replace(/\.$/, "") + ".»";
      PA.querySelector(".m-eopts").innerHTML = opts.map((o) => `<button class="btn" data-e="${o.id}">${esc(o.n)}</button>`).join("");
      PA.querySelector(".m-efb").textContent = "";
      PA.querySelectorAll(".m-eopts .btn").forEach((b) => b.addEventListener("click", () => {
        if (eAns) return; eAns = true; eTot++;
        const ok = b.dataset.e === eq.id;
        b.classList.add(ok ? "ok" : "bad");
        PA.querySelector(`.m-eopts .btn[data-e="${eq.id}"]`).classList.add("ok");
        if (ok) { eOk++; ctx.award(5, "Elemento de amarre"); }
        PA.querySelector(".m-efb").innerHTML = `<span class="${ok ? "fb-ok" : "fb-bad"}">${ok ? "Correcto." : "No."}</span> ${esc(eq.n)}: ${esc(eq.trap)}`;
        PA.querySelector(".m-escore").textContent = `${eOk}/${eTot}`;
      }));
    }
    PA.querySelector(".m-enext").addEventListener("click", newEQ);
    newEQ();

    /* ---------------- Juego ---------------- */
    const PG = panes.juego;
    const solved = new Set(ctx.store.get("solved", []).filter((i) => i < SITUACIONES.length));
    let order = [], qi = 0, answered = false, streak = 0, badgeGiven = !!ctx.store.get("badge", false);
    PG.innerHTML = `
      <div class="panel stack">
        <div class="row" style="justify-content:space-between"><h3>¿Qué nudo usarías?</h3><span class="chip m-gscore"></span></div>
        <div class="m-bar" aria-hidden="true"><i></i></div>
        <p class="small muted">Acierta las ${SITUACIONES.length} situaciones (en cualquier orden) para ganar la insignia «Mano de nudos».</p>
        <p class="m-q" aria-live="polite"></p>
        <div class="m-opts m-gopts"></div>
        <div class="m-why small" hidden></div>
        <div class="row"><button class="btn sm primary m-gnext">Siguiente</button><button class="btn sm ghost m-gpend">Solo las pendientes</button><button class="btn sm ghost m-greset">Reiniciar progreso</button></div>
      </div>`;
    const gq = PG.querySelector(".m-q"), gopts = PG.querySelector(".m-gopts"), gwhy = PG.querySelector(".m-why");
    function gScore() {
      PG.querySelector(".m-gscore").textContent = `${solved.size}/${SITUACIONES.length}`;
      PG.querySelector(".m-bar i").style.width = (100 * solved.size / SITUACIONES.length) + "%";
    }
    function buildOrder(pendOnly) {
      let idx = SITUACIONES.map((_, i) => i);
      if (pendOnly) { const p = idx.filter((i) => !solved.has(i)); if (p.length) idx = p; }
      order = shuffle(idx); qi = 0;
    }
    function showQ() {
      const i = order[qi % order.length], s = SITUACIONES[i];
      answered = false; gwhy.hidden = true;
      gq.textContent = s.q;
      const distract = shuffle(Object.keys(KN).filter((k) => k !== s.a && !(s.a.startsWith("escota") && k.startsWith("escota")))).slice(0, 3);
      const opts = shuffle([s.a, ...distract]);
      gopts.innerHTML = opts.map((k) => `<button class="btn" data-k="${k}">${esc(KN[k])}</button>`).join("");
      gopts.querySelectorAll(".btn").forEach((b) => b.addEventListener("click", () => {
        if (answered) return; answered = true;
        const ok = b.dataset.k === s.a;
        b.classList.add(ok ? "ok" : "bad");
        gopts.querySelector(`.btn[data-k="${s.a}"]`).classList.add("ok");
        gwhy.hidden = false;
        gwhy.innerHTML = `<p><span class="${ok ? "fb-ok" : "fb-bad"}">${ok ? "Correcto." : "No: " + esc(KN[s.a]) + "."}</span> ${esc(s.x)}</p>` +
          (ok ? "" : `<p class="muted" style="margin-top:.3rem">${esc(KN[b.dataset.k])}: ${esc((KNOTS.find((k) => k.id === b.dataset.k) || {}).uso || "")}</p>`) +
          `<p style="margin-top:.4rem"><button class="btn sm ghost m-see" data-k="${s.a}">Ver ${esc(KN[s.a])} en el taller</button></p>`;
        gwhy.querySelector(".m-see").addEventListener("click", () => { showTab("taller"); selectKnot(s.a); });
        if (ok) {
          streak++;
          if (!solved.has(i)) { solved.add(i); ctx.store.set("solved", [...solved]); ctx.award(10, "Nudo correcto"); }
          if (streak > 0 && streak % 10 === 0) ctx.toast(`${streak} aciertos seguidos`);
          if (solved.size === SITUACIONES.length && !badgeGiven) {
            badgeGiven = true; ctx.store.set("badge", true); ctx.award(40, "Todas las situaciones de nudos"); ctx.badge("mano-de-nudos");
          }
        } else streak = 0;
        gScore();
      }));
    }
    PG.querySelector(".m-gnext").addEventListener("click", () => { qi++; if (qi >= order.length) buildOrder(false); showQ(); });
    PG.querySelector(".m-gpend").addEventListener("click", () => { buildOrder(true); showQ(); });
    PG.querySelector(".m-greset").addEventListener("click", () => { solved.clear(); ctx.store.set("solved", []); gScore(); buildOrder(false); showQ(); });
    buildOrder(true); showQ(); gScore();

    /* ---------------- Visibilidad y arranque ---------------- */
    const io = new IntersectionObserver((ents) => {
      visible = ents.some((e) => e.isIntersecting);
      if (visible) kick();
    });
    io.observe(stageEl);
    selectKnot(ctx.store.get("knot", "asdeguia"));
    const t0 = ctx.store.get("tab", "taller");
    showTab(panes[t0] ? t0 : "taller");

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; playing = false;
      io.disconnect();
      root.remove();
    };
  }
};
