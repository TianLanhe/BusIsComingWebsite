# 三语文案审校：Android APK 下载入口

## 状态文案

| 语义 | `zh-Hant` | `zh-Hans` | `en` |
|------|-----------|-----------|------|
| 检查中 | 正在檢查下載… | 正在检查下载… | Checking download… |
| 可用动作 | 下載 Android APK | 下载 Android APK | Download Android APK |
| 不可用 | Android APK 暫時未能下載 | Android APK 暂时无法下载 | Android APK is temporarily unavailable |
| 可用详情 | 版本 {version} · {size} | 版本 {version} · {size} | Version {version} · {size} |

## `zh-Hant` 审校

- 使用香港产品页面常见的“下載”“暫時未能”，不使用偏书面或内地化的“无法获取资源”。
- “APK”与“Android”保留产品/技术原文，不硬译。
- 检查中短句直接说明当前动作，不使用“正在初始化下载流程”等冗长技术表达。
- 不把 metadata、Blob、校验等内部概念暴露给普通访问者。

## `en` 审校

- 使用短而自然的 “Checking download…” 和 “Download Android APK”。
- 不使用逐字翻译的 “Download is being checked”。
- 不可用状态说明当前事实，不承诺具体恢复时间，也不使用过分正式的 “We regret to inform you”。
- 版本详情使用 “Version” 而非中式 “Edition”。

## 一致性规则

- 三语表达同一状态和可操作性，不允许某一语言在 unavailable 中暗示可以重试点击。
- 动态版本和大小只在 ready 展示。
- iPhone 文案保持现有三语内容，不纳入本次改写。
- 辅助技术标签与可见动作一致，不额外宣称浏览器已经完成下载。

## Phase 5 实施回填（2026-07-30）

- 已以三语组件测试逐一确认 checking、ready、unavailable 的可见文案与 accessible name；ready
  的 accessible name 仅为动作本身，动态版本/大小通过 `aria-describedby` 作为辅助说明保留。
- `zh-Hant` 继续使用“正在檢查下載”“下載”“暫時未能下載”，符合香港产品页面的简洁实用语气；
  `en` 保持 “Checking download…”、“Download Android APK” 与 “temporarily unavailable”，没有引入
  逐字翻译或过度承诺。
- 动态版本/大小只在 ready 渲染；checking 与 unavailable 没有版本或大小。Hero 与 Download Section
  分别保留 `homepageContent.ts` 中既有的三语 iPhone 只读文案；三个语言、两个区域均没有 iPhone
  link 或 button。
- 1440 与 390 的英文 visual E2E 已检查状态、版本/大小和 OpenAPI 允许的 64 字符 `versionName`
  没有裁切、重叠或横纵溢出；两处 ready 链接均可键盘聚焦并有 3px 可见焦点轮廓。
