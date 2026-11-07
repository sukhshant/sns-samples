(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* section fade-up */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add('in'); }); }

  /* the tape */
  var tool = document.getElementById('tool');
  if (!tool) return;
  tool.hidden = false;

  var pull = document.getElementById('pull'), tape = document.getElementById('tape'),
      svg = document.getElementById('tapeSvg'), handle = document.getElementById('handle'),
      caseEl = document.getElementById('case'), dim = document.getElementById('dim'),
      dimText = document.getElementById('dimText'), draw = document.getElementById('draw'),
      heightSel = document.getElementById('height'), heightField = document.getElementById('heightField'),
      area = document.getElementById('area'), send = document.getElementById('send'),
      stage = document.getElementById('stage');
  var segs = Array.prototype.slice.call(tool.querySelectorAll('.seg'));

  var MIN = 3, MAX = 14, HANDLE_W = 40;
  var state = { piece: 'wardrobe', ft: 7, len: 7, ppf: 20, caseW: 60 };
  var NAMES = { wardrobe: 'wardrobe', tv: 'TV unit', kitchen: 'kitchen run', panels: 'wall panels' };
  var NS = 'http://www.w3.org/2000/svg';

  function fmt(n) { return (n % 1 === 0 ? String(n) : n.toFixed(1)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function measure() {
    state.caseW = caseEl.getBoundingClientRect().width;
    state.ppf = Math.max(12, (pull.clientWidth - state.caseW - HANDLE_W) / MAX);
    stage.style.setProperty('--case', state.caseW + 'px');
    pull.style.setProperty('--case', state.caseW + 'px');
    buildTape();
    setLen(state.len);
    renderDrawing();
  }

  function buildTape() {
    var p = state.ppf, w = Math.ceil(MAX * p) + 2, s = '';
    var step = p >= 34 ? 1 / 12 : p >= 18 ? 0.25 : 0.5;
    var n = Math.round(MAX / step);
    for (var i = 0; i <= n; i++) {
      var f = i * step, x = (f * p).toFixed(1), whole = Math.abs(f - Math.round(f)) < 1e-6;
      var half = Math.abs(f * 2 - Math.round(f * 2)) < 1e-6;
      var h = whole ? 30 : half ? 21 : (p >= 34 && Math.abs(f * 4 - Math.round(f * 4)) < 1e-6 ? 16 : 10);
      s += '<rect x="' + x + '" y="0" width="' + (whole ? 2.5 : 1.5) + '" height="' + h + '" fill="#16201D"/>';
      if (whole && f > 0) s += '<text x="' + (f * p + 5).toFixed(1) + '" y="49">' + f + '</text>';
    }
    svg.setAttribute('width', w);
    svg.innerHTML = s;
  }

  function setLen(ft) {
    state.len = ft;
    var px = ft * state.ppf;
    tape.style.width = px + 'px';
    handle.style.left = (state.caseW + px) + 'px';
  }

  function setValue(v, silent) {
    v = clamp(Math.round(v * 2) / 2, MIN, MAX);
    if (v === state.ft && !silent) return;
    state.ft = v;
    handle.setAttribute('aria-valuenow', v);
    handle.setAttribute('aria-valuetext', fmt(v) + ' feet');
    dimText.textContent = fmt(v) + ' ft';
    renderDrawing();
    updateLink();
  }

  /* drawing */
  function heightFt() {
    if (state.piece === 'tv') return 4;
    if (state.piece === 'kitchen') return 7;
    return +heightSel.value;
  }

  function line(x1, y1, x2, y2, cls) { return '<line class="l ' + (cls || '') + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>'; }
  function rect(x, y, w, h, cls) { return '<rect class="l ' + (cls || '') + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>'; }

  function shapes(piece, W, H) {
    var s = '', i, n, cw;
    if (piece === 'wardrobe') {
      s += rect(0, 0, W, H, 'f');
      s += rect(0, H - 8, W, 8, 'f');
      n = Math.max(2, Math.round(W / 200)); cw = W / n;
      var mid = Math.floor(n / 2);
      for (i = 0; i < n; i++) {
        var x = i * cw;
        if (i > 0) s += line(x, 0, x, H - 8);
        if (i === mid) {
          var dh = (H - 8) * 0.5 / 3, top = (H - 8) * 0.5;
          s += line(x, top, x + cw, top);
          for (var d = 1; d < 3; d++) s += line(x, top + d * dh, x + cw, top + d * dh);
          for (d = 0; d < 3; d++) s += line(x + cw * 0.36, top + d * dh + dh * 0.5, x + cw * 0.64, top + d * dh + dh * 0.5);
          s += line(x + cw - 12, H * 0.2, x + cw - 12, H * 0.32);
        } else {
          s += line(x + (i % 2 ? 12 : cw - 12), H * 0.42, x + (i % 2 ? 12 : cw - 12), H * 0.58);
        }
      }
    } else if (piece === 'tv') {
      var step = 14;
      for (i = step; i < W; i += step) s += line(i, 0, i, H - 160, 't');
      var tw = Math.min(W * 0.58, 480), th = Math.min(tw * 0.5625, H - 190), tx = (W - tw) / 2;
      s += rect(tx, 20, tw, th, 'f');
      var cy = H - 150;
      s += rect(0, cy, W, 150, 'f');
      var nw = Math.min(W * 0.34, 160), nx = (W - nw) / 2;
      s += rect(nx, cy + 14, nw, 122);
      var sideW = nx, dn = Math.max(1, Math.round(sideW / 100));
      for (i = 0; i < dn; i++) {
        var dw = sideW / dn;
        if (i > 0) { s += line(i * dw, cy, i * dw, cy + 150); s += line(W - i * dw, cy, W - i * dw, cy + 150); }
      }
      s += line(nx, cy, nx, cy + 150); s += line(nx + nw, cy, nx + nw, cy + 150);
      s += line(0, H, 0, H);
    } else if (piece === 'kitchen') {
      var base = 300, cy2 = H - base;
      n = Math.max(2, Math.round(W / 200)); cw = W / n;
      var hob = Math.floor(n / 2);
      s += rect(0, H - base, W, base, 'f');
      s += rect(-6, H - base - 8, W + 12, 8, 'f');
      for (i = 0; i < n; i++) {
        var bx = i * cw;
        if (i > 0) s += line(bx, cy2, bx, H);
        if (i === hob) {
          var hobW = Math.min(cw * 0.72, 120);
          for (var k = 0; k < 4; k++) s += '<circle class="l" cx="' + (bx + cw / 2 + (k % 2 ? 1 : -1) * hobW * 0.22) + '" cy="' + (cy2 - 26 - (k > 1 ? 0 : 0) + (k > 1 ? 0 : 0)) + '" r="' + (hobW * 0.1) + '" style="transform-box:fill-box"/>';
          s += rect(bx + 14, cy2 + 14, cw - 28, base * 0.45);
          s += line(bx + 14, cy2 + base * 0.62, bx + cw - 14, cy2 + base * 0.62);
        } else {
          s += line(bx + (i % 2 ? 12 : cw - 12), cy2 + 40, bx + (i % 2 ? 12 : cw - 12), cy2 + 100);
          s += line(bx, cy2 + base * 0.3, bx + cw, cy2 + base * 0.3, 't');
        }
      }
      var wy = 0, wh = 220;
      for (i = 0; i < n; i++) {
        var wx = i * cw;
        if (i === hob) {
          var cwid = Math.min(cw * 0.7, 130);
          s += '<polygon class="l f" points="' + (wx + cw / 2 - cwid / 2) + ',' + (cy2 - 140) + ' ' + (wx + cw / 2 + cwid / 2) + ',' + (cy2 - 140) + ' ' + (wx + cw / 2 + cwid * 0.2) + ',' + wy + ' ' + (wx + cw / 2 - cwid * 0.2) + ',' + wy + '"/>';
        } else {
          s += rect(wx, wy, cw, wh, 'f');
          s += line(wx + (i % 2 ? 12 : cw - 12), wh - 70, wx + (i % 2 ? 12 : cw - 12), wh - 24);
        }
      }
    } else {
      s += rect(0, 0, W, H);
      var sl = 25, cnt = Math.floor(W / sl);
      for (i = 0; i < cnt; i++) {
        s += '<rect class="l f" x="' + (i * sl + 3) + '" y="8" width="' + (sl - 8) + '" height="' + (H - 16) + '"/>';
      }
    }
    return s;
  }

  function renderDrawing() {
    var ft = state.ft, h = heightFt(), W = ft * 100, H = h * 100;
    var pxW = ft * state.ppf, pxH = h * state.ppf;
    dim.style.width = pxW + 'px';
    draw.innerHTML = '<svg width="' + pxW.toFixed(1) + '" height="' + pxH.toFixed(1) + '" viewBox="-4 -4 ' + (W + 8) + ' ' + (H + 8) + '" role="img" aria-label="' + NAMES[state.piece] + ' ' + fmt(ft) + ' ft wide" preserveAspectRatio="none">' + shapes(state.piece, W, H) + '</svg>';
  }

  function updateLink() {
    var name = NAMES[state.piece];
    var txt = 'Hi, I need a quote for ' + (state.piece === 'panels' ? '' : 'a ') + name + ', ' + fmt(state.ft) + ' ft wide';
    if (state.piece === 'wardrobe' || state.piece === 'panels') {
      txt += ', ' + (heightSel.value === '9' ? 'floor to ceiling' : heightSel.value + ' ft high');
    }
    var a = area.value.trim();
    if (a) txt += ', at ' + a;
    txt += '. Please share a rough price.';
    send.href = 'https://wa.me/917618921643?text=' + encodeURIComponent(txt);
  }

  /* tween */
  var raf = 0;
  function tweenTo(target, ms, ease, done) {
    cancelAnimationFrame(raf);
    if (reduce || ms === 0) { setLen(target); if (done) done(); return; }
    var from = state.len, t0 = performance.now();
    (function step(now) {
      var t = clamp((now - t0) / ms, 0, 1);
      setLen(from + (target - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(step); else if (done) done();
    })(t0);
  }
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeBack = function (t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  function lockClick() {
    if (reduce) return;
    caseEl.classList.remove('lock'); void caseEl.offsetWidth; caseEl.classList.add('lock');
  }

  /* dragging */
  var dragging = false;
  function fromPointer(e) {
    var r = pull.getBoundingClientRect();
    var ft = (e.clientX - r.left - state.caseW) / state.ppf;
    ft = clamp(ft, MIN, MAX);
    cancelAnimationFrame(raf);
    setLen(ft);
    setValue(ft);
  }
  pull.addEventListener('pointerdown', function (e) {
    if (e.target === caseEl || caseEl.contains(e.target)) return;
    dragging = true; handle.classList.add('drag');
    try { pull.setPointerCapture(e.pointerId); } catch (x) {}
    fromPointer(e); e.preventDefault();
  });
  pull.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
  function release() {
    if (!dragging) return;
    dragging = false; handle.classList.remove('drag');
    tweenTo(state.ft, 140, easeOut, lockClick);
  }
  pull.addEventListener('pointerup', release);
  pull.addEventListener('pointercancel', release);

  handle.addEventListener('keydown', function (e) {
    var d = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = 0.5;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -0.5;
    else if (e.key === 'Home') d = MIN - state.ft;
    else if (e.key === 'End') d = MAX - state.ft;
    else return;
    e.preventDefault();
    setValue(state.ft + d);
    tweenTo(state.ft, 120, easeOut, lockClick);
  });

  /* pieces, height, area */
  segs.forEach(function (b) {
    b.addEventListener('click', function () {
      segs.forEach(function (o) { var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', on); });
      state.piece = b.getAttribute('data-piece');
      heightField.hidden = !(state.piece === 'wardrobe' || state.piece === 'panels');
      renderDrawing(); updateLink();
    });
  });
  heightSel.addEventListener('change', function () { renderDrawing(); updateLink(); });
  area.addEventListener('input', updateLink);

  /* init */
  state.len = MIN;
  measure();
  setValue(7, true);
  setLen(MIN);
  var played = false;
  function intro() {
    if (played) return; played = true;
    if (reduce) { setLen(7); return; }
    tweenTo(7, 1300, easeBack, lockClick);
  }
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { intro(); io2.disconnect(); }
    }, { threshold: 0.35 });
    io2.observe(pull);
  } else { setLen(7); }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var l = played ? state.ft : state.len; state.len = l; measure(); }, 120); });
})();
