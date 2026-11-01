(function () {
  'use strict';
  var WA = 'https://wa.me/919818577111';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* image fallback */
  window.isbeFb = function (img) {
    if (!img || img.dataset.done) return;
    img.dataset.done = '1';
    var wide = img.width > img.height * 1.1 || /Pearson/.test(img.dataset.fb || '');
    var d = document.createElement('div');
    d.className = 'fb' + (wide ? ' fb--wide' : '');
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', img.alt || '');
    d.innerHTML = '<span>Certificate on the wall</span><strong></strong><span>THE INSTITUTE OF STANDARD BRITISH ENGLISH</span>';
    d.querySelector('strong').textContent = img.dataset.fb || 'Certificate';
    img.replaceWith(d);
  };
  document.querySelectorAll('img[data-fb]').forEach(function (i) {
    if (i.dataset.failed || (i.complete && i.naturalWidth === 0 && i.currentSrc)) isbeFb(i);
  });

  /* reveal on scroll */
  var rv = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    rv.forEach(function (e) { io.observe(e); });
  }

  /* fade swap helper */
  function swap(el, fn) {
    if (reduce) { fn(); return; }
    el.classList.add('swap');
    setTimeout(function () { fn(); el.classList.remove('swap'); }, 160);
  }

  /* WOW 1: finder */
  var LINES = {
    'IELTS Academic': 'Academic or General, with speaking practice and feedback on mistakes, the thing students on Google praise most.',
    'IELTS General': 'Academic or General, with speaking practice and feedback on mistakes, the thing students on Google praise most.',
    'PTE Academic': 'Pearson PTE association on the wall.',
    'OET': 'One of the courses Nitin Bhagat sir teaches, and listed on the institute\'s own flyer.',
    'CELPIP': 'A student on Google reached her desired CELPIP score with Nitin Bhagat sir\'s guidance.',
    'Spoken English': 'Mock debates, pronunciation and doubt-clearing, as students describe.',
    'Grammar': 'Listed on the institute\'s own flyer.',
    'Interview Skills': 'One of the courses Nitin Bhagat sir teaches.',
    'French': 'Listed on the institute\'s own flyer.',
    'German': 'Listed on the institute\'s own flyer.'
  };
  var fin = document.querySelector('[data-finder]');
  if (fin) {
    var state = { programme: '', format: 'No preference', timing: 'No preference' };
    var body = fin.querySelector('#f-result'), title = fin.querySelector('#f-title'), line = fin.querySelector('#f-line'),
        sel = fin.querySelector('#f-sel'), btn = fin.querySelector('#f-btn'), help = fin.querySelector('#f-help');
    var render = function () {
      if (!state.programme) {
        title.textContent = 'Choose a programme above';
        line.textContent = 'Your match will appear here, with one plain line on why.';
        sel.textContent = 'Your selection: nothing yet';
        btn.classList.add('is-disabled'); btn.setAttribute('aria-disabled', 'true'); btn.setAttribute('tabindex', '-1'); btn.href = '#finder';
        help.style.display = '';
        return;
      }
      title.textContent = state.programme;
      line.textContent = LINES[state.programme];
      sel.textContent = 'Your selection: ' + state.programme + ' / ' + state.format + ' / ' + state.timing;
      var msg = 'Hello, I found The Institute of Standard British English online. I would like a demo class for ' +
        state.programme + ', ' + state.format + ', ' + state.timing + '. Please share the next available batch.';
      btn.href = WA + '?text=' + encodeURIComponent(msg);
      btn.classList.remove('is-disabled'); btn.removeAttribute('aria-disabled'); btn.removeAttribute('tabindex');
      help.style.display = 'none';
    };
    fin.querySelectorAll('.chips').forEach(function (g) {
      var key = g.dataset.group, chips = [].slice.call(g.querySelectorAll('.chip'));
      chips.forEach(function (c, i) {
        c.addEventListener('click', function () {
          chips.forEach(function (o) { o.setAttribute('aria-checked', o === c ? 'true' : 'false'); });
          state[key] = c.dataset.v;
          swap(body, render);
        });
        c.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
          if (d) { e.preventDefault(); var n = chips[(i + d + chips.length) % chips.length]; n.focus(); n.click(); }
        });
      });
    });
    btn.addEventListener('click', function (e) { if (btn.classList.contains('is-disabled')) e.preventDefault(); });
    render();
  }

  /* WOW 2: skill lab */
  var SKILLS = [
    { name: 'Speaking', line: 'Speaking is where the IELTS training puts its weight, through practical sessions and valuable feedback.',
      q: 'The training focused especially on speaking skills, which significantly improved my confidence and fluency.',
      hi: 'significantly improved my confidence and fluency', who: 'Vinodh V S' },
    { name: 'Writing', line: 'Feedback on your mistakes, so you can see what to work on next.',
      q: 'Your feedback helped me understand my mistakes, and your encouragement gave me the confidence to keep working on them.',
      hi: 'Your feedback helped me understand my mistakes', who: 'Jigyasa Arora' },
    { name: 'Listening and Reading', line: 'Reading, listening, writing and speaking are worked on together with Nitin Bhagat sir.',
      q: 'He makes students feel comfortable and helps them improve their reading, listening, writing, and speaking skills significantly.',
      hi: 'improve their reading, listening, writing, and speaking skills significantly', who: 'Om Kumar' },
    { name: 'Confidence', line: 'Mock debates and supportive teachers who bring every student into the conversation.',
      q: 'The institute provides an excellent platform for learning and helps students overcome their hesitation while speaking English.',
      hi: 'helps students overcome their hesitation while speaking English', who: 'Kavita sharma' },
    { name: 'Pronunciation', line: 'Pronunciation and personality, with doubts cleared during the sessions.',
      q: 'In my opinion, this institute provides an excellent platform to improve pronunciation skills and overall personality.',
      hi: 'excellent platform to improve pronunciation skills and overall personality', who: 'Seema Rathi' }
  ];
  var STAGES = ['Just starting', 'Some practice', 'Exam soon'];
  var CLOSE = ['Start with a demo class', 'Ask about a regular batch', 'Ask what fits before the exam'];
  var lab = document.querySelector('[data-lab]');
  if (lab) {
    var tabs = [].slice.call(lab.querySelectorAll('.seg__tab')), panel = lab.querySelector('#lab-panel'),
        lt = lab.querySelector('#l-title'), ll = lab.querySelector('#l-line'), lq = lab.querySelector('#l-quote'),
        lc = lab.querySelector('#l-cite'), rng = lab.querySelector('#l-range'), lcl = lab.querySelector('#l-close'),
        lb = lab.querySelector('#l-btn');
    var cur = 0;
    var link = function () {
      var msg = 'Hello Nitin sir, I want to work on my ' + SKILLS[cur].name.toLowerCase() + '. I am at the ' +
        STAGES[+rng.value].toLowerCase() + ' stage. Could you suggest a batch?';
      lb.href = WA + '?text=' + encodeURIComponent(msg);
    };
    var paint = function () {
      var s = SKILLS[cur];
      lt.textContent = s.name; ll.textContent = s.line;
      var at = s.q.indexOf(s.hi);
      lq.textContent = '';
      lq.appendChild(document.createTextNode('“' + s.q.slice(0, at)));
      var m = document.createElement('mark'); m.textContent = s.hi; lq.appendChild(m);
      lq.appendChild(document.createTextNode(s.q.slice(at + s.hi.length) + '”'));
      lc.textContent = s.who + ', 5 stars, on Google Maps';
      panel.setAttribute('aria-labelledby', 't' + cur);
      link();
    };
    var pick = function (i, focus) {
      cur = i;
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1; });
      if (focus) tabs[i].focus();
      tabs[i].scrollIntoView && tabs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
      swap(panel, paint);
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(i, false); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); pick((i + d + tabs.length) % tabs.length, true); }
      });
    });
    rng.addEventListener('input', function () {
      lcl.textContent = CLOSE[+rng.value];
      rng.setAttribute('aria-valuetext', STAGES[+rng.value]);
      link();
    });
    paint();
  }

  /* review read more */
  document.querySelectorAll('.more').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.getAttribute('aria-controls'));
      var open = t.classList.toggle('is-clamped') === false;
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? 'Show less' : 'Read more';
    });
  });
})();
