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
