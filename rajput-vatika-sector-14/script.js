(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* image fallback: midnight block with the venue name */
  $$('img').forEach(function (img) {
    var fail = function () { var p = img.parentNode; if (p) p.classList.add('imgfail'); };
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
  });

  /* fade-up reveal */
  var rev = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add('in'); });

  /* active section in the menu */
  var links = $$('.top nav a');
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('on'); a.removeAttribute('aria-current'); });
        var a = map[e.target.id];
        if (a) { a.classList.add('on'); a.setAttribute('aria-current', 'true'); if (a.scrollIntoView && a.parentNode.scrollWidth > a.parentNode.clientWidth) { var n = a.parentNode; n.scrollTo({ left: a.offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' }); } }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) nio.observe(s); });
  }

  /* ---------- the wow: Din se Shaam ---------- */
  var stage = $('#stage'), range = $('#time');
  if (!stage || !range) return;
  var night = $('.layer.night', stage), tint = $('.tint', stage), glow = $('.glow', stage);
  var sun = $('.orb.sun', stage), moon = $('.orb.moon', stage), lights = $('#lights');
  var presets = $$('.times button');
  var evSel = $('#f-event'), dateIn = $('#f-date'), guestIn = $('#f-guests'), send = $('#send');
  var live = $$('.wa-live');
  var NS = 'http://www.w3.org/2000/svg';
  var touched = false;

  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var smooth = function (v) { v = clamp(v); return v * v * (3 - 2 * v); };
  var bell = function (p, c, w) { var x = (p - c) / w; return Math.exp(-x * x); };

  /* fairy lights: four swags, bulbs placed along each curve */
  (function () {
    var w = document.createElementNS(NS, 'path'), d = 'M0 6', bulbs = [], i, s, k;
    w.setAttribute('class', 'wire');
    for (s = 0; s < 4; s++) {
      var x0 = s * 300, x1 = x0 + 150, x2 = x0 + 300;
      d += ' Q' + x1 + ' 128 ' + x2 + ' 6';
      for (k = 1; k < 7; k++) {
        var t = k / 7, u = 1 - t;
        bulbs.push([u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * 6 + 2 * u * t * 128 + t * t * 6]);
      }
    }
    w.setAttribute('d', d);
    lights.appendChild(w);
    for (i = 0; i < bulbs.length; i++) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', bulbs[i][0].toFixed(1));
      c.setAttribute('cy', (bulbs[i][1] + 7).toFixed(1));
      c.setAttribute('r', 6.5);
      c.setAttribute('class', 'b g' + (i % 3));
      lights.appendChild(c);
    }
  })();

  function labelFor(p) { return p < 0.34 ? 'Afternoon' : p < 0.67 ? 'Dusk' : 'Evening'; }
  function phaseFor(p) { return p < 0.34 ? 0 : p < 0.67 ? 1 : 2; }

  var current = 0;
  function render(v) {
    current = v;
    var p = v / 100, H = stage.clientHeight || 400;
    night.style.opacity = smooth((p - 0.2) / 0.6).toFixed(3);
    tint.style.opacity = (0.5 * bell(p, 0.4, 0.22)).toFixed(3);
    glow.style.opacity = (0.8 * bell(p, 0.42, 0.18)).toFixed(3);
    lights.style.opacity = smooth((p - 0.5) / 0.4).toFixed(3);
    var sd = smooth(p / 0.75);
    sun.style.opacity = (1 - smooth((p - 0.35) / 0.3)).toFixed(3);
    sun.style.transform = 'translate3d(0,' + (sd * H * 0.5).toFixed(1) + 'px,0) scale(' + (1 + 0.15 * sd).toFixed(3) + ')';
    var mu = smooth((p - 0.6) / 0.4);
    moon.style.opacity = mu.toFixed(3);
    moon.style.transform = 'translate3d(0,' + ((1 - mu) * H * 0.18).toFixed(1) + 'px,0)';
    range.style.setProperty('--p', v + '%');
    var ph = phaseFor(p), lab = labelFor(p);
    range.setAttribute('data-phase', ph);
    stage.setAttribute('data-phase', ph);
    range.setAttribute('aria-valuetext', lab);
    presets.forEach(function (b, i) { b.setAttribute('aria-pressed', i === ph ? 'true' : 'false'); });
    updateLinks();
  }

  function compose() {
    var lab = labelFor(current / 100).toLowerCase();
    var ev = evSel.value;
    var what = !ev || ev === 'Other' ? 'an event' : 'a ' + ev.toLowerCase();
    var t = 'Hello Rajput Vatika, I am looking at your lawn for ' + what;
    if (dateIn.value) {
      var a = dateIn.value.split('-');
      var dt = new Date(+a[0], +a[1] - 1, +a[2]);
      if (!isNaN(dt)) t += ' on ' + dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    var g = parseInt(guestIn.value, 10);
    if (g > 0) t += ' for about ' + g + ' guests';
    t += ', in the ' + lab + ' light. Could you share a rough quote?';
    return 'https://wa.me/919899215958?text=' + encodeURIComponent(t);
  }
  function updateLinks() {
    var href = compose();
    send.setAttribute('href', href);
    if (touched) live.forEach(function (a) { a.setAttribute('href', href); });
  }

  var raf = 0;
  function set(v) { range.value = v; render(+range.value); }
  function tween(to) {
    cancelAnimationFrame(raf);
    touched = true;
    var from = +range.value;
    if (reduce || from === to) return set(to);
    var t0 = performance.now(), dur = 800;
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      set(Math.round(from + (to - from) * e));
      if (k < 1) raf = requestAnimationFrame(step);
    })(t0);
  }

  range.addEventListener('input', function () { cancelAnimationFrame(raf); touched = true; render(+range.value); });
  presets.forEach(function (b) { b.addEventListener('click', function () { tween(+b.getAttribute('data-v')); }); });
  [evSel, dateIn, guestIn].forEach(function (el) { el.addEventListener('input', function () { touched = true; updateLinks(); }); el.addEventListener('change', function () { touched = true; updateLinks(); }); });

  /* drag the picture itself, sideways */
  var drag = null;
  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    cancelAnimationFrame(raf);
    drag = { x: e.clientX, v: +range.value, w: stage.clientWidth, id: e.pointerId };
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    touched = true;
    set(Math.max(0, Math.min(100, Math.round(drag.v + (e.clientX - drag.x) / drag.w * 120))));
  });
  var end = function (e) { if (drag && e.pointerId === drag.id) drag = null; };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  var today = new Date();
  dateIn.min = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
  window.addEventListener('resize', function () { render(+range.value); });
  render(+range.value);

  /* one gentle nudge of the handle the first time it comes into view */
  if (!reduce && 'IntersectionObserver' in window) {
    var nio2 = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        range.classList.add('nudge');
        nio2.disconnect();
      }
    }, { threshold: 0.9 });
    nio2.observe(range);
  }
})();
