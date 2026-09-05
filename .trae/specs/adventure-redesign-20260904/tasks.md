# 任务清单 tasks.md — adventure-redesign-20260904

> 每一条任务覆盖 spec.md 的一条/多条 AC。
> 每个任务的本地测试要求（TR）也是 rule / rubric 两种。

## 元信息

- 范围：只改 `adventure.html`（可在 `<head>` 里追加/覆写整页专属 CSS）。不动 `css/style.css` 与 `js/main.js`。
- 新样式前缀：统一 `body.page-adventure .adv2-*` 作用域。不改全局 body/img/button/.card。

---

## Task 1：素材与现状审计（Step 1-2）

**覆盖 AC**：AC01 / AC02 / AC12。
**优先级**：高。
**状态**：in_progress。
**依赖**：无。

### 任务说明
- 列出 `assets/images/` 与 `vision/*.png` 中所有本页可能用到的素材路径与原始尺寸。
- 精准定位当前「巨大圆形小光仔」元凶：所有引用 `xiaoguangzi-new.png` 或 人物作为 background 的容器，并登记行号/类名。
- 核对当前 `adventure.html` 现有模块（ad-sky / ad-bg-layer / nav / ad-hero / ad-progress / ad-core / ad-games / footer / modals），决定哪些保留、哪些在新设计中改为 `display:none` 并在新容器中重建。

### 本地测试要求
- **TR rule**：审计清单覆盖「背景层 / 导航 / Hero / 进度 / 三栏 / 小游戏 / 弹窗」7 大模块。
- **TR rule**：登记至少 2 处把 xiaoguangzi 放大的样式/位置。
- **TR rubric**（阈值≥1.6）：审计是否对"巨圆元凶"定位清晰（2=可指出具体类和数值；1=方向对；0=含混）。

### 完成证据
写入任务 1 审计结果文本块：
- 素材清单与尺寸（尤其是 xiaoguangzi-new.png 的 1024×1536）。
- 元凶类清单。

---

## Task 2：建立新的背景与作用域样式（Step 3）

**覆盖 AC**：AC02 / AC01。
**优先级**：高。
**状态**：pending。
**依赖**：Task 1。

### 任务说明
- 在 `adventure.html` 的 `<head>` 中用**一个新的整块 `<style>` 覆盖**（不要与之前 style.css 中的 page-adventure 覆盖块产生冲突；必要时在覆盖中把旧覆盖的作用域重写到 `body.page-adventure` 之下，并用更高特异性 + 明确数值）。
- `.ad-bg-layer` 仅用 `planet-scene.png` 作为背景：`cover + center top + fixed + no-repeat`。
- 在背景上叠极轻的深蓝渐变遮罩（仅提高可读性）+ 少量 CSS 星尘层，不让 `planet-scene.png` 的绿色山丘圆盘"露馅"。
- **禁止**将 `xiaoguangzi-new.png` 写入任何背景层。

### 本地测试要求
- **TR rule**：`grep` 搜索 `<style>` 块中不得出现 `xiaoguangzi.*background` 或 `background.*xiaoguangzi`。
- **TR rule**：`.ad-bg-layer` 同时存在 background-size cover 与 background-position center top。
- **TR rubric**（阈值≥1.6）：背景星空氛围契合（2=银河+星点+不抢画面；1=普通深蓝；0=仍能看到大绿山丘）。

### 完成证据
- 粘贴 `<style>` 首段（背景作用域）5~15 行快照。

---

## Task 3：顶部导航统一（Step 1 中保留结构 + 补覆盖样式）

**覆盖 AC**：AC03 / AC11。
**优先级**：中。
**状态**：pending。
**依赖**：Task 2。

### 任务说明
- 保持既有导航 DOM 完整（菜单列表 / 语音朗读按钮 / 用户头像）。
- 在覆盖样式中指定：
  - nav 容器 `height≈80px；半透明深蓝玻璃；border-bottom 1px solid rgba(255,255,255,.12)`。
  - 当前页高亮：`.nav-link[data-page="eyeball-adventure"]` 用绿色胶囊或绿色文字 + 下划线。
- 禁止：改变导航顺序 / href / data-page。

### 本地测试要求
- **TR rule**：`.navbar .nav-container > nav.nav-menu ul li` 顺序仍为 6 项，`眼球大冒险` 仍为 `data-page=eyeball-adventure`。
- **TR rule**：导航高亮存在绿色样式（color / background-color 任一）。
- **TR rubric**（阈值≥1.6）：导航玻璃质感（2=精致且不遮挡文字；1=可用；0=发灰/看不清）。

### 完成证据
- DevTools 下选中高亮项的 computed style 快照说明（文字记录即可）。

---

## Task 4：Hero 全新布局（Step 4-6）

**覆盖 AC**：AC04 / AC05 / AC06。
**优先级**：最高。
**状态**：pending。
**依赖**：Task 2 / Task 3。

### 任务说明
- 在 `<section class="ad-hero adv2-hero">` 内使用：左 copy 容器（45%）+ 右装饰层。
- Copy 容器中：
  1. 小胶囊标签「🎯 第一模块 · 冒险篇」。
  2. 主标题分两行，眼球→浅蓝白渐变 / 大冒险→金黄渐变，巨大但不超过 Hero 高 60%。
  3. 副标题一行。
  4. 5 个圆形玻璃节点横向排列，用细发光线串接。
  5. Hero 底部一行「⭐ 1280 积分」与「🧑‍🚀 眼球探索家 LV.2」。
- 右装饰层中：
  1. `.adv2-hero-scene-bg`：柔和蓝色+金色径向光晕 + 虚线轨道。
  2. 装饰星球/星：`island-eye-full.png` / `spaceship.png` / `rocket.png` / `star-big.png` 等。
  3. **小光仔**绝对定位：`right:6%; top:50%; transform:translateY(-50%); width: clamp(280px,34vw,420px); max-height:70%; object-fit:contain;`；原始 PNG 四角若有浅绿色背景，可用 `clip-path: inset(2% 3% 2% 3%)` 做温和去边（禁止 50% 圆形 / 禁止 cover）。
- 严格禁止出现 `.adventure-character` 那套"之前隐藏掉的"旧 180px 层，删除其 DOM 或置 `display:none !important`。

### 本地测试要求
- **TR rule**：Hero 高度（DevTools box-model）在闭区间 [420,540]。
- **TR rule**：Hero 中 xiaoguangzi img 的 CSS width 计算值 ∈[260,420] 且 computed max-height = 70%。
- **TR rule**：`computed style` 中该 img 不存在 `border-radius ≠0 / object-fit:cover / transform:scale(>1.05) / width>=100vw`。
- **TR rule**：左 Copy 宽度 ∈[40%,50%]。
- **TR rubric**（阈值≥1.8）：小光仔完整性与位置（2=全身右上，不挡文字与卡片；1=完整但略偏；0=裁切或大圆）。
- **TR rubric**（阈值≥1.6）：Hero 海报氛围（2=电影海报；1=普通首屏；0=拥挤）。

### 完成证据
- Hero 相关 CSS 覆盖片段；DOM 结构片段。
- 三个典型分辨率下的 Hero 高度与 img 计算宽度手动列表。

---

## Task 5：探索主区三栏（Step 7-8）

**覆盖 AC**：AC07 / AC08 / AC09。
**优先级**：最高。
**状态**：pending。
**依赖**：Task 4。

### 任务说明
- 使用新容器 `<section class="adv2-map ad-core">`（grid-template-columns: 250px 1fr 280px）。
- 左栏 250px：`.adv2-task-card` — 顶部小尺寸小光仔（≤120px）+ "嗨！我是小光仔~" 标题 + 三行提示正文（黄色标重点）。
- 中栏 flex:1：`.adv2-eye-stage` — 浅玻璃卡；内容包括：
  1. 中央眼球大图：`island-eye-full.png`（≤460px）或 `island-vision-full.png`，`object-fit:contain`，圆角不超过 28px。
  2. 5 个可点击 `.adv2-eye-node` 沿眼球探索路径，节点为圆玻璃按钮+编号+星星+名字（01角膜/02瞳孔/03晶状体/04视网膜/05视神经）。
  3. hover/active 放大 + 发光 + 下方小卡显示「对应科普文字」。
- 右栏 280px：`.adv2-reward-card sticky top:92px` — 奖励 3 项 + 进度 2/5 + 进度条 + 绿色按钮。
- 下方仍保留旧 `#advStepper` 与 `#advPartModal`（显示/隐藏逻辑未变）。

### 本地测试要求
- **TR rule**：DOM 中 3 个卡片容器（任务/眼球/奖励）存在且宽度计算为 250/≥600/280。
- **TR rule**：5 个节点均有 clickable 元素（button 或 `role=button`）且 aria-label 齐全。
- **TR rubric**（阈值≥1.6）：三栏布局平衡（2=呼吸空间好；1=略挤；0=重叠或巨空）。
- **TR rubric**（阈值≥1.6）：探索节点清晰（2=路径感强、易懂；1=够用；0=乱）。

### 完成证据
- 三栏截图快照的文字描述；节点列表（5 条）。

---

## Task 6：底部 4 小游戏卡片（Step 9）

**覆盖 AC**：AC09。
**优先级**：高。
**状态**：pending。
**依赖**：Task 5。

### 任务说明
- 容器 `<section class="adv2-games">`，标题「🎮 趣味小游戏 / 边玩边学，收获更多护眼知识！」。
- `grid-template-columns: repeat(4,1fr)`；四张玻璃卡片：
  - 编号 01~04；
  - 图标（优先 `rocket.png` / `gamepad.png` / `flask.png` / `character-fly.png` 等已有素材，或装饰性星球）；
  - 标题 + 简介一行；
  - 绿色渐变「开始游戏」按钮。
- 若旧的 `ad-games / ad-game` 已存在且与新网格冲突，则对旧容器用 `body.page-adventure` 作用域覆盖隐藏，并完全以新容器渲染。

### 本地测试要求
- **TR rule**：DOM 中存在 4 个编号分别为 01/02/03/04 的卡片，按钮可见。
- **TR rubric**（阈值≥1.6）：卡片精致度（2=绘本一致；1=普通；0=不统一）。

### 完成证据
- 小游戏 DOM 片段（4 张）。

---

## Task 7：UI 细节统一与响应式（Step 10）

**覆盖 AC**：AC06 / AC10 / R5。
**优先级**：高。
**状态**：pending。
**依赖**：Task 4 / 5 / 6。

### 任务说明
- 统一所有玻璃卡：`border-radius 20~28px；backdrop-filter blur 10-18；border rgba(255,255,255,.18) 或蓝/绿；shadow 0 10~35px rgba(0,0,0,.25)`。
- 绿色渐变按钮统一使用 `#78C943 → #A5E85A`；发光 box-shadow。
- 响应式断点：
  - ≥1600：最大内容宽 1500px；
  - 1280–1366：Hero 高 420–440；三栏缩为 `230 1fr 260`；小游戏 4 列；
  - ≤1120：小游戏 2 列；三栏：任务卡与奖励卡下堆叠成小两列；眼球区满宽；
  - ≤720：Hero 高 520–560（移动端）；小游戏单列；避免横向滚动。

### 本地测试要求
- **TR rule**：在 1280/1366/1440/1920 四档宽度中，`document.documentElement.scrollWidth <= window.innerWidth`（手动计算或通过临时脚本断言）。
- **TR rubric**（阈值≥1.6）：响应式鲁棒。

### 完成证据
- 四档宽度测试记录（宽度 / 内容宽 / 是否溢出）。

---

## Task 8：最终核对与回归

**覆盖 AC**：全部 AC + R1–R5。
**优先级**：高。
**状态**：pending。
**依赖**：Task 2–7。

### 任务说明
- 页面通过 `localhost` 打开，核对：
  1. 无巨圆人物；
  2. 导航高亮正确；
  3. Hero 右上小光仔：全身、contain、<Hero 70%；
  4. 三栏完整；
  5. 小游戏 4 卡全显示；
  6. 不出现 404 图片（network 面板）。
- 控制台检查是否有新增 JS 报错（与 main.js 中对旧类的查找失败）。

### 本地测试要求
- **TR rule**：Network 面板无 4xx。
- **TR rule**：Console 无报错（或仅旧有的警告，不新增）。
- **TR rubric**（阈值≥1.7）：绘本氛围 R1 评分。
- **TR rubric**（阈值≥1.8）：小光仔视觉正确度 R2。
- **TR rubric**（阈值≥1.6）：卡片一致性 R3。
- **TR rubric**（阈值≥1.6）：信息层级 R4。
- **TR rubric**（阈值≥1.6）：响应式 R5。

### 完成证据
- 本任务中逐条 rule/rubric 的证据记录：HTTP 200 / Console 0 报错 / 各分辨率不溢出。
- 用户答案清单：改哪些文件 / 哪些素材 / 小光仔尺寸定位 / 是否裁切 / 是否报错。

---
