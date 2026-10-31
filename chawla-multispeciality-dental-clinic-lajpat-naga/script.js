(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');

  var NUM = '919999007939';
  var data = {
    pain: ['Tell the doctor which tooth hurts, when it started, and whether hot, cold, sweet or biting makes it worse. Mention any swelling.', 'Hello, I have tooth pain. Can I get an appointment?'],
    gums: ['Tell the doctor when the bleeding happens (brushing, flossing or on its own) and how long it has been going on.', 'Hello, my gums bleed. Can I get an appointment?'],
    broken: ['Tell the doctor how the tooth broke, which one it is, and if it hurts or has a sharp edge. Keep any broken piece safe.', 'Hello, I have a broken or chipped tooth. Can I get an appointment?'],
    look: ['Tell the doctor what bothers you about how your teeth look, and what you would like to change. They will explain the options.', 'Hello, my teeth look yellow or crooked. Can I get an appointment?'],
    check: ['Tell the doctor when you last saw a dentist and if anything feels different. A check-up is a good way to start.', 'Hello, I would like a dental check-up. Can I get an appointment?']
  };
  var chips = d.querySelectorAll('.chip');
  var text = d.getElementById('answer-text');
  var send = d.getElementById('wa-send');
  var box = d.getElementById('answer');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var item = data[c.getAttribute('data-key')];
      chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
      if (!reduce) { box.style.gridTemplateRows = '0fr'; }
      setTimeout(function () {
        text.textContent = item[0];
        send.href = 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(item[1]);
        box.style.gridTemplateRows = '1fr';
      }, reduce ? 0 : 180);
    });
  });

  var targets = d.querySelectorAll('.reveal, .dial');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (t) { t.classList.add('in', 'on'); });
    return;
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        if (e.target.classList.contains('dial')) e.target.classList.add('on');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  targets.forEach(function (t) { io.observe(t); });
})();
