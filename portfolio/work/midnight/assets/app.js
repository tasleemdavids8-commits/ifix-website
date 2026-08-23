/* ============================================================
   MIDNIGHT & GOLD — shared engine
   preloader · ambient dust · entrance choreography ·
   silky page transitions · state · confetti · audio
   ============================================================ */
(function () {
  "use strict";

  var W = window, D = document;
  var reduced = W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- state (survives navigation) ---------------- */
  var KEY = "mg_birthday_v1";
  var State = {
    read: function () {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
    },
    get: function (k, dflt) {
      var v = State.read()[k];
      return (v === undefined || v === null) ? dflt : v;
    },
    set: function (k, v) {
      var s = State.read(); s[k] = v;
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
      return v;
    },
    name: function () {
      var n = State.get("name", "");
      return (typeof n === "string") ? n.trim().slice(0, 28) : "";
    }
  };

  /* ============================================================
     0. QUALITY GOVERNOR
        Measures real frame times and downgrades effect density if the
        device can't keep up. Guessing from core count alone is unreliable
        — a throttled laptop and a fast phone look identical to feature
        detection, so we watch actual performance instead.
     ============================================================ */
  var Perf = (function () {
    var cores = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 4;
    var small = Math.min(W.screen.width, W.screen.height) < 800;
    // starting guess
    var tier = (cores <= 4 || mem <= 4 || small) ? "low" : (cores <= 8 ? "mid" : "high");
    var slowFrames = 0, watching = false;

    function scale() { return tier === "low" ? .45 : tier === "mid" ? .72 : 1; }

    // Watch the first few seconds of real animation; if we're consistently
    // missing frames, drop a tier and stay there.
    function watch() {
      if (watching || reduced) return;
      watching = true;
      var last = performance.now(), checked = 0;
      function tick(t) {
        var dt = t - last; last = t;
        if (dt > 34) slowFrames++;          // slower than ~30fps
        if (++checked < 150) requestAnimationFrame(tick);
        else if (slowFrames > 38 && tier !== "low") {
          tier = (tier === "high") ? "mid" : "low";
          D.documentElement.setAttribute("data-perf", tier);
        }
      }
      requestAnimationFrame(tick);
    }

    D.documentElement.setAttribute("data-perf", tier);
    return {
      get tier() { return tier; },
      scale: scale,
      get low() { return tier === "low"; },
      watch: watch
    };
  })();

  /* ---------------- tiny helpers ---------------- */
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ============================================================
     1. PRELOADER — waits for fonts + images, never hangs
     ============================================================ */
  function preload() {
    var el = $("#loader");
    if (!el) { boot(); return; }
    var bar = $("#loader .loader-bar i");
    var pct = 0, done = false;

    function paint(p) {
      pct = Math.max(pct, p);
      if (bar) bar.style.right = (100 - clamp(pct, 0, 100)) + "%";
    }

    // steady creep so it always feels alive
    var creep = setInterval(function () { paint(pct + rand(4, 13)); if (pct > 88) clearInterval(creep); }, 130);

    function finish() {
      if (done) return;
      done = true;
      clearInterval(creep);
      paint(100);
      setTimeout(function () {
        el.classList.add("done");
        boot();
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
      }, 260);
    }

    var waits = [];
    if (D.fonts && D.fonts.ready) waits.push(D.fonts.ready);
    waits.push(new Promise(function (res) {
      if (D.readyState === "complete") res();
      else W.addEventListener("load", res, { once: true });
    }));

    Promise.all(waits.map(function (p) { return Promise.resolve(p).catch(function () {}); })).then(finish);
    setTimeout(finish, 2600); // hard ceiling — never trap the user
  }

  /* ============================================================
     2. ENTRANCE CHOREOGRAPHY — staggered, buttery
     ============================================================ */
  function splitWords(node) {
    if (!node || node.dataset.split === "1") return;
    node.dataset.split = "1";
    var parts = node.textContent.split(/(\s+)/);
    node.textContent = "";
    parts.forEach(function (p) {
      if (/^\s+$/.test(p)) { node.appendChild(D.createTextNode(" ")); return; }
      var w = D.createElement("span"); w.className = "word";
      var i = D.createElement("i"); i.textContent = p;
      w.appendChild(i); node.appendChild(w);
    });
  }

  function boot() {
    D.body.classList.remove("boot");
    // Let CSS own the opacity from here (reveal.html fades #show in via a class,
    // so an inline value would win and kill the transition).
    var main = $(".page-main");
    if (main) main.style.removeProperty("opacity");

    // word-split any headline that asks for it
    $$("[data-words]").forEach(function (n) {
      splitWords(n);
      var kids = $$(".word > i", n);
      kids.forEach(function (k, i) {
        k.style.transitionDelay = (i * 68) + "ms";
      });
      // once every word has finished sliding, drop the overflow mask so
      // descenders and the gradient fill render cleanly
      var settle = (parseInt(n.getAttribute("data-delay") || "0", 10) || 0)
                 + kids.length * 68 + 1200;
      setTimeout(function () { n.classList.add("words-settled"); }, reduced ? 0 : settle);
    });

    // stagger every [data-anim] in document order
    var items = $$("[data-anim]");
    items.forEach(function (el, i) {
      var d = parseInt(el.getAttribute("data-delay") || "", 10);
      var delay = isNaN(d) ? (110 + i * 105) : d;
      setTimeout(function () {
        el.classList.add("in");
        if (el.hasAttribute("data-words")) el.classList.add("reveal-on");
        // Hand the layer back to the browser once the entrance is done —
        // leaving will-change on permanently pins memory and slows compositing.
        setTimeout(function () { el.classList.add("settled"); }, 1300);
      }, reduced ? 0 : delay);
    });

    // anything below the fold reveals on scroll
    if ("IntersectionObserver" in W) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: .18, rootMargin: "0px 0px -8% 0px" });
      $$("[data-anim-scroll]").forEach(function (el) { io.observe(el); });
    } else {
      $$("[data-anim-scroll]").forEach(function (el) { el.classList.add("in"); });
    }

    Perf.watch();
    D.dispatchEvent(new CustomEvent("mg:ready"));
  }

  /* ============================================================
     3. SILKY PAGE TRANSITIONS
        native View Transitions where supported, curtain elsewhere
     ============================================================ */
  function transitions() {
    var curtain = D.createElement("div");
    curtain.id = "curtain";
    D.body.appendChild(curtain);

    // fade the curtain out on arrival (fallback browsers)
    requestAnimationFrame(function () { curtain.classList.remove("up"); });

    // Precise detect: pageswap/pagereveal shipped alongside *cross-document*
    // view transitions, so this is the honest test (not just startViewTransition,
    // which also exists in browsers that only do same-document transitions).
    var nativeVT = ("onpageswap" in W) && ("startViewTransition" in D);

    // A cross-document view transition legitimately "skips" if the user
    // navigates again mid-animation, or the tab is hidden. Chrome surfaces
    // that as an unhandled rejection; it is harmless, so swallow just that one.
    W.addEventListener("unhandledrejection", function (e) {
      var m = e.reason && (e.reason.message || e.reason);
      if (String(m).indexOf("Transition was skipped") > -1) e.preventDefault();
    });

    // Belt and braces: if a transition is interrupted the incoming document
    // must still be fully visible.
    W.addEventListener("pagereveal", function (ev) {
      if (ev.viewTransition && ev.viewTransition.finished) {
        ev.viewTransition.finished.catch(function () {});
      }
    });

    // Prefetch the next page so the click feels instant
    function prefetch(href) {
      if (!href || prefetch.done[href]) return;
      prefetch.done[href] = 1;
      var l = D.createElement("link");
      l.rel = "prefetch"; l.href = href; l.as = "document";
      D.head.appendChild(l);
    }
    prefetch.done = {};

    $$("a[data-nav]").forEach(function (a) {
      var href = a.getAttribute("href");
      prefetch(href);
      ["mouseenter", "touchstart", "focus"].forEach(function (ev) {
        a.addEventListener(ev, function () { prefetch(href); }, { passive: true });
      });
    });

    // Intercept navigation for a controlled exit
    D.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-nav]");
      if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;

      // Browsers with true cross-document view transitions handle it natively
      if (nativeVT) return;

      e.preventDefault();
      if (reduced) { W.location.href = href; return; }

      var main = $(".page-main");
      if (main) {
        main.style.transition = "opacity .34s var(--ease-soft), transform .44s var(--ease-soft), filter .34s";
        main.style.opacity = "0";
        main.style.transform = "translateY(-14px) scale(.99)";
        main.style.filter = "blur(6px)";
      }
      curtain.classList.add("up");
      setTimeout(function () { W.location.href = href; }, 400);
    });

    // Restore cleanly when the user hits Back (bfcache)
    W.addEventListener("pageshow", function (ev) {
      if (ev.persisted) {
        curtain.classList.remove("up");
        var main = $(".page-main");
        if (main) { main.style.opacity = "1"; main.style.transform = ""; main.style.filter = ""; }
      }
    });
  }

  /* ============================================================
     4. AMBIENT DUST — slow golden motes, GPU-light
     ============================================================ */
  function dust() {
    var c = $("#dust");
    if (!c || reduced) return;
    var ctx = c.getContext("2d", { alpha: true, desynchronized: true });
    // Ambient background sparkle does not need retina precision.
    var DPR = Math.min(W.devicePixelRatio || 1, 1.25);
    var motes = [], w = 0, h = 0, raf = 0, visible = true;

    var lowPower = Perf.low;

    // One baked glow sprite for every mote, instead of shadowBlur per mote.
    var SP = (function () {
      var s = 24, cv = D.createElement("canvas");
      cv.width = cv.height = s;
      var g = cv.getContext("2d");
      var rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      rg.addColorStop(0, "rgba(246,231,189,1)");
      rg.addColorStop(.3, "rgba(220,184,98,.85)");
      rg.addColorStop(1, "rgba(220,184,98,0)");
      g.fillStyle = rg;
      g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, 6.283); g.fill();
      return cv;
    })();

    function size() {
      w = W.innerWidth; h = W.innerHeight;
      c.width = (w * DPR) | 0; c.height = (h * DPR) | 0;
      c.style.width = w + "px"; c.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // roughly half the previous density, and fewer again on modest hardware
      var n = clamp(Math.round(w * h / 52000), 12, lowPower ? 22 : 40);
      motes = [];
      for (var i = 0; i < n; i++) {
        motes.push({
          x: Math.random() * w, y: Math.random() * h,
          r: rand(.5, 1.9), a: rand(.10, .52),
          vx: rand(-.10, .10), vy: rand(-.24, -.05),
          tw: rand(0, 6.28), ts: rand(.008, .026)
        });
      }
    }

    // Ambient drift is slow — 30fps is indistinguishable here and halves the
    // per-frame cost, leaving the main thread free for the real animations.
    var interval = 1000 / 30, prev = 0;

    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      if (t - prev < interval) return;
      prev = t;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx; m.y += m.vy; m.tw += m.ts;
        if (m.y < -12) { m.y = h + 10; m.x = Math.random() * w; }
        if (m.x < -12) m.x = w + 10; else if (m.x > w + 12) m.x = -10;
        ctx.globalAlpha = m.a * (0.45 + Math.abs(Math.sin(m.tw)) * 0.55);
        var d = m.r * 7;
        ctx.drawImage(SP, m.x - d / 2, m.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    }

    size();
    W.addEventListener("resize", size, { passive: true });
    D.addEventListener("visibilitychange", function () {
      visible = !D.hidden;
      if (visible) prev = 0;
    });
    raf = requestAnimationFrame(frame);
  }

  /* ============================================================
     5. CONFETTI / SPARKS — shared particle burst
     ============================================================ */
  var FX = (function () {
    var c = null, ctx = null, parts = [], raf = 0;
    // Cap at 1.5 instead of 2: a full-screen particle canvas at DPR 2 pushes
    // 4x the pixels for effects that are in motion and blurred anyway.
    var DPR = Math.min(W.devicePixelRatio || 1, 1.5);
    var GOLD = ["#f6e7bd", "#dcb862", "#a3803a", "#fff6dd", "#e8cf94", "#ffffff"];

    /* Pre-rendered glow sprites.
       Setting ctx.shadowBlur per particle is the most expensive thing you can
       do in canvas2d — it re-runs a blur for every single dot, every frame.
       Instead we bake one small radial-gradient sprite per colour once, then
       just drawImage() it. Visually identical, dramatically cheaper. */
    var sprites = {};
    function sprite(col) {
      if (sprites[col]) return sprites[col];
      var s = 32, cv = D.createElement("canvas");
      cv.width = cv.height = s;
      var g = cv.getContext("2d");
      var rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      rg.addColorStop(0, col);
      rg.addColorStop(.35, col);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rg;
      g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, 6.283); g.fill();
      sprites[col] = cv;
      return cv;
    }

    function ensure() {
      if (c) return;
      c = D.createElement("canvas");
      c.style.cssText = "position:fixed;inset:0; width:100%; height:100%;z-index:60;pointer-events:none";
      D.body.appendChild(c);
      // alpha:true is required (it overlays the page) but desynchronized lets
      // the compositor skip a sync point on supporting browsers.
      ctx = c.getContext("2d", { alpha: true, desynchronized: true });
      resize();
      W.addEventListener("resize", resize, { passive: true });
    }
    function resize() {
      if (!c) return;
      c.width = (W.innerWidth * DPR) | 0; c.height = (W.innerHeight * DPR) | 0;
      c.style.width = W.innerWidth + "px"; c.style.height = W.innerHeight + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function loop() {
      ctx.clearRect(0, 0, W.innerWidth, W.innerHeight);
      if (!parts.length) { raf = 0; return; }   // stop the loop when idle
      raf = requestAnimationFrame(loop);
      var vh = W.innerHeight;
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
        p.x += p.vx; p.y += p.vy; p.age++;
        var f = 1 - p.age / p.life;
        if (f <= 0 || p.y > vh + 90) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = f < 0 ? 0 : f > 1 ? 1 : f;
        if (p.kind === "strip") {
          p.rot += p.vr;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (.45 + Math.abs(Math.cos(p.rot)) * .55));
          ctx.restore();
        } else {
          // pre-baked glow sprite instead of a live shadowBlur
          var d = p.r * 6;
          ctx.drawImage(p.sp, p.x - d / 2, p.y - d / 2, d, d);
        }
      }
      ctx.globalAlpha = 1;
    }
    function run() { if (!raf) raf = requestAnimationFrame(loop); }

    // Budget scales with the device. A phone or a low-core laptop simply
    // cannot push 1500 particles; better to draw fewer than to stutter.
    var MAX = Math.round(950 * Perf.scale());

    function add(p) {
      if (parts.length >= MAX) return;
      if (p.kind === "dot") p.sp = sprite(p.c);
      parts.push(p);
    }
    // scale a requested count against the budget + headroom
    function quota(n) {
      n = Math.round(n * Perf.scale());
      var free = MAX - parts.length;
      return Math.max(0, Math.min(n, free));
    }

    return {
      burst: function (n, x, y, power) {
        if (reduced) return;
        ensure();
        n = quota(n || 90);
        if (!n) return;
        x = (x == null) ? W.innerWidth / 2 : x;
        y = (y == null) ? W.innerHeight * .38 : y;
        power = power || 10;
        for (var i = 0; i < n; i++) {
          var ang = rand(0, 6.283), sp = rand(power * .22, power);
          add({
            kind: Math.random() < .62 ? "strip" : "dot",
            x: x, y: y,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - rand(1.5, 4.5),
            g: .17, drag: .987,
            w: rand(4, 10), h: rand(6, 15), r: rand(1.4, 3),
            rot: rand(0, 6.28), vr: rand(-.3, .3),
            c: pick(GOLD), life: rand(120, 230), age: 0
          });
        }
        run();
      },
      spark: function (x, y) {
        if (reduced) return;
        ensure();
        var n = quota(30), hue = pick(GOLD);
        if (!n) return;
        for (var i = 0; i < n; i++) {
          var ang = (6.283 / n) * i + rand(-.06, .06), sp = rand(2.2, 6.2);
          add({
            kind: "dot", x: x, y: y,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            g: .05, drag: .972, r: rand(1.3, 2.9),
            c: Math.random() < .3 ? "#fff" : hue,
            life: rand(55, 100), age: 0
          });
        }
        run();
      },
      rain: function (ms) {
        if (reduced) return;
        var end = Date.now() + (ms || 4000);
        (function tickRain() {
          if (Date.now() > end) return;
          FX.burst(7, rand(0, W.innerWidth), -20, 4);
          setTimeout(tickRain, 230);
        })();
      },
      max: MAX
    };
  })();

  /* ============================================================
     6. AUDIO — soft chimes + Happy Birthday, no files needed
     ============================================================ */
  var Audio2 = (function () {
    var actx = null;
    function ac() {
      if (!actx) {
        try { actx = new (W.AudioContext || W.webkitAudioContext)(); } catch (e) { return null; }
      }
      if (actx.state === "suspended") actx.resume();
      return actx;
    }
    function tone(f, t0, dur, peak, type) {
      var a = ac(); if (!a) return;
      var o = a.createOscillator(), g = a.createGain();
      o.type = type || "triangle";
      o.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + .028);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      var o2 = a.createOscillator(), g2 = a.createGain();
      o2.type = "sine"; o2.frequency.setValueAtTime(f * 2, t0);
      g2.gain.setValueAtTime(.0001, t0);
      g2.gain.exponentialRampToValueAtTime(peak * .26, t0 + .028);
      g2.gain.exponentialRampToValueAtTime(.0001, t0 + dur * .75);
      o.connect(g).connect(a.destination);
      o2.connect(g2).connect(a.destination);
      o.start(t0); o.stop(t0 + dur + .06);
      o2.start(t0); o2.stop(t0 + dur + .06);
    }
    var N = { C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,Bb4:466.16,B4:493.88,
              C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880 };
    var SONG = [
      [N.C4,.5],[N.C4,.5],[N.D4,1],[N.C4,1],[N.F4,1],[N.E4,2],
      [N.C4,.5],[N.C4,.5],[N.D4,1],[N.C4,1],[N.G4,1],[N.F4,2],
      [N.C4,.5],[N.C4,.5],[N.C5,1],[N.A4,1],[N.F4,1],[N.E4,1],[N.D4,2],
      [N.Bb4,.5],[N.Bb4,.5],[N.A4,1],[N.F4,1],[N.G4,1],[N.F4,3]
    ];
    var busy = false;
    return {
      chime: function () {
        var a = ac(); if (!a) return;
        var t = a.currentTime + .01;
        [N.F5, N.A5, N.C5].forEach(function (f, i) { tone(f, t + i * .07, .9, .055, "sine"); });
      },
      click: function () {
        var a = ac(); if (!a) return;
        tone(N.E5, a.currentTime + .005, .16, .04, "sine");
      },
      song: function (onEnd) {
        var a = ac(); if (!a || busy) return 0;
        busy = true;
        var beat = .42, t0 = a.currentTime + .12, acc = 0;
        SONG.forEach(function (n) { tone(n[0], t0 + acc * beat, n[1] * beat * .94, .13); acc += n[1]; });
        var ms = acc * beat * 1000;
        setTimeout(function () { busy = false; if (onEnd) onEnd(); }, ms + 300);
        return ms;
      },
      get busy() { return busy; }
    };
  })();

  /* ============================================================
     7. PROGRESS RAIL + shared page furniture
     ============================================================ */
  function furniture() {
    var body = D.body;
    var step = parseInt(body.getAttribute("data-step") || "0", 10);
    var total = parseInt(body.getAttribute("data-total") || "5", 10);

    $$(".rail").forEach(function (rail) {
      rail.innerHTML = "";
      for (var i = 1; i <= total; i++) {
        var b = D.createElement("b");
        if (i <= step) b.classList.add("on");
        if (i === step) b.classList.add("now");
        rail.appendChild(b);
      }
    });

    // stamp the saved name anywhere it's asked for
    var n = State.name();
    $$("[data-name]").forEach(function (el) {
      var fb = el.getAttribute("data-name") || "friend";
      el.textContent = n || fb;
    });
    if (n) {
      $$("[data-name-only]").forEach(function (el) { el.style.display = ""; });
    } else {
      $$("[data-name-only]").forEach(function (el) { el.style.display = "none"; });
    }

    // subtle click sound on primary buttons
    $$(".btn").forEach(function (b) {
      b.addEventListener("pointerdown", function () { try { Audio2.click(); } catch (e) {} }, { passive: true });
    });

    // magnetic hover on primary buttons (desktop only)
    if (!reduced && W.matchMedia("(hover:hover) and (pointer:fine)").matches) {
      $$(".btn:not(.ghost)").forEach(function (b) {
        b.addEventListener("pointermove", function (e) {
          var r = b.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
          var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
          b.style.transform = "translate(" + (dx * 9).toFixed(2) + "px," + (dy * 6 - 3).toFixed(2) + "px)";
        });
        b.addEventListener("pointerleave", function () { b.style.transform = ""; });
      });
    }

    // keyboard: Enter / → advances
    D.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        var nx = $("a[data-nav][data-primary]");
        if (nx) nx.click();
      }
    });
  }

  /* ---------------- expose ---------------- */
  W.MG = { State: State, FX: FX, Audio: Audio2, Perf: Perf, $: $, $$: $$, rand: rand, pick: pick, esc: esc, reduced: reduced };

  /* ---------------- go ---------------- */
  D.body.classList.add("boot");

  // Failsafe: no matter what happens above, never strand the visitor on a
  // blank screen. If boot() hasn't run in 4s, force everything visible.
  setTimeout(function () {
    var l = $("#loader");
    if (l && !l.classList.contains("done")) l.classList.add("done");
    if (D.body.classList.contains("boot")) {
      D.body.classList.remove("boot");
      $$("[data-anim]").forEach(function (el) { el.classList.add("in"); });
      $$("[data-words]").forEach(function (el) { el.classList.add("reveal-on"); });
      var m = $(".page-main");
      if (m) m.style.removeProperty("opacity");
    }
  }, 4000);

  try {
    transitions();
    dust();
    furniture();
  } catch (err) {
    if (W.console && console.warn) console.warn("[mg]", err);
  }
  preload();
})();
