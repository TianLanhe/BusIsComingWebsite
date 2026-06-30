import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const distRoot = path.join(frontendRoot, "dist");
const seoConfigPath = path.join(frontendRoot, "src", "content", "seoPages.json");

const seoConfig = JSON.parse(await readFile(seoConfigPath, "utf8"));
const sourceHtml = await readFile(path.join(distRoot, "index.html"), "utf8");
const homePageGroup = seoConfig.pages.home;

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function alternateLinksHtml(pageGroup) {
  const links = Object.entries(pageGroup.locales).map(
    ([locale, page]) =>
      `    <link rel="alternate" hreflang="${escapeHtmlAttribute(locale)}" href="${escapeHtmlAttribute(page.canonical)}" />`,
  );
  links.push(`    <link rel="alternate" hreflang="x-default" href="${escapeHtmlAttribute(pageGroup.xDefault)}" />`);
  return links.join("\n");
}

function replaceMeta(html, selector, replacement) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`    <meta(?=[^>]*${escapedSelector})[^>]*>`);
  if (!pattern.test(html)) {
    throw new Error(`Missing meta tag for ${selector}`);
  }
  return html.replace(pattern, replacement);
}

function renderPageHtml(pageGroup, page) {
  let html = sourceHtml;

  html = html.replace(/<html lang="[^"]*">/, `<html lang="${escapeHtmlAttribute(page.htmlLang)}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtmlAttribute(page.title)}</title>`);
  html = replaceMeta(
    html,
    'name="description"',
    `    <meta\n      name="description"\n      content="${escapeHtmlAttribute(page.description)}"\n    />`,
  );
  html = html.replace(
    /    <link rel="canonical" href="[^"]*" \/>(?:\n    <link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>)*\n?/,
    `    <link rel="canonical" href="${escapeHtmlAttribute(page.canonical)}" />\n${alternateLinksHtml(pageGroup)}\n`,
  );
  html = replaceMeta(
    html,
    'property="og:url"',
    `    <meta property="og:url" content="${escapeHtmlAttribute(page.canonical)}" />`,
  );
  html = replaceMeta(
    html,
    'property="og:title"',
    `    <meta property="og:title" content="${escapeHtmlAttribute(page.ogTitle)}" />`,
  );
  html = replaceMeta(
    html,
    'property="og:description"',
    `    <meta\n      property="og:description"\n      content="${escapeHtmlAttribute(page.ogDescription)}"\n    />`,
  );
  html = replaceMeta(
    html,
    'name="twitter:title"',
    `    <meta name="twitter:title" content="${escapeHtmlAttribute(page.twitterTitle)}" />`,
  );
  html = replaceMeta(
    html,
    'name="twitter:description"',
    `    <meta\n      name="twitter:description"\n      content="${escapeHtmlAttribute(page.twitterDescription)}"\n    />`,
  );

  return html;
}

function renderRootRedirectHtml() {
  const defaultPath = homePageGroup.locales[seoConfig.defaultLocale].path;
  const defaultUrl = homePageGroup.locales[seoConfig.defaultLocale].canonical;
  return `<!doctype html>
<html lang="${escapeHtmlAttribute(homePageGroup.locales[seoConfig.defaultLocale].htmlLang)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, follow" />
    <meta http-equiv="refresh" content="0; url=${escapeHtmlAttribute(defaultPath)}" />
    <link rel="canonical" href="${escapeHtmlAttribute(defaultUrl)}" />
${alternateLinksHtml(homePageGroup)}
    <title>${escapeHtmlAttribute(homePageGroup.locales[seoConfig.defaultLocale].title)}</title>
    <script>
      window.location.replace(${JSON.stringify(defaultPath)});
    </script>
  </head>
  <body>
    <p><a href="${escapeHtmlAttribute(defaultPath)}">Continue to BusIsComing</a></p>
  </body>
</html>
`;
}

for (const pageGroup of Object.values(seoConfig.pages)) {
  for (const page of Object.values(pageGroup.locales)) {
    // 每个页面组独立生成，避免 privacy 页面误用首页 canonical 或 hreflang。
    const localeDir = path.join(distRoot, page.path);
    await mkdir(localeDir, { recursive: true });
    await writeFile(path.join(localeDir, "index.html"), renderPageHtml(pageGroup, page), "utf8");
  }
}

await writeFile(path.join(distRoot, "index.html"), renderRootRedirectHtml(), "utf8");
