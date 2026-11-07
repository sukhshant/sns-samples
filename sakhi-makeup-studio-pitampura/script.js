(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal on scroll
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  // nail rack
  var nails = [].slice.call(document.querySelectorAll('.nail'));
  var bottles = [].slice.call(document.querySelectorAll('.bottle'));
  var nameEl = document.getElementById('shadeName');
  var dot = document.getElementById('dot');
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var dateEl = document.getElementById('date');
  var countEl = document.getElementById('count');
  var send = document.getElementById('send');
  var shade = { name: 'Teal', color: '#14808A' };
  var people = 1;
  var running = [];

  function commit(n, color) { n.querySelector('.nb').setAttribute('fill', color); }

  function paint(color) {
    // settle any sweep still running so quick taps stack cleanly
    running.forEach(function (a) { try { a.finish(); } catch (e) {} });
    running = [];
    var order = [4, 0, 1, 2, 3]; // thumb first, then pinky to index
    nails.forEach(function (n, k) {
      var sw = n.querySelector('.sw');
      var idx = order.indexOf(k);
      if (reduce || !sw.animate) { commit(n, color); return; }
      sw.setAttribute('fill', color);
      var a = sw.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 360, delay: idx * 80, easing: 'cubic-bezier(.5,.1,.2,1)', fill: 'both' });
      running.push(a);
      a.onfinish = function () { commit(n, color); a.cancel(); };
    });
  }

  function msg() {
    var picked = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; }).map(function (c) { return c.textContent.trim(); });
    var t = "Hi Sakhi Makeup Studio, I'd like a rough quote.";
    if (picked.length) t += ' Look: ' + picked.join(', ') + '.';
    if (picked.indexOf('Nails') > -1) t += ' Shade I love: ' + shade.name + '.';
    if (dateEl && dateEl.value) {
      var p = dateEl.value.split('-');
      var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1];
      if (m) t += ' Date: ' + (+p[2]) + ' ' + m + '.';
    }
    t += ' People: ' + people + '.';
    return t;
  }
  function sync() { send.href = 'https://wa.me/918700911979?text=' + encodeURIComponent(msg()); }

  bottles.forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.getAttribute('aria-pressed') === 'true') { paint(shade.color); return; }
      bottles.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      shade = { name: b.dataset.name, color: getComputedStyle(b).color };
      nameEl.textContent = shade.name;
      dot.style.background = shade.color;
      paint(shade.color);
      sync();
    });
  });
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      sync();
    });
  });
  document.getElementById('minus').addEventListener('click', function () { people = Math.max(1, people - 1); countEl.textContent = people; sync(); });
  document.getElementById('plus').addEventListener('click', function () { people = Math.min(30, people + 1); countEl.textContent = people; sync(); });
  if (dateEl) dateEl.addEventListener('change', sync);
  sync();

  // image fallback for images that failed before this script ran
  document.querySelectorAll('img[data-fb]').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.dataset.fb) { var f = img.dataset.fb; img.dataset.fb = ''; img.src = f; }
  });
})();
