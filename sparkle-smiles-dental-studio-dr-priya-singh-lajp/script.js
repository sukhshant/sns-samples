(function () {
  'use strict';
  var NUM = '916201693706';
  var root = document.documentElement;
  root.classList.add('js');

  var reasons = [
    { label: 'Check-up', h: 'Check-up', p: "Not sure when you last had one? Message us and Dr Priya Singh's team will guide you on the next step.", line: 'a dental check-up' },
    { label: 'Toothache', h: 'Toothache', p: "Tell us what you have noticed and Dr Priya Singh's team will guide you on the next step.", line: 'a toothache' },
    { label: 'Cleaning', h: 'Cleaning', p: 'Ask us about a cleaning. Send a message and we will tell you how to go ahead.', line: 'a dental cleaning' },
    { label: 'Smile and shade', h: 'Smile and shade', p: 'Curious about your smile or the shade of your teeth? Ask us. No pressure, just a chat.', line: 'my smile and the shade of my teeth' },
    { label: "Child's visit", h: "Child's visit", p: "Bringing a little one? Write to us and we will guide you gently on the next step.", line: "a child's dental visit" },
    { label: 'Something else', h: 'Something else', p: 'Not on the list? Tell us what is bothering you in your own words and we will reply.', line: 'a dental concern' }
  ];
  var state = { i: 0, who: 'me', when: 'not sure' };

  var swatches = Array.prototype.slice.call(document.querySelectorAll('.swatch'));
  var panel = document.getElementById('shade-panel');
  var ph = document.getElementById('panel-h');
  var pp = document.getElementById('panel-p');
  var bubble = document.getElementById('bubble');
  var sendWa = document.getElementById('send-wa');
  var panelWa = document.getElementById('panel-wa');
  var extra = document.getElementById('extra');

  function wa(text) { return 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(text); }

  function build() {
    var r = reasons[state.i];
    var who = state.who === 'me' ? 'I' : 'I am writing for ' + state.who + '. We';
    var msg = 'Hello Dr Priya Singh, ' + (state.who === 'me' ? 'I would like to ask about ' : 'we would like to ask about ') + r.line + '.';
    if (state.who !== 'me') msg = 'Hello Dr Priya Singh, I am writing for ' + state.who + '. We would like to ask about ' + r.line + '.';
    msg += ' Timing: ' + state.when + '.';
    var x = extra.value.trim();
    if (x) msg += ' ' + x;
    msg += ' Thank you.';
    return msg;
  }

  function render() {
    var msg = build();
    bubble.textContent = msg;
    sendWa.href = wa(msg);
    panelWa.href = wa('Hello Dr Priya Singh, I would like to ask about ' + reasons[state.i].line + '.');
  }

  function select(i, focus) {
    state.i = i;
    swatches.forEach(function (s, k) {
      var on = k === i;
      s.setAttribute('aria-checked', on ? 'true' : 'false');
      s.tabIndex = on ? 0 : -1;
    });
    panel.style.setProperty('--shade', swatches[i].dataset.tone);
    ph.textContent = reasons[i].h;
    pp.textContent = reasons[i].p;
    if (focus) {
      swatches[i].focus();
      try { swatches[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch (e) {}
    }
    render();
  }

  swatches.forEach(function (s, i) {
    s.addEventListener('click', function () { select(i, false); });
    s.addEventListener('keydown', function (e) {
      var n = swatches.length, k = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + n) % n;
      else if (e.key === 'Home') k = 0;
      else if (e.key === 'End') k = n - 1;
      if (k !== null) { e.preventDefault(); select(k, true); }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
    c.addEventListener('click', function () {
      var g = c.dataset.group;
      Array.prototype.forEach.call(document.querySelectorAll('.chip[data-group="' + g + '"]'), function (o) {
        o.setAttribute('aria-checked', o === c ? 'true' : 'false');
      });
      state[g] = c.dataset.v;
      render();
    });
  });
  extra.addEventListener('input', render);

  // generic WhatsApp links follow the chosen reason
  Array.prototype.forEach.call(document.querySelectorAll('[data-wa]'), function (a) {
    if (a === panelWa) return;
    a.addEventListener('click', function () {
      a.href = wa('Hello Dr Priya Singh, I would like to ask about ' + reasons[state.i].line + '.');
    });
  });

  select(0, false);

  // reveal on scroll
  var els = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(els, function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }
})();
