import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../app/App";
import { privacyPolicyContent } from "../content/privacyPolicyContent";
import { renderWithI18n } from "./test-utils";

describe("privacy policy page", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    window.localStorage?.clear();
  });

  it("renders the Traditional Chinese privacy page without a language switcher", () => {
    renderWithI18n(<App />, { pathname: "/zh-hant/privacy/" });

    expect(screen.getByRole("heading", { level: 1, name: "BusIsComing 私隱政策" })).toBeInTheDocument();
    expect(screen.getByText("2026-06-30")).toBeInTheDocument();
    expect(screen.getAllByText("hezhenyu966@gmail.com")).toHaveLength(2);
    expect(screen.queryByTitle("English")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "功能介紹" })).toHaveAttribute("href", "/zh-hant/#features");
    expect(screen.getByRole("link", { name: "網上試查" })).toHaveAttribute("href", "/zh-hant/#online-query");
    expect(screen.getByRole("link", { name: "私隱政策" })).toHaveAttribute("href", "/zh-hant/privacy/");
  });

  it("renders English summary cards and required body facts", () => {
    renderWithI18n(<App />, { pathname: "/en/privacy/" });

    expect(screen.getByRole("heading", { level: 1, name: "BusIsComing Privacy Policy" })).toBeInTheDocument();
    for (const card of privacyPolicyContent.summaryCards) {
      expect(screen.getByRole("heading", { level: 2, name: card.title.en })).toBeInTheDocument();
    }
    expect(screen.getByText(/Android app and the busiscoming.com website/)).toBeInTheDocument();
    expect(screen.getByText(/Citybus and DATA.GOV.HK/)).toBeInTheDocument();
    expect(screen.getAllByText(/Google Geocoding API/).length).toBeGreaterThan(0);
    expect(screen.getByText(/GPS coordinates/)).toBeInTheDocument();
    expect(screen.getByText(/Notification monitoring and speech reminders/)).toBeInTheDocument();
    expect(screen.getByText(/short-term service logs/)).toBeInTheDocument();
  });

  it("keeps the body to four summary cards and five policy sections", () => {
    renderWithI18n(<App />, { pathname: "/zh-hans/privacy/" });

    const summary = screen.getByLabelText("隐私摘要");
    expect(within(summary).getAllByRole("heading", { level: 2 })).toHaveLength(4);
    expect(screen.getByRole("heading", { level: 2, name: "适用范围" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "我们不收集什么" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "功能必需的信息如何处理" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "第三方服务" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "你的选择与联系我们" })).toBeInTheDocument();
  });
});
