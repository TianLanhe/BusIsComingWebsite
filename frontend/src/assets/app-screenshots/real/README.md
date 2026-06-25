# 真实 App 截图资产

本目录保存首页功能轮播使用的项目内真实 App 截图资产。`manifest.json` 中的 `sourcePath` 与 `outputPath` 都必须指向 `frontend/src/assets/app-screenshots/real/` 下的项目内文件，不能引用项目外目录。

规则：

- 每个功能点按 manifest 中的 `featureId` 分组。
- `isDefault: true` 的图片作为该功能点主图。
- 图片必须是用户确认可展示的真实 App 截图或已脱敏副本。
- 若后续使用包含隐私或不应公开信息的原始截图，先复制到本项目资产目录或生成可展示副本，再更新 `manifest.json`。
