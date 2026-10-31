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
  var EXPORT = /[?&]export=1\b/.test(location.search), RES = EXPORT ? 1.7 : 1;
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
    var fallen = K.pal([["#a8964a", 2], ["#c2a85a", 1.4], ["#6a7a3a", 2.4], ["#8a7a42", 1.4], ["#5a4a32", 1], ["#b9d27a", 0.8]]);
    for (var i = 0; i < 26000; i++) {
      var u = r(), v = r(), m = n(u * 8, v * 5), leaf = m > 0.58 || r() < 0.12;
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

  // ——— trees ————————————————————————————————————————————————————————————
  // Each tree is a trunk sprite and a crown sprite; the wind bends them apart.
  function tree(seed, kind) {
    var r = K.rng(seed), n = K.noise2(K.rng(seed + 1)), TW = kind === "life" ? 700 : 300, TH = 1300, trunk = off(TW * RES, TH * RES), list = [];
    var lean = (r() - 0.5) * 20, base = TW / 2, w0 = kind === "plane" ? 60 : kind === "pear" ? 38 : 30;
    // Park's plane bark: large patches of olive, umber and pale grey-green
    var camo = [K.pal([["#5a6e4a", 3], ["#6e7a52", 2], ["#4f6a52", 1.5]]), K.pal([["#3a3a2a", 3], ["#4a3a2a", 2], ["#2a3428", 1.4]]), K.pal([["#a9b694", 3], ["#c4c8a8", 1.4], ["#8fa286", 2]]), K.pal([["#7a5a3a", 2], ["#8a6a42", 1.5], ["#5a4a30", 1]])];
    var bark = kind === "plane" ? null : kind === "pear" ? K.pal([["#7a6450", 4], ["#8c7660", 2], ["#5e4c3e", 2], ["#8a9a6a", 1]])
      : kind === "life" ? K.pal([["#8a6a3a", 3], ["#a77d27", 2], ["#6a5030", 2], ["#c9a043", 1]])
      : K.pal([["#eef2e8", 4], ["#d8e0d6", 3], ["#b9c9c0", 1.5], ["#8fa8a8", 1]]);
    var tc0 = trunk.getContext("2d"), sil = [], silR = [];
    for (var sy = TH * 0.1; sy <= TH; sy += 20) {
      var st = (TH - sy) / TH, scx = base + lean * st + (n(sy / 90, seed) - 0.5) * 10, sw = w0 * (1 - st * 0.45) * 0.42;
      sil.push([(scx - sw) * RES, sy * RES]); silR.unshift([(scx + sw) * RES, sy * RES]);
    }
    tc0.fillStyle = kind === "birch" ? "#d8e0d6" : kind === "plane" ? "#4f5e44" : "#6a5844";
    tc0.beginPath(); sil.concat(silR).forEach(function (q, i) { if (i) tc0.lineTo(q[0], q[1]); else tc0.moveTo(q[0], q[1]); }); tc0.closePath(); tc0.fill();
    for (var y = TH * 0.1; y < TH; y += 4) {
      var t = (TH - y) / TH, cx = base + lean * t + (n(y / 90, seed) - 0.5) * 10, w = w0 * (1 - t * 0.45);
      for (var k = 0; k < 3; k++) {
        var px = cx + (r() - 0.5) * w, side = (px - cx) / w;
        var col = kind === "plane" ? K.pick(camo[Math.min(3, Math.floor(n(px / 34, y / 70) * 4.2))], r, 0)
          : side > 0.22 && kind === "birch" ? (r() < 0.6 ? "#9fb4b2" : "#7fa0a0") : K.pick(bark, r, 0);
        list.push([px / TH, y / TH, (5 + r() * 4) / TH, (2.2 + r() * 1.6) / TH, (r() - 0.5) * 0.5, K.jitter(col, r, 16), r()]);
      }
      if (kind === "birch" && r() < 0.08) { // lenticels: fine dark dashes across the bark
        list.push([(cx + (r() - 0.5) * w * 0.8) / TH, y / TH, (3 + r() * 6) / TH, 0.9 / TH, (r() - 0.5) * 0.15, "rgb(70,70,66)", 1.1]);
      }
      if (kind === "birch" && r() < 0.06) { // Klimt's almond eyes in the bark
        var ex = cx + (r() - 0.5) * w * 0.5, ew = 6 + r() * 8;
        list.push([ex / TH, y / TH, ew / TH, (2.4 + r() * 1.4) / TH, (r() - 0.5) * 0.2, "rgb(36,34,30)", 1.2]);
        if (r() < 0.5) list.push([ex / TH, y / TH, 1.8 / TH, 1.8 / TH, 0, "rgb(217,180,74)", 1.3]);
      }
    }
    enqueue(trunk, list, TH * RES, TH * RES, false, true);
    // Tree of Life: gold spirals curling from the upper trunk (Stoclet frieze)
    var spirals = [];
    if (kind === "life") {
      for (var b = 0; b < 12; b++) {
        var by = TH * (0.1 + r() * 0.5), dir = b % 2 ? -1 : 1, len = 120 + r() * 150, turns = 1.6 + r() * 1.4, pts = [];
        var x0 = base + lean * ((TH - by) / TH);
        for (var sI = 0; sI <= 60; sI++) {
          var u = sI / 60, rad = len * (1 - u * 0.85), ang = dir * u * turns * 6.283;
          pts.push([Math.max(8, Math.min(TW - 8, x0 + dir * len * 0.9 * u + Math.cos(ang) * rad * 0.45 * u)), by - len * 0.3 * u + Math.sin(ang) * rad * 0.45 * u]);
        }
        spirals.push({ pts: pts, col: r() < 0.6 ? "#d9b44a" : "#f0d890", w: 7 + r() * 5 });
      }
    }
    // crown
    var CW = 900, CH = 640, crown = off(CW * RES, CH * RES), cl = [];
    var leaves = kind === "pear" ? K.P.leaf
      : kind === "life" ? K.pal([["#e8c96a", 1.6], ["#c9a043", 1.2], ["#a8d050", 2], ["#5a9e44", 2], ["#2f5a3a", 1.4], ["#5a60aa", 1]])
      : K.P.leaf;
    var lights = K.P.light;
    var lobes = kind === "birch" ? 7 : 10;
    for (var cI = 0; cI < lobes; cI++) {
      var ang0 = (cI / lobes) * 6.283, ccx = CW * (0.5 + Math.cos(ang0) * 0.2 * r() * 1.2), ccy = CH * (0.53 + Math.sin(ang0) * 0.12 * r()), rad2 = CH * (0.14 + r() * 0.07);
      for (var j = 0; j < 1300; j++) {
        var an = r() * 6.2832, dd = Math.sqrt(r()), qx = ccx + Math.cos(an) * dd * rad2 * 1.35, qy = ccy + Math.sin(an) * dd * rad2;
        var relC = (qy - CH * 0.53) / (CH * 0.28), rel = (qy - ccy) / rad2;
        var c2 = relC < -0.35 && r() < 0.75 ? K.pick(lights, r, 0) : relC > 0.45 && r() < 0.7 ? K.pick(K.P.dark, r, 0) : K.pick(leaves, r, Math.max(0, rel + 0.4));
        cl.push([qx / CH, qy / CH, (4 + r() * 4) / CH, (2.2 + r() * 2) / CH, (r() - 0.5) * 2.8, K.jitter(c2, r, 22), r()]);
      }
    }
    enqueue(crown, cl, CH * RES, CH * RES, true);
    var sp = { trunk: trunk, crown: crown, TW: TW, TH: TH, CW: CW, CH: CH, lean: lean, hasCrown: true, seed: seed, kind: kind };
    // spirals go on after the bark is painted
    if (spirals.length) queue.splice(1, 0, { c: trunk.getContext("2d"), list: [], w: 0, h: 0, i: 0, after: function (tc) {
      tc.save(); tc.scale(RES, RES); tc.lineCap = "round";
      spirals.forEach(function (s) { tc.strokeStyle = s.col; tc.lineWidth = s.w; tc.beginPath(); s.pts.forEach(function (pt, i) { if (i) tc.lineTo(pt[0], pt[1]); else tc.moveTo(pt[0], pt[1]); }); tc.stroke(); });
      tc.restore();
    } });
    return sp;
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
      if (ly.id === "water") { waterDabs = ly.dabs; water = off(W, H); }
      else {
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
  var Z_END = 9.4; // where the wood ends at the riverbank
  function layout() {
    VW = stage.clientWidth; VH = stage.clientHeight;
    canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);

  }
  var steps = [];
  function build() {
    var i;
    layout();
    var kinds = ["plane", "plane", "plane", "plane", "plane", "plane", "birch", "plane", "plane", "plane"];
    var slots = kinds.map(function () { return {}; });
    var liveTree = function (i) { return function () { var t = tree(500 + i * 37, kinds[i]); for (var key in t) slots[i][key] = t[key]; }; };
    var liveSurfaces = function () {
      var G = EXPORT ? [2400, 1600] : [1200, 800], Pp = EXPORT ? [480, 1600] : [240, 800], C = EXPORT ? [3000, 1300] : [1600, 700];
      ground = groundTile(G[0], G[1]); path = pathTile(Pp[0], Pp[1]); ceiling = ceilingTile(G[0], G[1]);
    };
    if (A) {
      // the painted assets: load them; any that fail are painted live instead
      A.trees.forEach(function (m, i) {
        var s2 = slots[i];
        for (var key in m) if (key !== "trunk" && key !== "crown") s2[key] = m[key];
        asset(m.trunk, liveTree(i), function (b) { s2.trunk = b; });
        asset(m.crown, null, function (b) { s2.crown = b; });
      });
      if (A.ground) {
        asset(A.ground, liveSurfaces, function (b) { ground = b; });
        asset(A.path, null, function (b) { path = b; });
        if (A.ceiling) asset(A.ceiling, null, function (b) { ceiling = b; });
      } else steps.push(liveSurfaces);
    } else {
      kinds.forEach(function (k, i) { steps.push(liveTree(i)); });
      steps.push(liveSurfaces);
    }
    sprites = slots;
    var r = K.rng(77);
    // a dense wood in depth, with a path of light down the middle
    for (var z = 0.8; z < Z_END - 1.0; z += 0.34) {
      var thin = 1 - smooth(Z_END - 2.4, Z_END - 1.0, z), count = Math.round((6 + Math.floor(r() * 4)) * (0.2 + 0.8 * thin));
      for (var k = 0; k < count; k++) {
        var side = r() < 0.5 ? -1 : 1, x = side * (0.42 + z * 0.05 + Math.pow(r(), 1.2) * 5);
        trees.push({ x: x, z: z + r() * 0.3, h: 2.3 + r() * 1.3, sp: sprites[Math.floor(r() * sprites.length)], phase: r() * 6.28, stiff: 0.55 + r() * 0.8 });
      }
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
      // the river keeps moving, so its dabs stay live
      steps.push(function () { var sc = K.scenes.panorama(); sc.layers.forEach(function (ly) { if (ly.id === "water") { vista.waterDabs = ly.dabs; vista.water = off(VH2 * sc.A, VH2); } }); });
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
    var R = cover(vista.W, vista.H, lerp(1.06, 1.0, walk), 0.47, 0.5);
    c.globalAlpha = 1;
    c.fillStyle = "#3f7a5a"; c.fillRect(0, 0, VW, VH);
    if (ready(vista.img)) {
      c.save(); c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();
      c.drawImage(vista.img, R.x, R.y, R.w, R.h);
      if (vista.water) drawWater(c, R, calm ? 0 : t);
      c.restore();
    }
    // the far bank of the valley is the horizon of the wood
    var horizon = R.y + R.h * 0.69, unit = VH * 0.5, cx = VW / 2;
    var reveal = smooth(0.34, 0.66, p);
    if (reveal < 1) {
      var vx = cx, vy = horizon - VH * 0.06, rIn = lerp(VW * 0.03, VW * 0.5, smooth(0.15, 0.66, p)), rOut = rIn + VW * lerp(0.25, 0.6, reveal);
      var hz = c.createRadialGradient(vx, vy, rIn, vx, vy, rOut);
      hz.addColorStop(0, "rgba(214,232,200,0)"); hz.addColorStop(0.25, "rgba(150,190,150,.55)"); hz.addColorStop(1, "rgba(28,64,48,1)");
      c.globalAlpha = 1 - reveal; c.fillStyle = hz; c.fillRect(0, 0, VW, VH);
      // the light at the end of the path
      var glow = c.createRadialGradient(vx, vy, 0, vx, vy, rIn * 1.6 + 40);
      glow.addColorStop(0, "rgba(246,250,232,.9)"); glow.addColorStop(1, "rgba(246,250,232,0)");
      c.globalAlpha = (1 - reveal) * 0.85; c.fillStyle = glow; c.fillRect(0, 0, VW, VH);
    }
    drawGround(c, horizon, unit, cx, camZ);
    var mist = 1 - smooth(0.5, 0.75, p);
    if (mist > 0) {
      var mg = c.createLinearGradient(0, horizon - VH * 0.12, 0, horizon + VH * 0.2);
      mg.addColorStop(0, "rgba(220,234,214,0)"); mg.addColorStop(0.45, "rgba(220,234,214,.38)"); mg.addColorStop(1, "rgba(220,234,214,0)");
      c.globalAlpha = mist; c.fillStyle = mg; c.fillRect(0, horizon - VH * 0.12, VW, VH * 0.32);
    }
    // trees, far to near
    for (var i = 0; i < trees.length; i++) {
      var tr = trees[i], dz = tr.z - camZ;
      if (dz < 0.2 || dz > 11 || !ready(tr.sp.trunk)) continue;
      var sc = unit / dz, a = smooth(0.2, 0.5, dz) * (1 - smooth(9, 11, dz));
      if (a <= 0.01) continue;
      var baseX = cx + (tr.x - camX) * sc * 1.15, baseY = horizon + 0.95 * sc, hgt = tr.h * sc, sp = tr.sp;
      if (baseX < -hgt * 0.7 || baseX > VW + hgt * 0.7) continue;
      c.globalAlpha = a;
      c.save();
      c.translate(baseX, baseY);
      var twd = hgt * sp.TW / sp.TH;
      c.drawImage(sp.trunk, -twd / 2, -hgt, twd, hgt);
      if (sp.hasCrown && ready(sp.crown)) {
        c.translate(sp.lean / sp.TW * twd * 0.8, -hgt * 0.74);
        var cw = hgt * (sp.kind === "birch" ? 0.78 : 1.0) * (0.92 + (tr.phase % 1) * 0.2), ch = cw * sp.CH / sp.CW;
        c.drawImage(sp.crown, -cw / 2, -ch * 0.72, cw, ch);
      }
      c.restore();
    }
    var rays = (1 - exitC) * (calm ? 0.7 : 0.85 + 0.15 * Math.sin(t * 0.4));
    if (rays > 0.02) {
      c.save(); c.globalCompositeOperation = "screen";
      [[0.3, 0.16, -0.32], [0.46, 0.08, -0.26], [0.58, 0.12, -0.2], [0.72, 0.1, -0.3]].forEach(function (b, k) {
        var bx = VW * b[0] + Math.sin(t * 0.2 + k) * VW * 0.01, top = 0, bw = VW * b[1];
        var lg = c.createLinearGradient(0, 0, 0, VH * 0.9);
        lg.addColorStop(0, "rgba(240,246,214,.0)"); lg.addColorStop(0.25, "rgba(240,246,214,.16)"); lg.addColorStop(1, "rgba(240,246,214,0)");
        c.globalAlpha = rays; c.fillStyle = lg; c.beginPath();
        c.moveTo(bx, top); c.lineTo(bx + bw, top); c.lineTo(bx + bw + VH * b[2] * -1.1, VH * 0.95); c.lineTo(bx + VH * b[2] * -0.7, VH * 0.95); c.closePath(); c.fill();
      });
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
    if (label) { var lo = smooth(0.84, 0.98, p); label.style.opacity = lo.toFixed(3); label.style.transform = "translate3d(-50%," + ((1 - lo) * 18).toFixed(1) + "px,0)"; label.style.pointerEvents = lo > 0.5 ? "auto" : "none"; }
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
    var gw = ground.width, gh = ground.height, toEnd = Z_END - camZ;
    var yEdge = toEnd > 0.02 ? horizon + 0.95 * unit / toEnd : VH + 1, step = 3;
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
  if (EXPORT) {
    while (steps.length || queue.length) { if (steps.length) steps.shift()(); else pump(5000); }
    window.__klimtExport = {
      trees: sprites.map(function (sp) { return { trunk: sp.trunk.toDataURL("image/webp", 0.86), crown: sp.crown.toDataURL("image/webp", 0.86), TW: sp.TW, TH: sp.TH, CW: sp.CW, CH: sp.CH, lean: sp.lean, hasCrown: sp.hasCrown, seed: sp.seed, kind: sp.kind }; }),
      ground: ground.toDataURL("image/webp", 0.84), path: path.toDataURL("image/webp", 0.86), ceiling: ceiling.toDataURL("image/webp", 0.84),
      valley: vista.img.toDataURL("image/webp", 0.84),
      glints: []
    };
    return;
  }
  raf = requestAnimationFrame(frame);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }).observe(stage);
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
})();
