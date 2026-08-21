/* ============================================================
   THE EMERALD YEARS — behaviour
   ------------------------------------------------------------
   Same discipline as the rest of the suite:
     · scroll handler is passive + rAF-throttled and only writes
       CSS custom properties (compositor-only, no layout)
     · positions are measured once and cached, re-read on resize
     · reveals use IntersectionObserver, never scroll maths
     · the confetti loop halts the instant it has nothing to draw
   ============================================================ */
(function () {
  "use strict";

  var W = window, D = document;
  var reduced = W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveals ---------- */
  var fades = [].slice.call(D.querySelectorAll("[data-fade]"));
  fades.forEach(function (el) {
    var d = el.getAttribute("data-d");
    if (d) el.style.setProperty("--d", d);
  });

  if ("IntersectionObserver" in W && !reduced) {
    var fo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        setTimeout(function () { e.target.classList.add("settled"); }, 1700);
        fo.unobserve(e.target);
      });
    }, { threshold: .2, rootMargin: "0px 0px -8% 0px" });
    fades.forEach(function (el) { fo.observe(el); });
  } else {
    fades.forEach(function (el) { el.classList.add("in", "settled"); });
  }

  /* ---------- crest ring draws itself ---------- */
  var crest = D.getElementById("crest");
  var ring  = D.getElementById("ringDraw");
  if (crest && ring) {
    try {
      var len = ring.getTotalLength();
      ring.style.setProperty("--len", len);
    } catch (e) {}
    if (reduced) { crest.classList.add("drawn"); }
    else if ("IntersectionObserver" in W) {
      var ro = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { crest.classList.add("drawn"); ro.disconnect(); }
        });
      }, { threshold: .4 });
      ro.observe(crest);
    } else { crest.classList.add("drawn"); }
  }

  /* ---------- timeline spine grows as it enters ---------- */
  var tl = D.getElementById("timeline");
  if (tl) {
    if (reduced) { tl.style.setProperty("--tl", 1); }
    else if ("IntersectionObserver" in W) {
      var to = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { tl.style.setProperty("--tl", 1); to.disconnect(); }
        });
      }, { threshold: .15 });
      to.observe(tl);
    } else { tl.style.setProperty("--tl", 1); }

    // light each dot as its year arrives
    var years = [].slice.call(tl.querySelectorAll("[data-year]"));
    if ("IntersectionObserver" in W && !reduced) {
      var yo = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); yo.unobserve(e.target); }
        });
      }, { threshold: .5 });
      years.forEach(function (y) { yo.observe(y); });
    } else {
      years.forEach(function (y) { y.classList.add("in"); });
    }
  }

  /* ---------- the toast: glasses clink when centred ---------- */
  var glassWrap = D.getElementById("glassWrap");
  var clinked = false;
  if (glassWrap && "IntersectionObserver" in W) {
    var go = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > .6 && !clinked) {
          clinked = true;
          glassWrap.classList.add("clink");
          setTimeout(function () {
            burst(glassWrap.getBoundingClientRect(), 90);
          }, 620);
        }
      });
    }, { threshold: [0, .6, 1] });
    go.observe(glassWrap);
  }

  /* ---------- progress bar (compositor-only writes) ---------- */
  var bar = D.getElementById("progBar");
  var docH = 1, ticking = false;

  function measure() {
    docH = Math.max(1, D.documentElement.scrollHeight - W.innerHeight);
  }
  function apply() {
    ticking = false;
    var p = W.scrollY / docH;
    if (p < 0) p = 0; else if (p > 1) p = 1;
    if (bar) bar.style.setProperty("--p", p.toFixed(4));
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  }
  measure(); apply();
  W.addEventListener("scroll", onScroll, { passive: true });

  var rt;
  W.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { measure(); apply(); }, 150);
  }, { passive: true });

  /* ---------- counters ---------- */
  [].slice.call(D.querySelectorAll("[data-count]")).forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (reduced) { el.textContent = target.toLocaleString(); return; }
    var started = false;
    function run() {
      if (started) return;
      started = true;
      var t0 = performance.now(), dur = 1700, done = false;
      function draw(now) {
        var q = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - q, 4))).toLocaleString();
        if (q >= 1) done = true;
        return done;
      }
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

  /* ---------- brass confetti ---------- */
  var canvas = D.getElementById("fx");
  var ctx = canvas ? canvas.getContext("2d", { alpha: true, desynchronized: true }) : null;
  var DPR = Math.min(W.devicePixelRatio || 1, 1.5);
  var parts = [], raf = 0;
  var COL = ["#f0d79a", "#d8b163", "#a07c33", "#e8b7a0", "#ffffff", "#7fd4bb"];

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
    if (!parts.length) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += .15; p.vx *= .992;
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
    var cy = rect ? rect.top + rect.height / 2 : W.innerHeight * .4;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, s = 2 + Math.random() * 8.5;
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3.5,
        w: 3 + Math.random() * 6, h: 5 + Math.random() * 9,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .3,
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

  var btn = D.getElementById("celebrate");
  if (btn) {
    btn.addEventListener("click", function () {
      burst(btn.getBoundingClientRect(), 170);
      setTimeout(function () { burst(null, 120); }, 260);
    });
  }
})();
