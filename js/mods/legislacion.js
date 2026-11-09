// Tema 4 · Legislación — mapa de costa, calculadora de vertidos, títulos 2026, normas y reto final.
// Fuentes: RD 876/2014 art. 73 (Costas), RD 550/2020 art. 14 (buceo), RD 339/2021 arts. 22–23,
// MARPOL Anexos I, IV y V (reglas 3, 4, 6), RD 875/2014 arts. 8–11 + RD 1188/2025, RD 2335/1980,
// RD 607/1999, RD 1435/2010, SOLAS V/33, RD 1727/2007 y claves oficiales q_leg 2022–2026.

const ID = "legislacion";

const CSS = `
.m-legislacion{display:flex;flex-direction:column;gap:1rem}
.m-legislacion .m-tabs{max-width:100%}
.m-legislacion .m-tabs button{padding:.45em .75em}
.m-legislacion .m-map{aspect-ratio:600/380;max-height:70vh}
.m-legislacion .m-map svg{touch-action:manipulation;user-select:none}
.m-legislacion .z{cursor:pointer;outline:none}
.m-legislacion .z:focus-visible .hit,.m-legislacion .z.on .hit{stroke:var(--accent);stroke-width:3;stroke-dasharray:6 4;fill:color-mix(in srgb,var(--accent) 10%,transparent)}
.m-legislacion .z:hover .hit{fill:color-mix(in srgb,var(--accent) 7%,transparent)}
.m-legislacion .hit{fill:transparent;stroke:transparent}
.m-legislacion .sea{fill:var(--sea)}
.m-legislacion .deep{fill:color-mix(in srgb,var(--sea-2) 70%,var(--sea))}
.m-legislacion .land{fill:color-mix(in srgb,var(--muted) 30%,var(--sheet))}
.m-legislacion .rock{fill:color-mix(in srgb,var(--muted) 55%,var(--sheet))}
.m-legislacion .sand{fill:color-mix(in srgb,var(--buoy-y) 38%,var(--sheet))}
.m-legislacion .lim{fill:none;stroke:var(--ink);stroke-width:1.4;stroke-dasharray:5 5;opacity:.75}
.m-legislacion .lbl{font:600 12px var(--f-body);fill:var(--ink)}
.m-legislacion .lbl.s{font-size:10.5px;fill:var(--muted)}
.m-legislacion .lbl.acc{fill:var(--accent)}
.m-legislacion .pos{stroke:var(--stbd);stroke-width:2;fill:none;opacity:.7}
.m-legislacion .ybuoy{fill:#f2c200;stroke:#6b5600;stroke-width:1}
.m-legislacion .mbuoy{fill:#ffffff;stroke:#1e3f66;stroke-width:1.5}
.m-legislacion .reserve{fill:color-mix(in srgb,var(--stbd) 10%,transparent);stroke:var(--stbd);stroke-width:1.5;stroke-dasharray:2 4}
.m-legislacion .ring{fill:none;stroke:var(--bad);stroke-width:1.5;stroke-dasharray:4 3}
.m-legislacion .boat{fill:var(--accent);stroke:var(--sheet);stroke-width:1.5}
.m-legislacion .boatpulse{fill:none;stroke:var(--accent);stroke-width:2;animation:m-leg-pulse 1.4s ease-out infinite}
@keyframes m-leg-pulse{from{r:10;opacity:.9}to{r:26;opacity:0}}
.m-legislacion .info{min-height:7.5rem}
.m-legislacion .info h4{margin-bottom:.35rem}
.m-legislacion .info ul{margin:.4rem 0 0;padding-left:1.1rem}
.m-legislacion .verdict{font:700 1.6rem/1.1 var(--f-display);letter-spacing:.02em}
.m-legislacion .verdict.ok{color:var(--ok)}.m-legislacion .verdict.bad{color:var(--bad)}.m-legislacion .verdict.warn{color:var(--warn)}
.m-legislacion label.f{display:flex;flex-direction:column;gap:.25rem;font-weight:600;font-size:.9rem;min-width:0}
.m-legislacion select,.m-legislacion input[type=number]{min-height:40px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);padding:.3em .5em;width:100%;max-width:100%}
.m-legislacion .cite{font:500 .8rem/1.4 var(--f-mono);color:var(--muted)}
.m-legislacion .tt td,.m-legislacion .tt th{white-space:normal}
.m-legislacion .tt td:first-child{font-weight:700}
.m-legislacion .st{font-weight:700;white-space:nowrap}
.m-legislacion .st.ok{color:var(--ok)}.m-legislacion .st.bad{color:var(--bad)}.m-legislacion .st.warn{color:var(--warn)}
.m-legislacion .cards{display:grid;gap:.8rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.m-legislacion .card{text-align:left;cursor:pointer;border:1px solid var(--line);background:var(--sheet);border-radius:var(--r);padding:.9rem;min-height:8rem;display:flex;flex-direction:column;gap:.4rem;box-shadow:var(--shadow)}
.m-legislacion .card[aria-expanded=true]{background:var(--sea);border-color:var(--sea-2)}
.m-legislacion .card .big{font:600 1.25rem/1.1 var(--f-display)}
.m-legislacion .card ul{margin:0;padding-left:1.1rem;font-size:.92rem}
.m-legislacion .opts{display:flex;flex-direction:column;gap:.5rem}
.m-legislacion .opt{text-align:left;justify-content:flex-start;font-weight:500;white-space:normal;line-height:1.35;padding:.6em .8em}
.m-legislacion .opt.right{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 14%,var(--sheet))}
.m-legislacion .opt.wrong{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 12%,var(--sheet))}
.m-legislacion .bar{height:6px;border-radius:3px;background:var(--sea-2);overflow:hidden}
.m-legislacion .bar i{display:block;height:100%;background:var(--accent);transition:width .3s}
`;

/* ───────────────────────── 1 · Mapa de costa ───────────────────────── */

const ZONES = {
  balizada: {
    t: "Playa con zona de baño balizada",
    b: [
      "Las <b>boyas amarillas</b> delimitan la zona de baño: dentro está <b>prohibido navegar</b> con embarcaciones y motos.",
      "Se entra y sale solo por los <b>canales balizados</b>, <b>perpendiculares a la costa</b>, y a <b>≤3 nudos</b>.",
      "En el canal no se fondea ni se para: es paso de entrada y salida, no zona de baño ni de estancia.",
    ],
    c: "RD 876/2014 (Reglamento de Costas) art. 73",
  },
  canal: {
    t: "Canal de entrada y salida",
    b: [
      "Balizado con boyas (amarillas en las playas españolas) a ambos lados.",
      "Trayecto <b>perpendicular a la línea de costa</b> y velocidad <b>≤3 nudos</b>.",
      "Es el único acceso permitido a la orilla de una playa balizada (varada, embarque).",
    ],
    c: "RD 876/2014 art. 73",
  },
  sinbalizar: {
    t: "Playa sin balizar",
    b: [
      "Sin balizamiento se entiende que la zona de baño ocupa una franja de <b>200 m</b> desde la orilla en las <b>playas</b>.",
      "Dentro de esa franja: <b>≤3 nudos</b>, con precaución, y acercándose <b>perpendicular a la costa</b>.",
      "Las motos náuticas, en tramos sin balizar, no deben navegar dentro de esos 200 m (salvo para entrar o salir del modo indicado).",
      "Una embarcación de recreo puede detenerse o fondear en calas o lugares de baño no balizados, sin poner en peligro la vida humana ni la navegación; no hace falta comunicarlo a la estación costera.",
    ],
    c: "RD 876/2014 art. 73 · TRLPEMM art. 20 (derecho a fondear en calas no balizadas)",
  },
  roca: {
    t: "Resto de costa (sin playa, sin balizar)",
    b: [
      "La zona de baño es una franja de <b>50 m</b> desde la costa.",
      "Dentro: <b>≤3 nudos</b>. Se puede fondear con finalidad exclusiva de recreo (clave oficial).",
      "Fuera de la franja se navega con normalidad aplicando el RIPA y la velocidad de seguridad.",
    ],
    c: "RD 876/2014 art. 73",
  },
  buzo: {
    t: "Buceadores: bandera «Alfa»",
    b: [
      "Bandera «Alfa» del Código Internacional de Señales: <b>blanca y azul, en cola de golondrina</b> («corneta»). Significa «Tengo un buzo sumergido; manténgase alejado de mí y a poca velocidad».",
      "Sin embarcación de apoyo, el buceador lleva un <b>dispositivo de balizamiento</b>: boya muy visible con esa bandera.",
      "Todos los buques y embarcaciones, salvo la de apoyo, a <b>≥50 m</b> de la zona de buceo.",
      "Ojo en el examen: también se pregunta la bandera <b>roja con franja diagonal blanca</b> = «hay buceadores cerca» (uso deportivo internacional).",
    ],
    c: "RD 550/2020 art. 14 · CIS bandera A",
  },
  reserva: {
    t: "Reserva marina · ZEPIM · praderas de posidonia",
    b: [
      "<i>Posidonia oceanica</i> está protegida: se limita o prohíbe el <b>fondeo</b> sobre ella, porque el ancla y la cadena arrastran y arrancan las matas.",
      "En reservas y espacios protegidos: fondear solo donde se permita, preferiblemente en <b>boyas de amarre autorizadas</b> o sobre arena.",
      "ZEPIM = áreas que albergan ecosistemas específicos del Mediterráneo o hábitats de especies en peligro (Protocolo del Convenio de Barcelona).",
      "ZEPIM españolas (9): Alborán, Fondos marinos del Levante almeriense, Cabo de Gata-Níjar, Maro-Cerro Gordo, Islas Medes, Cap de Creus, Islas Columbretes, Mar Menor y costa oriental de Murcia, Cabrera. El <b>Odiel NO</b> lo es (está en el Atlántico).",
      "Cetáceos (RD 1727/2007): exclusión <b>60 m</b>; restringida 60–300 m (≤4 nudos, máx. 2 barcos); aproximación 300–500 m.",
    ],
    c: "Ley 42/2007 · Protocolo ZEPIM (Barcelona) · RD 1727/2007",
  },
  libre: {
    t: "Fuera de las franjas de baño",
    b: [
      "Sin límite específico de velocidad por costas: rige la <b>velocidad de seguridad</b> (RIPA regla 6) y las reglas de rumbo y gobierno.",
      "Detenerse o fondear fuera de zonas portuarias no forma parte del derecho a navegar, salvo embarcaciones de recreo en calas o lugares de baño no balizados.",
    ],
    c: "RIPA reglas 5–6 · TRLPEMM",
  },
};

const PATROL = [
  { x: 300, y: 250, txt: "Moto náutica a 20 nudos, a unos 120 m de la orilla de la playa sin balizar.", ok: false, why: "Playa sin balizar: franja de 200 m a ≤3 nudos. Una moto náutica no debe navegar dentro de esos 200 m." },
  { x: 110, y: 255, txt: "Lancha que entra por el canal balizado, perpendicular a la playa, a 3 nudos.", ok: true, why: "Es exactamente lo permitido: canal balizado, perpendicular y ≤3 nudos." },
  { x: 470, y: 95, txt: "Velero que fondea con su ancla sobre la pradera de posidonia de la reserva.", ok: false, why: "Fondear sobre posidonia está limitado/prohibido: el ancla arranca las matas. Use una boya de amarre autorizada." },
  { x: 545, y: 120, txt: "Lancha amarrada a una boya de fondeo autorizada de la reserva.", ok: true, why: "Las boyas de amarre autorizadas son la alternativa legal al fondeo sobre la pradera." },
  { x: 290, y: 95, txt: "Embarcación de recreo que pasa a 30 m de la boya con bandera «Alfa».", ok: false, why: "Hay que mantenerse a 50 m como mínimo de la zona de buceo (solo la embarcación de apoyo puede estar más cerca)." },
  { x: 520, y: 270, txt: "Lancha que llega a 3 nudos y fondea a 40 m de la costa rocosa sin balizar para bañarse.", ok: true, why: "Clave oficial: a menos de 50 m en costa sin balizar puede fondear con finalidad exclusiva de recreo, navegando a ≤3 nudos." },
  { x: 60, y: 230, txt: "Lancha que atraviesa la zona de baño balizada fuera del canal, a 2 nudos.", ok: false, why: "En una playa balizada solo se puede navegar por los canales. Ir despacio no autoriza a entrar en la zona de baño." },
  { x: 300, y: 165, txt: "Lancha a 15 nudos a unos 300 m de la playa sin balizar, sin bañistas ni barcos cerca.", ok: true, why: "Está fuera de la franja de 200 m: sin límite de 3 nudos (siempre con velocidad de seguridad)." },
  { x: 470, y: 225, txt: "Velero a 6 nudos a unos 100 m de un acantilado sin playa ni balizamiento.", ok: true, why: "En el resto de costa la franja es de 50 m: a 100 m no rige el límite de 3 nudos." },
  { x: 325, y: 112, txt: "Embarcación de apoyo con bandera «Alfa» izada, junto a la boya de sus buceadores.", ok: true, why: "La embarcación de apoyo es la excepción a la distancia de 50 m; debe exhibir la bandera «Alfa»." },
];

function mapSVG() {
  const buoys = [];
  for (let x = 24; x <= 196; x += 19) if (x < 96 || x > 128) buoys.push(`<circle class="ybuoy" cx="${x}" cy="215" r="4"/>`);
  for (let y = 225; y <= 290; y += 16) buoys.push(`<circle class="ybuoy" cx="96" cy="${y}" r="3.5"/><circle class="ybuoy" cx="128" cy="${y}" r="3.5"/>`);
  buoys.push(`<circle class="ybuoy" cx="96" cy="215" r="4"/><circle class="ybuoy" cx="128" cy="215" r="4"/>`);
  const pos = [];
  for (let i = 0; i < 18; i++) {
    const x = 415 + (i % 6) * 22 + (Math.floor(i / 6) % 2) * 11, y = 52 + Math.floor(i / 6) * 26;
    pos.push(`<path class="pos" d="M${x} ${y + 10} q-3 -8 0 -14 M${x + 4} ${y + 10} q4 -9 1 -16 M${x + 8} ${y + 10} q-1 -7 3 -12"/>`);
  }
  return `<svg viewBox="0 0 600 380" role="img" aria-label="Mapa esquemático de costa con zonas de baño, buceadores y reserva marina">
  <defs><clipPath id="m-leg-clip"><rect width="600" height="380"/></clipPath></defs>
  <g clip-path="url(#m-leg-clip)">
  <rect class="deep" width="600" height="380"/>
  <rect class="sea" y="150" width="600" height="230"/>
  <!-- tierra -->
  <path class="land" d="M0 300 H210 V300 H390 L400 292 L420 300 L440 286 L462 296 L480 284 L505 296 L530 282 L556 294 L580 284 L600 292 V380 H0Z"/>
  <path class="sand" d="M0 300 H210 V318 H0Z"/><path class="sand" d="M215 300 H388 V318 H215Z"/>
  <path class="rock" d="M390 300 L400 292 L420 300 L440 286 L462 296 L480 284 L505 296 L530 282 L556 294 L580 284 L600 292 V312 H390Z"/>
  <!-- zona libre (fondo) -->
  <g class="z" data-z="libre" tabindex="0" role="button" aria-label="Fuera de las franjas de baño"><rect class="hit" x="4" y="4" width="372" height="134" rx="8"/></g>
  <text class="lbl s" x="14" y="24">Navegación libre (RIPA, velocidad de seguridad)</text>
  <!-- playa balizada -->
  <g class="z" data-z="balizada" tabindex="0" role="button" aria-label="Playa balizada"><rect class="hit" x="6" y="204" width="86" height="94" rx="6"/><rect class="hit" x="132" y="204" width="74" height="94" rx="6"/></g>
  <g class="z" data-z="canal" tabindex="0" role="button" aria-label="Canal de entrada y salida"><rect class="hit" x="94" y="150" width="36" height="148" rx="6"/></g>
  ${buoys.join("")}
  <path d="M112 196 V170 M106 178 L112 168 L118 178" stroke="var(--ink)" stroke-width="1.6" fill="none"/>
  <text class="lbl" x="10" y="200">Playa balizada</text>
  <text class="lbl s" x="134" y="166">canal ⊥</text><text class="lbl s" x="134" y="179">≤3 nudos</text>
  <text class="lbl s" x="20" y="334">zona de baño: prohibido navegar</text>
  <!-- playa sin balizar -->
  <g class="z" data-z="sinbalizar" tabindex="0" role="button" aria-label="Playa sin balizar, 200 metros"><rect class="hit" x="214" y="196" width="174" height="102" rx="6"/></g>
  <path class="lim" d="M214 200 H388"/>
  <text class="lbl" x="222" y="192">Playa sin balizar · 200 m</text>
  <text class="lbl s" x="246" y="334">≤3 nudos dentro</text>
  <!-- resto de costa -->
  <g class="z" data-z="roca" tabindex="0" role="button" aria-label="Resto de costa, 50 metros"><rect class="hit" x="392" y="244" width="206" height="48" rx="6"/></g>
  <path class="lim" d="M392 262 L420 266 L440 252 L462 262 L480 250 L505 262 L530 248 L556 260 L580 250 L600 258"/>
  <text class="lbl" x="420" y="240">Resto de costa · 50 m</text>
  <text class="lbl s" x="440" y="334">acantilado / roca</text>
  <!-- buceadores -->
  <g class="z" data-z="buzo" tabindex="0" role="button" aria-label="Zona de buceo, bandera Alfa"><rect class="hit" x="236" y="58" width="128" height="102" rx="8"/></g>
  <circle class="ring" cx="300" cy="108" r="40"/>
  <circle cx="300" cy="112" r="6" fill="#e04a2a" stroke="#5a1408" stroke-width="1"/>
  <line x1="300" y1="106" x2="300" y2="80" stroke="var(--ink)" stroke-width="1.6"/>
  <path d="M300 80 h8 v16 h-8z" fill="#ffffff" stroke="#1e3f66" stroke-width=".8"/>
  <path d="M308 80 h14 l-7 8 l7 8 h-14z" fill="#1d4fa3"/>
  <text class="lbl" x="250" y="56">Buzos · «Alfa» · ≥50 m</text>
  <!-- reserva -->
  <g class="z" data-z="reserva" tabindex="0" role="button" aria-label="Reserva marina con posidonia"><rect class="hit reserve" x="396" y="34" width="196" height="132" rx="10"/></g>
  <rect class="reserve" x="396" y="34" width="196" height="132" rx="10" pointer-events="none"/>
  <g pointer-events="none">${pos.join("")}</g>
  <circle class="mbuoy" cx="548" cy="134" r="5"/><circle class="mbuoy" cx="572" cy="134" r="5"/><circle class="mbuoy" cx="524" cy="134" r="5"/>
  <g transform="translate(560 58)" pointer-events="none"><path d="M0 -10 V8 M-7 2 Q0 12 7 2 M-5 -6 H5" stroke="var(--ink)" stroke-width="1.8" fill="none"/><line x1="-11" y1="-12" x2="11" y2="12" stroke="var(--bad)" stroke-width="2.4"/></g>
  <text class="lbl" x="404" y="182">Reserva · ZEPIM · posidonia</text>
  <text class="lbl s" x="470" y="160">boyas de amarre</text>
  <g class="patrol"></g>
  </g></svg>`;
}

/* ───────────────────────── 2 · Vertidos ───────────────────────── */

const WASTES = [
  ["comida-t", "Restos de comida triturados (<25 mm)"],
  ["comida", "Restos de comida sin triturar"],
  ["plastico", "Plásticos (bolsas, envases, cabos sintéticos, redes)"],
  ["mixta", "Bolsa mixta: restos de comida + envases"],
  ["papel", "Papel y cartón"],
  ["vidrio", "Vidrio, metal, latas, loza"],
  ["trapos", "Trapos, colillas, cenizas"],
  ["aceite-cocina", "Aceite de cocina"],
  ["aceite-motor", "Aceite de motor usado"],
  ["sentina", "Aguas oleosas de sentina"],
  ["sucias-dd", "Aguas sucias desmenuzadas y desinfectadas (sistema homologado)"],
  ["sucias", "Aguas sucias sin desmenuzar ni desinfectar"],
  ["sucias-trat", "Aguas sucias por instalación de tratamiento homologada"],
  ["grises", "Aguas grises (fregadero, ducha)"],
];

function judge(w, special, dist, kn, protegidas) {
  const enRuta = kn > 0;
  const R = (v, msg, cite) => ({ v, msg, cite });
  switch (w) {
    case "plastico":
      return R("no", "Nunca. Los plásticos (incluidos cabos y redes sintéticas y bolsas de basura de plástico) no se descargan en ningún lugar ni a ninguna distancia. Al puerto, a la instalación de recepción.", "MARPOL V reg. 3 (prohibición general) y reg. 4/6 · RD 128/2022 (recepción en puertos)");
    case "papel": case "vidrio": case "trapos":
      return R("no", "Prohibido a cualquier distancia. Desde la revisión del Anexo V (2013) toda basura está prohibida salvo excepciones tasadas (restos de comida, residuos de carga, productos de limpieza no perjudiciales, cadáveres de animales). Papel, vidrio, metal, trapos o colillas no son excepción.", "MARPOL V reg. 3, 4 y 6");
    case "aceite-cocina":
      return R("no", "Prohibido: el aceite de cocina es basura y no está entre las excepciones. Solo se exculpa una pérdida accidental resultante de una avería, si se tomaron todas las precauciones razonables para impedirla o reducirla.", "MARPOL V reg. 3 y reg. 7 (excepciones por avería)");
    case "aceite-motor": case "sentina":
      return R("no", "No. Hidrocarburos y mezclas oleosas se retienen a bordo y se entregan en puerto. Solo un buque con equipo separador homologado podría descargar en ruta un efluente ≤15 ppm; una embarcación de recreo sin ese equipo, nunca. El Mediterráneo es además zona especial del Anexo I.", "MARPOL I reg. 15 · RD 128/2022");
    case "mixta":
      return R("no", "Cuando las basuras están mezcladas con otras de descarga prohibida o con requisitos distintos, se aplica la prescripción MÁS RIGUROSA. Los envases (plástico, metal) no pueden descargarse, así que la bolsa entera tampoco.", "MARPOL V reg. 4.3 / 6 (basuras mezcladas)");
    case "comida-t": {
      const min = special ? 12 : 3;
      if (!enRuta) return R("no", "Debe hacerse con el buque en ruta. Detenido o fondeado, no.", special ? "MARPOL V reg. 6.1" : "MARPOL V reg. 4.1.1");
      if (dist >= min) return R("si", `Sí: en ruta, tan lejos como sea posible de tierra y a ${dist} mn (mínimo ${min} mn${special ? " en zona especial" : " si están triturados y pasan por criba de 25 mm"}).`, special ? "MARPOL V reg. 6.1.1 (zona especial: triturados y ≥12 mn)" : "MARPOL V reg. 4.1.1 (≥3 mn triturados)");
      return R("no", `A ${dist} mn no: el mínimo es ${min} mn de la tierra más próxima${special ? " (zona especial: el Mediterráneo lo es)" : ""}.`, special ? "MARPOL V reg. 6.1.1" : "MARPOL V reg. 4.1.1");
    }
    case "comida": {
      if (special) return R("no", "En zona especial (Mediterráneo) los restos de comida solo pueden descargarse triturados (criba de 25 mm) y a ≥12 mn. Sin triturar, no.", "MARPOL V reg. 6.1.1");
      if (!enRuta) return R("no", "Debe hacerse con el buque en ruta.", "MARPOL V reg. 4.1.2");
      if (dist >= 12) return R("si", `Sí: fuera de zona especial, sin triturar, en ruta y a ${dist} mn (mínimo 12 mn).`, "MARPOL V reg. 4.1.2 (≥12 mn sin triturar)");
      return R("no", `A ${dist} mn no: sin triturar hacen falta 12 mn (triturados bastarían 3 mn).`, "MARPOL V reg. 4.1.2");
    }
    case "sucias-dd": case "sucias": {
      const min = w === "sucias-dd" ? 3 : 12;
      const probs = [];
      if (dist <= min) probs.push(`distancia superior a ${min} mn de la tierra más próxima (línea de base)`);
      if (kn < 4) probs.push("en ruta a 4 nudos como mínimo, descargando a régimen moderado");
      if (!probs.length) return R("si", `Sí: a ${dist} mn (> ${min} mn) y a ${kn} nudos (≥4), vaciando el tanque a régimen moderado, no de golpe. El Mediterráneo no cambia esta regla.`, "RD 339/2021 art. 23.1.a");
      return R("no", "No. Falta: " + probs.join("; ") + ". (No existe ningún límite de «4 millas»: son 3 mn tratadas, 12 mn sin tratar y 4 NUDOS.)", "RD 339/2021 art. 23.1.a");
    }
    case "sucias-trat":
      if (protegidas) return R("no", "No en zona 7 (puertos, radas, rías, bahías abrigadas y aguas protegidas en general).", "RD 339/2021 art. 23.1.b");
      return R("si", "Sí, fuera de zona 7, con instalación de tratamiento que cumpla el Reglamento (UE) 2020/1170, siempre que el efluente no produzca sólidos flotantes visibles ni coloración en el agua. Sin requisito de distancia ni de velocidad.", "RD 339/2021 art. 23.1.b");
    case "grises":
      return R("warn", "Las aguas grises (fregadero, ducha) no son «aguas sucias» del Anexo IV ni basura del Anexo V; sus restos de comida o grasas sí lo serían. No vierta grasas ni sólidos; en puertos y aguas protegidas se aplican además ordenanzas locales.", "MARPOL IV reg. 1 (definición de aguas sucias) · MARPOL V reg. 1");
  }
}

/* ───────────────────────── 3 · Títulos ───────────────────────── */

const ROUTES = [
  ["2", "≤2 mn de puerto, marina o abrigo"],
  ["5", "≤5 mn de puerto, marina o abrigo"],
  ["12", "≤12 mn de la costa"],
  ["inter", "Entre islas (Baleares o Canarias)"],
  ["penbal", "Península – Baleares"],
  ["150", "≤150 mn de la costa"],
  ["sin", "Sin límite (oceánica)"],
];
const RLEVEL = { "2": 0, "5": 1, "12": 2, inter: 2, penbal: 3, "150": 4, sin: 5 };

function titleRows(tipo, L, cv, route, night, rental) {
  const r = RLEVEL[route];
  const rows = [];
  const NO = (m) => ["bad", "No", m], OK = (m) => ["ok", "Sí", m], CO = (m) => ["warn", "Con prácticas", m];
  // Exención (RD 875/2014 art. 10, redacción RD 1188/2025 en vigor 1-oct-2026)
  let ex;
  if (tipo === "moto") ex = NO("Las motos náuticas nunca están exentas (art. 10.2).");
  else if (rental) ex = NO("Desde el 1-oct-2026 la exención es solo para uso privado/deportivo: el alquiler exige título (RD 1188/2025).");
  else if (night) ex = NO("Solo navegación diurna.");
  else if (r > 0) ex = NO("Máximo 2 mn del puerto, marina o playa de salida.");
  else if (tipo === "motor") ex = L <= 5 && cv <= 15 ? OK("Motor ≤5 m y ≤15 CV (sin reductor de potencia), uso privado, de día, ≤2 mn. Mayor de 18 años.") : NO("Solo motor ≤5 m y ≤15 CV nominales.");
  else ex = L <= 6 ? OK("Vela ≤6 m, uso deportivo, de día, ≤2 mn. Mayor de 18 años.") : NO("Solo vela ≤6 m.");
  rows.push(["Sin título (exención)", ex]);
  // Licencia de navegación (art. 11)
  let li;
  if (night) li = NO("Solo navegación diurna.");
  else if (r > 0) li = NO("Máximo 2 mn de un puerto, marina o lugar de abrigo.");
  else if (tipo !== "moto" && L > 6) li = NO("Máximo 6 m de eslora.");
  else li = OK(tipo === "moto" ? "Habilita motos náuticas, de día y ≤2 mn." : "≤6 m, potencia adecuada, de día y ≤2 mn. Desde 16 años con consentimiento.");
  rows.push(["Licencia de navegación", li]);
  // PNB (art. 8.d / 9.d)
  let pnb;
  if (r > 1) pnb = NO("Máximo 5 mn de un puerto, marina o lugar de abrigo.");
  else if (tipo === "moto") pnb = OK("Motos náuticas dentro de sus límites técnicos.");
  else if (L > 8) pnb = NO("Máximo 8 m de eslora.");
  else pnb = tipo === "vela" ? CO("Vela ≤8 m requiere prácticas de vela (atribución complementaria).") : OK("Motor ≤8 m, ≤5 mn de abrigo, de día o de noche.");
  rows.push(["PNB", pnb]);
  // PER (art. 8.c / 9.c)
  let per;
  if (tipo === "moto") per = r <= 2 ? OK("Motos náuticas dentro de sus límites técnicos.") : NO("Límites técnicos de la moto.");
  else if (r > 3 || L > 24) per = NO("Máximo 24 m y 12 mn / interinsular / Península–Baleares.");
  else if (r <= 2 && L <= 15) per = tipo === "motor" ? OK("Motor ≤15 m, ≤12 mn e interinsular.") : CO("Vela ≤15 m: prácticas de vela.");
  else per = tipo === "motor" ? CO("Motor hasta 24 m y Península–Baleares: prácticas complementarias.") : CO("Vela hasta 24 m o Península–Baleares: prácticas de vela + complementarias.");
  rows.push(["PER", per]);
  // PY
  let py;
  if (tipo === "moto") py = r <= 2 ? OK("Motos náuticas.") : NO("Límites técnicos de la moto.");
  else if (r > 4 || L > 24) py = NO("Máximo 24 m y 150 mn de la costa.");
  else py = tipo === "motor" ? OK("Motor ≤24 m, ≤150 mn.") : CO("Vela ≤24 m: prácticas de vela.");
  rows.push(["Patrón de Yate", py]);
  // CY
  let cy;
  if (tipo === "moto") cy = r <= 2 ? OK("Motos náuticas.") : NO("Límites técnicos de la moto.");
  else if (L > 24) cy = NO("Máximo 24 m (más eslora = buque de recreo: título profesional).");
  else cy = tipo === "motor" ? OK("Motor ≤24 m, sin límite geográfico.") : CO("Vela ≤24 m: prácticas de vela.");
  rows.push(["Capitán de Yate", cy]);
  return rows;
}

/* ───────────────────────── 4 · Normas (tarjetas) ───────────────────────── */

const CARDS = [
  { k: "Pabellón", big: "RD 2335/1980", items: [
    "Bandera de España como único pabellón; asta de popa y pico del palo mayor reservados para ella.",
    "Ninguna otra bandera izada si no lo está el pabellón; las demás, nunca mayores de <b>1/3 de su área</b>.",
    "Autonómicas: en puertos y aguas interiores, siempre junto al pabellón.",
    "Obligatorio izarlo a la vista de buque de guerra o fortaleza, al entrar y salir de puerto y, en puerto, <b>de sol a sol</b> en festivos o cuando lo disponga la autoridad.",
  ] },
  { k: "Seguro obligatorio", big: "RD 607/1999", items: [
    "Obligatorio: todo lo de recreo <b>a motor</b> (incluidas motos náuticas) y lo <b>sin motor de más de 6 m</b>.",
    "Pabellón español, o extranjero con entrada o salida en puerto español.",
    "RC <b>extracontractual</b> del propietario, del patrón autorizado, de quienes le secunden y de los <b>esquiadores</b> remolcados.",
    "Cubre daños a <b>personas</b> y <b>materiales a terceros y a buques por colisión</b>. NO cubre los daños propios.",
    "Si no lleva el justificante: <b>5 días hábiles</b> para acreditarlo.",
  ] },
  { k: "Registro y documentación", big: "RD 1435/2010", items: [
    "Registro de Buques: lista <b>7ª</b> recreo de uso privado; lista <b>6ª</b> recreo con fines lucrativos (chárter).",
    "Marcado CE ≤12 m (régimen art. 8): solo mar territorial español y dentro de su categoría de diseño.",
    "Certificado de navegabilidad no a bordo: <b>5 días hábiles</b> para justificarlo.",
    "Sin CE: zona de navegación según el equipo de seguridad a bordo (RD 339/2021 art. 3).",
  ] },
  { k: "Auxilio · SOLAS V/33", big: "Acudir a toda máquina", items: [
    "Quien reciba una señal de socorro y pueda prestar ayuda acude <b>a toda máquina</b>, sea cual sea la nacionalidad o condición de las personas.",
    "No es obligatorio «en cualquier circunstancia»: si no puede o no es razonable, anota el motivo en el <b>diario de navegación</b> (no en la carta).",
    "Avistamiento de contaminación: comunicar <b>inmediatamente a la estación costera</b> (Resolución OMI A.851(20)).",
  ] },
  { k: "Salvamento Marítimo", big: "900 202 202", items: [
    "Teléfono de emergencias <b>900 202 202</b> o <b>112</b>.",
    "VHF <b>canal 16</b> (voz, socorro y llamada) · alerta LSD/DSC en <b>canal 70</b>.",
    "Notificar abordajes, varadas, daños o manchas/objetos a la deriva. Fondear en una cala no balizada NO se notifica.",
    "App SafeTrx para comunicar rutas y alertas.",
  ] },
  { k: "Responsabilidades", big: "Contaminación y títulos", items: [
    "Multas por contaminación: responden <b>solidariamente</b> naviero, propietario, asegurador de RC y capitán/patrón, y deben reparar el daño.",
    "Pabellón extranjero con patrón de la misma nacionalidad: título según la ley de su nacionalidad.",
    "Psicofísico: no se repite si su permiso de conducir se obtuvo o renovó hace ≤2 años; sí la prueba de distinguir colores.",
    "RD 1188/2025: desde el <b>1-oct-2026</b> alquilar una embarcación exige título; la exención solo vale para uso privado/deportivo.",
  ] },
];

/* ───────────────────────── 5 · Reto ───────────────────────── */

const QUIZ = [
  { q: "Playa sin zona de baño balizada. ¿Qué anchura tiene la zona de baño?", o: ["200 m en playas y 50 m en el resto de la costa", "100 m en playas y 50 m en el resto", "200 m en toda la costa", "50 m en playas y 200 m en el resto"], a: 0, e: "RD 876/2014 art. 73: 200 m en playas, 50 m en el resto de la costa, a ≤3 nudos." },
  { q: "Quiere acercarse a la orilla de una playa SIN canales balizados. ¿Cómo?", o: ["Perpendicular a la costa y a ≤3 nudos", "Paralelo a la orilla buscando hueco", "Motor apagado con arrancada ≥3 nudos", "A cualquier velocidad si no hay bañistas"], a: 0, e: "Clave oficial: entrar perpendicular a la línea de costa y a velocidad que no supere 3 nudos." },
  { q: "Distancia mínima a una zona de buceo señalizada (salvo la embarcación de apoyo):", o: ["25 m", "50 m", "100 m", "200 m"], a: 1, e: "RD 550/2020 art. 14: 50 m." },
  { q: "La bandera «Alfa» izada aisladamente significa:", o: ["Tengo un buzo sumergido; manténgase alejado y a poca velocidad", "Necesito práctico", "Llevo mercancías peligrosas", "Estoy maniobrando con dificultad"], a: 0, e: "CIS: «A» = buzo sumergido. Blanca y azul, cola de golondrina." },
  { q: "Fuera de zona especial, restos de comida SIN triturar. Distancia mínima:", o: ["3 mn", "4 mn", "12 mn", "Prohibido siempre"], a: 2, e: "MARPOL V reg. 4: 12 mn sin triturar; 3 mn si pasan por criba de 25 mm." },
  { q: "En el Mediterráneo (zona especial), restos de comida triturados:", o: ["≥3 mn", "≥12 mn, en ruta", "Prohibido siempre", "Libre si están triturados"], a: 1, e: "MARPOL V reg. 6: en zona especial solo triturados y a no menos de 12 mn." },
  { q: "Aguas sucias desmenuzadas y desinfectadas con sistema homologado:", o: ["A más de 3 mn, en ruta a ≥4 nudos y a ritmo moderado", "A más de 4 mn a cualquier velocidad", "A más de 12 mn y fondeado", "Nunca en aguas españolas"], a: 0, e: "RD 339/2021 art. 23.1.a. No existe el límite de «4 millas»: son 4 NUDOS." },
  { q: "Velocidad mínima para descargar aguas sucias (cumpliendo lo demás):", o: ["2 nudos", "3 nudos", "4 nudos", "6 nudos"], a: 2, e: "RD 339/2021 art. 23.1.a: en ruta a no menos de 4 nudos." },
  { q: "Con instalación de tratamiento de aguas sucias homologada, se puede descargar:", o: ["Fuera de zona 7, sin sólidos flotantes visibles ni coloración", "En cualquier puerto", "Solo a más de 12 mn", "Solo fondeado"], a: 0, e: "RD 339/2021 art. 23.1.b." },
  { q: "Bolsa con basuras mezcladas de distintas prescripciones:", o: ["Se aplica la más rigurosa", "Se aplica la del residuo mayoritario", "Se puede si se tritura todo", "Se aplica la menos rigurosa"], a: 0, e: "MARPOL V reg. 4: prescripciones más rigurosas." },
  { q: "Descarga de aceite de cocina al mar:", o: ["Prohibida salvo pérdida accidental por avería con precauciones razonables", "Permitida a más de 12 mn", "Permitida mezclada con comida triturada", "Prohibida sin excepción alguna"], a: 0, e: "MARPOL V reg. 3 y 7: la única salvedad es la pérdida accidental por avería." },
  { q: "¿Plásticos triturados a 25 mm y a más de 12 mn?", o: ["Permitido", "Permitido fuera de zona especial", "Prohibido siempre", "Permitido en ruta a ≥4 nudos"], a: 2, e: "Los plásticos no se descargan nunca, en ninguna zona." },
  { q: "¿Quiénes deben tener el seguro obligatorio de RC?", o: ["Todo lo de recreo a motor (incl. motos) y lo sin motor de más de 6 m", "Solo motor de más de 5 m", "Solo embarcaciones con matrícula", "Motor y kayaks de más de 5 m"], a: 0, e: "RD 607/1999." },
  { q: "¿Qué cubre obligatoriamente el seguro de RC?", o: ["Daños propios del casco", "Daños materiales a terceros y a buques por colisión", "Robo del motor", "Asistencia en remolque"], a: 1, e: "RD 607/1999: personas y bienes de terceros y buques por colisión; no daños propios." },
  { q: "No puede acudir a una llamada de socorro. ¿Qué hace?", o: ["Nada, si nadie le ha visto", "Anota el motivo en el diario de navegación", "Lo anota en la carta náutica", "Avisa al puerto al llegar"], a: 1, e: "SOLAS V/33.1: anotar en el diario la razón." },
  { q: "Teléfono de Salvamento Marítimo:", o: ["900 202 202", "091", "900 100 100", "112 solo desde tierra"], a: 0, e: "900 202 202 (y 112). VHF canal 16; alerta LSD canal 70." },
  { q: "¿Cuál NO es una ZEPIM española?", o: ["Cabo de Gata-Níjar", "Islas Columbretes", "Espacio marino del Odiel", "Fondos marinos del Levante almeriense"], a: 2, e: "El Odiel (Huelva) no es mediterráneo ni ZEPIM." },
  { q: "Las banderas autonómicas a bordo:", o: ["Pueden ir solas en aguas interiores", "Nunca mayores de 1/3 del área del pabellón nacional", "Son obligatorias al entrar en puerto", "Pueden quedar izadas sin el pabellón"], a: 1, e: "RD 2335/1980 art. 2 y 3." },
  { q: "PER sin prácticas complementarias: atribuciones básicas a motor:", o: ["Hasta 15 m y 12 mn, interinsular y motos", "Hasta 12 m y 15 mn", "Hasta 24 m y 150 mn", "Hasta 8 m y 5 mn"], a: 0, e: "RD 875/2014 art. 8.c. Con prácticas: vela 15 m; 24 m y Península–Baleares." },
  { q: "Desde el 1-oct-2026, un barco a motor de 4,5 m y 15 CV de alquiler:", o: ["Sigue sin requerir título", "Exige título (la exención es solo para uso privado)", "Solo requiere chaleco", "Exige PER"], a: 1, e: "RD 1188/2025 modifica el art. 10 del RD 875/2014." },
  { q: "Licencia de navegación: límites:", o: ["≤6 m, de día, ≤2 mn de abrigo", "≤8 m, ≤5 mn", "≤6 m, de noche, ≤5 mn", "≤5 m, 15 CV"], a: 0, e: "RD 875/2014 art. 11 (incluye motos náuticas)." },
  { q: "¿Qué NO requiere comunicación a la estación costera?", o: ["Un abordaje", "Una mancha de contaminante", "Fondear en una cala no balizada sin peligro", "Una varada"], a: 2, e: "Clave oficial: fondear en calas no balizadas no se notifica." },
  { q: "Distancia de exclusión a cetáceos:", o: ["30 m", "60 m", "300 m", "500 m"], a: 1, e: "RD 1727/2007: 60 m exclusión; 60–300 m restringida." },
  { q: "Para proteger la posidonia:", o: ["Se limita el fondeo para que el ancla no arranque las matas", "Se prohíbe navegar sobre ella", "Se exige fondear con dos anclas", "Basta con fondear de día"], a: 0, e: "Clave oficial: limitaciones al fondeo; usar boyas autorizadas." },
  { q: "Embarcación sin CE con depósito de retención fijo:", o: ["Conexión universal a tierra para su descarga en recepción", "Válvula de descarga directa al mar", "Nada especial", "Inodoro químico portátil"], a: 0, e: "RD 339/2021 art. 22." },
];

/* ───────────────────────── montaje ───────────────────────── */

export default {
  id: ID,
  tema: 4,
  title: "Legislación en la costa",
  icon: "§",
  desc: "Zonas de baño, buceadores y reservas en un mapa; calculadora de vertidos MARPOL/RD 339; títulos 2026; reto final.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = CSS; document.head.appendChild(s);
    }
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
    const h = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
    const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    const root = h("div", "m-legislacion");
    el.appendChild(root);
    const tabs = [["costa", "Costa"], ["vertidos", "Vertidos"], ["titulos", "Títulos"], ["normas", "Normas"], ["reto", "Reto"]];
    const seg = h("div", "seg m-tabs"); seg.setAttribute("role", "tablist");
    const view = h("div", "stack");
    root.append(seg, view);
    let cur = ctx.store.get("tab", "costa");
    tabs.forEach(([k, t]) => {
      const b = h("button", "", t); b.type = "button"; b.dataset.k = k; b.setAttribute("role", "tab");
      b.onclick = () => show(k); seg.appendChild(b);
    });

    function show(k) {
      cur = k; ctx.store.set("tab", k);
      seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === k)));
      timers.forEach(clearTimeout); timers.clear();
      view.innerHTML = "";
      ({ costa, vertidos, titulos, normas, reto })[k]();
    }

    /* ── Costa ── */
    function costa() {
      view.appendChild(h("p", "muted small", "Toca cada zona del mapa (no está a escala). Después, juega a «Patrulla»: decide si cada maniobra es legal."));
      const stage = h("div", "stage m-map", mapSVG());
      const info = h("div", "panel info", "<h4>Elige una zona</h4><p class='muted'>Playa balizada, canal, playa sin balizar, costa rocosa, buceadores, reserva…</p>");
      view.append(stage, info);
      const svg = stage.querySelector("svg");
      const pick = (z) => {
        svg.querySelectorAll(".z").forEach((g) => g.classList.toggle("on", g.dataset.z === z));
        const Z = ZONES[z];
        info.innerHTML = `<h4>${Z.t}</h4><ul>${Z.b.map((x) => `<li>${x}</li>`).join("")}</ul><p class="cite" style="margin-top:.5rem">${Z.c}</p>`;
      };
      svg.querySelectorAll(".z").forEach((g) => {
        g.addEventListener("pointerup", () => { if (!patrolOn) pick(g.dataset.z); });
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g.dataset.z); } });
      });

      // Patrulla
      let patrolOn = false, deck = [], idx = 0, score = 0;
      const pPanel = h("div", "panel stack");
      const startBtn = h("button", "btn primary", "Empezar «Patrulla» (10 casos)"); startBtn.type = "button";
      pPanel.append(h("div", "eyebrow", "Patrulla de costa"), startBtn);
      view.appendChild(pPanel);
      const layer = svg.querySelector(".patrol");
      const best = ctx.store.get("patrolBest", 0);
      if (best) pPanel.appendChild(h("p", "muted small", `Tu mejor marca: ${best}/10`));
      startBtn.onclick = () => { patrolOn = true; deck = shuffle(PATROL); idx = 0; score = 0; next(); };
      function next() {
        if (idx >= deck.length) {
          patrolOn = false; layer.innerHTML = "";
          const prev = ctx.store.get("patrolBest", 0); if (score > prev) ctx.store.set("patrolBest", score);
          pPanel.innerHTML = `<div class="eyebrow">Patrulla de costa</div><p class="verdict ${score >= 8 ? "ok" : "warn"}">${score}/10</p><p>${score === 10 ? "Patrulla perfecta." : "Repasa las zonas en las que dudaste."}</p>`;
          if (score >= 8) ctx.award(30, "Patrulla de costa superada");
          const again = h("button", "btn", "Otra ronda"); again.type = "button"; again.onclick = () => startBtn.onclick(); pPanel.appendChild(again);
          return;
        }
        const c = deck[idx];
        layer.innerHTML = `<circle class="boatpulse" cx="${c.x}" cy="${c.y}" r="10"/><path class="boat" transform="translate(${c.x} ${c.y})" d="M0 -11 C6 -4 6 6 4 10 H-4 C-6 6 -6 -4 0 -11Z"/>`;
        pPanel.innerHTML = `<div class="row" style="justify-content:space-between"><span class="eyebrow">Caso ${idx + 1}/10</span><span class="chip acc">${score} aciertos</span></div><p>${c.txt}</p>`;
        const row = h("div", "row");
        const yes = h("button", "btn", "Legal"), no = h("button", "btn", "Ilegal");
        yes.type = no.type = "button";
        const fb = h("p", "");
        const answer = (v) => {
          yes.disabled = no.disabled = true;
          const right = v === c.ok;
          if (right) { score++; ctx.award(5, "Patrulla: caso correcto"); }
          fb.innerHTML = `<span class="${right ? "fb-ok" : "fb-bad"}">${right ? "Correcto" : "Incorrecto"} — ${c.ok ? "es legal" : "es ilegal"}.</span> ${c.why}`;
          const nx = h("button", "btn primary", idx + 1 < deck.length ? "Siguiente" : "Ver resultado"); nx.type = "button";
          nx.onclick = () => { idx++; next(); }; pPanel.appendChild(nx); nx.focus();
        };
        yes.onclick = () => answer(true); no.onclick = () => answer(false);
        row.append(yes, no); pPanel.append(row, fb);
      }
    }

    /* ── Vertidos ── */
    function vertidos() {
      const st = ctx.store.get("vert", { w: "comida-t", sp: true, d: 6, kn: 5, pr: false });
      const p = h("div", "panel stack");
      p.innerHTML = `<div class="eyebrow">Calculadora de vertidos</div>
      <div class="grid">
        <label class="f">Residuo<select data-k="w">${WASTES.map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></label>
        <label class="f">Zona<select data-k="sp"><option value="1">Mediterráneo (zona especial MARPOL V)</option><option value="0">Fuera de zona especial (Atlántico, Canarias…)</option></select></label>
      </div>
      <label class="f">Distancia a la tierra más próxima: <span class="mono" data-o="d"></span><input type="range" min="0" max="25" step="0.5" data-k="d"></label>
      <label class="f">Velocidad: <span class="mono" data-o="kn"></span><input type="range" min="0" max="20" step="0.5" data-k="kn"></label>
      <label class="row small" style="font-weight:600"><input type="checkbox" data-k="pr"> Estoy en zona 7 (puerto, rada, ría, bahía abrigada, aguas protegidas)</label>`;
      const out = h("div", "panel stack", "");
      const tbl = h("div", "tint");
      tbl.innerHTML = `<div class="eyebrow" style="margin-bottom:.5rem">Resumen para memorizar</div><div class="scroll-x"><table><thead><tr><th>Residuo</th><th>Fuera de zona especial</th><th>Mediterráneo</th></tr></thead><tbody>
      <tr><td>Plásticos</td><td>Nunca</td><td>Nunca</td></tr>
      <tr><td>Comida triturada (&lt;25 mm)</td><td>&gt;3 mn, en ruta</td><td>&gt;12 mn, en ruta</td></tr>
      <tr><td>Comida sin triturar</td><td>&gt;12 mn, en ruta</td><td>Prohibido</td></tr>
      <tr><td>Papel, vidrio, metal, trapos, aceite de cocina</td><td>Prohibido</td><td>Prohibido</td></tr>
      <tr><td>Aguas sucias desmenuzadas y desinfectadas</td><td colspan="2">&gt;3 mn, en ruta ≥4 nudos, ritmo moderado</td></tr>
      <tr><td>Aguas sucias sin tratar</td><td colspan="2">&gt;12 mn, en ruta ≥4 nudos, ritmo moderado</td></tr>
      <tr><td>Instalación de tratamiento homologada</td><td colspan="2">Fuera de zona 7, sin sólidos ni coloración</td></tr>
      <tr><td>Hidrocarburos / sentinas</td><td colspan="2">Retener y entregar en puerto (RD 128/2022)</td></tr>
      </tbody></table></div>`;
      view.append(p, out, tbl);
      const q = (s) => p.querySelector(s);
      q('[data-k="w"]').value = st.w; q('[data-k="sp"]').value = st.sp ? "1" : "0";
      q('[data-k="d"]').value = st.d; q('[data-k="kn"]').value = st.kn; q('[data-k="pr"]').checked = st.pr;
      const upd = () => {
        const s = { w: q('[data-k="w"]').value, sp: q('[data-k="sp"]').value === "1", d: +q('[data-k="d"]').value, kn: +q('[data-k="kn"]').value, pr: q('[data-k="pr"]').checked };
        ctx.store.set("vert", s);
        q('[data-o="d"]').textContent = s.d.toFixed(1) + " mn"; q('[data-o="kn"]').textContent = s.kn.toFixed(1) + " nudos" + (s.kn === 0 ? " (parado/fondeado)" : "");
        const r = judge(s.w, s.sp, s.d, s.kn, s.pr);
        const lab = { si: ["ok", "SÍ se puede"], no: ["bad", "NO se puede"], warn: ["warn", "Con matices"] }[r.v];
        out.innerHTML = `<p class="verdict ${lab[0]}">${lab[1]}</p><p>${r.msg}</p><p class="cite">${r.cite}</p>`;
      };
      p.addEventListener("input", upd); p.addEventListener("change", upd); upd();
    }

    /* ── Títulos ── */
    function titulos() {
      const st = ctx.store.get("tit", { t: "motor", L: 7, cv: 40, r: "5", n: false, a: false });
      const p = h("div", "panel stack");
      p.innerHTML = `<div class="eyebrow">¿Qué título necesito? (RD 875/2014 + RD 1188/2025)</div>
      <div class="seg" data-k="t"><button type="button" data-v="motor">Motor</button><button type="button" data-v="vela">Vela</button><button type="button" data-v="moto">Moto náutica</button></div>
      <div class="grid">
        <label class="f">Eslora: <span class="mono" data-o="L"></span><input type="range" min="2" max="30" step="0.5" data-k="L"></label>
        <label class="f">Potencia nominal (CV): <span class="mono" data-o="cv"></span><input type="range" min="0" max="600" step="5" data-k="cv"></label>
      </div>
      <label class="f">Navegación prevista<select data-k="r">${ROUTES.map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></label>
      <div class="row"><label class="row small" style="font-weight:600"><input type="checkbox" data-k="n"> Navegación nocturna</label>
      <label class="row small" style="font-weight:600"><input type="checkbox" data-k="a"> Embarcación de alquiler</label></div>`;
      const out = h("div", "panel");
      const note = h("div", "tint small", `<b>Claves 2026.</b> PER básico: motor ≤15 m, ≤12 mn, interinsular Baleares/Canarias y motos náuticas. Con prácticas de vela: vela ≤15 m. Con prácticas complementarias: hasta 24 m y Península–Baleares (islas intermedias incluidas). Curso de operador de radio de corto alcance obligatorio para el PER. Más de 24 m = buque de recreo: los títulos de recreo no habilitan. <b>Desde el 1-oct-2026</b> (RD 1188/2025) las embarcaciones sin título (motor ≤5 m y ≤15 CV, vela ≤6 m, ≤2 mn, de día) solo para uso privado/deportivo: el <b>alquiler exige título</b>.`);
      view.append(p, out, note);
      const q = (s) => p.querySelector(s);
      const tseg = q('[data-k="t"]');
      let t = st.t;
      tseg.querySelectorAll("button").forEach((b) => (b.onclick = () => { t = b.dataset.v; upd(); }));
      q('[data-k="L"]').value = st.L; q('[data-k="cv"]').value = st.cv; q('[data-k="r"]').value = st.r; q('[data-k="n"]').checked = st.n; q('[data-k="a"]').checked = st.a;
      const upd = () => {
        const s = { t, L: +q('[data-k="L"]').value, cv: +q('[data-k="cv"]').value, r: q('[data-k="r"]').value, n: q('[data-k="n"]').checked, a: q('[data-k="a"]').checked };
        ctx.store.set("tit", s);
        tseg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === t)));
        q('[data-o="L"]').textContent = s.L.toFixed(1) + " m"; q('[data-o="cv"]').textContent = s.cv + " CV";
        const rows = titleRows(s.t, s.L, s.cv, s.r, s.n, s.a);
        out.innerHTML = `<div class="scroll-x"><table class="tt"><thead><tr><th>Título</th><th>¿Vale?</th><th>Por qué</th></tr></thead><tbody>${rows.map(([n, [c, l, m]]) => `<tr><td>${n}</td><td><span class="st ${c}">${l}</span></td><td>${m}</td></tr>`).join("")}</tbody></table></div>
        ${s.L > 24 && s.t !== "moto" ? "<p class='fb-bad' style='margin-top:.5rem'>Más de 24 m: buque de recreo, fuera del ámbito de los títulos de recreo.</p>" : ""}`;
      };
      p.addEventListener("input", upd); p.addEventListener("change", upd); upd();
    }

    /* ── Normas ── */
    function normas() {
      view.appendChild(h("p", "muted small", "Toca cada tarjeta para ver los datos que cae en el examen."));
      const g = h("div", "cards");
      CARDS.forEach((c) => {
        const b = h("button", "card"); b.type = "button"; b.setAttribute("aria-expanded", "false");
        const front = `<span class="eyebrow">${c.k}</span><span class="big">${c.big}</span><span class="muted small">Toca para ver</span>`;
        b.innerHTML = front;
        b.onclick = () => {
          const open = b.getAttribute("aria-expanded") !== "true";
          b.setAttribute("aria-expanded", String(open));
          b.innerHTML = open ? `<span class="eyebrow">${c.k} · ${c.big}</span><ul>${c.items.map((x) => `<li>${x}</li>`).join("")}</ul>` : front;
        };
        g.appendChild(b);
      });
      view.appendChild(g);
    }

    /* ── Reto ── */
    function reto() {
      const N = 12, PASS = 10;
      const p = h("div", "panel stack");
      view.appendChild(p);
      const intro = () => {
        const done = ctx.store.get("retoOk", false);
        p.innerHTML = `<div class="eyebrow">Reto final de Legislación</div><h3>${N} preguntas · aprueba con ${PASS}</h3><p class="muted">Costas, buceo, vertidos, seguro, pabellón, auxilio, títulos 2026. Cada respuesta se explica.</p>${done ? '<p><span class="chip ok">Insignia «Legislador» conseguida</span></p>' : ""}`;
        const b = h("button", "btn primary", "Empezar"); b.type = "button"; b.onclick = start; p.appendChild(b);
      };
      let qs, i, ok;
      function start() { qs = shuffle(QUIZ).slice(0, N).map((x) => { const ord = shuffle(x.o.map((_, k) => k)); return { ...x, ord }; }); i = 0; ok = 0; ask(); }
      function ask() {
        if (i >= N) return end();
        const x = qs[i];
        p.innerHTML = `<div class="row" style="justify-content:space-between"><span class="eyebrow">Pregunta ${i + 1}/${N}</span><span class="chip acc">${ok} aciertos</span></div><div class="bar"><i style="width:${(i / N) * 100}%"></i></div><p style="font-weight:600">${x.q}</p>`;
        const opts = h("div", "opts"); const fb = h("p", "");
        x.ord.forEach((k) => {
          const b = h("button", "btn opt", x.o[k]); b.type = "button";
          b.onclick = () => {
            opts.querySelectorAll("button").forEach((o) => (o.disabled = true));
            const right = k === x.a;
            if (right) ok++;
            b.classList.add(right ? "right" : "wrong");
            opts.querySelectorAll("button")[x.ord.indexOf(x.a)].classList.add("right");
            fb.innerHTML = `<span class="${right ? "fb-ok" : "fb-bad"}">${right ? "Correcto." : "No."}</span> ${x.e}`;
            const nx = h("button", "btn primary", i + 1 < N ? "Siguiente" : "Resultado"); nx.type = "button";
            nx.onclick = () => { i++; ask(); }; p.appendChild(nx); nx.focus();
          };
          opts.appendChild(b);
        });
        p.append(opts, fb);
      }
      function end() {
        const pass = ok >= PASS;
        p.innerHTML = `<div class="eyebrow">Resultado</div><p class="verdict ${pass ? "ok" : "bad"}">${ok}/${N}</p><p>${pass ? "Superado. Tienes la legislación del PER bajo control." : `Necesitas ${PASS}. Repasa el mapa, la calculadora y las tarjetas y vuelve a intentarlo.`}</p>`;
        if (pass) {
          ctx.award(ok === N ? 50 : 40, "Reto de Legislación superado");
          if (!ctx.store.get("retoOk", false)) { ctx.store.set("retoOk", true); }
          ctx.badge("legislador");
        } else if (ok > 0) ctx.award(Math.min(20, ok * 2), "Reto de Legislación: práctica");
        const b = h("button", "btn", "Repetir"); b.type = "button"; b.onclick = start; p.appendChild(b);
      }
      intro();
    }

    show(tabs.some(([k]) => k === cur) ? cur : "costa");

    return () => {
      timers.forEach(clearTimeout); timers.clear();
      root.remove();
    };
  },
};
