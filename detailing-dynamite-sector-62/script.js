(function () {
  var NUM = '919990443389';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // reveal on scroll
  var items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  // hex board
  var board = $('#board'), car = $('#car'), send = $('#send'), model = $('#model'), label = $('#modelLabel');
  if (!board) return;
  var vBtns = $$('.hx-v button'), wBtns = $$('.hx-w button'), wGrid = $('.hx-w');
  $$('.hx-w li').forEach(function (li, i) { li.style.setProperty('--i', i); });

  var vehicle = '';
  var work = [];

  function ripple(li) {
    var grid = li.parentNode, cx = li.offsetLeft, cy = li.offsetTop;
    var near = $$('li', grid).filter(function (o) {
      if (o === li) return false;
      var d = Math.hypot(o.offsetLeft - cx, o.offsetTop - cy);
      o._d = d; return d < li.offsetWidth * 1.9;
    }).sort(function (a, b) { return a._d - b._d; });
    near.forEach(function (o, i) {
      o.classList.remove('ping'); void o.offsetWidth;
      o.style.setProperty('--pd', (Math.round(o._d / li.offsetWidth) * 110 + i * 25) + 'ms');
      o.classList.add('ping');
      setTimeout(function () { o.classList.remove('ping'); }, 1700);
    });
  }

  function wake() { wGrid.classList.add('awake'); }

  function update() {
    var parts = ['Hi Detailing Dynamite, I want a rough quote.'];
    var m = model.value.trim();
    if (vehicle) parts.push('Vehicle: ' + vehicle + (m ? ' (' + m + ')' : '') + '.');
    else if (m) parts.push('Car: ' + m + '.');
    if (work.length) parts.push('Work: ' + work.join(', ') + '.');
    parts.push('Please share the price and time needed.');
    send.href = 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(parts.join(' '));
    car.style.setProperty('--lit', Math.min(1, work.length / 4 + (vehicle ? .15 : 0)).toFixed(2));
    car.classList.toggle('v', !!vehicle);
    label.textContent = vehicle === 'Bike' ? 'Bike model' : 'Car model';
  }

  vBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') === 'true';
      vBtns.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); o.parentNode.classList.remove('lit'); });
      vehicle = '';
      if (!on) {
        b.setAttribute('aria-pressed', 'true'); b.parentNode.classList.add('lit');
        vehicle = b.getAttribute('data-v'); ripple(b.parentNode); wake();
      }
      update();
    });
  });

  wBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') === 'true', name = b.getAttribute('data-w'), z = $('.z-' + b.getAttribute('data-z'), car);
      b.setAttribute('aria-pressed', on ? 'false' : 'true');
      b.parentNode.classList.toggle('lit', !on);
      if (z) z.classList.toggle('on', !on);
      if (on) work = work.filter(function (w) { return w !== name; });
      else { work.push(name); ripple(b.parentNode); }
      wake(); update();
    });
  });

  model.addEventListener('input', update);
  update();
})();
