(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* photo fallback: wood block with wordmark */
  $$('.frame img').forEach(function (img) {
    var fail = function () { img.parentNode.classList.add('fail'); };
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ---------- the mat row ---------- */
  var days = [
    { s: 'M', n: 'Monday', c: '#4F8F8B' },
    { s: 'T', n: 'Tuesday', c: '#D9798C' },
    { s: 'W', n: 'Wednesday', c: '#8FB26B' },
    { s: 'T', n: 'Thursday', c: '#6B6FB0' },
    { s: 'F', n: 'Friday', c: '#E3A63B' }
  ];
  var weekend = [{ s: 'S', n: 'Saturday' }, { s: 'S', n: 'Sunday' }];

  function spiral() {
    var pts = [], turns = 3.2, steps = 90, i, t, r, a;
    for (i = 0; i <= steps; i++) {
      t = i / steps; a = t * turns * Math.PI * 2; r = 2 + t * 24;
      pts.push((i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1));
    }
    return pts.join('');
  }
  var SP = spiral();

  function matSvg(closed) {
    return '<svg viewBox="0 0 64 104" aria-hidden="true" focusable="false">' +
      '<path d="M4 30V84a28 12 0 0 0 56 0V30Z" fill="var(--mat)"/>' +
      '<path d="M4 30V84a28 12 0 0 0 56 0V30Z" fill="url(#matShade)"/>' +
      '<path d="M4 58h56v9H4z" fill="#17323A" opacity=".88"/>' +
      (closed ? '<path d="M4 40h56v6H4z" fill="#17323A" opacity=".88"/>' : '') +
      '<rect x="27" y="56" width="10" height="13" rx="2" fill="#FBF6EE" opacity=".85"/>' +
      '<ellipse cx="32" cy="30" rx="28" ry="16" fill="var(--mat)"/>' +
      '<ellipse cx="32" cy="30" rx="28" ry="16" fill="#fff" opacity=".2"/>' +
      '<g transform="translate(32 30) scale(1 .58)"><g class="spin"><path d="' + SP + '" fill="none" stroke="#17323A" stroke-opacity=".42" stroke-width="3.2" stroke-linecap="round"/></g></g>' +
      '</svg>';
  }

  var stage = $('.mat-stage');
  if (!stage) return;
  var matsEl = $('.mats', stage), weekEl = $('.weekend', stage), note = $('.note', stage);
  var rug = $('#rug'), dayName = $('.dayname', rug), confirm = $('.confirm', rug), fig = $('.figure', rug);
  var BASE = 'https://wa.me/918447115880?text=';
  var state = { day: null, class: null, time: null };
  var busy = false, timer;

  days.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mat'; b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', d.n); b.style.setProperty('--mat', d.c);
    b.innerHTML = matSvg(false) + '<span class="lbl">' + d.s + '</span>';
    b.addEventListener('click', function () { pick(i, b); });
    matsEl.appendChild(b);
  });
  weekend.forEach(function (d) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mat'; b.setAttribute('aria-label', d.n + ', closed');
    b.innerHTML = matSvg(true) + '<span class="lbl">' + d.s + '</span>';
    b.addEventListener('click', function () {
      note.textContent = 'Closed. Try a weekday.';
      b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    });
    weekEl.appendChild(b);
  });
  var tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = 'Closed'; weekEl.appendChild(tag);
  stage.hidden = false;

  var matBtns = $$('.mat', matsEl);

  function message() {
    var t = "Hi Yogshala! I'd like to book a trial class.";
    if (state.class && state.time && state.day) {
      t += ' Class: ' + state.class + '. Day: ' + state.day + '. Time: ' + state.time + '. My name: ';
    }
    return t;
  }
  function refresh(fromChoice) {
    var ready = !!(state.class && state.time && state.day);
    confirm.href = BASE + encodeURIComponent(message());
    confirm.setAttribute('aria-disabled', ready ? 'false' : 'true');
    fig.classList.toggle('show', ready);
    if (ready && fromChoice && !reduce) {
      confirm.classList.remove('pulse'); void confirm.offsetWidth; confirm.classList.add('pulse');
    }
  }

  function setX(btn) {
    var s = stage.getBoundingClientRect(), r = btn.getBoundingClientRect();
    rug.style.setProperty('--x', (r.left + r.width / 2 - s.left) + 'px');
  }

  function openFor(i, btn) {
    var d = days[i];
    state.day = d.n;
    rug.style.setProperty('--mat', d.c);
    dayName.textContent = d.n;
    rug.hidden = false;
    setX(btn);
    note.textContent = '';
    refresh(false);
    void rug.offsetWidth;
    rug.classList.remove('closing');
    rug.classList.add('open');
    busy = false;
  }

  function pick(i, btn) {
    if (busy) return;
    var wasOpen = rug.classList.contains('open');
    var same = btn.getAttribute('aria-pressed') === 'true';
    matBtns.forEach(function (m) { m.setAttribute('aria-pressed', m === btn && !same ? 'true' : 'false'); });
    clearTimeout(timer);
    if (wasOpen) {
      rug.classList.add('closing');
      rug.classList.remove('open');
      if (same) {
        state.day = null; note.textContent = '';
        timer = setTimeout(function () { rug.hidden = true; rug.classList.remove('closing'); refresh(false); }, reduce ? 0 : 300);
        return;
      }
      busy = true;
      timer = setTimeout(function () { openFor(i, btn); }, reduce ? 0 : 300);
    } else {
      openFor(i, btn);
    }
  }

  $$('.opts', rug).forEach(function (group) {
    var key = group.getAttribute('data-key');
    $$('.opt', group).forEach(function (o) {
      o.addEventListener('click', function () {
        $$('.opt', group).forEach(function (x) { x.setAttribute('aria-pressed', x === o ? 'true' : 'false'); });
        state[key] = o.getAttribute('data-v');
        refresh(true);
      });
    });
  });

  confirm.addEventListener('click', function (e) {
    if (confirm.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      note.textContent = 'Choose a class and a time first.';
    }
  });

  window.addEventListener('resize', function () {
    var on = $('.mat[aria-pressed="true"]', matsEl);
    if (on && !rug.hidden) setX(on);
  });

  /* ---------- reveal + active nav ---------- */
  if ('IntersectionObserver' in window) {
    var targets = $$('.hero-text > *, .classes h2, .tile, .wow h2, .mats-line, .rv-head, .rv-list li, .visit h2, .visit-info > *, .ph-wide, .map');
    targets.forEach(function (el) { el.classList.add('rv'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    targets.forEach(function (el, i) {
      el.style.transitionDelay = (el.classList.contains('tile') ? (i % 4) * 70 : 0) + 'ms';
      io.observe(el);
    });

    var links = $$('.top nav a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('on'); });
          var a = map[e.target.id];
          if (a) { a.classList.add('on'); var nv = a.parentNode; if (nv.scrollWidth > nv.clientWidth) nv.scrollLeft = a.offsetLeft - (nv.clientWidth - a.offsetWidth) / 2; }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }
})();
