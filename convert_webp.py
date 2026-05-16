import os, glob
from PIL import Image

FRAME_DIR = r"c:\Users\popov\Desktop\coffee sequence\Comp 1"
QUALITY   = 82

pngs = sorted(glob.glob(os.path.join(FRAME_DIR, "Comp 1_*.png")))
print(f"Converting {len(pngs)} frames to WebP (quality={QUALITY})...")

for i, path in enumerate(pngs):
    out = path.replace(".png", ".webp")
    with Image.open(path) as img:
        img.convert("RGB").save(out, "WEBP", quality=QUALITY, method=4)
    if (i + 1) % 50 == 0 or i == 0:
        print(f"  {i+1}/{len(pngs)}")

print("Done. Deleting PNGs...")
for path in pngs:
    os.remove(path)
print("All PNGs removed.")
