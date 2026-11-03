(() => {
  'use strict';
  const WA = 'https://wa.me/919560577840?text=';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveal on scroll */
  const rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add('in'));

  /* smooth jump for in-page buttons */
  $$('[data-go]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const t = document.getElementById(a.dataset.go);
    if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }));

  /* Find Your Mark */
  const floor = $('#floor'), beam = $('#beam'), pool = $('#pool'), stamp = $('#stamp');
  const strips = $$('.strip'), timesBox = $('#times'), chips = $$('.chip', timesBox);
  const sum = $('#sum'), go = $('#go'), togs = $$('.tog');
  if (!floor) return;

  const st = { who: 'Me', day: null, time: null, el: null };
  const vib = () => { try { navigator.vibrate && navigator.vibrate(12); } catch (_) {} };

  strips.forEach((s) => { s.setAttribute('role', 'button'); s.setAttribute('aria-pressed', 'false'); });
  chips.forEach((c) => { c.setAttribute('role', 'button'); c.setAttribute('aria-pressed', 'false'); });

  const msg = () => `Hi Vivek Sir, I'd like a trial class. For: ${st.who}. Day: ${st.day}. Time: ${st.time}. Please confirm if this slot works.`;

  function render() {
    let line = st.who;
    if (st.day) line += ', ' + st.day;
    if (st.time) line += ', ' + st.time;
    sum.textContent = line;
    if (!st.day) { go.textContent = 'Pick a day first'; go.classList.add('idle'); }
    else if (!st.time) { go.textContent = 'Pick a time'; go.classList.add('idle'); }
    else {
      go.textContent = 'Confirm on WhatsApp';
      go.classList.remove('idle');
      go.href = WA + encodeURIComponent(msg());
    }
  }

  function aim(animate = true) {
    const f = floor.getBoundingClientRect();
    const ox = f.width / 2, oy = -6;
    if (!st.el) {
      // rest pose: beam straight down, pool parked at the top
      const sy0 = (f.height * 0.8) / 100;
      beam.style.transform = `translate(${ox - 110}px,${oy}px) rotate(0deg) scale(1.1,${sy0})`;
      pool.style.transform = `translate(${ox - pool.offsetWidth / 2}px,${-pool.offsetHeight}px)`;
      return;
    }
    const r = st.el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - f.left;
    const cy = r.top + r.height / 2 - f.top;
    const dx = cx - ox, dy = cy - oy;
    const L = Math.hypot(dx, dy);
    const th = (Math.atan2(-dx, dy) * 180) / Math.PI;
    const sx = Math.max(r.width * 1.45, 180) / 220;
    if (!animate) { beam.style.transition = pool.style.transition = 'none'; }
    beam.style.transform = `translate(${ox - 110}px,${oy}px) rotate(${th}deg) scale(${sx},${L / 100})`;
    pool.style.transform = `translate(${cx - pool.offsetWidth / 2}px,${cy - pool.offsetHeight / 2}px)`;
    stamp.style.transform = `translate(${r.right - f.left - 40 - 30}px,${cy - 30}px)`;
    if (!animate) { void beam.offsetWidth; beam.style.transition = pool.style.transition = ''; }
  }

  function bounce() {
    stamp.classList.add('on');
    if (stamp.animate && !reduce) {
      stamp.animate(
        [{ scale: '2.6', opacity: 0, rotate: '-14deg' }, { scale: '0.86', opacity: 1, rotate: '3deg', offset: 0.55 }, { scale: '1', opacity: 1, rotate: '0deg' }],
        { duration: 520, easing: 'cubic-bezier(.3,1.3,.5,1)' }
      );
    }
  }

  function pickDay(s) {
    st.day = s.dataset.day;
    st.el = s;
    strips.forEach((x) => { const on = x === s; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    floor.classList.add('live');
    timesBox.classList.add('on');
    aim();
    if (st.time) { stamp.classList.add('on'); bounce(); }
    render();
    vib();
    setTimeout(() => {
      const r = timesBox.getBoundingClientRect();
      if (r.bottom > innerHeight - 90) window.scrollBy({ top: r.bottom - innerHeight + 110, behavior: reduce ? 'auto' : 'smooth' });
    }, 350);
  }

  strips.forEach((s) => s.addEventListener('click', (e) => { e.preventDefault(); pickDay(s); }));

  chips.forEach((c) => c.addEventListener('click', (e) => {
    e.preventDefault();
    if (!st.el) return;
    st.time = c.textContent.trim();
    chips.forEach((x) => x.setAttribute('aria-pressed', x === c));
    aim(false);
    bounce();
    render();
    vib();
  }));

  togs.forEach((t) => t.addEventListener('click', () => {
    st.who = t.dataset.who;
    togs.forEach((x) => x.setAttribute('aria-pressed', x === t));
    render();
    vib();
  }));

  go.addEventListener('click', (e) => {
    if (!st.day) {
      e.preventDefault();
      $('#strips').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    } else if (!st.time) {
      e.preventDefault();
      timesBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
  });

  new ResizeObserver(() => aim(false)).observe(floor);
  render();
  aim(false);
})();
