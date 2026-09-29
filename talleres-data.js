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
   promo, comida, descripcion_corta, descripcion_larga

   - "id" tiene que ser único y sin espacios (ej: ceramica-18oct) — es
     lo que arma el link a la página de detalle de cada taller.
   - "categoria": si es Cerámica, Velas, Terrarios o Arte (tal cual,
     con tilde) sale con su ícono propio. Cualquier otro texto (ej.
     "Joyería") funciona igual, solo que con un ícono genérico — para
     agregar un taller de una categoría nueva no hace falta tocar
     código. Si más adelante quieren un ícono propio para esa
     categoría nueva, es un cambio chico de nuestro lado.
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
=================================================================== */

var TALLERES_SHEET_ID = "1gA5KJ6Z2eDL6G6H-yeGbFRD8veJ4upHbRTlGYXL8_kw";
var TALLERES_SHEET_TAB = "talleres-casa-lamarca";
var TALLERES_API_KEY = "AIzaSyDMAgjhpPEGknw6ppF56cYjnKCUi7jvXmI";

var TALLERES_ICONS = {
  "Cerámica": '<path d="M5 4h9v9a4.5 4.5 0 0 1-9 0V4Z"/><path d="M14 8h2a3 3 0 0 1 0 6h-2"/>',
  "Velas": '<path d="M12 2c1.2 2 1.8 3.4 1.8 4.6A1.8 1.8 0 0 1 12 8.4a1.8 1.8 0 0 1-1.8-1.8C10.2 5.4 10.8 4 12 2Z"/><path d="M9 21h6"/><path d="M8 21c-.5-4 .5-9.5 4-11.5 3.5 2 4.5 7.5 4 11.5"/>',
  "Terrarios": '<path d="M12 3v6"/><path d="M8 9h8l1.5 5a5.5 5.5 0 0 1-11 0L8 9Z"/><path d="M4 21h16"/>',
  "Arte": '<path d="M4 20c4-1 6-3 7-7l8-8-3-3-8 8c-4 1-6 3-7 7Z"/><path d="M14 6l3 3"/>',
  /* Genérico: para cualquier categoría nueva (ej. Joyería) que todavía
     no tiene ícono propio — así nunca sale con el ícono de otra cosa. */
  "_default": '<circle cx="12" cy="12" r="8"/><path d="M9 12l2 2 4-4"/>'
};

/* Contenido de taller.html cuando se entra con ?tipo=Cerámica (info
   general del taller, sin fecha) en vez de ?id=... (una fecha puntual
   del Sheet). Por categoría:
   - titulo: opcional. Vacío ("") = se usa el nombre de la categoría
     tal cual (ej. "Velas"). Si querés un nombre propio para la página
     (ej. "Velas de autor"), lo ponés acá.
   - descripcion: el texto de abajo del título.
   - precio: opcional. Vacío ("") = no se muestra ningún precio en la
     página. Es de texto libre (ej. "Desde $12.000", "Consultar").
   Si el día de mañana hay un tipo de taller nuevo y no está acá, la
   página muestra "_default" en su lugar — no rompe nada. */
var TALLERES_TIPOS = {
  "Cerámica": {
    titulo: "",
    descripcion: "Torno, modelado a mano y esmaltado. Cada pieza sale de tus manos y vuelve horneada, lista para usar en tu casa. No hace falta experiencia previa.",
    precio: ""
  },
  "Velas": {
    titulo: "",
    descripcion: "Cera de soja, fragancias y moldes propios. Te llevás lo que hiciste puesto a curar en su envase, listo para prender en unos días.",
    precio: ""
  },
  "Terrarios": {
    titulo: "",
    descripcion: "Un pequeño ecosistema en vidrio, armado a capas con tierra, piedras y plantas. Te lo llevás a tu casa o lo regalás.",
    precio: ""
  },
  "Arte": {
    titulo: "",
    descripcion: "Pintura y técnicas mixtas, sin corrección de examen — el objetivo es soltar la mano y pasarla bien.",
    precio: ""
  },
  "_default": {
    titulo: "",
    descripcion: "Un taller con onda, hecho a mano, en Casa Lamarca.",
    precio: ""
  }
};

/* Fotos fijas según el campo "comida" — mismo mecanismo que los
   íconos: un valor chico y controlado, no una foto por fila. Hoy son
   placeholders como el resto del sitio; el día que haya fotos reales
   se reemplaza acá, no en el Sheet. */
var TALLERES_COMIDA = {
  "merienda": "Foto: la merienda del taller",
  "picada": "Foto: la picada del taller"
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

/* Trae todas las filas del Sheet vía la API de Google Sheets (JSON,
   con CORS habilitado — por eso el cambio respecto al CSV publicado). */
function talleresFetchFilas(){
  var url = "https://sheets.googleapis.com/v4/spreadsheets/" + TALLERES_SHEET_ID +
    "/values/" + encodeURIComponent(TALLERES_SHEET_TAB) + "?key=" + TALLERES_API_KEY;
  return fetch(url)
    .then(function(res){
      if(!res.ok) throw new Error("No se pudo cargar el Sheet (" + res.status + ")");
      return res.json();
    })
    .then(function(data){
      var rows = data.values || [];
      var headers = rows.shift();
      if(!headers) return [];
      return rows
        .filter(function(r){ return r.length > 1 || (r[0] && String(r[0]).trim()); })
        .map(function(r){
          var obj = {};
          headers.forEach(function(h, idx){ obj[h.trim()] = (r[idx] !== undefined ? String(r[idx]) : "").trim(); });
          return obj;
        });
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

function talleresEsc(str){
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}