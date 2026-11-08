(function () {
  var doc = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* WhatsApp message from the date card */
  var BASE = 'Hello, we would like a rough quote at The Golden Decor.';
  var form = document.getElementById('quote');
  var send = document.getElementById('send');
  function fmtDate(v) {
    var p = v.split('-');
    if (p.length !== 3) return v;
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function updateLink() {
    var f = form.elements;
    var msg = BASE + ' Function: ' + f.function.value + '.' + (f.date.value ? ' Date: ' + fmtDate(f.date.value) + '.' : '') + ' Guests: ' + f.guests.value + '.';
    send.href = 'https://wa.me/919811454666?text=' + encodeURIComponent(msg);
  }
  if (form && send) {
    form.addEventListener('input', updateLink);
    form.addEventListener('change', updateLink);
    send.addEventListener('click', updateLink);
    updateLink();
  }

  /* reviews fade in */
  var rvs = [].slice.call(document.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    rvs.forEach(function (el, i) { el.style.transitionDelay = (i % 5) * 60 + 'ms'; io.observe(el); });
  } else rvs.forEach(function (el) { el.classList.add('in'); });

  /* the walk */
  var stage = document.querySelector('.stage');
  var walkST = null;
  function init() {
    if (reduced || !window.gsap || !window.ScrollTrigger || !stage) return;
    gsap.registerPlugin(ScrollTrigger);
    doc.classList.add('walk-on');

    var bar = document.querySelector('.bar');
    var shots = [].slice.call(stage.querySelectorAll('.shot'));
    var caps = [].slice.call(stage.querySelectorAll('.cap span'));
    var stops = [].slice.call(stage.querySelectorAll('.stop'));
    var rail = stage.querySelector('.rail');
    var marker = stage.querySelector('.marker');
    var card = stage.querySelector('.card');
    var STOP_T = [0, 1, 2, 3, 4.85];
    var T = 5;

    shots.forEach(function (s, i) { s.style.zIndex = 10 - i; });

    var mm = gsap.matchMedia();
    function build(vertical) {
      var ac = new AbortController();
      var axis = vertical ? 'y' : 'x';
      var cur = 0;
      gsap.set(shots.slice(1), { opacity: 0, scale: 0.9 });
      gsap.set(shots[0].querySelector('img'), { clearProps: 'all' });
      gsap.set(card, { yPercent: 110, opacity: 0 });
      card.inert = true;

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: function () { return 'top top+=' + bar.offsetHeight; },
          end: function () { return '+=' + window.innerHeight * 4; },
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var t = self.progress * T;
            var idx = Math.max(0, Math.min(4, Math.round(t)));
            if (idx !== cur) {
              caps[cur].classList.remove('on'); stops[cur].classList.remove('on');
              cur = idx;
              caps[cur].classList.add('on'); stops[cur].classList.add('on');
            }
            card.inert = t < 4.4;
          }
        }
      });
      var nf = { immediateRender: false };
      tl.to(shots[0], { scale: 1.15, duration: 1 }, 0);
      for (var i = 1; i < 5; i++) {
        tl.fromTo(shots[i], { scale: 0.9 }, { scale: 1, duration: 0.5, immediateRender: false }, i - 0.5);
        tl.fromTo(shots[i], { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, i - 0.5);
        tl.to(shots[i - 1], { opacity: 0, duration: 0.25 }, i - 0.25);
        tl.fromTo(shots[i], { scale: 1 }, { scale: 1.15, duration: 1, immediateRender: false }, i);
      }
      var to = { duration: 4, immediateRender: false };
      to[axis] = function () { return vertical ? rail.clientHeight : rail.clientWidth; };
      var from = {}; from[axis] = 0;
      gsap.set(marker, { x: 0, y: 0 });
      tl.fromTo(marker, from, to, 0);
      tl.fromTo(card, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false }, 4.3);
      tl.set({}, {}, T);

      var st = tl.scrollTrigger;
      walkST = st;
      stops.forEach(function (b, i) {
        b.addEventListener('click', function () {
          var y = st.start + (STOP_T[i] / T) * (st.end - st.start);
          window.scrollTo({ top: Math.round(y), behavior: 'smooth' });
        }, { signal: ac.signal });
      });
      return function () { ac.abort(); walkST = null; };
    }
    mm.add('(min-width: 768px)', function () { return build(true); });
    mm.add('(max-width: 767px)', function () { return build(false); });

    [].forEach.call(document.querySelectorAll('a[href="#quote"]'), function (a) {
      a.addEventListener('click', function (e) {
        if (!walkST) return;
        e.preventDefault();
        window.scrollTo({ top: Math.round(walkST.end - 2), behavior: 'smooth' });
      });
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
  if (document.readyState === 'complete') init();
  else window.addEventListener('DOMContentLoaded', init);
})();
