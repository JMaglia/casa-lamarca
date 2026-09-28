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
