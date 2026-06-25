# BusIsComing 首次 SEO 提交指引

本指引用于首次 SEO 基础优化上线后，完成 Google Search Console 的提交和索引状态观察。

## 上线后先确认

在提交搜索后台前，先确认以下公开地址返回正确内容：

```bash
curl https://www.busiscoming.com/robots.txt
curl https://www.busiscoming.com/sitemap.xml
curl -I https://www.busiscoming.com/not-a-real-page-for-seo-check
```

期望结果：

- `robots.txt` 返回爬虫规则，并包含 `Sitemap: https://www.busiscoming.com/sitemap.xml`。
- `sitemap.xml` 返回 XML 站点地图，并包含 `https://www.busiscoming.com/`。
- 不存在的普通路径不要返回可索引的首页副本。

## Google Search Console 操作

1. 打开 Google Search Console。
2. 添加域名资源 `busiscoming.com`。
3. 按 Google 提示完成 DNS 验证。
4. 在 Sitemaps 中提交 `https://www.busiscoming.com/sitemap.xml`。
5. 在 URL Inspection 中检查 `https://www.busiscoming.com/`。
6. 确认页面可抓取后，请求编入索引。

## 后续观察

首次提交后不要立即判断失败。新站可能需要数天才进入稳定抓取和索引队列。维护者应观察以下状态：

- Discovered：Google 已发现 URL。
- Crawled：Google 已抓取 URL。
- Indexed：Google 已编入索引。

如果首页长时间未进入 Indexed，优先复查 `robots.txt`、`sitemap.xml`、首页正式地址、服务器状态码和 Search Console 的具体错误原因。
