(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = 'https://wa.me/919136777272?text=';
  const sel = { class: '', day: '', when: '' };

  // title layouts: [text, font-size] per line
  const TITLES = {
    '': [['YOUR NAME', 38], ['HERE', 44]],
    'Zumba': [['ZUMBA', 58]],
    'Aerobics': [['AEROBICS', 41]],
    'Hip hop': [['HIP HOP', 47]],
    'Bollywood dance fitness': [['BOLLYWOOD', 35], ['DANCE FITNESS', 25]],
    'Yoga': [['YOGA', 66]],
    'Kids dance': [['KIDS', 56], ['DANCE', 50]]
  };

  const title = $('#title'), pDay = $('#pDay'), pTime = $('#pTime'), arm = $('#arm'), send = $('#send'), when = $('#when');
  const NS = 'http://www.w3.org/2000/svg';

  function drawTitle() {
    const lines = TITLES[sel.class] || TITLES[''];
    title.textContent = '';
    const cy = 174, gap = 4;
    const total = lines.reduce((n, l) => n + l[1] * 0.85, 0) + gap * (lines.length - 1);
    let y = cy - total / 2;
    lines.forEach(([txt, size]) => {
      const t = document.createElementNS(NS, 'text');
      y += size * 0.85;
      t.setAttribute('x', 150); t.setAttribute('y', y.toFixed(1));
      t.setAttribute('font-size', size); t.textContent = txt;
      title.appendChild(t);
      y += gap;
    });
  }
  const replay = (el, cls) => { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); };

  function update(changed) {
    const complete = sel.class && sel.day && sel.when;
    if (changed === 'class') { drawTitle(); replay(title, 'slam'); }
    pDay.textContent = sel.day ? sel.day.toUpperCase() : 'SOON';
    pTime.textContent = sel.when ? sel.when.toUpperCase() : '';
    if (changed === 'day' || changed === 'when') replay(when, 'pop');
    if (complete && (changed === 'day' || changed === 'when' || changed === 'class')) { replay(arm, 'snap'); }
    else if (!complete) arm.classList.remove('snap');
    const parts = [sel.class, sel.day, sel.when].filter(Boolean);
    const msg = complete
      ? `Hi, I'd like to book a trial class: ${sel.class}, ${sel.day}, ${sel.when}. Please confirm the timing.`
      : parts.length
        ? `Hi, I'd like to book a trial class: ${parts.join(', ')}. Please confirm the timing.`
        : `Hi, I'd like to book a trial class. Please share the timing.`;
    send.href = WA + encodeURIComponent(msg);
    $('#poster').setAttribute('aria-label', `Poster: ${sel.class || 'your name here'}${sel.day ? ', ' + sel.day : ''}${sel.when ? ' ' + sel.when : ''}`);
  }

  function choose(key, value, changed = key) {
    sel[key] = value;
    $$(`.step[data-k="${key}"] .chip`).forEach((c) => c.setAttribute('aria-checked', String(c.dataset.v === value)));
    update(changed);
  }

  $$('.step').forEach((step) => {
    const key = step.dataset.k;
    step.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) choose(key, chip.dataset.v);
    });
  });

  // class cards pick a class and jump to the wow
  $$('.card').forEach((card) => card.addEventListener('click', () => {
    choose('class', card.dataset.pick);
    $('#ticket').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }));

  drawTitle(); update();

  // the phone bar steps aside while the poster has its own WhatsApp button
  const bar = $('.bar');
  if (bar && 'IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => bar.classList.toggle('off', e.isIntersecting)), { threshold: .25 }).observe($('#ticket'));

  // reveals
  const rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    rv.forEach((el, i) => { el.style.transitionDelay = (i % 5) * 60 + 'ms'; io.observe(el); });
  } else rv.forEach((el) => el.classList.add('in'));
})();
