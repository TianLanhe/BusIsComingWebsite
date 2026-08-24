# US3 验收：双端下载决策

日期：2026-08-25

## 结论

通过。桌面 Hero 下载始终进入 `#download`，手机仅在 metadata ready 时直接下载 APK；两者与第三屏二维码最终收敛到同一个已校验 `metadata.downloadUrl`。

## 状态与语义

- desktop 使用 `(min-width: 821px)`，Hero 行动为普通 `#download` 链接且无 `download` 属性。
- mobile ready 使用真实 APK href 和 `download` 文件名；checking/unavailable 为禁用按钮，不暴露伪造地址。
- desktop ready 只显示一个本地生成的真实二维码；手机不显示二维码。
- 版本资料只显示版本、Android 7.1+ 和本地化约数大小；`lastUpdated` 即使存在于后端 metadata 也不会渲染。
- 三语、checking/ready/unavailable 与 reduced motion 锚点均由单元/E2E 覆盖。

## Figma 差异说明

下载区几何与 Figma reference 对齐。浏览器 actual 使用真实二维码和正式安装说明；Figma 中的示意二维码块及 `metadata.downloadUrl` 注释不属于生产文案，因此不复制到网站。
