(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal on scroll
  const rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add('in'));

  // Sun dial
  const scene = $('#scene'), sun = $('#sun'), timeEl = $('#time'), sumEl = $('#summary'), ask = $('#ask'), arc = $('#arc'), arcPath = $('#arcPath');
  if (!scene || !sun) return;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const STEPS = 33; // 5:00 AM to 9:00 PM, every 30 minutes
  const KEYS = [5, 6.5, 12, 19];
  const PAD = 36;
  const state = { idx: 3, day: (new Date().getDay() + 6) % 7, who: 'me' };
  let W = 0, H = 0, hy = 0, top = 0;

  const minIdx = () => (state.day <= 4 ? 1 : 0);
  const hour = (i) => 5 + i / 2;
  const fmt = (i) => {
    const m = 300 + i * 30, h24 = Math.floor(m / 60), mm = m % 60;
    const h = h24 % 12 || 12;
    return `${h}:${String(mm).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function layout() {
    W = scene.clientWidth; H = scene.clientHeight;
    hy = H - 50; top = 62;
    arc.setAttribute('viewBox', `0 0 ${W} ${H}`);
    arc.setAttribute('preserveAspectRatio', 'none');
    arcPath.setAttribute('d', `M${PAD} ${hy} Q${W / 2} ${2 * top - hy} ${W - PAD} ${hy}`);
  }

  function render() {
    state.idx = clamp(state.idx, minIdx(), STEPS - 1);
    const t = state.idx / (STEPS - 1), h = hour(state.idx);
    const x = PAD + t * (W - 2 * PAD);
    const y = hy - (hy - top) * 4 * t * (1 - t);
    const s = 0.85 + 0.4 * Math.sin(Math.PI * t);
    sun.style.setProperty('--sx', (x - 32) + 'px');
    sun.style.setProperty('--sy', (y - 32) + 'px');
    sun.style.setProperty('--ss', s.toFixed(3));
    for (let k = 1; k < 4; k++) scene.style.setProperty('--o' + k, clamp((h - KEYS[k - 1]) / (KEYS[k] - KEYS[k - 1]), 0, 1).toFixed(3));
    scene.style.setProperty('--st', clamp(1 - (h - 5) / 1.2, 0, 1).toFixed(2));
    scene.classList.toggle('dark', h <= 5.5);
    const label = fmt(state.idx);
    timeEl.textContent = label;
    sun.setAttribute('aria-valuenow', 300 + state.idx * 30);
    sun.setAttribute('aria-valuetext', label);
    const whoTxt = state.who;
    sumEl.textContent = `${DAYS[state.day]}, ${label}, for ${whoTxt}.`;
    const msg = `Hello Preeti ma'am, I found you on Google. Is a yoga session possible on ${DAYS[state.day]} at ${label} for ${whoTxt}? Please tell me the fee and place.`;
    ask.href = 'https://wa.me/917982353355?text=' + encodeURIComponent(msg);
    $$('[data-day]').forEach((b) => {
      const d = +b.dataset.day;
      b.setAttribute('aria-pressed', String(d === state.day));
    });
    $$('[data-who]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.who === state.who)));
  }

  const used = () => sun.classList.add('used');
  const setFromX = (clientX) => {
    const r = scene.getBoundingClientRect();
    const t = clamp((clientX - r.left - PAD) / (W - 2 * PAD), 0, 1);
    state.idx = Math.round(t * (STEPS - 1));
    render();
  };

  // drag the sun
  let dragging = false;
  sun.addEventListener('pointerdown', (e) => {
    dragging = true; used(); sun.classList.add('drag');
    sun.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  sun.addEventListener('pointermove', (e) => { if (dragging) setFromX(e.clientX); });
  const stop = () => { dragging = false; sun.classList.remove('drag'); };
  sun.addEventListener('pointerup', stop);
  sun.addEventListener('pointercancel', stop);
  // tap anywhere on the scene to move the sun there
  scene.addEventListener('click', (e) => { if (!sun.contains(e.target)) { used(); setFromX(e.clientX); } });
  // keyboard
  sun.addEventListener('keydown', (e) => {
    const k = e.key; let d = 0;
    if (k === 'ArrowRight' || k === 'ArrowUp') d = 1;
    else if (k === 'ArrowLeft' || k === 'ArrowDown') d = -1;
    else if (k === 'Home') { state.idx = minIdx(); used(); render(); e.preventDefault(); return; }
    else if (k === 'End') { state.idx = STEPS - 1; used(); render(); e.preventDefault(); return; }
    else return;
    e.preventDefault(); used(); state.idx += d; render();
  });

  // buttons
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => { used(); state.idx += +b.dataset.step; render(); }));
  $$('[data-who]').forEach((b) => b.addEventListener('click', () => { state.who = b.dataset.who; render(); }));
  $$('[data-day]').forEach((b) => b.addEventListener('click', () => { state.day = +b.dataset.day; render(); }));

  layout(); render();
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); render(); }, 80); });
  if (reduce) sun.classList.add('used');
})();
