(function () {
  'use strict';
  var WA = 'https://wa.me/919971002039?text=';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* menu (phones) */
  var btn = $('.menu-btn'), menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', function (e) {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) setMenu(false);
  });

  /* reveal on scroll */
  var rvs = $$('.rv'), wow = $('.wow');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (el) { io.observe(el); });
    var wo = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { wow.classList.add('in'); wo.disconnect(); }
    }, { threshold: 0.25 });
    wo.observe($('.strip'));
  } else {
    rvs.forEach(function (el) { el.classList.add('in'); });
    wow.classList.add('in');
  }

  /* Paint your week */
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  var FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  var days = $$('.day'), sws = $$('.sw'), tms = $$('.tm');
  var send = $('.send'), sum = $('.sum'), box = $('.box');
  var state = [null, null, null, null, null];
  var sel = null;
  var time = 'Morning (7-12)';
  var DEFAULT = send.getAttribute('href');

  days.forEach(function (d, i) { d.style.setProperty('--n', i); });

  function swOf(k) { return sws.filter(function (s) { return s.dataset.k === k; })[0]; }

  function select(k) {
    sel = k;
    sws.forEach(function (s) { s.setAttribute('aria-pressed', s.dataset.k === k ? 'true' : 'false'); });
  }

  function pulse(el) {
    if (reduce) return;
    el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge');
    setTimeout(function () { el.classList.remove('nudge'); }, 450);
  }

  function summary() {
    var parts = [];
    state.forEach(function (k, i) { if (k) parts.push(DAYS[i] + ' ' + swOf(k).dataset.name); });
    sum.textContent = parts.length ? 'Your week: ' + parts.join(', ') : 'Pick a colour, then tap a day.';
    var ok = parts.length > 0;
    if (ok) {
      var msg = "Hi Pooja ma'am, I'd like a trial class. My week: " + parts.join(', ') + '. Time: ' + time + '. Please tell me what suits.';
      send.href = WA + encodeURIComponent(msg);
      send.removeAttribute('aria-disabled');
      send.removeAttribute('title');
    } else {
      send.href = DEFAULT;
      send.setAttribute('aria-disabled', 'true');
      send.title = 'Paint at least one day';
    }
  }

  function paint(i, k) {
    var d = days[i];
    var olds = $$('.fill', d);
    var cls = $('.cls', d);
    if (!k) {
      olds.forEach(function (f) {
        f.classList.remove('in');
        setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, reduce ? 0 : 450);
      });
      d.classList.remove('on');
      cls.textContent = 'free';
      d.setAttribute('aria-label', FULL[i] + ', free');
      return;
    }
    var s = swOf(k);
    var f = document.createElement('i');
    f.className = 'fill';
    f.style.setProperty('--c', s.style.getPropertyValue('--c'));
    d.insertBefore(f, d.firstChild.nextSibling);
    d.style.setProperty('--c', s.style.getPropertyValue('--c'));
    d.style.setProperty('--ink-c', s.style.getPropertyValue('--ink'));
    d.classList.add('on');
    cls.textContent = s.dataset.name;
    d.setAttribute('aria-label', FULL[i] + ', ' + s.dataset.name);
    void f.offsetWidth;
    f.classList.add('in');
    setTimeout(function () { olds.forEach(function (o) { if (o.parentNode) o.parentNode.removeChild(o); }); }, reduce ? 0 : 450);
  }

  sws.forEach(function (s) {
    s.addEventListener('click', function () { select(s.dataset.k); });
  });

  days.forEach(function (d, i) {
    d.addEventListener('click', function () {
      if (!sel) { pulse($('.swatches')); sws.forEach(function (s) { pulse(s); }); return; }
      if (state[i] === sel) { state[i] = null; } else { state[i] = sel; }
      paint(i, state[i]);
      summary();
    });
  });

  tms.forEach(function (t) {
    t.addEventListener('click', function () {
      time = t.dataset.t;
      tms.forEach(function (x) { x.setAttribute('aria-pressed', x === t ? 'true' : 'false'); });
      summary();
    });
  });

  send.addEventListener('click', function (e) {
    if (send.getAttribute('aria-disabled') === 'true') { e.preventDefault(); pulse(send); days.forEach(function (d) { pulse(d); }); }
  });

  /* tiles jump to the plan with the swatch pre-selected */
  $$('.tile').forEach(function (t) {
    t.addEventListener('click', function () { select(t.dataset.k); });
  });

  summary();
})();
