(function () {
  'use strict';
  var WA = 'https://wa.me/919810264002?text=';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = 'Menu';
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Wow A: class and subject finder ---------- */
  var state = { cls: '', subs: [], time: '' };
  var entryLine = document.getElementById('entry-line');
  var entryNote = document.getElementById('entry-note');
  var demoBtn = document.getElementById('demo-btn');
  var demoHelp = document.getElementById('demo-help');
  var SUBJECT_ORDER = ['Accountancy', 'Economics'];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fade(el) {
    if (reduce) return;
    el.classList.remove('fade-in');
    void el.offsetWidth;
    el.classList.add('fade-in');
  }
  function subjectText() { return SUBJECT_ORDER.filter(function (s) { return state.subs.indexOf(s) > -1; }).join(' + '); }

  function renderRegister() {
    var sub = subjectText();
    var parts = [
      state.cls ? esc('Class ' + state.cls) : '<span class="ph">Class __</span>',
      sub ? esc(sub) : '<span class="ph">Subject __</span>',
      state.time ? esc(state.time) : '<span class="ph">Time __</span>'
    ];
    entryLine.innerHTML = parts.join(' <span class="bar">|</span> ');
    fade(entryLine);

    var note;
    var onlyAcc = state.subs.length === 1 && state.subs[0] === 'Accountancy';
    if (!state.subs.length) {
      note = '<p class="note-quote">Choose a subject to see what a student wrote on Google.</p>';
    } else if (onlyAcc) {
      note = '<p class="note-quote"><q>got a gold medal in accountancy in 2017 DPS Mathura Road boards exam for scoring the highest due to the efforts of the teachers here</q><span class="note-who mono">Siddhant Kaushik, on Google Maps</span></p>';
    } else {
      note = '<p class="note-quote"><q>The way concepts are explained is both clear and engaging, making even the most challenging topics easier to understand and apply.</q><span class="note-who mono">Yashwin Anand, on Google Maps</span></p>';
    }
    var key = onlyAcc ? 'a' : (state.subs.length ? 'e' : 'n');
    if (entryNote.getAttribute('data-key') !== key) {
      entryNote.innerHTML = note;
      entryNote.setAttribute('data-key', key);
      fade(entryNote);
    }

    var missing = [];
    if (!state.cls) missing.push('class');
    if (!state.subs.length) missing.push('subject');
    if (!state.time) missing.push('time');
    if (missing.length) {
      demoBtn.setAttribute('aria-disabled', 'true');
      demoBtn.setAttribute('role', 'button');
      demoBtn.removeAttribute('href');
      demoBtn.removeAttribute('target');
      demoBtn.removeAttribute('rel');
      demoBtn.setAttribute('tabindex', '0');
      demoHelp.textContent = 'Still needed: ' + missing.join(', ') + '.';
    } else {
      var msg = 'Hello Paul Coaching Centres, I would like to ask about a demo class. Class: ' + state.cls +
        '. Subject: ' + sub + '. Preferred time: ' + state.time + '. Please let me know the next steps.';
      demoBtn.setAttribute('aria-disabled', 'false');
      demoBtn.removeAttribute('role');
      demoBtn.removeAttribute('tabindex');
      demoBtn.href = WA + encodeURIComponent(msg);
      demoBtn.target = '_blank';
      demoBtn.rel = 'noopener';
      demoHelp.textContent = 'This opens WhatsApp with your choices filled in.';
    }
  }

  var chips = document.querySelectorAll('.chip');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var g = chip.getAttribute('data-group');
      var v = chip.getAttribute('data-value');
      var on = chip.getAttribute('aria-pressed') === 'true';
      if (g === 'subject') {
        var i = state.subs.indexOf(v);
        if (i > -1) state.subs.splice(i, 1); else state.subs.push(v);
        chip.setAttribute('aria-pressed', String(i === -1));
      } else {
        document.querySelectorAll('.chip[data-group="' + g + '"]').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        if (on) { state[g === 'class' ? 'cls' : 'time'] = ''; }
        else { state[g === 'class' ? 'cls' : 'time'] = v; chip.setAttribute('aria-pressed', 'true'); }
      }
      renderRegister();
    });
  });
  demoBtn.addEventListener('click', function (e) {
    if (demoBtn.getAttribute('aria-disabled') === 'true') e.preventDefault();
  });
  demoBtn.addEventListener('keydown', function (e) {
    if (e.key === ' ' && demoBtn.getAttribute('aria-disabled') !== 'true') { e.preventDefault(); demoBtn.click(); }
  });
  renderRegister();
  entryNote.removeAttribute('data-key');
  renderRegister();

  /* ---------- Wow B: roadmap ---------- */
  var STOPS = [
    { name: 'Class 11 begins',
      copy: 'Accountancy and Economics start with plain explanations. One idea at a time, until it makes sense.',
      quote: 'The teachers are very supportive and explain concepts in a simple and clear way, which makes studying much easier.', who: 'Raisha' },
    { name: 'Doubts, any time',
      copy: 'Questions are welcome. A doubt is not left hanging until the next chapter.',
      quote: 'They are always ready to solve doubts, even outside class hours.', who: 'Raisha' },
    { name: 'Study material and tests',
      copy: 'Notes that are laid out well, and tests that come regularly, so you can see where to improve.',
      quote: 'The study material and tests are well-structured and actually help with preparation. Regular tests keep you consistent and help you understand where you need to improve.', who: 'Raisha' },
    { name: 'Life rules and discipline',
      copy: 'Marks matter here, but so do habits, values and the right mindset.',
      quote: 'This coaching center does not focus only on academics. It also teaches life rules, discipline, values, and the right mindset, which are equally important for a student’s growth.', who: 'Dev Saini' },
    { name: 'Class 12 boards',
      copy: 'One former student, in his own words, credits the teachers for his boards result. This is his claim, as he says it.',
      quote: 'got a gold medal in accountancy in 2017 DPS Mathura Road boards exam for scoring the highest due to the efforts of the teachers here', who: 'Siddhant Kaushik' },
    { name: 'Towards DU and SRCC',
      copy: 'Delhi University, and SRCC in particular, is the aim many families have in mind.',
      quote: 'ALL TEACHERS PAUL SIR , HARISH SIR , HARDIK SIR AND NILESH SIR ARE THE BEST and motivate children for  DU especially SRCC', who: 'Vedika Sharma' }
  ];
  var rail = document.getElementById('rail');
  var marker = document.getElementById('marker');
  var fill = document.getElementById('rail-fill');
  var range = document.getElementById('range');
  var card = document.getElementById('road-card');
  var stopBtns = document.querySelectorAll('.stop');
  var current = -1;
  var N = STOPS.length;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function setPos(frac) {
    var pct = Math.max(0, Math.min(1, frac)) * 100;
    marker.style.left = pct + '%';
    fill.style.width = pct + '%';
  }
  function show(i, fromInit) {
    if (i === current) return;
    current = i;
    var s = STOPS[i];
    document.getElementById('rc-step').textContent = 'Stop ' + pad(i + 1) + ' of ' + pad(N);
    document.getElementById('rc-name').textContent = s.name;
    document.getElementById('rc-copy').textContent = s.copy;
    document.getElementById('rc-quote').textContent = '“' + s.quote + '”';
    document.getElementById('rc-who').textContent = s.who + ', on Google Maps';
    var msg = 'Hello Paul Coaching Centres, I am a student/parent looking at the stage: ' + s.name + '. Could you tell me how you help here?';
    document.getElementById('rc-btn').href = WA + encodeURIComponent(msg);
    range.value = String(i);
    range.setAttribute('aria-valuetext', 'Stop ' + (i + 1) + ' of ' + N + ': ' + s.name);
    stopBtns.forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    if (!fromInit) { fade(card); }
  }
  function goTo(i) { i = Math.max(0, Math.min(N - 1, i)); setPos(i / (N - 1)); show(i); }

  var dragging = false;
  function fracFromEvent(e) {
    var r = rail.getBoundingClientRect();
    return (e.clientX - r.left) / r.width;
  }
  marker.addEventListener('pointerdown', function (e) {
    dragging = true;
    marker.classList.add('drag'); rail.classList.add('dragging');
    marker.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  marker.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var f = Math.max(0, Math.min(1, fracFromEvent(e)));
    setPos(f);
    show(Math.round(f * (N - 1)));
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    marker.classList.remove('drag'); rail.classList.remove('dragging');
    try { marker.releasePointerCapture(e.pointerId); } catch (err) {}
    goTo(current);
  }
  marker.addEventListener('pointerup', endDrag);
  marker.addEventListener('pointercancel', endDrag);
  stopBtns.forEach(function (b) {
    b.addEventListener('click', function () { goTo(parseInt(b.getAttribute('data-i'), 10)); });
  });
  rail.addEventListener('click', function (e) {
    if (e.target === rail || e.target.classList.contains('rail-line') || e.target.classList.contains('rail-fill')) {
      goTo(Math.round(Math.max(0, Math.min(1, fracFromEvent(e))) * (N - 1)));
    }
  });
  range.addEventListener('input', function () { goTo(parseInt(range.value, 10)); });
  range.addEventListener('change', function () { goTo(parseInt(range.value, 10)); });
  setPos(0); show(0, true);
})();
