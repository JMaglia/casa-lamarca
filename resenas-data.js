/* ===================================================================
   CASA LAMARCA — reseñas ("Voces de la casa")

   Trae las reseñas desde una pestaña del MISMO Google Sheet de los
   talleres, así se cargan/sacan sin tocar código. Si el Sheet no
   responde (o la pestaña todavía no existe) quedan las reseñas que
   están escritas a mano en el HTML, así nunca se ve la sección vacía.

   Pestaña: "resenas" (sin ñ ni tilde, tal cual). Columnas, con estos
   títulos en la fila 1 (el orden no importa):
     nombre    — como aparece en Google (ej: "Melisa Juarez")
     estrellas — 1 a 5. SOLO se muestran las de 5.
     texto     — la reseña, sin comillas (las pone la web)
     pagina    — "home", "lamarca" o vacío (= en las dos)
     mostrar   — vacío o "si" = se ve. "no" = no se ve (queda guardada)

   Además, OCULTAR_SIEMPRE: nombres que no se muestran nunca, aunque
   estén en el Sheet con 5 estrellas y mostrar vacío.

   En la PC se ven las primeras 4 (la grilla). En el celu, la cinta:
   fila de arriba las primeras 4, fila de abajo las 4 siguientes
   (si hay menos de 8, se reparten mitad y mitad).
   =================================================================== */

var RESENAS_SHEET_ID = "1gA5KJ6Z2eDL6G6H-yeGbFRD8veJ4upHbRTlGYXL8_kw";
var RESENAS_SHEET_TAB = "resenas";
var RESENAS_API_KEY = "AIzaSyDMAgjhpPEGknw6ppF56cYjnKCUi7jvXmI";
var OCULTAR_SIEMPRE = ["Pedro Ramirez"];

(function(){
  var grid = document.querySelector('.voces-grid');
  if(!grid || !window.fetch) return;
  var pagina = /lamarca\.html$/i.test(location.pathname) ? 'lamarca' : 'home';
  var COLORES = [['sage',10],['coral',9],['ochre',11],['sage-deep',9]];

  function limpio(s){
    return String(s == null ? '' : s).trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function estrellas(v){
    var s = String(v || '');
    var negras = (s.match(/★/g) || []).length;
    if(negras) return negras;
    return parseFloat(s.replace(',', '.')) || 0;
  }
  var ocultos = OCULTAR_SIEMPRE.map(limpio);

  var url = "https://sheets.googleapis.com/v4/spreadsheets/" + RESENAS_SHEET_ID +
    "/values/" + encodeURIComponent(RESENAS_SHEET_TAB) + "?key=" + RESENAS_API_KEY;

  fetch(url).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
  .then(function(data){
    var filas = data.values || [];
    if(filas.length < 2) return;
    var cab = filas[0].map(limpio);
    var col = function(nombre){ return cab.indexOf(nombre); };
    var iN = col('nombre'), iE = col('estrellas'), iT = col('texto'), iP = col('pagina'), iM = col('mostrar');
    if(iN < 0 || iE < 0 || iT < 0) return;

    var resenas = filas.slice(1).map(function(f){
      return { nombre: (f[iN] || '').trim(), estrellas: estrellas(f[iE]), texto: (f[iT] || '').trim(),
               pagina: iP < 0 ? '' : limpio(f[iP]), mostrar: iM < 0 ? '' : limpio(f[iM]) };
    }).filter(function(r){
      return r.nombre && r.texto && r.estrellas >= 5 &&
        r.mostrar !== 'no' &&
        ocultos.indexOf(limpio(r.nombre)) === -1 &&
        (!r.pagina || r.pagina === pagina || r.pagina === 'ambas');
    });
    if(!resenas.length) return;

    /* se arma cada tarjeta copiando la primera del HTML (así mantiene
       las estrellas, el ícono de Google y las clases) y cambiando datos */
    var molde = grid.querySelector('.voces-card');
    if(!molde) return;
    var nuevas = resenas.map(function(r, i){
      var c = molde.cloneNode(true);
      var col = COLORES[i % COLORES.length];
      c.classList.remove('is-visible');
      c.style.background = 'color-mix(in srgb, var(--' + col[0] + ') ' + col[1] + '%, white)';
      var q = c.querySelector('.voces-quote'); if(q) q.style.color = 'var(--' + col[0] + ')';
      var txt = c.querySelector('.voces-txt'); if(txt) txt.textContent = '"' + r.texto.replace(/^["“”]+|["“”]+$/g, '') + '"';
      var av = c.querySelector('.voces-avatar');
      if(av){ av.textContent = r.nombre.charAt(0).toUpperCase(); av.style.background = 'var(--' + col[0] + ')'; }
      var nom = c.querySelector('.voces-who > span:last-child'); if(nom) nom.textContent = r.nombre;
      if(c.style.getPropertyValue('--i')) c.style.setProperty('--i', i % 4);
      return c;
    });
    grid.innerHTML = '';
    nuevas.forEach(function(c){ grid.appendChild(c); });
    /* las que tenían animación de entrada (.reveal) ya están en pantalla
       o casi: se muestran directo para que no queden invisibles */
    nuevas.forEach(function(c){ c.classList.add('is-visible'); });
    if(window.armarCintaVoces) window.armarCintaVoces(grid);
  })
  .catch(function(){ /* sin Sheet: quedan las reseñas del HTML */ });
})();
