# SEO 上线、提交与持续检查

本文档记录三语静态页面上线后的技术 SEO 检查和 Google Search Console 操作。它不是内容运营计划，
也不承诺排名或收录时间。

## 权威文件

| 事实 | 权威文件 |
| --- | --- |
| 页面路径、canonical、标题和摘要 | `frontend/src/content/seoPages.json` |
| 构建期三语 HTML 和隐私政策无脚本 fallback | `frontend/scripts/generate-locale-pages.mjs` |
| 爬虫规则 | `frontend/public/robots.txt` |
| Sitemap URL、`hreflang`、`lastmod` | `frontend/public/sitemap.xml` |
| 根路径跳转、未知路径 404、静态文件服务 | `scripts/deploy-remote.sh` 生成的 Caddyfile |

当前公开页面共有六个正式 URL：三语首页和三语隐私政策页。每个页面组都应在 HTML 中列出自身、
另外两个语言版本及 `x-default`；每个语言版本也应有自己的 canonical。Google 建议多语言内容使用
独立 URL，并通过 `hreflang` 声明本页和所有其他语言版本。

## 部署前构建检查

从仓库根目录运行：

```bash
npm --prefix frontend ci
npm --prefix frontend run build
```

检查构建产物，而不是只检查 React 运行时内容：

```bash
for page in \
  zh-hant/index.html zh-hans/index.html en/index.html \
  zh-hant/privacy/index.html zh-hans/privacy/index.html en/privacy/index.html
do
  test -f "frontend/dist/${page}" || exit 1
done

rg 'rel="canonical"|hreflang="zh-Hant"|hreflang="zh-Hans"|hreflang="en"|hreflang="x-default"' \
  frontend/dist/zh-hant/index.html \
  frontend/dist/zh-hans/index.html \
  frontend/dist/en/index.html
```

还应确认：

- `frontend/dist/index.html` 是带 `noindex, follow` 的兜底跳转页，不是另一个可索引首页；
- 三个隐私政策 HTML 含 `<noscript>` 正文，JavaScript 不可用时仍有可抓取内容；
- `robots.txt` 和 `sitemap.xml` 已由 Vite 从 `frontend/public/` 复制到 `frontend/dist/`；
- Sitemap 只包含 canonical URL，并使用完整的 `https://www.busiscoming.com/...` 绝对地址。

## 上线后验证

先验证状态码：

```bash
curl -I https://www.busiscoming.com/
curl -I https://www.busiscoming.com/zh-hant/
curl -I https://www.busiscoming.com/zh-hans/
curl -I https://www.busiscoming.com/en/
curl -I https://www.busiscoming.com/zh-hant/privacy/
curl -I https://www.busiscoming.com/zh-hans/privacy/
curl -I https://www.busiscoming.com/en/privacy/
curl -I https://www.busiscoming.com/not-a-real-page-for-seo-check
```

期望结果：

- `/` 以 301 或 308 永久跳转到 `/zh-hant/`；
- 六个正式页面均返回 200；
- 不存在的普通路径返回 404，不能回退成首页副本；
- 裸域名永久跳转到 `https://www.busiscoming.com` 的同一路径。

再检查公开的爬虫文件和关键标签：

```bash
curl -fsS https://www.busiscoming.com/robots.txt
curl -fsS https://www.busiscoming.com/sitemap.xml
curl -fsS https://www.busiscoming.com/zh-hant/ | \
  rg 'canonical|hreflang|og:url|name="description"'
```

`robots.txt` 应允许抓取并声明正式 Sitemap 地址。Sitemap 应包含六个正式页面，页面内的 canonical、
`hreflang` 和 Sitemap URL 必须使用同一 host、协议、路径大小写和尾斜线规则。

## Google Search Console 首次提交

1. 添加 Domain property `busiscoming.com`，按提示完成 DNS 验证。
2. 在 Sitemaps 中提交 `https://www.busiscoming.com/sitemap.xml`。
3. 用 URL Inspection 检查三语首页，以及至少一个隐私政策页作为第二类模板代表。
4. 先运行 live test，确认页面可抓取、没有 `noindex` 且 canonical 正确；再对重要 URL 请求编入索引。
5. 等待 Google 重新抓取，并在 Page indexing 报告中查看发现、抓取和索引状态。

提交 Sitemap 只是发现 URL 的提示，请求编入索引也不保证立即或最终收录。URL Inspection 的已索引数据
反映 Google 最近一次已知版本，live test 才反映当前可访问版本；排查时不要混用两者。

## 持续维护

出现以下变化时重新构建和检查：

- 新增、删除或更改语言路径；
- 修改 canonical host、协议或尾斜线规则；
- 首页或隐私政策发生实质内容更新；
- Caddy 路由、根路径跳转或 404 行为变化；
- `seoPages.json` 的页面组、标题或摘要变化。

Sitemap 的 `lastmod` 只应在对应页面发生实质变化时更新，不能每次构建都写当天日期。当前
`frontend/public/sitemap.xml` 仍统一记录 `2026-06-30`；它早于仓库内后续的隐私政策内容日期，需在
下一次 SEO 运行时内容维护中逐页核对和修正，不能把该日期继续当作自动生成事实。

若页面长期未收录，按顺序检查：HTTP 状态、robots/noindex、canonical、Google-selected canonical、
Sitemap 读取结果、抓取错误和页面实际可见内容。不要仅凭 Sitemap 已提交判断页面已经进入索引。

## 官方参考

- [Google：多语言网站与 `hreflang`](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google：创建和提交 Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google Search Console：URL Inspection](https://support.google.com/webmasters/answer/9012289)
