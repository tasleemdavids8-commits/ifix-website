/* ============================================================
   GOLDEN HOUR — behaviour
   ------------------------------------------------------------
   Everything here is built around one rule: never make the
   browser do layout work while the user is scrolling.

     · the scroll listener is passive and rAF-throttled, and only
       ever writes CSS custom properties (compositor-only)
     · element positions are read once and cached, re-measured
       only on resize — never inside the scroll handler
     · fades use IntersectionObserver, not scroll maths
     · the confetti canvas stops its loop the moment it's idle
   ============================================================ */
(function () {
  "use strict";

  var W = window, D = document;
  var reduced = W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- fade panels in ---------- */
  var fades = [].slice.call(D.querySelectorAll("[data-fade]"));
  fades.forEach(function (el) {
    var d = el.getAttribute("data-d");
    if (d) el.style.setProperty("--d", d);
  });

  if ("IntersectionObserver" in W && !reduced) {
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        setTimeout(function () { e.target.classList.add("settled"); }, 1600);
        fo.unobserve(e.target);
      });
    }, { threshold: .2, rootMargin: "0px 0px -8% 0px" });
    fades.forEach(function (el) { fo.observe(el); });
  } else {
    fades.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- sky: cross-fade layers as sections pass ---------- */
  var layers = [].slice.call(D.querySelectorAll(".layer"));
  var current = 0;
  function setSky(i) {
    if (i === current) return;
    current = i;
    layers.forEach(function (l, k) { l.style.opacity = (k === i) ? "1" : "0"; });
  }

  if ("IntersectionObserver" in W) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = parseInt(e.target.getAttribute("data-sky-trigger"), 10);
        if (!isNaN(i)) setSky(i);
      });
    }, { threshold: .45 });
    [].slice.call(D.querySelectorAll("[data-sky-trigger]"))
      .forEach(function (s) { so.observe(s); });
  }

  /* ---------- scroll-driven sun + stars + progress ----------
     Only custom properties are written here, which the compositor
     can apply without any layout or paint of the document.       */
  var sun   = D.getElementById("sun");
  var stars = D.getElementById("stars");
  var bar   = D.getElementById("progBar");
  var docH  = 1, ticking = false;

  function measure() {
    docH = Math.max(1, D.documentElement.scrollHeight - W.innerHeight);
  }

  function apply() {
    ticking = false;
    var p = W.scrollY / docH;
    if (p < 0) p = 0; else if (p > 1) p = 1;

    if (bar) bar.style.setProperty("--p", p.toFixed(4));

    // sun arcs up through the golden hour, then sets
    // rises 0 -> .55, sets .55 -> 1
    var rise = p < .55 ? (p / .55) : 1 - ((p - .55) / .45);
    if (rise < 0) rise = 0;
    if (sun) {
      sun.style.setProperty("--sunY", rise.toFixed(3));
      sun.style.setProperty("--sunS", (0.85 + rise * 0.30).toFixed(3));
      sun.style.setProperty("--sunO", (0.35 + rise * 0.60).toFixed(3));
    }
    if (stars) {
      var s = p < .62 ? 0 : (p - .62) / .38;
      stars.style.setProperty("--starO", (s > 1 ? 1 : s).toFixed(3));
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  }

  measure();
  apply();
  W.addEventListener("scroll", onScroll, { passive: true });

  var rt;
  W.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { measure(); apply(); }, 150);
  }, { passive: true });

  /* ---------- candle blows out near the end of the sticky panel ---------- */
  var wrap = D.getElementById("candleWrap");
  var blown = false;
  if (wrap && "IntersectionObserver" in W) {
    var tall = wrap.closest(".tall");
    if (tall) {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          // when the tall section has mostly scrolled past, put it out
          if (!e.isIntersecting && e.boundingClientRect.top < 0 && !blown) {
            blown = true;
            wrap.classList.add("out");
            burst(wrap.getBoundingClientRect());
          }
        });
      }, { threshold: 0 });
      co.observe(tall);
    }
  }

  /* ---------- confetti ---------- */
  var canvas = D.getElementById("fx");
  var ctx = canvas ? canvas.getContext("2d", { alpha: true, desynchronized: true }) : null;
  var DPR = Math.min(W.devicePixelRatio || 1, 1.5);
  var parts = [], raf = 0;
  var COL = ["#ffc46b", "#ff8f5e", "#ff7fa5", "#ffe9c6", "#ffffff", "#c9a6ff"];

  function sizeCanvas() {
    if (!canvas) return;
    canvas.width  = Math.round(W.innerWidth  * DPR);
    canvas.height = Math.round(W.innerHeight * DPR);
    canvas.style.width  = W.innerWidth  + "px";
    canvas.style.height = W.innerHeight + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  if (canvas) { sizeCanvas(); W.addEventListener("resize", sizeCanvas, { passive: true }); }

  function loop() {
    ctx.clearRect(0, 0, W.innerWidth, W.innerHeight);
    if (!parts.length) { raf = 0; return; }      // stop dead when idle
    raf = requestAnimationFrame(loop);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += 0.16;
      p.vx *= 0.992;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.age++;
      var f = 1 - p.age / p.life;
      if (f <= 0 || p.y > W.innerHeight + 60) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = f;
      ctx.fillStyle = p.c;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (.45 + Math.abs(Math.cos(p.rot)) * .55));
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function burst(rect, n) {
    if (reduced || !ctx) return;
    var cores = navigator.hardwareConcurrency || 4;
    var cap = cores <= 4 ? 90 : 170;
    n = Math.min(n || 110, cap);
    var cx = rect ? rect.left + rect.width / 2 : W.innerWidth / 2;
    var cy = rect ? rect.top  + rect.height / 2 : W.innerHeight * .42;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, s = 2 + Math.random() * 9;
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4,
        w: 4 + Math.random() * 7, h: 6 + Math.random() * 10,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .32,
        c: COL[(Math.random() * COL.length) | 0],
        life: 130 + Math.random() * 90, age: 0
      });
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  D.addEventListener("visibilitychange", function () {
    if (D.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (!D.hidden && parts.length && !raf) raf = requestAnimationFrame(loop);
  });

  /* ---------- counters ---------- */
  [].slice.call(D.querySelectorAll("[data-count]")).forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (reduced) { el.textContent = target.toLocaleString(); return; }
    var started = false;
    function run() {
      if (started) return;
      started = true;
      var t0 = performance.now(), dur = 1600, done = false;
      function draw(now) {
        var q = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - q, 4);
        el.textContent = Math.round(target * e).toLocaleString();
        if (q >= 1) done = true;
        return done;
      }
      // interval guarantees the final value even if rAF is throttled
      var iv = setInterval(function () {
        if (draw(performance.now())) clearInterval(iv);
      }, 100);
      (function step(now) {
        if (done) return;
        if (draw(now)) { clearInterval(iv); return; }
        requestAnimationFrame(step);
      })(t0);
    }
    if ("IntersectionObserver" in W) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { run(); io.disconnect(); } });
      }, { threshold: .5 });
      io.observe(el);
    } else { run(); }
  });

  /* ---------- celebrate button ---------- */
  var btn = D.getElementById("celebrate");
  if (btn) {
    btn.addEventListener("click", function () {
      burst(btn.getBoundingClientRect(), 170);
      setTimeout(function () { burst(null, 130); }, 240);
    });
  }
})();
