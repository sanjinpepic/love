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
  var osReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches, optIn = false;
  try { optIn = localStorage.getItem("k-motion") === "on"; } catch (e) { /* storage blocked */ }
  if (/[?&]motion=on\b/.test(location.search)) optIn = true;
  var reduce = osReduce && !optIn;
  var stage = section.querySelector(".journey-stage");
  var canvas = section.querySelector(".journey-canvas"), ctx = canvas.getContext("2d");
  var slot = section.querySelector(".painting-slot");
  var intro = section.querySelector(".journey-intro"), cue = section.querySelector(".journey-cue");
  var label = section.querySelector(".journey-print .label");
  var lines = [].slice.call(section.querySelectorAll(".jl")).map(function (el) { return { el: el, a: +el.dataset.from, b: +el.dataset.to }; });
  var rail = section.querySelector(".journey-rail span");
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
    var r = K.rng(1903), n = K.noise2(K.rng(19)), c = off(W, H), x = c.getContext("2d"), list = [];
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#23382c"); g.addColorStop(0.3, "#5b5a2a"); g.addColorStop(0.48, "#c9a043"); g.addColorStop(0.62, "#8a6a2a"); g.addColorStop(1, "#5a3a22");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // gold leaf laid in squares behind everything: the light of the wood is gold
    for (var i = 0; i < 2600; i++) {
      var gx = r(), gy = 0.14 + r() * 0.52, dl = Math.abs(gy - 0.42) * 1.6 + Math.abs(gx - 0.5) * 0.5;
      if (r() < dl) continue;
      var gs = (0.006 + r() * 0.016) * H;
      square(x, gx * W, gy * H, gs, (r() - 0.5) * 0.3, GOLDS[Math.floor(r() * GOLDS.length)]);
      if (r() < 0.06) glints.push([gx, gy, gs / H, r() * 6.28]);
    }
    var rg = x.createRadialGradient(W * 0.5, H * 0.44, 0, W * 0.5, H * 0.44, H * 0.5);
    rg.addColorStop(0, "rgba(255,246,200,.85)"); rg.addColorStop(0.5, "rgba(240,214,130,.35)"); rg.addColorStop(1, "rgba(240,214,130,0)");
    x.fillStyle = rg; x.fillRect(0, 0, W, H);
    var a = W / H, s = 0.012;
    var put = function (px, py, size, col, ang, ratio, order) { list.push([px / a, py, size * (0.42 + r() * 0.36) / a, size * (0.42 + r() * 0.36) * (ratio || 0.48) / a, ang, K.jitter(col, r, 26), order]); };
    // a wall of far birches, dense as in Klimt's Birch Forest
    for (var t = 0; t < 170; t++) {
      var tx = r() * a, w = 0.005 + r() * 0.012, top = -0.02 + r() * 0.12, base = 0.58 + r() * 0.06, mid = Math.abs(tx / a - 0.5);
      var bark = mid < 0.1 ? ["#f4f0de", "#dcd6bc"] : r() < 0.55 ? ["#e2e2d8", "#b8bcb2"] : ["#a3aca0", "#7f8a80"];
      for (var ty = top; ty < base; ty += 0.004) {
        put(tx - w * 0.25 + (r() - 0.5) * w * 0.4, ty, 0.008, bark[0], 1.57 + (r() - 0.5) * 0.3, 0.55, 0.2 + r() * 0.4);
        put(tx + w * 0.25 + (r() - 0.5) * w * 0.4, ty, 0.008, bark[1], 1.57 + (r() - 0.5) * 0.3, 0.55, 0.2 + r() * 0.4);
        if (r() < 0.09) put(tx + (r() - 0.5) * w * 0.5, ty, 0.007, "#2a2a26", (r() - 0.5) * 0.3, 0.3, 0.75 + r() * 0.2);
      }
    }
    // the canopy: dark crowns with gold catching in them
    var canopy = K.pal([["#e2c25a", 0.8], ["#c9dc5a", 1.2], ["#8fc44a", 2], ["#5a9e44", 3], ["#3f7f3e", 3], ["#2f5a3a", 3], ["#4c5296", 1.6], ["#2c2f5e", 1.2]]);
    for (var y = -0.02; y < 0.3; y += s * 0.42) for (var xx = -0.02; xx < a + 0.02; xx += s * 0.5) {
      var px = xx + (r() - 0.5) * s, py = y + (r() - 0.5) * s;
      if (r() > 0.55 + (0.3 - py) * 2) continue;
      put(px, py, s * (1.2 + (0.3 - py) * 1.6), K.pick(canopy, r, Math.max(0, (n(px * 5, py * 5) - 0.3) * 2)), (r() - 0.5) * 2.6, 0.5, r());
    }
    // the floor: leaves turning gold and rust, woven with Kiss flowers
    var floor = K.pal([["#b9d052", 2], ["#8fc44a", 2], ["#d9a43a", 2.6], ["#c0703a", 2.2], ["#e2c25a", 1.6], ["#6a5aa0", 0.9], ["#5a9e44", 1.4]]);
    for (y = 0.58; y < 1.02; y += s * 0.48) for (xx = -0.02; xx < a + 0.02; xx += s * 0.56) {
      put(xx + (r() - 0.5) * s, y + (r() - 0.5) * s, s * (0.7 + (y - 0.58) * 2.4), K.pick(floor, r, 0), (r() - 0.5) * 0.8, 0.5, 0.2 + r() * 0.6);
    }
    var jewels = ["#b8352a", "#2f4a8a", "#d98aa0", "#6b4a8a", "#f2efe0", "#e8c96a", "#4f7a4a"];
    for (i = 0; i < 520; i++) {
      var fx = r() * a, fy = 0.6 + Math.pow(r(), 0.7) * 0.42, fr = 0.004 + (fy - 0.6) * 0.03 * (0.6 + r() * 0.8);
      var outer = jewels[Math.floor(r() * jewels.length)];
      list.push([fx / a, fy, fr / a, fr / a, 0, outer, 0.85 + r() * 0.1]);
      list.push([fx / a, fy, fr * 0.55 / a, fr * 0.55 / a, 0, r() < 0.5 ? "#f2efe0" : "#e8c96a", 0.9 + r() * 0.05]);
      list.push([fx / a, fy, fr * 0.2 / a, fr * 0.2 / a, 0, "#3a2a22", 0.95 + r() * 0.04]);
    }
    enqueue(c, list, W, H, true);
    return c;
  }

  // ——— trees ————————————————————————————————————————————————————————————
  // Each tree is a trunk sprite and a crown sprite; the wind bends them apart.
  function tree(seed, kind) {
    var r = K.rng(seed), n = K.noise2(K.rng(seed + 1)), TW = kind === "life" ? 700 : 300, TH = 1300, trunk = off(TW * RES, TH * RES), list = [];
    var lean = (r() - 0.5) * 30, base = TW / 2, w0 = kind === "life" ? 44 : kind === "pear" ? 38 : 30;
    var bark = kind === "pear" ? K.pal([["#7a6450", 4], ["#8c7660", 2], ["#5e4c3e", 2], ["#8a9a6a", 1]])
      : kind === "life" ? K.pal([["#8a6a3a", 3], ["#a77d27", 2], ["#6a5030", 2], ["#c9a043", 1]])
      : K.pal([["#f1f0e8", 4], ["#dcdbd0", 3], ["#c4c6c0", 1.5], ["#9aa0a8", 1]]);
    for (var y = TH * 0.1; y < TH; y += 4) {
      var t = (TH - y) / TH, cx = base + lean * t + (n(y / 90, seed) - 0.5) * 10, w = w0 * (1 - t * 0.45);
      for (var k = 0; k < 3; k++) {
        var px = cx + (r() - 0.5) * w, side = (px - cx) / w;
        var col = side > 0.22 && kind === "birch" ? (r() < 0.6 ? "#a9aeb4" : "#c4c6c0") : K.pick(bark, r, 0);
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
    var leaves = kind === "pear" ? K.pal([["#d8e05a", 1.2], ["#a8d050", 2], ["#7fb84a", 2.6], ["#4f9a3c", 2.4], ["#2f6a4a", 1.6], ["#5a60aa", 1], ["#e8ec78", 0.5]])
      : kind === "life" ? K.pal([["#e8c96a", 1.6], ["#c9a043", 1.2], ["#a8d050", 2], ["#5a9e44", 2], ["#2f5a3a", 1.4], ["#5a60aa", 1]])
      : K.pal([["#d4e05a", 1.4], ["#b4d652", 2.2], ["#8fc44a", 2.6], ["#5a9e44", 2], ["#3f7f3e", 1.4], ["#5a60aa", 0.9], ["#e2c25a", 0.5]]);
    var lights = K.pal([["#e2e86a", 2], ["#c8de60", 2], ["#e8c96a", 1]]);
    for (var cI = 0; cI < 12; cI++) {
      var ccx = CW * (0.26 + r() * 0.48), ccy = CH * (0.3 + r() * 0.36), rad2 = CH * (0.12 + r() * 0.09);
      for (var j = 0; j < 560; j++) {
        var an = r() * 6.2832, dd = Math.sqrt(r()), qx = ccx + Math.cos(an) * dd * rad2 * 1.35, qy = ccy + Math.sin(an) * dd * rad2;
        var rel = (qy - ccy) / rad2, c2 = rel < -0.2 && r() < 0.7 ? K.pick(lights, r, 0) : K.pick(leaves, r, Math.max(0, rel + 0.4));
        cl.push([qx / CH, qy / CH, (6 + r() * 6) / CH, (3 + r() * 3) / CH, (r() - 0.5) * 2.6, K.jitter(c2, r, 24), r()]);
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
    var kinds = ["birch", "birch", "birch", "life", "birch", "pear", "birch", "life", "birch", "pear"];
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
    var cols = ["#d9b44a", "#e8c96a", "#f0d890", "#c9a043", "#c0703a", "#c9dc5a", "#f2efe0", "#b8352a"];
    for (i = 0; i < 280; i++) {
      var kindM = r() < 0.45 ? "sq" : r() < 0.12 ? "spiral" : "leaf";
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
    img.src = base + file;
  }
  function ready(im) { return !!im && (im.getContext || (window.ImageBitmap && im instanceof ImageBitmap) || (im.complete && im.naturalWidth > 0)); }
  var backdropSrc = null;

  // ——— drawing ——————————————————————————————————————————————————————————
  var p = 0, last = performance.now(), wind = 0, px = 0, py = 0, tpx = 0, tpy = 0, pointer = false;
  window.addEventListener("pointermove", function (e) { if (e.pointerType === "touch") return; pointer = true; tpx = e.clientX / window.innerWidth * 2 - 1; tpy = e.clientY / window.innerHeight * 2 - 1; }, { passive: true });
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
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (steps.length) steps.shift()();
    else if (queue.length) pump(now < 4000 ? 12 : 8);
    if (backdropSrc && !queue.some(function (q) { return q.c && q.c.canvas === backdropSrc; })) { backdrop = backdropSrc; backdropSrc = null; }
    var pt = progress();
    p += (pt - p) * (reduce ? 1 : Math.min(1, dt * 7));
    var t = now / 1000;
    // wind: a slow swell with gusts
    // no wind in the trees; only a faint drift for the falling gold
    wind = 0.12 + Math.sin(t * 0.3) * 0.08;
    if (!pointer) { tpx = Math.sin(t * 0.17) * 0.35; tpy = Math.sin(t * 0.13) * 0.2; }
    px += (tpx - px) * 0.03; py += (tpy - py) * 0.03;

    var walk = smooth(0, 0.7, p), open = smooth(0.56, 0.64, p), dock = smooth(0.8, 0.98, p);
    var breathe = (Math.sin(t * 0.3) * 0.5 + 0.5) * 0.35 * (1 - walk);
    var camZ = walk * 10 + breathe, camX = px * 0.35, camY = py * 0.12;
    var c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, VW, VH);

    // the valley waits behind the wood; at the end it docks into the print
    if (open > 0) {
      c.globalAlpha = open; c.fillStyle = PAPER; c.fillRect(0, 0, VW, VH);
      c.globalAlpha = Math.min(1, open * 1.4);
      var R = cover(vista.S, vista.S, lerp(1.18, 1.02, smooth(0.58, 0.8, p)), 0.5, 0.62);
      if (dock > 0 && slotRect) R = { x: lerp(R.x, slotRect.x, dock), y: lerp(R.y, slotRect.y, dock), w: lerp(R.w, slotRect.w, dock), h: lerp(R.h, slotRect.h, dock) };
      c.save(); c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();
      if (ready(vista.img)) c.drawImage(vista.img, R.x, R.y, R.w, R.h);
      if (vista.water) drawWater(c, R, reduce ? 0 : t);
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

        var cw = hgt * 0.7, ch = cw * sp.CH / sp.CW;
        c.drawImage(sp.crown, -cw / 2, -ch * 0.78, cw, ch);
      }
      c.restore();
    }
    // drifting gold, spirals and leaves
    var ma = (1 - dock) * (reduce ? 0 : 1);
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
    // leaving the wood: gold light floods in, then lifts on the valley
    var veil = smooth(0.46, 0.6, p) * (1 - smooth(0.62, 0.78, p));
    if (veil > 0) {
      var vg = c.createRadialGradient(VW / 2, VH * 0.46, 0, VW / 2, VH * 0.46, Math.max(VW, VH) * 0.75);
      vg.addColorStop(0, "rgba(255,250,226,1)"); vg.addColorStop(0.55, "rgba(246,228,170,.95)"); vg.addColorStop(1, "rgba(217,180,74,.85)");
      c.globalAlpha = veil; c.fillStyle = vg; c.fillRect(0, 0, VW, VH);
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
    stage.classList.toggle("is-paper", dock > 0.5);
    raf = visible ? requestAnimationFrame(frame) : 0;
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
    if (progress() < 0.99) window.scrollTo({ top: section.offsetTop + section.offsetHeight - window.innerHeight, behavior: reduce ? "auto" : "smooth" });
  });
  if (!reduce) {
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
  var motionBtn = section.querySelector(".journey-motion");
  if (reduce) {
    // the device asks for less motion: show the print at once, painted in quietly,
    // and offer the walk as a choice
    section.classList.add("is-still");
    layout();
    var VS = Math.round(Math.min(2048, Math.max(VW, VH) * dpr * 1.05));
    vista = { img: off(VS, VS), S: VS };
    steps.push(function () { var v = valley(VS); vista.img = v.img; vista.water = v.water; vista.waterDabs = v.waterDabs; });
    backdrop = off(2, 2); p = 1;
    if (motionBtn) {
      motionBtn.hidden = false;
      motionBtn.addEventListener("click", function () {
        try { localStorage.setItem("k-motion", "on"); } catch (e) { /* storage blocked */ }
        location.search = location.search ? location.search + "&motion=on" : "?motion=on";
      });
    }
  } else build();
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
