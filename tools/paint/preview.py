# Flatten the rendered layers into one preview image (development aid).
import json, sys
from pathlib import Path
from PIL import Image
out = Path(__file__).parent / "out"
name = sys.argv[1] if len(sys.argv) > 1 else "wide"
dest = sys.argv[2] if len(sys.argv) > 2 else str(out / f"preview-{name}.png")
ids = ["sky", "hills", "river", "garden", "bed"]
base = None
for i in ids:
    im = Image.open(out / f"{name}-{i}.png").convert("RGBA")
    base = im if base is None else Image.alpha_composite(base, im)
m = json.load(open(out / "manifest.json")) if (out / "manifest.json").exists() else None
sprites = m[name]["sprites"] if m and name in m else []
for s in sprites:
    im = Image.open(out / s["file"]).convert("RGBA")
    im = im.resize((s["w"], s["h"]), Image.LANCZOS)
    layer = Image.new("RGBA", base.size)
    layer.paste(im, (int(s["x"] - s["w"] / 2), int(s["y"] - s["h"])), im)
    base = Image.alpha_composite(base, layer)
base.convert("RGB").save(dest)
print(dest, base.size)
