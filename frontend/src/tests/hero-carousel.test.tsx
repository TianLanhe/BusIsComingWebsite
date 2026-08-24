import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { HeroStoryRail } from "../components/hero/HeroStoryRail";
import { HeroStoryStage, stageSlotFor } from "../components/hero/HeroStoryStage";
import { I18nProvider } from "../components/i18n/I18nProvider";
import { homepageStories } from "../content/homepageStories";
import type { HeroStoryId } from "../content/types";

function StoryHarness() {
  const [active, setActive] = useState<HeroStoryId>("route-search");
  return (
    <I18nProvider>
      <HeroStoryStage
        stories={homepageStories}
        requestedStoryId={active}
        settledStoryId={active}
        transitionEpoch={0}
        onSettled={() => undefined}
      />
      <HeroStoryRail stories={homepageStories} activeStoryId={active} onSelect={setActive} />
    </I18nProvider>
  );
}

describe("five-story hero stage", () => {
  it("keeps all five screenshots mounted in deterministic circular slots", () => {
    window.history.replaceState({}, "", "/en/");
    render(<StoryHarness />);
    const stage = screen.getByTestId("hero-story-stage");
    expect(stage.querySelectorAll("figure")).toHaveLength(5);
    expect(stageSlotFor(homepageStories, "route-search", "route-search")).toBe("front");
    expect(stageSlotFor(homepageStories, "saved-journeys", "route-search")).toBe("near-right");
    expect(stageSlotFor(homepageStories, "predeparture-monitor", "route-search")).toBe("near-left");
    expect(stage.querySelector('[data-story-id="route-search"]')).toHaveAttribute("data-slot", "front");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("switches when a story button is selected", () => {
    window.history.replaceState({}, "", "/en/");
    render(<StoryHarness />);
    const saved = screen.getByRole("button", { name: /02.*Trips/ });
    fireEvent.click(saved);
    expect(saved).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("hero-story-stage").querySelector('[data-story-id="saved-journeys"]')).toHaveAttribute("data-slot", "front");
  });

  it("supports Arrow, Home, and End navigation with a roving tab stop", () => {
    window.history.replaceState({}, "", "/en/");
    render(<StoryHarness />);
    const first = screen.getByRole("button", { name: /01.*Search/ });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    const second = screen.getByRole("button", { name: /02.*Trips/ });
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(second, { key: "End" });
    expect(screen.getByRole("button", { name: /05.*Leave/ })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("button", { name: /05.*Leave/ }), { key: "Home" });
    expect(first).toHaveFocus();
  });
});
