// Astillero 3D — nomenclatura náutica por sistemas sobre modelos procedurales (lancha, velero, catamarán).
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const ID = "astillero";
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (n, d = 2) => n.toFixed(d).replace(".", ",");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ───────────────────────── Glosario (definiciones cortas, contrastadas con q_nom) ───────────────────────── */
const G = { dir: "Direcciones y zonas", casco: "Casco", cub: "Cubierta y habitabilidad", seg: "Seguridad y amarre", fon: "Equipo de fondeo",
  tim: "Timón", hel: "Propulsión", jar: "Arboladura y jarcia", vel: "Velas", est: "Estructura", cat: "Multicasco" };
const D = {
  proa: ["Proa", G.dir, "Parte delantera de la embarcación que, al avanzar, va cortando las aguas. Suele ser más fina que la popa."],
  popa: ["Popa", G.dir, "Parte trasera, opuesta a la proa. En ella van normalmente el timón y la hélice."],
  estribor: ["Costado de estribor", G.dir, "Banda derecha mirando de popa a proa. Costado: parte lateral exterior del casco. Luz de costado verde."],
  babor: ["Costado de babor", G.dir, "Banda izquierda mirando de popa a proa. Costado: parte lateral exterior del casco. Luz de costado roja."],
  costado: ["Costado", G.casco, "Parte lateral exterior del casco, de proa a popa; cada embarcación tiene un costado de babor y otro de estribor."],
  amura_er: ["Amura de estribor", G.dir, "Parte del costado, cerca de la proa, donde el casco empieza a estrecharse (la manga disminuye) para formar la proa. Lado derecho."],
  amura_br: ["Amura de babor", G.dir, "Parte curva del costado cercana a la proa, donde el casco se estrecha para formarla. Lado izquierdo."],
  aleta_er: ["Aleta de estribor", G.dir, "Parte del costado donde la manga va disminuyendo para cerrar y formar la popa. Lado derecho."],
  aleta_br: ["Aleta de babor", G.dir, "Parte del costado izquierdo donde la manga va disminuyendo para cerrar y formar la popa."],
  traves_er: ["Través de estribor", G.dir, "Dirección perpendicular a la quilla (a la línea de crujía), hacia la banda de estribor, en la parte media del barco."],
  traves_br: ["Través de babor", G.dir, "Dirección perpendicular a la quilla (a la línea de crujía), hacia la banda de babor."],
  crujia: ["Línea / plano de crujía", G.dir, "Línea de crujía: eje de simetría longitudinal de la proyección horizontal del casco. El plano de crujía divide la embarcación en dos mitades: babor y estribor."],
  obraviva: ["Obra viva (carena)", G.casco, "Parte del casco que queda por debajo de la línea de flotación."],
  obramuerta: ["Obra muerta", G.casco, "Parte del casco por encima de la línea de flotación. Sobre ella ejerce su presión el viento."],
  flotacion: ["Línea de flotación", G.casco, "Intersección del casco con la superficie del agua. El plano de flotación separa la obra viva de la obra muerta."],
  francobordo: ["Francobordo", G.casco, "Distancia vertical medida sobre el costado desde la línea de flotación en máxima carga hasta la cubierta estanca más alta."],
  pantoque: ["Pantoque", G.casco, "Zona curva (o codillo) del casco donde el fondo se une con el costado."],
  quilla: ["Quilla", G.casco, "Pieza estructural que va de proa a popa por la parte inferior del casco y en la que se asienta todo su armazón."],
  roda: ["Roda", G.casco, "Prolongación estructural de la quilla hacia la proa; remata el casco por delante."],
  codaste: ["Codaste", G.casco, "Prolongación vertical o inclinada de la quilla hacia la popa."],
  espejo: ["Espejo de popa", G.casco, "Superficie plana, más o menos vertical, que cierra el casco por popa."],
  regala: ["Regala", G.casco, "Pieza longitudinal situada en la parte superior de la borda, que la remata."],
  borda: ["Borda", G.casco, "Parte superior del costado, comprendida entre la cubierta y la regala."],
  cubierta: ["Cubierta", G.cub, "Superficie que cierra el casco por su parte superior, haciéndolo estanco; va de proa a popa."],
  banera: ["Bañera", G.cub, "Cámara abierta, generalmente a popa, donde va la tripulación y suele ir instalada la caña o la rueda del timón."],
  imbornal: ["Imbornal", G.cub, "Agujero para dar salida al agua que se acumula en cubierta o en la bañera, sobre todo la que embarca en los golpes de mar. Debe estar libre."],
  escotilla: ["Escotilla", G.cub, "Abertura, generalmente rectangular, en la cubierta para dar paso a personas y materiales al interior."],
  lumbrera: ["Lumbrera", G.cub, "Abertura en cubierta, generalmente con cristales, cuyo objeto casi único es dar luz y ventilación a las cámaras."],
  portillo: ["Portillo", G.cub, "Abertura en el costado o en la cabina, a menudo circular («ojo de buey»), para dar luz y ventilación. Puede ser fijo o practicable."],
  manguerote: ["Manguerote", G.cub, "Conducto de ventilación con boca orientable que recoge aire para los interiores. Con mal tiempo se orienta a sotavento."],
  tambucho: ["Tambucho", G.cub, "Cierre (normalmente corredizo) de la entrada a la cámara desde la bañera."],
  cabina: ["Cabina (superestructura)", G.cub, "Construcción sobre la cubierta que forma la cámara habitable."],
  consola: ["Consola / puesto de gobierno", G.cub, "Mueble donde van la rueda del timón, los mandos del motor y los instrumentos."],
  parabrisas: ["Parabrisas", G.cub, "Protege el puesto de gobierno del viento y los rociones."],
  plataforma: ["Plataforma de baño", G.cub, "Plataforma a popa para subir del agua. Es desmontable / no estructural: no cuenta en la eslora total."],
  candelero: ["Candelero", G.seg, "Pieza vertical, generalmente metálica, con orificios por los que pasan los guardamancebos; también sirve para afirmar pasamanos."],
  guardamancebo: ["Guardamancebo", G.seg, "Cable o cabo que, sostenido por los candeleros, va de proa a popa por las bandas para seguridad de la tripulación."],
  pulpito: ["Púlpito", G.seg, "Barandilla metálica rígida de proa en la que empiezan los guardamancebos."],
  balcon: ["Balcón (púlpito de popa)", G.seg, "Barandilla metálica rígida de popa en la que terminan los guardamancebos."],
  cornamusa: ["Cornamusa", G.seg, "Pieza de dos brazos fijada en cubierta para hacer firme (amarrar) un cabo."],
  bita: ["Bita", G.seg, "Columna robusta fija en cubierta para hacer firmes los cabos de amarre o la cadena del ancla."],
  escoben: ["Escobén", G.fon, "Orificio (en la proa o en la cubierta) por el que pasa la cadena del ancla."],
  molinete: ["Molinete", G.fon, "Máquina para levar o arriar la cadena del ancla. Cobrar cadena con él es «virar»; arriarla poco a poco, «filar»."],
  barboten: ["Barbotén", G.fon, "Corona del molinete con muescas en las que encajan los eslabones de la cadena para cobrarla."],
  ancla: ["Ancla", G.fon, "Pieza que se agarra al fondo. La línea de fondeo es: ancla + cadena (unida por grillete al arganeo) + estacha o cabo."],
  rueda: ["Rueda del timón", G.tim, "Al girarla a una banda, la proa cae a esa misma banda. Transmite el giro a la mecha mediante guardines o sistema hidráulico."],
  cana: ["Caña del timón", G.tim, "Palanca unida a la cabeza de la mecha. Mueve la pala a la banda contraria: caña a babor → la proa cae a estribor."],
  mecha: ["Mecha", G.tim, "Eje del timón; vincula la caña (o el sector de la rueda) con la pala."],
  limera: ["Limera", G.tim, "Abertura o tubo en la bovedilla, sobre el codaste, por donde pasa la mecha del timón. Permanece inmóvil al gobernar."],
  pala: ["Pala del timón", G.tim, "Parte plana del timón, sumergida, que desvía el agua para gobernar (también «azafrán»)."],
  helice: ["Hélice", G.hel, "Conjunto de palas que giran alrededor de un eje y empujan el agua, produciendo la fuerza de reacción que propulsa la embarcación."],
  helice_ab: ["Hélice de palas abatibles", G.hel, "Sus palas se pliegan cuando no se usa el motor para reducir al mínimo la resistencia al navegar a vela."],
  gemelas: ["Hélices gemelas de giro al exterior", G.hel, "Babor levógira y estribor dextrógira (vistas desde popa, avante). Compensan mutuamente la presión lateral de las palas."],
  eje: ["Eje de la hélice", G.hel, "Transmite el giro del motor a la hélice."],
  bocina: ["Bocina", G.hel, "Conducto por el que el eje de la hélice atraviesa el casco sin que entre agua. Su deterioro supone riesgo de inundación."],
  arbotante: ["Arbotante", G.hel, "Soporte exterior que sujeta el eje de la hélice por fuera del casco, cerca de la hélice."],
  grifo: ["Grifo de fondo", G.casco, "Válvula situada bajo la línea de flotación para la entrada o salida de agua de mar a servicios (refrigeración, aseos…)."],
  orza: ["Orza / quilla de lastre", G.casco, "Aleta bajo el casco que reduce el abatimiento y la deriva; con su lastre baja el centro de gravedad y da estabilidad."],
  bulbo: ["Bulbo", G.casco, "Lastre en el extremo inferior de la quilla; baja el centro de gravedad y aumenta el par adrizante."],
  mastil: ["Mástil (palo)", G.jar, "Percha vertical que sostiene las velas y la jarcia."],
  botavara: ["Botavara", G.jar, "Percha horizontal articulada al mástil en la que se afirma el pujamen de la mayor."],
  obenques: ["Obenques", G.jar, "Cables de la jarcia firme que sujetan el mástil lateralmente, hacia las bandas."],
  obenquillo: ["Obenquillos", G.jar, "Obenques bajos: van de cubierta al mástil por debajo de las crucetas."],
  crucetas: ["Crucetas", G.jar, "Perchas transversales del mástil que separan los obenques para mejorar su ángulo de trabajo."],
  estay: ["Estay (de proa)", G.jar, "Cable de la jarcia firme que sujeta el mástil hacia proa; en él va envergado el foque o génova."],
  backstay: ["Backstay (estay de popa)", G.jar, "Cable de la jarcia firme que sujeta el mástil hacia popa."],
  genova: ["Foque / génova", G.vel, "Vela triangular de proa envergada en el estay. El génova es un foque grande que sobrepasa el mástil."],
  mayor: ["Mayor", G.vel, "Vela principal, envergada en el mástil y en la botavara."],
  gratil: ["Grátil", G.vel, "Borde de ataque de la vela, el que va junto al mástil (o al estay)."],
  baluma: ["Baluma", G.vel, "Borde de salida (popel) de la vela, entre el puño de driza y el de escota."],
  pujamen: ["Pujamen", G.vel, "Borde inferior de la vela; en la mayor va a lo largo de la botavara."],
  winche: ["Winche", G.jar, "Tambor giratorio para cobrar escotas y drizas con poco esfuerzo."],
  escota: ["Escota", G.jar, "Cabo de la jarcia de labor que sirve para cazar o amollar una vela."],
  patin: ["Casco (patín)", G.cat, "Cada uno de los dos flotadores de un catamarán; dan gran estabilidad de formas."],
  puente: ["Puente", G.cat, "Estructura que une los dos cascos y sostiene la cubierta, la bañera y el salón, elevada sobre el agua."],
  trampolin: ["Trampolín (red)", G.cat, "Red tensada entre los cascos a proa del puente; deja pasar el agua y ahorra peso."],
  viga: ["Viga de proa", G.cat, "Traviesa delantera que une los cascos; en ella se afirman el estay y el trampolín."],
  quillote: ["Quillote", G.cat, "Quilla baja y larga bajo cada casco: reduce la deriva y protege timón y hélice al varar."],
  // Estructura
  sobrequilla: ["Sobrequilla", G.est, "Pieza longitudinal colocada por dentro sobre la quilla para reforzarla."],
  cuaderna: ["Cuadernas", G.est, "Piezas transversales curvas que, encajadas en la quilla y separadas entre sí, forman las «costillas» y dan forma al casco."],
  maestra: ["Cuaderna maestra", G.est, "La cuaderna situada en la parte media de la eslora; es la más ancha."],
  varenga: ["Varenga", G.est, "Pieza transversal que une por el fondo la parte baja de cada cuaderna con la quilla."],
  bao: ["Baos", G.est, "Piezas que atraviesan el barco de babor a estribor; aguantan los costados y sostienen la cubierta."],
  palmejar: ["Palmejar", G.est, "Refuerzo longitudinal por el interior del costado que liga las cuadernas entre sí."],
  trancanil: ["Trancanil", G.est, "Pieza longitudinal que une los extremos de los baos con el costado, en el borde de la cubierta."],
  mamparo: ["Mamparo", G.est, "Tabique que divide el interior en compartimentos. Los estancos ayudan a mantener la flotabilidad."],
  colision: ["Mamparo de colisión", G.est, "Mamparo estanco de proa que limita la inundación en caso de choque por proa."],
  plan: ["Plan", G.est, "Parte interior, casi horizontal, del fondo de la embarcación, próxima a la quilla."],
  sentina: ["Sentina", G.est, "Fondo interior del casco, sobre la quilla, donde se reúnen las aguas de diferentes procedencias."],
  bomba: ["Bomba de achique", G.est, "Extrae el agua que ha entrado a bordo, sobre todo la de la sentina."],
  forro: ["Forro (casco)", G.est, "Revestimiento exterior del casco, fijado sobre las cuadernas."],
};
const nm = k => (D[k] ? D[k][0] : k);

/* ───────────────────────── CSS ───────────────────────── */
const CSS = `
.m-astillero{display:flex;flex-direction:column;gap:.7rem;min-width:0}
.m-astillero .ma-bar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
.m-astillero .seg button{min-height:36px}
.m-astillero .seg button[disabled]{opacity:.45;cursor:not-allowed}
.m-astillero .ma-sys{display:flex;gap:.4rem;overflow-x:auto;padding:2px 1px 4px;scrollbar-width:thin;min-width:0}
@media (min-width:601px){.m-astillero .ma-sys{flex-wrap:wrap;overflow:visible}}
.m-astillero .ma-sys[hidden]{display:none}
.m-astillero .ma-sys button{flex:none;display:inline-flex;align-items:center;gap:.45em;min-height:36px;padding:.25em .8em;border-radius:999px;border:1px solid var(--line);background:var(--sheet);color:var(--ink);font:600 .84rem/1.1 var(--f-body);cursor:pointer;white-space:nowrap}
.m-astillero .ma-sys button:hover{background:var(--sea)}
.m-astillero .ma-sys button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.m-astillero .ma-sys .ct{font:600 .7rem/1 var(--f-mono);opacity:.7}
.m-astillero .ma-sys .ct.done{color:var(--ok);opacity:1}
.m-astillero .ma-sys button[aria-pressed="true"] .ct.done{color:inherit}
.m-astillero .ma-main{display:grid;gap:1rem;grid-template-columns:minmax(0,1fr)}
@media (min-width:980px){.m-astillero .ma-main{grid-template-columns:minmax(0,1fr) 320px}}
.m-astillero .ma-left{display:flex;flex-direction:column;gap:.7rem;min-width:0}
.m-astillero .ma-stage{height:clamp(380px,64vh,620px);background:linear-gradient(180deg,var(--sheet) 0%,var(--sea) 100%);touch-action:none;user-select:none;-webkit-user-select:none}
@media (max-width:600px){.m-astillero .ma-stage{height:clamp(300px,58vh,460px)}}
.m-astillero .ma-stage canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;outline:none}
.m-astillero .ma-stage canvas.pick{cursor:pointer}
.m-astillero .ma-co{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.m-astillero .ma-co[hidden]{display:none}
.m-astillero .ma-co svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.m-astillero .ma-co polyline{fill:none;stroke:var(--ink);stroke-width:1.2;opacity:.6}
.m-astillero .ma-co circle{fill:var(--sheet);stroke:var(--ink);stroke-width:1.6}
.m-astillero .ma-co g.on polyline{stroke:var(--accent);stroke-width:2;opacity:1}
.m-astillero .ma-co g.on circle{fill:var(--accent);stroke:var(--sheet)}
.m-astillero .ma-co g.hov polyline{stroke:var(--accent);opacity:.9}
.m-astillero .ma-lb{position:absolute;left:0;top:0;pointer-events:auto;display:flex;align-items:center;gap:6px;white-space:nowrap;font:600 .8rem/1.15 var(--f-body);color:var(--ink);background:color-mix(in srgb,var(--sheet) 94%,transparent);border:1px solid var(--line);border-radius:5px;padding:3px 8px 3px 4px;cursor:pointer;box-shadow:var(--shadow);will-change:transform}
.m-astillero .ma-lb .n{display:grid;place-items:center;min-width:18px;height:18px;border-radius:9px;background:var(--sea);font:600 .68rem/1 var(--f-mono);color:var(--ink)}
.m-astillero .ma-lb:hover,.m-astillero .ma-lb.hov{border-color:var(--accent)}
.m-astillero .ma-lb.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.m-astillero .ma-lb.on .n{background:var(--accent-ink);color:var(--accent)}
.m-astillero .ma-co.num .ma-lb{padding:0;border-radius:50%;width:22px;height:22px;justify-content:center;border-color:var(--ink)}
.m-astillero .ma-co.num .ma-lb .t{display:none}
.m-astillero .ma-co.num .ma-lb .n{background:transparent;min-width:0}
.m-astillero .ma-co.num .ma-lb.on .n{color:var(--accent-ink)}
.m-astillero .ma-cota{position:absolute;left:0;top:0;font:600 .8rem/1.2 var(--f-mono);background:var(--sheet);color:var(--accent);border:1px solid var(--accent);border-radius:5px;padding:2px 8px;white-space:nowrap;box-shadow:var(--shadow);pointer-events:none;will-change:transform}
.m-astillero .ma-cota[hidden]{display:none}
.m-astillero .ma-hud{position:absolute;left:8px;bottom:8px;display:flex;flex-wrap:wrap;gap:6px;pointer-events:none}
.m-astillero .ma-hud > *{pointer-events:auto}
.m-astillero .ma-hud .btn{background:color-mix(in srgb,var(--sheet) 90%,transparent);backdrop-filter:blur(4px)}
.m-astillero .ma-hud .btn[aria-pressed="true"]{border-color:var(--accent);color:var(--accent)}
.m-astillero .ma-hud [hidden]{display:none}
.m-astillero .ma-banner{position:absolute;top:8px;left:50%;transform:translateX(-50%);max-width:calc(100% - 16px);display:flex;flex-wrap:wrap;gap:.2rem .6rem;align-items:baseline;justify-content:center;padding:.4rem .9rem;border-radius:var(--r-sm);background:color-mix(in srgb,var(--sheet) 94%,transparent);border:1px solid var(--line);box-shadow:var(--shadow);pointer-events:none;text-align:center}
.m-astillero .ma-banner b{font:600 1.3rem/1.1 var(--f-display);color:var(--accent)}
.m-astillero .ma-banner[hidden]{display:none}
.m-astillero .ma-dir{position:absolute;inset:0;background:var(--sheet);display:flex;align-items:center;justify-content:center;padding:6px}
.m-astillero .ma-dir[hidden]{display:none}
.m-astillero .ma-dir svg{width:100%;height:100%;max-width:600px}
@media (max-width:600px){.m-astillero .ma-stage.dirm{height:auto;aspect-ratio:560/440}.m-astillero .ma-dir text{font-size:21px}}
.m-astillero .ma-dir .ring{fill:none;stroke:var(--line);stroke-width:1.5;stroke-dasharray:3 5}
.m-astillero .ma-dir .ray{stroke:var(--muted);stroke-width:1.2;opacity:.55}
.m-astillero .ma-dir .hullo{fill:none;stroke:var(--ink);stroke-width:2.2;pointer-events:none}
.m-astillero .ma-dir .dk{cursor:pointer}
.m-astillero .ma-dir .half{opacity:.14;transition:opacity .2s}
.m-astillero .ma-dir .half.br{fill:var(--port)}
.m-astillero .ma-dir .half.er{fill:var(--stbd)}
.m-astillero .ma-dir .cap{fill:var(--ink);opacity:.08;transition:opacity .2s}
.m-astillero .ma-dir .strip{fill:none;stroke:var(--ink);stroke-width:5;opacity:.28;stroke-linecap:round;transition:opacity .2s}
.m-astillero .ma-dir .hit{fill:none;stroke:transparent;stroke-width:26;stroke-linecap:round}
.m-astillero .ma-dir .arrow{stroke:var(--ink);stroke-width:2;opacity:.45;fill:none}
.m-astillero .ma-dir .head{fill:var(--ink);opacity:.45}
.m-astillero .ma-dir .cj{stroke:var(--ink);stroke-width:1.6;stroke-dasharray:7 5;opacity:.6}
.m-astillero .ma-dir text{font:600 19px var(--f-body);fill:var(--ink);paint-order:stroke;stroke:var(--sheet);stroke-width:5px;stroke-linejoin:round}
.m-astillero .ma-dir text.side{font:700 16px var(--f-display);letter-spacing:.12em;dominant-baseline:middle}
.m-astillero .ma-dir text.sm{font-size:15px;fill:var(--muted);font-weight:600}
.m-astillero .ma-dir .dk:hover text{fill:var(--accent)}
.m-astillero .ma-dir .dk.on text{fill:var(--accent)}
.m-astillero .ma-dir .dk.on .half{opacity:.5}
.m-astillero .ma-dir .dk.on .cap{fill:var(--accent);opacity:.75}
.m-astillero .ma-dir .dk.on .strip{stroke:var(--accent);stroke-width:9;opacity:1}
.m-astillero .ma-dir .dk.on .arrow,.m-astillero .ma-dir .dk.on .cj{stroke:var(--accent);opacity:1;stroke-width:3}
.m-astillero .ma-dir .dk.on .head{fill:var(--accent);opacity:1}
.m-astillero .ma-dir .dk.bad .half,.m-astillero .ma-dir .dk.bad .cap{fill:var(--bad);opacity:.5}
.m-astillero .ma-dir .dk.bad .strip,.m-astillero .ma-dir .dk.bad .arrow{stroke:var(--bad);opacity:1}
.m-astillero .ma-dir.quiz .dk:not(.rv) text.lbl{display:none}
.m-astillero .ma-side{display:flex;flex-direction:column;gap:.8rem;min-width:0}
.m-astillero .ma-ficha h3{margin:.15rem 0 .35rem}
.m-astillero .ma-trap{margin-top:.6rem;padding:.45rem .6rem;border-left:3px solid var(--warn);background:color-mix(in srgb,var(--warn) 10%,transparent);border-radius:0 var(--r-sm) var(--r-sm) 0;font-size:.875rem}
.m-astillero .ma-trap b{color:var(--warn)}
.m-astillero .ma-list{list-style:none;margin:0;padding:0;display:grid;gap:4px}
@media (min-width:600px) and (max-width:979px){.m-astillero .ma-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
.m-astillero .ma-list button{width:100%;display:flex;align-items:center;gap:.55rem;text-align:left;border:1px solid var(--line);background:var(--sheet);border-radius:var(--r-sm);padding:.3rem .5rem;min-height:36px;cursor:pointer;font:600 .9rem/1.2 var(--f-body);color:var(--ink)}
.m-astillero .ma-list button:hover,.m-astillero .ma-list button.hov{border-color:var(--accent)}
.m-astillero .ma-list button[disabled]{cursor:default;opacity:1}
.m-astillero .ma-list .n{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:600 .72rem/1 var(--f-mono);background:var(--sea);color:var(--ink)}
.m-astillero .ma-list button[aria-pressed="true"]{border-color:var(--accent);box-shadow:inset 3px 0 0 var(--accent)}
.m-astillero .ma-list button[aria-pressed="true"] .n{background:var(--accent);color:var(--accent-ink)}
.m-astillero .ma-list .st{margin-left:auto;font:600 .72rem/1 var(--f-mono);color:var(--ok)}
.m-astillero .ma-list .val{margin-left:auto;font:600 .8rem/1 var(--f-mono);color:var(--muted)}
.m-astillero .ma-qbox{display:flex;flex-direction:column;gap:.6rem}
.m-astillero .ma-qbox[hidden]{display:none}
.m-astillero .ma-qbox h3{font-size:1.25rem}
.m-astillero .ma-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem}
.m-astillero .ma-opts .btn{justify-content:flex-start;text-align:left;min-height:42px;white-space:normal;line-height:1.2}
.m-astillero .ma-opts .btn.ok{border-color:var(--ok);color:var(--ok);background:color-mix(in srgb,var(--ok) 10%,var(--sheet))}
.m-astillero .ma-opts .btn.bad{border-color:var(--bad);color:var(--bad);background:color-mix(in srgb,var(--bad) 10%,var(--sheet))}
.m-astillero .ma-read{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem .8rem;font-size:.9rem}
.m-astillero .ma-read b{font-family:var(--f-mono);font-weight:600}
.m-astillero label.ma-sl{display:grid;gap:.2rem;font-size:.9rem}
.m-astillero .ma-err{position:absolute;inset:0;display:grid;place-items:center;padding:1rem;text-align:center;color:var(--muted)}
`;
function injectCSS() {
  if (document.querySelector(`style[data-mod="${ID}"]`)) return;
  const s = document.createElement("style"); s.dataset.mod = ID; s.textContent = CSS; document.head.appendChild(s);
}
const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function tokColor(n, fb = "#888888") { const c = new THREE.Color(); try { c.setStyle(tok(n) || fb); } catch { c.setStyle(fb); } return c; }

/* ───────────────────────── Geometría auxiliar ───────────────────────── */
const UP = V(0, 1, 0);
function rod(a, b, r, mat, seg = 8) {
  const d = new THREE.Vector3().subVectors(b, a); const len = Math.max(1e-4, d.length());
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg, 1), mat);
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m;
}
class Poly extends THREE.Curve {
  constructor(pts, closed = false) {
    super(); this.p = closed ? [...pts, pts[0]] : pts.slice(); this.c = [0];
    for (let i = 1; i < this.p.length; i++) this.c.push(this.c[i - 1] + this.p[i].distanceTo(this.p[i - 1]));
    this.len = this.c[this.c.length - 1] || 1;
  }
  getPoint(t, out = new THREE.Vector3()) {
    const d = clamp(t, 0, 1) * this.len; let lo = 1, hi = this.c.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (this.c[mid] < d) lo = mid + 1; else hi = mid; }
    const a = this.p[lo - 1], b = this.p[lo], s = (this.c[lo] - this.c[lo - 1]) || 1;
    return out.copy(a).lerp(b, (d - this.c[lo - 1]) / s);
  }
}
function tube(pts, r, mat, smooth = true, closed = false, segs) {
  const curve = smooth ? new THREE.CatmullRomCurve3(pts, closed, "centripetal") : new THREE.CatmullRomCurve3(pts, closed, "catmullrom", 0);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segs || Math.max(12, pts.length * 8), r, 8, closed), mat);
}
function polyTube(pts, r, mat, closed = false) {
  return new THREE.Mesh(new THREE.TubeGeometry(new Poly(pts, closed), Math.max(16, pts.length * 3), r, 6, false), mat);
}
function rbox(w, h, d, mat, r = 0.05) { return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1)), mat); }

/* Casco paramétrico por secciones: u = 0 (espejo) … 1 (roda); y vertical (0 = flotación); z: + estribor. */
function makeHull(o) {
  const H = Object.assign({ hb: 0.08, camber: 0.05, oz: 0, N: 64, S: 16, stemRake: 0.6, type: "round", n: 2.4 }, o);
  H.u2x = u => H.xs + u * H.L;
  H.X = (u, y) => H.xs + u * H.L + H.stemRake * Math.max(0, y - H.keel(u)) * Math.pow(u, 7);
  H.b = u => Math.max(0, H.beam(u));
  H.sec = u => {
    const b = H.b(u), sh = H.sheer(u), k = H.keel(u), pts = [];
    if (H.type === "v") {
      const cz = b * 0.86, cy = Math.min(k + Math.tan(H.dead(u)) * cz, sh - 0.05);
      for (let i = 0; i <= 9; i++) { const t = i / 9; pts.push([cz * t, k + (cy - k) * t]); }
      for (let i = 1; i <= 6; i++) { const t = i / 6; pts.push([cz + (b - cz) * Math.sin(t * Math.PI / 2), cy + (sh - cy) * t]); }
    } else {
      const n = H.n, S = H.S;
      for (let i = 0; i < S; i++) {
        const th = i / (S - 1) * Math.PI / 2;
        pts.push([b * Math.pow(Math.sin(th), 2 / n), k + (sh - k) * (1 - Math.pow(Math.cos(th), 2 / n))]);
      }
    }
    pts.push([b, sh + H.hb]);
    return pts;
  };
  H.chine = u => { const p = H.sec(u); return H.type === "v" ? p[9] : p[Math.round(p.length * 0.4)]; };
  H.zAt = (u, y) => {
    const p = H.sec(u); if (y <= p[0][1]) return 0;
    for (let i = 1; i < p.length; i++) if (p[i][1] >= y) { const a = p[i - 1], c = p[i]; return a[0] + (c[0] - a[0]) * (y - a[1]) / ((c[1] - a[1]) || 1); }
    return p[p.length - 1][0];
  };
  H.surf = (u, side, y, off = 0.03) => V(H.X(u, y), y, H.oz + side * (H.zAt(u, y) + off));
  H.deckY = (u, v = 0) => H.sheer(u) + H.camber * H.b(u) * (1 - v * v);
  H.deckPt = (u, v, dy = 0) => { const y = H.deckY(u, v); return V(H.X(u, y), y + dy, H.oz + v * H.b(u)); };
  H.keelPt = (u, dy = 0) => { const k = H.keel(u); return V(H.X(u, k), k + dy, H.oz); };
  H.uOf = x => (x - H.xs) / H.L;
  return H;
}
function stations(N, extra = []) {
  const a = []; for (let i = 0; i <= N; i++) { const t = i / N; a.push(1 - Math.pow(1 - t, 1.35)); }
  for (const e of extra) { let j = 1, best = 9; for (let i = 1; i < a.length - 1; i++) { const d = Math.abs(a[i] - e); if (d < best) { best = d; j = i; } } a[j] = e; }
  return a.sort((p, q) => p - q);
}
function ringOf(H, u) {
  const p = H.sec(u), r = [];
  for (let j = p.length - 1; j >= 1; j--) r.push([-p[j][0], p[j][1]]);
  r.push([0, p[0][1]]);
  for (let j = 1; j < p.length; j++) r.push([p[j][0], p[j][1]]);
  return r;
}
function hullGeo(H, us) {
  const pos = [], idx = []; let R = 0;
  for (const u of us) { const r = ringOf(H, u); R = r.length; for (const [z, y] of r) pos.push(H.X(u, y), y, z); }
  for (let i = 0; i < us.length - 1; i++) for (let r = 0; r < R - 1; r++) {
    const a = i * R + r, b = (i + 1) * R + r; idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function transomGeo(H) {
  const r = ringOf(H, 0); const cy = r.reduce((s, q) => s + q[1], 0) / r.length; const pos = [H.X(0, cy), cy, 0], idx = [];
  for (const [z, y] of r) pos.push(H.X(0, y) - 0.001, y, z);
  for (let i = 1; i < r.length; i++) idx.push(0, i + 1, i);
  idx.push(0, 1, r.length);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function gridGeo(H, us, M, yOf, keep) {
  const pos = [], idx = [], W = M + 1;
  for (const u of us) { const b = H.b(u); for (let j = 0; j <= M; j++) { const v = -1 + 2 * j / M, y = yOf(u, v); pos.push(H.X(u, y), y, v * b); } }
  for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < M; j++) {
    const uc = (us[i] + us[i + 1]) / 2, vc = -1 + (2 * j + 1) / M; if (!keep(uc, vc)) continue;
    const a = i * W + j, b = (i + 1) * W + j; idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function cockpitWalls(H, us, ck) {
  const pos = [], idx = [];
  const quad = (a, b, c, d) => { const n = pos.length / 3; pos.push(...a, ...b, ...c, ...d); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  const P = (u, v, y) => [H.X(u, y), y, v * H.b(u)];
  const seg = us.filter(u => u >= ck.u0 - 1e-9 && u <= ck.u1 + 1e-9);
  for (const s of [-1, 1]) for (let i = 0; i < seg.length - 1; i++) {
    const a = seg[i], b = seg[i + 1], v = s * ck.vc;
    quad(P(a, v, H.deckY(a, v)), P(b, v, H.deckY(b, v)), P(b, v, ck.fl), P(a, v, ck.fl));
  }
  const u = ck.u1, K = 12;
  for (let j = 0; j < K; j++) {
    const v0 = -ck.vc + 2 * ck.vc * j / K, v1 = -ck.vc + 2 * ck.vc * (j + 1) / K;
    quad(P(u, v0, H.deckY(u, v0)), P(u, v1, H.deckY(u, v1)), P(u, v1, ck.fl), P(u, v0, ck.fl));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function waterlinePts(H) {
  const st = [];
  for (const u of H.us) {
    const p = H.sec(u); if (p[0][1] >= 0) continue;
    for (let i = 1; i < p.length; i++) if (p[i][1] >= 0) {
      const a = p[i - 1], c = p[i]; const z = a[0] + (c[0] - a[0]) * (0 - a[1]) / ((c[1] - a[1]) || 1);
      st.push(V(H.X(u, 0), 0.004, z + 0.008)); break;
    }
  }
  let lo = 0.3, hi = 1; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (H.keel(mid) < 0) lo = mid; else hi = mid; }
  const pts = []; if (H.keel(0) < 0) pts.push(V(H.X(0, 0) - 0.008, 0.004, 0));
  pts.push(...st, V(H.X(lo, 0) + 0.01, 0.004, 0));
  for (let i = st.length - 1; i >= 0; i--) pts.push(V(st[i].x, st[i].y, -st[i].z));
  return pts;
}
function hullMaterial(c, U, oz) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.36, metalness: 0, side: THREE.DoubleSide });
  const own = { cTop: { value: new THREE.Color(c.top) }, cBot: { value: new THREE.Color(c.bottom) }, cStr: { value: new THREE.Color(c.stripe) }, uOz: { value: oz } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U, own);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHp;\nuniform float uOz;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHp = vec3(position.x, position.y, position.z + uOz);");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHp;\nuniform vec3 cTop;\nuniform vec3 cBot;\nuniform vec3 cStr;\nuniform vec3 uAcc;\nuniform vec4 uHl;\nuniform vec2 uHlY;\nuniform float uT;")
      .replace("vec4 diffuseColor = vec4( diffuse, opacity );",
        `vec3 hc = vHp.y < 0.0 ? cBot : (vHp.y < 0.075 ? cStr : cTop);
        float hlK = 0.0;
        if (uHl.w > 0.5 && vHp.x >= uHl.x && vHp.x <= uHl.y && vHp.y >= uHlY.x && vHp.y <= uHlY.y && (uHl.z == 0.0 || sign(vHp.z) == uHl.z)) { hlK = 0.55 + 0.15 * sin(uT * 4.0); hc = mix(hc, uAcc, hlK); }
        vec4 diffuseColor = vec4( diffuse * hc, opacity );`)
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uAcc * hlK * 0.45;");
  };
  mat.userData.own = own;
  return mat;
}
function foil(cTop, cBot, h, sweep, thick, mat) {
  const s = new THREE.Shape(), r = Math.min(cBot, cTop) * 0.3;
  s.moveTo(cTop / 2, 0); s.lineTo(-cTop / 2, 0);
  s.lineTo(-cBot / 2 - sweep, -h + r); s.quadraticCurveTo(-cBot / 2 - sweep, -h, -cBot / 2 - sweep + r, -h);
  s.lineTo(cBot / 2 - sweep - r, -h); s.quadraticCurveTo(cBot / 2 - sweep, -h, cBot / 2 - sweep, -h + r); s.lineTo(cTop / 2, 0);
  const bs = Math.min(thick * 0.45, 0.03);
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.45, bevelSize: bs, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -thick / 2); return new THREE.Mesh(g, mat);
}
function propeller(r, n, mat, folding = false) {
  const g = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.24, r * 0.55, 16), mat); hub.rotation.z = Math.PI / 2; g.add(hub);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 0.2, r * 0.45, 16), mat); cone.rotation.z = Math.PI / 2; cone.position.x = -r * 0.5; g.add(cone);
  const bg = new THREE.SphereGeometry(1, 16, 10); bg.scale(r * 0.06, r * (folding ? 0.44 : 0.42), r * (folding ? 0.16 : 0.27)); bg.translate(0, r * 0.6, 0);
  for (let i = 0; i < n; i++) { const piv = new THREE.Group(); piv.rotation.x = i * Math.PI * 2 / n; const b = new THREE.Mesh(bg, mat); b.rotation.y = folding ? 0.35 : 0.62; piv.add(b); g.add(piv); }
  return g;
}
function anchorMesh(s, mat) {
  const g = new THREE.Group();
  const shank = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.05 * s, 0.035 * s), mat); shank.position.x = 0.25 * s; g.add(shank);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04 * s, 0.012 * s, 8, 16), mat); ring.position.x = 0.52 * s; g.add(ring);
  for (const sgn of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.11 * s, 0.3 * s, 3), mat);
    f.rotation.z = Math.PI / 2 + sgn * 0.0; f.rotation.x = sgn * 0.5; f.scale.set(1, 1, 0.45); f.position.set(-0.05 * s, -0.02 * s, sgn * 0.06 * s); g.add(f);
  }
  return g;
}

/* ───────────────────────── Construcción de modelos ───────────────────────── */
function makeMats() {
  const S = o => new THREE.MeshStandardMaterial(o);
  return {
    gel: S({ color: 0xf2f3ef, roughness: 0.3, side: THREE.DoubleSide }),
    deck: S({ color: 0xe4dfd1, roughness: 0.85, side: THREE.DoubleSide }),
    teak: S({ color: 0xa97a49, roughness: 0.75, side: THREE.DoubleSide }),
    inox: S({ color: 0xdde2e6, metalness: 0.95, roughness: 0.2 }),
    alu: S({ color: 0xc6ccd2, metalness: 0.7, roughness: 0.35 }),
    rig: S({ color: 0x7f8992, metalness: 0.85, roughness: 0.3 }),
    dark: S({ color: 0x1a242d, metalness: 0.35, roughness: 0.12, side: THREE.DoubleSide }),
    glass: S({ color: 0x547a91, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    sail: S({ color: 0xf5f1e6, roughness: 0.85, side: THREE.DoubleSide }),
    bronze: S({ color: 0xc28a3c, metalness: 0.95, roughness: 0.28 }),
    cushion: S({ color: 0xded3bd, roughness: 0.95 }),
    rope: S({ color: 0x2f5872, roughness: 0.8 }),
    black: S({ color: 0x20262b, roughness: 0.6 }),
  };
}
function newModel(key, U) {
  const m = { key, U, root: new THREE.Group(), ext: new THREE.Group(), hullG: new THREE.Group(), struct: new THREE.Group(), cotas: new THREE.Group(), help: new THREE.Group(),
    hs: [], shs: [], parts: [], hulls: [], hullMats: [], occ: [], keyMap: new Map(), minY: 0, minX: 0, topY: 1, wl: [], cotaList: [], M: makeMats() };
  m.root.add(m.hullG, m.ext, m.struct, m.cotas, m.help);
  return m;
}
function tag(m, k, obj) {
  obj.userData.k = k;
  obj.traverse(o => { if (o.isMesh) { o.userData.k = k; if (!m.keyMap.has(k)) m.keyMap.set(k, []); m.keyMap.get(k).push(o); } });
  return obj;
}
const addHs = (m, k, p, o = {}) => m.hs.push(Object.assign({ k, p }, o));
const deepen = (m, y, x) => { if (y < m.minY) { m.minY = y; m.minX = x; } };

function addHull(m, H, opt) {
  const M = m.M, ck = opt.cockpit || null;
  const us = stations(H.N, ck ? [ck.u1] : []); H.us = us;
  const mat = hullMaterial(opt.colors, m.U, H.oz); m.hullMats.push(mat); H.mat = mat;
  const hull = new THREE.Mesh(hullGeo(H, us), mat); hull.position.z = H.oz; hull.userData.hull = true;
  const tr = new THREE.Mesh(transomGeo(H), mat); tr.position.z = H.oz;
  m.hullG.add(hull, tr); tag(m, "espejo", tr); m.occ.push(hull, tr); H.mesh = hull;
  const inCk = (u, v) => ck && u < ck.u1 - 1e-6 && u >= ck.u0 && Math.abs(v) < ck.vc - 1e-6;
  const M2 = 20;
  const deck = new THREE.Mesh(gridGeo(H, us, M2, (u, v) => H.deckY(u, v), (u, v) => !inCk(u, v)), opt.deckMat || M.deck);
  deck.position.z = H.oz; m.ext.add(tag(m, "cubierta", deck)); m.occ.push(deck);
  if (ck) {
    const fl = new THREE.Mesh(gridGeo(H, us, M2, () => ck.fl, (u, v) => inCk(u, v)), M.teak); fl.position.z = H.oz;
    const wl = new THREE.Mesh(cockpitWalls(H, us, ck), M.gel); wl.position.z = H.oz;
    const g = new THREE.Group(); g.add(fl, wl); m.ext.add(tag(m, "banera", g)); m.occ.push(fl, wl);
  }
  for (const s of [-1, 1]) {
    const pts = us.filter((_, i) => i % 2 === 0 || i === us.length - 1).map(u => { const y = H.sheer(u) + H.hb; return V(H.X(u, y), y + 0.012, s * (H.b(u) + 0.01)); });
    const r = tube(pts, H.hb > 0.06 ? 0.035 : 0.028, opt.railMat || M.teak); r.position.z = H.oz; m.ext.add(tag(m, "regala", r));
  }
  const wp = waterlinePts(H); m.wl.push(...wp.map(p => V(p.x, p.y, p.z + H.oz)));
  const wlm = polyTube(wp, 0.016, m.wlMat, true); wlm.position.z = H.oz; wlm.renderOrder = 2; m.hullG.add(tag(m, "flotacion", wlm));
  m.hulls.push(H);
  return H;
}

/* Barandillas: candeleros + guardamancebos (+ púlpito / balcón) */
function rails(m, H, o) {
  const M = m.M, res = { posts: {}, wires: {} };
  const sides = o.sides || [-1, 1];
  for (const s of sides) {
    const posts = [];
    for (let i = 0; i < o.n; i++) {
      const u = o.u0 + (o.u1 - o.u0) * i / (o.n - 1), base = H.deckPt(u, s * o.v), top = base.clone().add(V(0, o.h, 0));
      m.ext.add(tag(m, "candelero", rod(base, top, 0.014, M.inox))); posts.push(top);
    }
    res.posts[s] = posts;
    const fw = o.pulpit ? o.pulpitTop(s) : null, aft = o.balcon ? o.balconTop(s) : null;
    for (const lv of o.levels || [1]) {
      const pts = posts.map(p => p.clone().add(V(0, -o.h * (1 - lv), 0)));
      if (fw) pts.push(fw.clone().add(V(0, -o.h * (1 - lv), 0)));
      if (aft) pts.unshift(aft.clone().add(V(0, -o.h * (1 - lv), 0)));
      m.ext.add(tag(m, "guardamancebo", polyTube(pts, 0.008, M.rig)));
      if (lv === 1) res.wires[s] = pts;
    }
  }
  return res;
}
function pulpit(m, H, uA, h, key = "pulpito") {
  const M = m.M, yA = H.deckY(uA, 0.85);
  const ptsTop = [V(H.X(uA, yA), yA + h, H.oz - H.b(uA) * 0.85), V(H.X(0.94, H.deckY(0.94)), H.deckY(0.94) + h, H.oz - H.b(0.94) * 0.8),
    V(H.X(1, H.sheer(1)) - 0.06, H.sheer(1) + h, H.oz), V(H.X(0.94, H.deckY(0.94)), H.deckY(0.94) + h, H.oz + H.b(0.94) * 0.8), V(H.X(uA, yA), yA + h, H.oz + H.b(uA) * 0.85)];
  const g = new THREE.Group(); g.add(tube(ptsTop, 0.022, M.inox));
  for (const p of [ptsTop[0], ptsTop[1], ptsTop[3], ptsTop[4]]) g.add(rod(p, V(p.x, p.y - h, p.z), 0.02, M.inox));
  g.add(rod(ptsTop[2], V(ptsTop[2].x - 0.05, H.sheer(1) + H.hb, H.oz), 0.02, M.inox));
  m.ext.add(tag(m, key, g));
  return { top: s => (s < 0 ? ptsTop[0] : ptsTop[4]), front: ptsTop[2] };
}
function balcon(m, H, uA, h) {
  const M = m.M, yA = H.deckY(uA, 0.9), y0 = H.deckY(0.0, 0.9);
  const pts = [V(H.X(uA, yA), yA + h, H.oz - H.b(uA) * 0.9), V(H.xs + 0.08, y0 + h, H.oz - H.b(0) * 0.85), V(H.xs + 0.08, y0 + h, H.oz - H.b(0) * 0.3)];
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const p = pts.map(q => V(q.x, q.y, H.oz + s * Math.abs(q.z - H.oz)));
    g.add(tube(p, 0.022, M.inox, false));
    for (const q of p.slice(0, 2)) g.add(rod(q, V(q.x, q.y - h, q.z), 0.02, M.inox));
  }
  m.ext.add(tag(m, "balcon", g));
  return { top: s => V(pts[0].x, pts[0].y, H.oz + s * Math.abs(pts[0].z - H.oz)), mid: V(pts[1].x, pts[1].y, H.oz + H.b(0) * 0.85) };
}
function cornamusa(m, p, rotY = 0) {
  const M = m.M, g = new THREE.Group();
  g.add(rod(V(-0.05, 0, 0), V(-0.05, 0.05, 0), 0.016, M.inox), rod(V(0.05, 0, 0), V(0.05, 0.05, 0), 0.016, M.inox));
  const horn = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.2, 4, 8), M.inox); horn.rotation.z = Math.PI / 2; horn.position.y = 0.06; g.add(horn);
  g.position.copy(p); g.rotation.y = rotY; m.ext.add(tag(m, "cornamusa", g)); return p.clone().add(V(0, 0.07, 0));
}
function molinete(m, p) {
  const M = m.M, g = new THREE.Group();
  const body = rbox(0.24, 0.14, 0.2, M.inox, 0.04); body.position.y = 0.07; g.add(body);
  const gyp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), M.black); gyp.rotation.x = Math.PI / 2; gyp.position.set(0, 0.1, 0.13);
  const gypG = new THREE.Group(); gypG.add(gyp);
  for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.07), M.black); const a = i / 8 * Math.PI * 2; t.position.set(Math.cos(a) * 0.075, 0.1 + Math.sin(a) * 0.075, 0.13); t.rotation.z = a; gypG.add(t); }
  g.add(tag(m, "barboten", gypG));
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 12), M.inox); drum.rotation.x = Math.PI / 2; drum.position.set(0, 0.1, -0.13); g.add(drum);
  g.position.copy(p); m.ext.add(tag(m, "molinete", g));
  // barbotén tagged separately: re-tag its meshes
  gypG.traverse(o => { if (o.isMesh) o.userData.k = "barboten"; });
  const arr = m.keyMap.get("molinete"); m.keyMap.set("molinete", arr.filter(o => o.userData.k === "molinete"));
  return { top: p.clone().add(V(0, 0.2, 0)), gyp: p.clone().add(V(0, 0.1, 0.2)) };
}
function hatch(m, p, w, l, open = 0, key = "escotilla", glass = false) {
  const M = m.M, g = new THREE.Group();
  const frame = rbox(l, 0.06, w, M.gel, 0.02); frame.position.y = 0.03; g.add(frame);
  const piv = new THREE.Group(); piv.position.set(l / 2, 0.065, 0);
  const lid = rbox(l + 0.02, 0.025, w + 0.02, glass ? M.glass : M.dark, 0.01); lid.position.x = -(l + 0.02) / 2; piv.add(lid); piv.rotation.z = -open; g.add(piv);
  g.position.copy(p); m.ext.add(tag(m, key, g)); m.occ.push(frame);
  return p.clone().add(V(0, 0.1 + open * l * 0.4, 0));
}
function dorade(m, p, rotY = 0) {
  const M = m.M, g = new THREE.Group();
  const box = rbox(0.22, 0.08, 0.16, M.gel, 0.03); box.position.y = 0.04; g.add(box);
  g.add(rod(V(0, 0.06, 0), V(0, 0.2, 0), 0.035, M.inox, 12));
  const cowl = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.035, 10, 16, Math.PI / 2), M.inox); cowl.position.set(0.06, 0.2, 0); cowl.rotation.z = Math.PI / 2; g.add(cowl);
  const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.05, 14, 1, true), M.inox); mouth.rotation.z = Math.PI / 2; mouth.position.set(0.125, 0.26, 0); g.add(mouth);
  g.position.copy(p); g.rotation.y = rotY; m.ext.add(tag(m, "manguerote", g)); return p.clone().add(V(0, 0.3, 0));
}
function porthole(m, p, n, r = 0.07, sx = 1, key = "portillo") {
  const M = m.M, g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CircleGeometry(r, 24), M.dark); glass.scale.x = sx; g.add(glass);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.16, 6, 24), M.inox); ring.scale.x = sx; g.add(ring);
  g.position.copy(p); g.lookAt(p.clone().add(n)); m.ext.add(tag(m, key, g)); return p;
}
function trunk(x0, x1, w0, w1, nose, y0, h, mat) {
  const s = new THREE.Shape();
  s.moveTo(x0, -w0); s.lineTo(x1 - nose, -w1); s.quadraticCurveTo(x1, -w1 * 0.7, x1, 0); s.quadraticCurveTo(x1, w1 * 0.7, x1 - nose, w1); s.lineTo(x0, w0); s.lineTo(x0, -w0);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 12 });
  g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return new THREE.Mesh(g, mat);
}
function shaftLine(m, H, xp, yp, ang, r, opt = {}) {
  const M = m.M, dir = V(Math.cos(ang), Math.sin(ang), 0), oz = H.oz;
  let x = xp, y = yp; for (let i = 0; i < 600; i++) { x += dir.x * 0.01; y += dir.y * 0.01; if (y >= H.keel(H.uOf(x))) break; }
  const P = V(xp, yp, oz), exit = V(x, y, oz);
  const shaft = rod(P.clone().addScaledVector(dir, 0.12), exit.clone().addScaledVector(dir, 0.4), 0.026, M.inox); m.ext.add(tag(m, "eje", shaft));
  const boc = rod(exit.clone().addScaledVector(dir, -0.2), exit.clone().addScaledVector(dir, 0.08), 0.055, M.bronze, 14); m.ext.add(tag(m, "bocina", boc));
  const S = P.clone().addScaledVector(dir, Math.min(0.42, exit.distanceTo(P) * 0.45)); const ky = H.keel(H.uOf(S.x));
  const st = new THREE.Group(); st.add(rod(S.clone().addScaledVector(dir, -0.08), S.clone().addScaledVector(dir, 0.08), 0.045, M.bronze, 12));
  for (const s of [-1, 1]) st.add(rod(S, V(S.x + 0.05, ky + 0.06, oz + s * 0.11), 0.018, M.bronze));
  m.ext.add(tag(m, "arbotante", st));
  const pr = propeller(r, opt.blades || 3, M.bronze, opt.folding); pr.position.copy(P); pr.rotation.z = ang; if (opt.mirror) pr.scale.z = -1;
  m.ext.add(tag(m, opt.key || "helice", pr)); deepen(m, yp - r, xp);
  return { P, exit, S, mid: P.clone().lerp(exit, 0.5) };
}
function rudder(m, H, x, cT, cB, h, opt = {}) {
  const M = m.M, k = H.keel(H.uOf(x)), gap = opt.gap ?? 0.12, top = k - gap, oz = H.oz;
  const pala = foil(cT, cB, h, opt.sweep ?? 0.05, opt.t ?? 0.06, M.bottom); pala.position.set(x, top, oz); m.ext.add(tag(m, "pala", pala));
  const xm = x + cT / 2 - cT * 0.28;
  m.ext.add(tag(m, "mecha", rod(V(xm, top - 0.02, oz), V(xm, opt.mechaTop ?? k + 0.25, oz), 0.028, M.inox)));
  const lim = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 16), M.bronze); lim.position.set(xm, k + 0.005, oz); m.ext.add(tag(m, "limera", lim));
  deepen(m, top - h, x);
  return { xm, top, k, mid: V(x - 0.05, top - h * 0.5, oz) };
}
function sail(A, B, C, camber, mat, bulgeSign = -1, segs = 14) {
  const pos = [], idx = []; const n = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A)).normalize();
  if (Math.sign(n.z || 1) !== Math.sign(bulgeSign)) n.negate();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, L = A.clone().lerp(B, t), R = C.clone().lerp(B, t), chord = L.distanceTo(R);
    for (let j = 0; j <= segs; j++) { const s = j / segs; const P = L.clone().lerp(R, s).addScaledVector(n, camber * chord * 4 * s * (1 - s) * Math.pow(1 - s, 0.4) * 1.2); pos.push(P.x, P.y, P.z); }
  }
  const W = segs + 1; for (let i = 0; i < segs; i++) for (let j = 0; j < segs; j++) { const a = i * W + j, b = a + W; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
const sailPt = (A, B, C, t, s, bulge) => A.clone().lerp(B, t).lerp(C.clone().lerp(B, t), s).add(bulge || V());

/* Estructura interna genérica a partir del casco */
function buildStructure(m, H, withHs) {
  const sm = {
    quilla: new THREE.MeshStandardMaterial({ color: 0x6e4220, roughness: 0.7 }), sobre: new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.7 }),
    cuad: new THREE.MeshStandardMaterial({ color: 0xb07a3e, roughness: 0.7 }), maestra: new THREE.MeshStandardMaterial({ color: 0xd08b2d, roughness: 0.6 }),
    var: new THREE.MeshStandardMaterial({ color: 0x8f5f30, roughness: 0.7, side: THREE.DoubleSide }), bao: new THREE.MeshStandardMaterial({ color: 0xcfa56a, roughness: 0.7 }),
    palm: new THREE.MeshStandardMaterial({ color: 0x7d6a45, roughness: 0.7 }), tranc: new THREE.MeshStandardMaterial({ color: 0x5a3f22, roughness: 0.7 }),
    mamp: new THREE.MeshStandardMaterial({ color: 0xe0cfa8, roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.88 }),
    plan: new THREE.MeshStandardMaterial({ color: 0xbca679, roughness: 0.85, side: THREE.DoubleSide }),
    sent: new THREE.MeshStandardMaterial({ color: 0x3b7ea8, roughness: 0.1, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
  };
  const oz = H.oz, P = (x, y, z) => V(x, y, z + oz);
  const add = (obj, k, ex) => { tag(m, k, obj); m.struct.add(obj); m.parts.push({ obj, ex, base: obj.position.clone() }); return obj; };
  const exOf = {};
  const kp = []; for (let u = 0; u <= 1.0001; u += 0.04) { const k = H.keel(u); kp.push(P(H.X(u, k) , k + 0.05, 0)); }
  add(tube(kp, 0.07, sm.quilla), "quilla", exOf.quilla = V(0, -0.9, 0));
  const sp = []; for (let u = 0.08; u <= 0.86; u += 0.04) { const y = H.keel(u) + 0.2; sp.push(P(H.X(u, y), y, 0)); }
  add(tube(sp, 0.05, sm.sobre), "sobrequilla", exOf.sobrequilla = V(0, -0.45, 0));
  const k1 = H.keel(1), s1 = H.sheer(1), rp = []; for (let i = 0; i <= 8; i++) { const y = k1 + (s1 - k1) * i / 8; rp.push(P(H.X(1, y) - 0.04, y, 0)); }
  add(tube(rp, 0.065, sm.quilla), "roda", exOf.roda = V(0.7, 0, 0));
  const k0 = H.keel(0), cp = [P(H.xs + 0.05, k0 + 0.03, 0), P(H.xs + 0.05, k0 + (H.sheer(0) - k0) * 0.6, 0)];
  add(tube(cp, 0.065, sm.quilla, false), "codaste", exOf.codaste = V(-0.7, 0, 0));
  const frames = []; for (let u = 0.07; u <= 0.93; u += 0.065) frames.push(u);
  const um = frames.reduce((a, u) => (Math.abs(u - 0.47) < Math.abs(a - 0.47) ? u : a), frames[0]);
  exOf.cuaderna = V(); exOf.maestra = V(); exOf.varenga = V(0, -0.25, 0); exOf.bao = V(0, 0.9, 0); exOf.mamparo = V(0, 0, 0); exOf.colision = V(0.25, 0, 0);
  exOf.plan = V(0, 0.55, 0); exOf.sentina = V(0, -0.1, 0); exOf.bomba = V(0, -0.1, 0); exOf.grifo = V(0, -0.1, 0);
  for (const u of frames) {
    const p = H.sec(u).slice(0, -1), pts = [];
    for (let j = p.length - 1; j >= 1; j--) pts.push(P(H.X(u, p[j][1]), p[j][1] + 0.02, -p[j][0] * 0.95));
    pts.push(P(H.X(u, p[0][1]), p[0][1] + 0.05, 0));
    for (let j = 1; j < p.length; j++) pts.push(P(H.X(u, p[j][1]), p[j][1] + 0.02, p[j][0] * 0.95));
    const isM = u === um; add(tube(pts, 0.032, isM ? sm.maestra : sm.cuad), isM ? "maestra" : "cuaderna", V());
    // varenga
    if (H.b(u) > 0.25) {
      const k = H.keel(u), yT = k + Math.min(0.28, (H.sheer(u) - k) * 0.3), sh = new THREE.Shape(), zT = H.zAt(u, yT) * 0.95;
      sh.moveTo(-zT, yT);
      for (let j = p.length - 1; j >= 0; j--) if (p[j][1] < yT) sh.lineTo(-p[j][0] * 0.95, p[j][1] + 0.03);
      for (let j = 1; j < p.length; j++) if (p[j][1] < yT) sh.lineTo(p[j][0] * 0.95, p[j][1] + 0.03);
      sh.lineTo(zT, yT); sh.lineTo(-zT, yT);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }); g.rotateY(Math.PI / 2);
      const vm = new THREE.Mesh(g, sm.var); vm.position.set(H.X(u, k) - 0.02, 0, oz); add(vm, "varenga", exOf.varenga);
      // bao
      const y = H.sheer(u) - 0.05, zb = H.zAt(u, y) * 0.95;
      add(tube([P(H.X(u, y), y, -zb), P(H.X(u, y), y + H.camber * H.b(u), 0), P(H.X(u, y), y, zb)], 0.035, sm.bao), "bao", exOf.bao);
    }
  }
  for (const s of [-1, 1]) {
    const tp = [], pp = [];
    for (let u = 0; u <= 1.0001; u += 0.04) {
      const y = H.sheer(u) - 0.03; tp.push(P(H.X(u, y), y, s * H.zAt(u, y) * 0.96));
      if (u > 0.04 && u < 0.92) { const k = H.keel(u), yp = k + (H.sheer(u) - k) * 0.55; pp.push(P(H.X(u, yp), yp, s * H.zAt(u, yp) * 0.95)); }
    }
    add(tube(tp, 0.045, sm.tranc), "trancanil", V(0, 0.45, s * 0.55));
    add(tube(pp, 0.035, sm.palm), "palmejar", V(0, 0, s * 0.85));
  }
  exOf.trancanil = V(0, 0.45, 0.55); exOf.palmejar = V(0, 0, 0.85);
  const bulk = (u, k) => {
    const p = H.sec(u).slice(0, -1), sh = new THREE.Shape();
    sh.moveTo(-p[p.length - 1][0] * 0.95, p[p.length - 1][1]);
    for (let j = p.length - 1; j >= 0; j--) sh.lineTo(-p[j][0] * 0.95, p[j][1] + 0.03);
    for (let j = 1; j < p.length; j++) sh.lineTo(p[j][0] * 0.95, p[j][1] + 0.03);
    const g = new THREE.ShapeGeometry(sh, 4); g.rotateY(Math.PI / 2);
    const mm = new THREE.Mesh(g, sm.mamp); mm.position.set(H.X(u, H.keel(u)), 0, oz); add(mm, k, exOf[k]);
  };
  bulk(0.31, "mamparo"); bulk(0.86, "colision");
  const yp = H.keel(0.45) + 0.24, ppts = [];
  const pu = []; for (let u = 0.14; u <= 0.72; u += 0.04) if (yp > H.keel(u) + 0.04) pu.push(u);
  for (const u of pu) ppts.push([H.X(u, yp), -H.zAt(u, yp) * 0.94]);
  for (let i = pu.length - 1; i >= 0; i--) ppts.push([H.X(pu[i], yp), H.zAt(pu[i], yp) * 0.94]);
  if (ppts.length > 3) {
    const sh = new THREE.Shape(); sh.moveTo(ppts[0][0], -ppts[0][1]); ppts.slice(1).forEach(q => sh.lineTo(q[0], -q[1]));
    const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); const pl = new THREE.Mesh(g, sm.plan); pl.position.set(0, yp, oz); add(pl, "plan", exOf.plan);
  }
  const ys = H.keel(0.42) + 0.11, sp2 = [];
  const su = []; for (let u = 0.2; u <= 0.62; u += 0.04) if (ys > H.keel(u) + 0.02) su.push(u);
  for (const u of su) sp2.push([H.X(u, ys), H.zAt(u, ys) * 0.9]);
  if (sp2.length > 2) {
    const sh = new THREE.Shape(); sh.moveTo(sp2[0][0], sp2[0][1]); sp2.forEach(q => sh.lineTo(q[0], q[1])); for (let i = sp2.length - 1; i >= 0; i--) sh.lineTo(sp2[i][0], -sp2[i][1]);
    const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); const se = new THREE.Mesh(g, sm.sent); se.position.set(0, ys, oz); add(se, "sentina", exOf.sentina);
  }
  const bm = new THREE.Group(); const bx = H.u2x(0.36), by = H.keel(0.36) + 0.12;
  bm.add(rod(V(bx, by, oz + 0.12), V(bx, by + 0.14, oz + 0.12), 0.045, m.M.black, 12)); bm.add(rod(V(bx, by + 0.14, oz + 0.12), V(bx, H.sheer(0.36) - 0.2, oz + 0.3), 0.015, m.M.rope));
  add(bm, "bomba", exOf.bomba);
  const gu = 0.5, gy = H.keel(gu) + 0.1, gz = H.zAt(gu, gy) * 0.9, gr = new THREE.Group();
  gr.add(rod(V(H.u2x(gu), gy - 0.05, oz - gz), V(H.u2x(gu), gy + 0.12, oz - gz), 0.04, m.M.bronze, 12));
  gr.add(rod(V(H.u2x(gu) - 0.12, gy + 0.08, oz - gz), V(H.u2x(gu) + 0.12, gy + 0.08, oz - gz), 0.015, sm.maestra));
  add(gr, "grifo", exOf.grifo);
  Object.values(sm).forEach(x => m.structMats = (m.structMats || []).concat(x));
  if (!withHs) return;
  const S = (k, p) => m.shs.push({ k, p, ex: exOf[k] || V() });
  const mu = H.uOf(H.u2x(0.5));
  S("quilla", H.keelPt(0.55, 0.05)); S("sobrequilla", P(H.u2x(0.68), H.keel(0.68) + 0.22, 0));
  S("roda", P(H.X(1, (k1 + s1) / 2) - 0.04, (k1 + s1) / 2, 0)); S("codaste", P(H.xs + 0.05, k0 + (H.sheer(0) - k0) * 0.35, 0));
  const cu = frames[2], cp2 = H.sec(cu); const cpt = cp2[Math.floor(cp2.length * 0.6)];
  S("cuaderna", P(H.X(cu, cpt[1]), cpt[1], cpt[0] * 0.95));
  const mp = H.sec(um)[Math.floor(cp2.length * 0.7)]; S("maestra", P(H.X(um, mp[1]), mp[1], mp[0] * 0.95));
  const vu = frames[8] || frames[frames.length - 3]; S("varenga", P(H.X(vu, H.keel(vu)), H.keel(vu) + 0.18, 0.15));
  const bu = frames[3]; S("bao", P(H.X(bu, H.sheer(bu)), H.sheer(bu) + H.camber * H.b(bu) - 0.02, -0.25));
  const pu2 = 0.72, py2 = H.keel(pu2) + (H.sheer(pu2) - H.keel(pu2)) * 0.55; S("palmejar", P(H.X(pu2, py2), py2, H.zAt(pu2, py2) * 0.95));
  const tu = 0.55, ty = H.sheer(tu) - 0.03; S("trancanil", P(H.X(tu, ty), ty, H.zAt(tu, ty) * 0.96));
  S("mamparo", P(H.X(0.31, 0), (H.keel(0.31) + H.sheer(0.31)) * 0.5 + 0.1, -H.b(0.31) * 0.45));
  S("colision", P(H.X(0.86, 0), (H.keel(0.86) + H.sheer(0.86)) * 0.5, 0));
  S("plan", P(H.u2x(0.6), yp + 0.01, -0.2)); S("sentina", P(H.u2x(0.44), ys + 0.01, 0.12));
  S("bomba", V(bx, by + 0.16, oz + 0.12)); S("grifo", V(H.u2x(gu), gy + 0.12, oz - gz));
  S("forro", H.surf(0.62, -1, (H.keel(0.62) + H.sheer(0.62)) * 0.4, 0.02)); void mu;
}

/* Cotas y ayudas visuales */
function addCota(m, pa, pb, A, B, key, label, value) {
  const g = new THREE.Group(), mat = m.cotaMat, mat2 = m.cotaMat2;
  const main = rod(A, B, 0.02, mat, 6); g.add(main);
  const cones = [];
  for (const [P, Q] of [[A, B], [B, A]]) {
    const d = new THREE.Vector3().subVectors(P, Q).normalize(); const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 10), mat);
    c.quaternion.setFromUnitVectors(UP, d); c.position.copy(P).addScaledVector(d, -0.1); g.add(c); cones.push(c);
  }
  if (pa && pa.distanceTo(A) > 0.05) g.add(rod(pa, A, 0.007, mat2, 4));
  if (pb && pb.distanceTo(B) > 0.05) g.add(rod(pb, B, 0.007, mat2, 4));
  g.traverse(o => { if (o.isMesh) o.renderOrder = 20; });
  m.cotas.add(g); m.cotaList.push({ g, main, cones, mid: A.clone().lerp(B, 0.5), key, label, value });
}
function addDims(m) {
  const Hs = m.hulls, H = Hs[Hs.length - 1];
  const bowX = H.X(1, H.sheer(1) + H.hb), sternX = H.xs;
  let wMin = 1e9, wMax = -1e9; for (const p of m.wl) { wMin = Math.min(wMin, p.x); wMax = Math.max(wMax, p.x); }
  let Bh = 0, uB = 0.5; for (const h of Hs) for (const u of h.us) { const z = Math.abs(h.oz) + h.b(u); if (z > Bh) { Bh = z; uB = u; } }
  const zL = Bh + 0.7, yL = (m.cabinTop || H.sheer(1) + 0.4) + 0.7;
  const mid = 0.5, xm = H.u2x(mid), shm = H.sheer(mid), km = H.keel(mid);
  const d = m.dims = { loa: bowX - sternX, lwl: wMax - wMin, manga: 2 * Bh, puntal: shm - km - 0.05, calado: -m.minY, franco: shm, wMin, wMax };
  addCota(m, V(sternX, H.sheer(0) + H.hb, H.oz + H.b(0)), V(bowX, H.sheer(1) + H.hb, H.oz), V(sternX, yL, zL), V(bowX, yL, zL), "loa", "Eslora total", d.loa);
  addCota(m, V(wMin, 0, H.oz), V(wMax, 0, H.oz), V(wMin, 0.02, zL), V(wMax, 0.02, zL), "lwl", "Eslora de flotación", d.lwl);
  const xb = Hs[0].u2x(uB), yb = Hs[0].sheer(uB) + 0.05, yM = Math.max(yb + 0.4, m.cabinTop ? m.cabinTop + 0.3 : 0);
  addCota(m, V(xb, yb, -Bh), V(xb, yb, Bh), V(xb, yM, -Bh), V(xb, yM, Bh), "manga", "Manga", d.manga);
  addCota(m, null, null, V(xm, shm, H.oz), V(xm, km + 0.05, H.oz), "puntal", "Puntal", d.puntal);
  const zf = H.oz + H.b(mid) + 0.45;
  addCota(m, V(xm + 0.6, 0, H.oz + H.zAt(mid, 0)), V(xm + 0.6, shm, H.oz + H.b(mid)), V(xm + 0.6, 0, zf), V(xm + 0.6, shm, zf), "franco", "Francobordo", d.franco);
  const zc = H.oz + H.b(H.uOf(m.minX)) + 0.45;
  addCota(m, V(m.minX, m.minY, m.minZ ?? H.oz), null, V(m.minX, 0, zc), V(m.minX, m.minY, zc), "calado", "Calado (máximo)", d.calado);
}
function addHelpers(m, accMat) {
  const H = m.hulls[m.hulls.length - 1], L = H.L, top = m.topY;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.12, top - m.minY + 0.8), accMat); pl.position.set(H.xs + L / 2, (top + m.minY) / 2, 0); pl.name = "crujia";
  const ln = rod(V(H.xs - 0.4, top * 0.5 + 0.2, 0), V(H.xs + L + 0.6, top * 0.5 + 0.2, 0), 0.02, m.cotaMat); const cg = new THREE.Group(); cg.add(pl, ln); cg.name = "crujia";
  let Bh = 0; for (const h of m.hulls) Bh = Math.max(Bh, Math.abs(h.oz) + h.b(0.5));
  const tg = new THREE.Group(); tg.name = "traves"; const xm = H.u2x(0.5), y = H.sheer(0.5) + 0.1;
  for (const s of [-1, 1]) { tg.add(rod(V(xm, y, 0), V(xm, y, s * (Bh + 1.3)), 0.025, m.cotaMat)); const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 12), m.cotaMat); c.rotation.x = s * Math.PI / 2; c.position.set(xm, y, s * (Bh + 1.4)); tg.add(c); }
  tg.add(rod(V(xm - 1.2, y, 0), V(xm + 1.2, y, 0), 0.02, m.cotaMat));
  const fg = new THREE.Group(); fg.name = "franco"; const zf = H.oz + H.b(0.62) + 0.25, xf = H.u2x(0.62), sh = H.sheer(0.62);
  fg.add(rod(V(xf, 0, zf), V(xf, sh, zf), 0.025, m.cotaMat), rod(V(xf - 0.25, 0, zf), V(xf + 0.25, 0, zf), 0.015, m.cotaMat), rod(V(xf - 0.25, sh, zf), V(xf + 0.25, sh, zf), 0.015, m.cotaMat));
  for (const g of [cg, tg, fg]) { g.visible = false; g.traverse(o => { if (o.isMesh) o.renderOrder = 15; }); m.help.add(g); }
}

/* ── Lancha a motor (cabinada, intraborda con eje) ── */
function buildLancha(m) {
  const M = m.M; M.bottom = new THREE.MeshStandardMaterial({ color: 0x8e2c2c, roughness: 0.6 });
  const H = makeHull({ type: "v", L: 8.2, xs: -4.1, hb: 0.1, camber: 0.04, stemRake: 0.95,
    beam: u => 1.32 * (u < 0.4 ? 0.9 + 0.1 * Math.sin(Math.PI / 2 * u / 0.4) : Math.pow(Math.max(0, 1 - Math.pow((u - 0.4) / 0.6, 1.8)), 0.62)),
    sheer: u => 0.86 + 0.36 * u * u, keel: u => -0.42 + 0.64 * Math.pow(Math.max(0, (u - 0.5) / 0.5), 2), dead: u => (16 + 30 * u * u) * Math.PI / 180 });
  const ck = { u0: 0, u1: 0.42, vc: 0.8, fl: 0.36 };
  addHull(m, H, { colors: { top: 0xf4f5f2, bottom: 0x8e2c2c, stripe: 0x1d3557 }, cockpit: ck, railMat: M.inox });
  const b = H.b, sh = H.sheer, xs = H.xs;
  // Cabina
  const x0 = H.u2x(0.42), x1 = H.u2x(0.8), w0 = b(0.42) * 0.72, w1 = b(0.7) * 0.7, yb = sh(0.42) - 0.05, ch = 0.5, roof = yb + ch + 0.04;
  const cab = trunk(x0, x1, w0, w1, 0.9, yb, ch, M.gel); m.ext.add(tag(m, "cabina", cab)); m.occ.push(cab); m.cabinTop = roof;
  // parabrisas
  const ws = new THREE.Group(), wy = roof + 0.2, wx = x0 + 0.35;
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.44, 1.1), M.glass); c1.position.set(wx, wy, 0); c1.rotation.z = 0.45; ws.add(c1);
  for (const s of [-1, 1]) { const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.44, 0.45), M.glass); c2.position.set(wx - 0.22, wy, s * 0.72); c2.rotation.set(0, s * 0.75, 0.4); ws.add(c2); }
  ws.add(tube([V(wx - 0.4, wy + 0.2, -0.9), V(wx - 0.08, wy + 0.2, -0.55), V(wx - 0.08, wy + 0.2, 0.55), V(wx - 0.4, wy + 0.2, 0.9)], 0.018, M.inox));
  m.ext.add(tag(m, "parabrisas", ws));
  // portillos de cabina (alargados) y de casco
  for (const s of [-1, 1]) {
    for (const t of [0.3, 0.62]) { const px = x0 + (x1 - 0.9 - x0) * t, pz = s * (w0 + (w1 - w0) * t + 0.045); porthole(m, V(px, yb + 0.33, pz), V(0, 0, s), 0.065, 2.6); }
    porthole(m, H.surf(0.7, s, 0.66, 0.012), V(0, 0, s), 0.06);
  }
  const lumP = hatch(m, V(H.u2x(0.6), roof, 0), 0.42, 0.46, 0, "lumbrera", true);
  const escP = hatch(m, H.deckPt(0.865, 0, -0.01), 0.5, 0.5, 0.28, "escotilla");
  const mgP = dorade(m, V(H.u2x(0.73), roof - 0.06, 0.32), Math.PI);
  // Consola, rueda, asientos
  const fl = ck.fl, cx = x0 - 0.33;
  const con = rbox(0.6, 1.0, 0.62, M.gel, 0.07); con.position.set(cx, fl + 0.5, 0.5); m.ext.add(tag(m, "consola", con)); m.occ.push(con);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.5), M.dark); panel.position.set(cx - 0.31, fl + 0.82, 0.5); panel.rotation.z = -0.35; m.ext.add(tag(m, "consola", panel));
  const wh = new THREE.Group(); const tor = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.017, 8, 30), M.inox); wh.add(tor);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; wh.add(rod(V(), V(Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0), 0.01, M.inox)); }
  wh.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 12).rotateX(Math.PI / 2), M.black));
  wh.position.set(cx - 0.38, fl + 0.8, 0.5); wh.rotation.set(0, Math.PI / 2, 0.0); wh.rotateX(-0.35); m.ext.add(tag(m, "rueda", wh));
  const seat = rbox(0.5, 0.45, 0.55, M.cushion, 0.08); seat.position.set(cx - 1.0, fl + 0.23, 0.5); m.ext.add(seat);
  const bench = rbox(0.5, 0.42, 2 * ck.vc * b(0.02) * 0.94, M.cushion, 0.08); bench.position.set(xs + 0.32, fl + 0.21, 0); m.ext.add(bench);
  // Plataforma de baño + escalera
  const plat = new THREE.Group(); const pb = rbox(0.55, 0.06, 2.1, M.teak, 0.02); pb.position.set(xs - 0.3, 0.3, 0); plat.add(pb);
  for (let i = 0; i < 3; i++) plat.add(rod(V(xs - 0.5, 0.3 - i * 0.22, 0.75), V(xs - 0.5, 0.3 - i * 0.22, 0.4), 0.014, M.inox));
  plat.add(rod(V(xs - 0.5, 0.3, 0.75), V(xs - 0.5, -0.25, 0.75), 0.015, M.inox), rod(V(xs - 0.5, 0.3, 0.4), V(xs - 0.5, -0.25, 0.4), 0.015, M.inox));
  m.ext.add(tag(m, "plataforma", plat));
  // Imbornales en el espejo
  for (const s of [-1, 1]) porthole(m, V(xs - 0.012, fl + 0.04, s * 0.62), V(-1, 0, 0), 0.035, 1.8, "imbornal");
  // Fondeo
  const molP = molinete(m, H.deckPt(0.935, 0, -0.01));
  const bit = new THREE.Group(); const bp = H.deckPt(0.975, 0, -0.01);
  bit.add(rod(bp, bp.clone().add(V(0, 0.14, 0)), 0.035, M.inox, 12)); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), M.inox); cap.position.copy(bp).add(V(0, 0.15, 0)); bit.add(cap);
  bit.add(rod(bp.clone().add(V(0, 0.1, -0.08)), bp.clone().add(V(0, 0.1, 0.08)), 0.012, M.inox));
  m.ext.add(tag(m, "bita", bit));
  const ey = sh(1) - 0.3, ex = H.X(1, ey);
  const esc = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 18), M.inox); esc.scale.y = 1.4; esc.position.set(ex + 0.01, ey, 0); esc.rotation.y = Math.PI / 2; m.ext.add(tag(m, "escoben", esc));
  const an = anchorMesh(0.75, M.inox); an.position.set(ex + 0.07, ey - 0.03, 0); an.rotation.z = Math.PI + 0.9; m.ext.add(tag(m, "ancla", an));
  // Cornamusas
  const cnP = cornamusa(m, H.deckPt(0.9, 0.62), 0.2); cornamusa(m, H.deckPt(0.9, -0.62), -0.2);
  cornamusa(m, H.deckPt(0.05, 0.9), 0); cornamusa(m, H.deckPt(0.05, -0.9), 0);
  // Barandillas
  const pu = pulpit(m, H, 0.8, 0.55);
  const rl = rails(m, H, { u0: 0.18, u1: 0.72, n: 5, v: 0.93, h: 0.55, pulpit: true, pulpitTop: pu.top });
  // Propulsión y timón
  const sl = shaftLine(m, H, H.u2x(0.1), -0.7, 0.17, 0.22);
  const rd = rudder(m, H, H.u2x(0.045), 0.34, 0.28, 0.5, { gap: 0.1 });
  const gk = 0.33, gz = 0.25, gy = H.keel(gk) + Math.tan(H.dead(gk)) * gz;
  const gf = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 14), M.bronze); gf.position.set(H.u2x(gk), gy - 0.01, gz); gf.rotation.x = -H.dead(gk); m.ext.add(tag(m, "grifo", gf));
  m.topY = roof + 0.7;
  // Hotspots
  const ch2 = H.chine(0.25);
  addHs(m, "proa", V(H.X(1, sh(1) + 0.1) + 0.08, sh(1) + 0.2, 0), { hl: { u: [0.86, 1.3] }, far: 1 });
  addHs(m, "popa", V(xs - 0.05, sh(0) + 0.45, 0), { hl: { u: [-0.3, 0.1] }, far: 1 });
  addHs(m, "estribor", H.surf(0.5, 1, 0.66), { hl: { u: [-1, 2], side: 1, y: [0, 9] }, far: 1 });
  addHs(m, "babor", H.surf(0.5, -1, 0.66), { hl: { u: [-1, 2], side: -1, y: [0, 9] }, far: 1 });
  addHs(m, "amura_er", H.surf(0.84, 1, 0.82), { hl: { u: [0.72, 1.3], side: 1 } });
  addHs(m, "amura_br", H.surf(0.84, -1, 0.82), { hl: { u: [0.72, 1.3], side: -1 } });
  addHs(m, "aleta_er", H.surf(0.09, 1, 0.62), { hl: { u: [-0.3, 0.2], side: 1 } });
  addHs(m, "aleta_br", H.surf(0.09, -1, 0.62), { hl: { u: [-0.3, 0.2], side: -1 } });
  addHs(m, "traves_er", V(H.u2x(0.5), 0.9, b(0.5) + 1.3), { help: "traves", far: 1 });
  addHs(m, "traves_br", V(H.u2x(0.5), 0.9, -(b(0.5) + 1.3)), { help: "traves", far: 1 });
  addHs(m, "crujia", V(H.u2x(0.16), fl + 0.03, 0), { help: "crujia", far: 1 });
  addHs(m, "obramuerta", H.surf(0.3, 1, 0.48), { hl: { u: [-1, 2], y: [0, 9] }, far: 1 });
  addHs(m, "flotacion", H.surf(0.42, 1, 0.0, 0.05), { far: 1 });
  addHs(m, "obraviva", H.surf(0.6, 1, -0.25), { hl: { u: [-1, 2], y: [-9, 0] }, far: 1 });
  addHs(m, "francobordo", H.surf(0.62, 1, 0.3), { help: "franco" });
  addHs(m, "pantoque", V(H.X(0.25, ch2[1]), ch2[1], ch2[0] + 0.03), { hl: { u: [0, 0.7], side: 1, y: [ch2[1] - 0.15, ch2[1] + 0.12] } });
  addHs(m, "quilla", H.keelPt(0.42, -0.03));
  addHs(m, "roda", V(H.X(1, 0.55) + 0.04, 0.55, 0));
  addHs(m, "codaste", V(xs - 0.03, H.keel(0) + 0.1, 0));
  addHs(m, "espejo", V(xs - 0.03, 0.62, -0.55), { far: 1 });
  addHs(m, "regala", V(H.X(0.4, sh(0.4) + 0.1), sh(0.4) + H.hb + 0.05, b(0.4) + 0.02));
  addHs(m, "borda", V(H.X(0.27, sh(0.27)), sh(0.27) + 0.04, b(0.27) + 0.025));
  addHs(m, "cubierta", H.deckPt(0.8, -0.82, 0.02));
  addHs(m, "banera", V(H.u2x(0.28), fl + 0.03, -0.55));
  addHs(m, "imbornal", V(xs - 0.03, fl + 0.04, 0.62));
  addHs(m, "escotilla", escP); addHs(m, "lumbrera", lumP); addHs(m, "manguerote", mgP);
  addHs(m, "portillo", H.surf(0.7, 1, 0.66, 0.02));
  addHs(m, "cabina", V(x0 + 0.9, roof - 0.15, w0 + 0.06));
  addHs(m, "candelero", rl.posts[1][2].clone().add(V(0, -0.28, 0)));
  addHs(m, "guardamancebo", rl.posts[1][0].clone().lerp(rl.posts[1][1], 0.5));
  addHs(m, "pulpito", pu.front.clone().add(V(0, 0.02, 0)));
  addHs(m, "cornamusa", cnP); addHs(m, "bita", bp.clone().add(V(0, 0.18, 0)));
  addHs(m, "molinete", molP.top); addHs(m, "barboten", molP.gyp);
  addHs(m, "escoben", V(ex + 0.04, ey + 0.08, 0)); addHs(m, "ancla", V(ex + 0.12, ey - 0.3, 0));
  addHs(m, "rueda", V(cx - 0.42, fl + 0.82, 0.5)); addHs(m, "consola", V(cx, fl + 1.02, 0.72));
  addHs(m, "parabrisas", V(wx - 0.05, wy + 0.1, -0.3)); addHs(m, "plataforma", V(xs - 0.35, 0.34, -0.7));
  addHs(m, "pala", rd.mid); addHs(m, "mecha", V(rd.xm, rd.top + 0.05, 0)); addHs(m, "limera", V(rd.xm, rd.k + 0.02, 0));
  addHs(m, "helice", sl.P.clone().add(V(0, -0.24, 0))); addHs(m, "eje", sl.mid.clone().add(V(0.15, 0, 0)));
  addHs(m, "bocina", sl.exit.clone().add(V(-0.08, -0.04, 0))); addHs(m, "arbotante", sl.S.clone().add(V(0, 0.03, 0.12)));
  addHs(m, "grifo", V(H.u2x(gk), gy - 0.03, gz + 0.02));
  buildStructure(m, H, true);
  m.cam = { target: V(0, 0.3, 0), pos: V(7.5, 4.2, 9.5) }; m.R = 11;
  m.label = "Lancha a motor";
}

/* ── Velero (crucero monocasco) ── */
function buildVelero(m) {
  const M = m.M; M.bottom = new THREE.MeshStandardMaterial({ color: 0x1f2d4a, roughness: 0.6 });
  const H = makeHull({ type: "round", n: 2.5, S: 16, L: 10.4, xs: -5.2, hb: 0.05, camber: 0.05, stemRake: 0.75,
    beam: u => 1.7 * (u < 0.45 ? 0.84 + 0.16 * Math.sin(Math.PI / 2 * u / 0.45) : Math.pow(Math.max(0, 1 - Math.pow((u - 0.45) / 0.55, 1.9)), 0.6)),
    sheer: u => 0.74 + 0.42 * Math.pow(u, 2.2),
    keel: u => (u < 0.45 ? -0.46 + 0.4 * Math.pow((0.45 - u) / 0.45, 2) : -0.46 + 0.74 * Math.pow((u - 0.45) / 0.55, 2.1)) });
  const ck = { u0: 0, u1: 0.3, vc: 0.6, fl: 0.32 };
  addHull(m, H, { colors: { top: 0xf3f4f0, bottom: 0x1f2d4a, stripe: 0x9c2f2f }, cockpit: ck, deckMat: M.deck, railMat: M.teak });
  const b = H.b, sh = H.sheer, xs = H.xs, fl = ck.fl;
  // Cabina (tambucho a popa)
  const x0 = H.u2x(0.3), x1 = H.u2x(0.66), w0 = b(0.3) * 0.6, w1 = b(0.6) * 0.56, yb = sh(0.3) - 0.04, chh = 0.46, roof = yb + chh + 0.04;
  const cab = trunk(x0, x1, w0, w1, 0.8, yb, chh, M.gel); m.ext.add(tag(m, "cabina", cab)); m.occ.push(cab); m.cabinTop = roof;
  for (const s of [-1, 1]) { for (const t of [0.22, 0.55]) { const px = x0 + (x1 - 0.8 - x0) * t, pz = s * (w0 + (w1 - w0) * t + 0.045); porthole(m, V(px, yb + 0.3, pz), V(0, 0, s), 0.06, 3.2); } }
  const tb = new THREE.Group(); const tbl = rbox(0.75, 0.07, 0.7, M.dark, 0.02); tbl.position.set(x0 + 0.4, roof + 0.02, 0); tb.add(tbl);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), M.dark); door.position.set(x0 - 0.045, yb + 0.25, 0); door.rotation.y = -Math.PI / 2; tb.add(door);
  m.ext.add(tag(m, "tambucho", tb));
  const lumP = hatch(m, V(H.u2x(0.5), roof, 0), 0.45, 0.45, 0, "lumbrera", true);
  const escP = hatch(m, H.deckPt(0.79, 0, -0.01), 0.55, 0.55, 0.22, "escotilla");
  const mgP = dorade(m, V(H.u2x(0.42), roof - 0.05, 0.48), Math.PI); dorade(m, V(H.u2x(0.42), roof - 0.05, -0.48), Math.PI);
  // Bancos de bañera y winches
  for (const s of [-1, 1]) { const bn = rbox(2.0, 0.4, 0.42, M.teak, 0.05); bn.position.set(H.u2x(0.16), fl + 0.2, s * (ck.vc * b(0.16) - 0.22)); m.ext.add(bn); }
  const winP = {};
  for (const s of [-1, 1]) {
    const p = H.deckPt(0.255, s * 0.78); const w = new THREE.Group(); w.add(rod(p, p.clone().add(V(0, 0.16, 0)), 0.075, M.inox, 16));
    const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 0.04, 16), M.black); tp.position.copy(p).add(V(0, 0.18, 0)); w.add(tp);
    m.ext.add(tag(m, "winche", w)); winP[s] = p.clone().add(V(0, 0.2, 0));
  }
  // Timón de caña
  const rd = rudder(m, H, H.u2x(0.07), 0.55, 0.38, 1.25, { gap: 0.08, t: 0.07, sweep: 0.08, mechaTop: fl + 0.25 });
  const tl = rod(V(rd.xm, fl + 0.24, 0), V(rd.xm + 1.25, fl + 0.48, 0), 0.03, M.teak); m.ext.add(tag(m, "cana", tl));
  // Quilla de lastre + bulbo
  const kx = H.u2x(0.47), kk = H.keel(0.47);
  const fin = foil(1.3, 0.78, 1.35, 0.35, 0.14, M.bottom); fin.position.set(kx, kk + 0.02, 0); m.ext.add(tag(m, "orza", fin));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), M.bottom); bulb.scale.set(0.85, 0.17, 0.2); bulb.position.set(kx - 0.4, kk - 1.38, 0); m.ext.add(tag(m, "bulbo", bulb));
  deepen(m, kk - 1.55, kx - 0.4);
  // Hélice abatible
  const sl = shaftLine(m, H, H.u2x(0.23), -0.6, 0.16, 0.19, { blades: 2, folding: true, key: "helice_ab" });
  // Grifo de fondo
  const gu = 0.62, gy = H.keel(gu) + 0.08, gz = H.zAt(gu, gy);
  const gf = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 14), M.bronze); gf.position.set(H.u2x(gu), gy, gz); gf.rotation.x = Math.PI / 2 - 0.5; m.ext.add(tag(m, "grifo", gf));
  // Fondeo
  const molP = molinete(m, H.deckPt(0.905, 0, -0.01));
  const ehole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14), M.inox); ehole.position.copy(H.deckPt(0.88, 0, 0)); m.ext.add(tag(m, "escoben", ehole));
  const hx = H.X(1, sh(1) + 0.1), roller = new THREE.Group();
  roller.add(rod(V(hx - 0.35, sh(1) + 0.05, 0), V(hx + 0.25, sh(1) + 0.05, 0), 0.04, M.inox));
  const rl0 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), M.black); rl0.rotation.x = Math.PI / 2; rl0.position.set(hx + 0.25, sh(1) + 0.08, 0); roller.add(rl0); m.ext.add(roller);
  const an = anchorMesh(0.8, M.inox); an.position.set(hx + 0.2, sh(1) - 0.05, 0); an.rotation.z = Math.PI + 1.1; m.ext.add(tag(m, "ancla", an));
  const cnP = cornamusa(m, H.deckPt(0.86, 0.55), 0.3); cornamusa(m, H.deckPt(0.86, -0.55), -0.3);
  cornamusa(m, H.deckPt(0.04, 0.8), 0); cornamusa(m, H.deckPt(0.04, -0.8), 0);
  // Barandillas
  const pu = pulpit(m, H, 0.86, 0.62); const bc = balcon(m, H, 0.1, 0.62);
  const rl = rails(m, H, { u0: 0.16, u1: 0.8, n: 6, v: 0.94, h: 0.62, levels: [1, 0.5], pulpit: true, pulpitTop: pu.top, balcon: true, balconTop: bc.top });
  // Aparejo
  const xm = H.u2x(0.6), top = 14.6, ySp = 7.9;
  m.ext.add(tag(m, "mastil", rod(V(xm, roof - 0.04, 0), V(xm, top, 0), 0.085, M.alu, 14)));
  const gx = xm - 0.09, gy2 = 2.2, Bx = H.u2x(0.1), By = 2.4, Bz = -0.55;
  m.ext.add(tag(m, "botavara", rod(V(gx, gy2, 0), V(Bx, By, Bz), 0.06, M.alu, 12)));
  const tips = { [-1]: V(xm - 0.12, ySp, -1.0), 1: V(xm - 0.12, ySp, 1.0) };
  for (const s of [-1, 1]) {
    m.ext.add(tag(m, "crucetas", rod(V(xm, ySp, 0), tips[s], 0.028, M.alu)));
    const cp = H.deckPt(0.585, s * 0.92, 0.02);
    const ob = new THREE.Group(); ob.add(rod(cp, tips[s], 0.011, M.rig), rod(tips[s], V(xm, top - 0.25, 0), 0.011, M.rig)); m.ext.add(tag(m, "obenques", ob));
    m.ext.add(tag(m, "obenquillo", rod(H.deckPt(0.6, s * 0.86, 0.02), V(xm, ySp - 0.15, s * 0.06), 0.009, M.rig)));
  }
  const S0 = V(hx - 0.05, sh(1) + 0.12, 0), Mh = V(xm + 0.05, top - 0.3, 0);
  m.ext.add(tag(m, "estay", rod(S0, Mh, 0.012, M.rig)));
  m.ext.add(tag(m, "backstay", rod(V(xm - 0.05, top - 0.08, 0), V(xs + 0.08, sh(0) + 0.08, 0), 0.01, M.rig)));
  // Velas
  const gT = S0.clone().lerp(Mh, 0.03), gH = S0.clone().lerp(Mh, 0.84), gC = V(xm - 1.5, H.deckY(0.5) + 0.6, -1.0);
  m.ext.add(tag(m, "genova", sail(gT, gH, gC, 0.09, M.sail, -1))); m.occ.push(m.ext.children[m.ext.children.length - 1]);
  const mT = V(xm - 0.12, gy2 + 0.06, 0), mH = V(xm - 0.12, top - 0.45, 0), mC = V(Bx + 0.15, By + 0.08, Bz + 0.01);
  const ms = sail(mT, mH, mC, 0.07, M.sail, -1); m.ext.add(tag(m, "mayor", ms)); m.occ.push(ms); m.sailM = ms;
  const shG = new THREE.Group(); shG.add(polyTube([gC, V(gC.x - 0.6, gC.y - 0.2, -1.15), winP[-1]], 0.012, M.rope));
  shG.add(polyTube([V(H.u2x(0.17), By - 0.03, Bz * 0.75), V(H.u2x(0.17), fl + 0.05, 0)], 0.012, M.rope)); m.ext.add(tag(m, "escota", shG));
  m.topY = top;
  // Hotspots
  const nB = V(0, 0, -1);
  addHs(m, "proa", V(hx + 0.35, sh(1) + 0.35, 0), { hl: { u: [0.86, 1.3] }, far: 1 });
  addHs(m, "popa", V(xs - 0.1, sh(0) + 0.85, 0), { hl: { u: [-0.3, 0.1] }, far: 1 });
  addHs(m, "estribor", H.surf(0.52, 1, 0.5), { hl: { u: [-1, 2], side: 1, y: [0, 9] }, far: 1 });
  addHs(m, "babor", H.surf(0.52, -1, 0.5), { hl: { u: [-1, 2], side: -1, y: [0, 9] }, far: 1 });
  addHs(m, "amura_er", H.surf(0.85, 1, 0.7), { hl: { u: [0.72, 1.3], side: 1 } });
  addHs(m, "amura_br", H.surf(0.85, -1, 0.7), { hl: { u: [0.72, 1.3], side: -1 } });
  addHs(m, "aleta_er", H.surf(0.08, 1, 0.42), { hl: { u: [-0.3, 0.2], side: 1 } });
  addHs(m, "aleta_br", H.surf(0.08, -1, 0.42), { hl: { u: [-0.3, 0.2], side: -1 } });
  addHs(m, "traves_er", V(H.u2x(0.5), 1.0, b(0.5) + 1.3), { help: "traves", far: 1 });
  addHs(m, "traves_br", V(H.u2x(0.5), 1.0, -(b(0.5) + 1.3)), { help: "traves", far: 1 });
  addHs(m, "crujia", V(H.u2x(0.06), fl + 0.03, 0), { help: "crujia", far: 1 });
  addHs(m, "obramuerta", H.surf(0.32, 1, 0.42), { hl: { u: [-1, 2], y: [0, 9] }, far: 1 });
  addHs(m, "flotacion", H.surf(0.4, 1, 0, 0.05), { far: 1 });
  addHs(m, "obraviva", H.surf(0.62, 1, -0.22), { hl: { u: [-1, 2], y: [-9, 0] }, far: 1 });
  addHs(m, "francobordo", H.surf(0.65, 1, 0.3), { help: "franco" });
  const pq = H.chine(0.3); addHs(m, "pantoque", V(H.X(0.3, pq[1]), pq[1], pq[0] + 0.03), { hl: { u: [0.05, 0.8], side: 1, y: [pq[1] - 0.18, pq[1] + 0.18] } });
  addHs(m, "roda", V(H.X(1, 0.6) + 0.04, 0.6, 0)); addHs(m, "codaste", V(xs + 0.02, H.keel(0) + 0.03, 0));
  addHs(m, "espejo", V(xs - 0.03, 0.4, -0.65), { far: 1 });
  addHs(m, "regala", V(H.X(0.45, sh(0.45)), sh(0.45) + H.hb + 0.04, b(0.45) + 0.03));
  addHs(m, "borda", V(H.X(0.36, sh(0.36)), sh(0.36) + 0.015, b(0.36) + 0.025));
  addHs(m, "cubierta", H.deckPt(0.72, -0.78, 0.02));
  addHs(m, "banera", V(H.u2x(0.2), fl + 0.03, -0.2)); addHs(m, "imbornal", porthole(m, V(xs - 0.012, fl + 0.03, 0.35), V(-1, 0, 0), 0.03, 1.6, "imbornal"));
  porthole(m, V(xs - 0.012, fl + 0.03, -0.35), V(-1, 0, 0), 0.03, 1.6, "imbornal");
  addHs(m, "tambucho", V(x0 + 0.4, roof + 0.08, 0.2)); addHs(m, "escotilla", escP); addHs(m, "lumbrera", lumP); addHs(m, "manguerote", mgP);
  addHs(m, "portillo", V(x0 + (x1 - 0.8 - x0) * 0.22, yb + 0.3, w0 + (w1 - w0) * 0.22 + 0.07)); addHs(m, "cabina", V(x0 + 1.6, roof + 0.02, -w0 * 0.6));
  addHs(m, "candelero", rl.posts[1][3].clone().add(V(0, -0.15, 0))); addHs(m, "guardamancebo", rl.posts[1][1].clone().lerp(rl.posts[1][2], 0.5));
  addHs(m, "pulpito", pu.front.clone().add(V(0, 0.03, 0))); addHs(m, "balcon", bc.mid.clone().add(V(0, 0.03, 0)));
  addHs(m, "cornamusa", cnP); addHs(m, "molinete", molP.top); addHs(m, "barboten", molP.gyp); addHs(m, "escoben", H.deckPt(0.88, 0, 0.05)); addHs(m, "ancla", V(hx + 0.25, sh(1) - 0.35, 0));
  addHs(m, "cana", V(rd.xm + 0.8, fl + 0.45, 0)); addHs(m, "mecha", V(rd.xm, rd.top + 0.04, 0)); addHs(m, "limera", V(rd.xm, rd.k, 0)); addHs(m, "pala", rd.mid);
  addHs(m, "helice_ab", sl.P.clone().add(V(0, -0.2, 0))); addHs(m, "eje", sl.mid); addHs(m, "bocina", sl.exit.clone().add(V(-0.06, -0.04, 0))); addHs(m, "arbotante", sl.S.clone().add(V(0, 0.04, 0.1)));
  addHs(m, "orza", V(kx - 0.1, kk - 0.6, 0.09)); addHs(m, "bulbo", V(kx - 0.4, kk - 1.38, 0.22)); addHs(m, "grifo", V(H.u2x(gu), gy, gz + 0.03));
  addHs(m, "mastil", V(xm, 5.0, 0.1)); addHs(m, "botavara", V(xm - 2.0, 2.33, -0.22));
  addHs(m, "obenques", tips[1].clone().lerp(V(xm, top - 0.25, 0), 0.35)); addHs(m, "obenquillo", H.deckPt(0.6, 0.86, 0.02).lerp(V(xm, ySp - 0.15, 0.06), 0.4));
  addHs(m, "crucetas", V(xm - 0.06, ySp, 0.6)); addHs(m, "estay", S0.clone().lerp(Mh, 0.93)); addHs(m, "backstay", V(xm - 0.05, top - 0.08, 0).lerp(V(xs + 0.08, sh(0) + 0.08, 0), 0.6));
  addHs(m, "genova", sailPt(gT, gH, gC, 0.3, 0.45, V(0, 0, -0.25))); addHs(m, "mayor", sailPt(mT, mH, mC, 0.25, 0.5, V(0, 0, -0.3)));
  addHs(m, "gratil", mT.clone().lerp(mH, 0.55).add(V(-0.05, 0, -0.05))); addHs(m, "baluma", mC.clone().lerp(mH, 0.4).add(V(0, 0, -0.03))); addHs(m, "pujamen", mT.clone().lerp(mC, 0.6).add(V(0, 0.08, -0.12)));
  addHs(m, "winche", winP[1]); addHs(m, "escota", V(gC.x - 0.4, gC.y - 0.1, -1.05));
  void nB;
  buildStructure(m, H, true);
  m.cam = { target: V(0, 5.6, 0), pos: V(16, 11.5, 21) }; m.R = 19;
  m.label = "Velero";
}

/* ── Catamarán de crucero ── */
function netTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  g.clearRect(0, 0, 128, 128); g.strokeStyle = "rgba(40,48,56,1)"; g.lineWidth = 3;
  for (let i = 0; i <= 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildCat(m) {
  const M = m.M; M.bottom = new THREE.MeshStandardMaterial({ color: 0x2d3944, roughness: 0.6 });
  const base = { type: "round", n: 2.1, S: 14, L: 11.6, xs: -5.8, hb: 0.04, camber: 0.03, stemRake: 0.25,
    beam: u => 0.72 * (u < 0.5 ? 0.82 + 0.18 * Math.sin(Math.PI / 2 * u / 0.5) : Math.pow(Math.max(0, 1 - Math.pow((u - 0.5) / 0.5, 2)), 0.55)),
    sheer: u => 1.0 + 0.22 * u * u,
    keel: u => (u < 0.5 ? -0.5 + 0.32 * Math.pow((0.5 - u) / 0.5, 2) : -0.5 + 0.62 * Math.pow((u - 0.5) / 0.5, 2.2)) };
  const HP = makeHull({ ...base, oz: -2.55 }), HS = makeHull({ ...base, oz: 2.55 });
  for (const H of [HP, HS]) addHull(m, H, { colors: { top: 0xf2f3f0, bottom: 0x2d3944, stripe: 0x2a6f97 }, railMat: M.inox });
  const H = HS, xs = H.xs, u2x = H.u2x;
  // Puente, bañera, salón
  const bx0 = u2x(0.1), bx1 = u2x(0.62);
  const br = rbox(bx1 - bx0, 0.42, 3.95, M.gel, 0.08); br.position.set((bx0 + bx1) / 2, 0.86, 0); m.ext.add(tag(m, "puente", br)); m.occ.push(br);
  const ckf = new THREE.Mesh(new THREE.BoxGeometry(u2x(0.33) - bx0 - 0.05, 0.02, 3.7), M.teak); ckf.position.set((bx0 + u2x(0.33)) / 2, 1.08, 0); m.ext.add(tag(m, "banera", ckf));
  const sb = rbox(0.45, 0.42, 3.2, M.cushion, 0.06); sb.position.set(bx0 + 0.35, 1.29, 0); m.ext.add(tag(m, "banera", sb));
  const sx0 = u2x(0.33), sx1 = u2x(0.62);
  const sal = rbox(sx1 - sx0, 1.3, 4.6, M.gel, 0.12); sal.position.set((sx0 + sx1) / 2, 1.72, 0); m.ext.add(tag(m, "cabina", sal)); m.occ.push(sal); m.cabinTop = 2.37;
  const winS = new THREE.Group();
  for (const s of [-1, 1]) { const w = rbox(sx1 - sx0 - 0.6, 0.38, 0.02, M.dark, 0.01); w.position.set((sx0 + sx1) / 2, 1.95, s * 2.31); winS.add(w); }
  const wf = rbox(0.02, 0.4, 3.6, M.dark, 0.01); wf.position.set(sx1 + 0.005, 1.95, 0); winS.add(wf);
  const wa = rbox(0.02, 0.9, 1.6, M.glass, 0.01); wa.position.set(sx0 - 0.005, 1.65, -0.6); winS.add(wa); m.ext.add(tag(m, "cabina", winS));
  const lumP = hatch(m, V((sx0 + sx1) / 2, 2.37, 0.6), 0.5, 0.5, 0, "lumbrera", true);
  // Trampolín y viga
  const tx0 = u2x(0.62), tx1 = u2x(0.88), nt = netTexture(); nt.repeat.set((tx1 - tx0) / 0.35, 3.7 / 0.35);
  const netM = new THREE.MeshStandardMaterial({ map: nt, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.9 });
  const tramp = new THREE.Mesh(new THREE.PlaneGeometry(tx1 - tx0, 3.7), netM); tramp.rotation.x = -Math.PI / 2; tramp.position.set((tx0 + tx1) / 2, 1.07, 0); m.ext.add(tag(m, "trampolin", tramp));
  const beamY = 1.12; m.ext.add(tag(m, "viga", rod(V(tx1, beamY, -2.55), V(tx1, beamY, 2.55), 0.085, M.alu, 14)));
  // Barandillas, púlpitos, cornamusas, escotillas, portillos
  let rlS = null, puS = null;
  for (const Hh of [HP, HS]) {
    const s = Math.sign(Hh.oz), pu = pulpit(m, Hh, 0.84, 0.6);
    const rl = rails(m, Hh, { u0: 0.12, u1: 0.74, n: 6, v: 0.9, h: 0.6, sides: [s], pulpit: true, pulpitTop: pu.top });
    if (s > 0) { rlS = rl; puS = pu; }
    hatch(m, Hh.deckPt(0.76, 0, -0.01), 0.42, 0.42, 0.2, "escotilla");
    cornamusa(m, Hh.deckPt(0.93, 0), Math.PI / 2); cornamusa(m, Hh.deckPt(0.05, s * 0.6), 0);
    for (const u of [0.42, 0.56, 0.7]) porthole(m, Hh.surf(u, s, 0.72, 0.012), V(0, 0, s), 0.06, 3);
  }
  // Molinete + ancla en la viga
  const molP = molinete(m, V(tx1 - 0.25, 1.08, 0));
  const an = anchorMesh(0.9, M.inox); an.position.set(tx1 + 0.15, 0.85, 0); an.rotation.z = Math.PI + 1.25; m.ext.add(tag(m, "ancla", an));
  m.ext.add(rod(V(tx1 - 0.15, 1.15, 0), V(tx1 + 0.15, 0.95, 0), 0.015, M.black));
  // Apéndices
  const rds = {}, sls = {}, qs = {};
  for (const Hh of [HP, HS]) {
    const s = Math.sign(Hh.oz);
    rds[s] = rudder(m, Hh, u2x(0.05), 0.42, 0.32, 0.72, { gap: 0.08 });
    const qx0 = u2x(0.3), qx1 = u2x(0.64), qk = Hh.keel(0.47);
    const q = foil(qx1 - qx0, (qx1 - qx0) * 0.6, 0.55, 0.3, 0.12, M.bottom); q.position.set((qx0 + qx1) / 2, qk + 0.03, Hh.oz); m.ext.add(tag(m, "quillote", q));
    deepen(m, qk - 0.52, (qx0 + qx1) / 2 - 0.3); qs[s] = V((qx0 + qx1) / 2 - 0.2, qk - 0.3, Hh.oz + 0.08);
    sls[s] = shaftLine(m, Hh, u2x(0.19), -0.75, 0.14, 0.2, { key: s > 0 ? "helice" : "gemelas", mirror: s < 0 });
  }
  m.minZ = 2.55;
  // Rueda en el mamparo de popa del salón (estribor)
  const wh = new THREE.Group(); wh.add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 8, 30), M.inox));
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; wh.add(rod(V(), V(Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0), 0.012, M.inox)); }
  wh.position.set(sx0 - 0.25, 1.75, 1.75); wh.rotation.y = Math.PI / 2; m.ext.add(tag(m, "rueda", wh));
  m.ext.add(rod(V(sx0 - 0.02, 1.75, 1.75), V(sx0 - 0.25, 1.75, 1.75), 0.03, M.inox));
  // Aparejo
  const xm = u2x(0.6), top = 17, ySp = 9.6, yRoof = 2.37;
  m.ext.add(tag(m, "mastil", rod(V(xm, yRoof, 0), V(xm, top, 0), 0.1, M.alu, 14)));
  const Bx = u2x(0.13), By = 3.35, Bz = -0.5;
  m.ext.add(tag(m, "botavara", rod(V(xm - 0.1, 3.2, 0), V(Bx, By, Bz), 0.07, M.alu, 12)));
  const tips = {};
  for (const s of [-1, 1]) {
    tips[s] = V(xm - 0.4, ySp, s * 1.15); m.ext.add(tag(m, "crucetas", rod(V(xm, ySp, 0), tips[s], 0.032, M.alu)));
    const cp = V(u2x(0.5), 1.15, s * 2.95); const ob = new THREE.Group(); ob.add(rod(cp, tips[s], 0.013, M.rig), rod(tips[s], V(xm, top - 0.3, 0), 0.013, M.rig)); m.ext.add(tag(m, "obenques", ob));
  }
  const S0 = V(tx1, beamY + 0.05, 0), Mh = V(xm + 0.05, top - 0.35, 0);
  m.ext.add(tag(m, "estay", rod(S0, Mh, 0.013, M.rig)));
  const gT = S0.clone().lerp(Mh, 0.04), gH = S0.clone().lerp(Mh, 0.8), gC = V(xm + 0.25, 2.95, -0.75);
  const gs = sail(gT, gH, gC, 0.08, M.sail, -1); m.ext.add(tag(m, "genova", gs)); m.occ.push(gs);
  const mT = V(xm - 0.13, 3.27, 0), mH = V(xm - 0.13, top - 0.5, 0), mC = V(Bx + 0.15, By + 0.08, Bz + 0.01);
  const ms = sail(mT, mH, mC, 0.07, M.sail, -1); m.ext.add(tag(m, "mayor", ms)); m.occ.push(ms); m.sailM = ms;
  m.topY = top;
  // Hotspots
  const sh = H.sheer;
  addHs(m, "proa", V(H.X(1, sh(1)) + 0.2, sh(1) + 0.3, 2.55), { hl: { u: [0.86, 1.3] }, far: 1 });
  addHs(m, "popa", V(xs - 0.1, sh(0) + 0.35, 2.55), { hl: { u: [-0.3, 0.1] }, far: 1 });
  addHs(m, "estribor", HS.surf(0.5, 1, 0.55), { hl: { u: [-1, 2], side: 1, y: [0, 9] }, far: 1 });
  addHs(m, "babor", HP.surf(0.3, -1, 0.55), { hl: { u: [-1, 2], side: -1, y: [0, 9] }, far: 1 });
  addHs(m, "amura_er", HS.surf(0.86, 1, 0.75), { hl: { u: [0.72, 1.3], side: 1 } });
  addHs(m, "amura_br", HP.surf(0.86, -1, 0.75), { hl: { u: [0.72, 1.3], side: -1 } });
  addHs(m, "aleta_er", HS.surf(0.09, 1, 0.55), { hl: { u: [-0.3, 0.2], side: 1 } });
  addHs(m, "aleta_br", HP.surf(0.09, -1, 0.55), { hl: { u: [-0.3, 0.2], side: -1 } });
  addHs(m, "traves_er", V(u2x(0.5), 1.3, 2.55 + 0.72 + 1.3), { help: "traves", far: 1 });
  addHs(m, "traves_br", V(u2x(0.5), 1.3, -(2.55 + 0.72 + 1.3)), { help: "traves", far: 1 });
  addHs(m, "crujia", V(u2x(0.72), 1.09, 0), { help: "crujia", far: 1 });
  addHs(m, "obramuerta", HS.surf(0.27, 1, 0.42), { hl: { u: [-1, 2], y: [0, 9] }, far: 1 });
  addHs(m, "flotacion", HS.surf(0.4, 1, 0, 0.05), { far: 1 });
  addHs(m, "obraviva", HS.surf(0.62, 1, -0.25), { hl: { u: [-1, 2], y: [-9, 0] }, far: 1 });
  addHs(m, "francobordo", HS.surf(0.68, 1, 0.32), { help: "franco" });
  addHs(m, "patin", HP.deckPt(0.45, -0.3, 0.03), { hl: { u: [-1, 2], side: -1 }, far: 1 });
  addHs(m, "puente", V(u2x(0.3), 0.62, 0), { far: 1 }); addHs(m, "viga", V(tx1, beamY + 0.05, 1.2)); addHs(m, "trampolin", V(u2x(0.75), 1.1, 1.0));
  addHs(m, "cabina", V(u2x(0.5), 2.4, -1.6)); addHs(m, "banera", V(u2x(0.22), 1.12, -0.8)); addHs(m, "espejo", V(xs - 0.03, 0.55, 2.55));
  addHs(m, "quillote", qs[1]); addHs(m, "pala", rds[1].mid); addHs(m, "mecha", V(rds[1].xm, rds[1].top + 0.04, 2.55)); addHs(m, "limera", V(rds[1].xm, rds[1].k, 2.55));
  addHs(m, "helice", sls[1].P.clone().add(V(0, -0.22, 0))); addHs(m, "gemelas", sls[-1].P.clone().add(V(0, -0.22, 0))); addHs(m, "eje", sls[1].mid); addHs(m, "arbotante", sls[1].S.clone().add(V(0, 0.04, 0.1)));
  addHs(m, "mastil", V(xm, 6, 0.12)); addHs(m, "botavara", V(xm - 2.4, 3.3, -0.25)); addHs(m, "obenques", tips[1].clone().lerp(V(u2x(0.5), 1.15, 2.95), 0.4));
  addHs(m, "crucetas", V(xm - 0.2, ySp, 0.7)); addHs(m, "estay", S0.clone().lerp(Mh, 0.9)); addHs(m, "genova", sailPt(gT, gH, gC, 0.3, 0.45, V(0, 0, -0.2)), {});
  addHs(m, "mayor", sailPt(mT, mH, mC, 0.25, 0.5, V(0, 0, -0.3)));
  addHs(m, "molinete", molP.top); addHs(m, "ancla", V(tx1 + 0.3, 0.6, 0)); addHs(m, "cornamusa", HS.deckPt(0.93, 0, 0.08));
  addHs(m, "candelero", rlS.posts[1][2].clone().add(V(0, -0.2, 0))); addHs(m, "guardamancebo", rlS.posts[1][3].clone().lerp(rlS.posts[1][4], 0.5));
  addHs(m, "pulpito", puS.front.clone().add(V(0, 0.03, 0))); addHs(m, "escotilla", HS.deckPt(0.76, 0, 0.12)); addHs(m, "lumbrera", lumP);
  addHs(m, "portillo", HS.surf(0.56, 1, 0.72, 0.02)); addHs(m, "rueda", V(sx0 - 0.3, 1.75, 1.75));
  buildStructure(m, HS, true); buildStructure(m, HP, false);
  m.cam = { target: V(0, 6.2, 0), pos: V(18, 13, 23) }; m.R = 21;
  m.label = "Catamarán";
}
const BUILDERS = { lancha: buildLancha, velero: buildVelero, cat: buildCat };

/* ───────────────────────── Sistemas didácticos ───────────────────────── */
// cam: dirección (desde el objetivo hacia la cámara). water: opacidad del agua para ese sistema.
const SYS = [
  { id: "casco", name: "Casco", hull: true, hullKey: "costado", keys: ["costado", "roda", "quilla", "codaste", "espejo", "pantoque", "orza", "bulbo", "grifo"], cam: [-0.55, 0.0, 1], water: 0.22 },
  { id: "multi", name: "Multicasco", only: "cat", hull: true, hullKey: "patin", keys: ["patin", "puente", "viga", "trampolin", "quillote"], cam: [0.85, 0.7, 1], water: 0.22 },
  { id: "cub", name: "Cubierta y habitabilidad", keys: ["cubierta", "banera", "imbornal", "escotilla", "lumbrera", "manguerote", "portillo", "cabina", "tambucho", "parabrisas", "plataforma"], cam: [-0.55, 1.25, 0.8] },
  { id: "amarre", name: "Amarre y seguridad", keys: ["candelero", "guardamancebo", "pulpito", "balcon", "cornamusa", "bita", "regala", "borda"], cam: [0.8, 0.8, 1] },
  { id: "fondeo", name: "Fondeo", keys: ["ancla", "molinete", "barboten", "escoben"], cam: [1, 0.55, 0.85], minR: 0.22 },
  { id: "timon", name: "Timón y propulsión", keys: ["rueda", "consola", "cana", "mecha", "limera", "pala", "helice", "helice_ab", "gemelas", "eje", "bocina", "arbotante"], cam: [-0.95, -0.3, 0.85], water: 0 },
  { id: "jarcia", name: "Arboladura y jarcia", keys: ["mastil", "botavara", "crucetas", "obenques", "obenquillo", "estay", "backstay", "winche", "escota"], cam: [0.6, 0.14, 1] },
  { id: "velas", name: "Velas", keys: ["mayor", "genova", "gratil", "baluma", "pujamen"], cam: [0.1, 0.08, 1] },
  { id: "est1", name: "Estructura longitudinal", struct: true, hullKey: "forro", keys: ["quilla", "sobrequilla", "roda", "codaste", "palmejar", "trancanil", "forro"], cam: [0.3, 0.5, 1], water: 0.22 },
  { id: "est2", name: "Estructura transversal", struct: true, keys: ["cuaderna", "maestra", "varenga", "bao", "mamparo", "colision", "plan", "sentina", "bomba", "grifo"], cam: [0.45, 0.65, 1], water: 0.22 },
];
const HULLZ = new Set(["costado", "patin", "forro"]);
const SHORT = {
  costado: "Costado", espejo: "Espejo de popa", orza: "Orza (quilla de lastre)", grifo: "Grifo de fondo", patin: "Patín (casco)", trampolin: "Trampolín",
  viga: "Viga de proa", consola: "Consola", parabrisas: "Parabrisas", plataforma: "Plataforma de baño", cabina: "Cabina", balcon: "Balcón", rueda: "Rueda del timón",
  cana: "Caña del timón", pala: "Pala del timón", helice: "Hélice", helice_ab: "Hélice abatible", gemelas: "Hélice gemela (babor)", eje: "Eje de la hélice",
  mastil: "Mástil", estay: "Estay", backstay: "Backstay", genova: "Foque / génova", obenquillo: "Obenquillos", bomba: "Bomba de achique", forro: "Forro",
  colision: "Mamparo de colisión", crujia: "Línea de crujía", flotacion: "Línea de flotación", obraviva: "Obra viva", estribor: "Estribor", babor: "Babor",
};
const sn = k => SHORT[k] || nm(k);
// Trampas típicas del examen (contrastadas con las preguntas oficiales de nomenclatura).
const TRAP = {
  limera: "Al girar la caña o la rueda, la limera permanece inmóvil. No es la mecha (el eje) ni la bocina (paso del eje de la hélice).",
  mecha: "La mecha es el eje del timón; la limera es la abertura o tubo por donde pasa.",
  bocina: "La bocina permanece inmóvil al girar la hélice y su deterioro puede causar inundación. No transforma el giro en empuje: eso lo hacen las palas.",
  cana: "Caña a una banda → la pala va a la banda contraria: caña a babor, la proa cae a estribor.",
  rueda: "Con rueda, la proa cae a la misma banda a la que giras; con caña, a la contraria.",
  pala: "La pala va sumergida; no sobresale del agua.",
  helice: "Hélice: palas que giran alrededor de un eje y empujan el agua; la fuerza de reacción propulsa el barco.",
  helice_ab: "Su función es reducir la resistencia al navegar a vela, no ocupar poco espacio en puerto.",
  gemelas: "Las gemelas de giro al exterior compensan mutuamente la caída de la embarcación.",
  barboten: "El barbotén es la corona con muescas; el molinete es la máquina completa.",
  molinete: "Virar = cobrar cadena con el molinete. Filar = arriarla poco a poco.",
  ancla: "Línea de fondeo = ancla + cadena (con grillete al arganeo) + estacha o cabo.",
  escoben: "Por el escobén pasa la cadena del ancla; el imbornal es un desagüe.",
  imbornal: "Da salida al agua de cubierta y debe estar libre. No es una válvula bajo la flotación (eso es el grifo de fondo).",
  grifo: "Los grifos de fondo están por debajo de la flotación; no confundir con imbornales ni manguerotes.",
  lumbrera: "Su objeto casi único es dar luz y ventilación. La escotilla sirve de paso a personas y materiales.",
  escotilla: "La escotilla es para el paso de personas y materiales; la lumbrera, para luz y ventilación.",
  banera: "Cámara abierta, generalmente a popa, donde suele ir la caña o la rueda del timón.",
  candelero: "El candelero es el poste con orificios; el guardamancebo es el cable o cabo que pasa por ellos.",
  guardamancebo: "Para llevar un cabo de proa a popa por seguridad se usa un guardamancebo que pasa por los candeleros.",
  pulpito: "Púlpito a proa; balcón a popa.",
  balcon: "Balcón a popa; púlpito a proa.",
  regala: "La regala remata la borda por arriba; la borda es la parte del costado entre la cubierta y la regala.",
  borda: "Borda: costado por encima de la cubierta. Regala: la pieza que la remata.",
  roda: "Roda: prolongación de la quilla hacia proa. Codaste: hacia popa.",
  codaste: "Codaste: prolongación de la quilla hacia popa. Roda: hacia proa.",
  quilla: "Va de proa a popa por la parte inferior y en ella se asienta el armazón. La sobrequilla va por dentro, encima.",
  cuaderna: "Cuadernas: «costillas» curvas encajadas en la quilla. Los baos son las piezas transversales que sostienen la cubierta.",
  bao: "Los baos atraviesan de babor a estribor y sostienen la cubierta; no son las «costillas» (eso son las cuadernas).",
  plan: "Plan: parte interior casi horizontal del fondo. Sentina: donde se reúnen las aguas.",
  sentina: "Sentina: fondo interior sobre la quilla donde se reúnen las aguas. Se achica con la bomba.",
  plataforma: "No cuenta en la eslora total (es desmontable).",
  obenques: "Obenques: sujetan el mástil hacia las bandas. Estay: hacia proa. Backstay: hacia popa.",
  estay: "El estay sujeta el mástil hacia proa; los obenques, lateralmente.",
  backstay: "El backstay sujeta el mástil hacia popa.",
  gratil: "Grátil: borde de ataque (junto al mástil o al estay). Baluma: borde de salida. Pujamen: borde inferior.",
  baluma: "Baluma: borde de salida, hacia popa. No confundir con el grátil.",
  pujamen: "Pujamen: borde inferior; en la mayor va a lo largo de la botavara.",
  manguerote: "Ventila los interiores; con mal tiempo se orienta a sotavento.",
  forro: "El forro es el revestimiento exterior; la manga se mide a su cara exterior.",
};
const DIMS = [
  { k: "loa", n: "Eslora total", d: "Distancia medida paralelamente a la flotación y a la crujía entre las perpendiculares de los puntos más salientes de proa y popa.", t: "No incluye lo desmontable (plataforma de baño, púlpito…).", cam: [0, 0.12, 1] },
  { k: "lwl", n: "Eslora de flotación", d: "Longitud de la línea de flotación, entre sus extremos de proa y popa.", cam: [0, 0.04, 1] },
  { k: "manga", n: "Manga", d: "Anchura máxima del casco en su proyección horizontal, medida a la cara exterior del forro.", t: "Se mide a la cara exterior del forro.", cam: [1, 0.3, 0.1] },
  { k: "puntal", n: "Puntal", d: "Altura medida a la mitad de la eslora desde la línea de cubierta hasta el canto superior de la quilla.", t: "No se mide desde el plan: va de la cubierta al canto superior de la quilla.", cam: [0.12, 0.1, 1] },
  { k: "calado", n: "Calado", d: "Distancia vertical entre la línea de flotación y la línea base o quilla (punto más bajo), incluido el espesor del casco.", t: "Incluye el espesor del casco. Calado medio = (calado de proa + calado de popa) / 2.", cam: [0.25, 0.02, 1] },
  { k: "franco", n: "Francobordo", d: "Distancia vertical sobre el costado desde la flotación en máxima carga hasta la cubierta estanca más alta. Da idea de la reserva de flotabilidad.", t: "Se mide desde la flotación en máxima carga.", cam: [0.35, 0.1, 1] },
  { k: "flotacion", n: "Línea de flotación", d: D.flotacion[2], t: "El plano de flotación (no el de crujía) separa la obra viva de la obra muerta.", cam: [0.3, 0.22, 1] },
  { k: "obraviva", n: "Obra viva (carena)", d: D.obraviva[2], t: "Obra viva = carena = lo sumergido.", cam: [0.3, 0.1, 1] },
  { k: "obramuerta", n: "Obra muerta", d: D.obramuerta[2], t: "El viento ejerce su presión sobre la obra muerta, no solo sobre las velas.", cam: [0.3, 0.16, 1] },
];
const DIRK = ["proa", "amura_er", "traves_er", "aleta_er", "popa", "aleta_br", "traves_br", "amura_br", "estribor", "babor", "crujia"];
const DIRTRAP = {
  proa: "La proa es la parte que corta las aguas al avanzar.",
  amura_er: "La amura está hacia proa (parte curva del costado cercana a la proa). La aleta, hacia popa.",
  amura_br: "La amura está hacia proa (parte curva del costado cercana a la proa). La aleta, hacia popa.",
  aleta_er: "La aleta está hacia popa: entre el través y la popa, donde el costado se cierra. No entre el través y la proa (eso es la amura).",
  aleta_br: "La aleta está hacia popa: entre el través y la popa, donde el costado se cierra. No entre el través y la proa (eso es la amura).",
  traves_er: "La dirección perpendicular a la quilla (o al costado) es el través.",
  traves_br: "La dirección perpendicular a la quilla (o al costado) es el través.",
  estribor: "Derecha mirando de popa a proa. Luz de costado verde.",
  babor: "Izquierda mirando de popa a proa. Luz de costado roja.",
  crujia: "Línea de crujía: eje de simetría longitudinal. El plano de crujía divide el barco en babor y estribor.",
};
const DIRNAME = { proa: "Proa", popa: "Popa", babor: "Babor", estribor: "Estribor", amura_er: "Amura de estribor", amura_br: "Amura de babor", aleta_er: "Aleta de estribor", aleta_br: "Aleta de babor", traves_er: "Través de estribor", traves_br: "Través de babor", crujia: "Línea de crujía" };

/* Piezas «zona» sin malla propia: líneas de quilla, roda, codaste, pantoque, borda y bordes de vela */
function addZones(m) {
  const M = m.M; M.zone = new THREE.MeshStandardMaterial({ color: 0x2f7fc1, roughness: 0.45, emissive: 0x0b2a44, emissiveIntensity: 0.3 });
  const r0 = 0.032 * Math.max(1, m.R / 13), Hs = m.hulls, HS = Hs[Hs.length - 1];
  const z = (k, obj) => { obj.traverse(o => { o.userData.zone = true; }); m.ext.add(tag(m, k, obj)); return obj; };
  const setHs = (k, p) => { m.hs = m.hs.filter(h => h.k !== k); addHs(m, k, p); };
  const addIf = (k, p) => { if (!m.hs.some(h => h.k === k)) addHs(m, k, p); };
  for (const H of Hs) {
    const oz = H.oz, kp = [];
    for (let u = 0; u <= 1.0001; u += 0.04) { const k = H.keel(u); kp.push(V(H.X(u, k), k - 0.012, oz)); }
    z("quilla", tube(kp, r0, M.zone));
    const k1 = H.keel(1), s1 = H.sheer(1) + H.hb, rp = [];
    for (let i = 0; i <= 8; i++) { const y = k1 + (s1 - k1) * i / 8; rp.push(V(H.X(1, y) + 0.016, y, oz)); }
    z("roda", tube(rp, r0, M.zone));
    const k0 = H.keel(0), c1 = k0 + (H.sheer(0) - k0) * 0.55;
    z("codaste", tube([V(H.xs - 0.022, k0, oz), V(H.xs - 0.022, c1, oz)], r0, M.zone, false));
    for (const s of [-1, 1]) {
      const pp = []; for (let u = 0.03; u <= 0.885; u += 0.035) { const c = H.chine(u); pp.push(V(H.X(u, c[1]), c[1], oz + s * (c[0] + 0.016))); }
      z("pantoque", tube(pp, r0 * 0.9, M.zone));
      const bp = []; for (const u of H.us) { if (u > 0.97) continue; const y = H.sheer(u) + H.hb * 0.42; bp.push(V(H.X(u, y), y, oz + s * (H.b(u) + 0.018))); }
      z("borda", tube(bp, Math.max(0.022, H.hb * 0.4), M.zone));
    }
  }
  const H = HS, oz = H.oz;
  setHs("costado", H.surf(0.5, 1, Math.max(0.3, H.sheer(0.5) * 0.45)));
  addIf("quilla", H.keelPt(0.36, -0.05));
  const ym = (H.keel(1) + H.sheer(1)) / 2; addIf("roda", V(H.X(1, ym) + 0.05, ym, oz));
  addIf("codaste", V(H.xs - 0.05, H.keel(0) + (H.sheer(0) - H.keel(0)) * 0.25, oz));
  const c = H.chine(0.3); addIf("pantoque", V(H.X(0.3, c[1]), c[1], oz + c[0] + 0.04));
  addIf("borda", V(H.X(0.36, H.sheer(0.36)), H.sheer(0.36) + H.hb * 0.42, oz + H.b(0.36) + 0.04));
  if (m.key === "cat") { setHs("patin", H.surf(0.42, 1, 0.55)); setHs("puente", V(H.u2x(0.22), 0.86, 1.98)); }
  if (m.sailM) {
    const g = m.sailM.geometry.attributes.position, W = Math.round(Math.sqrt(g.count)), P = i => V(g.getX(i), g.getY(i), g.getZ(i));
    const luff = [], foot = [], leech = [];
    for (let i = 0; i < W; i++) { luff.push(P(i * W)); leech.push(P(i * W + W - 1)); foot.push(P(i)); }
    const rr = r0 * 1.25;
    z("gratil", polyTube(luff, rr, M.zone)); z("baluma", polyTube(leech, rr, M.zone)); z("pujamen", polyTube(foot, rr, M.zone));
    setHs("gratil", luff[Math.round(W * 0.6)]); setHs("baluma", leech[Math.round(W * 0.45)]); setHs("pujamen", foot[Math.round(W * 0.55)]);
  }
}
function segX(ax, ay, bx, by, cx, cy, dx, dy) {
  const o = (px, py, qx, qy, rx, ry) => Math.sign((qx - px) * (ry - py) - (qy - py) * (rx - px));
  return o(ax, ay, bx, by, cx, cy) * o(ax, ay, bx, by, dx, dy) < 0 && o(cx, cy, dx, dy, ax, ay) * o(cx, cy, dx, dy, bx, by) < 0;
}
const isUnder = (o, a) => { while (o) { if (o === a) return true; o = o.parent; } return false; };
/* Anclas para piezas con malla pero sin punto definido: centro de la malla más cercana a estribor (+z, lado de cámara) */
function fallbackHs(m) {
  m.root.updateMatrixWorld(true); const box = new THREE.Box3();
  for (const s of SYS) if (!s.struct) for (const k of s.keys) {
    if (m.hs.some(h => h.k === k)) continue;
    const ms = (m.keyMap.get(k) || []).filter(o => isUnder(o, m.ext)); if (!ms.length) continue;
    let best = null, bz = -1e9; for (const o of ms) { box.setFromObject(o); const c = box.getCenter(V()); if (c.z > bz) { bz = c.z; best = c; } }
    addHs(m, k, best);
  }
}
/* Lleva cada punto de anclaje al vértice más cercano de su pieza (las etiquetas apuntan a la pieza real) */
function snapHs(m) {
  m.root.updateMatrixWorld(true); const v = V(), tri = new THREE.Triangle();
  for (const [arr, grp] of [[m.hs, m.ext], [m.shs, m.struct]]) for (const h of arr) {
    const ms = (m.keyMap.get(h.k) || []).filter(o => isUnder(o, grp)); if (!ms.length) continue;
    let best = null, bd = 1e9;
    for (const o of ms) {
      const p = o.geometry.attributes.position, ix = o.geometry.index, n = ix ? ix.count : p.count;
      for (let t = 0; t + 2 < n; t += 3) {
        const a = ix ? ix.getX(t) : t, b = ix ? ix.getX(t + 1) : t + 1, c = ix ? ix.getX(t + 2) : t + 2;
        tri.a.fromBufferAttribute(p, a).applyMatrix4(o.matrixWorld); tri.b.fromBufferAttribute(p, b).applyMatrix4(o.matrixWorld); tri.c.fromBufferAttribute(p, c).applyMatrix4(o.matrixWorld);
        tri.closestPointToPoint(h.p, v); const d = v.distanceToSquared(h.p); if (d < bd) { bd = d; best = v.clone(); }
      }
    }
    if (best) h.p = best;
  }
}
/* Halos: copia inflada de las mallas finas (cabos, candeleros, varillas) para verlas y tocarlas mejor */
function makeProxies(m, haloMat) {
  const grow = m.R * 0.0032, list = [];
  m.root.traverse(o => { if (o.isMesh && !o.userData.proxy && (isUnder(o, m.ext) || isUnder(o, m.struct))) list.push(o); });
  for (const o of list) {
    const g = o.geometry; if (!g.attributes.normal) continue; if (!g.boundingBox) g.computeBoundingBox();
    const s = g.boundingBox.getSize(V()).toArray().sort((a, b) => a - b); if (s[1] > 0.075) continue;
    const pg = g.clone(), p = pg.attributes.position, n = pg.attributes.normal;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * grow, p.getY(i) + n.getY(i) * grow, p.getZ(i) + n.getZ(i) * grow);
    pg.computeBoundingBox(); pg.computeBoundingSphere();
    const px = new THREE.Mesh(pg, haloMat); px.userData = { proxy: true, k: o.userData.k }; px.visible = false; px.renderOrder = 4; o.add(px); o.userData.px = px;
  }
}
function collectLooks(m) {
  m.looks = [];
  m.root.traverse(o => {
    if (!o.isMesh || o.userData.proxy) return;
    const g = isUnder(o, m.struct) ? "struct" : isUnder(o, m.cotas) || isUnder(o, m.help) ? null : isUnder(o, m.hullG) ? "hull" : "ext";
    if (!g) return;
    o.userData.mat0 = o.material; const k = o.userData.k;
    m.looks.push({ o, g, k, zone: !!o.userData.zone, wl: k === "flotacion", hull: !!o.userData.hull, sail: k === "genova" || k === "mayor" });
  });
}

/* Diagrama 2D de direcciones (vista cenital, proa arriba) */
function dirSVG() {
  const CX = 280, y0 = 115, Lh = 240, f = n => n.toFixed(1);
  const hb = t => (t < 0.5 ? 56 * Math.pow(Math.sin(t / 0.5 * Math.PI / 2), 0.78) : 56 - 16 * Math.pow((t - 0.5) / 0.5, 1.6));
  const Y = t => y0 + t * Lh, side = (s, a, b, st = 0.02) => { const p = []; for (let t = a; t <= b + 1e-6; t += st) p.push([CX + s * hb(t), Y(t)]); return p; };
  const pts = a => a.map(q => f(q[0]) + "," + f(q[1])).join(" ");
  const er = side(1, 0, 1), br = side(-1, 0, 1);
  const outline = pts([...er, ...br.slice().reverse()]);
  const half = (s) => pts([...side(s, 0, 1), [CX, Y(1)], [CX, Y(0)]]);
  const cap = (a, b) => pts([...side(1, a, b, 0.01), ...side(-1, a, b, 0.01).reverse()]);
  const R = 140, RL = 160, tm = Y(0.5);
  const ang = { proa: 0, amura_er: 45, traves_er: 90, aleta_er: 135, popa: 180, aleta_br: 225, traves_br: 270, amura_br: 315 };
  const lines = { proa: ["Proa"], popa: ["Popa"], amura_er: ["Amura", "de estribor"], amura_br: ["Amura", "de babor"], aleta_er: ["Aleta", "de estribor"], aleta_br: ["Aleta", "de babor"], traves_er: ["Través", "de estribor"], traves_br: ["Través", "de babor"] };
  const lbl = (k) => {
    const a = ang[k] * Math.PI / 180, sx = Math.sin(a), cy0 = Math.cos(a), x = CX + RL * sx, y = tm - RL * cy0;
    const anc = sx > 0.3 ? "start" : sx < -0.3 ? "end" : "middle", L = lines[k], dy = cy0 > 0.5 ? -(L.length - 1) * 21 : cy0 < -0.5 ? 16 : -(L.length - 1) * 10.5 + 6;
    return `<text class="lbl" x="${f(x)}" y="${f(y + dy)}" text-anchor="${anc}">${L.map((s, i) => `<tspan x="${f(x)}" dy="${i ? 21 : 0}">${esc(s)}</tspan>`).join("")}</text>`;
  };
  const strip = (s, a, b) => { const p = pts(side(s, a, b, 0.01).map(q => [q[0] + s * 4, q[1]])); return `<polyline class="strip" points="${p}"/><polyline class="hit" points="${p}"/>`; };
  const arrow = s => { const x1 = CX + s * (hb(0.5) + 8), x2 = CX + s * (R - 4); return `<line class="arrow" x1="${f(x1)}" y1="${f(tm)}" x2="${f(x2)}" y2="${f(tm)}"/><polygon class="head" points="${f(x2 + s * 10)},${f(tm)} ${f(x2 - s * 4)},${f(tm - 7)} ${f(x2 - s * 4)},${f(tm + 7)}"/><line class="hit" x1="${f(x1)}" y1="${f(tm)}" x2="${f(x2)}" y2="${f(tm)}"/>`; };
  const dirRay = (k) => { const a = ang[k] * Math.PI / 180, x2 = CX + R * Math.sin(a), y2 = tm - R * Math.cos(a); const s = Math.sign(Math.sin(a)), t = ang[k] < 90 || ang[k] > 270 ? 0.2 : 0.82; const x1 = CX + s * hb(t), y1 = Y(t); return `<line class="arrow" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`; };
  return `<svg viewBox="0 20 560 440" role="img" aria-label="Embarcación vista desde arriba con la proa hacia arriba: direcciones y zonas">
    <circle class="ring" cx="${CX}" cy="${tm}" r="${R}"/>
    <g class="dk" data-k="babor"><polygon class="half br" points="${half(-1)}"/><text class="side lbl" transform="translate(${CX - 24} ${f(tm)}) rotate(-90)" text-anchor="middle">BABOR</text></g>
    <g class="dk" data-k="estribor"><polygon class="half er" points="${half(1)}"/><text class="side lbl" transform="translate(${CX + 24} ${f(tm)}) rotate(90)" text-anchor="middle">ESTRIBOR</text></g>
    <g class="dk" data-k="crujia"><line class="cj" x1="${CX}" y1="${y0 - 26}" x2="${CX}" y2="${f(Y(1) + 30)}"/><line class="hit" x1="${CX}" y1="${y0 - 26}" x2="${CX}" y2="${f(Y(1) + 30)}"/><text class="lbl sm" x="${CX + 8}" y="${f(Y(1) + 27)}" text-anchor="start">Crujía</text></g>
    <g class="dk" data-k="proa"><polygon class="cap" points="${cap(0, 0.1)}"/>${lbl("proa")}</g>
    <g class="dk" data-k="popa"><polygon class="cap" points="${cap(0.95, 1)}"/><polyline class="hit" points="${f(CX - hb(1))},${f(Y(1))} ${f(CX + hb(1))},${f(Y(1))}"/>${lbl("popa")}</g>
    <g class="dk" data-k="amura_er">${strip(1, 0.08, 0.33)}${dirRay("amura_er")}${lbl("amura_er")}</g>
    <g class="dk" data-k="amura_br">${strip(-1, 0.08, 0.33)}${dirRay("amura_br")}${lbl("amura_br")}</g>
    <g class="dk" data-k="aleta_er">${strip(1, 0.68, 0.96)}${dirRay("aleta_er")}${lbl("aleta_er")}</g>
    <g class="dk" data-k="aleta_br">${strip(-1, 0.68, 0.96)}${dirRay("aleta_br")}${lbl("aleta_br")}</g>
    <g class="dk" data-k="traves_er">${arrow(1)}${lbl("traves_er")}</g>
    <g class="dk" data-k="traves_br">${arrow(-1)}${lbl("traves_br")}</g>
    <polygon class="hullo" points="${outline}"/>
    <circle cx="${f(CX - hb(0.24) + 9)}" cy="${f(Y(0.24))}" r="5" fill="var(--port)"><title>Luz de costado de babor: roja</title></circle>
    <circle cx="${f(CX + hb(0.24) - 9)}" cy="${f(Y(0.24))}" r="5" fill="var(--stbd)"><title>Luz de costado de estribor: verde</title></circle>
  </svg>`;
}

/* ───────────────────────── Módulo ───────────────────────── */
export default {
  id: ID, tema: 1, title: "Astillero 3D", icon: "⊿",
  desc: "Explora por sistemas una lancha, un velero y un catamarán: casco, cubierta, fondeo, timón, jarcia, velas, estructura, dimensiones y direcciones.",
  mount(el, ctx) {
    injectCSS();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.createElement("div"); root.className = "m-astillero";
    root.innerHTML = `
      <div class="ma-bar">
        <div class="seg" role="group" aria-label="Modelo" data-g="model"><button type="button" data-v="lancha">Lancha</button><button type="button" data-v="velero">Velero</button><button type="button" data-v="cat">Catamarán</button></div>
        <div class="seg" role="group" aria-label="Vista" data-g="view"><button type="button" data-v="pz">Piezas</button><button type="button" data-v="dim">Dimensiones</button><button type="button" data-v="dir">Direcciones</button></div>
        <div class="seg" role="group" aria-label="Modo" data-g="mode"><button type="button" data-v="exp">Explorar</button><button type="button" data-v="what">¿Qué pieza es?</button><button type="button" data-v="tap">Señálala</button></div>
      </div>
      <div class="ma-sys" role="group" aria-label="Sistema"></div>
      <div class="ma-main">
        <div class="ma-left">
          <div class="stage ma-stage">
            <canvas tabindex="0" aria-label="Modelo 3D de la embarcación. Arrastra para girar, pellizca o usa la rueda para acercar."></canvas>
            <div class="ma-co"><svg aria-hidden="true"></svg><div class="ma-lbs"></div></div>
            <div class="ma-cota" hidden></div>
            <div class="ma-dir" hidden></div>
            <div class="ma-banner" hidden aria-live="polite"></div>
            <div class="ma-hud">
              <button type="button" class="btn sm" data-a="labels" aria-pressed="true">Etiquetas</button>
              <button type="button" class="btn sm" data-a="water">Agua</button>
              <button type="button" class="btn sm" data-a="reset">Encuadrar</button>
            </div>
          </div>
          <div class="panel ma-qbox" hidden aria-live="polite"></div>
        </div>
        <aside class="panel ma-side" aria-live="polite"></aside>
      </div>`;
    el.appendChild(root);
    const $ = s => root.querySelector(s);
    const stage = $(".ma-stage"), canvas = $("canvas"), coEl = $(".ma-co"), coSvg = $(".ma-co svg"), coLbs = $(".ma-lbs"), cotaEl = $(".ma-cota"),
      dirEl = $(".ma-dir"), banner = $(".ma-banner"), side = $(".ma-side"), qbox = $(".ma-qbox"), sysBar = $(".ma-sys");
    dirEl.innerHTML = dirSVG();

    const store = ctx.store || { get: (k, d) => d, set() {} };
    const st = store.get("state", {}) || {};
    const S = { model: BUILDERS[st.model] ? st.model : "lancha", view: ["pz", "dim", "dir"].includes(st.view) ? st.view : "pz", sys: st.sys || "casco", mode: "exp",
      labels: true, sel: null, qhl: null, bad: null, hov: null, explode: 0, trim: 0, heel: 0, waterOv: null, dimSel: "loa", dirSel: null };
    let found = store.get("found", {}) || {};
    let dirFound = store.get("dirFound", []) || [];
    let badgeGiven = !!store.get("badge", false);
    const save = () => { try { store.set("found", found); store.set("dirFound", dirFound); } catch {} };
    const saveState = () => { try { store.set("state", { model: S.model, view: S.view, sys: S.sys }); } catch {} };

    /* Three */
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { stage.insertAdjacentHTML("beforeend", `<div class="ma-err">No se pudo iniciar WebGL en este dispositivo.</div>`); return () => root.remove(); }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer); const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04); scene.environment = envRT.texture;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 400);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = !reduce; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.86; controls.minDistance = 1.2;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6f8a99, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(8, 14, 9); scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-9, 4, -7); scene.add(fill);
    const waterMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color() }, uC2: { value: new THREE.Color() }, uA: { value: 0.55 }, uR: { value: 46 } },
      vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform float uT; uniform float uA; uniform float uR; uniform vec3 uC; uniform vec3 uC2; varying vec2 vP;
        void main(){ float r = length(vP) / uR; float fade = smoothstep(1.0, 0.45, r);
          float w = sin(vP.x*1.1 + uT*0.8)*0.5 + sin(vP.y*1.6 - uT*0.6 + vP.x*0.35)*0.5;
          float ring = smoothstep(0.93, 1.0, sin(length(vP)*1.6 - uT*1.1)*0.5 + 0.5);
          vec3 c = mix(uC, uC2, 0.5 + 0.22*w) + ring*0.05;
          gl_FragColor = vec4(c, uA * fade);
          #include <colorspace_fragment>
        }` });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(92, 92, 1, 1), waterMat); water.rotation.x = -Math.PI / 2; water.renderOrder = 5; scene.add(water);

    const U = { uHl: { value: new THREE.Vector4(0, 0, 0, 0) }, uHlY: { value: new THREE.Vector2(-9, 9) }, uAcc: { value: new THREE.Color() }, uT: { value: 0 } };
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.45, side: THREE.DoubleSide });
    const badMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.5, side: THREE.DoubleSide });
    const ghostMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
    const faintMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide });
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false });
    const haloSel = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, depthTest: false });
    const helpMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
    const cotaMat = new THREE.MeshBasicMaterial({ depthTest: false, transparent: true });
    const cotaMat2 = new THREE.MeshBasicMaterial({ depthTest: false, transparent: true, opacity: 0.55 });
    const wlMat = new THREE.MeshBasicMaterial({});
    const SHARED = [hlMat, badMat, ghostMat, faintMat, haloMat, haloSel, helpMat, cotaMat, cotaMat2, wlMat];
    function applyTheme() {
      const dark = (ctx.theme ? ctx.theme() : "light") === "dark";
      const acc = tokColor("--accent", "#a8226f"), sea2 = tokColor("--sea-2", "#b9d7e2"), ink = tokColor("--ink", "#0f2230"), sea = tokColor("--sea", "#d7e9ef");
      U.uAcc.value.copy(acc); hlMat.color.copy(acc); hlMat.emissive.copy(acc); helpMat.color.copy(acc); cotaMat.color.copy(acc); cotaMat2.color.copy(acc); haloSel.color.copy(acc);
      const bad = tokColor("--bad", "#c0392b"); badMat.color.copy(bad); badMat.emissive.copy(bad);
      const mut = tokColor("--muted", "#557080"); ghostMat.color.copy(mut); faintMat.color.copy(mut); ghostMat.opacity = dark ? 0.2 : 0.14; faintMat.opacity = dark ? 0.08 : 0.06;
      haloMat.color.copy(ink); haloMat.opacity = dark ? 0.22 : 0.16;
      wlMat.color.copy(tokColor("--buoy-y", "#e9b400"));
      if (dark) { waterMat.uniforms.uC.value.copy(sea2).lerp(ink, 0.1); waterMat.uniforms.uC2.value.copy(sea); }
      else { waterMat.uniforms.uC.value.copy(sea2).lerp(ink, 0.32); waterMat.uniforms.uC2.value.copy(sea2).lerp(ink, 0.12); }
    }
    applyTheme();
    let dirty = true;
    const offTheme = ctx.onTheme ? ctx.onTheme(() => { applyTheme(); dirty = true; }) : null;

    /* Modelo */
    let m = null;
    function disposeObj(o) {
      const mats = new Set(), geos = new Set();
      o.traverse(x => { if (x.geometry) geos.add(x.geometry); if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(mm => mats.add(mm)); if (x.userData.mat0) mats.add(x.userData.mat0); });
      geos.forEach(g => g.dispose());
      mats.forEach(mm => { if (SHARED.includes(mm)) return; if (mm.map) mm.map.dispose(); mm.dispose(); });
    }
    const sysList = () => SYS.filter(s => (!s.only || s.only === m.key) && pieces(s).length);
    const curSys = () => SYS.find(s => s.id === S.sys) || SYS[0];
    function pieces(s) { const arr = s.struct ? m.shs : m.hs; return s.keys.filter(k => arr.some(h => h.k === k)); }
    const anchorOf = (s, k) => (s.struct ? m.shs : m.hs).find(h => h.k === k);
    const extKeys = () => { const set = new Set(); for (const s of sysList()) if (!s.struct) pieces(s).forEach(k => set.add(k)); return [...set]; };
    function loadModel(key) {
      if (m) { scene.remove(m.root); disposeObj(m.root); Object.values(m.M).forEach(x => x.dispose && x.dispose()); }
      m = newModel(key, U); m.cotaMat = cotaMat; m.cotaMat2 = cotaMat2; m.wlMat = wlMat;
      BUILDERS[key](m);
      addDims(m); addHelpers(m, helpMat); addZones(m);
      scene.add(m.root); fallbackHs(m); snapHs(m); makeProxies(m, haloMat); collectLooks(m);
      controls.maxDistance = m.R * 3.2;
      if (!sysList().some(s => s.id === S.sys)) S.sys = sysList()[0].id;
      enterView(true);
    }

    /* Cámara */
    let tw = null;
    function tweenTo(t, p, instant) {
      if (instant || reduce) { controls.target.copy(t); camera.position.copy(p); controls.update(); tw = null; dirty = true; return; }
      tw = { t0: performance.now(), d: 750, ft: controls.target.clone(), fp: camera.position.clone(), tt: t, tp: p };
    }
    let colW = 0; // anchura reservada a cada columna de etiquetas
    function fitDist(box, dir, minHalf = 0) {
      const c = box.getCenter(V()), right = new THREE.Vector3().crossVectors(UP, dir); if (right.lengthSq() < 1e-6) right.set(1, 0, 0); right.normalize();
      const up = new THREE.Vector3().crossVectors(dir, right).normalize();
      let rx = minHalf, ry = minHalf, dz = 0; const q = V();
      for (let i = 0; i < 8; i++) {
        q.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(c);
        rx = Math.max(rx, Math.abs(q.dot(right))); ry = Math.max(ry, Math.abs(q.dot(up))); dz = Math.max(dz, q.dot(dir));
      }
      const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
      const fx = clamp((w - 2 * colW) / w, 0.4, 1) * 0.94, fy = (h - 70) / h;
      const tv = Math.tan(camera.fov * Math.PI / 360);
      return Math.max(rx / (tv * camera.aspect * fx), ry / (tv * fy)) + dz * 0.45;
    }
    function boxOfLooks(pred) {
      const box = new THREE.Box3(); m.root.updateMatrixWorld(true);
      for (const L of m.looks) if (pred(L) && isVis(L.o)) box.expandByObject(L.o);
      return box;
    }
    function viewDir() {
      if (S.view === "dim") return V(...(DIMS.find(d => d.k === S.dimSel) || DIMS[0]).cam).normalize();
      return V(...curSys().cam).normalize();
    }
    function frame(instant) {
      if (!m || S.view === "dir") return;
      let box, minHalf = 0;
      if (S.view === "dim") {
        box = boxOfLooks(L => L.g === "hull");
        const c = m.cotaList.find(x => x.key === S.dimSel); if (c) box.expandByObject(c.g);
      } else {
        const s = curSys(), keys = new Set(pieces(s));
        box = boxOfLooks(L => keys.has(L.k) || (s.hull && L.g === "hull"));
        if (box.isEmpty()) box = boxOfLooks(L => L.g === "hull");
        minHalf = m.R * (s.minR || 0.1) * 0.5;
      }
      let dir = viewDir(); const c = box.getCenter(V());
      if (camera.aspect < 0.9 && S.view === "pz") { const alt = V(dir.x + Math.sign(dir.x || 1) * 1.1, dir.y + 0.3, dir.z).normalize(); if (fitDist(box, alt, minHalf) < fitDist(box, dir, minHalf) * 0.85) dir = alt; }
      const p = c.clone().addScaledVector(dir, fitDist(box, dir, minHalf) * (S.view === "dim" ? 1.12 : 1));
      tweenTo(c, p, instant);
    }
    function focusKey(k, preset) {
      if (!m) return;
      let box = boxOfLooks(L => L.k === k && L.o.visible);
      if (box.isEmpty()) return;
      const h = anchorOf(curSys(), k);
      if (h) { // solo la instancia de la pieza junto a su ancla (p. ej. una cornamusa, no las cuatro)
        const a = worldOf(h), bb = new THREE.Box3(), near = new THREE.Box3();
        for (const L of m.looks) if (L.k === k && isVis(L.o)) { bb.setFromObject(L.o); if (bb.distanceToPoint(a) < m.R * 0.05) near.union(bb); }
        if (!near.isEmpty()) box = near;
      }
      const off = (tw ? tw.tp : camera.position).clone().sub(tw ? tw.tt : controls.target), cur = off.length(), dir = preset ? viewDir() : off.normalize();
      const fd = fitDist(box, dir, m.R * 0.1) * 1.15, c = box.getCenter(V()), d = preset ? fd : Math.min(cur, fd);
      tweenTo(c, c.clone().addScaledVector(dir, d));
    }
    function worldOf(h) {
      const p = h.p.clone(); if (h.ex && curSys().struct) p.addScaledVector(h.ex, S.explode);
      return p.applyMatrix4(m.root.matrixWorld);
    }
    const isVis = o => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };

    /* Apariencia: sistema activo en su material, resto «fantasma» */
    function applyLook() {
      if (!m) return;
      const dim = S.view === "dim", pz = S.view === "pz", s = curSys(), est = pz && !!s.struct;
      const keys = new Set(pz ? pieces(s) : []), hk = S.qhl || S.sel;
      m.root.visible = S.view !== "dir";
      m.ext.visible = !est; m.struct.visible = est; m.cotas.visible = dim; m.help.visible = false;
      const hullOp = est ? (hk === "forro" ? 0.4 : 0.13 * (1 - S.explode * 0.6)) : dim && S.dimSel === "puntal" ? 0.35 : 1;
      for (const mt of m.hullMats) { const tr = hullOp < 1; if (mt.transparent !== tr) { mt.transparent = tr; mt.needsUpdate = true; } mt.opacity = hullOp; mt.depthWrite = !tr; }
      for (const L of m.looks) {
        let v;
        if (dim) v = L.zone ? "hide" : L.wl ? (S.dimSel === "flotacion" ? "acc" : "solid") : "solid";
        else if (est) v = L.g === "struct" ? (keys.has(L.k) ? "solid" : "ghost") : L.wl ? "hide" : "solid";
        else if (L.g === "struct" || L.wl) v = "hide";
        else if (L.zone) v = keys.has(L.k) ? "solid" : "hide";
        else if (L.g === "hull") v = keys.has(L.k) || s.hull ? "solid" : "ghost";
        else v = keys.has(L.k) ? "solid" : L.sail ? "faint" : "ghost";
        if (pz && v === "solid" && L.k && keys.has(L.k)) { if (S.bad === L.k) v = "bad"; else if (hk === L.k) v = "sel"; }
        L.o.visible = v !== "hide";
        L.o.material = v === "ghost" ? ghostMat : v === "faint" ? faintMat : v === "sel" ? hlMat : v === "bad" ? badMat : v === "acc" ? cotaMat : L.o.userData.mat0;
        const px = L.o.userData.px;
        if (px) { px.visible = pz && (v === "solid" || v === "sel" || v === "bad"); px.material = v === "sel" ? haloSel : haloMat; }
      }
      U.uHl.value.w = 0; const H = m.hulls[0];
      if (pz && hk && HULLZ.has(hk) && keys.has(hk)) { U.uHl.value.set(H.xs - 2, H.xs + H.L + 2, hk === "forro" ? 0 : 1, 1); U.uHlY.value.set(-9, 9); }
      if (dim && (S.dimSel === "obraviva" || S.dimSel === "obramuerta")) { U.uHl.value.set(H.xs - 2, H.xs + H.L + 2, 0, 1); U.uHlY.value.set(S.dimSel === "obraviva" ? -9 : 0, S.dimSel === "obraviva" ? 0 : 9); }
      if (dim) for (const c of m.cotaList) c.g.visible = c.key === S.dimSel;
      dirty = true;
    }
    const WATER = [["translúcida", 0.55], ["tenue", 0.22], ["oculta", 0]];
    function waterLevel() {
      if (S.waterOv != null) return WATER[S.waterOv][1];
      if (S.view === "dim") return ["obraviva", "calado", "puntal"].includes(S.dimSel) ? 0.22 : 0.55;
      const s = curSys(); return s.water != null ? s.water : 0.55;
    }
    function setWater() {
      const a = waterLevel(); waterMat.uniforms.uA.value = a; water.visible = a > 0 && S.view !== "dir";
      const i = WATER.findIndex(x => Math.abs(x[1] - a) < 0.02);
      $('[data-a="water"]').textContent = "Agua: " + (i >= 0 ? WATER[i][0] : "translúcida"); dirty = true;
    }

    /* Etiquetas tipo libro: columnas laterales con línea guía */
    let co = [];
    const coOn = () => S.view === "pz" && S.mode === "exp" && S.labels;
    function buildCallouts() {
      coLbs.innerHTML = ""; coSvg.innerHTML = ""; co = []; colW = 0;
      if (S.view !== "pz") return;
      const s = curSys(), NS = "http://www.w3.org/2000/svg";
      pieces(s).forEach((k, i) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "ma-lb"; b.dataset.k = k;
        b.innerHTML = `<span class="n">${i + 1}</span><span class="t">${esc(sn(k))}</span>`; b.setAttribute("aria-label", `${i + 1}. ${sn(k)}`);
        coLbs.appendChild(b);
        const g = document.createElementNS(NS, "g"), pl = document.createElementNS(NS, "polyline"), ci = document.createElementNS(NS, "circle"); ci.setAttribute("r", "3.5");
        g.append(pl, ci); coSvg.appendChild(g);
        co.push({ k, h: anchorOf(s, k), el: b, g, pl, ci, wd: 0, ht: 0, vis: true, x: -1, y: -1 });
      });
      coEl.hidden = !coOn();
      for (const it of co) { it.wd = it.el.offsetWidth; it.ht = it.el.offsetHeight || 24; }
      if (coOn() && stage.clientWidth >= 600) colW = Math.min(stage.clientWidth * 0.26, Math.max(0, ...co.map(it => it.wd)) + 26);
      syncMarks();
    }
    function syncMarks() {
      const hk = S.qhl || S.sel;
      for (const it of co) { it.el.classList.toggle("on", it.k === hk); it.g.classList.toggle("on", it.k === hk); it.el.classList.toggle("hov", it.k === S.hov); it.g.classList.toggle("hov", it.k === S.hov); }
      side.querySelectorAll(".ma-list button[data-k]").forEach(b => { b.setAttribute("aria-pressed", String(b.dataset.k === S.sel)); b.classList.toggle("hov", b.dataset.k === S.hov); });
    }
    const vtmp = new THREE.Vector3();
    function layoutCallouts() {
      const on = coOn() && co.length; coEl.hidden = !on; if (!on) return;
      const w = stage.clientWidth, h = stage.clientHeight, narrow = w < 600; coEl.classList.toggle("num", narrow);
      m.root.updateMatrixWorld();
      for (const it of co) {
        vtmp.copy(worldOf(it.h)).project(camera);
        it.vis = vtmp.z < 1 && Math.abs(vtmp.x) < 0.99 && Math.abs(vtmp.y) < 0.99;
        it.ax = (vtmp.x * 0.5 + 0.5) * w; it.ay = (-vtmp.y * 0.5 + 0.5) * h;
        it.el.style.display = it.vis ? "" : "none"; it.g.style.display = it.vis ? "" : "none";
      }
      const vis = co.filter(it => it.vis);
      const put = (it, x, y, pts) => { it.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; it.pl.setAttribute("points", pts); it.ci.setAttribute("cx", it.ax.toFixed(1)); it.ci.setAttribute("cy", it.ay.toFixed(1)); };
      if (narrow) {
        const D2 = 23, placed = [], offs = [[13, -13], [-13, -13], [13, 13], [-13, 13], [0, -22], [22, 0], [-22, 0], [0, 22], [24, -24], [-24, -24], [24, 24], [-24, 24], [0, -36], [36, 0], [-36, 0], [0, 36]];
        vis.sort((a, b) => a.ay - b.ay);
        for (const it of vis) {
          let bx = it.ax + 13, by = it.ay - 13;
          for (const [dx, dy] of offs) {
            const x = clamp(it.ax + dx, 12, w - 12), y = clamp(it.ay + dy, 12, h - 54);
            if (!placed.some(p => Math.abs(p[0] - x) < D2 && Math.abs(p[1] - y) < D2) && !vis.some(o => o !== it && Math.hypot(o.ax - x, o.ay - y) < 8)) { bx = x; by = y; break; }
          }
          placed.push([bx, by]);
          put(it, bx - 11, by - 11, `${it.ax.toFixed(1)},${it.ay.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`);
        }
        return;
      }
      let L = vis.filter(it => it.ax < w / 2), R = vis.filter(it => it.ax >= w / 2);
      while (L.length > R.length + 2) { L.sort((a, b) => a.ax - b.ax); R.push(L.pop()); }
      while (R.length > L.length + 2) { R.sort((a, b) => b.ax - a.ax); L.push(R.pop()); }
      const top = banner.hidden ? 10 : 58, bot = h - 52, gap = 6, M = 10;
      for (const [arr, left] of [[L, true], [R, false]]) {
        arr.sort((a, b) => a.ay - b.ay); const n = arr.length, ys = arr.map(it => it.ay);
        for (let i = 0; i < n; i++) ys[i] = Math.max(ys[i], top + arr[i].ht / 2, i ? ys[i - 1] + (arr[i - 1].ht + arr[i].ht) / 2 + gap : -1e9);
        for (let i = n - 1; i >= 0; i--) ys[i] = Math.min(ys[i], bot - arr[i].ht / 2, i < n - 1 ? ys[i + 1] - (arr[i + 1].ht + arr[i].ht) / 2 - gap : 1e9);
        for (let i = 0; i < n; i++) ys[i] = Math.max(ys[i], top + arr[i].ht / 2, i ? ys[i - 1] + (arr[i - 1].ht + arr[i].ht) / 2 + gap : -1e9);
        const mw = Math.max(0, ...arr.map(it => it.wd)), x0 = left ? M + mw + 12 : w - M - mw - 12;
        for (let pass = 0; pass < 4 * n; pass++) {
          let sw = false;
          for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) if (segX(x0, ys[i], arr[i].ax, arr[i].ay, x0, ys[j], arr[j].ax, arr[j].ay)) { const t = arr[i]; arr[i] = arr[j]; arr[j] = t; sw = true; }
          if (!sw) break;
        }
        arr.forEach((it, i) => {
          const y = ys[i], x = left ? M : w - M - it.wd, ex = left ? M + it.wd : w - M - it.wd;
          put(it, x, y - it.ht / 2, `${ex.toFixed(1)},${y.toFixed(1)} ${x0.toFixed(1)},${y.toFixed(1)} ${it.ax.toFixed(1)},${it.ay.toFixed(1)}`);
        });
      }
    }
    function layoutCota() {
      if (S.view !== "dim" || !m) { cotaEl.hidden = true; return; }
      const d = DIMS.find(x => x.k === S.dimSel), c = m.cotaList.find(x => x.key === S.dimSel);
      let p = null;
      if (c) p = c.mid.clone(); else if (S.dimSel === "flotacion") { const H = m.hulls[m.hulls.length - 1]; p = H.surf(0.62, 1, 0, 0.05); }
      else if (S.dimSel === "obraviva") { const H = m.hulls[m.hulls.length - 1]; p = H.surf(0.5, 1, -0.22); }
      else if (S.dimSel === "obramuerta") { const H = m.hulls[m.hulls.length - 1]; p = H.surf(0.5, 1, 0.45); }
      if (!p) { cotaEl.hidden = true; return; }
      vtmp.copy(p).applyMatrix4(m.root.matrixWorld).project(camera);
      if (vtmp.z > 1) { cotaEl.hidden = true; return; }
      cotaEl.hidden = false; cotaEl.textContent = c ? `${d.n} · ${fmt(c.value)} m` : d.n;
      const w = stage.clientWidth, h = stage.clientHeight, ew = cotaEl.offsetWidth, eh = cotaEl.offsetHeight;
      const x = clamp((vtmp.x * 0.5 + 0.5) * w - ew / 2, 6, w - ew - 6), y = clamp((-vtmp.y * 0.5 + 0.5) * h - eh / 2 - (c ? 16 : 0), 6, h - eh - 52);
      cotaEl.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    }
    let cotaAnim = null;
    function startCota() {
      if (!m) return; const c = m.cotaList.find(x => x.key === S.dimSel); if (!c) { cotaAnim = null; return; }
      if (reduce) { c.main.scale.y = 1; c.cones.forEach(x => (x.visible = true)); cotaAnim = null; return; }
      c.main.scale.y = 0.001; c.cones.forEach(x => (x.visible = false)); cotaAnim = { t0: performance.now(), c };
    }

    /* Selección */
    function select(k, focus) {
      S.sel = k; applyLook(); syncMarks();
      if (k && focus) focusKey(k);
      if (k) markSeen(k);
      renderPanel();
    }
    const fkey = () => (curSys().struct ? "est" : "ext");
    function markSeen(k) { const f = (found[S.model] ||= {}); const arr = (f["seen_" + fkey()] ||= []); if (!arr.includes(k)) { arr.push(k); save(); } }
    const foundArr = () => ((found[S.model] ||= {})[fkey()] ||= []);

    /* Picking */
    const ray = new THREE.Raycaster();
    function pickAt(cx, cy) {
      if (!m || S.view !== "pz") return null;
      const r = canvas.getBoundingClientRect(), nd = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(nd, camera); ray.far = 1000;
      const s = curSys(), keys = new Set(pieces(s)), hullOK = s.hullKey && keys.has(s.hullKey), objs = [];
      for (const L of m.looks) {
        if (!isVis(L.o)) continue;
        if (L.k && keys.has(L.k)) { objs.push(L.o); if (L.o.userData.px) objs.push(L.o.userData.px); }
        else if (L.hull && hullOK) objs.push(L.o);
      }
      const hits = ray.intersectObjects(objs, false);
      if (s.struct) { const h = hits.find(x => x.object.userData.k && keys.has(x.object.userData.k) && !x.object.userData.hull); if (h) return h.object.userData.k; if (hits.length && hullOK) return s.hullKey; }
      else for (const h of hits) { const k = h.object.userData.k; if (k && keys.has(k)) return k; if (h.object.userData.hull && hullOK) return s.hullKey; }
      // tolerancia en pantalla: punto de anclaje más cercano
      const px = cx - r.left, py = cy - r.top; let best = null, bd = 22;
      m.root.updateMatrixWorld();
      for (const k of keys) { const h = anchorOf(s, k); if (!h) continue; vtmp.copy(worldOf(h)).project(camera); if (vtmp.z > 1) continue; const d = Math.hypot((vtmp.x * 0.5 + 0.5) * r.width - px, (-vtmp.y * 0.5 + 0.5) * r.height - py); if (d < bd) { bd = d; best = k; } }
      return best;
    }
    let down = null;
    canvas.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; });
    canvas.addEventListener("pointerup", e => {
      if (!down || down.id !== e.pointerId) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
      if (d < 8 && dt < 650) onTap(pickAt(e.clientX, e.clientY));
    });
    let hovReq = 0, hovEv = null;
    canvas.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse" || e.buttons) return; hovEv = e;
      if (!hovReq) hovReq = requestAnimationFrame(() => { hovReq = 0; const k = S.mode === "exp" ? pickAt(hovEv.clientX, hovEv.clientY) : null; canvas.classList.toggle("pick", !!(S.mode !== "exp" ? pickAt(hovEv.clientX, hovEv.clientY) : k)); if (k !== S.hov) { S.hov = k; syncMarks(); } });
    });
    canvas.addEventListener("pointerleave", () => { if (S.hov) { S.hov = null; syncMarks(); } });
    function onTap(k) {
      if (S.view !== "pz") return;
      if (S.mode === "tap") { if (k) answer(k); return; }
      if (S.mode === "what") return;
      if (!k) { if (S.sel) select(null); return; }
      select(k, true);
    }

    /* Retos */
    const quiz = { on: false, target: null, opts: [], tries: 0, ok: 0, bad: 0, streak: 0, lock: false, last: null, revealed: false, fb: "", picked: [] };
    let qTimer = 0, badTimer = 0;
    const qPool = () => (S.view === "dir" ? DIRK.slice() : pieces(curSys()));
    const qName = k => (S.view === "dir" ? DIRNAME[k] : sn(k));
    const qDef = k => (S.view === "dir" ? D[k][2] : D[k] ? D[k][2] : "");
    const qFound = () => (S.view === "dir" ? dirFound : foundArr());
    function startQuiz() { S.dirSel = null; quiz.on = S.mode !== "exp" && S.view !== "dim"; quiz.ok = quiz.bad = quiz.streak = 0; if (quiz.on) nextQ(); else renderQuiz(); }
    function nextQ() {
      clearTimeout(qTimer); quiz.lock = false; quiz.tries = 0; quiz.revealed = false; quiz.fb = ""; quiz.picked = []; S.bad = null; S.sel = null;
      const pool = qPool(), fs = new Set(qFound());
      const un = pool.filter(k => !fs.has(k) && k !== quiz.last), src = un.length ? un : pool.filter(k => k !== quiz.last);
      quiz.target = (src.length ? src : pool)[Math.floor(Math.random() * (src.length || pool.length))]; quiz.last = quiz.target;
      if (S.mode === "what") {
        let others = pool.filter(k => k !== quiz.target);
        if (others.length < 3) { const extra = S.view === "dir" ? DIRK : extKeys(); others = others.concat(extra.filter(k => k !== quiz.target && !others.includes(k)).sort(() => Math.random() - 0.5)); }
        others = others.sort(() => Math.random() - 0.5).slice(0, 3);
        quiz.opts = [quiz.target, ...others].sort(() => Math.random() - 0.5);
        S.qhl = quiz.target;
      } else S.qhl = null;
      if (S.view === "pz") { applyLook(); syncMarks(); if (S.mode === "what") focusKey(quiz.target, true); else frame(false); }
      else syncDir();
      banner.hidden = false;
      banner.innerHTML = S.mode === "what" ? `<span class="eyebrow">¿Qué pieza es?</span><b>La resaltada</b>` : `<span class="eyebrow">Señala</span><b>${esc(qName(quiz.target))}</b>`;
      if (S.view === "dir") banner.hidden = true;
      renderQuiz(); renderPanel();
    }
    function answer(k) {
      if (!quiz.on || !quiz.target || quiz.lock) return;
      const tk = quiz.target;
      if (k === tk) {
        quiz.ok++; quiz.streak++; quiz.lock = true;
        const arr = qFound(), first = !arr.includes(tk) && !quiz.revealed;
        if (first) { arr.push(tk); save(); ctx.award && ctx.award(8, `Astillero: ${qName(tk)}`); }
        quiz.fb = `<span class="fb-ok">¡Correcto!</span> ${esc(qDef(tk))}`;
        if (S.view === "pz") {
          S.qhl = tk; applyLook(); syncMarks();
          const pool = qPool();
          if (first && pool.every(x => arr.includes(x))) { ctx.award && ctx.award(15, `${m.label}: ${curSys().name} completo`); ctx.toast && ctx.toast(`${curSys().name}: todas las piezas`); }
          const ek = extKeys(), all = !curSys().struct && ek.every(x => arr.includes(x));
          if (first && all) {
            ctx.award && ctx.award(40, `${m.label}: todas las piezas exteriores`); ctx.toast && ctx.toast(`${m.label}: has localizado todas las piezas exteriores`);
            if (!badgeGiven) { badgeGiven = true; store.set("badge", true); ctx.badge && ctx.badge("astillero"); }
          }
        } else { S.dirSel = tk; syncDir(); if (first && DIRK.every(x => dirFound.includes(x))) { ctx.award && ctx.award(30, "Direcciones a bordo: todas"); ctx.toast && ctx.toast("Direcciones: todas acertadas"); } }
        renderQuiz(); renderSysBar(); renderPanel();
        qTimer = setTimeout(nextQ, reduce ? 1500 : 1900);
      } else {
        quiz.bad++; quiz.streak = 0; quiz.tries++; quiz.picked.push(k);
        quiz.fb = `<span class="fb-bad">No.</span> «${esc(qName(k))}»: ${esc(qDef(k))}`;
        if (S.mode === "tap") {
          if (S.view === "pz") { S.bad = k; applyLook(); clearTimeout(badTimer); badTimer = setTimeout(() => { S.bad = null; applyLook(); }, 1300); }
          else { dirEl.querySelectorAll(".dk").forEach(g => g.classList.toggle("bad", g.dataset.k === k)); clearTimeout(badTimer); badTimer = setTimeout(() => dirEl.querySelectorAll(".dk.bad").forEach(g => g.classList.remove("bad")), 1300); }
        }
        if (quiz.tries >= 2) reveal();
        renderQuiz();
      }
    }
    function reveal() {
      quiz.revealed = true; quiz.streak = 0; const tk = quiz.target;
      if (S.view === "pz") { S.qhl = tk; applyLook(); syncMarks(); focusKey(tk, true); } else { S.dirSel = tk; syncDir(); }
      quiz.fb += `<br><b>Solución: ${esc(qName(tk))}</b>${S.mode === "tap" ? " (resaltada)" : ""}. ${esc(qDef(tk))}`;
    }
    function renderQuiz() {
      if (!quiz.on) { qbox.hidden = true; banner.hidden = true; return; }
      qbox.hidden = false;
      const pool = qPool(), fs = new Set(qFound()), n = pool.filter(k => fs.has(k)).length;
      const opts = S.mode === "what" ? `<div class="ma-opts">${quiz.opts.map(k => {
        const cls = quiz.lock && k === quiz.target ? " ok" : quiz.picked.includes(k) ? " bad" : quiz.revealed && k === quiz.target ? " ok" : "";
        return `<button type="button" class="btn${cls}" data-ans="${k}" ${quiz.lock ? "disabled" : ""}>${esc(qName(k))}</button>`; }).join("")}</div>` : "";
      const prompt = S.mode === "what" ? (S.view === "dir" ? "¿Qué dirección o zona está resaltada?" : "¿Qué pieza está resaltada en el modelo?") : `Toca en el ${S.view === "dir" ? "diagrama" : "modelo"}: <b>${esc(qName(quiz.target))}</b>`;
      const trap = quiz.lock || quiz.revealed ? (S.view === "dir" ? DIRTRAP[quiz.target] : TRAP[quiz.target]) : null;
      qbox.innerHTML = `<div class="row between"><p class="eyebrow">${S.mode === "what" ? "¿Qué pieza es?" : "Señálala"} · ${esc(S.view === "dir" ? "Direcciones" : curSys().name)}</p>
          <div class="row" style="gap:.35rem"><span class="chip acc">${n}/${pool.length}</span><span class="chip ok">Racha ${quiz.streak}</span><span class="chip">${quiz.ok} ✓ · ${quiz.bad} ✗</span></div></div>
        <p>${prompt}</p>${opts}
        ${quiz.fb ? `<p class="small">${quiz.fb}</p>` : ""}${trap ? `<p class="ma-trap"><b>Ojo en el examen:</b> ${esc(trap)}</p>` : ""}
        <div class="row"><button type="button" class="btn sm" data-a="skip">${quiz.lock || quiz.revealed ? "Siguiente" : "Saltar"}</button>${quiz.lock || quiz.revealed ? "" : `<button type="button" class="btn sm" data-a="show">Ver solución</button>`}<button type="button" class="btn sm ghost" data-a="resetq">Reiniciar progreso de ${esc(S.view === "dir" ? "direcciones" : "este sistema")}</button></div>`;
    }

    /* Direcciones 2D */
    function syncDir() {
      const quizOn = quiz.on && S.view === "dir";
      dirEl.querySelector("svg").parentElement.classList.toggle("quiz", quizOn);
      const hk = quizOn ? (S.mode === "what" ? quiz.target : quiz.lock || quiz.revealed ? quiz.target : null) : S.dirSel;
      dirEl.querySelectorAll(".dk").forEach(g => { g.classList.toggle("on", g.dataset.k === hk); g.classList.toggle("rv", quizOn && (quiz.lock || quiz.revealed) && g.dataset.k === quiz.target); });
    }
    dirEl.addEventListener("click", e => {
      const g = e.target.closest(".dk"); if (!g) return; const k = g.dataset.k;
      if (quiz.on) { if (S.mode === "tap") answer(k); return; }
      S.dirSel = S.dirSel === k ? null : k; syncDir(); renderPanel();
    });

    /* Barra de sistemas y panel */
    function renderSysBar() {
      sysBar.hidden = S.view !== "pz"; if (S.view !== "pz") return;
      const f = found[S.model] || {};
      sysBar.innerHTML = sysList().map(s => {
        const ps = pieces(s), fa = new Set(f[s.struct ? "est" : "ext"] || []), n = ps.filter(k => fa.has(k)).length;
        return `<button type="button" data-sys="${s.id}" aria-pressed="${s.id === S.sys}">${esc(s.name)} <span class="ct${n === ps.length ? " done" : ""}">${n}/${ps.length}</span></button>`;
      }).join("");
      const act = sysBar.querySelector('[aria-pressed="true"]');
      if (act && sysBar.scrollWidth > sysBar.clientWidth) { const l = act.offsetLeft - sysBar.offsetLeft, r = l + act.offsetWidth; if (l < sysBar.scrollLeft || r > sysBar.scrollLeft + sysBar.clientWidth) sysBar.scrollLeft = Math.max(0, l - 16); }
    }
    function ficha(name, group, def, trap) {
      return `<div class="tint ma-ficha"><p class="eyebrow">${esc(group)}</p><h3>${esc(name)}</h3><p>${esc(def)}</p>${trap ? `<p class="ma-trap"><b>Ojo en el examen:</b> ${esc(trap)}</p>` : ""}</div>`;
    }
    function renderPanel() {
      if (!m) return;
      if (S.view === "dim") return renderDims();
      if (S.view === "dir") return renderDirPanel();
      const s = curSys(), ps = pieces(s), fa = new Set(foundArr()), quizOn = quiz.on;
      const head = `<p class="eyebrow">${esc(m.label)} · ${esc(s.name)} · ${ps.length} piezas</p>`;
      const expl = s.struct ? `<label class="ma-sl">Despiece (explosión) <input type="range" min="0" max="1" step="0.01" value="${S.explode}" data-a="explode" aria-label="Despiece"></label>` : "";
      const intro = s.struct ? "El forro se vuelve transparente para ver el armazón interior." : s.id === "timon" ? "Vista desde popa y por debajo de la flotación (agua oculta)." : "";
      const sel = S.sel && D[S.sel];
      const card = quizOn ? `<div class="tint"><p class="small">Reto en curso: usa el recuadro bajo el modelo. Las piezas acertadas quedan marcadas con ✓.</p></div>`
        : sel ? ficha(D[S.sel][0], s.name, D[S.sel][2], TRAP[S.sel])
        : `<div class="tint ma-ficha"><p class="eyebrow">Explorar</p><h3>Toca una pieza</h3><p class="small">En el modelo, en su etiqueta o en la lista. Arrastra para girar, pellizca o usa la rueda para acercar. ${esc(intro)} Estribor queda a la derecha mirando a proa.</p></div>`;
      const list = `<ol class="ma-list">${ps.map((k, i) => `<li><button type="button" data-k="${k}" aria-pressed="${S.sel === k}" ${quizOn ? "disabled" : ""}><span class="n">${i + 1}</span><span>${esc(sn(k))}</span>${fa.has(k) ? `<span class="st" title="Acertada en un reto">✓</span>` : ""}</button></li>`).join("")}</ol>`;
      side.innerHTML = `${head}${card}${expl}${list}`;
    }
    function renderDirPanel() {
      const k = S.dirSel, fa = new Set(dirFound);
      const card = quiz.on ? `<div class="tint"><p class="small">Reto en curso: usa el recuadro bajo el diagrama.</p></div>`
        : k ? ficha(DIRNAME[k], "Direcciones y zonas", D[k][2], DIRTRAP[k])
        : `<div class="tint ma-ficha"><p class="eyebrow">Direcciones</p><h3>Vista cenital, proa arriba</h3><p class="small">Observador a bordo mirando a proa: estribor a la derecha (luz verde), babor a la izquierda (luz roja). Toca una zona, una flecha o un nombre.</p></div>`;
      side.innerHTML = `<p class="eyebrow">Direcciones y zonas · ${DIRK.length}</p>${card}
        <ol class="ma-list">${DIRK.map((x, i) => `<li><button type="button" data-dk="${x}" aria-pressed="${!quiz.on && k === x}" ${quiz.on ? "disabled" : ""}><span class="n">${i + 1}</span><span>${esc(DIRNAME[x])}</span>${fa.has(x) ? `<span class="st">✓</span>` : ""}</button></li>`).join("")}</ol>`;
    }
    function dimVals() {
      const d = m.dims, th = S.trim * Math.PI / 180;
      const cpopa = d.calado + (d.lwl / 2) * Math.tan(th), cproa = d.calado - (d.lwl / 2) * Math.tan(th), as = cpopa - cproa;
      const estado = Math.abs(as) < 0.005 ? "Sin asiento: en aguas iguales." : as > 0 ? "Asiento positivo: <b>apopado</b> (cala más de popa)." : "Asiento negativo: <b>aproado</b> (cala más de proa).";
      const he = S.heel === 0 ? "Adrizado (sin escora)." : `Escora de ${Math.abs(S.heel)}° a <b>${S.heel > 0 ? "estribor" : "babor"}</b>.`;
      return { proa: fmt(cproa) + " m", popa: fmt(cpopa) + " m", medio: fmt((cproa + cpopa) / 2) + " m", as: (as >= 0 ? "+" : "") + fmt(as) + " m", estado, he };
    }
    function updateDims() { const v = dimVals(); side.querySelectorAll("[data-r]").forEach(n => { const k = n.dataset.r; if (k === "estado" || k === "he") n.innerHTML = v[k]; else n.textContent = v[k]; }); }
    function renderDims() {
      const v = dimVals(), d = DIMS.find(x => x.k === S.dimSel) || DIMS[0], val = k => { const c = m.cotaList.find(x => x.key === k); return c ? fmt(c.value) + " m" : ""; };
      side.innerHTML = `<p class="eyebrow">${esc(m.label)} · dimensiones y zonas</p>
        ${ficha(d.n + (val(d.k) ? " · " + val(d.k) : ""), "Dimensiones", d.d, d.t)}
        <ol class="ma-list">${DIMS.map((x, i) => `<li><button type="button" data-dim="${x.k}" aria-pressed="${x.k === S.dimSel}"><span class="n">${i + 1}</span><span>${esc(x.n)}</span><span class="val">${val(x.k)}</span></button></li>`).join("")}</ol>
        <div class="tint stack" style="gap:.5rem"><h4>Asiento</h4>
          <label class="ma-sl">Inclinación longitudinal (proa arriba ⇢ apopado) <input type="range" min="-3" max="3" step="0.25" value="${S.trim}" data-a="trim" aria-label="Asiento en grados"></label>
          <div class="ma-read"><span>Calado de proa</span><b data-r="proa">${v.proa}</b><span>Calado de popa</span><b data-r="popa">${v.popa}</b><span>Calado medio</span><b data-r="medio">${v.medio}</b><span>Asiento (popa − proa)</span><b data-r="as">${v.as}</b></div>
          <p class="small"><span data-r="estado">${v.estado}</span> Calado medio = (calado de proa + calado de popa) / 2.</p></div>
        <div class="tint stack" style="gap:.5rem"><h4>Escora</h4>
          <label class="ma-sl">Inclinación transversal <input type="range" min="-30" max="30" step="1" value="${S.heel}" data-a="heel" aria-label="Escora en grados"></label>
          <p class="small"><span data-r="he">${v.he}</span> La escora es la inclinación hacia un costado por el viento, el oleaje o porque el centro de gravedad no está en el plano de crujía; el barco gira sobre un eje longitudinal. <b>Adrizar</b> es volver a la vertical.</p></div>`;
    }
    function applyAttitude() { if (!m) return; if (S.view === "dim") m.root.rotation.set(S.heel * Math.PI / 180, 0, S.trim * Math.PI / 180, "ZXY"); else m.root.rotation.set(0, 0, 0); dirty = true; }
    function syncSeg() {
      root.querySelectorAll(".seg").forEach(g => { const key = g.dataset.g; g.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(S[key] === b.dataset.v))); });
      root.querySelectorAll('[data-g="mode"] button').forEach(b => (b.disabled = S.view === "dim"));
      const lb = $('[data-a="labels"]'); lb.setAttribute("aria-pressed", String(S.labels)); lb.hidden = S.view !== "pz" || S.mode !== "exp";
      $('[data-a="water"]').hidden = S.view === "dir"; $('[data-a="reset"]').hidden = S.view === "dir";
    }

    /* Cambio de vista / sistema */
    function enterView(instant) {
      clearTimeout(qTimer); clearTimeout(badTimer);
      S.sel = null; S.qhl = null; S.bad = null; S.hov = null; S.waterOv = null;
      if (S.view === "dim") S.mode = "exp";
      if (!curSys().struct) S.explode = 0;
      for (const p of m.parts) p.obj.position.copy(p.base).addScaledVector(p.ex, curSys().struct && S.view === "pz" ? S.explode : 0);
      canvas.style.visibility = S.view === "dir" ? "hidden" : ""; dirEl.hidden = S.view !== "dir"; stage.classList.toggle("dirm", S.view === "dir");
      applyAttitude(); applyLook(); setWater(); syncSeg(); renderSysBar(); buildCallouts();
      quiz.on = false; banner.hidden = true; frame(instant);
      if (S.mode !== "exp" && S.view !== "dim") startQuiz(); else renderQuiz();
      if (S.view === "dim") startCota();
      if (S.view === "dir") syncDir();
      renderPanel(); saveState(); dirty = true;
    }
    function setExplode(v) {
      S.explode = v; for (const p of m.parts) p.obj.position.copy(p.base).addScaledVector(p.ex, v);
      applyLook();
    }

    root.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      const g = b.parentElement && b.parentElement.dataset.g;
      if (g) {
        const v = b.dataset.v; if (S[g] === v) return; S[g] = v;
        if (g === "model") loadModel(v); else enterView(false);
        return;
      }
      if (b.dataset.sys) { if (S.sys !== b.dataset.sys) { S.sys = b.dataset.sys; enterView(false); } return; }
      if (b.dataset.ans) { answer(b.dataset.ans); return; }
      if (b.dataset.k) { if (b.classList.contains("ma-lb") && quiz.on) return; select(b.dataset.k, true); return; }
      if (b.dataset.dk) { S.dirSel = b.dataset.dk; syncDir(); renderPanel(); return; }
      if (b.dataset.dim) { S.dimSel = b.dataset.dim; applyLook(); setWater(); startCota(); renderPanel(); frame(false); return; }
      const a = b.dataset.a;
      if (a === "water") { const i = WATER.findIndex(x => Math.abs(x[1] - waterLevel()) < 0.02); S.waterOv = (Math.max(0, i) + 1) % WATER.length; setWater(); }
      else if (a === "labels") { S.labels = !S.labels; buildCallouts(); syncSeg(); dirty = true; }
      else if (a === "reset") { if (S.view === "pz" && S.sel && S.mode === "exp") { S.sel = null; applyLook(); syncMarks(); renderPanel(); } frame(false); }
      else if (a === "skip") nextQ();
      else if (a === "show") { reveal(); renderQuiz(); }
      else if (a === "resetq") {
        if (S.view === "dir") dirFound.length = 0; else { const arr = foundArr(), ps = new Set(pieces(curSys())); const keep = arr.filter(k => !ps.has(k)); arr.length = 0; arr.push(...keep); }
        save(); renderSysBar(); quiz.ok = quiz.bad = quiz.streak = 0; nextQ();
      }
    });
    root.addEventListener("pointerover", e => { const b = e.target.closest && e.target.closest(".ma-lb,.ma-list button[data-k]"); const k = b ? b.dataset.k : null; if (k !== S.hov && (k || e.target.closest(".ma-co,.ma-side"))) { S.hov = k; syncMarks(); } });
    root.addEventListener("input", e => {
      const a = e.target.dataset && e.target.dataset.a; const v = parseFloat(e.target.value);
      if (a === "explode") setExplode(v);
      else if (a === "trim" || a === "heel") { S[a] = v; applyAttitude(); updateDims(); }
    });

    /* Bucle */
    let raf = 0, running = false, visible = true, docVis = !document.hidden;
    const camPrev = new THREE.Matrix4();
    function loop(now) {
      if (!running) return; raf = requestAnimationFrame(loop);
      if (S.view === "dir" || !m) return;
      if (tw) { const t = clamp((now - tw.t0) / tw.d, 0, 1), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; controls.target.lerpVectors(tw.ft, tw.tt, e); camera.position.lerpVectors(tw.fp, tw.tp, e); if (t >= 1) tw = null; dirty = true; }
      controls.update();
      if (!reduce) { const s = now / 1000; waterMat.uniforms.uT.value = s; U.uT.value = s; if (water.visible || U.uHl.value.w) dirty = true; }
      if (cotaAnim) { const k = clamp((now - cotaAnim.t0) / 700, 0, 1); cotaAnim.c.main.scale.y = Math.max(0.001, 1 - Math.pow(1 - k, 3)); cotaAnim.c.cones.forEach(x => (x.visible = k > 0.9)); if (k >= 1) cotaAnim = null; dirty = true; }
      if (!camera.matrixWorld.equals(camPrev)) { camPrev.copy(camera.matrixWorld); dirty = true; }
      if (dirty) { dirty = false; renderer.render(scene, camera); layoutCallouts(); layoutCota(); }
    }
    function sync() { const want = visible && docVis; if (want && !running) { running = true; dirty = true; raf = requestAnimationFrame(loop); } else if (!want && running) { running = false; cancelAnimationFrame(raf); } }
    const io = new IntersectionObserver(es => { visible = es.some(x => x.isIntersecting); sync(); }, { threshold: 0.01 }); io.observe(stage);
    const onVis = () => { docVis = !document.hidden; sync(); }; document.addEventListener("visibilitychange", onVis);
    let lastW = -1;
    const ro = new ResizeObserver(() => {
      const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
      if (m && Math.abs(w - lastW) > 40) { const crossed = lastW < 0 || (lastW < 600) !== (w < 600); lastW = w; if (crossed) buildCallouts(); else if (coOn() && w >= 600) colW = Math.min(w * 0.26, Math.max(0, ...co.map(it => it.wd)) + 26); if (!tw) frame(true); }
    });
    ro.observe(stage);
    controls.addEventListener("change", () => { dirty = true; });

    loadModel(S.model);
    sync();

    return () => {
      running = false; cancelAnimationFrame(raf); cancelAnimationFrame(hovReq); clearTimeout(qTimer); clearTimeout(badTimer);
      io.disconnect(); ro.disconnect(); document.removeEventListener("visibilitychange", onVis); offTheme && offTheme();
      controls.dispose();
      if (m) { disposeObj(m.root); Object.values(m.M).forEach(x => x.dispose && x.dispose()); }
      water.geometry.dispose(); waterMat.dispose(); SHARED.forEach(x => x.dispose());
      envRT.dispose(); pmrem.dispose(); scene.environment = null;
      renderer.dispose(); try { renderer.forceContextLoss(); } catch {}
      root.remove();
    };
  }
};
