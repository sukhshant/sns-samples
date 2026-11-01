(function () {
  'use strict';
  var WA = 'https://wa.me/918287019324';
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveal on first view ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- today in the hours table ---------- */
  var rows = document.querySelectorAll('.hours tr');
  var ti = (new Date().getDay() + 6) % 7;
  if (rows[ti]) rows[ti].classList.add('today');

  /* ---------- Wow 1: demo class scheduler ---------- */
  var GRADES = ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12'];
  var SUBJECTS = ['Maths', 'Science', 'English', 'Hindi', 'Social Science', 'Not sure yet'];
  var SLOTS = ['10 AM-1 PM', '1-4 PM', '4-7 PM'];

  var days = [];
  var now = new Date();
  for (var i = 0; i < 7; i++) {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    days.push({ dn: DAYS[d.getDay()], dd: d.getDate(), dm: MONTHS[d.getMonth()], label: DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()], today: i === 0 });
  }

  var state = { grade: '', subject: [], day: days[0].label, slot: '' };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function chip(label, group, value) {
    var b = el('button', 'chip', label);
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.dataset.group = group;
    b.dataset.value = value || label;
    return b;
  }

  function step(n, title, help, body) {
    var s = el('div', 'step');
    var h = el('div', 'step-h');
    h.appendChild(el('span', 'mono n', String(n)));
    h.appendChild(el('h3', '', title));
    s.appendChild(h);
    s.appendChild(el('p', 'help', help));
    s.appendChild(body);
    return s;
  }

  function buildSched() {
    var root = el('div', 'sched');

    var g = el('div', 'chips'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Class');
    GRADES.forEach(function (x) { g.appendChild(chip(x, 'grade')); });
    root.appendChild(step(1, 'Class', "Tell us your child's class. We will confirm the batch.", g));

    var s = el('div', 'chips subjects'); s.setAttribute('role', 'group'); s.setAttribute('aria-label', 'Subjects');
    SUBJECTS.forEach(function (x) { s.appendChild(chip(x, 'subject')); });
    root.appendChild(step(2, 'Subjects', 'Pick what your child needs help with.', s));

    var wrap = el('div', 'when-wrap');
    var ds = el('div', 'days'); ds.setAttribute('role', 'group'); ds.setAttribute('aria-label', 'Day');
    days.forEach(function (x) {
      var b = chip('', 'day', x.label);
      b.classList.add('day');
      b.appendChild(el('span', 'dn', x.today ? 'Today' : x.dn));
      b.appendChild(el('span', 'dd', String(x.dd)));
      b.appendChild(el('span', 'dm', x.dm));
      b.setAttribute('aria-label', x.label + (x.today ? ', today' : ''));
      ds.appendChild(b);
    });
    var sl = el('div', 'slots'); sl.setAttribute('role', 'group'); sl.setAttribute('aria-label', 'Time');
    SLOTS.forEach(function (x) { sl.appendChild(chip(x, 'slot')); });
    wrap.appendChild(ds); wrap.appendChild(sl);
    root.appendChild(step(3, 'Day and time', 'We are open every day, 10 AM to 7 PM.', wrap));

    var pv = el('div', 'preview');
    pv.appendChild(el('span', 'mono lab', 'Message preview'));
    var p = el('p', 'mono pv'); p.setAttribute('aria-live', 'polite');
    pv.appendChild(p);
    root.appendChild(pv);

    var send = el('button', 'btn btn-primary send', 'Choose a class and time');
    send.type = 'button'; send.disabled = true;
    root.appendChild(send);
    return root;
  }

  function messageText() {
    var t = 'Hello Star Tuition Classes, I would like to book a demo class. Class: ' + state.grade + '.';
    if (state.subject.length) t += ' Subjects: ' + state.subject.join(', ') + '.';
    t += ' Preferred day: ' + state.day + '. Preferred time: ' + state.slot + '. Please confirm if this works.';
    return t;
  }
  function ready() { return !!(state.grade && state.slot && state.day); }
  function schedUrl() { return WA + '?text=' + encodeURIComponent(messageText()); }

  function ph(text) { return el('span', 'ph', text); }
  function renderPreview(p) {
    p.textContent = '';
    p.appendChild(document.createTextNode('Hello Star Tuition Classes, I would like to book a demo class. Class: '));
    if (state.grade) p.appendChild(document.createTextNode(state.grade)); else p.appendChild(ph('choose class'));
    p.appendChild(document.createTextNode('.'));
    if (state.subject.length) p.appendChild(document.createTextNode(' Subjects: ' + state.subject.join(', ') + '.'));
    p.appendChild(document.createTextNode(' Preferred day: ' + state.day + '. Preferred time: '));
    if (state.slot) p.appendChild(document.createTextNode(state.slot)); else p.appendChild(ph('choose time'));
    p.appendChild(document.createTextNode('. Please confirm if this works.'));
  }

  function renderSched() {
    [].forEach.call(document.querySelectorAll('.sched'), function (root) {
      [].forEach.call(root.querySelectorAll('.chip'), function (c) {
        var g = c.dataset.group, v = c.dataset.value, on = false;
        if (g === 'grade') on = state.grade === v;
        else if (g === 'subject') on = state.subject.indexOf(v) > -1;
        else if (g === 'day') on = state.day === v;
        else if (g === 'slot') on = state.slot === v;
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      renderPreview(root.querySelector('.pv'));
      var send = root.querySelector('.send');
      var ok = ready();
      send.disabled = !ok;
      send.textContent = ok ? 'Send on WhatsApp' : 'Choose a class and time';
      send.dataset.url = ok ? schedUrl() : '';
    });
  }

  function onSchedClick(e) {
    var c = e.target.closest('.sched .chip');
    if (c) {
      var g = c.dataset.group, v = c.dataset.value;
      if (g === 'grade') state.grade = v;
      else if (g === 'day') state.day = v;
      else if (g === 'slot') state.slot = v;
      else if (g === 'subject') {
        var i = state.subject.indexOf(v);
        if (i > -1) state.subject.splice(i, 1);
        else if (v === 'Not sure yet') state.subject = [v];
        else { state.subject = state.subject.filter(function (x) { return x !== 'Not sure yet'; }); state.subject.push(v); }
        // keep the message in the order the chips are shown
        state.subject.sort(function (a, b) { return SUBJECTS.indexOf(a) - SUBJECTS.indexOf(b); });
      }
      renderSched();
      return;
    }
    var s = e.target.closest('.sched .send');
    if (s && !s.disabled) window.open(schedUrl(), '_blank', 'noopener');
  }

  [].forEach.call(document.querySelectorAll('[data-sched-mount]'), function (m) { m.appendChild(buildSched()); });
  document.addEventListener('click', onSchedClick);
  renderSched();

  /* drawer */
  var drawer = document.getElementById('drawer');
  var sheet = drawer.querySelector('.sheet');
  var lastFocus = null;

  function focusables() {
    return [].filter.call(sheet.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'), function (n) { return n.offsetParent !== null || n === document.activeElement; });
  }
  function openDrawer(from) {
    lastFocus = from || document.activeElement;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('locked');
    sheet.scrollTop = 0;
    drawer.querySelector('.sheet-body').scrollTop = 0;
    setTimeout(function () { var f = focusables(); (f[1] || f[0] || sheet).focus(); }, reduced ? 0 : 60);
  }
  function closeDrawer() {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open-drawer]');
    if (o) { e.preventDefault(); openDrawer(o); return; }
    if (e.target.closest('[data-close-drawer]')) closeDrawer();
  });
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
    if (e.key === 'Tab') {
      var f = focusables();
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (!sheet.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Wow 2: review explorer ---------- */
  var THEMES = [
    { id: 'all', label: 'All', words: [] },
    { id: 'understands', label: 'Understands each child', words: ['understands', 'requirements', 'helpful'] },
    { id: 'surprise', label: 'Surprise tests', words: ['suprise', 'surprise', 'test'] },
    { id: 'qualified', label: 'Qualified teacher', words: ['qualified', 'experienced', 'dedicated'] },
    { id: 'comfortable', label: 'Comfortable', words: ['comforting', 'comfortable', 'good behavior'] },
    { id: 'near', label: 'Near me', words: ['lajpat nagar', 'south delhi', 'area', 'near by'] }
  ];
  var reviews = [].map.call(document.querySelectorAll('#wall .rcard'), function (c) {
    return {
      text: c.querySelector('.quote').textContent,
      name: c.querySelector('.rname').textContent,
      when: c.querySelector('.when').textContent
    };
  });
  var chipsBox = document.getElementById('theme-chips');
  var listBox = document.getElementById('ex-list');
  var countBox = document.getElementById('ex-count');
  var waBtn = document.getElementById('ex-wa');
  var theme = THEMES[0];

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function matches(r, t) {
    var low = r.text.toLowerCase();
    return t.words.some(function (w) { return low.indexOf(w) > -1; });
  }
  function highlight(node, text, words) {
    node.textContent = '';
    if (!words.length) { node.textContent = text; return; }
    var re = new RegExp('(' + words.slice().sort(function (a, b) { return b.length - a.length; }).map(escapeRe).join('|') + ')', 'gi');
    var last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) node.appendChild(document.createTextNode(text.slice(last, m.index)));
      var mk = document.createElement('mark'); mk.textContent = m[0]; node.appendChild(mk);
      last = m.index + m[0].length;
    }
    if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
  }
  function starsEl() {
    var s = el('span', 'stars sm'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', '5 stars');
    s.innerHTML = '<svg><use href="#star"/></svg><svg><use href="#star"/></svg><svg><use href="#star"/></svg><svg><use href="#star"/></svg><svg><use href="#star"/></svg>';
    return s;
  }

  // build cards once, then toggle
  var cards = reviews.map(function (r) {
    var rv = el('div', 'rv');
    var clip = el('div', 'rv-clip'), pad = el('div', 'rv-pad'), card = el('article', 'ex-card');
    var q = el('p', 'quote');
    var f = el('footer');
    f.appendChild(el('span', 'mono rname-plain', r.name));
    f.appendChild(starsEl());
    f.appendChild(el('span', 'mono rmeta', 'on Google Maps, ' + r.when));
    card.appendChild(q); card.appendChild(f); pad.appendChild(card); clip.appendChild(pad); rv.appendChild(clip);
    listBox.appendChild(rv);
    return { rv: rv, q: q, r: r };
  });

  function renderExplorer() {
    var n = 0;
    cards.forEach(function (c) {
      var hit = theme.id === 'all' || matches(c.r, theme);
      if (hit) n++;
      highlight(c.q, c.r.text, hit ? theme.words : []);
      c.rv.classList.toggle('off', !hit);
      c.rv.setAttribute('aria-hidden', hit ? 'false' : 'true');
      if (!hit) c.rv.setAttribute('inert', ''); else c.rv.removeAttribute('inert');
    });
    var total = reviews.length;
    if (theme.id === 'all') countBox.textContent = 'Showing all ' + total + ' reviews';
    else countBox.textContent = n + ' of ' + total + (n === 1 ? ' reviews mentions this' : ' reviews mention this');
    var msg = 'Hello Star Tuition Classes, ';
    if (theme.id !== 'all') msg += 'I read the Google reviews about ' + theme.label.toLowerCase() + '. ';
    msg += 'I would like to visit and know more about classes for my child.';
    waBtn.href = WA + '?text=' + encodeURIComponent(msg);
    [].forEach.call(chipsBox.children, function (b) { b.setAttribute('aria-pressed', b.dataset.value === theme.id ? 'true' : 'false'); });
  }

  THEMES.forEach(function (t) {
    var b = chip(t.label, 'theme', t.id);
    b.addEventListener('click', function () { theme = t; renderExplorer(); });
    chipsBox.appendChild(b);
  });
  renderExplorer();
})();
