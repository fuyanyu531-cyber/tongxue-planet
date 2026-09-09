# -*- coding: utf-8 -*-
"""分析视界实验室素材.png，自动检测独立元素边界框。
输出每个候选区域的坐标和缩略图，用于人工确认拆分坐标。"""
from PIL import Image, ImageChops
import os
import json

SRC = r"c:\Users\32555\Desktop\瞳学星球Demo\assets\images\视界实验室素材.png"
OUT_DIR = r"c:\Users\32555\Desktop\瞳学星球Demo\assets\images\vision\_analysis"
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
W, H = img.size
print(f"原图尺寸: {W} x {H}")

# 用 alpha 通道做连通区域检测
alpha = img.getchannel("A")
# 二值化：alpha > 10 视为有内容
from PIL import Image as IMG
bw = alpha.point(lambda p: 255 if p > 10 else 0)
bbox = bw.getbbox()
print(f"整图非透明边界: {bbox}")

# 网格扫描法：把图像分成若干行，检测每行的内容带
# 更精细：用 BFS/DFS 连通域检测
import numpy as np
arr = np.array(bw)
# 找连通域（4邻接）
from scipy import ndimage
labeled, num = ndimage.label(arr > 0, structure=ndimage.generate_binary_structure(2, 1))
print(f"检测到 {num} 个连通域")

# 计算每个连通域的边界框和面积
slices = ndimage.find_objects(labeled)
regions = []
for i, sl in enumerate(slices, 1):
    if sl is None:
        continue
    y0, y1 = sl[0].start, sl[0].stop
    x0, x1 = sl[1].start, sl[1].stop
    w = x1 - x0
    h = y1 - y0
    area = int((labeled[sl] == i).sum())
    regions.append({
        "id": i,
        "x0": int(x0), "y0": int(y0),
        "x1": int(x1), "y1": int(y1),
        "w": int(w), "h": int(h),
        "area": area
    })

# 按面积排序，输出前 60 个（过滤掉太小的噪点）
regions.sort(key=lambda r: r["area"], reverse=True)
big = [r for r in regions if r["area"] > 200 and r["w"] > 20 and r["h"] > 20]
print(f"较大区域(面积>200,宽>20,高>20): {len(big)} 个")

# 输出每个区域的缩略图
manifest = []
for r in big[:60]:
    name = f"reg_{r['id']:03d}_{r['x0']}-{r['y0']}-{r['x1']}-{r['y1']}.png"
    path = os.path.join(OUT_DIR, name)
    crop = img.crop((r["x0"], r["y0"], r["x1"], r["y1"]))
    crop.save(path)
    r["file"] = name
    manifest.append(r)
    print(f"  #{r['id']:3d}  ({r['x0']:4d},{r['y0']:4d})-({r['x1']:4d},{r['y1']:4d})  {r['w']:3d}x{r['h']:3d}  area={r['area']:6d}")

with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print(f"\n分析完成，缩略图和 manifest.json 已保存到: {OUT_DIR}")
