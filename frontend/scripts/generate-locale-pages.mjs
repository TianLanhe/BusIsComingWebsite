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
const privacyFallbackContent = {
  "zh-Hant": {
    title: "BusIsComing 私隱政策",
    lead:
      "本政策適用於 BusIsComing Android App 及 busiscoming.com 官方網站，說明我們為城巴查詢、網站試查、通知監測和語音提醒所需處理的資料。",
    lastUpdatedLabel: "最後更新",
    contactLabel: "聯絡電郵",
    summaryLabel: "私隱摘要",
    summary: [
      "BusIsComing 不要求註冊或登入，也不建立可識別個人身份的帳戶資料。",
      "我們不為廣告追蹤使用資料，也不出售資料。",
      "App 內收藏路線、常用起點和目的地以你的裝置本機保存為主。",
      "城巴、DATA.GOV.HK 和 Google Geocoding API 只會在相關功能需要時使用。",
    ],
    sections: [
      {
        title: "適用範圍",
        paragraphs: [
          "本私隱政策適用於 BusIsComing Android App、busiscoming.com 官方網站，以及未來可由 App 或 Google Play 指向的公開私隱政策頁面。",
          "BusIsComing 的核心用途是香港城巴查詢、常用路線管理和出門前抵站時間參考。本頁不代表新增完整出行規劃或其他交通工具查詢服務。",
        ],
      },
      {
        title: "我們不收集甚麼",
        paragraphs: [
          "BusIsComing 不設帳戶系統，不要求你註冊或登入，也不建立姓名、電話、電郵或其他可識別身份的帳戶資料。",
          "我們不為廣告追蹤收集資料，不出售資料，也不把你的查詢內容用作建立廣告受眾。",
        ],
      },
      {
        title: "功能必需的資料如何處理",
        paragraphs: [
          "為完成城巴查詢，App 或網站試查可能會處理你選擇或輸入的起點、目的地、路線、站點、查詢條件和裝置權限狀態。這些資料用於返回路線、車費、步行距離和 ETA 等結果。",
          "App 內收藏路線、常用起點和目的地以裝置本機保存為主。通知監測和語音提醒只圍繞你選擇的路線、站點或 ETA 提醒運作。",
        ],
      },
      {
        title: "第三方服務",
        paragraphs: [
          "BusIsComing 會按功能需要使用 Citybus 和 DATA.GOV.HK 的公開交通資料來源，以提供城巴路線、站點、車費或抵站時間相關結果。",
          "當你使用目前位置或地址解析功能時，GPS 坐標或地址查詢可能會發送給 Google Geocoding API，用於把位置轉換為可用的地點或站點參考。",
          "網站在線試查會產生短期服務日誌，用於排查問題、維持服務穩定和防止濫用。",
        ],
      },
      {
        title: "你的選擇與聯絡我們",
        paragraphs: [
          "App 內已保存的收藏路線、常用起點、目的地、通知監測設定和語音提醒設定以裝置本機保存為主，會保留至你在 App 內刪除、停止相關功能、清除 App 資料或卸載 App。",
          "如你啟用了 Android 系統備份或裝置轉移，App 本機資料可能會按你的系統設定由 Android 處理。BusIsComing 不建立伺服器端帳戶資料庫保存這些 App 內容。",
        ],
        bullets: [
          "在 App 內刪除已保存的收藏路線、常用起點或目的地。",
          "在系統設定撤回定位或通知權限，或停止通知監測和語音提醒。",
          "清除瀏覽器網站資料，以移除網站試查在瀏覽器內保存的狀態。",
          "如有私隱問題，請電郵 hezhenyu966@gmail.com 聯絡開發者。",
        ],
      },
    ],
  },
  "zh-Hans": {
    title: "BusIsComing 隐私政策",
    lead:
      "本政策适用于 BusIsComing Android App 及 busiscoming.com 官方网站，说明我们为城巴查询、网站试查、通知监测和语音提醒所需处理的资料。",
    lastUpdatedLabel: "最后更新",
    contactLabel: "联系邮箱",
    summaryLabel: "隐私摘要",
    summary: [
      "BusIsComing 不要求注册或登录，也不建立可识别个人身份的账号资料。",
      "我们不为广告追踪使用资料，也不出售资料。",
      "App 内收藏路线、常用起点和目的地以你的设备本机保存为主。",
      "城巴、DATA.GOV.HK 和 Google Geocoding API 只会在相关功能需要时使用。",
    ],
    sections: [
      {
        title: "适用范围",
        paragraphs: [
          "本隐私政策适用于 BusIsComing Android App、busiscoming.com 官方网站，以及未来可由 App 或 Google Play 指向的公开隐私政策页面。",
          "BusIsComing 的核心用途是香港城巴查询、常用路线管理和出门前到站时间参考。本页不代表新增完整出行规划或其他交通工具查询服务。",
        ],
      },
      {
        title: "我们不收集什么",
        paragraphs: [
          "BusIsComing 不设账号系统，不要求你注册或登录，也不建立姓名、电话、邮箱或其他可识别身份的账号资料。",
          "我们不为广告追踪收集资料，不出售资料，也不把你的查询内容用于建立广告受众。",
        ],
      },
      {
        title: "功能必需的信息如何处理",
        paragraphs: [
          "为完成城巴查询，App 或网站试查可能会处理你选择或输入的起点、目的地、路线、站点、查询条件和设备权限状态。这些资料用于返回路线、车费、步行距离和 ETA 等结果。",
          "App 内收藏路线、常用起点和目的地以设备本机保存为主。通知监测和语音提醒只围绕你选择的路线、站点或 ETA 提醒运作。",
        ],
      },
      {
        title: "第三方服务",
        paragraphs: [
          "BusIsComing 会按功能需要使用 Citybus 和 DATA.GOV.HK 的公开交通资料来源，以提供城巴路线、站点、车费或到站时间相关结果。",
          "当你使用当前位置或地址解析功能时，GPS 坐标或地址查询可能会发送给 Google Geocoding API，用于把位置转换为可用的地点或站点参考。",
          "网站在线试查会产生短期服务日志，用于排查问题、维持服务稳定和防止滥用。",
        ],
      },
      {
        title: "你的选择与联系我们",
        paragraphs: [
          "App 内已保存的收藏路线、常用起点、目的地、通知监测设置和语音提醒设置以设备本机保存为主，会保留至你在 App 内删除、停止相关功能、清除 App 数据或卸载 App。",
          "如你启用了 Android 系统备份或设备转移，App 本机数据可能会按你的系统设置由 Android 处理。BusIsComing 不建立服务器端账号资料库保存这些 App 内容。",
        ],
        bullets: [
          "在 App 内删除已保存的收藏路线、常用起点或目的地。",
          "在系统设置撤回定位或通知权限，或停止通知监测和语音提醒。",
          "清除浏览器网站数据，以移除网站试查在浏览器内保存的状态。",
          "如有隐私问题，请发送邮件至 hezhenyu966@gmail.com 联系开发者。",
        ],
      },
    ],
  },
  en: {
    title: "BusIsComing Privacy Policy",
    lead:
      "This policy applies to the BusIsComing Android app and the busiscoming.com website. It explains the information needed for Citybus lookup, the website trial, ETA monitoring, and speech reminders.",
    lastUpdatedLabel: "Last updated",
    contactLabel: "Contact",
    summaryLabel: "Privacy summary",
    summary: [
      "BusIsComing does not require sign-up or login, and does not create account profiles that identify you.",
      "We do not use data for ad tracking, and we do not sell data.",
      "Saved routes, frequent origins, and destinations in the app are primarily kept on your device.",
      "Citybus, DATA.GOV.HK, and Google Geocoding API are used only when the relevant feature needs them.",
    ],
    sections: [
      {
        title: "Scope",
        paragraphs: [
          "This privacy policy applies to the BusIsComing Android app, the busiscoming.com website, and the public policy page that may be linked from the app or Google Play.",
          "BusIsComing is for Hong Kong Citybus lookup, saved route management, and pre-departure ETA reference. This page does not add full trip planning or other transport lookup services.",
        ],
      },
      {
        title: "What we do not collect",
        paragraphs: [
          "BusIsComing does not provide an account system, does not ask you to sign up or log in, and does not create account records such as your name, phone number, email address, or other identity details.",
          "We do not collect data for ad tracking, do not sell data, and do not use your lookup activity to build advertising audiences.",
        ],
      },
      {
        title: "How feature-required information is handled",
        paragraphs: [
          "To complete Citybus lookup, the app or website trial may process the origin, destination, route, stop, query conditions, and device permission state you choose or enter. This information is used to return route, fare, walking distance, and ETA results.",
          "Saved routes, frequent origins, and destinations in the app are primarily stored on your device. Notification monitoring and speech reminders operate only around the routes, stops, or ETA reminders you choose.",
        ],
      },
      {
        title: "Third-party services",
        paragraphs: [
          "BusIsComing uses public transport data sources from Citybus and DATA.GOV.HK when needed to provide Citybus route, stop, fare, or ETA-related results.",
          "When you use current location or address lookup, GPS coordinates or address queries may be sent to Google Geocoding API to convert the location into a usable place or stop reference.",
          "The website trial may create short-term service logs for troubleshooting, service stability, and abuse prevention.",
        ],
      },
      {
        title: "Your choices and contact",
        paragraphs: [
          "Saved routes, frequent origins, destinations, notification monitoring settings, and speech reminder settings in the app are primarily stored on your device. They remain there until you delete them in the app, stop the related feature, clear app data, or uninstall the app.",
          "If Android system backup or device transfer is enabled, local app data may be handled according to your Android system settings. BusIsComing does not create a server-side account database to keep this app content.",
        ],
        bullets: [
          "Delete saved routes, frequent origins, or destinations in the app.",
          "Revoke location or notification permission in system settings, or stop notification monitoring and speech reminders.",
          "Clear browser website data to remove state stored by the website trial in your browser.",
          "For privacy questions, contact the developer at hezhenyu966@gmail.com.",
        ],
      },
    ],
  },
};

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtmlText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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
  if (pageGroup.pageId === "privacy") {
    html = injectPrivacyFallback(html, page);
  }

  return html;
}

function injectPrivacyFallback(html, page) {
  const fallback = privacyFallbackContent[page.htmlLang];
  if (!fallback) {
    throw new Error(`Missing privacy fallback for ${page.htmlLang}`);
  }
  const fallbackHtml = renderPrivacyFallback(fallback);
  const root = '    <div id="root"></div>';
  if (!html.includes(root)) {
    throw new Error("Missing React root element");
  }
  return html.replace(root, `${root}\n${fallbackHtml}`);
}

function renderPrivacyFallback(content) {
  const summaryItems = content.summary.map((item) => `        <li>${escapeHtmlText(item)}</li>`).join("\n");
  const sections = content.sections
    .map((section) => {
      const paragraphs = section.paragraphs.map((paragraph) => `        <p>${escapeHtmlText(paragraph)}</p>`).join("\n");
      const bullets = section.bullets?.length
        ? `\n        <ul>\n${section.bullets.map((bullet) => `          <li>${escapeHtmlText(bullet)}</li>`).join("\n")}\n        </ul>`
        : "";
      return `      <section>
        <h2>${escapeHtmlText(section.title)}</h2>
${paragraphs}${bullets}
      </section>`;
    })
    .join("\n");

  return `    <noscript>
      <main>
        <h1>${escapeHtmlText(content.title)}</h1>
        <p>${escapeHtmlText(content.lead)}</p>
        <dl>
          <dt>${escapeHtmlText(content.lastUpdatedLabel)}</dt>
          <dd>2026-06-30</dd>
          <dt>${escapeHtmlText(content.contactLabel)}</dt>
          <dd><a href="mailto:hezhenyu966@gmail.com">hezhenyu966@gmail.com</a></dd>
        </dl>
        <h2>${escapeHtmlText(content.summaryLabel)}</h2>
        <ul>
${summaryItems}
        </ul>
${sections}
      </main>
    </noscript>`;
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
