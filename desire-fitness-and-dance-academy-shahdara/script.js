(function () {
  var NUM = '919654282468';
  var st = { cls: '', day: '', slot: '' };
  var ticket = document.getElementById('ticket');
  var send = document.getElementById('send');
  var sub = {};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function wa(text) { return 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(text); }

  function put(id, val, extra) {
    var dd = document.querySelector('#f-' + id + ' dd');
    dd.classList.remove('empty', 'stamp');
    dd.textContent = val;
    if (extra) { var s = document.createElement('small'); s.textContent = extra; dd.appendChild(s); }
    if (!reduce) { void dd.offsetWidth; dd.classList.add('stamp'); }
  }

  function refresh() {
    var done = st.cls && st.day && st.slot;
    ticket.classList.toggle('torn', !!done);
    send.setAttribute('aria-disabled', done ? 'false' : 'true');
    send.textContent = done ? 'Send on WhatsApp' : 'Pick all three';
    if (done) {
      send.href = wa("Hi Desire Fitness and Dance Academy! I'd like to book a trial class: " + st.cls + ' on ' + st.day + ', ' + st.slot + '. Please confirm the time.');
    }
  }

  document.querySelectorAll('.wow .chip[data-group]').forEach(function (b) {
    b.addEventListener('click', function () {
      var g = b.dataset.group;
      document.querySelectorAll('.chip[data-group="' + g + '"]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      st[g] = b.dataset.val;
      put(g, b.dataset.val, g === 'slot' ? b.dataset.sub : '');
      refresh();
    });
  });

  send.addEventListener('click', function (e) {
    if (send.getAttribute('aria-disabled') === 'true') e.preventDefault();
  });

  // desktop tilt, transform only
  var wrap = document.querySelector('.ticket-wrap');
  if (wrap && !reduce && window.matchMedia('(hover:hover) and (min-width:900px)').matches) {
    wrap.addEventListener('pointermove', function (e) {
      var r = wrap.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      ticket.style.transform = 'rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg)';
    });
    wrap.addEventListener('pointerleave', function () { ticket.style.transform = ''; });
    ticket.style.transition = 'transform .25s ease-out';
  }

  // reveal on scroll
  var els = document.querySelectorAll('.rise,.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  } else els.forEach(function (e) { e.classList.add('in'); });
})();
