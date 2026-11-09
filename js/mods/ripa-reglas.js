// ripa-reglas — «Las 41 reglas»: navegador del RIPA (Reglas 1–41 y Anexos I–IV), buscador, frecuencia en exámenes y flashcards

const ID = "ripa-reglas";
// Preguntas oficiales 2022–2026 (bloque RIPA) que citan cada regla en su enunciado: [nº preguntas, apariciones en exámenes, ids]
const COUNTS = {"1":[2,4,["1be4764aef","f7a310f347"]],"18":[14,28,["efd28fd528","16c6d9089a","fb1cdfbaa0","312d4b6c7b","f8ca806baf","e87b985a7b","7ca76b15e7","8ea09c247a","bdd5b54a30","2c35c03355","7004126a0d","f6cb325193","e27c6d8d1b","f7d2d65a04"]],"5":[3,6,["8d8150cc46","caec9b1100","964924667f"]],"28":[6,12,["64574f386c","40f5a6bb0c","12683983d3","1ab098f33c","cd3598238f","b3e3dcb18b"]],"20":[7,14,["a175273526","2df6131957","d08082ebc5","e38f4dd66f","784db92740","1348c550a1","50d910c2af"]],"14":[5,10,["ee8ea2507c","1c986ce296","6b98ecf2e6","6a2b023bf5","68d7c40b38"]],"9":[13,26,["e2744dbd53","a845779a28","f8ca806baf","fbb587cc8e","de04b878af","e87b985a7b","db2ca49514","3fb7d1e376","1724a8e4be","d9f646a0a2","2ea3c19974","d04bec7bde","244684b02f"]],"21":[15,30,["bf88546079","203cb7221f","efae78eec8","5be0fa4aaf","3984c69f39","3c0e88755e","732d9c69e9","d9858c928c","496f2f93dd","6ce87965b7","ff29ebf549","cd216fcfed","ce540c7297","4175643834","6da975c3ee"]],"34":[12,24,["96ad94004a","5aa832cf85","b7046bfaed","01e2429c82","daeaac720e","c9c45ad8a2","22687ecc41","1724a8e4be","f8d81100d4","0c382a3eda","bb4c5ae1d3","e2e010bac2"]],"15":[7,14,["11716d411a","ef5ba01ed0","f515c7e26c","362fcd48ba","36a3bf3ad0","503de7d97a","1a4b97d479"]],"26":[6,12,["5c7a42ac6d","d7e23ef7ca","11d24f99ca","9aebb3ab72","7ae2d8b783","dda63e0fa2"]],"13":[8,16,["92c7c95d4f","32d6a88b1e","f8ca806baf","e87b985a7b","6a4978289c","e2a90e8c2d","4919da16aa","1a632d3a37"]],"2":[5,10,["8910a7b15b","a94e62aa27","0edbfbdd61","ec47c6f1b7","18bb1c595e"]],"10":[14,28,["f99820bb73","4d7533a35e","00ab23c82b","f8ca806baf","9181775bd2","e87b985a7b","aade3287d7","2e00a51eb6","4eeb35ca93","135bcda407","9eac26b733","3b1cd47ac5","6db32bb996","15178cc41f"]],"23":[16,32,["24f34755cd","7d324564b6","324f9de68a","40f5a6bb0c","5f4b38ee7e","a71051dc3b","c61ddf75f0","f63199a338","185a0c8023","e727555691","a9dcb29538","d4495da690","c4eeb978a7","4df5461b78","d9676f4330","88c2753864"]],"35":[10,20,["0a24024bcf","4d1b88800b","c80eba7b6a","ed1f6b650e","f8f066ca72","59eb528101","8ce5d47899","88f55e61d5","2a989af47c","e05df4c10a"]],"33":[6,12,["cc2c4ae4d6","7616e55fe4","ee9243c8ed","f00cf8f1b9","bacce03e06","40f4e77b60"]],"6":[10,18,["d78819c330","6c188a813a","c18a5ba3f7","95fb315fb2","14e7f6ace1","987fc78e66","f609370ebc","90a82616aa","38a30f85e4","71c997c2a0"]],"25":[9,18,["4aadc71572","9a247b3cca","6d773cdcfe","6000c5aa16","09653d786f","38e1c1d96a","2a96620b13","2435a995c3","b07270699f"]],"3":[17,34,["8537024c3a","f7a310f347","e3ef790b17","007963546e","04e9904ed3","995d014524","14b95124cc","e29a3a598c","7c21f66ca6","4330725adc","8c724af50e","84be110dbe","07c67b90d4","7e4abdb820","c7f639dbe9","e597eb59ab","77c246de74"]],"7":[6,12,["c55b69068e","227d31321b","aff4e141f5","f561c30e8f","aa129a39de","155c4ca263"]],"12":[8,16,["cb13b67fa2","e0957361d4","067ec514ad","cce88156b4","14ad168573","57fbb9d8fb","cf7f337f99","3f1e3186ac"]],"17":[8,16,["b81f90858d","05acfebd69","d6006549e0","e7f7af4332","148de60f22","74bc218369","57fbb9d8fb","9dcdcaaf73"]],"16":[5,10,["e888e1ec3b","34768554f2","362fcd48ba","f978496e8c","6aed3ccab1"]],"32":[4,8,["8d8f09b9e3","d94097e6fc","bb4c5ae1d3","e05df4c10a"]],"8":[7,14,["2cb233213e","30205f8051","b77e3a429e","5aaa97073c","5458e55681","931c134e0b","0929304797"]],"36":[4,8,["d7bd57e54f","e325c0b16e","54f46186d8","dc8f6538a5"]],"AIV":[9,18,["ddf9bdd9a8","a5a10bbd06","def47573bb","84d74f4050","658db2658b","212139aad3","3438bb7c51","cfd9d6ec99","0284a415e8"]],"19":[7,14,["0d96dac6ec","4882a3de72","1b5e4c6cd9","335b7f382d","9a01a7fb8c","23e17cdffd","5f5a1dd616"]],"4":[1,2,["30205f8051"]],"30":[7,14,["5f4b38ee7e","afe262616c","3e1069c071","bc9e3ae1eb","ebfb2821a8","64c4a9706d","73a325d748"]],"24":[9,18,["41e9723b1d","e567d2f8b3","f5d40bff7a","73439041b6","1f86f86155","1d8c11ddfb","40b81d7aa7","21840cac28","76f1808638"]],"31":[3,6,["2697a6febb","a9dcb29538","88c2753864"]],"29":[3,6,["70cf97678a","119a590264","828d464f3c"]],"27":[2,4,["c4eeb978a7","6eb27525c3"]],"37":[1,2,["7cfe673c7c"]]};

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
const fold = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const PARTS = {
  A: "Parte A · Generalidades", BI: "Parte B · Sección I: cualquier condición de visibilidad", BII: "Parte B · Sección II: buques a la vista uno del otro",
  BIII: "Parte B · Sección III: visibilidad reducida", C: "Parte C · Luces y marcas", D: "Parte D · Señales acústicas y luminosas", E: "Parte E · Exenciones",
  F: "Parte F · Verificación del cumplimiento", X: "Anexos",
};
// k: clave; p: parte; t: título; s: resumen (HTML); f: tarjetas [pregunta, respuesta]
const R = [
  { k: "1", p: "A", t: "Ámbito de aplicación", s: `<p>a) Se aplica a <b>todos los buques en alta mar y en todas las aguas que tengan comunicación con ella y sean navegables</b> por los buques de navegación marítima. b) No impide reglas especiales de la autoridad competente para radas, puertos, ríos, lagos o aguas interiores comunicadas con el mar, que deben ajustarse lo más posible al Reglamento. c) Tampoco impide luces o señales adicionales para buques de guerra, convoyes o flotas de pesca. d) La OMI puede adoptar <b>dispositivos de separación del tráfico</b>. e) Buques de construcción especial: lo más parecido posible.</p>`,
    f: [["¿Dónde se aplica el RIPA?", "En alta mar y en todas las aguas comunicadas con ella navegables por buques de navegación marítima (no en pantanos y embalses)."]] },
  { k: "2", p: "A", t: "Responsabilidad", s: `<p>a) <b>Ninguna disposición eximirá</b> a un buque, a su propietario, capitán o dotación de las consecuencias de cualquier <b>negligencia</b> en el cumplimiento del Reglamento o de las precauciones que exija la práctica marinera. b) Se tendrán en cuenta los peligros de la navegación y las circunstancias especiales (incluidas las limitaciones de los buques) que puedan hacer necesario <b>apartarse del Reglamento para evitar un peligro inmediato</b>.</p>`,
    f: [["¿Se puede apartar uno del RIPA?", "Sí, para evitar un peligro inmediato, considerando peligros de la navegación y circunstancias especiales (R2 b)."], ["¿Se tiene en cuenta el pabellón del buque?", "No: no se toma en consideración el Estado de pabellón."]] },
  { k: "3", p: "A", t: "Definiciones generales", s: `<ul>
<li><b>Buque</b>: toda embarcación, incluidas las sin desplazamiento, las naves WIG y los hidroaviones, utilizada o que pueda utilizarse como medio de transporte sobre el agua.</li>
<li><b>Buque de propulsión mecánica</b>: todo buque movido por una máquina. <b>Buque de vela</b>: navegando a vela siempre que su maquinaria propulsora, si la lleva, <b>no se esté utilizando</b>.</li>
<li><b>Dedicado a la pesca</b>: pescando con redes, líneas, aparejos de arrastre u otros artes que <b>restrinjan su maniobrabilidad</b>; no incluye curricán ni artes que no la restrinjan.</li>
<li><b>Sin gobierno</b>: por <b>circunstancia excepcional</b> es incapaz de maniobrar según el Reglamento y no puede apartarse.</li>
<li><b>Capacidad de maniobra restringida</b>: por la <b>naturaleza de su trabajo</b>: i) balizas, cables o conductos submarinos; ii) dragado, hidrografía, oceanografía u obras submarinas; iii) <b>aprovisionamiento o trasbordo</b> de personas, provisiones o carga navegando; iv) <b>lanzamiento o recuperación de aeronaves</b>; v) limpieza de minas; vi) remolque que restrinja mucho apartarse de su rumbo.</li>
<li><b>Restringido por su calado</b>: buque de propulsión mecánica que, por su calado en relación con la profundidad y anchura disponibles, tiene muy restringida la capacidad de apartarse de su rumbo.</li>
<li><b>En navegación</b>: no está fondeado, ni amarrado a tierra, ni varado. <b>Eslora y manga</b>: eslora total y manga máxima.</li>
<li><b>A la vista uno del otro</b>: únicamente cuando uno pueda ser observado visualmente desde el otro. <b>Visibilidad reducida</b>: por niebla, bruma, nieve, chubascos, tormentas de arena, etc.</li>
<li><b>Nave de vuelo rasante (WIG)</b>: nave multimodal que, en su modo principal, vuela muy cerca de la superficie aprovechando el efecto superficie.</li></ul>`,
    f: [["¿Un velero con el motor en marcha es «buque de vela»?", "No: es buque de propulsión mecánica (R3 c)."], ["¿Pescar al curricán es «dedicado a la pesca»?", "No: el arte no restringe su maniobrabilidad (R3 d)."], ["Cite 3 buques con capacidad de maniobra restringida.", "Tendiendo cables/balizas, dragando, aprovisionando navegando, lanzando aeronaves, limpiando minas, remolque que restringe mucho."], ["Diferencia sin gobierno / maniobra restringida", "Sin gobierno: circunstancia excepcional (avería). Maniobra restringida: naturaleza de su trabajo."], ["«En navegación» significa…", "No fondeado, ni amarrado a tierra, ni varado (aunque esté parado)."]] },
  { k: "4", p: "BI", t: "Ámbito de aplicación", s: `<p>Las reglas de la Sección I (R4–R10) se aplican <b>en cualquier condición de visibilidad</b>.</p>`, f: [["¿En qué visibilidad se aplica la R8?", "En cualquier condición de visibilidad (Sección I)."]] },
  { k: "5", p: "BI", t: "Vigilancia", s: `<p>Todos los buques mantendrán <b>en todo momento</b> una eficaz <b>vigilancia visual y auditiva</b>, utilizando además todos los medios disponibles apropiados (radar, AIS…), para evaluar plenamente la situación y el riesgo de abordaje. También navegando en solitario.</p>`, f: [["¿Qué vigilancia exige R5?", "Visual y auditiva, en todo momento y en cualquier visibilidad, más todos los medios disponibles."]] },
  { k: "6", p: "BI", t: "Velocidad de seguridad", s: `<p>Velocidad que permita ejecutar la <b>maniobra adecuada y eficaz para evitar el abordaje</b> y <b>pararse a la distancia adecuada</b>. Factores: a) todos los buques: i) <b>visibilidad</b>; ii) <b>densidad de tráfico</b>, incluidas concentraciones de pesqueros; iii) <b>maniobrabilidad</b> (distancia de parada y giro); iv) de noche, <b>luz de fondo</b> (luces de tierra o reflejo de las propias); v) viento, mar, corrientes y proximidad de peligros; vi) <b>calado en relación con la profundidad</b> disponible. b) con radar: i) características, eficacia y limitaciones del radar; ii) restricciones de la <b>escala</b>; iii) efecto de mar, meteorología e interferencias; iv) posibilidad de <b>no detectar buques pequeños, hielos u objetos flotantes</b>; v) número, situación y movimiento de los ecos; vi) evaluación más exacta de la visibilidad.</p><p class="small">No son factores: la hora de llegada, la pericia del patrón, la carta electrónica.</p>`,
    f: [["¿Es factor de velocidad de seguridad la hora de llegada?", "No."], ["Factor del radar en R6", "Características y limitaciones, escala en uso, mar e interferencias, no detectar buques pequeños o hielos…"], ["¿El calado influye en la velocidad de seguridad?", "Sí: calado en relación con la profundidad disponible (R6 a vi)."]] },
  { k: "7", p: "BI", t: "Riesgo de abordaje", s: `<p>a) Se usarán todos los medios disponibles; <b>si hay duda, se considerará que existe riesgo</b>. b) Con radar: exploración a gran distancia y punteo. c) Se evitarán <b>suposiciones basadas en información insuficiente</b>, especialmente de radar. d) Se considera que existe riesgo si la <b>demora (de aguja) de un buque que se aproxima no varía de forma apreciable</b>; puede existir aun con variación apreciable, sobre todo con buques muy grandes, remolques o a muy corta distancia.</p>`,
    f: [["Demora constante y distancia decreciente…", "Riesgo de abordaje (R7 d i)."], ["¿Si la demora cambia, no hay riesgo?", "Puede haberlo: buques muy grandes, remolques o corta distancia."]] },
  { k: "8", p: "BI", t: "Maniobras para evitar el abordaje", s: `<p>a) Conforme a la Parte B, de forma <b>clara, con la debida antelación</b> y según las buenas prácticas marineras. b) Cambios de rumbo y/o velocidad <b>lo bastante amplios</b> para ser fácilmente percibidos; se evitará una <b>sucesión de pequeños cambios</b>. c) Si hay espacio, el <b>cambio de rumbo solo</b> puede ser lo más eficaz si se hace con antelación, es considerable y no produce otra aproximación excesiva. d) Pasar a <b>distancia segura</b>, comprobando la eficacia hasta dejarlo franco. e) Si es necesario, <b>reducir la velocidad o suprimir la arrancada</b> (parar o dar atrás). f) El buque obligado a no estorbar maniobrará con antelación para dejar espacio, sin quedar eximido si se crea riesgo.</p>`,
    f: [["¿Cambios pequeños y sucesivos?", "No: amplios y fácilmente perceptibles (R8 b)."], ["¿Puede bastar con cambiar solo el rumbo?", "Sí, con espacio suficiente, antelación y si es considerable (R8 c)."]] },
  { k: "9", p: "BI", t: "Canales angostos", s: `<p>a) Navegar lo más cerca posible del <b>límite exterior del canal que quede por su estribor</b>. b) Los <b>&lt; 20 m</b> y los <b>de vela</b> no estorbarán a los que solo puedan navegar con seguridad dentro del canal. c) Los <b>dedicados a la pesca</b> no estorbarán el tránsito de <b>ningún otro</b> buque que navegue dentro. d) No se cruzará si estorba a quien solo puede navegar dentro (el que dude puede usar la señal de R34 d). e) Alcances en canal con señales de R34 c). f) <b>Recodos</b> con visión obstruida: navegar alerta y con precaución, <b>una pitada larga</b> (R34 e). g) <b>Evitar fondear</b> en canales angostos.</p>`,
    f: [["¿Por qué lado del canal?", "Lo más cerca posible del límite exterior que quede por estribor."], ["¿Quién no estorbará a ningún otro buque en el canal?", "El buque dedicado a la pesca (R9 c)."], ["Recodo sin visibilidad", "Una pitada larga y navegar alerta."]] },
  { k: "10", p: "BI", t: "Dispositivos de separación del tráfico", s: `<p>a) Se aplica a los DST adoptados por la OMI. b) Navegar por la <b>vía de circulación</b> en la dirección general del tráfico; mantenerse apartado de la zona de separación; entrar o salir por los extremos y, si se hace por un lateral, <b>con el menor ángulo posible</b>. c) <b>Evitar cruzar</b>; si hay que hacerlo, con un <b>rumbo lo más perpendicular posible</b> a la dirección del tráfico. d) i) No usará la <b>zona de navegación costera</b> quien pueda navegar con seguridad por la vía, salvo <b>&lt; 20 m, vela y pesca</b>; ii) cualquiera puede usarla para ir o venir de un puerto, instalación, estación de prácticos o lugar dentro de ella, o para <b>evitar un peligro inmediato</b>. e) No entrar en la zona de separación salvo emergencia o para pescar en ella. f) Precaución en los extremos. g) Evitar fondear en el DST o cerca de sus extremos. h) Quien no lo use se mantendrá lo más lejos posible. i) Pesqueros no estorbarán a quien sigue la vía. j) <b>&lt; 20 m y vela no estorbarán</b> a los de propulsión mecánica que sigan la vía. k), l) Buques de <b>maniobra restringida</b> en operaciones de seguridad de la navegación o con cables submarinos: exentos en la medida necesaria.</p>`,
    f: [["¿Cómo se cruza un DST?", "Con rumbo lo más perpendicular posible a la dirección general del tráfico."], ["¿Quién puede usar la zona costera?", "< 20 m, vela y pesca; los demás para ir a puerto/lugar en ella o evitar un peligro inmediato."], ["¿Entrar en la vía por un lateral?", "Sí, con el menor ángulo posible."]] },
  { k: "11", p: "BII", t: "Ámbito de aplicación", s: `<p>Las reglas de la Sección II (R11–R18) se aplican a los <b>buques que se encuentren a la vista uno del otro</b>.</p>`, f: [["¿Cuándo rige R15?", "Solo entre buques a la vista uno del otro (Sección II)."]] },
  { k: "12", p: "BII", t: "Buques de vela", s: `<p>a) i) Viento por <b>bandas contrarias</b>: el que lo recibe <b>por babor</b> se mantiene apartado. ii) Por la <b>misma banda</b>: el de <b>barlovento</b> se aparta del de sotavento. iii) Si recibe el viento por babor y ve otro a barlovento sin poder determinar su amura, se aparta. b) <b>Banda de barlovento</b>: la <b>contraria a la que se lleve cazada la vela mayor</b> (en aparejo redondo, la del mayor velamen de cuchillo).</p>`,
    f: [["Veleros con amuras distintas", "Se aparta el que recibe el viento por babor."], ["Veleros con la misma amura", "Se aparta el de barlovento."], ["Banda de barlovento", "La contraria a la que lleva cazada la mayor."]] },
  { k: "13", p: "BII", t: "Buque que alcanza", s: `<p>a) <b>No obstante</b> lo dispuesto en las Secciones I y II, todo buque que alcance a otro <b>se mantendrá apartado</b>. b) Es buque que alcanza el que se aproxima desde una marcación <b>mayor de 22,5° a popa del través</b> del otro: de noche solo vería su <b>luz de alcance</b>. c) En caso de duda, se considerará que alcanza. d) Un cambio posterior de marcación no lo convierte en buque que cruza ni le exime de apartarse hasta dejarlo franco.</p>`,
    f: [["¿Desde qué marcación se alcanza?", "Más de 22,5° a popa del través del alcanzado."], ["Un velero alcanza a una motora: ¿quién se aparta?", "El velero (R13 prevalece sobre R18)."]] },
  { k: "14", p: "BII", t: "Situación «de vuelta encontrada»", s: `<p>a) Dos buques de <b>propulsión mecánica</b> a rumbos opuestos o casi opuestos con riesgo: <b>cada uno cae a estribor</b> para pasar por la banda de babor del otro. b) Existe cuando se ve al otro por la proa o casi: de noche, <b>topes enfilados o casi y/o ambos costados</b>; de día, el aspecto correspondiente. c) Si hay duda, se supone que existe.</p>`,
    f: [["Vuelta encontrada: maniobra", "Ambos caen a estribor y pasan babor con babor."], ["¿Qué luces se ven en vuelta encontrada?", "Topes enfilados y ambos costados."]] },
  { k: "15", p: "BII", t: "Situación «de cruce»", s: `<p>Dos buques de <b>propulsión mecánica</b> que se cruzan con riesgo: el que tiene al otro <b>por su costado de estribor</b> se mantiene apartado y, si las circunstancias lo permiten, <b>evitará cortarle la proa</b>. De noche: si ves tope + <b>luz roja</b>, maniobras tú.</p>`,
    f: [["En un cruce, ¿quién maniobra?", "El que tiene al otro por su estribor; evita cortarle la proa."]] },
  { k: "16", p: "BII", t: "Maniobra del buque que «cede el paso»", s: `<p>Todo buque obligado a apartarse maniobrará, en lo posible, <b>con anticipación suficiente y de forma decidida</b> para quedar bien franco del otro.</p>`, f: [["¿Cómo maniobra el que cede el paso?", "Con anticipación suficiente y de forma decidida."]] },
  { k: "17", p: "BII", t: "Maniobra del buque que «sigue a rumbo»", s: `<p>a) i) Cuando uno debe apartarse, el otro <b>mantiene su rumbo y velocidad</b>. ii) Puede maniobrar por sí solo en cuanto sea evidente que el otro no actúa. b) Si está tan próximo que no puede evitarse el abordaje solo con la maniobra del que cede, <b>ejecutará la maniobra que mejor ayude</b> a evitarlo. c) Un buque de propulsión mecánica que maniobre según a ii) en un cruce <b>no caerá a babor</b> si el otro está por su babor. d) Esta regla <b>no exime</b> al que cede el paso de su obligación.</p>`,
    f: [["¿Qué hace el que sigue a rumbo?", "Mantener rumbo y velocidad; puede actuar si el otro no lo hace."], ["Si el abordaje es inminente…", "El que sigue a rumbo hace la maniobra que mejor ayude (R17 b)."]] },
  { k: "18", p: "BII", t: "Obligaciones entre categorías de buques", s: `<p>Salvo R9, R10 y R13: a) <b>Propulsión mecánica</b> se aparta de: sin gobierno, maniobra restringida, pesca y vela. b) <b>Vela</b> se aparta de: sin gobierno, maniobra restringida y pesca. c) <b>Pesca</b> (en lo posible) se aparta de: sin gobierno y maniobra restringida. d) i) Todos, salvo sin gobierno y maniobra restringida, <b>evitarán estorbar</b> a un <b>restringido por su calado</b>; ii) este navegará con especial precaución. e) <b>Hidroavión amarado</b>: en general se mantendrá bien apartado de todos; si hay riesgo, cumple la Parte B. f) i) <b>WIG</b> despegando, aterrizando o en vuelo cerca de la superficie se mantiene bien apartada de todos; ii) en la superficie, como <b>propulsión mecánica</b>.</p>`,
    f: [["Orden de preferencia R18", "Sin gobierno / maniobra restringida > (calado) > pesca > vela > propulsión mecánica."], ["Motor, vela, pesca e hidroavión amarado: ¿quién sigue a rumbo?", "El buque dedicado a la pesca."], ["WIG en la superficie del agua", "Cumple como buque de propulsión mecánica."]] },
  { k: "19", p: "BIII", t: "Conducta en condiciones de visibilidad reducida", s: `<p>a) Buques que <b>no están a la vista</b> uno del otro navegando en o cerca de una zona de visibilidad reducida. b) Velocidad de seguridad; los de propulsión mecánica tendrán las <b>máquinas listas</b> para maniobrar. c) Considerar las circunstancias al cumplir la Sección I. d) Quien detecte otro <b>solo por radar</b> y haya riesgo maniobrará con antelación; si cambia de rumbo evitará: i) <b>caer a babor</b> por un buque a proa del través (salvo que lo alcance); ii) caer <b>hacia</b> un buque por el través o a popa del través. e) Quien oiga <b>a proa del través</b> la señal de niebla de otro, o no pueda evitar una aproximación excesiva con uno a proa del través, <b>reducirá a la mínima velocidad de gobierno</b> y, si es necesario, suprimirá la arrancada, navegando con extremada precaución.</p>`,
    f: [["Eco a proa del través: ¿qué cambio evitas?", "Caer a babor (salvo que lo alcances)."], ["Eco por el través", "Evitar caer hacia él."], ["Oyes niebla a proa del través", "Reducir a la mínima de gobierno y, si hace falta, suprimir la arrancada."]] },
  { k: "20", p: "C", t: "Ámbito de aplicación", s: `<p>a) La Parte C se cumple <b>en todas las condiciones meteorológicas</b>. b) Luces: <b>de la puesta a la salida del sol</b>, sin exhibir otras que puedan confundirse o deslumbrar. c) También de día con <b>visibilidad reducida</b> o cuando se considere necesario. d) Las <b>marcas, de día</b>. e) Especificaciones del Anexo I.</p>`,
    f: [["¿Las marcas son optativas?", "No: obligatorias de día y en todas las condiciones meteorológicas."], ["¿Luces de día?", "Sí, con visibilidad reducida o cuando sea necesario."]] },
  { k: "21", p: "C", t: "Definiciones", s: `<ul><li><b>Luz de tope</b>: blanca, sobre el eje longitudinal, <b>225°</b>, de proa a 22,5° a popa del través de cada banda.</li><li><b>Luces de costado</b>: verde a estribor y roja a babor, <b>112,5°</b> cada una, de proa a 22,5° a popa del través; en &lt; 20 m pueden combinarse en un farol en el eje.</li><li><b>Luz de alcance</b>: blanca, lo más cerca posible de la popa, <b>135°</b> (67,5° desde la popa a cada banda).</li><li><b>Luz de remolque</b>: amarilla, de las mismas características que la de alcance.</li><li><b>Luz todo horizonte</b>: <b>360°</b>. <b>Luz centelleante</b>: <b>120 o más centelleos por minuto</b>.</li></ul>`,
    f: [["Arcos: tope, costado, alcance", "225°, 112,5° y 135°."], ["Luz centelleante", "120 o más centelleos por minuto."], ["Luz de remolque", "Amarilla, mismas características que la de alcance."]] },
  { k: "22", p: "C", t: "Visibilidad de las luces", s: `<div class="scroll-x"><table><thead><tr><th>Luz</th><th>≥ 50 m</th><th>12–50 m</th><th>&lt; 12 m</th></tr></thead><tbody><tr><td>Tope</td><td>6 M</td><td>5 M (3 M si &lt; 20 m)</td><td>2 M</td></tr><tr><td>Costado</td><td>3 M</td><td>2 M</td><td>1 M</td></tr><tr><td>Alcance / remolque / todo horizonte</td><td>3 M</td><td>2 M</td><td>2 M</td></tr></tbody></table></div><p>Objetos remolcados poco visibles parcialmente sumergidos: blanca todo horizonte 3 M.</p>`,
    f: [["Alcance del tope en ≥ 50 m", "6 millas."], ["Costados en < 12 m", "1 milla."]] },
  { k: "23", p: "C", t: "Buques de propulsión mecánica en navegación", s: `<p>a) <b>Tope a proa</b>; <b>segundo tope</b> a popa y más alto (no obligatorio si <b>&lt; 50 m</b>); costados; alcance. b) <b>Aerodeslizador</b> sin desplazamiento: además <b>amarilla centelleante</b> todo horizonte. c) <b>WIG</b> solo al despegar, aterrizar o volar cerca de la superficie: además <b>roja centelleante</b> todo horizonte de gran intensidad. d) i) <b>&lt; 12 m</b>: puede sustituir por <b>blanca todo horizonte + costados</b>; ii) <b>&lt; 7 m</b> y ≤ 7 nudos: blanca todo horizonte y, si es posible, costados; iii) en &lt; 12 m el tope o la todo horizonte puede ir fuera del eje si los costados van combinados en el eje o lo más cerca posible.</p>`,
    f: [["15 m a motor: luces obligatorias", "Tope a proa, costados y alcance."], ["< 12 m: alternativa", "Blanca todo horizonte + costados."], ["Amarilla centelleante", "Aerodeslizador sin desplazamiento."]] },
  { k: "24", p: "C", t: "Buques remolcando y empujando", s: `<p>a) Remolcando: <b>dos topes en vertical</b> (en lugar del de proa o del de popa); <b>tres</b> si el remolque supera <b>200 m</b>; costados; alcance; <b>luz de remolque amarilla sobre la de alcance</b>; remolque &gt; 200 m: <b>marca bicónica</b>. b) <b>Unidad compuesta</b> (conexión rígida): como propulsión mecánica. c) Empujando o remolcando abarloado (no compuesta): dos topes en vertical, costados y alcance. d) Si ≥ 50 m, además el tope de popa. e) Remolcado: costados, alcance y, si &gt; 200 m, marca bicónica. f) Empujado: costados en el extremo de proa; remolcado abarloado: alcance y costados a proa. g) Remolcado poco visible parcialmente sumergido: blancas todo horizonte en los extremos; bicónica a popa (y otra a proa si &gt; 200 m). i) Remolque de auxilio ocasional: puede iluminar el cabo.</p>`,
    f: [["Marca bicónica en un remolque", "Longitud del remolque > 200 m."], ["Unidad compuesta", "Conexión rígida; luces de propulsión mecánica."], ["Remolcado por el costado", "Alcance y, a proa, luces de costado."]] },
  { k: "25", p: "C", t: "Buques de vela en navegación y embarcaciones de remo", s: `<p>a) <b>Costados y alcance</b>. b) &lt; 20 m: pueden ir en un <b>farol combinado</b> en el tope. c) Opcional en el tope: <b>roja sobre verde</b> todo horizonte (no con el farol combinado). d) i) Vela <b>&lt; 7 m</b>: si es posible, a) o b); si no, <b>linterna o farol de luz blanca</b> a mano. ii) <b>Remo</b>: luces de vela o linterna blanca. e) Vela que <b>también va a motor</b>: de día <b>cono vértice abajo</b> a proa.</p>`,
    f: [["Roja sobre verde en el tope", "Buque de vela (opcional)."], ["Remo sin luces de vela", "Linterna o farol de luz blanca."], ["Cono vértice abajo", "Velero navegando también a motor."]] },
  { k: "26", p: "C", t: "Buques de pesca", s: `<p>b) <b>Arrastre</b>: <b>verde sobre blanca</b> (o dos conos unidos por los vértices); tope a popa más alto que la verde (obligatorio ≥ 50 m); con arrancada, costados y alcance. c) <b>No arrastre</b>: <b>roja sobre blanca</b> (o dos conos unidos por los vértices); aparejo &gt; <b>150 m</b>: blanca todo horizonte o <b>cono vértice arriba</b> en la dirección del aparejo; con arrancada, costados y alcance. d) Anexo II para pesca muy cerca de otros. e) Sin pescar: luces de su eslora.</p>`,
    f: [["Verde sobre blanca", "Pesca de arrastre."], ["Roja sobre blanca", "Pesca no de arrastre."], ["Cono vértice arriba en un pesquero", "Aparejo de más de 150 m en esa dirección."]] },
  { k: "27", p: "C", t: "Buques sin gobierno o con capacidad de maniobra restringida", s: `<p>a) <b>Sin gobierno</b>: <b>dos rojas</b> en vertical (dos <b>bolas</b>); con arrancada, costados y alcance (sin tope). b) <b>Maniobra restringida</b>: <b>roja–blanca–roja</b> (bola–bicónica–bola); con arrancada, además topes, costados y alcance; fondeado, además fondeo. c) Remolque que restringe: luces de R24 a) + b). d) Dragado u obras: dos rojas/bolas en la banda obstruida y dos verdes/bicónicas en la banda libre. e) <b>Buceo</b>: roja–blanca–roja y <b>bandera «A» rígida ≥ 1 m</b>. f) <b>Limpieza de minas</b>: <b>tres verdes</b> o tres bolas; peligroso a menos de <b>1000 m</b>. g) &lt; 12 m (salvo buceo) no obligados. h) No son señales de peligro.</p>`,
    f: [["Dos bolas", "Sin gobierno."], ["Bola–bicónica–bola", "Maniobra restringida."], ["Tres verdes / tres bolas", "Dragaminas: no acercarse a menos de 1000 m."]] },
  { k: "28", p: "C", t: "Buques restringidos por su calado", s: `<p>Además de las luces de R23, <b>podrá</b> exhibir <b>tres rojas todo horizonte en vertical</b> o <b>un cilindro</b>.</p>`, f: [["Cilindro", "Restringido por su calado."]] },
  { k: "29", p: "C", t: "Embarcaciones de práctico", s: `<p>a) En servicio: <b>blanca sobre roja</b> en el tope; navegando, además costados y alcance; fondeada, además fondeo. b) Fuera de servicio: luces de un buque de su eslora.</p>`, f: [["Blanca sobre roja", "Práctico en servicio."], ["Práctico sin hacer practicaje, navegando", "Tope, costados y alcance."]] },
  { k: "30", p: "C", t: "Buques fondeados y buques varados", s: `<p>a) Fondeado: a proa <b>blanca todo horizonte</b> (o <b>bola</b>); a popa, <b>más baja</b>, otra blanca. b) <b>&lt; 50 m</b>: puede una sola blanca donde mejor se vea. c) Puede, y <b>≥ 100 m debe</b>, iluminar sus cubiertas. d) <b>Varado</b>: fondeo + <b>dos rojas</b> en vertical; de día <b>tres bolas</b>. e) <b>&lt; 7 m</b> fondeado fuera de canales, fondeaderos y zonas frecuentadas: no obligado. f) <b>&lt; 12 m</b> varado: no obligado a d).</p>`,
    f: [["Tres bolas", "Buque varado."], ["Fondeado de 6 m lejos de canales", "No obligado a la luz de fondeo."], ["Una blanca a proa y otra más baja a popa", "Buque fondeado (≥ 50 m obligatorio; < 50 m puede)."]] },
  { k: "31", p: "C", t: "Hidroaviones", s: `<p>Cuando a un <b>hidroavión o nave WIG</b> no le sea posible exhibir luces y marcas de las características o en las posiciones prescritas, exhibirá las <b>más parecidas posible</b>.</p>`, f: [["Hidroavión con luces parecidas pero no idénticas", "Válido si no puede exhibir las prescritas; se interpretan como las reglamentarias."]] },
  { k: "32", p: "D", t: "Definiciones", s: `<p><b>Pito</b>: dispositivo que produce las pitadas prescritas conforme al Anexo III. <b>Pitada corta</b>: ~<b>1 s</b>. <b>Pitada larga</b>: <b>4 a 6 s</b>.</p>`, f: [["Pitada larga", "4 a 6 segundos."], ["Pitada corta", "Unos 1 segundo."]] },
  { k: "33", p: "D", t: "Equipo para señales acústicas", s: `<p>a) <b>≥ 12 m</b>: pito; <b>≥ 20 m</b>: pito y <b>campana</b>; <b>≥ 100 m</b>: además <b>gong</b>. Campana y gong pueden sustituirse por equipo equivalente de accionamiento manual posible. b) <b>&lt; 12 m</b>: no obligados, pero deben llevar <b>otro medio eficaz</b> de señales acústicas.</p>`, f: [["Buque de 22 m", "Pito y campana."], ["Buque de 12 m", "Un pito."]] },
  { k: "34", p: "D", t: "Señales de maniobra y advertencia", s: `<p>a) Propulsión mecánica a la vista: <b>1 corta</b> caigo a estribor; <b>2 cortas</b> caigo a babor; <b>3 cortas</b> doy atrás. b) Puede complementarse con <b>destellos</b> (1, 2, 3) de ~1 s, separados ~1 s, ≥ 10 s entre señales, con luz <b>blanca todo horizonte ≥ 5 M</b>. c) Canal angosto: <b>2 largas + 1 corta</b> alcanzo por su estribor; <b>2 largas + 2 cortas</b> por su babor; conformidad: <b>larga–corta–larga–corta</b>. d) Duda: <b>al menos 5 cortas y rápidas</b> (y 5 destellos). e) <b>Recodo</b>: 1 larga, contestada con 1 larga. f) Pitos separados &gt; 100 m: solo uno.</p>`,
    f: [["Tres cortas", "Estoy dando atrás."], ["2 largas + 2 cortas", "Pretendo alcanzarle por su banda de babor."], ["Duda", "Al menos cinco pitadas cortas y rápidas."]] },
  { k: "35", p: "D", t: "Señales acústicas en visibilidad reducida", s: `<p>a) Propulsión mecánica con arrancada: <b>1 larga ≤ 2 min</b>. b) Sin arrancada: <b>2 largas</b> (~2 s) ≤ 2 min. c) Sin gobierno, maniobra restringida, calado, vela, pesca, remolcando o empujando: <b>larga + 2 cortas</b>. d) Pesca y maniobra restringida fondeados: la de c). e) Remolcado tripulado: <b>larga + 3 cortas</b>. f) Unidad compuesta: como propulsión mecánica. g) Fondeado: <b>campana 5 s ≤ 1 min</b> (≥ 100 m + gong a popa); opcional <b>corta–larga–corta</b>. h) Varado: <b>3 golpes + campana + 3 golpes</b>. i) 12–20 m: no obligados a campana, sí a otra señal eficaz ≤ 2 min. j) &lt; 12 m: otra señal eficaz ≤ 2 min. k) Práctico: además <b>4 cortas</b>.</p>`,
    f: [["Larga + 2 cortas", "Vela, pesca, sin gobierno, maniobra restringida, calado, remolcando o empujando."], ["Corta–larga–corta", "Fondeado avisando de su posición."], ["4 cortas", "Práctico en servicio."]] },
  { k: "36", p: "D", t: "Señales para llamar la atención", s: `<p>Cualquier señal luminosa o acústica que <b>no pueda confundirse</b> con las autorizadas, o dirigir el haz de un <b>proyector</b> hacia el peligro sin molestar. La luz no debe confundirse con ninguna <b>ayuda a la navegación</b>; se evitan las intermitentes o giratorias de gran intensidad (estroboscópicas). Clave oficial 2023: la más adecuada, «una luz azul continua».</p>`, f: [["Luz para llamar la atención", "Que no pueda confundirse con ayudas a la navegación."]] },
  { k: "37", p: "D", t: "Señales de peligro", s: `<p>Un buque en peligro que requiera ayuda usará o exhibirá las señales del <b>Anexo IV</b>.</p>`, f: [["¿Dónde están las señales de peligro?", "En el Anexo IV (R37)."]] },
  { k: "38", p: "E", t: "Exenciones", s: `<p>Exenciones transitorias para buques cuya quilla se colocó antes de la entrada en vigor del Reglamento (1977) que cumplían el de 1960: alcances, colores, reposicionamiento de luces, etc., durante plazos ya vencidos. Sin efecto práctico en la navegación de recreo.</p>`, f: [] },
  { k: "39", p: "F", t: "Definiciones", s: `<p>Parte F (en vigor desde 2016): define <b>auditoría</b>, <b>Plan de auditorías</b> de los Estados miembros de la OMI, <b>Código III</b> (Código para la implantación de los instrumentos de la OMI) y <b>norma de auditoría</b>.</p>`, f: [["¿De qué trata la Parte F?", "Verificación del cumplimiento por los Estados (auditorías OMI); sin efecto operativo."]] },
  { k: "40", p: "F", t: "Aplicación", s: `<p>Las Partes Contratantes utilizarán las disposiciones del <b>Código III</b> en el cumplimiento de sus obligaciones.</p>`, f: [] },
  { k: "41", p: "F", t: "Verificación del cumplimiento", s: `<p>Toda Parte Contratante estará sujeta a <b>auditorías periódicas de la OMI</b> conforme a la norma de auditoría.</p>`, f: [] },
  { k: "AI", p: "X", t: "Anexo I · Posición y características técnicas de luces y marcas", s: `<ul><li>Propulsión mecánica <b>≥ 20 m</b>: tope de proa a <b>≥ 6 m</b> sobre el casco (o la manga si es mayor, sin exceder 12 m); el tope de popa <b>≥ 4,5 m</b> más alto que el de proa.</li><li><b>12–20 m</b>: tope ≥ 2,5 m sobre la regala. <b>&lt; 12 m</b>: la luz más alta ≥ 1 m por encima de los costados.</li><li>Costados a no más de <b>3/4</b> de la altura del tope de proa. Topes separados horizontalmente ≥ la mitad de la eslora (no más de 100 m); el de proa a ≤ 1/4 de la eslora desde la roda.</li><li>Luces en vertical: ≥ 20 m, separadas ≥ 2 m y la más baja ≥ 4 m sobre el casco; &lt; 20 m, ≥ 1 m y la más baja ≥ 2 m sobre la regala.</li><li>Fondeo ≥ 50 m: la de proa ≥ 6 m sobre el casco y ≥ 4,5 m más alta que la de popa.</li><li><b>Marcas</b> negras: bola ≥ 0,6 m de diámetro; cono base 0,6 m y altura igual; cilindro 0,6 m × doble de alto; bicónica = dos conos base con base; separación ≥ 1,5 m; &lt; 20 m pueden ser menores.</li><li>Sectores: los costados se cortan entre 1° y 3° fuera de su sector hacia proa; las todo horizonte no pueden quedar tapadas en sectores &gt; 6°.</li></ul>`,
    f: [["Separación vertical entre marcas", "≥ 1,5 m."], ["Altura del cilindro", "El doble de su diámetro (0,6 m)."]] },
  { k: "AII", p: "X", t: "Anexo II · Señales adicionales para pesqueros muy cerca unos de otros", s: `<p>Visibles ≥ 1 milla, por debajo de las de R26. <b>Arrastreros</b> (de fondo o pelágico, también en pareja; los &lt; 20 m igualmente pueden): <b>largando</b> redes, dos blancas en vertical; <b>cobrando</b>, blanca sobre roja; <b>red enganchada</b>, dos rojas. Arrastre en <b>pareja</b>: además un proyector hacia proa y hacia el otro buque. <b>Cerqueros</b>: dos <b>amarillas</b> en vertical con destellos alternos cada segundo cuando el aparejo les estorba.</p>`, f: [["Arrastrero cobrando redes (Anexo II)", "Blanca sobre roja."], ["Dos amarillas alternas", "Cerquero con maniobra estorbada por el aparejo."]] },
  { k: "AIII", p: "X", t: "Anexo III · Aparatos de señales acústicas", s: `<p>Pitos: frecuencia fundamental 70–200 Hz (≥ 200 m), 130–350 Hz (75–200 m), 250–700 Hz (&lt; 75 m): <b>cuanto mayor el buque, más grave</b>. Alcance audible 2 / 1,5 / 1 / 0,5 millas (≥ 200 / ≥ 75 / ≥ 20 / &lt; 20 m). Campana ≥ 300 mm de boca en ≥ 20 m; ≥ 200 mm en 12–20 m; nivel sonoro ≥ 110 dB a 1 m.</p>`, f: [["Alcance del pito de < 20 m", "0,5 millas."]] },
  { k: "AIV", p: "X", t: "Anexo IV · Señales de peligro", s: `<ol type="a"><li>Disparo de cañón u otra señal detonante a intervalos de ~1 minuto.</li><li><b>Sonido continuo</b> con cualquier aparato de señales de niebla.</li><li>Cohetes o granadas con estrellas <b>rojas</b>, de una en una a cortos intervalos.</li><li><b>SOS</b> (··· — — — ···) por radiotelegrafía o cualquier otro sistema.</li><li>Radiotelefonía: «<b>MAYDAY</b>».</li><li>Código Internacional de Señales: <b>NC</b>.</li><li>Bandera cuadra con una <b>bola</b> (o algo parecido) encima o debajo.</li><li>Llamaradas a bordo (barril de alquitrán, aceite…).</li><li><b>Cohete-bengala con paracaídas o bengala de mano de luz roja</b>.</li><li>Señal fumígena de humo <b>naranja</b>.</li><li><b>Subir y bajar lenta y repetidamente los brazos extendidos</b> lateralmente.</li><li><b>Alerta LSD/DSC</b> en VHF <b>canal 70</b> o en MF/HF (2187,5; 8414,5; 4207,5; 6312; 12577 o 16804,5 kHz).</li><li>Alerta buque-tierra por la estación terrena de <b>Inmarsat u otro proveedor de servicio móvil por satélite</b>.</li><li>Señales de <b>radiobalizas</b> de localización de siniestros.</li><li>Señales aprobadas de sistemas de radiocomunicaciones, incluidos <b>respondedores de radar</b> de embarcaciones de supervivencia.</li></ol><p>Prohibido usarlas salvo en peligro. Para identificación desde el aire: <b>lona naranja con un cuadrado y un círculo negros</b> u otro símbolo; también marcador de colorante.</p>`,
    f: [["Color del humo de la señal fumígena", "Naranja."], ["Señal CIS de peligro", "NC."], ["Lona para identificación aérea", "Naranja con un cuadrado negro y un círculo."], ["Canal VHF de la alerta LSD", "Canal 70."]] },
];
const BYK = Object.fromEntries(R.map(r => [r.k, r]));
const label = r => r.p === "X" ? r.t.split(" · ")[0] : `Regla ${r.k}`;
const cnt = r => COUNTS[r.k] || [0, 0, []];
const MAXN = Math.max(...R.map(r => cnt(r)[0]));

const CSS = `
.m-${ID} [hidden]{display:none!important}
.m-${ID} .lay{display:grid;gap:1rem;grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr)}
@media (max-width:820px){.m-${ID} .lay{grid-template-columns:minmax(0,1fr)}}
.m-${ID} .list{display:flex;flex-direction:column;gap:.2rem;max-height:620px;overflow:auto;padding-right:.2rem}
.m-${ID} .list .eyebrow{margin:.6rem 0 .15rem}
.m-${ID} .it{display:grid;grid-template-columns:4.6em minmax(0,1fr) auto;gap:.5rem;align-items:center;text-align:left;border:1px solid transparent;background:transparent;border-radius:var(--r-sm);padding:.35rem .45rem;cursor:pointer;color:var(--ink);font:inherit}
.m-${ID} .it:hover{background:var(--sea)}
.m-${ID} .it[aria-current="true"]{background:var(--sea);border-color:var(--accent)}
.m-${ID} .it .n{font-family:var(--f-mono);font-size:.82rem;color:var(--muted)}
.m-${ID} .it .t{font-size:.92rem;line-height:1.2}
.m-${ID} .heat{display:flex;align-items:center;gap:.3rem;font-family:var(--f-mono);font-size:.78rem;color:var(--muted)}
.m-${ID} .heat i{display:block;height:6px;border-radius:3px;background:var(--accent)}
.m-${ID} .hot{color:var(--accent);font-weight:700}
.m-${ID} input[type=search]{width:100%;min-height:40px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--sheet);padding:.3em .6em}
.m-${ID} .body ul,.m-${ID} .body ol{padding-left:1.2rem;margin:.3rem 0}
.m-${ID} .body li{margin:.2rem 0}
.m-${ID} .body p{margin:.35rem 0}
.m-${ID} .qs{display:flex;flex-direction:column;gap:.5rem}
.m-${ID} .qq{border-left:3px solid var(--line);padding-left:.6rem;font-size:.9rem}
.m-${ID} .qq .ok{color:var(--ok);font-weight:600}
.m-${ID} .card{min-height:200px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:.8rem;cursor:pointer;padding:1.4rem}
.m-${ID} .card .q{font-family:var(--f-display);font-size:1.5rem;font-weight:600;line-height:1.15}
.m-${ID} .card .a{font-size:1.05rem}
.m-${ID} .hd{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:space-between;align-items:flex-end}
.m-${ID} mark{background:color-mix(in srgb,var(--buoy-y) 40%,transparent);color:inherit;border-radius:2px}
`;

export default {
  id: ID, tema: 6, title: "Las 41 reglas", icon: "§",
  desc: "Todas las reglas del RIPA y sus Anexos resumidas, con buscador, cuántas veces cae cada una en el examen y tarjetas de repaso.",
  mount(el, ctx) {
    if (!document.querySelector(`style[data-mod="${ID}"]`)) document.head.append(h("style", { "data-mod": ID }, CSS));
    const store = ctx.store || { get: (k, d) => d, set() {} };
    const root = h("div", { class: `m-${ID} stack` }); el.append(root);
    const st = { mode: "nav", sel: BYK[store.get("last", "18")] || R[0], q: "", sort: "num", qdb: null, qload: null };

    const MODES = [["nav", "Reglas"], ["fc", "Tarjetas"], ["top", "Más preguntadas"]];
    const seg = h("div", { class: "seg", role: "group", "aria-label": "Modo" });
    for (const [k, l] of MODES) seg.append(h("button", { type: "button", "aria-pressed": String(k === st.mode), onclick: () => setMode(k) }, l));
    const totalQ = Object.values(COUNTS).reduce((a, v) => a + v[0], 0);
    root.append(h("div", { class: "hd" }, h("div", null, h("div", { class: "eyebrow" }, "Tema 6 · RIPA / COLREG 72 · Reglas 1–41 y Anexos I–IV"), h("h3", null, "Las 41 reglas")), seg));

    /* --- navegador --- */
    const search = h("input", { type: "search", placeholder: "Buscar: «barlovento», «cilindro», «22,5»…", "aria-label": "Buscar en las reglas", oninput: () => { st.q = search.value; paintList(); } });
    const sortSeg = h("div", { class: "seg", role: "group", "aria-label": "Orden" });
    const SORTS = [["num", "Por número"], ["freq", "Por frecuencia"]];
    for (const [k, l] of SORTS) sortSeg.append(h("button", { type: "button", "aria-pressed": String(k === st.sort), onclick: () => { st.sort = k; [...sortSeg.children].forEach((b, i) => b.setAttribute("aria-pressed", String(SORTS[i][0] === k))); paintList(); } }, l));
    const list = h("div", { class: "list", role: "list" });
    const detail = h("div", { class: "panel stack", "aria-live": "polite" });
    const navSec = h("section", { class: "lay" }, h("div", { class: "panel stack" }, search, sortSeg, list), detail);

    const textOf = r => fold(`${label(r)} ${r.t} ${r.s.replace(/<[^>]+>/g, " ")} ${r.f.map(x => x.join(" ")).join(" ")}`);
    function heat(r) { const [n] = cnt(r); return h("span", { class: "heat", title: `${n} preguntas oficiales la citan` }, h("i", { style: `width:${n ? 4 + 34 * n / MAXN : 0}px` }), String(n)); }
    function paintList() {
      list.textContent = ""; const q = fold(st.q.trim());
      let items = R.filter(r => !q || textOf(r).includes(q));
      if (st.sort === "freq") items = items.slice().sort((a, b) => cnt(b)[0] - cnt(a)[0]);
      let lastP = "";
      for (const r of items) {
        if (st.sort === "num" && r.p !== lastP) { list.append(h("div", { class: "eyebrow" }, PARTS[r.p])); lastP = r.p; }
        const n = cnt(r)[0];
        list.append(h("button", { type: "button", class: "it", role: "listitem", "aria-current": String(r === st.sel), onclick: () => select(r) },
          h("span", { class: "n" + (n >= 10 ? " hot" : "") }, r.p === "X" ? r.k.replace("A", "An. ") : `R${r.k}`), h("span", { class: "t" }, r.t.replace(/^Anexo [IV]+ · /, "")), heat(r)));
      }
      if (!items.length) list.append(h("p", { class: "muted small" }, "Sin resultados."));
    }
    function hl(html) {
      const q = st.q.trim(); if (q.length < 2) return html;
      const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      return html.replace(/>([^<]+)</g, (m, t) => ">" + t.replace(re, "<mark>$1</mark>") + "<");
    }
    function select(r) {
      st.sel = r; store.set("last", r.k); paintList(); paintDetail();
    }
    function paintDetail() {
      const r = st.sel; const [n, ex, ids] = cnt(r); detail.textContent = "";
      detail.append(h("div", { class: "row", style: "justify-content:space-between" }, h("div", null, h("div", { class: "eyebrow" }, PARTS[r.p]), h("h4", null, `${label(r)}${r.p === "X" ? "" : " · " + r.t}`)),
        n ? h("span", { class: "chip " + (n >= 10 ? "acc" : "") }, `${n} preguntas · ${ex} apariciones`) : h("span", { class: "chip" }, "sin preguntas directas")));
      detail.append(h("div", { class: "body", html: hl(r.s) }));
      if (r.f.length) detail.append(h("div", { class: "tint stack", style: "gap:.3rem" }, h("div", { class: "eyebrow" }, "Para recordar"), ...r.f.map(([q, a]) => h("p", { class: "small" }, h("b", null, q + " "), a))));
      if (n) {
        const box = h("div", { class: "qs" });
        const btn = h("button", { type: "button", class: "btn sm", onclick: async () => { btn.disabled = true; btn.textContent = "Cargando…"; await showQs(ids, box); btn.remove(); } }, `Ver las ${n} preguntas oficiales que la citan`);
        detail.append(h("div", { class: "stack", style: "gap:.5rem" }, h("div", { class: "eyebrow" }, "En el examen (2022–2026)"),
          h("p", { class: "small" }, `${n} preguntas oficiales distintas mencionan «${label(r)}» en el enunciado; en total han salido ${ex} veces en los tests publicados.`), btn, box));
      }
      const i = R.indexOf(r);
      detail.append(h("div", { class: "row" }, i > 0 ? h("button", { type: "button", class: "btn sm", onclick: () => select(R[i - 1]) }, `← ${label(R[i - 1])}`) : null,
        i < R.length - 1 ? h("button", { type: "button", class: "btn sm", onclick: () => select(R[i + 1]) }, `${label(R[i + 1])} →`) : null));
    }
    async function loadQs() {
      if (st.qdb) return st.qdb;
      if (!st.qload) st.qload = fetch(ctx.asset("data/questions.json")).then(r => r.json()).then(d => { st.qdb = Object.fromEntries(d.questions.map(q => [q.id, q])); return st.qdb; }).catch(() => null);
      return st.qload;
    }
    async function showQs(ids, box) {
      const db = await loadQs();
      if (!db) { box.append(h("p", { class: "small muted" }, `No se pudo cargar el banco de preguntas. Identificadores: ${ids.join(", ")}`)); return; }
      for (const id of ids) {
        const q = db[id]; if (!q) continue;
        box.append(h("div", { class: "qq" }, h("p", null, q.stem), ...q.ok.map(k => h("p", { class: "ok" }, `Clave oficial: ${"abcd"[k]}) ${q.opts[k]}`)), h("p", { class: "small muted mono" }, `${id} · ${q.seen.join(", ")}`)));
      }
    }

    /* --- tarjetas --- */
    const DECK = R.flatMap(r => r.f.map(([q, a], i) => ({ id: `${r.k}:${i}`, r, q, a })));
    const fcSec = h("section", { class: "stack", hidden: true });
    const box = store.get("box", {});
    const fc = { deck: [], i: 0, flip: false, only: "all", known: 0 };
    const onlySeg = h("div", { class: "seg", role: "group", "aria-label": "Mazo" });
    const ONLY = [["all", "Todas"], ["hot", "Reglas más preguntadas"], ["weak", "Las que fallo"]];
    for (const [k, l] of ONLY) onlySeg.append(h("button", { type: "button", "aria-pressed": String(k === fc.only), onclick: () => { fc.only = k; [...onlySeg.children].forEach((b, i) => b.setAttribute("aria-pressed", String(ONLY[i][0] === k))); deal(); } }, l));
    const card = h("div", { class: "panel card", role: "button", tabindex: "0", "aria-label": "Tarjeta: pulsa para girar", onclick: () => flip(), onkeydown: e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } } });
    const prog = h("span", { class: "small mono" });
    const knowBtn = h("button", { type: "button", class: "btn primary", onclick: () => rate(true) }, "La sabía");
    const againBtn = h("button", { type: "button", class: "btn", onclick: () => rate(false) }, "Repasar");
    fcSec.append(h("div", { class: "row", style: "justify-content:space-between" }, onlySeg, prog), card, h("div", { class: "row" }, againBtn, knowBtn, h("span", { class: "small muted" }, "Pulsa la tarjeta para ver la respuesta.")));
    function deal() {
      let d = DECK;
      if (fc.only === "hot") d = d.filter(c => cnt(c.r)[0] >= 7);
      if (fc.only === "weak") d = d.filter(c => (box[c.id] || 0) < 2);
      if (!d.length) d = DECK;
      fc.deck = shuffle(d).sort((a, b) => (box[a.id] || 0) - (box[b.id] || 0)); fc.i = 0; fc.known = 0; paintCard();
    }
    function paintCard() {
      const c = fc.deck[fc.i]; fc.flip = false; card.textContent = "";
      if (!c) { card.append(h("div", { class: "q" }, "Mazo completado"), h("p", null, `${fc.known} de ${fc.deck.length} sabidas.`), h("button", { type: "button", class: "btn primary", onclick: e => { e.stopPropagation(); deal(); } }, "Barajar de nuevo")); knowBtn.hidden = againBtn.hidden = true; prog.textContent = ""; return; }
      knowBtn.hidden = againBtn.hidden = true;
      card.append(h("div", { class: "eyebrow" }, `${label(c.r)} · ${c.r.t.replace(/^Anexo [IV]+ · /, "")}`), h("div", { class: "q" }, c.q));
      prog.textContent = `${fc.i + 1} / ${fc.deck.length}`;
    }
    function flip() {
      const c = fc.deck[fc.i]; if (!c || fc.flip) return; fc.flip = true;
      card.append(h("div", { class: "a" }, c.a)); knowBtn.hidden = againBtn.hidden = false; knowBtn.focus({ preventScroll: true });
    }
    function rate(ok) {
      const c = fc.deck[fc.i]; if (!c) return;
      box[c.id] = ok ? Math.min(5, (box[c.id] || 0) + 1) : 0; store.set("box", box);
      if (ok) fc.known++;
      fc.i++;
      if (fc.i === fc.deck.length && fc.deck.length >= 10) ctx.award(fc.known / fc.deck.length >= 0.8 ? 40 : 20, "Mazo de reglas RIPA completado");
      paintCard();
    }

    /* --- ranking --- */
    const topSec = h("section", { class: "panel stack", hidden: true });
    function paintTop() {
      topSec.textContent = "";
      const items = R.filter(r => cnt(r)[0] > 0).sort((a, b) => cnt(b)[0] - cnt(a)[0]);
      topSec.append(h("p", { class: "small" }, `Recuento de las ${261} preguntas oficiales de RIPA (2022–2026) según la regla que cita su enunciado (${totalQ} citas; una pregunta puede citar varias reglas y 10 no citan ninguna). Las de arriba son las que más caen.`));
      const tb = h("tbody");
      items.forEach((r, i) => { const [n, ex] = cnt(r);
        tb.append(h("tr", null, h("td", { class: "mono" }, String(i + 1)), h("td", null, h("a", { href: "#", onclick: e => { e.preventDefault(); setMode("nav"); select(r); } }, `${label(r)}`), " ", h("span", { class: "muted small" }, r.t.replace(/^Anexo [IV]+ · /, ""))),
          h("td", null, heat(r)), h("td", { class: "mono" }, String(ex)))); });
      topSec.append(h("div", { class: "scroll-x" }, h("table", null, h("thead", null, h("tr", null, h("th", null, "#"), h("th", null, "Regla"), h("th", null, "Preguntas"), h("th", null, "Apariciones"))), tb)));
    }

    root.append(navSec, fcSec, topSec);
    function setMode(k) {
      st.mode = k; [...seg.children].forEach((b, i) => b.setAttribute("aria-pressed", String(MODES[i][0] === k)));
      navSec.hidden = k !== "nav"; fcSec.hidden = k !== "fc"; topSec.hidden = k !== "top";
      if (k === "fc" && !fc.deck.length) deal();
      if (k === "top") paintTop();
    }
    paintList(); paintDetail();
    return () => { root.remove(); };
  },
};
