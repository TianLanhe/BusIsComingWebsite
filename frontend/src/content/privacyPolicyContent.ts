import type { PrivacyPolicyContent } from "./types";

export const privacyPolicyContent: PrivacyPolicyContent = {
  metadata: {
    version: "2026-06-30.privacy-policy-pages",
    lastUpdated: "2026-06-30",
    contactEmail: "hezhenyu966@gmail.com",
    appliesTo: ["website", "android-app"],
  },
  hero: {
    eyebrow: {
      "zh-Hant": "私隱政策",
      "zh-Hans": "隐私政策",
      en: "Privacy Policy",
    },
    title: {
      "zh-Hant": "BusIsComing 私隱政策",
      "zh-Hans": "BusIsComing 隐私政策",
      en: "BusIsComing Privacy Policy",
    },
    lead: {
      "zh-Hant":
        "本政策適用於 BusIsComing Android App 及 busiscoming.com 官方網站，說明我們為城巴查詢、網站試查、通知監測和語音提醒所需處理的資料。",
      "zh-Hans":
        "本政策适用于 BusIsComing Android App 及 busiscoming.com 官方网站，说明我们为城巴查询、网站试查、通知监测和语音提醒所需处理的资料。",
      en: "This policy applies to the BusIsComing Android app and the busiscoming.com website. It explains the information needed for Citybus lookup, the website trial, ETA monitoring, and speech reminders.",
    },
  },
  summaryCards: [
    {
      id: "no-account-identity",
      order: 1,
      title: {
        "zh-Hant": "不建立帳戶身份",
        "zh-Hans": "不建立账号身份",
        en: "No account identity",
      },
      description: {
        "zh-Hant": "BusIsComing 不要求註冊或登入，也不建立可識別個人身份的帳戶資料。",
        "zh-Hans": "BusIsComing 不要求注册或登录，也不建立可识别个人身份的账号资料。",
        en: "BusIsComing does not require sign-up or login, and does not create account profiles that identify you.",
      },
    },
    {
      id: "no-ads-sale",
      order: 2,
      title: {
        "zh-Hant": "不做廣告追蹤",
        "zh-Hans": "不做广告追踪",
        en: "No ad tracking or sale",
      },
      description: {
        "zh-Hant": "我們不為廣告追蹤使用資料，也不出售資料。",
        "zh-Hans": "我们不为广告追踪使用资料，也不出售资料。",
        en: "We do not use data for ad tracking, and we do not sell data.",
      },
    },
    {
      id: "device-first-saved-routes",
      order: 3,
      title: {
        "zh-Hant": "常用路線以本機保存",
        "zh-Hans": "常用路线以本机保存",
        en: "Saved routes stay on device",
      },
      description: {
        "zh-Hant": "App 內收藏路線、常用起點和目的地以你的裝置本機保存為主。",
        "zh-Hans": "App 内收藏路线、常用起点和目的地以你的设备本机保存为主。",
        en: "Saved routes, frequent origins, and destinations in the app are primarily kept on your device.",
      },
    },
    {
      id: "external-services-as-needed",
      order: 4,
      title: {
        "zh-Hant": "只按功能需要連接服務",
        "zh-Hans": "只按功能需要连接服务",
        en: "External services only as needed",
      },
      description: {
        "zh-Hant": "城巴、DATA.GOV.HK 和 Google Geocoding API 只會在相關功能需要時使用。",
        "zh-Hans": "城巴、DATA.GOV.HK 和 Google Geocoding API 只会在相关功能需要时使用。",
        en: "Citybus, DATA.GOV.HK, and Google Geocoding API are used only when the relevant feature needs them.",
      },
    },
  ],
  sections: [
    {
      id: "scope",
      order: 1,
      title: {
        "zh-Hant": "適用範圍",
        "zh-Hans": "适用范围",
        en: "Scope",
      },
      paragraphs: [
        {
          "zh-Hant":
            "本私隱政策適用於 BusIsComing Android App、busiscoming.com 官方網站，以及未來可由 App 或 Google Play 指向的公開私隱政策頁面。",
          "zh-Hans":
            "本隐私政策适用于 BusIsComing Android App、busiscoming.com 官方网站，以及未来可由 App 或 Google Play 指向的公开隐私政策页面。",
          en: "This privacy policy applies to the BusIsComing Android app, the busiscoming.com website, and the public policy page that may be linked from the app or Google Play.",
        },
        {
          "zh-Hant":
            "BusIsComing 的核心用途是香港城巴查詢、常用路線管理和出門前抵站時間參考。本頁不代表新增完整出行規劃或其他交通工具查詢服務。",
          "zh-Hans":
            "BusIsComing 的核心用途是香港城巴查询、常用路线管理和出门前到站时间参考。本页不代表新增完整出行规划或其他交通工具查询服务。",
          en: "BusIsComing is for Hong Kong Citybus lookup, saved route management, and pre-departure ETA reference. This page does not add full trip planning or other transport lookup services.",
        },
      ],
      requiredFacts: ["website", "android-app"],
    },
    {
      id: "what-we-do-not-collect",
      order: 2,
      title: {
        "zh-Hant": "我們不收集甚麼",
        "zh-Hans": "我们不收集什么",
        en: "What we do not collect",
      },
      paragraphs: [
        {
          "zh-Hant":
            "BusIsComing 不設帳戶系統，不要求你註冊或登入，也不建立姓名、電話、電郵或其他可識別身份的帳戶資料。",
          "zh-Hans":
            "BusIsComing 不设账号系统，不要求你注册或登录，也不建立姓名、电话、邮箱或其他可识别身份的账号资料。",
          en: "BusIsComing does not provide an account system, does not ask you to sign up or log in, and does not create account records such as your name, phone number, email address, or other identity details.",
        },
        {
          "zh-Hant": "我們不為廣告追蹤收集資料，不出售資料，也不把你的查詢內容用作建立廣告受眾。",
          "zh-Hans": "我们不为广告追踪收集资料，不出售资料，也不把你的查询内容用于建立广告受众。",
          en: "We do not collect data for ad tracking, do not sell data, and do not use your lookup activity to build advertising audiences.",
        },
      ],
      requiredFacts: ["no-account", "no-ad-tracking", "no-sale"],
    },
    {
      id: "functional-processing",
      order: 3,
      title: {
        "zh-Hant": "功能必需的資料如何處理",
        "zh-Hans": "功能必需的信息如何处理",
        en: "How feature-required information is handled",
      },
      paragraphs: [
        {
          "zh-Hant":
            "為完成城巴查詢，App 或網站試查可能會處理你選擇或輸入的起點、目的地、路線、站點、查詢條件和裝置權限狀態。這些資料用於返回路線、車費、步行距離和 ETA 等結果。",
          "zh-Hans":
            "为完成城巴查询，App 或网站试查可能会处理你选择或输入的起点、目的地、路线、站点、查询条件和设备权限状态。这些资料用于返回路线、车费、步行距离和 ETA 等结果。",
          en: "To complete Citybus lookup, the app or website trial may process the origin, destination, route, stop, query conditions, and device permission state you choose or enter. This information is used to return route, fare, walking distance, and ETA results.",
        },
        {
          "zh-Hant":
            "App 內收藏路線、常用起點和目的地以裝置本機保存為主。通知監測和語音提醒只圍繞你選擇的路線、站點或 ETA 提醒運作。",
          "zh-Hans":
            "App 内收藏路线、常用起点和目的地以设备本机保存为主。通知监测和语音提醒只围绕你选择的路线、站点或 ETA 提醒运作。",
          en: "Saved routes, frequent origins, and destinations in the app are primarily stored on your device. Notification monitoring and speech reminders operate only around the routes, stops, or ETA reminders you choose.",
        },
      ],
      requiredFacts: ["route-query-data", "device-local-saved-routes", "notification-monitoring", "speech-reminders"],
    },
    {
      id: "third-party-services",
      order: 4,
      title: {
        "zh-Hant": "第三方服務",
        "zh-Hans": "第三方服务",
        en: "Third-party services",
      },
      paragraphs: [
        {
          "zh-Hant":
            "BusIsComing 會按功能需要使用 Citybus 和 DATA.GOV.HK 的公開交通資料來源，以提供城巴路線、站點、車費或抵站時間相關結果。",
          "zh-Hans":
            "BusIsComing 会按功能需要使用 Citybus 和 DATA.GOV.HK 的公开交通资料来源，以提供城巴路线、站点、车费或到站时间相关结果。",
          en: "BusIsComing uses public transport data sources from Citybus and DATA.GOV.HK when needed to provide Citybus route, stop, fare, or ETA-related results.",
        },
        {
          "zh-Hant":
            "當你使用目前位置或地址解析功能時，GPS 坐標或地址查詢可能會發送給 Google Geocoding API，用於把位置轉換為可用的地點或站點參考。",
          "zh-Hans":
            "当你使用当前位置或地址解析功能时，GPS 坐标或地址查询可能会发送给 Google Geocoding API，用于把位置转换为可用的地点或站点参考。",
          en: "When you use current location or address lookup, GPS coordinates or address queries may be sent to Google Geocoding API to convert the location into a usable place or stop reference.",
        },
        {
          "zh-Hant":
            "網站在線試查會產生短期服務日誌，用於排查問題、維持服務穩定和防止濫用。",
          "zh-Hans":
            "网站在线试查会产生短期服务日志，用于排查问题、维持服务稳定和防止滥用。",
          en: "The website trial may create short-term service logs for troubleshooting, service stability, and abuse prevention.",
        },
      ],
      requiredFacts: ["citybus", "data-gov-hk", "google-geocoding-api", "gps-coordinate", "short-term-service-logs"],
    },
    {
      id: "your-choices",
      order: 5,
      title: {
        "zh-Hant": "你的選擇與聯絡我們",
        "zh-Hans": "你的选择与联系我们",
        en: "Your choices and contact",
      },
      paragraphs: [
        {
          "zh-Hant": "你可以透過以下方式管理與 BusIsComing 相關的資料或偏好。",
          "zh-Hans": "你可以通过以下方式管理与 BusIsComing 相关的资料或偏好。",
          en: "You can manage information or preferences related to BusIsComing in the following ways.",
        },
        {
          "zh-Hant":
            "App 內已保存的收藏路線、常用起點、目的地、通知監測設定和語音提醒設定以裝置本機保存為主，會保留至你在 App 內刪除、停止相關功能、清除 App 資料或卸載 App。",
          "zh-Hans":
            "App 内已保存的收藏路线、常用起点、目的地、通知监测设置和语音提醒设置以设备本机保存为主，会保留至你在 App 内删除、停止相关功能、清除 App 数据或卸载 App。",
          en: "Saved routes, frequent origins, destinations, notification monitoring settings, and speech reminder settings in the app are primarily stored on your device. They remain there until you delete them in the app, stop the related feature, clear app data, or uninstall the app.",
        },
        {
          "zh-Hant":
            "如你啟用了 Android 系統備份或裝置轉移，App 本機資料可能會按你的系統設定由 Android 處理。BusIsComing 不建立伺服器端帳戶資料庫保存這些 App 內容。",
          "zh-Hans":
            "如你启用了 Android 系统备份或设备转移，App 本机数据可能会按你的系统设置由 Android 处理。BusIsComing 不建立服务器端账号资料库保存这些 App 内容。",
          en: "If Android system backup or device transfer is enabled, local app data may be handled according to your Android system settings. BusIsComing does not create a server-side account database to keep this app content.",
        },
      ],
      bullets: [
        {
          "zh-Hant": "在 App 內刪除已保存的收藏路線、常用起點或目的地。",
          "zh-Hans": "在 App 内删除已保存的收藏路线、常用起点或目的地。",
          en: "Delete saved routes, frequent origins, or destinations in the app.",
        },
        {
          "zh-Hant": "在系統設定撤回定位或通知權限，或停止通知監測和語音提醒。",
          "zh-Hans": "在系统设置撤回定位或通知权限，或停止通知监测和语音提醒。",
          en: "Revoke location or notification permission in system settings, or stop notification monitoring and speech reminders.",
        },
        {
          "zh-Hant": "清除瀏覽器網站資料，以移除網站試查在瀏覽器內保存的狀態。",
          "zh-Hans": "清除浏览器网站数据，以移除网站试查在浏览器内保存的状态。",
          en: "Clear browser website data to remove state stored by the website trial in your browser.",
        },
        {
          "zh-Hant": "如有私隱問題，請電郵 hezhenyu966@gmail.com 聯絡開發者。",
          "zh-Hans": "如有隐私问题，请发送邮件至 hezhenyu966@gmail.com 联系开发者。",
          en: "For privacy questions, contact the developer at hezhenyu966@gmail.com.",
        },
      ],
      requiredFacts: ["user-controls", "app-local-retention", "android-system-backup", "contact-email"],
    },
  ],
};
