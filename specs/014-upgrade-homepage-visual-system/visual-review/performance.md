# 014 性能与素材验证

日期：2026-08-24

## 响应式截图

- 五个故事均生成 540/720/1080 宽 WebP，共 15 个文件；manifest 保存源与每个衍生物的尺寸、字节数和 SHA-256。
- 固定 Chromium、DPR 1 下，390 与 1440 首屏的五张图 `currentSrc` 均选择 540w 候选；高分辨率候选保留给高 DPR/更大布局，未重复打包同一源文件。
- active 图片为 `loading=eager`、`fetchPriority=high`；其余四张为 `loading=lazy`、`fetchPriority=auto`。
- 手机外壳和舞台使用显式宽度、`aspect-ratio` 与固定舞台高度；第五张 1080×2400 截图使用 `object-fit: contain`，不拉伸。

## 构建与运行

- 公开 bundle：JS 238.65 kB（gzip 79.40 kB），CSS 38.83 kB（gzip 8.72 kB）。
- `qrcode.react` 是唯一新增运行依赖；未引入通用动效库，浏览器不调用第三方二维码服务。
- 故事切换只改变五个固定槽位的 transform/opacity/filter 与 z-index；不逐帧计算布局，不卸载图片。
- 风带只动画 transform/opacity/scale；reduced motion 下 animation-name 全部为 `none`。
- 视觉截图会等待字体、五图 decode、fixture 和 `data-transitioning=false`；故事轨与舞台有固定几何并由 Playwright 断言不覆盖。

## 已知构建提示

私有 monitoring bundle 仍有实施前已存在的 500 kB 警告；本功能未修改 monitoring 运行架构，也未把公开首页依赖引入 monitoring。
