(function () {
  var NUM = '919899136514';
  var SLOTS = { wk: ['7 to 11 AM', '4 to 7 PM'], Sat: ['10 to 11 AM'] };
  var st = { cls: '', day: '', time: '' };

  var dial = document.getElementById('dial');
  var rays = dial.querySelectorAll('.ray');
  var timesEl = document.getElementById('times');
  var bubble = document.getElementById('bubble');
  var confirmEl = document.getElementById('confirm');
  var baseHref = confirmEl.getAttribute('href');
  var tc = document.getElementById('t-cls'), td = document.getElementById('t-day'), tt = document.getElementById('t-time');

  function pressed(group, attr, val) {
    group.querySelectorAll('button[' + attr + ']').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val));
    });
  }

  function renderTimes() {
    timesEl.innerHTML = '';
    if (!st.day) {
      var p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'Pick a day first';
      timesEl.appendChild(p);
      return;
    }
    (st.day === 'Sat' ? SLOTS.Sat : SLOTS.wk).forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('data-time', s);
      b.setAttribute('aria-pressed', String(st.time === s));
      b.textContent = s;
      timesEl.appendChild(b);
    });
  }

  function update() {
    var level = (st.cls ? 1 : 0) + (st.day ? 1 : 0) + (st.time ? 1 : 0);
    var done = level === 3;
    rays.forEach(function (r, i) { r.classList.toggle('on', i < level * 4); });
    dial.style.setProperty('--lvl', level);
    dial.classList.toggle('done', done);
    tc.textContent = st.cls; td.textContent = st.day; tt.textContent = st.time;
    if (done) {
      var msg = "Hi 2BFit! I'd like a free trial class: " + st.cls + ', ' + st.day + ', ' + st.time + '. Please confirm the exact time. My name is ';
      bubble.textContent = msg.trim();
      bubble.classList.add('show');
      confirmEl.href = 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(msg);
      confirmEl.setAttribute('aria-disabled', 'false');
      confirmEl.textContent = 'Confirm on WhatsApp';
      confirmEl.target = '_blank';
      confirmEl.rel = 'noopener';
    } else {
      bubble.classList.remove('show');
      confirmEl.href = baseHref;
      confirmEl.setAttribute('aria-disabled', 'true');
      confirmEl.textContent = 'Pick class, day and time';
      confirmEl.removeAttribute('target');
    }
  }

  document.getElementById('classes').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cls]');
    if (!b) return;
    st.cls = b.getAttribute('data-cls');
    pressed(this, 'data-cls', st.cls);
    update();
  });

  document.getElementById('days').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-day]');
    if (!b) return;
    st.day = b.getAttribute('data-day');
    st.time = st.day === 'Sat' ? SLOTS.Sat[0] : '';
    pressed(this, 'data-day', st.day);
    renderTimes();
    update();
  });

  timesEl.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-time]');
    if (!b) return;
    st.time = b.getAttribute('data-time');
    pressed(timesEl, 'data-time', st.time);
    update();
  });

  confirmEl.addEventListener('click', function (e) {
    if (confirmEl.getAttribute('aria-disabled') === 'true') e.preventDefault();
  });

  update();

  // reveal on scroll
  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }
})();
