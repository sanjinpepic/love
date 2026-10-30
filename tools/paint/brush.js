// Brush: seeded primitives for ink-and-watercolour painting in SVG.
// Every mark is a string of SVG; scenes compose them and render.js rasterises them.
"use strict";

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rnd = mulberry32(1);
const seed = (s) => { rnd = mulberry32(s); };
const rr = (a, b) => a + (b - a) * rnd();
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const f = (n) => Math.round(n * 10) / 10;

// Catmull-Rom through points → cubic Bézier path.
function smooth(pts, closed) {
  const n = pts.length;
  if (n < 2) return "";
  const P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}

// Irregular rounded blob.
function blob(cx, cy, rx, ry, n = 11, irr = 0.22) {
  const pts = [];
  const off = rr(0, Math.PI * 2);
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2;
    const k = 1 + rr(-irr, irr);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smooth(pts, true);
}

// Wobbly polyline: straight intention, hand-drawn result.
function wob(points, amp = 1.2, step = 26) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0), segs = Math.max(1, Math.round(len / step));
    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      const nx = -(y1 - y0) / len, ny = (x1 - x0) / len, j = s === 0 ? 0 : rr(-amp, amp);
      out.push([x0 + (x1 - x0) * t + nx * j, y0 + (y1 - y0) * t + ny * j]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
const line = (points, amp, step) => smooth(wob(points, amp, step), false);
const polyL = (points, amp = 0.8) => "M" + points.map(([x, y]) => `${f(x + rr(-amp, amp))} ${f(y + rr(-amp, amp))}`).join("L") + "Z";
const poly = (points, amp, step) => smooth(wob([...points, points[0]], amp, step).slice(0, -1), true);

// Larsson's foliage scribble: a run of cursive loops along a path.
function loops(x0, y0, x1, y1, r = 7, density = 1) {
  const L = Math.hypot(x1 - x0, y1 - y0), count = Math.max(2, Math.round((L / (r * 2.2)) * density));
  const ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux;
  const pts = [];
  const steps = count * 7;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, th = t * count * Math.PI * 2;
    const rad = r * (0.75 + 0.5 * Math.sin(t * 9 + x0));
    const along = t * L - Math.sin(th) * rad * 0.9;
    const perp = -(1 - Math.cos(th)) * rad * 0.8;
    pts.push([x0 + ux * along + nx * perp, y0 + uy * along + ny * perp]);
  }
  return smooth(pts, false);
}

// Paint calls -------------------------------------------------------------
// wash: watercolour fill; the filter gives soft wobbly edges with pooled pigment.
function wash(d, color, opacity = 1, filter = "wc", extra = "") {
  return `<path d="${d}" fill="${color}" fill-opacity="${opacity}" filter="url(#${filter})" ${extra}/>`;
}
// offset wash: the colour misses the line a little, as it does in Larsson's work.
function washOff(d, color, opacity = 1, filter = "wc", amt = 4) {
  return `<g transform="translate(${f(rr(-amt, amt))} ${f(rr(-amt * 0.6, amt * 0.6))})">${wash(d, color, opacity, filter)}</g>`;
}
function ink(d, w = 1.6, color = "#2e2420", opacity = 0.9) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" filter="url(#ink)"/>`;
}
function inkFill(d, color = "#2e2420", opacity = 0.9) {
  return `<path d="${d}" fill="${color}" fill-opacity="${opacity}" filter="url(#ink)"/>`;
}

// Shared filter definitions ------------------------------------------------
function defs(id = 0) {
  return `
  <filter id="wc" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="${3 + id}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.9" result="b"/>
    <feGaussianBlur in="b" stdDeviation="5" result="bb"/>
    <feComposite in="b" in2="bb" operator="arithmetic" k1="0" k2="1.5" k3="-0.5" k4="0" result="edge"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="${11 + id}" result="m"/>
    <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.62" result="ma"/>
    <feComposite in="edge" in2="ma" operator="in" result="wet"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${5 + id}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.18" result="ga"/>
    <feComposite in="wet" in2="ga" operator="in"/>
  </filter>
  <filter id="wcsoft" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="${7 + id}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="6" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="2" seed="${13 + id}" result="m"/>
    <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.45" result="ma"/>
    <feComposite in="b" in2="ma" operator="in"/>
  </filter>
  <filter id="wcfine" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${4 + id}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${5 + id}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.5 1.12" result="ga"/>
    <feComposite in="d" in2="ga" operator="in"/>
  </filter>
  <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="${2 + id}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="gold" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="21" result="t"/>
    <feSpecularLighting in="t" surfaceScale="2.5" specularConstant="0.9" specularExponent="18" lighting-color="#fff6d6" result="l"><feDistantLight azimuth="225" elevation="52"/></feSpecularLighting>
    <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="0" k2="0.55" k3="1" k4="0" result="lit"/>
    <feComposite in="lit" in2="SourceAlpha" operator="in"/>
  </filter>
  <!-- cut paper: a white margin around the layer's shapes and a soft shadow on the layer behind -->
  <filter id="cut" x="-5%" y="-5%" width="110%" height="115%" color-interpolation-filters="sRGB">
    <feComponentTransfer in="SourceAlpha" result="solid"><feFuncA type="linear" slope="4" intercept="0"/></feComponentTransfer>
    <feGaussianBlur in="solid" stdDeviation="10" result="cl1"/>
    <feComponentTransfer in="cl1" result="closed"><feFuncA type="linear" slope="6" intercept="-1.2"/></feComponentTransfer>
    <feGaussianBlur in="closed" stdDeviation="1.5" result="cl2"/>
    <feComponentTransfer in="cl2" result="dil"><feFuncA type="linear" slope="3" intercept="0"/></feComponentTransfer>
    <feGaussianBlur in="dil" stdDeviation="0.8" result="dils"/>
    <feComponentTransfer in="dils" result="edgeA"><feFuncA type="linear" slope="2.2" intercept="-0.6"/></feComponentTransfer>
    <feComposite in="edgeA" in2="closed" operator="out" result="outside"/>
    <feFlood flood-color="#fbf7ee" flood-opacity=".95" result="paper"/>
    <feComposite in="paper" in2="outside" operator="in" result="rim"/>
    <feGaussianBlur in="edgeA" stdDeviation="10" result="sh"/>
    <feOffset in="sh" dx="0" dy="8" result="sho"/>
    <feFlood flood-color="#3a1e10" flood-opacity="0.26" result="shc"/>
    <feComposite in="shc" in2="sho" operator="in" result="shadow0"/>
    <feComposite in="shadow0" in2="closed" operator="out" result="shadow"/>
    <feMerge><feMergeNode in="shadow"/><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;
}

module.exports = { seed, rr, ri, pick, f, smooth, blob, wob, line, poly, polyL, loops, wash, washOff, ink, inkFill, defs, get rnd() { return rnd; } };
