(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PHONE = '919805202592';

  /* scroll reveals */
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 60 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* picker */
  var DATA = {
    chew: { say: 'pain when chewing', t: 'Root canal treatment', d: 'A root canal treatment is a procedure that cleans the inside of a tooth when the nerve in it is infected or inflamed.' },
    broken: { say: 'a broken or cracked tooth', t: 'Ceramic crowns and bridges', d: 'A ceramic crown is a tooth-coloured cap that covers a damaged tooth; a bridge fills the space of a missing one.' },
    missing: { say: 'a missing tooth', t: 'Dental implants', d: 'A dental implant is a small post placed in the jaw to hold a replacement tooth.' },
    gaps: { say: 'gaps or old crowns', t: 'Ceramic crowns and bridges', d: 'Ceramic crowns and bridges are tooth-coloured restorations used to cover teeth or close gaps.' },
    laser: { say: 'a gentler, laser option', t: 'Laser dentistry', d: 'Laser dentistry uses a focused beam of light for certain gum and tooth procedures.' }
  };
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var wrap = document.getElementById('panelwrap');
  var panel = document.getElementById('panel');
  var title = document.getElementById('panel-title');
  var text = document.getElementById('panel-text');
  var wa = document.getElementById('panel-wa');

  function waLink(say) {
    var msg = 'Hello, I have ' + say + '. Can I book a visit?';
    if (say.indexOf('a ') === 0 || say.indexOf('gaps') === 0) msg = 'Hello, I have ' + say + '. Can I book a visit?';
    if (say.indexOf('a gentler') === 0) msg = 'Hello, I am looking for ' + say + '. Can I book a visit?';
    return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);
  }

  function select(key, animate) {
    var d = DATA[key]; if (!d) return;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-key') === key ? 'true' : 'false'); });
    var animOk = animate && !reduce;
    var from = animOk ? wrap.offsetHeight : 0;
    title.textContent = d.t;
    text.textContent = d.d;
    wa.href = waLink(d.say);
    if (animOk) {
      wrap.style.height = from + 'px';
      wrap.classList.add('is-anim');
      panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
      var to = panel.offsetHeight;
      requestAnimationFrame(function () { wrap.style.height = to + 'px'; });
      setTimeout(function () { wrap.style.height = ''; wrap.classList.remove('is-anim'); }, 450);
    }
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () { select(c.getAttribute('data-key'), true); });
  });
  select('chew', false);

  /* path draw */
  var line = document.getElementById('pathline');
  var marker = document.getElementById('marker');
  var labels = [].slice.call(document.querySelectorAll('.path__labels li'));
  var stops = [24, 140, 250, 410];
  if (line && marker) {
    var len = line.getTotalLength();
    var stopLen = [0, 116, 226, len];
    function setP(p) {
      var l = len * p;
      line.style.strokeDashoffset = String(len - l);
      var pt = line.getPointAtLength(l);
      marker.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');
      labels.forEach(function (li, i) { li.classList.toggle('on', l >= stopLen[i] - 1); });
    }
    if (reduce || !('IntersectionObserver' in window)) {
      line.style.strokeDasharray = 'none';
      setP(1);
    } else {
      line.style.strokeDasharray = len + ' ' + len;
      setP(0);
      var done = false;
      new IntersectionObserver(function (entries, obs) {
        if (done || !entries[0].isIntersecting) return;
        done = true; obs.disconnect();
        var start = null, dur = 3200;
        function ease(t) { return 1 - Math.pow(1 - t, 3); }
        function tick(ts) {
          if (start === null) start = ts;
          var t = Math.min((ts - start) / dur, 1);
          setP(ease(t));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }, { threshold: 0.35 }).observe(document.getElementById('path'));
    }
  }
})();
