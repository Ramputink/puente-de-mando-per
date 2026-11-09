// Emergencias en la mar (Tema 8): árboles de decisión, clases de fuego, RCP con metrónomo y reto final.
// Contenido contrastado con las claves oficiales de q_eme.txt (2022–2026) y RCP ERC 2025.

const ID = "emergencias";

const CSS = `
.m-emergencias { display: flex; flex-direction: column; gap: 1rem; }
.m-emergencias .m-tabs { align-self: flex-start; }
.m-emergencias .m-scn { display: grid; gap: 1rem; grid-template-columns: 1fr; }
@media (min-width: 820px) { .m-emergencias .m-scn { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); } }
.m-emergencias .m-picker { display: flex; flex-wrap: wrap; gap: .4rem; }
.m-emergencias .m-picker .btn[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.m-emergencias .m-stage { aspect-ratio: 2 / 1; }
.m-emergencias .m-stage svg { width: 100%; height: 100%; }
.m-emergencias .sv-sky { fill: var(--sea); }
.m-emergencias .sv-sea { fill: var(--sea-2); }
.m-emergencias .sv-hull { fill: var(--sheet); stroke: var(--ink); stroke-width: 1.6; }
.m-emergencias .sv-line { stroke: var(--ink); stroke-width: 1.4; fill: none; }
.m-emergencias .sv-thin { stroke: var(--muted); stroke-width: 1; fill: none; stroke-dasharray: 3 3; }
.m-emergencias .sv-water { fill: #2f7fbf; opacity: .75; }
.m-emergencias .sv-rock { fill: var(--muted); }
.m-emergencias .sv-bed { fill: var(--line); }
.m-emergencias .sv-other { fill: var(--sea); stroke: var(--ink); stroke-width: 1.4; }
.m-emergencias .sv-raft { fill: #f07a1a; stroke: var(--ink); stroke-width: 1.2; }
.m-emergencias .sv-txt { fill: var(--ink); font: 600 10px var(--f-body); }
.m-emergencias .sv-mut { fill: var(--muted); font: 600 9px var(--f-body); }
.m-emergencias .sv-arrow { stroke: var(--accent); stroke-width: 2.2; fill: none; }
.m-emergencias .sv-arrowhead { fill: var(--accent); }
.m-emergencias .sv-flame { fill: #f26a1b; transform-box: fill-box; transform-origin: 50% 100%; animation: m-em-flick .5s ease-in-out infinite alternate; }
.m-emergencias .sv-flame2 { fill: #ffc531; transform-box: fill-box; transform-origin: 50% 100%; animation: m-em-flick .37s ease-in-out infinite alternate; }
.m-emergencias .sv-smoke { fill: var(--muted); opacity: .35; }
@keyframes m-em-flick { from { transform: scaleY(.85) } to { transform: scaleY(1.12) } }
.m-emergencias .m-meter { height: 8px; border-radius: 99px; background: var(--sea-2); overflow: hidden; }
.m-emergencias .m-meter > i { display: block; height: 100%; width: 0; background: var(--ok); transition: width .3s, background .3s; }
.m-emergencias .m-opts { display: flex; flex-direction: column; gap: .5rem; }
.m-emergencias .m-opt { text-align: left; justify-content: flex-start; font-weight: 600; line-height: 1.3; padding: .6em .8em; white-space: normal; }
.m-emergencias .m-opt.is-ok { border-color: var(--ok); color: var(--ok); }
.m-emergencias .m-opt.is-bad { border-color: var(--bad); color: var(--bad); text-decoration: line-through; text-decoration-thickness: 1px; }
.m-emergencias .m-fb { border-left: 4px solid var(--line); padding: .6rem .8rem; background: var(--sea); border-radius: var(--r-sm); }
.m-emergencias .m-fb.ok { border-left-color: var(--ok); }
.m-emergencias .m-fb.bad { border-left-color: var(--bad); }
.m-emergencias .m-fb p + p { margin-top: .35rem; }
.m-emergencias .m-steps { display: flex; gap: 4px; }
.m-emergencias .m-steps i { flex: 1; height: 4px; border-radius: 2px; background: var(--line); }
.m-emergencias .m-steps i.done { background: var(--accent); }
.m-emergencias .m-steps i.cur { background: var(--ink); }
.m-emergencias .m-cards { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr)); }
.m-emergencias .m-cards ul { margin: .4rem 0 0; padding-left: 1.1rem; }
.m-emergencias .m-cards li + li { margin-top: .2rem; }
.m-emergencias .m-fire-item { font: 600 1.35rem/1.15 var(--f-display); }
.m-emergencias .m-grid-btn { display: grid; gap: .45rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); }
.m-emergencias .m-grid-btn .btn { white-space: normal; line-height: 1.2; text-align: center; }
.m-emergencias .m-cpr { display: grid; gap: 1rem; grid-template-columns: 1fr; }
@media (min-width: 760px) { .m-emergencias .m-cpr { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
.m-emergencias .m-chest { position: relative; aspect-ratio: 1 / 1; max-width: 320px; width: 100%; margin: 0 auto; border-radius: 50%;
  background: var(--sea); border: 2px solid var(--line); display: grid; place-items: center; text-align: center; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
.m-emergencias .m-chest .m-ring { position: absolute; inset: 14%; border-radius: 50%; border: 6px solid var(--sea-2); transition: transform .12s ease-out, border-color .12s; }
.m-emergencias .m-chest.beat .m-ring { transform: scale(.86); border-color: var(--accent); }
.m-emergencias .m-chest.vent .m-ring { border-color: #2f7fbf; transform: scale(1.06); }
.m-emergencias .m-chest.resc .m-ring { border-color: #2f7fbf; transform: scale(1.06); }
.m-emergencias .m-big { position: relative; font: 700 clamp(2.6rem, 12vw, 4.2rem)/1 var(--f-display); }
.m-emergencias .m-lab { position: relative; font: 600 .82rem/1.2 var(--f-body); color: var(--muted); letter-spacing: .08em; text-transform: uppercase; }
.m-emergencias .m-tap { width: 100%; min-height: 64px; font-size: 1.05rem; touch-action: manipulation; }
.m-emergencias .m-rate { font: 700 1.6rem/1 var(--f-mono); }
.m-emergencias .m-depth { display: flex; gap: .6rem; align-items: stretch; }
.m-emergencias .m-depth .bar { width: 26px; border-radius: 6px; background: var(--sea-2); position: relative; min-height: 120px; }
.m-emergencias .m-depth .bar i { position: absolute; left: 0; right: 0; top: 41.6%; height: 8.4%; background: var(--ok); border-radius: 3px; }
.m-emergencias .m-q { font-weight: 700; font-size: 1.05rem; line-height: 1.35; }
.m-emergencias .m-score { font: 700 2.4rem/1 var(--f-display); }
.m-emergencias .m-phone { font: 700 1.25rem/1.2 var(--f-mono); color: var(--accent); }
`;

/* ---------------- Árboles de decisión ---------------- */
// Cada paso: s (situación), q (pregunta), o: [{t, ok, fb}] ; fb = consecuencia + porqué.
const TREES = [
  {
    id: "via", name: "Vía de agua", scene: "via",
    intro: "Velero de 9 m navegando a motor con mar de 3. Al levantar una plancha del piso ves agua en la sentina.",
    steps: [
      { q: "¿Qué haces primero?", o: [
        { t: "Pongo en marcha todas las bombas de achique (eléctricas y manual) y mantengo el motor encendido.", ok: true,
          fb: "Achicar desde el primer momento gana tiempo. El motor encendido mantiene la carga de las baterías que alimentan las bombas eléctricas y permite usar su toma de refrigeración como bomba adicional. Un tripulante a la bomba manual y el resto con baldes." },
        { t: "Apago el motor para oír mejor de dónde entra el agua.", ok: false,
          fb: "Es justo lo que el examen marca como INCORRECTO: con el motor parado pierdes carga de baterías para las bombas, la toma de refrigeración como achique adicional y capacidad de maniobra." },
        { t: "Lanzo un MAYDAY y preparo la balsa para abandonar ya.", ok: false,
          fb: "Precipitado. El socorro se pide si no puedes detener la entrada de agua, y el abandono es el último recurso: un barco medio hundido sigue siendo mejor refugio que una balsa." },
        { t: "Pruebo el agua: si es salada y fría, seguro que viene de la refrigeración del motor.", ok: false,
          fb: "El agua salada y fría indica entrada de mar, pero no «siempre» por la refrigeración: puede ser cualquier pasacascos, la bocina, la limera o un golpe en el casco." }
      ]},
      { q: "Toca localizar la entrada. ¿Dónde miras primero?", o: [
        { t: "Bocina del eje, limera del timón, grifos de fondo y pasacascos, manguitos y abrazaderas.", ok: true,
          fb: "Son los puntos de mayor riesgo: todo lo que atraviesa el casco por debajo de la flotación. Por eso se revisan en cada varada y se cierran los grifos que no se usan." },
        { t: "Lumbreras e imbornales de cubierta.", ok: false,
          fb: "Están por encima de la flotación: pueden embarcar agua de un golpe de mar, pero no son los puntos de mayor riesgo de vía de agua." },
        { t: "Escobenes y pantoques.", ok: false,
          fb: "No son los puntos críticos. Los oficiales son la bocina, la limera del timón y los grifos de fondo." }
      ]},
      { q: "Encuentras roto el pasacascos de la toma del aseo: un orificio redondo de 3 cm. ¿Cómo lo taponas?", o: [
        { t: "Cierro el grifo de fondo si aún funciona; si no, clavo un espiche cónico de madera a medida y relleno con trapos.", ok: true,
          fb: "El espiche es el tapón indicado para orificios redondeados: se aprieta de fuera hacia dentro y los huecos se rellenan con trapos o estopa. Por eso se lleva un juego de espiches junto a cada pasacascos." },
        { t: "Aplico pasta reparadora sobre el agujero con el agua entrando.", ok: false,
          fb: "La masilla no fragua con presión de agua entrando; sirve para fisuras pequeñas una vez controlada la entrada. Aquí lo eficaz es cerrar el grifo o el espiche." },
        { t: "Pongo una colchoneta encima desde dentro y me siento sobre ella.", ok: false,
          fb: "La colchoneta presionada contra el casco se reserva para agujeros grandes o irregulares. Para un orificio redondo de un pasacascos, el espiche cónico es lo correcto." }
      ]},
      { q: "Además, un golpe con un tronco ha abierto una grieta en la amura de babor, justo en la línea de flotación. ¿Cómo maniobras?", o: [
        { t: "Escoro a estribor (banda contraria) trasladando pesos, reduzco velocidad y doy un rumbo que deje la avería a sotavento.", ok: true,
          fb: "Escorando a la banda contraria la grieta queda por encima del agua y, a sotavento, no recibe los golpes de mar. Menos velocidad = menos presión de agua sobre la avería." },
        { t: "Escoro a babor para que la grieta quede bien sumergida y no salpique.", ok: false,
          fb: "Al revés: sumergirla aumenta la entrada de agua. El examen marca como incorrecto escorar «para que el orificio quede debajo del agua»." },
        { t: "Avante toda hacia puerto: cuanto antes llegue, mejor.", ok: false,
          fb: "Navegar a toda máquina aumenta la presión del agua sobre la avería y los pantocazos la agrandan. Primero controlar; luego a puerto a velocidad moderada (o varar voluntariamente en una playa si no es posible)." }
      ]},
      { q: "Las bombas no dan abasto. ¿Qué recurso extra tienes?", o: [
        { t: "Suelto el manguito de la toma de agua de mar de refrigeración, cierro el grifo de fondo y hago que el motor aspire el agua de la sentina.", ok: true,
          fb: "Es la «bomba de emergencia» de a bordo y otra razón para mantener el motor encendido. Pon un colador o trapo en el extremo para que no aspire suciedad, y vigila la temperatura." },
        { t: "Abro portillos y escotillas para que el agua salga.", ok: false,
          fb: "El agua no sale por ahí: lo que consigues es perder estanqueidad y embarcar más. Hay que aislar la zona inundada y cerrar todo." },
        { t: "Achico solo con baldes antes de seguir con las bombas.", ok: false,
          fb: "Bombas y baldes trabajan a la vez. Nunca se paran las bombas para achicar a mano." }
      ]},
      { q: "Pese a todo, el nivel sigue subiendo: no puedes detener la entrada de agua. ¿Qué es lo PRIMERO?", o: [
        { t: "Llamada de socorro: alerta LSD en canal 70 y MAYDAY por canal 16 (o 112 / 900 202 202).", ok: true,
          fb: "Clave oficial: si no puedes detener la entrada de agua, lo primero es pedir socorro. Después, aumentar la flotabilidad y prepararse para abandonar en el último momento." },
        { t: "Vacío el depósito de agua dulce al mínimo imprescindible.", ok: false,
          fb: "Es una medida correcta, pero va DESPUÉS de la llamada de socorro." },
        { t: "Abandono inmediatamente a la balsa.", ok: false,
          fb: "El abandono es lo último. Mientras el barco flote, es mejor plataforma y más visible que una balsa." }
      ]},
      { q: "Mientras llega la ayuda…", o: [
        { t: "Aligero (agua dulce al mínimo, peso inútil por la borda), sigo achicando, preparo chalecos, balsa y radiobaliza y, si hay costa cerca, varo voluntariamente en una playa.", ok: true,
          fb: "Aumentar flotabilidad y ganar tiempo. Si la costa está cerca, varar a propósito en fondo blando evita el hundimiento. El abandono, solo en el último momento." },
        { t: "Paro bombas para ahorrar batería hasta que llegue Salvamento.", ok: false,
          fb: "Parar el achique acelera el hundimiento. Se sigue achicando hasta el final." }
      ]}
    ]
  },
  {
    id: "varada", name: "Varada involuntaria", scene: "varada",
    intro: "Entrando en una cala a 5 nudos notas un golpe seco y el barco se detiene: has varado.",
    steps: [
      { q: "¿Cuál es la primera medida?", o: [
        { t: "Evaluar los daños (¿hay vía de agua?), sondar alrededor del barco y verificar el tipo de fondo.", ok: true,
          fb: "Clave oficial. Sin saber si hay vía de agua ni cómo es el fondo, cualquier maniobra puede empeorar la situación." },
        { t: "Dar atrás toda con el timón a la vía para salir antes de que el casco sufra más.", ok: false,
          fb: "Dar atrás sin evaluar puede desgarrar el casco en roca y abrir vías de agua, o hacer que la refrigeración aspire fango. Primero, evaluar." },
        { t: "Compensar la escora moviendo pesos y dar atrás con el motor.", ok: false,
          fb: "El examen lo marca INCORRECTO como prioridad tras una varada en rocas: lo primero es evaluar los daños, no maniobrar." },
        { t: "Avisar a Salvamento Marítimo y abandonar el barco.", ok: false,
          fb: "Abandonar antes de evaluar los daños es incorrecto. Avisar puede ser necesario, pero con información de tu situación real." }
      ]},
      { q: "No hay vía de agua. El fondo es de fango, hay marea, buen tiempo y la bajamar fue hace una hora. ¿Plan?", o: [
        { t: "Planificar: levantar un plano de sondas, estudiar la salida y esperar a la pleamar para maniobrar.", ok: true,
          fb: "La pleamar es el momento de marea más alta: más agua bajo la quilla. Entre dos pleamares pasan unas 12 h y media, así que la próxima llegará en unas 5 h." },
        { t: "Esperar a la bajamar, que es cuando hay más agua.", ok: false,
          fb: "La bajamar es el momento de marea MÁS BAJA. Para reflotar se espera a la pleamar." },
        { t: "Pedir un remolcador que tire de inmediato con toda su potencia.", ok: false,
          fb: "Un tirón inmediato con toda la potencia, sin planificar, puede dañar casco y cornamusas. Si se usa remolque, se tira despacio, por donde entraste y con la marea a favor." }
      ]},
      { q: "Llega la pleamar. ¿Qué te ayuda a despegarte del fango?", o: [
        { t: "Trasladar pesos para cambiar asiento y escora hacia el lado de más fondo, achicar tanques, aligerar y balancear el barco para romper la «ventosa».", ok: true,
          fb: "El fango hace de ventosa; balancear abre la «cama». Cambiar asiento y escora reduce el calado efectivo. Los pesos SÍ se pueden redistribuir." },
        { t: "Nada de mover pesos: son inamovibles y solo empeoraría la escora.", ok: false,
          fb: "Falso: redistribuir pesos (tripulación, agua, fondeo) para cambiar asiento o escora es una de las técnicas básicas de reflote." }
      ]},
      { q: "Imagina que hubieras varado en roca y, tras inspeccionar, NO hay vías de agua. ¿Qué haces?", o: [
        { t: "Dar atrás para salir por donde entraste, sin demora y con precaución.", ok: true,
          fb: "Clave oficial: «si se ha varado en fondo rocoso y no se detectan vías de agua, se dará rápidamente atrás». La condición es haber evaluado antes los daños." },
        { t: "Esperar a la bajamar para ver mejor las rocas.", ok: false,
          fb: "Con la bajamar el barco quedará más apoyado sobre la roca y puede sufrir más daños o tumbarse." }
      ]},
      { q: "Necesitas ayuda de otra embarcación para el remolque. ¿Cómo?", o: [
        { t: "Remolque firme a elementos resistentes, tiro progresivo y en la dirección de entrada, aprovechando la pleamar y con señales acordadas.", ok: true,
          fb: "La ayuda externa facilita la maniobra, pero sin tirones: los cabos y herrajes pueden partir y latigar. Factores a valorar siempre: marea, tipo de fondo, averías, pesos y medios disponibles." },
        { t: "Dar el cabo a la cornamusa de proa y que tire de golpe a toda máquina.", ok: false,
          fb: "Un tirón brusco puede arrancar la cornamusa y convertir el cabo en un látigo peligroso." }
      ]}
    ]
  },
  {
    id: "abordaje", name: "Abordaje", scene: "abordaje",
    intro: "Navegas a vela de ceñida con buen tiempo y visibilidad. Un yate a motor se acerca por tu través de estribor con demora constante.",
    steps: [
      { q: "Prevención: ¿qué haces?", o: [
        { t: "Desconfío de que respete mi preferencia: lo llamo por VHF canal 16, arranco el motor y maniobro con tiempo si no reacciona.", ok: true,
          fb: "Navegar a vela no da seguridad: hay que hacer todo lo posible para ser visto y oído (reflector de radar izado lo más alto posible, bocina en niebla, VHF), estimar rumbo y velocidad de los demás y vigilar ángulos muertos." },
        { t: "Mantengo rumbo y velocidad: el velero tiene preferencia y lo sabe.", ok: false,
          fb: "El examen marca INCORRECTO «confiar en que respetarán su preferencia». Además, la Regla 17 RIPA obliga a maniobrar si la otra no lo hace." },
        { t: "No uso el VHF: no sirve para alertar a otro buque.", ok: false,
          fb: "Al contrario: usar el VHF para alertar a un buque a rumbo de colisión es una recomendación correcta." }
      ]},
      { q: "El otro barco no reacciona y se produce el impacto. ¿Qué es lo primero?", o: [
        { t: "Evaluar a la mayor brevedad los daños sufridos y atender a los heridos.", ok: true,
          fb: "Clave oficial: lo primero es evaluar las averías (sobre todo bajo la flotación) y asistir a las personas." },
        { t: "Separarme cuanto antes del otro barco.", ok: false,
          fb: "Separar las embarcaciones sin evaluar las averías es contraproducente: el otro casco puede estar taponando el agujero." },
        { t: "Rellenar el parte amistoso con el seguro.", ok: false,
          fb: "La documentación es importante, pero nunca la prioridad: primero personas y averías." },
        { t: "Lanzar socorro y abandonar.", ok: false,
          fb: "Sin evaluar los daños no sabes si es necesario. El abandono es el último recurso." }
      ]},
      { q: "La proa del yate está incrustada en tu costado, por debajo de la flotación. Hace buen tiempo.", o: [
        { t: "No separo los barcos hasta controlar la vía de agua: preparo taponamiento, cierro compartimentos estancos y achico.", ok: true,
          fb: "Con buen tiempo no se despegan los barcos hasta controlar la avería; al separarlos se abriría de golpe la vía de agua. Con mal tiempo, los golpes entre cascos pueden agravar los daños y quizá haya que separarse antes (valoración del patrón)." },
        { t: "Doy atrás para separarme y ver la avería.", ok: false,
          fb: "Separarse dejaría entrar el agua libremente por el agujero que tapa la proa del otro barco." }
      ]},
      { q: "Avería controlada. ¿Comunicaciones?", o: [
        { t: "Informo al Centro de Coordinación de Salvamento (VHF 16) e intercambio con el otro patrón nombre y matrícula, datos del patrón y del propietario, seguro (compañía y póliza), hora y posición.", ok: true,
          fb: "Ambos patrones colaboran y se dan todos los datos (seguro, matrícula…). Comunicar el abordaje al CCS es correcto. El seguro obligatorio (RD 607/1999) cubre los daños a terceros." },
        { t: "No hace falta intercambiar nada si no hay heridos.", ok: false,
          fb: "Falso: siempre hay que intercambiar los datos y comunicarlo a la aseguradora." },
        { t: "Debo prestar asistencia legal al otro patrón.", ok: false,
          fb: "No existe esa obligación. La obligación es de AUXILIO a personas y al otro buque." }
      ]},
      { q: "El otro yate tiene una vía de agua grave. ¿Qué obligación tienes?", o: [
        { t: "Prestarle auxilio, en la medida en que pueda hacerlo sin grave peligro para mi barco y mi gente.", ok: true,
          fb: "SOLAS V/33 y la Ley 14/2014 de Navegación Marítima: deber de auxilio a personas en peligro en la mar y, tras un abordaje, al otro buque y su tripulación. Si no se presta, se anota el motivo." },
        { t: "Ninguna: la culpa es suya por no maniobrar.", ok: false,
          fb: "El deber de auxilio no depende de la culpa. Y la responsabilidad no recae «siempre en el más rápido»: se determina según el RIPA." }
      ]}
    ]
  },
  {
    id: "incendio", name: "Incendio", scene: "incendio",
    intro: "Navegas a motor con viento del N de 15 nudos. Sale humo negro de la cámara del motor, a popa.",
    steps: [
      { q: "¿Qué haces de inmediato?", o: [
        { t: "Doy la alarma, paro el motor y corto combustible, gas y electricidad (desconectador de baterías); me pongo el chaleco.", ok: true,
          fb: "Cortar el suministro elimina el combustible y la fuente de ignición eléctrica. Parar la embarcación evita que la velocidad avive el fuego." },
        { t: "Abro el cofre del motor de par en par para ver qué arde.", ok: false,
          fb: "Abrir aporta oxígeno de golpe y puede provocar una llamarada. Se descarga el extintor por la abertura mínima." },
        { t: "Llamo socorro antes de nada y mantengo el motor encendido.", ok: false,
          fb: "El examen marca incorrecta esa secuencia: primero cortar combustible/electricidad y atacar el fuego; socorro si te ves incapaz de apagarlo." }
      ]},
      { q: "¿Qué haces con la ventilación?", o: [
        { t: "Cierro escotillas, puertas y tomas de aire.", ok: true,
          fb: "Cerrar quita oxígeno (comburente) al fuego: es sofocación." },
        { t: "Lo abro todo para que salga el humo.", ok: false,
          fb: "Es lo que NO se debe hacer: alimentas el fuego con oxígeno." }
      ]},
      { q: "El foco está a popa. ¿Cómo colocas el barco respecto al viento?", o: [
        { t: "Proa al viento, para que el foco quede a sotavento y el humo y las llamas se alejen del resto del barco.", ok: true,
          fb: "El foco del incendio siempre a SOTAVENTO. Alternativa: socairear, es decir, navegar a favor del viento a su misma velocidad (viento N 10 kn → rumbo S a 10 kn) para que el viento aparente sea cero y el humo suba vertical." },
        { t: "Popa al viento, para que el foco quede a barlovento.", ok: false,
          fb: "Es la respuesta que el examen marca como lo que NO se debe hacer: con el foco a barlovento el viento empuja llamas y humo sobre todo el barco." }
      ]},
      { q: "Arde gasoil derramado junto al tanque. ¿Cómo atacas?", o: [
        { t: "Extintor de polvo seco a la BASE de las llamas con barrido, con el viento a mi espalda y una vía de escape detrás.", ok: true,
          fb: "Polvo seco: el agente más adecuado para un fuego en el tanque de combustible (clase B). Se agita antes, se ataca la base y uno se aproxima mirando al fuego, con la corriente de aire a la espalda." },
        { t: "Chorro de agua sobre el combustible.", ok: false,
          fb: "El chorro esparce el combustible ardiendo (el gasoil flota sobre el agua). Agua solo para fuegos clase A." },
        { t: "Apunto el extintor a las llamas más altas.", ok: false,
          fb: "Atacar las llamas no apaga: hay que atacar la base del fuego." }
      ]},
      { q: "El incendio crece en la popa y no puedes controlarlo.", o: [
        { t: "Llamada de socorro, chalecos, proa al viento y abandono por barlovento (por proa).", ok: true,
          fb: "Clave oficial: proa al viento y abandonar por barlovento. Así el fuego (a popa) queda a sotavento y el barco a la deriva se aleja de los náufragos." },
        { t: "Popa al viento y abandono por sotavento.", ok: false,
          fb: "Te lanzarías al agua del lado hacia el que van el humo, las llamas y la deriva del barco." }
      ]}
    ]
  },
  {
    id: "abandono", name: "Abandono", scene: "abandono",
    intro: "A 20 millas de la costa, de día, el barco se hunde sin remedio. Llevas balsa salvavidas, radiobaliza y pirotecnia.",
    steps: [
      { q: "¿Cuándo se abandona?", o: [
        { t: "Solo cuando sea seguro que el barco se pierde. Es el último recurso y lo ordena el patrón.", ok: true,
          fb: "Nunca de forma precipitada: el barco es más visible, protege más y tiene recursos. Se abandona en el último momento." },
        { t: "En cuanto entra agua, para no arriesgar.", ok: false,
          fb: "Precipitarse es uno de los errores más mortales: muchos barcos abandonados se encuentran después a flote." }
      ]},
      { q: "Antes de dejar el barco…", o: [
        { t: "Alerta LSD en canal 70 + MAYDAY por canal 16, activo la radiobaliza 406 MHz y la llevo conmigo; ropa de abrigo y chaleco.", ok: true,
          fb: "La alerta LSD va por el CANAL 70; la voz, por el 16. La radiobaliza se lleva a la balsa: es lo que te localiza." },
        { t: "Emito la alerta LSD por el canal 16.", ok: false,
          fb: "Error clásico del examen: la LSD/DSC en VHF usa el canal 70. El 16 es para la voz (MAYDAY)." },
        { t: "Activo la radiobaliza y la dejo en el barco para que marque el naufragio.", ok: false,
          fb: "Se hundiría con él. La radiobaliza va con los náufragos." }
      ]},
      { q: "La balsa:", o: [
        { t: "Amarro su boza (driza) a un punto firme de a bordo, la lanzo a sotavento y tiro de la boza para que se infle.", ok: true,
          fb: "Sin amarrar, la balsa se iría con el viento. A sotavento queda al abrigo del casco y el barco no deriva sobre ella." },
        { t: "La lanzo y tiro de la driza sin amarrarla: así se aleja del barco que se hunde.", ok: false,
          fb: "Es lo que el examen marca incorrecto: hay que amarrar la driza a bordo ANTES de lanzarla." }
      ]},
      { q: "Para pasar a la balsa:", o: [
        { t: "Embarco seco desde el barco si es posible; la boza se corta en el último momento, con todos a bordo.", ok: true,
          fb: "Embarcar seco retrasa la hipotermia. Cortar la boza al final evita que la balsa se aleje antes de tiempo." },
        { t: "Salto de cabeza para no perder el chaleco.", ok: false,
          fb: "Nunca de cabeza. Si hay que saltar: de pie, piernas juntas, sujetando el chaleco y tapándose la nariz." },
        { t: "Salto al agua y amarro mi arnés al barco para que no me arrastre la corriente.", ok: false,
          fb: "El barco que se hunde te arrastraría con él. Nada de amarrarse al barco." }
      ]},
      { q: "Un compañero cae al agua y no llega a la balsa. ¿Qué le indicas?", o: [
        { t: "Que no nade: postura fetal (HELP) o agrupado abrazado a otros, con el chaleco puesto.", ok: true,
          fb: "Nadar dispara la pérdida de calor. Si tuviera que nadar, mejor de espaldas. Nunca quitarse el chaleco ni beber agua de mar." },
        { t: "Que se mueva continuamente para generar calor.", ok: false,
          fb: "Es la respuesta incorrecta del examen: moverse aumenta la pérdida de calor por convección." }
      ]},
      { q: "¿Cuándo usas la pirotecnia?", o: [
        { t: "Cuando haya certeza de que puede ser vista desde otra embarcación, una aeronave o la costa.", ok: true,
          fb: "Hay pocas señales y duran poco (bengala ~1 min, cohete ~40 s, fumígena ~3 min). Sin nadie a la vista, se desperdician." },
        { t: "Justo después del MAYDAY, para reforzarlo.", ok: false,
          fb: "Si nadie puede verlas, se gastan inútilmente." },
        { t: "Solo de noche.", ok: false,
          fb: "De día también: la fumígena naranja es precisamente diurna, y la bengala de mano se ve de día a corta distancia." }
      ]},
      { q: "Se acerca un helicóptero de Salvamento. ¿Qué señal NO usas?", o: [
        { t: "El cohete con paracaídas.", ok: true,
          fb: "Correcto: puede alcanzar a la aeronave. Para el helicóptero: fumígena (de día, además indica el viento) o bengala de mano." },
        { t: "La señal fumígena flotante.", ok: false,
          fb: "La fumígena es ideal de día con aeronaves: indica tu posición y la dirección del viento." },
        { t: "La bengala de mano.", ok: false,
          fb: "La bengala de mano es adecuada a corta distancia." }
      ]},
      { q: "¿Cómo sostienes la bengala de mano?", o: [
        { t: "Con el brazo extendido fuera de la borda, a SOTAVENTO, alejada de personas y de la balsa.", ok: true,
          fb: "A sotavento las chispas y el humo se alejan de ti. Mejor con guantes o un trapo húmedo." },
        { t: "Con el brazo extendido a barlovento, vertical.", ok: false,
          fb: "A barlovento el viento te echa encima chispas, escoria y humo." }
      ]}
    ]
  }
];

/* ---------------- Clases de fuego ---------------- */
const CLASSES = [
  { k: "A", d: "Sólidos con brasas" }, { k: "B", d: "Líquidos y sólidos licuables" }, { k: "C", d: "Gases" },
  { k: "D", d: "Metales" }, { k: "F", d: "Aceites de cocina" }, { k: "E", d: "Eléctrico (no es clase UNE)" }
];
const AGENTS = [
  { k: "chorro", t: "Agua a chorro" }, { k: "pulv", t: "Agua pulverizada" }, { k: "espuma", t: "Espuma" },
  { k: "polvo", t: "Polvo seco ABC" }, { k: "co2", t: "CO₂" }, { k: "polvoD", t: "Polvo especial metales" }, { k: "fclass", t: "Extintor clase F / manta ignífuga" }
];
const FIRES = [
  { t: "Colchonetas y cojines de la bañera", c: "A", ok: ["pulv", "chorro", "espuma", "polvo"], why: "Sólido que deja brasas: clase A. El agua es el agente ideal (enfría); después del polvo, conviene remojar para que no se reaviven las brasas." },
  { t: "Velas y cabos estibados en el pañol", c: "A", ok: ["pulv", "chorro", "espuma", "polvo"], why: "Tejidos y fibras: clase A. Agua o espuma enfrían; el polvo ABC también sirve." },
  { t: "Gasolina derramada junto al fueraborda", c: "B", ok: ["polvo", "co2", "espuma"], why: "Líquido inflamable: clase B. Polvo seco, CO₂ o espuma. Nunca chorro de agua: esparce el combustible." },
  { t: "Gasoil en el tanque de combustible", c: "B", ok: ["polvo", "co2", "espuma"], why: "Clase B. Según la clave oficial, el agente más adecuado es el polvo seco." },
  { t: "Botes de pintura en el pañol", c: "B", ok: ["polvo", "co2", "espuma"], why: "Pinturas y disolventes: clase B." },
  { t: "Fuga de butano ardiendo en la cocina", c: "C", ok: ["polvo"], why: "Gas: clase C. Primero cerrar la llave del gas; se extingue con polvo seco. El agua es ineficaz o peligrosa." },
  { t: "Aceite ardiendo en la sartén", c: "F", ok: ["fclass"], why: "Aceites de cocina: clase F. Extintor específico clase F o tapar con manta ignífuga/tapa. Jamás agua: provoca una explosión de aceite." },
  { t: "Piezas de aleación de magnesio", c: "D", ok: ["polvoD"], why: "Metales: clase D. Solo polvo especial para metales; el agua desprende gases inflamables." },
  { t: "Cortocircuito en el cuadro eléctrico", c: "E", ok: ["co2", "polvo"], why: "En la norma UNE no hay «clase eléctrica»: es un fuego con riesgo eléctrico. Cortar la corriente y usar CO₂ o polvo (no conductores). Nunca agua sin cortar antes la corriente." }
];

/* ---------------- Reto final ---------------- */
const QUIZ = [
  { q: "Descubres agua en la sentina. ¿Qué actuación es INCORRECTA?", o: ["Apagar el motor.", "Poner en marcha todas las bombas de achique.", "Un tripulante a la bomba manual y el resto con baldes.", "Usar la toma de refrigeración del motor para succionar el agua."], why: "El motor se mantiene encendido: baterías para las bombas y toma de refrigeración como achique extra." },
  { q: "Puntos con mayor riesgo de vía de agua:", o: ["La limera del timón y la bocina.", "Los imbornales y las lumbreras.", "Los escobenes y los pantoques.", "El trancanil y la sentina."], why: "Bocina, limera y grifos de fondo atraviesan el casco bajo la flotación." },
  { q: "Vía de agua en la flotación por babor. ¿Qué conviene?", o: ["Escorar a estribor para sacar el orificio del agua.", "Escorar a babor para que quede sumergido.", "Aumentar la velocidad hacia puerto.", "Abrir los portillos para igualar el agua."], why: "Escorar a la banda contraria saca la avería del agua." },
  { q: "No puedes detener una vía de agua. ¿Qué es lo primero?", o: ["Realizar una llamada de socorro.", "Vaciar el depósito de agua dulce.", "Arrojar el peso inútil por la borda.", "Abandonar inmediatamente."], why: "Primero socorro; luego aligerar y preparar el abandono para el último momento." },
  { q: "Tras una varada involuntaria, la primera medida es:", o: ["Evaluar daños, sondar alrededor y verificar el tipo de fondo.", "Dar atrás toda con timón a la vía.", "Avisar a Salvamento y abandonar.", "Esperar a la bajamar."], why: "Sin evaluar, cualquier maniobra puede agravar la avería." },
  { q: "Para reflotar aprovechando la marea se espera a:", o: ["La pleamar; entre dos pleamares pasan unas 12 h y media.", "La bajamar; entre dos bajamares pasan unas 12 h y media.", "La pleamar; entre dos pleamares pasan unas 6 h y media.", "La bajamar; es el momento de marea más alta."], why: "Pleamar = marea más alta. Periodo semidiurno ≈ 12 h 25 min." },
  { q: "¿Qué medida es contraproducente tras un abordaje?", o: ["Separar las embarcaciones sin evaluar las averías.", "Investigar la gravedad de las averías.", "Comunicarlo al Centro de Coordinación de Salvamento.", "Cerrar los compartimentos estancos."], why: "El otro casco puede estar taponando la vía de agua." },
  { q: "Lo primero tras un abordaje es:", o: ["Evaluar los daños y atender a los heridos.", "Separarse del otro barco.", "Hacer el parte amistoso.", "Abandonar la embarcación."], why: "Personas y averías primero, a la mayor brevedad." },
  { q: "Ante un incendio a bordo, ¿qué NO se debe hacer?", o: ["Situar el foco del incendio a barlovento.", "Cortar el gas y la electricidad.", "Cerrar escotillas, puertas y tomas de aire.", "Atacar la base del fuego con el extintor adecuado."], why: "El foco siempre a sotavento." },
  { q: "Socairear el fuego es:", o: ["Navegar en la dirección del viento y a su velocidad para que el viento aparente sea cero.", "Sofocar el fuego eliminando el comburente.", "Confinar el fuego para eliminar el combustible.", "Neutralizar la reacción en cadena."], why: "Viento N de 10 kn → rumbo S a 10 kn: viento aparente cero." },
  { q: "En la extinción por sofocación se elimina:", o: ["El comburente.", "El combustible.", "La reacción en cadena.", "La energía de activación."], why: "Sofocación = quitar oxígeno. Inhibición = cortar la reacción en cadena. Enfriamiento = quitar calor." },
  { q: "Los fuegos de clase B son los de:", o: ["Combustibles líquidos como gasolina o aceite.", "Origen eléctrico.", "Sólidos como madera o caucho.", "Gases como el butano."], why: "A sólidos, B líquidos, C gases, D metales, F aceites de cocina." },
  { q: "Incendio en el tanque de combustible. Agente más adecuado:", o: ["Polvo seco.", "Chorro de agua.", "Agua pulverizada.", "Arena."], why: "Clase B: polvo seco." },
  { q: "El tetraedro del fuego lo forman:", o: ["Combustible, comburente, calor y reacción en cadena.", "Combustible, comburente y calor.", "Combustible, comburente, calor y punto de autoignición.", "Oxígeno, combustible y chispa."], why: "El cuarto elemento es la reacción en cadena." },
  { q: "Incendio grande en la popa que no controlas:", o: ["Proa al viento y abandonar por barlovento.", "Popa al viento y abandonar por barlovento.", "Popa al viento y abandonar por sotavento.", "Proa al viento y abandonar por sotavento."], why: "Fuego a sotavento y náufragos a barlovento." },
  { q: "Abandono: ¿qué afirmación es INCORRECTA?", o: ["Se emitirá una alerta LSD en el canal 16.", "Ponerse ropa de abrigo y chaleco y llevar la radiobaliza.", "Amarrar a bordo la driza de la balsa antes de lanzarla.", "Saltar de pie, piernas juntas, sujetando el chaleco y tapando la nariz."], why: "La LSD/DSC de VHF va por el canal 70." },
  { q: "Flotando en el agua tras un abandono:", o: ["Postura fetal o abrazado a otros supervivientes, sin nadar.", "Moverse continuamente para conservar el calor.", "Quitarse el chaleco para abrazarse mejor.", "Beber agua de mar en pequeñas cantidades."], why: "Nadar o moverse aumenta la pérdida de calor." },
  { q: "¿Cuándo se usan las señales pirotécnicas tras un abandono?", o: ["Cuando haya certeza de ser avistado.", "Inmediatamente después del MAYDAY.", "Solo de noche.", "Nada más embarcar en la balsa."], why: "Son pocas y duran poco." },
  { q: "Se aproxima un helicóptero. ¿Qué señal NO es recomendable?", o: ["Cohete con paracaídas.", "Bengala de mano.", "Señal fumígena flotante.", "Bengala flotante con fumígeno."], why: "El cohete puede alcanzar a la aeronave." },
  { q: "RCP en un adulto (ERC 2025):", o: ["30 compresiones : 2 ventilaciones, 100–120/min, 5–6 cm.", "15 : 2, 80/min, 3–4 cm.", "30 : 2, 60–80/min, 2–3 cm.", "Solo ventilaciones hasta que llegue ayuda."], why: "Centro del pecho, brazos rectos, dejar que el tórax se reexpanda." },
  { q: "En un ahogado que no respira con normalidad, se empieza con:", o: ["5 ventilaciones de rescate y después 30:2.", "30 compresiones y 2 ventilaciones.", "Ponerlo boca abajo para sacar el agua.", "Comprobar el pulso durante 1 minuto."], why: "La causa es la falta de oxígeno: primero 5 ventilaciones." },
  { q: "Hipotermia: ¿qué es correcto?", o: ["Temperatura < 35 °C; quitar ropa mojada, aislar y calentar el tronco sin frotar.", "Frotar enérgicamente brazos y piernas.", "Dar alcohol para que entre en calor.", "Meterlo en agua muy caliente de inmediato."], why: "Frotar o calentar primero las extremidades lleva sangre fría al corazón." },
  { q: "Hemorragia interna:", o: ["Acostar en horizontal; si pierde el conocimiento, posición lateral de seguridad.", "Dar abundante agua por vía oral.", "Masajear con fuerza la zona.", "Refrescar con paños de agua fría."], why: "Y evacuación urgente." },
  { q: "Hemorragia nasal (epistaxis):", o: ["Cabeza inclinada hacia delante y presionar ambos orificios cerca del hueso.", "Cabeza hacia atrás y taponar con gasa.", "Paño caliente sobre el tabique.", "Algodón con agua oxigenada."], why: "Hacia atrás, la sangre va a la garganta." },
  { q: "Hemorragia externa en zona compresible:", o: ["Comprimir fuerte sobre gasas limpias al menos 4–5 min y luego vendaje compresivo.", "Torniquete de inmediato y aflojarlo cada 20 min.", "Presionar por debajo de la herida.", "Lavar con agua caliente y dejar sangrar."], why: "La compresión directa es la primera medida." },
  { q: "Quemaduras: ¿qué NO se debe hacer?", o: ["Romper las ampollas y poner un vendaje compresor.", "Enfriar con agua fría unos minutos.", "Abrir la vía aérea si la quemadura impide respirar.", "Cortar la ropa sin tirar si está pegada."], why: "Las ampollas no se rompen; el vendaje no comprime." },
  { q: "¿Qué quemadura requiere evacuar a un hospital?", o: ["La que afecta a cara, cuello u orificios naturales.", "1.er grado en menos del 20 % del cuerpo.", "2.º grado en menos del 10 % del cuerpo.", "3.er grado en menos del 1 % del cuerpo."], why: "También: 1.er grado > 20 % (p. ej. 25 %) o 2.º grado ≥ 10 %." },
  { q: "Golpe de calor:", o: ["Si está consciente, darle suero oral en agua fresca y bajar la temperatura sin pasar de 38,5 °C.", "Lavarle con paños de agua caliente.", "Llevarlo a un lugar húmedo y darle un estimulante.", "Enfriarlo hasta 37,5 °C."], why: "Lugar fresco, seco y ventilado; nada de alcohol ni estimulantes." },
  { q: "Centro Radio-Médico Español (CRME):", o: ["Gratuito, 24 h todos los días, en español; tel. 91 310 34 75.", "Gratuito, en español e inglés, de 6:00 a 00:00.", "Solo por el canal 70 de VHF.", "Depende del Instituto Social de Medicina Preventiva."], why: "Depende del Instituto Social de la Marina. Consultas no urgentes: 9:00–15:00 (hora de Madrid)." },
  { q: "Mal de mar: al afectado se le mantiene…", o: ["En un lugar fresco y aireado, reclinado, con pequeñas cantidades de alimentos secos.", "Quieto, caliente y en ayunas en un camarote a proa.", "Tumbado en un camarote a popa, en ayunas.", "Bebiendo agua de mar."], why: "Cerca de la flotación y de crujía, mirando al horizonte." }
];

/* ---------------- utilidades ---------------- */
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------------- escena SVG ---------------- */
function scene(kind, risk, step) {
  const hull = `<path class="sv-hull" d="M70 92 L250 92 L262 82 L280 82 L262 112 Q160 124 84 112 Z"/>
    <line class="sv-line" x1="150" y1="92" x2="150" y2="22"/><path class="sv-thin" d="M150 26 L215 88"/>`;
  const sea = `<rect class="sv-sky" x="0" y="0" width="320" height="160"/><rect class="sv-sea" x="0" y="104" width="320" height="56"/>`;
  let extra = "";
  if (kind === "via") {
    const lvl = 116 - Math.min(1, risk) * 22; // agua interior sube con el riesgo
    extra = `<clipPath id="m-em-clip"><path d="M70 92 L250 92 L262 82 L280 82 L262 112 Q160 124 84 112 Z"/></clipPath>
      <rect class="sv-water" x="60" y="${lvl}" width="230" height="40" clip-path="url(#m-em-clip)"/>
      <path class="sv-arrow" d="M238 100 l-14 2"/><circle class="sv-arrowhead" cx="240" cy="100" r="3"/>
      <text class="sv-txt" x="200" y="140">${step >= 1 ? "bocina · limera · grifos de fondo" : "agua en la sentina"}</text>`;
  } else if (kind === "varada") {
    const tide = step >= 2 ? 98 : 104;
    extra = `<rect class="sv-sea" x="0" y="${tide}" width="320" height="${160 - tide}"/>
      <path class="sv-bed" d="M0 150 L120 140 L200 122 L320 112 L320 160 L0 160 Z"/>
      <path class="sv-rock" d="M205 124 l12 -10 l14 6 l6 10 Z"/>
      <text class="sv-txt" x="12" y="20">${step >= 2 ? "pleamar: +agua bajo la quilla" : "varado: sondar alrededor"}</text>`;
  } else if (kind === "abordaje") {
    extra = `<path class="sv-other" d="M200 30 L300 30 L300 70 L225 70 Z"/><path class="sv-other" d="M214 70 L300 70 L300 100 L232 100 Q218 86 214 70 Z"/>
      <text class="sv-txt" x="228" y="24">otro buque</text>`;
  } else if (kind === "incendio") {
    extra = `<g><path class="sv-smoke" d="M92 70 q-10 -20 6 -32 q14 -10 4 -26 q20 8 10 28 q-8 14 6 26 Z"/>
      <path class="sv-flame" d="M80 92 q4 -22 14 -26 q-2 10 8 14 q4 -14 12 -18 q2 18 6 30 Z"/>
      <path class="sv-flame2" d="M90 92 q4 -12 8 -14 q0 6 6 8 q2 -6 6 -8 q0 8 2 14 Z"/></g>
      <path class="sv-arrow" d="M300 18 L200 18"/><path class="sv-arrowhead" d="M196 18 l10 -5 l0 10 Z"/>
      <text class="sv-txt" x="214" y="36">viento</text><text class="sv-mut" x="74" y="134">popa</text><text class="sv-mut" x="246" y="134">proa</text>`;
  } else if (kind === "abandono") {
    extra = `<ellipse class="sv-raft" cx="40" cy="108" rx="24" ry="7"/><path class="sv-raft" d="M22 106 Q40 80 58 106 Z"/>
      <line class="sv-thin" x1="58" y1="104" x2="82" y2="98"/>
      <path class="sv-arrow" d="M300 18 L230 18"/><path class="sv-arrowhead" d="M226 18 l10 -5 l0 10 Z"/>
      <text class="sv-txt" x="240" y="36">viento</text><text class="sv-mut" x="12" y="132">balsa a sotavento</text>`;
  }
  const tilt = kind === "via" ? Math.min(1, risk) * 4 : kind === "varada" ? -3 : 0;
  return `<svg viewBox="0 0 320 160" role="img" aria-label="Esquema de la situación">${sea}<g transform="rotate(${tilt} 160 100)">${hull}</g>${extra}</svg>`;
}

/* ================= módulo ================= */
export default {
  id: ID,
  tema: 8,
  title: "Emergencias en la mar",
  icon: "✚",
  desc: "Decide paso a paso ante vía de agua, varada, abordaje, incendio y abandono, y practica la RCP a 110/min.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const st = document.createElement("style"); st.dataset.mod = ID; st.textContent = CSS; document.head.appendChild(st);
    }
    const store = ctx.store || { get: (k, d) => d, set: () => {} };
    const done = new Set(store.get("done", []));
    let firesOk = new Set(store.get("firesOk", []));
    const cleanups = [];

    el.innerHTML = "";
    const root = document.createElement("div");
    root.className = "m-emergencias";
    root.innerHTML = `
      <div class="stack" style="gap:.35rem">
        <span class="eyebrow">Tema 8 · Emergencias en la mar</span>
        <h2>Qué hacer cuando todo va mal</h2>
        <p class="muted">Elige la acción en cada paso y mira la consecuencia. Salvamento: <b class="mono">900 202 202</b> · <b class="mono">112</b> · VHF canal 16 (voz) · alerta LSD canal 70.</p>
      </div>
      <div class="seg m-tabs" role="tablist">
        <button data-tab="tree" aria-pressed="true">Situaciones</button>
        <button data-tab="fire" aria-pressed="false">Clases de fuego</button>
        <button data-tab="aid" aria-pressed="false">Primeros auxilios</button>
        <button data-tab="quiz" aria-pressed="false">Reto</button>
      </div>
      <div data-pane="tree"></div><div data-pane="fire" hidden></div><div data-pane="aid" hidden></div><div data-pane="quiz" hidden></div>`;
    el.appendChild(root);
    const panes = Object.fromEntries([...root.querySelectorAll("[data-pane]")].map((p) => [p.dataset.pane, p]));
    root.querySelector(".m-tabs").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-tab]"); if (!b) return;
      root.querySelectorAll(".m-tabs button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      for (const k in panes) panes[k].hidden = k !== b.dataset.tab;
      if (b.dataset.tab !== "aid") cpr.stop();
    });

    /* ---------- Situaciones ---------- */
    let cur = null;
    function renderTreePicker() {
      const p = panes.tree;
      p.innerHTML = `<div class="stack">
        <div class="m-picker">${TREES.map((t) => `<button class="btn sm" data-tree="${t.id}" aria-pressed="false">${esc(t.name)}${done.has(t.id) ? " ✓" : ""}</button>`).join("")}</div>
        <div class="m-scn">
          <div class="stack"><div class="stage m-stage" data-svg></div><div class="m-meter" title="Control de la situación"><i data-meter></i></div>
            <p class="small muted" data-intro></p></div>
          <div class="panel stack" data-play></div>
        </div></div>`;
      p.querySelector(".m-picker").addEventListener("click", (e) => {
        const b = e.target.closest("[data-tree]"); if (b) startTree(b.dataset.tree);
      });
      startTree(cur ? cur.t.id : TREES[0].id);
    }
    function startTree(id) {
      const t = TREES.find((x) => x.id === id);
      cur = { t, i: 0, risk: 0.15, firstTry: true, mistakes: 0, answered: false };
      panes.tree.querySelectorAll("[data-tree]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tree === id)));
      panes.tree.querySelector("[data-intro]").textContent = t.intro;
      renderStep();
    }
    function paintScene() {
      panes.tree.querySelector("[data-svg]").innerHTML = scene(cur.t.scene, cur.risk, cur.i);
      const m = panes.tree.querySelector("[data-meter]");
      const ctl = Math.max(0, Math.min(1, 1 - cur.risk));
      m.style.width = Math.round(ctl * 100) + "%";
      m.style.background = ctl > .6 ? "var(--ok)" : ctl > .3 ? "var(--warn)" : "var(--bad)";
    }
    function renderStep() {
      const { t, i } = cur;
      const play = panes.tree.querySelector("[data-play]");
      paintScene();
      if (i >= t.steps.length) {
        const perfect = cur.mistakes === 0;
        play.innerHTML = `<div class="m-steps">${t.steps.map(() => `<i class="done"></i>`).join("")}</div>
          <span class="eyebrow">${esc(t.name)} · resuelto</span>
          <h3>${perfect ? "Sin un solo error" : `Resuelto con ${cur.mistakes} error${cur.mistakes > 1 ? "es" : ""}`}</h3>
          <p>${perfect ? "Has tomado todas las decisiones correctas a la primera." : "Repite la situación hasta resolverla sin fallos: así se fija el orden de las acciones."}</p>
          <div class="row"><button class="btn" data-again>Repetir</button><button class="btn primary" data-next>Siguiente situación</button></div>`;
        if (!done.has(t.id)) { done.add(t.id); store.set("done", [...done]); ctx.award(30, `Emergencia resuelta: ${t.name}`);
          panes.tree.querySelector(`[data-tree="${t.id}"]`).textContent = t.name + " ✓"; }
        play.querySelector("[data-again]").onclick = () => startTree(t.id);
        play.querySelector("[data-next]").onclick = () => { const k = TREES.indexOf(t); startTree(TREES[(k + 1) % TREES.length].id); };
        return;
      }
      const s = t.steps[i];
      cur.answered = false; cur.firstTry = true;
      const opts = shuffle(s.o);
      play.innerHTML = `<div class="m-steps">${t.steps.map((_, k) => `<i class="${k < i ? "done" : k === i ? "cur" : ""}"></i>`).join("")}</div>
        <span class="eyebrow">${esc(t.name)} · paso ${i + 1} de ${t.steps.length}</span>
        <p class="m-q">${esc(s.q)}</p>
        <div class="m-opts">${opts.map((o, k) => `<button class="btn m-opt" data-k="${k}">${esc(o.t)}</button>`).join("")}</div>
        <div data-fb></div>`;
      play.querySelector(".m-opts").addEventListener("click", (e) => {
        const b = e.target.closest(".m-opt"); if (!b || cur.answered || b.disabled) return;
        const o = opts[+b.dataset.k];
        const fb = play.querySelector("[data-fb]");
        if (o.ok) {
          cur.answered = true;
          b.classList.add("is-ok");
          play.querySelectorAll(".m-opt").forEach((x) => (x.disabled = true));
          if (cur.firstTry) ctx.award(5, "Decisión correcta");
          cur.risk = Math.max(0, cur.risk - 0.12);
          fb.innerHTML = `<div class="m-fb ok"><p class="fb-ok">Correcto</p><p>${esc(o.fb)}</p></div><div class="row" style="margin-top:.6rem"><button class="btn primary" data-go>Continuar</button></div>`;
          fb.querySelector("[data-go]").onclick = () => { cur.i++; renderStep(); };
          fb.querySelector("[data-go]").focus({ preventScroll: true });
        } else {
          cur.firstTry = false; cur.mistakes++;
          b.classList.add("is-bad"); b.disabled = true;
          cur.risk = Math.min(1, cur.risk + 0.22);
          fb.innerHTML = `<div class="m-fb bad"><p class="fb-bad">Consecuencia</p><p>${esc(o.fb)}</p><p class="small muted">Elige otra acción.</p></div>`;
        }
        paintScene();
      });
    }
    renderTreePicker();

    /* ---------- Clases de fuego ---------- */
    let fq = [], fi = 0, fstage = 0, fscore = 0, fClassOk = true;
    function startFire() { fq = shuffle(FIRES); fi = 0; fscore = 0; renderFire(); }
    function renderFire() {
      const p = panes.fire;
      if (fi >= fq.length) {
        const all = fscore === fq.length;
        p.innerHTML = `<div class="panel stack"><span class="eyebrow">Resultado</span><div class="m-score">${fscore}/${fq.length}</div>
          <p>${all ? "Clase y agente correctos en todos los fuegos." : "Repite hasta acertar todos: clase y agente a la primera."}</p>
          <div class="row"><button class="btn primary" data-re>Otra ronda</button></div></div>${fireRef()}`;
        if (all && !store.get("fireAll", false)) { store.set("fireAll", true); ctx.award(30, "Clases de fuego dominadas"); }
        p.querySelector("[data-re]").onclick = startFire;
        return;
      }
      const f = fq[fi]; fstage = 0; fClassOk = true;
      p.innerHTML = `<div class="stack">
        <div class="panel stack">
          <div class="row" style="justify-content:space-between"><span class="eyebrow">Fuego ${fi + 1} de ${fq.length}</span><span class="chip acc">${fscore} aciertos</span></div>
          <div class="m-fire-item">Arde: ${esc(f.t)}</div>
          <p class="small muted" data-ask>1 · ¿Qué clase de fuego es?</p>
          <div class="m-grid-btn" data-cls>${CLASSES.map((c) => `<button class="btn" data-c="${c.k}"><span><b>${c.k === "E" ? "—" : c.k}</b> · ${esc(c.d)}</span></button>`).join("")}</div>
          <div class="m-grid-btn" data-ag hidden>${AGENTS.map((a) => `<button class="btn" data-a="${a.k}">${esc(a.t)}</button>`).join("")}</div>
          <div data-fb></div>
        </div>${fireRef()}</div>`;
      const fb = p.querySelector("[data-fb]");
      p.querySelector("[data-cls]").addEventListener("click", (e) => {
        const b = e.target.closest("[data-c]"); if (!b || fstage !== 0) return;
        if (b.dataset.c === f.c) {
          fstage = 1; b.classList.add("is-ok"); b.style.borderColor = "var(--ok)";
          p.querySelectorAll("[data-c]").forEach((x) => (x.disabled = x !== b));
          p.querySelector("[data-ask]").textContent = "2 · ¿Con qué lo apagas? (elige un agente adecuado)";
          p.querySelector("[data-ag]").hidden = false;
          fb.innerHTML = "";
        } else {
          fClassOk = false; b.disabled = true;
          const c = CLASSES.find((x) => x.k === b.dataset.c);
          fb.innerHTML = `<div class="m-fb bad"><p class="fb-bad">No</p><p>${b.dataset.c === "E" ? "La clasificación UNE (EN 2) no tiene clase eléctrica: el riesgo eléctrico se añade al material que arde." : `Clase ${c.k} = ${esc(c.d.toLowerCase())}.`} Fíjate en el material que arde.</p></div>`;
        }
      });
      p.querySelector("[data-ag]").addEventListener("click", (e) => {
        const b = e.target.closest("[data-a]"); if (!b || fstage !== 1) return;
        if (f.ok.includes(b.dataset.a)) {
          fstage = 2; b.style.borderColor = "var(--ok)"; b.style.color = "var(--ok)";
          p.querySelectorAll("[data-a]").forEach((x) => (x.disabled = true));
          if (fClassOk) { fscore++; firesOk.add(f.t); store.set("firesOk", [...firesOk]); ctx.award(5, "Fuego bien clasificado"); }
          const valid = f.ok.map((k) => AGENTS.find((a) => a.k === k).t).join(", ");
          fb.innerHTML = `<div class="m-fb ok"><p class="fb-ok">${fClassOk ? "Correcto" : "Agente correcto (la clase falló)"}</p><p>${esc(f.why)}</p><p class="small muted">Agentes válidos: ${esc(valid)}.</p></div>
            <div class="row" style="margin-top:.6rem"><button class="btn primary" data-n>Siguiente</button></div>`;
          fb.querySelector("[data-n]").onclick = () => { fi++; renderFire(); };
        } else {
          fClassOk = false; b.disabled = true; b.style.textDecoration = "line-through";
          fb.innerHTML = `<div class="m-fb bad"><p class="fb-bad">No es adecuado</p><p>${esc(agentWhyNot(b.dataset.a, f))}</p></div>`;
        }
      });
    }
    function agentWhyNot(a, f) {
      if (a === "chorro" || a === "pulv") return f.c === "F" ? "Agua sobre aceite ardiendo: se vaporiza de golpe y proyecta aceite en llamas." : f.c === "D" ? "El agua reacciona con metales ardiendo y desprende gases inflamables." : f.c === "E" ? "El agua conduce la electricidad." : "El agua es ineficaz o peligrosa aquí: esparce el líquido o no apaga el gas.";
      if (a === "co2") return f.c === "A" ? "El CO₂ apenas enfría y no penetra en las brasas: el fuego de sólidos se reaviva." : "El CO₂ no es el agente indicado para esta clase.";
      if (a === "polvoD") return "El polvo especial D es solo para metales.";
      if (a === "fclass") return "El agente clase F es específico de aceites de cocina.";
      if (a === "espuma") return "La espuma conduce la electricidad y no sirve para gases ni metales.";
      return "Para esta clase no es el agente adecuado.";
    }
    function fireRef() {
      return `<details class="tint" style="margin-top:1rem"><summary><b>Chuleta: fuego, clases y extinción</b></summary>
        <div class="m-cards" style="margin-top:.8rem">
          <div><h4>Tetraedro del fuego</h4><ul><li>Combustible · comburente (O₂) · calor · <b>reacción en cadena</b>.</li>
            <li><b>Enfriamiento</b>: quita calor (agua). <b>Sofocación</b>: quita comburente (cerrar, CO₂, espuma, manta). <b>Dispersión/aislamiento</b>: quita combustible. <b>Inhibición</b>: corta la reacción en cadena (polvo).</li></ul></div>
          <div><h4>Clases UNE-EN 2</h4><ul><li><b>A</b> sólidos con brasas (madera, tela, cabos).</li><li><b>B</b> líquidos y sólidos licuables (gasolina, gasoil, pintura).</li><li><b>C</b> gases (butano, propano).</li><li><b>D</b> metales.</li><li><b>F</b> aceites de cocina.</li><li>Eléctrico: no es clase; cortar corriente.</li></ul></div>
          <div><h4>A bordo</h4><ul><li>Extintores tipo <b>34B</b> (RD 339/2021): polvo seco, CO₂ o espuma.</li><li>Polvo: agitar, a la base con barrido, viento a la espalda, hasta ~1 m.</li><li>Lugares de riesgo: cocina, cámara de motores, tomas de combustible, baterías, instalación eléctrica, pañol de pinturas.</li><li>Foco siempre a <b>sotavento</b>; o socairear.</li></ul></div>
        </div></details>`;
    }
    startFire();

    /* ---------- Primeros auxilios: RCP ---------- */
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    panes.aid.innerHTML = `<div class="stack">
      <div class="m-cpr">
        <div class="panel stack">
          <span class="eyebrow">RCP · ERC 2025</span>
          <h3>Metrónomo de compresiones</h3>
          <div class="m-chest" data-chest aria-live="off"><div class="m-ring"></div>
            <div class="stack" style="gap:.2rem;align-items:center"><span class="m-big" data-cnt>30:2</span><span class="m-lab" data-ph>Pulsa Iniciar</span></div></div>
          <div class="row">
            <button class="btn primary" data-start>Iniciar</button>
            <div class="seg" data-mode><button data-m="adulto" aria-pressed="true">Adulto</button><button data-m="ahogado" aria-pressed="false">Ahogamiento</button></div>
            <label class="row small" style="gap:.3rem"><input type="checkbox" data-snd checked> Sonido</label>
          </div>
          <p class="small muted" data-cycles>110 compresiones/min · 30 compresiones : 2 ventilaciones.</p>
        </div>
        <div class="panel stack">
          <span class="eyebrow">Practica el ritmo</span>
          <p class="small">Pulsa al ritmo de las compresiones (con el metrónomo apagado, a ver si lo mantienes). Objetivo: 100–120/min.</p>
          <button class="btn m-tap" data-tap>Comprimir</button>
          <div class="row" style="justify-content:space-between"><span class="m-rate" data-rate>— /min</span><span data-ratefb class="small muted">Haz al menos 6 pulsaciones</span></div>
          <div class="m-depth"><div class="bar" aria-hidden="true"><i></i></div>
            <div class="small stack" style="gap:.3rem"><b>Profundidad 5–6 cm</b><span>Talón de la mano en el centro del pecho (mitad inferior del esternón), brazos rectos, hombros en la vertical.</span><span>Deja que el tórax se reexpanda del todo; minimiza las pausas (&lt; 10 s para ventilar).</span></div></div>
        </div>
      </div>
      <div class="m-cards">
        <div class="panel"><h4>Cadena de actuación</h4><ol style="margin:.4rem 0 0;padding-left:1.2rem">
          <li>Seguridad: ¿es seguro acercarse?</li><li>¿Responde? Si no: pide ayuda (VHF 16 / alerta LSD 70 / 112) y pide un DEA si lo hay.</li>
          <li>Abre la vía aérea y comprueba si respira con normalidad (≤ 10 s).</li><li>No respira con normalidad: <b>30 compresiones + 2 ventilaciones</b>, sin parar hasta que llegue ayuda o se recupere.</li>
          <li><b>Ahogamiento</b>: empieza con <b>5 ventilaciones de rescate</b> y sigue 30:2.</li></ol></div>
        <div class="panel"><h4>Hipotermia (&lt; 35 °C)</h4><ul>
          <li>Sacar del agua en <b>horizontal</b> y manejar con suavidad.</li><li>Quitar la ropa mojada, secar, aislar del viento y del suelo (mantas, manta térmica).</li>
          <li>Calentar el <b>tronco</b> (tórax, axilas, ingles), no las extremidades.</li><li><b>No frotar</b> ni dar masajes; nada de alcohol. Bebidas calientes azucaradas solo si está consciente.</li>
          <li>Inconsciente que respira: posición lateral de seguridad; si no respira, RCP.</li></ul></div>
        <div class="panel"><h4>Hemorragias</h4><ul>
          <li><b>Externa</b>: comprimir fuerte con la mano sobre gasas limpias al menos <b>4–5 min</b>; después vendaje compresivo.</li>
          <li>Torniquete solo si la compresión no basta en un miembro: entre la herida y el corazón, anotar la hora y no aflojarlo.</li>
          <li><b>Interna</b>: acostar en horizontal; si pierde el conocimiento, posición lateral de seguridad. Evacuar.</li>
          <li><b>Nasal</b>: cabeza hacia delante y presionar ambos orificios junto al hueso.</li></ul></div>
        <div class="panel"><h4>Quemaduras</h4><ul>
          <li>Enfriar con agua fría (no helada) unos minutos; cortar la ropa sin tirar si está pegada.</li>
          <li><b>No romper las ampollas</b>; cubrir con apósito estéril, sin comprimir. Elevar brazos/piernas quemados.</li>
          <li>Articulación con 2.º grado o más: inmovilizar.</li>
          <li><b>Evacuar</b>: cara, cuello, manos u orificios naturales; inhalación; 1.er grado &gt; 20 %; 2.º grado ≥ 10 %; 3.er grado ≥ 1 %.</li></ul></div>
        <div class="panel"><h4>Golpe de calor y mareo</h4><ul>
          <li>Golpe de calor: lugar fresco, seco y ventilado; enfriar sin bajar de <b>38,5 °C</b>; suero oral en agua fresca si está consciente; nada de alcohol ni estimulantes.</li>
          <li>Mal de mar: lugar fresco y aireado, cerca de la flotación y de crujía, reclinado, mirando al horizonte; pequeñas cantidades de alimentos secos.</li></ul></div>
        <div class="panel"><h4>Centro Radio-Médico Español</h4><p class="m-phone">91 310 34 75</p><ul>
          <li>Gratuito, <b>24 h</b>, todos los días del año, en <b>español</b>.</li><li>Depende del Instituto Social de la Marina (ISM); conectado con Salvamento Marítimo para evacuaciones.</li>
          <li>Consultas no urgentes o de control: de 9:00 a 15:00 (hora de Madrid).</li><li>Lleva a bordo la Guía Sanitaria a Bordo del ISM.</li></ul></div>
      </div></div>`;

    const cpr = (() => {
      const chest = panes.aid.querySelector("[data-chest]");
      const cnt = panes.aid.querySelector("[data-cnt]");
      const ph = panes.aid.querySelector("[data-ph]");
      const btn = panes.aid.querySelector("[data-start]");
      const snd = panes.aid.querySelector("[data-snd]");
      const cyc = panes.aid.querySelector("[data-cycles]");
      let mode = "adulto", running = false, ac = null, gain = null, timer = 0, raf = 0;
      let nextT = 0, seq = [], queue = [], cycles = 0, flashT = 0;
      const BEAT = 60 / 110;
      const clock = () => (ac ? ac.currentTime : performance.now() / 1000);
      function buildCycle(first) {
        const s = [];
        if (first && mode === "ahogado") for (let k = 1; k <= 5; k++) s.push({ type: "r", n: k, dt: 1.6 });
        for (let k = 1; k <= 30; k++) s.push({ type: "c", n: k, dt: k === 30 ? 0.9 : BEAT });
        s.push({ type: "v", n: 1, dt: 1.6 }); s.push({ type: "v", n: 2, dt: 1.4 });
        return s;
      }
      function beep(t, freq, dur, vol) {
        if (!ac || !snd.checked) return;
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(gain); o.start(t); o.stop(t + dur + 0.02);
      }
      function schedule() {
        const now = clock();
        while (nextT < now + 0.15) {
          if (!seq.length) { seq = buildCycle(false); }
          const ev = seq.shift();
          ev.t = nextT; queue.push(ev);
          if (ev.type === "c") beep(ev.t, ev.n === 1 ? 1320 : 880, 0.06, ev.n === 1 ? 0.5 : 0.35);
          else beep(ev.t, 440, 0.5, 0.25);
          nextT += ev.dt;
        }
      }
      function frame() {
        const now = clock();
        while (queue.length && queue[0].t <= now) {
          const ev = queue.shift();
          chest.classList.remove("beat", "vent", "resc");
          if (ev.type === "c") { cnt.textContent = ev.n; ph.textContent = "Compresiones"; chest.classList.add("beat"); flashT = now + 0.15; }
          else if (ev.type === "v") { cnt.textContent = "V" + ev.n; ph.textContent = "Ventilación " + ev.n + " de 2"; chest.classList.add("vent"); flashT = now + 1.0; if (ev.n === 2) { cycles++; cyc.textContent = `Ciclos 30:2 completados: ${cycles}. Sigue hasta que llegue ayuda o la víctima respire con normalidad.`; } }
          else { cnt.textContent = "R" + ev.n; ph.textContent = `Ventilación de rescate ${ev.n} de 5`; chest.classList.add("resc"); flashT = now + 1.0; }
        }
        if (flashT && now > flashT) { chest.classList.remove("beat", "vent", "resc"); flashT = 0; }
        raf = requestAnimationFrame(frame);
      }
      async function start() {
        if (running) return;
        try {
          if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { ac = new AC(); gain = ac.createGain(); gain.gain.value = 0.8; gain.connect(ac.destination); } }
          if (ac && ac.state === "suspended") await ac.resume();
        } catch { ac = null; }
        running = true; cycles = 0; queue = []; seq = buildCycle(true);
        nextT = clock() + 0.3;
        cyc.textContent = mode === "ahogado" ? "Ahogamiento: 5 ventilaciones de rescate y después 30:2 a 110/min." : "110 compresiones/min · 30 compresiones : 2 ventilaciones.";
        timer = setInterval(schedule, 25); schedule();
        raf = requestAnimationFrame(frame);
        btn.textContent = "Parar";
        if (!store.get("cprUsed", false)) { store.set("cprUsed", true); ctx.award(10, "Metrónomo de RCP"); }
      }
      function stop() {
        if (!running) return;
        running = false; clearInterval(timer); cancelAnimationFrame(raf); timer = 0; raf = 0;
        queue = []; seq = [];
        chest.classList.remove("beat", "vent", "resc");
        cnt.textContent = "30:2"; ph.textContent = "Pulsa Iniciar"; btn.textContent = "Iniciar";
        if (ac && ac.state === "running") ac.suspend().catch(() => {});
      }
      btn.addEventListener("click", () => (running ? stop() : start()));
      panes.aid.querySelector("[data-mode]").addEventListener("click", (e) => {
        const b = e.target.closest("[data-m]"); if (!b) return;
        mode = b.dataset.m;
        panes.aid.querySelectorAll("[data-m]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        if (running) { stop(); start(); }
      });
      // Practica del ritmo
      const tap = panes.aid.querySelector("[data-tap]");
      const rateEl = panes.aid.querySelector("[data-rate]");
      const rateFb = panes.aid.querySelector("[data-ratefb]");
      let taps = [], good = 0, tapAwarded = store.get("tapOk", false);
      tap.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const t = performance.now();
        if (taps.length && t - taps[taps.length - 1] > 2000) { taps = []; good = 0; }
        taps.push(t); if (taps.length > 9) taps.shift();
        if (!reduce) { tap.style.transform = "scale(.97)"; setTimeout(() => (tap.style.transform = ""), 90); }
        if (taps.length < 6) { rateFb.textContent = `Sigue… (${taps.length})`; rateEl.textContent = "— /min"; return; }
        const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
        const rate = Math.round(60000 / iv);
        rateEl.textContent = rate + " /min";
        if (rate < 100) { rateFb.innerHTML = `<span class="fb-bad">Lento: acelera</span>`; good = 0; }
        else if (rate > 120) { rateFb.innerHTML = `<span class="fb-bad">Demasiado rápido</span>`; good = 0; }
        else { good++; rateFb.innerHTML = `<span class="fb-ok">Buen ritmo</span> · ${Math.min(good, 30)}/30`; }
        if (good >= 30 && !tapAwarded) { tapAwarded = true; store.set("tapOk", true); ctx.award(15, "30 compresiones a buen ritmo"); ctx.toast("30 compresiones seguidas entre 100 y 120/min"); }
      });
      return { stop, isRunning: () => running, dispose() { stop(); try { ac && ac.close(); } catch {} ac = null; } };
    })();
    cleanups.push(() => cpr.dispose());

    /* ---------- Reto final ---------- */
    let qz = [], qi = 0, qok = 0;
    function startQuiz() {
      qz = shuffle(QUIZ).slice(0, 10).map((x) => ({ ...x, opts: shuffle(x.o.map((t, k) => ({ t, ok: k === 0 }))) }));
      qi = 0; qok = 0; renderQuiz();
    }
    function renderQuiz() {
      const p = panes.quiz;
      const best = store.get("best", 0);
      if (qi >= qz.length) {
        const pass = qok >= 8;
        if (qok > best) store.set("best", qok);
        p.innerHTML = `<div class="panel stack"><span class="eyebrow">Reto de emergencias</span><div class="m-score">${qok}/10</div>
          <p>${pass ? "Superado: dominas las emergencias y los primeros auxilios del examen." : "Necesitas 8 aciertos de 10. Repasa las situaciones y vuelve a intentarlo."}</p>
          <div class="row"><button class="btn primary" data-re>${pass ? "Otra ronda" : "Reintentar"}</button></div></div>`;
        if (pass) {
          if (!store.get("badge", false)) { store.set("badge", true); ctx.award(40, "Reto de emergencias superado"); ctx.toast("Insignia: Primeros auxilios"); }
          ctx.badge("primeros-auxilios");
        }
        p.querySelector("[data-re]").onclick = startQuiz;
        return;
      }
      const it = qz[qi];
      p.innerHTML = `<div class="panel stack">
        <div class="row" style="justify-content:space-between"><span class="eyebrow">Pregunta ${qi + 1} de 10 · necesitas 8</span><span class="chip acc">${qok} aciertos${best ? ` · mejor ${best}` : ""}</span></div>
        <p class="m-q">${esc(it.q)}</p>
        <div class="m-opts">${it.opts.map((o, k) => `<button class="btn m-opt" data-k="${k}">${String.fromCharCode(97 + k)}) ${esc(o.t)}</button>`).join("")}</div>
        <div data-fb></div></div>`;
      let answered = false;
      p.querySelector(".m-opts").addEventListener("click", (e) => {
        const b = e.target.closest(".m-opt"); if (!b || answered) return;
        answered = true;
        const o = it.opts[+b.dataset.k];
        p.querySelectorAll(".m-opt").forEach((x, k) => { x.disabled = true; if (it.opts[k].ok) x.classList.add("is-ok"); });
        if (o.ok) { qok++; ctx.award(5, "Acierto en el reto"); } else b.classList.add("is-bad");
        const fb = p.querySelector("[data-fb]");
        fb.innerHTML = `<div class="m-fb ${o.ok ? "ok" : "bad"}"><p class="${o.ok ? "fb-ok" : "fb-bad"}">${o.ok ? "Correcto" : "Incorrecto"}</p><p>${esc(it.why)}</p></div>
          <div class="row" style="margin-top:.6rem"><button class="btn primary" data-n>${qi === 9 ? "Ver resultado" : "Siguiente"}</button></div>`;
        fb.querySelector("[data-n]").onclick = () => { qi++; renderQuiz(); };
      });
    }
    panes.quiz.innerHTML = `<div class="panel stack"><span class="eyebrow">Reto final</span><h3>10 preguntas de examen</h3>
      <p>Vía de agua, varada, abordaje, incendio, abandono y primeros auxilios. Con 8 aciertos ganas la insignia <b>Primeros auxilios</b>.</p>
      <div class="row"><button class="btn primary" data-go>Empezar</button></div></div>`;
    panes.quiz.querySelector("[data-go]").onclick = startQuiz;

    /* ---------- visibilidad y limpieza ---------- */
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((ents) => { for (const e of ents) if (!e.isIntersecting) cpr.stop(); });
      io.observe(panes.aid);
      cleanups.push(() => io.disconnect());
    }
    const onVis = () => { if (document.hidden) cpr.stop(); };
    document.addEventListener("visibilitychange", onVis);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVis));

    return () => { cleanups.forEach((f) => { try { f(); } catch {} }); el.innerHTML = ""; };
  }
};
