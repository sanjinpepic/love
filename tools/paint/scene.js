// Järvsö, 27 August: a wedding painted in the manner of Carl Larsson,
// with a little of Klimt's gold. Each export returns one paper layer as SVG.
"use strict";
const B = require("./brush");
const { rr, ri, pick, f, smooth, blob, line, poly, polyL, loops, wash, washOff, ink, inkFill } = B;

const C = {
  paper: "#f7f2e6", ink: "#2e2420",
  sky: "#9fc0d6", skyDeep: "#7ea7c6", cloudShade: "#b8c3cc",
  haze: "#a9bcbf", haze2: "#8fa7ab", klack: "#5d7d66", klackDark: "#3f5e4b", rock: "#9a9688",
  field: "#d9cf86", field2: "#c8c46c", field3: "#b5bd6a", hay: "#c9a456", hayDark: "#9c7b3a",
  river: "#a7c6d4", riverDeep: "#86aec2",
  white: "#f6f3ec", whiteShade: "#d3d6d6", roof: "#45464b", roofLight: "#6a6c70",
  falu: "#b23b2c", faluShade: "#8b2d22", glass: "#55627a",
  leaf: "#6f8f45", leafLight: "#a3b862", leafDark: "#3f5a33", leafMid: "#86a24f", spruce: "#3c5446",
  birch: "#f3f0e6", birchMark: "#2a2826",
  lawn: "#93ad5a", lawnLight: "#b9c774",
  daisy: "#fbf8f0", daisyShade: "#cfd6dd", yolk: "#e2b22c",
  harebell: "#6f7fc4", cornflower: "#4467c9", willow: "#c4508b", butter: "#e8c23a", clover: "#d27c9b",
  cloth: "#fbf8f1", clothShade: "#d8dde0",
  flagR: "#b23b2c", flagB: "#4d6f9e", flagY: "#d9a93f", flagG: "#6f9a80", flagP: "#e7a0a6",
  gold: "#c9a043", goldDeep: "#9a7426", goldLight: "#ecd28a",
};

// ——— elements ——————————————————————————————————————————————————————————————

function cloud(cx, cy, w, h) {
  let s = "";
  const n = ri(4, 7);
  for (let i = 0; i < n; i++) {
    const x = cx + rr(-w / 2, w / 2) * 0.8, y = cy + rr(-h / 3, h / 4);
    s += wash(blob(x, y + h * 0.18, rr(w * 0.18, w * 0.32), rr(h * 0.2, h * 0.3), 9, 0.3), C.cloudShade, 0.45, "wcsoft");
  }
  for (let i = 0; i < n + 2; i++) {
    const x = cx + rr(-w / 2, w / 2) * 0.85, y = cy + rr(-h / 2, h / 6);
    s += wash(blob(x, y, rr(w * 0.15, w * 0.3), rr(h * 0.22, h * 0.38), 9, 0.3), C.paper, 0.92, "wcsoft");
  }
  return s;
}

function goldSun(cx, cy, r) {
  // Klimt: a disc of beaten gold, engraved with spirals and ringed with dots.
  let s = `<g>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r * 1.55}" fill="${C.goldLight}" opacity=".22" filter="url(#wcsoft)"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.gold}" filter="url(#gold)"/>`;
  const spiral = (x, y, rad, turns) => {
    const pts = [];
    for (let i = 0; i <= turns * 24; i++) { const t = i / 24, a = t * Math.PI * 2, rd = rad * (t / turns); pts.push([x + Math.cos(a) * rd, y + Math.sin(a) * rd]); }
    return smooth(pts, false);
  };
  s += `<path d="${spiral(cx, cy, r * 0.62, 3.2)}" fill="none" stroke="${C.goldDeep}" stroke-width="2.2" opacity=".75"/>`;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    s += `<path d="${spiral(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78, r * 0.14, 2)}" fill="none" stroke="${C.goldDeep}" stroke-width="1.6" opacity=".7"/>`;
  }
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    s += `<circle cx="${f(cx + Math.cos(a) * r * 1.18)}" cy="${f(cy + Math.sin(a) * r * 1.18)}" r="${f(r * 0.045)}" fill="${C.gold}" filter="url(#gold)"/>`;
  }
  s += ink(`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`, 1.4, C.goldDeep, 0.8);
  return s + `</g>`;
}

function ridge(x0, x1, yTop, yBase, color, bumps = 6, amp = 40) {
  const pts = [[x0, yBase]];
  for (let i = 0; i <= bumps * 3; i++) {
    const t = i / (bumps * 3);
    pts.push([x0 + (x1 - x0) * t, yTop + Math.sin(t * Math.PI * bumps + rr(0, 1)) * amp * 0.5 + rr(-amp, amp) * 0.35]);
  }
  pts.push([x1, yBase]);
  return wash(smooth(pts, true), color, 0.9) + `<g transform="translate(${f(rr(-5, 5))} ${f(rr(-3, 3))})">` + ink(smooth(pts.slice(1, -1), false), 1, C.ink, 0.3) + `</g>`;
}

function conifers(x0, x1, yFn, size, count, color) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const x = rr(x0, x1), y = yFn(x) + rr(0, size * 2.5), h = size * rr(0.8, 1.4);
    s += `<path d="M${f(x)} ${f(y - h)}l${f(-h * 0.22)} ${f(h)}h${f(h * 0.44)}z" fill="${color}" opacity="${f(rr(0.35, 0.7))}"/>`;
  }
  return s;
}

function klack(L) {
  // Järvsöklack: a steep, forested hill with a bare crown and a lookout.
  const { x, y, w, h } = L;
  const pts = [[x - w * 0.55, y + h], [x - w * 0.42, y + h * 0.72], [x - w * 0.3, y + h * 0.42], [x - w * 0.18, y + h * 0.12],
    [x - w * 0.06, y + h * 0.01], [x + w * 0.06, y], [x + w * 0.16, y + h * 0.06], [x + w * 0.3, y + h * 0.3], [x + w * 0.46, y + h * 0.62], [x + w * 0.6, y + h]];
  const d = smooth(pts, true);
  let s = wash(d, C.klack, 0.95);
  s += washOff(blob(x - w * 0.12, y + h * 0.45, w * 0.22, h * 0.3), C.klackDark, 0.5, "wc", 10);
  s += washOff(blob(x + w * 0.18, y + h * 0.6, w * 0.25, h * 0.3), C.klackDark, 0.35, "wc", 10);
  s += washOff(blob(x + w * 0.02, y + h * 0.12, w * 0.12, h * 0.08), C.rock, 0.65, "wc", 4);
  // tree texture
  const top = (xx) => { const t = (xx - (x - w * 0.55)) / (w * 1.15); return y + h * Math.pow(Math.abs(t - 0.5) * 2, 1.6) * 0.95; };
  s += conifers(x - w * 0.45, x + w * 0.5, top, h * 0.05, 70, C.klackDark);
  s += ink(smooth(pts.slice(1, -1), false), 1.5, C.ink, 0.55);
  // lookout tower
  s += ink(line([[x + w * 0.03, y + 2], [x + w * 0.03, y - h * 0.08]]), 1.6, C.ink, 0.8);
  s += `<path d="M${f(x + w * 0.015)} ${f(y - h * 0.08)}h${f(w * 0.03)}l${f(-w * 0.015)} ${f(-h * 0.03)}z" fill="${C.falu}" opacity=".85"/>`;
  return s;
}

function window6(x, y, w, h, frame = C.white) {
  let s = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${C.glass}" opacity=".85" filter="url(#wc)"/>`;
  s += `<rect x="${f(x - w * 0.08)}" y="${f(y - h * 0.06)}" width="${f(w * 1.16)}" height="${f(h * 1.12)}" fill="none" stroke="${frame}" stroke-width="${f(w * 0.12)}"/>`;
  s += `<path d="M${f(x + w / 2)} ${f(y)}v${f(h)}M${f(x)} ${f(y + h / 3)}h${f(w)}M${f(x)} ${f(y + h * 2 / 3)}h${f(w)}" stroke="${frame}" stroke-width="${f(w * 0.07)}"/>`;
  s += ink(poly([[x - w * 0.14, y - h * 0.1], [x + w * 1.14, y - h * 0.1], [x + w * 1.14, y + h * 1.1], [x - w * 0.14, y + h * 1.1]], 0.8, 30), 1.1, C.ink, 0.7);
  return s;
}

function church(L) {
  // A white church with a dark roof and a tall tower: the church on Kyrkön in Järvsö.
  const { x, y, s: k } = L; // x,y = base centre of nave
  const nw = 230 * k, nh = 95 * k, tw = 52 * k, th = 150 * k;
  let s = "";
  const nave = [[x - nw / 2, y], [x - nw / 2, y - nh], [x + nw / 2, y - nh], [x + nw / 2, y]];
  s += washOff(poly(nave, 1), C.white, 1, "wc", 3);
  s += washOff(poly([[x + nw * 0.15, y], [x + nw * 0.15, y - nh], [x + nw / 2, y - nh], [x + nw / 2, y]], 1), C.whiteShade, 0.6, "wc", 3);
  const roof = [[x - nw / 2 - 8 * k, y - nh], [x - nw / 2 + 30 * k, y - nh - 62 * k], [x + nw / 2 - 30 * k, y - nh - 62 * k], [x + nw / 2 + 8 * k, y - nh]];
  s += washOff(poly(roof, 1), C.roof, 0.95, "wc", 2);
  // tower at west end
  const tx = x - nw / 2 - tw * 0.2;
  s += washOff(poly([[tx - tw / 2, y], [tx - tw / 2, y - nh - th], [tx + tw / 2, y - nh - th], [tx + tw / 2, y]], 0.8), C.white, 1, "wc", 2);
  s += washOff(poly([[tx + tw * 0.1, y], [tx + tw * 0.1, y - nh - th], [tx + tw / 2, y - nh - th], [tx + tw / 2, y]], 0.8), C.whiteShade, 0.55, "wc", 2);
  const ty = y - nh - th;
  s += washOff(poly([[tx - tw * 0.62, ty], [tx, ty - 36 * k], [tx + tw * 0.62, ty]], 0.6), C.roof, 1, "wc", 1.5);
  s += washOff(blob(tx, ty - 50 * k, tw * 0.3, 16 * k, 8, 0.1), C.roof, 1, "wc", 1);
  s += washOff(poly([[tx - tw * 0.12, ty - 60 * k], [tx, ty - 150 * k], [tx + tw * 0.12, ty - 60 * k]], 0.4), C.roof, 1, "wc", 1);
  s += ink(line([[tx, ty - 150 * k], [tx, ty - 175 * k]], 0.3), 1.4);
  s += ink(line([[tx - 7 * k, ty - 166 * k], [tx + 7 * k, ty - 166 * k]], 0.3), 1.2);
  // windows
  for (let i = 0; i < 4; i++) {
    const wx = x - nw * 0.32 + i * nw * 0.22;
    s += `<path d="M${f(wx)} ${f(y - nh * 0.25)}v${f(-nh * 0.4)}a${f(9 * k)} ${f(9 * k)} 0 0 1 ${f(18 * k)} 0v${f(nh * 0.4)}z" fill="${C.glass}" opacity=".8"/>`;
  }
  s += `<path d="M${f(tx - 7 * k)} ${f(ty + 50 * k)}v-${f(24 * k)}a${f(7 * k)} ${f(7 * k)} 0 0 1 ${f(14 * k)} 0v${f(24 * k)}z" fill="${C.glass}" opacity=".85"/>`;
  s += `<circle cx="${f(tx)}" cy="${f(ty + 18 * k)}" r="${f(9 * k)}" fill="${C.white}" stroke="${C.ink}" stroke-width="1"/>`;
  s += ink(poly(nave, 0.8, 34), 1.4, C.ink, 0.75) + ink(poly(roof, 0.8, 34), 1.4, C.ink, 0.75);
  s += ink(poly([[tx - tw / 2, y], [tx - tw / 2, y - nh - th], [tx + tw / 2, y - nh - th], [tx + tw / 2, y]], 0.6, 30), 1.4, C.ink, 0.75);
  return s;
}

function redHouse(L) {
  // A Hälsinge farmhouse: falu red, white corner boards and window trim, dark roof.
  const { x, y, w, h, porch = false, detail = 1 } = L;
  const k = w / 600;
  let s = "";
  const body = [[x, y], [x, y - h], [x + w, y - h], [x + w, y]];
  s += washOff(poly(body, 1.5), C.falu, 1, "wc", 4);
  s += washOff(poly([[x + w * 0.62, y], [x + w * 0.62, y - h], [x + w, y - h], [x + w, y]], 1.5), C.faluShade, 0.45, "wc", 4);
  const rh = h * 0.48;
  const roof = [[x - 22 * k, y - h + 4], [x + w * 0.08, y - h - rh], [x + w * 0.92, y - h - rh], [x + w + 22 * k, y - h + 4]];
  s += washOff(poly(roof, 1.4), C.roof, 0.95, "wc", 3);
  s += washOff(poly([[x + w * 0.08, y - h - rh], [x + w * 0.92, y - h - rh], [x + w * 0.9, y - h - rh * 0.6], [x + w * 0.1, y - h - rh * 0.6]], 1), C.roofLight, 0.35, "wc", 2);
  // chimney
  s += washOff(poly([[x + w * 0.66, y - h - rh * 0.7], [x + w * 0.66, y - h - rh - 40 * k], [x + w * 0.72, y - h - rh - 40 * k], [x + w * 0.72, y - h - rh * 0.8]], 0.6), C.white, 1, "wc", 1);
  // corner boards & band
  s += `<path d="M${f(x)} ${f(y)}V${f(y - h)}M${f(x + w)} ${f(y)}V${f(y - h)}" stroke="${C.white}" stroke-width="${f(16 * k)}"/>`;
  s += `<path d="M${f(x)} ${f(y - h * 0.5)}H${f(x + w)}" stroke="${C.white}" stroke-width="${f(7 * k)}" opacity=".9"/>`;
  // windows: two storeys
  const cols = 5;
  for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++) {
    if (porch && r === 0 && c === 2) continue;
    const wx = x + w * (0.1 + c * 0.18), wy = y - h + h * (r === 0 ? 0.1 : 0.58);
    s += window6(wx, wy, w * 0.075, h * 0.26);
  }
  if (porch) {
    // farstukvist: the carved porch
    const px = x + w * 0.44, pw = w * 0.14, ph = h * 0.5;
    s += washOff(poly([[px, y], [px, y - ph], [px + pw, y - ph], [px + pw, y]], 0.8), C.white, 1, "wc", 2);
    s += washOff(poly([[px - pw * 0.15, y - ph], [px + pw / 2, y - ph - pw * 0.55], [px + pw * 1.15, y - ph]], 0.6), C.roof, 1, "wc", 2);
    s += `<rect x="${f(px + pw * 0.25)}" y="${f(y - ph * 0.72)}" width="${f(pw * 0.5)}" height="${f(ph * 0.72)}" fill="${C.faluShade}" opacity=".9"/>`;
    s += ink(line([[px + pw * 0.08, y - ph * 0.86], [px + pw * 0.92, y - ph * 0.86]]), 1.2);
    for (let i = 0; i < 5; i++) s += ink(`M${f(px + pw * (0.12 + i * 0.19))} ${f(y - ph * 0.86)}q${f(pw * 0.05)} ${f(ph * 0.06)} 0 ${f(ph * 0.12)}`, 1);
    s += ink(poly([[px, y], [px, y - ph], [px + pw, y - ph], [px + pw, y]], 0.6), 1.3, C.ink, 0.8);
    // steps
    s += washOff(poly([[px - pw * 0.1, y], [px - pw * 0.1, y + 10 * k], [px + pw * 1.1, y + 10 * k], [px + pw * 1.1, y]], 0.5), C.whiteShade, 0.9, "wc", 1);
  }
  s += ink(poly(body, 1, 40), 1.6, C.ink, 0.8) + ink(poly(roof, 1, 40), 1.6, C.ink, 0.8);
  if (detail) for (let i = 0; i < 12; i++) { const yy = y - h * rr(0.05, 0.95), xx = x + w * rr(0.02, 0.95); s += ink(line([[xx, yy], [xx, yy + h * rr(0.05, 0.15)]], 0.2), 0.8, C.faluShade, 0.5); }
  return s;
}

function smallHouse(x, y, w, color = C.falu) {
  const h = w * 0.5;
  let s = washOff(poly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]], 0.8), color, 0.95, "wc", 2);
  s += washOff(poly([[x - w * 0.06, y - h], [x + w * 0.5, y - h - w * 0.32], [x + w * 1.06, y - h]], 0.6), C.roof, 0.9, "wc", 1.5);
  s += `<path d="M${f(x + 1)} ${f(y)}V${f(y - h)}M${f(x + w - 1)} ${f(y)}V${f(y - h)}" stroke="${C.white}" stroke-width="${f(w * 0.05)}"/>`;
  s += `<rect x="${f(x + w * 0.25)}" y="${f(y - h * 0.65)}" width="${f(w * 0.14)}" height="${f(h * 0.3)}" fill="${C.white}"/><rect x="${f(x + w * 0.6)}" y="${f(y - h * 0.65)}" width="${f(w * 0.14)}" height="${f(h * 0.3)}" fill="${C.white}"/>`;
  s += ink(poly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]], 0.5, 20), 1, C.ink, 0.65);
  return s;
}

function hayRack(x, y, w, h) {
  // hässja: a long fence of drying hay on poles
  let s = washOff(blob(x + w / 2, y - h / 2, w / 2, h / 2, 12, 0.08), C.hay, 0.95, "wc", 2);
  s += washOff(blob(x + w / 2, y - h * 0.3, w * 0.48, h * 0.25, 10, 0.1), C.hayDark, 0.4, "wc", 2);
  for (let i = 0; i <= 5; i++) s += ink(line([[x + w * i / 5, y + h * 0.15], [x + w * i / 5 + rr(-2, 2), y - h * 1.05]], 0.3), 1.1, C.ink, 0.7);
  for (let i = 0; i < Math.round(w / 9); i++) { const xx = x + rr(0, w); s += ink(line([[xx, y - h * rr(0.1, 0.4)], [xx + rr(-3, 3), y - h * rr(0.6, 0.95)]], 0.2), 0.6, C.hayDark, 0.5); }
  return s;
}

function birch(x, yBase, h, lean = 0, spread = 1) {
  // white trunk with black marks, weeping crown, Larsson's loop-scribbled leaves
  let s = "";
  const top = [x + lean, yBase - h];
  const trunk = [[x, yBase], [x + lean * 0.4, yBase - h * 0.45], [x + lean * 0.8, yBase - h * 0.8], top];
  const tw = h * 0.026;
  const left = trunk.map(([px, py], i) => [px - tw * (1 - i / 4) - 1.2, py]);
  const right = trunk.map(([px, py], i) => [px + tw * (1 - i / 4) + 1.2, py]).reverse();
  const crown = [];
  // foliage first (behind trunk parts), as a cloud of soft washes
  const cx = x + lean * 0.8, cy = yBase - h * 0.72, cw = h * 0.26 * spread, ch = h * 0.4;
  const inCrown = () => { for (;;) { const u = rr(-1, 1), v = rr(-1, 1); if (u * u + v * v < 1) return [cx + u * cw, cy + v * ch]; } };
  for (let i = 0; i < 9; i++) { const [bx, by] = inCrown(); crown.push(wash(blob(bx, by, rr(50, 90) * h / 900, rr(40, 80) * h / 900, 10, 0.3), pick([C.leafLight, "#b9c97c", C.leafMid]), rr(0.75, 0.95), "wc")); }
  for (let i = 0; i < 38; i++) {
    const [bx, by] = inCrown(), low = (by - cy) / ch;
    crown.push(washOff(blob(bx, by, rr(10, 22) * h / 900, rr(8, 16) * h / 900, 7, 0.35), low > 0.3 && rnd() < 0.3 ? C.leaf : pick([C.leafMid, "#a8bf6c", C.leafMid]), rr(0.5, 0.8), "wcfine", 3));
  }
  s += crown.join("");
  s += washOff(smooth([...left, ...right], true), C.birch, 1, "wc", 1);
  s += ink(smooth(left, false), 1.3, C.ink, 0.8) + ink(smooth(right.slice().reverse(), false), 1.3, C.ink, 0.8);
  let tt = 0.04;
  while (tt < 0.88) {
    tt += rnd() < 0.35 ? rr(0.008, 0.02) : rr(0.03, 0.09);
    const t = tt, px = x + lean * t, py = yBase - h * t, ww = tw * (1 - t * 0.7) * 2 * rr(0.5, 1.1);
    s += `<path d="M${f(px - ww / 2)} ${f(py)}q${f(ww / 2)} ${f(rr(-3, 3))} ${f(ww * rr(0.4, 1))} ${f(rr(-1, 2))}" stroke="${C.birchMark}" stroke-width="${f(rr(1.5, 4))}" fill="none" opacity=".85" filter="url(#ink)"/>`;
  }
  // weeping twigs
  for (let i = 0; i < 12; i++) {
    const sx = cx + rr(-cw * 0.7, cw * 0.7), sy = cy + rr(-ch * 0.85, ch * 0.1), len = rr(60, 140) * h / 900;
    const dir = sx < cx ? -1 : 1;
    s += ink(smooth([[sx, sy], [sx + dir * len * 0.3, sy - len * 0.1], [sx + dir * len * 0.55, sy + len * 0.3], [sx + dir * len * 0.62, sy + len * 0.85]], false), 0.8, C.ink, 0.55);
  }
  // loop scribbles over the crown
  for (let i = 0; i < 6; i++) {
    const [lx, ly] = inCrown();
    s += ink(loops(lx, ly, lx + rr(40, 90) * h / 900, ly + rr(-10, 25), rr(3.5, 5.5) * h / 900), 0.8, C.ink, 0.5);
  }
  return s;
}

function leafTree(cx, cy, w, h, dark = false) {
  // a rounded deciduous tree, scribbled leaves
  let s = "";
  s += ink(line([[cx, cy + h * 0.5], [cx + rr(-8, 8), cy - h * 0.05]], 1), 3, C.ink, 0.7);
  s += wash(blob(cx, cy - h * 0.05, w * 0.45, h * 0.42, 11, 0.2), dark ? C.leafDark : C.leaf, 0.55, "wc");
  for (let i = 0; i < 60; i++) { const a = rr(0, 6.283), r = Math.sqrt(rnd()); s += washOff(blob(cx + Math.cos(a) * r * w * 0.45, cy - h * 0.05 + Math.sin(a) * r * h * 0.42, rr(w * 0.05, w * 0.1), rr(h * 0.04, h * 0.08), 7, 0.3), pick(dark ? [C.leafDark, C.leaf, C.spruce] : [C.leaf, C.leafMid, C.leafLight, C.leafDark]), rr(0.6, 0.9), "wc", 3); }
  for (let i = 0; i < 10; i++) { const lx = cx + rr(-w / 2, w / 4), ly = cy + rr(-h / 2, h / 3); s += ink(loops(lx, ly, lx + rr(30, 80), ly + rr(-10, 20), rr(4, 6)), 0.9, C.ink, 0.55); }
  return s;
}

function spruceRow(x0, x1, y, h, n) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + rr(0, 0.8)) / n, hh = h * rr(0.7, 1.2), w = hh * 0.32;
    const pts = [[x, y - hh]];
    for (let k = 1; k <= 6; k++) { const t = k / 6; pts.push([x + w * t * (k % 2 ? 1 : 0.7), y - hh + hh * t]); }
    pts.push([x - w, y]);
    for (let k = 5; k >= 1; k--) { const t = k / 6; pts.push([x - w * t * (k % 2 ? 1 : 0.7), y - hh + hh * t]); }
    s += wash(poly(pts, 1, 20), pick([C.spruce, C.klackDark]), 0.85);
  }
  return s;
}

function table(L) {
  // the long wedding table: white cloth, chairs, jars of wildflowers, candles
  const { x, y, w, d } = L; // front-left corner, width, depth (perspective)
  const sk = d * 0.6;
  let s = "";
  const top = [[x, y], [x + sk, y - d], [x + w + sk * 0.6, y - d], [x + w, y]];
  // chairs behind
  const chair = (cx, cy, hh, op) => {
    let c = ink(line([[cx, cy], [cx, cy - hh]], 0.3), 1.3, C.ink, op) + ink(line([[cx + hh * 0.42, cy], [cx + hh * 0.42, cy - hh]], 0.3), 1.3, C.ink, op);
    c += ink(`M${f(cx)} ${f(cy - hh)}Q${f(cx + hh * 0.21)} ${f(cy - hh * 1.08)} ${f(cx + hh * 0.42)} ${f(cy - hh)}`, 1.3, C.ink, op);
    for (let k = 1; k < 4; k++) c += ink(line([[cx + hh * 0.105 * k, cy - hh * 0.98], [cx + hh * 0.105 * k, cy - hh * 0.5]], 0.2), 0.9, C.ink, op * 0.8);
    return washOff(poly([[cx, cy - hh * 0.5], [cx, cy - hh], [cx + hh * 0.42, cy - hh], [cx + hh * 0.42, cy - hh * 0.5]], 0.3), "#86ad98", 0.55, "wcfine", 1) + c;
  };
  
  s += washOff(polyL(top), C.cloth, 1, "wcfine", 1);
  const front = [[x, y], [x + w, y], [x + w + 6, y + 72], [x - 6, y + 72]];
  s += washOff(polyL(front), C.cloth, 1, "wcfine", 1);
  for (let i = 1; i < 12; i++) { const fx = x + (w * i) / 12; s += ink(line([[fx, y + 8], [fx + rr(-2, 2), y + 70]], 0.6), 0.7, C.whiteShade, 0.9); }
  s += washOff(polyL([[x, y + 44], [x + w, y + 44], [x + w + 6, y + 72], [x - 6, y + 72]]), C.clothShade, 0.55, "wcfine", 1);
  // things on the table
  for (let i = 0; i < 8; i++) {
    const t = (i + 0.5) / 8, jx = x + sk * 0.5 + t * (w + sk * 0.1), jy = y - d * 0.45;
    s += washOff(blob(jx, jy - 8, 7, 11, 8, 0.1), "#c9dde2", 0.8, "wcfine", 1);
    for (let k = 0; k < 7; k++) s += `<circle cx="${f(jx + rr(-14, 14))}" cy="${f(jy - 26 + rr(-12, 8))}" r="${f(rr(3, 6))}" fill="${pick([C.daisy, C.harebell, C.butter, C.willow, C.cornflower])}" opacity=".9"/>`;
    s += ink(line([[jx + 20, jy - 4], [jx + 20, jy - 32]]), 2.2, "#efe7d3", 1);
    s += `<path d="M${f(jx + 20)} ${f(jy - 36)}q2 -6 0 -10q-2 4 0 10z" fill="${C.gold}" opacity=".9"/>`;
  }

  s += ink(polyL(top, 0.5), 1.3, C.ink, 0.7) + ink(polyL(front, 0.5), 1.3, C.ink, 0.7);
  return s;
}

function bunting(x0, y0, x1, y1, sag, n) {
  let s = "";
  const P = (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag];
  const pts = [];
  for (let i = 0; i <= 30; i++) pts.push(P(i / 30));
  s += ink(smooth(pts, false), 1.1, C.ink, 0.75);
  const cols = [C.flagR, C.flagY, C.flagB, C.daisy, C.flagG, C.flagP];
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.15) / n, t1 = (i + 0.85) / n, a = P(t0), b = P(t1), m = P((t0 + t1) / 2);
    const fl = [a, b, [m[0] + rr(-3, 3), m[1] + 38]];
    s += washOff(poly(fl, 0.5, 12), cols[i % cols.length], 0.95, "wc", 2) + ink(poly(fl, 0.4, 12), 0.9, C.ink, 0.55);
  }
  return s;
}

function grassBlade(x, y, h, lean, color, w = 5) {
  const tip = [x + lean, y - h];
  const d = `M${f(x - w / 2)} ${f(y)}Q${f(x + lean * 0.2)} ${f(y - h * 0.6)} ${f(tip[0])} ${f(tip[1])}Q${f(x + lean * 0.25 + w)} ${f(y - h * 0.55)} ${f(x + w / 2)} ${f(y)}Z`;
  return `<path d="${d}" fill="${color}" opacity="${f(rr(0.6, 0.95))}"/>`;
}

function grass(x0, x1, yBase, hMin, hMax, n, inkRatio = 0.25) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = rr(x0, x1), h = rr(hMin, hMax), lean = rr(-h * 0.35, h * 0.35);
    s += grassBlade(x, yBase + rr(0, 30), h, lean, pick([C.leaf, C.leafMid, C.leafLight, C.lawn, C.leafDark]), rr(3, 7));
    if (rnd() < inkRatio) s += ink(`M${f(x)} ${f(yBase + 20)}Q${f(x + lean * 0.2)} ${f(yBase - h * 0.6)} ${f(x + lean)} ${f(yBase - h)}`, 0.8, C.ink, 0.55);
  }
  return s;
}
const rnd = () => B.rnd();

// ——— flowers ———

function daisy(x, y, r, tilt = 0.75, rot = 0) {
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(1 ${f(tilt)})">`;
  const n = ri(15, 21);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360 + rr(-5, 5), len = r * rr(0.85, 1.1);
    const petal = `M0 0C${f(len * 0.25)} ${f(-r * 0.16)} ${f(len * 0.85)} ${f(-r * 0.14)} ${f(len)} 0C${f(len * 0.85)} ${f(r * 0.14)} ${f(len * 0.25)} ${f(r * 0.16)} 0 0Z`;
    s += `<g transform="rotate(${f(a)})"><path d="${petal}" fill="${C.daisy}"/><path d="${petal}" fill="none" stroke="${C.ink}" stroke-width="${f(Math.max(0.7, r * 0.018))}" stroke-opacity=".55"/></g>`;
  }
  s += `<circle r="${f(r * 0.6)}" fill="${C.daisyShade}" opacity=".35" transform="translate(${f(r * 0.1)} ${f(r * 0.15)})" filter="url(#wcsoft)"/>`;
  s += `<circle r="${f(r * 0.28)}" fill="${C.yolk}" filter="url(#wc)"/>`;
  for (let i = 0; i < 12; i++) s += `<circle cx="${f(rr(-r * 0.2, r * 0.2))}" cy="${f(rr(-r * 0.2, r * 0.2))}" r="${f(r * 0.03)}" fill="#a87a16" opacity=".8"/>`;
  s += `<circle r="${f(r * 0.28)}" fill="none" stroke="${C.ink}" stroke-width="${f(Math.max(0.7, r * 0.02))}" stroke-opacity=".6"/>`;
  return s + `</g>`;
}

function stem(x, y, x2, y2, bend, w = 2.2) {
  return ink(`M${f(x)} ${f(y)}Q${f((x + x2) / 2 + bend)} ${f((y + y2) / 2)} ${f(x2)} ${f(y2)}`, w, "#4d6a37", 0.95);
}

function leaf(x, y, len, ang, wd = 0.22, color = C.leaf) {
  const d = `M0 0C${f(len * 0.3)} ${f(-len * wd)} ${f(len * 0.75)} ${f(-len * wd * 0.8)} ${f(len)} 0C${f(len * 0.7)} ${f(len * wd * 0.6)} ${f(len * 0.3)} ${f(len * wd * 0.7)} 0 0Z`;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><path d="${d}" fill="${color}" opacity=".9" filter="url(#wc)"/><path d="${d}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-opacity=".55"/><path d="M0 0L${f(len * 0.9)} 0" stroke="${C.ink}" stroke-width=".6" stroke-opacity=".4"/></g>`;
}

function daisyPlant(x, y, h, scale = 1) {
  let s = "";
  const heads = ri(1, 3);
  for (let i = 0; i < heads; i++) {
    const tx = x + rr(-h * 0.25, h * 0.25), ty = y - h * rr(0.75, 1);
    s += stem(x + rr(-6, 6), y, tx, ty, rr(-30, 30), 2.4 * scale);
    for (let k = 0; k < 2; k++) s += leaf(x + rr(-4, 4), y - h * rr(0.1, 0.45), h * 0.22, rr(-160, -20), 0.16, C.leafMid);
    s += daisy(tx, ty, rr(26, 38) * scale, rr(0.55, 0.9), rr(-25, 25));
  }
  return s;
}

function harebell(x, y, h, scale = 1) {
  let s = "";
  const tx = x + rr(-h * 0.15, h * 0.15), ty = y - h;
  s += stem(x, y, tx, ty, rr(-20, 20), 1.6 * scale);
  const bells = ri(2, 4);
  for (let i = 0; i < bells; i++) {
    const t = 0.15 + i * 0.22, bx = tx + (x - tx) * t * 0.3 + (i % 2 ? 1 : -1) * rr(14, 30) * scale, by = ty + h * t;
    s += ink(`M${f(tx + (x - tx) * t * 0.2)} ${f(ty + h * t - 6)}Q${f(bx)} ${f(by - 24 * scale)} ${f(bx)} ${f(by - 6 * scale)}`, 1.1 * scale, "#4d6a37", 0.9);
    const bw = 15 * scale, bh = 24 * scale;
    const bell = `M${f(bx - bw * 0.35)} ${f(by - 6 * scale)}C${f(bx - bw * 0.55)} ${f(by + bh * 0.4)} ${f(bx - bw)} ${f(by + bh * 0.8)} ${f(bx - bw * 0.9)} ${f(by + bh)}L${f(bx - bw * 0.45)} ${f(by + bh * 0.88)}L${f(bx)} ${f(by + bh * 1.02)}L${f(bx + bw * 0.45)} ${f(by + bh * 0.88)}L${f(bx + bw * 0.9)} ${f(by + bh)}C${f(bx + bw)} ${f(by + bh * 0.8)} ${f(bx + bw * 0.55)} ${f(by + bh * 0.4)} ${f(bx + bw * 0.35)} ${f(by - 6 * scale)}Z`;
    s += `<path d="${bell}" fill="${C.harebell}" opacity=".9" filter="url(#wc)"/><path d="${bell}" fill="none" stroke="${C.ink}" stroke-width="${f(0.9 * scale)}" stroke-opacity=".6"/>`;
    s += `<path d="M${f(bx - bw * 0.2)} ${f(by)}Q${f(bx - bw * 0.35)} ${f(by + bh * 0.5)} ${f(bx - bw * 0.5)} ${f(by + bh * 0.85)}" stroke="#fff" stroke-opacity=".35" stroke-width="${f(2 * scale)}" fill="none"/>`;
  }
  return s;
}

function willowherb(x, y, h, scale = 1) {
  // mjölkört: the magenta spires of a Swedish August roadside
  let s = "";
  const tx = x + rr(-h * 0.08, h * 0.08), ty = y - h;
  s += stem(x, y, tx, ty, rr(-15, 15), 2.6 * scale);
  for (let i = 0; i < 6; i++) s += leaf(x + (tx - x) * (i / 10), y - h * (0.08 + i * 0.08), h * 0.14, i % 2 ? -25 : -155, 0.14, C.leaf);
  const n = 16;
  for (let i = 0; i < n; i++) {
    const t = i / n, fx = x + (tx - x) * (0.55 + t * 0.45), fy = y - h * (0.55 + t * 0.45);
    const size = (1 - t * 0.75) * 11 * scale;
    if (t > 0.72) { s += `<ellipse cx="${f(fx + rr(-3, 3))}" cy="${f(fy)}" rx="${f(size * 0.4)}" ry="${f(size * 0.8)}" fill="#9a3a68" opacity=".85"/>`; continue; }
    const side = i % 2 ? 1 : -1, cx = fx + side * size * 0.9;
    for (let p = 0; p < 4; p++) s += `<ellipse cx="${f(cx + Math.cos(p * 1.57) * size * 0.5)}" cy="${f(fy + Math.sin(p * 1.57) * size * 0.5)}" rx="${f(size * 0.55)}" ry="${f(size * 0.4)}" transform="rotate(${p * 90} ${f(cx + Math.cos(p * 1.57) * size * 0.5)} ${f(fy + Math.sin(p * 1.57) * size * 0.5)})" fill="${C.willow}" opacity=".88"/>`;
    s += `<circle cx="${f(cx)}" cy="${f(fy)}" r="${f(size * 0.18)}" fill="#7a2450"/>`;
  }
  return s;
}

function cornflower(x, y, h, scale = 1) {
  let s = stem(x, y, x + rr(-15, 15), y - h, rr(-20, 20), 1.6 * scale);
  const cx = s ? x + rr(-15, 15) : x, cy = y - h;
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2, r = 16 * scale;
    s += `<path d="M${f(cx)} ${f(cy)}L${f(cx + Math.cos(a - 0.2) * r)} ${f(cy + Math.sin(a - 0.2) * r)}L${f(cx + Math.cos(a) * r * 1.15)} ${f(cy + Math.sin(a) * r * 1.15)}L${f(cx + Math.cos(a + 0.2) * r)} ${f(cy + Math.sin(a + 0.2) * r)}Z" fill="${C.cornflower}" opacity=".9"/>`;
  }
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(4 * scale)}" fill="#2a2f6a"/>`;
  return s;
}

function buttercups(x, y, n, scale = 1) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const bx = x + rr(-60, 60) * scale, by = y - rr(30, 110) * scale;
    s += ink(`M${f(bx + rr(-10, 10))} ${f(y)}Q${f(bx + rr(-10, 10))} ${f((y + by) / 2)} ${f(bx)} ${f(by)}`, 1, "#4d6a37", 0.85);
    for (let p = 0; p < 5; p++) { const a = p * 72 + rr(-8, 8); s += `<ellipse cx="${f(bx)}" cy="${f(by - 5 * scale)}" rx="${f(4 * scale)}" ry="${f(6 * scale)}" transform="rotate(${f(a)} ${f(bx)} ${f(by)})" fill="${C.butter}" opacity=".95"/>`; }
    s += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(2 * scale)}" fill="#a87a16"/>`;
  }
  return s;
}

function klimtMeadow(x0, x1, yTop, yBot, n, avoid) {
  // Klimt's meadows: a mosaic of small flower dots, ringed and centred.
  let s = "";
  const cols = [C.daisy, C.butter, C.clover, C.harebell, C.willow, C.leafLight, C.gold, C.cornflower];
  for (let i = 0; i < n; i++) {
    const t = rnd();
    const y = yTop + (yBot - yTop) * Math.pow(t, 0.8), r = 2.5 + 7 * Math.pow(t, 1.4);
    const x = rr(x0, x1), c = pick(cols);
    if (avoid && x > avoid[0] && x < avoid[2] && y > avoid[1] && y < avoid[3]) continue;
    if (c === C.gold) { s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${C.gold}" filter="url(#gold)"/>`; continue; }
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}" opacity=".9"/>`;
    if (r > 5) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.38)}" fill="${pick(["#a87a16", C.ink, C.daisy])}" opacity=".85"/>`;
  }
  return s;
}

function fence(pts, postH) {
  // gärdsgård: slanted split poles between paired uprights
  let s = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 26);
    for (let k = 0; k < n; k++) {
      const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, h = postH * (0.9 + 0.2 * (y - 1000) / 600);
      const d = poly([[x, y], [x + h * 0.55, y - h * 0.75], [x + h * 0.55 + 7, y - h * 0.75 - 3], [x + 7, y - 3]], 0.6, 14);
      s += wash(d, pick(["#a99b83", "#8d7f69", "#b9ab90"]), 0.95) + ink(d, 1.1, C.ink, 0.7);
    }
    for (let k = 0; k <= Math.round(Math.hypot(x1 - x0, y1 - y0) / 120); k++) {
      const t = k / Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 120)), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      for (const dx of [-5, 9]) s += wash(poly([[x + dx, y + 16], [x + dx, y - postH * 0.95], [x + dx + 6, y - postH * 0.95], [x + dx + 6, y + 16]], 0.5), "#6f6352", 0.95) + ink(line([[x + dx, y + 16], [x + dx, y - postH * 0.95]], 0.5), 1, C.ink, 0.7);
    }
  }
  return s;
}

module.exports = {
  C, cloud, goldSun, ridge, conifers, klack, church, redHouse, smallHouse, hayRack, birch, leafTree, spruceRow, table,
  bunting, grass, grassBlade, daisy, daisyPlant, harebell, willowherb, cornflower, buttercups, klimtMeadow, fence, leaf, stem,
};

// ——— the garden by the river (after Larsson's flower beds) ————————————————

const G = {
  peonyOut: "#fbf1f1", peonyMid: "#f4c3cd", peonyIn: "#e58ea4", peonyDeep: "#c95f7c",
  poppy: "#e2482d", poppyDeep: "#a92a1c", globe: "#f1cd3b", globeDeep: "#c9971c",
  path: "#f0d9cc", pathShade: "#e2c2b4", picket: "#fbf9f3", picketShade: "#d9dcdc",
  chair: "#d4502e", chairDeep: "#a3381e", water: "#d3e3e6", waterDeep: "#b7d0d6",
};

function peony(x, y, r, rot = 0, tilt = 0.8) {
  // layered cupped petals, white at the rim deepening to pink at the heart
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(1 ${f(tilt)})">`;
  const rings = [[1, 9, G.peonyOut], [0.82, 9, G.peonyOut], [0.66, 8, G.peonyMid], [0.5, 7, G.peonyMid], [0.36, 6, G.peonyIn], [0.22, 5, G.peonyIn]];
  rings.forEach(([k, n, col], ri_) => {
    const off = rr(0, 360);
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * 360 + rr(-10, 10), R = r * k, w = R * rr(0.55, 0.75);
      const d = `M0 ${f(-R * 0.15)}C${f(-w)} ${f(-R * 0.35)} ${f(-w * 0.9)} ${f(-R * 1.05)} 0 ${f(-R * rr(0.95, 1.08))}C${f(w * 0.9)} ${f(-R * 1.05)} ${f(w)} ${f(-R * 0.35)} 0 ${f(-R * 0.15)}Z`;
      s += `<g transform="rotate(${f(a)})"><path d="${d}" fill="${col}" opacity=".95" filter="url(#wcfine)"/>`;
      if (rnd() < 0.7) s += `<path d="${d}" fill="none" stroke="${ri_ > 3 ? G.peonyDeep : "#9a6a70"}" stroke-width="${f(Math.max(0.8, r * 0.014))}" stroke-opacity=".55"/>`;
      s += `</g>`;
    }
  });
  s += `<circle r="${f(r * 0.5)}" fill="${G.peonyIn}" opacity=".25" filter="url(#wcsoft)"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M${f(rr(-r * 0.15, r * 0.15))} ${f(rr(-r * 0.15, r * 0.15))}q${f(rr(-r * 0.12, r * 0.12))} ${f(rr(-r * 0.1, 0))} ${f(rr(-r * 0.15, r * 0.15))} ${f(rr(-r * 0.05, r * 0.08))}" stroke="${G.peonyDeep}" stroke-width="1.2" fill="none" opacity=".7"/>`;
  return s + `</g>`;
}

function poppy(x, y, r, rot = 0) {
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">`;
  for (let i = 0; i < 4; i++) {
    const a = i * 90 + rr(-15, 15) + 45, w = r * rr(0.85, 1.05);
    const d = `M0 0C${f(-w * 0.9)} ${f(-r * 0.2)} ${f(-w * 1.05)} ${f(-r * 1.1)} ${f(-w * 0.1)} ${f(-r * 1.05)}C${f(w * 0.5)} ${f(-r * 1.2)} ${f(w * 1.1)} ${f(-r * 0.6)} 0 0Z`;
    s += `<g transform="rotate(${f(a)}) scale(1 .78)"><path d="${d}" fill="${G.poppy}" filter="url(#wcfine)"/><path d="${d}" fill="none" stroke="${G.poppyDeep}" stroke-width="1.1" stroke-opacity=".6"/></g>`;
  }
  s += `<circle r="${f(r * 0.5)}" fill="${G.poppyDeep}" opacity=".35" filter="url(#wcsoft)"/>`;
  s += `<circle r="${f(r * 0.17)}" fill="#3a3a2a"/><circle r="${f(r * 0.09)}" fill="#8a9a5a"/>`;
  return s + `</g>`;
}

function globeflower(x, y, r) {
  // smörboll / buttercup: a cupped yellow globe
  let s = "";
  for (let i = 0; i < 6; i++) {
    const a = -150 + i * 24 + rr(-6, 6), rad = (a * Math.PI) / 180;
    s += `<ellipse cx="${f(x + Math.cos(rad) * r * 0.45)}" cy="${f(y + Math.sin(rad) * r * 0.3)}" rx="${f(r * 0.48)}" ry="${f(r * 0.62)}" transform="rotate(${f(a + 90)} ${f(x + Math.cos(rad) * r * 0.45)} ${f(y + Math.sin(rad) * r * 0.3)})" fill="${G.globe}" opacity=".95" filter="url(#wcfine)"/>`;
  }
  s += `<path d="M${f(x - r * 0.85)} ${f(y - r * 0.1)}Q${f(x)} ${f(y + r * 0.95)} ${f(x + r * 0.85)} ${f(y - r * 0.1)}" fill="${G.globeDeep}" opacity=".45"/>`;
  s += ink(`M${f(x - r * 0.9)} ${f(y - r * 0.15)}Q${f(x - r * 0.95)} ${f(y - r * 0.95)} ${f(x)} ${f(y - r * 0.9)}Q${f(x + r * 0.95)} ${f(y - r * 0.95)} ${f(x + r * 0.9)} ${f(y - r * 0.15)}Q${f(x)} ${f(y + r * 0.85)} ${f(x - r * 0.9)} ${f(y - r * 0.15)}`, 1, "#8a6a14", 0.6);
  return s;
}

function lobedLeaf(x, y, len, ang, color) {
  // a peony leaf: three long lobes with ink veins and a loose outline
  let s = "";
  [-28, 0, 28].forEach((da) => { s += leaf(x, y, len * (da ? 0.8 : 1), ang + da + rr(-6, 6), 0.2, color); });
  return s;
}

function gardenBed(x0, x1, yTop, yBot, opts = {}) {
  // Larsson's flower bed: lush leaves, peonies, poppies, globeflowers, curling ink
  let s = "";
  const W = x1 - x0;
  s += wash(blob((x0 + x1) / 2, (yTop + yBot) / 2 + 40, W * 0.55, (yBot - yTop) * 0.55, 14, 0.18), "#9fb86a", 0.55);
  for (let i = 0; i < 9; i++) s += washOff(blob(rr(x0, x1), rr(yTop + 60, yBot), rr(80, 160), rr(50, 100), 9, 0.3), pick(["#a8bf6c", "#86a24f", "#c3cf7f", "#6f8f45"]), rr(0.35, 0.6), "wc", 8);
  for (let i = 0; i < (opts.leaves || 60); i++) s += lobedLeaf(rr(x0, x1), rr(yTop + 40, yBot), rr(50, 110), rr(-170, -10), pick(["#7d9a52", "#93ad5a", "#a3b862", "#6a8a44"]));
  for (let i = 0; i < 6; i++) { const lx = rr(x0, x1 - 80), ly = rr(yTop + 50, yBot - 20); s += ink(loops(lx, ly, lx + rr(50, 120), ly + rr(-25, 25), rr(5, 8)), 0.9, C.ink, 0.5); }
  // tall stems first, then blooms
  (opts.poppies || []).forEach(([px, py, r, h]) => {
    s += stem(px + rr(-20, 20), py + h, px, py, rr(-25, 25), 2);
    s += leaf(px + rr(-8, 8), py + h * 0.6, h * 0.25, rr(-160, -120), 0.18, "#8aa65a");
    s += poppy(px, py, r, rr(-20, 20));
  });
  (opts.globes || []).forEach(([gx, gy, r, h]) => { s += stem(gx + rr(-15, 15), gy + h, gx, gy + r * 0.5, rr(-20, 20), 1.6); s += globeflower(gx, gy, r); });
  (opts.peonies || []).forEach(([px, py, r]) => { s += lobedLeaf(px - r * 0.6, py + r * 0.8, r * 1.3, -150, "#7d9a52") + lobedLeaf(px + r * 0.6, py + r * 0.8, r * 1.2, -30, "#6a8a44"); s += peony(px, py, r, rr(-25, 25), rr(0.7, 0.9)); });
  return s;
}

function picketFence(x0, x1, yBase, h, gateAt) {
  // the white spjälstaket along the water, with an arched gate
  let s = "";
  const rail = (yy) => polyL([[x0, yy], [x1, yy], [x1, yy + h * 0.06], [x0, yy + h * 0.06]], 0.6);
  s += wash(rail(yBase - h * 0.78), G.picketShade, 0.9, "wcfine") + wash(rail(yBase - h * 0.3), G.picketShade, 0.9, "wcfine");
  const step = h * 0.17;
  for (let x = x0; x < x1; x += step * rr(0.85, 1.2)) {
    if (gateAt && Math.abs(x - gateAt) < h * 0.9) continue;
    const big = rnd() < 0.08, ph = (big ? h * 1.12 : h) * rr(0.93, 1.05), pw = big ? step * 0.7 : step * rr(0.36, 0.48);
    const d = polyL([[x, yBase], [x, yBase - ph], [x + pw / 2, yBase - ph - pw * 0.4], [x + pw, yBase - ph], [x + pw, yBase]], 0.5);
    s += wash(d, G.picket, 1, "wcfine") + wash(polyL([[x + pw * 0.62, yBase], [x + pw * 0.62, yBase - ph], [x + pw, yBase - ph], [x + pw, yBase]], 0.3), G.picketShade, 0.7, "wcfine") + ink(d, 1, C.ink, 0.55);
  }
  if (gateAt) {
    const gx = gateAt - h * 0.8, gw = h * 1.6;
    for (let k = 0; k < 9; k++) { const px = gx + (gw * (k + 0.5)) / 9, top = yBase - h * 0.95 - Math.sin(((k + 0.5) / 9) * Math.PI) * h * 0.35; s += wash(polyL([[px - 4, yBase - 6], [px - 4, top], [px + 4, top], [px + 4, yBase - 6]], 0.3), G.picket, 1, "wcfine") + ink(line([[px - 4, yBase - 6], [px - 4, top]], 0.3), 0.8, C.ink, 0.45); }
    const arc = []; for (let k = 0; k <= 20; k++) { const t = k / 20; arc.push([gx + gw * t, yBase - h * 0.95 - Math.sin(t * Math.PI) * h * 0.35]); }
    s += ink(smooth(arc, false), 4, G.picket, 1) + ink(smooth(arc, false), 1, C.ink, 0.5);
    [gx - 10, gx + gw].forEach((px) => { s += wash(polyL([[px, yBase], [px, yBase - h * 1.2], [px + 12, yBase - h * 1.2], [px + 12, yBase]], 0.3), G.picket, 1, "wcfine") + ink(polyL([[px, yBase], [px, yBase - h * 1.2], [px + 12, yBase - h * 1.2], [px + 12, yBase]], 0.3), 1, C.ink, 0.55); });
  }
  s += ink(line([[x0, yBase - h * 0.78], [x1, yBase - h * 0.78]], 0.5, 40), 0.8, C.ink, 0.35);
  return s;
}

function chair(x, y, h, facing = 1, flowers = false) {
  // a Larsson red chair seen from behind: slatted back, four legs
  const w = h * 0.42, seat = y - h * 0.48;
  let s = "";
  const back = polyL([[x, y], [x, y - h], [x + w, y - h - 2], [x + w, y]], 0.5);
  const legs = [[x, y], [x + w, y], [x + w * 0.2 * facing + w * 0.15, y - h * 0.06], [x + w * 1.15, y - h * 0.06]];
  legs.forEach(([lx, ly]) => { s += wash(polyL([[lx - 3, ly], [lx - 3, seat], [lx + 4, seat], [lx + 4, ly]], 0.3), G.chairDeep, 0.95, "wcfine"); });
  s += wash(polyL([[x - 4, seat], [x + w + 14, seat - 8], [x + w + 18, seat + 6], [x, seat + 12]], 0.4), G.chair, 1, "wcfine");
  s += wash(polyL([[x - 3, y - h * 0.46], [x - 3, y - h], [x + 6, y - h], [x + 6, y - h * 0.46]], 0.3), G.chair, 1, "wcfine");
  s += wash(polyL([[x + w - 6, y - h * 0.46], [x + w - 6, y - h], [x + w + 3, y - h], [x + w + 3, y - h * 0.46]], 0.3), G.chair, 1, "wcfine");
  s += wash(polyL([[x - 3, y - h], [x + w + 3, y - h - 2], [x + w + 3, y - h * 0.9], [x - 3, y - h * 0.88]], 0.3), G.chair, 1, "wcfine");
  for (let k = 1; k < 4; k++) s += wash(polyL([[x + (w * k) / 4 - 2.5, y - h * 0.5], [x + (w * k) / 4 - 2.5, y - h * 0.9], [x + (w * k) / 4 + 2.5, y - h * 0.9], [x + (w * k) / 4 + 2.5, y - h * 0.5]], 0.3), G.chair, 1, "wcfine");
  s += ink(back, 1, C.ink, 0.5);
  if (flowers) {
    // a bouquet left on the seat
    const bx = x + w * 0.6, by = seat - 6;
    for (let i = 0; i < 9; i++) s += ink(line([[bx, by + 12], [bx + rr(-26, 26), by - rr(14, 40)]], 0.4), 0.9, "#4d6a37", 0.9);
    for (let i = 0; i < 9; i++) s += `<circle cx="${f(bx + rr(-28, 28))}" cy="${f(by - rr(16, 44))}" r="${f(rr(4, 8))}" fill="${pick([C.daisy, G.peonyMid, G.globe, C.harebell, C.daisy])}" opacity=".95"/>`;
    s += `<path d="M${f(bx - 4)} ${f(by + 8)}l-14 22M${f(bx + 4)} ${f(by + 8)}l12 24" stroke="${C.gold}" stroke-width="2.5" fill="none"/>`;
  }
  return s;
}

module.exports.G = G;
Object.assign(module.exports, { peony, poppy, globeflower, lobedLeaf, gardenBed, picketFence, chair });
