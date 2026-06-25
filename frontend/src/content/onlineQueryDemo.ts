import type { OnlineQueryDemo } from "./types";

export const onlineQueryDemo: OnlineQueryDemo = {
  title: {
    "zh-Hant": "網上試查",
    "zh-Hans": "在线查询",
    en: "Online Query",
  },
  description: {
    "zh-Hant": "輸入起點和目的地，從候選地點中選擇後，即可試查城巴路線。",
    "zh-Hans": "输入起点和终点，从候选地点中选择后，即可试用城巴路线查询。",
    en: "Enter an origin and destination, choose places from the candidate list, and try Citybus route search.",
  },
  limitationNotice: {
    "zh-Hant": "網頁提供基礎城巴路線試查；儲存路線、監測和更多詳情請下載 App 使用。",
    "zh-Hans": "网页提供基础城巴路线试用；保存路线、监控和更多详情请下载 App 使用。",
    en: "The website offers a basic Citybus route trial. Download the app for saved routes, monitoring, and more detail.",
  },
  initialEmptyTitle: {
    "zh-Hant": "選擇起點和目的地後開始查詢",
    "zh-Hans": "选择起点和终点后开始查询",
    en: "Choose an origin and destination to search",
  },
  initialEmptyDescription: {
    "zh-Hant": "必須從服務端返回的候選地點中選擇，不能直接用自由文字查詢。",
    "zh-Hans": "必须从服务端返回的候选地点中选择，不能直接用自由文字查询。",
    en: "Select from server-provided place candidates; free-text route search is not supported.",
  },
  noRoutesTitle: {
    "zh-Hant": "暫未找到可用城巴路線",
    "zh-Hans": "暂未找到可用巴士路线",
    en: "No bus routes found",
  },
  noRoutesDescription: {
    "zh-Hant": "請嘗試附近地點，或調整起點和終點後重新查詢。",
    "zh-Hans": "请尝试附近地点，或调整起点和终点后重新查询。",
    en: "Try a nearby place, or adjust the origin and destination before searching again.",
  },
  scopeNotice: {
    "zh-Hant": "僅限城巴 / Citybus 路線試查，不提供九巴、港鐵、鐵路、渡輪或完整出行規劃。",
    "zh-Hans": "仅限城巴 / Citybus 路线试用，不提供九巴、港铁、铁路、渡轮或完整出行规划。",
    en: "Citybus route trial only. KMB, MTR, rail, ferry, and full trip planning are outside this website.",
  },
};
