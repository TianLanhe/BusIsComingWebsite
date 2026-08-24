import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppBrand } from "../components/brand/AppBrand";
import { I18nProvider } from "../components/i18n/I18nProvider";
import { InlineLanguageLinks } from "../components/i18n/InlineLanguageLinks";

describe("lightweight homepage chrome", () => {
  it("uses the real app logo and exposes all language destinations directly", () => {
    window.history.replaceState({}, "", "/zh-hant/#features");
    render(<I18nProvider><AppBrand /><InlineLanguageLinks /></I18nProvider>);
    expect(screen.getByRole("img", { name: "BusIsComing" })).toHaveAttribute("src", expect.stringContaining("busiscoming-icon"));
    expect(screen.getByRole("link", { name: "繁" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "简" })).toHaveAttribute("href", "/zh-hans/#features");
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute("href", "/en/#features");
    expect(screen.queryByRole("button", { name: /語言|语言|language/i })).toBeNull();
  });

  it("changes locale without reloading the page", () => {
    window.history.replaceState({}, "", "/en/");
    render(<I18nProvider><InlineLanguageLinks /></I18nProvider>);
    fireEvent.click(screen.getByRole("link", { name: "简" }));
    expect(window.location.pathname).toBe("/zh-hans/");
    expect(screen.getByRole("link", { name: "简" })).toHaveAttribute("aria-current", "page");
  });
});
