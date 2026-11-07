(function () {
  document.documentElement.classList.add('js');
  var WA = 'https://wa.me/919643806222?text=';
  var generic = 'Hi, I\'d like a trial class at Artify Dance Academy.';
  var stage = document.getElementById('stage');
  var word = document.getElementById('word');
  var tracks = document.getElementById('tracks');
  var days = document.getElementById('days');
  var times = document.getElementById('times');
  var ticket = document.getElementById('ticket');
  var send = document.getElementById('send');
  var eq = document.getElementById('floorEq');
  var st = { style: '', day: '', time: '' };

  // floor equalizer with its reflection
  if (eq) {
    var up = document.createElement('div'); up.className = 'up';
    var down = document.createElement('div'); down.className = 'down';
    var n = window.innerWidth < 600 ? 20 : 40;
    for (var i = 0; i < n; i++) {
      var b = document.createElement('i');
      b.style.setProperty('--m', (0.8 + ((i * 37) % 11) / 12).toFixed(2));
      b.style.setProperty('--d', (((i * 53) % 17) / 10).toFixed(2));
      up.appendChild(b); down.appendChild(b.cloneNode());
    }
    eq.appendChild(up); eq.appendChild(down);
  }

  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  function render() {
    var parts = [
      st.style ? '<em>' + esc(st.style) + '</em>' : '<span class="np">pick a style</span>',
      st.day ? '<em>' + esc(st.day) + '</em>' : '<span class="np">any day</span>',
      st.time ? '<em>' + esc(st.time) + '</em>' : '<span class="np">any time</span>'
    ];
    ticket.innerHTML = parts.join(', ') + ' - trial class';
    if (!st.style) {
      send.textContent = 'Pick a style first';
      send.classList.add('idle');
      send.href = WA + encodeURIComponent(generic);
    } else {
      send.textContent = 'Send on WhatsApp';
      send.classList.remove('idle');
      var msg = 'Hi, I\'d like a trial class at Artify Dance Academy. Style: ' + st.style +
        (st.day ? '. Day: ' + st.day : '') + (st.time ? '. Time: ' + st.time : '') +
        '. Please confirm if it works.';
      send.href = WA + encodeURIComponent(msg);
    }
  }

  function setStage(style, speed) {
    stage.classList.add('on');
    stage.classList.toggle('hoop', style === 'Hula Hoop');
    stage.style.setProperty('--s', speed || '.6s');
    word.setAttribute('data-t', style);
    word.textContent = style;
    // restart the entrance animation
    stage.classList.remove('on'); void stage.offsetWidth; stage.classList.add('on');
  }

  function single(group, btn, key, attr) {
    [].forEach.call(group.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
    st[key] = btn.getAttribute(attr);
  }

  tracks.addEventListener('click', function (e) {
    var btn = e.target.closest('button'); if (!btn) return;
    single(tracks, btn, 'style', 'data-style');
    setStage(st.style, btn.style.getPropertyValue('--s').trim());
    render();
  });
  days.addEventListener('click', function (e) {
    var btn = e.target.closest('button'); if (!btn) return;
    single(days, btn, 'day', 'data-day');
    stage.classList.add('has-day');
    render();
  });
  times.addEventListener('click', function (e) {
    var btn = e.target.closest('button'); if (!btn) return;
    single(times, btn, 'time', 'data-time');
    render();
  });
  [].forEach.call(document.querySelectorAll('#tracks button,#days button,#times button'), function (b) { b.setAttribute('aria-pressed', 'false'); });

  send.addEventListener('click', function (e) {
    if (!st.style) {
      e.preventDefault();
      document.getElementById('trial').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  render();

  // scroll reveals
  var targets = document.querySelectorAll('.hero-text > *, .hero-photo, .stage, .deck > *, .studio > *, .rev-list figure, .visit-grid > *, .reviews > a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    [].forEach.call(targets, function (t) { t.classList.add('rv'); io.observe(t); });
  }
})();
