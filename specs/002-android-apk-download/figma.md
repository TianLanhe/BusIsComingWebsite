# Figma 设计引用：Android APK 下载

## 文件

- 文件名：BusIsComing Website - Homepage v1 Spec
- URL：https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU
- 版本来源：2026-06-15 v1 首页设计
- 本功能状态：复用既有下载按钮结构，不新增页面布局；实现版本已将 Android 状态改为当前 APK 可下载。

## 关键节点

| 节点 | Node ID | 用途 |
|------|---------|------|
| `01 Desktop Homepage / 1440` | `4:2` | 桌面首页首屏和下载入口布局基准 |
| `02 Mobile Homepage / 390` | `4:183` | 手机首页下载入口布局基准 |
| `03 Download Button Interaction States` | `4:326` | 下载按钮 default、Android 展开、iPhone 展开状态 |

## 本功能 UI 变化

- Android 状态从“下载资源待接入”改为“可下载”。
- Android 展开态显示简短元数据：`Android APK 1.0` 和约 `4.8 MB`。
- iPhone 展开态保持暂未支持和不下载。
- 不改变按钮结构、首屏布局、页面顺序、轮播或在线查询演示。

## 是否需要更新 Figma

计划阶段判断：不强制新建 Figma 文件。原因是交互结构和布局未变，现有 node `4:326` 已覆盖 Android 展开态语义；实现阶段只需要在视觉截图中证明文案替换后仍符合该状态。

如果实现阶段发现 `Android APK 1.0 / 4.8 MB` 在手机或桌面按钮内产生截断、遮挡或不自然换行，则需要补充一个可用态标注或更新 `03 Download Button Interaction States`，并在本文件记录新节点。

## 视觉验收

实现阶段至少保存以下截图：

1. 桌面首屏 Android 可下载展开态。
2. 手机首屏 Android 可下载展开态。
3. 桌面下载区 Android 可下载展开态。
4. iPhone 暂未支持展开态。

截图路径建议：

```text
specs/002-android-apk-download/visual-review/
├── desktop-1440-android-download.png
├── mobile-390-android-download.png
├── desktop-1440-download-section.png
└── iphone-unsupported-state.png
```

实现阶段版本说明：截图由 Playwright 在桌面 `1440x960` 与手机 `390x844` viewport 下生成，覆盖 Android 可下载展开态、下载区可下载元数据和 iPhone 暂未支持展开态。
