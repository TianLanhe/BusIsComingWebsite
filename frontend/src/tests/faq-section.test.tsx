import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../components/i18n/I18nProvider";
import { FaqSection } from "../components/sections/FaqSection";

describe("FaqSection", () => {
  it("defaults to installation and keeps at most one controlled panel open", () => {
    window.history.replaceState({}, "", "/en/");
    render(<I18nProvider><FaqSection /></I18nProvider>);
    const installation = screen.getByRole("button", { name: /How do I install/ });
    const coverage = screen.getByRole("button", { name: /Which bus data/ });
    expect(installation).toHaveAttribute("aria-expanded", "true");
    expect(coverage).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(coverage);
    expect(installation).toHaveAttribute("aria-expanded", "false");
    expect(coverage).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button").filter((button) => button.getAttribute("aria-expanded") === "true")).toHaveLength(1);
    expect(document.getElementById("faq-panel-android-install")).toHaveAttribute("aria-hidden", "true");
  });
});
