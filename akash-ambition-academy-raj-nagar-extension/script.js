(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { cls: '10', board: 'CBSE' };
  var live = document.getElementById('boardLive');
  var wipe = document.getElementById('wipe');
  var send = document.getElementById('send');
  var token = 0;

  // reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (r) { io.observe(r); });
  } else reveals.forEach(function (r) { r.classList.add('in'); });

  function topics() {
    var n = +state.cls;
    if (n <= 10) return ['Maths', 'Science'];
    return ['Maths, Physics, Chemistry, Biology,', 'Economics, Accounts, Statistics, CS'];
  }

  function text(str, y, cls) {
    var t = document.createElementNS(NS, 'text');
    t.setAttribute('x', 24); t.setAttribute('y', y);
    t.setAttribute('class', 'bt live-line ' + cls);
    t.textContent = str;
    return t;
  }

  function write(instant) {
    while (live.firstChild) live.removeChild(live.firstChild);
    var t = topics();
    var wide = +state.cls > 10;
    var head = 'Class ' + state.cls + ' - ' + state.board + ' - Maths';
    var els = [text(head, 80, 'bt-main')];
    var ul = document.createElementNS(NS, 'path');
    ul.setAttribute('d', 'M22 98 C 90 92, 170 104, 250 96 S 340 100, 372 95');
    ul.setAttribute('class', 'ul');
    var l2 = text(t[0], 160, 'bt-sub' + (wide ? ' wide' : ''));
    var l3 = text(t[1], 200, 'bt-sub' + (wide ? ' wide' : ''));
    els.push(ul, l2, l3);
    els.forEach(function (e) { live.appendChild(e); });
    var delays = [0, 0.75, 1.15, 1.7];
    var order = [els[0], ul, l2, l3];
    order.forEach(function (e, i) {
      if (instant) { e.style.animation = 'none'; e.style.strokeDashoffset = 0; e.style.fillOpacity = 1; return; }
      e.style.animationDelay = delays[i] + 's';
      if (e.tagName === 'text') e.style.animationDelay = delays[i] + 's,' + (delays[i] + 0.55) + 's';
      void e.getBoundingClientRect();
      e.classList.add('go');
    });
  }

  function link() {
    var msg = "Hi, I'm interested in Class " + state.cls + ' ' + state.board + ' at Akash Ambition Academy. Please share batch details.';
    send.href = 'https://wa.me/917503374541?text=' + encodeURIComponent(msg);
  }

  function sync() {
    document.querySelectorAll('.pill').forEach(function (p) {
      var g = p.parentNode.getAttribute('data-group');
      var cur = g === 'class' ? state.cls : state.board;
      p.setAttribute('aria-pressed', String(p.getAttribute('data-v') === cur));
    });
    var isc = document.querySelector('.pill[data-v="ISC"]');
    isc.disabled = +state.cls < 11;
    if (isc.disabled && state.board === 'ISC') { state.board = 'CBSE'; sync(); }
  }

  function update() {
    var my = ++token;
    sync(); link();
    if (reduce || !wipe.animate) { write(true); return; }
    var a = wipe.animate([{ transform: 'translateX(-110%)' }, { transform: 'translateX(0)' }, { transform: 'translateX(110%)' }],
      { duration: 520, easing: 'ease-in-out' });
    setTimeout(function () { if (my === token) write(false); }, 260);
    a.onfinish = function () { wipe.style.transform = 'translateX(-110%)'; };
  }

  document.querySelectorAll('.pill').forEach(function (p) {
    p.addEventListener('click', function () {
      if (p.disabled) return;
      var g = p.parentNode.getAttribute('data-group');
      var v = p.getAttribute('data-v');
      if (g === 'class') state.cls = v; else state.board = v;
      update();
    });
  });

  sync(); link(); write(reduce);
})();
