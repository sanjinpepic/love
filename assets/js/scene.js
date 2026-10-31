/* The painted stage: paper layers that fold up like a pop-up book, then drift
   with depth as you move and scroll. Built from window.SCENE (tools/paint). */
(function () {
  "use strict";
  var stage = document.querySelector("[data-stage]");
  if (!stage || !window.SCENE) return;
  var scene = stage.querySelector(".scene");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tallMQ = window.matchMedia("(max-aspect-ratio: 4/5)");
  var DEPTH = { sky: 0, sun: 0.04, hills: 0.12, river: 0.24, garden: 0.5, bed: 0.85, sprites: 1 };
  var BASE = "assets/paint/";
  var box = null, parts = [];

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    return e;
  }

  function build() {
    var name = tallMQ.matches ? "tall" : "wide", L = window.SCENE[name];
    if (box && box.dataset.layout === name) return;
    if (box) box.remove();
    parts = [];
    box = el("div", "scene-box", { "data-layout": name });
    box.style.backgroundImage = "url(" + BASE + L.poster + ")";
    if (!reduce) box.classList.add("is-folded");
    var pending = 0, order = 0;
    function track(img, lead) {
      img.decoding = "async";
      if (!lead) return;
      pending++;
      img.addEventListener("load", done); img.addEventListener("error", done);
    }
    function done() { if (--pending === 0) unfold(); }

    L.layers.forEach(function (ly) {
      var img = el("img", "layer" + (ly.id === "sky" ? "" : " pop"), { src: BASE + ly.file, alt: "", draggable: "false" });
      if (ly.id !== "sky") img.style.setProperty("--pop-delay", (0.18 * order++) + "s");
      track(img, ly.id === "sky" || ly.id === "hills");
      box.appendChild(img);
      parts.push({ node: img, depth: DEPTH[ly.id] });
    });
    var sprites = el("div", "sprites pop");
    sprites.style.setProperty("--pop-delay", (0.18 * order) + "s");
    L.sprites.forEach(function (sp, i) {
      var img = el("img", "", { src: BASE + sp.file, alt: "", draggable: "false" });
      img.style.left = ((sp.x - sp.w / 2) / L.W * 100) + "%";
      img.style.top = ((sp.y - sp.h) / L.H * 100) + "%";
      img.style.width = (sp.w / L.W * 100) + "%";
      img.style.setProperty("--sway", (5.5 + (i % 3) * 1.3) + "s");
      img.style.setProperty("--delay", (-i * 1.7) + "s");
      img.style.setProperty("--amp", (1.2 + (i % 2) * 0.8) + "deg");
      track(img);
      sprites.appendChild(img);
    });
    box.appendChild(sprites);
    parts.push({ node: sprites, depth: DEPTH.sprites });
    scene.appendChild(box);
    // never wait forever on a slow connection
    setTimeout(unfold, 1500);
  }

  var unfolded = false;
  function unfold() {
    if (unfolded) { if (box) { box.classList.add("is-standing"); box.classList.remove("is-folded"); } return; }
    unfolded = true;
    requestAnimationFrame(function () {
      box.classList.remove("is-folded");
      stage.dispatchEvent(new CustomEvent("unfolded"));
      setTimeout(function () { box && box.classList.add("is-standing"); }, 3200);
    });
  }

  // depth motion ---------------------------------------------------------
  var target = { x: 0, y: 0 }, cur = { x: 0, y: 0, s: 0 }, pointer = false, visible = true, raf = 0;
  function onPointer(e) {
    if (e.pointerType === "touch") return;
    pointer = true;
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  }
  function tick(t) {
    raf = 0;
    if (!visible) return;
    var tx = target.x, ty = target.y;
    if (!pointer) { tx = Math.sin(t / 7000) * 0.45; ty = Math.cos(t / 9500) * 0.3; }
    var sc = Math.min(1.2, window.scrollY / window.innerHeight);
    cur.x += (tx - cur.x) * 0.045;
    cur.y += (ty - cur.y) * 0.045;
    cur.s += (sc - cur.s) * 0.12;
    var vw = window.innerWidth;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], d = p.depth;
      if (!d) continue;
      var x = -cur.x * d * vw * 0.014, y = -cur.y * d * 10 - cur.s * d * window.innerHeight * 0.22;
      p.node.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0)";
    }
    raf = requestAnimationFrame(tick);
  }
  function start() { if (!raf && !reduce) raf = requestAnimationFrame(tick); }

  build();
  if (tallMQ.addEventListener) tallMQ.addEventListener("change", function () { unfolded = true; build(); box.classList.remove("is-folded"); box.classList.add("is-standing"); });
  if (reduce) { unfold(); return; }
  // let the pop-up finish before the drift takes over the transforms
  stage.addEventListener("unfolded", function () { setTimeout(start, 2400); });
  window.addEventListener("pointermove", onPointer, { passive: true });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(stage);
  }
})();
