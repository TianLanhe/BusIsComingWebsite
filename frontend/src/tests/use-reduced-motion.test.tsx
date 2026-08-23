import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "../hooks/useReducedMotion";

function installMatchMedia(initial = false) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const media = {
    get matches() { return matches; },
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: () => void) => listeners.delete(listener)),
    dispatch(next: boolean) {
      matches = next;
      listeners.forEach((listener) => listener());
    },
  };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  return media;
}

afterEach(() => vi.unstubAllGlobals());

describe("useReducedMotion", () => {
  it("subscribes to the media query and reacts to preference changes", () => {
    const media = installMatchMedia(false);
    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => media.dispatch(true));
    expect(result.current).toBe(true);
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("uses the initial reduced value", () => {
    installMatchMedia(true);
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true);
  });
});
