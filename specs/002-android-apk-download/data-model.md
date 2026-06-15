# 数据模型：Android APK 下载

## 当前 Android APK

**含义**：网站当前提供给用户下载的唯一 Android 安装包。

**字段**：

| 字段 | 类型 | 规则 |
|------|------|------|
| `platform` | string | 固定为 `android` |
| `appName` | string | 固定为 `BusIsComing` |
| `applicationId` | string | 当前为 `com.example.busiscoming` |
| `versionName` | string | 当前为 `1.0` |
| `versionCode` | number | 当前为 `1` |
| `fileName` | string | 当前为 `BusIsComing.apk` |
| `relativePath` | string | 指向服务端受管空间中的当前 APK，不暴露给浏览器 |
| `sourcePath` | string | 维护记录，当前来源为 Android 主项目 release APK，本字段不得下发给普通浏览器 UI |
| `sizeBytes` | number | 当前为 `5,009,547` |
| `sizeLabel` | localized string | 面向用户展示，当前约 `4.8 MB` |
| `sha256` | string | 64 位十六进制哈希 |
| `lastUpdated` | date | 当前 APK 元数据更新时间 |
| `status` | string | `available`、`missing`、`checksum-mismatch`、`unreadable` |

**验证规则**：

- `sizeBytes` 必须与实际文件大小一致。
- `sha256` 必须与实际文件内容 SHA-256 一致。
- `sourcePath` 只用于维护和验证记录，不得作为前端下载地址。
- 当前功能只允许一个当前 APK；不得在用户界面提供历史版本选择。

## 下载平台状态

**含义**：前端展示 Android 和 iPhone 两个平台的可下载状态。

| 字段 | 类型 | 规则 |
|------|------|------|
| `platform` | enum | `android` 或 `ios` |
| `status` | enum | `available`、`unsupported`、`temporarily-unavailable` |
| `label` | localized string | 三语平台名称 |
| `description` | localized string | 三语短状态 |
| `actionLabel` | localized string | 三语展开态主文案 |
| `downloadUrl` | string/null | Android 可用时为同源下载路径；iPhone 必须为 `null` |
| `disabledReason` | localized string/null | 不可用时必填；可用时为 `null` |
| `artifact` | 当前 Android APK/null | Android 可用时关联当前 APK 用户可见元数据；iPhone 为 `null` |

**状态规则**：

- Android `available` 时，`downloadUrl` 必须存在，`disabledReason` 必须为 `null`。
- Android `temporarily-unavailable` 时，`downloadUrl` 必须为 `null`，`disabledReason` 必须存在。
- iPhone 当前必须为 `unsupported`，且 `downloadUrl` 和 `artifact` 必须为 `null`。

## 下载 manifest

**含义**：前端和共享契约使用的下载状态总表。

| 字段 | 类型 | 规则 |
|------|------|------|
| `version` | string | manifest 版本，随下载资源变化更新 |
| `lastUpdated` | date | manifest 更新时间 |
| `platforms.android` | 下载平台状态 | Android 平台状态 |
| `platforms.ios` | 下载平台状态 | iPhone 平台状态 |

**关系**：

- `platforms.android.artifact` 引用当前 Android APK 的用户可见元数据。
- `platforms.ios.artifact` 始终为 `null`。

## 下载结果

**含义**：用户点击 Android 下载后得到的结果。

| 状态 | 含义 | 用户反馈 |
|------|------|----------|
| `success` | 返回当前 APK 文件 | 浏览器下载 `BusIsComing.apk` |
| `missing` | 当前 APK 不存在 | 显示下载资源暂不可用 |
| `unreadable` | 当前 APK 无法读取 | 显示下载资源暂不可用 |
| `checksum-mismatch` | 大小或 SHA-256 与元数据不一致 | 显示下载资源校验失败或暂不可用 |

**响应不变量**：

- 成功结果必须对应当前 Android APK。
- 失败结果不得返回部分 APK。
- 失败结果必须有机器可读错误码和维护者可定位的描述。

## 后端 DDD bounded context

**含义**：服务端围绕 Android APK 下载建立的 `downloads` bounded context。

| 层级 | 责任 | 允许依赖 | 禁止依赖 |
|------|------|----------|----------|
| `domain` | 表达当前 APK、APK 元数据、校验规则、下载结果和领域错误 | 标准语言能力、领域自身类型 | HTTP 框架、文件系统、数据库、前端契约 |
| `application` | 编排“下载当前 Android APK”用例，定义读取当前 APK 和计算校验的端口 | `domain` | Gin handler、具体文件路径、具体哈希实现 |
| `infrastructure` | 读取受管 APK、读取元数据、计算 SHA-256 | `application` 端口、`domain` 类型 | HTTP 请求/响应对象 |
| `interfaces` | 注册 HTTP 路由，转换请求、响应头和错误格式 | `application` 用例 | 文件读取规则和领域规则实现 |

**验证规则**：

- `domain` 包不得 import Gin、文件系统、数据库或前端契约包。
- 下载校验规则必须能在不启动 HTTP 服务的情况下单独测试。
- HTTP 错误码映射只能位于接口适配层，不能改变领域错误含义。

## UI 状态

**含义**：下载按钮的用户可见交互状态。

| 状态 | 触发 | 下载行为 |
|------|------|----------|
| `default` | 初始、鼠标离开、失焦 | 不自动下载 |
| `android-expanded` | hover、focus 或触控 Android | 点击可下载当前 APK |
| `iphone-expanded` | hover、focus 或触控 iPhone | 不下载 |

**不变量**：

- 语言切换不改变平台状态。
- iPhone 任何状态都不触发 APK 下载。
- Android 可用态展示版本和大小，但不展示完整 SHA-256。
