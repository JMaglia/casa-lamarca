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

  function onResize(){
    measure();
    measureStickyTop();
    measureBand();
    onScroll();
  }
  measure();
  measureStickyTop();
  measureBand();
  window.addEventListener('resize', onResize);

  var hintHidden = false;
  var target = 0, current = 0, activeIndex = -1, raf = null;

  function onScroll(){
    var rect = track.getBoundingClientRect();
    var scrollable = track.offsetHeight - sticky.offsetHeight;
    var scrolled = stickyTop - rect.top;
    target = scrollable > 0 ? Math.min(1, Math.max(0, scrolled / scrollable)) : 0;
    moveBand(scrolled, scrollable);
    if(!hintHidden && scrolled > 4 && hint){
      hintHidden = true;
      hint.classList.add('is-hidden');
    }
    if(reduceMotion){ current = target; render(current); return; }
    if(!raf) raf = requestAnimationFrame(tick);
  }

  function tick(){
    current += (target - current) * 0.16;
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

    cards.forEach(function(card, i){
      var offset = i - center;
      var dist = Math.abs(offset);
      var ty = offset * spacing;
      var scale = Math.max(0.8, 1 - dist * 0.12);
      var opacity = Math.max(0, 1 - dist * 0.65);
      var blur = reduceMotion ? 0 : Math.min(dist * 1.1, 3);
      card.style.transform = 'translateY(calc(-50% + ' + ty + 'px)) scale(' + scale + ')';
      card.style.opacity = String(opacity);
      card.style.filter = blur > 0.05 ? 'blur(' + blur + 'px)' : 'none';
      card.style.zIndex = String(Math.max(1, 100 - Math.round(dist * 10)));
      var isActive = i === idx;
      card.style.pointerEvents = isActive ? 'auto' : 'none';
      card.tabIndex = isActive ? 0 : -1;
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
