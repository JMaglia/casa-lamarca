/* ===================================================================
   CARRUSEL "LOS TALLERES QUE HACEMOS" (talleres.html y cumpleanos.html)
   Cards que pasan con el scroll de la página mientras el panel queda
   pegado (position:sticky). Si la página tiene la banda verde
   (#fraseBand), la acompaña también. Se saca de las páginas a este
   archivo para no duplicar el código.
=================================================================== */
(function(){
  var scroller = document.getElementById('mazoScroll');
  var track = scroller ? scroller.querySelector('.mazo-track') : null;
  var sticky = scroller ? scroller.querySelector('.mazo-sticky') : null;
  var list = document.getElementById('mazoList');
  var hint = document.getElementById('mazoHint');
  var countEl = document.getElementById('mazoCount');
  var dotsWrap = document.getElementById('mazoDots');
  if(!scroller || !track || !sticky || !list || !countEl || !dotsWrap) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.mazo-card-link'));
  var n = cards.length;
  if(!n) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* en el celu: las cards siguen al dedo (sin saltar de a una), sin
     desenfoque (es lo que más le cuesta dibujar al iPhone) */
  var esCelu = window.matchMedia && window.matchMedia('(max-width: 620px)').matches;

  var dots = cards.map(function(){
    var d = document.createElement('span');
    dotsWrap.appendChild(d);
    return d;
  });

  // el resplandor de fondo acompaña el color del taller activo, para que
  // el panel no quede plano aunque las cards sean chicas.
  var glowEl = document.getElementById('mazoGlow');
  var glowColors = ['var(--sage)', 'var(--coral)', 'var(--ochre)', 'var(--sage-deep)'];
  function setGlow(i){
    if(!glowEl) return;
    /* en el celu el resplandor queda fijo: redibujar ese degradé enorme
       justo cuando cambia el taller (a mitad de camino entre dos cards)
       era lo que daba el tirón */
    if(esCelu && glowEl.style.background) return;
    glowEl.style.background = 'radial-gradient(circle, ' + glowColors[i % glowColors.length] + ' 0%, transparent 70%)';
  }
  setGlow(0);

  // distancia vertical entre el centro de una card y la siguiente — se
  // recalcula con el alto real de la card, para que la anterior/siguiente
  // asomen siempre la misma proporción sin importar el breakpoint.
  var spacing = 200;
  function measure(){
    var h = cards[0].getBoundingClientRect().height;
    if(h > 0) spacing = h * 0.66;
  }

  /* El "avance" ya NO depende de un scroll interno (eso era lo que hacía
     que el cursor, con solo estar arriba del panel, le robara el scroll
     a la página). Ahora .mazo-sticky se queda pegado arriba (position:
     sticky) mientras .mazo-track —mucho más alto que la pantalla— pasa
     por abajo con el scroll normal de la página. El progreso de 0 a 1 se
     calcula con la posición real del track en la ventana: no importa
     dónde esté el mouse, solo importa cuánto bajaste la página. */
  var stickyTop = 0;
  function measureStickyTop(){
    var v = parseFloat(getComputedStyle(sticky).top);
    stickyTop = isNaN(v) ? 0 : v;
  }

  /* La banda verde acompaña al panel, en 3 fases:
     - antes de las cards: en su lugar, se mueve normal con la página;
     - mientras pasan: position:fixed a la altura justa, quieta (la
       mueve el navegador, no el JS, así no tiembla al scrollear);
     - al terminar: vuelve a su lugar corrida lo que duró el carrusel,
       pegada arriba del panel, y suben juntos.
     Solo se tocan estilos al cambiar de fase, no en cada scroll. */
  var band = document.getElementById('fraseBand');
  var bandWrap = band ? band.parentNode : null;
  var bandPhase = null, bandFixedTop = 0;

  function measureBand(){
    if(!band) return;
    bandPhase = null;
    band.classList.remove('is-pinned');
    band.style.top = '';
    band.style.transform = '';
    bandWrap.style.paddingTop = '';
    var bandRect = band.getBoundingClientRect();
    var gap = track.getBoundingClientRect().top - bandRect.bottom;
    bandFixedTop = stickyTop - gap - bandRect.height;
  }

  function moveBand(scrolled, scrollable){
    if(!band) return;
    var phase = scrolled <= 0 ? 'antes' : (scrolled < scrollable ? 'fija' : 'despues');
    if(phase === bandPhase) return;
    bandPhase = phase;
    if(phase === 'fija'){
      /* se mide JUSTO antes de fijarla, con la banda en su lugar normal:
         si se mide solo al cargar, las fuentes o las imágenes que cargan
         después cambian las alturas y la banda "salta" al fijarse. */
      band.classList.remove('is-pinned');
      band.style.top = '';
      band.style.transform = '';
      bandWrap.style.paddingTop = '';
      var r = band.getBoundingClientRect();
      var gap = track.getBoundingClientRect().top - r.bottom;
      bandFixedTop = stickyTop - gap - r.height;
      bandWrap.style.paddingTop = band.offsetHeight + 'px';
      band.style.transform = '';
      band.style.top = bandFixedTop + 'px';
      band.classList.add('is-pinned');
    } else {
      band.classList.remove('is-pinned');
      band.style.top = '';
      bandWrap.style.paddingTop = '';
      band.style.transform = phase === 'despues' ? 'translateY(' + scrollable + 'px)' : '';
    }
  }

  /* Cuánto hay que scrollear para pasar de un taller al siguiente.
     El alto del track se arma con esto (pisa el height del CSS): así
     da lo mismo cuántos talleres haya. Más chico = cambia más rápido. */
  var PASO_POR_CARD = 200;
  function sizeTrack(){
    track.style.height = (sticky.offsetHeight + (n - 1) * PASO_POR_CARD) + 'px';
  }
  sizeTrack();

  /* en el celu, la barra de Safari aparece y desaparece al scrollear y
     eso cuenta como cambio de tamaño: solo se recalcula si cambió el ancho */
  var anchoPrevio = window.innerWidth;
  function onResize(){
    if(esCelu && window.innerWidth === anchoPrevio) return;
    anchoPrevio = window.innerWidth;
    sizeTrack();
    measure();
    measureStickyTop();
    measureBand();
    armarCSS();
    onScroll();
  }
  measure();
  measureStickyTop();
  measureBand();
  window.addEventListener('resize', onResize);

  /* CELU: el movimiento de las cards lo hace el navegador, atado al scroll
     (animation-timeline), sin pasar por el JS en cada cuadro: queda tan
     fluido como el scroll mismo. El JS solo arma, una vez, las animaciones
     de cada card con la misma fórmula de render(), y después se encarga de
     lo liviano (contador, puntitos, color de fondo). Si el navegador no lo
     soporta, sigue todo como antes. */
  /* Las animaciones van atadas al scroll de TODA la página (scroll(root)),
     no a la posición del mazo (view-timeline). Con la versión anterior, en
     iPhone, al frenar el envión Safari recalculaba la posición del mazo y
     las cards pegaban un salto de un cuadro. Así no hay nada que recalcular:
     el JS calcula una vez en qué tramo del scroll de la página pasan las
     cards (y lo actualiza si cambia el alto de lo que hay arriba). */
  var USAR_ANIMACION_CSS = true;
  var modoCSS = USAR_ANIMACION_CSS && esCelu && !reduceMotion && !!(window.CSS && CSS.supports &&
    CSS.supports('animation-timeline: scroll(root)') && CSS.supports('animation-range: 10px 20px'));
  var hojaMazo = null, spacingArmado = 0, rangoArmado = '';
  function valoresCard(i, center){
    var offset = i - center, dist = Math.abs(offset);
    var scale = Math.max(0.8, 1 - dist * 0.12);
    var opacity = Math.max(0, 1 - dist * 0.65);
    return 'transform: translate3d(0, calc(-50% + ' + (offset * spacing).toFixed(2) + 'px), 0) scale(' + scale.toFixed(4) + ');' +
           ' opacity: ' + opacity.toFixed(4) + ';';
  }
  // tramo del scroll de la página (en px) en el que el panel está pegado
  function rangoMazo(){
    var scrollable = track.offsetHeight - sticky.offsetHeight;
    var ini = track.getBoundingClientRect().top + window.pageYOffset - stickyTop;
    return Math.round(ini) + 'px ' + Math.round(ini + scrollable) + 'px';
  }
  function armarCSS(){
    if(!modoCSS) return;
    measure();
    if(spacing !== spacingArmado){            // keyframes: solo si cambió el tamaño de las cards
      spacingArmado = spacing;
      var K = Math.max(1, (n - 1) * 8), css = '';
      cards.forEach(function(card, i){
        css += '@keyframes mazo-c' + i + '{';
        for(var k = 0; k <= K; k++){
          css += (k / K * 100).toFixed(3) + '%{' + valoresCard(i, k / K * (n - 1)) + '}';
        }
        css += '}';
      });
      if(!hojaMazo){ hojaMazo = document.createElement('style'); document.head.appendChild(hojaMazo); }
      hojaMazo.textContent = css;
      cards.forEach(function(card, i){
        card.style.transform = ''; card.style.opacity = ''; card.style.filter = '';
        card.style.animation = 'mazo-c' + i + ' 1s linear both';
        card.style.animationTimeline = 'scroll(root block)';
      });
    }
    actualizarRango();
  }
  function actualizarRango(){
    if(!modoCSS) return;
    var r = rangoMazo();
    if(r === rangoArmado) return;
    rangoArmado = r;
    cards.forEach(function(card){ card.style.animationRange = r; });
  }
  armarCSS();
  /* si cambia el alto de algo de arriba (fotos que cargan, talleres que
     llegan de la planilla, fuentes), el tramo se corre: se recalcula */
  if(modoCSS){
    if(window.ResizeObserver) new ResizeObserver(actualizarRango).observe(document.body);
    window.addEventListener('load', actualizarRango);
  }

  var hintHidden = false;
  var target = 0, current = 0, activeIndex = -1, raf = null;

  function onScroll(){
    var rect = track.getBoundingClientRect();
    var scrollable = track.offsetHeight - sticky.offsetHeight;
    var scrolled = stickyTop - rect.top;
    target = scrollable > 0 ? Math.min(1, Math.max(0, scrolled / scrollable)) : 0;
    /* el scroll elige a qué taller ir, pero el carrusel no se queda a
       mitad de camino: apenas pasás la mitad, va directo y completo al
       siguiente (la animación la hace tick(), siempre hasta el final) */
    if(n > 1 && !esCelu) target = Math.round(target * (n - 1)) / (n - 1);
    moveBand(scrolled, scrollable);
    if(!hintHidden && scrolled > 4 && hint){
      hintHidden = true;
      hint.classList.add('is-hidden');
    }
    if(reduceMotion || modoCSS){ current = target; render(current); return; }
    ultimoScroll = performance.now();
    if(!raf) raf = requestAnimationFrame(tick);
  }

  /* celu: mientras haya scroll (incluido el envión), las cards se ubican en
     CADA cuadro leyendo la posición real en ese momento, en vez de esperar
     el evento de scroll (que en el iPhone no llega en todos los cuadros y
     hacía que se vieran a pocos fps) */
  var ultimoScroll = 0;
  function progresoActual(){
    var scrollable = track.offsetHeight - sticky.offsetHeight;
    var scrolled = stickyTop - track.getBoundingClientRect().top;
    return scrollable > 0 ? Math.min(1, Math.max(0, scrolled / scrollable)) : 0;
  }

  function tick(t){
    if(esCelu){
      target = progresoActual();
      if(target !== current){ current = target; render(current); }
      // sigue midiendo un rato después del último evento (el envión)
      raf = (t || performance.now()) - ultimoScroll < 250 ? requestAnimationFrame(tick) : null;
      return;
    }
    /* en el celu las cards van exactamente donde indica el scroll, en el
       mismo cuadro (sin suavizado que las deje atrasadas) */
    current += (target - current) * (esCelu ? 1 : 0.12);
    if(Math.abs(target - current) < 0.0006) current = target;
    render(current);
    if(current !== target){
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  }

  function render(progress){
    var center = progress * (n - 1);
    var idx = Math.round(center);
    if(modoCSS || esCelu){
      /* qué card va adelante lo decide el JS, con margen: cambia recién
         cuando la siguiente ya pasó bastante más de la mitad. Antes lo
         decidía la animación justo en la mitad, y con el dedo quieto ahí
         (el iPhone mueve el scroll fracciones de píxel) las dos cards se
         pasaban adelante y atrás todo el tiempo: ese era el tirón. */
      if(activeIndex >= 0 && Math.abs(center - activeIndex) < 0.7) idx = activeIndex;
      if(modoCSS){
        if(idx === activeIndex) return; // el movimiento lo hace el navegador
        cards.forEach(function(card, i){
          card.style.zIndex = String(Math.max(1, 100 - Math.abs(i - idx) * 10));
        });
      }
    }

    var cambio = idx !== activeIndex;
    cards.forEach(function(card, i){
      var isActive = i === idx;
      if(cambio){
        card.style.pointerEvents = isActive ? 'auto' : 'none';
        card.tabIndex = isActive ? 0 : -1;
      }
      if(modoCSS) return;
      // las que están lejos y ya quedaron invisibles no se vuelven a tocar
      var lejos = Math.abs(i - center) > 2.2;
      if(lejos && card._oculta) return;
      card._oculta = lejos;
      var offset = i - center;
      var dist = Math.abs(offset);
      var ty = offset * spacing;
      var scale = Math.max(0.8, 1 - dist * 0.12);
      var opacity = Math.max(0, 1 - dist * 0.65);
      var blur = (reduceMotion || esCelu) ? 0 : Math.min(dist * 1.1, 3);
      card.style.transform = 'translate3d(0, calc(-50% + ' + ty + 'px), 0) scale(' + scale + ')';
      card.style.opacity = String(opacity);
      if(!esCelu) card.style.filter = blur > 0.05 ? 'blur(' + blur + 'px)' : 'none';
      var z = String(Math.max(1, esCelu ? 100 - Math.abs(i - idx) * 10 : 100 - Math.round(dist * 10)));
      if(card.style.zIndex !== z) card.style.zIndex = z;
    });

    if(idx !== activeIndex){
      activeIndex = idx;
      countEl.textContent = 'Taller ' + (activeIndex + 1) + ' de ' + n;
      dots.forEach(function(d, i){ d.classList.toggle('is-active', i === activeIndex); });
      setGlow(activeIndex);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  render(target);
})();