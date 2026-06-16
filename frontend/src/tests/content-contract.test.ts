import { describe, expect, it } from "vitest";
import { onlineQueryDemo } from "../content/onlineQueryDemo";
import { faq, scopeExclusions } from "../content/sectionsContent";

describe("online query content contract", () => {
  it("describes the website query as a basic Hong Kong bus trial, not a static demo", () => {
    expect(onlineQueryDemo.limitationNotice.en).toContain("basic Hong Kong bus route trial");
    expect(onlineQueryDemo.scopeNotice.en).toContain("Hong Kong bus route trial only");
    expect(onlineQueryDemo.scopeNotice.en).toContain("MTR");
    expect(onlineQueryDemo.scopeNotice.en).toContain("ferry");
    expect(JSON.stringify(onlineQueryDemo).toLowerCase()).not.toContain("static demo");
  });

  it("keeps FAQ and scope exclusions aligned with the route-query boundary", () => {
    const onlineQueryFaq = faq.find((item) => item.id === "online-query-limit");
    expect(onlineQueryFaq?.answer.en).toContain("basic Hong Kong bus route trial");
    expect(onlineQueryFaq?.answer.en).toContain("Download the app");
    expect(onlineQueryFaq?.answer.en.toLowerCase()).not.toContain("static demo");
    expect(scopeExclusions.map((item) => item.en).join(" ")).toContain("MTR");
  });
});
