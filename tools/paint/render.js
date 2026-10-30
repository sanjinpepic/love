// Renders the painted layers to transparent PNGs, then render.py turns them into WebP.
//   node tools/paint/render.js            (needs Playwright + Chromium)
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { LAYOUTS, layers, sprite, sun, vignettes } = require("./compose");

const OUT = path.join(__dirname, "out");
const only = process.argv[2]; // optional: layout name
const onlyLayer = process.argv[3];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const manifest = {};
  for (const [name, L] of Object.entries(LAYOUTS)) {
    if (only && only !== name) continue;
    const page = await browser.newPage({ viewport: { width: L.W, height: L.H }, deviceScaleFactor: 1 });
    manifest[name] = { W: L.W, H: L.H, layers: [], sprites: [] };
    for (const id of Object.keys(layers)) {
      if (onlyLayer && onlyLayer !== id) continue;
      const svg = layers[id](L);
      await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
      await page.waitForTimeout(50);
      const file = `${name}-${id}.png`;
      await page.screenshot({ path: path.join(OUT, file), omitBackground: true, clip: { x: 0, y: 0, width: L.W, height: L.H } });
      manifest[name].layers.push({ id, file });
      process.stdout.write(`${file} `);
    }
    if (!onlyLayer) {
      let i = 0;
      for (const [kind, x, y, h, scale] of L.sprites) {
        const sp = sprite(kind, scale);
        await page.setViewportSize({ width: sp.W, height: sp.H });
        await page.setContent(`<html><body style="margin:0;background:transparent">${sp.svg}</body></html>`);
        const file = `${name}-flower-${i++}.png`;
        await page.screenshot({ path: path.join(OUT, file), omitBackground: true, clip: { x: 0, y: 0, width: sp.W, height: sp.H } });
        manifest[name].sprites.push({ file, kind, x, y, h, w: Math.round(h * sp.W / sp.H) });
        process.stdout.write(`${file} `);
      }
    }
    const sp = sun(L.sun[2]);
    await page.setViewportSize({ width: sp.W, height: sp.H });
    await page.setContent(`<html><body style="margin:0;background:transparent">${sp.svg}</body></html>`);
    await page.screenshot({ path: path.join(OUT, `${name}-sun.png`), omitBackground: true, clip: { x: 0, y: 0, width: sp.W, height: sp.H } });
    manifest[name].sun = { file: `${name}-sun.png`, x: L.sun[0], y: L.sun[1], w: sp.W };
    await page.close();
  }
  if (!only) {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    manifest.vignettes = {};
    for (const [id, fn] of Object.entries(vignettes)) {
      const v = fn();
      await page.setViewportSize({ width: v.W, height: v.H });
      await page.setContent(`<html><body style="margin:0;background:transparent">${v.svg}</body></html>`);
      await page.screenshot({ path: path.join(OUT, `vignette-${id}.png`), omitBackground: true, clip: { x: 0, y: 0, width: v.W, height: v.H } });
      manifest.vignettes[id] = { file: `vignette-${id}.png`, W: v.W, H: v.H };
      process.stdout.write(`vignette-${id}.png `);
    }
    await page.close();
  }
  await browser.close();
  if (!only && !onlyLayer) fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("\ndone");
})();
