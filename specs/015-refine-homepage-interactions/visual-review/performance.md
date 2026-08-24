# 015 性能与资源复核

日期：2026-08-25

## 图片与加载

- 五故事 × zh/en × 540/720/1080 共 30 个唯一 WebP；manifest v3 保存源尺寸、输出尺寸、字节和 SHA。
- 两套源图均严格为 1080×1920；输出保持 9:16，不使用拉伸或语言回退。
- 前景图片 eager，其余图片 lazy；`srcSet`/`sizes` 让浏览器按 viewport 与 DPR 选择候选，不把 30 张最高分辨率同时解码。

## 动效与状态

- 五张手机常驻 DOM，只动画 transform、opacity 和轻 blur；不逐帧测量布局，也不引入通用动效库。
- 控制器只维护一个 dwell timer；新 epoch、pause 或 unmount 清理旧 timer/observer/listener。
- 文案切换是两个短生命周期视觉快照，业务真相仍只有 requested/settled story。
- reduced motion 停止自动轮播、风带和主要位移。

## 构建边界

最终 bundle 数字记录在 `final-validation.md`。monitoring 的既有大 chunk 提示不由本纯前端公开首页变更引入，也未将公开 Hero 代码混入 monitoring UI。
