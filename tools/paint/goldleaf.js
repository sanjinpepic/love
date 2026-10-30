// Renders a tile of beaten gold leaf (Klimt) for lettering: node tools/paint/goldleaf.js
"use strict";
const path = require("path");
const { chromium } = require("playwright");
const B = require("./brush");
(async () => {
  const W = 480, H = 240;
  // leaf squares, slightly misaligned, each lit a little differently
  let s = "";
  for (let y = 0; y < H; y += 60) for (let x = 0; x < W; x += 60) {
    const tone = ["#c9a043", "#d4ad4f", "#bf963a", "#ddb95c"][Math.floor(Math.random() * 4)];
    s += `<rect x="${x + B.rr(-2, 2)}" y="${y + B.rr(-2, 2)}" width="62" height="62" fill="${tone}" filter="url(#gold)"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${B.defs(31)}</defs><rect width="${W}" height="${H}" fill="#b8902f"/>${s}</svg>`;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(`<body style="margin:0">${svg}</body>`);
  await p.screenshot({ path: path.join(__dirname, "out", "gold-leaf.png") });
  await b.close();
})();
