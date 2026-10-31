/* The walk: you arrive inside a forest Klimt might have painted — birch trunks
   with almond eyes, Trees of Life curling gold spirals, a floor of leaves and
   Kiss flowers, gold leaf glinting between the trees — all moving in the wind.
   Scrolling walks you down the path; the wood opens on Järvsö dal, and the
   valley settles into the square of the print.
   Uses the dab painter from klimt.js (window.KlimtPaint). */
(function () {
  "use strict";
  var K = window.KlimtPaint, section = document.querySelector("[data-journey]");
  if (!K || !section) return;
  // Devices that ask for less motion still get the walk, driven only by their own
  // scrolling: no drifting gold, no breathing camera, no pointer drift, no glide.
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage = section.querySelector(".journey-stage");
  var canvas = section.querySelector(".journey-canvas"), ctx = canvas.getContext("2d");
  var slot = section.querySelector(".painting-slot");
  var intro = section.querySelector(".journey-intro"), cue = section.querySelector(".journey-cue");
  var label = section.querySelector(".journey-final");
  var lines = [].slice.call(section.querySelectorAll(".jl")).map(function (el) { return { el: el, a: +el.dataset.from, b: +el.dataset.to }; });
  var rail = section.querySelector(".journey-rail span");
  var shade = section.querySelector(".journey-shade");
  var PAPER = "#f6f7f3";
  // ?export=1 paints the trees, the wood and the valley once at high resolution with the
  // full brush, for tools/klimt/export.js to save as images. Otherwise the saved images
  // (window.KLIMT_ASSETS) are used, and live painting is only the fallback.
  var EXPORT = /[?&]export=1\b/.test(location.search), RES = EXPORT ? 1.15 : 1;
  var A = EXPORT ? null : window.KLIMT_ASSETS;
  var GOLDS = ["#c9a043", "#d9b44a", "#e8c96a", "#b8902f", "#f0d890", "#a77d27"];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ——— painting helpers ——————————————————————————————————————————————————
  function off(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function dab(c, x, y, rx, ry, a, col) {
    if (EXPORT) return stroke(c, x, y, rx, ry, a, col);
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, 6.2832); c.fill();
  }
  // The full brush (export only): a tapered, slightly curved stroke loaded with
  // paint, with a thin lighter ridge where the bristles drag — closer to Klimt's touch.
  function lighten(col, k) {
    var m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col), v;
    if (m) v = [+m[1], +m[2], +m[3]]; else if (col.charAt(0) === "#") v = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)]; else return col;
    return "rgb(" + v.map(function (x) { return Math.min(255, Math.round(x + (255 - x) * k)); }).join(",") + ")";
  }
  function stroke(c, x, y, rx, ry, a, col) {
    if (rx < 1.2) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0.3, rx), Math.max(0.3, ry), a, 0, 6.2832); c.fill(); return; }
    var bend = ((x * 13.7 + y * 7.3) % 1) - 0.5;
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = col; c.beginPath();
    c.moveTo(-rx, ry * 0.15);
    c.bezierCurveTo(-rx * 0.6, -ry * (1.25 + bend * 0.4), rx * 0.5, -ry * (1.1 - bend * 0.3), rx * 1.05, -ry * 0.05);
    c.bezierCurveTo(rx * 0.7, ry * 0.95, -rx * 0.5, ry * (1.15 + bend * 0.3), -rx, ry * 0.15);
    c.fill();
    c.globalAlpha *= 0.35; c.strokeStyle = lighten(col, 0.35); c.lineWidth = Math.max(0.6, ry * 0.35); c.lineCap = "round";
    c.beginPath(); c.moveTo(-rx * 0.55, -ry * 0.25); c.quadraticCurveTo(0, -ry * (0.65 + bend * 0.3), rx * 0.6, -ry * 0.2); c.stroke();
    c.restore();
  }
  function square(c, x, y, s, a, col) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.fillRect(-s / 2, -s / 2, s, s); c.restore(); }
  // Dabs are painted over several frames so the page never blocks; trees first.
  var queue = [];
  function enqueue(target, list, w, h, shuffle, first) {
    if (shuffle) list.sort(function (a, b) { return a[6] - b[6]; });
    var job = { c: target.getContext("2d"), list: list, w: w, h: h, i: 0 };
    if (first) queue.unshift(job); else queue.push(job);
  }
  function pump(budget) {
    var t0 = performance.now();
    while (queue.length && performance.now() - t0 < budget) {
      var q = queue[0];
      if (q.after) { queue.shift(); q.after(q.c); continue; }
      var end = Math.min(q.list.length, q.i + 120);
      for (; q.i < end; q.i++) { var d = q.list[q.i]; dab(q.c, d[0] * q.w, d[1] * q.h, d[2] * q.w, d[3] * q.w, d[4], d[5]); }
      if (q.i >= q.list.length) queue.shift();
    }
    return queue.length;
  }

  // ——— the deep wood (after Birch Forest, with the gold of the portraits) ——————
  var glints = [];
  // Tileable textures in unit space; dabs near an edge are repeated on the other side.
  function tile(list, d) {
    list.push(d);
    var e = 0.04;
    for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) {
      if (!ox && !oy) continue;
      if ((ox && Math.abs((ox < 0 ? 1 - d[0] : d[0])) > e) || (oy && Math.abs((oy < 0 ? 1 - d[1] : d[1])) > e)) continue;
      list.push([d[0] - ox, d[1] - oy, d[2], d[3], d[4], d[5], d[6]]);
    }
  }
  // The forest floor: moss, fallen leaves, a little violet shade. World x period 12, z period 4.
  function groundTile(W, H) {
    var r = K.rng(4410), n = K.noise2(K.rng(441)), c = off(W, H), x = c.getContext("2d"), list = [];
    x.fillStyle = "#35603f"; x.fillRect(0, 0, W, H);
    var moss = K.pal([["#2f5a3a", 3], ["#3f6e42", 3], ["#4f7a3e", 2.4], ["#5f8a46", 1.6], ["#24483a", 1.6], ["#5a5c9e", 0.6]]);
    var fallen = K.pal([["#a8964a", 2], ["#c2a85a", 1.4], ["#6a7a3a", 2.4], ["#8a7a42", 1.4], ["#5a4a32", 1], ["#b9d27a", 0.8], ["#b8642e", 0.9], ["#c8783a", 0.6]]);
    var sun = K.pal([["#8faa52", 2], ["#a8b85a", 1.6], ["#c2c46a", 1], ["#7a9a4a", 1.4]]), n2 = K.noise2(K.rng(442));
    for (var i = 0; i < 30000; i++) {
      var u = r(), v = r(), m = n(u * 8, v * 5), leaf = m > 0.58 || r() < 0.12;
      if (n2(u * 5, v * 3) > 0.66 && r() < 0.8) { // dappled sunlight on the floor
        var ss = 0.004 + r() * 0.005; tile(list, [u, v, ss, ss * 0.5, (r() - 0.5) * 1.2, K.jitter(K.pick(sun, r, 0), r, 18), r()]); continue;
      }
      var size = 0.004 + r() * 0.005;
      tile(list, [u, v, size, size * (0.4 + r() * 0.25), (r() - 0.5) * 1.2, K.jitter(K.pick(leaf ? fallen : moss, r, 0), r, 22), r()]);
    }
    for (i = 0; i < 260; i++) { // small white and violet flowers in the moss
      var fu = r(), fv = r(), fs = 0.0016 + r() * 0.0014;
      tile(list, [fu, fv, fs, fs, 0, r() < 0.7 ? "#eef0e6" : "#8a8cc8", 1]);
    }
    enqueue(c, list, W, H, true);
    return c;
  }
  // The path: pale trodden earth with moss at its edges. World x width 1.4, z period 4.
  function pathTile(W, H) {
    var r = K.rng(5120), c = off(W, H), list = [];
    var earth = K.pal([["#c9c09a", 3], ["#b8b088", 3], ["#a89e78", 2], ["#d6cfae", 1.2], ["#8f8a66", 1]]);
    for (var i = 0; i < 9000; i++) {
      var u = r(), v = r(), edge = Math.abs(u - 0.5) * 2;
      if (r() < Math.pow(edge, 3)) continue;
      var col = edge > 0.7 && r() < 0.6 ? K.pick(K.pal([["#4f7a3e", 2], ["#6a7a3a", 2], ["#a8964a", 1]]), r, 0) : K.pick(earth, r, 0);
      var size = 0.02 + r() * 0.025;
      tile(list, [u, v, size, size * (0.18 + r() * 0.12), (r() - 0.5) * 0.4, K.jitter(col, r, 16), r()]);
    }
    enqueue(c, list, W, H, true);
    return c;
  }
  // The leaf ceiling as a tile, seen from below: leaves, shade, a few flecks of sky.
  function ceilingTile(W, H) {
    var r = K.rng(7311), n = K.noise2(K.rng(731)), c = off(W, H), x = c.getContext("2d"), list = [];
    x.fillStyle = "#24503e"; x.fillRect(0, 0, W, H);
    for (var i = 0; i < 30000; i++) {
      var u = r(), v = r(), m = n(u * 7, v * 5), sky = r() < 0.022 + Math.max(0, m - 0.62) * 0.15;
      var col = sky ? "#dfe8d6" : K.pick(m > 0.52 ? K.P.leaf : K.P.dark, r, 0);
      var size = 0.004 + r() * 0.005;
      tile(list, [u, v, size, size * (0.45 + r() * 0.2), (r() - 0.5) * 2.8, K.jitter(col, r, 22), r()]);
    }
    enqueue(c, list, W, H, true);
    return c;
  }
  // The leaf ceiling, seen from below: dense at the top, opening into a ragged edge.
  function canopyLayer(W, H) {
    var r = K.rng(1911), n = K.noise2(K.rng(191)), c = off(W, H), list = [], a = W / H;
    var leaves = K.P.leaf, dark = K.P.dark;
    for (var y = -0.02; y < 1; y += 0.0045) for (var xx = -0.02; xx < a + 0.02; xx += 0.0055) {
      var px = xx + (r() - 0.5) * 0.007, py = y + (r() - 0.5) * 0.006;
      var edge = 0.62 + 0.18 * Math.sin(px * 3.1) + 0.1 * Math.sin(px * 9.7 + 1) + (n(px * 3, 1) - 0.5) * 0.3;
      if (py > edge || r() < Math.pow(py / edge, 4) * 0.8) continue;
      var deep = 1 - py / edge, sky = r() < 0.025 * (1 - deep);
      var col = sky ? "#dfe8d6" : K.pick(deep > 0.5 ? dark : leaves, r, 0);
      var size = 0.008 + r() * 0.008 + (1 - deep) * 0.004;
      list.push([px / a, py, size / a, size * (0.45 + r() * 0.2) / a, (r() - 0.5) * 2.8, K.jitter(col, r, 22), r()]);
    }
    enqueue(c, list, W, H, true);
    return c;
  }

  // A spruce (gran), after Klimt's Forester House in Weissenbach: a tall cone of tiered,
  // drooping branches in deep blue-green, lit on the top of each tier.
  function spruce(seed) {
    var r = K.rng(seed), n = K.noise2(K.rng(seed + 3)), TW = 560, TH = 1300, c = off(TW * RES, TH * RES), list = [];
    var cx = TW / 2, top = TH * 0.04, bottom = TH * 0.9, maxW = TW * 0.46, tiers = 13 + Math.floor(r() * 4), tierH = (bottom - top) / tiers;
    var shade = K.pal([["#173d34", 3], ["#1f4a3a", 3], ["#24503e", 2], ["#2c3e6a", 1.2]]);
    var lit = K.pal([["#3a6a4a", 3], ["#4f7e56", 2], ["#2f5a44", 2], ["#6a9a6a", 0.8]]);
    // trunk below the lowest tier
    for (var ty = bottom - tierH; ty < TH; ty += 4) for (var k = 0; k < 2; k++) list.push([(cx + (r() - 0.5) * 14) / TH, ty / TH, 5 / TH, 2.4 / TH, 1.57 + (r() - 0.5) * 0.3, K.jitter(r() < 0.5 ? "#3a3428" : "#4a3e2e", r, 14), 0]);
    var sideL = [], sideR = [];
    for (var ti = 0; ti <= tiers; ti++) { sideL.push(0.72 + r() * 0.5); sideR.push(0.72 + r() * 0.5); }
    for (var y = top; y < bottom; y += 3) {
      var g = (y - top) / (bottom - top), f = ((y - top) % tierH) / tierH, wob = 0.85 + 0.3 * n(y / 60, seed), tI = Math.floor((y - top) / tierH);
      var half = maxW * Math.pow(g, 0.95) * (0.42 + 0.58 * f) * wob + 6;
      var count = Math.max(1, Math.round(half / 5));
      for (var j = 0; j < count; j++) {
        var u = (r() * 2 - 1), x = cx + u * half * (u < 0 ? sideL[tI] : sideR[tI]), droop = Math.abs(u) * Math.abs(u) * tierH * 0.5;
        var col = f < 0.45 && r() < 0.75 ? K.pick(lit, r, 0) : K.pick(shade, r, 0);
        list.push([x / TH, (y + droop) / TH, (5 + r() * 5) / TH, (2.2 + r() * 1.8) / TH, u * 0.6 + (r() - 0.5) * 0.6, K.jitter(col, r, 18), r()]);
      }
    }
    enqueue(c, list, TH * RES, TH * RES, true, true);
    return { trunk: c, crown: null, TW: TW, TH: TH, CW: 1, CH: 1, lean: 0, hasCrown: false, seed: seed, kind: "spruce" };
  }
  // A patch of flowers by the path, after Farm Garden: poppies, daisies, cornflowers, buttercups.
  function flowers(seed) {
    var r = K.rng(seed), TW = 700, TH = 360, c = off(TW * RES, TH * RES), list = [], i;
    var grass = K.pal([["#3f7e46", 3], ["#4f8e4a", 2], ["#2f6a42", 2], ["#6a9e52", 1.2]]);
    for (i = 0; i < 900; i++) { // the grass, denser at the foot
      var gx = TW * (0.06 + r() * 0.88), gy = TH * (0.35 + Math.pow(r(), 0.6) * 0.62), edge = Math.abs(gx / TW - 0.5) * 2;
      if (gy < TH * (0.35 + edge * edge * 0.5)) continue;
      list.push([gx / TH, gy / TH, (4 + r() * 6) / TH, (1.6 + r()) / TH, 1.57 + (r() - 0.5) * 0.9, K.jitter(K.pick(grass, r, 0), r, 18), r() * 0.5]);
    }
    var kinds = [["#c8352a", "#2a1a1a", 3.2], ["#d8452e", "#2a1a1a", 1.4], ["#f2f2ea", "#e2b52a", 2.6], ["#3a5ab8", "#2a2a5a", 1.6], ["#e8c43a", "#b8902a", 1.4], ["#d98aa0", "#e2b52a", 0.7]];
    var tot = kinds.reduce(function (a, k) { return a + k[2]; }, 0);
    for (i = 0; i < 70; i++) {
      var fx = TW * (0.1 + r() * 0.8), edge2 = Math.abs(fx / TW - 0.5) * 2, fy = TH * (0.3 + edge2 * edge2 * 0.4 + r() * 0.42), q = r() * tot, kd = kinds[0];
      for (var k = 0; k < kinds.length; k++) { q -= kinds[k][2]; if (q <= 0) { kd = kinds[k]; break; } }
      var fr = (7 + r() * 7) * (0.7 + fy / TH * 0.6);
      for (var pI = 0; pI < 6; pI++) { var a = pI / 6 * 6.283 + r(); list.push([(fx + Math.cos(a) * fr * 0.55) / TH, (fy + Math.sin(a) * fr * 0.4) / TH, fr * 0.5 / TH, fr * 0.32 / TH, a, K.jitter(kd[0], r, 16), 0.6 + r() * 0.2]); }
      list.push([fx / TH, fy / TH, fr * 0.26 / TH, fr * 0.22 / TH, 0, kd[1], 0.9]);
    }
    enqueue(c, list, TH * RES, TH * RES, true, true);
    return { trunk: c, crown: null, TW: TW, TH: TH, CW: 1, CH: 1, lean: 0, hasCrown: false, seed: seed, kind: "flowers" };
  }

  // The deep wood, painted once in dabs: shaded foliage all round, an opening at the end of
  // the path. Drawn scaled up from that opening as you walk, so the opening widens.
  function deepWood(W, H) {
    // painted at screen size, so it is never enlarged: solid shade with an opening at the end of
    // the path, its edge broken up with dabs
    var r = K.rng(9101), c = off(W, H), x = c.getContext("2d"), list = [];
    var ox = W * 0.5, oy = H * 0.5, rad = Math.min(W, H) * 0.16;
    var g = x.createRadialGradient(ox, oy, rad * 0.8, ox, oy, rad * 2.6);
    g.addColorStop(0, "rgba(36,80,62,0)"); g.addColorStop(0.35, "rgba(36,80,62,.85)"); g.addColorStop(1, "rgba(30,70,54,1)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    var pal = K.pal([["#1f4a3a", 3], ["#24503e", 3], ["#2f6048", 2.4], ["#3f7a52", 1.8], ["#3a4a7a", 0.9], ["#5f8a5a", 1], ["#7aa65a", 0.5]]);
    var n = Math.round(W * H * 0.03);
    for (var i = 0; i < n; i++) {
      var px = r() * W, py = r() * H, d = Math.hypot(px - ox, (py - oy) * 1.2) / rad;
      if (d < 1 || r() > (d - 1) / 1.2) continue;
      var sz = (3 + r() * 4) / W;
      list.push([px / W, py / H, sz, sz * 0.5, (r() - 0.5) * 2.8, K.jitter(K.pick(pal, r, 0), r, 20), r()]);
    }
    enqueue(c, list, W, H, true, true);
    return c;
  }


  // ——— trees ————————————————————————————————————————————————————————————
  // Hälsingland trees in Klimt's hand. Each is a trunk sprite and a crown sprite:
  // birch (dark cracked foot), aspen (blue-grey with eyes, after Beech Forest),
  // plane (Park's camouflage bark), rowan (red berries in late August), pine (copper top).
  var KIND = {
    birch: { w0: 42, cwk: 0.58, bark: [["#f2f2ea", 4], ["#e4e6de", 3], ["#cfd5cf", 1.4]], shade: "#a3b0b0", lobes: 8, leaf: "birch" },
    aspen: { w0: 52, cwk: 0.72, bark: [["#a9b4b0", 3], ["#8f9fa2", 3], ["#b9c2b8", 1.6], ["#6f8288", 1.2]], shade: "#5a6c72", lobes: 11, leaf: "leaf" },
    plane: { w0: 64, cwk: 0.8, bark: null, shade: "#3a4232", lobes: 12, leaf: "leaf" },
    rowan: { w0: 32, cwk: 0.62, bark: [["#8a8678", 3], ["#9a9686", 2], ["#6e6a5e", 1.5]], shade: "#4f4c44", lobes: 8, leaf: "rowan" },
    pine: { w0: 40, cwk: 0.62, bark: [["#c47a3e", 3], ["#d08a48", 2], ["#a8622e", 2], ["#e09a58", 1]], shade: "#7a4426", lobes: 7, leaf: "pine" }
  };
  function rgbOf(col) {
    var m = /rgb\((\d+),(\d+),(\d+)\)/.exec(col);
    return m ? [+m[1], +m[2], +m[3]] : [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  }
  function mixc(a, b, k) { var x = rgbOf(a), y = rgbOf(b); return "rgb(" + x.map(function (v, i) { return Math.round(v + (y[i] - v) * k); }).join(",") + ")"; }
  var LEAVES = {
    birch: function () { return [K.pal([["#b9d27a", 1.4], ["#9ccf6a", 2], ["#7cc27a", 2.4], ["#5faf72", 2], ["#3f9a62", 1.2], ["#d8d64e", 0.7], ["#e2c25a", 0.35]]), K.pal([["#d4e48a", 2], ["#c9e08a", 2], ["#e2dc6a", 1]])]; },
    leaf: function () { return [K.P.leaf, K.P.light]; },
    rowan: function () { return [K.pal([["#7cc27a", 2], ["#5faf72", 2.6], ["#3f9a62", 2.4], ["#2f8268", 1.6], ["#9ccf6a", 1]]), K.P.light]; },
    pine: function () { return [K.pal([["#2f6a4e", 3], ["#3a7a52", 3], ["#245a44", 2], ["#4f8a56", 1.6], ["#4f6a8a", 0.25]]), K.pal([["#6aa262", 2], ["#86b266", 1.2]])]; }
  };
  function tree(seed, kind) {
    var r = K.rng(seed), n = K.noise2(K.rng(seed + 1)), cfg = KIND[kind] || KIND.aspen;
    var TW = 300, TH = 1300, trunk = off(TW * RES, TH * RES), list = [];
    var lean = (r() - 0.5) * 22, base = TW / 2, w0 = cfg.w0 * (0.85 + r() * 0.3), bend = (r() - 0.5) * 16;
    var camo = [K.pal([["#5a6e4a", 3], ["#6e7a52", 2], ["#4f6a52", 1.5]]), K.pal([["#3a3a2a", 3], ["#4a3a2a", 2], ["#2a3428", 1.4]]), K.pal([["#a9b694", 3], ["#c4c8a8", 1.4], ["#8fa286", 2]]), K.pal([["#7a5a3a", 2], ["#8a6a42", 1.5], ["#5a4a30", 1]])];
    var bark = cfg.bark ? K.pal(cfg.bark) : null, foot = K.pal([["#6a6a62", 3], ["#4f4e48", 2], ["#8a8a80", 1.4]]);
    var cxAt = function (y) { var t = (TH - y) / TH; return base + lean * t + bend * Math.sin(t * 3.1) + (n(y / 110, seed) - 0.5) * 8; };
    var wAt = function (y) { var t = (TH - y) / TH, flare = y > TH * 0.9 ? Math.pow((y - TH * 0.9) / (TH * 0.1), 2) * 0.55 : 0; return w0 * (1 - t * 0.5) * (1 + flare); };
    // the silhouette first, so no gap shows between strokes
    var tc0 = trunk.getContext("2d"), L = [], Rr = [];
    for (var sy = TH * 0.08; sy <= TH; sy += 16) { var hw = wAt(sy) * 0.46; L.push([(cxAt(sy) - hw) * RES, sy * RES]); Rr.unshift([(cxAt(sy) + hw) * RES, sy * RES]); }
    tc0.fillStyle = cfg.shade; tc0.beginPath(); L.concat(Rr).forEach(function (q, i) { if (i) tc0.lineTo(q[0], q[1]); else tc0.moveTo(q[0], q[1]); }); tc0.closePath(); tc0.fill();
    for (var y = TH * 0.08; y < TH; y += 3.2) {
      var cx = cxAt(y), w = wAt(y), t = (TH - y) / TH, count = Math.max(2, Math.round(w / 8));
      for (var k = 0; k < count; k++) {
        var u = r() * 2 - 1, px = cx + u * w * 0.44, lit = -u * 0.85 + (r() - 0.5) * 0.5, col;
        if (kind === "plane") col = K.pick(camo[Math.min(3, Math.floor(n(px / 34, y / 70) * 4.2))], r, 0);
        else if (kind === "pine" && t < 0.42) col = K.pick(foot, r, 0);
        else col = K.pick(bark, r, 0);
        if (lit < -0.4) col = mixc(col, cfg.shade, 0.5); else if (lit > 0.6) col = mixc(col, "#ffffff", 0.12);
        var hz = kind === "birch", ang = hz ? (r() - 0.5) * 0.3 : 1.57 + (r() - 0.5) * 0.35;
        list.push([px / TH, y / TH, (hz ? 4 + r() * 5 : 6 + r() * 7) / TH, (hz ? 1.6 + r() * 1.2 : 1.8 + r() * 1.4) / TH, ang, K.jitter(col, r, 14), r()]);
      }
      var dark = function (wd, ht, col) { list.push([(cx + (r() - 0.5) * w * 0.6) / TH, y / TH, wd / TH, ht / TH, (r() - 0.5) * 0.25, col, 1.05 + r() * 0.1]); };
      if (kind === "birch") {
        if (r() < 0.12) dark(3 + r() * 6, 0.9, "rgb(70,70,66)");                         // lenticels
        if (r() < 0.04) dark(6 + r() * 10, 2.4 + r() * 2, "rgb(36,34,30)");              // Klimt's eyes
        if (t < 0.16 && r() < 0.55 * (1 - t / 0.16)) dark(8 + r() * 12, 2 + r() * 3, r() < 0.6 ? "rgb(40,40,36)" : "rgb(78,78,70)"); // dark cracked foot
      }
      if (kind === "aspen" && r() < 0.045) dark(8 + r() * 8, 3 + r() * 2.5, "rgb(46,52,56)");
      if (kind === "pine" && t < 0.42 && r() < 0.3) list.push([(cx + (r() - 0.5) * w * 0.7) / TH, y / TH, (8 + r() * 10) / TH, 1.1 / TH, 1.57, "rgb(52,46,40)", 1.05]);
      if (kind === "rowan" && r() < 0.05) dark(4 + r() * 4, 1, "rgb(170,166,150)");
    }
    enqueue(trunk, list, TH * RES, TH * RES, true, true);

    // the crown: limbs glimpsed through clumps of leaves, lit from the upper left
    // the sprite's attach point (88% down it) sits 40% up the trunk, so leaves start low
    var CW = 900, CH = 1100, crown = off(CW * RES, CH * RES), cl = [];
    var ax = CW * 0.5, ay = CH * 0.88, high = kind === "pine";
    var cy0 = high ? CH * 0.24 : CH * 0.47, ry0 = high ? CH * 0.15 : CH * 0.35, rx0 = CW * (high ? 0.36 : 0.4) * (0.85 + r() * 0.3);
    var limbCol = kind === "birch" ? "#d8dcd4" : kind === "pine" ? "#b8703a" : kind === "aspen" ? "#7f8f92" : "#4f4a40", tips = [];
    for (var b = 0; b < cfg.lobes; b++) {
      var a = -Math.PI / 2 + (b / (cfg.lobes - 1) - 0.5) * 2.5 + (r() - 0.5) * 0.3, reach = 0.55 + r() * 0.45;
      var tx = ax + Math.cos(a) * rx0 * reach, ty = cy0 + Math.sin(a) * ry0 * reach * 0.9 + ry0 * 0.15, lw = kind === "birch" || kind === "rowan" ? 5 : 9;
      tips.push([tx, ty]);
      var sy0 = high ? cy0 + ry0 * 1.1 : ay - (ay - cy0) * (0.15 + r() * 0.7), steps = Math.max(12, Math.round(Math.hypot(tx - ax, ty - sy0) / 3.5));
      for (var s2 = 0; s2 <= steps; s2++) {
        var uu = s2 / steps, bx = ax + (tx - ax) * uu + Math.sin(uu * 3 + b) * 8, by = sy0 + (ty - sy0) * Math.pow(uu, 0.8);
        cl.push([bx / CH, by / CH, lw * (1 - uu * 0.7) / CH, lw * 0.55 * (1 - uu * 0.7) / CH, Math.atan2(ty - ay, tx - ax), K.jitter(limbCol, r, 12), 0.01 * uu]);
      }
    }
    var clumps = tips.map(function (q) { return [q[0], q[1], CW * (0.1 + r() * 0.06)]; });
    for (var f = 0; f < cfg.lobes * 1.5; f++) { var fa = r() * 6.283, fd = Math.sqrt(r()) * 0.75; clumps.push([ax + Math.cos(fa) * fd * rx0, cy0 + Math.sin(fa) * fd * ry0, CW * (0.11 + r() * 0.06)]); }
    var pals = LEAVES[cfg.leaf](), mids = pals[0], lights = pals[1], darks = K.P.dark;
    clumps.forEach(function (cm) {
      var R = cm[2], cnt = Math.round(R * R * 0.062 * (cfg.leaf === "rowan" ? 1.3 : 1));
      cl.push([cm[0] / CH, (cm[1] + R * 0.12) / CH, R * 0.78 / CH, R * 0.62 / CH, 0, K.jitter(["#1f6a58", "#145a4c", "#2f6a4e"][Math.floor(r() * 3)], r, 10), 0.02]); // shade inside the clump
      for (var j = 0; j < cnt; j++) {
        var an = r() * 6.2832, dd = Math.pow(r(), 0.6), qx = cm[0] + Math.cos(an) * dd * R * 1.15, qy = cm[1] + Math.sin(an) * dd * R * 0.92;
        var lx = (qx - cm[0]) / R, ly = (qy - cm[1]) / R, light = -(lx * 0.55 + ly * 0.85) + (cy0 - qy) / ry0 * 0.4 + (r() - 0.5) * 0.5;
        var col = light > 0.55 ? K.pick(lights, r, 0) : light < -0.45 ? K.pick(darks, r, 0) : K.pick(mids, r, 0);
        var sz = cfg.leaf === "rowan" ? 3 + r() * 2.5 : cfg.leaf === "pine" ? 4 + r() * 3 : 4.5 + r() * 4;
        var ratio = cfg.leaf === "rowan" ? 0.36 : cfg.leaf === "pine" ? 0.3 : 0.5 + r() * 0.15, ang2 = (r() - 0.5) * 2.8, ord = 0.03 + r() * 0.95;
        if (cfg.leaf !== "pine" && r() < 0.3) cl.push([qx / CH, qy / CH, sz * 1.3 / CH, sz * ratio * 1.45 / CH, ang2, K.jitter(K.pick(darks, r, 0.6), r, 12), ord]); // Klimt's dark rim
        cl.push([qx / CH, qy / CH, sz / CH, sz * ratio / CH, ang2, K.jitter(col, r, 20), ord + 0.0001]);
      }
    });
    if (kind === "birch") clumps.forEach(function (cm) { // the hanging strands of a Hälsingland birch
      for (var hs = 0; hs < 5; hs++) { var hx = cm[0] + (r() - 0.5) * cm[2] * 1.6, hy = cm[1] + cm[2] * (0.4 + r() * 0.4), hl = 6 + Math.floor(r() * 7);
        for (var hk = 0; hk < hl; hk++) { var hc = hk / hl > 0.5 ? K.pick(mids, r, 0.6) : K.pick(mids, r, 0); cl.push([(hx + Math.sin(hk * 0.5) * 3) / CH, (hy + hk * 7) / CH, 4.5 / CH, 2.2 / CH, 1.4 + (r() - 0.5) * 0.4, K.jitter(hc, r, 16), 0.5 + r() * 0.45]); } }
    });
    if (cfg.leaf === "leaf") for (var dI = 0; dI < 5 + r() * 5; dI++) { // Litzlberg's yellow discs
      var dc = clumps[Math.floor(r() * clumps.length)], dx = dc[0] + (r() - 0.6) * dc[2], dy = dc[1] - r() * dc[2] * 0.7, ds = 7 + r() * 5;
      cl.push([dx / CH, dy / CH, ds * 1.25 / CH, ds * 1.15 / CH, 0, "rgb(70,96,70)", 0.99]); cl.push([dx / CH, dy / CH, ds / CH, ds * 0.92 / CH, 0, K.jitter("#d8d64e", r, 18), 0.995]);
    }
    if (kind === "rowan") for (var bI = 0; bI < 9 + r() * 5; bI++) { // berry clusters
      var bc = clumps[Math.floor(r() * clumps.length)], bx2 = bc[0] + (r() - 0.5) * bc[2] * 1.4, by2 = bc[1] + (r() - 0.2) * bc[2] * 0.9;
      for (var q = 0; q < 10 + r() * 8; q++) { var br = 2 + r() * 1.4; cl.push([(bx2 + (r() - 0.5) * 18) / CH, (by2 + (r() - 0.3) * 14) / CH, br / CH, br / CH, 0, K.jitter(["#d8452e", "#e8602a", "#c43a26"][Math.floor(r() * 3)], r, 14), 0.996]); }
    }
    enqueue(crown, cl, CH * RES, CH * RES, true);
    return { trunk: trunk, crown: crown, TW: TW, TH: TH, CW: CW, CH: CH, lean: lean, hasCrown: true, cwk: cfg.cwk, at: 0.4, ay: 0.88, seed: seed, kind: kind };
  }
  // A bracken fern, turning at the tips in late August.
  function fern(seed) {
    var r = K.rng(seed), TW = 640, TH = 420, c = off(TW * RES, TH * RES), list = [];
    var green = K.pal([["#3f7e46", 3], ["#4f8e4a", 2.4], ["#5f9a4e", 2], ["#2f6a42", 1.6], ["#7aa652", 1]]), turned = K.pal([["#b9a84a", 2], ["#c8a04a", 1.6], ["#a88a3a", 1.2], ["#8a9a42", 1.4]]);
    var fronds = 6 + Math.floor(r() * 4);
    for (var f = 0; f < fronds; f++) {
      var a = -Math.PI / 2 + (f / (fronds - 1) - 0.5) * 2.6 + (r() - 0.5) * 0.25, L = 200 + r() * 140, droop = 0.25 + r() * 0.3;
      var pal = r() < 0.25 ? turned : green, x0 = TW / 2 + (r() - 0.5) * 30, y0 = TH - 8;
      var tx = x0 + Math.cos(a) * L, ty = y0 + Math.sin(a) * L * 0.85, mx = x0 + Math.cos(a) * L * 0.55, my = y0 + Math.sin(a) * L * 0.85 - L * droop;
      for (var s = 0; s <= 1; s += 0.025) {
        var px = (1 - s) * (1 - s) * x0 + 2 * (1 - s) * s * mx + s * s * tx, py = (1 - s) * (1 - s) * y0 + 2 * (1 - s) * s * my + s * s * ty;
        var dx = 2 * (1 - s) * (mx - x0) + 2 * s * (tx - mx), dy = 2 * (1 - s) * (my - y0) + 2 * s * (ty - my), dir = Math.atan2(dy, dx);
        list.push([px / TH, py / TH, 3 / TH, 1.4 / TH, dir, K.jitter("#5a7a3a", r, 10), 0.1]);
        var pl = L * 0.17 * Math.sin(Math.PI * Math.min(1, s * 1.15)) * (1 - s * 0.3);
        if (s > 0.08) for (var side = -1; side <= 1; side += 2) {
          var pa = dir + side * (1.25 + r() * 0.2), ex = px + Math.cos(pa) * pl * 0.5, ey = py + Math.sin(pa) * pl * 0.5;
          list.push([ex / TH, ey / TH, pl * 0.5 / TH, pl * 0.13 / TH, pa, K.jitter(K.pick(pal, r, 0), r, 18), 0.2 + r() * 0.7]);
        }
      }
    }
    enqueue(c, list, TH * RES, TH * RES, true, true);
    return { trunk: c, crown: null, TW: TW, TH: TH, CW: 1, CH: 1, lean: 0, hasCrown: false, seed: seed, kind: "fern" };
  }

  // ——— the valley: Järvsö dal, from the square scene in klimt.js ————————————
  function valley(H) {
    var scene = K.scenes.panorama(), W = Math.round(H * scene.A), c = off(W, H), water = null, waterDabs = null, x = c.getContext("2d");
    // ground colours under the dabs, so no gap is ever see-through
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#d6ddf2"); g.addColorStop(0.34, "#cfd8ee"); g.addColorStop(0.38, "#3f8a6a"); g.addColorStop(0.68, "#3f8a6a"); g.addColorStop(0.7, "#9fc39a"); g.addColorStop(1, "#93bf96");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    scene.layers.forEach(function (ly) {
      var shape = function (sh) { x.fillStyle = sh.c; x.beginPath(); sh.p.forEach(function (p, i) { if (i) x.lineTo(p[0] * H, p[1] * H); else x.moveTo(p[0] * H, p[1] * H); }); x.closePath(); x.fill(); };
      ly.shapes.forEach(function (sh) { if (!sh.late) shape(sh); });
      {
        enqueue(c, ly.dabs.slice(), H, H, true);
        var late = ly.shapes.filter(function (sh) { return sh.late; });
        if (late.length) queue.push({ c: x, after: function () { late.forEach(shape); } });
      }
    });
    return { img: c, water: water, waterDabs: waterDabs, W: W, H: H };
  }

  // ——— the world ——————————————————————————————————————————————————————————
  // the canvas renders at 1x: the brushwork is soft by nature and it keeps every frame light
  var dpr = EXPORT ? 1.5 : 1, VW = 0, VH = 0;
  var ground = null, path = null, ceiling = null, sprites = [], trees = [], motes = [], vista;
  var Z_END = 9.4, vcache = null, wood = null; // where the wood ends at the riverbank
  function layout() {
    VW = stage.clientWidth; VH = stage.clientHeight;
    canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);

  }
  var steps = [];
  function build() {
    var i;
    layout();
    var kinds = ["birch", "birch", "birch", "birch", "aspen", "aspen", "aspen", "plane", "rowan", "rowan", "pine", "pine", "spruce", "spruce", "spruce", "spruce", "flowers", "flowers", "flowers", "fern", "fern", "fern"];
    var slots = kinds.map(function () { return {}; });
    var liveTree = function (i) { return function () {
      var k = kinds[i], sd = 500 + i * 37, t = k === "spruce" ? spruce(sd) : k === "flowers" ? flowers(sd) : k === "fern" ? fern(sd) : tree(sd, k);
      for (var key in t) slots[i][key] = t[key];
    }; };
    var liveSurfaces = function () {
      var G = EXPORT ? [2400, 1600] : [1200, 800], Pp = EXPORT ? [480, 1600] : [240, 800], C = EXPORT ? [3000, 1300] : [1600, 700];
      ground = groundTile(G[0], G[1]); path = pathTile(Pp[0], Pp[1]);
    };
    if (A) {
      // the painted assets: load them; any that fail are painted live instead
      A.trees.forEach(function (m, i) {
        var s2 = slots[i];
        for (var key in m) if (key !== "trunk" && key !== "crown") s2[key] = m[key];
        asset(m.trunk, liveTree(i), function (b) { s2.trunk = b; });
        if (m.crown) asset(m.crown, null, function (b) { s2.crown = b; });
      });
      if (A.ground) {
        asset(A.ground, liveSurfaces, function (b) { ground = b; });
        asset(A.path, null, function (b) { path = b; });
      } else steps.push(liveSurfaces);
    } else {
      kinds.forEach(function (k, i) { steps.push(liveTree(i)); });
      steps.push(liveSurfaces);
    }
    sprites = slots;
    var pool = function (want) { return slots.filter(function (sp, i) { return want.indexOf(kinds[i]) > -1; }); };
    var byKind = {}; ["birch", "aspen", "plane", "rowan", "pine", "spruce", "flowers", "fern"].forEach(function (k) { byKind[k] = pool([k]); });
    var spruces = byKind.spruce, patches = byKind.flowers, ferns = byKind.fern;
    var leafyKind = function () { var q = r(); return q < 0.4 ? "birch" : q < 0.65 ? "aspen" : q < 0.8 ? "plane" : "rowan"; };
    var H_OF = { birch: [2.5, 0.9], aspen: [2.4, 1.0], plane: [2.4, 1.0], rowan: [1.8, 0.6], pine: [3.8, 1.0], spruce: [3.2, 1.4] };
    var r = K.rng(77);
    // a dense wood in depth, with a path of light down the middle
    for (var z = 0.8; z < Z_END - 1.0; z += 0.34) {
      var thin = 1 - smooth(Z_END - 2.4, Z_END - 1.0, z), count = Math.round((5 + Math.floor(r() * 3) + z * 0.75) * (0.2 + 0.8 * thin));
      for (var k = 0; k < count; k++) {
        var side = r() < 0.5 ? -1 : 1, x = side * (0.42 + z * 0.05 + Math.pow(r(), 1.1) * (4 + z * 1.5));
        var q2 = r(), kd = q2 < 0.12 + 0.18 * smooth(3, Z_END - 1, z) ? "spruce" : q2 > 0.9 ? "pine" : leafyKind(), list2 = byKind[kd];
        trees.push({ x: x, z: z + r() * 0.3, h: H_OF[kd][0] + r() * H_OF[kd][1], sp: list2[Math.floor(r() * list2.length)], phase: r() * 6.28, stiff: 0.55 + r() * 0.8, flip: r() < 0.5 });
      }
    }
    // flowers along both edges of the path, all the way to the river
    for (var fz = 0.7; fz < Z_END - 0.4; fz += 0.22 + r() * 0.2) {
      for (var sd2 = -1; sd2 <= 1; sd2 += 2) if (r() < 0.75) trees.push({ x: sd2 * (0.48 + r() * 0.36), z: fz + r() * 0.1, h: 0.3 + r() * 0.2, sp: patches[Math.floor(r() * patches.length)], phase: 0, stiff: 1, flip: r() < 0.5 });
    }
    // ferns between the trees and along the path
    for (var gz = 0.6; gz < Z_END - 0.8; gz += 0.16 + r() * 0.18) {
      for (var nf = 1 + Math.floor(r() * 3); nf > 0; nf--) { var sg = r() < 0.5 ? -1 : 1; trees.push({ x: sg * (0.8 + Math.pow(r(), 1.2) * 3.6), z: gz + r() * 0.12, h: 0.36 + r() * 0.3, sp: ferns[Math.floor(r() * ferns.length)], phase: 0, stiff: 1, flip: r() < 0.5 }); }
    }
    trees.sort(function (a, b) { return b.z - a.z; });
    // drifting gold: flakes, small spirals, leaves
    var cols = ["#9ccf6a", "#b9d27a", "#7cc27a", "#c9d0b8", "#5faf72"];
    for (i = 0; i < 120; i++) {
      var kindM = "leaf";
      motes.push({ x: (r() - 0.5) * 7, y: r() * 2.8 - 0.4, z: 0.4 + r() * 10, s: 0.6 + r() * 1.4, c: kindM === "sq" ? GOLDS[Math.floor(r() * GOLDS.length)] : cols[Math.floor(r() * cols.length)], ph: r() * 6.28, rot: r() * 3, kind: kindM });
    }
    var VH2 = EXPORT ? 1400 : Math.round(Math.min(1400, VH * dpr * 1.1));
    vista = { img: null, water: null, waterDabs: null, W: VH2 * 2, H: VH2 };
    var liveValley = function () { var v = valley(VH2); vista.img = v.img; vista.water = v.water; vista.waterDabs = v.waterDabs; vista.W = v.W; vista.H = v.H; };
    if (A) {
      asset(A.valley, liveValley, function (b) { vista.img = b; });
    } else steps.push(liveValley);
  }
  var base = (document.currentScript && document.currentScript.src || "assets/js/journey.js").replace(/js\/journey\.js.*$/, "klimt/");
  // load an image and decode it off the main thread before it is first drawn
  function asset(file, fallback, set) {
    var img = new Image();
    img.onerror = function () { if (fallback) steps.push(fallback); };
    img.onload = function () {
      if (window.createImageBitmap) createImageBitmap(img).then(set, function () { set(img); });
      else if (img.decode) img.decode().then(function () { set(img); }, function () { set(img); });
      else set(img);
    };
    img.src = base + file + (A && A.v ? "?v=" + A.v : "");
  }
  // a pre-scaled copy, made once, so small trees never shrink a huge image every frame
  function mip(sp, key, f) {
    var k = key + "_" + f;
    if (!sp[k]) { var im = sp[key], m = off(im.width * f, im.height * f); m.getContext("2d").drawImage(im, 0, 0, m.width, m.height); sp[k] = m; }
    return sp[k];
  }
  function pickSrc(sp, key, shown) {
    var im = sp[key], full = im.height;
    if (shown < full * 0.12) return mip(sp, key, 0.12);
    if (shown < full * 0.3) return mip(sp, key, 0.3);
    if (shown < full * 0.6) return mip(sp, key, 0.6);
    return im;
  }
  function ready(im) { return !!im && (im.getContext || (window.ImageBitmap && im instanceof ImageBitmap) || (im.complete && im.naturalWidth > 0)); }

  // ——— drawing ——————————————————————————————————————————————————————————
  var p = 0, last = performance.now(), wind = 0, px = 0, py = 0, tpx = 0, tpy = 0, pointer = false;
    function progress() {
    var rect = section.getBoundingClientRect(), span = rect.height - VH;
    return span > 0 ? clamp(-rect.top / span, 0, 1) : 1;
  }
  function cover(iw, ih, scale, fx, fy) {
    var s = Math.max(VW / iw, VH / ih) * scale, w = iw * s, h = ih * s;
    return { x: (VW - w) * (fx == null ? 0.5 : fx), y: (VH - h) * (fy == null ? 0.5 : fy), w: w, h: h };
  }
  function spiral(c, x, y, rad, rot, col) {
    c.strokeStyle = col; c.lineWidth = Math.max(1, rad * 0.22); c.beginPath();
    for (var i = 0; i <= 28; i++) { var u = i / 28, a = rot + u * 9.4, rr = rad * u; if (i) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else c.moveTo(x, y); }
    c.stroke();
  }
  var failures = 0;
  function frame(now) {
    try { draw(now); } catch (err) {
      if (window.console && failures < 3) console.error("journey frame:", err);
      if (++failures > 30) { section.classList.add("is-still"); return; }
    }
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  function draw(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (steps.length) steps.shift()();
    else if (queue.length) pump(now < 4000 ? 12 : 8);
    var pt = progress();
    p += (pt - p) * (calm ? 1 : Math.min(1, dt * 7));
    var t = now / 1000;
    // wind: a slow swell with gusts
    // no wind in the trees; only a faint drift for the falling gold
    wind = 0.12 + Math.sin(t * 0.3) * 0.08;
    tpx = tpy = 0;
    px += (tpx - px) * 0.03; py += (tpy - py) * 0.03;

    var walk = smooth(0, 0.82, p), exitC = smooth(0.5, 0.8, p), dock = smooth(0.78, 0.92, p);
    var camZ = walk * 10.6, camX = 0;
    var c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, VW, VH);

    // Järvsö dal is there from the first frame, seen at the end of the path through the trunks
    var R = cover(vista.W, vista.H, 1, 0.47, 0.5);
    c.globalAlpha = 1;
    if (ready(vista.img)) {
      if (!vcache || vcache.width !== VW || vcache.height !== VH || vcache.src !== vista.img) {
        vcache = off(VW, VH); vcache.src = vista.img;
        vcache.getContext("2d").drawImage(vista.img, R.x, R.y, R.w, R.h);
      }
      c.drawImage(vcache, 0, 0);
    } else { c.fillStyle = "#3f7a5a"; c.fillRect(0, 0, VW, VH); }
    // the far bank of the valley is the horizon of the wood
    var horizon = R.y + R.h * 0.69, unit = VH * 0.5, cx = VW / 2;
    // the deep wood closes round the path at first, and opens as you go
    var opening = smooth(0.04, 0.42, p);
    if (opening < 1) {
      // always larger than the screen, so its edges are never seen; drawn at 1:1
      var wvy = horizon - VH * 0.05, ww = Math.round(VW + 40), wh = Math.round(2 * Math.max(wvy, VH - wvy) + 40);
      if (!wood || wood.width !== ww || wood.height !== wh) wood = deepWood(ww, wh);
      c.globalAlpha = 1 - opening;
      c.drawImage(wood, Math.round(cx - ww / 2), Math.round(wvy - wh / 2));
      c.globalAlpha = 1;
    }
    drawGround(c, horizon, unit, cx, camZ);
    // trees, far to near
    for (var i = 0; i < trees.length; i++) {
      var tr = trees[i], dz = tr.z - camZ;
      if (dz < 0.2 || dz > 12 || !ready(tr.sp.trunk)) continue;
      var sc = unit / dz, a = smooth(0.2, 0.5, dz) * (1 - smooth(10.5, 12, dz));
      if (a <= 0.01) continue;
      var baseX = cx + (tr.x - camX) * sc * 1.15, baseY = horizon + 0.95 * sc, hgt = tr.h * sc, sp = tr.sp;
      if (baseX < -hgt * 0.7 || baseX > VW + hgt * 0.7 || hgt < 6) continue;
      c.globalAlpha = a;
      c.save();
      c.translate(baseX, baseY);
      if (tr.flip) c.scale(-1, 1);
      var twd = hgt * sp.TW / sp.TH;
      c.drawImage(pickSrc(sp, "trunk", hgt), -twd / 2, -hgt, twd, hgt);
      if (sp.hasCrown && ready(sp.crown)) {
        c.translate(sp.lean / sp.TW * twd * 0.8, -hgt * (sp.at || 0.74));
        var cw = hgt * (sp.cwk || 1) * (0.92 + (tr.phase % 1) * 0.2), ch = cw * sp.CH / sp.CW;
        c.drawImage(pickSrc(sp, "crown", ch), -cw / 2, -ch * (sp.ay || 0.72), cw, ch);
      }
      c.restore();
    }
    // drifting gold, spirals and leaves
    var ma = (1 - exitC) * (calm ? 0 : 1);
    if (ma > 0) {
      for (i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y += dt * (0.05 + m.s * 0.03); m.x += dt * (wind * 0.22 + Math.sin(t + m.ph) * 0.05); m.rot += dt * (0.8 + wind * 1.2);
        var mz = m.z - camZ;
        if (mz < 0.3) { m.z += 9; mz = m.z - camZ; m.y = -0.4; }
        if (m.y > 1.7) { m.y = -0.5; m.x = (Math.random() - 0.5) * 7; }
        var ms = unit / mz, mx = cx + (m.x - camX) * ms, my = horizon + (m.y - 0.9) * ms;
        if (mx < -30 || mx > VW + 30 || my < -30 || my > VH + 30) continue;
        var size = Math.max(1.4, m.s * ms * 0.02), gold = m.kind !== "leaf";
        c.globalAlpha = ma * (gold ? 0.55 + 0.45 * Math.sin(t * 3 + m.ph) : 0.9) * smooth(0.3, 1.2, mz) * (1 - smooth(8, 10.5, mz));
        if (m.kind === "sq") square(c, mx, my, size * 1.3, m.rot, m.c);
        else if (m.kind === "spiral") spiral(c, mx, my, size * 2.2, m.rot, "#d9b44a");
        else dab(c, mx, my, size, size * 0.5 * Math.abs(Math.cos(m.rot)) + size * 0.15, m.rot, m.c);
      }
    }
    c.globalAlpha = 1;

    // words: the names in the light at the start, the label at the end
    if (intro) { var io = 1 - smooth(0.02, 0.16, p); intro.style.opacity = io.toFixed(3); intro.style.visibility = io < 0.01 ? "hidden" : "visible"; }
    if (cue) cue.style.opacity = (1 - smooth(0.0, 0.08, p)).toFixed(3);
    if (label) {
      // at the end: the names first, then the rest, one after another
      var lo = smooth(0.66, 0.8, p);
      label.style.opacity = lo > 0 ? "1" : "0"; label.style.transform = "translate3d(-50%,0,0)";
      for (var ci = 0; ci < label.children.length; ci++) {
        var ch = label.children[ci], co = smooth(0.66 + ci * 0.035, 0.8 + ci * 0.035, p);
        ch.style.opacity = co.toFixed(3);
        ch.style.transform = "translate3d(0," + ((1 - co) * 14).toFixed(1) + "px,0)";
      }
      label.style.pointerEvents = lo > 0.5 ? "auto" : "none";
    }
    // lines that surface and sink as you pass them
    for (var li = 0; li < lines.length; li++) {
      var L = lines[li], lt = clamp((p - L.a) / (L.b - L.a), 0, 1), lo2 = smooth(0, 0.3, lt) * (1 - smooth(0.7, 1, lt));
      L.el.style.opacity = lo2.toFixed(3);
      L.el.style.transform = "translate3d(-50%," + ((0.5 - lt) * 60).toFixed(1) + "px,0)";
      L.el.style.filter = "blur(" + ((1 - lo2) * 8).toFixed(1) + "px)";
      L.el.style.letterSpacing = (0.3 + (1 - lo2) * 0.25).toFixed(3) + "em";
    }
    if (rail) { rail.style.transform = "scaleY(" + p.toFixed(4) + ")"; rail.parentNode.style.opacity = (1 - dock).toFixed(3); }
    if (shade) shade.style.opacity = (1 - exitC).toFixed(3);
    stage.classList.toggle("is-paper", p > 0.8);
  }
  // The forest floor in perspective: each screen row is the ground at one depth,
  // so it moves under you as you walk, and ends at the riverbank.
  function drawGround(c, horizon, unit, cx, camZ) {
    if (!ready(ground)) return;
    if (ground.width > 1200) ground = (function (g) { var m = off(1200, g.height * 1200 / g.width); m.getContext("2d").drawImage(g, 0, 0, m.width, m.height); return m; })(ground);
    var gw = ground.width, gh = ground.height, toEnd = Z_END - camZ;
    var yEdge = toEnd > 0.02 ? horizon + 0.95 * unit / toEnd : VH + 1, step = 4;
    for (var y = Math.max(horizon + 1, Math.floor(yEdge)); y < VH; y += step) {
      var dz = 0.95 * unit / (y + step * 0.5 - horizon), z = dz + camZ, sc = unit / dz * 1.15;
      var v = (((z % 4) + 4) % 4) / 4, sy = Math.min(gh - 3, v * gh), sh = Math.max(1, gh * 0.006);
      c.globalAlpha = 1 - smooth(Z_END - 0.3, Z_END, z);
      var w = 12 * sc, x0 = cx - 6 * sc;
      x0 -= Math.ceil(x0 / w) * w;
      for (var x = x0; x < VW; x += w) c.drawImage(ground, 0, sy, gw, sh, x, y, w + 1, step + 0.7);
      if (ready(path)) {
        var pw = path.width, ph = path.height, psy = Math.min(ph - 3, v * ph);
        c.drawImage(path, 0, psy, pw, Math.max(1, ph * 0.006), cx - 0.7 * sc, y, 1.4 * sc, step + 0.7);
      }
    }
    // a shadow under the trees near the horizon, lifting as you leave
    c.globalAlpha = 1;
  }
  // The leaf ceiling in perspective, overhead: you walk under it, and it ends where the wood ends.
  var CEIL = 2.1, C_END = Z_END - 0.6;
  function drawCeiling(c, horizon, unit, cx, camZ) {
    if (!ready(ceiling)) return;
    var gw = ceiling.width, gh = ceiling.height, toEnd = C_END - camZ;
    if (toEnd < 0.05) return;
    var yEdge = horizon - CEIL * unit / toEnd, step = 3;
    for (var y = 0; y < Math.min(yEdge, horizon - 2); y += step) {
      var dz = CEIL * unit / (horizon - (y + step * 0.5)), z = dz + camZ, sc = unit / dz * 1.15;
      var v = (((z % 4) + 4) % 4) / 4, sy = Math.min(gh - 3, v * gh), sh = Math.max(1, gh * 0.006);
      c.globalAlpha = 1 - smooth(C_END - 0.7, C_END, z);
      var w = 12 * sc, x0 = cx - 6 * sc;
      x0 -= Math.ceil(x0 / w) * w;
      for (var x = x0; x < VW; x += w) c.drawImage(ceiling, 0, sy, gw, sh, x, y, w + 1, step + 0.7);
    }
    c.globalAlpha = 1;
  }
  var lastWater = 0;
  function drawWater(c, R, t) {
    if (!vista.waterDrawn || (t && t - lastWater > 0.08)) {
      vista.waterDrawn = true;
      lastWater = t;
      var S = vista.H, w = vista.water.getContext("2d"), list = vista.waterDabs;
      w.clearRect(0, 0, vista.water.width, vista.water.height);
      for (var i = 0; i < list.length; i++) { var d = list[i]; dab(w, (d[0] + Math.sin(t * 0.6 + d[1] * 90 + d[0] * 4) * 0.0035) * S, d[1] * S, d[2] * S, d[3] * S, d[4], d[5]); }
    }
    c.drawImage(vista.water, R.x, R.y, R.w, R.h);
  }

  var raf = 0, visible = true;
  // keyboard: tabbing into the label takes you to the end of the walk
  if (label) label.addEventListener("focusin", function () {
    if (progress() < 0.99) window.scrollTo({ top: section.offsetTop + section.offsetHeight - window.innerHeight, behavior: calm ? "auto" : "smooth" });
  });
  if (!calm) {
    var target = window.scrollY, current = window.scrollY, gliding = false;
    var maxY = function () { return document.documentElement.scrollHeight - window.innerHeight; };
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.defaultPrevented || (e.target.closest && e.target.closest("textarea, select"))) return;
      e.preventDefault();
      var d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (!gliding) target = current = window.scrollY;
      target = clamp(target + d, 0, maxY());
      if (!gliding) { gliding = true; requestAnimationFrame(glide); }
    }, { passive: false });
    var glide = function () {
      current += (target - current) * 0.085;
      if (Math.abs(target - current) < 0.5) { current = target; gliding = false; }
      window.scrollTo(0, current);
      if (gliding) requestAnimationFrame(glide);
    };
    window.addEventListener("scroll", function () { if (!gliding) target = current = window.scrollY; }, { passive: true });
  }
  try { build(); } catch (err) {
    // never leave a blank stage: show the print without the walk
    section.classList.add("is-still");
    if (window.console) console.error("journey:", err);
    return;
  }
  // The glade for the wedding page's "Stay" section, composed once (export only) from the
  // same painted trees as the walk: far wood, a few trees in the glade, ferns and flowers in front.
  function composeGlade(S) {
    var r = K.rng(3131), c = off(S, S), x = c.getContext("2d");
    var of = function (k) { return sprites.filter(function (sp) { return sp.kind === k; }); };
    var pickOf = function (ks) { var l = of(ks[Math.floor(r() * ks.length)]); return l[Math.floor(r() * l.length)]; };
    var g = x.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, "#1f4a3a"); g.addColorStop(0.5, "#2f6048"); g.addColorStop(0.68, "#3f7a52"); g.addColorStop(1, "#35603f");
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    var dabs = [], gy = S * 0.68;
    for (var t = 0; t < 120; t++) { // far trunks, pale against the shade
      var tx = r() * S, tw = 2 + r() * 5, top = S * (0.1 + r() * 0.3), col = r() < 0.6 ? "#c9d2c6" : r() < 0.5 ? "#8fa098" : "#6a7a62";
      for (var ty = top; ty < gy + 4; ty += 3) dabs.push([tx + (r() - 0.5) * tw, ty, 3.5, 1.6, 1.57 + (r() - 0.5) * 0.3, K.jitter(r() < 0.08 ? "#2a2a26" : col, r, 14)]);
    }
    for (var fy = -10; fy < S * 0.62; fy += 4) for (var fx = -10; fx < S + 10; fx += 5) { // the canopy of the wood behind
      if (r() > 0.32 + Math.pow(1 - fy / (S * 0.62), 1.5) * 0.7) continue;
      dabs.push([fx + (r() - 0.5) * 6, fy + (r() - 0.5) * 5, 4 + r() * 3, 2.2 + r() * 1.4, (r() - 0.5) * 2.8, K.jitter(K.pick(fy < S * 0.35 ? K.P.dark : K.P.leaf, r, 0.4), r, 20)]);
    }
    dabs.forEach(function (d) { dab(x, d[0], d[1], d[2], d[3], d[4], d[5]); });
    for (var yy = gy, v = 0; yy < S; yy += 2) { // the floor in perspective: finer toward the back
      var depth = (yy - gy) / (S - gy), sc = 0.12 + depth * 0.5, w = ground.width * sc;
      v = (v + 2 / sc) % (ground.height - 4);
      for (var gx = -((yy * 7) % w); gx < S; gx += w) x.drawImage(ground, 0, v, ground.width, 2 / sc, gx, yy, w + 1, 2.4);
    }
    var items = [];
    for (var i = 0; i < 16; i++) items.push({ sp: pickOf(["birch", "aspen", "spruce", "spruce", "pine"]), x: r() * S, y: S * (0.69 + r() * 0.02), h: S * (0.32 + r() * 0.14), far: true });
    [[0.2, 0.82, 0.74, "aspen"], [0.42, 0.79, 0.62, "birch"], [0.63, 0.81, 0.68, "rowan"], [0.86, 0.8, 0.72, "spruce"], [0.04, 0.97, 1.1, "birch"], [0.98, 0.99, 1.05, "aspen"]].forEach(function (t) {
      var l = of(t[3]); items.push({ sp: l[Math.floor(r() * l.length)], x: t[0] * S, y: t[1] * S, h: t[2] * S });
    });
    for (i = 0; i < 9; i++) items.push({ sp: pickOf(["flowers", "flowers", "fern"]), x: r() * S, y: S * (0.86 + r() * 0.14), h: S * (0.09 + r() * 0.05) });
    items.sort(function (a, b) { return a.y - b.y; });
    var hazed = false;
    items.forEach(function (it) {
      if (!it.far && !hazed) { hazed = true; x.fillStyle = "rgba(46,92,70,.32)"; x.fillRect(0, 0, S, S * 0.75); }
      var sp = it.sp, twd = it.h * sp.TW / sp.TH;
      x.save(); x.translate(it.x, it.y); if (r() < 0.5) x.scale(-1, 1);
      x.drawImage(sp.trunk, -twd / 2, -it.h, twd, it.h);
      if (sp.hasCrown && sp.crown) {
        x.translate(sp.lean / sp.TW * twd * 0.8, -it.h * (sp.at || 0.74));
        var cw = it.h * (sp.cwk || 1), ch = cw * sp.CH / sp.CW;
        x.drawImage(sp.crown, -cw / 2, -ch * (sp.ay || 0.72), cw, ch);
      }
      x.restore();
    });
    return c;
  }
  if (EXPORT) {
    while (steps.length || queue.length) { if (steps.length) steps.shift()(); else pump(5000); }
    window.__klimtExport = {
      trees: sprites.map(function (sp) { return { trunk: sp.trunk.toDataURL("image/webp", 0.8), crown: sp.crown ? sp.crown.toDataURL("image/webp", 0.8) : null, TW: sp.TW, TH: sp.TH, CW: sp.CW, CH: sp.CH, lean: sp.lean, hasCrown: sp.hasCrown, cwk: sp.cwk, at: sp.at, ay: sp.ay, seed: sp.seed, kind: sp.kind }; }),
      ground: ground.toDataURL("image/webp", 0.84), path: path.toDataURL("image/webp", 0.8),
      valley: vista.img.toDataURL("image/webp", 0.84), glade: composeGlade(1200).toDataURL("image/webp", 0.84),
      glints: []
    };
    return;
  }
  raf = requestAnimationFrame(frame);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }).observe(stage);
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
})();
