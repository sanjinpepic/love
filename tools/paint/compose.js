// Composition: a garden by the Ljusnan in Järvsö on a late-summer afternoon,
// split into paper layers. Mostly paper and light: a pale sky, Järvsöklack and
// the church soft across the water, a white fence with its gate, two red chairs
// waiting side by side, and a bed of peonies, poppies and globeflowers.
"use strict";
const B = require("./brush");
const S = require("./scene");
const { rr, ri, f, smooth, wash, blob } = B;
const { C, G } = S;

const LAYOUTS = {
  wide: {
    W: 2400, H: 1500,
    sun: [1300, 300, 52],
    clouds: [],
    horizon: 880,
    klack: { x: 1660, y: 560, w: 980, h: 380 },
    ridges: [[0, 2400, 790, 940, "#c3d0cf", 5, 40], [0, 1400, 830, 940, "#b4c4c2", 4, 30]],
    church: { x: 1260, y: 922, s: 0.62 },
    farmsFar: [[2200, 916, 44]],
    river: [935, 1040],
    fence: { y: 1120, h: 105, gate: 1180, x0: 760, x1: 1960 },
    birch: [2190, 1270, 1000, -40, 0.8],
    bush: null,
    tree: null,
    path: [[1020, 1500], [1560, 1130], [1980, 1130], [2400, 1360], [2400, 1500]],
    chairs: [[1600, 1238, 165], [1712, 1243, 165]],
    bed: { x0: -40, x1: 1250, yTop: 1200, yBot: 1520,
      peonies: [[620, 1370, 90], [880, 1440, 70]],
      poppies: [[1060, 1280, 32, 190], [300, 1310, 28, 200]],
      globes: [[460, 1330, 18, 150], [1160, 1420, 16, 110]] },
    sprites: [["poppy", 1360, 1530, 440, 1.1], ["globe", 2260, 1530, 320, 1.05]],
  },
  tall: {
    W: 1200, H: 2400,
    sun: [1050, 1310, 34],
    clouds: [],
    horizon: 1440,
    klack: { x: 820, y: 1230, w: 640, h: 260 },
    ridges: [[0, 1200, 1350, 1500, "#c3d0cf", 3, 36], [0, 700, 1390, 1500, "#b4c4c2", 2, 26]],
    church: { x: 300, y: 1482, s: 0.52 },
    farmsFar: [],
    river: [1500, 1615],
    fence: { y: 1700, h: 100, gate: 420, x0: 110, x1: 980 },
    birch: [1080, 1950, 720, -30, 0.8],
    bush: null,
    tree: [180, 1420, 160, 170],
    path: [[360, 2400], [640, 1720], [920, 1720], [1200, 1950], [1200, 2400]],
    chairs: [[690, 1820, 150], [790, 1825, 150]],
    bed: { x0: -40, x1: 760, yTop: 1820, yBot: 2420,
      peonies: [[330, 2060, 84], [560, 2180, 66]],
      poppies: [[640, 1940, 30, 190]],
      globes: [[220, 1920, 18, 150]] },
    sprites: [["poppy", 900, 2430, 440, 1.0]],
  },
};

function svg(W, H, body, id, filter) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${B.defs(id)}</defs>` +
    (filter ? `<g filter="url(#${filter})">${body}</g>` : body) + `</svg>`;
}

const layers = {
  // 0 — paper and a pale late-summer sky. Opaque.
  sky(L) {
    B.seed(101);
    const { W, H } = L;
    let s = `<rect width="${W}" height="${H}" fill="${C.paper}"/>`;
    s += `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7cfdd"/><stop offset=".5" stop-color="#d6e2e4"/><stop offset="1" stop-color="#f3ead6"/></linearGradient></defs>`;
    s += `<rect x="-80" y="-80" width="${W + 160}" height="${L.horizon + 120}" fill="url(#sk)" filter="url(#wcsoft)" opacity=".7"/>`;
    s += wash(blob(L.sun[0], L.sun[1] + 260, W * 0.4, 280, 12, 0.3), "#f6e3b8", 0.18, "wcsoft");
    for (let i = 0; i < 2; i++) s += wash(blob(rr(0, W), rr(0, L.horizon * 0.3), rr(260, 420), rr(50, 90)), "#9dbccf", rr(0.06, 0.1), "wcsoft");
    L.clouds.forEach((c) => { s += S.cloud(...c); });
    return svg(W, H, s, 0);
  },

  // 1 — the far shore: hills, Järvsöklack, the church and farms, soft with distance
  hills(L) {
    B.seed(202);
    const { W } = L;
    let s = "";
    L.ridges.forEach((r) => { s += S.ridge(...r); });
    s += `<g opacity=".85">${S.klack(L.klack)}</g>`;
    s += S.ridge(0, W, L.horizon - 26, L.horizon + 60, "#c9d29a", 6, 14);
    s += B.ink(B.line([[-20, L.horizon - 22], [W * 0.3, L.horizon - 30], [W * 0.6, L.horizon - 20], [W + 20, L.horizon - 26]], 2, 40), 1.1, C.ink, 0.45);
    s += S.conifers(0, W, () => L.horizon - 34, 14, 36, "#6d8a76");
    s += `<g opacity=".9">${S.spruceRow(-20, W * 0.15, L.horizon + 10, 50, 7)}${S.spruceRow(W * 0.5, W * 0.62, L.horizon + 14, 44, 5)}</g>`;
    L.farmsFar.forEach(([x, y, w]) => { s += S.smallHouse(x, y, w); });
    s += S.church(L.church);
    return svg(W, L.H, s, 1, "cut");
  },

  // 2 — the river and the near meadow up to the fence
  river(L) {
    B.seed(303);
    const { W } = L;
    const [r0, r1] = L.river;
    let s = "";
    s += wash(`M-40 ${r0 + 10}C${W * 0.3} ${r0} ${W * 0.7} ${r0 + 16} ${W + 40} ${r0 + 6}V${r1 + 40}H-40Z`, G.water, 1);
    s += wash(`M-40 ${r0 + 10}C${W * 0.3} ${r0} ${W * 0.7} ${r0 + 16} ${W + 40} ${r0 + 6}V${r0 + 34}H-40Z`, "#a9bfb4", 0.45, "wcsoft");
    for (let i = 0; i < 14; i++) { const x = rr(-50, W), y = rr(r0 + 30, r1 - 10); s += `<path d="M${f(x)} ${f(y)}h${f(rr(30, 140))}" stroke="#fff" stroke-width="${f(rr(1.5, 3))}" opacity=".8"/>`; }
    for (let i = 0; i < 4; i++) { const x = rr(0, W), y = rr(r0 + 40, r1 - 20); s += `<path d="M${f(x)} ${f(y)}h${f(rr(40, 120))}" stroke="${G.waterDeep}" stroke-width="2" opacity=".6"/>`; }
    const nb = r1 - 10;
    s += wash(`M-40 ${nb}C${W * 0.35} ${nb - 16} ${W * 0.65} ${nb + 10} ${W + 40} ${nb - 6}V${L.fence.y + 30}H-40Z`, "#bccb7c", 1);
    s += B.ink(B.line([[-20, r0 + 12], [W * 0.3, r0 + 4], [W * 0.7, r0 + 18], [W + 20, r0 + 8]], 1.5, 50), 1, C.ink, 0.4);
    s += B.ink(B.line([[-20, nb + 2], [W * 0.35, nb - 12], [W * 0.65, nb + 8], [W + 20, nb - 4]], 1.5, 50), 1, C.ink, 0.4);
    return svg(W, L.H, s, 2, "cut");
  },

  // 3 — the garden: fence and gate, the birch, the bush, the path and two red chairs
  garden(L) {
    B.seed(404);
    const { W, H } = L;
    let s = "";
    s += S.picketFence(L.fence.x0, L.fence.x1, L.fence.y, L.fence.h, L.fence.gate);
    s += wash(`M-40 ${L.fence.y - 6}H${W + 40}V${H + 40}H-40Z`, "#c2cf86", 1);
    s += B.washOff(blob(W * 0.5, L.fence.y + 120, W * 0.6, 90, 12, 0.2), "#d3db98", 0.6, "wc", 8);
    s += wash(B.poly(L.path, 2, 60), G.path, 1);
    s += B.washOff(B.poly(L.path.map(([x, y]) => [x + 60, y + 40]), 2, 60), G.pathShade, 0.3, "wc", 8);
    if (L.bush) { const [bx0, by0, bx1, by1] = L.bush;
    for (let i = 0; i < 8; i++) s += wash(blob(rr(bx0 + 60, bx1 - 80), rr(by0 + 80, by1 - 40), rr(90, 160), rr(70, 120), 10, 0.3), [C.leafLight, "#b9c97c", C.leafMid][ri(0, 2)], rr(0.8, 0.95));
    for (let i = 0; i < 90; i++) s += B.washOff(blob(rr(bx0, bx1), rr(by0 + 40, by1), rr(14, 34), rr(10, 26), 8, 0.3), [C.leaf, C.leafMid, "#a8bf6c", C.leafMid][ri(0, 3)], rr(0.55, 0.85), "wcfine", 3);
    for (let i = 0; i < 30; i++) { const lx = rr(bx0, bx1 - 80), ly = rr(by0, by1); s += B.ink(B.loops(lx, ly, lx + rr(50, 110), ly + rr(-20, 20), rr(5, 7)), 0.9, C.ink, 0.5); } }
    if (L.tree) s += S.leafTree(...L.tree);
    s += S.birch(...L.birch);
    L.chairs.forEach(([x, y, h]) => { s += wash(blob(x + h * 0.3, y + 6, h * 0.42, h * 0.07, 9, 0.2), "#b48f80", 0.35, "wcsoft"); });
    for (let i = 0; i < 0; i++) { const p = L.path, x = rr(p[1][0], p[3][0]), y = rr(p[1][1] + 20, L.H); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr(0.8, 2.2))}" fill="#b89282" opacity=".35"/>`; }
    L.chairs.forEach(([x, y, h], i) => { s += S.chair(x, y, h, 1, i === 1); });
    return svg(W, H, s, 3, "cut");
  },

  // 4 — the flower bed in the foreground
  bed(L) {
    B.seed(505);
    const b = L.bed;
    const s = S.gardenBed(b.x0, b.x1, b.yTop, b.yBot, { peonies: b.peonies, poppies: b.poppies, globes: b.globes, leaves: 26 });
    return svg(L.W, L.H, s, 4, "cut");
  },
};

// Foreground sprites that sway on their stems.
function sprite(kind, scale) {
  B.seed(ri(1, 99999));
  const W = Math.round(360 * scale), H = Math.round(620 * scale), x = W / 2, y = H - 4;
  let s = S.leaf(x, y - 6, 110 * scale, -60, 0.16, "#93ad5a") + S.leaf(x, y - 4, 100 * scale, -125, 0.16, "#7d9a52");
  if (kind === "poppy") {
    s += S.stem(x, y, x + 10 * scale, y - H * 0.78, -30 * scale, 2.2) + S.leaf(x, y - H * 0.3, 90 * scale, -150, 0.18, "#8aa65a") + S.poppy(x + 10 * scale, y - H * 0.78, 40 * scale, 10);
    s += S.stem(x + 30 * scale, y, x + 70 * scale, y - H * 0.52, 20 * scale, 1.8) + S.poppy(x + 70 * scale, y - H * 0.52, 30 * scale, -20);
  }
  if (kind === "globe") {
    s += S.stem(x, y, x - 10 * scale, y - H * 0.6, 20 * scale, 1.8) + S.globeflower(x - 10 * scale, y - H * 0.6 - 10 * scale, 24 * scale);
    s += S.stem(x + 20 * scale, y, x + 50 * scale, y - H * 0.42, -15 * scale, 1.6) + S.globeflower(x + 50 * scale, y - H * 0.42 - 8 * scale, 20 * scale);
    s += S.leaf(x, y - H * 0.18, 80 * scale, -30, 0.2, "#8aa65a") + S.leaf(x, y - H * 0.12, 70 * scale, -160, 0.2, "#7d9a52");
  }
  return { W, H, svg: svg(W, H, s, 9, "cut") };
}

// The sun is its own piece of gold, so it can turn slowly.
function sun(r) {
  B.seed(77);
  const W = Math.round(r * 3.4);
  return { W, H: W, svg: svg(W, W, S.goldSun(W / 2, W / 2, r), 8) };
}

// Vignettes for the wedding page: painted straight onto the paper, no cut edge.
const vignettes = {

  chairs() {
    B.seed(622);
    const W = 760, H = 560;
    let s = wash(blob(380, 470, 330, 70, 12, 0.2), S.G.path, 1);
    s += wash(blob(380, 490, 260, 40, 10, 0.2), S.G.pathShade, 0.35, "wcsoft");
    s += S.grass(40, 220, 520, 40, 140, 40, 0.3) + S.grass(560, 730, 520, 40, 150, 40, 0.3);
    s += S.chair(250, 470, 260, 1, false) + S.chair(410, 476, 260, 1, true);
    s += S.globeflower(120, 400, 16) + S.globeflower(650, 380, 18) + S.poppy(600, 330, 24, 15);
    return { W, H, svg: svg(W, H, s, 22) };
  },

  meadow() {
    B.seed(644);
    const W = 2400, H = 420;
    let s = wash(`M-80 ${H * 0.55}C600 ${H * 0.45} 1600 ${H * 0.62} ${W + 80} ${H * 0.5}V${H + 40}H-80Z`, "#c2cf86", 1);
    s += S.grass(-20, W + 20, H, 30, 130, 120, 0.25);
    let x = rr(40, 140);
    while (x < W - 40) {
      const k = B.pick(["p", "g", "g", "y", "p", "g"]), hgt = rr(140, 250);
      if (k === "p") s += S.stem(x, H, x + rr(-12, 12), H - hgt, rr(-25, 25), 2) + S.poppy(x + rr(-12, 12), H - hgt, rr(24, 32), rr(-20, 20));
      if (k === "g") s += S.stem(x, H, x + rr(-10, 10), H - hgt * 0.75, rr(-20, 20), 1.6) + S.globeflower(x, H - hgt * 0.75 - 10, rr(14, 20));
      if (k === "y") s += S.stem(x, H, x + 4, H - hgt, rr(-15, 15), 2) + S.peony(x + 4, H - hgt - 10, rr(38, 50), rr(-15, 15), 0.8);
      x += rr(280, 620);
    }
    return { W, H, svg: svg(W, H, s, 24) };
  },
};

module.exports = { LAYOUTS, layers, sprite, sun, vignettes };
