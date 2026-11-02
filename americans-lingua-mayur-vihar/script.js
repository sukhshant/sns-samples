(function () {
  'use strict';
  var WA = 'https://wa.me/919871859265?text=';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Name on the chair and the WhatsApp message. Works with or without the live ring. */
  var input = document.getElementById('yourname');
  var take = document.getElementById('take');
  var nameSlots = document.querySelectorAll('[data-name]');
  function cleanName() { return input.value.trim().slice(0, 18); }
  function message() {
    var n = cleanName();
    return (n ? 'Hi, this is ' + n + '. I saw' : 'Hi, I saw') +
      ' your website and I want to start speaking English. Please tell me about batches and fees.';
  }
  function syncName() {
    var n = cleanName();
    nameSlots.forEach(function (s) {
      s.textContent = n;
      /* Sized to the longest word, so a name never breaks mid-word on the seat */
      s.style.setProperty('--len', Math.max(1, Math.max.apply(null, n.split(/\s+/).map(function (w) { return w.length; }))));
    });
    take.href = WA + encodeURIComponent(message());
  }
  input.addEventListener('input', syncName);
  take.addEventListener('click', syncName);
  syncName();

  /* Quiet reveals */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (r) { ro.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add('in'); });
  }

  /* Nav goes solid once off the top, nav and phone bar leave while the Circle is on screen */
  var nav = document.getElementById('nav');
  var bar = document.getElementById('bar');
  var circle = document.getElementById('circle');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting;
      bar.classList.toggle('is-away', on);
      nav.classList.toggle('is-away', on);
    }, { rootMargin: '-1px 0px -1px 0px' }).observe(circle);
    var hero = document.querySelector('.hero');
    new IntersectionObserver(function (es) {
      nav.classList.toggle('is-solid', !es[0].isIntersecting);
    }, { rootMargin: '-40px 0px 0px 0px', threshold: 1 }).observe(hero.querySelector('h1'));
  }

  /* The Circle */
  var tooShort = matchMedia('(max-height: 479px)');
  tooShort.addEventListener('change', function () { location.reload(); });
  if (!window.gsap || !window.ScrollTrigger || reduced || tooShort.matches) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  document.documentElement.classList.add('circle-live');

  var STOPS = 5;
  var stage = document.getElementById('stage');
  var chairs = [].slice.call(stage.querySelectorAll('.chair'));
  var tops = chairs.map(function (c) { return c.querySelector('.chair__top'); });
  var voices = [].slice.call(stage.querySelectorAll('.voice'));
  var title = stage.querySelector('.stage__title');
  var disc = document.getElementById('disc');
  var finalPanel = document.getElementById('final');
  var ripples = [].slice.call(stage.querySelectorAll('.ripples i'));
  var track = stage.querySelector('.track');
  var RINGS = [1, 2, 2, 3, 3];
  /* Pulled into a ring by people, not placed by a computer: [turn in degrees, drift in px] */
  var HAND = [[-4, 3], [3, -5], [-2, 4], [5, -3], [-3, 4], [2, 0]];

  var g = {}; // geometry
  var state = { p: 0 };
  var current = -1;
  var finalOn = false;
  var titleOn = true;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function ease(t) { return t * t * (3 - 2 * t); }

  function layout() {
    var W = stage.clientWidth, H = stage.clientHeight;
    g.W = W; g.H = H;
    g.wide = W >= 1100 && H >= 560;
    if (g.wide) {
      var gutter = clamp(W * 0.05, 20, 72);
      g.L = Math.max(gutter, (W - 1440) / 2 + gutter);
      g.R = Math.min(H * 0.33, W * 0.19);
      g.S = g.R * 0.62;
      g.cx = W - g.L - g.R - g.S / 2;
      g.cy = H / 2;
      g.A = 180;
      g.base = g.cy; g.stops = [g.cy, g.cy, g.cy, g.cy, g.cy, g.cy];
      g.finalX = g.cx; g.finalY = g.cy; g.finalK = Math.min(2.8, (H * 0.6) / g.S);
      stage.style.setProperty('--L', g.L + 'px');
      stage.style.setProperty('--copy-w', Math.round(g.cx - g.R - g.S / 2 - g.L - 32) + 'px');
    } else {
      g.R = clamp(W * 0.62, 210, 420);
      g.S = Math.min(g.R * 0.62, 200);
      g.cx = W / 2;
      g.A = -90;
      stage.style.setProperty('--copy-h', H + 'px');
      /* The ring sits right under each quote: a quiet voice leaves more of the ring in view, a loud one pushes it down */
      var stageTop = stage.getBoundingClientRect().top;
      var voicesTop = stage.querySelector('.voices').getBoundingClientRect().top - stageTop;
      var lowest = H - g.S * 1.1 - 12;
      g.stops = voices.map(function (v) {
        return Math.min(voicesTop + v.offsetHeight + 20, lowest) + g.S * 0.55 + g.R;
      });
      g.stops.push(g.stops[STOPS - 1]);
      g.base = g.stops[0];
      g.cy = g.base;
      var formEnd = finalPanel.querySelector('.final__note').getBoundingClientRect().bottom - stage.getBoundingClientRect().top;
      g.finalX = g.cx; g.finalY = (formEnd + H) / 2 + 6;
      g.finalK = Math.min(clamp((H - formEnd - 20) / g.S, 0.9, 2.2), (W * 0.86) / g.S);
    }
    g.D = 2.5 * Math.hypot(W, H);
    stage.style.setProperty('--S', g.S + 'px');
    stage.style.setProperty('--R', g.R + 'px');
    stage.style.setProperty('--D', g.D + 'px');
    stage.style.setProperty('--cx', g.cx + 'px');
    stage.style.setProperty('--cy', g.base + 'px');
    render();
  }

  function slot(a, drift) {
    var r = (a * Math.PI) / 180, R = g.R + (drift || 0);
    return { x: g.cx + R * Math.cos(r), y: g.cy + R * Math.sin(r) };
  }

  function render() {
    var P = state.p * STOPS;
    var low = clamp(Math.floor(P), 0, STOPS);
    g.cy = g.stops[low] + (g.stops[Math.min(low + 1, STOPS)] - g.stops[low]) * (P - low);
    track.style.transform = 'translateY(' + (g.cy - g.base) + 'px)';
    chairs.forEach(function (ch, i) {
      var a = g.A + (i - P) * 60;
      var pos = slot(a, HAND[i][1]);
      var rot = a + 90 + HAND[i][0];
      var d = Math.abs(i - P);
      var near = Math.max(0, 1 - d);
      var k = 1 + 0.1 * near;
      var x = pos.x, y = pos.y;
      if (i === STOPS) {
        var e = ease(clamp((P - 4.15) / 0.85, 0, 1));
        var dPos = slot(a, 0);
        var dk = ease(clamp((P - 4) / 1, 0, 1));
        var s = dk * dk * dk;
        disc.style.transform = 'translate(' + (dPos.x - g.D / 2) + 'px,' + (dPos.y - g.D / 2) + 'px) scale(' + s + ')';
        x += (g.finalX - x) * e;
        y += (g.finalY - y) * e;
        rot += (-3 - rot) * e;
        k += (g.finalK - k) * e;
      }
      ch.style.transform = 'translate(' + (x - g.S / 2) + 'px,' + (y - g.S / 2) + 'px) rotate(' + rot + 'deg) scale(' + k + ')';
      ch.style.opacity = i === STOPS ? 0.8 + 0.2 * near : 0.62 + 0.38 * near;
      tops[i].style.transform = 'rotate(' + (-rot + (i === STOPS ? -5 : HAND[i][0])) + 'deg)';
    });
    announce(P);
  }

  function announce(P) {
    var idx = P > 4.4 ? -1 : Math.round(P);
    if (idx !== current) {
      voices.forEach(function (v, i) {
        gsap.to(v, i === idx
          ? { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out', startAt: { y: 10 }, overwrite: true }
          : { autoAlpha: 0, duration: 0.2, overwrite: true });
      });
      if (idx >= 0) ripple(idx);
      current = idx;
    }
    var active = clamp(Math.round(P), 0, STOPS);
    chairs.forEach(function (c, i) { c.tabIndex = i === active ? 0 : -1; });
    var showTitle = P <= 4.4;
    if (showTitle !== titleOn) { titleOn = showTitle; gsap.to(title, { autoAlpha: showTitle ? 1 : 0, duration: 0.2, overwrite: true }); }
    var showFinal = P >= 4.8 || document.activeElement === input;
    if (showFinal !== finalOn) {
      finalOn = showFinal;
      finalPanel.inert = !showFinal;
      gsap.to(finalPanel, { autoAlpha: showFinal ? 1 : 0, y: 0, duration: 0.25, overwrite: true, startAt: showFinal ? { y: 10 } : {} });
    }
  }

  function ripple(i) {
    var at = slot(g.A, 0);
    ripples.forEach(function (r, n) {
      gsap.killTweensOf(r);
      gsap.set(r, { opacity: 0 });
      if (n < RINGS[i]) {
        gsap.fromTo(r,
          { x: at.x - g.S / 2, y: at.y - g.S / 2, scale: 0.8, opacity: 0.55 },
          { scale: 2.5 + n * 0.5, opacity: 0, duration: 1.15, delay: n * 0.14, ease: 'power2.out' });
      }
    });
  }

  layout();
  finalPanel.inert = true;

  /* Dragging, tweening or typing holds the snap back */
  var busy = false;
  var st = gsap.to(state, {
    p: 1, ease: 'none', onUpdate: render,
    scrollTrigger: {
      trigger: circle, start: 'top top', end: 'bottom bottom', scrub: 0.4,
      snap: {
        snapTo: function (v) { return busy || document.activeElement === input ? v : Math.round(v * STOPS) / STOPS; },
        duration: { min: 0.2, max: 0.4 }, delay: 0.08, ease: 'power2.inOut', inertia: false
      }
    }
  }).scrollTrigger;

  addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); ScrollTrigger.refresh(); });

  function stopY(i) { return st.start + (clamp(i, 0, STOPS) / STOPS) * (st.end - st.start); }
  var scroller = { y: 0 };
  function goTo(i) {
    scroller.y = scrollY;
    busy = true;
    gsap.to(scroller, {
      y: stopY(i), duration: 0.55, ease: 'power2.inOut', overwrite: true,
      onUpdate: function () { scrollTo(0, scroller.y); },
      onComplete: function () { busy = false; }
    });
  }

  /* Sideways drag becomes page scroll, so scroll and swipe share one state */
  var drag = null, justDragged = false;
  stage.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    if (e.target.closest('input, a, label')) return;
    if (e.pointerType === 'mouse' && !e.target.closest('.chair')) return;
    gsap.killTweensOf(scroller);
    drag = { x: e.clientX, y: e.clientY, sy: scrollY, on: false, id: e.pointerId, lastX: e.clientX, v: 0, t: e.timeStamp };
  });
  addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      drag.on = true; busy = true;
    }
    var dt = Math.max(1, e.timeStamp - drag.t);
    drag.v = (e.clientX - drag.lastX) / dt; drag.lastX = e.clientX; drag.t = e.timeStamp;
    var perStop = Math.min(g.W * 0.5, 220);
    var stepPx = (st.end - st.start) / STOPS;
    scrollTo(0, clamp(drag.sy - (dx / perStop) * stepPx, st.start, st.end));
  });
  function endDrag(e) {
    if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.id)) return;
    var was = drag; drag = null;
    if (!was.on) { return; }
    justDragged = true; setTimeout(function () { justDragged = false; }, 60);
    var pos = ((scrollY - st.start) / (st.end - st.start)) * STOPS;
    var flick = Math.abs(was.v) > 0.25 ? (was.v < 0 ? 0.35 : -0.35) : 0;
    goTo(Math.round(pos + flick));
  }
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  chairs.forEach(function (c, i) {
    c.addEventListener('click', function () { if (!justDragged) goTo(i); });
    c.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      var t = clamp(i + d, 0, STOPS);
      goTo(t);
      chairs.forEach(function (x, n) { x.tabIndex = n === t ? 0 : -1; });
      chairs[t].focus({ preventScroll: true });
    });
  });

  /* Phone keyboard: bring the field back into view once the keyboard has opened */
  input.addEventListener('focus', function () {
    if (!matchMedia('(pointer: coarse)').matches) return;
    setTimeout(function () {
      var vv = window.visualViewport;
      if (vv && input.getBoundingClientRect().bottom > vv.height) input.scrollIntoView({ block: 'center' });
    }, 300);
  });
})();
