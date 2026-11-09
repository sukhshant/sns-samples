// Savoré by Charu Jain: WhatsApp ordering, price estimates and the 3D scenes.

// SAMPLE number: replace with Charu's real WhatsApp before going live.
const WA_NUMBER = '919876543210';
const PHONE_TEXT = '+91 98765 43210';

// SAMPLE PRICES: placeholders for the demo, not Charu's real prices. Confirm with her and edit here.
const SAMPLE_PRICES = {
  cakePerKg: 1000,                         // eggless cream cake, per kg
  tierExtra: { 1: 0, 2: 400, 3: 800 },      // structure and supports for stacked tiers
  tierMinKg: { 1: 0.5, 2: 2, 3: 3 },
  topper: { sprinkles: 0, pearls: 250, crown: 450, candles: 80 },
  premixJar: 349,
  spread: 0.15,                            // the estimate shows a range: price to price + 15%
};
const LEAD_DAYS = 2; // "2–3 days prior"

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rupees = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const round50 = (n) => Math.round(n / 50) * 50;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  flavour: 'vanilla',
  cake: { kg: 1, tiers: 1, colour: 'blush', topper: 'sprinkles' },
  pflavour: 'Classic Vanilla', jars: 1,
};
const COLOUR_NAMES = { blush: 'blush pink', cream: 'cream white', sky: 'sky blue', mint: 'mint', cocoa: 'chocolate' };
const TOPPER_NAMES = { sprinkles: 'sprinkles', pearls: 'gold pearls', crown: 'a crown', candles: 'candles' };

// WhatsApp links
function waLink(text) { return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`; }
const flavourName = () => (state.flavour === 'chocolate' ? 'Classic Chocolate' : 'Classic Vanilla');
const WA_TEXT = {
  hello: () => "Hi Charu! I found Savoré online and I'd like to place an order.",
  premix: () => `Hi Charu! I'd like to order the Healthy Oats Pancake Premix (${flavourName()}).`,
  cake: () => "Hi Charu! I'd like to plan a custom cake. Can we talk about the design?",
};
function wireWa() {
  $$('[data-wa]').forEach((a) => {
    const set = () => { a.href = waLink(WA_TEXT[a.dataset.wa]()); };
    set();
    a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('pointerdown', set); a.addEventListener('focus', set);
  });
  $('#callLink').href = 'tel:+' + WA_NUMBER;
  $('#phoneText').textContent = PHONE_TEXT;
}

// Sticky bar line and floating WhatsApp button
function wireChrome() {
  const bar = $('#bar'), float = $('.float-wa'), hero = $('.hero');
  const onScroll = () => {
    bar.classList.toggle('is-scrolled', scrollY > 8);
    const past = hero.getBoundingClientRect().bottom < 0;
    const atOrder = $('#order').getBoundingClientRect().top < innerHeight * 0.8;
    float.classList.toggle('is-on', past && !atOrder);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

// Premix flavour chips and steps
const listeners = { flavour: [], cake: [] };
function setFlavour(f) {
  state.flavour = f;
  $$('.flavours .chip').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.flavour === f)));
  $('.premix').classList.toggle('is-choc', f === 'chocolate');
  $$('[data-wa="premix"]').forEach((a) => { a.href = waLink(WA_TEXT.premix()); });
  listeners.flavour.forEach((fn) => fn(f));
}
function wirePremix() {
  $$('.flavours .chip').forEach((b) => b.addEventListener('click', () => setFlavour(b.dataset.flavour)));
  const group = $('.flavours');
  group.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next = state.flavour === 'vanilla' ? 'chocolate' : 'vanilla';
    setFlavour(next); $(`.chip[data-flavour="${next}"]`).focus();
  });
}
function setStep(i) { $$('.steps .step').forEach((li) => li.classList.toggle('is-on', Number(li.dataset.step) === i)); }

// Segmented controls (pressed state)
function wireSeg(root, onPick) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b || b.disabled) return;
    $$('button[data-v]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    onPick(b.dataset.v);
  });
}

// Cake estimate
export function cakeEstimate({ kg, tiers, topper }, P = SAMPLE_PRICES) {
  const low = kg * P.cakePerKg + P.tierExtra[tiers] + P.topper[topper];
  return [round50(low), round50(low * (1 + P.spread))];
}
function bump(el) { if (reduced) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 400); }

function wireCake() {
  const form = $('#cakeForm'), out = $('#cakePrice'), tierHint = $('#tierHint');
  const kgBtns = $$('[data-name="kg"] button', form);
  const render = () => {
    const c = state.cake, min = SAMPLE_PRICES.tierMinKg[c.tiers];
    kgBtns.forEach((b) => { b.disabled = Number(b.dataset.v) < min; });
    if (c.kg < min) {
      c.kg = min;
      kgBtns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === min)));
    }
    tierHint.hidden = c.tiers === 1;
    tierHint.textContent = c.tiers > 1 ? `${c.tiers === 2 ? 'Two' : 'Three'} tiers start at ${min} kg.` : '';
    const [lo, hi] = cakeEstimate(c);
    out.textContent = `${rupees(lo)} – ${rupees(hi)}`;
    bump(out);
    listeners.cake.forEach((fn) => fn({ ...c, msg: $('#cakeMsg').value.trim() }));
  };
  wireSeg($('[data-name="kg"]', form), (v) => { state.cake.kg = Number(v); render(); });
  wireSeg($('[data-name="tiers"]', form), (v) => { state.cake.tiers = Number(v); render(); });
  wireSeg($('[data-name="colour"]', form), (v) => { state.cake.colour = v; render(); });
  wireSeg($('[data-name="topper"]', form), (v) => { state.cake.topper = v; render(); });
  let t; $('#cakeMsg').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => listeners.cake.forEach((fn) => fn({ ...state.cake, msg: $('#cakeMsg').value.trim() })), 250); });

  // Date: 2–3 days notice
  const date = $('#cakeDate'), hint = $('#dateHint');
  const earliest = new Date(); earliest.setHours(0, 0, 0, 0); earliest.setDate(earliest.getDate() + LEAD_DAYS);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  date.min = iso(earliest);
  const nice = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  date.addEventListener('change', () => {
    const d = date.value ? new Date(date.value + 'T00:00') : null;
    const early = d && d < earliest;
    hint.hidden = !early;
    hint.textContent = early ? `Charu needs 2–3 days. The earliest is ${nice(earliest)}.` : '';
  });

  $('#sendCake').addEventListener('click', () => {
    const c = state.cake, [lo, hi] = cakeEstimate(c), msg = $('#cakeMsg').value.trim();
    const d = date.value ? new Date(date.value + 'T00:00') : null;
    const lines = [
      'Hi Charu! I built this cake on your website:',
      `• ${c.kg} kg, ${c.tiers} tier${c.tiers > 1 ? 's' : ''}`,
      `• ${COLOUR_NAMES[c.colour]} with ${TOPPER_NAMES[c.topper]}`,
      msg && `• On the cake: "${msg}"`,
      d && `• Needed on ${nice(d)}`,
      `The site estimated ${rupees(lo)} – ${rupees(hi)}. Could you confirm?`,
    ].filter(Boolean);
    open(waLink(lines.join('\n')), '_blank', 'noopener');
  });
  render();
}

function wirePremixOrder() {
  const out = $('#premixPrice'), count = $('#jarCount');
  const render = () => { count.textContent = state.jars; out.textContent = rupees(state.jars * SAMPLE_PRICES.premixJar); bump(out); };
  wireSeg($('[data-name="pflavour"]'), (v) => { state.pflavour = v; });
  $('#jarMinus').addEventListener('click', () => { state.jars = Math.max(1, state.jars - 1); render(); });
  $('#jarPlus').addEventListener('click', () => { state.jars = Math.min(12, state.jars + 1); render(); });
  $('#sendPremix').addEventListener('click', () => {
    const text = `Hi Charu! I'd like ${state.jars} jar${state.jars > 1 ? 's' : ''} of the Healthy Oats Pancake Premix (${state.pflavour}). The site estimated ${rupees(state.jars * SAMPLE_PRICES.premixJar)}.`;
    open(waLink(text), '_blank', 'noopener');
  });
  render();
}

// Tabs
function wireTabs() {
  const tabs = $$('.tabs [role="tab"]');
  const pick = (t) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((t) => t.addEventListener('click', () => pick(t)));
  $('.tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    pick(n); n.focus();
  });
}

// Gentle 3D tilt on photos (pointer devices only)
function wireTilt() {
  if (reduced || !matchMedia('(hover: hover)').matches) return;
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// 3D, loaded only where WebGL works; the photos stand in otherwise.
async function start3d() {
  const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  if (!ok) { document.documentElement.classList.add('no-3d'); setStep(0); return; }
  try {
    const m = await import('./scene3d.js');
    const fonts = Promise.race([
      Promise.all(['800 80px Fraunces', '400 60px "Pinyon Script"', '800 40px Nunito'].map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    await fonts;
    m.heroScene($('#jar3d'), { reduced });
    const premix = m.premixScene($('#pancake3d'), { reduced, section: $('.premix'), onStep: setStep });
    listeners.flavour.push(premix.setFlavour);
    const cake = m.cakeScene($('#cake3d'), { reduced, onDrag: () => $('.drag-hint').classList.add('is-gone') });
    listeners.cake.push(cake.set);
    cake.set({ ...state.cake, msg: '' });
  } catch (e) {
    console.warn('3D off:', e);
    document.documentElement.classList.add('no-3d');
  }
}

wireWa(); wireChrome(); wirePremix(); wireCake(); wirePremixOrder(); wireTabs(); wireTilt(); start3d();
