(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* Reveal once on entering view */
  var targets = $$('.reveal,.reveal-num');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else targets.forEach(function (t) { t.classList.add('in'); });

  /* Today's hours, on Delhi time */
  try {
    var day = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(new Date());
    var tr = $('.hours tr[data-day="' + day + '"]');
    if (tr) { tr.classList.add('today'); $('.today-mark', tr).hidden = false; }
  } catch (e) {}

  /* Phone bar: the hero already has these two buttons, so it waits until they leave the screen */
  var bar = $('.phonebar'), heroCta = $('.hero .cta');
  if (bar && heroCta && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { bar.classList.toggle('away', es[0].isIntersecting); }).observe(heroCta);
  }

  /* Reviews: "Read all" only where text is really clamped */
  function measureReviews() {
    $$('.rev').forEach(function (r) {
      if (r.classList.contains('full')) return;
      var t = $('.rtext', r), b = $('.more', r);
      b.hidden = t.scrollHeight <= t.clientHeight + 2;
    });
  }
  $$('.more').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.closest('.rev'), open = r.classList.toggle('full');
      b.textContent = open ? 'Show less' : 'Read all';
      b.setAttribute('aria-expanded', open);
    });
  });
  measureReviews();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureReviews);
  addEventListener('resize', measureReviews);

  /* ---------- The scale: a small real physics model ---------- */
  var svg = $('#scale');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var PIVOT = { x: 210, y: 24 }, ARM = 130;
  var beam = $('#beam'), panL = $('#panL'), panR = $('#panR');
  var loadL = $('.load', panL), loadR = $('.load', panR);
  var TIP = -9 * Math.PI / 180;

  var S = {
    th: 0, vth: 0, target: 0,                   // beam angle (radians, negative = left down)
    swL: 0, vL: 0, swR: 0, vR: 0                // pan pendulum swing (radians)
  };
  var items = [], raf = 0, last = 0;

  // Pyramid slots, sat inside the pan dish (pan rim is y=52 in pan space)
  function slot(i, isCoin) {
    var rows = [[-1, 0, 1], [-.5, .5], [0]], n = 0;
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        if (n++ === i) return isCoin
          ? { x: rows[r][c] * 22, y: 44 - r * 15 }
          : { x: rows[r][c] * 42, y: 46 - r * 17 };
      }
    }
    return { x: 0, y: 0 };
  }
  function relayout() {
    [true, false].forEach(function (c) {
      var i = 0;
      items.forEach(function (it) {
        if (it.coin === c && !it.leaving) { var s = slot(i++, c); it.tx = s.x; it.ty = s.y; if (!it.landed) it.x = s.x; }
      });
    });
  }
  function makeItem(coin, label) {
    var g = document.createElementNS(NS, 'g');
    var u = document.createElementNS(NS, 'use');
    u.setAttribute('href', coin ? '#cn' : '#wt');
    g.appendChild(u);
    if (!coin) {
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('class', 'wl'); t.setAttribute('y', '4.200'); t.textContent = label;
      g.appendChild(t);
    }
    (coin ? loadR : loadL).appendChild(g);
    var it = { el: g, coin: coin, x: 0, y: -120, tx: 0, ty: 0, vy: 0, op: 0, landed: false, leaving: false, bounced: false };
    items.push(it);
    relayout();
    if (reduced) { it.x = it.tx; it.y = it.ty; it.landed = true; it.op = 1; }
    return it;
  }
  function counts() {
    var l = 0, r = 0;
    items.forEach(function (it) { if (it.landed && !it.leaving) { if (it.coin) r++; else l++; } });
    return { l: l, r: r };
  }
  function retarget() {
    var c = counts();
    S.target = Math.max(-1.5, Math.min(1.5, c.l - c.r)) * TIP;
    if (reduced) { S.th = S.target; render(); }
    else wake();
  }

  function render() {
    var deg = S.th * 180 / Math.PI;
    beam.setAttribute('transform', 'rotate(' + deg.toFixed(3) + ' ' + PIVOT.x + ' ' + PIVOT.y + ')');
    var c = Math.cos(S.th), s = Math.sin(S.th);
    panL.setAttribute('transform', 'translate(' + (PIVOT.x - ARM * c).toFixed(2) + ' ' + (PIVOT.y - ARM * s).toFixed(2) + ') rotate(' + (S.swL * 57.3).toFixed(2) + ')');
    panR.setAttribute('transform', 'translate(' + (PIVOT.x + ARM * c).toFixed(2) + ' ' + (PIVOT.y + ARM * s).toFixed(2) + ') rotate(' + (S.swR * 57.3).toFixed(2) + ')');
    items.forEach(function (it) {
      it.el.setAttribute('transform', 'translate(' + it.x.toFixed(2) + ' ' + it.y.toFixed(2) + ')');
      it.el.setAttribute('opacity', it.op.toFixed(2));
    });
  }

  function step(dt) {
    // Heavy, under-damped beam
    var w = 8.2, z = 0.27;
    var acc = -2 * z * w * S.vth - w * w * (S.th - S.target);
    S.vth += acc * dt; S.th += S.vth * dt;
    // Pans hang from the beam ends; beam acceleration kicks them into a small swing
    var pw = 6.5, pz = 0.16, kick = 0.016;
    S.vL += (-2 * pz * pw * S.vL - pw * pw * S.swL + acc * kick) * dt; S.swL += S.vL * dt;
    S.vR += (-2 * pz * pw * S.vR - pw * pw * S.swR - acc * kick) * dt; S.swR += S.vR * dt;
    var dirty = false;
    items.slice().forEach(function (it) {
      if (it.leaving) {
        it.vy -= 900 * dt; it.y += it.vy * dt; it.op = Math.max(0, it.op - dt * 4.5);
        if (it.op <= 0) { it.el.remove(); items.splice(items.indexOf(it), 1); }
        return;
      }
      it.x += (it.tx - it.x) * Math.min(1, dt * 14);
      if (!it.landed || it.bouncing) {
        it.op = Math.min(1, it.op + dt * 14);
        it.vy += 2100 * dt; it.y += it.vy * dt;
        if (it.y >= it.ty) {
          it.y = it.ty;
          if (!it.landed) {
            it.landed = true; it.bouncing = true; dirty = true;
            var impulse = it.coin ? 0.62 : -0.62;     // the thud itself nudges the beam
            S.vth += impulse;
            if (navigator.vibrate) { try { navigator.vibrate(it.coin ? 6 : 12); } catch (e) {} }
          }
          if (it.vy > 170) it.vy *= -0.24; else { it.vy = 0; it.bouncing = false; }
        }
      } else {
        it.y += (it.ty - it.y) * Math.min(1, dt * 14);
      }
    });
    if (dirty) retarget();
  }
  function moving() {
    if (Math.abs(S.vth) > 0.002 || Math.abs(S.th - S.target) > 0.0015) return true;
    if (Math.abs(S.vL) > 0.004 || Math.abs(S.swL) > 0.002 || Math.abs(S.vR) > 0.004 || Math.abs(S.swR) > 0.002) return true;
    return items.some(function (it) { return !it.landed || it.bouncing || it.leaving || Math.abs(it.ty - it.y) > .1 || Math.abs(it.tx - it.x) > .1; });
  }
  function frame(t) {
    var dt = Math.min(0.033, (t - last) / 1000 || 0.016);
    last = t;
    var sub = 2; for (var i = 0; i < sub; i++) step(dt / sub);
    render();
    if (moving()) raf = requestAnimationFrame(frame);
    else { raf = 0; S.th = S.target; S.vth = 0; S.swL = S.swR = S.vL = S.vR = 0; render(); }
  }
  function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  render();

  /* A single wobble the first time the scale comes into view, so it reads as alive */
  if (!reduced && 'IntersectionObserver' in window) {
    var once = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { S.vth = 0.55; wake(); once.disconnect(); }
    }, { threshold: 0.7 });
    once.observe(svg);
  }

  /* ---------- Ledger rows ---------- */
  var rows = $$('.row'), live = $('#live'), foot = $('.foot');
  var totals = $('.totals'), tDr = $('#tDr'), tCr = $('#tCr');
  var start = $('.start'), closeUp = $('.close-up');
  var closeBtn = $('#closeBooks'), send = $('#sendSheet');
  var ledgerIn = $('.ledger-in');
  var kbtns = $$('.kbtn');
  var closed = false, stampT = 0;

  // FLIP: layout jumps below an opened row become a transform glide
  function glideBelow(rowEl, change) {
    var below = reduced ? [] : rows.slice(rows.indexOf(rowEl) + 1).concat(foot);
    var before = below.map(function (el) { return el.getBoundingClientRect().top; });
    change();
    below.forEach(function (el, i) {
      var d = before[i] - el.getBoundingClientRect().top;
      if (!d) return;
      el.classList.remove('flip');
      el.style.transform = 'translateY(' + d + 'px)';
      el.getBoundingClientRect();
      el.classList.add('flip');
      el.style.transform = '';
      setTimeout(function () { el.classList.remove('flip'); }, 380);
    });
  }

  // Write the quote left to right, one visual line at a time, then restore plain text
  function writeQuote(p) {
    var text = p.dataset.text || (p.dataset.text = p.textContent);
    if (reduced) { p.textContent = text; return; }
    var words = text.split(' ');
    p.textContent = '';
    var spans = words.map(function (w, i) {
      var s = document.createElement('span'); s.textContent = w + (i < words.length - 1 ? ' ' : '');
      p.appendChild(s); return s;
    });
    var lines = [], top = null;
    spans.forEach(function (s) {
      if (s.offsetTop !== top) { lines.push(''); top = s.offsetTop; }
      lines[lines.length - 1] += s.textContent;
    });
    p.textContent = '';
    var total = text.length, at = 0;
    var els = lines.map(function (l) {
      var s = document.createElement('span');
      s.className = 'qline'; s.textContent = l;
      var d = 0.56 * l.length / total;
      s.style.setProperty('--d', d.toFixed(3) + 's');
      s.style.setProperty('--w', at.toFixed(3) + 's');
      at += d;
      p.appendChild(s);
      return s;
    });
    p.getBoundingClientRect();
    els.forEach(function (s) { s.classList.add('go'); });
    clearTimeout(p._t);
    p._t = setTimeout(function () { p.textContent = text; }, at * 1000 + 80);
  }

  function selected() { return rows.filter(function (r) { return r._on; }); }

  function refreshFoot() {
    var on = selected();
    var any = on.length > 0;
    start.hidden = any;
    start.style.display = any ? 'none' : '';
    closeUp.hidden = !any;
    totals.hidden = !any;
    tDr.textContent = on.length;
    tCr.textContent = on.filter(function (r) { return r._answered; }).length;
    if (!any) unclose();
    updateLink();
  }

  function answerRow(r) {
    if (!r._on) return;
    clearTimeout(r._t1); clearTimeout(r._t2);
    if (!r._open) openQuote(r, true);
    if (!r._answered) dropCoin(r);
  }
  function openQuote(r, instant) {
    r._open = true;
    var entry = $('.quote', r);
    glideBelow(r, function () { r.classList.add('open'); });
    if (instant) { entry.textContent = entry.dataset.text || entry.textContent; }
    else writeQuote(entry);
    live.textContent = (entry.dataset.text || entry.textContent) + ' ' + $('.who', r).textContent;
  }
  function dropCoin(r) {
    r._answered = true;
    r._coin = makeItem(true);
    if (reduced) retarget(); else wake();
    tCr.textContent = selected().filter(function (x) { return x._answered; }).length;
  }

  function toggle(r) {
    var btn = $('.worry', r);
    if (!r._on) {
      r._on = true;
      btn.setAttribute('aria-pressed', 'true');
      r._weight = makeItem(false, r.dataset.short);
      if (reduced) { retarget(); openQuote(r); dropCoin(r); retarget(); render(); refreshFoot(); return; }
      wake();
      r._t1 = setTimeout(function () { openQuote(r); }, 450);
      r._t2 = setTimeout(function () { dropCoin(r); }, 880);
    } else {
      r._on = false;
      clearTimeout(r._t1); clearTimeout(r._t2);
      btn.setAttribute('aria-pressed', 'false');
      [r._weight, r._coin].forEach(function (it) { if (it) { it.leaving = true; it.landed = true; it.vy = -40; } });
      r._weight = r._coin = null;
      r._answered = false;
      if (r._open) {
        r._open = false;
        var q = $('.quote', r);
        clearTimeout(q._t); if (q.dataset.text) q.textContent = q.dataset.text;
        glideBelow(r, function () { r.classList.remove('open'); });
      }
      relayout();
      if (reduced) { items = items.filter(function (it) { if (it.leaving) { it.el.remove(); return false; } return true; }); }
      retarget();
      render();
    }
    if (closed) unclose();
    refreshFoot();
  }

  rows.forEach(function (r) {
    var q = $('.quote', r); q.dataset.text = q.textContent;
    $('.worry', r).addEventListener('click', function () { toggle(r); });
  });

  /* ---------- Close the books ---------- */
  function currentClass() {
    var k = kbtns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
    return k ? k.textContent : 'not sure yet';
  }
  function updateLink() {
    var labels = selected().map(function (r) { return $('.lbl', r).textContent; }).join(', ');
    var msg = "Hi Commerce Pathshaala, here's my balance sheet from your website.\n" +
      'Class: ' + currentClass() + '\n' +
      "What's weighing on me: " + labels + '\n' +
      'Could you tell me about the right batch and when I can visit Sector 3?';
    send.href = 'https://wa.me/918588953495?text=' + encodeURIComponent(msg);
  }
  kbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var was = b.getAttribute('aria-pressed') === 'true';
      kbtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', was ? 'false' : 'true');
      updateLink();
    });
  });
  function unclose() {
    closed = false;
    clearTimeout(stampT);
    foot.classList.remove('closed', 'stamped');
    ledgerIn.classList.remove('shake');
    closeBtn.hidden = false; send.hidden = true;
  }
  closeBtn.addEventListener('click', function () {
    selected().forEach(answerRow);
    closed = true;
    foot.classList.add('closed');
    closeBtn.hidden = true; send.hidden = false;
    updateLink();
    refreshFoot();
    send.focus({ preventScroll: true });
    live.textContent = 'Books closed. Tallied. You can now send your sheet on WhatsApp.';
    stampT = setTimeout(function () {
      foot.classList.add('stamped');
      setTimeout(function () {
        ledgerIn.classList.add('shake');
        if (!reduced) { S.vth += 0.5; S.vL += 0.5; S.vR -= 0.5; wake(); }
        if (navigator.vibrate) { try { navigator.vibrate(24); } catch (e) {} }
      }, reduced ? 0 : 230);
    }, reduced ? 0 : 520);
  });
})();
