"""Вырезает животных из однотонного лавандового фона: img/hero-pets-src.png -> img/hero-pets.png.
Фон определяется по «лавандовости» (синий заметно больше красного и зелёного) и связности с краем кадра,
поэтому голубые глаза внутри морд не пропадают. Край мягкий, лавандовый ореол вычитается."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src = sys.argv[1] if len(sys.argv) > 1 else "img/hero-pets-src.png"
dst = sys.argv[2] if len(sys.argv) > 2 else "img/hero-pets.png"
T_FG, T_BG = 14.0, 46.0  # ниже — точно животное, выше — точно фон

im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
s = b - np.maximum(r, g)

# фон, связанный с краем кадра
hard = (s > (T_FG + T_BG) / 2).astype(np.uint8) * 255
m = Image.fromarray(np.pad(hard, 1, constant_values=255)).copy()  # copy: fromarray даёт read-only буфер
ImageDraw.floodfill(m, (0, 0), 128)
bg = (np.asarray(m)[1:-1, 1:-1] == 128)

# полоса края: фон, расширенный на несколько пикселей
band = np.asarray(Image.fromarray(bg.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(7))) > 0
soft = np.clip((T_BG - s) / (T_BG - T_FG), 0, 1)
alpha = np.where(band, soft, 1.0)
alpha[bg & (s > T_BG)] = 0
alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255

# цвет фона по строкам (градиент сверху вниз) и вычитание ореола
rows = []
for y in range(a.shape[0]):
    row = a[y][bg[y]]
    rows.append(row.mean(axis=0) if len(row) > 20 else None)
last = np.array([160, 154, 228], np.float32)
for i, v in enumerate(rows):
    if v is None:
        rows[i] = last
    else:
        last = v
B = np.stack(rows)[:, None, :]
k = np.clip(alpha, 0.05, 1)[..., None]
fg = np.clip((a - (1 - k) * B) / k, 0, 255)
out = np.dstack([np.where(alpha[..., None] < 0.999, fg, a), alpha * 255]).astype(np.uint8)

img = Image.fromarray(out, "RGBA")
bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
img = img.crop(bbox)
img.save(dst, optimize=True)
print("saved", dst, img.size, "bbox", bbox)
