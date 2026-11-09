// Hombre al agua — maniobras cenitales (Anderson, Boutakow/Williamson, Scharnow, vela), búsquedas y quiz.
const ID = "hombre-agua";

const CSS = `
.m-hombre-agua { display:flex; flex-direction:column; gap:1rem; }
.m-hombre-agua .m-ha-tabs { width:100%; }
.m-hombre-agua .m-ha-tabs button { flex:1 1 auto; }
.m-hombre-agua .m-ha-stage { aspect-ratio: 4 / 3; max-height: 520px; touch-action: none; }
.m-hombre-agua .m-ha-read { display:grid; grid-template-columns: repeat(auto-fit, minmax(min(100%,130px),1fr)); gap:.5rem; }
.m-hombre-agua .m-ha-read div { background:var(--sheet); border:1px solid var(--line); border-radius:var(--r-sm); padding:.35rem .55rem; min-width:0; }
.m-hombre-agua .m-ha-read b { display:block; font-family:var(--f-mono); font-size:1.02rem; font-weight:600; overflow-wrap:anywhere; }
.m-hombre-agua .m-ha-phase { border-left:4px solid var(--accent); padding:.55rem .8rem; background:var(--sea); border-radius:0 var(--r-sm) var(--r-sm) 0; min-height:3.2em; }
.m-hombre-agua .m-ha-phase .eyebrow { margin-bottom:.15rem; }
.m-hombre-agua .m-ha-steps { margin:0; padding-left:1.25rem; display:flex; flex-direction:column; gap:.2rem; }
.m-hombre-agua .m-ha-steps li { color:var(--muted); }
.m-hombre-agua .m-ha-steps li.on { color:var(--ink); font-weight:600; }
.m-hombre-agua .m-ha-steps li.done { color:var(--ink); }
.m-hombre-agua .m-ha-ctrl { gap:.5rem; }
.m-hombre-agua .m-ha-ctrl input[type=range] { flex:1 1 160px; min-width:120px; }
.m-hombre-agua .m-ha-proto ol, .m-hombre-agua .m-ha-proto ul { margin:.3rem 0 0; padding-left:1.25rem; display:flex; flex-direction:column; gap:.35rem; }
.m-hombre-agua .m-ha-no li::marker { color:var(--bad); }
.m-hombre-agua .m-ha-opts { display:flex; flex-direction:column; gap:.5rem; }
.m-hombre-agua .m-ha-opts button { justify-content:flex-start; text-align:left; font-weight:500; white-space:normal; height:auto; padding:.6em .9em; }
.m-hombre-agua .m-ha-opts button.ok { border-color:var(--ok); color:var(--ok); font-weight:700; }
.m-hombre-agua .m-ha-opts button.bad { border-color:var(--bad); color:var(--bad); }
.m-hombre-agua .m-ha-why { border-left:4px solid var(--line); padding:.4rem .8rem; }
.m-hombre-agua .m-ha-bar { height:6px; background:var(--sea-2); border-radius:3px; overflow:hidden; }
.m-hombre-agua .m-ha-bar i { display:block; height:100%; background:var(--accent); width:0; transition:width .3s; }
.m-hombre-agua [hidden] { display:none !important; }
`;

/* ---------- utilidades ---------- */
const D2R = Math.PI / 180;
const norm360 = (a) => ((a % 360) + 360) % 360;
const norm180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
const dirv = (h) => [Math.sin(h * D2R), Math.cos(h * D2R)];
const hdg = (dx, dy) => norm360(Math.atan2(dx, dy) / D2R);
const fmtH = (h) => String(Math.round(norm360(h)) % 360).padStart(3, "0") + "°";
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sideName = (s) => (s > 0 ? "estribor" : "babor");

/* ---------- maniobras a motor (simulación física simple) ---------- */
const MOTOR = {
  anderson: {
    name: "Anderson (270°)",
    when: "Se ha visto caer al náufrago. Rápida: ideal para embarcaciones de motor ágiles.",
    phases: [
      { t: "Timón a la banda de caída: la popa (y la hélice) se aparta del náufrago. Máquina en punto muerto un instante.", helm: 1, v: 2.6, eng: "Punto muerto", until: (s) => s.cum >= 25 },
      { t: "Máquina avante con todo el timón a la banda de caída, sin perderlo de vista.", helm: 1, v: 5, eng: "Avante", until: (s) => s.cum >= 250 },
      { t: "Al haber caído 250°: timón a la vía y máquina parada. La inercia completa la caída hasta unos 270°.", helm: 0.55, v: 2.2, eng: "Parada", until: (s) => s.cum >= 270 },
      { t: "El náufrago aparece por la proa: aproximación lenta, se le deja por el costado de sotavento (le damos socaire).", pursuit: true, v: 1.6, eng: "Avante poca", until: (s, d) => d < 9 },
    ],
  },
  boutakow: {
    name: "Boutakow (70°)",
    when: "Se ha visto caer al náufrago. Devuelve el barco a su propia estela con rumbo opuesto.",
    fall: 70,
    phases: null,
  },
  williamson: {
    name: "Williamson (60°)",
    when: "Igual que Boutakow pero cambiando el timón al haber caído 60°.",
    fall: 60,
    phases: null,
  },
  scharnow: {
    name: "Scharnow (240°)",
    when: "No se ha visto caer: se le echa en falta al cabo de un rato. Lleva rápido al rumbo opuesto sobre la propia estela.",
    phases: [
      { t: "Se echa en falta a un tripulante: MOB en el GNSS (marca dónde estamos ahora, no dónde cayó). Timón a una banda.", helm: 1, v: 5, eng: "Avante", until: (s) => s.cum >= 240 },
      { t: "Caídos 240° respecto al rumbo inicial: todo el timón a la banda opuesta.", helm: -1, v: 5, eng: "Avante", until: (s) => s.cum <= 200 },
      { t: "Faltan 20° para el rumbo opuesto: timón a la vía y máquina parada; se llega al rumbo opuesto por inercia.", helm: -0.5, v: 3, eng: "Parada", until: (s) => s.cum <= 180 },
      { t: "Rumbo opuesto sobre la propia estela: se navega desandando el camino con vigías en proa.", helm: 0, v: 4, eng: "Avante", until: (s, d) => d < 45 },
      { t: "Náufrago a la vista: aproximación lenta, dejándolo a sotavento.", pursuit: true, v: 1.6, eng: "Avante poca", until: (s, d) => d < 9 },
    ],
  },
};
for (const k of ["boutakow", "williamson"]) {
  const f = MOTOR[k].fall;
  MOTOR[k].phases = [
    { t: `Todo el timón a la banda de caída (la hélice se aparta del náufrago) hasta que la proa haya caído ${f}°.`, helm: 1, v: 5, eng: "Avante", until: (s) => s.cum >= f },
    { t: `Caídos ${f}°: todo el timón a la banda contraria, describiendo un círculo hasta navegar al rumbo opuesto al inicial.`, helm: -1, v: 5, eng: "Avante", until: (s) => s.cum <= -178 },
    { t: "Rumbo opuesto al inicial sobre la propia estela: el náufrago aparecerá por la proa.", helm: 0, v: 4, eng: "Avante", until: (s, d) => d < 40 },
    { t: "Aproximación lenta, se para la máquina antes de llegar y se le recoge por el costado de sotavento.", pursuit: true, v: 1.6, eng: "Avante poca", until: (s, d) => d < 9 },
  ];
}

function simMotor(key, side) {
  const M = MOTOR[key], R = 35, dt = 0.05;
  const st = { x: 0, y: 0, h: 0, v: key === "anderson" ? 4.5 : 5, rate: 0, cum: 0 };
  const cas = key === "scharnow" ? { x: side * 2, y: -170 } : { x: side * 3, y: -3 };
  const mob = { x: 0, y: 0 };
  const out = [];
  let ph = 0, t = 0;
  while (ph < M.phases.length && t < 260) {
    const P = M.phases[ph];
    const d = Math.hypot(cas.x - st.x, cas.y - st.y);
    if (P.until(st, d)) { ph++; continue; }
    const maxRate = (Math.max(st.v, 3) / R) / D2R; // °/s
    let target;
    if (P.pursuit) {
      const diff = norm180(hdg(cas.x - st.x, cas.y - st.y) - st.h);
      target = Math.max(-maxRate, Math.min(maxRate, diff * 0.9));
    } else target = P.helm * side * maxRate;
    st.rate += (target - st.rate) * Math.min(1, dt * 2.5);
    st.v += (P.v - st.v) * Math.min(1, dt * 0.7);
    st.h += st.rate * dt;
    st.cum += st.rate * dt * side;
    const [dx, dy] = dirv(st.h);
    st.x += dx * st.v * dt; st.y += dy * st.v * dt;
    t += dt;
    out.push({ x: st.x, y: st.y, h: st.h, t, cum: st.cum, ph, v: st.v, helm: P.pursuit ? Math.sign(Math.round(st.rate)) : Math.sign(P.helm) * side });
  }
  return { kind: "motor", key, side, pts: out, cas, mob, T: t, phases: M.phases.map((p) => p.t), eng: M.phases.map((p) => p.eng), rate: 4 };
}

/* ---------- maniobras a vela (trayectoria guionizada, viento del N) ---------- */
const SAIL = {
  traves: {
    name: "Través, virada y ceñida",
    when: "Método clásico: alejarse a un través, virar por avante y volver pasando a sotavento.",
    phases: [
      "¡Hombre al agua! Gritar, señalar, lanzar el aro y pulsar MOB. Seguir a un través unas 4–6 esloras para tener espacio.",
      "Virar por avante: la proa pasa por el viento.",
      "Arribar a un largo y bajar hasta quedar a sotavento del náufrago.",
      "Orzar a rumbo de ceñida y acercarse despacio largando escotas: las velas flamean, el barco se para y el náufrago queda por el costado de sotavento (le damos socaire).",
    ],
    K: 6,
    wp: [[0, 0, 4, 0], [5, 0, 4, 0], [11.25, 0, 4, 0], [14.5, 0.5, 3.6, 1], [16.5, 2.25, 2.6, 1], [16, 4.25, 2.6, 1], [13.5, 4.75, 3.6, 2], [9, 2, 4, 2], [4.5, -3, 4, 2], [2, -5.5, 3, 3], [1.5, -3, 1.8, 3]],
  },
  quick: {
    name: "Parada rápida (trasluchada)",
    when: "Quick-stop: se para el barco cerca del náufrago enseguida; útil con poca tripulación.",
    phases: [
      "¡Hombre al agua! Aro y MOB. Orzar en el acto hasta proa al viento: el barco pierde arrancada cerca del náufrago.",
      "Virar sin largar la escota del foque (queda a la contra): el barco casi se detiene.",
      "Arribar hasta el viento en popa, pasando a sotavento del náufrago.",
      "Trasluchar: la popa pasa por el viento (cuidado con la botavara).",
      "Orzar a ceñida y aproximarse con escotas largadas: el barco se para con el náufrago a sotavento.",
    ],
    K: 10,
    wp: [[0, 0, 4, 0], [2, 0.25, 3.6, 0], [3.5, 1.5, 2.6, 0], [3.5, 3.25, 2, 1], [2, 4, 2, 1], [-0.5, 3, 3, 2], [-3.5, 0.6, 3.6, 2], [-4.5, -3.75, 3.4, 3], [-4.1, -6.25, 3, 3], [-2.9, -7, 3, 3], [-2.4, -5, 2.6, 4], [-1.9, -2.5, 1.8, 4]],
  },
};

function catmull(P, n) {
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y), v: p1.v + (p2.v - p1.v) * t, ph: p1.ph });
    }
  }
  const L = P[P.length - 1]; out.push({ x: L.x, y: L.y, v: L.v, ph: L.ph });
  return out;
}

function simSail(key) {
  const S = SAIL[key], K = S.K; // escala: unidades -> metros
  const cas = { x: 0, y: 0 };
  const W = S.wp.map(([x, y, v, ph]) => ({ x: x * K, y: y * K, v, ph }));
  // punto final: náufrago por el costado de sotavento a 4,5 m
  const prev = W[W.length - 1];
  let E = { x: 0, y: 0 };
  for (let i = 0; i < 4; i++) {
    const h = hdg(E.x - prev.x, E.y - prev.y);
    const rw = norm180(0 - h); // viento del N: >0 entra por estribor
    const lee = rw > 0 ? -1 : 1; // -1 babor, +1 estribor
    const [dx, dy] = dirv(h + 90 * lee);
    E = { x: cas.x - dx * 4.5, y: cas.y - dy * 4.5 };
  }
  W.push({ x: E.x, y: E.y, v: 0.35, ph: prev.ph });
  const raw = catmull(W, 24);
  const pts = []; let t = 0;
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i], b = raw[Math.min(i + 1, raw.length - 1)], c = raw[Math.max(i - 1, 0)];
    const h = hdg(b.x - c.x, b.y - c.y);
    if (i > 0) t += Math.hypot(a.x - raw[i - 1].x, a.y - raw[i - 1].y) / Math.max(0.4, (a.v + raw[i - 1].v) / 2);
    pts.push({ x: a.x, y: a.y, h, t, ph: a.ph, v: a.v });
  }
  return { kind: "sail", key, side: 1, pts, cas, mob: { x: 0, y: 0 }, T: t, phases: S.phases, rate: 4 };
}

/* ---------- búsquedas ---------- */
function simSearch(key) {
  const legs = [];
  if (key === "square") {
    const L = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
    L.forEach((l, i) => legs.push({ h: i * 90, l }));
  } else {
    for (let s = 0; s < 3; s++) for (let k = 0; k < 3; k++) legs.push({ h: s * 30 + k * 120, l: 3 });
  }
  const pts = []; let x = 0, y = 0, t = 0; const corners = [{ x, y }];
  legs.forEach((g, i) => {
    const [dx, dy] = dirv(g.h); const n = Math.max(8, g.l * 10);
    for (let k = 1; k <= n; k++) {
      const nx = x + dx * g.l * k / n, ny = y + dy * g.l * k / n;
      t += g.l / n;
      pts.push({ x: nx, y: ny, h: g.h, t, ph: i, leg: i });
    }
    x += dx * g.l; y += dy * g.l; corners.push({ x, y });
  });
  const phases = key === "square"
    ? legs.map((g, i) => `Tramo ${i + 1}: ${g.l} × S al ${fmtH(g.h)}. Al acabar, caída de 90° a estribor. La longitud aumenta cada dos tramos.`)
    : legs.map((g, i) => {
        const k = i % 3;
        const tail = k === 0 ? "Sale del datum." : k === 1 ? "Tras caer 120° a estribor." : "Tras otros 120° a estribor, vuelve al datum.";
        const next = k === 2 && i < legs.length - 1 ? " En el datum se cae 150° a estribor (el triángulo gira 30°) y se explora otro sector." : "";
        return `Sector ${Math.floor(i / 3) + 1}, tramo ${k + 1} al ${fmtH(g.h)}. ${tail}${next}`;
      });
  return { kind: "search", key, pts, corners, cas: null, mob: { x: 0, y: 0 }, T: t, phases, rate: key === "square" ? 2.2 : 2.6 };
}

/* ---------- quiz ---------- */
const BANK = [
  { q: "La maniobra de Boutakow consiste en:", o: ["Caer 70° hacia la banda donde cayó el náufrago y entonces meter el timón a la banda contraria hasta navegar a rumbo opuesto al inicial.", "Caer 70° hacia la banda opuesta a la del náufrago y luego timón a la contraria hasta el rumbo opuesto.", "Timón a la banda del náufrago hasta caer 270° y mantenerse a rumbo.", "Dar atrás sin mover el timón hasta volver al punto de caída."], a: 0, w: "Boutakow: 70° a la banda de caída y después todo a la banda contraria hasta el rumbo opuesto. El náufrago aparece por la proa." },
  { q: "Vemos caer a un hombre al agua por estribor. ¿Qué es lo más recomendable?", o: ["Ciar inmediatamente.", "Maniobrar hacia estribor.", "Maniobrar hacia babor.", "Depende de la dirección del viento."], a: 1, w: "Siempre timón a la banda de caída: la popa, y con ella la hélice, se aparta del náufrago. Ciar lo acercaría a la hélice." },
  { q: "¿Cuál es una maniobra recomendada de búsqueda cuando NO se ve al náufrago?", o: ["Desde el datum, tramos iguales cayendo 120° a estribor tras cada tramo hasta volver al origen; allí caer 150° a estribor y repetir.", "Timón a la banda de caída hasta caer 70° y luego a la otra banda.", "Timón a la banda de caída y girar 270°.", "Timón a la banda contraria hasta rumbo opuesto."], a: 0, w: "Es la búsqueda por sectores (triángulos de 120° que giran 30° en cada pasada). Anderson y Boutakow son para cuando sí se le ve." },
  { q: "¿Cuál NO es recomendable tras ver caer a un náufrago?", o: ["Meter el timón inmediatamente a la banda contraria a la de caída para iniciar Anderson o Boutakow.", "Detener la máquina o ponerla en punto muerto.", "Hacer una llamada de emergencia.", "Pulsar «Distress» de la LSD si lo perdemos de vista."], a: 0, w: "Ambas maniobras empiezan metiendo el timón a la banda de caída; a la contraria la popa barrería al náufrago con la hélice." },
  { q: "En situación de hombre al agua, ¿qué NO se recomienda?", o: ["Lanzar ayudas (aro, objetos flotantes).", "Usar el GNSS (botón MOB).", "Activar la bocina de niebla para llamar la atención del náufrago.", "Maniobras de búsqueda si no se le ve."], a: 2, w: "La bocina no ayuda a recuperarlo; lo útil es lanzar ayudas, marcar la posición con el MOB y maniobrar." },
  { q: "Tras la caída accidental de una persona al agua, ¿qué recomendación debemos seguir?", o: ["Librar al náufrago de la hélice, no perderle de vista y lanzarle ayudas.", "Librarlo de la hélice, parar el motor y saltar al agua a por él.", "Dar atrás y acercarse por la popa.", "Saltar al agua para evitar que se ahogue."], a: 0, w: "Nadie salta al agua (serían dos náufragos). Hélice libre, un tripulante señalándolo y ayudas al agua." },
  { q: "¿Cuál es una medida de PREVENCIÓN para evitar el hombre al agua?", o: ["Llevar puesto el chaleco salvavidas.", "Realizar la maniobra de Boutakow.", "Utilizar un arnés de seguridad.", "Instruir en el lanzamiento de ayudas."], a: 2, w: "El arnés (amarrado a una línea de vida) evita la caída. El chaleco no la evita: ayuda a sobrevivir una vez en el agua." },
  { q: "Receptores GNSS y hombre al agua: es INCORRECTO que…", o: ["Obtienen la posición de una o varias constelaciones de satélites.", "Las alertas LSD/DSC incluyen la posición dada por el GNSS.", "Deba apagarse el receptor para que quede grabada su última posición.", "Si el GNSS no da posición al equipo LSD, se introducirá a mano al menos cada hora."], a: 2, w: "Nunca se apaga: se pulsa MOB y el receptor da rumbo y distancia al punto. Sin posición automática, se mete a mano al menos cada hora." },
  { q: "Cae al agua un pasajero. ¿Qué NO es aconsejable?", o: ["Saltar al agua en su búsqueda sin dar la voz de alarma.", "Gritar «¡Hombre al agua!».", "Lanzar aros salvavidas.", "De noche, lanzar un cohete con paracaídas para iluminar el lugar."], a: 0, w: "La primera acción es dar la voz de alarma. De noche el cohete con paracaídas ilumina la zona y es válido." },
  { q: "Para iniciar una maniobra de Boutakow:", o: ["Caiga momentáneamente 70° a la banda de la caída al agua.", "Caiga 70° a la banda contraria.", "Caiga 180° a la banda de la caída.", "Dé marcha atrás sin mover el timón."], a: 0, w: "Primero 70° hacia la banda del náufrago; después todo el timón a la otra banda." },
  { q: "La maniobra de Anderson (evolución simple):", o: ["Timón a la banda de caída hasta caer 250°, entonces timón a la vía y máquina parada; la inercia lleva a los 270° con el náufrago por la proa.", "Timón a la banda contraria hasta caer 240° y luego a la otra banda.", "Caer 60° y luego timón a la otra banda.", "Ciar hasta el punto de caída."], a: 0, w: "Anderson: giro continuo de unos 270° hacia la banda de caída (a 250° se para y el barco sigue cayendo por inercia)." },
  { q: "La maniobra de Williamson se diferencia de la de Boutakow en que:", o: ["Se cambia el timón al haber caído 60° en vez de 70°.", "Se mete el timón a la banda contraria a la caída.", "Se gira 270° sin cambiar el timón.", "Se usa solo a vela."], a: 0, w: "Es la misma maniobra; Williamson cambia el timón a 60°, Boutakow a 70°." },
  { q: "¿Por qué costado se recoge al náufrago?", o: ["Por sotavento: el barco queda a barlovento del náufrago y le da socaire.", "Por barlovento, para que el viento lo empuje hacia el barco.", "Por la popa, junto a la hélice.", "Por la proa, con arrancada."], a: 0, w: "El barco a barlovento le hace socaire (abrigo) y no le cae encima con el abatimiento violento. Se le lanza aro con rabiza y se usa una escala." },
  { q: "¿Cuándo es más apropiada la maniobra de Scharnow?", o: ["Cuando no se ha visto caer al náufrago y se le echa en falta: devuelve el barco al rumbo opuesto sobre su propia estela.", "Siempre que se vea caer, por ser la más rápida.", "Solo en veleros con viento en popa.", "Para fondear junto al náufrago."], a: 0, w: "Scharnow: 240° a una banda, después a la contraria hasta faltar 20° para el rumbo opuesto. Cuando sí se ve caer, se usa Anderson o Boutakow con timón a la banda de caída." },
  { q: "En la búsqueda en cuadrado expansivo (espiral cuadrada):", o: ["Se parte del datum con caídas de 90° y tramos que aumentan una separación S cada dos tramos.", "Se hacen triángulos de 120° que pasan siempre por el datum.", "Se navega en línea recta hasta el horizonte.", "Se gira 270° a la banda de caída."], a: 0, w: "Tramos 1S, 1S, 2S, 2S, 3S, 3S… con caídas de 90° (generalmente a estribor). S = anchura de la calle de barrido." },
  { q: "En los aros salvavidas, es INCORRECTO que:", o: ["Son elementos de seguridad para hombre al agua.", "Si se pierde uno se puede reponer con el de otra embarcación.", "Deben ir en las bandas o en la popa, listos para lanzar.", "Llevan el nombre de la embarcación."], a: 1, w: "Llevan el nombre del barco (identifican de dónde procede si aparece a la deriva), así que no vale el de otra embarcación." },
  { q: "En el agua, con chaleco y sin balsa, para retrasar la hipotermia conviene:", o: ["Quedarse lo más quieto posible en posición fetal.", "Nadar rápido para entrar en calor.", "Hacer movimientos bruscos.", "Respirar más deprisa."], a: 0, w: "Nadar o moverse acelera la pérdida de calor. Postura fetal (HELP) o en grupo abrazados." },
  { q: "Ya a bordo y con hipotermia, ¿qué NO se debe hacer?", o: ["Abrigarle a resguardo del viento.", "Trasladarle en posición horizontal.", "Dejarle la ropa mojada puesta y frotarle enérgicamente.", "Calentar primero el tronco."], a: 2, w: "Se retira la ropa mojada, se abriga y se calienta el tronco. No se frota: puede provocar arritmias. Hipotermia: temperatura central < 35 °C." },
];

function sideQuestion() {
  const s = Math.random() < 0.5 ? 1 : -1;
  const sn = sideName(s), so = sideName(-s);
  return { q: `Un tripulante cae al agua por ${sn} y lo has visto caer. ¿A qué banda metes el timón para iniciar Anderson o Boutakow?`, o: [`A ${sn}.`, `A ${so}.`, "A la vía y ciar.", "Al lado de donde venga el viento."], a: 0, w: `A ${sn} (banda de caída): la proa cae hacia el náufrago y la popa con la hélice se separa de él.` };
}

/* ---------- módulo ---------- */
export default {
  id: ID,
  tema: 3,
  title: "Hombre al agua: maniobras y búsqueda",
  icon: "⊕",
  desc: "Mira desde arriba Anderson, Boutakow, Williamson, Scharnow y la recogida a vela, las búsquedas y el protocolo, y ponte a prueba.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const st = document.createElement("style"); st.dataset.mod = ID; st.textContent = CSS; document.head.appendChild(st);
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.createElement("div");
    root.className = "m-hombre-agua";
    root.innerHTML = `
      <div class="seg m-ha-tabs" role="tablist">
        <button data-tab="motor" aria-pressed="true">Motor</button>
        <button data-tab="sail" aria-pressed="false">Vela</button>
        <button data-tab="search" aria-pressed="false">Búsqueda</button>
        <button data-tab="proto" aria-pressed="false">Protocolo</button>
        <button data-tab="quiz" aria-pressed="false">Reto</button>
      </div>
      <section class="stack m-ha-sim">
        <div class="row">
          <div class="seg m-ha-pick" aria-label="Maniobra"></div>
          <div class="seg m-ha-side" aria-label="Banda de caída">
            <button data-side="-1" aria-pressed="false">Cae por babor</button>
            <button data-side="1" aria-pressed="true">Cae por estribor</button>
          </div>
        </div>
        <p class="small muted m-ha-when"></p>
        <div class="stage m-ha-stage"><canvas aria-label="Vista cenital de la maniobra"></canvas></div>
        <div class="row m-ha-ctrl">
          <button class="btn primary sm m-ha-play">Reproducir</button>
          <button class="btn sm m-ha-reset">Reiniciar</button>
          <div class="seg m-ha-speed" aria-label="Velocidad">
            <button data-sp="0.5" aria-pressed="false">×0,5</button>
            <button data-sp="1" aria-pressed="true">×1</button>
            <button data-sp="2" aria-pressed="false">×2</button>
          </div>
          <input type="range" class="m-ha-scrub" min="0" max="1000" value="0" aria-label="Posición en la maniobra">
        </div>
        <div class="m-ha-read"></div>
        <div class="m-ha-phase"><div class="eyebrow">Paso</div><p class="m-ha-ptxt"></p></div>
        <details class="panel"><summary class="eyebrow" style="cursor:pointer">Todos los pasos</summary><ol class="m-ha-steps" style="margin-top:.6rem"></ol></details>
      </section>
      <section class="stack m-ha-proto" hidden></section>
      <section class="stack m-ha-quiz" hidden></section>
    `;
    el.appendChild(root);
    const $ = (s) => root.querySelector(s);
    const canvas = $("canvas"), g = canvas.getContext("2d"), stage = $(".m-ha-stage");

    let tab = "motor", motorKey = "anderson", sailKey = "traves", searchKey = "square", side = 1, speed = 1;
    let sim = null, tPlay = 0, playing = false, visible = true, raf = 0, last = 0, cw = 0, chh = 0, dpr = 1, col = {};

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      for (const k of ["sea", "sea-2", "sheet", "ink", "muted", "line", "accent", "port", "stbd", "bad", "buoy-y", "paper", "ok"]) col[k] = cs.getPropertyValue("--" + k).trim() || "#888";
      col.mono = cs.getPropertyValue("--f-mono").trim() || "monospace";
    };
    readColors();

    /* --- tabs --- */
    const pick = $(".m-ha-pick");
    function buildPick() {
      const src = tab === "motor" ? MOTOR : tab === "sail" ? SAIL : { square: { name: "Cuadrado expansivo" }, sector: { name: "Por sectores" } };
      const cur = tab === "motor" ? motorKey : tab === "sail" ? sailKey : searchKey;
      pick.innerHTML = Object.entries(src).map(([k, v]) => `<button data-k="${k}" aria-pressed="${k === cur}">${v.name}</button>`).join("");
      $(".m-ha-side").hidden = tab !== "motor";
    }
    pick.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (tab === "motor") motorKey = b.dataset.k; else if (tab === "sail") sailKey = b.dataset.k; else searchKey = b.dataset.k;
      buildPick(); load();
    });
    $(".m-ha-side").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      side = +b.dataset.side;
      root.querySelectorAll(".m-ha-side button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      load();
    });
    $(".m-ha-speed").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      speed = +b.dataset.sp;
      root.querySelectorAll(".m-ha-speed button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    });
    root.querySelector(".m-ha-tabs").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      tab = b.dataset.tab;
      root.querySelectorAll(".m-ha-tabs button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      const isSim = tab === "motor" || tab === "sail" || tab === "search";
      $(".m-ha-sim").hidden = !isSim; $(".m-ha-proto").hidden = tab !== "proto"; $(".m-ha-quiz").hidden = tab !== "quiz";
      if (isSim) { buildPick(); load(); } else setPlaying(false);
      if (tab === "quiz" && !quiz.started) newRound();
    });

    function load() {
      sim = tab === "motor" ? simMotor(motorKey, side) : tab === "sail" ? simSail(sailKey) : simSearch(searchKey);
      const info = tab === "motor" ? MOTOR[motorKey].when : tab === "sail" ? SAIL[sailKey].when
        : searchKey === "square" ? "Cuando no se ve al náufrago y la posición es bastante fiable. Datum = punto de caída (MOB) corregido por la deriva. S = separación entre calles según visibilidad."
        : "Cuando la posición del náufrago es bastante precisa y la zona pequeña. Tramos iguales (en embarcaciones pequeñas, del orden de 1 milla o menos) que pasan siempre por el datum.";
      $(".m-ha-when").textContent = info;
      $(".m-ha-steps").innerHTML = sim.phases.map((p) => `<li>${p}</li>`).join("");
      computeView();
      tPlay = reduce ? sim.T : 0;
      setPlaying(!reduce && visible);
      lastPh = -1;
      render();
    }

    /* --- vista --- */
    let view = { s: 1, ox: 0, oy: 0 };
    function computeView() {
      if (!sim || !cw) return;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      const add = (p) => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); };
      sim.pts.forEach(add); add({ x: 0, y: 0 }); if (sim.cas) add(sim.cas);
      const pad = sim.kind === "search" ? 0.12 : 0.1;
      const bw = Math.max(x1 - x0, 1), bh = Math.max(y1 - y0, 1);
      const top = 34, bottom = 12, padPx = 18;
      const s = Math.min((cw - 2 * padPx) / (bw * (1 + 2 * pad)), (chh - top - bottom) / (bh * (1 + 2 * pad)));
      view = { s, ox: cw / 2 - ((x0 + x1) / 2) * s, oy: top + (chh - top - bottom) / 2 + ((y0 + y1) / 2) * s };
    }
    const X = (x) => view.ox + x * view.s, Y = (y) => view.oy - y * view.s;

    function sampleAt(t) {
      const P = sim.pts; if (!P.length) return null;
      let lo = 0, hi = P.length - 1;
      if (t <= P[0].t) return { i: 0, p: P[0] };
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].t < t) lo = m; else hi = m; }
      return { i: hi, p: P[hi] };
    }

    function drawBoat(p, sail) {
      const Lm = sim.kind === "search" ? 0 : 10;
      const L = Math.max(18, Lm * view.s), B = L * 0.36;
      g.save(); g.translate(X(p.x), Y(p.y)); g.rotate(p.h * D2R);
      g.beginPath();
      g.moveTo(0, -L / 2);
      g.bezierCurveTo(B * 0.6, -L * 0.25, B / 2, L * 0.2, B * 0.42, L / 2);
      g.lineTo(-B * 0.42, L / 2);
      g.bezierCurveTo(-B / 2, L * 0.2, -B * 0.6, -L * 0.25, 0, -L / 2);
      g.fillStyle = col.sheet; g.strokeStyle = col.ink; g.lineWidth = 1.6; g.fill(); g.stroke();
      // luces de costado como referencia de banda
      g.fillStyle = "#d42b2b"; g.beginPath(); g.arc(-B * 0.32, -L * 0.12, 2.2, 0, 7); g.fill();
      g.fillStyle = "#1a9c4a"; g.beginPath(); g.arc(B * 0.32, -L * 0.12, 2.2, 0, 7); g.fill();
      if (sail) {
        const rw = norm180(0 - p.h); // viento del N
        const lee = rw > 0 ? -1 : 1;
        const ar = Math.abs(rw);
        const mastY = -L * 0.12;
        g.fillStyle = col.ink; g.beginPath(); g.arc(0, mastY, 2, 0, 7); g.fill();
        g.strokeStyle = col.accent; g.lineWidth = 2.4; g.beginPath();
        const boomL = L * 0.55;
        if (ar < 42) {
          // velas flameando
          const tt = performance.now() / 120;
          g.moveTo(0, mastY);
          for (let k = 1; k <= 8; k++) g.lineTo(Math.sin(tt + k) * 2.2, mastY + boomL * k / 8);
        } else {
          const ang = Math.min(85, Math.max(10, (ar - 40) * 0.62 + 10));
          const a = lee * ang * D2R;
          g.moveTo(0, mastY); g.lineTo(Math.sin(a) * boomL, mastY + Math.cos(a) * boomL);
        }
        g.stroke();
      } else if (sim.kind === "motor") {
        // estela de hélice / timón
        g.strokeStyle = col.muted; g.lineWidth = 2; g.beginPath(); g.moveTo(0, L / 2); g.lineTo(-(p.helm || 0) * L * 0.18, L / 2 + L * 0.12); g.stroke();
      }
      g.restore();
    }

    function arrow(x, y, h, len, color, lw = 2) {
      const [dx, dy] = dirv(h);
      const x2 = x + dx * len, y2 = y - dy * len;
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      const a = Math.atan2(y2 - y, x2 - x);
      g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 8 * Math.cos(a - 0.45), y2 - 8 * Math.sin(a - 0.45)); g.lineTo(x2 - 8 * Math.cos(a + 0.45), y2 - 8 * Math.sin(a + 0.45)); g.closePath(); g.fill();
    }

    function render() {
      if (!cw || !sim) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = col.sea; g.fillRect(0, 0, cw, chh);
      // retícula
      const step = sim.kind === "search" ? 1 : 25;
      g.strokeStyle = col.line; g.lineWidth = 1; g.globalAlpha = 0.6; g.beginPath();
      const gx0 = Math.floor((0 - view.ox) / view.s / step) * step, gx1 = (cw - view.ox) / view.s;
      for (let x = gx0; x <= gx1; x += step) { g.moveTo(X(x), 0); g.lineTo(X(x), chh); }
      const gy0 = Math.floor(((view.oy - chh) / view.s) / step) * step, gy1 = view.oy / view.s;
      for (let y = gy0; y <= gy1; y += step) { g.moveTo(0, Y(y)); g.lineTo(cw, Y(y)); }
      g.stroke(); g.globalAlpha = 1;
      g.font = `600 11px ${col.mono}`;
      g.fillStyle = col.muted; g.textBaseline = "top";
      g.fillText(sim.kind === "search" ? "cuadrícula = S" : "cuadrícula 25 m", 8, 8);

      // viento y norte
      g.textAlign = "right";
      g.fillStyle = col.ink; g.fillText("N", cw - 14, 5);
      arrow(cw - 18, 32, 0, 14, col.ink, 1.5);
      if (sim.kind !== "search") {
        g.fillStyle = col.muted; g.fillText("Viento N", cw - 32, 8);
        arrow(cw - 60, 22, 180, 14, col.muted, 2);
      }
      g.textAlign = "left";

      const cur = sampleAt(tPlay); if (!cur) return;
      const P = sim.pts;

      // ruta prevista
      g.setLineDash([4, 5]); g.strokeStyle = col.muted; g.globalAlpha = 0.55; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(X(sim.kind === "search" ? 0 : P[0].x), Y(sim.kind === "search" ? 0 : P[0].y));
      for (let i = 0; i < P.length; i += 2) g.lineTo(X(P[i].x), Y(P[i].y));
      g.stroke(); g.setLineDash([]); g.globalAlpha = 1;

      // estela recorrida
      if (sim.kind === "search") {
        g.strokeStyle = col["sea-2"]; g.lineWidth = Math.max(6, view.s * 0.9); g.lineCap = "round"; g.lineJoin = "round";
        g.beginPath(); g.moveTo(X(0), Y(0)); for (let i = 0; i <= cur.i; i++) g.lineTo(X(P[i].x), Y(P[i].y)); g.stroke();
        g.strokeStyle = col.accent; g.lineWidth = 2;
        g.beginPath(); g.moveTo(X(0), Y(0)); for (let i = 0; i <= cur.i; i++) g.lineTo(X(P[i].x), Y(P[i].y)); g.stroke();
        // números de tramo
        g.fillStyle = col.ink; g.font = `600 11px system-ui, sans-serif`; g.textBaseline = "middle"; g.textAlign = "center";
        const C = sim.corners;
        for (let k = 0; k < C.length - 1; k++) {
          if (P[cur.i].leg < k) break;
          const mx = (C[k].x + C[k + 1].x) / 2, my = (C[k].y + C[k + 1].y) / 2;
          const h = hdg(C[k + 1].x - C[k].x, C[k + 1].y - C[k].y), [nx, ny] = dirv(h + 90);
          const off = sim.key === "sector" ? 0.35 : 0.3;
          g.fillText(String(k + 1), X(mx + nx * off), Y(my + ny * off));
        }
        g.textAlign = "left";
      } else {
        g.lineCap = "round"; g.lineJoin = "round";
        g.strokeStyle = col["sea-2"]; g.lineWidth = Math.max(5, 4 * view.s);
        g.beginPath(); g.moveTo(X(P[0].x), Y(P[0].y)); for (let i = 0; i <= cur.i; i++) g.lineTo(X(P[i].x), Y(P[i].y)); g.stroke();
        g.strokeStyle = col.muted; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(X(P[0].x), Y(P[0].y)); for (let i = 0; i <= cur.i; i++) g.lineTo(X(P[i].x), Y(P[i].y)); g.stroke();
      }

      // MOB / datum
      const mx = X(sim.mob.x), my = Y(sim.mob.y);
      g.strokeStyle = col.accent; g.lineWidth = 2;
      g.beginPath(); g.moveTo(mx - 7, my - 7); g.lineTo(mx + 7, my + 7); g.moveTo(mx + 7, my - 7); g.lineTo(mx - 7, my + 7); g.stroke();
      g.fillStyle = col.accent; g.font = `700 11px system-ui, sans-serif`; g.textBaseline = "bottom";
      g.fillText(sim.kind === "search" ? "DATUM" : "MOB", mx + 9, my - 4);

      // náufrago + aro
      if (sim.cas) {
        const cx = X(sim.cas.x), cy = Y(sim.cas.y);
        const ringT = sim.key === "scharnow" ? Infinity : 1.2;
        if (tPlay > ringT) {
          g.strokeStyle = "#f05a28"; g.lineWidth = 3; g.beginPath(); g.arc(cx + 9 * (sim.side || 1), cy + 6, 5, 0, 7); g.stroke();
        }
        const pulse = reduce ? 0 : (Math.sin(performance.now() / 300) + 1) * 2;
        g.fillStyle = col.bad; g.beginPath(); g.arc(cx, cy, 5 + pulse * 0.4, 0, 7); g.fill();
        g.strokeStyle = col.sheet; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = col.ink; g.font = `600 11px system-ui, sans-serif`; g.textBaseline = "top";
        g.fillText("náufrago", cx + 9, cy + 9);
      }

      drawBoat(cur.p, sim.kind === "sail");

      // indicador de caída (motor)
      if (sim.kind === "motor") {
        const r = 26, ox = 14 + r, oy = chh - 14 - r;
        g.fillStyle = col.sheet; g.globalAlpha = 0.85; g.beginPath(); g.arc(ox, oy, r + 6, 0, 7); g.fill(); g.globalAlpha = 1;
        g.strokeStyle = col.line; g.lineWidth = 1; g.beginPath(); g.arc(ox, oy, r, 0, 7); g.stroke();
        // arco de caída
        const c = cur.p.cum;
        g.strokeStyle = col.accent; g.lineWidth = 4;
        g.beginPath();
        const a0 = -Math.PI / 2, a1 = a0 + c * sim.side * D2R;
        g.arc(ox, oy, r - 3, Math.min(a0, a1), Math.max(a0, a1)); g.stroke();
        arrow(ox, oy, 0, r - 6, col.muted, 1);
        arrow(ox, oy, cur.p.h, r - 4, col.ink, 2);
        g.fillStyle = col.ink; g.font = `700 10px system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(`${Math.round(Math.abs(c))}°`, ox, oy + r * 0.45);
        g.textAlign = "left";
      }

      updateReadout(cur);
    }

    /* --- lecturas --- */
    let lastPh = -1;
    function updateReadout(cur) {
      const p = cur.p;
      const rd = $(".m-ha-read");
      let cells = [];
      if (sim.kind === "motor") {
        const c = p.cum;
        const towards = c >= 0 ? sideName(sim.side) : sideName(-sim.side);
        const helm = p.helm === 0 ? "a la vía" : `a ${sideName(p.helm)}`;
        cells = [["Rumbo (inicial 000°)", fmtH(p.h)], ["Caída", `${Math.round(Math.abs(c))}° a ${towards}`], ["Timón", helm], ["Máquina", MOTOR[sim.key].phases[p.ph].eng]];
      } else if (sim.kind === "sail") {
        const rw = norm180(0 - p.h), ar = Math.abs(rw);
        const rumbo = ar < 42 ? "proa al viento" : ar < 70 ? "ceñida" : ar < 110 ? "través" : ar < 160 ? "largo" : "popa";
        cells = [["Rumbo", fmtH(p.h)], ["Respecto al viento", rumbo], ["Amura", ar < 8 ? "—" : rw > 0 ? "estribor" : "babor"], ["Sotavento", ar < 8 ? "—" : rw > 0 ? "babor" : "estribor"]];
      } else {
        cells = [["Tramo", `${p.leg + 1} / ${sim.corners.length - 1}`], ["Rumbo", fmtH(p.h)], ["Recorrido", `${(p.t).toFixed(1)} S`]];
      }
      rd.innerHTML = cells.map(([k, v]) => `<div><span class="eyebrow">${k}</span><b>${v}</b></div>`).join("");
      if (p.ph !== lastPh || tPlay >= sim.T) {
        lastPh = p.ph;
        $(".m-ha-ptxt").textContent = sim.phases[p.ph] || "";
        root.querySelectorAll(".m-ha-steps li").forEach((li, i) => { li.className = i === p.ph ? "on" : i < p.ph ? "done" : ""; });
      }
      $(".m-ha-scrub").value = String(Math.round((tPlay / sim.T) * 1000));
    }

    /* --- bucle --- */
    function setPlaying(v) {
      playing = v && !!sim;
      $(".m-ha-play").textContent = playing ? "Pausa" : tPlay >= (sim ? sim.T : 0) ? "Repetir" : "Reproducir";
      kick();
    }
    function kick() { if (!raf && visible && (playing || (sim && sim.kind === "sail") || (sim && sim.cas && !reduce))) { last = performance.now(); raf = requestAnimationFrame(loop); } }
    function loop(now) {
      raf = 0;
      if (!visible || tab === "proto" || tab === "quiz") return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (playing) {
        tPlay += dt * speed * sim.rate;
        if (tPlay >= sim.T) { tPlay = sim.T; setPlaying(false); }
      }
      render();
      if (playing || !reduce) raf = requestAnimationFrame(loop);
    }
    $(".m-ha-play").addEventListener("click", () => {
      if (!playing && tPlay >= sim.T) { tPlay = 0; lastPh = -1; }
      setPlaying(!playing);
    });
    $(".m-ha-reset").addEventListener("click", () => { tPlay = 0; lastPh = -1; setPlaying(false); render(); });
    $(".m-ha-scrub").addEventListener("input", (e) => { setPlaying(false); tPlay = (+e.target.value / 1000) * sim.T; render(); });

    /* --- tamaño --- */
    const ro = new ResizeObserver(() => {
      const r = stage.getBoundingClientRect();
      dpr = Math.min(2.5, window.devicePixelRatio || 1);
      cw = Math.max(1, r.width); chh = Math.max(1, r.height);
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(chh * dpr);
      computeView(); render();
    });
    ro.observe(stage);
    const io = new IntersectionObserver((ents) => {
      visible = ents.some((e) => e.isIntersecting);
      if (visible) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(root);
    const offTheme = ctx.onTheme ? ctx.onTheme(() => { readColors(); render(); }) : null;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => { readColors(); render(); };
    mq.addEventListener("change", onMq);

    /* --- protocolo --- */
    $(".m-ha-proto").innerHTML = `
      <div class="grid">
        <div class="panel"><div class="eyebrow">Acción inmediata</div>
          <ol>
            <li><b>Gritar</b> «¡Hombre al agua por babor/estribor!» y <b>señalar</b>: un tripulante solo se dedica a no perderlo de vista.</li>
            <li><b>Timón a la banda de caída</b> para librarle de la hélice; máquina en punto muerto o parada si está cerca de la popa.</li>
            <li><b>Lanzar el aro salvavidas</b> (con luz y rabiza) y objetos flotantes; si hay, la baliza de hombre al agua.</li>
            <li><b>Pulsar MOB</b> en el GNSS / plotter / equipo LSD: guarda posición y hora como punto de recalada. <b>No apagar el GNSS.</b></li>
            <li><b>Maniobrar</b>: Anderson o Boutakow/Williamson si se le ve; Scharnow si se le echa en falta; búsqueda (cuadrado expansivo o sectores) desde el datum si no se le ve.</li>
            <li>Si no se le localiza enseguida o hay riesgo: <b>socorro</b> por LSD (botón «Distress», canal 70) y MAYDAY por voz en el <b>canal 16</b>; teléfono <b>900 202 202</b> o <b>112</b>.</li>
            <li>Si el equipo LSD no recibe posición del GNSS, <b>introducirla a mano al menos cada hora</b>.</li>
            <li>De noche: foco hacia el agua; una bengala o un <b>cohete con paracaídas</b> sirve para iluminar la zona.</li>
          </ol>
        </div>
        <div class="panel"><div class="eyebrow">Recogida</div>
          <ul>
            <li>Aproximación lenta; parar la máquina antes de tenerlo al costado.</li>
            <li>Barco a <b>barlovento</b> del náufrago: se le recoge por el costado de <b>sotavento</b> (le damos socaire).</li>
            <li>Aro con rabiza para acercarlo; escala o cabo con gaza para subirlo.</li>
            <li>Si está inconsciente, baja un tripulante <b>con chaleco y amarrado</b> con arnés o cabo.</li>
            <li>A bordo: trasladarlo en <b>horizontal</b>, quitar la ropa mojada, abrigar a resguardo del viento, calentar el tronco y <b>no frotar</b> (hipotermia: &lt; 35 °C).</li>
            <li>En el agua, mientras espera: quieto en <b>posición fetal</b> con el chaleco, sin nadar.</li>
          </ul>
        </div>
        <div class="panel"><div class="eyebrow">Prevención</div>
          <ul>
            <li><b>Arnés de seguridad</b> enganchado a una línea de vida (la medida preventiva por excelencia).</li>
            <li>Cubierta antideslizante, candeleros y guardamancebos firmes, calzado adecuado.</li>
            <li>Iluminación de cubierta que no deslumbre ni tape las luces de navegación.</li>
            <li>Chaleco puesto con mal tiempo y de noche (no evita la caída, pero salva en el agua).</li>
            <li>Aros en las bandas o en la popa, listos para lanzar, con el nombre del barco.</li>
          </ul>
        </div>
        <div class="panel"><div class="eyebrow">Nunca</div>
          <ul class="m-ha-no">
            <li>Saltar al agua a por él, y menos sin dar la voz de alarma.</li>
            <li>Meter el timón a la banda contraria a la de caída o ciar: la hélice va hacia él.</li>
            <li>Apagar el GNSS «para que guarde la posición».</li>
            <li>Perderlo de vista para hacer otras tareas.</li>
            <li>Usar la bocina de niebla como medio para recuperarlo.</li>
          </ul>
        </div>
      </div>
      <div class="tint small"><b>Cuál elegir.</b> Anderson: la más rápida, giro continuo de unos 270° (a 250°, timón a la vía y máquina parada). Boutakow (70°) y Williamson (60°): devuelven el barco a su estela con rumbo opuesto, útiles de noche o con poca visibilidad. Scharnow (240° y 20° antes del opuesto, timón al medio): cuando no se vio caer. En el examen, si se ha visto caer, el timón va <b>siempre a la banda de caída</b>.</div>
    `;

    /* --- quiz --- */
    const quiz = { started: false, items: [], i: 0, score: 0, answered: false };
    const qEl = $(".m-ha-quiz");
    function newRound() {
      quiz.started = true;
      quiz.items = shuffle([sideQuestion(), ...shuffle(BANK).slice(0, 7)]).map((it) => {
        const order = shuffle(it.o.map((_, k) => k));
        return { q: it.q, o: order.map((k) => it.o[k]), a: order.indexOf(it.a), w: it.w };
      });
      quiz.i = 0; quiz.score = 0; quiz.answered = false;
      showQ();
    }
    function showQ() {
      const n = quiz.items.length;
      if (quiz.i >= n) {
        const best = ctx.store ? ctx.store.get("best", 0) : 0;
        const pass = quiz.score >= 7;
        if (pass && quiz.score > best) ctx.award(30, "Reto hombre al agua superado");
        if (ctx.store && quiz.score > best) ctx.store.set("best", quiz.score);
        qEl.innerHTML = `<div class="panel stack">
          <div class="eyebrow">Resultado</div>
          <h3>${quiz.score} / ${n} ${pass ? '<span class="chip ok">Superado</span>' : '<span class="chip warn">Repasa</span>'}</h3>
          <p class="muted">${pass ? "Dominas el protocolo de hombre al agua." : "Necesitas 7 de 8. Revisa las animaciones y el protocolo."} Mejor marca: ${Math.max(best, quiz.score)} / ${n}.</p>
          <div class="row"><button class="btn primary m-ha-again">Otra ronda</button></div></div>`;
        qEl.querySelector(".m-ha-again").onclick = newRound;
        return;
      }
      const it = quiz.items[quiz.i];
      quiz.answered = false;
      qEl.innerHTML = `<div class="panel stack">
        <div class="row" style="justify-content:space-between"><span class="eyebrow">Pregunta ${quiz.i + 1} de ${n}</span><span class="chip">${quiz.score} aciertos</span></div>
        <div class="m-ha-bar"><i style="width:${(quiz.i / n) * 100}%"></i></div>
        <h4>${it.q}</h4>
        <div class="m-ha-opts">${it.o.map((o, k) => `<button class="btn" data-k="${k}">${"abcd"[k]}) ${o}</button>`).join("")}</div>
        <div class="m-ha-why" hidden></div>
        <div class="row"><button class="btn primary m-ha-next" hidden>Siguiente</button></div></div>`;
      qEl.querySelector(".m-ha-opts").addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b || quiz.answered) return;
        quiz.answered = true;
        const k = +b.dataset.k, ok = k === it.a;
        qEl.querySelectorAll(".m-ha-opts button").forEach((x, j) => { if (j === it.a) x.classList.add("ok"); else if (j === k) x.classList.add("bad"); x.disabled = j !== it.a && j !== k; });
        const why = qEl.querySelector(".m-ha-why");
        why.hidden = false;
        why.innerHTML = `<p class="${ok ? "fb-ok" : "fb-bad"}">${ok ? "Correcto." : "No."}</p><p>${it.w}</p>`;
        if (ok) { quiz.score++; ctx.award(5, "Hombre al agua"); }
        const nx = qEl.querySelector(".m-ha-next"); nx.hidden = false; nx.focus();
        nx.onclick = () => { quiz.i++; showQ(); };
      });
    }

    buildPick();
    load();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; playing = false;
      ro.disconnect(); io.disconnect();
      mq.removeEventListener("change", onMq);
      if (offTheme) offTheme();
      root.remove();
    };
  },
};
