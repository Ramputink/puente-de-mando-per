// Barómetro aneroide, unidades, temperatura, humedad y niebla, glosario del viento y reto final de meteorología
// (Tema 9 · 9.2 / 9.3 / 9.5). Claves contrastadas con q_met.txt (0988bc25cd, 3788d05cef, 49d8dc8305,
// 5fecc3b45f, 515ab5791c, 31f801ecad, 1124a0c86a, f5a5f1fe4f, 33f46a4022…).

const ID = "barometro";

const CSS = `
.m-barometro .ba-top{display:flex;flex-wrap:wrap;gap:.6rem;align-items:flex-end;justify-content:space-between}
.m-barometro .ba-two{display:grid;gap:1rem;grid-template-columns:minmax(0,1fr)}
@media (min-width:720px){.m-barometro .ba-two{grid-template-columns:minmax(0,340px) minmax(0,1fr)}}
.m-barometro .ba-dial{width:100%;max-width:340px;height:auto;justify-self:center;touch-action:none;user-select:none}
.m-barometro .ba-dial text{font-family:var(--f-mono)}
.m-barometro .ba-big{font:600 1.9rem/1 var(--f-display)}
.m-barometro dl.ba-dl{display:grid;grid-template-columns:auto 1fr;gap:.3rem .8rem;margin:0}
.m-barometro dl.ba-dl dt{font-weight:700;color:var(--muted);font-size:.85rem}
.m-barometro dl.ba-dl dd{margin:0}
.m-barometro .ba-sl{display:grid;gap:.15rem}
.m-barometro .ba-sl span{display:flex;justify-content:space-between;gap:.5rem;font-size:.92rem}
.m-barometro .ba-inp{display:grid;gap:.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,120px),1fr))}
.m-barometro .ba-inp label{display:grid;gap:.15rem;font-size:.85rem;color:var(--muted);font-weight:600}
.m-barometro .ba-inp input{width:100%;min-height:40px;padding:.3em .5em;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);font-family:var(--f-mono)}
.m-barometro .ba-cards{display:grid;gap:.7rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.m-barometro .ba-card{border:1px solid var(--line);border-radius:var(--r);padding:.75rem .9rem;background:var(--sheet);display:grid;gap:.3rem;align-content:start}
.m-barometro .ba-card h4{display:flex;justify-content:space-between;gap:.5rem;align-items:center}
.m-barometro .ba-opts{display:grid;gap:.5rem}
.m-barometro .ba-opts .btn{justify-content:flex-start;text-align:left;height:auto}
.m-barometro .btn.is-ok{border-color:var(--ok);color:var(--ok)}
.m-barometro .btn.is-bad{border-color:var(--bad);color:var(--bad)}
.m-barometro .ba-spin{transform-origin:0 0;animation:m-barometro-veer 4s ease-in-out infinite alternate}
.m-barometro .ba-spin.lev{animation-name:m-barometro-back}
@keyframes m-barometro-veer{from{transform:rotate(0)}to{transform:rotate(90deg)}}
@keyframes m-barometro-back{from{transform:rotate(0)}to{transform:rotate(-90deg)}}
.m-barometro ul{margin:0;padding-left:1.1rem}
.m-barometro li{margin:.15rem 0}
.m-barometro .ba-bar{height:10px;border-radius:999px;background:var(--sea-2);overflow:hidden}
.m-barometro .ba-bar i{display:block;height:100%;background:var(--accent)}
`;

const fmt = (n, d = 0) => Number(n).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pnum = s => { s = String(s).trim(); if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); return parseFloat(s); };

const P0 = 950, P1 = 1050, A0 = -140, SPAN = 280;
const ang = p => A0 + (clamp(p, P0 - 2, P1 + 2) - P0) / (P1 - P0) * SPAN;
const pol = (a, r) => [r * Math.sin(a * Math.PI / 180), -r * Math.cos(a * Math.PI / 180)];
const MMHG = 1.333224; // hPa por mm Hg

const SCN = [
  { k: "borrasca", t: "Se acerca una borrasca", r: -1.7 },
  { k: "lenta", t: "Bajada lenta", r: -.55 },
  { k: "estable", t: "Estable", r: 0 },
  { k: "sube", t: "Subida lenta", r: .55 },
  { k: "frio", t: "Tras un frente frío", r: 1.7 },
];
function trend(d) {
  if (d <= -4) return { k: "Bajada rápida", c: "bad", f: "Mal tiempo próximo: se acerca una borrasca o un frente. Viento fuerte en pocas horas. Busca abrigo o no salgas." };
  if (d <= -1) return { k: "Bajada lenta y continua", c: "warn", f: "Empeorarán las condiciones meteorológicas (clave oficial). Empeoramiento más lento pero más duradero." };
  if (d < 1) return { k: "Estable", c: "ok", f: "Se mantiene el tiempo actual." };
  if (d < 4) return { k: "Subida lenta y continua", c: "ok", f: "Las condiciones meteorológicas mejorarán (clave oficial): buen tiempo duradero." };
  return { k: "Subida rápida", c: "warn", f: "Mejora poco duradera. Tras un frente frío puede soplar viento fuerte y racheado del NW con chubascos." };
}

const TERMS = [
  ["Rolar", "Cambiar el viento de dirección. Es el único término que no implica variar la intensidad."],
  ["Rolar dextrógiro", "Rolar en el sentido de las agujas del reloj: N → NE → E. Típico en la Península al pasar una borrasca por el norte (S → SW → W → NW).", "dex"],
  ["Rolar levógiro", "Rolar en sentido contrario a las agujas del reloj: N → NW → W. Ocurre si la borrasca pasa al sur de ti.", "lev"],
  ["Refrescar", "Aumentar la intensidad del viento. No tiene nada que ver con la temperatura."],
  ["Caer", "Disminuir la intensidad del viento."],
  ["Calmar", "Disminuir el viento (o la mar), total o parcialmente."],
  ["Racha", "Aumento brusco, repentino y momentáneo de la intensidad del viento."],
  ["Encalmada", "Ausencia total de viento durante un tiempo: el velero queda parado (calma chicha)."],
  ["Alisios", "Vientos regulares y constantes que soplan desde las altas presiones subtropicales hacia las bajas ecuatoriales: del NE en el HN y del SE en el HS."],
  ["Viento real", "El que existe en un momento dado y se percibe con la embarcación parada."],
  ["Viento relativo", "El que provoca la propia embarcación al avanzar: igual a su velocidad y de sentido contrario a su rumbo."],
  ["Viento aparente", "Suma vectorial del real y el relativo: el que notas navegando y el que mide el anemómetro a bordo."],
  ["Viento del NW", "El que procede (viene) del NW. El viento se nombra por donde viene; la corriente, por donde va."],
  ["Anemómetro · veleta", "Anemómetro (cazoletas): velocidad del viento. Veleta: dirección."],
  ["Catavientos · grímpola", "Catavientos: cintas o lanillas en las velas. Grímpola: banderita en el tope del palo. La corredera NO mide viento (mide la velocidad del barco)."],
];

const Q = [
  { q: "Navegando, el barómetro ha bajado 6 mb en las últimas 3 horas. ¿Qué esperas?", o: ["Viento fuerte y mal tiempo en pocas horas: busco abrigo", "Mejoría a lo largo del día", "Nada: sigue por encima de 1000 mb", "Subida de la temperatura y caída del viento"], e: "Una bajada de más de 4 mb en 3 h anuncia una borrasca o un frente cercanos. Lo importante es la tendencia, no el valor." },
  { q: "Observas en el barómetro una bajada lenta y suave de la presión. Esto quiere decir que:", o: ["Empeorarán las condiciones meteorológicas", "Las condiciones mejorarán a lo largo del día", "Aumentará la temperatura y bajará el viento", "Aumentará el viento de componente norte en el HN"], e: "Clave oficial (0988bc25cd): bajada lenta y suave → empeorarán las condiciones." },
  { q: "Observas una subida lenta y suave de la presión. Esto quiere decir que:", o: ["Las condiciones meteorológicas mejorarán", "Se esperan vientos fuertes sostenidos", "Aumentará la mar de fondo", "Aumentará el viento de componente sur"], e: "Clave oficial (3788d05cef): subida lenta y suave → mejorarán." },
  { q: "¿Qué factor es fundamental para predecir el tiempo con un barómetro aneroide?", o: ["La tendencia de la presión en las últimas horas", "El valor absoluto en un momento dado", "El color de la aguja indicadora", "La comparación entre presión, profundidad y altitud"], e: "Clave oficial (49d8dc8305): la tendencia (subida, bajada o estabilidad). Para eso sirve la aguja testigo." },
  { q: "La presión normal a nivel del mar, 1013,25 hPa, equivale a:", o: ["760 mm de mercurio", "1013 mm de mercurio", "29,92 mm de mercurio", "100 mm de mercurio"], e: "1013,25 hPa = 1013,25 mb = 760 mm Hg = 29,92 pulgadas = 1 atmósfera. Ojo: 29,92 son pulgadas, no milímetros." },
  { q: "Un milibar es equivalente a:", o: ["1 hectopascal", "1000 bares", "1 atmósfera", "1013 Pa"], e: "1 mb = 1 hPa = 100 Pa. La presión media son 1013 mb (no bares, ni Pa, ni atmósferas)." },
  { q: "En el Hemisferio Norte te pones de espaldas al viento. ¿Dónde quedan las bajas presiones?", o: ["A la izquierda, algo adelantadas", "A la derecha, algo adelantadas", "Justo detrás de ti", "Justo delante de ti"], e: "Ley de Buys-Ballot (HN): de espaldas al viento, bajas a la izquierda. Cara al viento, la borrasca queda a la derecha, entre 90° y 135°." },
  { q: "Sopla viento del SW (HN). ¿Hacia dónde queda aproximadamente el centro de la borrasca?", o: ["Hacia el NW–N", "Hacia el SE", "Hacia el SW", "Hacia el E"], e: "De espaldas a un viento del SW miras al NE; las bajas quedan a tu izquierda algo adelantadas: hacia el NW–N." },
  { q: "Una borrasca atlántica pasa al norte de tu posición, de W a E. ¿Cómo rolará el viento?", o: ["Dextrógiro: S → SW → W → NW", "Levógiro: S → SE → E → NE", "No rola, solo refresca", "Levógiro: W → SW → S"], e: "Si la borrasca pasa al norte de ti (lo habitual en la Península), el viento rola en el sentido de las agujas del reloj." },
  { q: "El viento pasa de N a NE y luego a E. Ha rolado:", o: ["Dextrógiro (sentido horario)", "Levógiro (sentido antihorario)", "Ha refrescado", "Ha caído"], e: "N → NE → E es el sentido de las agujas del reloj: dextrógiro. Rolar es cambiar de dirección." },
  { q: "Al paso de un frente frío lo normal es:", o: ["Chubascos fuertes, presión que sube con rapidez y viento que rola a W–NW con rachas", "Lluvia débil y continua y presión que baja despacio", "Nieblas persistentes y viento en calma", "Subida de la temperatura y viento del SE"], e: "Frente frío: cumulonimbos y chubascos; tras él la presión sube rápido, baja la temperatura y el viento rola dextrógiro al NW." },
  { q: "Navegación nocturna dejando la costa por babor. Percibes terral. ¿Por dónde entra?", o: ["Babor", "Estribor", "Proa", "Popa"], e: "Clave oficial (3d3b8611ad): el terral sopla de tierra a mar, así que entra por el costado de la costa: babor." },
  { q: "Navegas a 6 nudos con un viento real de popa de 6 nudos. El viento aparente será:", o: ["0 nudos", "12 nudos", "6 nudos", "3 nudos"], e: "El relativo (6 kn de proa) anula el real (6 kn de popa): aparente 0. Con 5 kn de proa navegando a 5 kn, el aparente sería 10 kn." },
  { q: "Navegando a 5 nudos con 5 nudos de viento real de proa, el viento aparente es de:", o: ["10 nudos", "5 nudos", "0 nudos", "2 nudos"], e: "Clave oficial (33f46a4022): real y relativo vienen ambos de proa y se suman: 10 nudos." },
  { q: "¿Cuántos grados Fahrenheit son 20 °C?", o: ["68 °F", "36 °F", "52 °F", "293 °F"], e: "°F = °C × 9/5 + 32 = 20 × 1,8 + 32 = 68 °F. En kelvin serían 293,15 K." },
  { q: "Aire a 18 °C con punto de rocío de 17 °C pasa sobre agua a 14 °C. ¿Qué esperas?", o: ["Niebla de advección", "Niebla de radiación", "Cielo despejado y buena visibilidad", "Granizo"], e: "El agua, más fría que el punto de rocío, enfría el aire húmedo hasta saturarlo: niebla de advección, típica en la mar." },
  { q: "La niebla de radiación se forma típicamente:", o: ["En noches despejadas y en calma, sobre tierra, y se disipa al calentar el sol", "Con viento fuerte sobre mar abierto", "Al paso de un frente frío", "A mediodía en verano sobre el mar"], e: "El suelo se enfría por irradiación en noches claras sin viento y enfría el aire en contacto hasta el punto de rocío. Afecta a puertos, rías y costa." },
  { q: "Según la clave oficial, en la atmósfera un aumento de la temperatura lleva asociado:", o: ["Un aumento de la presión atmosférica", "Una disminución de la presión atmosférica", "Ninguna variación de la presión", "Una disminución de la humedad absoluta"], e: "Clave oficial (515ab5791c): aumento de T → aumento de P (ley de los gases a volumen constante). Ojo: en la realidad el aire caliente asciende y forma bajas térmicas, pero en estas preguntas manda la clave." },
  { q: "Olas largas, regulares y sin espuma llegan a una cala en calma desde una borrasca lejana. Es:", o: ["Mar de fondo (mar tendida)", "Mar de viento", "Marejadilla de virazón", "Mar arbolada"], e: "La mar de fondo procede de una zona de generación lejana o persiste tras cesar el viento; puede llegar con calma." },
  { q: "Los parámetros del viento generador que determinan el tamaño de las olas son:", o: ["Intensidad, persistencia y fetch", "Velocidad y dirección", "Intensidad, gradiente y presión", "Persistencia, intensidad y presión"], e: "Clave oficial (52a96cae93). El fetch se mide en millas; la persistencia, en horas." },
  { q: "El aviso costero naranja de AEMET corresponde a viento de fuerza:", o: ["8 a 9", "7", "10 o más", "6"], e: "Amarillo F7, naranja F8–9, rojo F10 o más." },
  { q: "¿Cómo emite Salvamento Marítimo la información meteorológica por VHF?", o: ["En franjas horarias determinadas, con anuncio previo en el canal 16", "Diariamente por el canal 70 a las 12:00 y 00:00", "Solo a petición, por el canal 69", "Solo por el canal 72 de onda media"], e: "Clave oficial (b23b5196df). El canal 70 es exclusivo de LSD." },
  { q: "En NAVTEX, ¿en qué frecuencia se emiten los avisos en español?", o: ["490 kHz", "518 kHz", "2182 kHz", "156,8 MHz"], e: "518 kHz: servicio internacional, en inglés. 490 kHz: servicio nacional, en español. 156,8 MHz es el canal 16." },
  { q: "Se dice que el viento «cae» cuando:", o: ["Disminuye su intensidad", "Aumenta su intensidad", "Rola de norte a sur", "Refresca y baja su temperatura"], e: "Caer = disminuir la intensidad. Refrescar = aumentar. Rolar = cambiar de dirección." },
  { q: "Un aumento muy brusco y repentino de la intensidad del viento es:", o: ["Una racha", "Refrescar", "Rolar", "Caer"], e: "Clave oficial (f5a5f1fe4f): racha. Refrescar es un aumento, pero no necesariamente brusco y momentáneo." },
  { q: "En el mapa, las isobaras alrededor de tu zona están muy juntas. Esperas:", o: ["Viento fuerte", "Calma", "Niebla de radiación", "Subida de la presión"], e: "Isobaras juntas = gradiente de presión grande = viento fuerte y mar." },
  { q: "En el Hemisferio Norte, un anticiclón:", o: ["Gira en sentido horario y el aire desciende en su interior", "Gira en sentido antihorario y el aire asciende", "No tiene circulación de viento", "Tiene la presión más baja en el centro"], e: "A: horario en el HN, divergente, con subsidencia (aire que desciende) y presión que aumenta hacia el centro (> 1013 mb)." },
  { q: "Una mar de 3 m de altura de ola corresponde en la escala Douglas a:", o: ["Grado 5, mar gruesa", "Grado 3, marejada", "Grado 7, mar arbolada", "Grado 9, mar enorme"], e: "Mar gruesa: 2,5 a 4 m (Douglas 5). Douglas va de 0 a 9 y a mayor grado, mayor altura." },
  { q: "Fuerza 8 en la escala Beaufort es:", o: ["Temporal, 34–40 nudos", "Frescachón, 28–33 nudos", "Temporal duro, 48–55 nudos", "Fresco, 22–27 nudos"], e: "F7 frescachón, F8 temporal, F9 temporal fuerte, F10 temporal duro." },
];

export default {
  id: ID,
  tema: 9,
  title: "Barómetro, temperatura y reto de meteo",
  icon: "◷",
  desc: "Lee el aneroide y su tendencia, convierte unidades, calcula el punto de rocío y supera el reto final de meteorología.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = CSS; document.head.appendChild(s);
    }
    let tab = "baro";
    // barómetro
    let hist = [], hour = 8, scen = "estable", pTrue = 1016, pDisp = 1016, testigo = 1016, testigoH = 8, playing = false, timer = 0;
    for (let i = 12; i >= 0; i--) hist.push({ h: hour - i, p: 1016 + (Math.random() - .5) * .4 });
    // temperatura y humedad
    let tc = 20, ta = 18, hrel = 85, fogMode = "adv", tw = 14, tground = 10, wkn = 6;
    // viento aparente
    let tw_kn = 10, tw_ang = 45, bs = 5;
    // reto
    let reto = null, best = ctx.store.get("best", 0);

    el.innerHTML = `
<div class="m-${ID} stack">
  <div class="ba-top">
    <div><p class="eyebrow">Tema 9 · Presión, temperatura y viento</p><h3>Barómetro, termómetro y reto</h3></div>
    <div class="seg" role="group" aria-label="Sección">
      <button data-tab="baro" aria-pressed="true">Barómetro</button>
      <button data-tab="uni" aria-pressed="false">Unidades</button>
      <button data-tab="term" aria-pressed="false">Temperatura y humedad</button>
      <button data-tab="glos" aria-pressed="false">Glosario</button>
      <button data-tab="reto" aria-pressed="false">Reto final</button>
    </div>
  </div>
  <div data-body class="stack"></div>
</div>`;
    const root = el.firstElementChild, body = root.querySelector("[data-body]");

    // ================= BARÓMETRO =================
    function dialSVG() {
      let s = `<circle r="118" fill="var(--sea-2)"/><circle r="110" fill="var(--sheet)" stroke="var(--line)" stroke-width="2"/>`;
      for (let p = P0; p <= P1; p++) {
        const a = ang(p), major = p % 10 === 0, mid = p % 5 === 0;
        const [x0, y0] = pol(a, 104), [x1, y1] = pol(a, major ? 90 : mid ? 95 : 99);
        s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--ink)" stroke-width="${major ? 1.8 : .8}"/>`;
        if (major) { const [tx, ty] = pol(a, 80); s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="9" text-anchor="middle" dominant-baseline="middle" fill="var(--ink)">${p}</text>`; }
      }
      for (let mm = 715; mm <= 785; mm++) {
        const p = mm * MMHG; if (p < P0 || p > P1) continue;
        const a = ang(p), major = mm % 10 === 0;
        const [x0, y0] = pol(a, 66), [x1, y1] = pol(a, major ? 60 : 63);
        s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--muted)" stroke-width="${major ? 1.4 : .6}"/>`;
        if (major) { const [tx, ty] = pol(a, 52); s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="7" text-anchor="middle" dominant-baseline="middle" fill="var(--muted)">${mm}</text>`; }
      }
      s += `<circle r="66" fill="none" stroke="var(--line)"/>`;
      for (const [p, w] of [[962, "TEMPESTAD"], [985, "LLUVIA"], [1006, "VARIABLE"], [1027, "BUEN TIEMPO"], [1045, "MUY SECO"]]) {
        const a = ang(p), [tx, ty] = pol(a, 31);
        s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="5.6" font-weight="700" text-anchor="middle" dominant-baseline="middle" fill="var(--muted)">${w}</text>`;
      }
      s += `<text y="58" font-size="6" text-anchor="middle" fill="var(--muted)">hPa · mb (fuera) — mm Hg (dentro)</text>`;
      s += `<g data-test><line x1="0" y1="14" x2="0" y2="-108" stroke="#b8892b" stroke-width="3" stroke-linecap="round"/><circle cy="-100" r="5" fill="#b8892b"/></g>`;
      s += `<g data-needle><line x1="0" y1="22" x2="0" y2="-102" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/><path d="M0 -104 l-4 12 h8z" fill="var(--ink)"/><circle cy="18" r="5" fill="var(--ink)"/></g>`;
      s += `<circle r="9" fill="#b8892b"/><circle r="3.5" fill="var(--ink)"/>`;
      return s;
    }
    function d3() { const now = hist[hist.length - 1], ref = hist.find(x => x.h >= now.h - 3) || hist[0]; return now.p - ref.p; }
    function barograph() {
      const pts = hist.slice(-25), h0 = pts[pts.length - 1].h - 24;
      const ps = pts.map(x => x.p), lo = Math.min(...ps, testigo) - 3, hi = Math.max(...ps, testigo) + 3;
      const X = h => 30 + (h - h0) / 24 * 262, Y = p => 8 + (hi - p) / (hi - lo) * 74;
      let s = `<rect x="30" y="8" width="262" height="74" fill="var(--sea)" rx="3"/>`;
      for (let p = Math.ceil(lo / 4) * 4; p <= hi; p += 4) s += `<line x1="30" x2="292" y1="${Y(p).toFixed(1)}" y2="${Y(p).toFixed(1)}" stroke="var(--line)"/><text x="26" y="${(Y(p) + 3).toFixed(1)}" font-size="8" text-anchor="end" fill="var(--muted)">${p}</text>`;
      const nowh = pts[pts.length - 1].h;
      s += `<rect x="${X(nowh - 3).toFixed(1)}" y="8" width="${(X(nowh) - X(nowh - 3)).toFixed(1)}" height="74" fill="var(--accent)" opacity=".1"/>`;
      s += `<line x1="30" x2="292" y1="${Y(testigo).toFixed(1)}" y2="${Y(testigo).toFixed(1)}" stroke="#b8892b" stroke-dasharray="4 3"/>`;
      s += `<polyline fill="none" stroke="var(--ink)" stroke-width="2" points="${pts.filter(x => x.h >= h0).map(x => `${X(x.h).toFixed(1)},${Y(x.p).toFixed(1)}`).join(" ")}"/>`;
      s += `<text x="292" y="96" font-size="8" text-anchor="end" fill="var(--muted)">ahora</text><text x="30" y="96" font-size="8" fill="var(--muted)">−24 h</text><text x="${((X(nowh - 3) + X(nowh)) / 2).toFixed(1)}" y="18" font-size="8" text-anchor="middle" fill="var(--accent)">3 h</text>`;
      return `<svg viewBox="0 0 300 100" width="100%" role="img" aria-label="Barograma de las últimas 24 horas" style="font-family:var(--f-mono)">${s}</svg>`;
    }
    const hh = h => String(((Math.round(h) % 24) + 24) % 24).padStart(2, "0") + ":00";
    function renderBaro() {
      body.innerHTML = `
        <div class="ba-two">
          <svg class="ba-dial" viewBox="-120 -120 240 240" data-dial role="img" aria-label="Barómetro aneroide: arrastra para mover la aguja testigo">${dialSVG()}</svg>
          <div class="stack">
            <div class="panel stack" data-baroread aria-live="polite"></div>
            <div class="row">
              <button class="btn sm" data-step>+1 h</button><button class="btn sm" data-play>▶ Pasar horas</button>
              <button class="btn sm" data-fix>Fijar testigo</button><button class="btn sm" data-tap>Golpecito al cristal</button>
            </div>
            <div class="seg" role="group" aria-label="Situación">${SCN.map(s => `<button data-scn="${s.k}" aria-pressed="${s.k === scen}">${s.t}</button>`).join("")}</div>
            <div data-graph></div>
          </div>
        </div>
        <div class="grid">
          <div class="tint stack small">
            <h4>Cómo se usa el aneroide</h4>
            <ul>
              <li>Cápsulas metálicas con vacío parcial (de Vidi) que se deforman con la presión; un mecanismo amplificador mueve la <b>aguja</b>. Mide la <b>presión atmosférica</b>.</li>
              <li>La <b>aguja testigo</b> se mueve a mano: la pones sobre la aguja al leer y, horas después, ves cuánto y hacia dónde ha cambiado.</li>
              <li>Antes de leer, un golpecito suave al cristal vence el rozamiento del mecanismo.</li>
              <li>Las palabras de la esfera (lluvia, buen tiempo…) son orientativas: lo que pronostica es la <b>tendencia</b>.</li>
              <li>El <b>barógrafo</b> es un aneroide que registra la presión en un papel (barograma).</li>
            </ul>
          </div>
          <div class="tint stack small">
            <h4>Tendencia en 3 horas</h4>
            <table><thead><tr><th>Barómetro</th><th>Pronóstico</th></tr></thead><tbody>
              <tr><td>Baja rápido (&gt; 4 mb/3 h)</td><td>Temporal próximo, viento fuerte</td></tr>
              <tr><td>Baja lenta y suave</td><td>Empeorarán las condiciones</td></tr>
              <tr><td>Estable</td><td>Sigue el tiempo actual</td></tr>
              <tr><td>Sube lenta y suave</td><td>Mejorarán las condiciones</td></tr>
              <tr><td>Sube rápido</td><td>Mejora breve; viento fuerte tras el frente</td></tr>
            </tbody></table>
          </div>
        </div>`;
      updBaro();
    }
    function updBaro() {
      const dial = body.querySelector("[data-dial]"); if (!dial) return;
      dial.querySelector("[data-needle]").setAttribute("transform", `rotate(${ang(pDisp).toFixed(2)})`);
      dial.querySelector("[data-test]").setAttribute("transform", `rotate(${ang(testigo).toFixed(2)})`);
      const d = d3(), tr = trend(d), dt = pDisp - testigo;
      body.querySelector("[data-baroread]").innerHTML = `
        <div class="row" style="justify-content:space-between"><span class="ba-big mono">${fmt(pDisp, 1)} hPa</span><span class="chip ${tr.c}">${tr.k}</span></div>
        <dl class="ba-dl">
          <dt>Hora</dt><dd class="mono">${hh(hour)}</dd>
          <dt>En mm Hg</dt><dd class="mono">${fmt(pDisp / MMHG, 1)} mm</dd>
          <dt>Últimas 3 h</dt><dd class="mono">${d >= 0 ? "+" : ""}${fmt(d, 1)} mb</dd>
          <dt>Testigo</dt><dd><span class="mono">${fmt(testigo, 1)}</span> (fijado a las ${hh(testigoH)}) → ${Math.abs(dt) < .3 ? "sin cambio" : `${dt > 0 ? "ha subido" : "ha bajado"} ${fmt(Math.abs(dt), 1)} mb`}</dd>
          <dt>Pronóstico</dt><dd>${tr.f}</dd>
        </dl>`;
      body.querySelector("[data-graph]").innerHTML = barograph();
    }
    function stepHour() {
      const s = SCN.find(x => x.k === scen);
      hour += 1;
      pTrue = clamp(pTrue + s.r + (Math.random() - .5) * .3, 955, 1048);
      hist.push({ h: hour, p: pTrue }); if (hist.length > 60) hist.shift();
      if (Math.abs(pTrue - pDisp) > .7) pDisp = pTrue - Math.sign(pTrue - pDisp) * .35; // el mecanismo se queda algo «pegado»
      updBaro();
    }
    function togglePlay(b) {
      playing = !playing; b.textContent = playing ? "❚❚ Pausa" : "▶ Pasar horas";
      clearInterval(timer); if (playing) timer = setInterval(stepHour, 700);
    }
    let tDrag = false;
    function testFromPointer(e) {
      const svg = body.querySelector("[data-dial]"), r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 240 - 120, y = (e.clientY - r.top) / r.height * 240 - 120;
      if (Math.hypot(x, y) < 20) return;
      const a = Math.atan2(x, -y) * 180 / Math.PI;
      testigo = clamp(P0 + (a - A0) / SPAN * (P1 - P0), P0, P1); testigoH = hour; updBaro();
    }
    body.addEventListener("pointerdown", e => { if (e.target.closest("[data-dial]")) { tDrag = true; e.target.closest("[data-dial]").setPointerCapture(e.pointerId); testFromPointer(e); } });
    body.addEventListener("pointermove", e => { if (tDrag) testFromPointer(e); });
    body.addEventListener("pointerup", () => { tDrag = false; });
    body.addEventListener("pointercancel", () => { tDrag = false; });

    // ================= UNIDADES =================
    const UNITS = [["hPa", 1], ["mb", 1], ["mmHg", MMHG], ["inHg", 33.8639], ["atm", 1013.25], ["Pa", .01]];
    let uni = 1013.25;
    function renderUni() {
      body.innerHTML = `
        <div class="grid">
          <div class="panel stack">
            <h4>Conversor de presión</h4>
            <div class="ba-inp">${UNITS.map(([u]) => `<label>${u === "mmHg" ? "mm Hg" : u === "inHg" ? "pulgadas" : u}<input inputmode="decimal" data-u="${u}" aria-label="${u}"></label>`).join("")}</div>
            <div class="row"><button class="btn sm" data-uset="1013.25">Presión normal</button><button class="btn sm" data-uset="990">Borrasca 990</button><button class="btn sm" data-uset="1035">Anticiclón 1035</button></div>
            <p class="small">Marea barométrica: cada mb por debajo de 1013 eleva el nivel del mar ≈ 1 cm (y al revés). Con <b class="mono" data-surge></b>.</p>
          </div>
          <div class="tint stack small">
            <h4>Equivalencias clave</h4>
            <p class="mono">1013,25 hPa = 1013,25 mb = 760 mm Hg = 29,92″ = 1 atm</p>
            <p class="mono">1 hPa = 1 mb = 100 Pa · 1 mm Hg ≈ 1,33 mb · 1 mb ≈ 0,75 mm</p>
            <ul>
              <li>Es el <b>peso de la columna de aire</b>, consecuencia de la atracción gravitatoria.</li>
              <li>Es <b>máxima a nivel del mar</b> y disminuye con la altitud (≈ 1 hPa cada 8 m cerca del suelo).</li>
              <li>No es constante: varía de un lugar a otro y con el tiempo.</li>
              <li>Trampas: «1013 bares», «1013 atmósferas», «1013 Pa», «1,013 mb»: todas falsas.</li>
              <li>«Aumenta al sumergirnos en el agua»: no es la presión atmosférica, sino la del agua.</li>
            </ul>
          </div>
        </div>`;
      fillUni(null);
    }
    function fillUni(skip) {
      body.querySelectorAll("[data-u]").forEach(i => {
        if (i.dataset.u === skip) return;
        const f = UNITS.find(u => u[0] === i.dataset.u)[1], v = uni / f;
        i.value = i.dataset.u === "atm" ? fmt(v, 4) : i.dataset.u === "inHg" ? fmt(v, 2) : i.dataset.u === "Pa" ? fmt(v, 0) : fmt(v, 2);
      });
      const s = body.querySelector("[data-surge]"); if (s) { const cm = Math.round(1013 - uni); s.textContent = `${fmt(uni, 0)} mb: ${cm === 0 ? "sin corrección" : `${cm > 0 ? "+" : ""}${cm} cm`}`; }
    }

    // ================= TEMPERATURA Y HUMEDAD =================
    const dew = (T, RH) => { const b = 17.62, c = 243.12, gm = Math.log(RH / 100) + b * T / (c + T); return c * gm / (b - gm); };
    function thermoSVG() {
      const lo = -30, hi = 50, Y = c => 150 - (clamp(c, lo, hi) - lo) / (hi - lo) * 135;
      let s = `<rect x="-8" y="10" width="16" height="148" rx="8" fill="var(--sheet)" stroke="var(--line)"/><circle cy="162" r="13" fill="#d43b3b"/>`;
      s += `<rect x="-4" y="${Y(tc).toFixed(1)}" width="8" height="${(162 - Y(tc)).toFixed(1)}" fill="#d43b3b"/>`;
      for (let c = lo; c <= hi; c += 10) s += `<line x1="10" x2="18" y1="${Y(c)}" y2="${Y(c)}" stroke="var(--muted)"/><text x="22" y="${Y(c) + 3}" font-size="9" fill="var(--muted)">${c}°C</text><text x="-12" y="${Y(c) + 3}" font-size="9" fill="var(--muted)" text-anchor="end">${Math.round(c * 1.8 + 32)}°F</text>`;
      return `<svg viewBox="-60 0 120 182" width="140" role="img" aria-label="Termómetro" style="font-family:var(--f-mono);justify-self:center">${s}</svg>`;
    }
    function renderTerm() {
      body.innerHTML = `
        <div class="grid">
          <div class="panel stack">
            <h4>Termómetro: Celsius, Fahrenheit y Kelvin</h4>
            <div class="row" style="align-items:flex-start;flex-wrap:nowrap;gap:1rem">
              <div data-thermo>${thermoSVG()}</div>
              <div class="stack" style="flex:1">
                <label class="ba-sl"><span>Temperatura<b class="mono" data-tcv>${fmt(tc)} °C</b></span><input type="range" data-tc min="-30" max="50" step="1" value="${tc}" aria-label="Temperatura en grados Celsius"></label>
                <div class="ba-inp"><label>°C<input inputmode="decimal" data-t="C"></label><label>°F<input inputmode="decimal" data-t="F"></label><label>K<input inputmode="decimal" data-t="K"></label></div>
                <p class="mono small">°F = °C × 9/5 + 32 · K = °C + 273,15</p>
              </div>
            </div>
            <ul class="small">
              <li>Escala centígrada: <b>0 °C</b> fusión del hielo y <b>100 °C</b> ebullición del agua (a nivel del mar), con <b>100 divisiones</b>; su unidad es el grado centígrado o Celsius. En Fahrenheit son 32 °F y 212 °F; en Kelvin, 273,15 K y 373,15 K.</li>
              <li>Falso: «cada grado se divide en 100», «referencias del mercurio», «0 °C es la congelación del agua de mar» (≈ −1,9 °C), «0 y 100 son el mínimo y el máximo medibles».</li>
              <li>Temperatura: magnitud que expresa el grado de frío o calor; informa del calor o energía térmica. No es «energía que pasa de un cuerpo a otro» (eso es el calor).</li>
              <li><b>Clave oficial:</b> en la atmósfera, un aumento de la temperatura lleva asociado un <b>aumento</b> de la presión (ley de los gases). Las brisas y bajas térmicas se explican de otro modo: el aire calentado se dilata y asciende.</li>
            </ul>
          </div>
          <div class="panel stack">
            <h4>Humedad, punto de rocío y niebla</h4>
            <label class="ba-sl"><span>Temperatura del aire<b class="mono" data-tav>${fmt(ta)} °C</b></span><input type="range" data-ta min="-5" max="38" value="${ta}" aria-label="Temperatura del aire"></label>
            <label class="ba-sl"><span>Humedad relativa<b class="mono" data-hrv>${hrel} %</b></span><input type="range" data-hr min="10" max="100" value="${hrel}" aria-label="Humedad relativa"></label>
            <div class="seg" role="group" aria-label="Tipo de situación"><button data-fog="adv" aria-pressed="${fogMode === "adv"}">Aire sobre el mar</button><button data-fog="rad" aria-pressed="${fogMode === "rad"}">Noche sobre tierra</button></div>
            <div data-fogctl></div>
            <div class="tint stack" data-fogout aria-live="polite"></div>
          </div>
        </div>`;
      fillT(null); renderFogCtl(); updFog();
    }
    function fillT(skip) {
      const v = { C: tc, F: tc * 1.8 + 32, K: tc + 273.15 };
      body.querySelectorAll("[data-t]").forEach(i => { if (i.dataset.t !== skip) i.value = fmt(v[i.dataset.t], i.dataset.t === "C" ? 1 : i.dataset.t === "F" ? 1 : 2); });
      const th = body.querySelector("[data-thermo]"); if (th) th.innerHTML = thermoSVG();
      const tv = body.querySelector("[data-tcv]"); if (tv) tv.textContent = `${fmt(tc, 1)} °C`;
      const sl = body.querySelector("[data-tc]"); if (sl && skip) sl.value = clamp(tc, -30, 50);
    }
    function renderFogCtl() {
      const c = body.querySelector("[data-fogctl]");
      c.innerHTML = fogMode === "adv"
        ? `<label class="ba-sl"><span>Temperatura del agua<b class="mono" data-twv>${fmt(tw)} °C</b></span><input type="range" data-tw min="5" max="30" value="${tw}" aria-label="Temperatura del agua"></label>
           <label class="ba-sl"><span>Viento<b class="mono" data-wv>${wkn} kn</b></span><input type="range" data-w min="0" max="30" value="${wkn}" aria-label="Viento en nudos"></label>`
        : `<label class="ba-sl"><span>Temperatura mínima del suelo de madrugada<b class="mono" data-tgv>${fmt(tground)} °C</b></span><input type="range" data-tg min="-5" max="30" value="${tground}" aria-label="Temperatura del suelo"></label>
           <label class="ba-sl"><span>Viento<b class="mono" data-wv>${wkn} kn</b></span><input type="range" data-w min="0" max="30" value="${wkn}" aria-label="Viento en nudos"></label>`;
    }
    function updFog() {
      const td = dew(ta, hrel), spread = ta - td, cold = fogMode === "adv" ? tw : tground;
      let fog = 0, txt = "";
      if (fogMode === "adv") {
        const m = td - cold;
        fog = m >= 0 ? clamp(.45 + m * .15, 0, 1) * (wkn > 22 ? .4 : 1) : 0;
        txt = fog > 0
          ? `<b>Niebla de advección.</b> El aire cálido y húmedo se desplaza sobre agua más fría (${fmt(cold)} °C ≤ punto de rocío ${fmt(td, 1)} °C) y se enfría hasta saturarse. Típica en la mar (Galicia, Cantábrico, Estrecho, primavera y verano). Puede persistir con viento flojo o moderado y no se disipa con el sol.${wkn > 22 ? " Con viento fuerte la mezcla la levanta en nubes bajas." : ""}`
          : `Sin niebla: el agua (${fmt(cold)} °C) está más templada que el punto de rocío (${fmt(td, 1)} °C). Baja la temperatura del agua o sube la humedad.`;
      } else {
        const m = td - cold;
        fog = m >= 0 && wkn <= 6 ? clamp(.45 + m * .15, 0, 1) : 0;
        txt = fog > 0
          ? `<b>Niebla de radiación.</b> En noche despejada y en calma el suelo irradia calor, se enfría (${fmt(cold)} °C) por debajo del punto de rocío (${fmt(td, 1)} °C) y enfría el aire en contacto. Se forma sobre tierra, rías y puertos; se disipa al calentar el sol por la mañana.`
          : m >= 0 ? `Hay saturación posible, pero con ${wkn} kn de viento el aire se mezcla y no se forma niebla de radiación (necesita calma).` : `Sin niebla: el suelo no llega al punto de rocío (${fmt(td, 1)} °C).`;
      }
      const out = body.querySelector("[data-fogout]");
      if (out) out.innerHTML = `
        <dl class="ba-dl"><dt>Punto de rocío</dt><dd class="mono">${fmt(td, 1)} °C</dd><dt>T − Td</dt><dd class="mono">${fmt(spread, 1)} °C ${spread <= 2 ? "· aire casi saturado" : ""}</dd></dl>
        <div><p class="small muted">Visibilidad</p><div class="ba-bar" aria-hidden="true"><i style="width:${Math.round((1 - fog * .95) * 100)}%"></i></div></div>
        <p class="small">${txt}</p>
        <p class="small muted">Humedad relativa: % de vapor respecto al máximo que admite el aire a esa temperatura (100 % = saturación). Punto de rocío: temperatura a la que, enfriando el aire, se satura y condensa.</p>`;
    }

    // ================= GLOSARIO =================
    function appSVG() {
      const a = tw_ang * Math.PI / 180;
      const tx = tw_kn * Math.sin(a), ty = tw_kn * Math.cos(a);
      const ax = tx, ay = ty + bs, A = Math.hypot(ax, ay), aa = Math.atan2(ax, ay) * 180 / Math.PI;
      const k = 70 / Math.max(15, tw_kn + bs);
      const arr = (x, y, col, lbl) => {
        if (Math.hypot(x, y) < .05) return "";
        // vector dibujado desde el punto de donde viene el viento hasta el barco
        const L = Math.hypot(x, y), ux = x / L, uy = y / L, sx = x * k, sy = -y * k;
        return `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="0" y2="0" stroke="${col}" stroke-width="3"/><path d="M0 0 l${(ux * 9 - uy * 5).toFixed(1)} ${(-uy * 9 - ux * 5).toFixed(1)} l${(uy * 10).toFixed(1)} ${(ux * 10).toFixed(1)}z" fill="${col}"/><text x="${(sx * 1.08).toFixed(1)}" y="${(sy * 1.08 - 4).toFixed(1)}" font-size="9" fill="${col}" text-anchor="middle">${lbl}</text>`;
      };
      return { svg: `<svg viewBox="-90 -90 180 180" width="190" role="img" aria-label="Diagrama de viento real, relativo y aparente" style="font-family:var(--f-mono);justify-self:center">
        <path d="M0 -30 C9 -16 9 14 7 24 L-7 24 C-9 14 -9 -16 0 -30Z" fill="var(--sheet)" stroke="var(--ink)" stroke-width="1.5"/>
        ${arr(tx, ty, "var(--muted)", "real")}${arr(0, bs, "var(--warn)", "relativo")}${arr(ax, ay, "var(--accent)", "aparente")}
      </svg>`, A, aa: Math.abs(aa), side: aa >= 0 ? "estribor" : "babor" };
    }
    function renderGlos() {
      const ap = appSVG();
      body.innerHTML = `
        <div class="ba-cards">${TERMS.map(([t, d, v]) => `<div class="ba-card"><h4>${t}${v ? `<svg viewBox="-20 -20 40 40" width="40" aria-hidden="true"><circle r="17" fill="none" stroke="var(--line)"/><text y="-9" font-size="8" text-anchor="middle" fill="var(--muted)">N</text><g class="ba-spin ${v === "lev" ? "lev" : ""}"><line x1="0" y1="0" x2="0" y2="-13" stroke="var(--accent)" stroke-width="2.5"/><circle cy="-13" r="2.5" fill="var(--accent)"/></g></svg>` : ""}</h4><p class="small">${d}</p></div>`).join("")}</div>
        <div class="panel stack">
          <h4>Viento real, relativo y aparente</h4>
          <div class="row" style="align-items:center;gap:1rem">
            <div data-app>${ap.svg}</div>
            <div class="stack" style="flex:1;min-width:200px">
              <label class="ba-sl"><span>Viento real<b class="mono" data-twk>${tw_kn} kn</b></span><input type="range" data-twkn min="0" max="30" value="${tw_kn}" aria-label="Viento real en nudos"></label>
              <label class="ba-sl"><span>Entra por (desde proa)<b class="mono" data-twa>${tw_ang}°</b></span><input type="range" data-twang min="0" max="180" step="5" value="${tw_ang}" aria-label="Ángulo del viento real desde proa"></label>
              <label class="ba-sl"><span>Velocidad del barco<b class="mono" data-bsv>${bs} kn</b></span><input type="range" data-bs min="0" max="20" value="${bs}" aria-label="Velocidad del barco"></label>
              <p data-appout></p>
            </div>
          </div>
          <p class="small muted">Con el viento real entre proa y través, al aumentar la velocidad el aparente rola hacia proa y aumenta. Con 5 kn de real por la proa navegando a 5 kn: aparente 10 kn.</p>
        </div>`;
      updApp();
    }
    function updApp() {
      const ap = appSVG();
      const box = body.querySelector("[data-app]"); if (box) box.innerHTML = ap.svg;
      const o = body.querySelector("[data-appout]");
      if (o) o.innerHTML = `Aparente: <b class="mono">${fmt(ap.A, 1)} kn</b>, entra a <b class="mono">${fmt(ap.aa)}°</b> de la proa${ap.A > .05 && ap.aa > .5 && ap.aa < 179.5 ? ` por ${ap.side}` : ""}.`;
    }

    // ================= RETO =================
    const N_RETO = 10, PASS = 8;
    function newReto() {
      const qs = shuffle(Q.map((x, i) => i)).slice(0, N_RETO).map(i => {
        const it = Q[i]; return { q: it.q, e: it.e, o: shuffle(it.o.map((t, j) => ({ t, ok: j === 0 }))) };
      });
      reto = { qs, i: 0, hits: 0, pick: null, done: false };
    }
    function renderReto() {
      if (!reto) newReto();
      if (reto.done) {
        const pass = reto.hits >= PASS;
        body.innerHTML = `<div class="panel stack">
          <h4>Reto terminado: ${reto.hits} de ${N_RETO}</h4>
          <p>${pass ? "Superado. Insignia <b>Meteorólogo</b> desbloqueada." : `Necesitas ${PASS} aciertos para la insignia. Repasa las explicaciones e inténtalo de nuevo.`}</p>
          <p class="small muted">Mejor resultado: ${best} de ${N_RETO}.</p>
          <div><button class="btn primary" data-reto-new>Nuevo reto</button></div></div>`;
        return;
      }
      const it = reto.qs[reto.i], answered = reto.pick != null;
      body.innerHTML = `<div class="panel stack">
        <div class="row" style="justify-content:space-between"><p class="eyebrow">Reto de meteorología · ${reto.i + 1} de ${N_RETO}</p><span class="chip acc">${reto.hits} aciertos</span></div>
        <h4>${it.q}</h4>
        <div class="ba-opts">${it.o.map((o, j) => `<button class="btn ${answered ? (o.ok ? "is-ok" : reto.pick === j ? "is-bad" : "") : ""}" data-ro="${j}" ${answered ? "disabled" : ""}>${String.fromCharCode(97 + j)}) ${o.t}</button>`).join("")}</div>
        ${answered ? `<p class="${it.o[reto.pick].ok ? "fb-ok" : "fb-bad"}">${it.o[reto.pick].ok ? "Correcto." : "Incorrecto."}</p><p class="small">${it.e}</p>
        <div><button class="btn primary" data-ro-next>${reto.i + 1 >= N_RETO ? "Ver resultado" : "Siguiente"}</button></div>` : ""}
      </div>`;
    }
    function retoAnswer(j) {
      if (reto.pick != null) return;
      reto.pick = j;
      if (reto.qs[reto.i].o[j].ok) { reto.hits++; ctx.award(5, "Reto de meteorología"); }
      renderReto();
    }
    function retoNext() {
      reto.i++; reto.pick = null;
      if (reto.i >= N_RETO) {
        reto.done = true;
        if (reto.hits > best) { best = reto.hits; ctx.store.set("best", best); }
        if (reto.hits >= PASS) { ctx.award(40, "Reto de meteorología superado"); ctx.badge("meteorologo"); ctx.toast("Insignia Meteorólogo"); }
      }
      renderReto();
    }

    // ================= navegación y eventos =================
    function render() {
      root.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tab === tab)));
      if (tab !== "baro" && playing) { playing = false; clearInterval(timer); }
      ({ baro: renderBaro, uni: renderUni, term: renderTerm, glos: renderGlos, reto: renderReto })[tab]();
    }
    root.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.tab) { tab = b.dataset.tab; render(); return; }
      // barómetro
      if (b.hasAttribute("data-step")) { stepHour(); return; }
      if (b.hasAttribute("data-play")) { togglePlay(b); return; }
      if (b.hasAttribute("data-fix")) { testigo = pDisp; testigoH = hour; updBaro(); ctx.toast("Testigo fijado sobre la aguja"); return; }
      if (b.hasAttribute("data-tap")) { const was = pDisp; pDisp = pTrue; updBaro(); if (Math.abs(was - pTrue) > .05) ctx.toast(`La aguja salta ${fmt(Math.abs(pTrue - was), 1)} mb`); return; }
      if (b.dataset.scn) { scen = b.dataset.scn; body.querySelectorAll("[data-scn]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.scn === scen))); return; }
      // unidades
      if (b.dataset.uset) { uni = +b.dataset.uset; fillUni(null); return; }
      // humedad
      if (b.dataset.fog) { fogMode = b.dataset.fog; body.querySelectorAll("[data-fog]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.fog === fogMode))); renderFogCtl(); updFog(); return; }
      // reto
      if (b.dataset.ro != null) { retoAnswer(+b.dataset.ro); return; }
      if (b.hasAttribute("data-ro-next")) { retoNext(); return; }
      if (b.hasAttribute("data-reto-new")) { newReto(); renderReto(); return; }
    });
    root.addEventListener("input", e => {
      const i = e.target, d = i.dataset;
      if (d.u) { const v = pnum(i.value); if (isFinite(v) && v > 0) { uni = v * UNITS.find(u => u[0] === d.u)[1]; fillUni(d.u); } return; }
      if (d.t) { const v = pnum(i.value); if (isFinite(v)) { tc = d.t === "C" ? v : d.t === "F" ? (v - 32) / 1.8 : v - 273.15; fillT(d.t); } return; }
      if (i.matches("[data-tc]")) { tc = +i.value; fillT(null); return; }
      if (i.matches("[data-ta]")) { ta = +i.value; body.querySelector("[data-tav]").textContent = `${ta} °C`; updFog(); return; }
      if (i.matches("[data-hr]")) { hrel = +i.value; body.querySelector("[data-hrv]").textContent = `${hrel} %`; updFog(); return; }
      if (i.matches("[data-tw]")) { tw = +i.value; body.querySelector("[data-twv]").textContent = `${tw} °C`; updFog(); return; }
      if (i.matches("[data-tg]")) { tground = +i.value; body.querySelector("[data-tgv]").textContent = `${tground} °C`; updFog(); return; }
      if (i.matches("[data-w]")) { wkn = +i.value; body.querySelector("[data-wv]").textContent = `${wkn} kn`; updFog(); return; }
      if (i.matches("[data-twkn]")) { tw_kn = +i.value; body.querySelector("[data-twk]").textContent = `${tw_kn} kn`; updApp(); return; }
      if (i.matches("[data-twang]")) { tw_ang = +i.value; body.querySelector("[data-twa]").textContent = `${tw_ang}°`; updApp(); return; }
      if (i.matches("[data-bs]")) { bs = +i.value; body.querySelector("[data-bsv]").textContent = `${bs} kn`; updApp(); return; }
    });

    render();

    return () => { clearInterval(timer); playing = false; el.innerHTML = ""; };
  }
};
