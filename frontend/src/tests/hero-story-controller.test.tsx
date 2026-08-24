import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHeroStoryController } from "../hooks/useHeroStoryController";
import type { HeroStoryId } from "../content/types";

const storyIds: HeroStoryId[] = [
  "route-search",
  "saved-journeys",
  "journey-guidance",
  "cross-operator-arrivals",
  "predeparture-monitor",
];

describe("hero story dwell controller", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("waits 10 seconds initially, then five seconds after each automatic settled transition", () => {
    const { result } = renderHook(() => useHeroStoryController({ storyIds, locale: "zh-Hant" }));
    act(() => vi.advanceTimersByTime(9_999));
    expect(result.current.requestedStoryId).toBe("route-search");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.requestedStoryId).toBe("saved-journeys");
    const epoch = result.current.transitionEpoch;
    act(() => result.current.markSettled("saved-journeys", epoch));
    act(() => vi.advanceTimersByTime(4_999));
    expect(result.current.requestedStoryId).toBe("saved-journeys");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.requestedStoryId).toBe("journey-guidance");
  });

  it("restarts a ten-second reading dwell after a manual choice and wraps 05 to 01", () => {
    const { result } = renderHook(() => useHeroStoryController({ storyIds, locale: "zh-Hant" }));
    act(() => result.current.selectStory("predeparture-monitor", "manual"));
    act(() => result.current.markSettled("predeparture-monitor", result.current.transitionEpoch));
    act(() => vi.advanceTimersByTime(9_999));
    expect(result.current.requestedStoryId).toBe("predeparture-monitor");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.requestedStoryId).toBe("route-search");
  });

  it("restarts the reading dwell without replaying the transition when the current story is selected", () => {
    const { result } = renderHook(() => useHeroStoryController({ storyIds, locale: "zh-Hant" }));
    const initialEpoch = result.current.transitionEpoch;
    act(() => vi.advanceTimersByTime(8_000));
    act(() => result.current.selectStory("route-search", "manual"));
    expect(result.current.transitionEpoch).toBe(initialEpoch);
    act(() => vi.advanceTimersByTime(9_999));
    expect(result.current.requestedStoryId).toBe("route-search");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.requestedStoryId).toBe("saved-journeys");
  });

  it("keeps multiple pause reasons independent and resumes with a fresh ten-second dwell", () => {
    const { result } = renderHook(() => useHeroStoryController({ storyIds, locale: "en" }));
    act(() => {
      result.current.setPauseReason("hover", true);
      result.current.setPauseReason("hidden", true);
    });
    act(() => vi.advanceTimersByTime(20_000));
    expect(result.current.requestedStoryId).toBe("route-search");
    act(() => result.current.setPauseReason("hover", false));
    act(() => vi.advanceTimersByTime(20_000));
    expect(result.current.requestedStoryId).toBe("route-search");
    act(() => result.current.setPauseReason("hidden", false));
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.requestedStoryId).toBe("saved-journeys");
  });

  it("rejects stale settled callbacks from an older epoch", () => {
    const { result } = renderHook(() => useHeroStoryController({ storyIds, locale: "zh-Hant" }));
    act(() => result.current.selectStory("saved-journeys", "manual"));
    const staleEpoch = result.current.transitionEpoch;
    act(() => result.current.selectStory("journey-guidance", "manual"));
    act(() => result.current.markSettled("saved-journeys", staleEpoch));
    expect(result.current.settledStoryId).toBe("route-search");
    act(() => result.current.markSettled("journey-guidance", result.current.transitionEpoch));
    expect(result.current.settledStoryId).toBe("journey-guidance");
  });
});
