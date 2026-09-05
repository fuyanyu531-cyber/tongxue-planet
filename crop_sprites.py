# -*- coding: utf-8 -*-
"""根据视觉识别结果，将视界实验室素材.png裁切为独立PNG文件。
坐标基于scipy连通域检测结果 + 人工识别对照表。"""
from PIL import Image
import os

SRC = r"c:\Users\32555\Desktop\瞳学星球Demo\assets\images\视界实验室素材.png"
OUT = r"c:\Users\32555\Desktop\瞳学星球Demo\assets\images\vision"
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert("RGBA")

# 裁切清单：文件名 -> (x0, y0, x1, y1)
# 坐标来自连通域检测结果，部分做微调扩边确保完整
CROPS = {
    # === 小光仔角色系列 ===
    "character-main.png":      (14, 15, 258, 354),      # #1 站立主姿
    "character-happy.png":     (560, 28, 752, 294),     # #2 开心跳跃
    "character-fly.png":       (782, 33, 1046, 287),    # #3 飞行动作
    "character-magnifier.png": (316, 42, 512, 294),     # #4 拿放大镜

    # === 飞船 ===
    "spaceship.png":           (1170, 51, 1526, 337),   # #5 飞船

    # === 5个任务场景（带岛屿/环境） ===
    "island-eye.png":          (210, 276, 422, 477),    # #22 眼球实验室装置
    "island-eye-full.png":     (706, 437, 961, 723),    # #29 眼球实验室+岛屿
    "island-vision.png":       (459, 291, 759, 514),    # #23 紫色机器人+岛屿
    "island-vision-full.png":  (911, 237, 1214, 651),   # #17 紫色机器人+宝箱+锤子
    "island-rumor.png":        (9, 467, 331, 727),      # #31 小屋场景
    "island-life.png":         (347, 504, 697, 722),    # #34 紫色机器人+大岛屿
    "island-care.png":         (1227, 457, 1364, 622),  # #30 护眼挑战清单

    # === 宝箱 ===
    "treasure.png":            (1376, 475, 1516, 602),  # #32 金色宝箱

    # === 01-05 编号 ===
    "num-01.png":              (18, 745, 112, 841),     # #53 蓝色01
    "num-02.png":              (141, 745, 236, 843),    # #54 紫色02
    "num-03.png":              (267, 745, 362, 842),    # #55 橙色03
    "num-04.png":              (393, 745, 487, 841),    # #56 青色04
    "num-05.png":              (517, 745, 612, 842),    # #57 绿色05

    # === 星星 ===
    "star-big.png":            (724, 780, 763, 817),    # #63 大星星
    "star-small.png":          (804, 773, 829, 801),    # #61 小星星/闪光

    # === 游戏手柄 ===
    "gamepad.png":             (923, 790, 1028, 860),   # #67 绿色手柄

    # === 火箭 ===
    "rocket.png":              (1132, 774, 1209, 847),  # #62 火箭

    # === 树木/草地/环境 ===
    "tree-big.png":            (941, 659, 1055, 776),   # #46 大树
    "tree-small.png":          (1062, 688, 1122, 770),  # #52 小树
    "grass.png":               (1134, 687, 1271, 754),  # #51 草地+雏菊
    "waterfall.png":           (1289, 667, 1405, 772),  # #48 瀑布
    "rock.png":                (1215, 659, 1285, 706),  # #47 石头
    "pond.png":                (1417, 669, 1523, 763),  # #49 池塘

    # === UI 元素 ===
    "dialog.png":              (1030, 842, 1230, 999),  # #71 对话框+小光仔
    "energy-bar.png":          (716, 884, 1011, 987),   # #77 能量条(2/5)
    "play-btn.png":            (1250, 905, 1391, 970),  # #80 播放按钮

    # === 5个彩色卡片（底部UI） ===
    "card-blue.png":           (11, 856, 143, 990),     # #72 蓝色卡片
    "card-purple.png":         (143, 856, 274, 991),    # #73 紫色卡片
    "card-orange.png":         (281, 856, 414, 991),    # #74左 橙色卡片(拆分前半)
    "card-cyan.png":           (414, 856, 547, 991),    # #74右 青色卡片(拆分后半)
    "card-green.png":          (553, 856, 691, 991),    # #75 绿色卡片

    # === 角色头像框 ===
    "avatar-frame.png":        (1402, 875, 1518, 992),  # #76 绿色头像框

    # === 其他装饰 ===
    "flask.png":               (835, 753, 904, 861),    # #58 烧瓶
    "ice.png":                 (1242, 788, 1316, 841),  # #65 冰块
    "moss.png":                (1347, 788, 1414, 841),  # #66 苔藓
}

print(f"开始裁切 {len(CROPS)} 个素材...")
results = []
for name, box in CROPS.items():
    crop = img.crop(box)
    path = os.path.join(OUT, name)
    crop.save(path, "PNG")
    w, h = crop.size
    results.append((name, box, w, h))
    print(f"  ✓ {name:30s}  {w:4d}x{h:4d}  from {box}")

print(f"\n裁切完成！共 {len(CROPS)} 个文件")
print(f"保存目录: {OUT}")
