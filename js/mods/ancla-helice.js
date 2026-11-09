import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const ID = "ancla-helice";
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const CSS = `
.m-ancla-helice{--ah-gap:1rem}
.m-ancla-helice .ah-main{display:grid;gap:var(--ah-gap);grid-template-columns:minmax(0,1fr)}
@media (min-width:880px){.m-ancla-helice .ah-main{grid-template-columns:minmax(0,1.55fr) minmax(260px,1fr)}}
.m-ancla-helice .ah-stage{aspect-ratio:4/3;max-height:68vh;min-height:280px;touch-action:none}
.m-ancla-helice .ah-stage canvas{cursor:grab}
.m-ancla-helice .ah-stage canvas:active{cursor:grabbing}
.m-ancla-helice .ah-label{position:absolute;left:0;top:0;transform:translate(-50%,-135%);pointer-events:none;background:var(--sheet);color:var(--ink);border:1px solid var(--accent);border-radius:var(--r-sm);padding:.15em .55em;font:600 .82rem/1.3 var(--f-body);white-space:nowrap;box-shadow:var(--shadow);z-index:2}
.m-ancla-helice .ah-label::after{content:"";position:absolute;left:50%;bottom:-6px;width:8px;height:8px;background:var(--accent);border-radius:50%;transform:translate(-50%,50%) translateY(10px)}
.m-ancla-helice .ah-hint{position:absolute;left:.5rem;top:.5rem;right:.5rem;pointer-events:none;display:flex;flex-wrap:wrap;gap:.35rem;z-index:1}
.m-ancla-helice .ah-hint .chip{background:color-mix(in srgb,var(--sheet) 88%,transparent)}
.m-ancla-helice .ah-parts{gap:.4rem}
.m-ancla-helice .ah-parts .chip{cursor:pointer;min-height:32px;font-size:.82rem}
.m-ancla-helice .ah-parts .chip[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.m-ancla-helice .ah-parts .chip.seen:not([aria-pressed="true"]){border-color:var(--ok)}
.m-ancla-helice .ah-ficha h4{color:var(--accent)}
.m-ancla-helice .ah-info ul{margin:.3rem 0 0;padding-left:1.1rem}
.m-ancla-helice .ah-info li{margin:.15rem 0}
.m-ancla-helice .ah-pc{display:grid;gap:.6rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))}
.m-ancla-helice .ah-pc .pro b{color:var(--ok)}
.m-ancla-helice .ah-pc .con b{color:var(--bad)}
.m-ancla-helice .ah-svg{width:100%;max-width:240px;margin:0 auto;display:block}
.m-ancla-helice .ah-svg .hull{fill:var(--sheet);stroke:var(--ink);stroke-width:1.5}
.m-ancla-helice .ah-svg .cl{stroke:var(--line);stroke-dasharray:4 4}
.m-ancla-helice .ah-svg .br{fill:var(--port);font:700 13px var(--f-body)}
.m-ancla-helice .ah-svg .er{fill:var(--stbd);font:700 13px var(--f-body)}
.m-ancla-helice .ah-svg .lb{fill:var(--muted);font:600 11px var(--f-body)}
.m-ancla-helice .ah-svg .mv{stroke:var(--muted);stroke-width:3;fill:none}
.m-ancla-helice .ah-svg .lat{stroke:var(--accent);stroke-width:4;fill:none}
.m-ancla-helice .ah-svg .bow{stroke:var(--accent);stroke-width:2.5;fill:none;stroke-dasharray:5 4;opacity:.75}
.m-ancla-helice .ah-svg .prop{fill:var(--buoy-y);stroke:var(--ink);stroke-width:1}
.m-ancla-helice .ah-svg .ok{fill:var(--ok);font:700 12px var(--f-body)}
.m-ancla-helice details summary{cursor:pointer;font-weight:600}
.m-ancla-helice .ah-q-opts{display:grid;gap:.5rem}
.m-ancla-helice .ah-q-opts .btn{justify-content:flex-start;text-align:left;white-space:normal;height:auto;line-height:1.35;padding:.6em .9em}
.m-ancla-helice .ah-q-opts .btn.is-ok{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 14%,var(--sheet))}
.m-ancla-helice .ah-q-opts .btn.is-bad{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 14%,var(--sheet))}
.m-ancla-helice .ah-bar{height:6px;border-radius:99px;background:var(--sea-2);overflow:hidden}
.m-ancla-helice .ah-bar i{display:block;height:100%;background:var(--accent);transition:width .3s}
`;

/* ---------- Contenido: ancla ---------- */
const APART = {
  arganeo: ["Arganeo", "Argolla del extremo superior de la caña en la que se afirma el grillete de la cadena o se anuda el cabo."],
  cana: ["Caña", "Barra principal del ancla: va desde el arganeo hasta la cruz."],
  cruz: ["Cruz", "Extremo inferior de la caña, donde nacen (o se articulan) los brazos o las uñas."],
  brazos: ["Brazos", "Ramas que salen de la cruz y terminan en las uñas."],
  unas: ["Uñas", "Partes anchas y planas (palmas) que se clavan en el fondo y dan el agarre."],
  pico: ["Pico", "Punta extrema de la uña: es lo primero que penetra en el fondo."],
  cepo: ["Cepo", "Barra transversal, perpendicular al plano de los brazos, que obliga al ancla a tumbarse para que una uña se clave."]
};
const ANCHORS = [
  { id: "alm", name: "Almirantazgo", alias: "Clásica, de cepo",
    fondos: "Roca, piedra, algas y fondos duros o con vegetación.",
    pros: ["Agarra en casi cualquier fondo, incluso roca y algas.", "Robusta y sencilla, sin piezas móviles salvo el cepo."],
    cons: ["Pesada y voluminosa; para estibarla hay que abatir el cepo.", "La uña que queda hacia arriba puede enredar la cadena (encepar).", "Poco agarre por kilo en arena y fango."],
    over: {} },
  { id: "dan", name: "Danforth", alias: "Uñas planas articuladas",
    fondos: "Arena y fango.",
    pros: ["Gran poder de agarre para su peso en arena y fango.", "Plana: se estiba fácilmente en un pañol.", "Ligera y económica."],
    cons: ["Mala en roca, algas y fondos duros: le cuesta clavar.", "Si cambia la dirección del tiro al bornear puede desclavarse.", "Una piedra entre las uñas puede bloquear la bisagra."],
    over: { cruz: "Bisagra en la que giran juntas las dos uñas, unos 30–45° respecto a la caña.",
      cepo: "Barra estabilizadora situada en la cruz: evita que el ancla gire sobre sí misma y ayuda a que las dos uñas entren a la vez.",
      unas: "Dos uñas largas y completamente planas, unidas con una bisagra en la cruz (definición de las preguntas oficiales).",
      pico: "Punta afilada de cada uña." } },
  { id: "cqr", name: "Arado (CQR)", alias: "Coastal Quick Release",
    fondos: "Arena y fango (clave oficial: «más eficaz en arena y fango»).",
    pros: ["Muy eficaz en arena y fango.", "La articulación la reorienta al bornear sin desclavarla.", "Se estiba bien en la roldana de proa."],
    cons: ["Pesada y voluminosa para un pañol.", "Floja en algas densas y en roca lisa.", "La articulación puede pillar los dedos."],
    over: { cruz: "Articulación entre la caña y la reja: deja que el arado se oriente cuando el barco bornea.",
      unas: "Reja doble en forma de arado (dos palas en V) que se entierra como la reja de un arado.",
      pico: "Punta de la reja, lastrada para que clave la primera." } },
  { id: "rez", name: "Rezón", alias: "Cuatro garfios",
    fondos: "Roca y piedra; botes, neumáticas y kayaks.",
    pros: ["Ligero y, si es plegable, ocupa muy poco.", "Engancha bien en roca.", "Sirve para rastrear y recuperar cabos o cadenas del fondo."],
    cons: ["Poco agarre en arena y fango.", "Puede quedar enrocado: conviene darle orinque.", "Solo para embarcaciones pequeñas o fondeos cortos."],
    over: { brazos: "Cuatro brazos o garfios contrapuestos, a 90° entre sí. En los plegables se abaten sobre la caña.",
      cruz: "Collar central donde nacen los cuatro brazos." } },
  { id: "bru", name: "Bruce (garra)", alias: "De garra, una pieza",
    fondos: "Arena, fango, grava y fondos mixtos.",
    pros: ["Clava rápido y se reorienta bien al bornear.", "Una sola pieza, sin partes móviles.", "Buen comportamiento en fondos variados."],
    cons: ["Menos agarre por kilo que una Danforth en fango blando.", "Voluminosa; va en la roldana de proa.", "Le cuesta clavar en algas."],
    over: { unas: "Garra de tres uñas en una sola pieza, sin bisagra.", cruz: "Unión fija entre la caña y la garra.", pico: "Punta de la uña central." } }
];

/* ---------- Contenido: hélice ---------- */
const HPART = {
  nucleo: ["Núcleo", "Parte central de la hélice por la que se acopla al eje propulsor; en él se fijan las palas."],
  palas: ["Palas", "Superficies que, al girar, transforman el movimiento circular en empuje. Pueden ser 2, 3 o más."],
  cara: ["Cara de la pala", "Cara de presión: la que mira a popa y empuja el agua en marcha avante. Más plana que el dorso."],
  dorso: ["Dorso de la pala", "Cara de succión: la que mira a proa, más curvada."],
  paso: ["Paso", "Lo que avanzaría teóricamente la hélice en una vuelta completa, como un tornillo en su tuerca. Como resbala en el agua, avanza menos: esa pérdida es el retroceso (resbalamiento)."],
  diametro: ["Diámetro", "Diámetro del círculo que describen las puntas de las palas. Hélice de velocidad: mucho paso y poco diámetro. De arrastre: poco paso y mucho diámetro."],
  capacete: ["Capacete (cono de cola)", "Pieza cónica que cierra la cara de popa del núcleo: reduce la resistencia y las turbulencias y evita la entrada de agua en el núcleo."],
  eje: ["Eje", "Transmite el giro del motor a la hélice. Suele ir inclinado entre 7° y 15° respecto al motor."],
  bocina: ["Bocina", "Conducto por el que el eje atraviesa el casco sin que entre agua. Permanece inmóvil; su deterioro supone riesgo de inundación."],
  arbotante: ["Arbotante", "Soporte exterior, en forma de brazo o V, que sujeta el eje fuera del casco cerca de la hélice."]
};
const HORDER = ["palas", "cara", "dorso", "nucleo", "capacete", "eje", "arbotante", "bocina", "paso", "diametro"];
const HLABEL = { nucleo: V(0, -.35, -.25), palas: V(0, 1.05, 0), cara: V(.32, .72, .12), dorso: V(-.3, .7, -.15), capacete: V(0, 0, .78),
  eje: V(0, 0, -2.4), arbotante: V(0, .62, -1.25), bocina: V(0, -.05, -3.6), paso: V(.7, 0, -.8), diametro: V(0, -1.05, 0) };

/* ---------- Quiz (claves oficiales q_nom / q_man) ---------- */
const QUIZ = [
  { q: "Se dice que una hélice es dextrógira cuando:", a: "Gira en el sentido de las agujas del reloj cuando la embarcación avanza (vista desde popa).", w: ["Gira en sentido contrario a las agujas del reloj cuando la embarcación avanza.", "Gira a la derecha cuando damos atrás.", "Va montada en la banda de estribor."], why: "Dextrógira: vista desde popa, en marcha avante gira a la derecha (horario). Dando atrás invierte el giro." },
  { q: "Observando desde popa una embarcación con hélice dextrógira dando atrás, la hélice gira:", a: "En sentido contrario a las agujas del reloj.", w: ["En el sentido de las agujas del reloj.", "Igual que avante; solo cambia el paso.", "Depende de la posición del timón."], why: "Al dar atrás la hélice invierte el giro: la dextrógira gira entonces a la izquierda." },
  { q: "Con hélice dextrógira y máquina avante, la presión lateral de las palas:", a: "Tiende a llevar la popa a estribor.", w: ["Tiende a llevar la popa a babor.", "Lleva la proa a estribor.", "No produce efecto con máquina avante."], why: "Dextrógira avante: la popa cae a estribor y la proa a babor." },
  { q: "Hélice dextrógira, sin arrancada y timón a la vía, damos máquina atrás:", a: "La popa cae a babor.", w: ["La popa cae a estribor.", "La proa cae a babor.", "La embarcación retrocede en línea recta."], why: "Dando atrás el efecto se invierte: popa a babor (proa a estribor). Por eso con dextrógira se atraca mejor por babor." },
  { q: "El efecto de la presión lateral de las palas, con la embarcación parada y sin arrancada, se debe principalmente a:", a: "La diferencia de presión entre las palas.", w: ["La corriente de expulsión sobre el timón.", "El viento sobre la obra muerta.", "La inclinación del eje respecto al motor."], why: "Las palas bajas trabajan con más presión que las altas; esa diferencia produce el empuje lateral." },
  { q: "Las hélices gemelas de giro al exterior:", a: "Compensan mutuamente la caída de la embarcación.", w: ["Suman su presión lateral hacia estribor.", "Tienen la de babor dextrógira y la de estribor levógira.", "Solo se montan en veleros."], why: "Giro al exterior: babor levógira y estribor dextrógira. Sus presiones laterales son opuestas y se anulan." },
  { q: "Se denomina núcleo de la hélice a:", a: "La parte por la que la hélice se acopla al eje propulsor.", w: ["El cono que cierra la popa del núcleo.", "El conducto por donde el eje atraviesa el casco.", "La parte más ancha de la pala."], why: "Núcleo: pieza central donde van las palas, acoplada al eje. El cono es el capacete; el conducto, la bocina." },
  { q: "¿Qué parte de la hélice transforma el movimiento circular en empuje?", a: "La pala.", w: ["La bocina.", "El núcleo.", "El capacete."], why: "Las palas empujan el agua al girar. La bocina solo deja pasar el eje sin que entre agua." },
  { q: "La bocina es:", a: "El conducto que permite que el eje de la hélice gire a través del casco sin que entre agua.", w: ["La pieza que transforma el giro en empuje.", "El cono que cubre el extremo del núcleo.", "El soporte exterior del eje junto a la hélice."], why: "La bocina no gira; si se deteriora hay riesgo de inundación. El soporte exterior es el arbotante." },
  { q: "Las hélices de palas abatibles tienen como función principal:", a: "Permitir plegar las palas para reducir al mínimo la resistencia.", w: ["Girar cada pala sobre su eje largo para cambiar el ángulo de ataque.", "Ocupar poco espacio cuando la embarcación está atracada.", "Navegar con poco fondo para no golpearlo."], why: "Se pliegan cuando el motor no empuja (veleros navegando a vela). Cambiar el ángulo de las palas es propio de la hélice reversible." },
  { q: "El ancla de arado es más eficaz para fondear en:", a: "Arena y fango.", w: ["Roca.", "Algas densas.", "Piedra suelta y coral."], why: "Clave oficial: ancla de arado (CQR) → arena y fango." },
  { q: "El ancla Danforth:", a: "Consta de dos largas uñas completamente planas unidas con una bisagra en la cruz.", w: ["Consta de cuatro garfios contrapuestos.", "Tiene forma de reja de arado doble.", "Es de una sola pieza con garra de tres puntas."], why: "Danforth: uñas planas articuladas en la cruz. Cuatro garfios = rezón; reja = arado (CQR); garra = Bruce." },
  { q: "El arganeo es:", a: "La pieza o argolla del ancla en la que se anuda el cabo o se afirma el grillete de la cadena.", w: ["La barra transversal perpendicular a los brazos.", "El extremo de los brazos que se clava en el fondo.", "La unión de la caña con los brazos."], why: "Arganeo = argolla. La barra transversal es el cepo; lo que se clava, las uñas; la unión, la cruz." },
  { q: "En relación con las partes de un ancla, se denomina «caña» a:", a: "La parte que va desde el arganeo hasta la cruz.", w: ["La barra que atraviesa el ancla junto al arganeo.", "La palanca con la que se gobierna el timón.", "Cada uno de los brazos curvos."], why: "Caña del ancla: cuerpo principal entre arganeo y cruz. La barra junto al arganeo es el cepo." },
  { q: "El paso de una hélice es:", a: "Lo que avanzaría teóricamente la hélice en una vuelta completa.", w: ["La distancia entre las puntas de dos palas.", "El ángulo del eje respecto al motor.", "El número de vueltas por minuto."], why: "Paso = avance teórico por vuelta. La pérdida real por resbalar en el agua es el retroceso." }
];

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tok = n => (getComputedStyle(document.documentElement).getPropertyValue(n) || "").trim() || "#888888";

function disposeObj(o) {
  if (!o) return;
  o.traverse(c => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => m.dispose());
  });
  if (o.parent) o.parent.remove(o);
}

/* ---------- Geometría de anclas ---------- */
function anchorBuilder(steel) {
  const mk = (g, part, geo, pos, rot) => {
    const m = new THREE.Mesh(geo, steel.clone());
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    m.userData.parts = [part];
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const along = (g, part, geo, p, tan) => {
    const w = new THREE.Group();
    w.position.copy(p);
    w.quaternion.setFromUnitVectors(V(0, 1, 0), tan.clone().normalize());
    g.add(w);
    const m = mk(w, part, geo);
    return m;
  };
  const extr = (pts, depth) => {
    const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 1, curveSegments: 6 });
    geo.translate(0, 0, -depth / 2);
    return geo;
  };
  const cone = (r, h) => { const c = new THREE.ConeGeometry(r, h, 14); c.translate(0, h / 2, 0); return c; };
  const ring = (y, R = .2) => new THREE.TorusGeometry(R, .045, 12, 36);

  return {
    alm() {
      const g = new THREE.Group();
      mk(g, "cana", new THREE.CylinderGeometry(.065, .085, 2.55, 20), [0, .17, 0]);
      mk(g, "arganeo", ring(), [0, 1.66, 0]);
      mk(g, "cepo", new THREE.CylinderGeometry(.05, .05, 2.7, 16), [0, 1.18, 0], [Math.PI / 2, 0, 0]);
      mk(g, "cepo", new THREE.SphereGeometry(.085, 16, 12), [0, 1.18, 1.35]);
      mk(g, "cepo", new THREE.SphereGeometry(.085, 16, 12), [0, 1.18, -1.35]);
      mk(g, "cruz", new THREE.SphereGeometry(.15, 20, 14), [0, -1.12, 0]);
      for (const s of [-1, 1]) {
        const c = new THREE.QuadraticBezierCurve3(V(0, -1.1, 0), V(s * 1.0, -1.32, 0), V(s * 1.22, -.3, 0));
        mk(g, "brazos", new THREE.TubeGeometry(c, 28, .066, 10, false));
        const palm = along(g, "unas", extr([[0, .3], [.27, -.02], [.1, -.3], [0, -.34], [-.1, -.3], [-.27, -.02]], .045), c.getPoint(.74), c.getTangent(.74));
        palm.rotation.y = Math.PI / 2;
        along(g, "pico", cone(.05, .2), c.getPoint(.97), c.getTangent(.97));
      }
      return g;
    },
    dan() {
      const g = new THREE.Group();
      mk(g, "cana", new THREE.BoxGeometry(.11, 2.35, .06), [0, .2, 0]);
      mk(g, "arganeo", ring(0, .17), [0, 1.52, 0], [0, Math.PI / 2, 0]);
      mk(g, "cruz", new THREE.CylinderGeometry(.11, .11, .72, 18), [0, -1.0, 0], [Math.PI / 2, 0, 0]);
      mk(g, "cepo", new THREE.CylinderGeometry(.045, .045, 2.4, 14), [-.08, -1.13, 0], [Math.PI / 2, 0, 0]);
      const piv = new THREE.Group(); piv.position.set(0, -1.0, 0); piv.rotation.z = -.6; g.add(piv);
      for (const s of [-1, 1]) {
        const f = mk(piv, "unas", extr([[-.27, .02], [.27, .02], [.12, 1.2], [0, 1.42], [-.1, 1.18]], .04));
        f.rotation.y = Math.PI / 2; f.position.z = s * .36;
        mk(piv, "pico", cone(.03, .14), [0, 1.38, s * .36]);
      }
      return g;
    },
    cqr() {
      const g = new THREE.Group();
      const c = new THREE.QuadraticBezierCurve3(V(0, 1.38, 0), V(.42, .45, 0), V(.06, -.55, 0));
      mk(g, "cana", new THREE.TubeGeometry(c, 30, .075, 12, false));
      mk(g, "arganeo", ring(), [0, 1.56, 0]);
      mk(g, "cruz", new THREE.CylinderGeometry(.1, .1, .34, 16), [.06, -.62, 0], [Math.PI / 2, 0, 0]);
      const share = new THREE.Group(); share.position.set(.06, -.68, 0); share.rotation.z = .3; g.add(share);
      const plate = [[0, 0], [.52, -.28], [.4, -.85], [0, -1.22]];
      const p1 = mk(share, "unas", extr(plate, .04)); p1.rotation.y = .8;
      const p2 = mk(share, "unas", extr(plate, .04)); p2.rotation.y = Math.PI - .8;
      mk(share, "unas", new THREE.BoxGeometry(.06, 1.1, .06), [0, -.58, 0]);
      mk(share, "pico", cone(.07, .22), [0, -1.16, 0], [Math.PI, 0, 0]);
      return g;
    },
    rez() {
      const g = new THREE.Group();
      mk(g, "cana", new THREE.CylinderGeometry(.06, .07, 2.05, 18), [0, .1, 0]);
      mk(g, "arganeo", ring(), [0, 1.3, 0]);
      mk(g, "cruz", new THREE.CylinderGeometry(.13, .13, .22, 18), [0, -.95, 0]);
      for (let k = 0; k < 4; k++) {
        const arm = new THREE.Group(); arm.rotation.y = k * Math.PI / 2; g.add(arm);
        const c = new THREE.QuadraticBezierCurve3(V(0, -.98, 0), V(.82, -1.18, 0), V(.9, -.22, 0));
        mk(arm, "brazos", new THREE.TubeGeometry(c, 24, .055, 10, false));
        const palm = along(arm, "unas", extr([[0, .17], [.15, 0], [0, -.2], [-.15, 0]], .035), c.getPoint(.8), c.getTangent(.8));
        palm.rotation.y = Math.PI / 2;
        along(arm, "pico", cone(.04, .16), c.getPoint(.97), c.getTangent(.97));
      }
      return g;
    },
    bru() {
      const g = new THREE.Group();
      const c = new THREE.CatmullRomCurve3([V(0, 1.38, 0), V(-.18, .6, 0), V(-.08, -.2, 0), V(.38, -.72, 0)]);
      mk(g, "cana", new THREE.TubeGeometry(c, 36, .085, 12, false));
      mk(g, "arganeo", ring(), [0, 1.55, 0]);
      mk(g, "cruz", new THREE.SphereGeometry(.15, 18, 14), [.4, -.78, 0]);
      const claw = new THREE.Group(); claw.position.set(.4, -.85, 0); claw.rotation.y = Math.PI / 2; g.add(claw);
      const prong = [[-.2, 0], [.2, 0], [.07, .78], [0, .9], [-.07, .78]];
      [[0, 0, 0], [-1, .55, .35], [1, .55, .35]].forEach(([s, splay, lift]) => {
        const w = new THREE.Group(); w.rotation.y = s * splay; w.position.x = s * .1; claw.add(w);
        const m = mk(w, "unas", extr(prong, .07)); m.rotation.x = -Math.PI / 2 + lift;
        if (s === 0) mk(w, "pico", cone(.045, .14), [0, 0, -.86], [-Math.PI / 2, 0, 0]);
      });
      return g;
    }
  };
}

/* ---------- Geometría de hélice ---------- */
function bladeGeo(face, hand, R = 1, rh = .3, P = 1.6) {
  const NR = 16, NT = 14, pos = [], idx = [];
  for (let i = 0; i <= NR; i++) {
    const u = i / NR, r = rh * .85 + (R - rh * .85) * u;
    const w = .66 * Math.sqrt(Math.max(0, 1 - u * u)) * (.72 + .55 * u) + .03;
    const skew = .14 * u * u;
    const phi = Math.atan(P / (2 * Math.PI * r)), ct = Math.cos(phi), st = Math.sin(phi);
    for (let j = 0; j <= NT; j++) {
      const t = -1 + 2 * j / NT;
      const s = t * w / 2 - skew * w;
      const th = .075 * (1 - .78 * u) * Math.sqrt(Math.max(0, 1 - t * t)) + .004;
      const off = face === "cara" ? th * .22 : -th;
      pos.push(hand * s * ct + hand * st * off, r, -s * st + ct * off);
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NT; j++) {
    const a = i * (NT + 1) + j, b = a + 1, c = a + NT + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export default {
  id: ID,
  tema: 1,
  title: "Ancla y hélice 3D",
  icon: "Ψ",
  desc: "Partes y tipos de ancla, hélice dextrógira y levógira y su presión lateral, con quiz.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) {
      const st = document.createElement("style"); st.dataset.mod = ID; st.textContent = CSS; document.head.appendChild(st);
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const uid = Math.random().toString(36).slice(2, 8);
    const store = ctx.store || { get: (k, d) => d, set() {} };
    const seenStore = store.get("seen", {}) || {};

    el.innerHTML = `
<div class="m-ancla-helice stack">
  <div class="stack" style="gap:.3rem">
    <p class="eyebrow">Tema 1 · 1.3 Equipo de fondeo · 1.5 Hélice</p>
    <h3>Ancla y hélice en 3D</h3>
    <p class="muted small">Gira el modelo arrastrando, haz zoom con la rueda o pellizcando y toca una pieza para ver su ficha.</p>
  </div>
  <div class="seg" role="group" aria-label="Sección" data-tabs>
    <button type="button" data-tab="ancla" aria-pressed="true">Ancla</button>
    <button type="button" data-tab="helice" aria-pressed="false">Hélice</button>
    <button type="button" data-tab="quiz" aria-pressed="false">Quiz</button>
  </div>
  <div class="stack" data-view3d>
    <div class="row" data-ctl-ancla>
      <div class="seg" role="group" aria-label="Tipo de ancla" data-anchors>
        ${ANCHORS.map((a, i) => `<button type="button" data-a="${i}" aria-pressed="${i === 0}">${esc(a.name)}</button>`).join("")}
      </div>
    </div>
    <div class="row" data-ctl-helice hidden>
      <div class="seg" role="group" aria-label="Sentido de giro" data-hand>
        <button type="button" data-v="1" aria-pressed="true">Dextrógira</button>
        <button type="button" data-v="-1" aria-pressed="false">Levógira</button>
      </div>
      <div class="seg" role="group" aria-label="Marcha" data-dir>
        <button type="button" data-v="1" aria-pressed="true">Avante</button>
        <button type="button" data-v="-1" aria-pressed="false">Atrás</button>
      </div>
      <button type="button" class="btn sm" data-popa>Ver desde popa</button>
    </div>
    <div class="ah-main">
      <div class="stack">
        <div class="stage ah-stage" data-stage>
          <div class="ah-hint" data-hint></div>
          <div class="ah-label" data-label hidden></div>
        </div>
        <div class="row ah-parts" data-parts role="group" aria-label="Piezas"></div>
      </div>
      <div class="stack">
        <div class="panel stack" data-ficha style="gap:.4rem"></div>
        <div class="tint stack ah-info" data-info style="gap:.6rem"></div>
      </div>
    </div>
  </div>
  <div class="panel stack" data-quiz hidden></div>
</div>`;
    const $ = s => el.querySelector(s);
    const stageEl = $("[data-stage]"), labelEl = $("[data-label]"), hintEl = $("[data-hint]");
    const partsEl = $("[data-parts]"), fichaEl = $("[data-ficha]"), infoEl = $("[data-info]");

    /* ---- Three setup ---- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    stageEl.prepend(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(40, 4 / 3, .05, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !reduce; controls.dampingFactor = .08; controls.enablePan = false;
    controls.minDistance = 2.4; controls.maxDistance = 13;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTex = pmrem.fromScene(room, .04).texture;
    if (typeof room.dispose === "function") room.dispose(); else disposeObj(room);

    const mkScene = () => {
      const s = new THREE.Scene(); s.environment = envTex;
      s.add(new THREE.HemisphereLight(0xffffff, 0x3a4a55, .7));
      const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(3, 5, 4); s.add(d);
      return s;
    };
    const sceneA = mkScene(), sceneH = mkScene();

    // Ancla
    const steel = new THREE.MeshStandardMaterial({ color: 0xa3acb2, metalness: .85, roughness: .34, envMapIntensity: 1.1 });
    const builders = anchorBuilder(steel);
    const seabedMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 1, metalness: 0, transparent: true, opacity: .85 });
    const seabed = new THREE.Mesh(new THREE.CircleGeometry(2.7, 48), seabedMat);
    seabed.rotation.x = -Math.PI / 2; seabed.position.y = -1.8; sceneA.add(seabed);
    let anchorRoot = null, anchorIdx = 0;

    // Hélice
    const drive = new THREE.Group(); drive.rotation.x = .18; drive.position.y = -.1; sceneH.add(drive);
    const bronze = new THREE.MeshStandardMaterial({ color: 0xc09a5b, metalness: .9, roughness: .28, side: THREE.DoubleSide });
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xb8c0c6, metalness: .9, roughness: .25 });
    const accentMat = new THREE.MeshBasicMaterial({ color: 0xa8226f });
    const helperMat = new THREE.MeshBasicMaterial({ color: 0xa8226f, transparent: true, opacity: .75 });
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: .28, roughness: .8, depthWrite: false, side: THREE.DoubleSide });
    const tag = (m, parts) => { m.userData.parts = parts; return m; };
    const prop = new THREE.Group(); drive.add(prop);
    const hub = tag(new THREE.Mesh(new THREE.CylinderGeometry(.3, .33, .55, 28), bronze.clone()), ["nucleo"]);
    hub.rotation.x = Math.PI / 2; prop.add(hub);
    const capGeo = new THREE.ConeGeometry(.3, .5, 28); capGeo.translate(0, .25, 0);
    const cap = tag(new THREE.Mesh(capGeo, bronze.clone()), ["capacete"]); cap.rotation.x = Math.PI / 2; cap.position.z = .27; prop.add(cap);
    let blades = null;
    const eje = tag(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 5, 18), shaftMat.clone()), ["eje"]);
    eje.rotation.x = Math.PI / 2; eje.position.z = -2.75; drive.add(eje);
    const strut = new THREE.Group(); strut.position.z = -1.25; drive.add(strut);
    strut.add(tag(new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .38, 20), shaftMat.clone()), ["arbotante"]));
    strut.children[0].rotation.x = Math.PI / 2;
    for (const th of [.45, -.45]) {
      const h = .66, b = tag(new THREE.Mesh(new THREE.BoxGeometry(.07, h, .22), shaftMat.clone()), ["arbotante"]);
      b.rotation.z = th; b.position.set(-Math.sin(th) * h / 2, .14 + Math.cos(th) * h / 2, 0); strut.add(b);
    }
    const boc = tag(new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .7, 22), shaftMat.clone()), ["bocina"]);
    boc.rotation.x = Math.PI / 2; boc.position.z = -3.6; drive.add(boc);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.8, .08, 6.5), hullMat);
    hull.rotation.x = -Math.atan(.278); hull.position.set(0, (-1.9 + 3.6) * .278 + .04, -1.9); drive.add(hull);
    // ayudas: paso (hélice geométrica) y diámetro
    const P = 1.6;
    const helixPts = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2; helixPts.push(V(.72 * Math.cos(a), .72 * Math.sin(a), -P * i / 80)); }
    const pasoHelper = new THREE.Group(); drive.add(pasoHelper);
    pasoHelper.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts), 120, .025, 8, false), helperMat), ["paso"]));
    const pz = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, P, 8), helperMat); pz.rotation.x = Math.PI / 2; pz.position.set(.72, 0, -P / 2); pasoHelper.add(tag(pz, ["paso"]));
    const diaHelper = new THREE.Group(); drive.add(diaHelper);
    diaHelper.add(tag(new THREE.Mesh(new THREE.TorusGeometry(1.0, .018, 8, 96), helperMat), ["diametro"]));
    const dl = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 2, 8), helperMat); diaHelper.add(tag(dl, ["diametro"]));
    diaHelper.position.z = .02;
    pasoHelper.visible = diaHelper.visible = false;
    // flecha de sentido de giro
    let arrow = null;
    // partículas de agua
    const NP = 240, pr = new Float32Array(NP), pa = new Float32Array(NP), pzz = new Float32Array(NP), ppos = new Float32Array(NP * 3);
    for (let i = 0; i < NP; i++) { pr[i] = .15 + Math.random() * 1.15; pa[i] = Math.random() * Math.PI * 2; pzz[i] = -3 + Math.random() * 7; }
    const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(ppos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: .04, transparent: true, opacity: .4, depthWrite: false });
    const points = new THREE.Points(pGeo, pMat); drive.add(points);

    const st = { tab: "ancla", sel: null, hand: 1, dir: 1, twin: false, labelPos: null };

    function buildBlades() {
      if (blades) disposeObj(blades);
      blades = new THREE.Group(); prop.add(blades);
      for (let k = 0; k < 3; k++) {
        const b = new THREE.Group(); b.rotation.z = k * Math.PI * 2 / 3; blades.add(b);
        const cm = bronze.clone(); cm.color.offsetHSL(0, 0, .05);
        b.add(tag(new THREE.Mesh(bladeGeo("cara", st.hand), cm), ["palas", "cara"]));
        b.add(tag(new THREE.Mesh(bladeGeo("dorso", st.hand), bronze.clone()), ["palas", "dorso"]));
      }
      applyHighlight();
    }
    function buildArrow() {
      if (arrow) disposeObj(arrow);
      const cw = st.hand * st.dir > 0, R = 1.22, pts = [];
      const a0 = cw ? 2.7 : .45, a1 = cw ? -1.0 : 4.15;
      for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * i / 40; pts.push(V(R * Math.cos(a), R * Math.sin(a), 0)); }
      arrow = new THREE.Group(); arrow.position.z = .95;
      arrow.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .035, 8, false), accentMat.clone()));
      const head = new THREE.Mesh(new THREE.ConeGeometry(.1, .26, 16), accentMat.clone());
      const e = pts[pts.length - 1], t = e.clone().sub(pts[pts.length - 2]).normalize();
      head.position.copy(e).addScaledVector(t, .1); head.quaternion.setFromUnitVectors(V(0, 1, 0), t);
      arrow.add(head);
      drive.add(arrow);
      arrow.traverse(c => { if (c.material) c.material.color.set(tok("--accent")); });
    }
    function buildAnchor(i) {
      if (anchorRoot) disposeObj(anchorRoot);
      anchorIdx = i;
      anchorRoot = builders[ANCHORS[i].id]();
      const bb = new THREE.Box3().setFromObject(anchorRoot), c = bb.getCenter(new THREE.Vector3());
      anchorRoot.position.set(-c.x, -c.y, -c.z);
      seabed.position.y = bb.min.y - c.y - .12;
      sceneA.add(anchorRoot);
      st.sel = null;
    }

    /* ---- selección ---- */
    const curRoot = () => (st.tab === "helice" ? drive : anchorRoot);
    function partsOf() {
      if (st.tab === "helice") return HORDER;
      const set = new Set(); anchorRoot.traverse(o => o.userData.parts && o.userData.parts.forEach(p => set.add(p)));
      return Object.keys(APART).filter(k => set.has(k));
    }
    function partInfo(k) {
      if (st.tab === "helice") return HPART[k];
      const a = ANCHORS[anchorIdx]; return [APART[k][0], a.over[k] || APART[k][1]];
    }
    let hiColor = new THREE.Color(0xa8226f);
    function applyHighlight() {
      const root = curRoot(); if (!root) return;
      root.traverse(o => {
        if (!o.isMesh || !o.userData.parts || !o.material || !("emissive" in o.material)) return;
        const on = st.sel && o.userData.parts.includes(st.sel);
        o.material.emissive.copy(on ? hiColor : new THREE.Color(0));
        o.material.emissiveIntensity = on ? .55 : 0;
      });
      pasoHelper.visible = st.tab === "helice" && st.sel === "paso";
      diaHelper.visible = st.tab === "helice" && st.sel === "diametro";
    }
    const seenKey = () => (st.tab === "helice" ? "helice" : "a-" + ANCHORS[anchorIdx].id);
    function select(k) {
      st.sel = k;
      applyHighlight();
      if (k) {
        const sk = seenKey(); const arr = seenStore[sk] || (seenStore[sk] = []);
        if (!arr.includes(k)) {
          arr.push(k);
          const all = partsOf();
          if (all.every(p => arr.includes(p)) && !seenStore[sk + ":done"]) {
            seenStore[sk + ":done"] = true;
            ctx.award(15, st.tab === "helice" ? "Todas las partes de la hélice" : "Partes del ancla " + ANCHORS[anchorIdx].name);
            ctx.toast && ctx.toast("Has revisado todas las piezas de este modelo");
          }
          store.set("seen", seenStore);
        }
        if (st.tab === "ancla") { const b = new THREE.Box3(); anchorRoot.traverse(o => { if (o.isMesh && o.userData.parts && o.userData.parts.includes(k)) b.expandByObject(o); }); st.labelPos = b.getCenter(new THREE.Vector3()); }
      }
      renderParts(); renderFicha(); invalidate();
    }
    function renderParts() {
      const seen = seenStore[seenKey()] || [];
      partsEl.innerHTML = partsOf().map(k => `<button type="button" class="chip${seen.includes(k) ? " seen" : ""}" data-p="${k}" aria-pressed="${st.sel === k}">${esc(partInfo(k)[0])}</button>`).join("");
    }
    function renderFicha() {
      if (!st.sel) {
        fichaEl.innerHTML = `<p class="eyebrow">Ficha</p><p class="muted">Toca una pieza del modelo o un nombre de la lista.</p>`;
        return;
      }
      const [n, d] = partInfo(st.sel);
      let extra = "";
      if (st.tab === "helice" && (st.sel === "cara" || st.sel === "dorso")) extra = `<p class="small muted">Gira el modelo: desde popa ves la cara; desde proa, el dorso.</p>`;
      if (st.tab === "helice" && st.sel === "bocina") extra = `<p class="small muted">No confundir con la <b>limera</b>, que es el orificio por el que pasa la mecha del timón.</p>`;
      fichaEl.innerHTML = `<p class="eyebrow">${st.tab === "helice" ? "Hélice" : "Ancla " + esc(ANCHORS[anchorIdx].name)}</p><h4>${esc(n)}</h4><p>${esc(d)}</p>${extra}`;
    }

    /* ---- panel de información ---- */
    function renderAnchorInfo() {
      const a = ANCHORS[anchorIdx];
      infoEl.innerHTML = `<div><p class="eyebrow">${esc(a.alias)}</p><h4>${esc(a.name)}</h4></div>
        <p class="small"><b>Fondos ideales:</b> ${esc(a.fondos)}</p>
        <div class="ah-pc small"><div class="pro"><b>A favor</b><ul>${a.pros.map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>
        <div class="con"><b>En contra</b><ul>${a.cons.map(p => `<li>${esc(p)}</li>`).join("")}</ul></div></div>`;
    }
    const sideOf = (hand, dir) => (hand * dir > 0 ? "estribor" : "babor");
    function lateralSVG() {
      const mv = st.dir > 0 ? `<path class="mv" d="M110 150 V95" marker-end="url(#ah-mv-${uid})"/>` : `<path class="mv" d="M110 95 V150" marker-end="url(#ah-mv-${uid})"/>`;
      let lat = "", props = "", txt = "";
      if (!st.twin) {
        const s = sideOf(st.hand, st.dir) === "estribor" ? 1 : -1;
        props = `<ellipse class="prop" cx="110" cy="232" rx="12" ry="5"/>`;
        lat = `<path class="lat" d="M110 244 H${110 + s * 64}" marker-end="url(#ah-ar-${uid})"/>
               <path class="bow" d="M110 34 H${110 - s * 58}" marker-end="url(#ah-ar-${uid})"/>`;
      } else {
        const ps = st.dir > 0 ? -1 : 1; // babor levógira: avante popa a babor
        props = `<ellipse class="prop" cx="90" cy="232" rx="10" ry="4.5"/><ellipse class="prop" cx="130" cy="232" rx="10" ry="4.5"/>`;
        lat = `<path class="lat" d="M90 244 H${90 + ps * 40}" marker-end="url(#ah-ar-${uid})"/>
               <path class="lat" d="M130 244 H${130 - ps * 40}" marker-end="url(#ah-ar-${uid})"/>
               <text class="ok" x="110" y="40" text-anchor="middle">Se compensan</text>`;
      }
      txt = `<svg class="ah-svg" viewBox="0 0 220 262" role="img" aria-label="Vista en planta: efecto de la presión lateral">
        <defs><marker id="ah-ar-${uid}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--accent)"/></marker>
        <marker id="ah-mv-${uid}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--muted)"/></marker></defs>
        <path class="hull" d="M110 16 C150 48 158 110 156 196 L153 226 L67 226 L64 196 C62 110 70 48 110 16 Z"/>
        <path class="cl" d="M110 22 V222"/>
        <text class="br" x="22" y="132">Br</text><text class="er" x="182" y="132">Er</text>
        <text class="lb" x="110" y="12" text-anchor="middle">PROA</text>
        <text class="lb" x="110" y="214" text-anchor="middle">popa</text>
        ${mv}${props}${lat}
      </svg>`;
      return txt;
    }
    function renderHeliceInfo() {
      const hand = st.hand > 0 ? "Dextrógira" : "Levógira", dir = st.dir > 0 ? "avante" : "atrás";
      const cw = st.hand * st.dir > 0;
      const popa = sideOf(st.hand, st.dir), proa = popa === "estribor" ? "babor" : "estribor";
      const msg = st.twin
        ? `Gemelas de giro al exterior: babor <b>levógira</b>, estribor <b>dextrógira</b>. Sus presiones laterales son opuestas y la caída se compensa.`
        : `<b>${hand} · ${dir}</b>: vista desde popa gira ${cw ? "a la derecha (horario)" : "a la izquierda (antihorario)"}. La presión lateral lleva la <b>popa a ${popa}</b> y la proa a ${proa}.`;
      infoEl.innerHTML = `<div class="row" style="justify-content:space-between"><p class="eyebrow">Presión lateral de las palas</p>
        <div class="seg" role="group" aria-label="Número de hélices" data-twin>
          <button type="button" data-v="0" aria-pressed="${!st.twin}">Una</button><button type="button" data-v="1" aria-pressed="${st.twin}">Gemelas</button></div></div>
        ${lateralSVG()}
        <p class="small">${msg}</p>
        <p class="small muted">Las palas que pasan por abajo trabajan con más presión que las de arriba. Esa diferencia de presión entre palas empuja la popa hacia el lado al que se mueven las palas altas. Se nota sobre todo con poca arrancada y, mucho más, dando atrás.</p>
        <details class="small"><summary>Tipos de hélice</summary><ul>
          <li><b>De velocidad</b>: mucho paso y poco diámetro (lanchas rápidas, fuerabordas).</li>
          <li><b>De arrastre</b>: poco paso y mucho diámetro (remolcadores, barcos pesados).</li>
          <li><b>De palas abatibles</b> (plegables): las palas se pliegan para reducir al mínimo la resistencia; típicas de veleros.</li>
          <li><b>Reversibles</b> (paso variable): las palas giran sobre su eje para cambiar el ángulo de ataque e incluso invertir el empuje sin parar el motor.</li>
        </ul></details>`;
    }
    function renderHint() {
      if (st.tab === "ancla") { hintEl.innerHTML = `<span class="chip">Toca una pieza</span>`; return; }
      const cw = st.hand * st.dir > 0;
      hintEl.innerHTML = `<span class="chip acc">${st.hand > 0 ? "Dextrógira" : "Levógira"} · ${st.dir > 0 ? "avante" : "atrás"}</span><span class="chip">Desde popa: ${cw ? "horario ↻" : "antihorario ↺"}</span>`;
    }

    /* ---- cámara / tema ---- */
    function setCamera(kind) {
      if (kind === "ancla") { camera.position.set(3.3, 1.5, 4.4); controls.target.set(0, -.1, 0); }
      else if (kind === "popa") { drive.updateMatrixWorld(); camera.position.copy(drive.localToWorld(V(0, .1, 5.6))); controls.target.copy(drive.localToWorld(V(0, .05, 0))); }
      else { camera.position.set(3.4, 1.6, 4.4); controls.target.set(0, .15, -.9); }
      controls.update();
    }
    function applyTheme() {
      sceneA.background = new THREE.Color(tok("--sea"));
      sceneH.background = new THREE.Color(tok("--sea-2"));
      seabedMat.color.set(tok("--sea-2"));
      hullMat.color.set(tok("--muted"));
      pMat.color.set(tok("--ink"));
      hiColor = new THREE.Color(tok("--accent"));
      helperMat.color.set(tok("--accent"));
      if (arrow) arrow.traverse(c => { if (c.material) c.material.color.set(tok("--accent")); });
      applyHighlight(); invalidate();
    }

    /* ---- render loop ---- */
    let raf = 0, last = 0, inView = true, dirty = true, spin = 0;
    const invalidate = () => { dirty = true; start(); };
    const tmpV = new THREE.Vector3();
    function updateLabel() {
      if (!st.sel || st.tab === "quiz") { labelEl.hidden = true; return; }
      if (st.tab === "helice") { drive.updateMatrixWorld(); tmpV.copy(HLABEL[st.sel]); drive.localToWorld(tmpV); }
      else if (st.labelPos) tmpV.copy(st.labelPos); else { labelEl.hidden = true; return; }
      tmpV.project(camera);
      const w = stageEl.clientWidth, h = stageEl.clientHeight;
      if (tmpV.z > 1) { labelEl.hidden = true; return; }
      labelEl.hidden = false;
      labelEl.textContent = partInfo(st.sel)[0];
      labelEl.style.left = Math.max(40, Math.min(w - 40, (tmpV.x * .5 + .5) * w)) + "px";
      labelEl.style.top = Math.max(30, (-tmpV.y * .5 + .5) * h) + "px";
    }
    function animProp(dt) {
      const sp = st.hand * st.dir;
      prop.rotation.z -= sp * dt * Math.PI * 2 * .55;
      for (let i = 0; i < NP; i++) {
        pzz[i] += st.dir * dt * (1.2 + (1.3 - pr[i]) * 1.4);
        pa[i] -= sp * dt * .9 * (pzz[i] > 0 === st.dir > 0 ? 1 : .2);
        if (pzz[i] > 4) pzz[i] = -3; if (pzz[i] < -3) pzz[i] = 4;
        ppos[i * 3] = pr[i] * Math.cos(pa[i]); ppos[i * 3 + 1] = pr[i] * Math.sin(pa[i]); ppos[i * 3 + 2] = pzz[i];
      }
      pGeo.attributes.position.needsUpdate = true;
    }
    function frame(now) {
      raf = 0;
      const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
      const animating = st.tab === "helice" && !reduce;
      if (animating) animProp(dt);
      const moved = controls.update();
      const busy = animating || moved || dirty || controls.autoRotate;
      if (busy) {
        renderer.render(st.tab === "helice" ? sceneH : sceneA, camera);
        updateLabel();
        dirty = false;
      }
      if (busy && !raf && inView && !document.hidden && st.tab !== "quiz") raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && inView && !document.hidden && st.tab !== "quiz") { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    controls.addEventListener("change", invalidate);
    controls.addEventListener("start", () => { controls.autoRotate = false; });

    const ro = new ResizeObserver(() => {
      const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return;
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate();
    });
    ro.observe(stageEl);
    const io = new IntersectionObserver(es => { inView = es.some(e => e.isIntersecting); if (inView) invalidate(); else stop(); });
    io.observe(stageEl);
    const onVis = () => (document.hidden ? stop() : invalidate());
    document.addEventListener("visibilitychange", onVis);

    /* ---- picking (tap, no arrastre) ---- */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let down = null;
    const visibleChain = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const onDown = e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; };
    const onUp = e => {
      if (!down) return;
      const d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
      if (d > 8 || dt > 600) return;
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObject(curRoot(), true).filter(h => h.object.userData.parts && visibleChain(h.object));
      if (hits.length) { const ps = hits[0].object.userData.parts; select(ps[ps.length - 1]); controls.autoRotate = false; }
      else select(null);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    /* ---- controles UI ---- */
    function setPressed(group, btn) { group.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === btn))); }
    function showTab(t) {
      st.tab = t; st.sel = null;
      el.querySelectorAll("[data-tabs] button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tab === t)));
      $("[data-view3d]").hidden = t === "quiz";
      $("[data-quiz]").hidden = t !== "quiz";
      $("[data-ctl-ancla]").hidden = t !== "ancla";
      $("[data-ctl-helice]").hidden = t !== "helice";
      if (t === "quiz") { stop(); if (!quiz) newRound(); else renderQuiz(); return; }
      applyHighlight();
      if (t === "ancla") { setCamera("ancla"); controls.autoRotate = !reduce; controls.autoRotateSpeed = .9; renderAnchorInfo(); }
      else { setCamera("helice"); controls.autoRotate = false; renderHeliceInfo(); }
      renderHint(); renderParts(); renderFicha(); labelEl.hidden = true; invalidate();
    }
    const onClick = e => {
      const b = e.target.closest("button"); if (!b || !el.contains(b)) return;
      if (b.dataset.tab) return showTab(b.dataset.tab);
      if (b.dataset.a != null) { setPressed(b.parentElement, b); buildAnchor(+b.dataset.a); applyTheme(); renderAnchorInfo(); renderParts(); renderFicha(); controls.autoRotate = !reduce; return invalidate(); }
      if (b.dataset.p) { select(st.sel === b.dataset.p ? null : b.dataset.p); return; }
      if (b.hasAttribute("data-popa")) { setCamera("popa"); return invalidate(); }
      const grp = b.parentElement;
      if (grp.matches("[data-hand]")) { setPressed(grp, b); st.hand = +b.dataset.v; buildBlades(); buildArrow(); renderHeliceInfo(); renderHint(); return invalidate(); }
      if (grp.matches("[data-dir]")) { setPressed(grp, b); st.dir = +b.dataset.v; buildArrow(); renderHeliceInfo(); renderHint(); return invalidate(); }
      if (grp.matches("[data-twin]")) { st.twin = b.dataset.v === "1"; renderHeliceInfo(); return; }
      if (b.dataset.q != null) return answer(+b.dataset.q);
      if (b.hasAttribute("data-next")) { quiz.i++; return renderQuiz(); }
      if (b.hasAttribute("data-again")) return newRound();
    };
    el.addEventListener("click", onClick);

    /* ---- quiz ---- */
    let quiz = null;
    const quizEl = $("[data-quiz]");
    function newRound() {
      quiz = { items: shuffle(QUIZ.slice()).slice(0, 10).map(q => ({ ...q, opts: shuffle([q.a, ...q.w]) })), i: 0, ok: 0, answered: false };
      renderQuiz();
    }
    function renderQuiz() {
      const n = quiz.items.length;
      if (quiz.i >= n) {
        const best = Math.max(store.get("best", 0) || 0, quiz.ok); store.set("best", best);
        quizEl.innerHTML = `<p class="eyebrow">Resultado</p><h3>${quiz.ok} / ${n} correctas</h3>
          <p class="${quiz.ok === n ? "fb-ok" : "muted"}">${quiz.ok === n ? "Ronda perfecta." : quiz.ok >= 8 ? "Muy bien; repasa las que fallaste." : "Repasa las fichas de ancla y hélice y vuelve a intentarlo."}</p>
          <p class="small muted">Mejor marca: ${best} / ${n}</p>
          <div class="row"><button type="button" class="btn primary" data-again>Otra ronda</button></div>`;
        if (quiz.ok === n && !quiz.bonus) { quiz.bonus = true; ctx.award(30, "Quiz ancla y hélice sin fallos"); }
        return;
      }
      const it = quiz.items[quiz.i]; quiz.answered = false;
      quizEl.innerHTML = `<div class="row" style="justify-content:space-between"><p class="eyebrow">Pregunta ${quiz.i + 1} de ${n}</p><span class="chip ok">${quiz.ok} aciertos</span></div>
        <div class="ah-bar"><i style="width:${(quiz.i / n) * 100}%"></i></div>
        <h4>${esc(it.q)}</h4>
        <div class="ah-q-opts">${it.opts.map((o, k) => `<button type="button" class="btn" data-q="${k}">${"abcd"[k]}) ${esc(o)}</button>`).join("")}</div>
        <div data-fb aria-live="polite"></div>`;
    }
    function answer(k) {
      if (quiz.answered) return; quiz.answered = true;
      const it = quiz.items[quiz.i], ok = it.opts[k] === it.a;
      quizEl.querySelectorAll("[data-q]").forEach((b, j) => { b.disabled = true; if (it.opts[j] === it.a) b.classList.add("is-ok"); else if (j === k) b.classList.add("is-bad"); });
      if (ok) { quiz.ok++; ctx.award(10, "Quiz ancla y hélice"); }
      quizEl.querySelector("[data-fb]").innerHTML = `<p class="${ok ? "fb-ok" : "fb-bad"}">${ok ? "Correcto." : "No."}</p><p class="small">${esc(it.why)}</p>
        <div class="row" style="margin-top:.5rem"><button type="button" class="btn primary" data-next>${quiz.i + 1 < quiz.items.length ? "Siguiente" : "Ver resultado"}</button></div>`;
      quizEl.querySelector("[data-next]").focus({ preventScroll: true });
    }

    /* ---- init ---- */
    buildAnchor(0); buildBlades(); buildArrow();
    const offTheme = ctx.onTheme ? ctx.onTheme(() => applyTheme()) : null;
    applyTheme();
    if (reduce) animProp(0);
    showTab("ancla");

    return () => {
      stop();
      el.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect(); io.disconnect();
      if (typeof offTheme === "function") offTheme();
      controls.dispose();
      [sceneA, sceneH].forEach(s => { s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); }); s.clear(); });
      [steel, bronze, shaftMat, accentMat].forEach(m => m.dispose());
      envTex.dispose(); pmrem.dispose();
      renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss();
      renderer.domElement.remove();
      el.innerHTML = "";
    };
  }
};
