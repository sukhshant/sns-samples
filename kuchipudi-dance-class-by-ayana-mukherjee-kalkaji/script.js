(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* scroll reveal */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* current section in the top menu */
  var links = $$('.bar nav a');
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['trial', 'ayana', 'reviews', 'visit'].forEach(function (id) { var s = document.getElementById(id); if (s) nio.observe(s); });
  }

  /* the plate */
  var stage = $('#stage'), disc = $('#disc'), feet = $('#feet'), live = $('#liveText');
  var send = $('#send'), nameEl = $('#who-name'), forEl = $('#who-for');
  if (!stage || !disc) return;
  var bells = $$('.bell', disc), tags = $$('.tag', disc);
  var EASE = 'cubic-bezier(.45,0,.15,1)';
  var DUR = reduce ? 0 : 700;
  var target = bells.map(function (b) { return 180 - parseFloat(b.dataset.a); }); /* rotation that puts this bell at the bottom */
  var sel = 2, rot = 0, timer = null, justDragged = false;

  function apply(r, ms) {
    var t = ms ? 'transform ' + ms + 'ms ' + EASE : 'none';
    disc.style.transition = t;
    disc.style.transform = 'rotate(' + r + 'deg)';
    tags.forEach(function (g) {
      var b = g.firstElementChild;
      b.style.transition = t;
      b.style.transform = 'rotate(' + (-r) + 'deg)';
    });
  }
  function message() {
    var b = bells[sel], nm = (nameEl.value || '').trim() || '___';
    var who = forEl.value === 'My child' ? ' The dancer is my child.' : forEl.value === 'Adult beginner' ? ' The dancer is an adult beginner.' : '';
    return "Hello Ayana Ma'am, I would like to try a Kuchipudi trial class on " + b.dataset.day + ', ' + b.dataset.time + '. My name is ' + nm + '.' + who + ' Is the batch open?';
  }
  function updateLink() { send.href = 'https://wa.me/918376952295?text=' + encodeURIComponent(message()); }
  function setLive() {
    var b = bells[sel];
    live.textContent = b.dataset.day + ', ' + b.dataset.time;
    live.classList.remove('swap'); void live.offsetWidth; live.classList.add('swap');
  }
  function arrive() {
    feet.classList.remove('lit'); void feet.getBoundingClientRect(); feet.classList.add('lit');
    var b = bells[sel]; b.classList.remove('sw'); void b.offsetWidth; b.classList.add('sw');
  }
  function mark() {
    bells.forEach(function (b, i) { b.classList.toggle('on', i === sel); b.setAttribute('aria-pressed', i === sel ? 'true' : 'false'); });
    updateLink();
  }
  function go(i, ms) {
    var d = (((target[i] - rot) % 360) + 540) % 360 - 180;
    sel = i; mark(); setLive();
    var dur = ms == null ? DUR : ms;
    clearTimeout(timer);
    feet.classList.remove('lit');
    rot += d;
    apply(rot, dur);
    if (dur) timer = setTimeout(arrive, dur); else arrive();
  }

  bells.forEach(function (b, i) {
    b.addEventListener('click', function () { if (justDragged) return; go(i); });
  });
  [nameEl, forEl].forEach(function (el) { el.addEventListener('input', updateLink); el.addEventListener('change', updateLink); });

  /* drag the plate */
  var drag = null;
  function ang(e, c) { return Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI; }
  disc.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    var r = stage.getBoundingClientRect();
    var c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    drag = { c: c, last: ang(e, c), acc: 0, rot0: rot, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
  });
  disc.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
      drag.moved = true; drag.last = ang(e, drag.c);
      try { disc.setPointerCapture(e.pointerId); } catch (_) {}
      disc.classList.add('drag'); clearTimeout(timer); feet.classList.remove('lit');
    }
    var a = ang(e, drag.c), d = a - drag.last;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    drag.acc += d; drag.last = a;
    rot = drag.rot0 + drag.acc;
    apply(rot, 0);
  });
  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var was = drag.moved; drag = null;
    disc.classList.remove('drag');
    if (!was) return;
    justDragged = true; setTimeout(function () { justDragged = false; }, 60);
    var best = 0, bd = 1e9;
    target.forEach(function (t, i) {
      var d = Math.abs((((t - rot) % 360) + 540) % 360 - 180);
      if (d < bd) { bd = d; best = i; }
    });
    go(best, reduce ? 0 : 600);
  }
  disc.addEventListener('pointerup', end);
  disc.addEventListener('pointercancel', end);

  /* first view: one full turn that settles on Sunday */
  mark(); updateLink(); feet.classList.add('lit');
  if (!reduce && 'IntersectionObserver' in window) {
    var intro = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      intro.disconnect();
      if (rot !== 0) return;
      feet.classList.remove('lit');
      rot = 360; apply(rot, 1400);
      timer = setTimeout(arrive, 1400);
    }, { threshold: 0.55 });
    intro.observe(stage);
  } else { arrive(); }
})();
