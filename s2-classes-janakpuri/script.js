(function () {
  "use strict";
  var NUM = "917303120430";
  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var KEYS = ["class", "subject", "help", "day"];
  var MISSING = { class: "Choose a class", subject: "Choose a subject", help: "Choose what you need help with", day: "Choose a day" };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = { class: "", subject: "", help: "", day: "" };
  var benchIdx = -1;

  var plan = document.getElementById("plan");
  var benches = [].slice.call(plan.querySelectorAll(".bench"));
  var tag = plan.querySelector(".tag");
  var tClass = plan.querySelector(".t-class");
  var tSubj = plan.querySelector(".t-subj");
  var preview = document.getElementById("preview");
  var send = document.getElementById("send");
  var rows = [].slice.call(document.querySelectorAll(".pills"));

  function enc(s) { return encodeURIComponent(s).replace(/'/g, "%27"); }
  function done() { return KEYS.every(function (k) { return state[k]; }); }
  function message(fill) {
    var subj = state.subject === "Both" ? "Maths and Science" : state.subject;
    var cl = state.class || "...", sb = subj || "...", hp = (state.help || "...").toLowerCase(), dy = state.day || "...";
    return "Hi Suresh Sir, I'd like a seat at S2 Classes. Class " + cl + ", " + sb + ". I need help with " + hp + ". Can I come on " + dy + "? Please tell me the timing.";
  }

  function draw() {
    tSubj.classList.remove("draw");
    void tSubj.getBoundingClientRect();
    if (reduce) { tSubj.style.strokeDashoffset = 0; tSubj.style.fill = "#1D3FBF"; }
    else tSubj.classList.add("draw");
  }

  function render(changed) {
    // pills
    rows.forEach(function (row) {
      var v = state[row.getAttribute("data-key")];
      [].forEach.call(row.children, function (b) { b.setAttribute("aria-pressed", String(b.textContent === v)); });
    });
    // tag
    if (state.class) { tClass.textContent = "Class " + state.class; tag.classList.add("on"); }
    if (state.subject) {
      tSubj.textContent = state.subject;
      if (changed === "subject") draw();
      else if (!tSubj.classList.contains("draw") && !reduce) draw();
      else if (reduce) { tSubj.style.strokeDashoffset = 0; tSubj.style.fill = "#1D3FBF"; }
    }
    // day -> bench
    if (state.day) {
      var di = DAYS.indexOf(state.day);
      if (benchIdx < 0 || benchIdx % 6 !== di) benchIdx = di;
      plan.classList.add("has-day");
    }
    benches.forEach(function (b, i) {
      b.classList.toggle("mine", i === benchIdx);
      var t = b.querySelector(".tick");
      if (i === benchIdx && state.help) {
        t.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' + state.help;
        t.hidden = false; void t.offsetWidth; t.classList.add("on");
      } else { t.classList.remove("on"); t.hidden = true; }
    });
    // preview + send
    var any = KEYS.some(function (k) { return state[k]; });
    preview.hidden = !any;
    if (any) preview.textContent = message();
    if (done()) {
      send.href = "https://wa.me/" + NUM + "?text=" + enc(message());
      send.setAttribute("aria-disabled", "false");
      send.textContent = "Send on WhatsApp";
    } else {
      send.setAttribute("aria-disabled", "true");
      send.textContent = MISSING[KEYS.filter(function (k) { return !state[k]; })[0]];
    }
  }

  rows.forEach(function (row) {
    row.addEventListener("click", function (e) {
      var b = e.target.closest(".pill");
      if (!b) return;
      var key = row.getAttribute("data-key");
      state[key] = b.textContent;
      render(key);
    });
  });
  benches.forEach(function (b, i) {
    b.addEventListener("click", function () {
      state.day = DAYS[i % 6];
      benchIdx = i;
      render("day");
    });
  });
  send.addEventListener("click", function (e) {
    if (send.getAttribute("aria-disabled") === "true") e.preventDefault();
  });

  // reveal on scroll
  var items = [].slice.call(document.querySelectorAll(".wow-head,.room,.controls,.q,.visit-grid > *"));
  items.forEach(function (el) { el.classList.add("rv"); });
  plan.classList.add("pre");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          if (en.target.classList.contains("room")) plan.classList.remove("pre");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
    plan.classList.remove("pre");
  }
  render();
})();
