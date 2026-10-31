/* Klimt landscapes, painted live in canvas: thousands of small dabs laid down
   one by one, after Litzlberg on the Attersee and Pear Tree. Seeded, so every
   visit paints the same picture. Scenes are square, in unit coordinates. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rng(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function noise2(r) { // smooth value noise for colour drift
    var g = [], N = 32, i;
    for (i = 0; i < N * N; i++) g.push(r());
    function v(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      xf = xf * xf * (3 - 2 * xf); yf = yf * yf * (3 - 2 * yf);
      var a = g[((yi % N + N) % N) * N + ((xi % N + N) % N)], b = g[((yi % N + N) % N) * N + (((xi + 1) % N + N) % N)];
      var c = g[(((yi + 1) % N + N) % N) * N + ((xi % N + N) % N)], d = g[(((yi + 1) % N + N) % N) * N + (((xi + 1) % N + N) % N)];
      return (a + (b - a) * xf) + ((c + (d - c) * xf) - (a + (b - a) * xf)) * yf;
    }
    return function (x, y) { return v(x, y) * 0.65 + v(x * 2.3, y * 2.3) * 0.35; };
  }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function jitter(c, r, amt) {
    var k = (r() - 0.5) * amt;
    return "rgb(" + Math.max(0, Math.min(255, Math.round(c[0] + k))) + "," + Math.max(0, Math.min(255, Math.round(c[1] + k))) + "," + Math.max(0, Math.min(255, Math.round(c[2] + k))) + ")";
  }
  function pal(list) { return list.map(function (p) { return { c: hex(p[0]), w: p[1] }; }); }
  function pick(p, r, bias) {
    // bias in [0,1] shifts the choice toward the end of the list (darker entries)
    var tot = 0, i;
    for (i = 0; i < p.length; i++) tot += p[i].w * (1 + bias * i * 0.6);
    var x = r() * tot;
    for (i = 0; i < p.length; i++) { x -= p[i].w * (1 + bias * i * 0.6); if (x <= 0) return p[i].c; }
    return p[p.length - 1].c;
  }

  // ——— scenes ———————————————————————————————————————————————————————————
  // Each returns { layers: [ { id, dabs: [...], shapes: [...] } ] }. A dab is
  // [x, y, rx, ry, angle, colour, order]; shapes are flat polygons painted first.

  function fill(r, list, region, opt) {
    // scatter dabs over a region test function on a jittered grid
    var s = opt.size, step = s * (opt.step || 0.55), n = opt.noise, bias = opt.bias || 0;
    for (var y = opt.y0 || 0; y < (opt.y1 || 1); y += step * 0.8) {
      for (var x = -0.01; x < 1.01; x += step) {
        var px = x + (r() - 0.5) * step, py = y + (r() - 0.5) * step * 0.8;
        if (!region(px, py)) continue;
        var b = n ? Math.max(0, Math.min(1, (n(px * 6, py * 6) - 0.35) * 1.8)) : 0;
        var col = pick(opt.palette, r, bias + b * (opt.dark || 0));
        var ang = (opt.angle || 0) + (r() - 0.5) * (opt.spread == null ? 1.6 : opt.spread);
        var len = s * (0.42 + r() * 0.36), wid = len * (opt.ratio || 0.48) * (0.8 + r() * 0.4);
        list.push([px, py, len, wid, ang, jitter(col, r, opt.jit || 26), r() * 0.82 + (opt.late || 0)]);
      }
    }
  }

  var SCENES = {
    // Järvsöklack seen across the Ljusnan: the hillside fills the square, crossed by a hay meadow;
    // red farms and the white church along the shore; the river below.
    jarvso: function (S) {
      var r = rng(2708), n = noise2(rng(27)), s = 0.0145;
      var sky = function (x) { return x < 0.3 ? 0.065 - 0.03 * (x / 0.3) : 0.035 + 0.1 * Math.pow((x - 0.3) / 0.7, 1.4); };
      var mt = function (x) { return 0.31 + 0.06 * (x - 0.28) + 0.012 * Math.sin(x * 9); };
      var mb = function (x) { return mt(x) + 0.055 + 0.03 * (x - 0.28); };
      var inMeadow = function (x, y) { return x > 0.26 + 0.06 * (1 - Math.min(1, (y - mt(x)) / 0.05)) && y > mt(x) && y < mb(x); };
      var knoll = function (x, y) { var dx = (x - 0.14) / 0.2, dy = (y - 0.8) / 0.075; return dx * dx + dy * dy < 1 && y < 0.8; };
      var shore = 0.885;
      var back = { id: "hill", dabs: [], shapes: [] }, mid = { id: "village", dabs: [], shapes: [] }, water = { id: "water", dabs: [], shapes: [] };

      // sky: violet-blue with white cloud
      fill(r, back.dabs, function (x, y) { return y < sky(x); }, { size: s * 1.3, palette: pal([["#7f8fd6", 3], ["#9aa6e0", 2], ["#6d78c4", 2], ["#eef0f6", 0]]), spread: 0.8, angle: 0.2 });
      fill(r, back.dabs, function (x, y) { return y < sky(x) && Math.pow((x - 0.7) / 0.16, 2) + Math.pow((y - 0.025) / 0.025, 2) < 1; }, { size: s * 1.6, palette: pal([["#f1f2f6", 4], ["#dfe3f0", 2]]), spread: 0.5, late: 0.05 });
      fill(r, back.dabs, function (x, y) { return y < sky(x) && Math.pow((x - 0.95) / 0.1, 2) + Math.pow((y - 0.05) / 0.03, 2) < 1; }, { size: s * 1.6, palette: pal([["#f1f2f6", 4], ["#dfe3f0", 2]]), spread: 0.5, late: 0.05 });
      // the forested hillside: greens with violet shadow, yellow-green light
      var forest = pal([["#d4e05a", 0.9], ["#a8d050", 2], ["#7fb84a", 2.6], ["#5a9e44", 2.8], ["#3f7f3e", 2.6], ["#6a70b8", 1.3], ["#2f5a3a", 1.8], ["#41468a", 1.1]]);
      fill(r, back.dabs, function (x, y) { return y >= sky(x) - 0.004 && y < shore && !inMeadow(x, y) && !knoll(x, y); }, { size: s, palette: forest, noise: n, dark: 1.4, spread: 2.2, jit: 30 });
      // late-summer hay meadow across the slope
      fill(r, back.dabs, inMeadow, { size: s * 1.25, palette: pal([["#b9dc5c", 3], ["#a6d452", 3], ["#cfe06e", 2], ["#93c64a", 1]]), spread: 0.5, angle: 0.06, ratio: 0.55, jit: 14, late: 0.02 });
      // a bright knoll by the shore
      fill(r, back.dabs, knoll, { size: s * 1.2, palette: pal([["#8fd04a", 3], ["#a6dc58", 2], ["#78bf40", 1]]), spread: 0.6, angle: -0.15, jit: 14 });

      // the village: farms, the church, dark trees, two spruces
      function house(x0, x1, yb, h, wall, roof, roofH) {
        var shapes = mid.shapes;
        shapes.push({ c: wall, p: [[x0, yb], [x0, yb - h], [x1, yb - h], [x1, yb]] });
        shapes.push({ c: roof, p: [[x0 - 0.008, yb - h], [x0 + (x1 - x0) * 0.12, yb - h - roofH], [x1 - (x1 - x0) * 0.12, yb - h - roofH], [x1 + 0.008, yb - h]] });
        fill(r, mid.dabs, function (x, y) { return x > x0 && x < x1 && y > yb - h && y < yb; }, { size: s * 0.7, palette: pal([[wall, 4], ["#ffffff", wall === "#efeee6" ? 1 : 0.15]]), spread: 0.3, jit: 18, late: 0.12, step: 0.7 });
        fill(r, mid.dabs, function (x, y) { return y < yb - h && y > yb - h - roofH && x > x0 - 0.006 + (yb - h - y) / roofH * (x1 - x0) * 0.12 && x < x1 + 0.006 - (yb - h - y) / roofH * (x1 - x0) * 0.12; }, { size: s * 0.7, palette: pal([[roof, 4], ["#6a6c78", 1]]), spread: 0.25, jit: 16, late: 0.12, step: 0.7 });
        for (var k = 0; k < Math.round((x1 - x0) / 0.03); k++) shapes.push({ c: "#2c3138", p: rect(x0 + 0.012 + k * 0.03, yb - h * 0.62, 0.008, h * 0.3) });
      }
      function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
      // dark tree masses behind the houses
      var trees = pal([["#2f5a34", 3], ["#3d6e3a", 3], ["#4f8a3e", 2], ["#2a4a3a", 2], ["#3a3f78", 0.8]]);
      [[0.03, 0.80, 0.06], [0.27, 0.79, 0.05], [0.36, 0.81, 0.045], [0.52, 0.79, 0.06], [0.7, 0.80, 0.055], [0.98, 0.79, 0.06]].forEach(function (t) {
        fill(r, mid.dabs, function (x, y) { var dx = (x - t[0]) / t[2], dy = (y - t[1]) / (t[2] * 1.1); return dx * dx + dy * dy < 1 && y < shore; }, { size: s * 0.95, palette: trees, spread: 2.4, late: 0.06 });
      });
      house(0.05, 0.22, shore - 0.008, 0.045, "#efeee6", "#5b5e6c", 0.03);   // white farmhouse, long
      house(0.26, 0.33, shore - 0.012, 0.035, "#a8402e", "#4a4c58", 0.026); // red barn
      // the church on Kyrkön: nave and tall tower
      house(0.43, 0.54, shore - 0.01, 0.05, "#efeee6", "#4a4c58", 0.03);
      mid.shapes.push({ c: "#efeee6", p: rect(0.405, shore - 0.135, 0.03, 0.125) });
      mid.shapes.push({ c: "#3e404c", p: [[0.4, shore - 0.135], [0.42, shore - 0.175], [0.44, shore - 0.135]] });
      mid.shapes.push({ c: "#3e404c", p: [[0.416, shore - 0.175], [0.42, shore - 0.215], [0.424, shore - 0.175]] });
      fill(r, mid.dabs, function (x, y) { return x > 0.405 && x < 0.435 && y > shore - 0.135 && y < shore - 0.01; }, { size: s * 0.6, palette: pal([["#efeee6", 4], ["#d8dbe0", 1]]), spread: 0.2, jit: 12, late: 0.14, step: 0.7 });
      mid.shapes.push({ c: "#2c3138", p: rect(0.416, shore - 0.115, 0.008, 0.014) });
      house(0.6, 0.69, shore - 0.008, 0.04, "#a8402e", "#4a4c58", 0.03);    // red farm
      house(0.76, 0.86, shore - 0.01, 0.042, "#b0473a", "#3e404c", 0.032);  // red farm with dark roof
      // spruces, like Klimt's cypresses
      [[0.885, 0.165], [0.925, 0.2], [0.955, 0.14]].forEach(function (t) {
        fill(r, mid.dabs, function (x, y) { var hy = shore - t[1]; if (y < hy || y > shore) return false; var w = 0.022 * (y - hy) / t[1] + 0.004; return Math.abs(x - t[0]) < w; }, { size: s * 0.85, palette: pal([["#244a32", 3], ["#2f5a34", 3], ["#3d6e3a", 1], ["#2c2f5e", 0.6]]), spread: 0.8, angle: 1.57, late: 0.1 });
      });
      // a thin bright shoreline
      fill(r, mid.dabs, function (x, y) { return y > shore - 0.006 && y < shore + 0.007; }, { size: s * 0.9, palette: pal([["#8fd04a", 3], ["#b9dc5c", 2]]), spread: 0.2, ratio: 0.4, late: 0.15 });

      // the river: long pale dabs, with the village reflected
      var wpal = pal([["#b5c8b8", 3], ["#c8d3c6", 2], ["#9fb3a2", 2], ["#a9b4cc", 1.5], ["#8fa896", 1.2], ["#d6dccf", 1]]);
      fill(r, water.dabs, function (x, y) { return y > shore + 0.005; }, { size: s * 1.25, palette: wpal, angle: 0, spread: 0.12, ratio: 0.32, jit: 16, late: 0.18, y0: shore - 0.01 });
      [[0.05, 0.22, "#e6e8e0"], [0.26, 0.33, "#a8402e"], [0.405, 0.54, "#e6e8e0"], [0.6, 0.69, "#9a4232"], [0.76, 0.86, "#a24a3c"], [0.87, 0.97, "#2f5a34"], [0.0, 0.05, "#3d6e3a"], [0.5, 0.58, "#3d6e3a"]].forEach(function (h) {
        fill(r, water.dabs, function (x, y) { return x > h[0] && x < h[1] && y > shore + 0.008 && y < shore + 0.065 && r() < 0.55; }, { size: s * 1.1, palette: pal([[h[2], 3], ["#b5c8b8", 1]]), angle: 0, spread: 0.1, ratio: 0.3, jit: 18, late: 0.2, y0: shore });
      });
      return { layers: [back, mid, water] };
    },

    // An orchard in late summer, after Pear Tree: a canopy of dabs with small
    // pears, a hedge behind, trunks, one birch, and bright grass.
    orchard: function (S) {
      var r = rng(2808), n = noise2(rng(28)), s = 0.0115;
      var back = { id: "canopy", dabs: [], shapes: [] }, mid = { id: "trunks", dabs: [], shapes: [] };
      var canopy = pal([["#d8e05a", 0.8], ["#9fcf4c", 2], ["#6fb04a", 2.6], ["#3f8a5a", 2.4], ["#5b63b4", 2], ["#7a6cc0", 1], ["#2f6a5a", 1.6], ["#3e3f86", 0.9]]);
      fill(r, back.dabs, function (x, y) { return y < 0.66 + 0.04 * Math.sin(x * 7); }, { size: s, palette: canopy, noise: n, dark: 1.1, spread: 2.6, jit: 34 });
      fill(r, back.dabs, function (x, y) { return y > 0.6 && y < 0.82; }, { size: s * 0.7, palette: pal([["#5b63b4", 2], ["#3f8a5a", 2], ["#7a6cc0", 1], ["#2f6a5a", 2], ["#c9dc5a", 0.6], ["#d06a5a", 0.3]]), spread: 2.6, jit: 30, step: 0.5 });
      fill(r, back.dabs, function (x, y) { return y >= 0.82; }, { size: s * 1.2, palette: pal([["#8fd04a", 3], ["#7cc044", 2], ["#a6dc58", 1.5], ["#6aaa40", 1]]), spread: 0.4, ratio: 0.5, jit: 14 });
      // pears among the leaves
      for (var i = 0; i < 70; i++) { var px = r(), py = r() * 0.6; back.dabs.push([px, py, s * 0.42, s * 0.36, r() * 3, "rgb(232,236,120)", 0.5 + r() * 0.4]); }
      // trunks
      function trunk(x, w, top, col, lean) {
        mid.shapes.push({ c: col, p: [[x - w / 2, 0.97], [x - w / 2 + lean, top], [x + w / 2 + lean, top], [x + w / 2, 0.97]] });
        fill(r, mid.dabs, function (px, py) { var t = (0.97 - py) / (0.97 - top), cx = x + lean * t; return py > top && py < 0.97 && Math.abs(px - cx) < w / 2; }, { size: s * 0.7, palette: pal([[col, 4], ["#6a5a4a", 1], ["#8a9a6a", 0.6]]), angle: 1.57, spread: 0.5, late: 0.15, step: 0.6 });
      }
      [[0.08, 0.035, 0.62, "#7a6450", 0.01], [0.3, 0.03, 0.66, "#806a54", -0.02], [0.45, 0.018, 0.7, "#7a6450", 0.005], [0.84, 0.04, 0.6, "#7a6450", 0.03], [0.95, 0.03, 0.63, "#806a54", -0.01], [0.56, 0.014, 0.72, "#7a6450", 0]].forEach(function (t) { trunk(t[0], t[1], t[2], t[3], t[4]); });
      // the birch: pale bark with dark marks and lichen
      trunk(0.68, 0.06, 0.55, "#c9c8bc", -0.01);
      for (i = 0; i < 26; i++) { var by = 0.58 + r() * 0.38; mid.dabs.push([0.66 + r() * 0.04, by, s * (0.5 + r() * 0.6), s * 0.22, r() * 0.6 - 0.3, r() < 0.6 ? "rgb(44,44,40)" : "rgb(160,170,110)", 0.4 + r() * 0.4]); }
      return { layers: [back, mid] };
    },
  };

  // ——— painter ————————————————————————————————————————————————————————————
  function Painting(el) {
    this.el = el;
    this.scene = SCENES[el.dataset.scene](0);
    this.canvases = this.scene.layers.map(function (ly) {
      var c = document.createElement("canvas");
      c.className = "k-layer k-" + ly.id;
      c.setAttribute("aria-hidden", "true");
      el.appendChild(c);
      return c;
    });
    this.size = 0;
    this.resize();
  }
  Painting.prototype.resize = function () {
    var rect = this.el.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var S = Math.round(rect.width * dpr);
    if (!S || S === this.size) return false;
    this.size = S;
    this.canvases.forEach(function (c) { c.width = S; c.height = S; });
    return true;
  };
  Painting.prototype.drawShapes = function (ctx, shapes, S) {
    shapes.forEach(function (sh) {
      ctx.fillStyle = sh.c;
      ctx.beginPath();
      sh.p.forEach(function (p, i) { if (i) ctx.lineTo(p[0] * S, p[1] * S); else ctx.moveTo(p[0] * S, p[1] * S); });
      ctx.closePath(); ctx.fill();
    });
  };
  Painting.prototype.drawDab = function (ctx, d, S, dx) {
    ctx.fillStyle = d[5];
    ctx.beginPath();
    ctx.ellipse((d[0] + (dx || 0)) * S, d[1] * S, d[2] * S, d[3] * S, d[4], 0, 6.2832);
    ctx.fill();
  };
  // Paint everything at once (resize, reduced motion) or lay the dabs down over `ms`.
  Painting.prototype.paint = function (ms, done) {
    var self = this, S = this.size, layers = this.scene.layers;
    var ctxs = this.canvases.map(function (c) { var x = c.getContext("2d"); x.clearRect(0, 0, S, S); return x; });
    layers.forEach(function (ly, i) { self.drawShapes(ctxs[i], ly.shapes, S); });
    if (!ms) {
      layers.forEach(function (ly, i) { ly.dabs.forEach(function (d) { self.drawDab(ctxs[i], d, S); }); });
      if (done) done();
      return;
    }
    var all = [];
    layers.forEach(function (ly, i) { ly.dabs.forEach(function (d) { all.push([d, i]); }); });
    all.sort(function (a, b) { return a[0][6] - b[0][6]; });
    var t0 = performance.now(), k = 0;
    (function step(now) {
      var p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 2.2), until = Math.floor(e * all.length);
      for (; k < until; k++) self.drawDab(ctxs[all[k][1]], all[k][0], S);
      if (p < 1) requestAnimationFrame(step); else if (done) done();
    })(t0);
  };
  // The river keeps moving: its dabs drift on a slow sine.
  Painting.prototype.shimmer = function () {
    var idx = -1, self = this;
    this.scene.layers.forEach(function (ly, i) { if (ly.id === "water") idx = i; });
    if (idx < 0 || reduce) return;
    var ctx = this.canvases[idx].getContext("2d"), dabs = this.scene.layers[idx].dabs, visible = true, last = 0;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(this.el);
    (function loop(t) {
      requestAnimationFrame(loop);
      if (!visible || t - last < 40) return;
      last = t;
      var S = self.size;
      ctx.clearRect(0, 0, S, S);
      for (var i = 0; i < dabs.length; i++) {
        var d = dabs[i];
        self.drawDab(ctx, d, S, Math.sin(t / 1600 + d[1] * 90 + d[0] * 4) * 0.0035);
      }
    })(0);
  };

  // Depth: the village and river sit a little in front of the hill.
  function parallax(paintings) {
    if (reduce) return;
    var tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      tx = e.clientX / window.innerWidth * 2 - 1; ty = e.clientY / window.innerHeight * 2 - 1;
    }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
      paintings.forEach(function (p) {
        p.canvases.forEach(function (c, i) {
          var d = i * 3;
          c.style.transform = "translate3d(" + (-cx * d).toFixed(2) + "px," + (-cy * d * 0.6).toFixed(2) + "px,0) scale(1.03)";
        });
      });
      requestAnimationFrame(loop);
    })();
  }

  var els = [].slice.call(document.querySelectorAll("[data-scene]"));
  var paintings = els.map(function (el) { return new Painting(el); });
  paintings.forEach(function (p, i) {
    var start = function () {
      p.paint(reduce ? 0 : (i === 0 ? 2600 : 2000), function () {
        p.el.classList.add("is-painted");
        if (i === 0) document.dispatchEvent(new CustomEvent("painted"));
        p.shimmer();
      });
    };
    if (i === 0 || !("IntersectionObserver" in window)) start();
    else {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); start(); } }, { threshold: 0.25 });
      io.observe(p.el);
    }
  });
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { paintings.forEach(function (p) { if (p.resize()) p.paint(0); }); }, 200);
  });
  parallax(paintings);
})();
