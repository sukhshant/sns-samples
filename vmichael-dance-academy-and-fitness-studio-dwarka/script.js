(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var PHONE = '919873467242';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var el = function (name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  /* ---------- Step Sheet ---------- */
  var stage = $('#stage');
  if (stage) {
    stage.hidden = false;
    var svg = $('#floor'), gSpots = $('#spots'), gPrints = $('#prints'), trail = $('#trail');
    var groups = $$('.group'), finish = $('#finish'), confirmBtn = $('#confirm'), resetBtn = $('#reset');
    var hoursline = $('#hoursline');
    var picks = [null, null, null];
    var hoursFor = null;
    var active = 1;
    var timers = [];
    var segs = [];
    var spotEls = [];
    var pts, R = 32;

    var LAYOUTS = {
      phone: { vb: [360, 340], start: [190, 366], spots: [[95, 280], [265, 206], [95, 132], [265, 62]] },
      wide: { vb: [760, 400], start: [10, 440], spots: [[135, 290], [310, 150], [490, 290], [655, 140]] }
    };
    var mq = window.matchMedia('(min-width: 768px)');

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function norm(a, b) { var x = b[0] - a[0], y = b[1] - a[1], l = Math.sqrt(x * x + y * y) || 1; return [x / l, y / l]; }
    function count() { var n = 0; while (n < 3 && picks[n]) n++; return n; }

    function build() {
      var L = mq.matches ? LAYOUTS.wide : LAYOUTS.phone;
      svg.setAttribute('viewBox', '0 0 ' + L.vb[0] + ' ' + L.vb[1]);
      pts = [L.start].concat(L.spots);
      trail.setAttribute('d', 'M' + pts.map(function (p) { return p.join(' '); }).join(' L'));
      gPrints.textContent = '';
      gSpots.textContent = '';
      segs = [];
      for (var s = 0; s < 4; s++) {
        var a = pts[s], b = pts[s + 1];
        var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy);
        var ux = dx / len, uy = dy / len, ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        var from = s === 0 ? 0 : R + 16, to = R + 18;
        var g = el('g', {}, gPrints);
        var list = [];
        for (var i = 0; i < 6; i++) {
          var d = from + (len - from - to) * (i + 0.5) / 6;
          var side = i % 2 ? 1 : -1;
          var x = a[0] + ux * d + (-uy) * side * 10;
          var y = a[1] + uy * d + (ux) * side * 10;
          var outer = el('g', { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')' + (side < 0 ? ' scale(-1 1)' : '') }, g);
          var inner = el('g', { 'class': 'pr' }, outer);
          el('use', { href: '#fp', x: -11, y: -22, width: 22, height: 44 }, inner);
          list.push(inner);
        }
        segs.push(list);
      }
      spotEls = [];
      var names = ['1', '2', '3', 'VM'];
      var labels = ['Class', 'Day', 'Time', 'Studio'];
      L.spots.forEach(function (p, i) {
        var g = el('g', { 'class': 'spot' + (i === 3 ? ' vm' : ''), tabindex: i === 3 ? '-1' : '0', role: i === 3 ? 'img' : 'button', 'aria-label': i === 3 ? 'Studio' : 'Step ' + (i + 1) + ': ' + labels[i] }, gSpots);
        var hit = el('g', { 'class': 'hit' }, g);
        el('circle', { 'class': 'halo', cx: p[0], cy: p[1], r: R + 2 }, g);
        el('circle', { 'class': 'ring', cx: p[0], cy: p[1], r: R }, hit);
        el('circle', { 'class': 'fillc', cx: p[0], cy: p[1], r: R }, hit);
        var t = el('text', { 'class': 'num', x: p[0], y: p[1] + 1 }, hit);
        t.textContent = names[i];
        var lx, ly;
        var prev = pts[i], next = pts[i + 2];
        var v0 = norm(p, prev), v1 = next ? norm(p, next) : [0.3, 1.2];
        var dx = next ? -(v0[0] + v1[0]) : v1[0], dy = next ? -(v0[1] + v1[1]) : v1[1];
        var dl = Math.sqrt(dx * dx + dy * dy);
        if (dl < 0.3) { dx = 0; dy = 1; dl = 1; }
        lx = Math.max(46, Math.min(L.vb[0] - 46, p[0] + dx / dl * (R + 24)));
        ly = p[1] + dy / dl * (R + 20) + 5;
        ly = Math.max(40, Math.min(L.vb[1] - 8, ly));
        var pk = el('text', { 'class': 'pick', x: lx.toFixed(1), y: ly.toFixed(1) }, g);
        pk.textContent = i === 3 ? 'Studio' : (picks[i] || '');
        if (i < 3) {
          g.addEventListener('click', function () { openStep(Math.min(i + 1, count() + 1)); });
          g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStep(Math.min(i + 1, count() + 1)); } });
        }
        spotEls.push(g);
      });
      render(true);
    }

    function render(instant) {
      var n = count();
      spotEls.forEach(function (g, i) {
        if (i < 3) {
          g.classList.toggle('done', !!picks[i] && (instant || g.classList.contains('done') || false));
          if (instant && picks[i]) g.classList.add('done');
          g.classList.toggle('active', active === i + 1);
          g.classList.toggle('lock', i + 1 > n + 1);
          $('.pick', g).textContent = picks[i] || '';
        }
      });
      if (instant) {
        segs.forEach(function (list, i) {
          var show = i < n || (i === 3 && n === 3);
          list.forEach(function (p) { p.classList.toggle('on', show); p.style.setProperty('--d', '0ms'); });
        });
        spotEls[3].classList.toggle('done', n === 3);
        finish.hidden = n < 3;
      }
      groups.forEach(function (g) { g.hidden = +g.dataset.step !== active; });
      $$('.group').forEach(function (g) {
        var s = +g.dataset.step;
        $$('button', g).forEach(function (b) {
          b.setAttribute('aria-pressed', picks[s - 1] === b.dataset.v ? 'true' : 'false');
        });
      });
      var morning = $('.group[data-step="3"] button[data-v="Morning"]');
      morning.disabled = picks[1] === 'Sunday';
      resetBtn.hidden = !picks[0];
      var dayBtn = picks[1] && $('.group[data-step="2"] button[data-v="' + picks[1] + '"]');
      hoursline.textContent = dayBtn ? 'Open ' + dayBtn.dataset.h : '';
      var text = "Hi V.Michael Dance Academy! I'd like a trial class." + (n === 3 ? ' Class: ' + picks[0] + '. Day: ' + picks[1] + '. Time: ' + picks[2] + '. Please confirm.' : '');
      confirmBtn.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text);
    }

    function play(list, delay) {
      list.forEach(function (p, i) {
        p.classList.remove('on');
        void p.getBoundingClientRect();
        p.style.setProperty('--d', (delay + i * 45) + 'ms');
        p.classList.add('on');
      });
    }

    function walk(step) {
      clearTimers();
      var n = count();
      var k = step - 1;
      var order = [];
      for (var i = 0; i < 4; i++) {
        var exists = i < n || (i === 3 && n === 3);
        if (!exists) segs[i].forEach(function (p) { p.classList.remove('on'); });
        else if (i >= k) order.push(i);
      }
      var t = 0, SEG = reduce ? 0 : 470;
      finish.hidden = true;
      order.forEach(function (i) {
        if (reduce) { segs[i].forEach(function (p) { p.classList.add('on'); }); }
        else play(segs[i], t);
        var at = t + SEG;
        if (i < 3) later(function () { spotEls[i].classList.add('done'); }, at);
        else later(function () {
          spotEls[3].classList.add('done');
          spotEls[3].classList.remove('pulse'); void spotEls[3].getBoundingClientRect(); spotEls[3].classList.add('pulse');
        }, at);
        t = at + (reduce ? 0 : 40);
      });
      for (var j = n; j < 4; j++) if (j < 3 && !picks[j]) spotEls[j].classList.remove('done');
      if (n < 3) spotEls[3].classList.remove('done');
      if (n === 3) later(function () { finish.hidden = false; }, t + (reduce ? 0 : 150));
    }

    function openStep(s) {
      active = s;
      render(false);
    }

    function pick(step, value) {
      picks[step - 1] = value;
      if (step === 2 && value === 'Sunday' && picks[2] === 'Morning') picks[2] = null;
      var n = count();
      active = Math.min(step + 1, 3);
      if (step === 3 && n < 3) active = 3;
      render(false);
      walk(step);
    }

    $$('.choices button').forEach(function (b) {
      b.addEventListener('click', function () {
        var step = +b.closest('.group').dataset.step;
        pick(step, b.dataset.v);
      });
    });

    resetBtn.addEventListener('click', function () {
      clearTimers();
      picks = [null, null, null];
      active = 1;
      spotEls.forEach(function (g) { g.classList.remove('done', 'pulse'); });
      segs.forEach(function (l) { l.forEach(function (p) { p.classList.remove('on'); }); });
      finish.hidden = true;
      render(false);
    });

    var onMq = function () { build(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);
    build();

    /* tiles pre-select the class and jump to the sheet */
    $$('.tile').forEach(function (t) {
      t.addEventListener('click', function () {
        var v = t.dataset.v;
        $('#book').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        setTimeout(function () { pick(1, v); }, reduce ? 0 : 550);
      });
    });
  }

  /* ---------- nav highlight ---------- */
  var links = $$('.bar nav a');
  var navEl = $('.bar nav');
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('on'); a.removeAttribute('aria-current'); });
        var a = map[e.target.id];
        if (a) {
          a.classList.add('on'); a.setAttribute('aria-current', 'true');
          if (navEl.scrollWidth > navEl.clientWidth) navEl.scrollTo({ left: Math.max(0, a.offsetLeft - 24), behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });

    /* reveal on scroll */
    var rvs = $$('.wow h2,.wow .sub,.classes h2,.led,.wide,.rlist figure,.visit h2,address,.hours,.visit .row,.map');
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { threshold: 0.08 });
    rvs.forEach(function (n, i) { n.classList.add('rv'); n.style.transitionDelay = (n.closest('.rlist') ? (i % 3) * 70 : 0) + 'ms'; ro.observe(n); });
  }

  /* ---------- today's hours ---------- */
  var rows = $$('.hours tr');
  if (rows.length === 7) rows[(new Date().getDay() + 6) % 7].classList.add('today');
})();
