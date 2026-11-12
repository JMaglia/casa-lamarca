/* Scroll-reveal: cualquier elemento con clase .reveal (ver styles.css)
   recibe .is-visible la primera vez que entra en pantalla, y queda así
   para siempre (no se re-oculta si volvés a scrollear para arriba). */
(function(){
  var els = document.querySelectorAll('.reveal');
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  els.forEach(function(el){ io.observe(el); });
})();

/* Nav flotante (home): se compacta apenas arrancás a scrollear, y se
   esconde al bajar / reaparece al subir, para no competirle espacio
   al contenido. Si la página no tiene .nav-float (el resto, por ahora),
   no hace nada. */
(function(){
  var header = document.querySelector('header.site.nav-float');
  if(!header) return;
  var lastY = window.scrollY;
  var raf = null;
  function update(){
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 12);
    var hiding = y > lastY && y > 120;
    header.classList.toggle('is-hidden', hiding);
    if(hiding){
      var links = document.getElementById('navLinks');
      var toggle = document.getElementById('navToggle');
      if(links && links.classList.contains('open')){
        links.classList.remove('open');
        if(toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    }
    lastY = y;
    raf = null;
  }
  window.addEventListener('scroll', function(){
    if(raf) return;
    raf = requestAnimationFrame(update);
  }, { passive:true });
})();

(function(){
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if(!toggle || !links) return;
  toggle.addEventListener('click', function(){
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    });
  });
})();

/* Botón "Ver más talleres" en Cumpleaños: muestra/oculta los talleres
   extra (.taller-extra) sacando/poniendo .is-collapsed en el grid. */
(function(){
  var toggle = document.getElementById('talleresCumpleToggle');
  var grid = document.getElementById('talleresCumpleGrid');
  if(!toggle || !grid) return;
  toggle.addEventListener('click', function(){
    var collapsed = grid.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggle.textContent = collapsed ? 'Ver más talleres' : 'Ver menos talleres';
  });
})();

/* Palabra rotativa del título del hero de Inicio ("Un lugar para…").
   Si la página no tiene el elemento (el resto de las páginas), no
   hace nada. */
(function(){
  var line = document.getElementById('heroRotate');
  if(!line) return;
  var words = ['vivir experiencias', 'celebrar', 'hacer planes diferentes', 'lo que quieras'];
  var i = 0;
  function spawn(text){
    var el = document.createElement('span');
    el.className = 'rotate-word';
    el.textContent = text;
    line.appendChild(el);
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ el.classList.add('is-active'); });
    });
    return el;
  }
  var current = spawn(words[0]);
  function next(){
    var nextWord = words[(i + 1) % words.length];
    var incoming = spawn(nextWord);
    current.classList.remove('is-active');
    current.classList.add('is-leaving');
    var toRemove = current;
    setTimeout(function(){ toRemove.remove(); }, 480);
    current = incoming;
    i = (i + 1) % words.length;
  }
  setInterval(next, 2200);
})();

/* Formulario de cumpleaños: arma un mensaje prolijo y lo manda por
   WhatsApp — no hay backend, es el mismo enfoque que el resto del sitio. */
(function(){
  var form = document.getElementById('cumpleForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var data = new FormData(form);
    var edad = (data.get('edad') || '').trim();
    var cantidad = (data.get('cantidad') || '').trim();
    var edadesInvitados = (data.get('edadesInvitados') || '').trim();
    var fecha = (data.get('fecha') || '').trim();

    var lineas = ['¡Hola! Quiero consultar por un cumpleaños en Casa Lamarca.'];
    lineas.push('- Cumple: ' + edad);
    lineas.push('- Invitados: ' + cantidad);
    if(edadesInvitados) lineas.push('- Edades de los invitados: ' + edadesInvitados);
    if(fecha) lineas.push('- Fecha posible: ' + fecha);

    var mensaje = encodeURIComponent(lineas.join('\n'));
    window.open('https://wa.me/5491123788557?text=' + mensaje, '_blank', 'noopener');
  });
})();

/* Formulario de Alquilá el espacio: mismo enfoque, arma el mensaje y
   abre WhatsApp con todo precargado. */
(function(){
  var form = document.getElementById('espacioForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var data = new FormData(form);
    var uso = (data.get('uso') || '').trim();
    var cantidad = (data.get('cantidad') || '').trim();
    var fecha = (data.get('fecha') || '').trim();
    var fechaVisita = (data.get('fechaVisita') || '').trim();
    var comentario = (data.get('comentario') || '').trim();

    var lineas = ['¡Hola! Quiero consultar por alquilar el espacio de Casa Lamarca.'];
    lineas.push('- Para qué lo necesito: ' + uso);
    lineas.push('- Personas, aprox.: ' + cantidad);
    if(fecha) lineas.push('- Fecha posible del evento: ' + fecha);
    if(fechaVisita) lineas.push('- Fechas posibles para visitar antes: ' + fechaVisita);
    if(comentario) lineas.push('- Comentario: ' + comentario);

    var mensaje = encodeURIComponent(lineas.join('\n'));
    window.open('https://wa.me/5491123788557?text=' + mensaje, '_blank', 'noopener');
  });
})();

/* Formulario genérico de Lamarca: para consultas que no entran en
   talleres, cumpleaños ni alquiler del espacio. Mismo enfoque, sin backend. */
(function(){
  var form = document.getElementById('lamarcaForm');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var data = new FormData(form);
    var nombre = (data.get('nombre') || '').trim();
    var mensaje = (data.get('mensaje') || '').trim();

    var lineas = ['¡Hola! Soy ' + nombre + ' y quería consultarles algo sobre Casa Lamarca.'];
    lineas.push('- Consulta: ' + mensaje);

    var texto = encodeURIComponent(lineas.join('\n'));
    window.open('https://wa.me/5491123788557?text=' + texto, '_blank', 'noopener');
  });
})();

/* Foto que se da vuelta (.flip, home y Lamarca): en desktop gira con el hover (CSS); en el celu
   (y con teclado) se da vuelta al tocarla / Enter. */
(function(){
  document.querySelectorAll('.flip').forEach(function(card){
    function toggle(){
      var on = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
    });
  });
})();


/* Voces de la casa en el celu: "la cinta". Arma dos filas con copias de
   las reseñas que se deslizan solas, en sentidos opuestos (la animación
   está en CSS). Cada fila tiene las tarjetas dos veces seguidas, así al
   llegar a la mitad vuelve a empezar sin que se note el salto. No se
   frena nunca. Se usa igual en PC y en el celu. */
window.armarCintaVoces = function(grid, destino){
  // destino: un .voces-cinta ya puesto en el HTML (la prueba de PC);
  // si no se pasa, se crea uno nuevo justo debajo de la grilla (celu)
  if(!destino){
    var vieja = grid.parentNode.querySelector('.voces-cinta');
    if(vieja) vieja.remove();
  }
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.voces-card'));
  if(cards.length < 2) return;
  var cinta = destino || document.createElement('div');
  if(!destino) cinta.className = 'voces-cinta';
  cinta.innerHTML = '';
  cinta.setAttribute('aria-hidden', 'true'); // las reseñas reales ya están en la grilla
  var ordenes;
  if(cards.length >= 8){
    // arriba las primeras 4, abajo las 4 siguientes (todas distintas)
    ordenes = [cards.slice(0, 4), cards.slice(4, 8)];
  } else if(cards.length >= 6){
    var m = Math.ceil(cards.length / 2);
    ordenes = [cards.slice(0, m), cards.slice(m)];
  } else {
    // pocas reseñas: las mismas en las dos filas, en otro orden
    var mitad = Math.floor(cards.length / 2);
    ordenes = [cards, cards.slice(mitad).concat(cards.slice(0, mitad))];
  }
  ordenes.forEach(function(orden, n){
    var fila = document.createElement('div');
    fila.className = 'voces-fila' + (n ? ' voces-fila--vuelta' : '');
    // dos veces seguidas: al llegar a la mitad vuelve a empezar sin salto
    orden.concat(orden).forEach(function(card){
      var c = card.cloneNode(true);
      c.classList.remove('reveal');
      fila.appendChild(c);
    });
    cinta.appendChild(fila);
  });
  if(!destino) grid.parentNode.insertBefore(cinta, grid.nextSibling);
  if(window.matchMedia && window.matchMedia('(max-width: 620px)').matches) correrCarriles(cinta);
};

/* Celu: cada fila va adentro de un carril con scroll de costado y se
   mueve sola cambiando ese scroll (no con una animación CSS). Si la
   persona la toca, se frena y después sigue desde donde la dejó. */
function correrCarriles(cinta){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cinta.classList.add('voces-cinta--carriles');
  var VEL = 22; // píxeles por segundo
  var carriles = Array.prototype.slice.call(cinta.querySelectorAll('.voces-fila')).map(function(fila, n){
    var carril = document.createElement('div');
    carril.className = 'voces-carril';
    fila.parentNode.insertBefore(carril, fila);
    carril.appendChild(fila);
    var c = { el: carril, fila: fila, dir: n ? -1 : 1, pos: 0, quieto: 0 };
    var soltar = function(){ c.quieto = Date.now() + 2500; c.pos = carril.scrollLeft; };
    carril.addEventListener('touchstart', function(){ c.quieto = Infinity; }, {passive:true});
    carril.addEventListener('touchend', soltar, {passive:true});
    carril.addEventListener('touchcancel', soltar, {passive:true});
    return c;
  });
  var visible = false, ultimo = 0, iniciado = false;
  function mitad(c){ return c.fila.scrollWidth / 2; }
  function iniciar(){
    carriles.forEach(function(c){
      c.pos = c.dir < 0 ? mitad(c) : 0;
      c.el.scrollLeft = c.pos;
    });
    iniciado = true;
  }
  function paso(t){
    if(!visible){ ultimo = 0; return; }
    var dt = ultimo ? Math.min(t - ultimo, 100) / 1000 : 0;
    ultimo = t;
    var ahora = Date.now();
    carriles.forEach(function(c){
      if(ahora < c.quieto) return;
      var m = mitad(c);
      if(!m) return;
      c.pos += c.dir * VEL * dt;
      if(c.pos >= m) c.pos -= m;
      if(c.pos <= 0) c.pos += m;
      c.el.scrollLeft = c.pos;
    });
    requestAnimationFrame(paso);
  }
  var io = new IntersectionObserver(function(es){
    var antes = visible;
    visible = es[0].isIntersecting;
    if(visible && !iniciado) iniciar();
    if(visible && !antes) requestAnimationFrame(paso);
  });
  io.observe(cinta);
}
document.querySelectorAll('.voces-grid').forEach(function(g){ window.armarCintaVoces(g); });