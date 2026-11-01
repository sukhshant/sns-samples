(function () {
  'use strict';
  var WA = 'https://wa.me/919891464600?text=';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    revealEls.forEach(function (n, i) {
      n.style.transitionDelay = Math.min((i % 4) * 60, 180) + 'ms';
      io.observe(n);
    });
  } else {
    revealEls.forEach(function (n) { n.classList.add('in'); });
  }

  /* ---------- stars ---------- */
  var STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.6 4.8 17.5 6 11.7 1.6 7.7l5.9-.7z"/></svg>';
  [].forEach.call(document.querySelectorAll('.stars'), function (s) { s.innerHTML = new Array(6).join(STAR); });

  /* ---------- Wow A: Find your batch ---------- */
  var CLASSES = ['9', '10', '11', '12', 'B.Com(H)'];
  var DAYS = [
    { key: 'Weekday', label: 'Weekday (Mon-Sat, 11 AM-7 PM)', msg: 'Weekday (Mon-Sat)' },
    { key: 'Sunday', label: 'Sunday (11 AM-5 PM)', msg: 'Sunday' }
  ];
  function subjectsFor(c) {
    if (c === '9' || c === '10') return ['Mathematics'];
    if (c === '11' || c === '12') return ['Mathematics', 'Accountancy', 'Both'];
    if (c === 'B.Com(H)') return ['Accountancy'];
    return [];
  }
  var state = { cls: null, subject: null, day: null };
  var elClass = document.getElementById('chips-class');
  var elSubj = document.getElementById('chips-subject');
  var elDay = document.getElementById('chips-day');
  var body = document.getElementById('ledger-body');
  var cta = document.getElementById('l-cta');
  var swapTimer;

  function chip(label, pressed, onClick) {
    var b = el('button', 'chip', label);
    b.type = 'button';
    b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    b.addEventListener('click', onClick);
    return b;
  }
  function renderClass() {
    elClass.textContent = '';
    CLASSES.forEach(function (c) {
      elClass.appendChild(chip(c === 'B.Com(H)' ? c : 'Class ' + c, state.cls === c, function () {
        if (state.cls === c) return;
        state.cls = c;
        if (subjectsFor(c).indexOf(state.subject) < 0) state.subject = null;
        renderClass(); renderSubject(true); update(false);
      }));
    });
  }
  function renderSubject(animate) {
    elSubj.textContent = '';
    elSubj.classList.remove('fade-in');
    var list = subjectsFor(state.cls);
    if (!list.length) { elSubj.appendChild(el('p', 'chips__hint', 'Pick a class first.')); return; }
    list.forEach(function (s) {
      elSubj.appendChild(chip(s === 'Both' ? 'Both (Maths and Accounts)' : s, state.subject === s, function () {
        state.subject = s; renderSubject(false); update(false);
      }));
    });
    if (animate && !reduce) { void elSubj.offsetWidth; elSubj.classList.add('fade-in'); }
  }
  function renderDay() {
    elDay.textContent = '';
    DAYS.forEach(function (d) {
      elDay.appendChild(chip(d.label, state.day === d.key, function () {
        state.day = d.key; renderDay(); update(true);
      }));
    });
  }
  function subjectWords() {
    return state.subject === 'Both' ? 'Mathematics and Accountancy' : state.subject;
  }
  function buildMessage() {
    var d = DAYS.filter(function (x) { return x.key === state.day; })[0];
    return "Hello Rajesh sir, I'd like to book a demo class. Class: " + state.cls +
      '. Subject: ' + state.subject + '. Preferred day: ' + d.msg + '. Please share the batch timing.';
  }
  function fill() {
    var d = DAYS.filter(function (x) { return x.key === state.day; })[0];
    document.getElementById('l-class').textContent = state.cls ? (state.cls === 'B.Com(H)' ? state.cls : 'Class ' + state.cls) : '-';
    document.getElementById('l-subject').textContent = state.subject ? subjectWords() : '-';
    document.getElementById('l-day').textContent = d ? d.msg : '-';
    var desc = document.getElementById('l-desc');
    var ready = state.cls && state.subject && state.day;
    if (ready) {
      var forWhom = state.cls === 'B.Com(H)' ? 'B.Com(H)' : 'Class ' + state.cls;
      desc.textContent = subjectWords() + ' for ' + forWhom + ' with Rajesh sir';
      cta.href = WA + encodeURIComponent(buildMessage());
      cta.classList.remove('is-disabled');
      cta.removeAttribute('aria-disabled');
      cta.removeAttribute('tabindex');
    } else {
      desc.textContent = 'Choose a class, subject and day to fill this line.';
      cta.href = '#find';
      cta.classList.add('is-disabled');
      cta.setAttribute('aria-disabled', 'true');
      cta.setAttribute('tabindex', '-1');
    }
    return ready;
  }
  function update(isLast) {
    clearTimeout(swapTimer);
    if (reduce) { var r0 = fill(); if (r0 && isLast) scrollToResult(); return; }
    body.classList.add('swap');
    swapTimer = setTimeout(function () {
      var ready = fill();
      body.classList.remove('swap');
      if (ready && isLast) scrollToResult();
    }, 250);
  }
  function scrollToResult() {
    if (window.innerWidth < 900) {
      document.getElementById('ledger').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
  }
  cta.addEventListener('click', function (e) { if (cta.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
  renderClass(); renderSubject(false); renderDay(); fill();

  /* ---------- Wow B: review explorer ---------- */
  var THEMES = [
    { key: 'all', label: 'All', ask: 'joining', kw: null },
    { key: 'maths', label: 'Maths', ask: 'maths', kw: /\b(maths|mathematics)\b/gi },
    { key: 'accounts', label: 'Accounts', ask: 'accounts', kw: /\b(accounts|accountancy)\b/gi },
    { key: 'doubts', label: 'Doubts', ask: 'doubts', kw: /\bdoubts?\b/gi },
    { key: 'scores', label: 'Scores', ask: 'scores', kw: /\b(scores?|scorer|percentage)\b/gi },
    { key: 'sir', label: 'Rajesh sir', ask: 'his teaching', kw: /\bsir\b/gi }
  ];
  var cards = [].slice.call(document.querySelectorAll('.rcard'));
  var chipsWrap = document.getElementById('rev-chips');
  var count = document.getElementById('rev-count');
  var ask = document.getElementById('rev-cta');
  var theme = THEMES[0];
  cards.forEach(function (c) {
    var q = c.querySelector('.q');
    q.setAttribute('data-orig', q.textContent);
  });

  function highlight(q, re) {
    var text = q.getAttribute('data-orig');
    q.textContent = '';
    if (!re) { q.textContent = text; return; }
    var last = 0, m, n = 0;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) q.appendChild(document.createTextNode(text.slice(last, m.index)));
      var mk = el('mark', 'hl', m[0]);
      mk.style.animationDelay = (n++ * 80) + 'ms';
      q.appendChild(mk);
      last = m.index + m[0].length;
    }
    q.appendChild(document.createTextNode(text.slice(last)));
  }

  function applyTheme(t) {
    theme = t;
    var shown = 0;
    cards.forEach(function (c) {
      var tags = c.getAttribute('data-tags').split(' ');
      var match = t.key === 'all' || tags.indexOf(t.key) >= 0;
      c.classList.toggle('is-out', !match);
      if (match) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
      if (match) shown++;
      highlight(c.querySelector('.q'), match ? t.kw : null);
    });
    count.textContent = shown + ' of ' + cards.length + ' reviews';
    ask.textContent = 'Ask Rajesh sir about ' + t.ask;
    ask.href = WA + encodeURIComponent('Hello Rajesh sir, I read the reviews about ' + t.ask + ' and want to talk about joining. Can you call me?');
    [].forEach.call(chipsWrap.children, function (b, i) {
      b.setAttribute('aria-pressed', THEMES[i] === t ? 'true' : 'false');
    });
  }
  THEMES.forEach(function (t) {
    var b = el('button', 'chip', t.label);
    b.type = 'button';
    b.addEventListener('click', function () { applyTheme(t); });
    chipsWrap.appendChild(b);
  });
  applyTheme(THEMES[0]);
})();
