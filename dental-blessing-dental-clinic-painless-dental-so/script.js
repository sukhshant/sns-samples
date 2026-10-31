(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (reduce) root.classList.add('reduce');

  /* Reveal on scroll */
  var targets = document.querySelectorAll('.reveal, .rule, .svc-list li, .q, .facts > div');
  targets.forEach(function (el) { if (!el.classList.contains('rule')) el.classList.add('reveal'); });
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* Tooth chart */
  var info = {
    front: { t: 'Front teeth', p: 'Tooth whitening and cosmetic dentistry are the listed services for the front teeth.', m: 'front teeth' },
    side: { t: 'Side teeth', p: 'Fillings and analysis, and caps, crowns and bridges (including a zirconia crown), are the listed services for the side teeth.', m: 'side teeth' },
    back: { t: 'Back and wisdom teeth', p: 'Impacted tooth extraction is the listed service for wisdom teeth that are stuck or growing the wrong way.', m: 'back or wisdom teeth' },
    gums: { t: 'Gums and missing teeth', p: 'A general checkup is a good start for the gums. Complete dentures are listed for people who have lost their teeth.', m: 'gums' }
  };
  var panel = document.getElementById('panel');
  if (!panel) return;
  var title = document.getElementById('panel-title');
  var text = document.getElementById('panel-text');
  var wa = document.getElementById('panel-wa');
  var zones = document.querySelectorAll('.zone');
  var btns = document.querySelectorAll('.zone-btns button');

  function select(z) {
    var d = info[z]; if (!d) return;
    title.textContent = d.t;
    text.textContent = d.p;
    var msg = 'Hello, I have a problem with my ' + d.m + '. Can I book a check-up at Dental Blessing Dental Clinic?';
    wa.href = 'https://wa.me/919810476490?text=' + encodeURIComponent(msg);
    zones.forEach(function (n) { n.classList.toggle('on', n.getAttribute('data-zone') === z); });
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-zone') === z ? 'true' : 'false'); });
    if (panel.hidden) {
      panel.hidden = false;
      panel.classList.remove('up');
      void panel.offsetWidth;
    }
    panel.classList.add('up');
  }
  zones.forEach(function (n) {
    var z = n.getAttribute('data-zone');
    n.addEventListener('click', function () { select(z); });
    n.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(z); }
    });
  });
  btns.forEach(function (b) {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { select(b.getAttribute('data-zone')); });
  });
})();
