"""
Final watermark removal pass.
KlingAI 3.0 watermark confirmed at x=1280-1530, bottom ~80px.
Per-pixel inpainting: replace with value from same column, 120px above watermark.
"""
import os, glob
from PIL import Image
import numpy as np

FRAME_DIR = r"c:\Users\popov\Desktop\coffee sequence\Comp 1"

# Paint the full watermark rect: x=1260-1560, y=last 85px
PAINT_X1 = 1260
PAINT_X2 = 1560
PAINT_H  = 85          # rows from bottom

frames = sorted(glob.glob(os.path.join(FRAME_DIR, "Comp 1_*.png")))
print(f"Processing {len(frames)} frames...")

for i, path in enumerate(frames):
    img = Image.open(path).convert("RGB")
    arr = np.array(img, dtype=np.uint8)
    h, w = arr.shape[:2]

    wm_top = h - PAINT_H  # first row of watermark zone

    # Reference: same columns but 120px ABOVE the watermark zone (well clear of text)
    ref_y1 = wm_top - 120
    ref_y2 = wm_top - 100
    ref = arr[ref_y1:ref_y2, PAINT_X1:PAINT_X2, :3].astype(np.float32)
    col_fill = np.median(ref, axis=0).round().astype(np.uint8)   # (ncols, 3)

    # Overwrite watermark zone column by column
    arr[wm_top:h, PAINT_X1:PAINT_X2, :] = col_fill[np.newaxis, :, :]

    Image.fromarray(arr).save(path)

    if (i + 1) % 50 == 0 or i == 0:
        print(f"  {i+1}/{len(frames)}")

print("Done.")
