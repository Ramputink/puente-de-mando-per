// ripa-maniobra — «¿Quién maniobra?»: vista cenital animada con situaciones de rumbo y gobierno (RIPA Parte B y R34–35)

const ID = "ripa-maniobra";
const DEG = Math.PI / 180;
const T = 12; // segundos de animación hasta el punto de encuentro

/* ---------- utilidades ---------- */
const norm = a => ((a % 360) + 360) % 360;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const U = h => [Math.sin(h * DEG), Math.cos(h * DEG)];
const brg = (p, q) => norm(Math.atan2(q[0] - p[0], q[1] - p[1]) / DEG);
const pad3 = n => String(Math.round(norm(n)) % 360).padStart(3, "0");
const ROSE = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const rose = d => ROSE[Math.round(norm(d) / 45) % 8];
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}

/* ---------- tipos de buque ---------- */
const TYPES = {
  pm: { n: "Propulsión mecánica", s: 1.5 }, vela: { n: "Vela", s: 1.3 }, pesca: { n: "Pesca", s: 1.5 }, sg: { n: "Sin gobierno", s: 2.2 },
  mr: { n: "Maniobra restringida", s: 2.0 }, calado: { n: "Restringido por su calado", s: 3.0 }, wig: { n: "Nave WIG despegando", s: 1.6 },
  hidro: { n: "Hidroavión amarado", s: 1.5 }, big: { n: "Portacontenedores", s: 3.2 }, anc: { n: "Fondeado", s: 1.6 },
};
// ship(label, tipo, en (posición en el instante tc), rumbo, velocidad, extra)
function ship(id, type, at, hdg, spd, x = {}) {
  const tc = x.tc ?? T; const u = U(hdg);
  return { id, type, hdg, spd, p0: [at[0] - u[0] * spd * tc, at[1] - u[1] * spd * tc], ...x };
}
const pos = (s, t) => { const u = U(s.hdg); return [s.p0[0] + u[0] * s.spd * t, s.p0[1] + u[1] * s.spd * t]; };
// marcación relativa de q vista desde s (0 = proa, 90 = través de estribor)
const relB = (s, q, t = 0) => norm(brg(pos(s, t), pos(q, t)) - s.hdg);
const tackOf = (s, windFrom) => { const r = norm(windFrom - s.hdg); return r > 0 && r < 180 ? "er" : "br"; };
const Q = (q, ok, bad, why) => ({ q, ok, bad, why });

/* ---------- clasificación entre dos buques de propulsión mecánica ---------- */
function classify(A, B) {
  const ab = relB(A, B), ba = relB(B, A);
  if (ba > 112.5 && ba < 247.5) return { k: "alcance", gw: "A", ab, ba };
  if (ab > 112.5 && ab < 247.5) return { k: "alcance", gw: "B", ab, ba };
  const d = Math.abs(norm(A.hdg - B.hdg) - 180);
  if (d <= 6 && (ab <= 6 || ab >= 354)) return { k: "vuelta", gw: "ambos", ab, ba };
  return { k: "cruce", gw: ab < 180 ? "A" : "B", ab, ba };
}
// encaja en la vista: escala posiciones y velocidades
function fitShips(ships, box = [15, 9.5]) {
  const pts = ships.flatMap(s => [pos(s, 0), pos(s, T * 0.9)]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const k = Math.min(box[0] / Math.max(1, Math.max(...xs) - Math.min(...xs)), box[1] / Math.max(1, Math.max(...ys) - Math.min(...ys)), 1.6);
  for (const s of ships) { s.p0 = [(s.p0[0] - cx) * k, (s.p0[1] - cy) * k]; s.spd *= k; }
  return ships;
}

/* ---------- generadores aleatorios ---------- */
const OK = "ok";
function genPower() {
  for (let tries = 0; tries < 200; tries++) {
    const kind = pick(["cer", "cbr", "vuelta", "altA", "altB", "cer"]);
    const hA = Math.round(rnd(0, 72)) * 5; let hB, vA = 0.55, vB = rnd(0.42, 0.62);
    if (kind === "cer") hB = hA - rnd(55, 125); else if (kind === "cbr") hB = hA + rnd(55, 125);
    else if (kind === "vuelta") hB = hA + 180 + rnd(-2, 2);
    else if (kind === "altA") { hB = hA + rnd(-25, 25); vB = 0.22; vA = 0.6; }
    else { hB = hA + rnd(-25, 25); vB = 0.62; vA = 0.22; }
    hB = Math.round(norm(hB));
    const C = [rnd(-1, 1), rnd(-1, 1)];
    const A = ship("A", "pm", C, hA, vA), B = ship("B", "pm", [C[0] + (kind === "vuelta" ? 0.15 : 0), C[1]], hB, vB);
    const c = classify(A, B);
    const want = { cer: ["cruce", "A"], cbr: ["cruce", "B"], vuelta: ["vuelta", "ambos"], altA: ["alcance", "A"], altB: ["alcance", "B"] }[kind];
    if (c.k !== want[0] || c.gw !== want[1]) continue;
    const m = x => Math.min(Math.abs(x - 112.5), Math.abs(x - 247.5));
    if (c.k !== "vuelta" && (m(c.ab) < 8 || m(c.ba) < 8)) continue;
    if (c.k === "cruce" && (c.ab < 8 || c.ab > 352)) continue;
    fitShips([A, B]);
    const ab = pad3(c.ab);
    const base = { title: "Dos buques de propulsión mecánica", rule: c.k === "vuelta" ? "R14" : c.k === "cruce" ? "R15–R17" : "R13", env: "mar", ships: [A, B], gen: true,
      intro: `Ambos son buques de propulsión mecánica a la vista, con riesgo de abordaje. Tú (A) navegas al ${pad3(hA)}°; B navega al ${pad3(hB)}° y lo ves en marcación ${ab}° (relativa a tu proa).` };
    if (c.k === "cruce" && c.gw === "A") return { ...base, qs: [
      Q("¿Quién cede el paso?", "A (tú)", ["B", "Ambos caen a estribor", "Ninguno: ambos mantienen rumbo y velocidad"], `B está por tu costado de estribor (${ab}°). En un cruce se mantiene apartado el que tiene al otro por su estribor (R15). De noche verías su luz roja.`),
      Q("¿Qué maniobra harás?", "Caer claramente a estribor (o reducir) con antelación y pasar por su popa", ["Caer a babor y cruzarle por la proa", "Mantener rumbo y velocidad", "Aumentar la velocidad para cruzar antes que él"], "El que cede el paso maniobra con antelación suficiente y de forma decidida para quedar bien franco (R16) y, si es posible, evita cortarle la proa (R15). Cambios amplios, no una sucesión de pequeños (R8 b)."),
      pick([Q("Al caer a estribor, ¿qué señal acústica emites?", "Una pitada corta", ["Dos pitadas cortas", "Tres pitadas cortas", "Una pitada larga"], "R34 a): 1 corta = caigo a estribor; 2 cortas = caigo a babor; 3 cortas = estoy dando atrás. Puede completarse con un destello de ~1 s (R34 b)."),
        Q("Si en lugar de caer decides dar atrás, ¿qué señal emites?", "Tres pitadas cortas", ["Una pitada larga", "Dos pitadas cortas", "Cinco pitadas cortas y rápidas"], "R34 a iii): tres pitadas cortas = «estoy dando atrás». Reducir o suprimir la arrancada también es una maniobra válida (R8 e).")]),
    ] };
    if (c.k === "cruce") return { ...base, qs: [
      Q("¿Quién cede el paso?", "B", ["A (tú)", "Ambos caen a estribor", "Ninguno"], `B te tiene por su costado de estribor: es él quien se aparta (R15). Tú lo ves por tu babor (${ab}°); de noche verías su luz verde.`),
      Q("¿Qué haces tú?", "Mantener rumbo y velocidad; si B no maniobra, actuar yo, evitando caer a babor", ["Caer a babor para pasar por su popa", "Parar máquinas de inmediato", "Caer a babor para dejarle más espacio"], "Eres el que sigue a rumbo (R17 a i). Si es evidente que B no maniobra, puedes actuar por tu cuenta (R17 a ii) y, siendo propulsión mecánica en un cruce, no caerás a babor si el otro está por tu babor (R17 c)."),
      Q("Si dudas de que B esté maniobrando a tiempo, ¿qué señal emites?", "Al menos cinco pitadas cortas y rápidas", ["Una pitada larga", "Dos largas y una corta", "Tres pitadas cortas"], "R34 d): la señal de duda es de al menos cinco pitadas cortas y rápidas; puede completarse con al menos cinco destellos cortos y rápidos."),
    ] };
    if (c.k === "vuelta") return { ...base, qs: [
      Q("¿Qué situación es y quién maniobra?", "Vuelta encontrada: maniobran los dos", ["Cruce: maniobra A", "Cruce: maniobra B", "Alcance: maniobra el más rápido"], "Rumbos opuestos o casi opuestos, con el otro por la proa: de noche verías sus topes enfilados y ambos costados (R14 b). En caso de duda se supone que existe (R14 c)."),
      Q("¿Qué maniobra hacéis?", "Ambos caen a estribor y pasan babor con babor", ["Ambos caen a babor y pasan estribor con estribor", "A cae a estribor y B mantiene rumbo", "El que esté más a estribor mantiene rumbo"], "R14 a): cada uno caerá a estribor para pasar por la banda de babor del otro."),
      Q("¿Qué señal acústica corresponde a vuestra maniobra?", "Una pitada corta cada uno", ["Dos pitadas cortas", "Una pitada larga", "Cinco pitadas cortas"], "R34 a i): una pitada corta (≈ 1 s) = «caigo a estribor»."),
    ] };
    if (c.gw === "A") return { ...base, qs: [
      Q("¿Qué situación es?", "A alcanza a B", ["Cruce: B cede el paso", "Vuelta encontrada", "B alcanza a A"], `Te aproximas a B desde más de 22,5° a popa de su través (le ves en ${ab}° y él te tiene en ${pad3(c.ba)}°): de noche solo verías su luz de alcance (R13 b).`),
      Q("¿Quién se mantiene apartado?", "A, por cualquier banda; B mantiene rumbo y velocidad", ["B, porque A es más rápido", "Los dos caen a estribor", "A debe pasar obligatoriamente por estribor de B"], "R13 a): todo buque que alcance a otro se mantendrá apartado de su derrota, sea cual sea su tipo. Un cambio posterior de marcación no lo convierte en buque que cruza (R13 d)."),
      Q("En mar abierto decides adelantarle cayendo a babor. ¿Señal?", "Dos pitadas cortas", ["Dos largas y dos cortas", "Una pitada corta", "Larga, corta, larga, corta"], "Fuera de canales angostos se usan las señales de maniobra de R34 a): 2 cortas = caigo a babor. Las de dos pitadas largas son para alcanzar en canales angostos (R34 c)."),
    ] };
    return { ...base, qs: [
      Q("¿Qué situación es?", "B te está alcanzando", ["Cruce: A cede el paso", "Vuelta encontrada", "A alcanza a B"], `B se aproxima desde más de 22,5° a popa de tu través (${ab}°): es el buque que alcanza (R13).`),
      Q("¿Qué haces tú?", "Mantener rumbo y velocidad, vigilando", ["Apartarme de su derrota", "Caer a estribor para dejarle paso", "Reducir para que me adelante antes"], "B debe mantenerse apartado (R13). Tú eres el que sigue a rumbo (R17 a i), salvo que el abordaje no pueda evitarse solo con su maniobra (R17 b)."),
      Q("De noche, ¿qué luz tuya ve B?", "Solo tu luz de alcance", ["Tu tope y tu costado de estribor", "Tus dos luces de costado", "Tu tope y tu luz de alcance"], "Desde más de 22,5° a popa del través se está en el sector de 135° de la luz de alcance, fuera de los sectores de tope y costados (R13 b, R21)."),
    ] };
  }
  return genPower();
}
function genSail() {
  for (let tries = 0; tries < 300; tries++) {
    const W = Math.round(rnd(0, 8)) * 45; const kind = pick(["dist", "misma", "misma"]);
    const hdgFor = tack => { const r = rnd(50, 140); return Math.round(norm(tack === "er" ? W - r : W + r)); };
    const tA = pick(["er", "br"]), tB = kind === "dist" ? (tA === "er" ? "br" : "er") : tA;
    const hA = hdgFor(tA), hB = hdgFor(tB);
    if (Math.abs(norm(hA - hB + 180) - 180) < 35) continue;
    const C = [0, 0]; const A = ship("A", "vela", C, hA, 0.4), B = ship("B", "vela", [0.1, 0.1], hB, rnd(0.33, 0.47));
    const c = classify(A, B); if (c.k !== "cruce") continue;
    const m = x => Math.min(Math.abs(x - 112.5), Math.abs(x - 247.5)); if (m(c.ab) < 10 || m(c.ba) < 10) continue;
    const wu = U(W); const dA = pos(A, 0)[0] * wu[0] + pos(A, 0)[1] * wu[1], dB = pos(B, 0)[0] * wu[0] + pos(B, 0)[1] * wu[1];
    if (kind === "misma" && Math.abs(dA - dB) < 1.2) continue;
    fitShips([A, B]);
    const tn = t => t === "er" ? "por estribor (amura de estribor)" : "por babor (amura de babor)";
    const base = { title: "Dos buques de vela", rule: "R12", env: "mar", wind: W, ships: [A, B], gen: true,
      intro: `Dos veleros navegando solo a vela, con riesgo de abordaje. Viento del ${rose(W)}. Tú (A) navegas al ${pad3(hA)}° y B al ${pad3(hB)}°.` };
    const qTack = Q("¿Por qué banda recibes tú (A) el viento?", tn(tA), [tn(tA === "er" ? "br" : "er"), "Por la popa: no tiene amura", "Depende de la banda de B"], `Viento del ${rose(W)} y rumbo ${pad3(hA)}°: te entra ${tA === "er" ? "por estribor" : "por babor"}. La banda de barlovento es la contraria a la que lleva cazada la mayor (R12 b): la botavara cae a ${tA === "er" ? "babor" : "estribor"}.`);
    if (kind === "dist") { const gw = tA === "br" ? "A" : "B"; return { ...base, qs: [qTack,
      Q("¿Quién se mantiene apartado?", gw === "A" ? "A (tú)" : "B", [gw === "A" ? "B" : "A (tú)", "El que esté a barlovento", "El más pequeño"], "R12 a i): con el viento por bandas contrarias, el que lo recibe por babor se mantiene apartado del otro."),
      Q(gw === "A" ? "¿Qué hace B?" : "¿Qué haces tú?", "Mantener rumbo y velocidad", ["Orzar para pasar por su proa", "Arribar para pasar por su popa", "Virar por avante inmediatamente"], "El otro es el que sigue a rumbo (R17 a i): mantiene rumbo y velocidad mientras vigila la maniobra del que cede.")] }; }
    const windA = dA > dB; const gw = windA ? "A" : "B";
    return { ...base, qs: [qTack,
      Q("¿Cuál está a barlovento?", windA ? "A (tú)" : "B", [windA ? "B" : "A (tú)", "Ninguno: van a rumbos paralelos", "No se puede saber sin conocer la eslora"], `El de barlovento es el que está más «arriba», hacia donde viene el viento (${rose(W)}).`),
      Q("¿Quién se mantiene apartado?", gw === "A" ? "A (tú)" : "B", [gw === "A" ? "B" : "A (tú)", "El que reciba el viento por estribor", "Ambos arriban"], "R12 a ii): con el viento por la misma banda, el que está a barlovento se mantiene apartado del que está a sotavento.")] };
  }
  return genSail();
}
const RANK = { sg: 0, mr: 0, pesca: 2, vela: 3, pm: 4 };
const ART = { sg: "un buque sin gobierno", mr: "un buque con capacidad de maniobra restringida", pesca: "un buque dedicado a la pesca", vela: "un buque de vela", pm: "un buque de propulsión mecánica", calado: "un buque restringido por su calado" };
function genHier() {
  const pairs = [["pm", "vela"], ["pm", "pesca"], ["pm", "sg"], ["pm", "mr"], ["vela", "pesca"], ["vela", "sg"], ["vela", "mr"], ["pesca", "sg"], ["pesca", "mr"], ["pm", "calado"], ["vela", "calado"], ["pesca", "calado"]];
  for (let tries = 0; tries < 200; tries++) {
    let [a, b] = pick(pairs); if (Math.random() < 0.35 && b !== "calado") [a, b] = [b, a];
    const hA = Math.round(rnd(0, 72)) * 5, hB = Math.round(norm(hA + pick([-1, 1]) * rnd(60, 150)));
    const A = ship("A", a, [0, 0], hA, a === "vela" ? 0.4 : 0.5), B = ship("B", b, [0.1, 0], hB, ["sg"].includes(b) ? 0.2 : 0.42);
    const c = classify(A, B); if (c.k !== "cruce") continue;
    const m = x => Math.min(Math.abs(x - 112.5), Math.abs(x - 247.5)); if (m(c.ab) < 10 || m(c.ba) < 10) continue;
    fitShips([A, B]);
    const base = { title: "Obligaciones entre categorías", rule: "R18", env: "mar", ships: [A, B], gen: true, wind: [a, b].includes("vela") ? norm(hA + 90) : null,
      intro: `Tú (A) eres ${ART[a]}; B es ${ART[b]} y lo ves en marcación ${pad3(c.ab)}°. Buena visibilidad, riesgo de abordaje, mar abierto.` };
    if (b === "calado") return { ...base, qs: [
      Q("¿Qué debes hacer tú (A)?", "Evitar estorbar el tránsito seguro de B", ["Mantener rumbo y velocidad: B debe apartarse", "Nada especial: se aplica la regla de cruce", "Cruzarle por la proa rápidamente"], "R18 d i): todo buque que no sea sin gobierno ni de maniobra restringida evitará, si las circunstancias lo permiten, estorbar el tránsito seguro de un buque restringido por su calado."),
      Q("¿Qué marca o luces exhibe B?", "Un cilindro de día; tres rojas todo horizonte en vertical de noche", ["Dos bolas; dos rojas en vertical", "Bola–bicónica–bola; roja–blanca–roja", "Un cono vértice abajo"], "R28 (es potestativo: «podrá exhibir»)."),
      Q("¿Y B?", "Navega con especial precaución, teniendo en cuenta su condición", ["Tiene preferencia absoluta y no vigila", "Debe apartarse de A", "Debe fondear hasta que A pase"], "R18 d ii).")] };
    const gw = RANK[a] > RANK[b] ? "A" : "B";
    return { ...base, qs: [
      Q("¿Quién se mantiene apartado?", gw === "A" ? "A (tú)" : "B", [gw === "A" ? "B" : "A (tú)", "El que tenga al otro por estribor", "Los dos caen a estribor"], `R18: ${gw === "A" ? ART[a] : ART[b]} se mantiene apartado de ${gw === "A" ? ART[b] : ART[a]}. Orden: sin gobierno y maniobra restringida > pesca > vela > propulsión mecánica (restringido por su calado: los demás evitan estorbarle).`),
      Q("¿En qué regla se basa?", "R18: obligaciones entre categorías de buques", ["R15: situación de cruce", "R12: buques de vela", "R13: buque que alcanza"], "Entre categorías distintas manda R18 (salvo alcance, R13, y lo dispuesto en R9 y R10). R15 solo rige entre dos buques de propulsión mecánica."),
      Q(gw === "A" ? "¿Qué hace B?" : "¿Qué haces tú?", "Mantener rumbo y velocidad (R17)", ["Apartarse también por si acaso", "Cortar la proa del otro", "Detenerse siempre"], "Cuando uno debe apartarse, el otro mantiene su rumbo y velocidad (R17 a i), sin quedar eximido de vigilar.")] };
  }
  return genHier();
}

/* ---------- escenarios fijos ---------- */
function F() {
  const S = [];
  const add = s => S.push(s);
  add({ id: "f1", title: "Rumbos opuestos", rule: "R14", env: "mar", ships: [ship("A", "pm", [0, 0], 359, 0.5), ship("B", "pm", [0.1, 0.1], 179, 0.5)],
    intro: "Navegas a motor al rumbo 359°. Otra embarcación a motor viene al 179°, con riesgo de abordaje.",
    qs: [Q("¿Cómo se resuelve?", "Cada uno cae a estribor y pasa por la banda de babor del otro", ["Cada uno cae a babor y pasa por estribor del otro", "Mantiene el que tenga más eslora", "Si hay dudas se supone que no hay vuelta encontrada"], "R14 a). Y si hay dudas, se supone que sí existe (R14 c)."),
      Q("¿Qué señal acústica emites al caer?", "Una pitada corta", ["Dos cortas", "Una larga", "Tres cortas"], "R34 a i).")] });
  add({ id: "f2", title: "Luces por la proa", rule: "R14 b)", env: "mar", night: true, ships: [ship("A", "pm", [0, 0], 0, 0.5), ship("B", "big", [0.05, 0.1], 180, 0.45)],
    intro: "De noche ves por la proa, cada vez más cerca, las dos luces de tope enfiladas de un buque y sus dos luces de costado.",
    qs: [Q("¿Qué situación es?", "Vuelta encontrada", ["Cruce", "Alcance", "Buque fondeado"], "R14 b): topes enfilados o casi y/o ambos costados = vuelta encontrada."),
      Q("¿Qué haces?", "Caer a estribor para pasar por su banda de babor", ["Caer a babor", "Mantener rumbo: él debe apartarse", "Encender la luz de alcance intermitente"], "R14 a).")] });
  add({ id: "f3", title: "Cruce: lo ves por estribor", rule: "R15, R16", env: "mar", ships: [ship("A", "pm", [0, 0], 0, 0.5), ship("B", "pm", [0, 0.1], 270, 0.5)],
    intro: "Dos buques de propulsión mecánica se cruzan con riesgo de abordaje. A (tú) avista a B por su costado de estribor.",
    qs: [Q("Con carácter general, ¿qué ocurre?", "A debe caer claramente a estribor para pasar por la popa de B", ["B debe caer a babor para pasar por la popa de A", "Los dos caen a estribor", "A mantiene rumbo y B reduce"], "R15: se aparta quien tiene al otro por su estribor y, si puede, evita cortarle la proa. R16: con antelación y de forma decidida."),
      Q("De noche, ¿qué luces de B verías?", "Su luz de tope y su luz roja de costado", ["Su tope y su luz verde", "Sus dos costados", "Solo su luz de alcance"], "Lo ves por su babor: tope (225°) y costado de babor (rojo). Ver tope + roja por la proa = cruce en el que tú maniobras.")] });
  add({ id: "f4", title: "Cruce: lo ves por babor", rule: "R17", env: "mar", ships: [ship("A", "pm", [0, 0], 0, 0.5), ship("B", "pm", [0, 0.1], 90, 0.5)],
    intro: "B, de propulsión mecánica, cruza desde tu babor con demora constante. Tú eres A.",
    qs: [Q("¿Qué te corresponde?", "Mantener rumbo y velocidad", ["Caer a babor para pasarle por la popa", "Caer a estribor ya", "Parar máquinas"], "B te tiene por su estribor y cede el paso (R15). Tú sigues a rumbo (R17 a i)."),
      Q("B no maniobra y la distancia se reduce. ¿Qué puedes hacer?", "Maniobrar yo solo, evitando caer a babor", ["Caer a babor hacia su popa", "Nada: debo mantener rumbo hasta el final", "Dar dos pitadas largas"], "R17 a ii) y R17 c): si sigues a rumbo y el otro está por tu babor, no caes a babor."),
      Q("Si llegáis tan cerca que su sola maniobra no evita el abordaje…", "Ejecutarás la maniobra que mejor ayude a evitarlo", ["Mantendrás rumbo y velocidad", "Darás tres pitadas largas", "Solo debes avisar por VHF"], "R17 b). Además, R17 d): nada de esto exime a B de su obligación de apartarse.")] });
  add({ id: "f5", title: "Alcance desde la aleta", rule: "R13", env: "mar", ships: [ship("A", "pm", [0, 0], 30, 0.65), ship("B", "pm", [0.1, 0.1], 10, 0.25)],
    intro: "Navegando de noche ves por la proa, cada vez más cerca, únicamente una luz blanca de navegación de otro buque de propulsión mecánica.",
    qs: [Q("¿Qué situación es y qué haces?", "Alcance: me mantengo siempre apartado", ["Vuelta encontrada: caigo a estribor", "Cruce: mantengo rumbo", "Es un fondeado: no hay obligación"], "Solo su luz de alcance: estás a más de 22,5° a popa de su través. El que alcanza se aparta (R13 a, b)."),
      Q("Si tienes dudas de si alcanzas o cruzas…", "Te consideras buque que alcanza", ["Te consideras en cruce", "Lo decide el de mayor eslora", "Se aplica R14"], "R13 c)."),
      Q("Ya rebasándolo, la marcación cambia y te queda por su través. ¿Pasa a ser un cruce?", "No: sigues obligado a apartarte hasta dejarlo franco", ["Sí: ahora aplica R15", "Sí, y él debe apartarse", "Solo si es de noche"], "R13 d).")] });
  add({ id: "f6", title: "Un velero me alcanza", rule: "R13", env: "mar", wind: 270, ships: [ship("A", "pm", [0, 0], 0, 0.3), ship("B", "vela", [0.15, 0.1], 355, 0.6)],
    intro: "Navegas con una motora y se te aproxima por la popa un buque de vela, con riesgo de abordaje.",
    qs: [Q("¿Cómo maniobras?", "Mantengo el rumbo: debe maniobrar el velero", ["Me aparto porque es un velero (R18)", "Caigo a babor", "Paro máquinas"], "R13 a): «no obstante» R18, todo buque que alcanza a otro se mantiene apartado. Un velero que alcanza también cede."),
      Q("¿Qué luz tuya ve el velero de noche?", "Solo la de alcance", ["Tope y alcance", "Los costados", "Tope y verde"], "R13 b).")] });
  add({ id: "f7", title: "Me alcanzan por la popa", rule: "R13, R17", env: "mar", ships: [ship("A", "pm", [0, 0], 90, 0.25), ship("B", "pm", [0, 0.1], 92, 0.62)],
    intro: "De noche distingues, cada vez más cerca de tu popa, una luz blanca y las dos de costado de otro buque de propulsión mecánica.",
    qs: [Q("¿Qué haces?", "Mantengo rumbo y velocidad salvo que el otro no maniobre", ["Caigo a estribor para dejarle paso", "Me aparto: es una vuelta encontrada", "Doy atrás"], "Te alcanza: él se aparta (R13); tú sigues a rumbo (R17)."),
      Q("¿Qué señal emitirías si dudas de su maniobra?", "Al menos cinco pitadas cortas y rápidas", ["Una larga", "Dos largas y una corta", "Una corta, una larga, una corta"], "R34 d).")] });
  add({ id: "f8", title: "Veleros: amuras contrarias", rule: "R12 a i)", env: "mar", wind: 0, ships: [ship("A", "vela", [0, 0], 300, 0.4), ship("B", "vela", [0.1, 0], 60, 0.4)],
    intro: "Viento del N. Tú (A) navegas a vela al 300° (recibes el viento por estribor). B navega al 060° (lo recibe por babor).",
    qs: [Q("¿Quién se mantiene apartado?", "B, que recibe el viento por babor", ["A, que está a barlovento", "A, que recibe el viento por estribor", "Ambos arriban"], "R12 a i)."),
      Q("¿Qué haces tú?", "Mantener rumbo y velocidad", ["Virar por avante", "Arribar", "Orzar"], "R12 + R17 a i): en principio, mantener rumbo y velocidad.")] });
  add({ id: "f9", title: "Veleros: misma amura", rule: "R12 a ii)", env: "mar", wind: 90, ships: [ship("A", "vela", [0, 0], 30, 0.4), ship("B", "vela", [0.1, 0], 320, 0.42)],
    intro: "Viento del E. Ambos veleros reciben el viento por estribor. Tú (A) navegas al 030°; B navega al 320°.",
    qs: [Q("¿Quién está a barlovento?", "B", ["A (tú)", "Ninguno", "Depende de la eslora"], "B está más al E, hacia donde viene el viento."),
      Q("¿Quién se aparta?", "B, el de barlovento", ["A, el de sotavento", "El que recibe el viento por estribor", "Ninguno: rige R15"], "R12 a ii)."),
      Q("¿Y tú?", "Mantengo el rumbo: debe maniobrar B", ["Me aparto", "Viro", "Doy cinco pitadas"], "R17 a i).")] });
  add({ id: "f10", title: "Velero a barlovento, amura dudosa", rule: "R12 a iii)", env: "mar", wind: 0, ships: [ship("A", "vela", [0, 0], 60, 0.4), ship("B", "vela", [0.1, 0], 120, 0.25, { unk: true })],
    intro: "Viento del N. Tú (A) navegas al 060° y recibes el viento por babor. Avistas por barlovento otro velero (B) y no puedes determinar por qué banda recibe el viento.",
    qs: [Q("¿Qué debes hacer?", "Mantenerme apartado de su derrota", ["Mantener rumbo: él está a barlovento", "Esperar a ver su amura", "Caer a babor siempre"], "R12 a iii): si recibes el viento por babor y ves un velero a barlovento sin poder saber su amura, te mantienes apartado."),
      Q("¿Cómo se define la banda de barlovento?", "La contraria a la que lleva cazada la vela mayor", ["La misma en que lleva la mayor", "La banda de estribor", "La que mira a tierra"], "R12 b) (en aparejo redondo, la del mayor velamen de cuchillo).")] });
  add({ id: "f11", title: "Motor y pesquero por babor", rule: "R18 a)", env: "mar", ships: [ship("A", "pm", [0, 0], 0, 0.5), ship("B", "pesca", [0, 0.1], 80, 0.3)],
    intro: "Navegas a motor. Un buque dedicado a la pesca (de arrastre, verde sobre blanca) se te aproxima desde tu babor con demora constante.",
    qs: [Q("¿Quién se aparta?", "A (tú), aunque el pesquero esté por tu babor", ["El pesquero, porque me tiene por estribor", "Ambos caen a estribor", "Ninguno"], "R18 a): propulsión mecánica se aparta de un buque dedicado a la pesca. R15 solo vale entre dos de propulsión mecánica."),
      Q("¿Cómo maniobras?", "Si es necesario reduzco para estudiar la situación y maniobro de forma clara y con antelación", ["Con cambios pequeños y sucesivos de rumbo", "Mantengo hasta el último momento", "Acelero para cruzarle la proa"], "R8 a), b), e).")] });
  add({ id: "f12", title: "Velero y pesquero", rule: "R18 b)", env: "mar", wind: 270, ships: [ship("A", "vela", [0, 0], 0, 0.4), ship("B", "pesca", [0, 0.1], 250, 0.25)],
    intro: "Navegas a vela en alta mar y te encuentras con un buque dedicado a la pesca (no curricán) con riesgo de abordaje.",
    qs: [Q("¿Quién se aparta?", "Yo, el velero", ["El pesquero", "El que tenga al otro por estribor", "El de mayor eslora"], "R18 b): el buque de vela se aparta de sin gobierno, maniobra restringida y pesca."),
      Q("¿Y si fuera un barco pescando al curricán?", "No es «dedicado a la pesca»: sería un buque de propulsión mecánica (o vela) normal", ["Igual: tiene preferencia", "Tiene más preferencia que el arrastrero", "Es buque con maniobra restringida"], "R3 d): pescar con curricán u otro arte que no restrinja la maniobrabilidad no es «dedicado a la pesca».")] });
  add({ id: "f13", title: "Pesquero y buque sin gobierno", rule: "R18 c)", env: "mar", ships: [ship("A", "pesca", [0, 0], 0, 0.35), ship("B", "sg", [0, 0.1], 300, 0.15)],
    intro: "Tú (A) estás pescando. De día ves un buque con dos bolas negras en línea vertical que deriva hacia tu derrota.",
    qs: [Q("¿Qué es B?", "Un buque sin gobierno", ["Un buque varado", "Un buque restringido por su calado", "Un buque fondeado"], "R27 a): dos bolas en vertical (de noche dos rojas)."),
      Q("¿Quién se aparta?", "Yo (pesquero)", ["B", "Ambos", "Nadie"], "R18 c): el buque dedicado a la pesca se aparta de sin gobierno y maniobra restringida.")] });
  add({ id: "f14", title: "Cuatro buques en alta mar", rule: "R18", env: "mar", ships: [ship("A", "pm", [0, 0], 45, 0.5), ship("B", "vela", [0.2, 0.2], 330, 0.35), ship("C", "pesca", [-0.2, 0.3], 120, 0.25), ship("D", "hidro", [0.4, -0.3], 240, 0.15)],
    wind: 250, intro: "En alta mar convergen un buque de propulsión mecánica (A, tú), un velero (B), un buque dedicado a la pesca (C) y un hidroavión amarado (D).",
    qs: [Q("Con carácter general, ¿cuál mantiene su derrota?", "C, el buque dedicado a la pesca", ["B, el velero", "A, propulsión mecánica", "D, el hidroavión"], "R18: pesca > vela > propulsión mecánica; el hidroavión amarado se mantiene, en general, bien apartado de todos (R18 e)."),
      Q("¿Qué hace el velero (B) respecto al pesquero (C)?", "Se mantiene apartado", ["Mantiene rumbo", "Rige R12", "Rige R15"], "R18 b)."),
      Q("Una nave de vuelo rasante en la superficie del agua…", "Cumple las reglas de rumbo y gobierno como propulsión mecánica", ["Tiene preferencia sobre todos", "No está obligada a cumplirlas", "Es buque de maniobra restringida"], "R18 f ii). Al despegar, aterrizar o volar cerca de la superficie se mantiene bien apartada de todos (R18 f i).")] });
  add({ id: "f15", title: "Restringido por su calado", rule: "R18 d)", env: "canal", wind: 90, ships: [ship("A", "vela", [0, 0], 30, 0.35), ship("B", "calado", [0.1, 0.2], 180, 0.45)],
    intro: "De día ves por la proa un mercante con un cilindro negro, navegando por el centro del canal dragado.",
    qs: [Q("¿Qué indica el cilindro?", "Restringido por su calado", ["Sin gobierno", "Varado", "Remolque > 200 m"], "R28: cilindro (de noche, tres rojas en vertical)."),
      Q("¿Qué debes hacer con tu velero?", "Evitar estorbar su tránsito seguro", ["Mantener rumbo: el velero tiene preferencia", "Cruzarle la proa", "Fondear en el canal"], "R18 d i). Además, R9 b): los veleros no estorban a quien solo puede navegar con seguridad dentro del canal.")] });
  add({ id: "f16", title: "Nave WIG despegando", rule: "R18 f), R23 c)", env: "mar", ships: [ship("A", "pm", [0, 0], 0, 0.45), ship("B", "wig", [0.2, 0.2], 250, 0.9)],
    intro: "De noche ves luces de propulsión mecánica y una luz roja centelleante todo horizonte de gran intensidad que se aproxima muy rápido.",
    qs: [Q("¿Qué es?", "Una nave de vuelo rasante despegando, aterrizando o volando cerca de la superficie", ["Un aerodeslizador sin desplazamiento", "Un buque sin gobierno", "Un buque en peligro"], "R23 c). La amarilla centelleante es del aerodeslizador (R23 b)."),
      Q("¿Quién se aparta?", "La nave WIG, de todos los buques", ["Yo, como de cualquier buque especial", "Ambos caen a estribor", "El de mayor eslora"], "R18 f i).")] });
  add({ id: "f17", title: "Canal angosto: tu banda", rule: "R9 a), g)", env: "canal", ships: [ship("A", "pm", [0.9, 0], 0, 0.45), ship("B", "pm", [-0.9, 0.5], 180, 0.45)],
    intro: "Navegas a lo largo de un canal angosto.",
    qs: [Q("¿Por dónde debes navegar?", "Lo más cerca posible del límite exterior del canal que quede por tu estribor, si no entraña peligro", ["Por el centro del canal", "Lo más cerca posible del límite de babor", "Por el límite interior"], "R9 a)."),
      Q("¿Fondear dentro del canal?", "Se evitará siempre que las circunstancias lo permitan", ["Está permitido a buques < 20 m", "Solo de noche", "Libremente si se exhibe la bola"], "R9 g).")] });
  add({ id: "f18", title: "Velero de 6 m y portacontenedores", rule: "R9 b)", env: "canal", wind: 90, ships: [ship("A", "vela", [0.9, 0], 0, 0.3), ship("B", "big", [-0.4, 0.2], 180, 0.5)],
    intro: "Navegas en un velero de 6 m por un canal angosto y ves aproximarse de vuelta encontrada a un portacontenedores de 100 m que solo puede navegar con seguridad dentro del canal.",
    qs: [Q("En general, ¿qué debes hacer?", "No estorbar el tránsito del portacontenedores", ["Mantener rumbo: el velero tiene preferencia (R18)", "Caer a babor para pasar por estribor", "Fondear en medio del canal"], "R9 b): buques < 20 m y de vela no estorbarán el tránsito de un buque que solo puede navegar con seguridad dentro del canal."),
      Q("¿Qué buque NO estorbará el tránsito de ningún otro que navegue dentro del canal?", "Un buque dedicado a la pesca", ["Un buque de propulsión mecánica de 25 m", "Un portacontenedores", "Un buque de práctico"], "R9 c).")] });
  add({ id: "f19", title: "Alcanzar en canal angosto", rule: "R9 e), R34 c)", env: "canal", ships: [ship("A", "pm", [0.9, 0], 0, 0.62), ship("B", "pm", [0.9, 1.8], 0, 0.3)],
    intro: "En un canal angosto quieres alcanzar a B, que va delante, y para ello él debe maniobrar.",
    qs: [Q("Quieres adelantarle por su banda de babor. ¿Señal?", "Dos pitadas largas seguidas de dos cortas", ["Dos largas y una corta", "Dos cortas", "Larga, corta, larga, corta"], "R34 c i): 2 largas + 1 corta = «pretendo alcanzarle por su estribor»; 2 largas + 2 cortas = «por su babor»."),
      Q("B está de acuerdo. ¿Qué responde?", "Larga, corta, larga, corta", ["Una corta", "Cinco cortas", "Dos largas"], "R34 c ii). Si tiene dudas, al menos cinco cortas y rápidas (R34 d)."),
      Q("Con buena visibilidad, un velero de < 10 m cruza y puede estorbar tu tránsito seguro; dudas de sus intenciones:", "Al menos cinco pitadas cortas y rápidas y maniobrar si fuera necesario", ["Una pitada larga y mantener", "Tres cortas y fondear", "Ninguna señal: tiene preferencia"], "R9 d) y R34 d).")] });
  add({ id: "f20", title: "Recodo sin visibilidad", rule: "R9 f), R34 e)", env: "recodo", ships: [ship("A", "pm", [0.6, -0.5], 0, 0.4, { tc: 8 }), ship("B", "pm", [-2.2, 3.1], 270, 0.4, { tc: 8, hide: true })],
    intro: "Te aproximas a un recodo del canal donde, por estar obstruida la visión, no puedes ver a otros buques.",
    qs: [Q("¿Qué haces?", "Navegar alerta y con precaución, haciendo sonar una pitada larga", ["Dar dos pitadas cortas", "Dar cinco pitadas cortas", "Encender todas las luces de cubierta"], "R9 f) y R34 e)."),
      Q("Un buque al otro lado del recodo oye tu señal. ¿Qué contesta?", "Una pitada larga", ["Una corta", "Dos largas", "Nada"], "R34 e).")] });
  add({ id: "f21", title: "Cruzar un DST", rule: "R10 c)", env: "dst", ships: [ship("A", "pm", [0, 0], 0, 0.5, { tc: 6 }), ship("B", "big", [5, 1.6], 270, 0.4, { tc: 6 }), ship("C", "big", [-6, -1.6], 90, 0.4, { tc: 6 })],
    intro: "Te ves obligado a cruzar un dispositivo de separación del tráfico.",
    qs: [Q("¿Cómo lo cruzas?", "Con un rumbo que forme, en lo posible, un ángulo recto con la dirección general del tráfico", ["Siguiendo la zona de separación", "Con el menor ángulo posible", "Diagonalmente, para estar menos tiempo"], "R10 c): rumbo (proa) perpendicular, para minimizar el tiempo y dejar claro que cruzas."),
      Q("¿Y para incorporarte a una vía por uno de sus límites laterales?", "Con el menor ángulo posible respecto a la dirección general del tráfico", ["En ángulo recto", "Siempre por los extremos", "No está permitido"], "R10 b iii).")] });
  add({ id: "f22", title: "Zona de navegación costera", rule: "R10 d)", env: "dst", ships: [ship("A", "pm", [-1, -4.3], 90, 0.45, { tc: 6 }), ship("B", "big", [3, -1.6], 90, 0.4, { tc: 6 })],
    intro: "Navegas de Cádiz a Málaga y vas a pasar un DST con zona de navegación costera.",
    qs: [Q("Con un buque de propulsión mecánica de 15 m:", "Puedes usar la zona de navegación costera (o la vía adecuada si puedes hacerlo con seguridad)", ["Debes usar obligatoriamente la vía de circulación", "No puedes entrar en el DST", "Debes navegar por la zona de separación"], "R10 d i): los < 20 m, los veleros y los pesqueros pueden usar la zona de navegación costera."),
      Q("Con un yate de 24 m a motor, en ruta directa:", "Debes usar la vía de circulación siguiendo la dirección general del tráfico", ["Puedes usar la zona costera sin más", "Puedes navegar contra corriente por la vía", "Debes cruzar en ángulo recto"], "R10 d i): los demás no usan la zona costera si pueden navegar con seguridad por la vía; R10 d ii) la permite para ir a un puerto o lugar dentro de ella o para evitar un peligro inmediato.")] });
  add({ id: "f23", title: "Velero en un DST", rule: "R10 j)", env: "dst", wind: 0, ships: [ship("A", "vela", [-2, -1.6], 90, 0.35, { tc: 6 }), ship("B", "big", [2, -1.6], 90, 0.6, { tc: 6 })],
    intro: "Navegas a vela por un DST con bastante tráfico de buques de propulsión mecánica.",
    qs: [Q("¿Cómo transitas?", "Sin estorbar el paso seguro de los buques de propulsión mecánica que siguen la vía; puedo usar la zona costera", ["Con preferencia sobre ellos (R18)", "Por la zona de separación", "En sentido contrario, que hay menos tráfico"], "R10 j) y d i)."),
      Q("Un buque de maniobra restringida tendiendo cable en el DST…", "Queda exento de R10 en la medida necesaria para la operación", ["Debe salir del DST", "No puede trabajar en él", "Debe seguir la vía"], "R10 k) y l).")] });
  add({ id: "f24", title: "Eco por la proa, sin verlo", rule: "R19 d)", env: "niebla", ships: [ship("A", "pm", [0, 0], 0, 0.45), ship("B", "pm", [0, 0.1], 250, 0.4, { radar: true })],
    intro: "Niebla. Detectas solo por radar un eco a proa de tu través, por estribor, y determinas que se crea una situación de aproximación excesiva.",
    qs: [Q("Si cambias de rumbo, ¿qué debes evitar?", "Caer a babor respecto a un buque a proa del través (salvo que lo estés alcanzando)", ["Caer a estribor", "Reducir velocidad", "Mantener el rumbo"], "R19 d i)."),
      Q("¿Se aplican aquí R12–R18?", "No: R19 es para buques que no están a la vista uno del otro", ["Sí, igual que a la vista", "Solo R15", "Solo R18"], "R19 a). Las reglas de la sección II son para buques a la vista (R11)."),
      Q("¿Qué señal acústica das con arrancada?", "Una pitada larga a intervalos ≤ 2 min", ["Dos largas cada 2 min", "Una larga y dos cortas", "Campana cada minuto"], "R35 a).")] });
  add({ id: "f25", title: "Eco por el través", rule: "R19 d ii)", env: "niebla", ships: [ship("A", "pm", [0, 0], 0, 0.3), ship("B", "pm", [0.1, 0], 300, 0.5, { radar: true })],
    intro: "Visibilidad reducida. El radar muestra un eco por tu través de estribor que se acerca con demora constante.",
    qs: [Q("¿Qué cambio de rumbo debes evitar?", "Caer hacia él, a estribor", ["Caer a babor", "Reducir velocidad", "Cualquier cambio: solo vale reducir"], "R19 d ii): evitar caer hacia un buque situado por el través o a popa del través."),
      Q("Los buques de propulsión mecánica en visibilidad reducida…", "Tendrán las máquinas listas para maniobrar inmediatamente", ["Pueden mantener su velocidad de crucero", "Deben fondear", "Apagan el radar para oír mejor"], "R19 b).")] });
  add({ id: "f26", title: "Señal de niebla a proa", rule: "R19 e)", env: "niebla", ships: [ship("A", "pm", [0, 0], 0, 0.45), ship("B", "vela", [0.3, 0.4], 160, 0.25, { radar: true, hide: true })],
    intro: "Niebla cerrada. Oyes, al parecer a proa de tu través, una pitada larga seguida de dos cortas. No hay radar a bordo.",
    qs: [Q("¿Qué haces?", "Reducir a la mínima velocidad de gobierno y, si es necesario, suprimir la arrancada; navegar con extrema precaución", ["Aumentar a la máxima para salir de la zona", "Caer a babor con decisión", "Mantener rumbo y velocidad"], "R19 e)."),
      Q("¿Qué buque puede ser?", "Un velero (o pesca, sin gobierno, maniobra restringida, calado, remolcando)", ["Un buque de propulsión mecánica con arrancada", "Un buque fondeado", "Un práctico"], "R35 c): larga + 2 cortas.")] });
  add({ id: "f27", title: "Demora constante", rule: "R7", env: "mar", bearing: true, ships: [ship("A", "pm", [0, 0], 20, 0.5), ship("B", "pm", [0.05, 0.05], 300, 0.45)],
    intro: "Observa la línea de demora entre A y B mientras avanzan: la demora de aguja no varía.",
    qs: [Q("¿Qué indica una demora que no varía de forma apreciable?", "Que existe riesgo de abordaje", ["Que pasará claro por la proa", "Que es un buque fondeado", "Nada si la distancia es grande"], "R7 d i)."),
      Q("Si la demora sí cambia apreciablemente…", "Puede seguir existiendo riesgo, sobre todo con buques muy grandes, remolques o a corta distancia", ["El riesgo queda descartado", "Hay riesgo únicamente si la demora no varía", "Debe darse una pitada larga"], "R7 d ii)."),
      Q("Ante la duda de si hay riesgo…", "Se considera que existe", ["Se considera que no existe", "Se consulta por VHF y se espera", "Decide el de mayor eslora"], "R7 a). Y se evitan las suposiciones basadas en información insuficiente, especialmente de radar (R7 c).")] });
  add({ id: "f28", title: "Velocidad de seguridad", rule: "R6", env: "mar", night: true, ships: [ship("A", "pm", [0, 0], 0, 0.6), ship("B", "pesca", [1.5, 1.5], 120, 0.2), ship("C", "pesca", [-1.5, 2], 200, 0.15), ship("D", "pesca", [0.5, 2.8], 90, 0.2)],
    intro: "De noche, cerca de la costa iluminada y entre una concentración de pesqueros.",
    qs: [Q("¿Qué NO se tiene en cuenta para la velocidad de seguridad?", "La hora de llegada a puerto", ["La densidad de tráfico, incluidas las concentraciones de pesqueros", "La luz de fondo producida por las luces de tierra", "El calado en relación con la profundidad disponible"], "R6 a): visibilidad, densidad de tráfico, maniobrabilidad, luz de fondo, viento/mar/corrientes y peligros, calado-profundidad. La pericia del patrón tampoco figura."),
      Q("Con radar, ¿qué debes considerar?", "La escala en uso puede imponer restricciones para detectar ecos", ["El radar permite ir siempre a máxima velocidad", "No se usa el radar para la velocidad de seguridad", "Solo la marca del radar"], "R6 b): características y limitaciones del radar, escala, estado de la mar, posibilidad de no detectar buques pequeños y hielos, etc."),
      Q("La velocidad de seguridad es la que…", "Permite maniobrar de forma adecuada y eficaz para evitar el abordaje y parar a la distancia adecuada", ["Es la máxima del barco", "Es siempre inferior a 6 nudos", "Fija la Capitanía para cada zona"], "R6.")] });
  add({ id: "f29", title: "Maniobra para evitar el abordaje", rule: "R8", env: "mar", ships: [ship("A", "pm", [0, 0], 0, 0.5), ship("B", "pm", [0.05, 0.1], 280, 0.5)],
    intro: "Tienes que apartarte de B.",
    qs: [Q("¿Cuál de estas afirmaciones es INCORRECTA?", "Los cambios de rumbo y/o velocidad serán sucesivos y pequeños", ["Serán lo bastante amplios para ser fácilmente percibidos", "Se harán con antelación suficiente y buenas prácticas marineras", "Si es necesario se reducirá la velocidad o se suprimirá la arrancada"], "R8 b): se evitará una sucesión de pequeños cambios."),
      Q("Cambiar solo el rumbo…", "Puede ser lo más eficaz si hay espacio suficiente y se hace con antelación", ["Nunca es suficiente", "Solo sirve de noche", "Siempre es peor que reducir"], "R8 c).")] });
  add({ id: "f30", title: "Vigilancia y AIS", rule: "R5", env: "niebla", ships: [ship("A", "vela", [0, 0], 0, 0.35), ship("B", "pm", [0.2, 0.3], 200, 0.4, { radar: true })],
    intro: "Navegas en solitario con piloto automático, AIS y radar, con visibilidad reducida.",
    qs: [Q("¿Qué vigilancia exige el RIPA?", "Visual y auditiva en todo momento, usando además todos los medios disponibles", ["Basta el AIS con alarma", "Solo radar en niebla", "Auditiva solo en niebla"], "R5: en cualquier condición de visibilidad, también en solitario."),
      Q("¿Se aplica R19 a un velero dentro de la niebla?", "Sí", ["No, solo a buques de motor", "Solo si tiene radar", "Solo de noche"], "R19 a): a todos los buques que no estén a la vista uno del otro en o cerca de una zona de visibilidad reducida.")] });
  return S;
}
const FIXED = F();

/* ---------- dibujo ---------- */
const CSS = `
.m-${ID} [hidden]{display:none!important}
.m-${ID} .lay{display:grid;gap:1rem;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}
@media (max-width:820px){.m-${ID} .lay{grid-template-columns:minmax(0,1fr)}}
.m-${ID} .view{aspect-ratio:16/11;min-height:230px}
.m-${ID} .choices{display:grid;gap:.4rem}
.m-${ID} .choices .btn{justify-content:flex-start;text-align:left;font-weight:500;white-space:normal;line-height:1.25}
.m-${ID} .choices .btn.sel{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
.m-${ID} .choices .btn.ok{border-color:var(--ok);color:var(--ok);font-weight:700}
.m-${ID} .choices .btn.bad{border-color:var(--bad);color:var(--bad)}
.m-${ID} .why{font-size:.9rem;border-left:3px solid var(--line);padding-left:.6rem}
.m-${ID} .why.ok{border-color:var(--ok)}.m-${ID} .why.bad{border-color:var(--bad)}
.m-${ID} .streak{display:flex;gap:3px}
.m-${ID} .streak i{width:14px;height:8px;border-radius:2px;background:var(--sea-2)}
.m-${ID} .streak i.on{background:var(--accent)}
.m-${ID} select{min-height:36px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);padding:.2em .4em;max-width:100%}
.m-${ID} .hd{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:space-between;align-items:flex-end}
`;
const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function drawScene(c, W, H, sc, t, opts) {
  const C = { sea: tok("--sea"), sea2: tok("--sea-2"), ink: tok("--ink"), muted: tok("--muted"), acc: tok("--accent"), line: tok("--line"), sheet: tok("--sheet"), paper: tok("--paper"), port: tok("--port"), stbd: tok("--stbd"), y: tok("--buoy-y"), mono: tok("--f-mono"), body: tok("--f-body") };
  const s = Math.min(W / 20, H / 13.5); const ox = W / 2, oy = H / 2;
  const X = p => [ox + p[0] * s, oy - p[1] * s];
  const night = sc.night;
  c.fillStyle = night ? "#071019" : C.sea; c.fillRect(0, 0, W, H);
  // retícula de carta
  c.strokeStyle = night ? "rgba(120,160,190,.12)" : C.sea2; c.lineWidth = 1;
  for (let gx = -10; gx <= 10; gx += 2) { const a = X([gx, 0]); c.beginPath(); c.moveTo(a[0] + .5, 0); c.lineTo(a[0] + .5, H); c.stroke(); }
  for (let gy = -8; gy <= 8; gy += 2) { const a = X([0, gy]); c.beginPath(); c.moveTo(0, a[1] + .5); c.lineTo(W, a[1] + .5); c.stroke(); }
  // entorno
  const land = night ? "#1a2a36" : C.sheet;
  const poly = (pts, fill, stroke) => { c.beginPath(); pts.map(X).forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.stroke(); } };
  if (sc.env === "canal") { poly([[-11, -9], [-2.4, -9], [-2.4, 9], [-11, 9]], land, C.line); poly([[11, -9], [2.4, -9], [2.4, 9], [11, 9]], land, C.line);
    c.setLineDash([6, 6]); c.strokeStyle = C.muted; const a = X([0, -9]), b = X([0, 9]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.setLineDash([]);
    lab(c, "canal angosto", X([0, -6.2]), C.muted, C.body, "center"); }
  if (sc.env === "recodo") { poly([[-11, -9], [-0.6, -9], [-0.6, 1.8], [-11, 1.8]], land, C.line); poly([[1.9, -9], [11, -9], [11, 9], [-11, 9], [-11, 4.4], [1.9, 4.4]], land, C.line);
    lab(c, "tierra: visión obstruida", X([-5.5, -1]), C.muted, C.body, "center"); }
  if (sc.env === "dst") {
    poly([[-11, -0.5], [11, -0.5], [11, 0.5], [-11, 0.5]], "rgba(168,34,111,.22)", null);
    lab(c, "zona de separación", X([-6.5, -0.15]), C.acc, C.body, "center");
    for (const [y, dir] of [[1.6, -1], [-1.6, 1]]) for (let x = -8; x <= 8; x += 5) arrow(c, X([x - dir, y]), X([x + dir, y]), C.acc);
    c.setLineDash([5, 5]); c.strokeStyle = C.acc; for (const y of [2.8, -2.8]) { const a = X([-11, y]), b = X([11, y]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); } c.setLineDash([]);
    poly([[-11, -6.4], [11, -6.4], [11, -9], [-11, -9]], land, C.line);
    lab(c, "zona de navegación costera", X([5.5, -4.6]), C.muted, C.body, "center"); lab(c, "costa", X([0, -6.0]), C.muted, C.body, "center");
  }
  // estela, vector y buques
  const bySide = [];
  for (const sh of sc.ships) {
    const p = pos(sh, t);
    if (sh.hide && !opts.reveal) continue;
    if (sc.env === "niebla" && sh.id !== "A" && sh.radar) { // eco radar
      const q = X(p); c.fillStyle = C.acc; c.globalAlpha = .9; c.beginPath(); c.arc(q[0], q[1], 5, 0, 7); c.fill(); c.globalAlpha = .35; c.beginPath(); c.arc(q[0], q[1], 11, 0, 7); c.fill(); c.globalAlpha = 1;
      lab(c, `${sh.id} · eco radar`, [q[0] + 12, q[1] - 10], C.ink, C.body); continue; }
    const u = U(sh.hdg); const ty = TYPES[sh.type] || TYPES.pm; const L = ty.s * 0.55;
    // estela
    c.strokeStyle = night ? "rgba(200,220,235,.25)" : C.sea2; c.lineWidth = 2; c.setLineDash([2, 4]);
    const p0 = X(pos(sh, Math.max(0, t - 4))), p1 = X(p); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); c.setLineDash([]);
    // vector de rumbo
    if (sh.spd > 0) { const f = X([p[0] + u[0] * (L + sh.spd * 2.4), p[1] + u[1] * (L + sh.spd * 2.4)]); c.strokeStyle = sh.id === "A" ? C.acc : (night ? "#cfe0ea" : C.ink); c.lineWidth = 1.2; c.globalAlpha = .65; c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(f[0], f[1]); c.stroke(); c.globalAlpha = 1; }
    drawHull(c, X, p, sh.hdg, L, sh.id === "A" ? C.acc : (night ? "#cfe0ea" : C.ink), sh.type, sc.wind, night);
    if (night) { // luces de costado esquemáticas
      const r = [u[1], -u[0]]; const fwd = [p[0] + u[0] * L * 0.2, p[1] + u[1] * L * 0.2];
      dotL(c, X([fwd[0] + r[0] * L * 0.32, fwd[1] + r[1] * L * 0.32]), "#22ff88"); dotL(c, X([fwd[0] - r[0] * L * 0.32, fwd[1] - r[1] * L * 0.32]), "#ff2e2e");
    }
    const tag = sh.id === "A" ? `A · tú · ${ty.n}` : `${sh.id} · ${ty.n}${sh.unk ? " (amura desconocida)" : ""}`;
    const q = X(p); bySide.push([q, tag, sh.id === "A"]);
  }
  for (const [q, tag, me] of bySide) lab(c, tag, [q[0] + 14, q[1] + 16], me ? C.acc : (night ? "#cfe0ea" : C.ink), C.body, "left", true);
  // línea de demora
  if (sc.bearing || opts.bearing) {
    const A = sc.ships[0];
    for (const B of sc.ships.slice(1)) { if (B.hide && !opts.reveal) continue;
      const pa = pos(A, t), pb = pos(B, t); const a = X(pa), b = X(pb);
      c.strokeStyle = C.acc; c.setLineDash([4, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.setLineDash([]);
      for (let k = 1; k <= 3; k++) { const tt = Math.max(0, t - k * 2.5); const q1 = X(pos(A, tt)), q2 = X(pos(B, tt)); c.globalAlpha = 0.18; c.beginPath(); c.moveTo(q1[0], q1[1]); c.lineTo(q2[0], q2[1]); c.stroke(); c.globalAlpha = 1; }
      const d = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      if (d > 0.6) lab(c, `Dv ${pad3(brg(pa, pb))}°`, [(a[0] + b[0]) / 2 + 6, (a[1] + b[1]) / 2 - 6], C.acc, C.mono, "left", true);
    }
  }
  if (sc.wind != null) { // flecha de viento
    const cx = W - 46, cy = 46, u = U(sc.wind + 180);
    c.fillStyle = night ? "rgba(7,16,25,.7)" : C.sheet; c.strokeStyle = C.line; c.beginPath(); c.arc(cx, cy, 30, 0, 7); c.fill(); c.stroke();
    arrow(c, [cx - u[0] * 20, cy + u[1] * 20], [cx + u[0] * 20, cy - u[1] * 20], night ? "#cfe0ea" : C.ink);
    lab(c, `viento ${rose(sc.wind)}`, [cx, cy + 46], night ? "#cfe0ea" : C.ink, C.body, "center", true);
  }
  if (sc.env === "niebla") { c.fillStyle = C.paper; c.globalAlpha = 0.38; c.fillRect(0, 0, W, H); c.globalAlpha = 1; lab(c, "visibilidad reducida", [12, 20], C.ink, C.body, "left", true); }
  // rosa N
  lab(c, "N ↑", [12, H - 10], night ? "#cfe0ea" : C.muted, C.mono);
}
function lab(c, txt, q, col, font, align = "left", halo = false) {
  c.font = `600 12px ${font}`; c.textAlign = align; c.textBaseline = "middle";
  if (halo) { c.lineWidth = 3; c.strokeStyle = tok("--sheet"); c.globalAlpha = 0.75; c.strokeText(txt, q[0], q[1]); c.globalAlpha = 1; }
  c.fillStyle = col; c.fillText(txt, q[0], q[1]);
}
function arrow(c, a, b, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0] - 8 * Math.cos(ang - .45), b[1] - 8 * Math.sin(ang - .45)); c.lineTo(b[0] - 8 * Math.cos(ang + .45), b[1] - 8 * Math.sin(ang + .45)); c.closePath(); c.fill();
}
function dotL(c, q, col) { c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], 7); g.addColorStop(0, col); g.addColorStop(1, col + "00"); c.fillStyle = g; c.beginPath(); c.arc(q[0], q[1], 7, 0, 7); c.fill(); c.globalCompositeOperation = "source-over"; }
function drawHull(c, X, p, hdg, L, col, type, wind, night) {
  const u = U(hdg), r = [u[1], -u[0]]; const B = L * (type === "big" || type === "calado" ? 0.28 : 0.36);
  const P = (f, s) => X([p[0] + u[0] * f * L + r[0] * s * B, p[1] + u[1] * f * L + r[1] * s * B]);
  const pts = [P(1, 0), P(0.45, 1), P(-0.95, 0.85), P(-1, 0), P(-0.95, -0.85), P(0.45, -1)];
  c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath();
  c.fillStyle = col; c.globalAlpha = 0.22; c.fill(); c.globalAlpha = 1; c.strokeStyle = col; c.lineWidth = 1.8; c.stroke();
  if (type === "vela" && wind != null) { // botavara a sotavento
    const rel = norm(wind - hdg); const lee = rel < 180 ? -1 : 1; const m = P(0.15, 0); const ang = 28 * DEG;
    const bx = -Math.cos(ang), by = Math.sin(ang) * lee; const e = P(0.15 + bx * 1.0, by * 2.2);
    c.strokeStyle = col; c.lineWidth = 2.4; c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(e[0], e[1]); c.stroke();
  }
  if (type === "wig" || type === "hidro") { const a = P(0.1, 2.6), b = P(0.1, -2.6); c.strokeStyle = col; c.lineWidth = 2.6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  if (type === "pesca") { const a = P(-1, 0), b = X([p[0] - u[0] * L * 3.2, p[1] - u[1] * L * 3.2]); c.setLineDash([3, 3]); c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.setLineDash([]); }
  const sym = { pesca: "P", sg: "SG", mr: "MR", calado: "C", vela: "", pm: "", wig: "W", hidro: "H", big: "", anc: "F" }[type] || "";
  if (sym) { const q = P(-0.1, 0); c.font = "700 10px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(sym, q[0], q[1]); }
}

/* ---------- módulo ---------- */
export default {
  id: ID, tema: 6, title: "¿Quién maniobra?", icon: "⇄",
  desc: "Situaciones animadas de cruce, vuelta encontrada, alcance, vela, canales, DST y niebla: decide quién cede, qué maniobra y qué señal.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) document.head.append(h("style", { "data-mod": ID }, CSS));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const store = ctx.store || { get: (k, d) => d, set() {} };
    const root = h("div", { class: `m-${ID} stack` }); el.append(root);
    const st = { mode: "mix", sc: null, t: 0, done: false, ans: {}, streak: 0, best: store.get("best", 0), seen: new Set(), fixedIdx: 0, reveal: false, bearing: false };

    const MODES = [["mix", "Mezcla"], ["fix", "Escenarios fijos"], ["rnd", "Aleatorios"]];
    const seg = h("div", { class: "seg", role: "group", "aria-label": "Modo" });
    for (const [k, l] of MODES) seg.append(h("button", { type: "button", "aria-pressed": String(k === st.mode), onclick: () => { st.mode = k; [...seg.children].forEach((b, i) => b.setAttribute("aria-pressed", String(MODES[i][0] === k))); fixSel.hidden = k !== "fix"; next(); } }, l));
    const fixSel = h("select", { "aria-label": "Escenario", hidden: true, onchange: () => { st.fixedIdx = (+fixSel.value + 1) % FIXED.length; load(FIXED[+fixSel.value]); } });
    FIXED.forEach((s, i) => fixSel.append(h("option", { value: i }, `${s.rule} · ${s.title}`)));
    const streakBar = h("div", { class: "streak", "aria-hidden": "true" }); for (let i = 0; i < 10; i++) streakBar.append(h("i"));
    const streakTxt = h("span", { class: "small mono" });
    root.append(h("div", { class: "hd" }, h("div", null, h("div", { class: "eyebrow" }, "Tema 6 · RIPA Parte B · Reglas 4–19 y 34–35"), h("h3", null, "¿Quién maniobra?")), seg),
      h("div", { class: "row", style: "justify-content:space-between" }, fixSel, h("div", { class: "row", style: "gap:.5rem" }, h("span", { class: "small muted" }, "Racha"), streakBar, streakTxt)));

    const cv = h("canvas", { "aria-label": "Vista cenital de la situación" });
    const stage = h("div", { class: "stage view" }, cv);
    const titleEl = h("h4"); const ruleChip = h("span", { class: "chip acc" }); const intro = h("p");
    const qBox = h("div", { class: "stack" }); const fb = h("div", { class: "stack", "aria-live": "polite" });
    const checkBtn = h("button", { type: "button", class: "btn primary", onclick: () => check() }, "Comprobar");
    const nextBtn = h("button", { type: "button", class: "btn primary", onclick: () => next() }, "Siguiente situación");
    const brgBtn = h("button", { type: "button", class: "btn sm", "aria-pressed": "false", onclick: () => { st.bearing = !st.bearing; brgBtn.setAttribute("aria-pressed", String(st.bearing)); brgBtn.classList.toggle("primary", st.bearing); } }, "Línea de demora");
    const replayBtn = h("button", { type: "button", class: "btn sm", onclick: () => { st.t = 0; } }, "Repetir");
    root.append(h("div", { class: "lay" },
      h("div", { class: "stack" }, stage, h("div", { class: "row" }, replayBtn, brgBtn, h("span", { class: "small muted" }, "Rumbo 000° arriba (norte). Vectores = rumbo y velocidad."))),
      h("div", { class: "panel stack" }, h("div", { class: "row", style: "justify-content:space-between" }, titleEl, ruleChip), intro, qBox, h("div", { class: "row" }, checkBtn, nextBtn), fb)));

    function paintStreak() { [...streakBar.children].forEach((x, i) => x.classList.toggle("on", i < st.streak % 10 || (st.streak >= 10 && st.streak % 10 === 0 && i < 10))); streakTxt.textContent = `${st.streak} · récord ${st.best}`; }
    function next() {
      let sc;
      if (st.mode === "fix") { sc = FIXED[st.fixedIdx]; st.fixedIdx = (st.fixedIdx + 1) % FIXED.length; fixSel.value = (st.fixedIdx + FIXED.length - 1) % FIXED.length; }
      else if (st.mode === "rnd" || (st.mode === "mix" && Math.random() < 0.45)) sc = pick([genPower, genPower, genSail, genHier])();
      else { const pool = FIXED.filter(s => !st.seen.has(s.id)); if (!pool.length) st.seen.clear(); sc = pick(pool.length ? pool : FIXED); st.seen.add(sc.id); }
      load(sc);
    }
    function load(sc) {
      if ((sc.env === "mar" || sc.env === "niebla") && !sc._fit) { fitShips(sc.ships, [13, 8.5]); sc._fit = true; }
      st.sc = sc; st.t = reduce ? T * 0.35 : 0; st.done = false; st.ans = {}; st.reveal = false;
      titleEl.textContent = sc.title; ruleChip.textContent = sc.rule; intro.textContent = sc.intro;
      qBox.textContent = ""; fb.textContent = ""; checkBtn.hidden = false; nextBtn.hidden = true;
      sc.qs.forEach((q, i) => {
        const opts = shuffle([q.ok, ...q.bad]);
        const box = h("div", { class: "choices", role: "radiogroup", "aria-label": q.q });
        for (const o of opts) box.append(h("button", { type: "button", class: "btn sm", role: "radio", "aria-checked": "false", onclick: ev => {
          if (st.done) return; st.ans[i] = o; for (const b of box.children) { const on = b.textContent === o; b.classList.toggle("sel", on); b.setAttribute("aria-checked", String(on)); } } }, o));
        qBox.append(h("div", { class: "stack", style: "gap:.35rem" }, h("b", null, `${i + 1} · ${q.q}`), box, h("p", { class: "why", hidden: true })));
      });
    }
    function check() {
      const sc = st.sc; if (st.done) return;
      if (sc.qs.some((_, i) => !st.ans[i])) { ctx.toast("Responde todas las preguntas."); return; }
      st.done = true; st.reveal = true; let good = 0;
      sc.qs.forEach((q, i) => {
        const wrap = qBox.children[i]; const ok = st.ans[i] === q.ok; if (ok) good++;
        for (const b of wrap.querySelector(".choices").children) { if (b.textContent === q.ok) b.classList.add("ok"); else if (b.classList.contains("sel")) b.classList.add("bad"); }
        const w = wrap.querySelector(".why"); w.hidden = false; w.className = "why " + (ok ? "ok" : "bad"); w.textContent = q.why;
      });
      const all = good === sc.qs.length;
      fb.append(h("p", { class: all ? "fb-ok" : "fb-bad" }, all ? "Situación resuelta sin fallos." : `${good} de ${sc.qs.length}. La racha vuelve a cero.`));
      if (good) ctx.award(Math.min(20, good * 5), "Situación RIPA");
      if (all) {
        st.streak++; if (st.streak > st.best) { st.best = st.streak; store.set("best", st.best); }
        if (st.streak >= 10 && !store.get("badge", false)) { store.set("badge", true); ctx.badge("quien-maniobra"); ctx.award(40, "10 situaciones RIPA seguidas"); ctx.toast("Insignia «¿Quién maniobra?»: 10 situaciones seguidas sin fallo."); }
      } else st.streak = 0;
      paintStreak(); checkBtn.hidden = true; nextBtn.hidden = false; nextBtn.focus({ preventScroll: true });
    }

    // lienzo
    let W = 0, H = 0, dpr = 1;
    function resize() { const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = Math.max(10, r.width); H = Math.max(10, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); draw(); }
    function draw() { if (!st.sc || !W) return; const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); drawScene(c, W, H, st.sc, st.t, { reveal: st.reveal, bearing: st.bearing }); }
    const ro = new ResizeObserver(resize); ro.observe(stage);
    let visible = true, raf = 0, last = performance.now();
    const io = new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }); io.observe(root);
    function loop(now) {
      raf = 0; if (!visible || document.hidden) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!reduce) { st.t += dt; if (st.t > T * 0.86) st.t = 0; }
      draw(); raf = requestAnimationFrame(loop);
    }
    const onVis = () => { if (!document.hidden && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    document.addEventListener("visibilitychange", onVis);
    const unTheme = ctx.onTheme ? ctx.onTheme(() => draw()) : null;

    paintStreak(); next(); raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); raf = 0; visible = false; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); unTheme && unTheme(); root.remove(); };
  },
};
