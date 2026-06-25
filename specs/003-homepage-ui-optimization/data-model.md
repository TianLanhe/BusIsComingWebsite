# 数据模型：首页 UI 优化

## 核心功能展示项 `FeatureShowcaseItem`

首页首屏右侧外层自动轮播的一个功能主题。

| 字段 | 类型 | 规则 |
|------|------|------|
| `id` | string | 稳定 ID；固定为 `favorite-citybus-routes`、`route-comparison`、`eta-details`、`predeparture-monitor` 之一 |
| `order` | integer | 1-4，决定外层自动轮播顺序 |
| `title` | `LocalizedString` | 三语标题；`zh-Hant` 独立香港文案 |
| `description` | `LocalizedString` | 三语说明；不得暗示覆盖九巴或其他交通方式 |
| `gallery` | `ScreenshotGallery` | 该功能点的截图图集 |
| `sourceReference` | string | Android 主项目文档、规格或截图来源 |
| `autoCarouselEligible` | boolean | 必须为 `true`，表示该功能点参与外层轮播 |

### 验证规则

- 必须且只能有 4 个展示项。
- `order` 不得重复。
- 外层轮播按 `order` 固定顺序循环。
- 展示项标题和说明必须覆盖 `zh-Hant`、`zh-Hans`、`en`。

## 截图图集 `ScreenshotGallery`

归属于单个核心功能展示项的一组脱敏截图。

| 字段 | 类型 | 规则 |
|------|------|------|
| `featureId` | string | 关联 `FeatureShowcaseItem.id` |
| `images` | `SanitizedScreenshot[]` | 至少 1 张 |
| `defaultImageId` | string | 必须指向序号或文件名为 `1` 的主图 |
| `manualOnly` | boolean | 必须为 `true`，同组截图不得自动轮播 |
| `hideStackWhenSingleImage` | boolean | 必须为 `true` |

### 状态转换

| 当前状态 | 触发 | 下一状态 |
|----------|------|----------|
| `mainImage = defaultImageId` | 用户首次看到功能点 | 主图保持序号 1 |
| `mainImage = A` | 用户选择堆叠中露出的 `B` | `mainImage = B`，`A` 回到堆叠层 |
| `images.length = 1` | 用户查看功能点 | 不显示堆叠切换目标 |

## 脱敏截图 `SanitizedScreenshot`

可进入前端展示的真实 App 截图副本。

| 字段 | 类型 | 规则 |
|------|------|------|
| `id` | string | 稳定 ID，建议包含功能点和顺序 |
| `sourcePath` | string | 项目内截图资产路径，例如 `frontend/src/assets/app-screenshots/real/home-favorites-results.png` |
| `assetPath` | string | 脱敏后前端资产路径，例如 `frontend/src/assets/app-screenshots/real/home-favorites-results.png` |
| `order` | integer | 同组顺序；1 为主图 |
| `isDefault` | boolean | 只有序号 1 为 `true` |
| `desensitizationStatus` | enum | `pending`、`approved`、`rejected` |
| `redactedItems` | string[] | 已替换或遮蔽的信息类别 |
| `retainedItems` | string[] | 必须包含价格、时间、ETA 数值相关说明 |
| `alt` | `LocalizedString` | 三语替代文本，不包含真实地点或路线号 |

### 验证规则

- `desensitizationStatus` 为 `approved` 前不得被前端引用。
- `redactedItems` 至少覆盖真实地点、站名、路线号、搜索记录和手机系统无关内容。
- `retainedItems` 必须说明价格、时间、ETA 数值已保留。
- 前端不得导入项目外原始截图路径。

## 下载入口状态 `DownloadEntryState`

首屏与下载区共享的 Android 下载展示状态。

| 字段 | 类型 | 规则 |
|------|------|------|
| `placement` | enum | `hero` 或 `download-section` |
| `primaryActionLabel` | `LocalizedString` | 三语文案；首屏表达直接下载 Android APK |
| `downloadUrl` | string | 继续使用 `/api/downloads/android/latest` |
| `artifactMeta` | object | 版本、大小标签；普通 UI 不展示完整 SHA-256 |
| `iphoneStatus` | `LocalizedString` | 低权重显示 iPhone 暂未支持 |
| `failureMessage` | `LocalizedString` | 下载失败或暂不可用提示 |
| `fallbackAction` | boolean | 下载区可有备用下载入口；不得导向 iPhone |

### 状态转换

| 当前状态 | 触发 | 下一状态 |
|----------|------|----------|
| `idle` | 用户触发 Android 下载 | 浏览器开始请求 `/api/downloads/android/latest` |
| `idle` | 下载 API 不可用或失败 | `failed`，在原位展示失败提示 |
| `failed` | 用户重试 Android 下载 | 再次请求同一 Android 下载路径 |

## 本地化文案项 `LocalizedCopyItem`

一个用户可见文案单元。

| 字段 | 类型 | 规则 |
|------|------|------|
| `key` | string | 稳定内容 key |
| `meaning` | string | 业务含义，方便审查 |
| `zh-Hant` | string | 独立香港书面语文案 |
| `zh-Hans` | string | 简体中文文案 |
| `en` | string | 英文文案 |
| `reviewStatus` | enum | `draft`、`reviewed` |

### 验证规则

- 三语都不能为空。
- `zh-Hant` 不得只是 `zh-Hans` 的单纯字形转换。
- Citybus、ETA、APK、HK$ 等领域术语保持准确。

## 访问入口 `AccessEndpoint`

开发、验收或正式部署时访问网站的入口。

| 字段 | 类型 | 规则 |
|------|------|------|
| `context` | enum | `frontend-dev`、`frontend-preview`、`backend-api`、`production-http` |
| `host` | string | 开发与预览支持 `0.0.0.0` 或等价所有接口监听 |
| `port` | integer | 开发默认可为 5173/8080；正式 HTTP 入口可由 80、反向代理或端口映射提供 |
| `publicReachability` | enum | `same-lan`、`standard-http` |
| `securityNote` | string | 不暗示把开发服务公开暴露到公网 |

### 验证规则

- 同一局域网设备必须能通过开发机 IP 访问前端并触达下载入口。
- 正式部署入口不得要求用户使用 `localhost`、`127.0.0.1` 或 `::1`。
- 监听地址调整不得改变下载 API 路径或错误语义。

## 关系图

```text
HomePageContent
├── DownloadEntryState(hero)
├── FeatureShowcaseItem[4]
│   └── ScreenshotGallery
│       └── SanitizedScreenshot[1..n]
├── FeatureItem[6]
│   └── hkd-display 文案强调多程全程总车费
├── LocalizedCopyItem[*]
└── AccessEndpoint[*]
```

## 生命周期

1. 截图资产进入 `frontend/src/assets/app-screenshots/real/`，作为前端可引用的项目内资产。
2. 实施阶段生成或确认可展示截图与 manifest。
3. `FeatureShowcaseItem` 引用 `approved` 的脱敏截图。
4. 页面加载后展示默认功能点和默认主图。
5. 外层功能点按时间自动轮播，用户交互时暂停。
6. 同组截图只响应用户手动选择。
7. 语言切换更新文案但保留当前功能点和主图状态。
8. 本地或正式入口只影响访问方式，不改变首页内容和下载 API。
