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
  var label = section.querySelector(".journey-print .label");
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
  function forestBackdrop(W, H) {
    // after Klimt's Park (1910): a ceiling of tiny leaves over most of the picture,
    // a row of trunks with white light between them, and a band of lawn
    var r = K.rng(1910), n = K.noise2(K.rng(19)), c = off(W, H), x = c.getContext("2d"), list = [];
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1f4a32"); g.addColorStop(0.5, "#3f7a46"); g.addColorStop(0.64, "#9fbf8a"); g.addColorStop(0.72, "#eef0e6"); g.addColorStop(0.82, "#e4ead8"); g.addColorStop(0.86, "#5fb04a"); g.addColorStop(1, "#3f8a42");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    var a = W / H;
    var put = function (px, py, size, col, ang, ratio, order) { list.push([px / a, py, size * (0.42 + r() * 0.36) / a, size * (0.42 + r() * 0.36) * (ratio || 0.48) / a, ang, K.jitter(col, r, 22), order]); };
    // the white light far off between the trunks
    for (var y = 0.66; y < 0.85; y += 0.006) for (var xx = a * 0.18; xx < a * 0.82; xx += 0.007) {
      var edge = Math.abs(xx / a - 0.5) / 0.32;
      if (r() < edge * edge) continue;
      put(xx + (r() - 0.5) * 0.006, y, 0.012, r() < 0.8 ? "#eef0e6" : "#dfe6d6", (r() - 0.5) * 0.4, 0.6, 0.05 + r() * 0.1);
    }
    // the far row of trunks, dark against the light
    for (var t = 0; t < 52; t++) {
      var tx = r() * a, w = 0.004 + r() * 0.009, top = 0.6 + r() * 0.06, base = 0.86 + r() * 0.02;
      var bark = r() < 0.6 ? ["#4a3428", "#6a4a32"] : ["#5a5a3a", "#3a3a2a"];
      for (var ty = top; ty < base; ty += 0.004) {
        put(tx - w * 0.25 + (r() - 0.5) * w * 0.3, ty, 0.009, bark[0], 1.57 + (r() - 0.5) * 0.3, 0.55, 0.2 + r() * 0.2);
        put(tx + w * 0.25 + (r() - 0.5) * w * 0.3, ty, 0.009, bark[1], 1.57 + (r() - 0.5) * 0.3, 0.55, 0.2 + r() * 0.2);
      }
    }
    // the canopy: tiny leaves, lighter toward the middle, a few grey flecks of sky
    var leaves = K.pal([["#c9d0a8", 0.7], ["#b9c86a", 1.2], ["#9ccf6a", 1.6], ["#6fb050", 2.6], ["#4f9a4a", 3], ["#2f7a4a", 2.8], ["#7a9a3a", 1.6], ["#1f5a3a", 2]]);
    var cs = 0.0075;
    for (y = -0.02; y < 0.74; y += cs * 0.38) for (xx = -0.02; xx < a + 0.02; xx += cs * 0.46) {
      var px = xx + (r() - 0.5) * cs, py = y + (r() - 0.5) * cs;
      var light = Math.max(0, 1 - Math.hypot((px / a - 0.52) * 1.6, (py - 0.28) * 1.8));
      var bottom = py > 0.6 ? (py - 0.6) / 0.14 : 0;          // the canopy thins above the trunk row
      if (r() < bottom * 0.9) continue;
      put(px, py, cs * (1 + r() * 0.6), K.pick(leaves, r, Math.max(0, (n(px * 6, py * 6) - 0.45) * 2.2 - light * 1.2)), (r() - 0.5) * 2.8, 0.55, 0.3 + r() * 0.7);
    }
    // lawn
    var lawn = K.pal([["#8fd060", 1.4], ["#5fb04a", 3], ["#3f9a4a", 2.4], ["#2f7a3a", 1.4]]);
    for (y = 0.85; y < 1.02; y += 0.005) for (xx = -0.02; xx < a + 0.02; xx += 0.008) put(xx + (r() - 0.5) * 0.006, y, 0.012 + (y - 0.85) * 0.03, K.pick(lawn, r, 0), (r() - 0.5) * 0.25, 0.4, 0.3 + r() * 0.6);
    enqueue(c, list, W, H, true);
    return c;
  }

  // ——— trees ————————————————————————————————————————————————————————————
  // Each tree is a trunk sprite and a crown sprite; the wind bends them apart.
  function tree(seed, kind) {
    var r = K.rng(seed), n = K.noise2(K.rng(seed + 1)), TW = kind === "life" ? 700 : 300, TH = 1300, trunk = off(TW * RES, TH * RES), list = [];
    var lean = (r() - 0.5) * 24, base = TW / 2, w0 = kind === "plane" ? 46 : kind === "pear" ? 38 : 30;
    var camo = [K.pal([["#5a6a3a", 3], ["#7a7a4a", 2], ["#8a9a6a", 1.5]]), K.pal([["#3f4a2a", 3], ["#4a3a2a", 2], ["#2f3a26", 1]]), K.pal([["#a9b08a", 3], ["#c9c8a0", 1.5], ["#8f9a72", 2]])];
    var bark = kind === "plane" ? null : kind === "pear" ? K.pal([["#7a6450", 4], ["#8c7660", 2], ["#5e4c3e", 2], ["#8a9a6a", 1]])
      : kind === "life" ? K.pal([["#8a6a3a", 3], ["#a77d27", 2], ["#6a5030", 2], ["#c9a043", 1]])
      : K.pal([["#eef2e8", 4], ["#d8e0d6", 3], ["#b9c9c0", 1.5], ["#8fa8a8", 1]]);
    for (var y = TH * 0.1; y < TH; y += 4) {
      var t = (TH - y) / TH, cx = base + lean * t + (n(y / 90, seed) - 0.5) * 10, w = w0 * (1 - t * 0.45);
      for (var k = 0; k < 3; k++) {
        var px = cx + (r() - 0.5) * w, side = (px - cx) / w;
        var col = kind === "plane" ? K.pick(camo[Math.min(2, Math.floor(n(px / 22, y / 40) * 3.2))], r, 0)
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
    var leaves = kind === "pear" ? K.pal([["#b9c86a", 1.2], ["#9ccf6a", 1.6], ["#6fb050", 2.6], ["#4f9a4a", 2.6], ["#2f7a4a", 2.4], ["#1f5a3a", 1.6]])
      : kind === "life" ? K.pal([["#e8c96a", 1.6], ["#c9a043", 1.2], ["#a8d050", 2], ["#5a9e44", 2], ["#2f5a3a", 1.4], ["#5a60aa", 1]])
      : K.pal([["#c9d0a8", 0.6], ["#b9c86a", 1.1], ["#9ccf6a", 1.6], ["#6fb050", 2.6], ["#4f9a4a", 3], ["#2f7a4a", 2.6], ["#7a9a3a", 1.4], ["#1f5a3a", 1.8]]);
    var lights = K.pal([["#c9d0a8", 1.4], ["#b9c86a", 2], ["#9ccf6a", 2]]);
    for (var cI = 0; cI < 12; cI++) {
      var ccx = CW * (0.26 + r() * 0.48), ccy = CH * (0.3 + r() * 0.36), rad2 = CH * (0.12 + r() * 0.09);
      for (var j = 0; j < 1100; j++) {
        var an = r() * 6.2832, dd = Math.sqrt(r()), qx = ccx + Math.cos(an) * dd * rad2 * 1.35, qy = ccy + Math.sin(an) * dd * rad2;
        var rel = (qy - ccy) / rad2, c2 = rel < -0.2 && r() < 0.7 ? K.pick(lights, r, 0) : K.pick(leaves, r, Math.max(0, rel + 0.4));
        cl.push([qx / CH, qy / CH, (4 + r() * 4) / CH, (2.2 + r() * 2) / CH, (r() - 0.5) * 2.8, K.jitter(c2, r, 22), r()]);
      }
    }
    enqueue(crown, cl, CH * RES, CH * RES, true);
    var sp = { trunk: trunk, crown: crown, TW: TW, TH: TH, CW: CW, CH: CH, lean: lean, hasCrown: kind !== "birch" || r() < 0.75, seed: seed, kind: kind };
    // spirals go on after the bark is painted
    if (spirals.length) queue.splice(1, 0, { c: trunk.getContext("2d"), list: [], w: 0, h: 0, i: 0, after: function (tc) {
      tc.save(); tc.scale(RES, RES); tc.lineCap = "round";
      spirals.forEach(function (s) { tc.strokeStyle = s.col; tc.lineWidth = s.w; tc.beginPath(); s.pts.forEach(function (pt, i) { if (i) tc.lineTo(pt[0], pt[1]); else tc.moveTo(pt[0], pt[1]); }); tc.stroke(); });
      tc.restore();
    } });
    return sp;
  }

  // ——— the valley: Järvsö dal, from the square scene in klimt.js ————————————
  function valley(S) {
    var scene = K.scenes.jarvso(), c = off(S, S), water = null, waterDabs = null, x = c.getContext("2d");
    scene.layers.forEach(function (ly) {
      var shape = function (sh) { x.fillStyle = sh.c; x.beginPath(); sh.p.forEach(function (p, i) { if (i) x.lineTo(p[0] * S, p[1] * S); else x.moveTo(p[0] * S, p[1] * S); }); x.closePath(); x.fill(); };
      ly.shapes.forEach(function (sh) { if (!sh.late) shape(sh); });
      if (ly.id === "water") { waterDabs = ly.dabs; water = off(S, S); }
      else {
        enqueue(c, ly.dabs.slice(), S, S, true);
        var late = ly.shapes.filter(function (sh) { return sh.late; });
        if (late.length) queue.push({ c: x, after: function () { late.forEach(shape); } });
      }
    });
    return { img: c, water: water, waterDabs: waterDabs, S: S };
  }

  // ——— the world ——————————————————————————————————————————————————————————
  // the canvas renders at 1x: the brushwork is soft by nature and it keeps every frame light
  var dpr = EXPORT ? 1.5 : 1, VW = 0, VH = 0;
  var backdrop, sprites = [], trees = [], motes = [], vista, slotRect = null;
  function layout() {
    VW = stage.clientWidth; VH = stage.clientHeight;
    canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);
    var sr = slot.getBoundingClientRect(), st = stage.getBoundingClientRect();
    slotRect = { x: sr.left - st.left, y: sr.top - st.top, w: sr.width, h: sr.height };
  }
  var steps = [];
  function build() {
    var i;
    layout();
    var kinds = ["plane", "plane", "birch", "plane", "plane", "pear", "plane", "birch", "plane", "plane"];
    var slots = kinds.map(function () { return {}; });
    var liveTree = function (i) { return function () { var t = tree(500 + i * 37, kinds[i]); for (var key in t) slots[i][key] = t[key]; }; };
    var liveBackdrop = function () {
      var w = EXPORT ? 3000 : Math.round(1700 * dpr), h = EXPORT ? 1765 : Math.round(1000 * dpr);
      if (!backdrop || backdrop.width !== w) { backdrop = off(w, h); var bx = backdrop.getContext("2d"); bx.fillStyle = "#3d4a2c"; bx.fillRect(0, 0, w, h); }
      var b = forestBackdrop(w, h); backdrop.getContext("2d").drawImage(b, 0, 0); backdropSrc = b;
    };
    if (A) {
      // the painted assets: load them; any that fail are painted live instead
      A.trees.forEach(function (m, i) {
        var s2 = slots[i];
        for (var key in m) if (key !== "trunk" && key !== "crown") s2[key] = m[key];
        asset(m.trunk, liveTree(i), function (b) { s2.trunk = b; });
        asset(m.crown, null, function (b) { s2.crown = b; });
      });
      backdrop = null;
      asset(A.backdrop, liveBackdrop, function (b) { backdrop = b; });
      glints = A.glints;
    } else {
      backdrop = off(Math.round(1700 * dpr), Math.round(1000 * dpr));
      backdrop.getContext("2d").fillStyle = "#3d4a2c"; backdrop.getContext("2d").fillRect(0, 0, backdrop.width, backdrop.height);
      kinds.forEach(function (k, i) { steps.push(liveTree(i)); });
      steps.push(liveBackdrop);
    }
    sprites = slots;
    var r = K.rng(77);
    // a dense wood in depth, with a path of light down the middle
    for (var z = 0.8; z < 10.5; z += 0.34) {
      var count = 4 + Math.floor(r() * 4);
      for (var k = 0; k < count; k++) {
        var side = r() < 0.5 ? -1 : 1, x = side * (0.36 + z * 0.06 + Math.pow(r(), 1.3) * 4.2);
        trees.push({ x: x, z: z + r() * 0.3, h: 2.8 + r() * 1.8, sp: sprites[Math.floor(r() * sprites.length)], phase: r() * 6.28, stiff: 0.55 + r() * 0.8 });
      }
    }
    trees.sort(function (a, b) { return b.z - a.z; });
    // drifting gold: flakes, small spirals, leaves
    var cols = ["#9ccf6a", "#b9c86a", "#6fb050", "#c9d0a8", "#4f9a4a"];
    for (i = 0; i < 120; i++) {
      var kindM = "leaf";
      motes.push({ x: (r() - 0.5) * 7, y: r() * 2.8 - 0.4, z: 0.4 + r() * 10, s: 0.6 + r() * 1.4, c: kindM === "sq" ? GOLDS[Math.floor(r() * GOLDS.length)] : cols[Math.floor(r() * cols.length)], ph: r() * 6.28, rot: r() * 3, kind: kindM });
    }
    var VS = EXPORT ? 2048 : Math.round(Math.min(2048, Math.max(VW, VH) * dpr * 1.05));
    vista = { img: off(VS, VS), water: null, waterDabs: null, S: VS };
    var liveValley = function () { var v = valley(VS); vista.img = v.img; vista.water = v.water; vista.waterDabs = v.waterDabs; };
    if (A) {
      vista.img = null;
      asset(A.valley, liveValley, function (b) { vista.img = b; });
      // the river keeps moving, so its dabs stay live
      steps.push(function () { var sc = K.scenes.jarvso(); sc.layers.forEach(function (ly) { if (ly.id === "water") { vista.waterDabs = ly.dabs; vista.water = off(VS, VS); } }); });
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
  var backdropSrc = null;

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
    if (backdropSrc && !queue.some(function (q) { return q.c && q.c.canvas === backdropSrc; })) { backdrop = backdropSrc; backdropSrc = null; }
    var pt = progress();
    p += (pt - p) * (calm ? 1 : Math.min(1, dt * 7));
    var t = now / 1000;
    // wind: a slow swell with gusts
    // no wind in the trees; only a faint drift for the falling gold
    wind = 0.12 + Math.sin(t * 0.3) * 0.08;
    tpx = tpy = 0;
    px += (tpx - px) * 0.03; py += (tpy - py) * 0.03;

    var walk = smooth(0, 0.72, p), open = smooth(0.48, 0.66, p), dock = smooth(0.8, 0.98, p);
    var breathe = 0;
    var camZ = walk * 10 + breathe, camX = px * 0.35, camY = py * 0.12;
    var c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, VW, VH);

    // the valley waits behind the wood; at the end it docks into the print
    if (open > 0) {
      c.globalAlpha = open; c.fillStyle = PAPER; c.fillRect(0, 0, VW, VH);
      c.globalAlpha = 1;
      var R = cover(vista.S, vista.S, lerp(1.12, 1.0, smooth(0.48, 0.8, p)), 0.5, 0.62);
      if (dock > 0 && slotRect) R = { x: lerp(R.x, slotRect.x, dock), y: lerp(R.y, slotRect.y, dock), w: lerp(R.w, slotRect.w, dock), h: lerp(R.h, slotRect.h, dock) };
      c.save(); c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();
      if (ready(vista.img)) c.drawImage(vista.img, R.x, R.y, R.w, R.h);
      if (vista.water) drawWater(c, R, calm ? 0 : t);
      c.restore();
    }
    // the deep wood and its gold
    var fa = 1 - open;
    if (fa > 0 && ready(backdrop)) {
      c.globalAlpha = fa;
      var B = cover(backdrop.width, backdrop.height, 1.06 + walk * 0.14, 0.5 - px * 0.02, 0.45 - py * 0.02);
      c.drawImage(backdrop, B.x, B.y, B.w, B.h);
      for (var gI = 0; gI < glints.length; gI++) {
        var gl = glints[gI], tw = Math.pow(Math.max(0, Math.sin(t * 1.6 + gl[3])), 6);
        if (tw < 0.05) continue;
        c.globalAlpha = fa * tw;
        square(c, B.x + gl[0] * B.w, B.y + gl[1] * B.h, gl[2] * B.h * 1.1, 0.2, "#fff4c8");
      }
    }
    // trees, far to near
    var horizon = VH * 0.47 - camY * VH * 0.1, unit = VH * 0.5, cx = VW / 2;
    for (var i = 0; i < trees.length; i++) {
      var tr = trees[i], dz = tr.z - camZ;
      if (dz < 0.2 || dz > 10.5 || !ready(tr.sp.trunk)) continue;
      var sc = unit / dz, a = smooth(0.2, 0.5, dz) * (1 - smooth(8, 10.5, dz)) * (1 - dock);
      if (a <= 0.01) continue;
      var baseX = cx + (tr.x - camX) * sc * 1.15, baseY = horizon + 0.95 * sc, hgt = tr.h * sc, sp = tr.sp;
      if (baseX < -hgt * 0.7 || baseX > VW + hgt * 0.7) continue;
      var sway = 0;
      c.globalAlpha = a * (open > 0 ? lerp(1, 0.85, open) : 1);
      c.save();
      c.translate(baseX, baseY); c.rotate(sway);
      var twd = hgt * sp.TW / sp.TH;
      c.drawImage(sp.trunk, -twd / 2, -hgt, twd, hgt);
      if (sp.hasCrown && ready(sp.crown)) {
        c.translate(sp.lean / sp.TW * twd, -hgt * 0.86);

        var cw = hgt * 1.05, ch = cw * sp.CH / sp.CW;
        c.drawImage(sp.crown, -cw / 2, -ch * 0.78, cw, ch);
      }
      c.restore();
    }
    // drifting gold, spirals and leaves
    var ma = (1 - dock) * (calm ? 0 : 1);
    if (ma > 0) {
      for (i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y += dt * (0.05 + m.s * 0.03); m.x += dt * (wind * 0.22 + Math.sin(t + m.ph) * 0.05); m.rot += dt * (0.8 + wind * 1.2);
        var mz = m.z - camZ;
        if (mz < 0.3) { m.z += 10; mz = m.z - camZ; m.y = -0.4; }
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
    if (label) { var lo = smooth(0.86, 1, p); label.style.opacity = lo.toFixed(3); label.style.pointerEvents = lo > 0.5 ? "auto" : "none"; }
    // lines that surface and sink as you pass them
    for (var li = 0; li < lines.length; li++) {
      var L = lines[li], lt = clamp((p - L.a) / (L.b - L.a), 0, 1), lo2 = smooth(0, 0.3, lt) * (1 - smooth(0.7, 1, lt));
      L.el.style.opacity = lo2.toFixed(3);
      L.el.style.transform = "translate3d(-50%," + ((0.5 - lt) * 60).toFixed(1) + "px,0)";
      L.el.style.filter = "blur(" + ((1 - lo2) * 8).toFixed(1) + "px)";
      L.el.style.letterSpacing = (0.3 + (1 - lo2) * 0.25).toFixed(3) + "em";
    }
    if (rail) { rail.style.transform = "scaleY(" + p.toFixed(4) + ")"; rail.parentNode.style.opacity = (1 - dock).toFixed(3); }
    if (shade) shade.style.opacity = (1 - open).toFixed(3);
    stage.classList.toggle("is-paper", dock > 0.5);
  }
  var lastWater = 0;
  function drawWater(c, R, t) {
    if (!vista.waterDrawn || (t && t - lastWater > 0.08)) {
      vista.waterDrawn = true;
      lastWater = t;
      var S = vista.S, w = vista.water.getContext("2d"), list = vista.waterDabs;
      w.clearRect(0, 0, S, S);
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
    if (backdropSrc) backdrop = backdropSrc;
    window.__klimtExport = {
      trees: sprites.map(function (sp) { return { trunk: sp.trunk.toDataURL("image/webp", 0.86), crown: sp.crown.toDataURL("image/webp", 0.86), TW: sp.TW, TH: sp.TH, CW: sp.CW, CH: sp.CH, lean: sp.lean, hasCrown: sp.hasCrown, seed: sp.seed, kind: sp.kind }; }),
      backdrop: backdrop.toDataURL("image/webp", 0.8),
      valley: vista.img.toDataURL("image/webp", 0.86),
      glints: glints
    };
    return;
  }
  raf = requestAnimationFrame(frame);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }).observe(stage);
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
})();
