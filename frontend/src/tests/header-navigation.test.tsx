import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../components/i18n/I18nProvider";
import { Header } from "../components/sections/Header";

describe("homepage Header", () => {
  it("keeps all primary destinations and the language disclosure in the DOM", () => {
    window.history.replaceState({}, "", "/zh-hant/");
    render(<I18nProvider><Header /></I18nProvider>);
    expect(screen.getByRole("link", { name: "功能" })).toHaveAttribute("href", "#features");
    expect(screen.getByRole("link", { name: "常見問題" })).toHaveAttribute("href", "#faq");
    expect(screen.getByRole("link", { name: "聯絡我們" })).toHaveAttribute("href", "#contact");
    const trigger = screen.getByRole("button", { name: "選擇語言" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(trigger).toHaveFocus();
  });

  it("keeps privacy navigation localized while hiding its language switcher", () => {
    window.history.replaceState({}, "", "/en/privacy/");
    render(<I18nProvider><Header pageId="privacy" hideLanguageSwitcher /></I18nProvider>);
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "/en/#features");
    expect(screen.queryByRole("button", { name: "Choose language" })).toBeNull();
  });
});
