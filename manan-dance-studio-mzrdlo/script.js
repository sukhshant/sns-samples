(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = 'https://wa.me/919717065235?text=';

  var STEPS = [
    { k: 'Style', o: ['Bollywood', 'Hip Hop', 'Contemporary', 'Wedding Choreography'] },
    { k: 'Who', o: ['Me', 'Me and a friend', 'Family or group'] },
    { k: 'Level', o: ['Beginner', 'Done some dance'] },
    { k: 'Day', o: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    { k: 'Time', o: ['Morning (7-12)', 'Afternoon (12-5)', 'Evening (5-9)'] },
    { k: 'Start', o: ['This week', 'Next week'] },
    { k: 'Name', input: true },
    { k: 'Send' }
  ];
  var ans = new Array(8);
  var cur = 0;
  var reached = false;

  var tilesEl = document.getElementById('tiles');
  var panel = document.getElementById('panel');
  var barEl = document.getElementById('bar');
  if (!tilesEl) return;

  var tiles = STEPS.map(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile';
    b.textContent = i + 1;
    b.setAttribute('aria-label', 'Count ' + (i + 1) + ', ' + s.k);
    b.addEventListener('click', function () { go(i); });
    tilesEl.appendChild(b);
    return b;
  });

  // soft click, only after a tap
  var ctx;
  function click(n) {
    if (reduce) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 520 + n * 45;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.035, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.09);
    } catch (e) {}
  }

  function firstOpen() {
    for (var i = 0; i < 7; i++) if (!ans[i]) return i;
    return 7;
  }

  function message() {
    return "Hi Manan Sir, I'd like the free trial class. Style: " + ans[0] + '. Who: ' + ans[1] +
      '. Level: ' + ans[2] + '. Preferred day: ' + ans[3] + ', time: ' + ans[4] +
      '. Starting: ' + ans[5] + '. Name: ' + ans[6] + '. Please confirm a slot.';
  }

  function render() {
    var open = firstOpen();
    var done = 0;
    tiles.forEach(function (t, i) {
      var filled = i < 7 ? !!ans[i] : open === 7 && reached;
      if (filled) done++;
      t.classList.toggle('done', filled);
      t.classList.toggle('active', i === cur);
      t.disabled = i > open;
      if (i === cur) t.setAttribute('aria-current', 'step'); else t.removeAttribute('aria-current');
    });
    barEl.style.transform = 'scaleX(' + done / 8 + ')';

    var s = STEPS[cur];
    panel.innerHTML = '';
    var h = document.createElement('h3');
    h.textContent = (cur + 1) + '. ' + s.k;
    panel.appendChild(h);

    if (s.o) {
      var g = document.createElement('div');
      g.className = 'opts';
      g.setAttribute('role', 'group');
      g.setAttribute('aria-label', s.k);
      s.o.forEach(function (label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'opt';
        b.textContent = label;
        b.setAttribute('aria-pressed', ans[cur] === label ? 'true' : 'false');
        b.addEventListener('click', function () { pick(label); });
        g.appendChild(b);
      });
      panel.appendChild(g);
    } else if (s.input) {
      var w = document.createElement('div');
      w.className = 'namebox';
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.placeholder = 'Your name';
      inp.maxLength = 40;
      inp.autocomplete = 'given-name';
      inp.setAttribute('aria-label', 'Your name');
      inp.value = ans[6] || '';
      var nb = document.createElement('button');
      nb.type = 'button';
      nb.className = 'btn btn-lime';
      nb.textContent = 'Next';
      var submit = function () {
        var v = inp.value.trim();
        if (!v) { inp.focus(); return; }
        ans[6] = v;
        click(6);
        cur = 7; reached = true;
        render(); beat();
      };
      nb.addEventListener('click', submit);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      w.appendChild(inp); w.appendChild(nb);
      panel.appendChild(w);
      if (matchMedia('(hover: hover)').matches) inp.focus({ preventScroll: true });
    } else {
      var ul = document.createElement('dl');
      ul.className = 'sum';
      [['Style', 0], ['Who', 1], ['Level', 2], ['Day', 3], ['Time', 4], ['Start', 5], ['Name', 6]].forEach(function (r) {
        var dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = r[0]; dd.textContent = ans[r[1]] || '';
        dt.style.color = 'rgba(241,242,234,.7)';
        ul.appendChild(dt); ul.appendChild(dd);
      });
      var a = document.createElement('a');
      a.className = 'btn btn-lime send';
      a.target = '_blank';
      a.rel = 'noopener';
      a.href = WA + encodeURIComponent(message());
      a.textContent = 'Send on WhatsApp';
      panel.appendChild(ul);
      panel.appendChild(a);
    }
  }

  function go(i) {
    if (i > firstOpen()) return;
    click(i);
    cur = i;
    render();
  }

  function pick(label) {
    ans[cur] = label;
    click(cur);
    var t = tiles[cur];
    if (!reduce) { t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); }
    var next = firstOpen();
    render();
    setTimeout(function () {
      cur = next;
      render();
      if (cur === 6 && matchMedia('(hover: hover)').matches) { /* input focuses itself */ }
    }, reduce ? 0 : 220);
  }

  function beat() {
    if (reduce) return;
    tilesEl.classList.remove('beat');
    void tilesEl.offsetWidth;
    tilesEl.classList.add('beat');
  }

  render();

  // reveal on scroll
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  // highlight the nav link for the section in view
  var links = document.querySelectorAll('.bar nav a');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    ['counts', 'reviews', 'visit'].forEach(function (id) { var el = document.getElementById(id); if (el) so.observe(el); });
  }
})();
