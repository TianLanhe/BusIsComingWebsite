# Quickstart：隐私政策页面验证

**功能**：隐私政策页面  
**日期**：2026-06-30  
**适用阶段**：实现完成后验证、提交前检查、部署后 GSC 操作

## 1. 进入工作区并检查状态

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite
git status --short
```

确认只包含本功能相关变更。

## 2. 规格产物检查

```bash
rg -n "NEEDS[ ]CLARIFICATION|FEATURE[ ]NAME|ARGUMENTS|TO[ ]?DO|模板占位" specs/008-privacy-policy-pages \
  --glob '!**/checklists/**' \
  --glob '!**/quickstart.md'
git diff --check
```

期望：

- 不存在未处理的规格占位符。
- 没有尾随空格或补丁格式问题。

## 3. 单元与内容契约测试

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/frontend
npm run test -- i18n-completeness.test.tsx content-contract.test.ts seo-routing.test.tsx privacy-policy-page.test.tsx
```

期望覆盖：

- 三语隐私正文、摘要卡、章节数量完整。
- `zh-Hant`、`zh-Hans`、`en` 文案 key 无缺失。
- 隐私页不显示语言切换控件。
- footer 当前语言隐私链接存在。
- privacy 页面组 canonical、hreflang、description 与首页分离。

## 4. 构建验证

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/frontend
npm run build
test -f dist/zh-hant/privacy/index.html
test -f dist/zh-hans/privacy/index.html
test -f dist/en/privacy/index.html
test -f dist/sitemap.xml
```

期望：

- 构建成功。
- 三个隐私页静态 HTML 产出。
- sitemap 复制或生成到 `dist/sitemap.xml`。

## 5. 浏览器端验证

启动开发服务：

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/frontend
npm run dev -- --port 5185 --strictPort
```

人工检查：

- `http://localhost:5185/zh-hant/privacy/`
- `http://localhost:5185/zh-hans/privacy/`
- `http://localhost:5185/en/privacy/`

桌面 1440px 和手机 390px 都要检查：

- 首屏标题、范围说明、更新时间清晰可读。
- 4 个摘要卡顺序正确。
- 5 个章节完整。
- 不显示语言切换控件。
- 返回首页链接指向当前语言首页。
- footer 隐私入口存在且当前语言正确。
- 没有横向滚动、文字遮挡或按钮文字溢出。

## 6. Playwright 回归

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/frontend
npm run test:e2e -- privacy-policy-pages.spec.ts homepage-sections.spec.ts
```

期望：

- 三个隐私 URL 返回页面内容。
- 桌面和手机截图中的隐私页非空、无遮挡。
- 首页现有核心 section 不因 footer 和 SEO 改造回退。

## 7. sitemap 与 SEO 本地抽查

```bash
cd /Users/jianglijie/Documents/BusIsCommingWebsite/frontend
rg -n "https://www.busiscoming.com/(zh-hant|zh-hans|en)/privacy/" public/sitemap.xml
rg -n "hreflang=.*privacy|canonical.*privacy|Privacy|私隱|隐私" dist/zh-hant/privacy/index.html dist/zh-hans/privacy/index.html dist/en/privacy/index.html
```

期望：

- sitemap 包含三语隐私页。
- 三个隐私页 HTML 包含各自 canonical 与 hreflang。
- 隐私页 description 不复用首页过期描述。

## 8. 部署后 Google Search Console 操作

部署到线上后，在 Google Search Console 执行：

1. 进入 `https://www.busiscoming.com/` 对应资源。
2. 打开 `Sitemaps`。
3. 提交或重新提交 `https://www.busiscoming.com/sitemap.xml`。
4. 打开 `URL inspection`，分别检查：
   - `https://www.busiscoming.com/zh-hant/privacy/`
   - `https://www.busiscoming.com/zh-hans/privacy/`
   - `https://www.busiscoming.com/en/privacy/`
5. 如果页面可抓取，点击 `Request indexing`。
6. 几天后在 `Pages` 和 `International targeting` 相关报告中观察索引、canonical 和 hreflang 是否正常。

## 9. 交付前结论模板

提交前应记录：

```text
已验证：
- npm run test -- i18n-completeness.test.tsx content-contract.test.ts seo-routing.test.tsx privacy-policy-page.test.tsx
- npm run build
- npm run test:e2e -- privacy-policy-pages.spec.ts homepage-sections.spec.ts
- git diff --check

未执行：
- 如有未执行命令，写明原因。
```
