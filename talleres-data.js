/* ===================================================================
   CASA LAMARCA — agenda de talleres

   Trae la lista de próximos talleres desde el Google Sheet de Sofi/
   mamá, sin backend ni base de datos propia. Usa la API de Google
   Sheets (de lectura) en vez de leer el CSV publicado, porque el CSV
   publicado no deja que una página externa lo lea por código (no
   tiene CORS habilitado) — la API sí.

   Cómo está armado:
   - TALLERES_SHEET_ID: el ID del Sheet (lo que está entre /d/ y /edit
     en la URL normal del Sheet, no la de "Publicar en la web").
   - TALLERES_SHEET_TAB: el nombre EXACTO de la hoja/pestaña de abajo
     (ej. "talleres-casa-lamarca"). Si algún día renombran la pestaña
     en Sheets, hay que actualizar este valor acá, si no deja de
     funcionar.
   - TALLERES_API_KEY: una clave de Google Cloud, de solo lectura de
     Sheets, restringida a esa única API. Va a quedar visible en el
     código del sitio (es inevitable, corre en el navegador) pero no
     sirve para nada más que leer hojas de cálculo públicas — no da
     acceso a escribir, ni a otras cosas de la cuenta de Google.
   - El Sheet tiene que seguir compartido como "Cualquiera con el
     enlace - Lector" (Compartir, no "Publicar en la web") para que
     esto funcione para cualquier visitante, sin que tenga que estar
     logueado.

   Si el día de mañana Sofi/mamá arman un Sheet nuevo desde cero, hay
   que actualizar TALLERES_SHEET_ID y TALLERES_SHEET_TAB acá (la
   clave puede seguir siendo la misma).

   Columnas esperadas, en este orden:
   id, categoria, titulo, fecha (AAAA-MM-DD), hora, precio, estado,
   promo, comida, descripcion_corta, descripcion_larga, publico

   - "id" tiene que ser único y sin espacios (ej: ceramica-18oct) — es
     lo que arma el link a la página de detalle de cada taller.
   - "categoria": tiene que ser EXACTAMENTE el nombre de alguno de los
     talleres que ya están armados en la página de Talleres (tal cual
     están escritos ahí, con mayúsculas y tildes): "Cerámica",
     "Terrarios", "Velas rústicas", "Arte y vino", "Estampado 3D",
     "Tote bags Painting", "Cuadros con Flores Prensadas", "Carteras
     Sin Costura", "Charms Party" — así el evento con fecha sale con
     la misma foto y el mismo ícono que esa card en "Los talleres que
     hacemos". "Arte en Piezas de Cerámica" y "Arte y Jardinería"
     tienen ícono propio pero todavía no tienen foto (sale con el
     ícono hasta que saquemos una). Cualquier otro texto (ej.
     "Joyería", una categoría nueva) funciona igual, solo que sin foto
     ni ícono propios — no hace falta tocar código para sumar un
     taller de un tipo nuevo.
   - "estado": vacío o "activo" = normal. "agotado" = se sigue
     mostrando pero con cartel de sin cupo. "cancelado" = se saca de
     la web (la fila queda como registro, no hace falta borrarla). No
     hace falta poner "finalizado" cuando pasa la fecha — el sitio ya
     saca solo los talleres vencidos de "Próximos talleres".
   - "promo": texto libre, vacío si no aplica (ej: "10% grupos de 3+").
   - "comida": vacío = no se muestra nada de comida. "Merienda" o
     "Picada" (tal cual) muestran la foto fija correspondiente. Un
     valor distinto no rompe nada, solo no muestra foto de comida.
   - "precio" es de texto libre (ej: "$15.000", "A consultar").
   - "publico": para los filtros de la página de Talleres. "Adultos",
     "Niños" (con ñ) o "Familias"; se pueden poner varios separados por
     coma (ej: "Adultos, Familias"). Vacío = solo aparece en "Todos".
     Las columnas se leen por nombre, así que puede ir en cualquier
     lugar del Sheet, pero el encabezado tiene que ser "publico" exacto.
=================================================================== */

var TALLERES_SHEET_ID = "1gA5KJ6Z2eDL6G6H-yeGbFRD8veJ4upHbRTlGYXL8_kw";
var TALLERES_SHEET_TAB = "talleres-casa-lamarca";
var TALLERES_API_KEY = "AIzaSyDMAgjhpPEGknw6ppF56cYjnKCUi7jvXmI";

var TALLERES_ICONS = {
  "Cerámica": '<path d="M5 4h9v9a4.5 4.5 0 0 1-9 0V4Z"/><path d="M14 8h2a3 3 0 0 1 0 6h-2"/>',
  "Velas": '<path d="M12 2c1.2 2 1.8 3.4 1.8 4.6A1.8 1.8 0 0 1 12 8.4a1.8 1.8 0 0 1-1.8-1.8C10.2 5.4 10.8 4 12 2Z"/><path d="M9 21h6"/><path d="M8 21c-.5-4 .5-9.5 4-11.5 3.5 2 4.5 7.5 4 11.5"/>',
  "Terrarios": '<path d="M12 3v6"/><path d="M8 9h8l1.5 5a5.5 5.5 0 0 1-11 0L8 9Z"/><path d="M4 21h16"/>',
  "Arte": '<path d="M4 20c4-1 6-3 7-7l8-8-3-3-8 8c-4 1-6 3-7 7Z"/><path d="M14 6l3 3"/>',
  "Velas rústicas": '<path d="M12 2c1.2 2 1.8 3.4 1.8 4.6A1.8 1.8 0 0 1 12 8.4a1.8 1.8 0 0 1-1.8-1.8C10.2 5.4 10.8 4 12 2Z"/><path d="M9 21h6"/><path d="M8 21c-.5-4 .5-9.5 4-11.5 3.5 2 4.5 7.5 4 11.5"/>',
  "Arte y vino": '<path d="M8 3h8l-1 6a3 3 0 0 1-6 0L8 3Z"/><path d="M12 12v6"/><path d="M9 21h6"/>',
  "Estampado 3D": '<rect x="5" y="13" width="14" height="7" rx="1"/><path d="M8 13V9a4 4 0 0 1 8 0v4"/>',
  "Tote bags Painting": '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  "Cuadros con Flores Prensadas": '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 9v6"/><path d="M9.2 12a2.8 2.8 0 1 1 5.6 0 2.8 2.8 0 0 1-5.6 0Z"/>',
  "Carteras Sin Costura": '<path d="M6 10h12l-1 10H7L6 10Z"/><path d="M9 10a3 3 0 0 1 6 0"/>',
  "Arte en Piezas de Cerámica": '<path d="M6 5h7v7a3.5 3.5 0 0 1-7 0V5Z"/><path d="M16 4l3 3-6 6-3-1 1-3 5-5Z"/>',
  "Charms Party": '<circle cx="12" cy="14" r="6"/><path d="M9 5l1 3"/><path d="M12 4v4"/><path d="M15 5l-1 3"/>',
  "Arte y Jardinería": '<path d="M7 21h10l-1-9H8l-1 9Z"/><path d="M12 12V7"/><path d="M12 7c-1.5 0-2.5-1-2.5-2.5S12 2 12 2s2.5 1 2.5 2.5S13.5 7 12 7Z"/>',
  /* Genérico: para cualquier categoría nueva que todavía no tiene
     ícono propio — así nunca sale con el ícono de otra cosa. */
  "_default": '<circle cx="12" cy="12" r="8"/><path d="M9 12l2 2 4-4"/>'
};

/* Contenido de taller.html cuando se entra con ?tipo=Cerámica (info
   general del taller, sin fecha) en vez de ?id=... (una fecha puntual
   del Sheet). Cada clave es exactamente el texto que va en la URL
   (?tipo=...) y en el link "Ver taller" de la card del mazo que lleva
   ahí. Por taller:
   - titulo: opcional. Vacío ("") = se usa la clave tal cual (ej.
     "Cerámica"). Si querés un nombre propio para la página que sea
     distinto de la clave (como pasa con "Velas" → "Velas rústicas"),
     lo ponés acá.
   - descripcion: el texto de abajo del título. Puede ser un solo texto
     ("...") o una lista de párrafos (["Primer párrafo.", "Segundo
     párrafo.", ...]) — con lista, cada uno sale como un párrafo
     separado en la página, en vez de un bloque único de texto.
   - precio: opcional. Vacío ("") = no se muestra ningún precio en la
     página. Es de texto libre (ej. "Desde $12.000", "Consultar").
   Si el día de mañana hay un taller nuevo y no está acá, la página
   muestra "_default" en su lugar — no rompe nada. */
var TALLERES_TIPOS = {
  "Cerámica": {
    titulo: "",
    descripcion: [
      "Un encuentro para conectar con las manos y dejar volar la creatividad.",
      "En este encuentro tenés dos modalidades de trabajo, podés elegir la que más te guste: modelado desde cero, aprendiendo técnicas simples y creando tus propias piezas, o pintura sobre piezas ya hechas, explorando colores y formas para transformarlas a tu manera.",
      "Una experiencia para crear sin apuro y llevarte a casa algo hecho por vos."
    ],
    precio: ""
  },
  "Terrarios": {
    titulo: "",
    descripcion: [
      "Un encuentro para crear un pequeño mundo verde con tus propias manos.",
      "Aprendemos a armar y diseñar nuestro propio terrario de suculentas, eligiendo plantas, texturas y elementos naturales para crear una composición única. También conocemos los tips principales para su cuidado.",
      "Una experiencia relajada y creativa para conectar con la naturaleza y llevarte a casa un pedacito de verde hecho por vos."
    ],
    precio: ""
  },
  "Velas": {
    titulo: "Velas rústicas",
    descripcion: [
      "Una experiencia para crear una vela diferente, combinando cemento y cera de soja.",
      "Trabajamos en dos etapas: primero preparamos la base de cemento, que aporta una textura y estética rústica; luego incorporamos la cera de soja, creando una vela de dos materiales y dos texturas que se complementan.",
      "Una pieza artesanal, cálida y hecha por vos para llevar a casa."
    ],
    precio: ""
  },
  "Arte y vino": {
    titulo: "",
    descripcion: [
      "Una experiencia para crear, brindar y disfrutar sin apuro.",
      "Elegís la pieza que más te guste —tote bag, matera, maceta, plato de cerámica o almohadón— y la intervenís a tu manera, explorando colores, formas y diferentes recursos para crear una pieza única. Mientras creás, disfrutamos de vino y una picada para compartir.",
      "No necesitás experiencia previa, solo ganas de crear, brindar y pasar un lindo momento."
    ],
    precio: ""
  },
  "Estampado 3D": {
    titulo: "",
    descripcion: [
      "Una experiencia para jugar con texturas y creatividad.",
      "Cada participante puede elegir entre dos almohadones o un camino de mesa para intervenir. Elegimos el stencil que más nos gusta y descubrimos la técnica de estampado 3D, jugando con las texturas y dejando que cada pieza tome su propia forma.",
      "Un taller para experimentar, crear y disfrutar del proceso, con un poquito de magia de por medio."
    ],
    precio: ""
  },
  "Tote bags Painting": {
    titulo: "",
    descripcion: [
      "Una experiencia para pintar, crear y llevarte una pieza hecha por vos.",
      "Cada participante recibe su propia tote bag para intervenir y personalizar a su manera. Elegimos los colores, diseños y detalles que más nos gustan y disfrutamos del proceso de crear algo propio. No necesitás experiencia previa: te acompañamos durante todo el proceso.",
      "Una tote, muchas posibilidades y un poquito de arte para llevar con vos."
    ],
    precio: ""
  },
  "Cuadros con Flores Prensadas": {
    titulo: "",
    descripcion: [
      "Una experiencia para crear, componer y guardar un pedacito de la naturaleza.",
      "Cada participante recibe su propio cuadro y elige entre una variedad de flores naturales prensadas para crear su composición, jugando con formas y colores hasta encontrar la combinación que más nos guste. Para hacerlo aún más personal, podés sumar una foto o una frase y convertirla en un recuerdo especial.",
      "Nos llevamos a casa una pieza delicada y única, creada por nosotros."
    ],
    precio: ""
  },
  "Carteras Sin Costura": {
    titulo: "",
    descripcion: [
      "Una experiencia para crear una cartera única, sin necesidad de coser.",
      "Aprendemos una técnica de armado sin costura para crear nuestra propia cartera de fieltro con manijas de cuero. Podés elegir entre tres tonos: beige, gris o gris topo. Te acompañamos paso a paso para que puedas aprender la técnica y disfrutar del proceso, sin necesidad de tener experiencia previa.",
      "Una propuesta creativa, práctica y especialmente linda para quienes tienen un emprendimiento y quieren sumar una nueva técnica a sus conocimientos."
    ],
    precio: ""
  },
  "Arte en Piezas de Cerámica": {
    titulo: "",
    descripcion: [
      "Una experiencia para crear, compartir y celebrar.",
      "Elegimos una pieza de cerámica y la intervenimos con colores, formas y detalles que nos representen, creando una pieza única para llevarnos a casa.",
      "Una propuesta pensada especialmente para celebraciones, cumpleaños, encuentros con amigos y momentos especiales, donde crear se convierte también en una forma de compartir."
    ],
    precio: ""
  },
  "Charms Party": {
    titulo: "",
    descripcion: [
      "Elegí, combiná y creá algo tan único como vos.",
      "Cada participante elige entre un collar o una pulsera y tiene 6 charms para combinar como quiera. Diseños, colores, formas, brillos y pequeños detalles que se mezclan para crear una pieza completamente personal.",
      "Seis charms. Infinitas combinaciones. Una pieza hecha a tu manera."
    ],
    precio: ""
  },
  "Arte y Jardinería": {
    titulo: "",
    descripcion: [
      "Una experiencia para crear, plantar y llevarse un poquito de naturaleza a casa.",
      "Cada niño recibe su propia maceta para pintar y decorar a su manera. Una vez terminada, elegimos una planta aromática y aprendemos a plantarla y a cuidarla.",
      "Una propuesta pensada especialmente para cumpleaños infantiles, donde el arte y la naturaleza se encuentran en una experiencia divertida y diferente."
    ],
    precio: ""
  },
  "_default": {
    titulo: "",
    descripcion: ["Un taller con onda, hecho a mano, en Casa Lamarca."],
    precio: ""
  }
};

/* Fotos fijas según el campo "comida" — mismo mecanismo que los
   íconos: un valor chico y controlado, no una foto por fila. */
var TALLERES_COMIDA = {
  "merienda": "La merienda del taller",
  "picada": "La picada del taller"
};
var TALLERES_COMIDA_FOTOS = {
  "merienda": "img/comida-merienda.jpg",
  "picada": "img/comida-picada.jpg"
};

/* Foto fija según "categoria" (modo ?id=, Sheet) o "tipo" (modo
   ?tipo=, sin fecha) — mismo mecanismo en los dos casos. Es la misma
   foto que usa esa card en "Los talleres que hacemos" (talleres.html).
   Las claves tienen que ser EXACTAMENTE el nombre del taller tal cual
   está escrito ahí. "Arte en Piezas de Cerámica" y "Arte y Jardinería"
   todavía no tienen foto — cuando saquemos una, se agrega acá y ya
   está (se van a mostrar solas, en Talleres y acá). */
var TALLERES_FOTOS = {
  "Cerámica": "img/mazo-ceramica.jpg",
  "Terrarios": "img/mazo-terrarios.jpg",
  "Velas rústicas": "img/mazo-velas.jpg",
  "Arte y vino": "img/mazo-arte.jpg",
  "Estampado 3D": "img/mazo-estampado3d.jpg",
  "Tote bags Painting": "img/mazo-totebags.jpg",
  "Cuadros con Flores Prensadas": "img/mazo-cuadrosflores.jpg",
  "Carteras Sin Costura": "img/mazo-carteras.jpg",
  "Charms Party": "img/mazo-charms.jpg",
  /* alias viejos (por si quedó algún evento cargado con la categoría
     genérica de antes, "Velas" o "Arte" en vez del nombre completo) */
  "Velas": "img/mazo-velas.jpg",
  "Arte": "img/mazo-arte.jpg"
};

var MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
var DIAS = ["dom","lun","mar","mié","jue","vie","sáb"];

function talleresHoyISO(){
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

function talleresFechaLinda(iso){
  var partes = (iso || "").split("-");
  if(partes.length !== 3) return iso || "";
  var d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  if(isNaN(d.getTime())) return iso;
  return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()];
}

function talleresEstaCancelado(t){
  return (t.estado || "").trim().toLowerCase() === "cancelado";
}

function talleresEstaAgotado(t){
  return (t.estado || "").trim().toLowerCase() === "agotado";
}

/* Caché de las filas del Sheet en sessionStorage, por 5 minutos. Evita
   volver a pedir todo el Sheet al pasar de "Próximos talleres" al
   detalle de uno (taller.html?id=...), que si no se queda mostrando
   "Cargando…" hasta que responde de nuevo. Se guarda por pestaña
   (sessionStorage), no para siempre, así una fila nueva en el Sheet
   tarda como máximo 5 minutos en aparecer. */
var TALLERES_CACHE_KEY = "casaLamarcaTalleresCache";
var TALLERES_CACHE_MS = 5 * 60 * 1000;

function talleresCacheLeer(){
  // En desarrollo (Live Server) no usamos caché: así un cambio en el
  // Sheet se ve con solo recargar, sin esperar 5 minutos ni abrir otra
  // pestaña. En el sitio publicado la caché funciona normal.
  var host = location.hostname;
  if(host === "localhost" || host === "127.0.0.1" || location.protocol === "file:") return null;
  try {
    var raw = sessionStorage.getItem(TALLERES_CACHE_KEY);
    if(!raw) return null;
    var cache = JSON.parse(raw);
    if(!cache || !cache.filas || (Date.now() - cache.ts) > TALLERES_CACHE_MS) return null;
    return cache.filas;
  } catch(e){
    return null;
  }
}

function talleresCacheGuardar(filas){
  try {
    sessionStorage.setItem(TALLERES_CACHE_KEY, JSON.stringify({ ts: Date.now(), filas: filas }));
  } catch(e){
    /* sessionStorage puede fallar (navegación privada, cupo lleno) —
       no pasa nada, simplemente no queda cacheado esta vez. */
  }
}

/* Trae todas las filas del Sheet vía la API de Google Sheets (JSON,
   con CORS habilitado — por eso el cambio respecto al CSV publicado).
   Con caché de 5 minutos y timeout de 8 segundos: en 4G inestable, si
   la API no responde a tiempo, se corta y cae en el mensaje de error
   que ya muestran las páginas, en vez de quedar "Cargando…" para siempre. */
function talleresFetchFilas(){
  var cacheado = talleresCacheLeer();
  if(cacheado) return Promise.resolve(cacheado);

  var url = "https://sheets.googleapis.com/v4/spreadsheets/" + TALLERES_SHEET_ID +
    "/values/" + encodeURIComponent(TALLERES_SHEET_TAB) + "?key=" + TALLERES_API_KEY;

  var controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
  var timeoutId = controller ? setTimeout(function(){ controller.abort(); }, 8000) : null;

  return fetch(url, controller ? { signal: controller.signal } : undefined)
    .then(function(res){
      if(timeoutId) clearTimeout(timeoutId);
      if(!res.ok) throw new Error("No se pudo cargar el Sheet (" + res.status + ")");
      return res.json();
    })
    .then(function(data){
      var rows = data.values || [];
      var headers = rows.shift();
      if(!headers) return [];
      var filas = rows
        .filter(function(r){ return r.length > 1 || (r[0] && String(r[0]).trim()); })
        .map(function(r){
          var obj = {};
          headers.forEach(function(h, idx){ obj[h.trim()] = (r[idx] !== undefined ? String(r[idx]) : "").trim(); });
          return obj;
        });
      talleresCacheGuardar(filas);
      return filas;
    })
    .catch(function(err){
      if(timeoutId) clearTimeout(timeoutId);
      throw err;
    });
}

/* Próximos talleres (fecha >= hoy, sin contar los cancelados),
   ordenados por más cercano — para la sección "Próximos talleres". */
function talleresCargar(){
  return talleresFetchFilas().then(function(filas){
    var hoy = talleresHoyISO();
    return filas
      .filter(function(t){ return t.id && t.fecha && t.fecha >= hoy && !talleresEstaCancelado(t); })
      .sort(function(a, b){ return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
  });
}

/* Un taller puntual por id, sin filtrar por fecha ni estado — para
   que un link guardado a taller.html?id=... siga sirviendo. */
function talleresBuscarPorId(id){
  return talleresFetchFilas().then(function(filas){
    return filas.filter(function(t){ return t.id === id; })[0] || null;
  });
}

function talleresIconoSVG(categoria){
  var path = TALLERES_ICONS[categoria] || TALLERES_ICONS["_default"];
  return '<div class="icon-circle"><svg class="icon" viewBox="0 0 24 24">' + path + '</svg></div>';
}

function talleresComidaCaption(comida){
  var key = (comida || "").trim().toLowerCase();
  return TALLERES_COMIDA[key] || null;
}

function talleresComidaFoto(comida){
  var key = (comida || "").trim().toLowerCase();
  return TALLERES_COMIDA_FOTOS[key] || null;
}

function talleresFoto(categoria){
  return TALLERES_FOTOS[categoria] || null;
}

function talleresEsc(str){
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
