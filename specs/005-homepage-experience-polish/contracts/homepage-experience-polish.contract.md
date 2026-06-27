# UI 契约：首页体验精修

## 适用范围

本契约覆盖首页首屏功能轮播、品牌 logo、联系入口、全站三语文案、响应式布局、Figma 设计和视觉验收。实现可以调整组件命名，但不得改变以下用户可见不变量。

## 功能轮播

| 项 | 契约 |
|----|------|
| 自动切换间隔 | 约 3 秒切换一次，10 秒内至少切换 2 次 |
| 自动切换范围 | 只在 4 个功能页之间切换：常用路线、路线比较、抵站时间 / 路线详情、出门前监测 |
| 主视觉 | 任一时刻只有一个主手机截图作为视觉焦点 |
| 同场景多图 | 使用低旋转阶梯牌堆展示；后方最多两张图露出、可点击、透明度足够辨识 |
| 牌堆基线 | 后方截图底部不得低于主图底部；桌面约 5 度旋转，手机可收敛到约 4 度 |
| 手动切换 | 手机触控左右滑动、桌面鼠标或触控板拖动只切换功能场景 |
| 场景点点 | 必须可点击，并直接切换到对应功能场景 |
| 可访问切换 | 键盘或读屏用户可切换上一项/下一项功能，视觉上不得出现抢占式常驻箭头 |
| 暂停规则 | hover、focus、drag、touch 期间暂停自动切换 |
| 减少动态效果 | `prefers-reduced-motion: reduce` 下停止或弱化自动动画，但保留手动查看能力 |
| 状态保持 | 切换语言后保留当前功能页，不重置为第一项 |

## 轮播禁止形态

以下形态不得出现在桌面或手机截图中：

- 主图底部小图堆叠
- 右下角或侧边胶片条
- 缩略图按钮组
- 上下图片堆叠
- 传统常驻左右箭头
- `01`、`02`、`03`、`04` 等编号装饰

## 单图与多图规则

| 场景 | 契约 |
|------|------|
| 单图功能页 | 只显示主图，不显示后方牌堆或更多图片暗示 |
| 多图功能页 | 显示主图和最多两张后方牌堆图；后方图露出部分必须可点击 |
| 同组截图 | 只通过点击后方牌堆图切换主图；不自动逐张乱跳，不通过缩略图切换，不通过场景滑动切换 |

## 品牌 logo

| 项 | 契约 |
|----|------|
| 来源 | Android 主项目 `app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png` 或等价 foreground 资源 |
| 输出 | 透明背景品牌资产，建议放在 `frontend/src/assets/brand/` |
| 裁切 | 只保留中间巴士主体和必要安全边距 |
| 禁止 | 不得使用 launcher 背景底板、渐变背景、圆角底板或 lucide 线框巴士作为品牌 logo |
| 位置 | Header 和 footer 使用同一 logo 口径；favicon 可使用同源适配版本 |

## 联系入口

| 项 | 契约 |
|----|------|
| 导航标签 | `zh-Hant`: `聯絡我們`；`zh-Hans`: `联系我们`；`en`: `Contact Us` |
| 邮箱 | 用户可见邮箱为 `hezhenyu966@gmail.com` |
| 链接 | `mailto:hezhenyu966@gmail.com` |
| 禁止 | 不得出现 `feedback@busiscoming.local`；不得保留“支持我们 / Support”联系语义 |

## 文案与 i18n

- 所有用户可见文字必须覆盖 `zh-Hant`、`zh-Hans`、`en`。
- `zh-Hant` 必须按香港实用书面语独立撰写，不得只做字形转换、机械直译或逐句搬运。
- `en` 必须使用自然克制的英语产品表达，不得采用中文句式直译。
- `zh-Hans` 必须使用自然简体中文；三语必须保持同一产品事实和范围边界。
- 三语文案不得过度口语化，也不得过分官方严肃。
- 关键交通词汇优先贴近香港交通产品语境，例如「抵站時間」「行程時間」「交通費用」「一按查詢」「聯絡我們」。
- 页面必须继续明确当前聚焦 Citybus / 城巴，不支持九巴、港铁、铁路、渡轮、其他非城巴交通或完整出行规划。
- 图片 alt 和 aria 文案不得遗漏三语，也不得泄露真实地点、站名或路线号。

## 响应式布局

| 视口 | 契约 |
|------|------|
| 桌面 1440px | Header、hero、轮播、下载入口和联系入口完整可见；轮播主图和左右预览不遮挡文案 |
| 手机 390px | 轮播和文案上下组织；滑动区域可触控；header logo、语言切换和主要操作不重叠 |
| 窄屏 | 文字可换行；不得用 viewport 宽度直接缩放字体导致不可读 |

## Figma 设计

- 目标文件：`https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU`
- 本阶段生成本地插件 `specs/005-homepage-experience-polish/figma-plugin/`。
- 插件必须生成或更新以下设计节点：
  - `Homepage Experience Polish - 005 / Desktop 1440 / Stair Card Deck`
  - `Homepage Experience Polish - 005 / Mobile 390 / Stair Card Deck`
  - `Homepage Experience Polish - 005 / Carousel States / Scene Dots and Deck Click`
  - `Homepage Experience Polish - 005 / Brand Contact States`
  - `Homepage Experience Polish - 005 / Spec Notes`
- 插件运行后必须把实际 node ID 回填到 `figma.md` 或后续 tasks。

## 视觉验收

实现完成必须保存下列截图到 `specs/005-homepage-experience-polish/visual-review/`：

- `desktop-1440-carousel-rail.png`
- `mobile-390-carousel-rail.png`
- `desktop-1440-brand-contact.png`
- `mobile-390-brand-contact.png`

每张截图的验收记录必须说明：

- 后方牌堆底部不低于主图底部，且露出部分可点击、可辨识
- 没有底部缩略图堆叠
- 没有编号装饰
- 没有常驻左右箭头
- logo 使用真实透明主体
- 邮箱为 `hezhenyu966@gmail.com`
- 主要文字无重叠、无截断
