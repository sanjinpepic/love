/* The walk: you arrive inside a Klimt birch forest moving in the wind, and as
   you scroll you walk through it; the trunks part and pass, the wood opens on
   Järvsö dal, and the valley settles into the square of the print.
   Uses the dab painter from klimt.js (window.KlimtPaint). */
(function () {
  "use strict";
  var K = window.KlimtPaint, section = document.querySelector("[data-journey]");
  if (!K || !section) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage = section.querySelector(".journey-stage");
  var canvas = section.querySelector(".journey-canvas"), ctx = canvas.getContext("2d");
  var slot = section.querySelector(".painting-slot");
  var intro = section.querySelector(".journey-intro"), cue = section.querySelector(".journey-cue");
  var label = section.querySelector(".journey-print .label");
  var PAPER = "#f6f7f3";

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ——— painting helpers ——————————————————————————————————————————————————
  function off(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function dab(c, x, y, rx, ry, a, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, 6.2832); c.fill(); }
  // Paint a list of unit-space dabs into a canvas over several frames, so the
  // forest appears dab by dab instead of blocking the page.
  var queue = [];
  function enqueue(target, list, w, h, shuffle) {
    if (shuffle) list.sort(function (a, b) { return a[6] - b[6]; });
    queue.push({ c: target.getContext("2d"), list: list, w: w, h: h, i: 0 });
  }
  function pump(budget) {
    var t0 = performance.now();
    while (queue.length && performance.now() - t0 < budget) {
      var q = queue[0], end = Math.min(q.list.length, q.i + 700);
      for (; q.i < end; q.i++) { var d = q.list[q.i]; dab(q.c, d[0] * q.w, d[1] * q.h, d[2] * q.w, d[3] * q.w, d[4], d[5]); }
      if (q.i >= q.list.length) queue.shift();
    }
    return queue.length;
  }

  // ——— the forest backdrop (after Klimt's Birch Forest) ——————————————————————
  function forestBackdrop(W, H) {
    var r = K.rng(1903), n = K.noise2(K.rng(19)), c = off(W, H), x = c.getContext("2d"), list = [];
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2f4a36"); g.addColorStop(0.32, "#5d7a4a"); g.addColorStop(0.55, "#c9cf9a"); g.addColorStop(0.7, "#9a8a4a"); g.addColorStop(1, "#7a5a32");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // a pool of light between the trees, where the names stand
    var rg = x.createRadialGradient(W * 0.5, H * 0.46, 0, W * 0.5, H * 0.46, H * 0.55);
    rg.addColorStop(0, "rgba(250,246,222,.95)"); rg.addColorStop(0.45, "rgba(236,232,190,.5)"); rg.addColorStop(1, "rgba(236,232,190,0)");
    x.fillStyle = rg; x.fillRect(0, 0, W, H);
    var a = W / H; // unit space is square in height; x spans 0..a
    var s = 0.012;
    var put = function (px, py, size, col, ang, ratio, order) { list.push([px / a, py, size * (0.42 + r() * 0.36) / a, size * (0.42 + r() * 0.36) * (ratio || 0.48) / a, ang, K.jitter(col, r, 26), order]); };
    // canopy: dark greens and violet with dapples of light, thinning toward the light
    var canopy = K.pal([["#c9dc5a", 1], ["#8fc44a", 2], ["#5a9e44", 3], ["#3f7f3e", 3], ["#2f5a3a", 3], ["#4c5296", 1.6], ["#2c2f5e", 1]]);
    for (var y = -0.02; y < 0.46; y += s * 0.45) for (var xx = -0.02; xx < a + 0.02; xx += s * 0.55) {
      var px = xx + (r() - 0.5) * s, py = y + (r() - 0.5) * s, dl = Math.hypot((px - a * 0.5) / a, (py - 0.46) * 1.3);
      if (r() > 0.25 + dl * 1.6) continue; // the light thins the leaves
      put(px, py, s * (1 + (0.46 - py) * 1.2), K.pick(canopy, r, Math.max(0, (n(px * 5, py * 5) - 0.3) * 2)), (r() - 0.5) * 2.6, 0.5, r());
    }
    // far trunks in haze
    for (var t = 0; t < 70; t++) {
      var tx = r() * a, w = 0.003 + r() * 0.006, top = 0.05 + r() * 0.2, base = 0.6 + r() * 0.06, dl2 = Math.abs(tx / a - 0.5);
      var col = dl2 < 0.18 ? "#d8d8c4" : r() < 0.5 ? "#a9b0a0" : "#c9c9b8";
      for (var ty = top; ty < base; ty += 0.006) put(tx + (r() - 0.5) * w, ty, 0.007, r() < 0.12 ? "#3a3a36" : col, 1.57 + (r() - 0.5) * 0.4, 0.4, 0.3 + r() * 0.5);
    }
    // the forest floor: late-summer greens turning to ochre and rust
    var floor = K.pal([["#b9d052", 2], ["#8fc44a", 2], ["#d9a43a", 2.4], ["#c0703a", 2], ["#e2c25a", 1.4], ["#6a5aa0", 0.8], ["#5a9e44", 1.4]]);
    for (y = 0.6; y < 1.02; y += s * 0.5) for (xx = -0.02; xx < a + 0.02; xx += s * 0.6) {
      put(xx + (r() - 0.5) * s, y + (r() - 0.5) * s, s * (0.7 + (y - 0.6) * 2.2), K.pick(floor, r, 0), (r() - 0.5) * 0.8, 0.5, 0.2 + r() * 0.8);
    }
    enqueue(c, list, W, H, true); // x stored as a fraction of the width, y of the height
    return c;
  }

  // ——— trees: a birch trunk sprite and a crown sprite, swayed separately —————
  function birch(seed, kind) {
    var r = K.rng(seed), n = K.noise2(K.rng(seed + 1)), TW = 260, TH = 1300, trunk = off(TW, TH), list = [];
    var lean = (r() - 0.5) * 30, base = TW / 2, w0 = kind === "pear" ? 38 : 30;
    var bark = kind === "pear" ? K.pal([["#7a6450", 4], ["#8c7660", 2], ["#5e4c3e", 2], ["#8a9a6a", 1]]) : K.pal([["#f1f0e8", 4], ["#dcdbd0", 3], ["#c4c6c0", 1.5], ["#9aa0a8", 1]]);
    for (var y = TH * 0.12; y < TH; y += 4) {
      var t = (TH - y) / TH, cx = base + lean * t + (n(y / 90, seed) - 0.5) * 10, w = w0 * (1 - t * 0.45);
      for (var k = 0; k < 3; k++) {
        var px = cx + (r() - 0.5) * w, side = (px - cx) / w;
        var col = side > 0.22 && kind !== "pear" ? (r() < 0.6 ? "#a9aeb4" : "#c4c6c0") : K.pick(bark, r, 0);
        list.push([px / TH, y / TH, (5 + r() * 4) / TH, (2.2 + r() * 1.6) / TH, (r() - 0.5) * 0.5, K.jitter(col, r, 16), r()]);
      }
      if (kind !== "pear" && r() < 0.07) { // the birch's dark eyes
        var ex = cx + (r() - 0.5) * w * 0.7;
        list.push([ex / TH, y / TH, (5 + r() * 7) / TH, (1.6 + r() * 1.6) / TH, (r() - 0.5) * 0.3, "rgb(40,40,36)", r()]);
      }
    }
    enqueue(trunk, list, TH, TH, false);
    // crown
    var CW = 760, CH = 560, crown = off(CW, CH), cl = [];
    var leaves = kind === "pear" ? K.pal([["#d8e05a", 1.2], ["#a8d050", 2], ["#7fb84a", 2.6], ["#4f9a3c", 2.4], ["#2f6a4a", 1.6], ["#5a60aa", 1], ["#e8ec78", 0.5]])
      : K.pal([["#d4e05a", 1.4], ["#b4d652", 2.2], ["#8fc44a", 2.6], ["#5a9e44", 2], ["#3f7f3e", 1.4], ["#5a60aa", 0.9]]);
    var lights = K.pal([["#e2e86a", 2], ["#c8de60", 2]]);
    for (var cI = 0; cI < 9; cI++) {
      var ccx = CW * (0.32 + r() * 0.36), ccy = CH * (0.34 + r() * 0.3), rad = CH * (0.12 + r() * 0.08);
      for (var j = 0; j < 520; j++) {
        var ang = r() * 6.2832, dd = Math.sqrt(r()), qx = ccx + Math.cos(ang) * dd * rad * 1.3, qy = ccy + Math.sin(ang) * dd * rad;
        var rel = (qy - ccy) / rad, col2 = rel < -0.2 && r() < 0.7 ? K.pick(lights, r, 0) : K.pick(leaves, r, Math.max(0, rel + 0.4));
        cl.push([qx / CH, qy / CH, (6 + r() * 6) / CH, (3 + r() * 3) / CH, (r() - 0.5) * 2.6, K.jitter(col2, r, 24), r()]);
      }
    }
    enqueue(crown, cl, CH, CH, true);
    return { trunk: trunk, crown: crown, TW: TW, TH: TH, CW: CW, CH: CH, lean: lean, hasCrown: kind === "pear" || r() < 0.7 };
  }

  // ——— the valley: Järvsö dal, from the square scene in klimt.js ————————————
  function valley(S) {
    var scene = K.scenes.jarvso(), c = off(S, S), water = null, waterDabs = null;
    var x = c.getContext("2d");
    scene.layers.forEach(function (ly) {
      x.save();
      ly.shapes.forEach(function (sh) { x.fillStyle = sh.c; x.beginPath(); sh.p.forEach(function (p, i) { if (i) x.lineTo(p[0] * S, p[1] * S); else x.moveTo(p[0] * S, p[1] * S); }); x.closePath(); x.fill(); });
      x.restore();
      if (ly.id === "water") { waterDabs = ly.dabs; water = off(S, S); }
      else enqueue(c, ly.dabs.slice(), S, S, true);
    });
    return { img: c, water: water, waterDabs: waterDabs, S: S };
  }

  // ——— the world ——————————————————————————————————————————————————————————
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5), VW = 0, VH = 0;
  var backdrop, sprites = [], trees = [], motes = [], vista, slotRect = null;
  function layout() {
    VW = stage.clientWidth; VH = stage.clientHeight;
    canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);
    var sr = slot.getBoundingClientRect(), st = stage.getBoundingClientRect();
    slotRect = { x: sr.left - st.left, y: sr.top - st.top, w: sr.width, h: sr.height };
  }
  function build() {
    layout();
    backdrop = forestBackdrop(Math.round(1700 * dpr), Math.round(1000 * dpr));
    for (var i = 0; i < 7; i++) sprites.push(birch(500 + i * 37, i % 4 === 3 ? "pear" : "birch"));
    var r = K.rng(77);
    // planes of trees ahead, leaving a path through the middle that you walk down
    for (var z = 1.0; z < 9.5; z += 0.55) {
      var count = 3 + Math.floor(r() * 3);
      for (var k = 0; k < count; k++) {
        var side = r() < 0.5 ? -1 : 1, x = side * (0.42 + z * 0.09 + r() * 2.6);
        trees.push({ x: x, z: z + r() * 0.4, h: 2.6 + r() * 1.4, sp: sprites[Math.floor(r() * sprites.length)], phase: r() * 6.28, stiff: 0.6 + r() * 0.8 });
      }
    }
    trees.sort(function (a, b) { return b.z - a.z; });
    // gold flakes and leaves drifting through the wood
    var cols = ["#d9b44a", "#e8c96a", "#d9b44a", "#c0703a", "#c9dc5a", "#f2efe0", "#e0a03a"];
    for (i = 0; i < 150; i++) motes.push({ x: (r() - 0.5) * 6, y: r() * 2.6 - 0.3, z: 0.4 + r() * 9, s: 0.6 + r() * 1.2, c: cols[Math.floor(r() * cols.length)], ph: r() * 6.28, rot: r() * 3 });
    vista = valley(Math.round(Math.min(2048, Math.max(VW, VH) * dpr * 1.05)));
  }

  // ——— drawing ——————————————————————————————————————————————————————————
  var p = 0, pt = 0, last = performance.now(), wind = 0;
  function progress() {
    var rect = section.getBoundingClientRect(), span = rect.height - VH;
    return span > 0 ? clamp(-rect.top / span, 0, 1) : 1;
  }
  function cover(iw, ih, scale, fx, fy) {
    var s = Math.max(VW / iw, VH / ih) * scale, w = iw * s, h = ih * s;
    return { x: (VW - w) * (fx == null ? 0.5 : fx), y: (VH - h) * (fy == null ? 0.5 : fy), w: w, h: h };
  }
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (queue.length) pump(9);
    pt = progress();
    p += (pt - p) * (reduce ? 1 : Math.min(1, dt * 7));
    var t = now / 1000;
    wind = Math.sin(t * 0.33) * 0.55 + Math.sin(t * 0.91 + 1.3) * 0.3 + Math.max(0, Math.sin(t * 0.17 - 0.5)) * 0.6;

    var walk = smooth(0, 0.7, p), open = smooth(0.56, 0.64, p), dock = smooth(0.8, 0.98, p);
    var camZ = walk * 9.2;
    var c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, VW, VH);

    // the valley, waiting behind the trees; at the end it docks into the print
    if (open > 0) {
      c.globalAlpha = open; c.fillStyle = PAPER; c.fillRect(0, 0, VW, VH);
      c.globalAlpha = Math.min(1, open * 1.4);
      var R = cover(vista.S, vista.S, lerp(1.18, 1.02, smooth(0.58, 0.8, p)), 0.5, 0.62);
      if (dock > 0 && slotRect) R = { x: lerp(R.x, slotRect.x, dock), y: lerp(R.y, slotRect.y, dock), w: lerp(R.w, slotRect.w, dock), h: lerp(R.h, slotRect.h, dock) };
      c.save(); c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();
      c.drawImage(vista.img, R.x, R.y, R.w, R.h);
      if (vista.water) drawWater(c, R, t);
      c.restore();
    }
    // the forest interior
    var fa = 1 - open;
    if (fa > 0) {
      c.globalAlpha = fa;
      var B = cover(backdrop.width, backdrop.height, 1 + walk * 0.12, 0.5, 0.45);
      c.drawImage(backdrop, B.x, B.y, B.w, B.h);
    }
    // trees, far to near
    var horizon = VH * 0.47, unit = VH * 0.5, cx = VW / 2;
    for (var i = 0; i < trees.length; i++) {
      var tr = trees[i], dz = tr.z - camZ;
      if (dz < 0.22 || dz > 9.5) continue;
      var sc = unit / dz, a = smooth(0.22, 0.55, dz) * (1 - smooth(7.5, 9.5, dz)) * (1 - dock);
      if (a <= 0.01) continue;
      var baseX = cx + tr.x * sc * 1.15, baseY = horizon + 0.95 * sc, hgt = tr.h * sc, sp = tr.sp;
      if (baseX < -hgt * 0.6 || baseX > VW + hgt * 0.6) continue;
      var sway = (wind * 0.016 + Math.sin(t * 1.3 + tr.phase) * 0.004) / tr.stiff;
      c.globalAlpha = a * (open > 0 ? lerp(1, 0.85, open) : 1);
      c.save();
      c.translate(baseX, baseY); c.rotate(sway);
      var tw = hgt * sp.TW / sp.TH;
      c.drawImage(sp.trunk, -tw / 2, -hgt, tw, hgt);
      if (sp.hasCrown) {
        c.translate(sp.lean / sp.TW * tw, -hgt * 0.86);
        c.rotate(sway * 1.8 + Math.sin(t * 0.8 + tr.phase) * 0.012);
        var cw = hgt * 0.62, ch = cw * sp.CH / sp.CW;
        c.drawImage(sp.crown, -cw / 2, -ch * 0.82, cw, ch);
      }
      c.restore();
    }
    // drifting flakes
    var ma = (1 - dock) * (reduce ? 0 : 1);
    if (ma > 0) {
      for (i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y += dt * (0.05 + m.s * 0.03); m.x += dt * (wind * 0.18 + Math.sin(t + m.ph) * 0.04); m.rot += dt * (1 + wind);
        var mz = m.z - camZ;
        if (mz < 0.3) { m.z += 9; mz = m.z - camZ; m.y = -0.3; }
        if (m.y > 1.6) { m.y = -0.4; m.x = (Math.random() - 0.5) * 6; }
        var ms = unit / mz, mx = cx + m.x * ms, my = horizon + (m.y - 0.9) * ms;
        if (mx < -20 || mx > VW + 20 || my < -20 || my > VH + 20) continue;
        var size = Math.max(1.2, m.s * ms * 0.018), flick = m.c === "#d9b44a" || m.c === "#e8c96a" ? 0.6 + 0.4 * Math.sin(t * 3 + m.ph) : 0.9;
        c.globalAlpha = ma * flick * smooth(0.3, 1.2, mz) * (1 - smooth(7, 9.5, mz));
        dab(c, mx, my, size, size * 0.55 * Math.abs(Math.cos(m.rot)) + size * 0.15, m.rot, m.c);
      }
    }
    // leaving the wood: the light floods in, then lifts on the valley
    var veil = smooth(0.46, 0.6, p) * (1 - smooth(0.62, 0.78, p));
    if (veil > 0) {
      var vg = c.createRadialGradient(VW / 2, VH * 0.46, 0, VW / 2, VH * 0.46, Math.max(VW, VH) * 0.75);
      vg.addColorStop(0, "rgba(255,252,236,1)"); vg.addColorStop(0.6, "rgba(246,241,214,.92)"); vg.addColorStop(1, "rgba(232,226,190,.8)");
      c.globalAlpha = veil; c.fillStyle = vg; c.fillRect(0, 0, VW, VH);
    }
    c.globalAlpha = 1;

    // words: the names in the light at the start, the label at the end
    if (intro) { var io = 1 - smooth(0.02, 0.16, p); intro.style.opacity = io.toFixed(3); intro.style.visibility = io < 0.01 ? "hidden" : "visible"; }
    if (cue) cue.style.opacity = (1 - smooth(0.0, 0.08, p)).toFixed(3);
    if (label) { var lo = smooth(0.86, 1, p); label.style.opacity = lo.toFixed(3); label.style.pointerEvents = lo > 0.5 ? "auto" : "none"; }
    stage.classList.toggle("is-paper", dock > 0.5);
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  var lastWater = 0;
  function drawWater(c, R, t) {
    if (t - lastWater > 0.08 || !lastWater) {
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
  build();
  if (reduce) {
    // no walk: show the print at once
    section.classList.add("is-still");
    while (pump(1000)) { /* paint everything now */ }
    layout();
    p = pt = 1;
  }
  raf = requestAnimationFrame(frame);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }).observe(stage);
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
})();
