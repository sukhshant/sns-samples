(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wall = document.getElementById('wall');
  var send = document.getElementById('send');
  var sel = {};
  var order = ['style', 'day', 'time'];
  var lights = { style: 'w1', day: 'w2', time: 'fig' };

  function msg() {
    return "Hi Jassi Ma'am, I'd like a trial class: " + sel.style + ', ' + sel.day + ', around ' + sel.time + '. Is there space?';
  }

  function update() {
    var done = order.every(function (k) { return sel[k]; });
    wall.classList.toggle('done', done);
    send.classList.toggle('ready', done);
    send.setAttribute('aria-disabled', done ? 'false' : 'true');
    if (done) send.href = 'https://wa.me/919310349929?text=' + encodeURIComponent(msg());
  }

  document.querySelectorAll('.step').forEach(function (step) {
    var key = step.getAttribute('data-key');
    step.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        step.querySelectorAll('button').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        sel[key] = b.getAttribute('data-v');
        var g = wall.querySelector('.' + lights[key]);
        if (g) {
          g.classList.add('on');
          if (key === 'time' && !reduce) {
            g.classList.remove('flick');
            void g.getBoundingClientRect();
            g.classList.add('flick');
          }
        }
        update();
      });
    });
  });

  send.setAttribute('aria-disabled', 'true');
  send.addEventListener('click', function (e) {
    if (send.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      var miss = order.filter(function (k) { return !sel[k]; })[0];
      var el = document.querySelector('.step[data-key="' + miss + '"]');
      if (el) {
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge');
      }
    }
  });

  // reveal on scroll
  var items = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // current section in the menu
  var links = document.querySelectorAll('nav a');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('cur', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    ['trial', 'reviews', 'visit'].forEach(function (id) { so.observe(document.getElementById(id)); });
  }
})();
