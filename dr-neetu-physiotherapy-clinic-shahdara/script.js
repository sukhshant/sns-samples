(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Clinic hours, in Asia/Kolkata ---------- */
  (function hours() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
    var day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'));
    var hour = +get('hour');
    var open = day !== 6 && hour >= 8 && hour < 20;
    $('#openNow').textContent = open ? 'Open now until 8 PM' : 'Closed now, opens 8 AM';
    var row = $('#hours [data-day="' + day + '"]');
    if (row) row.classList.add('today');
  })();

  /* ---------- Menu: native dialog gives focus trap and Escape ---------- */
  var menu = $('#menu');
  $('#menuOpen').addEventListener('click', function () { menu.showModal(); });
  $('#menuClose').addEventListener('click', function () { menu.close(); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.close(); }); });

  /* ---------- Reveals: hidden state comes from JS so no-JS shows everything ---------- */
  var once = function (els, cb, opts) {
    if (!('IntersectionObserver' in window) || reduced) { els.forEach(cb); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); } });
    }, opts || { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };
  var pre = function (el) { el.classList.add('pre'); };
  var unpre = function (el) { el.classList.remove('pre'); };
  var rows = $$('.tr'), reveals = $$('[data-reveal]');
  if (!reduced) { rows.forEach(pre); reveals.forEach(pre); }
  once(rows, unpre);
  once(reveals, unpre);

  /* ---------- Studio data ---------- */
  var ASK = 'Can I come to the clinic, or is a home visit possible?';
  var WA = 'https://wa.me/918810546475?text=';
  var JOINTS = {
    neck: { name: 'neck', max: 90, sided: true, words: ['barely turns', 'turns a little', 'turns halfway to your shoulder', 'turns nearly to your shoulder', 'turns all the way'],
      treat: ['Cervical pain'], by: 'Drivesh Singh', quote: 'I visited her for neck pain and got significant relief in just one session.' },
    shoulder: { name: 'shoulder', max: 180, sided: true, words: ['stays close to your side', 'lifts below shoulder height', 'lifts to shoulder height', 'lifts above your shoulder', 'lifts right overhead'],
      treat: ['Frozen shoulder'], by: 'Mohd Usman', quote: "Thanks to doctor Neetu's physiotherapy treatment and guidance, I regained shoulder movement and experienced significant pain relief." },
    elbow: { name: 'elbow', max: 145, sided: true, words: ['barely bends', 'bends a little', 'bends halfway', 'bends most of the way', 'bends fully'],
      treat: ['Tennis elbow'], by: 'Raj Singh', quote: 'She is highly professional, caring, and explains every exercise and treatment clearly.' },
    back: { name: 'back', max: 100, sided: false, words: ['barely bends', 'bends a little', 'bends halfway', 'bends until your hands reach your knees', 'bends until your hands are near the floor'],
      treat: ['Back pain (disc problem)', 'Sciatica'], by: 'Khushi Yadav', quote: 'She carefully assessed my condition, explained the treatment plan clearly, and helped me recover from chronic back pain.' },
    knee: { name: 'knee', max: 130, sided: true, words: ['barely bends', 'bends a little', 'bends halfway', 'bends most of the way', 'bends fully'],
      treat: ['Knee pain (osteo arthritis)'], by: 'Khushi', quote: "Really gonna recommend to everyone who's dealing with body pain." }
  };
  // On the figure, marks sit on different sides so they do not crowd each other.
  var MARK_SIDE = { neck: 'R', shoulder: 'R', elbow: 'L', back: 'R', knee: 'R' };

  var ui = {
    sheet: $('#sheet'), line: $('#line'), range: $('#range'), send: $('#send'), sideBox: $('#sideBox'), reset: $('#reset'),
    treat: $('#treatBody'), treatList: $('#treatList'), treatQuote: $('#treatQuote'), treatBy: $('#treatBy'),
    handle: $('#handle'), note: $('#stopNote'), arcAll: $('#arcAll'), arcNow: $('#arcNow'), arcStop: $('#arcStop')
  };
  var state = { joint: null, side: 'R', moved: false, dragging: false, stopped: false };

  /** Sentence pieces: subject and movement, in "your" voice. */
  function phrase(joint, side, deg) {
    var j = JOINTS[joint];
    var band = Math.min(4, Math.floor(deg / j.max * 5));
    var w = j.words[band];
    var sideWord = side === 'R' ? 'right' : 'left';
    var subject = (joint === 'neck' || joint === 'back') ? 'your ' + j.name : 'your ' + sideWord + ' ' + j.name;
    if (joint === 'neck') {
      w = /your shoulder/.test(w) ? w.replace('your shoulder', 'your ' + sideWord + ' shoulder') : w + ' to the ' + sideWord;
    }
    return subject + ' ' + w;
  }
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var mine = function (s) { return s.replace(/\byour\b/g, 'my'); };

  function buildMessage(joint, side, deg, moved) {
    var hi = 'Namaste Dr. Neetu. I found your website';
    if (!joint) return hi + '. ' + ASK;
    var sub = joint === 'neck' || joint === 'back' ? 'my ' + joint : 'my ' + (side === 'R' ? 'right ' : 'left ') + joint;
    if (!moved) return hi + '. I have a problem with ' + sub + '. ' + ASK;
    var about = Math.round(deg / 5) * 5;
    return hi + ' and moved the wooden figure to show you: ' + mine(phrase(joint, side, deg)) + ' (about ' + about + ' degrees on the figure), then it stops. ' + ASK;
  }

  function refreshText() {
    var j = state.joint;
    var deg = j ? +ui.range.value : 0;
    ui.send.href = WA + encodeURIComponent(buildMessage(j, state.side, deg, state.moved));
    if (!j) { ui.line.textContent = 'Choose the joint that troubles you.'; return; }
    var sideWord = state.side === 'R' ? 'right' : 'left';
    if (!state.moved) {
      var named = JOINTS[j].sided && j !== 'neck' ? sideWord + ' ' + j : j;
      ui.line.textContent = 'Drag the wooden handle to where your ' + named + ' stops.' + (JOINTS[j].sided ? ' The figure is your mirror.' : '');
      return;
    }
    var text = cap(phrase(j, state.side, deg));
    ui.line.textContent = state.dragging ? text + '.' : text + ', then stops.';
    ui.range.setAttribute('aria-valuetext', text);
  }
  function setFill() {
    ui.range.style.setProperty('--fill', (ui.range.value / ui.range.max * 100) + '%');
  }

  /* ---------- Load the 3D libraries after first paint ---------- */
  function goFallback() {
    root.classList.remove('tool-on', 'live');
  }
  if (!root.classList.contains('tool-on')) return;

  function load(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
  }
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';
  function start() {
    load(CDN + 'three.js/r128/three.min.js')
      .then(function () { return load(CDN + 'gsap/3.12.5/gsap.min.js'); })
      .then(function () { return load(CDN + 'gsap/3.12.5/ScrollTrigger.min.js'); })
      .then(function () { try { boot(); } catch (e) { goFallback(); } }, goFallback);
  }
  if (document.readyState === 'complete') requestAnimationFrame(start);
  else window.addEventListener('load', function () { requestAnimationFrame(start); });

  /* Buttons work the moment they exist; the choice waits for the figure if needed. */
  var pendingJoint = null, selectJoint = function (j, side) { pendingJoint = [j, side]; };
  $$('.jbtn').forEach(function (b) { b.addEventListener('click', function () { selectJoint(b.dataset.joint, 'R', true); }); });
  $$('a.try').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      $('#studio').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      selectJoint(a.dataset.joint, 'R', true);
    });
  });

  /* ---------- The figure ---------- */
  function boot() {
    var T = window.THREE, W = 0, H = 0;
    var canvas = $('#gl'), scene3 = $('#scene'), overlay = $('#overlay');
    var phone = function () { return W < 900; };

    var renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    var cores = navigator.hardwareConcurrency || 8;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cores <= 4 ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .98;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    var scene = new T.Scene();
    var FOV = 26;
    var camera = new T.PerspectiveCamera(FOV, 1, 1, 200);
    var TAN = Math.tan(FOV * Math.PI / 360);

    /* --- Wood --- */
    function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

    /** Paints straight grain running along canvas Y, wrapping on both axes, bending round knots. */
    function paintWood(ctx, S, seed, base) {
      var r = rng(seed);
      ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
      // broad tonal bands: the slow changes that make wood not look printed
      for (var i = 0; i < 26; i++) {
        var x = r() * S, w = 24 + r() * 120;
        var g = ctx.createLinearGradient(x - w, 0, x + w, 0);
        var c = r() > .5 ? '246,214,120' : '186,136,44', a = .05 + r() * .13;
        g.addColorStop(0, 'rgba(' + c + ',0)'); g.addColorStop(.5, 'rgba(' + c + ',' + a + ')'); g.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = g; ctx.fillRect(x - w, 0, 2 * w, S);
        if (x - w < 0 || x + w > S) { ctx.save(); ctx.translate(x + w > S ? -S : S, 0); ctx.fillRect(x - w, 0, 2 * w, S); ctx.restore(); }
      }
      var knots = [];
      for (var k = 0; k < 3; k++) knots.push({ x: S * (.15 + r() * .7), y: S * (.12 + r() * .76), a: S * (.012 + r() * .014), b: S * (.03 + r() * .03) });
      var cols = ['201,154,58', '180,131,42', '143,100,32', '120,82,26', '245,216,130'];
      function stroke(x0, col, alpha, width, amp, cyc, ph) {
        ctx.strokeStyle = 'rgba(' + col + ',' + alpha + ')'; ctx.lineWidth = width;
        [-S, 0, S].forEach(function (off) {
          if (x0 + off < -60 || x0 + off > S + 60) return;
          ctx.beginPath();
          for (var y = 0; y <= S; y += 8) {
            var t = y / S, x = x0 + off + amp * Math.sin(t * Math.PI * 2 * cyc + ph) + amp * .4 * Math.sin(t * Math.PI * 2 * (cyc + 2) + ph * 2);
            knots.forEach(function (K) { var dx = x0 + off - K.x, dy = y - K.y, d = Math.exp(-(dx * dx / (K.a * K.a * 26) + dy * dy / (K.b * K.b * 8))); x += (dx >= 0 ? 1 : -1) * d * K.a * 2.6; });
            if (y) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          }
          ctx.stroke();
        });
      }
      for (var n = 0; n < 330; n++) {
        var col = cols[r() < .78 ? Math.floor(r() * 3) : Math.floor(r() * cols.length)];
        stroke(r() * S, col, .05 + r() * .2, .5 + r() * r() * 3.2, 2 + r() * 9, 1 + Math.floor(r() * 2), r() * 6.28);
      }
      // fine pores
      for (var p = 0; p < 2200; p++) {
        ctx.fillStyle = 'rgba(110,74,22,' + (.05 + r() * .16) + ')';
        ctx.fillRect(r() * S, r() * S, .8, 3 + r() * 14);
      }
      knots.forEach(function (K, idx) {
        if (idx === 2 && r() > .6) return;
        for (var q = 9; q > 0; q--) {
          ctx.strokeStyle = 'rgba(' + (q < 3 ? '84,54,18' : '130,90,30') + ',' + (.14 + .04 * (9 - q)) + ')'; ctx.lineWidth = q < 3 ? 2 : 1;
          ctx.beginPath(); ctx.ellipse(K.x, K.y, K.a * q / 7, K.b * q / 7, r() * .2, 0, 6.3); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(74,46,16,.75)'; ctx.beginPath(); ctx.ellipse(K.x, K.y, K.a * .22, K.b * .24, 0, 0, 6.3); ctx.fill();
      });
    }
    function canvasOf(S) { var c = document.createElement('canvas'); c.width = c.height = S; return c; }
    var woodCanvas = canvasOf(1024), wctx = woodCanvas.getContext('2d');
    paintWood(wctx, 1024, 4217, '#E3BE5A');
    // greyscale copy as the bump map
    var bumpCanvas = canvasOf(1024), bctx = bumpCanvas.getContext('2d');
    bctx.filter = 'grayscale(1) contrast(1.5)'; bctx.drawImage(woodCanvas, 0, 0); bctx.filter = 'none';
    var aniso = renderer.capabilities.getMaxAnisotropy();
    function tex(c, srgb) {
      var t = new T.CanvasTexture(c);
      t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = aniso;
      if (srgb) t.encoding = T.sRGBEncoding;
      return t;
    }
    var woodMap = tex(woodCanvas, true), bumpMap = tex(bumpCanvas, false);
    var woodMat = new T.MeshStandardMaterial({ map: woodMap, bumpMap: bumpMap, bumpScale: .018, roughness: .48, metalness: 0 });
    var jointMat = new T.MeshStandardMaterial({ map: woodMap, bumpMap: bumpMap, bumpScale: .012, roughness: .42, metalness: 0, color: 0xBC9A68 });
    var seamMat = new T.MeshStandardMaterial({ color: 0x4A3214, roughness: .8 });
    var steelMat = new T.MeshStandardMaterial({ color: 0x9AA39C, roughness: .32, metalness: .85 });

    /* --- Turned parts --- */
    var uvSeed = rng(991);
    /** Lathe from [radius, y] control points. Grain (texture Y) runs along the turned axis. */
    function lathe(pts, opts) {
      opts = opts || {};
      if (pts[0][1] > pts[pts.length - 1][1]) pts = pts.slice().reverse();
      var curve = new T.SplineCurve(pts.map(function (p) { return new T.Vector2(Math.max(p[0], 0.0001), p[1]); }));
      var line = curve.getPoints(opts.n || 44).map(function (p) { p.x = Math.max(p.x, 0); return p; });
      var geo = new T.LatheGeometry(line, opts.seg || 40);
      var uv = geo.attributes.uv, u0 = uvSeed(), v0 = uvSeed(), su = opts.su || .38, sv = opts.sv || .5;
      for (var i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * su, v0 + uv.getY(i) * sv);
      var m = new T.Mesh(geo, opts.mat || woodMat);
      m.castShadow = m.receiveShadow = true;
      if (opts.flat) m.scale.z = opts.flat;
      return m;
    }
    function ball(r, opts) {
      opts = opts || {};
      var geo = new T.SphereGeometry(r, 28, 20);
      var uv = geo.attributes.uv, u0 = uvSeed(), v0 = uvSeed();
      for (var i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * .25, v0 + uv.getY(i) * .25);
      var m = new T.Mesh(geo, opts.mat || jointMat);
      m.castShadow = m.receiveShadow = true;
      return m;
    }
    function group(parent, x, y, z) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }
    function anchor(parent, x, y, z) { return group(parent, x, y, z); }

    /* --- Rig. World units: one head = 1. Disc top at y=0. Figure faces +z.
       "Right" means the limb on the right of the screen (x > 0): the figure is a mirror. --- */
    var fig = group(scene);
    var pelvis = group(fig, 0, 4.25, 0);
    var pelvisMesh = lathe([[0, .42], [.3, .4], [.46, .24], [.61, -.02], [.59, -.2], [.36, -.33], [0, -.36]], { flat: .68 });
    pelvis.add(pelvisMesh);

    var waist = group(pelvis, 0, .42, 0);
    var waistBall = ball(.37); waistBall.scale.set(1, .84, .78); waist.add(waistBall);
    var chest = group(waist, 0, .2, 0);
    var chestMesh = lathe([[0, .02], [.34, .05], [.6, .34], [.78, .86], [.8, 1.18], [.62, 1.45], [.3, 1.56], [0, 1.58]], { flat: .68 });
    chest.add(chestMesh);

    var neck = group(chest, 0, 1.56, .02);
    neck.rotation.order = 'YXZ';
    var neckBall = ball(.16); neck.add(neckBall);
    var neckPeg = lathe([[0, .02], [.135, .04], [.125, .3], [.14, .42], [0, .44]], { mat: jointMat, n: 20 }); neck.add(neckPeg);
    var head = group(neck, 0, .9, .04);
    head.rotation.x = -.17;
    function eggR(t) { // t from -1 (chin) to 1 (crown)
      return .395 * Math.sqrt(Math.max(0, 1 - t * t)) * (1 + .17 * t);
    }
    var headPts = [];
    for (var hi = 0; hi <= 40; hi++) { var ht = -1 + hi / 20; headPts.push(new T.Vector2(eggR(ht), ht * .56)); }
    var headGeo = new T.LatheGeometry(headPts, 48);
    (function () { var uv = headGeo.attributes.uv; for (var i = 0; i < uv.count; i++) uv.setXY(i, .31 + uv.getX(i) * .42, .12 + uv.getY(i) * .4); })();
    var headMesh = new T.Mesh(headGeo, woodMat); headMesh.castShadow = headMesh.receiveShadow = true; head.add(headMesh);
    // A carved centre line: faceless, but you can see which way the head is turned.
    var lp = [];
    for (var li = 0; li <= 26; li++) { var lt = -.93 + li * (1.55 / 26); lp.push(new T.Vector3(0, lt * .56, eggR(lt) + .002)); }
    var lineMesh = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(lp), 40, .0085, 6, false), seamMat);
    head.add(lineMesh);

    function buildArm(sign) {
      var sh = group(chest, sign * 1.0, 1.26, 0);
      var shBall = ball(.27); sh.add(shBall);
      var upper = lathe([[0, -.15], [.15, -.18], [.21, -.44], [.195, -.86], [.135, -1.28], [.1, -1.36], [0, -1.38]], {}); sh.add(upper);
      var el = group(sh, 0, -1.5, 0);
      el.add(ball(.145));
      var fore = lathe([[0, -.1], [.1, -.13], [.165, -.36], [.14, -.8], [.085, -1.14], [.07, -1.2], [0, -1.22]], {}); el.add(fore);
      var wr = group(el, 0, -1.31, 0);
      wr.add(ball(.09));
      var hand = ball(1, { mat: woodMat }); hand.scale.set(.145, .36, .082); hand.position.y = -.42; wr.add(hand);
      return { sh: sh, el: el, wr: wr, tip: anchor(wr, 0, -.5, 0), upperEnd: anchor(el, 0, 0, 0), restZ: sign * .1 };
    }
    function buildLeg(sign) {
      var hip = group(pelvis, sign * .37, -.4, 0);
      hip.add(ball(.235));
      var thigh = lathe([[0, -.16], [.2, -.2], [.31, -.56], [.27, -1.12], [.18, -1.5], [.14, -1.55], [0, -1.57]], {}); hip.add(thigh);
      var knee = group(hip, 0, -1.72, 0);
      knee.add(ball(.205));
      var shin = lathe([[0, -.16], [.16, -.19], [.235, -.54], [.17, -1.14], [.105, -1.42], [.09, -1.48], [0, -1.5]], {}); knee.add(shin);
      var ankle = group(knee, 0, -1.63, 0);
      ankle.add(ball(.125));
      var foot = lathe([[0, -.04], [.14, 0], [.2, .3], [.21, .66], [.16, 1], [0, 1.1]], { n: 30 });
      foot.rotation.x = Math.PI / 2; foot.scale.z = .62; foot.position.set(0, -.3, -.3); ankle.add(foot);
      return { hip: hip, knee: knee, ankle: ankle, heel: anchor(ankle, 0, -.2, -.22) };
    }
    var R = { arm: buildArm(1), leg: buildLeg(1) }, L = { arm: buildArm(-1), leg: buildLeg(-1) };
    var sideOf = function (s) { return s === 'R' ? R : L; };
    var sgn = function (s) { return s === 'R' ? 1 : -1; };
    var anchors = {
      neck: anchor(neck, 0, .02, .05), lever: anchor(head, 0, -.1, 1.15), crown: anchor(head, 0, .62, 0),
      backPivot: anchor(waist, 0, .12, .36), chestTop: anchor(chest, 0, 1.62, 0)
    };

    /* --- Base with her flower strip --- */
    (function base() {
      var S = 1024, c = canvasOf(S), x = c.getContext('2d');
      paintWood(x, S, 77, '#DDB552');
      var r = rng(31), cx = S / 2, cy = S / 2;
      var dab = function (a, rad, col, w, h, alpha) {
        x.save(); x.translate(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); x.rotate(a + (r() - .5) * 1.5);
        x.globalAlpha = alpha; x.fillStyle = col;
        x.beginPath(); x.ellipse(0, 0, w, h, 0, 0, 6.3); x.fill(); x.restore();
      };
      var RIM = S * .492, IN = S * .395;
      for (var i = 0; i < 1500; i++) { var a = r() * 6.283, t = r(); dab(a, IN + t * t * (RIM - IN) * .2 + r() * (RIM - IN) * .8, ['#1B3A1E', '#14251A', '#28522A', '#101A12'][Math.floor(r() * 4)], 5 + r() * 10, 3 + r() * 6, .85); }
      for (var j = 0; j < 500; j++) dab(r() * 6.283, IN + r() * (RIM - IN), '#0F1612', 3 + r() * 6, 2 + r() * 3, .9);
      for (var k = 0; k < 520; k++) dab(r() * 6.283, IN + r() * (RIM - IN), ['#EFA0B5', '#F6C0CE', '#D97A92'][Math.floor(r() * 3)], 3 + r() * 5, 2 + r() * 3.2, .95);
      for (var m = 0; m < 240; m++) dab(r() * 6.283, IN + r() * (RIM - IN), ['#F2DA3A', '#E5C726', '#FFF08A'][Math.floor(r() * 3)], 2.4 + r() * 4, 1.6 + r() * 2.6, .95);
      // the tiny pine: painted on the disc, between the strip and the feet, facing the first view
      var pa = .5, px = cx + Math.cos(pa) * S * .41, py = cy + Math.sin(pa) * S * .41;
      x.save(); x.translate(px, py); x.rotate(pa + Math.PI / 2); x.scale(1.6, 3);
      x.fillStyle = '#10201A'; x.fillRect(-2, -4, 4, 68);
      for (var b = 0; b < 16; b++) { var w = 3.5 + b * 1.05 + (b % 2) * 2.2, yy = 58 - b * 4; x.fillStyle = b % 3 ? '#14342A' : '#0C2018'; x.beginPath(); x.moveTo(-w, yy - 8); x.quadraticCurveTo(0, yy - 11, w, yy - 8); x.lineTo(0, yy + 5); x.closePath(); x.fill(); }
      x.restore();

      var topGeo = new T.CircleGeometry(1.9, 96);
      var top = new T.Mesh(topGeo, new T.MeshStandardMaterial({ map: tex(c, true), roughness: .55, color: 0xD6D0C4 }));
      top.rotation.x = -Math.PI / 2; top.receiveShadow = true; top.castShadow = false; top.rotation.z = .2; top.position.y = .001;
      scene.add(top);
      var side = lathe([[1.9, 0], [1.97, -.03], [2.0, -.11], [1.97, -.21], [1.88, -.25], [0, -.25]], { su: 1.4, sv: .12, seg: 96, n: 18 });
      scene.add(side);
      var rod = new T.Mesh(new T.CylinderGeometry(.045, .045, 4.2, 14), steelMat);
      rod.position.set(0, 2.1, -.62); rod.castShadow = true; scene.add(rod);
      var arm = new T.Mesh(new T.CylinderGeometry(.04, .04, .5, 12), steelMat);
      arm.rotation.x = Math.PI / 2; arm.position.set(0, 4.15, -.4); arm.castShadow = true; scene.add(arm);
      var socket = new T.Mesh(new T.CylinderGeometry(.09, .12, .09, 18), steelMat);
      socket.position.set(0, .045, -.62); scene.add(socket);
    })();

    /* --- Light --- */
    scene.add(new T.HemisphereLight(0xFFE9C0, 0x1D4736, .5));
    var key = new T.DirectionalLight(0xFFE3B4, 1.25);
    key.position.set(-3, 14, 7); key.target.position.set(0, 3.2, 0); scene.add(key, key.target);
    key.castShadow = true;
    key.shadow.mapSize.set(cores <= 4 ? 1024 : 2048, cores <= 4 ? 1024 : 2048);
    key.shadow.radius = 5; key.shadow.bias = -.0006; key.shadow.normalBias = .025;
    var sc = key.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 9; sc.bottom = -6; sc.near = 1; sc.far = 34;
    var rim = new T.DirectionalLight(0xF5EEDC, .7); rim.position.set(5, 7, -9); scene.add(rim);
    var fill = new T.DirectionalLight(0xFFD98F, .22); fill.position.set(7, 2, 5); scene.add(fill);
    var ground = new T.Mesh(new T.PlaneGeometry(90, 90), new T.ShadowMaterial({ color: 0x000000, opacity: .36, toneMapped: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.25; ground.receiveShadow = true; scene.add(ground);

    /* --- Poses --- */
    var clamp01 = function (t) { return t < 0 ? 0 : t > 1 ? 1 : t; };
    var smooth = function (t) { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
    // a joint pushes past, then settles: small overshoot on the last stretch
    var settle = function (a, b, p) {
      var t = clamp01((p - a) / (b - a)); if (t === 1) return 1;
      var e = smooth(Math.pow(t, 1.25));
      return e + Math.sin(t * Math.PI) * .045 * t * t * (t > .6 ? 1 : .4);
    };
    var mix = function (a, b, t) { return a + (b - a) * t; };

    /** Sets every rotation from the scroll progress p (0 stooped, 1 upright) plus the chosen joint's value. */
    function pose(p, joint, side, deg, gate, breath) {
      var up = {
        pelvis: settle(0, .34, p), waist: settle(.1, .56, p), chest: settle(.26, .72, p),
        sh: settle(.42, .8, p), hand: settle(.46, .88, p), neck: settle(.62, 1, p), legs: settle(0, .5, p)
      };
      var bendP = mix(.1, 0, up.pelvis), bendW = mix(.32, 0, up.waist), bendC = mix(.4, 0, up.chest), bendN = mix(.4, 0, up.neck);
      var hipBack = -bendP - mix(.12, 0, up.legs);
      pelvis.rotation.set(bendP, 0, 0);
      waist.rotation.set(bendW, 0, 0);
      chest.rotation.set(bendC + (breath || 0), 0, 0);
      neck.rotation.set(bendN, 0, 0);
      var torso = bendP + bendW + bendC;
      // the hand that holds the lower back
      var rs = R.arm, ls = L.arm;
      var hold = 1 - up.hand;
      rs.sh.rotation.set(mix(-torso * .93, 0, up.sh) + hold * 1.44, 0, rs.restZ + hold * .3);
      rs.el.rotation.set(-.14 - hold * 1.71, 0, -hold * .55);
      ls.sh.rotation.set(mix(-torso * .84, 0, up.sh), 0, ls.restZ - (1 - up.sh) * .05);
      ls.el.rotation.set(-.14 - (1 - up.hand) * .34, 0, 0);
      rs.wr.rotation.set(-.05 + hold * .35, 0, 0); ls.wr.rotation.set(-.05, 0, 0);
      rs.sh.position.z = ls.sh.position.z = mix(.1, 0, up.sh);
      [R.leg, L.leg].forEach(function (l, i) {
        l.hip.rotation.set(hipBack, 0, (i ? -1 : 1) * .022);
        l.knee.rotation.set(mix(.26, 0, up.legs), 0, 0);
        l.ankle.rotation.set(mix(-.14, 0, up.legs) + bendP * 0, 0, (i ? 1 : -1) * .022);
      });
      fig.position.y = mix(-.05, 0, up.legs);

      if (!joint || !gate) return;
      var rad = deg * Math.PI / 180 * gate, s = sgn(side);
      if (joint === 'neck') neck.rotation.y = s * rad;
      if (joint === 'shoulder') {
        var a = sideOf(side).arm;
        a.sh.rotation.z = a.restZ + s * rad * (Math.PI - .1) / Math.PI;
      }
      if (joint === 'elbow') sideOf(side).arm.el.rotation.x = -.14 - rad * (2.53 - .14) / 2.53;
      if (joint === 'back') {
        var tot = rad;
        pelvis.rotation.x += tot * .3; waist.rotation.x += tot * .4; chest.rotation.x += tot * .3;
        neck.rotation.x -= tot * .22;
        R.leg.hip.rotation.x -= tot * .3; L.leg.hip.rotation.x -= tot * .3;
        R.arm.sh.rotation.x -= tot * .96; L.arm.sh.rotation.x -= tot * .96;
      }
      if (joint === 'knee') {
        var l = sideOf(side).leg;
        l.knee.rotation.x = rad; l.hip.rotation.x -= rad * .1; l.ankle.rotation.x = rad * .16;
      }
    }

    /* --- Camera --- */
    var v = new T.Vector3(), rt = new T.Vector3(), up = new T.Vector3(), fw = new T.Vector3();
    function applyCam(c) {
      var d = H / (2 * c.ppu * TAN);
      var ce = Math.cos(c.el);
      camera.position.set(c.tx + d * Math.sin(c.az) * ce, c.ty + d * Math.sin(c.el), c.tz + d * Math.cos(c.az) * ce);
      camera.near = Math.max(1, d - 30); camera.far = d + 60;
      camera.setViewOffset(W, H, W / 2 - c.sx, H / 2 - c.sy, W, H);
      camera.lookAt(c.tx, c.ty, c.tz);
      camera.updateMatrixWorld(true);
    }
    function mixCam(a, b, t) {
      var o = {};
      for (var k in a) o[k] = mix(a[k], b[k], t);
      return o;
    }
    function freeRect() {
      var st = $('#studio').getBoundingClientRect();
      var h = $('#studioHead').getBoundingClientRect();
      if (phone()) {
        var bar = 68;
        var top = h.bottom - st.top;
        return { x: 0, y: top, w: W, h: Math.max(160, H - bar - ui.sheet.offsetHeight - top) };
      }
      var sheetLeft = ui.sheet.getBoundingClientRect().left;
      var x = Math.max(h.right * .62, W * .24);
      return { x: x, y: 70, w: sheetLeft - x, h: H - 82 };
    }
    function crownY() { pose(reduced ? 1 : 0); scene.updateMatrixWorld(true); var y = wp(anchors.crown).y; syncPose(); return y; }
    var heroCam, uprightCam, free;
    function layout() {
      W = scene3.clientWidth; H = scene3.clientHeight;
      if (!W || !H) return;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      free = freeRect();
      var ppu;
      if (phone()) {
        ppu = Math.min(W, 480) * 62 / 390;
        var a = $('#heroFigure').getBoundingClientRect();
        var pageY = a.top + (window.scrollY || 0);
        heroCam = { tx: 0, ty: 4, tz: 0, az: .92, el: .08, ppu: ppu, sx: W / 2, sy: pageY + (crownY() - 4) * ppu + 14 };
      } else {
        ppu = H * .098;
        heroCam = { tx: 0, ty: 4, tz: 0, az: .92, el: .08, ppu: ppu, sx: W * .73, sy: H * .9 - 4 * ppu };
      }
      var pfit = Math.min((free.h - 12) / 8.75, (free.w - 40) / 4.6);
      uprightCam = { tx: 0, ty: 3.9, tz: 0, az: .2, el: .05, ppu: pfit, sx: free.x + free.w / 2, sy: free.y + free.h / 2 };
      if (state.joint) { resample(); glide.to = frameJoint(); glide.from = glide.to; glide.t = 1; }
      dirty = true;
    }
    var JOINT_VIEW = {
      neck: function (s) { return { az: s * .1, el: .4 }; },
      shoulder: function (s) { return { az: s * .14, el: .06 }; },
      elbow: function (s) { return { az: s * 1.32, el: .1 }; },
      back: function () { return { az: 1.42, el: .1 }; },
      knee: function (s) { return { az: s * 1.3, el: .08 }; }
    };
    /** Frames the whole path of the handle inside the free area, so no sheet can ever cover it. */
    function frameJoint() {
      var view = JOINT_VIEW[state.joint](sgn(state.side));
      var ce = Math.cos(view.el);
      fw.set(Math.sin(view.az) * ce, Math.sin(view.el), Math.cos(view.az) * ce);
      rt.crossVectors(new T.Vector3(0, 1, 0), fw).normalize();
      up.crossVectors(fw, rt).normalize();
      var xs = [], ys = [], zs = [];
      arc.frame.forEach(function (w) { xs.push(w.dot(rt)); ys.push(w.dot(up)); zs.push(w.dot(fw)); });
      var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
      var m = 46, cap = phone() ? 120 : 170;
      var ppu = Math.min(cap, (free.w - m * 2) / Math.max(x1 - x0, .1) * .94, (free.h - m * 2) / Math.max(y1 - y0, .1) * .94);
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (Math.min.apply(0, zs) + Math.max.apply(0, zs)) / 2;
      var t = new T.Vector3().addScaledVector(rt, cx).addScaledVector(up, cy).addScaledVector(fw, cz);
      return { tx: t.x, ty: t.y, tz: t.z, az: view.az, el: view.el, ppu: ppu, sx: free.x + free.w / 2, sy: free.y + free.h / 2 };
    }

    /* --- Handle path --- */
    var arc = { world: [], screen: [], frame: [], wob: [] };
    function endAnchor(j, s) {
      if (j === 'neck') return anchors.lever;
      if (j === 'shoulder') return sideOf(s).arm.wr;
      if (j === 'elbow') return sideOf(s).arm.tip;
      if (j === 'back') return anchors.crown;
      return sideOf(s).leg.heel;
    }
    function pivotAnchor(j, s) {
      if (j === 'neck') return anchors.neck;
      if (j === 'shoulder') return sideOf(s).arm.sh;
      if (j === 'elbow') return sideOf(s).arm.el;
      if (j === 'back') return anchors.backPivot;
      return sideOf(s).leg.knee;
    }
    function wp(o) { return o.getWorldPosition(new T.Vector3()); }
    function resample() {
      var j = state.joint, s = state.side, max = JOINTS[j].max, end = endAnchor(j, s), wr = rng(1234);
      arc.world = []; arc.wob = []; arc.frame = [];
      for (var d = 0; d <= max; d += 2) {
        pose(1, j, s, d, 1);
        scene.updateMatrixWorld(true);
        var w = wp(end); arc.world.push(w); arc.frame.push(w);
        arc.wob.push((wr() - .5) * 2.2);
        if (j === 'neck' && (d === 0 || d === max)) arc.frame.push(wp(anchors.crown), wp(neck));
        if (j === 'back' && (d === 0 || d === max)) arc.frame.push(wp(pelvis));
        if (j === 'elbow') arc.frame.push(wp(sideOf(s).arm.el));
        if (j === 'knee' && (d === 0)) arc.frame.push(wp(sideOf(s).leg.hip), wp(sideOf(s).leg.ankle));
        if (j === 'shoulder' && d === 0) arc.frame.push(wp(sideOf(s).arm.sh));
      }
      arc.screen = arc.world.map(function () { return { x: 0, y: 0 }; });
      syncPose();
      scene.updateMatrixWorld(true);
    }
    function project(w, o) {
      v.copy(w).project(camera);
      o.x = (v.x + 1) / 2 * W; o.y = (1 - v.y) / 2 * H;
      return o;
    }
    function pathFrom(pts) {
      if (!pts.length) return '';
      var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        d += 'Q' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
      }
      if (pts.length > 1) { var l = pts[pts.length - 1]; d += 'L' + l.x.toFixed(1) + ' ' + l.y.toFixed(1); }
      return d;
    }

    /* --- Live state --- */
    // S.p drives the body; S.c drives the camera. They only differ under reduced motion: upright at once, camera cuts.
    var S = { p: reduced ? 1 : 0, c: 0, deg: 0, target: 0, gate: 0 };
    var camP = function () { return reduced ? S.c : S.p; };
    var dirty = true, onScreen = true, last = performance.now(), lastIdle = 0, lastTick = 0;
    var glide = { from: null, to: null, t: 1 };
    var settleBack = null; // a joint easing back to rest after "Try another" or a switch

    function syncPose(breath) {
      pose(S.p, state.joint || (settleBack && settleBack.joint), state.joint ? state.side : (settleBack && settleBack.side), state.joint ? S.deg : (settleBack ? settleBack.deg : 0), state.joint ? S.gate : (settleBack ? 1 : 0), breath);
    }
    function ease(t) { // cubic-bezier(.22,1,.36,1) feel
      return 1 - Math.pow(1 - t, 3.4);
    }
    function currentCam() {
      var cp = camP();
      var travel = mixCam(heroCam, uprightCam, smooth(clamp01(cp * 1.02)));
      travel.az = mix(heroCam.az, uprightCam.az, smooth(clamp01((cp - .15) / .85)));
      var gate = smooth(clamp01((cp - .78) / .22));
      if (!glide.to || gate === 0) return travel;
      var g = mixCam(glide.from, glide.to, ease(glide.t));
      return mixCam(travel, g, gate);
    }

    var marks = {}, markAnch = {};
    $$('.mark').forEach(function (m) {
      var j = m.dataset.mark, s = MARK_SIDE[j];
      marks[j] = m;
      markAnch[j] = j === 'neck' ? anchors.neck : j === 'back' ? anchors.backPivot : j === 'shoulder' ? sideOf(s).arm.sh : j === 'elbow' ? sideOf(s).arm.el : sideOf(s).leg.knee;
      m.addEventListener('click', function () { select(j, s, true); });
    });

    var o2 = { x: 0, y: 0 }, handlePos = { x: 0, y: 0 };
    function updateOverlay() {
      var inStudio = camP() > .94;
      if (state.joint) {
        for (var k in marks) marks[k].classList.remove('on');
      } else {
        for (var kk in marks) {
          marks[kk].classList.toggle('on', inStudio);
          project(wp(markAnch[kk]), o2);
          marks[kk].style.transform = 'translate3d(' + o2.x.toFixed(1) + 'px,' + o2.y.toFixed(1) + 'px,0)';
        }
      }
      var showArc = !!state.joint && inStudio;
      ui.handle.classList.toggle('on', showArc);
      if (!showArc) {
        ui.arcAll.setAttribute('d', ''); ui.arcNow.setAttribute('d', ''); ui.arcStop.setAttribute('d', '');
        ui.note.classList.remove('on');
        return;
      }
      project(wp(endAnchor(state.joint, state.side)), handlePos);
      ui.handle.style.transform = 'translate3d(' + handlePos.x.toFixed(1) + 'px,' + handlePos.y.toFixed(1) + 'px,0)';
      var n = arc.world.length, upto = clamp01(S.deg / JOINTS[state.joint].max) * (n - 1);
      for (var i = 0; i < n; i++) project(arc.world[i], arc.screen[i]);
      ui.arcAll.setAttribute('d', pathFrom(arc.screen));
      var now = [];
      for (var q = 0; q <= Math.floor(upto); q++) {
        var a = arc.screen[Math.max(0, q - 1)], b = arc.screen[Math.min(n - 1, q + 1)], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, wo = arc.wob[q];
        now.push({ x: arc.screen[q].x - dy / len * wo, y: arc.screen[q].y + dx / len * wo });
      }
      now.push({ x: handlePos.x, y: handlePos.y });
      ui.arcNow.setAttribute('d', state.moved ? pathFrom(now) : '');
      var endI = Math.min(n - 1, Math.round(upto));
      var showStop = state.stopped && state.moved && !state.dragging;
      if (showStop) {
        var pa = arc.screen[Math.max(0, endI - 2)], pb = arc.screen[Math.min(n - 1, endI + 2)];
        var tx = pb.x - pa.x, ty = pb.y - pa.y, tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
        ui.arcStop.setAttribute('d', 'M' + (handlePos.x - nx * 40).toFixed(1) + ' ' + (handlePos.y - ny * 40).toFixed(1) + 'L' + (handlePos.x + nx * 40).toFixed(1) + ' ' + (handlePos.y + ny * 40).toFixed(1));
        // the note lands beside the stop, kept inside the free area
        var nw = ui.note.offsetWidth, nh = ui.note.offsetHeight;
        var c0 = project(wp(pivotAnchor(state.joint, state.side)), { x: 0, y: 0 });
        var ox = handlePos.x - c0.x, oy = handlePos.y - c0.y, ol = Math.hypot(ox, oy) || 1;
        var fx = handlePos.x + ox / ol * 46 + (ox < 0 ? -nw : 0), fy = handlePos.y + oy / ol * 46 - nh / 2;
        var pad = 8;
        fx = Math.min(free.x + free.w - nw - pad, Math.max(free.x + pad, fx));
        fy = Math.min(free.y + free.h - nh - pad, Math.max(free.y + pad, fy));
        // never on top of the handle
        if (Math.abs(fx + nw / 2 - handlePos.x) < nw / 2 + 32 && Math.abs(fy + nh / 2 - handlePos.y) < nh / 2 + 32) fy = handlePos.y > free.y + free.h / 2 ? handlePos.y - 40 - nh : handlePos.y + 40;
        ui.note.style.transform = 'translate3d(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px,0)';
        ui.note.classList.add('on');
      } else { ui.arcStop.setAttribute('d', ''); ui.note.classList.remove('on'); }
    }

    function tick(now) {
      requestAnimationFrame(tick);
      if (!onScreen) { last = now; return; }
      var dt = Math.min(now - last, 60); last = now;
      var k = 1 - Math.pow(.82, dt / 16.67); // the limb's weight: about .18 per frame at 60 fps
      if (Math.abs(S.target - S.deg) > .03) { S.deg += (S.target - S.deg) * k; dirty = true; }
      else if (S.deg !== S.target) { S.deg = S.target; dirty = true; }
      if (settleBack) {
        settleBack.deg += (0 - settleBack.deg) * k * .6; dirty = true;
        if (settleBack.deg < .2) settleBack = null;
      }
      if (glide.t < 1) { glide.t = reduced ? 1 : Math.min(1, glide.t + dt / 700); dirty = true; }
      var gt = state.joint ? 1 : 0;
      if (S.gate !== gt) { S.gate = gt; dirty = true; }
      var breath = 0;
      if (!reduced && S.p < .03 && !state.joint) {
        breath = Math.sin(now / 1100) * .011;
        if (now - lastIdle > 66) { dirty = true; lastIdle = now; }
      }
      if (!dirty) return;
      dirty = false;
      syncPose(breath);
      applyCam(currentCam());
      scene.updateMatrixWorld(true);
      renderer.render(scene, camera);
      updateOverlay();
    }

    /* --- Choosing, dragging, sending --- */
    function setDeg(deg, live) {
      var j = JOINTS[state.joint];
      deg = Math.max(0, Math.min(j.max, deg));
      var prev = S.target;
      S.target = deg;
      ui.range.value = Math.round(deg);
      setFill();
      if (deg !== prev || live) state.moved = state.moved || deg > 0;
      if (live && navigator.vibrate && Math.floor(prev / 15) !== Math.floor(deg / 15)) navigator.vibrate(6);
      refreshText();
      dirty = true;
    }
    function select(joint, side, fromUser) {
      if (state.joint && S.deg > .2 && (joint !== state.joint || side !== state.side)) settleBack = { joint: state.joint, side: state.side, deg: S.deg };
      state.joint = joint; state.side = side;
      state.moved = false; state.stopped = false; S.deg = 0; S.target = 0;
      var j = JOINTS[joint];
      ui.range.disabled = false; ui.range.max = j.max; ui.range.value = 0; setFill();
      ui.range.setAttribute('aria-label', 'How far your ' + joint + ' moves');
      ui.sideBox.hidden = !j.sided; ui.reset.hidden = false;
      $$('.jbtn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.joint === joint)); });
      $$('button', ui.sideBox).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.side === side)); });
      ui.treat.hidden = false;
      ui.treatList.textContent = j.treat.join(', ');
      ui.treatQuote.textContent = '"' + j.quote + '"';
      ui.treatBy.textContent = j.by + ', on Google Maps';
      free = freeRect();
      resample();
      glide.from = glide.to ? mixCam(glide.from, glide.to, ease(glide.t)) : uprightCam;
      glide.to = frameJoint();
      glide.t = reduced ? 1 : 0;
      refreshText();
      dirty = true;
      if (fromUser) {
        var top = $('#studio').getBoundingClientRect().top;
        if (Math.abs(top) > 3 && !phoneSheetVisible()) window.scrollBy({ top: top, behavior: reduced ? 'auto' : 'smooth' });
      }
    }
    // Scrolled a little inside the studio is fine; far away means bring the studio back.
    function phoneSheetVisible() { var t = $('#studio').getBoundingClientRect().top; return t < 0 && t > -80; }
    selectJoint = select;

    function reset() {
      if (state.joint && S.deg > .2) settleBack = { joint: state.joint, side: state.side, deg: S.deg };
      state.joint = null; state.moved = false; state.stopped = false; S.deg = 0; S.target = 0;
      ui.range.disabled = true; ui.range.value = 0; setFill();
      ui.sideBox.hidden = true; ui.reset.hidden = true; ui.treat.hidden = true;
      $$('.jbtn').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      glide.from = glide.to ? mixCam(glide.from, glide.to, ease(glide.t)) : uprightCam;
      glide.to = uprightCam; glide.t = reduced ? 1 : 0;
      free = freeRect();
      refreshText(); dirty = true;
    }
    ui.reset.addEventListener('click', reset);
    $$('button', ui.sideBox).forEach(function (b) {
      b.addEventListener('click', function () { if (state.joint && b.dataset.side !== state.side) select(state.joint, b.dataset.side); });
    });
    ui.range.addEventListener('input', function () {
      state.stopped = false;
      setDeg(+ui.range.value, true);
    });
    ui.range.addEventListener('change', function () { state.stopped = state.moved; refreshText(); dirty = true; });

    /* Dragging: follow the finger along the handle's own projected path.
       The small penalty on jumps keeps the limb from flipping across the path. */
    var grab = { x: 0, y: 0 }, curIdx = 0;
    ui.handle.addEventListener('pointerdown', function (e) {
      if (!state.joint) return;
      e.preventDefault();
      ui.handle.setPointerCapture(e.pointerId);
      state.dragging = true; state.stopped = false;
      ui.handle.classList.add('drag');
      grab.x = e.clientX - handlePos.x; grab.y = e.clientY - handlePos.y;
      curIdx = Math.round(S.target / 2);
      dirty = true;
    });
    ui.handle.addEventListener('pointermove', function (e) {
      if (!state.dragging) return;
      var rect = scene3.getBoundingClientRect();
      var px = e.clientX - grab.x - rect.left, py = e.clientY - grab.y - rect.top;
      var best = curIdx, bestC = Infinity;
      for (var i = 0; i < arc.screen.length; i++) {
        var s = arc.screen[i], dx = s.x - px, dy = s.y - py, c = dx * dx + dy * dy + 6 * (i - curIdx) * (i - curIdx);
        if (c < bestC) { bestC = c; best = i; }
      }
      curIdx = best;
      setDeg(best * 2, true);
    });
    function endDrag() {
      if (!state.dragging) return;
      state.dragging = false; state.stopped = state.moved;
      ui.handle.classList.remove('drag');
      refreshText(); dirty = true;
    }
    ui.handle.addEventListener('pointerup', endDrag);
    ui.handle.addEventListener('pointercancel', endDrag);

    /* --- Scroll: native scrolling, scrubbed --- */
    var G = window.gsap;
    G.registerPlugin(window.ScrollTrigger);
    G.ticker.lagSmoothing(0); // a slow phone must still reach the end of the stand-up on time
    window.ScrollTrigger.config({ ignoreMobileResize: true });
    layout();
    if (reduced) {
      new IntersectionObserver(function (es) { S.c = es[0].isIntersecting ? 1 : 0; dirty = true; }, { rootMargin: '-45% 0px -45% 0px' }).observe($('#studio'));
    } else {
      G.to(S, {
        p: 1, ease: 'none', onUpdate: function () { dirty = true; },
        scrollTrigger: { trigger: '#stage', start: 'top top', endTrigger: '#studio', end: 'top top', scrub: .7 }
      });
    }
    new ResizeObserver(function () { var a = W, b = H; layout(); if (a !== W || b !== H) window.ScrollTrigger.refresh(); }).observe(scene3);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); window.ScrollTrigger.refresh(); });
    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) dirty = true; }).observe(scene3);

    syncPose();
    applyCam(currentCam());
    scene.updateMatrixWorld(true);
    renderer.render(scene, camera);
    requestAnimationFrame(function (t) { last = t; root.classList.add('live'); tick(t); });
    if (pendingJoint) select(pendingJoint[0], pendingJoint[1]);

    // small test hook, also used to paint the still images
    window.__figure = {
      state: state, S: S, select: select,
      handle: function () { return { x: handlePos.x, y: handlePos.y }; },
      arcAt: function (t) { var s = arc.screen[Math.round(t * (arc.screen.length - 1))]; return { x: s.x, y: s.y }; },
      arcExtent: function () { var xs = arc.screen.map(function (s) { return Math.round(s.x); }), ys = arc.screen.map(function (s) { return Math.round(s.y); }); return { minX: Math.min.apply(0, xs), maxX: Math.max.apply(0, xs), minY: Math.min.apply(0, ys), maxY: Math.max.apply(0, ys) }; },
      still: function (p, w, h, ppu, opt) {
        opt = opt || {};
        var pw = W, ph = H, pr = renderer.getPixelRatio();
        W = w; H = h; renderer.setPixelRatio(1); renderer.setSize(w, h, false); camera.aspect = w / h;
        pose(p); applyCam({ tx: 0, ty: 4, tz: 0, az: opt.az === undefined ? .92 : opt.az, el: .08, ppu: ppu, sx: w / 2, sy: h * .52 });
        scene.updateMatrixWorld(true); renderer.render(scene, camera);
        var url = canvas.toDataURL('image/png');
        W = pw; H = ph; renderer.setPixelRatio(pr); renderer.setSize(W, H, false); camera.aspect = W / H; dirty = true;
        return url;
      }
    };
  }
})();
