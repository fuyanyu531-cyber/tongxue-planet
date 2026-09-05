# -*- coding: utf-8 -*-
"""在原图上标注所有检测到的区域编号，生成标注图供人工识别。"""
from PIL import Image, ImageDraw, ImageFont
import json
import os

SRC = r"c:\Users\32555\Desktop\瞳学星球Demo\assets\images\视界实验室素材.png"
ANALYSIS = r"c:\Users\32555\Desktop\瞳学星球Demo\assets\images\vision\_analysis"
MANIFEST = os.path.join(ANALYSIS, "manifest.json")

img = Image.open(SRC).convert("RGBA")
# 放大2倍方便看清
W, H = img.size
scale = 2
big = img.resize((W * scale, H * scale), Image.LANCZOS)
draw = ImageDraw.Draw(big)

with open(MANIFEST, "r", encoding="utf-8") as f:
    regions = json.load(f)

# 尝试加载字体
font = None
for fp in [r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf"]:
    if os.path.exists(fp):
        font = ImageFont.truetype(fp, 28)
        break
if font is None:
    font = ImageFont.load_default()

for r in regions:
    x0, y0, x1, y1 = r["x0"] * scale, r["y0"] * scale, r["x1"] * scale, r["y1"] * scale
    # 画矩形框
    draw.rectangle([x0, y0, x1, y1], outline=(255, 0, 0), width=4)
    # 编号标签
    label = f"#{r['id']}"
    draw.rectangle([x0, y0 - 30, x0 + 80, y0], fill=(255, 0, 0))
    draw.text((x0 + 6, y0 - 28), label, fill=(255, 255, 255), font=font)

out = os.path.join(ANALYSIS, "annotated.png")
big.save(out)
print(f"标注图已保存: {out}")
print(f"尺寸: {big.size}")

# 同时生成每个区域的单独文件名映射（用坐标命名）
print("\n各区域坐标清单（供识别）：")
for r in regions:
    print(f"  #{r['id']:3d}  ({r['x0']:4d},{r['y0']:4d})-({r['x1']:4d},{r['y1']:4d})  {r['w']:3d}x{r['h']:3d}  -> {r['file']}")
