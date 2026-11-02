(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var behavior = reduce ? 'auto' : 'smooth';
  var WA = 'https://wa.me/919810264002?text=';
  var FOLD_MS = 620, MOVE_MS = 460, DWELL_MS = 240;

  var rail = $('#rail'), token = $('#token'), fillA = $('#fill-a'), fillB = $('#fill-b');
  var terminal = $('#terminal'), slot = $('#slot'), select = $('#school'), bar = $('#bar');
  var who = $('#who'), status = $('#status'), boardWrap = $('#board'), grid = $('.line-grid');
  var stations = $$('.station', rail), labels = $$('.linelabel', rail);
  var nav = $('.nav');
  var FILL_H = 8000;

  /* ---------- Reveal ---------- */
  var reveals = $$('.reveal');
  var rio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(function (el) { rio.observe(el); });

  /* ---------- Split-flap board ---------- */
  var cells = $$('.cell').map(function (el) {
    var bs = el.querySelectorAll('b');
    return { el: el, top: bs[0], bot: bs[1], lt: bs[2], lb: bs[3], cur: bs[0].textContent === ' ' ? ' ' : bs[0].textContent, want: null, t1: 0, t2: 0 };
  });
  function show(ch) { return ch === ' ' ? ' ' : ch; }
  function flipCell(c, next, delay) {
    clearTimeout(c.t1); clearTimeout(c.t2);
    c.t1 = setTimeout(function () {
      var from = c.cur;
      c.cur = next;
      c.top.textContent = show(next);   // revealed behind the falling top leaf
      c.bot.textContent = show(from);   // stays until the bottom leaf lands
      c.lt.textContent = show(from);
      c.lb.textContent = show(next);
      c.el.classList.remove('flip');
      void c.el.offsetWidth;
      c.el.classList.add('flip');
      c.t2 = setTimeout(function () { c.bot.textContent = show(next); c.el.classList.remove('flip'); }, 180);
    }, delay);
  }
  function setBoard(text) {
    var t = (text + '                ').slice(0, 16), n = 0;
    cells.forEach(function (c, i) {
      var ch = t.charAt(i);
      if (reduce) { c.cur = ch; c.top.textContent = c.bot.textContent = show(ch); return; }
      if (c.cur === ch) { clearTimeout(c.t1); return; }
      flipCell(c, ch, n++ * 60);
    });
  }
  var whoTimer = 0, whoText = '';
  function setWho(el) {
    if (!el) return;
    var parts = el.getAttribute('data-who');
    if (parts === whoText) return;
    whoText = parts;
    var i = parts.indexOf(', ');
    var name = i < 0 ? parts : parts.slice(0, i), school = i < 0 ? '' : parts.slice(i + 2);
    var write = function () {
      who.firstElementChild.textContent = name;
      who.lastElementChild.textContent = school;
      who.classList.remove('out');
    };
    if (reduce) return write();
    who.classList.add('out');
    clearTimeout(whoTimer);
    whoTimer = setTimeout(write, 160);
  }

  /* ---------- Rail geometry ---------- */
  var y0 = 0, yEnd = 0, yBranch = Infinity, yNow = 0, dots = [];
  function dotY(li) {
    var d = li.querySelector('.dot').getBoundingClientRect();
    return d.top + d.height / 2 - rail.getBoundingClientRect().top;
  }
  function visible() { return stations.filter(function (s) { return !s.classList.contains('folded'); }); }
  function measure() {
    var vis = visible();
    var railTop = rail.getBoundingClientRect().top;
    y0 = dotY(terminal);
    dots = vis.map(function (s) { return { li: s, y: dotY(s) }; });
    var last = vis[vis.length - 1];
    yEnd = last ? dotY(last) : y0;
    stations.forEach(function (s) { s.classList.remove('is-end'); });
    if (last) {
      last.classList.add('is-end');
      last.firstElementChild.style.setProperty('--end', (yEnd - (last.getBoundingClientRect().top - railTop)) + 'px');
    }
    var firstBeyond = labels[1].classList.contains('folded') ? vis.filter(function (s) { return s.classList.contains('is-beyond'); })[0] : labels[1];
    yBranch = firstBeyond ? firstBeyond.getBoundingClientRect().top - railTop : Infinity;
    fillA.style.top = y0 + 'px';
    if (firstBeyond) fillB.style.top = yBranch + 'px';
  }
  function setY(y) {
    y = Math.max(y0, Math.min(yEnd, y));
    yNow = y;
    token.style.transform = 'translateY(' + y + 'px)';
    fillA.style.transform = 'scaleY(' + ((Math.min(y, yBranch) - y0) / FILL_H) + ')';
    fillB.style.transform = 'scaleY(' + (y > yBranch ? (y - yBranch) / FILL_H : 0) + ')';
  }

  /* ---------- Modes ---------- */
  var mode = 'whole', riding = false, rideId = 0, active = null, boardDebounce = 0;
  function setActive(li, immediate) {
    if (li === active) return;
    if (active) active.classList.remove('is-active');
    active = li;
    li.classList.add('is-active');
    var go = function () {
      setBoard(li.getAttribute('data-board'));
      setWho(li.querySelector(mode === 'express' ? '.person.match' : '.person'));
    };
    clearTimeout(boardDebounce);
    if (immediate) go(); else boardDebounce = setTimeout(go, 70);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }

  function isDesktop() { return matchMedia('(min-width: 1024px)').matches; }
  function navH() { return nav.offsetHeight; }
  function absTop(el) { return el.getBoundingClientRect().top + pageYOffset; }

  function bringBoardUp(force) {
    var anchor = isDesktop() ? grid : boardWrap;
    var r = anchor.getBoundingClientRect();
    var boardBottom = boardWrap.getBoundingClientRect().bottom;
    var out = r.top < navH() - 1 || boardBottom > innerHeight - 8;
    if (isDesktop()) out = r.top < navH() - 1;
    if (!out && !force) return;
    var top;
    if (isDesktop()) top = absTop(grid) - navH() - 20;
    else top = absTop($('.finder')) + $('.finder').offsetHeight - navH() + 2;   // the board's natural place, even while stuck
    scrollTo({ top: top, behavior: behavior });
  }

  var userMoved = false;
  addEventListener('touchstart', function () { if (riding) userMoved = true; }, { passive: true });
  addEventListener('wheel', function () { if (riding) userMoved = true; }, { passive: true });
  function follow(el, always) {
    if (userMoved && !always) return;
    var pad = isDesktop() ? 32 : (bar.classList.contains('is-hidden') ? 16 : 76);
    var over = el.getBoundingClientRect().bottom - (innerHeight - pad);
    if (over > 0) scrollBy({ top: over, behavior: behavior });
  }

  function clearRoute() {
    stations.forEach(function (s) {
      s.classList.remove('folded', 'arrived', 'flash');
      s.querySelector('details').open = false;
    });
    labels.forEach(function (l) { l.classList.remove('folded'); });
    $$('.person.match', rail).forEach(function (p) { p.classList.remove('match'); });
    rail.classList.remove('is-express');
  }
  function hideTicket() {
    slot.classList.remove('printed', 'go', 'on-line');
    bar.classList.remove('is-hidden');
    var layer = rail.querySelector('.fill-layer');
    rail.insertBefore(slot, layer);
  }

  function printTicket(title, school, msg, afterLi) {
    $('#rt-title').textContent = title;
    $('#rt-school').textContent = school;
    $('#rt-wa').href = WA + encodeURIComponent(msg);
    if (afterLi) { afterLi.parentNode.insertBefore(slot, afterLi.nextSibling); slot.classList.add('on-line'); }
    slot.classList.add('printed');
    void slot.offsetWidth;
    slot.classList.add('go');
    follow(slot, true);
  }

  function nameList(names) {
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function arrive(li) {
    setActive(li, true);
    li.classList.remove('flash');
    void li.offsetWidth;
    li.classList.add('flash');
  }

  function rideTo(li, id, express) {
    measure();
    setY(dotY(li));
    return wait(MOVE_MS).then(function () {
      if (id !== rideId) return;
      arrive(li);
      if (express) {
        li.classList.add('arrived');
        li.querySelector('details').open = true;
        measure();
        setY(yNow);
        follow(li);
      }
      return wait(DWELL_MS);
    });
  }

  function run(list, id, express) {
    return list.reduce(function (p, li) {
      return p.then(function () { return id === rideId ? rideTo(li, id, express) : null; });
    }, Promise.resolve());
  }

  function chooseSchool(school, stopsAttr) {
    var id = ++rideId;
    var ids = stopsAttr.split(' ');
    var stops = ids.map(function (i) { return $('#st-' + i); });
    riding = true; userMoved = false;
    rail.classList.remove('no-scrub');
    rail.classList.add('riding');
    hideTicket();
    clearRoute();
    mode = 'express';
    rail.classList.add('is-express');
    bringBoardUp();
    stations.forEach(function (s) { if (ids.indexOf(s.getAttribute('data-id')) < 0) s.classList.add('folded'); });
    labels.forEach(function (l) { l.classList.add('folded'); });
    stops.forEach(function (s) {
      $$('.person', s).forEach(function (p) { if (p.getAttribute('data-school') === school) p.classList.add('match'); });
    });
    var shorts = stops.map(function (s) { return s.getAttribute('data-short'); });
    status.textContent = school + ': ' + shorts.join(', ');
    if (active) { active.classList.remove('is-active'); active = null; }
    setY(y0);
    return wait(FOLD_MS).then(function () {
      if (id !== rideId) return;
      return run(stops, id, true);
    }).then(function () {
      if (id !== rideId) return;
      riding = false;
      rail.classList.remove('riding');
      printTicket(
        'Amar Colony to ' + shorts[0],
        school,
        'Hello Paul sir, my child studies at ' + school + '. I saw on your website that students from there went on to ' + nameList(shorts.slice(0, 3)) + '. Could we talk about Class 11 or 12?'
      );
    });
  }

  function chooseNotHere() {
    var id = ++rideId;
    var wasExpress = mode === 'express';
    riding = true; userMoved = false;
    rail.classList.add('riding');
    hideTicket();
    clearRoute();
    mode = 'whole';
    bringBoardUp();
    status.textContent = 'Every student starts at Amar Colony';
    var first = stations.slice(0, 3);
    return wait(wasExpress ? FOLD_MS : 40).then(function () {
      if (id !== rideId) return;
      measure();
      setY(y0);
      return run(first, id, false);
    }).then(function () {
      if (id !== rideId) return;
      printTicket(
        'Every student starts at Amar Colony',
        'Class 11, Class 12 and CUET',
        'Hello Paul sir, I saw your website and would like to ask about Class 11 or 12 for my child.',
        first[first.length - 1]
      );
      return wait(120);
    }).then(function () {
      if (id !== rideId) return;
      riding = false;
      rail.classList.remove('riding');
      syncScrub();
    });
  }

  function seeWholeLine() {
    ++rideId;
    riding = false;
    rail.classList.remove('riding');
    hideTicket();
    clearRoute();
    mode = 'whole';
    select.value = '';
    status.textContent = '';
    bringBoardUp(true);
    setTimeout(function () { measure(); syncScrub(); }, reduce ? 0 : FOLD_MS);
  }

  select.addEventListener('change', function () {
    var v = select.value;
    if (!v) return seeWholeLine();
    if (v === '__none') return chooseNotHere();
    chooseSchool(v, select.options[select.selectedIndex].getAttribute('data-stops'));
  });
  $('#rt-reset').addEventListener('click', seeWholeLine);

  /* ---------- Bottom bar steps aside for the ticket ---------- */
  new IntersectionObserver(function (es) {
    es.forEach(function (e) { bar.classList.toggle('is-hidden', e.isIntersecting && slot.classList.contains('printed')); });
  }).observe($('.print'));

  /* ---------- Riding by scrolling ---------- */
  var scrubTween = null, prog = { v: 0 };
  function syncScrub() {
    if (scrubTween) window.ScrollTrigger.refresh();
    if (scrubTween && !riding && mode === 'whole') setY(prog.v * rail.offsetHeight);
  }
  function setupScrub() {
    if (reduce || !window.gsap || !window.ScrollTrigger) { rail.classList.add('no-scrub'); return; }
    gsap.registerPlugin(ScrollTrigger);
    scrubTween = gsap.to(prog, {
      v: 1, ease: 'none',
      scrollTrigger: { trigger: rail, start: 'top 55%', end: 'bottom 55%', scrub: 0.3 },
      onUpdate: function () { if (!riding && mode === 'whole') { setY(prog.v * rail.offsetHeight); activateAtToken(); } }
    });
  }
  // Active station follows the token, so a fast fling can never leave the board stale.
  function activateAtToken() {
    for (var i = dots.length - 1; i >= 0; i--) {
      if (dots[i].y <= yNow + 20) { setActive(dots[i].li); return; }
    }
  }
  // Without the scrub, the station crossing the 55% line of the screen leads instead.
  var sio = new IntersectionObserver(function (es) {
    if (scrubTween || riding || mode !== 'whole') return;
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      setActive(e.target);
      setY(dotY(e.target));
    });
  }, { rootMargin: '-55% 0px -45% 0px' });
  stations.forEach(function (s) { sio.observe(s); });

  // Opening a station by hand changes the rail length.
  var roT = 0;
  new ResizeObserver(function () {
    if (riding || mode !== 'whole') return;
    clearTimeout(roT);
    roT = setTimeout(function () { measure(); syncScrub(); }, 80);
  }).observe(rail);

  /* ---------- The line from the shopfront into the rail ---------- */
  var connector = $('#connector');
  function drawConnector() {
    var main = $('main').getBoundingClientRect();
    var photo = $('.shop img, .shop-fallback');
    var p = (photo && photo.offsetParent ? photo : $('.shop')).getBoundingClientRect();
    var t = terminal.querySelector('.dot').getBoundingClientRect();
    var tx = t.left + t.width / 2 - main.left, ty = t.top + t.height / 2 - main.top;
    var r = 22, d;
    if (matchMedia('(min-width: 900px)').matches) {
      var gridTop = grid.getBoundingClientRect().top - main.top;
      var x = Math.max(16, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g')) / 2);
      var sy = Math.min(p.bottom - main.top - 44, innerHeight - nav.offsetHeight - 70);
      var yH = gridTop - 34;
      var sx = p.left - main.left + 30;
      if (isDesktop()) {
        d = 'M' + sx + ' ' + sy + ' H' + (x + r) + ' Q' + x + ' ' + sy + ' ' + x + ' ' + (sy + r) +
          ' V' + (yH - r) + ' Q' + x + ' ' + yH + ' ' + (x + r) + ' ' + yH +
          ' H' + (tx - r) + ' Q' + tx + ' ' + yH + ' ' + tx + ' ' + (yH + r) + ' V' + ty;
      } else {
        d = 'M' + sx + ' ' + sy + ' H' + (x + r) + ' Q' + x + ' ' + sy + ' ' + x + ' ' + (sy + r) +
          ' V' + (ty - r) + ' Q' + x + ' ' + ty + ' ' + (x + r) + ' ' + ty + ' H' + tx;
      }
    } else {
      var ex = Math.max(6, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g')) / 2 - 2);
      var py = p.bottom - main.top - 12;
      d = 'M' + ex + ' ' + py + ' V' + (ty - r) + ' Q' + ex + ' ' + ty + ' ' + (ex + r) + ' ' + ty + ' H' + tx;
      connector.firstElementChild.style.strokeWidth = 4;
    }
    connector.style.height = (ty + 4) + 'px';
    connector.firstElementChild.setAttribute('d', d);
  }

  /* ---------- Start ---------- */
  function start() {
    drawConnector();
    measure();
    setupScrub();
    setY(y0);
    connector.classList.add('draw');
    if (reduce) connector.firstElementChild.style.strokeDashoffset = 0;
    var heroRO = new ResizeObserver(drawConnector);
    heroRO.observe($('.hero'));
    heroRO.observe($('.line-head'));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { drawConnector(); measure(); syncScrub(); });
  }
  start();
})();
