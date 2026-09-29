/* Retrieved but Not Delivered — project page interactions.
   Every plotted number comes from static/data/data.js, which paper/build/make_page_data.py
   exports from the paper's own tables. Nothing below is a result typed by hand. */
(function () {
  "use strict";

  var D = window.DM;
  var SVGNS = "http://www.w3.org/2000/svg";
  var RED = "#c7000b", CHAR = "#3b3b42", GREY = "#c8c8cd", INK2 = "#4a4a52", INK3 = "#8b8b93", LINE = "#ece6e6";

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs) {
    var t = el("text", Object.assign({ x: x, y: y }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }
  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function f2(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2); }
  function f1(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(1); }
  function signed(v, d) { return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(d == null ? 2 : d); }
  function thousands(v) { return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function wl(s) { var p = s.split("/"); return p[0] + " improved, " + p[1] + " worsened"; }

  // ── tooltip ─────────────────────────────────────────────────────────────
  var tip = $("tip");
  function showTip(ev, html) {
    tip.innerHTML = html; tip.classList.add("on");
    var x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + 300 > window.innerWidth) x = ev.clientX - 300;
    if (y + 110 > window.innerHeight) y = ev.clientY - 100;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hideTip() { tip.classList.remove("on"); }
  function hover(node, html) {
    node.style.cursor = "default";
    node.addEventListener("mousemove", function (e) { showTip(e, html); });
    node.addEventListener("mouseleave", hideTip);
  }

  // ── headline numbers ────────────────────────────────────────────────────
  (function stats() {
    var sys = {}; D.dmv.systems.forEach(function (s) { sys[s.name] = s; });
    var deltas = [];
    ["qwen", "gemini"].forEach(function (b) {
      sys.DeliverMem[b].forEach(function (v, i) { deltas.push(v - sys.DualMem[b][i]); });
    });
    var lo = Math.min.apply(null, deltas), hi = Math.max.apply(null, deltas);
    var r = D.memlens.ratio;
    var items = [
      ["+" + f2(D.decomp.gold.dD), "points from delivering the pixels, with the retrieved set held fixed", ""],
      ["+" + f2(D.decomp.dR.kept), "points from making retrieval perfect on the same questions", "dim"],
      ["+" + f2(D.memlens.margin[0]), "over the best published memory agent on MemLens 32K", ""],
      ["≥ +" + f1(lo), "over DMV-Bench's strongest method at every setting on both backbones, up to +" + f1(hi), ""],
      [r[0].toFixed(1) + "–" + r[r.length - 1].toFixed(1) + "×", "less input than reading the whole conversation", "dim"]
    ];
    var root = $("stats");
    items.forEach(function (it) {
      root.appendChild(h("div", "stat " + it[2], "<b>" + it[0] + "</b><span>" + it[1] + "</span>"));
    });
  })();

  // ── the salmon example ──────────────────────────────────────────────────
  (function salmon() {
    var seg = document.querySelector("#problem .seg");
    var pix = $("pix");
    var answers = document.querySelectorAll("#problem .answer");
    function set(mode) {
      seg.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === mode));
      });
      // the photo stays; .pix without .on greys it out (style.css)
      pix.classList.toggle("on", mode === "delivered");
      answers.forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-for") === mode); });
    }
    seg.addEventListener("click", function (e) {
      var m = e.target.getAttribute && e.target.getAttribute("data-mode");
      if (m) set(m);
    });
    set("delivered");
  })();

  // ── the 2x2 decomposition ───────────────────────────────────────────────
  (function decomp() {
    var d = D.decomp, g = $("grid22"), cells = {};
    g.appendChild(h("div", "hd", ""));
    g.appendChild(h("div", "hd", "Pixels kept"));
    g.appendChild(h("div", "hd", "Pixels removed"));
    [["gold", "Gold messages <span class='mono' style='color:var(--ink-3)'>R*</span>"],
     ["ours", "Our retriever <span class='mono' style='color:var(--ink-3)'>R</span>"]].forEach(function (r) {
      g.appendChild(h("div", "rh", r[1]));
      ["kept", "removed"].forEach(function (c) {
        var e = h("div", "cell", d[r[0]][c].toFixed(2) + "<small>accuracy</small>");
        cells[r[0] + "-" + c] = e; g.appendChild(e);
      });
    });
    var box = $("deltas");
    var dd = h("div", "delta d on",
      "<div class='v'>+" + f2(d.gold.dD) + "</div><div class='t'>Delivery, &Delta;<sub>D</sub></div>" +
      "<div class='s'>Gold messages, pixels kept against removed. " + wl(d.gold.wl) + ", p = " + d.gold.p + ".</div>");
    var dr = h("div", "delta r",
      "<div class='v'>+" + f2(d.dR.kept) + "</div><div class='t'>Retrieval, &Delta;<sub>R</sub></div>" +
      "<div class='s'>Pixels kept, gold messages against our retriever. " + wl(d.dR.wl) + ", p = " + d.dR.p + ".</div>");
    box.appendChild(dd); box.appendChild(dr);
    box.appendChild(h("p", "note left",
      "Taken at our own retriever, the delivery term is +" + f2(d.ours.dD) + "; the interaction between the two axes, " +
      f2(d.interaction) + ", is undetectable."));
    function light(which) {
      Object.keys(cells).forEach(function (k) { cells[k].classList.remove("hot", "cool"); });
      dd.classList.toggle("on", which === "d"); dr.classList.toggle("on", which === "r");
      if (which === "d") { cells["gold-kept"].classList.add("hot"); cells["gold-removed"].classList.add("hot"); }
      else { cells["gold-kept"].classList.add("cool"); cells["ours-kept"].classList.add("cool"); }
    }
    dd.addEventListener("mouseenter", function () { light("d"); });
    dr.addEventListener("mouseenter", function () { light("r"); });
    light("d");
  })();

  // ── three backbones ─────────────────────────────────────────────────────
  (function scale() {
    var rows = D.scale, W = 1000, L = 210, R = 250, T = 14, gh = 74, bh = 24;
    var H = T + rows.length * gh + 50, X1 = W - R, max = 20;
    function X(v) { return L + v / max * (X1 - L); }
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "Delivery and retrieval terms on three answering models" }, $("c-scale"));
    for (var t = 0; t <= max; t += 5) {
      el("line", { x1: X(t), x2: X(t), y1: T - 4, y2: H - 46, stroke: LINE, "stroke-width": 1 }, svg);
      txt(svg, X(t), H - 28, String(t), { "text-anchor": "middle", "font-size": 13, fill: INK3 });
    }
    // the axis title needs its own row inside the viewBox; at H + 6 it was cut off
    txt(svg, (L + X1) / 2, H - 6, "accuracy gained (points)", { "text-anchor": "middle", "font-size": 13, fill: INK3 });
    var kind = ["dense", "mixture of experts, 3B active", "dense"];
    rows.forEach(function (r, i) {
      var y0 = T + i * gh;
      txt(svg, L - 16, y0 + 24, r.model, { "text-anchor": "end", "font-size": 15, "font-weight": 700, fill: "#1b1b1f" });
      txt(svg, L - 16, y0 + 43, kind[i], { "text-anchor": "end", "font-size": 12.5, fill: INK3 });
      [["delivery", RED, r.delivery, r.dWL, r.dP, 0], ["retrieval", CHAR, r.retrieval, r.rWL, r.rP, 1]].forEach(function (b) {
        var y = y0 + 6 + b[5] * (bh + 6);
        var rect = el("rect", { x: L, y: y, width: X(b[2]) - L, height: bh, rx: 5, fill: b[1] }, svg);
        txt(svg, X(b[2]) + 8, y + 17, "+" + f2(b[2]), { "font-size": 14, "font-weight": 700, fill: b[1] });
        hover(rect, "<b>" + (b[0] === "delivery" ? "Delivery" : "Retrieval") + " +" + f2(b[2]) + "</b><br>" +
          r.model + "<br>" + wl(b[3]) + "<br>p = " + b[4]);
      });
      var gy = y0 + 32;
      var g = txt(svg, X1 + 24, gy - 6, "gap +" + f2(r.gap), { "font-size": 14, "font-weight": 700, fill: INK2 });
      txt(svg, X1 + 24, gy + 13, "p = " + r.gapP + (parseFloat(r.gapP) < 0.05 ? "" : ", n.s."),
        { "font-size": 13, fill: INK3 });
      hover(g, "<b>Delivery minus retrieval +" + f2(r.gap) + "</b><br>paired per question (" + r.gapWL + ")<br>p = " + r.gapP);
    });
  })();

  // ── the decisions ───────────────────────────────────────────────────────
  (function decisions() {
    function ctl(comp, control, bench) {
      for (var i = 0; i < D.controls.length; i++) {
        var c = D.controls[i];
        if (c.component.indexOf(comp) === 0 && c.control === control && c.bench === bench) return c;
      }
      throw new Error("no control row " + comp + " / " + control);
    }
    var d1 = ctl("(D1)", "pixel phase randomised", "MemLens");
    var d2 = ctl("(D2)", "tags made identical", "DMV");
    var d2n = ctl("(D2)", "tag removed entirely", "DMV");
    var d3 = ctl("(D3)", "date values permuted", "MemLens");
    var r1 = ctl("(R1)", "(main effect in 2×2)", "DMV");
    var cards = [
      ["D1", "Original modality", "Retrieved items arrive with their pixels, not a textual proxy.",
       d1.delta, "against the same images with their Fourier phase randomised, MemLens", ""],
      ["D2", "Readable identity", "A short tag (M1, M2, &hellip;) is rendered into each image, and the prompt refers to a memory by its tag.",
       d2.delta, "against one identical tag on every image, DMV-Bench; +" + f2(d2n.delta) + " against no tag", ""],
      ["D3", "Temporal position", "Each item states when it was seen: the date on MemLens, the append ordinal on DMV-Bench.",
       d3.delta, "against permuted dates, on temporal questions, MemLens", ""],
      ["R1", "Region retrieval", "Images are encoded whole and as a 2&times;2 overlapping grid and scored by MaxSim: delivery cannot expose an item that retrieval never returned.",
       r1.delta, "main effect in a 2&times;2 with delivery, DMV-Bench", "adapter"]
    ];
    var root = $("decisions");
    cards.forEach(function (c) {
      root.appendChild(h("div", "card dec " + c[5],
        "<span class='id'>(" + c[0] + ")</span><h3>" + c[1] + "</h3><p>" + c[2] + "</p>" +
        "<div class='ev'><b>+" + f2(c[3]) + "</b><br>" + c[4] + "</div>"));
    });
  })();

  // ── counterfactual-image ladder ─────────────────────────────────────────
  (function ladder() {
    var L = D.ladder, by = {};
    L.forEach(function (x) { by[x.cond] = x; });
    var max = Math.max.apply(null, L.map(function (x) { return x.loss; }));
    var tiles = [
      { key: "correct", name: "The correct image", ds: "the reference", img: "ladder_correct.jpg", loss: 0,
        say: "<b>The correct photograph</b> is the reference. Every other tile keeps its slot and changes only what the pixels carry." },
      { key: "oracle10_scramble", name: "16-tile shuffle", ds: "positions permuted" },
      { key: "oracle10_phasescram", name: "Phase randomised", ds: "same statistics, no objects" },
      { key: "oracle10_decoy", name: "Another question's photo", ds: "a real but wrong image" },
      { key: "oracle10_noimg", name: "No image", ds: "nothing" }
    ];
    var notes = {
      oracle10_scramble: "Whole objects stay legible and only their positions move. Correct positions account for",
      oracle10_phasescram: "The image's own colour histogram and amplitude spectrum, with every object destroyed. The content-specific value of delivering the original pixels is",
      oracle10_decoy: "A real photograph from a different question scores exactly what no photograph scores:",
      oracle10_noimg: "Delivering no image at all loses"
    };
    var root = $("ladder"), out = $("ladderReadout"), btns = [];
    tiles.forEach(function (t) {
      var x = by[t.key] || {};
      var loss = t.key === "correct" ? 0 : x.loss;
      var img = t.img || x.img;
      var b = h("button", "rung");
      b.type = "button";
      b.innerHTML = "<div class='thumb'>" + (img ? "<img src='static/img/" + img + "' alt='" + t.name + "' loading='lazy'>" : "no image") +
        "</div><div class='nm'>" + t.name + "</div><div class='ds'>" + t.ds + "</div>" +
        "<div class='lost'><i style='width:" + (loss / max * 100) + "%'></i></div>" +
        "<div class='lv'>" + (loss ? "−" + f2(loss) : "0.00") + "</div>";
      b.addEventListener("click", function () { pick(t, x, b); });
      btns.push(b); root.appendChild(b);
      if (t.key === "oracle10_phasescram") setTimeout(function () { pick(t, x, b); }, 0);
    });
    function pick(t, x, b) {
      btns.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      if (t.key === "correct") { out.innerHTML = t.say; return; }
      var w = x.wl.split("/");
      out.innerHTML = notes[t.key] + " <b style='color:var(--red)'>" + f2(x.loss) + " points</b> against the correct image " +
        "(" + w[0] + " questions lost, " + w[1] + " gained, p = " + x.p + ").";
    }
  })();

  // ── controls table ──────────────────────────────────────────────────────
  (function controls() {
    var t = $("ctlTable");
    t.innerHTML = "<thead><tr><th>Component</th><th>Control alters</th><th>Benchmark</th><th>Unit (n)</th>" +
      "<th style='text-align:right'>&Delta;</th><th>Agreement</th><th style='text-align:right'>p</th></tr></thead>";
    var tb = h("tbody");
    D.controls.forEach(function (c) {
      var sig = !/^(0\.0[5-9]|0\.[1-9]|1\.)/.test(c.p);
      var tr = h("tr", "", "<td class='comp'>" + c.component + "</td><td>" + c.control + "</td><td>" + c.bench +
        "</td><td class='muted'>" + c.unit + "</td><td class='num" + (sig ? " pos" : "") + "'>+" + f2(c.delta) +
        "</td><td class='muted'>" + c.agree + "</td><td class='num" + (sig ? "" : " muted") + "' style='font-weight:500'>" + c.p + "</td>");
      tb.appendChild(tr);
    });
    t.appendChild(tb);
  })();

  // ── component by benchmark ──────────────────────────────────────────────
  (function matrix() {
    var m = $("matrix");
    ["Component", "DMV-Bench", "MemLens"].forEach(function (s) { m.appendChild(h("div", "mh", s)); });
    function cell(s) {
      s = s.trim();
      if (/^-+$/.test(s)) return "<span class='chip na'>&mdash;</span>";
      var mm = s.match(/^(positive|null)\s*(.*)$/);
      if (!mm) return s;
      return "<span class='chip " + (mm[1] === "positive" ? "pos" : "null") + "'>" + mm[1] + "</span>" +
        (mm[2] ? "<span class='v'>" + mm[2].replace("+", "+") + "</span>" : "");
    }
    D.matrix.forEach(function (r) {
      m.appendChild(h("div", "mc", r.component));
      m.appendChild(h("div", "", cell(r.dmv)));
      m.appendChild(h("div", "", cell(r.memlens)));
    });
    var n = h("p", "note", "On DMV-Bench, (D2) and (R1) are main effects in a 2&times;2 with Qwen2.5-VL-7B at J=50, whose " +
      "delivery condition moves the tag and the ordinal together; &dagger; marks (D3) against no date, on temporal-reasoning " +
      "questions. A dash marks a component the benchmark cannot separate or did not measure.");
    m.parentNode.insertBefore(n, m.nextSibling);
  })();

  // ── MemLens by context length ───────────────────────────────────────────
  (function memlens() {
    var M = D.memlens, W = 560, H = 340, L = 44, R = 12, T = 30, B = 44, max = 60;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "MemLens accuracy by context length" }, $("c-memlens"));
    function Y(v) { return T + (1 - v / max) * (H - T - B); }
    for (var t = 0; t <= max; t += 20) {
      el("line", { x1: L, x2: W - R, y1: Y(t), y2: Y(t), stroke: LINE }, svg);
      txt(svg, L - 8, Y(t) + 4, String(t), { "text-anchor": "end", "font-size": 12, fill: INK3 });
    }
    var gw = (W - L - R) / M.lengths.length, bw = 30;
    M.lengths.forEach(function (len, i) {
      var cx = L + gw * (i + .5);
      var bars = [[M.ours[i], RED, "DeliverMem"], [M.direct[i], CHAR, "Qwen3-VL-8B reading everything"], [M.best[i], GREY, "Best published agent"]];
      bars.forEach(function (b, k) {
        var x = cx + (k - 1.5) * (bw + 4) + 2;
        if (b[0] == null) {
          txt(svg, x + bw / 2, Y(0) - 8, "n/a", { "text-anchor": "middle", "font-size": 11, fill: INK3 });
          return;
        }
        var r = el("rect", { x: x, y: Y(b[0]), width: bw, height: Y(0) - Y(b[0]), rx: 4, fill: b[1] }, svg);
        var extra = k === 0 ? "<br>" + M.ratio[i].toFixed(1) + "× less input than the full conversation<br>margin over the best published agent +" + f2(M.margin[i]) : "";
        hover(r, "<b>" + b[2] + ": " + f2(b[0]) + "</b><br>MemLens " + len + extra);
        if (k === 0) txt(svg, x + bw / 2, Y(b[0]) - 7, f2(b[0]), { "text-anchor": "middle", "font-size": 12.5, "font-weight": 700, fill: RED });
      });
      txt(svg, cx, H - B + 20, len, { "text-anchor": "middle", "font-size": 13.5, "font-weight": 600, fill: INK2 });
      txt(svg, cx, H - B + 37, M.ratio[i].toFixed(1) + "× less input", { "text-anchor": "middle", "font-size": 11.5, fill: INK3 });
    });
  })();

  // ── DMV-Bench across memory load ────────────────────────────────────────
  (function dmv() {
    var S = D.dmv.systems, J = D.dmv.J, W = 560, H = 340, L = 44, R = 70, T = 16, B = 40;
    var host = $("c-dmv"), seg = $("dmvSeg"), bb = "qwen";
    function X(i) { return L + 16 + i * (W - L - R - 32) / (J.length - 1); }
    function Y(v) { return T + (1 - v / 100) * (H - T - B); }
    function draw() {
      host.innerHTML = "";
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "DMV-Bench task success rate" }, host);
      for (var t = 0; t <= 100; t += 25) {
        el("line", { x1: L, x2: W - R + 10, y1: Y(t), y2: Y(t), stroke: LINE }, svg);
        txt(svg, L - 8, Y(t) + 4, String(t), { "text-anchor": "end", "font-size": 12, fill: INK3 });
      }
      J.forEach(function (j, i) { txt(svg, X(i), H - B + 22, "J = " + j, { "text-anchor": "middle", "font-size": 13, "font-weight": 600, fill: INK2 }); });
      var order = S.slice().sort(function (a, b) {
        function rank(s) { return s.name === "DeliverMem" ? 2 : s.name === "DualMem" ? 1 : 0; }
        return rank(a) - rank(b);
      });
      order.forEach(function (s) {
        var v = s[bb], ours = s.name === "DeliverMem", dual = s.name === "DualMem";
        var col = ours ? RED : dual ? CHAR : GREY, wdt = ours ? 3.4 : dual ? 2.6 : 1.6;
        var d = v.map(function (y, i) { return (i ? "L" : "M") + X(i) + "," + Y(y); }).join(" ");
        el("path", { d: d, fill: "none", stroke: col, "stroke-width": wdt, "stroke-linejoin": "round" }, svg);
        v.forEach(function (y, i) {
          var c = el("circle", { cx: X(i), cy: Y(y), r: ours || dual ? 5 : 3.2, fill: "#fff", stroke: col, "stroke-width": ours || dual ? 2.4 : 1.6 }, svg);
          hover(c, "<b>" + s.name + ": " + y.toFixed(1) + "</b><br>" + (bb === "qwen" ? "Qwen2.5-VL-7B" : "Gemini 2.5 Flash") + ", J = " + J[i]);
        });
        if (ours || dual) txt(svg, X(J.length - 1) + 12, Y(v[v.length - 1]) + 4, s.name, { "font-size": 12.5, "font-weight": 700, fill: col });
      });
      var o = S.filter(function (s) { return s.name === "DeliverMem"; })[0][bb];
      var du = S.filter(function (s) { return s.name === "DualMem"; })[0][bb];
      o.forEach(function (y, i) {
        txt(svg, X(i), Y(y) - 12, signed(y - du[i], 1), { "text-anchor": "middle", "font-size": 12.5, "font-weight": 700, fill: RED });
      });
    }
    seg.addEventListener("click", function (e) {
      var b = e.target.getAttribute && e.target.getAttribute("data-bb");
      if (!b) return;
      bb = b;
      seg.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-bb") === bb)); });
      draw();
    });
    draw();
  })();

  // ── input cost ──────────────────────────────────────────────────────────
  (function cost() {
    var M = D.memlens, W = 1000, L = 90, R = 150, T = 10, gh = 64, bh = 18;
    var H = T + M.lengths.length * gh + 30, max = 180000;
    function X(v) { return L + v / max * (W - L - R); }
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Delivered tokens against the full conversation" }, $("c-cost"));
    [0, 50000, 100000, 150000].forEach(function (t) {
      el("line", { x1: X(t), x2: X(t), y1: T, y2: H - 26, stroke: LINE }, svg);
      txt(svg, X(t), H - 8, t ? (t / 1000) + "K" : "0", { "text-anchor": "middle", "font-size": 12.5, fill: INK3 });
    });
    M.lengths.forEach(function (len, i) {
      var y = T + i * gh + 6;
      txt(svg, L - 14, y + 24, len, { "text-anchor": "end", "font-size": 15, "font-weight": 700, fill: "#1b1b1f" });
      var a = el("rect", { x: L, y: y, width: Math.max(3, X(M.tokens[i]) - L), height: bh, rx: 4, fill: RED }, svg);
      txt(svg, X(M.tokens[i]) + 8, y + 14, thousands(M.tokens[i]), { "font-size": 13, "font-weight": 700, fill: RED });
      var b = el("rect", { x: L, y: y + bh + 6, width: X(M.full[i]) - L, height: bh, rx: 4, fill: GREY }, svg);
      txt(svg, X(M.full[i]) + 8, y + bh + 20, thousands(M.full[i]), { "font-size": 13, fill: INK2 });
      txt(svg, W - R + 60, y + 26, M.ratio[i].toFixed(1) + "×", { "font-size": 20, "font-weight": 800, fill: RED, "font-family": "Plus Jakarta Sans, Inter, sans-serif" });
      var diff = M.direct[i] == null ? "no direct-inference reference at this length"
        : "accuracy against the same backbone reading everything: " + signed(M.ours[i] - M.direct[i]);
      hover(a, "<b>" + thousands(M.tokens[i]) + " tokens delivered</b><br>MemLens " + len + "<br>" + diff);
      hover(b, "<b>" + thousands(M.full[i]) + " tokens</b> in the full conversation<br>MemLens " + len);
    });
  })();

  // ── BibTeX ──────────────────────────────────────────────────────────────
  $("copyBib").addEventListener("click", function () {
    var b = this, s = $("bibText").textContent;
    function done() { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1400); }
    if (navigator.clipboard) navigator.clipboard.writeText(s).then(done, done); else done();
  });
})();
