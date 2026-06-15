# US1 视觉与交互核对

## 对照节点

- Desktop Homepage / 1440：Figma node `4:2`
- Mobile Homepage / 390：Figma node `4:183`
- Download Button Interaction States：Figma node `4:326`

## 核对点

- 首屏左侧包含 BusIsComing 品牌、香港巴士查询定位、主下载入口和在线查询次入口。
- 桌面端保持左侧产品说明、右侧 App 预览的平衡布局。
- 手机端采用单列结构，核心 CTA 优先，App 预览在首屏下半段可见。
- 下载按钮保留 default、Android 展开、iPhone 展开三种语义状态。
- 当前仓库未提供正式 APK，Android 展开状态显示下载资源待接入原因，不伪造可安装包。
- iPhone 展开状态始终不可下载。

## 浏览器证据

Playwright 会生成：

- `desktop-1440-hero.png`
- `mobile-390-hero.png`
