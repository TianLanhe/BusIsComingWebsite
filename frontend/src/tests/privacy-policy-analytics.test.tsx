import { privacyPolicyContent } from "../content/privacyPolicyContent";
import { describe, expect, it } from "vitest";

describe("website anonymous analytics privacy facts", () => {
  const serialized = JSON.stringify(privacyPolicyContent);

  it("states the anonymous identifier, PV/UV scope, one-year cookie and long-term detail retention in all languages", () => {
    for (const phrase of [
      "匿名訪客標識",
      "匿名访客标识",
      "anonymous visitor identifier",
      "PV",
      "UV",
      "一年",
      "one year",
      "長期保留",
      "长期保留",
      "retained long term",
    ]) {
      expect(serialized).toContain(phrase);
    }
  });

  it("states analytics is always enabled with no opt-out and that IP/query content are never recorded", () => {
    for (const phrase of [
      "始終啟用",
      "始终启用",
      "always enabled",
      "不提供退出",
      "does not provide an opt-out",
      "不記錄 IP",
      "不记录 IP",
      "does not record IP",
      "起點、目的地、座標或查詢內容",
      "起点、目的地、坐标或查询内容",
      "origins, destinations, coordinates, or query content",
    ]) {
      expect(serialized).toContain(phrase);
    }
  });

  it("does not claim analytics backups or deletion automation", () => {
    expect(serialized).toContain("不設統計資料備份或自動刪除流程");
    expect(serialized).toContain("不设统计数据备份或自动删除流程");
    expect(serialized).toContain("no analytics backup or automatic deletion process");
  });
});
