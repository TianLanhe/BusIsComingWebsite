# Figma 设计引用：统一 Android APK 下载入口

## 文件

- 本功能独立 Draft：
  [BusIsComing Website - APK Download Alignment 013](https://www.figma.com/design/ZYMXnKWg4BNybwbuN6TeiZ)
- 既有主页设计基线：
  [Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)
- 既有下载交互状态节点：
  [`4:326`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=4-326)

## 版本

- 目标版本：`v1.4`
- 日期：2026-07-30
- Feature：`013-unify-apk-download`

## 当前交付状态

连接账号 `hezhenyu966@gmail.com` 在现有团队是 `View` 席位。已成功创建独立 Draft，但
`use_figma`、网页捕获和资产上传均返回写入拒绝，因此本阶段没有伪造不存在的节点 ID。

已经完成、可直接导入的视觉源：

- [HTML 状态板](./prototype/index.html)
- [桌面 1440 截图](./prototype/desktop-1440.png)
- [手机 390 截图](./prototype/mobile-390.png)

## 待导入节点结构

获得 Figma Edit 权限后，必须按以下名称导入并回填真实节点 ID：

| 目标节点名 | 内容 | 节点 ID |
|------------|------|---------|
| `013 / APK Download Alignment / v1.4` | 总状态板 | 待回填 |
| `Desktop / CHECKING / 1440` | 桌面检查中，顶部与中下部 | 待回填 |
| `Desktop / AVAILABLE / 1440` | 桌面可用，两个原生下载入口 | 待回填 |
| `Desktop / UNAVAILABLE / 1440` | 桌面不可用，两个禁用入口 | 待回填 |
| `Mobile / CHECKING / 390` | 手机检查中 | 待回填 |
| `Mobile / AVAILABLE / 390` | 手机可用 | 待回填 |
| `Mobile / UNAVAILABLE / 390` | 手机不可用 | 待回填 |
| `Three-locale Copy` | 三语状态文案 | 待回填 |
| `Interaction Contract` | metadata → state → native download | 待回填 |

## 交互规则

1. 页面载入时只有 metadata 请求，不请求 APK。
2. checking 和 unavailable 中两个 Android 入口都不可操作。
3. available 中两个入口视觉位置不同，但都使用同一稳定地址与文件名。
4. 点击 available 入口后交给浏览器下载管理器，页面不出现进度。
5. 三态切换保持近似尺寸，不造成内容跳动。
6. iPhone 只读状态保持不变。

## 实施阻塞条件

前端 UI 实现可以编写测试和共享契约，但在以下条件满足前不得把视觉实现标记完成：

- 有 Edit 权限的 Figma 连接完成状态板导入；
- 本文件回填上述节点 ID；
- 对根节点和 1440/390 available 状态生成 Figma screenshot；
- 截图中无裁切、重叠、占位文案或与本地原稿明显不一致。
