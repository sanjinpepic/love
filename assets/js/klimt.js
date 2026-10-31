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
    if (typeof c === "string") c = hex(c);
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

  // Tree crowns: dabs clustered into rounded masses, light on top and violet in
  // the shadow underneath, sized by depth (smaller up the hill, larger near).
  function crowns(r, list, region, opt) {
    var y = opt.y0 || 0;
    while (y < (opt.y1 || 1)) {
      var R = opt.radius(y), step = R * 1.25;
      for (var x = -0.02; x < 1.02; x += step) {
        var cx = x + (r() - 0.5) * step * 0.7, cy = y + (r() - 0.5) * step * 0.5;
        if (!region(cx, cy)) continue;
        var rad = R * (0.75 + r() * 0.5), size = opt.size(cy), count = Math.round(Math.pow(rad / size, 2) * 2.6);
        for (var i = 0; i < count; i++) {
          var a = r() * 6.2832, d = Math.sqrt(r()), px = cx + Math.cos(a) * d * rad, py = cy + Math.sin(a) * d * rad * 0.85;
          if (!region(px, py)) continue;
          var rel = (py - cy) / (rad * 0.85), light = (rel < -0.15 && (px - cx) < rad * 0.35) ? 1 : 0;
          var bias = Math.max(0, rel * 0.9 + 0.35) + (opt.noise ? (opt.noise(px * 5, py * 5) - 0.5) * 0.8 : 0);
          var col = light && r() < 0.85 ? pick(opt.light, r, 0) : pick(opt.palette, r, Math.max(0, bias * 1.6));
          var len = size * (0.42 + r() * 0.36);
          list.push([px, py, len, len * (0.46 + r() * 0.2), (r() - 0.5) * 2.4, jitter(col, r, 24), r() * 0.82 + (opt.late || 0)]);
        }
      }
      y += step * 0.62;
    }
  }

  var SCENES = {
    // Järvsöklack seen across the Ljusnan (after Litzlberg on the Attersee): the hillside fills
    // the square in tree crowns, crossed by a hay meadow; farms and the white church on the shore.
    jarvso: function () {
      var r = rng(2708), n = noise2(rng(27)), s = 0.0135, shore = 0.835;
      var sky = function (x) { return x < 0.3 ? 0.065 - 0.03 * (x / 0.3) : 0.035 + 0.1 * Math.pow((x - 0.3) / 0.7, 1.4); };
      var mt = function (x) { return 0.3 + 0.06 * (x - 0.28) + 0.012 * Math.sin(x * 9); };
      var mb = function (x) { return mt(x) + 0.05 + 0.028 * (x - 0.28); };
      var inMeadow = function (x, y) { return x > 0.26 + 0.06 * (1 - Math.min(1, (y - mt(x)) / 0.05)) && y > mt(x) && y < mb(x); };
      var knoll = function (x, y) { var dx = (x - 0.14) / 0.2, dy = (y - 0.755) / 0.07; return dx * dx + dy * dy < 1 && y < 0.755; };
      var depth = function (y) { return s * (0.55 + 1.25 * Math.max(0, (y - 0.05) / 0.8)); };
      var back = { id: "hill", dabs: [], shapes: [] }, mid = { id: "village", dabs: [], shapes: [] }, water = { id: "water", dabs: [], shapes: [] };

      fill(r, back.dabs, function (x, y) { return y < sky(x) + 0.01; }, { size: s * 1.3, palette: pal([["#7f8fd6", 3], ["#9aa6e0", 2], ["#6d78c4", 2]]), spread: 0.8, angle: 0.2 });
      fill(r, back.dabs, function (x, y) { return y < sky(x) && Math.pow((x - 0.7) / 0.16, 2) + Math.pow((y - 0.025) / 0.025, 2) < 1; }, { size: s * 1.6, palette: pal([["#f1f2f6", 4], ["#dfe3f0", 2]]), spread: 0.5, late: 0.05 });
      fill(r, back.dabs, function (x, y) { return y < sky(x) && Math.pow((x - 0.95) / 0.1, 2) + Math.pow((y - 0.05) / 0.03, 2) < 1; }, { size: s * 1.6, palette: pal([["#f1f2f6", 4], ["#dfe3f0", 2]]), spread: 0.5, late: 0.05 });
      // an under-layer so no paper shows between crowns
      var hillPoly = [];
      for (var hx = 0; hx <= 1.0001; hx += 0.02) hillPoly.push([hx, sky(hx) + 0.006]);
      hillPoly.push([1, shore], [0, shore]);
      back.shapes.push({ c: "#3f763c", p: hillPoly });
      fill(r, back.dabs, function (x, y) { return y >= sky(x) && y < shore && !inMeadow(x, y); }, { size: s * 1.3, step: 0.62, palette: pal([["#4d8787", 3], ["#287f7c", 3], ["#5c63a6", 1.2], ["#1f6a62", 1.5]]), spread: 2, jit: 20 });
      var forest = pal([["#9acc6f", 1.3], ["#7ec375", 2.2], ["#68b07d", 2.6], ["#4fac7b", 2], ["#359a7e", 2.2], ["#287f7c", 2.2], ["#4d8787", 2], ["#6c6fb2", 1.4], ["#4f74a8", 0.9], ["#1f6a62", 1.2]]);
      var lightPal = pal([["#b8dc6a", 3], ["#9acc6f", 3], ["#d8d64e", 0.8], ["#8fd08a", 1.5]]);
      crowns(r, back.dabs, function (x, y) { return y >= sky(x) - 0.004 && y < shore - 0.01 && !inMeadow(x, y) && !knoll(x, y); },
        { radius: function (y) { return 0.026 + 0.05 * Math.max(0, (y - 0.05) / 0.8); }, size: depth, palette: forest, light: lightPal, noise: n });
      // the hay meadow: discrete bright dabs, not a smear
      fill(r, back.dabs, inMeadow, { size: s * 1.15, step: 0.62, palette: pal([["#9ee05b", 1.2], ["#88d869", 2.4], ["#78d472", 2.8], ["#65c76e", 2.4], ["#3d996f", 0.8]]), spread: 0.9, angle: 0.06, ratio: 0.5, jit: 30, late: 0.02 });
      fill(r, back.dabs, knoll, { size: s * 1.2, step: 0.62, palette: pal([["#65c76e", 3], ["#78d472", 2], ["#88d869", 1.4], ["#3d996f", 0.8]]), spread: 1, angle: -0.15, jit: 26 });

      // the village, all in dabs
      var trees = pal([["#289d68", 2], ["#1f8b67", 2.4], ["#0c7962", 2.4], ["#0a605a", 2], ["#1f7364", 1.6], ["#55746a", 1], ["#5a5c9e", 0.7]]);
      [[0.03, 0.755, 0.06], [0.27, 0.745, 0.05], [0.36, 0.765, 0.045], [0.53, 0.745, 0.06], [0.71, 0.755, 0.055], [0.98, 0.745, 0.06]].forEach(function (t) {
        crowns(r, mid.dabs, function (x, y) { var dx = (x - t[0]) / t[2], dy = (y - t[1]) / (t[2] * 1.1); return dx * dx + dy * dy < 1 && y < shore; },
          { y0: t[1] - t[2] * 1.1, y1: t[1] + t[2] * 1.1, radius: function () { return t[2] * 0.5; }, size: function () { return s * 1.05; }, palette: trees, light: pal([["#6faa44", 2], ["#8fc04a", 1]]), late: 0.06 });
      });
      function block(x0, x1, y0, y1, palette, size) {
        fill(r, mid.dabs, function (x, y) { return x > x0 && x < x1 && y > y0 && y < y1; }, { size: size || s * 0.75, step: 0.42, palette: palette, spread: 0.35, jit: 16, late: 0.12 });
      }
      function house(x0, x1, yb, h, wall, roof, roofH) {
        block(x0, x1, yb - h, yb, pal([[wall, 5], [wall === "#efeee6" ? "#ffffff" : "#c05a44", 1], ["#9a9a92", wall === "#efeee6" ? 0.6 : 0]]));
        fill(r, mid.dabs, function (x, y) { var t = (yb - h - y) / roofH; return y < yb - h + 0.002 && y > yb - h - roofH && x > x0 - 0.006 + t * (x1 - x0) * 0.12 && x < x1 + 0.006 - t * (x1 - x0) * 0.12; }, { size: s * 0.75, step: 0.42, palette: pal([["#508693", 3], ["#64a0a4", 2], ["#2c6473", 2], ["#88b0ad", 1]]), spread: 0.3, jit: 16, late: 0.13 });
                // windows: small dark panes with a pale frame, never round
        var nwin = Math.max(2, Math.round((x1 - x0) / 0.028));
        for (var k = 0; k < nwin; k++) {
          var wx = x0 + (x1 - x0) * ((k + 0.5) / nwin) + (r() - 0.5) * 0.004, wy = yb - h * 0.62, ww = 0.0075, wh = h * 0.34;
          mid.shapes.push({ c: wall === "#efeee6" ? "#c9c6b8" : "#e8e2d4", p: [[wx - ww * 0.7, wy - wh * 0.12], [wx + ww * 0.7, wy - wh * 0.12], [wx + ww * 0.7, wy + wh * 1.08], [wx - ww * 0.7, wy + wh * 1.08]], late: true });
          mid.shapes.push({ c: "#3e4658", p: [[wx - ww / 2, wy], [wx + ww / 2, wy], [wx + ww / 2, wy + wh], [wx - ww / 2, wy + wh]], late: true });
        }
      }
      house(0.05, 0.22, shore - 0.008, 0.045, "#efeee6", "#5b5e6c", 0.03);
      house(0.26, 0.33, shore - 0.012, 0.035, "#a8402e", "#4a4c58", 0.026);
      house(0.43, 0.54, shore - 0.01, 0.05, "#efeee6", "#4a4c58", 0.03);
      block(0.405, 0.435, shore - 0.135, shore - 0.01, pal([["#efeee6", 5], ["#ffffff", 1], ["#c9ccd2", 1]]), s * 0.6);
      fill(r, mid.dabs, function (x, y) { return y > shore - 0.178 && y < shore - 0.133 && Math.abs(x - 0.42) < 0.02 * (y - (shore - 0.178)) / 0.045 + 0.002; }, { size: s * 0.55, step: 0.42, palette: pal([["#3e404c", 4], ["#55586a", 1]]), spread: 0.3, late: 0.14 });
      fill(r, mid.dabs, function (x, y) { return y > shore - 0.22 && y < shore - 0.176 && Math.abs(x - 0.42) < 0.0045; }, { size: s * 0.45, step: 0.42, palette: pal([["#3e404c", 1]]), spread: 0.2, angle: 1.57, late: 0.15 });
      house(0.6, 0.69, shore - 0.008, 0.04, "#a8402e", "#4a4c58", 0.03);
      house(0.76, 0.86, shore - 0.01, 0.042, "#b0473a", "#3e404c", 0.032);
      [[0.885, 0.165], [0.925, 0.2], [0.955, 0.14]].forEach(function (t) {
        fill(r, mid.dabs, function (x, y) { var hy = shore - t[1]; if (y < hy || y > shore) return false; return Math.abs(x - t[0]) < 0.022 * (y - hy) / t[1] + 0.004; }, { size: s * 0.85, step: 0.45, palette: pal([["#244a32", 3], ["#2f5a34", 3], ["#3d6e3a", 1], ["#2c2f5e", 0.8]]), spread: 0.8, angle: 1.57, late: 0.1 });
      });
      fill(r, mid.dabs, function (x, y) { return y > shore - 0.006 && y < shore + 0.008; }, { size: s * 0.9, palette: pal([["#9ee05b", 3], ["#d8d64e", 1.2]]), spread: 0.2, ratio: 0.4, late: 0.15 });

      // the river: deep, green with the hill, the village mirrored in vertical strokes
      var wpal = pal([["#b2d49c", 1.6], ["#a3c59c", 2], ["#93bf96", 2.6], ["#87bc95", 2], ["#7caf93", 2], ["#6ead93", 2], ["#5c9c8d", 1.2], ["#9aa6c8", 0.6]]);
      fill(r, water.dabs, function (x, y) { return y > shore + 0.006; }, { size: s * 1.3, step: 0.5, palette: wpal, angle: 0, spread: 0.12, ratio: 0.32, jit: 16, late: 0.18, y0: shore - 0.01 });
      fill(r, water.dabs, function (x, y) { return y > shore + 0.006 && y < shore + 0.07 && r() < 0.5; }, { size: s * 1.2, palette: pal([["#4fac7b", 3], ["#287f7c", 2], ["#6c6fb2", 1]]), angle: 0, spread: 0.1, ratio: 0.3, jit: 18, late: 0.19, y0: shore });
      [[0.05, 0.22, "#e6e8e0"], [0.26, 0.33, "#a8402e"], [0.405, 0.435, "#e6e8e0"], [0.43, 0.54, "#e6e8e0"], [0.6, 0.69, "#9a4232"], [0.76, 0.86, "#a24a3c"], [0.87, 0.97, "#2a4a3a"], [0.0, 0.05, "#3d6e3a"]].forEach(function (h) {
        var deep = h[1] - h[0] < 0.04 ? 0.15 : 0.09;
        fill(r, water.dabs, function (x, y) { return x > h[0] && x < h[1] && y > shore + 0.008 && y < shore + deep && r() < 0.6; }, { size: s * 1.05, palette: pal([[h[2], 3], ["#a9c4a8", 1]]), angle: 1.57, spread: 0.12, ratio: 0.26, jit: 18, late: 0.2, y0: shore });
      });
      return { layers: [back, mid, water] };
    },

    // An orchard in late summer, after Pear Tree: a canopy of greens with yellow-green
    // light and small pears, violet only in shadow; trunks and one birch painted in strokes.
    orchard: function () {
      var r = rng(2808), n = noise2(rng(28)), s = 0.0115;
      var back = { id: "canopy", dabs: [], shapes: [] }, mid = { id: "trunks", dabs: [], shapes: [] };
      var canopy = pal([["#d8d64e", 0.9], ["#9acc6f", 2], ["#7ec375", 2.6], ["#4fac7b", 2.6], ["#359a7e", 2.2], ["#1f6a62", 1.6], ["#6c6fb2", 1], ["#4f74a8", 0.6]]);
      fill(r, back.dabs, function (x, y) { return y < 0.66 + 0.04 * Math.sin(x * 7); }, { size: s, palette: canopy, noise: n, dark: 1.6, spread: 2.6, jit: 28 });
      crowns(r, back.dabs, function (x, y) { return y < 0.64 + 0.04 * Math.sin(x * 7); }, { radius: function () { return 0.06; }, size: function () { return s * 1.05; }, palette: canopy, light: pal([["#e2e86a", 2], ["#c8de60", 2]]), noise: n });
      fill(r, back.dabs, function (x, y) { return y > 0.6 && y < 0.82; }, { size: s * 0.7, step: 0.5, palette: pal([["#3f8a5a", 3], ["#5b63b4", 1.4], ["#2f6a5a", 2], ["#8fc44a", 1.2], ["#c9dc5a", 0.6], ["#d06a5a", 0.3]]), spread: 2.6, jit: 30 });
      fill(r, back.dabs, function (x, y) { return y >= 0.82; }, { size: s * 1.2, palette: pal([["#8fd04a", 3], ["#7cc044", 2], ["#a6dc58", 1.5], ["#6aaa40", 1]]), spread: 0.5, ratio: 0.5, jit: 18 });
      for (var i = 0; i < 70; i++) { back.dabs.push([r(), r() * 0.6, s * 0.42, s * 0.36, r() * 3, "rgb(232,236,120)", 0.5 + r() * 0.4]); }
      function trunk(x, w, top, cols, lean) {
        fill(r, mid.dabs, function (px, py) { var t = (0.97 - py) / (0.97 - top), cx = x + lean * t + (n(py * 14, x * 9) - 0.5) * w * 0.5; return py > top && py < 0.97 && Math.abs(px - cx) < w / 2 * (0.65 + 0.7 * n(py * 22, x * 13)); },
          { size: s * 0.8, step: 0.42, palette: cols, angle: 1.45, spread: 0.9, ratio: 0.42, jit: 26, late: 0.15 });
      }
      var bark = pal([["#7a6450", 4], ["#8c7660", 2], ["#5e4c3e", 2], ["#8a9a6a", 0.8]]);
      [[0.08, 0.035, 0.62, 0.01], [0.3, 0.03, 0.66, -0.02], [0.45, 0.018, 0.7, 0.005], [0.84, 0.04, 0.6, 0.03], [0.95, 0.03, 0.63, -0.01], [0.56, 0.014, 0.72, 0]].forEach(function (t) { trunk(t[0], t[1], t[2], bark, t[3]); });
      trunk(0.68, 0.06, 0.55, pal([["#d6d5ca", 4], ["#c2c1b4", 2], ["#2c2c28", 1.2], ["#a0aa6e", 0.8]]), -0.01);
      return { layers: [back, mid] };
    },
  };

  // shared with journey.js (the walk through the forest)
  window.KlimtPaint = { rng: rng, noise2: noise2, pal: pal, pick: pick, jitter: jitter, fill: fill, crowns: crowns, scenes: SCENES };

  // ——— painter ————————————————————————————————————————————————————————————
  function Painting(el) {
    this.el = el;
    var ids = { jarvso: ["hill", "village", "water"], orchard: ["canopy", "trunks"] }[el.dataset.scene];
    var self = this;
    // the scene is generated when it is first painted, not on page load
    Object.defineProperty(this, "scene", { get: function () { return self._scene || (self._scene = SCENES[el.dataset.scene](0)); } });
    this.canvases = ids.map(function (id) {
      var c = document.createElement("canvas");
      c.className = "k-layer k-" + id;
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
  Painting.prototype.drawShapes = function (ctx, shapes, S, late) {
    shapes.forEach(function (sh) {
      if (!!sh.late !== !!late) return;
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
      layers.forEach(function (ly, i) { ly.dabs.forEach(function (d) { self.drawDab(ctxs[i], d, S); }); self.drawShapes(ctxs[i], ly.shapes, S, true); });
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
      if (p < 1) requestAnimationFrame(step);
      else { layers.forEach(function (ly, i) { self.drawShapes(ctxs[i], ly.shapes, S, true); }); if (done) done(); }
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
