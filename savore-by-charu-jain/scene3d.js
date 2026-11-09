// Three soft, clay-like scenes: the premix jar (hero), the pancake story (premix) and the cake builder.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V2 = (x, y) => new THREE.Vector2(x, y);
// Profiles are written top to bottom; LatheGeometry wants bottom to top for outward faces.
const lathe = (pts, n) => new THREE.LatheGeometry(pts.slice().reverse(), n);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const backOut = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

// ---------- shared stage and loop ----------
const stages = [];
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  for (const s of stages) if (s.visible && s.update) { s.update(now / 1000, dt); s.renderer.render(s.scene, s.camera); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function makeStage(canvas, fov = 30) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  pm.dispose();
  scene.add(new THREE.HemisphereLight(0xfff7ef, 0xf4c3cc, 0.8));
  const key = new THREE.DirectionalLight(0xfff0de, 1.5); key.position.set(-3, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9e0, 0.6); rim.position.set(4, 2, -4); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  const stage = { renderer, scene, camera, visible: false, aspect: 1, update: null, onResize: null };
  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = stage.aspect = w / h; camera.updateProjectionMatrix();
    stage.onResize?.(w / h);
  };
  new ResizeObserver(fit).observe(canvas); fit();
  new IntersectionObserver(([e]) => { stage.visible = e.isIntersecting; }, { rootMargin: '120px' }).observe(canvas);
  stages.push(stage);
  return stage;
}

// ---------- textures ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
const LABEL = { vanilla: { bg: '#F1C455', name: 'Classic Vanilla' }, chocolate: { bg: '#D8B19C', name: 'Classic Chocolate' } };
function labelTexture(flavour) {
  const L = LABEL[flavour];
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = L.bg; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 900; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    const cx = w / 2;
    g.textAlign = 'center'; g.fillStyle = '#5A3016';
    g.font = '800 50px Fraunces, Georgia, serif';
    g.fillText('HEALTHY', cx, 78); g.fillText('OATS PANCAKE', cx, 132); g.fillText('PREMIX', cx, 186);
    // little pancake stack
    const py = 262;
    g.fillStyle = 'rgba(90,48,22,.18)'; g.beginPath(); g.ellipse(cx, py + 50, 120, 18, 0, 0, 7); g.fill();
    for (let i = 0; i < 4; i++) {
      const y = py + 36 - i * 20;
      g.fillStyle = '#C9813A'; g.beginPath(); g.ellipse(cx, y + 6, 100, 22, 0, 0, 7); g.fill();
      g.fillStyle = '#E8A95A'; g.beginPath(); g.ellipse(cx, y, 100, 20, 0, 0, 7); g.fill();
    }
    g.fillStyle = '#B5651D'; g.beginPath(); g.ellipse(cx, py - 22, 80, 14, 0, 0, 7); g.fill();
    g.fillRect(cx + 40, py - 22, 12, 34); g.fillRect(cx - 62, py - 22, 10, 26);
    g.fillStyle = '#FBE48E'; rr(g, cx - 22, py - 46, 44, 22, 5); g.fill();
    g.fillStyle = '#3B2220'; g.font = '600 46px Fraunces, Georgia, serif'; g.fillText(L.name, cx, 372);
    g.fillStyle = '#4A2A18'; rr(g, cx - 200, 398, 400, 46, 23); g.fill();
    g.fillStyle = '#FFF4E4'; g.font = '800 24px Nunito, sans-serif'; g.fillText('Whisk It. Flip It. Love It.', cx, 429);
    g.fillStyle = '#5A3016'; g.font = '400 34px "Pinyon Script", cursive'; g.fillText('Savoré By Charu Jain', cx, 488);
  });
}
function bandTexture() {
  const t = canvasTex(1024, 96, (g, w, h) => {
    g.fillStyle = '#F2B7C0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#B23F3E'; g.font = '500 52px Fraunces, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) g.fillText('S A V O R É', (i + 0.5) * w / 3, h / 2 + 3);
  });
  return t;
}
function pancakeTexture(choc) {
  return canvasTex(256, 256, (g, w, h) => {
    const top = choc ? '#6E4128' : '#C98843', edge = choc ? '#A97A58' : '#F2D7A2', spot = choc ? '#4E2B18' : '#9C5A26';
    // lathe v runs top centre -> rim -> bottom centre: browned faces, a pale fluffy rim
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, top); gr.addColorStop(.3, top); gr.addColorStop(.4, edge); gr.addColorStop(.6, edge); gr.addColorStop(.7, top); gr.addColorStop(1, top);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = spot; g.globalAlpha = .35;
    for (let i = 0; i < 420; i++) { const y = Math.random() * h * .34; g.beginPath(); g.arc(Math.random() * w, y, Math.random() * 3 + .5, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  });
}
function ridgeTexture() {
  const t = canvasTex(16, 256, (g, w, h) => {
    for (let y = 0; y < h; y++) { const v = 128 + Math.sin(y / h * Math.PI * 2 * 14) * 90; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, w, 1); }
  }, false);
  return t;
}
function shadowDisc(r, o = .3) {
  const tex = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(110,45,40,${o})`); gr.addColorStop(.55, `rgba(110,45,40,${o * .45})`); gr.addColorStop(1, 'rgba(110,45,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = -1;
  return m;
}

// ---------- materials ----------
const M = {
  gold: () => new THREE.MeshStandardMaterial({ color: 0xE2B65E, metalness: 1, roughness: .28 }),
  pearl: (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .25, clearcoat: 1, clearcoatRoughness: .1, sheen: .4, sheenColor: 0xffffff }),
  clay: (c, r = .6) => new THREE.MeshStandardMaterial({ color: c, roughness: r }),
};

// ---------- models ----------
function makeJar(flavour) {
  const g = new THREE.Group();
  const H = 2.5, R = 1;
  const powderMat = M.clay(flavour === 'chocolate' ? 0xEADFD2 : 0xF3EBDB, 1);
  const powder = new THREE.Mesh(new THREE.CylinderGeometry(R * .955, R * .955, H * .84, 64), powderMat);
  powder.position.y = -H * .08; g.add(powder);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .06, transparent: true, opacity: .2, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  g.add(shell);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.0, R * .97, .06, 64), M.clay(0xF6F1E8, .3)); base.position.y = -H / 2; g.add(base);
  const len = Math.PI * 1.12;
  const labelMat = new THREE.MeshStandardMaterial({ map: labelTexture(flavour), roughness: .5 });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.008, R * 1.008, H * .52, 96, 1, true, -len / 2, len), labelMat);
  label.position.y = -H * .15; g.add(label);
  const lid = new THREE.Group();
  const lidMesh = new THREE.Mesh(lathe([V2(0, .5), V2(.96, .5), V2(1.04, .47), V2(1.07, .4), V2(1.07, 0), V2(0, 0)], 64), M.clay(0xFBF8F1, .32));
  lid.add(lidMesh);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.075, 1.075, .3, 96, 1, true), new THREE.MeshStandardMaterial({ map: bandTexture(), roughness: .55 }));
  band.position.y = .2; lid.add(band);
  lid.position.y = H / 2 - .04; g.add(lid);
  const shadow = shadowDisc(1.9); shadow.position.y = -H / 2 - .02; g.add(shadow);
  return {
    group: g, lid, lidY: lid.position.y,
    setFlavour(f) { labelMat.map.dispose(); labelMat.map = labelTexture(f); labelMat.needsUpdate = true; powderMat.color.set(f === 'chocolate' ? 0xEADFD2 : 0xF3EBDB); },
  };
}

const PANCAKE_R = 1.15, PANCAKE_H = .24;
const pancakeGeo = lathe([V2(0, PANCAKE_H * .96), V2(PANCAKE_R * .6, PANCAKE_H), V2(PANCAKE_R - .16, PANCAKE_H * .96), V2(PANCAKE_R - .05, PANCAKE_H * .8), V2(PANCAKE_R, PANCAKE_H * .5), V2(PANCAKE_R - .05, PANCAKE_H * .18), V2(PANCAKE_R - .18, .01), V2(0, 0)], 56);
function makeStack(n, choc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: pancakeTexture(choc), roughness: .75 });
  const plate = new THREE.Mesh(lathe([V2(0, .02), V2(1.35, .02), V2(1.62, .12), V2(1.7, .16), V2(1.66, .1), V2(1.3, -.04), V2(0, -.04)], 64), M.clay(0xFFFFFF, .22));
  g.add(plate);
  const cakes = [];
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(pancakeGeo, mat);
    p.position.set((Math.random() - .5) * .1, .04 + i * PANCAKE_H * .92, (Math.random() - .5) * .1);
    p.rotation.y = Math.random() * 6; p.scale.set(1 - i * .02 + Math.random() * .03, 1, 1 - i * .02 + Math.random() * .03);
    g.add(p); cakes.push(p);
  }
  const shadow = shadowDisc(2.2, .32); shadow.position.y = -.05; g.add(shadow);
  return { group: g, cakes, mat, top: .04 + n * PANCAKE_H * .92 };
}
function makeSyrup() {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xA9561A, roughness: .05, clearcoat: 1, clearcoatRoughness: .02, transparent: true, opacity: .93 });
  const pool = new THREE.Mesh(lathe([V2(0, .07), V2(.7, .065), V2(.98, .04), V2(1.06, .005), V2(0, 0)], 56), mat);
  g.add(pool);
  const drips = [], dripGeo = new THREE.CapsuleGeometry(.04, 1, 4, 10); dripGeo.translate(0, -.5, 0);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + .3 + Math.random() * .3, d = new THREE.Mesh(dripGeo, mat);
    d.position.set(Math.cos(a) * (PANCAKE_R - .045), .02, Math.sin(a) * (PANCAKE_R - .045)); d.userData.len = .12 + Math.random() * .3;
    g.add(d); drips.push(d);
  }
  const butter = new THREE.Mesh(new RoundedBoxGeometry(.46, .2, .46, 3, .06), M.clay(0xF8E38E, .45));
  butter.position.y = .16; butter.rotation.y = .5; g.add(butter);
  return { group: g, pool, drips, butter };
}
// keepOut(v): true when a point would cover the product, so it is moved behind it.
function makeSprinkles(count, spread, keepOut, palette = [0xF4AFC0, 0xBFE5CC, 0xF2C96A, 0xBFD6EE, 0xFFFFFF, 0xDE8C9C]) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 16, 12);
  const items = [];
  palette.forEach((c, k) => {
    const mesh = new THREE.InstancedMesh(geo, k % 3 === 2 ? M.gold() : M.pearl(c), Math.ceil(count / palette.length));
    for (let i = 0; i < mesh.count; i++) {
      const dir = new THREE.Vector3().randomDirection(), r = spread * (.65 + Math.random() * .45);
      const base = dir.multiplyScalar(r);
      if (keepOut?.(base)) base.z = -Math.abs(base.z) - 1.2;
      items.push({ mesh, i, base, size: .06 + Math.random() * .1, phase: Math.random() * 6, speed: .4 + Math.random() * .6 });
    }
    g.add(mesh);
  });
  const dummy = new THREE.Object3D();
  return {
    group: g,
    update(t, burst = 1) {
      for (const it of items) {
        dummy.position.copy(it.base).multiplyScalar(.6 + .4 * burst);
        dummy.position.y += Math.sin(t * it.speed + it.phase) * .12;
        dummy.scale.setScalar(it.size * burst);
        dummy.updateMatrix(); it.mesh.setMatrixAt(it.i, dummy.matrix);
      }
      g.children.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
    },
  };
}
function pointerParallax(el) {
  const p = { x: 0, y: 0, tx: 0, ty: 0 };
  if (matchMedia('(hover: hover)').matches) {
    addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); p.tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); p.ty = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1); }, { passive: true });
  }
  p.step = (dt) => { p.x += (p.tx - p.x) * Math.min(1, dt * 4); p.y += (p.ty - p.y) * Math.min(1, dt * 4); };
  return p;
}

// ---------- hero: the jar ----------
export function heroScene(canvas, { reduced }) {
  const s = makeStage(canvas, 28);
  const root = new THREE.Group(); s.scene.add(root);
  const jar = makeJar('vanilla'); root.add(jar.group);
  jar.group.rotation.z = -.06;
  const stack = makeStack(4, false); stack.group.scale.setScalar(.62); root.add(stack.group);
  const syrup = makeSyrup(); stack.group.add(syrup.group);
  syrup.drips.forEach((d) => { d.scale.y = d.userData.len; });
  syrup.group.position.y = stack.top + PANCAKE_H * .9;
  const front = (v) => v.z > -.8 && Math.abs(v.x + .5) < 1.6 && Math.abs(v.y) < 1.9; // the jar's face
  const pearls = makeSprinkles(12, 3.0, front); root.add(pearls.group);
  const par = pointerParallax(canvas);
  s.onResize = (a) => {
    const narrow = a < .85;
    stack.group.position.set(narrow ? 1.15 : 1.75, -1.3, narrow ? .9 : .4);
    jar.group.position.set(narrow ? -.4 : -.55, .1, 0);
    s.camera.position.set(0, 1.1, 11.8 / Math.min(1, Math.max(a, .55) * 1.05));
    s.camera.lookAt(0, -.05, 0);
  };
  s.onResize(s.aspect);
  let intro = 0;
  s.update = (t, dt) => {
    par.step(dt);
    intro = reduced ? 1 : Math.min(1, intro + dt / 1.4);
    const k = backOut(intro);
    jar.group.scale.setScalar(.6 + .4 * k);
    jar.group.rotation.y = (reduced ? 0 : Math.sin(t * .45) * .38) + par.x * .35;
    jar.group.position.y = .05 + (reduced ? 0 : Math.sin(t * .9) * .06);
    stack.group.rotation.y = t * (reduced ? 0 : .12);
    root.rotation.x = par.y * .06;
    pearls.update(reduced ? 0 : t, easeOut(intro));
  };
  return s;
}

// ---------- premix: cook a pancake from the jar, driven by scroll ----------
// Scroll story: scoop the mix into a bowl and whisk (Whisk it), pour on the pan, bubbles, golden, flip (Flip it),
// slide onto the stack with syrup and butter (Love it). The camera glides bowl -> pan -> plate; nothing else moves.
const BATTER = { vanilla: 0xEED9A8, chocolate: 0x9A6A4A }, POWDER = { vanilla: 0xF3EBDB, chocolate: 0xEADFD2 }, GOLDEN = { vanilla: 0xC98843, chocolate: 0x6E4128 };
function makeBowl() {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(lathe([V2(1.03, .9), V2(1.06, .86), V2(1.0, .48), V2(.62, .03), V2(0, 0)], 56), new THREE.MeshStandardMaterial({ color: 0xF6C9D0, roughness: .35, side: THREE.DoubleSide }));
  g.add(bowl);
  const inner = new THREE.Mesh(lathe([V2(.97, .87), V2(.92, .5), V2(.56, .12), V2(0, .1)], 56), new THREE.MeshStandardMaterial({ color: 0xFFF7F4, roughness: .3, side: THREE.DoubleSide }));
  g.add(inner);
  const fillMat = new THREE.MeshStandardMaterial({ color: 0xF3EBDB, roughness: .9 });
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .03, 48), fillMat); g.add(fill);
  const shadow = shadowDisc(1.5, .25); shadow.position.y = -.01; g.add(shadow);
  return { group: g, fill, fillMat, setLevel(l) { // l 0..1
    const y = .12 + l * .55, r = .56 + (y - .12) / .38 * .36;
    fill.position.y = y; fill.scale.set(Math.min(r, .95), 1, Math.min(r, .95)); fill.visible = l > .01;
  } };
}
function makeWhisk() {
  const g = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: 0xD9D6D2, metalness: .9, roughness: .25 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.06, .05, .9, 16), M.clay(0xF2B7C0, .4)); handle.position.y = 1.25; g.add(handle);
  for (let i = 0; i < 4; i++) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(.2, .012, 6, 32), steel);
    loop.scale.y = 2.2; loop.rotation.y = i * Math.PI / 4; loop.position.y = .38; g.add(loop);
  }
  return g;
}
function makePan() {
  const g = new THREE.Group(), dark = new THREE.MeshStandardMaterial({ color: 0x34302D, roughness: .45, metalness: .3, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(lathe([V2(1.42, .34), V2(1.38, .32), V2(1.25, .08), V2(0, .06)], 64), dark));
  g.add(new THREE.Mesh(lathe([V2(1.46, .33), V2(1.3, .02), V2(0, 0)], 64), dark));
  const handle = new THREE.Mesh(new RoundedBoxGeometry(1.7, .14, .26, 3, .06), M.clay(0x5A3A2A, .5)); handle.position.set(2.2, .3, 0); handle.rotation.z = .12; g.add(handle);
  const shadow = shadowDisc(1.9, .28); shadow.position.y = -.01; g.add(shadow);
  return g;
}
function stream(color) {
  const geo = new THREE.CylinderGeometry(.06, .04, 1, 12); geo.translate(0, -.5, 0);
  const m = new THREE.Mesh(geo, M.clay(color, .8)); m.visible = false;
  return m;
}
function hang(m, from, toY, on) { // a pour from a point straight down to a height
  m.visible = on && from.y > toY; if (!m.visible) return;
  m.position.copy(from); m.scale.set(1, from.y - toY, 1);
}
export function premixScene(canvas, { reduced, section, onStep }) {
  const s = makeStage(canvas, 30);
  const root = new THREE.Group(); s.scene.add(root);
  let flavour = 'vanilla';
  const jar = makeJar('vanilla'); jar.group.scale.setScalar(.7); root.add(jar.group);
  const bowl = makeBowl(); bowl.group.scale.setScalar(.8); root.add(bowl.group);
  const whisk = makeWhisk(); whisk.scale.setScalar(.8); root.add(whisk);
  const pan = makePan(); root.add(pan);
  const stack = makeStack(2, false); root.add(stack.group);
  const syrup = makeSyrup(); stack.group.add(syrup.group);
  const cakeRaw = new THREE.MeshStandardMaterial({ color: BATTER.vanilla, roughness: .7 });
  const cake = new THREE.Mesh(pancakeGeo, cakeRaw); root.add(cake);
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), M.clay(0xFFF1D6, .5), 12);
  root.add(bubbles);
  const bub = Array.from({ length: 12 }, (_, i) => { const a = i * 2.4, r = .25 + (i % 4) * .17; return { x: Math.cos(a) * r, z: Math.sin(a) * r, d: (i % 5) * .012 }; });
  const powderStream = stream(0xF3EBDB), batterStream = stream(BATTER.vanilla); root.add(powderStream, batterStream);
  // layout along x: jar & bowl, pan, plate
  const JAR = new THREE.Vector3(-4.3, 0, -.2), BOWL = new THREE.Vector3(-2.7, -.95, .3), PAN = new THREE.Vector3(.2, -.95, 0), PLATE = new THREE.Vector3(3.6, -.95, 0);
  pan.position.copy(PAN); stack.group.position.copy(PLATE);
  const stackTop = PLATE.y + stack.top;
  const mouthJar = new THREE.Vector3(), mouthBowl = new THREE.Vector3(), tmp = new THREE.Vector3();
  let dist = 9;
  s.onResize = (a) => { dist = 8.6 / Math.min(1, Math.max(a, .55) * 1.08); };
  s.onResize(s.aspect);
  let stepNow = -1, auto = 0, camX = -3;
  const progress = (dt) => {
    if (reduced) return .97;
    const r = section.getBoundingClientRect(), span = r.height - innerHeight;
    if (span > innerHeight * .5) return clamp(-r.top / span);
    auto = (auto + dt / 16) % 1; return auto; // phones: the section is short, so the story plays on a loop
  };
  s.update = (t, dt) => {
    const p = progress(dt);
    const step = p < .3 ? 0 : p < .72 ? 1 : 2;
    if (step !== stepNow) { stepNow = step; onStep?.(step); }
    // 1. lid off, tip the jar into the bowl
    const lid = seg(p, .03, .09);
    jar.lid.position.set(-easeOut(lid) * 1.6, jar.lidY + Math.sin(lid * Math.PI) * .8 + (lid > .99 ? -2.2 : 0), 0);
    jar.lid.visible = lid < .99;
    const tip = Math.sin(seg(p, .08, .24) * Math.PI); // out and back
    jar.group.position.set(THREE.MathUtils.lerp(JAR.x, -3.25, easeInOut(tip)), THREE.MathUtils.lerp(JAR.y, 1.05, easeInOut(tip)), JAR.z);
    jar.group.rotation.set(0, .3 * (1 - tip), -1.95 * easeInOut(tip));
    jar.group.updateMatrixWorld(); mouthJar.copy(jar.group.localToWorld(tmp.set(.95, 1.25, 0)));
    const level = seg(p, .11, .2);
    bowl.setLevel(.15 + .65 * level);
    hang(powderStream, mouthJar, BOWL.y + .5, tip > .55 && p < .21);
    // whisk: powder becomes batter
    const wk = seg(p, .2, .31), wIn = Math.sin(wk * Math.PI);
    whisk.position.set(BOWL.x + Math.sin(t * 6) * .12 * wIn, BOWL.y + .25 + (1 - Math.min(1, wIn * 2)) * 2.4, BOWL.z + Math.cos(t * 6) * .12 * wIn);
    whisk.rotation.y = t * 9 * wIn; whisk.visible = wk > 0 && wk < 1;
    bowl.fillMat.color.set(POWDER[flavour]).lerp(new THREE.Color(BATTER[flavour]), seg(p, .22, .3));
    // 2. pour onto the pan
    const lift = Math.sin(seg(p, .32, .46) * Math.PI);
    bowl.group.position.set(THREE.MathUtils.lerp(BOWL.x, PAN.x - .95, easeInOut(lift)), THREE.MathUtils.lerp(BOWL.y, .6, easeInOut(lift)), THREE.MathUtils.lerp(BOWL.z, 0, lift));
    bowl.group.rotation.z = -1.15 * easeInOut(seg(lift, .5, 1));
    bowl.group.updateMatrixWorld(); mouthBowl.copy(bowl.group.localToWorld(tmp.set(1.0, .88, 0)));
    const poured = seg(p, .37, .44);
    bowl.setLevel(.8 * (1 - poured * .9));
    hang(batterStream, mouthBowl, PAN.y + .14, lift > .7 && poured > 0 && poured < 1);
    batterStream.material.color.set(BATTER[flavour]);
    // the pancake grows, bubbles, turns golden, flips
    const grow = easeOut(seg(p, .37, .46));
    const fl = seg(p, .56, .66);
    const cook = seg(p, .45, .56) * .7 + seg(p, .62, .7) * .3;
    cakeRaw.color.set(BATTER[flavour]).lerp(new THREE.Color(GOLDEN[flavour]), cook);
    // 3. slide onto the stack
    const slide = easeInOut(seg(p, .74, .84));
    const onPan = new THREE.Vector3(PAN.x, PAN.y + .07, 0), onPlate = new THREE.Vector3(PLATE.x, stackTop, 0);
    cake.position.lerpVectors(onPan, onPlate, slide);
    cake.position.y += Math.sin(fl * Math.PI) * 1.5 + Math.sin(slide * Math.PI) * 1.1;
    cake.rotation.set(easeInOut(fl) * Math.PI * 2, .4, 0);
    cake.scale.set(Math.max(.02, grow) * .95, slide > 0 ? 1 : .55 + .45 * grow, Math.max(.02, grow) * .95);
    cake.visible = grow > 0;
    cake.material = fl > .5 ? stack.mat : cakeRaw; // golden side up after the flip
    const bubbleOn = seg(p, .46, .5) * (1 - seg(p, .54, .57));
    const d = new THREE.Object3D();
    bub.forEach((b, i) => {
      d.position.set(PAN.x + b.x, PAN.y + .07 + PANCAKE_H * .98, b.z); d.scale.set(1, .5, 1).multiplyScalar(Math.max(.0001, (.07 + b.d) * bubbleOn * grow));
      d.updateMatrix(); bubbles.setMatrixAt(i, d.matrix);
    });
    bubbles.instanceMatrix.needsUpdate = true; bubbles.visible = bubbleOn > 0;
    // syrup and butter once it lands
    const sy = seg(p, .85, .93);
    syrup.group.position.y = stack.top + PANCAKE_H * .9;
    syrup.pool.scale.set(.2 + .8 * easeOut(sy), 1, .2 + .8 * easeOut(sy)); syrup.pool.visible = sy > 0;
    syrup.drips.forEach((dr, i) => { const k = easeOut(seg(p, .88 + i * .01, .97)) * dr.userData.len; dr.scale.y = Math.max(.001, k); dr.visible = k > .01; });
    const b = seg(p, .9, .97);
    syrup.butter.position.y = .16 + (1 - backOut(b)) * 2.2; syrup.butter.visible = b > 0;
    // camera: bowl -> pan -> plate
    const target = p < .33 ? -3.1 : p < .74 ? PAN.x : THREE.MathUtils.lerp(PAN.x, PLATE.x - .2, seg(p, .74, .84));
    camX += (target - camX) * Math.min(1, dt * (reduced ? 60 : 2.2));
    s.camera.position.set(camX, 2.6, dist); s.camera.lookAt(camX, -.45, 0);
  };
  return {
    setFlavour(f) {
      if (f === flavour) return;
      flavour = f; jar.setFlavour(f);
      stack.mat.map.dispose(); stack.mat.map = pancakeTexture(f === 'chocolate'); stack.mat.needsUpdate = true;
      powderStream.material.color.set(POWDER[f]);
    },
  };
}

// ---------- cake builder ----------
const FROST = { blush: 0xF4C3CC, cream: 0xFBF5EA, sky: 0xC4D9F0, mint: 0xBFE5CC, cocoa: 0x7A4B33 };
const KG_R = { 0.5: .82, 1: 1.0, 1.5: 1.12, 2: 1.24, 3: 1.38 };
const ridges = ridgeTexture();
function tierGeo(r, h) {
  return lathe([V2(0, h), V2(r - .1, h), V2(r - .025, h - .03), V2(r, h - .1), V2(r, .02), V2(r - .02, 0), V2(0, 0)], 72);
}
function messageTexture(msg) {
  return canvasTex(1024, 256, (g, w, h) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = 170; g.font = `400 ${size}px "Pinyon Script", cursive`;
    while (g.measureText(msg).width > w - 60 && size > 60) { size -= 8; g.font = `400 ${size}px "Pinyon Script", cursive`; }
    const gr = g.createLinearGradient(0, 40, 0, h - 40); gr.addColorStop(0, '#F7DC8C'); gr.addColorStop(.5, '#C9952F'); gr.addColorStop(1, '#F1CF73');
    g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#8A5E1A'; g.strokeText(msg, w / 2, h / 2 + 8);
    g.fillStyle = gr; g.fillText(msg, w / 2, h / 2 + 6);
  });
}
function buildCake({ kg, tiers, colour, topper, msg }) {
  const g = new THREE.Group();
  const frost = new THREE.MeshStandardMaterial({ color: FROST[colour], roughness: .62, bumpMap: ridges, bumpScale: 1.4 });
  const gold = M.gold();
  const r0 = KG_R[kg] ?? 1, h = tiers === 1 ? 1.05 : .82;
  const list = [];
  let y = .12, r = r0;
  for (let i = 0; i < tiers; i++) {
    const tier = new THREE.Group();
    const body = new THREE.Mesh(tierGeo(r, h), frost); tier.add(body);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + .005, .035, 10, 96), gold); ring.rotation.x = Math.PI / 2; ring.position.y = .04; tier.add(ring);
    tier.position.y = y; tier.userData = { y, r };
    g.add(tier); list.push(tier);
    y += h; r *= .74;
  }
  const top = list[list.length - 1].userData, topY = y, rt = top.r;
  // stand
  const stand = new THREE.Mesh(lathe([V2(0, .12), V2(r0 + .45, .12), V2(r0 + .5, .07), V2(r0 + .45, .03), V2(.35, .02), V2(.28, -.5), V2(.6, -.62), V2(.6, -.68), V2(0, -.68)], 72), M.clay(0xFFFFFF, .2));
  g.add(stand);
  const shadow = shadowDisc(r0 + 1.1, .28); shadow.position.y = -.69; g.add(shadow);
  const deco = new THREE.Group(); deco.position.y = topY; g.add(deco);
  if (topper === 'sprinkles') {
    const geo = new THREE.CapsuleGeometry(.018, .07, 3, 6), cols = [0xF4AFC0, 0xBFE5CC, 0xF2C96A, 0xBFD6EE, 0xFFFFFF, 0xDE8C9C];
    const d = new THREE.Object3D();
    cols.forEach((c) => {
      const mesh = new THREE.InstancedMesh(geo, M.clay(c, .4), 28);
      for (let i = 0; i < 28; i++) {
        const a = Math.random() * 6.283, rr2 = Math.sqrt(Math.random()) * (rt - .14);
        d.position.set(Math.cos(a) * rr2, .012, Math.sin(a) * rr2); d.rotation.set(Math.PI / 2, 0, Math.random() * 6); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
      }
      deco.add(mesh);
    });
  } else if (topper === 'pearls') {
    const white = M.pearl(0xFFF8EE);
    for (let i = 0; i < 9; i++) {
      const a = -.6 + i * .16, big = i % 3 === 0, s2 = big ? .2 : .12 + (i % 2) * .04;
      const m = new THREE.Mesh(new THREE.SphereGeometry(s2, 24, 16), i % 2 ? white : gold);
      m.position.set(Math.cos(a) * (rt - .12), s2 * .8 + (i % 3) * .08, Math.sin(a) * (rt - .12) + .1); deco.add(m);
    }
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * 6.283, m = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), gold);
      m.position.set(Math.cos(a) * (rt - .05), .03, Math.sin(a) * (rt - .05)); deco.add(m);
    }
  } else if (topper === 'crown') {
    const cr = Math.min(.62, rt * .62), crown = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(cr, cr * 1.02, .22, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xE2B65E, metalness: 1, roughness: .28, side: THREE.DoubleSide }));
    base.position.y = .11; crown.add(base);
    const gem = new THREE.MeshPhysicalMaterial({ color: 0xF07FA2, roughness: .05, clearcoat: 1, metalness: .1, emissive: 0x5a1020, emissiveIntensity: .2 });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * 6.283, tall = i % 2 === 0;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(.09, tall ? .42 : .28, 12), gold);
      spike.position.set(Math.cos(a) * cr, .22 + (tall ? .21 : .14), Math.sin(a) * cr); crown.add(spike);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 10), M.pearl(0xFFF8EE)); tip.position.set(spike.position.x, .22 + (tall ? .44 : .3), spike.position.z); crown.add(tip);
      const g2 = new THREE.Mesh(new THREE.OctahedronGeometry(.07), gem); g2.position.set(Math.cos(a + .39) * cr * 1.03, .11, Math.sin(a + .39) * cr * 1.03); g2.scale.y = 1.4; crown.add(g2);
    }
    deco.add(crown);
  } else if (topper === 'candles') {
    const cols = [0xF4AFC0, 0xBFD6EE, 0xBFE5CC, 0xF2C96A, 0xDE8C9C];
    cols.forEach((c, i) => {
      const a = i / cols.length * 6.283 + .3, cr = rt * .55;
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .62, 12), M.clay(c, .45));
      candle.position.set(Math.cos(a) * cr, .31, Math.sin(a) * cr); deco.add(candle);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 10), new THREE.MeshBasicMaterial({ color: 0xFFC94D }));
      flame.scale.set(.8, 1.5, .8); flame.position.set(candle.position.x, .7, candle.position.z); flame.userData.flame = true; deco.add(flame);
    });
  }
  if (msg) {
    const pw = Math.min(2.6, rt * 2.7);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(pw, pw / 4), new THREE.MeshBasicMaterial({ map: messageTexture(msg), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    const lift = topper === 'crown' ? 1.05 : topper === 'candles' ? 1.1 : .62;
    plaque.position.set(0, lift, 0); plaque.userData.face = true; deco.add(plaque);
    [-1, 1].forEach((sx) => { const stick = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, lift, 6), gold); stick.position.set(sx * .3, lift / 2 - .1, 0); stick.userData.face = true; deco.add(stick); });
  }
  return { group: g, tiers: list, height: topY + (topper === 'crown' || topper === 'candles' || msg ? 1 : .3), deco };
}
export function cakeScene(canvas, { reduced, onDrag }) {
  const s = makeStage(canvas, 28);
  const holder = new THREE.Group(); s.scene.add(holder);
  let cake = null, born = 0, now = 0, target = { y: 1.2, d: 9 };
  const spin = { angle: -.4, vel: reduced ? 0 : .25, drag: false, lastX: 0, idleAt: 0 };
  const frame = () => {
    const hgt = cake ? cake.height : 2;
    target.y = hgt * .45;
    target.d = (6.6 + hgt * 2.1) / Math.min(1, Math.max(s.aspect, .6) * 1.12);
  };
  s.onResize = frame;
  const cam = { y: 1.2, d: 12 };
  canvas.addEventListener('pointerdown', (e) => { spin.drag = true; spin.lastX = e.clientX; canvas.setPointerCapture(e.pointerId); onDrag?.(); });
  canvas.addEventListener('pointermove', (e) => { if (!spin.drag) return; const dx = e.clientX - spin.lastX; spin.lastX = e.clientX; spin.angle += dx * .012; spin.vel = dx * .6; });
  const up = () => { spin.drag = false; spin.idleAt = now; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  s.update = (t, dt) => {
    now = t;
    if (!spin.drag) {
      const auto = reduced ? 0 : (t - spin.idleAt > 2.2 ? .28 : 0);
      spin.vel += (auto - spin.vel) * Math.min(1, dt * 2.5);
      spin.angle += spin.vel * dt;
    }
    holder.rotation.y = spin.angle;
    cam.y += (target.y - cam.y) * Math.min(1, dt * 3); cam.d += (target.d - cam.d) * Math.min(1, dt * 3);
    s.camera.position.set(0, cam.y + cam.d * .2, cam.d); s.camera.lookAt(0, cam.y - .1, 0);
    if (cake) {
      const age = reduced ? 9 : t - born;
      cake.tiers.forEach((tier, i) => {
        const k = backOut(clamp((age - i * .12) / .7));
        tier.position.y = tier.userData.y + (1 - k) * (1.6 + i * .5);
        tier.scale.setScalar(.9 + .1 * clamp(k));
      });
      const kd = backOut(clamp((age - cake.tiers.length * .12) / .6));
      cake.deco.scale.setScalar(Math.max(.001, kd));
      cake.deco.children.forEach((c) => {
        if (c.userData.flame) c.scale.y = 1.5 + Math.sin(t * 18 + c.position.x * 9) * .25;
        if (c.userData.face) { const x0 = c.userData.x0 ?? (c.userData.x0 = c.position.x); c.rotation.y = -spin.angle; c.position.x = Math.cos(-spin.angle) * x0; c.position.z = -Math.sin(-spin.angle) * x0; }
      });
    }
  };
  let key = '';
  return {
    set(opts) {
      const k = JSON.stringify(opts);
      if (k === key) return; key = k;
      if (cake) { holder.remove(cake.group); cake.group.traverse((o) => { o.geometry?.dispose?.(); }); }
      cake = buildCake(opts); holder.add(cake.group); born = now; frame();
    },
  };
}
