(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* scroll reveals */
  const rv = $$('.rv');
  if (hasIO) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach((el, i) => { el.style.setProperty('--rd', (i % 3) * 0.06 + 's'); io.observe(el); });
  } else rv.forEach((el) => el.classList.add('in'));

  /* menu highlight */
  const links = $$('.top nav a');
  if (hasIO) {
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const so = new IntersectionObserver((es) => es.forEach((e) => {
      const a = map.get(e.target.id);
      if (!a) return;
      if (e.isIntersecting) { links.forEach((l) => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); s && so.observe(s); });
  }

  /* drape the mandap */
  const COLORS = [
    { n: 'Marigold', c: '#F4B400' }, { n: 'Magenta', c: '#D81B78' }, { n: 'Leaf green', c: '#3E9B4F' },
    { n: 'Orange', c: '#F26B1D' }, { n: 'Royal blue', c: '#2748C8' }, { n: 'Cream', c: '#F3E6C8' },
  ];
  const panels = $$('.tent .panel');
  const garlands = $$('.tent .garland');
  const walls = { 0: $('.wall[data-w="0"] rect'), 4: $('.wall[data-w="4"] rect') };
  const swatches = $$('.swatch');
  const summary = $('#summary');
  const send = $('#send');
  const guests = $('#guests');
  const gv = $('#gv');
  const date = $('#date');
  if (!panels.length) return;

  let sel = 0;
  const state = [null, null, null, null, null];
  const START = [1, null, 0, null, 1]; // two panels stay bare so the tent invites a tap

  const occ = () => ($('input[name=occ]:checked') || {}).value || 'Wedding';
  const names = () => state.map((c) => (c === null ? 'open' : COLORS[c].n));

  function refresh() {
    summary.textContent = `${occ()}, ${guests.value} guests: ${names().join(', ')}`;
    let d = 'not fixed';
    if (date.value) {
      const t = new Date(date.value + 'T00:00:00');
      if (!isNaN(t)) d = t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const msg = `Hi Ashish ji, I would like a rough quote. Occasion: ${occ()}. Guests: ${guests.value}. Date: ${d}. Drape colours: ${state.map((c) => (c === null ? 'not chosen' : COLORS[c].n)).join(', ')}. Venue: ___`;
    send.href = 'https://wa.me/918860380852?text=' + encodeURIComponent(msg);
  }

  function hang(i, ci, instant) {
    const p = panels[i];
    state[i] = ci;
    p.classList.remove('empty', 'drop');
    $('.cloth', p).setAttribute('fill', COLORS[ci].c);
    p.setAttribute('aria-label', `Panel ${i + 1}, ${COLORS[ci].n}`);
    if (walls[i]) walls[i].setAttribute('fill', COLORS[ci].c);
    if (!instant && !reduce) { p.getBoundingClientRect(); p.classList.add('drop'); }
    [i, i + 1].forEach((k) => {
      const g = garlands[k];
      if (g && !g.classList.contains('on')) { if (instant || reduce) g.style.transform = 'none'; g.classList.add('on'); }
    });
    refresh();
  }

  function select(ci) {
    sel = ci;
    swatches.forEach((s, k) => s.setAttribute('aria-pressed', String(k === ci)));
  }

  /* initial bare tent, dressed when it scrolls into view */
  panels.forEach((p, i) => {
    p.classList.add('empty');
    state[i] = null;
    p.setAttribute('aria-label', `Panel ${i + 1}, empty. Tap to hang the chosen fabric`);
  });
  garlands.forEach((g) => g.classList.remove('on'));
  if (walls[0]) { walls[0].setAttribute('fill', '#FBF8F1'); walls[0].setAttribute('fill-opacity', '.06'); }
  if (walls[4]) { walls[4].setAttribute('fill', '#FBF8F1'); walls[4].setAttribute('fill-opacity', '.06'); }
  refresh();

  let started = false;
  const demo = () => {
    if (started) return;
    started = true;
    START.forEach((ci, i) => {
      if (ci === null) return;
      setTimeout(() => {
        if (state[i] === null) { hang(i, ci); [0, 4].forEach((w) => walls[w] && state[w] !== null && walls[w].setAttribute('fill-opacity', '.55')); }
      }, reduce ? 0 : 350 + i * 260);
    });
  };
  const stage = $('.wow-stage');
  if (hasIO) {
    const dio = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { demo(); dio.disconnect(); } }, { threshold: 0.35 });
    dio.observe(stage);
  } else demo();
  const wallOpacity = () => [0, 4].forEach((w) => walls[w] && walls[w].setAttribute('fill-opacity', state[w] === null ? '.06' : '.55'));

  swatches.forEach((s, k) => s.addEventListener('click', () => { if (!suppress) select(k); }));
  panels.forEach((p, i) => {
    const act = () => { hang(i, sel); wallOpacity(); };
    p.addEventListener('click', act);
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
  });

  $('#shuffle').addEventListener('click', () => {
    let prev = -1;
    state.forEach((_, i) => {
      let c; do { c = Math.floor(Math.random() * COLORS.length); } while (c === prev);
      prev = c;
      setTimeout(() => { hang(i, c); wallOpacity(); }, reduce ? 0 : i * 140);
    });
  });

  $$('input[name=occ]').forEach((r) => r.addEventListener('change', refresh));
  guests.addEventListener('input', () => { gv.textContent = guests.value; refresh(); });
  date.addEventListener('change', refresh);

  /* drag a swatch onto a panel (pointer events: mouse, pen, touch) */
  let suppress = false, drag = null, ghost = null;
  swatches.forEach((s, k) => s.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    drag = { k, x: e.clientX, y: e.clientY, id: e.pointerId, on: false, el: s };
  }));
  const panelAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest ? el.closest('.panel') : null; };
  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.hypot(dx, dy) < 8) return;
      if (e.pointerType === 'touch' && Math.abs(dx) > Math.abs(dy)) { drag = null; return; }
      drag.on = true;
      select(drag.k);
      ghost = document.createElement('div');
      ghost.className = 'ghost';
      ghost.style.setProperty('--c', COLORS[drag.k].c);
      document.body.appendChild(ghost);
    }
    ghost.style.transform = `translate(${e.clientX - 27}px,${e.clientY - 40}px) rotate(-4deg)`;
    const over = panelAt(e.clientX, e.clientY);
    panels.forEach((p) => p.classList.toggle('over', p === over));
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.on) {
      const p = e.type === 'pointerup' ? panelAt(e.clientX, e.clientY) : null;
      if (p) { hang(panels.indexOf(p), drag.k); wallOpacity(); }
      ghost && ghost.remove(); ghost = null;
      panels.forEach((q) => q.classList.remove('over'));
      suppress = true; setTimeout(() => { suppress = false; }, 80);
    }
    drag = null;
  };
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);
})();
