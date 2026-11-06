(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- scroll reveals ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
  $$('.rv').forEach((el) => io ? io.observe(el) : el.classList.add('in'));

  /* ---------- active menu link ---------- */
  const links = $$('.top nav a');
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  map.set('trial', map.get('trial'));
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove('on'));
        const a = map.get(e.target.id);
        if (a) a.classList.add('on');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['trial', 'reviews', 'visit'].forEach((id) => { const el = document.getElementById(id); el && so.observe(el); });
  }

  /* ---------- pick your trial and your kit ---------- */
  const NUM = '917701830192';
  const state = { day: '', time: '', props: [], skip: false };
  const card = $('#card');
  if (!card) return;
  const dayBtns = $$('.day', card), timeBtns = $$('.time', card), propBtns = $$('.prop', card), skipBtn = $('.skip', card);
  const bubble = $('#bubble'), slotsEl = $('#slots'), countEl = $('#count'), bag = $('.bag', card);
  const slotEls = $$('.slot', slotsEl);
  const waLinks = $$('a[data-wa]');
  const steps = { day: $('[data-step=day]', card), time: $('[data-step=time]', card), kit: $('[data-step=kit]', card) };
  const phOf = (name) => propBtns.find((b) => b.dataset.prop === name).querySelector('.ph');

  const list = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  function message() {
    let m = "Hi, I'd like a trial yoga class";
    if (state.day) m += ' on ' + state.day + (state.time ? ', ' + state.time : '');
    else if (state.time) m += ', ' + state.time;
    m += '.';
    if (state.props.length) m += " I'm also interested in: " + list(state.props) + '.';
    else if (state.skip) m += " I'll just need a mat.";
    return m;
  }
  const waHref = (m) => `https://wa.me/${NUM}?text=${encodeURIComponent(m)}`;

  let last = '';
  function render(animateBubble) {
    dayBtns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.day === state.day));
    timeBtns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.time === state.time));
    propBtns.forEach((b) => b.setAttribute('aria-pressed', state.props.includes(b.dataset.prop)));
    skipBtn.setAttribute('aria-pressed', state.skip);
    steps.day.classList.toggle('done', !!state.day);
    steps.time.classList.toggle('done', !!state.time);
    steps.kit.classList.toggle('done', state.props.length > 0 || state.skip);
    countEl.textContent = state.props.length;
    bag.classList.toggle('has', state.props.length > 0);
    slotEls.forEach((s, i) => {
      const name = state.props[i];
      if (name && s.dataset.name === name && s.classList.contains('full')) return;
      s.replaceChildren(); s.className = 'slot'; delete s.dataset.name;
      if (!name) return;
      s.dataset.name = name; s.classList.add('full');
      s.append(phOf(name).cloneNode(true));
      const x = document.createElement('button');
      x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + name);
      x.addEventListener('click', () => toggleProp(name));
      s.append(x);
    });
    const m = message();
    bubble.textContent = m;
    waLinks.forEach((a) => { a.href = waHref(m); });
    if (animateBubble && m !== last && !reduce) { bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop'); }
    last = m;
  }

  function fly(fromEl, name) {
    const idx = state.props.indexOf(name);
    const slot = slotEls[idx];
    if (reduce || !slot || !fromEl.animate) return;
    const a = fromEl.getBoundingClientRect(), b = slot.getBoundingClientRect();
    if (!a.width || !b.width) return;
    slot.classList.add('arriving');
    const c = document.createElement('div');
    c.className = 'fly';
    c.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
    c.append(fromEl.cloneNode(true));
    c.firstChild.style.cssText += ';position:absolute;inset:0;border-radius:inherit;box-shadow:none';
    document.body.append(c);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const s = b.width / a.width;
    const lift = Math.min(90, Math.abs(dy) * 0.25 + 30);
    const anim = c.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.45}px,${dy * 0.45 - lift}px) scale(${(1 + s) / 2 + 0.1}) rotate(-7deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(${s}) rotate(0deg)`, opacity: 1, offset: 1 }
    ], { duration: 620, easing: 'cubic-bezier(.4,.1,.2,1)', fill: 'forwards' });
    const done = () => { c.remove(); slot.classList.remove('arriving'); slot.classList.add('land'); setTimeout(() => slot.classList.remove('land'), 450); };
    anim.onfinish = done; anim.oncancel = done;
  }

  function toggleProp(name, fromEl) {
    const i = state.props.indexOf(name);
    if (i > -1) state.props.splice(i, 1);
    else { state.props.push(name); state.skip = false; }
    render(true);
    if (i === -1 && fromEl) fly(fromEl, name);
  }

  dayBtns.forEach((b) => b.addEventListener('click', () => { state.day = state.day === b.dataset.day ? '' : b.dataset.day; render(true); }));
  timeBtns.forEach((b) => b.addEventListener('click', () => { state.time = state.time === b.dataset.time ? '' : b.dataset.time; render(true); }));
  propBtns.forEach((b) => b.addEventListener('click', () => toggleProp(b.dataset.prop, b.querySelector('.ph'))));
  skipBtn.addEventListener('click', () => { state.skip = !state.skip; if (state.skip) state.props = []; render(true); });
  render(false);
})();
