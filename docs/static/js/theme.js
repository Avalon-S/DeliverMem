/* Retrieved but Not Delivered — theme switch, ambient effects and the entrance.
   No numbers here; the theme and its motifs are described in README.md, "Palette and effects". */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var still = /[?&]still\b/.test(location.search);
  function $(id) { return document.getElementById(id); }

  // ── theme: follows the system until the button is used, then remembers the choice ──
  (function () {
    var root = document.documentElement, btn = $("themeToggle");
    var isDark = function () {
      var t = root.getAttribute("data-theme");
      return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    };
    var sync = function () { btn.setAttribute("aria-label", isDark() ? "Switch to the light theme" : "Switch to the dark theme"); };
    btn.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("delivermem-theme", next); } catch (e) {}
      sync();
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", sync);
    sync();
  })();

  // ── reading progress, and the nav emblem turns once each time a new section comes into view ──
  (function () {
    var bar = $("progress"), emb = $("navEmblem"), ticking = false;
    function draw() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    draw();
    if (reduced || !("IntersectionObserver" in window)) return;
    var seen = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || seen[e.target.id]) return;
        seen[e.target.id] = true;
        emb.classList.remove("turn"); void emb.getBoundingClientRect(); emb.classList.add("turn");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("section[id]").forEach(function (s) { io.observe(s); });
    emb.addEventListener("animationend", function () { emb.classList.remove("turn"); });
  })();

  // ── embers rising from the land behind the hero ──
  (function () {
    var box = $("embers"); if (!box || reduced) return;
    var a = 7;  // a fixed seed, so the hero looks the same on every visit
    var rnd = function () { a = (a * 16807) % 2147483647; return (a - 1) / 2147483646; };
    for (var i = 0; i < 18; i++) {
      var e = document.createElement("i");
      e.style.left = (4 + rnd() * 92) + "%";
      e.style.setProperty("--d", (7 + rnd() * 6).toFixed(1) + "s");
      e.style.setProperty("--w", (-rnd() * 12).toFixed(1) + "s");
      e.style.setProperty("--x", Math.round(rnd() * 80 - 40) + "px");
      var s = 2 + rnd() * 3; e.style.width = e.style.height = s.toFixed(1) + "px";
      box.appendChild(e);
    }
  })();

  // ── the entrance, which spells the title out with the page's own example:
  //    memories kept in the night kingdom; one is found ("Retrieved"); it arrives as words only
  //    ("but not delivered"); fire falls through the sky and gives it back its pixels, its tag and its date
  //    ("Delivered"); it closes into the emblem, the night burns open, the emblem settles above the title ──
  (function () {
    var cv = $("fxIntro"), title = $("heroTitle"), emb = $("heroEmblem");
    if (!cv || !title || !emb) return;
    var freeze = parseFloat((location.search.match(/[?&]fx=([\d.]+)/) || [])[1]);
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var seg = function (s, a, b) { return clamp((s - a) / (b - a), 0, 1); };
    var ease = function (k) { return 1 - Math.pow(1 - k, 3); };
    var easeIO = function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
    var lerp = function (a, b, k) { return a + (b - a) * k; };
    // the entrance always plays in the kingdom of night, whatever the page theme
    var RED = "#f23d31", FILL = "#d9261b", GOLD = "#eeb24a", GOLD2 = "#ffd27a", EMBER = "#ff8a3d",
      LAV = "#cfc4ff", RUNE = "#8fe6ff", DUR = 4600;
    var HINT = window.matchMedia("(hover: none)").matches ? "Tap to skip" : "Click or press any key to skip";
    var HEAD = "800 {s}px 'Plus Jakarta Sans', Inter, system-ui, sans-serif";
    var MONO = "500 {s}px 'JetBrains Mono', ui-monospace, Consolas, monospace";
    var font = function (f, s) { return f.replace("{s}", Math.round(s)); };
    var sym = document.getElementById("emb");
    var P = {
      rays: new Path2D(sym.querySelector(".emb-ray").getAttribute("d")),
      flame: new Path2D(sym.querySelector(".emb-flame").getAttribute("d")),
      core: new Path2D(sym.querySelector(".emb-core").getAttribute("d"))
    };
    // the memories are the page's own images: the salmon photo (bare and as delivered, M1 in its corner),
    // another question's photo, and four product photos from the DMV-Bench failure case
    var IMG = {}, srcs = { salmon: "salmon_pixels.jpg", tagged: "salmon_delivermem.jpg", decoy: "ladder_decoy.jpg", dmv: "failcase.png" };
    Object.keys(srcs).forEach(function (k) { var im = new Image(); im.src = "static/img/" + srcs[k]; IMG[k] = im; });
    var CROPS = [["decoy", 0, 0, 768, 432], ["dmv", 12, 32, 190, 190], ["dmv", 507, 30, 196, 196],
      ["dmv", 757, 30, 196, 196], ["dmv", 1007, 30, 196, 196], ["salmon", 0, 0, 512, 384]];
    var raf = 0, endRun = null;

    function arm() {  // the title ignites; the hero emblem takes over exactly where the drawn one lands
      title.classList.remove("armed"); emb.classList.remove("pre");
      void title.offsetWidth;
      title.classList.add("armed");
    }
    function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
    function photo(g, key, sx, sy, sw, sh, x, y, w, h) {
      var im = IMG[key];
      if (im && im.complete && im.naturalWidth) g.drawImage(im, sx, sy, sw, sh, x, y, w, h);
      else { g.fillStyle = "#6f63a8"; g.fillRect(x, y, w, h); }
    }
    // the emblem in its own units (radius 50); flame, ring and rays are revealed in turn
    function emblem(g, x, y, size, kFlame, kRing, kRays, alpha) {
      var cs = getComputedStyle(document.documentElement);  // the page's colours, to match the emblem it hands over to
      var gold = cs.getPropertyValue("--gold").trim() || GOLD, fill = cs.getPropertyValue("--red-fill").trim() || FILL,
        core = cs.getPropertyValue("--gold-2").trim() || GOLD2;
      g.save(); g.globalAlpha = alpha; g.translate(x, y); g.scale(size / 100, size / 100);
      if (kRays > 0) {
        g.save(); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 60, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kRays); g.closePath(); g.clip();
        g.fillStyle = gold; g.fill(P.rays); g.restore();
      }
      if (kRing > 0) {
        g.strokeStyle = gold; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 29, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kRing); g.stroke();
        g.globalAlpha = alpha * kRing; g.fillStyle = fill; g.beginPath(); g.arc(0, 0, 25, 0, Math.PI * 2); g.fill(); g.globalAlpha = alpha;
      }
      if (kFlame > 0) {
        g.save(); g.scale(kFlame, kFlame); g.shadowColor = EMBER; g.shadowBlur = 24 * (1 - kRing * .7);
        g.fillStyle = "#fff"; g.fill(P.flame); g.shadowBlur = 0; g.fillStyle = core; g.fill(P.core); g.restore();
      }
      g.restore();
    }
    function totem(g, x, base, s, lit) {  // a stack of ice-blue crystal stones; its runes light as it searches
      var y = base, dims = [[1, .95], [.8, .9], [.62, .78]];
      g.save(); g.shadowColor = "rgba(140,190,255,.6)"; g.shadowBlur = 8 + 14 * lit;
      dims.forEach(function (d) {
        var ww = s * d[0], hh = s * d[1]; y -= hh;
        rrect(g, x - ww / 2, y, ww, hh, ww * .28);
        g.fillStyle = "rgba(150,190,255," + (.35 + .2 * lit).toFixed(3) + ")"; g.fill();
        g.strokeStyle = "rgba(220,235,255,.8)"; g.lineWidth = 1; g.stroke();
        g.strokeStyle = lit > .05 ? RUNE : "rgba(143,230,255,.35)"; g.lineWidth = 1.6;
        var r = Math.min(ww, hh) * .2;  // a diamond rune
        g.beginPath(); g.moveTo(x, y + hh / 2 - r); g.lineTo(x + r, y + hh / 2); g.lineTo(x, y + hh / 2 + r); g.lineTo(x - r, y + hh / 2); g.closePath(); g.stroke();
        y -= 2;
      });
      g.restore();
    }
    function backdrop(g, w, h, s, H0) {  // the kingdom: shelves overhead, a lavender horizon, the pale sea of souls
      var sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#1d173b"); sky.addColorStop(.5, "#342a69"); sky.addColorStop(H0 / h, "#7a69c4"); sky.addColorStop(1, "#2a2350");
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      var glow = g.createRadialGradient(w / 2, H0, 0, w / 2, H0, Math.max(w, h) * .45);
      glow.addColorStop(0, "rgba(236,226,255,.7)"); glow.addColorStop(.35, "rgba(185,166,240,.3)"); glow.addColorStop(1, "rgba(185,166,240,0)");
      g.fillStyle = glow; g.fillRect(0, 0, w, h);
      // spires on both banks with faint magenta cracks
      g.fillStyle = "#2a2350";
      [[0, .2], [1, -.2]].forEach(function (q) {
        var sx = q[0] ? w : 0, d = q[0] ? -1 : 1;
        g.beginPath(); g.moveTo(sx, H0 + h * .06);
        g.lineTo(sx + d * w * .06, H0 - h * .16); g.lineTo(sx + d * w * .09, H0 - h * .08); g.lineTo(sx + d * w * .13, H0 - h * .22);
        g.lineTo(sx + d * w * .17, H0 - h * .1); g.lineTo(sx + d * w * .21, H0 - h * .15); g.lineTo(sx + d * w * .26, H0 + h * .06); g.closePath(); g.fill();
      });
      g.save(); g.strokeStyle = "rgba(212,58,168,.75)"; g.lineWidth = 2; g.shadowColor = "#d43aa8"; g.shadowBlur = 6;
      g.beginPath(); g.moveTo(w * .13, H0 - h * .2); g.lineTo(w * .14, H0 - h * .15); g.lineTo(w * .13, H0 - h * .12);
      g.moveTo(w * .87, H0 - h * .19); g.lineTo(w * .86, H0 - h * .14); g.stroke(); g.restore();
      // the sea, widening towards the viewer
      var sea = g.createLinearGradient(0, H0, 0, h);
      sea.addColorStop(0, "rgba(226,220,250,.85)"); sea.addColorStop(1, "rgba(156,144,212,.7)");
      g.fillStyle = sea; g.beginPath(); g.moveTo(w * .4, H0); g.lineTo(w * .6, H0); g.lineTo(w, H0 + h * .2); g.lineTo(w, h); g.lineTo(0, h); g.lineTo(0, H0 + h * .2); g.closePath(); g.fill();
      // shelves overhead, lit along their edges, and thin falls
      g.fillStyle = "#211a44";
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w * .4, 0); g.lineTo(w * .35, h * .08); g.lineTo(w * .2, h * .13); g.lineTo(0, h * .17); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(w, 0); g.lineTo(w * .6, 0); g.lineTo(w * .66, h * .1); g.lineTo(w * .82, h * .14); g.lineTo(w, h * .18); g.closePath(); g.fill();
      g.fillStyle = "#2f2760";
      g.beginPath(); g.moveTo(0, h * .23); g.lineTo(w * .24, h * .18); g.lineTo(w * .3, h * .22); g.lineTo(0, h * .29); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(w, h * .24); g.lineTo(w * .77, h * .2); g.lineTo(w * .7, h * .24); g.lineTo(w, h * .31); g.closePath(); g.fill();
      g.strokeStyle = "rgba(160,145,230,.55)"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, h * .17); g.lineTo(w * .2, h * .13); g.lineTo(w * .35, h * .08); g.moveTo(w, h * .18); g.lineTo(w * .82, h * .14); g.lineTo(w * .66, h * .1); g.stroke();
      var fall = g.createLinearGradient(0, h * .14, 0, h * .5);
      fall.addColorStop(0, "rgba(232,228,255,.4)"); fall.addColorStop(1, "rgba(232,228,255,0)");
      g.fillStyle = fall; g.fillRect(w * .17, h * .14, 2.5, h * .36); g.fillRect(w * .85, h * .15, 2.5, h * .33);
      // the gap in the sky the fire comes through
      var beam = g.createLinearGradient(0, 0, 0, h * .7);
      beam.addColorStop(0, "rgba(230,232,255,.22)"); beam.addColorStop(1, "rgba(230,232,255,0)");
      g.fillStyle = beam; g.beginPath(); g.moveTo(w * .485, 0); g.lineTo(w * .515, 0); g.lineTo(w * .58, h * .7); g.lineTo(w * .42, h * .7); g.closePath(); g.fill();
    }
    // parts: [text, colour, alpha, glow, room]; one centred line. "room" is how much of its width a word already
    // takes, so words that fade in push the line open and the first word starts centred.
    function caption(g, parts, x, y, size, maxW) {
      g.save(); g.font = font(HEAD, size); g.textBaseline = "middle"; g.textAlign = "left";
      var full = parts.reduce(function (t, p) { return t + g.measureText(p[0]).width; }, 0) + size * .32 * (parts.length - 1);
      if (full + size * 1.2 > maxW) { size *= maxW / (full + size * 1.2); g.font = font(HEAD, size); }  // fit narrow screens
      var gap = size * .32, widths = parts.map(function (p) { return g.measureText(p[0]).width * p[4]; });
      var total = widths.reduce(function (a, b) { return a + b; }, 0) +
        parts.slice(1).reduce(function (t, p) { return t + gap * p[4]; }, 0), cx = x - total / 2;
      var band = Math.max.apply(null, parts.map(function (p) { return p[2]; }));
      g.globalAlpha = band * .7; g.fillStyle = "#1a1438";
      rrect(g, cx - size * .6, y - size * .78, total + size * 1.2, size * 1.56, size * .78); g.fill();
      parts.forEach(function (p, i) {
        if (p[2] > 0) {
          g.globalAlpha = p[2]; g.fillStyle = p[1];
          if (p[3]) { g.shadowColor = p[3]; g.shadowBlur = size * .5; } else g.shadowBlur = 0;
          g.fillText(p[0], cx, y);
        }
        cx += widths[i] + gap * (parts[i + 1] ? parts[i + 1][4] : 0);
      });
      g.restore();
    }

    function play() {
      if (reduced || still) { emb.classList.remove("pre"); cv.classList.add("done"); return; }
      if (endRun) endRun(true);
      cancelAnimationFrame(raf);
      cv.classList.remove("done", "out");
      var dpr = window.devicePixelRatio || 1, w = window.innerWidth, h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var er = emb.getBoundingClientRect(), tx = er.left + er.width / 2, ty = er.top + er.height / 2, tS = er.width;
      var cx = w / 2, H0 = h * .62, t0 = performance.now(), armed = false;
      var CW = Math.min(w * .5, h * .4 * 4 / 3, 460), CH = CW * .75, cy = h * .4;   // the card at the centre
      var capY = cy + CH / 2 + Math.max(34, h * .07), capS = Math.min(w * .065, 54);
      var a = 23, rnd = function () { a = (a * 16807) % 2147483647; return (a - 1) / 2147483646; };
      // memories floating above the sea, nearer ones larger; the salmon is the one asked for
      var cards = [];
      for (var i = 0; i < 12; i++) {
        var depth = rnd(), side = i % 2 ? 1 : -1;
        var y = H0 - h * .12 + depth * h * .28, sz = (40 + depth * 64) * Math.min(1.4, w / 900 + .4);
        cards.push({ x: cx + side * (w * .08 + rnd() * w * .38), y: y, w: sz, crop: CROPS[i % 5], ph: rnd() * 6.28 });
      }
      var target = { x: w * .3, y: H0 - h * .04, w: 96 * Math.min(1.4, w / 900 + .4) };
      var ps = Math.min(h * .045, w * .045);  // totems scale with the narrower side, so phones keep room for the caption
      var poles = [{ x: w * .07, s: ps }, { x: w * .27, s: ps * .8 }, { x: w * .73, s: ps * .8 }, { x: w * .93, s: ps }];
      emb.classList.add("pre");

      var SKIP = ["pointerdown", "mousedown", "keydown", "wheel", "touchstart", "touchmove"];
      var GUARD = ["mousedown", "mouseup", "click", "touchend", "touchmove"];
      function swallow(ev) { if (ev.cancelable) ev.preventDefault(); ev.stopPropagation(); }
      function guard() {  // the rest of the press that skipped the entrance must not click what lies under it
        GUARD.forEach(function (e) { window.addEventListener(e, swallow, { capture: true, passive: false }); });
        var release = function () { GUARD.forEach(function (e) { window.removeEventListener(e, swallow, { capture: true }); }); };
        window.addEventListener("click", function once() { window.removeEventListener("click", once, true); setTimeout(release, 0); }, true);
        setTimeout(release, 700);
      }
      function onSkip(ev) {
        if (ev.cancelable) ev.preventDefault();
        ev.stopPropagation();
        if (ev.type === "pointerdown" || ev.type === "mousedown" || ev.type === "touchstart") guard();
        finish(true);
      }
      function finish(skipped) {
        if (!endRun) return;
        endRun = null; cancelAnimationFrame(raf);
        SKIP.forEach(function (e) { window.removeEventListener(e, onSkip, { capture: true }); });
        if (!armed) { armed = true; arm(); }
        cv.classList.add("out");
        setTimeout(function () { if (!endRun) { cv.classList.add("done"); g.clearRect(0, 0, w, h); } }, skipped ? 170 : 180);
      }
      var tf = isNaN(freeze) ? 0 : t0 + clamp(freeze, 0, 1) * DUR;  // ?fx=0.5 draws the frame at 50% and holds it

      function frame(now) {
        if (tf) now = tf;
        var s = (now - t0) / 1000; g.clearRect(0, 0, w, h);
        var burn = easeIO(seg(s, 3.55, 4.4)), R = Math.hypot(w, h) * .62 * burn;
        backdrop(g, w, h, s, H0);

        // 1. kept: memories drift over the sea, tinted by the night
        var dim = seg(s, 1.0, 1.6) * .6 + seg(s, 3.2, 3.6) * .4;
        cards.forEach(function (c) {
          var bob = Math.sin(s * 1.6 + c.ph) * 4, cw = c.w, ch = c.w * .75;
          g.save(); g.globalAlpha = (1 - dim) * seg(s, 0, .5);
          rrect(g, c.x - cw / 2, c.y - ch / 2 + bob, cw, ch, 4); g.clip();
          photo(g, c.crop[0], c.crop[1], c.crop[2], c.crop[3], c.crop[4], c.x - cw / 2, c.y - ch / 2 + bob, cw, ch);
          g.fillStyle = "rgba(60,44,140,.45)"; g.fillRect(c.x - cw / 2, c.y - ch / 2 + bob, cw, ch);
          g.restore();
          g.save(); g.globalAlpha = (1 - dim) * seg(s, 0, .5) * .8; g.strokeStyle = LAV; g.lineWidth = 1;
          g.shadowColor = LAV; g.shadowBlur = 8; rrect(g, c.x - cw / 2, c.y - ch / 2 + bob, cw, ch, 4); g.stroke(); g.restore();
        });

        // 2. retrieved: the totems search, their runes lighting in turn, and thread to the salmon
        var scan = seg(s, .5, 1.25), lift = easeIO(seg(s, 1.05, 1.75));
        var kx = lerp(target.x, cx, lift), ky = lerp(target.y, cy, lift), kw = lerp(target.w, CW, lift), kh = kw * .75;
        poles.forEach(function (p, i) {
          var lit = seg(scan * poles.length, i, i + .7) * (1 - seg(s, 3.3, 3.6));
          totem(g, p.x, H0 + h * .05, p.s, lit);
          if (lit > 0 && lift < 1) {
            g.strokeStyle = "rgba(143,230,255," + (.85 * lit * (1 - lift)).toFixed(3) + ")"; g.lineWidth = 2;
            g.shadowColor = RUNE; g.shadowBlur = 8;
            g.beginPath(); g.moveTo(p.x, H0 + h * .05 - p.s * 2.6); g.lineTo(kx, ky); g.stroke(); g.shadowBlur = 0;
          }
        });

        // 3. the card: photo, then words only, then fire gives the pixels back with M1 and the date
        var fade = seg(s, 1.9, 2.35);                       // the pixels drain away: a text proxy is all that arrives
        var back = ease(seg(s, 3.0, 3.35));                 // the fire restores them, as delivered
        var close = easeIO(seg(s, 3.35, 3.75));             // the card closes into the emblem
        if (close < 1) {
          var sc = 1 - close, w2 = kw * sc, h2 = kh * sc;
          g.save(); g.globalAlpha = 1 - close;
          g.shadowColor = back > 0 ? EMBER : LAV; g.shadowBlur = 18 + 30 * back;
          rrect(g, kx - w2 / 2, ky - h2 / 2, w2, h2, 8); g.fillStyle = "#2a2350"; g.fill(); g.shadowBlur = 0;
          g.clip();
          var showBare = 1 - Math.max(fade, back) , showTag = back;
          if (showBare > 0) { g.globalAlpha = (1 - close) * showBare; photo(g, "salmon", 0, 0, 512, 384, kx - w2 / 2, ky - h2 / 2, w2, h2); }
          if (fade > 0 && back < 1) {                       // what text-only delivery hands the model
            g.globalAlpha = (1 - close) * fade * (1 - back);
            g.fillStyle = "#3b3550"; g.fillRect(kx - w2 / 2, ky - h2 / 2, w2, h2);
            g.fillStyle = "#b9b3cc"; g.font = font(MONO, Math.max(11, w2 * .045)); g.textAlign = "left"; g.textBaseline = "top";
            var lines = ["[text]", "a photo of a salmon fillet", "cut in two on a wooden", "board ..."];
            lines.forEach(function (l, j) { g.fillText(l, kx - w2 / 2 + w2 * .08, ky - h2 / 2 + h2 * (.16 + j * .16)); });
            g.textAlign = "center"; g.font = font(MONO, Math.max(10, w2 * .036)); g.fillStyle = "#857ea0";
            g.fillText("pixels withheld", kx, ky + h2 / 2 - h2 * .16);
          }
          if (showTag > 0) { g.globalAlpha = (1 - close) * showTag; photo(g, "tagged", 0, 0, 512, 384, kx - w2 / 2, ky - h2 / 2, w2, h2); }
          g.restore();
          g.save(); g.globalAlpha = (1 - close); g.lineWidth = 2;
          g.strokeStyle = back > 0 ? "rgba(255,190,110," + (.4 + .6 * back) + ")" : "rgba(207,196,255,.8)";
          rrect(g, kx - w2 / 2, ky - h2 / 2, w2, h2, 8); g.stroke();
          if (back > 0) {                                   // (D3) the date it was seen
            g.globalAlpha = back * (1 - close); g.fillStyle = GOLD2; g.font = font(MONO, Math.max(12, CW * .04));
            g.textAlign = "center"; g.textBaseline = "bottom"; g.fillText("[2024-05-11]  seen #7 of 12", kx, ky - h2 / 2 - 8);
          }
          g.restore();
        }

        // 4. fire falls through the gap in the sky and strikes the card
        var drop = seg(s, 2.55, 3.0);
        if (drop > 0 && drop < 1) {
          var fy = lerp(-60, ky - kh / 2, ease(drop)), fs = Math.max(26, CW * .12);
          g.save();
          var trail = g.createLinearGradient(cx, fy - h * .3, cx, fy);
          trail.addColorStop(0, "rgba(242,61,49,0)"); trail.addColorStop(1, "rgba(255,170,80,.75)");
          g.fillStyle = trail; g.fillRect(cx - fs * .18, fy - h * .3, fs * .36, h * .3);
          g.translate(cx, fy); g.scale(fs / 40, fs / 40); g.shadowColor = EMBER; g.shadowBlur = 30;
          g.fillStyle = RED; g.fill(P.flame); g.fillStyle = GOLD2; g.fill(P.core); g.restore();
        }
        var strike = seg(s, 3.0, 3.45);
        if (strike > 0 && strike < 1) {                     // the ring of fire as it lands
          g.save(); g.globalAlpha = 1 - strike; g.strokeStyle = GOLD2; g.lineWidth = 6 * (1 - strike) + 1;
          g.shadowColor = EMBER; g.shadowBlur = 24;
          g.beginPath(); g.ellipse(cx, cy, CW * (.55 + strike * .5), CH * (.55 + strike * .5), 0, 0, Math.PI * 2); g.stroke(); g.restore();
        }

        // captions: the title, word by word
        var c1 = seg(s, 1.3, 1.6), c2 = seg(s, 2.05, 2.35), burnWords = seg(s, 3.05, 3.4), capOut = 1 - seg(s, 3.55, 3.85);
        if (c1 > 0 && capOut > 0) {
          var room = easeIO(c2);
          caption(g, [["Retrieved", "#efeaff", c1 * capOut, null, 1],
                      ["but not", "#9d96b5", c2 * (1 - burnWords) * capOut, null, room],
                      ["Delivered", burnWords > 0 ? RED : "#9d96b5", c2 * capOut, burnWords > 0 ? "rgba(255,120,60," + burnWords + ")" : null, room]],
                  cx, capY, capS, w * .94);
        }

        // 5. the card has closed into the emblem; the night burns open; the emblem settles above the title
        var ign = ease(seg(s, 3.4, 3.8));
        if (burn > 0) {
          g.save(); g.globalCompositeOperation = "destination-out";
          var hole = g.createRadialGradient(cx, cy, R * .55, cx, cy, Math.max(1, R));
          hole.addColorStop(0, "rgba(0,0,0,1)"); hole.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = hole; g.beginPath(); g.arc(cx, cy, Math.max(1, R), 0, Math.PI * 2); g.fill(); g.restore();
          var rim = g.createRadialGradient(cx, cy, R * .78, cx, cy, Math.max(1, R * 1.02));
          rim.addColorStop(0, "rgba(242,61,49,0)"); rim.addColorStop(.75, "rgba(242,61,49," + (.5 * (1 - burn)).toFixed(3) + ")");
          rim.addColorStop(.92, "rgba(255,210,122," + (.6 * (1 - burn)).toFixed(3) + ")"); rim.addColorStop(1, "rgba(255,210,122,0)");
          g.fillStyle = rim; g.beginPath(); g.arc(cx, cy, Math.max(1, R * 1.02), 0, Math.PI * 2); g.fill();
        }
        if (ign > 0) {
          var fly = easeIO(seg(s, 3.85, 4.45));
          if (fly >= 1 && !armed) { armed = true; arm(); }
          if (!armed) emblem(g, lerp(cx, tx, fly), lerp(cy, ty, fly), lerp(Math.min(CW * .55, 220), tS, fly),
            ign, ease(seg(s, 3.5, 3.8)), ease(seg(s, 3.6, 3.95)), 1);
        }

        g.globalAlpha = (1 - seg(s, 3.2, 3.6)) * .7; g.fillStyle = "#e8e2ff"; g.textAlign = "center"; g.textBaseline = "alphabetic";
        g.font = "500 13px Inter, system-ui, sans-serif"; g.fillText(HINT, w / 2, h - 22); g.globalAlpha = 1;

        if (s * 1000 >= DUR) { finish(false); return; }
        raf = requestAnimationFrame(frame);
      }
      endRun = finish;
      SKIP.forEach(function (e) { window.addEventListener(e, onSkip, { capture: true, passive: false }); });
      raf = requestAnimationFrame(frame);
    }

    emb.addEventListener("click", function () { if (!endRun) play(); });
    play();
  })();
})();
